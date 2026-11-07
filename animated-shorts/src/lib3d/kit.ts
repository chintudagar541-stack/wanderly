// Set-building kit for the reference look: soft-lit standard materials, a placement helper with a local frame,
// and a library of modelled props (furniture, windows, doors, houses, trees...). Everything static goes into a
// Batch (merged per material); moving things are separate meshes.
import * as THREE from "three";
import { Batch, V3, rnd, BOX, CYL, CONE, SPH, CYL8, DOME, PRISM } from "../videos/eiffel/lib";

export { Batch, rnd, BOX, CYL, CONE, SPH, CYL8, DOME, PRISM };
export type { V3 };

const MATS = new Map<string, THREE.MeshStandardMaterial>();
/** cached soft standard material; `map` makes a unique one */
export const M = (color: THREE.ColorRepresentation, map?: THREE.Texture, o: { rough?: number; metal?: number; side?: THREE.Side; emissive?: THREE.ColorRepresentation; ei?: number; alphaTest?: number; transparent?: boolean } = {}) => {
  const key = map ? "" : `${String(color)}|${o.rough ?? 0.85}|${o.metal ?? 0}|${o.side ?? 0}|${o.emissive ?? ""}|${o.ei ?? 0}`;
  if (key && MATS.has(key)) return MATS.get(key)!;
  const m = new THREE.MeshStandardMaterial({ color, map: map ?? null, roughness: o.rough ?? 0.85, metalness: o.metal ?? 0, side: o.side ?? THREE.FrontSide,
    emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1, alphaTest: o.alphaTest ?? 0, transparent: o.transparent ?? false });
  if (key) MATS.set(key, m);
  return m;
};
/** a texture copy with repeat set for a w x h surface (tile size tw x th metres) */
export const rep = (t: THREE.Texture, w: number, h: number, tw = 1, th = 1) => { const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(w / tw, h / th); c.needsUpdate = true; return c; };

/** placement helper: a Batch plus a local frame (origin + yaw). p/s/r are in the local frame. */
export class Kit {
  stack: THREE.Matrix4[] = [new THREE.Matrix4()];
  constructor(public B: Batch, public root: THREE.Object3D) {}
  get T() { return this.stack[this.stack.length - 1]; }
  push(p: V3, ry = 0, s = 1) { this.stack.push(this.T.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(s, s, s)))); return this; }
  pop() { this.stack.pop(); return this; }
  at(p: V3, ry: number, f: () => void, s = 1) { this.push(p, ry, s); f(); this.pop(); }
  add(g: THREE.BufferGeometry, m: THREE.Material, p: V3, s: V3 = [1, 1, 1], r: V3 = [0, 0, 0]) {
    this.B.addM(g, m, this.T.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s))));
  }
  box(m: THREE.Material, p: V3, s: V3, r: V3 = [0, 0, 0]) { this.add(BOX, m, p, s, r); }
  cyl(m: THREE.Material, p: V3, rad: number, h: number, r: V3 = [0, 0, 0], g = CYL) { this.add(g, m, p, [rad, h, rad], r); }
  /** a beam between two local points */
  beam(m: THREE.Material, a: V3, b: V3, th: number) {
    const v = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = v.length(); if (len < 1e-4) return;
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
    this.B.addM(BOX, m, this.T.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(th, len, th))));
  }
  /** a separate (non-batched) mesh in the local frame, e.g. a textured panel */
  mesh(g: THREE.BufferGeometry, m: THREE.Material, p: V3, r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]) {
    const o = new THREE.Mesh(g, m); o.matrixAutoUpdate = false;
    o.matrix.copy(this.T.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s))));
    o.castShadow = o.receiveShadow = true; this.root.add(o); return o;
  }
  /** a vertical textured panel facing local +z */
  panel(m: THREE.Material, p: V3, w: number, h: number, ry = 0) { return this.mesh(new THREE.PlaneGeometry(w, h), m, p, [0, ry, 0]); }
  /** a floor/ground panel */
  floor(m: THREE.Material, p: V3, w: number, d: number) { return this.mesh(new THREE.PlaneGeometry(w, d), m, p, [-Math.PI / 2, 0, 0]); }
}

// ---------------- props (local frame: y up, +z = front) ----------------
export type Pal = { wood: THREE.Material; woodD: THREE.Material; metal: THREE.Material; white: THREE.Material; dark: THREE.Material };
export const defaultPal = (): Pal => ({ wood: M(0xa8703a), woodD: M(0x6a4024), metal: M(0x8a9098, undefined, { rough: 0.4, metal: 0.6 }), white: M(0xf2efe8), dark: M(0x2a2a30) });

/** office/writing desk with drawers, w wide, d deep */
export const desk = (k: Kit, P: Pal, w = 1.6, d = 0.8, h = 0.76, top?: THREE.Material) => {
  k.box(top ?? P.wood, [0, h - 0.025, 0], [w, 0.05, d]);
  k.box(P.woodD, [-w / 2 + 0.25, (h - 0.05) / 2, 0], [0.46, h - 0.05, d - 0.06]);
  for (let i = 0; i < 3; i++) { k.box(P.wood, [-w / 2 + 0.25, 0.14 + i * 0.22, d / 2 - 0.02], [0.42, 0.19, 0.02]); k.box(P.metal, [-w / 2 + 0.25, 0.17 + i * 0.22, d / 2], [0.12, 0.02, 0.02]); }
  for (const s of [-1, 1]) if (s > 0) k.box(P.woodD, [w / 2 - 0.04, (h - 0.05) / 2, 0], [0.05, h - 0.05, d - 0.06]);
  k.box(P.woodD, [0.2, h - 0.2, -d / 2 + 0.03], [w - 0.6, 0.3, 0.02]);
};
/** wooden chair with a slatted back */
export const chair = (k: Kit, P: Pal, seat?: THREE.Material) => {
  k.box(seat ?? P.wood, [0, 0.46, 0], [0.46, 0.05, 0.44]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(P.woodD, [sx * 0.2, 0.22, sz * 0.19], [0.04, 0.46, 0.04]);
  for (const sx of [-1, 1]) k.box(P.woodD, [sx * 0.2, 0.74, -0.2], [0.04, 0.56, 0.04]);
  for (let i = 0; i < 3; i++) k.box(P.wood, [0, 0.62 + i * 0.13, -0.2], [0.38, 0.06, 0.02]);
};
/** bookshelf with rows of books (books coloured from a seeded palette) */
export const bookshelf = (k: Kit, P: Pal, w = 1.2, h = 1.9, d = 0.32, seed = 1) => {
  const cols = [0xb8402a, 0x2a5a8a, 0x2e7a4a, 0xd9a040, 0x6a3a7a, 0xe8dcc0, 0x8a2a2a, 0x3a4a5a];
  k.box(P.woodD, [0, h / 2, -d / 2 + 0.01], [w, h, 0.02]);
  for (const s of [-1, 1]) k.box(P.wood, [s * (w / 2 - 0.02), h / 2, 0], [0.04, h, d]);
  const n = Math.round(h / 0.38);
  for (let i = 0; i <= n; i++) k.box(P.wood, [0, i * (h / n) + 0.01, 0], [w, 0.03, d]);
  for (let i = 0; i < n; i++) { let x = -w / 2 + 0.06; let j = 0;
    while (x < w / 2 - 0.12) { const bw = 0.03 + rnd(seed * 97 + i * 13 + j) * 0.04, bh = (h / n) * (0.6 + rnd(seed + i * 7 + j * 3) * 0.3), lean = rnd(seed + j * 5 + i) < 0.06 ? 0.25 : 0;
      if (rnd(seed * 3 + i + j * 11) < 0.08) { x += 0.08; j++; continue; }
      k.box(M(cols[Math.floor(rnd(seed * 31 + i * 17 + j) * cols.length)]), [x + bw / 2, i * (h / n) + 0.03 + bh / 2, 0.01], [bw, bh, d * 0.75], [0, 0, lean]); x += bw + 0.004; j++; } }
};
/** filing cabinet (4 drawers) */
export const cabinet = (k: Kit, P: Pal, col: THREE.Material) => {
  k.box(col, [0, 0.66, 0], [0.48, 1.32, 0.6]);
  for (let i = 0; i < 4; i++) { k.box(col, [0, 0.17 + i * 0.32, 0.305], [0.42, 0.28, 0.02]); k.box(P.metal, [0, 0.25 + i * 0.32, 0.32], [0.14, 0.025, 0.02]); k.box(P.white, [0, 0.13 + i * 0.32, 0.315], [0.12, 0.05, 0.005]); }
};
/** potted plant: terracotta pot with a clump of leaves */
export const plant = (k: Kit, s = 1, leafCol = 0x3f8a3a, potCol = 0xb5532c, seed = 1) => {
  k.cyl(M(potCol), [0, 0.18 * s, 0], 0.17 * s, 0.36 * s); k.cyl(M(potCol), [0, 0.37 * s, 0], 0.19 * s, 0.05 * s);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + seed, t = 0.4 + rnd(seed + i) * 0.5;
    k.add(SPH, M(i % 3 ? leafCol : 0x5aa040), [Math.cos(a) * 0.12 * s, (0.5 + t * 0.35) * s, Math.sin(a) * 0.12 * s], [0.08 * s, 0.26 * s, 0.035 * s], [Math.sin(a) * 0.5, -a, Math.cos(a) * 0.5]); }
};
/** wall clock (face texture painted at time h:m) */
const clockFaces = new Map<string, THREE.CanvasTexture>();
export const clockFace = (h = 9, m = 0, rim = "#c0262a") => {
  const key = `${h}:${m}:${rim}`; if (clockFaces.has(key)) return clockFaces.get(key)!;
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!;
  g.fillStyle = rim; g.beginPath(); g.arc(128, 128, 126, 0, Math.PI * 2); g.fill(); g.fillStyle = "#fbfaf6"; g.beginPath(); g.arc(128, 128, 108, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#1a1a1a"; g.font = "bold 22px Arial"; g.textAlign = "center"; g.textBaseline = "middle";
  for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; g.fillText(String(i), 128 + Math.cos(a) * 84, 128 + Math.sin(a) * 84); }
  for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2; g.fillRect(128 + Math.cos(a) * 100 - 1, 128 + Math.sin(a) * 100 - 1, i % 5 ? 2 : 4, i % 5 ? 2 : 4); }
  const hand = (a: number, l: number, w: number, col = "#1a1a1a") => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a - Math.PI / 2) * l, 128 + Math.sin(a - Math.PI / 2) * l); g.stroke(); };
  hand(((h % 12) + m / 60) / 12 * Math.PI * 2, 52, 7); hand((m / 60) * Math.PI * 2, 78, 5); hand(((m + 12) / 60) * Math.PI * 2, 86, 2, "#c0262a");
  g.fillStyle = "#1a1a1a"; g.beginPath(); g.arc(128, 128, 7, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; clockFaces.set(key, t); return t;
};
export const wallClock = (k: Kit, r = 0.3, h = 9, m = 0) => {
  k.cyl(M(0xc0262a), [0, 0, 0.02], r, 0.05, [Math.PI / 2, 0, 0]);
  k.mesh(new THREE.CircleGeometry(r * 0.98, 48), M(0xffffff, clockFace(h, m)), [0, 0, 0.047]);
};
/** framed picture with any texture */
export const picture = (k: Kit, tex: THREE.Texture, w: number, h: number, frame = 0x6a4024) => {
  k.box(M(frame), [0, 0, 0.02], [w + 0.08, h + 0.08, 0.04]); k.mesh(new THREE.PlaneGeometry(w, h), M(0xffffff, tex), [0, 0, 0.042]);
};
/** a window in a wall plane at local z=0 (the wall must have a hole or be built around it): frame, mullions, sill,
 *  optional glass and curtains */
export const windowFrame = (k: Kit, w: number, h: number, frameM: THREE.Material, opts: { glass?: boolean; curtains?: THREE.Material; cols?: number; rows?: number } = {}) => {
  const f = 0.07, d = 0.16;
  for (const s of [-1, 1]) k.box(frameM, [s * (w / 2 + f / 2), 0, 0], [f, h + 2 * f, d]);
  k.box(frameM, [0, h / 2 + f / 2, 0], [w + 2 * f, f, d]); k.box(frameM, [0, -h / 2 - f / 2, 0.04], [w + 2 * f + 0.12, f, d + 0.1]);
  const cols = opts.cols ?? 2, rows = opts.rows ?? 2;
  for (let i = 1; i < cols; i++) k.box(frameM, [-w / 2 + (i * w) / cols, 0, 0], [0.035, h, 0.05]);
  for (let i = 1; i < rows; i++) k.box(frameM, [0, -h / 2 + (i * h) / rows, 0], [w, 0.035, 0.05]);
  if (opts.glass) k.mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: 0xbfe0f0, transparent: true, opacity: 0.18, roughness: 0.1, depthWrite: false }), [0, 0, 0]);
  if (opts.curtains) for (const s of [-1, 1]) { for (let i = 0; i < 5; i++) k.add(CYL8, opts.curtains, [s * (w / 2 + 0.05 - i * 0.07), 0.02, 0.14], [0.05, h + 0.25, 0.05]);
    k.box(opts.curtains, [s * (w / 2 - 0.08), -0.05, 0.16], [0.1, 0.06, 0.06]); }
  if (opts.curtains) k.cyl(frameM, [0, h / 2 + 0.2, 0.16], 0.02, w + 0.7, [0, 0, Math.PI / 2]);
};
/** panelled door (closed), w x h, bottom at y=0 */
export const door = (k: Kit, w: number, h: number, m: THREE.Material, frameM: THREE.Material, knob?: THREE.Material) => {
  k.box(m, [0, h / 2, 0], [w, h, 0.05]);
  for (const [px, py, pw, ph] of [[-w / 4, h * 0.72, w * 0.36, h * 0.36], [w / 4, h * 0.72, w * 0.36, h * 0.36], [-w / 4, h * 0.27, w * 0.36, h * 0.4], [w / 4, h * 0.27, w * 0.36, h * 0.4]] as const) k.box(frameM, [px, py, 0.03], [pw, ph, 0.02]);
  for (const s of [-1, 1]) k.box(frameM, [s * (w / 2 + 0.05), h / 2, 0.02], [0.1, h + 0.1, 0.09]); k.box(frameM, [0, h + 0.05, 0.02], [w + 0.2, 0.1, 0.09]);
  k.add(SPH, knob ?? M(0xd9a040, undefined, { rough: 0.3, metal: 0.7 }), [w / 2 - 0.12, h * 0.48, 0.07], [0.04, 0.04, 0.04]);
};
/** stack of papers, a mug, a pen pot, a desk lamp: desk-top clutter at local origin (desk top height) */
export const deskClutter = (k: Kit, P: Pal, seed = 1) => {
  for (let i = 0; i < 6; i++) k.box(P.white, [-0.35 + rnd(seed + i) * 0.04, 0.005 + i * 0.008, rnd(seed + i * 3) * 0.04], [0.3, 0.007, 0.4], [0, (rnd(seed * 7 + i) - 0.5) * 0.3, 0]);
  k.cyl(M(0xe8e2d4), [0.25, 0.06, 0.1], 0.045, 0.12, [0, 0, 0], CYL); k.box(M(0xe8e2d4), [0.3, 0.07, 0.1], [0.03, 0.06, 0.015]);
  k.cyl(M(0x2a5a8a), [0.45, 0.06, -0.15], 0.04, 0.12); for (let i = 0; i < 4; i++) k.cyl(M([0xd1202f, 0x1a1a1a, 0x2a4ab0, 0xe8b84a][i]), [0.44 + (i % 2) * 0.02, 0.15, -0.16 + (i > 1 ? 0.02 : 0)], 0.006, 0.16, [0.1 * (i - 1.5), 0, 0.1]);
  k.cyl(P.dark, [-0.6, 0.015, -0.2], 0.08, 0.03); k.beam(P.dark, [-0.6, 0.03, -0.2], [-0.55, 0.35, -0.22], 0.02); k.beam(P.dark, [-0.55, 0.35, -0.22], [-0.41, 0.4, -0.12], 0.02);
  k.add(CONE, M(0x2e7a4a), [-0.38, 0.36, -0.1], [0.09, 0.12, 0.09], [0.4, 0, -0.6]);
};
/** gabled house with clapboard walls, a porch with posts and railings, steps, windows, door, chimney.
 *  Front faces local +z; footprint w x d; walls up to eave height h. */
export const house = (k: Kit, o: { w: number; d: number; h: number; wall: THREE.Material; trim: THREE.Material; roof: THREE.Material; door: THREE.Material; win: THREE.Material; porch?: boolean; seed?: number }) => {
  const { w, d, h } = o, rh = w * 0.42;
  k.box(o.wall, [0, h / 2 + 0.3, 0], [w, h, d]); k.box(o.trim, [0, 0.15, 0], [w + 0.1, 0.3, d + 0.1]);
  // gable: two sloped roof slabs + the triangle wall
  const sl = Math.hypot(w / 2 + 0.35, rh), ang = Math.atan2(rh, w / 2 + 0.35);
  for (const s of [-1, 1]) k.box(o.roof, [s * (w / 4 + 0.08), h + 0.3 + rh / 2, 0], [sl, 0.14, d + 0.6], [0, 0, -s * ang]);
  k.add(PRISM, o.wall, [0, h + 0.3 + rh / 3, 0], [w / 2 / 0.866 * 0.98, d - 0.02, rh * 0.66 / 0.75], [Math.PI / 2, 0, 0]);
  k.box(o.trim, [0, h + 0.3, d / 2 + 0.02], [w + 0.1, 0.12, 0.06]);
  for (const s of [-1, 1]) k.box(o.trim, [s * (w / 2 - 0.05), h / 2 + 0.3, d / 2 + 0.02], [0.12, h, 0.06]);
  k.box(M(0x8a3a2a), [w * 0.25, h + rh * 0.9, -d * 0.2], [0.45, rh * 0.9, 0.45]); k.box(o.trim, [w * 0.25, h + rh * 1.36, -d * 0.2], [0.55, 0.1, 0.55]);
  // windows (lit) and door on the front
  const fw = h > 3.6 ? 2 : 1;
  for (let f = 0; f < fw; f++) for (const s of [-1, 1]) { k.push([s * w * 0.28, 1.65 + f * 2.6, d / 2 + 0.01], 0); k.panel(o.win, [0, 0, 0], 0.85, 1.15); windowFrame(k, 0.85, 1.15, o.trim, { cols: 2, rows: 2 }); k.pop(); }
  if (fw > 1) { k.push([0, 1.65 + 2.6, d / 2 + 0.01], 0); k.panel(o.win, [0, 0, 0], 0.7, 1.0); windowFrame(k, 0.7, 1.0, o.trim); k.pop(); }
  k.push([0, 0.3, d / 2 + 0.01], 0); door(k, 0.95, 2.05, o.door, o.trim); k.pop();
  if (o.porch !== false) { const pd = 1.8, py = 0.55;
    k.box(o.trim, [0, py - 0.1, d / 2 + pd / 2], [w - 0.4, 0.2, pd]); k.box(M(0x9a8a7a), [0, py / 2 - 0.1, d / 2 + pd / 2], [w - 0.6, py - 0.2, pd - 0.2]);
    for (let i = 0; i < 3; i++) k.box(o.trim, [0, 0.1 + i * 0.16, d / 2 + pd + 0.15 + (2 - i) * 0.28], [1.2, 0.16, 0.3 + (2 - i) * 0.0]);
    for (const s of [-1, 1]) { k.box(o.trim, [s * (w / 2 - 0.35), py + 1.25, d / 2 + pd - 0.1], [0.14, 2.5, 0.14]);
      k.box(o.trim, [s * (w / 4 + 0.55), py + 0.85, d / 2 + pd - 0.1], [w / 2 - 1.4, 0.07, 0.07]); k.box(o.trim, [s * (w / 4 + 0.55), py + 0.1, d / 2 + pd - 0.1], [w / 2 - 1.4, 0.06, 0.06]);
      for (let x = 0.75; x < w / 2 - 0.4; x += 0.16) k.box(o.trim, [s * x, py + 0.47, d / 2 + pd - 0.1], [0.035, 0.75, 0.035]); }
    k.box(o.roof, [0, py + 2.6, d / 2 + pd / 2], [w - 0.2, 0.1, pd + 0.4], [0.18, 0, 0]); }
};
/** stylised pine tree */
export const pine = (k: Kit, h: number, m: THREE.Material, trunk: THREE.Material, snow?: THREE.Material) => {
  k.cyl(trunk, [0, h * 0.12, 0], h * 0.04, h * 0.24, [0, 0, 0], CYL8);
  for (let i = 0; i < 4; i++) { const y = h * (0.25 + i * 0.18), r = h * (0.3 - i * 0.06); k.add(CONE, m, [0, y + r * 0.6, 0], [r, r * 1.3, r]); if (snow) k.add(CONE, snow, [0, y + r * 0.95, 0], [r * 0.55, r * 0.6, r * 0.55]); }
};
/** street lamp post with a lit head (returns the lamp position) */
export const lampPost = (k: Kit, m: THREE.Material, h = 3.6, glow?: THREE.Material): V3 => {
  k.cyl(m, [0, 0.15, 0], 0.12, 0.3, [0, 0, 0], CYL8); k.cyl(m, [0, h / 2, 0], 0.05, h, [0, 0, 0], CYL8);
  k.box(m, [0, h + 0.05, 0], [0.32, 0.06, 0.32]); k.box(glow ?? M(0xffe8a0, undefined, { emissive: 0xffd070, ei: 2 }), [0, h + 0.3, 0], [0.24, 0.42, 0.24]); k.add(CONE, m, [0, h + 0.62, 0], [0.26, 0.24, 0.26]);
  return [0, h + 0.3, 0];
};
/** picket fence from a to b (local) */
export const fence = (k: Kit, m: THREE.Material, a: V3, b: V3, h = 0.9) => {
  const v = new THREE.Vector3(b[0] - a[0], 0, b[2] - a[2]), L = v.length(), n = Math.max(1, Math.round(L / 0.16)), ang = Math.atan2(v.x, v.z);
  for (let i = 0; i <= n; i++) { const t = i / n; k.box(m, [a[0] + (b[0] - a[0]) * t, h / 2, a[2] + (b[2] - a[2]) * t], [0.06, h, 0.025], [0, ang + Math.PI / 2, 0]); k.add(PRISM, m, [a[0] + (b[0] - a[0]) * t, h + 0.04, a[2] + (b[2] - a[2]) * t], [0.045, 0.02, 0.08], [Math.PI / 2, ang, 0]); }
  for (const y of [h * 0.3, h * 0.75]) k.beam(m, [a[0], y, a[2] - 0.03], [b[0], y, b[2] - 0.03], 0.05);
};
