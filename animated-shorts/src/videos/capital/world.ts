// "The Sultan Who Moved His Capital": a dense Indo-Islamic world, every set crowded with pattern and props.
//   DURBAR  (x 0):     the Sultan's audience hall: star-tiled marble, carpets, arcades of cusped arches, gold niche,
//                      throne under a huge red-gold umbrella, lamps, attendants, trays, scrolls.
//   BAZAAR  (x 400):   a Delhi street: pastel houses with jharokhas and chhatris, stalls, awnings, goods, carts,
//                      laundry lines, the Qutub Minar at the end of the street.
//   ROAD    (x -800):  the royal road south: dust, rows of trees, rest houses with wells, kos minars.
//   FORT    (x 2600):  Daulatabad on its conical hill: ringed walls, gate, the Chand Minar, a town at its foot.
// Each set is its own Batch (so meshes cull), meshes cast and receive sun shadows; lamps are Points (Flames),
// glints are star sprites, dust is drifting puffs.
import * as THREE from "three";
import { NOINK } from "../bridge/ink";
import { Flames } from "../diwali/world";
import { Batch, V3, rnd, toon, canvasTex, ramp, BOX, CYL, CONE, ICO, SPH, CYL8, DOME, PRISM, HALF } from "../eiffel/lib";

export type LightName = "court" | "day" | "heat" | "dusk" | "ghost";
export const DX = 0, BZX = 400, RX = -800, FX = 2600;
type Pt = { p: V3; order: number; tint?: V3 };
const CONE4 = new THREE.ConeGeometry(0.7071, 1, 4), OCT = new THREE.CylinderGeometry(1, 1, 1, 8);

// ---------------- ornamental textures ----------------
const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep?: [number, number]) => canvasTex(w, h, draw, rep);
const starTiles = (rep: number) => tex(256, 256, (g) => {
  g.fillStyle = "#efe6d6"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) {
    const cx = x + 32, cy = y + 32; g.fillStyle = (x + y) / 64 % 2 ? "#b8462e" : "#2f6a6a";
    g.beginPath(); for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8, r = k % 2 ? 11 : 24; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill();
    g.fillStyle = "#e8b84a"; g.beginPath(); g.arc(cx, cy, 6, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#c9b896"; g.lineWidth = 2; g.strokeRect(x, y, 64, 64);
  }
}, [rep, rep]);
const carpet = (a: string, b: string, c: string, rx = 1, ry = 1) => tex(256, 384, (g) => {
  g.fillStyle = a; g.fillRect(0, 0, 256, 384);
  g.fillStyle = b; g.fillRect(10, 10, 236, 364); g.fillStyle = a; g.fillRect(24, 24, 208, 336);
  for (let y = 16; y < 384; y += 22) { g.fillStyle = c; g.beginPath(); g.arc(17, y, 4, 0, Math.PI * 2); g.arc(239, y, 4, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = b; g.beginPath(); g.moveTo(128, 70); g.lineTo(200, 192); g.lineTo(128, 314); g.lineTo(56, 192); g.closePath(); g.fill();
  g.fillStyle = c; g.beginPath(); g.moveTo(128, 120); g.lineTo(170, 192); g.lineTo(128, 264); g.lineTo(86, 192); g.closePath(); g.fill();
  g.fillStyle = a; g.beginPath(); g.arc(128, 192, 18, 0, Math.PI * 2); g.fill();
  for (const [x, y] of [[60, 60], [196, 60], [60, 324], [196, 324]]) { g.fillStyle = c; for (let k = 0; k < 6; k++) { const an = (k * Math.PI) / 3; g.beginPath(); g.ellipse(x + Math.cos(an) * 10, y + Math.sin(an) * 10, 7, 4, an, 0, Math.PI * 2); g.fill(); } }
  g.strokeStyle = c; g.lineWidth = 3; g.strokeRect(30, 30, 196, 324);
}, rx > 1 || ry > 1 ? [rx, ry] : undefined);
const canopyTex = () => tex(512, 128, (g) => {
  g.fillStyle = "#a8202a"; g.fillRect(0, 0, 512, 128);
  for (let x = 0; x < 512; x += 32) { g.fillStyle = "#e8b84a"; g.beginPath(); g.moveTo(x + 16, 20); g.lineTo(x + 26, 50); g.lineTo(x + 16, 80); g.lineTo(x + 6, 50); g.closePath(); g.fill(); g.fillStyle = "#2f6a3a"; g.beginPath(); g.arc(x + 16, 50, 4, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#e8b84a"; g.fillRect(0, 96, 512, 8); g.fillRect(0, 0, 512, 6);
  for (let x = 0; x < 512; x += 16) { g.fillStyle = "#e8b84a"; g.beginPath(); g.arc(x + 8, 112, 7, 0, Math.PI); g.fill(); }
});
const sandstone = (base: string, inlay: string, rx: number, ry: number) => tex(128, 128, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = inlay; g.lineWidth = 4; g.strokeRect(8, 8, 112, 112); g.lineWidth = 2; g.strokeRect(18, 18, 92, 92);
  g.beginPath(); g.moveTo(64, 26); g.lineTo(100, 64); g.lineTo(64, 102); g.lineTo(28, 64); g.closePath(); g.stroke();
  g.fillStyle = inlay; g.beginPath(); g.arc(64, 64, 8, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(0,0,0,0.06)"; for (let i = 0; i < 60; i++) g.fillRect(rnd(i + 3) * 128, rnd(i + 4) * 128, 3, 2);
}, [rx, ry]);
const archPanel = (base: string, trim: string, inner: string) => tex(128, 192, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 128, 192);
  g.fillStyle = inner; g.beginPath(); g.moveTo(18, 192); g.lineTo(18, 90);
  for (let k = 0; k <= 6; k++) { const a = Math.PI + (Math.PI * k) / 6, r = 46; g.lineTo(64 + Math.cos(a) * r + (k % 2 ? 0 : 0), 90 + Math.sin(a) * r * 1.2 - (k % 2 ? 6 : 0)); }
  g.lineTo(110, 192); g.closePath(); g.fill();
  g.strokeStyle = trim; g.lineWidth = 6; g.stroke();
  g.fillStyle = trim; for (let x = 6; x < 128; x += 20) { g.beginPath(); g.arc(x, 10, 5, 0, Math.PI * 2); g.fill(); }
  g.fillRect(0, 22, 128, 4);
});
const goldNiche = () => tex(256, 384, (g) => {
  g.fillStyle = "#3a2a6a"; g.fillRect(0, 0, 256, 384);
  for (let y = 0; y < 384; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < 256; x += 32) { g.fillStyle = (x + y) % 64 ? "#e8b84a" : "#2f6a8a"; g.beginPath(); g.moveTo(x + 16, y); g.lineTo(x + 32, y + 16); g.lineTo(x + 16, y + 32); g.lineTo(x, y + 16); g.closePath(); g.fill(); }
  g.strokeStyle = "#f6e6b0"; g.lineWidth = 10; g.beginPath(); g.moveTo(20, 384); g.lineTo(20, 140); g.quadraticCurveTo(128, -40, 236, 140); g.lineTo(236, 384); g.stroke();
});
const jali = () => tex(128, 128, (g) => {
  g.fillStyle = "#d9c9a8"; g.fillRect(0, 0, 128, 128); g.fillStyle = "#3a2a20";
  for (let y = 0; y < 128; y += 16) for (let x = 0; x < 128; x += 16) { g.beginPath(); g.moveTo(x + 8, y + 2); g.lineTo(x + 14, y + 8); g.lineTo(x + 8, y + 14); g.lineTo(x + 2, y + 8); g.closePath(); g.fill(); }
}, [2, 3]);
const houseWall = (base: string, trim: string, door: string, seed: number) => tex(128, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 128, 256);
  g.fillStyle = "rgba(0,0,0,0.05)"; for (let i = 0; i < 80; i++) g.fillRect(rnd(seed + i) * 128, rnd(seed + i + 1) * 256, 6, 3);
  g.fillStyle = trim; g.fillRect(0, 0, 128, 10); g.fillRect(0, 118, 128, 6);
  for (let x = 4; x < 128; x += 14) { g.beginPath(); g.moveTo(x, 10); g.lineTo(x + 7, 22); g.lineTo(x + 14, 10); g.fill(); }
  for (const x of [20, 76]) { g.fillStyle = trim; g.fillRect(x - 3, 34, 38, 66); g.fillStyle = "#2a2430"; g.beginPath(); g.moveTo(x, 98); g.lineTo(x, 50); g.quadraticCurveTo(x + 16, 30, x + 32, 50); g.lineTo(x + 32, 98); g.closePath(); g.fill(); g.fillStyle = door; g.fillRect(x + 2, 60, 12, 38); g.fillRect(x + 18, 60, 12, 38); }
  g.fillStyle = trim; g.fillRect(36, 140, 56, 116); g.fillStyle = door; g.beginPath(); g.moveTo(42, 256); g.lineTo(42, 168); g.quadraticCurveTo(64, 140, 86, 168); g.lineTo(86, 256); g.closePath(); g.fill();
  g.fillStyle = "#e8b84a"; for (let y = 180; y < 256; y += 14) for (const x of [50, 78]) { g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = trim; for (let x = 6; x < 128; x += 24) { g.fillRect(x, 230, 8, 8); }
});
const awning = (a: string, b: string) => tex(64, 64, (g) => { for (let x = 0; x < 64; x += 16) { g.fillStyle = a; g.fillRect(x, 0, 8, 64); g.fillStyle = b; g.fillRect(x + 8, 0, 8, 64); } for (let x = 0; x < 64; x += 8) { g.fillStyle = a; g.beginPath(); g.arc(x + 4, 60, 4, 0, Math.PI); g.fill(); } });
const sandTex = (rep: number) => tex(128, 128, (g) => { g.fillStyle = "#d9b47a"; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 300; i++) { g.fillStyle = rnd(i) < 0.5 ? "rgba(150,100,50,0.18)" : "rgba(255,240,200,0.2)"; g.fillRect(rnd(i + 1) * 128, rnd(i + 2) * 128, 3, 2); } }, [rep, rep]);
const dirtTex = (rep: number) => tex(128, 128, (g) => { g.fillStyle = "#c9a26a"; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 260; i++) { g.fillStyle = rnd(i + 9) < 0.5 ? "rgba(110,70,30,0.2)" : "rgba(255,230,180,0.2)"; g.beginPath(); g.ellipse(rnd(i + 1) * 128, rnd(i + 2) * 128, 3 + rnd(i) * 4, 2, 0, 0, Math.PI * 2); g.fill(); } }, [rep, rep]);
const minarTex = () => tex(128, 512, (g) => {
  g.fillStyle = "#b8542e"; g.fillRect(0, 0, 128, 512);
  for (let x = 0; x < 128; x += 16) { g.fillStyle = "rgba(255,220,180,0.18)"; g.fillRect(x, 0, 6, 512); g.fillStyle = "rgba(60,20,10,0.25)"; g.fillRect(x + 12, 0, 4, 512); }
  for (const y of [60, 200, 330, 440]) { g.fillStyle = "#e9dcc0"; g.fillRect(0, y, 128, 16); g.fillStyle = "#6a2a1a"; for (let x = 4; x < 128; x += 10) g.fillRect(x, y + 4, 5, 8); }
});
const skyTex = (top: string, mid: string, hor: string) => tex(16, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(0.42, mid); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); });
const starTex = () => tex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, "rgba(255,255,240,1)"); gr.addColorStop(0.15, "rgba(255,240,200,0.7)"); gr.addColorStop(1, "rgba(255,220,150,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.fillStyle = "#fffef4"; g.beginPath(); g.moveTo(32, 0); g.lineTo(35, 29); g.lineTo(64, 32); g.lineTo(35, 35); g.lineTo(32, 64); g.lineTo(29, 35); g.lineTo(0, 32); g.lineTo(29, 29); g.closePath(); g.fill(); });

export class World {
  root = new THREE.Group();
  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sky: THREE.Mesh; skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false });
  skies: Record<LightName, THREE.Texture>;
  fog = new THREE.Fog(0xffffff, 80, 900);
  lamps: Flames; glints: THREE.Sprite[] = []; glintMat: THREE.SpriteMaterial;
  puffs: THREE.Mesh[] = []; puffMat: THREE.MeshToonMaterial;
  people: THREE.Group;
  warm: THREE.PointLight[] = [];
  clouds: THREE.Mesh[] = []; cloudMat: THREE.MeshBasicMaterial;

  constructor() {
    const R = this.root;
    this.skies = { court: skyTex("#4a86d8", "#9cc0ea", "#f2e2c0"), day: skyTex("#3a7ad8", "#8fbce8", "#f4e6c8"), heat: skyTex("#5a8ad0", "#e8c8a0", "#ffe0a8"), dusk: skyTex("#3a3a7a", "#d88a7a", "#ffc890"), ghost: skyTex("#8a8a90", "#c9b89a", "#e0c9a0") };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 24, 16), this.skyMat); this.sky.layers.set(NOINK); R.add(this.sky);
    const lamps: Pt[] = [];
    const sets: Batch[] = [];
    const set = () => { const b = new Batch(); sets.push(b); return b; };
    const plane = (w: number, d: number, m: THREE.Material, p: V3, rz = 0) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); q.rotation.set(-Math.PI / 2, 0, rz); q.position.set(...p); q.receiveShadow = true; R.add(q); return q; };
    const gold = toon(0xe8b84a), goldD = toon(0xc9962e), red = toon(0xa8202a), marble = toon(0xf1ebe0), sand = toon(0xc9744a), sandL = toon(0xd98a5a), wood = toon(0x7a4a2a), woodD = toon(0x4a2a18), brass = toon(0xd9a040), cloth = toon(0xf4ead6);
    const leaf = [toon(0x4f8a3a), toon(0x3f7a34), toon(0x6a9a40)], trunkM = toon(0x6a4a2a);
    const pots = [toon(0xb5532c), toon(0x8a3a1e), toon(0xd9a040), toon(0x2f6a8a)];
    const fabrics = [toon(0xd1202f), toon(0x2e7a4a), toon(0x2a4a9a), toon(0xe8a020), toon(0x8a2a8a), toon(0xe86a2a)];
    const tree = (B: Batch, x: number, z: number, s: number, i: number) => {
      B.add(CYL8, trunkM, [x, 1.6 * s, z], [0, 0, 0.05 * (rnd(i) - 0.5)], [0.3 * s, 3.2 * s, 0.3 * s]);
      for (let k = 0; k < 5; k++) B.add(ICO, leaf[(i + k) % 3], [x + (rnd(i * 3 + k) - 0.5) * 3 * s, (3.6 + (k % 3) * 0.8) * s, z + (rnd(i * 5 + k) - 0.5) * 3 * s], [0, rnd(i + k), 0], [1.8 * s, 1.4 * s, 1.8 * s]);
    };
    const palm = (B: Batch, x: number, z: number, h: number, i: number) => {
      for (let k = 0; k < 8; k++) B.add(CYL8, toon(0x8a6a3a), [x + Math.sin(k * 0.3 + i) * 0.1 * k, 0.4 + k * h / 8, z], [0, 0, 0.04], [0.25, h / 8 + 0.05, 0.25]);
      for (let k = 0; k < 8; k++) { const a = k * 0.785 + i; B.add(CONE, leaf[k % 3], [x + Math.cos(a) * 1.4, h + 0.2, z + Math.sin(a) * 1.4], [Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25], [0.45, 3.2, 0.12]); }
    };
    const pot = (B: Batch, x: number, z: number, s: number, i: number, y = 0) => { B.add(SPH, pots[i % 4], [x, y + 0.32 * s, z], [0, 0, 0], [0.32 * s, 0.32 * s, 0.32 * s]); B.add(CYL8, pots[i % 4], [x, y + 0.62 * s, z], [0, 0, 0], [0.13 * s, 0.16 * s, 0.13 * s]); };
    const lamp = (B: Batch, x: number, y: number, z: number) => { B.add(CYL8, brass, [x, y, z], [0, 0, 0], [0.12, 0.08, 0.12]); lamps.push({ p: [x, y + 0.14, z], order: 0 }); };
    const umbrella = (B: Batch, x: number, y: number, z: number, r: number, m: THREE.Material) => {
      const c = new THREE.Mesh(new THREE.ConeGeometry(r, r * 0.45, 16, 1, true), m); c.position.set(x, y, z); c.castShadow = true; R.add(c);
      const sk = new THREE.Mesh(new THREE.CylinderGeometry(r, r, r * 0.16, 16, 1, true), m); sk.position.set(x, y - r * 0.29, z); sk.castShadow = true; R.add(sk);
      B.add(CYL8, gold, [x, y / 2, z], [0, 0, 0], [0.06, y, 0.06]); B.add(SPH, gold, [x, y + r * 0.26, z], [0, 0, 0], [0.12, 0.16, 0.12]);
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; B.add(SPH, gold, [x + Math.cos(a) * r, y - r * 0.4, z + Math.sin(a) * r], [0, 0, 0], [0.05, 0.08, 0.05]); }
    };

    // ================= DURBAR =================
    { const B = set(), X = DX;
      plane(44, 46, toon(0xffffff, starTiles(10)), [X, 0.01, -8]);
      const runner = new THREE.Mesh(new THREE.PlaneGeometry(4, 26), toon(0xffffff, carpet("#9a1f2a", "#e8b84a", "#2f5a8a", 1, 4))); runner.rotation.x = -Math.PI / 2; runner.position.set(X, 0.03, -2); runner.receiveShadow = true; R.add(runner);
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(5, 7), toon(0xffffff, carpet(["#2f5a8a", "#2e6a4a", "#7a2a6a"][k], "#e8b84a", "#d1202f"))); c.rotation.set(-Math.PI / 2, 0, Math.PI / 2); c.position.set(X + s * 6.2, 0.025, -12 + k * 7.5); c.receiveShadow = true; R.add(c); }
      // dais + throne + umbrella + niche
      for (let k = 0; k < 3; k++) B.add(BOX, marble, [X, 0.2 + k * 0.4, -17 - k * 0.5], [0, 0, 0], [10 - k * 1.6, 0.4, 6 - k]);
      const inl = toon(0xffffff, sandstone("#f1ebe0", "#b8462e", 6, 1)); B.add(BOX, inl, [X, 0.6, -14.0], [0, 0, 0], [10, 1.2, 0.05]);
      B.add(BOX, gold, [X, 1.6, -18.6], [0, 0, 0], [2.4, 0.5, 1.6]); B.add(BOX, gold, [X, 2.8, -19.3], [0, 0, 0], [2.6, 2.4, 0.3]); B.add(BOX, red, [X, 2.6, -19.1], [0, 0, 0], [2.0, 1.8, 0.1]);
      for (const s of [-1, 1]) { B.add(BOX, gold, [X + s * 1.25, 2.2, -18.6], [0, 0, 0], [0.25, 0.9, 1.6]); B.add(SPH, gold, [X + s * 1.3, 4.1, -19.3], [0, 0, 0], [0.25, 0.3, 0.25]); B.add(CYL8, red, [X + s * 0.75, 2.0, -18.3], [0, 0, Math.PI / 2], [0.25, 0.7, 0.25]); }
      B.add(BOX, toon(0xf4ead6), [X, 1.95, -18.5], [0, 0, 0], [2.0, 0.25, 1.3]);
      umbrella(B, X, 6.4, -18.6, 3.2, toon(0xffffff, canopyTex(), THREE.DoubleSide));
      const niche = new THREE.Mesh(new THREE.PlaneGeometry(9, 13), toon(0xffffff, goldNiche())); niche.position.set(X, 6.5, -21.4); R.add(niche);
      B.add(BOX, toon(0xffffff, sandstone("#c9744a", "#f1ebe0", 10, 4)), [X, 7, -22], [0, 0, 0], [44, 14, 1]);
      // arcades (cusped arches between columns) on both sides and the back corners
      const arch = toon(0xffffff, archPanel("#c9744a", "#f1ebe0", "#3a2418"));
      for (const s of [-1, 1]) for (let k = 0; k < 7; k++) {
        const z = -20 + k * 4.6, x = X + s * 13;
        B.add(OCT, sandL, [x, 3.0, z], [0, 0, 0], [0.45, 6, 0.45]); B.add(BOX, sand, [x, 0.3, z], [0, 0, 0], [1.2, 0.6, 1.2]); B.add(BOX, sand, [x, 6.1, z], [0, 0, 0], [1.1, 0.3, 1.1]);
        if (k < 6) { const p = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 7), arch); p.position.set(x + s * 0.1, 3.5, z + 2.3); p.rotation.y = -s * Math.PI / 2; R.add(p);
          const jl = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.6), toon(0xffffff, jali())); jl.position.set(x + s * 4.5, 2.6, z + 2.3); jl.rotation.y = -s * Math.PI / 2; R.add(jl); }
        B.add(BOX, sand, [x + s * 4.6, 3.5, z], [0, 0, 0], [0.3, 7, 4.6]);
        lamp(B, x - s * 0.5, 2.6, z); B.add(BOX, brass, [x - s * 0.35, 2.4, z], [0, 0, 0], [0.4, 0.06, 0.2]);
        const bn = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.6), toon(0xffffff, canopyTex(), THREE.DoubleSide)); bn.position.set(x - s * 0.5, 4.8, z + 1.2); bn.rotation.y = s * Math.PI / 2; R.add(bn);
      }
      B.add(BOX, toon(0xffffff, sandstone("#d98a5a", "#f1ebe0", 12, 1)), [X, 7.2, -8], [0, 0, 0], [28, 0.6, 30]);
      for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) { const z = -16 + k * 5.2, x = X + sx * 3.4; B.add(CYL8, gold, [x, 6.4, z], [0, 0, 0], [0.02, 1.2, 0.02]); B.add(OCT, toon(0x2f6a8a), [x, 5.6, z], [0, 0, 0], [0.22, 0.4, 0.22]); B.add(CONE, gold, [x, 5.95, z], [0, 0, 0], [0.24, 0.25, 0.24]); lamps.push({ p: [x, 5.45, z], order: 0, tint: [1, 0.75, 0.4] }); }
      // attendants' props: trays of fruit, scrolls, incense, cushions, brass pots, a low writing desk
      for (const s of [-1, 1]) {
        for (let k = 0; k < 3; k++) { B.add(CYL, brass, [X + s * 3.4, 0.08, -15.6 + k * 1.1], [0, 0, 0], [0.42, 0.06, 0.42]); for (let q = 0; q < 5; q++) B.add(SPH, [toon(0xd1202f), toon(0xe8a020), toon(0x6a9a40)][q % 3], [X + s * 3.4 + (q - 2) * 0.12, 0.18, -15.6 + k * 1.1 + (q % 2) * 0.1], [0, 0, 0], [0.09, 0.09, 0.09]); }
        for (let k = 0; k < 5; k++) { B.add(CYL8, red, [X + s * (8.4 + (k % 2) * 0.3), 0.25, -13 + k * 3.2], [Math.PI / 2, 0, 0], [0.35, 0.9, 0.35]); pot(B, X + s * 10.6, -12 + k * 3.4, 1.1, k + (s > 0 ? 1 : 0)); }
        B.add(CYL8, brass, [X + s * 4.6, 0.6, -15.2], [0, 0, 0], [0.18, 1.2, 0.18]); lamps.push({ p: [X + s * 4.6, 1.3, -15.2], order: 0 });
        B.add(BOX, wood, [X + s * 2.2, 0.25, -8], [0, 0, 0], [1.2, 0.5, 0.7]); for (let q = 0; q < 3; q++) B.add(CYL8, cloth, [X + s * 2.2 - 0.3 + q * 0.3, 0.56, -8], [0, 0, Math.PI / 2], [0.05, 0.5, 0.05]);
      }
      // courtyard beyond the open front: garden, fountain channel, cypress + palm rows, outer gate
      plane(60, 40, toon(0xffffff, starTiles(12)), [X, 0.005, 26]);
      B.add(BOX, toon(0x5f9ac0), [X, 0.04, 26], [0, 0, 0], [1.6, 0.06, 36]); for (let z = 10; z < 44; z += 4) B.add(CYL, marble, [X, 0.3, z], [0, 0, 0], [0.4, 0.6, 0.4]);
      for (const s of [-1, 1]) for (let z = 10; z < 44; z += 5) { B.add(CONE, leaf[1], [X + s * 5, 3, z], [0, 0, 0], [0.9, 6, 0.9]); palm(B, X + s * 11, z + 2.5, 6, z); }
      B.add(BOX, toon(0xffffff, sandstone("#c9744a", "#f1ebe0", 20, 3)), [X, 5, 46], [0, 0, 0], [60, 10, 2]);
      for (const s of [-1, 1]) { B.add(CYL, sandL, [X + s * 6, 6, 46], [0, 0, 0], [2, 12, 2]); B.add(DOME, marble, [X + s * 6, 12, 46], [0, 0, 0], [2.2, 2.2, 2.2]); }
    }
    // ================= BAZAAR =================
    { const B = set(), X = BZX;
      plane(14, 200, toon(0xffffff, dirtTex(30)), [X, 0.01, -40]); plane(400, 400, toon(0xffffff, sandTex(80)), [X, -0.01, -40]);
      const walls = ["#f2d9a8", "#e9b8a0", "#bcd9e0", "#f2e2c0", "#d9c9e9", "#f0c890"], trims = ["#2f6a8a", "#a8202a", "#2e6a4a", "#c9962e", "#7a2a6a"];
      let hi = 0;
      for (const s of [-1, 1]) for (let z = 50; z > -140;) {
        const w = 7 + Math.floor(rnd(z * 3 + s) * 3) * 2, n = 2 + Math.floor(rnd(z + s * 7) * 2), H = n * 3.6, d = 9, x = X + s * (7 + d / 2), i = hi++;
        const m = toon(0xffffff, houseWall(walls[i % 6], trims[i % 5], trims[(i + 2) % 5], i * 13)); (m.map as THREE.Texture).wrapS = THREE.RepeatWrapping; (m.map as THREE.Texture).repeat.set(Math.max(1, Math.round(w / 6)), n / 2);
        B.add(BOX, m, [x, H / 2, z - w / 2], [0, 0, 0], [d, H, w]);
        B.add(BOX, toon(0xffffff), [x, H + 0.3, z - w / 2], [0, 0, 0], [d + 0.2, 0.6, w + 0.1]);
        for (let q = -w / 2 + 0.5; q < w / 2; q += 1.0) B.add(BOX, toon(0xf4ead6), [x - s * (d / 2 - 0.1), H + 0.9, z - w / 2 + q], [0, 0, 0], [0.2, 0.6, 0.5]);
        if (rnd(i + 2) < 0.65) { // jharokha balcony with a little chhatri roof
          const jz = z - w / 2 + (rnd(i) - 0.5) * (w - 3), jy = 5.2;
          B.add(BOX, toon(0xf4ead6), [x - s * (d / 2 + 0.55), jy, jz], [0, 0, 0], [1.1, 1.6, 2.0]); B.add(BOX, toon(0xffffff, jali()), [x - s * (d / 2 + 1.11), jy, jz], [0, 0, 0], [0.02, 1.2, 1.6]);
          B.add(BOX, toon(0xf4ead6), [x - s * (d / 2 + 0.55), jy - 1.0, jz], [0, 0, 0], [1.3, 0.3, 2.2]); B.add(DOME, toon(parseInt(trims[i % 5].slice(1), 16)), [x - s * (d / 2 + 0.55), jy + 0.85, jz], [0, 0, 0], [1.0, 0.7, 1.2]);
        }
        if (rnd(i + 3) < 0.5) { const cz = z - w / 2; for (const dx of [-1.2, 1.2]) for (const dz of [-1.2, 1.2]) B.add(CYL8, toon(0xf4ead6), [x + dx, H + 1.3, cz + dz], [0, 0, 0], [0.12, 2, 0.12]); B.add(BOX, toon(0xf4ead6), [x, H + 2.35, cz], [0, 0, 0], [3, 0.2, 3]); B.add(DOME, toon(0xf4ead6), [x, H + 2.4, cz], [0, 0, 0], [1.4, 1.2, 1.4]); B.add(CYL8, gold, [x, H + 3.8, cz], [0, 0, 0], [0.05, 0.6, 0.05]); }
        // stall: awning, counter, goods
        const az = z - w / 2, aw = Math.min(w - 1, 5), am = toon(0xffffff, awning(trims[i % 5], "#f4ead6"));
        B.add(BOX, am, [x - s * (d / 2 + 1.3), 2.9, az], [0, 0, s * 0.35], [2.8, 0.06, aw]); for (const dz of [-aw / 2, aw / 2]) B.add(CYL8, wood, [x - s * (d / 2 + 2.5), 1.25, az + dz], [0, 0, 0], [0.06, 2.5, 0.06]);
        B.add(BOX, wood, [x - s * (d / 2 + 0.9), 0.45, az], [0, 0, 0], [1.4, 0.9, aw - 0.4]);
        const kind = i % 4;
        for (let q = 0; q < 5; q++) { const gz = az - aw / 2 + 0.6 + q * (aw - 1.2) / 4, gx = x - s * (d / 2 + 0.9);
          if (kind === 0) { B.add(CONE, [toon(0xe8a020), toon(0xd1202f), toon(0x8a5a2a), toon(0x6a9a40), toon(0xe86a2a)][q], [gx, 1.15, gz], [0, 0, 0], [0.32, 0.5, 0.32]); B.add(CYL, brass, [gx, 0.92, gz], [0, 0, 0], [0.36, 0.05, 0.36]); }
          else if (kind === 1) pot(B, gx, gz, 0.9, q, 0.9);
          else if (kind === 2) { B.add(CYL8, fabrics[(q + i) % 6], [gx, 1.1, gz], [0, 0, Math.PI / 2], [0.18, 1.2, 0.18]); B.add(BOX, fabrics[(q + i + 2) % 6], [gx - s * 0.5, 2.0, gz], [0, 0, 0], [0.04, 1.6, 0.6]); }
          else { B.add(CYL, toon(0xb08a4a), [gx, 1.0, gz], [0, 0, 0], [0.3, 0.2, 0.3]); for (let r = 0; r < 4; r++) B.add(SPH, [toon(0xd1202f), toon(0xe8a020), toon(0x6a9a40)][(q + r) % 3], [gx + (r - 1.5) * 0.12, 1.16, gz + (r % 2) * 0.1], [0, 0, 0], [0.1, 0.1, 0.1]); }
        }
        if (rnd(i + 5) < 0.6) for (let q = 0; q < 3; q++) pot(B, x - s * (d / 2 + 0.3), z - 0.4 - q * 0.7, 0.8, q + i);
        z -= w;
      }
      for (let z = 40; z > -130; z -= 13) { // laundry + bunting lines across the street
        const y = 6.5 + rnd(z) * 1.5; B.beam(toon(0x3a3a3a), [X - 7, y, z], [X + 7, y, z + 1], 0.03);
        for (let q = 0; q < 9; q++) { const t = (q + 0.5) / 9, xx = X - 7 + 14 * t, yy = y - Math.sin(Math.PI * t) * 0.8; B.add(PRISM, fabrics[(q + Math.abs(z)) % 6], [xx, yy - 0.25, z + t], [0, 0, Math.PI], [0.22, 0.04, 0.3].map((v, k) => k === 1 ? 0.02 : v) as V3); }
      }
      // carts, bundles, sacks, a well, trees, the Qutub Minar at the end of the street
      const cart = (x: number, z: number, ry: number, loaded: boolean) => {
        const M = (p: V3, s: V3, r: V3 = [0, 0, 0], g: THREE.BufferGeometry = BOX, m: THREE.Material = wood) => B.addM(g, m, new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1)).multiply(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s))));
        M([0, 0.9, 0], [1.6, 0.15, 2.6]); M([0, 1.15, 1.25], [1.6, 0.4, 0.08]); M([0, 1.15, -1.25], [1.6, 0.4, 0.08]);
        for (const sx of [-0.95, 0.95]) { M([sx, 0.75, 0], [0.75, 0.12, 0.75], [0, 0, Math.PI / 2], CYL, woodD); M([sx * 1.05, 0.75, 0], [0.12, 0.14, 0.12], [0, 0, Math.PI / 2], CYL8, woodD); }
        M([0, 0.85, 2.4], [0.1, 0.1, 2.2]);
        if (loaded) for (let q = 0; q < 5; q++) M([(q % 2 - 0.5) * 0.7, 1.3 + Math.floor(q / 2) * 0.35, (q - 2) * 0.45], [0.55, 0.4, 0.5], [0, q * 0.3, 0], SPH, fabrics[q % 6]);
      };
      cart(X - 3, -10, 0.2, true); cart(X + 3.5, -38, -0.1, true); cart(X - 2.5, -66, 0.1, false); cart(X + 3, 12, 0, true);
      for (let q = 0; q < 26; q++) B.add(SPH, fabrics[q % 6], [X + (rnd(q + 300) - 0.5) * 9, 0.3, -5 - rnd(q + 301) * 90], [0, rnd(q), 0], [0.38, 0.32, 0.42]);
      for (let q = 0; q < 10; q++) B.add(CYL8, toon(0xd9c9a0), [X + (rnd(q + 330) - 0.5) * 10, 0.4, -20 - rnd(q + 331) * 60], [0, 0, 0], [0.35, 0.8, 0.35]);
      B.add(CYL, toon(0xd9cdb6), [X + 2, 0.5, -52], [0, 0, 0], [1.1, 1.0, 1.1]); for (const s of [-1, 1]) B.add(BOX, wood, [X + 2 + s * 0.9, 1.4, -52], [0, 0, 0], [0.12, 1.8, 0.12]); B.add(BOX, wood, [X + 2, 2.3, -52], [0, 0, 0], [2, 0.12, 0.12]);
      tree(B, X - 4, -28, 1.1, 3); tree(B, X + 4.5, -84, 1.2, 7); palm(B, X - 5, 20, 7, 2);
      const mx = X, mz = -175, mm = toon(0xffffff, minarTex());
      const tiers: [number, number, number][] = [[7, 5.6, 22], [5.6, 4.6, 18], [4.6, 3.8, 15], [3.8, 3.2, 10], [3.2, 2.8, 7]];
      let y = 0;
      for (const [r0, r1, h] of tiers) { const g = new THREE.CylinderGeometry(r1, r0, h, 24); const m = new THREE.Mesh(g, mm); m.position.set(mx, y + h / 2, mz); m.castShadow = true; R.add(m); y += h; B.add(CYL, toon(0xe9dcc0), [mx, y + 0.3, mz], [0, 0, 0], [r1 + 1.2, 0.6, r1 + 1.2]); for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; B.add(BOX, toon(0xe9dcc0), [mx + Math.cos(a) * (r1 + 1.1), y + 0.9, mz + Math.sin(a) * (r1 + 1.1)], [0, -a, 0], [0.12, 0.8, 0.12]); } }
      B.add(DOME, toon(0xe9dcc0), [mx, y + 0.6, mz], [0, 0, 0], [2.4, 2.4, 2.4]);
      for (let k = 0; k < 30; k++) B.add(BOX, toon(0xf2d9a8), [X + (rnd(k + 500) - 0.5) * 160, 4, -150 - rnd(k + 501) * 80], [0, 0, 0], [10, 8, 10]);
    }
    // ================= ROAD =================
    { const B = set(), X = RX;
      plane(800, 1800, toon(0xffffff, sandTex(160)), [X, -0.01, 700]); plane(12, 1600, toon(0xffffff, dirtTex(200).clone()), [X, 0.01, 700]);
      for (let z = -60; z < 1500; z += 11) for (const s of [-1, 1]) tree(B, X + s * 9, z + (s > 0 ? 5 : 0), 1.0 + rnd(z + s) * 0.25, z + (s > 0 ? 3 : 0));
      for (let z = 30; z < 1500; z += 90) for (const s of [-1, 1]) { // rest houses (a domed pavilion, a well, water pots) and kos minars
        const x = X + s * 17;
        for (const dx of [-2, 2]) for (const dz of [-2, 2]) B.add(OCT, sandL, [x + dx, 1.6, z + dz], [0, 0, 0], [0.3, 3.2, 0.3]);
        B.add(BOX, sand, [x, 3.35, z], [0, 0, 0], [5, 0.4, 5]); B.add(DOME, toon(0xf4ead6), [x, 3.5, z], [0, 0, 0], [2.2, 1.8, 2.2]); B.add(CYL8, gold, [x, 5.6, z], [0, 0, 0], [0.06, 0.8, 0.06]);
        B.add(BOX, sand, [x, 0.15, z], [0, 0, 0], [5.4, 0.3, 5.4]);
        B.add(CYL, toon(0xd9cdb6), [x + s * 4.5, 0.5, z + 3], [0, 0, 0], [0.9, 1.0, 0.9]); pot(B, x + s * 3.4, z + 3.8, 1, 0); pot(B, x + s * 3.0, z + 4.3, 0.8, 2);
        if ((z / 90) % 2 < 1 && s > 0) { B.add(CYL, sandL, [X - 13, 4, z + 45], [0, 0, 0], [0.9, 8, 0.9]); B.add(DOME, sandL, [X - 13, 8, z + 45], [0, 0, 0], [0.9, 0.7, 0.9]); }
      }
      for (let k = 0; k < 60; k++) { const z = rnd(k + 900) * 1500, s = rnd(k + 901) < 0.5 ? -1 : 1, x = X + s * (30 + rnd(k + 902) * 300); B.add(ICO, toon(0xb08a5a), [x, 0, z], [rnd(k), rnd(k + 1), 0], [3 + rnd(k) * 8, 2 + rnd(k + 3) * 4, 3 + rnd(k + 4) * 6]); if (k % 3 === 0) palm(B, x + 6, z, 6 + rnd(k) * 3, k); }
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; B.add(CONE, toon(0xa88a6a), [X + Math.cos(a) * 900, 60, 700 + Math.sin(a) * 900], [0, 0, 0], [260, 160, 260]); }
      // abandoned bundles along the road (after the march)
      for (let k = 0; k < 20; k++) B.add(SPH, fabrics[k % 6], [X + (rnd(k + 700) - 0.5) * 8, 0.25, 40 + rnd(k + 701) * 400], [0, rnd(k), 0], [0.35, 0.28, 0.4]);
    }
    // ================= FORT (Daulatabad) =================
    { const B = set(), X = FX;
      plane(1200, 1200, toon(0xffffff, sandTex(140)), [X, -0.01, 0]);
      B.add(CONE, toon(0x8a7a62), [X, 45, -120], [0, 0, 0], [110, 90, 110]);
      for (let k = 0; k < 40; k++) { const a = rnd(k + 40) * Math.PI * 2, h = 10 + rnd(k + 41) * 60, r = (1 - h / 90) * 105; B.add(ICO, toon(0x7a6a52), [X + Math.cos(a) * r, h, -120 + Math.sin(a) * r], [rnd(k), rnd(k + 2), 0], [6 + rnd(k) * 6, 4, 6]); }
      for (const [h, r] of [[8, 98], [30, 72], [52, 47], [72, 25]] as const) {
        for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2, a2 = ((k + 1) / 48) * Math.PI * 2; B.beam(sand, [X + Math.cos(a) * r, h, -120 + Math.sin(a) * r], [X + Math.cos(a2) * r, h, -120 + Math.sin(a2) * r], 2.6); if (k % 3 === 0) B.add(CYL, sandL, [X + Math.cos(a) * r, h + 2, -120 + Math.sin(a) * r], [0, 0, 0], [1.6, 4, 1.6]); }
      }
      B.add(BOX, sand, [X, 56, -120], [0, 0, 0], [12, 10, 12]); B.add(DOME, toon(0xf4ead6), [X, 61, -120], [0, 0, 0], [5, 4, 5]); for (const s of [-1, 1]) B.add(DOME, toon(0xf4ead6), [X + s * 5, 61, -116], [0, 0, 0], [1.5, 1.5, 1.5]);
      // gate on the outer wall facing the road, banners
      B.add(BOX, sand, [X, 7, -22], [0, 0, 0], [26, 14, 4]); B.add(BOX, woodD, [X, 4, -19.9], [0, 0, 0], [6, 8, 0.3]); for (const s of [-1, 1]) { B.add(CYL, sandL, [X + s * 8, 9, -21], [0, 0, 0], [3, 18, 3]); B.add(DOME, sandL, [X + s * 8, 18, -21], [0, 0, 0], [3, 2.6, 3]); }
      const bn = new THREE.Mesh(new THREE.PlaneGeometry(2, 4.4), toon(0xffffff, canopyTex(), THREE.DoubleSide)); for (const s of [-1, 1]) { const b = bn.clone(); b.position.set(X + s * 4, 10, -19.8); R.add(b); }
      // the Chand Minar (tall, banded, balconies) in front of the hill, and the town at its foot
      const cx = X + 26, cz = -40, cm = toon(0xffffff, minarTex());
      let y = 0; for (const [r0, r1, h] of [[3.2, 2.7, 20], [2.7, 2.2, 16], [2.2, 1.8, 12], [1.8, 1.4, 9]] as const) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 20), cm); m.position.set(cx, y + h / 2, cz); m.castShadow = true; R.add(m); y += h; B.add(CYL, toon(0xe9dcc0), [cx, y + 0.3, cz], [0, 0, 0], [r1 + 1, 0.5, r1 + 1]); }
      B.add(DOME, toon(0xe9dcc0), [cx, y + 0.5, cz], [0, 0, 0], [1.4, 1.6, 1.4]);
      const walls = ["#f2d9a8", "#e9b8a0", "#f2e2c0", "#d9c9e9"];
      for (let k = 0; k < 70; k++) { const a = -Math.PI / 2 + (rnd(k + 60) - 0.5) * 2.2, r = 30 + rnd(k + 61) * 60, x = X + Math.cos(a) * r * 1.4, z = 10 + Math.sin(a) * r * -0.6 + 30, w = 5 + rnd(k) * 4, h = 3 + rnd(k + 2) * 4; if (Math.abs(x - X) < 8 && z < 20) continue; B.add(BOX, toon(parseInt(walls[k % 4].slice(1), 16)), [x, h / 2, z], [0, rnd(k) * 0.3, 0], [w, h, w * 0.8]); if (k % 3 === 0) B.add(DOME, toon(0xf4ead6), [x, h, z], [0, 0, 0], [1.4, 1.2, 1.4]); }
      for (let k = 0; k < 24; k++) palm(B, X + (rnd(k + 80) - 0.5) * 160, 50 + rnd(k + 81) * 60, 6 + rnd(k) * 3, k);
      plane(14, 300, toon(0xffffff, dirtTex(40)), [X, 0.01, 130]);
    }
    for (const B of sets) { const g = new THREE.Group(); B.build(g); g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } }); R.add(g); }
    this.lamps = new Flames(R, lamps, 0.35);
    // glints (star sprites), dust puffs, warm lights
    this.glintMat = new THREE.SpriteMaterial({ map: starTex(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false });
    for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(this.glintMat); s.layers.set(NOINK); s.visible = false; R.add(s); this.glints.push(s); }
    this.puffMat = toon(0xe8d4b0) as THREE.MeshToonMaterial;
    for (let i = 0; i < 40; i++) { const p = new THREE.Mesh(SPH, this.puffMat); p.visible = false; R.add(p); this.puffs.push(p); }
    for (let i = 0; i < 2; i++) { const l = new THREE.PointLight(0xffa850, 0, 16, 1.4); R.add(l); this.warm.push(l); }
    this.people = new THREE.Group(); R.add(this.people);
    this.cloudMat = new THREE.MeshBasicMaterial({ map: canvasTex(256, 128, (g) => { g.fillStyle = "#fff"; for (const [x, y, r] of [[60, 80, 36], [110, 60, 48], [165, 70, 40], [205, 85, 28], [130, 92, 50]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } }), transparent: true, depthWrite: false, fog: false, toneMapped: false });
    for (let i = 0; i < 24; i++) { const a = rnd(i + 950) * Math.PI * 2, r = 1100 + rnd(i + 951) * 150, s = 160 + rnd(i + 952) * 140; const c = new THREE.Mesh(new THREE.PlaneGeometry(s, s / 2), this.cloudMat); c.position.set(Math.cos(a) * r, 160 + rnd(i + 953) * 220, Math.sin(a) * r); c.layers.set(NOINK); this.sky.add(c); c.lookAt(0, 0, 0); }
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.03;
    R.add(this.hemi, this.sun, this.sun.target);
    void ramp; void HALF; void CONE4;
  }

  /** glints: [x, y, z, t0] pops; dust: [x, z, t0] sources */
  set(o: { light: LightName; t: number; px: number; cam: V3; look: V3; glints?: [number, number, number, number][]; dust?: [number, number, number][]; warm?: V3[]; shadowR?: number }) {
    const L = o.light;
    this.sky.position.set(...o.cam);
    this.skyMat.map = this.skies[L]; this.skyMat.needsUpdate = true;
    const P = {
      court: { hs: 0xfff0dc, hg: 0x8a6a4a, hi: 1.25, sc: 0xffe0b0, si: 2.6, sd: [-0.5, 0.75, 0.45], fog: 0xf2e2c0, fn: 60, ff: 400, lamp: 1, cl: 0xffffff },
      day: { hs: 0xe0ecff, hg: 0x8a6a4a, hi: 1.3, sc: 0xfff0d0, si: 2.9, sd: [0.55, 0.8, 0.35], fog: 0xf4e6c8, fn: 80, ff: 700, lamp: 0, cl: 0xffffff },
      heat: { hs: 0xfff0d8, hg: 0xa07a4a, hi: 1.35, sc: 0xffd8a0, si: 3.1, sd: [0.3, 0.7, -0.6], fog: 0xf6dcae, fn: 50, ff: 600, lamp: 0, cl: 0xfff2e0 },
      dusk: { hs: 0xd8b0c0, hg: 0x5a4050, hi: 1.2, sc: 0xffa070, si: 2.4, sd: [-0.7, 0.3, -0.4], fog: 0xe8a888, fn: 60, ff: 600, lamp: 1, cl: 0xffc0a0 },
      ghost: { hs: 0xd8d0c0, hg: 0x6a5a4a, hi: 1.2, sc: 0xffe8c8, si: 2.0, sd: [0.6, 0.6, 0.3], fog: 0xd9c4a0, fn: 20, ff: 260, lamp: 0, cl: 0xe0d8c8 },
    }[L];
    this.hemi.color.set(P.hs); this.hemi.groundColor.set(P.hg); this.hemi.intensity = P.hi;
    this.sun.color.set(P.sc); this.sun.intensity = P.si;
    // sun + shadow box follow the subject (the camera's look point)
    const sd = new THREE.Vector3(...(P.sd as V3)).normalize(), r = o.shadowR ?? 26;
    this.sun.target.position.set(...o.look); this.sun.position.copy(this.sun.target.position).addScaledVector(sd, 120); this.sun.target.updateMatrixWorld();
    const sc = this.sun.shadow.camera; sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 20; sc.far = 260; sc.updateProjectionMatrix();
    this.fog.color.set(P.fog); this.fog.near = P.fn; this.fog.far = P.ff;
    this.cloudMat.color.set(P.cl);
    this.lamps.mat.uniforms.uTime.value = o.t; this.lamps.mat.uniforms.uPx.value = o.px; this.lamps.mat.uniforms.uLit.value = P.lamp;
    this.warm.forEach((l, i) => { const w = o.warm?.[i]; l.intensity = w ? 5 * (0.92 + 0.08 * Math.sin(o.t * 9 + i)) : 0; if (w) l.position.set(...w); });
    // glints: a star that pops and fades over 0.5 s
    this.glints.forEach((g, i) => { const d = o.glints?.[i]; if (!d) { g.visible = false; return; } const age = o.t - d[3]; const k = age < 0 || age > 0.55 ? 0 : Math.sin((Math.PI * age) / 0.55); g.visible = k > 0.01; g.position.set(d[0], d[1], d[2]); g.scale.setScalar(0.55 * k); g.material.rotation = age * 2; });
    // dust: drifting puffs from sources
    let pi = 0;
    for (const [x, z, t0] of o.dust ?? []) for (let k = 0; k < 8 && pi < this.puffs.length; k++, pi++) {
      const p = this.puffs[pi], period = 0.35, birth = Math.floor((o.t - t0) / period) * period + t0 - k * period, age = o.t - birth, life = 8 * period;
      const s = birth < t0 ? 0 : Math.min(1, age / 0.4) * (1 - Math.max(0, (age - life * 0.6) / (life * 0.4)));
      p.visible = s > 0.02; p.position.set(x + Math.sin(k * 2.3) * age * 0.8, 0.2 + age * 0.45, z + Math.cos(k * 1.7) * age * 0.6); p.scale.setScalar((0.25 + age * 0.3) * s);
    }
    for (; pi < this.puffs.length; pi++) this.puffs[pi].visible = false;
  }
}
