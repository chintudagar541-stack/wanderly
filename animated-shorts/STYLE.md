# House style for every short (owner's standing instructions)

These come straight from the channel owner. Apply all of them to every new video without being reminded. For technical conflicts, `animated-shorts/DIRECTOR_PLAYBOOK.md` is the canonical tie-breaker; the measured `writer/REFERENCE_SPEC.md` takes precedence over older approximate notes.

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
- Kokoro TTS, **am_michael only** (the owner confirmed this on 2026-11-07). Use no other voice.
- **Fast pace like the reference shorts (about 3.8 words/s):**
  `python3 tts/lines.py script.txt outdir --speed 1.35 --pause 0.08 --lead 0.25`
- Indian names get Indian pronunciation via `--fix word=phonemes`. Keep a `make.sh` in each `shorts/<name>/voice/`.
  Examples: `shorts/diwali2/voice/make.sh` (Ayodhya, Ramayana, Hargobind, Kolkata, Narakasura, Varanasi...).
- If the owner gives their own script, use it word for word. Only write numbers out as words for TTS
  ("2,500" becomes "twenty five hundred").

## Picture
- **"Like the reference" means the reference videos the owner sent (Tughlaq coin, Diwali, and others), NOT our own
  older videos.** Match their look: big close-ups of characters, rich colourful sets, and fast moving cameras.
- **ALWAYS, in every video: a moving camera, a full ("bhara hua") environment, and close-ups.** The owner repeats this
  a lot, so treat it as the top rule.
- Reference Diwali look:
  - A violet/purple night grade with warm diya glow and fireworks.
  - It opens and closes on a family in front of a glowing doorway, with rangoli and a big diya in the foreground.
  - Gods and kings are richly dressed cartoon characters (crowns, jewels, blue-skinned Ram and Krishna).
  - Each city is a dense set: Ayodhya palace on the river with a swan boat and diyas on the ghats; Golden Temple
    with fireworks; Gwalior fort gate; a line of 52 turbaned kings; Goa palms with a giant green Narakasura
    effigy on scaffolding.
- **No title cards and no captions.** Start straight on a scene.
- **Backgrounds are always full.** Nothing may look empty ("khali khali"): props everywhere (pots, carts, stalls,
  lamps, trees, banners, carpets, books, crates), crowds of background characters, patterned surfaces
  (carpets, tiles, fabrics, wallpapers), foreground objects to frame shots. Check every still for empty areas
  before rendering.
- **Camera and transitions, measured from the references (2026-11-07). These replace the old "cut every second" rule:**
  - **(Almost) no hard cuts.** Frame-difference analysis of the four 60 s references found only a handful of hard cuts.
  - **Between places: a dissolve** of about 0.2 s (6 frames), often matched on an object at the same screen position.
  - **Inside a place: one long, continuous camera move** of 2–5 s with several beats: push in, orbit, crane up/down,
    pull out. The frame "changes every second" because the camera and the characters keep moving, not because of cuts.
  - The camera **tracks characters** as they walk, and **flies through doors and windows** into the next room.
  - **Lens presets (canonical):** 55–65° for travel/wides/two-shots; 50–60° for medium shots; 45–50° for face close-ups. Keep the camera low when the composition needs strong perspective; do not fake perspective with an ultra-wide lens. See `DIRECTOR_PLAYBOOK.md`.
  - Moves are eased. Openings use a quick **punch-in that settles** (ease-out). There is no shaky whip-pan spam.
  - On key words, characters do the thing the word says: face turns purple + steam on "purple", launched on "fired".
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
- **Canonical engine v2 for new shorts:** `src/lib3d/Short3D.tsx` with `src/lib3d/camera.ts`, `src/lib3d/kit.ts` and `src/lib3d/textures.ts`; use `src/videos/clockman/` as the starter template.
- `src/videos/capital/Capital.tsx` is an older/experimental composition-specific renderer, not the default template. Its effects may be reused only after checking compatibility with engine v2.
- Build each set as its own Batch so meshes cull. Interiors and far sets go far apart.
- Run the world/shot diagnostics in `src/lib3d/quality.ts` during development, then inspect actual contact sheets. A passing diagnostic is not visual approval.
- Test stills: `REMOTION_TMP=$PWD/.remotion-tmp REMOTION_GL=swangle COMP=<Comp> node scripts/bridge-stills.mjs out/<x>/st/a_ f1,f2 0.5`.
- Character design check: the `ToonTest` composition, a line-up sheet.
