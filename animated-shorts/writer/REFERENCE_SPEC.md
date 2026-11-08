# Reference look spec (measured 2026-11-07)

Five reference shorts were measured frame by frame with `scripts/analyze_video.py` and looked at by eye
(contact sheets every 0.5 s, frame strips around every transition type). Numbers are in `writer/ref_stats/ref*.json`.
Check a render against them with `python3 scripts/compare_to_refs.py out/<x>/final.mp4`.

| ref | content | world style |
|---|---|---|
| ref1 | bell/coffin, snowy town, 59.5 s | painted 2.5D, ink lines on everything |
| ref2 | Japanese office "boredom room", 60.5 s | flat-shaded 3D, ink lines on everything |
| ref3 | bronze dragon jar, palace and town, 64.9 s | soft 3D, painted textures, no lines on the set |
| ref4 | railroad canyon, 65.2 s | game-engine 3D (sun, shadows, motion blur), no lines on the set |
| ref5 | Tughlaq copper coin, 70.9 s, 720x1280 | soft "clay" 3D, strong DOF, whip pans, no lines on the set |

Units: `%W` means a percentage of the frame width. Zoom `%/s` is the growth in image scale per second
(+35 %/s means the subject grows 1.35x in 1 s). Colour numbers are 8-bit (0-255); saturation is HSV S (0-1).
The burned-in captions sit at **69-72 % of the height**, not 40-52 %, so the tool masks 64-78 % by default.

---

## 1. Camera

### Lens and height
- **FOV:** a moderately wide lens. three.js vertical `fov` is **55-65°** for travel, wides and two-shots (about
  31-36 mm full-frame equivalent on the long side). It is **45-50°** for big face close-ups, where heads stay round
  with no wide-angle bulge. The strong rail and street convergence in ref1 and ref4 comes from a low, close camera,
  not an ultra-wide lens.
- **Height:** in most shots the camera is **low**, at character waist to chest height (0.4-1.0 m for a 1.6 m
  character), looking slightly up at faces. The horizon sits at **40-50 % of the height**. Every reference also uses:
  - ground-level "rail cam" shots, with the lens 0.2-0.4 m above rails or a table and objects passing very close
    (ref4, ref5 coins);
  - straight **top-down** shots (ref1 coffin, ref2 desk, ref5 desert map, about 1 per video);
  - a few high wides over a city or army (ref3 balcony, ref5 fort), each held for 2-3 s.

### How much the camera moves (measured)
| metric | refs (range) | mean |
|---|---|---|
| frames with camera motion | 88-97 % | 94 % |
| mean zoom speed (moving frames) | 29-52 %/s | 42 %/s |
| zoom speed p99 (punch-ins) | 206-432 %/s | 291 %/s |
| mean translation speed | 18-32 %W/s | 24 %W/s |
| mean roll speed | 2-7 °/s | 4 °/s |

Per move type (86 segments of 1 s or longer, median values):

| move | share | duration | speed | total change |
|---|---|---|---|---|
| push-in (dolly in) | 25 % | 2.1 s | +35 %/s scale | subject grows ~2x |
| mixed / multi-beat (push, then orbit, then crane) | 28 % | 2.6 s | 35 %W/s | none |
| orbit / parallax (truck around the subject) | 16 % | 2.4 s | 10 %W/s pan + 10 %/s zoom | 20-25 % of the width |
| tilt or crane (vertical) | 11 % | 2.3 s | 26 %W/s | about 0.6 W |
| pull-out | 8 % | 2.9 s | -36 %/s | about 0.65x |
| pure pan | 6 % | 1.7 s | 29 %W/s | none |
| static | ~1 % | none | none | none |

- **A push-in is a real dolly, not a slow creep.** To get +35 %/s, move the camera so the distance to the subject
  drops about 30 % per second, for example from 4 m to 2 m over 2 s. Our diwali2 averages 14 %/s, which is 2.6x
  too slow.
- **Easing:** the speed profiles of all segments are 44 % ease-out, 23 % ease-in, 17 % ease-in-out and 15 %
  constant.
  - The default move starts fast and settles (`easeOutCubic`, or `easeOutExpo` for punch-ins).
  - Ease-in (accelerate) is used into a whip or a dissolve.
  - The camera never sits still: after a move settles it keeps a slow drift of 2-4 %/s.
- **Roll:** small Dutch-angle drifts of 1-3° that change over the course of a shot (ref4 and ref5 average 7 °/s
  during fast moves). There is no constant handheld shake.
- **Angle changes:** a new angle every **2.4-3.4 s** on average (15-26 transitions per minute). The median segment
  is 2.2 s and the longest is 6-12 s. Inside a segment the camera usually runs 2-3 beats (push, then orbit, then
  crane) and follows the characters.

### Transitions (measured)
| type | per minute | length | notes |
|---|---|---|---|
| **cross-dissolve** | 4-20 (mean 15) | **median 7 frames** (IQR 5-9, range 4-13) | the camera keeps moving through the dissolve on both sides |
| **whip pan** | 0-21 (ref5: 21/min) | median 11 frames (IQR 7-16) | peak speed median 5.8 W/s (IQR 4.3-7.6), ease-in-out, heavy directional motion blur, lands on a new view |
| hard cut | 0-0.9 | 1 frame | at most one per video, used for a punchline reveal (ref3, ref4, ref5) |

- ref1-ref4 are dissolve-driven (11-20 per video). ref5 is whip-driven: it whips sideways across the same palace or
  village to the next speaker or object, and the coin or spark often flies across with the whip.
- **Match transitions** appear in every video:
  - a dissolve between two objects at the same screen position (ref2: boss's round head into the next character's
    round head; ref1: bell into bell, night into dusk);
  - fly-throughs, where the camera pushes into a window or door and dissolves into the interior (ref1 at 29 s,
    ref2 into the office);
  - a foreground object wiping the lens (ref4: the locomotive passes the camera);
  - dust or a glow bloom that dissolves into the next place (ref3 at 48 s and 61 s);
  - a loop ending, where the last shot returns to the opening image (ref1 bell, ref2 FIRE button).
- **No-cut place changes:** besides dissolves and whips, the refs change place inside one continuous move:
  - a **fly-in**: a push of 150-450 %/s for 6-15 frames into a window, stall or eye;
  - a **sky or wall wipe**: tilt up to plain sky or along a canyon wall and come down somewhere else;
  - an **occlusion wipe**: a train or prop crosses the lens.
  ref4's first 11.6 s is one take that visits 5 places this way.

---

## 2. Lighting and colour

### Whole-video grade (refs vs. our diwali2 render)
| metric | refs range | refs mean | diwali2 |
|---|---|---|---|
| mean luma | 103-134 | 117 | **74** |
| black point (pixel 2nd percentile) | 22-40 | 31 | **11** |
| white point (pixel 98th percentile) | 207-225 | 217 | 179 |
| contrast (luma std) | 45-58 | 50 | 48 |
| saturation mean | 0.42-0.52 | 0.46 | **0.77** |
| saturation p90 | 0.66-0.76 | 0.74 | **0.98** |
| vignette (corner / centre luma) | 0.66-0.98 | 0.79 | 0.65 |

The refs use **lifted blacks** (no pixel below about 25), **soft highlights** (white tops out around 215-225, rarely
clipping), **medium saturation**, and normal contrast that comes from value design, not from crushing.

### By scene type (measured on clean frames)
| scene | luma | contrast | sat | sat p90 | vignette | sky / key colours (sampled) |
|---|---|---|---|---|---|---|
| night snow exterior (ref1) | 87 | 46 | 0.68 | 0.92 | 0.68 | sky `#0c2b90` top → `#1340bc` → horizon glow `#96b3ff`; snow `#6082f8` → `#4c72ef`; warm window and porch lamps `#ffb35a` |
| night moonlit exterior (ref3) | 81 | 39 | 0.63 | 0.90 | 0.58 | sky `#1b3ea0` → `#1849b0`, big moon disc with a halo, blue-violet foliage |
| night interior, lamp-lit (ref1, ref2) | 71 | 51 | 0.55 | 0.70 | **0.46** | warm key pool `#e19251` on walls, shadows `#1e1536` → `#341b2a` (violet, never black), window light cold `#9fb4ff` |
| warm day interior (palace / hall, ref3 and ref5) | 105 | 54 | 0.44 | 0.73 | 0.73 | cream and beige `#c2a28c` → `#d2b6a2`, gold accents, warm window shafts |
| bright office (ref2) | 161 | 56 | 0.33 | 0.70 | 0.88 | white ceiling `#e0dfe3`, saturated cobalt floor `#1251e1`, green brick walls |
| desert / canyon day (ref4, ref5) | 124 | 55 | 0.50 | 0.75 | 0.88 | sky `#7094ee` with soft white clouds, haze `#c3c7e8`; red-orange cliffs; sun-cast shadows |
| dusk / sunset (ref1 end, ref3) | 161 | 55 | 0.37 | 0.59 | 0.91 | ref1: `#f09dc3` → `#ffbd9d` → `#edcfbd`; ref3: `#ef7d7d` → `#ffa089` → `#ffb991` → `#fde9ae`, sun disc with rays |
| green day exterior (ref1) | 121 | 56 | 0.53 | 0.84 | 0.88 | sky blue with cumulus, saturated lawn green |

- **Night is saturated blue**, not dark grey (sat 0.63-0.68, luma 80-90). Contrast comes from warm practical lights
  (windows, lanterns, candles) against the blue.
- **Day interiors are low-saturation and warm** (sat 0.44). The colour comes from props, carpets and costumes, not
  from the light.
- **Key and fill:** night interiors use a warm key (candle or lamp, about 2700 K, `#ffb070`) with a violet-blue fill
  (`#4a3a8a`, about 35 % of the key). Exteriors use a sun key with sky-blue shadows. The ref4 canyon has shadows
  `#5a4a8a`, not black.
- **Rim light:** characters get a thin cold rim at night (moon or window) and a warm rim at dusk.
- **Bloom:** every practical light glows: candles, lanterns, window panes, sun, moon, gold sparkles and coins. The
  glow is large and soft, with a radius of 3-6 % of the width around bright sources. Use threshold about 0.8
  (linear), strength 0.6-0.9, radius 0.6.
- **Light shafts:** shafts are stylised:
  - god-rays from windows (ref1 interior, ref3 hall, ref5 palace windows throwing bright patches on the floor);
  - flat yellow sun-beam planes in ref2;
  - a sunrise ray burst in ref3.
  Build them as additive gradient planes at 15-30 % opacity, never true volumetrics.
- **Fog and haze:** there is strong aerial perspective:
  - ref3 hall and ref5 palace: backgrounds lift toward warm grey;
  - ref4 canyon: distant walls turn lavender-blue;
  - ref1 town: distant houses go pale blue.
  Objects about 25-40 m away carry about 35-50 % fog in the horizon colour.
- **Depth of field:** strong in ref2, ref3 and ref5, medium in ref1 and ref4.
  - Close-ups: the background is clearly soft, with a blur radius of about 8-15 px at 1080 for objects at 3x the
    focus distance.
  - Foreground props near the lens blur heavily (20+ px; the ref2 opening, ref5 columns).
  - Wides stay mostly sharp.
- **Motion blur:** heavy on whips and fast dollies (ref4, ref5): a directional smear of 3-8 % of the width on whip
  frames.
- **Vignette:** night interiors are darkest (corners at 0.46 of the centre); day and dusk scenes sit at about 0.9.
  ref5 has almost none. Use a smooth radial darkening, never a hard ring.

---

## 3. Materials and textures

- There are **two families**, and a video stays in one:
  1. **Painted 2.5D with ink lines (ref1, ref2):** every set object has a dark ink outline.
     - Surfaces are hand-painted: wood grain, soil cross-sections with pebbles, snow with blue shading, patchwork
       quilts, wallpaper roses.
     - Shading is 2-3 tone, with painted gradients inside each shape.
  2. **Soft 3D (ref3, ref4, ref5):** a PBR-like render with real sun shadows, AO and soft GI-like bounce.
     - Textures are painterly: cliff strata, brick, carpets, patterned tents and canopies.
     - The set has **no outlines**. Only characters and some hero props are inked.
- **Outline widths at 1080 px wide:**

  | element | width | colour |
  |---|---|---|
  | characters | 7-11 px (0.7-1.0 % of the width) | near-black `#1a1420` |
  | ink-world set lines (family 1) | 4-6 px, about 0.5x the character line | dark local-hue tones (`#2a1d2e` on wood, `#1d2a5a` on snow) |
  | small props (cups, signs) | 2-4 px | not specified |

- **Surface detail is dense:** patterned carpets, tiled floors, banners, shelves full of books, crowds. There are no
  plain flat-colour walls larger than about 20 % of the frame.

---

## 4. Characters

- **Proportions:** a big round head of about 0.40-0.45 of total height. The face is a white or skin disc.
  - The body is a bean or capsule about one head wide and 1-1.3 heads tall.
  - Arms and legs are **stick limbs**: single black lines about 1 % of the width thick, with small hands and small
    dark shoes.
  - Hats, turbans, crowns and caps are big and detailed.
- **Faces:** dot or oval eyes, thick eyebrows, mouth shapes that change per word. Expressions are big: sweat drops,
  steam, a purple face for anger.
- **Lighting on characters:** they are lit by the scene, not flat:
  - night: a blue-tinted face, a warm side lit by the lamp, and a cold rim;
  - ref5: soft gradient shading on turbans and robes;
  - ref4: a hard sun key with a shadow side.
- **Grounding:**
  - they cast real shadows on the floor and ground (ref4 and ref5 sun shadows, ref1 snow shadows);
  - they have a dark contact patch under the feet;
  - they sit in chairs, beds and coffins, behind tables, and inside window frames;
  - they never float in front of the set.

---

## 5. Composition (9:16)

- **Faces sit in the upper band:** the head centre is at **25-45 % of the height**, above the caption line at 70 %.
  In close-ups the head is **35-60 % of the frame width**, often cropped at the frame edge. Two-shots place heads on
  the left and right thirds at the same height.
- **Foreground:** about 40 % of shots have a near object in the bottom or side quarter, such as a table edge, the FIRE
  button, rails, coins, a coffin edge or bells. It is often defocused and partly cropped, and it gives the move
  parallax.
- **Density:** backgrounds are full. Crowds of 5-30 background characters, props on every surface, and sky with
  clouds, stars or snow particles. Wides show a whole town or an army.
- **Particles:** snowfall, dust, sparkles, confetti stars, coins and steam are almost always present.

---

## 6. The 15 biggest differences: typical "cartoon cards in a three.js world" vs. the refs

1. **Hard cuts everywhere.** Refs have 0-0.9 cuts/min; diwali2 has 22/min.
   - Replace cuts with **7-frame cross-dissolves** (range 5-10) while both shots keep moving, or with **whip pans**.
   - Target 16-26 transitions/min, a mean segment of 2.4-3.4 s, and at least one shot of 6 s or longer.
2. **Push-ins too slow.**
   - Dolly at **+30-40 %/s image scale** (distance drops about 30 %/s) over 1.5-2.5 s.
   - Use `easeOutCubic`, and `easeOutExpo` with an 8-frame attack for openings.
   - Keep a 2-4 %/s drift after settling.
3. **Linear or constant moves.** Use ease-out on 45 % of moves, ease-in on 25 % (into transitions) and ease-in-out on
   15 %. Combine 2-3 beats in one shot (push, then orbit 15-25°, then crane 0.3 m) instead of one straight line.
4. **Whips without blur.**
   - Make a whip 8-14 frames long with an ease-in-out speed curve peaking at **5-8 frame widths per second**.
   - Land on the new set mid-whip.
   - Add directional motion blur of 3-8 % of the width (for example 5-8 sub-frame accumulation samples, or a
     velocity-buffer blur).
5. **Oversaturated.** Saturation 0.77 vs. 0.46, p90 0.98 vs. 0.74.
   - Grade saturation **x0.6-0.65** globally.
   - Keep night skies at S about 0.65-0.9, day interiors at about 0.45.
   - No colour may hit full saturation.
6. **Crushed blacks, dark overall.** Luma 74 vs. 117, black point 11 vs. 31.
   - Use filmic tone mapping (ACES or AgX) at exposure +0.5-0.8 EV.
   - Then apply a lift and gain grade, `out = 0.11 + 0.76 * in` (display-referred), so blacks are about 28 and
     whites about 222.
   - Night stays saturated blue at luma 80-90, not black.
7. **Flat unlit character cards.** Shade cards with the scene light:
   - `albedo * (hemi(sky, ground) * 0.6 + keyColor * max(0, dot) * 0.6)`;
   - add a Fresnel-style rim on the silhouette edge (cold at night, warm at dusk, 25 % intensity, 3-5 px);
   - tint by fog.
8. **No shadows or contact.**
   - Cards cast shadows (use `customDepthMaterial` with `alphaTest 0.5`, PCF soft, bias -0.0005).
   - Add a contact blob (radial gradient, 35-45 % opacity, 1.2x foot spread) under every standing character.
9. **No depth of field.**
   - Focus on the face, with a background blur of about 8-15 px at 1080 for objects at 3x the focus distance.
   - Blur foreground props 20+ px.
   - Wides use less: blur of 2-4 px or less.
10. **No atmosphere.** Add exponential fog in the horizon colour (density so 30 m is about 40 % fogged) plus a
    height-graded sky. Distant layers should be lighter and less saturated than the foreground.
11. **Lights do not glow.**
    - Use bloom (threshold about 0.8 linear, strength 0.6-0.9, radius 0.6) on emissive windows, lamps, candles, sun,
      moon and gold.
    - Add 1-3 additive light-shaft planes (15-30 % opacity, gradient alpha) per interior.
    - Add a warm light pool on walls behind lamps.
12. **Wrong vignette.** Night and interiors: darken corners to about 0.5-0.7 of the centre (smooth radial,
    `smoothstep(0.35, 1.0, r)`). Day: about 0.9. Dusk and palace: about 0.95.
13. **Uniform or missing outlines.** Pick one family per video:
    - ink world: set lines 4-6 px, character lines 7-11 px, both tinted dark versions of the local hue;
    - soft-3D world: no set lines, characters 7-9 px.
    Do not use pure `#000` lines; use about `#1a1420`.
14. **Bare, untextured surfaces.**
    - Apply painted textures or vertex-colour gradients, baked AO and 2-3 tone ramps.
    - Every wall, floor and ground needs a pattern (wood, tile, carpet, brick, snow sparkle).
    - Fill backgrounds with crowds and props so no flat area is larger than about 20 % of the frame.
15. **Characters too small or framed in the middle.**
    - Put the head centre at 25-45 % of the height.
    - Make heads 35-60 % of the width in close-ups, and use close-ups in at least half of the shots.
    - Keep the camera low (waist to chest height, slightly up-angled, fov 45-60).
    - Give about 40 % of shots a defocused foreground object.
    - Add a matched object or position across each dissolve, and fly through doors and windows between places.

---

## 7. Shot-by-shot breakdowns

### How to read these tables
- **Times:** seconds. "In" is the transition into the shot; dissolve and whip lengths are in frames.
- **Moves:** measured means from the tool.
  - Push and pull are image-scale change in %/s.
  - "Track L" means the camera moves left: the picture slides right.
  - "Crane up" means the camera rises or tilts up: the picture slides down.
  - Values are %W/s. "Peak" is the 95th-percentile speed in frame widths per second.
- **Lens:** the estimated three.js vertical `fov` and the framing: ECU (extreme close-up), CU (close-up), MCU (medium
  close-up), MS (medium shot), WS (wide shot), TD (top-down).
- **Merged rows:** one row can hold several beats of one continuous move, separated by ";". Rows shorter than 0.3 s
  that lie inside a whip are merged into the whip.
- **Fly-in:** a push of 150-450 %/s lasting 6-15 frames that carries the camera into the next place without any cut
  (ref4 0-12 s, ref5 at 28.8 s and 40.7 s). The detector correctly finds no cut there.
- **Masked moves:** the camera passes a uniform surface (sky, canyon wall, a train passing the lens) and comes out in
  a new place, also with no cut (ref4 at 3.2 s and 8.5 s).

### ref1: bell/coffin (dissolve-driven, 0 cuts, 18 dissolves of median 9 f, painted ink world)
| start | dur | place | camera move (measured) | lens / framing | starts → ends | in | characters |
|---|---|---|---|---|---|---|---|
| 0.0 | 3.2 | sunset graveyard, open grave | crane up and over the grave while pushing in (+45 %/s, up 41 %W/s, roll +5°/s; peak 2.5 W/s), tilting down to top-down | 60° WS → TD CU | 2-shot of two men at eye level → top-down on the man in the coffin | start | gravediggers smirk; the buried man grins and holds a string tied to his finger |
| 3.5 | 6.5 | bell post → ground cross-section with a row of graves | one long crane down (12 %W/s, constant), then a slow push to the coffin at 8-9.5 s | 55° MS, side elevation | bell and string → buried man in a cut-away coffin | dissolve 9 f (string to string) | the buried man blinks and smiles; a terrified watcher in a nightcap sits in the window behind |
| 10.2 | 2.9 | night snow graveyard, bell post with a name plate | orbit: pull -16 %/s, track R 15 %W/s, crane up 15 %W/s, roll -2°/s, ease-out | 55° low MS | post close → bell and town behind | dissolve 9 f (match: post to post) | the bell swings by itself; a snow puff blows off the roof |
| 13.5 | 3.7 | attic bedroom, candlelit | push-in +49 %/s, ease-in, ending in a face CU | 50° MS → CU | man in bed → his half-asleep face filling the frame | dissolve 11 f (ghosted bell over the attic) | the man in a nightcap wakes, squints and talks; in the last beat his face leans into the lens |
| 17.5 | 1.3 | through the window → snowy main street | pull -32 %/s (passes through the window frame), symmetrical street | 60° low WS, horizon at 40 % | window → street vanishing point | dissolve 10 f (fly-through window) | none (houses with warm porches) |
| 19.1 | 2.7 | porch at night, lanterns | gentle push +6 %/s, ease-out | 50° MCU, 3 characters | 3-shot → slightly tighter | dissolve 10 f | man, wife with shovel and child argue "No, you check"; sweat drop; mouths per word |
| 22.1 | 1.5 | snowy street outside the doctor's house | push +15 %/s while tracking L 14 %W/s, roll -3°/s | 60° WS | street → doorway | dissolve 10 f | wife drags the doctor out of bed across the snow |
| 24.0 | 3.1 | lantern-lit porch | slow drift (7 %W/s), ease-in-out | 50° MCU group | doctor centre, others behind | dissolve 9 f | doctor in pyjamas raises the death certificate; others stare |
| 27.4 | 1.6 | widow's house at night | fast push +93 %/s with track L 44 %W/s into the bay window (peak 1.4 W/s) | 60° WS → window CU | house front → black window glass | dissolve 10 f | none |
| 29.2 | 8.0 | dark parlour with rocking chair (3 beats) | dolly in over the rug; orbit to a CU of the widow with a light shaft across her face; pan R to the wall bell and tally sheet; push to the bell. Mean push +32 %/s | 60° WS → 45° CU → 50° insert | wide room → bell on the wall | dissolve 6 f (window → interior, a fly-through) | widow rocks, half-lidded, talks ("three short, one long") |
| 37.5 | 2.7 | sunny room with coffin on sawhorses | crane up 10 %W/s, ease-out | 50° MCU | bell → the man sitting up in the coffin | dissolve 8 f (match: wall bell → bell in hand) | the "dead" man grins, rings the bell; certificates fly |
| 40.3 | 0.9 | death certificate | pull-out and crane up (-84 %/s, up 80 %W/s; peak 1.8 W/s) | ECU → MCU | paper fills the frame → the man holding it | dissolve 5 f | the man shows the certificate smugly |
| 41.5 | 4.7 | day garden by a purple house | pull -20 %/s, ease-out; low ground camera at the soil | 55° low MS | head poking from the soil → widow beside him with shovel | dissolve 7 f | the man rises from the vegetable bed with a cabbage leaf on his head; widow digs him out, then he runs off through town |
| 46.5 | 1.3 | night parlour | pull -44 %/s, track L 29 %W/s | 60° WS | widow CU → room wide | dissolve 9 f | widow rocking |
| 48.1 | 4.3 | night parlour, 3 angles | slow pushes (+6 to +12 %/s) with dissolves of 5-7 f between angles | 45° CU, 55° MS | CU → MS → CU | dissolves 7, 5, 7 f | widow listens all night, eyes closed and then open |
| 52.0 | 0.9 | parlour → dusk graveyard | dissolve of 13 f during a push | 55° | widow → bell post | dissolve 13 f (match: wall bell → graveyard bell) | none |
| 52.9 | 6.7 | dusk snow graveyard, pink sky | pull -14 %/s with a slow orbit, ease-out | 55° low MS, horizon at 45 % | bell post CU → widow with shovel by the new grave mound | dissolve 8 f | widow stands smug with a ledger; a crow lands; it ends on her pose (a loop back to the opening bell) |

### ref2: Japanese office (dissolve-driven, 0 cuts, 20 dissolves of median 5 f, 2 whips, flat 3D with ink lines)
| start | dur | place | camera move (measured) | lens / framing | starts → ends | in | characters |
|---|---|---|---|---|---|---|---|
| 0.0 | 1.2 | boss office, FIRE button | push +30 %/s with crane up 46 %W/s (peak 3.3 W/s), heavy foreground DOF | 50° CU on the button, boss blurred behind | button ECU → boss | start | a giant hand slams the FIRE button |
| 1.2 | 1.3 | same | whip up 4 f (5.1 W/s), then whip down 7 f (6.3 W/s) | 55° | button → ceiling → office | whip | the employee is launched upward on an ejector seat |
| 2.6 | 2.0 | Japanese office with shoji window | crane up 31 %W/s, ease-out | 55° MS | seat flying → hole in the ceiling | dissolve 5 f | the employee flies through the roof, arms up |
| 4.8 | 3.0 | open-plan office with blue carpet | tracking with the walk, track L 34 %W/s, constant | 60° MS | boss and worker walk past desks → cubicles | dissolve 7 f | boss leads the new worker past colleagues |
| 8.0 | 1.4 | corridor, "Career Development Room" door | push +45 %/s with track R 28 %W/s, ease-out | 55° MS → door CU | pair → door sign | dissolve 5 f | the worker looks at the door |
| 9.5 | 4.2 | small green brick room | pull -37 %/s with crane down 29 %W/s, ease-out | ECU → 60° WS | wall clock ECU → bare desk with an empty to-do tray | dissolve 5 f | the worker sits alone, no computer |
| 13.9 | 2.2 | same room, yellow light patch | push +13 %/s, ease-in-out | 55° MS | room → worker | dissolve 5 f | feet up on the desk, scrolling the phone; a colleague passes |
| 16.2 | 5.4 | doorway, desk details (4 short shots) | pushes of +13 to +72 %/s (peak 0.7 W/s); a top-down with roll -10°/s | 45° CU; TD | boss with gift box → box CU → calendar → desk TD | dissolves 5, 4, 5 f | boss grins with a red box ("nothing inside"); a desk-top phone |
| 21.6 | 4.1 | open office | push +72 %/s, ease-in, ending on the phone screen (peak 3.1 W/s) | 55° MS → screen ECU | coworkers staring → "Inbox (0)" fills the frame | dissolve 7 f | coworkers stare at the worker walking in; the phone shows an empty inbox |
| 25.8 | 2.9 | old desk with framed photo | pull -69 %/s with track L 17 %W/s, ease-out | ECU → 55° MS | photo → someone else at his old desk | dissolve 4 f | a new colleague sits at his desk with the family photo |
| 28.9 | 4.4 | calendar → green room door | track R 18 %W/s, ease-out | 50° CU → MCU | "NOV FRI 18" calendar → boss's head pops in at the door | dissolve 7 f (calendar dissolve) | boss grins widely, cheeks red |
| 33.5 | 2.9 | corner desk in a sun patch | pull -14 %/s, ease-in | 55° MS | worker CU → desk | dissolve 7 f | "the guy in the corner" sits happily for three years |
| 36.6 | 2.9 | office tower exterior at dusk | pull -37 %/s, ease-out | 60° WS, city behind | one lit window → the whole building | dissolve 5 f | silhouettes in windows |
| 39.8 | 2.7 | green room | push +32 %/s, ease-in-out | 55° MS → MCU | two relaxed workers | dissolve 9 f | two workers, feet up, drinks with straws |
| 42.8 | 2.4 | green room, door | orbit: track R 37 %W/s, push +15 %/s, roll -7°/s, ease-in | 60° WS | door → desk | dissolve 9 f | a worker walks in on Monday; the desk is gone |
| 45.4 | 2.1 | emptied desk | push +26 %/s, roll +4°/s | 50° MS | desk → holes in the desk | dissolve 6 f | none |
| 47.7 | 1.8 | office doorway | push +47 %/s, ease-in | 55° MCU | two colleagues → the door behind | dissolve 6 f | colleagues (purple, yellow) stare, deadpan |
| 49.8 | 4.2 | night corridor, warm wall lamp | track R 15 %W/s, ease-out | 55° MS; fire-alarm CU | door → fire alarm "labor law" CU | dissolve 9 f | none; a warm light pool on the blue wall |
| 54.1 | 6.4 | night corridor → door | push +16 %/s with track L 11 %W/s, ease-in | 50° MCU → door CU | boss grinning → door sign with the worker visible through the window | dissolve 3 f | boss grins and explains; it ends on the worker trapped in the room (a loop to the opening) |

### ref3: bronze dragon jar (19 dissolves of median 6 f, 4 whips, 1 cut, soft 3D with painted textures)
| start | dur | place | camera move (measured) | lens / framing | starts → ends | in | characters |
|---|---|---|---|---|---|---|---|
| 0.0 | 2.0 | candlelit palace hall | push +17 %/s, ease-in-out; whip up 12 f (6.5 W/s) at 1.97 s | 50° MCU → dragon-head ECU | scholar by the jar → golden dragon head with a ball in its mouth | start | scholar talks, gestures, sweats |
| 2.4 | 0.7 | throne room | pull -51 %/s with track R 34 %W/s | 60° WS | jar shoulder → emperor and guards on the throne dais | whip | emperor glares; guards stand |
| 3.1 | 1.0 | hall | push +9 %/s | 50° MCU | scholar by the jar | **hard cut** (1 f) | the scholar explains, eyes wide |
| 4.1 | 1.5 | hall | crane up 9 %W/s with roll -3°/s; whip up 11 f (5.0 W/s) | 50° CU | scholar → whip | dissolve 8 f | scholar raises a finger |
| 5.6 | 1.7 | throne room | pull -24 %/s, ease-in-out | 45° CU → MS | emperor CU → court | whip | the emperor and guards burst out laughing |
| 7.6 | 5.9 | hall, jar with 8 dragons and frogs | slow arc: track L 10 %W/s, crane down 8 %W/s; push into the jar body at 11-13 s | 60° WS → 50° CU | whole jar → one dragon and frog | dissolve 6 f | none (prop shot; frogs with open mouths) |
| 13.6 | 4.1 | palace balcony, blue sky; courtyard with an army | drift 35 %W/s over the army, ease-out | 60° high WS | emperor on the balcony → thousands of soldiers | dissolve 6 f | emperor stands, unimpressed |
| 18.1 | 2.3 | hall, weeks later | push +58 %/s with crane down 30 %W/s (peak 3.2 W/s) | 55° MS → frog ECU | scholar with the crowd → frog holding the ball | dissolve 9 f | the crowd watches; the ball has dropped |
| 20.5 | 2.0 | wine cup → throne | pull -100 %/s with crane up 47 %W/s (peak 4.4 W/s), ease-out | ECU → 45° CU | ripple in the cup → emperor's face | dissolve 5 f (cup ripple) | emperor sips and frowns |
| 22.6 | 1.4 | throne | small orbit (5 %W/s) | 50° MCU | none | dissolve 4 f | emperor, unimpressed |
| 24.2 | 2.7 | banquet hall | push +11 %/s, ease-out | 55° MS | none | dissolve 5 f | courtiers laugh at the table, one falls back |
| 27.0 | 2.6 | city gate, market | slow drift, ease-out | 60° low WS, road to the gate | none | dissolve 5 f | crowd watches the scholar leave with the jar |
| 29.9 | 1.9 | sunset hillside | crane up 17 %W/s with roll +3°/s | 60° WS, sun disc | none | dissolve 7 f (gate dust → sunset) | the scholar drags the jar on a cart uphill |
| 32.0 | 1.0 | sunset farmland camp | push +8 %/s | 60° WS | none | dissolve 8 f | camp with fire, jar beside |
| 33.2 | 4.0 | moonlit field | pull -29 %/s with crane down 9 %W/s, ease-out | 45° CU → 55° MS | sleeping scholar ("Z Z") → jar with frogs | dissolve 6 f | scholar sleeps; a ball drops; the frogs' eyes glow |
| 37.4 | 3.1 | prison cell window | slow pull (-9 %/s) | 50° MCU through the bars | none | dissolve 5 f (through the bars) | the scholar shouts from the cell, terrified |
| 40.6 | 3.0 | castle wall walk at night | push +15 %/s, ease-out | 55° MS | none | dissolve 5 f | a guard mocks ("your frogs hungry again?") |
| 43.8 | 2.2 | castle gate at night | static (1 %W/s) | 55° MS | none | dissolve 5 f | the scholar walks with a lantern, worried |
| 46.2 | 2.6 | morning field → distant city | crane up; whip up 5 f (4.0 W/s) | 60° WS | jar and scholar → city with a smoke column | dissolve 6 f | a messenger arrives |
| 49.0 | 6.3 | inside the jar (mechanism) | slow rotating top-down: roll -15°/s, push +10 %/s | 55° TD | smoke dissolves into a glowing pendulum → rods | dissolve 13 f (smoke → interior glow) | none (mechanism explainer, bloom on the lamps) |
| 55.7 | 2.6 | jar exterior, sunset | pull -21 %/s with crane down 21 %W/s, ease-in-out | 50° CU | dragon drops the ball → frog | dissolve 13 f | none |
| 58.5 | 1.4 | far mountain; whip | pan R; whip R 17 f (3.6 W/s) | 60° WS | mountain → jar on the hill | dissolve 6 f | none |
| 59.9 | 4.9 | hill with jar → earthquake cross-section | tilt down 26 %W/s, then 12 %W/s | 60° WS → section | jar at sunset → glowing crack through the ground layers | whip; dissolve 10 f | none |

### ref4: railroad canyon (11 dissolves of median 8 f, 5 whips, 1 cut, game-engine 3D, sun and motion blur)
| start | dur | place | camera move (measured) | lens / framing | starts → ends | in | characters |
|---|---|---|---|---|---|---|---|
| 0.0 | 11.6 | **one continuous move** through 5 places (mean push +54 %/s, roll +4°/s) | low orbit around the worker sawing a rail (0-1.8 s); a 90° orbit as he stands (1.8-2.5); dolly along the rails by the cliff; the locomotive passes the lens as an **occlusion wipe** (3.0-3.5); flies out over the canyon edge and pans across trestles (3.8-7); tilts down into the canyon (7.5-8.3); tilts up to the sky as a **sky wipe** (8.5); descends to the desert and flies forward with motion blur (9.8-10.5) into the station (10.5-11.5) | 60° low rail cam (lens 0.3 m above the rails) | worker CU → tycoon on a podium | start | worker saws gaps and stands up; workers on trestles and a beam; tycoon in a top hat at "FIRST LINE IN GETS IT ALL" |
| 11.6 | 1.9 | beam over the canyon | push +9 %/s, ease-out | 55° MS, red strata streaking | none | dissolve 7 f | workers sit on a beam; the youngest grins |
| 13.7 | 7.9 | rails by the cliff | track L 27 %W/s with roll +10°/s; CU beats | 50° MCU → 45° CU | none | dissolve 8 f | the boss in a bowler leans into the lens and points; his face turns purple with steam ("my railroad"); worker answers |
| 21.9 | 2.6 | rival bridge construction, crane | push +49 %/s; whip R 18 f (3.6 W/s) | 60° WS | none | dissolve 9 f | the rival crew lays rails |
| 25.1 | 1.2 | conductor on the platform | pull -38 %/s with track R 29 %W/s | 50° MCU | none | whip | conductor in uniform, "end to end" |
| 26.3 | 2.1 | rails close-up; tycoon | push +77 %/s, ease-out | 50° → ECU | rails → sparks at the joint | dissolve 5 f | tycoon taps the rail, sparks fly |
| 28.6 | 2.5 | parlour car interior → bridge | push +80 %/s with track L 10 %W/s (peak 2.3 W/s) | 55° MS | none | dissolve 7 f | tycoon sips tea in red velvet, "without a sound" |
| 31.4 | 2.1 | train window | slow drift, roll +2°/s | 50° MCU through the window | none | dissolve 8 f | boss sweats and smokes a pipe |
| 34.0 | 2.0 | station hall | pan L 48 %W/s; whip L 16 f | 55° MS | newspaper "Clickety Clack line!" | whip | crowd reads newspapers |
| 36.3 | 7.8 | desert railside, heat | pull-out -133 %/s at the start, then a slow mixed drift; whip L 7 f | 50° low CU | calendar "MAY" → canyon wall → rails turning purple (heat colour ramp) | dissolve 8 f + whip | worker by the rail; a coin and paper slide into the gaps |
| 44.1 | 3.8 | rails, boss | pull -12 %/s with roll +4°/s | 50° MS | none | **hard cut** (1 f) | the boss steps in; two-shot argument, boss scowls |
| 48.2 | 6.2 | perfect railroad on a wooden trestle | push +31 %/s, ease-in-out | 60° low rail cam | none | dissolve 9 f | rails groan and glow pink-yellow in the sun; the tycoon sits under an umbrella |
| 54.6 | 3.5 | canyon rails | orbit: track L 15 %W/s, push +21 %/s, roll +5°/s; whip up 6 f | 45° CU | none | dissolve 9 f | worker grins at the lens, eyes wide |
| 59.6 | 3.3 | rail cam in the canyon | push +37 %/s with roll -7°/s, ease-out | 60° ground cam | none | dissolve 10 f | worker stands between the rails ("touching") |
| 63.1 | 2.1 | trestle bridge → explosion | crane down 61 %W/s; whip down 5 f (5.5 W/s); pull -132 %/s | 60° WS | bridge → train snakes and falls → fireball | dissolve 7 f | the train derails; worker and boss watch, shocked |

### ref5: Tughlaq coin (25 whips of median 12 f, 5 dissolves, 1 cut, soft clay 3D, strong DOF, 720x1280)
| start | dur | place | camera move (measured) | lens / framing | starts → ends | in | characters |
|---|---|---|---|---|---|---|---|
| 0.0 | 1.0 | goldsmith anvil, glowing coin | small push (+10 %/s); whip up 12 f (8.0 W/s) following the spark | ECU 45° | coin → spark flying up | start | a hammer strikes and sparks burst |
| 1.0 | 4.6 | durbar (red tent, courtiers) | track R 7 %W/s with crane down 6 %W/s; pull to a WS of the hall at 3.5 s | 45° MCU → 60° WS | spark lands → sultan on the platform | whip | the sultan sits cross-legged, laughs and holds up the coin ("It's 1330") |
| 5.5 | 1.6 | treasurer's room | whip R 14 f (6.7 W/s) in, whip L 15 f (5.9 W/s) out | 50° MCU | none | whip | the treasurer stares; an empty chest |
| 7.1 | 3.8 | durbar | pull -7 %/s, ease-out | 50° MCU | none | whip | the sultan stamps a law scroll and frowns |
| 10.9 | 4.7 | treasurer by chests, window light | near-static orbit (roll -2°/s), ease-out | 45° MCU, bg DOF | none | whip R 11 f (5.3 W/s) | the treasurer holds a coin to his forehead; pots appear in his hands |
| 15.6 | 2.4 | pot stack CU → durbar | whip R 7 f; small drift | ECU → MCU | none | whip | a pot stack pops up; the sultan "doesn't budge" |
| 18.0 | 1.7 | canopy → sky over the palace dome | whip R 26 f (11.3 W/s) that tilts up to the sky; dissolves of 4 f and 7 f; whip down 6 f (12 W/s) | 60° | sultan → coins flying across the sky → workshop | whip + dissolve | none (coins fly as the linking object) |
| 19.7 | 2.0 | goldsmith workshop | push +6 %/s | 45° MCU | none | whip | a goldsmith fakes coins, grinning |
| 21.7 | 7.1 | street of workshops → village square → horses → fields → clerk → street | a chain of 7 whips (whip R 44 f slide along the street, L 8, R 14, L 23, L 16, R 18 f; 7-11 W/s) with 0.5-1.5 s holds between | 45-60° | worker CUs ↔ aerial over fields | whips | workshops busy; farmers pay taxes in copper; a merchant and a soldier buy horses (horse CU); a clerk at a desk sweats |
| 28.8 | 11.6 | merchant stall (one take) | **fly-in** (+240 %/s for 10 f) from the street into the stall; then CU on the merchant; orbit to a side angle (31.7 s); a coin rain buries him (32.5-34.5); push to a CU (34.7); new framing at 38.7 s. Mean push +12 %/s, ease-out | 45° MCU | street → merchant CU | whip | the merchant weighs coins; copper coins pour and bury him; surprised eyes; he holds up a silver coin |
| 40.4 | 4.2 | ECU face → gold star → classroom | whip L 8 f; push +437 %/s into the eye; dissolve 8 f into a star sticker; whip down 10 f | ECU → 50° MS | merchant shouting "because he said so" → teacher | whip + dissolve | the teacher announces "gold stars" (match: round eye → round star) |
| 44.6 | 2.3 | classroom | push +52 %/s, roll +4°/s, ease-out | 60° WS | none | **hard cut** | stars pile up over the kids; the teacher is buried in stars |
| 47.3 | 3.8 | sky with coins → durbar | whip down 13 f; dissolve 14 f; pull -19 %/s | 60° → 50° MCU | none | whip + dissolve | coins rain; the sultan is buried in copper coins; a pigeon sits on his turban |
| 51.4 | 1.7 | fort parapet → treasury gate | pushes (+31 %/s), whips down and up (8.1 / 6.3 W/s) | 50° MCU | none | whips | the sultan with raised arms ("Bring me your copper"); the gate opens on gold |
| 53.1 | 4.5 | desert caravan → fort with copper hills | orbits: track L 19 %W/s then R 10 %W/s, push +26 %/s, ease-in-out; long sun shadows | 60° high WS | none | whips | lines of people carrying sacks; copper piles as tall as hills |
| 57.6 | 1.0 | copper hill → coin ECU | whip down 3 f at 11 W/s with roll +13°/s | ECU | none | whip | the treasurer is buried, coins flying |
| 58.6 | 6.5 | modern shop | crane up 18 %W/s, pull -6 %/s, ease-out (peak 3.6 W/s) | 50° MS → 45° CU | silver coin ECU → boy and shopkeeper → shopkeeper with a 20-rupee coin | dissolve 9 f (coin to coin) | a boy with a samosa; the shopkeeper on the phone; coin CU with a dashed "fake" circle |
| 65.0 | 5.9 | fort parapet at sunrise | whips up, right and down (9, 13, 4 f); then pull -6 %/s, ease-in-out | 50° MCU, sun burst behind | coin flies up → sultan lit from behind | whips | the sultan holds the copper coin up to the sun and smiles; merchants with coins stuck on their heads; it ends on a sweat drop |

---

## 8. Tools

```
# analyse a reference (caption band at 64-78 % of the height masked by default)
python3 scripts/analyze_video.py ref.mp4 --out /tmp/x/ref1 --label ref1
# analyse our render (no captions)
python3 scripts/analyze_video.py out/foo/final.mp4 --no-mask --out /tmp/x/foo
# compare our render to the references (PASS/WARN table)
python3 scripts/compare_to_refs.py out/foo/final.mp4 [--out /tmp/x/foo] [--json /tmp/x/foo.json]
```

- **Per-frame CSV columns:**
  - colour: luma, black and white points, contrast, sat, sat_p90, hue histogram (6 bins), warm and cool share,
    vignette;
  - diff, hist_d;
  - motion: dx and dy (%W per frame), zoom, rot, inlier ratio, parallax residual;
  - trans (transition label).
- **JSON:** global stats, transitions (cut, dissolve, whip with frames and strength), and segments (duration, in and
  out transition, motion type, speed profile, speeds, total zoom and pan, mean colour).
- **Speed:** about 80 s for an 86 s 1080x1920 video on 2 threads.
- **Known limits:**
  - A slow, low-contrast dissolve under a fast camera move can be found 1-3 frames early.
  - Some very fast dollies through blur are labelled `whip`.
  - Segment motion labels are heuristic. Use the numeric speeds.
