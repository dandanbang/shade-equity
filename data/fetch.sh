#!/usr/bin/env bash
# Reproduces data/raw/. Run: bash data/fetch.sh   (needs curl, unzip; python3 + pyshp for village GeoJSON step)
set -euo pipefail
cd "$(dirname "$0")/raw"
DT=https://data.taipei/api/dataset
TP=https://tppkl.blob.core.windows.net/blobfs
# 1-2. Street/park trees + tree holes (Parks & Street Lights Office, hourly-refreshed)
for f in TaipeiTree.csv TaipeiTree.json TaipeiTreeHole.csv TaipeiParkTree.csv TaipeiParkTree.json; do curl -fsSL -o $f $TP/$f; done
curl -fsSL -o parks_basic.json https://parks.gov.taipei/parks/api/
# 3-4. Sidewalk tree pits (data.gov.tw 134908) and sidewalk extents (data.taipei 715d3a83)
curl -fsSL -o sidewalk_treepit.json $DT/693705fa-4604-4207-bd50-8a9ce9fcfbc6/resource/3e2b359b-8dae-46e4-a747-5912d8743d0e/download
curl -fsSL -o sidewalk_extent.json  $DT/715d3a83-8445-4496-b6bf-b0900538b7e7/resource/b11d6142-1d71-41d5-a843-7b7cfcea61ef/download
# 5. Equity: population by village x age (Big5 CSV), village boundaries (national SHP, TWD97[2020] lon/lat)
curl -fsSL -o pop_by_li_112_now.csv $DT/a6394e3f-3514-4542-87bd-de4310a40db3/resource/c8f5b53d-ef3d-4321-ae8e-58cd2a5ee73c/download
curl -fsSL -o pop_by_li_111.csv     $DT/a6394e3f-3514-4542-87bd-de4310a40db3/resource/a92f4f08-9c3c-4122-98ce-00a3c38ece06/download
curl -fsSL -o village_tgos.zip "https://www.tgos.tw/tgos/VirtualDir/Product/a04697c8-64db-450a-a105-3eb471c45abd/村(里)界(TWD97經緯度).zip"
mkdir -p village_tgos_x && unzip -oq village_tgos.zip -d village_tgos_x
#   -> filter COUNTYNAME=='臺北市' to taipei_villages.geojson with pyshp (456 villages); python3 -I data/make_villages.py
# 7. Canopy/land cover: ESA WorldCover 2021 tile covering Taipei (14 MB)
curl -fsSL -o worldcover_2021_N24E120_tile.tif https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_N24E120_Map.tif
# 8. Pedestrian demand
curl -fsSL -o mrt_exits.csv           $DT/cfa4778c-62c1-497b-b704-756231de348b/resource/307a7f61-e302-4108-a817-877ccbfca7c1/download
curl -fsSL -o mrt_hourly_od.csv       $DT/63f31c7e-7fc3-418b-bd82-b95158755b4d/resource/eb481f58-1238-4cff-8caa-fa7bb20cb4f4/download
curl -fsSL -o markets_traditional.csv $DT/89bebb3a-990d-4070-bd67-631a575f6d4a/resource/35acfce1-2c4d-4c70-aa75-601cdab2b3f7/download
curl -fsSL -o busstop_shp.zip         $DT/48aa5bca-2a4f-4fb7-a658-43cba51d5d56/resource/dfd68d8e-d3b9-44df-b614-8850c103239f/download
mkdir -p busstop_extracted && unzip -oq busstop_shp.zip -d busstop_extracted
curl -fsSL -o elder_community_care_sites.csv $DT/d082dc87-d3fd-479d-89c6-745ff1be955a/resource/11930dc6-4092-4bde-a42c-7722e0416462/download
# OpenStreetMap (ODbL) via Overpass: schools, health, elderly, markets. Needs a User-Agent.
q(){ curl -fsS --max-time 100 -A "shade-hackathon/0.1" https://overpass-api.de/api/interpreter \
  --data-urlencode "data=[out:json][timeout:90];area[\"name\"=\"臺北市\"][admin_level=4]->.a;($1);out center tags;" -o "osm_$2.json"; sleep 5; }
q 'nwr(area.a)[amenity~"^(school|kindergarten)$"];' schools
q 'nwr(area.a)[amenity~"^(hospital|clinic)$"];' health
q 'nwr(area.a)[amenity=social_facility]["social_facility:for"~"senior"];nwr(area.a)[amenity=nursing_home];' elderly
q 'nwr(area.a)[amenity=marketplace];' markets
echo done
