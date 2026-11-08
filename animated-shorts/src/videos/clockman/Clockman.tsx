// "The Clock Man": demo short for the reference-look engine (src/lib3d/Short3D.tsx).
import { makeShort, REF_GRADE } from "../../lib3d/Short3D";
import { World, LightName } from "./world";
import { SHOTS, shotAt, outfitOf, DURATION, TOTAL } from "./shots";
import type { GradeParams } from "../bridge/grade";

export const CLOCKMAN_FRAMES = TOTAL;
const GRADES: Record<LightName, GradeParams> = {
  office: { ...REF_GRADE, ky: [0.08, 0.17, 0.31, 0.53, 0.76, 0.88, 0.93], sat: [1.12, 1.1, 1.0], vig: [0.12, 0.42] },
  night: { ...REF_GRADE, ky: [0.09, 0.17, 0.3, 0.5, 0.7, 0.82, 0.9], sat: [1.25, 1.22, 1.1], tintS: [0.035, 0.01], tintH: [-0.018, 0.012], vig: [0.34, 0.3] },
};
export const ClockmanShort = makeShort<LightName>({ world: () => new World(), shots: SHOTS, shotAt, outfitOf, grades: GRADES, duration: DURATION, fadeOut: 0.6 });
