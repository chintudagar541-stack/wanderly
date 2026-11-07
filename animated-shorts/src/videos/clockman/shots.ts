// "The Clock Man" demo shots. Every shot is ONE continuous camera move (path keys), shots join with short dissolves
// (0.2-0.3 s) like the references, and the characters act out the key words (asleep -> boss steams -> "fired" launches
// Walter out of frame). Times follow shorts/clockman/voice/lines.json.
import { LightName, OX, TWX, TOWER, WALLCLOCK } from "./world";
import { Outfit, FrontOpts } from "../dead/toon";
import { ActorDef, V3, path, drift, shotList, ramp, smooth, lerp } from "../../lib3d/camera";

export const FPS = 30;
export const DURATION = 18.4;
export const TOTAL = Math.round(DURATION * FPS);

const HEAD = { headStyle: "ref" } as Partial<Outfit>;
export const outfitOf = (who: string): Outfit => {
  const o: Record<string, Outfit> = {
    walter: { jacket: "#2a9a8a", pants: "#2a3a5a", boots: "#5a3420", hat: "hair", hair: "#6a4024", skin: "#f7f2ea" },
    boss: { jacket: "#1f2a50", pants: "#1f2a50", boots: "#1a1a1a", hat: "hair", hair: "#a0a0a8", moustache: "#a0a0a8", buttons: "#e8b84a", skin: "#f7f2ea", build: "stout" },
    w1: { jacket: "#8a3a6a", pants: "#3a3a40", dress: "#8a3a6a", boots: "#1a1a1a", hat: "longHair", hairStyle: "bun", hair: "#3a2a2a", skin: "#f7f2ea" },
    w2: { jacket: "#d8823a", pants: "#3a3a40", dress: "#d8823a", boots: "#1a1a1a", hat: "longHair", hairStyle: "bob", hair: "#8a4a24", skin: "#f7f2ea" },
    m1: { jacket: "#c83a3a", pants: "#2a2a40", boots: "#1a1a1a", hat: "fedora", cap: "#2a2a30", moustache: "#4a2a1a", skin: "#f7f2ea" },
    m2: { jacket: "#3a6ab0", pants: "#2a2a40", boots: "#1a1a1a", hat: "cap", cap: "#3a3a4a", skin: "#f7f2ea" },
    m3: { jacket: "#6a8a3a", pants: "#3a3020", boots: "#1a1a1a", hat: "tophat", cap: "#1a1a20", skin: "#f7f2ea" },
  };
  return { ...(o[who] ?? o.m1), ...HEAD } as Outfit;
};

const { S, add, at } = shotList<LightName>();
const W_SIT: V3 = [OX + 0.2, 0.45, -2.5];          // Walter in his chair, feet on the desk
const W_HEAD: V3 = [OX + 0.2, 1.5, -2.5];
const talk = (t: number): FrontOpts["expr"] => (Math.floor(t * 9) % 3 === 0 ? "smile_closed" : "grin");

// ---------- 1. 0-2.2 office: punch-in from the doorway onto Walter, feet up ("This man got fired for doing almost nothing")
add({ a: 0, b: 2.2, light: "office", dof: 9, focus: W_HEAD, shadowR: 7,
  actors: (t) => [{ who: "walter", pos: W_SIT, scale: 0.78, opts: { mode: "sit", expr: t < 1.2 ? "smile" : "smile_closed", prop: "cup", headTilt: 6 } }],
  cam: drift(path([
    { t: 0, pos: [OX + 1.7, 1.48, 2.4], look: [OX + 0.3, 1.48, -2.3], fov: 66 },
    { t: 0.6, pos: [OX + 0.9, 1.48, -0.3], look: [OX + 0.2, 1.45, -2.3], fov: 50, ease: "out" },
    { t: 2.2, pos: [OX + 0.35, 1.41, -0.75], look: [OX + 0.2, 1.51, -2.3], fov: 47 },
  ])) });

// ---------- 2. 2.2-3.75 town night: crane down from the frozen tower clock to the puzzled crowd ("...broke an entire town")
const crowd = (t: number, look = true): ActorDef[] => ([
  ["w1", -1.6, -31.2], ["m1", 0.2, -30.6], ["m2", 1.7, -31.4], ["w2", -0.6, -33.2], ["m3", 1.0, -33.6], ["m2b", -2.6, -33.0], ["w1b", 2.8, -32.4],
] as [string, number, number][]).map(([who, x, z], i) => ({ who: who.replace(/b$/, ""), pos: [TWX + x, 0, z] as V3, scale: 0.78,
  opts: { mode: "stand", expr: i % 3 === 0 ? "nervous" : i % 3 === 1 ? "dazed" : "shock", question: look && Math.sin(t * 3 + i) > -0.6, headTilt: (i % 2 ? 1 : -1) * 6 } as FrontOpts }));
add({ a: 2.2, b: 3.75, dis: 0.25, light: "night", dof: 5, shadowR: 14, actors: (t) => crowd(t),
  cam: path([
    { t: 2.2, pos: [TWX + 0.6, 9.6, -39.5], look: [TWX, 9.0, -44.3], fov: 52 },
    { t: 3.75, pos: [TWX + 1.6, 3.2, -36.4], look: [TWX, 1.3, -31.8], fov: 60, ease: "inout" },
  ]) });

// ---------- 3. 3.75-7.2 office: low orbit + crane up around Walter ("In 1904, a clerk named Walter had the easiest job in town")
add({ a: 3.75, b: 7.2, dis: 0.25, light: "office", dof: 10, focus: W_HEAD, shadowR: 7,
  actors: (t) => [{ who: "walter", pos: W_SIT, scale: 0.78, opts: { mode: "sit", expr: t > 5.6 ? "grin" : "smile", prop: t < 5.4 ? "cup" : "newspaper", headTilt: Math.sin(t * 2) * 4 } }],
  cam: drift(path([
    { t: 3.75, pos: [OX - 1.6, 0.08, -0.6], look: [OX + 0.1, 0.93, -2.3], fov: 64 },
    { t: 5.4, pos: [OX - 0.9, 0.88, -0.2], look: [OX + 0.2, 1.33, -2.3], fov: 54 },
    { t: 7.2, pos: [OX + 0.8, 1.58, -0.45], look: [OX + 0.2, 1.53, -2.3], fov: 48 },
  ])) });

// ---------- 4. 7.2-9.95 office: from the spinning clock face, pull back + down to Walter on a chair winding it
const W_UP: V3 = [OX - 0.45, 0.47, -2.62];
add({ a: 7.2, b: 9.95, dis: 0.2, light: "office", dof: 12, focus: [WALLCLOCK[0] - 0.3, 2.1, -2.8], shadowR: 7,
  actors: (t) => [{ who: "walter", pos: W_UP, scale: 0.78, yaw: 0.25, opts: { mode: "stand", expr: t < 9.3 ? "grin" : "smile_closed", prop: t < 9.2 ? "point" : null, phase: t * 3 } }],
  cam: path([
    { t: 7.2, pos: [WALLCLOCK[0] + 0.15, WALLCLOCK[1] + 0.05, -1.75], look: [WALLCLOCK[0], WALLCLOCK[1], WALLCLOCK[2]], fov: 50 },
    { t: 8.3, pos: [WALLCLOCK[0] + 0.45, 2.1, -1.2], look: [WALLCLOCK[0] - 0.45, 2.1, -2.9], fov: 54 },
    { t: 9.95, pos: [OX + 0.7, 1.55, -0.95], look: [OX - 0.3, 1.8, -2.65], fov: 52, ease: "out" },
  ]) });

// ---------- 5a. 9.95-10.9 office: close on Walter asleep ("Then one Monday")
add({ a: 9.95, b: 10.9, dis: 0.2, light: "office", dof: 10, focus: W_HEAD, shadowR: 7,
  actors: (t) => [{ who: "walter", pos: W_SIT, scale: 0.78, opts: { mode: "sit", expr: "asleep", zzz: ((t - 9.9) * 0.9) % 1 } }],
  cam: drift(path([
    { t: 9.95, pos: [OX - 0.5, 1.68, -0.6], look: [OX + 0.2, 1.43, -2.3], fov: 50 },
    { t: 10.9, pos: [OX - 0.15, 1.58, -1.0], look: [OX + 0.2, 1.45, -2.3], fov: 46 },
  ])) });
// ---------- 5b. 10.9-11.9 office: Walter's view: the boss strides in from the door and boils ("his boss caught him asleep")
const bossPos = (t: number): V3 => { const u = smooth((t - 10.6) / 1.2); return [lerp(OX + 1.6, OX + 0.95, u), 0, lerp(1.9, -0.9, u)]; };
add({ a: 10.9, b: 11.9, light: "office", dof: 8, focus: [OX + 1.1, 1.5, -0.6], shadowR: 8,
  actors: (t) => [{ who: "boss", pos: bossPos(t), scale: 0.82, opts: { mode: t < 11.75 ? "stroll" : "stand", phase: t * 1.6, expr: "stern", angry: ramp(t, 11.1, 11.6), steam: t > 11.35 ? 1 : 0 } }],
  cam: path([
    { t: 10.9, pos: [OX + 0.1, 1.15, -2.2], look: [OX + 1.3, 1.45, 0.6], fov: 58 },
    { t: 11.9, pos: [OX + 0.2, 1.1, -2.0], look: [OX + 1.05, 1.6, -0.4], fov: 52, ease: "out" },
  ]) });

// ---------- 6. 11.9-13.2 office: punch-in on Walter waking in shock; on "fired" (12.28) he is launched out of the window
const LAUNCH = 12.28;
const launch = (u: number): V3 => [W_SIT[0] - 4.8 * u, W_SIT[1] + 3.2 * u - 3.4 * u * u, W_SIT[2] + 2.3 * u];
const office6 = (t: number): ActorDef[] => {
  const u = Math.max(0, t - LAUNCH);
  return [
    { who: "walter", pos: launch(u), scale: 0.78, roll: u * 10,
      opts: u > 0 ? { mode: "jump", expr: "terror", sweat: 1 } : { mode: "sit", expr: "shock", sweat: ramp(t, 11.9, 12.2), exclaim: true } },
  ];
};
add({ a: 11.9, b: 13.2, light: "office", dof: 9, focus: W_HEAD, shadowR: 7, actors: office6,
  cam: path([
    { t: 11.9, pos: [OX + 1.3, 1.43, -0.2], look: [OX + 0.2, 1.38, -2.3], fov: 54 },
    { t: 12.25, pos: [OX + 0.6, 1.51, -1.05], look: [OX + 0.2, 1.45, -2.3], fov: 46, ease: "out" },
    { t: 13.2, pos: [OX + 0.9, 1.33, -0.9], look: [OX - 2.6, 1.33, -0.7], fov: 50, ease: "out" },
  ]) });

// ---------- 7. 13.2-14.75 town night: off the frozen tower clock, pull back and down over the snowy street ("That night, every clock in town stopped")
add({ a: 13.2, b: 14.75, dis: 0.25, light: "night", dof: 4, shadowR: 16, actors: (t) => crowd(t, false),
  cam: path([
    { t: 13.2, pos: [TWX + 0.25, TOWER[1] + 0.1, -41.2], look: [TWX, TOWER[1], -44.3], fov: 48 },
    { t: 14.75, pos: [TWX + 2.6, 5.2, -27.5], look: [TWX, 6.5, -44], fov: 58, ease: "inout" },
  ]) });

// ---------- 8. 14.75-18.4 town: Walter walks into the puzzled crowd, grinning; crane up to the whole town ("He was winding the whole town")
const finale = (t: number): ActorDef[] => [
  ...crowd(t),
  { who: "walter", pos: [TWX + 0.4, 0, lerp(-26.2, -28.2, smooth((t - 14.75) / 2))], scale: 0.78, opts: { mode: t < 16.6 ? "stroll" : "stand", phase: t * 1.5, expr: t < 15.9 ? "smile" : "grin", prop: t > 16.4 ? "point" : null } },
];
add({ a: 14.75, b: 18.4, dis: 0.2, light: "night", dof: 6, focus: [TWX + 0.4, 1.4, -27.5], shadowR: 16, actors: finale,
  cam: path([
    { t: 14.75, pos: [TWX + 1.2, 1.25, -23.6], look: [TWX + 0.3, 1.35, -27.6], fov: 58 },
    { t: 16.3, pos: [TWX + 0.6, 1.5, -24.8], look: [TWX + 0.4, 1.4, -28.2], fov: 50 },
    { t: 18.4, pos: [TWX + 3.5, 13, -10], look: [TWX, 5.5, -40], fov: 62, ease: "in" },
  ]) });

export const SHOTS = S;
export const shotAt = at;
