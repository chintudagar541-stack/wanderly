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

## 7. Tools

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
