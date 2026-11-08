// Shared building blocks for the Eiffel short: seeded random, painted canvas textures, cached toon materials,
// and a Batch that merges static geometry per material.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type V3 = [number, number, number];
export const rnd = (i: number) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
export const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
};
export const ramp = (() => { const t = new THREE.DataTexture(new Uint8Array([95, 180, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const MATS = new Map<string, THREE.MeshToonMaterial>();
export const toon = (color: THREE.ColorRepresentation, map?: THREE.Texture, side: THREE.Side = THREE.FrontSide) => {
  const key = map ? "" : String(color) + side;
  if (key && MATS.has(key)) return MATS.get(key)!;
  const m = new THREE.MeshToonMaterial({ color, map: map ?? null, gradientMap: ramp, side });
  if (key) MATS.set(key, m);
  return m;
};
const tq = new THREE.Quaternion(), tv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
export class Batch {
  private lists = new Map<THREE.Material, THREE.BufferGeometry[]>();
  addM(geo: THREE.BufferGeometry, m: THREE.Material, mat: THREE.Matrix4) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(mat);
    const l = this.lists.get(m); if (l) l.push(g); else this.lists.set(m, [g]);
  }
  add(geo: THREE.BufferGeometry, m: THREE.Material, pos: V3, rot: V3 = [0, 0, 0], scale: V3 = [1, 1, 1]) {
    this.addM(geo, m, new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scale)));
  }
  /** a square beam of thickness th from a to b */
  beam(m: THREE.Material, a: V3, b: V3, th: number) {
    tv.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = tv.length(); if (len < 1e-4) return;
    tq.setFromUnitVectors(up, tv.normalize());
    this.addM(BOX, m, new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), tq, new THREE.Vector3(th, len, th)));
  }
  build(parent: THREE.Object3D) { for (const [m, gs] of this.lists) { const g = mergeGeometries(gs, false); if (g) parent.add(new THREE.Mesh(g, m)); } this.lists.clear(); }
}
export const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 14), CONE = new THREE.ConeGeometry(1, 1, 14);
export const ICO = new THREE.IcosahedronGeometry(1, 1), SPH = new THREE.SphereGeometry(1, 12, 8), PRISM = new THREE.CylinderGeometry(1, 1, 1, 3);
export const DOME = new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), CYL8 = new THREE.CylinderGeometry(1, 1, 1, 8);
/** square frustum (mansard roof), side 1 at the base, 0.62 at the top, axis-aligned */
export const MANS = (() => { const g = new THREE.CylinderGeometry(0.7071 * 0.62, 0.7071, 1, 4, 1); g.rotateY(Math.PI / 4); return g; })();
/** half cylinder (open), axis along x, arc over the top: wheel fenders, carriage roofs */
export const HALF = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 14, 1, true, -Math.PI / 2, Math.PI); g.rotateX(-Math.PI / 2); g.rotateY(Math.PI / 2); return g; })();
/** a box whose side faces carry UVs in metres / tile (so a facade texture repeats per bay) */
export const facadeBox = (w: number, h: number, d: number, bay: number) => {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < 24; i++) {
    const face = Math.floor(i / 4);
    if (face === 2 || face === 3) uv.setXY(i, 0.001, 0.001);
    else uv.setX(i, uv.getX(i) * Math.max(1, Math.round((face < 2 ? d : w) / bay)));
  }
  return g;
};
