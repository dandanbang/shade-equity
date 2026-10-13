"""Summer (Jun-Sep 2023-2025) Landsat 8/9 C2 L2 surface temperature, per-pixel median -> per-里 mean.
Source: Microsoft Planetary Computer STAC, collection landsat-c2-l2, asset lwir11 (= ST_B10), qa_pixel.
Outputs: data/derived/lst_summer_median.tif (EPSG:32651, 30 m, deg C, NaN outside Taipei), data/derived/li_heat.csv"""
import os, numpy as np, geopandas as gpd, pandas as pd, rasterio
from rasterio.features import rasterize
from rasterio.transform import from_origin
from rasterio.warp import reproject, Resampling
import pystac_client, planetary_computer as pc
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
BBOX = [121.45, 24.96, 121.67, 25.21]
MAX_SCENE_CLOUD = 40      # scene-level prefilter; pixel QA does the real masking
MIN_VALID_FRAC = 0.5      # scene must have >=50% clear pixels over Taipei land to count
CRS = "EPSG:32651"
v = gpd.read_file("data/raw/taipei_villages.geojson").to_crs(CRS)
x0, y0, x1, y1 = v.total_bounds
x0, y0 = np.floor(x0 / 30) * 30, np.floor(y0 / 30) * 30
W, H = int((x1 - x0) // 30 + 2), int((y1 - y0) // 30 + 2)
tr = from_origin(x0, y0 + H * 30, 30, 30)
inside = rasterize(((g, 1) for g in v.geometry), (H, W), transform=tr, fill=0, dtype="uint8").astype(bool)
cat = pystac_client.Client.open("https://planetarycomputer.microsoft.com/api/stac/v1", modifier=pc.sign_inplace)
items = []
for y in (2023, 2024, 2025):
    items += list(cat.search(collections=["landsat-c2-l2"], bbox=BBOX, datetime=f"{y}-06-01/{y}-09-30",
        query={"eo:cloud_cover": {"lt": MAX_SCENE_CLOUD}, "platform": {"in": ["landsat-8", "landsat-9"]}}).items())
print("candidate scenes:", len(items))
BAD = 0b111111  # fill, dilated cloud, cirrus, cloud, shadow, snow
def warp(href, dtype, resamp):
    dst = np.zeros((H, W), dtype)
    with rasterio.open(href) as s:
        reproject(rasterio.band(s, 1), dst, dst_transform=tr, dst_crs=CRS, resampling=resamp)
    return dst
stack, used = [], []
for it in sorted(items, key=lambda i: i.datetime):
    try:
        st = warp(it.assets["lwir11"].href, "uint16", Resampling.bilinear)
        qa = warp(it.assets["qa_pixel"].href, "uint16", Resampling.nearest)
    except Exception as e:
        print("skip", it.id, e); continue
    t = st.astype("float32") * 0.00341802 + 149.0 - 273.15
    ok = inside & (st > 0) & ((qa & BAD) == 0) & (t > 5) & (t < 70)
    frac = ok.sum() / inside.sum()
    print(it.id, f"cloud={it.properties['eo:cloud_cover']:.1f} clear_over_taipei={frac:.2f}", "USED" if frac >= MIN_VALID_FRAC else "drop")
    if frac >= MIN_VALID_FRAC:
        stack.append(np.where(ok, t, np.nan)); used.append(it.id)
S = np.stack(stack)
med = np.nanmedian(S, axis=0).astype("float32")
cnt = np.isfinite(S).sum(0)
med[~inside] = np.nan
print("scenes used:", len(used))
os.makedirs("data/derived", exist_ok=True)
with rasterio.open("data/derived/lst_summer_median.tif", "w", driver="GTiff", height=H, width=W, count=1, dtype="float32",
                   crs=CRS, transform=tr, nodata=np.nan, compress="lzw", predictor=3) as d:
    d.write(med, 1); d.set_band_description(1, "LST summer median 2023-2025, deg C (Landsat 8/9 ST_B10)")
city = np.nanmean(med)
rows = []
for i, r in enumerate(v.itertuples(), 1):
    m = rasterize([(r.geometry, 1)], (H, W), transform=tr, fill=0, dtype="uint8").astype(bool) & np.isfinite(med)
    rows.append((r.VILLCODE, float(med[m].mean()) if m.any() else np.nan, int(np.median(cnt[m])) if m.any() else 0, int(m.sum())))
out = pd.DataFrame(rows, columns=["VILLCODE", "lst_mean_c", "n_scenes", "n_pixels"])
out["lst_anomaly_c"] = out.lst_mean_c - city
out["lst_mean_c"], out["lst_anomaly_c"] = out.lst_mean_c.round(2), out.lst_anomaly_c.round(2)
out[["VILLCODE", "lst_mean_c", "lst_anomaly_c", "n_scenes", "n_pixels"]].to_csv("data/derived/li_heat.csv", index=False)
print("Taipei mean LST %.2f C; scenes:" % city, used)
j = out.merge(v[["VILLCODE", "TOWNNAME", "VILLNAME"]], on="VILLCODE").sort_values("lst_mean_c")
print(j.isna().sum().to_dict(), "range", j.lst_mean_c.min(), j.lst_mean_c.max())
print("COOLEST 10\n", j.head(10)[["TOWNNAME", "VILLNAME", "lst_mean_c", "n_pixels"]].to_string(index=False))
print("HOTTEST 10\n", j.tail(10)[["TOWNNAME", "VILLNAME", "lst_mean_c", "n_pixels"]].to_string(index=False))
print("by district mean:\n", j.groupby("TOWNNAME").lst_mean_c.mean().sort_values().round(2).to_string())
