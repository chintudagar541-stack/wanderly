// "The Accidental Mayor" world. Three places, all dense (foreground / mid / background in every frame):
//  BED  (x=0):   Kevin's modest bedroom: wallpaper, bed + patchwork quilt, TV showing BREAKING NEWS, window + morning sun.
//  HALL (x=100): the town hall interior: marble floor, red carpet, columns, banners, committee desk + papers, giant chair.
//  TOWN (x=300): a sunny little town: street with houses, shops, trees and street props; potholes; the public pool park;
//                the square with the town hall facade, the podium and the election results board.
// Moving things (ducks, the car, the potholes, house lights) are driven by a plan the shots install (World.plan).
import * as THREE from "three";
import { NOINK } from "../bridge/ink";
import { canvasTex } from "../eiffel/lib";
import { Batch, Kit, M, rep, Pal, desk, chair, bookshelf, cabinet, plant, picture, windowFrame, door, deskClutter, house, lampPost, fence, V3, rnd, CONE, SPH, CYL, PRISM } from "../../lib3d/kit";
import * as TX from "../../lib3d/textures";
import type { WorldLike } from "../../lib3d/Short3D";
import { Pen, bodyFront, Outfit } from "../dead/toon";

export type LightName = "morning" | "hall" | "day" | "dark" | "night";
export const BX = 0, HX = 100, TX0 = 300;
export const TV: V3 = [BX - 1.55, 1.12, 0.7];          // TV screen centre (bedroom)
export const BED: V3 = [BX + 0.9, 0.62, -1.15];        // top of the mattress, Kevin lies here
export const LIST: V3 = [HX - 3.0, 0.8, -1.6];         // the debtors list on the committee desk
export const THRONE: V3 = [HX, 1.08, -6.55];            // Kevin sitting in the giant chair (feet dangling)
export const POOL: V3 = [TX0 + 23, 0, -48];             // pool centre (water surface ~ y 0.0)
export const PODIUM: V3 = [TX0, 0, -62];
export const BOARD: V3 = [TX0 + 5.5, 3.2, -66];         // election results board centre
export const POSTER: V3 = [TX0 - 6.5, 2.4, -63.5];      // the duck candidate poster

export type DuckState = { pos: V3; yaw: number; hat?: boolean; sign?: number; bob?: number; swim?: boolean; s?: number; salute?: number };
export type Plan = { ducks: (t: number) => DuckState[]; car: (t: number) => { pos: V3; yaw: number; bump: number } | null; holes: (t: number) => boolean; power: (t: number, light: LightName) => number };

// ---------------- painted textures ----------------
const sign = (lines: string[], bg: string, fg: string, w = 512, h = 256, font = "Georgia", border = true) => canvasTex(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); if (border) { g.strokeStyle = fg; g.lineWidth = Math.max(4, w / 80); g.strokeRect(w * 0.03, h * 0.05, w * 0.94, h * 0.9); }
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; const fs = Math.min(h / (lines.length + 0.6), w / (Math.max(...lines.map((l) => l.length)) * 0.62));
  g.font = `bold ${fs}px ${font}`; lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * fs * 1.05));
});
const KEVIN_OUTFIT: Outfit = { jacket: "#3a7ad8", pants: "#3a4a6a", boots: "#5a3420", hat: "hair", hair: "#c8642a", skin: "#f7f2ea", headStyle: "ref" };
const portrait = (g: CanvasRenderingContext2D, x: number, y: number, s: number, expr: "grin" | "shock" | "smile") => {
  const c = document.createElement("canvas"); c.width = 600; c.height = 1000; bodyFront(new Pen(c.getContext("2d")!), KEVIN_OUTFIT, { mode: "stand", expr, seed: 3 });
  g.drawImage(c, 150, 0, 300, 520, x, y, 300 * s, 520 * s);
};
const tvScreen = () => canvasTex(512, 320, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, "#2a5ab8"); gr.addColorStop(1, "#13306e"); g.fillStyle = gr; g.fillRect(0, 0, 512, 320);
  for (let i = 0; i < 12; i++) { g.fillStyle = `rgba(255,255,255,${0.04 + rnd(i) * 0.05})`; g.fillRect(rnd(i + 3) * 512, 0, 30 + rnd(i + 5) * 60, 230); }
  portrait(g, 300, 20, 0.62, "grin");
  g.fillStyle = "#d8222a"; g.fillRect(0, 196, 512, 54); g.fillStyle = "#fff"; g.font = "bold 34px Arial"; g.textAlign = "left"; g.fillText("BREAKING NEWS", 18, 236);
  g.fillStyle = "#ffffff"; g.fillRect(0, 250, 512, 70); g.fillStyle = "#13204a"; g.font = "bold 30px Arial"; g.fillText("KEVIN ELECTED MAYOR", 18, 296);
  g.fillStyle = "#f2c84a"; g.fillRect(420, 14, 80, 30); g.fillStyle = "#13204a"; g.font = "bold 20px Arial"; g.fillText("LIVE", 436, 36);
});
const debtList = () => canvasTex(512, 640, (g) => {
  g.fillStyle = "#f6f0e2"; g.fillRect(0, 0, 512, 640); g.fillStyle = "#1a1a2a"; g.textAlign = "center"; g.font = "bold 40px Georgia"; g.fillText("PEOPLE WHO", 256, 70); g.fillText("OWE THE TOWN", 256, 116);
  g.strokeStyle = "#1a1a2a"; g.lineWidth = 3; g.beginPath(); g.moveTo(40, 140); g.lineTo(472, 140); g.stroke();
  const names = ["M. PATEL ........ $12", "D. WONG ......... $40", "KEVIN ........... $3", "R. SILVA ........ $85", "T. BROWN ........ $9", "A. NOVAK ........ $27", "J. OKAFOR ....... $50"];
  g.textAlign = "left"; g.font = "30px Courier New"; names.forEach((n, i) => g.fillText(n, 46, 196 + i * 62));
  g.strokeStyle = "#d8222a"; g.lineWidth = 7; g.beginPath(); g.ellipse(150, 312, 120, 34, -0.05, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#d8222a"; g.font = "bold 34px Georgia"; g.fillText("MAYOR?!", 300, 316);
});
const clipboard = () => canvasTex(384, 512, (g) => {
  g.fillStyle = "#f6f0e2"; g.fillRect(0, 0, 384, 512); g.fillStyle = "#1a1a2a"; g.font = "bold 40px Georgia"; g.textAlign = "center"; g.fillText("PROBLEMS", 192, 70);
  g.textAlign = "left"; g.font = "bold 34px Arial"; ["1. NO POWER", "2. POTHOLES", "3. DUCKS"].forEach((l, i) => g.fillText(l, 36, 170 + i * 100));
  g.fillStyle = "#d8222a"; g.font = "bold 70px Arial"; g.fillText("!!!", 270, 460);
});
const resultsBoard = () => canvasTex(512, 384, (g) => {
  g.fillStyle = "#13204a"; g.fillRect(0, 0, 512, 384); g.strokeStyle = "#f2c84a"; g.lineWidth = 10; g.strokeRect(10, 10, 492, 364);
  g.fillStyle = "#f2c84a"; g.font = "bold 40px Arial"; g.textAlign = "center"; g.fillText("ELECTION RESULTS", 256, 70);
  g.fillStyle = "#ffffff"; g.font = "bold 50px Arial"; g.textAlign = "left"; g.fillText("KEVIN", 40, 170); g.fillText("???", 40, 290);
  g.fillStyle = "#4ad86a"; g.fillRect(200, 128, 270, 56); g.fillStyle = "#13204a"; g.fillText("98%", 300, 172);
  g.fillStyle = "#e84a4a"; g.fillRect(200, 250, 6, 52); g.fillStyle = "#ffffff"; g.fillText("2%", 220, 290);
});
const duckPoster = () => canvasTex(384, 512, (g) => {
  g.fillStyle = "#f2c84a"; g.fillRect(0, 0, 384, 512); g.fillStyle = "#13204a"; g.font = "bold 58px Arial"; g.textAlign = "center"; g.fillText("VOTE", 192, 70); g.fillText("QUACKERS", 192, 470);
  g.fillStyle = "#13204a"; g.beginPath(); g.ellipse(192, 330, 105, 80, 0, 0, Math.PI * 2); g.fill();      // suit body
  g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(192, 262); g.lineTo(160, 300); g.lineTo(224, 300); g.fill();
  g.fillStyle = "#d8222a"; g.beginPath(); g.moveTo(192, 270); g.lineTo(180, 330); g.lineTo(192, 350); g.lineTo(204, 330); g.fill();   // tie
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(192, 205, 70, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#1a1a2a"; g.lineWidth = 5; g.stroke();
  g.fillStyle = "#f08a20"; g.beginPath(); g.ellipse(250, 220, 44, 16, 0.1, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = "#1a1a2a"; g.beginPath(); g.arc(205, 190, 9, 0, Math.PI * 2); g.fill(); g.fillRect(160, 160, 40, 6);
});
const miniPoster = (txt: string, bg: string) => sign([txt], bg, "#13204a", 256, 160, "Arial");
const quilt = () => canvasTex(256, 256, (g) => { const cols = ["#e85a4a", "#f2c84a", "#4a9ad8", "#6ac86a", "#e88ac8", "#f29a3a"];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = cols[Math.floor(rnd(x * 9 + y) * 6)]; g.fillRect(x * 32, y * 32, 32, 32); g.strokeStyle = "rgba(60,30,30,0.35)"; g.strokeRect(x * 32 + 2, y * 32 + 2, 28, 28); } });
const sky = (stops: [number, string][], clouds = 0) => canvasTex(256, 1024, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 1024); for (const [o, c] of stops) gr.addColorStop(o, c); g.fillStyle = gr; g.fillRect(0, 0, 256, 1024);
  for (let i = 0; i < clouds; i++) { const x = rnd(i) * 256, y = 250 + rnd(i + 1) * 230, r = 14 + rnd(i + 2) * 22; g.fillStyle = "rgba(255,255,255,0.85)"; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + k * r * 0.7, y - (k % 2) * r * 0.4, r, 0, 7); g.fill(); } }
  for (let i = 0; i < (clouds ? 0 : 220); i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rnd(i * 3) * 0.6})`; g.fillRect(rnd(i * 3 + 1) * 256, rnd(i * 3 + 2) * 460, 1.4, 1.4); }
});
const asphalt = () => canvasTex(512, 512, (g) => { g.fillStyle = "#5a5a66"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${rnd(i) > 0.5 ? "255,255,255" : "0,0,0"},${0.05 + rnd(i + 1) * 0.08})`; g.fillRect(rnd(i + 2) * 512, rnd(i + 3) * 512, 2, 2); }
  g.fillStyle = "#f2e8b0"; for (let y = 0; y < 512; y += 128) g.fillRect(248, y + 20, 16, 70); });
const winLit = (seed: number) => canvasTex(128, 192, (g) => { const gr = g.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, "#fff0b8"); gr.addColorStop(1, "#ffb860"); g.fillStyle = gr; g.fillRect(0, 0, 128, 192);
  g.fillStyle = ["rgba(190,60,50,0.5)", "rgba(60,90,160,0.45)", "rgba(80,140,80,0.45)"][seed % 3]; g.fillRect(0, 0, 30, 192); g.fillRect(98, 0, 30, 192); });
const winDay = (seed: number) => canvasTex(128, 192, (g) => { const gr = g.createLinearGradient(0, 0, 128, 192); gr.addColorStop(0, "#cfe8ff"); gr.addColorStop(0.5, "#8ab8e0"); gr.addColorStop(1, "#5a88b8"); g.fillStyle = gr; g.fillRect(0, 0, 128, 192);
  g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.moveTo(20, 0); g.lineTo(60, 0); g.lineTo(10, 120); g.lineTo(0, 120); g.fill(); g.fillStyle = ["rgba(190,60,50,0.6)", "rgba(240,200,80,0.6)", "rgba(80,140,80,0.6)"][seed % 3]; g.fillRect(0, 0, 26, 192); g.fillRect(102, 0, 26, 192); });

// ---------------- ducks ----------------
class Duck {
  g = new THREE.Group(); body = new THREE.Group(); hat = new THREE.Group(); sign = new THREE.Group(); signs: THREE.Mesh[] = [];
  constructor(root: THREE.Object3D, kind: number, posters: THREE.Material[]) {
    const white = kind % 3 !== 2, bodyM = M(white ? 0xf8f6f0 : 0x8a6a4a, undefined, { rough: 0.8 }), headM = M(white ? 0xf8f6f0 : 0x2a7a4a, undefined, { rough: 0.6 }), orange = M(0xf09a20, undefined, { rough: 0.5 });
    const add = (geo: THREE.BufferGeometry, m: THREE.Material, p: V3, s: V3, r: V3 = [0, 0, 0], parent: THREE.Object3D = this.body) => { const o = new THREE.Mesh(geo, m); o.position.set(...p); o.scale.set(...s); o.rotation.set(...r); o.castShadow = true; parent.add(o); return o; };
    const sph = new THREE.SphereGeometry(1, 16, 12);
    add(sph, bodyM, [0, 0.16, 0], [0.16, 0.12, 0.22]);                        // body (faces +z)
    add(new THREE.ConeGeometry(1, 1, 10), bodyM, [0, 0.22, -0.2], [0.07, 0.12, 0.07], [-1.1, 0, 0]);   // tail
    add(sph, bodyM, [0.12, 0.17, -0.02], [0.05, 0.08, 0.15], [0, 0, 0.3]); add(sph, bodyM, [-0.12, 0.17, -0.02], [0.05, 0.08, 0.15], [0, 0, -0.3]);   // wings
    add(sph, headM, [0, 0.36, 0.15], [0.1, 0.1, 0.1]);                          // head
    add(sph, orange, [0, 0.34, 0.27], [0.055, 0.022, 0.07]);                    // beak
    for (const sx of [-1, 1]) { add(sph, M(0xffffff), [sx * 0.055, 0.39, 0.23], [0.032, 0.036, 0.02]); add(sph, M(0x14141c), [sx * 0.058, 0.39, 0.248], [0.016, 0.02, 0.01]); }
    for (const sx of [-1, 1]) { add(new THREE.BoxGeometry(1, 1, 1), orange, [sx * 0.06, 0.02, 0.05], [0.07, 0.015, 0.1]); add(new THREE.CylinderGeometry(1, 1, 1, 6), orange, [sx * 0.06, 0.06, 0.02], [0.012, 0.08, 0.012]); }
    // tiny security cap: navy crown + brim + gold badge
    const navy = M(0x1e2a5a, undefined, { rough: 0.6 });
    add(new THREE.CylinderGeometry(1, 0.9, 1, 16), navy, [0, 0.47, 0.14], [0.085, 0.06, 0.085], [0, 0, 0], this.hat);
    add(new THREE.BoxGeometry(1, 1, 1), M(0x14182a), [0, 0.44, 0.24], [0.13, 0.012, 0.07], [0.15, 0, 0], this.hat);
    add(sph, M(0xf2c84a, undefined, { rough: 0.3, metal: 0.8 }), [0, 0.47, 0.225], [0.022, 0.022, 0.008], [0, 0, 0], this.hat);
    this.body.add(this.hat);
    // tiny campaign poster on a stick
    add(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 6), M(0x8a5a32), [0.14, 0.42, 0.12], [1, 1, 1], [0, 0, 0], this.sign);
    posters.forEach((pm, i) => { const p = add(new THREE.PlaneGeometry(0.26, 0.17), pm, [0.14, 0.7, 0.125], [1, 1, 1], [0, 0, 0], this.sign); p.visible = i === kind % posters.length; this.signs.push(p); });
    this.body.add(this.sign);
    this.g.add(this.body); this.g.visible = false; root.add(this.g);
  }
  set(s: DuckState, t: number, i: number) {
    this.g.visible = true; this.g.position.set(...s.pos); this.g.rotation.y = s.yaw; this.g.scale.setScalar(s.s ?? 1);
    this.hat.visible = !!s.hat; this.sign.visible = !!s.sign;
    const b = s.bob ?? 0; this.body.position.y = s.swim ? -0.12 + Math.sin(t * 2 + i) * 0.012 : Math.abs(Math.sin(t * 9 * b + i)) * 0.035 * Math.min(1, b);
    this.body.rotation.z = Math.sin(t * 9 * b + i) * 0.14 * Math.min(1, b) + (s.swim ? Math.sin(t * 1.3 + i) * 0.05 : 0);
    this.body.rotation.x = (s.salute ?? 0) * -0.25;
  }
}

// ---------------- the world ----------------
export class World implements WorldLike<LightName> {
  static plan: Plan | null = null;
  root = new THREE.Group();
  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  sun = new THREE.DirectionalLight(0xffffff, 3);
  sky: THREE.Mesh; skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false });
  skies: Record<"day" | "night" | "dusk", THREE.Texture>;
  fog = new THREE.Fog(0xffffff, 60, 400);
  lamps: { l: THREE.PointLight; place: "bed" | "hall" | "town" }[] = [];
  winMats: { m: THREE.MeshBasicMaterial; lit: THREE.Texture; day: THREE.Texture }[] = [];
  glow: THREE.MeshStandardMaterial[] = [];
  ducks: Duck[] = []; car = new THREE.Group(); holes = new THREE.Group(); confetti: THREE.Points;
  places: Record<"bed" | "hall" | "town", THREE.Object3D[]> = { bed: [], hall: [], town: [] };

  constructor() {
    const R = this.root, B = new Batch(), k = new Kit(B, R);
    this.skies = { day: sky([[0, "#3a7ae8"], [0.42, "#8cc4f4"], [0.5, "#dceef8"], [1, "#dceef8"]], 14), night: sky([[0, "#0c1a60"], [0.4, "#1d3aa0"], [0.5, "#5a6ad0"], [1, "#2a3a90"]]), dusk: sky([[0, "#3a4ab0"], [0.4, "#e88ab0"], [0.5, "#ffc89a"], [1, "#d8a8b8"]], 6) };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), this.skyMat); this.sky.layers.set(NOINK); R.add(this.sky);
    const P: Pal = { wood: M(0xb07a48), woodD: M(0x6a4024), metal: M(0x8a9098, undefined, { rough: 0.4, metal: 0.6 }), white: M(0xf6f2ea), dark: M(0x2a2a34) };
    const mark = (place: "bed" | "hall" | "town", f: () => void) => { const n = R.children.length; f(); this.places[place].push(...R.children.slice(n)); };

    // ================= BEDROOM (5 x 4.5 x 2.8), window in the left wall =================
    mark("bed", () => k.at([BX, 0, 0], 0, () => {
      const W = 5, D = 4.5, H = 2.8, wp = TX.wallpaper("stripes", { base: "#f2d8a8", ink: "#e0b878", accent: "#c8905a" });
      const wm = (w: number, h: number) => M(0xffffff, rep(wp, w, h, 1.2, 1.2));
      k.floor(M(0xffffff, rep(TX.woodFloor({ color: "#a8703a", kind: "boards" }), W, D, 1.5, 1.5)), [0, 0, 0], W, D);
      k.panel(wm(W, H), [0, H / 2, -D / 2], W, H); k.panel(wm(D, H), [W / 2, H / 2, 0], D, H, -Math.PI / 2); k.panel(wm(W, H), [0, H / 2, D / 2], W, H, Math.PI);
      const wz = -0.3, ww = 1.4, y0 = 0.9, y1 = 2.2, a0 = D / 2 + wz - ww / 2, a1 = D / 2 - wz - ww / 2;
      k.mesh(new THREE.PlaneGeometry(a0, H), wm(a0, H), [-W / 2, H / 2, -D / 2 + a0 / 2], [0, Math.PI / 2, 0]); k.mesh(new THREE.PlaneGeometry(a1, H), wm(a1, H), [-W / 2, H / 2, D / 2 - a1 / 2], [0, Math.PI / 2, 0]);
      k.mesh(new THREE.PlaneGeometry(ww, y0), wm(ww, y0), [-W / 2, y0 / 2, wz], [0, Math.PI / 2, 0]); k.mesh(new THREE.PlaneGeometry(ww, H - y1), wm(ww, H - y1), [-W / 2, (H + y1) / 2, wz], [0, Math.PI / 2, 0]);
      k.at([-W / 2, (y0 + y1) / 2, wz], Math.PI / 2, () => windowFrame(k, ww, y1 - y0, M(0xf6f2ea), { cols: 2, rows: 2, curtains: M(0x4a8ad8) }));
      k.mesh(new THREE.PlaneGeometry(W, D), M(0xf6f2ea), [0, H, 0], [Math.PI / 2, 0, 0]);
      k.box(M(0xf6f2ea), [0, 0.05, -D / 2 + 0.02], [W, 0.1, 0.04]); k.box(M(0xf6f2ea), [W / 2 - 0.02, 0.05, 0], [0.04, 0.1, D]);
      k.floor(M(0xffffff, TX.carpet({ field: "#3a6ab0", border: "#e8b84a", seed: 4 })), [0.2, 0.006, -0.3], 2.6, 1.8);
      // bed (head against the back wall)
      k.at([0.9, 0, -1.15], 0, () => { k.box(P.woodD, [0, 0.2, 0], [1.5, 0.4, 2.2]); k.box(P.woodD, [0, 0.65, -1.1], [1.6, 1.3, 0.08]); k.box(P.wood, [0, 0.55, 1.1], [1.6, 0.5, 0.06]);
        k.box(M(0xf6f2ea), [0, 0.47, 0], [1.4, 0.14, 2.1]); k.box(M(0xffffff, quilt()), [0, 0.58, 0.25], [1.48, 0.1, 1.5]); k.box(M(0xf6f2ea), [0, 0.6, -0.8], [1.2, 0.14, 0.4]); });
      // nightstand + lamp + alarm clock, wardrobe, shelf, dresser + TV, posters, laundry, slippers, plant
      k.at([2.0, 0, -1.9], 0, () => { cabinet(k, P, M(0x8a5a32)); k.cyl(M(0xd8b040, undefined, { metal: 0.6, rough: 0.3 }), [0, 0.95, 0], 0.08, 0.3); k.add(CONE, M(0xf6e2b0, undefined, { emissive: 0xffd890, ei: 0.6 }), [0, 1.22, 0], [0.2, 0.22, 0.2]); });
      k.at([-1.9, 0, -1.9], 0, () => { k.box(M(0x8a5a32), [0, 1.0, 0], [0.9, 2.0, 0.5]); k.box(P.woodD, [0, 1.0, 0.26], [0.02, 1.9, 0.02]); for (const sx of [-0.1, 0.1]) k.box(M(0xd8b040), [sx, 1.0, 0.27], [0.03, 0.12, 0.03]); });
      k.at([W / 2 - 0.18, 0, 0.9], -Math.PI / 2, () => bookshelf(k, P, 1.0, 1.6, 0.3, 6));
      k.at([TV[0] - BX, 0, TV[2]], 2.2, () => { k.box(M(0x8a5a32), [0, 0.4, 0], [1.1, 0.8, 0.5]); for (let i = 0; i < 2; i++) k.box(P.woodD, [0, 0.25 + i * 0.3, 0.26], [1.0, 0.02, 0.02]);
        k.box(M(0x1a1a22), [0, 1.12, 0], [0.86, 0.56, 0.08]); k.box(M(0x1a1a22), [0, 0.86, 0], [0.2, 0.08, 0.2]); k.cyl(M(0x3a3a44), [0.3, 0.83, 0.1], 0.04, 0.06); });
      k.at([-0.4, 1.7, -D / 2 + 0.01], 0, () => picture(k, sign(["GO TEAM!"], "#d8322f", "#fff", 384, 192, "Arial"), 0.7, 0.35, 0x2a2a34));
      k.at([1.6, 1.9, -D / 2 + 0.01], 0, () => picture(k, sky([[0, "#4a8ad8"], [1, "#9ad0f0"]], 4), 0.45, 0.6, 0x6a4024));
      for (let i = 0; i < 5; i++) k.box(M([0xd8322f, 0x4a8ad8, 0xf2c84a, 0x6ac86a, 0xffffff][i]), [-0.6 + rnd(i) * 0.5, 0.04 + i * 0.03, 1.2 + rnd(i + 3) * 0.3], [0.5, 0.04, 0.4], [0, rnd(i + 7) * 2, 0]);   // laundry pile
      for (const sx of [0.1, 0.32]) k.box(M(0x4a8ad8), [sx, 0.04, -0.2], [0.14, 0.07, 0.3], [0, 0.3, 0]);                         // slippers
      k.at([2.1, 0, 1.8], 0, () => plant(k, 1.2, 0x3f9a3a, 0xd8622c, 3));
      k.cyl(M(0xf6f2ea, undefined, { emissive: 0xfff0c0, ei: 0.5 }), [0, H - 0.1, 0], 0.3, 0.12);
      const lamp = new THREE.PointLight(0xffd8a0, 0, 6, 1.6); lamp.position.set(BX + 2.0, 1.4, -1.8); R.add(lamp); this.lamps.push({ l: lamp, place: "bed" });
      // TV screen (separate so it can glow)
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.48), new THREE.MeshBasicMaterial({ map: tvScreen(), toneMapped: false }));
      scr.position.set(...TV); scr.rotation.y = 2.2; scr.translateZ(0.045); scr.layers.set(NOINK); R.add(scr);
      const tvl = new THREE.PointLight(0x7aa8ff, 1.2, 3, 2); tvl.position.copy(scr.position).add(new THREE.Vector3(0.5, 0, -0.3)); R.add(tvl);
      // sun shafts through the window
      this.shaft(R, [BX - 1.6, 1.3, wz], 1.2, 4.0, 0.95);
    }));

    // ================= TOWN HALL interior (12 x 16 x 6) =================
    mark("hall", () => k.at([HX, 0, 0], 0, () => {
      const W = 12, D = 16, H = 6;
      k.floor(M(0xffffff, rep(TX.tiles("checker", { a: "#f2ece0", b: "#8a3a3a" }), W, D, 1.6, 1.6), { rough: 0.35 }), [0, 0, -1], W, D);
      k.floor(M(0xffffff, rep(TX.carpet({ field: "#b8242a", border: "#e8b84a", seed: 6 }), 2.2, 14, 2.2, 3)), [0, 0.008, -0.5], 2.2, 14);
      const wallM = (w: number) => M(0xffffff, rep(TX.plaster({ color: "#e8d8b8", seed: 3 }), w, H, 3, 3));
      k.panel(wallM(W), [0, H / 2, -9], W, H); k.panel(wallM(D), [-W / 2, H / 2, -1], D, H, Math.PI / 2); k.panel(wallM(D), [W / 2, H / 2, -1], D, H, -Math.PI / 2); k.panel(wallM(W), [0, H / 2, 7], W, H, Math.PI);
      k.mesh(new THREE.PlaneGeometry(W, D), M(0xd8c8a8), [0, H, -1], [Math.PI / 2, 0, 0]);
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const z = 5 - i * 3.2; k.cyl(M(0xffffff, rep(TX.marble({ color: "#f2ece0" }), 1, 3, 1, 1)), [s * 4.4, H / 2, z], 0.32, H, [0, 0, 0], CYL);
        k.box(M(0xd8c8a8), [s * 4.4, 0.15, z], [0.9, 0.3, 0.9]); k.box(M(0xd8c8a8), [s * 4.4, H - 0.15, z], [0.9, 0.3, 0.9]);
        if (i < 4) { k.panel(M(0xffffff, TX.fleurFabric({ base: "#1e3a8a", gold: "#e8b84a" })), [s * 5.95, 3.4, z - 1.6], 1.0, 2.6, s > 0 ? -Math.PI / 2 : Math.PI / 2);
          k.at([s * 5.97, 2.0, z - 1.6], s > 0 ? -Math.PI / 2 : Math.PI / 2, () => picture(k, sign(["VOTE!"], "#f2c84a", "#13204a", 256, 256, "Arial"), 0.7, 0.7, 0x6a4024)); } }
      // dais + the giant mayor's chair (gold frame, red velvet, a crest on top)
      k.box(M(0xb8242a), [0, 0.2, -7.2], [5, 0.4, 3]); for (let i = 0; i < 2; i++) k.box(M(0xb8242a), [0, 0.1 + i * 0.1 - 0.05, -5.6 + i * 0.0], [3, 0.2 - i * 0.1, 0.5]);
      const gold = M(0xe0b040, undefined, { rough: 0.3, metal: 0.8 }), vel = M(0xffffff, TX.velvetTufted({ color: "#a01a2a" }));
      k.at([0, 0.4, -6.9], 0, () => { k.box(vel, [0, 0.6, 0.2], [2.4, 0.4, 1.6]); k.box(vel, [0, 2.6, -0.55], [2.2, 3.6, 0.3]); k.box(gold, [0, 2.6, -0.72], [2.6, 4.0, 0.12]);
        for (const sx of [-1, 1]) { k.box(gold, [sx * 1.25, 1.2, 0.2], [0.25, 0.9, 1.6]); k.cyl(gold, [sx * 1.3, 4.7, -0.65], 0.14, 0.5); k.add(SPH, gold, [sx * 1.3, 5.0, -0.65], [0.2, 0.2, 0.2]); }
        k.add(SPH, gold, [0, 4.85, -0.65], [0.45, 0.45, 0.12]); for (const sx of [-0.9, 0.9]) for (const sz of [-0.5, 0.9]) k.box(gold, [sx, 0.2, sz], [0.2, 0.4, 0.2]); });
      // committee desk with paperwork, ballot jar, gavel; official seats; flags; chandeliers; potted palms; posters
      k.at([-3.0, 0, -1.6], Math.PI / 2, () => { desk(k, P, 3.2, 1.0, 0.78, M(0x6a4024)); k.at([0, 0.78, 0], 0, () => { for (let i = 0; i < 4; i++) deskClutter(k, P, 11 + i);
        k.cyl(M(0xcfe8ff, undefined, { rough: 0.1 }), [1.1, 0.18, 0.1], 0.13, 0.36); for (let i = 0; i < 12; i++) k.box(M(0xf6f0e2), [1.1 + (rnd(i) - 0.5) * 0.15, 0.06 + i * 0.022, 0.1 + (rnd(i + 3) - 0.5) * 0.15], [0.08, 0.004, 0.06], [rnd(i) * 3, rnd(i + 1) * 3, 0]); }); });
      for (let i = 0; i < 3; i++) k.at([-4.0, 0, -2.6 + i * 1.0], -Math.PI / 2, () => chair(k, P, M(0x1e3a8a)));
      for (const sx of [-2.4, 2.4]) { k.cyl(M(0xd8b040, undefined, { metal: 0.7 }), [sx, 1.6, -8.5], 0.03, 3.2); k.box(M(0xffffff, sign(["★"], "#1e3a8a", "#f2c84a", 256, 160, "Arial", false)), [sx + 0.45, 2.7, -8.5], [0.9, 0.6, 0.02]); }
      for (const z of [3, -3]) { k.cyl(gold, [0, H - 0.6, z], 0.02, 1.2); k.add(SPH, M(0xfff0c0, undefined, { emissive: 0xffd890, ei: 2 }), [0, H - 1.3, z], [0.5, 0.25, 0.5]); for (let a = 0; a < 6; a++) k.add(SPH, M(0xfff0c0, undefined, { emissive: 0xffd890, ei: 2 }), [Math.cos(a) * 0.6, H - 1.4, z + Math.sin(a) * 0.6], [0.09, 0.12, 0.09]); }
      for (const [x, z] of [[-5.3, 6], [5.3, 6], [-5.3, -8.2], [5.3, -8.2]]) k.at([x, 0, z], 0, () => plant(k, 2.0, 0x3f8a3a, 0xd8b040, 4));
      k.at([3.0, 0, 2.5], -Math.PI / 2, () => { k.box(M(0x6a4024), [0, 1.1, 0], [1.6, 2.2, 0.08]); k.panel(M(0xffffff, sign(["ELECT A", "MAYOR!"], "#ffffff", "#b8242a", 384, 384, "Arial")), [0, 1.3, 0.05], 1.4, 1.4); });
      k.at([0, 3.8, -8.98], 0, () => picture(k, sign(["TOWN HALL"], "#1e3a8a", "#f2c84a", 512, 128), 3.4, 0.85, 0xe0b040));
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { k.at([s * 5.99, 4.6, 4 - i * 5], s > 0 ? -Math.PI / 2 : Math.PI / 2, () => k.panel(M(0xcfe8ff, undefined, { emissive: 0xfff2d0, ei: 0.9 }), [0, 0, 0], 1.2, 1.8)); }
      const cl = new THREE.PointLight(0xffd8a0, 0, 14, 1.4); cl.position.set(HX, 4.4, -1); R.add(cl); this.lamps.push({ l: cl, place: "hall" });
      this.shaft(R, [HX - 4.6, 3.6, 0], 1.4, 7, 0.9); this.shaft(R, [HX + 4.6, 3.6, -4], 1.4, 7, -0.9);
      // the debtors list on the desk (separate so it reads sharp)
      const lp = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), M(0xffffff, debtList())); lp.position.set(...LIST); lp.rotation.x = -Math.PI / 2; lp.rotation.z = 0.15; lp.position.y = 0.795; R.add(lp);
      const cb = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), M(0xffffff, clipboard())); cb.position.set(HX + 0.75, 1.15, -5.6); cb.rotation.set(-0.35, -0.3, 0); R.add(cb); this.clip = cb;
    }));

    // ================= TOWN (sunny) =================
    mark("town", () => k.at([TX0, 0, 0], 0, () => {
      const grass = M(0xffffff, rep(TX.grass({ flowers: true }), 300, 300, 2, 2));
      k.floor(grass, [0, -0.01, -40], 300, 300);
      k.floor(M(0xffffff, rep(asphalt(), 8, 72, 8, 8), { rough: 0.9 }), [0, 0.005, -12], 8, 72);
      for (const s of [-1, 1]) { k.box(M(0xffffff, rep(TX.flagstoneFloor({ color: "#d8d0c0" }), 2.2, 72, 1.1, 1.1)), [s * 5.1, 0.06, -12], [2.2, 0.12, 72]); k.box(M(0xc8c0b0), [s * 4.0, 0.07, -12], [0.15, 0.14, 72]); }
      // the square
      k.floor(M(0xffffff, rep(TX.cobblestones({ color: "#c8b8a0" }), 46, 34, 2, 2)), [0, 0.012, -64], 46, 34);
      const walls = ["#f2c8a0", "#a8d0e8", "#c8e0a8", "#f4f1ea", "#e8b0b0", "#d0c0e8", "#f2e0a0"], roofs = ["#8a3a3a", "#3a4a6a", "#5a4a3a", "#3a6a5a"], trim = M(0xfbfaf6);
      const shops: Record<number, string> = { 4: "BAKERY", 7: "BARBER", 9: "HARDWARE", 10: "CAFE" };
      for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const z = 14 - i * 9.5 + (s > 0 ? 4 : 0), seed = i * 2 + (s > 0 ? 1 : 0);
        const wm = new THREE.MeshBasicMaterial({ map: winDay(seed), toneMapped: false }); this.winMats.push({ m: wm, lit: winLit(seed), day: wm.map! });
        k.at([s * 11.5, 0, z], s > 0 ? -Math.PI / 2 : Math.PI / 2, () => {
          house(k, { w: 6.5 + rnd(seed) * 1.2, d: 7, h: 3.4 + (seed % 3 === 0 ? 2.6 : 0), wall: M(0xffffff, rep(TX.clapboardSiding({ color: walls[seed % 7], seed }), 7, 6, 1, 1)), trim,
            roof: M(0xffffff, rep(TX.roofShingles({ color: roofs[seed % 4], seed }), 4, 8)), door: M([0x8a3a2a, 0x2a4a6a, 0x3a6a3a][seed % 3]), win: wm, seed, porch: !shops[seed] });
          if (shops[seed]) { k.box(M(0xffffff, TX.awningStripes({ a: ["#d8322f", "#2a6ab0", "#3a8a4a", "#e88a2a"][seed % 4], b: "#f6f2ea" })), [0, 2.75, 4.0], [5.2, 0.08, 1.4], [0.35, 0, 0]);
            k.panel(M(0xffffff, sign([shops[seed]], "#2a3a6a", "#f2c84a", 512, 128)), [0, 3.35, 3.52], 3.0, 0.75);
            for (let j = 0; j < 3; j++) k.box(M([0xd8a040, 0xc85a3a, 0x6aa84a][j]), [-1.6 + j * 1.6, 0.5, 4.3], [0.5, 1.0, 0.5]); }
          fence(k, trim, [-3.4, 0, 5.8], [-1.0, 0, 5.8]); fence(k, trim, [1.0, 0, 5.8], [3.4, 0, 5.8]);
          for (let j = 0; j < 3; j++) k.add(SPH, M([0x3f8a3a, 0x5aa040, 0x2f7a3a][j]), [-3.2 + j * 3.1, 0.35, 6.4], [0.55, 0.4, 0.4]);       // hedges
        }); }
      // back rows + hills
      for (const s of [-1, 1]) for (let i = 0; i < (s > 0 ? 4 : 6); i++) { const seed = 20 + i * 2 + (s > 0 ? 1 : 0), wm = new THREE.MeshBasicMaterial({ map: winDay(seed), toneMapped: false }); this.winMats.push({ m: wm, lit: winLit(seed), day: wm.map! });
        k.at([s * (22 + rnd(seed) * 4), 0, 10 - i * 11], s > 0 ? -Math.PI / 2 : Math.PI / 2, () => house(k, { w: 6, d: 6, h: 3.6 + (seed % 2) * 2.4, wall: M(0xffffff, rep(TX.clapboardSiding({ color: walls[seed % 7], seed }), 7, 6, 1, 1)), trim, roof: M(0xffffff, rep(TX.roofShingles({ color: roofs[seed % 4], seed }), 4, 8)), door: M(0x6a3a2a), win: wm, seed, porch: false })); }
      for (let i = 0; i < 14; i++) k.add(SPH, M([0x6aa84a, 0x7ab85a, 0x5a983a][i % 3]), [-150 + i * 22, -6, -150 - rnd(i) * 40], [26 + rnd(i) * 16, 18 + rnd(i + 1) * 12, 20]);
      // round trees, lamp posts, benches, hydrants, mailboxes, bins, bikes along the sidewalks
      const tree = (x: number, z: number, sc: number) => { k.cyl(M(0x6a4428), [x, 1.0 * sc, z], 0.12 * sc, 2.0 * sc); for (let j = 0; j < 4; j++) k.add(SPH, M([0x4a9a3a, 0x5aa848, 0x3a8a32][j % 3]), [x + (rnd(j + x) - 0.5) * 0.9 * sc, (2.3 + j * 0.25) * sc, z + (rnd(j + z) - 0.5) * 0.9 * sc], [0.9 * sc, 0.8 * sc, 0.9 * sc]); };
      for (let z = 12; z > -46; z -= 7) for (const s of [-1, 1]) { const zz = z + (s > 0 ? 3.5 : 0); tree(s * 5.6, zz, 0.9 + rnd(z * s) * 0.3); }
      for (let z = 8; z > -46; z -= 14) for (const s of [-1, 1]) k.at([s * 4.4, 0, z + (s > 0 ? 7 : 0)], 0, () => { const p = lampPost(k, M(0x23232c), 3.6, this.glowMat()); if (this.lamps.length < 10) { const l = new THREE.PointLight(0xffc070, 0, 10, 1.5); l.position.set(TX0 + s * 4.4 + p[0], p[1], z + (s > 0 ? 7 : 0)); R.add(l); this.lamps.push({ l, place: "town" }); } });
      const bench = (x: number, z: number, r: number) => k.at([x, 0, z], r, () => { k.box(M(0x8a5a32), [0, 0.45, 0], [1.6, 0.06, 0.45]); k.box(M(0x8a5a32), [0, 0.75, -0.2], [1.6, 0.3, 0.05]); for (const sx of [-0.7, 0.7]) k.box(M(0x23232c), [sx, 0.22, 0], [0.06, 0.45, 0.4]); });
      for (const [x, z, r] of [[-5.2, 4, Math.PI / 2], [5.2, -6, -Math.PI / 2], [-5.2, -20, Math.PI / 2], [5.2, -30, -Math.PI / 2]]) bench(x, z, r);
      for (const [x, z] of [[-4.6, 9], [4.6, -2], [-4.6, -26], [4.6, -38]]) { k.cyl(M(0xd8322f), [x, 0.35, z], 0.13, 0.6); k.add(SPH, M(0xd8322f), [x, 0.68, z], [0.13, 0.1, 0.13]); }   // hydrants
      for (const [x, z] of [[-6.0, 1], [6.0, -14], [-6.0, -33]]) { k.cyl(M(0x2a2a30), [x, 0.6, z], 0.04, 1.2); k.box(M(0x2a5ab8), [x, 1.3, z], [0.35, 0.35, 0.5]); }       // mailboxes
      for (const [x, z] of [[4.7, 6], [-4.7, -12], [4.7, -24]]) k.cyl(M(0x3a6a4a), [x, 0.45, z], 0.3, 0.9);                                                         // bins
      // parked cars along the kerb
      const car = (g: THREE.Object3D | null, x: number, z: number, col: number, r = 0) => k.at([x, 0, z], r, () => { k.box(M(col, undefined, { rough: 0.35, metal: 0.4 }), [0, 0.55, 0], [1.6, 0.6, 3.4]); k.box(M(col, undefined, { rough: 0.35, metal: 0.4 }), [0, 1.05, -0.2], [1.4, 0.5, 1.8]);
        k.box(M(0x9ac8e8, undefined, { rough: 0.1 }), [0, 1.05, 0.72], [1.3, 0.42, 0.04]); for (const sx of [-0.78, 0.78]) for (const sz of [-1.1, 1.1]) k.cyl(M(0x1a1a20), [sx, 0.32, sz], 0.32, 0.22, [0, 0, Math.PI / 2]); void g; });
      car(null, -3.0, -18, 0xd8322f); car(null, 3.0, 8, 0x2a6ab0, Math.PI); car(null, -3.0, -34, 0xf2c84a);
      // ---- town hall facade on the square ----
      k.at([0, 0, -80], 0, () => {
        const stone = M(0xffffff, rep(TX.stoneBlocks({ color: "#ece2cc", seed: 7 }), 26, 12, 2, 2));
        k.box(stone, [0, 6, 0], [26, 12, 8]); k.box(M(0xd8ccb4), [0, 12.3, 0.2], [27, 0.6, 8.6]);
        for (let i = 0; i < 4; i++) k.box(M(0xd8ccb4), [0, 0.15 + i * 0.3, 5.0 - i * 0.4], [16 - i * 0.8, 0.3, 2.0]);
        for (let i = 0; i < 8; i++) k.cyl(M(0xffffff, rep(TX.marble({ color: "#f6f0e2" }), 1, 3, 1, 1)), [-7 + i * 2, 5.2, 5.2], 0.45, 8.6, [0, 0, 0], CYL);
        k.box(M(0xd8ccb4), [0, 9.8, 5.2], [17, 0.8, 1.4]); k.add(PRISM, M(0xece2cc), [0, 11.4, 5.2], [9.8, 1.2, 2.6], [Math.PI / 2, 0, 0]);
        k.panel(M(0xffffff, sign(["TOWN HALL"], "#ece2cc", "#5a4a3a", 512, 128)), [0, 9.8, 5.92], 6, 0.75);
        k.cyl(M(0xe0b040, undefined, { metal: 0.7 }), [0, 14.5, 0], 2.0, 3.2, [0, 0, 0], CYL); k.add(SPH, M(0x3a7a6a), [0, 16.2, 0], [2.2, 1.8, 2.2]);
        for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) k.panel(M(0x9ac8e8, undefined, { emissive: 0x9ac8e8, ei: 0.2 }), [-11 + i * 4.4 + (i > 2 ? 0 : 0), 3.4 + j * 4.2, 4.02], 1.3, 2.2);
        for (const sx of [-9.5, 9.5]) { k.cyl(M(0xd8d8d8, undefined, { metal: 0.7 }), [sx, 4, 7], 0.06, 8); k.box(M(0xffffff, sign(["★"], "#1e3a8a", "#f2c84a", 256, 160, "Arial", false)), [sx + 0.9, 7.2, 7], [1.8, 1.1, 0.02]); }
        for (let i = 0; i < 26; i++) { const u = i / 25; k.add(CONE, M([0xd8322f, 0xf6f2ea, 0x2a5ab8][i % 3]), [-8 + u * 16, 9.3 - Math.sin(u * Math.PI) * 0.9, 6.0], [0.18, 0.3, 0.05], [Math.PI, 0, 0]); }   // bunting
      });
      // podium with a banner, stage, results board, duck poster, flower beds, fountain, crowd barriers
      k.at([PODIUM[0] - TX0, 0, PODIUM[2]], 0, () => { k.box(M(0x6a4024), [0, 0.25, -1.2], [8, 0.5, 4]); k.box(M(0x6a4024), [0, 0.95, 0], [1.2, 1.3, 0.7]);
        k.panel(M(0xffffff, sign(["MAYOR", "KEVIN"], "#1e3a8a", "#f2c84a", 384, 256, "Arial")), [0, 1.0, 0.36], 1.0, 0.65); k.cyl(M(0x23232c), [0, 1.75, 0.2], 0.015, 0.4, [0.5, 0, 0]);
        k.panel(M(0xffffff, sign(["NEW SECURITY", "DEPARTMENT"], "#f6f2ea", "#1e3a8a", 768, 256, "Arial")), [0, 3.4, -3.1], 6.5, 2.1);
        for (const sx of [-3.4, 3.4]) k.cyl(M(0x23232c), [sx, 2.0, -3.15], 0.06, 4.0); });
      k.at([BOARD[0] - TX0, 0, BOARD[2]], -0.3, () => { k.box(M(0x23232c), [0, 1.0, -0.1], [0.2, 2.0, 0.2]); k.box(M(0x23232c), [0, BOARD[1], -0.06], [3.4, 2.6, 0.1]); k.panel(M(0xffffff, resultsBoard(), { emissive: 0xffffff, ei: 0.25 }), [0, BOARD[1], 0.0], 3.2, 2.4); });
      k.at([POSTER[0] - TX0, 0, POSTER[2]], 0.5, () => { for (const sx of [-0.7, 0.7]) k.box(M(0x6a4024), [sx, 1.2, -0.05], [0.08, 2.4, 0.08]); k.panel(M(0xffffff, duckPoster()), [0, POSTER[1], 0], 1.5, 2.0); });
      for (const [x, z] of [[-14, -56], [14, -70], [-16, -72]]) { k.cyl(M(0xb8a888), [x, 0.3, z], 1.6, 0.6); for (let j = 0; j < 14; j++) k.add(SPH, M([0xe85a8a, 0xf2c84a, 0xffffff, 0xd8322f][j % 4]), [x + Math.cos(j) * (0.4 + rnd(j) * 1.0), 0.75, z + Math.sin(j) * (0.4 + rnd(j + 1) * 1.0)], [0.16, 0.16, 0.16]); }
      k.at([0, 0, -50], 0, () => { k.cyl(M(0xd8ccb4), [0, 0.35, 0], 2.4, 0.7, [0, 0, 0], CYL); k.cyl(M(0x6ab8e8, undefined, { rough: 0.15 }), [0, 0.66, 0], 2.2, 0.05, [0, 0, 0], CYL); k.cyl(M(0xd8ccb4), [0, 1.3, 0], 0.3, 1.6); k.cyl(M(0xd8ccb4), [0, 2.1, 0], 1.0, 0.2); });
      for (let i = 0; i < 10; i++) { const x = -4.5 + i, z = -58.5; k.box(M(0x8a9098, undefined, { metal: 0.6, rough: 0.4 }), [x, 0.5, z], [0.9, 0.05, 0.05]); k.box(M(0x8a9098, undefined, { metal: 0.6 }), [x - 0.45, 0.5, z], [0.04, 1.0, 0.04]); }
      // ---- the public pool park (right of the square) ----
      k.at([POOL[0] - TX0, 0, POOL[2]], 0, () => {
        k.floor(M(0xffffff, rep(TX.tiles("checker", { a: "#f2f6fa", b: "#d8e6f0" }), 16, 12, 1, 1)), [0, 0.03, 0], 16, 12);
        k.box(M(0xffffff, rep(TX.tiles("checker", { a: "#3a8ad8", b: "#2a7ac8" }), 10, 6, 0.5, 0.5)), [0, -0.6, 0], [10, 0.1, 6]);
        for (const [x, z, w, d] of [[0, 3.05, 10.2, 0.1], [0, -3.05, 10.2, 0.1], [5.05, 0, 0.1, 6], [-5.05, 0, 0.1, 6]]) k.box(M(0xf6f2ea), [x, 0.05, z], [w, 0.12, d]);
        k.box(M(0xf6f2ea), [-4.4, 0.4, -3.5], [0.5, 0.8, 1.2]); k.box(M(0x2a6ab0), [-4.4, 0.84, -2.4], [0.5, 0.06, 2.2]);   // diving board
        for (const sx of [-2, 2]) k.beam(M(0xd8d8d8, undefined, { metal: 0.7 }), [sx, 0.9, 3.05], [sx, -0.4, 2.8], 0.04);   // ladder rails
        for (let i = 0; i < 4; i++) { const x = -5 + i * 3.3; k.box(M(0xf6f2ea), [x, 0.3, -5.0], [0.7, 0.08, 1.8], [0, 0, 0]); k.box(M(0xf6f2ea), [x, 0.55, -5.75], [0.7, 0.5, 0.08], [0.6, 0, 0]);
          k.cyl(M(0xd8d8d8), [x + 1.2, 1.2, -5.2], 0.03, 2.4); k.add(CONE, M([0xd8322f, 0xf2c84a, 0x2a6ab0, 0x3a8a4a][i]), [x + 1.2, 2.5, -5.2], [1.1, 0.4, 1.1]); }
        for (let i = 0; i < 11; i++) { const x = -8 + i * 1.6; k.box(M(0xf6f2ea), [x, 0.6, 6.2], [0.06, 1.2, 0.06]); } k.box(M(0xf6f2ea), [0, 1.1, 6.2], [16, 0.06, 0.06]);
        k.panel(M(0xffffff, sign(["PUBLIC POOL"], "#2a6ab0", "#ffffff", 512, 128, "Arial")), [0, 2.0, 6.3], 3.6, 0.9);
        for (const sx of [-7.4, 7.4]) for (const sz of [-5, 4]) { k.cyl(M(0x8a6a4a), [sx, 1.6, sz], 0.12, 3.2); for (let j = 0; j < 5; j++) k.add(CONE, M(0x3a9a4a), [sx + Math.cos(j * 1.26) * 0.8, 3.1, sz + Math.sin(j * 1.26) * 0.8], [0.3, 1.4, 0.15], [Math.cos(j * 1.26) * 1.2, 0, Math.sin(j * 1.26) * -1.2]); }
        for (let i = 0; i < 3; i++) { k.cyl(M([0xf2c84a, 0xe85a8a, 0x6ac8e8][i]), [-2.5 + i * 2.6, -0.02, -1 + i], 0.45, 0.15, [0, 0, 0], CYL); }   // inflatable rings
      });
      const water = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshStandardMaterial({ map: rep(TX.water({ color: "#3a9ae0" }), 10, 6, 3, 3), transparent: true, opacity: 0.88, roughness: 0.12, metalness: 0.1 }));
      water.rotation.x = -Math.PI / 2; water.position.set(POOL[0], -0.02, POOL[2]); R.add(water); this.water = water;
      // potholes (shown until the roads are repaired)
      for (let i = 0; i < 9; i++) { const h = new THREE.Mesh(new THREE.CircleGeometry(0.35 + rnd(i) * 0.35, 12), M(0x2a2a30)); h.rotation.x = -Math.PI / 2; h.position.set(TX0 + (rnd(i + 30) - 0.5) * 6, 0.012, -2 - i * 1.3 - rnd(i + 40)); h.scale.set(1, 1 + rnd(i + 50) * 0.5, 1); this.holes.add(h);
        const rim = new THREE.Mesh(new THREE.RingGeometry(1, 1.15, 12), M(0x8a8a90)); rim.rotation.x = -Math.PI / 2; rim.position.copy(h.position).setY(0.013); rim.scale.setScalar(0.35 + rnd(i) * 0.35); this.holes.add(rim); }
      R.add(this.holes);
    }));
    // the moving car (pothole scene + smooth road scene)
    { const col = M(0x3aa8a0, undefined, { rough: 0.3, metal: 0.4 }), body = new THREE.Group();
      const b = (g: THREE.BufferGeometry, m: THREE.Material, p: V3, s: V3) => { const o = new THREE.Mesh(g, m); o.position.set(...p); o.scale.set(...s); o.castShadow = true; body.add(o); return o; };
      const box = new THREE.BoxGeometry(1, 1, 1); b(box, col, [0, 0.55, 0], [1.6, 0.6, 3.4]); b(box, col, [0, 1.05, -0.2], [1.4, 0.5, 1.8]); b(box, M(0x9ac8e8, undefined, { rough: 0.1 }), [0, 1.05, 0.72], [1.3, 0.42, 0.04]);
      for (const sx of [-0.55, 0.55]) b(new THREE.SphereGeometry(1, 10, 8), M(0xfff6d0, undefined, { emissive: 0xfff0b0, ei: 1 }), [sx, 0.6, 1.71], [0.16, 0.12, 0.04]);
      for (const sx of [-0.78, 0.78]) for (const sz of [-1.1, 1.1]) { const w = b(new THREE.CylinderGeometry(1, 1, 1, 16), M(0x1a1a20), [sx, 0.32, sz], [0.32, 0.22, 0.32]); w.rotation.z = Math.PI / 2; }
      this.car.add(body); this.car.visible = false; R.add(this.car); }
    // ducks
    const posters = [miniPoster("VOTE DUCK", "#f2c84a"), miniPoster("QUACK!", "#ffffff"), miniPoster("DUCKS 4 MAYOR", "#a8e0ff")].map((t) => M(0xffffff, t));
    for (let i = 0; i < 40; i++) this.ducks.push(new Duck(R, i, posters));
    // confetti for the celebration
    const N = 900, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), pal = [[0.95, 0.3, 0.3], [0.95, 0.8, 0.3], [0.3, 0.6, 0.95], [0.4, 0.85, 0.45], [1, 1, 1]];
    for (let i = 0; i < N; i++) { const c = pal[i % 5]; col.set(c, i * 3); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); cg.setAttribute("color", new THREE.BufferAttribute(col, 3));
    this.confetti = new THREE.Points(cg, new THREE.PointsMaterial({ size: 0.09, vertexColors: true, depthWrite: false, fog: false })); this.confetti.layers.set(NOINK); this.confetti.frustumCulled = false; this.confetti.visible = false; R.add(this.confetti);

    const g = new THREE.Group(); B.build(g); R.add(g);
    R.traverse((o) => { if ((o as THREE.Mesh).isMesh && o !== this.sky && !o.layers.isEnabled(NOINK)) { o.castShadow = true; o.receiveShadow = true; } });
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.02; this.sun.shadow.radius = 3;
    R.add(this.hemi, this.sun, this.sun.target);
  }
  clip: THREE.Mesh | null = null; water: THREE.Mesh | null = null;
  private glowMat() { const m = M(0xffe8a0, undefined, { emissive: 0xffd070, ei: 0.2 }).clone() as THREE.MeshStandardMaterial; this.glow.push(m); return m; }
  private shaft(R: THREE.Object3D, p: V3, w: number, h: number, tilt: number) {
    const t = canvasTex(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,236,170,0.38)"); gr.addColorStop(1, "rgba(255,236,170,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
      const hg = g.createLinearGradient(0, 0, 64, 0); hg.addColorStop(0, "rgba(0,0,0,1)"); hg.addColorStop(0.2, "rgba(0,0,0,0)"); hg.addColorStop(0.8, "rgba(0,0,0,0)"); hg.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = hg; g.fillRect(0, 0, 64, 256); });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
    s.position.set(...p); s.rotation.set(0, Math.PI / 2, tilt); s.layers.set(NOINK); R.add(s);
  }

  set(o: { light: LightName; t: number; cam: V3; look: V3; shadowR?: number }) {
    const L = o.light, t = o.t, plan = World.plan;
    const place = L === "morning" ? "bed" : L === "hall" ? "hall" : "town";
    for (const [p, objs] of Object.entries(this.places)) for (const x of objs) x.visible = p === place;
    this.sky.position.set(...o.cam);
    this.skyMat.map = L === "dark" || L === "night" ? this.skies.night : this.skies.day; this.skyMat.needsUpdate = true;
    const P = {
      morning: { hs: 0xfff2e0, hg: 0xb8a088, hi: 1.9, sc: 0xffd890, si: 5.0, sd: [-0.8, 0.45, 0.3], fog: 0xf0e0c8, fn: 40, ff: 300 },
      hall: { hs: 0xfff2e0, hg: 0xc8a888, hi: 1.9, sc: 0xffe0a8, si: 3.6, sd: [-0.7, 0.6, 0.35], fog: 0xe8d8c0, fn: 40, ff: 300 },
      day: { hs: 0xe8f2ff, hg: 0xa8b890, hi: 2.0, sc: 0xfff0d0, si: 3.8, sd: [0.45, 0.75, 0.5], fog: 0xd8e8f8, fn: 45, ff: 230 },
      dark: { hs: 0x5a6ab0, hg: 0x2a3060, hi: 1.25, sc: 0x9ab0ff, si: 0.9, sd: [0.3, 0.8, 0.5], fog: 0x2a3a80, fn: 25, ff: 150 },
      night: { hs: 0x7a8ae8, hg: 0x3a4a90, hi: 1.6, sc: 0xa8b8ff, si: 1.1, sd: [0.3, 0.8, 0.5], fog: 0x3a4a9a, fn: 30, ff: 170 },
    }[L];
    this.hemi.color.set(P.hs); this.hemi.groundColor.set(P.hg); this.hemi.intensity = P.hi; this.sun.color.set(P.sc); this.sun.intensity = P.si;
    const sd = new THREE.Vector3(...(P.sd as V3)).normalize(), r = o.shadowR ?? 12;
    this.sun.target.position.set(...o.look); this.sun.position.copy(this.sun.target.position).addScaledVector(sd, 60); this.sun.target.updateMatrixWorld();
    const sc = this.sun.shadow.camera; sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 1; sc.far = 140; sc.updateProjectionMatrix();
    this.fog.color.set(P.fog); this.fog.near = P.fn; this.fog.far = P.ff;
    // power: 0 = blackout (dark windows, lamps off), 1 = everything lit
    const pw = plan ? plan.power(t, L) : 1, nightish = L === "dark" || L === "night";
    for (const w of this.winMats) { const tex = nightish ? w.lit : w.day; if (w.m.map !== tex) { w.m.map = tex; w.m.needsUpdate = true; } w.m.color.setScalar(nightish ? 0.06 + 0.94 * pw : 1); }
    for (const m of this.glow) m.emissiveIntensity = nightish ? 3 * pw : 0.2;
    for (const { l, place: pl } of this.lamps) l.intensity = pl !== place ? 0 : pl === "bed" ? 1.2 : pl === "hall" ? 6 : nightish ? 12 * pw : 0;
    // ducks, car, potholes, confetti, water
    const ds = plan ? plan.ducks(t) : [];
    this.ducks.forEach((d, i) => { if (i < ds.length && place === "town") d.set(ds[i], t, i); else d.g.visible = false; });
    const c = plan ? plan.car(t) : null; this.car.visible = !!c && place === "town";
    if (c) { this.car.position.set(...c.pos); this.car.rotation.set(0, c.yaw, 0); this.car.children[0].position.y = Math.abs(Math.sin(c.bump * Math.PI)) * 0.22; this.car.children[0].rotation.x = Math.sin(c.bump * Math.PI * 2) * 0.08; }
    this.holes.visible = place === "town" && (plan ? plan.holes(t) : true);
    const conf = place === "town" && t > 38.9 && t < 42.2; this.confetti.visible = conf;
    if (conf) { const a = this.confetti.geometry.getAttribute("position") as THREE.BufferAttribute, arr = a.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) { arr[i * 3] = PODIUM[0] + (rnd(i) - 0.5) * 16 + Math.sin(t * 2 + i) * 0.3; arr[i * 3 + 1] = (((rnd(i + 1e3) * 9 - (t - 38.9) * (0.8 + rnd(i + 2e3))) % 9) + 9) % 9; arr[i * 3 + 2] = PODIUM[2] + 6 - rnd(i + 3e3) * 12; } a.needsUpdate = true; }
    if (this.water) { const m = (this.water.material as THREE.MeshStandardMaterial).map!; m.offset.set(Math.sin(t * 0.3) * 0.05, t * 0.02); }
  }
}
