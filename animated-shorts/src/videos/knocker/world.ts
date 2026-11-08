// "Knocker-upper" test (v3 check): the Clock Man snowy town, plus a sleeper in an upper window and the
// knocker-upper's long pole as a real 3D mesh from his raised hands to the window glass (tapping on the beat).
import * as THREE from "three";
import { World as ClockWorld, LightName, TWX } from "../clockman/world";
import { M, V3 } from "../../lib3d/kit";

export type { LightName };
export { TWX };
/** the upper-floor window of the tall house on the left (house seed 6, front face at x = TWX - 7) */
export const WIN: V3 = [TWX - 7.0, 4.25, -25];
export const KNOCKER: V3 = [TWX - 2.5, 0, -25.9];
/** tapping: the pole tip knocks 4 times a second while he works */
export const tapAt = (t: number) => (t > 5.1 && t < 9.6 ? Math.max(0, Math.sin(t * Math.PI * 8)) * 0.07 : 0);

export class World extends ClockWorld {
  pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1, 8), M(0x8a5a32));
  knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), M(0x3a2a22));
  constructor() {
    super();
    this.pole.castShadow = this.knob.castShadow = true; this.root.add(this.pole, this.knob);
    // wall patch under the window sill so the sleeper card only shows head + shoulders in the window
    const patch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 1.2), M(0xb8d4f0)); patch.position.set(WIN[0] + 0.12, WIN[1] - 1.12, WIN[2]); this.root.add(patch);
  }
  set(o: { light: LightName; t: number; cam: V3; look: V3; shadowR?: number }) {
    super.set(o);
    const on = o.light === "night" && o.t >= 2.7;
    this.pole.visible = this.knob.visible = on;
    if (!on) return;
    const a = new THREE.Vector3(KNOCKER[0] - 0.2, 0.92, KNOCKER[2] + 0.05);
    const b = new THREE.Vector3(WIN[0] + 0.22 + tapAt(o.t) * 0.6, WIN[1] - 0.05 + tapAt(o.t), WIN[2] - 0.5);
    const d = b.clone().sub(a), L = d.length();
    this.pole.position.copy(a).addScaledVector(d, 0.5); this.pole.scale.set(1, L, 1);
    this.pole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    this.knob.position.copy(b);
  }
}
