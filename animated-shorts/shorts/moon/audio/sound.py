"""Sound for "The Man Who Accidentally Bought the Moon": light, playful music (soft electric-piano chords, a plucked
mallet melody, a gentle kick/shaker pulse) kept low under the voice, plus a few natural sounds (morning birds and
city hum, an alarm clock, night traffic, keyboard and trackpad clicks, soft whooshes on whip pans).
House style: light music, few natural SFX, nothing cartoonish.

Usage: python3 sound.py            (writes mix.wav, 48 kHz stereo, DUR seconds, plus stems/)
Event times match src/videos/moon/shots.ts (seconds).
"""
import os
import subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 75.6
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



def birds(d):
    out = np.zeros(int(d * SR))
    for _ in range(int(d * 2.2)):
        at = rng.uniform(0, d - 0.4); tt = t_(0.12 + rng.uniform(0, 0.12)); f0 = rng.uniform(2600, 4200)
        x = np.sin(2 * np.pi * np.cumsum(f0 + 900 * np.sin(2 * np.pi * rng.uniform(12, 30) * tt)) / SR) * np.sin(np.pi * tt / tt[-1]) ** 2
        place(out, x, at, rng.uniform(0.2, 0.6))
    return out
def hum(d):
    tt = t_(d); return lp(rng.standard_normal(len(tt)), 300) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.2 * tt)) * env(len(tt), 0.5, 0.5)
def traffic(d):
    tt = t_(d); x = lp(rng.standard_normal(len(tt)), 500) * 0.8
    for _ in range(int(d / 2.5)):
        at = rng.uniform(0, d - 3); n = int(3 * SR); i = int(at * SR); pas = bp(rng.standard_normal(n), 200, 1200) * np.sin(np.pi * np.arange(n) / n) ** 3
        x[i:i + n] += pas * 0.8
    return x * env(len(tt), 0.4, 0.4)
def beep(d=1.0):   # a small digital alarm clock: quiet double beeps
    out = np.zeros(int(d * SR))
    for at in np.arange(0, d - 0.1, 0.5):
        for k in range(2):
            tt = t_(0.07); place(out, np.sign(np.sin(2 * np.pi * 2000 * tt)) * 0.3 * env(len(tt), 0.003, 0.01), at + k * 0.11)
    return lp(out, 6000)
def clicks(d, rate=9):
    out = np.zeros(int(d * SR))
    for at in np.arange(0, d, 1 / rate):
        if rng.random() < 0.25: continue
        tt = t_(0.03); place(out, bp(rng.standard_normal(len(tt)), 1500, 6000) * np.exp(-tt * 200), float(at + rng.uniform(0, 0.04)), rng.uniform(0.4, 0.9))
    return out
def tick():
    tt = t_(0.04); return bp(rng.standard_normal(len(tt)), 2000, 7000) * np.exp(-tt * 250)
def rustle(d=0.8):
    tt = t_(d); return bp(rng.standard_normal(len(tt)), 600, 4000) * np.sin(np.pi * tt / d) ** 2


sfx = np.zeros(N)
# morning (0 - 6.6 s): birds, a soft city hum, the alarm, the quilt rustle
place(sfx, birds(6.6), 0.0, 0.18); place(sfx, hum(6.6), 0.0, 0.25)
place(sfx, beep(1.1), 0.0, 0.16); place(sfx, rustle(0.7), 1.55, 0.25)
# rooftop (2.55 - 3.35): a wider city wash
place(sfx, traffic(1.0), 2.5, 0.22)
# night (6.6 - 10.9 s): traffic far below, keyboard, trackpad scroll, a click
place(sfx, traffic(4.5), 6.5, 0.18); place(sfx, clicks(1.8), 7.4, 0.3); place(sfx, clicks(0.9, 14), 8.6, 0.2); place(sfx, tick(), 9.55, 0.6)
# whips
for at in (1.0, 2.55, 3.35, 4.35, 6.6, 8.6):
    place(sfx, whoosh(), at - 0.17, 0.12)
sfx = reverb(sfx, 1.0, 0.2)

# ---------------- music: soft electric piano chords + plucked mallet melody + light pulse ----------------
def epiano(f, d=1.9):
    tt = t_(d); x = np.sin(2 * np.pi * f * tt + 0.8 * np.sin(2 * np.pi * f * tt) * np.exp(-tt * 3)) * np.exp(-tt * 1.4)
    return x * env(len(tt), 0.004, 0.3)
def mallet(f, d=0.9):
    tt = t_(d); x = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 4 * tt) * np.exp(-tt * 18)) * np.exp(-tt * 5)
    return x * env(len(tt), 0.002, 0.1)
def kick():
    tt = t_(0.25); return np.sin(2 * np.pi * (90 * np.exp(-tt * 12) + 45) * tt) * np.exp(-tt * 14)
def shaker():
    tt = t_(0.06); return hp(rng.standard_normal(len(tt)), 6000) * np.exp(-tt * 70)
BPM = 104; beat = 60 / BPM
# I - vi - IV - V in F major
CH = [[174.61, 220.0, 261.63, 349.23], [146.83, 220.0, 293.66, 349.23], [116.54, 233.08, 293.66, 349.23], [130.81, 196.0, 261.63, 329.63]]
SCALE = [349.23, 392.0, 440.0, 523.25, 587.33, 698.46]
keys = np.zeros(N); mel = np.zeros(N); pulse = np.zeros(N)
for bar, at in enumerate(np.arange(0.0, DUR, 4 * beat)):
    for k, f in enumerate(CH[bar % 4]):
        place(keys, epiano(f, 4 * beat + 0.4), at + k * 0.012, 0.3)
phrase = [0, 2, 4, 3, 2, 4, 5, 4, 3, 1, 2, 0, 1, 2, 3, 2]
for i, at in enumerate(np.arange(0.0, DUR - 1, beat / 2)):
    if i % 4 == 3 or (i // 32) % 4 == 3 and i % 2: continue
    place(mel, mallet(SCALE[phrase[i % 16]]), at, 0.35)
for i, at in enumerate(np.arange(0.0, DUR, beat / 2)):
    if i % 4 == 0: place(pulse, kick(), at, 0.6)
    place(pulse, shaker(), at, 0.18 if i % 2 else 0.1)
keys = reverb(keys, 1.6, 0.3); mel = reverb(mel, 1.4, 0.3)
score = 0.8 * keys + 0.5 * mel + 0.45 * pulse
score *= np.interp(t, [0, 0.4, DUR - 2.0, DUR], [0, 1, 1, 0])

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
