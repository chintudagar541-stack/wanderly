// Game-engine style world: PBR materials with painted maps, instanced detail,
// image-based light from the sky. No ink on the world; only characters are inked.
import * as THREE from 'three';
import * as T from './pbr.js';

export const R = T.rng(4242);
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), VS = new THREE.Vector3(), VP = new THREE.Vector3();

/* ---------- instancing batcher: describe parts freely, draw them in a few calls ---------- */
export class Batcher {
  constructor(scene) { this.scene = scene; this.groups = new Map(); }
  add(key, geo, mat, pos, rot = [0, 0, 0], scl = [1, 1, 1], color = null, shadow = true) {
    let g = this.groups.get(key);
    if (!g) { g = { geo, mat, list: [], shadow }; this.groups.set(key, g); }
    E.set(rot[0], rot[1], rot[2]); Q.setFromEuler(E); VP.set(pos[0], pos[1], pos[2]); VS.set(scl[0], scl[1], scl[2]);
    g.list.push({ m: new THREE.Matrix4().compose(VP, Q, VS), c: color });
  }
  addMatrix(key, geo, mat, m, color = null, shadow = true) {
    let g = this.groups.get(key); if (!g) { g = { geo, mat, list: [], shadow }; this.groups.set(key, g); }
    g.list.push({ m: m.clone(), c: color });
  }
  build() {
    const out = [];
    for (const [k, g] of this.groups) {
      const im = new THREE.InstancedMesh(g.geo, g.mat, g.list.length);
      g.list.forEach((it, i) => { im.setMatrixAt(i, it.m); if (it.c) im.setColorAt(i, it.c); });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.castShadow = g.shadow; im.receiveShadow = true; im.name = k;
      im.computeBoundingSphere();
      this.scene.add(im); out.push(im);
    }
    this.groups.clear();
    return out;
  }
}

/* ---------- material library ---------- */
export const STD = [];
export function std(o) { const m = new THREE.MeshStandardMaterial(o); STD.push(m); return m; }
export function pbrMat(set, rx, ry, o = {}) {
  const r = T.rep(set, rx, ry);
  return std({ map: r.map, normalMap: r.normalMap, roughnessMap: r.roughnessMap, roughness: 1, ...o });
}
export const LIB = {};
export function buildLibrary() {
  LIB.bricks = [
    T.brick(11, { hue: 9, sat: 50, lit: 36 }),
    T.brick(12, { hue: 16, sat: 40, lit: 42 }),
    T.brick(13, { hue: 4, sat: 44, lit: 30, mortar: '#a89d8d' }),
    T.brick(14, { hue: 24, sat: 32, lit: 48, mortar: '#c9bfae' }),
  ];
  LIB.stone = T.stone(21, [38, 14, 72]);
  LIB.stoneDark = T.stone(22, [220, 6, 52]);
  LIB.steelGray = T.steel(31, '#7e8791', '#5f4630', .35);
  LIB.steelBrown = T.steel(32, '#6a4528', '#3a1e0c', .45);
  LIB.steelDark = T.steel(33, '#3d434c', '#5a3f2a', .3);
  LIB.planks = T.planks(41, '#7a5a3c', '#3b2616');
  LIB.planksPale = T.planks(42, '#a58a68', '#5a4228');
  LIB.planksDark = T.planks(43, '#5b3c26', '#2a180d', { boards: 8 });
  LIB.snow = T.snow(51);
  LIB.slush = T.slush(52);
  LIB.roof = T.roofing(61);
  LIB.doorPaint = [T.paintedWood(71, '#2e4a3a'), T.paintedWood(72, '#5a2a24'), T.paintedWood(73, '#2b3550'), T.paintedWood(74, '#3a2c22')];
  LIB.trimPaint = [T.paintedWood(75, '#e9e2d2'), T.paintedWood(76, '#2a2f2c'), T.paintedWood(77, '#6b2f28')];
}

/* ---------- sky dome with painted clouds + matching environment light ---------- */
export function skyCanvas(top, mid, horizon, ground, sunDir, sunCol, clouds = 1, stars = false) {
  const w = 2048, h = 1024, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top); g.addColorStop(.32, mid); g.addColorStop(.495, horizon); g.addColorStop(.505, horizon); g.addColorStop(.6, ground); g.addColorStop(1, ground);
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  if (stars) { for (let i = 0; i < 700; i++) { x.globalAlpha = .3 + R() * .7; x.fillStyle = '#fff'; x.fillRect(R() * w, R() * h * .45, R() < .1 ? 2 : 1, R() < .1 ? 2 : 1); } x.globalAlpha = 1; }
  // sun glow at its azimuth/elevation (equirect)
  const az = Math.atan2(sunDir.x, -sunDir.z), el = Math.asin(sunDir.y);
  const sx = (az / (Math.PI * 2) + .5) * w, sy = (.5 - el / Math.PI) * h;
  const sg = x.createRadialGradient(sx, sy, 0, sx, sy, 380);
  sg.addColorStop(0, sunCol); sg.addColorStop(.06, sunCol); sg.addColorStop(.25, 'rgba(255,240,210,.35)'); sg.addColorStop(1, 'rgba(255,240,210,0)');
  x.fillStyle = sg; x.fillRect(0, 0, w, h);
  // cumulus: stacks of soft puffs with lit tops and grey-blue bellies
  for (let i = 0; i < 26 * clouds; i++) {
    const cx = R() * w, cy = h * (.12 + R() * .24), sc = .5 + R() * 1.3;
    for (let p = 0; p < 14; p++) {
      const px = cx + (R() - .5) * 220 * sc, py = cy + (R() - .5) * 40 * sc - Math.abs(R()) * 30 * sc, r = (26 + R() * 46) * sc;
      const cg = x.createRadialGradient(px, py - r * .35, r * .1, px, py, r);
      cg.addColorStop(0, 'rgba(255,255,255,.95)'); cg.addColorStop(.6, 'rgba(236,240,248,.75)'); cg.addColorStop(1, 'rgba(200,212,232,0)');
      x.fillStyle = cg; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
    }
    x.fillStyle = 'rgba(170,186,214,.25)'; x.beginPath(); x.ellipse(cx, cy + 20 * sc, 160 * sc, 18 * sc, 0, 0, 7); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

/* ---------- ground, road setts, kerbs, pavements, snow banks ---------- */
export function sett(variant) {
  // granite sett: box with chamfered top, randomised so no two variants match
  const r = T.rng(900 + variant);
  const geo = new THREE.BoxGeometry(1, 1, 1, 2, 1, 2).toNonIndexed();
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y > 0) { // round the top: pull top edge verts inward and down
      const ex = Math.abs(x) > .45, ez = Math.abs(z) > .45;
      if (ex) x *= .82; if (ez) z *= .8;
      y = .5 - (ex || ez ? .22 : 0) + (r() - .5) * .08;
    }
    p.setXYZ(i, x + (r() - .5) * .05, y, z + (r() - .5) * .05);
  }
  geo.computeVertexNormals();
  return geo;
}
