# Dagar Clips — Director Playbook v3

This is the technical source of truth for every new Dagar Clips animated short. It is designed around the current Remotion + React Three Fiber + Three.js engine-v2 project. It does not promise an exact clone of another creator; it defines a repeatable production language using the supplied visual references as direction.

## 1. Rule precedence

When project instructions disagree, use this order:
1. The owner's latest direct instruction for the current video.
2. This Director Playbook for technical/visual production rules.
3. `writer/REFERENCE_SPEC.md` for measured camera, colour and transition data.
4. `STYLE.md` for channel-wide creative preferences.
5. Older per-skill notes and individual sample scenes.

The canonical new-short renderer is `src/lib3d/Short3D.tsx` and the `src/videos/clockman/` template. `src/videos/capital/` is experimental/legacy for new production unless specifically requested.

## 2. Visual target

- Expressive, simple 2D character cards integrated into a dimensional 3D world.
- The world is the hero: dense, coherent, designed sets with foreground, midground and background.
- Use stylized cinematic 3D, not flat vector backgrounds and not generic photorealism.
- Maintain the same character identity, proportions, outline language and palette across all shots.
- Do not reproduce another channel's exact frames, assets, characters or shot sequence. Translate the broad visual grammar into original scenes.

## 3. Camera system — one source of truth

Use `CAMERA_FOV` and `cameraKey()` from `src/lib3d/camera.ts` for new shot definitions.

| Shot purpose | Vertical FOV | Camera guidance |
|---|---:|---|
| Establishing | 60–65° | Show geography and layered set depth |
| Travel / tracking | 55–65° | Follow the subject through the set |
| Two-shot | 52–60° | Keep both characters readable |
| Medium | 50–60° | Gesture and body language |
| Close-up | 45–50° | Preserve round head proportions |
| Extreme close-up | 40–48° | Use sparingly for inserts/reactions |

- Low camera height creates scale; do not use extreme wide FOV as a substitute.
- Most shots should have a continuous multi-beat move: push/truck, then orbit or crane, then settle/drift.
- Typical shot duration is 2–5 seconds; average target 2.4–3.4 seconds. Longer holds are allowed for a clear story beat.
- The opening should reveal an intriguing visual immediately, usually with a quick eased push-in.
- Keep camera movement motivated by the narration, actor movement or a visual reveal.
- Use ease-out for a punch-in that settles, ease-in before a transition/whip, and in-out for graceful arcs.
- Use subtle drift only. No constant random shake and no repeated whip pans.
- Use a 0.18–0.30 second dissolve between locations where continuity permits; use a hard cut only for a deliberate gag or impact.
- For match dissolves, align a meaningful shape/object at a similar screen position in both shots.
- Camera path keys must be monotonic in time and cover the shot's full `[a,b]` interval.

## 4. Shot design checklist

Every shot definition should specify:
- Story beat and narration phrase.
- Location / set block.
- Hero subject and action.
- Camera start and end position, look target and FOV.
- Focus target and DOF intent.
- Lighting state.
- Transition intent.
- Foreground framing element where useful.

Do not vary the camera angle just to create motion. Change composition when the information or emotion changes.

## 5. 3D world construction

Build each location as a complete set before adding the camera path.

### Required spatial layers
- Foreground: close props, door frames, foliage, lamps, rails, furniture edges or other framing elements.
- Midground: characters and the principal action, with clear silhouette separation.
- Background: architecture, distant props, windows, crowds, trees, signage and atmospheric depth.

### Set dressing
- Give every location a specific architectural identity and a small coherent prop language.
- Add large structural forms first: floor, walls, ceiling/roof, doors, windows, stairs, street layout and skyline.
- Add medium props next: furniture, carts, stalls, trees, fences, shelves, lamps and machinery.
- Add small storytelling props last: books, dishes, tools, fabric, signs, clutter, ornaments and debris.
- Add background extras only where they support scale and story; keep them out of the hero silhouette.
- Avoid repeating the same prop in a visibly tiled pattern. Use deterministic variation/seeds.
- Never add random clutter just to increase mesh count. Every object must support place, period, scale or story.

### Material requirements
- Prefer `MeshStandardMaterial` / `MeshPhysicalMaterial` with plausible roughness and metalness.
- Use the procedural maps in `src/lib3d/textures.ts` and repeat them at believable world scale.
- Avoid stretching a tiny texture across a huge wall/floor.
- Where available, use colour, roughness and normal maps together; keep normal strength subtle for the stylized look.
- Use material variation across adjacent surfaces (wood, plaster, stone, metal, fabric, glass, soil) rather than one flat colour.
- Set texture colour spaces correctly: colour/albedo maps are sRGB; data maps (roughness/normal/metalness) are linear.
- Avoid mirror-like metal and wet-looking floors unless the story calls for them.

## 6. Lighting and atmosphere

- Establish a motivated key light (sun, moon, window, fire, lamp, neon or practical source).
- Use hemisphere/ambient fill to preserve readable shadow detail.
- Use soft PCF shadows for the shared engine; check shadow camera bounds and shadow-map cost.
- Use warm/cool contrast intentionally: warm practicals against cool ambient night, or warm sun against cool fill.
- Use fog only to separate distance layers, not to hide missing geometry.
- Bloom is for emissive highlights and bright practicals, not a global haze.
- Keep character cards readable while matching their tint and contact shadow to the environment.
- Every grounded character must visually contact the floor; check the feet, contact patch and cast shadow.

## 7. Character / environment integration

- Preserve the canonical character/outfit definitions; never silently redesign the narrator or recurring characters.
- Match scale to doors, chairs, tables and other known dimensions.
- Set actor positions on the correct floor plane; avoid floating, clipping and z-fighting.
- Use actor yaw/facing to match the camera and interaction partner.
- Use props and gestures to act out important narration words.
- Use foreground props carefully; never obscure eyes or key story information.

## 8. Performance budgets

- Keep static environment geometry in `Batch` objects where practical; moving objects remain separate meshes.
- Reuse geometries and cached materials/textures. Avoid creating new materials inside per-frame update functions.
- Use instancing or batched geometry for repeated small objects (crowds, foliage, bricks, snow, lamps) when practical.
- Limit shadow-casting lights; use emissive meshes for decorative bulbs and signs where dynamic shadows are unnecessary.
- Keep texture resolution proportional to screen size and camera distance.
- Test with the actual render path (`REMOTION_GL=swangle`) before assuming a browser-only feature will work in the headless renderer.

## 9. Mandatory QA workflow

1. Run `npm run typecheck` after source changes.
2. Run `auditWorld(world.root)` and `auditShots(SHOTS)` in a development-only check or temporary inspection entrypoint. Review every warning; do not suppress a warning without a reason.
3. Render one still from every shot, not just the opening and ending.
4. Make contact sheets at full vertical composition and inspect them visually.
5. Check at least one frame before, during and after each transition.
6. Check hero close-ups for head distortion, focus, eye visibility and card resolution.
7. Check wides for complete architecture, environmental layers and empty regions.
8. Run `scripts/compare_to_refs.py` for measurable motion/colour/transition differences.
9. Render a 10-second approval clip before the full render unless the owner explicitly says to render the whole video immediately.
10. Only call the scene approved after both structural diagnostics and visual inspection pass.

### Diagnostic limits

`src/lib3d/quality.ts` checks structural properties (mesh/material counts, world bounds, shot duration, camera movement and timing). It cannot judge whether a world is beautiful, detailed, coherent or similar to a reference. Contact-sheet inspection remains mandatory.

## 10. Definition of done

A short is ready only when:
- All shots have intentional camera movement or a justified static hold.
- The environment has readable foreground, midground and background layers.
- Materials and lighting support the location and time of day.
- Character proportions and identity remain consistent.
- No visible floating, clipping, flicker, broken geometry or distracting empty sets remain.
- Transitions are clean and narration/action timing is clear.
- The 10-second approval clip has been accepted (unless waived by the owner).
- Final video, smaller phone-friendly copy, audio and captions are delivered.
