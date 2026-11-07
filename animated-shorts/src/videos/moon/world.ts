// "The Man Who Accidentally Bought the Moon" (Dagar Clips): reference-style cartoon short, cosy city nights.
//   APT   (x 0):   Kevin's cramped, cluttered studio apartment: bed with a patterned quilt, nightstand with alarm
//                  clock and lamp, a desk with the glowing laptop, bookshelves, posters, fairy lights, plants, pizza
//                  boxes, laundry, a guitar, a beanbag. A big window looks out on the skyline and a huge Moon.
//   CITY  (x 400): a rooftop over a dense night skyline: water tanks, antennas, neon signs, string lights, laundry
//                  lines, potted plants, and the giant Moon hanging over the towers.
// More sets (lawyer at the door, NASA, the lunar-apartment crowd, government, Moon hotel, office) follow approval.
import * as THREE from "three";
import { NOINK } from "../bridge/ink";
import { Flames } from "../diwali/world";
import { Batch, V3, rnd, toon, canvasTex, BOX, CYL, CONE, SPH, CYL8 } from "../eiffel/lib";

export type LightName = "morning" | "night" | "close" | "city";
export const AX = 0, CX = 400;
/** the bed (head end), Kevin's desk chair, the laptop screen centre, the window centre */
export const BED: V3 = [AX - 2.2, 0, -1.6];
export const CHAIR: V3 = [AX + 1.6, 0, -2.0];
export const LAPTOP: V3 = [AX + 1.6, 0.98, -1.25];
export const WIN: V3 = [AX, 1.9, -4.0];
/** the Moon's centre (apartment and city) */
export const MOON_APT: V3 = [AX + 40, 120, -520], MOON_CITY: V3 = [CX + 10, 70, -260];
export const ROOF: V3 = [CX, 0, 0];
type Pt = { p: V3; order: number; tint?: V3 };

const tex = canvasTex;
const skyTex = (top: string, mid: string, hor: string) => tex(16, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(0.42, mid); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); });
const starsTex = () => tex(1024, 512, (g) => { g.clearRect(0, 0, 1024, 512); for (let i = 0; i < 420; i++) { const y = rnd(i + 5) * 260; g.fillStyle = `rgba(255,250,230,${0.3 + rnd(i) * 0.7})`; g.beginPath(); g.arc(rnd(i + 1) * 1024, y, 0.6 + rnd(i + 2) * 1.6, 0, Math.PI * 2); g.fill(); } });
const moonTex = () => tex(512, 256, (g) => {
  g.fillStyle = "#f2ead2"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 14; i++) { g.fillStyle = "rgba(150,140,130,0.32)"; g.beginPath(); g.ellipse(rnd(i + 40) * 512, 40 + rnd(i + 41) * 176, 30 + rnd(i + 42) * 60, 18 + rnd(i + 43) * 30, 0, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 90; i++) { const x = rnd(i) * 512, y = rnd(i + 1) * 256, r = 3 + rnd(i + 2) * 12; g.fillStyle = "rgba(120,110,105,0.4)"; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.fillStyle = "rgba(255,255,245,0.5)"; g.beginPath(); g.arc(x - r * 0.25, y - r * 0.25, r * 0.6, 0, Math.PI * 2); g.fill(); }
});
const wallpaper = (base: string, dot: string) => tex(128, 128, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 128, 128);
  g.fillStyle = dot; for (let y = 0; y < 128; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < 128; x += 32) { g.beginPath(); g.moveTo(x + 8, y + 2); g.lineTo(x + 14, y + 8); g.lineTo(x + 8, y + 14); g.lineTo(x + 2, y + 8); g.closePath(); g.fill(); }
  g.fillStyle = "rgba(255,255,255,0.08)"; for (let x = 0; x < 128; x += 16) g.fillRect(x, 0, 3, 128);
}, [6, 3]);
const planks = () => tex(256, 256, (g) => { g.fillStyle = "#a8683a"; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 32) { g.fillStyle = rnd(y) < 0.5 ? "#9a5e33" : "#b47443"; g.fillRect(0, y, 256, 30); g.fillStyle = "rgba(60,30,10,0.5)"; g.fillRect(0, y + 30, 256, 2); g.fillRect(((y * 37) % 200) + 20, y, 2, 30); } }, [6, 6]);
const rugTex = () => tex(256, 256, (g) => {
  g.fillStyle = "#c0392b"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#f2c14e"; g.fillRect(12, 12, 232, 232); g.fillStyle = "#1f5a8a"; g.fillRect(24, 24, 208, 208);
  for (let i = 0; i < 4; i++) { g.strokeStyle = ["#f4ead6", "#e8538a", "#f2c14e", "#2e9a5a"][i]; g.lineWidth = 6; g.beginPath(); g.ellipse(128, 128, 90 - i * 20, 70 - i * 15, 0, 0, Math.PI * 2); g.stroke(); }
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; g.fillStyle = "#f4ead6"; g.beginPath(); g.arc(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 92, 4, 0, Math.PI * 2); g.fill(); }
});
const quiltTex = () => tex(128, 128, (g) => { const C = ["#e8538a", "#4fa3d9", "#f2c14e", "#2e9a5a", "#f4ead6", "#8a4ab0"]; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = C[(x + y * 3) % 6]; g.fillRect(x * 32, y * 32, 32, 32); g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 2; g.strokeRect(x * 32 + 2, y * 32 + 2, 28, 28); } }, [2, 2]);
const poster = (kind: number) => tex(128, 180, (g) => {
  const bg = ["#1a2a6a", "#e86a2a", "#2a1a4a", "#2e9a5a", "#d1202f", "#f2c14e"][kind % 6]; g.fillStyle = bg; g.fillRect(0, 0, 128, 180);
  g.strokeStyle = "#f4ead6"; g.lineWidth = 6; g.strokeRect(3, 3, 122, 174);
  if (kind % 6 === 0) { g.fillStyle = "#f2ead2"; g.beginPath(); g.arc(64, 70, 38, 0, Math.PI * 2); g.fill(); g.fillStyle = "rgba(120,110,100,0.45)"; for (const [x, y, r] of [[50, 60, 8], [76, 80, 10], [70, 52, 5]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } g.fillStyle = "#fff"; for (let i = 0; i < 30; i++) g.fillRect(rnd(i) * 128, rnd(i + 1) * 180, 2, 2); }
  else if (kind % 6 === 1) { g.fillStyle = "#f4ead6"; g.beginPath(); g.moveTo(64, 20); g.quadraticCurveTo(90, 60, 80, 120); g.lineTo(48, 120); g.quadraticCurveTo(38, 60, 64, 20); g.fill(); g.fillStyle = "#d1202f"; g.beginPath(); g.arc(64, 70, 10, 0, Math.PI * 2); g.fill(); g.fillStyle = "#f2c14e"; g.beginPath(); g.moveTo(52, 120); g.lineTo(64, 160); g.lineTo(76, 120); g.fill(); }
  else if (kind % 6 === 2) { for (let i = 0; i < 5; i++) { g.fillStyle = ["#e8538a", "#4fa3d9", "#f2c14e", "#2e9a5a", "#f4ead6"][i]; g.fillRect(14, 20 + i * 28, 100, 16); } }
  else if (kind % 6 === 3) { g.fillStyle = "#f2c14e"; g.beginPath(); g.arc(64, 64, 34, 0, Math.PI * 2); g.fill(); g.fillStyle = "#1a1a1a"; g.fillRect(30, 120, 68, 10); g.fillRect(40, 140, 48, 8); }
  else if (kind % 6 === 4) { g.fillStyle = "#f4ead6"; for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2, b = a + Math.PI / 5; g.beginPath(); g.moveTo(64, 80); g.lineTo(64 + Math.cos(a) * 44, 80 + Math.sin(a) * 44); g.lineTo(64 + Math.cos(b) * 18, 80 + Math.sin(b) * 18); g.fill(); } }
  else { g.fillStyle = "#2a4ab0"; g.fillRect(20, 30, 88, 60); g.fillStyle = "#1a1a1a"; g.fillRect(20, 110, 88, 8); g.fillRect(20, 130, 60, 8); }
});
/** the auction website on the laptop: a header, a grid of listings, the Moon listing highlighted */
const auctionTex = () => tex(512, 1024, (g) => {
  g.fillStyle = "#f4f4f8"; g.fillRect(0, 0, 512, 1024);
  g.fillStyle = "#2a5ad9"; g.fillRect(0, 0, 512, 70); g.fillStyle = "#fff"; g.font = "bold 36px sans-serif"; g.fillText("BIDZILLA", 20, 48);
  g.fillStyle = "#fff"; g.fillRect(230, 18, 262, 34);
  const items = ["#e86a2a", "#2e9a5a", "#8a4ab0", "#d1202f", "MOON", "#4fa3d9", "#f2c14e", "#2a2a4a", "#e8538a", "#1f6a7a"];
  items.forEach((it, i) => { const x = 16 + (i % 2) * 248, y = 90 + Math.floor(i / 2) * 186;
    g.fillStyle = it === "MOON" ? "#fff6c0" : "#ffffff"; g.fillRect(x, y, 232, 172); g.strokeStyle = it === "MOON" ? "#f2a020" : "#d0d0dc"; g.lineWidth = it === "MOON" ? 6 : 2; g.strokeRect(x, y, 232, 172);
    if (it === "MOON") { g.fillStyle = "#14143a"; g.fillRect(x + 10, y + 10, 212, 104); g.fillStyle = "#f2ead2"; g.beginPath(); g.arc(x + 116, y + 62, 40, 0, Math.PI * 2); g.fill(); g.fillStyle = "rgba(120,110,100,0.5)"; g.beginPath(); g.arc(x + 104, y + 54, 9, 0, Math.PI * 2); g.arc(x + 130, y + 74, 12, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#1a1a1a"; g.font = "bold 24px sans-serif"; g.fillText("MOON FOR SALE", x + 14, y + 140); g.fillStyle = "#2e9a5a"; g.font = "bold 22px sans-serif"; g.fillText("$10", x + 14, y + 164); }
    else { g.fillStyle = it; g.fillRect(x + 10, y + 10, 212, 104); g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.arc(x + 116, y + 62, 30, 0, Math.PI * 2); g.fill(); g.fillStyle = "#6a6a7a"; g.fillRect(x + 14, y + 128, 150, 12); g.fillStyle = "#2e9a5a"; g.fillRect(x + 14, y + 150, 60, 12); } });
});
const skylineTex = (seed: number, base: string) => tex(128, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 128, 256);
  for (let y = 10; y < 250; y += 20) for (let x = 8; x < 124; x += 18) { const on = rnd(seed + x * 7 + y) < 0.55; g.fillStyle = on ? (rnd(seed + x + y * 3) < 0.7 ? "#ffd27a" : "#9ad8ff") : "rgba(10,10,30,0.55)"; g.fillRect(x, y, 10, 12); }
}, [1, 1]);
const neonTex = (txt: string, col: string) => tex(256, 96, (g) => { g.fillStyle = "#14102a"; g.fillRect(0, 0, 256, 96); g.strokeStyle = col; g.lineWidth = 5; g.strokeRect(6, 6, 244, 84); g.fillStyle = col; g.font = "bold 46px sans-serif"; g.textAlign = "center"; g.fillText(txt, 128, 64); });
const clockTex = () => tex(128, 64, (g) => { g.fillStyle = "#1a1a1a"; g.fillRect(0, 0, 128, 64); g.fillStyle = "#ff3a2a"; g.font = "bold 40px monospace"; g.fillText("7:00", 14, 46); });
const dotTex = () => tex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });

export class World {
  root = new THREE.Group();
  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sky: THREE.Mesh; skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false });
  skies: Record<LightName, THREE.Texture>;
  stars: THREE.Mesh;
  fog = new THREE.Fog(0xffffff, 80, 900);
  bulbs: Flames;
  warm: THREE.PointLight[] = [];
  lamp = new THREE.PointLight(0xffb060, 0, 9, 1.6);
  screen = new THREE.PointLight(0x8ac8ff, 0, 4, 1.4);
  screenMat: THREE.MeshBasicMaterial;
  moons: THREE.Mesh[] = []; halos: THREE.Sprite[] = [];

  constructor() {
    const R = this.root;
    this.skies = { morning: skyTex("#4a7ad0", "#f0a0b0", "#ffd0a0"), night: skyTex("#0c0a30", "#2a2470", "#5a4aa0"), close: skyTex("#0c0a30", "#2a2470", "#5a4aa0"), city: skyTex("#0a0a2a", "#2a2a7a", "#7a5ab0") };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 24, 16), this.skyMat); this.sky.layers.set(NOINK); R.add(this.sky);
    this.stars = new THREE.Mesh(new THREE.SphereGeometry(1300, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: starsTex(), transparent: true, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false })); this.stars.layers.set(NOINK); this.sky.add(this.stars);
    const bulbs: Pt[] = [];
    const sets: Batch[] = [];
    const set = () => { const b = new Batch(); sets.push(b); return b; };
    const vplane = (w: number, h: number, m: THREE.Material, p: V3, ry = 0) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); q.position.set(...p); q.rotation.y = ry; R.add(q); return q; };
    const plane = (w: number, d: number, m: THREE.Material, p: V3) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); q.rotation.set(-Math.PI / 2, 0, 0); q.position.set(...p); q.receiveShadow = true; R.add(q); return q; };
    const glow = (m: THREE.Texture) => new THREE.MeshBasicMaterial({ map: m, toneMapped: false });
    const STR: V3[] = [[1, 0.85, 0.45], [1, 0.75, 0.35], [1, 0.9, 0.6]];
    const COL: V3[] = [[1, 0.3, 0.3], [0.3, 1, 0.4], [0.4, 0.6, 1], [1, 0.85, 0.3], [1, 0.4, 0.9]];
    /** fairy lights from a to b with sag */
    const lightString = (B: Batch, a: V3, b: V3, n: number, sag: number, colour = false) => { for (let k = 0; k <= n; k++) { const t = k / n, p: V3 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * sag, a[2] + (b[2] - a[2]) * t]; bulbs.push({ p, order: 0, tint: colour ? COL[k % 5] : STR[k % 3] }); if (k < n) { const t2 = (k + 1) / n; B.beam(toon(0x2a2a2a), p, [a[0] + (b[0] - a[0]) * t2, a[1] + (b[1] - a[1]) * t2 - Math.sin(Math.PI * t2) * sag, a[2] + (b[2] - a[2]) * t2], 0.008); } } };
    const BOOK = [0xd1202f, 0x2a4ab0, 0xf2c14e, 0x2e9a5a, 0x8a4ab0, 0xe86a2a, 0xf4ead6, 0x1f6a7a].map((c) => toon(c));
    const books = (B: Batch, x0: number, x1: number, y: number, z: number, seed: number) => { for (let x = x0, i = 0; x < x1 - 0.05; i++) { const w = 0.04 + rnd(seed + i) * 0.04, h = 0.2 + rnd(seed + i + 9) * 0.1; B.add(BOX, BOOK[(seed + i) % 8], [x + w / 2, y + h / 2, z], [0, 0, rnd(seed + i * 3) < 0.08 ? 0.3 : 0], [w, h, 0.2]); x += w + 0.005; } };
    const plant = (B: Batch, x: number, y: number, z: number, s = 1) => { B.add(CYL, toon(0xc0602e), [x, y + 0.15 * s, z], [0, 0, 0], [0.16 * s, 0.3 * s, 0.16 * s]); for (let k = 0; k < 7; k++) { const a = k * 0.9; B.add(SPH, toon(k % 2 ? 0x3f8a34 : 0x2e6a2a), [x + Math.cos(a) * 0.12 * s, y + (0.42 + (k % 3) * 0.1) * s, z + Math.sin(a) * 0.12 * s], [0, 0, 0], [0.13 * s, 0.13 * s, 0.13 * s]); } };
    const mug = (B: Batch, x: number, y: number, z: number, c: number) => { B.add(CYL, toon(c), [x, y + 0.05, z], [0, 0, 0], [0.04, 0.1, 0.04]); B.add(CYL8, toon(c), [x + 0.045, y + 0.05, z], [Math.PI / 2, 0, 0], [0.02, 0.012, 0.02]); };
    const white = toon(0xf4ead6), dark = toon(0x2a2a3a), wood = toon(0x7a4a2a), woodL = toon(0xb07a46);

    // ================= APT =================
    { const B = set(), X = AX, W = 9, D = 7.5, H = 3.2, zb = -4.0, zf = zb + D;
      plane(W, D, toon(0xffffff, planks()), [X, 0, zb + D / 2]);
      plane(W, D, toon(0xf4ead6), [X, H, zb + D / 2]).rotation.x = Math.PI / 2;
      const wp = toon(0xffffff, wallpaper("#2a6a7a", "#3f8a9a"));
      // back wall with a big window opening (x -1.6 .. 1.6, y 0.9 .. 2.9)
      for (const [cx, cy, w, h] of [[X - 3.05, H / 2, 2.9, H], [X + 3.05, H / 2, 2.9, H], [X, 0.45, 3.2, 0.9], [X, 3.05, 3.2, 0.3]] as const) B.add(BOX, wp, [cx, cy, zb - 0.1], [0, 0, 0], [w, h, 0.2]);
      B.add(BOX, wp, [X - W / 2 - 0.1, H / 2, zb + D / 2], [0, 0, 0], [0.2, H, D]); B.add(BOX, wp, [X + W / 2 + 0.1, H / 2, zb + D / 2], [0, 0, 0], [0.2, H, D]);
      B.add(BOX, wp, [X, H / 2, zf + 0.1], [0, 0, 0], [W, H, 0.2]);
      // window frame, sill, mullions, curtains
      for (const [cx, cy, w, h] of [[X, 0.9, 3.4, 0.12], [X, 2.9, 3.4, 0.12], [X - 1.65, 1.9, 0.12, 2.1], [X + 1.65, 1.9, 0.12, 2.1], [X, 1.9, 0.07, 2.0], [X, 1.9, 3.2, 0.06]] as const) B.add(BOX, white, [cx, cy, zb], [0, 0, 0], [w, h, 0.14]);
      B.add(BOX, white, [X, 0.86, zb + 0.18], [0, 0, 0], [3.6, 0.06, 0.4]);
      for (const s of [-1, 1]) for (let k = 0; k < 6; k++) B.add(CYL8, toon(0xe86a2a), [X + s * (1.85 + k * 0.08), 1.7, zb + 0.12 + (k % 2) * 0.04], [0, 0, 0], [0.06, 2.9, 0.06]);
      B.add(CYL8, toon(0x5a3a22), [X, 3.1, zb + 0.14], [0, 0, Math.PI / 2], [0.025, 4.6, 0.025]);
      // window-sill plants, a telescope pointing out
      plant(B, X - 1.3, 0.89, zb + 0.2, 0.8); plant(B, X + 1.25, 0.89, zb + 0.2, 0.7); mug(B, X - 0.9, 0.89, zb + 0.25, 0xd1202f);
      { const tx = X + 0.9, tz = zb + 0.8; for (const a of [0, 2.1, 4.2]) B.beam(dark, [tx, 0.0, tz], [tx + Math.cos(a) * 0.25, 0.0, tz + Math.sin(a) * 0.25], 0.0); for (const a of [0, 2.1, 4.2]) B.beam(woodL, [tx + Math.cos(a) * 0.3, 0, tz + Math.sin(a) * 0.3], [tx, 0.95, tz], 0.03); B.add(CYL, toon(0xf4ead6), [tx, 1.15, tz - 0.15], [-1.0, 0, 0], [0.07, 0.75, 0.07]); B.add(CYL, toon(0x2a4ab0), [tx, 1.32, tz - 0.42], [-1.0, 0, 0], [0.085, 0.12, 0.085]); }
      // ---- bed (left), head at the back-left corner ----
      { const [bx, , bz] = BED; B.add(BOX, wood, [bx, 0.22, bz + 1.1], [0, 0, 0], [1.6, 0.44, 2.4]); B.add(BOX, wood, [bx, 0.65, bz - 0.12], [0, 0, 0], [1.7, 1.3, 0.12]);
        B.add(BOX, white, [bx, 0.52, bz + 1.1], [0, 0, 0], [1.5, 0.18, 2.3]);
        B.add(BOX, toon(0xffffff, quiltTex()), [bx, 0.64, bz + 1.45], [0, 0, 0], [1.56, 0.08, 1.7]); B.add(SPH, toon(0xffffff, quiltTex()), [bx + 0.05, 0.66, bz + 1.4], [0, 0, 0], [0.72, 0.5, 0.95]);
        B.add(SPH, white, [bx - 0.42, 0.66, bz + 0.25], [0, 0, 0], [0.3, 0.1, 0.24]); B.add(SPH, toon(0x4fa3d9), [bx - 0.5, 0.74, bz + 0.0], [0, 0, 0], [0.28, 0.12, 0.12]);
        // headboard stickers (glow stars), nightstand with alarm clock, lamp, books, phone
        for (let k = 0; k < 9; k++) bulbs.push({ p: [bx - 0.7 + k * 0.18, 1.0 + (k % 3) * 0.08, bz - 0.05], order: 0, tint: [0.7, 1, 0.6] });
        const nx = bx + 1.25, nz = bz + 0.1; B.add(BOX, woodL, [nx, 0.3, nz], [0, 0, 0], [0.6, 0.6, 0.5]); B.add(BOX, wood, [nx, 0.32, nz + 0.26], [0, 0, 0], [0.5, 0.18, 0.02]);
        B.add(BOX, dark, [nx - 0.1, 0.68, nz + 0.05], [0, 0, 0], [0.24, 0.14, 0.1]); vplane(0.2, 0.1, glow(clockTex()), [nx - 0.1, 0.68, nz + 0.101]);
        B.add(CYL, toon(0xf2c14e), [nx + 0.15, 0.66, nz - 0.05], [0, 0, 0], [0.06, 0.12, 0.06]); B.add(CYL8, toon(0xf2c14e), [nx + 0.15, 0.82, nz - 0.05], [0, 0, 0], [0.01, 0.25, 0.01]);
        { const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.17, 0.2, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd890, side: THREE.DoubleSide, toneMapped: false })); sh.position.set(nx + 0.15, 1.0, nz - 0.05); sh.layers.set(NOINK); R.add(sh); this.lamp.position.set(nx + 0.15, 1.05, nz + 0.2); R.add(this.lamp); }
        books(B, nx - 0.28, nx + 0.0, 0.6, nz - 0.12, 5); }
      // ---- desk (right of the window) with laptop, monitor, mugs, sticky notes, a lamp; chair ----
      { const dx = CHAIR[0], dz = LAPTOP[2] + 0.05; B.add(BOX, woodL, [dx, 0.76, dz], [0, 0, 0], [1.8, 0.05, 0.8]); for (const sx of [-0.85, 0.85]) for (const sz of [-0.35, 0.35]) B.add(BOX, dark, [dx + sx, 0.38, dz + sz], [0, 0, 0], [0.05, 0.76, 0.05]);
        B.add(BOX, woodL, [dx + 0.6, 0.5, dz], [0, 0, 0], [0.5, 0.5, 0.7]); for (let k = 0; k < 2; k++) B.add(BOX, wood, [dx + 0.6, 0.4 + k * 0.22, dz + 0.36], [0, 0, 0], [0.42, 0.16, 0.02]);
        // laptop: base + screen (lid) facing the chair (-z), apple-less glowing lid logo seen from the front
        const [lx, ly, lz] = LAPTOP; B.add(BOX, toon(0x9aa0b0), [lx, 0.8, lz - 0.15], [0, 0, 0], [0.5, 0.025, 0.34]); B.add(BOX, toon(0x9aa0b0), [lx, 0.98, lz + 0.02], [0.25, 0, 0], [0.5, 0.34, 0.02]);
        this.screenMat = new THREE.MeshBasicMaterial({ map: auctionTex(), toneMapped: false }); this.screenMat.map!.repeat.set(1, 0.36); this.screenMat.map!.offset.set(0, 0.64);
        const scr = vplane(0.46, 0.3, this.screenMat, [lx, ly, lz + 0.008], Math.PI); scr.rotation.x = 0.25; scr.layers.set(NOINK);
        { const logo = vplane(0.06, 0.06, new THREE.MeshBasicMaterial({ color: 0xbfe0ff, toneMapped: false }), [lx, ly, lz + 0.034]); logo.rotation.x = 0.25; logo.layers.set(NOINK); }
        this.screen.position.set(lx, ly + 0.1, lz - 0.45); R.add(this.screen);
        // monitor with code, keyboard, mugs, pizza slice, sticky notes, desk lamp
        B.add(BOX, dark, [dx - 0.95, 1.1, dz + 0.1], [0, 0.6, 0], [0.6, 0.38, 0.03]); B.add(BOX, dark, [dx - 0.95, 0.88, dz + 0.1], [0, 0, 0], [0.05, 0.2, 0.05]);
        { const m = vplane(0.55, 0.33, glow(tex(128, 80, (g) => { g.fillStyle = "#14183a"; g.fillRect(0, 0, 128, 80); for (let y = 6; y < 76; y += 7) { g.fillStyle = ["#7ad8ff", "#f2c14e", "#e8538a", "#8aff8a"][(y / 7) % 4 | 0]; g.fillRect(8 + ((y * 13) % 20), y, 30 + ((y * 29) % 60), 3); } })), [dx - 0.95 - 0.012, 1.1, dz + 0.1 - 0.018], Math.PI + 0.6); m.layers.set(NOINK); }
        mug(B, dx - 0.2, 0.785, dz - 0.25, 0xf2c14e); mug(B, dx + 0.75, 0.785, dz + 0.2, 0x2e9a5a); mug(B, dx + 0.55, 0.785, dz - 0.3, 0xe8538a);
        B.add(CONE, toon(0xf2c14e), [dx - 0.7, 0.79, dz - 0.15], [Math.PI / 2, 0, 0.5], [0.12, 0.25, 0.01]); for (let k = 0; k < 3; k++) B.add(SPH, toon(0xd1202f), [dx - 0.72 + k * 0.04, 0.8, dz - 0.15 + (k - 1) * 0.04], [0, 0, 0], [0.02, 0.01, 0.02]);
        for (let k = 0; k < 7; k++) B.add(BOX, toon([0xf2e04e, 0xf28ab0, 0x8ae0f2, 0xa8f28a][k % 4]), [X + 3.2 + (k % 4) * 0.22, 1.5 + Math.floor(k / 4) * 0.25, zb + 0.01], [0, 0, (rnd(k) - 0.5) * 0.3], [0.16, 0.16, 0.01]);
        B.add(CYL, dark, [dx + 0.75, 0.8, dz - 0.05], [0, 0, 0], [0.08, 0.03, 0.08]); B.beam(dark, [dx + 0.75, 0.8, dz - 0.05], [dx + 0.6, 1.25, dz + 0.0], 0.02); B.add(CONE, toon(0xd1202f), [dx + 0.55, 1.22, dz - 0.05], [0.5, 0, 0.6], [0.08, 0.14, 0.08]);
        // desk chair
        const [cx, , cz] = CHAIR; B.add(BOX, toon(0xd1202f), [cx, 0.5, cz], [0, 0, 0], [0.5, 0.08, 0.5]); B.add(BOX, toon(0xd1202f), [cx, 0.9, cz - 0.25], [0, 0, 0], [0.5, 0.7, 0.06]); B.add(CYL8, dark, [cx, 0.25, cz], [0, 0, 0], [0.03, 0.5, 0.03]); for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; B.beam(dark, [cx, 0.05, cz], [cx + Math.cos(a) * 0.3, 0.05, cz + Math.sin(a) * 0.3], 0.03); } }
      // ---- shelves on the right wall + left wall, posters, cork board, clock, wall shelf of trophies ----
      for (const [sx, sz, ry] of [[X + 4.35, zb + 2.8, -Math.PI / 2], [X - 4.35, zb + 4.6, Math.PI / 2]] as const) {
        const ax = Math.sin(ry) < 0 ? -1 : 1; void ax;
        for (let k = 0; k < 5; k++) { B.add(BOX, woodL, [sx, 0.15 + k * 0.45, sz], [0, 0, 0], [0.32, 0.04, 1.8]); }
        B.add(BOX, wood, [sx, 1.0, sz - 0.92], [0, 0, 0], [0.34, 2.0, 0.04]); B.add(BOX, wood, [sx, 1.0, sz + 0.92], [0, 0, 0], [0.34, 2.0, 0.04]);
        for (let k = 0; k < 4; k++) { const y = 0.17 + k * 0.45; for (let z = sz - 0.88, i = 0; z < sz + 0.86; i++) { const w = 0.04 + rnd(k * 50 + i + sx) * 0.04, h = 0.22 + rnd(i + k * 7 + sz) * 0.12; B.add(BOX, BOOK[(i + k) % 8], [sx, y + h / 2, z + w / 2], [rnd(i * 3 + k) < 0.08 ? 0.3 : 0, 0, 0], [0.22, h, w]); z += w + 0.004; } }
        B.add(SPH, toon(0x4fa3d9), [sx, 2.25, sz - 0.5], [0, 0, 0], [0.14, 0.14, 0.14]); B.add(CYL8, toon(0xf2c14e), [sx, 2.15, sz - 0.5], [0, 0, 0], [0.05, 0.06, 0.05]); // globe
        plant(B, sx, 1.97, sz + 0.5, 0.8); }
      const PO = (k: number, x: number, y: number, z: number, ry: number, s = 1) => vplane(0.62 * s, 0.88 * s, toon(0xffffff, poster(k)), [x, y, z], ry);
      PO(0, X - 2.6, 2.1, zb + 0.01, 0, 1.1); PO(1, X + 2.6, 2.2, zb + 0.01, 0, 1.0); PO(2, X - 4.39, 2.0, zb + 1.6, Math.PI / 2); PO(3, X - 4.39, 1.9, zb + 2.6, Math.PI / 2, 0.8); PO(4, X + 4.39, 2.3, zb + 5.0, -Math.PI / 2, 1.1); PO(5, X + 2.4, 2.1, zf - 0.01, Math.PI);
      { const c = vplane(0.4, 0.4, toon(0xffffff, tex(64, 64, (g) => { g.fillStyle = "#f4ead6"; g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#1a1a1a"; g.lineWidth = 3; g.stroke(); g.beginPath(); g.moveTo(32, 32); g.lineTo(32, 12); g.moveTo(32, 32); g.lineTo(46, 36); g.stroke(); })), [X - 3.6, 2.7, zb + 0.01]); void c; }
      // fairy lights along the ceiling edges and around the window
      lightString(B, [X - 4.3, 3.05, zb + 0.15], [X + 4.3, 3.05, zb + 0.15], 40, 0.25); lightString(B, [X - 4.3, 3.05, zb + 0.2], [X - 4.3, 3.05, zf - 0.3], 34, 0.3); lightString(B, [X + 4.3, 3.05, zb + 0.2], [X + 4.3, 3.05, zf - 0.3], 34, 0.3);
      lightString(B, [X - 1.8, 3.0, zb + 0.22], [X + 1.8, 3.0, zb + 0.22], 22, 0.35, true);
      // floor clutter: rug, beanbag, pizza boxes, laundry pile, sneakers, guitar, mini fridge, dumbbell, backpack, cables
      { const r = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), toon(0xffffff, rugTex())); r.rotation.x = -Math.PI / 2; r.position.set(X - 0.1, 0.01, zb + 3.2); r.receiveShadow = true; R.add(r); }
      B.add(SPH, toon(0xf2a020), [X - 0.6, 0.3, zb + 4.3], [0, 0, 0], [0.55, 0.32, 0.5]);
      for (let k = 0; k < 4; k++) { B.add(BOX, toon(0xe8d0a0), [X + 0.5 + (k % 2) * 0.1, 0.03 + k * 0.05, zb + 3.6 + (k % 2) * 0.05], [0, k * 0.3, 0], [0.5, 0.045, 0.5]); B.add(BOX, toon(0xd1202f), [X + 0.5 + (k % 2) * 0.1, 0.056 + k * 0.05, zb + 3.6 + (k % 2) * 0.05], [0, k * 0.3, 0], [0.3, 0.003, 0.1]); }
      for (let k = 0; k < 9; k++) B.add(SPH, toon([0x4fa3d9, 0xf4ead6, 0xe8538a, 0x2a2a3a, 0xf2c14e][k % 5]), [X - 3.6 + rnd(k + 300) * 0.6, 0.08 + (k % 3) * 0.08, zb + 3.6 + rnd(k + 301) * 0.5], [0, rnd(k), 0], [0.25, 0.08, 0.18]);
      for (const s of [0, 1]) B.add(BOX, toon(s ? 0xf4ead6 : 0xd1202f), [X - 1.5 + s * 0.22, 0.05, zb + 2.0], [0, 0.4, 0], [0.12, 0.1, 0.3]);
      { const gx = X + 4.1, gz = zb + 1.0; B.add(SPH, toon(0xc0602e), [gx, 0.35, gz], [0, 0, -0.15], [0.2, 0.26, 0.08]); B.add(SPH, toon(0xc0602e), [gx + 0.04, 0.62, gz], [0, 0, -0.15], [0.15, 0.18, 0.08]); B.add(BOX, dark, [gx + 0.12, 1.0, gz], [0, 0, -0.15], [0.05, 0.6, 0.03]); }
      B.add(BOX, toon(0xf4f4f8), [X + 3.6, 0.42, zb + 4.2], [0, 0, 0], [0.55, 0.84, 0.55]); B.add(BOX, dark, [X + 3.32, 0.55, zb + 4.2], [0, 0, 0], [0.02, 0.3, 0.04]);
      for (let k = 0; k < 6; k++) B.add(CYL, toon([0xd1202f, 0x2e9a5a, 0xf2c14e][k % 3]), [X + 3.45 + (k % 3) * 0.12, 0.92, zb + 4.1 + Math.floor(k / 3) * 0.12], [0, 0, 0], [0.04, 0.14, 0.04]);
      B.add(BOX, toon(0x2a4ab0), [X - 1.6, 0.25, zb + 0.45], [0.2, 0.4, 0], [0.4, 0.5, 0.25]);
      plant(B, X - 4.0, 0, zb + 0.4, 1.8); plant(B, X + 4.0, 0, zf - 0.5, 1.6);
      // the front door (lawyer later) on the front wall
      B.add(BOX, toon(0x8a3a2a), [X - 2.6, 1.05, zf - 0.02], [0, 0, 0], [1.0, 2.1, 0.06]); B.add(SPH, toon(0xf2c14e), [X - 2.2, 1.05, zf - 0.07], [0, 0, 0], [0.04, 0.04, 0.04]);
      // ---- outside the window: a close row of towers with lit windows, a far skyline ----
      for (let k = 0; k < 26; k++) { const x = X - 60 + k * 4.8 + rnd(k) * 2, h = 10 + rnd(k + 1) * 30, z = zb - 14 - rnd(k + 2) * 10, w = 3.5 + rnd(k + 3) * 2;
        const m = toon(0xffffff, skylineTex(k * 13, ["#3a3a6a", "#4a3a5a", "#2a4a6a", "#5a4a7a"][k % 4])); (m.map as THREE.Texture).wrapS = (m.map as THREE.Texture).wrapT = THREE.RepeatWrapping; (m.map as THREE.Texture).repeat.set(Math.round(w / 2), Math.round(h / 4));
        B.add(BOX, m, [x, h / 2 - 8, z], [0, 0, 0], [w, h, 4]); if (k % 3 === 0) { B.add(CYL, toon(0x6a4a3a), [x, h - 8 + 0.8, z], [0, 0, 0], [0.8, 1.6, 0.8]); B.add(CONE, toon(0x6a4a3a), [x, h - 8 + 2, z], [0, 0, 0], [0.9, 0.6, 0.9]); }
        if (k % 4 === 1) { B.add(CYL8, toon(0x9a9aaa), [x + 0.5, h - 8 + 2, z], [0, 0, 0], [0.04, 4, 0.04]); bulbs.push({ p: [x + 0.5, h - 8 + 4.1, z], order: 0, tint: [1, 0.2, 0.2] }); } }
      for (let k = 0; k < 40; k++) { const x = X - 140 + k * 7, h = 20 + rnd(k + 70) * 60, z = zb - 60 - rnd(k + 71) * 40;
        const m = toon(0xffffff, skylineTex(k * 7 + 500, "#2a2a5a")); (m.map as THREE.Texture).wrapS = (m.map as THREE.Texture).wrapT = THREE.RepeatWrapping; (m.map as THREE.Texture).repeat.set(3, Math.round(h / 6)); B.add(BOX, m, [x, h / 2 - 8, z], [0, 0, 0], [6, h, 6]); }
    }

    // ================= CITY ROOFTOP =================
    { const B = set(), X = CX;
      plane(40, 30, toon(0xffffff, tex(128, 128, (g) => { g.fillStyle = "#5a5468"; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 160; i++) { g.fillStyle = rnd(i) < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.1)"; g.fillRect(rnd(i + 1) * 128, rnd(i + 2) * 128, 5, 3); } g.strokeStyle = "rgba(0,0,0,0.2)"; for (let x = 0; x < 128; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(128, x); g.stroke(); } }, [10, 8])), [X, 0, 0]);
      // parapet with string lights, water tanks, AC boxes, chimneys, antennas, laundry, plants, a couch
      for (const [cx, cz, w, d] of [[X, -12, 30, 0.4], [X - 15, 0, 0.4, 24], [X + 15, 0, 0.4, 24]] as const) B.add(BOX, toon(0x8a7a8a), [cx, 0.5, cz], [0, 0, 0], [w, 1, d]);
      lightString(B, [X - 14.8, 1.05, -11.8], [X + 14.8, 1.05, -11.8], 60, 0.1, true);
      for (let x = -12; x <= 12; x += 6) lightString(B, [X + x, 3.2, -11.6], [X + x + 3, 3.2, 8], 30, 0.9);
      for (let x = -12; x <= 12; x += 6) B.add(CYL8, toon(0x3a3a4a), [X + x, 1.6, -11.6], [0, 0, 0], [0.05, 3.2, 0.05]);
      for (const [tx, tz] of [[X - 9, -7], [X + 10, -8]] as const) { for (const [a, b] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) B.add(CYL8, toon(0x4a3a3a), [tx + a, 1.2, tz + b], [0, 0, 0], [0.08, 2.4, 0.08]); B.add(CYL, toon(0x9a6a4a), [tx, 3.6, tz], [0, 0, 0], [1.4, 2.4, 1.4]); B.add(CONE, toon(0x6a4a3a), [tx, 5.2, tz], [0, 0, 0], [1.5, 0.9, 1.5]); for (let k = 0; k < 4; k++) B.add(CYL, toon(0x5a3a2a), [tx, 2.6 + k * 0.7, tz], [0, 0, 0], [1.43, 0.05, 1.43]); }
      for (let k = 0; k < 6; k++) { const x = X - 12 + k * 4.6, z = -10 + (k % 2) * 1.2; B.add(BOX, toon(0xc8c8d0), [x, 0.45, z], [0, 0, 0], [1.1, 0.9, 0.8]); B.add(CYL, toon(0x5a5a6a), [x, 0.9, z], [0, 0, 0], [0.35, 0.02, 0.35]); }
      for (const [ax, az, h] of [[X - 4, -9, 6], [X + 5, -10, 8], [X + 13, -4, 5]] as const) { B.add(CYL8, toon(0xa0a0b0), [ax, h / 2, az], [0, 0, 0], [0.05, h, 0.05]); for (let k = 0; k < 4; k++) B.add(BOX, toon(0xa0a0b0), [ax, h * 0.6 + k * 0.4, az], [0, 0, 0], [1.2 - k * 0.2, 0.03, 0.03]); bulbs.push({ p: [ax, h + 0.1, az], order: 0, tint: [1, 0.2, 0.2] }); }
      for (let k = 0; k < 2; k++) { B.beam(toon(0xf4ead6), [X - 13, 1.9, -2 + k * 3], [X - 4, 1.9, -2 + k * 3], 0.01); for (let q = 0; q < 6; q++) B.add(BOX, toon([0xd1202f, 0x4fa3d9, 0xf2c14e, 0xf4ead6, 0x2e9a5a, 0xe8538a][(q + k) % 6]), [X - 12.3 + q * 1.4, 1.55, -2 + k * 3], [0, 0, 0], [0.7, 0.7 + (q % 2) * 0.2, 0.02]); }
      for (const [px, pz] of [[X - 14, -11], [X - 14, 6], [X + 14, -11], [X + 14, 6], [X + 6, 4], [X - 2, -6]] as const) plant(B, px, 0, pz, 2.2);
      { const cx = X + 2, cz = -1; B.add(BOX, toon(0x2e7a6a), [cx, 0.3, cz], [0, 0, 0], [2.2, 0.4, 0.9]); B.add(BOX, toon(0x2e7a6a), [cx, 0.75, cz - 0.4], [0, 0, 0], [2.2, 0.6, 0.2]); for (const s of [-1, 1]) B.add(BOX, toon(0x2e7a6a), [cx + s * 1.05, 0.55, cz], [0, 0, 0], [0.2, 0.4, 0.9]); B.add(BOX, toon(0xf2c14e), [cx - 0.5, 0.6, cz - 0.2], [0.3, 0, 0], [0.4, 0.4, 0.12]); B.add(BOX, woodL, [cx, 0.25, cz + 1.0], [0, 0, 0], [1.0, 0.5, 0.5]); mug(B, cx + 0.2, 0.5, cz + 1.0, 0xd1202f); }
      // neon signs on the neighbouring buildings
      for (const [nx, ny, nz, txt, col] of [[X - 8, 9, -26, "PIZZA", "#ff4a8a"], [X + 12, 13, -30, "HOTEL", "#4ae0ff"], [X - 20, 15, -40, "24/7", "#f2e04e"], [X + 26, 8, -22, "NOODLES", "#8aff60"]] as const) { const m = vplane(5, 1.9, glow(neonTex(txt, col)), [nx, ny, nz]); m.layers.set(NOINK); }
      // the skyline all around (dense, lit windows), billboards
      for (let ring = 0; ring < 3; ring++) for (let k = 0; k < 30; k++) { const a = -Math.PI * 0.95 + (k / 30) * Math.PI * 0.9 - ring * 0.05, r = 26 + ring * 22 + rnd(k + ring * 50) * 10, x = X + Math.cos(a) * r * 1.4, z = Math.sin(a) * r, h = 8 + rnd(k + 200 + ring) * (16 + ring * 20), w = 5 + rnd(k + 1) * 4;
        const m = toon(0xffffff, skylineTex(k * 17 + ring * 300, ["#3a3a6a", "#4a3a5a", "#2a4a6a", "#5a4a7a"][(k + ring) % 4])); (m.map as THREE.Texture).wrapS = (m.map as THREE.Texture).wrapT = THREE.RepeatWrapping; (m.map as THREE.Texture).repeat.set(Math.round(w / 2), Math.round(h / 4));
        B.add(BOX, m, [x, h / 2 - 12, z], [0, -a, 0], [w, h, w]); if ((k + ring) % 5 === 0) { B.add(CONE, toon(0x5a4a6a), [x, h - 12 + 2.5, z], [0, 0, 0], [w * 0.4, 5, w * 0.4]); bulbs.push({ p: [x, h - 12 + 5.2, z], order: 0, tint: [1, 0.3, 0.3] }); } }
    }

    for (const B of sets) { const g = new THREE.Group(); B.build(g); g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } }); R.add(g); }
    this.bulbs = new Flames(R, bulbs, 0.16);
    // the Moon: a huge glowing disc-sphere with craters and a soft halo, one per set
    const halo = tex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, "rgba(255,245,220,0.55)"); gr.addColorStop(0.5, "rgba(200,190,255,0.18)"); gr.addColorStop(1, "rgba(160,150,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
    const MT = moonTex();
    for (const [p, r] of [[MOON_APT, 46], [MOON_CITY, 44]] as const) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), new THREE.MeshBasicMaterial({ map: MT, fog: false, toneMapped: false })); m.position.set(...p); m.rotation.y = -0.4; m.layers.set(NOINK); R.add(m); this.moons.push(m);
      const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false })); h.position.set(...p); h.scale.set(r * 4.2, r * 4.2, 1); h.layers.set(NOINK); R.add(h); this.halos.push(h); }
    void dotTex; void CONE;
    for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xffa850, 0, 10, 1.6); R.add(l); this.warm.push(l); }
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.03;
    R.add(this.hemi, this.sun, this.sun.target);
  }

  /** scroll: the auction page scroll 0..1; screen: laptop glow 0..1 */
  set(o: { light: LightName; t: number; px: number; cam: V3; look: V3; warm?: V3[]; shadowR?: number; scroll?: number; screen?: number }) {
    const L = o.light;
    this.sky.position.set(...o.cam);
    this.skyMat.map = this.skies[L]; this.skyMat.needsUpdate = true;
    (this.stars.material as THREE.MeshBasicMaterial).opacity = L === "morning" ? 0.1 : 1;
    const P = {
      morning: { hs: 0xffe0c8, hg: 0x7a5a6a, hi: 1.6, sc: 0xffc890, si: 2.0, sd: [0.2, 0.45, -1], fog: 0xf0b0a0, fn: 60, ff: 400 },
      night: { hs: 0x8a90e0, hg: 0x4a3a5a, hi: 1.15, sc: 0xc8c8ff, si: 0.9, sd: [0.15, 0.6, -1], fog: 0x2a2a6a, fn: 60, ff: 500 },
      close: { hs: 0x9a98e8, hg: 0x5a4a5a, hi: 1.3, sc: 0xc8c8ff, si: 0.9, sd: [0.15, 0.6, -1], fog: 0x2a2a6a, fn: 60, ff: 500 },
      city: { hs: 0x9a90e8, hg: 0x4a3a5a, hi: 1.3, sc: 0xd8d0ff, si: 1.1, sd: [0.1, 0.5, -1], fog: 0x3a3070, fn: 60, ff: 420 },
    }[L];
    this.hemi.color.set(P.hs); this.hemi.groundColor.set(P.hg); this.hemi.intensity = P.hi;
    this.sun.color.set(P.sc); this.sun.intensity = P.si;
    const sd = new THREE.Vector3(...(P.sd as V3)).normalize(), r = o.shadowR ?? 12;
    this.sun.target.position.set(...o.look); this.sun.position.copy(this.sun.target.position).addScaledVector(sd, 60); this.sun.target.updateMatrixWorld();
    const sc = this.sun.shadow.camera; sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 5; sc.far = 160; sc.updateProjectionMatrix();
    this.fog.color.set(P.fog); this.fog.near = P.fn; this.fog.far = P.ff;
    const f = this.bulbs; f.mat.uniforms.uTime.value = o.t * 0.3; f.mat.uniforms.uPx.value = o.px; f.mat.uniforms.uLit.value = 2;
    const fl = 0.95 + 0.05 * Math.sin(o.t * 7);
    this.lamp.intensity = L === "morning" ? 1.5 : 6;
    this.screen.intensity = 5 * (o.screen ?? (L === "morning" ? 0 : 1)) * (0.97 + 0.03 * Math.sin(o.t * 13));
    this.screenMat.map!.offset.set(0, 0.64 - 0.5 * (o.scroll ?? 0));
    for (const m of this.halos) (m.material as THREE.SpriteMaterial).opacity = L === "morning" ? 0.25 : 1;
    for (const m of this.moons) (m.material as THREE.MeshBasicMaterial).color.setScalar(L === "morning" ? 0.85 : 1);
    this.warm.forEach((l, i) => { const w = o.warm?.[i]; l.intensity = w ? 5 * fl : 0; if (w) l.position.set(...w); });
  }
}
