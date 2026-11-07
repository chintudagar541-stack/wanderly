"""Sound for the Clock Man demo: light plucky music low under the voice, a few natural SFX (office clock ticks,
the winding ratchet, footsteps, the launch whoosh, night wind, the town clock's dying chime, snow crunch).
Event times match src/videos/clockman/shots.ts. Usage: python3 sound.py (writes mix.wav)."""
import os
import subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 18.4
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



def tick(k=1.0, f=3200):
    tt = t_(0.03); return (bp(rng.standard_normal(len(tt)), f * 0.6, f * 1.6) * np.exp(-tt * 260) + np.sin(2 * np.pi * f * 0.5 * tt) * np.exp(-tt * 200) * 0.4) * k
def wind(d):
    tt = t_(d); return bp(rng.standard_normal(len(tt)), 180, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * tt + np.sin(tt * 0.7))) * env(len(tt), 0.4, 0.4)
def crunch(k=1.0):
    tt = t_(0.16); return bp(rng.standard_normal(len(tt)), 900, 5000) * np.exp(-tt * 28) * (0.5 + 0.5 * (rng.random(len(tt)) > 0.6)) * k
def hiss(d=0.9):
    tt = t_(d); return hp(rng.standard_normal(len(tt)), 3000) * np.sin(np.pi * tt / d) ** 0.5 * env(len(tt), 0.02, 0.2)

sfx = np.zeros(N)
OFFICE = [(0, 2.2), (3.75, 13.2)]
for a, b in OFFICE:
    for at in np.arange(a + 0.1, b, 0.5):
        if not (7.4 <= at <= 9.2): place(sfx, tick(0.5 if int(at * 2) % 2 else 0.35), float(at))
for at in np.arange(7.4, 9.2, 0.045): place(sfx, tick(0.35, 2400), float(at + rng.uniform(0, 0.01)))   # winding ratchet
place(sfx, wind(1.8), 2.1, 0.35); place(sfx, murmur(1.6), 2.2, 0.12)
place(sfx, wind(5.4), 13.1, 0.4); place(sfx, murmur(3.6), 14.7, 0.14)
place(sfx, bell(196, 3.2), 13.25, 0.5); place(sfx, bell(392, 2.0), 13.25, 0.15)   # the town clock's last, dying chime
place(sfx, steps(0.9, 3.6), 10.95, 0.4); place(sfx, hiss(0.9), 11.35, 0.12)
for at in np.arange(14.9, 16.6, 0.32): place(sfx, crunch(rng.uniform(0.6, 1.0)), float(at), 0.35)
for at in (2.2, 3.75, 7.2, 9.95, 13.2, 14.75): place(sfx, whoosh(0.4), at - 0.2, 0.12)
place(sfx, whoosh(0.7), 12.2, 0.45)   # launched on "fired"
sfx = reverb(sfx, 1.2, 0.22)

# ---------------- music: light, curious plucks over a soft bass and a ticking pulse ----------------
def pluck(f, d=0.9, bright=0.45):
    tt = t_(d); x = sum((bright ** (k - 1)) * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt * (4 + 2 * k)) for k in range(1, 6))
    return x * env(len(tt), 0.002, 0.15)
bpm = 112; beat = 60 / bpm
SC = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25]
phrase = [0, 4, 2, 4, 5, 4, 2, 1, 0, 4, 2, 4, 6, 5, 4, None]
mel = np.zeros(N); bass = np.zeros(N)
for i, at in enumerate(np.arange(0.3, DUR - 0.8, beat / 2)):
    n = phrase[i % 16]
    night = at > 13.2 or 2.2 <= at < 3.75
    if n is not None and not (13.0 < at < 14.6): place(mel, pluck(SC[n] * (0.5 if night else 1)), at, 0.45 if i % 2 == 0 else 0.3)
for i, at in enumerate(np.arange(0.3, DUR - 0.8, beat * 2)):
    tt = t_(beat * 2); f = [65.41, 87.31, 98.0, 65.41][i % 4]
    place(bass, np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.2) * env(len(tt), 0.01, 0.2), at, 0.6)
mel = reverb(mel, 1.5, 0.3)
score = 0.5 * mel + 0.6 * bass
score *= np.interp(t, [0, 0.4, DUR - 1.2, DUR], [0, 1, 1, 0])

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
