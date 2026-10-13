# Scout: integrations, portability, frontier (2026-10-13)
Every claim has a URL or a command I ran. "Measured" means I queried it today. Hours are for one person who already knows the repo.

## 1. Integrate-now list (Taipei, 1-day build)
| Candidate | What it adds | Effort | License | Access path / verdict |
|---|---|---|---|---|
| **Meta/WRI canopy height v2** (~1.19 m, uint8 metres) | Real per-里 canopy % (≥3 m), not WorldCover's 10 m "tree" class. Fixes the 文山/北投 mountain-forest bias, and gives a per-pit "already shaded?" check | 2–3 h | CC BY 4.0 (cite Tolan 2024, Brandt 2026) | **Measured:** Taipei bbox = 4 quadkey COGs, `1321231203/1212/1221/1230.tif` (59+9+257+224 MB). URL `https://data.source.coop/tge-labs/meta-chm-v2/chm/<qk>.tif` (HTTP 200). Origin `s3://dataforgood-fb-data/forests/v2/global/dinov3_global_chm_v2_ml3/chm/` (+ `tiles.geojson`, `metadata/` obs dates). Index: `tiles.parquet` via DuckDB. Read windows with rasterio `/vsicurl/`, so no full download. Imagery is 2005–2020: state the date. https://source.coop/tge-labs/meta-chm-v2 · https://registry.opendata.aws/dataforgood-fb-forestsv2 |
| **Taipei building heights**: 臺北市建築執照套繪圖 (SHP, `bud_floor`) | Footprints + floors (×~3.3 m) → shadow casting. Better than Overture here | 1 h | OGDL v1 | https://data.gov.tw/dataset/151936 (data.taipei resource ccdfe8df…). Updated 2026-10-05. "For reference only" per the dataset note |
| Overture buildings (2026-09-23.1) | Global fallback footprints | 0.5 h | ODbL | **Measured:** a 3×3 km central-Taipei box has 9,600 buildings, **6% with `height`, 38% with `num_floors`**; sources = OSM + Zenodo 8174931. OSM Taipei: 103,111 buildings, 33,231 (32%) with `building:levels`. Use only for the zero-local-data mode. Paths: https://docs.overturemaps.org/guides/buildings/ |
| Google Open Buildings | n/a | — | CC BY 4.0 | **Skip:** the 2.5D/temporal set covers Africa, S/SE Asia and LatAm, not Taiwan. https://sites.research.google/gr/open-buildings/temporal |
| **pybdshadow** | Building-shadow polygons at a given time (e.g. 14:00 on Jul 21) → "sun-baked pits first" | 3–4 h | BSD-3, last push 2025-03, ★82 | `pip install pybdshadow`; `bdshadow_sunlight(gdf_with_height, utc_time)`. Buildings only, no trees: add tree crowns from CHM yourself. https://github.com/ni1o1/pybdshadow |
| UMEP / SOLWEIG / SOLWEIG-GPU | Mean radiant temperature (Tmrt) and shade from a DSM + CHM + met data, the gold standard | 2–4 days | **GPL-3.0** (UMEP-processing pushed 2026-09; SOLWEIG-GPU 2026-09, JOSS 2026) | 100-day item. Run it as a separate CLI step so GPL does not touch our code. https://github.com/UMEP-dev/UMEP-processing · https://solweig-gpu.readthedocs.io |
| WRI Cool Cities Lab | 1 m SOLWEIG shade maps at 15:00 | — | — | **Taipei not covered** (26 cities). Copy the method (OpenUrban + Overture + UT-GLOBUS + Meta CHM). https://coolcities.wri.org/data-and-methods/shade_change |
| ShadeMap | Live sun/shadow web layer | 1 h (link-out only) | Proprietary API key, free on localhost only, tier prices unpublished | **Don't depend on it.** At most a "see it in ShadeMap" link. https://shademap.app/about/ |
| OSM `natural=tree` / `tree_row` | Fills gaps (private, school and campus trees) | 0.5 h | ODbL | **Measured (Overpass):** 3,567 tree nodes and 1,219 tree_row ways in Taipei, small next to the city's 162k. Low value for Taipei, but the fallback elsewhere |
| OpenTrees.org | Aggregator; Taipei not listed | — | **Code CC-BY-NC**; data repo last push 2021 | **Don't integrate.** Borrow its crosswalk idea (§2c). https://github.com/stevage/opentrees-data |
| **Per-tree benefit value** | "This pit = X m² shade, Y kg CO₂ stored". Also values the 3,164 lost trees | 2 h | Formulas are open | i-Tree coefficients are open only via OpenTreeMap's `otm-ecoservice` (AGPL, 16 US regions; nearest analogs `GulfCoCHS`/`TropicPacXXX`) and `treeco` (R, MIT, stale 2018). An NTU PhD (詹為巽 2024) found **i-Tree Eco likely overestimates Taipei carbon**; use only for relative comparison (https://tdr.lib.ntu.edu.tw/handle/123456789/92929, doi:10.6342/NTU202401467). **Use:** crown area (Taichung publishes 樹冠投影面, so we can fit crown~DBH) + Chave 2014 pantropical AGB = 0.0673·(ρD²H)^0.976 (verify vs paper; ρ from the Global Wood Density DB), C = 0.47·AGB, CO₂ = 3.67·C. Skip NT$ energy claims. If needed, the grid factor is 0.467 kgCO₂e/kWh (2025, 能源署; https://udn.com/news/story/7238/9540934) |
| Tree Equity Score | Formula (already used in score.py) | 0 h | Data US-only; no official code repo found | Downloads (SHP/GeoJSON/CSV, 38 states) are useful only as a validation fixture. https://treeequityscore.org/methodology |
| **臺北市人行道桿類設施** (poles) | Conflict mask: drop empty pits/spots within ~1.5 m of a pole | 1 h | OGDL v1 | https://data.gov.tw/dataset/134911 (EPSG:3826 points, updated 2026-09-22). Pair with `sidewalk_extent` width ≥2.5 m |
| Sidewalk-width tools | Plantable-strip screening | — | Tile2Net BSD-3, active (2026-09), US-trained | Taipei already publishes width (`SW_WTH`), so no tool needed. Tile2Net is for cities without sidewalk data. https://github.com/VIDA-NYU/tile2net |
| **Mapillary** | Open street imagery (CC BY-SA 4.0) for in-app citizen verification, no Google ToS issue | 2 h | Free client token | Token: https://mapillary.com/dashboard/developers. `GET graph.mapillary.com/images?bbox=…&fields=id,thumb_1024_url,captured_at,compass_angle` (bbox <0.01°²; 10k search req/min, 50k tiles/day). Embed: `https://www.mapillary.com/embed?image_key=<id>&style=photo`. **No tree point class**, but the 27 point classes include `object--support--utility-pole`, `object--street-light`, `object--manhole`, `object--fire-hydrant`, `object--junction-box` = conflict detectors. Taipei coverage unmeasured (needs a token): check first. https://www.mapillary.com/developer/api-documentation · https://www.mapillary.com/developer/api-documentation/points |
| **Google Street View deep link** | One-click "go look" per pit | 0.25 h | No API key needed for Maps URLs | `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=LAT%2CLON&heading=H&pitch=-10&fov=80`. Set heading toward the curb from the sidewalk bearing. https://developers.google.com/maps/documentation/urls/get-started |

## 2. Portability
### 2a. Taiwan cities: street-tree open data (from the data.gov.tw catalog CSV, 68 MB, pulled today)
| City | Dataset | Grain | Fields / CRS | Verdict |
|---|---|---|---|---|
| 臺北 | 128274 trees, 134908 pits, 134911 poles | per tree / pit | TWD97 3826 | Done (reference city) |
| **臺中** | **108167 主要道路喬木植栽** (https://data.gov.tw/dataset/108167) | **per tree, 15,040 rows (measured)** | 樹籍身分證, 樹種, 胸徑, 樹高, **樹冠投影面**, 推估樹齡, 調查日期 (2018), X/Y TWD97 + 緯度/經度, 行政區, 村里, 路段, 位置類型 | **Best 2nd city.** Main roads only. URL `newdatacenter.taichung.gov.tw/api/v1/no-auth/resource.download?rid=56fa93c4-…` |
| 臺中 | **人行道固定設施-樹穴** per district (178334–178339 …; 84492 legacy) | per pit | 樹種, 緯度, 經度, 行政區, 村里, 路段, 所在位置類型 | Has pits *with species*, so empty pits may be explicit. Check per district |
| 臺中 | 109853 行道樹分佈圖 (2020) | file index (JSON/CSV/XML) | links to map files | secondary |
| 新北 | 125339 新北市行道樹資料 | **per road × species counts**, no per-tree coordinates | town_na, site(人行道/中隔島), road_na, tree_1..n | Road-level only. 景觀處 is re-inventorying ~70k trees (https://udn.com/news/story/7323/8960257). Use OSM + CHM until then |
| 新竹市 | 67763 / 164437–164439 主要道路喬木植栽 | per road segment counts | 行政區, 路段, 分隔島/人行道/路邊植栽 | Road-level only |
| 臺南 | 122808 道路路樹調查表 | per district × species | 行政區, 樹種, 大約數量, 樹齡 | Aggregate only |
| 桃園 | 26129 受保護樹木 only | — | GPS lat/lon | 80k street trees being tagged with QR IDs but not published (https://news.pts.org.tw/article/422782): file a data request |
| 高雄 | none found in catalog | — | — | Zero-local-data mode |

**National layers (island-wide, all OGDL v1):**
- 村里界 TWD97 lon/lat, `VILLCODE`: https://data.gov.tw/dataset/7438
- **村里戶數、單一年齡人口 (新增區域代碼)**: monthly, every 村里 in Taiwan, by sex × single age: https://data.gov.tw/dataset/77132
- **綜稅綜合所得總額全國各縣市鄉鎮村里統計分析表** (median, quartiles, every 村里, yearly): https://data.gov.tw/dataset/103066
- Landsat C2 L2 LST via the Planetary Computer STAC (public domain), already scripted in `data/make_heat.py`

### 2b. Global: zero-local-data fallback (any city)
| Need | Layer | License | Path |
|---|---|---|---|
| Trees (points) | OSM `natural=tree`, `tree_row` | ODbL | Overpass / Geofabrik |
| Canopy | Meta CHM v2 (1 m) + ESA WorldCover 10 m | CC BY 4.0 | as above · `esa-worldcover` S3/PC |
| Buildings | Overture buildings (+ OSM levels) | ODbL | `overturemaps download --bbox … --type=building` |
| Sidewalks / roads | OSM `footway=sidewalk`, `sidewalk=*`, road width; Tile2Net from aerials | ODbL / BSD-3 | — |
| Heat | Landsat 8/9 ST_B10 summer median | public domain | PC STAC `landsat-c2-l2` |
| Population | GHSL GHS-POP (100 m), WorldPop (100 m), **Kontur H3 400 m** (2023-11) | CC BY 4.0 / CC BY | https://data.humdata.org/dataset/kontur-population-dataset |
| **Age (65+ proxy, <5)** | **Meta HRSL demographic 30 m**: global VRTs `s3://dataforgood-fb-data/hrsl-cogs/hrsl_elderly_60_plus/…-latest.vrt`, `hrsl_children_under_five/` (listed today); a Taiwan package exists | CC BY 4.0 | https://data.humdata.org/dataset/taiwan-high-resolution-population-density-maps-demographic-estimates |
| Income | none global. Use the national census adapter, or drop the factor and reweight (TES allows missing vars) | — | — |
| Areas | OSM `admin_level` or an H3 grid (res 8–9) when there are no small census units | — | — |

### 2c. City-adapter design
**Precedents:**
- OpenTrees: one JS object per source, holding `download`, `format` and a `crosswalk` map (field name or function, e.g. `dbh: x => circ/π`), feeding one normalized schema. https://github.com/stevage/opentrees-data/blob/master/sources/france.js
- NYC ForMS 2.0: **PlantingSpace ↔ TreePoint** (≤1 active tree per space; a removal retires the tree point, and the space persists). This is our pits/trees model. https://catalog.data.gov/dataset/forestry-planting-spaces
- TES and Ottawa: goal by biome/transect, plus a fixed list of need variables. https://documents.ottawa.ca/sites/default/files/2025%20Tree%20Equity%20Scores%20by%20Transect.pdf

```yaml
# cities/taipei/city.yaml   (a new city = this file + optional adapter.py for odd formats)
id: taipei; name: 臺北市; crs: EPSG:3826; bbox: [121.45,24.96,121.67,25.21]; locale: zh-TW
canopy_goal: {default: 0.30, by: transect}      # 3-30-300; TES-style override per area class
sources:
  trees:  [{url: …TaipeiTree.csv, fmt: csv, x: TWD97X, y: TWD97Y, crs: 3826,
            map: {id: TreeID, species: TreeType, dbh_cm: Diameter, height_m: TreeHeight, surveyed: SurveyDate}}]
  pits:   [{url: …sidewalk_treepit.json, filter: "Name == '樹穴'", map: {id: OBJECTID}}]   # absent → derive from sidewalks
  obstacles: [{url: …134911, kind: pole, buffer_m: 1.5}]
  sidewalks: [{url: …sidewalk_extent.json, map: {width_m: SWW_WTH}}]
  areas:  {url: …7438, id: VILLCODE, name: VILLNAME, filter: "COUNTYNAME == '臺北市'"}
  need:   {age: national_tw_77132, income: national_tw_103066, heat: landsat, foot: [osm_pois, bus, mrt]}
fallbacks: {trees: osm, canopy: meta_chm_v2, buildings: overture, population: hrsl}   # zero-local-data
```
**Standard intermediate schema** (GeoParquet, EPSG:4326 out, metric CRS inside):
- `trees`: id, geom, species, dbh_cm, height_m, crown_m2 (measured|estimated), surveyed, source, license
- `plantable_spots`: id, geom, kind (pit|strip|derived), status (empty|planted|unknown|cannot), area_m2, sidewalk_width_m, nearest_tree_m, conflicts[], area_id, verified_by
- `areas`: area_id, name, geom, pop, age65, age_u12, dep_ratio, income_median, lst_anomaly_c, canopy_frac, canopy_src, poi_density
- `provenance.json`: per layer URL, license, fetch date, and real-vs-simulated flag

`score.py` reads only these three tables, so it stays city-agnostic. Factors that are missing drop out and are logged. Contract test: `make city=taichung` runs end to end.

## 3. Frontier (2025–2026)
- **Meta CHM v2** (DINOv3, 2026-02 on S3): a global ~1 m canopy-height map, the largest open-data change for this project. https://registry.opendata.aws/dataforgood-fb-forestsv2
- **Street-view tree inventories at continental scale:** 100 genera across 23 cities from GSV + iNaturalist; compares predictions with city records to find missing trees (ISPRS Open J. 2026). https://www.biorxiv.org/content/10.1101/2025.10.09.681424v2.full
  - Multimodal satellite + street tree detection with little labelled data. https://arxiv.org/abs/2604.03505
  - StreetTree global species benchmark (2026). https://arxiv.org/pdf/2602.19123
- **Planted-tree survival tracked virtually with street imagery** (Philadelphia, 2,884 trees). Survival was higher with less impervious surface around the tree and with fall planting, which is the evidence base for "guardian" follow-up. https://auf.isa-arbor.com/content/52/2/186
- **ZenSVI** (MIT, active 2026-09): one Python package for Mapillary/GSV download, segmentation and green-view index. This is the pipeline for "is this pit empty?" auto-triage. https://github.com/koito19960406/ZenSVI
- **Digital twins:**
  - Tree-D Fusion: MIT + Google 3D tree models built on Auto-Arborist. https://dusp.mit.edu/news/advancing-urban-tree-monitoring-ai-powered-digital-twins
  - Auto-Arborist repo: Apache-2.0, archived 2025.
  - Google Heat Resilience: US-only, not public. https://blog.google/company-news/outreach-and-initiatives/sustainability/google-ai-research-extreme-heat-resilience/
- **Plantable-space detection:** no open, general tool found. The GIS screen in the literature is width + tree spacing + land use, with underground utilities as the known blind spot (https://www.gs.tum.de/fileadmin/w00bik/grk-ugi/Documents/Retiberger__pattnai__ying_2024.pdf). A pits table plus a crowd/AI verification loop is novel ground.
- **City exemplars:**
  - Barcelona street-tree census: CC BY 4.0, quarterly. https://opendata-ajuntament.barcelona.cat/data/en/dataset/arbrat-viari
  - Paris `les-arbres`: public domain.
  - Singapore Trees.sg is not open source.
  - TES added shade data in some states. https://innovation.luskin.ucla.edu/how-to-use-the-shade-data-map-in-tree-equity-score

## Recommendation
**Hackathon MVP (ranked, ~11 h total)**
1. **Street View deep link + Mapillary embed** on every pit, behind the 空的/有樹/不能種 buttons: 0.75 h. Makes verification real.
2. **Pole + width conflict mask** (134911 poles ±1.5 m; sidewalk width ≥2.5 m) → pits marked 可種 vs 需勘查: 1.5 h. Removes obviously bad picks.
3. **Meta CHM v2 canopy** replaces WorldCover for per-里 canopy and per-pit "already shaded within 10 m": 3 h. Fixes the mountain bias and makes the equity map defensible.
4. **Per-tree benefit card** (crown m² + Chave CO₂ stored, labelled "estimate"), including a "value of the 3,164 lost" line: 2 h.
5. **Afternoon-shadow layer** (建築執照套繪圖 floors → pybdshadow at 14:00 in July), ranking sun-baked pits first: 4 h. Stretch goal; cut it first.

**100-day plan (ranked)**
1. City adapter + intermediate schema, with **臺中** as city #2 (per-tree + per-pit data with coordinates): ~1 week.
2. Zero-local-data mode (OSM + Overture + CHM v2 + Landsat + HRSL/Kontur), demoed on 高雄/新北: ~1 week.
3. AI triage of pits via ZenSVI/Mapillary (vegetation segmentation + pole/manhole detections), feeding the citizen queue: ~2 weeks.
4. SOLWEIG(-GPU) Tmrt/shade at 1 m for Taipei (CHM + building DSM), with before/after maps for planting scenarios: ~2 weeks, kept as a GPL-isolated step.
5. Removal tracker: weekly snapshot-diff of TaipeiTree.csv by TreeID → public loss log and guardian alerts; publish the normalized trees GeoParquet: ~1 week.
