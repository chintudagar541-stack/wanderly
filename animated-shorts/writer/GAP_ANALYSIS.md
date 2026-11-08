# Our engine v2 vs. the references: what still looks different

These notes come from side-by-side frames. Top row: reference. Bottom row: our Clock Man stills (engine v2).
- `compare/vs_office.jpg`: reference office (ref2) vs. our office.
- `compare/vs_night.jpg`: reference snowy night (ref1) vs. our town.

The measured numbers (cuts, dissolves, motion, colour) are in `REFERENCE_SPEC.md`. This file covers what the eye sees.

## What already matches
- The set types and props: green block walls, the red wall clock above the clerk, the desk with its clutter, the
  calendar, the corkboard, the blue door with its sign, and the snowy street with lit windows, fences and pines.
- The cream heads with thin outlines, the stick limbs, and the emotion effects (purple angry face + steam, sweat,
  "!", zzz, "?").
- Continuous camera moves with eased punch-ins and dissolves between places.
- Soft shadows, ambient occlusion, depth of field on close-ups, the vignette.

## Office: differences (biggest first)
1. **Hard yellow sun patch.** The reference throws a big hard-edged, saturated yellow band of sunlight across the
   wall and floor (`vs_office`, top middle). We have none in frame.
   - Fix: aim the sun through the window onto the wall the camera faces.
   - Raise the sun intensity until the patch clips to yellow (around #f2dc3c).
   - Alternatively, place an additive yellow decal parallelogram on the wall.
2. **Ink weight.** The reference outlines every object with a dark navy line about 3–4 px at 480 px wide, which is
   about 7–9 px at 1080. Ours is about 2–3 px.
   - Fix: InkPass widthNear about 6, widthFar about 3.
   - Use an ink colour of about #1a1f3a instead of black.
3. **Ceiling and corners.** The reference ceiling is light, a bluish white. Ours goes dark navy because nothing
   lights its underside.
   - Fix: give the ceiling an emissive lift (about 0.25) or add a bounce light below it.
   - Lift the hemisphere ground colour.
4. **Edge glow and blue falloff.** In the reference, light falls off toward the frame edges into saturated cyan-blue,
   not grey. Warm lamps get a large soft halo (ref2 "Japanese" frame).
   - Fix: give the vignette a colour (multiply the edges toward #3040c0, not toward black).
   - Raise the bloom radius for emissive lamps.
5. **Wall blocks.** The reference blocks are bigger and paler: mint #a8e0b0, with thin light grout and a soft shade
   gradient on each block. Ours are smaller and more saturated.
6. **Floor.** In the reference, the office close-ups have a pale blue-grey tile floor. The blue carpet appears only
   in wide shots.
7. **Clock.** The reference clock is flat: a thin red rim with an ink line and clean black hands. Ours has a thick
   bevelled 3D rim. Make it flatter.
8. **Framing.** The reference keeps a character full-body or three-quarter, small in a big set, more often than we
   do. The frame shows more environment around them.

## Snowy night: differences
1. **Foreground bokeh snow.** The reference has large, soft, out-of-focus flakes in front of the lens, as well as the
   small falling snow.
   - Fix: add a few dozen sprite flakes 0.3–1.5 m from the camera with a blurred disc texture.
2. **Ground.** The reference snow is bright, pale blue-white with soft blue shadow pools and footprints.
   - Fix: brighter snow albedo, a stronger moon key, and blue shadow tint in the grade.
3. **Background mountains and sky.** Our flat, untextured triangle mountains read as cheap.
   - The reference uses dense distant towns, rows of pines, and fences with lit houses.
   - Fix: replace the mountains with soft painted silhouettes (fogged) and add more distant lit windows.
4. **Hero props.** The reference hero props are detailed: wood grain, a rope, a metal bell with specular. Our tower
   is plain blocks.
   - Fix: add cornices, arched windows, a clock bezel with numerals, a roof trim with snow on top.
5. **Interior night.** The reference night interiors are purple-blue, with moonlight shafts and lens streaks across
   the frame (ref1 "with a" frame). We have no lens streaks.
   - Fix: add an additive streak sprite for bright lights.

## Engine work this implies (in priority order)
1. Coloured vignette and edge falloff in the grade, plus a bigger bloom radius. This is one shader change.
2. Ink width and colour settings in `Short3D` config (`ink: { near, far, color }`).
3. A `sunPatch` helper in kit: a hard additive yellow decal on walls and floors.
4. A `bokeh` foreground particle helper for snow, dust and embers.
5. Flatter, outlined prop variants (clock), and a wall-block texture preset with the mint colour.
6. Painted far-background helpers: silhouette mountains, tree lines, distant window lights.
