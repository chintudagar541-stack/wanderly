# Dagar Clips project upgrade — v3 preparation

This upgrade establishes one canonical visual/technical rule set without replacing existing scenes or character assets.

## Changes
- Added `animated-shorts/DIRECTOR_PLAYBOOK.md` as the authoritative production specification.
- Updated `STYLE.md`, `CLAUDE.md` and the `reference-short` skill to resolve engine and camera contradictions.
- Added canonical `CAMERA_FOV`, `CameraPreset` and `cameraKey()` exports to `src/lib3d/camera.ts`. Existing `path`, `orbit`, `drift` and shot types are unchanged.
- Added `src/lib3d/quality.ts` with structural world and shot diagnostics. These are opt-in development helpers and do not alter rendering.
- Kept all existing video scenes, character systems, voice assets, textures, render scripts and dependencies.

## Important
This is a safe foundation/skill upgrade, not an automatic visual re-render of every existing video. Existing scenes will only use the new camera presets when their shot definitions are updated to call `cameraKey()` or use `CAMERA_FOV`. The QA helpers must be called by a developer/Claude Code inspection workflow; they are not automatically run by Remotion.

## Validation
Run from `animated-shorts/`:
```bash
npm install
npm run typecheck
```
Then render a 10-second test clip and inspect the contact sheet as described in `DIRECTOR_PLAYBOOK.md`.
