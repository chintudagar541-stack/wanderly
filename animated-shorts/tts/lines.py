"""Line-by-line Kokoro voiceover with exact line timings (lines.json) and optional phoneme overrides.

usage: python3 tts/lines.py <script.txt> <out_dir> [--voice am_michael] [--speed 0.97] [--fix word=phonemes ...]
Writes <out_dir>/voice.wav and <out_dir>/lines.json ([{i,text,start,end}], seconds).
"""
import argparse, json, os, re
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument("script"); ap.add_argument("out")
ap.add_argument("--voice", default="am_michael"); ap.add_argument("--speed", type=float, default=0.97)
ap.add_argument("--lead", type=float, default=0.5); ap.add_argument("--pause", type=float, default=0.4)
ap.add_argument("--fix", nargs="*", default=[], help="word=phonemes replacements applied to the phonemized line")
ap.add_argument("--show", action="store_true", help="print phonemes per line and exit")
a = ap.parse_args()
k = Kokoro(os.path.join(HERE, "models/kokoro-v1.0.onnx"), os.path.join(HERE, "models/voices-v1.0.bin"))
fix = [f.split("=", 1) for f in a.fix]
lines = [l.strip() for l in open(a.script, encoding="utf-8").read().splitlines() if l.strip()]
sr, parts, t, meta = 24000, [np.zeros(int(a.lead * 24000), np.float32)], a.lead, []
for i, line in enumerate(lines):
    ph = k.tokenizer.phonemize(line, "en-us")
    for w, p in fix:
        ph = ph.replace(k.tokenizer.phonemize(w, "en-us").strip(), p)
    if a.show:
        print(i, ph); continue
    audio, sr = k.create(ph, voice=a.voice, speed=a.speed, is_phonemes=True)
    nz = np.where(np.abs(audio) > 0.01)[0]
    audio = audio[max(0, nz[0] - 240): nz[-1] + 480] if len(nz) else audio
    meta.append({"i": i, "text": line, "start": round(t, 2), "end": round(t + len(audio) / sr, 2)})
    gap = a.pause + (0.25 if line.endswith((".", "?", "!")) and len(line) > 40 else 0)
    parts += [audio.astype(np.float32), np.zeros(int(gap * sr), np.float32)]
    t += len(audio) / sr + gap
if not a.show:
    out = np.concatenate(parts); out = out / np.max(np.abs(out)) * 0.89
    sf.write(os.path.join(a.out, "voice.wav"), out, sr)
    json.dump(meta, open(os.path.join(a.out, "lines.json"), "w"), indent=1)
    print(f"{len(out)/sr:.1f} s, {len(meta)} lines")
