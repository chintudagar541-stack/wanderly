// "Why India Celebrates Diwali Differently" (reference-style Diwali short): violet nights full of warm light.
//   HOME     (x 0):    a lane of decorated Indian houses at night. The family house has a glowing doorway, a carved
//                      frame, a marigold toran, akash kandils, string lights, a huge rangoli with a hero diya, and
//                      rows of diyas. Opposite houses, overhead light strings, and fireworks above.
//   AYODHYA  (x 400):  a pink-lavender palace city on a river. Ghat steps lined with thousands of diyas, flame
//                      reflections in the water, the swan boat bringing Raam home, a far bank of temples.
// More sets (Amritsar, Kolkata, Goa, Varanasi) are added after the opening clip is approved.
import * as THREE from "three";
import { NOINK } from "../bridge/ink";
import { Flames } from "../diwali/world";
import { Batch, V3, rnd, toon, canvasTex, BOX, CYL, CONE, SPH, CYL8, DOME, PRISM } from "../eiffel/lib";

export type LightName = "home" | "ayodhya" | "close";
export const HX = 0, AX = 400;
/** the family doorway (centre of the threshold) and the hero diya on the rangoli */
export const DOOR: V3 = [HX, 0, -6];
export const DIYA: V3 = [HX, 0, -0.9];
/** river surface height and the swan boat's lane (z) in Ayodhya */
export const WATER_Y = -0.6, BOAT_Z = 10;
type Pt = { p: V3; order: number; tint?: V3 };

const tex = canvasTex;
const rangoliTex = () => tex(512, 512, (g) => {
  g.clearRect(0, 0, 512, 512); const c = 256;
  const ring = (r: number, n: number, col: string, w: number, h: number, off = 0) => { g.fillStyle = col; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + off; g.save(); g.translate(c + Math.cos(a) * r, c + Math.sin(a) * r); g.rotate(a + Math.PI / 2); g.beginPath(); g.ellipse(0, 0, w, h, 0, 0, Math.PI * 2); g.fill(); g.restore(); } };
  g.fillStyle = "#f4f1ea"; g.beginPath(); g.arc(c, c, 250, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#d1202f"; g.beginPath(); g.arc(c, c, 240, 0, Math.PI * 2); g.fill();
  ring(222, 36, "#f2c14e", 12, 18); g.fillStyle = "#2a8a5a"; g.beginPath(); g.arc(c, c, 196, 0, Math.PI * 2); g.fill();
  ring(176, 16, "#e8538a", 26, 46); ring(176, 16, "#f4f1ea", 10, 24); g.fillStyle = "#2a4ab0"; g.beginPath(); g.arc(c, c, 128, 0, Math.PI * 2); g.fill();
  ring(108, 12, "#f2a020", 22, 34, 0.26); ring(108, 12, "#f4f1ea", 8, 16, 0.26); g.fillStyle = "#8a2a9a"; g.beginPath(); g.arc(c, c, 68, 0, Math.PI * 2); g.fill();
  ring(48, 8, "#f2c14e", 12, 18); g.fillStyle = "#f4f1ea"; g.beginPath(); g.arc(c, c, 26, 0, Math.PI * 2); g.fill();
  for (let k = 0; k < 72; k++) { const a = (k / 72) * Math.PI * 2; g.fillStyle = "#f4f1ea"; g.beginPath(); g.arc(c + Math.cos(a) * 232, c + Math.sin(a) * 232, 3, 0, Math.PI * 2); g.fill(); }
});
const wallTex = (base: string, trim: string, seed: number) => tex(128, 128, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 50; i++) { g.fillStyle = "rgba(0,0,0,0.05)"; g.fillRect(rnd(seed + i) * 128, rnd(seed + i + 1) * 128, 8, 3); }
  g.fillStyle = trim; g.fillRect(0, 0, 128, 8); g.fillRect(0, 120, 128, 8);
  for (let x = 4; x < 128; x += 16) { g.beginPath(); g.arc(x + 4, 12, 4, 0, Math.PI); g.fill(); }
}, [2, 2]);
const litWindow = (frame: string, arch: boolean) => tex(128, 192, (g) => {
  g.fillStyle = frame; g.fillRect(0, 0, 128, 192);
  const gr = g.createLinearGradient(0, 30, 0, 180); gr.addColorStop(0, "#ffe8a0"); gr.addColorStop(1, "#ff9a3a"); g.fillStyle = gr;
  g.beginPath(); g.moveTo(16, 180); g.lineTo(16, 60); if (arch) g.quadraticCurveTo(64, 0, 112, 60); else g.lineTo(112, 60); g.lineTo(112, 180); g.closePath(); g.fill();
  g.strokeStyle = frame; g.lineWidth = 7; g.beginPath(); g.moveTo(64, 30); g.lineTo(64, 180); g.moveTo(16, 110); g.lineTo(112, 110); g.stroke();
  g.fillStyle = "rgba(120,40,20,0.35)"; g.fillRect(24, 120, 30, 56); g.fillRect(74, 120, 30, 56);
});
const doorGlow = () => tex(128, 256, (g) => {
  const gr = g.createRadialGradient(64, 170, 10, 64, 170, 170); gr.addColorStop(0, "#fff6d0"); gr.addColorStop(0.5, "#ffc060"); gr.addColorStop(1, "#e0702a"); g.fillStyle = gr; g.fillRect(0, 0, 128, 256);
  g.fillStyle = "rgba(160,70,20,0.35)"; g.fillRect(20, 190, 88, 8); g.fillRect(56, 120, 16, 70);
});
const carvedFrame = () => tex(64, 256, (g) => {
  g.fillStyle = "#7a3a1a"; g.fillRect(0, 0, 64, 256); g.fillStyle = "#e8b84a";
  for (let y = 10; y < 256; y += 26) { g.beginPath(); g.moveTo(32, y); g.lineTo(48, y + 12); g.lineTo(32, y + 24); g.lineTo(16, y + 12); g.closePath(); g.fill(); g.fillStyle = "#d1202f"; g.beginPath(); g.arc(32, y + 12, 4, 0, Math.PI * 2); g.fill(); g.fillStyle = "#e8b84a"; }
  g.fillRect(4, 0, 4, 256); g.fillRect(56, 0, 4, 256);
});
const ghatTex = () => tex(128, 64, (g) => { g.fillStyle = "#c9a0b8"; g.fillRect(0, 0, 128, 64); g.fillStyle = "rgba(80,40,70,0.25)"; for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 2, 64); g.fillRect(0, 0, 128, 3); }, [20, 1]);
const palaceTex = (base: string, trim: string) => tex(256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256); g.fillStyle = trim; g.fillRect(0, 0, 256, 12); g.fillRect(0, 124, 256, 8);
  for (const [x, y] of [[20, 30], [84, 30], [148, 30], [212, 30], [20, 150], [84, 150], [148, 150], [212, 150]]) {
    g.fillStyle = trim; g.fillRect(x - 4, y - 4, 32, 92); const gr = g.createLinearGradient(0, y, 0, y + 80); gr.addColorStop(0, "#ffe8a0"); gr.addColorStop(1, "#ff8a3a"); g.fillStyle = gr;
    g.beginPath(); g.moveTo(x, y + 84); g.lineTo(x, y + 26); g.quadraticCurveTo(x + 12, y - 2, x + 24, y + 26); g.lineTo(x + 24, y + 84); g.closePath(); g.fill();
  }
}, [3, 1]);
const waterTex = () => tex(256, 256, (g) => {
  g.fillStyle = "#2a1f5a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) { const y = rnd(i) * 256, x = rnd(i + 1) * 256, w = 10 + rnd(i + 2) * 40; g.fillStyle = rnd(i + 3) < 0.5 ? "rgba(120,100,220,0.35)" : "rgba(20,10,50,0.4)"; g.fillRect(x, y, w, 2); }
}, [20, 10]);
const skyTex = (top: string, mid: string, hor: string) => tex(16, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(0.42, mid); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); });
const dotTex = () => tex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.8)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
const starsTex = () => tex(1024, 512, (g) => { g.clearRect(0, 0, 1024, 512); for (let i = 0; i < 400; i++) { const y = rnd(i + 5) * 260; g.fillStyle = `rgba(255,250,230,${0.3 + rnd(i) * 0.7})`; g.beginPath(); g.arc(rnd(i + 1) * 1024, y, 0.6 + rnd(i + 2) * 1.6, 0, Math.PI * 2); g.fill(); } });

/** firework bursts: [x, y, z, t0, hue] */
export type Burst = [number, number, number, number, number];
const FW_N = 140, FW_MAX = 8;

export class World {
  root = new THREE.Group();
  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  moon = new THREE.DirectionalLight(0xffffff, 1.0);
  sky: THREE.Mesh; skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false });
  skies: Record<LightName, THREE.Texture>;
  fog = new THREE.Fog(0xffffff, 80, 900);
  diyas: Flames; strings: Flames; reflect: Flames;
  warm: THREE.PointLight[] = [];
  doorLight = new THREE.PointLight(0xffa040, 0, 14, 1.6);
  boat = new THREE.Group();
  fw: THREE.Points; fwPos: Float32Array; fwCol: Float32Array; fwMat: THREE.PointsMaterial;
  heroFlame: THREE.Sprite;

  constructor() {
    const R = this.root;
    this.skies = { home: skyTex("#1a1048", "#4a2a8a", "#9a5ab0"), ayodhya: skyTex("#1a1450", "#5a3a9a", "#d07ab0"), close: skyTex("#1a1048", "#4a2a8a", "#9a5ab0") };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 24, 16), this.skyMat); this.sky.layers.set(NOINK); R.add(this.sky);
    { const st = new THREE.Mesh(new THREE.SphereGeometry(1300, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: starsTex(), transparent: true, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false })); st.layers.set(NOINK); this.sky.add(st);
      const mo = new THREE.Mesh(new THREE.CircleGeometry(28, 32), new THREE.MeshBasicMaterial({ color: 0xfff4d8, fog: false, toneMapped: false })); mo.position.set(-420, 520, -1000); mo.lookAt(0, 0, 0); mo.layers.set(NOINK); this.sky.add(mo); }
    const diyas: Pt[] = [], strings: Pt[] = [], refl: Pt[] = [];
    const sets: Batch[] = [];
    const set = () => { const b = new Batch(); sets.push(b); return b; };
    const plane = (w: number, d: number, m: THREE.Material, p: V3, rz = 0) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); q.rotation.set(-Math.PI / 2, 0, rz); q.position.set(...p); q.receiveShadow = true; R.add(q); return q; };
    const vplane = (w: number, h: number, m: THREE.Material, p: V3, ry = 0) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); q.position.set(...p); q.rotation.y = ry; R.add(q); return q; };
    const glow = (m: THREE.Texture) => new THREE.MeshBasicMaterial({ map: m, toneMapped: false, fog: false });
    const clay = toon(0xb5532c), clayD = toon(0x8a3a1e), gold = toon(0xe8b84a), marigold = [toon(0xf2a020), toon(0xe8701a), toon(0xf2c14e)], leafM = toon(0x3f7a34), wood = toon(0x7a3a1a), white = toon(0xf4ead6);
    const STR: V3[] = [[1, 0.3, 0.3], [0.3, 1, 0.4], [0.4, 0.6, 1], [1, 0.85, 0.3], [1, 0.4, 0.9]];
    /** a clay diya with its flame; big = hero diya */
    const diya = (B: Batch, x: number, y: number, z: number, s = 1, order = 0) => { B.add(SPH, clay, [x, y + 0.05 * s, z], [0, 0, 0], [0.12 * s, 0.06 * s, 0.09 * s]); B.add(CYL8, clayD, [x, y + 0.09 * s, z], [0, 0, 0], [0.1 * s, 0.015 * s, 0.075 * s]); diyas.push({ p: [x, y + 0.16 * s, z], order }); };
    /** a hanging string of coloured bulbs from a to b with sag */
    const lightString = (B: Batch, a: V3, b: V3, n: number, sag: number) => { for (let k = 0; k <= n; k++) { const t = k / n, p: V3 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * sag, a[2] + (b[2] - a[2]) * t]; strings.push({ p, order: 0, tint: STR[k % 5] }); if (k < n) { const t2 = (k + 1) / n; B.beam(toon(0x2a2a2a), p, [a[0] + (b[0] - a[0]) * t2, a[1] + (b[1] - a[1]) * t2 - Math.sin(Math.PI * t2) * sag, a[2] + (b[2] - a[2]) * t2], 0.012); } } };
    /** marigold garland swag */
    const garland = (B: Batch, a: V3, b: V3, sag: number, n = 18) => { for (let k = 0; k <= n; k++) { const t = k / n; B.add(SPH, marigold[k % 3], [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * sag, a[2] + (b[2] - a[2]) * t], [0, 0, 0], [0.07, 0.07, 0.07]); } };
    /** akash kandil (star lantern) hanging at p */
    const kandil = (B: Batch, x: number, y: number, z: number, col: number, s = 1) => { const m = new THREE.MeshBasicMaterial({ color: col, toneMapped: false }); const k = new THREE.Mesh(new THREE.OctahedronGeometry(0.32 * s), m); k.position.set(x, y, z); k.layers.set(NOINK); R.add(k); for (let q = 0; q < 4; q++) B.add(BOX, m, [x, y - 0.4 * s - q * 0.08 * s, z + (q - 1.5) * 0.05 * s], [0, 0, 0], [0.02, 0.3 * s, 0.02]); B.add(CYL8, toon(0x2a2a2a), [x, y + 0.6 * s, z], [0, 0, 0], [0.01, 0.6 * s, 0.01]); };
    const toran = (B: Batch, x: number, y: number, z: number, w: number) => { garland(B, [x - w / 2, y, z], [x + w / 2, y, z], 0.18, Math.round(w * 8)); for (let k = 0; k < Math.round(w * 4); k++) B.add(CONE, k % 2 ? leafM : marigold[1], [x - w / 2 + 0.12 + k * 0.25, y - 0.32, z], [Math.PI, 0, 0], [0.07, 0.28, 0.03]); };

    // ================= HOME =================
    const RANG = rangoliTex();
    { const B = set(), X = HX;
      plane(80, 40, toon(0xffffff, tex(128, 128, (g) => { g.fillStyle = "#6a5a7a"; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 120; i++) { g.fillStyle = rnd(i) < 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"; g.fillRect(rnd(i + 1) * 128, rnd(i + 2) * 128, 6, 3); } }, [16, 8])), [X, 0, 2]);
      // rangoli + hero diya + petals
      const rg = plane(5.2, 5.2, new THREE.MeshToonMaterial({ map: rangoliTex(), transparent: true, alphaTest: 0.05 }), [DIYA[0], 0.012, DIYA[2]]); rg.receiveShadow = true;
      { // hero diya: a wide shallow clay bowl with a pinched lip, painted rim dots, oil and a wick
        const [x, , z] = DIYA, bowl = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon(0xc0602e, undefined, THREE.DoubleSide));
        bowl.scale.set(1, 0.42, 0.8); bowl.position.set(x, 0.24, z); bowl.castShadow = true; R.add(bowl);
        B.add(CYL, toon(0xd9a040), [x, 0.235, z], [0, 0, 0], [0.47, 0.02, 0.37]); B.add(CONE, toon(0xc0602e), [x + 0.5, 0.24, z], [0, 0, -Math.PI / 2], [0.1, 0.22, 0.06]);
        for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2; B.add(SPH, k % 2 ? toon(0xf2c14e) : toon(0xf4f1ea), [x + Math.cos(a) * 0.49, 0.2, z + Math.sin(a) * 0.39], [0, 0, 0], [0.03, 0.03, 0.03]); }
        B.add(CYL8, toon(0xf4ead6), [x + 0.52, 0.3, z], [0, 0, -0.5], [0.015, 0.1, 0.015]); }
      for (let k = 0; k < 40; k++) { const a = rnd(k + 60) * Math.PI * 2, r = 2.7 + rnd(k + 61) * 0.9; B.add(SPH, marigold[k % 3], [DIYA[0] + Math.cos(a) * r, 0.03, DIYA[2] + Math.sin(a) * r], [0, 0, 0], [0.06, 0.03, 0.06]); }
      for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; diya(B, DIYA[0] + Math.cos(a) * 2.75, 0.01, DIYA[2] + Math.sin(a) * 2.75, 1.2); }
      // the row of houses behind (z = -6, facing +z) and across the lane (z = +11, facing -z)
      const walls = ["#e8a0b8", "#f2c88a", "#a8d0e0", "#c9a8e0", "#f2e0b0", "#a8e0c0", "#f0b090"], trims = ["#f4f1ea", "#7a2a6a", "#2a6a8a", "#d1202f", "#e8b84a"];
      const KC = [0xff5a3a, 0xffc040, 0x5ae0ff, 0xff60c0, 0x8aff60];
      for (const side of [-1, 1]) for (let hx = -36, i = side > 0 ? 0 : 7; hx < 36; i++) {
        const w = i === 0 && side < 0 ? 0 : 0; void w;
        const W = side < 0 && Math.abs(hx + 6) < 0.1 ? 12 : 6 + Math.floor(rnd(i * 7 + side) * 3) * 1.5, H = 7 + Math.floor(rnd(i + 3) * 2) * 3.2, cx = hx + W / 2, z = side < 0 ? -6 : 11, f = side < 0 ? 1 : -1, d = 8;
        const fam = side < 0 && Math.abs(cx - X) < 0.1;
        const m = toon(0xffffff, wallTex(walls[(i + (side > 0 ? 3 : 0)) % 7], trims[i % 5], i * 11)); (m.map as THREE.Texture).repeat.set(Math.round(W / 3), Math.round(H / 3));
        B.add(BOX, m, [cx, H / 2, z - f * d / 2], [0, 0, 0], [W, H, d]);
        B.add(BOX, toon(parseInt(trims[i % 5].slice(1), 16)), [cx, H + 0.25, z - f * d / 2], [0, 0, 0], [W + 0.3, 0.5, d + 0.3]);
        for (let q = -W / 2 + 0.3; q < W / 2; q += 0.6) B.add(BOX, white, [cx + q, H + 0.75, z - f * 0.2], [0, 0, 0], [0.25, 0.5, 0.25]);
        // windows on both floors, a balcony on the upper floor, lights along the parapet, a kandil, a toran
        for (let fl = 0; fl < 2; fl++) for (let q = 0; q < Math.max(1, Math.floor(W / 3)); q++) { const wx = cx - W / 2 + (q + 0.5) * (W / Math.max(1, Math.floor(W / 3))); if (fam && fl === 0 && Math.abs(wx - X) < 2) continue; vplane(1.3, 1.9, glow(litWindow(trims[(i + 2) % 5], (i + q) % 2 === 0)), [wx, 1.6 + fl * 3.4, z + f * 0.01], f > 0 ? 0 : Math.PI); }
        B.add(BOX, white, [cx, 3.5, z + f * 0.5], [0, 0, 0], [W - 0.6, 0.15, 1.0]); for (let q = -W / 2 + 0.5; q < W / 2 - 0.3; q += 0.3) B.add(CYL8, toon(parseInt(trims[(i + 1) % 5].slice(1), 16)), [cx + q, 3.85, z + f * 0.95], [0, 0, 0], [0.03, 0.6, 0.03]); B.add(BOX, toon(parseInt(trims[(i + 1) % 5].slice(1), 16)), [cx, 4.15, z + f * 0.95], [0, 0, 0], [W - 0.6, 0.08, 0.08]);
        lightString(B, [cx - W / 2 + 0.2, H + 0.05, z + f * 0.25], [cx + W / 2 - 0.2, H + 0.05, z + f * 0.25], Math.round(W * 3), 0.25);
        lightString(B, [cx - W / 2 + 0.4, 4.2, z + f * 1.0], [cx + W / 2 - 0.4, 4.2, z + f * 1.0], Math.round(W * 3), 0.18);
        garland(B, [cx - W / 2 + 0.4, 3.4, z + f * 1.02], [cx + W / 2 - 0.4, 3.4, z + f * 1.02], 0.25, Math.round(W * 4));
        kandil(B, cx + (rnd(i) - 0.5) * (W - 2), 2.95, z + f * 0.8, KC[i % 5], 1.1);
        if (!fam) { // a door with toran + diyas on the step
          const dx = cx + (rnd(i + 9) - 0.5) * (W - 3); vplane(1.2, 2.2, glow(doorGlow()), [dx, 1.1, z + f * 0.01], f > 0 ? 0 : Math.PI); toran(B, dx, 2.4, z + f * 0.06, 1.4);
          B.add(BOX, white, [dx, 0.08, z + f * 0.45], [0, 0, 0], [1.8, 0.16, 0.9]);
          const rgo = plane(2.2, 2.2, new THREE.MeshToonMaterial({ map: RANG, transparent: true, alphaTest: 0.05 }), [dx, 0.011, z + f * 2.1]); rgo.receiveShadow = true; for (let q = 0; q < 5; q++) diya(B, dx - 0.8 + q * 0.4, 0.16, z + f * 0.8, 1);
          for (let q = 0; q < 2; q++) { B.add(CYL, clay, [dx + (q ? 1.3 : -1.3), 0.35, z + f * 0.5], [0, 0, 0], [0.28, 0.7, 0.28]); B.add(SPH, leafM, [dx + (q ? 1.3 : -1.3), 0.85, z + f * 0.5], [0, 0, 0], [0.32, 0.32, 0.32]); }
        }
        hx += W;
      }
      // the family doorway: glowing door, carved frame, steps, toran, big kandils, brass urns, banana stems
      { const [dx, , dz] = DOOR;
        vplane(1.9, 2.9, glow(doorGlow()), [dx, 1.6, dz + 0.02]);
        for (const s of [-1, 1]) { vplane(0.45, 3.3, toon(0xffffff, carvedFrame()), [dx + s * 1.17, 1.75, dz + 0.05]); B.add(CYL, toon(0xd9a040), [dx + s * 1.9, 0.75, dz + 1.2], [0, 0, 0], [0.32, 0.9, 0.32]); B.add(SPH, toon(0xd9a040), [dx + s * 1.9, 1.3, dz + 1.2], [0, 0, 0], [0.25, 0.2, 0.25]); B.add(SPH, leafM, [dx + s * 1.9, 1.55, dz + 1.2], [0, 0, 0], [0.3, 0.2, 0.3]);
          for (let k = 0; k < 6; k++) B.add(CONE, leafM, [dx + s * 1.55, 1.2 + k * 0.35, dz + 0.3], [0, 0, s * (0.6 + k * 0.1)], [0.08, 0.8, 0.03]); }
        B.add(BOX, toon(0x7a3a1a), [dx, 3.55, dz + 0.08], [0, 0, 0], [2.8, 0.4, 0.3]); toran(B, dx, 3.35, dz + 0.26, 2.6);
        for (let k = 0; k < 3; k++) B.add(BOX, k % 2 ? white : toon(0xe8dcc8), [dx, 0.1 + k * 0.2, dz + 1.1 - k * 0.35], [0, 0, 0], [3.4 - k * 0.3, 0.2, 0.7]);
        for (let k = 0; k < 9; k++) diya(B, dx - 1.6 + k * 0.4, 0.62, dz + 0.45, 1); for (let k = 0; k < 9; k++) diya(B, dx - 1.6 + k * 0.4, 0.2, dz + 1.4, 1);
        kandil(B, dx - 2.6, 3.0, dz + 0.9, 0xff5a3a, 1.4); kandil(B, dx + 2.6, 3.0, dz + 0.9, 0xffc040, 1.4);
        this.doorLight.position.set(dx, 1.6, dz + 1.6); R.add(this.doorLight); }
      // light strings zig-zagging across the lane
      for (let x = -32; x < 32; x += 4) lightString(B, [x, 6.8, -5.6], [x + 2, 6.8, 10.6], 26, 0.9);
      // kids' sparkler corner, sweets table, scooters, pots
      { const tx = X + 6.5, tz = 3; B.add(BOX, toon(0xd1202f), [tx, 0.4, tz], [0, 0, 0], [1.6, 0.8, 0.8]); for (let k = 0; k < 8; k++) B.add(SPH, [toon(0xf2c14e), toon(0xf4ead6), toon(0xe8701a)][k % 3], [tx - 0.6 + (k % 4) * 0.4, 0.9, tz - 0.15 + Math.floor(k / 4) * 0.3], [0, 0, 0], [0.12, 0.12, 0.12]); B.add(CYL, gold, [tx, 0.82, tz], [0, 0, 0], [0.7, 0.03, 0.35]); }
      for (const [sx, sz, ry] of [[-7, 4, 0.4], [9.5, 6, -0.3], [-15, 7.5, 0.1]] as const) { B.add(BOX, toon(0x2a6ab0), [sx, 0.55, sz], [0, ry, 0], [0.5, 0.5, 1.5]); B.add(CYL, toon(0x2a2a2a), [sx + Math.sin(ry) * 0.6, 0.25, sz + Math.cos(ry) * 0.6], [0, ry, Math.PI / 2], [0.25, 0.12, 0.25]); B.add(CYL, toon(0x2a2a2a), [sx - Math.sin(ry) * 0.6, 0.25, sz - Math.cos(ry) * 0.6], [0, ry, Math.PI / 2], [0.25, 0.12, 0.25]); B.add(BOX, toon(0x2a2a2a), [sx + Math.sin(ry) * 0.6, 1.05, sz + Math.cos(ry) * 0.6], [0, ry, 0], [0.7, 0.06, 0.06]); }
      // stalls in the lane: sweets, crackers, diyas and lanterns for sale
      for (const [sx, sz, kind] of [[-11, 7.4, 0], [12, 7.6, 1], [-22, 7.2, 2], [21, 7.5, 0], [-30, 7.3, 1], [28, 7.4, 2]] as const) {
        const top = [0xd1202f, 0x2e7a4a, 0x2a4ab0][kind], aw = toon(0xffffff, tex(64, 64, (g) => { for (let k = 0; k < 64; k += 16) { g.fillStyle = ["#d1202f", "#2e7a4a", "#2a4ab0"][kind]; g.fillRect(k, 0, 8, 64); g.fillStyle = "#f4ead6"; g.fillRect(k + 8, 0, 8, 64); } }, [3, 1]));
        B.add(BOX, toon(0x7a3a1a), [sx, 0.5, sz], [0, 0, 0], [2.6, 1.0, 1.0]); B.add(BOX, aw, [sx, 2.5, sz - 0.2], [-0.3, 0, 0], [3.0, 0.05, 1.6]); for (const dx of [-1.3, 1.3]) B.add(CYL8, toon(top), [sx + dx, 1.25, sz - 0.9], [0, 0, 0], [0.05, 2.5, 0.05]);
        lightString(B, [sx - 1.4, 2.3, sz - 0.95], [sx + 1.4, 2.3, sz - 0.95], 10, 0.15);
        for (let q = 0; q < 10; q++) { const gx = sx - 1.1 + (q % 5) * 0.55, gz = sz - 0.25 + Math.floor(q / 5) * 0.4;
          if (kind === 0) { B.add(CYL, gold, [gx, 1.03, gz], [0, 0, 0], [0.22, 0.03, 0.22]); for (let r = 0; r < 3; r++) B.add(SPH, [toon(0xf2c14e), toon(0xf4ead6), toon(0xe8701a)][(q + r) % 3], [gx + (r - 1) * 0.1, 1.1, gz], [0, 0, 0], [0.07, 0.07, 0.07]); }
          else if (kind === 1) { B.add(CYL8, [toon(0xd1202f), toon(0x2a4ab0), toon(0xf2c14e), toon(0x2e7a4a)][q % 4], [gx, 1.18, gz], [0, 0, 0], [0.08, 0.36, 0.08]); B.add(BOX, toon(0xe8538a), [gx + 0.2, 1.05, gz], [0, q, 0], [0.22, 0.1, 0.15]); }
          else diya(B, gx, 1.0, gz, 1.3); }
        if (kind === 2) for (let q = 0; q < 3; q++) kandil(B, sx - 1 + q, 1.95, sz - 0.9, KC[q + 1], 0.7); }
      for (let k = 0; k < 30; k++) { const x = -30 + rnd(k + 90) * 60, z = rnd(k + 91) < 0.5 ? -4.6 : 9.6; if (Math.abs(x) < 3) continue; diya(B, x, 0.01, z, 1); }
    }

    // ================= AYODHYA =================
    { const B = set(), X = AX;
      const water = new THREE.Mesh(new THREE.PlaneGeometry(600, 140), new THREE.MeshBasicMaterial({ map: waterTex(), transparent: true, opacity: 0.94, depthWrite: false, fog: true }));
      water.rotation.x = -Math.PI / 2; water.position.set(X, WATER_Y, 52); water.renderOrder = 1; water.layers.set(NOINK); R.add(water);
      plane(600, 40, toon(0x2a1f4a), [X, WATER_Y - 2, 52]);
      // ghat steps rising from the river (z 0 .. -9), lined with diyas
      const gm = toon(0xffffff, ghatTex());
      for (let k = 0; k < 12; k++) { const y = WATER_Y + k * 0.32, z = -k * 0.75; B.add(BOX, gm, [X, y - 0.5, z - 0.4], [0, 0, 0], [140, 1.0 + 0.32, 0.8]);
        for (let q = 0; q < 210; q++) { const x = X - 70 + q * (140 / 210) + (k % 2) * 0.3; diya(B, x, y + 0.16, z - 0.1, 1, 0); refl.push({ p: [x, 2 * WATER_Y - (y + 0.16) - 0.1, z - 0.1 + 0.8 + k * 0.4], order: 0, tint: [1, 0.55, 0.2] }); } }
      B.add(BOX, toon(0xc9a0b8), [X, WATER_Y + 3.4, -14], [0, 0, 0], [160, 1.6, 10]);
      // the palace complex: wings, towers, domes and chhatris in pink and lavender, lit windows
      const pal = [["#f2b8d0", "#f4f1ea"], ["#d8b8f0", "#f4f1ea"], ["#f2c8a8", "#f4f1ea"]];
      for (let k = 0; k < 9; k++) { const x = X - 48 + k * 12, w = 10, h = 9 + (k % 3) * 3 + (k === 4 ? 6 : 0), z = -22 - (k % 2) * 3, P = pal[k % 3];
        B.add(BOX, toon(0xffffff, palaceTex(P[0], P[1])), [x, 4.2 + h / 2, z], [0, 0, 0], [w, h, 8]);
        B.add(BOX, toon(0xf4f1ea), [x, 4.2 + h + 0.25, z], [0, 0, 0], [w + 0.6, 0.5, 8.6]);
        for (const s of [-1, 1]) { B.add(CYL8, toon(parseInt(P[0].slice(1), 16)), [x + s * w / 2, 4.2 + h / 2 + 1, z + 4], [0, 0, 0], [0.8, h + 2, 0.8]); B.add(DOME, toon(0xf4f1ea), [x + s * w / 2, 4.2 + h + 2, z + 4], [0, 0, 0], [1.0, 1.4, 1.0]); B.add(CYL8, gold, [x + s * w / 2, 4.2 + h + 3.6, z + 4], [0, 0, 0], [0.06, 0.8, 0.06]); }
        B.add(DOME, toon(k === 4 ? 0xe8b84a : 0xf4f1ea), [x, 4.2 + h + 0.4, z], [0, 0, 0], [k === 4 ? 4 : 2.6, k === 4 ? 4.8 : 3, k === 4 ? 4 : 2.6]);
        lightString(B, [x - w / 2, 4.2 + h + 0.55, z + 4.35], [x + w / 2, 4.2 + h + 0.55, z + 4.35], 24, 0.1);
        for (let q = 0; q < 10; q++) diyas.push({ p: [x - w / 2 + 0.5 + q * (w - 1) / 9, 4.2 + 0.2, z + 4.5], order: 0 }); }
      { const x = X, z = -32; B.add(BOX, toon(0xf2b8d0), [x, 18, z], [0, 0, 0], [8, 28, 8]); B.add(CONE, toon(0xe8b84a), [x, 36, z], [0, Math.PI / 4, 0], [5.5, 9, 5.5]); B.add(CYL8, gold, [x, 41.5, z], [0, 0, 0], [0.1, 2, 0.1]); const fl = vplane(2, 1.2, toon(0xe86a2a, undefined, THREE.DoubleSide), [x + 1, 42, z]); void fl; }
      // pennants on poles along the ghat top, palms, lamp posts with diyas
      for (let x = X - 66; x < X + 66; x += 6) { B.add(CYL8, toon(0xf4f1ea), [x, WATER_Y + 3.9 + 2, -9.5], [0, 0, 0], [0.06, 4, 0.06]); B.add(PRISM, [toon(0xe86a2a), toon(0xf2c14e), toon(0xd1202f)][Math.abs(x) % 3], [x + 0.45, WATER_Y + 7.4, -9.5], [Math.PI / 2, 0, Math.PI / 2], [0.4, 0.04, 0.9]); diyas.push({ p: [x, WATER_Y + 8.0, -9.5], order: 0 }); }
      for (let k = 0; k < 14; k++) { const x = X - 60 + k * 9.5, z = -12.5; for (let q = 0; q < 6; q++) B.add(CYL8, toon(0x8a6a3a), [x, WATER_Y + 4.2 + q * 0.8, z], [0, 0, 0.04], [0.18, 0.85, 0.18]); for (let q = 0; q < 7; q++) { const a = q * 0.9; B.add(CONE, leafM, [x + Math.cos(a) * 1.2, WATER_Y + 9.2, z + Math.sin(a) * 1.2], [Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2], [0.35, 2.4, 0.1]); } }
      // the far bank: temples and a line of diyas, mirrored in the water
      for (let k = 0; k < 18; k++) { const x = X - 140 + k * 16 + rnd(k) * 6, h = 5 + rnd(k + 1) * 8; B.add(BOX, toon(0x6a4a8a), [x, h / 2 - 0.5, 104], [0, 0, 0], [8, h, 6]); if (k % 2) B.add(CONE, toon(0x7a5a9a), [x, h + 2, 104], [0, Math.PI / 4, 0], [2.4, 5, 2.4]); }
      for (let q = 0; q < 260; q++) { const x = X - 150 + q * (300 / 260); diyas.push({ p: [x, WATER_Y + 0.4, 100], order: 0 }); refl.push({ p: [x, WATER_Y - 0.9, 97], order: 0, tint: [1, 0.55, 0.2] }); }
      // floating diyas on the river
      for (let q = 0; q < 60; q++) { const x = X - 40 + rnd(q + 200) * 80, z = 3 + rnd(q + 201) * 26; diya(B, x, WATER_Y, z, 1.4); refl.push({ p: [x, WATER_Y - 0.25, z + 0.3], order: 0, tint: [1, 0.55, 0.2] }); }
      // the swan boat (moves): hull, swan neck and head, wings, canopy with pillars and garlands
      { const P = this.boat, m = (g: THREE.BufferGeometry, mt: THREE.Material, p: V3, s: V3, r: V3 = [0, 0, 0]) => { const q = new THREE.Mesh(g, mt); q.position.set(...p); q.scale.set(...s); q.rotation.set(...r); q.castShadow = true; P.add(q); return q; };
        const wht = toon(0xf4f1ea), pink = toon(0xf2b8d0), red = toon(0xd1202f);
        m(SPH, wht, [0, 0.3, 0], [5.0, 0.9, 1.9]); m(BOX, toon(0xe8b84a), [0, 0.95, 0], [8.2, 0.16, 3.0]); m(BOX, red, [0, 1.0, 0], [7.6, 0.06, 2.6]);
        for (let k = 0; k < 7; k++) m(SPH, wht, [4.4 + Math.sin(k * 0.3) * 0.6, 1.0 + k * 0.42, 0], [0.42, 0.42, 0.42]);
        m(SPH, wht, [4.6, 4.05, 0], [0.62, 0.5, 0.5]); m(CONE, toon(0xf2a020), [5.35, 3.98, 0], [0.22, 0.6, 0.18], [0, 0, -Math.PI / 2]); m(SPH, toon(0x1a1a1a), [4.95, 4.22, 0.36], [0.08, 0.08, 0.04]); m(SPH, toon(0x1a1a1a), [4.95, 4.22, -0.36], [0.08, 0.08, 0.04]);
        for (const s of [-1, 1]) m(SPH, pink, [0.2, 0.75, s * 1.7], [2.8, 0.38, 0.3], [s * 0.2, 0, 0.1]);
        m(CONE, wht, [-4.9, 1.5, 0], [0.7, 1.8, 0.6], [0, 0, 1.0]);
        for (const sx of [-1.4, 1.4]) for (const sz of [-0.9, 0.9]) m(CYL8, toon(0xe8b84a), [sx, 2.2, sz], [0.07, 2.4, 0.07]);
        m(BOX, red, [0, 3.45, 0], [3.4, 0.2, 2.2]); m(CONE, toon(0xe8b84a), [0, 4.2, 0], [1.6, 1.4, 1.2], [0, Math.PI / 4, 0]); m(SPH, toon(0xe8b84a), [0, 5.0, 0], [0.18, 0.25, 0.18]);
        for (let k = 0; k < 14; k++) { const t = k / 13; m(SPH, marigold[k % 3], [-1.4 + 2.8 * t, 3.25 - Math.sin(Math.PI * t) * 0.35, 1.0], [0.08, 0.08, 0.08]); m(SPH, marigold[(k + 1) % 3], [-1.4 + 2.8 * t, 3.25 - Math.sin(Math.PI * t) * 0.35, -1.0], [0.08, 0.08, 0.08]); }
        P.position.set(X, WATER_Y + 0.2, BOAT_Z); R.add(P); }
    }
    for (const B of sets) { const g = new THREE.Group(); B.build(g); g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } }); R.add(g); }
    this.diyas = new Flames(R, diyas, 0.3);
    this.strings = new Flames(R, strings, 0.2);
    this.reflect = new Flames(R, refl, 0.5); this.reflect.pts.renderOrder = 2;
    // hero diya flame (a big sprite)
    this.heroFlame = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(64, 128, (g) => { const gr = g.createRadialGradient(32, 84, 2, 32, 76, 46); gr.addColorStop(0, "rgba(255,250,200,1)"); gr.addColorStop(0.25, "rgba(255,190,40,1)"); gr.addColorStop(0.6, "rgba(255,100,10,0.85)"); gr.addColorStop(1, "rgba(220,50,0,0)"); g.fillStyle = gr; g.beginPath(); g.moveTo(32, 4); g.quadraticCurveTo(62, 70, 32, 124); g.quadraticCurveTo(2, 70, 32, 4); g.fill(); }), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    this.heroFlame.layers.set(NOINK); this.heroFlame.position.set(DIYA[0] + 0.56, 0.5, DIYA[2]); this.heroFlame.scale.set(0.24, 0.46, 1); R.add(this.heroFlame);
    // fireworks: one points cloud, positions updated per frame
    this.fwPos = new Float32Array(FW_N * FW_MAX * 3); this.fwCol = new Float32Array(FW_N * FW_MAX * 3);
    const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.BufferAttribute(this.fwPos, 3)); fg.setAttribute("color", new THREE.BufferAttribute(this.fwCol, 3));
    this.fwMat = new THREE.PointsMaterial({ size: 2.0, map: dotTex(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
    this.fw = new THREE.Points(fg, this.fwMat); this.fw.frustumCulled = false; this.fw.layers.set(NOINK); R.add(this.fw);
    for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xffa850, 0, 10, 1.6); R.add(l); this.warm.push(l); }
    this.moon.castShadow = true; this.moon.shadow.mapSize.set(2048, 2048); this.moon.shadow.bias = -0.0006; this.moon.shadow.normalBias = 0.03;
    R.add(this.hemi, this.moon, this.moon.target);
  }

  /** boatX: the swan boat's x; bursts: fireworks */
  set(o: { light: LightName; t: number; px: number; cam: V3; look: V3; warm?: V3[]; shadowR?: number; boatX?: number; bursts?: Burst[] }) {
    const L = o.light;
    this.sky.position.set(...o.cam);
    this.skyMat.map = this.skies[L]; this.skyMat.needsUpdate = true;
    const P = {
      home: { hs: 0x9a80e0, hg: 0x4a2a5a, hi: 1.25, sc: 0xb8b0ff, si: 0.9, sd: [-0.4, 0.8, 0.5], fog: 0x4a2a7a, fn: 30, ff: 160 },
      ayodhya: { hs: 0xb090e8, hg: 0x4a2a5a, hi: 1.3, sc: 0xc0b0ff, si: 1.0, sd: [-0.5, 0.7, 0.6], fog: 0x7a4a9a, fn: 50, ff: 260 },
      close: { hs: 0xa088e8, hg: 0x5a3a5a, hi: 1.35, sc: 0xc8b8ff, si: 0.9, sd: [-0.4, 0.8, 0.5], fog: 0x4a2a7a, fn: 30, ff: 160 },
    }[L];
    this.hemi.color.set(P.hs); this.hemi.groundColor.set(P.hg); this.hemi.intensity = P.hi;
    this.moon.color.set(P.sc); this.moon.intensity = P.si;
    const sd = new THREE.Vector3(...(P.sd as V3)).normalize(), r = o.shadowR ?? 20;
    this.moon.target.position.set(...o.look); this.moon.position.copy(this.moon.target.position).addScaledVector(sd, 120); this.moon.target.updateMatrixWorld();
    const sc = this.moon.shadow.camera; sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 20; sc.far = 260; sc.updateProjectionMatrix();
    this.fog.color.set(P.fog); this.fog.near = P.fn; this.fog.far = P.ff;
    for (const f of [this.diyas, this.strings, this.reflect]) { f.mat.uniforms.uTime.value = o.t; f.mat.uniforms.uPx.value = o.px; f.mat.uniforms.uLit.value = 2; }
    this.strings.mat.uniforms.uTime.value = o.t * 0.3;
    const fl = 0.92 + 0.08 * Math.sin(o.t * 11) * Math.sin(o.t * 7.3);
    this.heroFlame.scale.set(0.24 * fl, 0.46 * (0.95 + 0.07 * Math.sin(o.t * 9)), 1);
    this.doorLight.intensity = L === "ayodhya" ? 0 : 9 * fl;
    this.warm.forEach((l, i) => { const w = o.warm?.[i]; l.intensity = w ? 6 * fl : 0; if (w) l.position.set(...w); });
    this.boat.position.x = o.boatX ?? AX; this.boat.position.y = WATER_Y + 0.2 + 0.06 * Math.sin(o.t * 1.6); this.boat.rotation.z = 0.015 * Math.sin(o.t * 1.3);
    // fireworks: each burst expands, falls and fades over 2.2 s
    const HUES: V3[] = [[1, 0.8, 0.3], [1, 0.35, 0.6], [0.4, 0.9, 1], [0.6, 1, 0.4], [1, 0.5, 0.2]];
    let n = 0;
    for (const [x, y, z, t0, hue] of o.bursts ?? []) { const age = o.t - t0; if (age < 0 || age > 2.2 || n >= FW_MAX) continue;
      const e = 1 - Math.exp(-age * 3), fade = Math.max(0, 1 - age / 2.2), c = HUES[hue % 5];
      for (let k = 0; k < FW_N; k++) { const a = rnd(k * 3 + hue) * Math.PI * 2, b = Math.acos(2 * rnd(k * 3 + 1 + hue) - 1), sp = 7 + rnd(k + 7) * 2; const i = (n * FW_N + k) * 3;
        this.fwPos[i] = x + Math.sin(b) * Math.cos(a) * sp * e; this.fwPos[i + 1] = y + Math.cos(b) * sp * e - 1.6 * age * age; this.fwPos[i + 2] = z + Math.sin(b) * Math.sin(a) * sp * e;
        const tw = fade * (0.7 + 0.3 * Math.sin(o.t * 30 + k)); this.fwCol[i] = c[0] * tw; this.fwCol[i + 1] = c[1] * tw; this.fwCol[i + 2] = c[2] * tw; }
      n++; }
    for (let i = n * FW_N * 3; i < this.fwPos.length; i++) { this.fwPos[i] = 0; this.fwCol[i] = 0; }
    (this.fw.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true; (this.fw.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }
}
