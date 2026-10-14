"""Per-里 Taipei Tree Equity Score (TES-style) + replant allocator: plant back the street trees that vanished from the city's records (analysis/extras.py).
TES = 100*(1 - gap*E); gap = max(0,(goal-canopy)/goal); E = 0.1+0.9*mean(norm need factors).
Method: American Forests treeequityscore.org/methodology, canopy goal 30% (3-30-300)."""
import json, heapq, numpy as np, pandas as pd, geopandas as gpd, rasterio
R, D = 'data/raw/', 'data/derived/'
GOAL, CROWN_M2, EMPTY_BUF_M = 0.30, 30.0, 2.0
N_TREES = json.load(open(D+'extras_summary.json'))['trees_gone']  # 2024-11 -> now, no tree within 5 m
rng = np.random.default_rng(42)

v = gpd.read_file(R+'taipei_villages.geojson').to_crs(3826)
v['area_m2'] = v.area
# --- population: dependency ratio, 65+, <12
p = pd.read_csv(R+'pop_by_li_112_now.csv', encoding='big5', dtype={'區域代碼': str})
p = p[p['年份'] == p['年份'].max()]; p = p[(p['月份'] == p['月份'].max()) & (p['性別'] == '計')]
age = {c: int(c.replace('歲數量', '').replace('歲以上', '')) for c in p.columns if c.endswith('歲數量') or c.endswith('以上')}
sel = lambda f: p[[c for c, a in age.items() if f(a)]].sum(1)
p['pop'] = p['總計']; p['age65'] = sel(lambda a: a >= 65); p['age_u12'] = sel(lambda a: a < 12)
p['dep_ratio'] = (sel(lambda a: a < 18) + p['age65']) / sel(lambda a: 18 <= a < 65)
v = v.merge(p[['區域代碼', 'pop', 'age65', 'age_u12', 'dep_ratio']], left_on='VILLCODE', right_on='區域代碼', how='left')
for f in ('li_income.csv', 'li_heat.csv'):
    v = v.merge(pd.read_csv(D+f, dtype={'VILLCODE': str}), on='VILLCODE', how='left')

# --- canopy: Meta/WRI ~1 m canopy height, share of ground with vegetation >= 3 m (data/make_canopy.py)
v = v.merge(pd.read_csv(D+'li_canopy_meta.csv', dtype={'VILLCODE': str}), on='VILLCODE', how='left')
v = v.merge(pd.read_csv(D+'li_extras.csv', dtype={'VILLCODE': str}), on='VILLCODE', how='left')  # analysis/extras.py
v['canopy'] = v.canopy_meta
with rasterio.open(D+'canopy_meta_taipei.tif') as src:
    _h = src.read(1); _tf, _crs = src.transform, src.crs
_ii = np.pad((_h >= 3).astype(np.int32).cumsum(0).cumsum(1), ((1, 0), (1, 0)))  # integral image
def canopy_near(g, r=15):
    """Share of canopy (>=3 m) in a (2r)^2 box around each point: how shaded the spot already is."""
    xy = g.to_crs(_crs).geometry; k = max(1, int(round(r / _tf.a)))
    col, row = ~_tf * (xy.x.values, xy.y.values); row, col = row.astype(int), col.astype(int)
    r0, r1 = np.clip(row - k, 0, _h.shape[0]), np.clip(row + k, 0, _h.shape[0])
    c0, c1 = np.clip(col - k, 0, _h.shape[1]), np.clip(col + k, 0, _h.shape[1])
    n = np.maximum((r1 - r0) * (c1 - c0), 1)
    return ((_ii[r1, c1] - _ii[r0, c1] - _ii[r1, c0] + _ii[r0, c0]) / n).round(3)

# --- trees
st = pd.read_csv(R+'TaipeiTree.csv').drop_duplicates('TreeID')
pt = pd.read_csv(R+'TaipeiParkTree.csv').drop_duplicates('TreeID')
pts = lambda df: gpd.GeoDataFrame(geometry=gpd.points_from_xy(df.TWD97X, df.TWD97Y), crs=3826)
st_g, all_t = pts(st), pd.concat([pts(st), pts(pt)], ignore_index=True)
v['street_trees'] = v.VILLCODE.map(gpd.sjoin(st_g, v[['VILLCODE', 'geometry']], predicate='within').VILLCODE.value_counts()).fillna(0).astype(int)

# --- foot traffic: walk destinations per km2
def osm(f):
    e = json.load(open(R+f))['elements']
    xy = [(x.get('lon') or x['center']['lon'], x.get('lat') or x['center']['lat']) for x in e if 'lon' in x or 'center' in x]
    return gpd.GeoDataFrame(geometry=gpd.points_from_xy(*zip(*xy)), crs=4326)
bus = gpd.read_file(R+'busstop_extracted/busstop/busstop.shp').set_crs(4326, allow_override=True)
mrt = pd.read_csv(R+'mrt_exits.csv', encoding='big5'); mrt = gpd.GeoDataFrame(geometry=gpd.points_from_xy(mrt['經度'], mrt['緯度']), crs=4326)
mk = pd.read_csv(R+'markets_traditional.csv'); mk = gpd.GeoDataFrame(geometry=gpd.points_from_xy(mk.GTag_longitude, mk.GTag_latitude), crs=4326)
poi = pd.concat([g[['geometry']].to_crs(3826) for g in (bus, mrt, mk, osm('osm_schools.json'), osm('osm_health.json'), osm('osm_markets.json'), osm('osm_elderly.json'))], ignore_index=True)
poi = gpd.GeoDataFrame(poi, crs=3826)
v['poi'] = v.VILLCODE.map(gpd.sjoin(poi, v[['VILLCODE', 'geometry']], predicate='within').VILLCODE.value_counts()).fillna(0)
v['poi_per_km2'] = v.poi / (v.area_m2 / 1e6)

# --- need index E (equal weights, min-max) and TES
def norm(s): s = s.astype(float); return (s - s.min()) / (s.max() - s.min())
v['n_dep'] = norm(v.dep_ratio); v['n_heat'] = norm(v.lst_anomaly_c)
v['n_income'] = norm(-v.median_income); v['n_foot'] = norm(np.log1p(v.poi_per_km2))
NEED = ['n_dep', 'n_heat', 'n_income', 'n_foot']
v['E'] = 0.1 + 0.9 * v[NEED].mean(1)
gap = lambda c: np.clip((GOAL - c) / GOAL, 0, 1)
v['gap'] = gap(v.canopy); v['TES'] = (100 * (1 - v.gap * v.E)).round(1)

# --- empty pits (no street/park tree within EMPTY_BUF_M)
pits = gpd.read_file(R+'sidewalk_treepit.json').set_crs(3826, allow_override=True)
pits = pits[pits.Name == '樹穴'].reset_index(drop=True)
buf = pits[['geometry']].copy(); buf['geometry'] = pits.buffer(EMPTY_BUF_M)
filled = gpd.sjoin(buf, all_t, predicate='contains').index.unique()
empty = gpd.GeoDataFrame(geometry=pits.drop(filled).geometry.centroid, crs=3826)
empty = gpd.sjoin(empty, v[['VILLCODE', 'geometry']], predicate='within').drop(columns='index_right')
empty['kind'] = 'pit'
v['empty_pits'] = v.VILLCODE.map(empty.VILLCODE.value_counts()).fillna(0).astype(int)
ns = pd.read_csv(D+'new_spots.csv', dtype={'VILLCODE': str})
ns = gpd.GeoDataFrame(ns[['VILLCODE']].assign(kind='new'), geometry=gpd.points_from_xy(ns.lon, ns.lat), crs=4326).to_crs(3826)
v['new_spots'] = v.VILLCODE.map(ns.VILLCODE.value_counts()).fillna(0).astype(int)
empty = pd.concat([empty, ns], ignore_index=True)
# stable site_id from TWD97 metres, so citizen votes survive pipeline reruns: p=existing pit, n=new candidate
empty['site_id'] = [f"{k[0]}{round(g.x)}_{round(g.y)}" for k, g in zip(empty.kind, empty.geometry)]
print('duplicate sites dropped:', int(empty.site_id.duplicated().sum())); empty = empty.drop_duplicates('site_id')
_u = poi.union_all()
empty['poi_dist_m'] = empty.geometry.distance(_u).round(0)
empty['canopy_15m'] = canopy_near(empty)
empty['shaded'] = empty.canopy_15m >= 0.5           # already under canopy: planting here adds little shade
empty = empty.sort_values(['shaded', 'kind', 'canopy_15m', 'poi_dist_m'], ascending=[True, False, True, True]).reset_index(drop=True)
v['sites'] = v.VILLCODE.map(empty[~empty.shaded].VILLCODE.value_counts()).fillna(0).astype(int)

# --- allocator: greedy by marginal equity gain (E * gap reduction per tree)
order = []
def allocate(n):
    can, left = v.set_index('VILLCODE').canopy.to_dict(), v.set_index('VILLCODE').sites.to_dict()
    E, A = v.set_index('VILLCODE').E.to_dict(), v.set_index('VILLCODE').area_m2.to_dict()
    gain = lambda k: E[k] * (gap(can[k]) - gap(can[k] + CROWN_M2 / A[k]))
    h = [(-gain(k), k) for k in can if left[k] > 0 and gain(k) > 0]; heapq.heapify(h); out = {}; order.clear()
    while h and sum(out.values()) < n:
        _, k = heapq.heappop(h); out[k] = out.get(k, 0) + 1; order.append(k); left[k] -= 1; can[k] += CROWN_M2 / A[k]
        if left[k] > 0 and gain(k) > 0: heapq.heappush(h, (-gain(k), k))
    return out
alloc = allocate(N_TREES); v['alloc'] = v.VILLCODE.map(alloc).fillna(0).astype(int)
# plan_rank = the order the greedy allocator placed each tree (nearest-to-people pit first within a 里)
nxt, empty['plan_rank'] = {}, -1
by_li = {k: list(g.index) for k, g in empty.groupby('VILLCODE')}
for r, k in enumerate(order):
    i = by_li[k][nxt.get(k, 0)]; nxt[k] = nxt.get(k, 0) + 1; empty.loc[i, 'plan_rank'] = r
empty['planned'] = empty.plan_rank >= 0
ev = empty[~empty.shaded].sample(N_TREES, random_state=42)
empty['even_rank'] = -1; empty.loc[ev.index, 'even_rank'] = range(N_TREES)
even = ev.VILLCODE.value_counts()
v['even'] = v.VILLCODE.map(even).fillna(0).astype(int)

# --- compare: who gets the trees
hi = v.E >= v.E.quantile(0.8)
def report(col):
    t = v[col]; w = lambda c: (t * v[c]).sum() / t.sum()
    return {'trees_to_top20pct_need_li': int(t[hi].sum()), 'share_top20pct': round(t[hi].sum() / t.sum() * 100, 1),
            'tree_wtd_E': round(w('E'), 3), 'tree_wtd_median_income_k': round(w('median_income')), 'tree_wtd_heat_anom_c': round(w('lst_anomaly_c'), 2),
            'li_reached': int((t > 0).sum()), 'age65_in_receiving_li': int(v.loc[t > 0, 'age65'].sum())}
summary = {'n_trees': N_TREES, 'equity': report('alloc'), 'even': report('even'), 'empty_pits': int((empty.kind == 'pit').sum()), 'new_spots': int((empty.kind == 'new').sum()),
           'pits_total': len(pits), 'alloc_to_new_spots': int(empty[empty.planned].kind.eq('new').sum()),
           'city_TES_mean': round(v.TES.mean(), 1), 'li_TES_below_70': int((v.TES < 70).sum())}
print(json.dumps(summary, ensure_ascii=False, indent=1))
print(v.nsmallest(12, 'TES')[['TOWNNAME', 'VILLNAME', 'pop', 'canopy', 'lst_anomaly_c', 'median_income', 'dep_ratio', 'street_trees', 'empty_pits', 'new_spots', 'TES', 'alloc']].round(2).to_string())

# --- outputs (WGS84 for the web)
cols = ['VILLCODE', 'TOWNNAME', 'VILLNAME', 'pop', 'age65', 'age_u12', 'dep_ratio', 'median_income', 'lst_mean_c', 'lst_anomaly_c',
        'canopy', 'street_trees', 'poi_per_km2', 'empty_pits', 'new_spots', 'sites', 'E', 'gap', 'TES', 'alloc', 'even', 'trees_2024', 'trees_gone', 'trees_added', 'small_pits', 'park300'] + NEED
out = v[cols + ['geometry']].copy(); out['geometry'] = out.simplify(5)
web_cols = ['VILLCODE', 'TOWNNAME', 'VILLNAME', 'pop', 'age65', 'dep_ratio', 'median_income', 'lst_mean_c', 'canopy',
            'street_trees', 'poi_per_km2', 'empty_pits', 'new_spots', 'TES',
            'trees_2024', 'trees_gone', 'trees_added', 'small_pits', 'park300', 'geometry']  # only what the web app reads
out[web_cols].round(4).to_crs(4326).to_file(D+'li_score.geojson', driver='GeoJSON', layer_options={'COORDINATE_PRECISION': 6})
e = empty.to_crs(4326); e['lon'] = e.geometry.x.round(6); e['lat'] = e.geometry.y.round(6)
e[['site_id', 'VILLCODE', 'kind', 'lon', 'lat', 'poi_dist_m', 'canopy_15m', 'plan_rank', 'even_rank']].to_csv(D+'empty_pits.csv', index=False)
json.dump(summary, open(D+'summary.json', 'w'), ensure_ascii=False, indent=1)
