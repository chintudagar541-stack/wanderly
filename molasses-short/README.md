# Molasses Tank short (Three.js)

A 67 s vertical film built with Three.js (r160). Toon materials, inverted-hull outlines, canvas-painted textures, a dissolve compositor and word-by-word captions.

## Run it
```
npm install            # installs playwright (three.js is already in node_modules/three)
npx playwright install chromium
npm run dev            # open http://localhost:5173
```
The page plays in real time. Voice uses the browser's built-in speech as a placeholder.

## Render the mp4
```
node render.mjs 1080 30         # width, fps  -> molasses-short.mp4
node stills.mjs 4,20,39 360     # quick PNG/JPG look checks into ./stills
```
To add a real voiceover, put it at `audio/voice.mp3` (or `.wav`) and run the render again, or only the final ffmpeg step.

## Where to change things
- `src/script.js`: voiceover lines and their start times.
- `src/main.js`: `B` (shot boundaries) and `SHOTS` (camera positions, fov, mood, dissolve length); `MOODS` (light and sky); `makeChar` (character design); the world blocks (street, tank, interior, harbour, courtroom).
