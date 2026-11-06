"""Offline English TTS with Kokoro-82M (Apache-2.0) via kokoro-onnx.

Setup (once): pip install kokoro-onnx soundfile
  models/kokoro-v1.0.onnx + models/voices-v1.0.bin from
  https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0

Usage:
  python3 tts/speak.py --voice am_michael --speed 1.0 --out voice.wav "Your text here"
  python3 tts/speak.py --voice am_michael --file script.txt --out voice.wav
  python3 tts/speak.py --list
Each paragraph/line of the script becomes one sentence block with a short pause between blocks.
"""
import argparse
import os
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
M = os.path.join(HERE, "models")

ap = argparse.ArgumentParser()
ap.add_argument("text", nargs="?")
ap.add_argument("--file")
ap.add_argument("--voice", default="am_michael", help="a voice name, or a blend like am_michael:0.5,am_adam:0.5")
ap.add_argument("--speed", type=float, default=1.0)
ap.add_argument("--lang", default="en-us", help="en-us or en-gb (use en-gb for bm_* voices)")
ap.add_argument("--pause", type=float, default=0.45, help="seconds of silence between lines")
ap.add_argument("--out", default="out.wav")
ap.add_argument("--list", action="store_true")
a = ap.parse_args()

k = Kokoro(os.path.join(M, "kokoro-v1.0.onnx"), os.path.join(M, "voices-v1.0.bin"))
if a.list:
    print(" ".join(sorted(k.get_voices())))
    raise SystemExit
voice = a.voice
if ":" in a.voice:  # blend of voice styles, weights normalised
    pairs = [(n, float(w)) for n, w in (x.split(":") for x in a.voice.split(","))]
    tot = sum(w for _, w in pairs)
    voice = sum(k.get_voice_style(n) * (w / tot) for n, w in pairs)
text = open(a.file, encoding="utf-8").read() if a.file else a.text
lines = [l.strip() for l in text.replace("…", "...").replace("’", "'").splitlines() if l.strip()]
parts, sr = [], 24000
for line in lines:
    audio, sr = k.create(line, voice=voice, speed=a.speed, lang=a.lang)
    parts += [audio, np.zeros(int(a.pause * sr), dtype=np.float32)]
out = np.concatenate(parts) if parts else np.zeros(1, dtype=np.float32)
out = out / max(1e-6, np.max(np.abs(out))) * 0.89
sf.write(a.out, out, sr)
print(f"{a.out}: {len(out) / sr:.1f} s, voice {a.voice}, speed {a.speed}")
