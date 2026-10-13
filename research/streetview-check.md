# Street View spot-check: "15,536 empty tree pits"

2026-10-13. An instrument check on `data/derived/empty_pits.csv`, which `analysis/score.py` builds from 樹穴 polygons in `sidewalk_treepit.json` that have no census tree (TaipeiTree + TaipeiParkTree) within `EMPTY_BUF_M = 2.0` m.

**Verdict: don't quote 15,536 as "empty pits".** In this sample about 1 in 7 flagged pits is actually empty. The best estimate is about 1,700 to 2,200 truly empty pits, with a 95% range of about 900 to 4,900. Two-thirds of the flagged pits have a living tree.

## Method

- **Sample.** 30 pits drawn with `random_state=7`. 10 come from `planned == True` (the pits the plan would plant) and 20 from the other rows, at most 2 per district before subsampling, so the sample covers all 12 districts. District = VILLCODE digits 6–8.
- **Imagery.** Google Street View, read at the pano that the `map_action=pano` deep link snaps to. For each pit I computed the bearing and distance from the pano to the pit centroid (`hd.py` in the session scratchpad), re-opened the pano at that heading and judged the object at that bearing and distance. When the deep link snapped to a user photo or an indoor photosphere, I opened official car imagery by clicking the coverage line instead (pit 12600). I didn't log in and didn't click any dialogs.
- **Distances.** Pano-to-pit distances were 2–15 m, except 27 m for pit 12314. The pano's GPS and the pit centroid are each off by a few metres, so a "2 m" judgment from imagery is really a judgment within about 3–5 m.
- **Census distance.** The `census tree m` column is the distance from the pit centroid to the nearest census tree, computed afterwards from the same tree files `score.py` uses.

## Results

| pit_id | district | lat, lon | planned | class | imagery date | census tree m | note |
|---|---|---|---|---|---|---|---|
| 10482 | Zhongzheng | 25.030464, 121.50659 | yes | **NO_PIT** | 2025-02 (SV car) | 27.2 | MRT construction fence zone on Xizang Rd; no pit visible at bearing |
| 8046 | Da'an | 25.028832, 121.539255 | yes | **HAS_TREE** | 2016-11 (user photosphere) | 124.4 | large street tree ~4 m at bearing on tree-lined sidewalk; old/user imagery, low confidence |
| 5174 | Datong | 25.06814, 121.518559 | yes | **UNCLEAR** | 2025-11 (user handheld); SV car only 2012 | 8.5 | handheld scooter photo, geolocation too loose for 2 m call; tree row on sidewalk |
| 4203 | Beitou | 25.117686, 121.516691 | yes | **EMPTY_PIT** | 2025-03 (SV car) | 6.9 | shrub-filled corner planter with utility cabinets + sign; big tree ~3 m behind |
| 10374 | Xinyi | 25.030852, 121.558395 | yes | **HAS_TREE** | 2025-01 (SV car) | 4.7 | regular tree row, tree at bearing ~7 m |
| 10667 | Da'an | 25.041843, 121.537666 | yes | **HAS_TREE** | 2024-12 (SV car) | 6.7 | continuous planting strip, tree at bearing |
| 12600 | Zhongzheng | 25.031097, 121.513874 | yes | **HAS_TREE** | 2025-05 (SV car) | 14.1 | two large trees at bearing (deep link hit indoor photosphere; used map coverage click) |
| 13788 | Xinyi | 25.037077, 121.559281 | yes | **EMPTY_PIT** | 2025-02 (SV car) | 10.4 | pit with a cut STUMP, groundcover; tree removed |
| 6305 | Zhongzheng | 25.029529, 121.513715 | yes | **HAS_TREE** | 2025-05 (SV car) | 20.6 | large banyan at bearing ~11 m |
| 4517 | Da'an | 25.032491, 121.54373 | yes | **EMPTY_PIT** | 2025-01 (SV car) | 7.7 | grass-filled pit, lamp post at edge, scooters parked around |
| 14555 | Songshan | 25.057211, 121.550767 | no | **HAS_TREE** | 2025-04 (SV car) | 27.6 | young small tree at bearing beside construction hoarding (building under renovation) |
| 5662 | Da'an | 25.042092, 121.535702 | no | **HAS_TREE** | 2023-04 (SV car) | 6.4 | planting strip with tree row; trunk near bearing ~12 m, moderate confidence |
| 4733 | Datong | 25.058125, 121.51531 | no | **HAS_TREE** | 2025-02 (SV car) | 111.5 | thin deciduous tree at bearing ~7 m among scooter parking |
| 15409 | Wanhua | 25.036091, 121.491806 | no | **HAS_TREE** | 2025-05 (SV car) | 32.3 | large banyan in the planter at bearing; fresh pruning logs stacked beside it |
| 7015 | Xinyi | 25.038139, 121.586787 | no | **NO_PIT** | 2025-10 (SV car) | 5.7 | plain paved sidewalk along school fence, no pit within view of the spot |
| 12547 | Shilin | 25.085828, 121.523504 | no | **HAS_TREE** | 2025-02 (SV car) | 5.5 | newly planted staked sapling in a pit at bearing ~13 m (planted after census) |
| 4905 | Zhongzheng | 25.038381, 121.523194 | no | **HAS_TREE** | 2025-05 (SV car) | 4.4 | tree trunks at bearing ~11 m in park-edge sidewalk strip |
| 4274 | Nangang | 25.03487, 121.615757 | no | **HAS_TREE** | 2022-09 (SV car) | 5.7 | tree in a grass pit at bearing ~15 m, park-edge corner |
| 13605 | Wanhua | 25.04351, 121.501528 | no | **HAS_TREE** | 2025-02 (SV car) | 69.8 | tree at bearing ~5 m in sidewalk among scooter parking |
| 9810 | Songshan | 25.064412, 121.565661 | no | **NO_PIT** | 2025-05 (SV car) | 11.1 | point falls at an intersection corner; corner sidewalk paved, potted plants only; moderate confidence |
| 15139 | Beitou | 25.124421, 121.469082 | no | **EMPTY_PIT** | 2024-01 (SV car) | 39.7 | hedge/shrub-filled planters at bearing, no tree; benches + bin between; moderate confidence |
| 1396 | Zhongshan | 25.079368, 121.540158 | no | **NO_PIT** | 2025-02 (SV car) | 5.7 | cement-patched sidewalk (looks like a filled former pit) in front of a scaffolded construction site |
| 5327 | Shilin | 25.102967, 121.525407 | no | **HAS_TREE** | 2022-11 (SV car) | 7.2 | tree-lined Zhongshan N Rd Sec 6; trunk at bearing ~6 m |
| 5027 | Nangang | 25.057813, 121.605527 | no | **HAS_TREE** | 2025-10 (SV car) | 20.2 | freshly renovated sidewalk; young tree in pit ~1-2 m off bearing, ~10 m |
| 14137 | Beitou | 25.10523, 121.515753 | no | **NO_PIT** | 2025-03 (SV car) | 11.7 | pit point lies inside the intersection roadway (Wencheng Rd); corners nearby have trees; polygon misregistered or stale |
| 12314 | Datong | 25.062558, 121.510937 | no | **UNCLEAR** | 2025-05 (SV car, 27 m away) | 4.5 | nearest car pano 27 m; spot is inside a tree-planted plaza behind a fence, cannot resolve at 2 m |
| 15152 | Neihu | 25.081788, 121.562177 | no | **HAS_TREE** | 2025-02 (SV car) | 9.4 | tree in shrub pit at bearing ~6 m, Tiding Blvd |
| 9255 | Zhongzheng | 25.038617, 121.515391 | no | **HAS_TREE** | 2025-05 (SV car) | 3.1 | tree in grass pit beside pedestrian sign at bearing ~5 m |
| 4845 | Wenshan | 25.007985, 121.537727 | no | **HAS_TREE** | 2024-12 (SV car) | 6.2 | tree at bearing ~9 m among scooter parking, Tingzhou Rd |
| 6940 | Zhongshan | 25.083107, 121.539415 | no | **HAS_TREE** | 2025-02 (SV car) | 66.2 | young tree in corner pit at bearing ~6 m |

**Tally (n = 30):** HAS_TREE 19 · NO_PIT 5 · EMPTY_PIT 4 · UNCLEAR 2.

## Estimate

Share of EMPTY_PIT among the 28 classifiable pits, with a Wilson 95% interval:

| group | EMPTY_PIT / classifiable | share | 95% CI | implied count if applied to all 15,536 |
|---|---|---|---|---|
| all (unweighted) | 4 / 28 | 14.3% | 5.7% – 31.5% | **~2,200 (885 – 4,892)** |
| planned == True | 3 / 9 | 33% | 12% – 65% | — |
| others | 1 / 19 | 5.3% | 0.9% – 24.6% | — |

- **Weighting.** The sample oversamples planned rows: they are 33% of the sample but 20% of the population (3,164 / 15,536). Reweighting by stratum gives an empty share of about 11%, or **~1,700 pits**. A crude stratified normal interval runs from about 1% to 21%.
- **Planned subset.** It looks better: 3 of 9 are really empty. With n = 9 that difference isn't significant.
- **Caveat.** The 30 pits are a small sample, and imagery dates run from 2016 to 2025. Treat this as an order-of-magnitude correction, not a new number to quote.

## Patterns

1. **Most "empty" pits have a tree.** 19 of 28 classifiable pits show a living tree at the spot. There are two different causes:
   - **The 2 m buffer is too tight (9 of 19).** The nearest census tree is only 3–8 m from the pit centroid, so it is almost certainly the tree I saw. The census point and the pit polygon don't line up within 2 m. The same mismatch shows across the whole file:

     | buffer | pits with no census tree inside |
     |---|---|
     | 2 m | 15,536 |
     | 3 m | 14,469 |
     | 5 m | 12,373 |
     | 8 m | 9,840 |

   - **Real census gaps (10 of 19).** The nearest census tree is 9–124 m away. These include young or recent plantings such as a staked sapling (12547), a young tree on a just-renovated sidewalk (5027) and a young corner tree (6940). They also include mature trees missing from the census on tree-lined streets (8046, 4733, 13605, 15409).
2. **Pits that are gone (5).** They were paved over or cement-patched in front of a construction site (1396), sit inside an MRT construction zone (10482), are plain paving (7015), or fall in an intersection roadway (14137, 9810). These look like stale 2020 polygons or misregistered ones near intersections.
3. **The empty pits are mostly not bare soil.** One holds a cut stump (13788). One is grass-filled with a lamp post on its edge (4517). Two are shrub or hedge planters (4203, which also has utility cabinets; 15139). So even the true empties need a site check (utilities, stump removal) before they count as plantable.
4. **Imagery source matters.** The `map_action=pano` link sometimes snaps to user-contributed photos or indoor photospheres, which are poorly geolocated. Official car imagery near some spots is old: only 2009 and 2012 near pit 5174. Both UNCLEAR rows are in Datong.

## Implications for the pipeline

- **Rename the metric** to "pits without a matched census tree", or re-derive it with a 5–8 m buffer. Then this spot-check should be re-run on the new set.
- **Before quoting any empty-pit count,** spot-check a larger planned subset (n ≈ 50) so the interval is narrower.
