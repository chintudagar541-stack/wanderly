// Directional motion blur for whip pans and fast camera moves (the references smear 3-8 % of the width on whips).
// The renderer sets `dir` (uv units, already scaled by the shutter) from the camera's screen-space motion each frame.
import { Effect } from "postprocessing";
import { Uniform, Vector2 } from "three";

const frag = /* glsl */ `
uniform vec2 dir;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (dot(dir, dir) < 1e-7) { outputColor = inputColor; return; }
  vec4 acc = vec4(0.0); float wsum = 0.0;
  for (int i = 0; i < 16; i++) {
    float k = (float(i) / 15.0) - 0.5, w = 1.0 - abs(k) * 0.8;
    acc += texture2D(inputBuffer, uv + dir * k) * w; wsum += w;
  }
  outputColor = acc / wsum;
}`;
export class DirBlurEffect extends Effect {
  constructor() { super("DirBlurEffect", frag, { uniforms: new Map([["dir", new Uniform(new Vector2())]]) }); }
  set(x: number, y: number) { (this.uniforms.get("dir")!.value as Vector2).set(x, y); }
}
