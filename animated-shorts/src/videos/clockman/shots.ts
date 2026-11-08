// "The Clock Man" demo shots, built on the grammar of the reference office short (ref2), studied frame by frame:
//  - characters close to the lens (head 35-55 % of the frame width), wides are rare and short;
//  - every shot is one continuous move with beats (object close-up -> tilt to the face -> pull back to reveal);
//  - joins are 7-frame dissolves, MATCHED: round face -> round clock, office clock -> tower clock, at the same screen spot;
//  - a punch-in + whip pan (with motion blur) on the beat, and the gag on the key word ("fired": shot up through the ceiling);
//  - inserts of story objects (the calendar "MON").
// Times follow shorts/clockman/voice/words.json.
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
  return { ...(o[who.split("#")[0]] ?? o.m1), ...HEAD } as Outfit;
};

const { S, add, at } = shotList<LightName>();
const W_SIT: V3 = [OX + 0.2, 0.72, -2.06];          // Walter in his chair, feet on the desk
const W_HEAD: V3 = [OX + 0.2, 1.5, -2.06];
const DIS = 0.23;   // 7 frames, the reference median

const crowdMain = (t: number, look = true): ActorDef[] => ([
  ["w1", -1.6, -31.2], ["m1", 0.2, -30.6], ["m2", 1.7, -31.4], ["w2", -0.6, -33.2], ["m3", 1.0, -33.6], ["m2b", -2.6, -33.0], ["w1b", 2.8, -32.4],
] as [string, number, number][]).map(([who, x, z], i) => ({ who: `${who.replace(/b$/, "")}#c${i}`, pos: [TWX + x, 0, z] as V3, scale: 0.78,
  opts: { mode: "stand", facing: i % 2 ? 1 : -1, phase: t + i * 0.7, blink: Math.sin(t * 2.3 + i * 1.7) > 0.96, expr: i % 3 === 0 ? "nervous" : i % 3 === 1 ? "dazed" : "shock", question: look && Math.sin(t * 3 + i) > -0.6, headTilt: (i % 2 ? 1 : -1) * 6 } as FrontOpts }));
// background townsfolk: strolling on the sidewalks and chatting by the stalls (the references always have extras)
const EXTRAS: [string, number, number, number][] = [["m1", -3.4, -12, 1], ["w2", 3.6, -16, -1], ["m3", -3.8, -19, 0], ["w1", 4.2, -22.5, 0], ["m2", -3.2, -38, 1], ["w2", 4.6, -36.8, 0], ["m1", 3.4, -40, -1], ["w1", -4.4, -33, 0], ["m3", 4.0, -29, 0], ["m2", -4.6, -8, 0]];
const extras = (t: number): ActorDef[] => EXTRAS.map(([who, x, z, dir], i) => ({ who: `${who}#x${i}`, pos: [TWX + x + (dir ? dir * 0.0 : 0), 0, z + (dir ? -dir * 0.9 * ((t * 0.5 + i * 0.3) % 4) : 0)] as V3, scale: 0.76,
  opts: { mode: dir ? "stroll" : "stand", facing: dir ? (dir > 0 ? -1 : 1) : (i % 2 ? 1 : -1), phase: dir ? t * 1.5 + i : t + i, expr: dir ? "smile" : i % 2 ? "laugh" : "smile_closed", mouthOpen: dir ? 0 : Math.max(0, Math.sin(t * 9 + i)) } as FrontOpts }));
const crowd = (t: number, look = true): ActorDef[] => [...crowdMain(t, look), ...extras(t)];

// ---------- A. 0-2.15 office: Walter's shoes huge in the foreground, push up past them to his face ("This man got fired for doing almost nothing,")
add({ a: 0, b: 2.15, light: "office", dof: 11, focus: W_HEAD, shadowR: 6,
  actors: (t) => [{ who: "walter", pos: W_SIT, scale: 0.78, opts: { mode: "sitFeetUp", expr: t < 1.0 ? "smile" : "smile_closed", prop: "phone", glow: 0.8, headTilt: 5, phase: t, blink: t > 1.4 && t < 1.5 } }],
  cam: drift(path([
    { t: 0, pos: [OX + 0.3, 0.98, -1.2], look: [OX + 0.2, 1.3, -2.06], fov: 56 },
    { t: 2.15, pos: [OX + 0.25, 1.52, -0.52], look: W_HEAD, fov: 48, ease: "out" },
  ]), 0.02) });

// ---------- B. 2.15-3.75 town: MATCH his round face -> the round tower clock, then pull back and down over the puzzled crowd ("and it broke an entire town.")
add({ a: 2.15, b: 3.75, dis: DIS, light: "night", dof: 5, shadowR: 14, actors: (t) => crowd(t),
  cam: path([
    { t: 2.15, pos: [TWX, TOWER[1], TOWER[2] + 9.4], look: [TWX, TOWER[1], TOWER[2]], fov: 48 },
    { t: 3.75, pos: [TWX + 1.6, 2.4, -24.2], look: [TWX, 3.2, -34], fov: 56, ease: "inout" },
  ]) });

// ---------- C. 3.75-7.2 office: the ticking wall clock -> tilt down to Walter's face on "Walter" -> pull back to reveal him, feet up
add({ a: 3.75, b: 7.2, dis: DIS, light: "office", dof: 10, focus: W_HEAD, shadowR: 7,
  actors: (t) => [{ who: "walter", pos: W_SIT, scale: 0.78, opts: { mode: "sitFeetUp", expr: t > 5.7 ? "grin" : "smile", prop: "phone", glow: 0.8, headTilt: Math.sin(t * 2) * 4, blink: t > 6.3 && t < 6.4 } }],
  cam: drift(path([
    { t: 3.75, pos: [OX + 0.25, 2.42, 0.25], look: WALLCLOCK, fov: 50 },
    { t: 4.6, pos: [OX + 0.25, 2.3, -0.2], look: [WALLCLOCK[0], 2.3, WALLCLOCK[2]], fov: 50 },
    { t: 5.4, pos: [OX + 0.25, 1.55, -0.5], look: W_HEAD, fov: 48, ease: "out" },
    { t: 7.2, pos: [OX + 0.85, 1.95, 0.55], look: [OX + 0.2, 1.45, -2.2], fov: 54 },
  ])) });

// ---------- D. 7.2-9.95 office: close two-shot of Walter on a chair winding the clock (hands spin), slow orbit; "That was it." he turns, shrugs
const W_UP: V3 = [OX - 0.42, 0.83, -2.6];
add({ a: 7.2, b: 9.95, dis: DIS, light: "office", dof: 9, focus: [OX - 0.25, 2.35, -2.7], shadowR: 6,
  actors: (t) => [{ who: "walter", pos: W_UP, scale: 0.78, opts: t < 9.3 ? { mode: "stand", facing: 1, expr: "grin", prop: "point", phase: t } : { mode: "stand", facing: 0, expr: "smile_closed", phase: t, headTilt: -8 } }],
  cam: drift(path([
    { t: 7.2, pos: [OX - 0.6, 2.35, -0.95], look: [OX - 0.1, 2.3, -2.8], fov: 52 },
    { t: 9.3, pos: [OX + 0.4, 2.3, -0.95], look: [OX - 0.15, 2.3, -2.8], fov: 50 },
    { t: 9.95, pos: [OX + 0.05, 2.35, -1.05], look: [OX - 0.42, 2.4, -2.6], fov: 46, ease: "out" },
  ])) });

// ---------- E. 9.95-10.9 insert: the desk calendar "MON" pushes in ("Then one Monday,")
add({ a: 9.95, b: 10.9, dis: DIS, light: "office", dof: 8, focus: [OX + 1.4, 1.65, -2.98], shadowR: 6,
  cam: path([
    { t: 9.95, pos: [OX + 1.25, 1.62, -1.75], look: [OX + 1.4, 1.65, -2.98], fov: 52 },
    { t: 10.9, pos: [OX + 1.38, 1.66, -2.2], look: [OX + 1.4, 1.65, -2.98], fov: 50, ease: "out" },
  ]) });

// ---------- F. 10.9-13.2 office, one move with beats: Walter asleep, the boss leans in from the right foreground and boils;
//            punch-in on the boss, WHIP to Walter on "fired" (12.28), he shoots up through the ceiling, tilt up to the hole
const LAUNCH = 12.28;
const bossX = (t: number) => lerp(OX + 1.05, OX + 0.62, smooth((t - 10.9) / 0.7));
const officeF = (t: number): ActorDef[] => {
  const u = Math.max(0, t - LAUNCH);
  return [
    { who: "walter", pos: [W_SIT[0], W_SIT[1] + 9 * u, W_SIT[2]], scale: 0.78,
      opts: u > 0 ? { mode: "jump", expr: "terror", sweat: 1 } : t < 12.0 ? { mode: "sitFeetUp", expr: "asleep", zzz: ((t - 10.9) * 0.9) % 1 } : { mode: "sitFeetUp", expr: "shock", sweat: 1, exclaim: true } },
    { who: "boss", pos: [bossX(t), 0, -0.8], scale: 0.82, opts: { mode: t < 11.55 ? "stroll" : "stand", facing: t < 11.55 ? -1 : 0, phase: t * 1.6, expr: "stern", angry: ramp(t, 11.1, 11.6), steam: t > 11.35 ? 1 : 0, prop: t > 11.9 ? "point" : null } },
  ];
};
add({ a: 10.9, b: 13.2, dis: DIS, light: "office", dof: 9, focus: [OX + 0.35, 1.45, -1.4], shadowR: 7, actors: officeF,
  cam: path([
    { t: 10.9, pos: [OX - 0.45, 1.42, 0.05], look: [OX + 0.3, 1.32, -1.8], fov: 56 },
    { t: 11.75, pos: [OX - 0.3, 1.45, -0.2], look: [OX + 0.35, 1.38, -1.5], fov: 54 },
    { t: 12.0, pos: [OX - 0.05, 1.62, 0.3], look: [OX + 0.62, 1.58, -0.8], fov: 46, ease: "out" },
    { t: 12.3, pos: [OX - 0.15, 1.55, 0.0], look: [OX + 0.2, 1.62, -2.06], fov: 48, ease: "inout" },
    { t: 12.85, pos: [OX - 0.1, 1.4, -0.3], look: [OX + 0.2, 3.0, -2.06], fov: 52, ease: "out" },
    { t: 13.2, pos: [OX - 0.08, 1.36, -0.38], look: [OX + 0.2, 3.0, -2.06], fov: 52 },
  ]) });

// ---------- G. 13.2-14.75 town: the dark hole dissolves into the frozen tower clock; punch-in on "stopped" (14.25)
add({ a: 13.2, b: 14.75, dis: DIS, light: "night", dof: 4, shadowR: 14, actors: (t) => crowd(t, false),
  cam: drift(path([
    { t: 13.2, pos: [TWX + 0.4, TOWER[1] - 0.4, TOWER[2] + 9.5], look: [TWX, TOWER[1], TOWER[2]], fov: 52 },
    { t: 14.25, pos: [TWX + 0.1, TOWER[1] - 0.1, TOWER[2] + 5.6], look: [TWX, TOWER[1], TOWER[2]], fov: 50, ease: "out" },
    { t: 14.75, pos: [TWX + 0.05, TOWER[1] - 0.05, TOWER[2] + 5.3], look: [TWX, TOWER[1], TOWER[2]], fov: 50 },
  ]), 0.03) });

// ---------- H. 14.75-16.0 town: close two-shot of puzzled townsfolk staring up ("Walter wasn't winding a clock.")
const pair = (t: number): ActorDef[] => [
  { who: "w2#p0", pos: [TWX - 0.38, 0, -30.4], scale: 0.78, opts: { mode: "stand", facing: 1, phase: t, expr: "dazed", question: true, headTilt: -10 } },
  { who: "m1#p1", pos: [TWX + 0.4, 0, -30.6], scale: 0.78, opts: { mode: "stand", facing: -1, phase: t + 1, expr: "nervous", question: Math.sin(t * 4) > -0.3, headTilt: 8, sweat: 0.4 } },
];
add({ a: 14.75, b: 16.0, dis: DIS, light: "night", dof: 8, focus: [TWX, 1.55, -30.5], shadowR: 12, actors: (t) => [...pair(t), ...crowd(t).filter((a) => a.pos[2] < -31.5)],
  cam: drift(path([
    { t: 14.75, pos: [TWX - 0.5, 1.25, -28.1], look: [TWX, 1.6, -30.5], fov: 50 },
    { t: 16.0, pos: [TWX + 0.45, 1.3, -28.2], look: [TWX, 1.6, -30.5], fov: 48 },
  ])) });

// ---------- I. 16.0-18.4 town: Walter strides into the foreground, stops and grins at us; pull back and up as the snow falls ("He was winding the whole town.")
const walterX = (t: number) => lerp(TWX - 1.4, TWX - 0.15, ramp(t, 15.9, 16.9));
add({ a: 16.0, b: 18.4, dis: DIS, light: "night", dof: 6, focus: [TWX - 0.15, 1.45, -28.4], shadowR: 14,
  actors: (t) => [...pair(t), ...crowd(t), { who: "walter", pos: [walterX(t), 0, -28.4], scale: 0.78, opts: { mode: t < 16.85 ? "stroll" : "stand", facing: t < 16.85 ? 1 : 0, phase: t * 1.6, expr: t < 16.7 ? "smile" : "grin", prop: t > 17.0 ? "point" : null, blink: t > 17.6 && t < 17.7 } }],
  cam: (t: number) => { const c = path([
    { t: 16.0, pos: [TWX - 0.3, 1.4, -26.6], look: [TWX - 0.5, 1.45, -28.4], fov: 52 },
    { t: 17.0, pos: [TWX + 0.1, 1.5, -26.5], look: [TWX - 0.15, 1.5, -28.4], fov: 50, ease: "out" },
    { t: 18.4, pos: [TWX + 0.9, 3.2, -23.6], look: [TWX, 3.6, -33], fov: 56, ease: "in" },
  ])(t); return c; } });

export const SHOTS = S;
export const shotAt = at;
