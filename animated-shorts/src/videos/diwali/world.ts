// "Why do we light lamps on Diwali?": three places in one toon-shaded world.
//   Ayodhya (ancient city, around the origin): main street along z, gate + walls at z = +46, palace at z = -46,
//     houses with chhatri domes, a temple shikhara, marigold garlands and hundreds of diyas that light up in a wave.
//   Forest of exile (around x = -160): trees, Rama's hut, a river. Also the Lanka battle under a red sky.
//   Modern street (around x = +160): houses with balconies, string lights, rangoli, diyas, fireworks.
// Diyas are one merged clay mesh + one Points cloud whose shader lights each flame when uLit passes its order.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { NOINK } from "../bridge/ink";
import { decorate, skyLanternPos } from "./decor";

export type LightName = "golden" | "forest" | "dusk" | "night" | "fire" | "modern";

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
const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 12), CONE = new THREE.ConeGeometry(1, 1, 12), ICO = new THREE.IcosahedronGeometry(1, 1);
const DOME = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), SPH = new THREE.SphereGeometry(1, 8, 6);

// ---------------- flames (Points) ----------------
const FLAME_VS = /* glsl */ `
attribute float order; attribute float seed; attribute vec3 tint;
uniform float uLit; uniform float uTime; uniform float uPx; uniform float uSize;
varying float vOn; varying vec3 vTint;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float on = smoothstep(order, order + 0.02, uLit);
  float fl = 0.85 + 0.15 * sin(uTime * 13.0 + seed * 40.0) * sin(uTime * 7.3 + seed * 17.0);
  vOn = on * fl; vTint = tint;
  gl_PointSize = uSize * uPx * fl * on / max(0.3, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const FLAME_FS = /* glsl */ `
varying float vOn; varying vec3 vTint;
void main() {
  vec2 d = gl_PointCoord - 0.5; d.y *= 0.9;
  float r = length(d) * 2.0;
  float core = smoothstep(0.22, 0.0, r);
  float halo = pow(max(0.0, 1.0 - r), 2.2);
  vec3 c = mix(vTint * 1.2, vec3(1.0, 0.97, 0.85), core);
  float a = (core + 0.95 * halo) * vOn;
  if (a < 0.01) discard;
  gl_FragColor = vec4(c * a, a);
}`;
export class Flames {
  pts: THREE.Points; mat: THREE.ShaderMaterial;
  constructor(parent: THREE.Object3D, list: { p: [number, number, number]; order: number; tint?: [number, number, number] }[], size = 0.3) {
    const n = list.length, pos = new Float32Array(n * 3), ord = new Float32Array(n), sd = new Float32Array(n), tn = new Float32Array(n * 3);
    list.forEach((d, i) => { pos.set(d.p, i * 3); ord[i] = d.order; sd[i] = rnd(i * 3.7); tn.set(d.tint ?? [1.0, 0.62, 0.18], i * 3); });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("order", new THREE.BufferAttribute(ord, 1));
    g.setAttribute("seed", new THREE.BufferAttribute(sd, 1)); g.setAttribute("tint", new THREE.BufferAttribute(tn, 3));
    this.mat = new THREE.ShaderMaterial({ vertexShader: FLAME_VS, fragmentShader: FLAME_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uLit: { value: 2 }, uTime: { value: 0 }, uPx: { value: 1 }, uSize: { value: size } } });
    this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; this.pts.layers.set(NOINK); parent.add(this.pts);
  }
}

// ---------------- painted textures ----------------
const stoneTex = (base: string) => canvasTex(256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(90,60,40,0.35)"; g.lineWidth = 3;
  for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); for (let x = (y / 32) % 2 ? 0 : 32; x < 256; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } }
}, [3, 3]);
const facadeTex = (base: string, arches: boolean) => canvasTex(256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(0, 0, 256, 18); g.fillRect(0, 238, 256, 18);
  for (const [x, y] of [[36, 50], [150, 50], [36, 150], [150, 150]]) {
    g.fillStyle = "#3a2430";
    if (arches) { g.beginPath(); g.moveTo(x, y + 70); g.lineTo(x, y + 25); g.quadraticCurveTo(x + 35, y - 12, x + 70, y + 25); g.lineTo(x + 70, y + 70); g.closePath(); g.fill(); }
    else g.fillRect(x, y, 70, 70);
    g.strokeStyle = "#f1e3c0"; g.lineWidth = 6; g.stroke();
  }
});
const windowLit = (base: string) => canvasTex(256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (const [x, y] of [[30, 40], [150, 40], [30, 150], [150, 150]]) { g.fillStyle = "#ffcf7a"; g.fillRect(x, y, 76, 70); g.strokeStyle = "#5a3a2a"; g.lineWidth = 6; g.strokeRect(x, y, 76, 70); g.beginPath(); g.moveTo(x + 38, y); g.lineTo(x + 38, y + 70); g.stroke(); }
});
const rangoliTex = (seed: number) => canvasTex(256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  const cols = ["#e84a8a", "#f2c14e", "#2e9a5a", "#4fc3f7", "#f26b3a", "#ffffff"];
  for (let ring = 6; ring >= 1; ring--) {
    g.fillStyle = cols[(ring + seed) % cols.length];
    const petals = 8 + ring * 2;
    for (let k = 0; k < petals; k++) { const a = (k / petals) * Math.PI * 2; g.beginPath(); g.ellipse(128 + Math.cos(a) * ring * 17, 128 + Math.sin(a) * ring * 17, 13, 6, a, 0, Math.PI * 2); g.fill(); }
  }
  g.fillStyle = "#f2c14e"; g.beginPath(); g.arc(128, 128, 16, 0, Math.PI * 2); g.fill();
});
const skyTex = (top: string, mid: string, hor: string, stars = 0) => canvasTex(16, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(0.42, mid); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor);
  g.fillStyle = gr; g.fillRect(0, 0, 16, 512);
  for (let i = 0; i < stars; i++) { g.fillStyle = `rgba(255,250,230,${0.3 + rnd(i) * 0.6})`; g.fillRect(rnd(i + 5) * 16, rnd(i + 9) * 210, 1, 1); }
});

// ---------------- the world ----------------
export class World {
  root = new THREE.Group();
  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  sun = new THREE.DirectionalLight(0xffffff, 2);
  skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false });
  skies: Record<LightName, THREE.Texture>;
  fog = new THREE.Fog(0x000000, 40, 400);
  lanterns!: Flames; skyLanterns!: Flames;
  cityFlames: Flames; streetFlames: Flames; homeFlames: Flames; stringLights: Flames; fireworks: Flames; petals: Flames;
  warm: THREE.PointLight[] = [];
  bedDoor = 0;
  arrow: THREE.Mesh;
  fwData: { c: THREE.Vector3; t0: number; col: [number, number, number] }[] = [];

  constructor() {
    const R = this.root, B = new Batch();
    this.skies = {
      golden: skyTex("#5f86d0", "#f6b77a", "#ffd9a0"), forest: skyTex("#5aa0e0", "#a8d4f0", "#e2f0f2"),
      dusk: skyTex("#2a2f6a", "#c86a8a", "#f6a86a"), night: skyTex("#05071a", "#141838", "#2a2246", 70),
      fire: skyTex("#3a0a10", "#a8301e", "#f07a2a"), modern: skyTex("#06081c", "#191a40", "#3a2a50", 50),
    };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 24, 16), this.skyMat); sky.layers.set(NOINK); R.add(sky);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), toon(0xffffff, canvasTex(256, 256, (g) => {
      g.fillStyle = "#c9a46a"; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 500; i++) { g.fillStyle = rnd(i) < 0.5 ? "rgba(120,90,50,0.25)" : "rgba(230,200,150,0.25)"; g.fillRect(rnd(i + 1) * 256, rnd(i + 2) * 256, 3, 3); }
    }, [80, 80])));
    ground.rotation.x = -Math.PI / 2; R.add(ground);
    const D = decorate(R, toon);
    const grass = toon(0x6f9a45);
    for (const [x, z, w, d] of [[-160, 0, 160, 160], [0, 130, 300, 120], [0, -140, 300, 100]] as const) {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(w, d), grass); g.rotation.x = -Math.PI / 2; g.position.set(x, 0.02, z); R.add(g);
    }

    // ================= AYODHYA =================
    const sand = toon(0xffffff, stoneTex("#e8c48a")), sandD = toon(0xd9a86a), pink = toon(0xffffff, stoneTex("#e8a48a")), gold = toon(0xe8b84a), white = toon(0xf4ead6);
    const marigold = toon(0xf28a1a), marigoldY = toon(0xf6c12a), leaf = toon(0x3f8a3a);
    const city: { p: [number, number, number]; order: number }[] = [];
    const lampRow = (x0: number, y: number, z0: number, x1: number, z1: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : i / (n - 1), x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
        B.add(CYL, toon(0xb5532c), [x, y + 0.03, z], [0, 0, 0], [0.07, 0.06, 0.07]);
        // order: distance from the gate (lights spread from the gate into the city), plus a little noise
        city.push({ p: [x, y + 0.13, z], order: Math.min(1, Math.max(0, (46 - z) / 110 + Math.abs(x) / 300 + rnd(x * 7 + z) * 0.04)) });
      }
    };
    const garland = (x0: number, y: number, z0: number, x1: number, z1: number, sag = 0.5) => {
      for (let i = 0; i <= 16; i++) {
        const t = i / 16, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, yy = y - sag * 4 * t * (1 - t);
        B.add(SPH, i % 2 ? marigold : marigoldY, [x, yy, z], [0, 0, 0], [0.13, 0.13, 0.13]);
      }
      for (let i = 1; i < 16; i += 3) { const t = i / 16; B.add(SPH, marigold, [x0 + (x1 - x0) * t, y - sag * 4 * t * (1 - t) - 0.35, z0 + (z1 - z0) * t], [0, 0, 0], [0.1, 0.25, 0.1]); }
    };
    // street houses along z = -36..36 on both sides
    for (let i = 0; i < 8; i++) for (const side of [-1, 1]) {
      const z = -32 + i * 9, h = 6 + rnd(i * 2 + side) * 3, w = 8, d = 7, x = side * (7 + d / 2);
      const mat = toon(0xffffff, facadeTex(["#e8c48a", "#e8a48a", "#f0d8a8", "#d9b07a"][(i + (side > 0 ? 1 : 0)) % 4], true));
      B.add(BOX, mat, [x, h / 2, z], [0, 0, 0], [d, h, w]);
      B.add(BOX, sandD, [x - side * 0.1, h + 0.25, z], [0, 0, 0], [d + 0.3, 0.5, w + 0.3]);               // parapet
      B.add(BOX, sandD, [x - side * (d / 2 + 0.3), 0.25, z], [0, 0, 0], [0.6, 0.5, w]);                     // plinth/step
      if (i % 2 === 0) { // chhatri: little dome kiosk on the roof
        for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.add(CYL, white, [x + dx * 0.9, h + 1.25, z + dz * 0.9], [0, 0, 0], [0.1, 1.5, 0.1]);
        B.add(BOX, white, [x, h + 2.05, z], [0, 0, 0], [2.4, 0.2, 2.4]);
        B.add(DOME, gold, [x, h + 2.15, z], [0, 0, 0], [1.2, 1.3, 1.2]);
        B.add(CONE, gold, [x, h + 3.6, z], [0, 0, 0], [0.12, 0.6, 0.12]);
      }
      lampRow(x - side * (d / 2 + 0.4), 0.5, z - w / 2 + 0.4, x - side * (d / 2 + 0.4), z + w / 2 - 0.4, 7); // step
      lampRow(x - side * (d / 2 + 0.05), h + 0.5, z - w / 2 + 0.3, x - side * (d / 2 + 0.05), z + w / 2 - 0.3, 9); // parapet
      lampRow(x - side * (d / 2 + 0.05), h * 0.5, z - 2.2, x - side * (d / 2 + 0.05), z - 1.1, 2); // window sills
      lampRow(x - side * (d / 2 + 0.05), h * 0.5, z + 1.1, x - side * (d / 2 + 0.05), z + 2.2, 2);
      garland(x - side * (d / 2 + 0.08), h * 0.5 + 1.6, z - w / 2 + 0.5, x - side * (d / 2 + 0.08), z + w / 2 - 0.5, 0.45);
    }
    // gate + walls at z = 46
    B.add(BOX, pink, [-9.5, 6, 46], [0, 0, 0], [9, 12, 4]); B.add(BOX, pink, [9.5, 6, 46], [0, 0, 0], [9, 12, 4]);
    B.add(BOX, pink, [0, 10.5, 46], [0, 0, 0], [10, 3, 4]);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(5, 0.6, 8, 24, Math.PI), sandD); arch.position.set(0, 9, 44); R.add(arch);
    for (const x of [-11, 11]) { B.add(CYL, pink, [x, 7.5, 46], [0, 0, 0], [2.3, 15, 2.3]); B.add(DOME, gold, [x, 15, 46], [0, 0, 0], [2.4, 2.6, 2.4]); B.add(CONE, gold, [x, 17.9, 46], [0, 0, 0], [0.2, 1, 0.2]); }
    for (const side of [-1, 1]) { B.add(BOX, pink, [side * 60, 4, 46], [0, 0, 0], [92, 8, 3]); for (let k = 0; k < 22; k++) B.add(BOX, pink, [side * (16 + k * 4), 8.5, 46], [0, 0, 0], [2, 1, 3]); }
    lampRow(-14, 12.05, 44.2, 14, 44.2, 30);
    for (const side of [-1, 1]) lampRow(side * 15, 8.05, 44.6, side * 100, 44.6, 60);
    garland(-4.5, 8.4, 43.6, 4.5, 43.6, 1.0);
    // palace at z = -46
    B.add(BOX, white, [0, 7, -50], [0, 0, 0], [34, 14, 12]);
    B.add(BOX, sandD, [0, 14.4, -50], [0, 0, 0], [35, 0.8, 13]);
    B.add(DOME, gold, [0, 14.8, -50], [0, 0, 0], [6, 7, 6]); B.add(CONE, gold, [0, 23, -50], [0, 0, 0], [0.4, 2.4, 0.4]);
    for (const x of [-13, 13]) { B.add(DOME, gold, [x, 14.8, -50], [0, 0, 0], [3, 3.6, 3]); B.add(CYL, white, [x, 7, -43.8], [0, 0, 0], [1.1, 14, 1.1]); }
    for (let k = 0; k < 6; k++) B.add(BOX, toon(0xf4ead6), [0, 0.25 + k * 0.3, -42.5 + k * 0.7], [0, 0, 0], [14 - k, 0.3, 0.8]); // steps
    B.add(BOX, toon(0xffffff, canvasTex(256, 280, (g) => { // carved palace door with gold studs and an arch
      g.fillStyle = "#7a3a1e"; g.fillRect(0, 0, 256, 280);
      g.fillStyle = "#e8c48a"; g.beginPath(); g.moveTo(0, 0); g.lineTo(256, 0); g.lineTo(256, 70); g.quadraticCurveTo(128, -10, 0, 70); g.closePath(); g.fill();
      g.strokeStyle = "#3a1a0e"; g.lineWidth = 6; g.beginPath(); g.moveTo(128, 50); g.lineTo(128, 280); g.stroke();
      for (const x0 of [14, 142]) for (const y0 of [70, 175]) { g.strokeStyle = "#4a220e"; g.lineWidth = 8; g.strokeRect(x0 + 8, y0, 92, 90); }
      g.fillStyle = "#f2c14e"; for (let x = 24; x < 256; x += 26) for (let y = 80; y < 270; y += 26) { g.beginPath(); g.arc(x, y, 3.5, 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = "#f2c14e"; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 70); g.quadraticCurveTo(128, -10, 256, 70); g.stroke();
    })), [0, 3.8, -43.9], [0, 0, 0], [5, 5.5, 0.2]);
    lampRow(-17, 14.85, -43.9, 17, -43.9, 40);
    for (let k = 0; k < 6; k++) lampRow(-7 + k * 0.5, 0.55 + k * 0.3, -42.5 + k * 0.7, 7 - k * 0.5, -42.5 + k * 0.7, 12);
    garland(-2.5, 6.8, -43.7, 2.5, -43.7, 0.8);
    // temple shikhara behind the houses
    B.add(BOX, pink, [26, 4, -20], [0, 0, 0], [10, 8, 10]);
    B.add(CONE, pink, [26, 14, -20], [0, 0, 0], [5.2, 13, 5.2]); B.add(CYL, gold, [26, 21, -20], [0, 0, 0], [0.8, 0.6, 0.8]);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.0), new THREE.MeshBasicMaterial({ color: 0xf28a1a, side: THREE.DoubleSide })); flag.position.set(26.9, 22.6, -20); flag.layers.set(NOINK); R.add(flag);
    B.add(CYL, toon(0x6a4a2a), [26, 22.2, -20], [0, 0, 0], [0.05, 2.4, 0.05]);
    lampRow(21, 8.05, -14.8, 31, -14.8, 20);
    // houses beyond the street (city mass for the aerial shot), all with rooftop lamps
    for (let i = 0; i < 70; i++) {
      const x = (rnd(i + 40) - 0.5) * 140, z = (rnd(i + 41) - 0.5) * 80;
      if (Math.abs(x) < 16 || Math.abs(x - 26) < 8 && Math.abs(z + 20) < 8) continue;
      const h = 4 + rnd(i + 42) * 5, w = 6 + rnd(i + 43) * 4;
      B.add(BOX, toon(0xffffff, facadeTex(["#e8c48a", "#e8a48a", "#f0d8a8"][i % 3], i % 2 === 0)), [x, h / 2, z], [0, 0, 0], [w, h, w]);
      if (i % 3 === 0) B.add(DOME, i % 2 ? gold : white, [x, h, z], [0, 0, 0], [w * 0.3, w * 0.35, w * 0.3]);
      lampRow(x - w / 2, h + 0.02, z + w / 2, x + w / 2, z + w / 2, 6);
      lampRow(x - w / 2, h + 0.02, z - w / 2, x - w / 2, z + w / 2, 6);
    }
    for (const l of D.lamps) if (l.p[0] < 100) city.push(l);
    this.cityFlames = new Flames(R, city, 0.75);
    // a few warm lights so the walls glow orange at night
    for (const [x, y, z] of [[0, 3, 30], [0, 3, 10], [0, 3, -12], [0, 4, -36], [0, 10, 42]] as const) {
      const l = new THREE.PointLight(0xffa040, 0, 30, 1.2); l.position.set(x, y, z); R.add(l); this.warm.push(l);
    }

    // ================= FOREST (x ~ -160) =================
    const trunk = toon(0x5a3d26), leaves = [toon(0x3f7a34), toon(0x4f8a3a), toon(0x2f6a30)];
    for (let i = 0; i < 120; i++) {
      const x = -160 + (rnd(i + 100) - 0.5) * 140, z = (rnd(i + 101) - 0.5) * 140;
      if (Math.abs(x + 160) < 8 && z > -30 && z < 40) continue;          // the path
      if (Math.hypot(x + 150, z + 10) < 9) continue;                     // the hut clearing
      const s = 1 + rnd(i + 102) * 0.9;
      B.add(CYL, trunk, [x, 2 * s, z], [0, 0, 0], [0.35 * s, 4 * s, 0.35 * s]);
      for (let k = 0; k < 3; k++) B.add(ICO, leaves[(i + k) % 3], [x + (rnd(i * 3 + k) - 0.5) * 3 * s, (4.8 + k) * s, z + (rnd(i * 5 + k) - 0.5) * 3 * s], [0, 0, 0], [2.4 * s, 2 * s, 2.4 * s]);
    }
    for (let i = 0; i < 80; i++) { const x = -160 + (rnd(i + 300) - 0.5) * 60, z = (rnd(i + 301) - 0.5) * 80; if (Math.abs(x + 160) < 3 || Math.hypot(x + 150, z + 10) < 6) continue; B.add(ICO, leaves[i % 3], [x, 0.45, z], [0, 0, 0], [1.1, 0.8, 1.1]); }
    const path = new THREE.Mesh(new THREE.PlaneGeometry(5, 90), toon(0xb08a5a)); path.rotation.x = -Math.PI / 2; path.position.set(-160, 0.03, 0); R.add(path);
    // the hut (kutia)
    B.add(CYL, toon(0xa87a4a), [-150, 1.2, -10], [0, 0, 0], [3, 2.4, 3]);
    B.add(CONE, toon(0xd9b55a), [-150, 3.6, -10], [0, 0, 0], [3.8, 2.8, 3.8]);
    B.add(BOX, toon(0x3a2418), [-150, 0.9, -7.05], [0, 0, 0], [1.1, 1.8, 0.1]);
    const river = new THREE.Mesh(new THREE.PlaneGeometry(14, 160), toon(0x4f9ad0)); river.rotation.x = -Math.PI / 2; river.position.set(-128, 0.04, 0); R.add(river);
    // rocks for Lanka (same forest, red sky)
    for (let i = 0; i < 18; i++) B.add(ICO, toon(0x6a5a5a), [-175 + rnd(i + 500) * 30, 0.6, -40 + rnd(i + 501) * 25], [rnd(i), rnd(i + 1), 0], [1.5 + rnd(i + 2) * 2, 1 + rnd(i + 3), 1.5 + rnd(i + 4) * 2]);

    // ================= MODERN STREET (x ~ +160) =================
    const home: { p: [number, number, number]; order: number }[] = [];
    const homeRow = (x0: number, y: number, z0: number, x1: number, z1: number, n: number, o0: number, o1: number) => {
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : i / (n - 1), x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
        B.add(CYL, toon(0xb5532c), [x, y + 0.03, z], [0, 0, 0], [0.07, 0.06, 0.07]);
        home.push({ p: [x, y + 0.13, z], order: o0 + (o1 - o0) * t });
      }
    };
    const strings: { p: [number, number, number]; order: number; tint: [number, number, number] }[] = [];
    const cols: [number, number, number][] = [[1, 0.3, 0.4], [1, 0.8, 0.2], [0.3, 0.8, 1], [0.4, 1, 0.5], [1, 0.5, 0.15]];
    for (let i = 0; i < 7; i++) for (const side of [-1, 1]) {
      const z = -30 + i * 10, x = 160 + side * 10.5, h = 7 + (i % 3) * 1.4, w = 9, d = 7;
      const mat = toon(0xffffff, windowLit(["#e9d9c0", "#d7e3c9", "#f0c9b9", "#cfd8e8", "#f2e2a8"][(i + (side > 0 ? 2 : 0)) % 5]));
      B.add(BOX, mat, [x, h / 2, z], [0, 0, 0], [d, h, w]);
      B.add(BOX, toon(0xf4f1e8), [x, h + 0.2, z], [0, 0, 0], [d + 0.3, 0.4, w + 0.3]);
      // balcony with railing at the first floor
      const bx = x - side * (d / 2 + 0.7);
      B.add(BOX, toon(0xf4f1e8), [bx, 3.6, z], [0, 0, 0], [1.4, 0.2, w * 0.7]);
      B.add(BOX, toon(0x7a5a3a), [bx - side * 0.65, 4.2, z], [0, 0, 0], [0.08, 0.06, w * 0.7]);
      for (let k = 0; k < 7; k++) B.add(BOX, toon(0x7a5a3a), [bx - side * 0.65, 3.95, z - w * 0.35 + k * w * 0.7 / 6], [0, 0, 0], [0.06, 0.5, 0.06]);
      homeRow(bx - side * 0.65, 4.23, z - w * 0.32, bx - side * 0.65, z + w * 0.32, 8, 0.3 + i * 0.05, 0.6 + i * 0.05);
      // door, steps, rangoli, doorstep lamps
      const dx = x - side * (d / 2 + 0.02);
      B.add(BOX, toon(0x7a3a2a), [dx, 1.1, z + 2.5], [0, 0, 0], [0.1, 2.2, 1.2]);
      B.add(BOX, toon(0xd9d2c4), [dx - side * 0.6, 0.12, z + 2.5], [0, 0, 0], [1.2, 0.24, 2]);
      homeRow(dx - side * 1.3, 0.02, z + 1.4, dx - side * 1.3, z + 3.6, 5, 0.0 + i * 0.02, 0.15 + i * 0.02);
      const rg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: rangoliTex(i + (side > 0 ? 3 : 0)), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      rg.rotation.x = -Math.PI / 2; rg.position.set(dx - side * 2.6, 0.04, z + 2.5); rg.layers.set(NOINK); R.add(rg);
      garland(dx - side * 0.06, 2.35, z + 1.8, dx - side * 0.06, z + 3.2, 0.2);
      // string lights along the roof edge
      for (let k = 0; k < 24; k++) { const zz = z - w / 2 + (k + 0.5) * w / 24, sag = 0.25 * Math.sin((k % 6) / 6 * Math.PI); strings.push({ p: [x - side * (d / 2 + 0.1), h - 0.15 - sag, zz], order: 0, tint: cols[k % cols.length] }); }
    }
    for (const [x, y, z] of [[154.5, 2.2, 12.5], [165.5, 2.2, 2.5], [154.5, 2.2, -7.5], [165.5, 2.2, -17.5], [154.5, 5, 10]] as const) {
      const l = new THREE.PointLight(0xffa850, 0, 16, 1.3); l.position.set(x, y, z); R.add(l); this.warm.push(l);
    }
    const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 120), toon(0x4a4a52)); road.rotation.x = -Math.PI / 2; road.position.set(160, 0.03, 0); R.add(road);
    for (let k = 0; k < 6; k++) { B.add(CYL, toon(0x6a6a6a), [154.6, 4, -30 + k * 12], [0, 0, 0], [0.12, 8, 0.12]); }
    // background towers for the final crane
    for (let i = 0; i < 40; i++) {
      const x = 160 + (rnd(i + 900) - 0.5) * 180, z = -70 - rnd(i + 901) * 90, h = 8 + rnd(i + 902) * 22, w = 8 + rnd(i + 903) * 8;
      B.add(BOX, toon(0xffffff, windowLit(["#5a5a7a", "#6a5a6a", "#4a5a7a"][i % 3])), [x, h / 2, z], [0, 0, 0], [w, h, w]);
      for (let k = 0; k < 20; k++) strings.push({ p: [x - w / 2 + (k + 0.5) * w / 20, h + 0.1, z + w / 2], order: 0, tint: cols[(k + i) % cols.length] });
    }
    for (const l of D.lamps) if (l.p[0] >= 100) home.push(l);
    this.homeFlames = new Flames(R, home, 0.45);
    this.lanterns = new Flames(R, D.lanterns, 0.42);
    this.skyLanterns = new Flames(R, Array.from({ length: 36 }, () => ({ p: [0, 0, 0] as [number, number, number], order: 0, tint: [1, 0.6, 0.2] as [number, number, number] })), 1.1);
    this.stringLights = new Flames(R, strings, 0.26);
    this.streetFlames = this.homeFlames;
    // fireworks: 8 bursts x 70 sparks, positions updated per frame
    const fw: { p: [number, number, number]; order: number; tint: [number, number, number] }[] = [];
    const fcols: [number, number, number][] = [[1, 0.4, 0.6], [0.5, 0.9, 1], [1, 0.85, 0.3], [0.6, 1, 0.5], [1, 0.5, 0.2], [0.9, 0.6, 1]];
    for (let b = 0; b < 8; b++) {
      const c = new THREE.Vector3(160 + (rnd(b + 70) - 0.5) * 70, 28 + rnd(b + 71) * 18, -40 - rnd(b + 72) * 40);
      this.fwData.push({ c, t0: 0.9 * b, col: fcols[b % fcols.length] });
      for (let k = 0; k < 70; k++) fw.push({ p: [c.x, c.y, c.z], order: 0, tint: fcols[b % fcols.length] });
    }
    this.fireworks = new Flames(R, fw, 1.6);
    // falling petals (Ayodhya welcome)
    const pet: { p: [number, number, number]; order: number; tint: [number, number, number] }[] = [];
    for (let k = 0; k < 160; k++) pet.push({ p: [0, 0, 0], order: 0, tint: k % 2 ? [1, 0.55, 0.1] : [1, 0.85, 0.15] });
    this.petals = new Flames(R, pet, 0.2);
    // the arrow
    this.arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6), new THREE.MeshBasicMaterial({ color: 0xfff1b0, toneMapped: false }));
    this.arrow.rotation.z = Math.PI / 2; this.arrow.layers.set(NOINK); R.add(this.arrow);

    B.build(R);
    this.sun.position.set(60, 80, 60); R.add(this.hemi, this.sun, this.sun.target);
  }

  set(o: { light: LightName; t: number; city?: number; home?: number; strings?: number; fireworks?: number; petals?: number; arrow?: number | null; px: number }) {
    const L = o.light;
    this.skyMat.map = this.skies[L]; this.skyMat.needsUpdate = true;
    const P = {
      golden: { hs: 0xffe0c0, hg: 0x8a6a4a, hi: 1.7, sc: 0xffc890, si: 2.4, sp: [-60, 40, 80], fog: 0xffd9a0, fn: 80, ff: 500, warm: 0 },
      forest: { hs: 0xe0f0ff, hg: 0x4a6a3a, hi: 1.6, sc: 0xfff2d8, si: 2.4, sp: [40, 90, 30], fog: 0xe2f0f2, fn: 60, ff: 380, warm: 0 },
      dusk: { hs: 0xc8a0c8, hg: 0x4a3a50, hi: 1.3, sc: 0xffa070, si: 1.8, sp: [-40, 20, 120], fog: 0xf6a86a, fn: 80, ff: 500, warm: 4 },
      night: { hs: 0x5a5aa0, hg: 0x2a1a20, hi: 1.4, sc: 0x8a90d0, si: 0.7, sp: [-40, 80, -60], fog: 0x2a2246, fn: 90, ff: 520, warm: 12 },
      fire: { hs: 0xff9a7a, hg: 0x3a1010, hi: 1.3, sc: 0xff6a3a, si: 2.0, sp: [-60, 20, -80], fog: 0xf07a2a, fn: 60, ff: 400, warm: 0 },
      modern: { hs: 0x6a6ab0, hg: 0x3a2a30, hi: 1.7, sc: 0x9a90d0, si: 0.9, sp: [-40, 80, -60], fog: 0x3a2a50, fn: 90, ff: 520, warm: 0 },
    }[L];
    this.hemi.color.set(P.hs); this.hemi.groundColor.set(P.hg); this.hemi.intensity = P.hi;
    this.sun.color.set(P.sc); this.sun.intensity = P.si; this.sun.position.set(...(P.sp as [number, number, number]));
    this.fog.color.set(P.fog); this.fog.near = P.fn; this.fog.far = P.ff;
    const city = o.city ?? 0;
    this.warm.forEach((l, i) => { l.intensity = i < 5 ? P.warm * Math.min(1, city * 1.5) : (L === "modern" ? 10 * Math.min(1, (o.home ?? 0) * 2) : 0); });
    for (const f of [this.cityFlames, this.homeFlames, this.stringLights, this.fireworks, this.petals, this.lanterns, this.skyLanterns]) { f.mat.uniforms.uTime.value = o.t; f.mat.uniforms.uPx.value = o.px; }
    this.lanterns.mat.uniforms.uLit.value = o.strings ?? 0;
    this.skyLanterns.mat.uniforms.uLit.value = o.strings ?? 0;
    const sl = this.skyLanterns.pts.geometry.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < 36; k++) sl.setXYZ(k, ...skyLanternPos(k, o.t));
    sl.needsUpdate = true;
    this.cityFlames.mat.uniforms.uLit.value = city * 1.05;
    this.homeFlames.mat.uniforms.uLit.value = (o.home ?? 0) * 1.05;
    this.stringLights.mat.uniforms.uLit.value = o.strings ?? 0;
    // fireworks
    const fwOn = o.fireworks ?? 0, pos = this.fireworks.pts.geometry.attributes.position as THREE.BufferAttribute;
    this.fireworks.mat.uniforms.uLit.value = fwOn > 0 ? 1 : 0;
    this.fwData.forEach((b, bi) => {
      const age = ((o.t - b.t0) % 3.6 + 3.6) % 3.6, r = 9 * (1 - Math.exp(-age * 2.2)), drop = 1.2 * age * age;
      for (let k = 0; k < 70; k++) {
        const th = k * 2.399, ph = Math.acos(1 - (2 * (k + 0.5)) / 70);
        const i = bi * 70 + k, live = age < 2.2;
        pos.setXYZ(i, b.c.x + r * Math.sin(ph) * Math.cos(th), live ? b.c.y + r * Math.cos(ph) - drop : -999, b.c.z + r * Math.sin(ph) * Math.sin(th));
      }
    });
    pos.needsUpdate = true;
    // petals falling around the gate (x 0, z 38)
    const pp = this.petals.pts.geometry.attributes.position as THREE.BufferAttribute, pk = o.petals ?? 0;
    this.petals.mat.uniforms.uLit.value = pk > 0 ? 1 : 0;
    for (let k = 0; k < 160; k++) {
      const fall = (o.t * (0.8 + rnd(k) * 0.6) + rnd(k + 1) * 9) % 9;
      pp.setXYZ(k, (rnd(k + 2) - 0.5) * 14 + Math.sin(o.t * 1.5 + k) * 0.4, 9 - fall, 36 + (rnd(k + 3) - 0.5) * 10);
    }
    pp.needsUpdate = true;
    // the arrow (forest/Lanka): flies from Rama (-162, 1.6, 2) to Ravana (-150, 2.4, -26)
    if (o.arrow == null || o.arrow <= 0 || o.arrow >= 1) this.arrow.visible = false;
    else {
      const a = o.arrow, from = new THREE.Vector3(-161, 1.75, 4), to = new THREE.Vector3(-152, 2.6, -24);
      this.arrow.visible = true; this.arrow.position.lerpVectors(from, to, a);
      this.arrow.lookAt(to); this.arrow.rotateX(Math.PI / 2);
    }
  }
}
