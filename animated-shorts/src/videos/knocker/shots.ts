// "Knocker-upper" 9.6 s test clip, written with the v3 playbook camera presets (cameraKey / CAMERA_FOV).
import { LightName, TWX, WIN, KNOCKER, tapAt } from "./world";
import { Outfit, FrontOpts } from "../dead/toon";
import { ActorDef, V3, path, drift, shotList, ramp, cameraKey as K } from "../../lib3d/camera";

export const FPS = 30;
export const DURATION = 9.6;
export const TOTAL = Math.round(DURATION * FPS);
const HEAD = { headStyle: "ref" } as Partial<Outfit>;
export const outfitOf = (who: string): Outfit => {
  const o: Record<string, Outfit> = {
    knocker: { jacket: "#6a4a8a", pants: "#2a2a3a", boots: "#2a1a10", hat: "tophat", cap: "#2a2a30", moustache: "#5a3a2a", skin: "#f7f2ea" },
    sleeper: { jacket: "#e8e0d0", pants: "#e8e0d0", boots: "#2a1a10", hat: "cap", cap: "#c83a3a", skin: "#f7f2ea" },
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
add({ a: 4.3, b: 9.6, dis: DIS, light: "night", dof: 7, focus: [WIN[0], WIN[1] - 0.1, WIN[2]], shadowR: 14, actors: (t) => [knocker(t), sleeper(t)],
  cam: path([
    K(4.3, [KNOCKER[0] + 1.1, 0.7, KNOCKER[2] + 2.3], [KNOCKER[0] - 1.2, 2.2, KNOCKER[2] + 0.6], "travel"),
    K(5.9, [WIN[0] + 3.2, 4.4, WIN[2] - 1.6], [WIN[0], WIN[1] - 0.1, WIN[2]], "medium"),
    K(7.2, [KNOCKER[0] + 0.9, 1.6, KNOCKER[2] + 1.6], [KNOCKER[0] - 0.1, 1.6, KNOCKER[2]], "closeUp"),
    K(7.85, [WIN[0] + 1.9, WIN[1] - 0.05, WIN[2] + 0.4], [WIN[0], WIN[1] - 0.1, WIN[2]], "closeUp", { ease: "out" }),
    K(9.6, [WIN[0] + 1.7, WIN[1] - 0.05, WIN[2] + 0.35], [WIN[0], WIN[1] - 0.1, WIN[2]], "closeUp"),
  ]) });
export const SHOTS = S;
export const shotAt = at;
