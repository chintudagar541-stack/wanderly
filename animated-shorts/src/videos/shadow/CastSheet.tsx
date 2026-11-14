// Character sheet for SHADOW BLADE 47 (one still: 2160 x 2880).
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront } from "../dead/toon";
import { CAST, CastMember } from "./cast";

const CW = 420, CH = 700;
const Card: React.FC<{ c: CastMember }> = ({ c }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { const g = ref.current!.getContext("2d")!; g.clearRect(0, 0, 1200, 2000); const s = c.scale ?? 1;
    g.setTransform(2 * s, 0, 0, 2 * s, 600 * (1 - s), 1950 * (1 - s) + 20); bodyFront(new Pen(g), c.o, { seed: 3, ...c.pose }); }, [c]);
  return (
    <div style={{ width: 680, height: 1200, margin: 20, borderRadius: 26, overflow: "hidden", background: "linear-gradient(#6a7290, #3a3f55 55%, #22252f)", boxShadow: "0 0 0 3px #3a3f52", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <canvas ref={ref} width={1200} height={2000} style={{ width: CW * 1.4, height: CH * 1.4, marginTop: 10 }} />
      <div style={{ font: "800 40px Arial", color: "#f2f2f6", letterSpacing: 1, marginTop: 6 }}>{c.name}</div>
      <div style={{ font: "600 24px Arial", color: "#d8b04a", textAlign: "center", padding: "6px 30px" }}>{c.role}</div>
      <div style={{ font: "400 21px Arial", color: "#a8aec0", textAlign: "center", padding: "4px 34px" }}>{c.line}</div>
    </div>
  );
};
export const CastSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 0%, #2a1a24, #0a0a10 60%)", alignItems: "center" }}>
    <div style={{ font: "900 96px Arial", color: "#f2f2f6", marginTop: 40, letterSpacing: 6 }}>SHADOW BLADE <span style={{ color: "#c8182e" }}>47</span></div>
    <div style={{ font: "600 34px Arial", color: "#a8aec0", marginBottom: 10 }}>CHARACTER SHEET</div>
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", width: 3600 }}>{CAST.map((c) => <Card key={c.id} c={c} />)}</div>
  </AbsoluteFill>
);
