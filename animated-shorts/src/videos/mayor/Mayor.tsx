// "The Accidental Mayor" (48.6 s) on the engine-v2 renderer, with reference-style word captions.
import React from "react";
import { AbsoluteFill } from "remotion";
import { makeShort, REF_GRADE } from "../../lib3d/Short3D";
import { Captions, Word } from "../../lib3d/Captions";
import { World, LightName } from "./world";
import { SHOTS, shotAt, outfitOf, DURATION, TOTAL, PLAN } from "./shots";
import type { GradeParams } from "../bridge/grade";
import WORDS from "../../../shorts/mayor/voice/words.json";

export const MAYOR_FRAMES = TOTAL;
World.plan = PLAN;
const NIGHT: GradeParams = { ...REF_GRADE, ky: [0.09, 0.17, 0.3, 0.5, 0.7, 0.82, 0.9], sat: [1.22, 1.2, 1.08], tintS: [0.035, 0.01], tintH: [-0.018, 0.012], vig: [0.34, 0.3] };
const GRADES: Record<LightName, GradeParams> = {
  morning: { ...REF_GRADE, sat: [1.08, 1.05, 0.98], tintH: [-0.022, 0.016], vig: [0.18, 0.4] },
  hall: { ...REF_GRADE, sat: [1.05, 1.02, 0.96], tintH: [-0.02, 0.014], vig: [0.2, 0.4] },
  day: { ...REF_GRADE, ky: [0.08, 0.17, 0.31, 0.53, 0.76, 0.88, 0.93], sat: [1.1, 1.08, 1.0], vig: [0.12, 0.42] },
  dark: NIGHT, night: NIGHT,
};
const Picture = makeShort<LightName>({ world: () => new World(), shots: SHOTS, shotAt, outfitOf, grades: GRADES, duration: DURATION, fadeOut: 0.5 });
export const MayorShort: React.FC = () => (
  <AbsoluteFill>
    <Picture />
    <Captions words={WORDS as Word[]} />
  </AbsoluteFill>
);
