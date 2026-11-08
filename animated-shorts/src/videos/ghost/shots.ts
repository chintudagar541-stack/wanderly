// Shot plan for "The Ghost Army" (voice: shorts/ghost-army/voice/voice.wav, word times in words.json). 75 s, 30 fps.
import { LightName } from "./world";
import { FrontOpts, Outfit, INK } from "../dead/toon";

export const FPS = 30;
export const DURATION = 75;
export const TOTAL = DURATION * FPS;

export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
export type ActorDef = { who: string; pos: V3; opts: FrontOpts; tint?: V3; scale?: number; turn?: number; yaw?: number };
export type WorldState = {
  light: LightName; hero?: number; heroWob?: number; inflate?: number; tracks?: number; roller?: V3 | null; ghosts?: number; german?: number;
  finale?: number; finaleWob?: number; horns?: number;
};
export type Kind = "3d" | "dossier" | "map" | "years";
export type Shot = { id: number; a: number; b: number; kind: Kind; view?: "binoc"; cam?: (t: number, u: number) => Cam; actors?: (t: number) => ActorDef[]; world?: (t: number) => WorldState };

export const US: Outfit = { jacket: "#6b7442", pants: "#56603a", boots: "#5a3b26", hat: "helmetUS", belt: "#9a8a5a" };
export const DE: Outfit = { jacket: "#6a7368", pants: "#555c56", boots: INK, hat: "helmetDE", belt: "#2a2a2a" };
export const GENERAL: Outfit = { ...US, stars: true, buttons: "#e8c45a", moustache: "#4a3020", build: "stout" };
export const DE_OFF: Outfit = { ...DE, hat: "peaked", cap: "#5d665f", moustache: "#2a1d18", belt: "#1a1a1a", buttons: "#c9ccd2" };
export const SPY: Outfit = { jacket: "#9a8a66", pants: "#4a4440", boots: "#2a2420", hat: "fedora", cap: "#4a3e33", buttons: "#3a2a1c" };
export const outfitOf = (who: string): Outfit => who.startsWith("deOff") ? DE_OFF : who.startsWith("de") ? DE : who.startsWith("gen") ? GENERAL : who.startsWith("spy") ? SPY : US;

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

const NIGHT: V3 = [0.55, 0.62, 0.9];
const GOLD: V3 = [1.05, 0.9, 0.78];
const DAWN: V3 = [1.0, 0.88, 0.85];
const FOX: V3 = [0, 1.75, 61.6]; // German soldier in the foxhole (behind the sandbags at z 60.6)

const S: Shot[] = [];
const add = (s: Omit<Shot, "id">) => S.push({ id: S.length + 1, ...s });

// 1 "Imagine being a soldier in World War II"
add({ a: 0, b: 3.3, kind: "3d",
  cam: glide({ pos: [1.2, 3.2, 57.2], look: [0, 3.05, 61.6], fov: 38 }, { pos: [1.0, 3.15, 58.0], look: [0, 3.05, 61.6], fov: 34 }, 0.05),
  actors: (t) => [{ who: "de", pos: FOX, opts: { mode: "stand", expr: "neutral", blink: blinkAt(t, 2), look: -0.3 }, tint: DAWN }],
  world: () => ({ light: "dawn" }) });
// 2 "You look across the battlefield and see hundreds of enemy tanks"
add({ a: 3.3, b: 6.3, kind: "3d", view: "binoc",
  cam: glide({ pos: [0, 2.5, 60], look: [-22, 1.5, -10], fov: 22 }, { pos: [0, 2.5, 60], look: [14, 1.5, -18], fov: 20 }, 0),
  world: () => ({ light: "dawn" }) });
// 3 "thousands of soldiers"
add({ a: 6.3, b: 8.4, kind: "3d",
  cam: glide({ pos: [-40, 22, 50], look: [-2, 0, -14], fov: 42 }, { pos: [-30, 20, 48], look: [0, 0, -16], fov: 40 }, 0),
  actors: (t) => Array.from({ length: 10 }, (_, i) => ({ who: `us${i}`, pos: [-26 + i * 6 + Math.sin(i) * 2, 0, 4 - (i % 3) * 9 - (t - 6.3) * 1.2] as V3,
    opts: { mode: "march", phase: t * 1.8 + i * 0.13, expr: "neutral" } as FrontOpts, tint: DAWN })),
  world: () => ({ light: "dawn" }) });
// 4 "and military vehicles everywhere"
add({ a: 8.4, b: 10.85, kind: "3d",
  cam: glide({ pos: [-46, 2.6, -13], look: [-26, 1.8, -8.5], fov: 44 }, { pos: [-10, 2.6, -13], look: [10, 1.8, -8.5], fov: 44 }, 0),
  world: () => ({ light: "dawn" }) });
// 5 "But there's one problem"
add({ a: 10.85, b: 12.3, kind: "3d",
  cam: glide({ pos: [0.5, 3.25, 59.0], look: [0, 3.15, 61.6], fov: 34 }, { pos: [0.4, 3.22, 59.3], look: [0, 3.15, 61.6], fov: 31 }, 0.08),
  actors: () => [{ who: "de", pos: FOX, opts: { mode: "stand", expr: "worried", prop: "binoculars" }, tint: DAWN }],
  world: () => ({ light: "dawn" }) });
// 6 "Almost everything you're seeing is FAKE." : a soldier pulls the plug, the tank sags
add({ a: 12.3, b: 15.85, kind: "3d",
  cam: glide({ pos: [13, 2.2, 22], look: [4, 1.4, 14], fov: 42 }, { pos: [12, 2.0, 21], look: [4, 1.2, 14], fov: 40 }, 0.05),
  actors: (t) => [{ who: "usA", pos: [7.0, 0, 17.0], opts: { mode: "stand", expr: t < 14.2 ? "neutral" : "smile", blink: blinkAt(t, 4), prop: t > 13.6 && t < 14.4 ? "point" : null }, tint: DAWN }],
  world: (t) => ({ light: "dawn", hero: ramp(t, 14.25, 15.4), heroWob: t > 14.25 ? Math.sin(t * 30) * (1 - ramp(t, 14.25, 15.6)) : 0 }) });
// 7 "During WWII the American army created a secret unit called the Ghost Army" : dossier
add({ a: 15.85, b: 20.75, kind: "dossier" });
// 8 "Their mission wasn't to fight the enemy. It was to trick them."
add({ a: 20.75, b: 24.35, kind: "3d",
  cam: glide({ pos: [9.5, 1.6, 20.5], look: [6.6, 1.35, 17.2], fov: 36 }, { pos: [9.0, 1.58, 20.0], look: [6.6, 1.38, 17.2], fov: 32 }, 0.08),
  actors: (t) => [
    { who: "usA", pos: [7.0, 0, 17.0], opts: { mode: "stand", expr: t < 23.1 ? "neutral" : "grin", blink: blinkAt(t, 4) }, tint: [1, 0.97, 0.95] },
    { who: "usB", pos: [5.3, 0, 16.0], opts: { mode: "stand", expr: t < 23.1 ? "neutral" : "smile_closed", blink: blinkAt(t, 5) }, tint: [1, 0.97, 0.95] },
  ],
  world: () => ({ light: "day", hero: 1 }) });
// 9 "They used giant inflatable tanks that looked real from a distance"
add({ a: 24.35, b: 27.95, kind: "3d",
  cam: (t, u) => {
    const pull = ramp(t, 26.0, 27.9);
    const A: Cam = { pos: [-10, 2.2, 47], look: [-17.5, 1.4, 40.2], fov: 42 }, Bc: Cam = { pos: [10, 9, 75], look: [-17, 1.5, 40], fov: 32 };
    return { pos: LV(A.pos, Bc.pos, pull), look: LV(A.look, Bc.look, pull), fov: L(A.fov, Bc.fov, pull) + u * 0 };
  },
  actors: (t) => [
    { who: "usB", pos: [-13.4, 0, 44.6], opts: { mode: "stand", expr: "grin", blink: blinkAt(t, 5) }, tint: [1, 0.97, 0.95] },
    { who: "usC", pos: [-15.6, 0, 45.0], opts: { mode: "stand", expr: "smile", blink: blinkAt(t, 6) }, tint: [1, 0.97, 0.95] },
  ],
  world: (t) => ({ light: "day", hero: 1, inflate: ramp(t, 24.5, 26.2) }) });
// 10 "They created fake military camps, complete with trucks, artillery ..."
add({ a: 27.95, b: 31.3, kind: "3d",
  cam: glide({ pos: [-44, 6, 36], look: [-26, 1, 26], fov: 44 }, { pos: [8, 6, 34], look: [26, 1.5, 22], fov: 44 }, 0),
  actors: (t) => [{ who: "usC", pos: [-22, 0, 31], opts: { mode: "march", phase: t * 1.8, expr: "neutral" }, tint: [1, 0.97, 0.95] }],
  world: () => ({ light: "day", hero: 1 }) });
// 11 "... and even fake footprints." : a soldier rolls fake tank tracks into the mud
add({ a: 31.3, b: 33.65, kind: "3d",
  cam: (t) => { const x = L(18.5, 30.5, ramp(t, 31.3, 33.6)); return { pos: [x + 0.8, 2.3, 40.2], look: [x - 0.8, 0.8, 34], fov: 44 }; },
  actors: (t) => { const x = L(18.5, 30.5, ramp(t, 31.3, 33.6)); return [{ who: "usA", pos: [x - 1.3, 0, 34.0], opts: { mode: "march", phase: t * 1.8, expr: "grin" }, tint: [1, 0.97, 0.95] }]; },
  world: (t) => { const k = ramp(t, 31.3, 33.6); return { light: "day", hero: 1, tracks: 0.02 + 0.98 * k, roller: [L(18.5, 30.5, k), 0, 34] }; } });
// 12 "But that wasn't all." : night falls on the speaker truck
add({ a: 33.65, b: 34.95, kind: "3d",
  cam: glide({ pos: [8, 3.5, 44], look: [-6, 2, 30], fov: 40 }, { pos: [7, 3.3, 42], look: [-6, 2, 30], fov: 38 }, 0.04),
  world: () => ({ light: "night", hero: 1 }) });
// 13 "They used huge speakers to broadcast recordings ..."
add({ a: 34.95, b: 37.55, kind: "3d",
  cam: glide({ pos: [-13, 3.4, 34.5], look: [-7.2, 2.8, 30.2], fov: 42 }, { pos: [-12.2, 3.3, 34.0], look: [-7.2, 2.8, 30.2], fov: 38 }, 0.06),
  world: (t) => ({ light: "night", hero: 1, horns: ramp(t, 35.6, 36.0) }) });
// 14 "... of tanks moving, soldiers marching, entire convoys traveling through the night." : the German listens, imagines
add({ a: 37.55, b: 42.95, kind: "3d",
  cam: glide({ pos: [0.6, 3.7, 65.5], look: [0, 5, 10], fov: 46 }, { pos: [0.55, 3.7, 65.0], look: [0, 6, 0], fov: 44 }, 0.02),
  actors: () => [{ who: "de", pos: FOX, opts: { mode: "stand", expr: "shock", back: true }, tint: NIGHT }],
  world: (t) => ({ light: "night", hero: 1, ghosts: 0.7 * ramp(t, 37.7, 38.6), horns: 1 }) });
// 15 "They even had soldiers pretending to be high-ranking officers ..." : the cafe
add({ a: 42.95, b: 46.0, kind: "3d",
  cam: glide({ pos: [118.2, 1.7, 2.6], look: [116.0, 1.35, -3.0], fov: 40 }, { pos: [117.8, 1.62, 2.0], look: [116.0, 1.4, -3.0], fov: 36 }, 0.05),
  actors: (t) => [
    { who: "gen", pos: [115.5, 0, -3.8], opts: { mode: "stand", expr: Math.floor(t * 3) % 2 ? "laugh" : "grin", wave: Math.sin(t * 5) * 0.5 + 0.5, blink: blinkAt(t, 7) }, tint: [1, 0.97, 0.92] },
    { who: "spy", pos: [120.6, 0, -3.6], opts: { mode: "sit", expr: "smile", look: -1, blink: blinkAt(t, 8) }, tint: [1, 0.97, 0.92] },
  ],
  world: () => ({ light: "day", hero: 1 }) });
// 16 "... spreading fake information in nearby towns." : the eavesdropper leans in
add({ a: 46.0, b: 48.65, kind: "3d",
  cam: glide({ pos: [121.4, 1.4, -1.0], look: [120.5, 1.15, -3.6], fov: 36 }, { pos: [121.2, 1.38, -1.4], look: [120.4, 1.18, -3.6], fov: 32 }, 0.06),
  actors: (t) => [
    { who: "spy", pos: [120.6, 0, -3.6], opts: { mode: "sit", expr: "nervous", look: -1, tilt: -6, headTilt: -4, blink: blinkAt(t, 8) }, tint: [1, 0.97, 0.92] },
    { who: "gen", pos: [115.5, 0, -3.8], opts: { mode: "stand", expr: "laugh", wave: 0.6 }, tint: [1, 0.97, 0.92] },
  ],
  world: () => ({ light: "day", hero: 1 }) });
// 17 "And the craziest part? The enemy actually believed it."
add({ a: 48.65, b: 52.1, kind: "3d",
  cam: glide({ pos: [1.2, 3.15, 58.4], look: [0, 3.05, 61.6], fov: 36 }, { pos: [1.0, 3.12, 58.9], look: [0, 3.05, 61.6], fov: 32 }, 0.06),
  actors: (t) => [{ who: "deOff", pos: FOX, opts: { mode: "stand", expr: t < 50.9 ? "stern" : "grin", prop: t < 50.0 ? "binoculars" : "point", blink: t > 50 ? blinkAt(t, 9) : 0 }, tint: DAWN }],
  world: () => ({ light: "dawn", hero: 0 }) });
// 18 "German forces sometimes moved their troops to attack these fake military positions"
add({ a: 52.1, b: 55.95, kind: "3d",
  cam: (t) => {
    const s = (0.2 + 0.8 * ramp(t, 52.1, 55.95)) * 40, lx = -110 + 0.814 * s, lz = 60 - 0.581 * s;
    return { pos: [lx + 13, 5.2, lz - 4], look: [lx - 8, 1.2, lz + 8], fov: 46 };
  },
  world: (t) => ({ light: "day", hero: 0, german: 0.2 + 0.8 * ramp(t, 52.1, 55.95) }) });
// 19 "... leaving real American forces free to advance elsewhere." : map
add({ a: 55.95, b: 59.4, kind: "map" });
// 20 "The Ghost Army had around 1,100 men ..."
add({ a: 59.4, b: 62.0, kind: "3d",
  cam: glide({ pos: [0, 1.7, 48], look: [0, 1.3, 38], fov: 40 }, { pos: [0, 1.75, 47], look: [0, 1.35, 38], fov: 38 }, 0.04),
  actors: (t) => Array.from({ length: 9 }, (_, i) => ({ who: `us${i}`, pos: [-4.8 + i * 1.2, 0, 40 - (i % 2) * 0.6] as V3,
    opts: { mode: "stand", expr: i === 4 ? "smile" : "neutral", blink: blinkAt(t, i + 3) } as FrontOpts, tint: [1, 0.97, 0.95] as V3 })),
  world: () => ({ light: "day", hero: 0, inflate: 1 }) });
// 21 "... but their deceptions helped protect much larger Allied forces." : crane up over the whole fake army
add({ a: 62.0, b: 65.4, kind: "3d",
  cam: glide({ pos: [0, 3, 50], look: [0, 1.5, 36], fov: 42 }, { pos: [0, 46, 72], look: [0, 0, 0], fov: 46 }, 0),
  actors: (t) => Array.from({ length: 9 }, (_, i) => ({ who: `us${i}`, pos: [-4.8 + i * 1.2, 0, 40 - (i % 2) * 0.6] as V3,
    opts: { mode: "stand", expr: "neutral", blink: blinkAt(t, i + 3) } as FrontOpts, tint: [1, 0.97, 0.95] as V3 })),
  world: () => ({ light: "day", hero: 0, inflate: 1 }) });
// 22 "And for decades their mission remained classified." : years flip, CLASSIFIED
add({ a: 65.4, b: 68.2, kind: "years" });
// 23 "They weren't an army that conquered territory."
add({ a: 68.2, b: 70.5, kind: "3d",
  cam: glide({ pos: [22, 2.0, 112], look: [9, 2.2, 95], fov: 40 }, { pos: [20, 2.2, 110], look: [9, 2.3, 95], fov: 38 }, 0.03),
  actors: (t) => [
    { who: "usA", pos: [14.5, 0, 101.5], opts: { mode: "stand", expr: "smile_closed", blink: blinkAt(t, 4) }, tint: GOLD },
    { who: "usB", pos: [12.8, 0, 100.5], opts: { mode: "stand", expr: "neutral", blink: blinkAt(t, 5) }, tint: GOLD },
  ],
  world: () => ({ light: "golden", hero: 0, finale: 0 }) });
// 24 "They were an army that made the enemy fight an illusion." : the tank sighs flat into the sunset
add({ a: 70.5, b: DURATION, kind: "3d",
  cam: glide({ pos: [23, 2.4, 113], look: [10, 1.8, 96], fov: 42 }, { pos: [30, 8, 124], look: [9, 2.2, 95], fov: 44 }, 0),
  actors: (t) => [
    { who: "usA", pos: [14.5, 0, 101.5], opts: { mode: "stand", expr: t < 72.6 ? "smile_closed" : "grin", blink: blinkAt(t, 4) }, tint: GOLD },
    { who: "usB", pos: [12.8, 0, 100.5], opts: { mode: "stand", expr: t < 72.6 ? "neutral" : "smile", blink: blinkAt(t, 5) }, tint: GOLD },
  ],
  world: (t) => ({ light: "golden", hero: 0, finale: ramp(t, 72.55, 74.0), finaleWob: t > 72.55 ? Math.sin(t * 24) * (1 - ramp(t, 72.55, 74.2)) : 0 }) });

export const SHOTS = S;
export const shotAt = (t: number) => S.find((s) => t >= s.a && t < s.b) ?? S[S.length - 1];
export const KICKS: [number, number][] = [[14.27, 0.6], [67.07, 1.2]];
export const kickAt = (t: number) => {
  let v = 0;
  for (const [k, a] of KICKS) { const df = Math.round((t - k) * FPS); if (df >= 0 && df < 7) v += a * (df % 2 ? -1 : 1) * (1 - df / 7); }
  return v;
};
