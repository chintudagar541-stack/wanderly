// "The Clock Man" demo world, built to the reference look (writer/REFERENCE_SPEC.md):
//  OFFICE (x=0): the reference office: pale-green block walls, blue carpet, white ceiling tiles, light-grey desks,
//          hard yellow sun patches through the window, a big wall clock whose hands can spin.
//  TOWN (x=300): a snowy night street: blue sky gradient + stars + moon, houses with lit windows and snowy roofs,
//          picket fences, snowy pines, lamp posts, falling snow, and the town clock tower at the end of the street.
import * as THREE from "three";
import { NOINK } from "../bridge/ink";
import { canvasTex } from "../eiffel/lib";
import { Batch, Kit, M, rep, Pal, desk, chair, bookshelf, cabinet, plant, clockFace, picture, windowFrame, door, deskClutter, house, pine, lampPost, fence, V3, rnd, CONE, BOX, CYL } from "../../lib3d/kit";
import * as TX from "../../lib3d/textures";
import type { WorldLike } from "../../lib3d/Short3D";

export type LightName = "office" | "night";
export const OX = 0, TWX = 300;
/** the tower clock face position (town) and the wall clock (office), for cameras */
export const TOWER: V3 = [TWX, 9.2, -46];
export const WALLCLOCK: V3 = [OX + 0.2, 2.42, -2.97];

const skyTex = (stops: [number, string][], stars = 0) => canvasTex(256, 1024, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 1024); for (const [o, c] of stops) gr.addColorStop(o, c); g.fillStyle = gr; g.fillRect(0, 0, 256, 1024);
  for (let i = 0; i < stars; i++) { const y = rnd(i * 3 + 1) * 470, a = 0.4 + rnd(i * 3 + 2) * 0.6; g.fillStyle = `rgba(255,255,255,${a * (1 - y / 520)})`; g.fillRect(rnd(i * 3) * 256, y, 1.4, 1.4); }
});
const ceilingTiles = () => canvasTex(256, 256, (g) => {
  g.fillStyle = "#f3f4f6"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(150,155,170,${0.15 + rnd(i) * 0.2})`; g.fillRect(rnd(i + 7) * 256, rnd(i + 9) * 256, 1.5, 1.5); }
  g.fillStyle = "#c9ccd6"; g.fillRect(0, 0, 256, 6); g.fillRect(0, 0, 6, 256);
});
const blockWall = (base: string, grout: string) => canvasTex(512, 512, (g) => {
  g.fillStyle = grout; g.fillRect(0, 0, 512, 512);
  const bh = 64, bw = 128;
  for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) { const x = c * bw + (r % 2 ? bw / 2 : 0), y = r * bh, j = rnd(r * 13 + c * 7 + 40);
    g.fillStyle = base; g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
    g.fillStyle = `rgba(255,255,255,${0.05 + j * 0.06})`; g.fillRect(x + 3, y + 3, bw - 6, 6);
    g.fillStyle = `rgba(0,40,20,${0.04 + j * 0.05})`; g.fillRect(x + 3, y + bh - 9, bw - 6, 6); }
});
const calendar = () => canvasTex(128, 160, (g) => {
  g.fillStyle = "#fbfaf6"; g.fillRect(0, 0, 128, 160); g.fillStyle = "#d8322f"; g.fillRect(0, 0, 128, 44);
  g.fillStyle = "#fff"; g.font = "bold 28px Arial"; g.textAlign = "center"; g.fillText("MON", 64, 33);
  g.fillStyle = "#1a1a1a"; g.font = "bold 84px Arial"; g.fillText("7", 64, 132);
});
const corkboard = () => canvasTex(256, 192, (g) => {
  g.fillStyle = "#c08a52"; g.fillRect(0, 0, 256, 192);
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(90,50,20,${rnd(i) * 0.3})`; g.fillRect(rnd(i + 3) * 256, rnd(i + 5) * 192, 2, 2); }
  const notes = ["#fff3a0", "#ffffff", "#a8e0ff", "#ffb8c8", "#ffffff"];
  for (let i = 0; i < 7; i++) { g.save(); g.translate(20 + rnd(i + 20) * 190, 18 + rnd(i + 30) * 120); g.rotate((rnd(i + 40) - 0.5) * 0.3); g.fillStyle = notes[i % 5]; g.fillRect(0, 0, 46, 54);
    g.fillStyle = "rgba(40,40,60,0.5)"; for (let l = 0; l < 4; l++) g.fillRect(6, 14 + l * 9, 30 - (l % 2) * 8, 2); g.fillStyle = "#d8322f"; g.beginPath(); g.arc(23, 5, 4, 0, 7); g.fill(); g.restore(); }
});
const sign = (txt: string[], bg: string, fg: string) => canvasTex(256, 128, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, 256, 128); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(8, 8, 240, 112);
  g.fillStyle = fg; g.textAlign = "center"; g.font = "bold 34px Georgia"; txt.forEach((s, i) => g.fillText(s, 128, 56 + i * 38 - (txt.length - 1) * 12));
});
const winLit = (seed: number) => canvasTex(128, 192, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, "#fff0b8"); gr.addColorStop(1, "#ffa850"); g.fillStyle = gr; g.fillRect(0, 0, 128, 192);
  g.fillStyle = seed % 2 ? "rgba(190,60,50,0.55)" : "rgba(60,90,160,0.45)"; g.fillRect(0, 0, 30, 192); g.fillRect(98, 0, 30, 192);
  if (seed % 3 === 0) { g.fillStyle = "rgba(90,40,20,0.5)"; g.beginPath(); g.ellipse(64, 150, 26, 40, 0, 0, 7); g.fill(); }
});
const moonTex = () => canvasTex(256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 30, 128, 128, 128); gr.addColorStop(0, "rgba(255,250,230,1)"); gr.addColorStop(0.32, "rgba(255,250,230,1)"); gr.addColorStop(0.36, "rgba(200,210,255,0.35)"); gr.addColorStop(1, "rgba(120,140,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); g.fillStyle = "rgba(200,200,190,0.5)"; for (const [x, y, r] of [[110, 110, 9], [145, 135, 6], [120, 150, 5]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
});
const beamTex = () => canvasTex(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,236,150,0.42)"); gr.addColorStop(1, "rgba(255,236,150,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const h = g.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, "rgba(0,0,0,1)"); h.addColorStop(0.2, "rgba(0,0,0,0)"); h.addColorStop(0.8, "rgba(0,0,0,0)"); h.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = h; g.fillRect(0, 0, 64, 256); });

/** the wall clock, in minutes after 9:00: it ticks, then spins 12 hours while Walter winds it (7.4-9.2 s) */
export const clockMinAt = (t: number) => (t < 7.4 ? 2 + t * 0.5 : t < 9.2 ? 6 + ((t - 7.4) / 1.8) ** 1.6 * 720 : 726 + (t - 9.2) * 0.5);

export class World implements WorldLike<LightName> {
  root = new THREE.Group();
  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  sun = new THREE.DirectionalLight(0xffffff, 3);
  sky: THREE.Mesh; skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false });
  skies: Record<LightName, THREE.Texture>;
  fog = new THREE.Fog(0xffffff, 60, 400);
  lamps: THREE.PointLight[] = [];
  office: THREE.Object3D[] = []; town: THREE.Object3D[] = [];
  hole: THREE.Mesh; clockMesh: THREE.Mesh; snow: THREE.Points; moon: THREE.Sprite; bokeh: THREE.Sprite[] = [];

  constructor() {
    const R = this.root, B = new Batch(), k = new Kit(B, R);
    this.skies = {
      office: skyTex([[0, "#3a7ae8"], [0.45, "#8cc4f4"], [0.5, "#d8ecf8"], [1, "#d8ecf8"]]),
      night: skyTex([[0, "#0c2b90"], [0.3, "#1340bc"], [0.47, "#5a7ae8"], [0.5, "#96b3ff"], [0.53, "#4a6ad8"], [1, "#2a40a0"]], 260),
    };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), this.skyMat); this.sky.layers.set(NOINK); R.add(this.sky);
    const P: Pal = { wood: M(0xe6e7ec), woodD: M(0xc9cbd4), metal: M(0x8a9098, undefined, { rough: 0.4, metal: 0.5 }), white: M(0xfbfaf6), dark: M(0x2a2a34) };

    // ================= OFFICE (6 x 6 x 3, window in the left wall) =================
    const before = R.children.length;
    k.at([OX, 0, 0], 0, () => {
      const W = 6, D = 6, H = 3;
      const wallT = blockWall("#a8e0b0", "#d6f0d8");
      const wm = (w: number, h: number) => M(0xffffff, rep(wallT, w, h, 2.6, 1.3));
      k.floor(M(0xffffff, rep(TX.carpetTile({ field: "#1a58e4", motif: "#2462ea", accent: "#164cd0" }), W, D, 1.5, 1.5)), [0, 0, 0], W, D);
      k.panel(wm(W, H), [0, H / 2, -D / 2], W, H);
      k.panel(wm(D, H), [W / 2, H / 2, 0], D, H, -Math.PI / 2);
      k.panel(wm(W, H), [0, H / 2, D / 2], W, H, Math.PI);
      // left wall with a window hole (four panels around it)
      const wz = -0.6, ww = 1.8, wy0 = 0.85, wy1 = 2.4;
      const a0 = D / 2 + wz - ww / 2, a1 = D / 2 - wz - ww / 2;
      k.mesh(new THREE.PlaneGeometry(a0, H), wm(a0, H), [-W / 2, H / 2, -D / 2 + a0 / 2], [0, Math.PI / 2, 0]);
      k.mesh(new THREE.PlaneGeometry(a1, H), wm(a1, H), [-W / 2, H / 2, D / 2 - a1 / 2], [0, Math.PI / 2, 0]);
      k.mesh(new THREE.PlaneGeometry(ww, wy0), wm(ww, wy0), [-W / 2, wy0 / 2, wz], [0, Math.PI / 2, 0]);
      k.mesh(new THREE.PlaneGeometry(ww, H - wy1), wm(ww, H - wy1), [-W / 2, (H + wy1) / 2, wz], [0, Math.PI / 2, 0]);
      const outer = M(0x8ac87c); for (const z of [wz - ww / 2 - 0.15, wz + ww / 2 + 0.15]) k.box(outer, [-W / 2 - 0.16, H / 2, z], [0.3, H, 0.3]);
      k.box(outer, [-W / 2 - 0.16, wy0 / 2, wz], [0.3, wy0, ww]); k.box(outer, [-W / 2 - 0.16, (H + wy1) / 2, wz], [0.3, H - wy1, ww]);
      k.at([-W / 2, (wy0 + wy1) / 2, wz], Math.PI / 2, () => windowFrame(k, ww, wy1 - wy0, M(0xfbfaf6), { cols: 2, rows: 2 }));
      // venetian blind slats half down
      for (let i = 0; i < 9; i++) k.box(M(0xf0f0f4), [-W / 2 + 0.1, wy1 - 0.05 - i * 0.06, wz], [0.07, 0.012, ww], [0, 0, 0.5]);
      k.mesh(new THREE.PlaneGeometry(W, D), M(0xffffff, rep(ceilingTiles(), W, D, 0.6, 0.6), { emissive: 0xc8ccd8, ei: 0.55 }), [0, H, 0], [Math.PI / 2, 0, 0]);
      for (const x of [-1.2, 1.2]) k.box(M(0xffffff, undefined, { emissive: 0xffffff, ei: 1.4 }), [x, H - 0.02, -0.6], [0.5, 0.03, 1.2]);
      k.box(M(0xfbfaf6), [0, 0.05, -D / 2 + 0.02], [W, 0.1, 0.05]); k.box(M(0xfbfaf6), [W / 2 - 0.02, 0.05, 0], [0.05, 0.1, D]);
      // Walter's desk (back wall), the boss's door (front right), cabinets, shelves, plants, boxes
      k.at([0.2, 0, -2.3], 0, () => { desk(k, P, 1.7, 0.8); k.at([0, 0.76, 0], 0, () => deskClutter(k, P, 3)); });
      k.at([0.2, 0, -2.62], 0, () => { // tall office chair behind Walter (the reference's dark swivel chair)
        const cm = M(0x2c3550); k.box(cm, [0, 0.62, 0.05], [0.5, 0.08, 0.46]); k.box(cm, [0, 1.12, -0.2], [0.5, 0.78, 0.08]); k.cyl(M(0x3a3a44), [0, 0.32, 0.05], 0.04, 0.55);
        for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; k.box(M(0x3a3a44), [Math.sin(a) * 0.17, 0.05, 0.05 + Math.cos(a) * 0.17], [0.05, 0.04, 0.36], [0, a, 0]); } });
      k.at([-0.42, 0, -2.62], 0, () => { const st = M(0xd0a060); k.box(st, [0, 0.4, 0], [0.5, 0.06, 0.4]); k.box(st, [0, 0.8, 0], [0.5, 0.06, 0.35]); for (const sx of [-0.23, 0.23]) k.beam(M(0xa07040), [sx, 0, 0.2], [sx, 0.83, -0.05], 0.05); for (const sx of [-0.23, 0.23]) k.beam(M(0xa07040), [sx, 0, -0.25], [sx, 0.83, -0.1], 0.05); });   // step ladder
      k.at([2.2, 0, 0.6], -Math.PI / 2, () => { desk(k, P, 1.5, 0.75); k.at([0, 0.76, 0], 0, () => deskClutter(k, P, 7)); });
      k.at([W / 2 - 0.18, 0, -2.0], -Math.PI / 2, () => bookshelf(k, P, 1.2, 2.0, 0.32, 4));
      k.at([-2.4, 0, -D / 2 + 0.32], 0, () => cabinet(k, P, M(0x9aa6b4, undefined, { rough: 0.5, metal: 0.3 })));
      k.at([-1.85, 0, -D / 2 + 0.32], 0, () => cabinet(k, P, M(0x9aa6b4, undefined, { rough: 0.5, metal: 0.3 })));
      k.at([2.5, 0, -2.6], 0, () => plant(k, 1.5, 0x3f9a3a, 0xd8622c, 2));
      k.at([-2.5, 0, 2.4], 0, () => plant(k, 1.3, 0x4aa040, 0x2a6ab0, 5));
      k.at([-2.4, 1.32, -D / 2 + 0.32], 0, () => plant(k, 0.6, 0x4a9a40, 0xe8b84a, 6));
      for (const [x, z, s] of [[-2.5, 0.6, 0.5], [-2.45, 0.95, 0.42], [-2.52, 0.8, 0.36]] as const) k.box(M(0xc89a62), [x, s / 2 + (s < 0.4 ? 0.5 : 0), z], [s * 1.2, s, s]);
      k.at([-1.2, 1.55, -D / 2 + 0.01], 0, () => picture(k, corkboard(), 1.0, 0.75, 0x8a5a3a));
      k.at([1.4, 1.65, -D / 2 + 0.01], 0, () => picture(k, calendar(), 0.48, 0.6, 0xfbfaf6));
      k.at([1.6, 0, D / 2 - 0.05], Math.PI, () => door(k, 0.95, 2.1, M(0x9cc0e8), M(0xfbfaf6)));
      k.at([1.6, 1.55, D / 2 - 0.12], Math.PI, () => k.panel(M(0xffffff, sign(["CLOCK", "KEEPER"], "#fbfaf6", "#2a3a6a")), [0, 0, 0], 0.5, 0.25));
      k.at([W / 2 - 0.01, 1.6, 1.4], -Math.PI / 2, () => picture(k, sign(["ACME", "& SONS"], "#2a3a6a", "#f2c84a"), 0.9, 0.45, 0x2a2a34));
      // the big wall clock (its face is a separate mesh so the hands can spin)
      k.at([WALLCLOCK[0], WALLCLOCK[1], -D / 2], 0, () => { k.cyl(M(0x2a2a34), [0, 0, 0.03], 0.5, 0.06, [Math.PI / 2, 0, 0]); k.cyl(M(0xc0262a), [0, 0, 0.07], 0.47, 0.04, [Math.PI / 2, 0, 0]); });
      // hard yellow sun patches (the ref2 look): additive parallelograms on the back wall and the carpet
      const patch = (pts: number[][]) => { const g2 = new THREE.BufferGeometry(); g2.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3)); g2.setIndex([0, 1, 2, 0, 2, 3]);
        const m2 = new THREE.Mesh(g2, new THREE.MeshBasicMaterial({ color: 0xffd21e, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); m2.layers.set(NOINK); R.add(m2); };
      patch([[-2.95, 1.1, -D / 2 + 0.012], [-1.0, 0.55, -D / 2 + 0.012], [-0.55, 1.75, -D / 2 + 0.012], [-2.95, 2.45, -D / 2 + 0.012]]);
      patch([[-2.95, 0.012, -1.4], [-1.2, 0.012, -2.2], [-0.4, 0.012, -1.0], [-2.95, 0.012, 0.2]]);
      // sun beams (soft additive volumes from the window)
      const bt = beamTex();
      for (const [dz, w] of [[-0.35, 0.7], [0.35, 0.6]] as const) { const s = new THREE.Mesh(new THREE.PlaneGeometry(w, 4.2), new THREE.MeshBasicMaterial({ map: bt, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
        s.position.set(OX - 2.0, 1.15, wz + dz); s.rotation.set(0, Math.PI / 2, 0.95); s.layers.set(NOINK); R.add(s); }
    });
    // the hole Walter punches through the ceiling tiles (jagged dark opening, shown after "fired")
    this.hole = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(128, 128, (g) => {
      g.fillStyle = "#14121e"; g.beginPath(); for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = 46 + rnd(i + 900) * 14; const x = 64 + Math.cos(a) * r * 1.0, y = 64 + Math.sin(a) * r; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); g.fill();
      g.strokeStyle = "#e8e8ee"; g.lineWidth = 4; g.stroke(); }) }));
    this.hole.rotation.x = Math.PI / 2; this.hole.position.set(OX + 0.2, 2.985, -2.06); this.hole.layers.set(NOINK); this.hole.visible = false; R.add(this.hole);
    this.clockMesh = new THREE.Mesh(new THREE.CircleGeometry(0.44, 48), M(0xffffff, clockFace(9, 0)).clone() as THREE.MeshStandardMaterial);
    this.clockMesh.position.set(WALLCLOCK[0], WALLCLOCK[1], WALLCLOCK[2] + 0.07); R.add(this.clockMesh);
    const lamp = new THREE.PointLight(0xfff0d0, 0, 7, 1.4); lamp.position.set(OX, 2.6, -0.6); R.add(lamp); this.lamps.push(lamp);
    this.office = R.children.slice(before);

    // ================= TOWN (snowy night) =================
    const b2 = R.children.length;
    k.at([TWX, 0, 0], 0, () => {
      k.floor(M(0xffffff, rep(TX.snow({ tracks: true }), 9, 160, 9, 9)), [0, 0.01, -50], 9, 160);
      k.floor(M(0xffffff, rep(TX.snow({ seed: 31 }), 260, 260, 6, 6)), [0, 0, -50], 260, 260);
      const walls = ["#b8d4f0", "#f0c8a0", "#c8e0b8", "#f4f1ea", "#e8b8b0", "#d0c0e8"], doors = [0x8a3a2a, 0x2a4a6a, 0x3a6a3a];
      const snowRoof = M(0xffffff, rep(TX.roofShingles({ color: "#e8eef8", seed: 3 }), 4, 8)), trim = M(0xfbfaf6);
      for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const z = 8 - i * 11 + (s > 0 ? 5 : 0), seed = i * 2 + (s > 0 ? 1 : 0);
        k.at([s * 10.5, 0, z], s > 0 ? -Math.PI / 2 : Math.PI / 2, () => {
          house(k, { w: 6 + rnd(seed) * 1.5, d: 7, h: 3.4 + (seed % 3 === 0 ? 2.6 : 0), wall: M(0xffffff, rep(TX.clapboardSiding({ color: walls[seed % 6], seed }), 7, 6, 1, 1)),
            trim, roof: snowRoof, door: M(doors[seed % 3]), win: new THREE.MeshBasicMaterial({ map: winLit(seed), toneMapped: false }), seed });
          fence(k, trim, [-3.4, 0, 6.4], [-0.9, 0, 6.4]); fence(k, trim, [0.9, 0, 6.4], [3.4, 0, 6.4]);
          k.at([2.6, 0, 6.9], 0, () => pine(k, 2.6 + rnd(seed + 3) * 1.6, M(0x24584a), M(0x5a4030), M(0xf4f8ff)));
          for (let j = 0; j < 3; j++) k.add(CONE, M(0xf4f8ff), [-2.5 + j * 2.2, 0.15, 7.3], [0.6, 0.3, 0.4]);
        }); }
      for (let z = 6; z > -44; z -= 10) for (const s of [-1, 1]) k.at([s * 4.8, 0, z + (s > 0 ? 5 : 0)], 0, () => { const p = lampPost(k, M(0x23232c)); if (this.lamps.length < 7 && z > -26) { const l = new THREE.PointLight(0xffb860, 0, 11, 1.5); l.position.set(TWX + s * 4.8 + p[0], p[1], z + (s > 0 ? 5 : 0)); R.add(l); this.lamps.push(l); } });
      for (let i = 0; i < 46; i++) { const s = rnd(i + 50) < 0.5 ? -1 : 1; k.at([s * (19 + rnd(i) * 34), 0, 10 - rnd(i + 1) * 120], 0, () => pine(k, 5 + rnd(i + 2) * 6, M(0x1e4a44), M(0x4a3428), M(0xeef4ff))); }
      for (let i = 0; i < 9; i++) k.add(CONE, M(0x6a70b0), [-170 + i * 42, 30, -210 - rnd(i) * 40], [42 + rnd(i) * 20, 75 + rnd(i + 1) * 30, 30]);
      // the clock tower: stone shaft, a lit belfry, four clock faces, a steep roof
      k.at([0, 0, TOWER[2]], 0, () => {
        const stone = M(0xffffff, rep(TX.stoneBlocks({ color: "#e0d4bc", seed: 4 }), 3.2, 12, 1.6, 1.6));
        k.box(stone, [0, 5.5, 0], [3.2, 11, 3.2]); k.box(M(0xa89a88), [0, 0.4, 0], [3.8, 0.8, 3.8]); k.box(M(0xa89a88), [0, 11.1, 0], [3.7, 0.3, 3.7]);
        k.box(M(0xffc870, undefined, { emissive: 0xffa040, ei: 0.8 }), [0, 12.5, 0], [2.6, 2.6, 2.6]); for (const [x, z] of [[1.3, 1.3], [-1.3, 1.3], [1.3, -1.3], [-1.3, -1.3]]) k.box(M(0xc8bca8), [x, 12.5, z], [0.4, 2.6, 0.4]);
        k.box(M(0xa89a88), [0, 13.9, 0], [3.4, 0.25, 3.4]);
        for (let f = 0; f < 4; f++) k.at([0, 0, 0], (f * Math.PI) / 2, () => { k.cyl(M(0x2a2a34), [0, 9.2, 1.62], 1.25, 0.1, [Math.PI / 2, 0, 0]); k.mesh(new THREE.CircleGeometry(1.15, 48), M(0xffffff, clockFace(11, 47, "#2a2a34")), [0, 9.2, 1.68]);
          k.box(M(0x2a2a34), [0, 3.4, 1.62], [1.2, 2.4, 0.1]); k.box(M(0xffd890, undefined, { emissive: 0xffb050, ei: 1.5 }), [0, 6.2, 1.61], [0.6, 1.0, 0.05]); });
        const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.2, 4), M(0x3a3a6a)); roof.position.set(TWX, 16.1, TOWER[2]); roof.rotation.y = Math.PI / 4; roof.castShadow = true; R.add(roof);
        const bell = new THREE.PointLight(0xffc070, 4, 8, 1.5); bell.position.set(TWX, 12.5, TOWER[2]); R.add(bell);
      });
      k.box(trim, [0, 0.3, TOWER[2] + 4], [8, 0.6, 0.4]);
      // ---- density pass (the references never leave the ground or the background empty) ----
      const wood = M(0x7a4a2a), woodD = M(0x5a3420), snowM = M(0xf4f8ff), ink = M(0x23232c);
      // back rows of houses (visible between and above the front row), all with lit windows
      for (const s2 of [-1, 1]) for (let i = 0; i < 7; i++) { const z = 4 - i * 10 + (s2 > 0 ? 3 : -2), seed = 20 + i * 2 + (s2 > 0 ? 1 : 0);
        k.at([s2 * (21 + rnd(seed) * 3), 0, z], s2 > 0 ? -Math.PI / 2 : Math.PI / 2, () => house(k, { w: 6, d: 6, h: 3.6 + (seed % 2) * 2.4, wall: M(0xffffff, rep(TX.clapboardSiding({ color: walls[seed % 6], seed }), 7, 6, 1, 1)),
          trim, roof: snowRoof, door: M(doors[seed % 3]), win: new THREE.MeshBasicMaterial({ map: winLit(seed), toneMapped: false }), seed, porch: false })); }
      // string lights zig-zagging across the street between the lamp posts
      const bulb = M(0xffe0a0, undefined, { emissive: 0xffb050, ei: 3 });
      for (const z of [-4, -9, -29]) { const y0 = 4.2, sag = 0.7;   // rows kept clear of the camera paths
        for (let i = 0; i <= 14; i++) { const u2 = i / 14, x = -4.6 + 9.2 * u2, y = y0 - sag * 4 * u2 * (1 - u2), zz = z - 2.5 * u2; k.add(CONE, bulb, [x, y - 0.08, zz], [0.07, 0.12, 0.07]); }
        k.beam(ink, [-4.6, 4.2, z], [0, 3.5, z - 1.25], 0.015); k.beam(ink, [0, 3.5, z - 1.25], [4.6, 4.2, z - 2.5], 0.015); }
      // street clutter: barrels, crates, benches, snowmen, sleds, mailboxes, signs, a market stall, a cart
      const barrel = (x: number, z: number) => { k.cyl(wood, [x, 0.42, z], 0.3, 0.84, [0, 0, 0], CYL); for (const y of [0.15, 0.69]) k.cyl(ink, [x, y, z], 0.31, 0.05); k.cyl(snowM, [x, 0.86, z], 0.29, 0.05); };
      const crate = (x: number, z: number, r: number, sz = 0.6) => { k.box(M(0xb08050), [x, sz / 2, z], [sz, sz, sz], [0, r, 0]); k.box(snowM, [x, sz + 0.03, z], [sz * 0.95, 0.06, sz * 0.95], [0, r, 0]); };
      const snowman = (x: number, z: number) => { k.add(CONE, snowM, [x, 0.3, z], [0, 0, 0]); k.cyl(snowM, [x, 0.3, z], 0.38, 0.6, [0, 0, 0], CYL); k.cyl(snowM, [x, 0.85, z], 0.27, 0.45, [0, 0, 0], CYL); k.cyl(snowM, [x, 1.25, z], 0.19, 0.34, [0, 0, 0], CYL);
        k.cyl(ink, [x, 1.5, z], 0.13, 0.22); k.cyl(ink, [x, 1.4, z], 0.2, 0.03); k.add(CONE, M(0xf08020), [x, 1.28, z + 0.22], [0.04, 0.16, 0.04], [Math.PI / 2, 0, 0]); k.box(M(0xc02a2a), [x, 1.08, z], [0.42, 0.08, 0.42]); };
      const bench = (x: number, z: number, r: number) => k.at([x, 0, z], r, () => { k.box(wood, [0, 0.45, 0], [1.6, 0.06, 0.45]); k.box(wood, [0, 0.75, -0.2], [1.6, 0.3, 0.05]); for (const sx of [-0.7, 0.7]) k.box(ink, [sx, 0.22, 0], [0.06, 0.45, 0.4]); k.box(snowM, [0, 0.5, 0], [1.55, 0.05, 0.42]); });
      for (const [x, z] of [[-5.6, 1], [5.8, -3], [-5.4, -12], [5.6, -17], [-5.9, -24], [6.0, -31]]) { barrel(x, z); barrel(x + 0.5, z - 0.6); crate(x - 0.3, z + 0.9, 0.3); crate(x + 0.2, z + 1.4, -0.4, 0.45); }
      for (const [x, z, r] of [[-5.6, -6, Math.PI / 2], [5.7, -9, -Math.PI / 2], [-5.6, -20, Math.PI / 2], [5.7, -26, -Math.PI / 2]]) bench(x, z, r);
      for (const [x, z] of [[-3.6, -14], [3.8, -21], [-4.0, -35]]) snowman(x, z);
      // market stall with a striped awning and lantern glow
      k.at([5.8, 0, -36], -Math.PI / 2, () => { k.box(wood, [0, 0.5, 0], [2.4, 1.0, 0.9]); for (const sx of [-1.15, 1.15]) k.box(woodD, [sx, 1.3, 0.4], [0.08, 2.6, 0.08]);
        k.box(M(0xffffff, TX.awningStripes({ a: "#c8302c", b: "#f4efe4" })), [0, 2.55, 0.15], [2.6, 0.08, 1.4], [0.25, 0, 0]); k.box(snowM, [0, 2.62, 0.12], [2.5, 0.06, 1.3], [0.25, 0, 0]);
        for (let i = 0; i < 6; i++) k.add(CONE, M([0xe85a2a, 0xf2c84a, 0x6aa84a][i % 3]), [-0.9 + i * 0.36, 1.08, 0.1], [0.12, 0.16, 0.12]); k.box(bulb, [0, 2.2, 0.5], [0.16, 0.22, 0.16]); });
      // a horse-less delivery cart and a sled
      k.at([-6.2, 0, -29], 0.3, () => { k.box(wood, [0, 0.8, 0], [1.2, 0.5, 2.0]); for (const sz of [-0.7, 0.7]) for (const sx of [-0.65, 0.65]) k.cyl(woodD, [sx, 0.45, sz], 0.45, 0.08, [0, 0, Math.PI / 2]); k.box(snowM, [0, 1.07, 0], [1.1, 0.06, 1.9]); k.beam(woodD, [0, 0.7, 1.0], [0, 0.4, 2.4], 0.07); });
      k.at([3.2, 0, -10], -0.4, () => { k.box(M(0xb83a2a), [0, 0.22, 0], [0.5, 0.06, 1.1]); for (const sx of [-0.22, 0.22]) k.beam(ink, [sx, 0.04, -0.55], [sx, 0.04, 0.6], 0.04); });
      // wreaths on the front-row doors are implied by the lit porches; add hanging shop signs
      for (const [x, z, txt] of [[-4.2, -4, "BAKERY"], [4.4, -15, "POST"], [-4.2, -27, "TAILOR"]] as const) { k.beam(ink, [x, 3.0, z], [x + (x < 0 ? -0.9 : 0.9), 3.0, z], 0.04);
        k.panel(M(0xffffff, sign([txt], "#2a3a6a", "#f2c84a")), [x + (x < 0 ? -0.5 : 0.5), 2.6, z + 0.03], 0.9, 0.45); }
      // the far hills: dense distant window lights (instanced emissive dots)
      const far = M(0xffc070, undefined, { emissive: 0xffa040, ei: 4 });
      for (let i = 0; i < 260; i++) { const s3 = rnd(i + 400) < 0.5 ? -1 : 1, x = s3 * (30 + rnd(i + 401) * 90), z = -60 - rnd(i + 402) * 120; k.box(far, [x, 0.6 + rnd(i + 403) * 6 + Math.abs(x) * 0.08, z], [0.35, 0.45, 0.1]); }
      for (let i = 0; i < 70; i++) { const s4 = rnd(i + 600) < 0.5 ? -1 : 1; k.at([s4 * (8 + rnd(i + 601) * 30), 0, -55 - rnd(i + 602) * 60], 0, () => pine(k, 4 + rnd(i + 603) * 5, M(0x1e4a44), M(0x4a3428), snowM)); }
    });
    // falling snow
    const N = 2600, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = TWX + (rnd(i) - 0.5) * 40; pos[i * 3 + 1] = rnd(i + 1e4) * 18; pos[i * 3 + 2] = 10 - rnd(i + 2e4) * 70; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
    this.snow.layers.set(NOINK); this.snow.frustumCulled = false; R.add(this.snow);
    const bk = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(0.6, "rgba(220,230,255,0.5)"); gr.addColorStop(1, "rgba(220,230,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
    for (let i = 0; i < 26; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bk, transparent: true, opacity: 0.55, depthWrite: false, fog: false, toneMapped: false })); sp.layers.set(NOINK); this.bokeh.push(sp); R.add(sp); }
    this.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex(), fog: false, toneMapped: false, depthWrite: false })); this.moon.layers.set(NOINK); this.moon.scale.set(60, 60, 1); R.add(this.moon);
    this.town = R.children.slice(b2);

    const g = new THREE.Group(); B.build(g); R.add(g);
    R.traverse((o) => { if ((o as THREE.Mesh).isMesh && o !== this.sky && !o.layers.isEnabled(NOINK)) { o.castShadow = true; o.receiveShadow = true; } });
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.02; this.sun.shadow.radius = 3;
    R.add(this.hemi, this.sun, this.sun.target);
    void BOX; void CYL;
  }

  set(o: { light: LightName; t: number; cam: V3; look: V3; shadowR?: number }) {
    const L = o.light;
    this.sky.position.set(...o.cam);
    this.skyMat.map = this.skies[L]; this.skyMat.needsUpdate = true;
    const P = {
      office: { hs: 0xf2f4ff, hg: 0xb0b8e0, hi: 2.6, sc: 0xffd860, si: 6.5, sd: [-0.75, 0.42, 0.52], fog: 0xc8d8f0, fn: 40, ff: 300, lamp: 1.2 },
      night: { hs: 0x8aa0ff, hg: 0x5a6ae0, hi: 2.6, sc: 0xb8c8ff, si: 1.8, sd: [0.35, 0.8, 0.45], fog: 0x6a88f0, fn: 30, ff: 190, lamp: 14 },
    }[L];
    this.hemi.color.set(P.hs); this.hemi.groundColor.set(P.hg); this.hemi.intensity = P.hi;
    this.sun.color.set(P.sc); this.sun.intensity = P.si;
    const sd = new THREE.Vector3(...(P.sd as V3)).normalize(), r = o.shadowR ?? 12;
    this.sun.target.position.set(...o.look); this.sun.position.copy(this.sun.target.position).addScaledVector(sd, 60); this.sun.target.updateMatrixWorld();
    const sc = this.sun.shadow.camera; sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 1; sc.far = 140; sc.updateProjectionMatrix();
    this.fog.color.set(P.fog); this.fog.near = P.fn; this.fog.far = P.ff;
    this.lamps.forEach((l, i) => { l.intensity = i === 0 ? (L === "office" ? P.lamp : 0) : L === "night" ? P.lamp : 0; });
    for (const x of this.office) x.visible = L === "office";
    this.hole.visible = L === "office" && o.t > 12.33 && o.t < 13.5;
    for (const x of this.town) x.visible = L === "night";
    // the wall clock face
    const m = Math.round(clockMinAt(o.t)), cm = this.clockMesh.material as THREE.MeshStandardMaterial, tex = clockFace(9 + Math.floor(m / 60), m % 60);
    if (cm.map !== tex) { cm.map = tex; cm.needsUpdate = true; }
    // snow falls and drifts; the moon hangs above the tower
    const pa = this.snow.geometry.getAttribute("position") as THREE.BufferAttribute, arr = pa.array as Float32Array;
    for (let i = 0; i < arr.length / 3; i++) { const sp = 0.6 + rnd(i + 3e4) * 0.6; arr[i * 3 + 1] = (((rnd(i + 1e4) * 18 - o.t * sp) % 18) + 18) % 18; arr[i * 3] = TWX + (rnd(i) - 0.5) * 40 + Math.sin(o.t * 0.8 + i) * 0.3; }
    pa.needsUpdate = true;
    this.moon.position.set(TWX - 60, 150, -420);
    // foreground bokeh flakes in a box in front of the camera (0.5-2.2 m), drifting down
    const c = new THREE.Vector3(...o.cam), f = new THREE.Vector3(...o.look).sub(c).normalize(), rt = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(rt, f);
    this.bokeh.forEach((sp, i) => { sp.visible = L === "night"; const d = 0.5 + rnd(i + 70) * 1.7, x = (rnd(i + 80) - 0.5) * 1.3 * d, y = ((((rnd(i + 90) - o.t * (0.12 + rnd(i) * 0.1)) % 1) + 1) % 1 - 0.5) * 2.0 * d;
      sp.position.copy(c).addScaledVector(f, d).addScaledVector(rt, x).addScaledVector(up, y); const sz = 0.02 + rnd(i + 99) * 0.03; sp.scale.set(sz, sz, 1); });
  }
}
