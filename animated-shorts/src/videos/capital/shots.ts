// Shot plan for "The Sultan Who Moved His Capital" (voice: Kokoro am_michael @1.12, fast pace; line and word times in
// shorts/capital/voice/). 68 s, 30 fps. New style: short shots (0.6 - 2.5 s), the camera always moving (constant-speed
// dolly/crane/orbit + a little handheld), whip pans on beat changes, depth of field on every close shot.
import { LightName, DX, BZX, RX, FX } from "./world";
import { FrontOpts, Outfit } from "../dead/toon";

export const FPS = 30;
export const DURATION = 68;
export const TOTAL = DURATION * FPS;

export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
export type ActorDef = { who: string; pos: V3; opts: FrontOpts; tint?: V3; scale?: number; roll?: number; yaw?: number };
export type Fx = { glints?: [number, number, number, number][]; dust?: [number, number, number][]; warm?: V3[] };
export type Insert = "map1" | "map2";
export type Shot = { id: number; a: number; b: number; cam: (t: number, u: number) => Cam; actors?: (t: number) => ActorDef[]; light: LightName; dof: number; focus?: V3;
  whip?: -1 | 1; fx?: (t: number) => Fx; insert?: Insert; shadowR?: number };

const FAIR = "#f0c9a0", TAN = "#d9a679", DARK = "#a8754f", WHEAT = "#e8b88a";
const ROBES = ["#2a4a9a", "#2e7a4a", "#7a2a6a", "#d98a2a", "#1f6a7a", "#a8402a", "#5a3a8a", "#c9962e"], TURBANS = ["#f4f1ea", "#e8b84a", "#d1202f", "#2e7a4a", "#e86a2a", "#f2c8d8", "#2a4a9a"];
export const outfitOf = (who: string): Outfit => {
  const i = parseInt(who.replace(/^\D+/, "")) || 0;
  if (who === "sultan") return { jacket: "#a8202a", pants: "#f1ebe0", boots: "#c9962e", hat: "turban", cap: "#f8f5ee", beard: "#1a1414", moustache: "#1a1414", sash: "#e8b84a", buttons: "#e8b84a", skin: TAN, build: "stout" };
  if (who === "wazir") return { jacket: "#2e6a4a", pants: "#f1ebe0", boots: "#7a4a2a", hat: "turban", cap: "#e8b84a", beard: "#efefef", moustache: "#efefef", sash: "#f4ead6", skin: FAIR };
  if (who === "crier") return { jacket: "#d98a2a", pants: "#f1ebe0", boots: "#5a3a22", hat: "turban", cap: "#a8202a", moustache: "#2a1a14", skin: TAN, buttons: "#a8202a" };
  if (who === "blind") return { jacket: "#8a7a62", pants: "#6a5a4a", boots: "#4a3a2a", hat: "turban", cap: "#c9b89a", beard: "#d9d9d9", moustache: "#d9d9d9", skin: DARK };
  if (who === "noble") return { jacket: "#5a3a8a", pants: "#f1ebe0", boots: "#c9962e", hat: "turban", cap: "#e8b84a", moustache: "#2a1a14", sash: "#e8b84a", buttons: "#e8b84a", skin: FAIR, build: "stout" };
  if (who === "soldier") return { jacket: "#8a5a2a", pants: "#5a4a3a", boots: "#3a2a1a", hat: "turban", cap: "#5a3a22", moustache: "#1a1414", beard: "#1a1414", belt: "#3a2a1a", skin: TAN };
  if (who === "merchant") return { jacket: "#e86a2a", pants: "#f4ead6", boots: "#7a4a2a", hat: "turban", cap: "#f2c14e", moustache: "#2a1a14", skin: WHEAT, build: "stout", buttons: "#f4ead6" };
  if (who === "scholar") return { jacket: "#f4ead6", pants: "#e8e0d0", boots: "#7a4a2a", hat: "turban", cap: "#f8f5ee", beard: "#e8e8e8", moustache: "#e8e8e8", skin: FAIR };
  if (who === "mother") return { jacket: "#e8a020", pants: "#d1202f", dress: "#d1202f", boots: "#7a4a2a", hat: "longHair", hairStyle: "bun", hair: "#1a1414", bindi: true, jewel: true, dupatta: "#f2c14e", sash: "#e8b84a", skin: TAN };
  if (who === "father") return { jacket: "#2a4a9a", pants: "#f1ebe0", boots: "#5a3a22", hat: "turban", cap: "#e86a2a", moustache: "#1a1414", skin: TAN };
  if (who === "kid") return { jacket: "#2e7a4a", pants: "#f1ebe0", boots: "#5a3a22", hat: "hair", hair: "#1a1414", skin: TAN, build: "kid" };
  if (who.startsWith("c")) return { jacket: ROBES[i % 8], pants: "#f1ebe0", boots: "#7a4a2a", hat: "turban", cap: TURBANS[i % 7], beard: i % 3 === 0 ? (i % 2 ? "#e8e8e8" : "#1a1414") : undefined, moustache: i % 3 !== 2 ? "#2a1a14" : undefined, sash: i % 2 ? "#e8b84a" : undefined, skin: [FAIR, TAN, WHEAT, DARK][i % 4], build: i % 4 === 1 ? "stout" : "adult" };
  if (who.startsWith("g")) return { jacket: "#8a5a2a", pants: "#5a4a3a", boots: "#3a2a1a", hat: "turban", cap: ["#5a3a22", "#a8202a", "#2e4a6a"][i % 3], moustache: "#1a1414", belt: "#3a2a1a", skin: [TAN, DARK, WHEAT][i % 3] };
  // townsfolk
  const w = i % 3 === 1;
  return w ? { jacket: ROBES[(i + 5) % 8], pants: ROBES[(i + 3) % 8], dress: ROBES[(i + 3) % 8], boots: "#5a3a22", hat: "longHair", hairStyle: (["long", "bun", "long", "bun"] as const)[i % 4], hair: "#1a1414", bindi: i % 2 === 0, jewel: true, dupatta: TURBANS[(i + 1) % 7], sash: "#e8b84a", skin: [TAN, WHEAT, DARK, FAIR][i % 4] }
    : { jacket: ROBES[i % 8], pants: "#f1ebe0", boots: "#5a3a22", hat: i % 5 === 4 ? "hair" : "turban", cap: TURBANS[(i + 2) % 7], hair: "#1a1414", moustache: i % 2 ? "#2a1a14" : undefined, beard: i % 7 === 3 ? "#d9d9d9" : undefined, skin: [TAN, WHEAT, DARK, FAIR][i % 4], build: i % 9 === 4 ? "kid" : "adult" };
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const t = clamp01(x); return t * t * t * (t * (6 * t - 15) + 10); };
const L = (a: number, b: number, t: number) => a + (b - a) * t;
const LV = (a: V3, b: V3, t: number): V3 => [L(a[0], b[0], t), L(a[1], b[1], t), L(a[2], b[2], t)];
/** a constant-speed move (only the first/last 15 % ease a little, so the camera never stops at a cut) */
const move = (A: Cam, B: Cam) => (_t: number, u: number): Cam => { const s = 0.75 * u + 0.25 * smooth(u); return { pos: LV(A.pos, B.pos, s), look: LV(A.look, B.look, s), fov: L(A.fov, B.fov, s), roll: L(A.roll ?? 0, B.roll ?? 0, s) }; };
/** orbit around a point: radius, height, start/end angle (deg, 0 = +z), look height */
const orbit = (c: V3, r: number, h: number, a0: number, a1: number, fov: number, lookY = 1.5) => (_t: number, u: number): Cam => {
  const a = ((a0 + (a1 - a0) * u) * Math.PI) / 180; return { pos: [c[0] + Math.sin(a) * r, c[1] + h, c[2] + Math.cos(a) * r], look: [c[0], c[1] + lookY, c[2]], fov };
};
export const blinkAt = (t: number, seed: number) => { const f = Math.round(t * FPS), period = 40 + ((seed * 13) % 26), ph = (f + seed * 7) % period; return ph < 4 ? [0.5, 1, 1, 0.5][ph] : 0; };
/** talking: alternate an open and a closed mouth every few frames */
const talk = (t: number, open: FrontOpts["expr"] = "grin", closed: FrontOpts["expr"] = "smile_closed") => (Math.floor(t * 9) % 3 === 0 ? closed : open);

const S: Shot[] = [];
const add = (s: Omit<Shot, "id">) => S.push({ id: S.length + 1, ...s });

// ---------------- crowds ----------------
const SULTAN: V3 = [DX, 1.92, -18.6];
/** courtiers seated on the side carpets, facing the aisle */
const court = (t: number, mood: (i: number) => FrontOpts["expr"] = () => "neutral"): ActorDef[] => {
  const out: ActorDef[] = [];
  for (let i = 0; i < 24; i++) { const s = i % 2 ? 1 : -1, row = Math.floor(i / 2) % 2, k = Math.floor(i / 4); out.push({ who: "c" + i, pos: [DX + s * (2.9 + row * 1.25), -0.15, -14 + k * 2.4 + row * 0.9], opts: { mode: "sit", expr: mood(i), look: -s * 0.6, blink: blinkAt(t, i) } }); }
  for (const s of [-1, 1]) out.push({ who: "g" + (s > 0 ? 1 : 0), pos: [DX + s * 2.6, 1.2, -18.0], opts: { mode: "stand", expr: "stern", prop: "spear" } });
  return out;
};
/** townsfolk filling the bazaar: walkers both ways, people at stalls, kids */
const bazaar = (t: number, n = 22, busy = 1): ActorDef[] => Array.from({ length: n }, (_, i) => {
  const lane = (i % 4) - 1.5, dir = i % 2 ? 1 : -1, z0 = 30 - ((i * 37) % 120), sp = i % 3 === 0 ? 0 : 1.1 * busy;
  return { who: "p" + i, pos: [BZX + lane * 1.7 + (i % 5 === 0 ? (i % 2 ? 4.2 : -4.2) : 0), 0, z0 + dir * sp * (t % 40)] as V3,
    opts: { mode: sp ? "stroll" : "stand", phase: t * 1.3 + i * 0.37, expr: (["neutral", "smile_closed", "smile", "neutral"] as const)[i % 4], look: sp ? 0 : (i % 2 ? 0.5 : -0.5), blink: blinkAt(t, i), prop: i % 6 === 2 ? "suitcase" : null } as FrontOpts };
});
/** the march: columns of people walking south along the road */
const march = (t: number, z0: number, tired = false, n = 30): ActorDef[] => Array.from({ length: n }, (_, i) => {
  const col = (i % 4) - 1.5, row = Math.floor(i / 4);
  return { who: i === 0 ? "father" : i === 1 ? "mother" : i === 2 ? "kid" : "p" + (i + 30), pos: [RX + col * 1.5 + (row % 2) * 0.4, 0, z0 + (tired ? 0.6 : 1.2) * (t % 60) + row * 2.1 + (i % 3) * 0.3] as V3,
    opts: { mode: "march", phase: t * (tired ? 1.0 : 1.5) + i * 0.4, expr: tired ? (["pained", "worried", "dazed"] as const)[i % 3] : (["neutral", "stern", "worried"] as const)[i % 3], prop: i % 5 === 1 ? "suitcase" : null } as FrontOpts };
});

// ================= SHOTS =================
// 0 "Imagine your king tells you to pack up your whole house, and walk eleven hundred kilometres."
add({ a: 0, b: 1.85, light: "day", dof: 12, cam: move({ pos: [BZX - 2.4, 1.7, -14.5], look: [BZX + 0.4, 1.9, -21], fov: 44 }, { pos: [BZX - 1.9, 1.75, -16.3], look: [BZX + 0.4, 1.95, -21], fov: 42 }),
  actors: (t) => [{ who: "crier", pos: [BZX + 0.4, 0, -21], opts: { mode: "stand", expr: talk(t, "laugh", "grin"), prop: "letter", blink: blinkAt(t, 1) } },
    ...[0, 1, 2, 3, 4].map((k) => ({ who: "p" + (60 + k), pos: [BZX - 2.4 + k * 1.3, 0, -18.4 - (k % 2) * 0.9] as V3, opts: { mode: "stand", expr: (["shock", "worried", "shock", "nervous", "worried"] as const)[k], back: k === 2 } as FrontOpts })), ...bazaar(t, 16)] });
add({ a: 1.85, b: 3.45, light: "day", dof: 14, whip: 1, cam: move({ pos: [BZX + 3.4, 1.5, -6.5], look: [BZX - 2.4, 1.1, -9.6], fov: 44 }, { pos: [BZX + 2.2, 1.45, -6.9], look: [BZX - 2.8, 1.1, -10.0], fov: 42 }),
  actors: (t) => [{ who: "father", pos: [BZX - 1.6, 0, -9.1], opts: { mode: "stand", expr: "worried", prop: "suitcase", blink: blinkAt(t, 2) } }, { who: "mother", pos: [BZX - 3.1, 0, -9.8], opts: { mode: "stand", expr: "nervous", prop: "diya" } }, { who: "kid", pos: [BZX - 0.6, 0, -8.6], opts: { mode: "stand", expr: "dazed", look: -0.5 } }, ...bazaar(t, 12)],
  fx: (t) => ({ dust: [[BZX - 3, -10, 1.85]], glints: [[BZX - 3.0, 1.6, -10.2, 2.4]] }) });
add({ a: 3.45, b: 5.5, light: "heat", dof: 0, cam: move({ pos: [RX + 4, 6, 60], look: [RX, 2, 400], fov: 46 }, { pos: [RX + 5, 26, 30], look: [RX, 0, 500], fov: 50 }), actors: (t) => march(t, 90, false, 40), fx: () => ({ dust: [[RX, 110, 3.4], [RX + 1, 140, 3.4]] }), shadowR: 60 });
// 1 "It's thirteen twenty seven. Sultan Muhammad bin Tughlaq rules India from Delhi."
add({ a: 5.5, b: 7.1, light: "day", dof: 0, whip: -1, cam: move({ pos: [BZX + 2, 2.2, -95], look: [BZX, 30, -175], fov: 50 }, { pos: [BZX + 1.5, 2.0, -104], look: [BZX, 46, -175], fov: 52 }), actors: (t) => bazaar(t, 18).map((a) => ({ ...a, pos: [a.pos[0], 0, a.pos[2] - 90] as V3 })), shadowR: 50 });
add({ a: 7.1, b: 8.85, light: "court", dof: 6, cam: move({ pos: [DX, 3.2, 12], look: [DX, 3.0, -18.6], fov: 46 }, { pos: [DX, 2.9, 4], look: [DX, 3.0, -18.6], fov: 44 }), actors: (t) => [{ who: "sultan", pos: SULTAN, opts: { mode: "sit", expr: "smile_closed", blink: blinkAt(t, 1) } }, ...court(t)], fx: () => ({ warm: [[DX - 4.6, 2, -14], [DX + 4.6, 2, -14]] }) });
add({ a: 8.85, b: 10.7, light: "court", dof: 16, cam: move({ pos: [DX + 1.3, 3.2, -14.6], look: [DX, 3.3, -18.6], fov: 34 }, { pos: [DX + 0.7, 3.25, -15.3], look: [DX, 3.35, -18.6], fov: 32 }), actors: (t) => [{ who: "sultan", pos: SULTAN, opts: { mode: "sit", expr: t < 9.6 ? "smile_closed" : "grin", blink: blinkAt(t, 1) } }, { who: "wazir", pos: [DX + 2.0, 1.2, -17.6], opts: { mode: "stand", expr: "smile_closed" } }],
  fx: () => ({ glints: [[DX - 0.1, 4.25, -18.4, 9.3]], warm: [[DX - 1, 3, -16]] }) });
// 2 "But he has a problem. Delhi is too close to the Mongols, and too far from the south."
add({ a: 10.7, b: 12.3, light: "court", dof: 16, whip: 1, cam: move({ pos: [DX - 1.2, 3.1, -15.0], look: [DX, 3.2, -18.6], fov: 34 }, { pos: [DX - 0.8, 3.15, -15.4], look: [DX, 3.2, -18.6], fov: 32 }), actors: (t) => [{ who: "sultan", pos: SULTAN, opts: { mode: "sit", expr: "worried", headTilt: 6 * Math.sin(t * 2), blink: blinkAt(t, 1) } }], fx: () => ({ warm: [[DX + 1, 3, -16]] }) });
add({ a: 12.3, b: 15.75, light: "court", dof: 0, insert: "map1", cam: move({ pos: [DX, 3, 0], look: [DX, 3, -18], fov: 44 }, { pos: [DX, 3, 0], look: [DX, 3, -18], fov: 44 }) });
// 3 "So he picks a new capital. Devagiri, deep in the Deccan. He renames it Daulatabad."
add({ a: 15.75, b: 17.5, light: "court", dof: 14, whip: -1, cam: move({ pos: [DX + 2.6, 3.0, -14.4], look: [DX + 0.4, 2.6, -18.2], fov: 42 }, { pos: [DX + 2.0, 2.9, -14.8], look: [DX + 0.4, 2.6, -18.2], fov: 40 }),
  actors: (t) => [{ who: "sultan", pos: SULTAN, opts: { mode: "sit", expr: talk(t), blink: blinkAt(t, 1) } }, { who: "wazir", pos: [DX + 1.8, 1.2, -17.4], opts: { mode: "stand", expr: "smile", prop: "letter" } }], fx: () => ({ glints: [[DX + 2.0, 2.9, -17.2, 16.4]], warm: [[DX + 1, 3, -16]] }) });
add({ a: 17.5, b: 19.45, light: "day", dof: 0, cam: move({ pos: [FX + 40, 18, 140], look: [FX, 40, -120], fov: 46 }, { pos: [FX + 22, 28, 100], look: [FX, 44, -120], fov: 46 }), actors: (t) => march(t, 40, false, 24).map((a) => ({ ...a, pos: [a.pos[0] - RX + FX, 0, a.pos[2]] as V3 })), shadowR: 140 });
add({ a: 19.45, b: 21.45, light: "day", dof: 8, cam: move({ pos: [FX + 14, 1.6, -2], look: [FX + 24, 18, -40], fov: 50 }, { pos: [FX + 12, 1.6, -6], look: [FX + 24, 24, -40], fov: 50 }), actors: (t) => [{ who: "g0", pos: [FX + 3, 0, -17], opts: { mode: "stand", expr: "stern", prop: "spear" } }, { who: "g2", pos: [FX - 3, 0, -17], opts: { mode: "stand", expr: "stern", prop: "spear" } }, ...march(t, -10, false, 10).map((a) => ({ ...a, pos: [a.pos[0] - RX + FX + 6, 0, a.pos[2] + 10] as V3 }))],
  fx: () => ({ glints: [[FX + 26, 58.5, -40, 20.3]] }), shadowR: 50 });
// 4 "And he doesn't just move his court."
add({ a: 21.45, b: 23.15, light: "court", dof: 14, whip: 1, cam: move({ pos: [DX - 2.4, 1.3, -6.5], look: [DX - 5.4, 1.0, -9.5], fov: 40 }, { pos: [DX - 2.7, 1.3, -7.1], look: [DX - 5.4, 1.0, -9.5], fov: 38 }),
  actors: (t) => court(t, (i) => (["shock", "worried", "nervous"] as const)[i % 3]).map((a, i) => i < 24 ? { ...a, opts: { ...a.opts, look: (i % 2 ? -0.7 : 0.7) * Math.sin(t * 3) } } : a), fx: () => ({ warm: [[DX - 4.6, 2, -9]] }) });
// 5 "He orders the entire city of Delhi to move."
add({ a: 23.15, b: 25.6, light: "court", dof: 14, cam: move({ pos: [DX - 0.6, 2.6, -13.2], look: [DX, 3.0, -18.4], fov: 40 }, { pos: [DX - 0.3, 2.7, -14.2], look: [DX, 3.0, -18.4], fov: 38 }),
  actors: (t) => [{ who: "sultan", pos: [DX, 1.2, -17.6], opts: { mode: "stand", expr: talk(t, "laugh", "stern"), prop: t > 23.6 ? "point" : null, blink: blinkAt(t, 1) } }, { who: "wazir", pos: [DX + 2.2, 1.2, -17.2], opts: { mode: "stand", expr: "shock" } }], fx: () => ({ warm: [[DX, 3, -15]] }) });
// 6 "Nobles, soldiers, merchants, scholars, families. Everyone." : a cut on every word
const quick = (a: number, b: number, who: string, prop: FrontOpts["prop"], expr: FrontOpts["expr"], z: number, side: number) => add({ a, b, light: "day", dof: 16, whip: side as 1 | -1,
  cam: move({ pos: [BZX + side * 0.5, 1.75, z + 2.3], look: [BZX + 0.1, 1.75, z], fov: 40 }, { pos: [BZX + side * 0.2, 1.75, z + 1.9], look: [BZX + 0.1, 1.75, z], fov: 38 }),
  actors: (t) => [{ who, pos: [BZX, 0, z], opts: { mode: "stand", expr, prop, blink: blinkAt(t, 3) } }, ...bazaar(t, 10)] });
quick(25.6, 26.35, "noble", null, "stern", -30, 1);
quick(26.35, 27.05, "soldier", "spear", "stern", -44, -1);
quick(27.05, 27.75, "merchant", "cash", "grin", -58, 1);
quick(27.75, 28.4, "scholar", "letter", "neutral", -72, -1);
quick(28.4, 28.95, "mother", "diya", "worried", -86, 1);
add({ a: 28.95, b: 29.55, light: "day", dof: 0, cam: move({ pos: [BZX + 2, 9, 30], look: [BZX, 1, -10], fov: 50 }, { pos: [BZX + 2, 11, 33], look: [BZX, 1, -10], fov: 52 }), actors: (t) => bazaar(t, 40, 1.4), shadowR: 40 });
// 7 "He builds a royal road, plants trees along it, and puts rest houses every two miles."
add({ a: 29.55, b: 31.3, light: "day", dof: 0, whip: 1, cam: move({ pos: [RX + 6, 30, -40], look: [RX, 0, 160], fov: 46 }, { pos: [RX + 3, 22, -20], look: [RX, 0, 180], fov: 46 }), shadowR: 80 });
add({ a: 31.3, b: 33.1, light: "day", dof: 8, cam: move({ pos: [RX + 6.6, 1.6, 300], look: [RX + 9, 4, 320], fov: 46 }, { pos: [RX + 6.6, 1.6, 312], look: [RX + 9, 4, 332], fov: 46 }), shadowR: 40 });
add({ a: 33.1, b: 35.1, light: "day", dof: 10, cam: orbit([RX + 17, 0, 390], 9, 2.4, 230, 270, 46, 1.6),
  actors: (t) => [{ who: "p70", pos: [RX + 21.6, 0, 393.2], opts: { mode: "stand", expr: "smile", blink: blinkAt(t, 4) } }, { who: "p71", pos: [RX + 15.6, 0.3, 391], opts: { mode: "sit", expr: "smile_closed" } }], fx: () => ({ glints: [[RX + 20.4, 1.0, 393.8, 33.8]] }), shadowR: 30 });
// 8 "But it's a forty day march, in burning heat."
add({ a: 35.1, b: 36.6, light: "heat", dof: 10, whip: -1, cam: move({ pos: [RX - 3.5, 0.9, 118], look: [RX, 1.4, 130], fov: 44 }, { pos: [RX - 3.4, 0.9, 120.5], look: [RX, 1.4, 133], fov: 44 }), actors: (t) => march(t, 124, true, 28), fx: (t) => ({ dust: [[RX - 1, 126 + 0.6 * (t % 60), 35.1], [RX + 1.5, 130 + 0.6 * (t % 60), 35.1]] }), shadowR: 30 });
add({ a: 36.6, b: 37.9, light: "heat", dof: 0, cam: move({ pos: [RX + 12, 3, 150], look: [RX - 20, 60, 420], fov: 50 }, { pos: [RX + 12, 3, 152], look: [RX - 20, 70, 420], fov: 50 }), actors: (t) => march(t, 150, true, 24), fx: () => ({ glints: [[RX - 12, 48, 330, 36.8], [RX - 14, 52, 340, 37.2]] }), shadowR: 40 });
// 9 "People get sick. Many never make it."
add({ a: 37.9, b: 39.0, light: "heat", dof: 16, cam: move({ pos: [RX + 7.2, 1.0, 206.2], look: [RX + 9, 0.9, 210], fov: 40 }, { pos: [RX + 7.4, 1.0, 206.8], look: [RX + 9, 0.9, 210], fov: 38 }),
  actors: (t) => [{ who: "p80", pos: [RX + 9, -0.15, 210], opts: { mode: "sit", expr: "pained", headTilt: 10 } }, { who: "mother", pos: [RX + 10.2, 0, 210.6], opts: { mode: "stand", expr: "worried", wave: 0.5 + 0.5 * Math.sin(t * 14) } }] });
add({ a: 39.0, b: 40.2, light: "heat", dof: 6, cam: move({ pos: [RX + 2.5, 1.2, 60], look: [RX - 1, 0.2, 75], fov: 44 }, { pos: [RX + 2.3, 1.1, 62], look: [RX - 1, 0.2, 77], fov: 44 }), fx: () => ({ dust: [[RX, 70, 38.8]] }), shadowR: 30 });
// 10 "Delhi becomes a ghost town. One story says only a blind man was left behind."
add({ a: 40.2, b: 42.7, light: "ghost", dof: 0, whip: 1, cam: move({ pos: [BZX + 1.5, 1.8, 30], look: [BZX, 4, -60], fov: 46 }, { pos: [BZX + 1, 1.7, 18], look: [BZX, 4, -60], fov: 46 }), fx: () => ({ dust: [[BZX + 1, 5, 40.2], [BZX - 2, -20, 40.2]] }), shadowR: 40 });
add({ a: 42.7, b: 45.5, light: "ghost", dof: 14, cam: move({ pos: [BZX + 2.2, 1.6, -24], look: [BZX, 1.4, -30], fov: 42 }, { pos: [BZX + 1.4, 1.6, -25.6], look: [BZX, 1.45, -30], fov: 40 }),
  actors: () => [{ who: "blind", pos: [BZX, 0, -30], opts: { mode: "stand", expr: "asleep", prop: "spear" } }], fx: () => ({ dust: [[BZX + 1.5, -29, 42.7]] }) });
// 11 "And Daulatabad? It's too far from the north. The Sultan can't control his empire from there."
add({ a: 45.5, b: 47.5, light: "day", dof: 0, whip: -1, cam: orbit([FX, 0, -120], 210, 50, 15, 35, 46, 30), shadowR: 160 });
add({ a: 47.5, b: 49.45, light: "court", dof: 0, insert: "map2", cam: move({ pos: [DX, 3, 0], look: [DX, 3, -18], fov: 44 }, { pos: [DX, 3, 0], look: [DX, 3, -18], fov: 44 }) });
add({ a: 49.45, b: 51.4, light: "court", dof: 16, cam: move({ pos: [DX + 1.1, 3.2, -14.9], look: [DX, 3.25, -18.6], fov: 34 }, { pos: [DX + 0.6, 3.22, -15.5], look: [DX, 3.3, -18.6], fov: 32 }),
  actors: (t) => [{ who: "sultan", pos: SULTAN, opts: { mode: "sit", expr: t < 50.4 ? "worried" : "pained", headTilt: -6, blink: blinkAt(t, 1) } }], fx: () => ({ warm: [[DX + 1, 3, -16]] }) });
// 12 "So after a few years, he makes a new announcement."
add({ a: 51.4, b: 54.4, light: "day", dof: 12, whip: 1, cam: move({ pos: [FX - 2.2, 1.7, -8.0], look: [FX + 0.3, 1.9, -14], fov: 44 }, { pos: [FX - 1.6, 1.75, -9.6], look: [FX + 0.3, 1.95, -14], fov: 42 }),
  actors: (t) => [{ who: "crier", pos: [FX + 0.3, 0, -14], opts: { mode: "stand", expr: talk(t, "laugh", "grin"), prop: "letter", blink: blinkAt(t, 1) } },
    ...[0, 1, 2, 3, 4, 5].map((k) => ({ who: "p" + (90 + k), pos: [FX - 2.6 + k * 1.2, 0, -11.0 - (k % 2) * 1.0] as V3, opts: { mode: "stand", expr: (["neutral", "worried", "dazed", "neutral", "shock", "worried"] as const)[k], back: k % 2 === 0 } as FrontOpts }))], shadowR: 20 });
// 13 "Everybody, go back to Delhi."
add({ a: 54.4, b: 56.35, light: "court", dof: 16, cam: move({ pos: [DX, 2.75, -15.0], look: [DX, 2.95, -17.6], fov: 36 }, { pos: [DX, 2.78, -15.5], look: [DX, 2.98, -17.6], fov: 32 }),
  actors: (t) => [{ who: "sultan", pos: [DX, 1.2, -17.6], opts: { mode: "stand", expr: t < 55.4 ? talk(t, "laugh", "grin") : "grin", prop: "point", blink: blinkAt(t, 1) } }], fx: () => ({ glints: [[DX + 0.5, 3.0, -17.3, 55.5]], warm: [[DX, 3, -15]] }) });
// 14 "Same road. Same heat. Same forty days."
add({ a: 56.35, b: 57.25, light: "heat", dof: 0, whip: -1, cam: move({ pos: [RX + 3, 14, 520], look: [RX, 0, 300], fov: 46 }, { pos: [RX + 3, 12, 510], look: [RX, 0, 300], fov: 46 }), actors: (t) => march(t, 400, true, 24).map((a) => ({ ...a, pos: [a.pos[0], 0, 800 - a.pos[2]] as V3 })), shadowR: 60 });
add({ a: 57.25, b: 58.1, light: "heat", dof: 0, whip: 1, cam: move({ pos: [RX + 2, 1.0, 360], look: [RX - 6, 50, 200], fov: 50 }, { pos: [RX + 2, 1.0, 362], look: [RX - 6, 56, 200], fov: 50 }), fx: () => ({ glints: [[RX - 5, 46, 220, 57.3], [RX - 7, 52, 215, 57.6]] }), shadowR: 30 });
add({ a: 58.1, b: 59.2, light: "heat", dof: 14, whip: -1, cam: move({ pos: [RX + 0.6, 1.5, 360], look: [RX, 1.4, 365], fov: 42 }, { pos: [RX + 0.6, 1.5, 359.4], look: [RX, 1.4, 364.4], fov: 40 }),
  actors: (t) => march(t, 362, true, 16).map((a) => ({ ...a, pos: [a.pos[0], 0, 727 - a.pos[2]] as V3 })), fx: (t) => ({ dust: [[RX, 364 - 0.6 * (t % 60), 58.1]] }) });
// 15 "That's why, seven hundred years later, people still call him the wise fool."
add({ a: 59.2, b: 61.3, light: "dusk", dof: 0, cam: move({ pos: [BZX + 3, 1.6, -110], look: [BZX, 40, -175], fov: 50 }, { pos: [BZX + 2, 1.6, -116], look: [BZX, 46, -175], fov: 50 }), actors: (t) => bazaar(t, 16).map((a) => ({ ...a, pos: [a.pos[0], 0, a.pos[2] - 100] as V3 })), shadowR: 50 });
add({ a: 61.3, b: 63.6, light: "court", dof: 16, whip: 1, cam: move({ pos: [DX - 1.0, 3.2, -15.0], look: [DX, 3.25, -18.6], fov: 34 }, { pos: [DX - 0.5, 3.22, -15.6], look: [DX, 3.3, -18.6], fov: 31 }),
  actors: (t) => [{ who: "sultan", pos: SULTAN, opts: { mode: "sit", expr: t < 62.4 ? "dazed" : "smile_closed", headTilt: 8, blink: blinkAt(t, 1) } }], fx: () => ({ glints: [[DX - 0.2, 4.25, -18.4, 62.6]], warm: [[DX - 1, 3, -16]] }) });
// 16 "A man with brilliant ideas, and terrible timing."
add({ a: 63.6, b: DURATION, light: "court", dof: 8, cam: move({ pos: [DX, 3.0, -12], look: [DX, 3.0, -18.6], fov: 42 }, { pos: [DX, 4.2, 10], look: [DX, 3.2, -18.6], fov: 46 }),
  actors: (t) => [{ who: "sultan", pos: SULTAN, opts: { mode: "sit", expr: t < 65.2 ? "smile" : "nervous", blink: blinkAt(t, 1) } }, { who: "wazir", pos: [DX + 2.0, 1.2, -17.6], opts: { mode: "stand", expr: "dazed" } }, ...court(t, (i) => (["neutral", "smile_closed", "dazed"] as const)[i % 3])],
  fx: () => ({ warm: [[DX - 4.6, 2, -14], [DX + 4.6, 2, -14]] }) });

export const SHOTS = S;
export const shotAt = (t: number) => S.find((s) => t >= s.a && t < s.b) ?? S[S.length - 1];
export const KICKS: [number, number][] = [[54.65, 0.8]];
export const kickAt = (t: number) => { let v = 0; for (const [k, a] of KICKS) { const df = Math.round((t - k) * FPS); if (df >= 0 && df < 7) v += a * (df % 2 ? -1 : 1) * (1 - df / 7); } return v; };
/** whip pan into shot s (and out of the one before): returns [yaw degrees, blur px] */
export const whipAt = (t: number): [number, number] => {
  for (let i = 1; i < S.length; i++) { const s = S[i]; if (!s.whip) continue; const d = t - s.a, W = 0.14;
    if (d >= -W && d < 0) { const w = (d + W) / W; return [s.whip * w * w * 32, 18 * w]; }
    if (d >= 0 && d < W) { const w = 1 - d / W; return [-s.whip * w * w * 32, 18 * w]; } }
  return [0, 0];
};
