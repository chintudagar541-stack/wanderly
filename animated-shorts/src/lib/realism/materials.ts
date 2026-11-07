// The realistic material system (see animated-shorts/REALISM.md). Rules it enforces:
//  * every surface is MeshStandardMaterial / MeshPhysicalMaterial lit by the scene's HDRI environment
//  * photo textures (ambientCG) carry their own derived normal + roughness maps (real relief, varied sheen)
//  * plain colours are never flat: std() adds a shared micro-surface normal + roughness map
//  * UVs are in world units (wbox / wplane in geo.ts) so textures keep their real-world scale
import * as THREE from "three";
import { ASSETS, AcgName } from "./assets";
import { derivedMaps, micro } from "./textures";

export type MatOpts = { tint?: THREE.ColorRepresentation; rough?: number; metal?: number; normal?: number; physical?: boolean; clearcoat?: number; side?: THREE.Side; repeat?: number };
const CACHE = new Map<string, THREE.MeshStandardMaterial>();
const key = (...a: unknown[]) => JSON.stringify(a);

/** a PBR material from an ambientCG photo texture: colour + derived normal + roughness maps (UVs in world tiles). */
export const photo = (name: AcgName, o: MatOpts = {}) => {
  const k = key("photo", name, o); let m = CACHE.get(k); if (m) return m;
  const map = ASSETS!.acg[name], d = derivedMaps(map, 2.4, o.rough ?? 0.8, 0.35), rep = o.repeat ?? 1;
  const tex = (t: THREE.Texture) => { if (rep === 1) return t; const c = t.clone(); c.repeat.set(rep, rep); c.needsUpdate = true; return c; };
  const P = { map: tex(map), color: new THREE.Color(o.tint ?? 0xffffff), roughness: 1, roughnessMap: tex(d.rough), metalness: o.metal ?? 0, normalMap: tex(d.normal), normalScale: new THREE.Vector2(o.normal ?? 1, o.normal ?? 1), side: o.side ?? THREE.FrontSide };
  m = o.physical ? new THREE.MeshPhysicalMaterial({ ...P, clearcoat: o.clearcoat ?? 0.4, clearcoatRoughness: 0.25 }) : new THREE.MeshStandardMaterial(P);
  CACHE.set(k, m); return m; };

const GOLD = new Set([0xe8b84a, 0xd9a040, 0xf2c14e]), STEEL = new Set([0xc0c0c8, 0xa0a0b0, 0x9a9aaa, 0x9aa0b0]);
/** drop-in for the old toon(color, map?, side?) helper: a standard material that is never flat.
 *  Gold / steel colours become brushed metals, everything else a painted surface with micro relief. */
export const std = (color: THREE.ColorRepresentation, map?: THREE.Texture, side: THREE.Side = THREE.FrontSide) => {
  const hex = new THREE.Color(color).getHex(), k = map ? "" : key("std", hex, side);
  if (k && CACHE.has(k)) return CACHE.get(k)!;
  const mic = micro(), gold = GOLD.has(hex), steel = STEEL.has(hex);
  const m = new THREE.MeshStandardMaterial({ color, map: map ?? null, side, roughness: gold ? 0.35 : steel ? 0.4 : map ? 0.85 : 0.62, metalness: gold || steel ? 0.85 : 0,
    roughnessMap: mic.rough, normalMap: mic.normal, normalScale: new THREE.Vector2(map ? 0.6 : 0.35, map ? 0.6 : 0.35), bumpMap: map ?? null, bumpScale: map ? 1.0 : 0 });
  if (k) CACHE.set(k, m);
  return m; };

// ---------------- material families (use these instead of raw colours) ----------------
export const M = {
  /** stained wood: furniture, doors, crates (WoodFloor009 dark, Wood006 mid, Wood001 light) */
  wood: (tone: "dark" | "mid" | "light" = "mid", tint?: THREE.ColorRepresentation) => photo(tone === "dark" ? "WoodFloor009" : tone === "light" ? "Wood001" : "Wood006", { tint, rough: 0.6, normal: 0.8 }),
  floorWood: () => photo("WoodFloor007", { rough: 0.45, normal: 0.9 }),
  /** brushed / painted / rusty metal */
  steel: (tint: THREE.ColorRepresentation = 0xd0d4dc) => photo("Metal009", { tint, rough: 0.35, metal: 0.9, normal: 0.4 }),
  paintedMetal: (tint: THREE.ColorRepresentation) => photo("Metal010", { tint, rough: 0.5, metal: 0.25, normal: 0.5 }),
  gold: () => photo("Metal007", { tint: 0xffd890, rough: 0.3, metal: 1.0, normal: 0.3 }),
  rust: () => photo("Rust003", { rough: 0.85, metal: 0.3, normal: 1.4 }),
  corrugated: (tint?: THREE.ColorRepresentation) => photo("CorrugatedSteel001", { tint, rough: 0.5, metal: 0.6, normal: 1.5 }),
  /** masonry */
  brick: (n: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0) => photo((["Bricks005", "Bricks006", "Bricks010", "Bricks012", "Bricks017", "Bricks019", "Bricks022"] as const)[n], { rough: 0.9, normal: 1.6 }),
  concrete: (tint?: THREE.ColorRepresentation) => photo("Concrete010", { tint, rough: 0.9, normal: 1.2 }),
  plaster: (tint?: THREE.ColorRepresentation) => photo("Plaster001", { tint, rough: 0.9, normal: 0.8 }),
  stone: (tint?: THREE.ColorRepresentation) => photo("Rock002", { tint, rough: 0.9, normal: 1.6 }),
  marble: (dark = false) => photo(dark ? "Marble006" : "Marble001", { rough: 0.18, normal: 0.3, physical: true, clearcoat: 0.6 }),
  asphalt: () => photo("Asphalt010", { tint: 0xb4b4bc, rough: 0.85, normal: 1.2 }),
  road: () => photo("Road007", { rough: 0.85, normal: 1.0 }),
  paving: () => photo("PavingStones006", { tint: 0xe0dcd8, rough: 0.85, normal: 1.6 }),
  gravel: () => photo("Gravel001", { rough: 0.95, normal: 2.0 }),
  /** soft goods */
  fabric: (tint: THREE.ColorRepresentation = 0xffffff, quilted = false) => photo(quilted ? "Fabric009" : "Fabric005", { tint, rough: 0.95, normal: 1.0 }),
  carpet: (tint?: THREE.ColorRepresentation) => photo("Carpet012", { tint, rough: 1, normal: 1.4 }),
  leather: (tint: THREE.ColorRepresentation = 0x5a3a28) => photo("Rubber001", { tint, rough: 0.55, normal: 0.6, physical: true, clearcoat: 0.25 }),
  plastic: (tint: THREE.ColorRepresentation) => photo("Plastic001", { tint, rough: 0.4, normal: 0.3 }),
  rubber: () => photo("Rubber001", { tint: 0x2a2a2a, rough: 0.9, normal: 0.8 }),
  /** nature */
  bark: () => photo("Bark001", { rough: 0.95, normal: 2.2 }),
  grass: () => photo("Grass004", { rough: 0.95, normal: 1.2 }),
  ground: () => photo("Ground014", { rough: 0.95, normal: 1.6 }),
  leaf: (tint: THREE.ColorRepresentation = 0x4a7a3a) => { const k = key("leaf", tint); let m = CACHE.get(k); if (!m) { const mic = micro(); m = new THREE.MeshStandardMaterial({ color: tint, roughness: 0.75, roughnessMap: mic.rough, normalMap: mic.normal, normalScale: new THREE.Vector2(1.2, 1.2), side: THREE.DoubleSide }); CACHE.set(k, m); } return m; },
  /** glass: dark, sky-reflecting window glass; clear glass for bottles / domes */
  windowGlass: () => { let m = CACHE.get("glass"); if (!m) { m = new THREE.MeshPhysicalMaterial({ color: 0x1a2430, roughness: 0.05, metalness: 0.9, envMapIntensity: 1.4 }); CACHE.set("glass", m); } return m; },
  clearGlass: (tint: THREE.ColorRepresentation = 0xc8e8ff) => { const k = key("clear", tint); let m = CACHE.get(k); if (!m) { m = new THREE.MeshPhysicalMaterial({ color: tint, roughness: 0.04, metalness: 0, transmission: 0, transparent: true, opacity: 0.35, envMapIntensity: 1.6, depthWrite: false }); CACHE.set(k, m); } return m; },
  /** car paint: clear-coated */
  carPaint: (tint: THREE.ColorRepresentation) => { const k = key("car", tint); let m = CACHE.get(k); if (!m) { m = new THREE.MeshPhysicalMaterial({ color: tint, roughness: 0.35, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.08 }); CACHE.set(k, m); } return m; },
  /** emissive practical lights (lamp shades, screens, bulbs) */
  emissive: (color: THREE.ColorRepresentation, k = 1.6) => { const kk = key("emis", color, k); let m = CACHE.get(kk); if (!m) { m = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: color, emissiveIntensity: k, roughness: 0.5 }); CACHE.set(kk, m); } return m; },
};
