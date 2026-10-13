// design-audit screenshots; supabase aborted so nothing writes to the shared vote DB
import { chromium } from 'playwright';
const B = 'http://localhost:8765', O = process.env.HOME + '/personal/shade-hackathon/shots/audit/';
const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
async function page(w, h, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: opts.dpr || 1, isMobile: !!opts.mobile, hasTouch: !!opts.mobile });
  const p = await ctx.newPage();
  await p.route(/supabase\.co/, r => r.abort());
  p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && console.log(w, 'console:', m.type(), m.text().slice(0, 200)));
  p.on('pageerror', e => console.log(w, 'pageerror:', e.message));
  return p;
}
const shots = [
  ['/', 1440, 900, 'd-home'], ['/?plant=1', 1440, 900, 'd-plant'], ['/?plant=1&li=63000070011', 1440, 900, 'd-li'],
  ['/?mode=even&plant=1', 1440, 900, 'd-even'],
  ['/', 1280, 720, 'p-home'], ['/?plant=1&li=63000070011', 1280, 720, 'p-li'],
  ['/', 390, 844, 'm-home', 1], ['/?plant=1', 390, 844, 'm-plant', 1], ['/?plant=1&li=63000070011', 390, 844, 'm-li', 1],
  ['/about.html', 390, 844, 'm-about', 1], ['/about.html', 1440, 900, 'd-about'],
];
for (const [u, w, h, n, m] of shots) {
  const p = await page(w, h, { mobile: m });
  const t0 = Date.now();
  await p.goto(B + u, { waitUntil: 'networkidle' });
  if (n === 'd-home') console.log('networkidle ms', Date.now() - t0);
  await p.waitForTimeout(5000);
  await p.screenshot({ path: O + n + '.png' });
  if (n === 'm-li') {
    await p.screenshot({ path: O + 'm-li-full.png', fullPage: false });
    // panel scrolled
    await p.evaluate(() => { const el = document.getElementById('panel'); el.scrollTop = 600; });
    await p.waitForTimeout(300); await p.screenshot({ path: O + 'm-li-scrolled.png' });
    const sizes = await p.evaluate(() => [...document.querySelectorAll('button, a')].filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return `${(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,12)} ${Math.round(r.width)}x${Math.round(r.height)}`; }));
    console.log('tap targets', sizes.slice(0, 20).join(' | '));
    const hero = await p.evaluate(() => { const r = document.getElementById('hero').getBoundingClientRect(), q = document.getElementById('panel').getBoundingClientRect(); return { hero: [r.top, r.bottom], panel: [q.top, q.bottom] }; });
    console.log('mobile overlap', JSON.stringify(hero));
  }
  if (n === 'm-home') {
    // loading state at 300ms
    const p2 = await page(w, h, { mobile: 1 });
    await p2.goto(B + '/', { waitUntil: 'commit' }); await p2.waitForTimeout(600);
    await p2.screenshot({ path: O + 'm-loading.png' });
    // tap plant
    await p.click('#btn-plant'); await p.waitForTimeout(1200); await p.screenshot({ path: O + 'm-planting.png' });
    await p.waitForTimeout(2500); await p.screenshot({ path: O + 'm-planted.png' });
    // tap a li on map
    await p.touchscreen.tap(200, 700); await p.waitForTimeout(2500); await p.screenshot({ path: O + 'm-tapli.png' });
  }
  if (n === 'd-plant') {
    await p.click('#btn-plant'); await p.waitForTimeout(3500); await p.screenshot({ path: O + 'd-compare-even.png' });
    // zoom in to street level near Datong
    await p.evaluate(() => map.jumpTo({ center: [121.513, 25.06], zoom: 16 })); await p.waitForTimeout(3000);
    await p.screenshot({ path: O + 'd-z16.png' });
    await p.evaluate(() => map.jumpTo({ center: [121.513, 25.06], zoom: 13 })); await p.waitForTimeout(2500);
    await p.screenshot({ path: O + 'd-z13.png' });
  }
  if (n === 'd-li') {
    // verify click (supabase aborted) + popup on a pit
    const btn = await p.$('#p-pits button[data-v="empty"]');
    if (btn) { await btn.click(); await p.waitForTimeout(400); await p.screenshot({ path: O + 'd-verify.png' }); }
    const pt = await p.evaluate(() => { const f = map.queryRenderedFeatures({ layers: ['pits-plan'] })[0]; if (!f) return null; const q = map.project(f.geometry.coordinates); return [q.x, q.y]; });
    if (pt) { await p.mouse.click(pt[0], pt[1]); await p.waitForTimeout(800); await p.screenshot({ path: O + 'd-popup.png' }); }
    // keyboard focus
    await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
    await p.screenshot({ path: O + 'd-focus.png' });
    // green / no-sites li: find highest TES li
    const code = await p.evaluate(() => { const s = lis.features.slice().sort((a, b) => b.properties.TES - a.properties.TES)[0]; return s.properties.VILLCODE; });
    await p.evaluate(c => select(c), code); await p.waitForTimeout(2500); await p.screenshot({ path: O + 'd-green-li.png' });
    const none = await p.evaluate(() => { const has = new Set(pits.filter(x => x.plan_rank >= 0).map(x => x.VILLCODE)); const f = lis.features.find(x => !has.has(x.properties.VILLCODE) && x.properties.TES < 50); return f && f.properties.VILLCODE; });
    console.log('no-site low li', none);
    if (none) { await p.evaluate(c => select(c), none); await p.waitForTimeout(2500); await p.screenshot({ path: O + 'd-nosite-li.png' }); }
  }
  await p.context().close();
}
await b.close();
