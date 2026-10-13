"""v2: candidate NEW tree pits on sidewalks wide enough to keep 1.5 m clear (Taiwan 市區道路及附屬工程設計規範).
Rule: effective width SWW_WTH >= 2.5 m (1 m pit + 1.5 m clear). Points every SPACING m along the sidewalk's long axis,
>= 6 m from any recorded tree, >= 4 m from any existing pit. Output = 需現勘 candidates (utilities unknown)."""
import numpy as np, pandas as pd, geopandas as gpd
from shapely.geometry import LineString
R, D = 'data/raw/', 'data/derived/'
MIN_W, SPACING, TREE_GAP, PIT_GAP = 2.5, 8.0, 6.0, 4.0

sw = gpd.read_file(R+'sidewalk_extent.json').set_crs(3826, allow_override=True)
sw = sw[sw.SWW_WTH >= MIN_W].reset_index(drop=True)
def axis_points(poly):
    r = poly.minimum_rotated_rectangle; c = list(r.exterior.coords)[:4]
    e = [LineString([c[i], c[(i + 1) % 4]]) for i in range(4)]
    # long axis runs between the midpoints of the two SHORT edges
    s1, s2 = (e[1], e[3]) if e[0].length >= e[1].length else (e[0], e[2])
    ax = LineString([s1.interpolate(.5, normalized=True), s2.interpolate(.5, normalized=True)])
    n = int(ax.length // SPACING)
    return [ax.interpolate(SPACING / 2 + i * SPACING) for i in range(n)]
pts = [(i, p) for i, g in enumerate(sw.geometry) for p in axis_points(g)]
cand = gpd.GeoDataFrame({'sw': [i for i, _ in pts]}, geometry=[p for _, p in pts], crs=3826)
cand = cand[cand.within(sw.geometry.iloc[cand.sw].reset_index(drop=True).buffer(0.01).set_axis(cand.index))]

xy = lambda f: gpd.GeoDataFrame(geometry=gpd.points_from_xy(*pd.read_csv(R+f)[['TWD97X', 'TWD97Y']].values.T), crs=3826)
trees = pd.concat([xy('TaipeiTree.csv'), xy('TaipeiParkTree.csv')], ignore_index=True)
pits = gpd.read_file(R+'sidewalk_treepit.json').set_crs(3826, allow_override=True)
near = lambda g, d: gpd.sjoin(cand.assign(geometry=cand.buffer(d))[['geometry']], g[['geometry']], predicate='intersects').index.unique()
cand = cand.drop(near(trees, TREE_GAP).union(near(pits, PIT_GAP)))
v = gpd.read_file(R+'taipei_villages.geojson').to_crs(3826)
cand = gpd.sjoin(cand, v[['VILLCODE', 'geometry']], predicate='within').drop(columns='index_right')
cand['road'] = sw.NAME_Road.iloc[cand.sw].values; cand['eff_width_m'] = sw.SWW_WTH.iloc[cand.sw].values
print(f'wide sidewalks: {len(sw)}  new-pit candidates: {len(cand)}  in {cand.VILLCODE.nunique()} 里')
c = cand.to_crs(4326); c['lon'] = c.geometry.x.round(6); c['lat'] = c.geometry.y.round(6)
c.reset_index(drop=True)[['VILLCODE', 'lon', 'lat', 'road', 'eff_width_m']].to_csv(D+'new_spots.csv', index_label='spot_id')
