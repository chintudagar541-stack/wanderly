// "Cut the Rope" (Elisha Otis, 1854): a dense 1850s New York world.
//   PALACE (x 0):   the New York Crystal Palace: iron columns, a ribbed glass dome, galleries with railings and the
//                   flags of nations, exhibits (statues, machines, display stands, palms, a fountain), and in the middle
//                   Otis's open demo tower: a platform on guide rails, a hoist rope over a pulley, crates and barrels.
//   STREET (x 400): a Lower Manhattan street: brick and cast-iron shop fronts with signs and awnings, gas lamps,
//                   barrels, crates, handcarts, telegraph poles, and a warehouse with a hoist beam and a barrel
//                   platform on a rope. Trinity Church's spire closes the street.
// Moving parts (both platforms, the ropes, the snapped rope ends, falling barrels) are set per frame in set().
import * as THREE from "three";
import { NOINK } from "../bridge/ink";
import { Flames } from "../diwali/world";
import { Batch, V3, rnd, toon, canvasTex, facadeBox, BOX, CYL, CONE, ICO, SPH, CYL8, DOME, PRISM, HALF } from "../eiffel/lib";

export type LightName = "hall" | "day" | "dusk" | "night";
export const PX = 0, SX = 400;
/** demo tower in the palace: centre and top */
export const TOWER: V3 = [PX, 0, -6];
export const TOWER_TOP = 12.4;
/** warehouse hoist on the street: the rope hangs at HOIST, beam at HOIST_TOP */
export const HOIST: V3 = [SX + 5.2, 0, -20];
export const HOIST_TOP = 15.2;
type Pt = { p: V3; order: number; tint?: V3 };

const tex = canvasTex;
const planks = (rep: [number, number], a = "#b8834a", b = "#a5713c") => tex(256, 256, (g) => {
  g.fillStyle = a; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) { g.fillStyle = (y / 32) % 2 ? b : a; g.fillRect(0, y, 256, 32); g.fillStyle = "rgba(60,30,10,0.45)"; g.fillRect(0, y, 256, 2); const off = ((y / 32) * 97) % 256; g.fillRect(off, y, 2, 32); g.fillRect((off + 128) % 256, y, 2, 32); }
  for (let i = 0; i < 90; i++) { g.fillStyle = "rgba(90,50,20,0.18)"; g.fillRect(rnd(i) * 256, rnd(i + 1) * 256, 14 + rnd(i + 2) * 20, 1.5); }
}, rep);
const cobbles = (rep: [number, number]) => tex(256, 256, (g) => {
  g.fillStyle = "#6a6058"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) for (let x = (y / 16) % 2 ? -10 : 0; x < 256; x += 20) { const c = 120 + Math.floor(rnd(x * 3 + y) * 50); g.fillStyle = `rgb(${c},${c - 8},${c - 20})`; g.beginPath(); g.ellipse(x + 10, y + 8, 9, 6.5, 0, 0, Math.PI * 2); g.fill(); }
}, rep);
const flagsTex = (i: number) => tex(128, 192, (g) => {
  const C = [["#d1202f", "#f4f1ea", "#2a4a9a"], ["#2e7a4a", "#f4f1ea", "#d1202f"], ["#f2c14e", "#1a1a1a", "#d1202f"], ["#2a4a9a", "#f2c14e", "#2a4a9a"], ["#d1202f", "#f4f1ea", "#d1202f"], ["#f4f1ea", "#2a4a9a", "#d1202f"]][i % 6];
  if (i % 2) for (let k = 0; k < 3; k++) { g.fillStyle = C[k]; g.fillRect(0, k * 64, 128, 64); }
  else for (let k = 0; k < 3; k++) { g.fillStyle = C[k]; g.fillRect(k * 43, 0, 43, 192); }
  if (i % 6 === 0) { g.fillStyle = "#2a4a9a"; g.fillRect(0, 0, 60, 70); g.fillStyle = "#fff"; for (let k = 0; k < 9; k++) g.fillRect(8 + (k % 3) * 18, 8 + Math.floor(k / 3) * 20, 6, 6); for (let k = 0; k < 7; k++) { g.fillStyle = k % 2 ? "#fff" : "#d1202f"; g.fillRect(60, k * 10, 68, 10); } }
  for (let x = 0; x < 128; x += 16) { g.fillStyle = "#e8b84a"; g.beginPath(); g.moveTo(x, 192); g.lineTo(x + 8, 180); g.lineTo(x + 16, 192); g.fill(); }
});
const banner = (text: string, bg: string, fg: string, w = 1024, h = 128) => tex(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = "#e8b84a"; g.lineWidth = 8; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = fg; g.font = `900 ${Math.round(h * 0.46)}px Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, h / 2 + 3);
});
const sign = (text: string, bg: string, fg: string) => banner(text, bg, fg, 512, 112);
const glassDome = () => tex(512, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#cfe8f6"); gr.addColorStop(1, "#8fc0e0"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(rnd(i) * 512, rnd(i + 1) * 256, 18, 30); }
  g.strokeStyle = "#e9eef2"; g.lineWidth = 6; for (let x = 0; x <= 512; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  g.lineWidth = 3; for (let y = 0; y <= 256; y += 28) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
}, [2, 1]);
const ironArch = () => tex(256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); g.strokeStyle = "#f2f0ea"; g.lineWidth = 14; g.beginPath(); g.moveTo(12, 256); g.lineTo(12, 120); g.arc(128, 120, 116, Math.PI, 0); g.lineTo(244, 256); g.stroke();
  g.lineWidth = 5; g.strokeStyle = "#3a5a8a"; g.beginPath(); g.arc(128, 120, 100, Math.PI, 0); g.stroke();
  for (let k = 0; k < 9; k++) { const a = Math.PI + (k / 8) * Math.PI; g.beginPath(); g.moveTo(128 + Math.cos(a) * 100, 120 + Math.sin(a) * 100); g.lineTo(128 + Math.cos(a) * 116, 120 + Math.sin(a) * 116); g.stroke(); }
  g.fillStyle = "#c9962e"; g.beginPath(); g.arc(128, 10, 10, 0, Math.PI * 2); g.fill();
});
const brickFront = (base: string, trim: string, win: string, kind: number, seed: number) => tex(128, 160, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 128, 160);
  if (kind !== 1) for (let y = 0; y < 160; y += 6) for (let x = (y / 6) % 2 ? -6 : 0; x < 128; x += 12) { g.fillStyle = `rgba(0,0,0,${0.05 + rnd(seed + x * 7 + y) * 0.07})`; g.fillRect(x + 1, y + 1, 10, 4); }
  g.fillStyle = trim; g.fillRect(0, 0, 128, 8); g.fillRect(0, 150, 128, 10);
  for (const x of [14, 70]) {
    if (kind === 1) { g.fillStyle = trim; g.fillRect(x - 8, 24, 60, 118); }
    g.fillStyle = trim; g.fillRect(x - 4, 26, 52, 108);
    g.fillStyle = win; g.beginPath(); g.moveTo(x, 130); g.lineTo(x, 50); if (kind === 2) g.quadraticCurveTo(x + 22, 26, x + 44, 50); else g.lineTo(x + 44, 50); g.lineTo(x + 44, 130); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x + 4, 56, 6, 40);
    g.strokeStyle = trim; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 22, 40); g.lineTo(x + 22, 130); g.moveTo(x, 90); g.lineTo(x + 44, 90); g.stroke();
    g.fillStyle = trim; g.fillRect(x - 6, 130, 56, 8);
    if (rnd(seed + x) < 0.4) { g.fillStyle = ["#d1202f", "#2e7a4a", "#e8b84a"][Math.floor(rnd(seed + x + 1) * 3)]; g.fillRect(x + 2, 52, 18, 36); }
  }
});
const shopFront = (bg: string, trim: string, seed: number) => tex(256, 160, (g) => {
  g.fillStyle = trim; g.fillRect(0, 0, 256, 160);
  g.fillStyle = "#2a2a34"; g.fillRect(16, 30, 100, 110); g.fillRect(140, 30, 100, 110);
  g.fillStyle = "rgba(255,230,170,0.55)"; g.fillRect(20, 34, 92, 102); g.fillRect(144, 34, 92, 102);
  for (let k = 0; k < 8; k++) { g.fillStyle = ["#d1202f", "#2a4a9a", "#e8b84a", "#2e7a4a", "#8a5a2a"][(k + seed) % 5]; g.fillRect(26 + (k % 4) * 22, 96 + Math.floor(k / 4) * 20, 16, 16); g.fillRect(150 + (k % 4) * 22, 96 + Math.floor(k / 4) * 20, 16, 16); }
  g.strokeStyle = bg; g.lineWidth = 6; g.strokeRect(16, 30, 100, 110); g.strokeRect(140, 30, 100, 110);
  g.fillStyle = bg; g.fillRect(116, 20, 24, 140); g.fillRect(0, 0, 256, 18);
});
const skyTex = (top: string, mid: string, hor: string) => tex(16, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(0.42, mid); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); });
const rayTex = () => tex(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,240,200,0.55)"); gr.addColorStop(1, "rgba(255,240,200,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const h = g.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, "rgba(0,0,0,1)"); h.addColorStop(0.5, "rgba(0,0,0,0)"); h.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = h; g.fillRect(0, 0, 64, 256); });

export class World {
  root = new THREE.Group();
  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sky: THREE.Mesh; skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false });
  skies: Record<LightName, THREE.Texture>;
  fog = new THREE.Fog(0xffffff, 80, 900);
  lamps: Flames; puffs: THREE.Mesh[] = []; puffMat: THREE.MeshToonMaterial;
  warm: THREE.PointLight[] = [];
  rays: THREE.Mesh[] = [];
  // moving parts
  palPlat = new THREE.Group(); palRope: THREE.Mesh; palRopeEnd: THREE.Mesh;
  hoistPlat = new THREE.Group(); hoistRope: THREE.Mesh; hoistEnd: THREE.Mesh; barrels: THREE.Mesh[] = [];
  clouds: THREE.Mesh[] = []; cloudMat: THREE.MeshBasicMaterial;

  constructor() {
    const R = this.root;
    this.skies = { hall: skyTex("#4a86d8", "#9cc8ee", "#eef2f0"), day: skyTex("#3a7ad8", "#8fbce8", "#f0e8d8"), dusk: skyTex("#3a3a7a", "#d88a7a", "#ffc890"), night: skyTex("#0a1030", "#1a2a5a", "#3a3a6a") };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 24, 16), this.skyMat); this.sky.layers.set(NOINK); R.add(this.sky);
    const lamps: Pt[] = [];
    const sets: Batch[] = [];
    const set = () => { const b = new Batch(); sets.push(b); return b; };
    const plane = (w: number, d: number, m: THREE.Material, p: V3, rz = 0) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); q.rotation.set(-Math.PI / 2, 0, rz); q.position.set(...p); q.receiveShadow = true; R.add(q); return q; };
    const vplane = (w: number, h: number, m: THREE.Material, p: V3, ry = 0) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); q.position.set(...p); q.rotation.y = ry; R.add(q); return q; };
    const iron = toon(0x3a5a8a), ironW = toon(0xf2f0ea), gold = toon(0xe8b84a), wood = toon(0x9a6a3a), woodD = toon(0x5a3a22), rope = toon(0xc9a86a), brass = toon(0xd9a040), steel = toon(0x8a929a), marble = toon(0xf1ebe0);
    const leaf = [toon(0x4f8a3a), toon(0x3f7a34), toon(0x6a9a40)];
    const cloths = [toon(0xd1202f), toon(0x2e7a4a), toon(0x2a4a9a), toon(0xe8a020), toon(0x8a2a8a), toon(0xe86a2a)];
    const barrel = (B: Batch, x: number, y: number, z: number, s = 1, lying = false) => { const r: V3 = lying ? [Math.PI / 2, 0, 0] : [0, 0, 0]; B.add(CYL, wood, [x, y + (lying ? 0.35 : 0.45) * s, z], r, [0.35 * s, 0.9 * s, 0.35 * s]); for (const d of [-0.3, 0.3]) { const p: V3 = lying ? [x, y + 0.35 * s, z + d * s] : [x, y + (0.45 + d) * s, z]; B.add(CYL, woodD, p, r, [0.37 * s, 0.06 * s, 0.37 * s]); } };
    const crate = (B: Batch, x: number, y: number, z: number, s = 1, ry = 0) => { B.add(BOX, toon(0xc9955a), [x, y + 0.4 * s, z], [0, ry, 0], [0.8 * s, 0.8 * s, 0.8 * s]); B.add(BOX, woodD, [x, y + 0.4 * s, z], [0, ry, 0], [0.84 * s, 0.1 * s, 0.84 * s]); B.add(BOX, woodD, [x, y + 0.4 * s, z], [0, ry, Math.PI / 2], [0.84 * s, 0.1 * s, 0.84 * s]); };
    const sack = (B: Batch, x: number, y: number, z: number, i: number) => B.add(SPH, toon(0xd9c49a), [x, y + 0.28, z], [0, rnd(i), 0.2], [0.3, 0.3, 0.38]);
    const palm = (B: Batch, x: number, z: number, h: number, i: number) => {
      B.add(CYL, toon(0x8a3a1e), [x, 0.35, z], [0, 0, 0], [0.5, 0.7, 0.5]);
      for (let k = 0; k < 5; k++) B.add(CYL8, toon(0x8a6a3a), [x, 0.7 + (k + 0.5) * h / 5, z], [0, 0, 0], [0.12, h / 5 + 0.03, 0.12]);
      for (let k = 0; k < 8; k++) { const a = k * 0.785 + i; B.add(CONE, leaf[k % 3], [x + Math.cos(a) * 0.8, h + 0.7, z + Math.sin(a) * 0.8], [Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2], [0.28, 1.8, 0.08]); }
    };
    const statue = (B: Batch, x: number, z: number, s: number) => { B.add(BOX, marble, [x, 0.6 * s, z], [0, 0, 0], [1.1 * s, 1.2 * s, 1.1 * s]); B.add(BOX, toon(0xd9d2c4), [x, 1.25 * s, z], [0, 0, 0], [1.25 * s, 0.1 * s, 1.25 * s]); B.add(CYL8, marble, [x, 2.1 * s, z], [0, 0, 0], [0.28 * s, 1.6 * s, 0.22 * s]); B.add(SPH, marble, [x, 3.15 * s, z], [0, 0, 0], [0.22 * s, 0.26 * s, 0.22 * s]); B.add(CYL8, marble, [x + 0.3 * s, 2.5 * s, z], [0, 0, -0.9], [0.07 * s, 0.8 * s, 0.07 * s]); };
    const gear = (B: Batch, m: THREE.Material, x: number, y: number, z: number, r: number, ry = 0) => { B.add(CYL, m, [x, y, z], [Math.PI / 2, 0, ry], [r, 0.18, r]); const n = Math.round(r * 14); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; B.add(BOX, m, [x + Math.cos(a) * r * Math.cos(ry), y + Math.sin(a) * r, z - Math.cos(a) * r * Math.sin(ry)], [0, ry, a], [0.16, 0.14, 0.18]); } B.add(CYL, brass, [x, y, z], [Math.PI / 2, 0, ry], [0.15, 0.3, 0.15]); };

    // ================= PALACE =================
    { const B = set(), X = PX;
      plane(80, 80, toon(0xffffff, planks([14, 14])), [X, 0.01, 0]);
      // four naves (Greek cross) + octagon of columns under the dome
      const RC = 15;
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, x = X + Math.cos(a) * RC, z = Math.sin(a) * RC;
        B.add(CYL8, ironW, [x, 6, z], [0, 0, 0], [0.32, 12, 0.32]); B.add(BOX, ironW, [x, 0.3, z], [0, 0, 0], [0.9, 0.6, 0.9]); B.add(BOX, gold, [x, 12.1, z], [0, 0, 0], [0.7, 0.3, 0.7]); B.add(CYL8, iron, [x, 6, z], [0, 0, 0], [0.36, 0.25, 0.36]);
        const a2 = ((k + 1) / 16) * Math.PI * 2, x2 = X + Math.cos(a2) * RC, z2 = Math.sin(a2) * RC;
        B.beam(ironW, [x, 12.3, z], [x2, 12.3, z2], 0.4); B.beam(iron, [x, 6.6, z], [x2, 6.6, z2], 0.25);
        // gallery floor, railing and the hanging flags
        B.beam(woodD, [x * 1.0 + Math.cos(a) * 2.2, 6.8, z + Math.sin(a) * 2.2], [x2 + Math.cos(a2) * 2.2, 6.8, z2 + Math.sin(a2) * 2.2], 0.12);
        for (let q = 0; q < 6; q++) { const u = q / 6, px = x + (x2 - x) * u, pz = z + (z2 - z) * u; B.add(CYL8, ironW, [px, 7.4, pz], [0, 0, 0], [0.04, 1.2, 0.04]); }
        B.beam(ironW, [x, 8.0, z], [x2, 8.0, z2], 0.1);
        const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.2), toon(0xffffff, flagsTex(k), THREE.DoubleSide)); fl.position.set((x + x2) / 2 * 0.985, 6.2, (z + z2) / 2 * 0.985); fl.lookAt(X, 6.2, 0); R.add(fl);
      }
      { const g = new THREE.CylinderGeometry(RC + 2.3, RC + 2.3, 0.3, 32, 1, true); const m = new THREE.Mesh(g, toon(0xd9cfc0, undefined, THREE.DoubleSide)); m.position.set(X, 6.85, 0); m.receiveShadow = true; R.add(m);
        const ring = new THREE.Mesh(new THREE.RingGeometry(RC, RC + 2.3, 32), toon(0xa5713c, undefined, THREE.DoubleSide)); ring.rotation.x = -Math.PI / 2; ring.position.set(X, 6.72, 0); ring.receiveShadow = true; R.add(ring); }
      // drum with round windows, the ribbed glass dome, a lantern on top
      { const drum = new THREE.Mesh(new THREE.CylinderGeometry(RC + 0.3, RC + 0.3, 3, 32, 1, true), toon(0xffffff, tex(512, 64, (g) => { g.fillStyle = "#f2f0ea"; g.fillRect(0, 0, 512, 64); for (let x = 16; x < 512; x += 32) { g.fillStyle = "#9cc8ee"; g.beginPath(); g.arc(x, 32, 11, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#3a5a8a"; g.lineWidth = 3; g.stroke(); } }, [2, 1]), THREE.DoubleSide)); drum.position.set(X, 13.9, 0); R.add(drum);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(RC + 0.3, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xffffff, glassDome(), THREE.DoubleSide)); dome.position.set(X, 15.4, 0); dome.scale.y = 0.75; R.add(dome);
        for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; for (let q = 0; q < 8; q++) { const t0 = (q / 8) * Math.PI / 2, t1 = ((q + 1) / 8) * Math.PI / 2, rr = RC + 0.1; B.beam(ironW, [X + Math.cos(a) * rr * Math.cos(t0), 15.4 + Math.sin(t0) * rr * 0.75, Math.sin(a) * rr * Math.cos(t0)], [X + Math.cos(a) * rr * Math.cos(t1), 15.4 + Math.sin(t1) * rr * 0.75, Math.sin(a) * rr * Math.cos(t1)], 0.22); } }
        B.add(CYL8, ironW, [X, 27.2, 0], [0, 0, 0], [1.4, 1.6, 1.4]); B.add(DOME, gold, [X, 28, 0], [0, 0, 0], [1.4, 1.0, 1.4]); }
      // naves: glass barrel vaults on columns, each full of exhibits
      for (let n = 0; n < 4; n++) {
        const ry = (n * Math.PI) / 2, dir: V3 = [Math.sin(ry), 0, Math.cos(ry)], side: V3 = [Math.cos(ry), 0, -Math.sin(ry)];
        const at = (d: number, s: number, y: number): V3 => [X + dir[0] * d + side[0] * s, y, dir[2] * d + side[2] * s];
        for (let d = 17; d < 46; d += 4.5) for (const s of [-7, 7]) { const p = at(d, s, 0); B.add(CYL8, ironW, [p[0], 4.5, p[2]], [0, 0, 0], [0.26, 9, 0.26]); const q = at(d, s, 9.1); B.add(BOX, gold, q, [0, 0, 0], [0.5, 0.3, 0.5]); }
        const vault = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 30, 20, 1, true, -Math.PI / 2, Math.PI), toon(0xffffff, glassDome(), THREE.DoubleSide));
        vault.rotation.set(Math.PI / 2, 0, 0); const vg = new THREE.Group(); vg.add(vault); vault.rotation.set(-Math.PI / 2, 0, Math.PI / 2); vault.position.set(0, 9.2, 31); vg.rotation.y = ry; vg.position.set(X, 0, 0); R.add(vg);
        for (let d = 17; d < 46; d += 4.5) { const ar = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshToonMaterial({ map: ironArch(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })); const g = new THREE.Group(); ar.position.set(0, 9.2, d); g.add(ar); g.rotation.y = ry; g.position.set(X, 0, 0); R.add(g); }
        const bn = vplane(12, 1.5, toon(0xffffff, banner(n === 0 ? "INDUSTRY OF ALL NATIONS" : n === 1 ? "NEW YORK  1854" : n === 2 ? "MACHINERY" : "ARTS & MANUFACTURES", "#a8202a", "#f6e6b0")), at(16.6, 0, 10.2), ry + Math.PI); bn.material.side = THREE.DoubleSide;
        // exhibits along the nave
        for (let d = 19; d < 44; d += 4.5) for (const s of [-1, 1]) { const i = n * 20 + d + (s > 0 ? 1 : 0), kind = Math.floor(rnd(i) * 5), p = at(d, s * 4.2, 0);
          if (kind === 0) statue(B, p[0], p[2], 0.9);
          else if (kind === 1) { B.add(BOX, woodD, [p[0], 0.5, p[2]], [0, ry, 0], [2.2, 1, 1.2]); for (let q = 0; q < 6; q++) B.add(q % 2 ? BOX : CYL8, cloths[(q + n) % 6], [p[0] + (q % 3 - 1) * 0.55 * Math.cos(ry), 1.2, p[2] - (q % 3 - 1) * 0.55 * Math.sin(ry) + (q > 2 ? 0.3 : -0.3)], [0, q, 0], [0.3, 0.4, 0.3]); B.add(BOX, toon(0xf4ead6), [p[0], 2.1, p[2]], [0, ry, 0], [2.0, 0.5, 0.06]); }
          else if (kind === 2) { gear(B, steel, p[0], 1.6, p[2], 1.2, ry); gear(B, brass, p[0] + 0.9 * Math.cos(ry), 0.9, p[2] - 0.9 * Math.sin(ry), 0.6, ry); B.add(BOX, iron, [p[0], 0.3, p[2]], [0, ry, 0], [2.6, 0.6, 1.0]); B.add(CYL8, toon(0x2a2a30), [p[0] - 0.8 * Math.cos(ry), 2.2, p[2] + 0.8 * Math.sin(ry)], [0, 0, 0], [0.22, 2.4, 0.22]); }
          else if (kind === 3) palm(B, p[0], p[2], 3.2, i);
          else { B.add(CYL, toon(0xc9a86a), [p[0], 0.4, p[2]], [0, 0, 0], [1.0, 0.8, 1.0]); for (let q = 0; q < 5; q++) B.add(SPH, [toon(0xd1202f), toon(0xe8a020), toon(0x6a9a40)][q % 3], [p[0] + Math.cos(q * 1.3) * 0.5, 0.95, p[2] + Math.sin(q * 1.3) * 0.5], [0, 0, 0], [0.22, 0.22, 0.22]); }
        }
        // flags hanging down the vault
        for (let d = 20; d < 44; d += 4.5) { const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.6), toon(0xffffff, flagsTex(n * 7 + d), THREE.DoubleSide)); const p = at(d, 0, 7.6); fl.position.set(...p); fl.rotation.y = ry + Math.PI / 2; R.add(fl); }
      }
      // fountain + statues + palms around the dome floor
      { const fx = X + 9, fz = 6; B.add(CYL, marble, [fx, 0.35, fz], [0, 0, 0], [2.2, 0.7, 2.2]); B.add(CYL, toon(0x5f9ac0), [fx, 0.68, fz], [0, 0, 0], [1.95, 0.05, 1.95]); B.add(CYL8, marble, [fx, 1.4, fz], [0, 0, 0], [0.25, 1.6, 0.25]); B.add(CYL, marble, [fx, 2.2, fz], [0, 0, 0], [0.9, 0.2, 0.9]); B.add(SPH, marble, [fx, 2.7, fz], [0, 0, 0], [0.3, 0.5, 0.3]); }
      statue(B, X - 10, 8, 1.2); statue(B, X - 9, -10, 1.0); statue(B, X + 10, -9, 1.1);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.2; palm(B, X + Math.cos(a) * 12.5, Math.sin(a) * 12.5, 3 + (k % 3) * 0.6, k); }
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + 0.5; const x = X + Math.cos(a) * 11, z = Math.sin(a) * 11; if (Math.abs(z + 6) < 4 && Math.abs(x) < 4) continue; B.add(BOX, woodD, [x, 0.45, z], [0, -a, 0], [1.8, 0.9, 0.9]); for (let q = 0; q < 4; q++) B.add(BOX, cloths[(k + q) % 6], [x + (q - 1.5) * 0.35, 1.05, z], [0, -a + q, 0], [0.26, 0.3, 0.26]); }
      // rope barrier around the demo tower
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2, a2 = ((k + 1) / 14) * Math.PI * 2; const p = (q: number): V3 => [TOWER[0] + Math.cos(q) * 3.6, 0.9, TOWER[2] + Math.sin(q) * 3.2]; B.add(CYL8, brass, [p(a)[0], 0.5, p(a)[2]], [0, 0, 0], [0.07, 1.0, 0.07]); B.add(SPH, brass, [p(a)[0], 1.02, p(a)[2]], [0, 0, 0], [0.1, 0.1, 0.1]); B.beam(toon(0xa8202a), p(a), p(a2), 0.05); }
      // the demo tower: 4 posts, guide rails with ratchet teeth, top beam with a pulley, base stage
      const [tx, , tz] = TOWER;
      B.add(BOX, woodD, [tx, 0.2, tz], [0, 0, 0], [4.4, 0.4, 3.4]);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.add(BOX, wood, [tx + sx * 1.9, TOWER_TOP / 2, tz + sz * 1.4], [0, 0, 0], [0.3, TOWER_TOP, 0.3]);
      for (const sx of [-1, 1]) { B.add(BOX, woodD, [tx + sx * 1.72, TOWER_TOP / 2, tz], [0, 0, 0], [0.16, TOWER_TOP, 0.35]); for (let y = 0.6; y < TOWER_TOP - 0.4; y += 0.3) B.add(PRISM, steel, [tx + sx * 1.6, y, tz], [Math.PI / 2, 0, sx > 0 ? Math.PI / 2 : -Math.PI / 2], [0.09, 0.3, 0.09]); }
      for (let y = 2; y < TOWER_TOP; y += 3.2) for (const sz of [-1, 1]) B.beam(woodD, [tx - 1.9, y, tz + sz * 1.4], [tx + 1.9, y + 2.6, tz + sz * 1.4], 0.12);
      B.add(BOX, wood, [tx, TOWER_TOP + 0.2, tz], [0, 0, 0], [4.4, 0.4, 3.4]); B.add(BOX, woodD, [tx, TOWER_TOP + 0.55, tz], [0, 0, 0], [0.3, 0.4, 3.0]);
      B.add(CYL, steel, [tx, TOWER_TOP + 0.95, tz], [0, 0, Math.PI / 2], [0.55, 0.16, 0.55]); B.add(CYL, brass, [tx, TOWER_TOP + 0.95, tz], [0, 0, Math.PI / 2], [0.15, 0.3, 0.15]);
      const bn = vplane(4.4, 0.8, toon(0xffffff, banner("OTIS SAFETY HOIST", "#1f3a6a", "#f6e6b0", 1024, 180)), [tx, TOWER_TOP + 0.75, tz + 1.75]); void bn;
      // light shafts through the glass
      const rm = new THREE.MeshBasicMaterial({ map: rayTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false });
      for (let k = 0; k < 7; k++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(2.2 + rnd(k) * 2, 24), rm); r.position.set(X - 9 + k * 3.2, 12, -2 + (k % 3) * 3); r.rotation.set(0, 0.3, 0.35); r.layers.set(NOINK); R.add(r); this.rays.push(r); }
      // gas jets around the gallery
      for (let k = 0; k < 16; k++) { const a = (k / 16 + 1 / 32) * Math.PI * 2; lamps.push({ p: [X + Math.cos(a) * (RC + 0.1), 8.6, Math.sin(a) * (RC + 0.1)], order: 0 }); B.add(CYL8, brass, [X + Math.cos(a) * (RC + 0.1), 8.4, Math.sin(a) * (RC + 0.1)], [0, 0, 0], [0.08, 0.4, 0.08]); }
      // outer walls of the naves' ends (painted crowd of exhibits beyond)
      for (let n = 0; n < 4; n++) { const ry = (n * Math.PI) / 2; const w = vplane(14, 9, toon(0xffffff, shopFront("#a8202a", "#f2f0ea", n)), [X + Math.sin(ry) * 46, 4.5, Math.cos(ry) * 46], ry + Math.PI); void w; }
    }
    // the palace demo platform (moves): floor, side frame, crosshead with the leaf spring, pawls, cargo
    { const P = this.palPlat, m = (g: THREE.BufferGeometry, mt: THREE.Material, p: V3, s: V3, r: V3 = [0, 0, 0]) => { const q = new THREE.Mesh(g, mt); q.position.set(...p); q.scale.set(...s); q.rotation.set(...r); q.castShadow = true; q.receiveShadow = true; P.add(q); return q; };
      m(BOX, wood, [0, 0.1, 0], [3.2, 0.2, 2.6]); m(BOX, woodD, [0, 0.0, 0], [3.3, 0.1, 2.7]);
      for (const sx of [-1, 1]) { m(BOX, iron, [sx * 1.5, 1.45, 0], [0.14, 2.7, 0.2]); m(BOX, steel, [sx * 1.45, 2.85, 0], [0.32, 0.18, 0.3]); }
      m(BOX, iron, [0, 2.85, 0], [3.1, 0.16, 0.24]);
      for (let k = 0; k < 7; k++) { const u = (k - 3) / 3; m(BOX, steel, [u * 1.3, 3.0 + 0.32 * (1 - u * u), 0], [0.42, 0.06, 0.22], [0, 0, -u * 0.45]); }
      m(CYL, brass, [0, 3.38, 0], [0.12, 0.2, 0.12]);
      for (let q = 0; q < 3; q++) { const c = new THREE.Mesh(BOX, toon(0xc9955a)); c.position.set(-0.9 + q * 0.65, 0.6, -0.7 + (q % 2) * 0.3); c.scale.setScalar(0.75); c.castShadow = true; P.add(c); }
      for (let q = 0; q < 2; q++) { const b = new THREE.Mesh(CYL, wood); b.position.set(0.8 + q * 0.6, 0.65, -0.6); b.scale.set(0.3, 0.9, 0.3); b.castShadow = true; P.add(b); }
      for (let k = 0; k < 5; k++) { const ra = new THREE.Mesh(CYL8, iron); ra.position.set(-1.4 + k * 0.7, 0.75, 1.2); ra.scale.set(0.03, 1.1, 0.03); P.add(ra); }
      { const ra = new THREE.Mesh(BOX, iron); ra.position.set(0, 1.3, 1.2); ra.scale.set(3.0, 0.05, 0.05); P.add(ra); }
      P.position.set(TOWER[0], 9.2, TOWER[2]); R.add(P);
      this.palRope = new THREE.Mesh(CYL8, rope); this.palRope.castShadow = true; R.add(this.palRope);
      this.palRopeEnd = new THREE.Mesh(CYL8, rope); R.add(this.palRopeEnd); this.palRopeEnd.visible = false;
    }

    // ================= STREET =================
    { const B = set(), X = SX;
      plane(9, 260, toon(0xffffff, cobbles([4, 120])), [X, 0.01, -60]);
      plane(400, 400, toon(0x7a6a5a), [X, -0.02, -60]);
      for (const s of [-1, 1]) { plane(3.2, 260, toon(0xffffff, planks([2, 100], "#9a8a78", "#8a7a68")), [X + s * 6.1, 0.16, -60]); B.add(BOX, toon(0x8a8a88), [X + s * 4.55, 0.08, -60], [0, 0, 0], [0.2, 0.18, 260]); }
      const walls = ["#a8462e", "#8a3a2a", "#c9a27a", "#b8543a", "#d9c9a8", "#7a4a3a", "#e0d0b0"], trims = ["#f2e6c8", "#2a2a30", "#e8dcc0", "#3a4a3a", "#f4f1ea"], wins = ["#2a3a5a", "#1a2a3a", "#3a4a6a"];
      const signs: [string, string, string][] = [["DRY GOODS", "#1f3a6a", "#f6e6b0"], ["HATS & CAPS", "#a8202a", "#f6e6b0"], ["OYSTERS", "#2e5a3a", "#f6e6b0"], ["HARDWARE", "#2a2a30", "#e8b84a"], ["BOOTS", "#7a2a1a", "#f6e6b0"], ["TEA & COFFEE", "#5a2a5a", "#f6e6b0"], ["DAILY TIMES", "#f4ead6", "#1a1a1a"], ["SALOON", "#3a2a1a", "#e8b84a"], ["BANK", "#e8dcc0", "#2a2a30"], ["CIGARS", "#a8462e", "#f6e6b0"]];
      let hi = 0;
      for (const s of [-1, 1]) for (let z = 40; z > -190;) {
        const w = 7 + Math.floor(rnd(z * 3 + s) * 3) * 1.5, n = 4 + Math.floor(rnd(z + s * 7) * 3), H = n * 3.4, d = 10, x = X + s * (7.7 + d / 2), i = hi++;
        const isWare = s > 0 && z <= -14 && z > -14 - w - 0.1;
        const m = toon(0xffffff, brickFront(walls[i % 7], trims[i % 5], wins[i % 3], isWare ? 0 : i % 3, i * 13)); const t = m.map as THREE.Texture; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(1, Math.round(w / 4)), n - 1);
        const bx = new THREE.Mesh(facadeBox(d, H - 3.4, w, 1e9), m); bx.position.set(x, 3.4 + (H - 3.4) / 2, z - w / 2); bx.castShadow = bx.receiveShadow = true; R.add(bx);
        // ground floor shop front (cast iron), sign board, awning, goods out front
        const sf = toon(0xffffff, shopFront(trims[(i + 1) % 5] === "#2a2a30" ? "#a8202a" : "#2a2a30", trims[(i + 2) % 5], i)); (sf.map as THREE.Texture).wrapS = THREE.RepeatWrapping; (sf.map as THREE.Texture).repeat.set(Math.max(1, Math.round(w / 5)), 1);
        const gf = new THREE.Mesh(facadeBox(d, 3.4, w, 1e9), sf); gf.position.set(x, 1.7, z - w / 2); gf.receiveShadow = true; R.add(gf);
        B.add(BOX, toon(parseInt(trims[i % 5].slice(1), 16)), [x - s * 0.1, H + 0.35, z - w / 2], [0, 0, 0], [d + 0.6, 0.7, w + 0.2]);
        for (let q = -w / 2 + 0.4; q < w / 2; q += 0.8) B.add(BOX, toon(parseInt(trims[i % 5].slice(1), 16)), [x - s * (d / 2 + 0.25), H - 0.05, z - w / 2 + q], [0, 0, 0], [0.3, 0.25, 0.3]);
        const sg = signs[i % signs.length]; if (!isWare) { const sp = vplane(Math.min(w - 1, 5.6), 1.0, toon(0xffffff, sign(...sg)), [x - s * (d / 2 + 0.06), 3.95, z - w / 2], -s * Math.PI / 2); sp.material.side = THREE.DoubleSide; }
        if (!isWare && rnd(i + 4) < 0.7) { const aw = toon(0xffffff, tex(64, 64, (g) => { for (let k = 0; k < 64; k += 16) { g.fillStyle = sg[1]; g.fillRect(k, 0, 8, 64); g.fillStyle = "#f4ead6"; g.fillRect(k + 8, 0, 8, 64); } }, [Math.round(w / 1.5), 1])); B.add(BOX, aw, [x - s * (d / 2 + 1.0), 3.0, z - w / 2], [0, 0, s * 0.32], [2.2, 0.05, w - 1.2]); for (const dz of [-(w - 1.2) / 2, (w - 1.2) / 2]) B.add(CYL8, iron, [x - s * (d / 2 + 2.0), 1.35, z - w / 2 + dz], [0, 0, 0], [0.05, 2.7, 0.05]); }
        if (!isWare) for (let q = 0; q < 4; q++) { const gz = z - 0.8 - rnd(i * 5 + q) * (w - 1.6), gx = x - s * (d / 2 + 0.6 + rnd(q + i) * 0.6), k = Math.floor(rnd(i * 3 + q) * 4); if (k === 0) barrel(B, gx, 0.16, gz, 0.8); else if (k === 1) crate(B, gx, 0.16, gz, 0.8, rnd(q)); else if (k === 2) sack(B, gx, 0.16, gz, q); else { B.add(BOX, woodD, [gx, 0.6, gz], [0, 0, 0], [0.6, 0.9, 1.2]); for (let r = 0; r < 3; r++) B.add(SPH, cloths[(r + i) % 6], [gx, 1.15, gz - 0.35 + r * 0.35], [0, 0, 0], [0.16, 0.16, 0.16]); } }
        if (rnd(i + 6) < 0.5) { const fz = z - w / 2; B.add(CYL8, toon(0xf4ead6), [x - s * (d / 2 + 0.8), H - 1.2, fz], [0, 0, s * 0.7], [0.04, 2.2, 0.04]); const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), toon(0xffffff, flagsTex(6 * i), THREE.DoubleSide)); fl.position.set(x - s * (d / 2 + 1.9), H - 0.3, fz); fl.rotation.y = Math.PI / 2; R.add(fl); }
        z -= w;
      }
      // the warehouse hoist: beam out of the top floor, pulley, loading doors, barrels at the foot
      const [hx, , hz] = HOIST;
      B.add(BOX, woodD, [hx + 0.9, HOIST_TOP, hz], [0, 0, 0], [3.0, 0.4, 0.4]); B.beam(woodD, [hx + 2.4, HOIST_TOP - 1.6, hz], [hx + 0.6, HOIST_TOP, hz], 0.2);
      B.add(CYL, steel, [hx, HOIST_TOP - 0.45, hz], [Math.PI / 2, 0, 0], [0.45, 0.14, 0.45]); B.add(CYL, brass, [hx, HOIST_TOP - 0.45, hz], [Math.PI / 2, 0, 0], [0.12, 0.3, 0.12]);
      for (let f = 1; f < 5; f++) { B.add(BOX, toon(0x3a2a1a), [hx + 2.62, f * 3.4 + 1.5, hz], [0, 0, 0], [0.1, 2.4, 1.8]); B.add(BOX, toon(0x7a4a2a), [hx + 2.4, f * 3.4 + 1.5, hz - 1.2], [0, 0.6, 0], [0.08, 2.4, 0.9]); }
      const ws = vplane(5, 1.0, toon(0xffffff, sign("WAREHOUSE  -  STORAGE", "#3a2a1a", "#e8b84a")), [hx + 2.55, 3.9, hz - 3.5], -Math.PI / 2); ws.material.side = THREE.DoubleSide;
      for (let q = 0; q < 7; q++) barrel(B, hx + 0.6 + (q % 3) * 0.75, 0.16, hz - 2.4 - Math.floor(q / 3) * 0.8, 0.9);
      for (let q = 0; q < 4; q++) crate(B, hx + 0.8 + (q % 2) * 0.9, 0.16, hz + 1.8 + Math.floor(q / 2) * 0.9, 0.9, q * 0.3);
      crate(B, hx + 1.2, 0.86, hz + 2.2, 0.7, 0.4);
      // gas lamps, telegraph poles, handcarts, hitching posts, crates, barrels, a newsboy's stand
      for (let z = 30; z > -180; z -= 12) for (const s of [-1, 1]) { const x = X + s * 4.9; B.add(CYL8, toon(0x2a2a30), [x, 1.9, z + (s > 0 ? 6 : 0)], [0, 0, 0], [0.07, 3.6, 0.07]); B.add(BOX, toon(0x2a2a30), [x, 3.85, z + (s > 0 ? 6 : 0)], [0, Math.PI / 4, 0], [0.4, 0.5, 0.4]); B.add(CONE, toon(0x2a2a30), [x, 4.25, z + (s > 0 ? 6 : 0)], [0, Math.PI / 4, 0], [0.34, 0.3, 0.34]); lamps.push({ p: [x, 3.85, z + (s > 0 ? 6 : 0)], order: 0, tint: [1, 0.8, 0.5] }); }
      for (let z = 34; z > -180; z -= 26) { const x = X - 5.6; B.add(CYL8, woodD, [x, 5, z], [0, 0, 0], [0.12, 10, 0.12]); B.add(BOX, woodD, [x, 9.4, z], [0, 0, 0], [0.12, 0.12, 2.4]); for (const dz of [-1, 0, 1]) B.beam(toon(0x2a2a2a), [x, 9.5, z + dz], [x, 9.0 + 0.4 * Math.abs(dz), z - 26 + dz], 0.02); }
      const cart = (x: number, z: number, ry: number, load: number) => {
        const M0 = new THREE.Matrix4().compose(new THREE.Vector3(x, 0.16, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
        const M = (g: THREE.BufferGeometry, mt: THREE.Material, p: V3, sc: V3, r: V3 = [0, 0, 0]) => B.addM(g, mt, M0.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...sc))));
        M(BOX, wood, [0, 0.8, 0], [1.3, 0.12, 2.0]); for (const sx of [-1, 1]) { M(CYL, woodD, [sx * 0.75, 0.6, 0.2], [0.6, 0.08, 0.6], [0, 0, Math.PI / 2]); M(BOX, wood, [sx * 0.62, 1.0, 0], [0.08, 0.35, 2.0]); M(BOX, woodD, [sx * 0.4, 0.75, 1.7], [0.08, 0.08, 1.6]); }
        for (let q = 0; q < load; q++) M(q % 2 ? CYL : BOX, q % 2 ? wood : toon(0xc9955a), [(q % 2 - 0.5) * 0.6, 1.2 + Math.floor(q / 2) * 0.5, -0.5 + (q % 3) * 0.4], [0.32, 0.5, 0.32]);
      };
      cart(X - 2.6, -6, 0.3, 4); cart(X + 2.8, -32, -0.2, 3); cart(X - 2.2, -58, 0.1, 5); cart(X + 2.4, 10, 0, 2); cart(X - 2.8, -90, 0.2, 4);
      for (let q = 0; q < 26; q++) { const x = X + (rnd(q + 300) < 0.5 ? -1 : 1) * (5.6 + rnd(q + 301) * 1.2), z = 30 - rnd(q + 302) * 200; if (Math.abs(z - HOIST[2]) < 5) continue; if (q % 3 === 0) barrel(B, x, 0.16, z, 0.85); else if (q % 3 === 1) crate(B, x, 0.16, z, 0.8, q); else sack(B, x, 0.16, z, q); }
      for (let z = 20; z > -150; z -= 9) B.add(CYL8, toon(0x2a2a30), [X + 4.75, 0.6, z], [0, 0, 0], [0.08, 0.9, 0.08]);
      // Trinity Church closing the street: tower + tall spire
      { const cx = X, cz = -210; B.add(BOX, toon(0xa8907a), [cx, 12, cz], [0, 0, 0], [14, 24, 20]); B.add(PRISM, toon(0x6a5a50), [cx, 26, cz], [0, 0, Math.PI / 2], [6, 20, 9.6]); B.add(BOX, toon(0xa8907a), [cx, 22, cz + 12], [0, 0, 0], [7, 44, 7]); B.add(CONE, toon(0x8a7a6a), [cx, 59, cz + 12], [0, Math.PI / 4, 0], [5, 30, 5]); B.add(BOX, toon(0x3a2a30), [cx, 30, cz + 15.6], [0, 0, 0], [2, 6, 0.1]);
        for (let k = 0; k < 4; k++) for (const s of [-1, 1]) B.add(CONE, toon(0xa8907a), [cx + s * 3.3, 45, cz + 12 + (k < 2 ? -3.3 : 3.3)], [0, 0, 0], [0.5, 3, 0.5]); }
      for (let k = 0; k < 40; k++) B.add(BOX, toon([0x9a7a6a, 0xb8a088, 0x8a5a4a, 0xc9b8a0][k % 4]), [X + (rnd(k + 500) - 0.5) * 200, 8, -230 - rnd(k + 501) * 120], [0, 0, 0], [12, 10 + rnd(k) * 16, 12]);
      for (let k = 0; k < 30; k++) { const x = X + (rnd(k + 520) < 0.5 ? -1 : 1) * (22 + rnd(k + 521) * 60); B.add(BOX, toon([0x9a7a6a, 0xb8a088, 0x8a5a4a][k % 3]), [x, 8, 20 - rnd(k + 522) * 240], [0, 0, 0], [12, 16 + rnd(k) * 10, 12]); }
    }
    // the hoist platform (moves) with barrels, its rope and the snapped end
    { const P = this.hoistPlat; const add = (g: THREE.BufferGeometry, mt: THREE.Material, p: V3, s: V3, r: V3 = [0, 0, 0]) => { const q = new THREE.Mesh(g, mt); q.position.set(...p); q.scale.set(...s); q.rotation.set(...r); q.castShadow = true; P.add(q); return q; };
      add(BOX, wood, [0, 0, 0], [2.2, 0.16, 1.8]); for (const sx of [-1, 1]) add(BOX, woodD, [sx * 1.05, 0.9, 0], [0.1, 1.8, 0.1]); add(BOX, woodD, [0, 1.8, 0], [2.2, 0.12, 0.12]);
      for (const sz of [-1, 1]) for (const sx of [-1, 1]) add(CYL8, rope, [sx * 0.52, 1.0, sz * 0.4], [0.02, 1.9, 0.02], [sz * 0.25, 0, -sx * 0.5]);
      for (let q = 0; q < 4; q++) { const b = add(CYL, wood, [(q % 2 - 0.5) * 0.9, 0.5, (Math.floor(q / 2) - 0.5) * 0.8], [0.32, 0.8, 0.32]); this.barrels.push(b); }
      R.add(P);
      this.hoistRope = new THREE.Mesh(CYL8, rope); this.hoistRope.castShadow = true; R.add(this.hoistRope);
      this.hoistEnd = new THREE.Mesh(CYL8, rope); R.add(this.hoistEnd); this.hoistEnd.visible = false;
    }
    for (const B of sets) { const g = new THREE.Group(); B.build(g); g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } }); R.add(g); }
    this.lamps = new Flames(R, lamps, 0.3);
    this.puffMat = toon(0xd9cdb8) as THREE.MeshToonMaterial;
    for (let i = 0; i < 48; i++) { const p = new THREE.Mesh(SPH, this.puffMat); p.visible = false; R.add(p); this.puffs.push(p); }
    for (let i = 0; i < 2; i++) { const l = new THREE.PointLight(0xffa850, 0, 16, 1.4); R.add(l); this.warm.push(l); }
    this.cloudMat = new THREE.MeshBasicMaterial({ map: canvasTex(256, 128, (g) => { g.fillStyle = "#fff"; for (const [x, y, r] of [[60, 80, 36], [110, 60, 48], [165, 70, 40], [205, 85, 28], [130, 92, 50]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } }), transparent: true, depthWrite: false, fog: false, toneMapped: false });
    for (let i = 0; i < 24; i++) { const a = rnd(i + 950) * Math.PI * 2, r = 1100 + rnd(i + 951) * 150, s = 160 + rnd(i + 952) * 140; const c = new THREE.Mesh(new THREE.PlaneGeometry(s, s / 2), this.cloudMat); c.position.set(Math.cos(a) * r, 160 + rnd(i + 953) * 220, Math.sin(a) * r); c.layers.set(NOINK); this.sky.add(c); c.lookAt(0, 0, 0); }
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.03;
    R.add(this.hemi, this.sun, this.sun.target);
    void ICO; void HALF; void DOME;
  }

  /** rope between two points (a vertical-ish cylinder) */
  private ropeTo(m: THREE.Mesh, a: V3, b: V3, th = 0.05) {
    const v = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = v.length();
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.scale.set(th, Math.max(0.01, len), th);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); m.visible = len > 0.02;
  }

  /** pal: palace platform height + rope cut (0 = whole, >0 = seconds since the cut); hoist: platform height, snap
   *  seconds (barrels bounce off after the crash); dust: [x, y, z, t0] bursts */
  set(o: { light: LightName; t: number; px: number; cam: V3; look: V3; warm?: V3[]; shadowR?: number; rays?: number;
    pal?: { y: number; cut?: number }; hoist?: { y: number; snap?: number; crash?: number }; dust?: [number, number, number, number][] }) {
    const L = o.light;
    this.sky.position.set(...o.cam);
    this.skyMat.map = this.skies[L]; this.skyMat.needsUpdate = true;
    const P = {
      hall: { hs: 0xf4f0ff, hg: 0x8a6a4a, hi: 1.45, sc: 0xfff0d8, si: 2.6, sd: [-0.45, 0.8, 0.4], fog: 0xe6eef2, fn: 40, ff: 220, lamp: 0.6, cl: 0xffffff },
      day: { hs: 0xe0ecff, hg: 0x7a6a5a, hi: 1.3, sc: 0xfff0d0, si: 2.9, sd: [0.55, 0.8, 0.35], fog: 0xe8e2d8, fn: 60, ff: 420, lamp: 0, cl: 0xffffff },
      dusk: { hs: 0xd8b0c0, hg: 0x5a4050, hi: 1.2, sc: 0xffa070, si: 2.4, sd: [-0.7, 0.3, -0.4], fog: 0xe8a888, fn: 60, ff: 500, lamp: 1, cl: 0xffc0a0 },
      night: { hs: 0x6a7ab0, hg: 0x2a2030, hi: 0.9, sc: 0x9ab0ff, si: 0.9, sd: [0.3, 0.8, 0.4], fog: 0x2a3050, fn: 40, ff: 300, lamp: 1, cl: 0x8090b0 },
    }[L];
    this.hemi.color.set(P.hs); this.hemi.groundColor.set(P.hg); this.hemi.intensity = P.hi;
    this.sun.color.set(P.sc); this.sun.intensity = P.si;
    const sd = new THREE.Vector3(...(P.sd as V3)).normalize(), r = o.shadowR ?? 26;
    this.sun.target.position.set(...o.look); this.sun.position.copy(this.sun.target.position).addScaledVector(sd, 120); this.sun.target.updateMatrixWorld();
    const sc = this.sun.shadow.camera; sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 20; sc.far = 260; sc.updateProjectionMatrix();
    this.fog.color.set(P.fog); this.fog.near = P.fn; this.fog.far = P.ff;
    this.cloudMat.color.set(P.cl);
    this.lamps.mat.uniforms.uTime.value = o.t; this.lamps.mat.uniforms.uPx.value = o.px; this.lamps.mat.uniforms.uLit.value = P.lamp;
    this.rays.forEach((ry, i) => { ry.visible = L === "hall"; (ry.material as THREE.MeshBasicMaterial).opacity = (o.rays ?? 0.8) * (0.8 + 0.2 * Math.sin(o.t * 0.7 + i)); });
    this.warm.forEach((l, i) => { const w = o.warm?.[i]; l.intensity = w ? 5 * (0.92 + 0.08 * Math.sin(o.t * 9 + i)) : 0; if (w) l.position.set(...w); });
    // palace platform + rope (when cut: the upper end whips up and swings, the lower end hangs from the crosshead)
    const pal = o.pal ?? { y: 9.2 };
    this.palPlat.position.y = pal.y;
    const top: V3 = [TOWER[0], TOWER_TOP + 0.95 - 0.55, TOWER[2]], hook: V3 = [TOWER[0], pal.y + 3.4, TOWER[2]];
    if (!pal.cut) { this.ropeTo(this.palRope, top, hook); this.palRopeEnd.visible = false; }
    else { const k = Math.min(1, pal.cut / 0.5), sw = Math.sin(pal.cut * 7) * Math.exp(-pal.cut * 2) * 0.6;
      this.ropeTo(this.palRope, top, [top[0] + sw, top[1] - 0.8 - (1 - k) * (top[1] - hook[1] - 0.8) * 0.5, top[2]]);
      this.ropeTo(this.palRopeEnd, hook, [hook[0] - sw * 0.5, hook[1] + 0.6 + (1 - k) * 0.8, hook[2] + 0.2]); }
    // street hoist
    const h = o.hoist ?? { y: 9 };
    this.hoistPlat.position.set(HOIST[0], h.y, HOIST[2]); this.hoistPlat.rotation.set(0, 0, 0);
    const htop: V3 = [HOIST[0], HOIST_TOP - 0.9, HOIST[2]], hh: V3 = [HOIST[0], h.y + 1.85, HOIST[2]];
    if (h.snap === undefined || h.snap < 0) { this.ropeTo(this.hoistRope, htop, hh); this.hoistEnd.visible = false; }
    else { const sw = Math.sin(h.snap * 8) * Math.exp(-h.snap * 1.6) * 0.8;
      this.ropeTo(this.hoistRope, htop, [htop[0] + sw, htop[1] - 1.2 - Math.min(1, h.snap * 3) * 0.4, htop[2] + sw * 0.3]);
      this.ropeTo(this.hoistEnd, hh, [hh[0] - 0.3, hh[1] + 1.4 * Math.max(0, 1 - h.snap * 2) + 0.2, hh[2]]); }
    this.barrels.forEach((b, i) => { const base: V3 = [(i % 2 - 0.5) * 0.9, 0.5, (Math.floor(i / 2) - 0.5) * 0.8];
      if (h.crash === undefined || h.crash < 0) { b.position.set(...base); b.rotation.set(0, 0, 0); return; }
      const c = h.crash, dir = [[-1, -0.6], [1, -0.4], [-0.7, 0.8], [0.9, 0.7]][i], vy = 2.6 + i * 0.4, tt = Math.min(c, 0.55 + i * 0.05);
      const y = Math.max(0.35 - h.y, 0.5 + vy * tt - 4.9 * tt * tt) ; const roll = Math.max(0, c - tt);
      b.position.set(base[0] + dir[0] * (c * 1.6 + roll * 1.4), y, base[2] + dir[1] * (c * 1.6 + roll * 1.4)); b.rotation.set(Math.PI / 2 * Math.min(1, c * 3), i, 0); });
    // dust bursts: [x, y, z, t0]
    let pi = 0;
    for (const [x, y, z, t0] of o.dust ?? []) { const age = o.t - t0; if (age < 0 || age > 2.2) continue;
      for (let k = 0; k < 12 && pi < this.puffs.length; k++, pi++) { const p = this.puffs[pi], a = (k / 12) * Math.PI * 2, sp = 1.4 + (k % 3) * 0.5, e = 1 - Math.exp(-age * 2.5);
        p.visible = true; p.position.set(x + Math.cos(a) * sp * e, y + 0.2 + e * (0.5 + (k % 4) * 0.25), z + Math.sin(a) * sp * e); p.scale.setScalar((0.25 + e * 0.5) * Math.max(0, 1 - age / 2.2)); } }
    for (; pi < this.puffs.length; pi++) this.puffs[pi].visible = false;
  }
}
