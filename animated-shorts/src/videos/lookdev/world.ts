// Look-development world for the reference-quality engine: an office interior lit by sun through a window, and a
// small-town street at dusk. Used to tune materials, lighting, AO, outlines and the camera against the references.
import * as THREE from "three";
import { NOINK } from "../bridge/ink";
import { canvasTex } from "../eiffel/lib";
import { Batch, Kit, M, rep, defaultPal, desk, chair, bookshelf, cabinet, plant, wallClock, picture, windowFrame, door, deskClutter, house, pine, lampPost, fence, V3, rnd, CONE, BOX } from "../../lib3d/kit";
const TX = {}; // swapped to the texture library (src/lib3d/textures.ts) once it lands

export type LightName = "room" | "dusk";
export const RX = 0, SX = 300;

const T = TX as unknown as Record<string, ((...a: unknown[]) => THREE.Texture) | undefined>;
/** use the texture library when it has the function, otherwise a quick fallback */
const tx = (name: string, fallback: () => THREE.Texture, ...args: unknown[]) => { const f = T[name]; try { return f ? f(...args) : fallback(); } catch { return fallback(); } };
const quick = (base: string, lines: string, kind: "brick" | "plank" | "siding" | "noise") => canvasTex(256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256); g.strokeStyle = lines; g.lineWidth = 3;
  if (kind === "brick") for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); for (let x = (y / 32) % 2 ? 0 : 32; x < 256; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } }
  if (kind === "plank") for (let x = 0; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  if (kind === "siding") for (let y = 0; y < 256; y += 24) { g.fillStyle = lines; g.fillRect(0, y, 256, 4); }
  if (kind === "noise") for (let i = 0; i < 400; i++) { g.fillStyle = lines; g.fillRect(rnd(i) * 256, rnd(i + 1) * 256, 3, 3); }
});
const skyTex = (top: string, mid: string, hor: string) => canvasTex(16, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(0.42, mid); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); });
const winLit = () => canvasTex(128, 192, (g) => { const gr = g.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, "#ffe9b0"); gr.addColorStop(1, "#ffb860"); g.fillStyle = gr; g.fillRect(0, 0, 128, 192); g.fillStyle = "rgba(160,80,40,0.35)"; g.fillRect(0, 120, 128, 72); });
const art = (seed: number) => canvasTex(256, 192, (g) => { g.fillStyle = ["#8fc0e0", "#f2c88a", "#a8d0a0"][seed % 3]; g.fillRect(0, 0, 256, 192); g.fillStyle = "#5a8a4a"; g.beginPath(); g.moveTo(0, 150); g.quadraticCurveTo(80, 90, 140, 140); g.quadraticCurveTo(200, 100, 256, 130); g.lineTo(256, 192); g.lineTo(0, 192); g.fill(); g.fillStyle = "#fff2c0"; g.beginPath(); g.arc(190, 50, 22, 0, Math.PI * 2); g.fill(); });

export class World {
  root = new THREE.Group();
  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  sun = new THREE.DirectionalLight(0xffffff, 3);
  sky: THREE.Mesh; skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false });
  skies: Record<LightName, THREE.Texture>;
  fog = new THREE.Fog(0xffffff, 60, 400);
  lamps: THREE.PointLight[] = [];
  shafts: THREE.Mesh[] = [];

  constructor() {
    const R = this.root, B = new Batch(), k = new Kit(B, R), P = defaultPal();
    this.skies = { room: skyTex("#5a9ae0", "#a8d0f0", "#e8f0f0"), dusk: skyTex("#1e2a6a", "#6a6ab0", "#f0a0a0") };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), this.skyMat); this.sky.layers.set(NOINK); R.add(this.sky);

    // ================= ROOM (6 x 6 x 3.2, window in the left wall) =================
    k.at([RX, 0, 0], 0, () => {
      const W = 6, D = 6, H = 3.2;
      const wallM = M(0xffffff, rep(tx("bricks", () => quick("#7ccaa0", "#5aa880", "brick"), { paint: "#80c8a4", grout: "#5aa884" }), W, H, 1, 1));
      const floorM = M(0xffffff, rep(tx("woodFloor", () => quick("#b07a48", "#7a4a28", "plank")), W, D, 1, 1));
      k.floor(floorM, [0, 0, 0], W, D);
      k.panel(wallM, [0, H / 2, -D / 2], W, H);
      k.panel(M(0xffffff, rep(tx("bricks", () => quick("#7ccaa0", "#5aa880", "brick"), { paint: "#80c8a4", grout: "#5aa884" }), D, H, 1, 1)), [W / 2, H / 2, 0], D, H, -Math.PI / 2);
      // left wall with a window hole (four panels around it)
      const lw = M(0xffffff, rep(tx("bricks", () => quick("#7ccaa0", "#5aa880", "brick"), { paint: "#80c8a4", grout: "#5aa884" }), 2, 1, 1, 1));
      const wz = -0.4, ww = 1.6, wy0 = 0.9, wy1 = 2.4;
      k.mesh(new THREE.PlaneGeometry(D / 2 + wz - ww / 2 + 0.0, H), lw, [-W / 2, H / 2, (-D / 2 + wz - ww / 2) / 2], [0, Math.PI / 2, 0]);
      k.mesh(new THREE.PlaneGeometry(D / 2 - wz - ww / 2, H), lw, [-W / 2, H / 2, (D / 2 + wz + ww / 2) / 2], [0, Math.PI / 2, 0]);
      k.mesh(new THREE.PlaneGeometry(ww, wy0), lw, [-W / 2, wy0 / 2, wz], [0, Math.PI / 2, 0]);
      k.mesh(new THREE.PlaneGeometry(ww, H - wy1), lw, [-W / 2, (H + wy1) / 2, wz], [0, Math.PI / 2, 0]);
      for (const z of [wz - ww / 2 - 0.15, wz + ww / 2 + 0.15]) k.box(M(0x6ab890), [-W / 2 - 0.15, H / 2, z], [0.3, H, 0.3]);
      k.box(M(0x6ab890), [-W / 2 - 0.15, wy0 / 2, wz], [0.3, wy0, ww]); k.box(M(0x6ab890), [-W / 2 - 0.15, (H + wy1) / 2, wz], [0.3, H - wy1, ww]);
      k.at([-W / 2, (wy0 + wy1) / 2, wz], Math.PI / 2, () => windowFrame(k, ww, wy1 - wy0, M(0xf2efe8), { cols: 2, rows: 3 }));
      k.mesh(new THREE.PlaneGeometry(W, D), M(0xf4f1ea), [0, H, 0], [Math.PI / 2, 0, 0]);
      k.box(M(0xf2efe8), [0, 0.06, -D / 2 + 0.03], [W, 0.12, 0.06]); k.box(M(0xf2efe8), [W / 2 - 0.03, 0.06, 0], [0.06, 0.12, D]);
      k.box(M(0x5aa884), [0, 1.0, -D / 2 + 0.02], [W, 0.06, 0.04]);
      // rug, desk, chairs, shelves, cabinet, plants, clock, pictures, ceiling lamp, door
      k.floor(M(0xffffff, tx("rug", () => quick("#a8402a", "#e8b84a", "noise"))), [0.5, 0.005, -1.4], 2.6, 1.9);
      k.at([0.6, 0, -1.6], 0, () => { desk(k, P, 1.6, 0.8); k.at([0, 0.76, 0], 0, () => deskClutter(k, P, 3)); });
      k.at([0.6, 0, -2.35], 0, () => chair(k, P));
      k.at([-0.4, 0, -0.6], 0.4, () => chair(k, P));
      k.at([W / 2 - 0.18, 0, -1.2], -Math.PI / 2, () => bookshelf(k, P, 1.3, 2.1, 0.32, 4));
      k.at([W / 2 - 0.18, 0, 0.4], -Math.PI / 2, () => bookshelf(k, P, 1.3, 2.1, 0.32, 9));
      k.at([-2.4, 0, -D / 2 + 0.32], 0, () => cabinet(k, P, M(0x7a8a9a, undefined, { rough: 0.5, metal: 0.3 })));
      k.at([-1.85, 0, -D / 2 + 0.32], 0, () => cabinet(k, P, M(0x7a8a9a, undefined, { rough: 0.5, metal: 0.3 })));
      k.at([2.4, 0, -2.5], 0, () => plant(k, 1.6, 0x3f8a3a, 0xb5532c, 2));
      k.at([-2.5, 1.32, -D / 2 + 0.32], 0, () => plant(k, 0.8, 0x4a9a40, 0x2a6ab0, 5));
      k.at([0.6, 2.35, -D / 2 + 0.01], 0, () => wallClock(k, 0.32, 9, 7));
      k.at([-1.2, 1.9, -D / 2 + 0.01], 0, () => picture(k, art(1), 0.7, 0.5));
      k.at([1.9, 1.75, -D / 2 + 0.01], 0, () => picture(k, art(2), 0.5, 0.65));
      k.at([1.6, 0, D / 2 - 0.05], Math.PI, () => door(k, 0.95, 2.1, M(0x8a5a3a), M(0xf2efe8)));
      k.cyl(M(0xf2efe8), [0.6, H - 0.4, -1.4], 0.25, 0.3, [0, 0, 0]); k.cyl(M(0x2a2a30), [0.6, H - 0.12, -1.4], 0.01, 0.25);
      const lamp = new THREE.PointLight(0xffd8a0, 0, 7, 1.6); lamp.position.set(RX + 0.6, H - 0.6, -1.4); R.add(lamp); this.lamps.push(lamp);
      // the sun shaft through the window
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 5), new THREE.MeshBasicMaterial({ map: canvasTex(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,240,170,0.35)"); gr.addColorStop(1, "rgba(255,240,170,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
      shaft.position.set(RX - 1.2, 1.2, wz); shaft.rotation.set(0, Math.PI / 2, 1.0); shaft.layers.set(NOINK); R.add(shaft); this.shafts.push(shaft);
    });

    // ================= STREET (dusk) =================
    k.at([SX, 0, 0], 0, () => {
      k.floor(M(0xffffff, rep(tx("dirt", () => quick("#b89a78", "#9a7a58", "noise")), 8, 140, 2, 2)), [0, 0.005, -40], 8, 140);
      k.floor(M(0xffffff, rep(tx("grass", () => quick("#6a9a4a", "#4a7a3a", "noise")), 200, 200, 2, 2)), [0, 0, -40], 200, 200);
      const walls = [0xd9e4f0, 0x9ac0d8, 0xf2d0a0, 0xa8c8a0, 0xe8b0a0, 0xf4f1ea], roofs = [0x5a4a5a, 0x6a3a3a, 0x3a4a5a];
      for (const s of [-1, 1]) for (let i = 0; i < 7; i++) { const z = 10 - i * 11 + (s > 0 ? 4 : 0), seed = i * 2 + (s > 0 ? 1 : 0);
        k.at([s * 10, 0, z], s > 0 ? -Math.PI / 2 : Math.PI / 2, () => {
          house(k, { w: 6 + rnd(seed) * 1.5, d: 7, h: 3.4 + (seed % 3 === 0 ? 2.6 : 0), wall: M(0xffffff, rep(tx("clapboardSiding", () => quick("#" + walls[seed % 6].toString(16).padStart(6, "0"), "rgba(0,0,0,0.15)", "siding"), { color: "#" + walls[seed % 6].toString(16).padStart(6, "0") }), 7, 6, 1, 1)),
            trim: M(0xf4f1ea), roof: M(roofs[seed % 3]), door: M([0x8a3a2a, 0x2a4a6a, 0x3a6a3a][seed % 3]), win: new THREE.MeshBasicMaterial({ map: winLit(), toneMapped: false }), seed });
          fence(k, M(0xf4f1ea), [-3.2, 0, 6.2], [-1, 0, 6.2]); fence(k, M(0xf4f1ea), [1, 0, 6.2], [3.2, 0, 6.2]);
          k.at([2.2, 0, 6.6], 0, () => pine(k, 3 + rnd(seed + 3) * 2, M(0x2e6a4a), M(0x6a4a2a)));
        }); }
      for (let z = 8; z > -70; z -= 12) for (const s of [-1, 1]) k.at([s * 4.6, 0, z + (s > 0 ? 6 : 0)], 0, () => { const p = lampPost(k, M(0x2a2a30)); if (this.lamps.length < 6 && z > -30) { const l = new THREE.PointLight(0xffc070, 0, 10, 1.6); l.position.set(SX + s * 4.6 + p[0], p[1], z + (s > 0 ? 6 : 0)); R.add(l); this.lamps.push(l); } });
      for (let i = 0; i < 40; i++) { const s = rnd(i + 50) < 0.5 ? -1 : 1; k.at([s * (18 + rnd(i) * 30), 0, 10 - rnd(i + 1) * 110], 0, () => pine(k, 5 + rnd(i + 2) * 6, M(0x2e5a4a), M(0x5a4030))); }
      for (let i = 0; i < 9; i++) k.add(CONE, M(0x8a90b8), [-160 + i * 40, 30, -200 - rnd(i) * 40], [40 + rnd(i) * 20, 70 + rnd(i + 1) * 30, 30]);
      k.box(M(0xf4f1ea), [0, 4, -78], [8, 8, 6]); k.add(CONE, M(0x6a3a3a), [0, 10, -78], [5, 4, 4]);
    });
    const g = new THREE.Group(); B.build(g); g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } }); R.add(g);
    R.traverse((o) => { if ((o as THREE.Mesh).isMesh && o !== this.sky && !o.layers.isEnabled(NOINK)) { o.castShadow = true; o.receiveShadow = true; } });
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.02; this.sun.shadow.radius = 4;
    R.add(this.hemi, this.sun, this.sun.target);
    void BOX; void V3_;
  }

  set(o: { light: LightName; t: number; cam: V3; look: V3; shadowR?: number }) {
    const L = o.light;
    this.sky.position.set(...o.cam);
    this.skyMat.map = this.skies[L]; this.skyMat.needsUpdate = true;
    const P = {
      room: { hs: 0xf0f4ff, hg: 0xa08a70, hi: 1.6, sc: 0xfff2d8, si: 3.4, sd: [-0.75, 0.55, 0.25], fog: 0xe8f0f0, fn: 60, ff: 400, lamp: 2.5 },
      dusk: { hs: 0x8a9ae0, hg: 0x5a4a50, hi: 1.3, sc: 0xffb890, si: 1.4, sd: [0.5, 0.3, -0.8], fog: 0x9a90c0, fn: 40, ff: 260, lamp: 6 },
    }[L];
    this.hemi.color.set(P.hs); this.hemi.groundColor.set(P.hg); this.hemi.intensity = P.hi;
    this.sun.color.set(P.sc); this.sun.intensity = P.si;
    const sd = new THREE.Vector3(...(P.sd as V3)).normalize(), r = o.shadowR ?? 12;
    this.sun.target.position.set(...o.look); this.sun.position.copy(this.sun.target.position).addScaledVector(sd, 60); this.sun.target.updateMatrixWorld();
    const sc = this.sun.shadow.camera; sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 1; sc.far = 140; sc.updateProjectionMatrix();
    this.fog.color.set(P.fog); this.fog.near = P.fn; this.fog.far = P.ff;
    this.lamps.forEach((l) => { l.intensity = P.lamp; });
    this.shafts.forEach((s) => { s.visible = L === "room"; });
  }
}
const V3_ = 0;
