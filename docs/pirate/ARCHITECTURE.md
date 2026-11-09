# Architecture: pirate short

```
blender/pirate/
  film.json    shot list: id, t0, dur, ink; subtitles; fps; resolution
  shots.py     one builder per shot (s_<id>), ocean tiers, ships, people
  inkchar.py   3D ink-style characters
  human.py     skeleton, balance, walking
  sea.py       analytic Gerstner ocean (12 waves), foam from the Jacobian, oil-film damping, rogue wave
  world.py     sky (HDRI or procedural), sea material, fog, rain
  ship.py      ship geometry, PBR wood/sails
  runp.py      CLI: still|frames <shot>
  plan.py      builds the CI job matrix
  compose.py   concat chunks, split-screen, subtitles, logo, audio synth, mux
.github/workflows/pirate.yml   CI
blender/pirate/job.json        trigger file (mode stills|video, rev)
```

## Ocean
Three patches: near (high detail, fades short waves outward), mid (900 m), far (9000 m). Each patch evaluates only the wave components its resolution can carry, fading toward its outer edge so tiers match. Foam shows only through a noise mask. Fully deterministic per frame, so chunked rendering is seamless.

## CI
Push touching `job.json` on branch `claude/dagar-blender` starts the workflow. `stills` renders one frame per shot into `previews/pirate/`. `video` renders chunks in a matrix (max 20 parallel), then a join job runs `compose.py` and pushes `previews/pirate/final.mp4`.
