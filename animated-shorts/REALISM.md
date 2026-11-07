# Realism rules: cinematic 3D worlds (owner directive, 2026-11-07)

The owner wants every short to look like a professionally produced 3D animated documentary: rich, believable
environments, real textures, cinematic light. It must not look like a cartoon mobile game. The characters stay what
they are: the approved 2D cards (`src/videos/dead/toon.ts`), like the reference videos. **Only the world is made
realistic.** Never change a character's face, proportions or outfit between scenes.

Read this file before you build any world. `STYLE.md` and the `reference-short` skill point here.

## Why the old worlds looked cartoony and empty

1. Flat single-colour materials (`MeshToonMaterial` with a 3-step ramp) had no normal or roughness detail.
2. Bare primitives with sharp edges: un-bevelled boxes do not catch light.
3. Flat light: hemisphere + one sun, no ambient occlusion, no image-based lighting, thick black outlines on everything.
4. Thin sets: there were props, but no street furniture, vegetation, wires, road detail, background layers or haze.
5. Painted "pixel" facades (window grids on a texture) in place of modelled windows.

## The library: `src/lib/realism/`

| File | What it gives you |
|---|---|
| `assets.ts` | `loadRealism()` (call inside `delayRender`), then `ASSETS`: CC0 photo textures (`acg`), HDRIs (`hdr`), photographic skies (`sky`), NASA planets |
| `materials.ts` | `photo(name, opts)` is a PBR material from a photo texture, with **derived normal + roughness maps**. `M.*` gives material families: wood, floorWood, steel, paintedMetal, gold, rust, corrugated, brick, concrete, plaster, stone, marble, asphalt, road, paving, gravel, fabric, carpet, leather, plastic, rubber, bark, grass, ground, leaf, windowGlass, clearGlass, carPaint, emissive. `std(color)` is a drop-in for the old `toon()`: never flat (micro-surface normal + roughness), and gold/steel colours become metal. |
| `textures.ts` | Noise / fbm, `paint()`, `grit()` grain overlay, `derivedMaps()`, `micro()`, and painted fallbacks with wear (`woodTex`, `crackedConcrete`, `woodFloor`, `fabric`, `regolith`...). Use a painted texture only when no photo texture fits. |
| `geo.ts` | `wbox` / `wplane` / `wcyl` with **world-scaled UVs** (textures keep real size), `rbox` **bevelled boxes**, `placer()` to build local kits into a Batch |
| `env.ts` | `LOOKS` (goldenHour, overcastDay, moonlight, indoorNight, indoorPractical, office, space), `makeEnvs(gl)` (PMREM image-based lighting), `aoPass()` (N8AO ambient occlusion), `shaft()` (volumetric light cone) |
| `kit-city.ts` | `building()` gives real facades: recessed sky-reflecting windows or lit rooms, frames, sills, ledges, cornice, storefront, fire escape, AC units, flower boxes, water tank, antenna. Street furniture: `streetLamp`, `utilityPole` + `wires`, `tree`, `bench`, `trashBin`, `hydrant`, `bollard`, `newsBox`, `streetSign`, `car`. `street()` builds a complete street with all of these, plus markings, manholes, curbs, sidewalks, building rows and a far skyline. |

Assets live in `public/realism/` (all CC0 / public domain; sources are in the header of `assets.ts`). To add a texture,
crop it from the ambientCG previews (`sweethome3d-textures-ambientcg/previews/<Category>.webp`, a 7-column grid:
cell n is at x = 16 + ((n-1) % 7)·144, y = 16 + ⌊(n-1)/7⌋·176, 128 px), upscale it to 512 with lanczos, add it to
`ACG`, and check the crop on a contact sheet. Never claim a texture is used unless it is loaded.

## Material rules

- Every surface is PBR (`MeshStandardMaterial` / `MeshPhysicalMaterial`) under an HDRI environment. No toon shaders.
- Use a photo texture wherever a real material exists: wood, brick, concrete, plaster, asphalt, paving, fabric,
  carpet, metal, bark, stone, marble.
- UVs must be world-scaled (`wbox`, `wplane`, `wcyl`) so a brick is brick-sized on any wall.
- Plain colours go through `std()` (or `M.paintedMetal` / `M.plastic`), never through a bare colour material.
- Glass reflects the sky (`M.windowGlass`), car paint is clear-coated, and marble and leather have clearcoat.
- Edges are bevelled (`rbox`) on furniture, trims, cornices, cars and street props.
- Light sources are emissive (`M.emissive`) and also add a glow point (Flames) so bloom picks them up.

## Environment rules (never an empty world)

Every set has **foreground, midground and background** layers, and every prop makes sense where it is.

- **City / street**: start from `street()`. It gives road markings, manholes, curbs, sidewalks, lamps, poles and
  wires, trees, benches, bins, hydrants, news boxes, signs, parked cars, storefronts, building rows and a far skyline.
  Then add the story props (a booth, a billboard, a crowd).
- **Rooftop**: parapet, water tanks, AC units, antennas, laundry lines, plants, furniture, string lights, and
  `building()` rings around it (`near: true` on the first ring).
- **Interior**: real floor (floorWood / carpet / tiles), plastered or papered walls, ceiling, skirting, a window with
  a real view (buildings + photo sky), furniture with bevels, practical lamps, shelves full of objects, wall
  decoration, rugs, small clutter (mugs, books, cables, shoes), plants.
- **Nature**: several tree sizes, rocks, ground texture variation, grass, fallen debris, fog layers.
- Vary size, rotation, material and colour. Do not leave large flat surfaces empty: break them with props, decals
  (cracks, stains, markings) or texture.
- Atmosphere: fog colour per look, warm practical lights near faces at night, and `shaft()` for sun through windows or
  lamp cones.

## Lighting rules

- Pick a `LOOKS` preset that matches the time and place: golden hour, moonlight, indoor practical, office day,
  overcast, space. Use the matching photo sky (`ASSETS.sky.morning` / `.night`) or a star field for space.
- Image-based lighting: `scene.environment = makeEnvs(gl)[look.env]`, `scene.environmentIntensity = look.envI`.
  Keep the hemisphere light low (0.25–0.8). The HDRI does the bounce light.
- Shadows: PCF soft sun shadows that follow the subject (`shadowR`). Ambient occlusion: `aoPass()` in the composer.
- Outlines on the world are thin (ink `widthNear` ≈ 1.6), only a hint. Characters keep their own drawn outlines.
- Grades are natural: small tints, saturation ≤ 1.1, a soft vignette. No heavy purple casts.

## Camera rules

Wide establishing shots for new places, then medium shots and lots of close-ups. Low angles for power, slow dollies,
tracking along streets, orbits around a speaker, focus pulls with `dof` + `focus`. The camera always moves.
Every move must serve the line being spoken (see `STYLE.md` for cut rate and whip pans).

## Renderer limits (be honest about them)

We render with three.js on software GL (swangle) inside Remotion. There is no ray-traced global illumination, no true
volumetrics and no displacement. The closest practical stand-ins are: HDRI image-based lighting for GI and bounce,
N8AO screen-space AO, PCF soft shadows, normal maps for displacement, additive light cones for volumetric light, and
fog for atmospheric perspective. Keep geometry merged per material (`Batch`). Use `near: false` for far buildings
(windows only), and keep detailed kits for what the camera actually sees up close.

## Scene completeness check (do it on the test stills of every shot)

1. Does the world look believable (real materials, real scale)?
2. Are the textures detailed, with no flat colour areas?
3. Do the materials respond like the real thing (glass reflects, metal shines, fabric is matte)?
4. Is the set populated, with no large empty spaces?
5. Are there foreground, midground and background layers?
6. Is the lighting cinematic, with motivated light, contrast, AO and shadows?
7. Do the models read as made objects (bevels, parts), not primitives?
8. Is every character on-model?
9. Does the shot show what the narration says?

If any answer is no, fix the set and re-render the still before you render the video.
