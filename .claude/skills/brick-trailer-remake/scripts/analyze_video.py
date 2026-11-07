#!/usr/bin/env python3
"""Analyze a source video for a shot-for-shot brick-style remake.

Outputs (in --out):
  analysis.json  - fps, size, duration, detected cuts, black/fade segments,
                   a shot skeleton (start/end per shot) and a per-frame audio
                   loudness envelope (0..1) used for mouth flaps.
  shots.png      - one thumbnail per detected shot, tiled, for framing notes.

Usage: python3 analyze_video.py SOURCE.mp4 --out DIR [--threshold 0.2]
"""
import argparse, json, os, re, subprocess, sys

import numpy as np


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True).stderr


def probe(src):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
         "stream=width,height,r_frame_rate:format=duration", "-of", "json", src],
        capture_output=True, text=True).stdout
    j = json.loads(out)
    s = j["streams"][0]
    num, den = map(int, s["r_frame_rate"].split("/"))
    return s["width"], s["height"], num / den, float(j["format"]["duration"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--out", required=True)
    ap.add_argument("--threshold", type=float, default=0.2,
                    help="scene-change score that counts as a cut")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    w, h, fps, dur = probe(a.src)

    log = run(["ffmpeg", "-hide_banner", "-i", a.src, "-vf",
               f"select='gt(scene,{a.threshold})',showinfo", "-f", "null", "-"])
    cuts = [float(x) for x in re.findall(r"pts_time:([0-9.]+)", log)]

    log = run(["ffmpeg", "-hide_banner", "-i", a.src, "-vf",
               "blackdetect=d=0.05:pix_th=0.08", "-f", "null", "-"])
    blacks = [(float(s), float(e)) for s, e in
              re.findall(r"black_start:([0-9.]+) black_end:([0-9.]+)", log)]

    bounds = sorted(set([0.0, dur] + cuts + [b for seg in blacks for b in seg]))
    merged = [bounds[0]]
    for b in bounds[1:]:
        if b - merged[-1] > 0.1:  # drop sub-0.1s slivers (flash frames)
            merged.append(b)
    merged[-1] = dur
    shots = []
    for s, e in zip(merged, merged[1:]):
        black = any(bs - 0.05 <= s and e <= be + 0.05 for bs, be in blacks)
        shots.append({"start": round(s, 3), "end": round(e, 3),
                      "type": "black" if black else "TODO"})

    # Audio loudness envelope, one value per video frame.
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", a.src, "-ac", "1", "-ar",
                          "16000", "-f", "s16le", "-"], capture_output=True).stdout
    env = []
    if pcm:
        x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
        hop = 16000 / fps
        n = int(dur * fps)
        rms = np.array([np.sqrt(np.mean(x[int(i * hop):int((i + 1) * hop)] ** 2) + 1e-9)
                        for i in range(n)])
        db = 20 * np.log10(rms)
        env = np.clip((db + 40) / 35, 0, 1).round(3).tolist()

    analysis = {"source": os.path.basename(a.src), "width": w, "height": h,
                "fps": fps, "duration": dur, "cuts": cuts, "black": blacks,
                "shots": shots, "audioEnv": env}
    with open(os.path.join(a.out, "analysis.json"), "w") as f:
        json.dump(analysis, f, indent=1)

    thumbs = os.path.join(a.out, "thumbs")
    os.makedirs(thumbs, exist_ok=True)
    for i, s in enumerate(shots):
        t = (s["start"] + s["end"]) / 2
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", a.src,
                        "-frames:v", "1", "-vf",
                        f"scale=320:-1,drawtext=text='{i + 1}  {s['start']:.2f}s':"
                        "x=6:y=6:fontcolor=yellow:fontsize=18",
                        os.path.join(thumbs, f"s{i + 1:03d}.png")])
    cols = 6
    rows = (len(shots) + cols - 1) // cols
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(thumbs, "s%03d.png"),
                    "-vf", f"tile={cols}x{rows}", "-frames:v", "1",
                    os.path.join(a.out, "shots.png")])
    print(f"{len(shots)} shots, {len(cuts)} cuts, {len(blacks)} black segments "
          f"-> {a.out}/analysis.json, {a.out}/shots.png")


if __name__ == "__main__":
    sys.exit(main())
