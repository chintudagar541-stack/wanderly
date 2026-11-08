// Scenery for "The Ghost Army" so the backgrounds never look empty: patchwork farm fields, hedgerows, tree groves,
// bushes, haystacks, fences, farmhouses, a church, a windmill, telegraph poles, camp clutter, clouds, birds, smoke.
// Static pieces are merged per colour (few draw calls on the software renderer). Everything respects keep-out zones
// around the camera paths in shots.ts so nothing blocks a shot.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { NOINK } from "../bridge/ink";
import { Pen, fxCloud } from "../dead/toon";

const rnd = (i: number) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

/** geometry batches merged per material at the end */
class Batch {
  private lists = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geo: THREE.BufferGeometry, m: THREE.Material, pos: [number, number, number], rot: [number, number, number] = [0, 0, 0], scale: [number, number, number] = [1, 1, 1]) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scale)));
    const l = this.lists.get(m); if (l) l.push(g); else this.lists.set(m, [g]);
  }
  build(parent: THREE.Object3D) {
    for (const [m, gs] of this.lists) { const merged = mergeGeometries(gs, false); if (merged) parent.add(new THREE.Mesh(merged, m)); }
  }
}

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

/** keep-out zones: camera paths, the town, the German road, the foxhole, the tank field and camp */
export const blocked = (x: number, z: number, pad = 0) =>
  (x > -128 - pad && x < -45 + pad && z > 5 - pad && z < 82 + pad) || // German road + its cameras (trees beyond it are fine)
  (x > 85 - pad && x < 158 + pad && Math.abs(z) < 32 + pad) ||       // town
  (x > 6 - pad && x < 50 + pad && z > 96 - pad && z < 150 + pad) ||  // sunset cameras
  (Math.abs(x) < 18 + pad && z > 48 - pad && z < 82 + pad) ||        // foxhole + its cameras
  (Math.abs(x) < 50 + pad && z > -48 - pad && z < 52 + pad) ||       // tank field + camp
  (x > -12 - pad && x < 40 + pad && z > 88 - pad && z < 104 + pad);  // finale tank

export type Decor = { clouds: THREE.Mesh[]; cloudMat: THREE.MeshBasicMaterial; birds: THREE.Mesh[]; smoke: THREE.Mesh[]; smokeMat: THREE.MeshBasicMaterial };

export function decorate(R: THREE.Object3D, toon: (c: THREE.ColorRepresentation, map?: THREE.Texture) => THREE.Material): Decor {
  const B = new Batch();
  const box = new THREE.BoxGeometry(1, 1, 1), ico = new THREE.IcosahedronGeometry(1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 10), cone = new THREE.ConeGeometry(1, 1, 10);
  const prism = new THREE.CylinderGeometry(1, 1, 1, 3);

  // ---- patchwork farm fields (flat, ringed around the battlefield) ----
  const furrows = (a: string, b: string) => canvasTex(128, 128, (g) => { g.fillStyle = a; g.fillRect(0, 0, 128, 128); g.fillStyle = b; for (let y = 0; y < 128; y += 16) g.fillRect(0, y, 128, 6); });
  const fieldMats = [toon(0xffffff, furrows("#c9b25a", "#b39a48")), toon(0xffffff, furrows("#8a6a44", "#74563a")), toon(0x9aa84a), toon(0x6f8f3a), toon(0xa7b85a), toon(0xffffff, furrows("#b8c46a", "#a3b05a"))];
  for (let i = 0; i < 70; i++) {
    const a = rnd(i) * Math.PI * 2, r = 70 + rnd(i + 50) * 300, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (blocked(x, z, -6)) continue;
    const w = 25 + rnd(i + 3) * 45, d = 20 + rnd(i + 4) * 40, ry = (rnd(i + 5) - 0.5) * 0.5;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), fieldMats[i % fieldMats.length]);
    pl.rotation.set(-Math.PI / 2, 0, ry); pl.position.set(x, 0.03 + (i % 5) * 0.004, z); R.add(pl);
    // hedgerow along one or two edges
    const hm = toon(0x45702f);
    for (const side of [-1, 1]) if (rnd(i + side * 7) > 0.35) {
      const cx = x + Math.sin(ry) * side * d / 2, cz = z + Math.cos(ry) * side * d / 2;
      B.add(box, hm, [cx, 1.0, cz], [0, ry, 0], [w, 2.0 + rnd(i) * 0.8, 1.8]);
    }
  }
  // ---- tree groves and lone trees ----
  const trunk = toon(0x5a3d26), leafA = toon(0x4f7a3a), leafB = toon(0x5d8a40), leafC = toon(0x3f6a34), pine = toon(0x2f5a36);
  let placed = 0;
  for (let i = 0; i < 900 && placed < 260; i++) {
    const grove = Math.floor(i / 12), ga = rnd(grove * 3) * Math.PI * 2, gr = 60 + rnd(grove * 3 + 1) * 320;
    const x = Math.cos(ga) * gr + (rnd(i + 11) - 0.5) * 30, z = Math.sin(ga) * gr + (rnd(i + 12) - 0.5) * 30;
    if (blocked(x, z, 4)) continue;
    const s = 0.8 + rnd(i + 13) * 0.9;
    if (rnd(i + 14) < 0.25) { // poplar / pine
      B.add(cyl, trunk, [x, 1.0 * s, z], [0, 0, 0], [0.25 * s, 2 * s, 0.25 * s]);
      B.add(cone, pine, [x, 4.2 * s, z], [0, 0, 0], [1.6 * s, 6.5 * s, 1.6 * s]);
    } else {
      B.add(cyl, trunk, [x, 1.5 * s, z], [0, 0, 0], [0.3 * s, 3 * s, 0.3 * s]);
      for (let k = 0; k < 3; k++) B.add(ico, [leafA, leafB, leafC][(i + k) % 3], [x + (rnd(i * 3 + k) - 0.5) * 2.2 * s, (3.6 + k * 0.9) * s, z + (rnd(i * 5 + k) - 0.5) * 2.2 * s], [0, 0, 0], [(1.8 + rnd(i + k) * 0.8) * s, (1.6 + rnd(i + k + 1) * 0.6) * s, (1.8 + rnd(i + k + 2) * 0.8) * s]);
    }
    placed++;
  }
  // extra groves behind the German road (the column shot looks that way)
  for (const [gx, gz] of [[-150, 92], [-178, 112], [-140, 125], [-195, 78], [-160, 145], [-135, 70], [-210, 130]] as const) for (let k = 0; k < 9; k++) {
    const x = gx + (rnd(gx + k * 7) - 0.5) * 22, z = gz + (rnd(gz + k * 11) - 0.5) * 22, s = 0.9 + rnd(gx * k) * 0.8;
    B.add(cyl, trunk, [x, 1.5 * s, z], [0, 0, 0], [0.3 * s, 3 * s, 0.3 * s]);
    for (let j = 0; j < 3; j++) B.add(ico, [leafA, leafB, leafC][(k + j) % 3], [x + (rnd(k * 3 + j + gx) - 0.5) * 2.2 * s, (3.6 + j * 0.9) * s, z + (rnd(k * 5 + j + gz) - 0.5) * 2.2 * s], [0, 0, 0], [2 * s, 1.7 * s, 2 * s]);
  }
  // ---- bushes, rocks, flowers (closer in, just outside the keep-outs) ----
  const bushM = [toon(0x4a7a36), toon(0x5c8c3e)], rockM = toon(0x9a958a), flowerM = [toon(0xf2e14a), toon(0xf4f1e8), toon(0xd8574a)];
  for (let i = 0; i < 420; i++) {
    const a = rnd(i + 200) * Math.PI * 2, r = 30 + rnd(i + 201) * 150, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (blocked(x, z, 1)) continue;
    const k = rnd(i + 202);
    if (k < 0.5) B.add(ico, bushM[i % 2], [x, 0.4, z], [0, rnd(i) * 3, 0], [1.1 + rnd(i + 3), 0.8 + rnd(i + 4) * 0.5, 1.1 + rnd(i + 5)]);
    else if (k < 0.7) B.add(ico, rockM, [x, 0.2, z], [rnd(i), rnd(i + 1), 0], [0.6 + rnd(i + 6), 0.4, 0.5 + rnd(i + 7)]);
    else for (let f = 0; f < 6; f++) B.add(ico, flowerM[(i + f) % 3], [x + (rnd(i + f * 9) - 0.5) * 3, 0.15, z + (rnd(i + f * 13) - 0.5) * 3], [0, 0, 0], [0.12, 0.1, 0.12]);
  }
  // also bushes/flowers right around the tank field and camp edges (fills close shots)
  for (let i = 0; i < 90; i++) {
    const x = -48 + rnd(i + 600) * 96, z = -46 + rnd(i + 601) * 96;
    const nearTank = z < -3 && z > -44 && x > -33 && x < 35, nearCamp = z > 18 && z < 48 && x > -38 && x < 42, nearHero = Math.hypot(x - 4, z - 14) < 9;
    const cams = (Math.abs(z + 13) < 3) || (Math.abs(x) < 8 && z > 30) || Math.hypot(x - 26, z - 37) < 9;
    if (nearTank || nearCamp || nearHero || cams) continue;
    B.add(ico, bushM[i % 2], [x, 0.35, z], [0, rnd(i) * 3, 0], [0.9 + rnd(i + 3) * 0.6, 0.6 + rnd(i + 4) * 0.4, 0.9 + rnd(i + 5) * 0.6]);
  }
  // ---- haystacks ----
  const hay = toon(0xd9b85a), hayTop = toon(0xc9a548);
  for (let i = 0; i < 26; i++) {
    const a = rnd(i + 400) * Math.PI * 2, r = 75 + rnd(i + 401) * 180, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (blocked(x, z, 3)) continue;
    B.add(cyl, hay, [x, 1.0, z], [0, 0, 0], [1.6, 2.0, 1.6]); B.add(cone, hayTop, [x, 2.6, z], [0, 0, 0], [1.75, 1.4, 1.75]);
  }
  // ---- fences ----
  const wood = toon(0x7a5232);
  for (let f = 0; f < 10; f++) {
    const a = rnd(f + 500) * Math.PI * 2, r = 60 + rnd(f + 501) * 120, x0 = Math.cos(a) * r, z0 = Math.sin(a) * r, dir = rnd(f + 502) * Math.PI;
    for (let k = 0; k < 14; k++) {
      const x = x0 + Math.cos(dir) * k * 3, z = z0 + Math.sin(dir) * k * 3;
      if (blocked(x, z, 2)) continue;
      B.add(box, wood, [x, 0.6, z], [0, 0, 0], [0.15, 1.2, 0.15]);
      for (const y of [0.45, 0.95]) B.add(box, wood, [x + Math.cos(dir) * 1.5, y, z + Math.sin(dir) * 1.5], [0, -dir, 0], [3, 0.1, 0.08]);
    }
  }
  // ---- farmhouses, church, windmill ----
  const wall = [toon(0xe3d3b1), toon(0xd9b98a), toon(0xcfc3ad)], roof = toon(0x9a4a3a), slate = toon(0x5a5a66);
  const house = (x: number, z: number, ry: number, w: number, d: number, h: number, i: number) => {
    B.add(box, wall[i % 3], [x, h / 2, z], [0, ry, 0], [w, h, d]);
    B.add(prism, i % 2 ? roof : slate, [x, h + d * 0.28, z], [0, ry, Math.PI / 2], [d * 0.58, w + 0.4, d * 0.58]);
    B.add(box, toon(0x7a5a4a), [x + Math.cos(ry) * w * 0.3, h + d * 0.45, z - Math.sin(ry) * w * 0.3], [0, ry, 0], [0.6, 1.6, 0.6]);
  };
  const farms: [number, number][] = [[-168, 100], [-150, -160], [170, -120], [-220, 60], [210, 140], [-90, 230], [60, 260], [260, -40], [-260, -60], [120, -250], [-40, -280]];
  farms.forEach(([x, z], i) => { if (!blocked(x, z)) { house(x, z, rnd(i) * 3, 10, 7, 6, i); house(x + 12, z + 6, rnd(i) * 3 + 1.57, 7, 6, 4.5, i + 1); } });
  // church with steeple
  house(-120, -240, 0.3, 16, 9, 9, 2);
  B.add(box, wall[0], [-128, 9, -238], [0, 0.3, 0], [4, 18, 4]); B.add(cone, slate, [-128, 21, -238], [0, 0.785, 0], [3.2, 8, 3.2]);
  // windmill
  B.add(cyl, wall[1], [200, 7, -230], [0, 0, 0], [3.2, 14, 3.2]); B.add(cone, roof, [200, 16, -230], [0, 0, 0], [3.8, 5, 3.8]);
  for (let k = 0; k < 4; k++) B.add(box, wood, [200, 15, -226.5], [0, 0, k * Math.PI / 2 + 0.4], [0.6, 14, 0.15]);
  // telegraph poles + wires along a lane north of the field
  for (let k = 0; k < 18; k++) {
    const x = -220 + k * 26, z = -95 + Math.sin(k * 0.7) * 3;
    B.add(cyl, wood, [x, 4, z], [0, 0, 0], [0.14, 8, 0.14]); B.add(box, wood, [x, 7.4, z], [0, 0, 0], [0.1, 0.12, 1.6]);
    for (const dz of [-0.6, 0.6]) B.add(box, toon(0x2a2a2a), [x + 13, 7.1, z + dz], [0, 0, 0], [26, 0.04, 0.04]);
  }
  // ---- camp clutter: crates, jerrycans, sandbag walls, flagpole, radio mast ----
  const crate = toon(0x8a6a3a), can = toon(0x55603a), bag = toon(0xb9a37a), olive = toon(0x5f6b3a);
  for (let i = 0; i < 40; i++) {
    const x = -40 + rnd(i + 700) * 80, z = 16 + rnd(i + 701) * 34;
    if (Math.abs(x) < 8 && z > 36) continue;               // line-up / crane camera corridor
    if (Math.hypot(x - 26, z - 34) < 8) continue;          // roller shot
    if (Math.hypot(x + 17, z - 41) < 6) continue;          // inflating tank
    if (Math.hypot(x + 6, z - 30) < 5) continue;           // speaker truck
    if (Math.hypot(x - 4, z - 14) < 6) continue;           // hero tank
    if (i % 3 === 0) { for (let k = 0; k < 3; k++) B.add(box, crate, [x + k * 0.9, 0.4 + (k === 2 ? 0.8 : 0), z], [0, 0.2, 0], [0.8, 0.8, 0.8]); }
    else if (i % 3 === 1) { for (let k = 0; k < 4; k++) B.add(box, can, [x + k * 0.35, 0.3, z], [0, 0, 0], [0.25, 0.6, 0.45]); }
    else for (let k = 0; k < 5; k++) B.add(cyl, bag, [x + (k - 2) * 0.75, 0.25, z + Math.abs(k - 2) * 0.25], [0, 0, Math.PI / 2], [0.28, 0.75, 0.28]);
  }
  B.add(cyl, toon(0xd8d8d8), [-30, 6, 18], [0, 0, 0], [0.1, 12, 0.1]);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: canvasTex(130, 80, (g) => {
    for (let s = 0; s < 13; s++) { g.fillStyle = s % 2 ? "#f4f1e8" : "#b3262b"; g.fillRect(0, s * 80 / 13, 130, 80 / 13 + 1); }
    g.fillStyle = "#2a3a7a"; g.fillRect(0, 0, 56, 43); g.fillStyle = "#f4f1e8"; for (let i = 0; i < 20; i++) g.fillRect(4 + (i % 5) * 10, 4 + Math.floor(i / 5) * 10, 3, 3);
  }) }));
  flag.position.set(-28.65, 11, 18); flag.layers.set(NOINK); R.add(flag);
  B.add(cyl, olive, [36, 9, 44], [0, 0, 0], [0.12, 18, 0.12]);
  for (const [dx, dz] of [[4, 0], [-4, 0], [0, 4]]) B.add(cyl, toon(0x2a2a2a), [36 + dx / 2, 9, 44 + dz / 2], [dz ? 0.45 : 0, 0, dx ? -Math.sign(dx) * 0.42 : 0], [0.03, 18.5, 0.03]);
  // foxhole: more sandbags, a shovel
  for (let i = 0; i < 7; i++) B.add(cyl, bag, [-2.4 + i * 0.8, 2.6, 60.4], [0, 0, Math.PI / 2], [0.27, 0.75, 0.27]);
  B.add(box, wood, [2.6, 2.4, 61.0], [0, 0, 0.5], [0.08, 1.6, 0.08]); B.add(box, toon(0x5a5a5a), [3.0, 1.75, 61.0], [0, 0, 0.5], [0.4, 0.5, 0.06]);
  B.build(R);

  // ---- sky: clouds, birds, distant smoke ----
  const cloudMat = new THREE.MeshBasicMaterial({ map: canvasTex(600, 300, (g) => fxCloud(new Pen(g), 3)), transparent: true, depthWrite: false, fog: false, toneMapped: false });
  const clouds: THREE.Mesh[] = [];
  for (let i = 0; i < 22; i++) {
    const a = rnd(i + 800) * Math.PI * 2, r = 380 + rnd(i + 801) * 120, s = 50 + rnd(i + 802) * 60;
    const c = new THREE.Mesh(new THREE.PlaneGeometry(s, s / 2), cloudMat);
    c.position.set(Math.cos(a) * r, 70 + rnd(i + 803) * 90, Math.sin(a) * r); c.lookAt(0, 40, 0); c.layers.set(NOINK); R.add(c); clouds.push(c);
  }
  const birdTex = canvasTex(128, 64, (g) => { g.strokeStyle = "#2a2430"; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(8, 20); g.quadraticCurveTo(36, 8, 64, 40); g.quadraticCurveTo(92, 8, 120, 20); g.stroke(); });
  const birdMat = new THREE.MeshBasicMaterial({ map: birdTex, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
  const birds: THREE.Mesh[] = [];
  for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), birdMat); b.layers.set(NOINK); R.add(b); birds.push(b); }
  const smokeMat = new THREE.MeshBasicMaterial({ map: canvasTex(128, 512, (g) => {
    for (let i = 0; i < 9; i++) { const y = 480 - i * 55, r = 30 + i * 6; const gr = g.createRadialGradient(64, y, 0, 64, y, r); gr.addColorStop(0, "rgba(120,120,125,0.75)"); gr.addColorStop(1, "rgba(120,120,125,0)"); g.fillStyle = gr; g.beginPath(); g.arc(64 + Math.sin(i) * 12, y, r, 0, Math.PI * 2); g.fill(); }
  }), transparent: true, depthWrite: false, fog: false, opacity: 0.8 });
  const smoke: THREE.Mesh[] = [];
  for (const [x, z] of [[-260, -330], [140, -360], [330, -150]]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(30, 110), smokeMat); s.position.set(x, 50, z); s.lookAt(0, 50, 0); s.layers.set(NOINK); R.add(s); smoke.push(s); }
  return { clouds, cloudMat, birds, smoke, smokeMat };
}

/** per frame: drifting birds, cloud/smoke tint per light */
export function animateDecor(D: Decor, t: number, light: string, cam: THREE.Vector3) {
  D.birds.forEach((b, i) => {
    const a = t * 0.05 + i * 0.7, r = 60 + (i % 3) * 25;
    b.position.set(cam.x + Math.cos(a) * r - 20, 28 + (i % 4) * 5 + Math.sin(t * 2 + i) * 0.6, cam.z - 90 + Math.sin(a) * 30);
    b.lookAt(cam); b.scale.y = 0.6 + 0.4 * Math.abs(Math.sin(t * 6 + i));
    b.visible = light !== "night";
  });
  D.cloudMat.color.set(light === "night" ? 0x2c3460 : light === "golden" ? 0xffc9a0 : light === "dawn" ? 0xffd9c8 : 0xffffff);
  D.smokeMat.opacity = light === "night" ? 0.25 : 0.7;
}
