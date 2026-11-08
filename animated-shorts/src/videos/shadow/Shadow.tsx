// "The Man Who Sold His Shadow" (Dagar Clips): 96 s vertical horror short in the cartoon-3D style.
// One persistent three.js world (night street + machine, mansion, bedroom, office, travel sets; world.ts) posed per
// frame from shots.ts. Characters can cast a flat ground shadow (a black copy of their card laid on the ground).
// Post: InkPass -> NEUTRAL tone map -> per-light grade. Title, flash, the laptop screen and the cut to black are DOM.
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
import { SHOTS, TOTAL, FPS, Shot, ActorDef, Overlay, shotAt, kickAt, outfitOf, DURATION as DURATION_S, clamp01 } from "./shots";
import { Grain } from "../dead/inserts";

export const SHADOW_FRAMES = TOTAL;

const NIGHT: GradeParams = { ky: [0, 0.07, 0.22, 0.53, 0.81, 0.94, 1], sat: [0.85, 0.98, 1.04], tintS: [0.04, -0.006], tintM: [0.012, 0.002], tintH: [-0.01, 0.01], vig: [0.48, 0.28] };
const DAYG: GradeParams = { ky: [0, 0.1, 0.28, 0.6, 0.835, 0.945, 1], sat: [1.0, 1.06, 1.02], tintS: [0.01, 0.002], tintM: [0, 0], tintH: [0.006, 0], vig: [0.18, 0.42] };
const GRADES: Record<LightName, GradeParams> = {
  night: NIGHT, bedroom: { ...NIGHT, vig: [0.55, 0.25] }, dark: { ...NIGHT, ky: [0, 0.05, 0.18, 0.48, 0.78, 0.93, 1], vig: [0.62, 0.2] },
  day: DAYG, desert: { ...DAYG, sat: [1.0, 1.1, 1.06] },
  office: { ky: [0, 0.08, 0.25, 0.56, 0.82, 0.94, 1], sat: [0.9, 0.98, 1.0], tintS: [0.02, -0.002], tintM: [0.004, 0.004], tintH: [-0.006, 0.006], vig: [0.38, 0.32] },
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
  smat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.78, depthWrite: false, side: THREE.DoubleSide, alphaTest: 0.5, fog: false });
  shadow = new THREE.Mesh(CARD_GEO, this.smat);
  constructor(parent: THREE.Object3D) {
    this.mesh.layers.set(NOINK); this.mesh.renderOrder = 1; this.mesh.visible = false; parent.add(this.mesh);
    this.shadow.layers.set(NOINK); this.shadow.renderOrder = 5; this.shadow.visible = false; this.shadow.matrixAutoUpdate = false; parent.add(this.shadow);
  }
}
const bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3(0, 1, 0);

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
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { widthNear: 4.6, widthFar: 2.6, distNear: 3, distFar: 160, depthLo: 0.012, depthHi: 0.035 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.night, 1),
  }), [camera, scene]);
  useEffect(() => () => { try { (fx.ink as unknown as { dispose?: () => void }).dispose?.(); } catch { /* already disposed by the composer */ } }, [fx]);

  // world state
  const ws = shot.world ? shot.world(t) : { light: "night" as const };
  // camera
  const cam = camera as THREE.PerspectiveCamera;
  const c = shot.cam!(t, (t - shot.a) / (shot.b - shot.a));
  cam.position.set(...c.pos); cam.fov = c.fov; cam.near = 0.1; cam.far = 3000; cam.updateProjectionMatrix();
  cam.lookAt(...c.look);
  W.set({ ...ws, t, cam: c.pos, px: 1920 / (2 * Math.tan((cam.fov * Math.PI) / 360)) });
  const kick = kickAt(t);
  if (c.roll || kick) {
    right.set(1, 0, 0).applyQuaternion(cam.quaternion); up.set(0, 1, 0).applyQuaternion(cam.quaternion);
    cam.position.addScaledVector(right, 0.012 * kick).addScaledVector(up, 0.008 * kick);
    cam.rotateZ(((c.roll ?? 0) + 0.7 * kick) * (Math.PI / 180));
  }
  // actors
  for (const card of cards.values()) { card.mesh.visible = false; card.shadow.visible = false; }
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
    if (a.shadow) { // lay a black copy of the card on the ground, feet at the actor, stretched away from the light
      const [dx, dz, len] = a.shadow;
      by.set(dx, 0, dz).normalize(); bx.set(-by.z, 0, by.x);
      const M = new THREE.Matrix4().makeBasis(bx.clone().multiplyScalar(a.scale ?? 1), by.clone().multiplyScalar(len / 2.1), bz);
      M.setPosition(a.pos[0], a.pos[1] + 0.21, a.pos[2]);
      card.shadow.matrix.copy(M); card.shadow.matrixWorldNeedsUpdate = true; card.shadow.visible = true; card.smat.map = card.mat.map; card.smat.needsUpdate = true;
    }
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
      <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.1, far: 3000 }}>
        <Inner shot={shot} t={t} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

const Title: React.FC<{ k: number }> = ({ k }) => (
  <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 260, opacity: k }}>
    <div style={{ fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 96, lineHeight: 1.05, color: "#e8ecf4", textAlign: "center", letterSpacing: 4,
      WebkitTextStroke: "10px #07080c", paintOrder: "stroke fill", textShadow: "0 0 40px rgba(120,200,255,0.35)" }}>THE MAN WHO<br />SOLD HIS SHADOW</div>
  </AbsoluteFill>
);

/** the laptop screen: grainy security footage of the machine, the shadow alone inside it, moving on its own */
const Screen: React.FC<{ k: number; t: number }> = ({ k, t }) => {
  const live = clamp01((t - 72.2) / 0.4), walk = Math.sin(t * 2.1), bang = t > 74.2 ? Math.max(0, Math.sin(t * 9)) : 0;
  const sx = 540 + live * (walk * 70 + bang * 30), lean = live * (walk * 6 + bang * 8);
  const noise = (Math.floor(t * 30) * 7919) % 97;
  return (
    <AbsoluteFill style={{ background: `rgba(6,8,10,${k})`, justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: 980, height: 1200, background: "#1a1c22", borderRadius: 40, border: "10px solid #07080c", opacity: k, transform: `scale(${0.94 + 0.06 * k})`, boxShadow: "0 0 120px rgba(80,200,220,0.25)", position: "relative" }}>
        <svg width={900} height={1120} viewBox="0 0 900 1120" style={{ position: "absolute", left: 30, top: 30 }}>
          <defs><radialGradient id="g" cx="50%" cy="48%" r="60%"><stop offset="0%" stopColor="#3e8a8e" /><stop offset="100%" stopColor="#0c1a1c" /></radialGradient></defs>
          <rect width={900} height={1120} fill="url(#g)" />
          <rect x={0} y={900} width={900} height={220} fill="#13262a" />
          <ellipse cx={450} cy={900} rx={260} ry={46} fill="#24343a" stroke="#07080c" strokeWidth={8} />
          <rect x={250} y={260} width={400} height={640} rx={30} fill="rgba(140,255,255,0.18)" stroke="#c0703a" strokeWidth={14} />
          {[380, 600, 820].map((y) => <line key={y} x1={232} y1={y} x2={668} y2={y} stroke="#c0703a" strokeWidth={14} />)}
          <rect x={210} y={200} width={480} height={70} rx={20} fill="#3a3e46" stroke="#07080c" strokeWidth={8} />
          <line x1={450} y1={200} x2={450} y2={90} stroke="#7a8088" strokeWidth={8} /><circle cx={450} cy={84} r={18} fill="#bff" />
          <g transform={`translate(${sx - 450} 0) rotate(${lean} 450 860)`}>
            <ellipse cx={450} cy={430} rx={82} ry={92} fill="#050507" />
            <path d="M 380 520 Q 450 500 520 520 L 540 760 Q 450 790 360 760 Z" fill="#050507" />
            <rect x={385} y={740} width={30} height={130} rx={12} fill="#050507" /><rect x={485} y={740} width={30} height={130} rx={12} fill="#050507" />
            <path d={`M 380 540 Q ${330 - bang * 40} ${600 - bang * 160} ${300 - bang * 30} ${660 - bang * 260}`} stroke="#050507" strokeWidth={30} fill="none" strokeLinecap="round" />
            <path d={`M 520 540 Q ${570 + bang * 40} ${600 - bang * 160} ${600 + bang * 30} ${660 - bang * 260}`} stroke="#050507" strokeWidth={30} fill="none" strokeLinecap="round" />
          </g>
          {Array.from({ length: 28 }).map((_, i) => <rect key={i} x={0} y={i * 40 + (noise % 40)} width={900} height={3} fill="rgba(255,255,255,0.05)" />)}
          <circle cx={70} cy={70} r={16} fill={Math.floor(t * 2) % 2 ? "#ff3030" : "#5a1010"} />
          <text x={100} y={84} fill="#f4f4f4" fontFamily="monospace" fontSize={44} fontWeight={700}>REC</text>
          <text x={560} y={84} fill="#f4f4f4" fontFamily="monospace" fontSize={38}>CAM 03</text>
          <text x={60} y={1080} fill="#f4f4f4" fontFamily="monospace" fontSize={38}>{`03:${String(14 + Math.floor((t - 69.3) / 60)).padStart(2, "0")}:${String(Math.floor(((t - 69.3) * 1) % 60 + 12)).padStart(2, "0")}  UNIT: UMBRA`}</text>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export const ShadowShort: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const shot = shotAt(t);
  const o: Overlay = shot.overlay ? shot.overlay(t) : {};
  const fadeIn = Math.max(0, 1 - t / 0.4);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Scene3D shot={shot} t={t} />
      {(o.flash ?? 0) > 0 && <AbsoluteFill style={{ background: "#dffcff", opacity: o.flash }} />}
      {(o.screen ?? 0) > 0 && <Screen k={o.screen!} t={t} />}
      {(o.title ?? 0) > 0 && <Title k={o.title!} />}
      <Grain f={f} k={0.07} />
      {(o.black ?? 0) > 0 && <AbsoluteFill style={{ background: "#000", opacity: o.black }} />}
      {t > DURATION_S - 0.8 && <AbsoluteFill style={{ background: "#000", opacity: Math.min(1, (t - (DURATION_S - 0.8)) / 0.7) }} />}
      {fadeIn > 0 && <AbsoluteFill style={{ background: "#000", opacity: fadeIn }} />}
    </AbsoluteFill>
  );
};

export { SHOTS, FPS };
