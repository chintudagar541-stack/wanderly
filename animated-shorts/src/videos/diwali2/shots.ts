// Shot plan for "Why India Celebrates Diwali Differently" (voice: Kokoro am_michael @1.35, the owner's script; line
// and word times in shorts/diwali2/voice/). 86 s, 30 fps. Reference style: close-ups, an angle change every ~1 s,
// the camera always moving, whip pans on beat changes, depth of field on close shots.
// Only the opening (0 - 10.5 s) is planned so far: it is the approval clip.
import { LightName, HX, AX, VX, DOOR, DIYA, WATER_Y, BOAT_Z, Burst, TEMPLE, GATE, PANDAL, IDOL, EFFIGY } from "./world";
import { FrontOpts, Outfit } from "../dead/toon";

export const FPS = 30;
export const DURATION = 86.5;
export const TOTAL = Math.round(DURATION * FPS);

export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
export type ActorDef = { who: string; pos: V3; opts: FrontOpts; tint?: V3; scale?: number; roll?: number; yaw?: number };
export type Fx = { warm?: V3[]; boatX?: number; bursts?: Burst[]; gate?: number; burn?: number };
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
    case "kali": return { jacket: "#e8b84a", pants: "#d1202f", dress: "#d1202f", boots: "#e8b84a", hat: "longHair", hairStyle: "long", hair: "#0a0a12", jewel: true, dupatta: "#f2a020", sash: "#e8b84a", skin: "#3a4aa8" };
    case "naraka": return { jacket: "#7a2a8a", pants: "#f2c14e", boots: "#3a2a1a", hat: "crown", hair: "#1a1a1a", moustache: "#1a1a1a", beard: "#1a1a1a", sash: "#d1202f", buttons: "#e8b84a", skin: "#3aa84a", build: "stout" };
    case "krishna": return { jacket: "#f2c14e", pants: "#f2c14e", boots: "#e8b84a", hat: "crown", hair: "#1a1414", sash: "#2e7a4a", buttons: "#e8b84a", skin: BLUE };
    case "lakshman": return { jacket: "#e86a2a", pants: "#f2c14e", boots: "#e8b84a", hat: "crown", hair: "#1a1414", sash: "#2e7a4a", buttons: "#e8b84a", skin: FAIR };
  }
  if (/^k\d/.test(who)) return { jacket: KURTA[(i * 3) % 8], pants: "#f4f1ea", boots: "#7a4a2a", hat: "turban", cap: SAREE[i % 7], beard: i % 3 ? "#1a1414" : "#d9d9d9", moustache: "#1a1414", sash: "#e8b84a", buttons: "#e8b84a", skin: [TAN, WHEAT, FAIR, DARK][i % 4], build: i % 5 === 2 ? "stout" : "adult" };
  if (/^s\d/.test(who)) return i % 3 === 1 ? { jacket: SAREE[(i + 2) % 7], pants: "#f4f1ea", dress: SAREE[(i + 4) % 7], boots: "#5a3a22", hat: "longHair", hairStyle: "long", hair: "#1a1414", dupatta: SAREE[(i + 1) % 7], jewel: true, skin: [WHEAT, FAIR, TAN][i % 3] }
    : { jacket: ["#f4f1ea", "#2a4a9a", "#e86a2a", "#f4f1ea"][i % 4], pants: "#f4f1ea", boots: "#5a3a22", hat: "turban", cap: ["#2a3a8a", "#e86a2a", "#f4f1ea", "#f2c14e"][i % 4], beard: "#1a1414", moustache: "#1a1414", skin: [WHEAT, FAIR, TAN][i % 3] };
  if (/^pr\d/.test(who)) return { jacket: "#e86a2a", pants: "#f4f1ea", boots: "#7a4a2a", hat: "hair", hair: "#1a1414", sash: "#f2c14e", skin: TAN };
  if (/^b\d/.test(who) && i % 2 === 1) return { jacket: "#d1202f", pants: "#f4f1ea", dress: "#f4f1ea", boots: "#5a3a22", hat: "longHair", hairStyle: "bun", hair: "#1a1414", jewel: true, bindi: true, dupatta: "#d1202f", sash: "#d1202f", skin: [WHEAT, TAN, FAIR][i % 3] };
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

// ================= the rest of the video (10.5 s - end) =================
const W = (t: number, i: number) => 0.5 + 0.5 * Math.sin(t * 9 + i);
const FWA: Burst[] = [[AX - 12, 30, -40, 17.7, 1], [AX + 10, 34, -46, 18.0, 0], [AX - 2, 38, -50, 18.35, 2], [AX + 20, 30, -42, 18.7, 3], [AX - 22, 33, -44, 19.0, 4], [AX + 4, 36, -48, 19.3, 0]];
// 3 (cont.) "well, according to the Ramayana tradition, Lord Rama returned home after fourteen years of exile, and the people welcomed him by lighting thousands of diyas."
add({ a: 10.5, b: 12.2, light: "ayodhya", dof: 18, whip: 1, cam: (t, u) => { const x = boatX(t); return move({ pos: [x + 1.6, DECK + 1.75, BOAT_Z + 2.6], look: [x + 0.45, DECK + 1.6, BOAT_Z + 0.15], fov: 36 }, { pos: [x + 1.2, DECK + 1.7, BOAT_Z + 2.2], look: [x + 0.45, DECK + 1.62, BOAT_Z + 0.15], fov: 34 })(t, u); },
  actors: (t) => [...onBoat(t), ...ghat(t, 20, AX - 20, 40)], fx: (t) => ({ boatX: boatX(t), warm: [[boatX(t) + 1, DECK + 2, BOAT_Z + 1.5]] }), shadowR: 8 });
add({ a: 12.2, b: 13.4, light: "ayodhya", dof: 0, cam: (t, u) => { const x = boatX(t); return move({ pos: [x + 7, WATER_Y + 1.7, BOAT_Z + 8], look: [x, DECK + 1.6, BOAT_Z - 1], fov: 44 }, { pos: [x + 5, WATER_Y + 1.8, BOAT_Z + 7.5], look: [x - 0.5, DECK + 1.7, BOAT_Z - 1], fov: 44 })(t, u); },
  actors: (t) => [...onBoat(t), ...ghat(t, 40, AX - 30, 60)], fx: (t) => ({ boatX: boatX(t) }), shadowR: 16 });
add({ a: 13.4, b: 14.6, light: "ayodhya", dof: 16, whip: -1, cam: (t, u) => { const x = boatX(t); return move({ pos: [x - 1.0, DECK + 1.7, BOAT_Z + 3.4], look: [x - 1.6, DECK + 1.5, BOAT_Z - 0.2], fov: 38 }, { pos: [x - 1.3, DECK + 1.7, BOAT_Z + 3.0], look: [x - 1.7, DECK + 1.5, BOAT_Z - 0.2], fov: 36 })(t, u); },
  actors: (t) => onBoat(t), fx: (t) => ({ boatX: boatX(t), warm: [[boatX(t) - 1, DECK + 2, BOAT_Z + 1.5]] }), shadowR: 8 });
add({ a: 14.6, b: 15.9, light: "ayodhya", dof: 10, whip: 1, focus: [AX + 2, WATER_Y + 2.2, -3], cam: move({ pos: [AX - 4, WATER_Y + 2.6, 4.5], look: [AX + 2, WATER_Y + 2.4, -3.5], fov: 44 }, { pos: [AX - 1, WATER_Y + 2.7, 4.2], look: [AX + 4, WATER_Y + 2.5, -3.5], fov: 44 }),
  actors: (t) => ghat(t, 52, AX - 8, 22).map((a, i) => ({ ...a, opts: { ...a.opts, wave: W(t, i), expr: (["laugh", "grin", "smile"] as const)[i % 3] } })), shadowR: 12 });
add({ a: 15.9, b: 16.75, light: "close", dof: 20, focus: [AX + 1, WATER_Y + 1.6, -1.6], cam: move({ pos: [AX + 1.7, WATER_Y + 2.4, 0.4], look: [AX + 1, WATER_Y + 2.2, -1.6], fov: 36 }, { pos: [AX + 1.5, WATER_Y + 2.3, 0.2], look: [AX + 1, WATER_Y + 2.1, -1.6], fov: 34 }),
  actors: (t) => [{ who: "p61", pos: [AX + 1, WATER_Y + 0.64, -1.6], opts: { mode: "stand", expr: "smile", prop: "diya", blink: blinkAt(t, 3) } }, ...ghat(t, 20, AX - 6, 14)], fx: () => ({ warm: [[AX + 1.2, WATER_Y + 1.6, -1.0]] }), shadowR: 6 });
add({ a: 16.75, b: 17.6, light: "ayodhya", dof: 0, cam: move({ pos: [AX + 6, WATER_Y + 1.5, 6], look: [AX - 10, WATER_Y + 1.5, -2], fov: 46 }, { pos: [AX + 6, WATER_Y + 9, 10], look: [AX - 14, WATER_Y, -4], fov: 48 }), actors: (t) => ghat(t, 40, AX - 40, 70), shadowR: 30 });
// 4 "Basically, the biggest homecoming party ever."
add({ a: 17.6, b: 19.6, light: "ayodhya", dof: 0, whip: -1, cam: move({ pos: [AX + 6, 2.5, 40], look: [AX, 14, -20], fov: 50 }, { pos: [AX + 2, 6, 30], look: [AX, 16, -20], fov: 52 }), actors: (t) => [...onBoat(t), ...ghat(t, 50, AX - 50, 100)], fx: (t) => ({ boatX: boatX(t), bursts: FWA }), shadowR: 40 });

// 5-6 "Now travel to Amritsar. Here, the same day has another important meaning."
const [TX, , TZ] = TEMPLE;
const FWM: Burst[] = [[TX - 14, 30, TZ - 30, 28.6, 0], [TX + 12, 34, TZ - 36, 29.0, 1], [TX, 38, TZ - 40, 29.4, 2], [TX - 22, 28, TZ - 24, 29.8, 3], [TX + 24, 32, TZ - 30, 30.2, 4], [TX - 6, 40, TZ - 44, 30.6, 0], [TX + 6, 36, TZ - 34, 31.0, 1], [TX - 16, 34, TZ - 38, 31.4, 2]];
const devotees = (t: number, n = 16, x0 = TX - 12, span = 24, z = TZ + 35.8): ActorDef[] => Array.from({ length: n }, (_, i) => ({ who: "s" + i, pos: [x0 + ((i * 7) % n) * (span / n) + (i % 2) * 0.4, 0.1, z + (i % 3) * 0.9] as V3,
  opts: { mode: i % 4 === 0 ? "stroll" : "stand", phase: t * 1.2 + i, expr: (["smile", "smile_closed", "grin"] as const)[i % 3], prop: i % 3 === 0 ? "diya" : null, blink: blinkAt(t, i) } as FrontOpts }));
add({ a: 19.6, b: 21.0, light: "amritsar", dof: 0, whip: 1, cam: move({ pos: [TX - 2.6, 2.6, TZ + 39], look: [TX, 3.2, TZ], fov: 48 }, { pos: [TX - 1.6, 2.7, TZ + 38], look: [TX, 3.6, TZ], fov: 46 }), actors: (t) => Array.from({ length: 16 }, (_, i) => ({ who: "s" + (20 + i), pos: [TX + ((i % 3) - 1) * 1.1 + (i % 2) * 0.2, 0.2, TZ + 34 - i * 1.7 - 0.5 * (t - 19.6)] as V3, opts: { mode: "stroll", back: i % 4 !== 1, phase: t * 1.2 + i, expr: "smile", prop: i % 4 === 1 ? "diya" : null } as FrontOpts })), shadowR: 30 });
add({ a: 21.0, b: 22.9, light: "amritsar", dof: 12, focus: [TX + 3, 1.6, TZ + 36.5], cam: move({ pos: [TX + 7, 1.6, TZ + 40.8], look: [TX + 2, 1.7, TZ + 36.2], fov: 40 }, { pos: [TX + 5.5, 1.65, TZ + 40.6], look: [TX + 0.5, 1.75, TZ + 36.2], fov: 38 }), actors: (t) => devotees(t, 16, TX - 4, 12), shadowR: 10 });
// 7 "It marks Bandi Chhor Divas, when Guru Hargobind Ji was released from imprisonment along with fifty two other kings."
const [GXg, , GZ] = GATE;
const kings = (t: number, z0: number, n = 52, sp = 0.9): ActorDef[] => Array.from({ length: n }, (_, i) => { const row = Math.floor(i / 2), side = i % 2 ? 1 : -1;
  return { who: "k" + i, pos: [GXg + side * 0.75 + Math.sin(row * 1.3) * 0.1, 0, z0 - row * 1.35 + sp * t] as V3, opts: { mode: "march", phase: t * 1.6 + i * 0.3, expr: (["smile", "relief", "smile_closed", "grin"] as const)[i % 4], blink: blinkAt(t, i) } as FrontOpts }; });
add({ a: 22.9, b: 24.4, light: "gwalior", dof: 0, whip: -1, cam: move({ pos: [GXg - 16, 2, GZ + 42], look: [GXg, 12, GZ], fov: 50 }, { pos: [GXg - 10, 3, GZ + 34], look: [GXg, 13, GZ], fov: 50 }), fx: () => ({ gate: 0 }), shadowR: 40 });
add({ a: 24.4, b: 25.7, light: "gwalior", dof: 0, cam: move({ pos: [GXg + 2, 1.4, GZ + 16], look: [GXg, 6, GZ], fov: 46 }, { pos: [GXg + 1.2, 1.3, GZ + 13], look: [GXg, 6.2, GZ], fov: 46 }), fx: (t) => ({ gate: smooth((t - 24.5) / 1.1) }), shadowR: 20 });
add({ a: 25.7, b: 27.1, light: "gwalior", dof: 8, whip: 1, cam: move({ pos: [GXg - 2.4, 0.8, GZ + 9], look: [GXg, 2.2, GZ + 2], fov: 42 }, { pos: [GXg - 1.8, 0.85, GZ + 8], look: [GXg, 2.3, GZ + 2], fov: 42 }), actors: (t) => kings(t - 25.7, GZ + 1.5, 12, 1.1), fx: () => ({ gate: 1 }), shadowR: 14 });
add({ a: 27.1, b: 28.5, light: "gwalior", dof: 10, focus: [GXg, 1.5, GZ + 12], cam: move({ pos: [GXg + 1.8, 1.7, GZ + 17], look: [GXg, 1.6, GZ + 8], fov: 40 }, { pos: [GXg + 1.5, 1.75, GZ + 18.4], look: [GXg, 1.65, GZ + 9], fov: 40 }), actors: (t) => kings(t - 27.1, GZ + 13, 52, 1.1), fx: () => ({ gate: 1 }), shadowR: 20 });
// 8 "And the Golden Temple lights up like someone just turned on the entire universe."
add({ a: 28.5, b: 30.0, light: "amritsar", dof: 0, whip: -1, cam: move({ pos: [TX + 5, 2.2, TZ + 24], look: [TX, 11, TZ], fov: 48 }, { pos: [TX + 3.5, 2.4, TZ + 21], look: [TX, 12, TZ], fov: 48 }), fx: () => ({ bursts: FWM }), shadowR: 24 });
add({ a: 30.0, b: 32.2, light: "amritsar", dof: 0, cam: move({ pos: [TX, 3, TZ + 38], look: [TX, 12, TZ - 10], fov: 50 }, { pos: [TX, 16, TZ + 46], look: [TX, 16, TZ - 20], fov: 56 }), actors: (t) => devotees(t, 24, TX - 20, 40), fx: () => ({ bursts: FWM }), shadowR: 40 });

// 9 "Next stop, Kolkata."
const [KXp, , PZ] = PANDAL;
const bengal = (t: number, n = 22, z0 = PZ + 4, span = 30): ActorDef[] => Array.from({ length: n }, (_, i) => ({ who: "b" + i, pos: [KXp + ((i * 13) % 11 - 5) * 0.9, 0, z0 + ((i * 7) % n) * (span / n)] as V3,
  opts: { mode: i % 3 === 0 ? "stand" : "stroll", phase: t * 1.3 + i * 0.5, expr: (["smile", "grin", "laugh", "smile_closed"] as const)[i % 4], back: i % 5 === 0, prop: i % 6 === 1 ? "diya" : null, blink: blinkAt(t, i) } as FrontOpts }));
add({ a: 32.2, b: 33.4, light: "kolkata", dof: 0, whip: 1, cam: move({ pos: [KXp + 1, 1.8, PZ + 60], look: [KXp, 6, PZ], fov: 48 }, { pos: [KXp + 0.6, 2.0, PZ + 48], look: [KXp, 6.5, PZ], fov: 48 }), actors: (t) => bengal(t, 26, PZ + 20, 30), shadowR: 30 });
// 10 "Forget the usual Lakshmi Puja for a moment."
add({ a: 33.4, b: 35.2, light: "close", dof: 14, whip: -1, cam: move({ pos: [HX - 0.6, 1.5, FAM_Z + 2.6], look: [HX - 1.2, 1.4, FAM_Z - 0.1], fov: 40 }, { pos: [HX - 0.9, 1.5, FAM_Z + 2.2], look: [HX - 1.3, 1.4, FAM_Z - 0.1], fov: 38 }),
  actors: (t) => family(t, { dadi: t < 34.4 ? "smile" : "dazed", mom: "smile_closed", dad: t < 34.4 ? "smile" : "nervous" }), fx: () => ({ warm: [[HX - 1.2, 1.6, FAM_Z + 1]] }), shadowR: 6 });
// 11 "Here, Diwali night is famous for Kali Puja."
add({ a: 35.2, b: 37.5, light: "kolkata", dof: 0, whip: 1, cam: move({ pos: [KXp - 3, 1.2, PZ + 22], look: [KXp, 10, PZ], fov: 50 }, { pos: [KXp - 1.5, 1.5, PZ + 15], look: [KXp, 11, PZ], fov: 52 }), actors: (t) => bengal(t, 24, PZ + 3, 14), shadowR: 20 });
// 12 "People worship Goddess Kali, the powerful goddess associated with protection and the destruction of evil."
const KALI = (t: number, expr: FrontOpts["expr"] = "stern"): ActorDef => ({ who: "kali", pos: [IDOL[0], IDOL[1] + 0.1, IDOL[2]], scale: 2.0, opts: { mode: "stand", expr, prop: "spear", blink: blinkAt(t, 9) } });
const inside = (t: number): ActorDef[] => Array.from({ length: 14 }, (_, i) => ({ who: "b" + (30 + i), pos: [KXp - 4 + (i % 7) * 1.3, 0.4, PZ - 1 + Math.floor(i / 7) * 1.4] as V3, opts: { mode: "stand", back: true, expr: "smile", blink: blinkAt(t, i) } as FrontOpts }));
add({ a: 37.5, b: 39.0, light: "kolkata", dof: 8, focus: [KXp, 4, IDOL[2]], cam: move({ pos: [KXp + 1, 2.2, PZ + 3.2], look: [KXp, 4, IDOL[2]], fov: 44 }, { pos: [KXp + 0.6, 2.4, PZ + 1.8], look: [KXp, 4.2, IDOL[2]], fov: 44 }), actors: (t) => [KALI(t), ...inside(t)], fx: () => ({ warm: [[KXp, 3, IDOL[2] + 2], [KXp - 3, 2, PZ - 2]] }), shadowR: 12 });
add({ a: 39.0, b: 40.6, light: "kolkata", dof: 12, whip: -1, cam: move({ pos: [KXp + 0.5, 3.0, IDOL[2] + 4.2], look: [KXp, 5.0, IDOL[2]], fov: 38 }, { pos: [KXp + 0.3, 3.2, IDOL[2] + 3.5], look: [KXp, 5.2, IDOL[2]], fov: 36 }), actors: (t) => [KALI(t)], fx: () => ({ warm: [[KXp, 3.5, IDOL[2] + 2]] }), shadowR: 8 });
add({ a: 40.6, b: 42.4, light: "kolkata", dof: 10, focus: [KXp, 3.5, IDOL[2]], cam: (t, u) => { const a = (-0.35 + 0.5 * u), r = 6.5; return { pos: [KXp + Math.sin(a) * r, 2.0, IDOL[2] + Math.cos(a) * r], look: [KXp, 3.8, IDOL[2]], fov: 42 }; }, actors: (t) => [KALI(t), ...inside(t).slice(0, 7)], fx: () => ({ warm: [[KXp, 3, IDOL[2] + 2], [KXp + 3, 2, PZ - 2]] }), shadowR: 12 });
// 13 "And trust me, the decorations are anything but ordinary."
add({ a: 42.4, b: 43.8, light: "kolkata", dof: 0, whip: 1, cam: move({ pos: [KXp + 0.5, 1.4, PZ + 34], look: [KXp, 5, PZ + 10], fov: 52 }, { pos: [KXp + 0.3, 1.5, PZ + 24], look: [KXp, 5.5, PZ], fov: 52 }), actors: (t) => bengal(t, 26, PZ + 6, 30), shadowR: 24 });
add({ a: 43.8, b: 45.4, light: "kolkata", dof: 0, cam: move({ pos: [KXp + 3, 2, PZ + 10], look: [KXp, 12, PZ], fov: 54 }, { pos: [KXp + 2, 9, PZ + 14], look: [KXp, 14, PZ], fov: 54 }), actors: (t) => bengal(t, 20, PZ + 3, 12), shadowR: 20 });

// 14 "Now let's fly to Goa."
const [EX, EY, EZ] = EFFIGY;
const NARAKA = (t: number, burn = 0, fall = 0): ActorDef => ({ who: "naraka", pos: [EX, EY, EZ], scale: 5, roll: fall * 1.2, tint: [1 - 0.6 * burn, 1 - 0.7 * burn, 1 - 0.75 * burn], opts: { mode: "stand", expr: burn > 0.4 ? "terror" : "creepy", wave: 0.5 + 0.5 * Math.sin(t * 2), blink: blinkAt(t, 5) } });
const goans = (t: number, n = 26, cheer = false): ActorDef[] => Array.from({ length: n }, (_, i) => ({ who: "g" + i, pos: [EX - 10 + ((i * 7) % n) * (20 / n), 0, EZ + 7 + (i % 4) * 1.6] as V3,
  opts: { mode: "stand", back: !cheer && i % 3 === 0, expr: cheer ? (["laugh", "grin", "shock"] as const)[i % 3] : (["smile", "dazed", "grin"] as const)[i % 3], wave: cheer ? W(t, i) : undefined, blink: blinkAt(t, i) } as FrontOpts }));
add({ a: 45.4, b: 46.5, light: "goa", dof: 0, whip: -1, cam: move({ pos: [EX + 30, 26, EZ + 50], look: [EX, 6, EZ], fov: 50 }, { pos: [EX + 20, 16, EZ + 36], look: [EX, 7, EZ], fov: 50 }), actors: (t) => [NARAKA(t), ...goans(t)], shadowR: 40 });
// 15 "Here, the celebrations begin with a giant demon named Narakasura."
add({ a: 46.5, b: 48.3, light: "goa", dof: 8, focus: [EX, 8, EZ], cam: move({ pos: [EX - 2, 1.4, EZ + 13], look: [EX, 9, EZ], fov: 50 }, { pos: [EX - 1, 1.3, EZ + 11], look: [EX, 10, EZ], fov: 50 }), actors: (t) => [NARAKA(t), ...goans(t)], shadowR: 20 });
add({ a: 48.3, b: 49.6, light: "goa", dof: 14, whip: 1, cam: move({ pos: [EX + 1.5, 8.0, EZ + 8], look: [EX, 8.0, EZ], fov: 40 }, { pos: [EX + 1.0, 8.1, EZ + 7], look: [EX, 8.1, EZ], fov: 38 }), actors: (t) => [NARAKA(t)], shadowR: 12 });
// 16 "People build enormous effigies of him and burn them before sunrise to celebrate Lord Krishna's victory over the demon."
add({ a: 49.6, b: 51.4, light: "goa", dof: 10, focus: [EX + 2.4, 4, EZ + 1.4], cam: move({ pos: [EX + 7, 3.2, EZ + 7], look: [EX + 1.5, 4.5, EZ + 1.4], fov: 44 }, { pos: [EX + 6, 4.2, EZ + 6.5], look: [EX + 1.5, 5.2, EZ + 1.4], fov: 44 }),
  actors: (t) => [NARAKA(t), { who: "g40", pos: [EX + 2.4, 3.2, EZ + 1.5], opts: { mode: "stand", expr: "grin", prop: ["hammer", W(t * 1.5, 0)], blink: blinkAt(t, 1) } }, { who: "g41", pos: [EX - 2.4, 5.4, EZ + 1.5], opts: { mode: "stand", expr: "smile", prop: ["hammer", W(t * 1.5, 2)] } }, { who: "g42", pos: [EX + 3.3, 1.0, EZ + 2.4], opts: { mode: "stand", expr: "laugh", wave: W(t, 3) } }], shadowR: 14 });
add({ a: 51.4, b: 52.6, light: "goa", dof: 6, whip: -1, cam: move({ pos: [EX - 3, 1.6, EZ + 15], look: [EX, 5, EZ], fov: 50 }, { pos: [EX - 2, 1.7, EZ + 13.5], look: [EX, 6, EZ], fov: 50 }), actors: (t) => [NARAKA(t, 0.2), ...goans(t, 26, true)], fx: (t) => ({ burn: (t - 51.4) / 1.2 * 0.5, warm: [[EX, 3, EZ + 3], [EX, 7, EZ + 3]] }), shadowR: 20 });
add({ a: 52.6, b: 53.3, light: "goa", dof: 0, cam: move({ pos: [EX + 26, 3, EZ + 34], look: [EX, 7, EZ - 10], fov: 50 }, { pos: [EX + 24, 3.4, EZ + 32], look: [EX, 7.5, EZ - 10], fov: 50 }), actors: (t) => [NARAKA(t, 0.5), ...goans(t, 26, true)], fx: (t) => ({ burn: 0.5 + (t - 52.6) * 0.5, warm: [[EX, 4, EZ + 3], [EX, 8, EZ + 3]] }), shadowR: 40 });
add({ a: 53.3, b: 55.4, light: "goa", dof: 14, whip: 1, cam: move({ pos: [EX + 6.2, 1.9, EZ + 13], look: [EX + 5, 1.8, EZ + 10.6], fov: 38 }, { pos: [EX + 6.0, 1.9, EZ + 12.6], look: [EX + 5, 1.85, EZ + 10.6], fov: 36 }),
  actors: (t) => [{ who: "krishna", pos: [EX + 5, 0, EZ + 10.6], opts: { mode: "stand", expr: talk(t, "grin", "smile"), prop: "point", blink: blinkAt(t, 2) } }, NARAKA(t, 0.7)], fx: () => ({ burn: 0.85, warm: [[EX + 4, 2.5, EZ + 9], [EX, 6, EZ + 3]] }), shadowR: 10 });
// 17 "Imagine waking up early just to watch a demon get evicted."
add({ a: 55.4, b: 56.6, light: "goa", dof: 14, whip: -1, cam: move({ pos: [EX - 1.6, 1.4, EZ + 14.2], look: [EX - 2.2, 1.35, EZ + 12], fov: 38 }, { pos: [EX - 1.8, 1.4, EZ + 13.9], look: [EX - 2.2, 1.38, EZ + 12], fov: 36 }),
  actors: (t) => [{ who: "kid", pos: [EX - 2.2, 0, EZ + 12], opts: { mode: "stand", expr: t < 56 ? "asleep" : "dazed", headTilt: 10 * Math.sin(t * 2), blink: 0 } }, { who: "dad", pos: [EX - 3.2, 0, EZ + 11.6], opts: { mode: "stand", expr: "grin" } }], fx: () => ({ burn: 0.9, warm: [[EX - 2, 2, EZ + 10]] }), shadowR: 8 });
add({ a: 56.6, b: 58.0, light: "goa", dof: 0, cam: move({ pos: [EX + 3, 2, EZ + 20], look: [EX, 6, EZ], fov: 50 }, { pos: [EX + 2, 2.2, EZ + 18], look: [EX, 5, EZ], fov: 50 }), actors: (t) => [NARAKA(t, 1, smooth((t - 56.9) / 0.9)), ...goans(t, 26, true)], fx: (t) => ({ burn: 1.1, bursts: [[EX - 6, 24, EZ - 20, 57.2, 0], [EX + 8, 26, EZ - 22, 57.5, 2]], warm: [[EX, 3, EZ + 3], [EX, 7, EZ + 3]] }), shadowR: 24 });

// 18 "And finally, Varanasi."
const pandits = (t: number): ActorDef[] => Array.from({ length: 7 }, (_, i) => ({ who: "pr" + i, pos: [VX - 24 + i * 8 + 0.75, WATER_Y + 1.75, -2.1] as V3, opts: { mode: "stand", expr: (["smile_closed", "smile", "neutral"] as const)[i % 3], prop: "diya", wave: 0.5 + 0.5 * Math.sin(t * 2.5 + i), blink: blinkAt(t, i) } as FrontOpts }));
const vghat = (t: number, n = 30, x0 = VX - 24, span = 48): ActorDef[] => ghat(t, n, x0, span).map((a, i) => ({ ...a, who: "v" + i }));
add({ a: 58.0, b: 59.3, light: "varanasi", dof: 0, whip: 1, cam: move({ pos: [VX - 22, 3, 46], look: [VX, 8, -14], fov: 50 }, { pos: [VX - 16, 3.6, 38], look: [VX, 8.5, -14], fov: 50 }), actors: (t) => [...pandits(t), ...vghat(t, 40, VX - 40, 80)], shadowR: 40 });
// 19 "Here, there's another spectacular celebration called Dev Deepawali."
add({ a: 59.3, b: 60.8, light: "varanasi", dof: 8, focus: [VX, WATER_Y, 10], cam: move({ pos: [VX - 12, WATER_Y + 0.6, 16], look: [VX - 2, WATER_Y + 1.5, 4], fov: 46 }, { pos: [VX - 6, WATER_Y + 0.7, 15], look: [VX + 4, WATER_Y + 1.6, 4], fov: 46 }), actors: (t) => [...pandits(t), ...vghat(t, 30)], shadowR: 24 });
add({ a: 60.8, b: 62.4, light: "varanasi", dof: 0, cam: move({ pos: [VX + 8, WATER_Y + 3, 8], look: [VX - 6, WATER_Y + 3, -6], fov: 48 }, { pos: [VX + 8, WATER_Y + 14, 14], look: [VX - 8, WATER_Y + 2, -6], fov: 50 }), actors: (t) => [...pandits(t), ...vghat(t, 40, VX - 30, 60)], shadowR: 30 });
// 20-21 "But plot twist! It's not on the main Diwali night."
add({ a: 62.4, b: 63.3, light: "close", dof: 16, whip: -1, cam: move({ pos: [VX - 6.4, WATER_Y + 3.4, 0.6], look: [VX - 7.25, WATER_Y + 3.35, -2.1], fov: 36 }, { pos: [VX - 6.6, WATER_Y + 3.4, 0.2], look: [VX - 7.25, WATER_Y + 3.38, -2.1], fov: 34 }), actors: (t) => [{ ...pandits(t)[2], opts: { mode: "stand", expr: "shock", prop: "diya", blink: 0 } }], fx: () => ({ warm: [[VX - 8, WATER_Y + 3, -1]] }), shadowR: 6 });
add({ a: 63.3, b: 64.6, light: "varanasi", dof: 10, whip: 1, focus: [VX + 3, WATER_Y + 2.2, -3], cam: move({ pos: [VX - 2, WATER_Y + 2.7, 4.5], look: [VX + 3, WATER_Y + 2.4, -3.5], fov: 44 }, { pos: [VX + 0.5, WATER_Y + 2.8, 4.2], look: [VX + 5, WATER_Y + 2.5, -3.5], fov: 44 }),
  actors: (t) => vghat(t, 30, VX - 4, 20).map((a, i) => ({ ...a, opts: { ...a.opts, expr: (["dazed", "nervous", "smile"] as const)[i % 3], wave: undefined } })), shadowR: 12 });
// 22 "It happens around fifteen days later, when the ghats of the Ganges are decorated with countless glowing diyas."
add({ a: 64.6, b: 66.4, light: "varanasi", dof: 10, focus: [VX, WATER_Y + 3.5, -2.5], cam: move({ pos: [VX + 5, WATER_Y + 1.6, 7], look: [VX - 1, WATER_Y + 3.4, -2.5], fov: 44 }, { pos: [VX + 3, WATER_Y + 1.7, 6.5], look: [VX - 3, WATER_Y + 3.4, -2.5], fov: 44 }), actors: (t) => [...pandits(t), ...vghat(t, 24)], shadowR: 16 });
add({ a: 66.4, b: 67.9, light: "close", dof: 26, focus: [VX + 1.5, WATER_Y + 1.2, -2.6], cam: move({ pos: [VX + 3.6, WATER_Y + 1.9, 0.8], look: [VX + 0.4, WATER_Y + 1.4, -3.2], fov: 42 }, { pos: [VX + 2.8, WATER_Y + 2.0, 0.6], look: [VX - 0.4, WATER_Y + 1.5, -3.2], fov: 42 }), actors: (t) => vghat(t, 16, VX - 3, 10), shadowR: 8 });
add({ a: 67.9, b: 69.7, light: "varanasi", dof: 0, cam: move({ pos: [VX - 30, 18, 60], look: [VX, 2, -6], fov: 50 }, { pos: [VX - 14, 22, 54], look: [VX + 4, 2, -6], fov: 50 }), actors: (t) => [...pandits(t), ...vghat(t, 40, VX - 40, 80)], shadowR: 50 });
// 23 "It's believed that the gods themselves come down to celebrate."
const GODS = (t: number): ActorDef[] => [
  { who: "raam", pos: [VX - 1.6, 9 - 1.5 * smooth((t - 69.7) / 2.4), 8], scale: 1.4, opts: { mode: "stand", expr: "smile", wave: W(t, 1), blink: blinkAt(t, 1) } },
  { who: "seeta", pos: [VX, 9.2 - 1.5 * smooth((t - 69.7) / 2.4), 7.8], scale: 1.4, opts: { mode: "stand", expr: "smile_closed", blink: blinkAt(t, 2) } },
  { who: "krishna", pos: [VX + 1.6, 9 - 1.5 * smooth((t - 69.7) / 2.4), 8], scale: 1.4, opts: { mode: "stand", expr: "grin", wave: W(t, 4), blink: blinkAt(t, 3) } }];
const FWD: Burst[] = [[VX - 8, 22, -10, 69.9, 0], [VX + 8, 24, -12, 70.4, 0], [VX, 28, -14, 70.9, 0], [VX - 14, 20, -8, 71.4, 0], [VX + 14, 22, -10, 71.8, 0]];
add({ a: 69.7, b: 72.2, light: "divine", dof: 6, focus: [VX, 8, 8], cam: move({ pos: [VX + 0.5, 6.2, 18], look: [VX, 12, 6], fov: 48 }, { pos: [VX + 0.3, 5.2, 15.5], look: [VX, 8.6, 6], fov: 46 }), actors: (t) => GODS(t), fx: () => ({ bursts: FWD, warm: [[VX, 9, 10], [VX, 6, 6]] }), shadowR: 20 });

// 24 "So why does India celebrate Diwali in so many different ways?"
const FWE: Burst[] = [[22, 17, 3, 72.4, 0], [34, 22, 0, 72.9, 1], [16, 21, -2, 73.4, 2], [-20, 24, 4, 80.9, 3], [26, 22, 2, 81.3, 1], [-8, 26, -20, 82.6, 0], [10, 24, -24, 83.0, 2], [0, 30, -30, 83.4, 4], [-14, 22, -18, 83.8, 1], [16, 26, -22, 84.2, 3], [-4, 28, -26, 84.6, 0], [8, 32, -32, 85.0, 2], [-18, 24, -22, 85.4, 4], [4, 26, -24, 85.8, 1]];
add({ a: 72.2, b: 73.6, light: "home", dof: 0, whip: -1, cam: move({ pos: [HX - 20, 7.5, 6.5], look: [HX + 8, 9.5, -6], fov: 50 }, { pos: [HX - 18, 4, 5], look: [HX + 6, 6, 0], fov: 48 }), actors: (t) => lane(t, 30), fx: () => ({ bursts: FWE }), shadowR: 26 });
add({ a: 73.6, b: 75.4, light: "close", dof: 14, cam: move({ pos: [HX + 0.4, 1.15, FAM_Z + 2.2], look: [HX + 0.15, 1.15, FAM_Z + 0.45], fov: 40 }, { pos: [HX + 0.3, 1.15, FAM_Z + 1.8], look: [HX + 0.15, 1.18, FAM_Z + 0.45], fov: 38 }),
  actors: (t) => family(t, { kid: t < 74.6 ? "dazed" : "nervous", dad: "smile_closed" }).map((a) => a.who === "kid" ? { ...a, opts: { ...a.opts, prop: null, headTilt: 10 } } : a), fx: () => ({ warm: [[HX, 1.4, FAM_Z + 1.4]] }), shadowR: 6 });
// 25 "Because different regions remember different legends, victories, and traditions." : a montage
add({ a: 75.4, b: 76.4, light: "ayodhya", dof: 18, whip: 1, cam: (t, u) => { const x = boatX(t - 60); return move({ pos: [x + 1.4, DECK + 1.75, BOAT_Z + 2.8], look: [x + 0.0, DECK + 1.6, BOAT_Z + 0.1], fov: 38 }, { pos: [x + 1.1, DECK + 1.72, BOAT_Z + 2.4], look: [x, DECK + 1.62, BOAT_Z + 0.1], fov: 36 })(t, u); },
  actors: (t) => onBoat(t - 60), fx: (t) => ({ boatX: boatX(t - 60) }), shadowR: 8 });
add({ a: 76.4, b: 77.4, light: "gwalior", dof: 10, whip: -1, focus: [GXg, 1.5, GZ + 12], cam: move({ pos: [GXg - 1.6, 1.7, GZ + 17], look: [GXg, 1.6, GZ + 8], fov: 40 }, { pos: [GXg - 1.3, 1.75, GZ + 18], look: [GXg, 1.65, GZ + 9], fov: 40 }), actors: (t) => kings(t - 76.4 + 0.6, GZ + 13, 40, 1.1), fx: () => ({ gate: 1 }), shadowR: 20 });
add({ a: 77.4, b: 78.3, light: "goa", dof: 6, whip: 1, cam: move({ pos: [EX - 2, 1.6, EZ + 15], look: [EX, 6, EZ], fov: 50 }, { pos: [EX - 1.5, 1.7, EZ + 14], look: [EX, 6.5, EZ], fov: 50 }), actors: (t) => [NARAKA(t, 0.8), ...goans(t, 26, true)], fx: () => ({ burn: 0.9, warm: [[EX, 4, EZ + 3]] }), shadowR: 20 });
add({ a: 78.3, b: 79.1, light: "varanasi", dof: 0, whip: -1, cam: move({ pos: [VX + 8, WATER_Y + 5, 10], look: [VX - 6, WATER_Y + 3, -6], fov: 48 }, { pos: [VX + 7, WATER_Y + 7, 11], look: [VX - 7, WATER_Y + 3, -6], fov: 48 }), actors: (t) => [...pandits(t), ...vghat(t, 30, VX - 30, 60)], shadowR: 30 });
// 26-27 "One festival. Different stories."
add({ a: 79.1, b: 80.0, light: "home", dof: 0, whip: 1, cam: move({ pos: [HX + 10, 9, 18], look: [HX, 2, -4], fov: 50 }, { pos: [HX + 8, 10, 17], look: [HX, 2.4, -4], fov: 50 }), actors: (t) => [...family(t), ...lane(t, 30)], fx: () => ({ bursts: FWE }), shadowR: 26 });
add({ a: 80.0, b: 80.8, light: "amritsar", dof: 0, whip: -1, cam: move({ pos: [TX - 4, 2.4, TZ + 30], look: [TX, 9, TZ], fov: 44 }, { pos: [TX - 3, 2.6, TZ + 28], look: [TX, 9.5, TZ], fov: 44 }), fx: () => ({ bursts: FWM.map((b) => [b[0], b[1], b[2], b[3] + 51.5, b[4]] as Burst) }), shadowR: 30 });
// 28 "And somehow, everyone agrees on one thing."
add({ a: 80.8, b: 82.5, light: "home", dof: 9, whip: 1, focus: [HX, 1.3, FAM_Z], cam: move({ pos: [HX - 0.3, 1.3, 3.4], look: [HX, 1.45, FAM_Z - 0.4], fov: 44 }, { pos: [HX - 0.1, 1.35, 2.6], look: [HX, 1.5, FAM_Z - 0.4], fov: 42 }), actors: (t) => family(t, { dad: talk(t, "grin", "smile"), dadi: "smile_closed" }), fx: () => ({ warm: [[DIYA[0] + 0.6, 0.9, DIYA[2] + 0.4]] }), shadowR: 10 });
// 29 "More lights, more sweets, and absolutely no shortage of celebrations."
add({ a: 82.5, b: 83.35, light: "home", dof: 16, whip: -1, cam: move({ pos: [HX - 7, 3.4, 7], look: [HX - 2, 6.4, -1], fov: 46 }, { pos: [HX - 6, 3.6, 6.5], look: [HX - 1, 6.6, -1], fov: 46 }), fx: () => ({ bursts: FWE }), shadowR: 10 });
add({ a: 83.35, b: 84.0, light: "close", dof: 18, whip: 1, focus: [HX + 6.5, 0.95, 3], cam: move({ pos: [HX + 6.9, 1.6, 4.4], look: [HX + 6.5, 0.9, 3], fov: 38 }, { pos: [HX + 6.8, 1.55, 4.2], look: [HX + 6.5, 0.9, 3], fov: 36 }), actors: (t) => [{ who: "girl", pos: [HX + 6.0, 0, 2.2], opts: { mode: "stand", expr: "laugh", blink: blinkAt(t, 3) } }], fx: () => ({ warm: [[HX + 6.5, 1.6, 3.6]] }), shadowR: 6 });
add({ a: 84.0, b: DURATION, light: "home", dof: 6, whip: -1, focus: [HX, 1.3, FAM_Z], cam: move({ pos: [HX + 0.2, 1.3, 2.2], look: [HX, 1.5, FAM_Z - 0.4], fov: 42 }, { pos: [HX + 0.6, 6.5, 9.5], look: [HX, 6, -12], fov: 52 }),
  actors: (t) => [...family(t, { dadi: "laugh", dad: "laugh", kid: "laugh", mom: "grin", dada: "laugh" }).map((a, i) => ({ ...a, opts: { ...a.opts, wave: i % 2 ? W(t, i) : undefined } })), ...lane(t, 24)], fx: () => ({ bursts: FWE, warm: [[DIYA[0] + 0.6, 0.9, DIYA[2] + 0.4]] }), shadowR: 14 });

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
