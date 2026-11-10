// Effects drawn on canvases, all pure functions of time t (deterministic).
import { hash1, clamp, smooth } from './util.js';

// ------------------------------------------------------------------ rain (3 depth layers + ground splashes)
export class Rain {
  constructor(canvas, opt = {}) {
    this.c = canvas; this.g = canvas.getContext('2d');
    this.o = Object.assign({ density: 900, angle: 14, speed: 1, color: '200,215,235', splashY: 0.86, layers: [0.35, 0.65, 1.0], seed: 11, alpha: 1 }, opt);
  }
  draw(t, camX = 0, camY = 0) {
    const { c, g, o } = this; const W = c.width, H = c.height;
    g.clearRect(0, 0, W, H);
    if (!o.density) return;
    const ang = (o.angle * Math.PI) / 180, dx = Math.sin(ang), dy = Math.cos(ang);
    o.layers.forEach((depth, li) => {
      const n = Math.round((o.density * (li === 0 ? 1.2 : li === 1 ? 0.7 : 0.25)));
      const len = 18 + depth * 46, speed = (1400 + depth * 2200) * o.speed, wdt = 0.6 + depth * 1.6;
      g.strokeStyle = `rgba(${o.color},${(0.16 + depth * 0.3) * o.alpha})`; g.lineWidth = wdt; g.beginPath();
      for (let i = 0; i < n; i++) {
        const r1 = hash1(o.seed * 100003 + li * 7919 + i), r2 = hash1(o.seed * 7 + li * 104729 + i * 3), r3 = hash1(i * 13 + li);
        const sp = speed * (0.85 + r3 * 0.3);
        const travel = (r2 * (H + 300) + t * sp) % (H + 300) - 150;
        const x = ((r1 * (W + 400) + travel * dx / dy - camX * depth * 0.6) % (W + 400) + W + 400) % (W + 400) - 200;
        const y = travel - camY * depth * 0.3;
        g.moveTo(x, y); g.lineTo(x - dx * len, y - dy * len);
      }
      g.stroke();
    });
    // splashes on the ground plane
    if (o.splashY > 0) {
      g.strokeStyle = `rgba(${o.color},${0.35 * o.alpha})`; g.lineWidth = 1.2;
      const n = Math.round(o.density * 0.12);
      for (let i = 0; i < n; i++) {
        const period = 0.35 + hash1(i * 5 + 1) * 0.5, ph = (t + hash1(i * 9 + 2) * period) % period;
        if (ph > 0.12) continue;
        const k = ph / 0.12;
        const x = hash1(i * 11 + 3) * W, y = H * o.splashY + hash1(i * 17 + 4) * H * (1 - o.splashY);
        const r = 2 + k * (4 + hash1(i) * 6);
        g.globalAlpha = 1 - k; g.beginPath(); g.ellipse(x, y, r * 1.8, r * 0.45, 0, 0, Math.PI * 2); g.stroke();
      }
      g.globalAlpha = 1;
    }
  }
}

// ------------------------------------------------------------------ film grain (pre-baked tiles, chosen per frame)
export class Grain {
  constructor(canvas, amount = 0.06) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.amount = amount; this.tiles = [];
    for (let k = 0; k < 6; k++) {
      const tc = document.createElement('canvas'); tc.width = tc.height = 256; const tg = tc.getContext('2d');
      const im = tg.createImageData(256, 256);
      for (let i = 0; i < im.data.length; i += 4) { const v = hash1(k * 65536 + i) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      tg.putImageData(im, 0, 0); this.tiles.push(tc);
    }
  }
  draw(frame) {
    const { c, g } = this; g.clearRect(0, 0, c.width, c.height);
    if (!this.amount) return;
    g.globalAlpha = this.amount;
    g.fillStyle = g.createPattern(this.tiles[frame % this.tiles.length], 'repeat'); g.fillRect(0, 0, c.width, c.height);
    g.globalAlpha = 1;
  }
}

// ------------------------------------------------------------------ lightning: brightness envelope for a list of strike times
export function lightningAt(t, strikes = []) {
  let v = 0;
  for (const s of strikes) {
    const d = t - s; if (d < 0 || d > 0.9) continue;
    // double flicker then decay
    const f = (d < 0.06 ? d / 0.06 : d < 0.11 ? 0.35 : d < 0.16 ? 1 : Math.exp(-(d - 0.16) * 6));
    v = Math.max(v, f);
  }
  return clamp(v, 0, 1);
}

// ------------------------------------------------------------------ speed / motion lines (radial, for impact beats)
export function motionLines(canvas, t, opt) {
  const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  g.clearRect(0, 0, W, H);
  if (!opt) return;
  const { t0, t1, cx = W / 2, cy = H / 2, n = 90, color = '255,255,255' } = opt;
  if (t < t0 || t > t1) return;
  const u = (t - t0) / (t1 - t0), fade = Math.sin(u * Math.PI);
  const frame = Math.floor(t * 12);   // lines re-randomise on 2s (animated on twos)
  for (let i = 0; i < n; i++) {
    const a = hash1(i * 7 + frame * 131) * Math.PI * 2, r0 = Math.min(W, H) * (0.28 + hash1(i * 3 + frame) * 0.25);
    const w = 1 + hash1(i + frame * 7) * 5;
    g.fillStyle = `rgba(${color},${0.5 * fade})`;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    g.lineTo(cx + Math.cos(a + 0.004 * w) * W, cy + Math.sin(a + 0.004 * w) * W);
    g.lineTo(cx + Math.cos(a - 0.004 * w) * W, cy + Math.sin(a - 0.004 * w) * W);
    g.fill();
  }
}

export { smooth };
