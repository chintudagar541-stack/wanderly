import * as THREE from "three";
import type { Shot } from "./camera";

export type WorldAudit = {
  meshCount: number;
  geometryCount: number;
  texturedMaterialCount: number;
  standardMaterialCount: number;
  bounds: { width: number; height: number; depth: number };
  warnings: string[];
};

/**
 * Development-time structural audit. This cannot judge artistic quality or prove that a set is visually full;
 * it catches common technical mistakes before still-frame inspection.
 */
export const auditWorld = (root: THREE.Object3D): WorldAudit => {
  let meshCount = 0;
  let geometryCount = 0;
  let texturedMaterialCount = 0;
  let standardMaterialCount = 0;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    meshCount += 1;
    if (object.geometry) geometryCount += 1;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) standardMaterialCount += 1;
      const candidate = material as THREE.Material & { map?: THREE.Texture | null; normalMap?: THREE.Texture | null; roughnessMap?: THREE.Texture | null };
      if (candidate.map || candidate.normalMap || candidate.roughnessMap) texturedMaterialCount += 1;
    }
  });
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.isEmpty() ? new THREE.Vector3() : bounds.getSize(new THREE.Vector3());
  const warnings: string[] = [];
  if (meshCount < 20) warnings.push(`Only ${meshCount} meshes found; verify that the set is not under-built or intentionally minimal.`);
  if (standardMaterialCount === 0) warnings.push("No MeshStandardMaterial/MeshPhysicalMaterial found; verify the intended lighting/material pipeline.");
  if (bounds.isEmpty() || size.length() === 0) warnings.push("World has empty or zero-size bounds.");
  return { meshCount, geometryCount, texturedMaterialCount, standardMaterialCount, bounds: { width: size.x, height: size.y, depth: size.z }, warnings };
};

export type ShotAudit = { shotCount: number; minDuration: number; maxDuration: number; averageDuration: number; warnings: string[] };

/** Check shot timing, lens ranges and whether camera paths actually move. */
export const auditShots = <L extends string>(shots: Shot<L>[]): ShotAudit => {
  const warnings: string[] = [];
  if (shots.length === 0) return { shotCount: 0, minDuration: 0, maxDuration: 0, averageDuration: 0, warnings: ["No shots supplied."] };
  const durations = shots.map((shot) => shot.b - shot.a);
  shots.forEach((shot, index) => {
    if (!(shot.b > shot.a)) warnings.push(`Shot ${shot.id}: end time must be after start time.`);
    if (shot.cam(shot.a, 0).fov < 40 || shot.cam(shot.a, 0).fov > 75) warnings.push(`Shot ${shot.id}: opening FOV is outside the normal 40–75° working range.`);
    if (shot.dis !== undefined && (shot.dis < 0 || shot.dis > 0.6)) warnings.push(`Shot ${shot.id}: dissolve should normally be 0–0.6 seconds.`);
    const start = shot.cam(shot.a, 0);
    const end = shot.cam(shot.b, 1);
    const moved = Math.hypot(end.pos[0] - start.pos[0], end.pos[1] - start.pos[1], end.pos[2] - start.pos[2]) > 0.04
      || Math.hypot(end.look[0] - start.look[0], end.look[1] - start.look[1], end.look[2] - start.look[2]) > 0.04
      || Math.abs(end.fov - start.fov) > 0.5;
    if (!moved && durations[index] > 1.5) warnings.push(`Shot ${shot.id}: camera appears static for ${durations[index].toFixed(1)} seconds; confirm this is intentional.`);
    if (index > 0 && shot.a < shots[index - 1].b - 0.001) warnings.push(`Shot ${shot.id}: overlaps the previous shot outside the normal dissolve model; verify timing.`);
  });
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const averageDuration = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  return { shotCount: shots.length, minDuration, maxDuration, averageDuration, warnings };
};
