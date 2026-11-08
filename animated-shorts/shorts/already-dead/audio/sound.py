"""Sound for "The Man Who Was Already Dead": synthesized SFX + an original drone score, ducked under the voice.

Usage: python3 sound.py            (writes mix.wav, 48 kHz stereo, exactly 85 s, plus stems/)
Timings match src/videos/dead/shots.ts (seconds).
"""
import os
import subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 85.0
N = int(SR * DUR)
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(SR * d)) / SR


def lp(x, f, o=4):
    return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)


def hp(x, f, o=4):
    return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)


def bp(x, a, b, o=3):
    return sosfilt(butter(o, [a, b], "band", fs=SR, output="sos"), x)


def env(n, a=0.005, r=0.1):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def place(buf, x, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    buf[i:j] += gain * x[: j - i]


def reverb(x, decay=1.2, mix=0.3):
    ir = rng.standard_normal(int(decay * SR)) * np.exp(-np.linspace(0, 7, int(decay * SR)))
    ir = lp(ir, 5000)
    wet = fftconvolve(x, ir)[: len(x)]
    wet *= np.max(np.abs(x)) / (np.max(np.abs(wet)) + 1e-9)
    return (1 - mix) * x + mix * wet


def db(v):
    return 10 ** (v / 20)


# ---------------- sfx ----------------
def knock(big=1.0):
    t = t_(0.35)
    body = np.sin(2 * np.pi * (95 + 40 * np.exp(-t * 40)) * t) * np.exp(-t * 22)
    click = bp(rng.standard_normal(len(t)), 300, 2500) * np.exp(-t * 90) * 0.6
    return reverb((body + click) * big, 0.6, 0.25)


def buzz(d):
    t = t_(d)
    x = np.sign(np.sin(2 * np.pi * 148 * t)) * 0.5 + np.sin(2 * np.pi * 296 * t) * 0.3
    am = (np.floor(t * 2.5) % 2 == 0).astype(float)
    am = lp(am, 40)
    return lp(x, 1200) * am * env(len(t), 0.01, 0.05)


def ringtone(d):
    t = t_(d)
    pat = np.floor(t * 8) % 8
    f = np.where(pat < 2, 880, np.where(pat < 4, 660, 0))
    ph = np.cumsum(2 * np.pi * f / SR)
    on = (pat < 4).astype(float)
    x = (np.sin(ph) + 0.3 * np.sin(2 * ph)) * lp(on, 60)
    return x * env(len(t), 0.01, 0.05)


def click(f=2500, d=0.04):
    t = t_(d)
    return bp(rng.standard_normal(len(t)), f * 0.6, f * 1.4) * np.exp(-t * 150)


def beep(f, d):
    t = t_(d)
    return np.sin(2 * np.pi * f * t) * env(len(t), 0.005, 0.05)


def noise_bed(d, lo=800, hi=7000):
    return bp(rng.standard_normal(int(d * SR)), lo, hi)


def hum(d):
    t = t_(d)
    return (np.sin(2 * np.pi * 60 * t) + 0.5 * np.sin(2 * np.pi * 120 * t) + 0.2 * np.sin(2 * np.pi * 180 * t)) * env(len(t), 0.05, 0.05)


def thud():
    t = t_(0.5)
    x = np.sin(2 * np.pi * (70 + 60 * np.exp(-t * 30)) * t) * np.exp(-t * 14)
    x += bp(rng.standard_normal(len(t)), 800, 4000) * np.exp(-t * 60) * 0.5
    return x


def creak(d):
    t = t_(d)
    f = 230 + 160 * np.sin(2 * np.pi * 0.7 * t) + 60 * np.sin(2 * np.pi * 3.1 * t)
    ph = np.cumsum(2 * np.pi * f / SR)
    saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    grains = (np.sin(2 * np.pi * 23 * t) > 0.2).astype(float) * (0.6 + 0.4 * np.sin(2 * np.pi * 5 * t))
    x = bp(saw, 300, 3000) * lp(grains, 200)
    return reverb(x * env(len(t), 0.05, 0.3), 0.9, 0.3)


def boom():
    t = t_(2.5)
    x = np.sin(2 * np.pi * (38 + 50 * np.exp(-t * 6)) * t) * np.exp(-t * 1.8)
    x += lp(rng.standard_normal(len(t)), 300) * np.exp(-t * 3) * 0.6
    return x


def sting(d=2.2, base=110):
    t = t_(d)
    fr = [base, base * 1.06, base * 1.5, base * 2.12, base * 3.02]
    x = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate(fr)) / len(fr)
    x += 0.4 * bp(rng.standard_normal(len(t)), 2000, 8000) * np.exp(-t * 6)
    return reverb(x * np.exp(-t * 1.4) * env(len(t), 0.004, 0.3), 1.8, 0.4)


def swell(d, lo=60):
    t = t_(d)
    x = lp(rng.standard_normal(len(t)), 900) * 0.5 + np.sin(2 * np.pi * lo * t)
    return x * (t / d) ** 2 * env(len(t), 0.01, 0.05)


def step():
    t = t_(0.18)
    return lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 35)


def stamp():
    t = t_(0.6)
    return reverb(np.sin(2 * np.pi * (80 + 90 * np.exp(-t * 40)) * t) * np.exp(-t * 12) + bp(rng.standard_normal(len(t)), 500, 3000) * np.exp(-t * 50), 0.5, 0.2)


sfx = np.zeros(N)
place(sfx, buzz(4.7), 0.3, 0.35)
place(sfx, click(1800), 5.0, 0.5)
for k, a in [(14.05, 1.0), (14.40, 1.0), (14.75, 1.2)]:
    place(sfx, knock(a), k - 0.01, 0.9)
place(sfx, ringtone(2.1), 18.3, 0.22)
place(sfx, buzz(2.1), 18.3, 0.3)
place(sfx, click(3000, 0.03), 24.55, 0.6)
place(sfx, beep(1320, 0.12), 25.55, 0.15)
place(sfx, swell(2.9), 26.15, 0.35)
for a, b in [(29.05, 33.25), (35.15, 41.45)]:
    d = b - a
    place(sfx, noise_bed(d) * env(int(d * SR), 0.02, 0.02) * 0.12 + hum(d) * 0.05, a)
for g in (38.15, 40.12):
    place(sfx, noise_bed(0.17, 300, 9000) * env(int(0.17 * SR), 0.003, 0.02), g, 0.5)
place(sfx, sting(2.5, 98), 40.15, 0.7)
place(sfx, thud(), 42.3, 0.9)
place(sfx, click(4000, 0.05), 42.5, 0.4)
place(sfx, knock(1.4), 44.29, 1.0)
place(sfx, knock(0.7), 46.64, 0.5)
place(sfx, creak(1.8), 50.2, 0.6)
place(sfx, sting(2.6, 82), 54.15, 0.75)
for k in np.arange(59.0, 60.0, 0.13):
    place(sfx, click(1200, 0.03), float(k), 0.25)
place(sfx, boom(), 60.0, 1.0)
place(sfx, click(900, 0.05), 60.0, 0.8)
for k in np.arange(61.45, 63.7, 0.36):
    place(sfx, step(), float(k), 0.3)
place(sfx, beep(990, 0.06), 73.5, 0.12)
place(sfx, sting(2.6, 92), 76.6, 0.7)
place(sfx, stamp(), 80.29, 1.0)
place(sfx, ringtone(2.15), 82.4, 0.28)
place(sfx, buzz(2.15), 82.4, 0.35)

# ---------------- score: drone + eerie pad, silent in key moments ----------------
t = np.arange(N) / SR
drone = 0.55 * np.sin(2 * np.pi * 55 * t) + 0.35 * np.sin(2 * np.pi * 55.6 * t) + 0.25 * np.sin(2 * np.pi * 82.4 * t)
drone += 0.25 * lp(rng.standard_normal(N), 180)
pad = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate([220, 233.1, 329.6, 349.2])) / 4
pad *= 0.5 + 0.5 * np.sin(2 * np.pi * 0.23 * t)
bell_notes = [(61.6, 659.3), (62.4, 587.3), (63.2, 523.3), (64.6, 493.9), (66.0, 523.3), (67.4, 440.0), (68.8, 415.3), (70.4, 440.0)]
bells = np.zeros(N)
for at, f in bell_notes:
    tb = t_(1.6)
    place(bells, (np.sin(2 * np.pi * f * tb) + 0.3 * np.sin(2 * np.pi * 2.01 * f * tb)) * np.exp(-tb * 2.5), at)
bells = reverb(bells, 1.5, 0.35)


def curve(points):
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)


g_drone = curve([(0, 0), (1.5, 0.5), (12, 0.6), (16.7, 0.8), (16.8, 0), (17.9, 0), (18.2, 0.6), (26, 0.7), (29, 1.0), (40, 1.0), (52, 1.1),
                 (59.9, 1.3), (60.0, 0), (70.5, 0), (71, 0.45), (80, 0.6), (82.3, 0.8), (84.5, 0.8), (84.55, 0), (85, 0)])
g_pad = curve([(0, 0), (20, 0.0), (26, 0.4), (40, 0.7), (52, 0.8), (59.9, 1.0), (60.0, 0), (70.5, 0), (72, 0.3), (82.3, 0.5), (84.55, 0), (85, 0)])
score = 0.6 * drone * g_drone + 0.35 * pad * g_pad + 0.5 * bells

# ---------------- voice + ducking ----------------
voice_mp3 = os.path.join(HERE, "..", "voice", "voice.mp3")
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", voice_mp3, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
voice = np.zeros(N)
v = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
voice[: min(N, len(v))] = v[:N]
venv = lp(np.abs(voice), 8)
duck = 1 - 0.55 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)

# levels: score sits well under the voice (+3 dB music / -6 dB sfx relative to the base bed levels)
vr = np.sqrt(np.mean(voice[voice != 0] ** 2))
score *= (vr * db(-14)) / (np.sqrt(np.mean(score ** 2)) + 1e-9) * db(3)
sfx *= (vr * db(-2)) / (np.percentile(np.abs(sfx[sfx != 0]), 99) + 1e-9) * db(-6) * 3
mus = score * duck
mix = voice + mus + sfx
peak = np.max(np.abs(mix))
mix *= db(-1) / peak
os.makedirs(os.path.join(HERE, "stems"), exist_ok=True)


def write(path, x, stereo=True):
    from scipy.io import wavfile
    y = np.stack([x, x], 1) if stereo else x
    wavfile.write(path, SR, (np.clip(y, -1, 1) * 32767).astype(np.int16))


write(os.path.join(HERE, "mix.wav"), mix)
for name, x in [("voice", voice), ("music", mus), ("sfx", sfx)]:
    write(os.path.join(HERE, "stems", f"{name}.wav"), x * db(-1) / peak)
print("mix.wav", len(mix) / SR, "s, peak scale", round(db(-1) / peak, 3))
