// Look-development renderer for the reference-quality engine: standard materials, soft sun shadows, N8AO ambient
// occlusion, thin ink, lens blur, gentle bloom, a neutral grade (no global colour tint).
// New-style camera: every shot moves, a little handheld drift on top, whip pans (yaw swing + motion blur) on beat
// changes. Post: InkPass -> lens blur (thin-lens DOF per shot) -> bloom -> NEUTRAL tone map -> per-light grade.
// Sun shadows (PCF soft) follow the subject; character cards cast shadows through their alpha.
// Voice by Kokoro (am_michael, fast pace); sound is muxed after the render.
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AbsoluteFill, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, NOINK } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { GradeEffect, GradeParams } from "../bridge/grade";
import { World, LightName } from "./world";
import { Pen, bodyFront } from "../dead/toon";
import { TOTAL, FPS, Shot, ActorDef, SHOTS, shotAt, outfitOf, smooth, DURATION as DURATION_S } from "./shots";
import { N8AOPostPass } from "n8ao";
import { Grain } from "../dead/inserts";

export const LOOKDEV_FRAMES = TOTAL;

const BASE: GradeParams = { ky: [0, 0.085, 0.25, 0.56, 0.82, 0.94, 1], sat: [1.0, 1.08, 1.04], tintS: [0.004, 0.0], tintM: [0, 0], tintH: [-0.004, 0.003], vig: [0.18, 0.4] };
const GRADES: Record<LightName, GradeParams> = { room: BASE, dusk: { ...BASE, tintS: [0.02, 0.0] } };
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.35, luminanceThreshold: 0.95, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 6, radius: 0.6 });
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

const tmp = new THREE.Vector3(), fwd = new THREE.Vector3(), fpt = new THREE.Vector3(), dbs = new THREE.Vector2();
const MS = Number((getInputProps() as { ms?: number }).ms ?? 4);
const ON = () => ({ ao: true, lens: true, bloom: true, shadows: true, ...((getInputProps() as { post?: Record<string, boolean> }).post ?? {}) });
type FX = { ink: InkPass; ao: { configuration: Record<string, unknown> }; lens: LensBlur; bloom: BloomEffect; tone: ToneMappingEffect; grade: GradeEffect };

/** pose the world, the camera, the character cards and the post effects for one shot at time t */
const pose = (W: World, cam: THREE.PerspectiveCamera, cards: Map<string, Card>, fx: FX, shot: Shot, t: number) => {
  const u = (t - shot.a) / (shot.b - shot.a);
  const c = shot.cam(t, u);
  cam.position.set(...c.pos); cam.fov = c.fov; cam.near = 0.05; cam.far = 3000; cam.updateProjectionMatrix();
  cam.lookAt(...c.look);
  if (c.roll) cam.rotateZ((c.roll * Math.PI) / 180);
  cam.updateMatrixWorld();
  W.set({ light: shot.light, t, cam: c.pos, look: c.look, shadowR: shot.shadowR });
  for (const card of cards.values()) card.mesh.visible = false;
  for (const a of shot.actors ? shot.actors(t) : []) {
    let card = cards.get(a.who);
    if (!card) { card = new Card(W.root); cards.set(a.who, card); }
    const m = card.mesh;
    m.visible = true; m.position.set(...a.pos);
    m.scale.set(a.scale ?? 1, a.scale ?? 1, 1);
    m.rotation.order = "YXZ"; m.rotation.set(0, Math.atan2(cam.position.x - a.pos[0], cam.position.z - a.pos[2]) + (a.yaw ?? 0), a.roll ?? 0);
    const d = Math.max(0.3, tmp.set(...a.pos).setY(a.pos[1] + 1.2 * (a.scale ?? 1)).distanceTo(cam.position));
    const px = ((2.16 * (a.scale ?? 1)) / (2 * d * Math.tan((cam.fov * Math.PI) / 360))) * 1920;
    const k = Math.min(3.2, Math.max(0.6, Math.ceil((px / 1000) * 1.15 * 5) / 5));
    card.mat.map = cardTex(a.who, a, k); card.depth.map = card.mat.map;
    card.mat.color.setRGB(...(a.tint ?? [1, 1, 1]));
    card.mat.needsUpdate = true; card.depth.needsUpdate = true;
  }
  cam.getWorldDirection(fwd);
  fpt.set(...(shot.focus ?? c.look));
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = shot.dof;
  fx.grade.set(GRADES[shot.light]);
};

const Inner: React.FC<{ t: number }> = ({ t }) => {
  const on = useMemo(ON, []);
  const { camera, scene, gl } = useThree();
  const W = world();
  const cards = useMemo(() => new Map<string, Card>(), []);
  if (W.root.parent !== scene) { scene.add(W.root); scene.background = new THREE.Color(0x8ab0d8); scene.fog = W.fog; }
  gl.shadowMap.enabled = on.shadows; gl.shadowMap.type = THREE.PCFSoftShadowMap;
  useEffect(() => () => { scene.remove(W.root); }, [scene, W]);
  const fx = useMemo<FX>(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { widthNear: 2.8, widthFar: 1.6, distNear: 3, distFar: 120, depthLo: 0.012, depthHi: 0.035 }),
    ao: (() => { const p = new N8AOPostPass(scene, camera, 1080, 1920); p.configuration.aoRadius = 1.2; p.configuration.distanceFalloff = 0.6; p.configuration.intensity = 3; p.configuration.halfRes = true; p.configuration.gammaCorrection = false; return p; })(),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.1 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.room, 1),
  }), [camera, scene]);
  useEffect(() => () => { try { (fx.ink as unknown as { dispose?: () => void }).dispose?.(); } catch { /* disposed by the composer */ } }, [fx]);
  const composer = useRef<{ render: (d?: number) => void } | null>(null);
  // dissolve: the previous shot is rendered first (full post stack), copied, then blended over the current one
  const ov = useMemo(() => {
    gl.getDrawingBufferSize(dbs);
    const tex = new THREE.FramebufferTexture(dbs.x, dbs.y);
    // the copied pixels are already display values: draw them back 1:1 (a ShaderMaterial skips colour conversion)
    const mat = new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, opacity: { value: 1 } }, transparent: true, depthTest: false, depthWrite: false,
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: "uniform sampler2D map; uniform float opacity; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(map, vUv).rgb, opacity); }" });
    const sc = new THREE.Scene(); const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); q.position.z = -0.5; q.frustumCulled = false; sc.add(q);
    return { tex, mat, sc, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) };
  }, [gl]);
  const cam = camera as THREE.PerspectiveCamera;
  const cur = shotAt(t), prev = SHOTS[SHOTS.indexOf(cur) - 1];
  const dis = cur.dis && prev && t < cur.a + cur.dis ? smooth((t - cur.a) / cur.dis) : 1;
  useFrame(() => {
    if (dis < 1 && composer.current) { pose(W, cam, cards, fx, prev!, t); composer.current.render(); gl.copyFramebufferToTexture(ov.tex); }
    pose(W, cam, cards, fx, cur, t);
  }, 1);
  useFrame(() => {
    if (dis >= 1) return;
    ov.mat.uniforms.opacity.value = 1 - dis; const ac = gl.autoClear; gl.autoClear = false; gl.setRenderTarget(null); gl.render(ov.sc, ov.cam); gl.autoClear = ac;
  }, 3);
  return (
    <EffectComposer multisampling={MS} renderPriority={2} ref={composer as never}>
      {([on.ao ? <primitive key="ao" object={fx.ao} dispose={null} /> : null, <primitive key="ink" object={fx.ink} dispose={null} />,
        on.lens ? <primitive key="pre" object={fx.lens.pre} dispose={null} /> : null,
        on.lens ? <primitive key="main" object={fx.lens.main} dispose={null} /> : null,
        on.bloom ? <primitive key="bloom" object={fx.bloom} dispose={null} /> : null,
        <primitive key="tone" object={fx.tone} dispose={null} />,
        <primitive key="grade" object={fx.grade} dispose={null} />].filter(Boolean) as unknown as JSX.Element)}
    </EffectComposer>
  );
};

const Scene3D: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill>
    <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0, preserveDrawingBuffer: true }} camera={{ fov: 40, near: 0.1, far: 3000 }}>
      <Inner t={t} />
    </ThreeCanvas>
  </AbsoluteFill>
);

export const LookdevShort: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const shot = shotAt(t);
  const fadeIn = 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Scene3D t={t} />
      <Grain f={f} k={0.04} />
      {t > DURATION_S - 0.7 && <AbsoluteFill style={{ background: "#000", opacity: Math.min(1, (t - (DURATION_S - 0.7)) / 0.6) }} />}
      {fadeIn > 0 && <AbsoluteFill style={{ background: "#000", opacity: fadeIn }} />}
    </AbsoluteFill>
  );
};
