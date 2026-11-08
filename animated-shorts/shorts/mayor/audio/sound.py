"""Sound for the Accidental Mayor: light plucky music low under the voice, a few natural SFX (office clock ticks,
the winding ratchet, footsteps, the launch whoosh, night wind, the town clock's dying chime, snow crunch).
Event times match src/videos/clockman/shots.ts. Usage: python3 sound.py (writes mix.wav)."""
import os
import subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 48.6
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

def crash(k=1.0):   # ceiling tiles breaking: a dull thump plus brittle cracks
    tt = t_(0.6); th = lp(rng.standard_normal(len(tt)), 300) * np.exp(-tt * 14) * 1.5; cr = np.zeros(len(tt))
    for _ in range(40):
        i = int(rng.uniform(0, 0.35) * SR); n = int(0.01 * SR)
        if i + n < len(cr): cr[i:i + n] += bp(rng.standard_normal(n), 1500, 6000) * rng.uniform(0.3, 1)
    return (th + cr) * k

def birds(d):
    out = np.zeros(int(d * SR))
    for at in np.arange(0.2, d, 0.55):
        tt = t_(0.12); f = 3200 + 900 * np.sin(2 * np.pi * 14 * tt); place(out, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 18) * 0.25, float(at + rng.uniform(0, 0.2)))
    return out


def quack(k=1.0, f0=None):   # a short nasal duck call: buzzy source through two formants
    f0 = f0 or rng.uniform(380, 520); tt = t_(0.22); f = f0 * (1 + 0.25 * np.exp(-tt * 18)) * (1 - 0.15 * tt / 0.22)
    src = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) + 0.3 * rng.standard_normal(len(tt))
    return (bp(src, 900, 1600) + 0.6 * bp(src, 2200, 3200)) * np.sin(np.pi * np.clip(tt / 0.22, 0, 1)) ** 0.6 * k * 0.6
def jingle():   # TV news sting: three bright stabs
    out = np.zeros(int(1.2 * SR))
    for i, f in enumerate((523.25, 659.25, 783.99)):
        tt = t_(0.5); place(out, sum(np.sin(2 * np.pi * f * h * tt) / h for h in (1, 2, 3)) * np.exp(-tt * 5) * 0.4, i * 0.14)
    return out
def clap(d):
    out = np.zeros(int(d * SR))
    for at in np.arange(0, d, 0.035): place(out, bp(rng.standard_normal(int(0.02 * SR)), 1200, 6000) * rng.uniform(0.2, 1), float(at + rng.uniform(0, 0.02)))
    return out * env(len(out), 0.2, 0.5)
def crickets(d):
    tt = t_(d); return np.sin(2 * np.pi * 4300 * tt) * (np.sin(2 * np.pi * 18 * tt) > 0.3) * (np.sin(2 * np.pi * 0.9 * tt) > -0.2) * 0.25 * env(len(tt), 0.2, 0.3)
def thunk(k=1.0):
    tt = t_(0.25); return (np.sin(2 * np.pi * (70 - 30 * tt) * tt) * np.exp(-tt * 18) + lp(rng.standard_normal(len(tt)), 600) * np.exp(-tt * 25) * 0.6) * k
def splash(k=1.0):
    tt = t_(0.5); return bp(rng.standard_normal(len(tt)), 600, 5000) * np.exp(-tt * 9) * k
def hum_on():
    tt = t_(1.2); return (np.sin(2 * np.pi * 60 * tt) + 0.5 * np.sin(2 * np.pi * 120 * tt)) * np.minimum(1, tt * 3) * np.exp(-tt * 1.5) * 0.4
def sting():   # low comic-dramatic hit for the reveal
    tt = t_(1.4); return (sum(np.sin(2 * np.pi * f * tt) for f in (98, 146.8, 196)) * np.exp(-tt * 2.2) + lp(rng.standard_normal(len(tt)), 200) * np.exp(-tt * 10)) * 0.5

sfx = np.zeros(N)
place(sfx, jingle(), 0.05, 0.5); place(sfx, birds(7.0), 0.0, 0.2)
place(sfx, murmur(12.9), 7.0, 0.12); place(sfx, steps(3.9, 2.8), 7.0, 0.3); place(sfx, steps(2.4, 3.0), 14.75, 0.3); place(sfx, clap(2.4), 14.8, 0.35)
place(sfx, whoosh(0.3), 18.6, 0.15)
place(sfx, crickets(1.5), 19.9, 0.4); place(sfx, wind(1.5), 19.9, 0.2)
for at in np.arange(21.35, 22.5, 2 * np.pi / 11 / 2): place(sfx, thunk(rng.uniform(0.7, 1.0)), float(at + 0.1), 0.6)
place(sfx, birds(6.3), 22.5, 0.2)
for at in np.arange(22.6, 28.6, 0.33): place(sfx, quack(rng.uniform(0.4, 0.9)), float(at + rng.uniform(0, 0.2)), 0.45)
for at in np.arange(22.7, 28.6, 0.9): place(sfx, splash(rng.uniform(0.3, 0.6)), float(at), 0.25)
place(sfx, quack(1.0, 520), 29.6, 0.6); place(sfx, quack(0.8, 480), 29.75, 0.5); place(sfx, murmur(2.2), 28.75, 0.1)
for at in np.arange(31.0, 32.2, 0.18): place(sfx, step(0.4), float(at), 0.3)
place(sfx, steps(1.1, 4.5), 31.0, 0.35); place(sfx, quack(1.0, 440), 32.15, 0.7); place(sfx, whoosh(0.4), 32.0, 0.2)
place(sfx, clap(1.0), 33.24, 0.4); place(sfx, cheer(1.0), 33.24, 0.25)
place(sfx, crickets(1.8), 34.26, 0.3); place(sfx, hum_on(), 35.25, 0.45)
place(sfx, whoosh(0.7), 36.1, 0.3); place(sfx, birds(2.0), 36.85, 0.2); place(sfx, quack(1.0, 500), 37.6, 0.6)
place(sfx, cheer(3.3), 38.9, 0.35); place(sfx, clap(3.0), 39.0, 0.3)
place(sfx, sting(), 45.32, 0.6); place(sfx, whoosh(0.35), 45.2, 0.3); place(sfx, whoosh(0.35), 47.3, 0.3)
for at in np.arange(45.5, 48.4, 0.3): place(sfx, quack(rng.uniform(0.4, 0.8)), float(at + rng.uniform(0, 0.15)), 0.4)
for at in (5.05, 7.0, 10.9, 14.75, 17.2, 19.9, 21.35, 22.5, 25.4, 28.75, 30.98, 33.24, 34.26, 36.1, 36.85, 38.9, 42.17): place(sfx, whoosh(0.4), at - 0.2, 0.08)
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
    night = True
    if n is not None and True: place(mel, pluck(SC[n] * (0.5 if night else 1)), at, 0.45 if i % 2 == 0 else 0.3)
for i, at in enumerate(np.arange(0.3, DUR - 0.8, beat * 2)):
    tt = t_(beat * 2); f = [65.41, 87.31, 98.0, 65.41][i % 4]
    place(bass, np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.2) * env(len(tt), 0.01, 0.2), at, 0.6)
mel = reverb(mel, 1.5, 0.3)
score = 0.5 * mel + 0.6 * bass
score *= np.interp(t, [0, 0.4, 30, 42, 44.6, 45.3, 45.4, DUR - 1.0, DUR], [0, 0.8, 0.95, 1.15, 1.15, 0.0, 1.0, 1.0, 0])

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
