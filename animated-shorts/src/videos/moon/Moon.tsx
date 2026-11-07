// "The Man Who Accidentally Bought the Moon" (Dagar Clips): reference-style cartoon short, cosy city nights.
// One persistent three.js world (Kevin's apartment, rooftop, ...; world.ts) posed per frame from shots.ts.
// New-style camera: every shot moves, a little handheld drift on top, whip pans (yaw swing + motion blur) on beat
// changes. Post: InkPass -> lens blur (thin-lens DOF per shot) -> bloom -> NEUTRAL tone map -> per-light grade.
// Sun shadows (PCF soft) follow the subject; character cards cast shadows through their alpha.
// Voice by Kokoro (am_michael, fast pace); sound is muxed after the render.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, NOINK } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { GradeEffect, GradeParams } from "../bridge/grade";
import { World, LightName } from "./world";
import { ASSETS, loadRealism } from "../../lib/realism/assets";
import { makeEnvs, aoPass } from "../../lib/realism/env";
import { Pen, bodyFront } from "../dead/toon";
import { TOTAL, FPS, Shot, ActorDef, shotAt, kickAt, whipAt, outfitOf, DURATION as DURATION_S } from "./shots";
import { Grain } from "../dead/inserts";

export const MOON_FRAMES = TOTAL;

const BASE: GradeParams = { ky: [0, 0.07, 0.24, 0.56, 0.82, 0.95, 1], sat: [1.02, 1.08, 1.04], tintS: [0.012, 0.02], tintM: [0.004, 0.0], tintH: [-0.012, 0.012], vig: [0.26, 0.3] };
const GRADES: Record<LightName, GradeParams> = {
  morning: { ...BASE, tintS: [0.0, 0.025], tintH: [0.02, -0.015] },
  night: BASE,
  close: { ...BASE, vig: [0.3, 0.32] },
  city: BASE,
  casino: { ...BASE, tintS: [0.02, 0.0], tintH: [0.02, -0.01] },
  nasa: { ...BASE, tintS: [0.0, 0.03] },
  space: { ...BASE, tintS: [0.0, 0.02], sat: [1.0, 1.04, 1.02], vig: [0.32, 0.34] },
  street: BASE,
  press: BASE,
  office: { ...BASE, tintH: [0.0, 0.0], vig: [0.2, 0.26] },
};
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.85, luminanceThreshold: 0.86, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 6, radius: 0.6 });
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
const ON = () => ({ lens: true, bloom: true, shadows: true, ao: true, ...((getInputProps() as { post?: Record<string, boolean> }).post ?? {}) });
const Inner: React.FC<{ shot: Shot; t: number }> = ({ shot, t }) => {
  const on = useMemo(ON, []);
  const { camera, scene, gl } = useThree();
  const W = world();
  const cards = useMemo(() => new Map<string, Card>(), []);
  if (W.root.parent !== scene) { scene.add(W.root); scene.background = new THREE.Color(0x0a0c14); scene.fog = W.fog; }
  // HDRI image-based lighting (PMREM), one per environment, built once per GL context
  const envs = useMemo(() => makeEnvs(gl), [gl]);
  gl.shadowMap.enabled = on.shadows; gl.shadowMap.type = THREE.PCFSoftShadowMap;
  useEffect(() => () => { scene.remove(W.root); }, [scene, W]);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { widthNear: 1.6, widthFar: 0.8, distNear: 3, distFar: 160, depthLo: 0.02, depthHi: 0.06 }),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.1 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.night, 1),
    ao: aoPass(scene, camera),
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
  scene.environment = envs[W.env]; scene.environmentIntensity = W.envI;
  return (
    <EffectComposer multisampling={MS}>
      {([on.ao ? <primitive key="ao" object={fx.ao} dispose={null} /> : null,
        <primitive key="ink" object={fx.ink} dispose={null} />,
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

const useAssets = () => {
  const [ok, setOk] = useState(!!ASSETS);
  const [handle] = useState(() => (ASSETS ? null : delayRender("moon assets")));
  useEffect(() => { if (handle !== null) loadRealism().then(() => { setOk(true); continueRender(handle); }); }, [handle]);
  return ok;
};

export const MoonShort: React.FC = () => {
  const ready = useAssets();
  const f = useCurrentFrame();
  const t = f / FPS;
  const shot = shotAt(t);
  const fadeIn = Math.max(0, 1 - t / 0.3);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {ready && <Scene3D shot={shot} t={t} />}
      <Grain f={f} k={0.04} />
      {t > DURATION_S - 0.7 && <AbsoluteFill style={{ background: "#000", opacity: Math.min(1, (t - (DURATION_S - 0.7)) / 0.6) }} />}
      {fadeIn > 0 && <AbsoluteFill style={{ background: "#000", opacity: fadeIn }} />}
    </AbsoluteFill>
  );
};
