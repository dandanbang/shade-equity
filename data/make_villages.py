# Usage: pip install pyshp; python3 -I data/make_villages.py  -> data/raw/taipei_villages.geojson (456 villages, lon/lat)
import shapefile, json
r = shapefile.Reader('data/raw/village_tgos_x/VILLAGE_NLSC_1150817', encoding='utf-8')
fs = [{'type':'Feature','properties':sr.record.as_dict(),'geometry':sr.shape.__geo_interface__}
      for sr in r.shapeRecords() if sr.record['COUNTYNAME'] == '臺北市']
json.dump({'type':'FeatureCollection','features':fs}, open('data/raw/taipei_villages.geojson','w'), ensure_ascii=False)
print(len(fs))
