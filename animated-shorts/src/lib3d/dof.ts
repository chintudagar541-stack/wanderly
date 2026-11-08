// Depth of field for the engine-v2 renderer (Short3D). Same thin-lens gather as src/videos/bridge/lensblur.ts, but it
// reads a view-distance buffer the renderer draws itself every frame (DistPass below) instead of the composer's depth
// texture, which came through wrong in this pipeline (N8AO + ink + MSAA) and blurred the whole frame, faces included.
// Character cards write their distance through their alpha (alphaTest), so their silhouettes stay crisp.
import { Effect, EffectAttribute, BlendFunction } from "postprocessing";
import * as THREE from "three";
import { Uniform } from "three";

const frag = /* glsl */ `
uniform float focus;      // focus distance along the view axis (m)
uniform float cInf;       // blur-disc radius (px at 1080x1920) of things at infinity; 0 = off
uniform float nearScale;  // extra blur for things in front of the focus plane
uniform float maxCoC;     // px at 1080x1920
uniform sampler2D tDist;  // our own view-distance buffer (m), 0 = nothing drawn (sky)
#define GOLDEN 2.39996323

float cocAt(float d, float s) {               // signed CoC radius in output px
  float c = cInf * s * (1.0 - focus / max(d, 1e-3));
  if (c < 0.0) c *= nearScale;
  return clamp(c, -maxCoC * s, maxCoC * s);
}
float distAt(vec2 uv) { float d = texture2D(tDist, uv).r; return d <= 0.0 ? 1e4 : d; }

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (cInf < 0.25) { outputColor = inputColor; return; }
  float s = resolution.y / 1920.0;             // output px per 1080x1920 px
  float d0 = distAt(uv);
  float r0 = abs(cocAt(d0, s));
  float R = r0 * SPREAD;
  vec3 acc = inputColor.rgb; float wsum = 1.0;
  if (R > 0.5) {
    for (int i = 0; i < TAPS; i++) {
      float rr = sqrt((float(i) + 0.5) / float(TAPS)) * R;
      float a = float(i) * GOLDEN + ROT;
      vec2 suv = uv + vec2(cos(a), sin(a)) * rr * texelSize;
      float ds = distAt(suv);
      float rs = abs(cocAt(ds, s)) * SPREAD;
      if (ds > d0) rs = min(rs, R);            // background never bleeds over a nearer pixel
      float w = clamp(rs - rr + 0.5, 0.0, 1.0); // does the sample's disc reach us?
      acc += texture2D(inputBuffer, suv).rgb * w; wsum += w;
    }
  }
  vec3 col = acc / wsum;
#if NEAR_TAPS > 0
  float M = maxCoC * s;
  vec3 fg = vec3(0.0); float fw = 0.0, cov = 0.0;
  for (int i = 0; i < NEAR_TAPS; i++) {
    float rr = sqrt((float(i) + 0.5) / float(NEAR_TAPS)) * M;
    if (rr <= R) continue;                      // already covered by the disc gather
    float a = float(i) * GOLDEN + 1.0;
    vec2 suv = uv + vec2(cos(a), sin(a)) * rr * texelSize;
    float ds = distAt(suv);
    if (ds >= d0 * 0.97) continue;              // only things in front of us
    float rs = abs(cocAt(ds, s));
    float w = clamp(rs - rr + 0.5, 0.0, 1.0);
    fg += texture2D(inputBuffer, suv).rgb * w; fw += w;
    cov += w * (M * M) / max(rs * rs, 1.0);
  }
  if (fw > 0.0) col = mix(col, fg / fw, clamp(cov / float(NEAR_TAPS), 0.0, 1.0));
#endif
  outputColor = vec4(col, inputColor.a);
}`;

type Stage = { taps: number; spread: number; nearTaps: number; rot: number };
const PRE: Stage = { taps: 16, spread: 0.287, nearTaps: 0, rot: 0.61 };
const MAIN: Stage = { taps: 64, spread: 0.958, nearTaps: 32, rot: 0 };

export class DofEffect extends Effect {
  constructor(tDist: THREE.Texture, { maxCoC = 22, nearScale = 1.1, stage = MAIN }: { maxCoC?: number; nearScale?: number; stage?: Stage } = {}) {
    super("DofEffect", frag, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.CONVOLUTION,
      defines: new Map<string, string>([["TAPS", String(stage.taps)], ["SPREAD", stage.spread.toFixed(4)], ["NEAR_TAPS", String(stage.nearTaps)], ["ROT", stage.rot.toFixed(4)]]),
      uniforms: new Map<string, Uniform>([["focus", new Uniform(10)], ["cInf", new Uniform(0)], ["nearScale", new Uniform(nearScale)], ["maxCoC", new Uniform(maxCoC)], ["tDist", new Uniform(tDist)]]),
    });
  }
  set focus(v: number) { this.uniforms.get("focus")!.value = v; }
  set cInf(v: number) { this.uniforms.get("cInf")!.value = v; }
}
export class Dof {
  readonly pre: DofEffect; readonly main: DofEffect;
  constructor(tDist: THREE.Texture, o: { maxCoC?: number; nearScale?: number } = {}) { this.pre = new DofEffect(tDist, { ...o, stage: PRE }); this.main = new DofEffect(tDist, { ...o, stage: MAIN }); }
  set focus(v: number) { this.pre.focus = v; this.main.focus = v; }
  set cInf(v: number) { this.pre.cInf = v; this.main.cInf = v; }
}

const VS = "varying float vD; varying vec2 vUv; void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }";
const FS = "uniform sampler2D map; uniform float useMap; varying float vD; varying vec2 vUv; void main() { if (useMap > 0.5 && texture2D(map, vUv).a < 0.5) discard; gl_FragColor = vec4(vD, 0.0, 0.0, 1.0); }";
const distMat = (map: THREE.Texture | null = null, side: THREE.Side = THREE.DoubleSide) => new THREE.ShaderMaterial({ uniforms: { map: { value: map }, useMap: { value: map ? 1 : 0 } }, vertexShader: VS, fragmentShader: FS, side });
/** draws the scene's view distance (metres) into a float target; opaque meshes only (skies, glows, beams and points are skipped) */
export class DistPass {
  rt = new THREE.WebGLRenderTarget(540, 960, { type: THREE.FloatType, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
  private plain = distMat(null, THREE.FrontSide); private plainDouble = distMat(null, THREE.DoubleSide);
  private cardMats = new Map<THREE.Mesh, THREE.ShaderMaterial>();
  render(gl: THREE.WebGLRenderer, scene: THREE.Scene, cam: THREE.Camera, cards: THREE.Mesh[]) {
    const swapped: [THREE.Mesh, THREE.Material | THREE.Material[]][] = [], hidden: THREE.Object3D[] = [];
    const cardSet = new Set(cards);
    scene.traverseVisible((o) => {
      const m = o as THREE.Mesh;
      if ((o as THREE.Points).isPoints || (o as THREE.Sprite).isSprite) { hidden.push(o); return; }
      if (!m.isMesh) return;
      const mat = m.material as THREE.Material & { map?: THREE.Texture | null; alphaTest?: number };
      if (cardSet.has(m)) { let dm = this.cardMats.get(m); if (!dm) { dm = distMat(null); this.cardMats.set(m, dm); } dm.uniforms.map.value = mat.map ?? null; dm.uniforms.useMap.value = mat.map ? 1 : 0; swapped.push([m, m.material]); m.material = dm; return; }
      if (Array.isArray(mat) || mat.transparent || mat.blending !== THREE.NormalBlending || (mat as THREE.Material).side === THREE.BackSide || !mat.depthWrite) { hidden.push(o); return; }
      swapped.push([m, m.material]); m.material = mat.side === THREE.DoubleSide ? this.plainDouble : this.plain;
    });
    for (const h of hidden) h.visible = false;
    const prevRT = gl.getRenderTarget(), prevClear = gl.getClearColor(new THREE.Color()), prevA = gl.getClearAlpha(), bg = scene.background, fog = scene.fog, sm = gl.shadowMap.autoUpdate;
    scene.background = null; scene.fog = null; gl.shadowMap.autoUpdate = false;
    gl.setRenderTarget(this.rt); gl.setClearColor(0x000000, 0); gl.clear(true, true, false); gl.render(scene, cam);
    gl.setRenderTarget(prevRT); gl.setClearColor(prevClear, prevA); scene.background = bg; scene.fog = fog; gl.shadowMap.autoUpdate = sm;
    for (const [m, mat] of swapped) m.material = mat;
    for (const h of hidden) h.visible = true;
  }
}
