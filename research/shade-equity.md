# Shade equity research — Track #1 把三千棵樹種回來
Compiled 2026-10-13. Every claim has a URL. "Search summary" = a secondary source; open it before putting a number on a slide.

## 0. Taipei context (the problem)
- **3,164 trees removed in 2025** (公園處). 2,630 of them (>80%) for "natural" causes (death, rot, pests, storms); the rest for car strikes or roots lifting pavement. City says 13,225+ trees planted 2025–26 across 公園處/大地處/都發局. https://newtalk.tw/news/view/2026-07-12/1046702 · https://newtalk.tw/news/view/2026-07-13/1046868
- Councilor 洪婉臻: 3,164 (2025) + 1,425 (2024) = **4,589 trees lost in 2 years**, per 公園處 replies. https://www.nownews.com/news/6855924
- **東門市場 茄苳:** the 4/23 site survey ruled the pit too small and chose transplant to a green space. The contractor removed the tree instead. 公園處 fined the contractor and claimed **NT$325,210** under 行道樹管理維護自治條例 §7/§12; the mayor said "嚴懲不貸". https://news.ltn.com.tw/news/life/breakingnews/5581019 · https://news.ltn.com.tw/news/politics/breakingnews/5581171
- Taipei has **~94,000 street trees** (end of June 2025, +219 y/y). https://www-ws.gov.taipei/001/Upload/367/relfile/46908/8905085/cc9a67a9-c91e-4dd8-a8bf-dfa15a784f39.pdf (市政統計週報, via search summary)
- Our local copy `data/raw/TaipeiTree.csv` has **90,441 street trees** with TWD97 X/Y, species, DBH and height. By district: 大安 12,991 · 北投 11,663 · 士林 10,459 · 中山 9,202 · 松山 7,965 · 內湖 7,525 · 中正 6,675 · 信義 6,635 · 南港 6,502 · 文山 4,298 · 大同 3,300 · **萬華 3,226 (lowest; 4× fewer than 大安)**. (Computed here. Join 民政局 district population before stating per-capita.)
- **Heat:** Taipei warmed **1.8°C in ~100 years vs 1.2°C globally**, second in Asia after Beijing (林子平 research). Record high **39.7°C on 2020-07-24**, the highest at the station since 1896. The heat core 萬華/中正 has spread to 士林, 信義 and 內湖 (2020–23). https://health.tvbs.com.tw/life/348738 · https://city.gvm.com.tw/article/113843
- The 台北 station had the fastest rise in hot days of 6 stations over 30 years (臺灣氣候變遷分析系列報告). https://rsprc.ntu.edu.tw/zh-tw/media-exposure/reports/650-1060416-heat-island-effect.html
- Taiwan heat-injury visits: **3,942 in 2024 (peak)**, over 3,000 in 2025. Men outnumber women 3:1, which points to outdoor work. 國健署 lists 65+ as high-risk. https://www.thenewslens.com/article/268101 · https://www.cna.com.tw/news/ahel/202407310249.aspx
- Taipei has been a "super-aged" city since 2022: 65+ = **22.5%** of residents (June 2024, 民政局). https://www-ws.gov.taipei/001/Upload/367/relfile/46908/9259514/55386b21-7731-4560-bfa6-3334064b1e0b.pdf (search summary)

## 1. Frameworks and metrics
**American Forests Tree Equity Score (TES)**, scored per US census block group. https://treeequityscore.org/methodology
- *Canopy goal:* starts from a biome baseline and is lowered by **building density** (share of land covered by building footprints, from Microsoft Building Footprints), because buildings take plantable space. Examples: forest biome 50% goal where buildings cover <14% of land, falling to 20% where they cover >30%; desert 15% at every density. https://council.cleanairpartnership.org/wp-content/uploads/2025/01/Tree-Equity-Clean-Air-Partnership-Presentation-January-2025.pdf
- *Gap* = goal − existing canopy, floored at 0, then divided by the largest gap in the urban area (scaled 0–1).
- *Priority index E:* **7 variables, equal weight (1/7 each)**: share of people below 200% of poverty; unemployment rate; share not white non-Hispanic; dependency ratio ((0–17 + 65+) / 18–64); linguistic isolation; health (poor physical/mental health, asthma, heart disease); heat (block-group temperature minus urban-area average). Each variable is min-max normalized. **E = 0.1 + 0.9 × mean(N1..N7)**, so E ranges 0.1–1. https://treeequityscore.org/methodology · https://documents.ottawa.ca/sites/default/files/Tree%20Equity%20Score%20Analysis%20and%20Results.pdf
- *Score:* **TES = 100 × (1 − GapScore × E)**. 100 means the goal is met; lower means plant here first. Phoenix uses TES to steer planting. https://planetizen.com/node/132806
- Ottawa adapted TES to Canadian census tracts and set canopy goals by "urban transect" (core/inner/suburb), so old dense cores are not compared with new suburbs. That fits Taipei's 12 districts and ~456 里. https://documents.ottawa.ca/sites/default/files/2025%20Tree%20Equity%20Scores%20by%20Transect.pdf

**3-30-300 (Konijnendijk, J. Forestry Research 2023):** 3 trees visible from every home, school and workplace; 30% canopy in every neighbourhood; ≤300 m to the nearest public green space. Barcelona, Vancouver and Canberra have written parts of it into policy. Konijnendijk calls the evidence for "30" and "300" "quite strong". https://doi.org/10.1007/s11676-022-01523-z · https://pmc.ncbi.nlm.nih.gov/articles/PMC9415244 · https://www.tdag.org.uk/uploads/4/2/8/0/4280686/konijnendijk_tdag_february_2023.pdf
- The 沈伯洋 campaign already cites 3-30-300 and puts Taipei's 綠覆率 at ~18%. https://udn.com/news/story/124652/9626067

**Shade-specific planning**
- *Phoenix Shade Phoenix Plan:* moves from a canopy-% target to a people-first shade target. US$60M plan, **27,000 native trees + 550 shade structures**, **>90% of resources to low/moderate-income areas**. https://planning.org/planning/2026/jun/phoenixs-first-of-its-kind-plan-shows-shade-is-more-than-just-trees/ · https://planetizen.com/node/132806
- *Tempe:* Urban Forestry Master Plan (2017) targets **25% tree+shade canopy by 2040**, up from 14.4%. The Tree Stewards program targets heat-vulnerable neighbourhoods. https://tempe.gov/home/showdocument?id=54581 · https://arizona.uli.org/the-right-shade-in-the-right-place/
- *LA Cool Streets / Cool Neighborhoods:* cool pavement plus street trees in the hottest, most vulnerable neighbourhoods. Phase 2 (2021): **60 miles of cool pavement + ~2,000 trees** in 8 neighbourhoods. https://dpw.lacity.gov/blog/cool-streets-la-kicks · https://www.cbsnews.com/losangeles/news/la-cool-streets-program
- *Barcelona:* tree master plan "Arbres per viure" (2017–37) goes **from 25% to 30% canopy** in 20 years. The Shade Program reports 62% of public space shaded and targets 200+ new shaded spaces by 2027. Climate shelters grew from ~200 (2022) to **400 (2025)** to 500+ (2026), with **99% of residents within a 10-minute walk** of one. https://www.3cat.cat/3catinfo/barcelona-tindra-arbres-millors-mes-diversos-i-mes-resistents/noticia-amp/2767851/ · https://barcelonasecreta.com/en/shaded-areas-barcelona/ · https://xarxaenxarxa.diba.cat/sites/xarxaenxarxa.diba.cat/files/xarxa_refugis_bcn_estiu_2025_sessio_a_diba_v2.pdf · https://www.moncloa.com/2026/06/16/refugios-climaticos-barcelona-verano-3385427/
- *WRI Cool Cities Lab:* 1 m shade maps from open-source SOLWEIG at 15:00 on the hottest day of the last 5 years, plus a "shade change" layer for planting scenarios. https://coolcities.wri.org/data-and-methods/shade · https://coolcities.wri.org/data-and-methods/shade_change

**Which metric is simplest to compute from tree points + population + heat?** A **per-里 "Shade Gap" = TES-lite**:
- Canopy proxy: sum of each tree's crown area (crown radius estimated from DBH or height), divided by sidewalk area (`sidewalk_treepit.json`) or by 里 area.
- Gap: a local goal (e.g. 30% from 3-30-300) minus that proxy.
- Priority: equal-weighted min-max of 65+ share, child share, low-income households (低收/中低收) and an LST heat anomaly.
- Score: TES = 100(1 − gap × E).
This can be computed in pandas in about an hour, and TES gives the method published credibility.

## 2. Exemplar cities: mechanism, public tool, outcome
| City | Mechanism | Public tool | Outcome |
|---|---|---|---|
| **Singapore** | OneMillionTrees (since Apr 2020) plants in streets, parks and park connectors. For tight streets: **structural soil/cells under pavement** carry traffic loads while giving roots room; container trees (27 on Cashew Rd). Nature Ways: 150 km, aiming for 300 km by 2030. Trees lost to development are replaced separately from the 1M count. | **Trees.sg**: 500k+ trees mapped individually, 1,000+ species; residents flag flowering trees and post photos | **>750,000 planted by Feb 2025**; NParks page says 823,963; on track to finish ~2027, ahead of the 2030 target. Goal: every household within a 10-min walk of a park by 2030 |
| **Melbourne** | Urban Forest Strategy: public-realm canopy from **22% to 40% by 2040**. Needs **≥3,000 trees/yr** plus footpath extensions and planting into the carriageway beyond the kerb | **Urban Forest Visual**: every tree has an ID and an **email address**; 10k+ "love letters" sent | Precinct plans mostly delivered by 2020; no final canopy readout found |
| **Paris** | Plan Arbre 2020–26: **170,000 trees** in streets, mini-forests and on the périphérique; ~200 measures | `les-arbres` open dataset (CSV/Parquet, public domain) | **130,000 planted in 5 years** (June 2025). Critics say many saplings are Miyawaki plantings that may not survive |
| **NYC** | Decadal volunteer census (TreesCount! 2015) | Street Tree Map + NYC OpenData | **666,134 street trees** mapped by volunteers using phones (May 2015–Oct 2016) |
| **Barcelona** | Superilles; Arbres per viure (25%→30%); climate-shelter network | Refugis climàtics map | 400–500 shelters, 99% of residents within 10 minutes |
| **Medellín** | **30 green corridors** along roads and streams; 880,000 trees + 2.5M plants; US$16.3M to build, US$625k/yr to maintain | Ashden Cooling-by-Nature award 2019 | ~**2°C citywide**. At corridor sites, air temperature fell 31.6→27.1°C and surface temperature 40.5→30.2°C (2016–19) |
| **Seoul** | Wind-path forests: dense tree lines along rivers and roads channel cool night air from mountains into the core. Phase 1 (2021): 540k trees, 189 ha, 6 districts | — | City claims **up to 7°C** downtown in summer (modelled). Measured at Gyeongui Line park: Tmrt −11.25°C, PET −5.84°C |

Sources by row:
- Singapore: https://www.mnd.gov.sg/newsroom/speeches/view/written-answer-by-ministry-of-national-development-on-update-on-progress-of-onemilliontrees-movement-and-extent-of-singapore's-green-cover · https://nparks.gov.sg/treessg/one-million-trees-movement · https://www.tech.gov.sg/media/technews/the-inside-story-of-how-nparks-mapped-500000-trees-in-singapore-on-treessg · https://nparks.gov.sg/-/media/nparks-real-content/about-us/annual-report/archive/2010-2011/08_nparks_ar2011_flourishinginnovat.pdf
- Melbourne: https://aiph.org/green-city/guidelines/case-studies/surveying-melbournes-trees/ · https://www.goodgoodgood.co/articles/melbourne-urban-forest-tree-emails
- Paris: https://cdn.paris.fr/presse/2025/06/21/88ed12537c03c6ee189752fb8199150d.pdf · https://www.data.gouv.fr/datasets/les-arbres-paris · https://www.linfodurable.fr/paris-plus-de-20000-arbres-plantes-pendant-lhiver-selon-la-mairie-31905
- NYC: https://catalog.data.gov/dataset/2015-street-tree-census-tree-data · https://www.citizenscience.gov/catalog/217
- Medellín: https://www.preventionweb.net/news/colombia-green-corridors-help-reduce-heat-risk-medellin · https://www.unep.org/pt-br/noticias-e-reportagens/reportagem/cidade-colombiana-adota-solucoes-naturais-para-combater-o-calor
- Seoul: https://www.koreatimes.co.kr/amp/southkorea/environment-animals/20230815/seoul-expands-forests-to-introduce-wind-paths-for-cleaner-air · https://scholarworks.gnu.ac.kr/handle/sw.gnu/73552

## 3. Evidence on benefits
- **Mortality:** at 30% tree cover, 93 European cities (57M people) would have avoided **2,644 of 6,700 heat-island deaths (~1/3)** in summer 2015, with cities cooling **0.4°C** on average. Mean current tree cover in those cities is 14.9%. This is a model result (Iungman et al., Lancet 2023). https://doi.org/10.1016/S0140-6736(22)02585-5 · https://www.preventionweb.net/news/europe-trees-could-prevent-30-deaths-caused-urban-heat-islands
- **Shade works mainly through radiant heat, not air temperature:**
  - Seoul street trees: sun-vs-shade difference in mean radiant temperature (Tmrt) up to **27.1°C**; PET (felt temperature) 21–31% lower; air temperature only 0.2–1.5°C lower. https://oldlib.jejunu.ac.kr/handle/2020.oak/22545
  - Phoenix: shade cut PET by **7.7°C (95% CI 5.7–9.7)**. https://sustainability-innovation.asu.edu/docs/symposia/symp2016/Cayetano-etal.pdf
  - High-canopy streets were ~2.1°C cooler in air temperature and ~4.6°C better in felt temperature. https://da.lib.kobe-u.ac.jp/da/kernel/90004199/90004199.pdf
- **Siting multiplies benefit:** a tree on an **unshaded** street gives **1.5–2× more radiative cooling** to pedestrians than one where the sidewalk is already shaded. https://meetingorganizer.copernicus.org/ICUC12/ICUC12-654.html. This is the scientific case for an equity ranking.
- **Who suffers:**
  - Formerly redlined, lower-income US neighbourhoods are hotter in 94% of 108 cities (up to 9.5°F in Roanoke) (Hoffman et al. 2020). https://www.pbs.org/wnet/peril-and-promise/2020/01/redlined-neighborhoods
  - Lowest-income NYC areas trend toward higher heat mortality. https://academiccommons.columbia.edu/doi/10.7916/D8JD53WX
  - Low-income outdoor workers are especially exposed. https://www.networkforphl.org/resources/equitable-community-engagement-and-climate-change-two-toolkits/law-and-policy-pathways-to-community-centered-protections-from-extreme-heat/
  - In Taiwan, older people and outdoor workers lead heat-injury visits (§0).

## 4. Siting science: where a street tree can go
- **Taiwan design code (市區道路及附屬工程設計規範 §6.1):** sidewalk *clear* width should be ≥2.5 m, **normally ≥1.5 m, and ≥0.9 m at local pinch points**. A tree pit takes **~1–1.5 m** of width (人行道設計手冊). Keep **≥20 cm** between the outermost edge of any facility and the curb line. Rule of thumb: a sidewalk needs about **2.5–3 m total** to fit a new pit and still leave 1.5 m clear. https://myway.nlma.gov.tw/upload/imas/解說簡報--113市區道路及附屬工程設計規範修正.pdf · https://www.nlma.gov.tw/uploads/files/396c1d966c72fab16aef050e88b6a3f6.pdf
- **臺北市行道樹管理維護自治條例 (rev. 2024-10-21):**
  - 公園處 is the authority. 植穴/植栽帶 is a legally defined space.
  - Utilities may go inside a pit only with permission and must keep an "appropriate distance" (the figure is set by 公園處 notice; not found).
  - §7: nobody may damage, move or remove a street tree without 公園處 consent.
  - https://laws.gov.taipei/Law/LawSearch/LawArticleContent/FL004003
- **How leading cities find spots:**
  - Melbourne models canopy, then widens footpaths and plants into the carriageway. https://aiph.org/green-city/guidelines/case-studies/surveying-melbournes-trees/
  - Singapore uses structural cells under pavement. https://nparks.gov.sg/-/media/nparks-real-content/about-us/annual-report/archive/2010-2011/08_nparks_ar2011_flourishinginnovat.pdf
  - The usual GIS screen is: sidewalk width ≥ threshold, minus a utility/pole buffer, minus driveways and corners, minus existing crowns.
- **Taipei data we already hold** (`data/raw`):
  - Street trees: 90,441 points.
  - **樹穴: 2,259 rows** (shape, length, area) in `TaipeiTreeHole.csv`. Empty or undersized pits are the cheapest "plant here" candidates, and the 東門 tree died in an undersized pit.
  - Sidewalk fixed-facility polygons: 56,720 features in `sidewalk_treepit.json`.
  - Pole layer (utility conflicts): https://data.gov.tw/dataset/134911
  - Per-tree removal history is browsable at https://geopkl.gov.taipei/ but not bulk-open, so simulate it (allowed by rules).

## 5. Open-source tools: reuse or beat
- **Tree Equity Score:** method plus downloadable US data (no Taiwan coverage). Reuse the *formula*, not the data. https://treeequityscore.org/methodology
- **OpenTrees.org (Steve Bennett):** aggregates 15M+ trees from 226 sources in 20 countries. Taipei is not listed, so contributing our data is an easy open-data win. https://www.geographyrealm.com/access-open-gis-data-for-almost-11-million-trees-with-opentrees/
- **i-Tree Eco (USDA):** free, Windows-only; turns an inventory into benefits ($, CO₂, stormwater). Too heavy for one day; cite its per-tree benefit logic instead. https://itreetools.org/
- **pybdshadow:** Python; building shadow polygons from OSM footprints plus heights (suncalc); computes sunshine hours on a grid. **Best fit for a 1-day "which sidewalk is sun-baked at 2pm" layer.** https://pybdshadow.readthedocs.io/
- **UMEP/SOLWEIG (QGIS):** gold standard for Tmrt and shade, but needs a DSM and met forcing; a multi-day job. https://umep-docs.readthedocs.io/en/latest/processor/Outdoor%20Thermal%20Comfort%20SOLWEIG.html
- **WRI Cool Cities Lab:** global SOLWEIG shade layers; check whether Taipei is covered before building our own. https://coolcities.wri.org/data-and-methods/shade
- **Shadiest-route precedent:** Amsterdam's UMEP shade weights per street segment, with open-source routing that trades shortest path against shadiest path. https://meetingorganizer.copernicus.org/ICUC12/session/54471&live
- **ShadeMap** (commercial web app) was not researched here.

## 6. MVP implications
- **Build "樹蔭缺口地圖 + 種樹清單":** a per-里 Shade Gap Score (TES formula: gap × equal-weighted 65+/children/low-income/heat), shown as a choropleth. Click a 里 to get a ranked list of concrete plantable spots: existing 樹穴, plus sidewalk segments ≥2.5 m wide with no tree within ~8 m and no pole within ~1.5 m. Rank by the score of the 里 each spot sits in.
- **Make the 3,164 tangible:** a counter "種回 3,164 棵". The user drags a slider (500 / 1,000 / 3,164 trees). The tool allocates greedily to the highest-gap 里 and shows the score change, plus "+X 位長者 now within shade" (65+ residents of the 里 that gain canopy).
- **Equity is the point:** the same 3,164 trees planted evenly vs gap-first produce different outcomes. Show both. The science backs gap-first: a tree on an unshaded street cools pedestrians 1.5–2× more (§3).
- **Fix the 東門 failure mode:** flag undersized pits (area under a threshold vs the tree's DBH) as "健檢" candidates. This maps directly onto the candidate's 路樹健檢 → 樹穴改善 → 移植 agenda, and a 100-day plan for 公園處 writes itself. Optional per-tree "寫信給樹" link, Melbourne-style.
- **Data honesty:** trees, pits, sidewalks and parks are real; removal history is simulated (say so in the README and in the demo). Skip SOLWEIG. Use pybdshadow only as a stretch goal for a 2pm-shadow layer.
- **Opening stat:** 「台北去年移除 3,164 棵樹。萬華區只有 3,226 棵行道樹，大安區有 12,991 棵，差 4 倍，而萬華正是台北熱島的起點。」 Back-up stat: 30% canopy prevents about 1 in 3 heat-island deaths (Lancet 2023).
