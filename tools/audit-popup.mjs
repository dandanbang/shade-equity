import { chromium } from 'playwright';
const O = process.env.HOME + '/personal/shade-hackathon/shots/audit/';
const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [w, h, n, m] of [[1440, 900, 'd-popup2'], [390, 844, 'm-popup', 1]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: !!m, hasTouch: !!m });
  const p = await ctx.newPage(); await p.route(/supabase\.co/, r => r.abort());
  await p.goto('http://localhost:8765/?plant=1', { waitUntil: 'networkidle' }); await p.waitForTimeout(4500);
  await p.evaluate(() => map.jumpTo({ center: [121.497, 25.035], zoom: 16 })); await p.waitForTimeout(2500);
  const pt = await p.evaluate(() => { const fs = map.queryRenderedFeatures({ layers: ['pits-plan'] }); const H = innerHeight; const f = fs.map(f => map.project(f.geometry.coordinates)).find(q => q.y > H * 0.7 && q.y < H - 60 && q.x > 40 && q.x < innerWidth - 60) || (fs[0] && map.project(fs[0].geometry.coordinates)); return f ? [f.x, f.y] : null; });
  console.log(n, pt);
  if (pt) { m ? await p.touchscreen.tap(pt[0], pt[1]) : await p.mouse.click(pt[0], pt[1]); await p.waitForTimeout(1500); }
  await p.screenshot({ path: O + n + '.png' });
  console.log(n, 'panel open?', await p.evaluate(() => !document.getElementById('panel').hidden), 'popup?', await p.evaluate(() => !!document.querySelector('.maplibregl-popup')));
  await ctx.close();
}
await b.close();
