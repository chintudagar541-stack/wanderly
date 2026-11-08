"""Sound for "The Ghost Army": synthesized SFX + an original march-style score, ducked under the voice.

Usage: python3 sound.py            (writes mix.wav, 48 kHz stereo, exactly 85 s, plus stems/)
Timings match src/videos/ghost/shots.ts (seconds).
"""
import os
import subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 75.0
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



def rumble(d, f0=38, k=1.0):
    t = t_(d)
    x = lp(rng.standard_normal(len(t)), 160) * (1 + 0.5 * np.sin(2 * np.pi * 11 * t)) + 0.5 * np.sin(2 * np.pi * f0 * t)
    clank = (np.sin(2 * np.pi * 7.5 * t) > 0.92).astype(float)
    x += 0.4 * bp(rng.standard_normal(len(t)), 1500, 5000) * lp(clank, 300)
    return x * env(len(t), 0.4, 0.4) * k


def march(d, bpm=112):
    out = np.zeros(int(d * SR))
    for k in np.arange(0, d, 60 / bpm):
        place(out, step(), float(k), 1.0)
    return out


def hiss(d):
    t = t_(d)
    return hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 1.2) * env(len(t), 0.01, 0.3)


def squeak(d=0.3, f=900):
    t = t_(d)
    return np.sin(2 * np.pi * (f + 500 * np.sin(2 * np.pi * 6 * t)) * t) * env(len(t), 0.02, 0.1)


def typewriter(d, rate=11):
    out = np.zeros(int(d * SR))
    for k in np.arange(0, d, 1 / rate):
        place(out, click(3200, 0.03), float(k + rng.uniform(0, 0.03)), 1.0)
    return out


def pump(d, rate=2.2):
    out = np.zeros(int(d * SR))
    for k in np.arange(0, d, 1 / rate):
        tt = t_(0.35)
        place(out, bp(rng.standard_normal(len(tt)), 600, 3500) * np.sin(np.pi * tt / 0.35) ** 2, float(k))
    return out


def crickets(d):
    t = t_(d)
    chirp = (np.sin(2 * np.pi * 14 * t) > 0.3).astype(float) * (np.sin(2 * np.pi * 0.9 * t) > -0.2)
    return np.sin(2 * np.pi * 4300 * t) * lp(chirp.astype(float), 400) * 0.5


def murmur(d):
    t = t_(d)
    x = bp(rng.standard_normal(len(t)), 250, 1400) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 1.3 * t + np.sin(2 * np.pi * 0.37 * t) * 3)))
    return x * env(len(t), 0.3, 0.3)


def wind(d):
    t = t_(d)
    return lp(rng.standard_normal(len(t)), 500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t)) * env(len(t), 0.5, 0.5)


def whoosh(d=0.6):
    t = t_(d)
    return bp(rng.standard_normal(len(t)), 400, 3000) * np.sin(np.pi * t / d) ** 2


def speakerize(x):
    return np.tanh(3 * bp(x, 300, 3500)) * 0.6


sfx = np.zeros(N)
place(sfx, wind(15.8), 0.0, 0.25)
for k in (1.2, 5.5, 9.8):
    place(sfx, boom()[: int(1.6 * SR)], k, 0.25)
place(sfx, click(2200, 0.05), 3.3, 0.5)
place(sfx, rumble(4.6, 36, 0.6), 6.2, 0.5)
place(sfx, march(2.2), 6.3, 0.35)
place(sfx, click(4000, 0.04), 14.2, 0.7)
place(sfx, hiss(1.5), 14.27, 0.6)
place(sfx, squeak(0.5, 700), 14.9, 0.25)
place(sfx, whoosh(0.5), 15.75, 0.4)
place(sfx, typewriter(1.4), 16.9, 0.35)
place(sfx, stamp(), 19.4, 0.9)
place(sfx, squeak(0.12, 1600), 23.2, 0.25)
place(sfx, pump(1.7), 24.5, 0.45)
place(sfx, squeak(0.6, 500), 25.5, 0.2)
place(sfx, rumble(2.3, 30, 0.4), 31.3, 0.45)
place(sfx, whoosh(0.9), 33.4, 0.4)
place(sfx, crickets(9.3), 33.65, 0.06)
place(sfx, noise_bed(0.25, 500, 6000) * env(int(0.25 * SR), 0.005, 0.05), 35.6, 0.4)
bc = rumble(7.0, 40, 1.0) + march(7.0, 116) * 1.2 + rumble(7.0, 55, 0.6)
place(sfx, speakerize(bc), 36.0, 0.55)
place(sfx, murmur(5.7), 42.95, 0.22)
place(sfx, click(5000, 0.03), 43.3, 0.4)
place(sfx, click(2200, 0.05), 48.7, 0.4)
place(sfx, sting(1.8, 147), 50.95, 0.35)
place(sfx, rumble(3.9, 34, 1.0), 52.05, 0.75)
place(sfx, whoosh(0.5), 56.1, 0.45)
place(sfx, whoosh(0.5), 57.7, 0.45)
place(sfx, wind(9.0), 59.4, 0.18)
for k in np.arange(65.5, 67.0, 0.07):
    place(sfx, click(2600, 0.02), float(k), 0.25)
place(sfx, stamp(), 67.05, 0.95)
place(sfx, wind(6.8), 68.2, 0.25)
place(sfx, hiss(1.6), 72.55, 0.5)
place(sfx, squeak(0.8, 420), 73.0, 0.25)

# ---------------- score: snare march + bass ostinato + melody (D minor), night pad, warm ending ----------------
t = np.arange(N) / SR
BPM = 100
beat = 60 / BPM


def snare():
    tt = t_(0.18)
    return bp(rng.standard_normal(len(tt)), 1500, 7000) * np.exp(-tt * 28) + 0.4 * np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 40)


def kick():
    tt = t_(0.3)
    return np.sin(2 * np.pi * (50 + 60 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 12)


def tone(f, d, kind="saw"):
    tt = t_(d)
    ph = 2 * np.pi * f * tt
    x = (2 * ((f * tt) % 1) - 1) if kind == "saw" else np.sin(ph)
    return lp(x, 1800) * env(len(tt), 0.01, min(0.15, d / 3))


drums = np.zeros(N)
bass = np.zeros(N)
mel = np.zeros(N)
pat = [1, 0, 0.5, 0.5, 1, 0, 0.6, 0.3, 0.6, 0.3]  # 16ths: march snare figure per beat group
bass_notes = [73.4, 73.4, 87.3, 82.4]  # D2 D2 F2 E2 per bar
melody = [(0, 293.7, 1), (1, 349.2, 0.5), (1.5, 329.6, 0.5), (2, 293.7, 1), (3, 220, 1), (4, 233.1, 1), (5, 261.6, 0.5), (5.5, 233.1, 0.5), (6, 220, 2)]
for bar in range(int(DUR / (4 * beat)) + 1):
    b0 = bar * 4 * beat
    for i in range(16):
        v = pat[i % len(pat)]
        if v > 0:
            place(drums, snare() * v, b0 + i * beat / 4, 0.5)
    for i in (0, 2):
        place(drums, kick(), b0 + i * beat, 0.8)
    for i in range(4):
        place(bass, tone(bass_notes[bar % 4], beat * 0.9), b0 + i * beat, 0.6)
    if bar % 2 == 0:
        for at, f, d in melody:
            place(mel, tone(f, d * beat * 0.95, "saw") * 0.6 + tone(f * 2, d * beat * 0.95, "sine") * 0.2, b0 + at * beat, 0.5)
pad = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate([146.8, 174.6, 220.0, 261.6])) / 4 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.2 * t))
warm = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate([146.8, 185.0, 220.0, 293.7])) / 4


def curve(points):
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)


g_march = curve([(0, 0), (2.5, 0.25), (10.8, 0.6), (12.3, 0.2), (15.8, 0.7), (33.5, 0.75), (33.7, 0), (42.9, 0), (43.3, 0.6), (52, 0.85), (59.4, 0.9), (65.4, 0.6), (68.2, 0), (75, 0)])
g_pad = curve([(0, 0.3), (3, 0.2), (12, 0.3), (14.3, 0.5), (15.8, 0.1), (33.5, 0.1), (34, 0.8), (42.9, 0.8), (43.3, 0.1), (65.4, 0.2), (67, 0.4), (68.2, 0), (75, 0)])
g_warm = curve([(0, 0), (68.0, 0), (69, 0.8), (73.5, 1.0), (75, 0)])
score = (drums + bass + 0.8 * mel) * g_march + 0.6 * pad * g_pad + 0.7 * warm * g_warm

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
