// "The Man Who Was Already Dead": one small apartment (living room + bedroom doorway) and the hallway outside it,
// built from toon-shaded boxes with painted Canvas2D textures. World ink comes from the bridge InkPass; character
// cards live on the NOINK layer. Units are metres, y up. Living room x -3..3, z -4..4; front door in the z = -4 wall,
// bedroom door in the z = +4 wall, window in the x = +3 wall, hallway beyond the front door (z -6.2..-4).
import * as THREE from "three";
import { NOINK } from "../bridge/ink";

export type LightName = "night" | "hall" | "day" | "dark";

// ---------------- painted textures ----------------
const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
};
const rnd = (i: number) => { const v = Math.sin(i * 127.1 + 17.3) * 43758.5453; return v - Math.floor(v); };

const wallpaper = (base: string, stripe: string) => canvasTex(256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  g.fillStyle = stripe;
  for (let x = 0; x < 256; x += 64) g.fillRect(x + 28, 0, 8, 256);
  for (let y = 16; y < 256; y += 64) for (let x = 0; x < 256; x += 64) {
    g.beginPath(); g.moveTo(x, y - 7); g.lineTo(x + 5, y); g.lineTo(x, y + 7); g.lineTo(x - 5, y); g.closePath(); g.fill();
  }
}, [6, 3]);
const planks = () => canvasTex(512, 512, (g) => {
  g.fillStyle = "#b07d4c"; g.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 8; r++) {
    const y = r * 64, off = (r % 2) * 180;
    for (let k = 0; k < 4; k++) {
      const v = rnd(r * 9 + k);
      g.fillStyle = `rgba(${90 + v * 40},${55 + v * 25},${30 + v * 15},0.35)`;
      g.fillRect(((off + k * 256) % 768) - 128, y + 3, 250, 58);
    }
    g.fillStyle = "#4a2d18"; g.fillRect(0, y, 512, 4);
    g.fillRect((off + 250) % 512, y, 4, 64);
  }
}, [3, 4]);
const tiles = () => canvasTex(256, 256, (g) => {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    g.fillStyle = (i + j) % 2 ? "#8d9187" : "#6c7068"; g.fillRect(i * 64, j * 64, 64, 64);
  }
  g.strokeStyle = "#3a3d38"; g.lineWidth = 3;
  for (let k = 0; k <= 256; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 256); g.moveTo(0, k); g.lineTo(256, k); g.stroke(); }
}, [10, 4]);
const doorTex = (col: string, num?: string) => canvasTex(256, 560, (g) => {
  g.fillStyle = col; g.fillRect(0, 0, 256, 560);
  g.strokeStyle = "rgba(20,10,5,0.75)"; g.lineWidth = 6;
  for (const [x, y, w, h] of [[34, 40, 188, 200], [34, 290, 188, 230]]) {
    g.strokeRect(x, y, w, h);
    g.fillStyle = "rgba(255,255,255,0.06)"; g.fillRect(x + 10, y + 10, w - 20, h - 20);
  }
  if (num) {
    g.fillStyle = "#c9a74a"; g.fillRect(98, 120, 60, 40);
    g.fillStyle = "#3a2a10"; g.font = "bold 30px sans-serif"; g.textAlign = "center"; g.fillText(num, 128, 151);
  }
});
const fabric = (col: string) => canvasTex(128, 128, (g) => {
  g.fillStyle = col; g.fillRect(0, 0, 128, 128);
  g.fillStyle = "rgba(0,0,0,0.08)";
  for (let y = 0; y < 128; y += 8) g.fillRect(0, y, 128, 3);
}, [3, 3]);
const rugTex = () => canvasTex(512, 320, (g) => {
  g.fillStyle = "#5d3f7c"; g.fillRect(0, 0, 512, 320);
  g.strokeStyle = "#e0b55a"; g.lineWidth = 10; g.strokeRect(24, 24, 464, 272);
  g.strokeStyle = "#a9476a"; g.lineWidth = 8; g.strokeRect(54, 54, 404, 212);
  g.fillStyle = "#e0b55a";
  for (const [x, y] of [[256, 160], [150, 160], [362, 160]]) { g.beginPath(); g.moveTo(x, y - 40); g.lineTo(x + 30, y); g.lineTo(x, y + 40); g.lineTo(x - 30, y); g.closePath(); g.fill(); }
});
const skyTex = (day: boolean) => canvasTex(512, 560, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 560);
  if (day) { gr.addColorStop(0, "#7fb2ea"); gr.addColorStop(1, "#d5e6f5"); } else { gr.addColorStop(0, "#0d1435"); gr.addColorStop(1, "#2b2d5e"); }
  g.fillStyle = gr; g.fillRect(0, 0, 512, 560);
  if (!day) {
    g.fillStyle = "#f4ecc8"; g.beginPath(); g.arc(370, 120, 46, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#0d1435"; g.beginPath(); g.arc(392, 106, 42, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,240,${0.4 + rnd(i) * 0.6})`; g.fillRect(rnd(i + 3) * 512, rnd(i + 7) * 260, 3, 3); }
  } else {
    g.fillStyle = "#ffffff";
    for (const [x, y, r] of [[120, 120, 40], [170, 110, 55], [220, 125, 38], [380, 200, 30], [420, 190, 42]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  }
  // city skyline
  let x = 0, i = 0;
  while (x < 512) {
    const w = 50 + rnd(i) * 70, h = 140 + rnd(i + 1) * 200;
    g.fillStyle = day ? "#8c97b5" : "#121329"; g.fillRect(x, 560 - h, w, h);
    g.strokeStyle = day ? "#3d4258" : "#05060f"; g.lineWidth = 4; g.strokeRect(x, 560 - h, w, h);
    for (let wy = 560 - h + 16; wy < 540; wy += 28) for (let wx = x + 10; wx < x + w - 12; wx += 18)
      if (rnd(wx * 3 + wy) > (day ? 0.2 : 0.62)) { g.fillStyle = day ? "#c9d6ec" : "#ffd27a"; g.fillRect(wx, wy, 9, 13); }
    x += w + 4; i += 2;
  }
});
const clockTex = () => canvasTex(256, 112, (g) => {
  g.fillStyle = "#101014"; g.fillRect(0, 0, 256, 112);
  g.fillStyle = "#ff3b2f"; g.font = "bold 78px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("2:17", 118, 60);
  g.font = "bold 22px monospace"; g.fillText("AM", 222, 84);
});
const phoneTex = (on: boolean) => canvasTex(120, 240, (g) => {
  g.fillStyle = on ? "#1d2a4a" : "#08080c"; g.fillRect(0, 0, 120, 240);
  if (!on) return;
  const gr = g.createLinearGradient(0, 0, 0, 240); gr.addColorStop(0, "#3a5fa8"); gr.addColorStop(1, "#162447");
  g.fillStyle = gr; g.fillRect(0, 0, 120, 240);
  g.fillStyle = "#ffffff"; g.font = "bold 30px sans-serif"; g.textAlign = "center"; g.fillText("2:17", 60, 60);
  g.fillStyle = "#3fd16b"; g.beginPath(); g.arc(34, 200, 16, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#ef4b4b"; g.beginPath(); g.arc(86, 200, 16, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#d8e2f5"; g.beginPath(); g.arc(60, 118, 24, 0, Math.PI * 2); g.fill();
});
const paintingTex = (k: number) => canvasTex(200, 150, (g) => {
  g.fillStyle = k ? "#e7c9a0" : "#a8c8e8"; g.fillRect(0, 0, 200, 150);
  g.fillStyle = k ? "#c76b4a" : "#5b8c5a";
  g.beginPath(); g.moveTo(0, 150); g.lineTo(60, 70); g.lineTo(110, 120); g.lineTo(150, 60); g.lineTo(200, 150); g.closePath(); g.fill();
  g.fillStyle = "#fff4c2"; g.beginPath(); g.arc(150, 35, 16, 0, Math.PI * 2); g.fill();
});

// ---------------- materials ----------------
const ramp = (() => {
  const d = new Uint8Array([90, 175, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return t;
})();
const toon = (color: THREE.ColorRepresentation, map?: THREE.Texture) => new THREE.MeshToonMaterial({ color, map: map ?? null, gradientMap: ramp });
const glowMat = (color: THREE.ColorRepresentation, map?: THREE.Texture) => new THREE.MeshBasicMaterial({ color, map: map ?? null, toneMapped: false });

// ---------------- builder ----------------
export class World {
  root = new THREE.Group();
  frontDoor = new THREE.Group();
  bedDoor = new THREE.Group();
  phoneTable: THREE.Mesh;
  phoneFloor: THREE.Mesh;
  phoneOn: THREE.Material[]; phoneOff: THREE.Material[];
  hemi = new THREE.HemisphereLight(0x3a4a8a, 0x120e1e, 1);
  moon = new THREE.DirectionalLight(0x8fa8ff, 1);
  lamp = new THREE.PointLight(0xffb36b, 5, 7, 1.6);
  tube = new THREE.PointLight(0xd8f5e2, 6, 9, 1.4);
  bedGlow = new THREE.PointLight(0x5d74d6, 2, 5, 1.5);
  phoneGlow = new THREE.PointLight(0xbfe0ff, 0, 2.2, 1.5);
  tubeMat = glowMat(0xeafff2);
  lampShade = toon(0xf2d39a);
  lampShadeOn = glowMat(0xffd59a);
  lampShadeMesh: THREE.Mesh;
  windowMat: THREE.MeshBasicMaterial;
  skyNight = skyTex(false); skyDay = skyTex(true);
  strip: THREE.Mesh;
  bedDark: THREE.Mesh;

  constructor() {
    const R = this.root;
    const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material | THREE.Material[], parent: THREE.Object3D = R) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.set(x, y, z); parent.add(mesh); return mesh;
    };
    const plane = (w: number, h: number, m: THREE.Material, parent: THREE.Object3D = R) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); parent.add(p); return p; };
    const H = 2.7, T = 0.12;
    const wallM = toon(0xffffff, wallpaper("#5f7f98", "#567390"));
    const wallB = toon(0xffffff, wallpaper("#6b5f8f", "#605484"));
    const hallM = toon(0xa7b9a0), hallLow = toon(0x6f8a72);
    const trim = toon(0xe9e1cf), dark = toon(0x2a2430);

    // ---- living room ----
    const floor = plane(6, 8, toon(0xffffff, planks())); floor.rotation.x = -Math.PI / 2;
    const ceil = plane(6, 8, toon(0xd9d4c8)); ceil.rotation.x = Math.PI / 2; ceil.position.y = H;
    // z = -4 wall with the front door hole (x 0.925..1.875, y < 2.1)
    box(3.925, H, T, -1.0375, H / 2, -4 - T / 2, wallM);
    box(1.125, H, T, 2.4375, H / 2, -4 - T / 2, wallM);
    box(0.95, H - 2.1, T, 1.4, 2.1 + (H - 2.1) / 2, -4 - T / 2, wallM);
    // z = +4 wall with the bedroom door hole (x -1.675..-0.725)
    box(1.325, H, T, -2.3375, H / 2, 4 + T / 2, wallM);
    box(3.725, H, T, 1.1375, H / 2, 4 + T / 2, wallM);
    box(0.95, H - 2.1, T, -1.2, 2.1 + (H - 2.1) / 2, 4 + T / 2, wallM);
    // x = -3 wall, x = +3 wall with a window hole (z 0.4..1.6, y 0.9..2.2)
    box(T, H, 8, -3 - T / 2, H / 2, 0, wallM);
    box(T, H, 4.4, 3 + T / 2, H / 2, -1.8, wallM);
    box(T, H, 2.4, 3 + T / 2, H / 2, 2.8, wallM);
    box(T, 0.9, 1.2, 3 + T / 2, 0.45, 1.0, wallM);
    box(T, 0.5, 1.2, 3 + T / 2, 2.45, 1.0, wallM);
    // skirting
    for (const [w, d, x, z] of [[6, 0.03, 0, -3.985], [6, 0.03, 0, 3.985], [0.03, 8, -2.985, 0], [0.03, 8, 2.985, 0]] as const) box(w, 0.1, d, x, 0.05, z, trim);
    // door frames
    for (const [x, z] of [[1.4, -4], [-1.2, 4]] as const) {
      box(0.06, 2.16, 0.18, x - 0.505, 1.08, z, trim); box(0.06, 2.16, 0.18, x + 0.505, 1.08, z, trim); box(1.07, 0.06, 0.18, x, 2.13, z, trim);
    }
    // front door (hinge at x 0.925; opens inward = negative rotation)
    this.frontDoor.position.set(0.925, 0, -4 + 0.03);
    R.add(this.frontDoor);
    const fdInside = toon(0xffffff, doorTex("#7d4b2e")), fdOutside = toon(0xffffff, doorTex("#7d4b2e", "12"));
    box(0.95, 2.09, 0.05, 0.475, 1.045, -0.03, [toon(0x6a3f27), toon(0x6a3f27), toon(0x6a3f27), toon(0x6a3f27), fdInside, fdOutside], this.frontDoor);
    box(0.05, 0.05, 0.06, 0.86, 1.0, 0.02, toon(0xd9b54a), this.frontDoor); // knob
    box(0.05, 0.05, 0.06, 0.86, 1.0, -0.08, toon(0xd9b54a), this.frontDoor);
    const peep = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 16), toon(0xc9a74a));
    peep.rotation.x = Math.PI / 2; peep.position.set(0.475, 1.58, 0.0); this.frontDoor.add(peep);
    // hallway light leaking under the door
    this.strip = plane(0.95, 0.28, new THREE.MeshBasicMaterial({ map: canvasTex(8, 64, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, "rgba(220,255,230,0.85)"); gr.addColorStop(1, "rgba(220,255,230,0)");
      g.fillStyle = gr; g.fillRect(0, 0, 8, 64);
    }), transparent: true, depthWrite: false, toneMapped: false }));
    this.strip.rotation.x = -Math.PI / 2; this.strip.position.set(1.4, 0.004, -3.86); this.strip.layers.set(NOINK);
    // bedroom door (hinge at x -1.675; opens into the bedroom = negative rotation)
    this.bedDoor.position.set(-1.675, 0, 4 - 0.03);
    R.add(this.bedDoor);
    const bdTex = toon(0xffffff, doorTex("#e8dcc6"));
    box(0.95, 2.09, 0.05, 0.475, 1.045, 0.03, [toon(0xcfc3ad), toon(0xcfc3ad), toon(0xcfc3ad), toon(0xcfc3ad), bdTex, bdTex], this.bedDoor);
    box(0.05, 0.05, 0.06, 0.86, 1.0, -0.02, toon(0xb9b9c4), this.bedDoor);
    // ---- bedroom (dark room beyond the door) ----
    const bf = plane(3.6, 3, toon(0xffffff, planks())); bf.rotation.x = -Math.PI / 2; bf.position.set(-1.2, 0, 5.5);
    box(3.6, H, T, -1.2, H / 2, 7 + T / 2, wallB);
    box(T, H, 3, -3 - T / 2, H / 2, 5.5, wallB);
    box(T, H, 3, 0.6 + T / 2, H / 2, 5.5, wallB);
    const bc = plane(3.6, 3, toon(0xc9c4b8)); bc.rotation.x = Math.PI / 2; bc.position.set(-1.2, H, 5.5);
    box(1.5, 0.45, 2.0, -2.2, 0.225, 5.9, toon(0x3d4f8a)); box(1.5, 0.2, 0.4, -2.2, 0.55, 6.75, toon(0xe6e6ee));
    box(0.08, 1.0, 1.5, -2.95, 0.5, 5.9, toon(0x5a3a26));
    this.bedDark = plane(1.0, 2.2, new THREE.MeshBasicMaterial({ color: 0x05060c, transparent: true, opacity: 0.0, depthWrite: false }));
    this.bedDark.position.set(-1.2, 1.1, 4.25); this.bedDark.layers.set(NOINK);
    this.bedGlow.position.set(-0.4, 1.8, 6.0); R.add(this.bedGlow);
    // ---- hallway ----
    const hf = plane(11, 2.2, toon(0xffffff, tiles())); hf.rotation.x = -Math.PI / 2; hf.position.set(0.5, 0, -5.2);
    const hc = plane(11, 2.2, toon(0xcfd6c8)); hc.rotation.x = Math.PI / 2; hc.position.set(0.5, 2.6, -5.2);
    box(11, 1.0, T, 0.5, 0.5, -6.3 - T / 2, hallLow); box(11, 1.6, T, 0.5, 1.8, -6.3 - T / 2, hallM);
    box(T, 2.6, 2.4, -5 - T / 2, 1.3, -5.2, hallM); box(T, 2.6, 2.4, 6 + T / 2, 1.3, -5.2, hallM);
    box(11, 0.06, 0.03, 0.5, 1.0, -6.28, trim);
    for (const [x, n] of [[-2.6, "11"], [4.4, "14"]] as const) {
      const d = box(0.95, 2.09, 0.05, x, 1.045, -6.27, [toon(0x6a3f27), toon(0x6a3f27), toon(0x6a3f27), toon(0x6a3f27), toon(0xffffff, doorTex("#6b4a3a", n)), toon(0x6a3f27)]);
      d.userData.door = true;
      box(0.06, 2.16, 0.12, x - 0.505, 1.08, -6.25, trim); box(0.06, 2.16, 0.12, x + 0.505, 1.08, -6.25, trim); box(1.07, 0.06, 0.12, x, 2.13, -6.25, trim);
    }
    // outside face of the z = -4 wall
    box(5.92, 2.6, 0.02, -2.04, 1.3, -4.13, hallM); box(4.12, 2.6, 0.02, 3.935, 1.3, -4.13, hallM); box(0.95, 0.5, 0.02, 1.4, 2.35, -4.13, hallM);
    this.tube.position.set(1.4, 2.45, -5.1); R.add(this.tube);
    const tubeMesh = box(1.2, 0.05, 0.14, 1.4, 2.57, -5.1, this.tubeMat); tubeMesh.layers.set(NOINK);
    box(1.3, 0.04, 0.2, 1.4, 2.595, -5.1, toon(0xd0d0d0));
    // security camera on the far wall corner
    const cam = new THREE.Group(); cam.position.set(5.75, 2.35, -6.1); cam.rotation.y = 0.9; R.add(cam);
    box(0.12, 0.12, 0.3, 0, 0, 0.1, toon(0xe8e8ea), cam); box(0.06, 0.06, 0.04, 0, 0, 0.27, dark, cam);
    box(0.04, 0.2, 0.04, 0, 0.12, -0.05, toon(0xb0b0b8), cam);

    // ---- furniture ----
    const couch = toon(0xffffff, fabric("#a8443f")), couchD = toon(0xffffff, fabric("#8d3634"));
    box(0.9, 0.42, 2.2, -2.5, 0.21, 0, couch);
    box(0.22, 0.6, 2.2, -2.86, 0.72, 0, couchD);
    for (const z of [-1.18, 1.18]) box(0.9, 0.62, 0.18, -2.5, 0.31, z, couchD);
    for (const z of [-0.52, 0.52]) box(0.66, 0.12, 1.02, -2.42, 0.48, z, couch);
    box(0.5, 0.16, 0.42, -2.6, 0.58, 0.85, toon(0xe7d9b8)); // pillow
    // side table + lamp + clock + phone
    box(0.5, 0.04, 0.5, -2.55, 0.55, -1.65, toon(0x6e4a2e));
    for (const [dx, dz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) box(0.04, 0.53, 0.04, -2.55 + dx, 0.265, -1.65 + dz, toon(0x5a3a22));
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 0.34, 12), toon(0x3d3b47)); base.position.set(-2.66, 0.74, -1.82); R.add(base);
    this.lampShadeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.19, 0.24, 16, 1, true), this.lampShade);
    this.lampShadeMesh.position.set(-2.66, 1.0, -1.82); R.add(this.lampShadeMesh);
    this.lamp.position.set(-2.62, 0.95, -1.7); R.add(this.lamp);
    const clockFace = glowMat(0xffffff, clockTex());
    const clk = box(0.07, 0.09, 0.2, -2.44, 0.615, -1.5, [clockFace, toon(0x15151a), toon(0x15151a), toon(0x15151a), toon(0x15151a), toon(0x15151a)]);
    clk.rotation.y = -0.35;
    this.phoneOn = [toon(0x222228), toon(0x222228), glowMat(0xffffff, phoneTex(true)), toon(0x222228), toon(0x222228), toon(0x222228)];
    this.phoneOff = [toon(0x222228), toon(0x222228), glowMat(0xffffff, phoneTex(false)), toon(0x222228), toon(0x222228), toon(0x222228)];
    this.phoneTable = box(0.075, 0.01, 0.15, -2.4, 0.576, -1.78, this.phoneOn);
    this.phoneTable.rotation.y = 0.4;
    this.phoneFloor = box(0.09, 0.012, 0.18, 1.3, 0.006, -3.35, this.phoneOn);
    this.phoneFloor.rotation.y = 0.9; this.phoneFloor.visible = false;
    this.phoneGlow.position.set(-2.4, 0.75, -1.78); R.add(this.phoneGlow);
    // coffee table + rug
    const rug = plane(2.4, 1.6, toon(0xffffff, rugTex())); rug.rotation.x = -Math.PI / 2; rug.rotation.z = Math.PI / 2; rug.position.set(-1.1, 0.003, 0);
    box(0.6, 0.05, 1.0, -1.25, 0.4, 0, toon(0x7a5232));
    for (const [dx, dz] of [[-0.25, -0.45], [0.25, -0.45], [-0.25, 0.45], [0.25, 0.45]]) box(0.04, 0.38, 0.04, -1.25 + dx, 0.19, dz, toon(0x5a3a22));
    box(0.18, 0.08, 0.12, -1.3, 0.465, 0.2, toon(0xd8e0ea)); // mug-ish box
    box(0.3, 0.03, 0.22, -1.2, 0.44, -0.2, toon(0x4a6fa5)); // magazine
    // bookshelf
    box(0.32, 1.9, 1.4, 2.82, 0.95, -2.5, toon(0x6e4a2e));
    for (let s = 0; s < 4; s++) {
      box(0.3, 0.03, 1.32, 2.8, 0.3 + s * 0.45, -2.5, toon(0x5a3a22));
      let z = -3.12, i = s * 7;
      while (z < -1.92) {
        const w = 0.06 + rnd(i) * 0.06, h = 0.24 + rnd(i + 1) * 0.12;
        const col = ["#c0453f", "#3f6fb0", "#e3b04b", "#4f9a6a", "#8a5ab0", "#e9e1cf"][i % 6];
        box(0.22, h, w, 2.78, 0.315 + s * 0.45 + h / 2, z + w / 2, toon(col));
        z += w + 0.01; i++;
      }
    }
    // plant
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 12), toon(0xc76b4a)); pot.position.set(2.5, 0.2, 3.45); R.add(pot);
    for (const [x, y, z, r] of [[2.5, 0.75, 3.45, 0.3], [2.35, 1.0, 3.5, 0.22], [2.65, 0.95, 3.35, 0.22]] as const) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), toon(0x4f9a5a)); b.position.set(x, y, z); R.add(b);
    }
    // paintings
    for (const [x, y, z, ry, k] of [[-2.96, 1.65, 0, Math.PI / 2, 0], [1.4, 1.6, 3.93, Math.PI, 1]] as const) {
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; R.add(g);
      box(0.9, 0.7, 0.04, 0, 0, 0, toon(0x3d2a1c), g);
      const art = plane(0.78, 0.58, toon(0xffffff, paintingTex(k)), g); art.position.z = 0.025;
    }
    // ceiling lamp
    const cl = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xe9e1cf));
    cl.rotation.x = Math.PI; cl.position.set(0, H, 0); R.add(cl);
    // window: sky picture behind the hole, frame, curtains
    this.windowMat = new THREE.MeshBasicMaterial({ map: this.skyNight, toneMapped: false });
    const sky = plane(1.6, 1.75, this.windowMat); sky.position.set(3.25, 1.55, 1.0); sky.rotation.y = -Math.PI / 2; sky.layers.set(NOINK);
    box(0.06, 0.05, 1.2, 3.0, 1.55, 1.0, trim); box(0.06, 1.3, 0.05, 3.0, 1.55, 1.0, trim);
    box(0.14, 0.05, 1.4, 2.96, 0.89, 1.0, trim);
    for (const z of [0.18, 1.82]) box(0.08, 2.0, 0.42, 2.9, 1.35, z, toon(0xffffff, fabric("#3f5f8a")));

    // ---- lights ----
    this.moon.position.set(8, 4.5, 1.2); this.moon.target.position.set(0, 0, 0);
    R.add(this.hemi, this.moon, this.moon.target);
  }

  /** world state for a frame */
  set(o: { light: LightName; lampOn?: boolean; phoneOn?: number; phoneAt?: "table" | "floor" | "none"; phoneFloorY?: number; phoneFloorRot?: number;
    frontDoor?: number; bedDoor?: number; tube?: number; bedDark?: number; phoneLight?: THREE.Vector3 }) {
    const L = o.light, day = L === "day";
    this.windowMat.map = day ? this.skyDay : this.skyNight;
    const lamp = o.lampOn ?? (L === "night");
    this.lamp.intensity = day ? 0 : lamp ? 4.2 : 0;
    this.lampShadeMesh.material = lamp && !day ? this.lampShadeOn : this.lampShade;
    if (day) {
      this.hemi.color.set(0xdfe9ff); this.hemi.groundColor.set(0x8a7560); this.hemi.intensity = 2.3;
      this.moon.color.set(0xfff0d0); this.moon.intensity = 2.6;
    } else if (L === "hall") {
      this.hemi.color.set(0x5a6a72); this.hemi.groundColor.set(0x1a1d1a); this.hemi.intensity = 0.9;
      this.moon.color.set(0x8fa8ff); this.moon.intensity = 0.5;
    } else {
      this.hemi.color.set(0x3d4f95); this.hemi.groundColor.set(0x151024); this.hemi.intensity = 1.25;
      this.moon.color.set(0x8fa8ff); this.moon.intensity = 1.1;
    }
    const tube = o.tube ?? 1;
    this.tube.intensity = day ? 3 : 7 * tube;
    this.tubeMat.color.setScalar(0.25 + 0.75 * tube);
    (this.strip.material as THREE.MeshBasicMaterial).opacity = day ? 0 : 0.35 + 0.65 * tube;
    this.strip.visible = !day && (o.frontDoor ?? 0) === 0;
    const pOn = o.phoneOn ?? 0, at = o.phoneAt ?? "table";
    this.phoneTable.visible = at === "table";
    this.phoneFloor.visible = at === "floor";
    for (const m of [this.phoneTable, this.phoneFloor]) m.material = pOn > 0.5 ? this.phoneOn : this.phoneOff;
    if (at === "floor") { this.phoneFloor.position.y = 0.006 + (o.phoneFloorY ?? 0); this.phoneFloor.rotation.set(o.phoneFloorRot ?? 0, 0.9, 0); }
    this.phoneGlow.intensity = pOn * 2.2;
    if (o.phoneLight) this.phoneGlow.position.copy(o.phoneLight);
    else if (at === "floor") this.phoneGlow.position.set(1.3, 0.2, -3.35);
    else this.phoneGlow.position.set(-2.4, 0.75, -1.78);
    this.frontDoor.rotation.y = -(o.frontDoor ?? 0);
    this.bedDoor.rotation.y = -(o.bedDoor ?? 0);
    this.bedGlow.intensity = day ? 0 : 1.6;
    (this.bedDark.material as THREE.MeshBasicMaterial).opacity = o.bedDark ?? 0;
  }
}
