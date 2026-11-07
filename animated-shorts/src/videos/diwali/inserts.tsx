// DOM layers for the Diwali short: the Ramayana manuscript page (with a painted Rama), the flame transition,
// the white-gold flash, and the darkness vignette that the light pushes back.
import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { Pen, bodyFront, INK } from "../dead/toon";
import { Kind, Overlay, clamp01, smooth, OUTFITS } from "./shots";
export { Grain } from "../dead/inserts";

const DEVA = "DiwaliDeva";
let fontP: Promise<void> | null = null;
const loadDeva = () => (fontP ??= (async () => {
  const f = new FontFace(DEVA, `url(${staticFile("fonts/noto-serif-devanagari-devanagari-700-normal.woff2")})`, { weight: "700" });
  await f.load(); (document.fonts as unknown as { add: (f: FontFace) => void }).add(f);
})());

const Portrait: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const g = ref.current!.getContext("2d")!;
    const gr = g.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.4, w * 0.7);
    gr.addColorStop(0, "#f8e3a8"); gr.addColorStop(1, "#d9a85a");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const k = w / 360;
    g.setTransform(k, 0, 0, k, -120 * k, -40 * k);
    bodyFront(new Pen(g), OUTFITS.rama, { mode: "stand", expr: "smile_closed", prop: "bow", seed: 2 });
    g.setTransform(1, 0, 0, 1, 0, 0);
  }, [w, h]);
  return <canvas ref={ref} width={w} height={h} style={{ display: "block" }} />;
};

const Book: React.FC<{ t: number }> = ({ t }) => {
  const [handle] = useState(() => delayRender("devanagari font"));
  useLayoutEffect(() => { loadDeva().then(() => continueRender(handle), () => continueRender(handle)); }, [handle]);
  const u = clamp01((t - 12.3) / 2.6), s = 1.0 + 0.1 * smooth(u), glow = 0.6 + 0.4 * Math.sin(t * 9) * Math.sin(t * 5.3);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #3a1e10 0%, #120804 75%)", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${s})`, transformOrigin: "50% 45%" }}>
        {/* the page */}
        <div style={{ position: "absolute", left: 110, top: 360, width: 860, height: 1100, background: "linear-gradient(#f3dfae, #e6c482)", border: `10px solid ${INK}`, borderRadius: 18,
          boxShadow: `0 0 120px rgba(255,170,60,${0.35 * glow})` }}>
          <div style={{ position: "absolute", inset: 26, border: "6px double #a8441e", borderRadius: 8 }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", fontFamily: `${DEVA}, serif`, fontWeight: 700, fontSize: 150, color: "#9a2a10", lineHeight: 1.2 }}>रामायण</div>
          <div style={{ position: "absolute", left: 230, top: 330, width: 400, height: 520, border: `8px solid ${INK}`, borderRadius: "200px 200px 12px 12px", overflow: "hidden" }}>
            <Portrait w={400} h={520} />
          </div>
          {[0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", left: 120, right: 120, top: 905 + i * 40, height: 6, background: "rgba(154,42,16,0.35)", borderRadius: 3 }} />)}
          {[[60, 60], [740, 60], [60, 960], [740, 960]].map(([x, y], i) => (
            <svg key={i} width={60} height={60} style={{ position: "absolute", left: x, top: y }}><circle cx={30} cy={30} r={18} fill="#e8b84a" stroke="#a8441e" strokeWidth={5} /><circle cx={30} cy={30} r={6} fill="#a8441e" /></svg>
          ))}
        </div>
        {/* a diya at the foot of the page */}
        <svg width={260} height={220} style={{ position: "absolute", left: 410, top: 1500 }}>
          <ellipse cx={130} cy={110} rx={120} ry={100} fill={`rgba(255,180,70,${0.35 * glow})`} />
          <path d="M 40 150 L 220 150 L 190 190 L 70 190 Z" fill="#b5532c" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
          <path d={`M 130 ${60 - 8 * glow} Q 150 110 130 148 Q 110 110 130 ${60 - 8 * glow} Z`} fill="#ffc93a" stroke={INK} strokeWidth={6} />
          <ellipse cx={130} cy={125} rx={7} ry={14} fill="#fff6d0" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Insert: React.FC<{ kind: Kind; t: number }> = ({ t }) => <Book t={t} />;

export const Overlays: React.FC<{ o: Overlay }> = ({ o }) => (
  <>
    {(o.dark ?? 0) > 0 && (
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 52%, rgba(0,0,0,0) ${Math.round(340 * (1 - (o.dark ?? 0)) + 60)}px, rgba(0,0,0,${0.97 * (o.dark ?? 0)}) ${Math.round(420 * (1 - (o.dark ?? 0)) + 380)}px)` }} />
    )}
    {(o.flame ?? 0) > 0 && (
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 55%, rgba(255,236,170,${o.flame}) ${Math.round(900 * (o.flame ?? 0))}px, rgba(255,140,40,${0.8 * (o.flame ?? 0)}) ${Math.round(1400 * (o.flame ?? 0) + 60)}px, rgba(0,0,0,0) ${Math.round(1800 * (o.flame ?? 0) + 120)}px)` }} />
    )}
    {(o.flash ?? 0) > 0 && <AbsoluteFill style={{ background: "#fff2c8", opacity: o.flash }} />}
  </>
);
