# 一樹同仁 — plan v0 (2026-10-13, awaiting the team's alignment)

## One line
Taipei already has the holes. We tell the city exactly where to put the 3,164 trees back — shade-poor neighborhoods first — and let anyone verify it.

## Verified numbers (analysis/quickcheck.py, data fetched 2026-10-13)
- 50,904 sidewalk 樹穴 polygons; 12,374–17,385 have NO recorded tree within 5 m / 1 m (street + park tree points). = 4–5× the 3,164 removed. UNVERIFIED on the ground: tree census is "in progress"; must Street-View-sample ~50 before quoting.
- Street trees per 1,000 residents: 文山 16.9, 萬華 19.3 … 南港 58.0 (3.4× gap). Caveat: 文山/北投 have mountain forest → need canopy (WorldCover) not just street trees.
- 27 of 456 里 have zero street trees; e.g. 泰和里 (信義) 7,104 people, 0 trees.
- 65+ share by district 21–27% (萬華 highest 27.1%).

## MVP (1 map, 1 number, 1 button)
1. Map: per-里 shade-equity score = canopy gap × need (65+/<12 share, heat, pedestrian demand). TES formula from American Forests.
2. Button 「種回 3,164 棵」: allocate to empty pits, highest-need 里 first → ranked list, downloadable work order (CSV + Street View link per pit). Compare vs even allocation: "same trees, X% more vulnerable people shaded".
3. Citizen verify: click a pit → Street View → 空的 / 有樹 / 不能種. Crowd fixes the data gap; open-source loop.
4. README: real vs simulated labelled; 100-day plan.

## Decided (the team, 2026-10-13)
- Concept: Replant planner, with the per-里 equity score as its map layer.
- Need factors (TES-style, equal weight): 65+/<12 share (TES dependency ratio), heat (Landsat LST anomaly), income (財政部 村里 綜合所得稅 median, real data), foot traffic (bus/MRT/school/market/care-site density; from Phoenix people-first shade + 3-30-300 '3 trees seen'; not in TES).
- Citizen Street View verification: in v1, simple (空的/有樹/不能種).
- Citizen tree guardian (adopt/email-a-tree, removal alerts): 100-day plan, not v1.
- Hosting: public repo on the team's GitHub + GitHub Pages (2026-10-13).
- Verification store: Supabase free tier, shared/live (2026-10-13). the team creates the project; we need URL + anon key.
- 2026-10-13 instrument check (research/streetview-check.md): only ~1 in 7 "empty" pits is truly empty (4/28; est. 1,700–2,200, CI 885–4,892). 10/19 trees seen were missing from the census. Headline changed: the data itself is the bug → citizen verification is the core loop, not a side feature.
- Repo name approved: dandanbang/shade-equity (2026-10-13).
