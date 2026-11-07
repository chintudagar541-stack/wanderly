// Lyric video renderer. Stateless per frame: window.renderAt(t) -> JPEG data URL.
// Part A: a streaming-app style lyrics card tilting in 3D (karaoke word highlight).
// Part B: the singer as glowing red particles with big pop lyrics.
import * as THREE from 'three';

const CFG = await (await fetch('/__cfg.json')).json();
const W = CFG.width, H = CFG.height, T = CFG.timing, ENV = T.env, DUR = T.segment.end - T.segment.start;
const WORDS = T.lines.flatMap((l, li) => l.words.map((w, wi) => ({ ...w, li, wi })));
const SWITCH = CFG.switchAt ?? (T.sections[1]?.start ?? DUR * 0.5) - 0.35;
const RED = CFG.color || '#e3242b';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
renderer.setSize(W, H); renderer.setPixelRatio(1); renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 100);

const out = document.createElement('canvas'); out.width = W; out.height = H; const o = out.getContext('2d');
const FONT = '"Inter Display","Inter","DejaVu Sans",sans-serif';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = u => 1 - Math.pow(1 - clamp(u), 3);
const env = t => ENV[Math.min(ENV.length - 1, Math.max(0, Math.floor(t * 30)))] || 0;
const lineAt = t => { let li = 0; for (const l of T.lines) { if (l.words[0].start - 0.25 <= t) li = T.lines.indexOf(l); } return li; };

// ---------------- Part A: lyrics card ----------------
const CW = 1400, CH = 900;
const cardCanvas = document.createElement('canvas'); cardCanvas.width = CW; cardCanvas.height = CH;
const cc = cardCanvas.getContext('2d');
const cardTex = new THREE.CanvasTexture(cardCanvas); cardTex.colorSpace = THREE.SRGBColorSpace; cardTex.anisotropy = 8;
function roundRectShape(w, h, r) {
  const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s;
}
const cardGeo = new THREE.ShapeGeometry(roundRectShape(7, 4.5, 0.28), 8);
{ const p = cardGeo.attributes.position, uv = cardGeo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 7 + 0.5, p.getY(i) / 4.5 + 0.5); }
const card = new THREE.Mesh(cardGeo, new THREE.MeshBasicMaterial({ map: cardTex, transparent: true }));
const shadow = new THREE.Mesh(new THREE.ShapeGeometry(roundRectShape(7.2, 4.7, 0.3)), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 }));
shadow.position.set(0.12, -0.18, -0.08);
const cardGroup = new THREE.Group(); cardGroup.add(shadow, card); scene.add(cardGroup);

function drawCard(t) {
  const g = cc.createLinearGradient(0, 0, CW, CH); g.addColorStop(0, '#c4161c'); g.addColorStop(1, '#7a0d12');
  cc.fillStyle = g; cc.fillRect(0, 0, CW, CH);
  cc.fillStyle = 'rgba(255,255,255,.9)'; cc.font = `700 34px ${FONT}`; cc.textBaseline = 'alphabetic';
  cc.fillText('Lyrics', 70, 92);
  cc.fillStyle = 'rgba(0,0,0,.35)'; cc.font = `600 26px ${FONT}`; cc.fillText(CFG.credit || '', 70, CH - 50);
  // scroll: current line sits at row 1; smooth between lines
  const li = lineAt(t), next = T.lines[li + 1];
  let f = li;
  if (next) { const a = next.words[0].start - 0.35; f = li + ease((t - a) / 0.35) * (t > a ? 1 : 0); }
  const LH = 112, top = 230;
  cc.save(); cc.beginPath(); cc.rect(0, 120, CW, CH - 210); cc.clip();
  cc.font = `800 66px ${FONT}`;
  for (let i = Math.max(0, li - 2); i < Math.min(T.lines.length, li + 6); i++) {
    const y = top + (i - f) * LH; let x = 70;
    for (const w of T.lines[i].words) {
      const sung = t >= w.start, cur = t >= w.start && t < w.end + 0.15;
      cc.fillStyle = i < li ? 'rgba(255,255,255,.62)' : sung ? '#fff' : 'rgba(0,0,0,.62)';
      if (cur && i === li) { cc.shadowColor = 'rgba(255,255,255,.8)'; cc.shadowBlur = 18; } else cc.shadowBlur = 0;
      const tw = cc.measureText(w.w + ' ').width;
      if (x + tw > CW - 60) break;
      cc.fillText(w.w, x, y); x += tw;
    }
  }
  cc.restore(); cc.shadowBlur = 0;
  cardTex.needsUpdate = true;
}

function bgGlow(t, strength) {
  o.fillStyle = '#070304'; o.fillRect(0, 0, W, H);
  for (let i = 0; i < 3; i++) {
    const x = W * (0.3 + 0.4 * Math.sin(t * 0.21 + i * 2.1) * 0.5 + i * 0.2), y = H * (0.5 + 0.3 * Math.cos(t * 0.17 + i));
    const g = o.createRadialGradient(x, y, 0, x, y, W * 0.45);
    g.addColorStop(0, `rgba(200,20,30,${0.28 * strength})`); g.addColorStop(1, 'rgba(0,0,0,0)'); o.fillStyle = g; o.fillRect(0, 0, W, H);
  }
}

// ---------------- Part B: singer particles ----------------
async function singerPoints(n) {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  if (CFG.singer) {
    const img = new Image(); img.src = '/__singer'; await img.decode();
    const sc = Math.min(S / img.width, S / img.height); x.drawImage(img, (S - img.width * sc) / 2, (S - img.height * sc) / 2, img.width * sc, img.height * sc);
  } else {
    // generic original singer silhouette: head, hair, shoulders, hand holding a mic
    x.fillStyle = '#fff';
    x.beginPath(); x.ellipse(256, 170, 62, 76, 0, 0, 7); x.fill();
    x.globalAlpha = 0.75; x.beginPath(); x.ellipse(250, 130, 72, 58, -0.15, Math.PI, 2 * Math.PI); x.fill(); x.globalAlpha = 1;
    x.beginPath(); x.moveTo(226, 230); x.lineTo(286, 230); x.lineTo(292, 270); x.lineTo(220, 270); x.fill();
    x.beginPath(); x.moveTo(80, 512); x.quadraticCurveTo(90, 300, 200, 270); x.lineTo(312, 270); x.quadraticCurveTo(430, 300, 440, 512); x.fill();
    x.globalAlpha = 0.85; x.lineCap = 'round'; x.strokeStyle = '#fff'; x.lineWidth = 46; x.beginPath(); x.moveTo(380, 420); x.quadraticCurveTo(330, 330, 300, 250); x.stroke();
    x.globalAlpha = 1; x.save(); x.translate(292, 222); x.rotate(-0.5); x.fillRect(-11, -10, 22, 70); x.beginPath(); x.arc(0, -16, 22, 0, 7); x.fill(); x.restore();
  }
  const d = x.getImageData(0, 0, S, S).data, cand = [];
  for (let y = 0; y < S; y += 2) for (let xx = 0; xx < S; xx += 2) { const i = (y * S + xx) * 4; const v = (d[i] + d[i + 1] + d[i + 2]) / 765 * (d[i + 3] / 255); if (v > 0.12) cand.push([xx, y, v]); }
  let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pos = new Float32Array(n * 3), bri = new Float32Array(n), scat = new Float32Array(n * 3), rnd = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const [px, py, v] = cand[Math.floor(r() * cand.length)];
    pos.set([(px + r() * 2 - S / 2) / S * 4.4, -(py + r() * 2 - S / 2) / S * 4.4, (r() - 0.5) * 0.35], k * 3);
    bri[k] = 0.35 + v * 0.65; rnd[k] = r();
    const a = r() * Math.PI * 2, b = (r() - 0.5) * Math.PI, R = 6 + r() * 8;
    scat.set([Math.cos(a) * Math.cos(b) * R, Math.sin(b) * R, Math.sin(a) * Math.cos(b) * R - 4], k * 3);
  }
  return { pos, bri, scat, rnd };
}
const N = 16000, P = await singerPoints(N);
const pg = new THREE.BufferGeometry();
pg.setAttribute('position', new THREE.BufferAttribute(P.pos, 3));
pg.setAttribute('scat', new THREE.BufferAttribute(P.scat, 3));
pg.setAttribute('bri', new THREE.BufferAttribute(P.bri, 1));
pg.setAttribute('rnd', new THREE.BufferAttribute(P.rnd, 1));
const pmat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uT: { value: 0 }, uForm: { value: 0 }, uPulse: { value: 0 }, uColor: { value: new THREE.Color(RED) } },
  vertexShader: `uniform float uT,uForm,uPulse; attribute vec3 scat; attribute float bri,rnd; varying float vB;
    void main(){ vec3 p = mix(scat, position, uForm);
      p += 0.03*vec3(sin(uT*1.7+rnd*40.),cos(uT*1.3+rnd*30.),sin(uT*0.9+rnd*20.));
      p *= 1.0 + uPulse*0.035*(0.5+rnd);
      vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
      gl_PointSize = (2.2 + 2.6*bri + uPulse*2.0*rnd) * (6.0 / -mv.z); vB = bri; }`,
  fragmentShader: `uniform vec3 uColor; varying float vB;
    void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,0.,d);
      gl_FragColor = vec4(mix(uColor, vec3(1.,.75,.7), pow(a,6.)*.6)*(0.55+vB*.8), a*.85); }`,
});
const points = new THREE.Points(pg, pmat); points.frustumCulled = false; scene.add(points);

function popLyrics(t) {
  const li = lineAt(t), line = T.lines[li];
  let cur = null; for (const w of line.words) if (t >= w.start - 0.05) cur = w;
  const lineFade = clamp((line.words[line.words.length - 1].end + 0.5 - t) / 0.3) * clamp((t - line.words[0].start + 0.3) / 0.2);
  // small line context
  o.save(); o.globalAlpha = 0.8 * lineFade; o.font = `600 34px ${FONT}`; o.textAlign = 'center';
  const ctx = line.words.map(w => w.w).join(' '); o.fillStyle = 'rgba(255,255,255,.75)'; o.fillText(ctx, W / 2, H * 0.9); o.restore();
  if (!cur) return;
  const age = t - cur.start, pop = age < 0.09 ? 0.55 + age / 0.09 * 0.65 : age < 0.2 ? 1.2 - (age - 0.09) / 0.11 * 0.2 : 1.0;
  const size = Math.min(210, W * 1.4 / Math.max(3, cur.w.length));
  o.save(); o.translate(W / 2, H * 0.74); o.scale(pop, pop); o.rotate((cur.wi % 2 ? 1 : -1) * 0.035);
  o.font = `900 ${size}px ${FONT}`; o.textAlign = 'center'; o.textBaseline = 'middle';
  o.globalAlpha = lineFade; o.shadowColor = RED; o.shadowBlur = 40; o.lineWidth = 10; o.strokeStyle = '#2a0003';
  const txt = cur.w.toUpperCase(); o.strokeText(txt, 0, 0); o.fillStyle = '#fff'; o.fillText(txt, 0, 0); o.shadowBlur = 0; o.fillText(txt, 0, 0);
  o.restore();
}

// ---------------- frame ----------------
window.renderAt = (t) => {
  const e = env(t);
  if (t < SWITCH) {
    bgGlow(t, 0.9 + e * 0.4);
    drawCard(t);
    const intro = ease(t / 1.2), out = ease((t - (SWITCH - 0.6)) / 0.6);
    cardGroup.visible = true; points.visible = false;
    cardGroup.rotation.set(-0.16 + Math.sin(t * 0.35) * 0.07 - out * 0.5, (1 - intro) * -0.9 + Math.sin(t * 0.45) * 0.2 + out * 1.2, Math.sin(t * 0.25) * 0.03);
    cardGroup.position.set(0, 0.05 + (1 - intro) * -0.4, -out * 6);
    cardGroup.scale.setScalar(1 + e * 0.012);
    camera.position.set(0, 0, 11); camera.lookAt(0, 0, 0);
    renderer.setClearColor(0x000000, 0); renderer.setClearAlpha(0);
    renderer.render(scene, camera);
    o.drawImage(renderer.domElement, 0, 0);
    if (out > 0) { o.fillStyle = `rgba(227,36,43,${out * 0.7})`; o.fillRect(0, 0, W, H); }
  } else {
    const lt = t - SWITCH;
    o.fillStyle = '#030001'; o.fillRect(0, 0, W, H);
    const v = o.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, H * 0.8); v.addColorStop(0, `rgba(120,0,10,${0.35 + e * 0.25})`); v.addColorStop(1, 'rgba(0,0,0,0)'); o.fillStyle = v; o.fillRect(0, 0, W, H);
    cardGroup.visible = false; points.visible = true;
    pmat.uniforms.uT.value = t; pmat.uniforms.uForm.value = ease(lt / 1.6); pmat.uniforms.uPulse.value = e;
    camera.position.set(Math.sin(lt * 0.15) * 2.2, 0.3, 7.2 - Math.min(lt, 30) * 0.02); camera.lookAt(0, 0.2, 0);
    points.position.set(0, 0.35, 0);
    renderer.setClearColor(0x000000, 0); renderer.render(scene, camera);
    o.drawImage(renderer.domElement, 0, 0);
    if (lt < 0.35) { o.fillStyle = `rgba(227,36,43,${0.7 * (1 - lt / 0.35)})`; o.fillRect(0, 0, W, H); }
    popLyrics(t);
  }
  // global fade in/out
  const f = Math.min(clamp(t / 0.6), clamp((DUR - t) / 1.0));
  if (f < 1) { o.fillStyle = `rgba(0,0,0,${1 - f})`; o.fillRect(0, 0, W, H); }
  return out.toDataURL('image/jpeg', 0.92);
};
window.DUR = DUR; window.SWITCH = SWITCH;
window.ready = true;
