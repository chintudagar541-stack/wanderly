// Shared shot + camera types for reference-style shorts (see writer/REFERENCE_SPEC.md and STYLE.md "Camera").
// A short is a list of Shots. Each shot owns one continuous camera move (path of keys), its actors and its light.
// Transitions: a shot with `dis` dissolves in from the previous shot (the renderer draws both); without it, a cut.
import type { FrontOpts } from "../videos/dead/toon";

export type V3 = [number, number, number];

/** Canonical vertical-FOV presets (degrees) measured against the channel reference shorts.
 *  Keep perspective low by placing the camera near the subject/ground, not by widening the lens excessively.
 */
export const CAMERA_FOV = {
  establishing: 62,
  travel: 60,
  twoShot: 56,
  medium: 54,
  closeUp: 48,
  extremeCloseUp: 45,
} as const;
export type CameraPreset = keyof typeof CAMERA_FOV;
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
export type ActorDef = { who: string; pos: V3; opts: FrontOpts; tint?: V3; scale?: number; roll?: number; yaw?: number };
export type Shot<L extends string = string> = {
  id: number; a: number; b: number; cam: (t: number, u: number) => Cam; actors?: (t: number) => ActorDef[]; light: L; dof: number;
  /** what the lens focuses on: a point, a point over time, or "auto" (the default when the shot has actors): the face of
   *  the character nearest the frame centre, so characters are never left soft by a stale focus point */
  focus?: V3 | ((t: number) => V3) | "auto"; shadowR?: number;
  /** dissolve in from the previous shot over this many seconds (0 / undefined = cut) */
  dis?: number;
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** smootherstep 0..1 */
export const smooth = (x: number) => { const t = clamp01(x); return t * t * t * (t * (6 * t - 15) + 10); };
export const ease = { out: (x: number) => 1 - Math.pow(1 - clamp01(x), 3), in: (x: number) => Math.pow(clamp01(x), 3), inout: smooth };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** 0 before a, 1 after b, smooth in between */
export const ramp = (t: number, a: number, b: number) => smooth((t - a) / (b - a));

/** one continuous camera move through keys {t (s), pos, look, fov, ease?}. Between keys the motion is a cubic Hermite
 *  with Catmull-Rom tangents in time, so velocity stays continuous (no stop at a key). ease "out" on a key makes the
 *  segment that ENDS at it a punch that settles; "in" starts slow; "inout" both. */
export type Key = { t: number; pos: V3; look: V3; fov: number; roll?: number; ease?: "out" | "in" | "inout" };

/** Create a camera key using the shared preset table; callers can override FOV for a deliberate lens choice. */
export const cameraKey = (
  t: number,
  pos: V3,
  look: V3,
  preset: CameraPreset,
  options: Pick<Key, "roll" | "ease"> & { fov?: number } = {},
): Key => ({ t, pos, look, fov: options.fov ?? CAMERA_FOV[preset], ...(options.roll === undefined ? {} : { roll: options.roll }), ...(options.ease === undefined ? {} : { ease: options.ease }) });
export const path = (keys: Key[]) => (t: number): Cam => {
  const n = keys.length; if (t <= keys[0].t) return keys[0]; if (t >= keys[n - 1].t) return keys[n - 1];
  let i = 0; while (i < n - 2 && t > keys[i + 1].t) i++;
  const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(n - 1, i + 2)];
  const h = k2.t - k1.t; let s = (t - k1.t) / h;
  if (k2.ease) s = ease[k2.ease](s);
  const s2 = s * s, s3 = s2 * s, h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
  const tan = (a: number, b: number, ta: number, tb: number) => (tb > ta ? (b - a) / (tb - ta) : 0) * h;
  // an eased key stops the motion there (zero tangent) so the settle reads; otherwise Catmull-Rom keeps it flowing
  const hv = (f: (k: Key) => number) => {
    const m1 = k1.ease ? 0 : k1 === k0 ? tan(f(k1), f(k2), k1.t, k2.t) : tan(f(k0), f(k2), k0.t, k2.t);
    const m2 = k2.ease ? 0 : k3 === k2 ? tan(f(k1), f(k2), k1.t, k2.t) : tan(f(k1), f(k3), k1.t, k3.t);
    return h00 * f(k1) + h10 * m1 + h01 * f(k2) + h11 * m2;
  };
  const v3 = (g: (k: Key) => V3): V3 => [hv((k) => g(k)[0]), hv((k) => g(k)[1]), hv((k) => g(k)[2])];
  return { pos: v3((k) => k.pos), look: v3((k) => k.look), fov: hv((k) => k.fov), roll: hv((k) => k.roll ?? 0) };
};
/** orbit around a centre: angle a0 -> a1 (radians, 0 = +z), radius r0 -> r1, height y0 -> y1 over [ta, tb] */
export const orbit = (c: V3, o: { ta: number; tb: number; a0: number; a1: number; r0: number; r1?: number; y0: number; y1?: number; fov: number; fov1?: number; lookY?: number; e?: (x: number) => number }) => (t: number): Cam => {
  const u = (o.e ?? ((x: number) => 0.7 * x + 0.3 * smooth(x)))(clamp01((t - o.ta) / (o.tb - o.ta)));
  const a = lerp(o.a0, o.a1, u), r = lerp(o.r0, o.r1 ?? o.r0, u), y = lerp(o.y0, o.y1 ?? o.y0, u);
  return { pos: [c[0] + Math.sin(a) * r, y, c[2] + Math.cos(a) * r], look: [c[0], o.lookY ?? c[1], c[2]], fov: lerp(o.fov, o.fov1 ?? o.fov, u) };
};
/** a tiny handheld drift on top of a move (the references always breathe a little) */
export const drift = (cam: (t: number) => Cam, amp = 0.025) => (t: number): Cam => {
  const c = cam(t), n = (f: number, p: number) => Math.sin(t * f + p) * 0.6 + Math.sin(t * f * 2.3 + p * 1.7) * 0.4;
  return { ...c, look: [c.look[0] + n(0.9, 1) * amp, c.look[1] + n(0.7, 2) * amp, c.look[2] + n(0.8, 3) * amp] };
};
/** build a shot list with ids */
export const shotList = <L extends string>() => {
  const S: Shot<L>[] = [];
  const add = (s: Omit<Shot<L>, "id">) => { S.push({ id: S.length + 1, ...s }); };
  const at = (t: number) => S.find((s) => t >= s.a && t < s.b) ?? S[S.length - 1];
  return { S, add, at };
};
