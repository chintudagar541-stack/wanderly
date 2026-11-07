// Geometry helpers for the realism library: world-scaled UVs (photo textures keep real-world size), bevelled boxes
// (edges catch the light: the single biggest "not a primitive" cue), and a placement helper for local kits.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, V3 } from "../../videos/eiffel/lib";

/** a box whose UVs are in world units / tile on every face */
export const wbox = (w: number, h: number, d: number, tile = 1) => scaleUV(new THREE.BoxGeometry(w, h, d), w, h, d, tile);
/** a bevelled box (radius r), world-scaled UVs */
export const rbox = (w: number, h: number, d: number, r = 0.02, tile = 1) => scaleUV(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.01, h / 2.01, d / 2.01)), w, h, d, tile);
const scaleUV = (g: THREE.BufferGeometry, w: number, h: number, d: number, tile: number) => {
  // project UVs from positions by the dominant normal axis (works for plain and rounded boxes)
  const p = g.attributes.position as THREE.BufferAttribute, n = g.attributes.normal as THREE.BufferAttribute, uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)), x = p.getX(i) + w / 2, y = p.getY(i) + h / 2, z = p.getZ(i) + d / 2;
    if (ax >= ay && ax >= az) uv.setXY(i, z / tile, y / tile); else if (ay >= az) uv.setXY(i, x / tile, z / tile); else uv.setXY(i, x / tile, y / tile); }
  return g; };
/** a plane (XY) with world-scaled UVs; rotate it yourself */
export const wplane = (w: number, h: number, tile = 1) => { const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tile, (uv.getY(i) * h) / tile); return g; };
/** a cylinder with world-scaled UVs around and along */
export const wcyl = (rTop: number, rBot: number, h: number, seg = 16, tile = 1, open = false) => { const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, open), uv = g.attributes.uv as THREE.BufferAttribute;
  const c = Math.PI * (rTop + rBot); for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * c) / tile, (uv.getY(i) * h) / tile); return g; };

/** place local-space parts into a Batch through a parent transform (position + yaw) */
export const placer = (B: Batch, pos: V3, ry = 0) => {
  const base = new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  return (geo: THREE.BufferGeometry, mat: THREE.Material, p: V3, sc: V3 = [1, 1, 1], r: V3 = [0, 0, 0]) => { m.compose(v.set(...p), q.setFromEuler(e.set(...r)), s.set(...sc)); B.addM(geo, mat, base.clone().multiply(m)); };
};
export const UNIT_PLANE = new THREE.PlaneGeometry(1, 1);
export const BOX1 = new THREE.BoxGeometry(1, 1, 1), RBOX1 = new RoundedBoxGeometry(1, 1, 1, 2, 0.08), CYL16 = new THREE.CylinderGeometry(1, 1, 1, 16), SPH16 = new THREE.SphereGeometry(1, 16, 12);
