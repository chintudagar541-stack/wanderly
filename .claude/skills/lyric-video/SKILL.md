---
name: lyric-video
description: Build a 16:9 lyric video from a song and a lyrics file with word-level forced alignment. Style: a 3D tilting lyrics card, then the singer as glowing red particles with big pop lyrics. Supports placeholder previews.
---

# Lyric video

1. `pip install torch torchaudio transformers` and `npm install` in `scripts/` (Hugging Face must be reachable for the aligner model).
2. Align: `python3 scripts/align.py song.mp3 lyrics.txt --out timing.json`
   - lyrics.txt has one line per lyric line; `[Section]` lines start sections (the second section starts part B).
   - The lyrics may be an excerpt: wildcard tokens skip the rest of the song, and the clip is cut to the sung part.
3. Preview: `node scripts/render.cjs --timing timing.json --placeholder --stills 2,10,30 --stillsDir out/`
4. Render: `node scripts/render.cjs --timing timing.json --song song.mp3 --out video.mp4 [--singer photo.png] [--credit "Artist - Song"]`

Only render real lyrics for songs the user owns or has rights to; otherwise show previews with `--placeholder`.
