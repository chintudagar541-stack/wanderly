// Motion test sheet: the 3/4 profile walk cycle (8 phases), profile sit/stand, front sit, for comparing with the references.
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, FrontOpts, Outfit } from "../dead/toon";

const MAN: Outfit = { jacket: "#2f8f8a", pants: "#2a2f45", boots: "#7a4a2a", hat: "hair", hair: "#5a3b2a", headStyle: "ref" };
const BOSS: Outfit = { jacket: "#c9a22a", pants: "#2a2f45", boots: "#1a1a1a", hat: "tophat", cap: "#2a2a30", headStyle: "ref", build: "stout" };
const CW = 180, CH = 300;
const Card: React.FC<{ label: string; opts: FrontOpts; o: Outfit }> = ({ label, opts, o }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { const g = ref.current!.getContext("2d")!; g.clearRect(0, 0, 600, 1000); bodyFront(new Pen(g), o, { seed: 3, ...opts }); }, [opts, o]);
  return (
    <div style={{ width: CW, height: CH + 22, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <canvas ref={ref} width={600} height={1000} style={{ width: CW, height: CH, background: "#cfe0f0" }} />
      <div style={{ font: "600 14px sans-serif", color: "#222" }}>{label}</div>
    </div>
  );
};
const CARDS: [string, Outfit, FrontOpts][] = [
  ...[0, 1, 2, 3, 4, 5].map((i) => [`walk R ${i}/8`, MAN, { mode: "stroll", facing: 1, phase: i / 8, expr: "smile" }] as [string, Outfit, FrontOpts]),
  ...[0, 2, 4, 6].map((i) => [`walk L ${i}/8`, BOSS, { mode: "stroll", facing: -1, phase: i / 8, expr: "stern" }] as [string, Outfit, FrontOpts]),
  ["sit R", MAN, { mode: "sit", facing: 1, expr: "smile" }],
  ["stand R", MAN, { mode: "stand", facing: 1, expr: "neutral" }],
  ["sit front (old)", MAN, { mode: "sit", expr: "smile" }],
  ["stroll front (old)", MAN, { mode: "stroll", phase: 0.25, expr: "smile" }],
  ["sit L + cup", BOSS, { mode: "sit", facing: -1, expr: "grin", prop: "cup" }],
  ["stand L point", BOSS, { mode: "stand", facing: -1, expr: "stern", prop: "point", angry: 1, steam: 1 }],
];
export const WalkTest: React.FC = () => (
  <AbsoluteFill style={{ background: "#e8e8e8", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start" }}>
    {CARDS.map(([label, o, opts]) => <Card key={label} label={label} o={o} opts={opts} />)}
  </AbsoluteFill>
);
