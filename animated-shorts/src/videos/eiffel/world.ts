// "The Man Who Sold the Eiffel Tower. Twice.": Paris 1925 in one toon-shaded world (city.ts + tower.ts) plus
// interior sets far away (interiors.ts). Lights, sky (follows the camera), fog, flames (lamps, candles,
// chandeliers), a movable limousine and a steam train with puffs of steam.
import * as THREE from "three";
import { NOINK } from "../bridge/ink";
import { Flames } from "../diwali/world";
import { Batch, V3, canvasTex, rnd, toon, SPH } from "./lib";
import { buildTower } from "./tower";
import { buildCity } from "./city";
import { Interiors, SALON, SUITE, FLAT, STATION } from "./interiors";
import { carGroup, trainGroup } from "./vehicles";

export type LightName = "morning" | "day" | "golden" | "dusk" | "interior" | "interiorNight";
export type Room = "salon" | "suite" | "flat" | "station";
export { SALON, SUITE, FLAT, STATION };

const skyTex = (top: string, mid: string, hor: string, stars = 0) => canvasTex(16, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(0.42, mid); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor);
  g.fillStyle = gr; g.fillRect(0, 0, 16, 512);
  for (let i = 0; i < stars; i++) { g.fillStyle = `rgba(255,250,230,${0.3 + rnd(i) * 0.6})`; g.fillRect(rnd(i + 5) * 16, rnd(i + 9) * 210, 1, 1); }
});

export class World {
  root = new THREE.Group();
  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
  sun = new THREE.DirectionalLight(0xffffff, 2);
  sky: THREE.Mesh; skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false });
  skies: Record<LightName, THREE.Texture>;
  fog = new THREE.Fog(0x000000, 250, 1500);
  lamps: Flames; candles: Flames;
  warm: THREE.PointLight[] = [];
  limo: THREE.Group; train: THREE.Group; puffs: THREE.Mesh[] = [];
  clouds: THREE.Mesh[] = []; cloudMat: THREE.MeshBasicMaterial;
  interiors: Interiors;

  constructor() {
    const R = this.root, B = new Batch();
    this.skies = {
      morning: skyTex("#5a8ad0", "#c8daf0", "#f6e2c8"), day: skyTex("#3e7fd2", "#8fb6e6", "#dfe8ee"), golden: skyTex("#5f86d0", "#f6b77a", "#ffd9a0"),
      dusk: skyTex("#1a2050", "#7a5a8a", "#f0a070", 40), interior: skyTex("#3e7fd2", "#8fb6e6", "#dfe8ee"), interiorNight: skyTex("#04061a", "#121838", "#26284a", 80),
    };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 24, 16), this.skyMat); this.sky.layers.set(NOINK); this.sky.renderOrder = -1; R.add(this.sky);
    const lamps: { p: V3; order: number; tint?: V3 }[] = [], candles: { p: V3; order: number; tint?: V3 }[] = [];
    buildTower(B);
    buildCity(R, B, lamps);
    this.interiors = new Interiors(R, B, candles, lamps);
    B.build(R);
    this.lamps = new Flames(R, lamps, 0.55);
    this.candles = new Flames(R, candles, 0.22);
    this.limo = carGroup(R, 0x2a2440, true); this.limo.visible = false;
    this.train = trainGroup(R); this.train.position.set(STATION[0], 0, STATION[2]);
    const steamM = toon(0xf4f4f6);
    for (let i = 0; i < 36; i++) { const p = new THREE.Mesh(SPH, steamM); p.visible = false; this.train.add(p); this.puffs.push(p); }
    for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xffb060, 0, 14, 1.4); R.add(l); this.warm.push(l); }
    this.cloudMat = new THREE.MeshBasicMaterial({ map: canvasTex(256, 128, (g) => { g.fillStyle = "#fff"; for (const [x, y, r] of [[60, 80, 36], [110, 60, 48], [165, 70, 40], [205, 85, 28], [130, 92, 50]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } }), transparent: true, depthWrite: false, fog: false, toneMapped: false });
    for (let i = 0; i < 30; i++) { const a = rnd(i + 950) * Math.PI * 2, r = 1050 + rnd(i + 951) * 200, s = 130 + rnd(i + 952) * 140; const c = new THREE.Mesh(new THREE.PlaneGeometry(s, s / 2), this.cloudMat); c.position.set(Math.cos(a) * r, 200 + rnd(i + 953) * 260, Math.sin(a) * r); c.lookAt(0, 120, 0); c.layers.set(NOINK); R.add(c); this.clouds.push(c); }
    this.sun.position.set(80, 120, 60); R.add(this.hemi, this.sun, this.sun.target);
  }

  set(o: { light: LightName; t: number; px: number; cam: V3; room?: Room; limo?: { pos: V3; ry: number }; train?: number; steam?: number }) {
    const L = o.light;
    this.sky.position.set(...o.cam);
    this.skyMat.map = this.skies[L]; this.skyMat.needsUpdate = true;
    const P = {
      morning: { hs: 0xeef0ff, hg: 0x7a6a5a, hi: 1.7, sc: 0xffe6c8, si: 2.5, sp: [160, 110, -120], fog: 0xe8e2d4, lamp: 0, cl: 0xfff4ea },
      day: { hs: 0xe0ecff, hg: 0x6a6a4a, hi: 1.75, sc: 0xfff2d8, si: 2.6, sp: [120, 160, -80], fog: 0xdfe8ee, lamp: 0, cl: 0xffffff },
      golden: { hs: 0xffe0c0, hg: 0x7a6a4a, hi: 1.7, sc: 0xffc890, si: 2.5, sp: [-160, 60, -140], fog: 0xffd9a0, lamp: 0.6, cl: 0xffd0b0 },
      dusk: { hs: 0x9a8ac8, hg: 0x3a3040, hi: 1.4, sc: 0xffa070, si: 1.4, sp: [-160, 30, -140], fog: 0xd89a80, lamp: 1, cl: 0xe8a0a0 },
      interior: { hs: 0xfff0dc, hg: 0x6a5a4a, hi: 1.55, sc: 0xffe8c8, si: 1.5, sp: [60, 80, 120], fog: 0xdfe8ee, lamp: 0.6, cl: 0xffffff },
      interiorNight: { hs: 0x6a6aa0, hg: 0x2a1a20, hi: 1.0, sc: 0x8a9ad8, si: 0.5, sp: [60, 80, 120], fog: 0x26284a, lamp: 1, cl: 0x3a4270 },
    }[L];
    this.hemi.color.set(P.hs); this.hemi.groundColor.set(P.hg); this.hemi.intensity = P.hi;
    this.sun.color.set(P.sc); this.sun.intensity = P.si; this.sun.position.set(o.cam[0] + P.sp[0], P.sp[1], o.cam[2] + P.sp[2]); this.sun.target.position.set(o.cam[0], 0, o.cam[2]); this.sun.target.updateMatrixWorld();
    this.fog.color.set(P.fog); this.fog.near = 260; this.fog.far = 1500;
    this.cloudMat.color.set(P.cl);
    // warm practical lights follow the active room
    const spots: Record<Room, { p: V3[]; k: number }> = {
      salon: { p: [[SALON[0] - 3.5, 4.2, 0], [SALON[0] + 3.5, 4.2, 0], [SALON[0] - 10, 1, 0]], k: 7 },
      suite: { p: [[SUITE[0] + 0.75, 1.3, -2.9], [SUITE[0] + 2, 1.3, -0.9], [SUITE[0] - 2, 3.4, 1]], k: 6 },
      flat: { p: [[FLAT[0] - 3.9, 1.6, 3.0], [FLAT[0], 3.2, 0], [FLAT[0] + 3, 2.5, -2]], k: 3 },
      station: { p: [[STATION[0] - 10, 6, 6], [STATION[0] + 10, 6, 6], [STATION[0] + 30, 6, -8]], k: 4 },
    };
    const sp = o.room ? spots[o.room] : null;
    this.warm.forEach((l, i) => { if (sp) { l.position.set(...sp.p[i]); l.intensity = sp.k * (0.92 + 0.08 * Math.sin(o.t * 9 + i)); } else l.intensity = 0; });
    for (const f of [this.lamps, this.candles]) { f.mat.uniforms.uTime.value = o.t; f.mat.uniforms.uPx.value = o.px; }
    this.lamps.mat.uniforms.uLit.value = P.lamp > 0 ? 1 : 0; this.lamps.mat.uniforms.uSize.value = 0.55 * Math.max(0.6, P.lamp);
    this.candles.mat.uniforms.uLit.value = 1;
    // vehicles
    this.limo.visible = !!o.limo;
    if (o.limo) { this.limo.position.set(...o.limo.pos); this.limo.rotation.y = o.limo.ry; }
    this.train.position.x = STATION[0] + (o.train ?? 0);
    const st = o.steam ?? 0;
    this.puffs.forEach((p, i) => {
      if (st <= 0) { p.visible = false; return; }
      const period = 0.16, birth = Math.floor(o.t / period) * period - i * period, age = o.t - birth, life = 36 * period;
      const s = Math.min(1, age / 0.5) * (1 - Math.max(0, (age - life * 0.7) / (life * 0.3)));
      p.visible = s > 0.02;
      p.position.set(-6.4 + age * (2.2 + st * 3) + Math.sin(i * 2.1) * 0.4 * age, 5.6 + age * 2.0 - age * age * 0.12, Math.cos(i * 1.7) * 0.5 * age);
      p.scale.setScalar((0.5 + age * 0.9) * s);
    });
  }
}
