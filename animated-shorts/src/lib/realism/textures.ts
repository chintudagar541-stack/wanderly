// Procedural texture tools for the realism library: tileable fbm noise, a per-pixel painter, a grain overlay, painted
// fallback textures (used only when no photo texture fits), and derived maps (normal / roughness) computed from any
// colour image, so every photo texture gets real surface relief and roughness variation.
import * as THREE from "three";
import { rnd } from "../../videos/eiffel/lib";

// ---------------- noise ----------------
const hash = (x: number, y: number, s: number) => rnd(x * 374.761 + y * 668.265 + s * 91.3);
const vnoise = (x: number, y: number, s: number, per: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const w = (a: number) => ((a % per) + per) % per;
  const a = hash(w(xi), w(yi), s), b = hash(w(xi + 1), w(yi), s), c = hash(w(xi), w(yi + 1), s), d = hash(w(xi + 1), w(yi + 1), s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
/** tileable fbm in [0,1] at (x,y) in [0,1)^2 */
export const fbm = (x: number, y: number, s = 1, f0 = 4, oct = 5) => { let v = 0, amp = 0.5, f = f0, n = 0; for (let o = 0; o < oct; o++) { v += amp * vnoise(x * f, y * f, s + o * 17, f); n += amp; amp *= 0.5; f *= 2; } return v / n; };

const GRIT = new Map<number, HTMLCanvasElement>();
/** a tileable grey fbm canvas used as an overlay grain */
const gritCanvas = (s: number) => { let c = GRIT.get(s); if (c) return c;
  c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!, im = g.createImageData(128, 128);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const v = fbm(x / 128, y / 128, s, 4, 5) * 0.7 + hash(x, y, s) * 0.3, i = (y * 128 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = Math.round(v * 255); im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); GRIT.set(s, c); return c; };
/** overlay fine grain + mottling on a painted canvas (k = strength) */
export const grit = (g: CanvasRenderingContext2D, w: number, h: number, k = 0.35, s = 1) => {
  const c = gritCanvas(s); g.save(); g.globalCompositeOperation = "overlay"; g.globalAlpha = k;
  const step = Math.max(64, Math.round(Math.min(w, h) / 2)); for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) g.drawImage(c, x, y, step, step);
  g.restore(); };

/** per-pixel painter for a canvas: f(u, v) -> [r, g, b] (0..255) */
export const paint = (w: number, h: number, f: (u: number, v: number, x: number, y: number) => [number, number, number]) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d")!, im = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [r, gg, b] = f(x / w, y / h, x, y), i = (y * w + x) * 4; im.data[i] = r; im.data[i + 1] = gg; im.data[i + 2] = b; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); return c; };
export const texOf = (c: HTMLCanvasElement, repeat?: [number, number]) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); } return t; };
const hex = (c: string) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixc = (a: number[], b: number[], t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** oak floorboards: per-plank tone, long grain streaks, knots, dark gaps */
export const woodFloor = (repeat: [number, number]) => texOf(paint(512, 512, (u, v, x, y) => {
  const row = Math.floor(v * 8), off = rnd(row) * 0.6, col = Math.floor((u + off) * 2), id = row * 7 + col;
  const tone = 0.75 + rnd(id + 3) * 0.35, grain = fbm(((u + off) * 0.25) % 1, (v * 8) % 1 * 0.08 + rnd(id) * 0.9, id % 5 + 2, 4, 5);
  const streak = 0.5 + 0.5 * Math.sin((v * 8 % 1) * 40 + grain * 18 + rnd(id) * 6);
  const knot = Math.max(0, 1 - Math.hypot(((u + off) * 2 % 1) - rnd(id + 9), (v * 8 % 1) - 0.5) * 9) * (rnd(id + 4) < 0.3 ? 1 : 0);
  const gap = (v * 8 % 1) < 0.025 || ((u + off) * 2 % 1) < 0.006 ? 0.35 : 1;
  const base = mixc([150, 92, 52], [196, 138, 84], streak * 0.6 + grain * 0.4);
  const k = tone * gap * (1 - knot * 0.5);
  return [base[0] * k, base[1] * k, base[2] * k];
}), repeat);
/** painted plaster / wallpaper base with soft mottling and a damask print */
export const wallPaper = (base: string, print: string, repeat: [number, number]) => { const B = hex(base), Pr = hex(print);
  return texOf(paint(256, 256, (u, v) => { const m = fbm(u, v, 3, 3, 5), cx = (u * 4) % 1 - 0.5, cy = (v * 4) % 1 - 0.5, r = Math.hypot(cx, cy * 0.8), a = Math.atan2(cy, cx);
    const motif = r < 0.32 && Math.abs(Math.sin(a * 3 + r * 10)) * (0.32 - r) > 0.06 ? 1 : 0; const stripe = Math.abs(((u * 8) % 1) - 0.5) < 0.03 ? 0.4 : 0;
    const c = mixc(B, Pr, motif * 0.8 + stripe * 0.5); const k = 0.86 + m * 0.24; return [c[0] * k, c[1] * k, c[2] * k]; }), repeat); };
/** woven fabric: fine weave + soft folds */
export const fabric = (col: string, repeat: [number, number], col2?: string) => { const A = hex(col), C2 = col2 ? hex(col2) : A;
  return texOf(paint(256, 256, (u, v, x, y) => { const weave = ((x >> 1) + (y >> 1)) % 2 ? 0.93 : 1.05, fold = 0.85 + 0.25 * fbm(u, v * 0.3, 7, 2, 3), check = col2 && ((Math.floor(u * 4) + Math.floor(v * 4)) % 2) ? 1 : 0;
    const c = check ? C2 : A; const k = weave * fold; return [c[0] * k, c[1] * k, c[2] * k]; }), repeat); };
/** plush carpet with a printed medallion pattern and fuzz */
export const rug = () => texOf(paint(512, 512, (u, v, x, y) => {
  const dx = u - 0.5, dy = v - 0.5, r = Math.hypot(dx, dy), edge = Math.max(Math.abs(dx), Math.abs(dy));
  let c: [number, number, number] = [150, 34, 38];
  if (edge > 0.47) c = [60, 30, 40]; else if (edge > 0.44) c = [214, 168, 80]; else if (edge > 0.4) c = [38, 58, 110];
  else if (r < 0.3) { const ring = Math.floor(r * 30) % 3; c = ring === 0 ? [214, 168, 80] : ring === 1 ? [38, 58, 110] : [168, 40, 50]; if (Math.abs(Math.sin(Math.atan2(dy, dx) * 8)) * (0.3 - r) > 0.05) c = [236, 226, 200]; }
  const fuzz = 0.82 + 0.18 * hash(x, y, 5) + 0.15 * (fbm(u, v, 9, 6, 3) - 0.5); return [c[0] * fuzz, c[1] * fuzz, c[2] * fuzz];
}));
/** concrete / asphalt with specks and stains */
export const concrete = (base: string, repeat: [number, number], speck = 0.25) => { const B = hex(base);
  return texOf(paint(256, 256, (u, v, x, y) => { const m = fbm(u, v, 11, 3, 6), s = hash(x, y, 2) < speck * 0.08 ? (hash(x, y, 3) < 0.5 ? 0.6 : 1.35) : 1; const k = (0.78 + m * 0.4) * s; return [B[0] * k, B[1] * k, B[2] * k]; }), repeat); };
/** lunar regolith: grey dust with small craters and pebbles */
export const regolith = (repeat: [number, number]) => texOf(paint(512, 512, (u, v, x, y) => {
  let k = 0.62 + 0.38 * fbm(u, v, 21, 4, 6);
  for (let i = 0; i < 26; i++) { const cx = rnd(i * 3 + 1), cy = rnd(i * 3 + 2), r = 0.01 + rnd(i * 3 + 3) ** 2 * 0.08; let dx = u - cx, dy = v - cy; dx -= Math.round(dx); dy -= Math.round(dy); const d = Math.hypot(dx, dy) / r;
    if (d < 1) k *= 0.72 + 0.28 * d - 0.15 * (dx + dy) / r; else if (d < 1.25) k *= 1.15; }
  if (hash(x, y, 7) < 0.012) k *= 1.4;
  return [168 * k, 165 * k, 162 * k];
}), repeat);
/** building facade: brick or panel wall with rows of windows, some lit warm, some dark with sky reflections */

// ---------------- derived maps ----------------
const imgData = (img: CanvasImageSource & { width: number; height: number }, size = 256) => {
  const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, 0, 0, size, size); return g.getImageData(0, 0, size, size); };
const DER = new WeakMap<THREE.Texture, { normal: THREE.Texture; rough: THREE.Texture }>();
/** a tangent-space normal map (Sobel of luminance, wraps) and a roughness map (crevices rougher) from a colour texture */
export const derivedMaps = (t: THREE.Texture, strength = 2.2, roughBase = 0.78, roughVar = 0.3) => {
  const got = DER.get(t); if (got) return got;
  const S = 256, d = imgData(t.image as HTMLImageElement, S).data, L = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) L[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
  const at = (x: number, y: number) => L[((y + S) % S) * S + ((x + S) % S)];
  const nc = document.createElement("canvas"), rc = document.createElement("canvas"); nc.width = nc.height = rc.width = rc.height = S;
  const ng = nc.getContext("2d")!, rg = rc.getContext("2d")!, ni = ng.createImageData(S, S), ri = rg.createImageData(S, S);
  let mean = 0; for (let i = 0; i < S * S; i++) mean += L[i]; mean /= S * S;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
    const dy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
    let nx = -dx * strength, ny = dy * strength, nz = 1; const k = 1 / Math.hypot(nx, ny, nz); nx *= k; ny *= k; nz *= k;
    const i = (y * S + x) * 4; ni.data[i] = (nx * 0.5 + 0.5) * 255; ni.data[i + 1] = (ny * 0.5 + 0.5) * 255; ni.data[i + 2] = (nz * 0.5 + 0.5) * 255; ni.data[i + 3] = 255;
    const r = Math.max(0.05, Math.min(1, roughBase + (mean - L[y * S + x]) * roughVar * 2)); ri.data[i] = ri.data[i + 1] = ri.data[i + 2] = r * 255; ri.data[i + 3] = 255; }
  ng.putImageData(ni, 0, 0); rg.putImageData(ri, 0, 0);
  const mk = (c: HTMLCanvasElement) => { const tt = new THREE.CanvasTexture(c); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.anisotropy = 8; tt.colorSpace = THREE.NoColorSpace; return tt; };
  const out = { normal: mk(nc), rough: mk(rc) }; DER.set(t, out); return out; };

/** a shared micro-surface (fine noise normal + roughness wobble) so painted / plastic / metal parts are never perfectly flat */
let MICRO: { normal: THREE.Texture; rough: THREE.Texture } | null = null;
export const micro = () => {
  if (MICRO) return MICRO;
  const c = paint(256, 256, (u, v, x, y) => { const n = fbm(u, v, 41, 8, 4) * 0.75 + 0.25 * rnd(x * 7.1 + y * 13.3); const k = 110 + n * 120; return [k, k, k]; });
  const t = new THREE.CanvasTexture(c); t.image = c; MICRO = derivedMaps(t, 1.2, 0.6, 0.35); return MICRO; };

// ---------------- painted fallbacks with wear (use a photo texture when one fits) ----------------
/** wood planks / boards with grain, knots, worn edges */
export const woodTex = (light = false) => texOf(paint(512, 512, (u, v, x, y) => {
  const row = Math.floor(v * 6), off = rnd(row) * 0.6, id = row * 7 + Math.floor((u + off) * 2);
  const grain = fbm(((u + off) * 0.25) % 1, ((v * 6) % 1) * 0.1 + rnd(id) * 0.9, (id % 5) + 2, 4, 5), streak = 0.5 + 0.5 * Math.sin(((v * 6) % 1) * 36 + grain * 16 + rnd(id) * 6);
  const edge = Math.min((v * 6) % 1, 1 - ((v * 6) % 1)) < 0.03 ? 0.55 : 1, tone = 0.8 + rnd(id + 3) * 0.3, wear = 0.9 + 0.2 * fbm(u, v, 77, 3, 3);
  const a = light ? [190, 140, 92] : [120, 72, 40], b = light ? [222, 178, 124] : [158, 102, 60], k = tone * edge * wear, s = streak * 0.6 + grain * 0.4;
  return [(a[0] + (b[0] - a[0]) * s) * k, (a[1] + (b[1] - a[1]) * s) * k, (a[2] + (b[2] - a[2]) * s) * k];
}), [1, 1]);
/** concrete with stains, pores and hairline cracks */
export const crackedConcrete = (base = "#9a968e") => { const B = [parseInt(base.slice(1, 3), 16), parseInt(base.slice(3, 5), 16), parseInt(base.slice(5, 7), 16)];
  return texOf(paint(512, 512, (u, v, x, y) => { let k = 0.8 + 0.35 * fbm(u, v, 3, 3, 6); if (rnd(x * 3.3 + y * 7.7) < 0.01) k *= 0.6;
    const cr = Math.abs(fbm(u, v, 19, 3, 5) - 0.5); if (cr < 0.006) k *= 0.45; const st = fbm(u * 0.5, v * 0.5, 5, 2, 3); if (st > 0.66) k *= 0.85;
    return [B[0] * k, B[1] * k, B[2] * k]; }), [1, 1]); };
