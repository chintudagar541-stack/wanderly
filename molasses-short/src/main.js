import * as THREE from 'three';
import { LINES, TOTAL } from './script.js';
import * as T from './pbr.js';
import { Batcher, LIB, buildLibrary, std, pbrMat, skyCanvas, sett, R, STD } from './world.js';
import { Toon, OUTLINES, cel } from './toon3d.js';

THREE.ColorManagement.enabled = true;
const params = new URLSearchParams(location.search);
const RENDER = params.has('render');
const W = +(params.get('w') || 540), H = Math.round(W * 16 / 9), SCALE = H / 1920;
if (RENDER) document.body.classList.add('render');
const cv = document.getElementById('cv'), ov = document.getElementById('ov');
cv.width = ov.width = W; cv.height = ov.height = H;
ov.getContext('2d').clearRect(0, 0, W, H);

const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // we tone map and encode in our own passes
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);

buildLibrary();
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xffffff, 60, 400);
const pmrem = new THREE.PMREMGenerator(renderer);

/* ================= moods: sky, environment light, sun ================= */
const sunDirOf = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
const MOODS = {
  day:    { sky: ['#1a56c8', '#3f86e0', '#8dbcef', '#c9d0d8'], sun: sunDirOf(2.35, .82), sunCol: '#fff6e4', si: 3.6, sc: 0xfff1dc, hi: .35, hs: 0xcfe2ff, hg: 0x8a8070, env: 1.0, fog: 0xb4cdea, fn: 150, ff: 900, clouds: 1, exp: .95 },
  sun:    { sky: ['#1652c6', '#3b84e2', '#8cbdf2', '#cfd5dc'], sun: sunDirOf(2.6, .7),  sunCol: '#fff4dc', si: 4.0, sc: 0xfff0d4, hi: .35, hs: 0xd4e6ff, hg: 0x8a8070, env: 1.0, fog: 0xb8d2ee, fn: 150, ff: 900, clouds: .8, exp: .95 },
  amber:  { sky: ['#2a1a0e', '#4a3220', '#6a4a30', '#2a1a0e'], sun: sunDirOf(.3, .35),  sunCol: '#fff0d8', si: .25, sc: 0xfff0dc, hi: 2.4, hs: 0xfff0dc, hg: 0x6a5040, env: 1.1, fog: 0x3a2412, fn: 40, ff: 160, clouds: 0, exp: 1.1, pt: [2.0, 0xffe6c8], sat: .9 },
  night:  { sky: ['#03061a', '#0a1440', '#22346a', '#0e1322'], sun: sunDirOf(2.4, .55),   sunCol: '#dfe8ff', si: 1.1, sc: 0xa9bcff, hi: 1.4, hs: 0x4a62b8, hg: 0x10131f, env: .5, fog: 0x0e1836, fn: 30, ff: 220, clouds: .25, stars: true, exp: 1.35 },
  harbor: { sky: ['#2e56a8', '#7a98d0', '#f2cfa4', '#7b6a62'], sun: sunDirOf(2.2, .22),  sunCol: '#ffd9a0', si: 3.2, sc: 0xffc58a, hi: .32, hs: 0xffd2b0, hg: 0x5e5250, env: 1.0, fog: 0xd8c4b0, fn: 220, ff: 1400, clouds: .7, exp: .95 },
  court:  { sky: ['#3a2a1c', '#5a4430', '#7a6048', '#2a1d12'], sun: sunDirOf(2.7, .55),  sunCol: '#ffe0b0', si: 2.6, sc: 0xffdcae, hi: 1.25, hs: 0xffe0b8, hg: 0x5a3e28, env: 1.0, fog: 0x3a2a1c, fn: 40, ff: 160, clouds: 0, exp: 1.0, pt: [1.1, 0xffd090], sat: 1.05 },
  golden: { sky: ['#5c5ab0', '#d9867a', '#ffc489', '#806a6a'], sun: sunDirOf(-1.75, .14), sunCol: '#ffcf86', si: 3.4, sc: 0xffae66, hi: .3, hs: 0xffc6a0, hg: 0x5a4a5e, env: 1.0, fog: 0xf0bf98, fn: 70, ff: 460, clouds: .6, exp: 1.0 },
};
for (const k in MOODS) {
  const m = MOODS[k];
  m.skyTex = skyCanvas(m.sky[0], m.sky[1], m.sky[2], m.sky[3], m.sun, m.sunCol, m.clouds, m.stars);
  m.envTex = pmrem.fromEquirectangular(m.skyTex).texture;
}

const hemi = new THREE.HemisphereLight(0xffffff, 0x777777, .35);
const sun = new THREE.DirectionalLight(0xffffff, 3);
const SHADOW = +(params.get('shadow') || 2048);
sun.castShadow = true; sun.shadow.mapSize.set(SHADOW, SHADOW);
sun.shadow.bias = -0.00025; sun.shadow.normalBias = 0.035; sun.shadow.radius = 2.5;
const pt = new THREE.PointLight(0xffaa55, 0, 70, 2); pt.position.set(400, 14, 4);
scene.add(hemi, sun, sun.target, pt);
const shCenter = new THREE.Vector3();
let curMood = null;
function applyMood(name, cam, focus) {
  const m = MOODS[name];
  if (curMood !== name) {
    curMood = name;
    scene.background = m.skyTex; scene.environment = m.envTex;
    scene.backgroundIntensity = 1; STD.forEach(mm => { mm.envMapIntensity = m.env * (mm.userData.env ?? 1); });
    scene.fog.color.set(m.fog); scene.fog.near = m.fn; scene.fog.far = m.ff;
    hemi.color.set(m.hs); hemi.groundColor.set(m.hg); hemi.intensity = m.hi;
    sun.color.set(m.sc); sun.intensity = m.si;
    pt.intensity = m.pt ? m.pt[0] * 40 : 0; if (m.pt) pt.color.set(m.pt[1]);
    if (name === 'court') pt.position.set(-400, 7, 6); else pt.position.set(403, 26, -4);
    windowGlow(name);
  }
  shCenter.copy(cam.position).lerp(focus, .55); shCenter.y = 0;
  const reach = clamp(cam.position.distanceTo(focus) * .8, 18, 80);
  const sc = sun.shadow.camera; sc.left = -reach; sc.right = reach; sc.top = reach; sc.bottom = -reach; sc.near = 1; sc.far = 400; sc.updateProjectionMatrix();
  sun.position.copy(shCenter).addScaledVector(m.sun, 180); sun.target.position.copy(shCenter);
}

/* ================= STREET ================= */
const B = new Batcher(scene);
const ROAD = 5.4, FACE = 9.0, STREET_END = -57, TANK_Z = -88, TANK_R = 23, TANK_H = 28;
const snowM = pbrMat(LIB.snow, 1, 1, { color: 0xffffff });
const snowGround = pbrMat(LIB.snow, 120, 56);
const stoneM = pbrMat(LIB.stone, 1, 1, { color: 0xc4ad92 });
const stoneDarkM = pbrMat(LIB.stoneDark, 1, 1);
const ironM = std({ color: 0x1e2024, roughness: .55, metalness: .65 });
const glassM = std({ color: 0x0d141c, roughness: .04, metalness: .3 }); glassM.userData.env = 1.6;
const glassLitM = std({ color: 0x3a2a14, roughness: .06, metalness: .2, emissive: 0xffb45e, emissiveIntensity: .2 });
const curtainMs = ['#c9b48a', '#9a3f3a', '#e8e0cf', '#5b6e4a'].map(c => std({ color: c, roughness: .9 }));
const molassesM = std({ color: 0x3a1c09, roughness: .24, metalness: 0 }); molassesM.userData.env = .38;

// ground plane under everything (snowy lots)
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 280), snowGround);
ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 20); ground.receiveShadow = true; scene.add(ground);
// wet slush bed the setts sit in
const slushM = pbrMat(LIB.slush, 3, 30);
const bed = new THREE.Mesh(new THREE.PlaneGeometry(ROAD * 2, 100), slushM);
bed.rotation.x = -Math.PI / 2; bed.position.set(0, .015, (36 + STREET_END) / 2); bed.receiveShadow = true; scene.add(bed);

// granite setts, laid in courses across the street
{
  const geos = [0, 1, 2, 3].map(sett);
  const settM = std({ color: 0xffffff, roughness: .5, metalness: 0, flatShading: true }); settM.userData.env = .9;
  const c = new THREE.Color();
  for (let z = 36, row = 0; z > STREET_END; z -= .19, row++) {
    const off = (row % 2) * .16;
    for (let x = -ROAD + .15 + off; x < ROAD - .1; x += .32) {
      const v = (R() * 4) | 0, w = .27 + R() * .04, d = .15 + R() * .025, hgt = .11 + R() * .03;
      const warm = R() < .3, l = .19 + R() * .12;
      c.setHSL(warm ? .07 : .6, warm ? .1 : .05, l);
      // wheel ruts get dusted with slush; centre stays dark and wet
      const nearRut = Math.abs(Math.abs(x) - 1.6) < .55;
      if (!nearRut && R() < .07) c.lerp(new THREE.Color(0xdfe7f2), .45);
      B.add('sett' + v, geos[v], settM, [x + (R() - .5) * .03, hgt / 2 - .02, z + (R() - .5) * .03], [(R() - .5) * .06, (R() - .5) * .12, (R() - .5) * .06], [w, hgt, d], c.clone(), false);
    }
  }
}
// kerbs, pavements and snow banks
const kerbM = pbrMat(LIB.stone, 30, .3, { color: 0xb8b4ad });
const paveM = pbrMat(LIB.stoneDark, 1, 1, { color: 0xc8c8cc });
for (const s of [-1, 1]) {
  const kerb = new THREE.Mesh(new THREE.BoxGeometry(.3, .2, 96), kerbM);
  kerb.position.set(s * (ROAD + .15), .1, (36 + STREET_END) / 2 + 1); kerb.castShadow = kerb.receiveShadow = true; scene.add(kerb);
  // pavement slabs
  for (let z = 35; z > STREET_END; z -= 1.2) for (let k = 0; k < 3; k++) {
    const x = s * (ROAD + .4 + .55 + k * 1.1);
    B.add('slab', new THREE.BoxGeometry(1, 1, 1), paveM, [x, .08, z], [0, 0, 0], [1.08, .17, 1.18], new THREE.Color().setHSL(.6, .03, .55 + R() * .12), false);
  }
  // packed snow on the pavement, thinner near the doors
  const sp = new THREE.Mesh(new THREE.BoxGeometry(3.4, .08, 92), snowM);
  sp.position.set(s * (ROAD + 2.0), .19, (36 + STREET_END) / 2 + 1); sp.receiveShadow = true; scene.add(sp);
  // shovelled banks along the kerb
  const bankGeo = new THREE.SphereGeometry(1, 18, 10);
  for (let z = 34; z > STREET_END + 2; z -= .9 + R() * .9) {
    if (R() < .18) continue;
    B.add('bank', bankGeo, snowM, [s * (ROAD + .55 + R() * .2), .14, z], [0, R() * 3, 0], [.55 + R() * .35, .32 + R() * .28, .8 + R() * .7], null, true);
  }
}

/* ---- buildings ---- */
const bldgs = [];
const SIGNS = ['SALUMERIA', 'BARBER', 'BAKERY', 'TAILOR', 'HARDWARE', 'CAFFÈ', 'GROCER', 'FISH MARKET', 'DRY GOODS', 'SHOES'];
function signTex(text, bg, fg) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 1024, 160);
  x.strokeStyle = fg; x.lineWidth = 8; x.strokeRect(14, 14, 996, 132);
  x.fillStyle = fg; x.font = 'bold 92px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 512, 86);
  x.globalAlpha = .12; for (let i = 0; i < 300; i++) { x.fillStyle = R() < .5 ? '#000' : '#fff'; x.fillRect(R() * 1024, R() * 160, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function awningTex(a, b) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
  for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? a : b; x.fillRect(i * 32, 0, 32, 256); }
  x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(0, 220, 512, 36);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const box1 = new THREE.BoxGeometry(1, 1, 1);
const TRIM_MS = LIB.trimPaint.map(t => pbrMat(t, 1, 1));
const DOOR_MS = LIB.doorPaint.map(t => pbrMat(t, 1, 1));
const goodsM = std({ color: 0xffffff, roughness: .8 });
const cyl1 = new THREE.CylinderGeometry(.5, .5, 1, 14);
const plane1 = new THREE.PlaneGeometry(1, 1);
const winGlass = [];
function building(side, zc, w, h, seedv) {
  const g = new THREE.Group();
  g.position.set(side * FACE, 0, zc); g.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; // local +z faces the street
  g.updateMatrixWorld(true);
  const BM = g.matrixWorld.clone();
  const put = (key, geo, mat, p, r = [0, 0, 0], sc = [1, 1, 1], col = null, sh = true) => {
    E2.set(r[0], r[1], r[2]); Q2.setFromEuler(E2);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(...p), Q2, new THREE.Vector3(...sc)).premultiply(BM);
    B.addMatrix(key, geo, mat, m, col, sh);
  };
  const depth = 12;
  const brick = LIB.bricks[seedv % LIB.bricks.length];
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), pbrMat(brick, w / 3, h / 3));
  body.position.set(0, h / 2, -depth / 2); body.castShadow = body.receiveShadow = true; g.add(body);
  const trimM = TRIM_MS[seedv % TRIM_MS.length], TK = 'frame' + (seedv % TRIM_MS.length);
  const doorM = DOOR_MS[seedv % 4], DK = 'door' + (seedv % 4);
  const shop = R() < .6;
  const G0 = 4.4; // ground floor height
  // belt course and base
  put('stone', box1, stoneM, [0, G0, .08], [0, 0, 0], [w + .2, .38, .36]);
  put('stone', box1, stoneM, [0, .45, .06], [0, 0, 0], [w + .1, .9, .3]);
  if (shop) {
    // storefront: two plate-glass windows, recessed door, sign board, maybe an awning
    const sw = (w - 2.2) / 2;
    for (const sx of [-1, 1]) {
      const cx = sx * (1.1 + sw / 2);
      put(TK, box1, trimM, [cx, .95, .12], [0, 0, 0], [sw, .9, .2]);              // kick panel
      put('glass', plane1, glassM, [cx, 2.55, .02], [0, 0, 0], [sw - .2, 2.3, 1], null, false);
      put(TK, box1, trimM, [cx, 3.75, .12], [0, 0, 0], [sw, .14, .22]);
      put(TK, box1, trimM, [cx - sw / 2, 2.55, .12], [0, 0, 0], [.14, 2.4, .22]);
      put(TK, box1, trimM, [cx + sw / 2, 2.55, .12], [0, 0, 0], [.14, 2.4, .22]);
      put(TK, box1, trimM, [cx, 2.55, .1], [0, 0, 0], [.07, 2.3, .16]);
      // goods behind the glass
      for (let k = 0; k < 6; k++) put('goods', box1, goodsM, [cx + (R() - .5) * (sw - .6), 1.6 + R() * .4, -.4], [0, R(), 0], [.3 + R() * .3, .3 + R() * .5, .3], new THREE.Color().setHSL(R(), .45, .45));
    }
    put(TK, box1, trimM, [0, 2.3, -.5], [0, 0, 0], [2.2, 4.4, .1]);               // recess back
    put(DK, box1, doorM, [0, 1.35, -.45], [0, 0, 0], [1.1, 2.6, .08]);
    put('glass', plane1, glassLitM, [0, 2.0, -.4], [0, 0, 0], [.7, 1.0, 1], null, false);
    // sign board
    const sign = new THREE.Mesh(new THREE.BoxGeometry(w - .6, .95, .12), [trimM, trimM, trimM, trimM,
      std({ map: signTex(SIGNS[seedv % SIGNS.length], ['#1f3b2e', '#5a1f1a', '#1d2a4a', '#2a2420'][seedv % 4], '#e9d79a'), roughness: .6 }), trimM]);
    sign.position.set(0, 4.05, .2); sign.castShadow = true; g.add(sign);
    if (R() < .6) {
      const aw = new THREE.Mesh(new THREE.PlaneGeometry(w - .8, 1.7), std({ map: awningTex(['#b8392f', '#2f6b4a', '#2b4f8a'][seedv % 3], '#efe6d2'), side: THREE.DoubleSide, roughness: .85 }));
      aw.position.set(0, 3.55, .85); aw.rotation.x = -1.05; aw.castShadow = true; g.add(aw);
      put('snow', box1, snowM, [0, 3.98, .52], [-1.05 - 0 + 0, 0, 0], [w - .85, .02, .1]);
    }
  } else {
    // stoop and door with stone surround
    const dx = (R() - .5) * (w - 3);
    for (let i = 0; i < 4; i++) {
      put('stone', box1, stoneM, [dx, .15 + i * .3, 1.35 - i * .32], [0, 0, 0], [2.2, .3, .45 + (3 - i) * .0 + .32]);
      put('snow', box1, snowM, [dx, .31 + i * .3, 1.38 - i * .32], [0, 0, 0], [2.1, .04, .32]);
    }
    for (const rx of [-1.05, 1.05]) {
      for (let k = 0; k < 5; k++) put('iron', cyl1, ironM, [dx + rx, .9 + k * .0, 1.5 - k * .32], [0, 0, 0], [.04, 1.0, .04]);
      put('iron', box1, ironM, [dx + rx, 1.45 + .55, .82], [-.73, 0, 0], [.06, .06, 2.0]);
    }
    put('stone', box1, stoneM, [dx, 2.75, .1], [0, 0, 0], [1.9, 3.3, .2]);
    put(DK, box1, doorM, [dx, 2.55, .22], [0, 0, 0], [1.3, 2.7, .06]);
    put('stone', box1, stoneM, [dx, 4.0, .28], [0, 0, 0], [2.3, .3, .4]);
    for (const wx of [-w / 2 + 1.4, w / 2 - 1.4]) if (Math.abs(wx - dx) > 2) windowAt(put, wx, 2.6, trimM, TK);
  }
  // upper floors
  const floors = Math.max(2, Math.floor((h - G0 - .9) / 3.3));
  const cols = Math.max(2, Math.floor(w / 2.5));
  for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
    const wx = -w / 2 + (c + .5) * (w / cols), wy = G0 + 1.85 + f * 3.3;
    windowAt(put, wx, wy, trimM, TK);
  }
  // cornice with brackets and snow
  put('cornice', box1, stoneM, [0, h - .35, .3], [0, 0, 0], [w + .5, .7, .75]);
  put('cornice', box1, stoneM, [0, h - .9, .12], [0, 0, 0], [w + .2, .25, .35]);
  for (let bx = -w / 2 + .3; bx < w / 2; bx += .75) put('cornice', box1, stoneM, [bx, h - .82, .4], [0, 0, 0], [.18, .38, .45]);
  put('snow', box1, snowM, [0, h + .07, .3], [0, 0, 0], [w + .55, .16, .8]);
  // roof snow and chimneys
  put('snow', box1, snowM, [0, h + .05, -depth / 2], [0, 0, 0], [w - .2, .12, depth - .6]);
  for (let k = 0; k < 2; k++) {
    const cx = (R() - .5) * (w - 2), cz = -2 - R() * (depth - 4), ch = 1.6 + R() * 1.4;
    const chm = new THREE.Mesh(new THREE.BoxGeometry(1.1, ch, .9), pbrMat(brick, .4, ch / 3)); chm.position.set(cx, h + ch / 2, cz); chm.castShadow = true; g.add(chm);
    put('stone', box1, stoneM, [cx, h + ch + .08, cz], [0, 0, 0], [1.3, .16, 1.1]);
    put('snow', box1, snowM, [cx, h + ch + .2, cz], [0, 0, 0], [1.25, .1, 1.05]);
  }
  // fire escape
  if (R() < .45 && floors >= 2) {
    const fx = (R() < .5 ? -1 : 1) * (w / 4);
    for (let f = 0; f < floors; f++) {
      const y = G0 + .9 + f * 3.3;
      put('iron', box1, ironM, [fx, y, .8], [0, 0, 0], [3.2, .08, 1.5]);
      put('snow', box1, snowM, [fx, y + .06, .8], [0, 0, 0], [3.1, .05, 1.4]);
      put('iron', box1, ironM, [fx, y + 1.0, 1.52], [0, 0, 0], [3.2, .06, .06]);
      put('iron', box1, ironM, [fx, y + .5, 1.52], [0, 0, 0], [3.2, .03, .03]);
      for (let b = -1.6; b <= 1.6; b += .32) put('iron', box1, ironM, [fx + b, y + .5, 1.52], [0, 0, 0], [.025, 1.0, .025]);
      if (f < floors - 1) put('iron', box1, ironM, [fx + .9, y + 1.65, 1.1], [.0, 0, .9], [.06, 3.7, .5]);
    }
  }
  // downspout
  put('iron', cyl1, std({ color: 0x5e6066, roughness: .5, metalness: .6 }), [w / 2 - .25, h / 2, .15], [0, 0, 0], [.14, h, .14]);
  scene.add(g);
  bldgs.push({ g, lean: (.025 + R() * .05) * (side < 0 ? -1 : 1), delay: R() * 1.6, side });
}
const E2 = new THREE.Euler(), Q2 = new THREE.Quaternion();
function windowAt(put, x, y, trimM, TK) {
  const ww = 1.05, wh = 1.9, lit = R() < .45;
  put(lit ? 'glassLit' : 'glass', plane1, lit ? glassLitM : glassM, [x, y, -.12], [0, 0, 0], [ww, wh, 1], null, false);
  if (R() < .55) put('curtain' + ((R() * 4) | 0), plane1, curtainMs[(R() * 4) | 0], [x - ww * .28, y + .1, -.16], [0, 0, 0], [ww * .42, wh * .9, 1], null, false);
  // frame + sash
  put(TK, box1, trimM, [x, y + wh / 2 + .04, -.04], [0, 0, 0], [ww + .2, .1, .16]);
  put(TK, box1, trimM, [x, y - wh / 2 - .04, -.04], [0, 0, 0], [ww + .2, .1, .16]);
  put(TK, box1, trimM, [x - ww / 2 - .05, y, -.04], [0, 0, 0], [.1, wh + .18, .16]);
  put(TK, box1, trimM, [x + ww / 2 + .05, y, -.04], [0, 0, 0], [.1, wh + .18, .16]);
  put(TK, box1, trimM, [x, y, -.08], [0, 0, 0], [ww, .07, .08]);
  put(TK, box1, trimM, [x, y + wh * .25, -.09], [0, 0, 0], [.04, wh * .5, .05]);
  put(TK, box1, trimM, [x, y - wh * .25, -.09], [0, 0, 0], [.04, wh * .5, .05]);
  // reveal (the brick return inside the opening)
  put('reveal', box1, std({ color: 0x5a3a2c, roughness: .9 }), [x, y, -.2], [0, 0, 0], [ww + .3, wh + .3, .02], null, false);
  // stone lintel and sill with snow
  put('stone', box1, stoneM, [x, y + wh / 2 + .27, .05], [0, 0, 0], [ww + .55, .34, .26]);
  put('stone', box1, stoneM, [x, y - wh / 2 - .18, .12], [0, 0, 0], [ww + .45, .13, .4]);
  put('snow', box1, snowM, [x, y - wh / 2 - .08, .12], [0, 0, 0], [ww + .4, .08, .36]);
  put('snow', box1, snowM, [x, y + wh / 2 + .47, .1], [0, 0, 0], [ww + .5, .06, .22]);
}
// lay out both sides of the street with varied widths and heights
for (const side of [-1, 1]) {
  let z = 32;
  let k = side < 0 ? 0 : 5;
  while (z > STREET_END + 4) {
    const w = 7.5 + R() * 4, h = 14 + R() * 9;
    building(side, z - w / 2, w, h, k++);
    z -= w + .05;
  }
}
function windowGlow(mood) {
  glassLitM.emissiveIntensity = { night: 1.1, golden: .6, harbor: .5, court: .4, amber: .3 }[mood] ?? .2;
}

/* ---- street furniture ---- */
const castIron = std({ color: 0x23262b, roughness: .45, metalness: .7 });
const lampGlassM = std({ color: 0xfff0c8, emissive: 0xffd28a, emissiveIntensity: 1.5, roughness: .2 });
const lampGlows = [];
function lamp(x, z) {
  B.add('lampBase', new THREE.CylinderGeometry(.22, .3, .7, 12), castIron, [x, .35, z]);
  B.add('lampShaft', new THREE.CylinderGeometry(.08, .12, 4.4, 10), castIron, [x, 2.9, z]);
  B.add('lampCollar', new THREE.CylinderGeometry(.16, .16, .14, 12), castIron, [x, 1.2, z]);
  B.add('lampHead', new THREE.CylinderGeometry(.34, .2, .8, 6), lampGlassM, [x, 5.5, z], [0, 0, 0], [1, 1, 1], null, false);
  B.add('lampCap', new THREE.ConeGeometry(.45, .45, 6), castIron, [x, 6.12, z]);
  B.add('lampFinial', new THREE.SphereGeometry(.08, 8, 6), castIron, [x, 6.4, z]);
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; B.add('lampRib', box1, castIron, [x + Math.cos(a) * .27, 5.5, z + Math.sin(a) * .27], [0, -a, 0], [.035, .82, .035]); }
  const s2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffd99a, transparent: true, opacity: .0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  s2.scale.setScalar(3.4); s2.position.set(x, 5.5, z); scene.add(s2); lampGlows.push(s2);
}
let _glow;
function glowTex() {
  if (_glow) return _glow;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(.25, 'rgba(255,210,140,.5)'); g.addColorStop(1, 'rgba(255,190,120,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); _glow = new THREE.CanvasTexture(c); return _glow;
}
for (const s of [-1, 1]) for (let z = 28; z > STREET_END + 6; z -= 14) lamp(s * (ROAD + .7), z + (s > 0 ? 7 : 0));

// telegraph poles + sagging wires on the right
const poleM = pbrMat(LIB.planksDark, .3, 2, { color: 0x8a7a68 });
const wireM = std({ color: 0x15161a, roughness: .6 });
const poleTops = [];
for (let z = 30; z > STREET_END - 2; z -= 22) {
  const x = ROAD + 1.0;
  B.add('pole', new THREE.CylinderGeometry(.16, .22, 12.5, 10), poleM, [x, 6.25, z]);
  for (const yy of [11.6, 10.6]) {
    B.add('xarm', box1, poleM, [x, yy, z], [0, 0, 0], [.16, .16, 3.0]);
    for (const zz of [-1.25, -.45, .45, 1.25]) B.add('insul', new THREE.CylinderGeometry(.05, .06, .2, 8), std({ color: 0x6f9a8a, roughness: .2 }), [x, yy + .18, z + zz]);
  }
  poleTops.push(z);
}
for (let i = 0; i < poleTops.length - 1; i++) for (const yy of [11.78, 10.78]) for (const zz of [-1.25, -.45, .45, 1.25]) {
  const a = new THREE.Vector3(ROAD + 1, yy, poleTops[i] + zz), b = new THREE.Vector3(ROAD + 1, yy, poleTops[i + 1] + zz);
  const mid = a.clone().lerp(b, .5); mid.y -= .9; mid.x += .25;
  const wm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 16, .02, 4), wireM); scene.add(wm);
}

/* ---- elevated railway crossing in front of the tank (Commercial St.) ---- */
const elSteel = pbrMat(LIB.steelDark, 6, .4, { metalness: .55 });
const el = new THREE.Group(); el.position.set(0, 0, -57.2); scene.add(el);
const elSegs = [];
for (let x = -48; x < 48; x += 12) {
  const seg = new THREE.Group(); seg.position.set(x + 6, 0, 0); el.add(seg);
  for (const zz of [-1.6, 1.6]) {
    const gir = new THREE.Mesh(new THREE.BoxGeometry(12, 1.3, .35), elSteel); gir.position.set(0, 8.4, zz); gir.castShadow = gir.receiveShadow = true; seg.add(gir);
    for (let k = -5.5; k <= 5.5; k += 1) { const st = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.25, .38), ironM); st.position.set(k, 8.4, zz); seg.add(st); }
  }
  for (let k = -5.6; k <= 5.6; k += .8) { const tie = new THREE.Mesh(new THREE.BoxGeometry(.22, .18, 3.6), pbrMat(LIB.planksDark, .2, .5)); tie.position.set(k, 9.15, 0); tie.castShadow = true; seg.add(tie); }
  for (const zz of [-.72, .72]) { const rl = new THREE.Mesh(new THREE.BoxGeometry(12, .14, .12), std({ color: 0x8a8f96, roughness: .35, metalness: .8 })); rl.position.set(0, 9.32, zz); seg.add(rl); }
  elSegs.push({ seg, bend: (R() - .4) * .2, drop: .6 + R() * 1.4, x });
}
for (let x = -42; x <= 42; x += 12) for (const zz of [-1.6, 1.6]) {
  const col = new THREE.Mesh(new THREE.BoxGeometry(.6, 7.8, .6), elSteel); col.position.set(x, 3.9, -57.2 + zz); col.castShadow = col.receiveShadow = true; scene.add(col);
  const kn = new THREE.Mesh(new THREE.BoxGeometry(1.4, .5, .8), elSteel); kn.position.set(x, 7.6, -57.2 + zz); scene.add(kn);
}

/* ---- props ---- */
const woodBarrel = pbrMat(LIB.planks, 2, 1, { color: 0xe2c9a6 });
const crateM = pbrMat(LIB.planksPale, 1, 1);
const hoopM = std({ color: 0x3b3b40, roughness: .5, metalness: .7 });
function barrel(x, z, r = 0) {
  B.add('barrel', new THREE.CylinderGeometry(.42, .38, 1.15, 18, 4), woodBarrel, [x, .58, z], [0, r, 0]);
  for (const y of [.2, .58, .96]) B.add('hoop', new THREE.TorusGeometry(.43, .025, 6, 22), hoopM, [x, y, z], [Math.PI / 2, 0, 0]);
  B.add('snow', box1, snowM, [x, 1.17, z], [0, 0, 0], [.7, .05, .7]);
}
function crate(x, z, s = 1, r = 0, y0 = 0) {
  B.add('crate', box1, crateM, [x, y0 + .45 * s, z], [0, r, 0], [1.0 * s, .9 * s, 1.0 * s]);
  B.add('snow', box1, snowM, [x, y0 + .92 * s, z], [0, r, 0], [1.0 * s, .05, 1.0 * s]);
}
barrel(-7.4, 12); barrel(-8.0, 13.1, .5); barrel(7.6, -18); barrel(8.3, -18.8, .9); barrel(-7.6, -40); barrel(-8.3, -41, .3);
crate(7.4, 22, 1, .3); crate(8.2, 23, .8, -.4); crate(7.6, 22.4, .7, .9, .9); crate(-7.8, -26, 1, .2); crate(-8.3, -27.3, .8, .6);
// hydrant
{ const hm = std({ color: 0xa8322a, roughness: .45, metalness: .2 });
  B.add('hyd', new THREE.CylinderGeometry(.18, .22, .8, 12), hm, [6.1, .4, 0]); B.add('hyd', new THREE.SphereGeometry(.2, 12, 8), hm, [6.1, .84, 0]);
  B.add('hyd', new THREE.CylinderGeometry(.07, .07, .5, 8), hm, [6.1, .6, 0], [0, 0, Math.PI / 2]); }
// handcart with milk cans
{ const cg = new THREE.Group(); cg.position.set(-7.2, 0, -10); cg.rotation.y = .5; scene.add(cg);
  const bedm = new THREE.Mesh(new THREE.BoxGeometry(2.2, .14, 1.3), pbrMat(LIB.planks, 1, 1)); bedm.position.y = .85; bedm.castShadow = true; cg.add(bedm);
  for (const s of [-1, 1]) { const wl = new THREE.Mesh(new THREE.TorusGeometry(.62, .06, 8, 24), pbrMat(LIB.planksDark, 1, .1)); wl.position.set(-.2, .64, s * .72); wl.castShadow = true; cg.add(wl);
    for (let k = 0; k < 6; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(.05, 1.2, .05), ironM); sp.rotation.z = k * .52; sp.position.set(-.2, .64, s * .72); cg.add(sp); } }
  for (const s of [-1, 1]) { const hnd = new THREE.Mesh(new THREE.BoxGeometry(1.8, .08, .08), pbrMat(LIB.planks, .5, .1)); hnd.position.set(1.8, .95, s * .5); hnd.rotation.z = .2; cg.add(hnd); }
  const canM = std({ color: 0xb9bcc2, roughness: .3, metalness: .85 });
  for (const [cx2, cz2] of [[-.6, -.3], [.1, .25], [.6, -.25]]) { const can = new THREE.Mesh(new THREE.CylinderGeometry(.2, .22, .7, 16), canM); can.position.set(cx2, 1.27, cz2); can.castShadow = true; cg.add(can); } }

/* ---- the yard and the tank ---- */
const mudM = pbrMat(LIB.snow, 10, 10, { color: 0xc9bcae });
const yard = new THREE.Mesh(new THREE.CircleGeometry(30, 48), mudM); yard.rotation.x = -Math.PI / 2; yard.position.set(0, .012, TANK_Z + 12); yard.receiveShadow = true; scene.add(yard);
const tankGray = pbrMat(LIB.steelGray, 14, 6, { metalness: .4 });
const tankBrown = pbrMat(LIB.steelBrown, 14, 6, { metalness: .3 });
const tank = new THREE.Group(); tank.position.set(0, 0, TANK_Z); scene.add(tank);
const tankBody = new THREE.Mesh(new THREE.CylinderGeometry(TANK_R, TANK_R, TANK_H, 96, 1, true), tankGray);
tankBody.position.y = TANK_H / 2; tankBody.castShadow = tankBody.receiveShadow = true; tank.add(tankBody);
const tankRoof = new THREE.Mesh(new THREE.ConeGeometry(TANK_R + .3, 3.6, 96, 1, true), pbrMat(LIB.steelDark, 18, 2));
tankRoof.position.y = TANK_H + 1.8; tankRoof.castShadow = true; tank.add(tankRoof);
const roofSnow = new THREE.Mesh(new THREE.ConeGeometry(TANK_R + .1, 3.4, 96, 1, true), snowM); roofSnow.position.y = TANK_H + 1.98; tank.add(roofSnow);
for (const y of [.35, TANK_H - .2]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(TANK_R + .08, .22, 8, 96), pbrMat(LIB.steelDark, 30, .2)); ring.rotation.x = Math.PI / 2; ring.position.y = y; ring.castShadow = true; tank.add(ring); }
// railing on the roof rim
for (let a = 0; a < Math.PI * 2; a += .09) B.add('rail', box1, ironM, [Math.sin(a) * (TANK_R - .3), TANK_H + 1.0, TANK_Z + Math.cos(a) * (TANK_R - .3)], [0, a, 0], [.05, 1.0, .05]);
{ const rr = new THREE.Mesh(new THREE.TorusGeometry(TANK_R - .3, .04, 4, 96), ironM); rr.rotation.x = Math.PI / 2; rr.position.set(0, TANK_H + 1.5, TANK_Z); scene.add(rr); }
const wallZ = (x) => TANK_Z + Math.sqrt(Math.max(1, TANK_R * TANK_R - x * x));
// ladder with cage
{ const lx = 10, lz = wallZ(lx) + .55;
  for (const rx of [-.38, .38]) B.add('ladder', box1, ironM, [lx + rx, TANK_H / 2, lz], [0, 0, 0], [.07, TANK_H, .07]);
  for (let i = 0; i < 52; i++) B.add('ladder', box1, ironM, [lx, .5 + i * .52, lz], [0, 0, 0], [.76, .045, .045]);
  for (let i = 0; i < 18; i++) { const hoop = new THREE.Mesh(new THREE.TorusGeometry(.48, .03, 4, 14, Math.PI), ironM); hoop.position.set(lx, 6 + i * 1.2, lz + .1); hoop.rotation.y = 0; scene.add(hoop); } }
// outlet pipe, valve and pump house
const pipeM = std({ color: 0x3e3a36, roughness: .55, metalness: .6 });
{ const px = -9, pz = wallZ(px) + .7;
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 3.4, 16), pipeM); p1.position.set(px, 1.7, pz); p1.castShadow = true; scene.add(p1);
  const p2 = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 7, 16), pipeM); p2.rotation.z = Math.PI / 2; p2.position.set(px - 3.5, .55, pz + .2); p2.castShadow = true; scene.add(p2);
  const vw = new THREE.Mesh(new THREE.TorusGeometry(.6, .07, 8, 22), std({ color: 0x8a2a22, roughness: .5, metalness: .4 })); vw.position.set(px, 2.2, pz + .55); scene.add(vw);
  for (let k = 0; k < 3; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(1.2, .06, .06), vw.material); sp.rotation.z = k * 1.05; sp.position.copy(vw.position); scene.add(sp); } }
{ const ph = new THREE.Group(); ph.position.set(-21, 0, -70); ph.rotation.y = .4; scene.add(ph);
  const hb = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 6), pbrMat(LIB.bricks[2], 7 / 3, 5 / 3)); hb.position.y = 2.5; hb.castShadow = hb.receiveShadow = true; ph.add(hb);
  const rf = new THREE.Mesh(new THREE.BoxGeometry(7.6, .3, 6.6), pbrMat(LIB.roof, 2, 2)); rf.position.y = 5.15; ph.add(rf);
  const rs = new THREE.Mesh(new THREE.BoxGeometry(7.5, .14, 6.5), snowM); rs.position.y = 5.36; ph.add(rs);
  const ch = new THREE.Mesh(new THREE.BoxGeometry(.9, 4, .9), pbrMat(LIB.bricks[2], .3, 1.3)); ch.position.set(2, 7, -1); ch.castShadow = true; ph.add(ch); }
// wooden fence along the yard edge
{ const fm = pbrMat(LIB.planksPale, .3, 1, { color: 0xc8b8a0 });
  for (const side of [-1, 1]) for (let x = 6; x < 30; x += .32) {
    const xx = side * x, h2 = 1.5 + Math.sin(x * 3) * .05;
    B.add('picket', box1, fm, [xx, h2 / 2, -59.6], [0, 0, (R() - .5) * .04], [.2, h2, .05]);
  }
  for (const side of [-1, 1]) for (const y of [.4, 1.2]) B.add('rail2', box1, fm, [side * 18, y, -59.5], [0, 0, 0], [24, .1, .06]); }
// leaks: glossy runs down the wall into puddles (positions match the kids and painter)
const drips = [], puddles = [];
for (const [x, top, w] of [[-7.5, 9, .3], [-3.3, 7.4, .34], [-.9, 10.4, .3], [1.9, 6.2, .26], [4.6, 8.6, .32], [7.4, 6.8, .28], [-12, 7.8, .3], [12.5, 5.6, .26]]) {
  const n = new THREE.Vector3(x, 0, wallZ(x) - TANK_Z).normalize();
  const g = new THREE.Group(); g.position.set(x + n.x * .05, 0, wallZ(x) + .05 * n.z); g.rotation.y = Math.atan2(n.x, n.z); scene.add(g);
  const run = new THREE.Mesh(new THREE.CylinderGeometry(w * .16, w * .26, 1, 12, 1), molassesM); run.scale.z = .45; g.add(run);
  const bead = new THREE.Mesh(new THREE.SphereGeometry(w * .34, 14, 10), molassesM); bead.scale.set(1, 1.35, .6); g.add(bead);
  const stain = new THREE.Mesh(new THREE.PlaneGeometry(w * 3.2, 1), new THREE.MeshStandardMaterial({ color: 0x2a1405, roughness: .3, transparent: true, opacity: .55, depthWrite: false }));
  stain.position.z = .02; g.add(stain);
  g.userData = { top, ph: R() * 6, run, bead, stain }; drips.push(g);
  const pud = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .03, 32), molassesM); pud.scale.set(1.1, 1, .8);
  pud.position.set(x + n.x * 1.1, .03, wallZ(x) + 1.0); pud.receiveShadow = true; scene.add(pud); puddles.push(pud);
}

/* ================= INSIDE THE TANK (x = 400) ================= */
const IX = 400;
const syrup = T.pbr(512, 512, 77, (A, Hh, Rg, w, h, r) => {
  A.fillStyle = '#3e2a1a'; A.fillRect(0, 0, w, h); Hh.fillStyle = '#808080'; Hh.fillRect(0, 0, w, h); Rg.fillStyle = '#2a2a2a'; Rg.fillRect(0, 0, w, h);
  // slow folds in the syrup: long soft ridges, no blotches
  for (let i = 0; i < 60; i++) { const y = r() * h, a = .2 + r() * .3;
    Hh.strokeStyle = `rgba(255,255,255,${a})`; Hh.lineWidth = 6 + r() * 14; Hh.beginPath(); Hh.moveTo(-20, y);
    for (let x = 0; x <= w + 40; x += 40) Hh.lineTo(x, y + Math.sin(x * .02 + i) * 18 + (r() - .5) * 6); Hh.stroke();
    A.strokeStyle = `rgba(90,52,24,${a * .4})`; A.lineWidth = 4; A.stroke(); }
}, { normal: 1.6 });
const syrupM = pbrMat(syrup, 4, 4, { roughness: .3, color: 0xffffff }); syrupM.userData.env = .8;
// inside-out geometry so the interior can use ordinary front-face materials
function insideOut(geo) {
  const idx = geo.index.array; for (let i = 0; i < idx.length; i += 3) { const t2 = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t2; }
  geo.index.needsUpdate = true; geo.computeVertexNormals(); return geo;
}
const inWall = new THREE.Mesh(insideOut(new THREE.CylinderGeometry(22, 22, 40, 64, 1, true)), pbrMat(LIB.steelGray, 14, 8, { metalness: .15, color: 0xcab8a4 }));
inWall.position.set(IX, 18, 0); inWall.receiveShadow = true; scene.add(inWall);
const surf = new THREE.Mesh(new THREE.CircleGeometry(22, 64), syrupM); surf.rotation.x = -Math.PI / 2; surf.position.set(IX, 0, 0); surf.receiveShadow = true; scene.add(surf);
const inRoof = new THREE.Mesh(insideOut(new THREE.ConeGeometry(22.2, 4, 64, 1, true)), pbrMat(LIB.steelDark, 14, 1, { color: 0x9a8a7a })); inRoof.position.set(IX, 40, 0); scene.add(inRoof);
// a band of molasses tide marks on the wall above the surface
const tide = new THREE.Mesh(insideOut(new THREE.CylinderGeometry(21.95, 21.95, 2.6, 64, 1, true)), std({ color: 0x3a1c0a, roughness: .25, transparent: true, opacity: .8 }));
tide.position.set(IX, 1.1, 0); scene.add(tide);
// light from the roof hatch
const shaftM = new THREE.MeshBasicMaterial({ color: 0xffd9a8, transparent: true, opacity: .035, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 4.5, 40, 24, 1, true), shaftM); shaft.visible = false;
const bubbles = [];
const bubbleM = std({ color: 0x9a5c26, roughness: .15 }); bubbleM.userData.env = 1.2;
for (let i = 0; i < 60; i++) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), bubbleM);
  const a = R() * 6.28, rr = R() * 17;
  b.userData = { x: IX + Math.cos(a) * rr, z: Math.sin(a) * rr - 3, ph: R() * 3, sz: .14 + R() * .34 };
  b.castShadow = true; scene.add(b); bubbles.push(b);
}

/* ================= HARBOUR ================= */
const waves = T.pbr(512, 512, 88, (A, Hh, Rg, w, h, r) => {
  A.fillStyle = '#ffffff'; A.fillRect(0, 0, w, h); Hh.fillStyle = '#808080'; Hh.fillRect(0, 0, w, h); Rg.fillStyle = '#1a1a1a'; Rg.fillRect(0, 0, w, h);
  for (let i = 0; i < 420; i++) { const x = r() * w, y = r() * h, rr = 8 + r() * 40;
    for (const [ox, oy] of [[0, 0], [w, 0], [-w, 0], [0, h], [0, -h]]) {
      const g = Hh.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rr);
      g.addColorStop(0, `rgba(${r() < .5 ? '255,255,255' : '0,0,0'},.35)`); g.addColorStop(1, 'rgba(128,128,128,0)');
      Hh.fillStyle = g; Hh.fillRect(x + ox - rr, y + oy - rr * .5, rr * 2, rr); }
  }
}, { normal: 2.5 });
const waterM = pbrMat(waves, 60, 30, { color: 0x24425c, roughness: .07, metalness: .15 }); waterM.userData.env = 1.3;
const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 400), waterM); water.rotation.x = -Math.PI / 2; water.position.set(0, -.7, -320); water.receiveShadow = true; scene.add(water);
const wharf = new THREE.Mesh(new THREE.BoxGeometry(110, 1.2, 10), pbrMat(LIB.planks, 22, 2)); wharf.position.set(0, -.1, -124); wharf.castShadow = wharf.receiveShadow = true; scene.add(wharf);
for (let x = -54; x <= 54; x += 3) B.add('pile', new THREE.CylinderGeometry(.32, .32, 4, 10), pbrMat(LIB.planksDark, .5, 1), [x, -2, -129]);
for (let x = -45; x <= 45; x += 9) B.add('bollard', new THREE.CylinderGeometry(.3, .38, .9, 14), castIron, [x, .95, -127.8]);
const BX = 4, BZ = -150;
const boat = new THREE.Group(); boat.position.set(BX, -.7, BZ); boat.rotation.y = .55; scene.add(boat);
{ const hullM = pbrMat(LIB.steelBrown, 3, 1, { color: 0xe06a5a });
  const plan = new THREE.Shape(); plan.moveTo(-3.4, -10); plan.lineTo(3.4, -10); plan.lineTo(3.6, 4); plan.quadraticCurveTo(3.2, 10, 0, 13); plan.quadraticCurveTo(-3.2, 10, -3.6, 4); plan.closePath();
  const hullGeo = new THREE.ExtrudeGeometry(plan, { depth: 3.2, bevelEnabled: true, bevelSize: .3, bevelThickness: .3, bevelSegments: 3 });
  hullGeo.rotateX(-Math.PI / 2); hullGeo.translate(0, -.6, 0);
  const hull = new THREE.Mesh(hullGeo, hullM); hull.castShadow = true; boat.add(hull);
  const strip = new THREE.Mesh(new THREE.ExtrudeGeometry(plan, { depth: .3, bevelEnabled: false }), std({ color: 0xf2efe6, roughness: .5 }));
  strip.geometry.rotateX(-Math.PI / 2); strip.position.y = 2.3; strip.scale.set(1.02, 1, 1.01); boat.add(strip);
  const deck = new THREE.Mesh(new THREE.ExtrudeGeometry(plan, { depth: .15, bevelEnabled: false }), pbrMat(LIB.planksPale, .3, .3));
  deck.geometry.rotateX(-Math.PI / 2); deck.position.y = 2.65; boat.add(deck);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3, 6), pbrMat(LIB.trimPaint[0], 2, 2)); cab.position.set(0, 4.2, -2.5); cab.castShadow = true; boat.add(cab);
  const wh = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 3), pbrMat(LIB.trimPaint[0], 1, 1)); wh.position.set(0, 6.7, -1.5); wh.castShadow = true; boat.add(wh);
  for (let k = -1; k <= 1; k++) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(.8, .7), glassM); wn.position.set(k * 1.1, 7, .02); boat.add(wn); }
  for (let k = -1; k <= 1; k++) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(1, .8), glassM); wn.position.set(k * 1.4, 4.6, .52); boat.add(wn); }
  const roofM = pbrMat(LIB.steelDark, 1, 1);
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(5, .25, 6.4), roofM); r1.position.set(0, 5.8, -2.5); boat.add(r1);
  const r2 = new THREE.Mesh(new THREE.BoxGeometry(3.8, .22, 3.4), roofM); r2.position.set(0, 7.9, -1.5); boat.add(r2);
  const fn = new THREE.Mesh(new THREE.CylinderGeometry(.75, .85, 4.2, 18), std({ color: 0x1f2024, roughness: .5, metalness: .5 })); fn.position.set(0, 8, -4.4); fn.castShadow = true; boat.add(fn);
  const bd = new THREE.Mesh(new THREE.CylinderGeometry(.86, .86, .5, 18), std({ color: 0xb43226, roughness: .5 })); bd.position.set(0, 9.4, -4.4); boat.add(bd);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.45, .12, 8, 20), std({ color: 0xe8e0d0, roughness: .6 })); ring.position.set(2.32, 4.4, -3.5); ring.rotation.y = Math.PI / 2; boat.add(ring);
  const brass = std({ color: 0xc9a050, roughness: .25, metalness: .9 });
  for (const sx of [-1.6, 1.6]) { const mon = new THREE.Mesh(new THREE.CylinderGeometry(.12, .2, 1.6, 12), brass); mon.position.set(sx, 3.6, 6.5); mon.rotation.x = .9; boat.add(mon); }
}
boat.updateMatrixWorld(true);
const jetM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .35, transparent: true, opacity: .7, emissive: 0x506070, emissiveIntensity: .25 });
const jets = [];
for (const sx of [-1.6, 1.6]) {
  const start = new THREE.Vector3(sx, 4.2, 7.1).applyMatrix4(boat.matrixWorld);
  const end = new THREE.Vector3(10 + sx * 2.5, .4, -125.5 + (sx > 0 ? 1 : -1));
  const mid = start.clone().lerp(end, .45); mid.y = 13;
  const cu = new THREE.CatmullRomCurve3([start, mid, end]);
  const j = new THREE.Mesh(new THREE.TubeGeometry(cu, 48, .24, 8, false), jetM); scene.add(j); jets.push(j);
}
const mist = [];
for (let i = 0; i < 40; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffffff, transparent: true, opacity: .25, depthWrite: false })); sp.userData.ph = R(); scene.add(sp); mist.push(sp); }

/* ================= COURTROOM (x = -400) ================= */
const CX = -400;
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), pbrMat(LIB.planks, 10, 7)); fl.rotation.x = -Math.PI / 2; fl.position.set(CX, 0, 0); fl.receiveShadow = true; scene.add(fl);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(40, 16, .5), pbrMat(LIB.planksDark, 10, 4, { color: 0x9c8a7a })); wall.position.set(CX, 8, -7); wall.receiveShadow = true; scene.add(wall);
  for (const px of [-12, -6, 6, 12]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(.5, .55, 14, 20), pbrMat(LIB.stone, 1, 4, { color: 0xd8cfc0 })); col.position.set(CX + px, 7, -6.2); col.castShadow = true; scene.add(col);
  }
  for (const px of [-9, 9]) { // tall windows with light pouring in
    const wn = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 6), std({ color: 0xfff1d6, emissive: 0xffe2b0, emissiveIntensity: 2.2 })); wn.position.set(CX + px, 7.5, -6.7); scene.add(wn);
    const sh2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 14, 5.6), new THREE.MeshBasicMaterial({ color: 0xffd8a0, transparent: true, opacity: .06, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    sh2.position.set(CX + px + 1.5, 4.5, -3.5); sh2.rotation.set(.55, 0, -.15); scene.add(sh2);
  }
  const plat = new THREE.Mesh(new THREE.BoxGeometry(10, .8, 4), pbrMat(LIB.planksDark, 3, 1)); plat.position.set(CX, .4, -2.5); plat.castShadow = plat.receiveShadow = true; scene.add(plat);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(8.4, 2.0, 1.6), pbrMat(LIB.planksDark, 3, 1, { color: 0xcfa07a })); bench.position.set(CX, 1.0, .3); bench.castShadow = bench.receiveShadow = true; scene.add(bench);
  const top2 = new THREE.Mesh(new THREE.BoxGeometry(8.9, .2, 2.0), pbrMat(LIB.planks, 3, 1)); top2.position.set(CX, 2.1, .3); top2.castShadow = true; scene.add(top2);
  for (let k = -3; k <= 3; k++) { const pn = new THREE.Mesh(new THREE.BoxGeometry(1, 1.8, .06), pbrMat(LIB.planks, .5, .5)); pn.position.set(CX + k * 1.15, 1.0, 1.13); scene.add(pn); }
  const mini = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .5, 28), tankBrown); mini.position.set(CX - 2.6, 2.45, .3); mini.castShadow = true; scene.add(mini);
  const pap = new THREE.Mesh(new THREE.BoxGeometry(.9, .06, .7), std({ color: 0xeee6d4, roughness: .9 })); pap.position.set(CX + 2.2, 2.23, .4); pap.rotation.y = .2; scene.add(pap);
  const blk = new THREE.Mesh(new THREE.CylinderGeometry(.28, .3, .14, 18), pbrMat(LIB.planksDark, .3, .3)); blk.position.set(CX + 1.3, 2.27, .55); scene.add(blk);
  const lampC = new THREE.Mesh(new THREE.SphereGeometry(.5, 16, 12), std({ color: 0xfff0c8, emissive: 0xffd28a, emissiveIntensity: 3 })); lampC.position.set(CX, 10, 2); scene.add(lampC); }

/* ================= story props ================= */
// thermometer on the pavement
const therm = new THREE.Group(); therm.position.set(6.9, 0, 11.5); scene.add(therm);
const thermCv = document.createElement('canvas'); thermCv.width = 256; thermCv.height = 150;
const thermTex = new THREE.CanvasTexture(thermCv); thermTex.colorSpace = THREE.SRGBColorSpace;
let thermShown = '';
function drawTherm(txt) {
  if (txt === thermShown) return; thermShown = txt;
  const x = thermCv.getContext('2d'); x.fillStyle = '#efe8d6'; x.fillRect(0, 0, 256, 150);
  x.strokeStyle = '#3a2a1a'; x.lineWidth = 8; x.strokeRect(6, 6, 244, 138);
  x.fillStyle = '#241a12'; x.font = 'bold 96px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 128, 80); thermTex.needsUpdate = true;
}
const merc = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, 1, 12), std({ color: 0xd8262b, emissive: 0x5a0000, roughness: .3 }));
{ const post = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, 4.2, 10), castIron); post.position.set(0, 2.1, 0); post.castShadow = true; therm.add(post);
  const bd = new THREE.Mesh(new THREE.BoxGeometry(1.6, 7, .22), pbrMat(LIB.trimPaint[0], 1, 3)); bd.position.y = 7.6; bd.castShadow = true; therm.add(bd);
  const fr = new THREE.Mesh(new THREE.BoxGeometry(1.8, 7.2, .14), pbrMat(LIB.planksDark, 1, 3)); fr.position.set(0, 7.6, -.05); therm.add(fr);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, 5.6, 16), std({ color: 0xe8f0f8, roughness: .05, transparent: true, opacity: .45 })); tube.position.set(0, 7.9, .2); therm.add(tube);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.42, 18, 14), merc.material); bulb.position.set(0, 4.85, .2); therm.add(bulb);
  for (let i = 0; i < 12; i++) { const tk = new THREE.Mesh(new THREE.BoxGeometry(i % 3 === 0 ? .5 : .28, .06, .04), castIron); tk.position.set(.5, 5.6 + i * .45, .13); therm.add(tk); }
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .88), std({ map: thermTex, roughness: .7 })); plate.position.set(0, 10.6, .13); therm.add(plate);
  therm.add(merc); }

// flood wave: glossy syrup with a lighter crest
const waveShape = new THREE.Shape();
waveShape.moveTo(-12, 0);
waveShape.bezierCurveTo(-8, .4, -4.2, 3.6, -.6, 6.2);
waveShape.bezierCurveTo(1.6, 7.7, 4.4, 7.9, 5.6, 6.6);
waveShape.bezierCurveTo(6.4, 5.6, 5.8, 4.3, 4.6, 4.5);
waveShape.bezierCurveTo(3.6, 4.7, 3.2, 3.2, 3.8, 1.6);
waveShape.bezierCurveTo(4.1, .8, 4.6, .3, 5.0, 0);
waveShape.lineTo(-12, 0);
const waveGeo = new THREE.ExtrudeGeometry(waveShape, { depth: 17, bevelEnabled: true, bevelSize: .9, bevelThickness: 1.2, bevelSegments: 6, curveSegments: 40, steps: 40 });
waveGeo.rotateY(-Math.PI / 2); waveGeo.translate(8.5, 0, 0);
{ // lumpy, liquid surface + colour: dark body, thin amber lip where light passes through
  const p = waveGeo.attributes.position, cols = new Float32Array(p.count * 3);
  const lo = new THREE.Color(0x1e0d04), hi = new THREE.Color(0x4a240c), lip = new THREE.Color(0x9a581c), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(x * 1.3 + z * .7) * .25 + Math.sin(x * 3.1 - y * 1.7) * .12 + Math.sin(z * 2.3 + x * .4) * .18;
    p.setXYZ(i, x, y + n * clamp(y / 2), z + n * .6);
    c.lerpColors(lo, hi, clamp(y / 6)); if (y > 5.6 && z > 3) c.lerp(lip, clamp((y - 5.6) / 1.6) * .8);
    cols.set([c.r, c.g, c.b], i * 3);
  }
  waveGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); waveGeo.computeVertexNormals(); }
const waveM = std({ color: 0xffffff, vertexColors: true, roughness: .2, metalness: 0 }); waveM.userData.env = .45;
const wave = new THREE.Mesh(waveGeo, waveM); wave.castShadow = true; scene.add(wave);
const floodM = std({ color: 0x7a4418, roughness: .3 }); floodM.userData.env = .3;
const flood = new THREE.Mesh(new THREE.BoxGeometry(18, .6, 1), floodM); flood.receiveShadow = true; scene.add(flood);
const waveZ = (t) => t < 33.7 ? -63 : t < 38.8 ? lerp(-63, 6, (t - 33.7) / 5.1) : lerp(6, 30, smooth(38.8, 42.3, t));
const spray = [];
for (let i = 0; i < 70; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.16 + R() * .32, 12, 8), molassesM); s.visible = false; s.userData = { o: [(R() - .5) * 16, 6 + R() * 5, (R() - .5) * 4], ph: R() * 6 }; s.castShadow = true; scene.add(s); spray.push(s); }
const rivets = [];
for (let i = 0; i < 16; i++) { const r2 = new THREE.Mesh(new THREE.SphereGeometry(.34, 12, 10), castIron); const x = -5 + R() * 11, y = 3.2 + R() * 4;
  r2.userData = { t0: 31.3 + i * .1, p: [x, y, wallZ(x) + .3], v: [(R() - .5) * 9, 4 + R() * 8, 14 + R() * 12] }; r2.visible = false; r2.castShadow = true; scene.add(r2); rivets.push(r2); }
const jetsOut = [];
for (let i = 0; i < 5; i++) { const x = -3 + i * 1.6; const j = new THREE.Mesh(new THREE.CylinderGeometry(.08, .22, 3, 10), molassesM); j.rotation.x = Math.PI / 2; j.position.set(x, 3.5 + R() * 3, wallZ(x) + 1.5); j.visible = false; scene.add(j); jetsOut.push(j); }

// memorial candles
const candles = new THREE.Group(); scene.add(candles);
const waxM = std({ color: 0xf2ead8, roughness: .6 }), flameM = new THREE.MeshBasicMaterial({ color: 0xffd27a });
for (let i = 0; i < 21; i++) {
  const side = i % 2 ? 1 : -1, z = 20 - Math.floor(i / 2) * 2.2;
  const c = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .3, 10), waxM); c.position.set(side * 1.9, .78, z); candles.add(c);
  const f = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 8), flameM); f.scale.set(1, 1.8, 1); f.position.set(side * 1.9, 1.0, z); f.userData.ph = R() * 6; candles.add(f);
  const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffb860, transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  g.scale.setScalar(.55); g.position.set(side * 1.9, 1.0, z); candles.add(g);
}
const candleLight = new THREE.PointLight(0xffb060, 0, 14, 2); candleLight.position.set(0, 2.6, 12); scene.add(candleLight);

// falling snow
const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.6, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const snowPts = (() => {
  const N = 1400, pos = new Float32Array(N * 3), base = [];
  for (let i = 0; i < N; i++) { const x = (R() - .5) * 40, y = R() * 30, z = -70 + R() * 110; pos.set([x, y, z], i * 3); base.push([x, y, z, .5 + R() * 1.0]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: .09, map: dotTex, transparent: true, depthWrite: false, opacity: .9 }));
  p.userData = { base, N }; p.frustumCulled = false; scene.add(p); return p;
})();

/* ================= CHARACTERS ================= */
const chars = [];
const placeC = (t, x, y, z) => { t.root.position.set(x, y, z); scene.add(t.root); chars.push(t); return t; };
const foreman = placeC(new Toon({ body: '#2f2b3a', costume: 'suit', hat: 'top', hatCol: '#1d1b22', hatCol2: '#8a2f2a', scarf: '#9b3b33', mustache: true, tie: '#8a2f2a' }), .8, 0, 4);
foreman.set({ face: 'smug', armL: [.2, .1], armR: [.4, .9, .3] });
const tiny = placeC(new Toon({ body: '#4a6b8a', costume: 'overalls', hat: 'cap', hatCol: '#3e4f6e', hatCol2: '#dcd6c8', shirt: '#d8c9a8' }), 2.6, 0, -62.6);
tiny.set({ face: 'shock', look: [0, -1], armL: [.3, .2], armR: [.3, .2] });
const painter = placeC(new Toon({ body: '#6d5f3c', costume: 'vest', hat: 'cap', hatCol: '#7b6b3b', hatCol2: '#a99a64', shirt: '#e8e0cc' }), 4.6, 0, -63.4);
painter.set({ face: 'flat', armR: [1.9, .5, .2], prop: { type: 'brush', hand: 'R', tilt: .4 } });
const kids = [[-3.3, '#a14a3a', '#d9b24a', '#c14b3a', '#3c6e88'], [-.9, '#3b7566', '#c14b3a', '#efe6d2', '#d9b24a']].map(([x, b, h1, h2, sc]) => {
  const k = placeC(new Toon({ body: b, costume: 'coat', hat: 'beanie', hatCol: h1, hatCol2: h2, scarf: sc, scale: .66 }), x, 0, -63.5);
  k.set({ face: 'grin', armR: [2.75, .1], prop: { type: 'cup', hand: 'R' } }); return k;
});
const shaker = placeC(new Toon({ body: '#7a3a5a', costume: 'dress', hat: 'bun', hair: '#2e2118', scarf: '#3f6f8a' }), 1.6, 0, 21);
shaker.set({ face: 'neutral', armR: [2.1, .35, .25], prop: { type: 'bottle', hand: 'R' } });
const victim = placeC(new Toon({ body: '#5a3a22', costume: 'coat', hat: 'cap', hatCol: '#45291a', hatCol2: '#6b4a2c', scarf: '#6b4a6b' }), 0, .6, -4);
victim.set({ face: 'sad', armL: [.1, .1], armR: [.1, .1] });
const fireman = placeC(new Toon({ body: '#2a2f3a', costume: 'coat', hat: 'helmet', hatCol: '#b02f26', gloves: '#2a2420' }), -8.5, .5, -123.4);
fireman.set({ face: 'flat', armL: [1.2, .4, .5], armR: [1.0, .5, .6] });
const judge = placeC(new Toon({ body: '#15131a', costume: 'robe', hat: 'wig', scale: 1.1 }), CX, 1.35, -1.0);
judge.set({ face: 'flat', armR: [2.2, .9, .2], prop: { type: 'gavel', hand: 'R', tilt: .3 } });
const sniffer = placeC(new Toon({ body: '#3a3f5a', costume: 'suit', hat: 'bowler', hatCol: '#2a2420', scarf: '#9a4a3a', tie: '#3f6f8a' }), 1.9, 0, 13);
sniffer.set({ face: 'smile' });
const sniffLines = [];
for (let i = 0; i < 3; i++) {
  const pts = []; for (let k = 0; k < 16; k++) pts.push(new THREE.Vector3(Math.sin(k * .85 + i * 1.6) * .16 + (i - 1) * .26, k * .11, 0));
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, .022, 6, false), new THREE.MeshBasicMaterial({ color: 0x6a3a14, transparent: true, opacity: .8 }));
  m.position.set(1.9, 2.25, 13.5); m.visible = false; scene.add(m); sniffLines.push(m);
}

B.build();
OUTLINES.forEach(m => m.uniforms.res.value.set(W, H));

/* ================= ANIMATION ================= */
const KICKS = [[31.2, .55], [32.2, .3], [33.9, .6], [38.9, .95], [39.6, .35]];
const cam = new THREE.PerspectiveCamera(60, W / H, .3, 900);
const look = new THREE.Vector3(), focusPt = new THREE.Vector3();
function update(t) {
  tankBody.material = t >= 16.2 ? tankBrown : tankGray;
  drips.forEach(d => { const u = d.userData, L = u.top * (.82 + .18 * Math.sin(t * 1.3 + u.ph));
    u.run.scale.y = L; u.run.position.y = u.top - L / 2; u.bead.position.y = u.top - L; u.stain.scale.y = u.top; u.stain.position.y = u.top / 2; });
  puddles.forEach((p, i) => { const s = 1 + .07 * Math.sin(t * .9 + i); p.scale.set(1.1 * s, 1, .8 * s); });
  const mh = lerp(.4, 4.8, smooth(22.0, 23.9, t)); merc.scale.y = mh; merc.position.set(0, 4.9 + mh / 2, .2);
  drawTherm(t < 23.6 ? '2°F' : '40°F');
  bubbles.forEach(b => { const u = ((t / 2.6 + b.userData.ph) % 1), grow = smooth(0, .75, u), pop = 1 - smooth(.88, 1, u);
    b.scale.setScalar(Math.max(.001, b.userData.sz * grow * pop)); b.position.set(b.userData.x, -.3 + grow * (.6 + b.userData.sz), b.userData.z); });
  syrupM.normalMap.offset.set(t * .01, t * .006);
  waterM.normalMap.offset.set(t * .012, t * .02);
  mist.forEach((m2, i) => { const j = jets[i % 2], u = (t * .35 + m2.userData.ph) % 1, p = j.geometry.parameters.path.getPoint(.55 + u * .45);
    m2.position.set(p.x + Math.sin(i) * .6, p.y + u * .5, p.z); m2.scale.setScalar(.8 + u * 2.5); m2.material.opacity = .3 * (1 - u); m2.visible = t > 44.2 && t < 50; });
  const zf = waveZ(t), wOn = t >= 33.5 && t < 42.5;
  wave.visible = wOn; wave.position.set(0, 0, zf); wave.scale.set(1, 1.2 * (1 - smooth(40.5, 42.5, t) * .8), 1.25);
  const cleaned = smooth(46, 50, t);
  flood.visible = t >= 33.7 && t < 55; const zb = -64;
  flood.scale.set(1, 1 - cleaned * .85, Math.max(1, zf - zb)); flood.position.set(0, .3 - cleaned * .24, (zf + zb) / 2);
  spray.forEach((s, i) => { s.visible = wOn && t < 41; if (s.visible) { const o = s.userData.o, u = (t * 1.6 + s.userData.ph) % 1;
    s.position.set(o[0] + Math.sin(u * 6 + i) * 1.4, 4 + o[1] * .45 + u * 4 - 7 * u * u, zf + 6 + o[2] + u * 3); s.scale.setScalar(1 - u * .5); } });
  jetsOut.forEach((j, i) => { j.visible = t > 31.35 + i * .15 && t < 33.7; j.scale.y = 1 + (t - 31.35) * 2; j.position.z = wallZ(j.position.x) + 1.5 + (t - 31.35); });
  waterM.color.lerpColors(new THREE.Color(0x24425c), new THREE.Color(0x4a2a12), smooth(38, 44, t));
  bldgs.forEach(b => { b.g.rotation.z = b.lean * smooth(38.9 + b.delay * .3, 42 + b.delay * .3, t); });
  elSegs.forEach(s2 => { const k = smooth(39.2, 41, t); s2.seg.rotation.z = s2.bend * k * (s2.x < 0 ? 1 : -1); s2.seg.position.y = -s2.drop * k; });
  candles.visible = t >= 42.1 && t < 45; candleLight.intensity = 0;
  candles.children.forEach(c => { if (c.userData.ph !== undefined) c.scale.y = 1.8 + Math.sin(t * 9 + c.userData.ph) * .3; });
  painter.set({ armR: [1.9 + Math.sin(t * 6.5) * .35, .5, .2] });
  kids.forEach((k, i) => k.set({ armR: [2.75 + Math.sin(t * 2 + i) * .06, .1] }));
  const popT = t - 30.9;
  shaker.set({ armR: [2.1 + (t > 28.9 && t < 30.9 ? Math.sin(t * 34) * (.1 + smooth(28.9, 30.8, t) * .25) : 0), .35, .25],
               face: t < 30.9 ? (t > 30.0 ? 'angry' : 'neutral') : 'shock', prop: { type: 'bottle', hand: 'R', cap: popT < 0 } });
  flyCap.visible = popT > 0 && popT < 1.4;
  if (flyCap.visible) flyCap.position.set(capPos.x + 1.2 * popT, capPos.y + 7 * popT - 9 * popT * popT, capPos.z + 2.5 * popT);
  foam.forEach((f, i) => { const u = popT - i * .018; f.visible = u > 0 && u < 1.5;
    if (f.visible) f.position.set(capPos.x + f.userData.v[0] * u, capPos.y + f.userData.v[1] * u - 7 * u * u, capPos.z + f.userData.v[2] * u); });
  rivets.forEach(r2 => { const u = t - r2.userData.t0; r2.visible = u > 0 && u < 2.6;
    if (r2.visible) { const p = r2.userData.p, v = r2.userData.v; r2.position.set(p[0] + v[0] * u, p[1] + v[1] * u - 9 * u * u, p[2] + v[2] * u); } });
  let strike = 0; for (const k of [51.6, 52.6, 54.0]) { const d = t - k; if (d > 0 && d < .28) strike = Math.sin((d / .28) * Math.PI); }
  judge.set({ armR: [2.2 + strike * .7, .9 - strike * .5, .2] });
  sniffLines.forEach((m, i) => { m.visible = t > 57; m.position.y = 2.25 + Math.sin(t * 2 + i) * .1; m.material.opacity = .4 + .35 * Math.sin(t * 3 + i * 2); });
  sniffer.set({ look: [Math.sin(t * .7) * .4, -.2] });
  therm.visible = t >= 19.8 && t < 25.2;
  victim.root.visible = t >= 41.8 && t < 45.2;
  judge.root.visible = t >= 49; fireman.root.visible = t >= 44.2 && t < 50;
  foreman.root.visible = t < 33.7; tiny.root.visible = t < 33.7; painter.root.visible = t < 33.7; kids.forEach(k => k.root.visible = t < 33.7);
  shaker.root.visible = t >= 28.3 && t < 31.5;
  sniffer.root.visible = t >= 54.7;
  tiny.set({ face: t < 3.2 ? 'neutral' : 'shock' });
  const pos = snowPts.geometry.attributes.position;
  for (let i = 0; i < snowPts.userData.N; i++) { const b = snowPts.userData.base[i]; pos.setXYZ(i, b[0] + Math.sin(t * .75 + i) * .5, ((b[1] - t * b[3]) % 30 + 30) % 30, b[2]); }
  pos.needsUpdate = true;
}
// bottle cap + foam live in world space so they can fly off
const capPos = new THREE.Vector3(1.95, 2.95, 21.25);
const flyCap = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .03, 14), std({ color: 0xd9d2c2, metalness: .6, roughness: .3 })); scene.add(flyCap); flyCap.visible = false;
const foam = [];
for (let i = 0; i < 40; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(.03 + R() * .04, 8, 6), std({ color: 0xf4fff6, roughness: .2 })); f.visible = false; f.userData = { v: [(R() - .5) * 1.6, 2 + R() * 2.6, 1 + R() * 2.2] }; scene.add(f); foam.push(f); }

/* ================= SHOTS ================= */
const BND = [0, 2.2, 5.0, 10.1, 15.7, 17.0, 20.3, 24.7, 28.7, 31.2, 33.7, 38.8, 42.3, 44.7, 49.5, 55.1, 61.5];
const S = (i, mood, p0, p1, l0, l1, f0, f1, o = {}) => ({ t0: BND[i], t1: BND[i + 1], mood, p0: V(p0), p1: V(p1), l0: V(l0), l1: V(l1), f0, f1,
  roll: o.roll || 0, tr: o.tr === undefined ? .35 : o.tr, blur: o.blur ?? 5, fp: o.fp ? V(o.fp) : null, ev: o.ev || 1, name: o.name || '' });
export const SHOTS = [
  S(0, 'day', [2.0, 1.5, 30], [1.8, 1.9, 16], [0, 11, -88], [0, 13, -88], 62, 56, { fp: [.8, 2, 4], blur: 4, name: 'Street wide' }),
  S(1, 'day', [2.6, 1.2, -51.5], [1.4, 1.6, -54.6], [.5, 4, -66], [0, 24, -66], 74, 78, { roll: .04, blur: 3, fp: [2.6, 2, -62.6], name: 'Tank base, tilt up' }),
  S(2, 'amber', [400, 30, 6], [400, 15, 2], [400, 0, -8], [400, 0, -6], 62, 56, { roll: .05, blur: 6, ev: 1.7, name: 'Inside, top-down' }),
  S(3, 'day', [-8.5, 4.5, -50.2], [1, 5.4, -53.0], [-1.5, 6.5, -66], [5, 5, -66], 56, 50, { roll: -.03, blur: 4, name: 'Leaking wall' }),
  S(4, 'day', [-1.6, 1.8, -57.8], [.4, 2.0, -59.6], [4.6, 2.0, -63.4], [4.6, 2.1, -63.4], 52, 45, { fp: [4.6, 2, -63.4], blur: 8, name: 'Paint job' }),
  S(5, 'day', [-2.1, 1.05, -56.3], [-2.1, 1.2, -59.6], [-2.1, 1.35, -63.5], [-2.1, 1.5, -63.5], 50, 43, { fp: [-2.1, 1.4, -63.5], blur: 8, name: 'Kids with cups' }),
  S(6, 'sun', [2, 2.4, 22.5], [4.2, 5.6, 17.5], [6.9, 5, 11.5], [6.9, 8.4, 11.5], 56, 48, { fp: [6.9, 7, 11.5], blur: 8, name: 'Thermometer' }),
  S(7, 'amber', [400, 1.2, 13], [400, 2.6, 3.5], [400, 2.4, -20], [400, 3, -20], 70, 60, { roll: -.06, blur: 7, name: 'Fermenting' }),
  S(8, 'day', [1.3, 2.4, 26.6], [1.45, 2.4, 24.5], [1.65, 2.2, 21], [1.65, 2.3, 21], 44, 37, { fp: [1.65, 2.3, 21], blur: 9, name: 'Soda shake' }),
  S(9, 'day', [3.2, 4.2, -52.5], [1.2, 4.0, -56.4], [1, 5.0, -66], [0, 5.2, -66], 60, 52, { roll: .08, tr: 0, blur: 4, name: 'Rivets' }),
  S(10, 'day', [4.6, 2.6, 24], [3.4, 2.0, 17.5], [-1.5, 7, -34], [-1.5, 9, -2], 60, 70, { roll: .06, blur: 3, name: 'The wave' }),
  S(11, 'day', [7.5, 5.2, 2], [4.5, 5.4, -4], [-6, 5, -26], [-6.5, 6, -30], 66, 60, { roll: .09, tr: .5, blur: 3, name: 'Aftermath' }),
  S(12, 'night', [2.4, 2.0, 31], [2.2, 1.8, 26.5], [0, 1.2, 4], [0, 1.4, 0], 46, 40, { tr: .5, blur: 6, fp: [0, 1.6, -4], ev: 1.25, name: '21 candles' }),
  S(13, 'harbor', [-14.5, 3.4, -113.5], [-12, 3.7, -116.5], [-2, 3, -140], [-1, 3.4, -140], 58, 52, { blur: 5, fp: [-8.5, 2.2, -123.4], name: 'Harbour' }),
  S(14, 'court', [-399.2, 3.3, 12], [-399.6, 3.2, 7.4], [-400, 3.0, -.5], [-400, 3.0, -1], 46, 38, { tr: .45, fp: [-400, 3.2, -1.0], blur: 9, name: 'Courtroom' }),
  S(15, 'golden', [3.2, 1.8, 21], [8, 10, 46], [1.8, 2, 13], [0, 11, -60], 52, 64, { tr: .45, fp: [1.9, 2, 13], blur: 6, name: 'Callback' }),
];
function setCam(sh, t) {
  const lin = clamp((t - sh.t0) / (sh.t1 - sh.t0)), e = lin * lin * lin * (lin * (lin * 6 - 15) + 10), p = lin * .55 + e * .45;
  cam.position.lerpVectors(sh.p0, sh.p1, p); look.lerpVectors(sh.l0, sh.l1, p);
  cam.fov = lerp(sh.f0, sh.f1, p); cam.updateProjectionMatrix(); cam.up.set(0, 1, 0);
  let sx = 0, sy = 0, sr = 0;
  for (const [k, a] of KICKS) { const d = t - k; if (d > 0 && d < .55) { const f = a * Math.exp(-d * 13); sx += Math.sin(d * 80) * f * .36; sy += Math.cos(d * 67) * f * .3; sr += Math.sin(d * 55) * f * .032; } }
  cam.position.x += sx; cam.position.y += sy; cam.lookAt(look); cam.rotateZ(sh.roll * (1 - p * .6) + sr);
  focusPt.copy(sh.fp || look);
}

/* ================= POST: HDR -> DOF + bloom -> filmic grade ================= */
const VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
const qScene = new THREE.Scene(), qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const qMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null); qMesh.frustumCulled = false; qScene.add(qMesh);
const run = (m, rt) => { qMesh.material = m; renderer.setRenderTarget(rt); renderer.render(qScene, qCam); };
const SM = (u, fs) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: fs, depthTest: false, depthWrite: false });
const HF = { type: THREE.HalfFloatType };
const depthTex = new THREE.DepthTexture(W, H); depthTex.type = THREE.UnsignedIntType;
const rtD = new THREE.WebGLRenderTarget(W, H, { depthTexture: depthTex });
const rtB = new THREE.WebGLRenderTarget(W, H, { ...HF, samples: +(params.get('msaa') ?? 4) });
const rtCA = new THREE.WebGLRenderTarget(W, H, HF), rtCB = new THREE.WebGLRenderTarget(W, H, HF);
const q = (d) => [Math.round(W / d), Math.round(H / d)];
const rtQ1 = new THREE.WebGLRenderTarget(...q(4), HF), rtQ2 = new THREE.WebGLRenderTarget(...q(4), HF);
const rtE1 = new THREE.WebGLRenderTarget(...q(12), HF), rtE2 = new THREE.WebGLRenderTarget(...q(12), HF);
const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
const LIN = `float lin(vec2 uv){ float z = texture2D(tD, uv).x; return (2.0*near*far)/(far+near-(z*2.0-1.0)*(far-near)); }`;

const brightM = SM({ tS: { value: null }, thr: { value: 1.1 } }, `varying vec2 vUv; uniform sampler2D tS; uniform float thr;
  void main(){ vec3 c = texture2D(tS, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(thr, thr * 2.2, l), 1.0); }`);
const blurM = SM({ tS: { value: null }, dir: { value: new THREE.Vector2() } }, `varying vec2 vUv; uniform sampler2D tS; uniform vec2 dir;
  void main(){ vec3 s = texture2D(tS, vUv).rgb * .2270;
    s += (texture2D(tS, vUv + dir * 1.3846).rgb + texture2D(tS, vUv - dir * 1.3846).rgb) * .3162;
    s += (texture2D(tS, vUv + dir * 3.2308).rgb + texture2D(tS, vUv - dir * 3.2308).rgb) * .0703;
    gl_FragColor = vec4(s, 1.0); }`);
function blur(src, tmp, w, h, steps = 2) {
  for (let i = 0; i < steps; i++) {
    blurM.uniforms.tS.value = src.texture; blurM.uniforms.dir.value.set((1 + i) / w, 0); run(blurM, tmp);
    blurM.uniforms.tS.value = tmp.texture; blurM.uniforms.dir.value.set(0, (1 + i) / h); run(blurM, src);
  }
}
const copyM = SM({ tS: { value: null } }, `varying vec2 vUv; uniform sampler2D tS; void main(){ gl_FragColor = vec4(texture2D(tS, vUv).rgb, 1.0); }`);

const compM = SM({
  tS: { value: null }, tD: { value: depthTex }, tQ: { value: null }, tE: { value: null },
  texel: { value: new THREE.Vector2(1 / W, 1 / H) }, near: { value: .3 }, far: { value: 900 },
  focus: { value: 10 }, blurAmt: { value: 6 }, expo: { value: 1 }, bloom: { value: .5 }, sat: { value: 1.2 },
}, `
varying vec2 vUv;
uniform sampler2D tS, tD, tQ, tE; uniform vec2 texel; uniform float near, far, focus, blurAmt, expo, bloom, sat;
${LIN}
float coc(vec2 uv){ float d = lin(uv); return clamp(abs(d - focus) / max(focus * 1.6, 5.0), 0.0, 1.0); }
float ao(vec2 uv, float dc){
  float r = clamp(60.0 / dc, 2.0, 14.0), j = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453), occ = 0.0;
  for (int i = 0; i < 8; i++) { float a = (float(i) + j) * 0.785; vec2 off = vec2(cos(a), sin(a)) * r * (.4 + .6 * j) * texel;
    float diff = dc - lin(uv + off); occ += clamp(diff / (dc * .03 + .2), 0.0, 1.0) * (1.0 - step(dc * .2, diff)); }
  return occ / 8.0;
}
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0.0, 1.0); }
void main(){
  float dc = lin(vUv), c = coc(vUv), r = c * blurAmt;
  vec3 sum = texture2D(tS, vUv).rgb; float ws = 1.0;
  if (r > .4) for (int i = 0; i < 24; i++) {
    float fi = float(i), a = fi * 2.39996, rr = sqrt((fi + .5) / 24.0);
    vec2 off = vec2(cos(a), sin(a)) * rr * r * texel; float sc = coc(vUv + off);
    float w = sc >= c * .5 ? 1.0 : .2; sum += texture2D(tS, vUv + off).rgb * w; ws += w;
  }
  vec3 col = sum / ws;
  col *= 1.0 - ao(vUv, dc) * .28 * (1.0 - c);
  col += (texture2D(tQ, vUv).rgb * .55 + texture2D(tE, vUv).rgb * .8) * bloom;
  col = aces(col * expo);
  float l = dot(col, vec3(.2126, .7152, .0722));
  col *= mix(vec3(.93, .98, 1.08), vec3(1.0), smoothstep(0.0, .45, l));   // cool shadows
  col *= mix(vec3(1.0), vec3(1.05, 1.01, .95), smoothstep(.5, 1.0, l));    // warm highlights
  col = mix(vec3(l), col, sat);
  col = clamp((col - .5) * 1.07 + .5, 0.0, 1.0);
  col *= 1.0 - smoothstep(.5, 1.05, length(vUv - .5)) * .22;
  gl_FragColor = vec4(col, 1.0);
}`);
const finalM = SM({ tA: { value: null }, tB: { value: null }, mixv: { value: 0 }, flash: { value: 0 }, fade: { value: 0 }, grain: { value: .012 } }, `
varying vec2 vUv; uniform sampler2D tA, tB; uniform float mixv, flash, fade, grain;
vec3 srgb(vec3 c){ c = max(c, vec3(0.0)); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - .055, step(vec3(.0031308), c)); }
vec3 samp(vec2 uv){ return mix(texture2D(tA, uv).rgb, texture2D(tB, uv).rgb, smoothstep(0.0, 1.0, mixv)); }
void main(){
  vec2 d = vUv - .5; float k = dot(d, d) * .8;
  vec3 c = vec3(samp(vUv - d * k * .004).r, samp(vUv).g, samp(vUv + d * k * .004).b);
  c = mix(c, vec3(1.0), flash); c *= 1.0 - fade; c = srgb(c);
  float n = fract(sin(dot(vUv * 2048.0, vec2(12.9898, 78.233))) * 43758.5453); c += (n - .5) * grain;
  gl_FragColor = vec4(c, 1.0);
}`);

function renderShot(sh, t, out) {
  setCam(sh, t);
  applyMood(sh.mood, cam, focusPt);
  snowPts.visible = sh.mood === 'day' || sh.mood === 'night' || sh.mood === 'golden';
  lampGlows.forEach(g => g.material.opacity = sh.mood === 'night' ? .4 : sh.mood === 'golden' ? .2 : 0);
  for (const c of chars) if (c.root.visible) c.update(t, cam, SCALE);
  // depth for DOF/AO (no background, no colour)
  const bg = scene.background; scene.background = null;
  scene.overrideMaterial = depthOnly; renderer.setRenderTarget(rtD); renderer.clear(); renderer.render(scene, cam);
  scene.overrideMaterial = null; scene.background = bg;
  // HDR beauty
  renderer.setRenderTarget(rtB); renderer.clear(); renderer.render(scene, cam);
  // bloom chain
  brightM.uniforms.tS.value = rtB.texture; run(brightM, rtQ1); blur(rtQ1, rtQ2, ...q(4), 2);
  copyM.uniforms.tS.value = rtQ1.texture; run(copyM, rtE1); blur(rtE1, rtE2, ...q(12), 2);
  const m = MOODS[sh.mood];
  Object.assign(compM.uniforms, {});
  compM.uniforms.tS.value = rtB.texture; compM.uniforms.tQ.value = rtQ1.texture; compM.uniforms.tE.value = rtE1.texture;
  compM.uniforms.near.value = cam.near; compM.uniforms.far.value = cam.far;
  compM.uniforms.focus.value = cam.position.distanceTo(focusPt);
  compM.uniforms.blurAmt.value = sh.blur * Math.max(.5, SCALE) * 1.6;
  compM.uniforms.expo.value = m.exp * sh.ev; compM.uniforms.sat.value = m.sat ?? 1.2;
  run(compM, out);
}
function frame(t) {
  t = clamp(t, 0, TOTAL - .001);
  update(t);
  let ia = 0; for (let i = 0; i < SHOTS.length; i++) if (t >= SHOTS[i].t0) ia = i;
  let A = SHOTS[ia], Bs = null, mixv = 0; const nx = SHOTS[ia + 1], pv = SHOTS[ia - 1];
  if (nx && A.tr > 0 && t > A.t1 - A.tr / 2) { Bs = nx; mixv = (t - (A.t1 - A.tr / 2)) / A.tr; }
  else if (pv && pv.tr > 0 && t < A.t0 + pv.tr / 2) { Bs = A; A = pv; mixv = (t - (A.t1 - A.tr / 2)) / A.tr; }
  renderShot(A, t, rtCA); if (Bs) renderShot(Bs, t, rtCB);
  finalM.uniforms.tA.value = rtCA.texture; finalM.uniforms.tB.value = (Bs ? rtCB : rtCA).texture;
  finalM.uniforms.mixv.value = Bs ? clamp(mixv) : 0;
  finalM.uniforms.flash.value = t >= 31.2 && t < 31.36 ? 1 - (t - 31.2) / .16 : 0;
  finalM.uniforms.fade.value = smooth(60.3, 61.5, t);
  run(finalM, null);
}

/* ================= player ================= */
let t = 0, playing = false, last = 0, voiceOn = true, lastLine = -1;
const $ = (id) => document.getElementById(id);
const synth = window.speechSynthesis;
function speak(i) { if (!voiceOn || !synth) return; synth.cancel(); const u = new SpeechSynthesisUtterance(LINES[i][1]); u.rate = 1.02; u.pitch = .85; synth.speak(u); }
function lineAt(tt) { let k = -1; LINES.forEach((l, i) => { if (tt >= l[0]) k = i; }); return k; }
function ui() { if (!$('seek')) return; $('seek').value = Math.round(t * 10); $('time').textContent = `${t.toFixed(1)} / ${TOTAL.toFixed(1)}`; $('play').textContent = playing ? 'Pause' : (t >= TOTAL - .05 ? 'Replay' : 'Play'); }
function tick(now) {
  if (playing) { t += (now - last) / 1000; if (t >= TOTAL) { t = TOTAL - .001; playing = false; synth && synth.cancel(); }
    const li = lineAt(t); if (li !== lastLine) { lastLine = li; if (li >= 0 && playing) speak(li); } }
  last = now; frame(t); ui(); requestAnimationFrame(tick);
}
if (!RENDER) {
  $('play').onclick = () => { if (t >= TOTAL - .05) { t = 0; lastLine = -1; } playing = !playing; if (!playing && synth) synth.cancel(); else lastLine = -1; };
  $('seek').oninput = (e) => { t = +e.target.value / 10; lastLine = lineAt(t); synth && synth.cancel(); };
  $('voice').onclick = () => { voiceOn = !voiceOn; $('voice').textContent = 'Voice: ' + (voiceOn ? 'on' : 'off'); if (!voiceOn && synth) synth.cancel(); };
  t = 1.2; requestAnimationFrame(tick);
} else {
  window.__renderAt = (tt) => { frame(tt); return cv.toDataURL('image/jpeg', .94); };
  window.__ready = true;
}
window.__frame = frame;
window.__dbg = {
  wallBasic: () => { inWall.material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.BackSide }); surf.material = new THREE.MeshBasicMaterial({ color: 0xff00ff }); },
  wallStd: () => { inWall.material = new THREE.MeshStandardMaterial({ color: 0xb8a088, side: THREE.BackSide, roughness: .6 }); },
  wallStdMap: () => { const m = pbrMat(LIB.steelGray, 14, 8, { side: THREE.BackSide, metalness: .1, color: 0xb8a088 }); m.normalMap = null; inWall.material = m; },
  surfPlain: () => { surf.material = new THREE.MeshStandardMaterial({ color: 0x1e1209, roughness: .2 }); },
  info: () => ({ hemi: hemi.intensity, sun: sun.intensity, pt: pt.intensity, ptpos: pt.position.toArray(), mood: curMood }),
};
