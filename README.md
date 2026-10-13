# 一樹同仁 · Shade Equity Planner

**把台北移除的 3,164 棵樹種回來，先種在最需要樹蔭的地方。**
Put Taipei's 3,164 removed trees back where shade is needed most, and let citizens fix the city's tree data along the way.

**Live:** https://dandanbang.github.io/shade-equity/ · **Method (中文):** [about.html](web/about.html)

Built for 市政 debug松 (track #1 「把三千棵樹種回來」). Open source, reproducible, no simulated data.

## What it does
- **Tree Equity Score per 里**: canopy gap to a 30% goal × need. Need is the average of heat (Landsat), dependency ratio (age), income (MOF by 里) and foot traffic. Method: [American Forests TES](https://treeequityscore.org/methodology), adapted for Taipei.
- **「種回 3,164 棵」**: a greedy allocator puts each tree where it raises equity most. The same trees, spread evenly, put 15.6% in the 20% neediest 里; need-first puts 46.4% there.
- **Planting sites**: suspected-empty sidewalk pits plus new-pit candidates on sidewalks ≥2.5 m wide. Spots already under ≥50% canopy are skipped (Meta 1 m canopy height).
- **Citizen verification**: a Street View check shows only ~1 in 7 "empty" pits is really empty ([research/streetview-check.md](research/streetview-check.md)). Anyone can mark a site empty / has tree / can't plant; votes are shared via Supabase.
- **Work orders**: CSV per 里 with coordinates, Street View links and citizen verdicts.

## Run it
```bash
bash data/fetch.sh                      # download open data (see data/MANIFEST.md)
uv venv .venv && uv pip install --python .venv/bin/python geopandas rasterio pyproj shapely pandas
make all                                # score + allocate → web/data/
make serve                              # http://localhost:8765
```
Optional shared votes: create a free Supabase project, run `supabase/schema.sql`, put the URL and anon key in `web/config.js`.

## Repo map
| Path | What |
|---|---|
| `data/` | `fetch.sh`, per-layer builders (`make_*.py`), `MANIFEST.md` (every dataset, license, CRS) |
| `analysis/score.py` | equity score + allocator → `data/derived/` |
| `analysis/new_spots.py` | new-pit candidates on wide sidewalks |
| `web/` | static site (MapLibre GL, no build step) |
| `research/` | method research, hackathon brief, open-source scout, Street View check |
| `supabase/schema.sql` | insert-only verification table + tally view |

## Bring it to your city
The score needs five layers: canopy, population by age, income, heat, and walking destinations. Meta canopy, Landsat and OpenStreetMap cover the whole world, and every Taiwan 村里 has age and income data. 臺中 is next (it publishes tree coordinates). See [research/scout.md](research/scout.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## License
Code: MIT. Data keeps its source license (Taiwan OGDL 1.0, CC BY 4.0, ODbL, public domain); see [LICENSE](LICENSE) and [data/MANIFEST.md](data/MANIFEST.md).

AI disclosure: built with Claude Code (Anthropic). Key numbers were checked by hand (Street View sample, sanity checks in each builder).
