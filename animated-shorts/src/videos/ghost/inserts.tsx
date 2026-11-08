// DOM layers for "The Ghost Army": binocular view, the secret dossier, the battle map and the "classified" years.
import React from "react";
import { AbsoluteFill } from "remotion";
import { INK } from "../dead/toon";
import { Kind, smooth, clamp01, kickAt } from "./shots";
export { Grain } from "../dead/inserts";

const TYPE = "'DejaVu Sans Mono', 'Courier New', monospace";
const SANS = "'DejaVu Sans', Arial, sans-serif";
const PAPER = "#efe4c8";
const RED = "#b3262b";

export const BinocOverlay: React.FC = () => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <mask id="bin"><rect width={1080} height={1920} fill="white" /><circle cx={340} cy={900} r={330} fill="black" /><circle cx={740} cy={900} r={330} fill="black" /></mask>
        <radialGradient id="edge"><stop offset="0.8" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.7" /></radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="#000" mask="url(#bin)" />
      <circle cx={340} cy={900} r={330} fill="url(#edge)" /><circle cx={740} cy={900} r={330} fill="url(#edge)" />
      <g stroke="rgba(0,0,0,0.55)" strokeWidth={3}><line x1={540} y1={720} x2={540} y2={1080} /><line x1={360} y1={900} x2={720} y2={900} />
        {[-2, -1, 1, 2].map((k) => <line key={k} x1={540 + k * 60} y1={890} x2={540 + k * 60} y2={910} />)}</g>
    </svg>
  </AbsoluteFill>
);

/** a ghost emblem: our own design (not the unit's insignia) */
const Ghost: React.FC<{ size: number; color?: string }> = ({ size, color = "#f4f1e8" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M 20 90 L 20 45 Q 20 12 50 12 Q 80 12 80 45 L 80 90 L 70 80 L 60 90 L 50 80 L 40 90 L 30 80 Z" fill={color} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <ellipse cx={40} cy={45} rx={5} ry={7} fill={INK} /><ellipse cx={60} cy={45} rx={5} ry={7} fill={INK} />
  </svg>
);

const Desk: React.FC<{ children: React.ReactNode; s: number; kick?: number }> = ({ children, s, kick = 0 }) => (
  <AbsoluteFill style={{ background: "repeating-linear-gradient(90deg, #5e4128 0 160px, #563a23 160px 166px, #664730 166px 320px)", overflow: "hidden" }}>
    <AbsoluteFill style={{ transform: `scale(${s}) translate(${kick * 8}px, ${kick * 5}px)`, transformOrigin: "50% 50%" }}>{children}</AbsoluteFill>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)" }} />
  </AbsoluteFill>
);

const Dossier: React.FC<{ t: number }> = ({ t }) => {
  const u = clamp01((t - 15.85) / 4.9), typed = "23RD HEADQUARTERS SPECIAL TROOPS";
  const n = Math.floor(clamp01((t - 16.9) / 1.4) * typed.length), st = clamp01((t - 19.4) / 0.12);
  return (
    <Desk s={1 + 0.1 * smooth(u)} kick={kickAt(t + 0) * 0}>
      <div style={{ position: "absolute", left: 120, top: 330, width: 840, height: 1200, background: "#c9a86a", border: `10px solid ${INK}`, borderRadius: 18, transform: "rotate(-3deg)" }} />
      <div style={{ position: "absolute", left: 150, top: 300, width: 800, height: 1160, background: PAPER, border: `10px solid ${INK}`, borderRadius: 10, transform: "rotate(-1deg)",
        fontFamily: TYPE, color: "#2a2620", padding: 60, boxSizing: "border-box" }}>
        <div style={{ display: "inline-block", border: `8px solid ${RED}`, color: RED, fontSize: 64, fontWeight: 900, padding: "6px 26px", transform: "rotate(-6deg)", letterSpacing: 6 }}>SECRET</div>
        <div style={{ marginTop: 50, fontSize: 30 }}>U.S. ARMY · EUROPEAN THEATER · 1944</div>
        <div style={{ marginTop: 40, fontSize: 38, fontWeight: 700, minHeight: 100 }}>{typed.slice(0, n)}<span style={{ opacity: Math.floor(t * 4) % 2 ? 1 : 0 }}>▌</span></div>
        <div style={{ marginTop: 30, fontSize: 28, lineHeight: "48px", color: "#5a5248" }}>Mission: deception<br />Equipment: inflatables, sound, radio<br />Men: approx. 1,100</div>
        {st > 0 && (
          <div style={{ position: "absolute", left: 110, top: 640, display: "flex", alignItems: "center", gap: 20, transform: `rotate(-8deg) scale(${2.2 - 1.2 * st})`, opacity: 0.92 }}>
            <Ghost size={170} />
            <div style={{ border: `10px solid ${RED}`, color: RED, fontFamily: SANS, fontSize: 84, fontWeight: 900, padding: "4px 24px", lineHeight: 1.05, letterSpacing: 3 }}>THE GHOST<br />ARMY</div>
          </div>
        )}
      </div>
    </Desk>
  );
};

/** battle map: red arrows strike the ghost positions, then blue arrows advance elsewhere */
const MapInsert: React.FC<{ t: number }> = ({ t }) => {
  const red = clamp01((t - 56.1) / 1.2), blue = clamp01((t - 57.7) / 1.3), u = clamp01((t - 55.95) / 3.45);
  const arrow = (x1: number, y1: number, x2: number, y2: number, k: number, col: string, key: string) => {
    const x = x1 + (x2 - x1) * k, y = y1 + (y2 - y1) * k, a = Math.atan2(y2 - y1, x2 - x1);
    return k <= 0 ? null : (
      <g key={key}>
        <line x1={x1} y1={y1} x2={x} y2={y} stroke={INK} strokeWidth={34} strokeLinecap="round" />
        <line x1={x1} y1={y1} x2={x} y2={y} stroke={col} strokeWidth={22} strokeLinecap="round" />
        <polygon points={`${x + 40 * Math.cos(a)},${y + 40 * Math.sin(a)} ${x + 34 * Math.cos(a + 2.3)},${y + 34 * Math.sin(a + 2.3)} ${x + 34 * Math.cos(a - 2.3)},${y + 34 * Math.sin(a - 2.3)}`} fill={col} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      </g>
    );
  };
  return (
    <Desk s={1.0 + 0.08 * smooth(u)}>
      <div style={{ position: "absolute", left: 70, top: 300, width: 940, height: 1300, background: "#e9dcb6", border: `10px solid ${INK}`, borderRadius: 12, overflow: "hidden" }}>
        <svg width={940} height={1300}>
          <path d="M -20 820 C 200 760 300 900 520 840 S 820 700 980 760" stroke="#6fa0c8" strokeWidth={30} fill="none" />
          {[[160, 300], [700, 260], [300, 1100], [780, 1050], [520, 560]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={70} fill="#c9d3a0" opacity={0.7} />)}
          {[[120, 520], [600, 980], [820, 420]].map(([x, y], i) => <rect key={i} x={x} y={y} width={40} height={30} fill="#a0784a" />)}
          {/* ghost army positions (left) */}
          {[[210, 640], [330, 600], [270, 720]].map(([x, y], i) => <g key={i} transform={`translate(${x - 45},${y - 45})`}><Ghost size={90} color="#f4f1e8" /></g>)}
          {arrow(520, 120, 300, 560, red, "#d0353a", "r1")}
          {arrow(820, 160, 380, 600, red, "#d0353a", "r2")}
          {/* the real army (right) breaks through */}
          {[[700, 1180], [800, 1150]].map(([x, y], i) => <rect key={i} x={x - 30} y={y - 20} width={60} height={40} fill="#3c63a8" stroke={INK} strokeWidth={6} />)}
          {arrow(700, 1150, 720, 700, blue, "#3c7ad8", "b1")}
          {arrow(800, 1120, 880, 640, blue, "#3c7ad8", "b2")}
        </svg>
      </div>
    </Desk>
  );
};

const Years: React.FC<{ t: number }> = ({ t }) => {
  const k = clamp01((t - 65.5) / 1.5), year = Math.round(1945 + (1996 - 1945) * smooth(k)), st = clamp01((t - 67.0) / 0.12);
  return (
    <Desk s={1.02} kick={kickAt(t)}>
      <div style={{ position: "absolute", left: 140, top: 420, width: 800, height: 1000, background: "#c9a86a", border: `10px solid ${INK}`, borderRadius: 16, transform: "rotate(2deg)" }}>
        <div style={{ position: "absolute", left: 60, top: -70, width: 260, height: 90, background: "#c9a86a", border: `10px solid ${INK}`, borderBottom: "none", borderRadius: "16px 16px 0 0" }} />
        <div style={{ position: "absolute", left: 80, top: 100, fontFamily: TYPE, fontSize: 40, color: "#3a2a14" }}>FILE: GHOST ARMY</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", fontFamily: SANS, fontSize: 210, fontWeight: 900, color: "#3a2a14", letterSpacing: 4 }}>{year}</div>
        {st > 0 && <div style={{ position: "absolute", left: 70, top: 650, border: `14px solid ${RED}`, color: RED, fontFamily: SANS, fontSize: 108, fontWeight: 900, padding: "6px 30px",
          transform: `rotate(-10deg) scale(${2.3 - 1.3 * st})`, opacity: 0.92, letterSpacing: 4 }}>CLASSIFIED</div>}
      </div>
    </Desk>
  );
};

export const Insert: React.FC<{ kind: Kind; t: number }> = ({ kind, t }) => {
  if (kind === "dossier") return <Dossier t={t} />;
  if (kind === "map") return <MapInsert t={t} />;
  return <Years t={t} />;
};
