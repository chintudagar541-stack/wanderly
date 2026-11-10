#!/usr/bin/env node
// Character sheet: full body, poses, expressions, mouth shapes, eye states, head turn.
//   node scripts/sheet.js adrian-cross [out.png]
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const id = process.argv[2] || 'adrian-cross';
const out = path.resolve(process.argv[3] || `out/sheets/${id}.png`);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = []; pg.on('pageerror', (e) => errs.push(String(e))); pg.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await pg.goto(`http://127.0.0.1:${srv.address().port}/renderer/engine/sheet.html?char=${id}`);
try { await pg.waitForFunction(() => window.SHEET_READY, null, { timeout: 30000 }); } catch (e) { console.error('sheet failed', errs.join('\n')); process.exit(1); }
fs.mkdirSync(path.dirname(out), { recursive: true });
await pg.screenshot({ path: out, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
if (errs.length) console.warn(errs.join('\n'));
console.log('sheet', out);
await b.close(); srv.close();
