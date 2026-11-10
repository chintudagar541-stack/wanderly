// THE PERFECT ALIBI - 2D anime engine.
// Loads a scene (JSON), builds layered shots, and exposes window.ALIBI.seek(t)
// so the renderer can capture any frame deterministically.
import { gsap } from '/node_modules/gsap/index.js';
import { Character } from './character.js';
import { Rain, Grain, lightningAt, motionLines } from './fx.js';
import { loadJSON, loadText, clamp, smooth } from './util.js';

const W = 1920, H = 1080;
const params = new URLSearchParams(location.search);
const ROOT = '/';

const characterDefs = {};
async function characterDef(ref) {
  if (!characterDefs[ref]) {
    const def = await loadJSON(`${ROOT}characters/${ref}/character.json`);
    def._svg = await loadText(`${ROOT}characters/${ref}/${def.rig || 'rig.svg'}`);
    characterDefs[ref] = def;
  }
  return characterDefs[ref];
}

class Shot {
  constructor(spec, stage) {
    this.spec = spec; this.stage = stage;
    this.start = spec.start; this.end = spec.end;
    this.el = document.createElement('div'); this.el.className = 'shot';
    this.world = document.createElement('div'); this.world.className = 'world';
    this.el.appendChild(this.world);
    stage.shotsEl.appendChild(this.el);
    this.layers = []; this.chars = {}; this.cam = { x: 0, y: 0, zoom: 1, rot: 0 };
    this.tl = gsap.timeline({ paused: true });
  }

  async build() {
    const S = this.spec;
    // background / foreground layers
    for (const L of S.layers || []) {
      const el = document.createElement('div'); el.className = 'layer';
      if (L.src) {
        if (L.src.endsWith('.svg')) { el.innerHTML = await loadText(ROOT + L.src); const sv = el.querySelector('svg'); sv.setAttribute('width', '100%'); sv.setAttribute('height', '100%'); sv.setAttribute('preserveAspectRatio', L.fit || 'xMidYMid slice'); }
        else { const im = document.createElement('img'); im.src = ROOT + L.src; el.appendChild(im); }
      }
      if (L.color) el.style.background = L.color;
      if (L.css) Object.assign(el.style, L.css);
      if (L.blend) el.style.mixBlendMode = L.blend;
      el.style.zIndex = L.z ?? Math.round((L.depth ?? 0) * 100);
      const st = { x: L.x || 0, y: L.y || 0, scale: L.scale || 1, opacity: L.opacity ?? 1, depth: L.depth ?? 0, w: L.w || W * 1.25, h: L.h || H * 1.25 };
      el.style.width = st.w + 'px'; el.style.height = st.h + 'px';
      this.world.appendChild(el); this.layers.push({ el, st, spec: L });
      for (const a of L.anim || []) this.tl.to(st, { ...a.to, duration: a.dur ?? 1, ease: a.ease || 'sine.inOut' }, a.t - this.start);
    }
    // characters
    for (const C of S.characters || []) {
      const def = await characterDef(C.ref);
      const host = document.createElement('div'); host.className = 'charhost';
      host.style.zIndex = C.z ?? Math.round((C.depth ?? 1) * 100) + 1;
      this.world.appendChild(host);
      const ch = new Character(C.as || C.ref, def, def._svg, host);
      Object.assign(ch.state, { x: C.x ?? 960, y: C.y ?? 1000, scale: C.scale ?? 1, flip: C.flip ? -1 : 1, opacity: C.opacity ?? 1 });
      if (C.expression) ch.state.expression = ch.state.prevExpression = C.expression;
      if (C.pose) this.applyPose(ch, C.pose, 0, 0);
      for (const k of ['headTurn', 'headTilt', 'lookX', 'lookY', 'lean']) if (C[k] !== undefined) ch.state[k] = C[k];
      ch.depth = C.depth ?? 1; ch.host = host;
      this.chars[C.as || C.ref] = ch;
    }
    // camera
    const keys = S.camera || [];
    if (keys.length) Object.assign(this.cam, { x: keys[0].x ?? 0, y: keys[0].y ?? 0, zoom: keys[0].zoom ?? 1, rot: keys[0].rot ?? 0 });
    for (const k of keys.slice(1)) {
      const to = {}; for (const p of ['x', 'y', 'zoom', 'rot']) if (k[p] !== undefined) to[p] = k[p];
      this.tl.to(this.cam, { ...to, duration: k.dur ?? 1, ease: k.ease || 'power2.inOut' }, (k.t ?? this.start) - this.start);
    }
    // actions
    for (const A of S.actions || []) this.action(A);
    // dialogue -> mouth flaps (+ subtitles collected by the stage)
    for (const D of S.dialogue || []) {
      const ch = this.chars[D.who]; if (ch) ch.addLine(D.t0, D.t1, D.text);
      this.stage.subs.push(D);
    }
    this.tl.set({}, {}, this.end - this.start);   // make the timeline span the shot
  }

  applyPose(ch, name, at, dur, ease = 'back.out(1.3)') {
    const P = (ch.def.poses || {})[name]; if (!P) { console.warn('unknown pose', name); return; }
    const to = { ...(P.arms || {}) };
    if (P.lean !== undefined) to.lean = P.lean;
    if (dur <= 0) { Object.assign(ch.state, to); if (P.handL) ch.state.handL = P.handL; if (P.handR) ch.state.handR = P.handR; return; }
    this.tl.to(ch.state, { ...to, duration: dur, ease }, at);
    // hand shapes switch a third of the way in (reads as anticipation -> action)
    const hs = {}; if (P.handL) hs.handL = P.handL; if (P.handR) hs.handR = P.handR;
    if (Object.keys(hs).length) this.tl.set(ch.state, hs, at + dur * 0.33);
  }

  action(A) {
    const ch = this.chars[A.who]; const at = A.t - this.start; const dur = A.dur ?? 0.4;
    if (!ch && A.do !== 'camera') { console.warn('action for unknown character', A.who); return; }
    const s = ch.state;
    switch (A.do) {
      case 'expression': ch.exprKeys.push({ t: A.t, name: A.value, dur: A.dur ?? 0.18 }); ch.exprKeys.sort((a, b) => a.t - b.t); break;
      case 'pose': this.applyPose(ch, A.value, at, dur, A.ease); break;
      case 'move': {
        const to = {}; for (const p of ['x', 'y', 'scale']) if (A[p] !== undefined) to[p] = A[p];
        // walking: vertical bob + body velocity for follow-through
        this.tl.to(s, { ...to, duration: dur, ease: A.ease || 'sine.inOut' }, at);
        if (A.x !== undefined) { this.tl.to(s, { vx: Math.sign(A.x - (A.fromX ?? s.x)) * 1.5, duration: 0.25 }, at); this.tl.to(s, { vx: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' }, at + dur - 0.1); }
        break;
      }
      case 'turn': this.tl.to(s, { headTurn: A.value, duration: dur, ease: A.ease || 'power3.inOut' }, at); break;
      case 'tilt': this.tl.to(s, { headTilt: A.value, duration: dur, ease: A.ease || 'power2.inOut' }, at); break;
      case 'nod':
        this.tl.to(s, { headNod: A.value ?? 6, duration: dur * 0.4, ease: 'power2.in' }, at);
        this.tl.to(s, { headNod: 0, duration: dur * 0.6, ease: 'back.out(2)' }, at + dur * 0.4);
        break;
      case 'look': this.tl.to(s, { lookX: A.x ?? 0, lookY: A.y ?? 0, duration: dur, ease: 'power2.out' }, at); break;
      case 'lean': this.tl.to(s, { lean: A.value, duration: dur, ease: A.ease || 'power2.inOut' }, at); break;
      case 'fade': this.tl.to(s, { opacity: A.value, duration: dur }, at); break;
      case 'eyes': this.tl.set(s, { eyesOverride: A.value || '' }, at); break;
      case 'mouth': this.tl.set(s, { mouthOverride: A.value || '' }, at); break;
      case 'set': this.tl.set(s, A.values, at); break;
      default: console.warn('unknown action', A.do);
    }
  }

  // camera -> per-layer transforms (parallax by depth)
  applyCamera(shake) {
    const { x, y, zoom, rot } = this.cam;
    for (const { el, st } of this.layers) {
      const d = st.depth, z = 1 + (zoom - 1) * d;
      const px = -x * d + shake[0] * d, py = -y * d + shake[1] * d;
      el.style.opacity = st.opacity;
      el.style.transform = `translate(${W / 2}px, ${H / 2}px) rotate(${rot * d}deg) scale(${z * st.scale}) translate(${px + st.x - st.w / 2}px, ${py + st.y - st.h / 2}px)`;
    }
    for (const ch of Object.values(this.chars)) {
      const d = ch.depth, z = 1 + (zoom - 1) * d;
      ch.host.style.transform = `translate(${W / 2}px, ${H / 2}px) rotate(${rot * d}deg) scale(${z}) translate(${-x * d + shake[0] * d - W / 2}px, ${-y * d + shake[1] * d - H / 2}px)`;
    }
  }

  seek(t) {
    this.tl.seek(clamp(t - this.start, 0, this.end - this.start), false);
    const S = this.spec, sh = [0, 0];
    for (const k of S.shake || []) {
      if (t < k.t0 || t > k.t1) continue;
      const u = 1 - (t - k.t0) / (k.t1 - k.t0), a = (k.amp ?? 14) * u, f = Math.floor(t * 24);
      sh[0] += (Math.sin(f * 12.9898) * 43758.5453 % 1) * a; sh[1] += (Math.sin(f * 78.233) * 12543.123 % 1) * a;
    }
    this.applyCamera(sh);
    for (const ch of Object.values(this.chars)) ch.apply(t);
  }
}

class Stage {
  constructor() {
    this.root = document.getElementById('stage');
    this.shotsEl = document.getElementById('shots');
    this.rain = new Rain(document.getElementById('rain'));
    this.grain = new Grain(document.getElementById('grain'));
    this.lines = document.getElementById('lines');
    this.flash = document.getElementById('flash');
    this.black = document.getElementById('black');
    this.light = document.getElementById('light');
    this.vignette = document.getElementById('vignette');
    this.subEl = document.getElementById('subtitle');
    this.shots = []; this.subs = [];
  }

  async load(url) {
    this.scene = await loadJSON(url);
    this.fps = this.scene.fps || 24;
    for (const sp of this.scene.shots) { const s = new Shot(sp, this); await s.build(); this.shots.push(s); }
    this.duration = this.scene.duration ?? Math.max(...this.shots.map((s) => s.end));
    this.showSubs = params.get('subs') !== '0' && this.scene.subtitles !== false;
  }

  active(t) {
    // the current shot plus the previous one while a dissolve is running
    const out = [];
    this.shots.forEach((s, i) => {
      const tr = s.spec.transition || {}; const next = this.shots[i + 1];
      const nextDis = next && (next.spec.transition || {}).type === 'dissolve' ? (next.spec.transition.dur ?? 0.5) : 0;
      if (t >= s.start && (t < s.end || (nextDis && t < s.end + nextDis))) out.push(s);
    });
    return out;
  }

  seek(t) {
    const frame = Math.round(t * this.fps);
    const act = this.active(t);
    for (const s of this.shots) s.el.style.display = act.includes(s) ? '' : 'none';
    let black = 0, flash = 0, top = act[act.length - 1];
    for (const s of act) {
      s.seek(t);
      const tr = s.spec.transition || { type: 'cut' }, d = tr.dur ?? 0.5, u = (t - s.start) / d;
      s.el.style.opacity = 1; s.el.style.clipPath = '';
      if (tr.type === 'dissolve' && u < 1 && act.length > 1) s.el.style.opacity = smooth(u);
      if (tr.type === 'fade' && u < 1) black = Math.max(black, 1 - smooth(u));
      if (tr.type === 'flash' && u < 1) flash = Math.max(flash, 1 - smooth(u));
      if (tr.type === 'wipe' && u < 1) s.el.style.clipPath = `inset(0 ${(1 - smooth(u)) * 100}% 0 0)`;
      const out = s.spec.out || {};
      const v = (s.end - t) / (out.dur ?? 0.5);
      if (out.type === 'fade' && v < 1) black = Math.max(black, 1 - smooth(v));
      if (out.type === 'flash' && v < 1) flash = Math.max(flash, 1 - smooth(v));
    }
    // shot-level effects from the top-most shot
    const fx = (top && top.spec.fx) || {};
    this.rain.o = Object.assign(this.rain.o, { density: 0 }, fx.rain || {});
    this.rain.draw(t, top ? top.cam.x : 0, top ? top.cam.y : 0);
    const L = lightningAt(t, fx.lightning || []);
    for (const f of fx.flashes || []) { const d = t - f.t; if (d >= 0 && d < (f.dur ?? 0.2)) flash = Math.max(flash, 1 - d / (f.dur ?? 0.2)); }
    this.flash.style.opacity = clamp(flash + L * 0.55, 0, 1);
    this.flash.style.background = L > flash ? '#cfe0ff' : '#ffffff';
    this.black.style.opacity = black;
    this.vignette.style.opacity = fx.vignette ?? 0.55;
    this.light.style.background = fx.tint || 'transparent';
    this.light.style.mixBlendMode = fx.tintBlend || 'multiply';
    this.grain.amount = fx.grain ?? 0.05; this.grain.draw(frame);
    motionLines(this.lines, t, fx.motionLines);
    // impact frame: brief inverted, high-contrast flash on a beat
    let impact = false; for (const k of fx.impact || []) if (t >= k && t < k + 2 / this.fps) impact = true;
    this.shotsEl.style.filter = impact ? 'invert(1) contrast(2.2) grayscale(1)' : (L > 0 ? `brightness(${1 + L * 0.6})` : '');
    // subtitles
    const sub = this.showSubs ? this.subs.find((d) => t >= d.t0 && t <= d.t1 && d.sub !== false) : null;
    this.subEl.textContent = sub ? sub.text : '';
    this.subEl.style.display = sub ? '' : 'none';
  }
}

window.ALIBI = { ready: false };
(async () => {
  try {
    const stage = new Stage();
    await stage.load(params.get('scene'));
    window.ALIBI = { ready: true, duration: stage.duration, fps: stage.fps, scene: stage.scene, seek: (t) => stage.seek(t), errors: [] };
    stage.seek(parseFloat(params.get('t') || '0'));
  } catch (e) {
    console.error(e); window.ALIBI = { ready: false, error: String(e && e.stack || e) };
  }
})();
