# cartoon-shorts

Renders vertical cartoon shorts with three.js (via headless Chromium + Playwright) on GitHub Actions.
Blender (`bpy`) is installed on the runner too, for any shot that needs a Blender render.

## Layout
Each video lives in `cartoon-shorts/<name>/` and needs:
- `web/` (index.html, main.js, story.js, ...) and `render.mjs` (`node render.mjs <outdir> "<start>-<end>"`)
- `voice.mp3` (the untouched voiceover), plus `audio.py` and `mix.py` for the music/SFX stems
- `finish.sh "<Title>"` to encode the final MP4

## Run
Actions -> "Render cartoon short" -> Run workflow -> enter the folder name. Download the `cartoon-short` artifact.
