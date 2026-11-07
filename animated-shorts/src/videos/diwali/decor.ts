// Set dressing for the Diwali short so no frame looks empty: market stalls, pennant strings with hanging lamps,
// pots, banners, kalash, neem trees and a countryside outside the gate in Ayodhya; scooters, cars, plants,
// hanging lanterns, cross-street string lights and floating sky lanterns on the modern street.
// Static pieces are merged per material. Keep-outs follow the camera paths in shots.ts.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { NOINK } from "../bridge/ink";

type Toon = (c: THREE.ColorRepresentation, map?: THREE.Texture) => THREE.Material;
type FlameDef = { p: [number, number, number]; order: number; tint?: [number, number, number] };
const rnd = (i: number) => { const v = Math.sin(i * 91.7 + 47.3) * 43758.5453; return v - Math.floor(v); };

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
const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 12), CONE = new THREE.ConeGeometry(1, 1, 12), ICO = new THREE.IcosahedronGeometry(1, 1);
const SPH = new THREE.SphereGeometry(1, 10, 8), TRI = new THREE.CylinderGeometry(1, 1, 1, 3);

export function decorate(R: THREE.Object3D, toon: Toon) {
  const B = new Batch();
  const lamps: FlameDef[] = [], lanterns: FlameDef[] = [];
  const saffron = toon(0xf28a1a), yellow = toon(0xf6c12a), red = toon(0xd1202f), green = toon(0x2e9a5a), magenta = toon(0xe84a8a), white = toon(0xf4ead6);
  const wood = toon(0x7a5232), clay = toon(0xb5532c), brass = toon(0xd9a83a), leaf = [toon(0x3f7a34), toon(0x4f8a3a), toon(0x2f6a30)], trunk = toon(0x5a3d26);
  const pennantCols = [saffron, yellow, red, green, magenta];
  const tree = (x: number, z: number, s: number, i: number) => {
    B.add(CYL, trunk, [x, 1.8 * s, z], [0, 0, 0], [0.3 * s, 3.6 * s, 0.3 * s]);
    for (let k = 0; k < 3; k++) B.add(ICO, leaf[(i + k) % 3], [x + (rnd(i * 3 + k) - 0.5) * 2.4 * s, (4.2 + k * 0.8) * s, z + (rnd(i * 5 + k) - 0.5) * 2.4 * s], [0, 0, 0], [2.1 * s, 1.7 * s, 2.1 * s]);
  };
  const palm = (x: number, z: number, s: number, i: number) => {
    for (let k = 0; k < 6; k++) B.add(CYL, trunk, [x + Math.sin(k * 0.4) * 0.15 * s, (0.6 + k * 1.1) * s, z], [0, 0, 0.05 * Math.sin(i + k)], [0.22 * s, 1.15 * s, 0.22 * s]);
    for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; B.add(BOX, leaf[k % 3], [x + Math.cos(a) * 1.4 * s, 6.6 * s, z + Math.sin(a) * 1.4 * s], [0, -a, -0.45], [2.8 * s, 0.08 * s, 0.6 * s]); }
  };

  // ================= AYODHYA street =================
  // market stalls along both sides of the street (between the house fronts and the street centre)
  for (let i = 0; i < 7; i++) for (const side of [-1, 1]) {
    const z = -27.5 + i * 9, x = side * 5.9;
    if (side < 0 && z > 12 && z < 25) continue;                       // keep the lamp-lighting shot clear
    B.add(BOX, wood, [x, 0.45, z], [0, 0, 0], [1.4, 0.9, 2.4]);
    for (const [dx, dz] of [[-0.6, -1.1], [0.6, -1.1], [-0.6, 1.1], [0.6, 1.1]]) B.add(CYL, wood, [x + dx, 1.3, z + dz], [0, 0, 0], [0.05, 2.6, 0.05]);
    for (let k = 0; k < 5; k++) B.add(BOX, k % 2 ? pennantCols[(i + 1) % 5] : white, [x, 2.65, z - 1.2 + k * 0.6], [0, 0, side * 0.25], [1.6, 0.06, 0.6]);
    // goods: pots, fruit, cloth
    for (let k = 0; k < 4; k++) {
      const gz = z - 0.9 + k * 0.6, kind = (i + k) % 3;
      if (kind === 0) B.add(SPH, clay, [x, 1.05, gz], [0, 0, 0], [0.2, 0.18, 0.2]);
      else if (kind === 1) for (let f = 0; f < 4; f++) B.add(SPH, f % 2 ? toon(0xf2a33a) : toon(0xe84a3a), [x - 0.2 + f * 0.13, 0.98, gz], [0, 0, 0], [0.08, 0.08, 0.08]);
      else B.add(BOX, pennantCols[(i + k + 2) % 5], [x, 0.95, gz], [0, 0, 0.1], [0.9, 0.08, 0.45]);
    }
  }
  // stacks of clay pots and kalash at doorsteps
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1, z = -30 + Math.floor(i / 2) * 9 + 3.3, x = side * 6.6;
    if (side < 0 && z > 12 && z < 25) continue;
    B.add(SPH, clay, [x, 0.25, z], [0, 0, 0], [0.32, 0.28, 0.32]); B.add(SPH, clay, [x + 0.15, 0.7, z + 0.1], [0, 0, 0], [0.24, 0.2, 0.24]);
    lamps.push({ p: [x, 0.98, z + 0.1], order: (46 - z) / 110 + 0.02 });
  }
  // pennant strings (and hanging lamps) across the street
  for (let i = 0; i < 9; i++) {
    const z = -34 + i * 8.5, y0 = 6.2;
    for (let k = 0; k <= 18; k++) {
      const t = k / 18, x = -7 + 14 * t, y = y0 - 1.0 * 4 * t * (1 - t);
      if (k < 18) B.add(TRI, pennantCols[(k + i) % 5], [x + 0.39, y - 0.25, z], [Math.PI / 2, 0, Math.PI], [0.28, 0.04, 0.42]);
      if (k % 6 === 3) lamps.push({ p: [x, y - 0.55, z], order: (46 - z) / 110 + 0.03 });
    }
  }
  // palace forecourt: banners, kalash, pillars, guards' spears, neem trees
  for (const x of [-9, -5, 5, 9]) {
    B.add(CYL, white, [x, 3.5, -40.5], [0, 0, 0], [0.5, 7, 0.5]);
    B.add(BOX, saffron, [x, 4.3, -40.0], [0, 0, 0], [1.0, 4.6, 0.05]); B.add(BOX, yellow, [x, 2.0, -39.98], [0, 0, 0], [1.0, 0.25, 0.05]);
    B.add(SPH, brass, [x, 0.55, -38.6], [0, 0, 0], [0.45, 0.5, 0.45]); B.add(CONE, leaf[0], [x, 1.25, -38.6], [0, 0, 0], [0.4, 0.5, 0.4]);
    B.add(SPH, toon(0xf2c14e), [x, 1.6, -38.6], [0, 0, 0], [0.22, 0.26, 0.22]);
  }
  for (const [x, z] of [[-14, -36], [14, -36], [-15, -26], [15, -24]] as const) tree(x, z, 1.1, x * z);
  for (const x of [-1.9, 1.9]) { // brass kalash with mango leaves and a coconut beside the palace door
    B.add(SPH, brass, [x, 2.0, -42.9], [0, 0, 0], [0.24, 0.26, 0.24]); B.add(CONE, leaf[0], [x, 2.4, -42.9], [0, 0, 0], [0.22, 0.3, 0.22]);
    B.add(SPH, toon(0x8a5a2a), [x, 2.6, -42.9], [0, 0, 0], [0.13, 0.15, 0.13]);
    for (let k = 0; k < 3; k++) B.add(BOX, pennantCols[k], [x, 6.0 - k * 0.9, -43.75], [0, 0, 0], [0.9, 0.85, 0.04]);
  }
  // ================= outside the gate: countryside =================
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 220), toon(0xc9a46a)); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.035, 158); R.add(road);
  const fields = [toon(0x7fae4a), toon(0x9cbf5a), toon(0xc9b25a), toon(0x6f9a3a)];
  for (let i = 0; i < 26; i++) {
    const side = i % 2 ? 1 : -1, x = side * (14 + rnd(i) * 70), z = 70 + rnd(i + 1) * 170, w = 20 + rnd(i + 2) * 30, d = 15 + rnd(i + 3) * 25;
    const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), fields[i % 4]); f.rotation.x = -Math.PI / 2; f.position.set(x, 0.03 + (i % 3) * 0.003, z); R.add(f);
  }
  for (let i = 0; i < 60; i++) {
    const side = i % 2 ? 1 : -1, x = side * (6 + rnd(i + 10) * 60), z = 52 + rnd(i + 11) * 170;
    if (Math.abs(x) < 6) continue;
    if (i % 3 === 0) palm(x, z, 0.9 + rnd(i) * 0.4, i); else tree(x, z, 0.9 + rnd(i + 3) * 0.6, i);
  }
  for (let i = 0; i < 8; i++) { // a village of huts
    const x = 30 + (i % 4) * 7, z = 120 + Math.floor(i / 4) * 8;
    B.add(CYL, toon(0xa87a4a), [x, 1.0, z], [0, 0, 0], [2.2, 2, 2.2]); B.add(CONE, toon(0xd9b55a), [x, 2.9, z], [0, 0, 0], [2.8, 2.2, 2.8]);
  }
  for (let i = 0; i < 9; i++) { // distant hills
    const a = -0.9 + i * 0.22, r = 300;
    const h = new THREE.Mesh(new THREE.SphereGeometry(60 + rnd(i) * 40, 14, 8), toon(i % 2 ? 0x7a8f5a : 0x6a7f5a));
    h.scale.y = 0.3; h.position.set(Math.sin(a) * r, -6, 60 + Math.cos(a) * r); R.add(h);
  }
  // ================= forest edge extras =================
  for (let i = 0; i < 30; i++) { const x = -160 + (rnd(i + 70) - 0.5) * 200, z = -90 - rnd(i + 71) * 60; tree(x, z, 1.4, i + 70); }

  // ================= MODERN street =================
  const MX = 160;
  const car = (x: number, z: number, col: number) => {
    B.add(BOX, toon(col), [x, 0.6, z], [0, 0, 0], [1.7, 0.7, 3.8]); B.add(BOX, toon(col), [x, 1.15, z - 0.2], [0, 0, 0], [1.5, 0.55, 2.0]);
    B.add(BOX, toon(0x9fc3d9), [x, 1.15, z - 0.2], [0, 0, 0], [1.52, 0.4, 1.7]);
    for (const [dx, dz] of [[-0.8, -1.2], [0.8, -1.2], [-0.8, 1.2], [0.8, 1.2]]) B.add(CYL, toon(0x222222), [x + dx, 0.32, z + dz], [0, 0, Math.PI / 2], [0.32, 0.25, 0.32]);
  };
  const scooter = (x: number, z: number, col: number) => {
    B.add(BOX, toon(col), [x, 0.55, z], [0, 0, 0], [0.45, 0.4, 1.3]); B.add(BOX, toon(col), [x, 0.95, z + 0.5], [0, 0, 0], [0.4, 0.8, 0.2]);
    B.add(BOX, toon(0x222222), [x, 0.85, z - 0.25], [0, 0, 0], [0.42, 0.12, 0.6]); B.add(CYL, toon(0x444444), [x, 1.38, z + 0.55], [0, 0, Math.PI / 2], [0.03, 0.7, 0.03]);
    for (const dz of [-0.5, 0.55]) B.add(CYL, toon(0x222222), [x, 0.22, z + dz], [0, 0, Math.PI / 2], [0.22, 0.12, 0.22]);
  };
  car(MX + 3.0, -6, 0xc0453f); car(MX - 3.0, -22, 0xf4f1e8); car(MX + 3.0, -26, 0x3f6fb0);
  for (const [x, z, c] of [[MX + 4.4, 4, 0x2e9a5a], [MX - 4.2, -2, 0xe8b84a], [MX + 4.4, -14, 0xd1202f], [MX - 4.3, -12, 0x4fc3f7]] as const) scooter(x, z, c);
  for (let i = 0; i < 7; i++) for (const side of [-1, 1]) { // potted plants by the doors
    const z = -30 + i * 10 + 4.2, x = MX + side * 6.4;
    if (side < 0 && z > 10 && z < 17) continue;
    B.add(CYL, clay, [x, 0.3, z], [0, 0, 0], [0.3, 0.6, 0.3]); B.add(ICO, leaf[i % 3], [x, 0.9, z], [0, 0, 0], [0.45, 0.5, 0.45]);
  }
  // hanging lanterns (akash kandil) from the balconies + zig-zag string lights across the street
  for (let i = 0; i < 7; i++) for (const side of [-1, 1]) {
    const z = -30 + i * 10 - 1.5, x = MX + side * 5.6;
    B.add(CYL, toon(0x6a6a6a), [x, 3.0, z], [0, 0, 0], [0.01, 0.6, 0.01]);
    B.add(TRI, pennantCols[(i + (side > 0 ? 2 : 0)) % 5], [x, 2.45, z], [0, i, 0], [0.32, 0.5, 0.32]);
    lanterns.push({ p: [x, 2.45, z], order: 0, tint: [1, 0.55, 0.2] });
  }
  for (let i = 0; i < 6; i++) {
    const z0 = -28 + i * 10;
    for (let k = 0; k <= 20; k++) { const t = k / 20, x = MX - 6 + 12 * t, y = 6.3 - 0.9 * 4 * t * (1 - t); lanterns.push({ p: [x, y, z0 + t * 4], order: 0, tint: ([[1, 0.3, 0.4], [1, 0.8, 0.2], [0.3, 0.8, 1], [0.4, 1, 0.5]] as [number, number, number][])[k % 4] }); }
  }
  for (let i = 0; i < 10; i++) { // little rangoli dots + extra doorstep diyas further down the street
    const side = i % 2 ? 1 : -1, z = -26 + i * 4.5, x = MX + side * 4.6;
    if (z > 8) continue;
    for (let k = 0; k < 3; k++) { B.add(CYL, clay, [x, 0.03, z + k * 0.35], [0, 0, 0], [0.07, 0.06, 0.07]); lamps.push({ p: [x, 0.16, z + k * 0.35], order: 0 }); }
  }
  B.build(R);
  return { lamps, lanterns };
}

/** floating sky lanterns rising over the modern street: n lanterns, positions per time */
export const skyLanternPos = (k: number, t: number): [number, number, number] => {
  const life = 24, age = (t * 0.9 + rnd(k) * life) % life;
  return [160 + (rnd(k + 1) - 0.5) * 70 + Math.sin(t * 0.3 + k) * 2, 6 + age * 2.4, -10 - rnd(k + 2) * 70];
};
export { NOINK };
