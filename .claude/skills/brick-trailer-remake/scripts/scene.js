// Brick-style 3D trailer renderer. Stateless: every frame is built from (shot, local time),
// so frames can be rendered in any order. Exposes window.renderAt(t) -> JPEG data URL.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const qs = new URLSearchParams(location.search);
const SPEC = await (await fetch(qs.get('shots'))).json();
const W = SPEC.width, H = SPEC.height, FPS = SPEC.fps;
const ENV = SPEC.audioEnv || [];
const D = Math.PI / 180;

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 2000);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.7, 0.5, 0.9);
composer.addPass(bloom); composer.addPass(new OutputPass());

const out = document.createElement('canvas'); out.width = W; out.height = H;
const octx = out.getContext('2d');

// ---------- helpers ----------
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const lerp = (a, b, u) => a + (b - a) * u;
const lerp3 = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
const ease = u => u * u * (3 - 2 * u);
const mats = new Map();
function plastic(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0, envMapIntensity: 0.6, ...o }));
  return mats.get(k);
}
const glow = (color, i = 3) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: i });
function mesh(geo, mat, cast = true, recv = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; return m; }
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const studGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.18, 16);
// A brick: w x d studs footprint, h in units (1 brick = 1.2), studs on top.
function brick(w, h, d, color, studs = true) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(w - 0.02, h, d - 0.02), plastic(color)));
  g.children[0].position.y = h / 2;
  if (studs && w * d <= 64) for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
    const s = mesh(studGeo, plastic(color)); s.position.set(i - w / 2 + 0.5, h + 0.09, j - d / 2 + 0.5); g.add(s);
  }
  return g;
}
// Big studded baseplate (instanced studs).
function baseplate(w, d, color, y = 0, step = 1) {
  const g = new THREE.Group();
  const top = mesh(new THREE.BoxGeometry(w, 0.4, d), plastic(color), false, true); top.position.y = y - 0.2; g.add(top);
  const nx = Math.floor(w / step), nz = Math.floor(d / step);
  const inst = new THREE.InstancedMesh(studGeo, plastic(color), nx * nz); inst.receiveShadow = true;
  const m = new THREE.Matrix4(); let k = 0;
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { m.makeTranslation(-w / 2 + (i + 0.5) * step, y + 0.09, -d / 2 + (j + 0.5) * step); inst.setMatrixAt(k++, m); }
  g.add(inst); return g;
}
function skyDome(draw, radius = 600) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), new THREE.MeshBasicMaterial({ map: canvasTex(1024, 512, draw), side: THREE.BackSide, fog: false, toneMapped: false }));
  return m;
}
function clouds(ctx, w, h, seed, top, bottom, puff, n = 160) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(0.55, bottom); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const r = rng(seed); ctx.filter = 'blur(10px)';
  for (let i = 0; i < n; i++) { ctx.fillStyle = puff(r()); ctx.beginPath(); ctx.ellipse(r() * w, h * 0.2 + r() * h * 0.35, 30 + r() * 90, 12 + r() * 30, 0, 0, 7); ctx.fill(); }
  ctx.filter = 'none';
}

// ---------- minifig-style figure ----------
function faceTexture(c, mode) {
  return canvasTex(512, 256, (x, w, h) => {
    x.fillStyle = c.skin; x.fillRect(0, 0, w, h);
    const cx = 256;
    if (c.beard) { x.fillStyle = c.beard; x.globalAlpha = 0.85; x.beginPath(); x.moveTo(cx - 70, 120); x.quadraticCurveTo(cx - 72, 230, cx, 236); x.quadraticCurveTo(cx + 72, 230, cx + 70, 120); x.lineTo(cx + 52, 135); x.quadraticCurveTo(cx, 205, cx - 52, 135); x.fill(); x.globalAlpha = 1; }
    if (c.paint) { x.fillStyle = c.paint; x.globalAlpha = 0.8; x.fillRect(cx - 62, 92, 124, 40); x.globalAlpha = 1; }
    const ey = 110, br = c.brows || '#3a2416';
    x.strokeStyle = br; x.lineWidth = 7; x.lineCap = 'round';
    const tilt = c.expr === 'grim' ? 8 : c.expr === 'smile' ? -4 : 2;
    x.beginPath(); x.moveTo(cx - 44, ey - 26 - tilt); x.lineTo(cx - 14, ey - 24 + tilt); x.moveTo(cx + 44, ey - 26 - tilt); x.lineTo(cx + 14, ey - 24 + tilt); x.stroke();
    for (const s of [-1, 1]) { x.fillStyle = '#111'; x.beginPath(); x.ellipse(cx + s * 28, ey, 9, 12, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + s * 28 + 3, ey - 4, 3, 0, 7); x.fill(); }
    x.strokeStyle = '#2a1a12'; x.lineWidth = 6; x.fillStyle = '#3b0f0f';
    if (mode === 'open') { x.beginPath(); x.ellipse(cx, 168, 20, 13, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.fillRect(cx - 14, 157, 28, 6); }
    else if (c.expr === 'smile') { x.beginPath(); x.arc(cx, 150, 28, 0.2 * Math.PI, 0.8 * Math.PI); x.stroke(); }
    else { x.beginPath(); x.moveTo(cx - 22, 168); x.quadraticCurveTo(cx, 164, cx + 22, 168); x.stroke(); }
  });
}
function torsoTexture(c) {
  return canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = c.torso; x.fillRect(0, 0, w, h);
    const a = c.accent || '#999', s = c.print;
    x.lineWidth = 8; x.strokeStyle = a; x.fillStyle = a;
    if (s === 'armor') {
      x.beginPath(); x.moveTo(30, 20); x.lineTo(128, 120); x.lineTo(226, 20); x.lineTo(226, 70); x.lineTo(128, 160); x.lineTo(30, 70); x.fill();
      x.fillStyle = c.emblem || '#ffd84a'; x.beginPath(); x.arc(128, 128, 24, 0, 7); x.fill();
      x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 4; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(60, 180 + i * 22); x.lineTo(196, 180 + i * 22); x.stroke(); }
    } else if (s === 'jacket') {
      x.fillStyle = a; x.beginPath(); x.moveTo(70, 0); x.lineTo(128, 90); x.lineTo(186, 0); x.fill();
      x.strokeStyle = '#ccc'; x.lineWidth = 4; x.beginPath(); x.moveTo(128, 90); x.lineTo(128, 256); x.stroke();
      x.strokeStyle = 'rgba(0,0,0,.4)'; x.strokeRect(40, 160, 50, 40); x.strokeRect(166, 160, 50, 40);
    } else if (s === 'jumpsuit') {
      x.fillRect(0, 100, 256, 30); x.fillRect(110, 0, 36, 256);
      x.fillStyle = c.emblem || '#fff'; x.beginPath(); x.arc(70, 60, 18, 0, 7); x.fill();
    } else if (s === 'robe') {
      x.strokeStyle = a; x.lineWidth = 12; x.beginPath(); x.moveTo(40, 0); x.lineTo(128, 150); x.lineTo(216, 0); x.moveTo(128, 150); x.lineTo(128, 256); x.stroke();
      x.fillStyle = c.emblem || '#c08bff'; x.beginPath(); x.moveTo(128, 175); x.lineTo(145, 205); x.lineTo(128, 235); x.lineTo(111, 205); x.fill();
    }
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, 236, 256, 20);
  });
}
const headGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.75, 48, 1, false, Math.PI);
function buildFigure(id, c) {
  const root = new THREE.Group(); root.name = id;
  const body = new THREE.Group(); root.add(body); root.scale.setScalar(1.25 * (c.scale || 1));
  const P = col => plastic(col);
  // legs
  const legs = [];
  for (const s of [-1, 1]) {
    const lg = new THREE.Group(); lg.position.set(s * 0.37, 1.2, 0);
    const m = mesh(new THREE.BoxGeometry(0.7, 1.2, 0.8), P(c.legs)); m.position.y = -0.6; lg.add(m);
    const foot = mesh(new THREE.BoxGeometry(0.7, 0.35, 0.3), P(c.boots || c.legs)); foot.position.set(0, -1.02, 0.5); lg.add(foot);
    body.add(lg); legs.push(lg);
  }
  const hips = mesh(new THREE.BoxGeometry(1.5, 0.3, 0.8), P(c.hips || c.legs)); hips.position.y = 1.35; body.add(hips);
  // torso (tapered box, printed front)
  const tg = new THREE.BoxGeometry(1.55, 1.25, 0.8); const p = tg.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setX(i, p.getX(i) * 0.74);
  tg.computeVertexNormals();
  const tm = P(c.torso), front = new THREE.MeshStandardMaterial({ map: torsoTexture(c), roughness: 0.3, envMapIntensity: 0.6 });
  const torso = mesh(tg, [tm, tm, tm, tm, front, tm]); torso.position.y = 2.125; body.add(torso);
  if (c.pads) for (const s of [-1, 1]) { const pd = mesh(new THREE.BoxGeometry(0.55, 0.22, 0.95), plastic(c.pads, { metalness: 0.6, roughness: 0.3 })); pd.position.set(s * 0.62, 2.78, 0); pd.rotation.z = s * -0.25; body.add(pd); }
  // arms
  const arms = {};
  for (const [nm, s] of [['R', -1], ['L', 1]]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.72, 2.55, 0);
    const tilt = new THREE.Group(); tilt.rotation.z = s * 0.14; sh.add(tilt);
    const am = mesh(new THREE.CylinderGeometry(0.22, 0.25, 1.0, 16), P(c.arms || c.torso)); am.position.y = -0.42; tilt.add(am);
    const hand = new THREE.Group(); hand.position.set(0, -1.02, 0.05); tilt.add(hand);
    const hm = mesh(new THREE.TorusGeometry(0.17, 0.085, 10, 20, 1.6 * Math.PI), P(c.hands || c.skin)); hm.rotation.z = -0.3 * Math.PI; hand.add(hm);
    body.add(sh); arms[nm] = { sh, tilt, am, hand, hm };
  }
  // head
  const faceN = new THREE.MeshStandardMaterial({ map: faceTexture(c, 'closed'), roughness: 0.3, envMapIntensity: 0.6 });
  const faceO = new THREE.MeshStandardMaterial({ map: faceTexture(c, 'open'), roughness: 0.3, envMapIntensity: 0.6 });
  const headG = new THREE.Group(); headG.position.y = 2.85; body.add(headG);
  const neck = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.12, 16), P(c.skin)); neck.position.y = 0.04; headG.add(neck);
  const head = mesh(headGeo, [faceN, P(c.skin), P(c.skin)]); head.position.y = 0.475; headG.add(head);
  const stud = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.18, 20), P(c.skin)); stud.position.y = 0.94; headG.add(stud);
  const hc = c.hair, hm = c.hairMat === 'metal' ? plastic(hc, { metalness: 0.9, roughness: 0.25 }) : P(hc);
  const H = c.hairStyle;
  if (H === 'short' || H === 'long' || H === 'hood') {
    const r = H === 'hood' ? 0.56 : 0.5, cap = mesh(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), hm);
    cap.scale.y = 0.62; cap.position.y = 0.78; headG.add(cap);
    const len = H === 'short' ? 0.55 : H === 'long' ? 1.05 : 1.0;
    const back = mesh(new THREE.CylinderGeometry(r, r + (H === 'short' ? 0 : 0.06), len, 32, 1, true, Math.PI / 2 + (H === 'hood' ? -0.5 : 0), Math.PI + (H === 'hood' ? 1.0 : 0)), hm);
    back.material = hm.clone(); back.material.side = THREE.DoubleSide; back.position.y = 0.8 - len / 2; headG.add(back);
    if (H !== 'hood') { const fr = mesh(new THREE.BoxGeometry(0.75, 0.16, 0.2), hm); fr.position.set(0.05, 0.8, 0.38); fr.rotation.z = 0.12; headG.add(fr); }
    stud.visible = false;
  } else if (H === 'helmet') {
    const hel = mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.95, 40), plastic(hc, { metalness: 0.5, roughness: 0.3 })); hel.position.y = 0.5; headG.add(hel);
    const vis = mesh(new THREE.BoxGeometry(0.7, 0.2, 0.2), glow(c.visor || '#ff5533', 2.5)); vis.position.set(0, 0.55, 0.47); headG.add(vis);
    const fin = mesh(new THREE.BoxGeometry(0.12, 0.35, 0.9), plastic(c.accent || hc)); fin.position.y = 1.05; headG.add(fin);
  }
  if (c.mask) {
    const mt = canvasTex(256, 128, (x, w, h) => { x.fillStyle = c.mask; x.fillRect(0, 0, w, h); x.fillStyle = '#100018'; x.fillRect(84, 48, 88, 14); x.fillRect(122, 62, 12, 40); x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = 4; x.strokeRect(70, 20, 116, 96); });
    const mk = mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.72, 32, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ map: mt, metalness: 0.9, roughness: 0.25, side: THREE.DoubleSide }));
    mk.position.y = 0.47; headG.add(mk);
    const eyes = mesh(new THREE.BoxGeometry(0.34, 0.05, 0.05), glow(c.glow || '#d04dff', 4)); eyes.position.set(0, 0.6, 0.47); headG.add(eyes);
  }
  if (c.goggles) for (const s of [-1, 1]) { const gg = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.12, 20), plastic('#cfd6dc', { metalness: 0.8, roughness: 0.2 })); gg.rotation.x = Math.PI / 2; gg.position.set(s * 0.17, 0.98, 0.32); headG.add(gg); }
  // cape / robe
  let cape = null;
  if (c.cape) { cape = new THREE.Group(); cape.position.set(0, 2.8, -0.42); const cm = mesh(new THREE.BoxGeometry(1.6, 2.4, 0.06), P(c.cape)); cm.position.y = -1.2; cape.add(cm); body.add(cape); }
  if (c.robe) { const rb = mesh(new THREE.CylinderGeometry(0.82, 1.05, 1.55, 32, 1, true), plastic(c.robe, { side: THREE.DoubleSide })); rb.position.y = 0.77; body.add(rb); legs.forEach(l => l.visible = false); }
  // held prop
  let prop = null;
  if (c.prop) {
    prop = new THREE.Group();
    const len = c.prop.len || 4.2;
    const shaft = mesh(new THREE.CylinderGeometry(0.07, 0.07, len, 12), plastic(c.prop.color || '#8a8f96', { metalness: 0.7, roughness: 0.3 })); prop.add(shaft);
    if (c.prop.tip) {
      const tip = mesh(new THREE.OctahedronGeometry(0.32), glow(c.prop.tip, 4)); tip.scale.y = 1.6; tip.position.y = len / 2 + 0.3; prop.add(tip);
      const pl = new THREE.PointLight(c.prop.tip, 6, 12, 2); pl.position.copy(tip.position); prop.add(pl); prop.userData.light = pl;
    }
    if (c.prop.blade) { const bl = mesh(new THREE.ConeGeometry(0.2, 0.9, 4), plastic('#d9dde2', { metalness: 0.9, roughness: 0.15 })); bl.position.y = len / 2 + 0.45; prop.add(bl); }
    prop.position.y = c.prop.offset || 0.8; const holder = new THREE.Group(); holder.add(prop);
    arms[c.prop.hand || 'R'].hand.add(holder); prop = holder;
  }
  let handGlow = null;
  if (c.glow) { handGlow = mesh(new THREE.SphereGeometry(0.3, 16, 12), glow(c.glow, 5)); arms.R.hand.add(handGlow); const pl = new THREE.PointLight(c.glow, 8, 10, 2); handGlow.add(pl); }
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  root.userData = { c, body, legs, arms, headG, head, faceN, faceO, cape, prop, handGlow };
  return root;
}
const figs = {};
for (const [id, c] of Object.entries(SPEC.cast)) { figs[id] = buildFigure(id, c); figs[id].visible = false; scene.add(figs[id]); }

function poseFigure(fig, a, u, lt, frame) {
  const d = fig.userData, p0 = a.pose || {}, p1 = { ...p0, ...(a.pose2 || {}) }, e = ease(u);
  const P = k => lerp(p0[k] ?? 0, p1[k] ?? 0, e) * D;
  const pos = a.p2 ? lerp3(a.p, a.p2, a.walk ? u : e) : a.p;
  fig.position.set(pos[0], a.y || 0, pos[1]);
  fig.rotation.y = lerp(a.ry || 0, a.ry2 ?? a.ry ?? 0, e) * D;
  const A = d.arms;
  A.R.sh.rotation.set(-P('aR'), 0, -P('sR')); A.L.sh.rotation.set(-P('aL'), 0, P('sL'));
  d.headG.rotation.y = P('head'); d.headG.rotation.x = -P('look');
  d.legs.forEach(l => l.rotation.x = 0); d.body.position.y = 0;
  if (a.walk) {
    const ph = (lt + (a.phase || 0)) * 2 * Math.PI * 1.7;
    d.legs[0].rotation.x = Math.sin(ph) * 0.45; d.legs[1].rotation.x = -Math.sin(ph) * 0.45;
    if (!p0.aR) A.R.sh.rotation.x = -Math.sin(ph) * 0.35; if (!p0.aL) A.L.sh.rotation.x = Math.sin(ph) * 0.35;
    d.body.position.y = Math.abs(Math.sin(ph)) * 0.06;
  }
  if (d.cape) d.cape.rotation.x = 0.12 + Math.sin(lt * 2.3 + fig.id) * 0.04 + (a.walk ? 0.15 : 0) + (a.wind || 0) * (0.25 + 0.1 * Math.sin(lt * 9));
  if (d.prop) d.prop.visible = a.prop ?? (a.charge !== undefined || a.hold !== undefined || !!d.c.prop.always);
  if (d.prop) { const h = a.hold || {}; d.prop.rotation.set((h.rx ?? (P('aR') / D)) * D, 0, (h.rz || 0) * D); }
  const open = a.talk && (ENV[frame] || 0) > 0.55 && ((frame >> 1) % 3 !== 0);
  d.head.material[0] = open ? d.faceO : d.faceN;
  if (d.handGlow) d.handGlow.visible = !!a.glow;
  if (d.prop && d.prop.children[0].userData.light) d.prop.children[0].userData.light.intensity = 6 + (a.charge || 0) * (20 + 15 * Math.sin(lt * 40));
}

// ---------- sets ----------
const sets = {};
const lightRig = new THREE.Group(); scene.add(lightRig);
const key = new THREE.DirectionalLight(0xffffff, 2); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 120 }); key.shadow.bias = -0.0005;
const fill = new THREE.HemisphereLight(0xffffff, 0x222222, 0.5), amb = new THREE.AmbientLight(0xffffff, 0.1);
lightRig.add(key, key.target, fill, amb);

function addSet(name, build) { const g = new THREE.Group(); g.visible = false; build(g); scene.add(g); sets[name] = g; }

addSet('shipRound', g => {
  g.add(baseplate(36, 36, '#3a3f46'));
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2, w = brick(3, 11, 1, i % 2 ? '#2b3038' : '#343a42', false);
    w.position.set(Math.sin(a) * 13, 0, Math.cos(a) * 13); w.rotation.y = a; g.add(w);
    const strip = mesh(new THREE.BoxGeometry(2.2, 0.25, 0.2), glow('#5fb0ff', 2.2), false, false); strip.position.set(Math.sin(a) * 12.4, 7.5, Math.cos(a) * 12.4); strip.rotation.y = a; g.add(strip);
  }
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, b = mesh(new THREE.BoxGeometry(1, 0.6, 13), plastic('#23272d')); b.position.set(Math.sin(a) * 6.5, 11, Math.cos(a) * 6.5); b.rotation.y = a; g.add(b);
    const l = mesh(new THREE.BoxGeometry(0.5, 0.1, 6), glow('#fff2d6', 1.1), false, false); l.position.set(Math.sin(a) * 6.5, 10.65, Math.cos(a) * 6.5); l.rotation.y = a; g.add(l); }
  const ring = mesh(new THREE.TorusGeometry(4.5, 0.35, 12, 64), plastic('#8c939b', { metalness: 0.7 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.4; g.add(ring);
  const con = mesh(new THREE.CylinderGeometry(1.6, 1.9, 2.4, 24), plastic('#555c66')); con.position.set(-6, 1.2, -4); g.add(con);
  const lamp = mesh(new THREE.SphereGeometry(0.7, 20, 16), glow('#ffd7a0', 5), false, false); lamp.position.set(-7.5, 5, -5); g.add(lamp);
  const pl = new THREE.PointLight('#ffc888', 120, 40, 2); pl.position.copy(lamp.position); pl.castShadow = true; g.add(pl);
  g.userData.light = { key: [10, 14, 6], kc: '#ffd2a0', ki: 1.4, hemi: ['#88a0c0', '#201810', 0.35], bg: '#07090c', fog: ['#0b0d10', 0.015] };
});

addSet('villainSky', g => {
  g.add(baseplate(80, 80, '#4b4640'));
  const r = rng(7);
  for (let i = 0; i < 26; i++) { const b = brick(2 + Math.floor(r() * 3), 1.2 * (1 + Math.floor(r() * 6)), 2, r() > 0.5 ? '#5d564d' : '#6b6359', false); b.position.set((r() - 0.5) * 60, 0, -8 - r() * 30); b.rotation.y = r() * 3; g.add(b); }
  for (const x of [-14, 14]) { const gi = buildFigure('giant', { skin: '#2a2a30', torso: '#2a2a30', legs: '#25252a', print: 'none', hairStyle: 'helmet', hair: '#33333a', visor: '#ffb347' }); gi.scale.setScalar(5); gi.position.set(x, 0, -28); g.add(gi); }
  g.add(skyDome((x, w, h) => { clouds(x, w, h, 3, '#3d3f48', '#b38a63', v => `rgba(${70 + v * 60},${68 + v * 50},${70 + v * 40},.55)`, 220); const s = x.createRadialGradient(w * 0.56, h * 0.42, 0, w * 0.56, h * 0.42, 90); s.addColorStop(0, '#fff6dd'); s.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = s; x.fillRect(0, 0, w, h); }));
  g.userData.light = { key: [8, 10, -14], kc: '#ffd9a8', ki: 2.4, hemi: ['#9a9aa8', '#3a3028', 0.6], bg: '#555', fog: ['#7a6e64', 0.018] };
});

addSet('cathedral', g => {
  g.add(baseplate(30, 30, '#2a2422'));
  const win = canvasTex(512, 768, (x, w, h) => {
    x.fillStyle = '#100a08'; x.fillRect(0, 0, w, h); const r = rng(11); const cols = ['#ff8a2a', '#ffcf4a', '#c43a1c', '#ff6a1a', '#e6a23c'];
    for (let i = 0; i < 8; i++) for (let j = 0; j < 12; j++) { x.fillStyle = cols[Math.floor(r() * cols.length)]; x.fillRect(i * 64 + 6, j * 64 + 6, 52, 52); }
    x.strokeStyle = '#100a08'; x.lineWidth = 16; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.stroke(); }
    x.beginPath(); x.arc(256, 256, 180, 0, 7); x.stroke();
  });
  const wm = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: win, emissiveIntensity: 1.6 });
  const w = mesh(new THREE.PlaneGeometry(8, 12), wm, false, false); w.position.set(1, 6.5, -8); g.add(w); g.userData.window = wm;
  for (const x of [-4.4, 6.4]) { const p = brick(2, 14, 2, '#3a302a', false); p.position.set(x, 0, -8); g.add(p); }
  const wall = mesh(new THREE.BoxGeometry(40, 16, 1), plastic('#241d1a')); wall.position.set(0, 8, -8.6); wall.material = plastic('#241d1a'); g.add(wall);
  const hole = new THREE.Group(); g.add(hole);
  wall.visible = false; // window plane is the visible wall face; side columns frame it
  for (const x of [-12, 14]) { const s = mesh(new THREE.BoxGeometry(12, 16, 1), plastic('#241d1a')); s.position.set(x, 8, -8.4); g.add(s); }
  const top = mesh(new THREE.BoxGeometry(40, 4, 1), plastic('#241d1a')); top.position.set(0, 14.5, -8.4); g.add(top);
  const fire = new THREE.PointLight('#ff7a2a', 260, 40, 2); fire.position.set(1, 6, -5); g.add(fire); g.userData.fire = fire;
  g.userData.light = { key: [2, 8, -14], kc: '#ff9a50', ki: 1.2, hemi: ['#3a2010', '#0a0505', 0.2], bg: '#050303', fog: ['#120804', 0.03] };
});

addSet('desert', g => {
  g.add(baseplate(90, 70, '#d8c08e'));
  const r = rng(5);
  for (let i = 0; i < 40; i++) { const b = brick(4, 1.2 * (2 + Math.floor(r() * 4)), 2, r() > 0.5 ? '#cdb07a' : '#bfa06c', false); b.position.set(-80 + i * 4.1, 0, -40 - r() * 6); g.add(b); }
  for (const x of [-10, -7, 9, 12]) { const pole = brick(1, 9, 1, '#6b4a2b', false); pole.position.set(x, 0, -6); g.add(pole); const fl = mesh(new THREE.BoxGeometry(1.6, 2.4, 0.05), plastic(x < 0 ? '#7a1f2b' : '#1f4f7a')); fl.position.set(x + 0.8, 8, -6); g.add(fl); }
  g.add(skyDome((x, w, h) => clouds(x, w, h, 9, '#8fb4d8', '#f2ead8', v => `rgba(255,255,255,${0.15 + v * 0.25})`, 90)));
  g.userData.light = { key: [-12, 22, 10], kc: '#fff4e0', ki: 2.4, hemi: ['#cfe0ff', '#c8a878', 0.6], bg: '#dfe6ec', fog: ['#e8e2d4', 0.0025], exposure: 0.7 };
});

addSet('hall', g => {
  g.add(baseplate(30, 50, '#3a2c20'));
  for (let z = -22; z <= 6; z += 7) for (const x of [-7, 7]) {
    const p = brick(2, 13, 2, '#8a6a2a', false); p.position.set(x, 0, z); p.traverse(o => { if (o.isMesh) o.material = plastic('#9a7a32', { metalness: 0.6, roughness: 0.35 }); }); g.add(p);
    const f = mesh(new THREE.ConeGeometry(0.35, 1.1, 10), glow('#ffb24a', 6), false, false); f.position.set(x * 0.86, 5.6, z + 0.2); g.add(f);
  }
  for (const z of [-15, -1]) { const pl = new THREE.PointLight('#ffab4a', 160, 30, 2); pl.position.set(0, 7, z); g.add(pl); }
  const back = mesh(new THREE.BoxGeometry(30, 16, 1), plastic('#1c140e')); back.position.set(0, 8, -25); g.add(back);
  g.userData.light = { key: [6, 12, -10], kc: '#ffbf80', ki: 1.0, hemi: ['#604020', '#100804', 0.25], bg: '#060403', fog: ['#0c0805', 0.035] };
});

addSet('storm', g => {
  g.add(baseplate(80, 80, '#2c3440'));
  const r = rng(21);
  for (let i = 0; i < 60; i++) { const b = brick(1 + Math.floor(r() * 4), 1.2 * (1 + Math.floor(r() * 3)), 1 + Math.floor(r() * 3), r() > 0.5 ? '#38404c' : '#454d58'); b.position.set((r() - 0.5) * 50, 0, -30 + r() * 40); b.rotation.y = r() * 3; g.add(b); }
  g.add(skyDome((x, w, h) => clouds(x, w, h, 4, '#05080f', '#1a2d48', v => `rgba(${30 + v * 40},${60 + v * 50},${100 + v * 60},.5)`, 240)));
  g.userData.bolts = new THREE.Group(); g.add(g.userData.bolts);
  g.userData.flash = new THREE.PointLight('#bfe0ff', 0, 80, 1.5); g.add(g.userData.flash);
  g.userData.light = { key: [-6, 18, -12], kc: '#9cc8ff', ki: 1.2, hemi: ['#3a5a80', '#0a0e14', 0.5], bg: '#0a1220', fog: ['#0e1a2a', 0.025], exposure: 0.85 };
});

addSet('shipInterior', g => {
  g.add(baseplate(40, 30, '#2e3238'));
  const r = rng(31);
  const back = mesh(new THREE.BoxGeometry(40, 14, 1), plastic('#1e2228')); back.position.set(0, 7, -9); g.add(back);
  for (let i = 0; i < 18; i++) { const b = mesh(new THREE.BoxGeometry(0.4 + r() * 1.2, 0.3 + r() * 0.8, 0.1), glow(r() > 0.4 ? '#ffb86b' : '#7ac8ff', 2 + r() * 3), false, false); b.position.set(-16 + r() * 32, 2 + r() * 9, -8.4); g.add(b); }
  for (const x of [-9, -3, 3, 9]) { const p = brick(1, 14, 1, '#4a5058', false); p.position.set(x, 0, -8); g.add(p); }
  const winM = glow('#fff1d8', 0.35);
  for (const x of [-6, 0, 6]) { const w = mesh(new THREE.PlaneGeometry(4.6, 6), winM, false, false); w.position.set(x, 7, -8.45); g.add(w); }
  const pl = new THREE.PointLight('#ffcf99', 120, 30, 2); pl.position.set(-4, 8, 2); g.add(pl);
  g.userData.light = { key: [-8, 12, 8], kc: '#ffd8b0', ki: 1.6, hemi: ['#6a8aa8', '#1a1612', 0.45], bg: '#0b0d10', fog: ['#14161a', 0.012] };
});

addSet('city', g => {
  g.add(baseplate(26, 16, '#5a5f66'));
  const rail = mesh(new THREE.BoxGeometry(26, 0.3, 0.3), plastic('#8a9098', { metalness: 0.7 })); rail.position.set(0, 2.6, -7.5); g.add(rail);
  for (const x of [-10, -3.5, 3.5, 10]) { const p = brick(1, 16, 1, '#2a2e34', false); p.position.set(x, 0, -7.6); g.add(p); }
  const top = mesh(new THREE.BoxGeometry(30, 1, 2), plastic('#2a2e34')); top.position.set(0, 16, -7.6); g.add(top);
  const r = rng(41);
  const wt = canvasTex(64, 128, (x, w, h) => { x.fillStyle = '#9aa3ab'; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) for (let j = 0; j < 16; j++) { x.fillStyle = (i + j) % 3 ? '#6e7d8c' : '#cfd6db'; x.fillRect(i * 8 + 1, j * 8 + 1, 6, 6); } });
  wt.wrapS = wt.wrapT = THREE.RepeatWrapping;
  for (let i = 0; i < 70; i++) {
    const hgt = 12 + r() * 60, w = 6 + r() * 8, t = wt.clone(); t.needsUpdate = true; t.repeat.set(w / 8, hgt / 16);
    const b = mesh(new THREE.BoxGeometry(w, hgt, w), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, color: r() > 0.5 ? '#d8d0c4' : '#b8c0c8' }), false, false);
    b.position.set((r() - 0.5) * 220, hgt / 2 - 20, -40 - r() * 140); g.add(b);
  }
  const dome = mesh(new THREE.SphereGeometry(9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), plastic('#5f8a7a', { metalness: 0.4 }), false, false); dome.position.set(26, 2, -70); g.add(dome);
  const beam = mesh(new THREE.CylinderGeometry(3, 3, 260, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#fff4d0', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), false, false);
  beam.position.set(4, 110, -110); g.add(beam); g.userData.beam = beam;
  g.add(skyDome((x, w, h) => clouds(x, w, h, 13, '#a8b8c8', '#f4e2c4', v => `rgba(255,250,240,${0.2 + v * 0.3})`, 120)));
  g.userData.light = { key: [-14, 20, 24], kc: '#ffe8c8', ki: 2.0, hemi: ['#d0dcea', '#504840', 0.5], bg: '#e8dcc8', fog: ['#d8d0c4', 0.003], exposure: 0.6 };
});

// Neutral studio sweep, used for cast/turnaround sheets.
addSet('studio', g => {
  g.add(baseplate(60, 20, '#d6d9de'));
  const sweep = mesh(new THREE.CylinderGeometry(12, 12, 80, 32, 1, true, Math.PI, Math.PI / 2), plastic('#e4e7eb', { side: THREE.DoubleSide }), false, true);
  sweep.rotation.z = Math.PI / 2; sweep.position.set(0, 12, -10); g.add(sweep);
  const back = mesh(new THREE.PlaneGeometry(80, 40), plastic('#e4e7eb'), false, true); back.position.set(0, 30, -22); g.add(back);
  g.userData.light = { key: [6, 14, 12], kc: '#ffffff', ki: 2.4, hemi: ['#ffffff', '#9aa0a8', 0.9], bg: '#e4e7eb', fog: ['#e4e7eb', 0.0], exposure: 0.95 };
});

let logoFont = null;
addSet('logo', g => {
  const wall = baseplate(80, 50, '#0c1a12'); wall.rotation.x = Math.PI / 2; wall.position.z = -6; g.add(wall);
  const gl = new THREE.PointLight('#3dff8a', 80, 40, 2); gl.position.set(0, 0, -2); g.add(gl);
  g.userData.light = { key: [6, 8, 14], kc: '#e8fff0', ki: 2.0, hemi: ['#40ff90', '#001008', 0.4], bg: '#000', fog: ['#000', 0.0] };
});
const fontJson = await (await fetch('./node_modules/three/examples/fonts/helvetiker_bold.typeface.json')).json();
logoFont = new FontLoader().parse(fontJson);
function addLogoText(text, sub) {
  const chrome = new THREE.MeshStandardMaterial({ color: '#dfe6ea', metalness: 1, roughness: 0.22, envMapIntensity: 1.0 });
  const tg = new TextGeometry(text, { font: logoFont, size: 2.2, height: 0.7, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.08, bevelSegments: 3, curveSegments: 6 });
  tg.center(); const t = mesh(tg, chrome); t.position.y = 0.8; sets.logo.add(t);
  const sg = new TextGeometry(sub, { font: logoFont, size: 0.8, height: 0.2, curveSegments: 4 }); sg.center();
  const s = mesh(sg, glow('#4dff8f', 1.2)); s.position.set(0, -1.4, 0.3); sets.logo.add(s);
}
addLogoText(SPEC.logo?.title || 'BRICK LEGION', SPEC.logo?.subtitle || 'THE LAST STAND');

// lightning
const boltMat = glow('#cfe8ff', 3);
function buildBolts(group, seed, count, area) {
  group.children.forEach(c => c.geometry.dispose()); group.clear();
  const r = rng(seed);
  for (let b = 0; b < count; b++) {
    let pts = [new THREE.Vector3(area[0] + r() * area[1], 30, area[2] + r() * area[3])];
    const end = new THREE.Vector3(pts[0].x + (r() - 0.5) * 10, 0, pts[0].z + (r() - 0.5) * 6);
    for (let it = 0; it < 5; it++) { const n = []; for (let i = 0; i < pts.length; i++) { n.push(pts[i]); const nx = i + 1 < pts.length ? pts[i + 1] : end; const m = pts[i].clone().lerp(nx, 0.5); m.x += (r() - 0.5) * 6 / (it + 1); m.z += (r() - 0.5) * 3 / (it + 1); n.push(m); } pts = n; }
    pts.push(end);
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], c = pts[i + 1], len = a.distanceTo(c); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, len, 4), boltMat); s.position.copy(a).lerp(c, 0.5); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.clone().sub(a).normalize()); group.add(s); }
  }
}

// disintegration particles (brick bits)
const bitGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
const bits = new THREE.InstancedMesh(bitGeo, plastic('#3a2a4a'), 500); bits.visible = false; scene.add(bits);
function disintegrate(fig, lt, color) {
  const arm = fig.userData.arms.R; arm.am.visible = false; arm.hm.visible = false; if (fig.userData.handGlow) fig.userData.handGlow.visible = false;
  bits.material = plastic(color); bits.visible = true;
  fig.updateMatrixWorld(true); const M = arm.tilt.matrixWorld; const r = rng(99), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i < 500; i++) {
    const ly = -r() * 1.2, ang = r() * Math.PI * 2, rad = Math.sqrt(r()) * 0.22;
    v.set(Math.cos(ang) * rad, ly, Math.sin(ang) * rad).applyMatrix4(M);
    const release = (1.2 + ly) / 1.2 * 0.45 + r() * 0.08; // hand end first
    const age = Math.max(0, lt - release);
    v.x += -age * (2.0 + r() * 2.5); v.y += age * (0.6 + r()) + age * age * 0.5; v.z += (r() - 0.5) * age * 2;
    q.setFromEuler(new THREE.Euler(age * 8 * r(), age * 6 * r(), 0)); s.setScalar(Math.max(0, 1 - age * 0.8) * 1.25);
    m.compose(v, q, s); bits.setMatrixAt(i, m);
  }
  bits.instanceMatrix.needsUpdate = true;
}

// ---------- shot application ----------
function applyLight(L, sh) {
  const l = { ...L, ...(sh.light || {}) };
  key.position.set(...l.key); key.color.set(l.kc); key.intensity = l.ki; key.target.position.set(0, 0, 0);
  fill.color.set(l.hemi[0]); fill.groundColor.set(l.hemi[1]); fill.intensity = l.hemi[2];
  scene.background = new THREE.Color(l.bg); scene.fog = l.fog[1] > 0 ? new THREE.FogExp2(l.fog[0], l.fog[1]) : null;
  renderer.toneMappingExposure = l.exposure || 1;
}
function renderScene(sh, lt, t, frame) {
  const u = Math.min(1, lt / (sh.end - sh.start));
  for (const s of Object.values(sets)) s.visible = false;
  for (const f of Object.values(figs)) f.visible = false;
  bits.visible = false;
  const set = sets[sh.set]; set.visible = true; applyLight(set.userData.light, sh);
  for (const a of sh.actors || []) {
    const f = figs[a.id]; f.visible = true; f.userData.arms.R.am.visible = true; f.userData.arms.R.hm.visible = true;
    poseFigure(f, a, u, lt, frame);
    if (a.fx === 'disintegrate') disintegrate(f, lt, f.userData.c.arms || f.userData.c.torso);
  }
  const c = sh.cam, e = c.linear ? u : ease(u);
  const p = c.p2 ? lerp3(c.p, c.p2, e) : c.p, tg = c.t2 ? lerp3(c.t, c.t2, e) : c.t;
  camera.position.set(...p); camera.fov = c.fov || 40; camera.updateProjectionMatrix();
  if (c.shake) { const k = c.shake; camera.position.x += Math.sin(t * 53) * k; camera.position.y += Math.sin(t * 71 + 1) * k; }
  camera.lookAt(...tg); if (c.roll) camera.rotateZ(c.roll * D);
  bloom.strength = sh.bloom ?? 0.7;
  // set-specific fx
  if (sh.set === 'cathedral') { const fl = 0.75 + 0.25 * Math.sin(t * 17) * Math.sin(t * 7.3); set.userData.window.emissiveIntensity = 1.6 * fl; set.userData.fire.intensity = 260 * fl; }
  if (sh.set === 'storm') {
    const strike = Math.floor(lt * 9), on = (strike + (sh.boltSeed || 0)) % 3 !== 2;
    set.userData.bolts.visible = on;
    buildBolts(set.userData.bolts, strike * 13 + (sh.boltSeed || 0), sh.bolts || 3, sh.boltArea || [-15, 30, -20, 15]);
    set.userData.flash.intensity = on ? 300 : 40; set.userData.flash.position.set(...(sh.flashAt || [0, 20, -5]));
  }
  if (sh.set === 'city') { const b = set.userData.beam; const g = sh.beam ? ease(Math.min(1, lt / 0.6)) : 0; b.visible = !!sh.beam; b.scale.set(0.3 + g * 0.7, 1, 0.3 + g * 0.7); b.material.opacity = 0.9 * g; }
  composer.render();
  octx.drawImage(renderer.domElement, 0, 0);
}

function drawTitle(sh, lt) {
  const dur = sh.end - sh.start, u = lt / dur;
  octx.fillStyle = '#000'; octx.fillRect(0, 0, W, H);
  const col = sh.color || '#7dffb0';
  const g = octx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.55); g.addColorStop(0, 'rgba(30,140,80,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  octx.fillStyle = g; octx.fillRect(0, 0, W, H);
  // lens streak
  const sw = W * (0.5 + 0.4 * u), sg = octx.createLinearGradient(W / 2 - sw, 0, W / 2 + sw, 0);
  sg.addColorStop(0, 'rgba(60,255,140,0)'); sg.addColorStop(0.5, 'rgba(150,255,190,0.9)'); sg.addColorStop(1, 'rgba(60,255,140,0)');
  octx.fillStyle = sg; octx.fillRect(W / 2 - sw, H / 2 - 1.5 + (sh.lines?.length > 1 ? 0 : 0), sw * 2, 3);
  const lines = sh.lines || [sh.text]; const size = sh.size || 46, sc = 1 + 0.05 * u;
  octx.save(); octx.translate(W / 2, H / 2); octx.scale(sc, sc);
  octx.font = `600 ${size}px "Inter Display", "Inter", "DejaVu Sans"`; octx.letterSpacing = `${size * 0.18}px`;
  octx.textAlign = 'center'; octx.textBaseline = 'middle'; octx.shadowColor = col; octx.shadowBlur = 18; octx.fillStyle = '#e8fff0';
  lines.forEach((ln, i) => octx.fillText(ln, size * 0.09, (i - (lines.length - 1) / 2) * size * 1.35 - (lines.length > 1 ? 0 : 0)));
  octx.restore();
}

function fade(sh, lt) {
  const dur = sh.end - sh.start; let a = 0;
  if (sh.fadeIn && lt < sh.fadeIn) a = Math.max(a, 1 - lt / sh.fadeIn);
  if (sh.fadeOut && lt > dur - sh.fadeOut) a = Math.max(a, (lt - (dur - sh.fadeOut)) / sh.fadeOut);
  if (a > 0) { octx.fillStyle = `rgba(0,0,0,${Math.min(1, a)})`; octx.fillRect(0, 0, W, H); }
  if (sh.flashOut && lt > dur - sh.flashOut) { octx.fillStyle = `rgba(255,250,235,${(lt - (dur - sh.flashOut)) / sh.flashOut})`; octx.fillRect(0, 0, W, H); }
  if (sh.flashIn && lt < sh.flashIn) { octx.fillStyle = `rgba(255,250,235,${1 - lt / sh.flashIn})`; octx.fillRect(0, 0, W, H); }
}

window.renderAt = (t) => {
  const frame = Math.round(t * FPS);
  const sh = SPEC.shots.find(s => t >= s.start && t < s.end) || SPEC.shots[SPEC.shots.length - 1];
  const lt = t - sh.start;
  if (sh.type === 'black') { octx.fillStyle = '#000'; octx.fillRect(0, 0, W, H); }
  else if (sh.type === 'title') drawTitle(sh, lt);
  else renderScene(sh, lt, t, frame);
  fade(sh, lt);
  return out.toDataURL('image/jpeg', 0.92);
};
window.SPEC = SPEC;
window.ready = true;
