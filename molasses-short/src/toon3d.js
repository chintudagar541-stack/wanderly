// 3D cartoon characters built to match the 2D ink style:
//  - uniform screen-space ink outline on every coloured part (inverted hull in clip space)
//  - two-tone cel shading: lit colour plus one shade band, no cast shadows on the body
//  - limbs are black ink tubes, hands round, faces drawn with the 2D face routine
import * as THREE from 'three';
import { FACES, face as drawFace, costume as drawCostume, shade } from './toon2d.js';

const INK = new THREE.Color('#17121a');
export const OUTLINES = [];            // every hull material, so the renderer can set px/resolution

/* ---------- cel ramp: one hard step, a lit tone and a shade tone ---------- */
function celRamp(lo, hi = 255, step = .42) {
  const N = 32, d = new Uint8Array(N * 4);
  for (let i = 0; i < N; i++) { const v = i / (N - 1) < step ? lo : hi; d.set([v, v, v, 255], i * 4); }
  const t = new THREE.DataTexture(d, N, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
}
const RAMP = celRamp(176);
const SKIN_RAMP = celRamp(214, 255, .3);

export function cel(color, o = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: o.skin ? SKIN_RAMP : RAMP, ...o.extra });
}

/* ---------- ink outline: extrude in clip space so the line is N pixels wide everywhere ---------- */
const outlineMat = () => {
  const m = new THREE.ShaderMaterial({
    uniforms: { px: { value: 6 }, res: { value: new THREE.Vector2(1080, 1920) }, ink: { value: INK } },
    vertexShader: `
      uniform float px; uniform vec2 res;
      void main(){
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec3 nv = normalize(normalMatrix * normal);
        vec4 nc = projectionMatrix * vec4(nv, 0.0);
        vec2 dir = nc.xy; float l = length(dir); dir = l > 1e-5 ? dir / l : vec2(0.0);
        clip.xy += dir * px * 2.0 / res * clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: `uniform vec3 ink; void main(){ gl_FragColor = vec4(ink, 1.0); }`,
    side: THREE.BackSide,
  });
  OUTLINES.push(m); return m;
};
function ink(mesh, scale = 1) {
  const m = outlineMat(); m.userData.scale = scale;
  const o = new THREE.Mesh(mesh.geometry, m); o.castShadow = false; o.receiveShadow = false; o.userData.isHull = true;
  mesh.add(o); return mesh;
}
const blackM = new THREE.MeshBasicMaterial({ color: INK });

/* ---------- small canvas helpers ---------- */
function canvasTex(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { tex: t, c, x };
}
const stripes = (a, b, n, vertical = true) => canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = a; x.fillRect(0, 0, w, h); x.fillStyle = b;
  for (let i = 0; i < n; i++) vertical ? x.fillRect((i + .25) * w / n, 0, w / n * .45, h) : x.fillRect(0, (i + .25) * h / n, w, h / n * .45);
}).tex;

// planar front projection: front faces read the canvas, back faces read a plain corner
function frontUV(geo, x0, x1, y0, y1, plain = [0.01, 0.99]) {
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (z > -0.02) uv.setXY(i, (x - x0) / (x1 - x0), (y - y0) / (y1 - y0));
    else uv.setXY(i, plain[0], plain[1]);
  }
  uv.needsUpdate = true;
}

/* ---------- dimensions (metres), matched to the 2D proportions ---------- */
const PX = .00254;                      // one 2D pixel in metres
const HEAD_R = 136 * PX, HEAD_Y = (1000 - 300) * PX - .02;
const SHOULDER_Y = (1000 - 506) * PX, SHOULDER_X = 84 * PX;
const HIP_Y = (1000 - 770) * PX, HIP_X = 34 * PX;
const UPPER = 112 * PX, LOWER = 104 * PX, LIMB_R = 7.5 * PX;

export class Toon {
  constructor(spec) {
    const S = this.spec = Object.assign({
      skin: '#f7f2ea', body: '#3b5f8a', costume: 'coat', hat: null, hatCol: '#2b2b33',
      hatCol2: '#d9d4c8', hair: '#3a2a1e', scarf: null, shoes: '#3b2a1f', gloves: null, mustache: false, scale: 1,
    }, spec);
    this.root = new THREE.Group();
    this.g = new THREE.Group(); this.g.scale.setScalar(S.scale); this.root.add(this.g);
    this.state = { face: 'flat', look: [0, 0], armL: [.15, .1, 0], armR: [.15, .1, 0], walk: 0, legs: 0, bob: 0, lean: 0, blink: 0, sweat: false, prop: null, propOn: true };
    this.parts = [];
    this.build();
  }
  add(mesh, parent = this.g, outline = true) { mesh.castShadow = true; mesh.receiveShadow = false; parent.add(mesh); if (outline) ink(mesh); this.parts.push(mesh); return mesh; }

  build() {
    const S = this.spec, g = this.g;
    const robe = S.costume === 'robe', dress = S.costume === 'dress';
    const top = 448, bot = robe ? 930 : dress ? 820 : 790, wT = 196, wB = robe ? 250 : dress ? 280 : 214;
    const yTop = (1000 - top) * PX, yBot = (1000 - bot) * PX;

    /* torso: lathe of the 2D body silhouette, flattened front-to-back */
    const rT = wT / 2 * PX, rB = wB / 2 * PX;
    const prof = [
      [0, yBot], [rB * .86, yBot], [rB, yBot + .04], [rB * 1.0, yBot + .12],
      [lerp(rB, rT, .5) * 1.02, (yBot + yTop) / 2], [rT * 1.01, yTop - .12], [rT * .94, yTop - .055], [rT * .7, yTop - .012], [rT * .3, yTop], [0, yTop],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const torsoGeo = new THREE.LatheGeometry(prof, 40);
    torsoGeo.rotateY(Math.PI / 2);
    torsoGeo.scale(1, 1, .64);
    torsoGeo.computeVertexNormals();
    // costume canvas uses the 2D drawing routine, mapped flat onto the front
    const BW = 512, BH = 820, X0 = -.3, X1 = .3, Y0 = .5, Y1 = 1.46;
    const bodyC = canvasTex(BW, BH, (x) => {
      x.fillStyle = S.body; x.fillRect(0, 0, BW, BH);
      const sx = BW / ((X1 - X0) / PX), sy = BH / ((Y1 - Y0) / PX);
      x.setTransform(sx, 0, 0, sy, BW / 2 - 256 * sx, BH - (1000 - Y0 / PX) * sy);
      drawCostume(x, S, 256, top, bot, wT, wB);
      x.setTransform(1, 0, 0, 1, 0, 0);
    });
    frontUV(torsoGeo, X0, X1, Y0, Y1, [.01, .99]);
    this.add(new THREE.Mesh(torsoGeo, cel(0xffffff, { extra: { map: bodyC.tex } })));

    /* legs + shoes */
    this.legs = [];
    if (!robe) for (const side of [-1, 1]) {
      const hip = new THREE.Group(); hip.position.set(side * HIP_X, HIP_Y + .02, 0); g.add(hip);
      const len = HIP_Y + .02 - .04;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(LIMB_R, LIMB_R, len, 10), blackM); leg.position.y = -len / 2; leg.castShadow = true; hip.add(leg);
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), cel(S.shoes)); shoe.scale.set(.09, .045, .12);
      shoe.position.set(side * .03, -len + .005, .04); hip.add(shoe); shoe.castShadow = true; ink(shoe); this.legs.push(hip);
    } else for (const side of [-1, 1]) {
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), cel(S.shoes)); shoe.scale.set(.095, .045, .12);
      shoe.position.set(side * .12, .04, .08); this.add(shoe);
    }

    /* arms: shoulder -> elbow -> hand, ink tubes with round joints */
    this.arms = [];
    for (const side of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(side * SHOULDER_X, SHOULDER_Y, .02); g.add(sh);
      const up = new THREE.Mesh(new THREE.CylinderGeometry(LIMB_R, LIMB_R, UPPER, 10), blackM); up.position.y = -UPPER / 2; up.castShadow = true; sh.add(up);
      const el = new THREE.Group(); el.position.y = -UPPER; sh.add(el);
      const j = new THREE.Mesh(new THREE.SphereGeometry(LIMB_R, 10, 8), blackM); el.add(j);
      const lo = new THREE.Mesh(new THREE.CylinderGeometry(LIMB_R, LIMB_R, LOWER, 10), blackM); lo.position.y = -LOWER / 2; lo.castShadow = true; el.add(lo);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(17 * PX, 18, 14), cel(S.gloves || S.skin, { skin: !S.gloves }));
      hand.position.y = -LOWER; el.add(hand); hand.castShadow = true; ink(hand);
      const holder = new THREE.Group(); holder.position.y = -LOWER; el.add(holder);
      this.arms.push({ sh, el, holder, side });
    }

    /* head with the drawn face mapped on the front */
    const headGeo = new THREE.SphereGeometry(HEAD_R, 48, 36);
    const FS = 512;
    this.faceC = canvasTex(FS, FS, () => {});
    frontUV(headGeo, -HEAD_R * 1.06, HEAD_R * 1.06, -HEAD_R * 1.06, HEAD_R * 1.06, [.01, .99]);
    this.head = new THREE.Group(); this.head.position.y = HEAD_Y; g.add(this.head);
    this.add(new THREE.Mesh(headGeo, cel(0xffffff, { skin: true, extra: { map: this.faceC.tex } })), this.head);
    this.hat();

    /* scarf */
    if (S.scarf) {
      const sc = stripes(S.scarf, shade(S.scarf, .82), 6, true);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.17, .055, 12, 28), cel(0xffffff, { extra: { map: sc } }));
      ring.rotation.x = Math.PI / 2; ring.scale.set(1, .72, 1); ring.position.set(0, yTop - .02, .0); this.add(ring);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(.085, .36, .03, 1, 4, 1), cel(0xffffff, { extra: { map: stripes(S.scarf, shade(S.scarf, .82), 5, false) } }));
      tail.position.set(.1, yTop - .2, .16); tail.rotation.z = .08; this.add(tail);
    }
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .55), new THREE.MeshBasicMaterial({ map: blob(), transparent: true, depthWrite: false, opacity: .45, color: 0x000000 }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.position.y = .025; this.blob.renderOrder = 2; this.root.add(this.blob);
    this.drawFace(true);
  }

  hat() {
    const S = this.spec, H = S.hat, hd = this.head, Rh = HEAD_R, c1 = S.hatCol, c2 = S.hatCol2;
    const hairCap = (col, cut = .42) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(Rh * 1.035, 40, 20, 0, Math.PI * 2, 0, Math.PI * cut), cel(col));
      m.rotation.x = -.18; return this.add(m, hd);
    };
    if (H === 'hair') hairCap(S.hair, .4);
    if (H === 'bun') { hairCap(S.hair, .44); const b = new THREE.Mesh(new THREE.SphereGeometry(.12, 24, 18), cel(S.hair)); b.position.set(0, Rh * .92, -Rh * .35); this.add(b, hd); }
    if (H === 'top') {
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(.19, .21, .34, 32), cel(c1)); crown.position.y = Rh + .12; this.add(crown, hd);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(.212, .214, .06, 32), cel(c2)); band.position.y = Rh + .0; this.add(band, hd, false);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .022, 40), cel(c1)); brim.position.y = Rh - .04; this.add(brim, hd);
      hd.children.forEach(m => { if (m.position.y > Rh - .1 && m.isMesh) m.rotation.z = -.06; });
    }
    if (H === 'bowler') {
      const d = new THREE.Mesh(new THREE.SphereGeometry(.25, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), cel(c1)); d.scale.y = 1.05; d.position.y = Rh - .07; this.add(d, hd);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .02, 40), cel(c1)); brim.position.y = Rh - .07; this.add(brim, hd);
    }
    if (H === 'cap') {
      const d = new THREE.Mesh(new THREE.SphereGeometry(Rh * 1.08, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2), cel(0xffffff, { extra: { map: stripes(c1, c2, 12, true) } }));
      d.scale.set(1.04, .62, 1.06); d.position.y = Rh * .3; d.rotation.x = -.12; this.add(d, hd);
      const btn = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 10), cel(c1)); btn.position.set(0, Rh * .3 + Rh * .67, -.02); this.add(btn, hd);
      const visor = new THREE.Mesh(new THREE.CylinderGeometry(Rh * .82, Rh * .82, .02, 30, 1, false, -Math.PI / 2, Math.PI), cel(shade(c1, .7)));
      visor.position.set(-.03, Rh * .38, Rh * .62); visor.rotation.set(.18, -.25, 0); this.add(visor, hd);
    }
    if (H === 'beanie') {
      const d = new THREE.Mesh(new THREE.SphereGeometry(Rh * 1.06, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2), cel(0xffffff, { extra: { map: stripes(c1, c2, 4, false) } }));
      d.scale.y = .86; d.position.y = Rh * .26; this.add(d, hd);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(Rh * 1.07, Rh * 1.08, .1, 40), cel(shade(c1, .85))); band.position.y = Rh * .3; this.add(band, hd);
      const pom = new THREE.Mesh(new THREE.SphereGeometry(.075, 16, 12), cel(c2)); pom.position.y = Rh * .3 + Rh * .9; this.add(pom, hd);
    }
    if (H === 'helmet') {
      const d = new THREE.Mesh(new THREE.SphereGeometry(Rh * 1.1, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2), cel(c1)); d.scale.y = .9; d.position.y = Rh * .25; this.add(d, hd);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(Rh * 1.45, Rh * 1.45, .025, 40), cel(c1)); brim.scale.z = 1.25; brim.position.set(0, Rh * .25, -.06); this.add(brim, hd);
      const badge = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .02, 4), cel('#e7c35a')); badge.rotation.x = Math.PI / 2; badge.position.set(0, Rh * .62, Rh * .9); this.add(badge, hd);
    }
    if (H === 'wig') {
      for (const side of [-1, 1]) for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(.08, 16, 12), cel('#f2efe8')); c.position.set(side * Rh * .98, Rh * .45 - i * .12, -.04); this.add(c, hd); }
      const t = new THREE.Mesh(new THREE.SphereGeometry(Rh * 1.06, 40, 18, 0, Math.PI * 2, 0, Math.PI * .34), cel('#f2efe8')); t.rotation.x = -.42; this.add(t, hd);
    }
  }

  drawFace(force) {
    const st = this.state, key = st.face + '|' + (st.blink > .5 ? 1 : 0) + '|' + st.look + '|' + st.sweat;
    if (!force && key === this._fk) return; this._fk = key;
    const x = this.faceC.x, S = this.spec, F = FACES[st.face] || FACES.flat;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.fillStyle = S.skin; x.fillRect(0, 0, 512, 512);
    // head canvas covers ±1.06 R; the 2D face routine is drawn at R=136px
    const k = 512 / (2 * 1.06 * 136);
    x.setTransform(k, 0, 0, k, 256 - 256 * k, 256 - 300 * k);
    drawFace(x, S, F, st, 256, 300, 136);
    if (st.sweat) {
      x.fillStyle = '#8fd0ff'; x.strokeStyle = '#17121a'; x.lineWidth = 6;
      x.beginPath(); x.moveTo(374, 188); x.quadraticCurveTo(354, 230, 374, 240); x.quadraticCurveTo(394, 230, 374, 188); x.fill(); x.stroke();
    }
    x.setTransform(1, 0, 0, 1, 0, 0);
    this.faceC.tex.needsUpdate = true;
  }

  set(o) { Object.assign(this.state, o); }
  face(n) { this.state.face = n; }

  // pose + face from state; turn to the camera; set outline width for this distance
  update(t, cam, SCALE) {
    const st = this.state;
    for (const a of this.arms) {
      const p = a.side < 0 ? st.armL : st.armR;
      a.sh.rotation.set(-(p[2] || 0), 0, a.side * p[0]);
      a.el.rotation.set(0, 0, a.side * p[1]);
    }
    if (this.legs.length) { const sw = Math.sin(st.walk || 0) * .3 * (st.legs || 0); this.legs[0].rotation.x = sw; this.legs[1].rotation.x = -sw; }
    this.g.position.y = (st.bob || 0) * .001;
    this.g.rotation.z = -(st.lean || 0);
    // face the lens, like the drawn characters do
    const wp = new THREE.Vector3(); this.root.getWorldPosition(wp);
    const yaw = Math.atan2(cam.position.x - wp.x, cam.position.z - wp.z);
    this.g.rotation.y = yaw - this.root.rotation.y;
    // breathing + blink
    const ph = (t * .7 + (this.seed ??= Math.random() * 10)) % 3.3;
    st.blink = ph < .14 ? 1 : 0;
    this.head.position.y = HEAD_Y + Math.sin(t * 2 + this.seed) * .006;
    this.drawFace();
    this.syncProp();
    // ink width: thicker up close, never hairline in the distance
    const d = cam.position.distanceTo(wp);
    const px = 7.4 * SCALE * Math.min(1.3, Math.max(.62, 6 / d));
    this.root.traverse(o => { if (o.userData.isHull) { o.material.uniforms.px.value = px * (o.material.userData.scale || 1); } });
  }

  syncProp() {
    const p = this.state.prop, show = p && this.state.propOn !== false;
    const want = show ? p.type + (p.cap === false ? '-open' : '') : null;
    if (want !== this._propKey) {
      for (const a of this.arms) a.holder.clear();
      this._propKey = want;
      if (show) { const a = this.arms[p.hand === 'L' ? 0 : 1]; this.propMesh = makeProp(p); a.holder.add(this.propMesh); this.propArm = a; }
      else this.propMesh = null;
    }
    if (this.propMesh) { // keep props upright regardless of the arm angle
      const a = this.propArm, s = a.side, arm = s < 0 ? this.state.armL : this.state.armR;
      this.propMesh.rotation.set(0, 0, -s * (arm[0] + arm[1]) + (p.tilt || 0));
    }
  }
}

function lerp(a, b, t) { return a + (b - a) * t; }
let _blob;
function blob() {
  if (_blob) return _blob;
  _blob = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 62); g.addColorStop(0, 'rgba(0,0,0,.8)'); g.addColorStop(.6, 'rgba(0,0,0,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }).tex;
  return _blob;
}

function makeProp(p) {
  const g = new THREE.Group();
  const put = (m, outline = true) => { m.castShadow = true; g.add(m); if (outline) ink(m); return m; };
  if (p.type === 'cup') {
    const c = put(new THREE.Mesh(new THREE.CylinderGeometry(.065, .052, .14, 20, 1, true), cel('#e9e3d6', { extra: { side: THREE.DoubleSide } }))); c.position.y = .07;
    const fill = put(new THREE.Mesh(new THREE.CircleGeometry(.062, 20), cel('#3d1c08')), false); fill.rotation.x = -Math.PI / 2; fill.position.y = .12;
    const h = put(new THREE.Mesh(new THREE.TorusGeometry(.035, .01, 6, 14, Math.PI), cel('#e9e3d6'))); h.position.set(.07, .07, 0); h.rotation.z = -Math.PI / 2;
  }
  if (p.type === 'bottle') {
    const b = put(new THREE.Mesh(new THREE.CylinderGeometry(.068, .068, .24, 20), cel('#3f9a5c'))); b.position.y = .12;
    const sh = put(new THREE.Mesh(new THREE.CylinderGeometry(.03, .068, .07, 20), cel('#3f9a5c')), false); sh.position.y = .275;
    const n = put(new THREE.Mesh(new THREE.CylinderGeometry(.027, .027, .08, 14), cel('#3f9a5c'))); n.position.y = .35;
    const lbl = put(new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .1, 20, 1, true), cel('#efe4c4')), false); lbl.position.y = .11;
    if (p.cap !== false) { const c = put(new THREE.Mesh(new THREE.CylinderGeometry(.034, .034, .03, 14), cel('#d9d2c2'))); c.position.y = .4; }
    g.position.y = -.02;
  }
  if (p.type === 'brush') {
    const h = put(new THREE.Mesh(new THREE.CylinderGeometry(.016, .02, .34, 8), cel('#9a6a3a'))); h.position.y = .17;
    const fer = put(new THREE.Mesh(new THREE.BoxGeometry(.2, .06, .05), cel('#b8b8bc'))); fer.position.y = .36;
    const br = put(new THREE.Mesh(new THREE.BoxGeometry(.2, .12, .045), cel('#d8c49a'))); br.position.y = .45;
    const tip = put(new THREE.Mesh(new THREE.BoxGeometry(.205, .06, .05), cel('#3b1d0a')), false); tip.position.y = .5;
  }
  if (p.type === 'gavel') {
    const h = put(new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .32, 8), cel('#8a5a32'))); h.position.y = .16;
    const hd = put(new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .22, 16), cel('#7a4a28'))); hd.rotation.z = Math.PI / 2; hd.position.y = .34;
  }
  return g;
}
