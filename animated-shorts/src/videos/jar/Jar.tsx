// "The Jar That Could Predict a War" (Dagar Clips): 78 s vertical story short in the cartoon-3D style.
// One persistent three.js world (castle, courtyard, throne room, border pass, enemy camp; world.ts) posed per frame
// from shots.ts. Post: InkPass -> NEUTRAL tone map -> per-light grade; lightning/shatter flashes are a DOM layer.
// Voice by Kokoro (am_michael); sound is muxed after the render.
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
import { World, LightName } from "./world";
import { Pen, bodyFront } from "../dead/toon";
import { SHOTS, TOTAL, FPS, Shot, ActorDef, shotAt, kickAt, outfitOf, DURATION as DURATION_S } from "./shots";
import { Grain } from "../dead/inserts";

export const JAR_FRAMES = TOTAL;

const NIGHT: GradeParams = { ky: [0, 0.07, 0.22, 0.53, 0.81, 0.94, 1], sat: [0.9, 1.02, 1.08], tintS: [0.035, -0.004], tintM: [0.01, 0.004], tintH: [-0.015, 0.012], vig: [0.42, 0.3] };
const DAYG: GradeParams = { ky: [0, 0.1, 0.28, 0.6, 0.835, 0.945, 1], sat: [1.0, 1.06, 1.02], tintS: [0.01, 0.002], tintM: [0, 0], tintH: [0.006, 0], vig: [0.18, 0.42] };
const GRADES: Record<LightName, GradeParams> = {
  night: NIGHT, interiorNight: NIGHT,
  storm: { ky: [0, 0.07, 0.21, 0.5, 0.8, 0.93, 1], sat: [0.7, 0.8, 0.85], tintS: [0.03, -0.008], tintM: [0.012, -0.004], tintH: [0, 0], vig: [0.45, 0.3] },
  day: DAYG, interior: { ...DAYG, vig: [0.3, 0.35] },
  dawn: { ky: [0, 0.09, 0.26, 0.56, 0.82, 0.94, 1], sat: [1.0, 1.08, 1.08], tintS: [0.02, 0.008], tintM: [0, 0.008], tintH: [-0.008, 0.008], vig: [0.25, 0.38] },
  golden: { ky: [0, 0.09, 0.26, 0.57, 0.82, 0.94, 1], sat: [1.0, 1.12, 1.12], tintS: [0.02, 0.004], tintM: [0, 0.004], tintH: [-0.012, 0.008], vig: [0.22, 0.4] },
};

// ---------------- one world per browser tab ----------------
let WORLD: World | null = null;
const world = () => (WORLD ??= new World());

// ---------------- character cards ----------------
const SU = 0.00216;
const CARD_GEO = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const seedOf = (who: string) => { let h = 0; for (const ch of who) h = (h * 31 + ch.charCodeAt(0)) % 997; return (h % 7) + 1; };
const texCache = new Map<string, THREE.CanvasTexture>();
const cardTex = (who: string, a: ActorDef, back: boolean, k: number) => {
  const opts = { ...a.opts, back: back || a.opts.back, seed: seedOf(who) };
  const key = `${who}|${k}|${JSON.stringify(opts)}`;
  let t = texCache.get(key);
  if (t) { texCache.delete(key); texCache.set(key, t); return t; }
  const c = document.createElement("canvas");
  c.width = Math.round(600 * k); c.height = Math.round(1000 * k);
  const g = c.getContext("2d")!;
  g.setTransform(k, 0, 0, k, 0, 0);
  bodyFront(new Pen(g), outfitOf(who), opts);
  t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  texCache.set(key, t);
  while (texCache.size > 140) { const [k0, t0] = texCache.entries().next().value as [string, THREE.CanvasTexture]; texCache.delete(k0); t0.dispose(); }
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
  const cards = useMemo(() => new Map<string, Card>(), []);
  // add synchronously: Remotion advances the frame in an effect that can run before ours
  if (W.root.parent !== scene) { scene.add(W.root); scene.background = new THREE.Color(0x05050a); scene.fog = W.fog; }
  useEffect(() => () => { scene.remove(W.root); }, [scene, W]);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { widthNear: 4.6, widthFar: 2.6, distNear: 3, distFar: 120, depthLo: 0.012, depthHi: 0.035 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.night, 1),
  }), [camera, scene]);
  useEffect(() => () => { try { (fx.ink as unknown as { dispose?: () => void }).dispose?.(); } catch { /* already disposed by the composer */ } }, [fx]);

  // world state
  const ws = shot.world ? shot.world(t) : { light: "golden" as const };
  // camera
  const cam = camera as THREE.PerspectiveCamera;
  const c = shot.cam!(t, (t - shot.a) / (shot.b - shot.a));
  cam.position.set(...c.pos); cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix();
  cam.lookAt(...c.look);
  W.set({ ...ws, t, px: 1920 / (2 * Math.tan((cam.fov * Math.PI) / 360)) });
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
    const back = false, sx = 1;
    m.scale.set(sx * (a.scale ?? 1), a.scale ?? 1, 1);
    m.rotation.order = "YXZ"; m.rotation.set(0, Math.atan2(cam.position.x - a.pos[0], cam.position.z - a.pos[2]) + (a.yaw ?? 0), a.roll ?? 0);
    // canvas resolution from the card's size on screen
    const d = Math.max(0.3, tmp.set(...a.pos).setY(a.pos[1] + 1.2).distanceTo(cam.position));
    const px = (2.16 / (2 * d * Math.tan((cam.fov * Math.PI) / 360))) * 1920;
    const k = Math.min(3.2, Math.max(0.6, Math.ceil((px / 1000) * 1.15 * 5) / 5));
    card.mat.map = cardTex(a.who, a, back, k);
    card.mat.color.setRGB(...(a.tint ?? [1, 1, 1]));
    card.mat.needsUpdate = true;
  }
  fx.grade.set(GRADES[ws.light]);
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
  void f;
  return (
    <AbsoluteFill>
      <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.1, far: 1500 }}>
        <Inner shot={shot} t={t} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const JarShort: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const shot = shotAt(t);
  const fadeIn = Math.max(0, 1 - t / 0.4);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Scene3D shot={shot} t={t} />
      {shot.flash && shot.flash(t) > 0 && <AbsoluteFill style={{ background: "#eef2ff", opacity: shot.flash(t) }} />}
      <Grain f={f} k={0.05} />
      {t > DURATION_S - 0.8 && <AbsoluteFill style={{ background: "#000", opacity: Math.min(1, (t - (DURATION_S - 0.8)) / 0.7) }} />}
      {fadeIn > 0 && <AbsoluteFill style={{ background: "#000", opacity: fadeIn }} />}
    </AbsoluteFill>
  );
};

export { SHOTS, FPS };
