// Shot plan for "The Jar That Could Predict a War" (voice: Kokoro am_michael @0.97, line times in
// shorts/jar/voice/lines.json). 78 s, 30 fps.
import { LightName, THRONE_X } from "./world";
import { FrontOpts, Outfit } from "../dead/toon";

export const FPS = 30;
export const DURATION = 78;
export const TOTAL = DURATION * FPS;

export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
export type ActorDef = { who: string; pos: V3; opts: FrontOpts; tint?: V3; scale?: number; roll?: number; yaw?: number };
export type WorldState = { light: LightName; flash?: number; jarStage?: number; jarSince?: number; jarGlow?: number; jarShake?: number; dayCycle?: number; dust?: number; camp?: boolean };
export type Shot = { id: number; a: number; b: number; cam: (t: number, u: number) => Cam; actors?: (t: number) => ActorDef[]; world: (t: number) => WorldState; flash?: (t: number) => number };

const FAIR = "#f0c9a0", TAN = "#d9a679", DARK = "#a8754f";
export const outfitOf = (who: string): Outfit => {
  const i = parseInt(who.replace(/^\D+/, "")) || 0;
  if (who === "king") return { jacket: "#6a1b9a", pants: "#4a1a6a", dress: "#6a1b9a", boots: "#3a2418", hat: "crownEU", hair: "#6a4a32", beard: "#6a4a32", skin: FAIR, build: "stout", buttons: "#f2c14e", sash: "#e8b84a" };
  if (who.startsWith("g")) return { jacket: "#9aa3ad", pants: "#4a3a2a", boots: "#2a2420", hat: "helmK", cap: ["#d1202f", "#f2c14e", "#2a4a8a"][i % 3], moustache: "#3a2a1a", beard: i % 2 ? "#3a2a1a" : undefined, skin: [FAIR, TAN, DARK][i % 3], build: "stout", sash: "#2a4a8a" };
  if (who.startsWith("e")) return { jacket: "#8a2a2a", pants: "#3a2a2a", boots: "#1a1414", hat: "helmK", skin: [TAN, FAIR, DARK][i % 3], belt: "#3a2a1a" };
  return { jacket: "#2a4a8a", pants: "#4a4a52", boots: "#2a2420", hat: "helmK", skin: [FAIR, TAN, DARK][i % 3], belt: "#6a4a2a" };
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

// key times (s) from lines.json
export const CRACK1 = 12.3, CRACK2 = 20.5, ONCE = 36.35, TWICE = 37.8, SHATTER = 39.45;
const stageAt = (t: number) => (t < CRACK1 ? 0 : t < CRACK2 ? 1 : t < ONCE ? 2 : t < TWICE ? 3 : 4);
const sinceAt = (t: number) => (t < SHATTER ? -1 : t - SHATTER);

const X = THRONE_X;
const DAY: V3 = [1, 0.97, 0.94], TORCH: V3 = [1.0, 0.82, 0.62], NIGHT: V3 = [0.62, 0.66, 0.9], GOLD: V3 = [1.05, 0.92, 0.8], DAWN: V3 = [1.0, 0.88, 0.86];
const KING_THRONE: V3 = [X, 2.1, -17.0];
const BALC: V3 = [0, 7.0, -19.2];

const S: Shot[] = [];
const add = (s: Omit<Shot, "id">) => S.push({ id: S.length + 1, ...s });

// ---------------- crowds ----------------
/** enemy soldiers around the camp fires (night) */
const campCrowd = (t: number): ActorDef[] => Array.from({ length: 12 }, (_, i) => ({
  who: "e" + i, pos: [-300 + (i % 6) * 1.6 - 4 + (i % 2) * 0.4, 0, -384 - Math.floor(i / 6) * 3.5 - (i % 3) * 0.6] as V3, tint: TORCH,
  opts: { mode: i % 3 === 0 ? "march" : "stand", phase: t * 1.6 + i * 0.2, expr: (["stern", "grin", "neutral"] as const)[i % 3], prop: i % 2 ? "spear" : null } as FrontOpts,
}));
/** enemy column marching through the pass toward the border (dir +x,+z) */
const enemyColumn = (t: number, prog: number): ActorDef[] => {
  const out: ActorDef[] = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 3; c++) {
    const along = prog * 14 - r * 3.0, side = (c - 1) * 1.7;
    out.push({ who: "e" + (r * 3 + c), pos: [-128 + along * 0.7071 + side * 0.7071, 0, -118 + along * 0.7071 - side * 0.7071], tint: DAWN,
      opts: { mode: "march", phase: t * 1.8 + (r % 2) * 0.5, expr: "stern", prop: "spear" } });
  }
  return out;
};
/** the king's soldiers lined behind the border wall, backs to us */
const borderLine = (): ActorDef[] => Array.from({ length: 14 }, (_, i) => {
  const along = -9 + i * 1.4, back = 3.2 + (i % 2) * 1.6;
  return { who: "s" + i, pos: [-260 + along * 0.7071 + back * 0.7071, 0, -260 - along * 0.7071 + back * 0.7071] as V3, tint: DAY, opts: { mode: "stand", expr: "stern", prop: "spear", back: true } as FrontOpts };
});
/** soldiers marching into formation in the courtyard (night, torches) */
const courtyardMarch = (t: number): ActorDef[] => {
  const out: ActorDef[] = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) out.push({ who: "s" + (r * 6 + c), pos: [-6.25 + c * 2.5, 0, 6 - r * 2.6 - Math.min(3, (t - 43) * 1.2)], tint: TORCH, opts: { mode: "march", phase: t * 1.8 + (r % 2) * 0.5, expr: "stern", prop: "spear" } });
  return out;
};
/** the rebellion: a ring of soldiers around the courtyard aiming up at the balcony, generals in front */
const ring = (aimUp: boolean, tint: V3, back: boolean): ActorDef[] => {
  const out: ActorDef[] = [];
  for (let i = 0; i < 26; i++) { // a crescent of soldiers in the middle of the courtyard, facing the keep
    const a = Math.PI * (0.12 + 0.76 * (i / 25)), r = 7 + (i % 2) * 2.6;
    out.push({ who: "s" + i, pos: [Math.cos(a) * r * 1.3, 0, -14 + Math.sin(a) * r * 1.2], tint, opts: { mode: "stand", expr: "stern", prop: aimUp ? "spearUp" : "spear", back } });
  }
  for (const [k, x] of [[0, -2.4], [1, 0], [2, 2.4]] as const) out.push({ who: "g" + k, pos: [x, 0, -8.5 - (k === 1 ? 1 : 0)], tint, opts: { mode: "stand", expr: "stern", back, prop: aimUp ? "spearUp" : null } });
  return out;
};

// ================= SHOTS =================
// 1 "An ancient king owned a jar that could predict wars."
add({ a: 0, b: 4.15, cam: glide({ pos: [70, 46, 170], look: [0, 12, -10], fov: 46 }, { pos: [34, 22, 86], look: [0, 10, -14], fov: 44 }, 0), world: () => ({ light: "golden", camp: false }) });
// 2 "Nobody knew where it came from." : the jar, faint glow, dust in the light
add({ a: 4.15, b: 6.6, cam: glide({ pos: [X + 5.4, 2.6, -10.0], look: [X + 3, 2.2, -11.4], fov: 34 }, { pos: [X + 4.4, 2.5, -9.6], look: [X + 3, 2.25, -11.4], fov: 32 }, 0.05),
  world: () => ({ light: "interior", jarGlow: 0.55, dust: 1 }) });
// 3 "But whenever an enemy army was preparing to attack ..." : the enemy camp at night
add({ a: 6.6, b: 10.2, cam: glide({ pos: [-297, 3.2, -373], look: [-300, 2.0, -400], fov: 46 }, { pos: [-298, 3.0, -376], look: [-301, 2.0, -402], fov: 44 }, 0),
  actors: (t) => campCrowd(t), world: () => ({ light: "night", camp: true }) });
// 4 "... the jar would make a strange cracking sound." : first crack
add({ a: 10.2, b: 13.3, cam: glide({ pos: [X + 5.0, 2.5, -8.6], look: [X + 3, 2.15, -11.4], fov: 34 }, { pos: [X + 4.6, 2.45, -9.2], look: [X + 3, 2.15, -11.4], fov: 30 }, 0.04),
  world: (t) => ({ light: "interiorNight", jarStage: stageAt(t), jarGlow: 0.4 + 0.5 * ramp(t, 11.8, 12.3) * (1 - ramp(t, 12.6, 13.3)), jarShake: t > CRACK1 && t < CRACK1 + 0.25 ? 0.012 : 0, dust: 1 }) });
// 5 "The first time it happened, the king ignored it."
add({ a: 13.3, b: 16.6, cam: glide({ pos: [X + 1.4, 3.0, -8.8], look: [X + 1.2, 2.7, -16.5], fov: 44 }, { pos: [X + 1.3, 2.95, -9.6], look: [X + 1.2, 2.75, -16.5], fov: 42 }, 0.04),
  actors: (t) => [{ who: "king", pos: KING_THRONE, opts: { mode: "sit", expr: t < 14.6 ? "neutral" : "smile_closed", wave: t > 14.4 && t < 15.6 ? 0.2 : undefined, blink: blinkAt(t, 1) }, tint: DAY }],
  world: (t) => ({ light: "interior", jarStage: stageAt(t), jarGlow: 0.3, dust: 1 }) });
// 6 "Three days later, an army invaded his kingdom."
add({ a: 16.6, b: 20.15, cam: glide({ pos: [-104, 4.5, -98], look: [-130, 2, -122], fov: 46 }, { pos: [-106, 4.2, -100], look: [-130, 2.2, -122], fov: 44 }, 0),
  actors: (t) => enemyColumn(t, ramp(t, 16.6, 20.15)), world: () => ({ light: "dawn", camp: false }) });
// 7 "The second time, he listened."
add({ a: 20.15, b: 22.1, cam: glide({ pos: [X + 4.6, 2.1, -6.6], look: [X + 2.7, 1.9, -10.9], fov: 38 }, { pos: [X + 4.3, 2.05, -7.2], look: [X + 2.7, 1.9, -10.9], fov: 35 }, 0.05),
  actors: () => [{ who: "king", pos: [X + 2.1, 0, -10.6], opts: { mode: "stand", expr: "worried", prop: "earCup", look: 0.6 }, tint: DAY }],
  world: (t) => ({ light: "interior", jarStage: stageAt(t), jarGlow: 0.3 + 0.5 * ramp(t, 20.2, 20.5), jarShake: t > CRACK2 && t < CRACK2 + 0.25 ? 0.012 : 0, dust: 1 }) });
// 8 "He moved his soldiers to the border, and his kingdom survived."
add({ a: 22.1, b: 26.2, cam: glide({ pos: [-248.5, 3.8, -248.5], look: [-268, 3, -268], fov: 46 }, { pos: [-249.5, 5.0, -249.5], look: [-272, 3, -272], fov: 46 }, 0),
  actors: () => borderLine(), world: () => ({ light: "day", camp: false }) });
// 9 "Soon, the king began trusting the jar more than his own generals."
add({ a: 26.2, b: 30.5, cam: glide({ pos: [X - 3.6, 2.2, 4.8], look: [X - 2.7, 1.6, -6], fov: 46 }, { pos: [X - 3.4, 2.15, 4.0], look: [X - 2.6, 1.6, -6], fov: 44 }, 0.03),
  actors: (t) => [
    { who: "g0", pos: [X - 4.0, 0, -2.0], opts: { mode: "stand", expr: t < 28.5 ? "neutral" : "stern", prop: "point", blink: blinkAt(t, 3) }, tint: DAY },
    { who: "g1", pos: [X - 4.6, 0, -4.2], opts: { mode: "stand", expr: "stern", blink: blinkAt(t, 4) }, tint: DAY },
    { who: "king", pos: [X - 1.4 + 1.4 * ramp(t, 26.5, 29.5), 0, -9.5], opts: { mode: "stand", expr: "smile_closed", back: t > 27.6 } , tint: DAY },
  ],
  world: (t) => ({ light: "interior", jarStage: stageAt(t), jarGlow: 0.3, dust: 1 }) });
// 10 "But one night, something terrifying happened." : storm over the castle
add({ a: 30.5, b: 33.85, cam: glide({ pos: [46, 12, 78], look: [0, 16, -18], fov: 46 }, { pos: [40, 11, 70], look: [0, 16, -18], fov: 44 }, 0),
  world: (t) => ({ light: "storm", flash: Math.max(0, 1 - Math.abs(t - 31.25) * 8) + Math.max(0, 1 - Math.abs(t - 32.7) * 9) }),
  flash: (t) => Math.max(0, 1 - Math.abs(t - 31.25) * 8) * 0.8 + Math.max(0, 1 - Math.abs(t - 32.7) * 9) * 0.6 });
// 11 "The jar started cracking."
add({ a: 33.85, b: 36.2, cam: glide({ pos: [X + 5.2, 2.6, -8.2], look: [X + 3, 2.15, -11.4], fov: 34 }, { pos: [X + 4.8, 2.5, -8.8], look: [X + 3, 2.15, -11.4], fov: 30 }, 0.05),
  world: (t) => ({ light: "interiorNight", jarStage: stageAt(t), jarGlow: 0.5 + 0.3 * Math.sin(t * 9), jarShake: 0.004 + 0.006 * ramp(t, 34, 36), dust: 1 }) });
// 12 "Once."
add({ a: 36.2, b: 37.7, cam: glide({ pos: [X + 4.5, 2.4, -9.3], look: [X + 3, 2.2, -11.4], fov: 30 }, { pos: [X + 4.4, 2.38, -9.5], look: [X + 3, 2.2, -11.4], fov: 28 }, 0.05),
  world: (t) => ({ light: "interiorNight", jarStage: stageAt(t), jarGlow: 0.6 + 0.6 * Math.max(0, 1 - Math.abs(t - ONCE) * 4), jarShake: t > ONCE && t < ONCE + 0.3 ? 0.02 : 0.004, dust: 1 }) });
// 13 "Twice."
add({ a: 37.7, b: 38.55, cam: glide({ pos: [X + 4.2, 2.2, -9.9], look: [X + 3, 2.15, -11.4], fov: 30 }, { pos: [X + 4.1, 2.2, -10.0], look: [X + 3, 2.15, -11.4], fov: 26 }, 0.05),
  world: (t) => ({ light: "interiorNight", jarStage: stageAt(t), jarGlow: 0.6 + 0.8 * Math.max(0, 1 - Math.abs(t - TWICE) * 4), jarShake: t > TWICE && t < TWICE + 0.3 ? 0.025 : 0.006, dust: 1 }) });
// 13b the king's face
add({ a: 38.55, b: 39.25, cam: glide({ pos: [X, 3.55, -14.4], look: [X, 3.45, -17.0], fov: 32 }, { pos: [X, 3.55, -14.7], look: [X, 3.45, -17.0], fov: 30 }, 0.05),
  actors: () => [{ who: "king", pos: KING_THRONE, opts: { mode: "sit", expr: "terror" }, tint: TORCH }],
  world: (t) => ({ light: "interiorNight", jarStage: stageAt(t), dust: 1 }) });
// 14 "Then it shattered."
add({ a: 39.25, b: 41.1, cam: glide({ pos: [X + 6.4, 2.4, -9.0], look: [X + 3, 1.6, -11.4], fov: 44 }, { pos: [X + 6.8, 2.6, -8.6], look: [X + 3, 1.4, -11.4], fov: 46 }, 0),
  world: (t) => ({ light: "interiorNight", jarStage: 4, jarSince: sinceAt(t), jarGlow: t < SHATTER ? 1 : Math.max(0, 1 - (t - SHATTER) * 2), jarShake: t < SHATTER ? 0.01 : 0, dust: 1 }),
  flash: (t) => Math.max(0, 1 - Math.abs(t - SHATTER) * 7) * 0.5 });
// 15 "The king immediately ordered his entire army to prepare for war." : the balcony, then the courtyard filling
add({ a: 41.1, b: 43.0, cam: glide({ pos: [0.9, 8.9, -13.8], look: [0, 8.7, -19], fov: 34 }, { pos: [0.8, 8.9, -14.3], look: [0, 8.7, -19], fov: 32 }, 0.04),
  actors: (t) => [{ who: "king", pos: BALC, opts: { mode: "stand", expr: "stern", prop: t > 41.4 ? "point" : null }, tint: [1.15, 0.95, 0.75] }],
  world: () => ({ light: "night", jarStage: 4, jarSince: 10 }) });
add({ a: 43.0, b: 45.6, cam: glide({ pos: [0, 6.0, -15.5], look: [0, 1.0, 0], fov: 50 }, { pos: [0, 6.3, -15.0], look: [0, 1.0, -1], fov: 50 }, 0),
  actors: (t) => courtyardMarch(t), world: () => ({ light: "night", jarStage: 4, jarSince: 10 }) });
// 16 "But there was no enemy." : the pass at dawn, empty
add({ a: 45.6, b: 47.3, cam: glide({ pos: [-252, 10.5, -252], look: [-300, 4, -300], fov: 46 }, { pos: [-253, 10.5, -253], look: [-302, 4, -298], fov: 44 }, 0),
  actors: () => borderLine().slice(4, 10), world: () => ({ light: "dawn", camp: false }) });
// 17 "No army." : the lookout on the watchtower
add({ a: 47.3, b: 48.95, cam: glide({ pos: [-266.5, 19.4, -242.5], look: [-272.6, 19.0, -248.2], fov: 38 }, { pos: [-267.0, 19.4, -243.0], look: [-272.6, 19.05, -248.2], fov: 34 }, 0.05),
  actors: (t) => [{ who: "s20", pos: [-272.4, 17.8, -248.0], opts: { mode: "stand", expr: "worried", look: t < 48 ? -0.8 : 0.8, prop: "spear" }, tint: DAWN }],
  world: () => ({ light: "dawn", camp: false }) });
// 18 "No approaching soldiers." : high over the empty valley
add({ a: 48.95, b: 51.3, cam: glide({ pos: [-200, 60, -190], look: [-330, 0, -320], fov: 50 }, { pos: [-215, 62, -205], look: [-345, 0, -335], fov: 50 }, 0), world: () => ({ light: "dawn", camp: false }) });
// 19 "Days passed. Then weeks." : time-lapse around the castle
add({ a: 51.3, b: 54.95, cam: (t) => { const a = 0.6 + (t - 51.3) * 0.22, r = 92; return { pos: [Math.sin(a) * r, 34, Math.cos(a) * r], look: [0, 8, -8], fov: 46 }; },
  world: (t) => ({ light: "day", dayCycle: (t - 51.3) * (t < 53.1 ? 0.9 : 2.2), camp: false }) });
// 20 "And nothing happened." : the king, bored, the shards on the floor
add({ a: 54.95, b: 56.9, cam: glide({ pos: [X + 1.0, 3.0, -9.0], look: [X + 0.9, 2.5, -16.5], fov: 44 }, { pos: [X + 0.9, 2.95, -9.8], look: [X + 0.9, 2.5, -16.5], fov: 42 }, 0.04),
  actors: (t) => [{ who: "king", pos: KING_THRONE, opts: { mode: "sit", expr: "dazed", headTilt: 10, blink: blinkAt(t, 1) }, tint: DAY }],
  world: () => ({ light: "interior", jarStage: 4, jarSince: 20, dust: 1 }) });
// 21 "Until one morning, the king looked into his own castle courtyard."
add({ a: 56.9, b: 61.2, cam: glide({ pos: [0.6, 10.4, -20.5], look: [0, 3, -8], fov: 48 }, { pos: [0.55, 10.6, -20.4], look: [0, 1.0, -6], fov: 52 }, 0),
  actors: () => [{ who: "king", pos: [0, 7.0, -19.0], opts: { mode: "stand", expr: "neutral", back: true }, tint: GOLD }, ...ring(false, GOLD, false).filter((_, i) => i % 2 === 0)],
  world: () => ({ light: "golden", jarStage: 4, jarSince: 20 }) });
// 22 "His generals were standing there."
add({ a: 61.2, b: 63.4, cam: glide({ pos: [0, 1.7, -0.5], look: [0, 2.6, -8], fov: 44 }, { pos: [0, 1.75, -1.4], look: [0, 2.7, -8], fov: 42 }, 0.04),
  actors: (t) => [
    { who: "g0", pos: [-1.25, 0, -7.0], opts: { mode: "stand", expr: "stern", blink: blinkAt(t, 3) }, tint: GOLD },
    { who: "g1", pos: [0, 0, -8.2], opts: { mode: "stand", expr: "stern", blink: blinkAt(t, 4) }, tint: GOLD },
    { who: "g2", pos: [1.3, 0, -7.1], opts: { mode: "stand", expr: "stern", blink: blinkAt(t, 5) }, tint: GOLD },
  ],
  world: () => ({ light: "golden" }) });
// 23 "His soldiers were surrounding the palace." : crane up over the ring
add({ a: 63.4, b: 65.9, cam: glide({ pos: [10, 12, 22], look: [0, 2, -10], fov: 48 }, { pos: [18, 34, 34], look: [0, 0, -8], fov: 50 }, 0),
  actors: () => ring(false, GOLD, false), world: () => ({ light: "golden" }) });
// 24 "And every single one of them was pointing their weapons at him."
add({ a: 65.9, b: 69.7, cam: glide({ pos: [0.6, 3.0, 0.5], look: [0, 5.8, -19], fov: 48 }, { pos: [0.5, 3.1, -0.3], look: [0, 6.0, -19], fov: 46 }, 0.03),
  actors: (t) => [{ who: "king", pos: BALC, opts: { mode: "stand", expr: "terror" }, tint: GOLD },
    ...Array.from({ length: 12 }, (_, i) => ({ who: "s" + i, pos: [-3.6 + (i % 6) * 1.45 + (i > 5 ? 0.7 : 0), 0, -8.5 - (i > 5 ? 2.4 : 0)] as V3, tint: GOLD, opts: { mode: "stand", expr: "stern", back: true, prop: t > 66.4 ? "spearUp" : "spear" } as FrontOpts })),
    ...[0, 1, 2].map((k) => ({ who: "g" + k, pos: [-1.4 + k * 1.4, 0, -6.4] as V3, tint: GOLD, opts: { mode: "stand", expr: "stern", back: true, prop: t > 66.4 ? "spearUp" : null } as FrontOpts }))],
  world: () => ({ light: "golden" }) });
// 24b the king's face
add({ a: 69.7, b: 70.45, cam: glide({ pos: [0, 8.95, -15.6], look: [0, 8.85, -19.2], fov: 34 }, { pos: [0, 8.95, -15.9], look: [0, 8.85, -19.2], fov: 31 }, 0.05),
  actors: () => [{ who: "king", pos: BALC, opts: { mode: "stand", expr: "terror" }, tint: GOLD }],
  world: () => ({ light: "golden" }) });
// 25 "The jar hadn't predicted an invasion." : the shards on the throne-room floor
add({ a: 70.45, b: 73.5, cam: glide({ pos: [X + 5.6, 2.2, -6.6], look: [X + 3, 0.1, -10.6], fov: 42 }, { pos: [X + 5.0, 1.7, -7.4], look: [X + 3, 0.05, -10.6], fov: 38 }, 0.05),
  world: () => ({ light: "interiorNight", jarStage: 4, jarSince: 30, dust: 1 }) });
// 26 "It had predicted a rebellion." : the whole courtyard, king surrounded
add({ a: 73.5, b: DURATION, cam: glide({ pos: [0, 4, 10], look: [0, 6, -18], fov: 46 }, { pos: [16, 40, 34], look: [0, 4, -12], fov: 50 }, 0),
  actors: () => [{ who: "king", pos: BALC, opts: { mode: "stand", expr: "terror" }, tint: DAWN }, ...ring(true, DAWN, false)],
  world: () => ({ light: "dawn" }) });

export const SHOTS = S;
export const shotAt = (t: number) => S.find((s) => t >= s.a && t < s.b) ?? S[S.length - 1];
export const KICKS: [number, number][] = [[CRACK1, 0.8], [CRACK2, 0.8], [ONCE, 1.2], [TWICE, 1.5], [SHATTER, 2.0], [31.25, 0.6], [32.7, 0.5]];
export const kickAt = (t: number) => {
  let v = 0;
  for (const [k, a] of KICKS) { const df = Math.round((t - k) * FPS); if (df >= 0 && df < 7) v += a * (df % 2 ? -1 : 1) * (1 - df / 7); }
  return v;
};
