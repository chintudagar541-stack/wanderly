// Lighting, environment and atmosphere presets for the realism library (see animated-shorts/REALISM.md, "Lighting").
// What we can do in three.js with software GL, as the closest practical stand-ins for film lighting:
//   global illumination / bounce  -> HDRI image-based lighting (PMREM) + a low hemisphere fill
//   contact shadows / AO          -> PCF soft sun shadows + N8AO screen-space ambient occlusion (aoPass below)
//   volumetric light              -> light-shaft cones (shaft() below) + height-tinted fog for atmospheric perspective
//   reflections                   -> PMREM environment reflections on glass, metal, clear-coat, marble
import * as THREE from "three";
import { N8AOPostPass } from "n8ao";
import { ASSETS, EnvName } from "./assets";

export type Look = { env: EnvName; envI: number; hemiSky: number; hemiGround: number; hemi: number; sun: number; sunI: number; sunDir: [number, number, number]; fog: number; fogNear: number; fogFar: number };
/** time-of-day / location looks. Pair each with a matching sky. */
export const LOOKS: Record<string, Look> = {
  goldenHour: { env: "day", envI: 0.9, hemiSky: 0xffe8d8, hemiGround: 0x6a5a50, hemi: 0.5, sun: 0xffc890, sunI: 3.4, sunDir: [0.3, 0.35, -1], fog: 0xd8c0a8, fogNear: 80, fogFar: 520 },
  overcastDay: { env: "overcast", envI: 1.1, hemiSky: 0xe8eef8, hemiGround: 0x6a6a6a, hemi: 0.7, sun: 0xf4f4ff, sunI: 1.2, sunDir: [0.2, 0.9, 0.3], fog: 0xc8ccd4, fogNear: 60, fogFar: 380 },
  moonlight: { env: "night", envI: 1.6, hemiSky: 0x90a0d0, hemiGround: 0x2a2a38, hemi: 0.35, sun: 0xb8c8ff, sunI: 1.1, sunDir: [0.15, 0.6, -1], fog: 0x141c30, fogNear: 60, fogFar: 520 },
  indoorNight: { env: "night", envI: 1.8, hemiSky: 0x98a8d8, hemiGround: 0x4a4048, hemi: 0.45, sun: 0xc0d0ff, sunI: 1.1, sunDir: [0.15, 0.6, -1], fog: 0x141c30, fogNear: 60, fogFar: 600 },
  indoorPractical: { env: "room", envI: 0.7, hemiSky: 0xffe0c8, hemiGround: 0x4a3a32, hemi: 0.4, sun: 0xffe0b0, sunI: 1.4, sunDir: [0.3, 1, 0.4], fog: 0x201814, fogNear: 30, fogFar: 140 },
  office: { env: "day", envI: 1.0, hemiSky: 0xf4f8ff, hemiGround: 0x6a6a74, hemi: 0.6, sun: 0xfff4e0, sunI: 2.4, sunDir: [0.2, 0.8, -1], fog: 0xc8d4e0, fogNear: 50, fogFar: 220 },
  space: { env: "sunset", envI: 0.35, hemiSky: 0xb0b8d0, hemiGround: 0x2a2a30, hemi: 0.25, sun: 0xffffff, sunI: 4.0, sunDir: [0.8, 0.45, 0.4], fog: 0x05050e, fogNear: 400, fogFar: 1600 },
};

/** PMREM-filtered environment maps for every HDRI (build once per GL context) */
export const makeEnvs = (gl: THREE.WebGLRenderer) => { const pm = new THREE.PMREMGenerator(gl), out = {} as Record<EnvName, THREE.Texture>;
  for (const k of Object.keys(ASSETS!.hdr) as EnvName[]) out[k] = pm.fromEquirectangular(ASSETS!.hdr[k]).texture; pm.dispose(); return out; };

/** screen-space ambient occlusion (contact darkening in corners, under furniture, around props) */
export const aoPass = (scene: THREE.Scene, camera: THREE.Camera, w = 1080, h = 1920) => {
  const p = new N8AOPostPass(scene, camera, w, h);
  p.configuration.aoRadius = 1.2; p.configuration.distanceFalloff = 0.6; p.configuration.intensity = 2.2; p.configuration.halfRes = true; p.configuration.gammaCorrection = false;
  p.setQualityMode("Medium"); return p; };

/** a soft volumetric light shaft (additive cone, no depth write): sun through a window, a street lamp's cone, a stage spot */
export const shaft = (from: THREE.Vector3Like, to: THREE.Vector3Like, r0: number, r1: number, color = 0xfff0d0, opacity = 0.12) => {
  const len = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z), g = new THREE.CylinderGeometry(r0, r1, len, 24, 1, true); g.translate(0, -len / 2, 0);
  const c = document.createElement("canvas"); c.width = 4; c.height = 64; const x = c.getContext("2d")!, gr = x.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 4, 64);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, map: new THREE.CanvasTexture(c), transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false }));
  m.position.set(from.x, from.y, from.z); m.lookAt(to.x, to.y, to.z); m.rotateX(-Math.PI / 2); return m; };
