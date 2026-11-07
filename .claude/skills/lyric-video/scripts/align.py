#!/usr/bin/env python3
"""Word-level forced alignment of a lyrics excerpt against a full song.

The lyrics file may cover only part of the song: a wildcard <star> token at both
ends lets the aligner skip the unsung intro/outro, so the result also tells us
which slice of the song to keep.

Usage: python3 align.py SONG.mp3 lyrics.txt --out timing.json [--pad 1.2 2.0]
lyrics.txt: one lyric line per line; lines like "[Pre-Chorus: X]" start a new section.
Output JSON: {segment:{start,end}, sections:[{name,start}], lines:[{section, words:[{w,start,end}]}],
              env:[...per-frame loudness at 30 fps, relative to segment start]}
"""
import argparse, json, re, subprocess, sys

import numpy as np
import torch
import torchaudio.functional as AF
from transformers import AutoModelForCTC, AutoTokenizer

MODEL = "MahmoudAshraf/mms-300m-1130-forced-aligner"
SR = 16000


def load_audio(path):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768


def parse_lyrics(text):
    sections, lines, cur = [], [], "Verse"
    for raw in text.splitlines():
        s = raw.strip()
        if not s:
            continue
        m = re.match(r"^\[(.+?)\]$", s)
        if m:
            cur = m.group(1); continue
        words = s.split()
        if words:
            lines.append({"section": cur, "words": words})
    return lines


def norm(w):
    w = w.lower().replace("’", "'")
    return re.sub(r"[^a-z']", "", w)


def emissions(model, audio, chunk=30.0, ctx=2.0):
    """Log-probs for the whole song, computed in overlapping chunks (frame = 20 ms)."""
    out, step, c = [], int(chunk * SR), int(ctx * SR)
    with torch.inference_mode():
        for s in range(0, len(audio), step):
            a, b = max(0, s - c), min(len(audio), s + step + c)
            x = torch.from_numpy(audio[a:b]).unsqueeze(0)
            lp = torch.log_softmax(model(x).logits[0], dim=-1)
            fps = lp.shape[0] / ((b - a) / SR)
            i0 = int(round((s - a) / SR * fps)); i1 = i0 + int(round(min(step, len(audio) - s) / SR * fps))
            out.append(lp[i0:i1])
    lp = torch.cat(out)
    return lp, len(audio) / SR / lp.shape[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("song"); ap.add_argument("lyrics"); ap.add_argument("--out", required=True)
    ap.add_argument("--pad", nargs=2, type=float, default=[1.2, 2.0], help="seconds kept before/after the sung part")
    a = ap.parse_args()

    lines = parse_lyrics(open(a.lyrics, encoding="utf-8").read())
    tok = AutoTokenizer.from_pretrained(MODEL)
    model = AutoModelForCTC.from_pretrained(MODEL).eval()
    vocab = tok.get_vocab()
    blank = vocab.get("<blank>", vocab.get("<pad>", 0))

    audio = load_audio(a.song)
    lp, sec_per_frame = emissions(model, audio)
    star = lp.shape[1]
    lp = torch.cat([lp, torch.zeros(lp.shape[0], 1)], dim=1)  # wildcard column

    # token sequence: <star> word word ... <star>; remember which tokens belong to which word
    tokens, owner = [star], [-1]
    flat = [(li, wi, w) for li, ln in enumerate(lines) for wi, w in enumerate(ln["words"])]
    for k, (_, _, w) in enumerate(flat):
        for ch in norm(w):
            if ch in vocab:
                tokens.append(vocab[ch]); owner.append(k)
    tokens.append(star); owner.append(-1)

    ali, scores = AF.forced_align(lp.unsqueeze(0), torch.tensor([tokens], dtype=torch.int32), blank=blank)
    ali = ali[0].tolist()
    # walk the path: every non-blank frame advances or repeats a token
    spans, ti, prev = {}, -1, None
    for f, t in enumerate(ali):
        if t == blank:
            prev = None; continue
        if t != prev or prev is None:
            ti += 1
        prev = t
        k = owner[ti]
        if k >= 0:
            s, e = spans.get(k, (f, f)); spans[k] = (min(s, f), max(e, f))
    times = []
    for k in range(len(flat)):
        s, e = spans.get(k, (None, None))
        times.append([s * sec_per_frame if s is not None else None, (e + 1) * sec_per_frame if e is not None else None])
    # words with no usable letters inherit their neighbour's time
    for i, (s, e) in enumerate(times):
        if s is None:
            ref = next((times[j] for j in range(i - 1, -1, -1) if times[j][1] is not None), [0, 0])
            times[i] = [ref[1], ref[1] + 0.2]

    first, last = times[0][0], max(e for _, e in times)
    seg0, seg1 = max(0.0, first - a.pad[0]), min(len(audio) / SR, last + a.pad[1])
    out_lines, sections, k = [], [], 0
    for ln in lines:
        ws = []
        for w in ln["words"]:
            s, e = times[k]; k += 1
            ws.append({"w": w, "start": round(s - seg0, 3), "end": round(max(e, s + 0.12) - seg0, 3)})
        # hold each word until the next one starts (reads better on screen)
        out_lines.append({"section": ln["section"], "words": ws})
        if not sections or sections[-1]["name"] != ln["section"]:
            sections.append({"name": ln["section"], "start": ws[0]["start"]})

    seg = audio[int(seg0 * SR):int(seg1 * SR)]
    hop = SR // 30
    rms = np.array([np.sqrt(np.mean(seg[i:i + hop] ** 2) + 1e-9) for i in range(0, len(seg), hop)])
    env = np.clip((20 * np.log10(rms) + 40) / 34, 0, 1).round(3).tolist()

    json.dump({"segment": {"start": round(seg0, 3), "end": round(seg1, 3)}, "sections": sections,
               "lines": out_lines, "env": env}, open(a.out, "w"), ensure_ascii=False, indent=1)
    sung = last - first
    print(f"aligned {len(flat)} words; sung part {first:.2f}s-{last:.2f}s ({sung:.1f}s); "
          f"clip {seg0:.2f}-{seg1:.2f}s -> {a.out}")
    if sung < len(flat) * 0.12:
        print("WARNING: alignment looks compressed; check the lyrics match the song", file=sys.stderr)


if __name__ == "__main__":
    sys.exit(main())
