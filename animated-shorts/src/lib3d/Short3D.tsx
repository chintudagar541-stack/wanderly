// Generic renderer for reference-style shorts (engine v2). A video supplies a World (root group, fog, set()), a shot
// list, an outfit table and per-light grades; this file does the rest: standard materials lit by hemi + soft sun
// shadows, N8AO ambient occlusion, thin ink outlines, thin-lens DOF, bloom, neutral tone map, a per-light grade, real
// dissolves between shots (the previous shot is rendered with the full post stack, copied, and blended on top), and
// character cards (Canvas2D toon bodies on billboards that cast shadows through their alpha).
// Usage: see src/videos/clockman/Clockman.tsx.
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AbsoluteFill, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, NOINK } from "../videos/bridge/ink";
import { LensBlur } from "../videos/bridge/lensblur";
import { GradeEffect, GradeParams } from "../videos/bridge/grade";
import { Pen, bodyFront, Outfit } from "../videos/dead/toon";
import { N8AOPostPass } from "n8ao";
import { Grain } from "../videos/dead/inserts";
import { Shot, ActorDef, V3, smooth } from "./camera";
import { DirBlurEffect } from "./dirblur";

export type WorldLike<L extends string> = { root: THREE.Group; fog: THREE.Fog; set(o: { light: L; t: number; cam: V3; look: V3; shadowR?: number }): void };
export type ShortConfig<L extends string> = {
  world: () => WorldLike<L>; shots: Shot<L>[]; shotAt: (t: number) => Shot<L>; outfitOf: (who: string) => Outfit;
  grades: Record<L, GradeParams>; duration: number; fps?: number;
  /** seconds of fade to black at the end (0 = none) */ fadeOut?: number;
  bloom?: { intensity?: number; threshold?: number }; ink?: { near?: number; far?: number; color?: string }; grain?: number;
};
/** the house grade, fitted to writer/REFERENCE_SPEC.md: lifted blacks (~28/255) and soft whites (~222/255), medium
 *  saturation, cool blue-violet shadows, warm highlights; vignette per scene (day ~0.9 corners, night ~0.6-0.7) */
export const REF_GRADE: GradeParams = { ky: [0.11, 0.19, 0.31, 0.5, 0.69, 0.8, 0.87], sat: [0.92, 0.92, 0.85], tintS: [0.025, 0.008], tintM: [0.004, 0], tintH: [-0.012, 0.008], vig: [0.14, 0.4] };
const makeBloom = (o: { intensity?: number; threshold?: number } = {}) => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: o.intensity ?? 0.75, luminanceThreshold: o.threshold ?? 0.8, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};


// ---------------- character cards (cast shadows through their alpha) ----------------
const SU = 0.00216;
const CARD_GEO = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const seedOf = (who: string) => { let h = 0; for (const ch of who) h = (h * 31 + ch.charCodeAt(0)) % 997; return (h % 7) + 1; };
const texCache = new Map<string, THREE.CanvasTexture>();
const cardTex = (outfitOf: (w: string) => Outfit, who: string, a: ActorDef, k: number) => {
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
// a soft dark contact patch under standing characters (references: characters never float)
const BLOB_TEX = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d")!; const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  gr.addColorStop(0, "rgba(10,10,30,0.55)"); gr.addColorStop(1, "rgba(10,10,30,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const BLOB_GEO = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
/** cards are LIT by the scene (half lambert, half self-lit so faces never go muddy), per the reference spec */
export const CARD_LIGHT = { lit: 0.62, self: 0.48 };
class Card {
  mat = new THREE.MeshLambertMaterial({ alphaTest: 0.5, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: CARD_LIGHT.self });
  blob = new THREE.Mesh(BLOB_GEO, new THREE.MeshBasicMaterial({ map: BLOB_TEX, transparent: true, depthWrite: false }));
  depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaTest: 0.5 });
  mesh = new THREE.Mesh(CARD_GEO, this.mat);
  constructor(parent: THREE.Object3D) { this.mesh.layers.set(NOINK); this.mesh.renderOrder = 1; this.mesh.visible = false; this.mesh.castShadow = true; this.mesh.customDepthMaterial = this.depth; parent.add(this.mesh); this.blob.layers.set(NOINK); this.blob.renderOrder = 0; parent.add(this.blob); }
}

const tmp = new THREE.Vector3(), fwd = new THREE.Vector3(), fpt = new THREE.Vector3(), dbs = new THREE.Vector2();
const MS = Number((getInputProps() as { ms?: number }).ms ?? 4);
const ON = () => ({ ao: true, lens: true, bloom: true, shadows: true, ...((getInputProps() as { post?: Record<string, boolean> }).post ?? {}) });
type FX = { mb: DirBlurEffect; ink: InkPass; ao: { configuration: Record<string, unknown> }; lens: LensBlur; bloom: BloomEffect; tone: ToneMappingEffect; grade: GradeEffect };

/** pose the world, the camera, the character cards and the post effects for one shot at time t */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pose = (C: ShortConfig<any>, W: WorldLike<any>, cam: THREE.PerspectiveCamera, cards: Map<string, Card>, fx: FX, shot: Shot<any>, t: number) => {
  const u = (t - shot.a) / (shot.b - shot.a);
  const c = shot.cam(t, u);
  cam.position.set(...c.pos); cam.fov = c.fov; cam.near = 0.05; cam.far = 3000; cam.updateProjectionMatrix();
  cam.lookAt(...c.look);
  if (c.roll) cam.rotateZ((c.roll * Math.PI) / 180);
  cam.updateMatrixWorld();
  W.set({ light: shot.light, t, cam: c.pos, look: c.look, shadowR: shot.shadowR });
  for (const card of cards.values()) { card.mesh.visible = false; card.blob.visible = false; }
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
    card.mat.map = cardTex(C.outfitOf, a.who, a, k); card.depth.map = card.mat.map;
    const tn = a.tint ?? [1, 1, 1]; card.mat.color.setRGB(tn[0] * CARD_LIGHT.lit, tn[1] * CARD_LIGHT.lit, tn[2] * CARD_LIGHT.lit);
    card.mat.emissive.setRGB(...tn); card.mat.emissiveMap = card.mat.map;
    const ground = a.opts.mode !== "jump" && !a.roll && (a.opts.mode === "stand" || a.opts.mode === "stroll" || a.opts.mode === "march" || a.opts.mode === "run" || a.opts.mode === undefined);
    if (ground) { const sc = a.scale ?? 1; card.blob.visible = true; card.blob.position.set(a.pos[0], a.pos[1] + 0.012, a.pos[2]); card.blob.scale.set(0.75 * sc, 1, 0.42 * sc); }
    card.mat.needsUpdate = true; card.depth.needsUpdate = true;
  }
  cam.getWorldDirection(fwd);
  // focus: explicit point / function, else (auto) the face of the visible character nearest the frame centre, else the look point
  const acts = shot.actors ? shot.actors(t) : [];
  if (typeof shot.focus === "function") fpt.set(...shot.focus(t));
  else if (Array.isArray(shot.focus)) fpt.set(...shot.focus);
  else {
    let best = Infinity; fpt.set(...c.look);
    for (const a of acts) {
      tmp.set(a.pos[0], a.pos[1] + 1.1 * (a.scale ?? 1), a.pos[2]); const dz = tmp.clone().sub(cam.position).dot(fwd); if (dz < 0.2) continue;
      const q = tmp.clone().project(cam); if (Math.abs(q.x) > 1 || Math.abs(q.y) > 1) continue;
      const sc = Math.hypot(q.x, q.y * 0.6); if (sc < best) { best = sc; fpt.copy(tmp); }
    }
  }
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = shot.dof;
  fx.grade.set(C.grades[shot.light]);
  // motion blur from the camera's screen-space motion over half a frame (180 deg shutter)
  const pc = shot.cam(Math.max(shot.a, t - 1 / 60), (Math.max(shot.a, t - 1 / 60) - shot.a) / (shot.b - shot.a));
  tmp.set(...pc.look).project(cam);
  const bx = -tmp.x * 0.5, by = -tmp.y * 0.5, bl = Math.hypot(bx, by);
  if (bl > 0.006) fx.mb.set(bx, by); else fx.mb.set(0, 0);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Inner: React.FC<{ t: number; C: ShortConfig<any>; W: WorldLike<any> }> = ({ t, C, W }) => {
  const on = useMemo(ON, []);
  const { camera, scene, gl } = useThree();
  const cards = useMemo(() => new Map<string, Card>(), []);
  if (W.root.parent !== scene) { scene.add(W.root); scene.background = new THREE.Color(0x8ab0d8); scene.fog = W.fog; }
  gl.shadowMap.enabled = on.shadows; gl.shadowMap.type = THREE.PCFSoftShadowMap;
  useEffect(() => () => { scene.remove(W.root); }, [scene, W]);
  const fx = useMemo<FX>(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { widthNear: C.ink?.near ?? 5, widthFar: C.ink?.far ?? 2.6, color: C.ink?.color ?? "#1d1a30", distNear: 3, distFar: 120, depthLo: 0.012, depthHi: 0.035 }),
    ao: (() => { const p = new N8AOPostPass(scene, camera, 1080, 1920); p.configuration.aoRadius = 1.2; p.configuration.distanceFalloff = 0.6; p.configuration.intensity = 3; p.configuration.halfRes = true; p.configuration.gammaCorrection = false; return p; })(),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.1 }),
    bloom: makeBloom(C.bloom),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(Object.values(C.grades)[0] as GradeParams, 1),
    mb: new DirBlurEffect(),
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
  const cur = C.shotAt(t), prev = C.shots[C.shots.indexOf(cur) - 1];
  const dis = cur.dis && prev && t < cur.a + cur.dis ? smooth((t - cur.a) / cur.dis) : 1;
  useFrame(() => {
    if (dis < 1 && composer.current) { pose(C, W, cam, cards, fx, prev!, t); composer.current.render(); gl.copyFramebufferToTexture(ov.tex); }
    pose(C, W, cam, cards, fx, cur, t);
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
        <primitive key="mb" object={fx.mb} dispose={null} />,
        on.bloom ? <primitive key="bloom" object={fx.bloom} dispose={null} /> : null,
        <primitive key="tone" object={fx.tone} dispose={null} />,
        <primitive key="grade" object={fx.grade} dispose={null} />].filter(Boolean) as unknown as JSX.Element)}
    </EffectComposer>
  );
};

/** make the Remotion component for a short */
export function makeShort<L extends string>(C: ShortConfig<L>): React.FC {
  let W: WorldLike<L> | null = null;
  const fps = C.fps ?? 30, fo = C.fadeOut ?? 0.7;
  const Comp: React.FC = () => {
    const f = useCurrentFrame();
    const t = f / fps;
    W ??= C.world();
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <AbsoluteFill>
          <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0, preserveDrawingBuffer: true }} camera={{ fov: 40, near: 0.1, far: 3000 }}>
            <Inner t={t} C={C} W={W} />
          </ThreeCanvas>
        </AbsoluteFill>
        <Grain f={f} k={C.grain ?? 0.035} />
        {fo > 0 && t > C.duration - fo && <AbsoluteFill style={{ background: "#000", opacity: Math.min(1, (t - (C.duration - fo)) / (fo * 0.85)) }} />}
      </AbsoluteFill>
    );
  };
  return Comp;
}
