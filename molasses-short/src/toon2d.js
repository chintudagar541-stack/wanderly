// 2D cartoon characters drawn on canvas and stood up in the 3D world as cards.
// Style: white round head with soft shade, thick ink outline, ink-line limbs,
// flat costume colours with one shade band, simple line-drawn faces.
import * as THREE from 'three';

const INK = '#17121a';
const CW = 512, CH = 1024;          // canvas
export const CARD_W = 1.3, CARD_H = 2.6; // metres

export function shade(hex, k) {            // k < 1 darker, > 1 lighter
  const c = new THREE.Color(hex);
  const hslc = {}; c.getHSL(hslc);
  c.setHSL(hslc.h, Math.min(1, hslc.s * (k < 1 ? 1.05 : .9)), Math.max(0, Math.min(1, hslc.l * k)));
  return '#' + c.getHexString();
}

export const FACES = {
  flat:    { eyes: 'half', brows: [0, 0],        browY: 0,   mouth: 'flat'  },
  neutral: { eyes: 'open', brows: [0, 0],        browY: 0,   mouth: 'flat'  },
  smug:    { eyes: 'half', brows: [-.1, .3],     browY: -4,  mouth: 'smirk' },
  shock:   { eyes: 'wide', brows: [.25, -.25],   browY: -14, mouth: 'o'     },
  grin:    { eyes: 'arc',  brows: [.2, -.2],     browY: -6,  mouth: 'grin'  },
  smile:   { eyes: 'arc',  brows: [.12, -.12],   browY: -2,  mouth: 'smile' },
  sad:     { eyes: 'half', brows: [.5, -.5],     browY: -4,  mouth: 'frown' },
  angry:   { eyes: 'half', brows: [-.5, .5],     browY: 6,   mouth: 'grit'  },
  worry:   { eyes: 'open', brows: [.45, -.45],   browY: -6,  mouth: 'wobble'},
  sleepy:  { eyes: 'closed', brows: [.1, -.1],   browY: 0,   mouth: 'flat'  },
};

export class Card {
  constructor(spec) {
    this.spec = Object.assign({
      skin: '#f7f2ea', body: '#3b5f8a', costume: 'coat', hat: null, hatCol: '#2b2b33',
      hatCol2: '#d9d4c8', hair: '#3a2a1e', scarf: null, shoes: '#3b2a1f', gloves: null,
      mustache: false, scale: 1, legs: '#17121a',
    }, spec);
    this.c = document.createElement('canvas'); this.c.width = CW; this.c.height = CH;
    this.x = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c);
    this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    const s = this.spec.scale;
    const geo = new THREE.PlaneGeometry(CARD_W * s, CARD_H * s); geo.translate(0, CARD_H * s / 2, 0);
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: .04, depthWrite: true, side: THREE.DoubleSide, toneMapped: true });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.tex, alphaTest: .5 });
    this.depthMat = new THREE.MeshBasicMaterial({ map: this.tex, alphaTest: .5, side: THREE.DoubleSide });
    this.root = new THREE.Group(); this.root.add(this.mesh);
    // soft contact shadow on the ground
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1.5 * s, .7 * s), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: .55, color: 0x000000 }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.position.y = .03; this.blob.renderOrder = 2;
    this.root.add(this.blob);
    this.state = { face: 'flat', look: [0, 0], armL: [.15, .1], armR: [.15, .1], legs: 0, walk: 0, bob: 0, lean: 0, blink: 0, sweat: false, prop: null, propOn: true };
    this._last = '';
  }
  set(o) { Object.assign(this.state, o); }
  face(name) { this.state.face = name; }
  // stand the card upright facing the camera around its own vertical axis
  billboard(cam) {
    const p = new THREE.Vector3(); this.root.getWorldPosition(p);
    this.mesh.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z) - this.root.rotation.y;
  }
  draw() {
    const key = JSON.stringify(this.state);
    if (key === this._last) return;
    this._last = key;
    drawCharacter(this.x, this.spec, this.state);
    this.tex.needsUpdate = true;
  }
}

let _blob = null;
function blobTex() {
  if (_blob) return _blob;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(.55, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  _blob = new THREE.CanvasTexture(c); return _blob;
}

/* ------------------------------------------------------------------ drawing */
function inkPath(x, p, fill, w = 11) {
  if (fill) { x.fillStyle = fill; x.fill(p); }
  x.lineWidth = w; x.strokeStyle = INK; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(p);
}
function line(x, pts, w = 13) {
  x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]);
  x.lineWidth = w; x.strokeStyle = INK; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke();
}
function roundBody(cx, top, bot, wT, wB, r = 70) {
  const p = new Path2D();
  p.moveTo(cx - wT / 2, top + r);
  p.bezierCurveTo(cx - wT / 2, top + r * .2, cx - wT * .32, top, cx, top);
  p.bezierCurveTo(cx + wT * .32, top, cx + wT / 2, top + r * .2, cx + wT / 2, top + r);
  p.bezierCurveTo(cx + wT / 2 + (wB - wT) * .2, (top + bot) / 2, cx + wB / 2, bot - 60, cx + wB / 2, bot - 26);
  p.quadraticCurveTo(cx + wB / 2, bot, cx + wB / 2 - 28, bot);
  p.lineTo(cx - wB / 2 + 28, bot);
  p.quadraticCurveTo(cx - wB / 2, bot, cx - wB / 2, bot - 26);
  p.bezierCurveTo(cx - wB / 2, bot - 60, cx - wT / 2 - (wB - wT) * .2, (top + bot) / 2, cx - wT / 2, top + r);
  p.closePath();
  return p;
}
function shadeFill(x, path, col, l, r) {
  x.save(); x.clip(path);
  const g = x.createLinearGradient(l, 0, r, 0);
  g.addColorStop(0, shade(col, 1.12)); g.addColorStop(.5, col); g.addColorStop(.72, col); g.addColorStop(.78, shade(col, .78)); g.addColorStop(1, shade(col, .72));
  x.fillStyle = g; x.fillRect(l - 20, 0, r - l + 40, CH);
  x.restore();
}

export function drawCharacter(x, S, st) {
  const F = FACES[st.face] || FACES.flat;
  x.clearRect(0, 0, CW, CH);
  x.save();
  const cx = 256, bob = st.bob || 0;
  x.translate(cx, 1000); x.rotate(st.lean || 0); x.translate(-cx, -1000);
  x.translate(0, bob);

  const robe = S.costume === 'robe', dress = S.costume === 'dress';
  const top = 448, bot = robe ? 930 : dress ? 820 : 790;
  const wT = 196, wB = robe ? 250 : dress ? 280 : 214;
  const hipY = Math.min(bot - 20, 770);

  /* legs */
  const ph = st.walk || 0, sw = Math.sin(ph) * .28 * (st.legs || 0);
  const legsVisible = !robe;
  if (legsVisible) {
    for (const [side, ang] of [[-1, sw], [1, -sw]]) {
      const hx = cx + side * 34, hy = hipY;
      const kx = hx + Math.sin(ang) * 110, ky = hy + Math.cos(ang) * 110;
      const ax = kx + Math.sin(ang * .4) * 112, ay = Math.min(990, ky + Math.cos(ang * .4) * 112);
      line(x, [[hx, hy], [kx, ky], [ax, ay]], 14);
      const shoe = new Path2D(); shoe.ellipse(ax + side * 14, ay + 4, 34, 17, 0, 0, Math.PI * 2);
      inkPath(x, shoe, S.shoes, 9);
      x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.ellipse(ax + side * 6, ay - 3, 14, 5, 0, 0, 7); x.fill();
    }
  } else {
    for (const side of [-1, 1]) { const shoe = new Path2D(); shoe.ellipse(cx + side * 46, 978, 36, 17, 0, 0, 7); inkPath(x, shoe, S.shoes, 9); }
  }

  /* body */
  const body = roundBody(cx, top, bot, wT, wB);
  x.fillStyle = S.body; x.fill(body);
  shadeFill(x, body, S.body, cx - wB / 2, cx + wB / 2);
  costume(x, S, cx, top, bot, wT, wB, body);
  inkPath(x, body, null, 11);

  /* scarf */
  if (S.scarf) {
    const sc = new Path2D(); sc.moveTo(cx - 92, top + 18); sc.quadraticCurveTo(cx, top + 66, cx + 92, top + 18);
    sc.lineTo(cx + 88, top + 52); sc.quadraticCurveTo(cx, top + 100, cx - 88, top + 52); sc.closePath();
    inkPath(x, sc, S.scarf, 9);
    const tail = new Path2D(); tail.moveTo(cx + 30, top + 70); tail.lineTo(cx + 66, top + 64); tail.lineTo(cx + 74, top + 190); tail.lineTo(cx + 40, top + 196); tail.closePath();
    inkPath(x, tail, shade(S.scarf, .86), 9);
    x.strokeStyle = shade(S.scarf, .7); x.lineWidth = 5;
    for (const yy of [top + 182, top + 168]) { x.beginPath(); x.moveTo(cx + 42, yy); x.lineTo(cx + 73, yy - 3); x.stroke(); }
  }

  /* back arm drawn before the head so the head overlaps the shoulder */
  const shoulderY = top + 58;
  const handL = arm(x, cx - wT / 2 + 14, shoulderY, -1, st.armL, S);
  const handR = arm(x, cx + wT / 2 - 14, shoulderY, 1, st.armR, S);

  /* head */
  const hcx = cx, hcy = 300, R = 136;
  const head = new Path2D(); head.arc(hcx, hcy, R, 0, Math.PI * 2);
  const hg = x.createRadialGradient(hcx - 40, hcy - 55, 10, hcx + 10, hcy + 10, R * 1.15);
  hg.addColorStop(0, shade(S.skin, 1.02)); hg.addColorStop(.62, S.skin); hg.addColorStop(1, shade(S.skin, .84));
  x.fillStyle = hg; x.fill(head);
  hairBack(x, S, hcx, hcy, R);
  face(x, S, F, st, hcx, hcy, R);
  inkPath(x, head, null, 11);
  hat(x, S, hcx, hcy, R);

  if (st.sweat) {
    const d = new Path2D(); d.moveTo(hcx + 118, hcy - 112); d.quadraticCurveTo(hcx + 98, hcy - 70, hcx + 118, hcy - 60); d.quadraticCurveTo(hcx + 138, hcy - 70, hcx + 118, hcy - 112);
    inkPath(x, d, '#8fd0ff', 6);
  }

  /* props in hand */
  if (st.prop && st.propOn !== false) prop(x, st.prop, st.prop.hand === 'L' ? handL : handR);

  x.restore();
}

function arm(x, sx, sy, side, a, S) {
  const [a1, a2] = a || [.15, .1];
  const d1 = [side * Math.sin(a1), Math.cos(a1)], d2 = [side * Math.sin(a1 + a2), Math.cos(a1 + a2)];
  const ex = sx + d1[0] * 112, ey = sy + d1[1] * 112;
  const hx = ex + d2[0] * 104, hy = ey + d2[1] * 104;
  line(x, [[sx, sy], [ex, ey], [hx, hy]], 14);
  const h = new Path2D(); h.arc(hx, hy, 17, 0, Math.PI * 2);
  inkPath(x, h, S.gloves || S.skin, 8);
  return { x: hx, y: hy, ang: Math.atan2(d2[0], d2[1]) };
}

export function costume(x, S, cx, top, bot, wT, wB) {
  const t = S.costume;
  x.lineCap = 'round'; x.lineJoin = 'round';
  const dark = shade(S.body, .62);
  if (t === 'coat' || t === 'dress' || t === 'robe') {
    // collar and lapels
    const lap = new Path2D(); lap.moveTo(cx - 70, top + 14); lap.lineTo(cx, top + 120); lap.lineTo(cx + 70, top + 14);
    x.strokeStyle = dark; x.lineWidth = 7; x.stroke(lap);
    if (t !== 'robe') {
      x.beginPath(); x.moveTo(cx, top + 120); x.lineTo(cx, bot - 8); x.stroke();
      for (let i = 0; i < 3; i++) { x.fillStyle = shade(S.body, .5); x.beginPath(); x.arc(cx - 20, top + 160 + i * 62, 8, 0, 7); x.fill(); }
      x.strokeStyle = dark; x.lineWidth = 6; x.beginPath(); x.moveTo(cx + 34, top + 220); x.lineTo(cx + 78, top + 216); x.stroke(); // pocket
    }
    if (t === 'robe') { // white jabot
      const j = new Path2D(); j.moveTo(cx - 30, top + 30); j.lineTo(cx + 30, top + 30); j.lineTo(cx + 18, top + 130); j.lineTo(cx, top + 116); j.lineTo(cx - 18, top + 130); j.closePath();
      inkPath(x, j, '#f4f1ea', 7);
    }
    if (t === 'dress') { x.fillStyle = 'rgba(255,255,255,.85)'; const ap = new Path2D(); ap.moveTo(cx - 70, top + 200); ap.lineTo(cx + 70, top + 200); ap.lineTo(cx + 90, bot - 30); ap.lineTo(cx - 90, bot - 30); ap.closePath(); inkPath(x, ap, '#efe9dc', 7); }
  }
  if (t === 'suit') {
    const sh = new Path2D(); sh.moveTo(cx - 46, top + 10); sh.lineTo(cx, top + 130); sh.lineTo(cx + 46, top + 10); sh.closePath();
    inkPath(x, sh, '#f2efe8', 7);
    const tie = new Path2D(); tie.moveTo(cx - 12, top + 26); tie.lineTo(cx + 12, top + 26); tie.lineTo(cx + 16, top + 110); tie.lineTo(cx, top + 128); tie.lineTo(cx - 16, top + 110); tie.closePath();
    inkPath(x, tie, S.tie || '#a3322c', 6);
    for (let i = 0; i < 2; i++) { x.fillStyle = shade(S.body, .5); x.beginPath(); x.arc(cx, top + 175 + i * 60, 8, 0, 7); x.fill(); }
  }
  if (t === 'vest') {
    x.fillStyle = S.shirt || '#ece6d8';
    const sh = new Path2D(); sh.moveTo(cx - 50, top + 6); sh.lineTo(cx + 50, top + 6); sh.lineTo(cx, top + 150); sh.closePath(); x.fill(sh);
    x.strokeStyle = dark; x.lineWidth = 7; x.stroke(sh);
    for (let i = 0; i < 3; i++) { x.fillStyle = '#c9a54a'; x.beginPath(); x.arc(cx, top + 170 + i * 50, 7, 0, 7); x.fill(); }
  }
  if (t === 'overalls') {
    x.fillStyle = S.shirt || '#c9b79a'; x.fillRect(cx - 98, top, 196, 110);
    const bib = new Path2D(); bib.rect(cx - 60, top + 70, 120, 90); inkPath(x, bib, S.body, 7);
    x.strokeStyle = dark; x.lineWidth = 9;
    for (const s2 of [-1, 1]) { x.beginPath(); x.moveTo(cx + s2 * 50, top + 70); x.lineTo(cx + s2 * 70, top + 8); x.stroke(); }
    x.fillStyle = '#d8c070'; for (const s2 of [-1, 1]) { x.beginPath(); x.arc(cx + s2 * 48, top + 80, 7, 0, 7); x.fill(); }
  }
  // hem band
  x.fillStyle = shade(S.body, .8); x.fillRect(cx - wB / 2, bot - 34, wB, 10);
}

function hairBack(x, S, cx, cy, R) {
  if (S.hat === 'bun' || S.hat === 'hair') {
    x.save(); const head = new Path2D(); head.arc(cx, cy, R, 0, 7); x.clip(head);
    x.fillStyle = S.hair;
    x.beginPath(); x.ellipse(cx + 10, cy - R * .78, R * 1.12, R * .62, -.08, 0, 7); x.fill();
    if (S.hat === 'hair') { x.beginPath(); x.ellipse(cx - R * .85, cy - 30, 30, 70, .2, 0, 7); x.fill(); }
    // strand lines
    x.strokeStyle = shade(S.hair, 1.5); x.lineWidth = 4;
    for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(cx + i * 30, cy - R); x.quadraticCurveTo(cx + i * 34, cy - R * .6, cx + i * 40 + 8, cy - R * .32); x.stroke(); }
    x.restore();
    x.strokeStyle = INK; x.lineWidth = 8;
    x.beginPath(); x.ellipse(cx + 10, cy - R * .78, R * 1.12, R * .62, -.08, Math.PI * .02, Math.PI * .98); // only lower edge inside head
  }
}

export function face(x, S, F, st, cx, cy, R) {
  const ey = cy - 4, ex = 50;
  const look = st.look || [0, 0], lx = look[0] * 9, ly = look[1] * 6;
  const blink = st.blink || 0;
  x.lineCap = 'round'; x.lineJoin = 'round';
  for (const side of [-1, 1]) {
    const px = cx + side * ex, py = ey;
    const kind = blink > .5 && F.eyes !== 'arc' ? 'closed' : F.eyes;
    if (kind === 'open') {
      x.fillStyle = INK; x.beginPath(); x.ellipse(px + lx, py + ly, 14, 19, 0, 0, 7); x.fill();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(px + lx - 4, py + ly - 7, 4, 0, 7); x.fill();
    } else if (kind === 'half') {
      x.fillStyle = INK; x.beginPath(); x.ellipse(px + lx, py + 4 + ly, 14, 15, 0, 0, Math.PI); x.fill();
      x.lineWidth = 9; x.strokeStyle = INK; x.beginPath(); x.moveTo(px - 26, py + 2); x.lineTo(px + 26, py + 2); x.stroke();
    } else if (kind === 'wide') {
      x.fillStyle = '#fff'; x.beginPath(); x.arc(px, py, 33, 0, 7); x.fill();
      x.lineWidth = 8; x.strokeStyle = INK; x.stroke();
      x.fillStyle = INK; x.beginPath(); x.arc(px + lx * .8, py + ly * .8, 9, 0, 7); x.fill();
    } else if (kind === 'arc') {
      x.lineWidth = 9; x.strokeStyle = INK; x.beginPath(); x.arc(px, py + 12, 20, Math.PI * 1.12, Math.PI * 1.88); x.stroke();
    } else { // closed
      x.lineWidth = 9; x.strokeStyle = INK; x.beginPath(); x.arc(px, py - 4, 20, Math.PI * .15, Math.PI * .85); x.stroke();
    }
    // brow
    const ang = (F.brows[side < 0 ? 0 : 1] || 0) * side * -1;
    const by = ey - (F.eyes === 'wide' ? 58 : 46) + F.browY;
    x.save(); x.translate(px, by); x.rotate(ang);
    x.lineWidth = 11; x.strokeStyle = INK; x.beginPath(); x.moveTo(-26, 0); x.lineTo(26, 0); x.stroke();
    x.restore();
  }
  // mouth
  const my = cy + 62;
  x.lineWidth = 9; x.strokeStyle = INK; x.fillStyle = INK;
  const m = F.mouth;
  if (m === 'flat') { x.beginPath(); x.moveTo(cx - 22, my); x.lineTo(cx + 22, my); x.stroke(); }
  if (m === 'smirk') { x.beginPath(); x.moveTo(cx - 24, my + 4); x.quadraticCurveTo(cx + 6, my + 6, cx + 28, my - 8); x.stroke(); }
  if (m === 'smile') { x.beginPath(); x.arc(cx, my - 18, 30, Math.PI * .2, Math.PI * .8); x.stroke(); }
  if (m === 'frown') { x.beginPath(); x.arc(cx, my + 24, 26, Math.PI * 1.2, Math.PI * 1.8); x.stroke(); }
  if (m === 'wobble') { x.beginPath(); x.moveTo(cx - 26, my + 2); for (let i = 1; i <= 4; i++) x.lineTo(cx - 26 + i * 13, my + (i % 2 ? -5 : 4)); x.stroke(); }
  if (m === 'o') { x.beginPath(); x.ellipse(cx, my + 4, 15, 20, 0, 0, 7); x.fill(); x.fillStyle = '#c9545a'; x.beginPath(); x.ellipse(cx, my + 14, 8, 6, 0, 0, 7); x.fill(); }
  if (m === 'grin' || m === 'grit') {
    const w2 = m === 'grin' ? 44 : 38, h2 = m === 'grin' ? 34 : 22, yy = my - (m === 'grin' ? 6 : 2);
    const g = new Path2D();
    if (m === 'grin') { g.moveTo(cx - w2, yy); g.lineTo(cx + w2, yy); g.quadraticCurveTo(cx + w2, yy + h2 * 1.2, cx, yy + h2 * 1.2); g.quadraticCurveTo(cx - w2, yy + h2 * 1.2, cx - w2, yy); }
    else g.roundRect(cx - w2, yy - h2 / 2, w2 * 2, h2, 8);
    inkPath(x, g, '#ffffff', 7);
    x.lineWidth = 4; x.beginPath(); for (let i = -1; i <= 1; i++) { x.moveTo(cx + i * w2 * .45, yy + (m === 'grit' ? -h2 / 2 : 0)); x.lineTo(cx + i * w2 * .45, yy + (m === 'grit' ? h2 / 2 : h2)); } x.stroke();
    if (m === 'grit') { x.beginPath(); x.moveTo(cx - w2, yy); x.lineTo(cx + w2, yy); x.stroke(); }
  }
  if (S.mustache) {
    const mu = new Path2D(); mu.moveTo(cx, my - 20);
    mu.bezierCurveTo(cx - 22, my - 34, cx - 50, my - 26, cx - 60, my - 6); mu.bezierCurveTo(cx - 40, my - 18, cx - 18, my - 14, cx, my - 12);
    mu.bezierCurveTo(cx + 18, my - 14, cx + 40, my - 18, cx + 60, my - 6); mu.bezierCurveTo(cx + 50, my - 26, cx + 22, my - 34, cx, my - 20);
    x.fillStyle = S.mustacheCol || INK; x.fill(mu);
  }
}

function hat(x, S, cx, cy, R) {
  const H = S.hat, c1 = S.hatCol, c2 = S.hatCol2;
  if (!H || H === 'hair') return;
  if (H === 'bun') {
    const b = new Path2D(); b.arc(cx + 8, cy - R - 26, 46, 0, 7); inkPath(x, b, S.hair, 9);
    x.strokeStyle = shade(S.hair, 1.6); x.lineWidth = 4; x.beginPath(); x.arc(cx + 8, cy - R - 26, 26, .5, 2.6); x.stroke();
    // hairline over the forehead
    const hl = new Path2D(); hl.moveTo(cx - R * .98, cy - 40); hl.quadraticCurveTo(cx - 40, cy - R * .5, cx + 10, cy - R * .55); hl.quadraticCurveTo(cx + 70, cy - R * .6, cx + R * .98, cy - 40);
    hl.arc(cx, cy, R, -0.3, Math.PI + .3, true); hl.closePath();
    inkPath(x, hl, S.hair, 9);
    return;
  }
  if (H === 'top') {
    const crown = new Path2D(); crown.moveTo(cx - 84, cy - R + 26); crown.lineTo(cx - 76, cy - R - 120); crown.quadraticCurveTo(cx, cy - R - 138, cx + 76, cy - R - 120); crown.lineTo(cx + 84, cy - R + 26); crown.closePath();
    inkPath(x, crown, c1, 10);
    x.fillStyle = c2; x.fillRect(cx - 82, cy - R - 6, 164, 24); x.strokeStyle = INK; x.lineWidth = 6; x.strokeRect(cx - 82, cy - R - 6, 164, 24);
    x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(cx - 60, cy - R - 112, 18, 100);
    const brim = new Path2D(); brim.ellipse(cx, cy - R + 28, 128, 22, 0, 0, 7); inkPath(x, brim, c1, 10);
  }
  if (H === 'bowler') {
    const d = new Path2D(); d.moveTo(cx - 108, cy - R + 34); d.bezierCurveTo(cx - 110, cy - R - 100, cx + 110, cy - R - 100, cx + 108, cy - R + 34); d.closePath();
    inkPath(x, d, c1, 10);
    x.fillStyle = 'rgba(255,255,255,.16)'; x.beginPath(); x.ellipse(cx - 40, cy - R - 30, 20, 34, -.4, 0, 7); x.fill();
    const brim = new Path2D(); brim.ellipse(cx, cy - R + 34, 138, 20, 0, 0, 7); inkPath(x, brim, c1, 10);
  }
  if (H === 'cap') {
    const cap = new Path2D(); cap.moveTo(cx - R - 6, cy - 44); cap.bezierCurveTo(cx - R, cy - R - 70, cx + R, cy - R - 76, cx + R + 10, cy - 50); cap.closePath();
    x.save(); x.clip(cap); x.fillStyle = c1; x.fillRect(0, 0, CW, CH);
    x.strokeStyle = c2; x.lineWidth = 12; // panel stripes
    for (let i = -6; i <= 6; i++) { x.beginPath(); x.moveTo(cx + i * 34, cy - 40); x.quadraticCurveTo(cx + i * 20, cy - R - 20, cx, cy - R - 60); x.stroke(); }
    x.restore(); inkPath(x, cap, null, 10);
    const btn = new Path2D(); btn.arc(cx, cy - R - 48, 13, 0, 7); inkPath(x, btn, c1, 7);
    const v = new Path2D(); v.moveTo(cx - R - 10, cy - 46); v.quadraticCurveTo(cx - R - 40, cy - 20, cx - R - 34, cy - 8); v.quadraticCurveTo(cx - 40, cy - 22, cx + 10, cy - 46); v.closePath();
    inkPath(x, v, shade(c1, .7), 9);
  }
  if (H === 'helmet') {
    const d = new Path2D(); d.moveTo(cx - R - 10, cy - 40); d.bezierCurveTo(cx - R, cy - R - 90, cx + R, cy - R - 90, cx + R + 10, cy - 40); d.closePath();
    inkPath(x, d, c1, 10);
    x.strokeStyle = shade(c1, .7); x.lineWidth = 6; for (const o of [-50, 0, 50]) { x.beginPath(); x.moveTo(cx + o, cy - R - 60); x.quadraticCurveTo(cx + o * 1.4, cy - 90, cx + o * 1.8, cy - 46); x.stroke(); }
    const brim = new Path2D(); brim.ellipse(cx + 20, cy - 40, R + 50, 22, .04, 0, 7); inkPath(x, brim, c1, 9);
    const badge = new Path2D(); badge.moveTo(cx, cy - R - 30); badge.lineTo(cx + 28, cy - R + 10); badge.lineTo(cx, cy - R + 44); badge.lineTo(cx - 28, cy - R + 10); badge.closePath(); inkPath(x, badge, '#e7c35a', 6);
  }
  if (H === 'wig') {
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) { const c = new Path2D(); c.arc(cx + side * (R - 6), cy - 70 + i * 52, 30, 0, 7); inkPath(x, c, '#f2efe8', 7); }
    const t = new Path2D(); t.moveTo(cx - R + 8, cy - 60); t.bezierCurveTo(cx - R, cy - R - 70, cx + R, cy - R - 70, cx + R - 8, cy - 60); t.quadraticCurveTo(cx, cy - R + 10, cx - R + 8, cy - 60); inkPath(x, t, '#f2efe8', 9);
    x.strokeStyle = '#c9c3b6'; x.lineWidth = 5; for (let i = -2; i <= 2; i++) { x.beginPath(); x.arc(cx + i * 40, cy - R - 10, 18, Math.PI, 0); x.stroke(); }
  }
  if (H === 'beanie') {
    const b = new Path2D(); b.moveTo(cx - R - 4, cy - 52); b.bezierCurveTo(cx - R, cy - R - 80, cx + R, cy - R - 80, cx + R + 4, cy - 52); b.closePath();
    x.save(); x.clip(b); x.fillStyle = c1; x.fillRect(0, 0, CW, CH);
    x.fillStyle = c2; for (let i = 0; i < 4; i++) x.fillRect(0, cy - R - 60 + i * 40, CW, 16);
    x.restore(); inkPath(x, b, null, 10);
    const band = new Path2D(); band.roundRect(cx - R - 8, cy - 86, 2 * R + 16, 40, 16); inkPath(x, band, shade(c1, .85), 9);
    const pom = new Path2D(); pom.arc(cx, cy - R - 64, 28, 0, 7); inkPath(x, pom, c2, 8);
  }
}

export function prop(x, p, hand) {
  x.save(); x.translate(hand.x, hand.y);
  const t = p.type;
  if (t === 'cup') {
    const c = new Path2D(); c.moveTo(-26, -40); c.lineTo(26, -40); c.lineTo(20, 18); c.lineTo(-20, 18); c.closePath();
    inkPath(x, c, '#e9e3d6', 7);
    x.fillStyle = '#4a2410'; x.beginPath(); x.ellipse(0, -38, 24, 7, 0, 0, 7); x.fill();
    x.lineWidth = 6; x.strokeStyle = INK; x.beginPath(); x.arc(30, -14, 14, -1.3, 1.3); x.stroke();
  }
  if (t === 'bottle') {
    x.rotate(p.tilt || 0);
    const b = new Path2D(); b.moveTo(-26, 30); b.lineTo(-26, -60); b.quadraticCurveTo(-26, -90, -10, -100); b.lineTo(-10, -132); b.lineTo(10, -132); b.lineTo(10, -100); b.quadraticCurveTo(26, -90, 26, -60); b.lineTo(26, 30); b.closePath();
    inkPath(x, b, '#3f9a5c', 8);
    x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(-18, -84, 8, 100);
    x.fillStyle = '#efe4c4'; x.fillRect(-26, -40, 52, 40); x.strokeStyle = INK; x.lineWidth = 5; x.strokeRect(-26, -40, 52, 40);
    x.fillStyle = '#c0392b'; x.beginPath(); x.arc(0, -20, 10, 0, 7); x.fill();
    if (p.cap !== false) { const c = new Path2D(); c.rect(-13, -146, 26, 16); inkPath(x, c, '#d9d2c2', 5); }
  }
  if (t === 'brush') {
    x.rotate(p.tilt || 0);
    line(x, [[0, 0], [0, -110]], 12);
    const b = new Path2D(); b.roundRect(-34, -150, 68, 46, 8); inkPath(x, b, '#5a3418', 8);
    x.fillStyle = '#3b1d0a'; x.fillRect(-30, -150, 60, 16);
  }
  if (t === 'gavel') {
    x.rotate(p.tilt || 0);
    const h = new Path2D(); h.roundRect(-8, -120, 16, 120, 6); inkPath(x, h, '#8a5a32', 6);
    const hd = new Path2D(); hd.roundRect(-46, -150, 92, 40, 10); inkPath(x, hd, '#7a4a28', 8);
  }
  x.restore();
}
