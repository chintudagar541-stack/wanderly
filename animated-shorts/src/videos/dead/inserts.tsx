// DOM layers for "The Man Who Was Already Dead": phone screens (camera app, call history, the last incoming call),
// the police report, black frames, the peephole lens and the security-camera overlay, film grain.
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, INK } from "./toon";
import { DANIEL, Kind, smooth, clamp01, FPS, kickAt } from "./shots";

const FONT = "'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif";
const PLUM = INK;

/** Daniel's face/bust drawn with the same cartoon code, for avatars and the report photo */
const Portrait: React.FC<{ w: number; h: number; expr?: "neutral" | "smile"; bg?: string }> = ({ w, h, expr = "neutral", bg = "#cfd8e6" }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current!, g = c.getContext("2d")!;
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const k = w / 260;
    g.setTransform(k * 1.0, 0, 0, k * 1.0, -170 * k, -150 * k);
    bodyFront(new Pen(g), DANIEL, { mode: "stand", expr, seed: 3 });
    g.setTransform(1, 0, 0, 1, 0, 0);
  }, [w, h, expr, bg]);
  return <canvas ref={ref} width={w} height={h} style={{ display: "block" }} />;
};

/** cartoon phone held in a hand, centred, with a creeping zoom */
const Phone: React.FC<{ t: number; a: number; b: number; children: React.ReactNode; zoom?: [number, number]; origin?: string; buzz?: boolean; bg?: string }> = ({ t, a, b, children, zoom = [1, 1.08], origin = "50% 40%", buzz, bg }) => {
  const u = clamp01((t - a) / (b - a)), s = zoom[0] + (zoom[1] - zoom[0]) * smooth(u);
  const f = Math.round(t * FPS), shake = buzz && Math.floor(t * 2.5) % 2 === 0 ? (f % 2 ? 6 : -6) : 0;
  return (
    <AbsoluteFill style={{ background: bg ?? "radial-gradient(ellipse at 50% 40%, #1d2340 0%, #090a14 70%)", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${s}) translateX(${shake}px)`, transformOrigin: origin }}>
        <div style={{ position: "absolute", left: 160, top: 170, width: 760, height: 1520, borderRadius: 96, background: "#15161c",
          border: `12px solid ${PLUM}`, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 22, borderRadius: 74, overflow: "hidden", background: "#0b0d16" }}>{children}</div>
          <div style={{ position: "absolute", left: 300, top: 40, width: 140, height: 34, borderRadius: 20, background: "#000" }} />
        </div>
        {/* hand: thumb over the left edge, fingers behind the right edge */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <g stroke={PLUM} strokeWidth={12} strokeLinejoin="round" fill="#ffd9b8">
            {[0, 1, 2, 3].map((i) => <rect key={i} x={890} y={1060 + i * 120} width={120} height={96} rx={46} />)}
            <path d="M 60 1920 L 120 1500 Q 150 1330 250 1300 Q 330 1290 330 1380 L 300 1560 Q 380 1640 420 1920 Z" />
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const AppScreen: React.FC<{ t: number }> = ({ t }) => {
  const tap = clamp01((t - 24.55) / 0.35), connecting = t > 24.7;
  return (
    <div style={{ fontFamily: FONT, color: "#e8ecf6", height: "100%", background: "#10131f" }}>
      <div style={{ padding: "110px 50px 30px", fontSize: 56, fontWeight: 700 }}>HomeCam</div>
      <div style={{ margin: "0 40px", fontSize: 30, color: "#8a93ad" }}>Building 4 · Apt 12</div>
      <div style={{ position: "relative", margin: "40px 40px 0", height: 420, borderRadius: 28, background: "#1b2033", overflow: "hidden", border: "4px solid #2a3150" }}>
        <div style={{ position: "absolute", left: 30, top: 24, fontSize: 32, fontWeight: 700 }}>CAM 01 · Hallway</div>
        <div style={{ position: "absolute", right: 30, top: 28, fontSize: 26, color: "#ff5a5a" }}>● LIVE</div>
        {connecting && (
          <div style={{ position: "absolute", left: "50%", top: "55%", width: 90, height: 90, marginLeft: -45, marginTop: -45, borderRadius: 45,
            border: "10px solid #39415f", borderTopColor: "#d8e2ff", transform: `rotate(${t * 520}deg)` }} />
        )}
        {tap > 0 && tap < 1 && <div style={{ position: "absolute", left: 300, top: 200, width: 40 + 400 * tap, height: 40 + 400 * tap,
          marginLeft: -(20 + 200 * tap), marginTop: -(20 + 200 * tap), borderRadius: "50%", background: `rgba(255,255,255,${0.35 * (1 - tap)})` }} />}
      </div>
      {["CAM 02 · Living room", "CAM 03 · Bedroom"].map((n, i) => (
        <div key={n} style={{ margin: "30px 40px 0", height: 150, borderRadius: 24, background: "#161a29", display: "flex", alignItems: "center", padding: "0 30px", fontSize: 32, color: "#6f7894" }}>
          {n}<span style={{ marginLeft: "auto", fontSize: 26 }}>{i ? "offline" : "offline"}</span>
        </div>
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, textAlign: "center", fontSize: 34, color: "#8a93ad" }}>{connecting ? "Connecting…" : "Tap a camera"}</div>
    </div>
  );
};

const LogScreen: React.FC<{ t: number }> = ({ t }) => {
  const reveal = clamp01((t - 76.6) / 0.12), hi = clamp01((t - 73.5) / 0.4);
  const rows: [string, string, string][] = [["Mom", "Mobile", "Yesterday"], ["Work", "Office", "Monday"], ["Pizza Place", "Mobile", "Sunday"], ["Mom", "Mobile", "Saturday"]];
  return (
    <div style={{ fontFamily: FONT, color: "#111", height: "100%", background: "#f4f5f8" }}>
      <div style={{ padding: "110px 50px 20px", fontSize: 64, fontWeight: 800 }}>Recents</div>
      <div style={{ position: "relative", margin: "10px 30px", padding: "34px 30px", borderRadius: 26, background: `rgba(255,${235 - 60 * hi},${235 - 60 * hi},${0.3 + 0.7 * hi})`, display: "flex", alignItems: "center" }}>
        <div style={{ width: 96, height: 96, borderRadius: 48, overflow: "hidden", marginRight: 28, border: `5px solid ${PLUM}`, opacity: reveal }}>
          <Portrait w={96} h={96} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 50, fontWeight: 800, color: reveal > 0 ? "#c4172b" : "#111" }}>
            {reveal > 0 ? "Daniel" : <span style={{ filter: "blur(10px)" }}>Unknown</span>}
          </div>
          <div style={{ fontSize: 30, color: "#6b7080" }}>Incoming call</div>
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, color: hi > 0 ? "#c4172b" : "#6b7080" }}>2:17 AM</div>
      </div>
      {rows.map(([n, s, d]) => (
        <div key={n + d} style={{ margin: "0 30px", padding: "34px 30px", borderBottom: "2px solid #e1e3ea", display: "flex", alignItems: "center", opacity: 0.8 }}>
          <div style={{ width: 96, height: 96, borderRadius: 48, background: "#c8cddb", marginRight: 28 }} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 44, fontWeight: 600 }}>{n}</div><div style={{ fontSize: 28, color: "#6b7080" }}>{s}</div></div>
          <div style={{ fontSize: 32, color: "#6b7080" }}>{d}</div>
        </div>
      ))}
    </div>
  );
};

const IncomingScreen: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ fontFamily: FONT, color: "#fff", height: "100%", background: "linear-gradient(#2b3f6e, #0f1730)", textAlign: "center" }}>
    <div style={{ paddingTop: 200, fontSize: 36, opacity: 0.8 }}>incoming call…</div>
    <div style={{ margin: "60px auto 0", width: 300, height: 300, borderRadius: 150, overflow: "hidden", border: `8px solid ${PLUM}` }}><Portrait w={300} h={300} expr="smile" /></div>
    <div style={{ marginTop: 50, fontSize: 92, fontWeight: 800 }}>Daniel</div>
    <div style={{ marginTop: 10, fontSize: 34, opacity: 0.7 }}>Mobile</div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 170, display: "flex", justifyContent: "space-around" }}>
      {["#ef4b4b", "#3fd16b"].map((c, i) => <div key={c} style={{ width: 150, height: 150, borderRadius: 75, background: c, transform: i ? `scale(${1 + 0.06 * Math.sin(t * 12)})` : undefined }} />)}
    </div>
  </div>
);

const Report: React.FC<{ t: number }> = ({ t }) => {
  const u = clamp01((t - 77.75) / 4.65), s = 1.0 + 0.12 * smooth(u);
  const st = clamp01((t - 80.3) / 0.12), stampS = 2.4 - 1.4 * st, line = clamp01((t - 81.0) / 0.5);
  const kick = kickAt(t);
  return (
    <AbsoluteFill style={{ background: "repeating-linear-gradient(90deg, #7a4f2e 0 140px, #6e4529 140px 146px, #835634 146px 300px)", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${s}) translate(${kick * 8}px, ${kick * 5}px) rotate(-2deg)`, transformOrigin: "50% 55%" }}>
        <div style={{ position: "absolute", left: 110, top: 260, width: 860, height: 1300, background: "#f6f1e3", border: `10px solid ${PLUM}`, borderRadius: 14,
          fontFamily: FONT, color: "#2a2a33", padding: 60, boxSizing: "border-box", boxShadow: "0 30px 60px rgba(0,0,0,0.45)" }}>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 2 }}>METRO POLICE DEPARTMENT</div>
          <div style={{ fontSize: 28, marginTop: 6, color: "#555" }}>INCIDENT REPORT · CASE 4471</div>
          <div style={{ height: 6, background: "#2a2a33", margin: "26px 0 40px" }} />
          <div style={{ display: "flex" }}>
            <div style={{ width: 230, height: 280, border: `6px solid ${PLUM}`, overflow: "hidden", marginRight: 40 }}><Portrait w={230} h={280} bg="#d9dde4" /></div>
            <div style={{ fontSize: 34, lineHeight: "64px" }}>
              <div><b>Name:</b> Daniel</div><div><b>Address:</b> Apt 12</div><div><b>Found:</b> phone on floor</div><div><b>Entry:</b> no force</div>
            </div>
          </div>
          <div style={{ fontSize: 34, lineHeight: "64px", marginTop: 50 }}>
            <div><b>Report date:</b> Nov 6</div>
            <div style={{ position: "relative", display: "inline-block" }}><b>Date of death:</b> Nov 3
              <div style={{ position: "absolute", left: -10, right: -10, bottom: 6, height: 8, background: "#c4172b", transform: `scaleX(${line})`, transformOrigin: "left" }} /></div>
            <div><b>Cause:</b> undetermined</div>
          </div>
          <div style={{ marginTop: 40, height: 3, background: "#ccc" }} /><div style={{ marginTop: 22, height: 3, background: "#ccc" }} /><div style={{ marginTop: 22, height: 3, background: "#ccc", width: "60%" }} />
          {st > 0 && (
            <div style={{ position: "absolute", left: 200, top: 760, padding: "16px 40px", border: "12px solid #c4172b", color: "#c4172b", fontSize: 110, fontWeight: 900,
              letterSpacing: 6, transform: `rotate(-14deg) scale(${stampS})`, opacity: 0.88, borderRadius: 12 }}>DECEASED</div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Insert: React.FC<{ kind: Kind; t: number; a: number; b: number }> = ({ kind, t, a, b }) => {
  if (kind === "black") return <AbsoluteFill style={{ background: "#000" }} />;
  if (kind === "app") return <Phone t={t} a={a} b={b} zoom={[1, 1.1]} origin="50% 30%"><AppScreen t={t} /></Phone>;
  if (kind === "log") return <Phone t={t} a={a} b={b} zoom={[1.0, 1.55]} origin="50% 22%"><LogScreen t={t} /></Phone>;
  if (kind === "report") return <Report t={t} />;
  // incoming: the officer's phone, daylight, ends on a cut to black
  if (t > 84.55) return <AbsoluteFill style={{ background: "#000" }} />;
  return <Phone t={t} a={a} b={b} zoom={[1.0, 1.12]} buzz bg="radial-gradient(ellipse at 50% 40%, #c9b79a 0%, #6d5a48 75%)"><IncomingScreen t={t} /></Phone>;
};

export const PeepOverlay: React.FC<{ t: number }> = () => (
  <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 46%, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 360px, rgba(0,0,0,0.75) 430px, #000 470px)" }} />
);

export const CctvOverlay: React.FC<{ t: number }> = ({ t }) => {
  const sec = 7 + Math.floor(t - 29.05), mm = sec >= 60 ? 19 : 18, ss = String(sec % 60).padStart(2, "0");
  const rec = Math.floor(t * 1.6) % 2 === 0;
  return (
    <AbsoluteFill style={{ fontFamily: "'DejaVu Sans Mono', monospace", color: "#f2f2f2", textShadow: "0 0 6px rgba(0,0,0,0.9)" }}>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 3px, rgba(0,0,0,0) 3px 7px)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
      <div style={{ position: "absolute", left: 60, top: 90, fontSize: 44 }}>CAM 01 · HALLWAY</div>
      <div style={{ position: "absolute", right: 60, top: 90, fontSize: 44 }}><span style={{ color: "#ff3b3b", opacity: rec ? 1 : 0.15 }}>●</span> REC</div>
      <div style={{ position: "absolute", left: 60, bottom: 110, fontSize: 40 }}>11-06-2026  02:{mm}:{ss}</div>
      <div style={{ position: "absolute", left: 40, top: 40, width: 90, height: 90, borderLeft: "6px solid #eee", borderTop: "6px solid #eee" }} />
      <div style={{ position: "absolute", right: 40, top: 40, width: 90, height: 90, borderRight: "6px solid #eee", borderTop: "6px solid #eee" }} />
      <div style={{ position: "absolute", left: 40, bottom: 40, width: 90, height: 90, borderLeft: "6px solid #eee", borderBottom: "6px solid #eee" }} />
      <div style={{ position: "absolute", right: 40, bottom: 40, width: 90, height: 90, borderRight: "6px solid #eee", borderBottom: "6px solid #eee" }} />
    </AbsoluteFill>
  );
};

/** film grain: animated SVG noise, seeded per frame */
export const Grain: React.FC<{ f: number; k: number }> = ({ f, k }) => (
  <AbsoluteFill style={{ opacity: k, mixBlendMode: "overlay", pointerEvents: "none" }}>
    <svg width={1080} height={1920}>
      <filter id={`g${f}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 97} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width={1080} height={1920} filter={`url(#g${f})`} />
    </svg>
  </AbsoluteFill>
);
