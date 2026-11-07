// City kit for the realism library (see animated-shorts/REALISM.md, "Environment rules"). Every piece is built from
// bevelled parts with photo / PBR materials, and is placed into a Batch (merged per material, so dense sets stay fast).
// Light points (bulbs, windows, signals) are reported through `glow` so the caller can add them to its Flames sprites.
import * as THREE from "three";
import { Batch, V3, rnd } from "../../videos/eiffel/lib";
import { M, photo } from "./materials";
import { AcgName } from "./assets";
import { wbox, rbox, wcyl, placer, UNIT_PLANE, BOX1, CYL16, SPH16 } from "./geo";
import { drawBoard } from "./type";

export type Glow = (p: V3, tint: V3) => void;
const ICO = new THREE.IcosahedronGeometry(1, 1);

// ---------------- lit windows ----------------
const WIN = new Map<number, THREE.MeshBasicMaterial>();
/** a lit window: a warm (or cool TV-lit) room with curtains and a lamp / shelf silhouette */
export const litWindow = (k: number) => { let m = WIN.get(k % 6); if (m) return m;
  const c = document.createElement("canvas"); c.width = 64; c.height = 96; const g = c.getContext("2d")!;
  const warm = k % 6 < 4, gr = g.createRadialGradient(32, 40, 4, 32, 50, 70); gr.addColorStop(0, warm ? "#fff0c8" : "#e0f0ff"); gr.addColorStop(1, warm ? "#c86a28" : "#4a7ab0"); g.fillStyle = gr; g.fillRect(0, 0, 64, 96);
  g.fillStyle = "rgba(50,25,15,0.38)"; if (k % 3 === 0) g.fillRect(8, 62, 48, 34); else if (k % 3 === 1) { g.fillRect(40, 30, 4, 66); g.beginPath(); g.moveTo(32, 30); g.lineTo(52, 30); g.lineTo(46, 18); g.lineTo(38, 18); g.fill(); } else for (let y = 20; y < 90; y += 14) g.fillRect(6, y, 30, 3);
  g.fillStyle = ["#a83a3a", "#e8d8b0", "#3a5a8a", "#c89a4a", "#f0e8e0", "#5a8a5a"][k % 6]; g.globalAlpha = 0.85; g.fillRect(0, 0, 12 + (k % 2) * 6, 96); g.fillRect(52 - (k % 2) * 6, 0, 12 + (k % 2) * 6, 96); g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; m = new THREE.MeshBasicMaterial({ map: t, toneMapped: false, color: 0xd0d0d0 }); WIN.set(k % 6, m); return m; };

// ---------------- shop windows ----------------
const SHOP = new Map<number, THREE.MeshBasicMaterial>();
/** a lit shop display: warm interior, shelves of goods, a counter, price tags */
export const shopWindow = (k: number) => { let m = SHOP.get(k % 5); if (m) return m;
  const c = document.createElement("canvas"); c.width = 256; c.height = 128; const g = c.getContext("2d")!, gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, ["#fff2d0", "#e8f4ff", "#fff0e0", "#f8ffe8", "#ffe8f0"][k % 5]); gr.addColorStop(1, ["#c87a3a", "#5a7aa8", "#a85a3a", "#6a8a4a", "#a85a7a"][k % 5]); g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  for (let y = 22; y < 110; y += 26) { g.fillStyle = "rgba(60,40,30,0.55)"; g.fillRect(8, y, 240, 3); for (let x = 12; x < 244; x += 9 + ((x * 7 + y) % 9)) { g.fillStyle = `hsl(${(x * 37 + y * 11 + k * 60) % 360},45%,${45 + ((x + y) % 25)}%)`; const hh = 8 + ((x * 13 + y) % 12); g.fillRect(x, y - hh, 7, hh); } }
  g.fillStyle = "rgba(40,25,20,0.6)"; g.fillRect(150, 92, 100, 36); g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.moveTo(0, 0); g.lineTo(60, 0); g.lineTo(0, 90); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; m = new THREE.MeshBasicMaterial({ map: t, toneMapped: false, color: 0xd8d8d8 }); SHOP.set(k % 5, m); return m; };

const SIGN = new Map<number, THREE.MeshStandardMaterial>();
const NAMES = ["Bakery", "Books & Co", "Deli", "Pharmacy", "Coffee", "Hardware", "Florist", "Barber", "Pizza", "Records", "Tailor", "Market"];
const SIGNC: [string, string][] = [["#1c1c20", "#e8d8a8"], ["#f0ebe0", "#1c2a3a"], ["#2a3a2e", "#f0e6c8"], ["#5a1e1e", "#f4e8d0"], ["#1e2a4a", "#e8e0c8"]];
/** a painted shop sign board with a premium display face */
export const shopSign = (k: number) => { let m = SIGN.get(k % 60); if (m) return m; const c = document.createElement("canvas"); c.width = 512; c.height = 112; const [bg, fg] = SIGNC[k % 5];
  drawBoard(c.getContext("2d")!, 512, 112, NAMES[k % NAMES.length], bg, fg); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, metalness: 0.1, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.18 }); SIGN.set(k % 60, m); return m; };

// ---------------- buildings ----------------
export const BRICKS: AcgName[] = ["Bricks005", "Bricks006", "Bricks010", "Bricks012", "Bricks017", "Bricks019", "Bricks022", "Concrete007", "Plaster004"];
export type BuildingOpts = { x: number; z: number; w: number; h: number; d: number; ry?: number; y0?: number; skin?: AcgName; tint?: THREE.ColorRepresentation; seed: number; near?: boolean; night?: boolean; shop?: boolean };
/** a city building, front = local +z: photo-textured walls at real scale, recessed windows (sky-reflecting glass or a lit room),
 *  frames, sills, lintels, floor ledges, cornice, parapet; near ones add a fire escape, AC units, flower boxes, a water tank, an antenna. */
export const building = (B: Batch, o: BuildingOpts, glow?: Glow) => {
  const put = placer(B, [o.x, o.y0 ?? 0, o.z], o.ry ?? 0), skin = o.skin ?? BRICKS[o.seed % BRICKS.length], brick = skin.startsWith("Bricks");
  const wall = photo(skin, { tint: o.tint, rough: 0.9, normal: 1.6 }), trim = photo("Concrete007", { tint: 0xece4d6, rough: 0.85, normal: 0.8 }), iron = M.paintedMetal(0x26262c);
  const { w, h, d } = o, fz = d / 2, r = (k: number) => rnd(o.seed * 31 + k);
  put(wbox(w, h, d, brick ? 1.2 : 2.5), wall, [0, h / 2, 0]);
  const cols = Math.max(1, Math.floor(w / 2.4)), cw = w / cols, floors = Math.max(1, Math.floor((h - 1.4) / 3.2)), ww = Math.min(1.25, cw * 0.55), wh = 1.75;
  for (let f = o.shop ? 1 : 0; f < floors; f++) { const y0 = 0.4 + f * 3.2;
    if (o.near) put(rbox(w + 0.08, 0.14, 0.16, 0.03, 2), trim, [0, y0 - 0.02, fz + 0.06]);
    for (let c = 0; c < cols; c++) { const cx = -w / 2 + (c + 0.5) * cw, cy = y0 + 1.55, k = f * 13 + c * 7, lit = o.night !== false && r(k) < (o.night ? 0.42 : 0.12);
      put(UNIT_PLANE, lit ? litWindow(o.seed + k) : M.windowGlass(), [cx, cy, fz + 0.004], [ww, wh, 1]);
      if (lit && glow && r(k + 9) < 0.25) glow([...applyPut(o, [cx, cy, fz + 0.3])] as V3, [1, 0.75, 0.45]);
      if (!o.near) continue;
      put(rbox(ww + 0.3, 0.16, 0.18, 0.03), trim, [cx, cy + wh / 2 + 0.07, fz + 0.08]); put(rbox(ww + 0.26, 0.09, 0.24, 0.02), trim, [cx, cy - wh / 2 - 0.05, fz + 0.1]);
      for (const s of [-1, 1]) put(BOX1, trim, [cx + s * (ww / 2 + 0.03), cy, fz + 0.04], [0.06, wh, 0.1]);
      put(BOX1, trim, [cx, cy + 0.15, fz + 0.03], [ww, 0.05, 0.05]); put(BOX1, trim, [cx, cy, fz + 0.03], [0.05, wh, 0.05]);
      if (r(k + 3) < 0.12) { put(rbox(0.7, 0.45, 0.5, 0.03), M.paintedMetal(0xd8d8d0), [cx + 0.2, cy - wh / 2 + 0.3, fz + 0.3]); put(BOX1, iron, [cx + 0.2, cy - wh / 2 + 0.3, fz + 0.56], [0.5, 0.3, 0.02]); }
      else if (r(k + 3) < 0.2) { put(rbox(ww, 0.2, 0.25, 0.02), M.wood("mid"), [cx, cy - wh / 2 + 0.05, fz + 0.25]); for (let q = 0; q < 5; q++) put(ICO, M.leaf([0x3f7a34, 0xc83a3a, 0xe8b84a, 0x4a8a3a, 0xe86aa0][q]), [cx - ww / 2 + 0.12 + q * (ww - 0.24) / 4, cy - wh / 2 + 0.24, fz + 0.27], [0.1, 0.1, 0.1]); } } }
  if (o.shop) { // a storefront: lit display window with goods, a door, a fabric awning, a sign board, a step
    const sw = Math.min(w - 1.6, 5.5), awn = [0x8a1a1a, 0x1e5a3a, 0x1e3a7a, 0x9a5a1a, 0x5a2a6a][o.seed % 5];
    put(UNIT_PLANE, shopWindow(o.seed), [-0.5, 1.45, fz + 0.01], [sw, 2.2, 1]); put(rbox(sw + 0.2, 0.12, 0.3, 0.03), trim, [-0.5, 0.3, fz + 0.1]);
    for (const s of [-1, 1]) put(rbox(0.12, 2.6, 0.16, 0.02), iron, [-0.5 + s * (sw / 2 + 0.05), 1.5, fz + 0.06]); put(rbox(sw + 0.3, 0.14, 0.16, 0.02), iron, [-0.5, 2.62, fz + 0.06]);
    const dx = -0.5 + sw / 2 + 0.75; if (dx + 0.5 < w / 2) { put(rbox(1.0, 2.3, 0.08, 0.02), M.wood("dark"), [dx, 1.15, fz + 0.03]); put(UNIT_PLANE, litWindow(o.seed + 3), [dx, 1.6, fz + 0.075], [0.6, 0.9, 1]); put(SPH16, M.gold(), [dx + 0.38, 1.1, fz + 0.1], [0.04, 0.04, 0.04]); }
    put(rbox(sw + 0.4, 0.05, 1.5, 0.02), M.fabric(awn), [-0.5, 3.0, fz + 0.72], [1, 1, 1], [0.32, 0, 0]); put(rbox(sw + 0.4, 0.28, 0.04, 0.01), M.fabric(awn), [-0.5, 2.68, fz + 1.42]);
    put(rbox(sw * 0.7 + 0.1, 0.65, 0.08, 0.02), M.paintedMetal(0x1a1a1e), [-0.5, 3.55, fz + 0.05]); put(UNIT_PLANE, shopSign(o.seed), [-0.5, 3.55, fz + 0.095], [sw * 0.7, 0.55, 1]);
    glow?.([...applyPut(o, [-0.5, 1.6, fz + 0.6])] as V3, [1, 0.8, 0.5]); }
  put(rbox(w + 0.5, 0.45, d + 0.5, 0.05, 2), trim, [0, h + 0.2, 0]); put(wbox(w + 0.2, 0.6, 0.25, 1.2), wall, [0, h + 0.7, fz - 0.05]);
  if (!o.near) return;
  if (r(91) < 0.55) { const tx = (r(92) - 0.5) * (w - 3), tz = -d / 4; for (const [a, b] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) put(CYL16, iron, [tx + a, h + 1.2, tz + b], [0.06, 2.0, 0.06]); put(wcyl(1.3, 1.3, 2.2, 20, 1), M.wood("mid", 0xb09080), [tx, h + 3.2, tz]); for (let q = 0; q < 3; q++) put(CYL16, iron, [tx, h + 2.4 + q * 0.75, tz], [1.33, 0.05, 1.33]); put(new THREE.ConeGeometry(1.4, 0.8, 20), iron, [tx, h + 4.7, tz]); }
  if (r(93) < 0.5) { const ax = (r(94) - 0.5) * (w - 1); put(CYL16, iron, [ax, h + 3, -0.5], [0.04, 5, 0.04]); for (let q = 0; q < 3; q++) put(BOX1, iron, [ax, h + 3.6 + q * 0.5, -0.5], [1.1 - q * 0.25, 0.03, 0.03]); glow?.([...applyPut(o, [ax, h + 5.5, -0.5])] as V3, [1, 0.2, 0.15]); }
  for (let q = 0; q < 2; q++) put(rbox(1.0, 0.8, 0.8, 0.05), M.paintedMetal(0xc8c8c4), [(r(95 + q) - 0.5) * (w - 2), h + 0.9, -d / 4 + q]);
  if (r(97) < 0.45 && floors > 2) { const fx = (r(98) - 0.5) * (w - cw * 1.5);
    for (let f = 1; f < floors; f++) { const y = 0.4 + f * 3.2; put(BOX1, iron, [fx, y, fz + 0.65], [2.4, 0.06, 1.2]); put(BOX1, iron, [fx, y + 0.95, fz + 1.22], [2.4, 0.05, 0.05]); for (let q = 0; q < 9; q++) put(BOX1, iron, [fx - 1.2 + q * 0.3, y + 0.48, fz + 1.22], [0.025, 0.95, 0.025]); put(BOX1, iron, [fx, y + 1.6, fz + 0.65], [0.08, 3.4, 0.08], [0.95, 0, 0]); } }
};
const applyPut = (o: { x: number; z: number; ry?: number; y0?: number }, p: V3) => { const c = Math.cos(o.ry ?? 0), s = Math.sin(o.ry ?? 0); return [o.x + p[0] * c + p[2] * s, (o.y0 ?? 0) + p[1], o.z - p[0] * s + p[2] * c]; };

// ---------------- street furniture ----------------
/** a cast-iron street lamp with a warm bulb */
export const streetLamp = (B: Batch, p: V3, ry = 0, glow?: Glow) => { const put = placer(B, p, ry), iron = M.paintedMetal(0x1e2226);
  put(wcyl(0.16, 0.2, 0.5, 12), iron, [0, 0.25, 0]); put(wcyl(0.06, 0.08, 4.4, 10), iron, [0, 2.6, 0]); put(CYL16, iron, [0, 4.85, 0], [0.09, 0.15, 0.09]);
  put(BOX1, iron, [0, 4.9, 0.55], [0.06, 0.06, 1.1]); put(new THREE.ConeGeometry(0.32, 0.3, 14, 1, true), iron, [0, 4.9, 1.1]); put(SPH16, M.emissive(0xffd8a0, 2.4), [0, 4.78, 1.1], [0.13, 0.1, 0.13]);
  glow?.([...applyPut({ x: p[0], z: p[2], ry, y0: p[1] }, [0, 4.75, 1.1])] as V3, [1, 0.85, 0.55]); };
/** a wooden utility pole with a crossarm, insulators and a transformer can */
export const utilityPole = (B: Batch, p: V3, ry = 0) => { const put = placer(B, p, ry), wood = M.wood("dark", 0x9a8a7a), iron = M.paintedMetal(0x6a6a70);
  put(wcyl(0.12, 0.15, 9, 10, 1), wood, [0, 4.5, 0]); put(rbox(2.2, 0.12, 0.12, 0.02), wood, [0, 8.4, 0]); for (const s of [-1, -0.35, 0.35, 1]) put(CYL16, M.plastic(0xe8e4d8), [s * 1.0, 8.55, 0], [0.04, 0.16, 0.04]);
  put(wcyl(0.3, 0.3, 0.8, 16), iron, [0.42, 7.2, 0]); put(BOX1, iron, [0.2, 7.2, 0], [0.3, 0.06, 0.06]); };
/** sagging wires between two pole tops (crossarm insulator offsets) */
export const wires = (B: Batch, a: V3, b: V3, n = 3, sag = 0.6) => { const m = M.rubber();
  for (let q = 0; q < n; q++) { const off = (q - (n - 1) / 2) * 0.65; const A: V3 = [a[0] + off, a[1], a[2]], Bp: V3 = [b[0] + off, b[1], b[2]];
    for (let k = 0; k < 12; k++) { const t0 = k / 12, t1 = (k + 1) / 12, P = (t: number): V3 => [A[0] + (Bp[0] - A[0]) * t, A[1] + (Bp[1] - A[1]) * t - Math.sin(Math.PI * t) * sag, A[2] + (Bp[2] - A[2]) * t]; B.beam(m, P(t0), P(t1), 0.018); } } };
export const bench = (B: Batch, p: V3, ry = 0) => { const put = placer(B, p, ry), iron = M.paintedMetal(0x22282a), wood = M.wood("mid");
  for (const s of [-0.75, 0.75]) { put(rbox(0.06, 0.45, 0.5, 0.01), iron, [s, 0.22, 0]); put(rbox(0.06, 0.5, 0.06, 0.01), iron, [s, 0.7, -0.24], [1, 1, 1], [-0.2, 0, 0]); }
  for (let k = 0; k < 3; k++) put(rbox(1.7, 0.04, 0.13, 0.015), wood, [0, 0.46, -0.16 + k * 0.15]); for (let k = 0; k < 2; k++) put(rbox(1.7, 0.12, 0.035, 0.012), wood, [0, 0.66 + k * 0.17, -0.27 - k * 0.035], [1, 1, 1], [-0.2, 0, 0]); };
export const trashBin = (B: Batch, p: V3, tint = 0x2e4a3a) => { const put = placer(B, p); put(wcyl(0.27, 0.24, 0.9, 18, 0.5), M.paintedMetal(tint), [0, 0.45, 0]); put(CYL16, M.paintedMetal(0x202020), [0, 0.92, 0], [0.29, 0.05, 0.29]); put(CYL16, M.paintedMetal(0x202020), [0, 0.3, 0], [0.275, 0.03, 0.275]); };
export const hydrant = (B: Batch, p: V3) => { const put = placer(B, p), red = M.paintedMetal(0xb02420); put(CYL16, red, [0, 0.05, 0], [0.16, 0.1, 0.16]); put(wcyl(0.11, 0.12, 0.55, 14), red, [0, 0.37, 0]); put(SPH16, red, [0, 0.66, 0], [0.12, 0.09, 0.12]); for (const s of [-1, 1]) put(CYL16, red, [s * 0.14, 0.45, 0], [0.05, 0.1, 0.05], [0, 0, Math.PI / 2]); put(CYL16, M.steel(), [0, 0.78, 0], [0.03, 0.06, 0.03]); };
export const bollard = (B: Batch, p: V3) => { const put = placer(B, p); put(wcyl(0.09, 0.1, 0.9, 12), M.paintedMetal(0x2a2a2e), [0, 0.45, 0]); put(CYL16, M.paintedMetal(0xd8b040), [0, 0.75, 0], [0.101, 0.06, 0.101]); };
export const newsBox = (B: Batch, p: V3, ry = 0, tint = 0x2a4ab0) => { const put = placer(B, p, ry); put(rbox(0.5, 0.95, 0.45, 0.03), M.paintedMetal(tint), [0, 0.6, 0]); put(BOX1, M.clearGlass(), [0, 0.75, 0.226], [0.38, 0.35, 0.01]); for (const s of [-1, 1]) put(BOX1, M.paintedMetal(0x202020), [s * 0.2, 0.06, 0], [0.04, 0.12, 0.4]); };
export const streetSign = (B: Batch, p: V3, ry = 0, color = 0x1e6a3a) => { const put = placer(B, p, ry); put(wcyl(0.035, 0.035, 3.2, 8), M.steel(0x9aa0a8), [0, 1.6, 0]); put(rbox(0.9, 0.22, 0.02, 0.01), M.paintedMetal(color), [0.3, 3.0, 0]); put(rbox(0.6, 0.6, 0.02, 0.01), M.paintedMetal(0xc02020), [0, 2.3, 0.03], [1, 1, 1], [0, 0, Math.PI / 4]); };
/** a deciduous tree: bark trunk, branches, clustered leaf masses (varied greens), a grated pit */
export const tree = (B: Batch, p: V3, s = 1, seed = 1) => { const put = placer(B, p, rnd(seed) * 6), r = (k: number) => rnd(seed * 17 + k), bark = M.bark();
  put(wcyl(0.12 * s, 0.2 * s, 3.2 * s, 10, 0.8), bark, [0, 1.6 * s, 0]);
  for (let k = 0; k < 4; k++) { const a = k * 1.7 + r(k), L = (1.1 + r(k + 5)) * s; B.beam(bark, [p[0], p[1] + 2.6 * s, p[2]], [p[0] + Math.cos(a) * L, p[1] + (3.6 + r(k + 9)) * s, p[2] + Math.sin(a) * L], 0.09 * s); }
  // canopy: many small leaf clumps (photo leaf texture, varied greens) filling an irregular crown, denser at the core
  const greens = [0x6a8a4a, 0x7a9a52, 0x5a7a40, 0x8aa45a, 0x4f6e38];
  for (let k = 0; k < 46; k++) { const a = r(k + 20) * 6.28, u = Math.sqrt(r(k + 21)), rr = u * 1.6 * s, y = (3.3 + r(k + 22) * 2.3 - u * 0.6) * s, sz = (0.32 + r(k + 23) * 0.3) * s * (1.2 - u * 0.4);
    put(ICO, photo("Grass001", { tint: greens[k % 5], rough: 0.85, normal: 1.6 }), [Math.cos(a) * rr, y, Math.sin(a) * rr], [sz, sz * 0.85, sz], [r(k) * 3, r(k + 1) * 3, 0]); }
  put(BOX1, M.paintedMetal(0x2a2a2a), [0, 0.02, 0], [1.2, 0.04, 1.2]); put(BOX1, M.ground(), [0, 0.035, 0], [1.0, 0.02, 1.0]); };
/** a parked sedan: clear-coat body, glass cabin, tyres with alloy rims, lights, mirrors, plates */
export const car = (B: Batch, p: V3, ry = 0, tint = 0x8a1a1a, glow?: Glow, lightsOn = false) => { const put = placer(B, p, ry), paint = M.carPaint(tint), glass = M.windowGlass(), tyre = M.rubber(), rim = M.steel(0xc8ccd4), dark = M.plastic(0x1a1a1c);
  put(rbox(1.8, 0.62, 4.3, 0.18), paint, [0, 0.62, 0]); put(rbox(1.62, 0.55, 2.2, 0.22), paint, [0, 1.15, -0.2]); put(rbox(1.58, 0.46, 2.0, 0.18), glass, [0, 1.17, -0.2]);
  put(rbox(1.66, 0.14, 0.12, 0.04), dark, [0, 0.42, 2.15]); put(rbox(1.66, 0.14, 0.12, 0.04), dark, [0, 0.42, -2.15]); put(BOX1, M.plastic(0xf4f1ea), [0, 0.5, 2.21], [0.36, 0.11, 0.01]);
  for (const s of [-1, 1]) { put(rbox(0.36, 0.13, 0.05, 0.02), M.emissive(lightsOn ? 0xfff4d0 : 0x666660, lightsOn ? 2 : 0.2), [s * 0.62, 0.72, 2.16]); put(rbox(0.34, 0.12, 0.05, 0.02), M.emissive(0xc01818, lightsOn ? 1.8 : 0.5), [s * 0.64, 0.74, -2.16]); put(rbox(0.06, 0.1, 0.18, 0.02), paint, [s * 0.93, 1.02, 0.75]); }
  for (const [x, z] of [[-0.82, 1.35], [0.82, 1.35], [-0.82, -1.35], [0.82, -1.35]]) { put(CYL16, tyre, [x, 0.34, z], [0.34, 0.24, 0.34], [0, 0, Math.PI / 2]); put(CYL16, rim, [x + Math.sign(x) * 0.11, 0.34, z], [0.22, 0.04, 0.22], [0, 0, Math.PI / 2]); }
  if (lightsOn && glow) for (const s of [-1, 1]) glow([...applyPut({ x: p[0], z: p[2], ry, y0: p[1] }, [s * 0.62, 0.72, 2.3])] as V3, [1, 0.95, 0.8]); };

// ---------------- the street ----------------
export type StreetOpts = { x: number; z: number; len: number; width?: number; night?: boolean; seed?: number; buildings?: boolean; tall?: number };
/** a complete street along x centred at (x, z): asphalt with markings, cracks and manholes, curbs, paved sidewalks; lamps, poles + wires,
 *  trees, benches, bins, hydrants, news boxes, signs, parked cars; rows of near buildings each side and a far skyline behind. */
export const street = (B: Batch, o: StreetOpts, glow?: Glow) => {
  const W = o.width ?? 12, L = o.len, sd = o.seed ?? 1, r = (k: number) => rnd(sd * 13 + k), sw = 4.5, zN = o.z - W / 2, zS = o.z + W / 2;
  B.add(wbox(L, 0.02, W, 3), M.asphalt(), [o.x, 0.0, o.z]);
  for (let x = -L / 2 + 1; x < L / 2 - 1; x += 6) B.add(BOX1, M.emissive(0xd8d0a0, 0.15), [o.x + x, 0.012, o.z], [0, 0, 0], [3, 0.004, 0.14]);
  for (let k = 0; k < L / 14; k++) B.add(CYL16, M.steel(0x5a5a5e), [o.x - L / 2 + 7 + k * 14 + r(k) * 3, 0.012, o.z + (r(k + 1) - 0.5) * W * 0.6], [0, 0, 0], [0.35, 0.01, 0.35]);
  for (const [zc, f] of [[zN - sw / 2, 1], [zS + sw / 2, -1]] as const) {
    B.add(wbox(L, 0.16, sw, 1.5), M.paving(), [o.x, 0.08, zc]); B.add(rbox(L, 0.18, 0.25, 0.04, 2), M.concrete(0xc8c4bc), [o.x, 0.09, zc + f * (sw / 2)]);
    const kerb = zc + f * (sw / 2 - 0.5), back = zc - f * (sw / 2 - 0.6);
    for (let x = -L / 2 + 4, k = 0; x < L / 2 - 2; x += 9, k++) {
      streetLamp(B, [o.x + x, 0.16, kerb], f > 0 ? 0 : Math.PI, glow);
      if (k % 2 === 0) tree(B, [o.x + x + 4.5, 0.16, kerb - f * 0.3], 0.9 + r(k) * 0.3, sd + k * 7 + (f > 0 ? 0 : 50));
      else { bench(B, [o.x + x + 4.5, 0.16, back + f * 0.4], f > 0 ? 0 : Math.PI); trashBin(B, [o.x + x + 6, 0.16, kerb - f * 0.2]); }
      if (k % 3 === 1) hydrant(B, [o.x + x + 2, 0.16, kerb]); if (k % 4 === 2) newsBox(B, [o.x + x + 1.6, 0.16, back + f * 0.3], f > 0 ? 0 : Math.PI, [0x2a4ab0, 0xc02020, 0xe8b84a][k % 3]);
      if (k % 4 === 0) streetSign(B, [o.x + x - 1.5, 0.16, kerb], f > 0 ? 0 : Math.PI, [0x1e6a3a, 0x1e3a8a][k % 2]);
      if (k % 2 === 1) bollard(B, [o.x + x - 2.5, 0.16, kerb]);
      if (r(k + 40 + f) < 0.7) car(B, [o.x + x + 2.5 + r(k + 3) * 2, 0, kerb + f * 1.6], (f > 0 ? 0 : Math.PI) + Math.PI / 2, [0x8a1a1a, 0x1a3a6a, 0xd8d8d4, 0x1a1a1a, 0x5a6a5a, 0xc8a050][(k + (f > 0 ? 0 : 3)) % 6], glow, o.night && r(k + 70) < 0.3); }
    for (let x = -L / 2 + 6, k = 0; x < L / 2; x += 18, k++) utilityPole(B, [o.x + x, 0.16, back + f * 0.2], 0);
    for (let x = -L / 2 + 6; x < L / 2 - 18; x += 18) wires(B, [o.x + x, 8.55, back + f * 0.2], [o.x + x + 18, 8.55, back + f * 0.2], 4, 0.7);
    if (o.buildings !== false) { let x = -L / 2; for (let k = 0; x < L / 2; k++) { const w = 7 + r(k + 90 + f) * 6, h = (Math.round((10 + r(k + 91 + f) * (o.tall ?? 16)) / 3.2) * 3.2) + 1.6;
      building(B, { x: o.x + x + w / 2, z: zc - f * (sw / 2 + 4.5), w: w - 0.1, h, d: 9, ry: f > 0 ? 0 : Math.PI, seed: sd * 100 + k + (f > 0 ? 0 : 500), near: true, night: o.night, shop: true }, glow); x += w; } }
  }
  // far skyline layers behind both rows
  for (const f of [1, -1]) for (let k = 0; k < L / 10; k++) { const w = 9 + r(k + 300) * 6, h = 30 + r(k + 301) * 50;
    building(B, { x: o.x - L / 2 + k * 10 + r(k) * 3, z: o.z - f * (W / 2 + sw + 22 + r(k + 302) * 14), w, h, d: 10, ry: f > 0 ? 0 : Math.PI, seed: sd * 300 + k + (f > 0 ? 0 : 77), night: o.night }); }
};
