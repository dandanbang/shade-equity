# 一樹同仁 · 台北樹蔭公平計畫

**去年台北移除了 3,164 棵樹。這份計畫把它們先種回最熱、最缺樹蔭的里，並讓市民一起用街景把市府的樹木資料修正確。**

**網站：** https://dandanbang.github.io/shade-equity/ · **方法與資料：** [about.html](https://dandanbang.github.io/shade-equity/about.html)

市政 debug松 題目 #1「把三千棵樹種回來」參賽作品。開源、可重現、**沒有使用任何模擬資料**。

> English: a shade-equity plan for Taipei. It scores every neighborhood (里) with the Tree Equity Score method, allocates replacement trees need-first, and lets citizens verify planting sites in Street View. Code MIT; see the sections below for how to run it.

## 它做什麼
- **每個里的樹蔭公平分數**：樹冠離 30% 目標還差多少 × 需要程度。需要程度＝四項平均：地表高溫（Landsat 衛星）、老人與小孩比例、所得（財政部各里資料）、人潮。方法來自美國 [American Forests Tree Equity Score](https://treeequityscore.org/methodology)，改用台北資料。
- **種樹順序**：每一棵樹都分給「能讓公平分數進步最多」的里。同樣 3,164 棵樹，平均分配只有 15.6% 種到最需要的 20% 里；需要優先排序是 46.4%，約 3 倍。
- **種樹點**：人行道上的空樹穴（待確認），加上寬度 ≥ 2.5 公尺、可以新挖樹穴的人行道（需現勘）。周圍已有 50% 以上樹冠的點不列入（Meta 1 公尺樹冠高度圖）。
- **市民確認**：街景抽查發現，資料上「沒有樹」的樹穴只有約 1/7 真的空著（[research/streetview-check.md](research/streetview-check.md)）。任何人都可以把種樹點標成「空的／已經有樹／不能種」，結果存在共用資料庫（Supabase）。
- **施工清單**：每個里可以下載 CSV，包含座標、街景連結和確認結果，給里長、議員或公園處使用。

## 自己跑一次
```bash
bash data/fetch.sh                      # 下載公開資料（清單見 data/MANIFEST.md）
uv venv .venv && uv pip install --python .venv/bin/python geopandas rasterio pyproj shapely pandas
make all                                # 計算分數與種樹順序 → web/data/
make serve                              # 打開 http://localhost:8765
```
共用的市民確認（選用）：建立免費 Supabase 專案，執行 `supabase/schema.sql`，把網址和 anon key 填進 `web/config.js`。

## 資料夾說明
| 路徑 | 內容 |
|---|---|
| `data/` | `fetch.sh`、各資料層的產生程式（`make_*.py`）、`MANIFEST.md`（每份資料的來源、授權、座標系統） |
| `analysis/score.py` | 公平分數＋種樹順序 → `data/derived/` |
| `analysis/new_spots.py` | 寬人行道上可新增樹穴的候選點 |
| `web/` | 網站（MapLibre GL，靜態網頁，不需要建置） |
| `research/` | 方法研究、黑客松說明、開源工具調查、街景抽查、設計稽核 |
| `supabase/schema.sql` | 只能新增、不能修改的確認紀錄表＋統計 view |

## 帶到你的城市
分數只需要五層資料：樹冠、各年齡人口、所得、溫度、步行目的地。Meta 樹冠圖、Landsat 和 OpenStreetMap 全球都有；全台每個村里都有人口年齡與所得資料。下一個是臺中（有逐棵樹木座標）。詳見 [research/scout.md](research/scout.md) 與 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 授權
程式碼：MIT。資料維持原始授權（政府資料開放授權條款 1.0、CC BY 4.0、ODbL、公共領域），見 [LICENSE](LICENSE) 與 [data/MANIFEST.md](data/MANIFEST.md)。

AI 使用說明：以 Claude Code（Anthropic）協作開發。關鍵數字都經過人工檢查（街景抽查、每個資料產生程式內建的合理性檢查）。
