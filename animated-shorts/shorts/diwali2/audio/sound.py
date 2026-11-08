"""Sound for "Why India Celebrates Diwali Differently": light festive music (tanpura drone, plucked santoor-like
melody, soft tabla-like pulse) kept low under the voice, plus a few natural sounds (distant firework pops and
crackle, a lane murmur, river water, sparkler fizz). House style: light music, few natural SFX, nothing cartoonish.

Usage: python3 sound.py            (writes mix.wav, 48 kHz stereo, DUR seconds, plus stems/)
Event times match src/videos/diwali2/shots.ts (seconds).
"""
import os
import subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 86.5
N = int(SR * DUR)
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(23)
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


def reverb(x, decay=1.6, mix=0.3):
    ir = rng.standard_normal(int(decay * SR)) * np.exp(-np.linspace(0, 7, int(decay * SR))); ir = lp(ir, 5000)
    wet = fftconvolve(x, ir)[: len(x)]; wet *= np.max(np.abs(x)) / (np.max(np.abs(wet)) + 1e-9)
    return (1 - mix) * x + mix * wet


# ---------------- sfx ----------------
def pop():  # a distant firework: soft thump + airy crackle tail
    tt = t_(1.6)
    th = lp(rng.standard_normal(len(tt)), 220) * np.exp(-tt * 9) * 1.4
    cr = np.zeros(len(tt))
    for _ in range(60):
        at = 0.15 + rng.uniform(0, 1.2); i = int(at * SR); n = int(0.006 * SR)
        if i + n < len(cr): cr[i:i + n] += bp(rng.standard_normal(n), 2500, 9000) * rng.uniform(0.2, 0.6) * np.exp(-at * 1.5)
    return lp(th + cr, 7000)
def murmur(d):
    tt = t_(d); return bp(rng.standard_normal(len(tt)), 250, 1300) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 0.7 * tt + np.sin(tt * 1.1) * 2))) * env(len(tt), 0.4, 0.4)
def water(d):
    tt = t_(d); return bp(rng.standard_normal(len(tt)), 300, 2200) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.45 * tt) * np.sin(2 * np.pi * 0.13 * tt)) * env(len(tt), 0.5, 0.5)
def fizz(d):
    tt = t_(d); return hp(rng.standard_normal(len(tt)), 4000) * (0.6 + 0.4 * rng.random(len(tt)) ** 4) * env(len(tt), 0.05, 0.2)
def whoosh(d=0.35):
    tt = t_(d); return bp(rng.standard_normal(len(tt)), 400, 2600) * np.sin(np.pi * tt / d) ** 2


def creak(d=1.1):
    tt = t_(d); f = 140 + 60 * np.sin(2 * np.pi * 1.3 * tt); x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4
    return bp(x + 0.2 * rng.standard_normal(len(tt)), 200, 1800) * env(len(tt), 0.1, 0.3)
def step(k=1.0):
    tt = t_(0.12); return (lp(rng.standard_normal(len(tt)), 900) * np.exp(-tt * 45) + np.sin(2 * np.pi * 90 * tt) * np.exp(-tt * 40) * 0.5) * k
def steps(d, rate=3.2):
    out = np.zeros(int(d * SR))
    for x in np.arange(0, d, 1 / rate): place(out, step(rng.uniform(0.6, 1.0)), float(x + rng.uniform(0, 0.05)))
    return out
def bell(f=880, d=2.2):
    tt = t_(d); return sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * (2 + m)) for a, m in ((1, 1), (0.5, 2.76), (0.3, 5.4))) * env(len(tt), 0.002, 0.3)
def dhak():
    tt = t_(0.35); return (np.sin(2 * np.pi * (95 - 30 * tt) * tt) * np.exp(-tt * 10) + bp(rng.standard_normal(len(tt)), 600, 2500) * np.exp(-tt * 30) * 0.3)
def fire(d):
    tt = t_(d); roar = lp(rng.standard_normal(len(tt)), 400) * 1.2; cr = np.zeros(len(tt))
    for _ in range(int(d * 30)):
        i = int(rng.uniform(0, d) * SR); n = int(0.004 * SR)
        if i + n < len(cr): cr[i:i + n] += bp(rng.standard_normal(n), 1500, 7000) * rng.uniform(0.3, 1)
    return (roar + cr) * env(len(tt), 0.4, 0.5)
def cheer(d):
    tt = t_(d); return bp(rng.standard_normal(len(tt)), 400, 2600) * (0.7 + 0.3 * np.sin(2 * np.pi * 2.2 * tt) * np.sin(2 * np.pi * 0.7 * tt)) * env(len(tt), 0.2, 0.6)
def shimmer(d=1.8):
    tt = t_(d); return sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.5) for f in (1760, 2217, 2637, 3520)) * env(len(tt), 0.01, 0.4) * 0.3


sfx = np.zeros(N)
# crowd and water beds per place
place(sfx, murmur(7.0), 0.0, 0.25)
place(sfx, water(12.7), 6.9, 0.22); place(sfx, murmur(12.7), 6.9, 0.16)
place(sfx, murmur(3.4), 19.6, 0.16); place(sfx, water(3.4), 19.6, 0.1); place(sfx, murmur(3.8), 28.5, 0.16)
place(sfx, murmur(13.3), 32.2, 0.18)
place(sfx, murmur(12.6), 45.4, 0.14)
place(sfx, water(14.3), 58.0, 0.22); place(sfx, murmur(14.3), 58.0, 0.14)
place(sfx, murmur(4.4), 72.2, 0.18); place(sfx, murmur(4.0), 79.1, 0.16); place(sfx, murmur(5.7), 80.8, 0.2)
place(sfx, fizz(2.2), 1.2, 0.08); place(sfx, fizz(1.8), 5.2, 0.1)
# fireworks (times of the visible bursts in shots.ts)
for at in (3.8, 4.25, 4.7, 5.15, 5.6, 6.05, 6.5, 7.2, 7.8, 17.7, 18.0, 18.35, 18.7, 19.0, 19.3, 28.6, 29.0, 29.4, 29.8, 30.2, 30.6, 31.0, 31.4,
           57.2, 57.5, 72.4, 72.9, 73.4, 80.1, 80.5, 82.6, 83.0, 84.2, 84.6, 85.0, 85.4, 85.8):
    place(sfx, pop(), at - 0.05, 0.5)
for at in (69.9, 70.4, 70.9, 71.4, 71.8): place(sfx, shimmer(), at, 0.35)
# Gwalior: gate creak, kings' footsteps
place(sfx, creak(1.2), 24.5, 0.35); place(sfx, whoosh(0.8), 24.9, 0.15); place(sfx, steps(2.8), 25.7, 0.3); place(sfx, steps(1.0), 76.4, 0.25)
# Kolkata: dhak drums and puja bells
for k, at in enumerate(np.arange(35.2, 45.4, 0.42)): place(sfx, dhak(), float(at), 0.35 if k % 4 in (0, 2) else 0.2)
for at in (37.6, 38.5, 39.4, 40.3, 41.2): place(sfx, bell(1320, 1.6), at, 0.18)
# Goa: fire and cheering
place(sfx, fire(6.8), 51.3, 0.4); place(sfx, cheer(2.0), 51.4, 0.25); place(sfx, cheer(1.6), 56.6, 0.25); place(sfx, fire(1.0), 77.4, 0.3)
# Varanasi: aarti bells
for at in np.arange(64.6, 66.4, 0.45): place(sfx, bell(990, 1.4), float(at), 0.14)
place(sfx, cheer(2.2), 84.0, 0.2)
# whips
for at in (2.35, 2.98, 3.75, 6.95, 10.5, 13.4, 14.6, 17.6, 19.6, 22.9, 25.7, 28.5, 32.2, 33.4, 35.2, 39.0, 42.4, 45.4, 48.3, 51.4, 53.3, 55.4,
           58.0, 62.4, 63.3, 72.2, 75.4, 76.4, 77.4, 78.3, 79.1, 80.0, 80.8, 82.5, 83.35, 84.0):
    place(sfx, whoosh(), at - 0.17, 0.12)
sfx = reverb(sfx, 1.4, 0.25)

# ---------------- music: drone + plucked melody (raag-like scale in C) + soft pulse ----------------
def pluck(f, d=1.4, bright=0.5):
    tt = t_(d); x = sum((bright ** (k - 1)) * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt * (2.5 + 1.6 * k)) for k in range(1, 7))
    return x * env(len(tt), 0.002, 0.2)
def tanpura(d):
    out = np.zeros(int(d * SR))
    for k, f in enumerate([130.81, 196.0, 261.63, 130.81]):
        for at in np.arange(k * 0.6, d, 2.4):
            tt = t_(2.6); x = sum((0.6 ** (h - 1)) * np.sin(2 * np.pi * f * h * tt) for h in range(1, 8)) * np.exp(-tt * 0.9) * env(len(tt), 0.05, 0.4)
            place(out, x, at, 0.35)
    return lp(out, 3000)
def tabla(d, bpm=96):
    out = np.zeros(int(d * SR)); beat = 60 / bpm
    for i, at in enumerate(np.arange(0, d, beat / 2)):
        tt = t_(0.25)
        if i % 8 in (0, 3, 6): x = np.sin(2 * np.pi * (110 - 40 * tt) * tt) * np.exp(-tt * 14)   # dha (bass)
        else: x = bp(rng.standard_normal(len(tt)), 1800, 4200) * np.exp(-tt * 40) * 0.5 + np.sin(2 * np.pi * 520 * tt) * np.exp(-tt * 30) * 0.3   # na/tin
        place(out, x, at, 0.5 if i % 2 == 0 else 0.3)
    return out
SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33]   # pentatonic-ish
mel = np.zeros(N); beat = 60 / 96
phrase = [0, 2, 3, 4, 3, 2, 0, 1, 2, 4, 5, 4, 3, 2, 3, 0]
for i, at in enumerate(np.arange(0.4, DUR - 1, beat)):
    if i % 16 in (7, 15): continue
    place(mel, pluck(SCALE[phrase[i % 16]] * (2 if (i // 32) % 2 else 1)), at, 0.5)
mel = reverb(mel, 1.8, 0.35)
score = 0.8 * tanpura(DUR) + 0.45 * tabla(DUR) + 0.5 * mel
score *= np.interp(t, [0, 0.6, DUR - 2.0, DUR], [0, 1, 1, 0])

# ---------------- voice + ducking ----------------
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(HERE, "..", "voice", "voice.wav"), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
voice = np.zeros(N); v = np.frombuffer(raw, dtype=np.float32).astype(np.float64); voice[: min(N, len(v))] = v[:N]
venv = lp(np.abs(voice), 8)
duck = 1 - 0.5 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)
vr = np.sqrt(np.mean(voice[voice != 0] ** 2))
score *= (vr * db(-16)) / (np.sqrt(np.mean(score ** 2)) + 1e-9)   # light: the voice leads
sfx *= (vr * db(-2)) / (np.percentile(np.abs(sfx[sfx != 0]), 99) + 1e-9) * db(-12)
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
