// Shot plan for "Why do we light millions of lamps on Diwali?" (voice: Kokoro am_michael, line times in
// shorts/diwali/voice/lines.json). 70 s, 30 fps.
import { LightName } from "./world";
import { FrontOpts, Outfit } from "../dead/toon";

export const FPS = 30;
export const DURATION = 70;
export const TOTAL = DURATION * FPS;

export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
export type ActorDef = { who: string; pos: V3; opts: FrontOpts; tint?: V3; scale?: number; roll?: number; yaw?: number };
export type WorldState = { light: LightName; city?: number; home?: number; strings?: number; fireworks?: number; petals?: number; arrow?: number | null };
export type Kind = "3d" | "book";
export type Overlay = { flame?: number; dark?: number; flash?: number };
export type Shot = { id: number; a: number; b: number; kind: Kind; cam?: (t: number, u: number) => Cam; actors?: (t: number) => ActorDef[]; world?: (t: number) => WorldState; overlay?: (t: number) => Overlay };

const BLUE = "#5b86d6", FAIR = "#f0c9a0", WHEAT = "#d9a679", BROWN = "#c98a5a";
export const OUTFITS: Record<string, Outfit> = {
  rama: { jacket: "#e8b84a", pants: "#e39a2a", boots: BLUE, hat: "crown", hair: "#1f1612", skin: BLUE, sash: "#d1202f" },
  ramaX: { jacket: "#e07a2a", pants: "#d9832e", boots: BLUE, hat: "jata", hair: "#1f1612", skin: BLUE },
  laks: { jacket: "#d9573a", pants: "#e3a23a", boots: FAIR, hat: "crown", hair: "#1f1612", skin: FAIR, sash: "#2e9a5a" },
  laksX: { jacket: "#c96a2a", pants: "#d98a3e", boots: FAIR, hat: "jata", hair: "#1f1612", skin: FAIR },
  sita: { jacket: "#e8b84a", pants: "#d9384a", dress: "#d9384a", boots: FAIR, hat: "longHair", hair: "#1f1612", skin: FAIR, bindi: true },
  sitaX: { jacket: "#e8b84a", pants: "#e07a2a", dress: "#e07a2a", boots: FAIR, hat: "longHair", hair: "#1f1612", skin: FAIR, bindi: true },
  ravana: { jacket: "#4a2a5a", pants: "#2a1f3a", boots: "#2a1f3a", hat: "crown", hair: "#1a1210", skin: BROWN, moustache: "#1a1210", build: "stout", heads: 9, sash: "#e8b84a" },
  dad: { jacket: "#f2c14e", pants: "#f4f1e8", boots: "#6a4a2a", hat: "hair", hair: "#2a1d18", skin: WHEAT },
  mom: { jacket: "#f2c14e", pants: "#c2185b", dress: "#c2185b", boots: WHEAT, hat: "longHair", hair: "#1f1612", skin: WHEAT, bindi: true },
  kid: { jacket: "#4fc3f7", pants: "#f4f1e8", boots: "#6a4a2a", hat: "hair", hair: "#2a1d18", skin: WHEAT, build: "kid" },
};
const MEN = ["#f4f1e8", "#e3c26a", "#9ad0e0", "#e0907a", "#c9e0a0"], TURB = ["#d9573a", "#f2c14e", "#e84a8a", "#2e9a5a", "#f28a1a"], SAREE = ["#e84a8a", "#2e9a5a", "#f2a33a", "#7a4ac9", "#1f8ac9"];
export const outfitOf = (who: string): Outfit => {
  if (OUTFITS[who]) return OUTFITS[who];
  const i = parseInt(who.slice(1)) || 0;
  if (who[0] === "n") { // modern neighbours
    const k = i % 3;
    if (k === 0) return { jacket: ["#f2c14e", "#e84a8a", "#4fc3f7", "#f4f1e8"][i % 4], pants: "#f4f1e8", boots: "#6a4a2a", hat: "hair", hair: "#2a1d18", skin: [WHEAT, BROWN, FAIR][i % 3] };
    if (k === 1) return { jacket: "#f2c14e", pants: SAREE[i % 5], dress: SAREE[i % 5], boots: WHEAT, hat: "longHair", hair: "#1f1612", skin: [WHEAT, FAIR, BROWN][i % 3], bindi: true };
    return { jacket: ["#ff8a65", "#9ccc65", "#ba68c8"][i % 3], pants: "#3b5b9a", boots: "#f4f1e8", hat: "hair", hair: "#2a1d18", skin: [WHEAT, BROWN][i % 2], build: "kid" };
  }
  if (who[0] === "m") return { jacket: MEN[i % 5], pants: "#f4f1e8", boots: "#8a5a3a", hat: "turban", cap: TURB[i % 5], skin: [WHEAT, BROWN, FAIR][i % 3], moustache: i % 2 ? "#2a1d18" : undefined };
  return { jacket: SAREE[(i + 2) % 5], pants: SAREE[i % 5], dress: SAREE[i % 5], boots: WHEAT, hat: "longHair", hair: "#1f1612", skin: [WHEAT, FAIR, BROWN][i % 3], bindi: true };
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

const LAMP: V3 = [1.0, 0.84, 0.66];   // characters lit by diyas
const DAY: V3 = [1, 0.98, 0.95];
const GOLD: V3 = [1.05, 0.92, 0.8];
const FIRE: V3 = [1.0, 0.72, 0.6];
const DUSK: V3 = [0.95, 0.82, 0.85];
const MX = 160; // modern street x
// modern family at the doorstep of the left house nearest the camera (z = 10 house, door at z = 12.5)
const FAM_Z = 12.5, FAM_X = MX - 10.5 + 3.5 + 2.6;

const S: Shot[] = [];
const add = (s: Omit<Shot, "id">) => S.push({ id: S.length + 1, ...s });

// 1 "Every year, millions of people light tiny oil lamps ..." : doorstep lamps light one by one
add({ a: 0, b: 3.2, kind: "3d",
  cam: glide({ pos: [MX - 2.6, 0.75, 15.0], look: [MX - 5.68, 0.15, 12.5], fov: 40 }, { pos: [MX - 2.9, 0.68, 14.6], look: [MX - 5.68, 0.15, 12.5], fov: 36 }, 0.05),
  world: (t) => ({ light: "modern", home: 0.06 + 0.2 * ramp(t, 0.5, 2.9), strings: 1 }) });
// 2 "... decorate their homes, and celebrate Diwali." : the street, family at the door
add({ a: 3.2, b: 7.2, kind: "3d",
  cam: glide({ pos: [MX + 1.5, 1.8, 26], look: [MX - 5, 2.0, 10], fov: 46 }, { pos: [MX + 2.5, 6.5, 30], look: [MX - 3, 2.5, 4], fov: 48 }, 0),
  actors: (t) => [
    { who: "mom", pos: [FAM_X, 0, FAM_Z - 0.8], opts: { mode: "stand", expr: "smile_closed", prop: "diya", blink: blinkAt(t, 3) }, tint: LAMP },
    { who: "dad", pos: [FAM_X - 0.4, 0, FAM_Z + 0.8], opts: { mode: "stand", expr: "smile", blink: blinkAt(t, 4) }, tint: LAMP },
    { who: "kid", pos: [FAM_X + 0.9, 0, FAM_Z + 0.2], opts: { mode: "stand", expr: "grin", prop: "sparkler", wave: t * 3 }, tint: LAMP },
  ],
  world: () => ({ light: "modern", home: 1, strings: 1, fireworks: 1 }) });
// 3 "But have you ever wondered why?"
add({ a: 7.2, b: 9.45, kind: "3d",
  cam: glide({ pos: [FAM_X + 2.6, 1.05, FAM_Z + 0.6], look: [FAM_X + 0.9, 0.95, FAM_Z + 0.2], fov: 36 }, { pos: [FAM_X + 2.4, 1.05, FAM_Z + 0.55], look: [FAM_X + 0.9, 0.97, FAM_Z + 0.2], fov: 32 }, 0.08),
  actors: (t) => [{ who: "kid", pos: [FAM_X + 0.9, 0, FAM_Z + 0.2], opts: { mode: "stand", expr: t < 8.0 ? "smile" : "whistle", prop: "diya", headTilt: t < 8 ? 0 : 8, look: 0.4, blink: blinkAt(t, 7) }, tint: LAMP }],
  world: () => ({ light: "modern", home: 1, strings: 1 }) });
// 4 "The story goes back thousands of years..." : into the flame
add({ a: 9.45, b: 12.3, kind: "3d",
  cam: glide({ pos: [MX - 3.9, 0.55, 13.8], look: [MX - 5.68, 0.18, 13.05], fov: 34 }, { pos: [MX - 4.5, 0.42, 13.5], look: [MX - 5.68, 0.18, 13.05], fov: 26 }, 0),
  world: () => ({ light: "modern", home: 1, strings: 1 }),
  overlay: (t) => ({ flame: ramp(t, 10.6, 12.25), flash: ramp(t, 11.9, 12.3) }) });
// 5 "According to the Hindu epic Ramayana ..." : the manuscript
add({ a: 12.3, b: 14.9, kind: "book", overlay: (t) => ({ flash: 1 - ramp(t, 12.3, 12.7) }) });
// 6 "... a prince named Rama ..." : Ayodhya, golden hour, Rama on the palace steps
add({ a: 14.9, b: 17.2, kind: "3d",
  cam: glide({ pos: [0.3, 2.2, -31.5], look: [0, 3.6, -42], fov: 46 }, { pos: [0.25, 2.25, -33.0], look: [0, 3.5, -42], fov: 42 }, 0.05),
  actors: (t) => [
    { who: "rama", pos: [0, 1.6, -41.0], opts: { mode: "stand", expr: "smile_closed", prop: "bow", blink: blinkAt(t, 1) }, tint: GOLD },
    { who: "m1", pos: [-1.6, 0.6, -39.4], opts: { mode: "stand", expr: "smile", blink: blinkAt(t, 11) }, tint: GOLD },
    { who: "w2", pos: [1.7, 0.6, -39.3], opts: { mode: "stand", expr: "smile_closed", blink: blinkAt(t, 12) }, tint: GOLD },
  ],
  world: () => ({ light: "golden" }) });
// 7 "... was sent into exile for fourteen years."
add({ a: 17.2, b: 19.35, kind: "3d",
  cam: glide({ pos: [0, 2.0, 30.5], look: [0, 2.0, 46], fov: 44 }, { pos: [0, 2.2, 32], look: [0, 2.4, 48], fov: 42 }, 0),
  actors: (t) => [
    { who: "ramaX", pos: [0, 0, L(39, 46, ramp(t, 17.2, 19.35))], opts: { mode: "stroll", phase: t * 1.4, expr: "neutral", back: true }, tint: GOLD },
    { who: "m3", pos: [-1.15, 0, 36.0], opts: { mode: "stand", expr: "worried", blink: blinkAt(t, 13) }, tint: GOLD },
    { who: "w4", pos: [1.15, 0, 35.8], opts: { mode: "stand", expr: "worried", blink: blinkAt(t, 14) }, tint: GOLD },
  ],
  world: () => ({ light: "golden" }) });
// 8 "His wife Sita and brother Lakshmana went with him."
add({ a: 19.35, b: 22.6, kind: "3d",
  cam: glide({ pos: [-160, 1.9, 22], look: [-160, 1.4, 10], fov: 40 }, { pos: [-160, 1.9, 20], look: [-160, 1.45, 8], fov: 38 }, 0),
  actors: (t) => { const z = L(4, 10, ramp(t, 19.35, 22.6)); return [
    { who: "sitaX", pos: [-160.9, 0, z], opts: { mode: "stroll", phase: t * 1.4 + 0.3, expr: "smile_closed", blink: blinkAt(t, 2) }, tint: DAY },
    { who: "ramaX", pos: [-159.9, 0, z + 0.4], opts: { mode: "stroll", phase: t * 1.4, expr: "smile_closed", prop: "bow", blink: blinkAt(t, 1) }, tint: DAY },
    { who: "laksX", pos: [-158.8, 0, z - 0.3], opts: { mode: "stroll", phase: t * 1.4 + 0.6, expr: "neutral", prop: "bow", blink: blinkAt(t, 5) }, tint: DAY },
  ]; },
  world: () => ({ light: "forest" }) });
// 9 "But during their exile, Sita was kidnapped ..." : the hut, the sky turns
add({ a: 22.6, b: 25.2, kind: "3d",
  cam: glide({ pos: [-146, 1.8, 2], look: [-150, 1.5, -8], fov: 42 }, { pos: [-146.5, 1.75, 0.5], look: [-150, 1.5, -8], fov: 40 }, 0.04),
  actors: (t) => [{ who: "sitaX", pos: [-149.2, 0, -5.4], opts: { mode: "stand", expr: t < 24.2 ? "neutral" : "worried", look: 0.5, blink: blinkAt(t, 2) }, tint: t < 23.8 ? DAY : DUSK }],
  world: (t) => ({ light: t < 23.8 ? "forest" : "dusk" }) });
// 10 "... by the demon king Ravana."
add({ a: 25.2, b: 27.4, kind: "3d",
  cam: glide({ pos: [-145.2, 2.2, 3.5], look: [-149.5, 2.6, -6], fov: 46 }, { pos: [-145.6, 2.3, 2.6], look: [-149.5, 2.8, -6], fov: 44 }, 0.05),
  actors: (t) => [
    { who: "ravana", pos: [-150.6, 0, -6.4], opts: { mode: "stand", expr: "laugh", blink: 0 }, tint: FIRE, scale: 1.25 },
    { who: "sitaX", pos: [-148.4, 0, -4.9], opts: { mode: "stand", expr: "shock" }, tint: FIRE },
  ],
  world: () => ({ light: "fire" }) });
// 11 "Rama eventually defeated Ravana ..." : the bow, the arrow
add({ a: 27.4, b: 29.3, kind: "3d",
  cam: glide({ pos: [-164.5, 1.7, 7.5], look: [-160.8, 1.6, 3.6], fov: 40 }, { pos: [-164.2, 1.7, 7.0], look: [-160.8, 1.65, 3.6], fov: 36 }, 0.06),
  actors: () => [{ who: "ramaX", pos: [-161, 0, 4], opts: { mode: "stand", expr: "stern", prop: "bowAim" }, tint: FIRE }],
  world: (t) => ({ light: "fire", arrow: ramp(t, 28.3, 29.3) }) });
// 12 "... and rescued her." : Ravana falls, dawn returns, Sita safe
add({ a: 29.3, b: 31.25, kind: "3d",
  cam: glide({ pos: [-156, 2.2, -14], look: [-151.5, 2.0, -25], fov: 46 }, { pos: [-156.5, 2.4, -13], look: [-151.5, 1.6, -25], fov: 46 }, 0),
  actors: (t) => [
    { who: "ravana", pos: [-152, 0, -25], opts: { mode: "stand", expr: "dazed" }, tint: FIRE, scale: 1.25, roll: -1.35 * ramp(t, 29.3, 30.3) },
    { who: "sitaX", pos: [-155.2, 0, -19.2], opts: { mode: "stand", expr: t < 30.4 ? "worried" : "relief", blink: blinkAt(t, 2) }, tint: t < 30.4 ? FIRE : GOLD },
  ],
  world: (t) => ({ light: t < 30.4 ? "fire" : "golden" }) });
// 13 "After fourteen long years, Rama finally returned to his kingdom, Ayodhya."
add({ a: 31.25, b: 36.3, kind: "3d",
  cam: glide({ pos: [0, 1.8, 62], look: [0, 2.0, 50], fov: 42 }, { pos: [0, 16, 84], look: [0, 6, 40], fov: 44 }, 0),
  actors: (t) => { const z = L(58, 52, ramp(t, 31.25, 36.3)); return [
    { who: "sita", pos: [-0.9, 0, z], opts: { mode: "stroll", phase: t * 1.3 + 0.3, expr: "smile_closed", blink: blinkAt(t, 2) }, tint: DUSK },
    { who: "rama", pos: [0.1, 0, z - 0.3], opts: { mode: "stroll", phase: t * 1.3, expr: "smile", prop: "bow", blink: blinkAt(t, 1) }, tint: DUSK },
    { who: "laks", pos: [1.2, 0, z + 0.3], opts: { mode: "stroll", phase: t * 1.3 + 0.6, expr: "smile_closed", prop: "bow", blink: blinkAt(t, 5) }, tint: DUSK },
  ]; },
  world: () => ({ light: "dusk", city: 0 }) });
// 14 "And the people were so happy to see their king return..."
add({ a: 36.3, b: 39.6, kind: "3d",
  cam: glide({ pos: [0.4, 1.8, 27.5], look: [0, 1.8, 38.5], fov: 44 }, { pos: [0.3, 1.82, 28.5], look: [0, 1.85, 38.5], fov: 42 }, 0.04),
  actors: (t) => [
    { who: "rama", pos: [0, 0, 38.5], opts: { mode: "stand", expr: "smile", prop: "bow", blink: blinkAt(t, 1) }, tint: DUSK },
    { who: "sita", pos: [-1.1, 0, 38.9], opts: { mode: "stand", expr: "smile_closed", blink: blinkAt(t, 2) }, tint: DUSK },
    { who: "m1", pos: [-2.3, 0, 39.8], opts: { mode: "stand", expr: "laugh", wave: 0.5 + 0.5 * Math.sin(t * 6), blink: blinkAt(t, 11) }, tint: DUSK },
    { who: "w2", pos: [2.3, 0, 39.6], opts: { mode: "stand", expr: "grin", wave: 0.5 + 0.5 * Math.sin(t * 6 + 1), blink: blinkAt(t, 12) }, tint: DUSK },
    { who: "m3", pos: [-1.6, 0, 41.8], opts: { mode: "stand", expr: "grin", blink: blinkAt(t, 13) }, tint: DUSK },
    { who: "w5", pos: [1.6, 0, 41.6], opts: { mode: "stand", expr: "laugh", blink: blinkAt(t, 15) }, tint: DUSK },
  ],
  world: () => ({ light: "dusk", petals: 1, city: 0.02 }) });
// 15 "They lit thousands of oil lamps ..." : the lamps light in a wave from the gate
add({ a: 39.6, b: 42.4, kind: "3d",
  cam: glide({ pos: [-3.2, 1.7, 27], look: [-5.5, 1.2, 16], fov: 46 }, { pos: [-3.0, 1.9, 25.5], look: [-5.8, 1.4, 8], fov: 46 }, 0),
  actors: (t) => [
    { who: "w4", pos: [-4.7, 0, 22.4], opts: { mode: "stand", expr: "smile_closed", prop: "diya", blink: blinkAt(t, 14) }, tint: LAMP },
    { who: "m5", pos: [-4.8, 0, 15.5], opts: { mode: "stand", expr: "smile", prop: "diya", blink: blinkAt(t, 16) }, tint: LAMP },
  ],
  world: (t) => ({ light: "night", city: 0.05 + 0.45 * ramp(t, 39.8, 42.4) }) });
// 16 "... to illuminate the entire city and welcome him home." : aerial
add({ a: 42.4, b: 45.3, kind: "3d",
  cam: glide({ pos: [10, 22, 80], look: [0, 2, 10], fov: 46 }, { pos: [24, 46, 92], look: [0, 0, -6], fov: 50 }, 0),
  world: (t) => ({ light: "night", city: 0.5 + 0.55 * ramp(t, 42.4, 44.4) }) });
// 17 "That is why, in this tradition, people light diyas during Diwali." : today, a balcony
add({ a: 45.3, b: 49.75, kind: "3d",
  cam: glide({ pos: [MX - 3.4, 4.6, 6.2], look: [MX - 6.6, 4.2, 10], fov: 42 }, { pos: [MX - 3.7, 4.55, 6.8], look: [MX - 6.6, 4.25, 10], fov: 38 }, 0.05),
  actors: (t) => [{ who: "mom", pos: [MX - 6.2, 3.7, 10.6], opts: { mode: "stand", expr: "smile_closed", prop: "diya", blink: blinkAt(t, 3) }, tint: LAMP }],
  world: (t) => ({ light: "modern", home: 0.3 + 0.35 * ramp(t, 46.0, 49.3), strings: 1 }) });
// 18 "But Diwali isn't just about celebrating a king's return."
add({ a: 49.75, b: 53.6, kind: "3d",
  cam: glide({ pos: [MX + 1.8, 1.5, 20], look: [MX - 4.5, 1.3, 13], fov: 42 }, { pos: [MX + 1.3, 1.55, 19], look: [MX - 4.5, 1.35, 13], fov: 40 }, 0.04),
  actors: (t) => [
    { who: "kid", pos: [FAM_X + 0.9, 0, FAM_Z + 0.2], opts: { mode: "stand", expr: "laugh", prop: "sparkler", wave: t * 3 }, tint: LAMP },
    { who: "dad", pos: [FAM_X - 0.4, 0, FAM_Z + 0.8], opts: { mode: "stand", expr: "smile", blink: blinkAt(t, 4) }, tint: LAMP },
    { who: "mom", pos: [FAM_X, 0, FAM_Z - 0.8], opts: { mode: "stand", expr: "smile_closed", prop: "diya", blink: blinkAt(t, 3) }, tint: LAMP },
  ],
  world: () => ({ light: "modern", home: 1, strings: 1, fireworks: 1 }) });
// 19 "It's also a celebration of hope, new beginnings ..." : one flame against the dark
add({ a: 53.6, b: 57.2, kind: "3d",
  cam: glide({ pos: [MX - 4.2, 0.5, 13.7], look: [MX - 5.68, 0.18, 13.05], fov: 30 }, { pos: [MX - 4.4, 0.45, 13.6], look: [MX - 5.68, 0.18, 13.05], fov: 26 }, 0),
  world: () => ({ light: "modern", home: 1, strings: 1 }),
  overlay: (t) => ({ dark: 1 - 0.75 * ramp(t, 54.0, 57.0) }) });
// 20 "... and the victory of light over darkness." : fireworks over the city
add({ a: 57.2, b: 60.0, kind: "3d",
  cam: glide({ pos: [MX + 1, 1.2, 24], look: [MX, 18, -30], fov: 50 }, { pos: [MX + 1, 1.3, 23], look: [MX, 22, -30], fov: 52 }, 0),
  actors: (t) => [
    { who: "kid", pos: [MX + 0.4, 0, 20.6], opts: { mode: "stand", expr: "grin", back: true }, tint: LAMP },
    { who: "dad", pos: [MX + 1.6, 0, 20.9], opts: { mode: "stand", expr: "smile", back: true }, tint: LAMP },
    { who: "mom", pos: [MX - 0.8, 0, 20.8], opts: { mode: "stand", expr: "smile", back: true, blink: blinkAt(t, 3) }, tint: LAMP },
  ],
  world: () => ({ light: "modern", home: 1, strings: 1, fireworks: 1 }) });
// 21 "And that's the beautiful reason..." : the family together
add({ a: 60.0, b: 62.2, kind: "3d",
  cam: glide({ pos: [FAM_X + 3.4, 1.35, FAM_Z + 0.3], look: [FAM_X, 1.25, FAM_Z], fov: 40 }, { pos: [FAM_X + 3.1, 1.35, FAM_Z + 0.3], look: [FAM_X, 1.28, FAM_Z], fov: 37 }, 0.05),
  actors: (t) => [
    { who: "mom", pos: [FAM_X, 0, FAM_Z - 0.8], opts: { mode: "stand", expr: "smile_closed", prop: "diya", blink: blinkAt(t, 3) }, tint: LAMP },
    { who: "dad", pos: [FAM_X - 0.4, 0, FAM_Z + 0.8], opts: { mode: "stand", expr: "smile_closed", blink: blinkAt(t, 4) }, tint: LAMP },
    { who: "kid", pos: [FAM_X + 0.9, 0, FAM_Z + 0.2], opts: { mode: "stand", expr: "grin", prop: "diya", blink: blinkAt(t, 7) }, tint: LAMP },
  ],
  world: () => ({ light: "modern", home: 1, strings: 1, fireworks: 1 }) });
// 22 "Why even today ... millions of tiny flames still light up the night." : crane up over the city
add({ a: 62.2, b: DURATION, kind: "3d",
  cam: glide({ pos: [MX + 2, 2.5, 26], look: [MX - 3, 3, 8], fov: 46 }, { pos: [MX + 30, 60, 70], look: [MX, 6, -20], fov: 52 }, 0),
  actors: (t) => [
    { who: "mom", pos: [FAM_X, 0, FAM_Z - 0.8], opts: { mode: "stand", expr: "smile_closed", prop: "diya", blink: blinkAt(t, 3) }, tint: LAMP },
    { who: "dad", pos: [FAM_X - 0.4, 0, FAM_Z + 0.8], opts: { mode: "stand", expr: "smile", blink: blinkAt(t, 4) }, tint: LAMP },
    { who: "kid", pos: [FAM_X + 0.9, 0, FAM_Z + 0.2], opts: { mode: "stand", expr: "grin", prop: "sparkler", wave: t * 3 }, tint: LAMP },
  ],
  world: () => ({ light: "modern", home: 1, strings: 1, fireworks: 1 }) });

/** background townspeople / neighbours so streets never look empty (static poses: drawn once, cached) */
export const extras = (camX: number, light: LightName): ActorDef[] => {
  const out: ActorDef[] = [];
  if (Math.abs(camX) < 100 && (light === "golden" || light === "dusk" || light === "night")) {
    const tint = light === "golden" ? GOLD : light === "dusk" ? DUSK : LAMP;
    const spots: V3[] = [];
    for (let z = -28; z <= 22; z += 6.2) spots.push([4.7, 0, z]);
    for (let z = -26; z <= 8; z += 6.8) spots.push([-4.8, 0, z]);
    spots.forEach((p, i) => out.push({ who: (i % 2 ? "w" : "m") + (20 + i), pos: p, tint,
      opts: { mode: "stand", expr: (["smile", "grin", "smile_closed", "laugh"] as const)[i % 4], prop: light === "night" && i % 3 === 0 ? "diya" : null, wave: light === "dusk" && i % 4 === 1 ? 0.8 : undefined } }));
  }
  if (camX > 100 && light === "modern") {
    const spots: V3[] = [[MX + 4.0, 0, 3], [MX + 4.3, 0, -5], [MX - 4.0, 0, -7], [MX + 3.9, 0, -16], [MX - 4.2, 0, -18], [MX + 4.2, 0, -25], [MX - 3.9, 0, 1], [MX - 4.1, 0, -27]];
    spots.forEach((p, i) => out.push({ who: "n" + i, pos: p, tint: LAMP,
      opts: { mode: "stand", expr: (["grin", "smile", "laugh", "smile_closed"] as const)[i % 4], prop: i % 3 === 2 ? "sparkler" : i % 3 === 1 ? "diya" : null, wave: 0.3 } }));
  }
  return out;
};

export const SHOTS = S;
export const shotAt = (t: number) => S.find((s) => t >= s.a && t < s.b) ?? S[S.length - 1];
export const kickAt = (_t: number) => 0;
