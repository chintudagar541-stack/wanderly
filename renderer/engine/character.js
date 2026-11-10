// Layered SVG character rig.
//
// Rig contract (see characters/README.md):
//   #root                      whole figure, data-pivot = feet centre
//   #torso                     upper body, data-pivot = hips (lean / breathe)
//   #arm-L > #forearm-L > #hand-L   nested limbs, data-pivot on each (shoulder, elbow, wrist)
//   #arm-R > #forearm-R > #hand-R
//   #hand-* children [data-state="open|relaxed|fist|cup|point"]
//   #head                      data-pivot = base of the neck (tilt / nod)
//   #eye-L, #eye-R             children [data-state="open|half|closed|wide|narrow|happy"]
//   .pupil                     inside open/wide/narrow states; moved for eye direction
//   #brow-L, #brow-R           moved/rotated per expression
//   #mouth                     children [data-state="rest|a|e|o|m|smile|smirk|frown|shock|grit"]
//   [data-turn="k"]            any head part that slides by k px per unit of head turn
//   [data-sway="k"]            hair/coat parts that lag behind movement (follow-through)
import { hash1, clamp, lerp, smooth } from './util.js';

const MOUTH_FOR = (ch) => (/[aä]/.test(ch) ? 'a' : /[eiy]/.test(ch) ? 'e' : /[ouw]/.test(ch) ? 'o' : 'e');

export class Character {
  constructor(id, def, svgText, host) {
    this.id = id; this.def = def;
    this.el = document.createElement('div');
    this.el.className = 'character';
    this.el.innerHTML = svgText;
    this.svg = this.el.querySelector('svg');
    this.svg.removeAttribute('width'); this.svg.removeAttribute('height');
    // part ids -> data-part (several copies of a character can share a stage); other ids (clipPaths,
    // gradients) get a per-instance prefix and every url(#...) reference is rewritten to match
    const pre = 'c' + (Character.count = (Character.count || 0) + 1) + '_';
    const ren = {};
    for (const n of this.svg.querySelectorAll('[id]')) {
      if (n.tagName === 'g') { n.dataset.part = n.id; n.removeAttribute('id'); }
      else { ren[n.id] = pre + n.id; n.id = pre + n.id; }
    }
    if (Object.keys(ren).length) for (const n of this.svg.querySelectorAll('[clip-path],[fill],[mask],[filter],[stroke]')) {
      for (const a of ['clip-path', 'fill', 'mask', 'filter', 'stroke']) {
        const v = n.getAttribute(a); if (!v || !v.startsWith('url(#')) continue;
        const id = v.slice(5, -1); if (ren[id]) n.setAttribute(a, `url(#${ren[id]})`);
      }
    }
    host.appendChild(this.el);
    const vb = this.svg.viewBox.baseVal; this.vb = vb;
    this.parts = {};
    for (const n of this.svg.querySelectorAll('[data-part]')) this.parts[n.dataset.part] = n;
    this.pivot = (name) => {
      const p = this.parts[name]; if (!p || !p.dataset.pivot) return [0, 0];
      return p.dataset.pivot.split(/[ ,]+/).map(Number);
    };
    this.states = {};
    for (const key of ['eye-L', 'eye-R', 'mouth', 'hand-L', 'hand-R']) {
      const p = this.parts[key]; if (!p) continue;
      this.states[key] = [...p.querySelectorAll(':scope > [data-state]')];
    }
    this.turners = [...this.svg.querySelectorAll('[data-turn]')].map((n) => [n, parseFloat(n.dataset.turn)]);
    this.swayers = [...this.svg.querySelectorAll('[data-sway]')].map((n) => [n, parseFloat(n.dataset.sway), (n.dataset.swayPivot || '0 0').split(' ').map(Number)]);
    // animatable state (GSAP tweens these numbers / strings)
    const rest = (def.poses && def.poses.rest) || {};
    this.state = {
      x: 960, y: 1000, scale: 1, flip: 1, opacity: 1,
      lean: 0, headTilt: 0, headNod: 0, headTurn: 0, lookX: 0, lookY: 0,
      expression: 'neutral', exprBlend: 1, prevExpression: 'neutral',
      eyesOverride: '', mouthOverride: '', handL: rest.handL || 'relaxed', handR: rest.handR || 'relaxed',
      armL_sh: 0, armL_el: 0, armL_wr: 0, armR_sh: 0, armR_el: 0, armR_wr: 0,
      ...(rest.arms || {}),
      blinkEnabled: 1, breathe: 1, vx: 0,
    };
    this.lines = [];             // dialogue lines -> mouth animation
    this.exprKeys = [];          // [{t, name, dur}] expression changes (blend brows over dur)
    this.blinkSeed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0) * 7919;
  }

  // ---------------------------------------------------------- dialogue -> visemes
  addLine(t0, t1, text) {
    const words = text.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
    const sylls = [];
    for (const w of words) {
      const groups = w.match(/[aeiouy]+/g) || ['e'];
      for (const g of groups) sylls.push(MOUTH_FOR(g[0]));
      sylls.push('m');
    }
    this.lines.push({ t0, t1, sylls });
  }

  mouthAt(t) {
    for (const L of this.lines) {
      if (t < L.t0 || t > L.t1) continue;
      const u = (t - L.t0) / (L.t1 - L.t0);
      const k = Math.min(L.sylls.length - 1, Math.floor(u * L.sylls.length));
      // close briefly between syllables so the flap reads as speech, not a shiver
      const frac = (u * L.sylls.length) % 1;
      if (frac > 0.78 && L.sylls[k] !== 'm') return 'm';
      return L.sylls[k];
    }
    return null;
  }

  // ---------------------------------------------------------- blink schedule (deterministic)
  blinkAt(t) {
    // blinks every 2.2 - 5.5 s, 0.16 s long; occasionally a double blink
    let s = 0.6 + hash1(this.blinkSeed) * 2;
    for (let i = 0; s < t + 1 && i < 4000; i++) {
      const d = t - s;
      if (d >= 0 && d < 0.16) return d < 0.04 || d > 0.12 ? 'half' : 'closed';
      if (hash1(this.blinkSeed + i * 31) < 0.12) { const d2 = t - (s + 0.24); if (d2 >= 0 && d2 < 0.14) return d2 < 0.035 || d2 > 0.1 ? 'half' : 'closed'; }
      s += 2.2 + hash1(this.blinkSeed + i * 17 + 3) * 3.3;
    }
    return null;
  }

  // ---------------------------------------------------------- apply state to the SVG
  showState(key, name) {
    const list = this.states[key]; if (!list || !list.length) return;
    let found = false;
    for (const n of list) { const on = n.dataset.state === name; n.style.display = on ? '' : 'none'; found = found || on; }
    if (!found) for (const n of list) n.style.display = n === list[0] ? '' : 'none';
  }

  rot(part, deg, extra = '') {
    const p = this.parts[part]; if (!p) return;
    const [px, py] = this.pivot(part);
    p.setAttribute('transform', `${extra} rotate(${deg.toFixed(3)} ${px} ${py})`);
  }

  expr(name) { return (this.def.expressions && this.def.expressions[name]) || (this.def.expressions || {}).neutral || {}; }

  apply(t) {
    const s = this.state, d = this.def;
    this.el.style.opacity = s.opacity;
    this.el.style.display = s.opacity <= 0.001 ? 'none' : '';
    // placement: the SVG is drawn with its feet pivot at (x, y) on the 1920x1080 stage
    const [fx, fy] = this.pivot('root');
    const sc = s.scale;
    this.el.style.transform = `translate(${s.x - fx * sc * s.flip}px, ${s.y - fy * sc}px) scale(${sc * s.flip}, ${sc})`;
    this.el.style.width = this.vb.width + 'px'; this.el.style.height = this.vb.height + 'px';

    // body: lean + breathing
    const br = s.breathe ? Math.sin(t * 2 * Math.PI / 3.6) : 0;
    const [hx, hy] = this.pivot('torso');
    const torso = this.parts['torso'];
    if (torso) torso.setAttribute('transform', `rotate(${s.lean.toFixed(3)} ${hx} ${hy}) translate(${hx} ${hy}) scale(1 ${1 + br * 0.006}) translate(${-hx} ${-hy})`);

    // arms (nested groups: rotations compose naturally)
    for (const side of ['L', 'R']) {
      this.rot(`arm-${side}`, s[`arm${side}_sh`] + (side === 'L' ? -1 : 1) * br * 0.6);
      this.rot(`forearm-${side}`, s[`arm${side}_el`]);
      this.rot(`hand-${side}`, s[`arm${side}_wr`]);
      this.showState(`hand-${side}`, s[`hand${side}`]);
    }

    // head: tilt + nod, features slide with turn
    const [nx, ny] = this.pivot('head');
    const head = this.parts['head'];
    if (head) head.setAttribute('transform', `rotate(${(s.headTilt + br * 0.25).toFixed(3)} ${nx} ${ny}) translate(0 ${s.headNod.toFixed(2)})`);
    for (const [n, k] of this.turners) n.setAttribute('transform', `translate(${(s.headTurn * k).toFixed(2)} 0)`);
    // follow-through: hair/coat lag behind horizontal velocity and head motion
    for (const [n, k, [px, py]] of this.swayers) n.setAttribute('transform', `rotate(${clamp(-s.vx * k - s.headTurn * k * 0.08, -12, 12).toFixed(3)} ${px} ${py})`);

    // expression (eyes, brows, mouth)
    let cur = s.expression, prev = s.expression, u = 1;
    for (let i = 0; i < this.exprKeys.length; i++) {
      const k = this.exprKeys[i]; if (t < k.t) break;
      prev = cur; cur = k.name; u = smooth((t - k.t) / Math.max(1e-3, k.dur));
    }
    const E = this.expr(cur), P = this.expr(prev);
    let eyes = s.eyesOverride || E.eyes || 'open';
    const bl = s.blinkEnabled ? this.blinkAt(t) : null;
    if (bl && ['open', 'wide', 'narrow'].includes(eyes)) eyes = bl;
    this.showState('eye-L', E.eyeL && !bl ? E.eyeL : eyes);
    this.showState('eye-R', E.eyeR && !bl ? E.eyeR : eyes);
    for (const side of ['L', 'R']) {
      const b = this.parts[`brow-${side}`]; if (!b) continue;
      const e = (E.brows && E.brows[side]) || [0, 0, 0], p = (P.brows && P.brows[side]) || [0, 0, 0];
      const [bx, by, br_] = [0, 1, 2].map((i) => lerp(p[i], e[i], u));
      const [cx, cy] = (b.dataset.pivot || '0 0').split(' ').map(Number);
      b.setAttribute('transform', `translate(${bx} ${by}) rotate(${br_} ${cx} ${cy})`);
    }
    for (const pu of this.svg.querySelectorAll('.pupil')) pu.setAttribute('transform', `translate(${(s.lookX * 6 + (E.look ? E.look[0] : 0)).toFixed(2)} ${(s.lookY * 4 + (E.look ? E.look[1] : 0)).toFixed(2)})`);
    const talk = this.mouthAt(t);
    let mouth = s.mouthOverride || (talk ? (E.talk && E.talk[talk]) || talk : E.mouth || 'rest');
    this.showState('mouth', mouth);
    // cheek blush / sweat / shadow overlays toggled by expression
    for (const n of this.svg.querySelectorAll('[data-fx]')) n.style.display = (E.fx || []).includes(n.dataset.fx) ? '' : 'none';
  }
}
