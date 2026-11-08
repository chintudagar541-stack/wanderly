// "The Knocker-Upper" (32.9 s) on the engine-v2 renderer, with reference-style word captions.
import React from "react";
import { AbsoluteFill } from "remotion";
import { makeShort, REF_GRADE } from "../../lib3d/Short3D";
import { Captions, Word } from "../../lib3d/Captions";
import { World, LightName } from "./world";
import { SHOTS, shotAt, outfitOf, DURATION, TOTAL } from "./shots";
import type { GradeParams } from "../bridge/grade";
import WORDS from "../../../shorts/knocker/voice/words.json";

export const KNOCKER_FRAMES = TOTAL;
const GRADES: Record<LightName, GradeParams> = {
  office: { ...REF_GRADE },
  night: { ...REF_GRADE, ky: [0.09, 0.17, 0.3, 0.5, 0.7, 0.82, 0.9], sat: [1.25, 1.22, 1.1], tintS: [0.035, 0.01], tintH: [-0.018, 0.012], vig: [0.34, 0.3] },
  dawn: { ...REF_GRADE, ky: [0.1, 0.19, 0.32, 0.53, 0.75, 0.87, 0.93], sat: [1.05, 1.02, 0.95], tintS: [0.03, 0.012], tintH: [-0.02, 0.016], vig: [0.12, 0.42] },
};
const Picture = makeShort<LightName>({ world: () => new World(), shots: SHOTS, shotAt, outfitOf, grades: GRADES, duration: DURATION, fadeOut: 0.6 });
export const KnockerShort: React.FC = () => (
  <AbsoluteFill>
    <Picture />
    <Captions words={WORDS as Word[]} />
  </AbsoluteFill>
);
