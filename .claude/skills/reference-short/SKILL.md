---
name: reference-short
description: Make a complete vertical animated story short (60-90 s) in the owner's reference style: 2D cartoon characters in a dense, colourful 3D world, fast moving camera, close-ups, Michael voice at fast pace, light music. Use whenever the owner asks for a new video ("video bnao", "ye story bnao", "is topic pe video", "Diwali jaisi video", a pasted script), in any chat.
---
# Reference-style short: the full pipeline

**Engine v2 (use this):** the template is the "Clock Man" demo, `animated-shorts/src/videos/clockman/` (world.ts,
shots.ts, Clockman.tsx) with its audio in `animated-shorts/shorts/clockman/`. It renders through the shared engine
`animated-shorts/src/lib3d/` (`Short3D.tsx` renderer, `camera.ts` paths, `kit.ts` modelled props, `textures.ts`
47 procedural textures). It matches the reference videos' look: soft PBR light + shadows, ambient occlusion, thin ink,
real dissolves, continuous camera paths, the blue-shadow/warm-highlight grade. The measured reference numbers are in
`animated-shorts/writer/REFERENCE_SPEC.md`. (The older Diwali short in `src/videos/diwali2/` uses engine v1: only copy
its effects such as fireworks, diyas and water reflections.) Copy the template, don't start from zero. Read `animated-shorts/STYLE.md` and `animated-shorts/DIRECTOR_PLAYBOOK.md` first: these are the canonical visual and technical rules. If older notes conflict, follow the precedence rules in DIRECTOR_PLAYBOOK.md. Talk to the owner in Hinglish.

## 0. Setup (fresh container)
```
cd animated-shorts && npm install
bash tts/get_voices.sh   # Kokoro model + voices (not in git)
pip install -q kokoro-onnx soundfile scipy
```
- Chromium is at `/opt/pw-browsers/chromium`. Renders use software WebGL: `REMOTION_GL=swangle`.

## 1. Script
- If the owner gives a script, use it **word for word**. Only write numbers as words ("2,500" becomes "twenty five
  hundred").
- If the owner asks for a topic or idea, use the `story-script` skill and `animated-shorts/writer/` (formula, idea
  bank, `check.py`).
- Put one sentence per line in `animated-shorts/shorts/<name>/voice/script.txt`.

## 2. Voice (Michael, fast)
- Copy `shorts/diwali2/voice/make.sh` and change the paths and the `--fix` list (Indian names as phonemes).
- The settings are `--speed 1.35 --pause 0.08 --lead 0.25`, which gives about 3.8 words/s.
- To check a pronunciation: `python3 tts/lines.py script.txt out --show`.
- The output is `voice.wav`, `lines.json` and `words.json`. Use the word times to cut on words.

## 3. World (`src/videos/<name>/world.ts`, copy clockman's)
- One `World` class implementing `WorldLike<LightName>` (`root`, `fog`, `set({light, t, cam, look, shadowR})`).
- Each place is its own block about 300 units apart on x. Build with `Kit` (`k.at(pos, yaw, () => ...)`, `k.box`,
  `k.cyl`, `k.panel`, `k.floor`, `k.mesh`) and the props in `src/lib3d/kit.ts`: `desk`, `chair`, `bookshelf`,
  `cabinet`, `plant`, `wallClock`/`clockFace`, `picture`, `windowFrame`, `door`, `deskClutter`, `house`, `pine`,
  `lampPost`, `fence`. Materials: `M(color, map?, {rough, metal, emissive, ei})`; texture repeat: `rep(tex, w, h, tw, th)`.
- Textures from `src/lib3d/textures.ts` (see the `TextureSheet` composition): bricks, stoneBlocks, cobblestones,
  woodFloor, clapboardSiding, roofShingles, plaster, wallpaper, carpetTile, persianRug, marble, tiles, grass, dirt,
  sand, snow, water, metal, parchment, bookshelf, windowNight/Day, signTex, and more.
- **Every set must be FULL** (the owner's top rule): furniture, clutter, signs, plants, boxes, crowds, lights,
  foreground objects. No empty ground or bare walls. Rooms get a ceiling, skirting, a window with light coming in.
- Lights per place in `set()`: hemisphere sky/ground colours, a sun (soft PCF shadows that follow `look`), fog, point
  lamps. Interiors: strong warm sun through the window (hard yellow patches), cool bright fill. Night: blue hemi,
  warm lamp pools and lit windows, falling snow/particles, moon. Moving parts (clock hands, doors) are separate meshes
  updated in `set()` from `t`.

## 4. Characters (`outfitOf` in shots.ts)
- Cards are drawn by `src/videos/dead/toon.ts`. Always add `headStyle: "ref"` (cream head, thin outline).
- Hats: `turban`, `crown`, `cap`, `hair`, `tophat`, `fedora`, `bonnet`, `longHair` (+ `hairStyle` long/bob/ponytail/bun).
- Indian women get `jewel: true`, `dupatta`, `bindi` and `sash`. Gods richly dressed; never depict the Sikh Gurus.
- Modes: `stand`, `stroll`, `march`, `sit`, `sitFeetUp`, `lie`, `kneel`, `lean`, `run`, `jump`, `sitFloor`.
- Props: `diya`, `sparkler`, `spear`, `bow`, `point`, `["hammer", k]`, `["shovel", k]`, `["drum", k]`, `axe`,
  `letter`, `newspaper`, `cash`, `suitcase`, `phone`, `plate`, `book`, `broom`, `rope`, `garland`, `candle`, `basket`,
  `juice`, `cup`, `lantern`, `flag`, `torch`, `pot`, `umbrella`, `stick`, `bag` (`propColor`).
- Expressions: `smile`, `smile_closed`, `grin`, `laugh`, `shock`, `dazed`, `nervous`, `terror`, `asleep`, `stern`, ...
- Emotion FX: `sweat`, `steam`, `angry` (purple face), `blush`, `zzz`, `tears`, `sparkleEyes`, `question`, `exclaim`,
  `mouthOpen`.
- **Act out the key words** (reference rule): "angry" = purple face + steam, "fired" = launched out of frame with a
  spin (`roll`), "asleep" = zzz, "confused" = "?". Actor options: `scale`, `roll`, `yaw`, `tint`, `back`.

## 5. Shots (`src/videos/<name>/shots.ts`, copy clockman's)
- `const { S, add, at } = shotList<LightName>()`, then one `add({ a, b, light, dof, focus, dis, actors, cam })` per shot.
- **Camera rules, measured from the references** (details and numbers in `writer/REFERENCE_SPEC.md`):
  - **Each shot is ONE continuous move** usually 2–5 s (average 2.4–3.4 s) with several beats, built with `path([...keys])` (keys
    `{t, pos, look, fov, ease}`), `orbit(...)`, and `drift(...)` for the slight handheld breathing.
  - Open a shot with a **quick punch-in that settles** (`ease: "out"` on the key where it lands).
  - **Lens presets (single source of truth):** travel/wide/two-shots 55–65°; medium 50–60°; face close-ups 45–50°. Use low camera placement for perspective, not extreme wide-angle distortion. Big face close-ups are typically ~1–1.5 m away.
  - **Joins: short dissolves** (`dis: 0.2–0.3`) between places/beats; a plain cut only for a gag or a hard beat
    (e.g. the reaction after "fired"). No whip-pan spam.
  - Cameras track walking characters and fly through doors/windows into the next space.
- DOF on close shots (`dof` 7–12 with `focus` on the face), wider shots `dof` 4–6.
- The opening shot is the hook (the most striking picture of the story); the ending pulls out/cranes up to a wide.

## 6. Check with stills (always, before rendering)
```
cd animated-shorts && REMOTION_TMP=$PWD/.remotion-tmp REMOTION_GL=swangle COMP=<Comp> node scripts/bridge-stills.mjs out/<name>/st/a_ f1,f2,... 0.5
```
- Render one frame per shot. Make contact sheets with ffmpeg `xstack` and look at them.
- Fix anything empty, badly framed (faces cut, a pole in front of a face), or wrong. Also run the shot/world diagnostics described in `DIRECTOR_PLAYBOOK.md`; diagnostics support, but do not replace, looking at the rendered stills.

## 7. Sound (`shorts/<name>/audio/sound.py`)
- Copy diwali2's script. Keep the music light (drone, pluck melody and a soft pulse, at -16 dB under the voice,
  ducked). Use few natural SFX at the right times (fireworks, water, crowd, bells, fire, footsteps, soft whooshes on
  whips).
- Nothing cartoonish. Run it with `python3 sound.py`, which writes `mix.wav`.

## 7b. Verify against the references (always)
- After rendering: `python3 scripts/compare_to_refs.py out/<name>/final.mp4` (per-frame analysis at 30 fps of camera
  motion, transitions, colour, contrast and vignette, compared with the reference averages; fix every WARN you can).
- Also look at the render frame by frame around every transition and gag: extract with
  `ffmpeg -ss <t> -i final.mp4 -frames:v 12 out/<name>/qa/f_%02d.jpg` and view a contact sheet.

## 8. Owner approval clip, then the full render
- If the owner did not say "seedha poori bana do", first render a ~10 s clip
  (`scripts/render_chunks.sh <Comp> 315 out/<name>/clip 160`), mux it, and send it. Wait for approval.
- For the full render: `REMOTION_TMP=$PWD/.remotion-tmp REMOTION_GL=swangle scripts/render_chunks.sh <Comp> <frames> out/<name>/full 160`.
  Run it in the background. It is resumable and takes about 10–16 min per 160 frames.
- Register the composition in `src/Root.tsx`.

## 9. Mux, QA, deliver
```
ffmpeg -i out/<name>/full/joined.mp4 -i shorts/<name>/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -af loudnorm=I=-14:TP=-1:LRA=11 -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart out/<name>/final.mp4
ffmpeg -i out/<name>/final.mp4 -c:v libx264 -crf 23 -c:a copy -movflags +faststart out/<name>/<Title>.mp4
```
- QA the result: frame count, a contact sheet, and loudness.
- Send `final.mp4` (render) and the crf-23 copy (display "attach"), plus a caption: title, a Hinglish caption,
  an English caption and hashtags.
- Commit and push the code, scripts, voice and json files (not `out/`).


## 10. Visual-system authority (v3)
- `animated-shorts/DIRECTOR_PLAYBOOK.md` is the authoritative production standard for environment density, camera presets, shot rhythm, materials, lighting and QA.
- `src/lib3d/Short3D.tsx` + `src/lib3d/camera.ts` + `src/lib3d/kit.ts` are the canonical shared engine-v2 stack. Use `src/videos/clockman/` as the template.
- `src/videos/capital/` is an older/experimental composition-specific renderer and is not the default template for new shorts. Reuse an isolated effect only after checking its dependencies and compatibility.
- Never infer that a feature exists just because a skill asks for it. Inspect the implementation and report any missing feature before promising it.
