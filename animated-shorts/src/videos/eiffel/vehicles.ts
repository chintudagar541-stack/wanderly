// 1920s motor cars (a limousine and parked cars) and a steam train, built from merged parts.
import * as THREE from "three";
import { Batch, V3, toon, BOX, CYL, SPH, HALF, CYL8 } from "./lib";

const chrome = () => toon(0xd9dde2), tyre = () => toon(0x1c1c20), glassM = () => toon(0x3a4a5a);
/** a car in its local frame (forward = +z, ground y = 0), then placed at pos with yaw ry */
export const car = (B: Batch, pos: V3, ry: number, color: number, long = false) => {
  const body = toon(color), dark = toon(0x1a1a1e), cr = chrome();
  const M = new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
  const put = (geo: THREE.BufferGeometry, m: THREE.Material, p: V3, s: V3, r: V3 = [0, 0, 0]) =>
    B.addM(geo, m, M.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s))));
  const L = long ? 5.2 : 4.2, cab = long ? 2.8 : 2.0;
  put(BOX, dark, [0, 0.55, 0], [1.5, 0.22, L]);                                  // chassis
  put(BOX, body, [0, 0.95, L / 2 - 0.95], [1.1, 0.62, 1.7]);                      // bonnet
  put(BOX, cr, [0, 0.98, L / 2 - 0.05], [1.0, 0.8, 0.12]);                        // radiator
  put(BOX, toon(0x5a5e66), [0, 0.98, L / 2 + 0.01], [0.82, 0.62, 0.04]);
  put(BOX, body, [0, 1.15, -L / 2 + cab / 2 + 0.25], [1.55, 1.0, cab]);           // cabin lower
  put(BOX, glassM(), [0, 1.85, -L / 2 + cab / 2 + 0.25], [1.5, 0.52, cab - 0.1]); // windows band
  put(BOX, dark, [0, 2.17, -L / 2 + cab / 2 + 0.25], [1.62, 0.14, cab + 0.12]);   // roof
  for (const s of [-1, 1]) {
    put(BOX, body, [s * 0.68, 1.85, -L / 2 + 0.3], [0.1, 0.55, 0.2]); put(BOX, body, [s * 0.68, 1.85, -L / 2 + cab + 0.18], [0.1, 0.55, 0.16]);
    if (long) put(BOX, body, [s * 0.68, 1.85, -L / 2 + cab / 2 + 0.25], [0.1, 0.55, 0.14]);
    put(BOX, dark, [s * 0.88, 0.6, 0], [0.32, 0.06, L - 1.6]);                  // running boards
    for (const z of [L / 2 - 0.85, -L / 2 + 0.75]) {
      put(HALF, body, [s * 0.68, 0.62, z], [0.36, 0.5, 0.5]);                    // fenders
      put(CYL, tyre(), [s * 0.68, 0.44, z], [0.44, 0.22, 0.44], [0, 0, Math.PI / 2]);
      put(CYL8, cr, [s * 0.8, 0.44, z], [0.2, 0.04, 0.2], [0, 0, Math.PI / 2]);
    }
    put(SPH, cr, [s * 0.5, 1.2, L / 2 - 0.15], [0.17, 0.17, 0.12]);              // headlamps
    put(SPH, toon(0xfff2c0), [s * 0.5, 1.2, L / 2 - 0.05], [0.12, 0.12, 0.06]);
  }
  put(BOX, cr, [0, 0.52, L / 2 + 0.12], [1.6, 0.1, 0.08]); put(BOX, cr, [0, 0.52, -L / 2 - 0.08], [1.6, 0.1, 0.08]);
  put(CYL, tyre(), [0, 1.0, -L / 2 - 0.12], [0.42, 0.18, 0.42], [Math.PI / 2, 0, 0]);  // spare wheel
};
/** a movable car: its own group */
export const carGroup = (parent: THREE.Object3D, color: number, long = true) => {
  const g = new THREE.Group(), B = new Batch(); car(B, [0, 0, 0], 0, color, long); B.build(g); parent.add(g); return g;
};

/** a steam locomotive + tender + three carriages, forward = -x, rails at y = 0 */
export const trainGroup = (parent: THREE.Object3D) => {
  const g = new THREE.Group(), B = new Batch();
  const put = (geo: THREE.BufferGeometry, m: THREE.Material, p: V3, sc: V3 = [1, 1, 1], r: V3 = [0, 0, 0]) => B.add(geo, m, p, r, sc);
  const green = toon(0x2f5a3a), black = toon(0x1c1c20), red = toon(0xa8302a), brass = toon(0xd9b04a), teak = toon(0x8a4a2a), cream = toon(0xe9dcc0), roof = toon(0x4a4a50), win = toon(0xffd98a);
  // locomotive
  put(CYL, green, [-4, 2.6, 0], [1.25, 7.2, 1.25], [0, 0, Math.PI / 2]);
  put(CYL, black, [-7.7, 2.6, 0], [1.3, 0.3, 1.3], [0, 0, Math.PI / 2]);
  put(CYL8, black, [-6.4, 4.4, 0], [0.42, 1.6, 0.42]); put(CYL8, black, [-6.4, 5.2, 0], [0.6, 0.3, 0.6]);
  put(SPH, brass, [-3.4, 3.9, 0], [0.55, 0.5, 0.55]); put(CYL8, brass, [-1.8, 4.0, 0], [0.25, 0.6, 0.25]);
  for (const k of [-1.2, -2.6, -4.0, -5.4]) put(CYL, brass, [k, 2.6, 0], [1.28, 0.12, 1.28], [0, 0, Math.PI / 2]);
  put(BOX, green, [0.8, 3.2, 0], [2.6, 3.2, 2.7]); put(BOX, black, [0.8, 4.95, 0], [3.0, 0.3, 3.0]);
  for (const s of [-1, 1]) { put(BOX, win, [0.8, 3.7, s * 1.36], [1.2, 0.9, 0.04]); put(BOX, black, [-3.5, 1.2, s * 1.0], [8.4, 0.4, 0.3]); }
  put(BOX, red, [-3.2, 0.9, 0], [10, 0.5, 2.0]);
  for (const s of [-1, 1]) {
    for (const x of [-6.2, -4.6]) put(CYL, black, [x, 0.7, s * 1.1], [0.6, 0.2, 0.6], [Math.PI / 2, 0, 0]);
    for (const x of [-2.6, -0.6]) { put(CYL, red, [x, 1.0, s * 1.15], [0.95, 0.2, 0.95], [Math.PI / 2, 0, 0]); put(CYL8, black, [x, 1.0, s * 1.27], [0.25, 0.05, 0.25], [Math.PI / 2, 0, 0]); }
    put(BOX, toon(0xc9ccd2), [-1.6, 1.0, s * 1.3], [2.4, 0.15, 0.08]);
    put(CYL8, black, [-8.0, 1.1, s * 0.7], [0.18, 0.5, 0.18], [0, 0, Math.PI / 2]);
  }
  put(SPH, toon(0xfff2c0), [-7.9, 3.9, 0], [0.3, 0.3, 0.2]);
  // tender
  put(BOX, green, [4.6, 2.2, 0], [4.2, 2.4, 2.6]); put(BOX, black, [4.6, 3.5, 0], [3.8, 0.4, 2.2]); put(BOX, red, [4.6, 0.85, 0], [4.4, 0.4, 2.0]);
  for (const s of [-1, 1]) for (const x of [3.4, 5.8]) put(CYL, black, [x, 0.6, s * 1.1], [0.55, 0.2, 0.55], [Math.PI / 2, 0, 0]);
  // carriages (teak with cream window band, curved roofs, lit windows)
  for (let c = 0; c < 3; c++) {
    const x0 = 13.5 + c * 15.4;
    put(BOX, teak, [x0, 2.3, 0], [14.6, 2.6, 2.8]); put(BOX, cream, [x0, 2.9, 0], [14.62, 0.9, 2.82]);
    put(HALF, roof, [x0, 3.55, 0], [14.8, 0.6, 1.5]); put(BOX, black, [x0, 0.85, 0], [13.6, 0.4, 2.2]);
    for (const s of [-1, 1]) {
      for (let w = 0; w < 7; w++) put(BOX, win, [x0 - 6 + w * 2, 2.95, s * 1.42], [1.2, 0.7, 0.04]);
      for (const x of [x0 - 5.2, x0 - 3.8, x0 + 3.8, x0 + 5.2]) put(CYL, black, [x, 0.55, s * 1.1], [0.5, 0.2, 0.5], [Math.PI / 2, 0, 0]);
      put(BOX, brass, [x0, 1.6, s * 1.42], [0.8, 0.5, 0.04]);
    }
  }
  B.build(g); parent.add(g); return g;
};
