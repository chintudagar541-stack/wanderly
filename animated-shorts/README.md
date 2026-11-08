# Animated shorts (Remotion + three.js)

A Remotion project for 55-70 s vertical cartoon shorts ("2D characters in a 3D world"), set up from the
`cartoon-3d-short` skill (https://github.com/mromidev/claude-animated-shorts). It ships with the example short
**The Bridge That Fell for a Song** (`src/videos/bridge/`, composition `BridgeShort`, 1080x1920 @ 30 fps).

## Setup
```bash
npm install
pip install -r requirements.txt   # audio scripts (numpy, scipy, pillow); ffmpeg must be on PATH
```

Pinned stack: React 18, three 0.169, @react-three/fiber 8, @react-three/postprocessing 2, Remotion 4.0.541.
Do not move to @react-three/postprocessing 3: it builds its composer one effect tick late, and every Remotion
still comes out blank.

## Commands
| Task | Command |
|---|---|
| Preview in the browser | `npm run studio` |
| Type check | `npm run typecheck` |
| Test stills (half size) | `node scripts/bridge-stills.mjs out/bridge/s_ 60,900,1500 0.5` |
| Final 2K render (1440x2560) | `npm run render`, then mux the audio with `-map 0:v:0 -map 1:a:0` |

`INPUT_PROPS='{"post":{"ink":false}}'` toggles post effects for stills; `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx`
renders a sandbox copy.

## Environment variables
- `REMOTION_TMP`: where bundles go (each one copies `public/`). Point it at a big drive.
- `REMOTION_GL`: `angle` (default, needs a GPU) or `swangle` (software WebGL for machines without a GPU,
  e.g. cloud containers; about 6 s per half-size frame, so use it for stills and short clips).
- `CHROME_PATH`: the Chrome/Chromium to use. It defaults to `/opt/pw-browsers/chromium` when that exists.

## Optional assets
`src/videos/bridge/world.ts` loads Kenney CC0 models (Nature Kit and others) from `public/bridge/kenney/<name>.glb`.
The scene renders without them, with missing trees and props skipped. Download them from https://kenney.nl
to add them.

## Layout
- `src/videos/<name>/`: one folder per short (copy `bridge/` to start a new one, register it in `src/Root.tsx`)
- `audio/`: synthesized SFX, music and the mix (Python)
- `scripts/`: stills, side-by-side sheets, sandbox merge, frame QA
- `SCRIPT_example.md`: example script with facts and sources
