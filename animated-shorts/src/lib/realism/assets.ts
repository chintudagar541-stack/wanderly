// Shared realism assets for every short (see animated-shorts/REALISM.md). Everything here is CC0 / public domain:
//   acg/      ambientCG photo textures (CC0, Lennart Demes), cut from the sweethome3d-textures-ambientcg previews
//   hdri/     Poly Haven HDRIs (CC0), mirrored in the three.js examples: image-based lighting + reflections
//   sky/      the same HDRIs tone-mapped to LDR, used as visible photographic skies
//   planets/  NASA Moon / Earth maps (public domain), from the three.js examples
// Load once with loadRealism() inside a delayRender(); then ASSETS is filled and synchronous code can use it.
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { staticFile } from "remotion";
import { loadFonts } from "./type";

export const ACG = [
  "Asphalt010", "Bark001", "Bricks005", "Bricks006", "Bricks010", "Bricks012", "Bricks017", "Bricks019", "Bricks022", "Carpet003", "Carpet012", "Carpet013",
  "Concrete003", "Concrete007", "Concrete010", "CorrugatedSteel001", "Fabric005", "Fabric007", "Fabric009", "Grass001", "Grass004", "Gravel001", "Gravel002",
  "Ground012", "Ground014", "Marble001", "Marble006", "Metal007", "Metal009", "Metal010", "OfficeCeiling002", "Paint004", "PavingStones006", "Plaster001",
  "Plaster004", "Plastic001", "Road007", "Rock002", "Rock010", "RoofingTiles001", "Rubber001", "Rust003", "Tiles002", "Tiles007", "Tiles012", "Wood001",
  "Wood006", "Wood010", "WoodFloor004", "WoodFloor007", "WoodFloor009", "WoodSiding001",
] as const;
export type AcgName = (typeof ACG)[number];
export const HDRIS = { day: "blouberg_sunrise_2_1k.hdr", night: "moonless_golf_1k.hdr", room: "royal_esplanade_1k.hdr", sunset: "venice_sunset_1k.hdr", overcast: "pedestrian_overpass_1k.hdr", desert: "quarry_01_1k.hdr" } as const;
export type EnvName = keyof typeof HDRIS;

export type Assets = {
  sky: { morning: THREE.Texture; night: THREE.Texture };
  planets: { moon: THREE.Texture; earth: THREE.Texture; clouds: THREE.Texture };
  hdr: Record<EnvName, THREE.DataTexture>;
  acg: Record<AcgName, THREE.Texture>;
};
export let ASSETS: Assets | null = null;
let P: Promise<Assets> | null = null;
export const loadRealism = () => (P ??= (async () => {
  await loadFonts(); // premium in-world typography must be ready before any sign texture is painted
  const tl = new THREE.TextureLoader(), hl = new RGBELoader();
  const img = async (n: string) => { const t = await tl.loadAsync(staticFile(`realism/${n}`)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const hdr = async (n: string) => { const t = await hl.loadAsync(staticFile(`realism/hdri/${n}`)); t.mapping = THREE.EquirectangularReflectionMapping; return t; };
  const [morning, night, moon, earth, clouds] = await Promise.all([img("sky/sky_morning.jpg"), img("sky/sky_night.jpg"), img("planets/moon_1024.jpg"), img("planets/earth_atmos_2048.jpg"), img("planets/earth_clouds_1024.png")]);
  const hdrE = await Promise.all((Object.keys(HDRIS) as EnvName[]).map(async (k) => [k, await hdr(HDRIS[k])] as const));
  const acgE = await Promise.all(ACG.map(async (n) => { const t = await img(`acg/${n}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; return [n, t] as const; }));
  ASSETS = { sky: { morning, night }, planets: { moon, earth, clouds }, hdr: Object.fromEntries(hdrE) as Assets["hdr"], acg: Object.fromEntries(acgE) as Assets["acg"] };
  return ASSETS;
})());
