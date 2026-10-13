// 一樹同仁 — Taipei shade-equity replant planner. Static, no build step.
const N_TREES = 3164;
const FACTORS = [
  ['n_heat', '地表高溫'], ['n_dep', '老人與小孩比例'], ['n_income', '所得偏低'], ['n_foot', '步行人流'],
];
const fmt = n => Number(n).toLocaleString('zh-TW');
const $ = id => document.getElementById(id);
const parseCsv = t => { const [h, ...rows] = t.trim().split('\n'), k = h.split(',');
  return rows.map(r => Object.fromEntries(r.split(',').map((v, i) => [k[i], ['VILLCODE', 'kind', 'site_id'].includes(k[i]) ? v : +v]))); };
let mode = 'equity', planted = false, lis = null, pits = [], summary = null, current = null;
const rankField = () => (mode === 'equity' ? 'plan_rank' : 'even_rank');
// My votes live in this browser; everyone's votes live in Supabase when configured (web/config.js).
const CFG = window.SHADE_CONFIG || {};
const remote = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
const clientId = (() => { try { let id = localStorage.getItem('client_id'); if (!id) { id = crypto.randomUUID(); localStorage.setItem('client_id', id); } return id; } catch { return crypto.randomUUID(); } })();
let votes = {}; // site_id -> {empty, tree, no}
const sb = (path, opt = {}) => fetch(`${CFG.supabaseUrl}/rest/v1/${path}`, { ...opt,
  headers: { apikey: CFG.supabaseAnonKey, Authorization: `Bearer ${CFG.supabaseAnonKey}`, 'Content-Type': 'application/json', ...(opt.headers || {}) } });
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem('verify') || '{}')[k]; } catch { return undefined; } },
  set(k, v) {
    try { const o = JSON.parse(localStorage.getItem('verify') || '{}'); o[k] = v; localStorage.setItem('verify', JSON.stringify(o)); } catch {}
    if (remote) sb('verifications', { method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ city: CFG.city, site_id: k, verdict: v, client_id: clientId }) }).then(loadVotes).catch(() => {});
  },
};
async function loadVotes() {
  if (!remote) return;
  try {
    const rows = await (await sb(`pit_votes?city=eq.${CFG.city}&select=site_id,empty,tree,no`)).json();
    votes = Object.fromEntries(rows.map(r => [r.site_id, r]));
    const n = rows.length, people = rows.reduce((a, r) => a + r.empty + r.tree + r.no, 0);
    $('crowd').textContent = n ? `已有 ${fmt(people)} 筆市民街景確認、${fmt(n)} 個地點` : '';
  } catch {}
}

const map = new maplibregl.Map({
  container: 'map', style: 'https://tiles.openfreemap.org/styles/positron',
  center: [121.56, 25.08], zoom: 11.2, minZoom: 10, maxZoom: 19, attributionControl: { compact: true },
});
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

Promise.all([
  fetch('data/li_score.geojson').then(r => r.json()),
  fetch('data/empty_pits.csv').then(r => r.text()),
  fetch('data/summary.json').then(r => r.json()),
  new Promise(res => map.on('load', res)),
]).then(([g, csv, s]) => {
  lis = g; summary = s;
  pits = parseCsv(csv);
  $('empty-count').textContent = fmt(s.empty_pits);
  addLayers();
  loadVotes();
  // shareable deep links: ?mode=even&plant=1&li=63000100013
  const q = new URLSearchParams(location.search);
  if (q.get('mode') === 'even') setMode('even');
  if (q.get('plant')) plant();
  if (q.get('li')) select(q.get('li'));
});

function addLayers() {
  map.addSource('li', { type: 'geojson', data: lis, promoteId: 'VILLCODE' });
  map.addLayer({ id: 'li-fill', type: 'fill', source: 'li', paint: {
    'fill-color': ['interpolate', ['linear'], ['get', 'TES'], 20, '#b8380c', 45, '#f08c3a', 65, '#f6d88f', 80, '#a9d3a0', 100, '#2f7d4f'],
    'fill-opacity': ['interpolate', ['linear'], ['zoom'], 12, ['case', ['boolean', ['feature-state', 'sel'], false], 0.75, 0.55], 15, ['case', ['boolean', ['feature-state', 'sel'], false], 0.35, 0.18]],
  } }, firstSymbol());
  map.addLayer({ id: 'li-line', type: 'line', source: 'li', paint: {
    'line-color': ['case', ['boolean', ['feature-state', 'sel'], false], '#1d2320', '#ffffff'],
    'line-width': ['case', ['boolean', ['feature-state', 'sel'], false], 2.5, 0.6],
  } }, firstSymbol());

  map.addSource('pits', { type: 'geojson', data: {
    type: 'FeatureCollection',
    features: pits.map(p => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [p.lon, p.lat] }, properties: p })),
  } });
  map.addLayer({ id: 'pits-empty', type: 'circle', source: 'pits', minzoom: 13.5, filter: ['==', ['get', 'kind'], 'pit'], paint: {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 1.5, 18, 5], 'circle-color': '#8a8f8c', 'circle-opacity': 0.7,
  } });
  map.addLayer({ id: 'spots', type: 'circle', source: 'pits', minzoom: 13.5, filter: ['==', ['get', 'kind'], 'new'], paint: {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 2, 18, 7], 'circle-color': 'rgba(0,0,0,0)',
    'circle-stroke-color': '#2f7d4f', 'circle-stroke-width': 1.5,
  } });
  map.addLayer({ id: 'pits-plan', type: 'circle', source: 'pits', filter: planFilter(0), paint: {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2.2, 14, 4, 18, 9],
    'circle-color': '#2f7d4f', 'circle-stroke-color': '#fff', 'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 16, 1.5],
  } });

  map.on('click', 'li-fill', e => select(e.features[0].properties.VILLCODE));
  map.on('click', 'pits-plan', e => { const p = e.features[0].properties; popupPit(p); });
  for (const l of ['li-fill', 'pits-plan']) {
    map.on('mouseenter', l, () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', l, () => (map.getCanvas().style.cursor = ''));
  }
}
const firstSymbol = () => map.getStyle().layers.find(l => l.type === 'symbol')?.id;
const planFilter = n => ['all', ['>=', ['get', rankField()], 0], ['<', ['get', rankField()], n]];

// --- 種回 3,164 棵
$('btn-plant').onclick = () => (planted ? setMode(other()) : plant());
$('btn-even').onclick = () => setMode('even');
$('btn-equity').onclick = () => setMode('equity');
const MODE_DESC = {
  equity: '<b>需要優先種</b>：先種在樹蔭最少、又最熱、長者小孩多、所得低、人潮多的里；同一里內，先種周邊最沒樹蔭、離人最近的點。',
  even: '<b>平均種</b>：把 3,164 棵隨機平均撒到全市可種的點，不看誰需要。用來對照。',
};
const other = () => (mode === 'equity' ? 'even' : 'equity');
const MODE_NAME = { equity: '需要優先種', even: '平均種' };
function setMode(m) {
  mode = m;
  $('btn-even').classList.toggle('on', m === 'even');
  $('btn-equity').classList.toggle('on', m === 'equity');
  $('mode-desc').innerHTML = MODE_DESC[m];
  if (planted) plant();
  if (current) select(current, false);
}
setMode(mode);
function plant() {
  planted = true;
  const btn = $('btn-plant'); btn.disabled = true;
  const t0 = performance.now(), dur = 2600;
  const step = now => {
    const k = Math.min(1, (now - t0) / dur), n = Math.round(N_TREES * (1 - Math.pow(1 - k, 3)));
    map.setFilter('pits-plan', planFilter(n));
    btn.textContent = `${MODE_NAME[mode]}：已種 ${fmt(n)} 棵`;
    if (k < 1) requestAnimationFrame(step);
    else { btn.disabled = false; btn.textContent = `換「${MODE_NAME[other()]}」對照 ⇄`; showCompare(); }
  };
  requestAnimationFrame(step);
}
function showCompare() {
  const a = summary[mode], b = summary[mode === 'equity' ? 'even' : 'equity'];
  const vs = (x, unit = '') => `<span class="vs">${MODE_NAME[other()]}：${x}${unit}</span>`;
  $('compare-title').textContent = `${MODE_NAME[mode]}的結果`;
  $('s-share').innerHTML = `${a.share_top20pct}%${vs(b.share_top20pct, '%')}`;
  $('s-heat').innerHTML = `+${a.tree_wtd_heat_anom_c}°C${vs('+' + b.tree_wtd_heat_anom_c, '°C')}`;
  $('s-inc').innerHTML = `${fmt(a.tree_wtd_median_income_k)}k${vs(fmt(b.tree_wtd_median_income_k), 'k')}`;
  $('compare').hidden = false; $('compare-title').hidden = false;
}

// --- 里 panel
function select(code, fly = true) {
  const f = lis.features.find(x => x.properties.VILLCODE === code); if (!f) return;
  if (current) map.setFeatureState({ source: 'li', id: current }, { sel: false });
  current = code; map.setFeatureState({ source: 'li', id: code }, { sel: true });
  const p = f.properties;
  const rank = 1 + lis.features.filter(x => x.properties.TES < p.TES).length;
  $('p-dist').textContent = p.TOWNNAME;
  $('p-name').textContent = p.VILLNAME;
  $('p-tes').textContent = Math.round(p.TES);
  $('p-tes').style.color = p.TES < 45 ? '#b8380c' : p.TES < 70 ? '#c27a12' : '#2f7d4f';
  $('p-verdict').textContent = rank <= 46 ? `全台北最缺樹蔭的 10%（第 ${rank} / 456 里）`
    : p.TES >= 90 ? `樹蔭充足（第 ${rank} / 456 里）` : `第 ${rank} / 456 里（1 = 最缺樹蔭）`;
  const med = k => { const a = lis.features.map(x => x.properties[k]).filter(Number.isFinite).sort((x, y) => x - y); return a[a.length >> 1]; };
  const why = {
    n_heat: `夏天地表約 ${p.lst_mean_c.toFixed(0)}°C，全市各里中位數 ${med('lst_mean_c').toFixed(0)}°C`,
    n_dep: `每 100 位 18–64 歲的人，要照顧 ${Math.round(p.dep_ratio * 100)} 位老人與小孩（中位數 ${Math.round(med('dep_ratio') * 100)}）`,
    n_income: `所得中位數 ${fmt(p.median_income)}k，全市各里中位數 ${fmt(med('median_income'))}k`,
    n_foot: `每平方公里 ${Math.round(p.poi_per_km2)} 個公車站、捷運出口、學校、市場、醫療與長照據點（中位數 ${Math.round(med('poi_per_km2'))}）`,
  };
  $('p-bars').innerHTML = FACTORS.map(([k, label]) =>
    `<div class="bar"><div class="row"><span>${label}</span><span>${Math.round(p[k] * 100)}</span></div><div class="track"><div class="fill" style="width:${p[k] * 100}%"></div></div><div class="why">${why[k]}</div></div>`).join('');
  const facts = [
    ['人口', fmt(p.pop)], ['65 歲以上', `${(p.age65 / p.pop * 100).toFixed(1)}%`],
    ['樹冠覆蓋（3 m 以上，目標 30%）', `${(p.canopy * 100).toFixed(1)}%`], ['夏季地表溫度（衛星）', `${p.lst_mean_c.toFixed(1)}°C`],
    ['所得中位數', `${fmt(p.median_income)}k`], ['行道樹', fmt(p.street_trees)], ['疑似空樹穴（待確認）', fmt(p.empty_pits)],
    ['可新增樹穴（寬人行道，需現勘）', fmt(p.new_spots)],
  ];
  $('p-facts').innerHTML = facts.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('');
  const list = pits.filter(x => x.VILLCODE === code && x[rankField()] >= 0).sort((a, b) => a[rankField()] - b[rankField()]);
  $('p-plan-n').textContent = `${MODE_NAME[mode]}：本里分到 ${list.length} 棵`;
  $('p-pits').innerHTML = list.length ? list.slice(0, 30).map(pitItem).join('')
    : `<li>此里沒有分配到空樹穴。${p.new_spots ? '地圖上的空心圈是可新增樹穴的寬人行道（需現勘）。' : ''}</li>`;
  $('p-csv').onclick = () => downloadCsv(p, list);
  $('panel').hidden = false;
  if (fly) { const b = bbox(f.geometry); map.fitBounds(b, { padding: { top: 60, bottom: 60, left: 420, right: 400 }, maxZoom: 16.5 }); }
}
const sv = p => `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.lat},${p.lon}`;
function pitItem(p) {
  const v = store.get(p.site_id), isNew = p.kind === 'new';
  const b = (k, t) => `<button data-pit="${p.site_id}" data-v="${k}" class="${v === k ? 'on' : ''}">${t}</button>`;
  const c = votes[p.site_id], tally = c ? `<div class="tally">市民確認：${isNew ? '可以種' : '空的'} ${c.empty} · 已有樹 ${c.tree} · 不能種 ${c.no}</div>` : '';
  return `<li><b>${isNew ? '新增樹穴' : '疑似空樹穴'}</b> · 周邊樹蔭 ${Math.round(p.canopy_15m * 100)}% · 離人潮 ${p.poi_dist_m} m
    · <a href="${sv(p)}" target="_blank" rel="noopener">看街景 ↗</a>${tally}
    <div class="verify">${b('empty', isNew ? '可以種' : '空的，可以種')}${b('tree', '已經有樹')}${b('no', '不能種')}</div></li>`;
}
$('p-pits').addEventListener('click', e => {
  const t = e.target.closest('button[data-pit]'); if (!t) return;
  store.set(t.dataset.pit, t.dataset.v);
  t.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === t));
});
$('close').onclick = () => { $('panel').hidden = true; if (current) map.setFeatureState({ source: 'li', id: current }, { sel: false }); current = null; };
function popupPit(p) {
  new maplibregl.Popup({ offset: 8 }).setLngLat([p.lon, p.lat])
    .setHTML(`<b>${p.kind === 'new' ? '新增樹穴' : '疑似空樹穴'}</b><br>周邊樹蔭 ${Math.round(p.canopy_15m * 100)}%<br>距公車站/學校/市場 ${p.poi_dist_m} m<br><a href="${sv(p)}" target="_blank" rel="noopener">開街景確認 ↗</a>`).addTo(map);
}
function downloadCsv(li, list) {
  const rows = [['順序', '區', '里', '類型', '編號', '經度', '緯度', '距人流(m)', '街景', '市民確認'],
    ...list.map((p, i) => [i + 1, li.TOWNNAME, li.VILLNAME, p.kind === 'new' ? '新增樹穴(需現勘)' : '疑似空樹穴', p.site_id, p.lon, p.lat, p.poi_dist_m, sv(p), store.get(p.site_id) || ''])];
  const blob = new Blob(['﻿' + rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `種樹清單_${li.TOWNNAME}${li.VILLNAME}.csv` });
  a.click(); URL.revokeObjectURL(a.href);
}
function bbox(g) {
  const c = g.type === 'Polygon' ? g.coordinates.flat() : g.coordinates.flat(2);
  const xs = c.map(p => p[0]), ys = c.map(p => p[1]);
  return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
}
