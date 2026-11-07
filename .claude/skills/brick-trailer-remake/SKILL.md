---
name: brick-trailer-remake
description: Remake a short video shot-for-shot (same timings, cuts, framing, fades, title cards) as a 3D toy-brick style animation with ORIGINAL characters, rendered with three.js in headless Chromium. Use when asked to recreate a video/trailer "in brick/lego style".
---

# Brick trailer remake

Pipeline: analyze source -> author shot list -> render stills -> review -> render video.

1. `npm install` in `scripts/` (installs three.js; Playwright/Chromium are preinstalled).
2. Analyze: `python3 -I scripts/analyze_video.py SRC.mp4 --out DIR`
   - writes `DIR/analysis.json` (cuts, black segments, shot skeleton, per-frame audio envelope) and `DIR/shots.png`.
   - Low-contrast cuts (title -> dark shot) can be missed: check every shot over ~2 s with a 6 fps contact strip.
3. Author `shots/<name>.json`: `cast` (figure specs), `shots` (`set`, `actors`, `cam`, `type: title|black`, `fadeIn/fadeOut/flashIn/flashOut`, `bloom`, `light` overrides). See `shots/trailer30.json`.
4. Preview: `node scripts/render.cjs --shots shots/X.json --analysis DIR/analysis.json --stills 0.5,3.2 --stillsDir OUT`
5. Video: `node scripts/render.cjs --shots shots/X.json --analysis DIR/analysis.json --out out.mp4 [--audio track.m4a]`

Rules: characters, costumes, logos and title text must be original. Never copy a film's or
brand's characters, costumes or logos, and never use a toy company's trademark. Only mux audio
the user has the rights to use.

Sets: shipRound, villainSky, cathedral, desert, hall, storm, shipInterior, city, logo, studio.
Figure spec keys: skin, hairStyle (short|long|hood|helmet), hair, beard, paint, mask, goggles,
expr (grim|smile), torso, print (armor|jacket|jumpsuit|robe), accent, emblem, arms, hands, legs,
boots, pads, cape, robe, glow, prop {tip, blade, color, len, offset, always}, scale.
