// Shot plan for "The Man Who Accidentally Bought the Moon" (voice: Kokoro am_michael @1.35, the owner's script; line
// and word times in shorts/moon/voice/). 75 s, 30 fps. Reference style: close-ups, an angle change every ~1 s,
// the camera always moving, whip pans on beat changes, depth of field on close shots.
import { LightName, AX, CX, KX, NX, MX, SX, PX, OX, BED, CHAIR, LAPTOP, WIN, MOON_APT, MOON_CITY, TABLE, PODIUM, KC, HOTEL } from "./world";
import { FrontOpts, Outfit } from "../dead/toon";

export const FPS = 30;
export const DURATION = 75.6;
export const TOTAL = Math.round(DURATION * FPS);

export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
export type ActorDef = { who: string; pos: V3; opts: FrontOpts; tint?: V3; scale?: number; roll?: number; yaw?: number };
export type Fx = { warm?: V3[]; scroll?: number; screen?: number; page?: number; papers?: V3 };
export type Shot = { id: number; a: number; b: number; cam: (t: number, u: number) => Cam; actors?: (t: number) => ActorDef[]; light: LightName; dof: number; focus?: V3;
  whip?: -1 | 1; fx?: (t: number) => Fx; shadowR?: number };

const FAIR = "#f0c9a0", PEACH = "#f5c9a0", TAN = "#d9a679", DARK = "#a8754f", WHEAT = "#e8b88a";
const COATS = ["#2a4a9a", "#2e7a4a", "#7a2a6a", "#d98a2a", "#1f6a7a", "#a8402a", "#5a3a8a", "#c9962e"], DRESS = ["#d1202f", "#e8538a", "#2e9a5a", "#f2a020", "#8a2a9a", "#2a6ab0", "#e86a2a"];
export const outfitOf = (who: string): Outfit => {
  const i = parseInt(who.replace(/^\D+/, "")) || 0;
  switch (who) {
    // Kevin: an ordinary guy in a green hoodie and jeans, messy brown hair, stubble
    case "kevin": return { jacket: "#2e8a6a", pants: "#2a4a8a", boots: "#f4f1ea", hat: "hair", hair: "#4a2a18", buttons: "#f2c14e", skin: PEACH };
    case "lawyer": return { jacket: "#4a4a58", pants: "#3a3a46", boots: "#1a1a1a", hat: "hair", hair: "#a8a8a8", moustache: "#a8a8a8", buttons: "#e8b84a", sash: "#8a1a2a", skin: FAIR, build: "stout" };
    case "gambler": return { jacket: "#8a1a2a", pants: "#2a2a2a", boots: "#1a1a1a", hat: "fedora", cap: "#3a3a3a", hair: "#d0d0d0", moustache: "#d0d0d0", beard: "#b0b0b0", skin: TAN };
    case "shark": return { jacket: "#1a1a20", pants: "#1a1a20", boots: "#0a0a0a", hat: "hair", hair: "#0a0a0a", moustache: "#0a0a0a", buttons: "#e8b84a", skin: DARK, build: "stout" };
    case "nasa": return { jacket: "#f4f4f8", pants: "#2a2a3a", boots: "#1a1a1a", hat: "hair", hair: "#5a3a22", moustache: "#5a3a22", buttons: "#2a4ab0", skin: TAN };
    case "gov": return { jacket: "#1a2a4a", pants: "#1a2a4a", boots: "#0a0a0a", hat: "hair", hair: "#d8d8d8", buttons: "#e8b84a", sash: "#d1202f", skin: FAIR, build: "stout" };
    case "grump": return { jacket: "#8a6a3a", pants: "#3a3a46", boots: "#3a2a1a", hat: "cap", cap: "#3a3a3a", moustache: "#5a3a22", skin: WHEAT, build: "stout" };
    case "seller": return { jacket: "#2a4ab0", pants: "#2a2a3a", boots: "#f4f1ea", hat: "cap", cap: "#f2c14e", hair: "#1a1414", skin: TAN };
  }
  if (/^e\d/.test(who)) return { jacket: ["#f4f4f8", "#a8c8e8", "#f4f4f8", "#d8e0e8"][i % 4], pants: "#2a2a3a", boots: "#1a1a1a", hat: i % 3 === 1 ? "longHair" : "hair", hairStyle: (["bun", "ponytail", "bob"] as const)[i % 3], hair: ["#1a1414", "#6a4022", "#e8c060", "#2a1a14"][i % 4], buttons: "#2a4ab0", skin: [FAIR, TAN, DARK, WHEAT][i % 4] };
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


// ================= the rest of the video (10.9 s - end) =================
const W2 = (t: number, i: number) => 0.5 + 0.5 * Math.sin(t * 9 + i);
const KD = (t: number, expr: FrontOpts["expr"], o: Partial<FrontOpts> = {}) => KEVIN_DESK(t, expr, { glow: 1, ...o });
const KWIN = (t: number, expr: FrontOpts["expr"], o: Partial<FrontOpts> = {}): ActorDef => ({ who: "kevin", pos: [WX - 0.6, 0, WZ + 0.9], opts: { mode: "stand", expr, blink: blinkAt(t, 1), ...o } });
const DOORZ = 3.5, DX = AX - 2.6;
// 4 "Moon for Sale. Starting Price: ten dollars."
add({ a: 10.9, b: 11.9, light: "close", dof: 12, focus: [LX, LY, LZ], cam: move({ pos: [LX - 0.12, 1.12, LZ - 0.5], look: [LX, LY - 0.02, LZ], fov: 36 }, { pos: [LX - 0.05, 1.08, LZ - 0.36], look: [LX, LY - 0.03, LZ], fov: 32 }), fx: () => ({ scroll: 0.68 }), shadowR: 4 });
add({ a: 11.9, b: 12.85, light: "close", dof: 20, whip: 1, focus: [CHAIR[0], 1.3, CHAIR[2] + 0.12], cam: move({ pos: [LX - 0.45, 1.05, LZ + 0.75], look: [CHAIR[0], 1.32, CHAIR[2] + 0.12], fov: 36 }, { pos: [LX - 0.35, 1.08, LZ + 0.55], look: [CHAIR[0], 1.33, CHAIR[2] + 0.12], fov: 34 }), actors: (t) => [KD(t, "smile")], fx: () => ({ scroll: 0.68 }), shadowR: 4 });
// 5 "Thinking it was just a stupid joke, Kevin placed a bid of ten dollars."
add({ a: 12.85, b: 14.0, light: "night", dof: 12, whip: -1, focus: [CHAIR[0], 1.2, CHAIR[2]], cam: (t, u) => { const a = 0.9 - 0.45 * u, r = 2.4; return { pos: [CHAIR[0] + Math.sin(a) * r, 1.45, CHAIR[2] + 0.1 + Math.cos(a) * r], look: [CHAIR[0], 1.2, CHAIR[2] + 0.1], fov: 40 }; }, actors: (t) => [KD(t, "laugh")], fx: () => ({ scroll: 0.68 }), shadowR: 6 });
add({ a: 14.0, b: 14.95, light: "close", dof: 16, focus: [LX, 0.82, LZ - 0.12], cam: move({ pos: [LX + 0.55, 1.15, LZ - 0.6], look: [LX, 0.84, LZ - 0.12], fov: 38 }, { pos: [LX + 0.4, 1.05, LZ - 0.5], look: [LX, 0.84, LZ - 0.12], fov: 36 }), actors: (t) => [{ ...KD(t, "grin"), opts: { mode: "sit", back: true } }], fx: () => ({ scroll: 0.68 }), shadowR: 4 });
add({ a: 14.95, b: 16.1, light: "close", dof: 20, whip: 1, focus: [CHAIR[0], 1.3, CHAIR[2] + 0.12], cam: move({ pos: [LX + 0.3, 1.4, LZ + 0.9], look: [CHAIR[0], 1.3, CHAIR[2] + 0.12], fov: 36 }, { pos: [LX + 0.15, 1.36, LZ + 0.55], look: [CHAIR[0], 1.31, CHAIR[2] + 0.12], fov: 33 }), actors: (t) => [KD(t, "smile_closed", { headTilt: 6 })], shadowR: 4 });
// 6 "But the next morning, he received an email."
add({ a: 16.1, b: 17.0, light: "morning", dof: 0, whip: -1, cam: move({ pos: [AX - 3.4, 2.4, 2.8], look: [AX + 1.4, 1.0, -2.2], fov: 50 }, { pos: [AX - 2.4, 2.0, 2.7], look: [AX + 1.6, 1.0, -2.2], fov: 48 }), actors: (t) => [KD(t, "dazed", { glow: 0.4 })], fx: () => ({ page: 1, screen: 0.5 }), shadowR: 8 });
add({ a: 17.0, b: 18.15, light: "morning", dof: 18, focus: [CHAIR[0], 1.3, CHAIR[2] + 0.12], cam: move({ pos: [LX + 0.5, 1.25, LZ + 0.95], look: [CHAIR[0], 1.3, CHAIR[2] + 0.12], fov: 36 }, { pos: [LX + 0.32, 1.28, LZ + 0.7], look: [CHAIR[0], 1.31, CHAIR[2] + 0.12], fov: 34 }), actors: (t) => [KD(t, t < 17.5 ? "dazed" : "neutral", { glow: 0.6 })], fx: () => ({ page: 1, screen: 0.6 }), shadowR: 4 });
// 7 "Congratulations! You are now the legal owner of the Moon."
add({ a: 18.15, b: 19.4, light: "morning", dof: 12, whip: 1, focus: [LX, LY, LZ], cam: move({ pos: [LX - 0.2, 1.14, LZ - 0.6], look: [LX, LY, LZ], fov: 40 }, { pos: [LX - 0.05, 1.08, LZ - 0.38], look: [LX, LY - 0.02, LZ], fov: 34 }), fx: () => ({ page: 1, screen: 0.6 }), shadowR: 4 });
add({ a: 19.4, b: 20.6, light: "morning", dof: 24, whip: -1, focus: [CHAIR[0], 1.32, CHAIR[2] + 0.12], cam: move({ pos: [LX - 0.1, 1.33, LZ + 0.75], look: [CHAIR[0], 1.32, CHAIR[2] + 0.12], fov: 34 }, { pos: [LX - 0.05, 1.32, LZ + 0.3], look: [CHAIR[0], 1.33, CHAIR[2] + 0.12], fov: 30 }), actors: (t) => [KD(t, t < 20.0 ? "shock" : "dazed", { glow: 0.6 })], fx: () => ({ page: 1, screen: 0.6 }), shadowR: 4 });
// 8 "Kevin thought it was a scam."
add({ a: 20.6, b: 22.0, light: "morning", dof: 10, whip: 1, focus: [CHAIR[0], 1.2, CHAIR[2] + 0.12], cam: (t, u) => { const a = -0.7 + 0.5 * u, r = 2.2; return { pos: [CHAIR[0] + Math.sin(a) * r, 1.3, CHAIR[2] + 0.1 + Math.cos(a) * r], look: [CHAIR[0], 1.2, CHAIR[2] + 0.1], fov: 40 }; }, actors: (t) => [KD(t, t < 21.3 ? "stern" : "smile_closed", { glow: 0.6, prop: "point" })], fx: () => ({ page: 1, screen: 0.6 }), shadowR: 6 });
// 9 "Until three days later, a lawyer showed up at his apartment with forty seven pages of ownership documents."
const LAWYER = (t: number, expr: FrontOpts["expr"] = "stern"): ActorDef => ({ who: "lawyer", pos: [DX + 0.1, 0, DOORZ - 0.55], opts: { mode: "stand", expr, blink: blinkAt(t, 4) } });
const PAPERS: V3 = [DX + 0.1, 1.02, DOORZ - 0.95];
add({ a: 22.0, b: 23.1, light: "night", dof: 0, whip: -1, cam: move({ pos: [AX + 2.6, 1.7, -2.6], look: [DX, 1.3, DOORZ], fov: 50 }, { pos: [AX + 1.8, 1.65, -2.2], look: [DX, 1.3, DOORZ], fov: 48 }), actors: (t) => [LAWYER(t), { who: "kevin", pos: [DX + 1.3, 0, DOORZ - 1.7], opts: { mode: "stand", expr: "dazed", back: true } }], fx: () => ({ papers: PAPERS, warm: [[DX + 0.6, 2.2, DOORZ - 1.2]] }), shadowR: 8 });
add({ a: 23.1, b: 24.35, light: "close", dof: 16, focus: [DX + 0.1, 1.55, DOORZ - 0.55], cam: move({ pos: [DX + 0.9, 1.45, DOORZ - 2.4], look: [DX + 0.1, 1.55, DOORZ - 0.55], fov: 36 }, { pos: [DX + 0.6, 1.5, DOORZ - 2.0], look: [DX + 0.1, 1.56, DOORZ - 0.55], fov: 34 }), actors: (t) => [LAWYER(t, t < 23.6 ? "stern" : "smile_closed")], fx: () => ({ papers: PAPERS, warm: [[DX + 0.6, 2.0, DOORZ - 1.6]] }), shadowR: 5 });
add({ a: 24.35, b: 25.4, light: "close", dof: 22, whip: 1, focus: PAPERS, cam: move({ pos: [DX + 0.55, 1.45, DOORZ - 1.9], look: PAPERS, fov: 36 }, { pos: [DX + 0.35, 1.32, DOORZ - 1.6], look: [PAPERS[0], PAPERS[1] + 0.05, PAPERS[2]], fov: 34 }), actors: (t) => [LAWYER(t, "smile_closed")], fx: () => ({ papers: PAPERS, warm: [[DX + 0.4, 1.8, DOORZ - 1.6]] }), shadowR: 4 });
add({ a: 25.4, b: 26.6, light: "close", dof: 16, whip: -1, focus: [DX + 1.3, 1.55, DOORZ - 1.7], cam: move({ pos: [DX + 0.7, 1.5, DOORZ - 0.2], look: [DX + 1.3, 1.55, DOORZ - 1.7], fov: 36 }, { pos: [DX + 0.85, 1.52, DOORZ - 0.45], look: [DX + 1.3, 1.56, DOORZ - 1.7], fov: 33 }), actors: (t) => [{ who: "kevin", pos: [DX + 1.3, 0, DOORZ - 1.7], opts: { mode: "stand", expr: "shock", blink: 0 } }], fx: () => ({ papers: PAPERS, warm: [[DX + 1, 2, DOORZ - 1]] }), shadowR: 5 });
// 10 "Apparently, the previous owner had sold the Moon to pay off his gambling debts."
const [TX, , TZ] = TABLE;
const gamblers = (t: number, n = 22): ActorDef[] => Array.from({ length: n }, (_, i) => { const tbl = [[KX - 6, -3], [KX + 6, -3], [KX - 6, 4], [KX + 6, 4], [KX, 6.5]][i % 5], a = (i / n) * 9 + 0.6;
  return { who: "p" + (80 + i), pos: [tbl[0] + Math.cos(a) * 1.9, 0, tbl[1] + Math.sin(a) * 1.5] as V3, opts: { mode: "stand", expr: (["grin", "laugh", "nervous", "smile", "shock"] as const)[i % 5], wave: i % 4 === 0 ? W2(t, i) : undefined, blink: blinkAt(t, i) } as FrontOpts }; });
const GAMBLER = (t: number, expr: FrontOpts["expr"], o: Partial<FrontOpts> = {}): ActorDef => ({ who: "gambler", pos: [TX - 0.2, 0, TZ + 1.25], opts: { mode: "stand", expr, blink: blinkAt(t, 6), ...o } });
const SHARK = (t: number, expr: FrontOpts["expr"] = "stern"): ActorDef => ({ who: "shark", pos: [TX + 1.1, 0, TZ - 0.9], opts: { mode: "stand", expr, blink: blinkAt(t, 7) } });
add({ a: 26.6, b: 27.9, light: "casino", dof: 0, whip: 1, cam: move({ pos: [TX - 9, 4.2, 9], look: [TX, 1.2, -2], fov: 50 }, { pos: [TX - 6.5, 3.0, 8], look: [TX, 1.3, -1], fov: 48 }), actors: (t) => [GAMBLER(t, "nervous"), SHARK(t), ...gamblers(t)], fx: () => ({ warm: [[TX, 3, TZ], [TX - 6, 3, -3], [TX + 6, 3, -3]] }), shadowR: 16 });
add({ a: 27.9, b: 29.0, light: "casino", dof: 18, focus: [TX - 0.2, 1.5, TZ + 1.25], cam: move({ pos: [TX - 0.9, 1.35, TZ + 3.1], look: [TX - 0.2, 1.52, TZ + 1.25], fov: 36 }, { pos: [TX - 0.6, 1.4, TZ + 2.7], look: [TX - 0.2, 1.53, TZ + 1.25], fov: 34 }), actors: (t) => [GAMBLER(t, "nervous", { headTilt: 5 * Math.sin(t * 6) }), SHARK(t), ...gamblers(t, 10)], fx: () => ({ warm: [[TX - 0.4, 2.2, TZ + 2.2]] }), shadowR: 6 });
add({ a: 29.0, b: 30.2, light: "casino", dof: 10, whip: -1, focus: [TX + 0.4, 1.4, TZ + 0.2], cam: (t, u) => { const a = 0.2 + 0.5 * u, r = 3.4; return { pos: [TX + 0.4 + Math.sin(a) * r, 1.55, TZ + 0.2 + Math.cos(a) * r], look: [TX + 0.4, 1.35, TZ + 0.2], fov: 40 }; }, actors: (t) => [GAMBLER(t, "grin", { prop: "letter" }), SHARK(t, "creepy" as FrontOpts["expr"]), ...gamblers(t, 10)], fx: () => ({ warm: [[TX, 2.4, TZ + 2]] }), shadowR: 8 });
// 11 "Kevin was now officially a billionaire in real estate."
const ROOFK: V3 = [CX - 1, 0, 2];
add({ a: 30.2, b: 31.3, light: "city", dof: 6, whip: 1, focus: [ROOFK[0], 1.4, ROOFK[2]], cam: move({ pos: [CX + 1.2, 0.5, 6.4], look: [CX - 0.4, 3.0, -10], fov: 50 }, { pos: [CX + 0.6, 0.55, 5.6], look: [CX - 0.2, 3.6, -10], fov: 50 }), actors: (t) => [{ who: "kevin", pos: ROOFK, opts: { mode: "stand", expr: "laugh", prop: "moneyCase", blink: blinkAt(t, 1) } }], fx: () => ({ warm: [[ROOFK[0] + 1, 2, ROOFK[2] + 2]] }), shadowR: 10 });
add({ a: 31.3, b: 32.6, light: "city", dof: 18, focus: [ROOFK[0], 1.55, ROOFK[2]], cam: move({ pos: [ROOFK[0] + 0.5, 1.3, ROOFK[2] + 2.3], look: [ROOFK[0], 1.6, ROOFK[2]], fov: 36 }, { pos: [ROOFK[0] + 0.3, 1.32, ROOFK[2] + 1.8], look: [ROOFK[0], 1.62, ROOFK[2]], fov: 33 }), actors: (t) => [{ who: "kevin", pos: ROOFK, opts: { mode: "stand", expr: "grin", prop: "moneyCase", blink: blinkAt(t, 1) } }], fx: () => ({ warm: [[ROOFK[0] + 0.6, 1.8, ROOFK[2] + 1.2]] }), shadowR: 6 });
// 12 "Well, technically, he owned a giant rock."
const MK: V3 = [MX - 0.4, 0, 5.2];
add({ a: 32.6, b: 33.6, light: "space", dof: 0, whip: -1, cam: move({ pos: [MX + 4, 9, 22], look: [MX - 4, 4, -20], fov: 50 }, { pos: [MX + 3, 6.5, 19], look: [MX - 5, 6, -20], fov: 50 }), actors: (t) => [{ who: "kevin", pos: MK, opts: { mode: "stand", expr: "smile", wave: W2(t, 1), blink: blinkAt(t, 1) } }], shadowR: 24 });
add({ a: 33.6, b: 34.6, light: "space", dof: 14, focus: [MK[0], 1.5, MK[2]], cam: move({ pos: [MK[0] + 1.0, 0.9, MK[2] + 2.4], look: [MK[0], 1.55, MK[2]], fov: 38 }, { pos: [MK[0] + 0.7, 0.95, MK[2] + 2.0], look: [MK[0], 1.58, MK[2]], fov: 35 }), actors: (t) => [{ who: "kevin", pos: MK, opts: { mode: "stand", expr: "dazed", headTilt: 8, blink: blinkAt(t, 1) } }], shadowR: 6 });
// 13 "But things got worse."
add({ a: 34.6, b: 35.7, light: "close", dof: 16, whip: 1, focus: [WX - 0.6, 1.55, WZ + 0.9], cam: move({ pos: [WX + 0.3, 1.4, WZ + 2.9], look: [WX - 0.6, 1.58, WZ + 0.9], fov: 36 }, { pos: [WX + 0.1, 1.45, WZ + 2.4], look: [WX - 0.6, 1.58, WZ + 0.9], fov: 33 }), actors: (t) => [KWIN(t, "worried" as FrontOpts["expr"])], fx: () => ({ warm: [[WX, 1.8, WZ + 2]] }), shadowR: 5 });
// 14 "NASA contacted him and asked for permission to land on his property."
const engineers = (t: number, back = false): ActorDef[] => { const out: ActorDef[] = []; for (let row = 0; row < 3; row++) for (let k = 0; k < 8; k++) { const i = row * 8 + k;
  out.push({ who: "e" + i, pos: [NX - 10.6 + k * 2.66 + (row % 2) * 0.6, row * 0.35 + 0.15, -5 + row * 3.2 + 0.75] as V3, opts: { mode: "sit", back, expr: (["smile_closed", "neutral", "smile", "grin"] as const)[i % 4], blink: blinkAt(t, i) } as FrontOpts }); } return out; };
const NASA = (t: number, expr: FrontOpts["expr"], prop: FrontOpts["prop"] = "phoneEar"): ActorDef => ({ who: "nasa", pos: [NX + 0.6, 0, 5.2], opts: { mode: "stand", expr, prop, blink: blinkAt(t, 3) } });
add({ a: 35.7, b: 36.9, light: "nasa", dof: 0, whip: -1, cam: move({ pos: [NX + 6, 4.6, 9.5], look: [NX - 1, 2.2, -8], fov: 52 }, { pos: [NX + 3.5, 3.2, 9.0], look: [NX - 1, 2.6, -8], fov: 50 }), actors: (t) => [NASA(t, "smile"), ...engineers(t, true)], shadowR: 16 });
add({ a: 36.9, b: 38.0, light: "nasa", dof: 14, focus: [NX + 0.6, 1.55, 5.2], cam: move({ pos: [NX + 1.4, 1.35, 7.3], look: [NX + 0.6, 1.58, 5.2], fov: 36 }, { pos: [NX + 1.1, 1.4, 6.9], look: [NX + 0.6, 1.6, 5.2], fov: 34 }), actors: (t) => [NASA(t, talk(t, "grin", "smile"))], fx: () => ({ warm: [[NX + 1, 2.2, 6.4]] }), shadowR: 6 });
add({ a: 38.0, b: 39.0, light: "nasa", dof: 8, whip: 1, focus: [NX, 3.3, -9.8], cam: move({ pos: [NX - 1.2, 2.0, -3.8], look: [NX + 0.5, 3.6, -9.8], fov: 46 }, { pos: [NX - 0.6, 2.3, -5.0], look: [NX + 1.2, 3.8, -9.8], fov: 44 }), actors: (t) => engineers(t, true).slice(0, 8), shadowR: 10 });
// 15-16 "Kevin refused. Unless they paid rent."
add({ a: 39.0, b: 39.85, light: "close", dof: 18, whip: -1, focus: [WX - 0.6, 1.55, WZ + 0.9], cam: move({ pos: [WX - 0.1, 1.45, WZ + 2.5], look: [WX - 0.6, 1.58, WZ + 0.9], fov: 34 }, { pos: [WX - 0.25, 1.48, WZ + 2.1], look: [WX - 0.6, 1.59, WZ + 0.9], fov: 32 }), actors: (t) => [KWIN(t, "stern", { prop: "phoneEar" })], fx: () => ({ warm: [[WX, 1.8, WZ + 2]] }), shadowR: 5 });
add({ a: 39.85, b: 40.8, light: "close", dof: 14, focus: [WX - 0.6, 1.5, WZ + 0.9], cam: (t, u) => { const a = 0.6 - 0.4 * u, r = 1.9; return { pos: [WX - 0.6 + Math.sin(a) * r, 0.95, WZ + 0.9 + Math.cos(a) * r], look: [WX - 0.6, 1.55, WZ + 0.9], fov: 38 }; }, actors: (t) => [KWIN(t, talk(t, "grin", "smile_closed"), { prop: "phoneEar" })], fx: () => ({ warm: [[WX + 0.4, 1.4, WZ + 1.8]] }), shadowR: 5 });
// 17 "NASA offered him five hundred dollars."
add({ a: 40.8, b: 41.6, light: "nasa", dof: 14, whip: 1, focus: [NX + 0.6, 1.55, 5.2], cam: move({ pos: [NX - 0.3, 1.5, 7.2], look: [NX + 0.6, 1.58, 5.2], fov: 36 }, { pos: [NX - 0.1, 1.5, 6.8], look: [NX + 0.6, 1.6, 5.2], fov: 34 }), actors: (t) => [NASA(t, talk(t, "smile", "smile_closed"))], fx: () => ({ warm: [[NX, 2.2, 6.4]] }), shadowR: 6 });
add({ a: 41.6, b: 42.45, light: "nasa", dof: 10, focus: [NX - 2, 1.2, 1.6], cam: move({ pos: [NX - 5, 1.6, -0.9], look: [NX + 1, 1.2, 2.2], fov: 44 }, { pos: [NX - 3.5, 1.6, -1.0], look: [NX + 2, 1.2, 2.2], fov: 44 }), actors: (t) => engineers(t).map((a, i) => ({ ...a, opts: { ...a.opts, expr: (["grin", "smile", "laugh"] as const)[i % 3] } })), shadowR: 10 });
// 18 "Kevin demanded five million dollars."
add({ a: 42.45, b: 43.3, light: "close", dof: 22, whip: -1, focus: [WX - 0.6, 1.58, WZ + 0.9], cam: move({ pos: [WX - 0.5, 1.6, WZ + 2.2], look: [WX - 0.6, 1.6, WZ + 0.9], fov: 32 }, { pos: [WX - 0.55, 1.6, WZ + 1.8], look: [WX - 0.6, 1.6, WZ + 0.9], fov: 30 }), actors: (t) => [KWIN(t, "stern", { prop: "phoneEar" })], fx: () => ({ warm: [[WX, 1.8, WZ + 1.8]] }), shadowR: 4 });
add({ a: 43.3, b: 44.05, light: "nasa", dof: 22, whip: 1, focus: [NX + 0.6, 1.58, 5.2], cam: move({ pos: [NX + 0.75, 1.6, 6.8], look: [NX + 0.6, 1.6, 5.2], fov: 32 }, { pos: [NX + 0.7, 1.6, 6.4], look: [NX + 0.6, 1.6, 5.2], fov: 30 }), actors: (t) => [NASA(t, "shock", "phoneDrop")], fx: () => ({ warm: [[NX + 0.6, 2.2, 6.2]] }), shadowR: 4 });
// 19 "Negotiations went nowhere."
add({ a: 44.05, b: 45.25, light: "nasa", dof: 0, cam: move({ pos: [NX + 2, 2.4, 7.5], look: [NX - 1, 1.6, -4], fov: 44 }, { pos: [NX + 3, 3.4, 9.5], look: [NX - 1, 1.8, -4], fov: 48 }), actors: (t) => [NASA(t, "pained" as FrontOpts["expr"], null), ...engineers(t).map((a, i) => ({ ...a, opts: { ...a.opts, expr: (["dazed", "nervous", "pained"] as const)[i % 3] } }))], shadowR: 14 });
// 20 "Then Kevin made his biggest mistake."
add({ a: 45.25, b: 46.65, light: "close", dof: 20, whip: -1, focus: [CHAIR[0], 1.3, CHAIR[2] + 0.12], cam: move({ pos: [LX + 0.05, 1.05, LZ + 1.4], look: [CHAIR[0], 1.35, CHAIR[2] + 0.12], fov: 40 }, { pos: [LX + 0.03, 1.15, LZ + 0.55], look: [CHAIR[0], 1.33, CHAIR[2] + 0.12], fov: 32 }), actors: (t) => [KD(t, "creepy")], fx: () => ({ scroll: 0.68 }), shadowR: 4 });
// 21 "He announced that he was going to divide the Moon into smaller properties and sell them."
add({ a: 46.65, b: 47.9, light: "night", dof: 12, whip: 1, focus: [CHAIR[0], 1.3, CHAIR[2] + 0.12], cam: move({ pos: [LX - 1.0, 0.95, LZ + 1.6], look: [CHAIR[0], 1.4, CHAIR[2] + 0.12], fov: 44 }, { pos: [LX - 0.7, 1.0, LZ + 1.3], look: [CHAIR[0], 1.42, CHAIR[2] + 0.12], fov: 42 }), actors: (t) => [KD(t, talk(t, "laugh", "grin"), { prop: "point" })], shadowR: 6 });
add({ a: 47.9, b: 49.0, light: "space", dof: 0, whip: -1, cam: move({ pos: [MX - 22, 12, 22], look: [MX, 0, -4], fov: 48 }, { pos: [MX - 16, 9, 20], look: [MX + 2, 0, -4], fov: 48 }), shadowR: 30 });
add({ a: 49.0, b: 50.3, light: "space", dof: 10, focus: [MX + 2.5, 1.0, -2.47], cam: move({ pos: [MX + 4.4, 1.0, 0.2], look: [MX + 2.5, 1.0, -2.47], fov: 40 }, { pos: [MX + 3.6, 0.9, -0.3], look: [MX + 2.5, 1.0, -2.47], fov: 38 }), shadowR: 8 });
// 22 "Within hours, thousands of people started buying imaginary lunar apartments."
const crowd = (t: number, n = 40, z0 = -1.5, z1 = 5.5): ActorDef[] => Array.from({ length: n }, (_, i) => ({ who: "p" + i, pos: [SX - 16 + ((i * 37) % n) * (32 / n) + (i % 3) * 0.3, 0, z0 + ((i * 13) % 9) / 9 * (z1 - z0)] as V3,
  opts: { mode: i % 4 === 0 ? "stroll" : "stand", phase: t * 1.4 + i * 0.4, expr: (["grin", "smile", "laugh", "smile_closed"] as const)[i % 4], prop: i % 3 === 0 ? "phoneHold" : i % 5 === 1 ? "cash" : null, glow: i % 3 === 0 ? 1 : 0, wave: i % 7 === 2 ? W2(t, i) : undefined, blink: blinkAt(t, i) } as FrontOpts }));
add({ a: 50.3, b: 51.5, light: "street", dof: 0, whip: 1, cam: move({ pos: [SX - 14, 2.2, 7.5], look: [SX + 2, 8, -10], fov: 52 }, { pos: [SX - 10, 3.4, 7.8], look: [SX + 2, 9.5, -10], fov: 52 }), actors: (t) => crowd(t, 48), shadowR: 22 });
add({ a: 51.5, b: 52.6, light: "street", dof: 14, focus: [SX - 3, 1.5, 2], cam: move({ pos: [SX - 6, 1.55, 4.6], look: [SX - 2, 1.5, 1.6], fov: 40 }, { pos: [SX - 3.5, 1.55, 4.8], look: [SX + 0.5, 1.5, 1.6], fov: 40 }), actors: (t) => crowd(t, 40, -1, 4.5), fx: () => ({ warm: [[SX - 3, 3.2, 3], [SX + 1, 3.2, 1]] }), shadowR: 10 });
add({ a: 52.6, b: 53.9, light: "street", dof: 8, whip: -1, focus: [SX, 1.2, -6.6], cam: move({ pos: [SX + 3.2, 2.3, -0.6], look: [SX, 2.2, -6.6], fov: 46 }, { pos: [SX + 2.2, 2.4, -1.4], look: [SX, 2.4, -6.6], fov: 46 }), actors: (t) => [{ who: "seller", pos: [SX, 0.16, -7.5], opts: { mode: "stand", expr: "laugh", prop: "cash", blink: blinkAt(t, 2) } }, ...crowd(t, 26, -5.2, 0.5)], fx: () => ({ warm: [[SX + 0.5, 3.0, -4.6], [SX - 1, 2.8, -3.5]] }), shadowR: 10 });
// 23 "One man even complained that his Moon apartment had no parking space."
const GRUMP = (t: number, expr: FrontOpts["expr"], prop: FrontOpts["prop"] = "letter"): ActorDef => ({ who: "grump", pos: [SX + 0.4, 0.16, -5.5], opts: { mode: "stand", expr, prop, blink: blinkAt(t, 5) } });
const SELLER = (t: number, expr: FrontOpts["expr"]): ActorDef => ({ who: "seller", pos: [SX - 0.3, 0.16, -7.5], opts: { mode: "stand", expr, blink: blinkAt(t, 2) } });
add({ a: 53.9, b: 55.2, light: "street", dof: 18, whip: 1, focus: [SX + 0.4, 1.95, -5.5], cam: move({ pos: [SX - 0.5, 1.85, -3.2], look: [SX + 0.4, 1.95, -5.5], fov: 38 }, { pos: [SX - 0.3, 1.88, -3.6], look: [SX + 0.4, 1.96, -5.5], fov: 35 }), actors: (t) => [GRUMP(t, talk(t, "stern", "pained" as FrontOpts["expr"])), SELLER(t, "nervous"), ...crowd(t, 16, -1.5, 4)], fx: () => ({ warm: [[SX + 0.5, 3.0, -4.6], [SX - 1, 2.8, -3.5]] }), shadowR: 6 });
add({ a: 55.2, b: 56.3, light: "street", dof: 18, whip: -1, focus: [SX - 0.3, 1.95, -7.5], cam: move({ pos: [SX + 0.7, 1.95, -5.0], look: [SX - 0.3, 1.95, -7.5], fov: 38 }, { pos: [SX + 0.5, 1.95, -5.4], look: [SX - 0.3, 1.96, -7.5], fov: 35 }), actors: (t) => [SELLER(t, "nervous"), ...crowd(t, 12, -2, 2)], fx: () => ({ warm: [[SX + 0.5, 3.0, -4.6], [SX - 1, 2.8, -3.5]] }), shadowR: 6 });
add({ a: 56.3, b: 57.4, light: "street", dof: 8, focus: [SX + 0.4, 1.45, -5.5], cam: (t, u) => { const a = 1.0 - 0.5 * u, r = 4.0; return { pos: [SX + 0.1 + Math.sin(a) * r, 1.55, -6.4 + Math.cos(a) * r], look: [SX + 0.1, 1.45, -6.4], fov: 42 }; }, actors: (t) => [GRUMP(t, "stern", "point"), SELLER(t, "dazed"), ...crowd(t, 20, -1, 5)], fx: () => ({ warm: [[SX + 0.5, 3.0, -4.6], [SX - 1, 2.8, -3.5]] }), shadowR: 10 });
// 24 "But then, the government stepped in."
const reporters = (t: number): ActorDef[] => Array.from({ length: 24 }, (_, i) => { const r = Math.floor(i / 6), k = i % 6; return { who: "r" + i, pos: [PX - 4.9 + k * 1.95 + (r % 2) * 0.4, 0.2, 0.75 + r * 1.6] as V3, opts: { mode: "sit", back: true, expr: "neutral", prop: i % 3 === 0 ? "phoneHold" : null } as FrontOpts }; });
const GOV = (t: number, expr: FrontOpts["expr"], prop: FrontOpts["prop"] = null): ActorDef => ({ who: "gov", pos: [PODIUM[0] + 0.05, 0.4, PODIUM[2] - 0.55], opts: { mode: "stand", expr, prop, blink: blinkAt(t, 4) } });
add({ a: 57.4, b: 58.7, light: "press", dof: 0, whip: 1, cam: move({ pos: [PX + 4, 3.0, 10], look: [PX, 1.6, -4], fov: 46 }, { pos: [PX + 2.5, 2.4, 8.4], look: [PX, 1.7, -4], fov: 44 }), actors: (t) => [GOV(t, "stern"), ...reporters(t)], fx: () => ({ warm: [[PX, 2.6, -2], [PX - 3, 2.4, -1]] }), shadowR: 12 });
// 25 "They explained that buying the Moon online didn't actually make him its owner."
add({ a: 58.7, b: 59.9, light: "press", dof: 16, focus: [PODIUM[0], 2.0, PODIUM[2] - 0.55], cam: move({ pos: [PX + 0.9, 1.75, -1.2], look: [PX, 2.0, PODIUM[2] - 0.55], fov: 36 }, { pos: [PX + 0.6, 1.8, -1.5], look: [PX, 2.02, PODIUM[2] - 0.55], fov: 33 }), actors: (t) => [GOV(t, talk(t, "stern", "neutral"))], fx: () => ({ warm: [[PX + 0.5, 2.6, -2.4]] }), shadowR: 5 });
add({ a: 59.9, b: 60.8, light: "press", dof: 10, whip: -1, focus: [PX, 1.8, -4], cam: move({ pos: [PX - 3.5, 1.3, 5.5], look: [PX, 1.9, -4], fov: 42 }, { pos: [PX - 2.6, 1.35, 4.7], look: [PX, 1.95, -4], fov: 40 }), actors: (t) => [GOV(t, "stern", "point"), ...reporters(t)], fx: () => ({ warm: [[PX, 2.6, -2]] }), shadowR: 10 });
add({ a: 60.8, b: 61.9, light: "press", dof: 20, whip: 1, focus: [PODIUM[0], 2.0, PODIUM[2] - 0.55], cam: move({ pos: [PX - 0.6, 1.95, -1.4], look: [PX, 2.0, PODIUM[2] - 0.55], fov: 33 }, { pos: [PX - 0.45, 1.95, -1.7], look: [PX, 2.0, PODIUM[2] - 0.55], fov: 31 }), actors: (t) => [GOV(t, "stern", "point")], fx: () => ({ warm: [[PX - 0.4, 2.6, -2.4]] }), shadowR: 5 });
// 26 "Kevin was devastated."
add({ a: 61.9, b: 62.95, light: "close", dof: 22, whip: -1, focus: [CHAIR[0], 1.28, CHAIR[2] + 0.12], cam: move({ pos: [LX + 0.2, 1.55, LZ + 0.9], look: [CHAIR[0], 1.25, CHAIR[2] + 0.12], fov: 34 }, { pos: [LX + 0.1, 1.5, LZ + 0.6], look: [CHAIR[0], 1.25, CHAIR[2] + 0.12], fov: 31 }), actors: (t) => [KD(t, "pained" as FrontOpts["expr"], { headTilt: -10 })], shadowR: 4 });
// 27 "He had already spent his entire savings designing a luxury hotel on the Moon."
const [HXh, , HZh] = HOTEL;
add({ a: 62.95, b: 64.2, light: "space", dof: 0, whip: 1, cam: move({ pos: [HXh + 18, 3, HZh + 40], look: [HXh, 10, HZh], fov: 50 }, { pos: [HXh + 12, 4, HZh + 34], look: [HXh, 11, HZh], fov: 50 }), shadowR: 40 });
add({ a: 64.2, b: 65.3, light: "space", dof: 8, focus: [HXh, 1, HZh + 17], cam: move({ pos: [HXh - 6, 1.4, HZh + 25], look: [HXh + 1, 1.0, HZh + 15], fov: 46 }, { pos: [HXh - 3, 1.6, HZh + 25], look: [HXh + 3, 1.2, HZh + 15], fov: 46 }), actors: (t) => [{ who: "kevin", pos: [HXh + 1.2, 0, HZh + 22.5], opts: { mode: "stand", expr: "laugh", wave: W2(t, 2), blink: blinkAt(t, 1) } }], shadowR: 12 });
add({ a: 65.3, b: 66.6, light: "space", dof: 14, focus: [HXh + 1.2, 1.55, HZh + 22.5], cam: move({ pos: [HXh + 2.2, 1.2, HZh + 25.0], look: [HXh + 1.2, 1.7, HZh + 22.5], fov: 38 }, { pos: [HXh + 1.8, 1.25, HZh + 24.4], look: [HXh + 1.2, 1.72, HZh + 22.5], fov: 35 }), actors: (t) => [{ who: "kevin", pos: [HXh + 1.2, 0, HZh + 22.5], opts: { mode: "stand", expr: "grin", wave: 0.8, blink: blinkAt(t, 1) } }], shadowR: 8 });
// 28-29 "And the worst part? He couldn't even get a refund."
add({ a: 66.6, b: 67.35, light: "close", dof: 20, whip: -1, focus: [CHAIR[0], 1.3, CHAIR[2] + 0.12], cam: move({ pos: [LX - 0.4, 1.3, LZ + 0.8], look: [CHAIR[0], 1.32, CHAIR[2] + 0.12], fov: 34 }, { pos: [LX - 0.25, 1.3, LZ + 0.5], look: [CHAIR[0], 1.33, CHAIR[2] + 0.12], fov: 31 }), actors: (t) => [KD(t, "worried" as FrontOpts["expr"])], fx: () => ({ page: 2 }), shadowR: 4 });
add({ a: 67.35, b: 68.0, light: "close", dof: 12, focus: [LX, LY, LZ], cam: move({ pos: [LX - 0.15, 1.12, LZ - 0.52], look: [LX, LY, LZ], fov: 38 }, { pos: [LX - 0.05, 1.08, LZ - 0.38], look: [LX, LY - 0.02, LZ], fov: 33 }), fx: () => ({ page: 2 }), shadowR: 4 });
add({ a: 68.0, b: 68.6, light: "close", dof: 22, whip: 1, focus: [CHAIR[0], 1.3, CHAIR[2] + 0.12], cam: move({ pos: [LX + 0.1, 1.28, LZ + 0.6], look: [CHAIR[0], 1.3, CHAIR[2] + 0.12], fov: 32 }, { pos: [LX + 0.05, 1.29, LZ + 0.4], look: [CHAIR[0], 1.3, CHAIR[2] + 0.12], fov: 30 }), actors: (t) => [KD(t, "pained" as FrontOpts["expr"])], fx: () => ({ page: 2 }), shadowR: 4 });
// 30 "So now Kevin is back to his normal job."
const coworkers = (t: number): ActorDef[] => { const out: ActorDef[] = []; for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { if (i === 2 && j === 2) continue; const k = i * 4 + j; out.push({ who: "e" + (30 + k), pos: [OX - 10 + i * 5 - 0.2, 0.3, -8 + j * 5 + 0.1] as V3, opts: { mode: "sit", back: k % 3 !== 0, expr: (["neutral", "smile_closed", "dazed"] as const)[k % 3], blink: blinkAt(t, k) } as FrontOpts }); } return out; };
const KOFF = (t: number, expr: FrontOpts["expr"]): ActorDef => ({ who: "kevin", pos: [KC[0] - 0.2, 0.3, KC[2] + 0.1], opts: { mode: "sit", expr, blink: blinkAt(t, 1) } });
add({ a: 68.6, b: 69.5, light: "office", dof: 0, whip: -1, cam: move({ pos: [OX + 9, 3.0, 11], look: [OX - 2, 0.8, -4], fov: 50 }, { pos: [OX + 7, 2.6, 10.5], look: [OX - 2, 0.9, -4], fov: 48 }), actors: (t) => [KOFF(t, "dazed"), ...coworkers(t)], shadowR: 18 });
add({ a: 69.5, b: 70.4, light: "office", dof: 16, focus: [KC[0] - 0.2, 1.25, KC[2] + 0.1], cam: move({ pos: [KC[0] + 1.3, 1.5, KC[2] + 1.6], look: [KC[0] - 0.2, 1.3, KC[2] + 0.1], fov: 38 }, { pos: [KC[0] + 1.0, 1.5, KC[2] + 1.3], look: [KC[0] - 0.2, 1.3, KC[2] + 0.1], fov: 36 }), actors: (t) => [KOFF(t, "neutral"), ...coworkers(t).slice(0, 6)], shadowR: 6 });
// 31 "But every night, he looks up at the sky and whispers..."
add({ a: 70.4, b: 71.5, light: "night", dof: 10, whip: 1, focus: [WX - 0.6, 1.6, WZ + 0.9], cam: move({ pos: [WX - 0.2, 1.9, WZ + 3.2], look: [WX - 0.4, 2.6, WZ - 3], fov: 44 }, { pos: [WX - 0.3, 1.8, WZ + 2.5], look: [WX - 0.4, 2.9, WZ - 3], fov: 42 }), actors: (t) => [KWIN(t, "smile_closed", { back: true })], fx: () => ({ warm: [[WX, 2, WZ + 1.8]] }), shadowR: 5 });
add({ a: 71.5, b: 72.6, light: "close", dof: 18, focus: [WX - 0.6, 1.6, WZ + 0.9], cam: move({ pos: [WX + 0.5, 1.05, WZ + 2.2], look: [WX - 0.6, 1.7, WZ + 0.9], fov: 36 }, { pos: [WX + 0.35, 1.1, WZ + 1.9], look: [WX - 0.6, 1.72, WZ + 0.9], fov: 34 }), actors: (t) => [KWIN(t, "smile_closed", { headTilt: -8 })], fx: () => ({ warm: [[WX, 1.6, WZ + 1.8]] }), shadowR: 5 });
// 32 "That could have been a really expensive Airbnb."
add({ a: 72.6, b: 74.1, light: "close", dof: 22, whip: -1, focus: [WX - 0.6, 1.6, WZ + 0.9], cam: move({ pos: [WX - 0.3, 1.58, WZ + 2.2], look: [WX - 0.6, 1.62, WZ + 0.9], fov: 33 }, { pos: [WX - 0.45, 1.6, WZ + 1.75], look: [WX - 0.6, 1.62, WZ + 0.9], fov: 30 }), actors: (t) => [KWIN(t, talk(t, "smile", "smile_closed"), { headTilt: -6 })], fx: () => ({ warm: [[WX, 1.8, WZ + 1.8]] }), shadowR: 4 });
add({ a: 74.1, b: DURATION, light: "night", dof: 0, cam: move({ pos: [WX - 0.4, 1.7, WZ + 2.4], look: [WX - 0.2, 2.4, WZ - 5], fov: 44 }, { pos: [WX - 0.2, 2.2, WZ + 0.2], look: [MOON_APT[0] * 0.5, MOON_APT[1] * 0.6, MOON_APT[2]], fov: 40 }), actors: (t) => [KWIN(t, "smile_closed", { back: true })], shadowR: 6 });
void MOON_CITY;

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
