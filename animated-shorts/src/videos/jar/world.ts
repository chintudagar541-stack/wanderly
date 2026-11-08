// "The Jar That Could Predict a War": a medieval kingdom in one toon-shaded world.
//   Castle (origin): courtyard (x,z in -18..18), curtain walls + 4 towers, gatehouse at z = +18, the keep at z < -18 with
//     a balcony over the courtyard; courtyard clutter (well, carts, barrels, crates, hay, racks, dummies, trees, banners).
//   Landscape: river, village, fields, forests, mountain ring, road to the border.
//   Border pass (around x = -260, z = -260): cliffs, border wall + gate + watchtower. Enemy camp beyond (z ~ -420).
//   Throne room interior (x = 400): pillars, carpet, dais + throne, braziers, torches, stained glass, the jar.
// Fire, torches, windows-at-night and dust are Points (Flames from the Diwali world). The jar cracks in stages and
// shatters into shards that fly and settle deterministically from the shatter time.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { NOINK } from "../bridge/ink";
import { Flames } from "../diwali/world";

export type LightName = "golden" | "day" | "night" | "storm" | "dawn" | "interior" | "interiorNight";

const rnd = (i: number) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
};
const ramp = (() => { const t = new THREE.DataTexture(new Uint8Array([95, 180, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const MATS = new Map<string, THREE.MeshToonMaterial>();
export const toon = (color: THREE.ColorRepresentation, map?: THREE.Texture) => {
  const key = map ? "" : String(color);
  if (key && MATS.has(key)) return MATS.get(key)!;
  const m = new THREE.MeshToonMaterial({ color, map: map ?? null, gradientMap: ramp });
  if (key) MATS.set(key, m);
  return m;
};
class Batch {
  private lists = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geo: THREE.BufferGeometry, m: THREE.Material, pos: [number, number, number], rot: [number, number, number] = [0, 0, 0], scale: [number, number, number] = [1, 1, 1]) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scale)));
    const l = this.lists.get(m); if (l) l.push(g); else this.lists.set(m, [g]);
  }
  build(parent: THREE.Object3D) { for (const [m, gs] of this.lists) { const g = mergeGeometries(gs, false); if (g) parent.add(new THREE.Mesh(g, m)); } }
}
const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 14), CONE = new THREE.ConeGeometry(1, 1, 14), ICO = new THREE.IcosahedronGeometry(1, 1);
const SPH = new THREE.SphereGeometry(1, 12, 8), PRISM = new THREE.CylinderGeometry(1, 1, 1, 3), CONE4 = new THREE.ConeGeometry(1, 1, 4);

// ---------------- painted textures ----------------
const stoneWall = (base: string, line: string) => canvasTex(256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < 256; x += 64) {
    const v = rnd(x * 3 + y); g.fillStyle = `rgba(${v < 0.5 ? "0,0,0" : "255,255,255"},${0.04 + v * 0.06})`; g.fillRect(x + 2, y + 2, 60, 28);
    g.strokeStyle = line; g.lineWidth = 3; g.strokeRect(x + 1, y + 1, 62, 30);
  }
}, [4, 2]);
const cobble = () => canvasTex(256, 256, (g) => {
  g.fillStyle = "#8a8378"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 140; i++) { const x = rnd(i) * 256, y = rnd(i + 9) * 256, r = 9 + rnd(i + 4) * 8; g.fillStyle = ["#9a9386", "#7d766c", "#a39b8d"][i % 3]; g.beginPath(); g.ellipse(x, y, r, r * 0.8, rnd(i) * 3, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#5a554e"; g.lineWidth = 2; g.stroke(); }
}, [8, 8]);
const grassTex = () => canvasTex(256, 256, (g) => {
  g.fillStyle = "#6f9a45"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) { g.fillStyle = rnd(i) < 0.5 ? "rgba(60,95,35,0.35)" : "rgba(150,185,85,0.3)"; g.fillRect(rnd(i + 1) * 256, rnd(i + 2) * 256, 2, 6); }
}, [120, 120]);
const floorTiles = () => canvasTex(256, 256, (g) => {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? "#c9bca4" : "#8f8270"; g.fillRect(i * 64, j * 64, 64, 64); }
  g.strokeStyle = "#5a5045"; g.lineWidth = 3; for (let k = 0; k <= 256; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 256); g.moveTo(0, k); g.lineTo(256, k); g.stroke(); }
}, [6, 10]);
const carpetTex = () => canvasTex(64, 256, (g) => {
  g.fillStyle = "#9a1f2a"; g.fillRect(0, 0, 64, 256); g.fillStyle = "#e8b84a"; g.fillRect(4, 0, 5, 256); g.fillRect(55, 0, 5, 256);
  for (let y = 16; y < 256; y += 48) { g.beginPath(); g.moveTo(32, y); g.lineTo(44, y + 12); g.lineTo(32, y + 24); g.lineTo(20, y + 12); g.closePath(); g.fill(); }
}, [1, 6]);
const bannerTex = (field: string, charge: string, kind: number) => canvasTex(128, 256, (g) => {
  g.fillStyle = field; g.fillRect(0, 0, 128, 256);
  g.fillStyle = "#e8b84a"; g.fillRect(0, 0, 128, 14);
  g.beginPath(); g.moveTo(0, 220); g.lineTo(64, 256); g.lineTo(128, 220); g.lineTo(128, 256); g.lineTo(0, 256); g.closePath(); g.fillStyle = "rgba(0,0,0,0)";
  g.fillStyle = charge;
  if (kind === 0) { g.beginPath(); g.moveTo(64, 50); g.lineTo(96, 120); g.lineTo(64, 190); g.lineTo(32, 120); g.closePath(); g.fill(); }        // lozenge
  else if (kind === 1) { g.beginPath(); g.arc(64, 115, 36, 0, Math.PI * 2); g.fill(); g.fillStyle = field; g.beginPath(); g.arc(78, 105, 30, 0, Math.PI * 2); g.fill(); } // crescent
  else { for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(34 + k * 30, 80); g.lineTo(46 + k * 30, 80); g.lineTo(40 + k * 30, 64); g.closePath(); g.fill(); } g.fillRect(30, 80, 70, 70); } // crown-ish
});
const stained = () => canvasTex(128, 256, (g) => {
  const cols = ["#3f6fd0", "#d1202f", "#f2c14e", "#2e9a5a", "#8a4ad0"];
  for (let y = 0; y < 256; y += 32) for (let x = 0; x < 128; x += 32) { g.fillStyle = cols[(x / 32 + y / 32) % 5]; g.fillRect(x, y, 32, 32); }
  g.strokeStyle = "#1a1418"; g.lineWidth = 5; for (let k = 0; k <= 256; k += 32) { g.beginPath(); g.moveTo(0, k); g.lineTo(128, k); g.stroke(); } for (let k = 0; k <= 128; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 256); g.stroke(); }
});
const mapTex = () => canvasTex(256, 192, (g) => {
  g.fillStyle = "#e8d6a8"; g.fillRect(0, 0, 256, 192);
  g.strokeStyle = "#6fa0c8"; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 120); g.bezierCurveTo(80, 90, 140, 160, 256, 110); g.stroke();
  g.fillStyle = "#8a7a5a"; for (const [x, y] of [[40, 40], [70, 30], [200, 40], [220, 60]]) { g.beginPath(); g.moveTo(x, y + 16); g.lineTo(x + 12, y); g.lineTo(x + 24, y + 16); g.fill(); }
  g.fillStyle = "#3f6fd0"; g.fillRect(118, 70, 20, 20); g.fillStyle = "#d1202f"; for (const [x, y] of [[40, 150], [60, 160], [200, 150]]) g.fillRect(x, y, 10, 10);
  g.strokeStyle = "#3a2a1a"; g.lineWidth = 4; g.strokeRect(2, 2, 252, 188);
});
const windowTex = (lit: boolean) => canvasTex(64, 128, (g) => {
  g.fillStyle = lit ? "#ffcf7a" : "#232838"; g.beginPath(); g.moveTo(8, 128); g.lineTo(8, 40); g.quadraticCurveTo(32, 0, 56, 40); g.lineTo(56, 128); g.closePath(); g.fill();
  g.strokeStyle = "#2a2018"; g.lineWidth = 5; g.stroke(); g.beginPath(); g.moveTo(32, 18); g.lineTo(32, 128); g.moveTo(8, 72); g.lineTo(56, 72); g.stroke();
});
const skyTex = (top: string, mid: string, hor: string, stars = 0) => canvasTex(16, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(0.42, mid); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor);
  g.fillStyle = gr; g.fillRect(0, 0, 16, 512);
  for (let i = 0; i < stars; i++) { g.fillStyle = `rgba(255,250,230,${0.3 + rnd(i) * 0.6})`; g.fillRect(rnd(i + 5) * 16, rnd(i + 9) * 210, 1, 1); }
});
const jarTex = (stage: number) => canvasTex(512, 256, (g) => {
  // dark bronze-teal glaze with gold bands, a frieze of running warriors and glyphs
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#1f4a52"); gr.addColorStop(0.5, "#2c6a6e"); gr.addColorStop(1, "#173a40");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#e8b84a"; for (const y of [40, 70, 180, 205]) g.fillRect(0, y, 512, 7);
  g.fillStyle = "#0e1e22"; for (let x = 10; x < 512; x += 64) { // little warriors with spears
    g.beginPath(); g.arc(x + 18, 98, 8, 0, Math.PI * 2); g.fill(); g.fillRect(x + 12, 106, 12, 30); g.fillRect(x + 8, 136, 6, 26); g.fillRect(x + 22, 136, 6, 26);
    g.fillRect(x + 30, 84, 4, 70); g.beginPath(); g.moveTo(x + 26, 86); g.lineTo(x + 32, 70); g.lineTo(x + 38, 86); g.fill();
    g.beginPath(); g.arc(x + 8, 118, 11, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = "#e8b84a"; for (let x = 6; x < 512; x += 24) { g.beginPath(); g.moveTo(x, 20); g.lineTo(x + 8, 10); g.lineTo(x + 16, 20); g.lineTo(x + 8, 30); g.closePath(); g.fill(); }
  for (let x = 12; x < 512; x += 30) g.fillRect(x, 226, 10, 10);
  // cracks: each stage adds a branching crack
  const crack = (x0: number, y0: number, seed: number, len: number) => {
    g.strokeStyle = "#0a0806"; g.lineCap = "round";
    let x = x0, y = y0;
    for (let i = 0; i < len; i++) {
      const nx = x + (rnd(seed + i) - 0.5) * 34, ny = y + 10 + rnd(seed + i * 3) * 14;
      g.lineWidth = 5 - (i / len) * 3.5; g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke();
      if (i % 3 === 1) { g.lineWidth = 2; g.beginPath(); g.moveTo(nx, ny); g.lineTo(nx + (rnd(seed + i * 7) - 0.5) * 50, ny + 18); g.stroke(); }
      x = nx; y = ny;
    }
    g.strokeStyle = "rgba(120,255,230,0.55)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x0 + 1, y0); g.lineTo(x0 + 3, y0 + 12); g.stroke();
  };
  if (stage >= 1) crack(250, 0, 11, 9);
  if (stage >= 2) crack(330, 30, 33, 11);
  if (stage >= 3) { crack(140, 10, 57, 13); crack(420, 60, 71, 10); }
  if (stage >= 4) { crack(60, 80, 91, 9); crack(200, 120, 113, 8); crack(470, 20, 131, 12); crack(300, 150, 151, 7); }
});

// ---------------- the jar ----------------
const JAR_PROFILE = [[0.0, 0], [0.17, 0], [0.2, 0.05], [0.33, 0.2], [0.42, 0.42], [0.4, 0.6], [0.31, 0.78], [0.17, 0.92], [0.15, 0.98], [0.21, 1.04], [0.2, 1.08], [0.12, 1.06]].map(([r, y]) => new THREE.Vector2(r, y));
export class Jar {
  group = new THREE.Group(); body: THREE.Mesh; texs: THREE.Texture[]; mat: THREE.MeshToonMaterial;
  shards: THREE.Mesh[] = []; glow: Flames;
  constructor(parent: THREE.Object3D, pos: [number, number, number], scale = 1) {
    this.texs = [0, 1, 2, 3, 4].map(jarTex);
    this.mat = new THREE.MeshToonMaterial({ map: this.texs[0], gradientMap: ramp });
    this.body = new THREE.Mesh(new THREE.LatheGeometry(JAR_PROFILE, 40), this.mat);
    this.group.add(this.body);
    this.group.position.set(...pos); this.group.scale.setScalar(scale); parent.add(this.group);
    const sm = new THREE.MeshToonMaterial({ map: this.texs[4], gradientMap: ramp, side: THREE.DoubleSide });
    for (let i = 0; i < 46; i++) {
      const a = rnd(i) * Math.PI * 2, y = 0.1 + rnd(i + 1) * 0.9, w = 0.12 + rnd(i + 2) * 0.12;
      const geo = new THREE.BufferGeometry();
      const tri = new Float32Array([-w, -w * 0.7, 0, w, -w * 0.5, 0, (rnd(i + 3) - 0.5) * w, w, 0]);
      geo.setAttribute("position", new THREE.BufferAttribute(tri, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([rnd(i) * 0.8, 0.2, rnd(i) * 0.8 + 0.1, 0.25, rnd(i) * 0.8 + 0.05, 0.4]), 2)); geo.computeVertexNormals();
      const s = new THREE.Mesh(geo, sm); s.userData = { a, y, r: 0.35 + rnd(i + 4) * 0.1, v: 1.6 + rnd(i + 5) * 2.6, up: 1 + rnd(i + 6) * 2.4, spin: (rnd(i + 7) - 0.5) * 14 };
      s.visible = false; this.group.add(s); this.shards.push(s);
    }
    this.glow = new Flames(this.group, [{ p: [0, 0.55, 0], order: 0, tint: [0.4, 1, 0.9] }], 1.6);
  }
  /** crack stage 0..3, shatter time since shattering (s) or < 0, glow 0..1, shake (m) */
  set(stage: number, since: number, glow: number, shake: number, t: number, px: number) {
    this.body.visible = since < 0;
    this.mat.map = this.texs[Math.max(0, Math.min(4, stage))];
    this.body.position.x = shake * (Math.floor(t * 30) % 2 ? 1 : -1);
    this.glow.mat.uniforms.uLit.value = glow > 0 ? 1 : 0; this.glow.mat.uniforms.uTime.value = t; this.glow.mat.uniforms.uPx.value = px;
    this.glow.mat.uniforms.uSize.value = 1.6 * glow + (since >= 0 && since < 0.4 ? 6 * (1 - since / 0.4) : 0);
    this.glow.pts.position.y = since >= 0 ? -0.4 : 0;
    for (const s of this.shards) {
      s.visible = since >= 0;
      if (since < 0) continue;
      const d = s.userData as { a: number; y: number; r: number; v: number; up: number; spin: number };
      const tt = since, h = Math.max(-(this.group.position.y / this.group.scale.y) + 0.02, d.y + d.up * tt - 4.9 * tt * tt);
      const fly = Math.min(tt, 1.2), dist = d.r + d.v * fly * (1 - fly / 2.6);
      s.position.set(Math.cos(d.a) * dist, h, Math.sin(d.a) * dist);
      const settle = h <= -(this.group.position.y / this.group.scale.y) + 0.021;
      s.rotation.set(settle ? -Math.PI / 2 : d.spin * Math.min(tt, 0.8), d.a, settle ? 0 : d.spin * 0.6 * Math.min(tt, 0.8));
    }
  }
}

// ---------------- the world ----------------
export const THRONE_X = 400;
export class World {
  root = new THREE.Group();
  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  sun = new THREE.DirectionalLight(0xffffff, 2);
  skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false });
  skies: Record<LightName, THREE.Texture>;
  fog = new THREE.Fog(0x000000, 60, 600);
  fires: Flames; windows: Flames; dust: Flames; campFires: Flames; camp = new THREE.Group();
  warm: THREE.PointLight[] = [];
  jar: Jar; jarBroken: Jar;
  winMat = toon(0xffffff, windowTex(false)); winLit = windowTex(true); winDark = windowTex(false);
  clouds: THREE.Mesh[] = []; cloudMat: THREE.MeshBasicMaterial;

  constructor() {
    const R = this.root, B = new Batch();
    this.skies = {
      golden: skyTex("#5f86d0", "#f6b77a", "#ffd9a0"), day: skyTex("#3e7fd2", "#8fb6e6", "#d6e6f2"), dawn: skyTex("#3a4a8a", "#e8a0a0", "#ffd0b0"),
      night: skyTex("#04061a", "#121838", "#26284a", 80), storm: skyTex("#0e1018", "#262a38", "#3a3e4e", 0),
      interior: skyTex("#3e7fd2", "#8fb6e6", "#d6e6f2"), interiorNight: skyTex("#04061a", "#121838", "#26284a", 80),
    };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), this.skyMat); sky.layers.set(NOINK); R.add(sky);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), toon(0xffffff, grassTex())); ground.rotation.x = -Math.PI / 2; R.add(ground);
    const fires: { p: [number, number, number]; order: number; tint?: [number, number, number] }[] = [];
    const wins: { p: [number, number, number]; order: number; tint?: [number, number, number] }[] = [];
    const stone = toon(0xffffff, stoneWall("#b8ab96", "#6e6457")), stoneD = toon(0xffffff, stoneWall("#9d917e", "#5e554a"));
    const roofBlue = toon(0x3f5f9a), roofRed = toon(0xa83a2a), wood = toon(0x7a5232), woodD = toon(0x5a3a22), hay = toon(0xd9b85a), iron = toon(0x55585e);
    const leaf = [toon(0x3f7a34), toon(0x4f8a3a), toon(0x2f6a30)], pine = toon(0x2f5a36), trunk = toon(0x5a3d26);
    const tree = (x: number, z: number, s: number, i: number) => {
      if (i % 3 === 0) { B.add(CYL, trunk, [x, 1 * s, z], [0, 0, 0], [0.25 * s, 2 * s, 0.25 * s]); B.add(CONE, pine, [x, 4.2 * s, z], [0, 0, 0], [1.7 * s, 6.5 * s, 1.7 * s]); return; }
      B.add(CYL, trunk, [x, 1.6 * s, z], [0, 0, 0], [0.3 * s, 3.2 * s, 0.3 * s]);
      for (let k = 0; k < 3; k++) B.add(ICO, leaf[(i + k) % 3], [x + (rnd(i * 3 + k) - 0.5) * 2.2 * s, (3.8 + k * 0.8) * s, z + (rnd(i * 5 + k) - 0.5) * 2.2 * s], [0, 0, 0], [2 * s, 1.7 * s, 2 * s]);
    };
    const merlons = (x0: number, z0: number, x1: number, z1: number, y: number, n: number) => { for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; B.add(BOX, stone, [x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t], [0, Math.atan2(x1 - x0, z1 - z0), 0], [1.2, 1.2, 1.2]); } };

    // ================= CASTLE =================
    const court = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), toon(0xffffff, cobble())); court.rotation.x = -Math.PI / 2; court.position.y = 0.02; R.add(court);
    const H = 9, T = 3;
    // curtain walls (east, west, south with a gate gap), merlons, wall walks
    B.add(BOX, stone, [21.5, H / 2, 0], [0, 0, 0], [T, H, 46]); B.add(BOX, stone, [-21.5, H / 2, 0], [0, 0, 0], [T, H, 46]);
    B.add(BOX, stone, [-12, H / 2, 21.5], [0, 0, 0], [16, H, T]); B.add(BOX, stone, [12, H / 2, 21.5], [0, 0, 0], [16, H, T]);
    B.add(BOX, stone, [0, H - 1.5, 21.5], [0, 0, 0], [8, 3, T]);
    merlons(22.4, -21, 22.4, 21, H + 0.6, 16); merlons(-22.4, -21, -22.4, 21, H + 0.6, 16); merlons(-21, 22.4, 21, 22.4, H + 0.6, 16);
    for (const [x, z] of [[21.5, 21.5], [-21.5, 21.5], [21.5, -21.5], [-21.5, -21.5]] as const) {
      B.add(CYL, stoneD, [x, 7.5, z], [0, 0, 0], [4, 15, 4]); B.add(CONE, x > 0 ? roofBlue : roofRed, [x, 18.5, z], [0, 0, 0], [4.8, 7, 4.8]);
      B.add(CYL, iron, [x, 23, z], [0, 0, 0], [0.06, 2, 0.06]);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; wins.push({ p: [x + Math.cos(a) * 4.02, 11, z + Math.sin(a) * 4.02], order: 0, tint: [1, 0.75, 0.35] }); }
    }
    // gatehouse
    for (const x of [-5.5, 5.5]) { B.add(CYL, stoneD, [x, 8, 23], [0, 0, 0], [3, 16, 3]); B.add(CONE, roofBlue, [x, 18.5, 23], [0, 0, 0], [3.6, 5, 3.6]); }
    B.add(BOX, woodD, [0, 3.5, 23.2], [0, 0, 0], [7, 7, 0.4]);                // the gate (closed)
    for (let k = 0; k < 6; k++) B.add(BOX, iron, [-3 + k * 1.2, 3.5, 23.45], [0, 0, 0], [0.12, 7, 0.08]);
    // the keep (north), balcony over the courtyard at y 7
    B.add(BOX, stone, [0, 11, -30], [0, 0, 0], [32, 22, 18]);
    merlons(-16, -21.2, 16, -21.2, 22.6, 20);
    for (const x of [-12, 12]) { B.add(CYL, stoneD, [x, 15, -24], [0, 0, 0], [3.2, 30, 3.2]); B.add(CONE, roofRed, [x, 34, -24], [0, 0, 0], [3.9, 8, 3.9]); }
    B.add(CYL, stoneD, [0, 18, -30], [0, 0, 0], [4.5, 36, 4.5]); B.add(CONE, roofBlue, [0, 41, -30], [0, 0, 0], [5.5, 10, 5.5]);
    B.add(BOX, stone, [0, 6.75, -19.5], [0, 0, 0], [8, 0.5, 3]);                                    // balcony floor
    for (let k = 0; k < 9; k++) B.add(CYL, stone, [-3.6 + k * 0.9, 7.5, -18.1], [0, 0, 0], [0.14, 1.1, 0.14]);
    B.add(BOX, stone, [0, 8.1, -18.1], [0, 0, 0], [8, 0.25, 0.4]);
    for (const x of [-3.2, 3.2]) B.add(BOX, stoneD, [x, 5.5, -18.6], [0, 0, 0.0], [0.6, 2.4, 0.6]);  // corbels
    B.add(BOX, woodD, [0, 9.5, -20.95], [0, 0, 0], [2.2, 3.5, 0.2]);                                 // balcony door
    B.add(BOX, woodD, [0, 2.6, -20.95], [0, 0, 0], [5, 5.2, 0.2]);                                   // great doors
    for (const x of [-9, -6, 6, 9]) for (const y of [8.5, 14.5]) { B.add(BOX, stoneD, [x, y, -20.95], [0, 0, 0], [1.6, 2.8, 0.15]); wins.push({ p: [x, y, -20.8], order: 0, tint: [1, 0.75, 0.35] }); }
    const wl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.6), this.winMat); wl.position.set(-9, 8.5, -20.85); R.add(wl);
    for (const [x, y] of [[-6, 8.5], [6, 8.5], [9, 8.5], [-9, 14.5], [-6, 14.5], [6, 14.5], [9, 14.5]]) { const w = wl.clone(); w.position.set(x, y, -20.85); R.add(w); }
    // banners on the keep + walls
    const banners = [bannerTex("#2a4a8a", "#f2c14e", 2), bannerTex("#2a4a8a", "#f4ead6", 0), bannerTex("#7a1f2b", "#f2c14e", 1)];
    for (const [x, y, z, ry, k] of [[-3, 15, -20.9, 0, 0], [3, 15, -20.9, 0, 0], [-14, 5.5, 19.9, Math.PI, 1], [14, 5.5, 19.9, Math.PI, 1], [19.9, 5.5, -6, -Math.PI / 2, 2], [19.9, 5.5, 8, -Math.PI / 2, 2], [-19.9, 5.5, -6, Math.PI / 2, 2], [-19.9, 5.5, 8, Math.PI / 2, 2]] as const) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.4), new THREE.MeshToonMaterial({ map: banners[k], gradientMap: ramp, side: THREE.DoubleSide })); b.position.set(x, y, z); b.rotation.y = ry; R.add(b);
    }
    // wall torches in the courtyard
    for (const [x, z] of [[-19.9, -12], [-19.9, 0], [-19.9, 12], [19.9, -12], [19.9, 0], [19.9, 12], [-8, 19.9], [8, 19.9], [-6, -20.8], [6, -20.8]] as const) {
      B.add(CYL, iron, [x, 3.4, z], [0, 0, 0], [0.08, 0.7, 0.08]); fires.push({ p: [x, 3.95, z], order: 0 });
    }
    // courtyard clutter
    B.add(CYL, stoneD, [7, 0.6, 5], [0, 0, 0], [1.4, 1.2, 1.4]); B.add(CYL, toon(0x2a3a4a), [7, 1.21, 5], [0, 0, 0], [1.1, 0.02, 1.1]);
    for (const x of [5.8, 8.2]) B.add(BOX, wood, [x, 2.0, 5], [0, 0, 0], [0.18, 2.6, 0.18]); B.add(PRISM, roofRed, [7, 3.6, 5], [0, 0, Math.PI / 2], [1.1, 3.0, 1.1]);
    const cart = (x: number, z: number, ry: number) => {
      B.add(BOX, wood, [x, 1.0, z], [0, ry, 0], [3.2, 0.25, 1.7]); B.add(BOX, wood, [x, 1.4, z], [0, ry, 0], [3.2, 0.6, 0.12]);
      for (const s of [-1, 1]) B.add(CYL, woodD, [x + Math.sin(ry) * s * 0.9, 0.62, z + Math.cos(ry) * s * 0.9], [Math.PI / 2, ry, 0], [0.62, 0.15, 0.62]);
      B.add(BOX, wood, [x + Math.cos(ry) * 2.6, 0.9, z - Math.sin(ry) * 2.6], [0, ry, 0.1], [2.2, 0.1, 0.1]);
      for (let k = 0; k < 3; k++) B.add(CYL, hay, [x - 0.8 + k * 0.8, 1.45, z], [Math.PI / 2, ry, 0], [0.35, 1.2, 0.35]);
    };
    cart(-10, 9, 0.3); cart(13, -10, -0.5);
    for (let i = 0; i < 26; i++) { // barrels + crates along the walls
      const side = i % 4, k = Math.floor(i / 4), along = -14 + k * 4.6 + rnd(i) * 1.2;
      const [x, z] = side === 0 ? [-18.6, along] : side === 1 ? [18.6, along] : side === 2 ? [along, 18.6] : [along * 0.6 + (along > 0 ? 6 : -6), -19.6];
      if (Math.abs(x) < 4.5 && z > 15) continue;
      if (i % 2) { B.add(CYL, wood, [x, 0.55, z], [0, 0, 0], [0.5, 1.1, 0.5]); B.add(CYL, iron, [x, 0.3, z], [0, 0, 0], [0.52, 0.08, 0.52]); B.add(CYL, iron, [x, 0.8, z], [0, 0, 0], [0.52, 0.08, 0.52]); }
      else { B.add(BOX, wood, [x, 0.5, z], [0, rnd(i), 0], [1, 1, 1]); if (i % 3 === 0) B.add(BOX, wood, [x, 1.35, z], [0, rnd(i + 1), 0], [0.7, 0.7, 0.7]); }
    }
    for (const [x, z] of [[-14, -6], [-12.5, -6], [-14, -4.6]] as const) B.add(CYL, hay, [x, 0.5, z], [Math.PI / 2, 0, 0], [0.55, 1.3, 0.55]);
    for (let k = 0; k < 2; k++) { // weapon rack + training dummies
      const x = 12 + k * 3, z = 9;
      B.add(BOX, wood, [x, 1.0, z], [0, 0, 0], [2.4, 0.12, 0.3]); for (let s = 0; s < 5; s++) B.add(CYL, toon(0x8a6a44), [x - 1 + s * 0.5, 1.2, z], [0.15, 0, 0], [0.04, 2.4, 0.04]);
      B.add(CYL, wood, [-13 + k * 3, 1.0, 14], [0, 0, 0], [0.12, 2, 0.12]); B.add(CYL, hay, [-13 + k * 3, 1.6, 14], [0, 0, 0], [0.4, 1.0, 0.4]); B.add(SPH, hay, [-13 + k * 3, 2.35, 14], [0, 0, 0], [0.32, 0.32, 0.32]);
    }
    tree(-15, -14, 0.9, 4); tree(15, 14, 0.8, 8);
    // ================= LANDSCAPE =================
    const river = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-600, 0, 160], [-200, 0, 120], [0, 0, 90], [200, 0, 140], [600, 0, 100]].map(([x, y, z]) => new THREE.Vector3(x, y, z))), 80, 9, 6), toon(0x4f8fc8));
    river.scale.y = 0.02; river.position.y = 0.05; R.add(river);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(6, 360), toon(0xb08a5a)); road.rotation.x = -Math.PI / 2; road.rotation.z = -0.78; road.position.set(-120, 0.04, -110); R.add(road);
    const road2 = new THREE.Mesh(new THREE.PlaneGeometry(6, 100), toon(0xb08a5a)); road2.rotation.x = -Math.PI / 2; road2.position.set(0, 0.04, 72); R.add(road2);
    const fields = [toon(0x9cbf5a), toon(0xc9b25a), toon(0x7fae4a), toon(0x8a6a44)];
    for (let i = 0; i < 40; i++) {
      const a = rnd(i + 30) * Math.PI * 2, r = 70 + rnd(i + 31) * 240, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.abs(x) < 40 && Math.abs(z) < 50) continue;
      const f = new THREE.Mesh(new THREE.PlaneGeometry(30 + rnd(i) * 40, 24 + rnd(i + 1) * 30), fields[i % 4]); f.rotation.x = -Math.PI / 2; f.rotation.z = rnd(i + 2) * 0.6; f.position.set(x, 0.03 + (i % 4) * 0.003, z); R.add(f);
    }
    // village south of the castle (timber houses with thatched roofs) + its lit windows
    for (let i = 0; i < 24; i++) {
      const x = -50 + (i % 8) * 13 + rnd(i) * 4, z = 60 + Math.floor(i / 8) * 14 + rnd(i + 1) * 4;
      if (Math.abs(x) < 6) continue;
      B.add(BOX, toon(0xe9dcc0), [x, 2, z], [0, rnd(i) * 0.6, 0], [6, 4, 5]);
      B.add(PRISM, i % 2 ? toon(0xc9a548) : toon(0x8a5a3a), [x, 5.0, z], [0, rnd(i) * 0.6, Math.PI / 2], [3.1, 6.4, 3.1]);
      for (const dx of [-1.6, 1.6]) B.add(BOX, woodD, [x + dx, 2, z + 2.52], [0, rnd(i) * 0.6, 0], [0.2, 4, 0.06]);
      wins.push({ p: [x, 2.2, z + 2.6], order: 0, tint: [1, 0.75, 0.35] });
    }
    // forests, scattered trees
    for (let i = 0; i < 420; i++) {
      const g = Math.floor(i / 14), ga = rnd(g * 3 + 500) * Math.PI * 2, gr = 90 + rnd(g * 3 + 501) * 380;
      const x = Math.cos(ga) * gr + (rnd(i + 600) - 0.5) * 40, z = Math.sin(ga) * gr + (rnd(i + 601) - 0.5) * 40;
      if (Math.abs(x) < 60 && Math.abs(z) < 110) continue;
      if (Math.abs((x + 120) - (z + 110)) < 14 && x < -10 && x > -260) continue;                 // keep the border road clear
      tree(x, z, 1 + rnd(i + 602) * 0.8, i);
    }
    // mountains with snow caps
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2, r = 620 + rnd(i + 700) * 160, h = 120 + rnd(i + 701) * 140, w = 110 + rnd(i + 702) * 90;
      B.add(CONE, toon(0x6a7a8a), [Math.cos(a) * r, h / 2 - 5, Math.sin(a) * r], [0, rnd(i), 0], [w, h, w]);
      B.add(CONE, toon(0xf4f6fa), [Math.cos(a) * r, h - 5 - h * 0.12, Math.sin(a) * r], [0, rnd(i), 0], [w * 0.25, h * 0.25, w * 0.25]);
    }
    // ================= BORDER PASS (x -260, z -260) =================
    for (const s of [-1, 1]) {
      B.add(CONE4, toon(0x7a7a72), [-260 + s * 34, 30, -270 - s * 34], [0, 0.78, 0], [42, 70, 42]);
      B.add(ICO, toon(0x6a6a62), [-260 + s * 24, 6, -262 - s * 24], [0, 0, 0], [16, 12, 16]);
    }
    B.add(BOX, stone, [-260, 4, -260], [0, 0.785, 0], [26, 8, 3]);
    merlons(-269.2, -250.8, -250.8, -269.2, 8.6, 12);
    B.add(BOX, woodD, [-260, 2.6, -260], [0, 0.785, 0], [5, 5.2, 3.2]);
    const TW: [number, number] = [-273, -247]; // watchtower at the west end of the wall
    B.add(CYL, stoneD, [TW[0], 9, TW[1]], [0, 0, 0], [3, 18, 3]); B.add(BOX, stoneD, [TW[0], 17.6, TW[1]], [0, 0, 0], [6.6, 0.4, 6.6]);
    for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) B.add(CYL, wood, [TW[0] + dx, 19.8, TW[1] + dz], [0, 0, 0], [0.15, 4.2, 0.15]);
    B.add(CONE4, roofBlue, [TW[0], 23.6, TW[1]], [0, 0.785, 0], [5.4, 3.6, 5.4]);
    fires.push({ p: [TW[0] + 2.6, 18.4, TW[1] + 2.6], order: 0 });
    // ================= ENEMY CAMP (z ~ -420) =================
    const B0 = B; const CB = new Batch(); const campF: { p: [number, number, number]; order: number }[] = [];
    { const B = CB; const fires = campF;
    for (let i = 0; i < 26; i++) {
      const x = -320 + (i % 7) * 13 + rnd(i + 800) * 4, z = -400 - Math.floor(i / 7) * 14 - rnd(i + 801) * 4;
      B.add(CONE, i % 3 ? toon(0xa83a2a) : toon(0xe9dcc0), [x, 2.4, z], [0, 0, 0], [3.2, 4.8, 3.2]);
      B.add(CYL, iron, [x, 5.2, z], [0, 0, 0], [0.05, 1.2, 0.05]);
      if (i % 2 === 0) { fires.push({ p: [x + 5, 0.6, z + 5], order: 0 }); for (let k = 0; k < 4; k++) B.add(CYL, woodD, [x + 5, 0.15, z + 5], [Math.PI / 2, k * 0.8, 0], [0.12, 1.4, 0.12]); }
    }
    for (let k = 0; k < 40; k++) B.add(CYL, wood, [-340 + k * 2.6, 1.4, -380], [0, 0, 0], [0.25, 2.8, 0.25]);   // palisade
    for (let k = 0; k < 6; k++) { const bn = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.2), new THREE.MeshToonMaterial({ map: bannerTex("#8a2a2a", "#1a1414", 0), gradientMap: ramp, side: THREE.DoubleSide })); bn.position.set(-330 + k * 16, 6, -383); this.camp.add(bn); B.add(CYL, iron, [-330 + k * 16 - 0.85, 3.6, -383], [0, 0, 0], [0.06, 7.2, 0.06]); }
    }
    CB.build(this.camp); R.add(this.camp); void B0;
    // ================= THRONE ROOM (x = 400) =================
    const X = THRONE_X;
    const tf = new THREE.Mesh(new THREE.PlaneGeometry(24, 40), toon(0xffffff, floorTiles())); tf.rotation.x = -Math.PI / 2; tf.position.set(X, 0.01, 0); R.add(tf);
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 34), toon(0xffffff, carpetTex())); carpet.rotation.x = -Math.PI / 2; carpet.position.set(X, 0.03, 2); R.add(carpet);
    const iw = toon(0xffffff, stoneWall("#a89a86", "#6a5e50"));
    B.add(BOX, iw, [X - 12.5, 7, 0], [0, 0, 0], [1, 14, 40]); B.add(BOX, iw, [X + 12.5, 7, 0], [0, 0, 0], [1, 14, 40]);
    B.add(BOX, iw, [X, 7, -20.5], [0, 0, 0], [26, 14, 1]); B.add(BOX, iw, [X, 7, 20.5], [0, 0, 0], [26, 14, 1]);
    B.add(BOX, toon(0x5a3a2a), [X, 14.2, 0], [0, 0, 0], [26, 0.6, 42]);
    for (let k = 0; k < 7; k++) B.add(BOX, woodD, [X, 13.4, -18 + k * 6], [0, 0, 0], [24, 0.8, 0.6]);       // roof beams
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) {
      const z = -15 + k * 6;
      B.add(CYL, toon(0xd9cdb6), [X + s * 7, 6.5, z], [0, 0, 0], [0.7, 13, 0.7]); B.add(BOX, toon(0xb9ad96), [X + s * 7, 0.3, z], [0, 0, 0], [1.8, 0.6, 1.8]); B.add(BOX, toon(0xb9ad96), [X + s * 7, 12.8, z], [0, 0, 0], [1.6, 0.6, 1.6]);
      // tall stained windows between pillars on the side walls, banners, torches
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 5.2), new THREE.MeshBasicMaterial({ map: stained(), toneMapped: false }));
      sw.position.set(X + s * 11.95, 7.5, z + 3); sw.rotation.y = -s * Math.PI / 2; sw.layers.set(NOINK); R.add(sw);
      const bn = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 4.2), new THREE.MeshToonMaterial({ map: banners[k % 3], gradientMap: ramp, side: THREE.DoubleSide }));
      bn.position.set(X + s * 11.9, 8, z); bn.rotation.y = -s * Math.PI / 2; R.add(bn);
      B.add(CYL, iron, [X + s * 11.6, 4.2, z + 1.5], [0, 0, 0], [0.08, 0.7, 0.08]); fires.push({ p: [X + s * 11.55, 4.75, z + 1.5], order: 0 });
      if (k % 2 === 0) { // suits of armour + shields
        B.add(BOX, toon(0xa9b1ba), [X + s * 10.6, 1.2, z + 1.5], [0, 0, 0], [0.7, 1.2, 0.5]); B.add(SPH, toon(0xa9b1ba), [X + s * 10.6, 2.1, z + 1.5], [0, 0, 0], [0.32, 0.36, 0.32]);
        B.add(CYL, toon(0x3f5f9a), [X + s * 11.95, 10.8, z], [0, 0, Math.PI / 2], [0.8, 0.12, 0.8]);
      }
    }
    // dais, throne, braziers, the jar's pedestal, map table, chandelier
    for (let k = 0; k < 3; k++) B.add(BOX, toon(0xb9ad96), [X, 0.25 + k * 0.4, -15.5 - k * 0.6], [0, 0, 0], [9 - k * 1.4, 0.5, 6 - k * 1.2]);
    B.add(BOX, toon(0x9a1f2a), [X, 2.0, -17.2], [0, 0, 0], [1.9, 0.5, 1.4]); B.add(BOX, toon(0xe8b84a), [X, 3.6, -17.9], [0, 0, 0], [2.0, 3.2, 0.3]);
    B.add(CONE, toon(0xe8b84a), [X, 5.6, -17.9], [0, 0, 0], [0.6, 1.0, 0.3]);
    for (const s of [-1, 1]) { B.add(BOX, toon(0xe8b84a), [X + s * 1.0, 2.6, -17.2], [0, 0, 0], [0.25, 1.0, 1.4]); B.add(SPH, toon(0xe8b84a), [X + s * 1.0, 4.9, -17.9], [0, 0, 0], [0.22, 0.22, 0.22]); }
    B.add(BOX, toon(0x9a1f2a), [X, 3.5, -17.7], [0, 0, 0], [1.5, 2.6, 0.1]);
    const tap = new THREE.Mesh(new THREE.PlaneGeometry(8, 9), new THREE.MeshToonMaterial({ map: bannerTex("#2a4a8a", "#f2c14e", 2), gradientMap: ramp })); tap.position.set(X, 8, -19.95); R.add(tap);
    for (const s of [-1, 1]) {
      B.add(CYL, iron, [X + s * 4.6, 0.9, -13.2], [0, 0, 0], [0.12, 1.8, 0.12]); B.add(CYL, iron, [X + s * 4.6, 1.9, -13.2], [0, 0, 0], [0.6, 0.35, 0.6]);
      fires.push({ p: [X + s * 4.6, 2.35, -13.2], order: 0 }, { p: [X + s * 4.6 + 0.25, 2.25, -13.0], order: 0 }, { p: [X + s * 4.6 - 0.2, 2.3, -13.35], order: 0 });
    }
    B.add(CYL, toon(0xd9cdb6), [X + 3.0, 0.75, -11.4], [0, 0, 0], [0.45, 1.5, 0.45]); B.add(CYL, toon(0xb9ad96), [X + 3.0, 1.55, -11.4], [0, 0, 0], [0.6, 0.12, 0.6]);  // pedestal
    B.add(BOX, wood, [X - 4.5, 1.05, -3], [0, 0.2, 0], [3.4, 0.15, 2.2]); for (const [dx, dz] of [[-1.5, -0.9], [1.5, -0.9], [-1.5, 0.9], [1.5, 0.9]]) B.add(BOX, woodD, [X - 4.5 + dx, 0.5, -3 + dz], [0, 0.2, 0], [0.15, 1, 0.15]);
    const map = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.0), toon(0xffffff, mapTex())); map.rotation.x = -Math.PI / 2; map.rotation.z = 0.2; map.position.set(X - 4.5, 1.14, -3); R.add(map);
    B.add(CYL, iron, [X, 11.5, -4], [0, 0, 0], [2.2, 0.15, 2.2]); B.add(CYL, iron, [X, 12.8, -4], [0, 0, 0], [0.05, 2.6, 0.05]);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; fires.push({ p: [X + Math.cos(a) * 2.1, 11.8, -4 + Math.sin(a) * 2.1], order: 0 }); }
    // the jar (and a second, already-broken jar state is the same object; shards handle it)
    this.jar = new Jar(R, [X + 3.0, 1.61, -11.4], 1.0);
    this.jar.group.rotation.y = -2.3; // cracks toward the cameras
    this.jarBroken = this.jar;
    for (const [x, y, z] of [[X - 4.6, 3, -12], [X + 4.6, 3, -12], [X, 10, -4], [X - 8, 5, 8], [X + 8, 5, 8]] as const) { const l = new THREE.PointLight(0xffa850, 0, 22, 1.3); l.position.set(x, y, z); R.add(l); this.warm.push(l); }
    // dust motes in the throne room
    const dust: { p: [number, number, number]; order: number; tint: [number, number, number] }[] = [];
    for (let i = 0; i < 160; i++) dust.push({ p: [X + (rnd(i + 900) - 0.5) * 18, 0.5 + rnd(i + 901) * 9, -18 + rnd(i + 902) * 30], order: 0, tint: [0.9, 0.8, 0.6] });
    this.dust = new Flames(R, dust, 0.05);
    this.fires = new Flames(R, fires, 0.7);
    this.campFires = new Flames(this.camp, campF, 1.1);
    this.windows = new Flames(R, wins, 1.2);
    // clouds
    this.cloudMat = new THREE.MeshBasicMaterial({ map: canvasTex(256, 128, (g) => { g.fillStyle = "#fff"; for (const [x, y, r] of [[60, 80, 36], [110, 60, 48], [165, 70, 40], [205, 85, 28], [130, 92, 50]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } }), transparent: true, depthWrite: false, fog: false, toneMapped: false });
    for (let i = 0; i < 26; i++) { const a = rnd(i + 950) * Math.PI * 2, r = 520 + rnd(i + 951) * 200, s = 70 + rnd(i + 952) * 80; const c = new THREE.Mesh(new THREE.PlaneGeometry(s, s / 2), this.cloudMat); c.position.set(Math.cos(a) * r, 110 + rnd(i + 953) * 120, Math.sin(a) * r); c.lookAt(0, 60, 0); c.layers.set(NOINK); R.add(c); this.clouds.push(c); }
    B.build(R);
    this.sun.position.set(80, 120, 60); R.add(this.hemi, this.sun, this.sun.target);
  }

  set(o: { light: LightName; t: number; px: number; flash?: number; jarStage?: number; jarSince?: number; jarGlow?: number; jarShake?: number; dayCycle?: number; dust?: number; camp?: boolean }) {
    this.camp.visible = o.camp ?? false;
    let L = o.light;
    // fast day/night cycle for "days passed, then weeks"
    if (o.dayCycle !== undefined) { const ph = (o.dayCycle % 1 + 1) % 1; L = ph < 0.18 ? "dawn" : ph < 0.55 ? "day" : ph < 0.7 ? "golden" : "night"; }
    this.skyMat.map = this.skies[L]; this.skyMat.needsUpdate = true;
    const P = {
      golden: { hs: 0xffe0c0, hg: 0x7a6a4a, hi: 1.7, sc: 0xffc890, si: 2.4, sp: [-80, 50, 100], fog: 0xffd9a0, warm: 0, fire: 0.6, win: 0, cl: 0xffd0b0 },
      day: { hs: 0xe0ecff, hg: 0x6a6a4a, hi: 1.7, sc: 0xfff2d8, si: 2.6, sp: [60, 120, 60], fog: 0xd6e6f2, warm: 0, fire: 0.4, win: 0, cl: 0xffffff },
      dawn: { hs: 0xd8c0d8, hg: 0x5a4a50, hi: 1.4, sc: 0xffb0a0, si: 2.0, sp: [120, 30, -60], fog: 0xffd0b0, warm: 0, fire: 0.5, win: 0.3, cl: 0xffd8d0 },
      night: { hs: 0x5a6ab0, hg: 0x2a2a38, hi: 1.5, sc: 0x8a9ad8, si: 0.8, sp: [-60, 90, -80], fog: 0x26284a, warm: 0, fire: 1, win: 1, cl: 0x3a4270 },
      storm: { hs: 0x5a6070, hg: 0x1a1a20, hi: 1.0, sc: 0x9aa0c0, si: 0.6, sp: [-60, 90, -80], fog: 0x3a3e4e, warm: 0, fire: 1, win: 1, cl: 0x4a4e5e },
      interior: { hs: 0xfff0dc, hg: 0x6a5a4a, hi: 1.5, sc: 0xffe8c8, si: 1.6, sp: [THRONE_X + 80, 60, 40], fog: 0xd6e6f2, warm: 6, fire: 1, win: 0, cl: 0xffffff },
      interiorNight: { hs: 0x5a5a9a, hg: 0x2a1a20, hi: 1.0, sc: 0x8a9ad8, si: 0.6, sp: [THRONE_X + 80, 60, 40], fog: 0x26284a, warm: 12, fire: 1, win: 1, cl: 0x3a4270 },
    }[L];
    const fl = o.flash ?? 0;
    this.hemi.color.set(P.hs); this.hemi.groundColor.set(P.hg); this.hemi.intensity = P.hi + fl * 4;
    this.sun.color.set(P.sc); this.sun.intensity = P.si + fl * 3; this.sun.position.set(...(P.sp as [number, number, number]));
    this.fog.color.set(P.fog); this.fog.near = 80; this.fog.far = 900;
    this.warm.forEach((l) => { l.intensity = P.warm * (0.9 + 0.1 * Math.sin(o.t * 11 + l.position.z)); });
    this.winMat.map = P.win > 0.5 ? this.winLit : this.winDark; this.winMat.needsUpdate = true;
    this.cloudMat.color.set(P.cl);
    this.clouds.forEach((c, i) => { c.position.x += 0; c.rotation.z = 0; c.visible = L !== "storm" || i % 2 === 0; });
    for (const f of [this.fires, this.windows, this.dust, this.campFires]) { f.mat.uniforms.uTime.value = o.t; f.mat.uniforms.uPx.value = o.px; }
    this.campFires.mat.uniforms.uLit.value = 1;
    this.fires.mat.uniforms.uLit.value = P.fire > 0 ? 1 : 0; this.fires.mat.uniforms.uSize.value = 0.7 * Math.max(0.5, P.fire);
    this.windows.mat.uniforms.uLit.value = P.win > 0 ? 1 : 0; this.windows.mat.uniforms.uSize.value = 1.2 * P.win;
    this.dust.mat.uniforms.uLit.value = o.dust ?? 0;
    const dp = this.dust.pts.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < dp.count; i++) dp.setY(i, 0.5 + ((rnd(i + 901) * 9 + o.t * 0.12 * (0.5 + rnd(i))) % 9));
    dp.needsUpdate = true;
    this.jar.set(o.jarStage ?? 0, o.jarSince ?? -1, o.jarGlow ?? 0.3, o.jarShake ?? 0, o.t, o.px);
  }
}
