"""Sound for "The Jar That Could Predict a War": synthesized SFX + an original dark medieval score, ducked under the voice.

Usage: python3 sound.py            (writes mix.wav, 48 kHz stereo, exactly 85 s, plus stems/)
Timings match src/videos/jar/shots.ts (seconds).
"""
import os
import subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 78.0
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




def crack_snd(big=1.0):
    tt = t_(0.9)
    x = hp(rng.standard_normal(len(tt)), 2500) * np.exp(-tt * 45) * 1.2
    x += sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, k in [(1230, 9), (2870, 14), (4110, 20)]) * 0.35
    x += 0.5 * np.sin(2 * np.pi * (70 + 40 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 12) * big
    return reverb(x * big, 1.0, 0.35)


def tinkle():
    tt = t_(0.25)
    f = rng.uniform(2500, 6500)
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 30)


def shatter():
    out = crack_snd(1.6)
    tt = t_(1.8)
    out = np.concatenate([out, np.zeros(len(tt) - len(out))]) if len(out) < len(tt) else out[: len(tt)]
    out = out + bp(rng.standard_normal(len(tt)), 1500, 9000) * np.exp(-tt * 7) * 0.8
    for k in range(40):
        place(out, tinkle(), float(0.05 + rng.uniform(0, 1.4) ** 1.6), rng.uniform(0.15, 0.5))
    return reverb(out, 1.4, 0.3)


def timpani(f=55, k=1.0):
    tt = t_(1.6)
    return (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 1.5 * tt)) * np.exp(-tt * 3) * k + lp(rng.standard_normal(len(tt)), 400) * np.exp(-tt * 18) * 0.4 * k


def horn(f=146.8, d=2.4):
    tt = t_(d)
    x = sum(np.sin(2 * np.pi * f * m * tt) / m for m in range(1, 8))
    return lp(x, 1400) * env(len(tt), 0.25, 0.6) * (1 + 0.04 * np.sin(2 * np.pi * 5 * tt))


def toll(f=196):
    tt = t_(4.0)
    return sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * k) for a, m, k in [(1, 1, 0.9), (0.6, 2.0, 1.4), (0.4, 2.76, 2), (0.3, 5.4, 3)])


def rain(d):
    tt = t_(d)
    return bp(rng.standard_normal(len(tt)), 1200, 8000) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.3 * tt)) * env(len(tt), 0.4, 0.4)


def thunder():
    tt = t_(3.5)
    return lp(rng.standard_normal(len(tt)), 260) * np.exp(-tt * 1.1) * (1 + 0.5 * np.sin(2 * np.pi * 2.5 * tt)) * env(len(tt), 0.02, 0.5)


def fire(d):
    out = lp(rng.standard_normal(int(d * SR)), 600) * 0.4
    for k in np.arange(0, d, 0.07):
        if rng.uniform() < 0.5: place(out, click(rng.uniform(1500, 4000), 0.02), float(k), rng.uniform(0.2, 0.7))
    return out


def murmur(d):
    tt = t_(d)
    return bp(rng.standard_normal(len(tt)), 200, 1200) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 1.1 * tt + np.sin(tt) * 2))) * env(len(tt), 0.3, 0.3)


def march_armor(d, bpm=110):
    out = np.zeros(int(d * SR))
    for k in np.arange(0, d, 60 / bpm):
        place(out, step(), float(k), 1.0)
        place(out, click(rng.uniform(3500, 6000), 0.04), float(k + 0.02), 0.25)
    return out


def scrape():
    tt = t_(0.7)
    f = 2500 + 3000 * tt
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + hp(rng.standard_normal(len(tt)), 4000) * 0.5) * env(len(tt), 0.01, 0.2)


def wind(d):
    tt = t_(d)
    return lp(rng.standard_normal(len(tt)), 500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.12 * tt)) * env(len(tt), 0.5, 0.5)


def whoosh(d=0.6, lo=300, hi=3000):
    tt = t_(d)
    return bp(rng.standard_normal(len(tt)), lo, hi) * np.sin(np.pi * tt / d) ** 2


def pluck(f, d=1.2, bright=0.6):
    n = int(d * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p) * bright; out = np.zeros(n)
    for i in range(n):
        v = buf[i % p]; out[i] = v; buf[i % p] = 0.996 * 0.5 * (v + buf[(i + 1) % p])
    return out * env(n, 0.002, 0.2)


sfx = np.zeros(N)
place(sfx, wind(6.6), 0.0, 0.25)
place(sfx, toll(196), 0.4, 0.25)
place(sfx, fire(3.6), 6.6, 0.25); place(sfx, murmur(3.6), 6.6, 0.25)
for k in np.arange(6.8, 10.2, 0.9): place(sfx, click(5200, 0.05), float(k), 0.2)   # blades being sharpened
place(sfx, crack_snd(0.9), 12.28, 0.9)
place(sfx, march_armor(3.5), 16.6, 0.5); place(sfx, horn(110, 1.8), 16.8, 0.25)
place(sfx, crack_snd(0.9), 20.48, 0.9)
place(sfx, wind(4.0), 22.1, 0.2); place(sfx, horn(146.8, 2.0), 24.2, 0.2)
place(sfx, rain(3.4), 30.5, 0.35)
for k, a in ((31.25, 1.0), (32.7, 0.8)): place(sfx, thunder(), k, a * 0.8)
place(sfx, crack_snd(0.4), 34.6, 0.4); place(sfx, crack_snd(0.4), 35.4, 0.4)
place(sfx, crack_snd(1.3), 36.33, 1.0)
place(sfx, crack_snd(1.5), 37.78, 1.0)
place(sfx, shatter(), 39.43, 1.0)
place(sfx, horn(146.8, 3.0), 41.3, 0.45)
place(sfx, toll(185), 42.0, 0.35); place(sfx, toll(185), 43.6, 0.3)
place(sfx, march_armor(2.6, 116), 43.0, 0.55)
place(sfx, wind(9.0), 45.6, 0.3)
for k in (51.4, 52.3, 53.2, 53.7, 54.1, 54.5): place(sfx, whoosh(0.4, 200, 2500), k, 0.35)
place(sfx, fire(2.0), 54.9, 0.15)
for k in np.arange(57.0, 61.0, 1.6): place(sfx, chirp() if False else click(3000, 0.03), float(k), 0.05)
place(sfx, march_armor(2.4, 90), 63.4, 0.3)
for k in np.arange(66.35, 66.9, 0.07): place(sfx, scrape(), float(k + rng.uniform(0, 0.05)), 0.3)
place(sfx, sting(2.6, 73), 69.7, 0.6)
place(sfx, timpani(49, 1.2), 73.55, 0.8)

# ---------------- score ----------------
t = np.arange(N) / SR
drone = 0.5 * np.sin(2 * np.pi * 73.4 * t) + 0.35 * np.sin(2 * np.pi * 110 * t) + 0.25 * np.sin(2 * np.pi * 73.9 * t)
cello = np.zeros(N)
for at, f, d in [(0.5, 146.8, 3.2), (4.0, 130.8, 2.5), (13.4, 146.8, 3), (16.5, 116.5, 3.5), (22.1, 146.8, 2), (24.2, 174.6, 2), (26.2, 164.8, 4), (41.0, 146.8, 2), (43.0, 130.8, 2.6), (56.9, 110, 4.2), (61.2, 116.5, 2.2), (63.4, 123.5, 2.4), (65.9, 130.8, 3.8), (73.5, 73.4, 4.5)]:
    tt = t_(d)
    saw = 2 * ((f * tt + 0.3 * np.sin(2 * np.pi * 5 * tt) / 5) % 1) - 1
    place(cello, lp(saw, 900) * env(len(tt), 0.3, 0.6), at, 0.6)
choir = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate([293.7, 349.2, 440.0])) / 3 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.15 * t))
harp = np.zeros(N)
notes = [293.7, 349.2, 440.0, 523.3, 440.0, 349.2]
for k, at in enumerate(np.arange(0.5, 12.0, 0.45)): place(harp, pluck(notes[k % 6], 1.4, 0.6), float(at), 0.4)
for k, at in enumerate(np.arange(26.2, 30.4, 0.45)): place(harp, pluck(notes[(k + 2) % 6], 1.4, 0.6), float(at), 0.35)
drums = np.zeros(N)
for k in list(np.arange(16.6, 20.1, 0.55)) + list(np.arange(41.1, 45.6, 0.5)) + list(np.arange(63.4, 69.7, 0.62)):
    place(drums, timpani(55, 0.6), float(k), 1.0)


def curve(points):
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)


g_drone = curve([(0, 0.3), (6.6, 0.5), (13.3, 0.4), (30.5, 0.6), (39.4, 1.0), (41.0, 0.5), (45.6, 0.3), (51.3, 0.2), (56.9, 0.6), (69.7, 1.0), (73.4, 0.3), (75, 0.9), (77.5, 0)])
g_choir = curve([(0, 0.25), (6.6, 0), (30.5, 0), (33.8, 0.5), (39.4, 0.9), (40.5, 0), (61.2, 0), (63.4, 0.5), (69.7, 0.9), (73.4, 0.3), (75, 0.8), (77.5, 0)])
score = 0.6 * drone * g_drone + 0.6 * cello + 0.35 * choir * g_choir + 0.6 * harp + 0.7 * drums
# silences that make the beats land
for a, b in ((36.0, 36.32), (37.5, 37.77), (39.1, 39.42), (45.6, 46.2), (69.5, 69.7)):
    score[int(a * SR):int(b * SR)] *= 0.15

# ---------------- voice + ducking ----------------
voice_src = os.path.join(HERE, "..", "voice", "voice.wav")
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", voice_src, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
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
