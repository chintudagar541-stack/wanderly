# DAGAR CLIPS – production bible (v0.1, Blender)

## 1. Reference analysis (4 reference videos)
- Characters: big round white head, thick black outline, dot eyes, thin brows, tiny coloured bean torso, long thin black stick limbs, small round hands, oval shoes. Per-character hair/hats/glasses/moustache.
- Worlds: rich 3D environments (game-engine look), props with outlines, saturated colour, god rays, shallow depth of field.
- Camera: continuous motion, dramatic angles, a dissolve about every 2.5–3 s.
- Subtitles: bold white, black outline, 1–3 words, lower centre (~70 % height).
- Format: 9:16, 1080×1920, 30 fps.

## 2. Style bible (do not change without approval)
- Line: Freestyle ink, 7 px (characters) / 3 px (props) at 1080 px width, slight wobble.
- Light: warm practical key (pendant) + cool moon rim through window, soft fill; AgX Punchy look.
- Camera: lens 27–50 mm, f/2.0–3.5, always moving; dissolve 0.2 s between shots.
- Subtitle: DejaVu Sans Bold, white, 1.2 % black stroke, centre, 70 % height.

## 3. Character bible
| ID | Name | Design |
|---|---|---|
| CHAR_001 | Walt | white head, brown spiky hair, blue bean torso, black belt, dark shoes |
Expressions (all params in `char.py` EXPR): deadpan, smile, grin, shock, scream, worry, angry, sad, smug, ohno. New characters: add a `Char(...)` call with colours/hair/hat/glasses/stache.

## 4. Architecture (`blender/dagar/`)
- `common.py` tracks (`K`, `LK`), procedural materials, Freestyle ink setup
- `char.py` character builder, procedural IK, face rig (per-frame handler)
- `kit.py` kitchen set (swap sets by adding more modules)
- `phys.py` Bullet rigid bodies (baked to keyframes) and Mantaflow liquid
- `shots.py` shot builders (camera, acting, props, physics)
- `film.json` timeline + subtitle words; `job.json` render job (mode, size, samples)
- `run.py` render runner; `plan.py` job matrix; `compose.py` join + dissolves + subtitles
- `.github/workflows/dagar.yml` GitHub render pipeline (Blender 4.2.3, Cycles)

## 5. Running it from an iPhone (free)
1. Open the repo on github.com (Safari or the GitHub app).
2. Edit `blender/dagar/job.json` (`mode`: `stills` for quick checks, `video` for the full render) and commit.
3. The Actions run starts by itself. Stills appear in `previews/dagar/`, the video as `previews/dagar/final.mp4` (and as the `video` artifact).
