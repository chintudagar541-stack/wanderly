// Look-development shots: an office interior (wide low corner, close-up, over-the-shoulder) and a dusk street.
import { LightName, RX, SX } from "./world";
import { FrontOpts, Outfit } from "../dead/toon";

export const FPS = 30;
export const DURATION = 8;
export const TOTAL = DURATION * FPS;
export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
export type ActorDef = { who: string; pos: V3; opts: FrontOpts; tint?: V3; scale?: number; roll?: number; yaw?: number };
export type Shot = { id: number; a: number; b: number; cam: (t: number, u: number) => Cam; actors?: (t: number) => ActorDef[]; light: LightName; dof: number; focus?: V3; whip?: -1 | 1; shadowR?: number };

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
const talk = (t: number): FrontOpts["expr"] => (Math.floor(t * 9) % 3 === 0 ? "smile_closed" : "grin");
const S: Shot[] = [];
const add = (s: Omit<Shot, "id">) => S.push({ id: S.length + 1, ...s });
const office = (t: number): ActorDef[] => [
  { who: "clerk", pos: [RX + 0.6, 0.42, -2.3], scale: 0.78, opts: { mode: "sit", expr: talk(t) } },
  { who: "boss", pos: [RX - 0.5, 0, -0.1], scale: 0.8, opts: { mode: "stand", expr: "stern", prop: "point" } },
];
add({ a: 0, b: 2, light: "room", dof: 0, cam: move({ pos: [RX + 2.5, 0.7, 2.4], look: [RX - 0.4, 1.2, -1.8], fov: 70 }, { pos: [RX + 2.2, 0.75, 2.0], look: [RX - 0.5, 1.25, -1.9], fov: 68 }), actors: office, shadowR: 8 });
add({ a: 2, b: 4, light: "room", dof: 16, cam: move({ pos: [RX + 0.85, 1.35, -0.3], look: [RX + 0.6, 1.2, -2.3], fov: 40 }, { pos: [RX + 0.8, 1.3, -0.55], look: [RX + 0.6, 1.22, -2.3], fov: 38 }), actors: office, shadowR: 6 });
add({ a: 4, b: 6, light: "room", dof: 10, focus: [RX + 0.6, 1.3, -2.3], cam: move({ pos: [RX - 1.15, 1.8, 0.9], look: [RX + 0.75, 1.3, -2.3], fov: 46 }, { pos: [RX - 1.05, 1.78, 0.7], look: [RX + 0.75, 1.3, -2.3], fov: 44 }), actors: office, shadowR: 8 });
add({ a: 6, b: 8, light: "dusk", dof: 0, cam: move({ pos: [SX + 1.5, 0.5, 14], look: [SX - 1, 2.5, -20], fov: 62 }, { pos: [SX + 1.2, 0.55, 11], look: [SX - 1, 2.6, -20], fov: 60 }),
  actors: (t) => [0, 1, 2, 3].map((i) => ({ who: ["w1", "m1", "clerk", "boss"][i], pos: [SX - 2 + i * 1.3, 0, 4 - i * 3 - 0.8 * (t - 6)] as V3, scale: 0.8, opts: { mode: "stroll", phase: t * 1.3 + i, expr: "smile" } as FrontOpts })), shadowR: 20 });
export const SHOTS = S;
export const shotAt = (t: number) => S.find((s) => t >= s.a && t < s.b) ?? S[S.length - 1];
export const kickAt = (_t: number) => 0;
export const whipAt = (_t: number): [number, number] => [0, 0];
