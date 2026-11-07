// Shot plan for "The Man Who Sold the Eiffel Tower. Twice." (voice: Kokoro am_michael @1.0, line times in
// shorts/eiffel/voice/lines.json). 86 s, 30 fps.
import { LightName, Room, SALON, SUITE, FLAT, STATION } from "./world";
import { CAFE_Z, HOTEL_Z } from "./city";
import { FrontOpts, Outfit } from "../dead/toon";

export const FPS = 30;
export const DURATION = 86;
export const TOTAL = DURATION * FPS;

export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
export type ActorDef = { who: string; pos: V3; opts: FrontOpts; tint?: V3; scale?: number; roll?: number; yaw?: number };
export type WorldState = { light: LightName; room?: Room; limo?: { pos: V3; ry: number }; train?: number; steam?: number };
export type Overlay = { text?: string; sub?: string; textOp?: number; paper?: number };
export type Shot = { id: number; a: number; b: number; cam: (t: number, u: number) => Cam; actors?: (t: number) => ActorDef[]; world: (t: number) => WorldState; overlay?: (t: number) => Overlay };

const FAIR = "#f0c9a0", TAN = "#d9a679", PINK = "#f5c9a0", DARK = "#a8754f";
const SUITS = ["#4a4a52", "#5a3a2a", "#2a3a4a", "#3a4a3a", "#6a5a4a", "#3a2a3a"], HATS = ["tophat", "fedora", "cap", "tophat", "fedora", "fedora"];
export const outfitOf = (who: string): Outfit => {
  const i = parseInt(who.replace(/^\D+/, "")) || 0;
  if (who === "lustig") return { jacket: "#26304a", pants: "#222a3c", boots: "#141418", hat: "fedora", cap: "#1c1c22", moustache: "#2a1a14", skin: FAIR, buttons: "#d9d9e0", hair: "#2a1a14" };
  if (who === "poisson") return { jacket: "#7a5634", pants: "#5a4430", boots: "#2a1a10", hat: "tophat", cap: "#3a2a1e", moustache: "#5a3a22", skin: PINK, build: "stout", buttons: "#e8c050", sash: "#e8c050" };
  if (who === "wife") return { jacket: "#6a2f6a", pants: "#4a2a4a", dress: "#7a3a7a", boots: "#2a1a1a", hat: "bonnet", hair: "#6a3a22", skin: FAIR };
  if (who === "doorman") return { jacket: "#8a1f2b", pants: "#2a2a30", boots: "#141418", hat: "peaked", cap: "#8a1f2b", buttons: "#e8c050", skin: TAN, moustache: "#2a1a14" };
  if (who === "waiter") return { jacket: "#f4f1ea", pants: "#1e1e22", boots: "#141418", hat: "hair", hair: "#2a1a14", skin: FAIR, buttons: "#1e1e22", moustache: "#2a1a14" };
  if (who.startsWith("cop")) return { jacket: "#1f2a4a", pants: "#1a2036", boots: "#141418", hat: "peaked", cap: "#1f2a4a", buttons: "#e8c050", moustache: i % 2 ? "#2a1a14" : undefined, skin: [FAIR, TAN][i % 2], belt: "#141418" };
  if (who.startsWith("d") || who.startsWith("n")) { // the dealers (d: first group, n: the second group a month later)
    const k = i + (who[0] === "n" ? 3 : 0);
    return { jacket: SUITS[k % 6], pants: "#2e2e34", boots: "#1e1a18", hat: HATS[k % 6], cap: ["#2a2420", "#4a3a2a", "#5a5a60"][k % 3], moustache: k % 3 !== 2 ? ["#3a2a1a", "#7a7a7a", "#2a1a14"][k % 3] : undefined, beard: k % 4 === 1 ? "#6a6a6a" : undefined, skin: [FAIR, TAN, PINK, DARK][k % 4], build: k % 2 ? "stout" : "adult", buttons: "#d9d9e0" };
  }
  if (who.startsWith("porter")) return { jacket: "#3a4a3a", pants: "#2a3a2a", boots: "#1e1a18", hat: "cap", cap: "#3a4a3a", skin: TAN };
  if (who === "boy") return { jacket: "#8a5a3a", pants: "#4a4a52", boots: "#3a2a1a", hat: "cap", cap: "#5a5a60", skin: PINK, build: "kid" };
  // pedestrians
  const coats = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9", "#4a4a52", "#c9a046"];
  const o: Outfit = { jacket: coats[i % 8], pants: "#3b3f52", boots: "#3a2a20", skin: [FAIR, TAN, PINK, DARK][i % 4] };
  return i % 2 ? { ...o, hat: "bonnet", dress: ["#d9a441", "#c25a7a", "#5a8fc2", "#6a9a6a"][i % 4], hair: "#6a3a22" } : { ...o, hat: ["fedora", "cap", "tophat"][i % 3], cap: ["#3a3a40", "#5a4a3a", "#2a2a30"][i % 3], moustache: i % 4 === 0 ? "#3a2a1a" : undefined };
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

const DAY: V3 = [1, 0.97, 0.94], MORN: V3 = [1.02, 0.97, 0.92], GOLD: V3 = [1.06, 0.92, 0.8], DUSK: V3 = [0.95, 0.82, 0.86], WARM: V3 = [1.05, 0.9, 0.76], NIGHTW: V3 = [1.0, 0.82, 0.62];
const SX = SALON[0], UX = SUITE[0], FX = FLAT[0], TX = STATION[0];
const SIT = 0.42; // card y for someone sitting on a chair (seat ~0.56)
const SEATS: V3[] = [[-4.2, 0, -1.75], [-1.4, 0, -1.75], [1.4, 0, -1.75], [-4.2, 0, 1.75], [-1.4, 0, 1.75], [1.4, 0, 1.75]];
export const TWICE = 83.18;

const S: Shot[] = [];
const add = (s: Omit<Shot, "id">) => S.push({ id: S.length + 1, ...s });

// ---------------- extras ----------------
/** pedestrians strolling along the cafe street sidewalks (both directions), deterministic */
const streetFolk = (t: number, tint: V3, zc: number): ActorDef[] => Array.from({ length: 14 }, (_, i) => {
  const dir = i % 2 ? 1 : -1, x = (i % 4 < 2 ? 1 : -1) * (10.4 + (i % 3) * 1.4), z0 = zc + 40 - ((i * 23) % 90);
  return { who: "p" + i, pos: [x, 0, z0 + dir * 1.3 * (t % 60)] as V3, tint, opts: { mode: "stroll", phase: t * 1.3 + i * 0.37, expr: (["neutral", "smile_closed", "neutral", "smile"] as const)[i % 4], blink: blinkAt(t, i) } as FrontOpts };
});
const cafePatrons = (t: number, tint: V3): ActorDef[] => [[12.8, -656.5, 0.75], [11.2, -653.9, -0.75], [11.2, -648.7, 0.75], [12.8, -646.1, 0.75]].map(([x, z, dz], i) => (
  { who: "p" + (20 + i), pos: [x, SIT, z + dz] as V3, tint, opts: { mode: "sit", expr: i % 2 ? "smile" : "neutral", blink: blinkAt(t, 20 + i) } as FrontOpts }));
const towerFolk = (t: number, tint: V3): ActorDef[] => Array.from({ length: 10 }, (_, i) => ({
  who: "p" + (30 + i), pos: [-22 + i * 5.2 + Math.sin(t * 0.4 + i) * 1.5, 0, 78 + (i % 3) * 5 - (i % 2) * 1.3 * ((t % 20) - 10) * 0.2] as V3, tint,
  opts: { mode: i % 3 === 0 ? "stand" : "stroll", phase: t * 1.3 + i * 0.4, expr: "smile_closed", look: i % 3 === 0 ? 0.5 : 0, blink: blinkAt(t, 30 + i) } as FrontOpts }));
const squareFolk = (t: number, tint: V3): ActorDef[] => Array.from({ length: 10 }, (_, i) => ({
  who: "p" + (40 + i), pos: [-26 + i * 5.4, 0, 568 - (i % 3) * 3 + (i % 2 ? 1 : -1) * 0.8 * (t % 12)] as V3, tint,
  opts: { mode: "stroll", phase: t * 1.3 + i * 0.4, expr: "neutral", blink: blinkAt(t, 40 + i) } as FrontOpts }));
const stationFolk = (t: number, tint: V3): ActorDef[] => Array.from({ length: 9 }, (_, i) => ({
  who: i < 2 ? "porter" + i : "p" + (50 + i), pos: [TX - 8 + i * 4.2 + (i % 2 ? 1 : -1) * 0.9 * (t % 6), 1.0, 3.6 + (i % 3) * 1.6] as V3, tint,
  opts: { mode: i % 3 === 2 ? "stand" : "stroll", phase: t * 1.4 + i * 0.3, expr: "neutral", wave: i === 4 ? 0.5 + 0.5 * Math.sin(t * 6) : undefined, blink: blinkAt(t, 50 + i) } as FrontOpts }));

// ================= SHOTS =================
// 1 "In nineteen twenty-five, a man arrived in Paris ..." : Paris from above, the tower over the Seine
add({ a: 0, b: 3.6, cam: glide({ pos: [330, 150, 640], look: [0, 120, 0], fov: 50 }, { pos: [250, 110, 500], look: [0, 118, 0], fov: 48 }, 0),
  world: () => ({ light: "morning" }), overlay: (t) => ({ text: "PARIS, 1925", textOp: ramp(t, 0.5, 1.1) * (1 - ramp(t, 3.0, 3.5)) }) });
// 1b "... with a fake name, and a very big idea." : Lustig strolls down the cafe street, the tower at its end
add({ a: 3.6, b: 7.0, cam: glide({ pos: [4.6, 1.6, -703.5], look: [1.6, 9, -560], fov: 46 }, { pos: [4.55, 1.6, -704.6], look: [1.6, 9.5, -560], fov: 44 }, 0),
  actors: (t) => [{ who: "lustig", pos: [4.4, 0, -689 - 1.5 * (t - 3.6)], opts: { mode: "stroll", phase: t * 1.4, expr: t < 5.4 ? "neutral" : "smile_closed", prop: "suitcase", blink: blinkAt(t, 1) }, tint: MORN },
    ...streetFolk(t, MORN, -650).filter((a) => a.pos[0] < 0 || a.pos[2] > -680)],
  world: () => ({ light: "morning" }) });
// 2 "The newspapers said the Eiffel Tower was rusting ..." : at the cafe, reading
add({ a: 7.0, b: 10.0, cam: glide({ pos: [13.65, 1.3, -653.8], look: [12.8, 1.5, -650.5], fov: 44 }, { pos: [13.6, 1.28, -653.4], look: [12.8, 1.5, -650.5], fov: 42 }, 0.04),
  actors: (t) => [{ who: "lustig", pos: [12.8, SIT, -650.55], opts: { mode: "sit", expr: "neutral", prop: "newspaper", blink: blinkAt(t, 1) }, tint: MORN }, ...cafePatrons(t, MORN),
    { who: "waiter", pos: [11.0, 0, -656.0 + 0.6 * Math.sin(t * 0.5)], opts: { mode: "stand", expr: "smile_closed", blink: blinkAt(t, 9) }, tint: MORN }],
  world: () => ({ light: "morning" }) });
// 2b the headline (DOM insert)
add({ a: 10.0, b: 13.45, cam: glide({ pos: [13.6, 1.28, -653.4], look: [12.8, 1.5, -650.5], fov: 42 }, { pos: [13.6, 1.28, -653.4], look: [12.8, 1.5, -650.5], fov: 42 }, 0),
  world: () => ({ light: "morning" }), overlay: (t) => ({ paper: ramp(t, 10.0, 10.35) }) });
// 3 "Victor Lustig smiled."
add({ a: 13.45, b: 15.4, cam: glide({ pos: [12.7, 1.62, -653.0], look: [12.8, 1.6, -650.55], fov: 40 }, { pos: [12.72, 1.6, -652.7], look: [12.8, 1.6, -650.55], fov: 38 }, 0.04),
  actors: (t) => [{ who: "lustig", pos: [12.8, SIT, -650.55], opts: { mode: "sit", expr: t < 13.9 ? "neutral" : "smile", prop: t < 13.8 ? "newspaper" : null, blink: blinkAt(t, 1) }, tint: MORN }, ...cafePatrons(t, MORN)],
  world: () => ({ light: "morning" }) });
// 4 "He forged government letters, ..." : the suite at night, the tower in the window
add({ a: 15.4, b: 19.6, cam: glide({ pos: [UX + 0.3, 1.55, 0.8], look: [UX, 1.3, -3.4], fov: 44 }, { pos: [UX + 0.2, 1.5, -0.2], look: [UX, 1.3, -3.4], fov: 42 }, 0.03),
  actors: (t) => [{ who: "lustig", pos: [UX, SIT, -3.5], opts: { mode: "sit", expr: t < 17.5 ? "neutral" : "smile", prop: "letter", blink: blinkAt(t, 1) }, tint: NIGHTW }],
  world: () => ({ light: "interiorNight", room: "suite" }) });
// 4b "... invited six scrap metal dealers to a secret meeting, at one of the finest hotels in Paris." : the Grand Hotel
add({ a: 19.6, b: 24.0, cam: glide({ pos: [9, 16, HOTEL_Z - 44], look: [0, 16, HOTEL_Z], fov: 50 }, { pos: [5, 2.6, HOTEL_Z - 28], look: [0, 5, HOTEL_Z], fov: 50 }, 0),
  actors: (t) => [
    ...Array.from({ length: 6 }, (_, i) => ({ who: "d" + i, pos: [-2.2 + (i % 3) * 2.0, 0, HOTEL_Z - 20 + Math.floor(i / 3) * -2.4 + 2.2 * (t - 19.6)] as V3, tint: DAY, opts: { mode: "stroll", phase: t * 1.4 + i * 0.3, expr: "neutral", back: true } as FrontOpts })),
    { who: "doorman", pos: [3.2, 0.96, HOTEL_Z - 5.6], opts: { mode: "stand", expr: "smile_closed", blink: blinkAt(t, 4) }, tint: DAY }, ...squareFolk(t, DAY)],
  world: () => ({ light: "day" }) });
// 5 "There, he told them the city could no longer afford the tower." : over Lustig's shoulder, the dealers at the table
add({ a: 24.0, b: 28.0, cam: glide({ pos: [SX + 9.6, 2.35, 1.3], look: [SX - 2, 1.0, -0.2], fov: 46 }, { pos: [SX + 9.0, 2.25, 1.1], look: [SX - 2, 1.0, -0.2], fov: 44 }, 0.03),
  actors: (t) => [{ who: "lustig", pos: [SX + 7.3, 0, 1.15], opts: { mode: "stand", back: true }, tint: WARM },
    ...SEATS.map(([x, , z], i) => ({ who: "d" + i, pos: [SX + x, SIT, z] as V3, tint: WARM, opts: { mode: "sit", expr: (["neutral", "nervous", "neutral", "stern", "neutral", "worried"] as const)[i], blink: blinkAt(t, i + 2) } as FrontOpts }))],
  world: () => ({ light: "interior", room: "salon" }) });
// 5b "It would be torn down, and sold as scrap."
add({ a: 28.0, b: 30.6, cam: glide({ pos: [SX + 4.6, 1.9, 3.2], look: [SX + 6.5, 2.0, -4.0], fov: 46 }, { pos: [SX + 4.8, 1.88, 2.7], look: [SX + 6.5, 2.0, -4.0], fov: 44 }, 0.03),
  actors: (t) => [{ who: "lustig", pos: [SX + 6.5, 0, -2.1], opts: { mode: "stand", expr: "stern", prop: t > 28.5 ? "point" : null, blink: blinkAt(t, 1) }, tint: WARM },
    { who: "d2", pos: [SX + 1.4, SIT, -1.75], opts: { mode: "sit", expr: "shock" }, tint: WARM }],
  world: () => ({ light: "interior", room: "salon" }) });
// 5c "Seven thousand tons of iron." : up through the lattice
add({ a: 30.6, b: 33.1, cam: glide({ pos: [80, 2, 150], look: [0, 150, 0], fov: 60 }, { pos: [72, 2, 138], look: [0, 158, 0], fov: 60 }, 0), roll: undefined,
  world: () => ({ light: "day" }), overlay: (t) => ({ text: "7,000 TONS", sub: "OF IRON", textOp: ramp(t, 30.8, 31.2) * (1 - ramp(t, 32.7, 33.1)) }) } as Omit<Shot, "id">);
// 6 "But it had to stay secret, or Paris would riot." : two dealers lean in, the windows behind
add({ a: 33.1, b: 36.6, cam: glide({ pos: [SX - 0.4, 1.55, 1.5], look: [SX - 0.4, 1.5, -1.75], fov: 52 }, { pos: [SX - 0.4, 1.5, 1.1], look: [SX - 0.4, 1.5, -1.75], fov: 50 }, 0.03),
  actors: (t) => [
    { who: "d0", pos: [SX - 0.8, SIT, -1.75], opts: { mode: "sit", expr: t < 34.6 ? "nervous" : "worried", look: 0.6, blink: blinkAt(t, 2) }, tint: WARM },
    { who: "d1", pos: [SX - 0.0, SIT, -1.75], opts: { mode: "sit", expr: "nervous", look: -0.6, blink: blinkAt(t, 3) }, tint: WARM }],
  world: () => ({ light: "interior", room: "salon" }) });
// 7 "He drove the dealers to the tower in a limousine." : down the avenue toward the tower
const carX = (t: number) => -8.5 + 4.2 * (t - 36.6);
add({ a: 36.6, b: 39.8, cam: (t) => ({ pos: [-1.5 + 0.25 * (t - 36.6), 1.5, -592], look: [carX(t) * 0.5, 62, 0], fov: 46 }),
  actors: (t) => streetFolk(t, DAY, -600).filter((a) => a.pos[2] < -592),
  world: (t) => ({ light: "day", limo: { pos: [carX(t), 0, -577], ry: Math.PI / 2 } }) });
// 8 "And he picked one man." : at the foot of the tower, the dealers; Lustig points
const BASE: V3 = [8, 0, 62];
add({ a: 39.8, b: 42.0, cam: glide({ pos: [BASE[0] + 1.5, 1.8, BASE[2] + 12.5], look: [BASE[0], 5.5, BASE[2] - 10], fov: 50 }, { pos: [BASE[0] + 1.2, 1.75, BASE[2] + 11.5], look: [BASE[0], 6, BASE[2] - 10], fov: 48 }, 0.02),
  actors: (t) => [{ who: "lustig", pos: [BASE[0] + 2.6, 0, BASE[2] + 0.8], opts: { mode: "stand", expr: "smile_closed", prop: t > 40.6 ? "point" : null, blink: blinkAt(t, 1) }, tint: DAY },
    ...[0, 1, 2, 4].map((k, i) => ({ who: "d" + k, pos: [BASE[0] - 2.4 + i * 1.25, 0, BASE[2] - 0.6 - (i % 2) * 0.8] as V3, tint: DAY, opts: { mode: "stand", expr: "neutral", look: -0.3, blink: blinkAt(t, k + 2) } as FrontOpts })),
    { who: "poisson", pos: [BASE[0] - 0.4, 0, BASE[2] + 0.4], opts: { mode: "stand", expr: t > 41 ? "grin" : "neutral", blink: blinkAt(t, 7) }, tint: DAY }, ...towerFolk(t, DAY)],
  world: () => ({ light: "day", limo: { pos: [BASE[0] + 8, 0, BASE[2] + 4], ry: -Math.PI / 2 } }) });
// 8b "Andre Poisson, a dealer desperate to feel important." : Poisson puffs up, the tower above him
add({ a: 42.0, b: 45.4, cam: glide({ pos: [BASE[0] - 0.5, 1.3, BASE[2] - 2.8], look: [BASE[0] - 0.4, 1.9, BASE[2] + 0.4], fov: 42 }, { pos: [BASE[0] - 0.5, 1.28, BASE[2] - 2.3], look: [BASE[0] - 0.4, 2.0, BASE[2] + 0.4], fov: 40 }, 0.03),
  actors: (t) => [{ who: "poisson", pos: [BASE[0] - 0.4, 0, BASE[2] + 0.4], opts: { mode: "stand", expr: t < 43.4 ? "grin" : "smile_closed", headTilt: -6, blink: blinkAt(t, 7) }, tint: DAY }],
  world: () => ({ light: "day" }) });
// 9 "But Poisson's wife was suspicious."
add({ a: 45.4, b: 47.7, cam: glide({ pos: [FX + 0.6, 1.5, 1.4], look: [FX - 1.2, 1.45, -2.4], fov: 42 }, { pos: [FX + 0.4, 1.48, 0.9], look: [FX - 1.2, 1.45, -2.4], fov: 40 }, 0.03),
  actors: (t) => [{ who: "wife", pos: [FX - 1.2, 0, -2.4], opts: { mode: "stand", expr: "stern", look: 0.5, blink: blinkAt(t, 5) }, tint: DAY },
    { who: "poisson", pos: [FX + 0.9, 0, -2.0], opts: { mode: "stand", expr: "smile", look: -0.5 }, tint: DAY }],
  world: () => ({ light: "interior", room: "flat" }) });
// 10 "So Lustig made a confession. He was a poorly paid official, ..." : by the salon window, Lustig leans in
add({ a: 47.7, b: 51.3, cam: glide({ pos: [SX + 6.85, 1.6, -0.4], look: [SX + 6.85, 1.6, -5.4], fov: 46 }, { pos: [SX + 6.85, 1.6, -0.9], look: [SX + 6.85, 1.6, -5.4], fov: 44 }, 0.03),
  actors: (t) => [{ who: "lustig", pos: [SX + 6.3, 0, -5.4], opts: { mode: "stand", expr: "nervous", look: 0.7, headTilt: -5, blink: blinkAt(t, 1) }, tint: WARM },
    { who: "poisson", pos: [SX + 7.4, 0, -5.2], opts: { mode: "stand", expr: "neutral", look: -0.7, blink: blinkAt(t, 7) }, tint: WARM }],
  world: () => ({ light: "interior", room: "salon" }) });
// 10b "... and he needed a little bribe."
add({ a: 51.3, b: 53.7, cam: glide({ pos: [SX + 6.3, 1.72, -3.6], look: [SX + 6.1, 1.62, -5.4], fov: 34 }, { pos: [SX + 6.28, 1.72, -3.9], look: [SX + 6.1, 1.64, -5.4], fov: 32 }, 0.04),
  actors: (t) => [{ who: "lustig", pos: [SX + 6.3, 0, -5.4], opts: { mode: "stand", expr: t < 52.1 ? "nervous" : "grin", look: 0.4, blink: blinkAt(t, 1) }, tint: WARM }],
  world: () => ({ light: "interior", room: "salon" }) });
// 11 "That convinced them. Only a real official would ask for a bribe." : the Poissons, delighted
add({ a: 53.7, b: 58.2, cam: glide({ pos: [FX - 0.1, 1.5, 3.6], look: [FX - 0.1, 1.4, -2.2], fov: 50 }, { pos: [FX - 0.1, 1.48, 3.0], look: [FX - 0.1, 1.4, -2.2], fov: 48 }, 0.03),
  actors: (t) => [{ who: "wife", pos: [FX - 0.8, 0, -2.3], opts: { mode: "stand", expr: t < 54.6 ? "stern" : "smile", look: 0.5, blink: blinkAt(t, 5) }, tint: DAY },
    { who: "poisson", pos: [FX + 0.6, 0, -2.0], opts: { mode: "stand", expr: t < 55.6 ? "smile" : "laugh", look: -0.5, blink: blinkAt(t, 7) }, tint: DAY }],
  world: () => ({ light: "interior", room: "flat" }) });
// 12 "Poisson paid for the tower, and the bribe." : the envelope of cash changes hands
add({ a: 58.2, b: 61.3, cam: glide({ pos: [SX + 6.85, 1.55, -0.6], look: [SX + 6.85, 1.45, -5.3], fov: 44 }, { pos: [SX + 6.85, 1.52, -1.1], look: [SX + 6.85, 1.45, -5.3], fov: 42 }, 0.03),
  actors: (t) => [{ who: "lustig", pos: [SX + 6.3, 0, -5.4], opts: { mode: "stand", expr: t < 59.4 ? "smile_closed" : "grin", look: 0.6, prop: t > 59.6 ? "cash" : null, blink: blinkAt(t, 1) }, tint: WARM },
    { who: "poisson", pos: [SX + 7.4, 0, -5.2], opts: { mode: "stand", expr: "smile", look: -0.6, prop: t < 59.6 ? "cash" : null, blink: blinkAt(t, 7) }, tint: WARM }],
  world: () => ({ light: "interior", room: "salon" }) });
// 13 "Lustig took the next train to Vienna, ..." : the platform, steam, Lustig with the suitcase
add({ a: 61.3, b: 63.9, cam: glide({ pos: [TX - 4, 2.6, 7.8], look: [TX + 6, 2.2, 3.0], fov: 46 }, { pos: [TX - 3.4, 2.55, 7.4], look: [TX + 6, 2.2, 3.0], fov: 44 }, 0.02),
  actors: (t) => [{ who: "lustig", pos: [TX + 5 - 1.3 * (t - 61.3), 1.0, 3.4], opts: { mode: "stroll", phase: t * 1.4, expr: "smile", prop: "suitcase", blink: blinkAt(t, 1) }, tint: DAY }, ...stationFolk(t, DAY).map((a) => ({ ...a, pos: [a.pos[0] + 19, a.pos[1], a.pos[2]] as V3 }))],
  world: () => ({ light: "interior", room: "station", train: 4 }) });
// 13b "... with a suitcase full of cash." : the train pulls out
add({ a: 63.9, b: 66.1, cam: glide({ pos: [TX - 46, 3.2, 8.5], look: [TX - 20, 3.0, 0], fov: 46 }, { pos: [TX - 46, 3.3, 8.2], look: [TX - 24, 3.0, 0], fov: 46 }, 0),
  actors: (t) => stationFolk(t, DAY).map((a) => ({ ...a, pos: [a.pos[0] - 20, a.pos[1], a.pos[2]] as V3 })),
  world: (t) => ({ light: "interior", room: "station", train: 4 - 3.2 * (t - 63.9) * (t - 63.9), steam: 1 }) });
// 14 "And Poisson was too embarrassed to tell the police."
add({ a: 66.1, b: 69.4, cam: glide({ pos: [FX + 1.2, 1.35, 2.6], look: [FX + 3.3, 1.0, 0.3], fov: 44 }, { pos: [FX + 1.5, 1.3, 2.2], look: [FX + 3.3, 1.0, 0.3], fov: 42 }, 0.03),
  actors: (t) => [{ who: "poisson", pos: [FX + 3.45, SIT, 0.3], opts: { mode: "sit", expr: "worried", headTilt: 12, blink: blinkAt(t, 7) }, tint: DAY },
    { who: "wife", pos: [FX + 2.2, 0, -0.9], opts: { mode: "stand", expr: "stern", look: 0.6, blink: blinkAt(t, 5) }, tint: DAY }],
  world: () => ({ light: "interior", room: "flat" }) });
// 15 "So one month later, Lustig came back, ..." : the hotel again, golden light, a new group
add({ a: 69.4, b: 71.9, cam: glide({ pos: [7, 2.4, HOTEL_Z - 27], look: [0, 4.6, HOTEL_Z], fov: 50 }, { pos: [6.2, 2.4, HOTEL_Z - 25], look: [0, 4.8, HOTEL_Z], fov: 50 }, 0),
  actors: (t) => [{ who: "lustig", pos: [0.6, 0, HOTEL_Z - 15 + 1.6 * (t - 69.4)], opts: { mode: "stroll", phase: t * 1.4, expr: "smile_closed", back: true }, tint: GOLD },
    ...Array.from({ length: 6 }, (_, i) => ({ who: "n" + i, pos: [-2.6 + (i % 3) * 2.0 - 0.2, 0, HOTEL_Z - 19.5 - Math.floor(i / 3) * 2.2 + 1.6 * (t - 69.4)] as V3, tint: GOLD, opts: { mode: "stroll", phase: t * 1.4 + i * 0.3, back: true } as FrontOpts })),
    { who: "doorman", pos: [3.2, 0.96, HOTEL_Z - 5.6], opts: { mode: "stand", expr: "smile_closed", blink: blinkAt(t, 4) }, tint: GOLD }, ...squareFolk(t, GOLD)],
  world: () => ({ light: "golden" }), overlay: (t) => ({ text: "ONE MONTH LATER", textOp: ramp(t, 69.5, 69.9) * (1 - ramp(t, 71.4, 71.8)) }) });
// 15b "... and sold the Eiffel Tower again."
add({ a: 71.9, b: 74.5, cam: glide({ pos: [SX + 9.6, 2.35, 1.3], look: [SX - 2, 1.0, -0.2], fov: 46 }, { pos: [SX + 9.0, 2.25, 1.1], look: [SX - 2, 1.0, -0.2], fov: 44 }, 0.03),
  actors: (t) => [{ who: "lustig", pos: [SX + 7.3, 0, 1.15], opts: { mode: "stand", back: true }, tint: WARM },
    ...SEATS.map(([x, , z], i) => ({ who: "n" + i, pos: [SX + x, SIT, z] as V3, tint: WARM, opts: { mode: "sit", expr: (["grin", "neutral", "smile", "neutral", "smile_closed", "grin"] as const)[i], blink: blinkAt(t, i + 2) } as FrontOpts }))],
  world: () => ({ light: "interior", room: "salon" }) });
// 16 "This time, the buyer went to the police." : gendarmes hurry up the hotel steps
add({ a: 74.5, b: 77.0, cam: glide({ pos: [0.6, 1.7, HOTEL_Z - 24], look: [0, 3.6, HOTEL_Z], fov: 50 }, { pos: [0.5, 1.7, HOTEL_Z - 22.5], look: [0, 3.8, HOTEL_Z], fov: 50 }, 0),
  actors: (t) => [...[0, 1, 2].map((k) => ({ who: "cop" + k, pos: [-1.6 + k * 1.6, 0, HOTEL_Z - 17 + k * 0.6 + 3.2 * (t - 74.5)] as V3, tint: DAY, opts: { mode: "march", phase: t * 2.4 + k * 0.4, expr: "stern", back: true } as FrontOpts })),
    { who: "n0", pos: [2.4, 0, HOTEL_Z - 17.5 + 2.6 * (t - 74.5)], opts: { mode: "march", phase: t * 2.2, back: true }, tint: DAY },
    { who: "doorman", pos: [3.2, 0.96, HOTEL_Z - 5.6], opts: { mode: "stand", expr: "shock" }, tint: DAY }],
  world: () => ({ light: "day" }) });
// 16b "But Lustig had already vanished." : the empty suite, a gendarme at a loss
add({ a: 77.0, b: 79.3, cam: glide({ pos: [UX + 0.3, 1.55, 0.8], look: [UX, 1.3, -3.4], fov: 44 }, { pos: [UX + 0.3, 1.55, 1.3], look: [UX, 1.3, -3.4], fov: 46 }, 0),
  actors: (t) => [{ who: "cop1", pos: [UX + 0.75, 0, -2.2], opts: { mode: "stand", expr: "dazed", look: t < 78 ? -0.7 : 0.7, blink: blinkAt(t, 6) }, tint: NIGHTW }],
  world: () => ({ light: "interiorNight", room: "suite" }) });
// 17 "The tower was never for sale." : dusk over the square, fountains, the tower beyond the river
add({ a: 79.3, b: 81.35, cam: glide({ pos: [6.5, 3.6, 562], look: [0, 112, 0], fov: 46 }, { pos: [6.0, 3.4, 556], look: [0, 114, 0], fov: 46 }, 0),
  actors: (t) => squareFolk(t, DUSK), world: () => ({ light: "dusk" }) });
// 18 "But Victor Lustig sold it." / "Twice." : Lustig at dusk on the cafe street, the tower behind him
add({ a: 81.35, b: DURATION, cam: glide({ pos: [3.0, 1.5, -703.8], look: [1.6, 9.5, -560], fov: 42 }, { pos: [2.98, 1.52, -703.0], look: [1.6, 9.5, -560], fov: 40 }, 0.02),
  actors: (t) => [{ who: "lustig", pos: [3.27, 0, -698.2], opts: { mode: "stand", expr: t < TWICE ? "smile_closed" : "grin", prop: t > TWICE - 0.1 ? "twoFingers" : "suitcase", blink: blinkAt(t, 1) }, tint: DUSK }],
  world: () => ({ light: "dusk" }) });

export const SHOTS = S;
export const shotAt = (t: number) => S.find((s) => t >= s.a && t < s.b) ?? S[S.length - 1];
export const KICKS: [number, number][] = [[TWICE, 1.0]];
export const kickAt = (t: number) => {
  let v = 0;
  for (const [k, a] of KICKS) { const df = Math.round((t - k) * FPS); if (df >= 0 && df < 7) v += a * (df % 2 ? -1 : 1) * (1 - df / 7); }
  return v;
};
export { CAFE_Z };
