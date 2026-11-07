// The Eiffel Tower (~312 m) as a lattice of merged beams: four curved legs braced on every face, the great arches,
// three platforms with galleries, the merged upper shaft, the top cabin and mast. Centre at the origin.
import * as THREE from "three";
import { Batch, V3, toon, canvasTex, BOX, CYL, CYL8, DOME, SPH } from "./lib";

export const OUTER = (y: number) => 62 * Math.exp(-y / 95);      // outer half-width of the legs
const LEGW = (y: number) => 16 * Math.exp(-y / 170);               // leg width
export const MERGE_Y = 205;

const galleryTex = () => canvasTex(512, 64, (g) => {
  g.fillStyle = "#8a5e3e"; g.fillRect(0, 0, 512, 64);
  g.fillStyle = "#5e3d26";
  for (let x = 0; x < 512; x += 32) { g.beginPath(); g.moveTo(x + 4, 60); g.lineTo(x + 4, 26); g.quadraticCurveTo(x + 16, 6, x + 28, 26); g.lineTo(x + 28, 60); g.closePath(); g.fill(); }
  g.fillStyle = "#b08a5e"; g.fillRect(0, 0, 512, 6); g.fillRect(0, 58, 512, 6);
}, [8, 1]);

export const buildTower = (B: Batch) => {
  const iron = toon(0x7a5236), ironL = toon(0x8f6442), ironD = toon(0x5a3a26), stone = toon(0xc9bca4), glass = toon(0x9ab8c8);
  const gal = toon(0xffffff, galleryTex());
  const heights: number[] = [0];
  while (heights[heights.length - 1] < 300) { const y = heights[heights.length - 1]; heights.push(Math.min(300, y + 4.2 + y * 0.022)); }
  const th = (y: number) => 1.35 - y * 0.0028;
  // legs (and above MERGE_Y the single shaft): corner chords, face bracing, horizontal rings
  for (let k = 0; k < heights.length - 1; k++) {
    const y0 = heights[k], y1 = heights[k + 1];
    const legs = y1 <= MERGE_Y ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[0, 0]];
    for (const [sx, sz] of legs) {
      const box = (y: number): [number, number] => y1 <= MERGE_Y ? [OUTER(y) - LEGW(y), OUTER(y)] : [-OUTER(y), OUTER(y)];
      const [i0, o0] = box(y0), [i1, o1] = box(y1);
      const S = (a: number, b: number) => (sx === 0 ? [a, b] : [a * sx, b * sz]) as [number, number];
      const corner = (x: number, z: number, y: number): V3 => { const [X, Z] = S(x, z); return [X, y, Z]; };
      const c0 = [[i0, i0], [i0, o0], [o0, o0], [o0, i0]], c1 = [[i1, i1], [i1, o1], [o1, o1], [o1, i1]];
      for (let c = 0; c < 4; c++) B.beam(iron, corner(c0[c][0], c0[c][1], y0), corner(c1[c][0], c1[c][1], y1), th(y0));
      // faces, split into panels so the bracing stays a lattice
      for (let f = 0; f < 4; f++) {
        const a0 = c0[f], b0 = c0[(f + 1) % 4], a1 = c1[f], b1 = c1[(f + 1) % 4];
        const wid = Math.hypot(a0[0] - b0[0], a0[1] - b0[1]), n = Math.max(1, Math.round(wid / 6));
        for (let p = 0; p < n; p++) {
          const l = (A: number[], Bv: number[], u: number) => [A[0] + (Bv[0] - A[0]) * u, A[1] + (Bv[1] - A[1]) * u];
          const p00 = l(a0, b0, p / n), p01 = l(a0, b0, (p + 1) / n), p10 = l(a1, b1, p / n), p11 = l(a1, b1, (p + 1) / n);
          B.beam(ironL, corner(p00[0], p00[1], y0), corner(p11[0], p11[1], y1), th(y0) * 0.42);
          B.beam(ironL, corner(p01[0], p01[1], y0), corner(p10[0], p10[1], y1), th(y0) * 0.42);
          if (p > 0) B.beam(iron, corner(p00[0], p00[1], y0), corner(p10[0], p10[1], y1), th(y0) * 0.5);
        }
        B.beam(iron, corner(a0[0], a0[1], y0), corner(b0[0], b0[1], y0), th(y0) * 0.6);
      }
    }
  }
  // the great arches between the legs on each side (double ribs + hangers up to the first platform)
  for (let side = 0; side < 4; side++) {
    const rot = (x: number, y: number, z: number): V3 => side === 0 ? [x, y, z] : side === 1 ? [z, y, -x] : side === 2 ? [-x, y, -z] : [-z, y, x];
    for (const [B0, off] of [[36, 0], [33, -1.2]] as const) {
      let prev: V3 | null = null;
      for (let i = 0; i <= 24; i++) {
        const th2 = (Math.PI * i) / 24, y = 16 + B0 * Math.sin(th2), half = OUTER(y) - LEGW(y) + 1.5;
        const p = rot(Math.cos(th2) * Math.min(half, 40), y, OUTER(y) - LEGW(y) * 0.5 + off);
        if (prev) B.beam(ironD, prev, p, 1.3);
        if (off === 0 && i % 2 === 0 && i > 2 && i < 22) B.beam(ironL, p, rot(Math.cos(th2) * Math.min(half, 40), 56, OUTER(56) - LEGW(56) * 0.5), 0.35);
        prev = p;
      }
    }
  }
  // platforms: slab + gallery band (painted arcade) + railing posts
  const platform = (y: number, ext: number, band: number) => {
    const h = OUTER(y) + ext;
    B.add(BOX, ironD, [0, y - 0.6, 0], [0, 0, 0], [2 * h, 1.2, 2 * h]);
    for (let s = 0; s < 4; s++) {
      const r = s * Math.PI / 2, cx = Math.sin(r) * h, cz = Math.cos(r) * h;
      const g = new THREE.BoxGeometry(2 * h, band, 1.0), uv = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * Math.max(1, Math.round(h / 4)));
      B.addM(g, gal, new THREE.Matrix4().compose(new THREE.Vector3(cx, y + band / 2, cz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r, 0)), new THREE.Vector3(1, 1, 1)));
      B.add(BOX, ironL, [Math.sin(r) * (h + 0.2), y + band + 0.3, Math.cos(r) * (h + 0.2)], [0, r, 0], [2 * h + 0.6, 0.6, 0.6]);
      for (let k = -Math.floor(h / 3); k <= Math.floor(h / 3); k++) B.add(BOX, iron, [cx + Math.cos(r) * k * 3, y + band + 1.1, cz - Math.sin(r) * k * 3], [0, r, 0], [0.18, 1.4, 0.18]);
      B.add(BOX, ironL, [Math.sin(r) * h, y + band + 1.8, Math.cos(r) * h], [0, r, 0], [2 * h, 0.2, 0.25]);
    }
  };
  platform(57, 3, 5.2); platform(115, 2.4, 3.6);
  B.add(BOX, glass, [0, 118, 0], [0, 0, 0], [16, 5, 16]); B.add(BOX, ironD, [0, 120.8, 0], [0, 0, 0], [17, 0.6, 17]);
  // third level + top
  B.add(BOX, ironD, [0, 276, 0], [0, 0, 0], [2 * OUTER(276) + 6, 1, 2 * OUTER(276) + 6]);
  B.add(BOX, glass, [0, 279, 0], [0, 0, 0], [2 * OUTER(276) + 3, 5, 2 * OUTER(276) + 3]);
  B.add(BOX, ironD, [0, 281.8, 0], [0, 0, 0], [2 * OUTER(276) + 5, 0.8, 2 * OUTER(276) + 5]);
  B.add(BOX, ironL, [0, 285, 0], [0, 0, 0], [6, 6, 6]); B.add(DOME, ironD, [0, 288, 0], [0, 0, 0], [3.6, 3, 3.6]);
  B.add(CYL8, iron, [0, 293, 0], [0, 0, 0], [1.2, 8, 1.2]); B.add(CYL8, ironD, [0, 305, 0], [0, 0, 0], [0.35, 16, 0.35]); B.add(SPH, ironD, [0, 313, 0], [0, 0, 0], [0.7, 0.7, 0.7]);
  // stone piers under the four legs
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const c = OUTER(0) - LEGW(0) / 2;
    B.add(BOX, stone, [sx * c, 1.5, sz * c], [0, 0, 0], [LEGW(0) + 4, 3, LEGW(0) + 4]);
    B.add(BOX, toon(0xa89a82), [sx * c, 3.2, sz * c], [0, 0, 0], [LEGW(0) + 2.4, 0.5, LEGW(0) + 2.4]);
  }
  // ticket kiosks between the legs
  for (const [x, z] of [[24, 0], [-24, 0], [0, 24], [0, -24]]) { B.add(BOX, toon(0xe9dcc0), [x, 1.6, z], [0, 0, 0], [5, 3.2, 3]); B.add(CYL, toon(0x2f5a3a), [x, 3.5, z], [0, 0, 0], [3.2, 0.6, 2.2]); }
};
