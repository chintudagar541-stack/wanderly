// Look-development shots: an office interior (wide low corner, close-up, over-the-shoulder) and a dusk street.
import { LightName, RX, SX } from "./world";
import { FrontOpts, Outfit } from "../dead/toon";

export const FPS = 30;
export const DURATION = 9;
export const TOTAL = DURATION * FPS;
export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
export type ActorDef = { who: string; pos: V3; opts: FrontOpts; tint?: V3; scale?: number; roll?: number; yaw?: number };
export type Shot = { id: number; a: number; b: number; cam: (t: number, u: number) => Cam; actors?: (t: number) => ActorDef[]; light: LightName; dof: number; focus?: V3; shadowR?: number;
  /** dissolve in from the previous shot over this many seconds (0 / undefined = cut) */
  dis?: number };

const HEAD = { headStyle: "ref" } as Partial<Outfit>;
export const outfitOf = (who: string): Outfit => {
  const o: Record<string, Outfit> = {
    clerk: { jacket: "#2a8a8a", pants: "#2a3a5a", boots: "#6a4024", hat: "hair", hair: "#6a4024", skin: "#f7f2ea" },
    boss: { jacket: "#1f2a44", pants: "#1f2a44", boots: "#1a1a1a", hat: "hair", hair: "#9a9a9a", moustache: "#9a9a9a", buttons: "#e8b84a", skin: "#f7f2ea", build: "stout" },
    w1: { jacket: "#d1405a", pants: "#3a3a40", dress: "#d1405a", boots: "#1a1a1a", hat: "longHair", hairStyle: "bun", hair: "#3a2414", skin: "#f7f2ea" },
    m1: { jacket: "#6a4a8a", pants: "#3a3a40", boots: "#1a1a1a", hat: "fedora", cap: "#2a2a30", skin: "#f7f2ea" },
  };
  return { ...(o[who] ?? o.m1), ...HEAD } as Outfit;
};
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const t = clamp01(x); return t * t * t * (t * (6 * t - 15) + 10); };
const L = (a: number, b: number, t: number) => a + (b - a) * t;
const LV = (a: V3, b: V3, t: number): V3 => [L(a[0], b[0], t), L(a[1], b[1], t), L(a[2], b[2], t)];
const move = (A: Cam, B: Cam) => (_t: number, u: number): Cam => { const s = 0.75 * u + 0.25 * smooth(u); return { pos: LV(A.pos, B.pos, s), look: LV(A.look, B.look, s), fov: L(A.fov, B.fov, s) }; };
/** one continuous camera move through keys {t (s), pos, look, fov, ease?}. Between keys the motion is a cubic Hermite
 *  with Catmull-Rom tangents in time, so velocity stays continuous (no stop at a key). ease "out" on a key makes the
 *  segment that ENDS at it a punch that settles; "in" starts slow. */
export type Key = { t: number; pos: V3; look: V3; fov: number; ease?: "out" | "in" | "inout" };
export const path = (keys: Key[]) => (t: number): Cam => {
  const n = keys.length; if (t <= keys[0].t) return keys[0]; if (t >= keys[n - 1].t) return keys[n - 1];
  let i = 0; while (i < n - 2 && t > keys[i + 1].t) i++;
  const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(n - 1, i + 2)];
  const h = k2.t - k1.t; let s = (t - k1.t) / h;
  if (k2.ease === "out") s = 1 - Math.pow(1 - s, 3); else if (k2.ease === "in") s = s * s * s; else if (k2.ease === "inout") s = smooth(s);
  const s2 = s * s, s3 = s2 * s, h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
  const tan = (a: number, b: number, ta: number, tb: number) => (tb > ta ? (b - a) / (tb - ta) : 0) * h;
  const hv = (f: (k: Key) => number) => { const m1 = k1 === k0 ? tan(f(k1), f(k2), k1.t, k2.t) : tan(f(k0), f(k2), k0.t, k2.t), m2 = k3 === k2 ? tan(f(k1), f(k2), k1.t, k2.t) : tan(f(k1), f(k3), k1.t, k3.t); return h00 * f(k1) + h10 * m1 + h01 * f(k2) + h11 * m2; };
  const v3 = (g: (k: Key) => V3): V3 => [hv((k) => g(k)[0]), hv((k) => g(k)[1]), hv((k) => g(k)[2])];
  return { pos: v3((k) => k.pos), look: v3((k) => k.look), fov: hv((k) => k.fov) };
};
const talk = (t: number): FrontOpts["expr"] => (Math.floor(t * 9) % 3 === 0 ? "smile_closed" : "grin");
const S: Shot[] = [];
const add = (s: Omit<Shot, "id">) => S.push({ id: S.length + 1, ...s });
const CL: V3 = [RX + 0.6, 0.42, -2.3];
const office = (t: number): ActorDef[] => [
  { who: "clerk", pos: CL, scale: 0.78, opts: t < 2.4 ? { mode: "sitFeetUp", expr: "smile", prop: "phone", glow: 1 } : { mode: "sit", expr: "shock", sweat: Math.min(1, (t - 2.4) * 2), exclaim: true } },
  { who: "boss", pos: [RX - 0.9 + 0.5 * smooth((t - 1) / 2), 0, -0.2], scale: 0.8, opts: { mode: t > 1 && t < 3 ? "stroll" : "stand", phase: t * 1.4, expr: "stern", prop: t > 3 ? "point" : null, angry: Math.min(1, Math.max(0, (t - 2.6) * 1.5)), steam: t > 3.2 ? 1 : 0 } },
];
// A: one continuous move: a punch-in from the doorway onto the clerk, a slow orbit past the desk, a crane down low
add({ a: 0, b: 4.6, light: "room", dof: 10, focus: [CL[0], 1.3, CL[2]], shadowR: 8, actors: office, cam: path([
  { t: 0, pos: [RX + 1.9, 1.7, 2.6], look: [RX + 0.6, 1.3, -2.3], fov: 62 },
  { t: 0.55, pos: [RX + 1.0, 1.45, 0.4], look: [RX + 0.6, 1.25, -2.3], fov: 48, ease: "out" },
  { t: 2.3, pos: [RX - 0.6, 1.25, -0.5], look: [RX + 0.6, 1.2, -2.3], fov: 46 },
  { t: 4.6, pos: [RX - 1.2, 0.55, -1.0], look: [RX + 0.4, 1.3, -2.2], fov: 60 },
]) });
// B: dissolve to the street: track alongside two walkers, then crane up to reveal the town
const walkers = (t: number): ActorDef[] => [0, 1, 2, 3, 4, 5].map((i) => ({ who: ["w1", "m1", "clerk", "boss", "w1x", "m1x"][i], pos: [SX + (i < 2 ? -1 + i * 0.9 : (i % 2 ? 2.5 : -2.6)), 0, (i < 2 ? 2 : -6 - i * 4) - 1.1 * (t - 4.6)] as V3, scale: 0.8, opts: { mode: "stroll", phase: t * 1.5 + i * 0.5, expr: i === 0 ? talk(t) : "smile" } as FrontOpts }));
add({ a: 4.6, b: 9, light: "dusk", dof: 6, dis: 0.3, shadowR: 16, actors: walkers, cam: (t: number) => { const z = 2 - 1.1 * (t - 4.6); return path([
  { t: 4.6, pos: [SX + 2.6, 1.0, z + 2.2], look: [SX - 0.5, 1.2, z - 0.6], fov: 58 },
  { t: 7.0, pos: [SX + 2.2, 1.2, z + 1.9], look: [SX - 0.5, 1.25, z - 0.6], fov: 56 },
  { t: 9.0, pos: [SX + 1.5, 6.5, z + 6], look: [SX - 0.5, 1.5, z - 14], fov: 60, ease: "inout" },
])(t); } });
export const SHOTS = S;
export const shotAt = (t: number) => S.find((s) => t >= s.a && t < s.b) ?? S[S.length - 1];
