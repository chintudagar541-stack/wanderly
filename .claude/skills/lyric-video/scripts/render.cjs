#!/usr/bin/env node
// node render.cjs --timing timing.json --song song.mp3 --out video.mp4
//   [--singer photo.png] [--credit "Artist - Title"] [--switchAt 21.5] [--fps 30]
//   [--placeholder] [--stills 3,20,30 --stillsDir dir]
// --placeholder swaps every lyric word for a dummy word (same timing) for style previews.
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { chromium } = require('playwright');
const args = {}; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i++) if (av[i].startsWith('--')) { const k = av[i].slice(2); args[k] = av[i + 1] && !av[i + 1].startsWith('--') ? av[++i] : true; }

const ROOT = __dirname;
const timing = JSON.parse(fs.readFileSync(args.timing, 'utf8'));
if (args.placeholder) {
  const dummy = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor'];
  let k = 0; for (const l of timing.lines) for (const w of l.words) w.w = dummy[k++ % dummy.length];
}
const cfg = { width: 1920, height: 1080, timing, singer: !!args.singer, credit: args.credit || '', switchAt: args.switchAt ? Number(args.switchAt) : undefined };
const fps = Number(args.fps || 30);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/__cfg.json') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(cfg)); }
  const f = u === '/__singer' ? path.resolve(args.singer) : path.join(ROOT, u);
  if (u !== '/__singer' && !f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); res.end(d); });
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: cfg.width, height: cfg.height } });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto(`http://localhost:${server.address().port}/index.html`);
  await page.waitForFunction('window.ready === true', null, { timeout: 120000 });
  const grab = async t => Buffer.from((await page.evaluate(t => window.renderAt(t), t)).split(',')[1], 'base64');
  const dur = await page.evaluate('window.DUR');
  if (args.stills) {
    fs.mkdirSync(args.stillsDir || '.', { recursive: true });
    for (const t of String(args.stills).split(',').map(Number)) fs.writeFileSync(path.join(args.stillsDir || '.', `still_${t.toFixed(2)}.jpg`), await grab(t));
    console.log('stills done; switch at', await page.evaluate('window.SWITCH'));
  } else {
    const s0 = timing.segment.start, s1 = timing.segment.end;
    const ff = ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-ss', String(s0), '-to', String(s1), '-i', args.song,
      '-map', '0:v', '-map', '1:a', '-af', `afade=t=in:d=0.6,afade=t=out:st=${(s1 - s0 - 1).toFixed(2)}:d=1`,
      '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k', '-shortest', args.out];
    const enc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });
    const n = Math.round(dur * fps), t0 = Date.now();
    for (let i = 0; i < n; i++) {
      const b = await grab(i / fps);
      if (!enc.stdin.write(b)) await new Promise(r => enc.stdin.once('drain', r));
      if (i % 60 === 0) console.log(`frame ${i}/${n} ${((Date.now() - t0) / 1000 / (i + 1)).toFixed(2)}s/f`);
    }
    enc.stdin.end(); await new Promise(r => enc.on('close', r)); console.log('wrote', args.out);
  }
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
