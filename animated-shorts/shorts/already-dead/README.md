# The Man Who Was Already Dead (Dagar Clips)

85 s vertical horror short in the cartoon-3D style (flat ink-outlined characters in a toon-shaded 3D apartment).

- Voiceover: `voice/voice.mp3` (yours). Word timings: `voice/words.json` (pocketsphinx, offline).
- Picture: `src/videos/dead/` — composition `DeadShort` (1080x1920, 30 fps, 2550 frames).
  - `shots.ts`: the 32 shots, timed to the voice; cameras, actors, world state, knocks/shakes.
  - `world.ts`: apartment, hallway, bedroom, lights (night / hall / day). `toon.ts`: characters (+ creepy/terror faces,
    phone poses, back view). `inserts.tsx`: phone screens, police report, peephole + security-camera overlays.
  - Reuses `../bridge/ink.ts` (world ink lines) and `../bridge/grade.ts` (colour grade).
- Sound: `audio/sound.py` → `audio/mix.wav` (synth SFX + drone score ducked under the voice) and `audio/stems/`.

## Render
```bash
REMOTION_GL=swangle npx remotion render src/index.ts DeadShort out/dead/video.mp4 --codec h264 --crf 18 --concurrency=3 --timeout=180000
python3 shorts/already-dead/audio/sound.py
ffmpeg -i out/dead/video.mp4 -i shorts/already-dead/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -af loudnorm=I=-14:TP=-1 -c:a aac -b:a 192k -shortest out/dead/final.mp4
```
On a machine with a GPU, drop `REMOTION_GL=swangle` and `--concurrency`, and add `--scale 1.3333` for 1440x2560.
