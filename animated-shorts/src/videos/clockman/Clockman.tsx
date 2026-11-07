// "The Clock Man": demo short for the reference-look engine (src/lib3d/Short3D.tsx).
import { makeShort, REF_GRADE } from "../../lib3d/Short3D";
import { World, LightName } from "./world";
import { SHOTS, shotAt, outfitOf, DURATION, TOTAL } from "./shots";
import type { GradeParams } from "../bridge/grade";

export const CLOCKMAN_FRAMES = TOTAL;
const GRADES: Record<LightName, GradeParams> = {
  office: { ...REF_GRADE },
  night: { ...REF_GRADE, sat: [1.15, 1.2, 1.05], tintS: [0.04, 0.012], tintH: [-0.02, 0.012], vig: [0.4, 0.28] },
};
export const ClockmanShort = makeShort<LightName>({ world: () => new World(), shots: SHOTS, shotAt, outfitOf, grades: GRADES, duration: DURATION, fadeOut: 0.6 });
