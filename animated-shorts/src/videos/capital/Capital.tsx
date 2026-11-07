// "The Sultan Who Moved His Capital" (Dagar Clips): 68 s vertical history short, new style.
// One persistent three.js world (durbar, bazaar, royal road, Daulatabad; world.ts) posed per frame from shots.ts.
// New-style camera: every shot moves, a little handheld drift on top, whip pans (yaw swing + motion blur) on beat
// changes. Post: InkPass -> lens blur (thin-lens DOF per shot) -> bloom -> NEUTRAL tone map -> per-light grade.
// Sun shadows (PCF soft) follow the subject; character cards cast shadows through their alpha.
// Voice by Kokoro (am_michael, fast pace); sound is muxed after the render.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, NOINK } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { GradeEffect, GradeParams } from "../bridge/grade";
import { World, LightName } from "./world";
import { Pen, bodyFront } from "../dead/toon";
import { TOTAL, FPS, Shot, ActorDef, Insert, shotAt, kickAt, whipAt, outfitOf, DURATION as DURATION_S, clamp01, smooth } from "./shots";
import { Grain } from "../dead/inserts";

export const CAPITAL_FRAMES = TOTAL;

const BASE: GradeParams = { ky: [0, 0.09, 0.27, 0.59, 0.835, 0.945, 1], sat: [1.02, 1.12, 1.1], tintS: [0.018, 0.004], tintM: [0.004, 0.002], tintH: [-0.008, 0.004], vig: [0.26, 0.36] };
const GRADES: Record<LightName, GradeParams> = {
  court: { ...BASE, sat: [1.04, 1.16, 1.12], tintS: [0.03, 0.002], vig: [0.32, 0.32] },
  day: BASE,
  heat: { ...BASE, sat: [1.0, 1.1, 1.06], tintS: [0.02, 0.008], tintM: [0.0, 0.008], tintH: [-0.016, 0.01], vig: [0.3, 0.34] },
  dusk: { ...BASE, sat: [1.04, 1.16, 1.14], tintS: [0.034, -0.004], tintH: [-0.014, 0.012], vig: [0.34, 0.32] },
  ghost: { ...BASE, sat: [0.7, 0.75, 0.8], tintS: [0.01, 0.01], tintM: [0.0, 0.01], vig: [0.42, 0.3] },
};
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.55, luminanceThreshold: 0.92, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

let WORLD: World | null = null;
const world = () => (WORLD ??= new World());

// ---------------- character cards (cast shadows through their alpha) ----------------
const SU = 0.00216;
const CARD_GEO = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const seedOf = (who: string) => { let h = 0; for (const ch of who) h = (h * 31 + ch.charCodeAt(0)) % 997; return (h % 7) + 1; };
const texCache = new Map<string, THREE.CanvasTexture>();
const cardTex = (who: string, a: ActorDef, k: number) => {
  const opts = { ...a.opts, seed: seedOf(who) };
  const key = `${who}|${k}|${JSON.stringify(opts)}`;
  let t = texCache.get(key);
  if (t) { texCache.delete(key); texCache.set(key, t); return t; }
  const c = document.createElement("canvas"); c.width = Math.round(600 * k); c.height = Math.round(1000 * k);
  const g = c.getContext("2d")!; g.setTransform(k, 0, 0, k, 0, 0);
  bodyFront(new Pen(g), outfitOf(who), opts);
  t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  texCache.set(key, t);
  while (texCache.size > 160) { const [k0, t0] = texCache.entries().next().value as [string, THREE.CanvasTexture]; texCache.delete(k0); t0.dispose(); }
  return t;
};
class Card {
  mat = new THREE.MeshBasicMaterial({ alphaTest: 0.5, side: THREE.DoubleSide });
  depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaTest: 0.5 });
  mesh = new THREE.Mesh(CARD_GEO, this.mat);
  constructor(parent: THREE.Object3D) { this.mesh.layers.set(NOINK); this.mesh.renderOrder = 1; this.mesh.visible = false; this.mesh.castShadow = true; this.mesh.customDepthMaterial = this.depth; parent.add(this.mesh); }
}

const tmp = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(), fwd = new THREE.Vector3(), fpt = new THREE.Vector3();
const MS = Number((getInputProps() as { ms?: number }).ms ?? 4);
const ON = () => ({ lens: true, bloom: true, shadows: true, ...((getInputProps() as { post?: Record<string, boolean> }).post ?? {}) });
const Inner: React.FC<{ shot: Shot; t: number }> = ({ shot, t }) => {
  const on = useMemo(ON, []);
  const { camera, scene, gl } = useThree();
  const W = world();
  const cards = useMemo(() => new Map<string, Card>(), []);
  if (W.root.parent !== scene) { scene.add(W.root); scene.background = new THREE.Color(0x05050a); scene.fog = W.fog; }
  gl.shadowMap.enabled = on.shadows; gl.shadowMap.type = THREE.PCFSoftShadowMap;
  useEffect(() => () => { scene.remove(W.root); }, [scene, W]);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { widthNear: 4.6, widthFar: 2.6, distNear: 3, distFar: 160, depthLo: 0.012, depthHi: 0.035 }),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.1 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, 1),
  }), [camera, scene]);
  useEffect(() => () => { try { (fx.ink as unknown as { dispose?: () => void }).dispose?.(); } catch { /* disposed by the composer */ } }, [fx]);

  const cam = camera as THREE.PerspectiveCamera;
  const u = (t - shot.a) / (shot.b - shot.a);
  const c = shot.cam(t, u);
  cam.position.set(...c.pos); cam.fov = c.fov; cam.near = 0.1; cam.far = 3000; cam.updateProjectionMatrix();
  cam.lookAt(...c.look);
  // handheld drift (scaled to the subject distance) + whip pans + beat kicks
  const dist = Math.hypot(c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]);
  const hh = Math.min(1, 0.35 + dist * 0.02);
  const [whipYaw] = whipAt(t), kick = kickAt(t);
  right.set(1, 0, 0).applyQuaternion(cam.quaternion); up.set(0, 1, 0).applyQuaternion(cam.quaternion);
  cam.position.addScaledVector(right, (0.018 * Math.sin(t * 1.3) + 0.01 * Math.sin(t * 2.9 + 1)) * hh + 0.012 * kick).addScaledVector(up, (0.012 * Math.sin(t * 1.7 + 2) + 0.006 * Math.sin(t * 3.7)) * hh);
  cam.rotateY((whipYaw * Math.PI) / 180);
  cam.rotateZ((((c.roll ?? 0) + 0.25 * Math.sin(t * 0.8) * hh + 0.7 * kick) * Math.PI) / 180);
  cam.updateMatrixWorld();
  const fxs = shot.fx ? shot.fx(t) : {};
  W.set({ light: shot.light, t, cam: c.pos, look: c.look, px: 1920 / (2 * Math.tan((cam.fov * Math.PI) / 360)), shadowR: shot.shadowR, ...fxs });
  // actors
  for (const card of cards.values()) card.mesh.visible = false;
  for (const a of shot.actors ? shot.actors(t) : []) {
    let card = cards.get(a.who);
    if (!card) { card = new Card(W.root); cards.set(a.who, card); }
    const m = card.mesh;
    m.visible = true; m.position.set(...a.pos);
    m.scale.set(a.scale ?? 1, a.scale ?? 1, 1);
    m.rotation.order = "YXZ"; m.rotation.set(0, Math.atan2(cam.position.x - a.pos[0], cam.position.z - a.pos[2]) + (a.yaw ?? 0), a.roll ?? 0);
    const d = Math.max(0.3, tmp.set(...a.pos).setY(a.pos[1] + 1.2).distanceTo(cam.position));
    const px = (2.16 / (2 * d * Math.tan((cam.fov * Math.PI) / 360))) * 1920;
    const k = Math.min(3.2, Math.max(0.6, Math.ceil((px / 1000) * 1.15 * 5) / 5));
    card.mat.map = cardTex(a.who, a, k); card.depth.map = card.mat.map;
    card.mat.color.setRGB(...(a.tint ?? [1, 1, 1]));
    card.mat.needsUpdate = true; card.depth.needsUpdate = true;
  }
  // depth of field: focus on the look point (or the shot's focus point)
  cam.getWorldDirection(fwd);
  fpt.set(...(shot.focus ?? c.look));
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = shot.dof;
  fx.grade.set(GRADES[shot.light]);
  return (
    <EffectComposer multisampling={MS}>
      {([<primitive key="ink" object={fx.ink} dispose={null} />,
        on.lens ? <primitive key="pre" object={fx.lens.pre} dispose={null} /> : null,
        on.lens ? <primitive key="main" object={fx.lens.main} dispose={null} /> : null,
        on.bloom ? <primitive key="bloom" object={fx.bloom} dispose={null} /> : null,
        <primitive key="tone" object={fx.tone} dispose={null} />,
        <primitive key="grade" object={fx.grade} dispose={null} />].filter(Boolean) as unknown as JSX.Element)}
    </EffectComposer>
  );
};

const Scene3D: React.FC<{ shot: Shot; t: number }> = ({ shot, t }) => {
  const [, blur] = whipAt(t);
  return (
    <AbsoluteFill style={{ filter: blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.1, far: 3000 }}>
        <Inner shot={shot} t={t} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// ---------------- the map inserts (painted parchment, animated route) ----------------
const INDIA = "M 300 95 L 345 80 L 390 110 L 420 170 L 470 190 L 560 215 L 640 250 L 700 300 L 690 360 L 620 380 L 600 440 L 560 520 L 520 640 L 470 760 L 430 860 L 405 930 L 380 900 L 350 800 L 320 700 L 290 620 L 250 560 L 200 520 L 160 470 L 120 430 L 150 400 L 210 390 L 230 330 L 250 260 L 270 190 Z";
const MapInsert: React.FC<{ kind: Insert; t: number; a: number; b: number }> = ({ kind, t, a, b }) => {
  const u = clamp01((t - a) / (b - a)), inK = smooth((t - a) / 0.3), z = 1 + 0.08 * u;
  const delhi = [330, 250], daul = [300, 560];
  const route = smooth((u - 0.35) / 0.45);
  const mongol = kind === "map1" ? smooth((u - 0.05) / 0.3) : 0;
  const rebels = kind === "map2" ? smooth((u - 0.1) / 0.5) : 0;
  return (
    <AbsoluteFill style={{ background: `rgba(40,24,12,${0.9 * inK})`, justifyContent: "center", alignItems: "center" }}>
      <svg width={1000} height={1500} viewBox="0 0 800 1200" style={{ transform: `scale(${z * (0.9 + 0.1 * inK)}) rotate(${-1.5 + 2 * u}deg)`, opacity: inK }}>
        <defs><radialGradient id="pg" cx="50%" cy="45%" r="70%"><stop offset="0%" stopColor="#f6e6c0" /><stop offset="100%" stopColor="#d9b47a" /></radialGradient></defs>
        <rect x={20} y={40} width={760} height={1100} rx={30} fill="url(#pg)" stroke="#5a3a1a" strokeWidth={10} />
        <rect x={44} y={64} width={712} height={1052} rx={18} fill="none" stroke="#a8462a" strokeWidth={4} strokeDasharray="14 8" />
        <path d={INDIA} transform="translate(0 120)" fill="#e9c98a" stroke="#5a3a1a" strokeWidth={8} strokeLinejoin="round" />
        {[[250, 360], [420, 420], [520, 520], [380, 700], [470, 820]].map(([x, y], i) => <path key={i} d={`M ${x - 22} ${y + 10} L ${x} ${y - 20} L ${x + 22} ${y + 10} Z`} fill="#a8865a" stroke="#5a3a1a" strokeWidth={3} />)}
        <path d="M 160 700 Q 140 760 170 820" stroke="#4a8ac0" strokeWidth={6} fill="none" /><path d="M 560 400 Q 600 460 640 470" stroke="#4a8ac0" strokeWidth={6} fill="none" />
        {/* Mongol arrows from the north-west */}
        {mongol > 0 && [[120, 180], [80, 260], [150, 120]].map(([x, y], i) => { const k = clamp01(mongol * 1.4 - i * 0.2); return (
          <g key={i} opacity={k}><path d={`M ${x} ${y} L ${x + 150 * k} ${y + 110 * k}`} stroke="#b0202a" strokeWidth={12} strokeLinecap="round" /><path d={`M ${x + 150 * k} ${y + 110 * k} l -34 -2 l 14 -28 Z`} fill="#b0202a" /></g>); })}
        {mongol > 0 && <text x={60} y={150} fontFamily="Georgia, serif" fontWeight={900} fontSize={46} fill="#b0202a" opacity={mongol}>MONGOLS</text>}
        {/* rebels in the north (map2) */}
        {rebels > 0 && [[300, 300], [380, 330], [250, 360], [430, 290]].map(([x, y], i) => <g key={i} opacity={clamp01(rebels * 2 - i * 0.3)}><path d={`M ${x} ${y + 120} l 0 -60 l 34 14 l -34 14`} fill="#b0202a" stroke="#5a1010" strokeWidth={3} /><circle cx={x} cy={y + 120} r={5} fill="#5a1010" /></g>)}
        {/* the route */}
        <path d={`M ${delhi[0]} ${delhi[1] + 120} Q 360 ${(delhi[1] + daul[1]) / 2 + 120} ${daul[0]} ${daul[1] + 120}`} stroke="#5a3a1a" strokeWidth={9} fill="none" strokeDasharray="22 14" pathLength={1} style={{ strokeDasharray: `${route} 1`, strokeDashoffset: 0 }} />
        {[[delhi, "DELHI"], [daul, "DAULATABAD"]].map(([p, n], i) => { const [x, y] = p as number[]; const k = i === 0 ? 1 : clamp01(route * 1.4 - 0.3); return (
          <g key={i} opacity={k}><circle cx={x} cy={y + 120} r={20} fill="#e8b84a" stroke="#5a1010" strokeWidth={7} /><text x={x + 32} y={y + 135} fontFamily="Georgia, serif" fontWeight={900} fontSize={46} fill="#3a1a0a">{n as string}</text></g>); })}
        {kind === "map1" && <text x={140} y={1080} fontFamily="Georgia, serif" fontWeight={900} fontSize={54} fill="#5a3a1a" opacity={route}>1,100 km</text>}
      </svg>
    </AbsoluteFill>
  );
};

export const CapitalShort: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const shot = shotAt(t);
  const fadeIn = Math.max(0, 1 - t / 0.3);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Scene3D shot={shot} t={t} />
      {shot.insert && <MapInsert kind={shot.insert} t={t} a={shot.a} b={shot.b} />}
      <Grain f={f} k={0.04} />
      {t > DURATION_S - 0.7 && <AbsoluteFill style={{ background: "#000", opacity: Math.min(1, (t - (DURATION_S - 0.7)) / 0.6) }} />}
      {fadeIn > 0 && <AbsoluteFill style={{ background: "#000", opacity: fadeIn }} />}
    </AbsoluteFill>
  );
};
