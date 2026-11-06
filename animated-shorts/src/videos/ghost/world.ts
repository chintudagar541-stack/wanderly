// "The Ghost Army": French countryside 1944 as toon-shaded boxes with painted Canvas2D textures.
// Areas (metres, y up): the fake army field around the origin (rows of inflatable tanks, trucks, tents, artillery),
// the German foxhole on a rise at z ~ +62 looking down the field toward -z, a town street with a cafe at x ~ +120,
// a road at x ~ -60 where a German column approaches. World ink from the bridge InkPass; cards on NOINK.
import * as THREE from "three";
import { NOINK } from "../bridge/ink";
import { Pen, INK } from "../dead/toon";

export type LightName = "dawn" | "day" | "night" | "golden";

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
};
const rnd = (i: number) => { const v = Math.sin(i * 127.1 + 17.3) * 43758.5453; return v - Math.floor(v); };

const grassTex = () => canvasTex(512, 512, (g) => {
  g.fillStyle = "#7d9a4a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    const x = rnd(i) * 512, y = rnd(i + 999) * 512, v = rnd(i + 3);
    g.fillStyle = v < 0.5 ? "rgba(70,100,40,0.35)" : "rgba(160,180,90,0.3)";
    g.fillRect(x, y, 2 + v * 3, 6 + v * 8);
  }
}, [60, 60]);
const treadTex = () => canvasTex(64, 512, (g) => {
  g.clearRect(0, 0, 64, 512);
  g.fillStyle = "rgba(70,52,30,0.85)";
  for (let y = 0; y < 512; y += 24) { g.fillRect(4, y, 22, 14); g.fillRect(38, y, 22, 14); }
}, [1, 6]);
const starTex = () => canvasTex(128, 128, (g) => {
  g.fillStyle = "rgba(0,0,0,0)"; g.clearRect(0, 0, 128, 128);
  g.strokeStyle = "#f2f0e6"; g.lineWidth = 8; g.beginPath(); g.arc(64, 64, 54, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#f2f0e6"; g.beginPath();
  for (let k = 0; k < 10; k++) { const r = k % 2 ? 18 : 46, a = (k * 36 - 90) * Math.PI / 180; g.lineTo(64 + r * Math.cos(a), 64 + r * Math.sin(a)); }
  g.closePath(); g.fill();
});
const facadeTex = (base: string) => canvasTex(256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (const [x, y] of [[40, 40], [150, 40], [40, 140], [150, 140]]) {
    g.fillStyle = "#2c3446"; g.fillRect(x, y, 60, 70);
    g.strokeStyle = "#f1ead6"; g.lineWidth = 6; g.strokeRect(x, y, 60, 70); g.beginPath(); g.moveTo(x + 30, y); g.lineTo(x + 30, y + 70); g.stroke();
    g.fillStyle = "#3f6a8a"; g.fillRect(x - 14, y, 12, 70); g.fillRect(x + 62, y, 12, 70);
  }
});
const skyTex = (top: string, mid: string, hor: string, stars = false) => canvasTex(16, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, top); gr.addColorStop(0.42, mid); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor);
  g.fillStyle = gr; g.fillRect(0, 0, 16, 512);
  if (stars) for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,240,${0.3 + rnd(i) * 0.5})`; g.fillRect(rnd(i + 5) * 16, rnd(i + 9) * 200, 1, 1); }
});
const awningTex = () => canvasTex(128, 64, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f1ead6" : "#c0453f"; g.fillRect(i * 16, 0, 16, 64); }
});

const ramp = (() => { const t = new THREE.DataTexture(new Uint8Array([100, 185, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const MATS = new Map<string, THREE.MeshToonMaterial>();
export const toon = (color: THREE.ColorRepresentation, map?: THREE.Texture) => {
  const key = map ? "" : String(color);
  if (key && MATS.has(key)) return MATS.get(key)!;
  const m = new THREE.MeshToonMaterial({ color, map: map ?? null, gradientMap: ramp });
  if (key) MATS.set(key, m);
  return m;
};

const B = (w: number, h: number, d: number, m: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0, parent?: THREE.Object3D) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); mesh.position.set(x, y, z); parent?.add(mesh); return mesh;
};
const C = (rt: number, rb: number, h: number, m: THREE.Material, seg = 16) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);

// ---------------- vehicles ----------------
const STAR = starTex();
/** Sherman-ish (us) or a grey panzer-ish (de) tank, nose toward +x, about 6 m long */
export const makeTank = (kind: "us" | "de") => {
  const g = new THREE.Group(), body = new THREE.Group();
  g.add(body);
  const col = kind === "us" ? 0x5f6b3a : 0x6b726b, dark = toon(0x2a2a26), m = toon(col);
  B(5.8, 0.95, 2.0, m, 0, 1.0, 0, body);
  for (const z of [-1.2, 1.2]) {
    B(6.0, 1.0, 0.6, dark, 0, 0.55, z, body);
    for (let i = 0; i < 6; i++) { const w = C(0.36, 0.36, 0.12, toon(0x3a3a34), 14); w.rotation.x = Math.PI / 2; w.position.set(-2.3 + i * 0.92, 0.45, z * 1.27); body.add(w); }
  }
  const up = B(kind === "us" ? 4.4 : 4.8, 0.7, 2.5, m, -0.2, 1.8, 0, body);
  if (kind === "us") up.scale.set(1, 1, 1);
  const tur = kind === "us" ? C(1.0, 1.15, 0.85, m, 20) : B(2.2, 0.75, 1.9, m);
  tur.position.set(-0.3, 2.55, 0); body.add(tur);
  const gun = C(0.09, 0.11, 2.8, m, 10); gun.rotation.z = Math.PI / 2; gun.position.set(1.9, 2.55, 0); body.add(gun);
  B(0.4, 0.5, 0.7, m, 0.65, 2.55, 0, body);
  if (kind === "us") for (const z of [-1.26, 1.26]) {
    const st = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: STAR, transparent: true, depthWrite: false }));
    st.position.set(-0.2, 1.8, z); if (z < 0) st.rotation.y = Math.PI; st.layers.set(NOINK); body.add(st);
  }
  g.userData.body = body;
  return g;
};
/** inflatable look: deflate 0 = full, 1 = flat rubber puddle; wob = jiggle */
export const setInflate = (tank: THREE.Group, deflate: number, wob = 0) => {
  const b = tank.userData.body as THREE.Group, d = Math.max(0, Math.min(1, deflate));
  const sy = Math.max(0.06, 1 - 0.94 * d * d * (3 - 2 * d));
  b.scale.set(1 + 0.12 * d + wob * 0.03, sy * (1 + wob * 0.04), 1 + 0.18 * d - wob * 0.03);
  b.rotation.z = 0.05 * d * Math.sin(d * 9) + wob * 0.02;
};
export const makeTruck = (speakers = false) => {
  const g = new THREE.Group(), m = toon(0x5f6b3a), dark = toon(0x2a2a26);
  B(4.6, 0.3, 2.1, dark, 0, 0.75, 0, g);
  B(1.5, 1.3, 2.0, m, 1.7, 1.55, 0, g); B(0.05, 0.6, 1.6, toon(0x9fc3d9), 2.46, 1.85, 0, g);
  B(1.0, 0.7, 2.0, m, 2.65, 1.25, 0, g);
  for (const [x, z] of [[2.0, -1.0], [2.0, 1.0], [-1.0, -1.0], [-1.0, 1.0], [-1.9, -1.0], [-1.9, 1.0]]) { const w = C(0.48, 0.48, 0.32, toon(0x222222), 14); w.rotation.x = Math.PI / 2; w.position.set(x, 0.48, z); g.add(w); }
  if (!speakers) {
    const cover = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 3.0, 16, 1, false, 0, Math.PI), toon(0x6f7a48));
    cover.rotation.z = Math.PI / 2; cover.rotation.y = Math.PI / 2; cover.rotation.order = "YZX"; cover.position.set(-0.8, 1.0, 0); g.add(cover);
    B(3.0, 0.6, 2.1, m, -0.8, 1.2, 0, g);
  } else {
    B(3.0, 0.6, 2.1, m, -0.8, 1.2, 0, g);
    const horns: THREE.Mesh[] = [];
    for (const [z, y] of [[-0.55, 2.35], [0.55, 2.35], [0, 3.35]] as const) {
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.18, 1.5, 18, 1, true), toon(0x8a8f80));
      h.material.side = THREE.DoubleSide; h.rotation.z = Math.PI / 2; h.position.set(-1.0, y, z); g.add(h); horns.push(h);
      B(0.6, 0.6, 0.6, toon(0x3a3d36), -1.9, y, z, g);
    }
    g.userData.horns = horns;
  }
  return g;
};
export const makeGun = () => {
  const g = new THREE.Group(), m = toon(0x5f6b3a);
  const barrel = C(0.12, 0.16, 4.2, m, 12); barrel.rotation.z = Math.PI / 2 - 0.25; barrel.position.set(1.4, 1.6, 0); g.add(barrel);
  B(0.15, 1.3, 2.0, m, 0, 1.2, 0, g);
  for (const z of [-0.9, 0.9]) { const w = C(0.65, 0.65, 0.25, toon(0x2a2a26), 16); w.rotation.x = Math.PI / 2; w.position.set(0, 0.65, z); g.add(w); }
  for (const z of [-0.5, 0.5]) { const tr = B(3.0, 0.15, 0.15, m, -1.6, 0.4, z * (1 + 0.4), g); tr.rotation.z = 0.15; tr.rotation.y = z * 0.3; }
  return g;
};
export const makeTent = () => {
  const t = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 4.0, 3, 1), toon(0x6f7a48));
  t.rotation.z = Math.PI / 2; t.rotation.order = "ZYX"; t.position.y = 0.8;
  const g = new THREE.Group(); g.add(t); return g;
};
const makeTree = (s: number, seed: number) => {
  const g = new THREE.Group();
  const tr = C(0.25 * s, 0.35 * s, 3 * s, toon(0x5a3d26), 8); tr.position.y = 1.5 * s; g.add(tr);
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry((1.8 + rnd(seed + i) * 0.8) * s, 1), toon(i % 2 ? 0x4f7a3a : 0x5d8a40));
    b.position.set((rnd(seed + i * 3) - 0.5) * 2 * s, (3.6 + i * 0.9) * s, (rnd(seed + i * 5) - 0.5) * 2 * s); g.add(b);
  }
  return g;
};

// ---------------- the world ----------------
export class World {
  root = new THREE.Group();
  hemi = new THREE.HemisphereLight(0xcfe0ff, 0x56603a, 1.6);
  sun = new THREE.DirectionalLight(0xfff0d0, 2.4);
  sky: THREE.Mesh; skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false });
  skies: Record<LightName, THREE.Texture>;
  fake: THREE.Group[] = [];        // the inflatable army, rows
  hero: THREE.Group;               // the tank that deflates at "fake"
  inflating: THREE.Group;          // the tank being pumped up
  hose: THREE.Mesh;
  german: THREE.Group[] = [];      // German column on the road
  speaker: THREE.Group;
  tracks: THREE.Mesh;              // fake tank tracks drawn by the roller guy
  roller: THREE.Group;
  finale: THREE.Group;             // the tank on the hill at sunset
  ghosts: THREE.Mesh[] = [];       // night: imagined army silhouettes
  ghostMat: THREE.MeshBasicMaterial;
  moon: THREE.Mesh;
  fog = new THREE.Fog(0xb8d0ec, 60, 420);
  rings: THREE.Mesh[] = [];

  constructor() {
    const R = this.root;
    this.skies = {
      dawn: skyTex("#5b74b8", "#e9a98a", "#f6d3a8"), day: skyTex("#3e7fd2", "#8fb6e6", "#cfe0f2"),
      night: skyTex("#070b22", "#18204a", "#2a3160", true), golden: skyTex("#4a5aa8", "#ffb07a", "#ffd08a"),
    };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(600, 24, 16), this.skyMat); this.sky.layers.set(NOINK); R.add(this.sky);
    this.moon = new THREE.Mesh(new THREE.CircleGeometry(9, 32), new THREE.MeshBasicMaterial({ color: 0xf6f0d0, fog: false, toneMapped: false }));
    this.moon.position.set(-90, 120, -420); this.moon.lookAt(0, 0, 0); this.moon.layers.set(NOINK); R.add(this.moon);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), toon(0xffffff, grassTex()));
    ground.rotation.x = -Math.PI / 2; R.add(ground);
    // distant hills
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2, r = 330 + rnd(i) * 80;
      const h = new THREE.Mesh(new THREE.SphereGeometry(70 + rnd(i + 1) * 50, 16, 8), toon(i % 2 ? 0x6f8f45 : 0x7d9a4a));
      h.scale.y = 0.35; h.position.set(Math.cos(a) * r, -8, Math.sin(a) * r); R.add(h);
    }
    // the rise with the German foxhole (z ~ 62)
    const rise = new THREE.Mesh(new THREE.SphereGeometry(30, 24, 12), toon(0x7d9a4a)); rise.scale.set(1.4, 0.12, 0.8); rise.position.set(0, -1.2, 70); R.add(rise);
    for (let i = 0; i < 9; i++) { const sb = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 4, 8), toon(0xb9a37a)); sb.rotation.z = Math.PI / 2; sb.position.set(-2 + i * 0.5, 2.15 + (i % 2) * 0.2, 60.6); R.add(sb); }
    // hedgerows and trees around the field
    for (let i = 0; i < 10; i++) B(16, 2.2, 2.2, toon(0x4a7234), -90 + i * 20, 1.1, -70 + (i % 2) * 2, R);
    for (let i = 0; i < 26; i++) {
      const t = makeTree(1 + rnd(i) * 0.5, i * 7);
      const side = i % 2 ? 1 : -1, z = -60 + i * 6 + rnd(i) * 4;
      if (side < 0 && z > 15) continue; // keep the German road clear
      t.position.set(side * (55 + rnd(i + 2) * 40), 0, z); R.add(t);
    }
    // ---- the fake army: rows of tanks, trucks, tents, guns ----
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
      const tk = makeTank("us"); tk.position.set(-28 + c * 11 + (r % 2) * 4, 0, -8 - r * 10); tk.rotation.y = Math.PI / 2 + (rnd(r * 6 + c) - 0.5) * 0.3;
      R.add(tk); this.fake.push(tk);
    }
    this.hero = makeTank("us"); this.hero.position.set(4, 0, 14); this.hero.rotation.y = 0.55; R.add(this.hero);
    for (let i = 0; i < 6; i++) { const tr = makeTruck(); tr.position.set(-30 + i * 8, 0, -52); tr.rotation.y = Math.PI / 2; R.add(tr); }
    for (let i = 0; i < 8; i++) { const te = makeTent(); te.position.set(-34 + (i % 4) * 9, 0, 24 + Math.floor(i / 4) * 8); R.add(te); }
    for (let i = 0; i < 3; i++) { const gn = makeGun(); gn.position.set(22 + i * 7, 0, 22); gn.rotation.y = -Math.PI / 2 - 0.2; R.add(gn); }
    // the inflating tank + compressor + hose
    this.inflating = makeTank("us"); this.inflating.position.set(-18, 0, 40); this.inflating.rotation.y = 0.3; R.add(this.inflating);
    B(1.2, 0.9, 0.8, toon(0x8a5a2a), -14.8, 0.45, 42.4, R);
    this.hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-14.8, 0.6, 42.4), new THREE.Vector3(-15.6, 0.05, 42.0), new THREE.Vector3(-16.6, 0.1, 41.6), new THREE.Vector3(-17.0, 0.8, 41.2)]), 20, 0.07, 6), toon(0x222222));
    R.add(this.hose);
    // fake tracks (revealed by the roller) + the roller
    this.tracks = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 24), new THREE.MeshBasicMaterial({ map: treadTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    this.tracks.rotation.x = -Math.PI / 2; this.tracks.rotation.z = Math.PI / 2; this.tracks.position.set(30, 0.02, 34); this.tracks.layers.set(NOINK); R.add(this.tracks);
    this.roller = new THREE.Group();
    const rc = C(0.35, 0.35, 1.4, toon(0x6b4a2e), 14); rc.rotation.x = Math.PI / 2; rc.position.y = 0.35; this.roller.add(rc);
    const handle = C(0.04, 0.04, 1.6, toon(0x3a2a1c), 6); handle.rotation.z = -1.0; handle.position.set(-0.65, 0.85, 0); this.roller.add(handle);
    R.add(this.roller);
    // speaker truck (night)
    this.speaker = makeTruck(true); this.speaker.position.set(-6, 0, 30); this.speaker.rotation.y = -0.5; R.add(this.speaker);
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.05, 48), new THREE.MeshBasicMaterial({ color: 0xcfe4ff, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }));
      r.layers.set(NOINK); this.speaker.add(r); r.position.set(-1.9, 2.8, 0); r.rotation.y = Math.PI / 2; this.rings.push(r);
    }
    // night ghosts: imagined tanks/columns along the horizon (cards)
    this.ghostMat = new THREE.MeshBasicMaterial({ map: canvasTex(1200, 400, (g) => {
      const p = new Pen(g); g.clearRect(0, 0, 1200, 400);
      for (const x0 of [40, 440, 840]) {
        p.poly([[x0, 330], [x0 + 300, 330], [x0 + 320, 290], [x0 + 260, 250], [x0 + 40, 250], [x0 - 20, 290]], "#b9d4ff", 10);
        p.poly([[x0 + 90, 250], [x0 + 210, 250], [x0 + 200, 190], [x0 + 100, 190]], "#b9d4ff", 10);
        p.stroke([[x0 + 200, 215], [x0 + 340, 205]], 14, "#b9d4ff");
        for (let i = 0; i < 5; i++) p.ell(x0 + 30 + i * 60, 330, 26, 26, "#b9d4ff", 8);
      }
    }), transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false });
    for (let i = 0; i < 3; i++) {
      const gm = new THREE.Mesh(new THREE.PlaneGeometry(60, 20), this.ghostMat);
      gm.position.set(-60 + i * 55, 12 + i * 3, -140 - i * 20); gm.scale.setScalar(1.4); gm.layers.set(NOINK); R.add(gm); this.ghosts.push(gm);
    }
    // German column on the road (x ~ -60), heading toward the field
    for (let i = 0; i < 5; i++) { const tk = makeTank("de"); tk.rotation.y = -0.6; R.add(tk); this.german.push(tk); }
    const road = new THREE.Mesh(new THREE.PlaneGeometry(8, 300), toon(0xa58a62)); road.rotation.x = -Math.PI / 2; road.rotation.z = -0.6; road.position.set(-70, 0.01, 40); R.add(road);
    // ---- the town (x ~ 120) with a cafe ----
    const cols = ["#d9b98a", "#c98f6a", "#e3d3b1", "#b98a72", "#d0c09a"];
    for (let i = 0; i < 5; i++) for (const side of [-1, 1]) {
      const h = 7 + rnd(i * 3 + side) * 3, x = 100 + i * 9, z = side * 9;
      B(8.6, h, 7, toon(0xffffff, facadeTex(cols[(i + (side > 0 ? 2 : 0)) % 5])), x, h / 2, z + side * 3.5, R);
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 8.6, 3), toon(0x9a4a3a)); roof.rotation.z = Math.PI / 2; roof.rotation.order = "ZYX";
      roof.rotation.x = side > 0 ? 0 : Math.PI; roof.scale.set(1, 1, 0.9); roof.position.set(x, h + 1.4, z + side * 3.5); R.add(roof);
    }
    const street = new THREE.Mesh(new THREE.PlaneGeometry(60, 11), toon(0x9c958a)); street.rotation.x = -Math.PI / 2; street.position.set(118, 0.01, 0); R.add(street);
    const awn = B(8, 0.12, 2.2, toon(0xffffff, awningTex()), 118, 3.2, -4.4, R); awn.rotation.x = 0.35;
    for (const x of [115.5, 120.5]) {
      const top = C(0.55, 0.55, 0.06, toon(0xf1ead6), 16); top.position.set(x, 0.75, -3.0); R.add(top);
      const leg = C(0.05, 0.05, 0.75, toon(0x333333), 6); leg.position.set(x, 0.38, -3.0); R.add(leg);
      for (const dx of [-0.8, 0.8]) { B(0.45, 0.06, 0.45, toon(0x8a5a2a), x + dx, 0.48, -3.0, R); B(0.06, 0.5, 0.45, toon(0x8a5a2a), x + dx * 1.25, 0.72, -3.0, R); }
      const cup = C(0.06, 0.05, 0.1, toon(0xffffff), 10); cup.position.set(x + 0.15, 0.83, -3.0); R.add(cup);
    }
    // ---- the finale hill (golden): one inflatable on a ridge at (0, 0, -95) ----
    this.finale = makeTank("us"); this.finale.position.set(10, 0, 95); this.finale.rotation.y = 0.2; R.add(this.finale);

    this.sun.position.set(80, 120, 60); this.sun.target.position.set(0, 0, 0);
    R.add(this.hemi, this.sun, this.sun.target);
  }

  set(o: { light: LightName; hero?: number; heroWob?: number; inflate?: number; tracks?: number; roller?: [number, number, number] | null;
    ghosts?: number; german?: number; finale?: number; finaleWob?: number; horns?: number }) {
    const L = o.light;
    this.skyMat.map = this.skies[L]; this.skyMat.needsUpdate = true;
    this.moon.visible = L === "night";
    const P = {
      dawn: { hs: 0xf0c8b0, hg: 0x5a5a3a, hi: 1.5, sc: 0xffc89a, si: 2.0, sp: [-60, 40, 120], fog: 0xf6d3a8 },
      day: { hs: 0xcfe0ff, hg: 0x56603a, hi: 1.7, sc: 0xfff0d0, si: 2.6, sp: [80, 120, 60], fog: 0xcfe0f2 },
      night: { hs: 0x4a5aa0, hg: 0x1a2030, hi: 1.5, sc: 0x9fb4ff, si: 1.5, sp: [-90, 120, -300], fog: 0x2a3160 },
      golden: { hs: 0xffc49a, hg: 0x4a4060, hi: 1.3, sc: 0xffb36b, si: 2.6, sp: [-40, 25, -120], fog: 0xffd08a },
    }[L];
    this.hemi.color.set(P.hs); this.hemi.groundColor.set(P.hg); this.hemi.intensity = P.hi;
    this.sun.color.set(P.sc); this.sun.intensity = P.si; this.sun.position.set(...(P.sp as [number, number, number]));
    this.fog.color.set(P.fog);
    setInflate(this.hero, o.hero ?? 0, o.heroWob ?? 0);
    setInflate(this.inflating, 1 - (o.inflate ?? 1), 0);
    this.hose.visible = (o.inflate ?? 1) < 1.01;
    (this.tracks.material as THREE.MeshBasicMaterial).map!.repeat.set(1, 6);
    this.tracks.scale.y = Math.max(0.001, o.tracks ?? 1);
    this.tracks.position.x = 30 - 12 * (1 - (o.tracks ?? 1));
    this.roller.visible = !!o.roller;
    if (o.roller) this.roller.position.set(...o.roller);
    this.ghostMat.opacity = o.ghosts ?? 0;
    this.ghosts.forEach((g, i) => { g.visible = (o.ghosts ?? 0) > 0; g.position.x = -60 + i * 55 + (_t - 37.5) * 6; });
    const gk = o.german ?? 0, dx = 0.814, dz = -0.581;
    this.german.forEach((tk, i) => { tk.visible = gk > 0; const s = gk * 40 - i * 11; tk.position.set(-110 + dx * s, 0, 60 + dz * s); tk.rotation.y = 0.62; });
    this.rings.forEach((r, i) => {
      const on = o.horns ?? 0, ph = ((_t * 0.9 + i / 3) % 1);
      r.visible = on > 0; r.scale.setScalar(1 + ph * 9); (r.material as THREE.MeshBasicMaterial).opacity = on * 0.55 * (1 - ph);
    });
    setInflate(this.finale, o.finale ?? 0, o.finaleWob ?? 0);
    const horns = this.speaker.userData.horns as THREE.Mesh[];
    horns.forEach((h, i) => h.scale.setScalar(1 + 0.06 * (o.horns ?? 0) * Math.sin(i + (o.horns ?? 0) * 40)));
  }
}
let _t = 0;
export const setWorldTime = (t: number) => { _t = t; };
export { INK };
