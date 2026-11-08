// Word captions in the reference style: one or two spoken words at a time, white heavy sans (Poppins 800) with a thin
// black outline and soft shadow, centred at ~70 % of the frame height, punctuation kept. Driven by the voice's
// words.json ({w, start, end}), so they land exactly on the narration.
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, continueRender, delayRender } from "remotion";

export type Word = { w: string; start: number; end: number };
const FONT = "CapPoppins";
let fontState: "idle" | "loading" | "ready" = "idle";
const loadFont = () => {
  if (fontState !== "idle" || typeof document === "undefined") return;
  fontState = "loading";
  const h = delayRender("caption font");
  const f = new FontFace(FONT, `url(${staticFile("fonts/poppins-latin-800-normal.woff2")})`, { weight: "800" });
  f.load().then((ff) => { document.fonts.add(ff); fontState = "ready"; continueRender(h); }).catch(() => { fontState = "ready"; continueRender(h); });
};
/** group words into caption chunks: at most 2 words / 14 characters, and a chunk ends after , . ? ! */
export const chunk = (W: Word[]) => {
  const out: { text: string; a: number; b: number }[] = [];
  let cur: Word[] = [];
  const flush = () => { if (cur.length) out.push({ text: cur.map((x) => x.w).join(" "), a: cur[0].start, b: cur[cur.length - 1].end }); cur = []; };
  for (const w of W) {
    const len = cur.map((x) => x.w).join(" ").length + w.w.length + 1;
    if (cur.length >= 2 || (cur.length && len > 14)) flush();
    cur.push(w);
    if (/[,.?!]$/.test(w.w)) flush();
  }
  flush();
  // each chunk stays up until the next one starts (or 0.35 s after its last word at a pause)
  return out.map((c, i) => ({ ...c, b: Math.min(out[i + 1]?.a ?? c.b + 0.35, c.b + 0.35) }));
};
export const Captions: React.FC<{ words: Word[]; fps?: number; y?: number; size?: number }> = ({ words, fps = 30, y = 0.7, size = 64 }) => {
  loadFont();
  const t = useCurrentFrame() / fps;
  const C = React.useMemo(() => chunk(words), [words]);
  const c = C.find((x) => t >= x.a - 0.03 && t < x.b);
  if (!c) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 60, right: 60, top: `${y * 100}%`, transform: "translateY(-50%)", textAlign: "center",
        fontFamily: `${FONT}, Poppins, Arial, sans-serif`, fontWeight: 800, fontSize: size, lineHeight: 1.1, color: "#ffffff", letterSpacing: 0.5,
        WebkitTextStroke: "3px #000", paintOrder: "stroke fill", textShadow: "0 3px 0 #000, 0 0 10px rgba(0,0,0,0.55)" }}>{c.text}</div>
    </AbsoluteFill>
  );
};
