// Renders web/og.png (link preview) and web/icon.png (home-screen icon) from the live local page.
import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await p.route('**/rest/v1/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await p.goto('http://localhost:8765/?plant=1'); await p.waitForTimeout(6500);
await p.addStyleTag({ content: '.find, .links, #legend, footer, .maplibregl-ctrl-bottom-right { display: none !important; }' });
await p.screenshot({ path: '../web/og.png' });
p = await b.newPage({ viewport: { width: 180, height: 180 } });
await p.setContent('<body style="margin:0;width:180px;height:180px;display:grid;place-items:center;background:#2f7d4f;font-size:120px">🌳</body>');
await p.screenshot({ path: '../web/icon.png' });
await b.close();
