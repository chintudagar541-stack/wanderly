// Interior sets, far from the city so they never see each other:
//   SALON  (3000, 0, 0): the hotel salon: long table for the six dealers, chandeliers, fireplace, tall windows on Paris.
//   SUITE  (3100, 0, 0): Lustig's room at night: desk under the window (the tower outside), lamp, forged letters.
//   FLAT   (3200, 0, 0): the Poissons' parlour: floral paper, sofa, birdcage, clock, window on the rooftops.
//   STATION (-3000, 0, 0): the train shed: two tracks along x, platforms, iron arches, glass roof, clock wall.
import * as THREE from "three";
import { Batch, V3, rnd, toon, canvasTex, ramp, BOX, CYL, CONE, ICO, SPH, CYL8, DOME, HALF } from "./lib";
import { signTex } from "./city";

export const SALON: V3 = [3000, 0, 0], SUITE: V3 = [3100, 0, 0], FLAT: V3 = [3200, 0, 0], STATION: V3 = [-3000, 0, 0];
type Light = { p: V3; order: number; tint?: V3 };

const parquet = (rx: number, ry: number) => canvasTex(128, 128, (g) => {
  for (let y = 0; y < 128; y += 16) for (let x = 0; x < 128; x += 64) { const o = (y / 16) % 2 ? 32 : 0; g.fillStyle = ["#8a5a32", "#9a6a3a", "#7a4e2a"][Math.floor(rnd(x + y * 3) * 3)]; g.fillRect(x + o - 64, y, 64, 16); g.fillRect(x + o, y, 64, 16); g.strokeStyle = "#4a2e18"; g.lineWidth = 1.5; g.strokeRect(x + o + 0.5, y + 0.5, 63, 15); }
}, [rx, ry]);
const panelWall = (base: string, trim: string, rx: number) => canvasTex(128, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 128, 256);
  g.strokeStyle = trim; g.lineWidth = 4; g.strokeRect(14, 30, 100, 120); g.strokeRect(14, 170, 100, 66);
  g.lineWidth = 2; g.strokeRect(22, 38, 84, 104);
  g.fillStyle = trim; g.fillRect(0, 156, 128, 6); g.fillRect(0, 0, 128, 8); g.fillRect(0, 246, 128, 10);
}, [rx, 1]);
const stripeWall = (a: string, b: string, rx: number) => canvasTex(64, 64, (g) => { g.fillStyle = a; g.fillRect(0, 0, 64, 64); g.fillStyle = b; g.fillRect(0, 0, 14, 64); g.fillRect(32, 0, 4, 64); }, [rx, 1]);
const floralWall = (rx: number, ry: number) => canvasTex(128, 128, (g) => {
  g.fillStyle = "#e9c9b8"; g.fillRect(0, 0, 128, 128);
  for (const [x, y] of [[32, 32], [96, 96], [96, 32], [32, 96]]) { g.fillStyle = "#c25a6a"; for (let k = 0; k < 5; k++) { const a = k * 1.256; g.beginPath(); g.arc(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 6, 0, Math.PI * 2); g.fill(); } g.fillStyle = "#f2c14e"; g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); g.fillStyle = "#6a9a5a"; g.fillRect(x + 9, y + 9, 10, 4); }
}, [rx, ry]);
const rugTex = (a: string, b: string) => canvasTex(256, 160, (g) => {
  g.fillStyle = a; g.fillRect(0, 0, 256, 160); g.strokeStyle = b; g.lineWidth = 8; g.strokeRect(10, 10, 236, 140); g.lineWidth = 3; g.strokeRect(24, 24, 208, 112);
  g.fillStyle = b; g.beginPath(); g.ellipse(128, 80, 50, 32, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = a; g.beginPath(); g.ellipse(128, 80, 30, 18, 0, 0, Math.PI * 2); g.fill();
  for (let k = 0; k < 12; k++) { g.fillStyle = b; g.fillRect(36 + k * 16, 30, 6, 6); g.fillRect(36 + k * 16, 124, 6, 6); }
});
/** a window view of Paris rooftops with the tower: day or night */
export const viewTex = (night: boolean, towerX = 0.62) => canvasTex(256, 384, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 384);
  if (night) { gr.addColorStop(0, "#0a1030"); gr.addColorStop(0.7, "#2a2f5a"); gr.addColorStop(1, "#3a3a5a"); } else { gr.addColorStop(0, "#5f96d8"); gr.addColorStop(0.7, "#bcd6ee"); gr.addColorStop(1, "#e8e2d0"); }
  g.fillStyle = gr; g.fillRect(0, 0, 256, 384);
  if (night) { g.fillStyle = "#fff6d0"; g.beginPath(); g.arc(60, 70, 18, 0, Math.PI * 2); g.fill(); g.fillStyle = "#0a1030"; g.beginPath(); g.arc(68, 64, 16, 0, Math.PI * 2); g.fill(); for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,250,230,0.8)"; g.fillRect(rnd(i) * 256, rnd(i + 3) * 200, 2, 2); } }
  else { g.fillStyle = "rgba(255,255,255,0.85)"; for (const [x, y, r] of [[50, 80, 22], [76, 72, 28], [104, 84, 18], [190, 50, 16], [210, 46, 20]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } }
  // tower
  const tx = towerX * 256, col = night ? "#1a1424" : "#7a5236";
  g.fillStyle = col; g.beginPath(); g.moveTo(tx - 46, 300); g.quadraticCurveTo(tx - 12, 200, tx - 3, 40); g.lineTo(tx + 3, 40); g.quadraticCurveTo(tx + 12, 200, tx + 46, 300); g.lineTo(tx + 30, 300); g.quadraticCurveTo(tx, 250, tx - 30, 300); g.closePath(); g.fill();
  g.fillRect(tx - 24, 236, 48, 6); g.fillRect(tx - 13, 170, 26, 4); g.fillRect(tx - 1, 20, 2, 22);
  if (night) { g.fillStyle = "#ffd98a"; for (let i = 0; i < 18; i++) g.fillRect(tx - 20 + rnd(i + 9) * 40, 60 + rnd(i + 4) * 230, 2, 2); }
  // rooftops
  for (let i = 0; i < 9; i++) {
    const x = i * 30 - 10 + rnd(i) * 10, w = 36 + rnd(i + 1) * 20, top = 270 + rnd(i + 2) * 40;
    g.fillStyle = night ? "#2a2c40" : "#e3d6bc"; g.fillRect(x, top + 22, w, 384);
    g.fillStyle = night ? "#1e2032" : "#7d8a99"; g.beginPath(); g.moveTo(x - 2, top + 24); g.lineTo(x + 6, top); g.lineTo(x + w - 6, top); g.lineTo(x + w + 2, top + 24); g.closePath(); g.fill();
    g.fillStyle = night ? "#3a2a2a" : "#b0674a"; g.fillRect(x + w * 0.6, top - 14, 8, 16);
    for (let k = 0; k < 3; k++) for (let r = 0; r < 3; r++) { g.fillStyle = night ? (rnd(i * 9 + k + r) < 0.45 ? "#ffcf7a" : "#14182a") : "#43546a"; g.fillRect(x + 5 + k * (w / 3), top + 32 + r * 18, 6, 10); }
  }
});
const paintingTex = (k: number) => canvasTex(96, 128, (g) => {
  g.fillStyle = "#c9962e"; g.fillRect(0, 0, 96, 128); g.fillStyle = "#8a6420"; g.fillRect(6, 6, 84, 116);
  const bg = ["#3a5a4a", "#5a3a3a", "#3a4a6a"][k % 3]; g.fillStyle = bg; g.fillRect(12, 12, 72, 104);
  if (k % 2) { g.fillStyle = "#e8c8a0"; g.beginPath(); g.ellipse(48, 50, 14, 18, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = "#2a2020"; g.beginPath(); g.ellipse(48, 100, 28, 26, 0, Math.PI, 0); g.fill(); g.fillStyle = "#4a3020"; g.beginPath(); g.ellipse(48, 36, 15, 8, 0, Math.PI, 0); g.fill(); }
  else { g.fillStyle = "#9ab8d8"; g.fillRect(12, 12, 72, 50); g.fillStyle = "#5a8a4a"; g.beginPath(); g.moveTo(12, 80); g.quadraticCurveTo(48, 50, 84, 76); g.lineTo(84, 116); g.lineTo(12, 116); g.fill(); g.fillStyle = "#f2c14e"; g.beginPath(); g.arc(66, 30, 8, 0, Math.PI * 2); g.fill(); }
});
const towerPlanTex = () => canvasTex(256, 192, (g) => {
  g.fillStyle = "#2a4a7a"; g.fillRect(0, 0, 256, 192); g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(80, 180); g.quadraticCurveTo(118, 110, 126, 14); g.lineTo(130, 14); g.quadraticCurveTo(138, 110, 176, 180); g.stroke();
  g.beginPath(); g.moveTo(98, 180); g.quadraticCurveTo(128, 140, 158, 180); g.stroke();
  for (const [y, w] of [[140, 34], [100, 18], [40, 6]]) { g.strokeRect(128 - w, y, 2 * w, 6); }
  for (let y = 30; y < 176; y += 10) { const w = 4 + (y - 14) * 0.27; g.beginPath(); g.moveTo(128 - w, y); g.lineTo(128 + w, y + 10); g.moveTo(128 + w, y); g.lineTo(128 - w, y + 10); g.stroke(); }
  g.font = "bold 16px Georgia"; g.fillStyle = "#fff"; g.fillText("7 300 t", 190, 40); g.fillText("FER", 196, 60);
  g.strokeRect(6, 6, 244, 180);
});
const letterTex = () => canvasTex(192, 256, (g) => {
  g.fillStyle = "#f6efd8"; g.fillRect(0, 0, 192, 256);
  g.fillStyle = "#1f3a6a"; g.font = "bold 13px Georgia"; g.textAlign = "center"; g.fillText("RÉPUBLIQUE FRANÇAISE", 96, 26); g.font = "bold 11px Georgia"; g.fillText("MINISTÈRE DES POSTES", 96, 44); g.fillText("ET TÉLÉGRAPHES", 96, 58);
  g.fillStyle = "#1f3a6a"; g.fillRect(30, 66, 132, 2);
  g.fillStyle = "#6a6a70"; for (let k = 0; k < 9; k++) g.fillRect(22, 90 + k * 14, 148 - (k % 3) * 18, 3);
  g.strokeStyle = "#1e1e22"; g.lineWidth = 2; g.beginPath(); g.moveTo(100, 232); g.bezierCurveTo(120, 210, 130, 240, 160, 222); g.stroke();
  g.fillStyle = "#c0202a"; g.beginPath(); g.arc(46, 222, 16, 0, Math.PI * 2); g.fill(); g.fillStyle = "#8a1018"; g.beginPath(); g.arc(46, 222, 9, 0, Math.PI * 2); g.fill();
});
const clockTex = () => canvasTex(256, 256, (g) => {
  g.fillStyle = "#f6efd8"; g.beginPath(); g.arc(128, 128, 120, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#1e1e22"; g.lineWidth = 10; g.stroke();
  g.fillStyle = "#1e1e22"; g.font = "bold 26px Georgia"; g.textAlign = "center"; g.textBaseline = "middle";
  ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"].forEach((s, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; g.fillText(s, 128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92); });
  g.lineWidth = 8; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + 40, 128 - 30); g.stroke(); g.lineWidth = 5; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 - 10, 128 - 80); g.stroke();
});
const glassRoofTex = () => canvasTex(128, 128, (g) => {
  g.fillStyle = "#cfe0ea"; g.fillRect(0, 0, 128, 128); g.fillStyle = "rgba(255,255,255,0.5)"; g.fillRect(8, 8, 40, 20);
  g.strokeStyle = "#3a4048"; g.lineWidth = 5; g.strokeRect(0, 0, 128, 128); g.lineWidth = 2; g.beginPath(); g.moveTo(64, 0); g.lineTo(64, 128); g.moveTo(0, 64); g.lineTo(128, 64); g.stroke();
}, [30, 8]);

const pic = (R: THREE.Object3D, tex: THREE.Texture, p: V3, ry: number, w: number, h: number, basic = false) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }) : new THREE.MeshToonMaterial({ map: tex, gradientMap: ramp }));
  m.position.set(...p); m.rotation.y = ry; R.add(m); return m;
};

export class Interiors {
  views: THREE.Mesh[] = [];
  constructor(R: THREE.Object3D, B: Batch, lights: Light[], lamps: Light[]) {
    const wood = toon(0x7a4e2a), woodD = toon(0x4a2e18), gold = toon(0xd9b04a), cloth = toon(0xf6f2e8), red = toon(0x9a1f2a), green = toon(0x2f5a3a), black = toon(0x1e1e22), brass = toon(0xc9a040), crystal = toon(0xeaf4ff);
    const floor = (c: V3, w: number, d: number, m: THREE.Material) => { const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); f.rotation.x = -Math.PI / 2; f.position.set(c[0], 0.01, c[2]); R.add(f); };
    const room = (c: V3, w: number, d: number, h: number, wallM: THREE.Material, floorM: THREE.Material, ceil: number) => {
      floor(c, w, d, floorM);
      B.add(BOX, wallM, [c[0], h / 2, c[2] - d / 2 - 0.15], [0, 0, 0], [w, h, 0.3]); B.add(BOX, wallM, [c[0], h / 2, c[2] + d / 2 + 0.15], [0, 0, 0], [w, h, 0.3]);
      B.add(BOX, wallM, [c[0] - w / 2 - 0.15, h / 2, c[2]], [0, Math.PI / 2, 0], [d, h, 0.3]); B.add(BOX, wallM, [c[0] + w / 2 + 0.15, h / 2, c[2]], [0, Math.PI / 2, 0], [d, h, 0.3]);
      B.add(BOX, toon(ceil), [c[0], h + 0.15, c[2]], [0, 0, 0], [w + 0.6, 0.3, d + 0.6]);
      B.add(BOX, toon(0xf6efe0), [c[0], h - 0.15, c[2] - d / 2 + 0.08], [0, 0, 0], [w, 0.3, 0.2]); B.add(BOX, toon(0xf6efe0), [c[0], h - 0.15, c[2] + d / 2 - 0.08], [0, 0, 0], [w, 0.3, 0.2]);
      B.add(BOX, woodD, [c[0], 0.1, c[2] - d / 2 + 0.03], [0, 0, 0], [w, 0.2, 0.1]); B.add(BOX, woodD, [c[0], 0.1, c[2] + d / 2 - 0.03], [0, 0, 0], [w, 0.2, 0.1]);
    };
    /** a tall window on the wall at z = zw (facing +z), with a view, frame, drapes */
    const window = (x: number, y: number, zw: number, w: number, h: number, night: boolean, drape: THREE.Material, towerX: number) => {
      this.views.push(pic(R, viewTex(night, towerX), [x, y, zw + 0.02], 0, w, h, true));
      B.add(BOX, toon(0xf6efe0), [x, y, zw + 0.06], [0, 0, 0], [0.12, h, 0.1]); B.add(BOX, toon(0xf6efe0), [x, y + h * 0.18, zw + 0.06], [0, 0, 0], [w, 0.1, 0.1]);
      for (const s of [-1, 1]) B.add(BOX, toon(0xf6efe0), [x + s * w / 2, y, zw + 0.08], [0, 0, 0], [0.18, h + 0.2, 0.16]);
      B.add(BOX, toon(0xf6efe0), [x, y - h / 2 - 0.08, zw + 0.15], [0, 0, 0], [w + 0.4, 0.14, 0.4]); B.add(BOX, toon(0xf6efe0), [x, y + h / 2 + 0.1, zw + 0.08], [0, 0, 0], [w + 0.4, 0.2, 0.16]);
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) B.add(CYL8, drape, [x + s * (w / 2 + 0.25 + k * 0.16), y + 0.1, zw + 0.25], [0, 0, 0], [0.13, h + 0.6, 0.13]);
      B.add(BOX, drape, [x, y + h / 2 + 0.35, zw + 0.25], [0, 0, 0], [w + 1.4, 0.5, 0.2]); B.add(CYL8, gold, [x, y + h / 2 + 0.62, zw + 0.3], [0, 0, Math.PI / 2], [0.05, w + 1.6, 0.05]);
    };
    const chair = (x: number, z: number, ry: number, m: THREE.Material) => {
      B.add(BOX, m, [x, 0.5, z], [0, ry, 0], [0.55, 0.12, 0.55]); B.add(BOX, wood, [x - Math.sin(ry) * 0.26, 0.98, z - Math.cos(ry) * 0.26], [0, ry, 0], [0.55, 0.9, 0.08]);
      for (const [a, b] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) B.add(BOX, wood, [x + a * Math.cos(ry) + b * Math.sin(ry), 0.22, z - a * Math.sin(ry) + b * Math.cos(ry)], [0, 0, 0], [0.06, 0.44, 0.06]);
    };
    const chandelier = (x: number, y: number, z: number, r: number) => {
      B.add(CYL8, brass, [x, y + 0.6, z], [0, 0, 0], [0.04, 1.2, 0.04]); B.add(CYL, brass, [x, y, z], [0, 0, 0], [r, 0.08, r]); B.add(SPH, brass, [x, y - 0.2, z], [0, 0, 0], [0.22, 0.3, 0.22]);
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; B.add(SPH, crystal, [x + Math.cos(a) * r, y - 0.18, z + Math.sin(a) * r], [0, 0, 0], [0.07, 0.12, 0.07]); lights.push({ p: [x + Math.cos(a) * r * 0.85, y + 0.12, z + Math.sin(a) * r * 0.85], order: 0, tint: [1, 0.82, 0.5] }); }
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; B.add(SPH, crystal, [x + Math.cos(a) * r * 0.55, y - 0.5, z + Math.sin(a) * r * 0.55], [0, 0, 0], [0.05, 0.1, 0.05]); }
    };
    const palm = (x: number, z: number) => { B.add(CYL, toon(0xb0674a), [x, 0.35, z], [0, 0, 0], [0.35, 0.7, 0.35]); for (let k = 0; k < 7; k++) { const a = k * 0.9; B.add(CONE, toon(0x3f7a34), [x + Math.cos(a) * 0.45, 1.3, z + Math.sin(a) * 0.45], [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9], [0.18, 1.5, 0.06]); } };

    // ===== SALON =====
    { const [X, , Z] = SALON;
      room(SALON, 22, 14, 6, toon(0xffffff, panelWall("#efe2c4", "#c9a046", 9)), toon(0xffffff, parquet(8, 5)), 0xf6efe0);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), toon(0xffffff, rugTex("#8a1f2a", "#e8c050"))); rug.rotation.x = -Math.PI / 2; rug.position.set(X, 0.02, Z); R.add(rug);
      for (const x of [-7, 0, 7]) window(X + x, 3.0, Z - 7, 2.2, 3.8, false, red, 0.35 + (x + 7) * 0.02);
      // table, cloth, papers, glasses, the plan of the tower
      B.add(BOX, woodD, [X, 0.72, Z], [0, 0, 0], [12.4, 0.1, 2.4]); B.add(BOX, cloth, [X, 0.78, Z], [0, 0, 0], [12.6, 0.04, 2.6]); B.add(BOX, cloth, [X, 0.55, Z - 1.3], [0, 0, 0], [12.6, 0.45, 0.02]); B.add(BOX, cloth, [X, 0.55, Z + 1.3], [0, 0, 0], [12.6, 0.45, 0.02]);
      for (const [dx, dz] of [[-6, -1.1], [6, -1.1], [-6, 1.1], [6, 1.1], [0, -1.1], [0, 1.1]]) B.add(BOX, woodD, [X + dx, 0.36, Z + dz], [0, 0, 0], [0.14, 0.72, 0.14]);
      const plan = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), toon(0xffffff, towerPlanTex())); plan.rotation.x = -Math.PI / 2; plan.position.set(X + 1.6, 0.81, Z); R.add(plan);
      for (const x of [-4.2, -1.4, 1.4]) for (const s of [-1, 1]) {
        chair(X + x, Z + s * 1.75, s > 0 ? Math.PI : 0, red);
        const pp = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.65), toon(0xffffff, letterTex())); pp.rotation.set(-Math.PI / 2, 0, s > 0 ? 0 : Math.PI); pp.position.set(X + x, 0.805, Z + s * 0.8); R.add(pp);
        B.add(CYL8, crystal, [X + x + 0.4, 0.9, Z + s * 0.8], [0, 0, 0], [0.06, 0.18, 0.06]);
      }
      chair(X - 6.7, Z, Math.PI / 2, red);
      for (const x of [-3.5, 3.5]) chandelier(X + x, 4.6, Z, 0.9);
      for (const x of [-5.4, 5.0]) { B.add(CYL8, brass, [X + x, 0.95, Z], [0, 0, 0], [0.08, 0.3, 0.08]); for (const dx of [-0.2, 0, 0.2]) { B.add(CYL8, cloth, [X + x + dx, 1.25, Z], [0, 0, 0], [0.03, 0.3, 0.03]); lights.push({ p: [X + x + dx, 1.45, Z], order: 0 }); } }
      // fireplace + mirror + clock at the west wall; portraits on the east wall; side tables, palms, sconces
      B.add(BOX, toon(0xe8e0d0), [X - 10.75, 0.7, Z], [0, 0, 0], [0.5, 1.4, 2.6]); B.add(BOX, toon(0xe8e0d0), [X - 10.6, 1.45, Z], [0, 0, 0], [0.8, 0.12, 3.0]); B.add(BOX, black, [X - 10.55, 0.5, Z], [0, 0, 0], [0.12, 0.8, 1.4]);
      lights.push({ p: [X - 10.5, 0.35, Z - 0.3], order: 0 }, { p: [X - 10.5, 0.4, Z + 0.25], order: 0 });
      pic(R, viewTex(false, 0.5), [X - 10.9, 3.1, Z], Math.PI / 2, 2.2, 2.4);
      B.add(BOX, gold, [X - 10.97, 3.1, Z], [0, Math.PI / 2, 0], [2.6, 2.8, 0.08]);
      B.add(BOX, gold, [X - 10.5, 1.75, Z], [0, 0, 0], [0.3, 0.5, 0.6]); B.add(CYL8, toon(0xf6efd8), [X - 10.34, 1.8, Z], [0, 0, Math.PI / 2], [0.16, 0.02, 0.16]);
      for (const [x, k] of [[-6, 1], [0, 0], [6, 2]] as const) pic(R, paintingTex(k), [X + x, 3.2, Z + 6.95], Math.PI, 1.8, 2.4);
      for (const [x, z] of [[-9.5, -6], [9.5, -6], [-9.5, 6], [9.5, 6]]) palm(X + x, Z + z);
      for (const x of [-3.5, 3.5]) { B.add(BOX, wood, [X + x, 0.45, Z + 6.6], [0, 0, 0], [1.6, 0.9, 0.6]); B.add(CYL8, toon(0x3a6aa8), [X + x, 1.1, Z + 6.6], [0, 0, 0], [0.18, 0.4, 0.18]); for (let k = 0; k < 5; k++) B.add(SPH, [toon(0xd1405a), toon(0xf2c14e), toon(0xffffff)][k % 3], [X + x + (k - 2) * 0.1, 1.45 + (k % 2) * 0.1, Z + 6.6], [0, 0, 0], [0.12, 0.12, 0.12]); }
      for (const x of [-3.5, 3.5, -10.5, 10.5]) for (const zz of [-6.9, 6.9]) if (Math.abs(x) < 10) { B.add(BOX, brass, [X + x, 3.2, Z + zz * 0.995], [0, 0, 0], [0.1, 0.4, 0.1]); lights.push({ p: [X + x, 3.55, Z + zz * 0.97], order: 0, tint: [1, 0.8, 0.5] }); }
      for (const z of [-4, 4]) { B.add(BOX, wood, [X + 10.6, 0.5, Z + z], [0, 0, 0], [0.7, 1.0, 1.8]); B.add(CYL8, gold, [X + 10.6, 1.25, Z + z], [0, 0, 0], [0.15, 0.5, 0.15]); }
    }
    // ===== SUITE (night) =====
    { const [X, , Z] = SUITE;
      room(SUITE, 10, 8, 4, toon(0xffffff, stripeWall("#3f5a46", "#2f4a38", 6)), toon(0xffffff, parquet(4, 3)), 0xe8dcc0);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.4), toon(0xffffff, rugTex("#2a3a6a", "#d9a040"))); rug.rotation.x = -Math.PI / 2; rug.position.set(X, 0.02, Z - 0.4); R.add(rug);
      window(X, 2.2, Z - 4, 1.9, 2.8, true, red, 0.6);
      B.add(BOX, wood, [X, 0.76, Z - 2.75], [0, 0, 0], [2.2, 0.08, 1.0]); B.add(BOX, woodD, [X, 0.4, Z - 2.75], [0, 0, 0], [2.1, 0.7, 0.9]);
      B.add(BOX, toon(0x2f5a3a), [X, 0.81, Z - 2.75], [0, 0, 0], [1.6, 0.02, 0.7]);
      // lamp (green shade), inkwell, pen, stamp, stacks of letters, a typewriter
      B.add(CYL8, brass, [X + 0.75, 0.82, Z - 3.0], [0, 0, 0], [0.12, 0.04, 0.12]); B.add(CYL8, brass, [X + 0.75, 1.05, Z - 3.0], [0, 0, 0], [0.025, 0.46, 0.025]);
      B.add(HALF, toon(0x2e7a4a), [X + 0.75, 1.27, Z - 3.0], [0, 0, 0], [0.4, 0.14, 0.16]); lamps.push({ p: [X + 0.75, 1.2, Z - 3.0], order: 0, tint: [1, 0.85, 0.5] });
      B.add(CYL8, black, [X - 0.7, 0.86, Z - 2.6], [0, 0, 0], [0.07, 0.1, 0.07]); B.add(BOX, black, [X - 0.6, 0.95, Z - 2.6], [0, 0, 0.5], [0.01, 0.22, 0.01]);
      B.add(BOX, woodD, [X - 0.85, 0.88, Z - 2.95], [0, 0, 0], [0.12, 0.12, 0.12]); B.add(BOX, red, [X - 0.85, 0.82, Z - 2.95], [0, 0, 0], [0.16, 0.03, 0.16]);
      for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.56), toon(0xffffff, letterTex())); l.rotation.set(-Math.PI / 2, 0, 0.1 - k * 0.15); l.position.set(X - 0.15 + k * 0.32, 0.825 + k * 0.002, Z - 2.55); R.add(l); }
      B.add(BOX, black, [X - 0.78, 0.92, Z - 3.0], [0, 0.4, 0], [0.5, 0.16, 0.36]); B.add(BOX, black, [X - 0.82, 1.02, Z - 3.1], [-0.4, 0.4, 0], [0.5, 0.12, 0.12]); B.add(BOX, cloth, [X - 0.84, 1.1, Z - 3.15], [-0.3, 0.4, 0], [0.3, 0.22, 0.01]);
      chair(X, Z - 3.55, 0, red);
      // bed, wardrobe, suitcase, nightstand, mirror
      B.add(BOX, woodD, [X + 3.3, 0.35, Z + 1.0], [0, 0, 0], [2.2, 0.7, 3.0]); B.add(BOX, red, [X + 3.3, 0.72, Z + 1.2], [0, 0, 0], [2.3, 0.12, 2.6]); B.add(BOX, cloth, [X + 3.3, 0.8, Z - 0.2], [0, 0, 0], [1.8, 0.2, 0.5]); B.add(BOX, woodD, [X + 3.3, 1.1, Z - 0.55], [0, 0, 0], [2.2, 1.5, 0.12]);
      B.add(BOX, wood, [X - 4.5, 1.2, Z + 1.5], [0, 0, 0], [0.9, 2.4, 1.8]); B.add(BOX, gold, [X - 4.04, 1.2, Z + 1.5], [0, 0, 0], [0.04, 0.3, 0.06]);
      B.add(BOX, toon(0x8a5a2e), [X + 3.0, 1.0, Z + 1.6], [0, 0.3, 0], [0.9, 0.5, 0.6]);
      B.add(BOX, wood, [X + 2.0, 0.35, Z - 0.9], [0, 0, 0], [0.5, 0.7, 0.5]); B.add(CYL8, brass, [X + 2.0, 0.9, Z - 0.9], [0, 0, 0], [0.04, 0.4, 0.04]); lamps.push({ p: [X + 2.0, 1.15, Z - 0.9], order: 0, tint: [1, 0.8, 0.5] });
      pic(R, paintingTex(0), [X - 2.6, 2.3, Z - 3.95], 0, 1.1, 1.4); pic(R, paintingTex(1), [X + 2.6, 2.3, Z - 3.95], 0, 1.0, 1.3);
    }
    // ===== FLAT =====
    { const [X, , Z] = FLAT;
      room(FLAT, 10, 9, 3.6, toon(0xffffff, floralWall(10, 3)), toon(0xffffff, parquet(4, 4)), 0xf1e6d0);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.6), toon(0xffffff, rugTex("#6a3a5a", "#e8c8a0"))); rug.rotation.x = -Math.PI / 2; rug.position.set(X, 0.02, Z); R.add(rug);
      window(X - 1.8, 2.0, Z - 4.5, 1.6, 2.4, false, toon(0x5a7a4a), 0.55); window(X + 1.8, 2.0, Z - 4.5, 1.6, 2.4, false, toon(0x5a7a4a), 0.75);
      // sofa, armchair, round table with lace + teapot, dresser + clock, birdcage, fern, standing lamp
      B.add(BOX, toon(0x7a3a5a), [X + 3.6, 0.42, Z + 0.4], [0, 0, 0], [1.0, 0.45, 2.6]); B.add(BOX, toon(0x7a3a5a), [X + 4.05, 0.85, Z + 0.4], [0, 0, 0], [0.25, 0.9, 2.6]);
      for (const s of [-1, 1]) B.add(BOX, toon(0x7a3a5a), [X + 3.6, 0.62, Z + 0.4 + s * 1.3], [0, 0, 0], [1.0, 0.55, 0.22]);
      B.add(BOX, woodD, [X + 3.6, 0.12, Z + 0.4], [0, 0, 0], [1.0, 0.24, 2.6]);
      chair(X - 3.4, Z + 1.0, Math.PI / 2, toon(0x7a3a5a));
      B.add(CYL, wood, [X + 0.6, 0.72, Z + 0.6], [0, 0, 0], [0.6, 0.06, 0.6]); B.add(CYL, cloth, [X + 0.6, 0.66, Z + 0.6], [0, 0, 0], [0.66, 0.14, 0.66]); B.add(CYL8, wood, [X + 0.6, 0.35, Z + 0.6], [0, 0, 0], [0.08, 0.7, 0.08]);
      B.add(SPH, toon(0xf6f2e8), [X + 0.55, 0.85, Z + 0.55], [0, 0, 0], [0.13, 0.11, 0.13]); B.add(CYL8, toon(0xf6f2e8), [X + 0.8, 0.79, Z + 0.7], [0, 0, 0], [0.05, 0.08, 0.05]);
      B.add(BOX, wood, [X - 4.7, 0.6, Z - 2.2], [0, 0, 0], [0.5, 1.2, 1.6]); B.add(BOX, woodD, [X - 4.7, 1.55, Z - 2.2], [0, 0, 0], [0.3, 0.6, 0.4]); pic(R, clockTex(), [X - 4.54, 1.6, Z - 2.2], Math.PI / 2, 0.28, 0.28);
      B.add(CYL8, brass, [X - 3.0, 1.0, Z - 3.6], [0, 0, 0], [0.03, 2.0, 0.03]); B.add(DOME, brass, [X - 3.0, 1.6, Z - 3.6], [0, 0, 0], [0.3, 0.5, 0.3]); for (let k = 0; k < 8; k++) B.add(CYL8, brass, [X - 3.0 + Math.cos(k) * 0.28, 1.35, Z - 3.6 + Math.sin(k) * 0.28], [0, 0, 0], [0.01, 0.5, 0.01]); B.add(SPH, toon(0xf2d040), [X - 3.0, 1.35, Z - 3.6], [0, 0, 0], [0.07, 0.06, 0.07]);
      B.add(CYL, toon(0xb0674a), [X + 4.4, 0.3, Z - 3.8], [0, 0, 0], [0.28, 0.6, 0.28]); for (let k = 0; k < 8; k++) { const a = k * 0.8; B.add(CONE, toon(0x4f8a3a), [X + 4.4 + Math.cos(a) * 0.3, 0.9, Z - 3.8 + Math.sin(a) * 0.3], [Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1], [0.12, 0.9, 0.04]); }
      B.add(CYL8, brass, [X - 3.9, 0.8, Z + 3.0], [0, 0, 0], [0.03, 1.6, 0.03]); B.add(CONE, toon(0xe8a050), [X - 3.9, 1.7, Z + 3.0], [0, 0, 0], [0.35, 0.4, 0.35]); lamps.push({ p: [X - 3.9, 1.6, Z + 3.0], order: 0, tint: [1, 0.8, 0.5] });
      for (const [x, k] of [[-2.5, 1], [2.5, 0]] as const) pic(R, paintingTex(k + 1), [X + x, 2.2, Z + 4.45], Math.PI, 0.9, 1.2);
      pic(R, paintingTex(1), [X + 4.95, 2.0, Z + 0.4], -Math.PI / 2, 0.8, 1.0);
      B.add(BOX, wood, [X, 0.5, Z + 4.2], [0, 0, 0], [1.6, 1.0, 0.5]); for (let k = 0; k < 4; k++) B.add(BOX, [red, green, toon(0x2a3a6a), gold][k], [X - 0.45 + k * 0.3, 1.15, Z + 4.2], [0, 0, 0], [0.2, 0.3, 0.3]);
    }
    // ===== STATION =====
    { const [X, , Z] = STATION;
      const stoneP = toon(0xd9cdb6), rail = toon(0x8a9098), sleeper = toon(0x5a4030), ironS = toon(0x3a4048), bal = toon(0x6a6460);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(400, 60), bal); f.rotation.x = -Math.PI / 2; f.position.set(X - 100, 0.0, Z - 6); R.add(f);
      for (const tz of [0, -12]) { // tracks
        for (const s of [-0.72, 0.72]) B.add(BOX, rail, [X - 100, 0.2, Z + tz + s], [0, 0, 0], [400, 0.14, 0.1]);
        for (let x = -300; x < 100; x += 0.9) B.add(BOX, sleeper, [X + x, 0.06, Z + tz], [0, 0, 0], [0.25, 0.12, 2.4]);
      }
      for (const [z0, z1] of [[2.2, 9], [-9.8, -2.2], [-21, -14.2]]) { // platforms with edge stripes
        B.add(BOX, stoneP, [X, 0.5, Z + (z0 + z1) / 2], [0, 0, 0], [120, 1.0, z1 - z0]);
        B.add(BOX, toon(0xf2d040), [X, 1.01, Z + (z0 > 0 ? z0 + 0.25 : z1 - 0.25)], [0, 0, 0], [120, 0.01, 0.2]);
      }
      // shed: columns, arches, purlins, glass roof
      for (let x = -60; x <= 60; x += 10) {
        for (const z of [-17.5, 17.5, -6]) { B.add(CYL8, ironS, [X + x, 4.5, Z + z], [0, 0, 0], [0.25, 9, 0.25]); B.add(CYL8, ironS, [X + x, 1.3, Z + z], [0, 0, 0], [0.45, 0.6, 0.45]); }
        const a = new THREE.Mesh(new THREE.TorusGeometry(17.5, 0.28, 5, 30, Math.PI), ironS); a.rotation.y = Math.PI / 2; a.position.set(X + x, 9, Z); a.scale.set(1, 0.7, 1); R.add(a);
        for (let k = -2; k <= 2; k++) { if (k === 0) continue; const a2 = new THREE.Mesh(new THREE.TorusGeometry(17.5 * Math.abs(k) / 3, 0.12, 4, 16, Math.PI), ironS); void a2; }
        lights.push({ p: [X + x, 6.2, Z + 6], order: 0, tint: [1, 0.85, 0.55] }, { p: [X + x, 6.2, Z - 8], order: 0, tint: [1, 0.85, 0.55] });
        for (const z of [6, -8]) { B.add(CYL8, ironS, [X + x, 7.5, Z + z], [0, 0, 0], [0.03, 2.4, 0.03]); B.add(BOX, toon(0xfff0c0), [X + x, 6.2, Z + z], [0, 0, 0], [0.4, 0.5, 0.4]); B.add(CONE, ironS, [X + x, 6.6, Z + z], [0, 0, 0], [0.35, 0.35, 0.35]); }
      }
      for (let k = 0; k <= 8; k++) { const a = (k / 8) * Math.PI; B.add(BOX, ironS, [X, 9 + Math.sin(a) * 17.5 * 0.7, Z + Math.cos(a) * 17.5], [0, 0, 0], [120, 0.25, 0.25]); }
      const roof = new THREE.Mesh(HALF, new THREE.MeshToonMaterial({ map: glassRoofTex(), gradientMap: ramp, side: THREE.DoubleSide })); roof.scale.set(120, 17.5 * 0.7, 17.5); roof.position.set(X, 9, Z); R.add(roof);
      // end wall at +x: brick + great arched window + clock + sign
      B.add(BOX, toon(0xc98a6a), [X + 60.5, 9, Z], [0, 0, 0], [1, 18, 36]);
      const win = new THREE.Mesh(new THREE.CircleGeometry(12, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ map: glassRoofTex(), toneMapped: false })); win.rotation.y = -Math.PI / 2; win.position.set(X + 59.9, 9.5, Z); R.add(win);
      pic(R, clockTex(), [X + 59.85, 6.0, Z], -Math.PI / 2, 3.6, 3.6); B.add(CYL, ironS, [X + 59.95, 6.0, Z], [0, 0, Math.PI / 2], [1.95, 0.1, 1.95]);
      pic(R, signTex("PARIS → VIENNE", "#1f3a6a", "#f6efd8", 640, 96), [X + 20, 5.0, Z + 6.2], 0, 6.4, 0.96);
      pic(R, signTex("PARIS → VIENNE", "#1f3a6a", "#f6efd8", 640, 96), [X + 20, 5.0, Z + 5.8], Math.PI, 6.4, 0.96);
      // platform life: benches, luggage carts with trunks, posters, a kiosk, a flower stall
      for (let x = -45; x <= 45; x += 15) { B.add(BOX, toon(0x7a5232), [X + x, 1.5, Z + 8.2], [0, 0, 0], [2.0, 0.08, 0.5]); B.add(BOX, toon(0x7a5232), [X + x, 1.85, Z + 8.45], [0, 0, 0], [2.0, 0.5, 0.06]); }
      for (const [x, z] of [[-30, 4.5], [12, 5.2], [35, -5]]) { B.add(BOX, toon(0x5a6a5a), [X + x, 1.35, Z + z], [0, 0, 0], [2.4, 0.12, 1.2]); for (const s of [-0.9, 0.9]) B.add(CYL8, black, [X + x + s, 1.2, Z + z], [Math.PI / 2, 0, 0], [0.2, 1.3, 0.2]);
        for (let k = 0; k < 3; k++) B.add(BOX, [toon(0x8a5a2e), toon(0x2a3a5a), toon(0x7a1f2b)][k], [X + x - 0.6 + k * 0.6, 1.7 + (k % 2) * 0.15, Z + z], [0, rnd(k + x) * 0.3, 0], [0.55, 0.55 + (k % 2) * 0.3, 0.8]); }
      for (let x = -50; x <= 50; x += 20) { const p = pic(R, signTex(["CÔTE D'AZUR", "VIENNE", "BOURGOGNE", "STRASBOURG", "BRUXELLES", "LYON"][(x / 20 + 3) % 6 | 0], ["#d1202f", "#2a4a8a", "#2e7a4a", "#e86a2a", "#5a3a8a", "#c9962e"][(x / 20 + 3) % 6 | 0], "#f6efd8", 256, 360, "bold 30px Georgia"), [X + x + 5, 3.0, Z + 17.3], Math.PI, 1.8, 2.5); void p; }
      B.add(BOX, green, [X - 20, 2.2, Z + 7.6], [0, 0, 0], [2.6, 2.4, 1.4]); B.add(BOX, gold, [X - 20, 3.5, Z + 7.6], [0, 0, 0], [2.8, 0.3, 1.6]);
      for (let k = 0; k < 9; k++) B.add(SPH, [toon(0xd1405a), toon(0xf2c14e), toon(0xffffff)][k % 3], [X - 21 + (k % 3) * 0.8, 1.4 + Math.floor(k / 3) * 0.3, Z + 6.8], [0, 0, 0], [0.22, 0.22, 0.22]);
      // outside the open end: signals, a signal box, buildings
      for (const x of [-80, -120]) { B.add(CYL8, ironS, [X + x, 4, Z + 3], [0, 0, 0], [0.12, 8, 0.12]); B.add(BOX, red, [X + x, 7.5, Z + 3], [0, 0, 0.3], [1.4, 0.3, 0.1]); }
      B.add(BOX, toon(0xc98a6a), [X - 100, 4, Z - 26], [0, 0, 0], [8, 8, 6]); B.add(BOX, toon(0xffd98a), [X - 100, 5, Z - 22.95], [0, 0, 0], [6, 1.6, 0.05]); B.add(PRISM_ROOF(), toon(0x66727f), [X - 100, 9, Z - 26], [0, 0, Math.PI / 2], [3.2, 8.4, 3.2]);
      for (let k = 0; k < 10; k++) B.add(BOX, toon(0xe3d6bc), [X - 70 - k * 22, 9, Z + 34 + rnd(k) * 6], [0, 0, 0], [20, 18, 14]);
    }
  }
}
const PRISM_ROOF = () => new THREE.CylinderGeometry(1, 1, 1, 3);
void ICO;
