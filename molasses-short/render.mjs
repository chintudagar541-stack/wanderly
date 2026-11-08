// Usage: node render.mjs [width=1080] [fps=30] [from=0] [to=67] [outDir=frames]
// Renders every frame in headless Chromium, then stitches an mp4 with ffmpeg.
// If audio/voice.mp3 (or .wav) exists it is muxed in as the voiceover.
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { chromium } from 'playwright';

const W = +(process.argv[2] || 1080), FPS = +(process.argv[3] || 30);
const FROM = +(process.argv[4] || 0), TO = +(process.argv[5] || 61.5);
const OUT = process.argv[6] || 'frames';
const root = path.resolve('.');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': mime[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: Math.round(W * 16 / 9) } });
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:${port}/index.html?render=1&w=${W}`);
await page.waitForFunction('window.__ready === true', null, { timeout: 60000 });
await page.evaluate(() => document.fonts.ready);

const n = Math.round((TO - FROM) * FPS);
for (let i = 0; i < n; i++) {
  const t = FROM + i / FPS;
  const url = await page.evaluate((tt) => window.__renderAt(tt), t);
  fs.writeFileSync(path.join(OUT, `f${String(i + 1).padStart(5, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  if (i % 60 === 0) console.log(`frame ${i}/${n}`);
}
await browser.close(); server.close();

const audio = ['audio/voice.mp3', 'audio/voice.wav'].find((f) => fs.existsSync(f));
const args = ['-y', '-framerate', String(FPS), '-i', path.join(OUT, 'f%05d.jpg')];
if (audio) args.push('-i', audio);
args.push('-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p');
if (audio) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
args.push('molasses-short.mp4');
const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
console.log(r.status === 0 ? 'Done: molasses-short.mp4' : 'ffmpeg failed');
