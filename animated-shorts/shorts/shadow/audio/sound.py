"""Sound for "The Man Who Sold His Shadow": quiet horror bed (low drone, sparse piano), synthesized SFX,
and the last line re-voiced as the shadow (slower, darker, reverberant), all under the voice.

Usage: python3 sound.py            (writes mix.wav, 48 kHz stereo, exactly 96 s, plus stems/)
Timings match src/videos/shadow/shots.ts (seconds).
"""
import os
import subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 96.0
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



def hum_m(d, f=60):
    tt = t_(d); return (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * 2 * f * tt) + 0.25 * np.sin(2 * np.pi * 3 * f * tt)) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * tt)) * env(len(tt), 0.3, 0.3)
def zap():
    tt = t_(0.25); return hp(rng.standard_normal(len(tt)), 2000) * (rng.uniform(size=len(tt)) > 0.7) * np.exp(-tt * 14)
def heartbeat(d, bpm=70):
    out = np.zeros(int(d * SR))
    for x in np.arange(0, d, 60 / bpm):
        for off, k in ((0, 1.0), (0.22, 0.7)): tt = t_(0.2); place(out, np.sin(2 * np.pi * 50 * tt) * np.exp(-tt * 25) * k, float(x + off))
    return out
def siren(d):
    tt = t_(d); f = 700 + 350 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.45 * tt)); return lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 2500) * env(len(tt), 0.5, 0.6)
def piano(f, d=2.5):
    tt = t_(d); return sum(np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * (1.5 + m)) / m for m in (1, 2, 3, 4)) * env(len(tt), 0.003, 0.3)
def sub_hit():
    tt = t_(2.0); return np.sin(2 * np.pi * (45 + 30 * np.exp(-tt * 6)) * tt) * np.exp(-tt * 2.2)
def switch_off():
    out = np.zeros(int(0.3 * SR)); place(out, click(2500, 0.03), 0.0, 1.0); place(out, click(1500, 0.05), 0.02, 0.6); return out

sfx = np.zeros(N)
place(sfx, traffic(29), 0.0, 0.12); place(sfx, wind(29) if False else hp(lp(rng.standard_normal(int(29 * SR)), 900), 80) * 0.5, 0.0, 0.1)
place(sfx, steps(3.8, 1.8, 0.8), 0.1, 0.4)
place(sfx, hiss(6.0) * 0.4, 0.0, 0.08)
place(sfx, steps(3.2, 1.6, 0.7), 8.1, 0.35)
place(sfx, hum_m(13.0, 55), 16.1, 0.35)
for x in (16.6, 17.9, 19.2, 20.4, 22.8, 26.1, 27.9): place(sfx, zap(), x, 0.35)
place(sfx, sub_hit(), 24.5, 0.9); place(sfx, hiss(1.2), 24.3, 0.4)
place(sfx, rustle(0.4), 27.6, 0.3)
place(sfx, water(2.0), 29.15, 0.12)
for_ = [place(sfx, chirp(), k, 0.15) for k in (29.6, 30.3, 31.6, 34.6)]
place(sfx, engine(1.7) if False else lp(rng.standard_normal(int(1.6 * SR)), 300) * env(int(1.6 * SR), 0.2, 0.4), 31.3, 0.15)
place(sfx, heartbeat(9.5, 62), 39.7, 0.35); place(sfx, sub_hit(), 47.85, 0.7)
place(sfx, siren(4.6), 49.15, 0.18)
place(sfx, heartbeat(6.9, 84), 53.8, 0.4); place(sfx, sub_hit(), 59.4, 0.8)
place(sfx, steps(1.7, 2.4, 0.9), 60.8, 0.35); place(sfx, thump(), 63.3, 0.4)
place(sfx, click(3000, 0.04), 66.4, 0.5); place(sfx, click(2200, 0.05), 67.6, 0.5)
place(sfx, hum_m(7.0, 60) * 0.5, 69.3, 0.12)
for x in np.arange(74.3, 76.0, 0.36): place(sfx, thump() * 0.5, float(x), 0.25)
place(sfx, tick(9.0, 1.0), 76.2, 0.12)
for x in (85.65, 85.95, 86.2): place(sfx, switch_off(), x, 0.35)
place(sfx, sub_hit(), 86.6, 0.6)
place(sfx, heartbeat(5.0, 96), 88.2, 0.45)
place(sfx, sub_hit(), 93.0, 1.0)

# ---------------- score: very little: a low drone and a few piano notes ----------------
drone = (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.4 * t + 0.3) + 0.3 * np.sin(2 * np.pi * 55.4 * t)) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * t))
pno = np.zeros(N)
for at, f in [(0.6, 220.0), (2.4, 261.6), (4.2, 246.9), (8.4, 220.0), (11.0, 207.7), (29.3, 329.6), (30.4, 392.0), (31.5, 440.0), (33.0, 392.0), (36.2, 207.7), (38.0, 196.0),
              (60.9, 220.0), (63.5, 207.7), (66.1, 196.0), (69.4, 185.0), (76.3, 174.6), (79.5, 164.8)]:
    place(pno, piano(f), at, 0.6)
def curve(points):
    xs, ys = zip(*points); return np.interp(t, xs, ys)
score = 0.5 * drone * curve([(0, 0.5), (16, 0.6), (24.4, 1.0), (25, 0.3), (29.1, 0.0), (36, 0.0), (37, 0.6), (49, 0.5), (53.7, 0.8), (60.7, 0.4), (76, 0.7), (85.2, 1.0), (86.6, 0.0), (88.2, 0.7), (93.0, 1.0), (93.3, 0), (96, 0)]) + 0.7 * pno
score[int(93.3 * SR):] *= 0

# ---------------- voice: the last line becomes the shadow's whisper ----------------
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(HERE, "..", "voice", "voice.wav"), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
voice = np.zeros(N); v = np.frombuffer(raw, dtype=np.float32).astype(np.float64); voice[: min(N, len(v))] = v[:N]
a0, a1 = int(91.75 * SR), int(93.5 * SR)
line = voice[a0:a1].copy(); voice[a0:a1] = 0
slow = np.interp(np.arange(0, len(line), 0.84), np.arange(len(line)), line)        # ~3 semitones down, a little slower
breath = bp(rng.standard_normal(len(slow)), 1500, 6000) * lp(np.abs(slow), 30) * 2.5
dark = reverb(lp(slow, 2600) * 0.9 + breath * 0.35, 1.8, 0.45)
place(voice, dark, 91.85, 1.1)
venv = lp(np.abs(voice), 8)
duck = 1 - 0.55 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)
vr = np.sqrt(np.mean(voice[voice != 0] ** 2))
score *= (vr * db(-14)) / (np.sqrt(np.mean(score ** 2)) + 1e-9) * db(-4)
sfx *= (vr * db(-2)) / (np.percentile(np.abs(sfx[sfx != 0]), 99) + 1e-9) * db(-8) * 3
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
