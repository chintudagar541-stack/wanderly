// Paris, 1925, around the Eiffel Tower (origin):
//   Champ de Mars (x -80..80, z -90..-560) with tree rows, parterres and side avenues lined with buildings.
//   The Seine (z 140..200) with quays, the Pont d'Iena (x 0), barges.
//   The square + Grand Hotel north of the river (centre (0, 0, 520), hotel front at z = 600 facing the tower).
//   The cafe street running south from the Champ de Mars (x = 0, z -585..-1000): looking north it frames the tower.
//   Haussmann blocks everywhere else out to ~1.2 km.
import * as THREE from "three";
import { Batch, V3, rnd, toon, canvasTex, BOX, CYL, CONE, ICO, SPH, PRISM, MANS, CYL8, DOME, facadeBox, ramp } from "./lib";
import { car } from "./vehicles";

export const STREET_Z0 = -585, STREET_Z1 = -1000, SQUARE: V3 = [0, 0, 520], HOTEL_Z = 600, RIVER: [number, number] = [140, 200];
export const CAFE_Z = -650;
type Light = { p: V3; order: number; tint?: V3 };

// ---------------- painted textures ----------------
const FACADES = new Map<string, THREE.Texture>();
const facadeTex = (n: number, base: string, shop: string) => {
  const key = `${n}|${base}|${shop}`; if (FACADES.has(key)) return FACADES.get(key)!;
  const H = 90 + n * 64;
  const t = canvasTex(64, H, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 64, H);
    g.fillStyle = "rgba(255,255,255,0.18)"; for (let x = 0; x < 64; x += 16) g.fillRect(x, 0, 1, H);
    for (let j = 0; j < n; j++) {
      const y0 = j * 64;
      g.fillStyle = "rgba(90,70,50,0.28)"; g.fillRect(0, y0 + 61, 64, 3);
      if (j === 0) { g.fillStyle = "rgba(90,70,50,0.4)"; g.fillRect(0, 0, 64, 6); }
      g.fillStyle = "#f6efe0"; g.fillRect(14, y0 + 9, 36, 51);                     // stone surround
      g.fillStyle = "#43546a"; g.fillRect(18, y0 + 13, 28, 46);                   // glass
      g.fillStyle = "rgba(200,225,240,0.35)"; g.beginPath(); g.moveTo(18, y0 + 40); g.lineTo(36, y0 + 13); g.lineTo(44, y0 + 13); g.lineTo(18, y0 + 50); g.closePath(); g.fill();
      g.fillStyle = "#f6efe0"; g.fillRect(31, y0 + 13, 2, 46); g.fillRect(18, y0 + 27, 28, 2);
      if (j === n - 2) { g.fillStyle = "#d9cdb3"; g.beginPath(); g.moveTo(12, y0 + 9); g.lineTo(32, y0 + 1); g.lineTo(52, y0 + 9); g.closePath(); g.fill(); }
      if (j === n - 2 || j === 0) { // wrought-iron balcony band
        g.fillStyle = "#1e1e22"; g.fillRect(0, y0 + 47, 64, 3); g.fillRect(0, y0 + 58, 64, 2);
        for (let x = 2; x < 64; x += 5) g.fillRect(x, y0 + 47, 1.6, 12);
        g.strokeStyle = "#1e1e22"; g.lineWidth = 1.2; for (let x = 0; x < 64; x += 10) { g.beginPath(); g.arc(x + 5, y0 + 53, 3, 0, Math.PI * 2); g.stroke(); }
      } else { g.fillStyle = "#1e1e22"; g.fillRect(16, y0 + 50, 32, 2); for (let x = 17; x < 48; x += 4) g.fillRect(x, y0 + 50, 1.2, 9); }
    }
    const y = n * 64; // ground floor: shop front
    g.fillStyle = "#d9cdb3"; g.fillRect(0, y, 64, 90);
    g.fillStyle = shop; g.fillRect(4, y + 8, 56, 16);
    g.fillStyle = "rgba(255,240,200,0.8)"; for (let x = 10; x < 54; x += 9) g.fillRect(x, y + 14, 6, 4);
    g.fillStyle = shop; g.fillRect(4, y + 24, 56, 64);
    g.fillStyle = "#2b3644"; g.fillRect(9, y + 29, 46, 50);
    g.fillStyle = "rgba(220,235,245,0.3)"; g.fillRect(12, y + 32, 10, 44);
    g.fillStyle = shop; g.fillRect(31, y + 29, 3, 50);
  });
  t.wrapS = THREE.RepeatWrapping; FACADES.set(key, t); return t;
};
const BASES = ["#eadfc8", "#e6d6b8", "#efe6d4", "#e2d2b2"], SHOPS = ["#2f5a3a", "#7a1f2b", "#1f3a5a", "#5a3a22", "#3a3a40"];
const stripes = (a: string, b: string) => canvasTex(64, 64, (g) => { for (let x = 0; x < 64; x += 16) { g.fillStyle = a; g.fillRect(x, 0, 8, 64); g.fillStyle = b; g.fillRect(x + 8, 0, 8, 64); } g.fillStyle = a; g.fillRect(0, 54, 64, 10); });
const cobble = (base: string, stone: string, rep: number) => canvasTex(256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = stone; g.lineWidth = 2;
  for (let y = 0; y < 256; y += 16) for (let x = (y / 16) % 2 ? -8 : 0; x < 256; x += 16) { g.fillStyle = `rgba(${rnd(x + y * 7) < 0.5 ? "0,0,0" : "255,255,255"},${0.05 + rnd(x * 3 + y) * 0.07})`; g.fillRect(x + 1, y + 1, 14, 14); g.strokeRect(x + 0.5, y + 0.5, 15, 15); }
}, [rep, rep]);
const lawnTex = () => canvasTex(256, 256, (g) => {
  g.fillStyle = "#6fa04a"; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 64) { g.fillStyle = "rgba(255,255,255,0.06)"; g.fillRect(x, 0, 32, 256); }
  for (let i = 0; i < 600; i++) { g.fillStyle = rnd(i) < 0.5 ? "rgba(50,90,30,0.3)" : "rgba(160,200,90,0.3)"; g.fillRect(rnd(i + 1) * 256, rnd(i + 2) * 256, 2, 5); }
}, [6, 30]);
const waterTex = () => canvasTex(256, 256, (g) => {
  g.fillStyle = "#4f86a8"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) { const x = rnd(i) * 256, y = rnd(i + 5) * 256; g.strokeStyle = rnd(i + 2) < 0.5 ? "rgba(255,255,255,0.35)" : "rgba(30,60,90,0.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y - 4, x + 16, y); g.stroke(); }
}, [40, 3]);
const posterTex = () => canvasTex(256, 64, (g) => {
  const cols = ["#d1202f", "#f2c14e", "#2a4a8a", "#f4ead6", "#2e7a4a", "#e86a2a"];
  for (let k = 0; k < 8; k++) { g.fillStyle = cols[k % 6]; g.fillRect(k * 32, 0, 32, 64); g.fillStyle = cols[(k + 3) % 6]; g.fillRect(k * 32 + 5, 10, 22, 8); g.fillRect(k * 32 + 5, 26, 14, 26); g.fillStyle = "#1e1e22"; g.fillRect(k * 32 + 5, 56, 22, 3); }
});
export const signTex = (text: string, bg: string, fg: string, w = 512, h = 96, font = "bold 64px Georgia, serif") => canvasTex(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = fg; g.font = font; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, h / 2 + 3);
});
const hotelTex = () => canvasTex(128, 256, (g) => {
  g.fillStyle = "#efe4cc"; g.fillRect(0, 0, 128, 256);
  g.fillStyle = "rgba(120,100,70,0.25)"; for (let y = 0; y < 256; y += 8) g.fillRect(0, y, 128, 1);
  for (let j = 0; j < 3; j++) { const y0 = 10 + j * 52; g.fillStyle = "#f8f1e0"; g.fillRect(36, y0, 56, 44); g.fillStyle = "#3e5068"; g.fillRect(42, y0 + 6, 44, 38); g.fillStyle = "#f8f1e0"; g.fillRect(62, y0 + 6, 3, 38); g.fillRect(42, y0 + 20, 44, 2);
    g.fillStyle = "#1e1e22"; g.fillRect(38, y0 + 36, 52, 2); for (let x = 40; x < 90; x += 4) g.fillRect(x, y0 + 36, 1.2, 8); }
  g.fillStyle = "#d9cdb3"; g.fillRect(0, 168, 128, 88); g.fillStyle = "rgba(90,70,50,0.35)"; for (let y = 172; y < 256; y += 12) g.fillRect(0, y, 128, 2);
  g.fillStyle = "#2e3a48"; g.beginPath(); g.moveTo(30, 256); g.lineTo(30, 206); g.quadraticCurveTo(64, 170, 98, 206); g.lineTo(98, 256); g.closePath(); g.fill();
  g.strokeStyle = "#f8f1e0"; g.lineWidth = 5; g.stroke();
});
export const flagTex = () => canvasTex(96, 64, (g) => { g.fillStyle = "#1f3a8a"; g.fillRect(0, 0, 32, 64); g.fillStyle = "#f4f4f4"; g.fillRect(32, 0, 32, 64); g.fillStyle = "#d1202f"; g.fillRect(64, 0, 32, 64); });

// ---------------- builders ----------------
export const buildCity = (R: THREE.Object3D, B: Batch, lamps: Light[]) => {
  const stoneD = toon(0xc9bca4), stoneL = toon(0xe0d4bc), zinc = toon(0x7d8a99), zincD = toon(0x66727f), terra = toon(0xb0674a), potM = toon(0xc98a5a);
  const ironG = toon(0x2a3a32), black = toon(0x1e1e22), wood = toon(0x7a5232), leaf = [toon(0x5f9a3e), toon(0x4f8a3a), toon(0x6fa648)], trunkM = toon(0x8a7a62);
  const glassL = toon(0xfff0c0), flowers = [toon(0xd1405a), toon(0xf2c14e), toon(0xe86aa0), toon(0xffffff)];
  const awnings = [stripes("#b0202a", "#f4ead6"), stripes("#2f5a3a", "#f4ead6"), stripes("#1f3a6a", "#f4ead6"), stripes("#d98a2a", "#f4ead6")].map((t) => toon(0xffffff, t));
  const plane = (w: number, d: number, m: THREE.Material, p: V3, rz = 0) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); q.rotation.set(-Math.PI / 2, 0, rz); q.position.set(...p); R.add(q); return q; };

  // ---- ground ----
  const pave = toon(0xffffff, cobble("#bdb3a2", "#9a9080", 260)), road = toon(0xffffff, cobble("#8a847a", "#6e685f", 1)), gravel = toon(0xd9c9a0);
  plane(4000, 1860, pave, [0, 0, 140 - 930]); plane(4000, 1800, pave, [0, 0, 200 + 900]);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(4000, 64), toon(0xffffff, waterTex())); water.rotation.x = -Math.PI / 2; water.position.set(0, -3.4, 170); R.add(water);
  for (const z of [RIVER[0], RIVER[1]]) B.add(BOX, stoneD, [0, -1.8, z + (z === RIVER[0] ? 0.6 : -0.6)], [0, 0, 0], [4000, 3.6, 1.2]);
  for (const z of [RIVER[0] - 0.6, RIVER[1] + 0.6]) { B.add(BOX, stoneL, [0, 0.45, z], [0, 0, 0], [4000, 0.9, 0.8]); }
  const roadM = (w: number, d: number, x: number, z: number) => { const t = road.clone() as THREE.MeshToonMaterial; t.map = cobble("#8a847a", "#6e685f", 1); t.map.repeat.set(w / 6, d / 6); plane(w, d, t, [x, 0.03, z]); };
  roadM(4000, 16, 0, 128); roadM(4000, 16, 0, 212);                      // quays
  roadM(16, 4000, 0, -1100); roadM(16, 120, 0, 74);                       // avenue south / tower to bridge
  for (const s of [-1, 1]) roadM(14, 560, s * 102, -330);                 // side avenues of the Champ de Mars
  roadM(4000, 16, 0, -575); roadM(4000, 14, 0, 420);
  // the Champ de Mars: gravel, parterres, flower borders, tree rows
  plane(190, 500, gravel, [0, 0.02, -330]);
  const lawn = toon(0xffffff, lawnTex());
  for (const [x, z, w, d] of [[-42, -200, 66, 200], [42, -200, 66, 200], [-42, -450, 66, 200], [42, -450, 66, 200], [0, -330, 14, 460]] as const) {
    if (w === 14) continue;
    plane(w, d, lawn, [x, 0.05, z]);
    for (const s of [-1, 1]) for (let k = 0; k < Math.floor(d / 3); k++) B.add(SPH, flowers[(k + (s > 0 ? 1 : 0)) % 4], [x + s * (w / 2 - 1), 0.3, z - d / 2 + 1.5 + k * 3], [0, 0, 0], [0.8, 0.5, 0.8]);
    B.add(BOX, toon(0x4f8a3a), [x, 0.45, z - d / 2 + 0.6], [0, 0, 0], [w, 0.9, 0.9]); B.add(BOX, toon(0x4f8a3a), [x, 0.45, z + d / 2 - 0.6], [0, 0, 0], [w, 0.9, 0.9]);
  }
  plane(140, 120, lawn, [0, 0.04, -20]); // lawns under the tower
  for (const [x, z] of [[-75, 40], [75, 40], [-75, -60], [75, -60]]) { B.add(CYL, stoneL, [x, 0.3, z], [0, 0, 0], [9, 0.6, 9]); B.add(CYL, toon(0x5f9ac0), [x, 0.62, z], [0, 0, 0], [8.2, 0.05, 8.2]); }

  // ---- trees ----
  const tree = (x: number, z: number, s: number, i: number) => {
    B.add(CYL8, trunkM, [x, 2.2 * s, z], [0, 0, 0], [0.28 * s, 4.4 * s, 0.28 * s]);
    for (let k = 0; k < 4; k++) B.add(ICO, leaf[(i + k) % 3], [x + (rnd(i * 3 + k) - 0.5) * 2.6 * s, (5.2 + (k % 2) * 1.3) * s, z + (rnd(i * 5 + k) - 0.5) * 2.6 * s], [0, rnd(i + k), 0], [2.3 * s, 1.9 * s, 2.3 * s]);
  };
  let ti = 0;
  for (const x of [-88, -76, 76, 88]) for (let z = -100; z > -565; z -= 11) tree(x, z, 1.05, ti++);
  for (let x = -600; x <= 600; x += 13) { if (Math.abs(x) > 24) { tree(x, 124, 1.0, ti++); tree(x, 216, 1.0, ti++); } }
  for (let z = STREET_Z0 - 10; z > STREET_Z1; z -= 14) for (const x of [-10.6, 10.6]) if (Math.abs(z - CAFE_Z) > 14) tree(x, z, 0.9, ti++);
  for (const [x, z] of [[-60, 60], [60, 60], [-95, 0], [95, 0], [-60, -80], [60, -80], [-100, 90], [100, 90]]) tree(x, z, 1.3, ti++);

  // ---- street furniture ----
  const lamp = (x: number, z: number, h = 4.4) => {
    B.add(CYL8, ironG, [x, 0.35, z], [0, 0, 0], [0.26, 0.7, 0.26]); B.add(CYL8, ironG, [x, h / 2, z], [0, 0, 0], [0.09, h, 0.09]);
    B.add(BOX, glassL, [x, h + 0.3, z], [0, 0, 0], [0.42, 0.55, 0.42]); B.add(CONE, ironG, [x, h + 0.75, z], [0, 0, 0], [0.38, 0.4, 0.38]);
    lamps.push({ p: [x, h + 0.3, z], order: 0, tint: [1, 0.78, 0.45] });
  };
  const morris = (x: number, z: number) => {
    B.add(CYL, ironG, [x, 0.25, z], [0, 0, 0], [0.85, 0.5, 0.85]);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 2.6, 16, 1, true), new THREE.MeshToonMaterial({ map: posterTex(), gradientMap: ramp })); c.position.set(x, 1.8, z); R.add(c);
    B.add(CYL, ironG, [x, 3.2, z], [0, 0, 0], [0.85, 0.2, 0.85]); B.add(DOME, ironG, [x, 3.3, z], [0, 0, 0], [0.8, 0.7, 0.8]); B.add(SPH, ironG, [x, 4.1, z], [0, 0, 0], [0.15, 0.2, 0.15]);
  };
  const kiosk = (x: number, z: number, ry: number) => {
    B.add(BOX, ironG, [x, 1.3, z], [0, ry, 0], [2.4, 2.6, 1.8]);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.0), new THREE.MeshToonMaterial({ map: posterTex(), gradientMap: ramp })); p.position.set(x + Math.sin(ry) * 0.92, 1.9, z + Math.cos(ry) * 0.92); p.rotation.y = ry; R.add(p);
    B.add(BOX, toon(0xf1ead6), [x + Math.sin(ry) * 0.95, 1.0, z + Math.cos(ry) * 0.95], [0, ry, 0], [1.6, 0.5, 0.25]);
    B.add(MANS, ironG, [x, 2.85, z], [0, ry, 0], [2.8, 0.5, 2.2]); B.add(DOME, ironG, [x, 3.1, z], [0, 0, 0], [0.6, 0.5, 0.6]);
  };
  const bench = (x: number, z: number, ry: number) => {
    B.add(BOX, wood, [x, 0.5, z], [0, ry, 0], [1.8, 0.08, 0.5]); B.add(BOX, wood, [x - Math.cos(ry) * 0 + Math.sin(ry) * -0.24, 0.85, z + Math.cos(ry) * -0.24], [0.2, ry, 0], [1.8, 0.4, 0.06]);
    for (const s of [-0.8, 0.8]) B.add(BOX, ironG, [x + Math.cos(ry) * s, 0.25, z - Math.sin(ry) * s], [0, ry, 0], [0.08, 0.5, 0.5]);
  };

  // ---- buildings ----
  let bi = 0;
  /** one Haussmann building: footprint w (x) by d (z) centred at x,z; facade textures on all sides */
  const building = (x: number, z: number, w: number, d: number, n: number, detail: number /* 0 none, else the facade normal dir: 1 +x, 2 -x, 3 +z, 4 -z */) => {
    const i = bi++, base = BASES[i % 4], shop = SHOPS[Math.floor(rnd(i + 40) * 5)], H = 4.8 + n * 3.4;
    B.add(facadeBox(w, H, d, 3.6), toon(0xffffff, facadeTex(n, base, shop)), [x, H / 2, z]);
    B.add(BOX, stoneL, [x, H + 0.25, z], [0, 0, 0], [w + 0.6, 0.5, d + 0.6]);                          // cornice
    const mh = 4.4 + rnd(i + 1) * 1.6;
    B.add(MANS, rnd(i + 2) < 0.5 ? zinc : zincD, [x, H + 0.5 + mh / 2, z], [0, 0, 0], [w, mh, d]);
    for (let k = 0; k < 2 + Math.floor(rnd(i + 3) * 3); k++) {                                           // chimney stacks with pots
      const cx = x + (rnd(i * 7 + k) - 0.5) * w * 0.5, cz = z + (rnd(i * 9 + k) - 0.5) * d * 0.5, ch = H + mh + 0.6;
      B.add(BOX, terra, [cx, ch, cz], [0, 0, 0], [1.4, 2.6, 0.7]);
      for (let p = 0; p < 3; p++) B.add(CYL8, potM, [cx - 0.45 + p * 0.45, ch + 1.6, cz], [0, 0, 0], [0.13, 0.6, 0.13]);
    }
    if (!detail) return;
    // street-facing detail: real balconies, dormers, a shop awning, doors
    const nx = detail === 1 ? 1 : detail === 2 ? -1 : 0, nz = detail === 3 ? 1 : detail === 4 ? -1 : 0;
    const fx = x + nx * w / 2, fz = z + nz * d / 2, along = nx ? d : w, ry = nx ? Math.PI / 2 : 0;
    const P = (a: number, off: number, y: number): V3 => [fx + nx * off + (nx ? 0 : a), y, fz + nz * off + (nx ? a : 0)];
    for (const y of [4.8 + 3.4 + 0.15, 4.8 + (n - 1) * 3.4 + 0.15]) {
      B.add(BOX, stoneD, P(0, 0.45, y), [0, ry, 0], [along - 0.4, 0.22, 0.9]);
      B.add(BOX, black, P(0, 0.88, y + 0.62), [0, ry, 0], [along - 0.4, 0.08, 0.06]);
      for (let k = -along / 2 + 0.6; k < along / 2 - 0.4; k += 0.5) B.add(BOX, black, P(k, 0.88, y + 0.36), [0, ry, 0], [0.04, 0.5, 0.04]);
    }
    for (let k = -along / 2 + 1.8; k < along / 2 - 1; k += 3.6) {                                       // dormers
      B.add(BOX, stoneL, P(k, -0.9, H + 1.9), [0, ry, 0], [1.3, 1.8, 1.2]); B.add(BOX, toon(0x43546a), P(k, -0.28, H + 1.8), [0, ry, 0], [0.8, 1.1, 0.05]);
      B.add(PRISM, zincD, P(k, -0.9, H + 3.1), [0, ry + Math.PI / 2, Math.PI / 2], [0.8, 1.5, 0.8]);
    }
    if (rnd(i + 5) < 0.75) { const m = awnings[Math.floor(rnd(i + 6) * 4)], aw = Math.min(along - 1, 8 + rnd(i + 7) * 6), a0 = (rnd(i + 8) - 0.5) * (along - aw);
      if (nx) B.add(BOX, m, P(a0, 1.1, 3.75), [0, 0, -0.42 * nx], [2.2, 0.08, aw]); else B.add(BOX, m, P(a0, 1.1, 3.75), [0.42 * nz, 0, 0], [aw, 0.08, 2.2]);
      B.add(BOX, m, P(a0, 2.15, 3.35), [0, ry, 0], [aw, 0.45, 0.05]); }
    B.add(BOX, toon(0x3a2a20), P((rnd(i + 9) - 0.5) * along * 0.6, 0.03, 1.6), [0, ry, 0], [1.6, 3.2, 0.1]);
  };
  /** a continuous row of buildings whose facades lie on a line; axis "z": facade at x = f, extending to side s */
  const row = (axis: "x" | "z", f: number, s: 1 | -1, a0: number, a1: number, depth: number, detail: boolean) => {
    for (let a = a0; a < a1 - 6;) {
      const w = Math.min(a1 - a, 14 + Math.floor(rnd(bi + 70) * 3) * 4), n = 5 + Math.floor(rnd(bi + 71) * 2.2);
      const c = a + w / 2;
      const dirN = axis === "z" ? (s > 0 ? 2 : 1) : (s > 0 ? 4 : 3);
      if (axis === "z") building(f + s * depth / 2, c, depth, w, n, detail ? dirN : 0); else building(c, f + s * depth / 2, w, depth, n, detail ? dirN : 0);
      a += w;
    }
  };
  // the cafe street (both sides) and its cross streets
  row("z", 15, 1, STREET_Z1, STREET_Z0, 26, true); row("z", -15, -1, STREET_Z1, STREET_Z0, 26, true);
  // the Champ de Mars side avenues
  row("z", 110, 1, -570, -80, 28, true); row("z", -110, -1, -570, -80, 28, true);
  // the quays (facing the river), the square's flanks
  row("x", 222, 1, -700, -20, 26, true); row("x", 222, 1, 20, 700, 26, false);
  row("x", 118, -1, -700, -120, 26, true); row("x", 118, -1, 120, 700, 26, true);
  row("z", 140, 1, 430, 600, 26, true); row("z", -140, -1, 430, 600, 26, true);
  row("x", 640, 1, -300, 300, 26, false);
  // Haussmann blocks everywhere else
  for (let gx = -1250; gx <= 1250; gx += 64) for (let gz = -1300; gz <= 1250; gz += 64) {
    const w = 42 + rnd(gx * 3 + gz) * 12, d = 42 + rnd(gx + gz * 5) * 12, x = gx + (rnd(gx + gz) - 0.5) * 6, z = gz + (rnd(gx * 7 - gz) - 0.5) * 6, r = Math.max(w, d) / 2;
    if (Math.hypot(x, z) > 1300) continue;
    if (Math.abs(x) < 145 + r && z > -600 - r && z < 118 + r) continue;
    if (z + r > 112 && z - r < 250) continue;
    if (Math.abs(x) < 170 + r && z + r > 410 && z - r < 660) continue;
    if (Math.abs(x) < 45 + r && z < -585 + r) continue;
    building(x, z, w, d, 5 + Math.floor(rnd(gx - gz) * 2.5), 0);
  }

  // ---- the cafe street dressing ----
  for (const s of [-1, 1]) { B.add(BOX, stoneL, [s * 12, 0.08, (STREET_Z0 + STREET_Z1) / 2], [0, 0, 0], [6, 0.16, STREET_Z0 - STREET_Z1]); B.add(BOX, stoneD, [s * 9.05, 0.1, (STREET_Z0 + STREET_Z1) / 2], [0, 0, 0], [0.25, 0.2, STREET_Z0 - STREET_Z1]); }
  for (let z = STREET_Z0 - 4; z > STREET_Z1; z -= 21) for (const x of [-9.6, 9.6]) lamp(x, z);
  morris(-11.5, -628); morris(11.5, -720); kiosk(-12, -680, Math.PI / 2); bench(-10.4, -700, Math.PI / 2); bench(10.4, -612, -Math.PI / 2);
  // cafe: awning, sign, terrace tables + chairs + planters, menu board
  B.add(BOX, awnings[0], [13.2, 3.7, CAFE_Z], [0, 0, 0.38], [4.2, 0.08, 16]); B.add(BOX, awnings[0], [11.2, 3.0, CAFE_Z], [0, 0, 0], [0.05, 0.5, 16]);
  const cs = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.6), new THREE.MeshToonMaterial({ map: signTex("CAFÉ DE LA TOUR", "#7a1f2b", "#f2d27a"), gradientMap: ramp })); cs.position.set(14.9, 5.2, CAFE_Z); cs.rotation.y = -Math.PI / 2; R.add(cs);
  for (let k = 0; k < 6; k++) {
    const tz = CAFE_Z - 6.5 + k * 2.6, tx = 12.8 - (k % 2) * 1.6;
    B.add(CYL, toon(0xf1ead6), [tx, 0.95, tz], [0, 0, 0], [0.45, 0.05, 0.45]); B.add(CYL8, black, [tx, 0.5, tz], [0, 0, 0], [0.05, 0.9, 0.05]); B.add(CYL8, black, [tx, 0.04, tz], [0, 0, 0], [0.3, 0.05, 0.3]);
    for (const dz of [-0.75, 0.75]) { B.add(BOX, toon(0x8a5a2a), [tx, 0.5, tz + dz], [0, 0, 0], [0.45, 0.06, 0.45]); B.add(BOX, toon(0x8a5a2a), [tx, 0.82, tz + dz * 1.35], [0, 0, 0], [0.45, 0.6, 0.05]); }
    B.add(CYL8, toon(0xf6efe0), [tx + 0.1, 1.04, tz], [0, 0, 0], [0.07, 0.12, 0.07]);
  }
  for (const z of [CAFE_Z - 8.5, CAFE_Z + 8.5]) { B.add(BOX, toon(0x5a3a22), [12.6, 0.4, z], [0, 0, 0], [0.8, 0.8, 0.8]); B.add(ICO, leaf[1], [12.6, 1.3, z], [0, 0, 0], [0.7, 0.8, 0.7]); }
  B.add(BOX, black, [10.4, 0.7, CAFE_Z - 9.5], [0, 0, -0.2], [0.05, 1.4, 0.8]);
  // parked cars along the street
  for (let k = 0; k < 7; k++) car(B, [k % 2 ? 7.4 : -7.4, 0, STREET_Z0 - 60 - k * 46], k % 2 ? Math.PI : 0, [0x1c1c22, 0x7a1f2b, 0x2a3a5a, 0x3a5a3a, 0xd9c9a0][k % 5]);

  // ---- the Seine: bridge, barges ----
  B.add(BOX, stoneL, [0, -0.45, 170], [0, 0, 0], [34, 1.0, 72]);
  for (const z of [152, 170, 188]) { B.add(BOX, stoneD, [0, -2.2, z], [0, 0, 0], [34, 2.6, 3.6]); }
  for (const s of [-1, 1]) {
    for (const [cz, r] of [[146, 6], [161, 9], [179, 9], [194, 6]]) { const c = new THREE.Mesh(new THREE.TorusGeometry(r, 0.9, 6, 18, Math.PI), stoneD); c.rotation.y = Math.PI / 2; c.position.set(s * 16.6, -3.4, cz); c.scale.set(1, 3.0 / r, 1); R.add(c); }
    B.add(BOX, stoneL, [s * 16.4, 0.5, 170], [0, 0, 0], [1.0, 1.0, 72]);
    for (let z = 138; z <= 202; z += 3.2) B.add(CYL8, stoneL, [s * 16.4, 1.3, z], [0, 0, 0], [0.18, 0.7, 0.18]);
    B.add(BOX, stoneL, [s * 16.4, 1.75, 170], [0, 0, 0], [0.6, 0.2, 72]);
    for (const z of [140, 200]) { B.add(BOX, stoneD, [s * 16.4, 2.2, z], [0, 0, 0], [3, 4.4, 3]); B.add(BOX, stoneL, [s * 16.4, 4.6, z], [0, 0, 0], [3.4, 0.4, 3.4]); B.add(SPH, stoneL, [s * 16.4, 6.0, z], [0, 0, 0], [1.1, 1.4, 1.1]); }
    for (const z of [152, 170, 188]) lamp(s * 16.4, z, 4.0);
  }
  for (const [x, z, l, c] of [[-120, 160, 30, 0x3a2a20], [-170, 185, 26, 0x2a3a4a], [140, 178, 22, 0xf1ead6]] as const) {
    B.add(BOX, toon(c), [x, -3.0, z], [0, 0, 0], [l, 1.6, 6]); B.add(BOX, toon(0x8a5a2a), [x - l * 0.25, -1.6, z], [0, 0, 0], [l * 0.3, 1.4, 4.6]); B.add(BOX, toon(0xd9c9a0), [x + l * 0.15, -2.0, z], [0, 0, 0], [l * 0.4, 0.6, 4.6]);
  }
  // ---- around the tower and the Champ de Mars ----
  for (let z = -100; z > -560; z -= 30) for (const x of [-96, 96]) lamp(x, z);
  for (const [x, z] of [[-30, 60], [30, 60], [-30, 100], [30, 100], [-70, -70], [70, -70]]) lamp(x, z);
  for (let z = -110; z > -560; z -= 40) { bench(-82, z, Math.PI / 2); bench(82, z, -Math.PI / 2); }
  kiosk(-60, -72, 0); kiosk(60, -72, 0); morris(-24, 112); morris(24, 112);
  for (let k = 0; k < 6; k++) car(B, [-6 + (k % 2) * 12, 0, 40 + k * 14], k % 2 ? Math.PI : 0, [0x1c1c22, 0x7a1f2b, 0x2a3a5a][k % 3]);

  // ---- the square ----
  const [SX, , SZ] = SQUARE;
  plane(260, 170, toon(0xffffff, cobble("#cdbfa6", "#a8987c", 30)), [SX, 0.03, SZ + 5]);
  B.add(BOX, stoneL, [SX, 0.6, SZ], [0, 0, 0], [6, 1.2, 6]); B.add(BOX, stoneD, [SX, 2.4, SZ], [0, 0, 0], [3.6, 2.4, 3.6]);
  const ob = new THREE.CylinderGeometry(0.95 * 0.7071, 1.35 * 0.7071, 23, 4, 1); ob.rotateY(Math.PI / 4);
  B.add(ob, toon(0xd9b88a), [SX, 15.1, SZ]); B.add(CONE, toon(0xe8c050), [SX, 27.6, SZ], [0, Math.PI / 4, 0], [1.0, 2.0, 1.0]);
  for (const s of [-1, 1]) { // fountains
    const fx = SX + s * 46;
    B.add(CYL, stoneL, [fx, 0.5, SZ], [0, 0, 0], [10, 1, 10]); B.add(CYL, toon(0x5f9ac0), [fx, 1.02, SZ], [0, 0, 0], [9.3, 0.05, 9.3]);
    B.add(CYL, stoneD, [fx, 2.2, SZ], [0, 0, 0], [0.9, 3.0, 0.9]); B.add(CYL, toon(0x3f7a6a), [fx, 3.8, SZ], [0, 0, 0], [3.6, 0.4, 3.6]); B.add(CYL, stoneD, [fx, 4.8, SZ], [0, 0, 0], [0.5, 2, 0.5]); B.add(CYL, toon(0x3f7a6a), [fx, 5.9, SZ], [0, 0, 0], [1.8, 0.3, 1.8]);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; B.add(SPH, toon(0x3f7a6a), [fx + Math.cos(a) * 5.4, 1.4, SZ + Math.sin(a) * 5.4], [0, 0, 0], [0.5, 0.7, 0.5]); }
    for (let k = 0; k < 10; k++) B.add(SPH, toon(0xdff2ff), [fx, 6.3 + k * 0.32, SZ], [0, 0, 0], [0.35 - k * 0.025, 0.25, 0.35 - k * 0.025]);
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; B.add(SPH, toon(0xdff2ff), [fx + Math.cos(a) * 2.2, 3.5, SZ + Math.sin(a) * 2.2], [0, 0, 0], [0.3, 0.6, 0.3]); }
  }
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, x = SX + Math.cos(a) * 70, z = SZ + Math.sin(a) * 50; if (z > SZ + 45) continue; B.add(CYL8, toon(0x3a4a3a), [x, 3, z], [0, 0, 0], [0.35, 6, 0.35]); lamp(x, z, 6.4); }
  for (const [x, z] of [[-110, 450], [110, 450], [-110, 585], [110, 585]]) { B.add(BOX, stoneL, [x, 2.4, z], [0, 0, 0], [5, 4.8, 5]); B.add(BOX, stoneD, [x, 5.0, z], [0, 0, 0], [5.6, 0.4, 5.6]); B.add(CYL, toon(0xd9cdb6), [x, 6.6, z], [0, 0, 0], [1.1, 2.8, 1.1]); B.add(SPH, toon(0xd9cdb6), [x, 8.4, z], [0, 0, 0], [0.8, 0.9, 0.8]); }
  for (let k = 0; k < 8; k++) car(B, [SX - 60 + k * 17, 0, SZ - 64 + (k % 2) * 6], Math.PI / 2 + (k % 2 ? Math.PI : 0), [0x1c1c22, 0x7a1f2b, 0x2a3a5a, 0xd9c9a0][k % 4], k % 3 === 0);

  // ---- the Grand Hotel (front at z = HOTEL_Z, facing -z) ----
  const hz = HOTEL_Z, hw = 140, hH = 20;
  const hg = new THREE.BoxGeometry(hw, hH, 32), huv = hg.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < 24; i++) { const f = Math.floor(i / 4); if (f === 2 || f === 3) huv.setXY(i, 0, 0); else huv.setX(i, huv.getX(i) * (f < 2 ? 4 : 20)); }
  const htex = hotelTex(); htex.wrapS = THREE.RepeatWrapping;
  B.add(hg, toon(0xffffff, htex), [0, hH / 2, hz + 16]);
  B.add(BOX, stoneL, [0, hH + 0.4, hz + 16], [0, 0, 0], [hw + 1.2, 0.8, 33.2]);
  for (let k = 0; k < 47; k++) B.add(CYL8, stoneL, [-69 + k * 3, hH + 1.3, hz - 0.2], [0, 0, 0], [0.2, 1.0, 0.2]);
  B.add(BOX, stoneL, [0, hH + 1.9, hz - 0.2], [0, 0, 0], [hw, 0.3, 0.6]);
  for (let k = 0; k < 12; k++) B.add(SPH, stoneL, [-66 + k * 12, hH + 2.5, hz - 0.2], [0, 0, 0], [0.5, 0.7, 0.5]);
  B.add(MANS, zinc, [0, hH + 4.5, hz + 16], [0, 0, 0], [hw - 4, 7, 28]);
  for (let k = -5; k <= 5; k++) { B.add(BOX, stoneL, [k * 11, hH + 4.3, hz + 4.3], [0, 0, 0], [2, 3, 2]); B.add(BOX, toon(0x43546a), [k * 11, hH + 4.1, hz + 3.25], [0, 0, 0], [1.2, 1.8, 0.05]); B.add(DOME, zincD, [k * 11, hH + 5.8, hz + 4.3], [0, 0, 0], [1.2, 0.8, 1.2]); }
  // colonnade over an arcaded ground floor, pediments at the ends
  for (let k = 0; k < 12; k++) {
    const x = -38 + k * (76 / 11);
    B.add(CYL, toon(0xf3ead6), [x, 12, hz - 2.2], [0, 0, 0], [0.75, 12, 0.75]); B.add(BOX, stoneL, [x, 18.2, hz - 2.2], [0, 0, 0], [1.9, 0.5, 1.9]); B.add(BOX, stoneL, [x, 5.9, hz - 2.2], [0, 0, 0], [1.8, 0.4, 1.8]);
  }
  B.add(BOX, stoneL, [0, 19.2, hz - 1.8], [0, 0, 0], [80, 1.6, 4.2]); B.add(BOX, stoneD, [0, 5.4, hz - 1.8], [0, 0, 0], [80, 0.8, 4.4]);
  for (const s of [-1, 1]) { B.add(PRISM, stoneL, [s * 34, 21.6, hz - 1.6], [Math.PI / 2, 0, Math.PI / 2], [3.2, 4.0, 8.0]); B.add(BOX, stoneL, [s * 34, 20.2, hz - 1.6], [0, 0, 0], [16, 0.5, 4.4]); }
  // entrance: steps, red carpet, marquise, flags, topiaries, sign
  for (let k = 0; k < 4; k++) B.add(BOX, stoneL, [0, 0.12 + k * 0.24, hz - 6 + k * 0.7], [0, 0, 0], [14 - k, 0.24, 1.4]);
  B.add(BOX, toon(0xa8202a), [0, 1.0, hz - 3.6], [0, 0, 0], [3.4, 0.04, 6]); B.add(BOX, toon(0xa8202a), [0, 0.05, hz - 12], [0, 0, 0], [3.4, 0.04, 12]);
  B.add(BOX, toon(0x3a2418), [0, 3.0, hz - 0.15], [0, 0, 0], [4.0, 4.6, 0.3]); B.add(BOX, toon(0xe8c050), [0, 3.0, hz - 0.35], [0, 0, 0], [0.15, 4.6, 0.12]);
  B.add(BOX, toon(0x1e1e22), [0, 5.6, hz - 4.5], [0.12, 0, 0], [9, 0.25, 7]); B.add(BOX, toon(0xe8c050), [0, 5.45, hz - 8.0], [0, 0, 0], [9.2, 0.35, 0.2]);
  for (const s of [-1, 1]) { B.add(CYL8, toon(0x1e1e22), [s * 4.3, 2.75, hz - 7.8], [0, 0, 0], [0.12, 5.5, 0.12]); B.add(BOX, toon(0x2f5a3a), [s * 6.5, 0.6, hz - 7], [0, 0, 0], [1.2, 1.2, 1.2]); B.add(CONE, leaf[1], [s * 6.5, 2.6, hz - 7], [0, 0, 0], [0.9, 2.8, 0.9]); lamp(s * 8.5, hz - 9, 4.6); }
  const hs = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.3), new THREE.MeshToonMaterial({ map: signTex("GRAND HÔTEL", "#1e1e22", "#e8c050"), gradientMap: ramp })); hs.position.set(0, 6.5, hz - 7.9); hs.rotation.y = Math.PI; R.add(hs);
  const fm = new THREE.MeshToonMaterial({ map: flagTex(), gradientMap: ramp, side: THREE.DoubleSide });
  for (const x of [-12, 12, -40, 40]) { B.add(CYL8, toon(0xe0e0e0), [x, hH + 6.5, hz - 0.5], [0, 0, 0], [0.1, 9, 0.1]); const f = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.4, 6, 1), fm); f.position.set(x + 1.8, hH + 9.6, hz - 0.5); R.add(f); }
};
