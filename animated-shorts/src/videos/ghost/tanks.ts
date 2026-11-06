// Detailed cartoon tanks for "The Ghost Army" (nose toward +x, ground at y = 0, ~6 m long).
//   us: M4 Sherman-like: sloped glacis with a rounded transmission nose, cast rounded turret, commander cupola + .50 cal,
//       vertical-volute bogies, drive sprocket front / idler rear, fenders, headlights, tools, painted panel lines + dirt.
//   de: Panzer IV-like: boxy stepped hull, side skirts over the tracks, boxy turret with skirt, long gun + muzzle brake.
// Parts are merged per material (a handful of meshes per tank) to keep the software renderer fast.
// The returned group has userData.body (what setInflate squashes for the inflatable look).
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { NOINK } from "../bridge/ink";

type Toon = (c: THREE.ColorRepresentation, map?: THREE.Texture) => THREE.Material;

const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};
/** paint with panel lines, rivets and dirt toward the bottom */
const paint = (base: string, line: string, dirt: string) => tex(256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 160; i++) { const v = Math.sin(i * 91.3) * 0.5 + 0.5; g.fillStyle = `rgba(0,0,0,${0.03 + v * 0.04})`; g.fillRect((i * 53) % 256, (i * 97) % 256, 18 + v * 30, 6 + v * 10); }
  g.strokeStyle = line; g.lineWidth = 3;
  for (const x of [64, 150, 214]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  g.beginPath(); g.moveTo(0, 120); g.lineTo(256, 120); g.stroke();
  g.fillStyle = line; for (let x = 10; x < 256; x += 22) { g.beginPath(); g.arc(x, 128, 2.2, 0, Math.PI * 2); g.fill(); }
  const gr = g.createLinearGradient(0, 150, 0, 256); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, dirt);
  g.fillStyle = gr; g.fillRect(0, 150, 256, 106);
});
const treadTex = () => tex(64, 256, (g) => {
  g.fillStyle = "#2a2824"; g.fillRect(0, 0, 64, 256);
  g.fillStyle = "#4a463e"; for (let y = 0; y < 256; y += 16) g.fillRect(0, y, 64, 9);
  g.fillStyle = "#1a1916"; for (let y = 4; y < 256; y += 16) g.fillRect(28, y, 8, 4);
});
const starTex = () => tex(128, 128, (g) => {
  g.clearRect(0, 0, 128, 128);
  g.strokeStyle = "#ecebe2"; g.lineWidth = 7; g.beginPath(); g.arc(64, 64, 55, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#ecebe2"; g.beginPath();
  for (let k = 0; k < 10; k++) { const r = k % 2 ? 18 : 47, a = ((k * 36 - 90) * Math.PI) / 180; g.lineTo(64 + r * Math.cos(a), 64 + r * Math.sin(a)); }
  g.closePath(); g.fill();
});

class Parts {
  private m = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geo: THREE.BufferGeometry, mat: THREE.Material, p: [number, number, number], r: [number, number, number] = [0, 0, 0], s: [number, number, number] = [1, 1, 1]) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array((g.attributes.position.count) * 2), 2));
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r, "XYZ")), new THREE.Vector3(...s)));
    const l = this.m.get(mat); if (l) l.push(g); else this.m.set(mat, [g]);
  }
  build(parent: THREE.Object3D) { for (const [mat, gs] of this.m) { const g = mergeGeometries(gs, false); if (g) parent.add(new THREE.Mesh(g, mat)); } }
}

/** side-profile polygon extruded across the hull width (centred on z) */
const hullGeo = (pts: [number, number][], width: number) => {
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: width, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1 });
  g.translate(0, 0, -width / 2);
  g.computeVertexNormals();
  return g;
};

const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = (seg = 16) => new THREE.CylinderGeometry(1, 1, 1, seg), SPH = new THREE.SphereGeometry(1, 20, 12);
const CACHE: Partial<Record<string, { paint: THREE.Material; dark: THREE.Material; tread: THREE.Material; metal: THREE.Material; wood: THREE.Material; lens: THREE.Material; star: THREE.Texture }>> = {};

export const makeTank = (kind: "us" | "de", toon: Toon) => {
  const M = (CACHE[kind] ??= {
    paint: kind === "us" ? toon(0xffffff, paint("#5d6539", "#3e4426", "rgba(70,55,35,0.55)")) : toon(0xffffff, paint("#6f756d", "#4a4f49", "rgba(70,60,45,0.5)")),
    dark: toon(0x2c2b27), tread: toon(0xffffff, treadTex()), metal: toon(0x4a4d48), wood: toon(0x8a6a44), lens: toon(0xe8e4c8), star: starTex(),
  })!;
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const P = new Parts();
  const cyl = CYL(), cyl8 = CYL(8);
  // ---- running gear (both sides) ----
  const wheels = kind === "us" ? 6 : 8, wr = kind === "us" ? 0.3 : 0.26, half = kind === "us" ? 1.06 : 1.08;
  for (const sz of [-1, 1]) {
    const z = sz * half;
    // track belt: top run, bottom run, wrap around the sprocket (front) and idler (rear)
    P.add(BOX, M.tread, [0.05, 1.05, z], [0, 0, 0], [5.2, 0.12, 0.52]);
    P.add(BOX, M.tread, [0, 0.06, z], [0, 0, 0], [4.6, 0.12, 0.52]);
    P.add(BOX, M.tread, [2.6, 0.45, z], [0, 0, 0.95], [0.95, 0.12, 0.52]);
    P.add(BOX, M.tread, [-2.62, 0.5, z], [0, 0, -0.75], [1.0, 0.12, 0.52]);
    P.add(cyl, M.metal, [2.72, 0.78, z], [Math.PI / 2, 0, 0], [0.34, 0.5, 0.34]);         // drive sprocket
    P.add(cyl, M.metal, [-2.74, 0.62, z], [Math.PI / 2, 0, 0], [0.3, 0.5, 0.3]);          // idler
    for (let i = 0; i < wheels; i++) {
      const x = -2.0 + (i * 4.1) / (wheels - 1);
      P.add(cyl, M.dark, [x, wr + 0.12, z], [Math.PI / 2, 0, 0], [wr, 0.48, wr]);
      P.add(cyl8, M.metal, [x, wr + 0.12, z + sz * 0.25], [Math.PI / 2, 0, 0], [wr * 0.45, 0.04, wr * 0.45]); // hub
      if (kind === "us" && i % 2 === 0) P.add(BOX, M.paint, [x + 0.4, 0.62, z + sz * 0.05], [0, 0, 0], [0.62, 0.42, 0.28]); // bogie bracket
    }
    if (kind === "us") for (const x of [-1.3, 0.1, 1.5]) P.add(cyl8, M.dark, [x, 1.0, z], [Math.PI / 2, 0, 0], [0.11, 0.4, 0.11]); // return rollers
  }
  if (kind === "us") {
    // ---- hull: rounded transmission nose, sloped glacis, flat deck, sloped rear ----
    P.add(hullGeo([[-2.75, 0.62], [2.45, 0.62], [2.85, 0.82], [2.95, 1.08], [2.82, 1.32], [1.35, 2.02], [-2.45, 2.02], [-2.8, 1.62]], 2.0), M.paint, [0, 0, 0]);
    // sponsons over the tracks + fenders
    for (const sz of [-1, 1]) {
      P.add(BOX, M.paint, [-0.4, 1.68, sz * 1.08], [0, 0, 0], [4.4, 0.68, 0.48]);
      P.add(BOX, M.paint, [0.05, 1.32, sz * 1.18], [0, 0, 0], [5.6, 0.05, 0.62]);
      P.add(BOX, M.wood, [-1.6, 2.06, sz * 1.0], [0, 0, 0], [1.2, 0.06, 0.12]);       // shovel / tools on the deck
    }
    // glacis details: hatches, headlights, spare track links, tow hooks
    for (const sz of [-1, 1]) {
      P.add(BOX, M.paint, [1.7, 2.0, sz * 0.5], [0, 0, 0.45], [0.6, 0.12, 0.55]);
      P.add(cyl8, M.metal, [2.55, 1.45, sz * 0.82], [0, 0, Math.PI / 2], [0.1, 0.16, 0.1]);
      P.add(cyl8, M.lens, [2.64, 1.45, sz * 0.82], [0, 0, Math.PI / 2], [0.075, 0.03, 0.075]);
      P.add(BOX, M.dark, [3.0, 0.8, sz * 0.62], [0, 0, 0], [0.15, 0.12, 0.2]);
    }
    for (let k = 0; k < 4; k++) P.add(BOX, M.tread, [2.25 - k * 0.18, 1.6 + k * 0.09, 0], [0, 0, 0.45], [0.16, 0.06, 1.2]);
    P.add(cyl8, M.metal, [2.15, 1.55, 0.55], [0, 0, 1.1], [0.05, 0.5, 0.05]);           // bow machine gun
    P.add(BOX, M.dark, [-2.8, 1.5, 0], [0, 0, 0.3], [0.1, 0.5, 1.6]);                     // rear exhaust deflector
    // ---- turret: cast, rounded ----
    P.add(cyl, M.paint, [-0.25, 2.3, 0], [0, 0, 0], [1.02, 0.5, 1.02]);
    P.add(SPH, M.paint, [-0.25, 2.5, 0], [0, 0, 0], [1.08, 0.45, 1.0]);
    P.add(BOX, M.paint, [-1.25, 2.4, 0], [0, 0, 0], [0.5, 0.42, 1.1]);                    // bustle
    P.add(BOX, M.paint, [0.82, 2.38, 0], [0, 0, 0], [0.3, 0.52, 0.9]);                    // mantlet
    P.add(cyl, M.paint, [2.1, 2.4, 0], [0, 0, Math.PI / 2], [0.085, 2.5, 0.085]);         // main gun
    P.add(cyl, M.paint, [3.3, 2.4, 0], [0, 0, Math.PI / 2], [0.11, 0.18, 0.11]);          // muzzle
    P.add(cyl, M.paint, [-0.6, 2.98, 0.4], [0, 0, 0], [0.32, 0.22, 0.32]);                // commander cupola
    P.add(cyl, M.dark, [-0.6, 3.1, 0.4], [0, 0, 0], [0.3, 0.04, 0.3]);
    P.add(cyl8, M.metal, [-0.1, 3.2, 0.4], [0, 0, Math.PI / 2 - 0.1], [0.035, 1.1, 0.035]); // .50 cal
    P.add(BOX, M.metal, [-0.6, 3.15, 0.4], [0, 0, 0], [0.12, 0.25, 0.12]);
    P.add(cyl8, M.metal, [-0.5, 3.0, -0.5], [0, 0, 0], [0.02, 1.4, 0.02]);               // radio antenna
  } else {
    // ---- Panzer IV-like: stepped boxy hull ----
    P.add(hullGeo([[-2.95, 0.62], [2.65, 0.62], [3.0, 0.95], [3.0, 1.38], [2.55, 1.42], [2.45, 1.95], [-2.95, 1.95]], 2.0), M.paint, [0, 0, 0]);
    for (const sz of [-1, 1]) {
      P.add(BOX, M.paint, [-0.2, 1.62, sz * 1.08], [0, 0, 0], [5.4, 0.66, 0.48]);
      P.add(BOX, M.paint, [-0.1, 1.28, sz * 1.42], [0, 0, 0], [5.2, 0.85, 0.05]);       // side skirts (Schuerzen)
      for (let k = 0; k < 5; k++) P.add(BOX, M.dark, [-2.6 + k * 1.05, 1.28, sz * 1.445], [0, 0, 0], [0.02, 0.85, 0.01]);
    }
    P.add(BOX, M.dark, [2.75, 1.68, 0.45], [0, 0, 0], [0.1, 0.22, 0.4]);                  // driver visor
    P.add(BOX, M.tread, [2.95, 1.15, 0], [0, 0, 0], [0.08, 0.3, 1.6]);                    // spare track links
    // turret: boxy with sloped sides, skirt, cupola, long gun with muzzle brake
    const tg = hullGeo([[-1.15, 0], [0.95, 0], [0.8, 0.72], [-1.05, 0.72]], 1.7);
    P.add(tg, M.paint, [-0.35, 1.98, 0]);
    for (const sz of [-1, 1]) P.add(BOX, M.paint, [-0.4, 2.3, sz * 1.18], [0, 0, 0], [2.2, 0.7, 0.04]);
    P.add(BOX, M.paint, [0.68, 2.32, 0], [0, 0, 0], [0.3, 0.5, 0.7]);
    P.add(cyl, M.paint, [2.35, 2.32, 0], [0, 0, Math.PI / 2], [0.07, 3.3, 0.07]);
    P.add(BOX, M.metal, [4.05, 2.32, 0], [0, 0, 0], [0.32, 0.2, 0.26]);                   // muzzle brake
    P.add(cyl, M.paint, [-1.0, 2.82, 0], [0, 0, 0], [0.3, 0.26, 0.3]);
    P.add(cyl, M.dark, [-1.0, 2.96, 0], [0, 0, 0], [0.28, 0.04, 0.28]);
  }
  P.build(body);
  if (kind === "us") for (const sz of [-1, 1]) {   // white stars on the sponsons
    const st = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: M.star, transparent: true, depthWrite: false }));
    st.position.set(-0.6, 1.68, sz * 1.33); if (sz < 0) st.rotation.y = Math.PI; st.layers.set(NOINK); body.add(st);
  }
  g.userData.body = body;
  return g;
};
