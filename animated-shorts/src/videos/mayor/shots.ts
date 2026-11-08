// "The Accidental Mayor": shots on the house grammar (v3 playbook + the reference studies): one continuous move per
// shot with beats, characters close to the lens, object inserts (TV, the debtors list), 7-frame dissolves, a whip
// with motion blur on the twist, and the characters acting out the key words. Times follow shorts/mayor/voice/words.json.
import { LightName, BX, HX, TX0, TV, BED, LIST, THRONE, POOL, PODIUM, BOARD, POSTER, DuckState, Plan } from "./world";
import { Outfit, FrontOpts } from "../dead/toon";
import { ActorDef, V3, path, drift, shotList, ramp, lerp, smooth, cameraKey as K } from "../../lib3d/camera";

export const FPS = 30;
export const DURATION = 48.6;
export const TOTAL = Math.round(DURATION * FPS);
const HEAD = { headStyle: "ref" } as Partial<Outfit>;
export const outfitOf = (who: string): Outfit => {
  const o: Record<string, Outfit> = {
    kevin: { jacket: "#3a7ad8", pants: "#3a4a6a", boots: "#5a3420", hat: "hair", hair: "#c8642a", skin: "#f7f2ea" },
    oldmayor: { jacket: "#2a2a3a", pants: "#2a2a3a", boots: "#1a1a1a", hat: "hair", hair: "#d8d4cc", moustache: "#d8d4cc", buttons: "#e8b84a", skin: "#f7f2ea", build: "stout" },
    off1: { jacket: "#1e3a8a", pants: "#1e2a50", boots: "#1a1a1a", hat: "hair", hair: "#3a2a1a", skin: "#f7f2ea" },
    off2: { jacket: "#5a3a6a", pants: "#2a2a30", dress: "#5a3a6a", boots: "#1a1a1a", hat: "longHair", hairStyle: "bun", hair: "#8a8a8a", skin: "#f7f2ea" },
    off3: { jacket: "#3a5a4a", pants: "#2a2a30", boots: "#1a1a1a", hat: "hair", hair: "#a0a0a8", moustache: "#a0a0a8", skin: "#f7f2ea", build: "stout" },
    thief: { jacket: "#2a2a2a", pants: "#2a2a30", boots: "#1a1a1a", hat: "cap", cap: "#1a1a1a", skin: "#f7f2ea", moustache: "#2a1a1a" },
    r1: { jacket: "#c83a3a", pants: "#2a2a40", boots: "#1a1a1a", hat: "fedora", cap: "#2a2a30", skin: "#f7f2ea" },
    r2: { jacket: "#3a8ad8", pants: "#3a3a40", dress: "#3a8ad8", boots: "#1a1a1a", hat: "longHair", hairStyle: "ponytail", hair: "#d8a040", skin: "#f7f2ea" },
    r3: { jacket: "#6aa84a", pants: "#3a3020", boots: "#1a1a1a", hat: "cap", cap: "#d8322f", skin: "#f7f2ea" },
    r4: { jacket: "#e8a82a", pants: "#3a3a48", dress: "#e8a82a", boots: "#1a1a1a", hat: "longHair", hairStyle: "bob", hair: "#2a1a14", skin: "#f7f2ea" },
    r5: { jacket: "#8a4ab0", pants: "#2a2a40", boots: "#1a1a1a", hat: "hair", hair: "#1a1a1a", skin: "#f7f2ea" },
    r6: { jacket: "#3ab0a0", pants: "#2a2a40", boots: "#1a1a1a", hat: "tophat", cap: "#1a1a20", moustache: "#5a3a2a", skin: "#f7f2ea" },
  };
  return { ...(o[who.split("#")[0]] ?? o.r1), ...HEAD } as Outfit;
};
const DIS = 0.23;
const { S, add, at } = shotList<LightName>();
const R = ["r1", "r2", "r3", "r4", "r5", "r6"];
const crowdAt = (t: number, spots: [number, number][], o: (i: number) => FrontOpts, tag: string, y = 0): ActorDef[] =>
  spots.map(([x, z], i) => ({ who: `${R[i % 6]}#${tag}${i}`, pos: [x, y, z] as V3, scale: 0.76, opts: { phase: t + i * 0.7, facing: (i % 3) - 1 as -1 | 0 | 1, ...o(i) } as FrontOpts }));

// ================= the plan for the ducks, the car, the potholes and the town's power =================
const SW: V3[] = Array.from({ length: 30 }, (_, i) => [POOL[0] + ((i * 37) % 97) / 97 * 9 - 4.5, 0, POOL[2] + ((i * 53) % 89) / 89 * 5 - 2.5]);
const duckPlan = (t: number): DuckState[] => {
  if (t >= 22.4 && t < 28.75) return SW.map((p, i) => ({ pos: [p[0] + Math.sin(t * 0.5 + i) * 0.3, 0, p[2] + Math.cos(t * 0.4 + i) * 0.3] as V3, yaw: i * 1.7 + t * 0.2, swim: true, s: 1.4 }));
  if (t >= 28.6 && t < 30.98) return Array.from({ length: 9 }, (_, i) => ({ pos: [PODIUM[0] - 2.4 + i * 0.6, 0, PODIUM[2] + 2.6] as V3, yaw: 0, hat: true, salute: ramp(t, 29.5 + i * 0.03, 29.8 + i * 0.03), s: 1.2 }));
  if (t >= 30.9 && t < 33.25) { const z = (i: number) => Math.min(-14.2 + (i % 2 ? -0.9 : 0) - Math.floor(i / 2) * 0.9, lerp(-22, -14.2, (t - 30.9) / 1.3) - Math.floor(i / 2) * 0.9 - (i % 2) * 0.45);
    return Array.from({ length: 8 }, (_, i) => ({ pos: [TX0 + (i % 2 ? 0.45 : -0.45), 0, z(i)] as V3, yaw: 0, hat: true, bob: t < 32.2 ? 1.2 : 0.2, s: 1.5 })); }
  if (t >= 34.2 && t < 36.15) return Array.from({ length: 4 }, (_, i) => ({ pos: [TX0 + 5.0, 0.12, -3 - i * 0.8 + (t - 34.2) * 0.9] as V3, yaw: 0, hat: true, bob: 1.1, s: 1.4 }));
  if (t >= 36.8 && t < 38.9) return Array.from({ length: 7 }, (_, i) => ({ pos: [TX0 - 0.6 + (i % 3) * 0.6, 0.12, -12 - Math.floor(i / 3) * 0.9 + (t - 36.8) * 0.5] as V3, yaw: 0, hat: true, bob: 1.1, salute: i === 1 ? ramp(t, 37.6, 37.9) : 0, s: i === 1 ? 1.6 : 1.4 }));
  if (t >= 45.1) return Array.from({ length: 14 }, (_, i) => ({ pos: [POSTER[0] + 0.6 + (i % 5) * 0.55, 0, POSTER[2] + 1.2 + Math.floor(i / 5) * 0.6] as V3, yaw: 0.6, sign: 1, bob: 0.35, s: 1.4 }));
  return [];
};
export const PLAN: Plan = {
  ducks: duckPlan,
  car: (t) => (t >= 21.3 && t < 22.55 ? { pos: [TX0 + 1.6, 0, lerp(-17, -5.5, (t - 21.3) / 1.25)], yaw: 0, bump: Math.max(0, Math.sin((t - 21.3) * 11)) * 0.9 }
    : t >= 36.05 && t < 36.9 ? { pos: [TX0 + 1.6, 0, lerp(-20, -11, (t - 36.05) / 0.85)], yaw: 0, bump: 0 } : null),
  holes: (t) => t < 34,
  power: (t) => (t < 34 ? 0 : ramp(t, 35.25, 35.95)),
};

// ================= shots =================
// A. 0-5.05 bedroom: the TV news (insert) -> pan to Kevin asleep on "Kevin" -> he sits up, shocked, on "mayor"
const KS: V3 = [BED[0], 0.5, BED[2] - 0.45];
add({ a: 0, b: 5.05, light: "morning", dof: 9, focus: TV, shadowR: 6,
  actors: (t) => [{ who: "kevin", pos: t < 2.6 ? [BED[0] - 0.1, BED[1] - 0.04, BED[2] - 0.2] : KS, scale: 0.78,
    opts: (t < 2.6 ? { mode: "lie", expr: "asleep", zzz: (t * 0.8) % 1 } : t < 3.9 ? { mode: "sit", expr: "dazed", blink: t < 2.8 } : { mode: "sit", expr: "shock", exclaim: true, sweat: ramp(t, 4.0, 4.5) }) as FrontOpts }],
  cam: drift(path([
    K(0, [TV[0] + 0.68, TV[1] + 0.02, TV[2] - 0.5], TV, "closeUp"),
    K(1.0, [TV[0] + 0.85, TV[1] + 0.05, TV[2] - 0.62], TV, "closeUp"),
    K(2.4, [BX - 0.9, 1.3, 0.35], [BED[0], 0.9, BED[2] - 0.2], "medium", { ease: "inout" }),
    K(4.0, [BX - 0.15, 1.3, -0.55], [KS[0], 1.15, KS[2]], "closeUp", { ease: "out" }),
    K(5.05, [BX - 0.05, 1.3, -0.65], [KS[0], 1.15, KS[2]], "closeUp"),
  ])) });

// B. 5.05-7.0 bedroom: close on Kevin, baffled, the TV glowing in the foreground ("The problem? He had never even visited that town.")
add({ a: 5.05, b: 7.0, dis: DIS, light: "morning", dof: 10, focus: [KS[0], 1.15, KS[2]], shadowR: 6,
  actors: (t) => [{ who: "kevin", pos: KS, scale: 0.78, opts: { mode: "sit", expr: t < 5.7 ? "dazed" : "nervous", question: t > 5.6, headTilt: Math.sin(t * 2) * 6 } }],
  cam: drift(path([
    K(5.05, [KS[0] - 0.9, 1.2, KS[2] + 0.9], [KS[0], 1.15, KS[2]], "closeUp"),
    K(7.0, [KS[0] - 0.35, 1.18, KS[2] + 1.05], [KS[0], 1.18, KS[2]], "closeUp"),
  ])) });

// C. 7.0-10.9 town hall: the old mayor quits with his suitcase, the camera backs away in front of him; the committee panics on "mistake" (10.35)
const OM = (t: number): V3 => [lerp(HX + 1.0, HX - 0.2, smooth((t - 7.0) / 3.9)), 0, lerp(-4.5, 1.2, (t - 7.0) / 3.9)];
const committee = (t: number): ActorDef[] => [
  { who: "off1", pos: [HX - 4.0, 0.3, -2.6], scale: 0.76, opts: { mode: "sit", facing: 1, expr: t > 10.2 ? "shock" : "neutral", sweat: ramp(t, 10.3, 10.7) } },
  { who: "off2", pos: [HX - 4.0, 0.3, -1.6], scale: 0.76, opts: { mode: "sit", facing: 1, expr: t > 10.2 ? "nervous" : "smile_closed" } },
  { who: "off3", pos: [HX - 4.0, 0.3, -0.6], scale: 0.76, opts: { mode: "sit", facing: 1, expr: t > 10.2 ? "dazed" : "neutral", question: t > 10.4 } },
];
add({ a: 7.0, b: 10.9, dis: DIS, light: "hall", dof: 7, shadowR: 10, focus: [HX, 1.5, -1],
  actors: (t) => [{ who: "oldmayor", pos: OM(t), scale: 0.8, opts: { mode: "stroll", facing: -1, phase: t * 1.4, expr: "smile_closed", prop: "suitcase" } }, ...committee(t)],
  cam: (t: number) => { const p = OM(t), u = smooth((t - 7.0) / 3.9); return { pos: [p[0] + 1.2 - u * 1.6, 1.55, p[2] + 2.3], look: [p[0] - u * 2.4, 1.4, p[2] - 0.3 - u * 1.2], fov: 52 }; } });

// D. 10.9-14.75 insert: the list of people who owe the town money, KEVIN circled; top-down push-in
add({ a: 10.9, b: 14.75, dis: DIS, light: "hall", dof: 6, focus: LIST, shadowR: 4,
  cam: path([
    K(10.9, [LIST[0] + 0.05, 1.75, LIST[2] + 0.35], [LIST[0], LIST[1], LIST[2]], "medium"),
    K(13.0, [LIST[0] - 0.02, 1.32, LIST[2] + 0.1], [LIST[0] - 0.06, LIST[1], LIST[2] + 0.02], "closeUp", { ease: "out" }),
    K(14.75, [LIST[0] - 0.04, 1.22, LIST[2] + 0.06], [LIST[0] - 0.08, LIST[1], LIST[2] + 0.02], "closeUp"),
  ]) });

// E. 14.75-17.2 town hall: Kevin walks up the red carpet between clapping officials; crane up to the enormous chair ("everyone believed he was qualified")
const KW = (t: number): V3 => [HX, 0, lerp(1.5, -3.6, (t - 14.75) / 2.45)];
add({ a: 14.75, b: 17.2, dis: DIS, light: "hall", dof: 6, shadowR: 12, focus: [HX, 1.4, -2],
  actors: (t) => [{ who: "kevin", pos: KW(t), scale: 0.78, opts: { mode: "stroll", back: true, phase: t * 1.5, expr: "nervous" } },
    ...[[-1.6, -0.5], [1.6, -0.2], [-1.7, -2.2], [1.7, -2.6], [-1.5, 1.0]].map(([x, z], i) => ({ who: ["off1", "off2", "off3", "r6", "r1"][i] + "#e" + i, pos: [HX + x, 0, z] as V3, scale: 0.76,
      opts: { mode: "stand", facing: x < 0 ? 1 : -1, expr: i % 2 ? "laugh" : "grin", wave: Math.abs(Math.sin(t * 8 + i)), phase: t } as FrontOpts }))],
  cam: (t: number) => { const p = KW(t), u = smooth((t - 14.75) / 2.45); return { pos: [HX + 0.4, 1.4 + u * 1.6, p[2] + 2.6 + u * 0.6], look: [HX, 1.4 + u * 1.5, p[2] - 3 - u * 1.5], fov: lerp(54, 58, u) }; } });

// F. 17.2-19.9 Kevin tiny in the giant chair, an official hands him the problems; low-angle push-in, he gulps
add({ a: 17.2, b: 19.9, dis: DIS, light: "hall", dof: 8, focus: [THRONE[0], 1.9, THRONE[2]], shadowR: 8,
  actors: (t) => [{ who: "kevin", pos: THRONE, scale: 0.78, opts: { mode: "sit", expr: t < 18.6 ? "smile" : "nervous", sweat: ramp(t, 18.6, 19.2) } },
    { who: "off1", pos: [HX + 1.35, 0.4, -5.4], scale: 0.76, opts: { mode: "stand", facing: -1, expr: "grin", prop: "letter", phase: t } }],
  cam: drift(path([
    K(17.2, [HX + 0.4, 0.75, -2.4], [HX + 0.1, 2.0, -6.4], "medium"),
    K(19.9, [HX + 0.3, 1.25, -4.2], [HX + 0.1, 1.85, -6.5], "closeUp", { ease: "out" }),
  ])) });

// G. 19.9-21.35 blackout street at night: residents with candles, fuming ("The town had no electricity,")
add({ a: 19.9, b: 21.35, dis: DIS, light: "dark", dof: 6, shadowR: 14, focus: [TX0 - 4.6, 1.4, -6],
  actors: (t) => crowdAt(t, [[TX0 - 4.6, -5.6], [TX0 - 5.4, -6.6], [TX0 - 3.8, -7.4], [TX0 - 5.6, -8.4]], (i) => ({ mode: "stand", expr: "stern", angry: i % 2 ? 0.5 : 0.9, steam: i === 0 ? 1 : 0, prop: "candle" }), "g"),
  cam: drift(path([
    K(19.9, [TX0 - 2.4, 1.5, -3.0], [TX0 - 4.8, 1.5, -6.6], "medium"),
    K(21.35, [TX0 - 2.9, 1.45, -4.1], [TX0 - 4.9, 1.45, -7.0], "closeUp"),
  ])) });

// H. 21.35-22.5 day: a car crashes through the potholes straight at the low camera ("the roads were full of holes,")
add({ a: 21.35, b: 22.5, dis: DIS, light: "day", dof: 4, shadowR: 14, focus: [TX0 + 1.6, 0.6, -9],
  cam: path([
    K(21.35, [TX0 + 0.6, 0.35, -3.0], [TX0 + 1.4, 0.55, -14], "travel"),
    K(22.5, [TX0 + 0.3, 0.3, -2.4], [TX0 + 1.6, 0.6, -7], "travel"),
  ]) });

// I. 22.5-25.4 the pool, taken over by ducks; swimmers in towels stare; low over the water, push in
add({ a: 22.5, b: 25.4, dis: DIS, light: "day", dof: 5, shadowR: 12, focus: [POOL[0], 0.5, POOL[2]],
  actors: (t) => crowdAt(t, [[POOL[0] - 6.0, POOL[2] + 1.0], [POOL[0] - 6.0, POOL[2] - 0.6], [POOL[0] + 6.0, POOL[2] + 0.4]], (i) => ({ mode: "stand", expr: i === 1 ? "shock" : "dazed", question: true, facing: i < 2 ? 1 : -1 }), "i"),
  cam: drift(path([
    K(22.5, [POOL[0] - 3.5, 0.75, POOL[2] + 5.6], [POOL[0], 0.1, POOL[2]], "establishing"),
    K(25.4, [POOL[0] - 1.6, 0.45, POOL[2] + 3.4], [POOL[0], 0.15, POOL[2] + 0.3], "medium", { ease: "out" }),
  ])) });

// J. 25.4-28.75 Kevin at the pool edge sizes it up, ducks in the foreground; on "decision" (27.86) the finger goes up
const KP: V3 = [POOL[0] - 2.2, 0.06, POOL[2] + 3.9];
add({ a: 25.4, b: 28.75, dis: DIS, light: "day", dof: 9, shadowR: 10, focus: [KP[0], 1.4, KP[2]],
  actors: (t) => [{ who: "kevin", pos: KP, scale: 0.78, opts: { mode: "stand", facing: 0, phase: t, expr: t < 27.8 ? "dazed" : "grin", headTilt: t < 27.8 ? 8 : 0, prop: t > 27.8 ? "point" : null, sparkleEyes: t > 27.9 } },
    { who: "off1#j", pos: [KP[0] + 1.0, 0.06, KP[2] + 0.4], scale: 0.76, opts: { mode: "stand", facing: -1, expr: "nervous", phase: t, prop: "letter" } }],
  cam: drift(path([
    K(25.4, [KP[0] + 0.3, 1.3, KP[2] - 2.6], [KP[0], 1.35, KP[2]], "medium"),
    K(27.85, [KP[0] + 0.15, 1.45, KP[2] - 1.5], [KP[0], 1.45, KP[2]], "closeUp", { ease: "out" }),
    K(28.75, [KP[0] + 0.1, 1.45, KP[2] - 1.4], [KP[0], 1.5, KP[2]], "closeUp"),
  ])) });

// K. 28.75-30.98 the podium, low angle past a line of capped ducks in the foreground; slow push-in; they salute on "security"
const KPOD: V3 = [PODIUM[0], 1.0, PODIUM[2] - 0.55];
add({ a: 28.75, b: 30.98, dis: DIS, light: "day", dof: 7, shadowR: 12, focus: [KPOD[0], 2.1, KPOD[2]],
  actors: (t) => [{ who: "kevin", pos: KPOD, scale: 0.78, opts: { mode: "stand", facing: 0, phase: t, expr: "grin", prop: "point" } },
    ...crowdAt(t, [[PODIUM[0] - 3.2, PODIUM[2] - 1.4], [PODIUM[0] + 3.0, PODIUM[2] - 1.6]], () => ({ mode: "stand", expr: "dazed" }), "k", 0.5)],
  cam: drift(path([
    K(28.75, [PODIUM[0] + 0.6, 1.05, PODIUM[2] + 4.2], [PODIUM[0], 1.95, PODIUM[2] - 0.5], "medium"),
    K(30.98, [PODIUM[0] + 0.3, 1.2, PODIUM[2] + 3.3], [PODIUM[0], 2.05, PODIUM[2] - 0.5], "closeUp"),
  ])) });

// L. 30.98-33.24 the duck patrol marches at duck height toward the lens; a thief with a bag runs into them and freezes (32.2)
const TH = (t: number): V3 => [TX0 + 0.2, 0, Math.min(-12.6, lerp(-6, -12.6, (t - 30.98) / 1.2))];
add({ a: 30.98, b: 33.24, dis: DIS, light: "day", dof: 6, shadowR: 12, focus: [TX0, 0.5, -14.2],
  actors: (t) => [{ who: "thief", pos: TH(t), scale: 0.78, opts: (t < 32.15 ? { mode: "run", facing: 0, back: true, phase: t * 2.2, expr: "grin", prop: "bag" } : { mode: "stand", facing: 0, expr: "terror", sweat: 1, exclaim: true, back: false, prop: "bag" }) as FrontOpts }],
  cam: path([
    K(30.98, [TX0 - 0.6, 0.32, -10.6], [TX0, 0.4, -18], "travel"),
    K(32.1, [TX0 - 0.5, 0.35, -10.9], [TX0, 0.5, -15], "travel"),
    K(33.24, [TX0 - 1.1, 0.75, -10.6], [TX0 + 0.1, 1.0, -13.4], "medium", { ease: "out" }),
  ]) });

// M. 33.24-34.26 the street cheers Kevin ("People started loving him.")
add({ a: 33.24, b: 34.26, dis: DIS, light: "day", dof: 7, shadowR: 12, focus: [TX0 - 4.9, 1.45, -1],
  actors: (t) => [{ who: "kevin", pos: [TX0 - 4.9, 0.12, -1.0], scale: 0.78, opts: { mode: "stand", expr: "laugh", wave: Math.abs(Math.sin(t * 7)), phase: t, blush: 0.6 } },
    ...crowdAt(t, [[TX0 - 3.8, -0.3], [TX0 - 5.9, -0.2], [TX0 - 3.6, -2.0], [TX0 - 5.8, -2.3]], (i) => ({ mode: "stand", expr: i % 2 ? "laugh" : "grin", wave: Math.abs(Math.sin(t * 8 + i)), sparkleEyes: i === 1 }), "m", 0.12)],
  cam: drift(path([
    K(33.24, [TX0 - 2.6, 1.4, 1.8], [TX0 - 4.9, 1.4, -1.0], "twoShot"),
    K(34.26, [TX0 - 3.1, 1.45, 1.3], [TX0 - 4.9, 1.45, -1.0], "twoShot"),
  ])) });

// N. 34.26-36.1 night: the street lights up house by house as the camera cranes up ("Within a week, the town had electricity,")
add({ a: 34.26, b: 36.1, dis: DIS, light: "night", dof: 3, shadowR: 16, focus: [TX0, 2, -12],
  cam: drift(path([
    K(34.26, [TX0 + 1.0, 1.6, 6.0], [TX0 - 1.0, 2.2, -10], "travel"),
    K(36.1, [TX0 + 1.4, 6.5, 8.0], [TX0, 2.5, -18], "establishing", { ease: "inout" }),
  ])) });

// O. 36.1-36.85 day: the car glides along the smooth new road (low tracking alongside) ("repaired roads,")
add({ a: 36.1, b: 36.85, dis: DIS, light: "day", dof: 4, shadowR: 14, focus: [TX0 + 1.6, 0.8, -15],
  cam: (t: number) => { const z = lerp(-18.5, -10.5, (t - 36.05) / 0.85); return { pos: [TX0 - 1.2, 0.5, z + 2.6], look: [TX0 + 1.6, 0.7, z - 0.4], fov: 56 }; } });

// P. 36.85-38.9 extreme close-up of the lead duck in his tiny security hat; he salutes; the patrol behind ("and ducks wearing tiny security hats.")
add({ a: 36.85, b: 38.9, dis: DIS, light: "day", dof: 10, shadowR: 6, focus: [TX0, 0.75, -11.4],
  cam: (t: number) => { const z = -12 + (t - 36.8) * 0.5; const u = smooth((t - 36.85) / 2.05); return { pos: [TX0 + 0.15 - u * 0.1, 0.72, z + 1.9 - u * 0.75], look: [TX0, 0.68, z], fov: 48 }; } });

// Q. 38.9-42.17 the square: confetti, the cheering crowd, Kevin on stage; push in to the results board on "ninety eight" (40.57)
const KST: V3 = [PODIUM[0] + 1.2, 0.5, PODIUM[2] - 0.9];
add({ a: 38.9, b: 42.17, dis: DIS, light: "day", dof: 5, shadowR: 16, focus: [KST[0], 1.8, KST[2]],
  actors: (t) => [{ who: "kevin", pos: KST, scale: 0.78, opts: { mode: t < 40.6 ? "jump" : "stand", expr: "laugh", phase: t, sparkleEyes: true } },
    ...crowdAt(t, [[PODIUM[0] - 2.6, PODIUM[2] + 4.4], [PODIUM[0] - 1.0, PODIUM[2] + 4.8], [PODIUM[0] + 0.8, PODIUM[2] + 4.5], [PODIUM[0] + 2.6, PODIUM[2] + 4.9], [PODIUM[0] - 3.6, PODIUM[2] + 5.6], [PODIUM[0] + 3.8, PODIUM[2] + 5.4]],
      (i) => ({ mode: "stand", back: true, wave: Math.abs(Math.sin(t * 8 + i)) }), "q")],
  cam: path([
    K(38.9, [PODIUM[0] - 0.6, 1.9, PODIUM[2] + 8.8], [PODIUM[0] + 0.8, 1.8, PODIUM[2] - 1], "establishing"),
    K(40.5, [PODIUM[0] + 1.2, 2.2, PODIUM[2] + 6.6], [PODIUM[0] + 2.6, 2.4, PODIUM[2] - 2.5], "medium"),
    K(41.4, [BOARD[0] - 1.3, BOARD[1] - 0.2, BOARD[2] + 3.6], BOARD, "medium", { ease: "out" }),
    K(42.17, [BOARD[0] - 1.25, BOARD[1] - 0.2, BOARD[2] + 3.4], BOARD, "medium"),
  ]) });

// R. 42.17-45.3 Kevin, alone with the board: confused, then slowly suspicious ("He was confused. Until he discovered who the other two percent were.")
const KR: V3 = [PODIUM[0] + 1.6, 0.5, PODIUM[2] - 0.8];
add({ a: 42.17, b: 45.3, dis: DIS, light: "day", dof: 10, shadowR: 10, focus: [KR[0], 1.62, KR[2]],
  actors: (t) => [{ who: "kevin", pos: KR, scale: 0.78, opts: { mode: "stand", facing: t < 43.9 ? 1 : -1, expr: t < 43.9 ? "dazed" : "stern", question: t < 43.9, phase: t, headTilt: t < 43.9 ? 10 : -4 } }],
  cam: drift(path([
    K(42.17, [KR[0] - 0.9, 1.7, KR[2] + 2.0], [KR[0], 1.62, KR[2]], "closeUp"),
    K(45.3, [KR[0] - 0.35, 1.62, KR[2] + 1.35], [KR[0], 1.64, KR[2]], "closeUp"),
  ]), 0.015) });

// S. 45.3-48.6 the twist: WHIP to the ducks with their tiny campaign posters, up to the VOTE QUACKERS poster on "candidate", whip back to Kevin's horror
add({ a: 45.3, b: 48.6, light: "day", dof: 8, shadowR: 10, focus: [POSTER[0] + 1.2, 0.6, POSTER[2] + 1.6],
  actors: (t) => [{ who: "kevin", pos: KR, scale: 0.78, opts: (t < 47.4 ? { mode: "stand", facing: -1, expr: "stern", phase: t } : { mode: "stand", facing: 0, expr: "terror", sweat: 1, exclaim: true, phase: t }) as FrontOpts }],
  cam: path([
    K(45.3, [KR[0] - 0.4, 1.65, KR[2] + 1.4], [KR[0] - 1.5, 1.4, KR[2]], "closeUp"),
    K(45.6, [POSTER[0] + 3.4, 0.7, POSTER[2] + 4.2], [POSTER[0] + 1.6, 0.45, POSTER[2] + 1.8], "medium", { ease: "inout" }),
    K(46.6, [POSTER[0] + 2.8, 0.6, POSTER[2] + 3.6], [POSTER[0] + 1.6, 0.45, POSTER[2] + 1.8], "medium"),
    K(47.25, [POSTER[0] + 1.6, 2.2, POSTER[2] + 2.6], POSTER, "closeUp", { ease: "out" }),
    K(47.6, [KR[0] - 0.2, 1.62, KR[2] + 1.25], [KR[0], 1.62, KR[2]], "closeUp", { ease: "inout" }),
    K(48.6, [KR[0] - 0.12, 1.63, KR[2] + 1.0], [KR[0], 1.63, KR[2]], "closeUp"),
  ]) });

export const SHOTS = S;
export const shotAt = at;
