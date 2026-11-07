// Shot plan for "The Man Who Accidentally Bought the Moon" (voice: Kokoro am_michael @1.35, the owner's script; line
// and word times in shorts/moon/voice/). 75 s, 30 fps. Reference style: close-ups, an angle change every ~1 s,
// the camera always moving, whip pans on beat changes, depth of field on close shots.
// Only the opening (0 - 10.9 s) is planned so far: it is the approval clip.
import { LightName, AX, CX, BED, CHAIR, LAPTOP, WIN, MOON_APT, MOON_CITY } from "./world";
import { FrontOpts, Outfit } from "../dead/toon";

export const FPS = 30;
export const DURATION = 75.6;
export const TOTAL = Math.round(DURATION * FPS);

export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
export type ActorDef = { who: string; pos: V3; opts: FrontOpts; tint?: V3; scale?: number; roll?: number; yaw?: number };
export type Fx = { warm?: V3[]; scroll?: number; screen?: number };
export type Shot = { id: number; a: number; b: number; cam: (t: number, u: number) => Cam; actors?: (t: number) => ActorDef[]; light: LightName; dof: number; focus?: V3;
  whip?: -1 | 1; fx?: (t: number) => Fx; shadowR?: number };

const FAIR = "#f0c9a0", PEACH = "#f5c9a0", TAN = "#d9a679", DARK = "#a8754f", WHEAT = "#e8b88a";
const COATS = ["#2a4a9a", "#2e7a4a", "#7a2a6a", "#d98a2a", "#1f6a7a", "#a8402a", "#5a3a8a", "#c9962e"], DRESS = ["#d1202f", "#e8538a", "#2e9a5a", "#f2a020", "#8a2a9a", "#2a6ab0", "#e86a2a"];
export const outfitOf = (who: string): Outfit => {
  const i = parseInt(who.replace(/^\D+/, "")) || 0;
  switch (who) {
    // Kevin: an ordinary guy in a green hoodie and jeans, messy brown hair, stubble
    case "kevin": return { jacket: "#2e8a6a", pants: "#2a4a8a", boots: "#f4f1ea", hat: "hair", hair: "#4a2a18", buttons: "#f2c14e", skin: PEACH };
  }
  // townsfolk: varied coats and dresses, hairstyles
  const w = i % 3 === 1;
  return w ? { jacket: DRESS[(i + 3) % 7], pants: DRESS[i % 7], dress: DRESS[i % 7], boots: "#5a3a22", hat: "longHair", hairStyle: (["bob", "ponytail", "long", "bun"] as const)[i % 4], hair: ["#1a1414", "#e8c060", "#a83a1a", "#5a3a22"][i % 4], skin: [FAIR, WHEAT, DARK, TAN][i % 4], build: i % 7 === 4 ? "kid" : "adult" }
    : { jacket: COATS[i % 8], pants: "#3b3f52", boots: "#4a3426", hat: i % 5 === 4 ? "cap" : "hair", cap: DRESS[(i + 2) % 7], hair: ["#1a1414", "#6a4022", "#e8c060", "#2a1a14"][i % 4], moustache: i % 4 === 1 ? "#2a1a14" : undefined, beard: i % 7 === 3 ? "#5a3a22" : undefined, skin: [FAIR, TAN, DARK, WHEAT][i % 4], build: i % 9 === 4 ? "kid" : "adult" };
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const t = clamp01(x); return t * t * t * (t * (6 * t - 15) + 10); };
const L = (a: number, b: number, t: number) => a + (b - a) * t;
const LV = (a: V3, b: V3, t: number): V3 => [L(a[0], b[0], t), L(a[1], b[1], t), L(a[2], b[2], t)];
/** a constant-speed move (only the ends ease a little, so the camera never stops at a cut) */
const move = (A: Cam, B: Cam) => (_t: number, u: number): Cam => { const s = 0.75 * u + 0.25 * smooth(u); return { pos: LV(A.pos, B.pos, s), look: LV(A.look, B.look, s), fov: L(A.fov, B.fov, s), roll: L(A.roll ?? 0, B.roll ?? 0, s) }; };
export const blinkAt = (t: number, seed: number) => { const f = Math.round(t * FPS), period = 40 + ((seed * 13) % 26), ph = (f + seed * 7) % period; return ph < 4 ? [0.5, 1, 1, 0.5][ph] : 0; };
const talk = (t: number, open: FrontOpts["expr"] = "grin", closed: FrontOpts["expr"] = "smile_closed") => (Math.floor(t * 9) % 3 === 0 ? closed : open);
void talk; void CX; void MOON_CITY; void MOON_APT;

const S: Shot[] = [];
const add = (s: Omit<Shot, "id">) => S.push({ id: S.length + 1, ...s });

// ---------------- Kevin poses ----------------
const [BX, , BZ] = BED;
/** asleep in bed: lying on his side under the quilt, head on the pillow */
const KEVIN_BED = (t: number, expr: FrontOpts["expr"] = "asleep"): ActorDef => ({ who: "kevin", pos: [BX + 0.02, 0.92, BZ + 1.95], roll: -Math.PI / 2, opts: { mode: "stand", expr, blink: expr === "asleep" ? 0 : blinkAt(t, 1) } });
/** sitting up in bed */
const KEVIN_UP = (t: number, expr: FrontOpts["expr"] = "dazed", o: Partial<FrontOpts> = {}): ActorDef => ({ who: "kevin", pos: [BX + 0.05, 0.62, BZ + 0.75], opts: { mode: "sit", expr, blink: blinkAt(t, 1), ...o } });
/** at the desk behind the laptop, facing the room */
const KEVIN_DESK = (t: number, expr: FrontOpts["expr"] = "neutral", o: Partial<FrontOpts> = {}): ActorDef => ({ who: "kevin", pos: [CHAIR[0], 0.32, CHAIR[2] + 0.12], opts: { mode: "sit", expr, blink: blinkAt(t, 1), ...o } });
const [LX, LY, LZ] = LAPTOP;
const [WX, WY, WZ] = WIN;
const CLOCK: V3 = [BX + 1.15, 0.68, BZ + 0.15];

// ================= SHOTS (the approval clip: 0 - 10.9 s) =================
// 0 "Imagine waking up one morning and discovering that you own the Moon."
add({ a: 0, b: 1.0, light: "morning", dof: 20, focus: [BX + 0.05, 1.3, BZ + 0.75], cam: move({ pos: [CLOCK[0] + 0.55, 0.9, CLOCK[2] + 0.75], look: [BX + 0.05, 1.15, BZ + 0.75], fov: 40 }, { pos: [CLOCK[0] + 0.35, 0.95, CLOCK[2] + 0.62], look: [BX + 0.05, 1.22, BZ + 0.75], fov: 38 }),
  actors: (t) => [KEVIN_UP(t, "asleep", { headTilt: -14 + 4 * Math.sin(t * 2), blink: 0 })], fx: () => ({ warm: [[BX + 0.8, 1.3, BZ + 1.2]] }), shadowR: 6 });
add({ a: 1.0, b: 1.64, light: "close", dof: 18, whip: 1, focus: [BX + 0.05, 1.42, BZ + 0.75], cam: move({ pos: [BX + 0.6, 1.5, BZ + 2.05], look: [BX + 0.05, 1.42, BZ + 0.75], fov: 36 }, { pos: [BX + 0.45, 1.48, BZ + 1.8], look: [BX + 0.05, 1.42, BZ + 0.75], fov: 34 }),
  actors: (t) => [KEVIN_UP(t, t < 1.25 ? "asleep" : "dazed", { headTilt: t < 1.25 ? -14 : 0, blink: 0 })], fx: () => ({ warm: [[BX + 0.6, 1.6, BZ + 1.5]] }), shadowR: 5 });
add({ a: 1.64, b: 2.55, light: "morning", dof: 10, focus: [BX + 0.05, 1.3, BZ + 0.75], cam: move({ pos: [BX + 2.6, 1.45, BZ + 3.3], look: [BX + 0.1, 1.35, BZ + 0.6], fov: 42 }, { pos: [BX + 2.0, 1.4, BZ + 2.7], look: [BX + 0.05, 1.32, BZ + 0.6], fov: 40 }),
  actors: (t) => [KEVIN_UP(t, t < 2.15 ? "dazed" : "shock")], fx: () => ({ warm: [[BX + 1, 1.6, BZ + 1.6]] }), shadowR: 8 });
// the Moon over the city (dawn), the camera cranes up the towers to it
add({ a: 2.55, b: 3.35, light: "morning", dof: 0, whip: -1, cam: move({ pos: [CX - 6, 2.2, 8], look: [CX + 4, 18, -60], fov: 50 }, { pos: [CX - 5, 4.5, 6], look: [CX + 8, 46, -200], fov: 46 }), shadowR: 24 });
// 1 "Sounds impossible, right?"
add({ a: 3.35, b: 4.35, light: "close", dof: 16, whip: 1, focus: [BX + 0.05, 1.42, BZ + 0.75], cam: (t, u) => { const a = 0.75 - 0.35 * u, r = 1.75 - 0.15 * u; return { pos: [BX + 0.05 + Math.sin(a) * r, 1.5, BZ + 0.75 + Math.cos(a) * r], look: [BX + 0.05, 1.42, BZ + 0.75], fov: 36 }; },
  actors: (t) => [KEVIN_UP(t, t < 3.9 ? "nervous" : "grin", { wave: 0.5 + 0.3 * Math.sin(t * 5) })], fx: () => ({ warm: [[BX + 0.8, 1.7, BZ + 1.6]] }), shadowR: 6 });
// 2 "Well, that's exactly what happened to a man named Kevin."
add({ a: 4.35, b: 5.28, light: "morning", dof: 0, whip: -1, cam: move({ pos: [AX + 3.6, 1.7, 3.2], look: [AX - 1.0, 1.2, -2.6], fov: 50 }, { pos: [AX + 2.4, 1.75, 3.3], look: [AX - 1.6, 1.25, -2.8], fov: 50 }),
  actors: (t) => [{ who: "kevin", pos: [WX - 0.6, 0, WZ + 0.9], opts: { mode: "stand", expr: "smile_closed", wave: 0.8 + 0.2 * Math.sin(t * 3), blink: blinkAt(t, 1) } }], shadowR: 8 });
add({ a: 5.28, b: 6.6, light: "morning", dof: 14, focus: [WX - 0.6, 1.5, WZ + 0.9], cam: move({ pos: [WX - 0.05, 1.55, WZ + 3.1], look: [WX - 0.55, 1.55, WZ + 0.9], fov: 38 }, { pos: [WX - 0.25, 1.58, WZ + 2.5], look: [WX - 0.58, 1.58, WZ + 0.9], fov: 36 }),
  actors: (t) => [{ who: "kevin", pos: [WX - 0.6, 0, WZ + 0.9], opts: { mode: "stand", expr: t < 5.9 ? "smile" : "grin", wave: t < 5.9 ? undefined : 0.6, blink: blinkAt(t, 1) } }], fx: () => ({ warm: [[WX, 1.8, WZ + 2.2]] }), shadowR: 6 });
// 3 "One night, Kevin was browsing an online auction website when he found something interesting."
add({ a: 6.6, b: 7.6, light: "night", dof: 0, whip: 1, cam: move({ pos: [AX - 1.5, 2.8, 3.3], look: [AX + 1.2, 1.2, -2.2], fov: 50 }, { pos: [AX - 0.6, 2.2, 2.6], look: [AX + 1.4, 1.1, -2.2], fov: 48 }),
  actors: (t) => [KEVIN_DESK(t, "smile_closed")], shadowR: 8 });
add({ a: 7.6, b: 8.6, light: "close", dof: 18, focus: [CHAIR[0], 1.25, CHAIR[2] + 0.12], cam: move({ pos: [LX + 0.55, 1.3, LZ + 1.05], look: [CHAIR[0], 1.25, CHAIR[2] + 0.12], fov: 36 }, { pos: [LX + 0.35, 1.28, LZ + 0.85], look: [CHAIR[0], 1.27, CHAIR[2] + 0.12], fov: 34 }),
  actors: (t) => [KEVIN_DESK(t, "neutral", { glow: 1 })], fx: () => ({ scroll: 0.1 }), shadowR: 5 });
add({ a: 8.6, b: 9.6, light: "close", dof: 14, whip: -1, focus: [LX, LY, LZ], cam: move({ pos: [LX - 0.22, 1.2, LZ - 0.62], look: [LX, LY, LZ], fov: 40 }, { pos: [LX - 0.1, 1.14, LZ - 0.45], look: [LX, LY - 0.01, LZ], fov: 38 }),
  fx: (t) => ({ scroll: 0.1 + 0.58 * smooth((t - 8.6) / 0.85) }), shadowR: 5 });
add({ a: 9.6, b: 10.9, light: "close", dof: 22, focus: [CHAIR[0], 1.3, CHAIR[2] + 0.12], cam: move({ pos: [LX + 0.12, 1.32, LZ + 0.7], look: [CHAIR[0], 1.3, CHAIR[2] + 0.12], fov: 34 }, { pos: [LX + 0.05, 1.31, LZ + 0.35], look: [CHAIR[0], 1.31, CHAIR[2] + 0.12], fov: 32 }),
  actors: (t) => [KEVIN_DESK(t, t < 9.95 ? "neutral" : "shock", { glow: 1 })], fx: () => ({ scroll: 0.68 }), shadowR: 4 });

void WY; void TAN; void KEVIN_BED;
export const SHOTS = S;
export const shotAt = (t: number) => S.find((s) => t >= s.a && t < s.b) ?? S[S.length - 1];
export const KICKS: [number, number][] = [];
export const kickAt = (t: number) => { let v = 0; for (const [k, a] of KICKS) { const df = Math.round((t - k) * FPS); if (df >= 0 && df < 7) v += a * (df % 2 ? -1 : 1) * (1 - df / 7); } return v; };
/** whip pan into shot s (and out of the one before): returns [yaw degrees, blur px] */
export const whipAt = (t: number): [number, number] => {
  for (let i = 1; i < S.length; i++) { const s = S[i]; if (!s.whip) continue; const d = t - s.a, W = 0.14;
    if (d >= -W && d < 0) { const w = (d + W) / W; return [s.whip * w * w * 32, 18 * w]; }
    if (d >= 0 && d < W) { const w = 1 - d / W; return [-s.whip * w * w * 32, 18 * w]; } }
  return [0, 0];
};
