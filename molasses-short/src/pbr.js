// PBR texture sets painted on canvas: every draw call writes albedo, height and
// roughness together so the three maps line up exactly. Normal maps are derived
// from the height map, so bricks, rivets and planks catch real light.
import * as THREE from 'three';

export function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
const gray = (v, a = 1) => `rgba(${v | 0},${v | 0},${v | 0},${a})`;

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function heightToNormal(hc, strength) {
  const w = hc.width, h = hc.height;
  const src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const nc = canvas(w, h), nx = nc.getContext('2d'), out = nx.createImageData(w, h), d = out.data;
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const hx = (H(x + 1, y) - H(x - 1, y)) * strength;
    const hy = (H(x, y + 1) - H(x, y - 1)) * strength;
    let nX = -hx, nY = hy, nZ = 1;
    const l = Math.hypot(nX, nY, nZ); nX /= l; nY /= l; nZ /= l;
    const i = (y * w + x) * 4;
    d[i] = (nX * .5 + .5) * 255; d[i + 1] = (nY * .5 + .5) * 255; d[i + 2] = (nZ * .5 + .5) * 255; d[i + 3] = 255;
  }
  nx.putImageData(out, 0, 0);
  return nc;
}

// draw(A, Hh, Rg, w, h, R): A = albedo ctx, Hh = height ctx (gray), Rg = roughness ctx (gray)
export function pbr(w, h, seed, draw, opt = {}) {
  const R = rng(seed);
  const ca = canvas(w, h), ch = canvas(w, h), cr = canvas(w, h);
  const A = ca.getContext('2d'), Hh = ch.getContext('2d'), Rg = cr.getContext('2d');
  draw(A, Hh, Rg, w, h, R);
  const nc = heightToNormal(ch, opt.normal ?? 6);
  const mk = (c, srgb) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    return t;
  };
  return { map: mk(ca, true), normalMap: mk(nc, false), roughnessMap: mk(cr, false), height: ch };
}

// set repeat on every map of a set (returns clones so each mesh can differ)
export function rep(set, rx, ry) {
  const o = {};
  for (const k of ['map', 'normalMap', 'roughnessMap']) { const t = set[k].clone(); t.repeat.set(rx, ry); t.needsUpdate = true; o[k] = t; }
  return o;
}

function noise(ctx, w, h, R, n, cols, a, size = 2) {
  for (let i = 0; i < n; i++) { ctx.globalAlpha = a * R(); ctx.fillStyle = cols[(R() * cols.length) | 0]; ctx.fillRect(R() * w, R() * h, size * (.5 + R()), size * (.5 + R())); }
  ctx.globalAlpha = 1;
}
function blotches(ctx, w, h, R, n, col, a, rmin, rmax) {
  for (let i = 0; i < n; i++) {
    const x = R() * w, y = R() * h, r = rmin + R() * (rmax - rmin);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a * (.4 + R() * .6); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    // wrap copies so the tile repeats seamlessly
    for (const [ox, oy] of [[w, 0], [-w, 0], [0, h], [0, -h]]) ctx.fillRect(x - r + ox, y - r + oy, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
}

/* ================= brick ================= */
// 1024px tile = 3m. Bricks 0.2 x 0.065 m with 1cm mortar.
export function brick(seed, o = {}) {
  const hue = o.hue ?? 10, sat = o.sat ?? 48, lit = o.lit ?? 38, mortar = o.mortar ?? '#b9ad9c';
  return pbr(1024, 1024, seed, (A, Hh, Rg, w, h, R) => {
    A.fillStyle = mortar; A.fillRect(0, 0, w, h);
    noise(A, w, h, R, 9000, ['#8f8474', '#d6ccbd', '#a69a88'], .35, 2);
    Hh.fillStyle = gray(70); Hh.fillRect(0, 0, w, h);
    noise(Hh, w, h, R, 6000, [gray(40), gray(100)], .5, 2);
    Rg.fillStyle = gray(240); Rg.fillRect(0, 0, w, h);
    const bw = 68, bh = 22, gap = 4, rows = Math.round(h / bh);
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (bw / 2);
      for (let c = -1; c <= Math.ceil(w / bw); c++) {
        const x = c * bw + off + gap / 2, y = r * bh + gap / 2, bwi = bw - gap, bhi = bh - gap;
        // colour per brick: most are mid red, some burnt dark, some pale
        const k = R();
        let L = lit + (R() - .5) * 10, S = sat + (R() - .5) * 14, Hu = hue + (R() - .5) * 10;
        if (k < .08) { L -= 14; S -= 8; } else if (k > .93) { L += 10; S -= 12; }
        const draw = (ctx, ox) => {
          ctx.fillRect(x + ox, y, bwi, bhi);
        };
        A.fillStyle = hsl(Hu, S, L); draw(A, 0); if (x + bwi > w) draw(A, -w); if (x < 0) draw(A, w);
        // face texture: darker lower edge, mottling
        A.fillStyle = hsl(Hu, S, L - 7, .55); A.fillRect(x, y + bhi - 4, bwi, 4);
        A.fillStyle = hsl(Hu, S - 6, L + 6, .35); A.fillRect(x + 2, y + 1, bwi * (.3 + R() * .5), 3);
        for (let s = 0; s < 6; s++) { A.fillStyle = hsl(Hu, S, L + (R() - .5) * 16, .5); A.fillRect(x + R() * bwi, y + R() * bhi, 2 + R() * 6, 1 + R() * 3); }
        // height: raised brick with rounded edges and chips
        Hh.fillStyle = gray(200); Hh.fillRect(x, y, bwi, bhi); if (x + bwi > w) Hh.fillRect(x - w, y, bwi, bhi);
        Hh.fillStyle = gray(225); Hh.fillRect(x + 2, y + 2, bwi - 4, bhi - 4);
        if (R() < .25) { Hh.fillStyle = gray(120); Hh.beginPath(); Hh.arc(x + R() * bwi, y + (R() < .5 ? 1 : bhi - 1), 2 + R() * 4, 0, 7); Hh.fill(); }
        Rg.fillStyle = gray(200 + (R() - .5) * 40); Rg.fillRect(x, y, bwi, bhi);
      }
    }
    // soot and rain streaks running down from above
    for (let i = 0; i < 40; i++) {
      const x = R() * w, len = 120 + R() * 500, y = R() * h;
      const g = A.createLinearGradient(0, y, 0, y + len);
      g.addColorStop(0, 'rgba(30,22,18,.22)'); g.addColorStop(1, 'rgba(30,22,18,0)');
      A.fillStyle = g; A.fillRect(x, y, 4 + R() * 18, len);
    }
    blotches(A, w, h, R, 14, 'rgba(240,235,220,.5)', .25, 40, 140);   // efflorescence
    blotches(A, w, h, R, 18, 'rgba(25,18,14,.6)', .22, 60, 200);      // grime
  }, { normal: 5 });
}

/* ================= dressed stone (sills, lintels, cornices, kerbs) ================= */
export function stone(seed, base = [38, 12, 70]) {
  return pbr(512, 512, seed, (A, Hh, Rg, w, h, R) => {
    A.fillStyle = hsl(base[0], base[1], base[2]); A.fillRect(0, 0, w, h);
    noise(A, w, h, R, 14000, [hsl(base[0], base[1], base[2] - 14), hsl(base[0], base[1], base[2] + 8), '#6b6560'], .45, 2);
    blotches(A, w, h, R, 16, 'rgba(60,52,44,.7)', .2, 30, 110);
    Hh.fillStyle = gray(128); Hh.fillRect(0, 0, w, h);
    noise(Hh, w, h, R, 9000, [gray(90), gray(170)], .6, 2);
    Rg.fillStyle = gray(225); Rg.fillRect(0, 0, w, h);
    noise(Rg, w, h, R, 3000, [gray(180), gray(250)], .5, 3);
  }, { normal: 3 });
}

/* ================= riveted steel plate ================= */
// 1024 x 512 tile covers 4 plates across, 2 courses high.
export function steel(seed, paint, rust, rustAmt = .35) {
  return pbr(1024, 512, seed, (A, Hh, Rg, w, h, R) => {
    A.fillStyle = paint; A.fillRect(0, 0, w, h);
    Hh.fillStyle = gray(128); Hh.fillRect(0, 0, w, h);
    Rg.fillStyle = gray(150); Rg.fillRect(0, 0, w, h);
    const pw = w / 4, ph = h / 2;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
      const x = c * pw + (r % 2) * pw / 2, y = r * ph;
      for (const ox of [0, -w]) {
        // plate tone + slight oil-can bulge
        A.globalAlpha = .05; A.fillStyle = R() < .5 ? '#ffffff' : '#000000'; A.fillRect(x + ox, y, pw, ph); A.globalAlpha = 1;
        const g = Hh.createRadialGradient(x + ox + pw / 2, y + ph / 2, 10, x + ox + pw / 2, y + ph / 2, pw * .7);
        g.addColorStop(0, gray(150)); g.addColorStop(1, gray(118));
        Hh.fillStyle = g; Hh.fillRect(x + ox, y, pw, ph);
        // lapped seam: the upper plate overlaps the lower one
        Hh.fillStyle = gray(175); Hh.fillRect(x + ox, y, pw, 10);
        Hh.fillStyle = gray(80); Hh.fillRect(x + ox, y + ph - 3, pw, 3); Hh.fillRect(x + ox + pw - 3, y, 3, ph);
        A.fillStyle = 'rgba(0,0,0,.35)'; A.fillRect(x + ox, y + ph - 3, pw, 3); A.fillRect(x + ox + pw - 3, y, 3, ph);
        // rivet rows along every edge
        const rv = (rx, ry) => {
          const gh = Hh.createRadialGradient(rx - 1, ry - 1, 0, rx, ry, 7);
          gh.addColorStop(0, gray(255)); gh.addColorStop(.7, gray(210)); gh.addColorStop(1, gray(128));
          Hh.fillStyle = gh; Hh.beginPath(); Hh.arc(rx, ry, 7, 0, 7); Hh.fill();
          A.fillStyle = 'rgba(0,0,0,.25)'; A.beginPath(); A.arc(rx + 1.5, ry + 2, 6.5, 0, 7); A.fill();
          A.fillStyle = paint; A.beginPath(); A.arc(rx, ry, 5.5, 0, 7); A.fill();
          A.fillStyle = 'rgba(255,255,255,.18)'; A.beginPath(); A.arc(rx - 1.5, ry - 1.5, 2.4, 0, 7); A.fill();
          if (R() < rustAmt) { // rust bleeding from the rivet
            const len = 20 + R() * 90, gg = A.createLinearGradient(0, ry, 0, ry + len);
            gg.addColorStop(0, rust); gg.addColorStop(1, 'rgba(0,0,0,0)');
            A.globalAlpha = .55; A.fillStyle = gg; A.fillRect(rx - 2.5, ry, 5, len); A.globalAlpha = 1;
            Rg.fillStyle = gray(235); Rg.fillRect(rx - 3, ry, 6, len * .8);
          }
        };
        for (let i = 0; i < 14; i++) { rv(x + ox + 12 + i * (pw - 24) / 13, y + 16); rv(x + ox + 12 + i * (pw - 24) / 13, y + ph - 14); }
        for (let i = 1; i < 6; i++) rv(x + ox + pw - 12, y + i * ph / 6);
      }
    }
    // weathering: paint wear, grime band, broad rust patches
    blotches(A, w, h, R, 22, rust, rustAmt * .35, 30, 120);
    blotches(A, w, h, R, 12, 'rgba(20,16,12,.7)', .18, 80, 220);
    noise(A, w, h, R, 9000, ['#000', '#fff'], .05, 2);
    noise(Rg, w, h, R, 4000, [gray(120), gray(200)], .4, 3);
  }, { normal: 4 });
}

/* ================= wood planks ================= */
export function planks(seed, c1, c2, o = {}) {
  const boards = o.boards ?? 6, vertical = !!o.vertical;
  return pbr(512, 512, seed, (A, Hh, Rg, w, h, R) => {
    if (vertical) { A.translate(w, 0); A.rotate(Math.PI / 2); Hh.translate(w, 0); Hh.rotate(Math.PI / 2); Rg.translate(w, 0); Rg.rotate(Math.PI / 2); }
    const bh = h / boards;
    for (let b = 0; b < boards; b++) {
      const y = b * bh, tone = (R() - .5) * 14;
      A.fillStyle = c1; A.fillRect(0, y, w, bh);
      A.fillStyle = tone > 0 ? `rgba(255,240,220,${tone / 70})` : `rgba(0,0,0,${-tone / 50})`; A.fillRect(0, y, w, bh);
      // grain
      for (let g = 0; g < 22; g++) {
        A.globalAlpha = .1 + R() * .2; A.strokeStyle = c2; A.lineWidth = .8 + R() * 1.6;
        A.beginPath(); let gy = y + R() * bh; A.moveTo(0, gy);
        for (let s = 0; s <= w; s += 32) { gy += (R() - .5) * 2.2; A.lineTo(s, gy); }
        A.stroke();
      }
      A.globalAlpha = 1;
      if (R() < .55) { const kx = R() * w, ky = y + bh * (.3 + R() * .4);
        for (let k = 4; k > 0; k--) { A.globalAlpha = .18; A.fillStyle = c2; A.beginPath(); A.ellipse(kx, ky, k * 4, k * 2.2, 0, 0, 7); A.fill(); }
        A.globalAlpha = 1; }
      Hh.fillStyle = gray(190); Hh.fillRect(0, y, w, bh);
      noise(Hh, w, h, R, 300, [gray(160), gray(215)], .4, 3);
      Hh.fillStyle = gray(40); Hh.fillRect(0, y, w, 3);           // groove between boards
      A.fillStyle = 'rgba(0,0,0,.55)'; A.fillRect(0, y, w, 3);
      Rg.fillStyle = gray(190 + (R() - .5) * 30); Rg.fillRect(0, y, w, bh);
      // nail heads at the board ends
      for (const nx of [18, w - 18]) for (const ny of [y + bh * .3, y + bh * .7]) {
        Hh.fillStyle = gray(230); Hh.beginPath(); Hh.arc(nx, ny, 3.5, 0, 7); Hh.fill();
        A.fillStyle = '#3b3532'; A.beginPath(); A.arc(nx, ny, 3, 0, 7); A.fill();
      }
    }
    noise(A, w, h, R, 3000, ['#000', '#fff'], .05, 2);
  }, { normal: 4 });
}

/* ================= snow ================= */
export function snow(seed) {
  return pbr(512, 512, seed, (A, Hh, Rg, w, h, R) => {
    A.fillStyle = '#f3f6fb'; A.fillRect(0, 0, w, h);
    Hh.fillStyle = gray(128); Hh.fillRect(0, 0, w, h);
    blotches(Hh, w, h, R, 90, 'rgba(255,255,255,1)', .35, 20, 90);
    blotches(Hh, w, h, R, 60, 'rgba(0,0,0,1)', .25, 15, 70);
    blotches(A, w, h, R, 50, 'rgba(190,210,235,1)', .18, 20, 80);
    // footprints and scuffs
    for (let i = 0; i < 10; i++) {
      const x = R() * w, y = R() * h, a = R() * 6.28;
      for (let s = 0; s < 4; s++) {
        const px = x + Math.cos(a) * s * 26 + (s % 2 ? 8 : -8) * Math.sin(a), py = y + Math.sin(a) * s * 26 - (s % 2 ? 8 : -8) * Math.cos(a);
        Hh.fillStyle = gray(70, .6); Hh.beginPath(); Hh.ellipse(px, py, 7, 4, a, 0, 7); Hh.fill();
        A.fillStyle = 'rgba(170,190,215,.4)'; A.beginPath(); A.ellipse(px, py, 7, 4, a, 0, 7); A.fill();
      }
    }
    Rg.fillStyle = gray(200); Rg.fillRect(0, 0, w, h);
    noise(Rg, w, h, R, 1500, [gray(40)], .9, 1.5);   // glints
    noise(A, w, h, R, 4000, ['#ffffff', '#dfe8f4'], .5, 2);
  }, { normal: 2.5 });
}

/* ================= wet slush between setts ================= */
export function slush(seed) {
  return pbr(512, 512, seed, (A, Hh, Rg, w, h, R) => {
    A.fillStyle = '#3a3640'; A.fillRect(0, 0, w, h);
    blotches(A, w, h, R, 60, 'rgba(200,210,225,1)', .35, 10, 50);
    blotches(A, w, h, R, 30, 'rgba(70,52,40,1)', .3, 20, 80);
    Hh.fillStyle = gray(128); Hh.fillRect(0, 0, w, h);
    blotches(Hh, w, h, R, 60, 'rgba(255,255,255,1)', .3, 10, 50);
    Rg.fillStyle = gray(70); Rg.fillRect(0, 0, w, h);              // wet = glossy
    blotches(Rg, w, h, R, 50, 'rgba(230,230,230,1)', .6, 10, 50);  // slushy = rough
  }, { normal: 2 });
}

/* ================= slate / tar roof ================= */
export function roofing(seed) {
  return pbr(512, 512, seed, (A, Hh, Rg, w, h, R) => {
    A.fillStyle = '#4b4a52'; A.fillRect(0, 0, w, h);
    Hh.fillStyle = gray(128); Hh.fillRect(0, 0, w, h);
    Rg.fillStyle = gray(200); Rg.fillRect(0, 0, w, h);
    const sw = 42, sh = 30;
    for (let r = 0; r < h / sh + 1; r++) for (let c = -1; c < w / sw + 1; c++) {
      const x = c * sw + (r % 2) * sw / 2, y = r * sh;
      A.fillStyle = hsl(240, 5, 28 + R() * 10); A.fillRect(x + 1, y, sw - 2, sh - 2);
      const g = Hh.createLinearGradient(0, y, 0, y + sh); g.addColorStop(0, gray(110)); g.addColorStop(1, gray(200));
      Hh.fillStyle = g; Hh.fillRect(x + 1, y, sw - 2, sh - 2);
    }
    noise(A, w, h, R, 3000, ['#000', '#888'], .15, 2);
  }, { normal: 4 });
}

/* ================= painted wood (doors, frames, signs) ================= */
export function paintedWood(seed, col) {
  return pbr(256, 256, seed, (A, Hh, Rg, w, h, R) => {
    A.fillStyle = col; A.fillRect(0, 0, w, h);
    for (let g = 0; g < 40; g++) { A.globalAlpha = .06; A.fillStyle = R() < .5 ? '#000' : '#fff'; A.fillRect(0, R() * h, w, 1 + R() * 2); }
    A.globalAlpha = 1;
    noise(A, w, h, R, 800, ['#000', '#fff'], .08, 2);
    Hh.fillStyle = gray(128); Hh.fillRect(0, 0, w, h);
    for (let g = 0; g < 30; g++) { Hh.fillStyle = gray(100 + R() * 60, .5); Hh.fillRect(0, R() * h, w, 1 + R() * 2); }
    Rg.fillStyle = gray(120); Rg.fillRect(0, 0, w, h);
  }, { normal: 2 });
}

/* ================= wallpaper / plaster (interiors) ================= */
export function plaster(seed, col, accent) {
  return pbr(512, 512, seed, (A, Hh, Rg, w, h, R) => {
    A.fillStyle = col; A.fillRect(0, 0, w, h);
    blotches(A, w, h, R, 30, accent, .15, 30, 120);
    noise(A, w, h, R, 6000, ['#000', '#fff'], .05, 2);
    Hh.fillStyle = gray(128); Hh.fillRect(0, 0, w, h);
    noise(Hh, w, h, R, 9000, [gray(100), gray(160)], .6, 3);
    Rg.fillStyle = gray(230); Rg.fillRect(0, 0, w, h);
  }, { normal: 2 });
}
