// Shot plan for "The Man Who Sold His Shadow" (voice: Kokoro am_michael @0.97, line times in
// shorts/shadow/voice/lines.json). 96 s, 30 fps.
import { LightName, MACH, MX, BX, OX, TWX, PYX } from "./world";
import { FrontOpts, Outfit } from "../dead/toon";

export const FPS = 30;
export const DURATION = 96;
export const TOTAL = DURATION * FPS;

export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
/** shadow: [dx, dz, length] of a shadow laid on the ground from the actor's feet */
export type ActorDef = { who: string; pos: V3; opts: FrontOpts; tint?: V3; scale?: number; roll?: number; yaw?: number; shadow?: V3 };
export type WorldState = { light: LightName; police?: boolean; lid?: number; out?: number; machine?: number; screen?: number; steam?: boolean };
export type Overlay = { title?: number; flash?: number; screen?: number; black?: number };
export type Shot = { id: number; a: number; b: number; cam: (t: number, u: number) => Cam; actors?: (t: number) => ActorDef[]; world: (t: number) => WorldState; overlay?: (t: number) => Overlay };

const FAIR = "#f0c9a0", TAN = "#d9a679";
export const outfitOf = (who: string): Outfit => {
  const i = parseInt(who.replace(/^\D+/, "")) || 0;
  if (who === "hero") return { jacket: "#6a5040", pants: "#3a3a42", boots: "#2a1a10", hat: "hair", hair: "#3a2414", skin: FAIR, buttons: "#c9b89a" };
  if (who === "rich") return { jacket: "#efe6d2", pants: "#d9cfb9", boots: "#5a3a22", hat: "hair", hair: "#3a2414", skin: FAIR, buttons: "#c9a040", sash: "#a8202a" };
  if (who === "pj" || who === "shade" || who === "smile") return who === "pj" ? { jacket: "#3a5a8a", pants: "#3a5a8a", boots: "#7a5a3a", hat: "hair", hair: "#3a2414", skin: FAIR, buttons: "#e8e2d4" }
    : { jacket: "#0a0a0e", pants: "#0a0a0e", boots: "#0a0a0e", hat: "hair", hair: "#0a0a0e", skin: "#101016", buttons: "#0a0a0e" };
  if (who === "biz") return { jacket: "#141418", pants: "#141418", boots: "#0a0a0a", hat: "tophat", cap: "#101014", skin: "#e8ded4", moustache: "#1a1414", beard: "#1a1414", buttons: "#c9a040", sash: "#a0102a" };
  if (who.startsWith("cop")) return { jacket: "#1a2440", pants: "#141a30", boots: "#0a0a0e", hat: "peaked", cap: "#1a2440", buttons: "#d9d9e0", skin: [FAIR, TAN][i % 2], moustache: i % 2 ? "#2a1a14" : undefined, belt: "#0a0a0e" };
  return { jacket: "#5a5a60", pants: "#3a3a40", boots: "#2a2a2a", hat: "fedora", cap: "#3a3a40", skin: FAIR };
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const t = clamp01(x); return t * t * t * (t * (6 * t - 15) + 10); };
const L = (a: number, b: number, t: number) => a + (b - a) * t;
const LV = (a: V3, b: V3, t: number): V3 => [L(a[0], b[0], t), L(a[1], b[1], t), L(a[2], b[2], t)];
const glide = (A: Cam, B: Cam, push = 0.05) => (_t: number, u: number): Cam => {
  const s = smooth(u), pos = LV(A.pos, B.pos, s), look = LV(A.look, B.look, s);
  return { pos: LV(pos, look, push * u), look, fov: L(A.fov, B.fov, s), roll: L(A.roll ?? 0, B.roll ?? 0, s) };
};
export const ramp = (t: number, t0: number, t1: number) => smooth((t - t0) / (t1 - t0));
export const blinkAt = (t: number, seed: number) => {
  const f = Math.round(t * FPS), period = 40 + ((seed * 13) % 26), ph = (f + seed * 7) % period;
  return ph < 4 ? [0.5, 1, 1, 0.5][ph] : 0;
};
/** a ground shadow pointing away from a light at lp */
const shadowFrom = (lp: V3, p: V3, k = 1): V3 => { const dx = p[0] - lp[0], dz = p[2] - lp[2], d = Math.hypot(dx, dz) || 1; return [dx / d, dz / d, Math.min(4.5, (1.9 * d) / Math.max(1, lp[1] - 1.9)) * k]; };

const NIGHT: V3 = [0.78, 0.8, 1.0], LAMP: V3 = [1.05, 0.9, 0.72], CYAN: V3 = [0.75, 1.0, 1.05], DAY: V3 = [1, 0.97, 0.94], MOON: V3 = [0.55, 0.62, 0.9], OFFICE: V3 = [1.0, 0.92, 0.84], BLACK: V3 = [0.03, 0.03, 0.04];
const [MXX, , MZ] = MACH;
const LAMP1: V3 = [-4.6, 4.75, -14];
const SIT = 0.5, BED = 0.62;
export const KICK_T = [47.9, 59.45, 93.0];

const S: Shot[] = [];
const add = (s: Omit<Shot, "id">) => S.push({ id: S.length + 1, ...s });

// ================= SHOTS =================
// 1 "A man once sold his shadow for one million dollars." : the empty night street, a man walking under the lamps
const walkZ = (t: number) => -26 + 1.4 * t;
add({ a: 0, b: 3.85, cam: glide({ pos: [5, 9, 14], look: [-2, 1, -22], fov: 46 }, { pos: [4, 6.5, 8], look: [-2.5, 1, -20], fov: 44 }, 0),
  actors: (t) => { const p: V3 = [-3.2, 0, walkZ(t)]; return [{ who: "hero", pos: p, opts: { mode: "stroll", phase: t * 1.3, expr: "neutral" }, tint: LAMP, shadow: shadowFrom(LAMP1, p) }]; },
  world: () => ({ light: "night", steam: true }) });
// 2 "And the strangest part?"
add({ a: 3.85, b: 5.65, cam: glide({ pos: [-3.0, 1.75, -18.6], look: [-3.2, 1.7, -20.6], fov: 36 }, { pos: [-3.0, 1.74, -18.9], look: [-3.2, 1.7, -20.6], fov: 34 }, 0.04),
  actors: (t) => [{ who: "hero", pos: [-3.2, 0, -20.6], opts: { mode: "stand", expr: "worried", headTilt: 6, blink: blinkAt(t, 1) }, tint: LAMP }],
  world: () => ({ light: "night", steam: true }) });
// 3 "The shadow actually belonged to him." : looking down at his long shadow on the pavement
add({ a: 5.65, b: 8.1, cam: glide({ pos: [-1.2, 4.4, -12.4], look: [-3.3, 0.3, -17.6], fov: 50 }, { pos: [-1.4, 4.0, -12.9], look: [-3.3, 0.3, -17.6], fov: 48 }, 0),
  actors: () => { const p: V3 = [-3.4, 0, -16.4]; return [{ who: "hero", pos: p, opts: { mode: "stand", expr: "neutral", look: -0.4 }, tint: LAMP, shadow: shadowFrom(LAMP1, p, 1.3) }]; },
  world: () => ({ light: "night", steam: true }) });
// 4 "It started when a mysterious businessman approached him in an empty street, ..." : out of the fog
add({ a: 8.1, b: 11.3, cam: glide({ pos: [-1.6, 1.7, -9.5], look: [-2.6, 1.6, -40], fov: 40 }, { pos: [-1.7, 1.7, -10.5], look: [-2.8, 1.6, -40], fov: 38 }, 0),
  actors: (t) => { const h: V3 = [-2.3, 0, -13.4], b: V3 = [-3.4, 0, -40 + 6.5 * (t - 8.1)]; return [
    { who: "hero", pos: h, opts: { mode: "stand", back: true }, tint: LAMP, shadow: shadowFrom(LAMP1, h) },
    { who: "biz", pos: b, opts: { mode: "stroll", phase: t * 1.2, expr: "smile_closed" }, tint: NIGHT, shadow: shadowFrom([-4.6, 4.75, -32], b) }]; },
  world: () => ({ light: "night", steam: true }) });
// 5 "... and made him an offer." : under the lamp
add({ a: 11.3, b: 14.35, cam: glide({ pos: [1.6, 1.65, -11.2], look: [-3.6, 1.5, -14.5], fov: 40 }, { pos: [1.2, 1.65, -11.7], look: [-3.6, 1.5, -14.5], fov: 38 }, 0.03),
  actors: (t) => { const h: V3 = [-3.0, 0, -13.2], b: V3 = [-4.0, 0, -15.3]; return [
    { who: "hero", pos: h, opts: { mode: "stand", expr: "neutral", look: -0.6, blink: blinkAt(t, 1) }, tint: LAMP, shadow: shadowFrom(LAMP1, h) },
    { who: "biz", pos: b, opts: { mode: "stand", expr: "smile_closed", look: 0.6, wave: t > 12.3 ? 0.15 : undefined, blink: blinkAt(t, 5) }, tint: LAMP, shadow: shadowFrom(LAMP1, b) }]; },
  world: () => ({ light: "night", steam: true }) });
// 6 "One million dollars."
add({ a: 14.35, b: 16.1, cam: glide({ pos: [-2.8, 1.5, -12.3], look: [-4.0, 1.25, -15.3], fov: 40 }, { pos: [-2.9, 1.48, -12.7], look: [-4.0, 1.25, -15.3], fov: 38 }, 0.04),
  actors: (t) => [{ who: "biz", pos: [-4.0, 0, -15.3], opts: { mode: "stand", expr: "grin", prop: "moneyCase", blink: blinkAt(t, 5) }, tint: LAMP }],
  world: () => ({ light: "night", steam: true }) });
// 7 "All he had to do was stand under a strange machine for ten seconds." : the machine in the empty lot
add({ a: 16.1, b: 21.0, cam: glide({ pos: [9.8, 1.6, -29.2], look: [MXX, 2.4, MZ], fov: 46 }, { pos: [10.6, 4.2, -28.0], look: [MXX, 2.2, MZ], fov: 50 }, 0),
  actors: (t) => { const b: V3 = [12.6, 0, -33.4], h: V3 = [11.4, 0, -32.0]; return [
    { who: "biz", pos: b, opts: { mode: "stand", expr: "smile_closed", prop: t > 17 ? "point" : null, look: 0.5 }, tint: CYAN, shadow: [b[0] - MXX, b[2] - MZ, 2.2].map((v, i) => i < 2 ? v / Math.hypot(b[0] - MXX, b[2] - MZ) : v) as V3 },
    { who: "hero", pos: h, opts: { mode: "stand", expr: "neutral", back: t < 18.5 }, tint: CYAN, shadow: [h[0] - MXX, h[2] - MZ, 2.4].map((v, i) => i < 2 ? v / Math.hypot(h[0] - MXX, h[2] - MZ) : v) as V3 }]; },
  world: () => ({ light: "night" }) });
// 8 "The man laughed, thinking it was a joke."
add({ a: 21.0, b: 23.65, cam: glide({ pos: [11.0, 1.62, -29.6], look: [11.4, 1.55, -32.0], fov: 38 }, { pos: [11.05, 1.6, -29.9], look: [11.4, 1.55, -32.0], fov: 35 }, 0.04),
  actors: (t) => [{ who: "hero", pos: [11.4, 0, -32.0], opts: { mode: "stand", expr: "laugh", headTilt: Math.sin(t * 9) * 3 }, tint: CYAN }],
  world: () => ({ light: "night" }) });
// 9 "But when he stepped out of the machine, ..." : inside the booth, the flash
add({ a: 23.65, b: 25.4, cam: glide({ pos: [MXX, 1.9, MZ + 5.0], look: [MXX, 1.8, MZ], fov: 40 }, { pos: [MXX, 1.9, MZ + 4.4], look: [MXX, 1.8, MZ], fov: 38 }, 0.03),
  actors: (t) => [{ who: "hero", pos: [MXX, 0.6, MZ], opts: { mode: "stand", expr: t < 24.3 ? "nervous" : "shock" }, tint: CYAN }],
  world: (t) => ({ light: "night", machine: ramp(t, 24.0, 24.5) * (1 - ramp(t, 24.9, 25.4)) }), overlay: (t) => ({ flash: Math.max(0, 1 - Math.abs(t - 24.55) * 3.2) }) });
// 10 "... his shadow was gone." : he stands in the light with no shadow; the businessman still has his
add({ a: 25.4, b: 27.5, cam: glide({ pos: [14.0, 2.7, -27.8], look: [14.0, 0.7, -34.2], fov: 46 }, { pos: [14.0, 2.8, -28.1], look: [14.0, 0.6, -34.2], fov: 44 }, 0),
  actors: (t) => { const b: V3 = [12.9, 0, -34.6]; return [
    { who: "hero", pos: [15.0, 0, -33.4], opts: { mode: "stand", expr: "shock", look: -0.3, blink: blinkAt(t, 1) }, tint: CYAN },
    { who: "biz", pos: b, opts: { mode: "stand", expr: "smile_closed" }, tint: CYAN, shadow: [-0.79, 0.61, 2.8] }]; },
  world: () => ({ light: "night" }) });
// 11 "And the money was real."
add({ a: 27.5, b: 29.15, cam: glide({ pos: [14.6, 1.6, -31.0], look: [15.0, 1.45, -33.4], fov: 38 }, { pos: [14.65, 1.58, -31.3], look: [15.0, 1.45, -33.4], fov: 35 }, 0.04),
  actors: (t) => [{ who: "hero", pos: [15.0, 0, -33.4], opts: { mode: "stand", expr: t < 28.2 ? "shock" : "grin", prop: "moneyCase" }, tint: CYAN }],
  world: () => ({ light: "night" }) });
// 12 "At first, life was perfect." : the mansion
add({ a: 29.15, b: 31.25, cam: glide({ pos: [MX + 34, 10, 44], look: [MX, 6, -40], fov: 46 }, { pos: [MX + 26, 7, 34], look: [MX, 6, -40], fov: 46 }, 0),
  world: () => ({ light: "day" }) });
// 13 "He bought a mansion, expensive cars, ..." : by the cars
add({ a: 31.25, b: 32.95, cam: glide({ pos: [MX + 0.8, 1.7, -14.5], look: [MX, 1.6, -26], fov: 44 }, { pos: [MX + 0.6, 1.65, -15.3], look: [MX, 1.6, -26], fov: 42 }, 0.03),
  actors: (t) => [{ who: "rich", pos: [MX, 0, -21.5], opts: { mode: "stand", expr: "grin", wave: 0.3 + 0.2 * Math.sin(t * 5), blink: blinkAt(t, 2) }, tint: DAY, shadow: [0.3, 0.6, 1.4] }],
  world: () => ({ light: "day" }) });
// 14 "... and traveled around the world." : the tower, then the pyramids
add({ a: 32.95, b: 34.45, cam: glide({ pos: [TWX + 1.2, 1.5, 300], look: [TWX, 74, 0], fov: 60 }, { pos: [TWX + 1.2, 1.5, 299], look: [TWX, 76, 0], fov: 60 }, 0),
  actors: () => [{ who: "rich", pos: [TWX + 0.4, 0, 294], opts: { mode: "stand", expr: "smile", wave: 0.6 }, tint: DAY }], world: () => ({ light: "day" }) });
add({ a: 34.45, b: 36.0, cam: glide({ pos: [PYX + 1.6, 1.6, 7.5], look: [PYX - 10, 40, -260], fov: 56 }, { pos: [PYX + 1.6, 1.6, 6.8], look: [PYX - 10, 42, -260], fov: 56 }, 0),
  actors: () => [{ who: "rich", pos: [PYX + 0.9, 0, 1.5], opts: { mode: "stand", expr: "grin", prop: "point" }, tint: DAY }], world: () => ({ light: "desert" }) });
// 15 "But after a few days, something terrifying happened." : the mansion at night
add({ a: 36.0, b: 39.7, cam: glide({ pos: [MX + 18, 3.5, 26], look: [MX, 8, -40], fov: 46 }, { pos: [MX + 13, 3.2, 18], look: [MX, 8.5, -40], fov: 44 }, 0),
  world: () => ({ light: "night" }) });
// 16 "Every night, he noticed a dark figure standing outside his bedroom window." : from the bed toward the window
add({ a: 39.7, b: 42.7, cam: glide({ pos: [BX + 0.9, 2.1, 4.5], look: [BX, 1.8, -5], fov: 46 }, { pos: [BX + 0.8, 2.05, 4.0], look: [BX, 1.85, -5], fov: 44 }, 0.03),
  actors: (t) => [{ who: "pj", pos: [BX, BED, 3.1], opts: { mode: "sit", back: true }, tint: MOON },
    { who: "shade", pos: [BX, 0.45, -4.97], opts: { mode: "stand", expr: "neutral" }, tint: BLACK, scale: 1.0 + 0 * t }],
  world: () => ({ light: "bedroom" }) });
// 16b closer on the window
add({ a: 42.7, b: 45.3, cam: glide({ pos: [BX + 0.4, 1.9, -0.8], look: [BX, 1.95, -5], fov: 40 }, { pos: [BX + 0.3, 1.92, -1.6], look: [BX, 1.98, -5], fov: 38 }, 0.03),
  actors: () => [{ who: "shade", pos: [BX, 0.45, -4.97], opts: { mode: "stand", expr: "neutral" }, tint: BLACK }], world: () => ({ light: "bedroom" }) });
// 17 "It looked exactly like him." : his face, then the figure
add({ a: 45.3, b: 46.4, cam: glide({ pos: [BX, 1.62, 1.3], look: [BX, 1.62, 3.1], fov: 36 }, { pos: [BX, 1.62, 1.45], look: [BX, 1.62, 3.1], fov: 34 }, 0.04),
  actors: (t) => [{ who: "pj", pos: [BX, BED, 3.1], opts: { mode: "sit", expr: "terror", blink: blinkAt(t, 1) }, tint: MOON }], world: () => ({ light: "bedroom" }) });
add({ a: 46.4, b: 47.3, cam: glide({ pos: [BX, 2.2, -3.0], look: [BX, 2.1, -5], fov: 40 }, { pos: [BX, 2.2, -3.2], look: [BX, 2.1, -5], fov: 38 }, 0.04),
  actors: () => [{ who: "shade", pos: [BX, 0.45, -4.97], opts: { mode: "stand", expr: "neutral" }, tint: BLACK }], world: () => ({ light: "bedroom" }) });
// 18 "Except it had no face."
add({ a: 47.3, b: 49.15, cam: glide({ pos: [BX, 2.42, -4.0], look: [BX, 2.42, -5], fov: 40 }, { pos: [BX, 2.42, -4.15], look: [BX, 2.42, -5], fov: 36 }, 0.03),
  actors: () => [{ who: "shade", pos: [BX, 0.45, -4.97], opts: { mode: "stand", expr: "neutral" }, tint: BLACK }], world: () => ({ light: "bedroom" }) });
// 19 "He called the police, but whenever they arrived, the figure disappeared." : flashing lights on the lawn
add({ a: 49.15, b: 53.75, cam: glide({ pos: [MX + 4.6, 1.75, 13.6], look: [MX + 0.6, 1.5, 6.4], fov: 46 }, { pos: [MX + 4.2, 1.72, 12.8], look: [MX + 0.6, 1.5, 6.4], fov: 44 }, 0),
  actors: (t) => [
    { who: "cop0", pos: [MX + 0.8, 0, 6.0], opts: { mode: "stand", expr: "neutral", look: t < 51 ? -0.7 : 0.7, blink: blinkAt(t, 3) }, tint: NIGHT },
    { who: "cop1", pos: [MX - 1.8, 0, 7.4], opts: { mode: "stand", expr: "dazed", look: 0.5, blink: blinkAt(t, 4) }, tint: NIGHT },
    { who: "pj", pos: [MX + 3.0, 0, 6.6], opts: { mode: "stand", expr: "worried", prop: "point", blink: blinkAt(t, 1) }, tint: NIGHT }],
  world: () => ({ light: "night", police: true }) });
// 20 "One night, he finally saw it clearly." : he wakes
add({ a: 53.75, b: 56.2, cam: glide({ pos: [BX, 1.62, 1.6], look: [BX, 1.6, 3.1], fov: 40 }, { pos: [BX, 1.62, 1.8], look: [BX, 1.6, 3.1], fov: 36 }, 0.03),
  actors: (t) => [{ who: "pj", pos: [BX, BED, 3.1], opts: { mode: "sit", expr: t < 54.9 ? "asleep" : "shock" }, tint: MOON }], world: () => ({ light: "bedroom" }) });
// 21 "His shadow was standing inside his bedroom." : at the foot of the bed
add({ a: 56.2, b: 59.3, cam: glide({ pos: [BX + 0.7, 2.0, 4.4], look: [BX - 0.3, 1.3, -0.6], fov: 46 }, { pos: [BX + 0.6, 1.95, 4.0], look: [BX - 0.3, 1.35, -0.6], fov: 42 }, 0.03),
  actors: () => [{ who: "pj", pos: [BX + 0.1, BED, 3.1], opts: { mode: "sit", back: true }, tint: MOON }, { who: "shade", pos: [BX - 0.3, 0, -0.6], opts: { mode: "stand", expr: "neutral" }, tint: BLACK }],
  world: () => ({ light: "bedroom" }) });
// 22 "And it was smiling."
add({ a: 59.3, b: 60.75, cam: glide({ pos: [BX - 0.3, 1.78, 1.1], look: [BX - 0.3, 1.72, -0.6], fov: 36 }, { pos: [BX - 0.3, 1.78, 0.95], look: [BX - 0.3, 1.72, -0.6], fov: 32 }, 0.04),
  actors: () => [{ who: "smile", pos: [BX - 0.3, 0, -0.6], opts: { mode: "stand", expr: "creepy" }, tint: [0.7, 0.72, 0.85] }], world: () => ({ light: "bedroom" }) });
// 23 "The next morning, he tracked down the businessman, and demanded his shadow back."
add({ a: 60.75, b: 65.95, cam: glide({ pos: [OX + 3.4, 1.8, 3.6], look: [OX - 0.2, 1.2, -2.6], fov: 46 }, { pos: [OX + 3.0, 1.75, 3.0], look: [OX - 0.2, 1.2, -2.6], fov: 44 }, 0.03),
  actors: (t) => [{ who: "rich", pos: [OX + 0.5, 0, Math.max(-0.6, 3.4 - 2.4 * (t - 60.75))], opts: t < 62.4 ? { mode: "march", phase: t * 1.8, expr: "stern" } : { mode: "stand", expr: "stern", prop: t > 63.2 ? "point" : null, blink: blinkAt(t, 1) }, tint: OFFICE },
    { who: "biz", pos: [OX, SIT, -4.3], opts: { mode: "sit", expr: "smile_closed", blink: blinkAt(t, 5) }, tint: OFFICE }],
  world: () => ({ light: "office" }) });
// 24 "But the businessman simply opened a laptop."
add({ a: 65.95, b: 69.3, cam: glide({ pos: [OX + 0.25, 1.3, -1.6], look: [OX, 1.0, -3.1], fov: 42 }, { pos: [OX + 0.2, 1.25, -1.9], look: [OX, 1.0, -3.1], fov: 40 }, 0.03),
  actors: (t) => [{ who: "biz", pos: [OX, SIT, -4.3], opts: { mode: "sit", expr: "smile_closed", blink: blinkAt(t, 5) }, tint: OFFICE }],
  world: (t) => ({ light: "office", lid: ramp(t, 66.4, 67.6), screen: t > 67.7 ? 1 : 0 }) });
// 25 "On the screen was a video of the machine. And inside it, the man's shadow was moving, on its own." : the screen
add({ a: 69.3, b: 76.2, cam: glide({ pos: [OX, 1.2, -2.0], look: [OX, 1.0, -3.1], fov: 40 }, { pos: [OX, 1.2, -2.0], look: [OX, 1.0, -3.1], fov: 40 }, 0),
  world: () => ({ light: "office", lid: 1, screen: 1 }), overlay: (t) => ({ screen: ramp(t, 69.3, 69.6) }) });
// 26 "Then the businessman said something terrifying."
add({ a: 76.2, b: 79.4, cam: glide({ pos: [OX + 0.1, 1.55, -2.3], look: [OX, 1.45, -4.3], fov: 40 }, { pos: [OX + 0.08, 1.55, -2.6], look: [OX, 1.45, -4.3], fov: 36 }, 0.04),
  actors: (t) => [{ who: "biz", pos: [OX, SIT, -4.3], opts: { mode: "sit", expr: t < 77.6 ? "smile_closed" : "grin", blink: blinkAt(t, 5) }, tint: [0.8, 0.95, 1.05] }],
  world: () => ({ light: "office", lid: 1, screen: 1, out: 0.45 }) });
// 27 "You didn't sell your shadow. You sold the only thing that was keeping your other self trapped."
add({ a: 79.4, b: 82.6, cam: glide({ pos: [OX + 0.06, 1.58, -2.8], look: [OX, 1.5, -4.3], fov: 34 }, { pos: [OX + 0.05, 1.58, -3.0], look: [OX, 1.5, -4.3], fov: 30 }, 0.04),
  actors: (t) => [{ who: "biz", pos: [OX, SIT, -4.3], opts: { mode: "sit", expr: t < 81.2 ? "grin" : "creepy" }, tint: [0.8, 0.95, 1.05] }],
  world: () => ({ light: "office", lid: 1, screen: 1, out: 0.55 }) });
add({ a: 82.6, b: 85.2, cam: glide({ pos: [OX + 0.45, 1.78, -2.1], look: [OX + 0.5, 1.72, -0.6], fov: 38 }, { pos: [OX + 0.45, 1.78, -1.85], look: [OX + 0.5, 1.72, -0.6], fov: 34 }, 0.04),
  actors: (t) => [{ who: "rich", pos: [OX + 0.5, 0, -0.6], opts: { mode: "stand", expr: "terror", blink: blinkAt(t, 1) }, tint: [0.8, 0.9, 1.0] }],
  world: () => ({ light: "office", lid: 1, screen: 1, out: 0.55 }) });
// 28 "Suddenly, every light in the room went out." : the office, flicker, darkness
const flick = (t: number) => (t < 85.6 ? 0.55 : t < 86.6 ? (Math.floor(t * 14) % 3 === 0 ? 1 : 0.5) : 1);
add({ a: 85.2, b: 88.25, cam: glide({ pos: [OX + 4.6, 2.6, 4.6], look: [OX, 1.2, -2.5], fov: 50 }, { pos: [OX + 4.3, 2.5, 4.2], look: [OX, 1.2, -2.5], fov: 50 }, 0),
  actors: (t) => [{ who: "rich", pos: [OX + 0.5, 0, -0.6], opts: { mode: "stand", expr: "terror" }, tint: t > 86.6 ? [0.3, 0.34, 0.5] : OFFICE }, { who: "biz", pos: [OX, SIT, -4.3], opts: { mode: "sit", expr: "creepy" }, tint: t > 86.6 ? [0.3, 0.34, 0.5] : OFFICE }],
  world: (t) => ({ light: t > 86.6 ? "dark" : "office", lid: 1, screen: 1, out: flick(t) }) });
// 29 "And from behind him, a familiar voice whispered..." : his face in the dark; behind him, it rises
add({ a: 88.25, b: 91.85, cam: glide({ pos: [OX + 0.42, 1.8, -2.3], look: [OX + 0.6, 1.8, -0.6], fov: 44 }, { pos: [OX + 0.42, 1.8, -2.0], look: [OX + 0.6, 1.8, -0.6], fov: 40 }, 0.03),
  actors: (t) => [{ who: "rich", pos: [OX + 0.45, 0, -0.6], opts: { mode: "stand", expr: "terror", blink: blinkAt(t, 1) }, tint: [0.42, 0.55, 0.7] },
    { who: "smile", pos: [OX + 1.1, -0.6 + 0.6 * ramp(t, 88.6, 90.6), 0.5], opts: { mode: "stand", expr: "creepy" }, tint: [0.32, 0.34, 0.42].map((v) => v * ramp(t, 88.6, 90.6)) as V3 }],
  world: () => ({ light: "dark", lid: 1, screen: 1, out: 1 }) });
// 30 "Finally. My turn."
add({ a: 91.85, b: DURATION, cam: glide({ pos: [OX + 0.85, 1.85, -1.3], look: [OX + 1.05, 1.82, 0.5], fov: 36 }, { pos: [OX + 0.85, 1.85, -1.05], look: [OX + 1.05, 1.82, 0.5], fov: 32 }, 0.05),
  actors: () => [{ who: "rich", pos: [OX + 0.45, 0, -0.6], opts: { mode: "stand", expr: "terror" }, tint: [0.38, 0.5, 0.65] }, { who: "smile", pos: [OX + 1.1, 0, 0.5], opts: { mode: "stand", expr: "creepy" }, tint: [0.36, 0.38, 0.48] }],
  world: () => ({ light: "dark", lid: 1, screen: 1, out: 1 }), overlay: (t) => ({ black: t > 93.25 ? 1 : 0 }) });

export const SHOTS = S;
export const shotAt = (t: number) => S.find((s) => t >= s.a && t < s.b) ?? S[S.length - 1];
export const KICKS: [number, number][] = [[24.55, 1.2], [47.9, 1.0], [59.45, 1.2], [86.6, 0.8], [93.0, 1.4]];
export const kickAt = (t: number) => {
  let v = 0;
  for (const [k, a] of KICKS) { const df = Math.round((t - k) * FPS); if (df >= 0 && df < 7) v += a * (df % 2 ? -1 : 1) * (1 - df / 7); }
  return v;
};
