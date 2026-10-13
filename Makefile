.PHONY: all score web serve
PY=.venv/bin/python -I -W ignore
all: score web
score:
	$(PY) analysis/new_spots.py
	$(PY) analysis/score.py
web:
	cp data/derived/li_score.geojson data/derived/empty_pits.csv data/derived/summary.json web/data/
serve:
	cd web && python3 -m http.server 8765
