// Usage: node stills.mjs 1.5,4,9.5 [width=360] [outDir=stills]  -> PNG stills for quick look checks
import http from 'http'; import fs from 'fs'; import path from 'path'; import { chromium } from 'playwright';
const times = (process.argv[2] || '1.5').split(',').map(Number), W = +(process.argv[3] || 360), OUT = process.argv[4] || 'stills';
const root = path.resolve('.'); const mime = { '.html': 'text/html', '.js': 'text/javascript' };
const server = http.createServer((req, res) => { const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html')); if (!fs.existsSync(p)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': mime[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: W, height: Math.round(W * 16 / 9) } });
pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text().slice(0, 300)); }); pg.on('pageerror', (e) => console.log('[pageerror]', e.message));
await pg.goto(`http://localhost:${server.address().port}/index.html?render=1&w=${W}`);
await pg.waitForFunction('window.__ready === true', null, { timeout: 60000 });
for (const t of times) { const u = await pg.evaluate((x) => window.__renderAt(x), t); fs.writeFileSync(path.join(OUT, `s_${String(t).replace('.', '_')}.jpg`), Buffer.from(u.split(',')[1], 'base64')); }
await b.close(); server.close(); console.log('ok');
