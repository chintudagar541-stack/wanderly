"""Sound for "The Man Who Sold the Eiffel Tower. Twice.": synthesized SFX + an original sneaky Parisian waltz
(accordion, pizzicato bass, glockenspiel), ducked under the voice.

Usage: python3 sound.py            (writes mix.wav, 48 kHz stereo, exactly 86 s, plus stems/)
Timings match src/videos/eiffel/shots.ts (seconds).
"""
import os
import subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 86.0
N = int(SR * DUR)
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(11)
t = np.arange(N) / SR


def t_(d): return np.arange(int(SR * d)) / SR
def lp(x, f, o=4): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=4): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)
def bp(x, a, b, o=3): return sosfilt(butter(o, [a, b], "band", fs=SR, output="sos"), x)
def db(v): return 10 ** (v / 20)


def env(n, a=0.005, r=0.1):
    e = np.ones(n); na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr); return e


def place(buf, x, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf) or i + len(x) <= 0: return
    j = min(len(buf), i + len(x)); buf[i:j] += gain * x[: j - i]


def reverb(x, decay=1.2, mix=0.3):
    ir = rng.standard_normal(int(decay * SR)) * np.exp(-np.linspace(0, 7, int(decay * SR))); ir = lp(ir, 5000)
    wet = fftconvolve(x, ir)[: len(x)]; wet *= np.max(np.abs(x)) / (np.max(np.abs(wet)) + 1e-9)
    return (1 - mix) * x + mix * wet


# ---------------- sfx ----------------
def click(f=2500, d=0.04):
    tt = t_(d); return bp(rng.standard_normal(len(tt)), f * 0.6, f * 1.4) * np.exp(-tt * 150)
def chirp():
    tt = t_(0.12); f = 3200 + 1800 * np.sin(np.pi * tt / 0.12); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.01, 0.04)
def step(k=1.0):
    tt = t_(0.12); return (lp(rng.standard_normal(len(tt)), 900) * np.exp(-tt * 45) + np.sin(2 * np.pi * 90 * tt) * np.exp(-tt * 40) * 0.5) * k
def steps(d, rate=1.9, k=1.0):
    out = np.zeros(int(d * SR))
    for x in np.arange(0, d, 1 / rate): place(out, step(k * rng.uniform(0.8, 1.1)), float(x))
    return out
def murmur(d):
    tt = t_(d); return bp(rng.standard_normal(len(tt)), 250, 1400) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 0.9 * tt + np.sin(tt * 1.3) * 2))) * env(len(tt), 0.3, 0.3)
def traffic(d):
    tt = t_(d); return lp(rng.standard_normal(len(tt)), 300) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.2 * tt)) * env(len(tt), 0.4, 0.4)
def water(d):
    tt = t_(d); return bp(rng.standard_normal(len(tt)), 1500, 7000) * (0.8 + 0.2 * np.sin(2 * np.pi * 3.3 * tt)) * env(len(tt), 0.3, 0.3)
def clink(f=3400):
    tt = t_(0.5); return sum(np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * (12 + 6 * m)) / m for m in (1, 2.4, 3.9))
def rustle(d=0.45):
    tt = t_(d); return bp(rng.standard_normal(len(tt)), 1500, 9000) * np.abs(np.sin(np.pi * tt / d)) * (0.6 + 0.4 * (rng.uniform(size=len(tt)) > 0.6))
def bell(f=392, d=3.5, k=1.0):
    tt = t_(d); return k * sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * kk) for a, m, kk in [(1, 1, 0.9), (0.5, 2.0, 1.4), (0.35, 2.76, 2), (0.25, 5.4, 3)])
def aooga():
    tt = t_(0.9); f = np.where(tt < 0.35, 220 + 260 * tt / 0.35, 480 - 120 * (tt - 0.35))
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)); return bp(x, 300, 2500) * env(len(tt), 0.02, 0.15)
def engine(d):
    tt = t_(d); f = 32 + 3 * np.sin(2 * np.pi * 0.5 * tt)
    pulses = (np.sin(2 * np.pi * np.cumsum(f) / SR) > 0.6).astype(float)
    return lp(pulses * (0.5 + rng.standard_normal(len(tt)) * 0.3), 700) * env(len(tt), 0.2, 0.3)
def scratch(d):
    out = np.zeros(int(d * SR))
    for x in np.arange(0, d, 0.11):
        if rng.uniform() < 0.8: tt = t_(0.07); place(out, bp(rng.standard_normal(len(tt)), 3000, 8000) * env(len(tt), 0.005, 0.03), float(x), rng.uniform(0.3, 0.8))
    return out
def thump():
    tt = t_(0.4); return np.sin(2 * np.pi * (80 + 60 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 16) + bp(rng.standard_normal(len(tt)), 600, 3000) * np.exp(-tt * 60) * 0.5
def tick(d, rate=2.0):
    out = np.zeros(int(d * SR))
    for k, x in enumerate(np.arange(0, d, 1 / rate)): place(out, click(4200 if k % 2 else 3200, 0.03), float(x), 0.8)
    return out
def clang():
    tt = t_(3.0); x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, k in [(110, 1.0), (233, 1.6), (371, 2.0), (587, 2.6), (911, 3.5)])
    return reverb(x + lp(rng.standard_normal(len(tt)), 300) * np.exp(-tt * 10), 1.6, 0.35)
def brass(fs, d=1.4):
    tt = t_(d); x = sum(sum(np.sin(2 * np.pi * f * m * tt) / m for m in range(1, 9)) for f in fs)
    return lp(x, 1800) * env(len(tt), 0.03, 0.5)
def shh(d=1.2):
    tt = t_(d); return bp(rng.standard_normal(len(tt)), 2500, 8000) * np.sin(np.pi * tt / d) ** 2
def whoosh(d=0.6, lo=300, hi=3000):
    tt = t_(d); return bp(rng.standard_normal(len(tt)), lo, hi) * np.sin(np.pi * tt / d) ** 2
def kaching():
    out = np.zeros(int(1.6 * SR)); place(out, thump() * 0.6, 0.0); place(out, click(1800, 0.08), 0.02, 1.0)
    place(out, bell(1568, 1.5, 0.8) + bell(2093, 1.5, 0.5), 0.12); return out
def hiss(d):
    tt = t_(d); return hp(rng.standard_normal(len(tt)), 3000) * env(len(tt), 0.05, 0.4)
def whistle(d=1.4, f=880):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * m * tt) / m for m in (1, 1.26, 1.5)) + 0.3 * hp(rng.standard_normal(len(tt)), 3000)
    return lp(x, 4000) * env(len(tt), 0.08, 0.3)
def chuffs(d, r0=1.0, r1=5.0):
    out = np.zeros(int(d * SR)); x = 0.0
    while x < d: place(out, hp(rng.standard_normal(int(0.18 * SR)), 600) * np.exp(-t_(0.18) * 18), x); x += 1 / (r0 + (r1 - r0) * x / d)
    return out
def wahwah():
    out = np.zeros(int(3.2 * SR))
    for k, (f0, f1, d) in enumerate([(233, 220, 0.5), (220, 208, 0.5), (208, 196, 0.5), (196, 185, 1.5)]):
        tt = t_(d); f = np.linspace(f0, f1, len(tt)) * (1 + (0.02 * np.sin(2 * np.pi * 6 * tt) if k == 3 else 0))
        x = sum(np.sin(2 * np.pi * np.cumsum(f * m) / SR) / m for m in range(1, 8)); wah = 600 + 1400 * np.abs(np.sin(np.pi * tt / d))
        place(out, lp(x, 1600) * (0.5 + 0.5 * wah / 2000) * env(len(tt), 0.04, 0.12), 0.55 * k)
    return out
def police(d=1.6):
    tt = t_(d); f = 2600 + 140 * np.sign(np.sin(2 * np.pi * 22 * tt))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.2 * hp(rng.standard_normal(len(tt)), 4000)) * env(len(tt), 0.02, 0.1)
def gliss(up=True):
    out = np.zeros(int(1.6 * SR)); notes = [587, 659, 784, 880, 988, 1175, 1319, 1568]
    for k, f in enumerate(notes if up else notes[::-1]): place(out, pluck(f, 0.9, 0.5), 0.07 * k)
    return out


def pluck(f, d=1.2, bright=0.6):
    n = int(d * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p) * bright; out = np.zeros(n)
    for i in range(n):
        v = buf[i % p]; out[i] = v; buf[i % p] = 0.994 * 0.5 * (v + buf[(i + 1) % p])
    return out * env(n, 0.002, 0.15)


sfx = np.zeros(N)
place(sfx, traffic(7.0), 0.0, 0.35)
for k in (0.6, 1.4, 1.9, 2.8): place(sfx, chirp(), k, 0.25)
place(sfx, bell(392, 3.5, 0.5), 0.8, 0.35); place(sfx, bell(330, 3.5, 0.5), 2.2, 0.3)
place(sfx, steps(3.3, 1.9), 3.7, 0.45); place(sfx, aooga(), 5.4, 0.18)
place(sfx, murmur(6.4), 7.0, 0.4); place(sfx, traffic(6.4), 7.0, 0.2)
place(sfx, rustle(0.5), 7.05, 0.6); place(sfx, clink(), 8.6, 0.25); place(sfx, clink(4100), 9.4, 0.18)
place(sfx, whoosh(0.4, 800, 6000), 9.85, 0.5); place(sfx, rustle(0.6), 10.0, 0.7); place(sfx, rustle(0.5), 13.5, 0.6)
place(sfx, tick(4.2, 2.0), 15.4, 0.25); place(sfx, scratch(2.2), 15.7, 0.45); place(sfx, thump(), 18.2, 0.8); place(sfx, thump(), 18.9, 0.6)
place(sfx, water(4.4), 19.6, 0.25); place(sfx, traffic(4.4), 19.6, 0.25); place(sfx, steps(4.0, 2.2, 0.8), 19.8, 0.35)
place(sfx, murmur(6.6), 24.0, 0.2); place(sfx, whoosh(0.5, 200, 1500), 28.3, 0.35)
place(sfx, clang(), 30.62, 1.0)
place(sfx, shh(1.4), 33.4, 0.3); place(sfx, shh(1.0), 35.0, 0.25)
place(sfx, engine(3.3), 36.6, 0.6); place(sfx, aooga(), 38.3, 0.55)
place(sfx, traffic(5.6), 39.8, 0.25); for_ = [place(sfx, chirp(), k, 0.2) for k in (40.3, 41.7, 43.9)]
place(sfx, bell(1047, 1.2, 0.4), 40.65, 0.4)
place(sfx, tick(2.3, 2.0), 45.4, 0.25); place(sfx, tick(6.0, 1.6), 47.7, 0.15)
place(sfx, bell(1319, 1.4, 0.4), 52.2, 0.35)
place(sfx, tick(4.5, 2.0), 53.7, 0.2)
place(sfx, rustle(0.5), 59.4, 0.5); place(sfx, kaching(), 59.6, 0.9)
place(sfx, murmur(4.8), 61.3, 0.35); place(sfx, hiss(2.0), 61.5, 0.25); place(sfx, steps(2.5, 1.9), 61.4, 0.4)
place(sfx, whistle(1.5), 63.5, 0.6); place(sfx, chuffs(2.4, 1.2, 4.5), 63.9, 0.7); place(sfx, hiss(1.6), 64.0, 0.3)
place(sfx, wahwah(), 66.35, 0.9)
place(sfx, whoosh(0.7, 300, 4000), 69.15, 0.5); place(sfx, water(2.4), 69.4, 0.2); place(sfx, steps(2.4, 2.2, 0.8), 69.5, 0.35)
place(sfx, murmur(2.6), 71.9, 0.2)
place(sfx, police(1.4), 74.6, 0.5); place(sfx, police(1.2), 75.9, 0.4); place(sfx, steps(2.5, 5.0, 1.0), 74.5, 0.6)
place(sfx, tick(2.3, 2.0), 77.0, 0.3); place(sfx, gliss(False), 77.1, 0.5)
place(sfx, water(2.1), 79.3, 0.3); place(sfx, bell(294, 3.0, 0.5), 79.5, 0.3)
place(sfx, traffic(4.6), 81.35, 0.15); place(sfx, gliss(True), 83.05, 0.5); place(sfx, bell(1568, 1.6, 0.5), 83.18, 0.6)

# ---------------- score: a sneaky Parisian waltz (D minor), 150 bpm in 3/4 ----------------
BEAT = 60 / 150
def accordion(f, d):
    tt = t_(d); x = sum(np.sign(np.sin(2 * np.pi * f * dt * tt + ph)) * 0.5 + (2 * ((f * dt * tt + ph) % 1) - 1) * 0.5 for dt, ph in ((1.0, 0), (1.004, 0.3), (0.996, 0.7)))
    return lp(x, 2600) * (1 + 0.12 * np.sin(2 * np.pi * 5.5 * tt)) * env(len(tt), 0.02, 0.08)
def glock(f, d=0.8):
    tt = t_(d); return (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.76 * tt)) * np.exp(-tt * 5)
CH = {"Dm": [293.7, 349.2, 440.0], "A7": [277.2, 329.6, 392.0], "Gm": [293.7, 392.0, 466.2], "C": [261.6, 329.6, 392.0], "F": [261.6, 349.2, 440.0], "Bb": [293.7, 349.2, 466.2], "E7": [293.7, 329.6, 415.3]}
ROOT = {"Dm": 73.4, "A7": 55.0, "Gm": 98.0, "C": 65.4, "F": 87.3, "Bb": 58.3, "E7": 82.4}
PROG = ["Dm", "Dm", "A7", "A7", "Gm", "Dm", "E7", "A7", "Dm", "Dm", "Gm", "Gm", "C", "F", "A7", "A7"]
MEL = [("D5", 1), ("F5", 1), ("A5", 1), ("G5", 2), ("E5", 1), ("C#5", 1), ("E5", 1), ("G5", 1), ("F5", 2), ("D5", 1),
       ("Bb4", 1), ("D5", 1), ("G5", 1), ("F5", 1), ("E5", 1), ("D5", 1), ("E5", 1), ("G#4", 1), ("B4", 1), ("A4", 3), ("R", 3)]
NOTE = {"G#4": 415.3, "A4": 440.0, "Bb4": 466.2, "B4": 493.9, "C#5": 554.4, "D5": 587.3, "E5": 659.3, "F5": 698.5, "G5": 784.0, "A5": 880.0}
bass, chords, mel, glk = np.zeros(N), np.zeros(N), np.zeros(N), np.zeros(N)
def waltz(a, b, melody=True, bright=1.0):
    bar, x = 0, a
    while x < b - 0.01:
        c = PROG[bar % len(PROG)]
        place(bass, pluck(ROOT[c], 1.0, 0.9), x, 1.0)
        for k in (1, 2):
            if x + k * BEAT < b: place(chords, sum(accordion(f, BEAT * 0.55) for f in CH[c]) / 3, x + k * BEAT, 0.6 * bright)
        x += 3 * BEAT; bar += 1
    if melody:
        x, i = a, 0
        while x < b - 0.01:
            n, d = MEL[i % len(MEL)]
            if n != "R": place(mel, accordion(NOTE[n], d * BEAT * 0.92), x, 0.8 * bright)
            x += d * BEAT; i += 1
def sneak(a, b):  # pizzicato tiptoe: staccato bass walk + glockenspiel ticks
    walk = [73.4, 87.3, 110.0, 103.8, 98.0, 87.3, 82.4, 77.8]
    for k, x in enumerate(np.arange(a, b, BEAT)):
        place(bass, pluck(walk[k % 8], 0.35, 0.9), float(x), 0.9)
        if k % 4 == 3: place(glk, glock([1175, 1047, 1397, 1319][(k // 4) % 4], 0.5), float(x), 0.5)
waltz(0.3, 15.3)
sneak(15.4, 30.4)
for k, f in enumerate([587, 698, 880, 1175]): place(glk, glock(f), 24.1 + k * 0.2, 0.4)
place(mel, brass([73.4, 110.0, 146.8], 2.4), 30.62, 1.4)
sneak(33.1, 36.5)
waltz(36.6, 45.3, True, 1.05)
place(mel, brass([69.3, 103.8], 1.6), 45.45, 0.6)               # the wife's suspicion: a low, sour chord
sneak(47.7, 58.1)
waltz(58.2, 66.0, True, 1.0)
waltz(69.4, 74.4, True, 1.1)
sneak(74.5, 79.2)
for k, f in enumerate([293.7, 349.2, 440.0, 587.3]): place(mel, accordion(f, 2.0 - k * 0.3), 79.4 + k * 0.45, 0.45)
place(mel, accordion(587.3, 0.7) + accordion(440.0, 0.7), 81.4, 0.5); place(mel, accordion(698.5, 0.9), 82.2, 0.5)
place(mel, brass([146.8, 220.0, 293.7], 2.2) * 0.9, 83.18, 1.2)
for k, (n, d) in enumerate([("D5", 0.2), ("F5", 0.2), ("A5", 0.2), ("D5", 1.6)]): place(mel, accordion(NOTE[n] * (2 if k == 3 else 1), d), 83.2 + 0.22 * k, 0.7)
place(bass, pluck(73.4, 1.6, 0.9), 83.18, 1.2)


def curve(points):
    xs, ys = zip(*points); return np.interp(t, xs, ys)
score = 0.9 * bass + 0.55 * chords + 0.6 * mel + 0.6 * glk
score *= curve([(0, 0.8), (15.3, 0.8), (15.4, 1.0), (30.4, 1.0), (45.4, 1.0), (66.0, 1.0), (66.2, 0.0), (69.2, 0.0), (69.4, 1.0), (83.0, 1.0), (85.2, 1.0), (86, 0)])
for a, b in ((30.3, 30.6), (45.2, 45.45), (83.0, 83.17)):
    score[int(a * SR):int(b * SR)] *= 0.12

# ---------------- voice + ducking ----------------
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(HERE, "..", "voice", "voice.wav"), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
voice = np.zeros(N); v = np.frombuffer(raw, dtype=np.float32).astype(np.float64); voice[: min(N, len(v))] = v[:N]
venv = lp(np.abs(voice), 8)
duck = 1 - 0.55 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)
vr = np.sqrt(np.mean(voice[voice != 0] ** 2))
score *= (vr * db(-14)) / (np.sqrt(np.mean(score ** 2)) + 1e-9) * db(3)
sfx *= (vr * db(-2)) / (np.percentile(np.abs(sfx[sfx != 0]), 99) + 1e-9) * db(-6) * 3
mus = score * duck
mix = voice + mus + sfx
peak = np.max(np.abs(mix)); mix *= db(-1) / peak
os.makedirs(os.path.join(HERE, "stems"), exist_ok=True)


def write(path, x):
    from scipy.io import wavfile
    wavfile.write(path, SR, (np.clip(np.stack([x, x], 1), -1, 1) * 32767).astype(np.int16))


write(os.path.join(HERE, "mix.wav"), mix)
for name, x in [("voice", voice), ("music", mus), ("sfx", sfx)]: write(os.path.join(HERE, "stems", f"{name}.wav"), x * db(-1) / peak)
print("mix.wav", len(mix) / SR, "s, peak scale", round(db(-1) / peak, 3))
