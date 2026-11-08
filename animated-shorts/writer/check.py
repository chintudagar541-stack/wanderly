#!/usr/bin/env python3
"""Check a short's script against writer/FORMULA.md.
usage: python3 writer/check.py script.txt [--wps 3.7]
Prints length, estimated time, the hook, and warnings."""
import re, sys, argparse
ap = argparse.ArgumentParser(); ap.add_argument("file"); ap.add_argument("--wps", type=float, default=3.7)
a = ap.parse_args()
t = open(a.file).read().strip()
words = re.findall(r"[A-Za-z0-9']+", t)
sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", t.replace("\n", " ")) if s.strip()]
lines = [l.strip() for l in t.splitlines() if l.strip()]
n = len(words); dur = n / a.wps
def wc(s): return len(re.findall(r"[A-Za-z0-9']+", s))
hook = sents[0]
quotes = len(re.findall(r'"[^"]+"', t))
markers = sum(t.count(m) for m in ["Then", "Weeks later", "Years later", "years later", "Meanwhile", "By ", "Except", "Still,", "So "])
long_s = [s for s in sents if wc(s) > 18]
print(f"words {n}  ~{dur:.0f}s at {a.wps} w/s  sentences {len(sents)}  avg {n/len(sents):.1f} w/sentence")
print(f"HOOK ({wc(hook)} w): {hook}")
print(f"END  ({wc(sents[-1])} w): {sents[-1]}")
warn = []
if not 200 <= n <= 245: warn.append(f"length {n} words: aim 215-240 (58-65 s)")
if wc(hook) > 18: warn.append("hook longer than 18 words")
if re.match(r"^(In|On|During)\s+\d|^\d{3,4}", hook): warn.append("hook starts with a date: start with the weird act instead")
if "You see" not in " ".join(sents[1:4]): warn.append("no 'You see,' context line right after the hook")
if quotes < 2: warn.append(f"only {quotes} quoted dialogue lines: use 2+")
if markers < 3: warn.append("few time/turn markers (Then / Weeks later / Except / Still, / So)")
if long_s: warn.append(f"{len(long_s)} sentence(s) over 18 words: split them -> " + " | ".join(s[:50] + "..." for s in long_s))
if wc(sents[-1]) > 10: warn.append("last line over 10 words: end on a short punch")
if re.search(r"\b(subscribe|in conclusion|the moral|lesson)\b", t, re.I): warn.append("no moral/subscribe/outro lines")
print("OK, matches the formula" if not warn else "WARN:\n - " + "\n - ".join(warn))
