// "The Man Who Was Already Dead" (Dagar Clips): 85 s vertical horror short in the cartoon-3D style.
// One persistent three.js apartment (world.ts) posed per frame from shots.ts; character cards drawn with toon.ts.
// Post: InkPass (world lines) -> NEUTRAL tone map -> per-shot grade. Peephole / security-camera looks, phone screens,
// the police report and black frames are DOM layers (inserts.tsx). Sound is muxed after the render.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass } from "../bridge/ink";
import { NOINK } from "../bridge/ink";
import { GradeEffect, GradeParams } from "../bridge/grade";
import { World } from "./world";
import { Pen, bodyFront } from "./toon";
import { SHOTS, TOTAL, FPS, Shot, ActorDef, Who, DANIEL, COP, shotAt, kickAt, Grade } from "./shots";
import { Insert, CctvOverlay, PeepOverlay, Grain } from "./inserts";

export const DEAD_FRAMES = TOTAL;

const GRADES: Record<Grade, GradeParams> = {
  night: { ky: [0, 0.07, 0.22, 0.52, 0.8, 0.93, 1], sat: [0.85, 0.98, 1.0], tintS: [0.035, -0.006], tintM: [0.012, 0], tintH: [-0.004, 0.004], vig: [0.42, 0.3] },
  drain: { ky: [0, 0.06, 0.2, 0.5, 0.8, 0.94, 1], sat: [0.35, 0.45, 0.6], tintS: [0.04, -0.01], tintM: [0.02, -0.005], tintH: [0, 0], vig: [0.5, 0.25] },
  hall: { ky: [0, 0.08, 0.24, 0.55, 0.82, 0.94, 1], sat: [0.9, 1.0, 1.0], tintS: [0.01, -0.01], tintM: [0, -0.008], tintH: [0, 0], vig: [0.2, 0.4] },
  day: { ky: [0, 0.1, 0.28, 0.6, 0.835, 0.945, 1], sat: [1.0, 1.05, 1.0], tintS: [0.01, 0.002], tintM: [0, 0], tintH: [0.006, 0], vig: [0.15, 0.45] },
};

// ---------------- one world per browser tab ----------------
let WORLD: World | null = null;
const world = () => (WORLD ??= new World());

// ---------------- character cards ----------------
const SU = 0.00216;
const CARD_GEO = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const OUTFIT: Record<Who, typeof DANIEL> = { daniel: DANIEL, double: DANIEL, cop1: COP, cop2: { ...COP, moustache: "#2a1d18", build: "stout" } };
const SEED: Record<Who, number> = { daniel: 3, double: 3, cop1: 6, cop2: 2 };
const texCache = new Map<string, THREE.CanvasTexture>();
const cardTex = (who: Who, a: ActorDef, back: boolean, k: number) => {
  const opts = { ...a.opts, back: back || a.opts.back, seed: SEED[who] };
  const key = `${who}|${k}|${JSON.stringify(opts)}`;
  let t = texCache.get(key);
  if (t) { texCache.delete(key); texCache.set(key, t); return t; }
  const c = document.createElement("canvas");
  c.width = Math.round(600 * k); c.height = Math.round(1000 * k);
  const g = c.getContext("2d")!;
  g.setTransform(k, 0, 0, k, 0, 0);
  bodyFront(new Pen(g), OUTFIT[who], opts);
  t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  texCache.set(key, t);
  while (texCache.size > 48) { const [k0, t0] = texCache.entries().next().value as [string, THREE.CanvasTexture]; texCache.delete(k0); t0.dispose(); }
  return t;
};
class Card {
  mat = new THREE.MeshBasicMaterial({ alphaTest: 0.5, side: THREE.DoubleSide });
  mesh = new THREE.Mesh(CARD_GEO, this.mat);
  constructor(parent: THREE.Object3D) { this.mesh.layers.set(NOINK); this.mesh.renderOrder = 1; this.mesh.visible = false; parent.add(this.mesh); }
}

// ---------------- the 3D layer ----------------
const tmp = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
const Inner: React.FC<{ shot: Shot; t: number }> = ({ shot, t }) => {
  const { camera, scene } = useThree();
  const W = world();
  const cards = useMemo(() => new Map<Who, Card>(), []);
  // add synchronously: Remotion advances the frame in an effect that can run before ours
  if (W.root.parent !== scene) { scene.add(W.root); scene.background = new THREE.Color(0x05050a); }
  useEffect(() => () => { scene.remove(W.root); }, [scene, W]);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { widthNear: 4.4, widthFar: 3.0, distNear: 1.5, distFar: 12, depthLo: 0.02, depthHi: 0.05 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.night, 1),
  }), [camera, scene]);
  useEffect(() => () => { try { (fx.ink as unknown as { dispose?: () => void }).dispose?.(); } catch { /* already disposed by the composer */ } }, [fx]);

  // world state
  const ws = shot.world ? shot.world(t) : { light: "night" as const };
  W.set(ws);
  if (ws.vibrate) {
    const f = Math.round(t * FPS), on = Math.floor(t * 2.5) % 2 === 0;
    W.phoneTable.position.x = -2.4 + (on ? (f % 2 ? 0.004 : -0.004) : 0);
  } else W.phoneTable.position.x = -2.4;
  // camera
  const cam = camera as THREE.PerspectiveCamera;
  const c = shot.cam!(t, (t - shot.a) / (shot.b - shot.a));
  cam.position.set(...c.pos); cam.fov = c.fov; cam.near = 0.05; cam.far = 60; cam.updateProjectionMatrix();
  cam.lookAt(...c.look);
  const kick = kickAt(t);
  if (c.roll || kick) {
    right.set(1, 0, 0).applyQuaternion(cam.quaternion); up.set(0, 1, 0).applyQuaternion(cam.quaternion);
    cam.position.addScaledVector(right, 0.012 * kick).addScaledVector(up, 0.008 * kick);
    cam.rotateZ(((c.roll ?? 0) + 0.7 * kick) * (Math.PI / 180));
  }
  // actors
  for (const card of cards.values()) card.mesh.visible = false;
  for (const a of shot.actors ? shot.actors(t) : []) {
    let card = cards.get(a.who);
    if (!card) { card = new Card(W.root); cards.set(a.who, card); }
    const m = card.mesh;
    m.visible = true; m.position.set(...a.pos);
    const u = a.turn, back = u !== undefined && u < 0.5;
    const sx = u === undefined ? 1 : Math.max(0.04, Math.abs(1 - 2 * u));
    m.scale.set(sx * (a.scale ?? 1), a.scale ?? 1, 1);
    if (a.lying) { m.rotation.order = "YXZ"; m.rotation.set(0, Math.PI / 2, Math.PI / 2); }
    else { m.rotation.order = "YXZ"; m.rotation.set(0, Math.atan2(cam.position.x - a.pos[0], cam.position.z - a.pos[2]) + (a.yaw ?? 0), 0); }
    // canvas resolution from the card's size on screen
    const d = Math.max(0.3, tmp.set(...a.pos).setY(a.pos[1] + 1.2).distanceTo(cam.position));
    const px = (2.16 / (2 * d * Math.tan((cam.fov * Math.PI) / 360))) * 1920;
    const k = Math.min(3.2, Math.max(0.6, Math.ceil((px / 1000) * 1.15 * 5) / 5));
    card.mat.map = cardTex(a.who, a, back, k);
    card.mat.color.setRGB(...(a.tint ?? [1, 1, 1]));
    card.mat.needsUpdate = true;
  }
  fx.grade.set(GRADES[shot.grade ?? "night"]);
  return (
    <EffectComposer multisampling={0}>
      <primitive object={fx.ink} dispose={null} />
      <primitive object={fx.tone} dispose={null} />
      <primitive object={fx.grade} dispose={null} />
    </EffectComposer>
  );
};

const Scene3D: React.FC<{ shot: Shot; t: number }> = ({ shot, t }) => {
  const f = useCurrentFrame();
  const glitch = shot.view === "cctv" && ((t > 38.15 && t < 38.32) || (t > 40.12 && t < 40.22));
  const filter = shot.view === "cctv" ? "grayscale(1) contrast(1.35) brightness(1.15)" : undefined;
  return (
    <AbsoluteFill style={{ filter, transform: glitch ? `translateX(${(f % 2 ? 1 : -1) * 18}px) skewX(${f % 2 ? 2 : -2}deg)` : undefined }}>
      <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 60 }}>
        <Inner shot={shot} t={t} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const DeadShort: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const shot = shotAt(t);
  const fadeIn = Math.max(0, 1 - t / 0.4);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.kind === "3d" ? <Scene3D shot={shot} t={t} /> : <Insert kind={shot.kind} t={t} a={shot.a} b={shot.b} />}
      {shot.view === "peep" && <PeepOverlay t={t} />}
      {shot.view === "cctv" && <CctvOverlay t={t} />}
      {shot.kind !== "black" && <Grain f={f} k={shot.view === "cctv" ? 0.22 : shot.grade === "day" ? 0.04 : 0.08} />}
      {fadeIn > 0 && <AbsoluteFill style={{ background: "#000", opacity: fadeIn }} />}
    </AbsoluteFill>
  );
};

export { SHOTS };
