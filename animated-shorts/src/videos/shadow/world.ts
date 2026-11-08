// "The Man Who Sold His Shadow": a night-noir world.
//   STREET (origin): a foggy city street along z (road x -5..5, sidewalks to +-9), brick + stone buildings with
//     fire escapes and water towers, lamps with pools of light, steam from manholes; the empty lot on the east side
//     (x 9..30, z -46..-28) holds the MACHINE at MACH.
//   MANSION (x 600): white mansion with portico, fountain, lawns, cypresses, sports cars; police cars at night.
//   BEDROOM (x 1000), OFFICE (x 1500): interiors. TOWER (x 2500) + PYRAMIDS (x 3500): the travel montage.
import * as THREE from "three";
import { NOINK } from "../bridge/ink";
import { Flames } from "../diwali/world";
import { Batch, V3, rnd, toon, canvasTex, ramp, BOX, CYL, CONE, ICO, SPH, CYL8, DOME, PRISM, MANS, HALF, facadeBox } from "../eiffel/lib";
import { buildTower } from "../eiffel/tower";
import { car } from "../eiffel/vehicles";

export type LightName = "night" | "day" | "desert" | "bedroom" | "office" | "dark";
export const MACH: V3 = [17, 0, -37];
export const MX = 600, BX = 1000, OX = 1500, TWX = 2500, PYX = 3500;
type Pt = { p: V3; order: number; tint?: V3 };
const CONE4 = new THREE.ConeGeometry(0.7071, 1, 4);

// ---------------- textures ----------------
const brickFacade = (base: string, n: number, lit: number, seed: number) => {
  const H = 64 * n + 80;
  const tx = canvasTex(64, H, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 64, H);
    g.strokeStyle = "rgba(40,20,15,0.35)"; g.lineWidth = 1;
    for (let y = 0; y < H; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); for (let x = (y / 6) % 2 ? 0 : 6; x < 64; x += 12) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 6); g.stroke(); } }
    for (let j = 0; j < n; j++) {
      const y0 = j * 64, on = rnd(seed + j * 3) < lit;
      g.fillStyle = "#d9cdb6"; g.fillRect(14, y0 + 10, 36, 4); g.fillRect(14, y0 + 54, 36, 4);
      g.fillStyle = on ? "#ffcf7a" : "#1c2230"; g.fillRect(18, y0 + 14, 28, 40);
      if (on) { g.fillStyle = "rgba(120,60,20,0.5)"; g.fillRect(18, y0 + 14, 10, 40); }
      g.fillStyle = "#3a2a22"; g.fillRect(31, y0 + 14, 2, 40); g.fillRect(18, y0 + 32, 28, 2);
    }
    const y = n * 64; g.fillStyle = "#2a2a30"; g.fillRect(0, y, 64, 80);
    g.fillStyle = rnd(seed + 99) < 0.3 ? "#ffd98a" : "#5a5e66"; g.fillRect(6, y + 16, 52, 58);
    g.fillStyle = "rgba(0,0,0,0.35)"; for (let k = y + 18; k < y + 74; k += 5) g.fillRect(6, k, 52, 1.5);
    g.fillStyle = "#1a1a1e"; g.fillRect(0, y, 64, 10);
  });
  tx.wrapS = THREE.RepeatWrapping; return tx;
};
const pool = () => canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 2, 64, 64, 64); gr.addColorStop(0, "rgba(255,210,140,0.9)"); gr.addColorStop(0.5, "rgba(255,190,110,0.35)"); gr.addColorStop(1, "rgba(255,180,100,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
const asphalt = () => canvasTex(256, 256, (g) => {
  g.fillStyle = "#3a3c44"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${rnd(i) < 0.5 ? "0,0,0" : "160,170,190"},${0.08 + rnd(i + 1) * 0.1})`; g.fillRect(rnd(i + 2) * 256, rnd(i + 3) * 256, 2, 2); }
  g.fillStyle = "rgba(120,140,170,0.18)"; for (let i = 0; i < 12; i++) { g.beginPath(); g.ellipse(rnd(i + 50) * 256, rnd(i + 51) * 256, 20 + rnd(i) * 30, 6 + rnd(i + 3) * 8, 0, 0, Math.PI * 2); g.fill(); }
}, [3, 60]);
const paveTex = () => canvasTex(128, 128, (g) => { g.fillStyle = "#6a6a70"; g.fillRect(0, 0, 128, 128); g.strokeStyle = "#4a4a52"; g.lineWidth = 3; for (let k = 0; k <= 128; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 128); g.moveTo(0, k); g.lineTo(128, k); g.stroke(); } }, [2, 60]);
const signTex = (text: string, bg: string, fg: string, w = 256, h = 64) => canvasTex(w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = fg; g.font = `bold ${Math.round(h * 0.55)}px Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, h / 2 + 2); });
const posterTex = (k: number) => canvasTex(96, 128, (g) => { g.fillStyle = ["#d9c9a0", "#c9d9e0", "#e0c0c0"][k % 3]; g.fillRect(0, 0, 96, 128); g.fillStyle = "#1a1418"; g.fillRect(10, 10, 76, 18); g.fillStyle = ["#a8202a", "#2a4a8a", "#2a6a3a"][k % 3]; g.beginPath(); g.arc(48, 70, 24, 0, Math.PI * 2); g.fill(); g.fillStyle = "#1a1418"; for (let i = 0; i < 3; i++) g.fillRect(14, 102 + i * 7, 68 - i * 14, 3); });
const mansionTex = () => canvasTex(64, 192, (g) => {
  g.fillStyle = "#f1ece0"; g.fillRect(0, 0, 64, 192);
  for (let j = 0; j < 2; j++) { const y0 = 12 + j * 90; g.fillStyle = "#f8f5ee"; g.fillRect(12, y0 - 4, 40, 74); g.fillStyle = "#3a4a5e"; g.fillRect(16, y0, 32, 66); g.fillStyle = "#f8f5ee"; g.fillRect(31, y0, 2, 66); g.fillRect(16, y0 + 22, 32, 2); g.fillRect(16, y0 + 44, 32, 2); g.fillStyle = "#2f4a3a"; g.fillRect(6, y0, 6, 66); g.fillRect(52, y0, 6, 66); }
  g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(0, 92, 64, 3);
});
const mansionLit = () => canvasTex(64, 192, (g) => {
  g.fillStyle = "#8a8aa0"; g.fillRect(0, 0, 64, 192);
  for (let j = 0; j < 2; j++) { const y0 = 12 + j * 90; g.fillStyle = "#b0b0c0"; g.fillRect(12, y0 - 4, 40, 74); g.fillStyle = j === 1 ? "#ffcf7a" : "#1c2230"; g.fillRect(16, y0, 32, 66); g.fillStyle = "#6a6a80"; g.fillRect(31, y0, 2, 66); g.fillRect(16, y0 + 22, 32, 2); g.fillRect(16, y0 + 44, 32, 2); g.fillStyle = "#2a3040"; g.fillRect(6, y0, 6, 66); g.fillRect(52, y0, 6, 66); }
});
const lawnTex = (rep: number) => canvasTex(128, 128, (g) => { g.fillStyle = "#5f9a3e"; g.fillRect(0, 0, 128, 128); for (let x = 0; x < 128; x += 32) { g.fillStyle = "rgba(255,255,255,0.07)"; g.fillRect(x, 0, 16, 128); } }, [rep, rep]);
const sandTex = () => canvasTex(128, 128, (g) => { g.fillStyle = "#e3c27e"; g.fillRect(0, 0, 128, 128); g.strokeStyle = "rgba(170,120,60,0.35)"; g.lineWidth = 2; for (let y = 6; y < 128; y += 12) { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 128; x += 16) g.quadraticCurveTo(x + 8, y - 4, x + 16, y); g.stroke(); } }, [120, 120]);
const woodPanel = (rx: number) => canvasTex(128, 256, (g) => { g.fillStyle = "#4a2c1a"; g.fillRect(0, 0, 128, 256); g.strokeStyle = "#2a180c"; g.lineWidth = 5; g.strokeRect(12, 20, 104, 120); g.strokeRect(12, 160, 104, 80); g.fillStyle = "rgba(255,200,140,0.08)"; for (let x = 0; x < 128; x += 9) g.fillRect(x, 0, 3, 256); }, [rx, 1]);
const wallpaper = (rx: number) => canvasTex(64, 64, (g) => { g.fillStyle = "#2a3a5a"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#3a4a6a"; for (const [x, y] of [[16, 16], [48, 48]]) { g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x + 7, y); g.lineTo(x, y + 10); g.lineTo(x - 7, y); g.closePath(); g.fill(); } }, [rx, 3]);
const parquet = (r: number) => canvasTex(128, 128, (g) => { for (let y = 0; y < 128; y += 16) for (let x = -64; x < 128; x += 64) { const o = (y / 16) % 2 ? 32 : 0; g.fillStyle = ["#6a4022", "#7a4a2a", "#5a3820"][Math.floor(rnd(x + y * 3 + 200) * 3)]; g.fillRect(x + o, y, 64, 16); g.strokeStyle = "#3a2010"; g.lineWidth = 1.5; g.strokeRect(x + o + 0.5, y + 0.5, 63, 15); } }, [r, r]);
const rugTex = () => canvasTex(256, 160, (g) => { g.fillStyle = "#6a1a22"; g.fillRect(0, 0, 256, 160); g.strokeStyle = "#d9a040"; g.lineWidth = 8; g.strokeRect(10, 10, 236, 140); g.lineWidth = 3; g.strokeRect(26, 26, 204, 108); g.fillStyle = "#d9a040"; g.beginPath(); g.ellipse(128, 80, 44, 28, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = "#6a1a22"; g.beginPath(); g.ellipse(128, 80, 26, 15, 0, 0, Math.PI * 2); g.fill(); });
export const nightView = () => canvasTex(256, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#22305e"); gr.addColorStop(0.6, "#5a6ea8"); gr.addColorStop(1, "#8a9ac8"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const mg = g.createRadialGradient(190, 60, 10, 190, 60, 120); mg.addColorStop(0, "rgba(230,236,255,0.7)"); mg.addColorStop(1, "rgba(230,236,255,0)"); g.fillStyle = mg; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,250,230,0.8)"; g.fillRect(rnd(i + 7) * 256, rnd(i + 8) * 110, 2, 2); }
  g.fillStyle = "#f4f6ff"; g.beginPath(); g.arc(190, 60, 22, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#1a2038"; for (const k of [0, 1, 6]) { const x = k * 42 - 10, h = 110 + rnd(k + 60) * 40; g.beginPath(); g.moveTo(x, 256); g.lineTo(x + 18, 256 - h); g.lineTo(x + 36, 256); g.fill(); g.beginPath(); g.arc(x + 18, 256 - h + 20, 24, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#2a3050"; g.fillRect(0, 236, 256, 20);
});
const cityMorning = () => canvasTex(256, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#7a8aa0"); gr.addColorStop(1, "#c9c4bc"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 9; k++) { const x = k * 30 - 6, w = 24 + rnd(k) * 14, h = 80 + rnd(k + 9) * 140; g.fillStyle = ["#5a6070", "#6a7080", "#4a5060"][k % 3]; g.fillRect(x, 256 - h, w, h); g.fillStyle = "rgba(255,230,180,0.6)"; for (let r = 0; r < h / 14; r++) for (let c = 0; c < 3; c++) if (rnd(k * 31 + r * 7 + c) < 0.3) g.fillRect(x + 4 + c * (w / 3), 256 - h + 6 + r * 14, 4, 6); }
  g.strokeStyle = "rgba(200,210,230,0.35)"; g.lineWidth = 1; for (let i = 0; i < 70; i++) { const x = rnd(i + 300) * 256, y = rnd(i + 301) * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + 14); g.stroke(); }
});
export const machineShot = () => canvasTex(256, 192, (g) => { g.fillStyle = "#0e1a1c"; g.fillRect(0, 0, 256, 192); });
const skyTex = (top: string, mid: string, hor: string, stars = 0) => canvasTex(16, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(0.42, mid); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor);
  g.fillStyle = gr; g.fillRect(0, 0, 16, 512);
  for (let i = 0; i < stars; i++) { g.fillStyle = `rgba(255,250,230,${0.3 + rnd(i) * 0.6})`; g.fillRect(rnd(i + 5) * 16, rnd(i + 9) * 210, 1, 1); }
});

export class World {
  root = new THREE.Group();
  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  sun = new THREE.DirectionalLight(0xffffff, 2);
  sky: THREE.Mesh; skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false });
  skies: Record<LightName, THREE.Texture>;
  fog = new THREE.Fog(0x000000, 20, 200);
  lamps: Flames; spark: Flames; police: Flames; roomLights: Flames; machineGlow: Flames;
  pt: THREE.PointLight[] = [];
  puffs: THREE.Mesh[] = [];
  pools: THREE.MeshBasicMaterial; booth: THREE.MeshBasicMaterial;
  mansionMat: THREE.MeshToonMaterial; mDay: THREE.Texture; mNight: THREE.Texture;
  policeCars = new THREE.Group(); lid = new THREE.Group(); screen: THREE.MeshBasicMaterial;
  clouds: THREE.Mesh[] = []; cloudMat: THREE.MeshBasicMaterial;

  constructor() {
    const R = this.root, B = new Batch();
    this.skies = {
      night: skyTex("#03050f", "#0e1530", "#1c2644", 60), day: skyTex("#3e7fd2", "#8fb6e6", "#dfe8ee"), desert: skyTex("#3a7ad8", "#9ac0e8", "#f2e2c0"),
      bedroom: skyTex("#03050f", "#0e1530", "#1c2644", 60), office: skyTex("#5a6a80", "#9aa4b4", "#c9c4bc"), dark: skyTex("#000000", "#020308", "#04060c"),
    };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 24, 16), this.skyMat); this.sky.layers.set(NOINK); R.add(this.sky);
    const lamps: Pt[] = [], room: Pt[] = [], sparks: Pt[] = [], glow: Pt[] = [];
    const plane = (w: number, d: number, m: THREE.Material, p: V3) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); q.rotation.x = -Math.PI / 2; q.position.set(...p); R.add(q); return q; };
    const iron = toon(0x2a2c32), black = toon(0x16161a), steel = toon(0x7a8088), copper = toon(0xc0703a), brass = toon(0xc9a040), wood = toon(0x6a4022), woodD = toon(0x3a2010);
    const leaf = [toon(0x2f5a2a), toon(0x3f6a34), toon(0x24502a)];

    // ================= STREET =================
    plane(18, 240, toon(0xffffff, asphalt()), [0, 0.01, -30]);
    for (const s of [-1, 1]) { const sw = plane(4, 240, toon(0xffffff, paveTex()), [s * 7, 0.16, -30]); void sw; B.add(BOX, toon(0x5a5a60), [s * 7, 0.08, -30], [0, 0, 0], [4, 0.16, 240]); B.add(BOX, toon(0x8a8a90), [s * 5.05, 0.1, -30], [0, 0, 0], [0.2, 0.2, 240]); }
    plane(400, 400, toon(0x2a2a30), [0, 0, -30]).position.y = -0.02;
    for (let z = 85; z > -150; z -= 9) B.add(BOX, toon(0xd9d0a0), [0, 0.02, z], [0, 0, 0], [0.18, 0.01, 4]);
    const bricks = ["#7a3a2a", "#6a3428", "#8a4a32", "#5a4a42", "#7a6a5a"];
    let bi = 0;
    const building = (side: number, z0: number, w: number) => {
      const i = bi++, n = 3 + Math.floor(rnd(i + 3) * 3), H = n * 3.5 + 4.4, d = 14, x = side * (9 + d / 2);
      B.add(facadeBox(d, H, w, 3.5), toon(0xffffff, brickFacade(bricks[i % 5], n, 0.28, i * 17)), [x, H / 2, z0 - w / 2]);
      B.add(BOX, toon(0x9a8a7a), [x, H + 0.3, z0 - w / 2], [0, 0, 0], [d + 0.5, 0.6, w + 0.2]);
      B.add(BOX, toon(0x1a1a1e), [side * 9.3, 4.6, z0 - w / 2], [0, 0, 0], [0.6, 0.3, w - 0.4]);
      if (rnd(i + 7) < 0.6) { // fire escape: landings, rails, ladders
        const za = z0 - w * 0.3;
        for (let k = 1; k < n; k++) { const y = 4.4 + k * 3.5 - 0.4; B.add(BOX, iron, [side * 8.3, y, za], [0, 0, 0], [1.4, 0.1, 4]); B.add(BOX, iron, [side * 7.65, y + 0.9, za], [0, 0, 0], [0.06, 0.06, 4]);
          for (let q = -2; q <= 2; q++) B.add(BOX, iron, [side * 7.65, y + 0.45, za + q], [0, 0, 0], [0.04, 0.9, 0.04]);
          B.beam(iron, [side * 8.0, y, za - 1.6], [side * 8.0, y + 3.5, za + 1.6], 0.08); }
      }
      if (rnd(i + 8) < 0.5) { const wx = x + side * (rnd(i) - 0.5) * 6, wz = z0 - w / 2; B.add(CYL, wood, [wx, H + 3.4, wz], [0, 0, 0], [1.4, 2.6, 1.4]); B.add(CONE, wood, [wx, H + 5.2, wz], [0, 0, 0], [1.5, 1.0, 1.5]); for (const [a, b2] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.add(BOX, iron, [wx + a, H + 1.1, wz + b2], [0, 0, 0], [0.12, 2.2, 0.12]); }
      if (rnd(i + 9) < 0.45) { const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.2), new THREE.MeshBasicMaterial({ map: signTex(["HOTEL", "PAWN", "DINER", "BAR", "LOANS"][i % 5], "#1a1418", ["#ff4a6a", "#4ad8ff", "#ffd04a"][i % 3], 64, 224), toneMapped: false })); sg.position.set(side * 8.4, 7.5, z0 - 1.2); sg.rotation.set(0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0); sg.rotation.z = Math.PI / 2 * 0; R.add(sg); B.add(BOX, iron, [side * 8.85, 7.5, z0 - 1.2], [0, 0, 0], [0.9, 0.1, 0.1]); }
      if (rnd(i + 11) < 0.7) { const pp = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), toon(0xffffff, posterTex(i))); pp.position.set(side * 8.97, 1.6, z0 - w * 0.65); pp.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; R.add(pp); }
    };
    for (const s of [-1, 1]) for (let z = 90; z > -160;) { const w = 10 + Math.floor(rnd(z * 3 + s) * 3) * 3; if (s > 0 && z - w < -27 && z > -47) { z = -47; continue; } building(s, z, w); z -= w; }
    // the empty lot: gravel, back walls, fence, rubble, the machine
    plane(22, 20, toon(0x7a766c), [20, 0.03, -37]);
    B.add(BOX, toon(0x5a3428), [31, 7, -37], [0, 0, 0], [1, 14, 20]); B.add(BOX, toon(0x6a3a2a), [20, 8, -47.5], [0, 0, 0], [22, 16, 1]); B.add(BOX, toon(0x6a3a2a), [20, 9, -26.5], [0, 0, 0], [22, 18, 1]);
    for (let z = -46.5; z < -27; z += 1.0) if (Math.abs(z + 37) > 2.5) { B.add(CYL8, steel, [9.2, 1.1, z], [0, 0, 0], [0.04, 2.2, 0.04]); }
    const fence = new THREE.Mesh(new THREE.PlaneGeometry(19, 2.2), new THREE.MeshBasicMaterial({ map: canvasTex(64, 64, (g) => { g.strokeStyle = "rgba(160,170,180,0.8)"; g.lineWidth = 2; for (let k = -64; k < 128; k += 10) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 64, 64); g.moveTo(k + 64, 0); g.lineTo(k, 64); g.stroke(); } }, [12, 2]), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    fence.position.set(9.2, 1.1, -37); fence.rotation.y = Math.PI / 2; R.add(fence);
    for (let k = 0; k < 14; k++) B.add(ICO, toon(0x5a5048), [12 + rnd(k) * 16, 0.2, -45 + rnd(k + 3) * 16], [rnd(k), rnd(k + 1), 0], [0.4 + rnd(k + 2) * 0.6, 0.3, 0.5]);
    for (const [x, z] of [[27, -44], [28, -42.6]]) { B.add(CYL, toon(0x3a4a3a), [x, 0.6, z], [0, 0, 0], [0.45, 1.2, 0.45]); }
    // ---- the machine ----
    const [MXx, , MZ] = MACH;
    B.add(CYL, toon(0x3a3e46), [MXx, 0.25, MZ], [0, 0, 0], [2.4, 0.5, 2.4]); B.add(CYL, steel, [MXx, 0.55, MZ], [0, 0, 0], [1.6, 0.1, 1.6]);
    for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8; B.add(SPH, brass, [MXx + Math.cos(a) * 2.3, 0.5, MZ + Math.sin(a) * 2.3], [0, 0, 0], [0.08, 0.08, 0.08]); }
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; B.add(CYL8, copper, [MXx + Math.cos(a) * 1.45, 2.0, MZ + Math.sin(a) * 1.45], [0, 0, 0], [0.12, 3.0, 0.12]); }
    for (const y of [0.9, 2.0, 3.2]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.09, 6, 30), copper); ring.rotation.x = Math.PI / 2; ring.position.set(MXx, y, MZ); R.add(ring); }
    this.booth = new THREE.MeshBasicMaterial({ color: 0x7affff, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 2.7, 24, 1, true), this.booth); glass.position.set(MXx, 1.95, MZ); glass.layers.set(NOINK); R.add(glass);
    B.add(CYL, toon(0x3a3e46), [MXx, 3.55, MZ], [0, 0, 0], [1.7, 0.5, 1.7]); B.add(DOME, copper, [MXx, 3.8, MZ], [0, 0, 0], [1.2, 0.9, 1.2]);
    B.add(CYL8, steel, [MXx, 5.0, MZ], [0, 0, 0], [0.06, 1.8, 0.06]); B.add(SPH, steel, [MXx, 5.95, MZ], [0, 0, 0], [0.22, 0.22, 0.22]);
    sparks.push({ p: [MXx, 5.95, MZ], order: 0, tint: [0.5, 0.9, 1] });
    for (const s of [-1, 1]) { // tesla coils
      const cx = MXx + s * 3.4;
      B.add(BOX, toon(0x3a3e46), [cx, 0.4, MZ], [0, 0, 0], [1.0, 0.8, 1.0]); B.add(CYL, copper, [cx, 2.0, MZ], [0, 0, 0], [0.35, 2.4, 0.35]);
      for (let k = 0; k < 8; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 5, 16), copper); r.rotation.x = Math.PI / 2; r.position.set(cx, 1.0 + k * 0.28, MZ); R.add(r); }
      const top = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.22, 8, 20), steel); top.rotation.x = Math.PI / 2; top.position.set(cx, 3.4, MZ); R.add(top);
      sparks.push({ p: [cx, 3.6, MZ], order: 0, tint: [0.6, 0.85, 1] }, { p: [cx + s * 0.4, 3.3, MZ + 0.3], order: 0, tint: [0.6, 0.85, 1] });
      B.beam(black, [cx, 0.1, MZ + 0.5], [MXx + s * 1.6, 0.1, MZ + 0.8], 0.1);
    }
    B.add(BOX, toon(0x4a4e56), [MXx - 0.6, 0.8, MZ + 3.4], [0, 0, 0], [1.6, 1.6, 0.7]); B.add(BOX, toon(0x2a2e36), [MXx - 0.6, 1.55, MZ + 3.6], [-0.5, 0, 0], [1.6, 0.1, 0.6]);
    for (let k = 0; k < 3; k++) { B.add(CYL8, toon(0xf1ead6), [MXx - 1.1 + k * 0.5, 1.15, MZ + 3.76], [Math.PI / 2, 0, 0], [0.16, 0.04, 0.16]); B.add(BOX, black, [MXx - 1.1 + k * 0.5, 1.18, MZ + 3.79], [0, 0, 0.6 * k - 0.4], [0.02, 0.12, 0.01]); }
    for (let k = 0; k < 5; k++) { B.add(SPH, [toon(0xff4a4a), toon(0x4aff8a), toon(0xffd04a)][k % 3], [MXx - 1.2 + k * 0.3, 0.6, MZ + 3.76], [0, 0, 0], [0.05, 0.05, 0.05]); }
    B.add(CYL8, steel, [MXx + 0.1, 1.9, MZ + 3.6], [-0.5, 0, 0], [0.04, 0.8, 0.04]); B.add(SPH, toon(0xc0202a), [MXx + 0.1, 2.25, MZ + 3.8], [0, 0, 0], [0.11, 0.11, 0.11]);
    for (let k = 0; k < 3; k++) B.beam(black, [MXx - 0.6 + (k - 1) * 0.4, 0.05, MZ + 3.1], [MXx + (k - 1) * 0.6, 0.05, MZ + 2.2], 0.08);
    for (let k = 0; k < 10; k++) glow.push({ p: [MXx + Math.cos(k) * 0.6, 0.8 + k * 0.25, MZ + Math.sin(k) * 0.6], order: 0, tint: [0.45, 1, 1] });
    // ---- lamps, pools, street props ----
    this.pools = new THREE.MeshBasicMaterial({ map: pool(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    for (let z = 76; z > -150; z -= 18) for (const s of [-1, 1]) {
      const x = s * 5.6, zz = z + (s > 0 ? 9 : 0);
      B.add(CYL8, iron, [x, 0.4, zz], [0, 0, 0], [0.22, 0.8, 0.22]); B.add(CYL8, iron, [x, 2.6, zz], [0, 0, 0], [0.08, 5.2, 0.08]); B.add(BOX, iron, [x - s * 0.5, 5.15, zz], [0, 0, 0], [1.1, 0.08, 0.08]);
      B.add(CONE, iron, [x - s * 1.0, 5.0, zz], [0, 0, 0], [0.4, 0.35, 0.4]); lamps.push({ p: [x - s * 1.0, 4.75, zz], order: 0, tint: [1, 0.8, 0.5] });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), this.pools); pl.rotation.x = -Math.PI / 2; pl.position.set(x - s * 1.0, 0.19, zz); pl.layers.set(NOINK); R.add(pl);
    }
    const can = (x: number, z: number) => { B.add(CYL, toon(0x5a6068), [x, 0.5, z], [0, 0, 0], [0.32, 1.0, 0.32]); B.add(CYL, toon(0x6a7078), [x, 1.03, z], [0, 0, 0], [0.36, 0.06, 0.36]); };
    for (const [x, z] of [[-8.3, 30], [8.3, 12], [-8.4, -20], [8.4, -50], [-8.3, -70], [8.2, 47]]) can(x, z);
    for (const [x, z] of [[-6.2, 18], [6.2, -14], [-6.2, -55]]) { B.add(CYL8, toon(0xa8202a), [x, 0.4, z], [0, 0, 0], [0.18, 0.8, 0.18]); B.add(DOME, toon(0xa8202a), [x, 0.8, z], [0, 0, 0], [0.18, 0.15, 0.18]); }
    B.add(BOX, toon(0xa8202a), [-7.8, 1.2, 4], [0, 0, 0], [1.0, 2.4, 1.0]); B.add(BOX, toon(0xffd98a), [-7.3, 1.4, 4], [0, 0, 0], [0.05, 1.2, 0.7]); lamps.push({ p: [-7.8, 2.2, 4], order: 0, tint: [1, 0.85, 0.6] });
    for (let k = 0; k < 5; k++) B.add(BOX, toon(0x7a5a32), [-8.2 + (k % 2) * 0.3, 0.35 + Math.floor(k / 2) * 0.6, -36 + k * 0.7], [0, rnd(k) * 0.4, 0], [0.7, 0.6, 0.6]);
    for (const [k, z] of [[0, 60], [1, 34], [2, 22], [3, -64], [4, -88], [5, -110]]) car(B, [k % 2 ? 3.6 : -3.6, 0, z], k % 2 ? Math.PI : 0, [0x1c1c22, 0x3a2a2a, 0x2a3a4a][k % 3]);
    // ================= MANSION (day/night) =================
    plane(260, 260, toon(0xffffff, lawnTex(40)), [MX, 0.02, -20]);
    this.mDay = mansionTex(); this.mNight = mansionLit(); for (const tx of [this.mDay, this.mNight]) tx.wrapS = THREE.RepeatWrapping;
    this.mansionMat = new THREE.MeshToonMaterial({ map: this.mDay, gradientMap: ramp });
    B.add(facadeBox(44, 12, 18, 4), this.mansionMat, [MX, 6, -50]); B.add(facadeBox(16, 9, 14, 4), this.mansionMat, [MX - 30, 4.5, -48]); B.add(facadeBox(16, 9, 14, 4), this.mansionMat, [MX + 30, 4.5, -48]);
    B.add(MANS, toon(0x3a4048), [MX, 14.5, -50], [0, 0, 0], [44, 5, 18]); B.add(MANS, toon(0x3a4048), [MX - 30, 10.8, -48], [0, 0, 0], [16, 3.6, 14]); B.add(MANS, toon(0x3a4048), [MX + 30, 10.8, -48], [0, 0, 0], [16, 3.6, 14]);
    for (const x of [-16, -6, 6, 16]) { B.add(BOX, toon(0xe8e2d4), [MX + x, 17.5, -50], [0, 0, 0], [1.4, 3, 1.4]); }
    for (let k = 0; k < 6; k++) B.add(CYL, toon(0xf8f5ee), [MX - 7.5 + k * 3, 5.5, -39.6], [0, 0, 0], [0.55, 11, 0.55]);
    B.add(BOX, toon(0xf8f5ee), [MX, 11.4, -39.6], [0, 0, 0], [18, 1.0, 2.4]); B.add(PRISM, toon(0xf8f5ee), [MX, 13.2, -39.8], [Math.PI / 2, 0, Math.PI / 2], [2.6, 3.0, 9.6]);
    B.add(BOX, toon(0x3a2418), [MX, 2.4, -40.9], [0, 0, 0], [3, 4.8, 0.2]); for (let k = 0; k < 4; k++) B.add(BOX, toon(0xe8e2d4), [MX, 0.15 + k * 0.3, -37.5 + k * 0.6], [0, 0, 0], [16 - k * 1.5, 0.3, 1.2]);
    plane(10, 60, toon(0xd9cdb6), [MX, 0.04, -8]); const dr = new THREE.Mesh(new THREE.RingGeometry(8, 14, 32), toon(0xd9cdb6)); dr.rotation.x = -Math.PI / 2; dr.position.set(MX, 0.05, -18); R.add(dr);
    B.add(CYL, toon(0xe8e2d4), [MX, 0.5, -18], [0, 0, 0], [6, 1, 6]); B.add(CYL, toon(0x5f9ac0), [MX, 1.02, -18], [0, 0, 0], [5.5, 0.05, 5.5]); B.add(CYL, toon(0xe8e2d4), [MX, 2.2, -18], [0, 0, 0], [0.6, 3, 0.6]); B.add(CYL, toon(0xe8e2d4), [MX, 3.8, -18], [0, 0, 0], [2.0, 0.3, 2.0]);
    for (let k = 0; k < 10; k++) B.add(SPH, toon(0xdff2ff), [MX, 4.1 + k * 0.25, -18], [0, 0, 0], [0.3 - k * 0.02, 0.2, 0.3 - k * 0.02]);
    for (let k = 0; k < 14; k++) { const x = MX + (k < 7 ? -1 : 1) * (8 + (k % 7) * 4.5); B.add(CONE, leaf[k % 3], [x, 4, -36 + (k % 2) * 0.6], [0, 0, 0], [1.1, 8, 1.1]); B.add(CYL8, toon(0x5a3a22), [x, 0.4, -36], [0, 0, 0], [0.2, 0.8, 0.2]); }
    for (let z = 26; z > -30; z -= 6) for (const s of [-1, 1]) B.add(BOX, leaf[1], [MX + s * 7, 0.6, z], [0, 0, 0], [1.2, 1.2, 4.6]);
    for (const s of [-1, 1]) { B.add(BOX, toon(0xe8e2d4), [MX + s * 6, 1.8, 30], [0, 0, 0], [1.2, 3.6, 1.2]); B.add(SPH, toon(0xe8e2d4), [MX + s * 6, 4.0, 30], [0, 0, 0], [0.6, 0.6, 0.6]); for (let k = 0; k < 6; k++) B.add(CYL8, black, [MX + s * (0.5 + k * 0.9), 1.4, 30], [0, 0, 0], [0.05, 2.8, 0.05]); lamps.push({ p: [MX + s * 6, 4.6, 30], order: 0 }); }
    for (let k = 0; k < 40; k++) { const a = rnd(k + 400) * Math.PI * 2, r = 60 + rnd(k + 401) * 60; B.add(CYL8, toon(0x5a3a22), [MX + Math.cos(a) * r, 1.6, -30 + Math.sin(a) * r], [0, 0, 0], [0.3, 3.2, 0.3]); B.add(ICO, leaf[k % 3], [MX + Math.cos(a) * r, 5, -30 + Math.sin(a) * r], [0, 0, 0], [3.4, 3.4, 3.4]); }
    const sports = (x: number, z: number, ry: number, col: number) => {
      const M = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
      const put = (geo: THREE.BufferGeometry, m: THREE.Material, p: V3, s: V3, r: V3 = [0, 0, 0]) => B.addM(geo, m, M.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s))));
      const body = toon(col);
      put(BOX, body, [0, 0.55, 0], [1.9, 0.5, 4.4]); put(BOX, body, [0, 0.72, 1.4], [1.85, 0.2, 1.5], [-0.12, 0, 0]);
      put(BOX, toon(0x1c2230), [0, 1.0, -0.4], [1.6, 0.42, 1.8], [0, 0, 0]); put(BOX, body, [0, 1.24, -0.5], [1.55, 0.06, 1.3]);
      for (const sx of [-1, 1]) for (const sz of [1.4, -1.4]) { put(CYL, toon(0x16161a), [sx * 0.9, 0.36, sz], [0.36, 0.26, 0.36], [0, 0, Math.PI / 2]); put(CYL8, toon(0xc9ccd2), [sx * 1.03, 0.36, sz], [0.2, 0.02, 0.2], [0, 0, Math.PI / 2]); }
      for (const sx of [-0.65, 0.65]) put(BOX, toon(0xfff2c0), [sx, 0.62, 2.21], [0.4, 0.12, 0.04]); for (const sx of [-0.65, 0.65]) put(BOX, toon(0xd02020), [sx, 0.66, -2.21], [0.4, 0.1, 0.04]);
    };
    sports(MX - 5, -26, 0.5, 0xd02028); sports(MX + 5, -26, -0.5, 0xf2c020); sports(MX + 11, -22, -0.9, 0x1c1c22);
    // police cars (night only)
    { const PB = new Batch();
      for (const [x, z, ry] of [[MX + 3, 8, -0.4], [MX - 4, 14, 0.5]] as const) {
        const M = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
        const put = (geo: THREE.BufferGeometry, m: THREE.Material, p: V3, s: V3, r: V3 = [0, 0, 0]) => PB.addM(geo, m, M.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s))));
        put(BOX, toon(0xf4f4f4), [0, 0.75, 0], [1.9, 0.7, 4.6]); put(BOX, toon(0x1a2a5a), [0, 0.75, 0], [1.92, 0.25, 2.2]); put(BOX, toon(0x1c2230), [0, 1.35, -0.3], [1.7, 0.55, 2.2]); put(BOX, toon(0xf4f4f4), [0, 1.65, -0.3], [1.72, 0.08, 2.2]);
        put(BOX, toon(0xd02020), [-0.35, 1.8, -0.3], [0.6, 0.18, 0.3]); put(BOX, toon(0x2050ff), [0.35, 1.8, -0.3], [0.6, 0.18, 0.3]);
        for (const sx of [-1, 1]) for (const sz of [1.5, -1.5]) put(CYL, toon(0x16161a), [sx * 0.92, 0.38, sz], [0.38, 0.26, 0.38], [0, 0, Math.PI / 2]);
      }
      PB.build(this.policeCars); R.add(this.policeCars); }
    this.police = new Flames(this.policeCars, [{ p: [MX + 3 - 0.33, 1.95, 8 - 0.1], order: 0, tint: [1, 0.15, 0.15] }, { p: [MX + 3 + 0.33, 1.95, 8 + 0.1], order: 0, tint: [0.2, 0.4, 1] }, { p: [MX - 4 - 0.3, 1.95, 14 + 0.2], order: 0, tint: [1, 0.15, 0.15] }, { p: [MX - 4 + 0.3, 1.95, 14 - 0.2], order: 0, tint: [0.2, 0.4, 1] }], 2.2);
    // ================= BEDROOM =================
    const roomBox = (cx: number, w: number, d: number, h: number, wallM: THREE.Material, floorM: THREE.Material) => {
      plane(w, d, floorM, [cx, 0.01, 0]);
      B.add(BOX, wallM, [cx, h / 2, -d / 2 - 0.15], [0, 0, 0], [w, h, 0.3]); B.add(BOX, wallM, [cx, h / 2, d / 2 + 0.15], [0, 0, 0], [w, h, 0.3]);
      B.add(BOX, wallM, [cx - w / 2 - 0.15, h / 2, 0], [0, Math.PI / 2, 0], [d, h, 0.3]); B.add(BOX, wallM, [cx + w / 2 + 0.15, h / 2, 0], [0, Math.PI / 2, 0], [d, h, 0.3]);
      B.add(BOX, toon(0x2a2a34), [cx, h + 0.15, 0], [0, 0, 0], [w + 0.6, 0.3, d + 0.6]);
      B.add(BOX, toon(0xe8e2d4), [cx, h - 0.12, -d / 2 + 0.08], [0, 0, 0], [w, 0.24, 0.16]); B.add(BOX, woodD, [cx, 0.1, -d / 2 + 0.04], [0, 0, 0], [w, 0.2, 0.08]);
    };
    const window = (x: number, y: number, zw: number, w: number, h: number, tex: THREE.Texture, drape: THREE.Material) => {
      const v = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); v.position.set(x, y, zw + 0.02); R.add(v);
      B.add(BOX, toon(0xe8e2d4), [x, y, zw + 0.08], [0, 0, 0], [0.1, h, 0.08]); B.add(BOX, toon(0xe8e2d4), [x, y + h * 0.15, zw + 0.08], [0, 0, 0], [w, 0.08, 0.08]);
      for (const s of [-1, 1]) B.add(BOX, toon(0xe8e2d4), [x + s * w / 2, y, zw + 0.1], [0, 0, 0], [0.16, h + 0.2, 0.18]);
      B.add(BOX, toon(0xe8e2d4), [x, y - h / 2 - 0.06, zw + 0.18], [0, 0, 0], [w + 0.4, 0.12, 0.4]); B.add(BOX, toon(0xe8e2d4), [x, y + h / 2 + 0.1, zw + 0.1], [0, 0, 0], [w + 0.4, 0.2, 0.2]);
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) B.add(CYL8, drape, [x + s * (w / 2 + 0.25 + k * 0.17), y + 0.2, zw + 0.3], [0, 0, 0], [0.14, h + 0.8, 0.14]);
      B.add(BOX, drape, [x, y + h / 2 + 0.45, zw + 0.3], [0, 0, 0], [w + 1.5, 0.5, 0.2]);
    };
    { const X = BX;
      roomBox(X, 12, 10, 4, toon(0xffffff, wallpaper(8)), toon(0xffffff, parquet(5)));
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.4), toon(0xffffff, rugTex())); rug.rotation.x = -Math.PI / 2; rug.position.set(X, 0.02, -1); R.add(rug);
      window(X, 2.0, -5, 2.6, 2.6, nightView(), toon(0x5a1a2a));
      // bed (headboard at z = +4.8, foot toward the window)
      B.add(BOX, woodD, [X, 0.3, 2.6], [0, 0, 0], [2.6, 0.6, 4.4]); B.add(BOX, toon(0xe8e2d4), [X, 0.7, 2.6], [0, 0, 0], [2.4, 0.25, 4.2]); B.add(BOX, toon(0x3a4a7a), [X, 0.86, 2.2], [0, 0, 0], [2.6, 0.12, 3.4]);
      for (const s of [-0.6, 0.6]) B.add(BOX, toon(0xf4f1ea), [X + s, 0.95, 4.3], [0, 0, 0], [1.0, 0.25, 0.6]);
      B.add(BOX, woodD, [X, 1.5, 4.85], [0, 0, 0], [2.8, 3.0, 0.2]); B.add(BOX, woodD, [X, 0.5, 0.35], [0, 0, 0], [2.8, 1.0, 0.15]);
      for (const s of [-1, 1]) { B.add(BOX, wood, [X + s * 1.9, 0.35, 4.4], [0, 0, 0], [0.7, 0.7, 0.6]); B.add(CYL8, brass, [X + s * 1.9, 0.95, 4.4], [0, 0, 0], [0.05, 0.5, 0.05]); B.add(CONE, toon(0xe8d4a0), [X + s * 1.9, 1.32, 4.4], [0, 0, 0], [0.3, 0.32, 0.3]); room.push({ p: [X + s * 1.9, 1.2, 4.4], order: 0, tint: [1, 0.8, 0.5] }); }
      B.add(BOX, wood, [X - 5.6, 1.3, 0], [0, 0, 0], [0.8, 2.6, 2.4]); B.add(BOX, brass, [X - 5.18, 1.3, 0], [0, 0, 0], [0.04, 0.3, 0.06]);
      B.add(BOX, wood, [X + 5.6, 0.5, -1.5], [0, 0, 0], [0.8, 1.0, 2.0]); B.add(BOX, toon(0x9ab0c8), [X + 5.9, 1.9, -1.5], [0, 0, 0], [0.05, 1.4, 1.2]);
      B.add(CYL8, brass, [X, 3.6, 0], [0, 0, 0], [0.03, 0.8, 0.03]); B.add(CYL, brass, [X, 3.2, 0], [0, 0, 0], [0.7, 0.06, 0.7]);
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), toon(0xffffff, posterTex(4))); pic.position.set(X + 3.2, 2.3, -4.98); R.add(pic);
      B.add(CYL, toon(0xb0674a), [X - 4.4, 0.35, -4.2], [0, 0, 0], [0.32, 0.7, 0.32]); for (let k = 0; k < 7; k++) { const a = k * 0.9; B.add(CONE, leaf[1], [X - 4.4 + Math.cos(a) * 0.35, 1.3, -4.2 + Math.sin(a) * 0.35], [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9], [0.15, 1.4, 0.05]); }
    }
    // ================= OFFICE =================
    { const X = OX;
      roomBox(X, 14, 12, 4.5, toon(0xffffff, woodPanel(8)), toon(0xffffff, parquet(6)));
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), toon(0xffffff, rugTex())); rug.rotation.x = -Math.PI / 2; rug.position.set(X, 0.02, -1); R.add(rug);
      window(X, 2.3, -6, 3.4, 2.8, cityMorning(), toon(0x2a1a14));
      B.add(BOX, woodD, [X, 0.78, -3.2], [0, 0, 0], [3.2, 0.1, 1.4]); B.add(BOX, wood, [X, 0.4, -3.2], [0, 0, 0], [3.0, 0.75, 1.2]); B.add(BOX, toon(0x2a4a2a), [X, 0.84, -3.2], [0, 0, 0], [1.8, 0.02, 0.8]);
      B.add(BOX, toon(0x3a1a14), [X, 0.6, -4.3], [0, 0, 0], [1.0, 0.25, 0.9]); B.add(BOX, toon(0x3a1a14), [X, 1.55, -4.75], [0, 0, 0], [1.1, 1.9, 0.25]);
      for (let k = 0; k < 4; k++) for (let r = 0; r < 5; r++) { B.add(BOX, woodD, [X - 6.75, 0.3 + r * 0.85, -4 + k * 2.2], [0, 0, 0], [0.4, 0.06, 2.0]); for (let b = 0; b < 8; b++) B.add(BOX, [toon(0x7a1f2b), toon(0x1f3a5a), toon(0x2f5a3a), toon(0x8a6a3a)][(b + r + k) % 4], [X - 6.75, 0.6 + r * 0.85, -4.8 + k * 2.2 + b * 0.22], [0, 0, 0], [0.3, 0.5 - (b % 3) * 0.06, 0.16]); }
      B.add(CYL8, brass, [X + 1.1, 0.9, -3.4], [0, 0, 0], [0.1, 0.04, 0.1]); B.add(CYL8, brass, [X + 1.1, 1.1, -3.4], [0, 0, 0], [0.025, 0.4, 0.025]); B.add(HALF, toon(0x2e7a4a), [X + 1.1, 1.3, -3.4], [0, 0, 0], [0.4, 0.14, 0.16]); room.push({ p: [X + 1.1, 1.22, -3.4], order: 0, tint: [1, 0.85, 0.5] });
      B.add(SPH, toon(0x3a6a8a), [X + 5.5, 1.3, -4.5], [0, 0, 0], [0.5, 0.5, 0.5]); B.add(CYL8, brass, [X + 5.5, 0.4, -4.5], [0, 0, 0], [0.05, 0.8, 0.05]);
      B.add(BOX, toon(0x3a3e46), [X + 6.4, 0.6, 2.5], [0, 0, 0], [0.9, 1.2, 0.9]); B.add(CYL8, toon(0xc9ccd2), [X + 5.94, 0.7, 2.5], [0, 0, Math.PI / 2], [0.2, 0.04, 0.2]);
      const bp = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.4), toon(0xffffff, canvasTex(192, 128, (g) => { g.fillStyle = "#1f3a6a"; g.fillRect(0, 0, 192, 128); g.strokeStyle = "#dfe8ff"; g.lineWidth = 2; g.strokeRect(70, 26, 52, 80); g.beginPath(); g.ellipse(96, 26, 30, 8, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(96, 18); g.lineTo(96, 4); g.stroke(); for (const sx of [40, 152]) { g.strokeRect(sx - 6, 50, 12, 56); } g.font = "bold 12px Georgia"; g.fillStyle = "#dfe8ff"; g.fillText("PROJECT: UMBRA", 46, 122); g.strokeRect(4, 4, 184, 120); })));
      bp.position.set(X + 6.98, 2.4, -2); bp.rotation.y = -Math.PI / 2; R.add(bp);
      for (const x of [-3, 3]) { B.add(CYL, brass, [X + x, 4.2, 0], [0, 0, 0], [0.5, 0.06, 0.5]); for (let k = 0; k < 6; k++) room.push({ p: [X + x + Math.cos(k) * 0.45, 4.05, Math.sin(k) * 0.45], order: 0, tint: [1, 0.8, 0.5] }); }
      for (const [x, z] of [[-6, -5.3], [6, -5.3]]) { B.add(CYL, toon(0xb0674a), [X + x, 0.4, z], [0, 0, 0], [0.4, 0.8, 0.4]); B.add(ICO, leaf[1], [X + x, 1.6, z], [0, 0, 0], [0.7, 1.0, 0.7]); }
      for (const s of [-1, 1]) { B.add(BOX, toon(0x3a1a14), [X + s * 1.0, 0.45, 0.8], [0, 0, 0], [0.9, 0.9, 0.9]); }
      // laptop: base on the desk, the lid hinges open (this.lid rotates about x)
      B.add(BOX, toon(0x2a2c32), [X, 0.86, -2.85], [0, 0, 0], [0.7, 0.03, 0.48]);
      const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.46, 0.02), toon(0x2a2c32)); lidMesh.position.set(0, 0.23, 0); this.lid.add(lidMesh);
      this.screen = new THREE.MeshBasicMaterial({ color: 0x0a1418, toneMapped: false });
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.38), this.screen); scr.position.set(0, 0.23, 0.012); this.lid.add(scr);
      this.lid.position.set(X, 0.88, -3.08); R.add(this.lid);
    }
    // ================= TRAVEL: the tower in a park, the pyramids =================
    { const TB = new Batch(); buildTower(TB); const g = new THREE.Group(); TB.build(g); g.position.set(TWX, 0, 0); R.add(g);
      plane(700, 700, toon(0xffffff, lawnTex(80)), [TWX, 0.01, 150]); plane(30, 400, toon(0xd9c9a0), [TWX, 0.02, 200]);
      for (let z = 60; z < 360; z += 12) for (const s of [-1, 1]) { const x = TWX + s * 22; B.add(CYL8, toon(0x8a7a62), [x, 2, z], [0, 0, 0], [0.3, 4, 0.3]); B.add(ICO, leaf[(z / 12) % 3 | 0], [x, 5.4, z], [0, 0, 0], [2.6, 2.2, 2.6]); }
      for (let k = 0; k < 30; k++) { const x = TWX + (rnd(k + 700) - 0.5) * 600, z = 380 + rnd(k + 701) * 200; B.add(BOX, toon(0xeadfc8), [x, 11, z], [0, 0, 0], [30, 22, 26]); B.add(MANS, toon(0x7d8a99), [x, 24.5, z], [0, 0, 0], [30, 5, 26]); }
    }
    { const sand = toon(0xffffff, sandTex()); plane(1600, 1600, sand, [PYX, 0.01, -200]);
      for (const [x, z, s] of [[0, -260, 1.0], [-170, -330, 0.8], [130, -420, 0.55]] as const) { B.add(CONE4, toon(0xd9b070), [PYX + x, 70 * s, z], [0, Math.PI / 4, 0], [190 * s, 140 * s, 190 * s]); B.add(CONE4, toon(0xf2e0b0), [PYX + x, 70 * s + 56 * s, z], [0, Math.PI / 4, 0], [38 * s, 28 * s, 38 * s]); }
      for (let k = 0; k < 18; k++) B.add(SPH, toon(0xe0bc78), [PYX + (rnd(k + 800) - 0.5) * 900, -6, -60 - rnd(k + 801) * 600], [0, rnd(k), 0], [60 + rnd(k) * 60, 14, 30 + rnd(k + 2) * 30]);
      for (const [x, z] of [[-14, -6], [-18, -10], [12, -14], [16, -9]]) { const px = PYX + x, pz = z + 10; for (let k = 0; k < 6; k++) B.add(CYL8, toon(0x8a6a3a), [px + k * 0.15, 0.6 + k * 1.1, pz], [0, 0, 0.05], [0.28, 1.15, 0.28]); for (let k = 0; k < 7; k++) { const a = k * 0.9; B.add(CONE, leaf[k % 3], [px + 0.8 + Math.cos(a) * 1.6, 6.8, pz + Math.sin(a) * 1.6], [Math.sin(a) * 1.3, 0, -Math.cos(a) * 1.3], [0.4, 3.4, 0.12]); } }
    }
    B.build(R);
    this.lamps = new Flames(R, lamps, 0.7);
    this.spark = new Flames(R, sparks, 0.9);
    this.machineGlow = new Flames(R, glow, 1.2);
    this.roomLights = new Flames(R, room, 0.3);
    for (const c of [0x7affff, 0xffb060, 0xff3030, 0x3050ff]) { const l = new THREE.PointLight(c, 0, 18, 1.3); R.add(l); this.pt.push(l); }
    const steamM = toon(0xd8dde6);
    for (let i = 0; i < 24; i++) { const p = new THREE.Mesh(SPH, steamM); R.add(p); this.puffs.push(p); }
    this.cloudMat = new THREE.MeshBasicMaterial({ map: canvasTex(256, 128, (g) => { g.fillStyle = "#fff"; for (const [x, y, r] of [[60, 80, 36], [110, 60, 48], [165, 70, 40], [205, 85, 28], [130, 92, 50]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } }), transparent: true, depthWrite: false, fog: false, toneMapped: false });
    for (let i = 0; i < 24; i++) { const a = rnd(i + 950) * Math.PI * 2, r = 1100 + rnd(i + 951) * 150, s = 130 + rnd(i + 952) * 140; const c = new THREE.Mesh(new THREE.PlaneGeometry(s, s / 2), this.cloudMat); c.position.set(Math.cos(a) * r, 200 + rnd(i + 953) * 260, Math.sin(a) * r); c.layers.set(NOINK); this.clouds.push(c); this.sky.add(c); c.lookAt(0, 0, 0); }
    this.sun.position.set(80, 120, 60); R.add(this.hemi, this.sun, this.sun.target);
  }

  set(o: { light: LightName; t: number; px: number; cam: V3; police?: boolean; lid?: number; out?: number; machine?: number; screen?: number; steam?: boolean }) {
    const L = o.light;
    this.sky.position.set(...o.cam);
    this.skyMat.map = this.skies[L]; this.skyMat.needsUpdate = true;
    const P = {
      night: { hs: 0x5a6aa0, hg: 0x22222e, hi: 1.5, sc: 0x8a9ad8, si: 0.6, fog: 0x1a2236, fn: 18, ff: 150, lamp: 1, cl: 0x2a3050, room: 1 },
      day: { hs: 0xe0ecff, hg: 0x6a6a4a, hi: 1.75, sc: 0xfff2d8, si: 2.6, fog: 0xdfe8ee, fn: 250, ff: 1500, lamp: 0, cl: 0xffffff, room: 0 },
      desert: { hs: 0xfff0d8, hg: 0x9a7a4a, hi: 1.8, sc: 0xffe8c0, si: 2.8, fog: 0xf2e2c0, fn: 300, ff: 1600, lamp: 0, cl: 0xffffff, room: 0 },
      bedroom: { hs: 0x4a5aa0, hg: 0x1a1a26, hi: 1.45, sc: 0x9aaaf0, si: 0.7, fog: 0x0a0e1a, fn: 30, ff: 200, lamp: 1, cl: 0x2a3050, room: 0 },
      office: { hs: 0xf0e8dc, hg: 0x4a3a2a, hi: 1.4, sc: 0xd8dce8, si: 1.2, fog: 0x9aa4b4, fn: 60, ff: 400, lamp: 1, cl: 0xc0c8d0, room: 1 },
      dark: { hs: 0x1a2240, hg: 0x050508, hi: 0.5, sc: 0x4a5a9a, si: 0.25, fog: 0x000000, fn: 8, ff: 60, lamp: 0, cl: 0x000000, room: 0 },
    }[L];
    const out = o.out ?? 0;
    this.hemi.color.set(P.hs); this.hemi.groundColor.set(P.hg); this.hemi.intensity = P.hi * (1 - 0.75 * out);
    this.sun.color.set(P.sc); this.sun.intensity = P.si * (1 - 0.7 * out); this.sun.position.set(o.cam[0] + 60, 120, o.cam[2] + 80); this.sun.target.position.set(o.cam[0], 0, o.cam[2]); this.sun.target.updateMatrixWorld();
    this.fog.color.set(P.fog); this.fog.near = P.fn; this.fog.far = P.ff;
    this.cloudMat.color.set(P.cl);
    for (const f of [this.lamps, this.spark, this.police, this.roomLights, this.machineGlow]) { f.mat.uniforms.uTime.value = o.t; f.mat.uniforms.uPx.value = o.px; }
    this.lamps.mat.uniforms.uLit.value = P.lamp > 0 ? 1 : 0;
    this.pools.opacity = P.lamp > 0 && L === "night" ? 0.55 : 0;
    this.roomLights.mat.uniforms.uLit.value = (L === "office" || L === "bedroom" || L === "night") && out < 0.5 ? 1 : 0;
    this.roomLights.mat.uniforms.uSize.value = L === "bedroom" ? 0.12 : 0.3;
    // the machine hums; o.machine (0..1) is the transformation flash
    const m = o.machine ?? 0, buzz = 0.6 + 0.4 * Math.abs(Math.sin(o.t * 23) * Math.sin(o.t * 7.1));
    this.spark.mat.uniforms.uLit.value = 1; this.spark.mat.uniforms.uSize.value = 0.6 + 0.6 * buzz + 2 * m;
    this.machineGlow.mat.uniforms.uLit.value = 1; this.machineGlow.mat.uniforms.uSize.value = 0.9 + 0.3 * buzz + 3 * m;
    this.booth.opacity = 0.18 + 0.08 * buzz + 0.6 * m;
    const near = (p: V3, r: number) => Math.hypot(o.cam[0] - p[0], o.cam[2] - p[2]) < r;
    this.pt[0].position.set(MACH[0], 2.2, MACH[2]); this.pt[0].intensity = near(MACH, 60) && L === "night" ? 5 * buzz + 30 * m : 0;
    this.pt[1].position.set(o.cam[0] < 1200 ? BX + 1.9 : OX + 1.1, 1.5, o.cam[0] < 1200 ? 4.0 : -3.2); this.pt[1].intensity = (L === "office" ? 4 : 0) * (1 - out);
    // police lights
    this.policeCars.visible = !!o.police;
    const ph = Math.floor(o.t * 6) % 2;
    this.police.mat.uniforms.uLit.value = o.police ? 1 : 0;
    this.pt[2].position.set(MX + 2.6, 2.5, 8); this.pt[3].position.set(MX - 3.6, 2.5, 14);
    this.pt[2].intensity = o.police ? (ph ? 14 : 2) : 0; this.pt[3].intensity = o.police ? (ph ? 2 : 14) : 0;
    this.mansionMat.map = L === "day" ? this.mDay : this.mNight; this.mansionMat.needsUpdate = true;
    const lv = o.lid ?? 0; this.lid.rotation.x = (1 - lv) * (Math.PI / 2) - 0.22 * lv;
    this.screen.color.setHex((o.screen ?? 0) > 0 ? 0x6ab8c8 : 0x0a1418);
    // manhole steam on the street
    this.puffs.forEach((p, i) => {
      if (!o.steam) { p.visible = false; return; }
      const src: V3 = i % 2 ? [1.8, 0, -8] : [-1.2, 0, -62], period = 0.3, k = Math.floor(i / 2);
      const birth = Math.floor(o.t / period) * period - k * period, age = o.t - birth, life = 12 * period;
      const s = Math.min(1, age / 0.6) * (1 - Math.max(0, (age - life * 0.6) / (life * 0.4)));
      p.visible = s > 0.02; p.position.set(src[0] + Math.sin(k * 1.7 + o.t * 0.3) * 0.4 * age, 0.2 + age * 0.9, src[2] + Math.cos(k * 2.3) * 0.3 * age); p.scale.setScalar((0.2 + age * 0.22) * s);
    });
  }
}
