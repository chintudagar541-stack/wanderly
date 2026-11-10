// Shared helpers: deterministic random, easing, interpolation.
// Everything the renderer draws must be a pure function of time t, so any
// frame can be rendered in any order (needed for chunked cloud rendering).

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// hash of an integer -> [0,1)
export function hash1(n) {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, u) => a + (b - a) * u;
export const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };

// piecewise-linear / smooth keyframe sampler: keys = [{t, v}, ...]
export function sampleKeys(keys, t, smoothStep = true) {
  if (!keys || !keys.length) return undefined;
  if (t <= keys[0].t) return keys[0].v;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) {
      const u = (t - a.t) / Math.max(1e-6, b.t - a.t);
      return lerp(a.v, b.v, smoothStep ? smooth(u) : u);
    }
  }
  return keys[keys.length - 1].v;
}

export async function loadText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`cannot load ${url}: HTTP ${r.status}`);
  return r.text();
}

export async function loadJSON(url) {
  return JSON.parse(await loadText(url));
}

export function svgEl(tag, attrs = {}) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}
