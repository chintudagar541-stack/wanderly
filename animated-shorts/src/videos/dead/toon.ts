// Copied from the bridge short and extended for "The Man Who Was Already Dead": expressions creepy / terror / asleep /
// worried, phone props (at the ear, held to look at) and a back view for turning around.
// Our own flat 2D cartoon cast (riflemen, officer, townsfolk, kid, parent) + 2D effects, drawn on a canvas.
// Construction v2 (characters.md, our own cast): superellipse heads (pointed crown 1.75 / full jaw 2.3, chin taper,
// seeded side bulge + tilt), bean torsos, single-stroke limbs with ink-dot hands, a thick-thin plum outline weighted
// away from the light, soft painted crescents, deadpan lidded eyes, no blush, no catchlights.
// Design space 600 x 1000 units (soles at y = 975); the canvas transform scales it.
export const INK = "#241726";
export const SKIN = "#ffe2c2";
const WHITE = "#ffffff";
const MOUTH = "#5a1e28";
const TONGUE = "#e86e78";
type C3 = [number, number, number];
const SH_SKIN: C3 = [0.96, 0.86, 0.84]; // measured shadow/lit ratio on skin heads
const SH_CLOTH: C3 = [0.64, 0.66, 0.74]; // torsos: lit side -> far side ~0.65
const SH_FELT: C3 = [0.62, 0.62, 0.7];

export type Build = "adult" | "stout" | "kid";
export type Outfit = {
  jacket: string; pants: string; boots: string; hat?: string | null; belt?: string | null; buttons?: string; rifle?: boolean;
  sash?: string; sword?: boolean; moustache?: string; skin?: string; head?: number; cap?: string; hair?: string; dress?: string;
  build?: Build; stars?: boolean; heads?: number; bindi?: boolean; beard?: string;
  /** with hat "longHair": the hairstyle (default long); jewel = jhumkas, necklace, maang tikka; dupatta = its colour */
  hairStyle?: "long" | "bob" | "ponytail" | "bun"; jewel?: boolean; dupatta?: string;
  /** "ref": the reference-short head look: near-white cream skin (#f7f2ea unless `skin` is set), soft grey shading on the
   *  shadow side, a thinner even outline and slightly smaller features. Default (undefined) = the old look. */
  headStyle?: "ref";
};
export const REF_SKIN = "#f7f2ea";
type P2 = [number, number];

const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const mul = (c: string, m: C3) => {
  const n = parseInt(c.slice(1), 16);
  const ch = (v: number, k: number) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255, m[0])}${ch((n >> 8) & 255, m[1])}${ch(n & 255, m[2])}`;
};
export const shade = (c: string, k: number) => mul(c, [k, k, k]);
export const mix = (a: string, b: string, t: number) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
/** deterministic per-character random in [0, 1) */
const rnd = (seed: number, k: number) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const rotPts = (pts: P2[], a: number, cx: number, cy: number): P2[] =>
  pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
const rotAbout = (q: P2, a: number, c: P2): P2 => rotPts([q], a, c[0], c[1])[0];
const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** smooth curve from a through (near) k to b, as a polyline */
const curve = (a: P2, k: P2, b: P2, n = 10): P2[] => {
  const c: P2 = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s = 1 - t;
    out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]);
  }
  return out;
};

export const RIFLEMAN: Outfit = { jacket: "#357650", pants: "#3d4440", boots: INK, hat: "shako", belt: "#f1efe6", buttons: "#d9dde0", rifle: true };
export const OFFICER: Outfit = { ...RIFLEMAN, hat: "shako_tall", buttons: "#e8c45a", sash: "#c0353a", sword: true, moustache: "#4a3020", rifle: false, belt: null, build: "stout" };
export const KID: Outfit = { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#e2453c", build: "kid" };
export const PARENT: Outfit = { jacket: "#7b5ac9", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#5a3b2a" };
export const SKINS = [SKIN, "#f5c9a0", "#ecd0b6", "#c99067"];

export const soldier = (v = 0, extra: Partial<Outfit> = {}): Outfit => {
  const o: Outfit = { ...RIFLEMAN, skin: SKINS[v % 4] };
  if (v % 4 === 1) o.moustache = "#4a3426";
  if (v % 4 === 3) o.moustache = "#2a201a";
  return { ...o, ...extra };
};

export const townsfolk = (v = 0): Outfit => {
  const coats = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9"];
  const o: Outfit = { jacket: coats[v % 6], pants: "#3b3f52", boots: "#4a3426", skin: SKINS[v % 4] };
  return v % 2 ? { ...o, hat: "bonnet", dress: ["#d9a441", "#c25a7a", "#5a8fc2"][v % 3] } : { ...o, hat: "tophat" };
};

export class Pen {
  g: CanvasRenderingContext2D;
  ol = 12;
  /** [angle, cx, cy] rotation about (cx, cy), optional post-translation [.., dx, dy] */
  rot: number[] | null = null;
  constructor(g: CanvasRenderingContext2D) { this.g = g; }
  P(x: number, y: number): P2 {
    if (!this.rot) return [x, y];
    const r = this.rot, a = r[0], cx = r[1], cy = r[2], dx = r.length > 3 ? r[3] : 0, dy = r.length > 4 ? r[4] : 0, c = Math.cos(a), s = Math.sin(a);
    return [cx + (x - cx) * c - (y - cy) * s + dx, cy + (x - cx) * s + (y - cy) * c + dy];
  }
  path(pts: P2[], close: boolean) {
    const g = this.g;
    g.beginPath();
    pts.forEach((p, i) => { const [x, y] = this.P(p[0], p[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    if (close) g.closePath();
  }
  /** filled shape with an ink outline; fill=null draws the outline only */
  poly(pts: P2[], fill: string | null, ol?: number) {
    const g = this.g, w = ol ?? this.ol;
    this.path(pts, true);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (w) { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); }
  }
  ell(cx: number, cy: number, rx: number, ry: number, fill: string | null, ol?: number, a0 = 0, a1 = 360, rot = 0) {
    this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol);
  }
  /** thick round-capped limb with an ink rim (effects, rope) */
  line(pts: P2[], fill: string, w: number, ink = true) {
    const g = this.g;
    g.lineCap = "round"; g.lineJoin = "round";
    if (ink) { this.path(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * this.ol * 0.9; g.stroke(); }
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }
  stroke(pts: P2[], w: number, fill = INK) {
    const g = this.g;
    g.lineCap = "round"; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }
  arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, w: number, fill = INK) {
    const pts: P2[] = [];
    for (let i = 0; i <= 24; i++) pts.push([cx + rx * Math.cos(rad(a0 + ((a1 - a0) * i) / 24)), cy + ry * Math.sin(rad(a0 + ((a1 - a0) * i) / 24))]);
    this.stroke(pts, w, fill);
  }
  dot(cx: number, cy: number, r: number, fill = INK) {
    const [x, y] = this.P(cx, cy);
    this.g.beginPath(); this.g.arc(x, y, r, 0, Math.PI * 2); this.g.fillStyle = fill; this.g.fill();
  }
  /** draw with a closed shape as clip */
  clip(pts: P2[], fn: () => void) { const g = this.g; g.save(); this.path(pts, true); g.clip(); fn(); g.restore(); }
  /** flat fill + soft crescent on the side away from the light (light = canvas angle the light comes FROM).
   *  Radial ramp centred `shift` R toward the light: flat out to ~0.6 R on the far side, full shadow by ~0.8 R. */
  shadedFill(pts: P2[], base: string, shadow: string, light: number, R: number, shift = 0.45, r0 = 1.05, r1 = 1.25) {
    const g = this.g, n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const [gx, gy] = this.P(cx + Math.cos(light) * shift * R, cy + Math.sin(light) * shift * R);
    const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r1 * R);
    gr.addColorStop(0, base); gr.addColorStop(r0 / r1, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** broad gradient across a shape along the light: lit edge = base, far edge = shadow (torsos, coats) */
  gradFill(pts: P2[], base: string, shadow: string, light: number, flat = 0.22) {
    const g = this.g, dx = Math.cos(light), dy = Math.sin(light), n = pts.length;
    let cx = 0, cy = 0, lo = Infinity, hi = -Infinity;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; const d = x * dx + y * dy; lo = Math.min(lo, d); hi = Math.max(hi, d); }
    const dc = cx * dx + cy * dy;
    const [ax, ay] = this.P(cx + dx * (hi - dc), cy + dy * (hi - dc)), [bx, by] = this.P(cx + dx * (lo - dc), cy + dy * (lo - dc));
    const gr = g.createLinearGradient(ax, ay, bx, by);
    gr.addColorStop(0, base); gr.addColorStop(flat, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** thick-thin ink ring: w(θ) = w0 (1 + k cos(θ − thick)), θ from the contour centroid (canvas angles) */
  inkRing(pts: P2[], w0: number, thick: number, k = 0.45, col = INK) {
    const n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const out: P2[] = [], inn: P2[] = [];
    pts.forEach((q, i) => {
      const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
      let nx = b[1] - a[1], ny = a[0] - b[0]; // outward normal for clockwise-on-screen contours
      const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
      out.push([q[0] + nx * h, q[1] + ny * h]); inn.push([q[0] - nx * h, q[1] - ny * h]);
    });
    const g = this.g;
    const trace = (r: P2[]) => { r.forEach(([x0, y0], i) => { const [x, y] = this.P(x0, y0); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); };
    g.beginPath(); trace(out); trace(inn.reverse());
    g.fillStyle = col; g.fill("evenodd");
  }
  /** flat strap with a thin ink rim (cross belts, sash, rifle, handles) */
  band(pts: P2[], fill: string, w: number, rim: number, cap: CanvasLineCap = "butt") {
    const g = this.g; g.lineCap = cap; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * rim; g.stroke();
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
    g.lineCap = "round";
  }
}

const ellPts = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = 360, rot = 0, n = 48): P2[] => {
  const r = rad(rot), pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n), x = rx * Math.cos(a), y = ry * Math.sin(a);
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return pts;
};

const rrect = (x0: number, y0: number, x1: number, y1: number, r: number, n = 8): P2[] => {
  const pts: P2[] = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
    for (let i = 0; i <= n; i++) pts.push([cx + r * Math.cos(rad(a + (90 * i) / n)), cy + r * Math.sin(rad(a + (90 * i) / n))]);
  return pts;
};

/** tapered stroke, thick end at a: brows, moustache halves */
const taper = (p: Pen, a: P2, b: P2, wa: number, wb: number, col = INK) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  p.poly([[a[0] + nx * wa / 2, a[1] + ny * wa / 2], [b[0] + nx * wb / 2, b[1] + ny * wb / 2],
    [b[0] - nx * wb / 2, b[1] - ny * wb / 2], [a[0] - nx * wa / 2, a[1] - ny * wa / 2]], col, 0);
  p.dot(a[0], a[1], wa / 2, col); p.dot(b[0], b[1], wb / 2, col);
};

// ---------------- contours ----------------
export type Blob = { a: number; b: number; nTop: number; nBot: number; egg: number; asym: number; rot: number; noise: number; seed: number };

/** superellipse "bean": separate crown / jaw exponents, egg taper (neg = narrower chin), one-side bulge, soft noise.
 *  Points run right -> down -> left -> up (clockwise on screen). */
export const blobPts = (cx: number, cy: number, B: Blob, n = 72): P2[] => {
  const ph = [rnd(B.seed, 11), rnd(B.seed, 12), rnd(B.seed, 13)].map((v) => v * Math.PI * 2);
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? B.nTop : B.nBot);
    let X = Math.sign(c) * Math.abs(c) ** e;
    const Y = Math.sign(s) * Math.abs(s) ** e;
    X *= (1 + B.egg * Y) * (1 + B.asym * Math.sign(X));
    const r = 1 + B.noise * (Math.cos(2 * t + ph[0]) + 0.7 * Math.cos(3 * t + ph[1]) + 0.5 * Math.cos(4 * t + ph[2]));
    const x = B.a * X * r, y = B.b * Y * r;
    pts.push([cx + x * Math.cos(B.rot) - y * Math.sin(B.rot), cy + x * Math.sin(B.rot) + y * Math.cos(B.rot)]);
  }
  return pts;
};

/** measured head: H/W 0.94, slightly pointed crown (1.75), fuller jaw (2.3), chin taper -0.12, 8 % bulge to the facing side */
export const headBlob = (seed: number, a = 118, facing = 0): Blob => ({
  a, b: a * (0.94 + 0.08 * (rnd(seed, 1) - 0.5)),
  nTop: 1.75 + 0.3 * (rnd(seed, 2) - 0.5), nBot: 2.3 + 0.3 * (rnd(seed, 3) - 0.5),
  egg: -0.12 + 0.06 * (rnd(seed, 4) - 0.5),
  asym: (0.06 + 0.04 * rnd(seed, 5)) * (facing || (rnd(seed, 6) < 0.5 ? -1 : 1)),
  rot: rad(8 * (rnd(seed, 7) - 0.5)), noise: 0.008, seed,
});

/** thickest outline direction: away from the light, pulled toward the ground (64 deg measured for upper-left light) */
export const thickAngle = (light: number) => Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));
const DEF_LIGHT = rad(-120);

// ---------------- faces ----------------
export type Expr = "neutral" | "stern" | "grin" | "laugh" | "whistle" | "nervous" | "shock" | "relief" | "relief_open" | "dazed"
  | "pained" | "smile" | "smile_closed" | "lick" | "creepy" | "terror" | "asleep" | "worried";
type EyeK = "dot" | "small" | "lid" | "slit" | "happy" | "dash" | "squeeze" | "shock" | "shockHalf" | "spiral" | "sparkle";
type MouthK = "dash" | "frown" | "smirk" | "smile" | "smileWide" | "grin" | "laugh" | "o" | "O" | "wave" | "teeth" | "lick" | "creep";
/** eyes [back, front], brows [inner, outer] offsets in u (+ = down), mouth kind */
const FACE: Record<Expr, { eye: [EyeK, EyeK]; brow: [number, number]; mouth: MouthK }> = {
  neutral: { eye: ["lid", "lid"], brow: [0, -1], mouth: "dash" },
  stern: { eye: ["lid", "lid"], brow: [3, -2], mouth: "frown" },
  grin: { eye: ["happy", "happy"], brow: [-3, -3], mouth: "grin" },
  laugh: { eye: ["squeeze", "squeeze"], brow: [-4, -4], mouth: "laugh" },
  whistle: { eye: ["dash", "dash"], brow: [-2, -4], mouth: "o" },
  nervous: { eye: ["small", "small"], brow: [-3, 2], mouth: "wave" },
  shock: { eye: ["shock", "shock"], brow: [-7, -6], mouth: "O" },
  relief: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "smileWide" },
  relief_open: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "grin" },
  dazed: { eye: ["spiral", "spiral"], brow: [-3, 2], mouth: "wave" },
  pained: { eye: ["squeeze", "lid"], brow: [-3, 2], mouth: "teeth" },
  smile: { eye: ["dot", "dot"], brow: [0, -1], mouth: "smirk" },
  smile_closed: { eye: ["happy", "happy"], brow: [0, -1], mouth: "smile" },
  lick: { eye: ["dot", "dot"], brow: [0, -1], mouth: "lick" },
  creepy: { eye: ["dot", "dot"], brow: [5, -3], mouth: "creep" },
  terror: { eye: ["shock", "shock"], brow: [-8, -4], mouth: "O" },
  asleep: { eye: ["dash", "dash"], brow: [0, 0], mouth: "dash" },
  worried: { eye: ["small", "small"], brow: [-4, 2], mouth: "frown" },
};
const halfLid = (k: EyeK): EyeK => (k === "dot" || k === "small" ? "lid" : k === "lid" ? "slit" : k === "shock" ? "shockHalf" : k);
const eyeKind = (k: EyeK, lid: number): EyeK =>
  lid >= 1 && k !== "happy" && k !== "squeeze" && k !== "spiral" ? "dash" : lid > 0 ? halfLid(k) : k;
const lidOf = (b: boolean | number | undefined) => (b === true ? 1 : Number(b) || 0);

const eye = (p: Pen, kind: EyeK, x: number, ey: number, u: number, side: number, look: number, skin: string) => {
  const lx = x + look * 3 * u, lw = 3.8 * u;
  switch (kind) {
    case "dot": p.ell(lx, ey, 3.8 * u, 5.5 * u, INK, 0); break;
    case "small": p.ell(lx, ey, 3 * u, 4.4 * u, INK, 0); break;
    case "lid": p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey - u], [x + 9 * u, ey - u]], lw); break;
    case "slit": p.ell(lx, ey, 7 * u, 2.6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey], [x + 9 * u, ey]], lw); break;
    case "happy": p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw); break;
    case "dash": p.stroke([[x - 8.5 * u, ey], [x + 8.5 * u, ey]], lw); break;
    case "squeeze": p.stroke([[x + 6 * u * side, ey - 5 * u], [x - 6 * u * side, ey], [x + 6 * u * side, ey + 5 * u]], lw); break;
    case "shock": case "shockHalf":
      p.ell(x, ey, 11 * u, 11 * u, WHITE, 2.6 * u); p.dot(lx - side * 1.5 * u, ey + 1.5 * u, 3 * u);
      if (kind === "shockHalf") { p.ell(x, ey, 11 * u, 11 * u, skin, 0, 180, 360); p.stroke([[x - 11 * u, ey], [x + 11 * u, ey]], 2.6 * u); }
      break;
    case "sparkle": // big shiny eyes: ink oval, two white catchlights
      p.ell(lx, ey, 7 * u, 8.5 * u, INK, 0);
      p.ell(lx + 2.6 * u, ey - 3 * u, 2.7 * u, 2.9 * u, WHITE, 0);
      p.dot(lx - 2.6 * u, ey + 3.4 * u, 1.3 * u, WHITE);
      break;
    default: {
      const s: P2[] = [];
      for (let t = 1; t < 15; t++) s.push([x + Math.cos(t * 0.9) * t * 0.55 * u, ey + Math.sin(t * 0.9) * t * 0.55 * u]);
      p.stroke(s, 2.4 * u);
    }
  }
};

/** open "D" mouth with a white teeth band (+ tongue) */
const dmouth = (p: Pen, mx: number, y: number, rx: number, ry: number, u: number, tongue = false) => {
  p.ell(mx, y, rx, ry, MOUTH, 0, 0, 180);
  p.clip([[mx - rx, y], [mx + rx, y], [mx + rx, y + 3 * u], [mx - rx, y + 3 * u]], () => p.ell(mx, y, rx, ry, WHITE, 0, 0, 180));
  if (tongue) p.ell(mx + 2 * u, y + 0.62 * ry, 0.4 * rx, 0.28 * ry, TONGUE, 0);
  p.ell(mx, y, rx, ry, null, 3 * u, 0, 180);
};

const mouth = (p: Pen, kind: MouthK, mx: number, my: number, u: number, k = 1) => {
  const mw = 4 * u;
  switch (kind) {
    case "dash": p.stroke([[mx - 5.5 * u * k, my], [mx + 5.5 * u * k, my - 0.8 * u]], mw); break;
    case "frown": p.arc(mx, my + 3 * u, 6.5 * u * k, 3.5 * u, 200, 340, mw); break;
    case "smirk": p.arc(mx + u, my - 3 * u, 7 * u * k, 4 * u, 10, 150, mw); break;
    case "smile": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); break;
    case "smileWide": p.arc(mx, my - 4 * u, 11 * u * k, 6 * u, 15, 165, mw); break;
    case "grin": dmouth(p, mx, my - u, 12 * u * k, 8 * u, u); break;
    case "laugh": dmouth(p, mx, my, 16 * u * k, 11 * u, u, true); break;
    case "o": p.ell(mx + 4 * u, my, 3.5 * u, 4 * u, MOUTH, 2.8 * u); break;
    case "O": p.ell(mx, my + 2 * u, 9 * u * k, 11 * u, MOUTH, 3.2 * u); break;
    case "wave": { const s: P2[] = []; for (let i = 0; i <= 12; i++) s.push([mx - 9 * u * k + i * 1.5 * u * k, my + 1.5 * u * Math.sin(i * 1.3)]); p.stroke(s, 3 * u); break; }
    case "teeth":
      p.poly([[mx - 12 * u * k, my - 4 * u], [mx + 12 * u * k, my - 4 * u], [mx + 11 * u * k, my + 4 * u], [mx - 11 * u * k, my + 4 * u]], WHITE, 3 * u);
      for (const j of [-1, 0, 1]) p.stroke([[mx + j * 6 * u * k, my - 4 * u], [mx + j * 6 * u * k, my + 4 * u]], 1.5 * u);
      break;
    case "lick": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); p.ell(mx + 6 * u * k, my + 3 * u, 3.6 * u, 4.6 * u, TONGUE, 2.4 * u); break;
    case "creep": { // too-wide grin: crescent of teeth from cheek to cheek
      const top: P2[] = [], bot: P2[] = [], n = 16, rx = 21 * u * k;
      for (let i = 0; i <= n; i++) { const t = i / n, sn = Math.sin(Math.PI * t); top.push([mx - rx + 2 * rx * t, my - 9 * u + 10 * u * sn ** 0.7 - 6 * u * (1 - sn)]); }
      for (let i = n; i >= 0; i--) { const t = i / n, sn = Math.sin(Math.PI * t); bot.push([mx - rx + 2 * rx * t, my - 9 * u + 17 * u * sn ** 0.8 - 6 * u * (1 - sn)]); }
      const pts = [...top, ...bot];
      p.poly(pts, WHITE, 0);
      p.clip(pts, () => { for (let j = -3; j <= 3; j++) p.stroke([[mx + j * 5.5 * u * k, my - 12 * u], [mx + j * 5.5 * u * k, my + 12 * u]], 1.4 * u); p.stroke([[mx - rx, my - 2 * u], [mx + rx, my - 2 * u]], 1.2 * u); });
      p.poly(pts, null, 3 * u);
      break;
    }
  }
};

/** face v2 (front / 3-4). u = 1 % of the head path width W. Eyes 26u apart on the centre line, brows 20u up, mouth 20u
 *  down, everything slid toward the facing side. No blush, no catchlights. */
/** talking mouth: a flat-topped open "D", 0 = barely open .. 1 = wide (tongue from 0.35, teeth band from 0.5) */
const talkMouth = (p: Pen, mx: number, my: number, u: number, k: number) => {
  const rx = (7 + 5 * k) * u, ry = (3 + 11 * k) * u, y = my - 3 * u;
  p.ell(mx, y, rx, ry, MOUTH, 0, 0, 180);
  if (k > 0.5) p.clip(ellPts(mx, y, rx, ry, 0, 180), () => p.poly([[mx - rx, y], [mx + rx, y], [mx + rx, y + 2.6 * u], [mx - rx, y + 2.6 * u]], WHITE, 0));
  if (k > 0.35) p.ell(mx + 1.5 * u, y + 0.68 * ry, 0.45 * rx, 0.26 * ry, TONGUE, 0);
  p.ell(mx, y, rx, ry, null, 3 * u, 0, 180);
};

type FaceFx = { eyeDy?: number; sparkle?: boolean; mouthOpen?: number; scale?: number };
const faceFront = (p: Pen, cx: number, cy: number, W: number, expr: Expr, facing: number, look: number, lid: number, brim: boolean,
  skin: string, moustache?: string, stout = false, fxo: FaceFx = {}) => {
  const u = (W / 100) * (fxo.scale ?? 1), F = FACE[expr], fx = cx + 7 * u * facing;
  const ex = (F.eye[0] === "shock" ? 12 : 13) * u, ey = cy + (fxo.eyeDy ?? 0) * u;
  for (const side of [-1, 1]) {
    const x = fx + side * ex;
    const kind = fxo.sparkle ? "sparkle" : eyeKind(F.eye[(facing ? side === facing : side > 0) ? 1 : 0], lid);
    eye(p, kind, x, ey, u, side, look, skin);
    const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;
    if (kind === "shock" || kind === "shockHalf") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [x - side * 8.5 * u, by + dI * u], [x + side * 8.5 * u, by + dO * u], 5 * u, 2.5 * u);
  }
  const mx = cx + 8 * u * facing, my = cy + 20 * u;
  if (fxo.mouthOpen !== undefined && fxo.mouthOpen > 0.04) talkMouth(p, mx, my, u, clamp(fxo.mouthOpen, 0, 1));
  else mouth(p, F.mouth, mx, my, u);
  if (moustache) for (const s of [-1, 1])
    taper(p, [mx + s * 1.5 * u, cy + 12.5 * u], [mx + s * (stout ? 19 : 15) * u, cy + (stout ? 10.5 : 15) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
  if (expr === "nervous") p.ell(cx + 40 * u * (facing || 1), cy - 22 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};

/** profile face (facing screen-right): one eye, brow, nose tick, mouth near the front edge; no skin bump nose, no ear */
const faceSide = (p: Pen, hx: number, hy: number, W: number, expr: Expr, lid: number, brim: boolean, skin: string, moustache?: string, stout = false) => {
  const u = W / 100, F = FACE[expr], ex = hx + 27 * u, ey = hy;
  const kind = eyeKind(F.eye[1], lid);
  eye(p, kind, ex, ey, u, 1, 0.6, skin);
  const by = ey - (brim ? 17 : 20) * u, [dI, dO] = F.brow;
  if (kind === "shock" || kind === "shockHalf") p.arc(ex, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
  else taper(p, [ex + 8 * u, by + dI * u], [ex - 7 * u, by - u + dO * u], 5 * u, 2.5 * u);
  p.stroke([[hx + 44 * u, hy + 4 * u], [hx + 47.5 * u, hy + 9 * u], [hx + 43 * u, hy + 10 * u]], 3 * u);
  mouth(p, F.mouth, hx + 33 * u, hy + 21 * u, u, 0.62);
  if (moustache) taper(p, [hx + 41 * u, hy + 13.5 * u], [hx + 25 * u, hy + (stout ? 11.5 : 16) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
  if (expr === "nervous") p.ell(hx - 30 * u, hy - 24 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};

// ---------------- hats ----------------
const BONNET = "#e9cf8f", BONNET_BRIM = "#d6b46a";
/** parts of a hat that sit behind the head (bonnet) */
const hatBehind = (p: Pen, o: Outfit, H: Blob, cx: number, hc: number, light: number, thick: number, ow: number, side: boolean) => {
  if (o.hat === "longHair") return; // drawn behind the body by hairBack
  if (o.hat !== "bonnet") return;
  const bb = blobPts(cx - (side ? 12 : 0) * (H.a / 50), hc - 0.07 * 2 * H.b, { ...H, a: H.a * 1.17, b: H.b * 1.13, asym: 0, egg: 0.04, seed: H.seed + 3 });
  p.shadedFill(bb, BONNET, mul(BONNET, SH_CLOTH), light, H.a * 1.17);
  p.inkRing(bb, ow * 0.85, thick);
};

/** the back part of a woman's hair, drawn BEHIND the body: long / bob / ponytail / bun */
const hairBack = (p: Pen, o: Outfit, H: Blob, cx: number, hc: number, light: number, thick: number, ow: number) => {
  const hair = o.hair ?? "#1f1612", a = H.a, b = H.b, u = (2 * a) / 100, st = o.hairStyle ?? "long", hi = mul(hair, [1.8, 1.8, 1.8]);
  const cap: P2[] = [];
  for (let i = 0; i <= 18; i++) { const t = Math.PI + (Math.PI * i) / 18; cap.push([cx + Math.cos(t) * a * 1.1, hc - 0.05 * b + Math.sin(t) * b * 1.08]); }
  if (st === "long" || st === "bob") {
    const len = st === "long" ? 2.25 : 0.95, wide = st === "long" ? 1.24 : 1.2, pts = [...cap];
    pts.push([cx + a * 1.14, hc + 0.4 * b], [cx + a * wide, hc + (len - 0.4) * b]);
    for (let i = 0; i <= 8; i++) pts.push([cx + a * wide - (2 * wide * a * i) / 8, hc + len * b + (i % 2 ? 5 * u : 0)]);
    pts.push([cx - a * 1.14, hc + 0.4 * b]);
    p.shadedFill(pts, hair, mul(hair, SH_FELT), light, a * 1.2);
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) p.stroke([[cx + s * a * (1.02 + k * 0.08), hc + 0.3 * b], [cx + s * a * (1.1 + k * 0.06), hc + (len - 0.15) * b]], 1.3 * u, hi);
    p.poly(pts, null, ow * 0.85);
  } else if (st === "ponytail") {
    const tail: P2[] = [[cx + a * 0.55, hc - 0.7 * b], [cx + a * 1.35, hc - 0.4 * b], [cx + a * 1.55, hc + 0.5 * b], [cx + a * 1.35, hc + 1.5 * b], [cx + a * 1.12, hc + 0.6 * b], [cx + a * 0.9, hc - 0.2 * b]];
    p.shadedFill(tail, hair, mul(hair, SH_FELT), light, a); p.poly(tail, null, ow * 0.85);
    p.stroke([[cx + a * 1.3, hc - 0.2 * b], [cx + a * 1.38, hc + 1.1 * b]], 1.3 * u, hi);
  } else {
    p.ell(cx, hc - 1.05 * b, a * 0.55, b * 0.42, hair, ow * 0.85);
    p.stroke([[cx - a * 0.3, hc - 1.1 * b], [cx + a * 0.25, hc - 1.25 * b]], 1.3 * u, hi);
  }
  if (o.jewel) for (let k = 0; k < 7; k++) { const t = rad(200 + k * 14); p.ell(cx + Math.cos(t) * a * 1.08, hc + 0.35 * b + Math.sin(t) * b * 0.95, 4 * u, 4 * u, "#fbf8ee", 1.2 * u); }
  void thick;
};

const hatOn = (p: Pen, o: Outfit, hp: P2[], H: Blob, cx: number, hc: number, light: number, seed: number, facing: number, side: boolean) => {
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u;
  const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5)); // tilt with the head, +-2 deg extra
  const R = (pts: P2[]) => rotPts(pts, a, cx, hc);
  const sag = (yb: number, wb: number): P2[] => {
    const base: P2[] = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; base.push([cx + wb * (2 * t - 1), yb + 3 * u * (1 - (2 * t - 1) ** 2)]); }
    return base;
  };
  if (o.hat === "shako" || o.hat === "shako_tall") {
    const tall = o.hat === "shako_tall", yb = crown + 0.25 * HH, ht = (tall ? 0.66 : 0.56) * HH, wb = 46 * u, wt = 52 * u;
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, "#3a3d47", "#24262d", light, wt, 0.4);
    if (tall) p.clip(body, () => p.band(R([[cx - wt - 5 * u, yb - ht + 0.07 * HH], [cx + wt + 5 * u, yb - ht + 0.07 * HH]]), "#e8c45a", 0.06 * HH, 1.5 * u));
    p.poly(body, null, ow);
    const deg = (a * 180) / Math.PI;
    if (side) {
      p.poly(R([[cx + 36 * u, yb - 1 * u], [cx + 60 * u, yb + 8 * u], [cx + 34 * u, yb + 6 * u]]), "#16171b", 2.5 * u);
      const [tx, ty] = R([[cx + 24 * u, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
    } else {
      const [px, py] = R([[cx + 3 * u * facing, yb + 3 * u]])[0];
      p.ell(px, py, 34 * u, 0.045 * HH, "#16171b", 2.5 * u, 0, 180, deg); // peak
      const [bx, by] = R([[cx, yb - 0.45 * ht]])[0];
      p.ell(bx, by, 7 * u, 6 * u, tall ? "#e8c45a" : "#c9ccd2", 2 * u, 0, 360, deg); // badge plate
      p.arc(bx, by, 3.5 * u, 2.8 * u, 200, 500, 1.6 * u);
      const [tx, ty] = R([[cx, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u); // green tuft
    }
  } else if (o.hat === "helmetUS" || o.hat === "helmetDE") {
    // WWII helmets: US = round dome with a thin rim and net dots; DE = taller dome with flared skirt over the ears
    const de = o.hat === "helmetDE", col = o.cap ?? (de ? "#56605a" : "#5d6838"), rim = hc - 24 * u;
    const rx = 1.18 * H.a, ry = rim - (crown - 0.06 * HH);
    const dome: P2[] = [];
    for (let i = 0; i <= 24; i++) { const t = Math.PI + (Math.PI * i) / 24; dome.push([cx + rx * Math.cos(t), rim + ry * Math.sin(t)]); }
    const shape = de ? [[cx - rx - 4 * u, rim + 26 * u] as P2, ...dome, [cx + rx + 4 * u, rim + 26 * u] as P2, [cx + rx - 10 * u, rim + 6 * u] as P2, [cx - rx + 10 * u, rim + 6 * u] as P2]
      : [...dome, [cx + rx + 8 * u, rim + 4 * u] as P2, [cx - rx - 8 * u, rim + 4 * u] as P2];
    const body = R(shape);
    p.shadedFill(body, col, mul(col, SH_FELT), light, rx, 0.4);
    if (!de) p.clip(body, () => { for (let i = 0; i < 14; i++) p.dot(cx + (rnd(seed, 40 + i) - 0.5) * 1.8 * rx, rim - rnd(seed, 60 + i) * ry * 0.9, 1.6 * u, mul(col, [0.7, 0.7, 0.7])); });
    p.poly(body, null, ow);
    if (o.stars) for (const dx of [-14, 0, 14]) { // the fake general's stars
      const [sx, sy] = R([[cx + dx * u, rim - 0.45 * ry]])[0], pts: P2[] = [];
      for (let k = 0; k < 10; k++) { const r = k % 2 ? 3.2 * u : 8 * u, b = rad(k * 36 - 90); pts.push([sx + r * Math.cos(b), sy + r * Math.sin(b)]); }
      p.poly(pts, "#f4f4f0", 1.6 * u);
    }
  } else if (o.hat === "peaked") {
    // officer's peaked cap: wide flat crown, dark band, black visor, gold badge
    const col = o.cap ?? "#5d6838", yb = hc - 26 * u, wt = 1.25 * H.a, ht = 0.34 * HH;
    const top = R([[cx - 0.95 * H.a, yb], [cx - wt, yb - ht], [cx + wt, yb - ht], [cx + 0.95 * H.a, yb]]);
    p.shadedFill(top, col, mul(col, SH_FELT), light, wt, 0.4);
    p.poly(top, null, ow);
    p.poly(R([[cx - 0.95 * H.a, yb - 0.1 * HH], [cx + 0.95 * H.a, yb - 0.1 * HH], [cx + 0.95 * H.a, yb], [cx - 0.95 * H.a, yb]]), "#3a2a1c", ow * 0.7);
    const [px, py] = R([[cx + 3 * u * facing, yb + 2 * u]])[0];
    p.ell(px, py, 38 * u, 0.05 * HH, "#16171b", 2.5 * u, 0, 180, (a * 180) / Math.PI);
    const [bx, by] = R([[cx, yb - 0.55 * ht]])[0];
    p.ell(bx, by, 9 * u, 7 * u, "#e8c45a", 2 * u, 0, 360, (a * 180) / Math.PI);
  } else if (o.hat === "crown") {
    // golden mukut over the hair: band, tall pointed crown, jewels
    hatOn(p, { ...o, hat: "hair" }, hp, H, cx, hc, light, seed, facing, side);
    const gold = "#e8b84a", yb = crown + 0.2 * HH, wb = 0.92 * H.a;
    const shape = R([[cx - wb, yb], [cx - wb * 0.95, yb - 0.14 * HH], [cx - wb * 0.62, yb - 0.5 * HH], [cx - wb * 0.28, yb - 0.42 * HH], [cx, yb - 0.92 * HH],
      [cx + wb * 0.28, yb - 0.42 * HH], [cx + wb * 0.62, yb - 0.5 * HH], [cx + wb * 0.95, yb - 0.14 * HH], [cx + wb, yb]]);
    p.shadedFill(shape, gold, mul(gold, SH_FELT), light, wb, 0.4);
    p.poly(shape, null, ow);
    p.poly(R([[cx - wb, yb], [cx + wb, yb], [cx + wb, yb - 0.1 * HH], [cx - wb, yb - 0.1 * HH]]), "#d39a2e", ow * 0.7);
    const [jx, jy] = R([[cx, yb - 0.3 * HH]])[0];
    p.ell(jx, jy, 7 * u, 9 * u, "#d1202f", 2 * u);
    for (const dx of [-0.55, 0.55]) { const [qx, qy] = R([[cx + dx * wb, yb - 0.22 * HH]])[0]; p.ell(qx, qy, 4.5 * u, 4.5 * u, "#2e9a5a", 1.6 * u); }
    const [tx, ty] = R([[cx, yb - 0.94 * HH]])[0];
    p.ell(tx, ty, 5 * u, 5 * u, "#fff3b0", 1.6 * u);
  } else if (o.hat === "crownEU") {
    hatOn(p, { ...o, hat: "hair" }, hp, H, cx, hc, light, seed, facing, side);
    const gold = "#f2c14e", yb = crown + 0.22 * HH, wb = 0.9 * H.a, top = yb - 0.42 * HH;
    const pts: P2[] = [[cx - wb, yb]];
    for (let k = 0; k <= 4; k++) { const x = cx - wb + (2 * wb * k) / 4; pts.push([x, top - (k % 2 ? 0 : 0.12 * HH)], [x + (k < 4 ? wb / 4 : 0), yb - 0.18 * HH]); }
    pts.pop(); pts.push([cx + wb, yb]);
    const body = R(pts);
    p.shadedFill(body, gold, mul(gold, SH_FELT), light, wb, 0.4);
    p.poly(body, null, ow);
    p.poly(R([[cx - wb, yb], [cx + wb, yb], [cx + wb, yb - 0.1 * HH], [cx - wb, yb - 0.1 * HH]]), "#c9962e", ow * 0.7);
    for (const [dx, col] of [[-0.5, "#2e9a5a"], [0, "#d1202f"], [0.5, "#3f6fd0"]] as const) { const [jx, jy] = R([[cx + dx * wb, yb - 0.05 * HH]])[0]; p.ell(jx, jy, 5 * u, 5 * u, col, 1.6 * u); }
    for (let k = 0; k <= 4; k += 2) { const [bx, by] = R([[cx - wb + (2 * wb * k) / 4, top - 0.14 * HH]])[0]; p.ell(bx, by, 5 * u, 5 * u, "#fff3b0", 1.4 * u); }
  } else if (o.hat === "helmK") {
    // medieval helmet: steel dome, brow band, nose guard, optional plume (o.cap = plume colour)
    const steel = "#a9b1ba", rim = hc - 14 * u, rx = 1.12 * H.a, ry = rim - (crown - 0.08 * HH);
    const dome: P2[] = [];
    for (let i = 0; i <= 24; i++) { const t = Math.PI + (Math.PI * i) / 24; dome.push([cx + rx * Math.cos(t), rim + ry * Math.sin(t)]); }
    const body = R([...dome, [cx + rx, rim + 26 * u], [cx + rx - 12 * u, rim + 30 * u], [cx + rx - 14 * u, rim + 4 * u], [cx - rx + 14 * u, rim + 4 * u], [cx - rx + 12 * u, rim + 30 * u], [cx - rx, rim + 26 * u]]);
    p.shadedFill(body, steel, mul(steel, SH_FELT), light, rx, 0.4);
    p.poly(body, null, ow);
    p.poly(R([[cx - rx, rim - 2 * u], [cx + rx, rim - 2 * u], [cx + rx, rim + 6 * u], [cx - rx, rim + 6 * u]]), "#7d858e", ow * 0.6);
    p.poly(R([[cx - 4 * u, rim + 4 * u], [cx + 4 * u, rim + 4 * u], [cx + 3 * u, rim + 30 * u], [cx - 3 * u, rim + 30 * u]]), "#8d959e", ow * 0.5);
    if (o.cap) { const pl = R([[cx - 6 * u, rim - ry], [cx + 6 * u, rim - ry], [cx + 24 * u, rim - ry - 46 * u], [cx + 4 * u, rim - ry - 30 * u], [cx - 14 * u, rim - ry - 40 * u]]); p.shadedFill(pl, o.cap, mul(o.cap, SH_FELT), light, 20 * u, 0.4); p.poly(pl, null, ow * 0.7); }
  } else if (o.hat === "turban") {
    // pagdi: a wrapped dome with fold lines and a small jewel plume
    const col = o.cap ?? "#d9573a", yb = hc - 18 * u, rx = 1.2 * H.a, ry = yb - (crown - 0.18 * HH);
    const dome: P2[] = [];
    for (let i = 0; i <= 24; i++) { const t = Math.PI + (Math.PI * i) / 24; dome.push([cx + rx * Math.cos(t), yb + ry * Math.sin(t)]); }
    const body = R([...dome, [cx + rx - 4 * u, yb + 6 * u], [cx - rx + 4 * u, yb + 6 * u]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, rx, 0.4);
    p.clip(body, () => { for (let k = -2; k <= 2; k++) p.stroke([[cx - rx, yb - (0.25 + 0.15 * k) * ry], [cx + rx, yb - (0.6 + 0.15 * k) * ry]], 2 * u, mul(col, [0.7, 0.7, 0.7])); });
    p.poly(body, null, ow);
    const [jx, jy] = R([[cx, yb - 0.55 * ry]])[0];
    p.ell(jx, jy, 6 * u, 6 * u, "#f4d35e", 1.8 * u);
    p.stroke(R([[cx, yb - 0.6 * ry], [cx + 10 * u, yb - 1.25 * ry]]), 4 * u, "#f4f1e8");
  } else if (o.hat === "fedora") {
    const col = o.cap ?? "#5a4a3a", yb = hc - 30 * u, ht = 0.32 * HH, wt = 0.95 * H.a;
    const crownP = R([[cx - wt, yb], [cx - wt * 0.88, yb - ht], [cx, yb - ht + 8 * u], [cx + wt * 0.88, yb - ht], [cx + wt, yb]]);
    p.shadedFill(crownP, col, mul(col, SH_FELT), light, wt, 0.4);
    p.clip(crownP, () => p.band(R([[cx - wt - 4 * u, yb - 8 * u], [cx + wt + 4 * u, yb - 8 * u]]), "#2a211a", 12 * u, 0.8 * u));
    p.poly(crownP, null, ow);
    const [bx, by] = R([[cx, yb + 2 * u]])[0];
    p.ell(bx, by, 1.6 * H.a, 0.06 * HH, col, ow, 0, 360, (a * 180) / Math.PI);
  } else if (o.hat === "cap" || o.hat === "hair") {
    const cut = crown + (o.hat === "cap" ? 0.3 : 0.42) * HH;
    const keep = (x: number, y: number) => y < cut || (side && o.hat === "hair" && x < cx - 6 * u && y < hc + 0.42 * H.b);
    // start the arc at the first kept point after a dropped one, so the kept run is contiguous and the cut closes it
    const n = hp.length, startIdx = Math.max(0, hp.findIndex(([x, y], i) => keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
    const arc = [...hp.slice(startIdx), ...hp.slice(0, startIdx)].filter(([x, y]) => keep(x, y))
      .map(([x, y]) => [cx + (x - cx) * 1.03, hc + (y - hc) * 1.03] as P2);
    if (arc.length < 3) return;
    if (o.hat === "hair") { // scalloped lower edge
      const [x0, y0] = arc[arc.length - 1], [x1, y1] = arc[0];
      for (let i = 1; i < 6; i++) arc.push([x0 + ((x1 - x0) * i) / 6, y0 + ((y1 - y0) * i) / 6 + (i % 2 ? 4 * u : 0)]);
    }
    const col = o.hat === "cap" ? o.cap! : o.hair!;
    p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35);
    p.poly(arc, null, ow);
    if (o.hat === "hair") {
      const s = side ? -1 : facing || 1;
      p.stroke([[cx + s * 10 * u, cut - 30 * u], [cx + s * 2 * u, cut - 12 * u]], 1.2 * u);
    }
    if (o.hat === "cap") {
      const deg = (a * 180) / Math.PI;
      if (side) p.poly(R([[cx + 40 * u, cut - 2 * u], [cx + 74 * u, cut + 4 * u], [cx + 40 * u, cut + 6 * u]]), shade(col, 0.8), ow);
      else {
        const s = facing || (rnd(seed, 21) < 0.5 ? -1 : 1), [px, py] = R([[cx + s * 4 * u, cut + 1.5 * u]])[0];
        p.ell(px, py, 32 * u, 0.06 * HH, shade(col, 0.8), ow, 0, 180, deg);
      }
    }
  } else if (o.hat === "tophat") {
    const yb = crown + 0.22 * HH, ht = 0.8 * HH, wb = 0.31 * W, wt = 0.33 * W, col = "#2e2a36";
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
    p.clip(body, () => p.band(R([[cx - wt - 4 * u, yb - 0.13 * HH], [cx + wt + 4 * u, yb - 0.13 * HH]]), shade(o.jacket, 0.9), 0.14 * HH, 0.8 * u));
    p.poly(body, null, ow);
    const [bx, by] = R([[cx, yb + 1 * u]])[0];
    p.ell(bx, by, 0.45 * W, 0.05 * HH, "#1d1b22", ow, 0, 360, (a * 180) / Math.PI);
  } else if (o.hat === "bonnet") {
    const [bx, by] = R([[cx + (side ? 6 * u : 0), crown + 0.16 * HH]])[0];
    p.arc(bx, by, 0.5 * W, 0.2 * HH, 200, 340, 7 * u, BONNET_BRIM);
    p.arc(bx, by, 0.5 * W + 3.5 * u, 0.2 * HH + 3.5 * u, 200, 340, 1.2 * u);
    const cy = hc + H.b * 0.98;
    p.stroke([[cx - 14 * u, cy - 4 * u], [cx, cy + 2 * u], [cx + 14 * u, cy - 4 * u]], 2 * u, BONNET_BRIM);
  }
};

// ---------------- bodies ----------------
export type Arms = [P2[], P2[]];
/** held prop; for the hammer the number is the strike 0 (raised) .. 1 (struck) */
export type Prop = null | "icecream" | "shako" | ["hammer", number] | "phoneEar" | "phoneHold" | "phoneDrop" | "binoculars" | "earCup" | "point" | "bow" | "bowAim" | "diya" | "sparkler" | "spear" | "spearAim" | "spearUp" | "newspaper" | "suitcase" | "cash" | "letter" | "twoFingers" | "moneyCase" | "axe"
  /** shovel: 0 = blade pushed into the ground .. 1 = lifted with a clod of earth; drum (dhol at the waist): beat 0 = right
   *  stick up / left stick on the skin .. 1 = right stick on the skin / left stick up */
  | ["shovel", number] | ["drum", number]
  | "phone" | "cup" | "juice" | "plate" | "book" | "lantern" | "broom" | "rope" | "flag" | "torch" | "basket" | "pot" | "umbrella"
  | "stick" | "cane" | "bag" | "garland" | "candle";
export type Mode = "march" | "stroll" | "stand" | "sit" | "fall" | "sitFeetUp" | "lie" | "kneel" | "lean" | "run" | "jump" | "sitFloor";
const isTool = (prop: Prop, name: string): prop is [any, number] => Array.isArray(prop) && prop[0] === name;
const propName = (prop: Prop): string => (Array.isArray(prop) ? prop[0] : prop ?? "");
const NEW_PROPS = new Set(["shovel", "drum", "phone", "cup", "juice", "plate", "book", "lantern", "broom", "rope", "flag", "torch", "basket", "pot",
  "umbrella", "stick", "cane", "bag", "garland", "candle"]);

const BUILD: Record<Build, { a: number; torso: number; legs: number; tw: number }> = {
  adult: { a: 118, torso: 1.1, legs: 1.4, tw: 0.8 },
  stout: { a: 118, torso: 1.15, legs: 1.32, tw: 0.92 },
  kid: { a: 112, torso: 0.85, legs: 1.0, tw: 0.72 },
};

export type FrontOpts = {
  /** sitFeetUp: leaning back on a chair, legs raised toward the viewer, big soles (feet on a desk); lie: lying flat, card
   *  drawn horizontally at 0.7 scale with the head on the left, resting on the sole line (coffins, beds); kneel: on both
   *  knees; lean: upper body tilted (tilt, default 16 deg) with forearms resting forward (window sill); run: fast stride,
   *  arms pumping (phase); jump: airborne, arms up in a V, knees tucked; sitFloor: cross-legged on the ground */
  phase?: number; expr?: Expr; mode?: Mode; look?: number; blink?: boolean | number; lift?: number;
  prop?: Prop; tilt?: number; headTilt?: number; wave?: number;
  /** colour of flag / umbrella / bag / book cover / pot / basket (each has its own default) */
  propColor?: string;
  // ---- face / emotion FX ----
  /** sweat drops 0..1 (1-3 drops) */ sweat?: number;
  /** anger steam puffs from the head sides 0..1 */ steam?: number;
  /** anger tint 0..1: purple rising from the chin (1 = whole head) */ angry?: number;
  /** pink cheeks 0..1 */ blush?: number;
  /** sleeping Z's; a number 0..1 drifts them upward (animate it) */ zzz?: boolean | number;
  /** tear streams 0..1 (length) */ tears?: number;
  /** big shiny eyes + sparkles */ sparkleEyes?: boolean;
  /** "?" above the head */ question?: boolean;
  /** "!" above the head */ exclaim?: boolean;
  /** talking mouth override 0..1 (<= 0.04 falls back to the expression's mouth) */ mouthOpen?: number;
  /** seen from behind: no face, hair over the head */
  back?: boolean; /** phone screen glow 0..1 */ glow?: number;
  /** canvas angle the key light comes FROM (painted crescent + thick outline side) */
  light?: number; facing?: -1 | 0 | 1; seed?: number;
};

const footStroke = (p: Pen, a: P2, b: P2, w: number, col: string) => {
  if (col !== INK) p.stroke([a, b], w + 3, INK);
  p.stroke([a, b], w, col);
};

/** where the head ended up, in final canvas units (for placing speech bubbles / extra FX): centre and half-width */
export type FrontInfo = { head: P2; r: number };
let NO_FLOAT = false; // set while lie() draws the inner upright figure; floating FX are drawn by the outer call

/** big shoe seen sole-on (toe up, heel toward the ground): feet raised toward the viewer */
const soleShoe = (p: Pen, x: number, y: number, side: number, u: number, col: string, ow: number) => {
  const dark = col === INK ? "#3a2c3c" : shade(col, 0.62), rot = side * 8;
  p.ell(x, y, 17 * u, 26 * u, dark, ow * 0.75, 0, 360, rot); // sole
  p.ell(x - side * 0.6 * u, y - 4 * u, 13 * u, 18 * u, col === INK ? "#4a3a4c" : col, 0, 0, 360, rot); // tread face
  p.clip(ellPts(x, y, 17 * u, 26 * u, 0, 360, rot), () => {
    p.stroke([[x - 17 * u, y + 13 * u + side * 2 * u], [x + 17 * u, y + 13 * u - side * 2 * u]], 2.2 * u, INK); // heel break
    for (let k = 0; k < 3; k++) p.stroke([[x - 7 * u, y - 14 * u + k * 7 * u], [x + 7 * u, y - 14 * u + k * 7 * u]], 1.5 * u, dark);
  });
};

/** ink-rimmed thick stroke with a chosen rim (lighter than Pen.line, for small marks) */
const inked = (p: Pen, pts: P2[], w: number, col: string, rim: number) => { p.stroke(pts, w + 2 * rim, INK); p.stroke(pts, w, col); };

/** tear / sweat drop, round end at (x, y), point up */
const drop = (p: Pen, x: number, y: number, s: number, col: string, rim: number, ang = 0) => {
  const pts: P2[] = [[x, y - 2.1 * s]];
  for (let i = 0; i <= 16; i++) { const a = rad(-35 + (250 * i) / 16); pts.push([x + s * Math.cos(a), y + s * Math.sin(a)]); }
  const rp = rotPts(pts, rad(ang), x, y);
  p.poly(rp, col, rim);
  p.ell(x - 0.35 * s, y - 0.1 * s, 0.22 * s, 0.38 * s, "rgba(255,255,255,0.85)", 0);
};

/** cartoon cloud puff (outline only around the union of its circles) */
const puff = (p: Pen, x: number, y: number, R: number, col: string, rim: number) => {
  const c: [number, number, number][] = [[0, 0, 1], [-0.72, 0.28, 0.7], [0.72, 0.22, 0.74], [0.05, -0.5, 0.72]];
  for (const [dx, dy, k] of c) p.ell(x + dx * R, y + dy * R, k * R + rim, k * R + rim, INK, 0);
  for (const [dx, dy, k] of c) p.ell(x + dx * R, y + dy * R, k * R, k * R, col, 0);
  p.ell(x - 0.25 * R, y - 0.3 * R, 0.3 * R, 0.22 * R, "#ffffff", 0);
};

const star4 = (p: Pen, x: number, y: number, s: number, col: string, rim: number) => {
  const pts: P2[] = [];
  for (let k = 0; k < 8; k++) { const r = k % 2 ? 0.28 * s : s, a = rad(k * 45 - 90); pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]); }
  p.poly(pts, col, rim);
};

/** floating FX around a head (upright, final canvas units): steam, sweat, Z's, ?, !, sparkles. `top` = how far above the
 *  head centre the head-gear reaches (in head half-widths), so "?" / "!" clear tall hats. */
const floaters = (p: Pen, c: P2, r: number, o: FrontOpts, top = 1) => {
  p.rot = null;
  const u = r / 50, [x, y] = c, rim = 1.8 * u;
  const steam = clamp(o.steam ?? 0, 0, 1), sweat = clamp(o.sweat ?? 0, 0, 1);
  if (steam > 0) for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const R = (15 - 3 * i) * u * (0.45 + 0.55 * steam);
    puff(p, x + side * (1.02 + 0.2 * i) * r, y - (0.15 + 0.42 * i) * r - 0.2 * r * steam, R, i ? "#e9e7ee" : "#f6f5fa", rim);
  }
  if (sweat > 0) {
    const spots: [number, number, number][] = [[0.95, -0.55, 18], [-1.0, -0.38, -18], [1.1, -0.08, 26]];
    for (let i = 0; i < Math.ceil(sweat * 3 - 1e-6); i++) { const [dx, dy, a] = spots[i]; drop(p, x + dx * r, y + dy * r, (5.5 + 2 * sweat) * u, "#9fd8ff", rim, a); }
  }
  if (o.zzz) {
    const t = typeof o.zzz === "number" ? ((o.zzz % 1) + 1) % 1 : 0;
    for (let i = 0; i < 3; i++) {
      const s = (11 + 4 * i) * u, k = i + t, zx = x + (0.85 + 0.34 * k) * r, zy = y - (0.7 + 0.45 * k) * r;
      inked(p, [[zx - s / 2, zy - s / 2], [zx + s / 2, zy - s / 2], [zx - s / 2, zy + s / 2], [zx + s / 2, zy + s / 2]], 0.24 * s, "#ffffff", 1.6 * u);
    }
  }
  const S = 0.85 * r, want = y - (1.6 + Math.max(0, top - 1)) * r, qy = Math.max(want, 0.5 * S + 6), qx = x + (qy > want + 1 ? 1.25 * r : 0);
  const both = !!o.question && !!o.exclaim;
  if (o.question) {
    const cx = qx + (both ? -0.28 : 0.1) * r, cy = qy, hook: P2[] = [];
    for (let i = 0; i <= 14; i++) { const a = rad(195 + (215 * i) / 14); hook.push([cx + 0.2 * S * Math.cos(a), cy - 0.2 * S + 0.2 * S * Math.sin(a)]); }
    hook.push([cx, cy + 0.08 * S], [cx, cy + 0.17 * S]);
    inked(p, hook, 0.12 * S, "#ffd84a", 2 * u);
    p.ell(cx, cy + 0.38 * S, 0.085 * S + 2 * u, 0.085 * S + 2 * u, INK, 0); p.ell(cx, cy + 0.38 * S, 0.085 * S, 0.085 * S, "#ffd84a", 0);
  }
  if (o.exclaim) {
    const cx = qx + (both ? 0.3 : 0.1) * r, cy = qy;
    p.poly([[cx - 0.09 * S, cy - 0.42 * S], [cx + 0.09 * S, cy - 0.42 * S], [cx + 0.045 * S, cy + 0.18 * S], [cx - 0.045 * S, cy + 0.18 * S]], "#ff4b3a", 2 * u);
    p.ell(cx, cy + 0.38 * S, 0.085 * S, 0.085 * S, "#ff4b3a", 2 * u);
  }
  if (o.sparkleEyes) for (const [dx, dy, s] of [[-1.12, -0.7, 11], [1.15, -0.85, 13], [1.0, -1.25, 7]] as const) star4(p, x + dx * r, y + dy * r, s * u, "#fff3a0", 1.4 * u);
};

/** lying flat: the upright figure drawn into a rotated, scaled frame (head on the left), resting on the sole line */
const lieFront = (p: Pen, o: Outfit, opts: FrontOpts): FrontInfo => {
  const g = p.g, k = 0.7, Y0 = 588, Xc = 300, Yc = 975 - 92;
  g.save(); g.translate(Xc, Yc); g.rotate(-Math.PI / 2); g.scale(k, k); g.translate(-300, -Y0);
  NO_FLOAT = true;
  let inner: FrontInfo;
  try { inner = bodyFront(p, o, { ...opts, mode: "stand" }); } finally { NO_FLOAT = false; g.restore(); }
  const [x, y] = inner.head, head: P2 = [Xc + k * (y - Y0), Yc - k * (x - 300)];
  floaters(p, head, inner.r * k, opts);
  return { head, r: inner.r * k };
};

export const bodyFront = (p: Pen, o: Outfit, opts: FrontOpts): FrontInfo => {
  if (opts.mode === "lie") return lieFront(p, o, opts);
  const { phase = 0, expr = "neutral", mode = "march", look = 0, blink = false, lift = 60, prop = null, headTilt = 0, wave,
    light = DEF_LIGHT, facing = 0, seed = 1, back = false, glow = 0 } = opts;
  const tilt = opts.tilt ?? (mode === "lean" ? 16 : prop === "rope" ? 10 : 0);
  const refHead = o.headStyle === "ref";
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? (refHead ? REF_SKIN : SKIN), two = Math.PI * 2, lid = lidOf(blink);
  const skinSh = refHead ? mix(skin, "#a9a3b4", 0.42) : mul(skin, SH_SKIN);
  const H = headBlob(seed, Bd.a, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const tall = (1 + Bd.torso + Bd.legs) * HH, sole = 975;
  // body bob 5 % (march) / 3 % (stroll) of the height, lowest at contact (phase 0 and 0.5)
  const bob = mode === "march" ? 0.025 * tall * Math.cos(2 * two * phase) : mode === "stroll" ? 0.015 * tall * Math.cos(2 * two * phase)
    : mode === "run" ? 0.02 * tall * Math.cos(2 * two * phase) : 0;
  const torsoBot = mode === "sit" ? sole - 0.2 * HH : mode === "sitFeetUp" ? sole - 0.62 * HH : mode === "sitFloor" ? sole - 0.14 * HH
    : mode === "kneel" ? sole - 0.6 * HH : mode === "jump" ? sole - Bd.legs * HH - 0.3 * HH : mode === "run" ? sole - 0.94 * Bd.legs * HH + bob
    : sole - Bd.legs * HH + bob;
  const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u;
  const legCol = mix(o.pants, INK, 0.55), armCol = mix(o.jacket, INK, 0.5), footCol = o.boots;
  const legW = 5.8 * u, footW = 7.5 * u;
  const dressed = !!o.dress;
  /** legs that sit in front of the torso (raised / crossed), drawn after it */
  const frontLegs: (() => void)[] = [];
  // ---- legs + feet (not rotated) ----
  p.rot = null;
  if (mode === "sitFeetUp") {
    frontLegs.push(() => {
      for (const side of [-1, 1]) {
        const h: P2 = [300 + side * 16 * u, torsoBot - 0.1 * HH], k: P2 = [300 + side * 30 * u, torsoBot + 0.08 * HH], a: P2 = [300 + side * 36 * u, sole - 0.36 * HH];
        p.stroke(curve(h, k, a), legW * 1.1, legCol);
        soleShoe(p, 300 + side * 38 * u, sole - 0.2 * HH, side, u, footCol, ow);
      }
    });
  } else if (mode === "sitFloor") {
    // thighs out to the knees behind the torso; shins cross in front (right shin on top), feet tucked under
    const lw = legW * 1.25, kY = sole - 0.26 * HH;
    for (const side of [-1, 1]) p.stroke([[300 + side * 16 * u, hipY], [300 + side * 62 * u, kY]], lw, legCol);
    frontLegs.push(() => {
      for (const side of [1, -1]) { // shin from the knee down across to the opposite side, foot tucked under the other knee
        const k: P2 = [300 + side * 62 * u, kY], an: P2 = [300 - side * 40 * u, sole - 0.07 * HH];
        if (!dressed) { p.stroke([[300 + side * 30 * u, sole - 0.2 * HH], k], lw, legCol); p.stroke([k, an], lw, legCol); p.ell(k[0], k[1], 0.5 * lw, 0.5 * lw, legCol, 0); }
        footStroke(p, an, [an[0] - side * 14 * u, an[1] + 1 * u], footW, footCol);
      }
    });
  } else if (mode === "kneel") {
    // both knees on the ground; the shins run back and out behind them, soles of the feet showing at the sides
    for (const side of [-1, 1]) {
      const kn: P2 = [300 + side * 20 * u, sole - 7 * u], ft: P2 = [300 + side * 46 * u, sole - 17 * u];
      p.stroke([kn, ft], legW, mix(legCol, INK, 0.3));
      p.ell(ft[0] + side * 3 * u, ft[1] - 3 * u, 6.5 * u, 9 * u, footCol === INK ? "#3a2c3c" : shade(footCol, 0.75), 2 * u, 0, 360, side * -35);
      p.stroke([[300 + side * 15 * u, hipY], kn], legW, legCol);
      p.ell(kn[0], kn[1] + 1 * u, 6.5 * u, 4.5 * u, legCol, 0);
    }
  } else if (mode === "run") {
    for (const [side, ph] of [[-1, 0], [1, 0.5]] as const) {
      const c = Math.sin(two * (phase + ph)), up = Math.max(0, c), bk = Math.max(0, -c);
      const nk: P2 = [300 + side * 22 * u, hipY + 0.68 * HH], nf: P2 = [300 + side * 24 * u, sole - 4 * u];
      const kn = c >= 0 ? lerp2(nk, [300 + side * 36 * u, hipY + 0.1 * HH], up) : lerp2(nk, [300 + side * 24 * u, hipY + 0.6 * HH], bk);
      const f = c >= 0 ? lerp2(nf, [300 + side * 26 * u, hipY + 0.58 * HH], up) : lerp2(nf, [300 + side * 48 * u, hipY + 0.86 * HH], bk);
      p.stroke([[300 + side * 15 * u, hipY], kn, f], legW, c < 0 ? mix(legCol, INK, 0.25) : legCol);
      footStroke(p, [f[0] - side * 3 * u, f[1]], [f[0] + side * (13 - 6 * bk) * u, f[1] + (0.5 - 8 * bk) * u], footW, footCol);
    }
  } else if (mode === "jump") {
    for (const side of [-1, 1]) {
      const kn: P2 = [300 + side * 46 * u, hipY + 0.4 * HH], f: P2 = [300 + side * 30 * u, hipY + 0.78 * HH];
      p.stroke([[300 + side * 15 * u, hipY], kn, f], legW, legCol);
      footStroke(p, [f[0] + side * 2 * u, f[1]], [f[0] + side * 15 * u, f[1] + 4 * u], footW, footCol);
    }
  } else if (mode === "sit") {
    for (const side of [-1, 1]) {
      const h: P2 = [300 + side * 15 * u, hipY], k: P2 = [300 + side * 36 * u, hipY + 0.2 * HH], f: P2 = [300 + side * 44 * u, sole - 8 * u];
      p.stroke(curve(h, k, f), legW, legCol);
      footStroke(p, [f[0] - side * 2 * u, f[1]], [f[0] + side * 12 * u, f[1] - 5 * u], footW, footCol);
    }
  } else if (mode === "fall") {
    const legs: [P2, P2, P2][] = [
      [[300 - 15 * u, hipY], [300 - 46 * u, hipY + 0.5 * HH], [300 - 70 * u, hipY + 0.72 * HH]],
      [[300 + 15 * u, hipY], [300 + 50 * u, hipY + 0.45 * HH], [300 + 76 * u, hipY + 0.22 * HH]],
    ];
    legs.forEach(([h, k, f], i) => {
      p.stroke(curve(h, k, f), legW, legCol);
      footStroke(p, f, [f[0] + (i ? 14 : -14) * u, f[1] + (i ? -6 : 4) * u], footW, footCol);
    });
  } else if (o.dress) {
    for (const side of [-1, 1]) {
      const fx = 300 + side * 12 * u, fy = sole - 4 * u;
      p.stroke([[fx, sole - 0.4 * HH], [fx + side * u, fy]], legW, legCol);
      footStroke(p, [fx - side * 3 * u, fy], [fx + side * 12 * u, fy + u], footW, footCol);
    }
  } else {
    const L = mode === "march" ? lift * 1.25 : mode === "stroll" ? lift * 0.55 : 0;
    for (const [side, ph] of [[-1, 0], [1, 0.5]] as const) {
      const up = Math.max(0, Math.sin(two * (phase + ph))) * L;
      const hx = 300 + side * 15 * u, fx = 300 + side * (mode === "lean" ? 30 : 22) * u, fy = sole - 4 * u - up;
      const k: P2 = [(hx + fx) / 2 + side * (1.5 * u + up * 0.16), (hipY + fy) / 2 - up * 0.08];
      p.stroke(curve([hx, hipY], k, [fx, fy]), legW, legCol);
      footStroke(p, [fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u], footW, footCol);
    }
  }
  // ---- upper body: rotates about the hips (tilt + a small weight-shift sway on every step) ----
  const sway = mode === "march" ? 1.6 * Math.sin(two * phase) : mode === "stroll" ? 1.0 * Math.sin(two * phase) : mode === "run" ? 2.2 * Math.sin(two * phase) : 0;
  const A = tilt + sway;
  p.rot = A ? [rad(A), 300, hipY] : null;
  if (o.hat === "longHair" && !back) hairBack(p, o, H, 300, hc, light, thick, ow);
  const dress = dressed && mode !== "fall";
  const T: Blob = { a: ((Bd.tw / 2) * W) / 1.06, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: o.build === "stout" ? 0.17 : 0.12,
    asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const sh = (side: number): P2 => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const hang = (side: number, fwd: number): [P2, P2, P2] => {
    const S = sh(side), ex = tcx + side * (1.12 * T.a + 4 * u);
    const hx = ex + side * 3 * u - side * 6 * u * Math.max(0, fwd) + side * 4 * u * Math.max(0, -fwd);
    return [S, [ex, S[1] + 0.48 * HH], [hx, chin + 1.04 * HH - Math.abs(fwd) * 9 * u]];
  };
  const sw = mode === "march" || mode === "stroll" ? Math.sin(two * phase) : 0;
  // rifle at the order: butt by the right hip, held by the hanging right hand, muzzle past the crown
  const R0: P2 = [300 + 47 * u, torsoBot + 0.12 * HH], R1: P2 = [300 + 64 * u, crown - 0.32 * HH];
  const rifle = !!o.rifle && (mode === "march" || mode === "stand" || mode === "stroll");
  type Arm = { pts: [P2, P2, P2]; front: boolean };
  const arms: Arm[] = [];
  /** the free arm's pose in each mode (no prop in that hand) */
  const defArm = (side: number): Arm => {
    const S = sh(side);
    if (mode === "run") { // elbows bent ~90 deg, pumping against the legs: forward hand up by the chest, back hand low and out
      const f = side * Math.sin(two * phase), k = (f + 1) / 2;
      const E = lerp2([tcx + side * (1.15 * T.a + 22 * u), S[1] + 0.34 * HH], [tcx + side * (1.12 * T.a + 10 * u), S[1] + 0.4 * HH], k);
      const Hd = lerp2([tcx + side * (1.3 * T.a + 34 * u), S[1] + 0.62 * HH], [tcx + side * 0.15 * T.a, S[1] - 0.02 * HH], k);
      return { pts: [S, E, Hd], front: f > 0 };
    }
    if (mode === "jump") return { pts: [S, [tcx + side * (1.12 * T.a + 16 * u), S[1] - 0.24 * HH], [tcx + side * (1.25 * T.a + 34 * u), S[1] - 0.72 * HH]], front: false };
    if (mode === "lean") return { pts: [S, [tcx + side * (1.12 * T.a + 16 * u), S[1] + 0.4 * HH], [300 + side * 22 * u, S[1] + 0.5 * HH]], front: true };
    if (mode === "sitFeetUp") return { pts: [S, [tcx + side * (1.1 * T.a + 6 * u), S[1] + 0.44 * HH], [300 + side * 12 * u, torsoBot - 0.3 * HH]], front: true };
    if (mode === "sitFloor") return { pts: [S, [tcx + side * (1.1 * T.a + 10 * u), S[1] + 0.5 * HH], [300 + side * 60 * u, sole - 0.2 * HH]], front: true };
    return { pts: hang(side, side < 0 ? -sw : sw), front: false };
  };
  const pn = propName(prop), np = NEW_PROPS.has(pn);
  // ---- key points of the new props (shared by the arm poses and the drawing) ----
  const X = (dx: number) => 300 + dx * u, Y = (dy: number) => chin + dy * u, Sy = chin + 0.12 * HH;
  const ex = (side: number, dx: number) => tcx + side * (1.1 * T.a + dx * u);
  const kTool = Array.isArray(prop) ? clamp(prop[1], 0, 1) : 0;
  const shovelG = lerp2([X(-14), Y(44)], [X(-30), Y(70)], kTool), shovelB = lerp2([X(58), sole - 36 * u], [X(86), Y(6)], kTool);
  const drumC: P2 = [300, torsoBot - 0.16 * HH], drumL = 56 * u, drumR = 21 * u;
  const broomT: P2 = [X(26), Y(26)], broomB: P2 = [X(-40), sole - 30 * u];
  if (mode === "sit" && prop !== "newspaper" && prop !== "cash" && prop !== "letter" && !np) for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.1 * T.a + 6 * u), sh(side)[1] + 0.4 * HH], [tcx + side * (1.2 * T.a + 10 * u), torsoBot + 0.04 * HH]], front: false });
  else if (mode === "fall") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.15 * T.a + 12 * u), sh(side)[1] - 0.25 * HH], [tcx + side * (1.3 * T.a + 24 * u), sh(side)[1] - 0.68 * HH]], front: false });
  else {
    arms.push(prop === "shako" ? { pts: hang(-1, 0), front: false } : defArm(-1));
    if (rifle) {
      const G = lerp2(R0, R1, 0.1);
      arms.push({ pts: [sh(1), [tcx + 1.12 * T.a + 5 * u, sh(1)[1] + 0.45 * HH], G], front: false });
    } else if (wave !== undefined) {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.1 * T.a + 10 * u + 3 * u * wave, S[1] - 0.22 * HH], [tcx + 1.18 * T.a + 16 * u + 12 * u * wave, S[1] - 0.6 * HH]], front: false });
    } else if (prop === "phoneEar") {
      const S = sh(1), ear: P2 = [300 + 0.98 * H.a + 3 * u, chin - 0.95 * H.b];
      arms.push({ pts: [S, [tcx + 1.15 * T.a + 16 * u, S[1] + 0.18 * HH], ear], front: true });
    } else if (prop === "binoculars") {
      arms.length = 0;
      for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.1 * T.a + 8 * u), sh(side)[1] + 0.25 * HH], [300 + side * 24 * u, chin - 0.38 * HH]], front: true });
    } else if (prop === "bowAim") {
      arms.length = 0;
      const SL = sh(-1), SR = sh(1);
      arms.push({ pts: [SL, [tcx - 1.25 * T.a - 22 * u, SL[1] - 0.04 * HH], [tcx - 1.3 * T.a - 58 * u, SL[1] - 0.1 * HH]], front: true });
      arms.push({ pts: [SR, [tcx + 1.15 * T.a + 12 * u, SR[1] + 0.12 * HH], [300 + 0.55 * H.a, chin - 0.05 * HH]], front: true });
    } else if (prop === "diya") {
      arms.length = 0;
      for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.1 * T.a + 6 * u), sh(side)[1] + 0.4 * HH], [300 + side * 18 * u, chin + 0.62 * HH]], front: true });
    } else if (prop === "sparkler") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.15 * T.a + 14 * u, S[1] - 0.2 * HH], [tcx + 1.25 * T.a + 22 * u, S[1] - 0.68 * HH]], front: true });
    } else if (prop === "spearAim" || prop === "spearUp" || prop === "axe") {
      arms.length = 0;
      const up = prop === "spearAim" ? 0 : 1;
      for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.0 * T.a + 8 * u), sh(side)[1] + (0.25 - 0.2 * up) * HH], [tcx + side * 10 * u - 8 * u, sh(side)[1] + (0.32 - 0.38 * up) * HH + side * 6 * u]], front: true });
    } else if (prop === "newspaper" || prop === "moneyCase") {
      arms.length = 0;
      for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.15 * T.a + 8 * u), sh(side)[1] + 0.4 * HH], [300 + side * 52 * u, chin + 0.42 * HH]], front: true });
    } else if (prop === "suitcase") {
      arms.push({ pts: hang(1, 0), front: true });
    } else if (prop === "cash" || prop === "letter") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.1 * T.a + 10 * u, S[1] + 0.36 * HH], [tcx + 0.95 * T.a + 18 * u, S[1] + 0.22 * HH]], front: true });
    } else if (prop === "twoFingers") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.25 * T.a + 30 * u, S[1] + 0.02 * HH], [300 + 1.12 * H.a + 30 * u, chin - 0.5 * H.b]], front: true });
    } else if (prop === "earCup") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.2 * T.a + 18 * u, S[1] + 0.1 * HH], [300 + 1.05 * H.a + 6 * u, chin - 0.9 * H.b]], front: true });
    } else if (prop === "point") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.2 * T.a + 22 * u, S[1] - 0.05 * HH], [tcx + 1.3 * T.a + 60 * u, S[1] - 0.2 * HH]], front: true });
    } else if (prop === "phoneHold" || prop === "phoneDrop") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.1 * T.a + 6 * u, S[1] + 0.42 * HH], [tcx + 0.25 * T.a, S[1] + 0.3 * HH]], front: true });
    } else if (prop === "icecream") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.05 * T.a + 4 * u, S[1] + 0.45 * HH], [tcx + 0.5 * T.a, S[1] + 0.4 * HH]], front: true });
    } else if (np) {
      const both = (L: P2, R: P2, eL: P2, eR: P2) => { arms.length = 0; arms.push({ pts: [sh(-1), eL, L], front: true }, { pts: [sh(1), eR, R], front: true }); };
      const one = (Hd: P2, E: P2) => arms.push({ pts: [sh(1), E, Hd], front: true });
      const sym = (hx: number, hy: number, edx: number, ey: number) => both([X(-hx), hy], [X(hx), hy], [ex(-1, edx), ey], [ex(1, edx), ey]);
      switch (pn) {
        case "shovel": both(shovelG, lerp2(shovelG, shovelB, 0.38), [ex(-1, 6), Sy + 0.36 * HH], [ex(1, 12), Sy + 0.42 * HH]); break;
        case "drum": {
          const yH = drumC[1] - 8 * u, yU = drumC[1] - 44 * u;
          both([X(-70), yH + (yU - yH) * kTool], [X(70), yU + (yH - yU) * kTool], [ex(-1, 18), Sy + 0.36 * HH], [ex(1, 18), Sy + 0.36 * HH]);
          break;
        }
        case "phone": sym(11, Y(44), 6, Sy + 0.42 * HH); break;
        case "juice": one([X(29), Y(28)], [ex(1, 14), Sy + 0.46 * HH]); break;
        case "cup": one([X(24), Y(-7)], [ex(1, 22), Sy + 0.3 * HH]); break;
        case "plate": sym(50, Y(60), 12, Sy + 0.4 * HH); break;
        case "book": sym(33, Y(58), 8, Sy + 0.44 * HH); break;
        case "lantern": one([X(62), Y(64)], [ex(1, 12), Sy + 0.36 * HH]); break;
        case "broom": both(lerp2(broomT, broomB, 0.42), lerp2(broomT, broomB, 0.1), [ex(-1, 4), Sy + 0.5 * HH], [ex(1, 12), Sy + 0.42 * HH]); break;
        case "rope": both([X(-66), Y(44)], [X(-40), Y(54)], [ex(-1, 16), Sy + 0.26 * HH], [X(10), Y(64)]); break;
        case "flag": one([X(60), Y(-30)], [ex(1, 24), Sy + 0.02 * HH]); break;
        case "torch": one([X(60), Y(-24)], [ex(1, 24), Sy + 0.04 * HH]); break;
        case "basket": sym(52, crown - 4 * u, 24, Y(-30)); break;
        case "pot": one([X(36), crown - 20 * u], [ex(1, 26), Y(-34)]); break;
        case "umbrella": one([X(16), Y(46)], [ex(1, 10), Sy + 0.44 * HH]); break;
        case "stick": case "cane": one([X(62), Y(84)], [ex(1, 10), Sy + 0.42 * HH]); break;
        case "garland": sym(62, Y(-34), 26, Sy + 0.2 * HH); break;
        case "candle": sym(8, Y(56), 4, Sy + 0.46 * HH); break;
        default: arms.push(defArm(1)); // bag: both arms free
      }
    } else if (isTool(prop, "hammer")) {
      const S = sh(1), k = clamp(prop[1], 0, 1);
      const E = lerp2([tcx + 1.1 * T.a + 10 * u, S[1] - 0.15 * HH], [tcx + 1.2 * T.a + 10 * u, S[1] + 0.3 * HH], k);
      const Hd = lerp2([tcx + 1.15 * T.a + 14 * u, S[1] - 0.55 * HH], [tcx + 1.45 * T.a + 22 * u, S[1] + 0.35 * HH], k);
      arms.push({ pts: [S, E, Hd], front: true });
    } else arms.push(defArm(1));
  }
  const drawArm = (a: Arm) => { p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol); p.dot(a.pts[2][0], a.pts[2][1], 5.5 * u); };
  // behind the body: rifle, sword, arms
  if (rifle) {
    p.band([R0, R1], "#7a4b2a", 5 * u, 1.5 * u, "round");
    p.band([lerp2(R0, R1, 0.6), R1], "#8d949c", 2.4 * u, 1.2 * u, "round");
  }
  if (o.sword && mode !== "sit" && mode !== "sitFeetUp" && mode !== "sitFloor" && mode !== "kneel" && mode !== "jump") {
    const s0: P2 = [tcx - 0.75 * T.a, torsoBot - 0.2 * HH];
    p.band([s0, [s0[0] - Math.sin(rad(25)) * 0.8 * HH, s0[1] + Math.cos(rad(25)) * 0.8 * HH]], "#c9ccd2", 3 * u, 1.2 * u, "round");
  }
  for (const a of arms) if (!a.front) drawArm(a);
  // torso / dress: shaded fill -> clothing clipped to it -> thick-thin ink ring
  if (dress) {
    // lehenga / saree: a flared pleated skirt from the waist with a gold border, a fitted blouse, a dupatta, jewellery
    const sk = o.dress!, bord = o.sash ?? mul(o.dress!, [0.7, 0.7, 0.7]), yw = torsoBot - 0.2 * HH, yh = mode === "sit" ? sole + 0.06 * HH : mode === "sitFloor" ? sole - 0.01 * HH : mode === "kneel" ? sole - 0.03 * HH
      : mode === "sitFeetUp" ? torsoBot + 0.22 * HH : mode === "run" || mode === "jump" ? torsoBot + 0.72 * HH : sole - 0.08 * HH,
      tw = 0.82 * T.a, hw = (mode === "sit" ? 1.75 : mode === "sitFloor" ? 2.0 : 1.42) * T.a;
    const skirt: P2[] = [[tcx - tw, yw], [tcx + tw, yw]];
    for (let i = 0; i <= 10; i++) { const x = tcx + hw - (2 * hw * i) / 10; skirt.push([x, yh + (i % 2 ? 3 * u : 0) - Math.abs(i - 5) * 0.6 * u]); }
    p.gradFill(skirt, sk, mul(sk, SH_CLOTH), light);
    p.clip(skirt, () => {
      for (let i = -3; i <= 3; i++) p.stroke([[tcx + i * 0.2 * tw, yw + 4 * u], [tcx + i * 0.3 * hw, yh]], 1.6 * u, mul(sk, [0.72, 0.72, 0.72]));
      p.band([[tcx - hw - 4 * u, yh - 0.1 * HH], [tcx + hw + 4 * u, yh - 0.1 * HH]], bord, 0.09 * HH, 0);
      for (let x = tcx - hw; x < tcx + hw; x += 11 * u) p.dot(x, yh - 0.1 * HH, 2.4 * u, sk);
    });
    p.poly(skirt, null, ow);
    const bl: Blob = { ...T, a: T.a * 0.86, b: T.b * 0.78, nBot: 2.2, seed: seed + 8 };
    const bp = blobPts(tcx, chin + 0.55 * HH - 0.1 * HH, bl);
    p.gradFill(bp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.inkRing(bp, ow * 0.9, thick);
    // dupatta over the left shoulder, across to the right hip, its end falling down the side
    if (o.dupatta) { const dup = o.dupatta;
    p.band([[tcx - 0.78 * T.a, chin + 0.04 * HH], [tcx + 0.95 * T.a, yw + 0.06 * HH]], dup, 0.2 * HH, ow * 0.6, "round");
    p.band([[tcx - 0.92 * T.a, chin + 0.02 * HH], [tcx - 1.12 * T.a, yw + 0.3 * HH]], dup, 0.11 * HH, ow * 0.5, "round");
    for (let k = 0; k < 6; k++) p.dot(tcx - 1.12 * T.a + (k - 2.5) * 2.4 * u, yw + 0.36 * HH + (k % 2) * 2 * u, 2.2 * u, bord); }
    if (o.jewel) { for (let k = -4; k <= 4; k++) p.dot(tcx + k * 4.2 * u, chin + 0.06 * HH + (16 - k * k) * 0.25 * u, 2.6 * u, "#f2c14e"); p.dot(tcx, chin + 0.06 * HH + 6 * u, 3.6 * u, "#d1202f"); }
  } else {
    p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.clip(tp, () => {
      if (o.belt) {
        for (const s of [-1, 1]) p.band([[tcx - s * 0.75 * T.a, chin - 0.05 * HH], [tcx + s * 0.8 * T.a, torsoBot - 0.1 * HH]], o.belt!, 5.5 * u, 1.8 * u);
        const xc = tcx + 0.025 * T.a, yc = chin - 0.05 * HH + (torsoBot - 0.1 * HH - (chin - 0.05 * HH)) * (0.75 / 1.55);
        p.poly([[xc - 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc + 3.5 * u], [xc - 3.5 * u, yc + 3.5 * u]], "#d9dde0", 1.5 * u);
      }
      if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
      for (let i = 0; i < (back ? 0 : 4); i++) {
        const y = chin + 0.12 * HH + i * 0.2 * HH;
        if (o.sash && Math.abs(y - (torsoBot - 0.32 * HH)) < 0.08 * HH) continue;
        p.dot(tcx + 2 * u * facing, y, 2.2 * u + 0.8 * u, INK); p.dot(tcx + 2 * u * facing, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
      }
    });
    if (o.sash) { const s = facing || 1; p.poly([[tcx + s * 0.55 * T.a, torsoBot - 0.3 * HH], [tcx + s * 0.75 * T.a, torsoBot + 0.05 * HH], [tcx + s * 0.45 * T.a, torsoBot + 0.02 * HH]], o.sash, 1.6 * u); }
    p.inkRing(tp, ow, thick);
  }
  // ---- new props, in three layers: under the front arms, over them (hands redrawn on top), after the head ----
  const handDots = () => { for (const a of arms) if (a.front) p.dot(a.pts[2][0], a.pts[2][1], 5.5 * u); };
  const pc = opts.propColor, WOOD = "#8a5a34", fsc = refHead ? 0.88 : 1;
  const drawProp = (stage: "under" | "over" | "head") => {
    if (!np) return;
    if (stage === "under") {
      if (pn === "bag") { // strap over the left shoulder across to a satchel on the right hip
        const bc: P2 = [X(46), torsoBot - 0.06 * HH], col = pc ?? "#8a5a2e";
        p.band([[X(-24), Y(2)], [X(38), bc[1] - 14 * u]], "#5a3418", 4 * u, 1.2 * u, "round");
        p.poly(rrect(bc[0] - 21 * u, bc[1] - 15 * u, bc[0] + 21 * u, bc[1] + 17 * u, 5 * u), col, 2.4 * u);
        p.poly([[bc[0] - 21 * u, bc[1] - 15 * u], [bc[0] + 21 * u, bc[1] - 15 * u], [bc[0] + 19 * u, bc[1] + 2 * u], [bc[0], bc[1] + 6 * u], [bc[0] - 19 * u, bc[1] + 2 * u]], shade(col, 0.78), 2 * u);
        p.ell(bc[0], bc[1] + 4 * u, 3.5 * u, 3 * u, "#e8c45a", 1.2 * u);
      } else if (pn === "drum") { // dhol across the waist on a neck strap
        const [cx, cy] = drumC, L = drumL, R = drumR, body = pc ?? "#b5653f";
        for (const s of [-1, 1]) p.band([[X(s * 18), Y(4)], [cx + s * (L - 10 * u), cy - R + 2 * u]], "#c0353a", 3 * u, 1 * u, "round");
        const top: P2[] = [], bot: P2[] = [];
        for (let i = 0; i <= 12; i++) { const t = i / 12, x = cx - L + 2 * L * t, b = 4 * u * Math.sin(Math.PI * t); top.push([x, cy - R - b]); bot.push([x, cy + R + b]); }
        const shell = [...top, ...bot.reverse()];
        p.gradFill(shell, body, mul(body, SH_CLOTH), light, 0.3);
        p.clip(shell, () => {
          const zz: P2[] = [];
          for (let i = 0; i <= 10; i++) zz.push([cx - L + 6 * u + ((2 * L - 12 * u) * i) / 10, cy + (i % 2 ? R + 6 * u : -R - 6 * u)]);
          p.stroke(zz, 1.6 * u, "#f4e6c0");
          for (const s of [-1, 1]) p.stroke([[cx + s * (L - 8 * u), cy - R - 6 * u], [cx + s * (L - 8 * u), cy + R + 6 * u]], 3 * u, "#e8c45a");
        });
        p.poly(shell, null, 2.6 * u);
        for (const s of [-1, 1]) p.ell(cx + s * L, cy, 8 * u, R + 1 * u, "#efe3c4", 2.6 * u);
      } else if (pn === "umbrella") { // shaft (behind the head) + J handle
        const x = X(16);
        p.band([[x, Y(58)], [x, crown - 60 * u]], "#3a2a22", 2.4 * u, 1 * u, "round");
        p.band(curve([x, Y(58)], [x - 2 * u, Y(68)], [x - 9 * u, Y(63)]), "#5a3418", 4 * u, 1.2 * u, "round");
      }
      return;
    }
    if (stage === "over") {
      switch (pn) {
        case "shovel": {
          const G = shovelG, B = shovelB, d = Math.hypot(B[0] - G[0], B[1] - G[1]), dx = (B[0] - G[0]) / d, dy = (B[1] - G[1]) / d, nx = -dy, ny = dx;
          const at = (a: number, n: number): P2 => [B[0] + dx * a * u + nx * n * u, B[1] + dy * a * u + ny * n * u];
          p.band([[G[0] - dx * 4 * u, G[1] - dy * 4 * u], B], "#a0703c", 4.4 * u, 1.3 * u, "round");
          p.band([[G[0] - dx * 5 * u + nx * 8 * u, G[1] - dy * 5 * u + ny * 8 * u], [G[0] - dx * 5 * u - nx * 8 * u, G[1] - dy * 5 * u - ny * 8 * u]], "#a0703c", 4 * u, 1.3 * u, "round");
          const blade = [at(0, 8), at(4, 12), at(26, 12.5), at(38, 0), at(26, -12.5), at(4, -12)];
          p.poly(blade, "#a9b1ba", 2.2 * u);
          p.stroke([at(4, 0), at(30, 0)], 1.3 * u, "#7d858e");
          p.poly([at(-6, 3.6), at(4, 4.6), at(4, -4.6), at(-6, -3.6)], "#7d858e", 1.6 * u);
          if (kTool > 0.35) { // a clod of earth on the blade, bits flying off it
            const c = at(20, -2);
            p.ell(c[0], c[1] - 6 * u, 13 * u, 9 * u, "#7a5230", 2 * u);
            if (kTool > 0.6) for (let i = 0; i < 4; i++) p.ell(c[0] - (8 - i * 8) * u, c[1] - (22 + 7 * (i % 2)) * u, 3.2 * u, 2.8 * u, "#7a5230", 1.4 * u);
          }
          if (kTool < 0.5) { const t = at(36, 0); p.ell(t[0], sole - 5 * u, 30 * u, 8 * u, "#7a5230", 2.2 * u); p.ell(t[0] - 9 * u, sole - 8 * u, 7 * u, 3 * u, "#9a6a40", 0); }
          break;
        }
        case "drum": {
          const ang0 = Math.atan2(-30, -12), ang1 = Math.atan2(14, -16);
          arms.forEach((a, i) => {
            const side = i ? 1 : -1, k = i ? kTool : 1 - kTool, an = ang0 + (ang1 - ang0) * k, L = (i ? 26 : 30) * u;
            const [hx, hy] = a.pts[2], tip: P2 = [hx - side * Math.abs(Math.cos(an)) * L, hy + Math.sin(an) * L];
            if (i) p.band(curve([hx + side * 3 * u, hy + 2 * u], [(hx + tip[0]) / 2, (hy + tip[1]) / 2 - 3 * u], tip), "#7a4b2a", 3.6 * u, 1.2 * u, "round");
            else p.band([[hx + side * 3 * u, hy + 2 * u], tip], "#d9b27a", 2.2 * u, 1.1 * u, "round");
          });
          break;
        }
        case "phone": {
          p.poly(rrect(X(-11), Y(16), X(11), Y(50), 3.5 * u), "#22232b", 2.4 * u);
          p.poly(rrect(X(-8), Y(20), X(8), Y(45), 1.5 * u), mix("#2c3a4c", "#cfeeff", 0.35 + 0.65 * glow), 0);
          break;
        }
        case "juice": {
          const g0: P2[] = [[X(12), Y(2)], [X(32), Y(2)], [X(29.5), Y(38)], [X(14.5), Y(38)]];
          p.poly(g0, "rgba(225,242,255,0.8)", 0);
          p.poly([[X(12.8), Y(10)], [X(31.2), Y(10)], [X(29.5), Y(38)], [X(14.5), Y(38)]], pc ?? "#ffa62b", 0);
          p.stroke([[X(15.5), Y(13)], [X(16.5), Y(33)]], 1.6 * u, "rgba(255,255,255,0.7)");
          p.poly(g0, null, 2.2 * u);
          p.ell(X(31), Y(3), 7 * u, 7 * u, "#f6dc3a", 1.6 * u, 180, 360, -20);
          break;
        }
        case "plate": {
          p.ell(300, Y(60), 54 * u, 12 * u, "#c9ccd4", 2.4 * u);
          p.ell(300, Y(58.5), 46 * u, 8.5 * u, "#eceef2", 0);
          const rows: [number, number[]][] = [[50, [-21, -7, 7, 21]], [39, [-14, 0, 14]], [28, [-7, 7]], [17, [0]]];
          for (const [yy, xs] of rows) for (const xx of xs) {
            p.ell(X(xx), Y(yy), 7.6 * u, 7.2 * u, pc ?? "#f39a2b", 1.6 * u);
            p.dot(X(xx - 2.5), Y(yy - 2.5), 1.3 * u, "#ffd08a"); p.dot(X(xx + 2), Y(yy + 1), 1 * u, "#c9701a");
          }
          break;
        }
        case "book": {
          const col = pc ?? "#a23a3a";
          p.poly([[X(-38), Y(30)], [X(0), Y(34)], [X(38), Y(30)], [X(38), Y(64)], [X(0), Y(67)], [X(-38), Y(64)]], col, 2.4 * u);
          for (const s of [-1, 1]) {
            p.poly([[X(s * 1), Y(35)], [X(s * 35), Y(31)], [X(s * 35), Y(61)], [X(s * 1), Y(64)]], "#f8f1de", 1.6 * u);
            for (let k = 0; k < 4; k++) p.stroke([[X(s * 6), Y(40 + k * 5.5)], [X(s * 29), Y(37.5 + k * 5.5)]], 1.2 * u, "#9a9282");
          }
          break;
        }
        case "lantern": {
          const [hx, hy] = arms[arms.length - 1].pts[2];
          p.ell(hx, hy + 30 * u, 32 * u, 32 * u, "rgba(255,200,90,0.28)", 0);
          p.stroke(curve([hx - 8 * u, hy + 12 * u], [hx, hy - 2 * u], [hx + 8 * u, hy + 12 * u]), 1.6 * u);
          p.poly([[hx - 7 * u, hy + 10 * u], [hx + 7 * u, hy + 10 * u], [hx + 12 * u, hy + 16 * u], [hx - 12 * u, hy + 16 * u]], "#3a3d47", 1.8 * u);
          p.poly(rrect(hx - 10 * u, hy + 16 * u, hx + 10 * u, hy + 40 * u, 3 * u), "#ffe9a0", 2 * u);
          p.poly([[hx, hy + 20 * u], [hx + 4 * u, hy + 29 * u], [hx, hy + 34 * u], [hx - 4 * u, hy + 29 * u]], "#ff9a1a", 0);
          p.ell(hx, hy + 30 * u, 1.6 * u, 3 * u, "#fff8d0", 0);
          for (const s of [-1, 1]) p.stroke([[hx + s * 10 * u, hy + 16 * u], [hx + s * 10 * u, hy + 40 * u]], 2.4 * u, "#3a3d47");
          p.poly(rrect(hx - 12 * u, hy + 40 * u, hx + 12 * u, hy + 45 * u, 1.5 * u), "#3a3d47", 1.6 * u);
          break;
        }
        case "broom": {
          const T0 = broomT, B = broomB, d = Math.hypot(B[0] - T0[0], B[1] - T0[1]), dx = (B[0] - T0[0]) / d, dy = (B[1] - T0[1]) / d;
          const fan: P2[] = [[B[0] - dy * 5 * u, B[1] + dx * 5 * u], [B[0] + dy * 5 * u, B[1] - dx * 5 * u], [X(-20), sole - 2 * u], [X(-46), sole + 1 * u], [X(-70), sole - 3 * u]];
          p.poly(fan, "#d9b25a", 2.2 * u);
          p.clip(fan, () => { for (let k = 0; k < 7; k++) p.stroke([B, [X(-70 + k * 8), sole]], 1.1 * u, "#a8843a"); });
          p.band([T0, [B[0] + dx * 4 * u, B[1] + dy * 4 * u]], "#c99a5a", 3.6 * u, 1.2 * u, "round");
          p.band([[B[0] - dy * 6 * u - dx * 2 * u, B[1] + dx * 6 * u - dy * 2 * u], [B[0] + dy * 6 * u - dx * 2 * u, B[1] - dx * 6 * u - dy * 2 * u]], "#c0353a", 3 * u, 1 * u);
          break;
        }
        case "rope": {
          const pts = curve([X(-170), Y(40)], [X(-60), Y(46)], [X(-40), Y(54)], 8);
          pts.push(...curve([X(-40), Y(54)], [X(-30), Y(84)], [X(-8), Y(118)], 8).slice(1));
          inked(p, pts, 4.6 * u, "#c9a06a", 1.2 * u);
          for (let i = 1; i < pts.length - 1; i++) { const [x0, y0] = pts[i]; p.stroke([[x0 - 1.5 * u, y0 - 2 * u], [x0 + 1.5 * u, y0 + 2 * u]], 1 * u, "#8a6a3a"); }
          break;
        }
        case "flag": {
          const [hx, hy] = arms[arms.length - 1].pts[2], top = crown - 56 * u, col = pc ?? "#ff9933", ph = phase * Math.PI * 2;
          p.band([[hx, hy + 46 * u], [hx, top]], WOOD, 3.4 * u, 1.2 * u, "round");
          const up: P2[] = [], dn: P2[] = [];
          for (let i = 0; i <= 12; i++) { const t = i / 12, w = 4 * u * t * Math.sin(t * 5 + ph); up.push([hx + 2 * u + 54 * u * t, top + 4 * u + w]); dn.push([hx + 2 * u + 54 * u * t, top + 40 * u + w - 3 * u * t]); }
          const cloth = [...up, ...dn.reverse()];
          p.gradFill(cloth, col, mul(col, SH_CLOTH), light, 0.4);
          p.clip(cloth, () => { for (let k = 1; k < 3; k++) { const x = hx + 2 * u + 18 * k * u; p.stroke([[x, top], [x + 4 * u, top + 44 * u]], 1.4 * u, mul(col, [0.8, 0.8, 0.8])); } });
          p.poly(cloth, null, 2.2 * u);
          p.ell(hx, top - 3 * u, 4 * u, 4 * u, "#e8c45a", 1.4 * u);
          break;
        }
        case "torch": {
          const [hx, hy] = arms[arms.length - 1].pts[2], fx0 = hx + 3 * u, fy0 = hy - 34 * u, fl = Math.sin(phase * 40) * 2 * u;
          p.ell(fx0, fy0 - 18 * u, 36 * u, 36 * u, "rgba(255,170,60,0.26)", 0);
          p.band([[hx - 2 * u, hy + 22 * u], [fx0, fy0 + 4 * u]], "#7a4b2a", 4.2 * u, 1.3 * u, "round");
          const flame = (s: number, col: string, rim: number) => p.poly([[fx0 - 11 * u * s, fy0], [fx0 - 9 * u * s, fy0 - 18 * u * s], [fx0 - 3 * u * s + fl, fy0 - 30 * u * s], [fx0 + 1 * u * s + fl, fy0 - 44 * u * s],
            [fx0 + 6 * u * s, fy0 - 26 * u * s], [fx0 + 11 * u * s, fy0 - 16 * u * s], [fx0 + 10 * u * s, fy0]], col, rim);
          flame(1, "#ff7a1a", 2 * u); flame(0.62, "#ffc93a", 0); flame(0.3, "#fff6d0", 0);
          p.ell(fx0, fy0 + 2 * u, 8 * u, 5 * u, "#5a3a2a", 1.6 * u);
          break;
        }
        case "candle": {
          p.ell(300, Y(16), 26 * u, 26 * u, "rgba(255,200,90,0.3)", 0);
          p.poly(rrect(X(-5), Y(24), X(5), Y(56), 1.5 * u), pc ?? "#f6f0e0", 2 * u);
          p.ell(300, Y(24), 5 * u, 1.6 * u, "#e8dcc0", 0);
          p.stroke([[300, Y(24)], [300, Y(20)]], 1.2 * u);
          p.poly([[X(-3.5), Y(17)], [X(0), Y(5)], [X(3.5), Y(17)], [X(0), Y(21)]], "#ffb43a", 1.4 * u);
          p.ell(300, Y(16.5), 1.5 * u, 2.6 * u, "#fff6d0", 0);
          break;
        }
        case "garland": {
          const L = arms[0].pts[2], R = arms[1].pts[2], n = 26;
          for (let i = 0; i <= n; i++) {
            const t = i / n, x = L[0] + (R[0] - L[0]) * t, y = L[1] + (R[1] - L[1]) * t + 72 * u * 4 * t * (1 - t);
            p.ell(x, y, 5.6 * u, 5.6 * u, i % 2 ? "#ffc21a" : "#ff8c1a", 1.4 * u);
          }
          const by = (L[1] + R[1]) / 2 + 72 * u;
          p.poly([[X(-4), by + 4 * u], [X(4), by + 4 * u], [X(0), by + 16 * u]], "#3f9a4a", 1.4 * u);
          break;
        }
        case "stick": case "cane": {
          const [hx, hy] = arms[arms.length - 1].pts[2];
          p.band([[hx + 3 * u, hy - 4 * u], [X(68), sole - 2 * u]], "#7a4b2a", 3.8 * u, 1.2 * u, "round");
          const crook: P2[] = [];
          for (let i = 0; i <= 10; i++) { const a = rad(-(i * 180) / 10); crook.push([hx - 5 * u + 8 * u * Math.cos(a), hy - 4 * u + 8 * u * Math.sin(a)]); }
          p.band(crook, "#7a4b2a", 3.8 * u, 1.2 * u, "round");
          break;
        }
      }
      handDots();
      return;
    }
    // stage "head": things in front of / on top of the head (drawn in the upper-body frame)
    const mxp = 300 + 8 * u * fsc * facing, myp = hc + 20 * u * fsc;
    if (pn === "juice") { // striped straw from the glass to the mouth
      const st: P2[] = [[X(19), Y(8)], [mxp + 1.5 * u, myp + 1 * u]];
      inked(p, st, 2.6 * u, "#ffffff", 1 * u);
      for (let k = 1; k < 6; k += 2) { const a = lerp2(st[0], st[1], k / 6), b = lerp2(st[0], st[1], (k + 1) / 6); p.stroke([a, b], 2.6 * u, "#e8434e"); }
    } else if (pn === "cup") { // kulhad tipped to the lips
      const c: P2 = [X(14), hc + 30 * u * fsc + 2 * u], R = (pts: P2[]) => rotPts(pts, rad(-28), c[0], c[1]);
      p.poly(R([[c[0] - 12 * u, c[1] - 11 * u], [c[0] + 12 * u, c[1] - 11 * u], [c[0] + 8 * u, c[1] + 11 * u], [c[0] - 8 * u, c[1] + 11 * u]]), "#b8643a", 2.2 * u);
      const [rx, ry] = R([[c[0], c[1] - 11 * u]])[0];
      p.ell(rx, ry, 12 * u, 3 * u, "#8a4426", 1.8 * u, 0, 360, -28);
      p.dot(X(24), Y(-7), 5.5 * u);
    } else if (pn === "basket") {
      const b0 = crown + 8 * u, b1 = crown - 24 * u;
      for (const [dx, dy, r, col] of [[-30, -4, 11, "#e2453c"], [-10, -10, 12, "#f39a2b"], [12, -8, 12, "#7bbf4a"], [32, -3, 10, "#f2c14e"], [0, 2, 10, "#e2453c"]] as const)
        p.ell(X(dx), b1 + dy * u, r * u, r * u, col, 1.8 * u);
      const bk: P2[] = [[X(-60), b1], [X(60), b1], [X(40), b0], [X(-40), b0]], col = pc ?? "#c9934a";
      p.gradFill(bk, col, mul(col, SH_CLOTH), light, 0.3);
      p.clip(bk, () => {
        for (let k = 1; k < 4; k++) p.stroke([[X(-62), b1 + k * 8 * u], [X(62), b1 + k * 8 * u]], 1.4 * u, mul(col, [0.72, 0.72, 0.72]));
        for (let k = -6; k <= 6; k++) p.stroke([[X(k * 9), b1], [X(k * 6.4), b0]], 1.2 * u, mul(col, [0.8, 0.8, 0.8]));
      });
      p.poly(bk, null, 2.4 * u);
      p.ell(300, b1, 61 * u, 5 * u, shade(col, 0.85), 2.2 * u);
      for (const a of arms) p.dot(a.pts[2][0], a.pts[2][1], 5.5 * u);
    } else if (pn === "pot") { // matka balanced on the head, steadied by the right hand
      const col = pc ?? "#c4643a", cy = crown - 22 * u;
      const body = ellPts(300, cy, 36 * u, 28 * u);
      p.shadedFill(body, col, mul(col, SH_FELT), light, 36 * u, 0.4);
      p.clip(body, () => { const zz: P2[] = []; for (let i = 0; i <= 14; i++) zz.push([X(-36 + (72 * i) / 14), cy - 2 * u + (i % 2 ? 4 : -4) * u]); p.stroke(zz, 1.6 * u, "#f4e6c0"); });
      p.poly(body, null, 2.4 * u);
      p.poly([[X(-10), cy - 25 * u], [X(10), cy - 25 * u], [X(13), cy - 34 * u], [X(-13), cy - 34 * u]], col, 2.2 * u);
      p.ell(300, cy - 34 * u, 15 * u, 4 * u, shade(col, 0.7), 2 * u);
      const [hx, hy] = arms[arms.length - 1].pts[2];
      p.dot(hx, hy, 5.5 * u);
    } else if (pn === "umbrella") {
      const cx = X(16), rim = crown - 14 * u, rx = 92 * u, ry = 50 * u, col = pc ?? "#d6404e", n = 6;
      const can: P2[] = [];
      for (let i = 0; i <= 24; i++) { const a = Math.PI + (Math.PI * i) / 24; can.push([cx + rx * Math.cos(a), rim + ry * Math.sin(a)]); }
      for (let i = 0; i < n; i++) for (let j = 1; j <= 6; j++) { const t = (i + j / 6) / n; can.push([cx + rx - 2 * rx * t, rim - 7 * u * Math.sin(Math.PI * ((j / 6)))]); }
      p.gradFill(can, col, mul(col, SH_CLOTH), light, 0.35);
      p.clip(can, () => {
        for (let i = 0; i < n; i += 2) { const x0 = cx - rx + (2 * rx * i) / n, x1 = cx - rx + (2 * rx * (i + 1)) / n; p.poly([[cx, rim - ry], [x1, rim + 2 * u], [x0, rim + 2 * u]], "rgba(255,255,255,0.18)", 0); }
        for (let i = 1; i < n; i++) p.stroke([[cx, rim - ry], [cx - rx + (2 * rx * i) / n, rim]], 1.3 * u, mul(col, [0.6, 0.6, 0.6]));
      });
      p.poly(can, null, 2.6 * u);
      p.band([[cx, rim - ry + 1 * u], [cx, rim - ry - 10 * u]], "#3a2a22", 2.4 * u, 1 * u, "round");
    }
  };
  if (frontLegs.length) { const r0 = p.rot; p.rot = null; for (const fn of frontLegs) fn(); p.rot = r0; }
  drawProp("under");
  // in front of the body: hands holding props
  if (prop === "spear") { // upright spear in the right hand
    const [hx, hy] = arms[arms.length - 1].pts[2];
    p.band([[hx + 2 * u, hy + 0.9 * HH], [hx + 2 * u, crown - 0.75 * HH]], "#7a4b2a", 4.5 * u, 1.5 * u, "round");
    p.poly([[hx - 6 * u, crown - 0.72 * HH], [hx + 10 * u, crown - 0.72 * HH], [hx + 2 * u, crown - 1.08 * HH]], "#c9ccd2", 2 * u);
  }
  if (prop === "spearAim" || prop === "spearUp") { // spear levelled with both hands (aim: toward screen-left and up; up: steeply up)
    const up = prop === "spearUp", base: P2 = [300 + 46 * u, chin + 0.95 * HH], dir: P2 = up ? [-0.25, -1] : [-1, -0.42];
    const L = up ? 1.9 * HH : 2.0 * HH, tip: P2 = [base[0] + dir[0] * L, base[1] + dir[1] * L], n = Math.hypot(dir[0], dir[1]), dx = dir[0] / n, dy = dir[1] / n;
    p.band([base, tip], "#7a4b2a", 4.5 * u, 1.5 * u, "round");
    p.poly([[tip[0] - dy * 7 * u, tip[1] + dx * 7 * u], [tip[0] + dy * 7 * u, tip[1] - dx * 7 * u], [tip[0] + dx * 30 * u, tip[1] + dy * 30 * u]], "#c9ccd2", 2 * u);
  }
  if (prop === "axe") { // axe raised over the shoulder with both hands, about to swing
    const base: P2 = [300 + 46 * u, chin + 0.95 * HH], tip: P2 = [base[0] - 0.3 * HH, base[1] - 1.25 * HH];
    p.band([base, tip], "#9a6a3a", 5.5 * u, 1.5 * u, "round");
    const dx = tip[0] - base[0], dy = tip[1] - base[1], n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n;
    const a: P2 = [tip[0] - ux * 4 * u, tip[1] - uy * 4 * u], b: P2 = [tip[0] - ux * 34 * u, tip[1] - uy * 34 * u];
    p.poly([a, b, [b[0] - uy * 44 * u - ux * 6 * u, b[1] + ux * 44 * u - uy * 6 * u], [a[0] - uy * 50 * u + ux * 6 * u, a[1] + ux * 50 * u + uy * 6 * u]], "#c9ccd2", 2.2 * u);
    p.poly([a, b, [b[0] + uy * 14 * u, b[1] - ux * 14 * u], [a[0] + uy * 14 * u, a[1] - ux * 14 * u]], "#5a5a62", 2 * u);
  }
  if (prop === "bow") { // bow held upright in the hanging right hand
    const [hx, hy] = arms[arms.length - 1].pts[2], top: P2 = [hx + 4 * u, hy - 0.95 * HH], bot: P2 = [hx + 4 * u, hy + 0.75 * HH];
    p.stroke([top, bot], 1.2 * u, "#f4ead0");
    p.band(curve(top, [hx + 26 * u, hy - 0.1 * HH], bot, 14), "#8a4a24", 5 * u, 1.8 * u, "round");
  }
  if (prop === "bowAim") { // bow in the outstretched left hand, string drawn to the right cheek, arrow nocked
    const [lx, ly] = arms[0].pts[2], [rx, ry] = arms[1].pts[2];
    const top: P2 = [lx + 8 * u, ly - 0.85 * HH], bot: P2 = [lx + 8 * u, ly + 0.85 * HH];
    p.band(curve(top, [lx - 22 * u, ly], bot, 14), "#8a4a24", 5 * u, 1.8 * u, "round");
    p.stroke([top, [rx, ry]], 1.2 * u, "#f4ead0"); p.stroke([bot, [rx, ry]], 1.2 * u, "#f4ead0");
    p.stroke([[rx, ry], [lx - 40 * u, ly - 2 * u]], 2.2 * u, "#6a4a2a");
    p.poly([[lx - 40 * u, ly - 8 * u], [lx - 56 * u, ly - 2 * u], [lx - 40 * u, ly + 4 * u]], "#c9ccd2", 1.4 * u);
  }
  for (const a of arms) if (a.front) {
    drawArm(a);
    const [hx, hy] = a.pts[2];
    if (prop === "diya" && a === arms[1]) {
      const cx2 = 300, cy2 = chin + 0.6 * HH;
      p.ell(cx2, cy2 - 10 * u, 40 * u, 32 * u, "rgba(255,190,90,0.3)", 0);
      p.poly([[cx2 - 20 * u, cy2 - 6 * u], [cx2 + 20 * u, cy2 - 6 * u], [cx2 + 12 * u, cy2 + 8 * u], [cx2 - 12 * u, cy2 + 8 * u]], "#b5532c", 2.4 * u);
      p.poly([[cx2 + 2 * u, cy2 - 32 * u], [cx2 + 7 * u, cy2 - 15 * u], [cx2 + 2 * u, cy2 - 6 * u], [cx2 - 4 * u, cy2 - 15 * u]], "#ffc93a", 1.8 * u);
      p.ell(cx2 + 1.5 * u, cy2 - 13 * u, 2.5 * u, 4.5 * u, "#fff6d0", 0);
      for (const side of [-1, 1]) p.dot(cx2 + side * 18 * u, cy2 + 2 * u, 5.5 * u);
    }
    if (prop === "sparkler") {
      p.stroke([[hx, hy], [hx + 14 * u, hy - 42 * u]], 2 * u, "#6a6a6a");
      const sx = hx + 14 * u, sy = hy - 44 * u, ph = (wave ?? 0) * 7;
      for (let i = 0; i < 14; i++) {
        const ang = i * 0.449 + ph, r = (14 + 12 * Math.abs(Math.sin(i * 2.1 + ph))) * u;
        p.stroke([[sx, sy], [sx + r * Math.cos(ang), sy + r * Math.sin(ang)]], 1.6 * u, i % 2 ? "#fff3b0" : "#ffd25a");
      }
      p.ell(sx, sy, 5 * u, 5 * u, "#ffffff", 0);
      p.dot(hx, hy, 5.5 * u);
    }
    if (prop === "suitcase") {
      const w = 54 * u, h = 40 * u, x0 = hx - w / 2, y0 = hy + 6 * u;
      p.stroke([[hx - 9 * u, hy + 7 * u], [hx - 9 * u, hy - 3 * u], [hx + 9 * u, hy - 3 * u], [hx + 9 * u, hy + 7 * u]], 3.2 * u, "#3a2414");
      p.poly([[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], "#8a5a2e", 2.6 * u);
      p.poly([[x0, y0 + 0.3 * h], [x0 + w, y0 + 0.3 * h], [x0 + w, y0 + 0.4 * h], [x0, y0 + 0.4 * h]], "#5a3418", 1.2 * u);
      for (const k of [0.22, 0.78]) p.poly([[x0 + k * w - 4 * u, y0], [x0 + k * w + 4 * u, y0], [x0 + k * w + 4 * u, y0 + h], [x0 + k * w - 4 * u, y0 + h]], "#5a3418", 1.2 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "cash") {
      for (let k = 0; k < 4; k++) { const a = rad(-30 + k * 16), cx3 = hx + 6 * u, cy3 = hy - 8 * u, L2 = 34 * u, W2 = 15 * u;
        const d: P2 = [Math.sin(a), -Math.cos(a)], n: P2 = [Math.cos(a), Math.sin(a)];
        const q: P2[] = [[cx3 - n[0] * W2, cy3 - n[1] * W2], [cx3 + n[0] * W2, cy3 + n[1] * W2], [cx3 + n[0] * W2 + d[0] * L2, cy3 + n[1] * W2 + d[1] * L2], [cx3 - n[0] * W2 + d[0] * L2, cy3 - n[1] * W2 + d[1] * L2]];
        p.poly(q, k % 2 ? "#9cc78a" : "#b9dca0", 1.8 * u); }
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "letter") {
      const w = 30 * u, h = 40 * u, x0 = hx - w / 2 + 4 * u, y0 = hy - h + 6 * u;
      p.poly([[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], "#f6efd8", 2.2 * u);
      for (let k = 0; k < 4; k++) p.stroke([[x0 + 5 * u, y0 + 9 * u + k * 6 * u], [x0 + w - 5 * u, y0 + 9 * u + k * 6 * u]], 1.4 * u, "#8a8070");
      p.ell(x0 + w - 8 * u, y0 + h - 8 * u, 5 * u, 5 * u, "#c0202a", 1.2 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "twoFingers") {
      for (const dx of [-3, 4]) p.band([[hx + dx * u, hy], [hx + dx * 1.8 * u, hy - 20 * u]], armCol, 4 * u, 1.4 * u, "round");
      p.dot(hx, hy, 6 * u);
    }
    if (prop === "icecream") {
      p.poly([[hx - 8 * u, hy - 12 * u], [hx + 8 * u, hy - 12 * u], [hx, hy + 7 * u]], "#e0a35a", 1.8 * u);
      p.ell(hx, hy - 19 * u, 11 * u, 10 * u, "#f7c6d9", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "phoneHold") {
      const pw = 13 * u, ph = 24 * u, x0 = hx - pw / 2, y0 = hy - ph + 4 * u;
      p.poly([[x0, y0], [x0 + pw, y0], [x0 + pw, y0 + ph], [x0, y0 + ph]], "#22232b", 2.6 * u);
      if (glow > 0) p.poly([[x0 + 2 * u, y0 + 2.5 * u], [x0 + pw - 2 * u, y0 + 2.5 * u], [x0 + pw - 2 * u, y0 + ph - 2.5 * u], [x0 + 2 * u, y0 + ph - 2.5 * u]], mix("#22232b", "#d9f2ff", glow), 0);
      p.dot(hx - 4 * u, hy + 2 * u, 5.5 * u); p.dot(hx + 4 * u, hy + 3 * u, 5 * u);
    } else if (prop === "phoneDrop") {
      p.dot(hx, hy, 5.5 * u);
    } else if (isTool(prop, "hammer")) {
      const ang = rad(-70 + 105 * clamp(prop[1], 0, 1));
      const Rh = (pts: P2[]) => rotPts(pts, ang, hx, hy);
      p.band(Rh([[hx, hy + 12 * u], [hx, hy - 44 * u]]), "#8a5a34", 5 * u, 1.5 * u, "round");
      p.poly(Rh([[hx - 12 * u, hy - 58 * u], [hx + 20 * u, hy - 58 * u], [hx + 20 * u, hy - 42 * u], [hx - 12 * u, hy - 42 * u]]), "#7d848c", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    }
  }
  if (prop === "moneyCase") { // an open briefcase full of banknotes, held at the chest
    const x0 = 300 - 64 * u, x1 = 300 + 64 * u, y0 = chin + 0.3 * HH, y1 = chin + 0.92 * HH;
    p.poly([[x0 + 4 * u, y0 - 0.34 * HH], [x1 - 4 * u, y0 - 0.34 * HH], [x1, y0], [x0, y0]], "#3a2416", 2.6 * u);
    p.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], "#4a2e1a", 2.6 * u);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const bx = x0 + 8 * u + c * 29 * u, by = y0 + 6 * u + r * 15 * u;
      p.poly([[bx, by], [bx + 26 * u, by], [bx + 26 * u, by + 13 * u], [bx, by + 13 * u]], "#7fb36a", 1.4 * u); p.poly([[bx + 10 * u, by], [bx + 16 * u, by], [bx + 16 * u, by + 13 * u], [bx + 10 * u, by + 13 * u]], "#f1ead6", 0); }
    p.poly([[300 - 8 * u, y1 - 4 * u], [300 + 8 * u, y1 - 4 * u], [300 + 8 * u, y1 + 3 * u], [300 - 8 * u, y1 + 3 * u]], "#c9a040", 1.2 * u);
    for (const side of [-1, 1]) p.dot(300 + side * 60 * u, chin + 0.45 * HH, 5.5 * u);
  }
  if (prop === "newspaper") { // an open broadsheet held at the chest, face left visible
    const x0 = 300 - 66 * u, x1 = 300 + 66 * u, y0 = chin + 0.2 * HH, y1 = chin + 0.95 * HH;
    p.poly([[x0, y0], [x1, y0 + 3 * u], [x1, y1], [x0, y1 - 3 * u]], "#f1ead6", 2.6 * u);
    p.stroke([[300, y0 + 2 * u], [300, y1 - 2 * u]], 1.6 * u, "#b8ae96");
    p.poly([[x0 + 8 * u, y0 + 8 * u], [x1 - 8 * u, y0 + 10 * u], [x1 - 8 * u, y0 + 20 * u], [x0 + 8 * u, y0 + 18 * u]], "#2a2a2a", 0);
    for (let k = 0; k < 6; k++) for (const [a0, a1] of [[x0 + 8 * u, 300 - 6 * u], [300 + 6 * u, x1 - 8 * u]]) if (!(a0 > 300 && k < 3)) p.stroke([[a0, y0 + 30 * u + k * 9 * u], [a1, y0 + 31 * u + k * 9 * u]], 2 * u, "#9a9282");
    const tx = 300 + 32 * u, ty = y0 + 52 * u; // tiny tower picture
    p.poly([[tx - 14 * u, ty], [tx - 2 * u, ty - 26 * u], [tx + 2 * u, ty - 26 * u], [tx + 14 * u, ty]], "#6b4a35", 1.2 * u);
    for (const side of [-1, 1]) p.dot(300 + side * 60 * u, chin + 0.45 * HH, 5.5 * u);
  }
  if (prop === "shako") { // carried by the left hand
    const [hx, hy] = arms[0].pts[2];
    p.poly([[hx - 14 * u, hy + 3 * u], [hx + 14 * u, hy + 3 * u], [hx + 16 * u, hy + 30 * u], [hx - 16 * u, hy + 30 * u]], "#3a3d47", 2.2 * u);
    p.ell(hx, hy + 31 * u, 3.5 * u, 3.5 * u, "#2b7a4b", 1.5 * u);
    p.dot(hx, hy, 5.5 * u);
  }
  drawProp("over");
  const bodyRot = p.rot;
  // ---- head: rotates with the body, plus its own tilt about the chin ----
  const Ah = A + headTilt, [cpx, cpy] = rotAbout([300, chin], rad(A), [300, hipY]);
  p.rot = Ah ? [rad(Ah), 300, chin, cpx - 300, cpy - chin] : null;
  if (back) {
    const hp = blobPts(300, hc, H), hair = o.hat === "helmK" ? "#a9b1ba" : o.hat === "crownEU" ? (o.hair ?? "#5a4030") : (o.hair ?? o.cap ?? "#3a2a22");
    p.shadedFill(hp, skin, skinSh, light, H.a);
    p.clip(hp, () => p.ell(300, hc - 0.12 * H.b, 1.25 * H.a, 1.2 * H.b, hair, 0));
    p.inkRing(hp, ow, thick);
    p.stroke([[300 - 6 * u, crown + 0.3 * HH], [300 + 2 * u, crown + 0.42 * HH]], 1.4 * u);
    const headB = p.P(300, hc);
    if (!NO_FLOAT) floaters(p, headB, H.a, opts, hatTop(o));
    p.rot = null;
    return { head: headB, r: H.a };
  }
  hatBehind(p, o, H, 300, hc, light, thick, ow, false);
  if (o.heads) { // extra heads fanned behind on two arcs (Ravana)
    const spots: [number, number][] = [];
    for (const a of [-30, 30, -60, 60, 88]) spots.push([a, 1.75]);
    for (const a of [-45, 45, -80, 80]) spots.push([a, 1.15]);
    for (const [deg, rr] of spots.slice(0, o.heads)) {
      const ar = rad(deg), x = 300 + Math.sin(ar) * rr * H.a * 1.55, y = hc + 0.25 * HH - Math.cos(ar) * rr * H.b * 1.55;
      const Hs = { ...H, a: H.a * 0.5, b: H.b * 0.5, seed: H.seed + Math.round(deg) };
      const sp = blobPts(x, y, Hs);
      p.shadedFill(sp, skin, skinSh, light, Hs.a);
      p.inkRing(sp, ow * 0.6, thick);
      const top = y - Hs.b, gw = 0.8 * Hs.a;
      p.poly([[x - gw, top + 6 * u], [x - gw * 0.6, top - 16 * u], [x, top - 26 * u], [x + gw * 0.6, top - 16 * u], [x + gw, top + 6 * u]], "#e8b84a", ow * 0.5);
      faceFront(p, x, y, W * 0.5, expr, 0, look, lid, true, skin, o.moustache, true);
    }
  }
  const hp = blobPts(300, hc, H);
  if (refHead) p.shadedFill(hp, skin, skinSh, light, H.a, 0.55, 0.62, 1.32); // soft grey turn on the shadow side
  else p.shadedFill(hp, skin, skinSh, light, H.a);
  const angry = clamp(opts.angry ?? 0, 0, 1);
  if (angry > 0) { // purple rising from the chin
    const g = p.g, [ax, ay] = p.P(300, hc + H.b), [bx, by] = p.P(300, hc + H.b - (0.15 + 2.1 * angry) * H.b), gr = g.createLinearGradient(ax, ay, bx, by);
    const A = 0.55 + 0.35 * angry;
    gr.addColorStop(0, `rgba(150,62,160,${A})`); gr.addColorStop(0.55, `rgba(165,75,170,${A * 0.92})`); gr.addColorStop(1, "rgba(170,80,170,0)");
    p.path(hp, true); g.fillStyle = gr; g.fill();
  }
  if (refHead) p.inkRing(hp, ow * 0.7, thick, 0.2); else p.inkRing(hp, ow, thick);
  if (o.hat === "longHair") {
    const hair = o.hair ?? "#1f1612", a = H.a, b = H.b, cx = 300;
    const fr: P2[] = [[cx - a * 1.06, hc + 0.62 * b]];
    for (let i = 0; i <= 18; i++) { const t = Math.PI + (Math.PI * i) / 18; fr.push([cx + Math.cos(t) * a * 1.07, hc - 0.02 * b + Math.sin(t) * b * 1.06]); }
    const st = o.hairStyle ?? "long", lk = st === "long" ? 0.62 : st === "bob" ? 0.5 : 0.0, side = o.hairStyle === "ponytail" || o.hairStyle === "bun";
    if (side) fr[0] = [cx - a * 1.06, hc + 0.05 * b];
    fr.push([cx + a * 1.06, hc + (side ? 0.05 : lk) * b]);
    if (!side) fr.push([cx + a * 0.82, hc + (lk - 0.04) * b], [cx + a * 0.8, hc + 0.05 * b]);
    fr.push([cx + a * 0.55, hc - 0.38 * b], [cx + a * 0.18, hc - 0.6 * b], [cx, hc - 0.5 * b], [cx - a * 0.18, hc - 0.6 * b], [cx - a * 0.55, hc - 0.38 * b]);
    if (!side) fr.push([cx - a * 0.8, hc + 0.05 * b], [cx - a * 0.82, hc + (lk - 0.04) * b]);
    p.shadedFill(fr, hair, mul(hair, SH_FELT), light, a, 0.35);
    p.stroke([[cx, hc - 0.5 * b], [cx, hc - 0.98 * b]], 1.6 * u, mul(hair, [2.2, 2.2, 2.2]));
    for (const s of [-1, 1]) { p.stroke([[cx + s * a * 0.2, hc - 0.8 * b], [cx + s * a * 0.7, hc - 0.45 * b]], 1.3 * u, mul(hair, [1.9, 1.9, 1.9])); if (!side) p.stroke([[cx + s * a * 0.95, hc - 0.2 * b], [cx + s * a * 0.94, hc + (lk - 0.12) * b]], 1.3 * u, mul(hair, [1.9, 1.9, 1.9])); }
    p.poly(fr, null, ow * 0.9);
    if (o.jewel) { p.stroke([[cx, hc - 0.98 * b], [cx, hc - 0.62 * b]], 1.4 * u, "#e8b84a"); p.ell(cx, hc - 0.58 * b, 4.5 * u, 5 * u, "#e8b84a", 1.4 * u); p.ell(cx, hc - 0.58 * b, 2 * u, 2.2 * u, "#d1202f", 0); }
  } else hatOn(p, o.hat === "jata" ? { ...o, hat: "hair" } : o, hp, H, 300, hc, light, seed, facing, false);
  if (o.hat === "jata") { // matted hair tied in a bun on top
    p.ell(300, crown - 0.02 * HH, 0.38 * H.a, 0.2 * HH, o.hair ?? "#2a1d18", ow * 0.8);
    p.stroke([[300 - 0.3 * H.a, crown + 0.06 * HH], [300 + 0.3 * H.a, crown + 0.06 * HH]], 3 * u, "#e8b84a");
  }
  const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap" && o.hat !== "longHair" && o.hat !== "jata";
  faceFront(p, 300, hc, W, expr, facing, look, lid, brim, skin, o.moustache, o.build === "stout",
    { eyeDy: pn === "phone" || pn === "book" ? 4 : 0, sparkle: opts.sparkleEyes, mouthOpen: opts.mouthOpen, scale: refHead ? 0.88 : 1 });
  const fxX = 300 + 7 * u * fsc * facing, blush = clamp(opts.blush ?? 0, 0, 1), tears = clamp(opts.tears ?? 0, 0, 1);
  if (blush > 0) for (const s of [-1, 1]) {
    const bx = fxX + s * 27 * u * fsc, by = hc + 11 * u * fsc;
    p.ell(bx, by, 9 * u, 5 * u, `rgba(255,105,130,${(0.55 * blush).toFixed(3)})`, 0);
    if (blush > 0.5) for (const k of [-1, 0, 1]) p.stroke([[bx + (k * 4 - 1.5) * u, by + 2 * u], [bx + (k * 4 + 1.5) * u, by - 2 * u]], 1.1 * u, "rgba(200,60,90,0.7)");
  }
  if (tears > 0) for (const s of [-1, 1]) { // streams down the cheeks from under the eyes
    const x = fxX + s * 13 * u * fsc, y0 = hc + 6 * u * fsc, L = (10 + 34 * tears) * u;
    const st = curve([x, y0], [x + s * 3 * u, y0 + L * 0.5], [x + s * 5 * u, y0 + L], 8);
    inked(p, st, 4.2 * u, "#8fd3ff", 1.1 * u);
    if (tears > 0.4) drop(p, x + s * 6 * u, y0 + L + 8 * u, 3.2 * u, "#8fd3ff", 1.1 * u);
  }
  if (o.bindi) p.ell(300 + 7 * u * facing, hc - 15 * u, 3.2 * u, 3.6 * u, "#d1202f", 0);
  if (o.hat === "longHair" && o.jewel) for (const s of [-1, 1]) { // jhumka earrings
    const ex = 300 + s * H.a * 0.98, ey = hc + 0.3 * H.b;
    p.stroke([[ex, ey], [ex, ey + 7 * u]], 1.2 * u, "#c9962e"); p.poly([[ex - 5 * u, ey + 13 * u], [ex, ey + 6 * u], [ex + 5 * u, ey + 13 * u]], "#f2c14e", 1.2 * u);
    for (const dx of [-4, 0, 4]) p.dot(ex + dx * u, ey + 15 * u, 1.6 * u, "#f2c14e");
  }
  if (o.beard) { // full beard framing the chin, mouth left visible
    const bd: P2[] = [];
    for (let i = 0; i <= 16; i++) { const a = rad(-10 + (200 * i) / 16); bd.push([300 + Math.cos(a) * 0.86 * H.a, hc + 6 * u + Math.sin(a) * 0.95 * H.b]); }
    bd.push([300 - 0.6 * H.a, hc + 16 * u], [300 - 12 * u, hc + 15 * u], [300, hc + 13 * u], [300 + 12 * u, hc + 15 * u], [300 + 0.6 * H.a, hc + 16 * u]);
    p.shadedFill(bd, o.beard, mul(o.beard, SH_FELT), light, H.a, 0.4);
    p.poly(bd, null, ow * 0.8);
    p.ell(300 + 8 * u * facing, hc + 22 * u, 7 * u, 4 * u, "#5a1e28", 2 * u);
  }
  if (prop === "binoculars") { // binoculars over the eyes, hands on the barrels
    for (const side of [-1, 1]) { p.ell(300 + side * 14 * u, hc - 2 * u, 12 * u, 13 * u, "#2b2e33", 2.6 * u); p.ell(300 + side * 14 * u, hc - 2 * u, 6 * u, 6.5 * u, "#5d7a9a", 1.6 * u); }
    p.poly([[300 - 4 * u, hc - 8 * u], [300 + 4 * u, hc - 8 * u], [300 + 4 * u, hc + 2 * u], [300 - 4 * u, hc + 2 * u]], "#2b2e33", 1.6 * u);
    for (const side of [-1, 1]) p.dot(300 + side * 24 * u, hc + 8 * u, 6 * u);
  }
  if (prop === "earCup") p.dot(300 + 1.05 * H.a + 6 * u, chin - 0.9 * H.b, 7 * u);
  if (prop === "phoneEar") { // phone pressed to the ear, over the head edge, hand on it
    const ex = 300 + 0.98 * H.a + 3 * u, ey = chin - 0.95 * H.b;
    p.poly([[ex - 6 * u, ey - 26 * u], [ex + 7 * u, ey - 24 * u], [ex + 8 * u, ey + 8 * u], [ex - 5 * u, ey + 6 * u]], "#22232b", 2.6 * u);
    if (glow > 0) p.poly([[ex - 3.5 * u, ey - 22 * u], [ex + 5 * u, ey - 21 * u], [ex + 5.5 * u, ey + 3 * u], [ex - 3 * u, ey + 2 * u]], mix("#22232b", "#d9f2ff", glow * 0.6), 0);
    p.dot(ex + 3 * u, ey - 2 * u, 6 * u);
  }
  const headC = p.P(300, hc);
  p.rot = bodyRot;
  drawProp("head");
  if (!NO_FLOAT) floaters(p, headC, H.a, opts, Math.max(hatTop(o), pn === "umbrella" ? 2.1 : pn === "pot" ? 1.9 : pn === "basket" ? 1.5 : 1));
  p.rot = null;
  return { head: headC, r: H.a };
};

/** rough height of the head-gear above the head centre, in head half-widths (for "?" / "!" placement) */
const hatTop = (o: Outfit) => ({ tophat: 2.3, shako: 1.7, shako_tall: 1.9, crown: 2.0, crownEU: 1.5, helmK: o.cap ? 1.9 : 1.1, turban: 1.2, fedora: 1.3, peaked: 1.3 } as Record<string, number>)[o.hat ?? ""] ?? 1;

export type SideOpts = {
  phase?: number; expr?: Expr; mode?: "march" | "stand" | "swing" | "push"; blink?: boolean | number; stomp?: number; pose?: number;
  /** step length as a multiple of 0.8 m (370 units): matches 1.6 m/s at 2 steps/s; scale by the view's foreshortening */
  stride?: number; light?: number; seed?: number;
  /** push mode: where the hands land at pose 1, in final canvas units (e.g. the swing kid's back) */
  hand?: [number, number];
};

/** two-bone leg, knee bending forward (+x) */
const ik = (hip: P2, ank: P2, l1: number, l2: number): P2 => {
  const dx = ank[0] - hip[0], dy = ank[1] - hip[1], d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.01);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), k = Math.atan2(dy, dx) - A;
  return [hip[0] + l1 * Math.cos(k), hip[1] + l1 * Math.sin(k)];
};

/** hip height of the seated kid in `swing` mode (design units); swingKid seats the torso bottom on the plank */
const SWING_HIP = 733;

/** side view facing screen-right; march footfalls land at phase 0 (near foot) and 0.5 (far foot), like the front view.
 *  The stance foot is planted: it slides back at exactly the walking speed while the hip rises and falls over it. */
export const bodySide = (p: Pen, o: Outfit, opts: SideOpts) => {
  const { phase = 0, expr = "neutral", mode = "march", blink = false, stomp = 1, pose = 0, stride = 1, light = DEF_LIGHT, seed = 1 } = opts;
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
  const H: Blob = { ...headBlob(seed, Bd.a, 1), asym: 0.12, rot: rad(3 + 3 * (rnd(seed, 7) - 0.5)) };
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, sole = 975, ankY = sole - 4 * u;
  const thick = thickAngle(light), ow = 5 * u;
  const legLen = (Bd.legs + 0.12) * HH - 4 * u, l1 = legLen / 2, l2 = legLen / 2;
  const nearCol = mix(o.pants, INK, 0.55), farCol = mix(o.pants, INK, 0.75), footCol = o.boots;
  type LegS = { ank: P2; pitch: number; near: boolean };
  const legs: LegS[] = [];
  let hipY = ankY - legLen * 0.995, lean = 0, nearFwd = 0;
  if (mode === "march") {
    const S = 370 * stride, liftH = Math.max(22, 40 + 70 * (stomp - 1));
    const st = (ph: number) => {
      const c = (((phase + ph) % 1) + 1) % 1;
      if (c < 0.5) { const s = c / 0.5; return { x: S / 2 - S * s, h: 0, stance: true, s }; }
      const s = (c - 0.5) / 0.5; // swing: cycloid in world space, so the foot leaves and lands at zero ground speed
      return { x: -S / 2 + S * s - (S / Math.PI) * Math.sin(2 * Math.PI * s), h: liftH * Math.sin(Math.PI * s), stance: false, s };
    };
    const nL = st(0), fL = st(0.5), stance = nL.stance ? nL : fL;
    const Leff = legLen * (1 - 0.035 * Math.sin(Math.PI * stance.s));
    hipY = ankY - Math.sqrt(Math.max(1, Leff * Leff - stance.x * stance.x));
    for (const [L, near] of [[fL, false], [nL, true]] as const)
      legs.push({ ank: [300 + L.x, ankY - L.h], pitch: L.stance ? 0 : rad(35 * Math.sin(Math.PI * L.s) * (1 - 1.6 * L.s)), near });
    lean = 4 + 3 * Math.cos(2 * two * phase); // 7 deg at contact, 1 deg at passing
    nearFwd = nL.x / (S / 2);
  } else if (mode === "push") {
    hipY = ankY - 0.87 * legLen;
    legs.push({ ank: [300 - 0.5 * legLen, ankY], pitch: rad(-8), near: false }, { ank: [300 + 0.32 * legLen, ankY], pitch: 0, near: true });
    lean = 14 * pose;
  } else if (mode === "swing") {
    hipY = SWING_HIP;
    const a = rad(60 * pose);
    for (const [dx, near] of [[-6, false], [0, true]] as const) {
      const knee: P2 = [300 + l1 * 0.98 + dx * u, hipY + 6 * u];
      legs.push({ ank: [knee[0] + l2 * Math.sin(a), knee[1] + l2 * Math.cos(a)], pitch: -a * 0.5, near });
    }
  } else {
    legs.push({ ank: [300 - 4 * u, ankY], pitch: 0, near: false }, { ank: [300 + 4 * u, ankY], pitch: 0, near: true });
  }
  const torsoBot = hipY + 0.12 * HH, chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hip: P2 = [300, hipY];
  p.rot = null;
  for (const L of legs) {
    const knee = mode === "swing" ? ([300 + l1 * 0.98 + (L.near ? 0 : -6 * u), hipY + 6 * u] as P2) : ik(hip, L.ank, l1, l2);
    const hp0: P2 = [300 + (L.near ? 0 : -5 * u), hipY];
    p.stroke([hp0, knee, L.ank], 5.8 * u, L.near ? nearCol : farCol);
    const c = Math.cos(L.pitch), s = Math.sin(L.pitch);
    footStroke(p, [L.ank[0] - 3 * u * c, L.ank[1] - 3 * u * s], [L.ank[0] + 13 * u * c, L.ank[1] + 13 * u * s + 0.5 * u],
      7.5 * u, L.near ? footCol : footCol === INK ? INK : shade(footCol, 0.82));
  }
  // ---- upper body leans about the hip ----
  p.rot = lean ? [rad(lean), 300, hipY] : null;
  const T: Blob = { a: (o.build === "stout" ? 0.36 : 0.31) * W, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.5, egg: 0.1, asym: 0.06,
    rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 2 * u, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const armCol = mix(o.jacket, INK, 0.5), farArm = mix(o.jacket, INK, 0.68);
  const S: P2 = [tcx + 0.05 * T.a, chin + 0.14 * HH], aLen = 0.95 * HH;
  const swingArm = (ang: number): [P2, P2, P2] => {
    const e: P2 = [S[0] + Math.sin(ang) * aLen * 0.5, S[1] + Math.cos(ang) * aLen * 0.5], a2 = ang + rad(16) * Math.sign(ang || 1);
    return [S, e, [e[0] + Math.sin(a2) * aLen * 0.5, e[1] + Math.cos(a2) * aLen * 0.5]];
  };
  const rifle = !!o.rifle && (mode === "march" || mode === "stand");
  const B0: P2 = [tcx + 0.72 * T.a, chin + 0.58 * HH], B1: P2 = [tcx - 0.95 * T.a - 22 * u, crown - 0.4 * HH];
  let near: [P2, P2, P2], far: [P2, P2, P2] | null;
  if (mode === "swing") { near = [S, [S[0] + 12 * u, S[1] - 0.16 * HH], [300 + 6 * u, chin - 0.3 * HH]]; far = [S, [S[0] + 8 * u, S[1] - 0.18 * HH], [300 + 2 * u, chin - 0.36 * HH]]; }
  else if (mode === "push") {
    const reach = 0.55 * HH + 0.45 * HH * pose;
    let hN: P2 = [S[0] + reach, S[1] + 0.06 * HH];
    if (opts.hand) {
      // target is in final canvas units; the arm is drawn inside the lean rotation, so undo it
      const th = -rad(lean), dx = opts.hand[0] - 300, dy = opts.hand[1] - hipY;
      const tg: P2 = [300 + dx * Math.cos(th) - dy * Math.sin(th), hipY + dx * Math.sin(th) + dy * Math.cos(th)];
      hN = [hN[0] + (tg[0] - hN[0]) * pose, hN[1] + (tg[1] - hN[1]) * pose];
    }
    near = [S, [(S[0] + hN[0]) / 2, (S[1] + hN[1]) / 2 + 0.06 * HH], hN];
    far = [S, [(S[0] + hN[0]) / 2 - 4 * u, (S[1] + hN[1]) / 2 - 0.02 * HH], [hN[0] - 6 * u, hN[1] - 0.08 * HH]];
  } else if (rifle) { near = [S, [S[0] - 4 * u, S[1] + 0.42 * HH], B0]; far = mode === "march" ? swingArm(rad(30) * nearFwd) : swingArm(0); }
  else { near = swingArm(rad(-30) * nearFwd); far = mode === "march" ? swingArm(rad(30) * nearFwd) : null; }
  if (far) { p.stroke(curve(far[0], far[1], far[2]), 5.2 * u, farArm); p.dot(far[2][0], far[2][1], 5.5 * u); }
  p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
  p.clip(tp, () => {
    if (o.belt) p.band([[tcx - 0.65 * T.a, chin - 0.05 * HH], [tcx + 0.75 * T.a, torsoBot - 0.1 * HH]], o.belt!, 5.5 * u, 1.8 * u);
    if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
    if (!o.dress) for (let i = 0; i < 3; i++) { const y = chin + 0.16 * HH + i * 0.24 * HH; p.dot(tcx + 0.8 * T.a, y, 3 * u, INK); p.dot(tcx + 0.8 * T.a, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7)); }
  });
  p.inkRing(tp, ow, thick);
  if (rifle) {
    p.band([B0, B1], "#7a4b2a", 5 * u, 1.5 * u, "round");
    p.band([lerp2(B0, B1, 0.6), B1], "#8d949c", 2.4 * u, 1.2 * u, "round");
  }
  p.stroke(curve(near[0], near[1], near[2]), 5.2 * u, armCol); p.dot(near[2][0], near[2][1], 5.5 * u);
  // ---- head ----
  const hx = 300 + 4 * u;
  hatBehind(p, o, H, hx, hc, light, thick, ow, true);
  const hp = blobPts(hx, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  hatOn(p, o, hp, H, hx, hc, light, seed, 1, true);
  const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
  faceSide(p, hx, hc, W, expr, lid, brim, skin, o.moustache, o.build === "stout");
  p.rot = null;
};

/** rope + seat + seated kid on a 700 x 2300 canvas; the pivot is design (350, 20); kid drawn at 0.92 scale */
export const swingKid = (p: Pen, o: Outfit, kick: number, expr: Expr, light = DEF_LIGHT, blink: number = 0) => {
  const rope = 1830, k = 1.1, HH = 2 * headBlob(5, BUILD[o.build ?? "adult"].a, 1).b;
  // two ropes from the pivot to the ends of a wide plank, the kid framed between them: a single rope behind the kid
  // ended at the cap and read as a hanging. Far rope behind the kid, near rope drawn over (clear of the face).
  const seat = rope + 18, x0 = 150, x1 = 550;
  p.line([[350, 20], [x0 + 16, seat + 4]], "#a07a4c", 10);
  p.poly(rrect(x0, seat, x1, seat + 36, 10), "#b5653f", 9);
  const g = p.g;
  g.save();
  g.translate(350 - 300 * k, rope + 18 - (SWING_HIP + 0.12 * HH) * k);
  g.scale(k, k);
  bodySide(new Pen(g), o, { expr, mode: "swing", pose: kick, light, seed: 5, blink });
  g.restore();
  p.line([[350, 20], [x1 - 16, seat + 4]], "#a07a4c", 10);
};

// ---------------- effects ----------------
export const fxNote = (p: Pen, kind: number, col = "#1f2a44") => {
  p.ell(70, 200, 46, 34, col, 8, 0, 360, -20);
  p.stroke([[110, 190], [110, 40]], 14);
  if (kind === 0) p.poly([[110, 40], [170, 70], [170, 110], [110, 82]], col, 8);
  else {
    p.ell(150, 170, 40, 30, col, 8, 0, 360, -20);
    p.stroke([[186, 160], [186, 20]], 14);
    p.poly([[110, 40], [186, 20], [186, 50], [110, 70]], col, 8);
  }
};

/** spark / impact star on a 500 x 500 canvas; t in 0..1 */
export const fxBurst = (p: Pen, t: number, col = "#fff3b0", rays = 10, r0 = 40, r1 = 230) => {
  const c = 250, e = 1 - (1 - t) ** 3;
  for (let i = 0; i < rays; i++) {
    const a = rad((i * 360) / rays + 7 * (i % 2)), ra = r0 + (r1 - r0) * e * (0.75 + 0.25 * (i % 2));
    p.poly([[c + r0 * 0.5 * Math.cos(a + 0.18), c + r0 * 0.5 * Math.sin(a + 0.18)], [c + ra * Math.cos(a), c + ra * Math.sin(a)],
      [c + r0 * 0.5 * Math.cos(a - 0.18), c + r0 * 0.5 * Math.sin(a - 0.18)]], col, Math.max(3, 8 * (1 - t)));
  }
  if (t < 0.5) p.ell(c, c, r0 * (1.4 - t), r0 * (1.4 - t), WHITE, 8);
};

/** water splash crown on an 800 x 800 canvas; t in 0..1 */
export const fxSplash = (p: Pen, t: number) => {
  const c = 400, size = 800, rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
  const blue = "#bfe8ff", deep = "#6cc0f0";
  if (rise > 0.02) {
    const pts: P2[] = [];
    for (let i = 0; i < 19; i++) {
      const h = (i % 2 ? 260 : 130) * rise * (0.7 + 0.3 * Math.sin(i * 1.7));
      pts.push([c - 330 + (660 * i) / 18, size - 120 - h]);
    }
    p.poly([...pts, [c + 330, size - 90], [c - 330, size - 90]], blue, 10);
    p.ell(c, size - 100, 360, 46, deep, 10);
  }
  for (let i = 0; i < 8; i++) {
    const a = rad(200 + i * 18), d = 120 + 380 * t, y = size - 160 + d * Math.sin(a) + 520 * t * t, r = 26 * (1 - t) + 6;
    if (t > 0.08 && y < size - 40) p.ell(c + d * Math.cos(a), y, r, r * 1.25, blue, 7);
  }
};

/** dust puff on a 300 x 300 canvas; t in 0..1 */
export const fxPuff = (p: Pen, t: number) => {
  for (let i = 0; i < 5; i++) {
    const a = rad(160 + i * 55), d = 40 + 70 * t, r = (34 + 20 * (i % 2)) * (1 - 0.6 * t);
    p.ell(150 + d * Math.cos(a), 180 + d * 0.45 * Math.sin(a), r, r * 0.8, `rgba(238,225,205,${(1 - t).toFixed(3)})`, 0);
  }
};

/** circling stars on a 420 x 210 canvas */
export const fxStars = (p: Pen, t: number) => {
  for (let i = 0; i < 4; i++) {
    const a = t * Math.PI * 2 + (i * Math.PI) / 2, x = 210 + 150 * Math.cos(a), y = 110 + 40 * Math.sin(a), pts: P2[] = [];
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 14 : 34, b = rad(k * 36 - 90); pts.push([x + r * Math.cos(b), y + r * Math.sin(b)]); }
    p.poly(pts, "#ffd84a", 6);
  }
};

/** three jittering strain ticks on a 300 x 300 canvas */
export const fxCreak = (p: Pen, t: number) => {
  const j = 6 * Math.sin(t * 40);
  for (const a of [-30, 0, 30]) {
    const b = rad(a - 90);
    p.stroke([[150 + 70 * Math.cos(b) + j, 230 + 70 * Math.sin(b)], [150 + 100 * Math.cos(b) + 10 + j, 230 + 100 * Math.sin(b)],
      [150 + 130 * Math.cos(b) + j, 230 + 130 * Math.sin(b)]], 10);
  }
};

/** flat water ring (drawn top-down) on a 600 x 600 canvas; t in 0..1 */
export const fxRing = (p: Pen, t: number) => {
  // thin light water rings (white crest, pale blue trailing rings), thinning as they spread
  const g = p.g;
  for (let k = 0; k < 3; k++) {
    const u = t - k * 0.22;
    if (u <= 0 || u >= 1) continue;
    g.beginPath(); g.ellipse(300, 300, 60 + 230 * u, 60 + 230 * u, 0, 0, Math.PI * 2);
    g.strokeStyle = k === 0 ? "#f6fcff" : "#cfe8fa"; g.lineWidth = 9 * (1 - u) + 3; g.stroke();
  }
};

/** text-free sign on a 700 x 520 canvas: "no marching in step on the bridge". A bridge (deck + arch + piers), four
 *  identical pairs of marching legs in the same stride (in step), a bold red X over all of it. */
export const fxSign = (p: Pen) => {
  const g = p.g, RED = "#d42f2f";
  p.poly(rrect(14, 14, 686, 506, 40), "#f6ecd2", 0);
  p.poly(rrect(14, 14, 686, 506, 40), null, 14);
  // bridge: deck, stone arch underneath, two piers
  p.poly(rrect(70, 352, 630, 384, 8), "#8a5a3a", 9);
  g.beginPath(); g.moveTo(112, 470); g.quadraticCurveTo(350, 300, 588, 470);
  g.strokeStyle = INK; g.lineWidth = 16; g.lineCap = "round"; g.stroke();
  for (const x of [88, 612]) p.poly(rrect(x - 16, 384, x + 16, 470, 4), "#8a5a3a", 9);
  // four identical soldiers' legs mid-stride: same leg forward on every one = in step
  for (const x of [150, 278, 406, 534]) {
    p.poly(rrect(x - 30, 150, x + 30, 214, 14), "#357650", 9);                  // coat hem
    p.stroke([[x - 8, 210], [x + 34, 262], [x + 46, 338]], 15, INK);           // front leg
    p.stroke([[x + 6, 210], [x - 12, 274], [x - 36, 336]], 15, INK);           // back leg
    p.poly(rrect(x + 30, 330, x + 74, 350, 9), INK, 0);                          // boots point forward
    p.poly(rrect(x - 52, 328, x - 8, 348, 9), INK, 0);
  }
  // big red X
  for (const [a, b] of [[[96, 70], [604, 452]], [[604, 70], [96, 452]]] as [[number, number], [number, number]][]) {
    p.stroke([a, b], 58, "#ffffff");
    p.stroke([a, b], 42, RED);
  }
};

/** soft cartoon cloud on a 600 x 300 canvas */
export const fxCloud = (p: Pen, seed: number) => {
  const blobs: [number, number, number][] = [[150, 190, 80], [250, 150, 105], [360, 160, 95], [450, 195, 70], [300, 210, 90]];
  for (const [x, y, r] of blobs) p.ell(x + ((seed * 37) % 20) - 10, y, r, r * 0.8, "#ffffff", 0);
  p.ell(300, 235, 230, 40, "#ffffff", 0);
};

/** cast shadow on a 128 x 256 canvas: dark soft contact pool at the feet (y 205) and a softer tail that runs up the
 *  canvas = away from the sun, fading with distance; multiply colour (sRGB-encoded linear ratio), white = no change */
export const fxShadow = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 256);
  g.save(); g.filter = "blur(9px)";
  const lg = g.createLinearGradient(0, 205, 0, 22);
  lg.addColorStop(0, mix(col, WHITE, 0.08)); lg.addColorStop(0.55, mix(col, WHITE, 0.3)); lg.addColorStop(1, mix(col, WHITE, 0.85));
  g.fillStyle = lg;
  g.beginPath(); g.moveTo(40, 205); g.bezierCurveTo(36, 120, 46, 50, 64, 30); g.bezierCurveTo(82, 50, 92, 120, 88, 205); g.closePath(); g.fill();
  g.fillStyle = col; g.beginPath(); g.ellipse(64, 205, 30, 17, 0, 0, Math.PI * 2); g.fill();
  g.restore();
};

/** tight contact shadow right under the feet on a 128 x 128 canvas: dark core, short fall-off (multiply colour) */
export const fxContact = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.32, 0.02], [0.5, 0.22], [0.66, 0.58], [0.82, 0.88], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};

/** floating wooden plank, side-on, on a 320 x 110 canvas */
export const fxPlank = (p: Pen) => {
  p.poly(rrect(14, 30, 306, 78, 10), "#a8744a", 9);
  p.line([[40, 46], [150, 44], [270, 50]], "#7d5234", 4);
  p.line([[60, 62], [200, 64], [284, 60]], "#7d5234", 4);
  p.dot(36, 54, 5, INK); p.dot(284, 54, 5, INK);
};

/** floating marching drum (no text) on a 260 x 240 canvas: white shell, red hoops, ink zig-zag cord */
export const fxDrum = (p: Pen) => {
  p.poly(rrect(40, 70, 220, 190, 16), "#f1ece0", 9);
  p.poly(rrect(32, 58, 228, 86, 12), "#c9373a", 8);
  p.poly(rrect(32, 176, 228, 204, 12), "#c9373a", 8);
  p.line([[52, 88], [82, 172], [112, 88], [142, 172], [172, 88], [202, 172]], INK, 6);
  p.ell(130, 58, 98, 18, "#f7f3ea", 8);
};

/** soft ground contact blob on a 128 x 128 canvas, multiply colour (sRGB-encoded linear ratio) in the centre */
export const fxBlob = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 128);
  // soft contact shadow: flat core, then a long smooth (roughly gaussian) fall-off to white = no change
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.5, 0.04], [0.64, 0.18], [0.76, 0.42], [0.87, 0.72], [0.95, 0.92], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};
