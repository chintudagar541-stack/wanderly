// Test sheet: every bodyFront mode / prop / face FX on one page (check designs before a render). 6 cards per row.
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, FrontOpts, Outfit } from "../dead/toon";

const MAN: Outfit = { jacket: "#2f8f8a", pants: "#2a2f45", boots: "#7a4a2a", hat: "hair", hair: "#5a3b2a", headStyle: "ref" };
const BLUE: Outfit = { jacket: "#3f6fb5", pants: "#3b3f52", boots: "#3a2a22", hat: "hair", hair: "#1f1a1a", headStyle: "ref" };
const RED: Outfit = { jacket: "#c0353a", pants: "#3a3040", boots: "#2a1a10", hat: "cap", cap: "#f2c14e", headStyle: "ref" };
const GUARD: Outfit = { jacket: "#8c3b4a", pants: "#2a2a30", boots: "#241726", hat: "helmK", cap: "#c0353a", headStyle: "ref", moustache: "#2a201a" };
const WOMAN: Outfit = { jacket: "#e07a2a", pants: "#7a2a5a", dress: "#b0306a", boots: "#2a1a10", hat: "longHair", hairStyle: "bun", hair: "#2a1a14", headStyle: "ref", bindi: true };
const OLD: Outfit = { jacket: "#8a7a5a", pants: "#4a4a50", boots: "#4a3426", hat: "hair", hair: "#d8d4cc", headStyle: "ref", moustache: "#d8d4cc" };
const KIDO: Outfit = { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#e2453c", build: "kid", headStyle: "ref" };
const OLDLOOK: Outfit = { jacket: "#7b5ac9", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#5a3b2a" };

const CW = 180, CH = 300;
const Card: React.FC<{ label: string; opts: FrontOpts; o: Outfit; bg?: string }> = ({ label, opts, o, bg }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { const g = ref.current!.getContext("2d")!; g.clearRect(0, 0, 600, 1000); bodyFront(new Pen(g), o, { seed: 3, ...opts }); }, [opts, o]);
  return (
    <div style={{ width: CW, height: CH + 38, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <canvas ref={ref} width={600} height={1000} style={{ width: CW, height: CH, background: bg ?? "#f3e7cf", borderRadius: 8 }} />
      <div style={{ font: "600 15px sans-serif", color: "#3a2a22", marginTop: 3, textAlign: "center", lineHeight: "16px" }}>{label}</div>
    </div>
  );
};

const CARDS: [string, Outfit, FrontOpts, string?][] = [
  // modes
  ["sitFeetUp + phone", MAN, { mode: "sitFeetUp", prop: "phone", glow: 0.6, expr: "smile" }],
  ["sitFeetUp + juice", BLUE, { mode: "sitFeetUp", prop: "juice", expr: "smile_closed" }],
  ["lie (coffin) + zzz", BLUE, { mode: "lie", expr: "asleep", zzz: 0.3 }],
  ["kneel", MAN, { mode: "kneel", expr: "worried", tears: 0.7 }],
  ["lean (window)", GUARD, { mode: "lean", expr: "neutral", blink: 0.5 }],
  ["lean tilt -20", RED, { mode: "lean", tilt: -20, expr: "grin" }],
  ["run phase 0.25", RED, { mode: "run", phase: 0.25, expr: "shock", sweat: 0.6 }],
  ["run phase 0.75", MAN, { mode: "run", phase: 0.75, expr: "laugh" }],
  ["jump", KIDO, { mode: "jump", expr: "laugh", sparkleEyes: true }],
  ["sitFloor", OLD, { mode: "sitFloor", expr: "smile_closed" }],
  ["sitFloor (dress)", WOMAN, { mode: "sitFloor", expr: "smile", prop: "diya" }],
  ["kneel + garland", WOMAN, { mode: "kneel", expr: "smile_closed", prop: "garland" }],
  // props
  ["shovel 0 (dig)", MAN, { mode: "stand", prop: ["shovel", 0], expr: "pained", tilt: 6, sweat: 0.4 }],
  ["shovel 1 (toss)", BLUE, { mode: "stand", prop: ["shovel", 1], expr: "stern" }],
  ["phone (look down)", WOMAN, { mode: "stand", prop: "phone", glow: 1, expr: "smile" }],
  ["cup (chai)", OLD, { mode: "stand", prop: "cup", expr: "smile_closed" }],
  ["juice", RED, { mode: "stand", prop: "juice", expr: "neutral" }],
  ["plate (sweets)", WOMAN, { mode: "stand", prop: "plate", expr: "grin" }],
  ["book", OLD, { mode: "sit", prop: "book", expr: "neutral" }],
  ["lantern", GUARD, { mode: "stand", prop: "lantern", expr: "worried" }, "#3a3f62"],
  ["broom", WOMAN, { mode: "stand", prop: "broom", expr: "stern" }],
  ["rope (pull)", MAN, { mode: "stand", prop: "rope", expr: "pained", sweat: 1 }],
  ["flag", RED, { mode: "march", phase: 0.1, prop: "flag", expr: "grin" }],
  ["torch", GUARD, { mode: "stand", prop: "torch", expr: "stern" }, "#3a3f62"],
  ["basket (on head)", WOMAN, { mode: "stand", prop: "basket", expr: "smile" }],
  ["pot (on head)", WOMAN, { mode: "stroll", phase: 0.2, prop: "pot", expr: "smile_closed" }],
  ["umbrella", BLUE, { mode: "stand", prop: "umbrella", expr: "smile" }],
  ["stick / cane", OLD, { mode: "stand", prop: "cane", expr: "neutral", tilt: 4 }],
  ["bag", KIDO, { mode: "stroll", phase: 0.3, prop: "bag", expr: "grin" }],
  ["drum 0 / 1", MAN, { mode: "stand", prop: ["drum", 0.2], expr: "laugh", mouthOpen: 0.8 }],
  ["garland", BLUE, { mode: "stand", prop: "garland", expr: "smile_closed", blush: 0.8 }],
  ["candle", WOMAN, { mode: "stand", prop: "candle", expr: "smile_closed" }, "#3a3f62"],
  // face / emotion FX
  ["angry 1 + steam", GUARD, { mode: "stand", expr: "stern", angry: 1, steam: 1 }],
  ["angry 0.5", BLUE, { mode: "stand", expr: "stern", angry: 0.5, steam: 0.4 }],
  ["blush + sparkle", WOMAN, { mode: "stand", expr: "smile", blush: 1, sparkleEyes: true }],
  ["tears 1", KIDO, { mode: "stand", expr: "pained", tears: 1 }],
  ["question ?", MAN, { mode: "stand", expr: "nervous", question: true }],
  ["exclaim ! + ?", RED, { mode: "stand", expr: "shock", exclaim: true, question: true }],
  ["talk 0.3 / 1", BLUE, { mode: "stand", expr: "smile", mouthOpen: 0.3 }],
  ["talk 1", OLD, { mode: "stand", expr: "neutral", mouthOpen: 1 }],
  ["old look (default)", OLDLOOK, { mode: "stand", expr: "smile", prop: "phone", angry: 0.6 }],
  ["ref look + tophat ?", { ...OLDLOOK, hat: "tophat", headStyle: "ref" }, { mode: "stand", expr: "worried", question: true, sweat: 0.3 }],
];

export const ToonTest: React.FC = () => (
  <AbsoluteFill style={{ background: "#e8d8b8", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start" }}>
    {CARDS.map(([label, o, opts, bg]) => <Card key={label} label={label} o={o} opts={opts} bg={bg} />)}
  </AbsoluteFill>
);
