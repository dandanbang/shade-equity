# Contributing

Thanks for helping put shade where people need it.

- **Fix the data, no code needed**: open the map, click a 里, check sites in Street View and mark them. Every verdict improves the work order.
- **Report a problem**: open an issue with the 里, the site link and what you saw.
- **Code**: fork, run `make all`, keep changes small, and include a before/after screenshot for UI changes. Each builder prints a sanity check (hottest/coolest 里, richest/poorest); keep it passing.
- **New city**: add `data/fetch_<city>.sh` and a builder that outputs the same `data/derived/` files (li_score inputs: canopy, age, income, heat, POIs; sites). Open an issue first so we can agree on the adapter shape.
- **Principles**: real data only; label anything estimated; every number on the site must trace to a file in `data/` and a script.
