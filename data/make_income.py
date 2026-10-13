"""Per-里 income (MOF/FIA 綜稅綜合所得總額 村里統計, 112 tax year) -> data/derived/li_income.csv
Source: https://data.gov.tw/dataset/17983 ; file https://www.fia.gov.tw/WEB/fia/ias/ias112/112_165-A.csv
Units in source: thousand NTD (千元). Output keeps 千元."""
import os, re, subprocess, pandas as pd, geopandas as gpd
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
YEAR = 112
raw = f"data/raw/income_{YEAR}_165-A.csv"
if not os.path.exists(raw):
    subprocess.run(["curl", "-sSf", "-o", raw, f"https://www.fia.gov.tw/WEB/fia/ias/ias{YEAR}/{YEAR}_165-A.csv"], check=True)
d = pd.read_csv(raw, encoding="utf-8")
d.columns = [c.lstrip("\ufeff") for c in d.columns]  # BOM sits inside the quotes
d = d[d["縣市別"].str.startswith("臺北市")].copy()
norm = lambda s: re.sub(r"\s", "", str(s)).replace("台", "臺")
d["key"] = d["縣市別"].map(lambda s: norm(s)[3:]) + d["村里"].map(norm)  # 區+里
v = gpd.read_file("data/raw/taipei_villages.geojson")[["VILLCODE", "TOWNNAME", "VILLNAME"]]
v["key"] = (v.TOWNNAME + v.VILLNAME).map(norm)
print("income rows (Taipei):", len(d), " non-里 rows:", d[~d["村里"].str.endswith("里")]["村里"].tolist())
m = v.merge(d, on="key", how="left")
miss = m[m["中位數"].isna()]
print(f"match: {m['中位數'].notna().sum()}/{len(v)} villages")
print("villages w/o income:", miss[["TOWNNAME", "VILLNAME"]].values.tolist())
unm = d[~d.key.isin(v.key)]
print("income rows w/o village:", unm[["縣市別", "村里"]].values.tolist())
out = pd.DataFrame({"VILLCODE": m.VILLCODE, "median_income": m["中位數"], "mean_income": m["平均數"],
                    "n_units": m["納稅單位(戶)"], "total_income": m["綜合所得總額"], "year": YEAR})
os.makedirs("data/derived", exist_ok=True)
out.to_csv("data/derived/li_income.csv", index=False)
print(out.describe().T[["min", "50%", "max"]])
s = m.dropna(subset=["中位數"]).sort_values("中位數")
cols = ["TOWNNAME", "VILLNAME", "中位數", "平均數", "納稅單位(戶)"]
print("POOREST 5\n", s.head(5)[cols].to_string(index=False)); print("RICHEST 5\n", s.tail(5)[cols].to_string(index=False))
