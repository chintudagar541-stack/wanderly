#!/usr/bin/env node
// Renders a scene to MP4 (or still PNGs) by driving the browser engine with Playwright
// and piping frames into FFmpeg.  Every frame is rendered from time t alone, so a scene can be
// split into chunks and rendered in parallel (see .github/workflows/render.yml).
//
//   node renderer/render.js --scene scenes/preview-engine --out out/preview.mp4
//   node renderer/render.js --scene scenes/preview-engine --stills 0,1.5,3 --outdir out/stills
//   node renderer/render.js --scene ... --from 0 --to 10 --out out/part0.mp4 --no-audio
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { mixAudio } from './audio.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => {
  if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return a;
}, []));

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };

function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end('not found'); }
      rsp.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

function sceneFile(s) {
  const p = path.resolve(ROOT, s);
  return fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'scene.json') : p;
}

export async function openEngine(scene, { subs = true } = {}) {
  const srv = await serve();
  const port = srv.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
  const rel = path.relative(ROOT, sceneFile(scene)).split(path.sep).join('/');
  await page.goto(`http://127.0.0.1:${port}/renderer/engine/index.html?scene=/${rel}&subs=${subs ? 1 : 0}`);
  await page.waitForFunction(() => window.ALIBI && (window.ALIBI.ready || window.ALIBI.error), null, { timeout: 60000 });
  const info = await page.evaluate(() => ({ ready: window.ALIBI.ready, error: window.ALIBI.error, duration: window.ALIBI.duration, fps: window.ALIBI.fps, scene: window.ALIBI.scene }));
  await page.evaluate(() => document.fonts.ready);
  if (!info.ready) throw new Error('engine failed to load scene: ' + info.error + '\n' + errors.join('\n'));
  const close = async () => { await browser.close(); srv.close(); };
  return { page, info, errors, close };
}

async function grab(page, t) {
  await page.evaluate((tt) => window.ALIBI.seek(tt), t);
  return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } });
}

async function main() {
  const scene = args.scene; if (!scene) throw new Error('--scene is required');
  const subs = args.subs !== '0';
  const t0 = Date.now();
  const { page, info, errors, close } = await openEngine(scene, { subs });
  const fps = Number(args.fps || info.fps || 24);
  console.log(`scene ${info.scene.id}: ${info.duration.toFixed(2)} s @ ${fps} fps`);
  try {
    if (args.stills) {
      const dir = path.resolve(ROOT, args.outdir || 'out/stills'); fs.mkdirSync(dir, { recursive: true });
      for (const s of String(args.stills).split(',').map(Number)) {
        const png = await grab(page, s);
        const f = path.join(dir, `${info.scene.id}_${s.toFixed(2)}.png`); fs.writeFileSync(f, png); console.log('still', f);
      }
    } else {
      const from = Number(args.from || 0), to = Math.min(Number(args.to || info.duration), info.duration);
      const n = Math.round((to - from) * fps);
      const out = path.resolve(ROOT, args.out || `out/${info.scene.id}.mp4`); fs.mkdirSync(path.dirname(out), { recursive: true });
      const silent = out.replace(/\.mp4$/, '.video.mp4');
      const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(fps), '-i', '-',
        '-c:v', 'libx264', '-preset', args.preset || 'medium', '-crf', String(args.crf || 18), '-pix_fmt', 'yuv420p', '-r', String(fps), silent], { stdio: ['pipe', 'inherit', 'inherit'] });
      const ffDone = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exited ' + c)))));
      for (let i = 0; i < n; i++) {
        const png = await grab(page, from + i / fps);
        if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
        if (i % fps === 0 || i === n - 1) process.stdout.write(`\rframe ${i + 1}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
      }
      ff.stdin.end(); await ffDone; process.stdout.write('\n');
      if (args['no-audio']) fs.renameSync(silent, out);
      else {
        const rep = await mixAudio(ROOT, info.scene, silent, out, { from, to });
        for (const m of rep.missing) console.warn('audio missing (skipped):', m);
        console.log(`audio: ${rep.used.length} cue(s) mixed${rep.used.length ? '' : ' (video is silent)'}`);
        fs.rmSync(silent, { force: true });
      }
      console.log('wrote', out);
    }
    if (errors.length) { console.warn('engine warnings/errors:\n  ' + errors.join('\n  ')); if (errors.some((e) => !e.startsWith('warning'))) process.exitCode = 2; }
  } finally { await close(); }
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error('RENDER FAILED:', e.message || e); process.exit(1); });
