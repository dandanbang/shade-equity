// usage: node tools/shoot.mjs <url> <out.png> [w] [h] — real-browser screenshot + console errors
import { chromium } from 'playwright';
const [url, out, w = 1440, h = 900] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
p.on('console', m => m.type() === 'error' && console.log('console:', m.text()));
p.on('pageerror', e => console.log('pageerror:', e.message));
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(5000);
await p.screenshot({ path: out });
await b.close();
