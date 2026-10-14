"""Three per-里 transparency checks, from the hackathon's own datasets plus one archived copy.
1. 樹籍比對: street trees in the city's file on 2024-11-21 (Wayback copy) with no tree within 5 m today.
2. 樹穴偏小: trees with trunk >= 30 cm standing in a sidewalk pit smaller than 1.2 m x 1.2 m (公園處's own ask).
3. 300 公尺綠地: share of the 里 within 300 m (straight line) of a park/garden >= 0.5 ha (3-30-300).
Writes data/derived/li_extras.csv, trees_gone.csv, small_pits.csv. Run before score.py."""
import json, pandas as pd, geopandas as gpd
from shapely.geometry import Polygon
from shapely.ops import polygonize, unary_union
R, D = 'data/raw/', 'data/derived/'
LOST_M, PIT_MIN_M2, BIG_DBH, PARK_MIN_M2, WALK_M = 5.0, 1.44, 30, 5000, 300

v = gpd.read_file(R+'taipei_villages.geojson').to_crs(3826)[['VILLCODE', 'geometry']]
def trees(f):
    t = pd.read_csv(f).drop_duplicates('TreeID').dropna(subset=['TWD97X', 'TWD97Y'])
    return gpd.GeoDataFrame(t, geometry=gpd.points_from_xy(t.TWD97X, t.TWD97Y), crs=3826)
def per_li(g): return v.VILLCODE.map(gpd.sjoin(g[['geometry']], v, predicate='within').VILLCODE.value_counts()).fillna(0).astype(int)
def unmatched(a, b):
    j = gpd.sjoin_nearest(a[['geometry']], b[['geometry']], max_distance=LOST_M, how='left')
    return a.loc[j[j.index_right.isna()].index.unique()]

# --- 1. records diff
old, now = trees(R+'archive/TaipeiTree_20241121.csv'), trees(R+'TaipeiTree.csv')
gone, added = unmatched(old, now), unmatched(now, old)
v['trees_2024'], v['trees_gone'], v['trees_added'] = per_li(old), per_li(gone), per_li(added)

# --- 2. small pits with big trees
pits = gpd.read_file(R+'sidewalk_treepit.json').set_crs(3826, allow_override=True)
pits = pits[pits.Name == '樹穴'].copy(); pits['pit_m2'] = pits.area
j = gpd.sjoin_nearest(now, pits[['pit_m2', 'geometry']], max_distance=0.5, how='inner')
j = j[~j.index.duplicated()]
small = j[(j.pit_m2 < PIT_MIN_M2) & (j.Diameter >= BIG_DBH)]
v['small_pits'] = per_li(small)

# --- 3. park access
el = json.load(open(R+'osm_parks_geom.json'))['elements']
polys = []
for e in el:
    if e['type'] == 'way' and len(e.get('geometry', [])) >= 4:
        polys.append(Polygon([(p['lon'], p['lat']) for p in e['geometry']]))
    elif e['type'] == 'relation':
        lines = [[(p['lon'], p['lat']) for p in m['geometry']] for m in e.get('members', []) if m.get('role') == 'outer' and m.get('geometry')]
        polys += list(polygonize(lines))
parks = gpd.GeoDataFrame(geometry=[p.buffer(0) for p in polys], crs=4326).to_crs(3826)
parks = parks[parks.area >= PARK_MIN_M2]
# official 公園基本資料 (points + area) fill parks OSM lacks: a circle of the stated area
pb = pd.DataFrame(json.load(open(R+'parks_basic.json')))
pb = pb.assign(lon=pd.to_numeric(pb.pm_Longitude, errors='coerce'), lat=pd.to_numeric(pb.pm_Latitude, errors='coerce'),
               a=pd.to_numeric(pb.pm_LandPublicArea, errors='coerce')).dropna(subset=['lon', 'lat', 'a'])
pb = pb[pb.a >= PARK_MIN_M2]
pg = gpd.GeoDataFrame(pb, geometry=gpd.points_from_xy(pb.lon, pb.lat), crs=4326).to_crs(3826)
pg = pg[~pg.intersects(unary_union(parks.geometry.values))]
pg['geometry'] = pg.geometry.buffer((pg.a / 3.14159) ** 0.5)
reach = unary_union(list(parks.geometry.buffer(WALK_M)) + list(pg.geometry.buffer(WALK_M)))
v['park300'] = (v.geometry.intersection(reach).area / v.area).round(3)

v.drop(columns='geometry').to_csv(D+'li_extras.csv', index=False)
for g, f, cols in ((gone, 'trees_gone.csv', ['TreeID', 'TreeType', 'Diameter', 'Region']),
                   (small, 'small_pits.csv', ['TreeID', 'TreeType', 'Diameter', 'pit_m2', 'Region'])):
    o = g.drop(columns=['index_right', 'VILLCODE'], errors='ignore').to_crs(4326); o['lon'] = o.geometry.x.round(6); o['lat'] = o.geometry.y.round(6)
    o = o.sjoin(v.to_crs(4326)[['VILLCODE', 'geometry']], predicate='within', how='left')
    o.assign(pit_m2=o.get('pit_m2', pd.Series(dtype=float)).round(2))[['VILLCODE'] + cols + ['lon', 'lat']].to_csv(D+f, index=False)
s = {'trees_2024': len(old), 'trees_now': len(now), 'trees_gone': len(gone), 'trees_added': len(added),
     'small_pits_bigtree': len(small), 'parks_osm': len(parks), 'parks_official_added': len(pg),
     'li_park300_below_50pct': int((v.park300 < 0.5).sum()), 'park300_median': float(v.park300.median())}
json.dump(s, open(D+'extras_summary.json', 'w'), ensure_ascii=False, indent=1); print(s)
print(v.drop(columns='geometry').sort_values('trees_gone', ascending=False).head(8).to_string())
