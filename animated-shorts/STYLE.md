# House style for every short (owner's standing instructions)

These come straight from the channel owner. Apply all of them to every new video without being reminded.

## Workflow
1. Write the script, make the voice, build the world, and check with test stills.
2. **Before the full render, render a ~10 s clip** (the opening, with final sound) and send it.
   Wait for "theek hai / poori bana do". If the owner asks for changes, make them and send a new clip.
3. Full render (`scripts/render_chunks.sh <Comp> <frames> <outDir>`), mux the sound, then QA
   (frame count, loudness about -14 LUFS, contact sheet).
4. Deliver: the video (render card), **a smaller download copy** (`-crf 23`, sent with display "attach"; the
   full-size file did not download on the owner's phone), and **a caption**: title, Hinglish caption, English
   caption, hashtags.
5. Commit and push everything (except big media) to the working branch.

## Script
- **Follow `writer/FORMULA.md`** (from the 10M-view reference shorts):
  - a weird one-line hook
  - a "You see," context line
  - a nobody vs a mocking crowd, with quoted dialogue
  - escalation
  - a one-line twist
  - the hidden mechanism
  - a short ironic punchline, then a hard stop
- 215–240 words, about 60 s. Check the script with `python3 writer/check.py script.txt`.
- For ideas, use `writer/ideas.md` (an idea bank) and the `story-script` skill.
- Get the facts right. Hedge folklore with "one story says".

## Voice
- Kokoro TTS, **am_michael** (default). The owner is comparing free look-alike voices of the reference narrator in
  `tts/voice_match_demo.mp3` (Eric, Piper Ryan, Eric+Fenrir, Eric pitched up). If the owner picks one, write it here.
- **Fast, energetic pace**, like the reference shorts: `python3 tts/lines.py script.txt outdir --speed 1.12 --pause 0.14 --lead 0.3`
  (about 2.9 words/s, tiny gaps between lines).
- Indian names get Indian pronunciation via `--fix word=phonemes` (Raam, Raavan, Lakshman, Ayodhyaa,
  Tughlak, Daulatabad, ...).

## Picture
- **No title cards and no captions.** Start straight on a scene.
- **Backgrounds are always full.** Nothing may look empty ("khali khali"): props everywhere (pots, carts, stalls,
  lamps, trees, banners, carpets, books, crates), crowds of background characters, patterned surfaces
  (carpets, tiles, fabrics, wallpapers), foreground objects to frame shots. Check every still for empty areas
  before rendering.
- **Camera like the reference (Tughlaq coin / Diwali shorts):**
  - Lots of **close-ups** and medium close-ups of faces and props. Wides are only for establishing shots.
  - The **angle changes about every 1–1.5 s**, with cuts on words.
  - The camera **never stands still**: steady push-ins, dollies, orbits, a little handheld drift.
  - Fast moves and **whip pans** (yaw swing + motion blur) on beat changes.
  - **Depth of field** on close shots (background soft, subject sharp), plus sun shadows and glow on lights.
- Characters act: talking mouths (`talk()`), gestures, props in hands, blinking, sparkle glints on key props.
- **Women characters** (toon.ts): hair is drawn behind the body.
  - Use `hat: "longHair"` + `hairStyle: "long" | "bob" | "ponytail" | "bun"`.
  - Indian women: `jewel: true` (jhumkas, necklace, maang tikka), `dupatta`, `bindi`, `sash` (gold border).
  - Other countries: no jewel or dupatta, a hairstyle and colours to suit (blonde bob, red ponytail, ...).
  - Never the old egg-shaped dress blob.

## Sound
- Music **light** and low under the voice. Only a few, natural sound effects. No cartoonish SFX
  (no horns, "wah-wah", cash registers, ...).

## Engine notes
- New-style renderer: `src/videos/capital/Capital.tsx`. It has the lens blur (needs `EffectComposer multisampling 4`,
  or the frame goes black), bloom, PCF soft sun shadows that follow the subject, whip pans, and handheld drift.
  Shots: `move()` / `orbit()` in `capital/shots.ts`.
- Build each set as its own Batch so meshes cull. Interiors and far sets go far apart.
- Test stills: `REMOTION_TMP=$PWD/.remotion-tmp REMOTION_GL=swangle COMP=<Comp> node scripts/bridge-stills.mjs out/<x>/st/a_ f1,f2 0.5`.
- Character design check: the `ToonTest` composition, a line-up sheet.
