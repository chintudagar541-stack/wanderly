// Costume "gear" for the toon cards (first used by Shadow Blade 47): long coats with collars / lapels / hoods, inner
// shirts and ties, tactical vests and harness straps, gear belts, scarves, shoulder armour; hair styles (spiky, slick,
// mohawk, undercut, braid, bald); face pieces (scar, eyepatch, cloth mask, goggles, glasses, headphones, earpiece,
// neck tattoo); held or carried weapons (katana, knives, pistol(s), cane, fan, laptop, rifle / katana on the back).
// bodyFront() calls the four layers at the right moments: back (behind the torso), coat (over the legs, under the
// torso), torso (on the torso) and head (after the face). Everything is drawn with the same ink + shading as the body.
import type { Pen, Blob, Outfit } from "./toon";

type P2 = [number, number];
export type Gear = {
  hair?: { style: "spiky" | "slick" | "mohawk" | "undercut" | "braid" | "bald"; color: string; streak?: string };
  coat?: { color: string; long?: boolean; collar?: "high" | "lapel" | "hood"; lining?: string; trim?: string };
  shirt?: string; tie?: string; vest?: string; straps?: string; belt?: string; scarf?: string; armor?: string; badge?: boolean;
  scar?: boolean; eyepatch?: boolean; mask?: string; goggles?: string; glasses?: "round" | "shades"; headphones?: string; earpiece?: boolean; tattoo?: boolean;
  back?: "katana" | "rifle";
  hold?: "katana" | "knives" | "pistol" | "pistols" | "cane" | "fan" | "laptop";
  hood?: string;
};
export type GearCtx = {
  p: Pen; o: Outfit; g: Gear; u: number; HH: number; H: Blob; tcx: number; T: Blob; chin: number; torsoBot: number; hipY: number; sole: number;
  hc: number; crown: number; facing: number; light: number; thick: number; ow: number; back: boolean; ink: string;
  hands: P2[]; mul: (c: string, m: [number, number, number]) => string;
};
const SH: [number, number, number] = [0.64, 0.66, 0.74];
const steel = "#cfd6de", steelD = "#8a96a4", hilt = "#2a2230";

/** behind the torso: a katana or rifle slung across the back, and the hood's back */
export const gearBack = (c: GearCtx) => {
  const { p, g, u, HH, tcx, T, chin, torsoBot } = c;
  if (g.back === "katana") {
    const a: P2 = [tcx - 1.25 * T.a, torsoBot + 0.05 * HH], b: P2 = [tcx + 1.05 * T.a, chin - 0.55 * HH];
    p.band([a, [a[0] + (b[0] - a[0]) * 0.68, a[1] + (b[1] - a[1]) * 0.68]], "#1a1820", 9 * u, 1.6 * u);              // scabbard
    p.band([[a[0] + (b[0] - a[0]) * 0.7, a[1] + (b[1] - a[1]) * 0.7], b], hilt, 7 * u, 1.6 * u, "round");          // grip
    for (let k = 0; k < 5; k++) { const t = 0.74 + k * 0.05; p.dot(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 2 * u, "#8a1c24"); }
  }
  if (g.back === "rifle") {
    const a: P2 = [tcx + 1.2 * T.a, torsoBot + 0.25 * HH], b: P2 = [tcx - 1.0 * T.a, chin - 0.75 * HH];
    p.band([a, b], "#2c3036", 8 * u, 1.6 * u);
    p.band([[a[0] + (b[0] - a[0]) * 0.55, a[1] + (b[1] - a[1]) * 0.55], [a[0] + (b[0] - a[0]) * 0.62, a[1] + (b[1] - a[1]) * 0.62]], "#11141a", 15 * u, 1.6 * u);   // scope
  }
  if (g.hood || g.coat?.collar === "hood") {
    const col = g.hood ?? g.coat!.color;
    p.ell(300, c.hc + 2 * u, c.H.a * 1.22, c.H.b * 1.18, col, c.ow);
  }
};

/** over the legs, under the torso: long coat tails */
export const gearCoat = (c: GearCtx) => {
  const { p, g, u, HH, tcx, T, torsoBot, sole, light } = c;
  if (!g.coat) return;
  const col = g.coat.color, yb = g.coat.long ? sole - 0.12 * HH : torsoBot + 0.35 * HH, y0 = torsoBot - 0.35 * HH;
  for (const s of [-1, 1]) {
    const pts: P2[] = [[tcx + s * 0.1 * T.a, y0], [tcx + s * 1.02 * T.a, y0], [tcx + s * (1.18 * T.a + 6 * u), yb], [tcx + s * 0.08 * T.a, yb - 6 * u]];
    p.gradFill(pts, col, c.mul(col, SH), light); p.poly(pts, null, c.ow * 0.8);
    if (g.coat.lining) p.stroke([[tcx + s * 0.12 * T.a, y0 + 4 * u], [tcx + s * 0.1 * T.a, yb - 8 * u]], 3 * u, g.coat.lining);
    if (g.coat.trim) p.stroke([[tcx + s * (1.16 * T.a + 5 * u), yb - 3 * u], [tcx + s * 0.1 * T.a, yb - 8 * u]], 3.2 * u, g.coat.trim);
  }
};

/** on the torso: shirt + lapels / high collar, tie, vest, straps, belt, scarf, armour, badge */
export const gearTorso = (c: GearCtx, tp: P2[]) => {
  const { p, g, u, HH, tcx, T, chin, torsoBot, back } = c;
  if (back) return;
  const top = chin + 0.02 * HH, mid = chin + 0.5 * HH, bot = torsoBot - 0.05 * HH;
  p.clip(tp, () => {
    if (g.vest) { p.poly([[tcx - 0.95 * T.a, top + 0.12 * HH], [tcx + 0.95 * T.a, top + 0.12 * HH], [tcx + 1.05 * T.a, bot], [tcx - 1.05 * T.a, bot]], g.vest, 1.6 * u);
      for (const s of [-1, 1]) for (let k = 0; k < 2; k++) p.poly([[tcx + s * 0.3 * T.a, mid + k * 0.22 * HH], [tcx + s * 0.75 * T.a, mid + k * 0.22 * HH], [tcx + s * 0.75 * T.a, mid + k * 0.22 * HH + 0.16 * HH], [tcx + s * 0.3 * T.a, mid + k * 0.22 * HH + 0.16 * HH]], c.mul(g.vest, [0.8, 0.8, 0.8]), 1.4 * u); }
    if (g.shirt || g.coat) {
      const sh = g.shirt ?? "#f2f2f2", v = g.coat?.collar === "lapel" ? 0.62 : 0.38;
      p.poly([[tcx - 0.28 * T.a, top - 4 * u], [tcx + 0.28 * T.a, top - 4 * u], [tcx, top + v * HH]], sh, 1.4 * u);
      if (g.tie) p.poly([[tcx - 4 * u, top + 3 * u], [tcx + 4 * u, top + 3 * u], [tcx + 6 * u, top + (v - 0.05) * HH], [tcx, top + v * HH + 2 * u], [tcx - 6 * u, top + (v - 0.05) * HH]], g.tie, 1.4 * u);
    }
    if (g.coat) {
      const col = g.coat.color, dk = c.mul(col, [0.72, 0.72, 0.78]);
      if (g.coat.collar === "lapel") for (const s of [-1, 1]) p.poly([[tcx + s * 0.3 * T.a, top - 4 * u], [tcx + s * 0.62 * T.a, top + 0.05 * HH], [tcx + s * 0.38 * T.a, top + 0.2 * HH], [tcx + s * 0.06 * T.a, top + 0.66 * HH]], dk, 1.6 * u);
      p.stroke([[tcx + (g.coat.collar === "lapel" ? 0 : 3 * u), top + 0.38 * HH], [tcx, bot]], 1.6 * u, c.ink);
      if (g.coat.trim) for (const s of [-1, 1]) p.stroke([[tcx + s * 4 * u, top + 0.4 * HH], [tcx + s * 4 * u, bot]], 3 * u, g.coat.trim);
    }
    if (g.straps) for (const s of [-1, 1]) p.band([[tcx + s * 0.55 * T.a, top - 6 * u], [tcx + s * 0.35 * T.a, bot]], g.straps, 5 * u, 1.3 * u);
    if (g.straps) p.band([[tcx - 0.9 * T.a, mid - 0.04 * HH], [tcx + 0.9 * T.a, mid - 0.04 * HH]], g.straps, 4.5 * u, 1.3 * u);
    if (g.belt) { p.band([[tcx - 1.2 * T.a, bot - 0.1 * HH], [tcx + 1.2 * T.a, bot - 0.1 * HH]], g.belt, 7 * u, 1.4 * u);
      p.poly([[tcx - 5 * u, bot - 0.1 * HH - 5 * u], [tcx + 5 * u, bot - 0.1 * HH - 5 * u], [tcx + 5 * u, bot - 0.1 * HH + 5 * u], [tcx - 5 * u, bot - 0.1 * HH + 5 * u]], "#c9b26a", 1.4 * u);
      for (const s of [-1, 1]) p.poly([[tcx + s * 0.55 * T.a, bot - 0.1 * HH - 6 * u], [tcx + s * 0.8 * T.a, bot - 0.1 * HH - 6 * u], [tcx + s * 0.8 * T.a, bot - 0.1 * HH + 8 * u], [tcx + s * 0.55 * T.a, bot - 0.1 * HH + 8 * u]], c.mul(g.belt, [1.3, 1.3, 1.3]), 1.3 * u); }
    if (g.badge) p.poly([[tcx + 0.45 * T.a, mid], [tcx + 0.6 * T.a, mid - 6 * u], [tcx + 0.75 * T.a, mid], [tcx + 0.7 * T.a, mid + 10 * u], [tcx + 0.5 * T.a, mid + 10 * u]], "#e8c050", 1.3 * u);
    if (g.tattoo) for (let k = 0; k < 3; k++) p.stroke([[tcx - 0.2 * T.a + k * 6 * u, top - 2 * u], [tcx - 0.35 * T.a + k * 6 * u, top + 10 * u]], 2 * u, "#3a4a6a");
  });
  if (g.coat?.collar === "high") for (const s of [-1, 1]) p.poly([[tcx + s * 0.18 * T.a, top - 10 * u], [tcx + s * 0.78 * T.a, top - 16 * u], [tcx + s * 0.7 * T.a, top + 6 * u], [tcx + s * 0.22 * T.a, top + 10 * u]], c.mul(g.coat.color, [0.85, 0.85, 0.9]), 1.6 * u);
  if (g.scarf) { p.band([[tcx - 0.55 * T.a, top - 2 * u], [tcx + 0.55 * T.a, top - 2 * u]], g.scarf, 12 * u, 1.6 * u, "round"); p.band([[tcx + 0.3 * T.a, top + 2 * u], [tcx + 0.45 * T.a, top + 0.3 * HH]], g.scarf, 9 * u, 1.6 * u); }
  if (g.armor) p.ell(tcx - 0.92 * T.a, top + 4 * u, 0.42 * T.a, 0.14 * HH, g.armor, 1.8 * u, 180, 360);
};

/** after the face: hair styles, scar, patch, mask, goggles, glasses, headphones, hood rim, then held weapons */
export const gearHead = (c: GearCtx) => {
  const { p, g, u, H, hc, crown, facing, ink } = c;
  const a = H.a, b = H.b, fx = 300 + 7 * u * facing;
  const hr = g.hair;
  if (hr && !c.back) {
    const col = hr.color, dk = c.mul(col, [0.7, 0.7, 0.75]);
    if (hr.style === "spiky") { const pts: P2[] = [[300 - a * 1.0, hc - 0.05 * b]];
      for (let i = 0; i <= 8; i++) { const t = i / 8, x = 300 - a * 1.02 + 2.04 * a * t, yb = hc - Math.sqrt(Math.max(0, 1 - ((x - 300) / a) ** 2)) * b * 0.98; pts.push([x, yb - (i % 2 ? 0.0 : 0.32) * b]); }
      pts.push([300 + a * 1.0, hc - 0.05 * b], [300 + a * 0.55, hc - 0.42 * b], [300, hc - 0.5 * b], [300 - a * 0.55, hc - 0.42 * b]);
      p.shadedFill(pts, col, dk, c.light, a, 0.35); p.poly(pts, null, c.ow * 0.9);
      if (hr.streak) p.poly([[300 + a * 0.25, hc - 0.48 * b], [300 + a * 0.5, hc - 1.25 * b], [300 + a * 0.55, hc - 0.44 * b]], hr.streak, 1.4 * u); }
    if (hr.style === "slick") { const pts: P2[] = [[300 - a * 0.98, hc - 0.1 * b]]; for (let i = 0; i <= 12; i++) { const t = i / 12, ang = Math.PI + Math.PI * t; pts.push([300 + Math.cos(ang) * a * 1.02, hc + Math.sin(ang) * b * 1.02 - 2 * u]); }
      pts.push([300 + a * 0.98, hc - 0.1 * b], [300 + a * 0.4, hc - 0.55 * b], [300 - a * 0.3, hc - 0.62 * b]);
      p.shadedFill(pts, col, dk, c.light, a, 0.35); p.poly(pts, null, c.ow * 0.9);
      for (let k = 0; k < 4; k++) p.stroke([[300 - a * 0.6 + k * a * 0.35, hc - 0.85 * b], [300 - a * 0.2 + k * a * 0.35, hc - 0.6 * b]], 1.3 * u, c.mul(col, [1.5, 1.5, 1.5])); }
    if (hr.style === "mohawk") p.poly([[300 - 9 * u, hc - 0.85 * b], [300 - 5 * u, crown - 0.45 * b], [300 + 4 * u, crown - 0.55 * b], [300 + 10 * u, hc - 0.85 * b]], col, 1.6 * u);
    if (hr.style === "undercut") { p.poly([[300 - a * 0.9, hc - 0.45 * b], [300 - a * 0.4, crown - 0.25 * b], [300 + a * 0.7, crown - 0.15 * b], [300 + a * 0.95, hc - 0.35 * b], [300, hc - 0.6 * b]], col, 1.6 * u);
      for (const s of [-1, 1]) p.ell(300 + s * a * 0.9, hc - 0.15 * b, a * 0.12, b * 0.35, c.mul(col, [0.6, 0.6, 0.6]), 0); }
    if (hr.style === "braid") { p.ell(300, hc - 0.55 * b, a * 1.0, b * 0.5, col, 1.6 * u, 180, 360); for (let k = 0; k < 6; k++) p.ell(300 + a * 0.85 + k * 2 * u, hc + k * 0.32 * b, 7 * u, 9 * u, k === 5 ? (hr.streak ?? col) : col, 1.3 * u); }
  }
  if (g.scar) { p.stroke([[fx + 6 * u, hc - 0.55 * b], [fx + 20 * u, hc + 0.05 * b]], 2.2 * u, "#b2433f"); for (let k = 0; k < 3; k++) p.stroke([[fx + 8 * u + k * 5 * u, hc - 0.38 * b + k * 0.16 * b], [fx + 15 * u + k * 5 * u, hc - 0.44 * b + k * 0.16 * b]], 1.2 * u, "#b2433f"); }
  if (g.eyepatch) { p.stroke([[300 - a * 0.95, hc - 0.45 * b], [300 + a * 0.95, hc - 0.05 * b]], 2 * u, ink); p.ell(fx + 14 * u, hc - 4 * u, 11 * u, 9 * u, "#14141a", 1.4 * u); }
  if (g.mask) { const pts: P2[] = [[300 - a * 0.98, hc + 0.02 * b]]; for (let i = 0; i <= 12; i++) { const ang = Math.PI - Math.PI * (i / 12); pts.push([300 + Math.cos(ang) * a * 0.99, hc + 0.05 * b + Math.sin(ang) * b * 0.96]); }
    p.gradFill(pts, g.mask, c.mul(g.mask, SH), c.light); p.poly(pts, null, c.ow * 0.8); p.stroke([[300 - a * 0.3, hc + 0.45 * b], [300 + a * 0.3, hc + 0.45 * b]], 1.2 * u, c.mul(g.mask, [0.6, 0.6, 0.6])); }
  if (g.goggles) { p.stroke([[300 - a * 0.98, hc - 0.2 * b], [300 + a * 0.98, hc - 0.2 * b]], 5 * u, "#2a2a30"); for (const s of [-1, 1]) { p.ell(fx + s * 16 * u, hc - 0.2 * b, 13 * u, 11 * u, "#2a2a30", 1.6 * u); p.ell(fx + s * 16 * u, hc - 0.2 * b, 9 * u, 7.5 * u, g.goggles, 0); p.dot(fx + s * 16 * u - 3 * u, hc - 0.2 * b - 3 * u, 2.2 * u, "#ffffff"); } }
  if (g.glasses === "round") for (const s of [-1, 1]) { p.ell(fx + s * 15 * u, hc - 2 * u, 11 * u, 11 * u, null, 2 * u); if (s < 0) p.stroke([[fx - 4 * u, hc - 3 * u], [fx + 4 * u, hc - 3 * u]], 2 * u); }
  if (g.glasses === "shades") { p.poly([[fx - 28 * u, hc - 10 * u], [fx + 28 * u, hc - 10 * u], [fx + 25 * u, hc + 3 * u], [fx + 6 * u, hc + 4 * u], [fx, hc - 3 * u], [fx - 6 * u, hc + 4 * u], [fx - 25 * u, hc + 3 * u]], "#101018", 1.6 * u);
    p.stroke([[fx - 22 * u, hc - 7 * u], [fx - 14 * u, hc - 7 * u]], 2 * u, "#6a7a9a"); }
  if (g.headphones) { p.arc(300, hc - 0.1 * b, a * 1.05, b * 1.05, 190, 350, 6 * u, ink); p.arc(300, hc - 0.1 * b, a * 1.05, b * 1.05, 195, 345, 3.5 * u, g.headphones);
    for (const s of [-1, 1]) p.ell(300 + s * a * 1.0, hc + 0.05 * b, 9 * u, 15 * u, g.headphones, 1.6 * u); }
  if (g.earpiece) { p.ell(300 + a * 0.98, hc + 0.05 * b, 5 * u, 7 * u, "#2a2a30", 1.2 * u); p.stroke([[300 + a * 0.98, hc + 0.2 * b], [300 + a * 0.7, hc + 0.9 * b]], 1.4 * u, "#2a2a30"); }
  if (g.hood || g.coat?.collar === "hood") { const col = g.hood ?? g.coat!.color; p.arc(300, hc + 2 * u, a * 1.18, b * 1.14, 200, 340, 11 * u, ink); p.arc(300, hc + 2 * u, a * 1.18, b * 1.14, 203, 337, 7 * u, col); }
  // held weapons at the hands (hands[0] = left / far hand, hands[last] = right hand)
  const R = c.hands[c.hands.length - 1], L = c.hands[0];
  if (!R) return;
  if (g.hold === "katana") { const tip: P2 = [R[0] + 70 * u, R[1] + 118 * u]; p.band([[R[0] - 10 * u, R[1] - 16 * u], R], hilt, 7 * u, 1.4 * u, "round");
    p.poly([[R[0] - 9 * u, R[1] + 2 * u], [R[0] + 9 * u, R[1] - 4 * u], [R[0] + 11 * u, R[1] + 2 * u], [R[0] - 7 * u, R[1] + 8 * u]], "#c9a24a", 1.2 * u);
    p.poly([[R[0] - 2 * u, R[1] + 4 * u], [R[0] + 4 * u, R[1] + 2 * u], [tip[0] + 2 * u, tip[1] - 6 * u], tip], steel, 1.4 * u); p.stroke([[R[0] + 2 * u, R[1] + 6 * u], [tip[0] - 2 * u, tip[1] - 8 * u]], 1.2 * u, "#ffffff"); p.dot(R[0], R[1], 5.5 * u, ink); }
  if (g.hold === "knives") for (const H2 of [L, R]) { const s = H2 === R ? 1 : -1; p.poly([[H2[0], H2[1]], [H2[0] + s * 6 * u, H2[1] - 4 * u], [H2[0] + s * 30 * u, H2[1] + 26 * u], [H2[0] + s * 4 * u, H2[1] + 6 * u]], steel, 1.3 * u); p.dot(H2[0], H2[1], 5.5 * u, ink); }
  if (g.hold === "pistol" || g.hold === "pistols") for (const H2 of g.hold === "pistols" ? [L, R] : [R]) { const s = H2 === R ? 1 : -1;
    p.poly([[H2[0] - s * 4 * u, H2[1] - 8 * u], [H2[0] + s * 30 * u, H2[1] - 8 * u], [H2[0] + s * 30 * u, H2[1] - 1 * u], [H2[0] + s * 8 * u, H2[1] - 1 * u], [H2[0] + s * 6 * u, H2[1] + 12 * u], [H2[0] - s * 3 * u, H2[1] + 12 * u]], "#2a2d34", 1.4 * u); p.dot(H2[0], H2[1], 5.5 * u, ink); }
  if (g.hold === "cane") { p.band([[R[0], R[1]], [R[0] + 6 * u, c.sole - 2 * u]], "#1a1418", 5 * u, 1.3 * u, "round"); p.ell(R[0], R[1] - 4 * u, 8 * u, 6 * u, "#c9a24a", 1.4 * u); p.stroke([[R[0] + 3 * u, R[1] + 30 * u], [R[0] + 4 * u, R[1] + 50 * u]], 1.4 * u, steelD); }
  if (g.hold === "fan") { for (let k = -3; k <= 3; k++) { const ang = -Math.PI / 2 + k * 0.22; p.poly([[R[0], R[1]], [R[0] + Math.cos(ang - 0.11) * 46 * u, R[1] + Math.sin(ang - 0.11) * 46 * u], [R[0] + Math.cos(ang + 0.11) * 46 * u, R[1] + Math.sin(ang + 0.11) * 46 * u]], k % 2 ? "#d8b04a" : "#8a1c24", 1.2 * u); }
    p.arc(R[0], R[1], 46 * u, 46 * u, 205, 335, 3 * u, steel); p.dot(R[0], R[1], 5.5 * u, ink); }
  if (g.hold === "laptop") { const mx = (L[0] + R[0]) / 2, my = (L[1] + R[1]) / 2; p.poly([[mx - 34 * u, my - 34 * u], [mx + 34 * u, my - 34 * u], [mx + 32 * u, my + 6 * u], [mx - 32 * u, my + 6 * u]], "#3a3e48", 1.6 * u);
    p.poly([[mx - 28 * u, my - 29 * u], [mx + 28 * u, my - 29 * u], [mx + 27 * u, my + 1 * u], [mx - 27 * u, my + 1 * u]], "#5ad8a8", 0); for (let k = 0; k < 4; k++) p.stroke([[mx - 22 * u, my - 22 * u + k * 6 * u], [mx + (k % 2 ? 8 : 18) * u, my - 22 * u + k * 6 * u]], 1.6 * u, "#1a4a3a");
    p.poly([[mx - 36 * u, my + 6 * u], [mx + 36 * u, my + 6 * u], [mx + 40 * u, my + 12 * u], [mx - 40 * u, my + 12 * u]], "#5a5e68", 1.4 * u); for (const H2 of [L, R]) p.dot(H2[0], H2[1], 5.5 * u, ink); }
};
