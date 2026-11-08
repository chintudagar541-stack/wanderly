// "Knocker-upper": 9.6 s v3 test clip on the engine-v2 renderer.
import { makeShort, REF_GRADE } from "../../lib3d/Short3D";
import { World, LightName } from "./world";
import { SHOTS, shotAt, outfitOf, DURATION, TOTAL } from "./shots";
import type { GradeParams } from "../bridge/grade";

export const KNOCKER_FRAMES = TOTAL;
const GRADES: Record<LightName, GradeParams> = {
  office: { ...REF_GRADE },
  night: { ...REF_GRADE, ky: [0.09, 0.17, 0.3, 0.5, 0.7, 0.82, 0.9], sat: [1.25, 1.22, 1.1], tintS: [0.035, 0.01], tintH: [-0.018, 0.012], vig: [0.34, 0.3] },
};
export const KnockerShort = makeShort<LightName>({ world: () => new World(), shots: SHOTS, shotAt, outfitOf, grades: GRADES, duration: DURATION, fadeOut: 0.5 });
