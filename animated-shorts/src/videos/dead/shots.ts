// Shot plan for "The Man Who Was Already Dead" (voice: shorts/already-dead/voice/voice.mp3, word times in words.json).
// Every shot is a time range in seconds; 3D shots give a camera, the actors on screen and the world state per time,
// DOM shots (phone screens, police report, black) are drawn by inserts.tsx.
import * as THREE from "three";
import { LightName } from "./world";
import { FrontOpts, Outfit, INK } from "./toon";

export const FPS = 30;
export const DURATION = 85;
export const TOTAL = DURATION * FPS;

export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
export type Who = "daniel" | "double" | "cop1" | "cop2";
export type ActorDef = {
  who: Who; pos: V3; opts: FrontOpts; tint?: V3; lying?: boolean; turn?: number; scale?: number; yaw?: number; dropY?: number;
};
export type WorldState = {
  light: LightName; lampOn?: boolean; phoneOn?: number; phoneAt?: "table" | "floor" | "none"; phoneFloorY?: number; phoneFloorRot?: number;
  frontDoor?: number; bedDoor?: number; tube?: number; bedDark?: number; vibrate?: number;
};
export type Kind = "3d" | "app" | "log" | "report" | "incoming" | "black";
export type Grade = "night" | "day" | "drain" | "hall";
export type Shot = {
  id: number; a: number; b: number; kind: Kind; view?: "peep" | "cctv"; grade?: Grade;
  cam?: (t: number, u: number) => Cam; actors?: (t: number) => ActorDef[]; world?: (t: number) => WorldState;
};

export const DANIEL: Outfit = { jacket: "#5f7fb8", pants: "#3a3f55", boots: "#d9d3c4", hat: "hair", hair: "#4a3326" };
export const COP: Outfit = { jacket: "#26365e", pants: "#1d2336", boots: INK, hat: "cap", cap: "#1b2440", buttons: "#d8c060", belt: "#1a1a1a" };

// ---------------- helpers ----------------
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const t = clamp01(x); return t * t * t * (t * (6 * t - 15) + 10); };
const L = (a: number, b: number, t: number) => a + (b - a) * t;
const LV = (a: V3, b: V3, t: number): V3 => [L(a[0], b[0], t), L(a[1], b[1], t), L(a[2], b[2], t)];
/** glide from camera A to camera B over the shot (smootherstep), plus a slow creeping push toward the look point */
const glide = (A: Cam, B: Cam, push = 0.06) => (_t: number, u: number): Cam => {
  const s = smooth(u), pos = LV(A.pos, B.pos, s), look = LV(A.look, B.look, s);
  const k = push * u;
  return { pos: LV(pos, look, k), look, fov: L(A.fov, B.fov, s), roll: L(A.roll ?? 0, B.roll ?? 0, s) };
};
const hold = (C: Cam, push = 0.08) => glide(C, C, push);
/** 0 -> 1 between t0 and t1 */
const ramp = (t: number, t0: number, t1: number) => smooth((t - t0) / (t1 - t0));
/** deterministic blinks: 4 frames every ~1.3-2.2 s */
export const blinkAt = (t: number, seed: number) => {
  const f = Math.round(t * FPS), period = 40 + ((seed * 13) % 26), ph = (f + seed * 7) % period;
  return ph < 4 ? [0.5, 1, 1, 0.5][ph] : 0;
};
/** corridor tube flicker 0..1 */
export const flicker = (t: number, k = 1) => {
  const f = Math.floor(t * FPS), r = Math.sin(f * 91.7 + 3.1) * 43758.5453, v = r - Math.floor(r);
  const burst = Math.sin(t * 2.3) > 0.55 ? 1 : 0;
  return v < 0.18 * k * (0.4 + burst) ? 0.15 : v < 0.3 * k * (0.4 + burst) ? 0.6 : 1;
};

const NIGHT: V3 = [0.62, 0.66, 0.9];
const PHONE_LIT: V3 = [0.78, 0.86, 1.02];
const DAY: V3 = [1, 1, 1];
const D_SIT: V3 = [-2.25, 0.3, 0.05];
const D_DOOR: V3 = [1.38, 0, -3.45];
const DOUBLE_HALL: V3 = [1.42, 0, -4.6];
const DOUBLE_BED: V3 = [-1.2, 0, 4.45];

// ---------------- the shots ----------------
const S: Shot[] = [];
const add = (s: Omit<Shot, "id">) => S.push({ id: S.length + 1, grade: "night", ...s });

// 1  "A man named Daniel ..." : asleep on the couch, phone glowing on the side table
add({ a: 0, b: 2.3, kind: "3d",
  cam: glide({ pos: [1.6, 1.75, 2.6], look: [-2.3, 0.7, -0.4], fov: 46 }, { pos: [0.9, 1.55, 1.7], look: [-2.35, 0.7, -0.6], fov: 44 }, 0.05),
  actors: () => [{ who: "daniel", pos: [-2.42, 0.55, -1.0], lying: true, opts: { mode: "stand", expr: "asleep", blink: 1 }, tint: NIGHT }],
  world: (t) => ({ light: "night", lampOn: false, phoneOn: 1, vibrate: 1, tube: flicker(t, 0.3) }) });
// 2  "... received a phone call at exactly 2:17 AM" : the clock and the buzzing phone
add({ a: 2.3, b: 5.0, kind: "3d",
  cam: glide({ pos: [-1.55, 0.86, -1.05], look: [-2.5, 0.6, -1.72], fov: 40 }, { pos: [-1.7, 0.82, -1.2], look: [-2.5, 0.6, -1.72], fov: 36 }, 0.08),
  actors: () => [{ who: "daniel", pos: [-2.42, 0.55, -1.0], lying: true, opts: { mode: "stand", expr: "asleep", blink: 1 }, tint: NIGHT }],
  world: () => ({ light: "night", lampOn: false, phoneOn: 1, vibrate: 1 }) });
// 3  "But when he answered, he heard ..." : sitting up, phone at the ear
add({ a: 5.0, b: 7.45, kind: "3d",
  cam: glide({ pos: [-0.35, 1.25, 0.55], look: [-2.25, 1.05, 0.05], fov: 40 }, { pos: [-0.6, 1.25, 0.4], look: [-2.25, 1.1, 0.05], fov: 38 }, 0.08),
  actors: (t) => [{ who: "daniel", pos: D_SIT, opts: { mode: "sit", expr: "worried", prop: "phoneEar", glow: 1, blink: blinkAt(t, 1), look: -0.3 }, tint: PHONE_LIT }],
  world: () => ({ light: "night", lampOn: true, phoneOn: 0, phoneAt: "none" }) });
// 4  "... his own voice. Whispering: Don't open the front door."
add({ a: 7.45, b: 10.35, kind: "3d",
  cam: glide({ pos: [-0.7, 1.2, 0.16], look: [-2.25, 1.12, 0.05], fov: 36 }, { pos: [-0.85, 1.2, 0.14], look: [-2.25, 1.13, 0.05], fov: 32 }, 0.1),
  actors: (t) => [{ who: "daniel", pos: D_SIT, opts: { mode: "sit", expr: t < 9.1 ? "nervous" : "shock", prop: "phoneEar", glow: 1, blink: t < 9.1 ? blinkAt(t, 1) : 0 }, tint: PHONE_LIT }],
  world: () => ({ light: "night", lampOn: true, phoneAt: "none" }) });
// 5  "Daniel froze." : the front door far away, Daniel frozen in the foreground
add({ a: 10.35, b: 12.2, kind: "3d",
  cam: glide({ pos: [0.2, 1.75, -1.3], look: [-2.25, 0.9, 0.1], fov: 42 }, { pos: [0.05, 1.7, -1.15], look: [-2.25, 0.92, 0.1], fov: 40 }, 0.05),
  actors: () => [{ who: "daniel", pos: D_SIT, opts: { mode: "sit", expr: "shock", prop: "phoneEar", glow: 1 }, tint: NIGHT }],
  world: (t) => ({ light: "night", lampOn: true, phoneAt: "none", tube: flicker(t, 0.3) }) });
// 6  "Three seconds later ... someone knocked." : the front door, three knocks
add({ a: 12.2, b: 15.15, kind: "3d",
  cam: glide({ pos: [0.55, 1.3, -0.6], look: [1.4, 1.0, -4], fov: 46 }, { pos: [0.7, 1.28, -1.2], look: [1.4, 1.0, -4], fov: 44 }, 0.05),
  world: (t) => ({ light: "night", lampOn: true, phoneAt: "none", tube: flicker(t, 0.4) }) });
// 7  "He looked through the peephole" : side view, eye to the door
add({ a: 15.15, b: 16.75, kind: "3d",
  cam: glide({ pos: [-0.8, 1.5, -2.2], look: [1.3, 1.3, -3.9], fov: 40 }, { pos: [-0.6, 1.52, -2.4], look: [1.3, 1.35, -3.95], fov: 38 }, 0.08),
  actors: (t) => [{ who: "daniel", pos: [1.38, 0, -3.72], opts: { mode: "stand", expr: "worried", tilt: 6, blink: blinkAt(t, 2), back: true }, tint: NIGHT, scale: 1 }],
  world: (t) => ({ light: "night", lampOn: true, phoneAt: "none", tube: flicker(t, 0.4) }) });
// 8  "Nobody was there." : peephole view of the empty hallway
add({ a: 16.75, b: 18.25, kind: "3d", view: "peep", grade: "hall",
  cam: glide({ pos: [1.4, 1.5, -4.17], look: [-3.0, 1.05, -5.9], fov: 118 }, { pos: [1.4, 1.5, -4.17], look: [4.6, 1.05, -5.9], fov: 112 }, 0),
  world: (t) => ({ light: "hall", tube: flicker(t, 1) }) });
// 9  "Then his phone rang again."
add({ a: 18.25, b: 20.45, kind: "3d",
  cam: glide({ pos: [1.05, 1.42, -1.75], look: [1.38, 1.25, -3.45], fov: 40 }, { pos: [1.1, 1.42, -2.0], look: [1.38, 1.28, -3.45], fov: 38 }, 0.08),
  actors: (t) => [{ who: "daniel", pos: D_DOOR, opts: { mode: "stand", expr: "shock", prop: "phoneHold", glow: Math.floor(t * 6) % 2 ? 1 : 0.6, look: 0.4 }, tint: PHONE_LIT }],
  world: (t) => ({ light: "night", lampOn: true, phoneAt: "none", tube: flicker(t, 0.4) }) });
// 10 "This time, the voice said: check your security camera."
add({ a: 20.45, b: 24.15, kind: "3d",
  cam: glide({ pos: [1.15, 1.55, -1.75], look: [1.38, 1.45, -3.45], fov: 36 }, { pos: [1.2, 1.55, -1.95], look: [1.38, 1.46, -3.45], fov: 33 }, 0.12),
  actors: (t) => [{ who: "daniel", pos: D_DOOR, opts: { mode: "stand", expr: t < 22.25 ? "worried" : "shock", prop: "phoneEar", glow: 1, blink: t < 22.25 ? blinkAt(t, 3) : 0 }, tint: PHONE_LIT }],
  world: () => ({ light: "night", lampOn: true, phoneAt: "none" }) });
// 11 "He opened the camera app" : phone screen
add({ a: 24.15, b: 26.15, kind: "app" });
// 12 "... made his blood run cold." : low angle, lit by the phone
add({ a: 26.15, b: 29.05, kind: "3d", grade: "drain",
  cam: glide({ pos: [1.3, 1.05, -2.55], look: [1.38, 1.55, -3.45], fov: 40 }, { pos: [1.32, 1.12, -2.75], look: [1.38, 1.58, -3.45], fov: 34 }, 0.1),
  actors: () => [{ who: "daniel", pos: D_DOOR, opts: { mode: "stand", expr: "terror", prop: "phoneHold", glow: 1 }, tint: PHONE_LIT }],
  world: () => ({ light: "night", lampOn: false, phoneAt: "none" }) });
// 13 "The footage showed HIMSELF standing outside his own apartment door" : security camera
add({ a: 29.05, b: 33.25, kind: "3d", view: "cctv", grade: "hall",
  cam: glide({ pos: [5.55, 2.32, -5.9], look: [1.4, 0.9, -4.3], fov: 62 }, { pos: [5.55, 2.32, -5.9], look: [1.45, 0.95, -4.35], fov: 55 }, 0),
  actors: () => [{ who: "double", pos: DOUBLE_HALL, opts: { mode: "stand", expr: "neutral", back: true }, tint: [0.95, 1, 0.95] }],
  world: (t) => ({ light: "hall", tube: flicker(t, 0.5) }) });
// 14 "But he was still inside."
add({ a: 33.25, b: 35.15, kind: "3d",
  cam: glide({ pos: [0.7, 1.5, -1.5], look: [1.38, 1.25, -3.6], fov: 44 }, { pos: [0.78, 1.5, -1.75], look: [1.38, 1.28, -3.6], fov: 42 }, 0.06),
  actors: () => [{ who: "daniel", pos: D_DOOR, opts: { mode: "stand", expr: "terror", prop: "phoneHold", glow: 1 }, tint: PHONE_LIT }],
  world: (t) => ({ light: "night", lampOn: true, phoneAt: "none", tube: flicker(t, 0.5) }) });
// 15 "Suddenly, the man on the security footage slowly turned toward the camera"
add({ a: 35.15, b: 39.95, kind: "3d", view: "cctv", grade: "hall",
  cam: glide({ pos: [5.55, 2.32, -5.9], look: [1.45, 1.1, -4.45], fov: 40 }, { pos: [5.55, 2.32, -5.9], look: [1.45, 1.25, -4.5], fov: 30 }, 0),
  actors: (t) => [{ who: "double", pos: DOUBLE_HALL, opts: { mode: "stand", expr: "neutral" }, turn: ramp(t, 37.4, 38.9), yaw: 0.0, tint: [0.95, 1, 0.95] }],
  world: (t) => ({ light: "hall", tube: flicker(t, 1) }) });
// 16 "... and smiled."
add({ a: 39.95, b: 41.45, kind: "3d", view: "cctv", grade: "hall",
  cam: glide({ pos: [5.55, 2.32, -5.9], look: [1.45, 1.55, -4.55], fov: 16 }, { pos: [5.55, 2.32, -5.9], look: [1.45, 1.57, -4.55], fov: 12 }, 0),
  actors: (t) => [{ who: "double", pos: DOUBLE_HALL, opts: { mode: "stand", expr: t < 40.15 ? "neutral" : "creepy" }, tint: [0.95, 1, 0.95] }],
  world: (t) => ({ light: "hall", tube: flicker(t, 1.4) }) });
// 17 "Daniel dropped his phone." : the phone falls to the floor
add({ a: 41.45, b: 43.35, kind: "3d",
  cam: glide({ pos: [0.6, 0.75, -2.3], look: [1.4, 0.5, -3.5], fov: 50 }, { pos: [0.64, 0.72, -2.38], look: [1.4, 0.48, -3.5], fov: 48 }, 0.05),
  actors: (t) => [{ who: "daniel", pos: [1.45, 0, -3.6], opts: { mode: "stand", expr: "terror", prop: t < 41.9 ? "phoneHold" : "phoneDrop", glow: 1 }, tint: NIGHT }],
  world: (t) => {
    const k = clamp01((t - 41.9) / 0.42), y = t < 41.9 ? 0.95 : t < 42.32 ? 0.95 * (1 - k * k) : Math.max(0, 0.08 * Math.sin(Math.min(1, (t - 42.32) / 0.25) * Math.PI));
    return { light: "night", lampOn: true, phoneOn: 1, phoneAt: "floor", phoneFloorY: y, phoneFloorRot: t < 42.32 ? 4 * k : 0, tube: flicker(t, 0.5) };
  } });
// 18 "Then came another knock." : behind him
add({ a: 43.35, b: 45.05, kind: "3d",
  cam: glide({ pos: [0.9, 1.5, -1.6], look: [1.38, 1.3, -3.5], fov: 42 }, { pos: [0.95, 1.5, -1.85], look: [1.38, 1.32, -3.5], fov: 40 }, 0.06),
  actors: (t) => [{ who: "daniel", pos: D_DOOR, opts: { mode: "stand", expr: "terror", back: true, tilt: t < 44.3 ? 0 : -3 }, tint: NIGHT }],
  world: () => ({ light: "night", lampOn: true, phoneOn: 1, phoneAt: "floor" }) });
// 19 "This time from inside his bedroom." : the closed bedroom door
add({ a: 45.05, b: 47.85, kind: "3d",
  cam: glide({ pos: [-0.6, 1.45, 0.6], look: [-1.2, 1.1, 4.0], fov: 44 }, { pos: [-0.75, 1.42, 1.6], look: [-1.2, 1.1, 4.0], fov: 40 }, 0.04),
  world: () => ({ light: "night", lampOn: true, phoneOn: 1, phoneAt: "floor" }) });
// 20 "He slowly turned around."
add({ a: 47.85, b: 49.85, kind: "3d",
  cam: glide({ pos: [0.95, 1.55, -1.7], look: [1.38, 1.4, -3.5], fov: 38 }, { pos: [1.0, 1.55, -1.95], look: [1.38, 1.42, -3.5], fov: 36 }, 0.08),
  actors: (t) => [{ who: "daniel", pos: D_DOOR, opts: { mode: "stand", expr: "terror" }, turn: ramp(t, 48.3, 49.2), tint: NIGHT }],
  world: () => ({ light: "night", lampOn: true, phoneOn: 1, phoneAt: "floor" }) });
// 21 "His bedroom door opened by itself."
add({ a: 49.85, b: 52.35, kind: "3d",
  cam: glide({ pos: [-0.75, 1.4, 1.5], look: [-1.2, 1.1, 4.0], fov: 40 }, { pos: [-0.85, 1.4, 2.1], look: [-1.2, 1.1, 4.0], fov: 38 }, 0.04),
  world: (t) => ({ light: "night", lampOn: true, phoneOn: 1, phoneAt: "floor", bedDoor: 1.35 * ramp(t, 50.25, 51.9) + 0.04 * Math.sin(t * 9) * ramp(t, 50.25, 50.6) }) });
// 22 "And standing there was another Daniel."
add({ a: 52.35, b: 55.2, kind: "3d",
  cam: glide({ pos: [-0.95, 1.4, 1.9], look: [-1.2, 1.25, 4.4], fov: 40 }, { pos: [-1.05, 1.42, 2.55], look: [-1.2, 1.3, 4.4], fov: 38 }, 0.03),
  actors: (t) => [{ who: "double", pos: DOUBLE_BED, opts: { mode: "stand", expr: "neutral" }, tint: t < 54.15 ? [0.12, 0.12, 0.2] : NIGHT }],
  world: (t) => ({ light: "night", lampOn: t < 54.15 || t > 54.35, phoneOn: 1, phoneAt: "floor", bedDoor: 1.35 }) });
// 23 "The stranger looked at him and said ..."
add({ a: 55.2, b: 57.1, kind: "3d",
  cam: glide({ pos: [-1.18, 1.55, 3.0], look: [-1.2, 1.5, 4.45], fov: 38 }, { pos: [-1.18, 1.56, 3.2], look: [-1.2, 1.52, 4.45], fov: 34 }, 0.06),
  actors: () => [{ who: "double", pos: DOUBLE_BED, opts: { mode: "stand", expr: "creepy", headTilt: -6 }, tint: NIGHT }],
  world: () => ({ light: "night", lampOn: true, phoneOn: 1, phoneAt: "floor", bedDoor: 1.35 }) });
// 24 "You weren't supposed to answer the phone." : push into the grin, the lamp stutters
add({ a: 57.1, b: 60.0, kind: "3d",
  cam: glide({ pos: [-1.2, 1.5, 3.2], look: [-1.2, 1.48, 4.45], fov: 32 }, { pos: [-1.2, 1.5, 3.5], look: [-1.2, 1.47, 4.45], fov: 27 }, 0.1),
  actors: () => [{ who: "double", pos: DOUBLE_BED, opts: { mode: "stand", expr: "creepy", headTilt: -9 }, tint: NIGHT }],
  world: (t) => ({ light: "night", lampOn: t < 59.0 || flicker(t, 2) > 0.5, phoneOn: 1, phoneAt: "floor", bedDoor: 1.35 }) });
// 25 "Suddenly, all the lights went out."
add({ a: 60.0, b: 61.15, kind: "black" });
// 26 "The next morning, police entered Daniel's apartment."
add({ a: 61.15, b: 64.3, kind: "3d", grade: "day",
  cam: glide({ pos: [2.3, 1.6, 0.9], look: [1.1, 1.1, -3.8], fov: 46 }, { pos: [2.2, 1.58, 0.4], look: [1.1, 1.1, -3.8], fov: 44 }, 0.04),
  actors: (t) => {
    const w = ramp(t, 61.4, 63.6);
    return [
      { who: "cop1", pos: [L(1.15, 0.95, w), 0, L(-4.4, -2.6, w)], opts: { mode: "stroll", phase: t * 1.6, expr: "stern", blink: blinkAt(t, 5) }, tint: DAY },
      { who: "cop2", pos: [L(1.85, 2.05, w), 0, L(-5.3, -3.5, w)], opts: { mode: "stroll", phase: t * 1.6 + 0.3, expr: "neutral", blink: blinkAt(t, 6) }, tint: DAY },
    ];
  },
  world: () => ({ light: "day", phoneOn: 0, phoneAt: "floor", frontDoor: 1.4, bedDoor: 1.35 }) });
// 27 "There was no sign of a struggle. No broken doors. No missing belongings."
add({ a: 64.3, b: 68.75, kind: "3d", grade: "day",
  cam: glide({ pos: [1.6, 1.6, -1.2], look: [-2.6, 0.8, -1.4], fov: 46 }, { pos: [1.6, 1.6, 1.8], look: [-2.6, 0.8, 1.2], fov: 46 }, 0),
  actors: (t) => [{ who: "cop2", pos: [-0.6, 0, 2.6], opts: { mode: "stand", expr: "stern", blink: blinkAt(t, 6) }, tint: DAY }],
  world: () => ({ light: "day", phoneOn: 0, phoneAt: "floor", frontDoor: 1.4, bedDoor: 1.35 }) });
// 28 "Only a phone lying on the floor."
add({ a: 68.75, b: 70.55, kind: "3d", grade: "day",
  cam: glide({ pos: [1.8, 1.05, -2.6], look: [1.3, 0, -3.35], fov: 34 }, { pos: [1.7, 0.85, -2.8], look: [1.3, 0, -3.35], fov: 30 }, 0.05),
  world: () => ({ light: "day", phoneOn: 0, phoneAt: "floor", frontDoor: 1.4, bedDoor: 1.35 }) });
// 29 "The last call in its history was made at 2:17 AM. The caller's name ... Daniel."
add({ a: 70.55, b: 77.75, kind: "log" });
// 30-31 "According to the police report, Daniel had died three days earlier."
add({ a: 77.75, b: 82.4, kind: "report" });
// 32 tag: the officer's phone rings. Caller: Daniel.
add({ a: 82.4, b: DURATION, kind: "incoming" });

export const SHOTS = S;
export const shotAt = (t: number) => S.find((s) => t >= s.a && t < s.b) ?? S[S.length - 1];
/** impact shakes (seconds): knocks, phone hitting the floor, the bedroom knock, the stamp */
export const KICKS: [number, number][] = [[14.05, 1], [14.4, 1], [14.75, 1.2], [42.32, 0.5], [44.3, 1.3], [46.65, 0.6], [80.3, 1.4]];
export const kickAt = (t: number) => {
  let v = 0;
  for (const [k, a] of KICKS) { const df = Math.round((t - k) * FPS); if (df >= 0 && df < 7) v += a * (df % 2 ? -1 : 1) * (1 - df / 7); }
  return v;
};
export const camVec = (c: Cam) => ({ pos: new THREE.Vector3(...c.pos), look: new THREE.Vector3(...c.look) });
