# DAGAR CLIPS: Style Bible

Channel: DAGAR CLIPS. Format: vertical 9:16 cinematic 3D shorts. Final render 1440x2560, 24 fps, Cycles ray tracing.

## Look
- Storm scenes: dark blue-grey sky and sea, heavy rain streaks, haze that deepens with distance, low-key light with a cold sun lamp. Lightning flashes are short (0.2-0.3 s).
- Gold scenes: warm tint on the sky and sun, soft haze, calm sea. The finale is golden light that fades to black, then the DAGAR CLIPS logo.
- The world is full everywhere the camera looks: ship, sea (three tiers), sky, rain, other ships, people on decks. No empty plain areas.
- Real textures: Poly Haven PBR wood and fabric and a Poly Haven HDRI sky on CI (`USE_PH=1`); procedural fallbacks locally.
- No brands or logos anywhere except the DAGAR CLIPS end card.

## Camera
- Hero shots: 28-50 mm. Drone shots: 15 mm wide, people visible on decks.
- Cameras never sit inside geometry: deck cameras are at z >= 3.8 (deck is 2.6) to clear cannons; sea-relative cameras use `seaz()` so they stay above the waves.
- Every scene must show what the voiceover says at that moment.

## Subtitles
Bold white text, black outline, about 70% of frame height, 1-3 words at a time, synced to the voice.

## Audio
Voice (loudnormed) plus storm bed, rain, thunder and an Am pad. Music/ambience about half the voice level. Hard cuts so audio stays in sync.

## Science visualisation
Oil film: smoothed, iridescent area that damps short waves; foam disappears inside it. A split-screen (WITHOUT OIL / WITH OIL) compares the same sea.
