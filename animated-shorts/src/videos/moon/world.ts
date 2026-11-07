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
import { Batch, V3, rnd, canvasTex, BOX, CYL, CONE, SPH, CYL8, ICO } from "../eiffel/lib";
import { ASSETS, EnvName } from "../../lib/realism/assets";
import { std, photo, M } from "../../lib/realism/materials";
import { grit, woodFloor, wallPaper, rug, concrete, regolith, fabric } from "../../lib/realism/textures";
import { wbox, wplane, rbox } from "../../lib/realism/geo";
import { building, street, BRICKS, Glow } from "../../lib/realism/kit-city";
import { FONT, font, drawNeon, drawBoard } from "../../lib/realism/type";
const toon = std;

export type LightName = "morning" | "night" | "close" | "city" | "casino" | "nasa" | "space" | "street" | "press" | "office";
export const AX = 0, CX = 400, KX = 800, NX = 1200, MX = 1600, SX = 2000, PX = 2400, OX = 2800;
/** the gambler's table, the podium, Kevin's cubicle, the Moon hotel centre, Earth in the Moon sky */
export const BOOTHZ = -6.6;
export const TABLE: V3 = [KX, 0, 0], PODIUM: V3 = [PX, 0.4, -3.6], KC: V3 = [OX, 0, 2], HOTEL: V3 = [MX, 0, -34], EARTH: V3 = [MX - 90, 70, -320];
/** the bed (head end), Kevin's desk chair, the laptop screen centre, the window centre */
export const BED: V3 = [AX - 2.2, 0, -1.6];
export const CHAIR: V3 = [AX + 1.6, 0, -2.0];
export const LAPTOP: V3 = [AX + 1.6, 0.98, -1.25];
export const WIN: V3 = [AX, 1.9, -4.0];
/** the Moon's centre (apartment and city) */
export const MOON_APT: V3 = [AX + 40, 120, -520], MOON_CITY: V3 = [CX + 10, 70, -260];
export const ROOF: V3 = [CX, 0, 0];
type Pt = { p: V3; order: number; tint?: V3 };

/** painted canvas texture with a fine grain overlay (no flat cartoon fills) */
const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => canvasTex(w, h, (g) => { draw(g); grit(g, w, h, 0.28, (w * 7 + h) % 13); }, repeat);
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
  g.fillStyle = "#2a5ad9"; g.fillRect(0, 0, 512, 70); g.fillStyle = "#fff"; g.font = `800 36px ${FONT.ui}`; g.fillText("BIDZILLA", 20, 48);
  g.fillStyle = "#fff"; g.fillRect(230, 18, 262, 34);
  const items = ["#e86a2a", "#2e9a5a", "#8a4ab0", "#d1202f", "MOON", "#4fa3d9", "#f2c14e", "#2a2a4a", "#e8538a", "#1f6a7a"];
  items.forEach((it, i) => { const x = 16 + (i % 2) * 248, y = 90 + Math.floor(i / 2) * 186;
    g.fillStyle = it === "MOON" ? "#fff6c0" : "#ffffff"; g.fillRect(x, y, 232, 172); g.strokeStyle = it === "MOON" ? "#f2a020" : "#d0d0dc"; g.lineWidth = it === "MOON" ? 6 : 2; g.strokeRect(x, y, 232, 172);
    if (it === "MOON") { g.fillStyle = "#14143a"; g.fillRect(x + 10, y + 10, 212, 104); g.fillStyle = "#f2ead2"; g.beginPath(); g.arc(x + 116, y + 62, 40, 0, Math.PI * 2); g.fill(); g.fillStyle = "rgba(120,110,100,0.5)"; g.beginPath(); g.arc(x + 104, y + 54, 9, 0, Math.PI * 2); g.arc(x + 130, y + 74, 12, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#1a1a1a"; g.font = `800 24px ${FONT.ui}`; g.fillText("MOON FOR SALE", x + 14, y + 140); g.fillStyle = "#2e9a5a"; g.font = `800 22px ${FONT.ui}`; g.fillText("$10", x + 14, y + 164); }
    else { g.fillStyle = it; g.fillRect(x + 10, y + 10, 212, 104); g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.arc(x + 116, y + 62, 30, 0, Math.PI * 2); g.fill(); g.fillStyle = "#6a6a7a"; g.fillRect(x + 14, y + 128, 150, 12); g.fillStyle = "#2e9a5a"; g.fillRect(x + 14, y + 150, 60, 12); } });
});
const emailTex = () => tex(512, 1024, (g) => {
  g.fillStyle = "#f4f4f8"; g.fillRect(0, 0, 512, 1024); g.fillStyle = "#d1202f"; g.fillRect(0, 0, 512, 70); g.fillStyle = "#fff"; g.font = `800 34px ${FONT.ui}`; g.fillText("INBOX (1)", 20, 48);
  g.fillStyle = "#fff6c0"; g.fillRect(16, 90, 480, 270); g.strokeStyle = "#f2a020"; g.lineWidth = 5; g.strokeRect(16, 90, 480, 270);
  g.fillStyle = "#2e9a5a"; g.font = `800 38px ${FONT.ui}`; g.fillText("CONGRATULATIONS!", 34, 150); g.fillStyle = "#1a1a1a"; g.font = `800 24px ${FONT.ui}`; g.fillText("You are now the", 34, 200); g.fillText("LEGAL OWNER", 34, 240); g.fillText("of the MOON.", 34, 280);
  g.fillStyle = "#f2ead2"; g.beginPath(); g.arc(420, 260, 50, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#a8a090"; g.lineWidth = 3; g.stroke();
  for (let y = 0; y < 2; y++) { g.fillStyle = "#c8c8d4"; g.fillRect(34, 310 + y * 18, 300 - y * 80, 8); }
});
const refundTex = () => tex(512, 1024, (g) => {
  g.fillStyle = "#f4f4f8"; g.fillRect(0, 0, 512, 1024); g.fillStyle = "#2a5ad9"; g.fillRect(0, 0, 512, 70); g.fillStyle = "#fff"; g.font = `800 36px ${FONT.ui}`; g.fillText("BIDZILLA", 20, 48);
  g.fillStyle = "#ffe0e0"; g.fillRect(16, 100, 480, 250); g.strokeStyle = "#d1202f"; g.lineWidth = 6; g.strokeRect(16, 100, 480, 250);
  g.fillStyle = "#d1202f"; g.font = `800 50px ${FONT.ui}`; g.fillText("NO REFUNDS", 70, 200); g.fillStyle = "#1a1a1a"; g.font = `800 24px ${FONT.ui}`; g.fillText("All sales are final.", 120, 260); g.fillStyle = "#6a6a7a"; g.fillText("Item: The Moon", 150, 310);
});
const skylineTex = (seed: number, base: string) => tex(128, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 128, 256);
  for (let y = 10; y < 250; y += 20) for (let x = 8; x < 124; x += 18) { const on = rnd(seed + x * 7 + y) < 0.55; g.fillStyle = on ? (rnd(seed + x + y * 3) < 0.7 ? "#ffd27a" : "#9ad8ff") : "rgba(10,10,30,0.55)"; g.fillRect(x, y, 10, 12); }
}, [1, 1]);
const neonTex = (txt: string, col: string, style: "modern" | "luxury" = "modern") => canvasTex(768, 256, (g) => drawNeon(g, 768, 256, txt, col, style));
const clockTex = () => tex(128, 64, (g) => { g.fillStyle = "#1a1a1a"; g.fillRect(0, 0, 128, 64); g.fillStyle = "#ff3a2a"; g.font = `500 40px ${FONT.mono}`; g.fillText("7:00", 14, 46); });
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
  screenMat: THREE.MeshBasicMaterial; screenTex: THREE.Texture[] = [];
  moons: THREE.Mesh[] = []; halos: THREE.Sprite[] = []; papers = new THREE.Group();
  /** which HDRI lights the scene (set per light, applied by Moon.tsx as scene.environment) */
  env: EnvName = "night"; envI = 1;

  constructor() {
    const R = this.root;
    this.skies = { morning: skyTex("#4a7ad0", "#f0a0b0", "#ffd0a0"), night: skyTex("#0c0a30", "#2a2470", "#5a4aa0"), close: skyTex("#0c0a30", "#2a2470", "#5a4aa0"), city: skyTex("#0a0a2a", "#2a2a7a", "#7a5ab0"), casino: skyTex("#1a0810", "#1a0810", "#1a0810"), nasa: skyTex("#0a1020", "#0a1020", "#0a1020"), space: skyTex("#000004", "#04040e", "#0a0a1a"), street: skyTex("#0a0a2a", "#2a2a7a", "#7a5ab0"), press: skyTex("#0a0a14", "#0a0a14", "#0a0a14"), office: skyTex("#5a9ae0", "#a8d0f0", "#e0f0ff") };
    // photographic skies (HDRI, tone-mapped): sunrise clouds for day, a starry sky with city glow for night
    const A = ASSETS!; this.skies.morning = this.skies.office = A.sky.morning; this.skies.night = this.skies.close = this.skies.city = this.skies.street = A.sky.night;
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 48, 24), this.skyMat); this.sky.layers.set(NOINK); R.add(this.sky);
    this.stars = new THREE.Mesh(new THREE.SphereGeometry(1300, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: starsTex(), transparent: true, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false })); this.stars.layers.set(NOINK); this.sky.add(this.stars);
    const bulbs: Pt[] = [];
    const glowTo: Glow = (p, tint) => bulbs.push({ p, order: 0, tint });
    const sets: Batch[] = [];
    const set = () => { const b = new Batch(); sets.push(b); return b; };
    const vplane = (w: number, h: number, m: THREE.Material, p: V3, ry = 0) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); q.position.set(...p); q.rotation.y = ry; R.add(q); return q; };
    const pplane = (w: number, d: number, m: THREE.Material, p: V3, tile = 2) => { const q = new THREE.Mesh(wplane(w, d, tile), m); q.rotation.set(-Math.PI / 2, 0, 0); q.position.set(...p); q.receiveShadow = true; R.add(q); return q; };
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
      pplane(W, D, photo("WoodFloor007", { tint: 0xffffff, rough: 0.55, normal: 1.05 }), [X, 0, zb + D / 2], 1.6); void woodFloor;
      plane(W, D, toon(0xf4ead6), [X, H, zb + D / 2]).rotation.x = Math.PI / 2;
      const wp = photo("Plaster001", { tint: 0x8ab4b4, rough: 0.92, normal: 0.84 }); void wallPaper;
      // back wall with a big window opening (x -1.6 .. 1.6, y 0.9 .. 2.9)
      for (const [cx, cy, w, h] of [[X - 3.05, H / 2, 2.9, H], [X + 3.05, H / 2, 2.9, H], [X, 0.45, 3.2, 0.9], [X, 3.05, 3.2, 0.3]] as const) B.add(wbox(w, h, 0.2, 1.6), wp, [cx, cy, zb - 0.1]);
      B.add(wbox(0.2, H, D, 1.6), wp, [X - W / 2 - 0.1, H / 2, zb + D / 2]); B.add(wbox(0.2, H, D, 1.6), wp, [X + W / 2 + 0.1, H / 2, zb + D / 2]);
      B.add(wbox(W, H, 0.2, 1.6), wp, [X, H / 2, zf + 0.1]);
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
        B.add(BOX, toon(0xffffff, fabric("#c8506a", [3, 3], "#e8d8b8")), [bx, 0.64, bz + 1.45], [0, 0, 0], [1.56, 0.08, 1.7]); B.add(SPH, toon(0xffffff, fabric("#c8506a", [3, 3], "#e8d8b8")), [bx + 0.05, 0.66, bz + 1.4], [0, 0, 0], [0.72, 0.5, 0.95]);
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
        this.screenTex = [auctionTex(), emailTex(), refundTex()]; this.screenMat = new THREE.MeshBasicMaterial({ map: this.screenTex[0], toneMapped: false }); for (const t of this.screenTex) t.repeat.set(1, 0.36); this.screenTex[0].offset.set(0, 0.64);
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
      { void rug; const r = new THREE.Mesh(wplane(3.2, 2.2, 1.1), photo("Fabric009", { tint: 0xd8a0a0, rough: 0.95, normal: 1.4 })); r.rotation.x = -Math.PI / 2; r.position.set(X - 0.1, 0.01, zb + 3.2); r.receiveShadow = true; R.add(r); }
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
      for (let k = 0; k < 16; k++) { const w = 7 + rnd(k + 3) * 5, x = X - 46 + k * 6.2 + rnd(k) * 1.5, h = 14 + rnd(k + 1) * 26, z = zb - 16 - rnd(k + 2) * 8;
        building(B, { x, z, w, h, d: 9, y0: -9, skin: BRICKS[k % BRICKS.length], seed: k + 11, near: true, night: true }, glowTo); }
      for (let k = 0; k < 30; k++) { const w = 8 + rnd(k + 70) * 6, h = 24 + rnd(k + 71) * 60; building(B, { x: X - 130 + k * 9, z: zb - 55 - rnd(k + 72) * 40, w, h, d: 10, y0: -9, skin: BRICKS[(k + 3) % BRICKS.length], seed: k + 300, night: true }); }
    }

    // ================= CITY ROOFTOP =================
    { const B = set(), X = CX;
      pplane(40, 30, photo("Concrete010", { tint: 0xd8d4d0, rough: 0.9, normal: 1.4 }), [X, 0, 0], 3);
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
      for (let ring = 0; ring < 3; ring++) for (let k = 0; k < 22; k++) { const a = -Math.PI * 0.95 + (k / 22) * Math.PI * 0.9 - ring * 0.06, rr = 28 + ring * 24 + rnd(k + ring * 50) * 8, x = X + Math.cos(a) * rr * 1.4, z = Math.sin(a) * rr, h = 12 + rnd(k + 200 + ring) * (16 + ring * 24), w = 8 + rnd(k + 1) * 5;
        building(B, { x, z, w, h, d: 9, ry: Math.atan2(X - x, -z), y0: -14, skin: BRICKS[(k + ring * 2) % BRICKS.length], seed: k + ring * 40 + 600, near: ring === 0, night: true }, glowTo); }
    }

    // ================= CASINO (the previous owner's gambling debts) =================
    { const B = set(), X = KX;
      pplane(26, 20, photo("Carpet013", { tint: 0xc8a0a0, rough: 0.95, normal: 1.4 }), [X, 0, 0], 1.2);
      plane(26, 20, toon(0x2a0a1a), [X, 5, 0]).rotation.x = Math.PI / 2;
      const panel = photo("Fabric009", { tint: 0xb07070, rough: 0.85, normal: 1.05 });
      B.add(wbox(26, 5, 0.3, 2.0), panel, [X, 2.5, -9]); B.add(wbox(0.3, 5, 20, 2.0), panel, [X - 13, 2.5, 0]); B.add(wbox(0.3, 5, 20, 2.0), panel, [X + 13, 2.5, 0]); B.add(wbox(26, 5, 0.3, 2.0), panel, [X, 2.5, 10]);
      // slot machines along the back and side walls
      const slotScr = glow(tex(64, 64, (g) => { g.fillStyle = "#14102a"; g.fillRect(0, 0, 64, 64); for (let k = 0; k < 3; k++) { g.fillStyle = "#f4f1ea"; g.fillRect(4 + k * 20, 16, 16, 30); g.fillStyle = ["#d1202f", "#f2c14e", "#2e9a5a"][k]; g.beginPath(); g.arc(12 + k * 20, 31, 6, 0, Math.PI * 2); g.fill(); } }));
      for (let k = 0; k < 16; k++) { const x = X - 11.5 + k * 1.5, z = -8.4; B.add(BOX, toon([0xd1202f, 0x2a4ab0, 0x8a2a9a, 0xe86a2a][k % 4]), [x, 0.9, z], [0, 0, 0], [1.1, 1.8, 0.8]); B.add(BOX, toon(0xe8b84a), [x, 1.95, z], [0, 0, 0], [1.15, 0.3, 0.85]); vplane(0.7, 0.6, slotScr, [x, 1.25, z + 0.41]); B.add(CYL8, toon(0xc0c0c8), [x + 0.62, 1.2, z + 0.1], [0, 0, 0], [0.03, 0.5, 0.03]); B.add(SPH, toon(0xd1202f), [x + 0.62, 1.48, z + 0.1], [0, 0, 0], [0.07, 0.07, 0.07]); for (let q = 0; q < 6; q++) bulbs.push({ p: [x - 0.5 + q * 0.2, 2.12, z + 0.43], order: 0, tint: COL[(q + k) % 5] }); }
      for (const s of [-1, 1]) for (let k = 0; k < 8; k++) { const x = X + s * 12.4, z = -6 + k * 1.6; B.add(BOX, toon([0x2a4ab0, 0xd1202f][k % 2]), [x, 0.9, z], [0, 0, 0], [0.8, 1.8, 1.1]); vplane(0.6, 0.6, slotScr, [x - s * 0.41, 1.25, z], -s * Math.PI / 2); for (let q = 0; q < 5; q++) bulbs.push({ p: [x - s * 0.43, 2.0, z - 0.4 + q * 0.2], order: 0, tint: COL[(q + k) % 5] }); }
      // card tables with green felt, chips, cards; roulette wheel
      const felt = toon(0x1e7a4a), chipC = [0xd1202f, 0x2a4ab0, 0x1a1a1a, 0xf4f1ea, 0x2e9a5a].map((c) => toon(c));
      for (const [tx, tz] of [[X, 0], [X - 6, -3], [X + 6, -3], [X - 6, 4], [X + 6, 4], [X, 6.5]] as const) {
        B.add(CYL, toon(0x5a2a1a), [tx, 0.4, tz], [0, 0, 0], [0.25, 0.8, 0.25]); B.add(CYL, toon(0x7a3a1a), [tx, 0.8, tz], [0, 0, 0], [1.35, 0.1, 1.0]); B.add(CYL, felt, [tx, 0.86, tz], [0, 0, 0], [1.22, 0.04, 0.88]);
        for (let k = 0; k < 9; k++) { const a = k * 0.7, r = 0.5 + rnd(k + tx) * 0.3; for (let q = 0; q < 2 + (k % 4); q++) B.add(CYL, chipC[(k + q) % 5], [tx + Math.cos(a) * r, 0.9 + q * 0.025, tz + Math.sin(a) * r * 0.7], [0, 0, 0], [0.05, 0.022, 0.05]); }
        for (let k = 0; k < 5; k++) B.add(BOX, white, [tx - 0.3 + k * 0.15, 0.885, tz + 0.15], [0, (k - 2) * 0.2, 0], [0.09, 0.005, 0.13]);
        for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.4; B.add(CYL8, toon(0xe8b84a), [tx + Math.cos(a) * 1.7, 0.25, tz + Math.sin(a) * 1.3], [0, 0, 0], [0.04, 0.5, 0.04]); B.add(CYL, toon(0x8a1a2a), [tx + Math.cos(a) * 1.7, 0.55, tz + Math.sin(a) * 1.3], [0, 0, 0], [0.25, 0.1, 0.25]); } }
      // chandeliers and warm wall sconces
      for (const [cx, cz] of [[X - 6, 0], [X + 6, 0], [X, -4], [X, 4]] as const) { B.add(CYL8, toon(0xe8b84a), [cx, 4.6, cz], [0, 0, 0], [0.02, 0.8, 0.02]); for (let r = 0; r < 2; r++) for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; bulbs.push({ p: [cx + Math.cos(a) * (0.7 - r * 0.3), 4.1 - r * 0.25, cz + Math.sin(a) * (0.7 - r * 0.3)], order: 0, tint: [1, 0.85, 0.5] }); } }
      lightString(B, [X - 12.8, 4.5, -8.7], [X + 12.8, 4.5, -8.7], 60, 0.2, true);
      for (const [nx, ny, nz, txt, col] of [[X - 5, 3.4, -8.82, "JACKPOT", "#f2e04e"], [X + 5, 3.4, -8.82, "777", "#ff4a8a"]] as const) { const m = vplane(4, 1.4, glow(neonTex(txt, col)), [nx, ny, nz]); m.layers.set(NOINK); }
    }

    // ================= NASA MISSION CONTROL =================
    { const B = set(), X = NX;
      pplane(30, 22, photo("Carpet012", { tint: 0xb0b8c8, rough: 0.95, normal: 1.4 }), [X, 0, 0], 1.5);
      plane(30, 22, toon(0x1a2030), [X, 6, 0]).rotation.x = Math.PI / 2;
      const wallM = photo("Metal010", { tint: 0x6a7488, rough: 0.55, normal: 0.7, metal: 0.3 });
      B.add(wbox(30, 6, 0.3, 2.0), wallM, [X, 3, -10]); B.add(wbox(0.3, 6, 22, 2.0), wallM, [X - 15, 3, 0]); B.add(wbox(0.3, 6, 22, 2.0), wallM, [X + 15, 3, 0]); B.add(wbox(30, 6, 0.3, 2.0), wallM, [X, 3, 11]);
      // the big screen: the Moon, a landing trajectory, a pulsing landing site; side screens with data
      const big = glow(tex(512, 256, (g) => { g.fillStyle = "#06102a"; g.fillRect(0, 0, 512, 256); g.fillStyle = "#fff"; for (let i = 0; i < 80; i++) g.fillRect(rnd(i) * 512, rnd(i + 1) * 256, 1.5, 1.5);
        g.fillStyle = "#4a8ad9"; g.beginPath(); g.arc(70, 190, 46, 0, Math.PI * 2); g.fill(); g.fillStyle = "#2e9a5a"; g.beginPath(); g.ellipse(60, 180, 18, 24, 0.4, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#e8e0d0"; g.beginPath(); g.arc(380, 110, 80, 0, Math.PI * 2); g.fill(); g.fillStyle = "rgba(120,110,105,0.5)"; for (const [x, y, r] of [[350, 90, 14], [410, 140, 18], [400, 80, 9], [345, 145, 10]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
        g.strokeStyle = "#f2c14e"; g.setLineDash([8, 8]); g.lineWidth = 4; g.beginPath(); g.moveTo(110, 170); g.bezierCurveTo(200, 20, 300, 30, 360, 100); g.stroke(); g.setLineDash([]);
        g.strokeStyle = "#ff3a3a"; g.lineWidth = 4; g.beginPath(); g.arc(360, 100, 16, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(340, 100); g.lineTo(380, 100); g.moveTo(360, 80); g.lineTo(360, 120); g.stroke();
        g.fillStyle = "#7ad8ff"; g.font = `500 20px ${FONT.mono}`; g.fillText("LANDING SITE", 300, 220); g.fillStyle = "#ff3a3a"; g.fillText("PERMISSION: PENDING", 20, 30); }));
      { const m = vplane(13, 6.2, big, [X, 3.3, -9.82]); m.layers.set(NOINK); B.add(BOX, toon(0x14141c), [X, 3.3, -9.9], [0, 0, 0], [13.6, 6.8, 0.1]); }
      const dataTex = (seed: number) => glow(tex(128, 80, (g) => { g.fillStyle = "#0a1428"; g.fillRect(0, 0, 128, 80); g.strokeStyle = ["#7ad8ff", "#8aff8a", "#f2c14e"][seed % 3]; g.lineWidth = 2; g.beginPath(); for (let x = 0; x < 128; x += 4) g.lineTo(x, 40 + 20 * Math.sin(x * 0.08 + seed) * Math.sin(x * 0.02 + seed * 2)); g.stroke(); g.fillStyle = "rgba(255,255,255,0.6)"; for (let y = 6; y < 30; y += 6) g.fillRect(6, y, 20 + rnd(seed + y) * 60, 2); }));
      for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { const m = vplane(4.2, 2.6, dataTex(k + (s > 0 ? 2 : 0)), [X + s * 10, 2.4 + k * 2.8, -9.82]); m.layers.set(NOINK); }
      // three tiers of consoles with monitors, keyboards, mugs, binders, desk lamps
      for (let row = 0; row < 3; row++) { const z = -5 + row * 3.2, y = row * 0.35;
        if (row) B.add(BOX, toon(0x2a3040), [X, y / 2, z + 0.4], [0, 0, 0], [26, y, 3.2]);
        B.add(BOX, toon(0x5a6478), [X, y + 0.42, z], [0, 0, 0], [24, 0.84, 0.9]); B.add(BOX, toon(0x8a94a8), [X, y + 0.86, z + 0.05], [0, 0, 0], [24.2, 0.05, 1.0]);
        for (let k = 0; k < 18; k++) { const x = X - 11.3 + k * 1.33; B.add(BOX, toon(0x1a1a22), [x, y + 1.15, z - 0.25], [0, 0, 0], [0.62, 0.42, 0.04]); const m = vplane(0.56, 0.36, dataTex(k + row * 7), [x, y + 1.15, z - 0.225]); m.layers.set(NOINK); B.add(BOX, toon(0x2a2a34), [x, y + 0.9, z + 0.15], [0, 0, 0], [0.45, 0.02, 0.15]);
          if (k % 3 === 0) mug(B, x + 0.4, y + 0.885, z + 0.25, [0xd1202f, 0xf4ead6, 0x2a4ab0][k % 3]); if (k % 4 === 1) B.add(BOX, toon([0xd1202f, 0xf2c14e, 0x2e9a5a][row]), [x + 0.35, y + 1.0, z - 0.1], [0, 0, 0], [0.08, 0.25, 0.3]); } }
      for (let k = 0; k < 7; k++) for (const z of [-7.5, 8]) bulbs.push({ p: [X - 12 + k * 4, 5.9, z], order: 0, tint: [0.8, 0.9, 1] });
      // a rocket model, flags, a world clock row, plants
      { const rx = X + 12.5, rz = 7; B.add(CYL, toon(0x5a6478), [rx, 0.3, rz], [0, 0, 0], [0.6, 0.6, 0.6]); B.add(CYL, white, [rx, 2.2, rz], [0, 0, 0], [0.3, 3.2, 0.3]); B.add(CONE, toon(0xd1202f), [rx, 4.2, rz], [0, 0, 0], [0.3, 0.8, 0.3]); for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; B.add(BOX, toon(0xd1202f), [rx + Math.cos(a) * 0.35, 0.9, rz + Math.sin(a) * 0.35], [0, -a, 0], [0.4, 0.6, 0.04]); } }
      for (let k = 0; k < 5; k++) { const fx = X - 14.6, fz = -4 + k * 2.2; B.add(CYL8, toon(0xc0c0c8), [fx + 0.3, 1.5, fz], [0, 0, 0], [0.03, 3, 0.03]); B.add(BOX, toon([0x2a4ab0, 0xd1202f, 0xf2c14e, 0x2e9a5a, 0xf4ead6][k]), [fx + 0.3, 2.6, fz + 0.4], [0, 0, 0], [0.02, 0.5, 0.8]); }
      for (let k = 0; k < 6; k++) { const c = vplane(0.7, 0.7, toon(0xffffff, tex(64, 64, (g) => { g.fillStyle = "#1a1a22"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#ff3a2a"; g.font = `500 18px ${FONT.mono}`; g.fillText(`${(k * 4 + 3) % 24}:00`, 6, 38); })), [X - 6 + k * 2.4, 5.4, -9.82]); void c; }
      plant(B, X - 14, 0, 9.5, 2.4); plant(B, X + 14, 0, -8.5, 2.4); plant(B, X - 14, 0, -8.5, 2.4);
    }

    // ================= ON THE MOON: the plots for sale and Kevin's dream hotel =================
    { const B = set(), X = MX;
      pplane(500, 500, photo("Concrete003", { tint: 0xb4b2b4, rough: 0.95, normal: 2.0 }), [X, 0, 0], 2.5); void regolith;
      const rock = toon(0x8a8692), rim = toon(0xbcb8c4);
      for (let k = 0; k < 40; k++) { const x = X - 80 + rnd(k + 900) * 160, z = -120 + rnd(k + 901) * 140, r = 2 + rnd(k + 902) * 8; if (Math.abs(x - X) < 14 && z > -50 && z < 12) continue; B.add(CYL, rim, [x, 0.15, z], [0, 0, 0], [r, 0.3, r]); B.add(CYL, toon(0x7a7684), [x, 0.18, z], [0, 0, 0], [r * 0.8, 0.3, r * 0.8]); }
      for (let k = 0; k < 120; k++) { const x = X - 60 + rnd(k + 400) * 120, z = -90 + rnd(k + 401) * 100, s = 0.2 + rnd(k + 402) ** 2 * 1.6; if (Math.abs(x - X) < 3 && z > -6) continue; B.add(ICO, rock, [x, s * 0.4, z], [rnd(k) * 3, rnd(k + 1) * 3, 0], [s, s * 0.7, s]); }
      // the plots: posts with string lines and little SOLD signs, a grid over the plain
      const sign = toon(0xffffff, canvasTex(256, 160, (g) => drawBoard(g, 256, 160, "Sold", "#f2efe6", "#a01c24")));
      for (let i = -4; i <= 4; i++) for (let j = 0; j < 4; j++) { const x = X + i * 5, z = 8 - j * 5; B.add(CYL8, toon(0xe8b84a), [x, 0.5, z], [0, 0, 0], [0.05, 1.0, 0.05]); if (i < 4) B.beam(toon(0xf4ead6), [x, 0.9, z], [x + 5, 0.9, z], 0.012); if (j < 3) B.beam(toon(0xf4ead6), [x, 0.9, z], [x, 0.9, z - 5], 0.012); if ((i + j) % 2 === 0 && z > -22) { B.add(CYL8, toon(0x7a4a2a), [x + 2.5, 0.5, z - 2.5], [0, 0, 0], [0.03, 1.0, 0.03]); const sg = vplane(0.6, 0.38, sign, [x + 2.5, 1.05, z - 2.47]); void sg; } }
      // a flag with Kevin's name, a lander
      B.add(CYL8, toon(0xc0c0c8), [X - 1.6, 1.4, 4], [0, 0, 0], [0.04, 2.8, 0.04]); vplane(1.2, 0.75, toon(0xffffff, canvasTex(384, 240, (g) => { drawBoard(g, 384, 240, "Kevin's Moon", "#1f5a46", "#f0d890"); }), THREE.DoubleSide), [X - 1.0, 2.4, 4]);
      { const lx = X + 9, lz = -2; B.add(BOX, toon(0xe8b84a), [lx, 1.6, lz], [0, 0.4, 0], [1.6, 1.0, 1.6]); B.add(CYL8, white, [lx, 2.5, lz], [0, 0, 0], [0.7, 0.8, 0.7]); for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.4; B.beam(toon(0xc0c0c8), [lx + Math.cos(a) * 0.6, 1.2, lz + Math.sin(a) * 0.6], [lx + Math.cos(a) * 1.4, 0, lz + Math.sin(a) * 1.4], 0.06); } }
      // the hotel: a gold-and-glass resort with towers, a glass dome, a glowing pool, neon, string lights
      { const hx = X, hz = -34, gold = toon(0xe8b84a);
        const glass = new THREE.Mesh(new THREE.SphereGeometry(12, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshToonMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0.45, depthWrite: false })); glass.position.set(hx, 0, hz); R.add(glass);
        for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; B.beam(gold, [hx + Math.cos(a) * 12, 0, hz + Math.sin(a) * 12], [hx, 12, hz], 0.12); bulbs.push({ p: [hx + Math.cos(a) * 12, 0.3, hz + Math.sin(a) * 12], order: 0, tint: [1, 0.85, 0.5] }); }
        for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; bulbs.push({ p: [hx + Math.cos(a) * 8.5, 8.5, hz + Math.sin(a) * 8.5], order: 0, tint: COL[k % 5] }); }
        for (const [tx, h] of [[hx - 16, 26], [hx + 16, 30], [hx - 24, 18], [hx + 25, 20]] as const) { const m = M.windowGlass(); B.add(CYL, gold, [tx, h + 0.4, hz - 4], [0, 0, 0], [4, 0.8, 4]); B.add(CONE, gold, [tx, h + 3, hz - 4], [0, 0, 0], [2, 4.5, 2]); bulbs.push({ p: [tx, h + 5.4, hz - 4], order: 0, tint: [1, 0.3, 0.3] }); }
        const pool = new THREE.Mesh(new THREE.CircleGeometry(4.5, 32), new THREE.MeshBasicMaterial({ color: 0x4ae0ff, toneMapped: false })); pool.rotation.x = -Math.PI / 2; pool.position.set(hx, 0.25, hz + 17); pool.layers.set(NOINK); R.add(pool); B.add(CYL, white, [hx, 0.12, hz + 17], [0, 0, 0], [5, 0.24, 5]);
        for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; B.add(BOX, toon([0xd1202f, 0xf2c14e, 0x4fa3d9][k % 3]), [hx + Math.cos(a) * 6.2, 0.3, hz + 17 + Math.sin(a) * 6.2], [0, -a, 0.15], [0.6, 0.12, 1.6]); B.add(CONE, toon([0xe8538a, 0xf2c14e][k % 2]), [hx + Math.cos(a) * 6.8, 2.2, hz + 17 + Math.sin(a) * 6.8], [0, 0, 0], [1.1, 0.4, 1.1]); B.add(CYL8, white, [hx + Math.cos(a) * 6.8, 1.0, hz + 17 + Math.sin(a) * 6.8], [0, 0, 0], [0.03, 2.2, 0.03]); }
        { const m = vplane(9, 2.6, glow(neonTex("Hotel Kevin", "#ffd27a", "luxury")), [hx, 14.5, hz + 4]); m.layers.set(NOINK); }
        lightString(B, [hx - 16, 14, hz - 2], [hx - 2, 9, hz + 10], 30, 0.4, true); lightString(B, [hx + 16, 14, hz - 2], [hx + 2, 9, hz + 10], 30, 0.4, true);
        // a red carpet up to the entrance, lamp posts, potted palms in moon dust
        B.add(BOX, toon(0xd1202f), [hx, 0.02, hz + 19], [0, 0, 0], [2.4, 0.04, 10]);
        for (let k = 0; k < 4; k++) for (const s of [-1, 1]) { const z = hz + 15 + k * 2.4; B.add(CYL8, gold, [hx + s * 1.8, 1.1, z], [0, 0, 0], [0.05, 2.2, 0.05]); bulbs.push({ p: [hx + s * 1.8, 2.3, z], order: 0, tint: [1, 0.9, 0.6] }); }
        for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const px = hx + s * (4 + k * 3), pz = hz + 12 + k; B.add(CYL, white, [px, 0.4, pz], [0, 0, 0], [0.5, 0.8, 0.5]); for (let q = 0; q < 5; q++) B.add(CYL8, toon(0x8a6a3a), [px, 0.8 + q * 0.6, pz], [0, 0, 0], [0.13, 0.65, 0.13]); for (let q = 0; q < 6; q++) { const a = q * 1.05; B.add(CONE, toon(0x3f8a34), [px + Math.cos(a) * 0.8, 4.0, pz + Math.sin(a) * 0.8], [Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2], [0.3, 2.0, 0.08]); } } }
    }

    // ================= STREET (thousands buying lunar apartments): the city kit's full street =================
    { const B = set(), X = SX;
      street(B, { x: X, z: 2, len: 110, width: 12, night: true, seed: 3, tall: 18 }, glowTo);
      // the giant billboard on the north row, the MOON PLOTS booth with balloons on the north sidewalk
      { const m = vplane(16, 8, glow(tex(512, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#14104a"); gr.addColorStop(1, "#4a2a8a"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256); g.fillStyle = "#fff"; for (let i = 0; i < 60; i++) g.fillRect(rnd(i) * 512, rnd(i + 1) * 256, 2, 2);
        g.drawImage(ASSETS!.planets.moon.image as CanvasImageSource, 230, 0, 260, 260, 310, 36, 184, 184);
        g.fillStyle = "#f4e2b0"; font(g, `400 92px ${FONT.display}`, 4); g.fillText("LUNAR", 26, 96); font(g, `400 58px ${FONT.display}`, 3); g.fillText("APARTMENTS", 28, 150); g.fillStyle = "#ffffff"; font(g, `italic 900 26px ${FONT.serif}`, 0); g.fillText("Live above it all.", 28, 192); g.fillStyle = "#f4e2b0"; font(g, `600 20px ${FONT.neon}`, 3); g.fillText("FROM $99  ·  LIMITED PLOTS", 28, 228); })), [X, 15, -6.75]); m.layers.set(NOINK); for (const s2 of [-6, 0, 6]) for (const y of [11.5, 18.5]) B.add(wbox(0.12, 0.12, 1.8), M.paintedMetal(0x1a1a20), [X + s2, y, -7.8]);
        B.add(rbox(16.6, 8.6, 0.3, 0.05), M.paintedMetal(0x1a1a20), [X, 15, -6.95]); for (let k = 0; k < 8; k++) glowTo([X - 7.5 + k * 2.15, 19.6, -6.2], [1, 0.95, 0.85]); }
      { const bx = X, bz = BOOTHZ; B.add(rbox(4, 1.1, 1.0, 0.04), M.paintedMetal(0x2a4ab0), [bx, 0.71, bz]); B.add(rbox(4.1, 0.05, 1.1, 0.02), M.wood("light"), [bx, 1.28, bz]); for (const s of [-1, 1]) B.add(wbox(0.06, 3.2, 0.06), M.steel(), [bx + s * 2, 1.76, bz - 0.4]);
        vplane(4.2, 0.8, glow(neonTex("MOON PLOTS", "#f2e04e")), [bx, 3.1, bz - 0.38]).layers.set(NOINK);
        for (let k = 0; k < 6; k++) B.add(BOX, M.fabric(0xf4f1ea), [bx - 1.5 + k * 0.6, 1.32, bz + 0.1], [0, (k - 3) * 0.2, 0], [0.4, 0.02, 0.55]);
        for (let k = 0; k < 7; k++) { const x = bx - 2.4 + k * 0.8 + (k % 2) * 0.2, y = 4.1 + (k % 3) * 0.6, z = bz - 0.2 + (k % 2) * 0.4; const ball = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), new THREE.MeshPhysicalMaterial({ map: ASSETS!.planets.moon, roughness: 0.35, clearcoat: 1 })); ball.position.set(x, y, z); R.add(ball); B.beam(M.rubber(), [x, y - 0.42, z], [bx + (k - 3) * 0.3, 1.3, bz], 0.006); } }
      for (let x = -40; x <= 40; x += 6) lightString(B, [X + x, 7.5, -8.4], [X + x + 3, 7.5, 12.4], 30, 1.4, true);
    }

    // ================= PRESS ROOM (the government steps in) =================
    { const B = set(), X = PX;
      pplane(24, 18, photo("Carpet003", { tint: 0x9a90a8, rough: 0.95, normal: 1.4 }), [X, 0, 2], 1.5);
      plane(24, 18, toon(0x1a1a24), [X, 6, 2]).rotation.x = Math.PI / 2;
      const curtain = toon(0xffffff, tex(128, 128, (g) => { g.fillStyle = "#1a2a6a"; g.fillRect(0, 0, 128, 128); for (let x = 0; x < 128; x += 16) { g.fillStyle = "rgba(0,0,0,0.2)"; g.fillRect(x, 0, 6, 128); } g.fillStyle = "#f2c14e"; for (let i = 0; i < 12; i++) { const x = 10 + (i % 4) * 32, y = 16 + Math.floor(i / 4) * 40; g.beginPath(); for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2, b = a + Math.PI / 5; g.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); g.lineTo(x + Math.cos(b) * 2.5, y + Math.sin(b) * 2.5); } g.fill(); } }, [6, 2]));
      B.add(BOX, curtain, [X, 3, -6], [0, 0, 0], [24, 6, 0.3]); for (const s of [-1, 1]) B.add(BOX, toon(0x2a2a3a), [X + s * 12, 3, 2], [0, 0, 0], [0.3, 6, 18]);
      // the stage, the podium with a seal and a bank of microphones, flags, potted plants
      B.add(BOX, toon(0x5a3a2a), [X, 0.2, -4.5], [0, 0, 0], [10, 0.4, 3]); B.add(BOX, toon(0x2a2a3a), [X, 0.42, -4.5], [0, 0, 0], [10.1, 0.04, 3.1]);
      { const px = X, pz = -3.6; B.add(BOX, toon(0x6a3a22), [px, 0.95, pz], [0, 0, 0], [1.3, 1.1, 0.6]); B.add(BOX, toon(0x6a3a22), [px, 1.52, pz - 0.05], [-0.3, 0, 0], [1.4, 0.06, 0.7]); vplane(0.6, 0.6, toon(0xffffff, tex(64, 64, (g) => { g.fillStyle = "#f2c14e"; g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill(); g.fillStyle = "#1a2a6a"; g.beginPath(); g.arc(32, 32, 22, 0, Math.PI * 2); g.fill(); g.fillStyle = "#f2c14e"; g.beginPath(); g.arc(32, 32, 8, 0, Math.PI * 2); g.fill(); })), [px, 1.0, pz + 0.31]);
        for (let k = 0; k < 7; k++) { const a = (k - 3) * 0.18; B.beam(toon(0x2a2a2a), [px + Math.sin(a) * 0.2, 1.55, pz + 0.2], [px + Math.sin(a) * 0.5, 1.75, pz + 0.55], 0.015); B.add(SPH, toon([0x1a1a1a, 0xd1202f, 0x2a4ab0, 0xf2c14e][k % 4]), [px + Math.sin(a) * 0.5, 1.77, pz + 0.57], [0, 0, 0], [0.05, 0.07, 0.05]); } }
      for (let k = 0; k < 6; k++) { const fx = X - 4.5 + k * 1.8 + (k > 2 ? 0 : 0), fz = -5.6; if (Math.abs(fx - X) < 1.5) continue; B.add(CYL8, toon(0xe8b84a), [fx, 1.8, fz], [0, 0, 0], [0.03, 3.6, 0.03]); B.add(SPH, toon(0xe8b84a), [fx, 3.65, fz], [0, 0, 0], [0.07, 0.07, 0.07]); for (let q = 0; q < 6; q++) B.add(BOX, toon([0xd1202f, 0xf4f1ea, 0x2a4ab0, 0x2e9a5a, 0xf2c14e][(k + Math.floor(q / 2)) % 5]), [fx + 0.06, 2.85 - q * 0.17, fz + 0.03 * Math.sin(q)], [0, 0, 0.08 * Math.sin(q)], [0.02, 0.17, 1.0]); }
      plant(B, X - 5.5, 0.4, -5.2, 2.2); plant(B, X + 5.5, 0.4, -5.2, 2.2);
      // reporters' chairs, TV cameras on tripods, light stands with bulbs, cables
      for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) { const x = X - 5.6 + k * 1.4, z = 0.5 + r * 1.6; B.add(BOX, toon(0xd1202f), [x, 0.45, z], [0, 0, 0], [0.5, 0.06, 0.5]); B.add(BOX, toon(0xd1202f), [x, 0.75, z + 0.25], [0, 0, 0], [0.5, 0.6, 0.05]); for (const [a, b] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) B.add(CYL8, toon(0x2a2a2a), [x + a, 0.22, z + b], [0, 0, 0], [0.02, 0.44, 0.02]); }
      for (let k = 0; k < 6; k++) { const x = X - 6 + k * 2.4, z = 8; for (const a of [0, 2.1, 4.2]) B.beam(toon(0x2a2a2a), [x, 1.3, z], [x + Math.cos(a) * 0.4, 0, z + Math.sin(a) * 0.4], 0.03); B.add(BOX, toon(0x1a1a22), [x, 1.55, z], [0, 0, 0], [0.4, 0.4, 0.8]); B.add(CYL, toon(0x2a2a34), [x, 1.6, z - 0.5], [Math.PI / 2, 0, 0], [0.15, 0.3, 0.15]); bulbs.push({ p: [x + 0.15, 1.8, z - 0.4], order: 0, tint: [1, 0.2, 0.2] }); }
      for (const s of [-1, 1]) { const x = X + s * 7, z = -1; B.add(CYL8, toon(0x2a2a2a), [x, 1.5, z], [0, 0, 0], [0.04, 3, 0.04]); B.add(BOX, toon(0x2a2a2a), [x, 3.1, z], [0, 0, 0], [0.8, 0.6, 0.4]); bulbs.push({ p: [x - s * 0.1, 3.1, z - 0.21], order: 0, tint: [1, 1, 0.9] }); }
    }

    // ================= OFFICE (back to his normal job) =================
    { const B = set(), X = OX;
      pplane(30, 24, photo("Carpet003", { tint: 0x8a9ab8, rough: 0.95, normal: 1.4 }), [X, 0, 0], 1.5);
      pplane(30, 24, photo("OfficeCeiling002", { tint: 0xffffff, rough: 0.9, normal: 0.35 }), [X, 3.2, 0], 2.4).rotation.x = Math.PI / 2;
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const m = vplane(1.8, 0.6, new THREE.MeshBasicMaterial({ color: 0xf4f8ff, toneMapped: false }), [X - 12 + i * 4.8, 3.18, -9 + j * 5]); m.rotation.x = Math.PI / 2; m.layers.set(NOINK); }
      const wallO = photo("Plaster004", { tint: 0xf0e8dc, rough: 0.9, normal: 0.7 });
      B.add(wbox(0.3, 3.2, 24, 2.0), wallO, [X - 15, 1.6, 0]); B.add(wbox(0.3, 3.2, 24, 2.0), wallO, [X + 15, 1.6, 0]); B.add(wbox(30, 3.2, 0.3, 2.0), wallO, [X, 1.6, 12]);
      // window wall at the back: daylight city
      for (let k = 0; k < 8; k++) B.add(BOX, toon(0xc8ccd8), [X - 14 + k * 4, 1.6, -12], [0, 0, 0], [0.2, 3.2, 0.3]); B.add(BOX, toon(0xc8ccd8), [X, 0.25, -12], [0, 0, 0], [30, 0.5, 0.3]);
      for (let k = 0; k < 14; k++) building(B, { x: X - 40 + k * 6.5, z: -40 - rnd(k) * 20, w: 8, h: 20 + rnd(k + 600) * 34, d: 8, y0: -10, skin: BRICKS[(k + 5) % BRICKS.length], seed: k + 900, near: k % 2 === 0, night: false });
      // the cubicle grid: partitions, desks, monitors, chairs, clutter
      const part = toon(0xffffff, tex(64, 64, (g) => { g.fillStyle = "#7a8aa8"; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 64; i += 4) { g.fillStyle = "rgba(0,0,0,0.06)"; g.fillRect(0, i, 64, 2); } }, [2, 1]));
      const scr = (s: number) => glow(tex(64, 40, (g) => { g.fillStyle = ["#f4f4f8", "#14183a", "#e8f0ff"][s % 3]; g.fillRect(0, 0, 64, 40); for (let y = 4; y < 36; y += 5) { g.fillStyle = ["#2a4ab0", "#7ad8ff", "#2e9a5a", "#d1202f"][(y + s) % 4]; g.fillRect(4, y, 10 + ((y * s * 7) % 40), 2); } }));
      for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { const cx = X - 10 + i * 5, cz = -8 + j * 5;
        B.add(BOX, part, [cx, 0.7, cz - 1.2], [0, 0, 0], [4.6, 1.4, 0.08]); B.add(BOX, part, [cx - 2.3, 0.7, cz], [0, 0, 0], [0.08, 1.4, 2.4]); B.add(BOX, toon(0x5a6a88), [cx, 1.42, cz - 1.2], [0, 0, 0], [4.7, 0.05, 0.12]);
        B.add(BOX, toon(0xd8c8a8), [cx, 0.74, cz - 0.75], [0, 0, 0], [2.0, 0.05, 0.8]); for (const s of [-0.95, 0.95]) B.add(BOX, toon(0x5a5a64), [cx + s, 0.37, cz - 0.75], [0, 0, 0], [0.05, 0.74, 0.7]);
        B.add(BOX, toon(0x1a1a22), [cx - 0.2, 1.05, cz - 0.95], [0, 0, 0], [0.6, 0.38, 0.04]); vplane(0.54, 0.32, scr(i + j * 5), [cx - 0.2, 1.05, cz - 0.925]); B.add(BOX, toon(0x2a2a34), [cx - 0.2, 0.78, cz - 0.6], [0, 0, 0], [0.45, 0.02, 0.15]);
        mug(B, cx + 0.5, 0.765, cz - 0.6, [0xd1202f, 0xf2c14e, 0x2a4ab0, 0xf4ead6][(i + j) % 4]); B.add(BOX, toon(0xf4f4f8), [cx + 0.7, 0.8, cz - 0.9], [0, 0.2, 0], [0.3, 0.08, 0.22]); if ((i + j) % 2) plant(B, cx - 0.85, 0.765, cz - 0.95, 0.6);
        for (let k = 0; k < 4; k++) B.add(BOX, toon([0xf2e04e, 0xf28ab0, 0x8ae0f2][k % 3]), [cx - 1.6 + k * 0.25, 1.2, cz - 1.15], [0, 0, (rnd(k + i) - 0.5) * 0.3], [0.15, 0.15, 0.01]);
        B.add(BOX, toon(0x2a2a34), [cx - 0.2, 0.48, cz + 0.1], [0, 0, 0], [0.5, 0.08, 0.5]); B.add(BOX, toon(0x2a2a34), [cx - 0.2, 0.85, cz + 0.33], [0, 0, 0], [0.5, 0.65, 0.06]); }
      // Kevin's cubicle: a Moon photo pinned up, a little rocket toy
      vplane(0.4, 0.3, toon(0xffffff, poster(0)), [KC[0] - 1.0, 1.18, KC[2] - 1.15]);
      // water cooler, printer, filing cabinets, big plants, a clock
      { const wx = X + 13.5, wz = 4; B.add(BOX, white, [wx, 0.55, wz], [0, 0, 0], [0.5, 1.1, 0.5]); B.add(CYL, toon(0x7ad8ff), [wx, 1.35, wz], [0, 0, 0], [0.22, 0.55, 0.22]); B.add(BOX, toon(0xc8c8d0), [wx, 0.5, wz + 2], [0, 0, 0], [0.9, 1.0, 0.7]); }
      for (let k = 0; k < 5; k++) B.add(BOX, toon(0x8a94a8), [X - 14.5, 0.65, -8 + k * 0.6], [0, 0, 0], [0.6, 1.3, 0.55]);
      plant(B, X - 13.5, 0, 9.5, 2.6); plant(B, X + 13.5, 0, -9.5, 2.6); plant(B, X - 13.5, 0, -10.5, 2.6);
    }
    for (const B of sets) { const g = new THREE.Group(); B.build(g); g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } }); R.add(g); }
    this.bulbs = new Flames(R, bulbs, 0.16);
    { const P = this.papers; for (let k = 0; k < 24; k++) { const q = new THREE.Mesh(BOX, toon(k % 2 ? 0xf4f1ea : 0xe8e0cc)); q.scale.set(0.42, 0.012, 0.3); q.position.set((rnd(k) - 0.5) * 0.03, k * 0.012, (rnd(k + 1) - 0.5) * 0.03); q.rotation.y = (rnd(k + 2) - 0.5) * 0.08; P.add(q); }
      const rb = new THREE.Mesh(BOX, toon(0xd1202f)); rb.scale.set(0.05, 0.3, 0.31); rb.position.set(0, 0.14, 0); P.add(rb); const seal = new THREE.Mesh(CYL, toon(0xe8b84a)); seal.scale.set(0.06, 0.01, 0.06); seal.position.set(0.1, 0.295, 0.05); P.add(seal); P.visible = false; R.add(P); }
    // the Moon: a huge glowing disc-sphere with craters and a soft halo, one per set
    const halo = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, "rgba(255,248,235,0.45)"); gr.addColorStop(0.45, "rgba(210,215,235,0.12)"); gr.addColorStop(1, "rgba(200,205,230,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
    const MT = A.planets.moon; void moonTex;
    for (const [p, r] of [[MOON_APT, 46], [MOON_CITY, 44]] as const) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), new THREE.MeshBasicMaterial({ map: MT, fog: false, toneMapped: false })); m.position.set(...p); m.rotation.y = -Math.PI / 2; m.layers.set(NOINK); R.add(m); this.moons.push(m);
      const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false })); h.position.set(...p); h.scale.set(r * 4.2, r * 4.2, 1); h.layers.set(NOINK); R.add(h); this.halos.push(h); }
    { const e = new THREE.Mesh(new THREE.SphereGeometry(26, 48, 24), new THREE.MeshStandardMaterial({ map: A.planets.earth, roughness: 0.7, emissive: 0x0a1a3a, fog: false }));
      const cl = new THREE.Mesh(new THREE.SphereGeometry(26.3, 48, 24), new THREE.MeshStandardMaterial({ map: A.planets.clouds, transparent: true, opacity: 0.8, depthWrite: false, fog: false })); e.add(cl); e.rotation.set(0.3, 2.2, 0); e.position.set(...EARTH); e.layers.set(NOINK); R.add(e);
      const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false, color: 0x6aa8ff })); h.position.set(...EARTH); h.scale.set(130, 130, 1); h.layers.set(NOINK); R.add(h); }
    void dotTex; void CONE;
    for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xffa850, 0, 10, 1.6); R.add(l); this.warm.push(l); }
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.03;
    R.add(this.hemi, this.sun, this.sun.target);
  }

  /** scroll: the auction page scroll 0..1; screen: laptop glow 0..1 */
  set(o: { light: LightName; t: number; px: number; cam: V3; look: V3; warm?: V3[]; shadowR?: number; scroll?: number; screen?: number; page?: number; papers?: V3 }) {
    const L = o.light;
    this.sky.position.set(...o.cam);
    this.skyMat.map = this.skies[L]; this.skyMat.needsUpdate = true;
    this.stars.visible = L === "space" || L === "casino" || L === "nasa" || L === "press";
    const P = {
      morning: { hs: 0xffe8d8, hg: 0x6a5a50, hi: 0.5, sc: 0xffd2a0, si: 3.2, sd: [0.2, 0.45, -1], fog: 0xc8b8b0, fn: 80, ff: 500, env: "day", ei: 0.9 },
      night: { hs: 0x90a0d0, hg: 0x3a3a48, hi: 0.35, sc: 0xb8c8ff, si: 1.1, sd: [0.15, 0.6, -1], fog: 0x141c30, fn: 80, ff: 600, env: "night", ei: 1.6 },
      close: { hs: 0x98a8d8, hg: 0x4a4048, hi: 0.45, sc: 0xc0d0ff, si: 1.1, sd: [0.15, 0.6, -1], fog: 0x141c30, fn: 80, ff: 600, env: "night", ei: 1.8 },
      city: { hs: 0xa0a8d8, hg: 0x3a3a48, hi: 0.4, sc: 0xd0d8ff, si: 1.3, sd: [0.1, 0.5, -1], fog: 0x1c2438, fn: 60, ff: 420, env: "night", ei: 1.6 },
      casino: { hs: 0xffc8a8, hg: 0x5a2a2a, hi: 0.4, sc: 0xffd8a0, si: 1.4, sd: [0.3, 1, 0.4], fog: 0x2a1418, fn: 30, ff: 120, env: "room", ei: 0.7 },
      nasa: { hs: 0xb0c8f0, hg: 0x3a4050, hi: 0.4, sc: 0xe0e8ff, si: 1.3, sd: [0.2, 1, 0.5], fog: 0x101624, fn: 30, ff: 120, env: "room", ei: 0.6 },
      space: { hs: 0xb0b8d0, hg: 0x2a2a30, hi: 0.25, sc: 0xffffff, si: 4.0, sd: [0.8, 0.45, 0.4], fog: 0x05050e, fn: 400, ff: 1600, env: "sunset", ei: 0.35 },
      street: { hs: 0xa8b4e0, hg: 0x4a4650, hi: 0.8, sc: 0xc8d4ff, si: 1.6, sd: [0.25, 0.7, 0.6], fog: 0x1c2438, fn: 40, ff: 220, env: "night", ei: 3.0 },
      press: { hs: 0xe8e8ff, hg: 0x40404a, hi: 0.5, sc: 0xfff4e0, si: 2.0, sd: [0.1, 0.8, 1], fog: 0x14141c, fn: 30, ff: 120, env: "room", ei: 0.7 },
      office: { hs: 0xf4f8ff, hg: 0x6a6a74, hi: 0.6, sc: 0xfff4e0, si: 2.4, sd: [0.2, 0.8, -1], fog: 0xc8d4e0, fn: 50, ff: 220, env: "day", ei: 1.0 },
    }[L];
    this.hemi.color.set(P.hs); this.hemi.groundColor.set(P.hg); this.hemi.intensity = P.hi;
    this.sun.color.set(P.sc); this.sun.intensity = P.si;
    const sd = new THREE.Vector3(...(P.sd as V3)).normalize(), r = o.shadowR ?? 12;
    this.sun.target.position.set(...o.look); this.sun.position.copy(this.sun.target.position).addScaledVector(sd, 60); this.sun.target.updateMatrixWorld();
    const sc = this.sun.shadow.camera; sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 5; sc.far = 160; sc.updateProjectionMatrix();
    this.fog.color.set(P.fog); this.fog.near = P.fn; this.fog.far = P.ff; this.env = P.env as EnvName; this.envI = P.ei;
    const f = this.bulbs; f.mat.uniforms.uTime.value = o.t * 0.3; f.mat.uniforms.uPx.value = o.px; f.mat.uniforms.uLit.value = 2;
    const fl = 0.95 + 0.05 * Math.sin(o.t * 7);
    this.lamp.intensity = L === "morning" ? 2 : 9;
    this.screen.intensity = 5 * (o.screen ?? (L === "morning" ? 0 : 1)) * (0.97 + 0.03 * Math.sin(o.t * 13));
    const pg = o.page ?? 0; this.screenMat.map = this.screenTex[pg]; this.screenMat.map.offset.set(0, pg ? 0.64 : 0.64 - 0.5 * (o.scroll ?? 0));
    this.papers.visible = !!o.papers; if (o.papers) { this.papers.position.set(...o.papers); this.papers.lookAt(o.cam[0], o.papers[1], o.cam[2]); }
    for (const m of this.halos) (m.material as THREE.SpriteMaterial).opacity = L === "morning" ? 0.25 : 1;
    for (const m of this.moons) (m.material as THREE.MeshBasicMaterial).color.setScalar(L === "morning" ? 1.0 : 1.35);
    this.warm.forEach((l, i) => { const w = o.warm?.[i]; l.intensity = w ? 5 * fl : 0; if (w) l.position.set(...w); });
  }
}
