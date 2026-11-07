#!/usr/bin/env node
// Render a shot list to video (or stills) with headless Chromium + three.js.
// node render.cjs --shots shots/trailer30.json --out out.mp4 [--audio track.m4a]
//                 [--from 0 --to 30] [--stills 0.6,3.4 --stillsDir dir]
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { chromium } = require('playwright');

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') && a.push([v.slice(2), arr[i + 1]]), a), []));
const ROOT = __dirname;
const shotsAbs = path.resolve(args.shots);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const spec = JSON.parse(fs.readFileSync(shotsAbs, 'utf8'));
// --analysis analysis.json: injects the per-frame audio loudness envelope (drives mouth flaps).
if (args.analysis) spec.audioEnv = JSON.parse(fs.readFileSync(args.analysis, 'utf8')).audioEnv;
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/__shots.json') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(spec)); }
  const f = path.join(ROOT, u);
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); res.end(d); });
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: spec.width, height: spec.height } });
  page.on('console', m => m.type() === 'error' && console.error('[page]', m.text()));
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto(`http://localhost:${port}/index.html?shots=/__shots.json`);
  await page.waitForFunction('window.ready === true', null, { timeout: 120000 });
  const grab = async t => Buffer.from((await page.evaluate(t => window.renderAt(t), t)).split(',')[1], 'base64');

  if (args.stills) {
    const dir = args.stillsDir || '.'; fs.mkdirSync(dir, { recursive: true });
    for (const t of args.stills.split(',').map(Number)) { fs.writeFileSync(path.join(dir, `still_${t.toFixed(2)}.jpg`), await grab(t)); console.log('still', t); }
  } else {
    const fps = spec.fps, from = Number(args.from || 0), to = Number(args.to || spec.duration);
    const outH = spec.frameHeight || spec.height, padY = Math.round((outH - spec.height) / 2);
    const ff = ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-'];
    if (args.audio) ff.push('-ss', String(from), '-t', String(to - from), '-i', args.audio);
    ff.push('-vf', `pad=${spec.width}:${outH}:0:${padY}:black,format=yuv420p`, '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-r', String(fps));
    if (args.audio) ff.push('-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest');
    ff.push(args.out);
    const enc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });
    const n0 = Math.round(from * fps), n1 = Math.round(to * fps), t0 = Date.now();
    for (let n = n0; n < n1; n++) {
      const buf = await grab(n / fps);
      if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r));
      if ((n - n0) % 24 === 0) console.log(`frame ${n}/${n1}  ${((Date.now() - t0) / 1000 / (n - n0 + 1)).toFixed(2)}s/frame`);
    }
    enc.stdin.end(); await new Promise(r => enc.on('close', r));
    console.log('wrote', args.out);
  }
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
