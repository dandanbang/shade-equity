// Real-browser check of the main flows. Supabase calls are stubbed: no votes are written.
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://localhost:8765/', out = '../shots/check';
const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
async function page(w, h, mobile = false) {
  const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  p.on('console', m => m.type() === 'error' && console.log(`[${w}] console:`, m.text()));
  p.on('pageerror', e => console.log(`[${w}] pageerror:`, e.message));
  await p.route('**/rest/v1/**', r => r.request().method() === 'POST' ? r.fulfill({ status: 201, body: '' }) : r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  return p;
}
const shot = (p, n) => p.screenshot({ path: `${out}/${n}.png` });
// desktop
let p = await page(1440, 900); await p.goto(base); await p.waitForFunction(() => !document.getElementById('btn-plant').disabled, null, { timeout: 20000 });
await shot(p, 'd-home'); await p.click('#btn-plant'); await p.waitForTimeout(3200); await shot(p, 'd-planted');
await p.click('#btn-plant'); await p.waitForTimeout(3200); await shot(p, 'd-even');
await p.fill('#search', '萬華區 頂碩里'); await p.dispatchEvent('#search', 'change'); await p.waitForTimeout(2000); await shot(p, 'd-li');
await p.click('.verify button >> nth=0'); await p.waitForTimeout(500);
console.log('desktop msg:', await p.textContent('.site .msg'), '| pressed:', await p.getAttribute('.verify button >> nth=0', 'aria-pressed'));
await shot(p, 'd-verified');
// projector
await p.goto(base + '?li=63000020005'); await p.waitForTimeout(5000); await shot(p, 'd-li-gone');
console.log('checks:', (await p.textContent('#p-checks')).replace(/\s+/g, ' ').slice(0, 300));
await p.click('#p-show-gone'); await p.waitForTimeout(2500); await shot(p, 'd-gone-map');
p = await page(1280, 720); await p.goto(base + '?demo=1&plant=1'); await p.waitForTimeout(6000); await shot(p, 'p-planted');
// phone
p = await page(390, 844, true); await p.goto(base); await p.waitForFunction(() => !document.getElementById('btn-plant').disabled, null, { timeout: 20000 });
await shot(p, 'm-home'); await p.click('#btn-plant'); await p.waitForTimeout(3200); await shot(p, 'm-planted');
const heroH = await p.evaluate(() => document.getElementById('hero').offsetHeight); console.log('phone hero height after plant:', heroH);
await p.goto(base + '?plant=1&li=63000070011'); await p.waitForTimeout(6000); await shot(p, 'm-li');
console.log('phone hero visible with sheet:', await p.isVisible('#hero'), '| sheet h:', await p.evaluate(() => document.getElementById('panel').offsetHeight));
await p.evaluate(() => document.getElementById('panel').scrollTo(0, 99999)); await shot(p, 'm-li-bottom');
p = await page(390, 844, true); await p.goto(base + 'about.html'); await p.waitForTimeout(1000); await shot(p, 'm-about');
await b.close();
