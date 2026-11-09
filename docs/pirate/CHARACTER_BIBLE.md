# Character Bible

Style (from the approved 2D reference): egg-round white head with a thick ink outline, line or round googly eyes, blunt brows, a nose hook, a tiny mouth or gritted teeth, flat hair with strands, bean torso, thin stick limbs, white round hands, black oval shoes. Built in 3D (`blender/pirate/inkchar.py`, class `Human`) and outlined with Freestyle (collections `Characters` and `Props`).

## Cast
- Sailor (CHAR_001): bandana, beard, vest, pours the oil from a barrel.
- Captain (CHAR_002): tricorn hat, navy coat with gold buttons and cravat, grey beard.
- Crew: bandanas, vests, sashes, varied builds.
- Pirates: dark shirts, bandanas, beards, shouting.

## Expressions
neutral, smile, angry, furious, shout, confused, terror, strain, surprise, smirk. Each is a mouth/brow/eye pose; set per shot with `H.expr_track([(t, name), ...])`.

## Movement
Characters keep balance on the pitching deck (`Balance` in `human.py`): feet stay planted, torso counter-leans from the ship's acceleration. Walks use a physics-based gait.

## Line thickness
Ink thickness is set per shot with the `ink` key in `film.json` ([character px, prop px]); small or distant characters need thinner lines.
