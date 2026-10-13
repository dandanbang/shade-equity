// 一樹同仁 — Taipei shade-equity replant planner. Static, no build step.
const N_TREES = 3164;
const TAIPEI = [[121.457, 24.96], [121.666, 25.21]];
const fmt = n => Number(n).toLocaleString('zh-TW');
const $ = id => document.getElementById(id);
const q = new URLSearchParams(location.search);
if (q.get('demo')) document.documentElement.classList.add('demo');
const parseCsv = t => { const [h, ...rows] = t.trim().split('\n'), k = h.split(',');
  return rows.map(r => Object.fromEntries(r.split(',').map((v, i) => [k[i], ['VILLCODE', 'kind', 'site_id'].includes(k[i]) ? v : +v]))); };
const isPhone = () => innerWidth <= 720;
let mode = 'equity', planted = false, lis = null, pits = [], summary = null, current = null, shown = 5;
const rankField = () => (mode === 'equity' ? 'plan_rank' : 'even_rank');
const MODE_NAME = { equity: '需要優先種', even: '平均種' };
const other = () => (mode === 'equity' ? 'even' : 'equity');
const wan = k => `${Math.round(k / 10)} 萬`;  // income is in 千元
const toast = msg => { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2600); };

// --- votes: mine in this browser; everyone's in Supabase (web/config.js, RLS = read + insert only)
const CFG = window.SHADE_CONFIG || {};
const remote = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
const clientId = (() => { try { let id = localStorage.getItem('client_id'); if (!id) { id = crypto.randomUUID(); localStorage.setItem('client_id', id); } return id; } catch { return crypto.randomUUID(); } })();
let votes = {}; // site_id -> {empty, tree, no}
const sb = (path, opt = {}) => fetch(`${CFG.supabaseUrl}/rest/v1/${path}`, { ...opt,
  headers: { apikey: CFG.supabaseAnonKey, 'Content-Type': 'application/json', ...(opt.headers || {}),
    // legacy anon keys are JWTs and also go in Authorization; new sb_publishable_ keys go in apikey only
    ...(CFG.supabaseAnonKey.startsWith('eyJ') ? { Authorization: `Bearer ${CFG.supabaseAnonKey}` } : {}) } });
const mine = {
  get(k) { try { return JSON.parse(localStorage.getItem('verify') || '{}')[k]; } catch { return undefined; } },
  set(k, v) { try { const o = JSON.parse(localStorage.getItem('verify') || '{}'); o[k] = v; localStorage.setItem('verify', JSON.stringify(o)); } catch {} },
};
async function sendVote(site, verdict) {
  mine.set(site, verdict);
  if (!remote) return true;
  const r = await sb('verifications', { method: 'POST', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ city: CFG.city, site_id: site, verdict, client_id: clientId }) });
  if (!r.ok) throw new Error(r.status);
  return true;
}
async function loadVotes() {
  if (!remote) return;
  try {
    const rows = await (await sb(`pit_votes?city=eq.${CFG.city}&select=site_id,empty,tree,no`)).json();
    votes = Object.fromEntries(rows.map(r => [r.site_id, r]));
    const people = rows.reduce((a, r) => a + r.empty + r.tree + r.no, 0);
    $('crowd').textContent = rows.length ? `市民已確認 ${fmt(rows.length)} 個點` : '';
    if (people && current) renderSites();
  } catch {}
}

// --- map
const map = new maplibregl.Map({
  container: 'map', style: 'https://tiles.openfreemap.org/styles/positron',
  bounds: TAIPEI, minZoom: 10, maxZoom: 19, attributionControl: { compact: true },
});
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
const geo = new maplibregl.GeolocateControl({ fitBoundsOptions: { maxZoom: 15 } });
map.addControl(geo, 'bottom-right');
geo.on('geolocate', e => { const code = liAt(e.coords.longitude, e.coords.latitude); code ? select(code) : toast('你目前不在台北市範圍內'); });
const pad = () => {
  const hero = $('hero'), panel = $('panel'), open = !panel.hidden;
  if (isPhone()) return { top: open ? 16 : hero.offsetHeight + 24, left: 16, right: 16, bottom: open ? panel.offsetHeight + 16 : 56 };
  return { top: 40, bottom: 40, left: hero.offsetWidth + 40, right: open ? panel.offsetWidth + 40 : 40 };
};

Promise.all([
  fetch('data/li_score.geojson').then(r => r.json()),
  fetch('data/empty_pits.csv').then(r => r.text()),
  fetch('data/summary.json').then(r => r.json()),
  new Promise(res => map.on('load', res)),
]).then(([g, csv, s]) => {
  lis = g; summary = s; pits = parseCsv(csv);
  addLayers();
  map.fitBounds(TAIPEI, { padding: pad(), duration: 0 });
  $('li-list').innerHTML = lis.features.map(f => `<option value="${f.properties.TOWNNAME} ${f.properties.VILLNAME}">`).join('');
  const btn = $('btn-plant'); btn.disabled = false; btn.textContent = `種回 ${fmt(N_TREES)} 棵 ▶`;
  loadVotes();
  // shareable deep links: ?mode=even&plant=1&li=63000100013&demo=1
  if (q.get('mode') === 'even') mode = 'even';
  if (q.get('plant')) plant();
  if (q.get('li')) select(q.get('li'));
}).catch(() => { $('btn-plant').textContent = '地圖載入失敗，請重新整理'; });

const sel = ['boolean', ['feature-state', 'sel'], false];
function addLayers() {
  const below = map.getStyle().layers.find(l => l.type === 'symbol')?.id;
  map.addSource('li', { type: 'geojson', data: lis, promoteId: 'VILLCODE' });
  map.addLayer({ id: 'li-fill', type: 'fill', source: 'li', paint: {
    // need ramp: orange = lacking shade → cream = at goal. Green is reserved for trees.
    'fill-color': ['interpolate', ['linear'], ['get', 'TES'], 25, '#b8380c', 45, '#f08c3a', 65, '#f6d88f', 90, '#f3efe6'],
    'fill-opacity': ['interpolate', ['linear'], ['zoom'], 12, ['case', sel, 0.8, 0.6], 15, ['case', sel, 0.45, 0.3], 17, 0.15],
  } }, below);
  map.addLayer({ id: 'li-line', type: 'line', source: 'li', paint: {
    'line-color': ['case', sel, '#1d2320', '#ffffff'], 'line-width': ['case', sel, 2.5, 1.2],
  } }, below);
  map.addSource('pits', { type: 'geojson', data: { type: 'FeatureCollection',
    features: pits.map(p => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [p.lon, p.lat] }, properties: p })) } });
  map.addLayer({ id: 'pits-empty', type: 'circle', source: 'pits', minzoom: 13.5, filter: ['==', ['get', 'kind'], 'pit'], paint: {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 2.5, 18, 6], 'circle-color': '#6b716e',
    'circle-stroke-color': '#fff', 'circle-stroke-width': 1 } });
  map.addLayer({ id: 'spots', type: 'circle', source: 'pits', minzoom: 13.5, filter: ['==', ['get', 'kind'], 'new'], paint: {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 2.5, 18, 7], 'circle-color': 'rgba(255,255,255,.6)',
    'circle-stroke-color': '#2f7d4f', 'circle-stroke-width': 2 } });
  map.addLayer({ id: 'pits-plan', type: 'circle', source: 'pits', filter: planFilter(0), paint: {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2.4, 14, 4.5, 18, 9],
    'circle-color': '#2f7d4f', 'circle-stroke-color': '#fff', 'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 16, 1.5] } });

  const DOTS = ['pits-plan', 'spots', 'pits-empty'];
  map.on('click', e => {
    const dot = map.queryRenderedFeatures(e.point, { layers: DOTS })[0];
    if (dot) return popupSite(dot.properties);
    const li = map.queryRenderedFeatures(e.point, { layers: ['li-fill'] })[0];
    if (li) select(li.properties.VILLCODE);
  });
  for (const l of ['li-fill', ...DOTS]) {
    map.on('mouseenter', l, () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', l, () => (map.getCanvas().style.cursor = ''));
  }
}
const planFilter = n => ['all', ['>=', ['get', rankField()], 0], ['<', ['get', rankField()], n]];

// --- 種回 3,164 棵: one button. First press plants; after that it swaps to the other method for comparison.
$('btn-plant').onclick = () => { if (planted) mode = other(); plant(); };
function plant() {
  planted = true; document.body.classList.add('planted');
  const btn = $('btn-plant'); btn.disabled = true;
  const t0 = performance.now(), dur = 2600;
  const step = now => {
    const k = Math.min(1, (now - t0) / dur), n = Math.round(N_TREES * (1 - Math.pow(1 - k, 3)));
    map.setFilter('pits-plan', planFilter(n));
    btn.textContent = `${MODE_NAME[mode]}：已種 ${fmt(n)} 棵`;
    if (k < 1) return requestAnimationFrame(step);
    btn.disabled = false; btn.textContent = `換成「${MODE_NAME[other()]}」對照 ⇄`;
    showResult();
    if (current) select(current, false);
  };
  requestAnimationFrame(step);
}
function showResult() {
  const a = summary[mode], b = summary[other()], eq = summary.equity, ev = summary.even;
  const ratio = Math.round(eq.share_top20pct / ev.share_top20pct);
  $('result').querySelector('.big').innerHTML = mode === 'equity'
    ? `<b>${ratio} 倍</b>的樹種到最需要的里`
    : `平均種：只有 <b>${Math.round(ev.share_top20pct)}%</b> 種到最需要的里`;
  $('mode-line').textContent = mode === 'equity'
    ? '需要優先種：先種在最缺樹蔭、又熱、長者小孩多、所得較低、人潮多的里。'
    : '平均種：同樣的樹隨機撒到全市，不看誰需要（對照組）。';
  const vs = (x) => `${MODE_NAME[other()]} ${x}`;
  $('s-share').textContent = `${Math.round(a.share_top20pct)}%`; $('s-share-vs').textContent = vs(`${Math.round(b.share_top20pct)}%`);
  $('s-heat').textContent = `+${a.tree_wtd_heat_anom_c.toFixed(1)}°C`; $('s-heat-vs').textContent = vs(`+${b.tree_wtd_heat_anom_c.toFixed(1)}°C`);
  $('s-inc').textContent = wan(a.tree_wtd_median_income_k); $('s-inc-vs').textContent = vs(wan(b.tree_wtd_median_income_k));
  $('result').hidden = false;
}

// --- 四個指標：plain words + need level, biggest reason first
const pctNeed = (p, k, up) => { const all = lis.features.map(x => x.properties[k]).filter(Number.isFinite);
  return Math.round(all.filter(v => (up ? v < p[k] : v > p[k])).length / all.length * 100); };
const median = k => { const a = lis.features.map(x => x.properties[k]).filter(Number.isFinite).sort((x, y) => x - y); return a[a.length >> 1]; };
const LEVEL = n => (n >= 75 ? ['hi', '高需求'] : n >= 50 ? ['mid', '中'] : ['lo', '一般']);
function factorRows(p) {
  const heat = pctNeed(p, 'lst_mean_c', true), inc = pctNeed(p, 'median_income', false);
  const foot = pctNeed(p, 'poi_per_km2', true), dep = pctNeed(p, 'dep_ratio', true);
  const rows = [
    [heat, '🌡️', ['非常熱', '偏熱', '熱度：一般'], `夏天地表 ${Math.round(p.lst_mean_c)}°C，${heat >= 99 ? '全台北最熱的里之一' : `比 ${heat}% 的里熱`}`],
    [inc, '💰', ['所得較低', '所得略低', '所得：一般'], inc >= 50 ? `中位數 ${wan(p.median_income)}，比 ${inc}% 的里低` : `中位數 ${wan(p.median_income)}（台北中位數 ${wan(median('median_income'))}）`],
    [foot, '🚶', ['人潮多', '人潮中等', '人潮：較少'], `公車站、捷運、學校、市場密度比 ${foot}% 的里高`],
    [dep, '👵', ['老人小孩多', '老人小孩略多', '老人小孩：一般'], `每 100 位大人照顧 ${Math.round(p.dep_ratio * 100)} 位老人小孩（台北中位數 ${Math.round(median('dep_ratio') * 100)}）`],
  ].sort((x, y) => y[0] - x[0]);
  return rows.map(([n, ic, names, line]) => { const [cls, tag] = LEVEL(n), name = names[cls === 'hi' ? 0 : cls === 'mid' ? 1 : 2];
    return `<div class="f"><div class="ic">${ic}</div><div class="t"><b>${name}</b><div>${line}</div></div><span class="chip ${cls}">${tag}</span></div>`; }).join('');
}
const tesColor = t => (t < 45 ? '#b8380c' : t < 65 ? '#c2410c' : t < 90 ? '#a16207' : '#5f6662');

// --- 里 panel
let list = [], li = null;
function select(code, fly = true) {
  const f = lis.features.find(x => x.properties.VILLCODE === code); if (!f) return;
  if (current) map.setFeatureState({ source: 'li', id: current }, { sel: false });
  current = code; map.setFeatureState({ source: 'li', id: code }, { sel: true });
  const p = li = f.properties, full = p.TES >= 99;
  const rank = 1 + lis.features.filter(x => x.properties.TES < p.TES).length;
  const nFull = lis.features.filter(x => x.properties.TES >= 99).length;
  $('p-dist').textContent = p.TOWNNAME; $('p-name').textContent = p.VILLNAME;
  $('p-tes').textContent = Math.round(p.TES); $('p-tes').style.color = tesColor(p.TES);
  $('p-verdict').textContent = full ? `這裡的樹蔭已達標 🌳（全台北 ${nFull} 個里已達標）`
    : rank <= 46 ? `全台北最缺樹蔭的 10%（第 ${rank} 名 / 456 里）` : `缺樹蔭程度：第 ${rank} 名 / 456 里`;
  $('p-why-title').textContent = full ? '其他指標' : '為什麼這裡需要樹蔭？';
  $('p-bars').innerHTML = factorRows(p);
  $('p-facts').innerHTML = [
    ['人口', fmt(p.pop)], ['65 歲以上', `${(p.age65 / p.pop * 100).toFixed(1)}%`],
    ['樹冠覆蓋（目標 30%）', `${(p.canopy * 100).toFixed(1)}%`], ['夏季地表溫度（衛星）', `${p.lst_mean_c.toFixed(1)}°C`],
    ['所得中位數', wan(p.median_income)], ['行道樹', `${fmt(p.street_trees)} 棵`], ['空樹穴（待確認）', fmt(p.empty_pits)], ['新增樹穴（需現勘）', fmt(p.new_spots)],
  ].map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('');
  list = pits.filter(x => x.VILLCODE === code && x[rankField()] >= 0).sort((a, b) => a[rankField()] - b[rankField()]);
  shown = 5; renderSites();
  $('panel').hidden = false; $('panel').scrollTop = 0; document.body.classList.add('sheet-open');
  history.replaceState(null, '', `?${planted ? 'plant=1&' : ''}${mode === 'even' ? 'mode=even&' : ''}li=${code}`);
  if (fly) requestAnimationFrame(() => map.fitBounds(bbox(f.geometry), { padding: pad(), maxZoom: 16.5 }));
}
function renderSites() {
  const p = li, full = p.TES >= 99;
  $('p-sites').hidden = full && !list.length;
  $('p-plan-n').textContent = planted ? `${MODE_NAME[mode]}：這個里分到 ${list.length} 棵` : `${list.length} 個建議點`;
  $('p-howto').hidden = $('p-csv').hidden = !list.length;
  if (!list.length) {
    $('p-pits').innerHTML = `<p class="empty">${MODE_NAME[mode]}沒有分到這個里${p.TES >= 80 ? '：這裡樹蔭相對足夠。' : '：附近沒有可用的種樹點，需要巷弄植栽等新方法。'}
      <br><button class="link" id="p-near">看附近最需要的里 →</button></p>`;
    $('p-near').onclick = () => select(nearestNeedy(p.VILLCODE));
    $('p-more').hidden = true; return;
  }
  $('p-pits').innerHTML = list.slice(0, shown).map(siteItem).join('');
  $('p-more').hidden = list.length <= shown;
  $('p-more').textContent = `顯示更多（還有 ${list.length - shown} 個）`;
}
$('p-more').onclick = () => { shown += 10; renderSites(); };
const sv = p => `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.lat},${p.lon}`;
const KIND = p => (p.kind === 'new' ? '新增樹穴（需現勘）' : '空樹穴（待確認）');
function siteItem(p) {
  const v = mine.get(p.site_id), isNew = p.kind === 'new';
  const b = (k, t) => `<button data-site="${p.site_id}" data-v="${k}" aria-pressed="${v === k}">${v === k ? '✓ ' : ''}${t}</button>`;
  const c = votes[p.site_id], tally = c ? `<div class="tally">市民確認：${isNew ? '可以種' : '空的'} ${c.empty} · 已有樹 ${c.tree} · 不能種 ${c.no}</div>` : '';
  return `<div class="site"><a class="sv" href="${sv(p)}" target="_blank" rel="noopener">看街景 ↗</a>
    <div class="meta"><b>${KIND(p)}</b> · 周邊樹蔭 ${Math.round(p.canopy_15m * 100)}% · 離人潮 ${p.poi_dist_m} 公尺</div>${tally}
    <div class="verify">${b('empty', isNew ? '可以種' : '空的')}${b('tree', '已經有樹')}${b('no', '不能種')}</div><div class="msg" hidden></div></div>`;
}
$('p-pits').addEventListener('click', async e => {
  const t = e.target.closest('button[data-site]'); if (!t || t.getAttribute('aria-pressed') === 'true') return;
  const row = t.closest('.site'), msg = row.querySelector('.msg'), site = t.dataset.site, v = t.dataset.v;
  row.querySelectorAll('button[data-site]').forEach(x => { const on = x === t; x.setAttribute('aria-pressed', on); x.textContent = (on ? '✓ ' : '') + x.textContent.replace(/^✓ /, ''); });
  try {
    await sendVote(site, v);
    const c = votes[site] || (votes[site] = { empty: 0, tree: 0, no: 0 }); c[v] += 1;
    const n = c.empty + c.tree + c.no;
    msg.className = 'msg'; msg.textContent = n > 1 ? `謝謝！已記錄，你是第 ${n} 位確認這個點的人` : '謝謝！已記錄，你是第一個確認這個點的人';
  } catch { msg.className = 'msg err'; msg.textContent = '沒送出，稍後再試一次'; }
  msg.hidden = false;
});
function closePanel() {
  $('panel').hidden = true; document.body.classList.remove('sheet-open');
  if (current) map.setFeatureState({ source: 'li', id: current }, { sel: false });
  current = null; history.replaceState(null, '', planted ? '?plant=1' : location.pathname);
}
$('close').onclick = closePanel;
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('panel').hidden) closePanel(); });
$('p-share').onclick = async () => {
  const url = `${location.origin}${location.pathname}?plant=1&li=${current}`;
  const text = `${li.TOWNNAME}${li.VILLNAME}的樹蔭公平分數是 ${Math.round(li.TES)}/100。去年台北移除了 3,164 棵樹，該種回哪裡？`;
  try { if (navigator.share) await navigator.share({ title: '一樹同仁', text, url }); else { await navigator.clipboard.writeText(`${text} ${url}`); toast('連結已複製'); } } catch {}
};
$('p-csv').onclick = () => {
  const rows = [['順序', '區', '里', '類型', '編號', '經度', '緯度', '離人潮(公尺)', '街景', '我的確認'],
    ...list.map((p, i) => [i + 1, li.TOWNNAME, li.VILLNAME, KIND(p), p.site_id, p.lon, p.lat, p.poi_dist_m, sv(p), mine.get(p.site_id) || ''])];
  const blob = new Blob(['﻿' + rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `種樹清單_${li.TOWNNAME}${li.VILLNAME}.csv` });
  a.click(); URL.revokeObjectURL(a.href);
};
function popupSite(p) {
  new maplibregl.Popup({ offset: 8, maxWidth: '240px' }).setLngLat([p.lon, p.lat])
    .setHTML(`<b>${KIND(p)}</b><br>周邊樹蔭 ${Math.round(p.canopy_15m * 100)}% · 離人潮 ${p.poi_dist_m} 公尺<br><a href="${sv(p)}" target="_blank" rel="noopener">看街景 ↗</a>`).addTo(map);
}

// --- 找我的里
$('search').addEventListener('change', e => {
  const s = e.target.value.trim(); if (!s) return;
  const f = lis.features.find(x => `${x.properties.TOWNNAME} ${x.properties.VILLNAME}` === s)
    || lis.features.find(x => x.properties.VILLNAME === s || x.properties.VILLNAME === `${s}里`);
  if (f) { select(f.properties.VILLCODE); e.target.value = ''; e.target.blur(); } else toast('找不到這個里，試試「頂碩里」');
});

// --- geometry helpers
function rings(g) { return g.type === 'Polygon' ? [g.coordinates] : g.coordinates; }
function bbox(g) { const c = rings(g).flat(2), xs = c.map(p => p[0]), ys = c.map(p => p[1]);
  return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]]; }
function inRing(x, y, r) { let o = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
  const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) o = !o; } return o; }
function liAt(x, y) { return lis.features.find(f => rings(f.geometry).some(poly => inRing(x, y, poly[0]) && !poly.slice(1).some(h => inRing(x, y, h))))?.properties.VILLCODE; }
const centre = f => { const [[a, b], [c, d]] = bbox(f.geometry); return [(a + c) / 2, (b + d) / 2]; };
function nearestNeedy(code) {
  const has = new Set(pits.filter(p => p[rankField()] >= 0).map(p => p.VILLCODE));
  const me = centre(lis.features.find(f => f.properties.VILLCODE === code));
  return lis.features.filter(f => f.properties.VILLCODE !== code && has.has(f.properties.VILLCODE) && f.properties.TES < 70)
    .map(f => [f, Math.hypot(centre(f)[0] - me[0], centre(f)[1] - me[1])]).sort((a, b) => a[1] - b[1])[0]?.[0].properties.VILLCODE;
}
