"""Meta/WRI canopy height v2 (~1.19 m, CC BY 4.0) -> per-li and per-pit canopy fractions for Taipei.
Run: .venv/bin/python -I -W ignore data/make_canopy.py   (reads windows over HTTP; no full tile download)
Canopy = height >= 3 m. Fractions are computed at native ~1.19 m; the saved clip is 2x downsampled (max-free: nearest).
"""
import os, csv, json
os.environ.update(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif")
import numpy as np, rasterio
from rasterio.windows import from_bounds
from rasterio.features import rasterize
from rasterio.transform import from_origin
from pyproj import Transformer
import geopandas as gpd
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = lambda *p: os.path.join(ROOT, *p)
BBOX = (121.45, 24.96, 121.67, 25.21); H = 3
BASE = "/vsicurl/https://data.source.coop/tge-labs/meta-chm-v2/chm/%s.tif"
TILES = ["1321231203", "1321231212", "1321231221", "1321231230"]
t = Transformer.from_crs(4326, 3857, always_xy=True)
x0, y0 = t.transform(BBOX[0], BBOX[1]); x1, y1 = t.transform(BBOX[2], BBOX[3])

res = 1.1943285669558463
W, Hh = int(np.ceil((x1 - x0) / res)), int(np.ceil((y1 - y0) / res))
mosaic = np.zeros((Hh, W), np.uint8)
tr = from_origin(x0, y0 + Hh * res, res, res)
for q in TILES:
    with rasterio.open(BASE % q) as d:
        b = d.bounds
        ix0, ix1, iy0, iy1 = max(x0, b.left), min(x0 + W * res, b.right), max(y0, b.bottom), min(y0 + Hh * res, b.top)
        if ix0 >= ix1 or iy0 >= iy1: continue
        win = from_bounds(ix0, iy0, ix1, iy1, d.transform).round_offsets().round_lengths()
        a = d.read(1, window=win)
        c = int(round((ix0 - x0) / res)); r = int(round((y0 + Hh * res - iy1) / res))
        mosaic[r:r + a.shape[0], c:c + a.shape[1]] = a[:Hh - r, :W - c]
        print(q, "read", a.shape, flush=True)
canopy = mosaic >= H
print("mosaic", mosaic.shape, "canopy frac %.3f" % canopy.mean(), "zero px %.3f" % (mosaic == 0).mean())

# clip at 2x downsample
os.makedirs(D("data/derived"), exist_ok=True)
out = D("data/derived/canopy_meta_taipei.tif")
sub = mosaic[::2, ::2]
with rasterio.open(out, "w", driver="GTiff", height=sub.shape[0], width=sub.shape[1], count=1, dtype="uint8",
                   crs="EPSG:3857", transform=from_origin(x0, y0 + Hh * res, res * 2, res * 2), compress="deflate", tiled=True) as o:
    o.write(sub, 1)
print("clip MB", os.path.getsize(out) / 1e6)

# per li
v = gpd.read_file(D("data/raw/taipei_villages.geojson")).to_crs(3857)
ids = {c: i + 1 for i, c in enumerate(v.VILLCODE)}
lab = rasterize(((g, ids[c]) for g, c in zip(v.geometry, v.VILLCODE)), out_shape=mosaic.shape, transform=tr, dtype="int32")
n = np.bincount(lab.ravel(), minlength=len(v) + 1)
k = np.bincount(lab.ravel(), weights=canopy.ravel(), minlength=len(v) + 1)
meta = k[1:] / np.maximum(n[1:], 1)

# worldcover class 10
with rasterio.open(D("data/raw/worldcover_2021_N24E120_tile.tif")) as w:
    win = from_bounds(*BBOX, w.transform).round_offsets().round_lengths()
    wa = w.read(1, window=win); wt = w.window_transform(win)
v4 = v.to_crs(4326)
lab2 = rasterize(((g, ids[c]) for g, c in zip(v4.geometry, v4.VILLCODE)), out_shape=wa.shape, transform=wt, dtype="int32")
n2 = np.bincount(lab2.ravel(), minlength=len(v) + 1); k2 = np.bincount(lab2.ravel(), weights=(wa == 10).ravel(), minlength=len(v) + 1)
wc = k2[1:] / np.maximum(n2[1:], 1)
df = pd.DataFrame({"VILLCODE": v.VILLCODE, "canopy_meta": meta.round(4), "canopy_worldcover": wc.round(4)})
df.to_csv(D("data/derived/li_canopy_meta.csv"), index=False)

# per pit, 15 m radius (ground metres; mercator scale 1/cos(lat))
p = pd.read_csv(D("data/derived/empty_pits.csv"))
px, py = t.transform(p.lon.values, p.lat.values)
sc = 1 / np.cos(np.radians(p.lat.values)); R = 15
vals = []
for X, Y, s in zip(px, py, sc):
    rad = R * s / res
    cx = (X - x0) / res; cy = (y0 + Hh * res - Y) / res
    r0, r1, c0, c1 = int(cy - rad - 1), int(cy + rad + 2), int(cx - rad - 1), int(cx + rad + 2)
    r0, c0 = max(r0, 0), max(c0, 0)
    sl = canopy[r0:r1, c0:c1]
    if sl.size == 0: vals.append(np.nan); continue
    yy, xx = np.ogrid[r0:r0 + sl.shape[0], c0:c0 + sl.shape[1]]
    m = (yy + .5 - cy) ** 2 + (xx + .5 - cx) ** 2 <= rad ** 2
    vals.append(sl[m].mean() if m.any() else np.nan)
pd.DataFrame({"pit_id": p.pit_id, "canopy_15m": np.round(vals, 4)}).to_csv(D("data/derived/pit_canopy.csv"), index=False)

# instrument check
names = v[["VILLCODE", "TOWNNAME", "VILLNAME"]].merge(df, on="VILLCODE")
print("corr pearson %.3f spearman %.3f" % (names.canopy_meta.corr(names.canopy_worldcover), names.canopy_meta.rank().corr(names.canopy_worldcover.rank())))
print("meta range %.3f-%.3f median %.3f; wc range %.3f-%.3f median %.3f" % (meta.min(), meta.max(), np.median(meta), wc.min(), wc.max(), np.median(wc)))
pd.set_option("display.width", 200)
print(names.sort_values("canopy_meta").head(10).to_string()); print(names.sort_values("canopy_meta").tail(10).to_string())
names["diff"] = names.canopy_meta - names.canopy_worldcover
print("meta >> wc"); print(names.sort_values("diff").tail(8).to_string()); print("wc >> meta"); print(names.sort_values("diff").head(8).to_string())
print(names.groupby("TOWNNAME").canopy_meta.mean().sort_values().round(3).to_string())
print(names[names.VILLNAME.str.contains("")].query("TOWNNAME=='大安區'").sort_values("canopy_meta").tail(6).to_string())
pc = pd.read_csv(D("data/derived/pit_canopy.csv")).canopy_15m
print("pits", len(pc), "nan", pc.isna().sum(), pc.describe().round(3).to_dict())
