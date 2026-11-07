// Shot plan for "Why India Celebrates Diwali Differently" (voice: Kokoro am_michael @1.35, the owner's script; line
// and word times in shorts/diwali2/voice/). 86 s, 30 fps. Reference style: close-ups, an angle change every ~1 s,
// the camera always moving, whip pans on beat changes, depth of field on close shots.
// Only the opening (0 - 10.5 s) is planned so far: it is the approval clip.
import { LightName, HX, AX, DOOR, DIYA, WATER_Y, BOAT_Z, Burst } from "./world";
import { FrontOpts, Outfit } from "../dead/toon";

export const FPS = 30;
export const DURATION = 86.5;
export const TOTAL = Math.round(DURATION * FPS);

export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
export type ActorDef = { who: string; pos: V3; opts: FrontOpts; tint?: V3; scale?: number; roll?: number; yaw?: number };
export type Fx = { warm?: V3[]; boatX?: number; bursts?: Burst[] };
export type Shot = { id: number; a: number; b: number; cam: (t: number, u: number) => Cam; actors?: (t: number) => ActorDef[]; light: LightName; dof: number; focus?: V3;
  whip?: -1 | 1; fx?: (t: number) => Fx; shadowR?: number };

const FAIR = "#f0c9a0", TAN = "#d9a679", DARK = "#a8754f", WHEAT = "#e8b88a", BLUE = "#4f86d9";
const KURTA = ["#2a4a9a", "#2e7a4a", "#7a2a6a", "#d98a2a", "#1f6a7a", "#a8402a", "#5a3a8a", "#c9962e"], SAREE = ["#d1202f", "#e8538a", "#2e9a5a", "#f2a020", "#8a2a9a", "#2a6ab0", "#e86a2a"];
export const outfitOf = (who: string): Outfit => {
  const i = parseInt(who.replace(/^\D+/, "")) || 0;
  switch (who) {
    case "dadi": return { jacket: "#f4ead6", pants: "#f4ead6", dress: "#f4ead6", boots: "#7a4a2a", hat: "longHair", hairStyle: "bun", hair: "#e0e0e0", jewel: true, dupatta: "#e8b84a", sash: "#d1202f", bindi: true, skin: TAN };
    case "mom": return { jacket: "#d1202f", pants: "#2e9a5a", dress: "#2e9a5a", boots: "#7a4a2a", hat: "longHair", hairStyle: "long", hair: "#1a1414", jewel: true, dupatta: "#e8b84a", sash: "#e8b84a", bindi: true, skin: WHEAT };
    case "dad": return { jacket: "#f4f1ea", pants: "#f4f1ea", boots: "#7a4a2a", hat: "turban", cap: "#e86a2a", moustache: "#1a1414", sash: "#d1202f", buttons: "#d1202f", skin: TAN };
    case "dada": return { jacket: "#f4ead6", pants: "#f4ead6", boots: "#7a4a2a", hat: "hair", hair: "#e8e8e8", beard: "#e8e8e8", moustache: "#e8e8e8", buttons: "#e8b84a", skin: TAN, build: "stout" };
    case "kid": return { jacket: "#2a6ab0", pants: "#f4f1ea", boots: "#5a3a22", hat: "hair", hair: "#1a1414", skin: TAN, build: "kid" };
    case "girl": return { jacket: "#e8538a", pants: "#f2c14e", dress: "#f2c14e", boots: "#5a3a22", hat: "longHair", hairStyle: "ponytail", hair: "#1a1414", bindi: true, skin: WHEAT, build: "kid" };
    case "raam": return { jacket: "#f2c14e", pants: "#f2c14e", boots: "#e8b84a", hat: "crown", hair: "#1a1414", sash: "#d1202f", buttons: "#e8b84a", skin: BLUE };
    case "seeta": return { jacket: "#e8b84a", pants: "#d1202f", dress: "#d1202f", boots: "#e8b84a", hat: "longHair", hairStyle: "long", hair: "#1a1414", jewel: true, dupatta: "#f2a020", sash: "#e8b84a", bindi: true, skin: FAIR };
    case "lakshman": return { jacket: "#e86a2a", pants: "#f2c14e", boots: "#e8b84a", hat: "crown", hair: "#1a1414", sash: "#2e7a4a", buttons: "#e8b84a", skin: FAIR };
  }
  // townsfolk: women in sarees (jewellery, dupatta), men in kurtas and turbans/caps, some kids
  const w = i % 3 === 1;
  return w ? { jacket: SAREE[(i + 3) % 7], pants: SAREE[i % 7], dress: SAREE[i % 7], boots: "#5a3a22", hat: "longHair", hairStyle: (["long", "bun", "ponytail", "bun"] as const)[i % 4], hair: "#1a1414", bindi: true, jewel: true, dupatta: SAREE[(i + 1) % 7], sash: "#e8b84a", skin: [TAN, WHEAT, DARK, FAIR][i % 4], build: i % 7 === 4 ? "kid" : "adult" }
    : { jacket: KURTA[i % 8], pants: "#f4f1ea", boots: "#5a3a22", hat: i % 5 === 4 ? "hair" : i % 5 === 2 ? "cap" : "turban", cap: SAREE[(i + 2) % 7], hair: "#1a1414", moustache: i % 2 ? "#2a1a14" : undefined, beard: i % 7 === 3 ? "#d9d9d9" : undefined, skin: [TAN, WHEAT, DARK, FAIR][i % 4], build: i % 9 === 4 ? "kid" : "adult" };
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const t = clamp01(x); return t * t * t * (t * (6 * t - 15) + 10); };
const L = (a: number, b: number, t: number) => a + (b - a) * t;
const LV = (a: V3, b: V3, t: number): V3 => [L(a[0], b[0], t), L(a[1], b[1], t), L(a[2], b[2], t)];
/** a constant-speed move (only the ends ease a little, so the camera never stops at a cut) */
const move = (A: Cam, B: Cam) => (_t: number, u: number): Cam => { const s = 0.75 * u + 0.25 * smooth(u); return { pos: LV(A.pos, B.pos, s), look: LV(A.look, B.look, s), fov: L(A.fov, B.fov, s), roll: L(A.roll ?? 0, B.roll ?? 0, s) }; };
export const blinkAt = (t: number, seed: number) => { const f = Math.round(t * FPS), period = 40 + ((seed * 13) % 26), ph = (f + seed * 7) % period; return ph < 4 ? [0.5, 1, 1, 0.5][ph] : 0; };
const talk = (t: number, open: FrontOpts["expr"] = "grin", closed: FrontOpts["expr"] = "smile_closed") => (Math.floor(t * 9) % 3 === 0 ? closed : open);

const S: Shot[] = [];
const add = (s: Omit<Shot, "id">) => S.push({ id: S.length + 1, ...s });

// ---------------- crowds and fixed groups ----------------
const FAM_Z = DOOR[2] + 2.1;
/** the family on the doorstep: dadi, dad, kid (front), mom, dada */
const family = (t: number, mood: Partial<Record<string, FrontOpts["expr"]>> = {}): ActorDef[] => [
  { who: "dadi", pos: [HX - 1.45, 0, FAM_Z - 0.1], opts: { mode: "stand", expr: mood.dadi ?? "smile", prop: "diya", blink: blinkAt(t, 1) } },
  { who: "dad", pos: [HX - 0.55, 0, FAM_Z - 0.3], opts: { mode: "stand", expr: mood.dad ?? "smile_closed", blink: blinkAt(t, 2) } },
  { who: "kid", pos: [HX + 0.15, 0, FAM_Z + 0.45], opts: { mode: "stand", expr: mood.kid ?? "grin", prop: "sparkler", blink: blinkAt(t, 3) } },
  { who: "mom", pos: [HX + 0.85, 0, FAM_Z - 0.3], opts: { mode: "stand", expr: mood.mom ?? "smile", blink: blinkAt(t, 4) } },
  { who: "dada", pos: [HX + 1.65, 0, FAM_Z - 0.1], opts: { mode: "stand", expr: mood.dada ?? "smile_closed", blink: blinkAt(t, 5) } },
];
/** neighbours in the lane: strollers, kids with sparklers, people at doors */
const lane = (t: number, n = 18): ActorDef[] => Array.from({ length: n }, (_, i) => {
  const x0 = -28 + ((i * 37) % 56), z = 0.6 + (i % 4) * 2.2, dir = i % 2 ? 1 : -1, walk = i % 3 !== 0;
  if (Math.abs(x0) < 3.2 && z < 3) return { who: "p" + (40 + i), pos: [x0 + 6, 0, z + 4] as V3, opts: { mode: "stand", expr: "smile" } as FrontOpts };
  return { who: "p" + i, pos: [x0 + (walk ? dir * 0.9 * (t % 30) : 0), 0, z] as V3,
    opts: { mode: walk ? "stroll" : "stand", phase: t * 1.4 + i * 0.4, expr: (["smile", "grin", "smile_closed", "laugh"] as const)[i % 4], prop: i % 4 === 1 ? "sparkler" : i % 5 === 2 ? "diya" : null, blink: blinkAt(t, i) } as FrontOpts };
});
/** people on the Ayodhya ghats holding diyas */
const ghat = (t: number, n = 30, x0 = AX - 24, span = 48): ActorDef[] => Array.from({ length: n }, (_, i) => {
  const k = 2 + (i % 4) * 2, y = WATER_Y + k * 0.32, z = -k * 0.75 - 0.35;
  return { who: "p" + (60 + i), pos: [x0 + ((i * 29) % n) * (span / n) + (k % 3) * 0.3, y, z] as V3, opts: { mode: "stand", expr: (["smile", "grin", "laugh", "smile_closed"] as const)[i % 4], prop: i % 3 === 0 ? "diya" : null, wave: i % 5 === 2 ? 0.5 + 0.5 * Math.sin(t * 9 + i) : undefined, blink: blinkAt(t, i) } as FrontOpts };
});
/** the swan boat glides along the river */
export const boatX = (t: number) => AX - 13 + 1.15 * t;
const DECK = WATER_Y + 0.2 + 1.03;
const onBoat = (t: number): ActorDef[] => { const x = boatX(t); return [
  { who: "raam", pos: [x + 0.45, DECK, BOAT_Z + 0.15], opts: { mode: "stand", expr: "smile", wave: 0.6 + 0.4 * Math.sin(t * 3), blink: blinkAt(t, 7) } },
  { who: "seeta", pos: [x - 0.55, DECK, BOAT_Z + 0.05], opts: { mode: "stand", expr: "smile_closed", blink: blinkAt(t, 8) } },
  { who: "lakshman", pos: [x - 2.6, DECK, BOAT_Z - 0.4], opts: { mode: "stand", expr: "smile", prop: "bow", blink: blinkAt(t, 9) } },
]; };

// ================= SHOTS (the approval clip: 0 - 10.5 s) =================
// 0 "Imagine celebrating the same festival, but for completely different reasons."
add({ a: 0, b: 1.3, light: "home", dof: 22, focus: [DIYA[0] + 0.3, 0.35, DIYA[2]], cam: move({ pos: [DIYA[0] + 1.1, 1.15, DIYA[2] + 2.0], look: [DIYA[0] + 0.3, 0.5, DIYA[2]], fov: 42 }, { pos: [DIYA[0] + 0.6, 1.25, DIYA[2] + 1.75], look: [DIYA[0] + 0.25, 0.6, DIYA[2] - 0.2], fov: 40 }),
  actors: (t) => family(t), fx: () => ({ warm: [[DIYA[0] + 0.6, 0.9, DIYA[2] + 0.4]] }), shadowR: 8 });
add({ a: 1.3, b: 2.35, light: "home", dof: 9, focus: [HX, 1.3, FAM_Z], cam: move({ pos: [HX + 0.4, 1.25, 3.6], look: [HX, 1.45, FAM_Z - 0.4], fov: 44 }, { pos: [HX + 0.15, 1.35, 2.5], look: [HX, 1.5, FAM_Z - 0.4], fov: 42 }),
  actors: (t) => family(t), fx: () => ({ warm: [[DIYA[0] + 0.6, 0.9, DIYA[2] + 0.4]] }), shadowR: 10 });
add({ a: 2.35, b: 2.98, light: "close", dof: 16, whip: 1, cam: move({ pos: [HX - 0.05, 1.6, FAM_Z + 2.3], look: [HX - 0.55, 1.6, FAM_Z - 0.3], fov: 36 }, { pos: [HX - 0.2, 1.62, FAM_Z + 1.95], look: [HX - 0.55, 1.62, FAM_Z - 0.3], fov: 34 }),
  actors: (t) => family(t, { dad: talk(t, "laugh", "grin") }), fx: () => ({ warm: [[HX - 0.2, 1.6, FAM_Z + 1]] }), shadowR: 6 });
add({ a: 2.98, b: 3.75, light: "close", dof: 16, whip: -1, cam: move({ pos: [HX - 0.9, 1.5, FAM_Z + 2.2], look: [HX - 1.45, 1.52, FAM_Z - 0.1], fov: 36 }, { pos: [HX - 1.15, 1.52, FAM_Z + 1.9], look: [HX - 1.45, 1.54, FAM_Z - 0.1], fov: 34 }),
  actors: (t) => family(t, { dadi: talk(t, "smile", "smile_closed"), dad: "smile" }), fx: () => ({ warm: [[HX - 1.2, 1.6, FAM_Z + 1]] }), shadowR: 6 });
// 1 "Welcome to India, where even Diwali has multiple storylines."
const FW1: Burst[] = [[22, 17, 3, 3.8, 0], [34, 22, 0, 4.25, 1], [16, 21, -2, 4.7, 2], [40, 18, 5, 5.15, 3], [26, 24, 2, 5.6, 4], [12, 19, 4, 6.05, 0], [30, 20, -1, 6.5, 2]];
add({ a: 3.75, b: 5.35, light: "home", dof: 0, whip: 1, cam: move({ pos: [HX - 22, 1.6, 2.4], look: [HX + 6, 3.5, 1.6], fov: 46 }, { pos: [HX - 20, 7.5, 6.5], look: [HX + 8, 9.5, -6], fov: 50 }),
  actors: (t) => lane(t, 34), fx: () => ({ bursts: FW1 }), shadowR: 26 });
add({ a: 5.35, b: 6.95, light: "home", dof: 10, focus: [HX + 3.6, 1.0, 2.6], cam: move({ pos: [HX + 6.8, 0.75, 4.8], look: [HX + 2.4, 1.05, 2.4], fov: 42 }, { pos: [HX + 5.2, 0.85, 4.9], look: [HX + 1.0, 1.15, 2.2], fov: 40 }),
  actors: (t) => [{ who: "girl", pos: [HX + 3.6, 0, 2.6], opts: { mode: "stand", expr: "laugh", prop: "sparkler", blink: blinkAt(t, 3) } }, { who: "p71", pos: [HX + 2.2, 0, 2.0], opts: { mode: "stand", expr: "grin", prop: "sparkler" } }, ...lane(t, 18)],
  fx: () => ({ bursts: FW1, warm: [[HX + 3.4, 1.3, 2.8]] }), shadowR: 10 });
// 2 "Let's start with Ayodhya."
add({ a: 6.95, b: 8.3, light: "ayodhya", dof: 0, whip: -1, cam: move({ pos: [AX - 26, 2.4, 44], look: [AX - 2, 6, -14], fov: 48 }, { pos: [AX - 18, 3.2, 36], look: [AX, 6.5, -14], fov: 48 }),
  actors: (t) => [...onBoat(t), ...ghat(t, 40, AX - 40, 80)], fx: (t) => ({ boatX: boatX(t), bursts: [[AX - 10, 30, -40, 7.2, 1], [AX + 14, 34, -46, 7.8, 0]] }), shadowR: 40 });
// 3 "Around twenty five hundred years ago... well,"
add({ a: 8.3, b: 10.5, light: "ayodhya", dof: 12, focus: [0, 0, 0], cam: (t, u) => { const x = boatX(t); return move({ pos: [x + 3.6, DECK + 1.6, BOAT_Z + 5.4], look: [x - 0.1, DECK + 1.3, BOAT_Z], fov: 40 }, { pos: [x + 2.2, DECK + 1.5, BOAT_Z + 4.4], look: [x - 0.1, DECK + 1.35, BOAT_Z], fov: 38 })(t, u); },
  actors: (t) => [...onBoat(t), ...ghat(t, 30, AX - 20, 40)], fx: (t) => ({ boatX: boatX(t), warm: [[boatX(t), DECK + 2.6, BOAT_Z + 1.5]] }), shadowR: 12 });
// the focus of the boat shot follows the boat
S[S.length - 1].focus = undefined;

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
