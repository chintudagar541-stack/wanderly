// "The Knocker-Upper" (32.9 s), written with the v3 playbook camera presets (cameraKey / CAMERA_FOV).
// Shots A-C are the approved 9.6 s test clip (unchanged up to 8.5 s); D-M continue the story. Times: voice/words.json.
import { LightName, TWX, WIN, KNOCKER, MARY, STALL_CLOCK, tapAt, PEAS } from "./world";
import { Outfit, FrontOpts } from "../dead/toon";
import { ActorDef, V3, path, drift, shotList, ramp, lerp, smooth, cameraKey as K } from "../../lib3d/camera";

export const FPS = 30;
export const DURATION = 32.9;
export const TOTAL = Math.round(DURATION * FPS);
const HEAD = { headStyle: "ref" } as Partial<Outfit>;
export const outfitOf = (who: string): Outfit => {
  const o: Record<string, Outfit> = {
    knocker: { jacket: "#6a4a8a", pants: "#2a2a3a", boots: "#2a1a10", hat: "tophat", cap: "#2a2a30", moustache: "#5a3a2a", skin: "#f7f2ea" },
    sleeper: { jacket: "#e8e0d0", pants: "#e8e0d0", boots: "#2a1a10", hat: "cap", cap: "#c83a3a", skin: "#f7f2ea" },
    mary: { jacket: "#3a4a6a", pants: "#2a2a30", dress: "#3a4a6a", boots: "#1a1a1a", hat: "longHair", hairStyle: "bun", hair: "#4a3020", skin: "#f7f2ea" },
    worker: { jacket: "#5a6a7a", pants: "#3a3a48", boots: "#2a1a10", hat: "cap", cap: "#4a4a58", skin: "#f7f2ea" },
    w2: { jacket: "#a85a3a", pants: "#3a3020", boots: "#1a1a1a", hat: "cap", cap: "#2a2a30", skin: "#f7f2ea" },
    w3: { jacket: "#8a3a6a", pants: "#3a3a40", dress: "#8a3a6a", boots: "#1a1a1a", hat: "longHair", hairStyle: "bob", hair: "#2a1a14", skin: "#f7f2ea" },
  };
  return { ...(o[who.split("#")[0]] ?? o.knocker), ...HEAD } as Outfit;
};
const DIS = 0.23;
const { S, add, at } = shotList<LightName>();
const SLEEPER: V3 = [WIN[0] + 0.08, WIN[1] - 1.3, WIN[2]];
const sleeper = (t: number): ActorDef => ({ who: "sleeper", pos: SLEEPER, scale: 0.78,
  opts: (t < 7.85 ? { mode: "lean", expr: "asleep", zzz: (t * 0.8) % 1, tilt: 8 } : { mode: "lean", expr: t < 8.4 ? "shock" : "stern", angry: ramp(t, 8.3, 8.9), exclaim: t < 8.4, tilt: 0 }) as FrontOpts });
const knocker = (t: number): ActorDef => ({ who: "knocker", pos: KNOCKER, scale: 0.8,
  opts: (t < 4.0 ? { mode: "stand", facing: 0, expr: t < 3.4 ? "smile" : "grin", phase: t, prop: "pole" } : { mode: "stand", facing: -1, expr: t > 7.0 ? "stern" : "smile_closed", phase: t, prop: "pole", tilt: tapAt(t) * 40 }) as FrontOpts });

// A. 0-2.9: close on the sleeper in the lit window, pull back + crane down over the sleeping street ("Before alarm clocks, whole towns paid one man to wake them up.")
add({ a: 0, b: 2.9, light: "night", dof: 8, focus: [WIN[0], WIN[1] - 0.1, WIN[2]], shadowR: 14, actors: (t) => [sleeper(t)],
  cam: drift(path([
    K(0, [WIN[0] + 1.6, WIN[1] + 0.05, WIN[2] - 0.3], [WIN[0], WIN[1] - 0.1, WIN[2]], "closeUp"),
    K(2.9, [TWX - 1.2, 2.0, -20.5], [TWX - 5.5, 2.8, -26.5], "establishing", { ease: "inout" }),
  ])) });
// B. 2.9-4.3: punch-in on the knocker-upper as he grins at us ("He was called a knocker upper.")
add({ a: 2.9, b: 4.3, dis: DIS, light: "night", dof: 9, focus: [KNOCKER[0], 1.5, KNOCKER[2]], shadowR: 12, actors: (t) => [knocker(t), sleeper(t)],
  cam: drift(path([
    K(2.9, [KNOCKER[0] + 0.6, 1.45, KNOCKER[2] + 3.2], [KNOCKER[0], 1.5, KNOCKER[2]], "medium"),
    K(3.7, [KNOCKER[0] + 0.25, 1.52, KNOCKER[2] + 1.75], [KNOCKER[0], 1.55, KNOCKER[2]], "closeUp", { ease: "out" }),
    K(4.3, [KNOCKER[0] + 0.15, 1.5, KNOCKER[2] + 1.65], [KNOCKER[0], 1.55, KNOCKER[2]], "closeUp"),
  ])) });
// C. 4.3-9.6: one move: low behind him, crane up along the pole to the window (tap, tap), back down to his stubborn face,
//    then a quick punch up to the sleeper waking furious on "answered" (7.81)
add({ a: 4.3, b: 8.5, dis: DIS, light: "night", dof: 7, focus: [WIN[0], WIN[1] - 0.1, WIN[2]], shadowR: 14, actors: (t) => [knocker(t), sleeper(t)],
  cam: path([
    K(4.3, [KNOCKER[0] + 1.1, 0.7, KNOCKER[2] + 2.3], [KNOCKER[0] - 1.2, 2.2, KNOCKER[2] + 0.6], "travel"),
    K(5.9, [WIN[0] + 3.2, 4.4, WIN[2] - 1.6], [WIN[0], WIN[1] - 0.1, WIN[2]], "medium"),
    K(7.2, [KNOCKER[0] + 0.9, 1.6, KNOCKER[2] + 1.6], [KNOCKER[0] - 0.1, 1.6, KNOCKER[2]], "closeUp"),
    K(7.85, [WIN[0] + 1.9, WIN[1] - 0.05, WIN[2] + 0.4], [WIN[0], WIN[1] - 0.1, WIN[2]], "closeUp", { ease: "out" }),
    K(9.6, [WIN[0] + 1.7, WIN[1] - 0.05, WIN[2] + 0.35], [WIN[0], WIN[1] - 0.1, WIN[2]], "closeUp"),
  ]) });
// D. 8.5-9.75: tracking alongside him as he strides to the next house, pole on his shoulder ("And this was a real job.")
const DZ = (t: number) => lerp(-27.0, -29.6, (t - 8.5) / 1.25);
add({ a: 8.5, b: 9.75, dis: DIS, light: "night", dof: 8, focus: [TWX - 1.0, 1.5, -28.3], shadowR: 12,
  actors: (t) => [{ who: "knocker", pos: [TWX - 1.0, 0, DZ(t)], scale: 0.8, opts: { mode: "stroll", facing: 1, phase: t * 1.6, expr: "grin" } }],
  cam: (t: number) => ({ pos: [TWX + 1.1, 1.35, DZ(t) + 1.0], look: [TWX - 1.0, 1.45, DZ(t) - 0.5], fov: 50 }) });

// E. 9.75-13.15 dawn: a factory worker at his door pays the knocker-upper; punch-in on the coins on "pennies" (12.2)
const DOOR: V3 = [TWX - 4.45, 0, -3.05], KN_E: V3 = [TWX - 3.3, 0, -4.0];
add({ a: 9.75, b: 13.15, dis: DIS, light: "dawn", dof: 8, focus: [TWX - 3.9, 1.3, -3.4], shadowR: 10,
  actors: (t) => [
    { who: "worker", pos: DOOR, scale: 0.78, opts: { mode: "stand", facing: 1, phase: t, expr: t < 11.2 ? "dazed" : "smile_closed", prop: t > 11.4 ? "cash" : null, blink: t > 10.6 && t < 10.7 } },
    { who: "knocker", pos: KN_E, scale: 0.8, opts: { mode: "stand", facing: -1, phase: t, expr: t > 12.0 ? "grin" : "smile", prop: "point" } },
  ],
  cam: drift(path([
    K(9.75, [TWX - 1.2, 1.55, -0.2], [TWX - 3.9, 1.4, -3.4], "twoShot"),
    K(11.9, [TWX - 1.7, 1.5, -0.7], [TWX - 3.9, 1.35, -3.45], "medium"),
    K(12.35, [TWX - 2.05, 1.35, -1.2], [TWX - 3.9, 1.2, -3.5], "medium", { ease: "out" }),
    K(13.15, [TWX - 2.1, 1.35, -1.25], [TWX - 3.9, 1.2, -3.5], "medium"),
  ])) });

// F. 13.15-14.42 night: the knocker-upper with his pole, mid-tap, looks round at us and shrugs ("Some didn't even use a pole.")
add({ a: 13.15, b: 14.42, dis: DIS, light: "night", dof: 9, focus: [KNOCKER[0], 1.55, KNOCKER[2]], shadowR: 12,
  actors: (t) => [{ who: "knocker", pos: KNOCKER, scale: 0.8, opts: { mode: "stand", facing: 0, phase: t, expr: t < 13.9 ? "smile_closed" : "dazed", prop: "pole", question: t > 13.9 } }],
  cam: drift(path([
    K(13.15, [KNOCKER[0] + 1.0, 1.5, KNOCKER[2] + 2.0], [KNOCKER[0], 1.55, KNOCKER[2]], "medium"),
    K(14.42, [KNOCKER[0] + 0.4, 1.5, KNOCKER[2] + 1.7], [KNOCKER[0], 1.6, KNOCKER[2]], "closeUp", { ease: "out" }),
  ])) });

// G. 14.42-17.65 night: Mary Smith in profile with her peashooter; whip up with the peas to the window, the sleeper jolts awake
const sleeperG = (t: number): ActorDef => ({ who: "sleeper", pos: SLEEPER, scale: 0.78, opts: (t < PEAS[1] + 0.35 ? { mode: "lean", expr: "asleep", zzz: (t * 0.8) % 1, tilt: 8 } : { mode: "lean", expr: "shock", exclaim: true, tilt: 0 }) as FrontOpts });
add({ a: 14.42, b: 17.65, dis: DIS, light: "night", dof: 8, focus: [MARY[0], 1.4, MARY[2]], shadowR: 12,
  actors: (t) => [{ who: "mary", pos: MARY, scale: 0.76, opts: { mode: "stand", facing: -1, phase: t, expr: t < 15.4 ? "smile" : "stern", mouthOpen: t > 15.4 && t < 16.7 ? 0.3 : 0, headTilt: -10 } }, sleeperG(t)],
  cam: path([
    K(14.42, [MARY[0] + 0.3, 1.35, MARY[2] + 1.9], [MARY[0], 1.4, MARY[2]], "closeUp"),
    K(15.45, [MARY[0] + 0.15, 1.4, MARY[2] + 1.6], [MARY[0] - 0.2, 1.45, MARY[2] - 0.1], "closeUp"),
    K(15.95, [MARY[0] - 0.4, 2.6, MARY[2] + 0.9], [WIN[0], WIN[1] - 0.1, WIN[2]], "medium", { ease: "inout" }),
    K(16.6, [WIN[0] + 1.9, WIN[1] - 0.05, WIN[2] + 0.5], [WIN[0], WIN[1] - 0.1, WIN[2]], "closeUp", { ease: "out" }),
    K(17.65, [WIN[0] + 1.75, WIN[1] - 0.05, WIN[2] + 0.45], [WIN[0], WIN[1] - 0.1, WIN[2]], "closeUp"),
  ]) });

// H. 17.65-19.3: the sleeper, now awake, rubs his chin and wonders ("But that raised one obvious question.")
add({ a: 17.65, b: 19.3, dis: DIS, light: "night", dof: 8, focus: [WIN[0], WIN[1] - 0.1, WIN[2]], shadowR: 12,
  actors: () => [{ who: "sleeper", pos: SLEEPER, scale: 0.78, opts: { mode: "lean", expr: "dazed", question: true, headTilt: 10, tilt: 0 } }],
  cam: drift(path([
    K(17.65, [WIN[0] + 2.2, WIN[1] - 0.25, WIN[2] - 0.5], [WIN[0], WIN[1] - 0.1, WIN[2]], "medium"),
    K(19.3, [WIN[0] + 1.6, WIN[1] - 0.1, WIN[2] - 0.2], [WIN[0], WIN[1] - 0.05, WIN[2]], "closeUp"),
  ])) });

// I. 19.3-20.4: punch-in on the knocker-upper, who has never thought about it ("Who woke up the knocker upper?")
add({ a: 19.3, b: 20.4, dis: 0.12, light: "night", dof: 10, focus: [KNOCKER[0], 1.6, KNOCKER[2]], shadowR: 12,
  actors: (t) => [{ who: "knocker", pos: KNOCKER, scale: 0.8, opts: { mode: "stand", facing: 0, phase: t, expr: "shock", sweat: ramp(t, 19.5, 20.0), question: true } }],
  cam: path([
    K(19.3, [KNOCKER[0] + 0.3, 1.55, KNOCKER[2] + 2.6], [KNOCKER[0], 1.6, KNOCKER[2]], "medium"),
    K(19.75, [KNOCKER[0] + 0.1, 1.6, KNOCKER[2] + 1.35], [KNOCKER[0], 1.65, KNOCKER[2]], "closeUp", { ease: "out" }),
    K(20.4, [KNOCKER[0] + 0.08, 1.6, KNOCKER[2] + 1.28], [KNOCKER[0], 1.65, KNOCKER[2]], "closeUp"),
  ]) });

// J. 20.4-22.35 night: alone in the empty street, he trudges on past the lamps ("Most of them simply never slept at night.")
const JZ = (t: number) => lerp(-28.5, -31.0, (t - 20.4) / 1.95);
add({ a: 20.4, b: 22.35, dis: DIS, light: "night", dof: 6, focus: [TWX - 0.6, 1.4, -30], shadowR: 14,
  actors: (t) => [{ who: "knocker", pos: [TWX - 0.6, 0, JZ(t)], scale: 0.8, opts: { mode: "stroll", facing: 1, phase: t * 1.4, expr: "dazed", blink: Math.sin(t * 3) > 0.9 } }],
  cam: (t: number) => { const u = smooth((t - 20.4) / 1.95); return { pos: [TWX + 1.6 + u * 0.6, 1.2 + u * 1.2, JZ(t) + 2.2 + u * 1.2], look: [TWX - 0.6, 1.3, JZ(t) - 0.4], fov: lerp(52, 58, u) }; } });

// K. 22.35-25.4 dawn: asleep on a bench at sunrise while the town walks past to work ("They worked until sunrise and went to bed when everyone else got up.")
const BENCH: V3 = [TWX - 5.45, 0.18, -20];
add({ a: 22.35, b: 25.4, dis: DIS, light: "dawn", dof: 7, focus: [BENCH[0], 1.3, BENCH[2]], shadowR: 12,
  actors: (t) => [
    { who: "knocker", pos: BENCH, scale: 0.8, opts: { mode: "sit", facing: 0, expr: "asleep", zzz: (t * 0.8) % 1, headTilt: 12 } },
    ...(["worker#k1", "w2#k2", "w3#k3"] as const).map((who, i) => ({ who, pos: [TWX - 3.9 + i * 0.45, 0, lerp(-16.5 - i * 1.2, -22.5 - i * 1.2, (t - 22.35 + i * 0.2) / 3.4)] as V3, scale: 0.78,
      opts: { mode: "stroll", facing: 1, phase: t * 1.5 + i * 0.3, expr: i === 1 ? "laugh" : "smile" } as FrontOpts })),
  ],
  cam: drift(path([
    K(22.35, [BENCH[0] + 1.3, 1.25, BENCH[2] + 0.3], [BENCH[0], 1.25, BENCH[2]], "closeUp"),
    K(25.4, [BENCH[0] + 4.2, 2.0, BENCH[2] + 1.8], [BENCH[0] + 1.0, 1.2, BENCH[2] - 0.8], "twoShot", { ease: "inout" }),
  ])) });

// L. 25.4-28.75 dawn: a cheap alarm clock rings on the stall (insert, push-in), then pan to him walking away into the haze, his pole on his shoulder
add({ a: 25.4, b: 28.75, dis: DIS, light: "dawn", dof: 8, focus: STALL_CLOCK, shadowR: 12,
  actors: (t) => [{ who: "knocker", pos: [TWX + 0.4, 0, lerp(-37.5, -40.5, (t - 25.4) / 3.35)], scale: 0.8, opts: { mode: "stroll", back: true, phase: t * 1.2, expr: "neutral" } }],
  cam: path([
    K(25.4, [STALL_CLOCK[0] - 1.1, STALL_CLOCK[1] + 0.05, STALL_CLOCK[2] + 0.2], STALL_CLOCK, "closeUp"),
    K(27.0, [STALL_CLOCK[0] - 0.6, STALL_CLOCK[1] + 0.02, STALL_CLOCK[2] + 0.1], STALL_CLOCK, "extremeCloseUp", { ease: "out" }),
    K(27.6, [STALL_CLOCK[0] - 1.2, 1.4, STALL_CLOCK[2] + 1.2], [TWX + 0.4, 1.2, -39], "medium", { ease: "inout" }),
    K(28.75, [STALL_CLOCK[0] - 2.0, 1.5, STALL_CLOCK[2] + 2.0], [TWX + 0.4, 1.3, -40], "medium"),
  ]) });

// M. 28.75-32.9 dawn: back at the opening window: the sleeper's own alarm clock rings, he wakes happy... then on "a man
//    with a stick" the pole taps the glass again (loop ending)
add({ a: 28.75, b: 32.9, dis: DIS, light: "dawn", dof: 8, focus: [WIN[0], WIN[1] - 0.1, WIN[2]], shadowR: 12,
  actors: (t) => [{ who: "sleeper", pos: SLEEPER, scale: 0.78, opts: (t < 29.7 ? { mode: "lean", expr: "asleep", zzz: (t * 0.8) % 1, tilt: 8 } : t < 31.3 ? { mode: "lean", expr: "grin", tilt: 0 } : { mode: "lean", expr: "shock", exclaim: true, sweat: 0.5, tilt: 0 }) as FrontOpts }],
  cam: drift(path([
    K(28.75, [WIN[0] + 1.6, WIN[1] + 0.05, WIN[2] + 0.3], [WIN[0], WIN[1] - 0.15, WIN[2] + 0.15], "closeUp"),
    K(31.0, [WIN[0] + 1.9, WIN[1] + 0.0, WIN[2] + 0.1], [WIN[0], WIN[1] - 0.12, WIN[2] + 0.05], "closeUp"),
    K(32.9, [WIN[0] + 2.6, WIN[1] - 0.2, WIN[2] - 0.6], [WIN[0], WIN[1] - 0.15, WIN[2] - 0.2], "medium", { ease: "out" }),
  ])) });

export const SHOTS = S;
export const shotAt = at;
