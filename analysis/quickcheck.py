import pandas as pd, geopandas as gpd, json
R='data/raw/'
t=pd.read_csv(R+'TaipeiTree.csv').drop_duplicates('TreeID')
t=gpd.GeoDataFrame(t,geometry=gpd.points_from_xy(t.TWD97X,t.TWD97Y),crs=3826)
v=gpd.read_file(R+'taipei_villages.geojson').to_crs(3826)
p=pd.read_csv(R+'pop_by_li_112_now.csv',encoding='big5',dtype={'區域代碼':str})
p=p[(p['年份']==p['年份'].max())]; p=p[p['月份']==p[ '月份'].max()]; p=p[p['性別']=='計']
ages=[c for c in p.columns if c.endswith('歲數量') or c.endswith('以上')]
def n(c): return int(c.replace('歲數量','').replace('歲以上',''))
p['old']=p[[c for c in ages if n(c)>=65]].sum(1); p['kid']=p[[c for c in ages if n(c)<12]].sum(1)
v=v.merge(p[['區域代碼','總計','old','kid']],left_on='VILLCODE',right_on='區域代碼',how='left')
j=gpd.sjoin(t[['geometry']],v[['VILLCODE','geometry']],predicate='within')
v['trees']=v.VILLCODE.map(j.VILLCODE.value_counts()).fillna(0)
v['area_km2']=v.area/1e6
d=v.groupby('TOWNNAME')[['trees','總計','old']].sum()
d['trees_per_1k']=(d.trees/d['總計']*1000).round(1); d['old%']=(d.old/d['總計']*100).round(1)
print(d.sort_values('trees_per_1k').to_string())
v['tp1k']=v.trees/v['總計']*1000; v['old%']=v.old/v['總計']*100
print('\n里 with 0 street trees:',(v.trees==0).sum(),'of',len(v))
print('Worst 10 里 (pop>3000) by trees/1k:'); print(v[v['總計']>3000].nsmallest(10,'tp1k')[['TOWNNAME','VILLNAME','總計','trees','old%']].to_string())
# empty pits
pits=gpd.read_file(R+'sidewalk_treepit.json'); pits=pits.set_crs(3826,allow_override=True)
pits=pits[pits.Name=='樹穴']
allt=pd.concat([t[['geometry']],gpd.GeoDataFrame(geometry=gpd.points_from_xy(*pd.read_csv(R+'TaipeiParkTree.csv')[['TWD97X','TWD97Y']].values.T),crs=3826)])
for b in (1,2,3,5):
    pb=pits.copy(); pb['geometry']=pits.buffer(b)
    hit=gpd.sjoin(pb[['geometry']],allt,predicate='contains').index.nunique()
    print(f'buffer {b}m: pits {len(pits)} empty {len(pits)-hit}')
print('pit area m2 median',pits.area.median().round(2),'p90',pits.area.quantile(.9).round(1))
print('pit bounds',pits.total_bounds,' tree bounds',t.total_bounds)
