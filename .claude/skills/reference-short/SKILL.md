---
name: reference-short
description: Make a complete vertical animated story short (60-90 s) in the owner's reference style: 2D cartoon characters in a dense, colourful 3D world, fast moving camera, close-ups, Michael voice at fast pace, light music. Use whenever the owner asks for a new video ("video bnao", "ye story bnao", "is topic pe video", "Diwali jaisi video", a pasted script), in any chat.
---
# Reference-style short: the full pipeline

The template is the Diwali short, "Why India Celebrates Diwali Differently". Its code is in
`animated-shorts/src/videos/diwali2/` and its audio in `animated-shorts/shorts/diwali2/`. Copy it, don't start from
zero. Read `animated-shorts/STYLE.md` first: the owner's rules there always apply. Talk to the owner in Hinglish.

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

## 3. World (`src/videos/<name>/world.ts`)
- Copy diwali2/world.ts. Each place is its own block (its own `Batch`, about 400 units apart on x).
- Available pieces:
  - Points lights: `diya()`, `lightString()`, `Flames`.
  - Decor: `garland()`, `kandil()`, `toran()`.
  - Water with flame reflections (`refl`).
  - Fireworks (`Burst`).
  - Fire that ignites bottom-up (`burn`).
  - Opening doors (`gate`).
  - Painted canvas textures for walls, windows, fabric, rangoli and tiles.
- **Every set must be FULL** (the owner's top rule): props, crowds, patterns, lights, and foreground objects.
  No empty ground or empty walls.
- Lights: `LightName` entries with sky gradient + hemi/sun/fog per place; grades in `<Name>.tsx` (`GRADES`).

## 4. Characters (`outfitOf` in shots.ts)
- Cards are drawn by `src/videos/dead/toon.ts`.
- Hats: `turban`, `crown`, `cap`, `hair`, `tophat`, `fedora`, `bonnet`, and `longHair` (women; set `hairStyle` to
  long, bob, ponytail or bun).
- Indian women get `jewel: true`, `dupatta`, `bindi` and `sash`.
- Gods are richly dressed: crown, a blue skin for Raam and Krishna, and jewels. Don't depict the Sikh Gurus: show
  light instead.
- Props: `diya`, `sparkler`, `spear`, `bow`, `point`, `["hammer", 0..1]`, `axe`, `letter`, `newspaper`, `cash`,
  `suitcase`, and others.
- Expressions: `smile`, `grin`, `laugh`, `shock`, `dazed`, `nervous`, `creepy`, `terror`, `asleep`, `stern`, and others.
- Actor options: `scale` (giant effigies and idols), `roll` (falling), `tint`, `wave`, `back` (seen from behind),
  `mode` (stand, stroll, march, sit).

## 5. Shots (`src/videos/<name>/shots.ts`)
- Write one `add({ a, b, light, dof, cam: move(A, B), actors, fx, whip })` per shot.
- **Angle changes every 0.7–1.8 s**, cut on words. There are a lot of **close-ups** of faces (camera about 2 m away,
  fov 34–40), a few wides, and a `whip: ±1` on beat changes.
- The camera always moves: `move()` keeps a constant speed, and you can also orbit or crane.
- Use DOF on close shots (`dof` 10–26, plus `focus`) and `warm` point lights on faces at night.
- The opening and closing shots use the same "home" scene, so the video ends where it started.

## 6. Check with stills (always, before rendering)
```
cd animated-shorts && REMOTION_TMP=$PWD/.remotion-tmp REMOTION_GL=swangle COMP=<Comp> node scripts/bridge-stills.mjs out/<name>/st/a_ f1,f2,... 0.5
```
- Render one frame per shot. Make contact sheets with ffmpeg `xstack` and look at them.
- Fix anything empty, badly framed (faces cut, a pole in front of a face), or wrong.

## 7. Sound (`shorts/<name>/audio/sound.py`)
- Copy diwali2's script. Keep the music light (drone, pluck melody and a soft pulse, at -16 dB under the voice,
  ducked). Use few natural SFX at the right times (fireworks, water, crowd, bells, fire, footsteps, soft whooshes on
  whips).
- Nothing cartoonish. Run it with `python3 sound.py`, which writes `mix.wav`.

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
