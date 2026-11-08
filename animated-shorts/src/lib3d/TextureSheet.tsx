// Preview sheet for src/lib3d/textures.ts: draws every procedural texture as a labelled tile (plain 2D canvas, no WebGL).
// page 0 (default) = overview of everything; page N >= 1 = 6 textures large, tileable ones shown 2 x 2 to check seams.
//   npx remotion still src/index.ts TextureSheet out.png --frame=0 [--props='{"page":1}']
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { TEXTURE_CATALOG } from "./textures";

const W = 1080, H = 1920;

function drawItem(g: CanvasRenderingContext2D, img: HTMLCanvasElement, tile: string, x: number, y: number, w: number, h: number, reps: number) {
  g.save();
  // checkerboard behind (shows alpha)
  for (let i = 0; i < w; i += 12) for (let j = 0; j < h; j += 12) { g.fillStyle = ((i + j) / 12) % 2 ? "#3a3a44" : "#2c2c34"; g.fillRect(x + i, y + j, Math.min(12, w - i), Math.min(12, h - j)); }
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  if (tile) {
    const s = w / reps;
    const th = (s * img.height) / img.width;
    for (let i = 0; i < reps; i++) for (let j = 0; j * th < h; j++) g.drawImage(img, x + i * s, y + j * th, s, th);
  } else {
    const k = Math.min(w / img.width, h / img.height);
    const dw = img.width * k, dh = img.height * k;
    g.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }
  g.restore();
}

export const TextureSheet: React.FC<{ page?: number }> = ({ page = 0 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    g.fillStyle = "#1b1b22"; g.fillRect(0, 0, W, H);
    const items = page === 0 ? TEXTURE_CATALOG : TEXTURE_CATALOG.slice((page - 1) * 6, page * 6);
    const cols = page === 0 ? 6 : 2;
    const pad = page === 0 ? 8 : 20, labelH = page === 0 ? 24 : 40;
    const cw = (W - pad) / cols - pad;
    const rows = Math.ceil(items.length / cols);
    const ch = Math.min((H - pad - 60) / rows - pad - labelH, page === 0 ? cw : 520);
    g.fillStyle = "#f2f2f2"; g.font = "bold 34px Arial"; g.textBaseline = "top";
    g.fillText(page === 0 ? "lib3d/textures.ts" : `lib3d/textures.ts - page ${page} (tiles shown 2 x 2)`, pad, 14);
    items.forEach(([name, tile, make], i) => {
      const x = pad + (i % cols) * (cw + pad), y = 60 + pad + Math.floor(i / cols) * (ch + labelH + pad);
      const img = make().image as HTMLCanvasElement;
      drawItem(g, img, tile, x, y, cw, ch, page === 0 ? 1 : 2);
      g.fillStyle = "#e8e8e8"; g.font = `${page === 0 ? 15 : 26}px Arial`; g.textBaseline = "top";
      g.fillText(`${name}${tile ? "  [" + tile + "]" : ""}`, x, y + ch + 4);
    });
  }, [page]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#1b1b22" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: W, height: H }} />
    </AbsoluteFill>
  );
};
