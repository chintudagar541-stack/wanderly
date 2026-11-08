// Procedural Canvas2D texture library: stylised, slightly hand-painted surfaces for the cartoon-3D sets.
//
// Every texture function returns a cached THREE.CanvasTexture (sRGB, anisotropy 8, mipmaps on). Calling a function
// twice with the same options returns the same texture object, so it is cheap to call per frame.
//
// TILE SIZE CONVENTION: one texture tile = 1 x 1 metre unless the doc comment says otherwise. Use
// `texRepeat(tex, surfaceW, surfaceH, tileW, tileH)` to get a clone with `repeat` = surface size / tile size.
// Tileable textures use RepeatWrapping and are seamless. Single-image textures (rugs, windows, signs, labels,
// bushes, parchment with edges) use ClampToEdge and map once onto their surface.
//
// All randomness is seeded (mulberry32), so every frame and every render process draws identical textures.
// Pass `seed` to get a different variant of the same material.
import * as THREE from "three";

/* ---------------------------------------------------------------- seeded randomness */

export type RNG = () => number;

function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** mulberry32 seeded RNG: returns floats in [0, 1). */
export function seededRng(seed: number | string): RNG {
  let s = (typeof seed === "string" ? hashStr(seed) : Math.floor(seed * 9973 + 17)) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** a fresh RNG for a (seed, a, b) cell, so wrapped copies of one brick/plank get the same values */
const cellRng = (seed: number, a: number, b = 0) => seededRng(`${seed}|${a}|${b}`);
const range = (r: RNG, lo: number, hi: number) => lo + (hi - lo) * r();
const pick = <T,>(r: RNG, arr: readonly T[]): T => arr[Math.floor(r() * arr.length) % arr.length];

/* ---------------------------------------------------------------- colour helpers */

type RGB = [number, number, number];
function hex2rgb(c: string): RGB {
  let h = c.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
function rgb2hex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((v) => clamp255(v).toString(16).padStart(2, "0")).join("");
}
/** lighten (amt > 0, toward white) or darken (amt < 0, toward black); amt in -1..1 */
export function shade(c: string, amt: number): string {
  const [r, g, b] = hex2rgb(c);
  if (amt >= 0) return rgb2hex([r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt]);
  const k = 1 + amt;
  return rgb2hex([r * k, g * k, b * k]);
}
/** linear mix of two hex colours */
export function mix(a: string, b: string, t: number): string {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}
const rgba = (c: string, a: number) => { const [r, g, b] = hex2rgb(c); return `rgba(${r},${g},${b},${a})`; };
/** random brightness + slight warm/cool shift */
function jit(c: string, r: RNG, amt: number, hue = 0.25): string {
  const s = shade(c, (r() * 2 - 1) * amt);
  const [R, G, B] = hex2rgb(s);
  const w = (r() * 2 - 1) * amt * 40 * hue;
  return rgb2hex([R + w, G + w * 0.3, B - w]);
}

/* ---------------------------------------------------------------- canvas helpers */

type Ctx = CanvasRenderingContext2D;

function rrect(g: Ctx, x: number, y: number, w: number, h: number, r: number) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}

/** call fn at every periodic copy of (x, y) that can touch the canvas (for seamless tiles) */
function wrap(W: number, H: number, x: number, y: number, m: number, fn: (x: number, y: number) => void) {
  for (const dx of [-W, 0, W]) for (const dy of [-H, 0, H]) {
    const X = x + dx, Y = y + dy;
    if (X > -m && X < W + m && Y > -m && Y < H + m) fn(X, Y);
  }
}

/** periodic value noise: f(u, v) for u, v in tile units [0, 1), period = `cells` cells */
function periodicNoise(seed: number, cells: number) {
  const r = seededRng(seed * 7.13 + cells);
  const g = new Float32Array(cells * cells);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const sm = (t: number) => t * t * (3 - 2 * t);
  return (u: number, v: number) => {
    const x = u * cells, y = v * cells;
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = sm(x - xi), fy = sm(y - yi);
    const x0 = ((xi % cells) + cells) % cells, y0 = ((yi % cells) + cells) % cells;
    const x1 = (x0 + 1) % cells, y1 = (y0 + 1) % cells;
    const a = g[y0 * cells + x0], b = g[y0 * cells + x1], c = g[y1 * cells + x0], d = g[y1 * cells + x1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}
function fbm(seed: number, cells: number, oct: number) {
  const fs = Array.from({ length: oct }, (_, i) => periodicNoise(seed + i * 31, cells * 2 ** i));
  return (u: number, v: number) => {
    let s = 0, a = 1, n = 0;
    for (const f of fs) { s += f(u, v) * a; n += a; a *= 0.5; }
    return s / n;
  };
}

/** soft brightness variation over the whole canvas (seamless). amp = max change in 0..1 brightness */
function noiseLayer(g: Ctx, W: number, H: number, o: { seed: number; cells?: number; oct?: number; amp?: number; tint?: string; alphaOnly?: boolean }) {
  const f = fbm(o.seed, o.cells ?? 4, o.oct ?? 3);
  const amp = (o.amp ?? 0.06) * 255;
  const tint = o.tint ? hex2rgb(o.tint) : null;
  const img = g.getImageData(0, 0, W, H);
  const d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (d[i + 3] === 0) continue;
    const n = (f(x / W, y / H) - 0.5) * 2;
    if (tint) {
      const t = Math.max(0, n) * (o.amp ?? 0.3);
      d[i] += (tint[0] - d[i]) * t; d[i + 1] += (tint[1] - d[i + 1]) * t; d[i + 2] += (tint[2] - d[i + 2]) * t;
    } else {
      d[i] = clamp255(d[i] + n * amp); d[i + 1] = clamp255(d[i + 1] + n * amp); d[i + 2] = clamp255(d[i + 2] + n * amp);
    }
  }
  g.putImageData(img, 0, 0);
}

/** fine per-pixel grain (deterministic, seamless because it is per-pixel) */
function grain(g: Ctx, W: number, H: number, seed: number, amp = 0.025) {
  const r = seededRng(seed + 0.5);
  const img = g.getImageData(0, 0, W, H), d = img.data, a = amp * 255;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const n = (r() - 0.5) * 2 * a;
    d[i] = clamp255(d[i] + n); d[i + 1] = clamp255(d[i + 1] + n); d[i + 2] = clamp255(d[i + 2] + n);
  }
  g.putImageData(img, 0, 0);
}

/** painterly brush dabs inside the current clip: short soft horizontal-ish strokes */
function brushDabs(g: Ctx, r: RNG, x: number, y: number, w: number, h: number, col: string, n: number, alpha: number, len = 0.5, angle = 0) {
  g.save();
  g.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const cx = x + r() * w, cy = y + r() * h, L = w * len * (0.4 + r() * 0.8);
    const a = angle + (r() - 0.5) * 0.25;
    g.strokeStyle = rgba(r() < 0.5 ? shade(col, 0.12) : shade(col, -0.1), alpha * (0.5 + r() * 0.5));
    g.lineWidth = Math.max(1, h * (0.12 + r() * 0.22));
    g.beginPath();
    g.moveTo(cx - Math.cos(a) * L / 2, cy - Math.sin(a) * L / 2);
    g.quadraticCurveTo(cx, cy + (r() - 0.5) * h * 0.2, cx + Math.cos(a) * L / 2, cy + Math.sin(a) * L / 2);
    g.stroke();
  }
  g.restore();
}

/** a bevelled block (brick / stone / tile): fill, painterly dabs, light top+left edge, dark bottom+right edge */
function bevelBlock(g: Ctx, r: RNG, x: number, y: number, w: number, h: number, col: string, o: { rad?: number; bevel?: number; dabs?: number; dabAlpha?: number; hi?: number; lo?: number } = {}) {
  const rad = o.rad ?? Math.min(w, h) * 0.08, bv = o.bevel ?? Math.max(2, Math.min(w, h) * 0.08);
  g.save();
  rrect(g, x, y, w, h, rad);
  g.fillStyle = col; g.fill();
  g.clip();
  // gentle vertical light falloff
  const lg = g.createLinearGradient(0, y, 0, y + h);
  lg.addColorStop(0, rgba("#ffffff", 0.07)); lg.addColorStop(1, rgba("#000000", 0.07));
  g.fillStyle = lg; g.fillRect(x, y, w, h);
  if ((o.dabs ?? 4) > 0) brushDabs(g, r, x, y, w, h, col, o.dabs ?? 4, o.dabAlpha ?? 0.35);
  // edges
  g.fillStyle = rgba("#ffffff", o.hi ?? 0.28); g.fillRect(x, y, w, bv * 0.7);
  g.fillStyle = rgba("#ffffff", (o.hi ?? 0.28) * 0.5); g.fillRect(x, y, bv * 0.6, h);
  g.fillStyle = rgba("#000000", o.lo ?? 0.22); g.fillRect(x, y + h - bv * 0.8, w, bv * 0.8);
  g.fillStyle = rgba("#000000", (o.lo ?? 0.22) * 0.6); g.fillRect(x + w - bv * 0.6, y, bv * 0.6, h);
  g.restore();
}

/* ---------------------------------------------------------------- texture factory + cache */

const TEX_CACHE = new Map<string, THREE.CanvasTexture>();
/** Every texture created by this module, by cache key (the preview sheet reads the canvases from here). */
export const textureCache: ReadonlyMap<string, THREE.CanvasTexture> = TEX_CACHE;

function makeTex(key: string, W: number, H: number, draw: (g: Ctx, W: number, H: number) => void, tile = true): THREE.CanvasTexture {
  const hit = TEX_CACHE.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true }) as Ctx;
  draw(g, W, H);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = tile ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.name = key;
  t.needsUpdate = true;
  TEX_CACHE.set(key, t);
  return t;
}
const keyOf = (name: string, o: object) => name + JSON.stringify(o);

/**
 * Clone `tex` with repeat = surface size / tile size (the clone shares the canvas). Example: a 6 x 3 m wall with the
 * 1 m brick tile -> texRepeat(bricks(), 6, 3). Pass tileW/tileH for textures whose tile is not 1 m (e.g. grass = 2).
 */
export function texRepeat(tex: THREE.Texture, w: number, h: number, tileW = 1, tileH = tileW): THREE.Texture {
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(w / tileW, h / tileH);
  return t;
}

/* ================================================================ WALLS: bricks & stone */

type BrickOpts = { color?: string; grout?: string; cols?: number; rows?: number; vary?: number; seed?: number };

function drawBricks(g: Ctx, S: number, o: Required<BrickOpts> & { raw: boolean }) {
  const bw = S / o.cols, bh = S / o.rows, gr = Math.max(3, S * 0.011);
  g.fillStyle = o.grout; g.fillRect(0, 0, S, S);
  noiseLayer(g, S, S, { seed: o.seed + 3, cells: 16, amp: 0.05 });
  for (let row = 0; row < o.rows; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let c = -1; c <= o.cols; c++) {
      const ci = ((c % o.cols) + o.cols) % o.cols;
      const r = cellRng(o.seed, row, ci);
      let col = jit(o.color, r, o.vary);
      if (o.raw && r() < 0.12) col = shade(col, -0.18 - r() * 0.1); // occasional burnt brick
      if (o.raw && r() < 0.08) col = mix(col, "#c9a27a", 0.25); // pale brick
      const x = c * bw + off + gr / 2, y = row * bh + gr / 2;
      bevelBlock(g, r, x, y, bw - gr, bh - gr, col, { rad: o.raw ? 4 : 3, bevel: bh * 0.12, dabs: o.raw ? 6 : 4, dabAlpha: o.raw ? 0.45 : 0.3, hi: 0.3, lo: 0.2 });
      if (o.raw) { // pits
        g.save(); rrect(g, x, y, bw - gr, bh - gr, 4); g.clip();
        for (let k = 0; k < 6; k++) { g.fillStyle = rgba("#000000", 0.12 + r() * 0.1); g.beginPath(); g.arc(x + r() * bw, y + r() * bh, 1 + r() * 2, 0, 7); g.fill(); }
        g.restore();
      }
    }
  }
  noiseLayer(g, S, S, { seed: o.seed, cells: 3, amp: 0.05 });
}

/**
 * Painted brick wall (like the green office wall in the reference). Tile = 1 x 1 m, default 4 bricks across x 10 rows.
 * @param color brick paint colour
 * @param grout grout / mortar line colour (darker than the paint for the painted look)
 */
export function bricks(color = "#7fc79a", grout = "#4f8c6a", o: Omit<BrickOpts, "color" | "grout"> = {}): THREE.CanvasTexture {
  const p = { color, grout, cols: o.cols ?? 4, rows: o.rows ?? 10, vary: o.vary ?? 0.05, seed: o.seed ?? 1 };
  return makeTex(keyOf("bricks", p), 512, 512, (g, S) => drawBricks(g, S, { ...p, raw: false }));
}

/** Raw red / brown fired bricks with light mortar. Tile = 1 x 1 m, 4 across x 13 rows. */
export function rawBricks(o: BrickOpts = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#b0503a", grout: o.grout ?? "#cdbfa8", cols: o.cols ?? 4, rows: o.rows ?? 13, vary: o.vary ?? 0.12, seed: o.seed ?? 2 };
  return makeTex(keyOf("rawBricks", p), 512, 512, (g, S) => drawBricks(g, S, { ...p, raw: true }));
}

/** Castle / fort wall of dressed stone blocks in courses of different heights. Tile = 2 x 2 m. */
export function stoneBlocks(o: { color?: string; mortar?: string; seed?: number; vary?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#b9b2c4", mortar: o.mortar ?? "#6d6578", seed: o.seed ?? 3, vary: o.vary ?? 0.08 };
  return makeTex(keyOf("stoneBlocks", p), 512, 512, (g, S) => {
    g.fillStyle = p.mortar; g.fillRect(0, 0, S, S);
    const r0 = seededRng(p.seed);
    // course heights summing to S
    const hs: number[] = []; let tot = 0;
    while (tot < S) { const h = pick(r0, [S / 8, S / 6, S / 7, S / 10]); hs.push(h); tot += h; }
    const k = S / tot; for (let i = 0; i < hs.length; i++) hs[i] *= k;
    const gr = 5;
    let y = 0;
    hs.forEach((h, row) => {
      const ws: number[] = []; let t = 0;
      while (t < S) { const w = h * range(r0, 1.2, 2.6); ws.push(w); t += w; }
      const kk = S / t; for (let i = 0; i < ws.length; i++) ws[i] *= kk;
      const start = r0() * S;
      let x = start;
      ws.forEach((w, i) => {
        const r = cellRng(p.seed, row, i);
        const col = jit(p.color, r, p.vary, 0.6);
        wrap(S, S, x, y, w + 10, (X, Y) => {
          bevelBlock(g, cellRng(p.seed, row, i), X + gr / 2, Y + gr / 2, w - gr, h - gr, col, { rad: 6, bevel: 7, dabs: 7, dabAlpha: 0.4, hi: 0.32, lo: 0.28 });
          // a chip or crack now and then
          g.save(); rrect(g, X + gr / 2, Y + gr / 2, w - gr, h - gr, 6); g.clip();
          const rr = cellRng(p.seed + 9, row, i);
          if (rr() < 0.35) { g.strokeStyle = rgba("#000000", 0.25); g.lineWidth = 1.5; g.beginPath(); let cx = X + rr() * w, cy = Y; g.moveTo(cx, cy); for (let s = 0; s < 4; s++) { cx += (rr() - 0.5) * 14; cy += h * 0.18; g.lineTo(cx, cy); } g.stroke(); }
          for (let s = 0; s < 5; s++) { g.fillStyle = rgba("#000000", 0.08); g.beginPath(); g.arc(X + rr() * w, Y + rr() * h, 1 + rr() * 3, 0, 7); g.fill(); }
          g.restore();
        });
        x += w;
      });
      y += h;
    });
    noiseLayer(g, S, S, { seed: p.seed, cells: 4, amp: 0.07 });
  });
}

/** Rounded cobblestones in loose rows (old streets, castle courtyards). Tile = 1 x 1 m, ~8 x 10 stones. */
export function cobblestones(o: { color?: string; gap?: string; seed?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#9a96a8", gap: o.gap ?? "#4c4856", seed: o.seed ?? 4 };
  return makeTex(keyOf("cobble", p), 512, 512, (g, S) => {
    g.fillStyle = p.gap; g.fillRect(0, 0, S, S);
    noiseLayer(g, S, S, { seed: p.seed + 1, cells: 12, amp: 0.08 });
    const rows = 10, cols = 8, ch = S / rows, cw = S / cols;
    for (let row = 0; row < rows; row++) for (let c = 0; c < cols; c++) {
      const r = cellRng(p.seed, row, c);
      const cx = (c + 0.5 + (row % 2) * 0.5) * cw + (r() - 0.5) * cw * 0.15, cy = (row + 0.5) * ch + (r() - 0.5) * ch * 0.12;
      const w = cw * range(r, 0.78, 0.9), h = ch * range(r, 0.74, 0.86);
      const col = jit(p.color, r, 0.12, 0.8);
      wrap(S, S, cx, cy, cw, (X, Y) => {
        const rr = cellRng(p.seed, row, c);
        g.save();
        g.fillStyle = rgba("#000000", 0.35); g.beginPath(); g.ellipse(X + 2, Y + 3, w / 2, h / 2, 0, 0, 7); g.fill();
        g.beginPath(); g.ellipse(X, Y, w / 2, h / 2, (rr() - 0.5) * 0.3, 0, 7);
        const rg = g.createRadialGradient(X - w * 0.18, Y - h * 0.22, 1, X, Y, w * 0.6);
        rg.addColorStop(0, shade(col, 0.22)); rg.addColorStop(0.6, col); rg.addColorStop(1, shade(col, -0.3));
        g.fillStyle = rg; g.fill();
        g.clip(); brushDabs(g, rr, X - w / 2, Y - h / 2, w, h, col, 3, 0.3);
        g.restore();
      });
    }
    grain(g, S, S, p.seed, 0.02);
  });
}

/** Irregular rectangular flagstone floor (castle halls, courtyards). Tile = 2 x 2 m. */
export function flagstoneFloor(o: { color?: string; grout?: string; seed?: number; vary?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#b8aea0", grout: o.grout ?? "#5e554c", seed: o.seed ?? 5, vary: o.vary ?? 0.1 };
  return makeTex(keyOf("flag", p), 512, 512, (g, S) => {
    g.fillStyle = p.grout; g.fillRect(0, 0, S, S);
    const r0 = seededRng(p.seed);
    const rects: [number, number, number, number][] = [];
    const split = (x: number, y: number, w: number, h: number, d: number) => {
      const big = Math.max(w, h);
      if (d > 5 || (big < S * 0.32 && r0() < 0.55) || big < S * 0.16) { rects.push([x, y, w, h]); return; }
      const vert = w > h * 1.2 ? true : h > w * 1.2 ? false : r0() < 0.5;
      const t = range(r0, 0.35, 0.65);
      if (vert) { split(x, y, w * t, h, d + 1); split(x + w * t, y, w * (1 - t), h, d + 1); }
      else { split(x, y, w, h * t, d + 1); split(x, y + h * t, w, h * (1 - t), d + 1); }
    };
    // 2 x 2 big cells so every tile has many slabs
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) split(i * S / 2, j * S / 2, S / 2, S / 2, 0);
    const gr = 6;
    rects.forEach(([x, y, w, h], i) => {
      const r = cellRng(p.seed, i);
      const col = jit(p.color, r, p.vary, 0.7);
      bevelBlock(g, r, x + gr / 2, y + gr / 2, w - gr, h - gr, col, { rad: 8, bevel: 6, dabs: 8, dabAlpha: 0.35, hi: 0.22, lo: 0.25 });
      g.save(); rrect(g, x + gr / 2, y + gr / 2, w - gr, h - gr, 8); g.clip();
      for (let s = 0; s < 4; s++) { const rg = g.createRadialGradient(x + r() * w, y + r() * h, 0, x + r() * w, y + r() * h, 30 + r() * 40); rg.addColorStop(0, rgba("#000000", 0.07)); rg.addColorStop(1, rgba("#000000", 0)); g.fillStyle = rg; g.fillRect(x, y, w, h); }
      g.restore();
    });
    noiseLayer(g, S, S, { seed: p.seed + 2, cells: 4, amp: 0.06 });
    grain(g, S, S, p.seed, 0.018);
  });
}

/* ================================================================ WOOD */

type PlankOpts = { color?: string; planks?: number; dir?: "vertical" | "horizontal"; seed?: number; vary?: number; gap?: string; knots?: boolean };

/** draws vertical planks of length S (y) filling width S; caller rotates for horizontal */
function drawPlanks(g: Ctx, S: number, o: { color: string; planks: number; seed: number; vary: number; gap: string; knots: boolean; joints?: boolean; grainLines?: number }) {
  const pw = S / o.planks;
  for (let i = 0; i < o.planks; i++) {
    const r = cellRng(o.seed, i);
    const col = jit(o.color, r, o.vary, 0.5);
    const x0 = i * pw;
    g.save();
    g.beginPath(); g.rect(x0, 0, pw, S); g.clip();
    g.fillStyle = col; g.fillRect(x0, 0, pw, S);
    // soft long colour streaks
    for (let k = 0; k < 3; k++) {
      const sx = x0 + r() * pw, sw = pw * range(r, 0.15, 0.4);
      const lg = g.createLinearGradient(sx - sw, 0, sx + sw, 0);
      const c2 = r() < 0.5 ? shade(col, 0.1) : shade(col, -0.1);
      lg.addColorStop(0, rgba(c2, 0)); lg.addColorStop(0.5, rgba(c2, 0.55)); lg.addColorStop(1, rgba(c2, 0));
      g.fillStyle = lg; g.fillRect(sx - sw, 0, sw * 2, S);
    }
    // grain lines (periodic in y so the tile wraps)
    const n = o.grainLines ?? Math.round(pw / 7);
    g.lineCap = "round";
    for (let k = 0; k < n; k++) {
      const gx = x0 + r() * pw, f1 = 1 + Math.floor(r() * 2), f2 = 3 + Math.floor(r() * 3), a1 = range(r, 1, pw * 0.08), a2 = range(r, 0.3, 1.5), ph = r() * 7, ph2 = r() * 7;
      g.strokeStyle = rgba(shade(col, -0.35), range(r, 0.18, 0.4));
      g.lineWidth = range(r, 0.8, 2.2);
      g.beginPath();
      for (let y = 0; y <= S; y += 6) {
        const x = gx + a1 * Math.sin((y / S) * Math.PI * 2 * f1 + ph) + a2 * Math.sin((y / S) * Math.PI * 2 * f2 + ph2);
        if (y === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
    // knots
    if (o.knots && r() < 0.55) {
      const kx = x0 + pw * range(r, 0.3, 0.7), ky = r() * S, kr = pw * range(r, 0.1, 0.16);
      wrap(S, S, kx, ky, kr * 4, (X, Y) => {
        for (let q = 4; q >= 1; q--) {
          g.strokeStyle = rgba(shade(col, -0.4), 0.25 + 0.1 * (4 - q)); g.lineWidth = 1.4;
          g.beginPath(); g.ellipse(X, Y, kr * q * 0.55, kr * q * 1.3, 0, 0, 7); g.stroke();
        }
        g.fillStyle = rgba(shade(col, -0.5), 0.85); g.beginPath(); g.ellipse(X, Y, kr * 0.45, kr * 0.75, 0, 0, 7); g.fill();
        g.fillStyle = rgba(shade(col, -0.2), 0.8); g.beginPath(); g.ellipse(X - kr * 0.1, Y - kr * 0.15, kr * 0.2, kr * 0.35, 0, 0, 7); g.fill();
      });
    }
    // edge shading: lit left bevel, shadowed right side
    const lg = g.createLinearGradient(x0, 0, x0 + pw, 0);
    lg.addColorStop(0, rgba("#ffffff", 0.16)); lg.addColorStop(0.08, rgba("#ffffff", 0.04)); lg.addColorStop(0.75, rgba("#000000", 0)); lg.addColorStop(1, rgba("#000000", 0.2));
    g.fillStyle = lg; g.fillRect(x0, 0, pw, S);
    // end joint
    if (o.joints !== false) {
      const jy = r() * S;
      wrap(S, S, x0, jy, 10, (_, Y) => {
        g.fillStyle = rgba(o.gap, 0.9); g.fillRect(x0, Y - 1.5, pw, 3);
        g.fillStyle = rgba("#ffffff", 0.15); g.fillRect(x0, Y + 1.5, pw, 2);
        // nail heads
        g.fillStyle = rgba("#2a2420", 0.7);
        for (const nx of [0.25, 0.75]) { g.beginPath(); g.arc(x0 + pw * nx, Y + 7, 2.2, 0, 7); g.fill(); }
      });
    }
    g.restore();
    // gap
    g.fillStyle = o.gap; g.fillRect(x0 - 1.5, 0, 3, S);
  }
}

/**
 * Wood plank wall / boards with grain lines, knots, end joints and dark gaps (like the red ticket-booth wall).
 * Tile = 1 x 1 m, default 6 planks (~17 cm). dir "vertical" = planks run up the wall; "horizontal" = along it.
 */
export function woodPlanks(o: PlankOpts = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#a0522d", planks: o.planks ?? 6, dir: o.dir ?? "vertical", seed: o.seed ?? 6, vary: o.vary ?? 0.07, gap: o.gap ?? shade(o.color ?? "#a0522d", -0.6), knots: o.knots ?? true };
  return makeTex(keyOf("planks", p), 512, 512, (g, S) => {
    g.save();
    if (p.dir === "horizontal") { g.translate(S, 0); g.rotate(Math.PI / 2); }
    drawPlanks(g, S, p);
    g.restore();
    noiseLayer(g, S, S, { seed: p.seed, cells: 4, amp: 0.05 });
  });
}

/** one parquet / herringbone strip: grain along its length, bevel shading, 1px gap */
function woodStrip(g: Ctx, r: RNG, x: number, y: number, w: number, h: number, col: string, vert: boolean) {
  g.save(); g.beginPath(); g.rect(x + 1, y + 1, w - 2, h - 2); g.clip();
  g.fillStyle = col; g.fillRect(x, y, w, h);
  g.strokeStyle = rgba(shade(col, -0.3), 0.3); g.lineWidth = 1;
  for (let k = 0; k < 4; k++) {
    const o2 = r() * (vert ? w : h);
    g.beginPath();
    if (vert) { g.moveTo(x + o2, y); g.bezierCurveTo(x + o2 + 3, y + h / 3, x + o2 - 3, y + h * 2 / 3, x + o2, y + h); }
    else { g.moveTo(x, y + o2); g.bezierCurveTo(x + w / 3, y + o2 + 3, x + w * 2 / 3, y + o2 - 3, x + w, y + o2); }
    g.stroke();
  }
  const lg = vert ? g.createLinearGradient(x, 0, x + w, 0) : g.createLinearGradient(0, y, 0, y + h);
  lg.addColorStop(0, rgba("#ffffff", 0.15)); lg.addColorStop(1, rgba("#000000", 0.15));
  g.fillStyle = lg; g.fillRect(x, y, w, h);
  g.restore();
}

/**
 * Wooden floor. kind "boards" = long narrow boards with staggered joints; "parquet" = basket-weave blocks;
 * "herringbone" = zig-zag strips. Tile = 1 x 1 m.
 */
export function woodFloor(o: { color?: string; kind?: "boards" | "parquet" | "herringbone"; seed?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#b77a45", kind: o.kind ?? "boards", seed: o.seed ?? 7 };
  return makeTex(keyOf("woodFloor", p), 512, 512, (g, S) => {
    const gap = shade(p.color, -0.55);
    if (p.kind === "boards") {
      g.save(); g.translate(S, 0); g.rotate(Math.PI / 2);
      drawPlanks(g, S, { color: p.color, planks: 8, seed: p.seed, vary: 0.08, gap, knots: true });
      g.restore();
    } else if (p.kind === "parquet") {
      const B = S / 4, strips = 4, sw = B / strips;
      g.fillStyle = gap; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const vert = (i + j) % 2 === 0;
        for (let s = 0; s < strips; s++) {
          const r = cellRng(p.seed, i * 4 + j, s);
          const col = jit(p.color, r, 0.09, 0.5);
          const x = i * B + (vert ? s * sw : 0), y = j * B + (vert ? 0 : s * sw);
          const w = vert ? sw : B, h = vert ? B : sw;
          woodStrip(g, r, x, y, w, h, col, vert);
        }
      }
    } else {
      // axis-aligned herringbone: strips 3W x W in staircase chains; chains repeat every (-3W, 3W); period 12W = 1 m
      g.fillStyle = gap; g.fillRect(0, 0, S, S);
      const W = S / 12, L = W * 3, mod = (v: number) => ((Math.round(v) % 12) + 12) % 12;
      for (let c = -8; c <= 8; c++) for (let k = -30; k <= 30; k++) {
        const ox = k - 3 * c, oy = k + 3 * c; // chain origin in W units
        if (ox < -4 || ox > 13 || oy < -4 || oy > 13) continue;
        for (const vert of [false, true]) {
          const x = ox * W, y = (oy + (vert ? 1 : 0)) * W, w = vert ? W : L, h = vert ? L : W;
          const r = cellRng(p.seed, mod(ox) * 12 + mod(oy), vert ? 1 : 0);
          woodStrip(g, r, x, y, w, h, jit(p.color, r, 0.09, 0.5), vert);
        }
      }
    }
    noiseLayer(g, S, S, { seed: p.seed, cells: 4, amp: 0.05 });
  });
}

/** House clapboard siding: overlapping horizontal boards with a shadow line under each. Tile = 1 x 1 m, 8 boards. */
export function clapboardSiding(o: { color?: string; boards?: number; seed?: number; vary?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#6f9fc9", boards: o.boards ?? 8, seed: o.seed ?? 8, vary: o.vary ?? 0.035 };
  return makeTex(keyOf("clap", p), 512, 512, (g, S) => {
    const bh = S / p.boards;
    for (let i = 0; i < p.boards; i++) {
      const r = cellRng(p.seed, i);
      const col = jit(p.color, r, p.vary, 0.3);
      const y = i * bh;
      const lg = g.createLinearGradient(0, y, 0, y + bh);
      lg.addColorStop(0, shade(col, -0.12)); lg.addColorStop(0.25, col); lg.addColorStop(0.85, shade(col, 0.1)); lg.addColorStop(1, shade(col, 0.16));
      g.fillStyle = lg; g.fillRect(0, y, S, bh);
      g.save(); g.beginPath(); g.rect(0, y, S, bh); g.clip();
      // faint grain + paint strokes along the board
      for (let k = 0; k < 7; k++) {
        const gy = y + bh * range(r, 0.25, 0.92);
        g.strokeStyle = rgba(shade(col, r() < 0.5 ? -0.25 : 0.2), 0.18); g.lineWidth = range(r, 0.8, 1.8);
        g.beginPath(); g.moveTo(0, gy);
        const ph = r() * 7, a = range(r, 0.5, 1.5);
        for (let x = 0; x <= S; x += 16) g.lineTo(x, gy + a * Math.sin((x / S) * Math.PI * 4 + ph));
        g.stroke();
      }
      // shadow cast by the board above
      const sh = g.createLinearGradient(0, y, 0, y + bh * 0.28);
      sh.addColorStop(0, rgba("#000000", 0.42)); sh.addColorStop(1, rgba("#000000", 0));
      g.fillStyle = sh; g.fillRect(0, y, S, bh * 0.28);
      // butt joint
      const jx = r() * S;
      wrap(S, S, jx, y, 8, (X) => { g.fillStyle = rgba(shade(col, -0.45), 0.7); g.fillRect(X - 1, y, 2.5, bh); g.fillStyle = rgba("#ffffff", 0.18); g.fillRect(X + 1.5, y, 2, bh); });
      g.restore();
      // the dark drip edge line
      g.fillStyle = rgba(shade(col, -0.6), 0.9); g.fillRect(0, y + bh - 2, S, 2);
      g.fillStyle = rgba("#ffffff", 0.25); g.fillRect(0, y + bh - 5, S, 2);
    }
    noiseLayer(g, S, S, { seed: p.seed, cells: 3, amp: 0.04 });
  });
}

/* ================================================================ ROOFS */

/** Roof shingles in staggered rows (top of the texture = up the roof). style "square" | "round" (fish-scale) | "slate". Tile = 1 x 1 m, 8 rows. */
export function roofShingles(o: { color?: string; style?: "square" | "round" | "slate"; rows?: number; seed?: number; vary?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#5a5f7a", style: o.style ?? "square", rows: o.rows ?? 8, seed: o.seed ?? 9, vary: o.vary ?? 0.09 };
  return makeTex(keyOf("shingles", p), 512, 512, (g, S) => {
    const rh = S / p.rows, cols = p.style === "round" ? 7 : 6;
    const dark = shade(p.color, -0.6);
    g.fillStyle = dark; g.fillRect(0, 0, S, S);
    // draw from the bottom row upward so each upper row overlaps the one below
    for (let row = p.rows; row >= -1; row--) {
      const rowI = ((row % p.rows) + p.rows) % p.rows;
      const rr = cellRng(p.seed, rowI, 99);
      // row widths (sum to S)
      const ws: number[] = []; let t = 0;
      if (p.style === "round") { for (let i = 0; i < cols; i++) ws.push(S / cols); t = S; }
      else { while (t < S) { const w = (S / cols) * range(rr, 0.7, 1.35); ws.push(w); t += w; } const k = S / t; for (let i = 0; i < ws.length; i++) ws[i] *= k; }
      const off = p.style === "round" ? (rowI % 2) * (S / cols / 2) : rr() * S;
      let x = off - S;
      const y = row * rh;
      for (let rep = 0; rep < 3; rep++) ws.forEach((w, i) => {
        const r = cellRng(p.seed, rowI, i);
        const col = jit(p.color, r, p.vary, 0.4);
        const sx = x + 1.5, sw = w - 3, sy = y - rh * 0.25, sh = rh * 1.25;
        x += w;
        if (sx > S + 4 || sx + sw < -4) return;
        g.save();
        g.beginPath();
        if (p.style === "round") {
          g.moveTo(sx, sy); g.lineTo(sx + sw, sy); g.lineTo(sx + sw, sy + sh - sw / 2);
          g.arc(sx + sw / 2, sy + sh - sw / 2, sw / 2, 0, Math.PI);
          g.closePath();
        } else rrect(g, sx, sy, sw, sh, p.style === "slate" ? 2 : 4);
        // drop shadow on the row below
        g.save(); g.translate(0, 4); g.fillStyle = rgba("#000000", 0.35); g.fill(); g.restore();
        const lg = g.createLinearGradient(0, sy, 0, sy + sh);
        lg.addColorStop(0, shade(col, -0.15)); lg.addColorStop(0.6, col); lg.addColorStop(1, shade(col, 0.12));
        g.fillStyle = lg; g.fill();
        g.clip();
        brushDabs(g, r, sx, sy, sw, sh, col, 4, 0.35, 0.35, Math.PI / 2);
        g.fillStyle = rgba("#ffffff", 0.22); g.fillRect(sx, sy + sh - 3, sw, 3);
        if (p.style !== "round") { g.fillStyle = rgba("#ffffff", 0.12); g.fillRect(sx, sy, 2, sh); g.fillStyle = rgba("#000000", 0.15); g.fillRect(sx + sw - 2, sy, 2, sh); }
        g.restore();
      });
    }
    noiseLayer(g, S, S, { seed: p.seed, cells: 4, amp: 0.05 });
  });
}

/** Terracotta barrel (Spanish / Mediterranean / Indian) roof tiles. Tile = 1 x 1 m, 5 columns x 4 rows. */
export function roofTiles(o: { color?: string; cols?: number; rows?: number; seed?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#c8603a", cols: o.cols ?? 5, rows: o.rows ?? 4, seed: o.seed ?? 10 };
  return makeTex(keyOf("roofTiles", p), 512, 512, (g, S) => {
    const cw = S / p.cols, rh = S / p.rows;
    g.fillStyle = shade(p.color, -0.65); g.fillRect(0, 0, S, S);
    for (let row = p.rows; row >= -1; row--) {
      const rowI = ((row % p.rows) + p.rows) % p.rows;
      for (let c = 0; c < p.cols; c++) {
        const r = cellRng(p.seed, rowI, c);
        const col = jit(p.color, r, 0.1, 0.6);
        const x = c * cw + 2, w = cw - 4, y = row * rh - rh * 0.2, h = rh * 1.2;
        g.save();
        g.beginPath();
        g.moveTo(x + w * 0.08, y); g.lineTo(x + w * 0.92, y);
        g.lineTo(x + w, y + h - w * 0.3);
        g.quadraticCurveTo(x + w / 2, y + h + w * 0.15, x, y + h - w * 0.3);
        g.closePath();
        g.save(); g.translate(0, 6); g.fillStyle = rgba("#000000", 0.4); g.fill(); g.restore();
        const lg = g.createLinearGradient(x, 0, x + w, 0);
        lg.addColorStop(0, shade(col, -0.35)); lg.addColorStop(0.3, shade(col, 0.08)); lg.addColorStop(0.45, shade(col, 0.22)); lg.addColorStop(0.7, col); lg.addColorStop(1, shade(col, -0.4));
        g.fillStyle = lg; g.fill();
        g.clip();
        brushDabs(g, r, x, y, w, h, col, 5, 0.3, 0.4, Math.PI / 2);
        // top darkening under the row above
        const sh = g.createLinearGradient(0, y, 0, y + h * 0.35); sh.addColorStop(0, rgba("#000000", 0.35)); sh.addColorStop(1, rgba("#000000", 0));
        g.fillStyle = sh; g.fillRect(x, y, w, h * 0.35);
        // lichen / weathering speckles
        for (let k = 0; k < 6; k++) { g.fillStyle = rgba(r() < 0.5 ? "#6b5a3a" : "#ffffff", 0.12); g.beginPath(); g.arc(x + r() * w, y + r() * h, 1 + r() * 3, 0, 7); g.fill(); }
        g.restore();
      }
    }
    noiseLayer(g, S, S, { seed: p.seed, cells: 4, amp: 0.05 });
  });
}

/** Straw thatch in layered rows with shadowed lower edges. Tile = 1 x 1 m, 5 layers. */
export function thatch(o: { color?: string; rows?: number; seed?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#c9a253", rows: o.rows ?? 5, seed: o.seed ?? 11 };
  return makeTex(keyOf("thatch", p), 512, 512, (g, S) => {
    const rh = S / p.rows;
    g.fillStyle = shade(p.color, -0.45); g.fillRect(0, 0, S, S);
    const pal = [shade(p.color, -0.25), shade(p.color, -0.12), p.color, shade(p.color, 0.12), shade(p.color, 0.25), mix(p.color, "#8a7a4a", 0.4)];
    g.lineCap = "round";
    for (let row = p.rows; row >= -1; row--) {
      const r = cellRng(p.seed, ((row % p.rows) + p.rows) % p.rows);
      const y0 = row * rh - rh * 0.15, y1 = row * rh + rh * 1.05;
      // body of the layer
      const lg = g.createLinearGradient(0, y0, 0, y1);
      lg.addColorStop(0, shade(p.color, -0.35)); lg.addColorStop(0.5, shade(p.color, -0.05)); lg.addColorStop(1, shade(p.color, 0.08));
      g.fillStyle = lg; g.fillRect(0, y0, S, y1 - y0);
      for (let k = 0; k < 520; k++) {
        const x = r() * S, lean = (r() - 0.5) * 10, yb = y1 - r() * rh * 0.12, yt = y0 + r() * rh * 0.4;
        g.strokeStyle = rgba(pick(r, pal), range(r, 0.5, 0.95)); g.lineWidth = range(r, 1, 2.6);
        for (const X of [x, x - S, x + S]) {
          if (X < -20 || X > S + 20) continue;
          g.beginPath(); g.moveTo(X, yt); g.quadraticCurveTo(X + lean * 0.3, (yt + yb) / 2, X + lean, yb); g.stroke();
        }
      }
      // shadow cast onto the lower layer + ragged bottom edge highlight
      const sh = g.createLinearGradient(0, y1, 0, y1 + rh * 0.25); sh.addColorStop(0, rgba("#000000", 0.45)); sh.addColorStop(1, rgba("#000000", 0));
      g.fillStyle = sh; g.fillRect(0, y1, S, rh * 0.25);
    }
    noiseLayer(g, S, S, { seed: p.seed, cells: 4, amp: 0.05 });
  });
}

/* ================================================================ PLASTER & WALLPAPER */

/** Painted plaster wall with soft stains and hairline cracks; `exposedBricks` reveals a patch of brick. Tile = 2 x 2 m. */
export function plaster(o: { color?: string; stains?: number; cracks?: number; exposedBricks?: boolean; seed?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#e8d9b8", stains: o.stains ?? 0.6, cracks: o.cracks ?? 3, exposedBricks: o.exposedBricks ?? false, seed: o.seed ?? 12 };
  return makeTex(keyOf("plaster", p), 512, 512, (g, S) => {
    const r = seededRng(p.seed);
    g.fillStyle = p.color; g.fillRect(0, 0, S, S);
    noiseLayer(g, S, S, { seed: p.seed, cells: 3, oct: 4, amp: 0.07 });
    // trowel strokes
    for (let k = 0; k < 40; k++) {
      const x = r() * S, y = r() * S, w = range(r, 40, 110), h = range(r, 14, 30);
      wrap(S, S, x, y, w, (X, Y) => { g.fillStyle = rgba(r() < 0.5 ? shade(p.color, 0.1) : shade(p.color, -0.05), 0.12); g.beginPath(); g.ellipse(X, Y, w / 2, h / 2, range(r, -0.4, 0.4), 0, 7); g.fill(); });
    }
    // stains: soft watery blotches (noise-masked tint) + damp darkening near the bottom of each tile is left to the caller
    if (p.stains > 0) {
      noiseLayer(g, S, S, { seed: p.seed + 11, cells: 3, oct: 4, amp: 0.45 * p.stains, tint: shade(p.color, -0.3) });
      noiseLayer(g, S, S, { seed: p.seed + 17, cells: 5, oct: 3, amp: 0.25 * p.stains, tint: mix(p.color, "#7a8a6a", 0.5) });
    }
    if (p.exposedBricks) {
      const cx = S * 0.62, cy = S * 0.62;
      g.save();
      g.beginPath();
      for (let a = 0; a < 24; a++) { const t = (a / 24) * Math.PI * 2, rr = S * 0.12 * (0.75 + r() * 0.4); const X = cx + Math.cos(t) * rr * 1.4, Y = cy + Math.sin(t) * rr; if (a) g.lineTo(X, Y); else g.moveTo(X, Y); }
      g.closePath();
      g.strokeStyle = rgba("#ffffff", 0.6); g.lineWidth = 6; g.stroke();
      g.fillStyle = "#c9b9a0"; g.fill(); g.clip();
      const bw = 52, bh = 21;
      for (let row = -6; row < 8; row++) for (let c = -5; c < 6; c++) {
        const br = cellRng(p.seed, row + 20, c + 20);
        bevelBlock(g, br, cx + c * bw + (row % 2 ? bw / 2 : 0), cy + row * bh, bw - 4, bh - 4, jit("#b0583e", br, 0.12), { rad: 2, bevel: 3, dabs: 2 });
      }
      const ig = g.createRadialGradient(cx, cy, S * 0.05, cx, cy, S * 0.2); ig.addColorStop(0, rgba("#000000", 0)); ig.addColorStop(1, rgba("#000000", 0.35));
      g.fillStyle = ig; g.fillRect(0, 0, S, S);
      g.restore();
    }
    // hairline cracks
    for (let k = 0; k < p.cracks; k++) {
      let x = r() * S, y = r() * S;
      const pts: [number, number][] = [[x, y]];
      let ang = r() * Math.PI * 2;
      for (let s = 0; s < 14; s++) { ang += (r() - 0.5) * 1.2; x += Math.cos(ang) * 9; y += Math.sin(ang) * 9; pts.push([x, y]); }
      wrap(S, S, pts[0][0], pts[0][1], 140, (X, Y) => {
        const dx = X - pts[0][0], dy = Y - pts[0][1];
        g.strokeStyle = rgba("#3a3020", 0.4); g.lineWidth = 1.3; g.beginPath();
        pts.forEach(([a, b], i) => (i ? g.lineTo(a + dx, b + dy) : g.moveTo(a + dx, b + dy)));
        g.stroke();
        g.strokeStyle = rgba("#ffffff", 0.25); g.lineWidth = 1; g.beginPath();
        pts.forEach(([a, b], i) => (i ? g.lineTo(a + dx + 1.2, b + dy + 1.2) : g.moveTo(a + dx + 1.2, b + dy + 1.2)));
        g.stroke();
      });
    }
    grain(g, S, S, p.seed, 0.02);
  });
}

/* --- ornamental shapes */

/** fleur-de-lis path in a unit box (x -1..1, y -1..1, y down) */
function fleurPath(g: Ctx) {
  g.beginPath();
  // centre petal
  g.moveTo(0, -1);
  g.bezierCurveTo(0.34, -0.66, 0.3, -0.12, 0.1, 0.16);
  g.lineTo(-0.1, 0.16);
  g.bezierCurveTo(-0.3, -0.12, -0.34, -0.66, 0, -1);
  g.closePath();
  for (const s of [1, -1]) {
    // side petal curling outward and down
    g.moveTo(0.12 * s, 0.16);
    g.bezierCurveTo(0.2 * s, -0.25, 0.62 * s, -0.55, 0.88 * s, -0.25);
    g.bezierCurveTo(1.02 * s, -0.08, 0.92 * s, 0.14, 0.72 * s, 0.12);
    g.bezierCurveTo(0.8 * s, 0.0, 0.76 * s, -0.16, 0.6 * s, -0.12);
    g.bezierCurveTo(0.42 * s, -0.06, 0.36 * s, 0.08, 0.36 * s, 0.16);
    g.closePath();
    // lower curl
    g.moveTo(0.1 * s, 0.32);
    g.bezierCurveTo(0.2 * s, 0.5, 0.42 * s, 0.62, 0.52 * s, 0.5);
    g.bezierCurveTo(0.6 * s, 0.4, 0.46 * s, 0.32, 0.38 * s, 0.32);
    g.closePath();
  }
  // band
  g.moveTo(-0.44, 0.15); g.lineTo(0.44, 0.15); g.lineTo(0.44, 0.33); g.lineTo(-0.44, 0.33); g.closePath();
  // bottom tip
  g.moveTo(-0.1, 0.33); g.quadraticCurveTo(0, 0.6, 0, 0.78); g.quadraticCurveTo(0, 0.6, 0.1, 0.33); g.closePath();
}

function drawFleur(g: Ctx, x: number, y: number, s: number, fill: string, outline?: string) {
  g.save(); g.translate(x, y); g.scale(s, s);
  fleurPath(g);
  if (outline) { g.lineJoin = "round"; g.strokeStyle = outline; g.lineWidth = 0.12; g.stroke(); }
  g.fillStyle = fill; g.fill();
  // highlight
  g.save(); g.clip(); g.translate(-0.05, -0.06); g.fillStyle = rgba("#ffffff", 0.0); g.restore();
  g.restore();
}

/** damask motif (symmetric ogee flourish) in a unit box (x -1..1, y -1..1) */
function damaskMotif(g: Ctx, x: number, y: number, s: number, fill: string, bg: string) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = fill; g.strokeStyle = fill; g.lineCap = "round"; g.lineJoin = "round";
  // central teardrop
  g.beginPath(); g.moveTo(0, -0.95); g.bezierCurveTo(0.3, -0.5, 0.3, -0.1, 0, 0.25); g.bezierCurveTo(-0.3, -0.1, -0.3, -0.5, 0, -0.95); g.fill();
  // inner cut-out
  g.fillStyle = bg;
  g.beginPath(); g.moveTo(0, -0.62); g.bezierCurveTo(0.12, -0.4, 0.12, -0.2, 0, -0.02); g.bezierCurveTo(-0.12, -0.2, -0.12, -0.4, 0, -0.62); g.fill();
  g.fillStyle = fill;
  g.beginPath(); g.moveTo(0, -0.5); g.bezierCurveTo(0.06, -0.35, 0.06, -0.2, 0, -0.12); g.bezierCurveTo(-0.06, -0.2, -0.06, -0.35, 0, -0.5); g.fill();
  for (const sx of [1, -1]) {
    g.save(); g.scale(sx, 1);
    // big scroll leaf
    g.beginPath(); g.moveTo(0.08, 0.2); g.bezierCurveTo(0.5, 0.1, 0.75, -0.25, 0.55, -0.55); g.bezierCurveTo(0.45, -0.7, 0.25, -0.62, 0.3, -0.45);
    g.bezierCurveTo(0.42, -0.42, 0.45, -0.2, 0.3, -0.05); g.bezierCurveTo(0.22, 0.05, 0.12, 0.08, 0.08, 0.2); g.fill();
    // lower leaf
    g.beginPath(); g.moveTo(0.05, 0.3); g.bezierCurveTo(0.35, 0.3, 0.65, 0.5, 0.7, 0.85); g.bezierCurveTo(0.45, 0.75, 0.2, 0.6, 0.05, 0.3); g.fill();
    // little curl + dots
    g.lineWidth = 0.06; g.beginPath(); g.arc(0.72, -0.15, 0.13, Math.PI * 0.8, Math.PI * 2.3); g.stroke();
    g.beginPath(); g.arc(0.85, 0.3, 0.06, 0, 7); g.fill();
    g.beginPath(); g.arc(0.35, 0.95, 0.05, 0, 7); g.fill();
    g.restore();
  }
  // stem + base bud
  g.beginPath(); g.moveTo(-0.05, 0.2); g.lineTo(0.05, 0.2); g.lineTo(0.03, 0.85); g.lineTo(-0.03, 0.85); g.fill();
  g.beginPath(); g.ellipse(0, 0.9, 0.1, 0.07, 0, 0, 7); g.fill();
  // crown trefoil
  for (const [a, b, rr] of [[0, -1.08, 0.07], [0.12, -1.0, 0.05], [-0.12, -1.0, 0.05]] as const) { g.beginPath(); g.arc(a, b, rr, 0, 7); g.fill(); }
  g.restore();
}

function smallFlower(g: Ctx, x: number, y: number, s: number, petal: string, centre: string, leaf: string, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = leaf;
  for (const a of [0.6, 2.6]) { g.save(); g.rotate(a); g.beginPath(); g.ellipse(1.25, 0, 0.75, 0.3, 0, 0, 7); g.fill(); g.restore(); }
  g.fillStyle = petal;
  for (let k = 0; k < 5; k++) { g.save(); g.rotate((k / 5) * Math.PI * 2); g.beginPath(); g.ellipse(0.5, 0, 0.5, 0.32, 0, 0, 7); g.fill(); g.restore(); }
  g.fillStyle = centre; g.beginPath(); g.arc(0, 0, 0.26, 0, 7); g.fill();
  g.restore();
}

/** Wallpaper with a repeating pattern. pattern "stripes" | "damask" | "floral". Tile = 1 x 1 m (2 motif columns). */
export function wallpaper(pattern: "stripes" | "damask" | "floral" = "damask", o: { base?: string; ink?: string; accent?: string; seed?: number } = {}): THREE.CanvasTexture {
  const defs = { stripes: ["#e9dcc0", "#b9553f", "#3d6b5c"], damask: ["#3f6e66", "#5e9488", "#d8c27a"], floral: ["#f1e6cf", "#c45a6a", "#6f9a63"] }[pattern];
  const p = { pattern, base: o.base ?? defs[0], ink: o.ink ?? defs[1], accent: o.accent ?? defs[2], seed: o.seed ?? 13 };
  return makeTex(keyOf("wallpaper", p), 1024, 1024, (g, S) => {
    g.fillStyle = p.base; g.fillRect(0, 0, S, S);
    if (p.pattern === "stripes") {
      const n = 8, w = S / n;
      for (let i = 0; i < n; i++) {
        const x = i * w;
        g.fillStyle = p.ink; g.fillRect(x + w * 0.3, 0, w * 0.4, S);
        g.fillStyle = p.accent; g.fillRect(x + w * 0.08, 0, w * 0.04, S); g.fillRect(x + w * 0.88, 0, w * 0.04, S);
        g.fillStyle = rgba(shade(p.ink, 0.2), 0.6); g.fillRect(x + w * 0.48, 0, w * 0.04, S);
        // tiny dots in the pale band
        g.fillStyle = rgba(p.ink, 0.5);
        for (let y = 0; y < S; y += S / 16) { g.beginPath(); g.arc(x + w * 0.2, y + S / 32, 3, 0, 7); g.fill(); g.beginPath(); g.arc(x + w * 0.8, y, 3, 0, 7); g.fill(); }
      }
    } else if (p.pattern === "damask") {
      const cols = 2, rows = 2, cw = S / cols, ch = S / rows;
      for (let i = -1; i <= cols; i++) for (let j = -1; j <= rows; j++) {
        damaskMotif(g, (i + 0.5) * cw, (j + 0.5) * ch, ch * 0.42, p.ink, p.base);
        // half-drop small motif between
        g.save(); g.translate(i * cw, j * ch); g.fillStyle = p.ink;
        for (let k = 0; k < 4; k++) { g.save(); g.rotate((k / 4) * Math.PI * 2 + Math.PI / 4); g.beginPath(); g.ellipse(0, -ch * 0.07, ch * 0.025, ch * 0.065, 0, 0, 7); g.fill(); g.restore(); }
        g.fillStyle = p.accent; g.beginPath(); g.arc(0, 0, ch * 0.025, 0, 7); g.fill();
        g.restore();
      }
      // thin accent pinstripes
      g.fillStyle = rgba(p.accent, 0.25);
      for (let i = 0; i < cols * 2; i++) g.fillRect(i * cw / 2 + cw / 4 - 1, 0, 2, S);
    } else {
      const r = seededRng(p.seed);
      const n = 4, cw = S / n;
      // vines
      g.strokeStyle = rgba(p.accent, 0.6); g.lineWidth = 3;
      for (let i = 0; i < n; i++) {
        g.beginPath();
        for (let y = 0; y <= S; y += 8) { const x = (i + 0.5) * cw + Math.sin((y / S) * Math.PI * 4) * cw * 0.2; if (y) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke();
      }
      for (let i = 0; i < n; i++) for (let j = 0; j < 8; j++) {
        const y = (j + 0.5) * (S / 8), x = (i + 0.5) * cw + Math.sin((y / S) * Math.PI * 4) * cw * 0.2;
        const big = j % 2 === 0;
        smallFlower(g, x, y, big ? 26 : 15, big ? p.ink : shade(p.ink, 0.35), "#f3d36b", p.accent, r() * 6);
      }
    }
    noiseLayer(g, S, S, { seed: p.seed, cells: 4, amp: 0.05 });
    grain(g, S, S, p.seed, 0.015);
  });
}

/** Red damask fabric with gold fleur-de-lis (throne canopy, royal banners). Tile = 0.5 x 0.5 m, 4 x 4 motifs (half-drop). */
export function fleurFabric(o: { base?: string; gold?: string; seed?: number } = {}): THREE.CanvasTexture {
  const p = { base: o.base ?? "#a8202a", gold: o.gold ?? "#e8b84a", seed: o.seed ?? 14 };
  return makeTex(keyOf("fleur", p), 1024, 1024, (g, S) => {
    g.fillStyle = p.base; g.fillRect(0, 0, S, S);
    // tone-on-tone diamond lattice woven into the cloth
    g.strokeStyle = rgba(shade(p.base, -0.25), 0.55); g.lineWidth = 3;
    const n = 4, c = S / n;
    for (let i = -n; i <= n * 2; i++) {
      g.beginPath(); g.moveTo(i * c, 0); g.lineTo(i * c + S, S); g.stroke();
      g.beginPath(); g.moveTo(i * c, 0); g.lineTo(i * c - S, S); g.stroke();
    }
    for (let i = -1; i <= n; i++) for (let j = -1; j <= n; j++) {
      // big fleur at cell centres
      drawFleur(g, (i + 0.5) * c, (j + 0.5) * c, c * 0.24, rgba(shade(p.base, -0.45), 0.6));
      drawFleur(g, (i + 0.5) * c - 2, (j + 0.5) * c - 3, c * 0.24, p.gold, shade(p.gold, -0.45));
      // small gold quatrefoil at lattice crossings
      g.fillStyle = p.gold;
      for (let k = 0; k < 4; k++) { g.save(); g.translate(i * c, j * c); g.rotate((k * Math.PI) / 2); g.beginPath(); g.ellipse(0, -c * 0.045, c * 0.02, c * 0.04, 0, 0, 7); g.fill(); g.restore(); }
    }
    // gold sheen: lighter upper-left of each motif
    noiseLayer(g, S, S, { seed: p.seed, cells: 3, amp: 0.06 });
    grain(g, S, S, p.seed, 0.03);
  });
}
/** alias: damask / fleur fabric */
export const damaskFabric = fleurFabric;

/** Tufted velvet with buttons in a diamond pattern (throne back, sofa, padded doors). Tile = 0.5 x 0.5 m (4 x 3 diamonds). */
export function velvetTufted(o: { color?: string; button?: string; seed?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#b8242e", button: o.button ?? "#e6b94a", seed: o.seed ?? 15 };
  return makeTex(keyOf("velvet", p), 1024, 1024, (g, S) => {
    const nx = 4, ny = 3, a = S / nx, b = S / ny;
    g.fillStyle = shade(p.color, -0.5); g.fillRect(0, 0, S, S);
    const pillow = (cx: number, cy: number) => {
      g.save();
      g.beginPath(); g.moveTo(cx - a / 2, cy); g.quadraticCurveTo(cx - a * 0.22, cy - b * 0.24, cx, cy - b / 2); g.quadraticCurveTo(cx + a * 0.22, cy - b * 0.24, cx + a / 2, cy);
      g.quadraticCurveTo(cx + a * 0.22, cy + b * 0.24, cx, cy + b / 2); g.quadraticCurveTo(cx - a * 0.22, cy + b * 0.24, cx - a / 2, cy); g.closePath();
      const rg = g.createRadialGradient(cx - a * 0.08, cy - b * 0.1, 2, cx, cy, Math.max(a, b) * 0.55);
      rg.addColorStop(0, shade(p.color, 0.28)); rg.addColorStop(0.45, p.color); rg.addColorStop(0.85, shade(p.color, -0.3)); rg.addColorStop(1, shade(p.color, -0.5));
      g.fillStyle = rg; g.fill();
      g.restore();
    };
    for (let i = -1; i <= nx; i++) for (let j = -1; j <= ny; j++) { pillow(i * a + a / 2, j * b); pillow(i * a, j * b + b / 2); }
    // crease lines from button to button
    g.lineCap = "round";
    for (let i = -1; i <= nx + 1; i++) for (let j = -1; j <= ny + 1; j++) {
      const bx = i * a, by = j * b;
      for (const [x2, y2] of [[bx + a / 2, by + b / 2], [bx - a / 2, by + b / 2]]) {
        g.strokeStyle = rgba(shade(p.color, -0.65), 0.7); g.lineWidth = 4; g.beginPath(); g.moveTo(bx, by); g.lineTo(x2, y2); g.stroke();
      }
    }
    // little radial pinch folds + buttons
    const btn = (x: number, y: number) => {
      g.strokeStyle = rgba(shade(p.color, -0.55), 0.6); g.lineWidth = 2;
      for (let k = 0; k < 6; k++) { const t = (k / 6) * Math.PI * 2 + 0.3; g.beginPath(); g.moveTo(x + Math.cos(t) * 8, y + Math.sin(t) * 8); g.lineTo(x + Math.cos(t) * 20, y + Math.sin(t) * 20); g.stroke(); }
      g.fillStyle = rgba("#000000", 0.45); g.beginPath(); g.arc(x + 2, y + 4, 15, 0, 7); g.fill();
      const rg = g.createRadialGradient(x - 4, y - 5, 1, x, y, 14);
      rg.addColorStop(0, shade(p.button, 0.6)); rg.addColorStop(0.5, p.button); rg.addColorStop(1, shade(p.button, -0.45));
      g.fillStyle = rg; g.beginPath(); g.arc(x, y, 13, 0, 7); g.fill();
    };
    for (let i = -1; i <= nx + 1; i++) for (let j = -1; j <= ny + 1; j++) { btn(i * a, j * b); btn(i * a + a / 2, j * b + b / 2); }
    grain(g, S, S, p.seed, 0.035);
  });
}

/* ================================================================ RUGS */

type RugOpts = { field?: string; border?: string; accent?: string; gold?: string; cream?: string; seed?: number; fringe?: boolean };

function rosette(g: Ctx, x: number, y: number, r: number, petals: number, cols: string[]) {
  cols.forEach((c, i) => {
    const rr = r * (1 - i / cols.length);
    g.fillStyle = c; g.beginPath();
    for (let k = 0; k <= petals * 2; k++) {
      const t = (k / (petals * 2)) * Math.PI * 2, R = k % 2 ? rr * 0.62 : rr;
      const X = x + Math.cos(t) * R, Y = y + Math.sin(t) * R;
      if (k) g.lineTo(X, Y); else g.moveTo(X, Y);
    }
    g.closePath(); g.fill();
  });
}

function drawRug(g: Ctx, W: number, H: number, p: Required<RugOpts> & { persian: boolean }) {
  const r = seededRng(p.seed);
  const fr = p.fringe ? Math.round(H * 0.035) : 0;
  g.clearRect(0, 0, W, H);
  if (p.fringe) {
    g.strokeStyle = p.cream; g.lineWidth = 2;
    for (let x = 6; x < W - 4; x += 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 3, fr + 2); g.stroke(); g.beginPath(); g.moveTo(x, H); g.lineTo(x + (r() - 0.5) * 3, H - fr - 2); g.stroke(); }
  }
  const x0 = 0, y0 = fr, w = W, h = H - fr * 2;
  // bands
  const bands: [number, string][] = [[0, shade(p.border, -0.35)], [0.012, p.gold], [0.022, p.border], [0.11, p.gold], [0.12, shade(p.field, -0.25)], [0.13, p.field]];
  bands.forEach(([t, c]) => { const m = t * W; g.fillStyle = c; g.fillRect(x0 + m, y0 + m, w - 2 * m, h - 2 * m); });
  // border motifs: rosettes + diamonds along the border band
  const bm = 0.066 * W, step = W * 0.09;
  const along = (len: number, fn: (t: number) => [number, number]) => {
    const n = Math.max(2, Math.round(len / step));
    for (let k = 0; k <= n; k++) { const [X, Y] = fn(k / n); rosette(g, X, Y, W * 0.03, 8, [p.accent, p.gold, p.cream]); }
    for (let k = 0; k < n; k++) {
      const [X, Y] = fn((k + 0.5) / n);
      g.fillStyle = p.cream; g.beginPath(); g.moveTo(X, Y - W * 0.022); g.lineTo(X + W * 0.022, Y); g.lineTo(X, Y + W * 0.022); g.lineTo(X - W * 0.022, Y); g.fill();
      g.fillStyle = p.accent; g.beginPath(); g.arc(X, Y, W * 0.008, 0, 7); g.fill();
    }
  };
  along(w - 2 * bm, (t) => [x0 + bm + t * (w - 2 * bm), y0 + bm]);
  along(w - 2 * bm, (t) => [x0 + bm + t * (w - 2 * bm), y0 + h - bm]);
  along(h - 2 * bm, (t) => [x0 + bm, y0 + bm + t * (h - 2 * bm)]);
  along(h - 2 * bm, (t) => [x0 + w - bm, y0 + bm + t * (h - 2 * bm)]);
  // field pattern: scattered small motifs on a lattice
  const fx0 = x0 + 0.13 * W, fy0 = y0 + 0.13 * W, fw = w - 0.26 * W, fh = h - 0.26 * W;
  g.save(); g.beginPath(); g.rect(fx0, fy0, fw, fh); g.clip();
  const ls = W * (p.persian ? 0.07 : 0.1);
  for (let i = 0; i * ls <= fw + ls; i++) for (let j = 0; j * ls <= fh + ls; j++) {
    const X = fx0 + i * ls + (j % 2 ? ls / 2 : 0), Y = fy0 + j * ls;
    if (p.persian) {
      // diamond lattice of gold vines with rosettes at the nodes
      g.strokeStyle = rgba(p.gold, 0.55); g.lineWidth = 2;
      g.beginPath(); g.moveTo(X, Y); g.lineTo(X + ls / 2, Y + ls); g.moveTo(X, Y); g.lineTo(X - ls / 2, Y + ls); g.stroke();
      for (let k = 0; k < 4; k++) { g.save(); g.translate(X, Y); g.rotate((k * Math.PI) / 2); g.fillStyle = rgba(p.gold, 0.9); g.beginPath(); g.ellipse(0, -ls * 0.15, ls * 0.055, ls * 0.13, 0, 0, 7); g.fill(); g.restore(); }
      g.fillStyle = p.cream; g.beginPath(); g.arc(X, Y, ls * 0.065, 0, 7); g.fill();
      g.fillStyle = p.accent; g.beginPath(); g.arc(X, Y, ls * 0.03, 0, 7); g.fill();
      g.fillStyle = rgba(p.cream, 0.75); g.beginPath(); g.arc(X + ls / 4, Y + ls / 2, ls * 0.03, 0, 7); g.fill(); g.beginPath(); g.arc(X - ls / 4, Y + ls / 2, ls * 0.03, 0, 7); g.fill();
    } else {
      g.fillStyle = rgba(shade(p.field, 0.18), 0.9);
      g.beginPath(); g.moveTo(X, Y - ls * 0.18); g.lineTo(X + ls * 0.12, Y); g.lineTo(X, Y + ls * 0.18); g.lineTo(X - ls * 0.12, Y); g.fill();
    }
  }
  g.restore();
  // corner quarter-medallions
  const cr = W * 0.16;
  for (const [cx, cy] of [[fx0, fy0], [fx0 + fw, fy0], [fx0, fy0 + fh], [fx0 + fw, fy0 + fh]]) {
    g.save(); g.beginPath(); g.rect(fx0, fy0, fw, fh); g.clip();
    g.fillStyle = p.border; g.beginPath(); g.arc(cx, cy, cr, 0, 7); g.fill();
    g.strokeStyle = p.gold; g.lineWidth = W * 0.008; g.beginPath(); g.arc(cx, cy, cr * 0.92, 0, 7); g.stroke();
    rosette(g, cx, cy, cr * 0.6, 12, [p.accent, p.cream, p.gold]);
    g.restore();
  }
  // central medallion: lobed outer shape, rings, star
  const mx = x0 + w / 2, my = y0 + h / 2, mr = Math.min(fw, fh) * 0.36;
  const lobed = (R: number, lobes: number, depth: number, col: string, stretch = 1.25) => {
    g.fillStyle = col; g.beginPath();
    for (let k = 0; k <= 180; k++) { const t = (k / 180) * Math.PI * 2, rr = R * (1 + depth * Math.cos(lobes * t)); const X = mx + Math.cos(t) * rr, Y = my + Math.sin(t) * rr * stretch; if (k) g.lineTo(X, Y); else g.moveTo(X, Y); }
    g.closePath(); g.fill();
  };
  lobed(mr * 1.08, 12, 0.08, p.gold);
  lobed(mr, 12, 0.08, p.border);
  lobed(mr * 0.8, 8, 0.1, p.cream);
  lobed(mr * 0.72, 8, 0.1, p.accent);
  rosette(g, mx, my, mr * 0.5, 8, [p.gold, p.border]);
  rosette(g, mx, my, mr * 0.28, 8, [p.cream, p.accent]);
  g.fillStyle = p.gold; g.beginPath(); g.arc(mx, my, mr * 0.07, 0, 7); g.fill();
  // pendants above and below
  for (const s of [-1, 1]) {
    const py = my + s * mr * 1.38;
    g.fillStyle = p.gold; g.beginPath(); g.moveTo(mx, py - s * mr * 0.18 - s * 6); g.lineTo(mx + mr * 0.2, py); g.lineTo(mx, py + s * mr * 0.24); g.lineTo(mx - mr * 0.2, py); g.fill();
    g.fillStyle = p.border; g.beginPath(); g.moveTo(mx, py - s * mr * 0.1); g.lineTo(mx + mr * 0.12, py); g.lineTo(mx, py + s * mr * 0.15); g.lineTo(mx - mr * 0.12, py); g.fill();
  }
  // woolly texture
  noiseLayer(g, W, H, { seed: p.seed, cells: 5, amp: 0.06 });
  grain(g, W, H, p.seed, 0.045);
}

/** Ornate rug with border, field pattern, corner pieces and a central medallion. Whole rug = one texture (no tiling), 2:3 portrait; stretch over the rug quad. */
export function carpet(o: RugOpts = {}): THREE.CanvasTexture {
  const p = { field: o.field ?? "#2f4f8f", border: o.border ?? "#8f1d2a", accent: o.accent ?? "#d0432f", gold: o.gold ?? "#e3b44c", cream: o.cream ?? "#f1e3c2", seed: o.seed ?? 16, fringe: o.fringe ?? true };
  return makeTex(keyOf("carpet", p), 768, 1152, (g, W, H) => drawRug(g, W, H, { ...p, persian: false }), false);
}
/** Dense Persian rug (deep red field, navy border, gold arabesques). Whole rug = one texture, 2:3 portrait. */
export function persianRug(o: RugOpts = {}): THREE.CanvasTexture {
  const p = { field: o.field ?? "#9a1f24", border: o.border ?? "#1f2a55", accent: o.accent ?? "#d65a2a", gold: o.gold ?? "#e6b850", cream: o.cream ?? "#f3e6c8", seed: o.seed ?? 17, fringe: o.fringe ?? true };
  return makeTex(keyOf("persian", p), 768, 1152, (g, W, H) => drawRug(g, W, H, { ...p, persian: true }), false);
}
/** Tileable carpet / runner field (palace corridors, aisles): small repeating motifs on a coloured ground. Tile = 1 x 1 m. */
export function carpetTile(o: { field?: string; motif?: string; accent?: string; seed?: number } = {}): THREE.CanvasTexture {
  const p = { field: o.field ?? "#a3232c", motif: o.motif ?? "#e3b44c", accent: o.accent ?? "#2a3a6a", seed: o.seed ?? 18 };
  return makeTex(keyOf("carpetTile", p), 512, 512, (g, S) => {
    g.fillStyle = p.field; g.fillRect(0, 0, S, S);
    const n = 4, c = S / n;
    for (let i = -1; i <= n; i++) for (let j = -1; j <= n; j++) {
      const X = i * c + c / 2, Y = j * c + c / 2;
      g.fillStyle = p.accent; g.beginPath(); g.moveTo(X, Y - c * 0.42); g.lineTo(X + c * 0.42, Y); g.lineTo(X, Y + c * 0.42); g.lineTo(X - c * 0.42, Y); g.fill();
      rosette(g, X, Y, c * 0.3, 8, [p.motif, p.field, p.motif]);
      g.fillStyle = p.motif; g.beginPath(); g.arc(i * c, j * c, c * 0.06, 0, 7); g.fill();
    }
    noiseLayer(g, S, S, { seed: p.seed, cells: 4, amp: 0.06 });
    grain(g, S, S, p.seed, 0.045);
  });
}

/* ================================================================ FLOOR TILES & STONE */

function marbleVeins(g: Ctx, W: number, H: number, r: RNG, vein: string, n: number, alpha: number, x0 = 0, y0 = 0, clipW = W, clipH = H) {
  g.save(); g.beginPath(); g.rect(x0, y0, clipW, clipH); g.clip();
  const tileX = clipW === W, tileY = clipH === H;
  const smoothPath = (pts: [number, number][], dx: number, dy: number) => {
    g.beginPath(); g.moveTo(pts[0][0] + dx, pts[0][1] + dy);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      g.quadraticCurveTo(pts[i][0] + dx, pts[i][1] + dy, mx + dx, my + dy);
    }
    g.stroke();
  };
  const walk = (x: number, y: number, ang: number, steps: number, seg: number, wob: number) => {
    const pts: [number, number][] = [[x, y]];
    for (let s = 0; s < steps; s++) { ang += (r() - 0.5) * wob; x += Math.cos(ang) * seg; y += Math.sin(ang) * seg; pts.push([x, y]); }
    return pts;
  };
  const stroke = (pts: [number, number][], lw: number, a: number, blur: number) => {
    g.strokeStyle = rgba(vein, a); g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round";
    g.filter = blur > 0 ? `blur(${blur}px)` : "none";
    for (const dx of tileX ? [-W, 0, W] : [0]) for (const dy of tileY ? [-H, 0, H] : [0]) smoothPath(pts, dx, dy);
    g.filter = "none";
  };
  const span = Math.max(clipW, clipH);
  for (let k = 0; k < n; k++) {
    const main = walk(x0 + r() * clipW, y0 + r() * clipH, range(r, -0.9, -0.3) + (r() < 0.5 ? 0 : Math.PI), 16, span / 12, 0.55);
    stroke(main, span * 0.04, alpha * 0.22, span * 0.015);
    stroke(main, span * 0.006, alpha * 0.55, 1);
    stroke(main, span * 0.0025, alpha, 0);
    // a couple of thin branches
    for (let b = 0; b < 2; b++) {
      const at = main[2 + Math.floor(r() * (main.length - 4))];
      const br = walk(at[0], at[1], r() * Math.PI * 2, 6, span / 20, 0.9);
      stroke(br, span * 0.002, alpha * 0.7, 0.5);
    }
  }
  g.restore();
}

/** Polished marble with soft cloudy tone and branching veins. Tile = 1 x 1 m. */
export function marble(o: { color?: string; vein?: string; seed?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#ece8e2", vein: o.vein ?? "#8d8698", seed: o.seed ?? 19 };
  return makeTex(keyOf("marble", p), 512, 512, (g, S) => {
    g.fillStyle = p.color; g.fillRect(0, 0, S, S);
    noiseLayer(g, S, S, { seed: p.seed, cells: 3, oct: 4, amp: 0.05 });
    noiseLayer(g, S, S, { seed: p.seed + 3, cells: 2, oct: 4, amp: 0.35, tint: mix(p.color, p.vein, 0.5) });
    marbleVeins(g, S, S, seededRng(p.seed), p.vein, 3, 0.75);
    grain(g, S, S, p.seed, 0.012);
  });
}

/** Floor tiles. kind "checker" (25 cm squares), "marble" (50 cm marble slabs), "star" (octagons + diamond insets, 33 cm). Tile = 1 x 1 m. */
export function tiles(kind: "checker" | "marble" | "star" = "checker", o: { a?: string; b?: string; grout?: string; seed?: number } = {}): THREE.CanvasTexture {
  const defs = { checker: ["#efe6d6", "#2d2a35"], marble: ["#f0ece6", "#d6c6b2"], star: ["#e9dfcb", "#2e6a8a"] }[kind];
  const p = { kind, a: o.a ?? defs[0], b: o.b ?? defs[1], grout: o.grout ?? "#8c8579", seed: o.seed ?? 20 };
  return makeTex(keyOf("tiles", p), 512, 512, (g, S) => {
    g.fillStyle = p.grout; g.fillRect(0, 0, S, S);
    const r = seededRng(p.seed);
    if (p.kind === "checker" || p.kind === "marble") {
      const n = p.kind === "checker" ? 4 : 2, c = S / n, gr = 3;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const cr = cellRng(p.seed, i, j);
        const col = jit((i + j) % 2 ? p.b : p.a, cr, 0.03);
        bevelBlock(g, cr, i * c + gr / 2, j * c + gr / 2, c - gr, c - gr, col, { rad: 2, bevel: 4, dabs: 0, hi: 0.25, lo: 0.18 });
        marbleVeins(g, S, S, cr, (i + j) % 2 ? shade(p.b, 0.3) : "#9a92a0", p.kind === "marble" ? 2 : 1, p.kind === "marble" ? 0.6 : 0.3, i * c + gr / 2, j * c + gr / 2, c - gr, c - gr);
        // glossy reflection streak
        g.save(); rrect(g, i * c, j * c, c, c, 2); g.clip();
        const lg = g.createLinearGradient(i * c, j * c, i * c + c, j * c + c);
        lg.addColorStop(0.35, rgba("#ffffff", 0)); lg.addColorStop(0.45, rgba("#ffffff", 0.12)); lg.addColorStop(0.55, rgba("#ffffff", 0));
        g.fillStyle = lg; g.fillRect(i * c, j * c, c, c); g.restore();
      }
    } else {
      const n = 3, c = S / n, cut = c * 0.29;
      g.fillStyle = p.grout; g.fillRect(0, 0, S, S);
      for (let i = -1; i <= n; i++) for (let j = -1; j <= n; j++) {
        const x = i * c, y = j * c, gr = 2.5;
        const cr = cellRng(p.seed, (i + n) % n, (j + n) % n);
        const col = jit(p.a, cr, 0.04);
        g.save();
        g.beginPath();
        g.moveTo(x + cut, y + gr); g.lineTo(x + c - cut, y + gr); g.lineTo(x + c - gr, y + cut); g.lineTo(x + c - gr, y + c - cut);
        g.lineTo(x + c - cut, y + c - gr); g.lineTo(x + cut, y + c - gr); g.lineTo(x + gr, y + c - cut); g.lineTo(x + gr, y + cut); g.closePath();
        g.fillStyle = col; g.fill(); g.clip();
        const lg = g.createLinearGradient(0, y, 0, y + c); lg.addColorStop(0, rgba("#ffffff", 0.15)); lg.addColorStop(1, rgba("#000000", 0.12));
        g.fillStyle = lg; g.fillRect(x, y, c, c);
        // inner star outline
        g.strokeStyle = rgba(p.b, 0.35); g.lineWidth = 2;
        g.beginPath();
        for (let k = 0; k <= 16; k++) { const t = (k / 16) * Math.PI * 2, R = k % 2 ? c * 0.17 : c * 0.3; const X = x + c / 2 + Math.cos(t) * R, Y = y + c / 2 + Math.sin(t) * R; if (k) g.lineTo(X, Y); else g.moveTo(X, Y); }
        g.stroke();
        g.restore();
        // diamond insert at the corner
        const dx = x, dy = y, d = cut - gr * 1.2;
        g.fillStyle = jit(p.b, cr, 0.06);
        g.beginPath(); g.moveTo(dx, dy - d); g.lineTo(dx + d, dy); g.lineTo(dx, dy + d); g.lineTo(dx - d, dy); g.closePath(); g.fill();
        g.fillStyle = rgba("#ffffff", 0.2); g.beginPath(); g.moveTo(dx, dy - d); g.lineTo(dx + d, dy); g.lineTo(dx + d * 0.8, dy); g.lineTo(dx, dy - d * 0.8); g.fill();
      }
    }
    noiseLayer(g, S, S, { seed: p.seed + r(), cells: 3, amp: 0.04 });
  });
}

/* ================================================================ GROUND */

/** Stylised grass: soft light/dark patches plus little blade tufts (and optional tiny flowers). Tile = 2 x 2 m. */
export function grass(o: { color?: string; flowers?: boolean; seed?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#5fa84a", flowers: o.flowers ?? false, seed: o.seed ?? 21 };
  return makeTex(keyOf("grass", p), 512, 512, (g, S) => {
    const r = seededRng(p.seed);
    g.fillStyle = p.color; g.fillRect(0, 0, S, S);
    noiseLayer(g, S, S, { seed: p.seed, cells: 3, oct: 3, amp: 0.1 });
    noiseLayer(g, S, S, { seed: p.seed + 4, cells: 6, oct: 2, amp: 0.3, tint: "#c9d86a" });
    g.lineCap = "round";
    for (let k = 0; k < 1100; k++) {
      const x = r() * S, y = r() * S, h = range(r, 6, 13), lean = (r() - 0.5) * 6;
      const light = r() < 0.5;
      const col = light ? shade(p.color, range(r, 0.12, 0.28)) : shade(p.color, -range(r, 0.15, 0.3));
      wrap(S, S, x, y, 20, (X, Y) => {
        g.strokeStyle = rgba(col, 0.75); g.lineWidth = range(r, 1.2, 2.2);
        g.beginPath(); g.moveTo(X, Y); g.quadraticCurveTo(X + lean * 0.3, Y - h * 0.6, X + lean, Y - h); g.stroke();
        if (r() < 0.5) { g.beginPath(); g.moveTo(X + 1, Y); g.quadraticCurveTo(X + 3, Y - h * 0.4, X + 4 + lean * 0.5, Y - h * 0.75); g.stroke(); }
      });
    }
    if (p.flowers) {
      for (let k = 0; k < 40; k++) {
        const x = r() * S, y = r() * S, col = pick(r, ["#ffffff", "#f6d74a", "#f08ab0", "#9ec5ff"]);
        wrap(S, S, x, y, 8, (X, Y) => { g.fillStyle = col; for (let q = 0; q < 5; q++) { const t = (q / 5) * Math.PI * 2; g.beginPath(); g.arc(X + Math.cos(t) * 2.5, Y + Math.sin(t) * 2.5, 2, 0, 7); g.fill(); } g.fillStyle = "#f2b02a"; g.beginPath(); g.arc(X, Y, 1.5, 0, 7); g.fill(); });
      }
    }
    grain(g, S, S, p.seed, 0.02);
  });
}

/** Dirt / earth path with pebbles and soft patches. Tile = 2 x 2 m. */
export function dirt(o: { color?: string; pebbles?: number; seed?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#a57a50", pebbles: o.pebbles ?? 70, seed: o.seed ?? 22 };
  return makeTex(keyOf("dirt", p), 512, 512, (g, S) => {
    const r = seededRng(p.seed);
    g.fillStyle = p.color; g.fillRect(0, 0, S, S);
    noiseLayer(g, S, S, { seed: p.seed, cells: 3, oct: 4, amp: 0.12 });
    for (let k = 0; k < 30; k++) {
      const x = r() * S, y = r() * S, rr = range(r, 15, 50), dark = r() < 0.5;
      wrap(S, S, x, y, rr, (X, Y) => { const rg = g.createRadialGradient(X, Y, 0, X, Y, rr); rg.addColorStop(0, rgba(dark ? "#3a2614" : "#e8c89a", 0.13)); rg.addColorStop(1, rgba("#000000", 0)); g.fillStyle = rg; g.fillRect(X - rr, Y - rr, rr * 2, rr * 2); });
    }
    for (let k = 0; k < p.pebbles; k++) {
      const x = r() * S, y = r() * S, w = range(r, 2.5, 7), h = w * range(r, 0.6, 0.9), col = jit(mix(p.color, "#9a9490", 0.6), r, 0.2);
      wrap(S, S, x, y, 10, (X, Y) => {
        g.fillStyle = rgba("#000000", 0.3); g.beginPath(); g.ellipse(X + 1, Y + 1.5, w, h, 0, 0, 7); g.fill();
        g.fillStyle = col; g.beginPath(); g.ellipse(X, Y, w, h, 0, 0, 7); g.fill();
        g.fillStyle = rgba("#ffffff", 0.35); g.beginPath(); g.ellipse(X - w * 0.3, Y - h * 0.35, w * 0.4, h * 0.3, 0, 0, 7); g.fill();
      });
    }
    grain(g, S, S, p.seed, 0.04);
  });
}

/** Sand with wind ripples and speckles (desert, beach). Tile = 2 x 2 m. */
export function sand(o: { color?: string; ripples?: boolean; seed?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#e2bf82", ripples: o.ripples ?? true, seed: o.seed ?? 23 };
  return makeTex(keyOf("sand", p), 512, 512, (g, S) => {
    const r = seededRng(p.seed);
    g.fillStyle = p.color; g.fillRect(0, 0, S, S);
    noiseLayer(g, S, S, { seed: p.seed, cells: 3, oct: 3, amp: 0.08 });
    if (p.ripples) {
      for (let k = 0; k < 18; k++) {
        const y0 = (k / 18) * S, ph = r() * 7, a = range(r, 4, 10);
        const path = (dy: number) => { g.beginPath(); for (let x = 0; x <= S; x += 8) { const y = y0 + dy + a * Math.sin((x / S) * Math.PI * 2 * 2 + ph) + 3 * Math.sin((x / S) * Math.PI * 2 * 5 + ph * 2); if (x) g.lineTo(x, y); else g.moveTo(x, y); } };
        for (const off of [-S, 0, S]) {
          g.strokeStyle = rgba(shade(p.color, -0.25), 0.35); g.lineWidth = 3; path(off); g.stroke();
          g.strokeStyle = rgba(shade(p.color, 0.3), 0.4); g.lineWidth = 2; path(off - 4); g.stroke();
        }
      }
    }
    for (let k = 0; k < 900; k++) { g.fillStyle = rgba(r() < 0.5 ? shade(p.color, -0.35) : "#ffffff", 0.35); g.fillRect(r() * S, r() * S, 1.5, 1.5); }
    grain(g, S, S, p.seed, 0.03);
  });
}

/** Soft blue-white snow with sparkles; tracks: true adds sledge/wheel ruts running along v (up the texture). Tile = 2 x 2 m. */
export function snow(o: { color?: string; shadow?: string; tracks?: boolean; seed?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#eef3fb", shadow: o.shadow ?? "#a9b9de", tracks: o.tracks ?? false, seed: o.seed ?? 24 };
  return makeTex(keyOf("snow", p), 512, 512, (g, S) => {
    const r = seededRng(p.seed);
    g.fillStyle = p.color; g.fillRect(0, 0, S, S);
    noiseLayer(g, S, S, { seed: p.seed, cells: 2, oct: 3, amp: 0.4, tint: p.shadow });
    // soft wind-swept streaks
    noiseLayer(g, S, S, { seed: p.seed + 7, cells: 8, oct: 2, amp: 0.04 });
    if (p.tracks) {
      for (const cx of [0.32, 0.68]) for (const d of [-0.05, 0.05]) {
        const x0 = (cx + d) * S;
        const path = (dx: number) => { g.beginPath(); for (let y = -32; y <= S + 32; y += 8) { const x = x0 + dx + 4 * Math.sin((y / S) * Math.PI * 2 + cx * 9); if (y > -32) g.lineTo(x, y); else g.moveTo(x, y); } };
        g.filter = "blur(4px)";
        g.strokeStyle = rgba(shade(p.shadow, -0.1), 0.4); g.lineWidth = 16; path(0); g.stroke();
        g.strokeStyle = rgba(shade(p.shadow, -0.2), 0.3); g.lineWidth = 6; path(-3); g.stroke();
        g.strokeStyle = rgba("#ffffff", 0.7); g.lineWidth = 4; path(9); g.stroke();
        g.filter = "none";
      }
    }
    for (let k = 0; k < 260; k++) { const x = r() * S, y = r() * S; g.fillStyle = rgba("#ffffff", range(r, 0.6, 1)); g.beginPath(); g.arc(x, y, range(r, 0.6, 1.6), 0, 7); g.fill(); }
    grain(g, S, S, p.seed, 0.012);
  });
}

/** Stylised water: deep base, cartoon ripple highlights and darker troughs. Tile = 2 x 2 m. */
export function water(o: { color?: string; light?: string; seed?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#2f78c4", light: o.light ?? "#9fdcff", seed: o.seed ?? 25 };
  return makeTex(keyOf("water", p), 512, 512, (g, S) => {
    const r = seededRng(p.seed);
    g.fillStyle = p.color; g.fillRect(0, 0, S, S);
    noiseLayer(g, S, S, { seed: p.seed, cells: 3, oct: 3, amp: 0.12 });
    g.lineCap = "round";
    const wave = (x: number, y: number, w: number, col: string, lw: number) => wrap(S, S, x, y, w, (X, Y) => {
      g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(X - w / 2, Y); g.quadraticCurveTo(X - w / 4, Y - w * 0.12, X, Y); g.quadraticCurveTo(X + w / 4, Y + w * 0.12, X + w / 2, Y); g.stroke();
    });
    for (let k = 0; k < 70; k++) wave(r() * S, r() * S, range(r, 30, 80), rgba(shade(p.color, -0.3), 0.35), range(r, 3, 6));
    for (let k = 0; k < 90; k++) wave(r() * S, r() * S, range(r, 16, 56), rgba(p.light, range(r, 0.45, 0.85)), range(r, 2, 4));
    for (let k = 0; k < 40; k++) { const x = r() * S, y = r() * S; g.fillStyle = rgba("#ffffff", 0.7); g.beginPath(); g.ellipse(x, y, range(r, 2, 5), 1.2, 0, 0, 7); g.fill(); }
  });
}

/* ================================================================ MATERIALS */

/** Metal sheet: brushed streaks; rust: 0..1 adds rust blotches; plates: true adds riveted plate seams. Tile = 1 x 1 m. */
export function metal(o: { color?: string; rust?: number; plates?: boolean; seed?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#9aa3ad", rust: o.rust ?? 0, plates: o.plates ?? false, seed: o.seed ?? 26 };
  return makeTex(keyOf("metal", p), 512, 512, (g, S) => {
    const r = seededRng(p.seed);
    g.fillStyle = p.color; g.fillRect(0, 0, S, S);
    noiseLayer(g, S, S, { seed: p.seed, cells: 2, oct: 2, amp: 0.08 });
    for (let k = 0; k < 500; k++) { const y = r() * S; g.fillStyle = rgba(r() < 0.5 ? "#ffffff" : "#000000", range(r, 0.03, 0.09)); g.fillRect(0, y, S, range(r, 0.6, 2)); }
    if (p.rust > 0) {
      const f = fbm(p.seed + 5, 4, 4);
      const img = g.getImageData(0, 0, S, S), d = img.data;
      const rc = hex2rgb("#8a4a22"), rd = hex2rgb("#5a2c14");
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const n = f(x / S, y / S), t = Math.max(0, Math.min(1, (n - (0.62 - p.rust * 0.3)) * 6));
        if (t <= 0) continue;
        const i = (y * S + x) * 4, c = n > 0.7 ? rd : rc;
        d[i] += (c[0] - d[i]) * t; d[i + 1] += (c[1] - d[i + 1]) * t; d[i + 2] += (c[2] - d[i + 2]) * t;
      }
      g.putImageData(img, 0, 0);
      // drips
      for (let k = 0; k < 12 * p.rust; k++) { const x = r() * S, y = r() * S, l = range(r, 20, 70); const lg = g.createLinearGradient(0, y, 0, y + l); lg.addColorStop(0, rgba("#7a3a18", 0.5)); lg.addColorStop(1, rgba("#7a3a18", 0)); g.fillStyle = lg; g.fillRect(x, y, range(r, 2, 4), l); }
    }
    if (p.plates) {
      for (const t of [0, 0.5]) {
        g.fillStyle = rgba("#000000", 0.4); g.fillRect(0, t * S, S, 2.5); g.fillRect(t * S, 0, 2.5, S);
        g.fillStyle = rgba("#ffffff", 0.3); g.fillRect(0, t * S + 2.5, S, 1.5); g.fillRect(t * S + 2.5, 0, 1.5, S);
      }
      for (const t of [0, 0.5]) for (let k = 0; k < 16; k++) {
        const u = (k + 0.5) / 16 * S;
        for (const [X, Y] of [[u, t * S + 12], [u, t * S - 10], [t * S + 12, u], [t * S - 10, u]]) {
          const XX = (X + S) % S, YY = (Y + S) % S;
          g.fillStyle = rgba("#000000", 0.35); g.beginPath(); g.arc(XX + 1, YY + 1.5, 4.5, 0, 7); g.fill();
          const rg = g.createRadialGradient(XX - 1.5, YY - 1.5, 0.5, XX, YY, 4.5); rg.addColorStop(0, shade(p.color, 0.5)); rg.addColorStop(1, shade(p.color, -0.3));
          g.fillStyle = rg; g.beginPath(); g.arc(XX, YY, 4, 0, 7); g.fill();
        }
      }
    }
    grain(g, S, S, p.seed, 0.015);
  });
}

/** Paper / parchment: warm blotchy tone with fibres; edges: true darkens and burns the border (single sheet, not tileable). Tile = 0.5 x 0.5 m. */
export function parchment(o: { color?: string; edges?: boolean; seed?: number } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#ecd9ab", edges: o.edges ?? false, seed: o.seed ?? 27 };
  return makeTex(keyOf("parchment", p), 512, 512, (g, S) => {
    const r = seededRng(p.seed);
    g.fillStyle = p.color; g.fillRect(0, 0, S, S);
    noiseLayer(g, S, S, { seed: p.seed, cells: 3, oct: 4, amp: 0.1 });
    noiseLayer(g, S, S, { seed: p.seed + 5, cells: 4, oct: 3, amp: 0.35, tint: shade(p.color, -0.3) });
    for (let k = 0; k < 200; k++) { const x = r() * S, y = r() * S, a = r() * 7, l = range(r, 3, 12); g.strokeStyle = rgba("#7a5a2a", 0.15); g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    if (p.edges) {
      const rg = g.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.72);
      rg.addColorStop(0, rgba("#5a3a14", 0)); rg.addColorStop(0.8, rgba("#5a3a14", 0.35)); rg.addColorStop(1, rgba("#3a2008", 0.8));
      g.fillStyle = rg; g.fillRect(0, 0, S, S);
    }
    grain(g, S, S, p.seed, 0.025);
  });
}
/** alias: plain paper */
export const paper = (o: { color?: string; seed?: number } = {}) => parchment({ color: o.color ?? "#f6f0e2", seed: o.seed ?? 28 });

/** Striped awning / tent fabric with soft fold shading. Tile = 1 x 1 m, 8 stripes. */
export function awningStripes(o: { a?: string; b?: string; stripes?: number; seed?: number } = {}): THREE.CanvasTexture {
  const p = { a: o.a ?? "#d8323a", b: o.b ?? "#f6efe2", stripes: o.stripes ?? 8, seed: o.seed ?? 29 };
  return makeTex(keyOf("awning", p), 512, 512, (g, S) => {
    const w = S / p.stripes;
    for (let i = 0; i < p.stripes; i++) {
      const col = i % 2 ? p.b : p.a, x = i * w;
      g.fillStyle = col; g.fillRect(x, 0, w, S);
      const lg = g.createLinearGradient(x, 0, x + w, 0);
      lg.addColorStop(0, rgba("#000000", 0.1)); lg.addColorStop(0.35, rgba("#ffffff", 0.12)); lg.addColorStop(1, rgba("#000000", 0.14));
      g.fillStyle = lg; g.fillRect(x, 0, w, S);
      g.fillStyle = rgba("#000000", 0.18); g.fillRect(x + w - 1.5, 0, 1.5, S);
    }
    // canvas weave
    g.fillStyle = rgba("#000000", 0.045);
    for (let y = 0; y < S; y += 3) g.fillRect(0, y, S, 1);
    for (let x = 0; x < S; x += 3) g.fillRect(x, 0, 1, S);
    noiseLayer(g, S, S, { seed: p.seed, cells: 3, amp: 0.05 });
  });
}
/** alias */
export const fabricStripes = awningStripes;

/** Leafy bush / foliage card on a TRANSPARENT background (use with alphaTest ~0.5 on a plane). Single image, not tileable; about 1 x 1 m of bush. */
export function bushLeaves(o: { color?: string; seed?: number; flowers?: string | null } = {}): THREE.CanvasTexture {
  const p = { color: o.color ?? "#4f9a45", seed: o.seed ?? 30, flowers: o.flowers ?? null };
  return makeTex(keyOf("bush", p), 512, 512, (g, S) => {
    const r = seededRng(p.seed);
    g.clearRect(0, 0, S, S);
    // blob = union of circles
    const blobs: [number, number, number][] = [];
    for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; blobs.push([S / 2 + Math.cos(a) * S * 0.2, S * 0.56 + Math.sin(a) * S * 0.16, S * range(r, 0.17, 0.23)]); }
    blobs.push([S / 2, S * 0.5, S * 0.28]);
    const inside = (x: number, y: number) => blobs.some(([bx, by, br]) => (x - bx) ** 2 + (y - by) ** 2 < br * br);
    // dark body
    g.fillStyle = shade(p.color, -0.45);
    blobs.forEach(([bx, by, br]) => { g.beginPath(); g.arc(bx, by, br * 0.95, 0, 7); g.fill(); });
    const leaf = (x: number, y: number, s: number, a: number, col: string) => {
      g.save(); g.translate(x, y); g.rotate(a);
      g.fillStyle = col; g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * 0.6, s, 0); g.quadraticCurveTo(0, s * 0.6, -s, 0); g.fill();
      g.strokeStyle = rgba(shade(col, -0.35), 0.6); g.lineWidth = 1; g.beginPath(); g.moveTo(-s * 0.8, 0); g.lineTo(s * 0.8, 0); g.stroke();
      g.restore();
    };
    for (let layer = 0; layer < 4; layer++) {
      for (let k = 0; k < 420; k++) {
        const x = r() * S, y = r() * S;
        if (!inside(x, y)) continue;
        const lightK = (1 - y / S) * 0.35 + layer * 0.08 - 0.15 + (r() - 0.5) * 0.12;
        const s = range(r, 9, 15) - layer;
        leaf(x, y, s, r() * Math.PI * 2, lightK >= 0 ? shade(p.color, lightK) : shade(p.color, lightK * 1.5));
      }
    }
    if (p.flowers) for (let k = 0; k < 40; k++) { const x = r() * S, y = r() * S; if (!inside(x, y)) continue; smallFlower(g, x, y, 6, p.flowers, "#f6d34a", "rgba(0,0,0,0)", r() * 6); }
  }, false);
}

/** Shelf of books: rows of coloured spines with gold bands, shelf boards between. Tile = 1 x 1 m, 3 shelves (tiles horizontally and vertically). */
export function bookshelf(o: { wood?: string; seed?: number; palette?: string[] } = {}): THREE.CanvasTexture {
  const p = { wood: o.wood ?? "#7a4a2a", seed: o.seed ?? 31, palette: o.palette ?? ["#8e2b2b", "#2e4f7e", "#2f6b47", "#c79a3a", "#5b3a6e", "#a8562a", "#2a2a3a", "#d8c8a0", "#7e1f3e", "#3d7a7a"] };
  return makeTex(keyOf("books", p), 512, 512, (g, S) => {
    const rows = 3, rh = S / rows, board = rh * 0.12;
    for (let row = 0; row < rows; row++) {
      const r = cellRng(p.seed, row);
      const y0 = row * rh, inner = rh - board;
      // back panel
      g.fillStyle = shade(p.wood, -0.55); g.fillRect(0, y0, S, inner);
      // books
      let x = 0;
      const widths: number[] = [];
      while (x < S) { const w = range(r, 12, 28); widths.push(w); x += w; }
      const k = S / x; x = 0;
      widths.forEach((w0) => {
        const w = w0 * k;
        const gap = r() < 0.06;
        if (!gap) {
          const col = jit(pick(r, p.palette), r, 0.08);
          const h = inner * range(r, 0.62, 0.93), y = y0 + inner - h;
          g.save(); g.beginPath(); g.rect(x + 0.5, y, w - 1, h); g.clip();
          const lg = g.createLinearGradient(x, 0, x + w, 0);
          lg.addColorStop(0, shade(col, -0.3)); lg.addColorStop(0.3, shade(col, 0.15)); lg.addColorStop(0.6, col); lg.addColorStop(1, shade(col, -0.35));
          g.fillStyle = lg; g.fillRect(x, y, w, h);
          const gold = "#e3c066";
          if (r() < 0.75) { g.fillStyle = rgba(gold, 0.85); g.fillRect(x, y + h * 0.1, w, 2.5); g.fillRect(x, y + h * 0.85, w, 2.5); }
          if (r() < 0.5) { g.fillStyle = rgba(gold, 0.8); g.fillRect(x + w * 0.25, y + h * 0.35, w * 0.5, h * 0.18); }
          else if (r() < 0.5) { g.fillStyle = rgba(shade(col, 0.4), 0.8); g.fillRect(x + w * 0.2, y + h * 0.3, w * 0.6, h * 0.25); }
          g.restore();
        }
        x += w;
      });
      // shadow at the top of the cubby
      const sh = g.createLinearGradient(0, y0, 0, y0 + inner * 0.3); sh.addColorStop(0, rgba("#000000", 0.5)); sh.addColorStop(1, rgba("#000000", 0));
      g.fillStyle = sh; g.fillRect(0, y0, S, inner * 0.3);
      // shelf board
      const by = y0 + inner;
      const bl = g.createLinearGradient(0, by, 0, by + board);
      bl.addColorStop(0, shade(p.wood, 0.3)); bl.addColorStop(0.2, p.wood); bl.addColorStop(1, shade(p.wood, -0.35));
      g.fillStyle = bl; g.fillRect(0, by, S, board);
      g.strokeStyle = rgba(shade(p.wood, -0.4), 0.3); g.lineWidth = 1;
      for (let q = 0; q < 3; q++) { const gy = by + board * (0.3 + q * 0.22); g.beginPath(); g.moveTo(0, gy); for (let gx = 0; gx <= S; gx += 32) g.lineTo(gx, gy + Math.sin(gx * 0.02 + q) * 1.2); g.stroke(); }
    }
    noiseLayer(g, S, S, { seed: p.seed, cells: 4, amp: 0.04 });
  });
}

/* ================================================================ WINDOWS */

type WinOpts = { cols?: number; rows?: number; frame?: string; curtains?: string | null; seed?: number };

function drawWindow(g: Ctx, W: number, H: number, p: Required<WinOpts>, night: boolean) {
  const r = seededRng(p.seed);
  const fw = W * 0.07;
  // frame
  g.fillStyle = p.frame; g.fillRect(0, 0, W, H);
  g.fillStyle = rgba("#ffffff", 0.18); g.fillRect(0, 0, W, fw * 0.25); g.fillRect(0, 0, fw * 0.25, H);
  g.fillStyle = rgba("#000000", 0.25); g.fillRect(0, H - fw * 0.3, W, fw * 0.3); g.fillRect(W - fw * 0.3, 0, fw * 0.3, H);
  const gx = fw, gy = fw, gw = W - 2 * fw, gh = H - 2 * fw;
  // glass
  if (night) {
    const rg = g.createRadialGradient(gx + gw * 0.5, gy + gh * 0.6, gw * 0.05, gx + gw * 0.5, gy + gh * 0.55, gw * 0.85);
    rg.addColorStop(0, "#fff6c8"); rg.addColorStop(0.45, "#ffd36a"); rg.addColorStop(1, "#e88a2c");
    g.fillStyle = rg; g.fillRect(gx, gy, gw, gh);
    // room hints: a lamp glow + furniture silhouettes
    g.fillStyle = rgba("#a2541a", 0.35); g.fillRect(gx, gy + gh * 0.78, gw, gh * 0.22);
    if (p.curtains) {
      for (const s of [0, 1]) {
        const cx = s ? gx + gw : gx;
        g.fillStyle = p.curtains; g.beginPath(); g.moveTo(cx, gy); g.lineTo(cx + (s ? -1 : 1) * gw * 0.26, gy); g.quadraticCurveTo(cx + (s ? -1 : 1) * gw * 0.1, gy + gh * 0.5, cx + (s ? -1 : 1) * gw * 0.18, gy + gh); g.lineTo(cx, gy + gh); g.fill();
        g.strokeStyle = rgba(shade(p.curtains, -0.35), 0.6); g.lineWidth = 3;
        for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(cx + (s ? -1 : 1) * gw * 0.06 * k, gy); g.quadraticCurveTo(cx + (s ? -1 : 1) * gw * 0.03 * k, gy + gh * 0.5, cx + (s ? -1 : 1) * gw * 0.045 * k, gy + gh); g.stroke(); }
      }
    }
  } else {
    const lg = g.createLinearGradient(gx, gy, gx, gy + gh);
    lg.addColorStop(0, "#bfe6ff"); lg.addColorStop(0.55, "#6fb2e6"); lg.addColorStop(1, "#3c7cc0");
    g.fillStyle = lg; g.fillRect(gx, gy, gw, gh);
    // reflected cloud + diagonal glints
    g.fillStyle = rgba("#ffffff", 0.35); g.beginPath(); g.ellipse(gx + gw * 0.3, gy + gh * 0.25, gw * 0.18, gh * 0.06, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.rect(gx, gy, gw, gh); g.clip();
    for (const [t, w] of [[0.25, 0.12], [0.45, 0.05], [0.72, 0.08]]) {
      g.fillStyle = rgba("#ffffff", 0.35); g.beginPath();
      const x = gx + gw * t; g.moveTo(x, gy + gh); g.lineTo(x + gw * w, gy + gh); g.lineTo(x + gw * w + gh * 0.7, gy); g.lineTo(x + gh * 0.7, gy); g.fill();
    }
    g.restore();
    if (p.curtains) { g.fillStyle = rgba(p.curtains, 0.85); g.fillRect(gx, gy, gw * 0.14, gh); g.fillRect(gx + gw * 0.86, gy, gw * 0.14, gh); }
  }
  // mullions
  const mw = Math.max(5, W * 0.025);
  g.fillStyle = p.frame;
  for (let i = 1; i < p.cols; i++) g.fillRect(gx + (gw * i) / p.cols - mw / 2, gy, mw, gh);
  for (let j = 1; j < p.rows; j++) g.fillRect(gx, gy + (gh * j) / p.rows - mw / 2, gw, mw);
  g.fillStyle = rgba("#ffffff", 0.2);
  for (let i = 1; i < p.cols; i++) g.fillRect(gx + (gw * i) / p.cols - mw / 2, gy, 1.5, gh);
  for (let j = 1; j < p.rows; j++) g.fillRect(gx, gy + (gh * j) / p.rows - mw / 2, gw, 1.5);
  // inner frame shadow on glass
  g.strokeStyle = rgba("#000000", 0.35); g.lineWidth = 4; g.strokeRect(gx + 2, gy + 2, gw - 4, gh - 4);
  void r;
}

/** Lit window at night: warm glow, optional curtains, mullions. Single image (not tileable), 2:3 portrait. cols x rows panes. */
export function windowNight(o: WinOpts = {}): THREE.CanvasTexture {
  const p = { cols: o.cols ?? 2, rows: o.rows ?? 3, frame: o.frame ?? "#f1ead8", curtains: o.curtains === undefined ? "#b8343a" : o.curtains, seed: o.seed ?? 32 };
  return makeTex(keyOf("winN", p), 512, 768, (g, W, H) => drawWindow(g, W, H, p, true), false);
}
/** Window by day: blue sky reflection with glints, mullions. Single image (not tileable), 2:3 portrait. */
export function windowDay(o: WinOpts = {}): THREE.CanvasTexture {
  const p = { cols: o.cols ?? 2, rows: o.rows ?? 3, frame: o.frame ?? "#f1ead8", curtains: o.curtains === undefined ? null : o.curtains, seed: o.seed ?? 33 };
  return makeTex(keyOf("winD", p), 512, 768, (g, W, H) => drawWindow(g, W, H, p, false), false);
}

/* ================================================================ SIGNS & LABELS */

export type SignOpts = {
  /** canvas size in px (aspect should match the sign mesh) */
  w?: number; h?: number;
  bg?: string; border?: string; color?: string;
  /** CSS font family, e.g. "Georgia, serif" or "'Arial Black', sans-serif" */
  font?: string; weight?: string;
  /** max font size in px; text shrinks to fit */
  size?: number;
  radius?: number; borderWidth?: number;
  /** wood: painted wooden board look; plain: flat colour */
  style?: "plain" | "wood" | "metal";
  /** text outline colour (null for none) */
  outline?: string | null;
};

function fitText(g: Ctx, text: string, maxW: number, maxH: number, font: string, weight: string, size: number) {
  const lines = text.split("\n");
  let s = size;
  for (; s > 8; s -= 2) {
    g.font = `${weight} ${s}px ${font}`;
    const w = Math.max(...lines.map((l) => g.measureText(l).width));
    if (w <= maxW && s * 1.15 * lines.length <= maxH) break;
  }
  return { lines, s };
}

/** Readable signboard texture (shop signs, name boards, banners). Single image; size the mesh to w:h. Multi-line with "\n". */
export function signTex(text: string, opts: SignOpts = {}): THREE.CanvasTexture {
  const p = {
    w: opts.w ?? 1024, h: opts.h ?? 256, bg: opts.bg ?? "#1f4a3a", border: opts.border ?? "#e3b44c", color: opts.color ?? "#f6e7b8",
    font: opts.font ?? "Georgia, 'Times New Roman', serif", weight: opts.weight ?? "bold", size: opts.size ?? 150, radius: opts.radius ?? 24,
    borderWidth: opts.borderWidth ?? 14, style: opts.style ?? "plain", outline: opts.outline === undefined ? "#00000088" : opts.outline,
  };
  return makeTex(keyOf("sign:" + text, p), p.w, p.h, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    const bw = p.borderWidth;
    rrect(g, 0, 0, W, H, p.radius); g.fillStyle = p.border; g.fill();
    rrect(g, bw, bw, W - 2 * bw, H - 2 * bw, Math.max(0, p.radius - bw / 2)); g.fillStyle = p.bg; g.fill();
    g.save(); g.clip();
    if (p.style === "wood") {
      const n = Math.max(2, Math.round(H / 90)), ph = H / n;
      for (let i = 0; i < n; i++) {
        const r = cellRng(9, i); g.fillStyle = jit(p.bg, r, 0.06); g.fillRect(0, i * ph, W, ph);
        g.strokeStyle = rgba(shade(p.bg, -0.35), 0.35); g.lineWidth = 1.5;
        for (let k = 0; k < 6; k++) { const y = i * ph + r() * ph; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 24) g.lineTo(x, y + Math.sin(x * 0.01 + k) * 2); g.stroke(); }
        g.fillStyle = rgba("#000000", 0.35); g.fillRect(0, i * ph, W, 2);
      }
    } else if (p.style === "metal") {
      const lg = g.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, rgba("#ffffff", 0.18)); lg.addColorStop(0.5, rgba("#ffffff", 0)); lg.addColorStop(1, rgba("#000000", 0.2));
      g.fillStyle = lg; g.fillRect(0, 0, W, H);
    } else {
      const lg = g.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, rgba("#ffffff", 0.1)); lg.addColorStop(1, rgba("#000000", 0.12));
      g.fillStyle = lg; g.fillRect(0, 0, W, H);
    }
    // inner bevel line
    g.strokeStyle = rgba("#000000", 0.25); g.lineWidth = 4; rrect(g, bw + 2, bw + 2, W - 2 * bw - 4, H - 2 * bw - 4, Math.max(0, p.radius - bw)); g.stroke();
    g.restore();
    // text
    const { lines, s } = fitText(g, text, W - 2 * bw - W * 0.08, H - 2 * bw - H * 0.12, p.font, p.weight, p.size);
    g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
    const lh = s * 1.12, ty = H / 2 - ((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => {
      const y = ty + i * lh + s * 0.04;
      g.fillStyle = rgba("#000000", 0.35); g.fillText(l, W / 2 + s * 0.04, y + s * 0.05);
      if (p.outline) { g.strokeStyle = p.outline; g.lineWidth = Math.max(2, s * 0.08); g.strokeText(l, W / 2, y); }
      g.fillStyle = p.color; g.fillText(l, W / 2, y);
    });
    // screws in corners
    for (const [x, y] of [[bw * 0.5, bw * 0.5], [W - bw * 0.5, bw * 0.5], [bw * 0.5, H - bw * 0.5], [W - bw * 0.5, H - bw * 0.5]]) {
      g.fillStyle = rgba("#000000", 0.4); g.beginPath(); g.arc(x, y, bw * 0.28, 0, 7); g.fill();
    }
  }, false);
}

/** Small label (box labels, mugs, name tags, price cards). Single image, default 256 x 96 px. */
export function labelTex(text: string, opts: { w?: number; h?: number; bg?: string; color?: string; border?: string | null; font?: string; weight?: string; size?: number; radius?: number } = {}): THREE.CanvasTexture {
  const p = { w: opts.w ?? 256, h: opts.h ?? 96, bg: opts.bg ?? "#ffffff", color: opts.color ?? "#1d2a5a", border: opts.border === undefined ? "#1d2a5a" : opts.border, font: opts.font ?? "'Arial Black', Arial, sans-serif", weight: opts.weight ?? "bold", size: opts.size ?? 64, radius: opts.radius ?? 10 };
  return makeTex(keyOf("label:" + text, p), p.w, p.h, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    rrect(g, 0, 0, W, H, p.radius); g.fillStyle = p.bg; g.fill();
    if (p.border) { g.strokeStyle = p.border; g.lineWidth = Math.max(3, H * 0.06); rrect(g, H * 0.05, H * 0.05, W - H * 0.1, H - H * 0.1, p.radius * 0.8); g.stroke(); }
    const { lines, s } = fitText(g, text, W * 0.86, H * 0.78, p.font, p.weight, p.size);
    g.fillStyle = p.color; g.textAlign = "center"; g.textBaseline = "middle";
    const lh = s * 1.1, ty = H / 2 - ((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => g.fillText(l, W / 2, ty + i * lh + s * 0.04));
  }, false);
}

/* ================================================================ catalogue (preview sheet, discovery) */

/** Every texture with its default look, for the TextureSheet preview. [name, tile size in metres ("" = single image), make] */
export const TEXTURE_CATALOG: [string, string, () => THREE.CanvasTexture][] = [
  ["bricks (green paint)", "1m", () => bricks()],
  ["bricks (cream)", "1m", () => bricks("#efe2c4", "#a8977a")],
  ["rawBricks", "1m", () => rawBricks()],
  ["stoneBlocks", "2m", () => stoneBlocks()],
  ["cobblestones", "1m", () => cobblestones()],
  ["flagstoneFloor", "2m", () => flagstoneFloor()],
  ["woodPlanks vertical", "1m", () => woodPlanks()],
  ["woodPlanks horiz", "1m", () => woodPlanks({ dir: "horizontal", color: "#c08a52" })],
  ["woodFloor boards", "1m", () => woodFloor()],
  ["woodFloor parquet", "1m", () => woodFloor({ kind: "parquet" })],
  ["woodFloor herringb.", "1m", () => woodFloor({ kind: "herringbone", color: "#c9905a" })],
  ["clapboardSiding", "1m", () => clapboardSiding()],
  ["clapboard (red)", "1m", () => clapboardSiding({ color: "#b5443e" })],
  ["roofShingles", "1m", () => roofShingles()],
  ["roofShingles round", "1m", () => roofShingles({ style: "round", color: "#3f7a8a" })],
  ["roofTiles", "1m", () => roofTiles()],
  ["thatch", "1m", () => thatch()],
  ["plaster", "2m", () => plaster()],
  ["plaster + bricks", "2m", () => plaster({ color: "#f0e4cf", exposedBricks: true })],
  ["wallpaper stripes", "1m", () => wallpaper("stripes")],
  ["wallpaper damask", "1m", () => wallpaper("damask")],
  ["wallpaper floral", "1m", () => wallpaper("floral")],
  ["fleurFabric", "0.5m", () => fleurFabric()],
  ["velvetTufted", "0.5m", () => velvetTufted()],
  ["carpet", "", () => carpet()],
  ["persianRug", "", () => persianRug()],
  ["carpetTile", "1m", () => carpetTile()],
  ["tiles checker", "1m", () => tiles("checker")],
  ["tiles marble", "1m", () => tiles("marble")],
  ["tiles star", "1m", () => tiles("star")],
  ["marble", "1m", () => marble()],
  ["grass", "2m", () => grass({ flowers: true })],
  ["dirt", "2m", () => dirt()],
  ["sand", "2m", () => sand()],
  ["snow + tracks", "2m", () => snow({ tracks: true })],
  ["water", "2m", () => water()],
  ["metal brushed", "1m", () => metal()],
  ["metal rust plates", "1m", () => metal({ rust: 0.6, plates: true, color: "#7d8690" })],
  ["parchment", "0.5m", () => parchment()],
  ["parchment sheet (edges)", "", () => parchment({ edges: true })],
  ["awningStripes", "1m", () => awningStripes()],
  ["bushLeaves (alpha)", "", () => bushLeaves({ flowers: "#f2a0c0" })],
  ["bookshelf", "1m", () => bookshelf()],
  ["windowNight", "", () => windowNight()],
  ["windowDay", "", () => windowDay()],
  ["signTex", "", () => signTex("A. HALE, PHYSICIAN", { style: "wood", bg: "#7a4a24" })],
  ["labelTex", "", () => labelTex("KEN")],
];
