.PHONY: all score web serve
PY=.venv/bin/python -I -W ignore
all: score web
score:
	$(PY) analysis/new_spots.py
	$(PY) analysis/extras.py
	$(PY) analysis/score.py
web:
	cp data/derived/li_score.geojson data/derived/empty_pits.csv data/derived/summary.json data/derived/extras_summary.json data/derived/trees_gone.csv data/derived/small_pits.csv web/data/
serve:
	cd web && python3 -m http.server 8765
