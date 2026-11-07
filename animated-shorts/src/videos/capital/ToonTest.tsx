// Test sheet: a line-up of character cards (for checking designs before a render).
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, FrontOpts, Outfit } from "../dead/toon";
import { outfitOf } from "./shots";

const Card: React.FC<{ who: string; opts: FrontOpts; o?: Outfit }> = ({ who, opts, o }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { const g = ref.current!.getContext("2d")!; g.clearRect(0, 0, 600, 1000); bodyFront(new Pen(g), o ?? outfitOf(who), { ...opts, seed: 3 }); }, [who, opts, o]);
  return <canvas ref={ref} width={600} height={1000} style={{ width: 360, height: 600 }} />;
};
export const ToonTest: React.FC = () => (
  <AbsoluteFill style={{ background: "#e8d8b8", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start" }}>
    <Card who="mother" opts={{ mode: "stand", expr: "smile" }} />
    <Card who="p1" opts={{ mode: "stand", expr: "neutral" }} />
        <Card who="p7" opts={{ mode: "stand", expr: "worried", prop: "diya" }} />
    <Card who="p10" opts={{ mode: "sit", expr: "smile_closed" }} />
    <Card who="w1" opts={{ mode: "stand", expr: "smile" }} o={{ jacket: "#f4f1ea", pants: "#2a4a9a", dress: "#2a4a9a", boots: "#2a1a10", hat: "longHair", hairStyle: "bob", hair: "#e8c060", skin: "#f5d6c0" }} />
    <Card who="w2" opts={{ mode: "stroll", phase: 0.2, expr: "grin" }} o={{ jacket: "#d1405a", pants: "#3a3a40", dress: "#d1405a", boots: "#1a1a1a", hat: "longHair", hairStyle: "ponytail", hair: "#7a3a1a", skin: "#f0c9a0" }} />
    <Card who="w3" opts={{ mode: "stand", expr: "neutral" }} o={{ jacket: "#2e7a4a", pants: "#2e7a4a", dress: "#2e7a4a", boots: "#2a1a10", hat: "longHair", hairStyle: "long", hair: "#3a2414", skin: "#a8754f" }} />
  </AbsoluteFill>
);
