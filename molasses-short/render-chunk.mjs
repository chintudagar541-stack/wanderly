// Renders frames [start, end) of the film to an mp4 (video only).
// Usage: node render-chunk.mjs <width> <startFrame> <endFrame> <out.mp4> [fps=30]
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { chromium } from 'playwright';

const [W, A, Bf, OUT, FPS = 30] = [+process.argv[2], +process.argv[3], +process.argv[4], process.argv[5], +(process.argv[6] || 30)];
const root = path.resolve('.');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': mime[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const dir = `frames_${A}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: Math.round(W * 16 / 9) } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:${server.address().port}/index.html?render=1&w=${W}`);
await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
const t0 = Date.now();
for (let f = A; f < Bf; f++) {
  const url = await page.evaluate((tt) => window.__renderAt(tt), f / FPS);
  fs.writeFileSync(path.join(dir, `f${String(f - A).padStart(5, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  if ((f - A) % 10 === 0) console.log(`frame ${f} (${((Date.now() - t0) / 1000 / Math.max(1, f - A)).toFixed(1)} s/frame)`);
}
await browser.close(); server.close();
const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%05d.jpg'),
  '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', String(FPS), OUT], { stdio: 'inherit' });
process.exit(r.status);
