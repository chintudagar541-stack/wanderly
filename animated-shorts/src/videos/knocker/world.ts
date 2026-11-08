// "The Knocker-Upper": the Clock Man snowy town, plus
//  - a sleeper in an upper window (a wall patch under the sill hides the card's body),
//  - the knocker-upper's long pole as a real 3D mesh from his raised hands to the window glass (tapping on the beat),
//  - Mary Smith's peashooter (a tube at her mouth) and the dried peas flying to the glass,
//  - wind-up alarm clocks that ring and rattle (on the market stall, and on the sleeper's window sill),
//  - a "dawn" light (pink sunrise sky, warm low sun) next to the night.
import * as THREE from "three";
import { World as ClockWorld, TWX } from "../clockman/world";
import { canvasTex } from "../eiffel/lib";
import { M, V3, clockFace } from "../../lib3d/kit";

export type LightName = "office" | "night" | "dawn";
export { TWX };
/** the upper-floor window of the tall house on the left (house seed 6, front face at x = TWX - 7) */
export const WIN: V3 = [TWX - 7.0, 4.25, -25];
export const KNOCKER: V3 = [TWX - 2.5, 0, -25.9];
export const MARY: V3 = [TWX - 3.1, 0, -22.6];
export const STALL_CLOCK: V3 = [TWX + 5.5, 1.12, -36];
/** tapping: the pole tip knocks 4 times a second while he works */
export const tapAt = (t: number) => ((t > 5.1 && t < 8.5) || (t > 31.2 && t < 33) ? Math.max(0, Math.sin(t * Math.PI * 8)) * 0.07 : 0);
/** the pole is in his hands in these windows of time */
export const poleOn = (t: number) => (t >= 2.7 && t < 8.6) || (t >= 13.1 && t < 14.5) || t >= 31.1;
/** the peas: launch times; each flies for 0.35 s */
export const PEAS = [15.5, 15.85, 16.2, 16.55];
/** alarm clocks ring (rattle) in these windows */
export const ringAt = (t: number) => (t > 25.9 && t < 27.2) || (t > 29.6 && t < 30.8);

const alarmClock = (root: THREE.Object3D, s: number) => {
  const g = new THREE.Group(), red = M(0xd8322f, undefined, { rough: 0.35, metal: 0.4 }), dark = M(0x2a2a30);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 32), red); body.rotation.x = Math.PI / 2; g.add(body);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.088, 32), M(0xffffff, clockFace(6, 0, "#d8322f"))); face.position.z = 0.031; g.add(face);
  for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0xd8b040, undefined, { rough: 0.3, metal: 0.7 })); b.position.set(sx * 0.07, 0.1, 0); b.rotation.z = -sx * 0.5; g.add(b); }
  const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.06, 0.012), dark); hammer.position.set(0, 0.12, 0); g.add(hammer);
  for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 6), dark); leg.position.set(sx * 0.06, -0.11, 0); leg.rotation.z = sx * 0.4; g.add(leg); }
  g.scale.setScalar(s); g.traverse((o) => { (o as THREE.Mesh).castShadow = true; }); root.add(g); return g;
};

export class World extends ClockWorld {
  pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1, 8), M(0x8a5a32));
  knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), M(0x3a2a22));
  tube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.42, 10), M(0x6a7a8a, undefined, { rough: 0.4, metal: 0.6 }));
  peas: THREE.Mesh[] = [];
  clock1: THREE.Group; clock2: THREE.Group;
  dawnSky = canvasTex(256, 1024, (g) => { const gr = g.createLinearGradient(0, 0, 0, 1024);
    for (const [o, c] of [[0, "#5a6ad0"], [0.25, "#b48ad8"], [0.4, "#f09dc3"], [0.48, "#ffbd9d"], [0.5, "#ffe0b0"], [0.53, "#edcfbd"], [1, "#c0a8c8"]] as [number, string][]) gr.addColorStop(o, c);
    g.fillStyle = gr; g.fillRect(0, 0, 256, 1024); });
  constructor() {
    super();
    this.pole.castShadow = this.knob.castShadow = true; this.root.add(this.pole, this.knob, this.tube);
    for (let i = 0; i < PEAS.length; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), M(0x8ab04a)); this.peas.push(p); this.root.add(p); }
    const patch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 1.2), M(0xb8d4f0)); patch.position.set(WIN[0] + 0.12, WIN[1] - 1.12, WIN[2]); this.root.add(patch);
    this.clock1 = alarmClock(this.root, 1.0); this.clock1.position.set(...STALL_CLOCK); this.clock1.rotation.y = -Math.PI / 2;
    this.clock2 = alarmClock(this.root, 0.9); this.clock2.position.set(WIN[0] + 0.28, WIN[1] - 0.42, WIN[2] + 0.42); this.clock2.rotation.y = Math.PI / 2 - 0.4;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(o: { light: any; t: number; cam: V3; look: V3; shadowR?: number }) {
    const dawn = o.light === "dawn";
    super.set({ ...o, light: dawn ? "night" : o.light });
    if (dawn) {   // warm sunrise over the snowy town; street lamps dimmed
      this.skyMat.map = this.dawnSky; this.skyMat.needsUpdate = true;
      this.hemi.color.set(0xffd8e8); this.hemi.groundColor.set(0x9a8ad0); this.hemi.intensity = 2.3;
      this.sun.color.set(0xffb878); this.sun.intensity = 3.2;
      const sd = new THREE.Vector3(0.55, 0.28, -0.8).normalize(); this.sun.position.copy(this.sun.target.position).addScaledVector(sd, 60);
      this.fog.color.set(0xf0c8d0); this.fog.near = 25; this.fog.far = 150;
      this.lamps.forEach((l, i) => { if (i > 0) l.intensity = 2; });
      this.moon.visible = false; this.bokeh.forEach((b) => { b.visible = false; });
    }
    const t = o.t, outside = o.light !== "office";
    const on = outside && poleOn(t);
    this.pole.visible = this.knob.visible = on;
    if (on) {
      const a = new THREE.Vector3(KNOCKER[0] - 0.2, 0.92, KNOCKER[2] + 0.05);
      const b = new THREE.Vector3(WIN[0] + 0.22 + tapAt(t) * 0.6, WIN[1] - 0.05 + tapAt(t), WIN[2] - 0.5);
      const d = b.clone().sub(a), L = d.length();
      this.pole.position.copy(a).addScaledVector(d, 0.5); this.pole.scale.set(1, L, 1);
      this.pole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      this.knob.position.copy(b);
    }
    // Mary's peashooter: a short tube at her mouth aimed at the window; peas fly along the line to the glass
    const mouth = new THREE.Vector3(MARY[0] - 0.14, 1.32, MARY[2] - 0.05), glass = new THREE.Vector3(WIN[0] + 0.05, WIN[1] - 0.05, WIN[2] + 0.35);
    const aim = glass.clone().sub(mouth).normalize();
    this.tube.visible = outside && t > 14.3 && t < 17.7;
    this.tube.position.copy(mouth).addScaledVector(aim, 0.2); this.tube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), aim);
    this.peas.forEach((p, i) => { const u = (t - PEAS[i]) / 0.35; p.visible = outside && u > 0 && u < 1;
      if (p.visible) p.position.copy(mouth).addScaledVector(aim, 0.42).lerp(glass, u).add(new THREE.Vector3(0, Math.sin(u * Math.PI) * 0.25, 0)); });
    // ringing alarm clocks rattle
    const r = ringAt(t) ? Math.sin(t * 90) * 0.08 : 0;
    this.clock1.rotation.z = r; this.clock1.position.y = STALL_CLOCK[1] + Math.abs(r) * 0.2;
    this.clock2.rotation.z = r; this.clock2.visible = outside && t > 28.5;
  }
}
