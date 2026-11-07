// Premium typography for in-world text (signs, neon, billboards, screens). Owner, 2026-11-07: the default bold
// sans-serif looked cartoonish. Use these faces only, never the browser's "sans-serif" / "monospace":
//   display: Bebas Neue (tall condensed signage)  |  serif: Playfair Display (luxury, headlines, italic taglines)
//   ui: Inter (websites, emails, apps)            |  neon: Montserrat Light (thin glass-tube neon)
//   mono: JetBrains Mono (clocks, data screens)
// All SIL Open Font License 1.1, from the @fontsource packages; files in public/realism/fonts. Loaded by loadRealism().
import { staticFile } from "remotion";

export const FONT = { display: '"Bebas Neue"', serif: '"Playfair Display"', ui: "Inter", neon: "Montserrat", mono: '"JetBrains Mono"' } as const;
const FACES: [string, string, string, string?][] = [
  ["Bebas Neue", "bebas-neue-latin-400-normal", "400"], ["Playfair Display", "playfair-display-latin-700-normal", "700"], ["Playfair Display", "playfair-display-latin-900-italic", "900", "italic"],
  ["Inter", "inter-latin-400-normal", "400"], ["Inter", "inter-latin-600-normal", "600"], ["Inter", "inter-latin-800-normal", "800"],
  ["Montserrat", "montserrat-latin-300-normal", "300"], ["Montserrat", "montserrat-latin-600-normal", "600"], ["JetBrains Mono", "jetbrains-mono-latin-500-normal", "500"]];
export const loadFonts = () => Promise.all(FACES.map(async ([fam, file, weight, style]) => {
  const f = new FontFace(fam, `url(${staticFile(`realism/fonts/${file}.woff2`)})`, { weight, style: style ?? "normal" }); await f.load(); document.fonts.add(f); }));

/** set a canvas font with tracking (letter spacing, px) */
export const font = (g: CanvasRenderingContext2D, spec: string, tracking = 0) => { g.font = spec; (g as unknown as { letterSpacing: string }).letterSpacing = `${tracking}px`; };
/** shrink a font size until the text fits width w */
export const fit = (g: CanvasRenderingContext2D, text: string, make: (px: number) => string, px: number, w: number, tracking = 0) => { let s = px; for (; s > 8; s -= 2) { font(g, make(s), tracking); if (g.measureText(text).width <= w) break; } return s; };

/** a real neon sign: brushed dark metal backing with screws, thin glass tubes (white-hot core, coloured tube, wide
 *  soft glow), drawn in Montserrat Light / Playfair italic with wide tracking */
export const drawNeon = (g: CanvasRenderingContext2D, W: number, H: number, text: string, color: string, style: "modern" | "luxury" = "modern") => {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#1c1c22"); bg.addColorStop(1, "#0c0c10"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(255,255,255,${0.012 + (i % 3) * 0.006})`; g.fillRect(0, (i / 140) * H, W, 1); }
  g.fillStyle = "#3a3a42"; for (const [x, y] of [[10, 10], [W - 10, 10], [10, H - 10], [W - 10, H - 10]]) { g.beginPath(); g.arc(x, y, 3.5, 0, Math.PI * 2); g.fill(); }
  g.textAlign = "center"; g.textBaseline = "middle"; const tr = style === "luxury" ? 2 : Math.round(H * 0.06);
  const make = (px: number) => (style === "luxury" ? `italic 900 ${px}px ${FONT.serif}` : `300 ${px}px ${FONT.neon}`), txt = style === "luxury" ? text : text.toUpperCase();
  fit(g, txt, make, Math.round(H * 0.56), W * 0.86, tr);
  const pass = (blur: number, stroke: string, lw: number, alpha: number) => { g.save(); g.globalAlpha = alpha; g.shadowColor = color; g.shadowBlur = blur; g.strokeStyle = stroke; g.lineWidth = lw; g.strokeText(txt, W / 2, H / 2 + 2); g.restore(); };
  pass(H * 0.5, color, 6, 0.55); pass(H * 0.22, color, 4, 0.9); pass(H * 0.06, "#fff8f0", 1.6, 1);
  g.save(); g.globalAlpha = 0.35; g.strokeStyle = "#ffffff"; g.lineWidth = 1; g.strokeRect(W * 0.04, H * 0.12, W * 0.92, H * 0.76); g.restore(); };

/** a printed sign board (painted metal, subtle wear) with condensed display lettering */
export const drawBoard = (g: CanvasRenderingContext2D, W: number, H: number, text: string, bgc: string, fg: string) => {
  g.fillStyle = bgc; g.fillRect(0, 0, W, H); const sh = g.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, "rgba(255,255,255,0.12)"); sh.addColorStop(1, "rgba(0,0,0,0.18)"); g.fillStyle = sh; g.fillRect(0, 0, W, H);
  g.strokeStyle = fg; g.globalAlpha = 0.8; g.lineWidth = Math.max(2, H * 0.04); g.strokeRect(H * 0.08, H * 0.08, W - H * 0.16, H * 0.84); g.globalAlpha = 1;
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; fit(g, text.toUpperCase(), (px) => `400 ${px}px ${FONT.display}`, Math.round(H * 0.72), W * 0.84, Math.round(H * 0.05)); g.fillText(text.toUpperCase(), W / 2, H / 2 + H * 0.04); };
