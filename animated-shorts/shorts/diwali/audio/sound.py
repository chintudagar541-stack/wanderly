"""Sound for the Diwali short: synthesized SFX + an original Indian-flavoured score (tanpura, plucked melody, tabla), ducked under the voice.

Usage: python3 sound.py            (writes mix.wav, 48 kHz stereo, exactly 85 s, plus stems/)
Timings match src/videos/diwali/shots.ts (seconds).
"""
import os
import subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 70.0
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




def pluck(f, d=1.2, bright=0.6):
    """Karplus-Strong plucked string (sitar-ish with a little buzz)"""
    n = int(d * SR); p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p) * bright
    out = np.zeros(n)
    for i in range(n):
        v = buf[i % p]
        out[i] = v
        buf[i % p] = 0.996 * 0.5 * (v + buf[(i + 1) % p])
    return np.tanh(out * 1.6) * env(n, 0.002, 0.2)


def tabla(kind="na"):
    tt = t_(0.5)
    if kind == "ge":   # bayan: low with pitch bend
        return np.sin(2 * np.pi * (70 + 40 * np.exp(-tt * 9)) * tt) * np.exp(-tt * 6)
    f = 520 if kind == "na" else 380
    return (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.7 * tt)) * np.exp(-tt * 22) + 0.2 * bp(rng.standard_normal(len(tt)), 2000, 6000) * np.exp(-tt * 60)


def bell(f=880, d=2.5):
    tt = t_(d)
    return sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * k) for a, m, k in [(1, 1, 1.5), (0.5, 2.76, 3), (0.3, 5.4, 5), (0.2, 8.9, 7)])


def cracker():
    tt = t_(0.35)
    return (bp(rng.standard_normal(len(tt)), 300, 6000) * np.exp(-tt * 25) + 0.6 * np.sin(2 * np.pi * (90 + 120 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 15))


def firework():
    tt = t_(2.0)
    boom = np.sin(2 * np.pi * (50 + 80 * np.exp(-tt * 20)) * tt) * np.exp(-tt * 4)
    crackle = np.zeros(len(tt))
    for k in range(40):
        place(crackle, click(rng.uniform(2000, 6000), 0.02), 0.3 + rng.uniform(0, 1.5), rng.uniform(0.2, 0.6))
    return reverb(boom + crackle * 0.8, 1.2, 0.3)


def hiss_s(d):
    tt = t_(d)
    return hp(rng.standard_normal(len(tt)), 3500) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * tt)) * env(len(tt), 0.05, 0.2)


def match():
    tt = t_(0.6)
    return hp(rng.standard_normal(len(tt)), 1500) * np.exp(-tt * 9) * env(len(tt), 0.005, 0.2)


def chirp():
    tt = t_(0.18)
    f = 3200 + 1500 * np.sin(np.pi * tt / 0.18)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.18)


def whoosh(d=0.6, lo=400, hi=3000):
    tt = t_(d)
    return bp(rng.standard_normal(len(tt)), lo, hi) * np.sin(np.pi * tt / d) ** 2


def thunder():
    tt = t_(3.0)
    return lp(rng.standard_normal(len(tt)), 220) * np.exp(-tt * 1.3) * (1 + np.sin(2 * np.pi * 3 * tt) * 0.4) * env(len(tt), 0.05, 0.4)


def cheer(d):
    tt = t_(d)
    x = bp(rng.standard_normal(len(tt)), 400, 3000) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 2.3 * tt)))
    return x * env(len(tt), 0.2, 0.6)


sfx = np.zeros(N)
# opening: lamps lit one by one, distant crackers
for k in (0.7, 1.4, 2.1, 2.7):
    place(sfx, match(), k, 0.35)
for k in np.arange(3.2, 9.4, 0.9):
    place(sfx, cracker(), float(k + rng.uniform(0, 0.4)), 0.15)
place(sfx, hiss_s(4.0), 3.2, 0.12)
for k in (4.0, 6.2):
    place(sfx, firework(), k, 0.35)
place(sfx, whoosh(1.4, 200, 2000), 10.9, 0.45)
place(sfx, bell(660, 3), 12.3, 0.35)
place(sfx, bell(880, 2.5), 15.0, 0.25)
for k in np.arange(19.4, 24.0, 0.7):
    place(sfx, chirp(), float(k + rng.uniform(0, 0.3)), 0.12)
place(sfx, thunder(), 24.0, 0.6)
place(sfx, sting(2.5, 73), 25.2, 0.6)
place(sfx, lp(rng.standard_normal(int(2 * SR)), 120) * env(int(2 * SR), 0.1, 0.5), 25.3, 0.5)
place(sfx, whoosh(0.4, 300, 1500), 27.6, 0.3)
place(sfx, whoosh(1.0, 800, 6000), 28.3, 0.5)
place(sfx, boom()[: int(2.0 * SR)], 29.3, 0.6)
place(sfx, bell(990, 3), 30.5, 0.3)
for k in np.arange(31.3, 36.0, 0.5):
    place(sfx, step(), float(k), 0.15)
place(sfx, cheer(3.3), 36.3, 0.4)
for k in (36.4, 37.3, 38.2):
    place(sfx, bell(1180 + rng.uniform(-60, 60), 2), k, 0.15)
for k in np.arange(39.9, 42.4, 0.3):
    place(sfx, match(), float(k), 0.15)
place(sfx, bell(660, 3.5), 42.5, 0.3)
for k in (45.6, 46.6, 47.6, 48.6):
    place(sfx, match(), k, 0.25)
place(sfx, hiss_s(3.8), 49.75, 0.18)
for k in np.arange(49.8, 53.6, 1.1):
    place(sfx, cracker(), float(k), 0.12)
for k in (57.3, 58.2, 59.1, 61.0, 63.0, 65.2, 67.4):
    place(sfx, firework(), k, 0.4)

# ---------------- score: tanpura drone, plucked melody, tabla ----------------
t = np.arange(N) / SR
SA = 146.83  # D3
drone = np.zeros(N)
cycle = [SA * 1.5, SA * 2, SA * 2, SA]  # Pa Sa' Sa' Sa (tanpura pattern)
for i, k in enumerate(np.arange(0, DUR, 0.75)):
    place(drone, pluck(cycle[i % 4], 2.2, 0.35), float(k), 0.35)
drone = lp(drone, 3000)
# Yaman-like phrase: Ni Re Ga Ma# Pa Ma# Ga Re Sa (in D)
sw = {"S": 1, "R": 9 / 8, "G": 5 / 4, "M": 45 / 32, "P": 3 / 2, "D": 5 / 3, "N": 15 / 8, "S'": 2}
phrase = [("N", 0.5, 0.5), ("R", 0, 0.5), ("G", 0, 0.5), ("M", 0, 0.5), ("P", 0, 1), ("M", 0, 0.5), ("G", 0, 0.5), ("R", 0, 0.5), ("S", 0, 1.5)]
mel = np.zeros(N)
def play_phrase(at, octave=2):
    pos = at
    for note, low, d in phrase:
        f = SA * octave * sw[note] * (0.5 if low else 1)
        place(mel, pluck(f, d * 1.4 + 0.6, 0.8), pos, 0.5)
        pos += d * 0.55
for at in (1.0, 6.5, 13.0, 31.5, 37.0, 43.0, 46.0, 52.0, 60.5, 64.5):
    play_phrase(at)
tab = np.zeros(N)
theka = ["ge", "na", "na", "ge", "na", "tin", "ge", "na"]
for i, k in enumerate(np.arange(31.3, 70.0, 0.32)):
    if 59.7 < k < 60.1:
        continue
    place(tab, tabla(theka[i % len(theka)]), float(k), 0.5)
dark = lp(rng.standard_normal(N), 150) + 0.6 * np.sin(2 * np.pi * 55 * t)


def curve(points):
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)


g_drone = curve([(0, 0.5), (22.6, 0.6), (24, 0.2), (31, 0.2), (31.5, 0.7), (70, 0.7)])
g_mel = curve([(0, 0.7), (12, 0.7), (19, 0.4), (22.6, 0.4), (23.5, 0), (31.0, 0), (31.5, 0.8), (70, 0.8)])
g_tab = curve([(0, 0), (31.2, 0), (31.5, 0.6), (36, 0.9), (45, 0.7), (53.6, 0.3), (57, 0.9), (68.5, 0.9), (70, 0)])
g_dark = curve([(0, 0), (23.5, 0), (24.5, 0.8), (29.3, 0.9), (30.6, 0), (70, 0)])
score = drone * g_drone + mel * g_mel + 0.6 * tab * g_tab + 0.5 * dark * g_dark

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
