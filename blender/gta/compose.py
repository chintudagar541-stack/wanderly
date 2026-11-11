"""python3 compose.py <chunk_dir> <out.mp4>  - Indian Middle Class Edition.
Joins chunks into shots, overlays the original game-style HUD (mission banners, wanted stars, game over - our own
design and fonts, no logos, no subtitles), and mixes the dialogue with a synthesised retro game score + cartoon SFX.
Music sits at 25% of the voice level; SFX at or below that."""
import json, os, sys, glob, subprocess, tempfile, math, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont
H = os.path.dirname(os.path.abspath(__file__)); art, outp = sys.argv[1], sys.argv[2]
film = json.load(open(os.path.join(H, 'shots.json'))); fps = film['fps']
W, Hh = 1080, 1920
NOSUBS = bool(os.environ.get('NOSUBS')); NOLOGO = bool(os.environ.get('NOLOGO'))
NOSUBS = NOSUBS or not film.get('subs'); NOLOGO = NOLOGO or not os.environ.get('LOGO')
MAINEND = film['shots'][-1]['t0'] + film['shots'][-1]['dur']; TOTAL = MAINEND + (0.0 if NOLOGO else 3.0)
HANDLE = float(os.environ.get('HANDLE', .25))
TRANS = film.get('trans', {})            # shot id -> ('dissolve', seconds) for the transition INTO that shot
def sh(*a): subprocess.run(a, check=True)
tmp = tempfile.mkdtemp()
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def shotfile(sid):
    ps = sorted(glob.glob(f"{art}/chunk_{sid}_[0-9]*.mp4"))
    if not ps: return None
    lst = os.path.join(tmp, sid + '.txt'); open(lst, 'w').write(''.join(f"file '{os.path.abspath(p)}'\n" for p in ps))
    o = os.path.join(tmp, sid + '.mp4'); sh('ffmpeg', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', o); return o


def probe_wh(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout.strip().split(',')
    return int(r[0]), int(r[1])


# ---------------------------------------------------------------- picture: shots chained with xfade (1-frame = cut)
shots = film['shots']; files = []
for s in shots:
    f = shotfile(s['id'])
    if f is None:     # missing shot: black placeholder so the timeline never shifts
        f = os.path.join(tmp, s['id'] + '_black.mp4'); sh('ffmpeg', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', f'color=c=black:s={W}x{Hh}:r={fps}:d={s["dur"] + HANDLE:.3f}', '-pix_fmt', 'yuv420p', f); print('missing shot', s['id'])
    files.append(f)
W, Hh = probe_wh(files[0])
inputs = []; fc = []
for i, (s, f) in enumerate(zip(shots, files)):
    nxt = TRANS.get(shots[i + 1]['id'], ['cut', 0])[1] if i + 1 < len(shots) else 0
    keep = s['dur'] + max(1.0 / fps, nxt)
    inputs += ['-i', f]; fc.append(f"[{i}:v]trim=0:{keep:.4f},setpts=PTS-STARTPTS,fps={fps},scale={W}:{Hh},format=yuv420p[c{i}]")
acc = '[c0]'
for i in range(1, len(shots)):
    tr = TRANS.get(shots[i]['id'], ['cut', 0]); d = max(1.0 / fps, tr[1] if tr[0] == 'dissolve' else 1.0 / fps)
    fc.append(f"{acc}[c{i}]xfade=transition={'fade' if tr[0] == 'dissolve' else 'fade'}:duration={d:.4f}:offset={shots[i]['t0']:.4f}[x{i}]"); acc = f'[x{i}]'
# HUD: original game-style overlays (DejaVu fonts, our own layout)
sys.path.insert(0, H); import typo
def F_(k, s): return typo.font(k, s)
def spaced(d, xy, txt, f, fill, track=0, anchor='mm', **kw):
    """text with letter tracking, centred on xy"""
    if not track: d.text(xy, txt, font=f, fill=fill, anchor=anchor, **kw); return
    w = sum(d.textlength(c, font=f) for c in txt) + track * (len(txt) - 1); x = xy[0] - w / 2
    for c in txt: d.text((x, xy[1]), c, font=f, fill=fill, anchor='lm', **kw); x += d.textlength(c, font=f) + track
def hud_png(txt, style, j):
    im = Image.new('RGBA', (W, Hh), (0, 0, 0, 0)); d = ImageDraw.Draw(im); L = txt.split('\n')
    if style == 'title':
        f = F_('montserrat', W * .072)
        for k, l in enumerate(L):
            y = Hh * .74 + k * W * .09
            spaced(d, (W / 2 + 4, y + 4), l, f, (0, 0, 0, 150), track=W * .006); spaced(d, (W / 2, y), l, f, (255, 255, 255, 255), track=W * .006)
    elif style == 'mission':
        y0 = Hh * .18; bh = W * .26
        d.rectangle([0, y0, W, y0 + bh], fill=(0, 0, 0, 150)); d.rectangle([0, y0, W, y0 + 6], fill=(250, 196, 40, 255)); d.rectangle([0, y0 + bh - 6, W, y0 + bh], fill=(250, 196, 40, 255))
        spaced(d, (W / 2, y0 + bh * .3), L[0], F_('oswald_b', W * .05), (250, 196, 40, 255), track=W * .012)
        spaced(d, (W / 2, y0 + bh * .66), L[1] if len(L) > 1 else '', F_('anton', W * .085), (255, 255, 255, 255), track=W * .004, stroke_width=3, stroke_fill=(0, 0, 0, 255))
    elif style == 'failed':
        spaced(d, (W / 2, Hh * .3), txt, F_('anton', W * .15), (226, 40, 40, 255), track=W * .008, stroke_width=7, stroke_fill=(0, 0, 0, 255))
    elif style == 'stars':
        d.text((W * .93, Hh * .068), txt, font=F_('bebas', W * .07), fill=(255, 255, 255, 255), anchor='rm', stroke_width=3, stroke_fill=(0, 0, 0, 255))
    elif style == 'star':
        q_ = int(txt or 0); cx = W * .93 - (4 - q_) * W * .1; cy = Hh * .118; R = W * .045
        pts = [(cx + (R if q % 2 == 0 else R * .42) * math.sin(q * math.pi / 5), cy - (R if q % 2 == 0 else R * .42) * math.cos(q * math.pi / 5)) for q in range(10)]
        d.polygon(pts, fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=4)
    elif style == 'gameover':
        spaced(d, (W / 2, Hh * .42), txt, F_('anton', W * .2), (240, 240, 240, 255), track=W * .01, stroke_width=8, stroke_fill=(0, 0, 0, 255))
    elif style == 'reason':
        d.rectangle([W * .06, Hh * .5, W * .94, Hh * .5 + W * .11], fill=(0, 0, 0, 170))
        spaced(d, (W / 2, Hh * .5 + W * .055), txt, F_('oswald_b', W * .058), (255, 210, 60, 255), track=W * .008)
    p = os.path.join(tmp, f'hud{j}_{style}.png'); im.save(p); return p
HUD = list(film.get('hud', []))
for (txt, a, b, style) in list(HUD):
    if style == 'stars':
        for q in range(5): HUD.append((str(q), a + .25 + q * .22, b, 'star'))
lab = acc; k = len(shots)
GREY = film.get('grey', [56.3, 60.0])
fc.append(f"{lab}hue=s=0:enable='gte(t,{GREY[0]:.2f})',eq=brightness=-0.04:contrast=1.08:enable='gte(t,{GREY[0]:.2f})'[g0]"); lab = '[g0]'
for j, (txt, a, b, style) in enumerate(HUD):
    p = hud_png(txt, style, j); dur = b - a
    inputs += ['-loop', '1', '-t', f'{dur:.3f}', '-i', p]
    pop = .12 if style in ('star', 'failed', 'gameover') else .25
    fc.append(f"[{k}:v]format=rgba,fade=t=in:st=0:d={pop}:alpha=1,fade=t=out:st={max(0, dur - .25):.3f}:d=0.25:alpha=1,setpts=PTS+{a:.3f}/TB[h{j}]")
    fc.append(f"{lab}[h{j}]overlay=0:0:eof_action=pass[o{j}]"); lab = f'[o{j}]'; k += 1
fc.append(f"{lab}trim=0:{MAINEND:.4f},setpts=PTS-STARTPTS[vo]")
main = os.path.join(tmp, 'main.mp4')
sh('ffmpeg', '-loglevel', 'error', '-y', *inputs, '-filter_complex', ';'.join(fc), '-map', '[vo]', '-c:v', 'libx264', '-crf', '15', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', str(fps), main)
# end card
lg = Image.new('RGB', (W, Hh), (6, 5, 4)); d = ImageDraw.Draw(lg); f1 = ImageFont.truetype(FB, int(W * .13)); f2 = ImageFont.truetype(FB, int(W * .045))
cx, cy = W / 2, Hh * .44; r = W * .11
d.rounded_rectangle([cx - r, cy - r * 1.5, cx + r, cy - r * .1], radius=int(r * .28), fill=(214, 168, 56))
d.polygon([(cx - r * .3, cy - r * 1.2), (cx - r * .3, cy - r * .4), (cx + r * .45, cy - r * .8)], fill=(6, 5, 4))
d.text((cx, cy + r * .75), 'DAGAR', font=f1, fill='white', anchor='mm'); d.text((cx, cy + r * 1.95), 'C L I P S', font=f1, fill=(214, 168, 56), anchor='mm')
d.text((cx, cy + r * 3.0), 'STORIES YOU CAN SEE', font=f2, fill=(150, 150, 150), anchor='mm')
lp = os.path.join(tmp, 'logo.png'); lg.save(lp); logo = os.path.join(tmp, 'logo.mp4')
if not NOLOGO: sh('ffmpeg', '-loglevel', 'error', '-y', '-loop', '1', '-i', lp, '-t', f'{TOTAL - MAINEND:.3f}', '-vf', f"fps={fps},fade=t=in:st=0:d=0.7,fade=t=out:st={TOTAL - MAINEND - 0.6:.2f}:d=0.6", '-c:v', 'libx264', '-crf', '15', '-pix_fmt', 'yuv420p', logo)

# ---------------------------------------------------------------- sound: retro game score + cartoon SFX
SR = 48000; N = int(TOTAL * SR); rng = np.random.default_rng(11)
NOTE = {n: 440 * 2 ** ((k - 9) / 12) for k, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
def f(n, o): return NOTE[n] * 2 ** (o - 4)
def add(dst, sig, t):
    i = int(t * SR); j = min(len(dst), i + len(sig))
    if 0 <= i < len(dst) and j > i: dst[i:j] += sig[:j - i]
def env(n, a=.01, r=.1):
    x = np.arange(n) / SR; d = n / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.minimum(1, np.maximum(0, (d - x) / max(r, 1e-4)))
def sq(freq, dur, amp=.1, duty=.5, dec=0.0):
    n = int(dur * SR); x = np.arange(n) / SR; ph = (freq * x) % 1.0
    return amp * np.where(ph < duty, 1.0, -1.0) * env(n, .004, .03) * (np.exp(-x * dec) if dec else 1)
def tri(freq, dur, amp=.2):
    n = int(dur * SR); x = np.arange(n) / SR; ph = (freq * x) % 1.0
    return amp * (4 * np.abs(ph - .5) - 1) * env(n, .004, .03)
def noise(dur, amp=.2, dec=30, lp=1):
    n = int(dur * SR); s = rng.standard_normal(n)
    if lp > 1: s = np.convolve(s, np.ones(lp) / lp, 'same')
    return amp * s * np.exp(-np.arange(n) / SR * dec)
def kick(amp=.5):
    n = int(.22 * SR); x = np.arange(n) / SR; return amp * np.sin(2 * np.pi * (110 * np.exp(-x * 18) + 45) * x) * np.exp(-x * 14)
def snare(amp=.25): return noise(.18, amp, 22) + .5 * amp * np.sin(2 * np.pi * 190 * np.arange(int(.18 * SR)) / SR) * np.exp(-np.arange(int(.18 * SR)) / SR * 30)
def hat(amp=.06): return noise(.05, amp, 80)
music = np.zeros(N); sfx = np.zeros(N); amb = np.zeros(N)

def groove(t0, t1, bpm=118, key=('A', 2), amp=1.0, lead=True, drums=True):
    """chiptune 'open world' groove: square bass ostinato, drums, a sneaky lead"""
    beat = 60 / bpm; root = f(*key); bass = [0, 0, 7, 0, 10, 0, 7, 5]; t = t0; k = 0
    melody = [12, None, 15, 12, None, 10, 12, None, 7, None, 10, None, 12, 15, 17, None]
    while t < t1 - .05:
        add(music, amp * sq(root * 2 ** (bass[k % 8] / 12), beat * .48, .09, .25), t)
        if drums:
            if k % 4 == 0: add(music, amp * kick(.45), t)
            if k % 4 == 2: add(music, amp * snare(.2), t)
            add(music, amp * hat(.05), t + beat / 2)
        if lead and k % 2 == 0:
            m = melody[(k // 2) % 16]
            if m is not None: add(music, amp * sq(root * 4 * 2 ** (m / 12), beat * .9, .045, .125), t)
        t += beat / 2; k += 1
def jingle(t0, notes, step=.09, amp=1.0, last=.45):
    for q, (n_, o) in enumerate(notes):
        d_ = last if q == len(notes) - 1 else step * 1.2
        add(music, amp * sq(f(n_, o), d_, .09, .5), t0 + q * step); add(music, amp * sq(f(n_, o - 1), d_, .05, .25), t0 + q * step)
def whoosh(t, dur=.45, amp=.3, up=True):
    n = int(dur * SR); x = np.arange(n) / SR; s = rng.standard_normal(n); out = np.zeros(n); c = 0.0
    a_ = np.linspace(.02, .3, n) if up else np.linspace(.3, .02, n)
    for i in range(n): c += a_[i] * (s[i] - c); out[i] = c
    add(sfx, amp * out * np.sin(np.pi * x / dur), t)
def thud(t, amp=.6, fr=70): n = int(.4 * SR); x = np.arange(n) / SR; add(sfx, amp * np.sin(2 * np.pi * fr * x) * np.exp(-x * 9) + noise(.4, amp * .35, 25, 4), t)
def clang(t, amp=.25):
    n = int(.9 * SR); x = np.arange(n) / SR; s = sum(np.sin(2 * np.pi * fr * x) / (q + 1) for q, fr in enumerate((523, 1290, 2210, 3170)))
    add(sfx, amp * s * np.exp(-x * 5), t)
def boing(t, amp=.25):
    n = int(.5 * SR); x = np.arange(n) / SR; add(sfx, amp * np.sin(2 * np.pi * (220 + 260 * np.exp(-x * 6) * np.cos(2 * np.pi * 14 * x)) * x) * np.exp(-x * 5), t)
def tick(t, amp=.12): add(sfx, noise(.02, amp, 200) + amp * .6 * np.sin(2 * np.pi * 3000 * np.arange(int(.02 * SR)) / SR), t)
def step(t, amp=.12): add(sfx, noise(.07, amp, 45, 6), t)
def slap(t, amp=.45): add(sfx, noise(.12, amp, 35, 2), t)

# 0-3.6  morning: soft music-box arpeggio, birds
for q in range(14):
    n_, o = [('A', 4), ('C#', 5), ('E', 5), ('A', 5), ('E', 5), ('C#', 5), ('B', 4)][q % 7]; add(music, tri(f(n_, o), .5, .16) * np.exp(-np.arange(int(.5 * SR)) / SR * 4), .2 + q * .25)
def birds(t0, t1, a=.03):
    for tt in np.arange(t0, t1, .9):
        tt += rng.uniform(0, .5); n = int(.12 * SR); x = np.arange(n) / SR
        add(amb, a * np.sin(2 * np.pi * (3200 + 900 * np.sin(2 * np.pi * 18 * x)) * x) * np.sin(np.pi * x / .12), tt)
birds(0, 3.6); birds(34.4, 47.4, .02)
fan = np.convolve(rng.standard_normal(N), np.ones(500) / 500, 'same') * .04; fan[int(34.4 * SR):] *= 0.0; amb += fan            # ceiling-fan hum indoors
boing(6.9, .3); whoosh(7.6, .35, .25)                                            # eyes snap open, jolt upright
jingle(7.75, [('A', 4), ('C#', 5), ('E', 5), ('A', 5)], .08)                     # MISSION ACTIVATED
groove(8.3, 19.0, 112, amp=.85)
for tt in np.arange(19.05, 20.3, .5): tick(tt)                                   # silence: just the clock
whoosh(20.55, .45, .35); thud(20.95, .5, 55)                                     # crash zoom
groove(21.0, 23.6, 112, amp=.6, lead=False)
jingle(23.7, [('E', 4), ('D#', 4), ('D', 4), ('C#', 4)], .2, last=.8)            # MISSION FAILED (sad descend)
n = int(2.5 * SR); x = np.arange(n) / SR; add(music, .06 * np.sin(2 * np.pi * 55 * x) * env(n, .3, .3), 25.4)   # tension drone
for q, tt in enumerate((26.0, 26.35, 26.75)): add(music, sq(f(['D', 'D', 'A#'][q], 2), .3 if q < 2 else .9, .12, .5), tt); thud(tt, .25, 60)   # dun dun DUNNN
whoosh(26.45, .3, .3)
groove(28.0, 34.4, 168, ('D', 2), amp=1.0)                                       # the chase
for q in range(5): add(sfx, sq(1320, .06, .08), 28.35 + q * .22)                 # wanted stars blips
for tt in np.arange(28.0, 34.4, .19): step(tt, .1)
for tt in np.arange(28.4, 34.2, .8): whoosh(tt, .22, .18)                        # chappal swings
slap(34.55, .35)                                                                  # door bangs
jingle(34.75, [('G', 4), ('C', 5)], .12, last=.3, amp=.6)                         # phew
add(music, sq(f('C', 2), 1.2, .12, .5), 36.65); thud(36.65, .45, 48); add(music, noise(.9, .08, 4), 36.65)   # boss entrance
n = int(1.8 * SR); x = np.arange(n) / SR; add(music, .05 * np.sin(2 * np.pi * 73.4 * x) * env(n, .2, .3), 37.4)
for q in range(4): add(music, tri(f(['C', 'E', 'G', 'E'][q], 5), .18, .1), 39.0 + q * .2)       # innocent whistle-ish
thud(43.75, .6, 60); clang(43.8, .22)                                            # cylinder lands in his arms
n = int(.8 * SR); x = np.arange(n) / SR; add(sfx, .1 * np.sin(2 * np.pi * (180 - 60 * x) * x) * env(n, .05, .3), 44.0)   # knees creak/groan
jingle(44.6, [('C', 5), ('E', 5), ('G', 5), ('E', 5), ('G', 5)], .08)              # MISSION UPDATED
def tuba_walk(t0, t1, bpm=84):
    beat = 60 / bpm; t = t0; k = 0
    while t < t1:
        add(music, sq(f(['C', 'G', 'A', 'G'][k % 4], 2), beat * .45, .1, .5), t); add(music, kick(.25), t); t += beat; k += 1
tuba_walk(45.0, 47.6)
for tt in np.arange(45.0, 47.4, .62): step(tt, .14)
n = int(.6 * SR); x = np.arange(n) / SR; add(amb, .05 * np.sign(np.sin(2 * np.pi * 420 * x)) * env(n, .02, .05), 45.6)    # scooter horn down the street
traffic = np.convolve(rng.standard_normal(N), np.ones(300) / 300, 'same') * .03; traffic[:int(34.4 * SR)] = 0; amb += traffic
n = int(8.5 * SR); x = np.arange(n) / SR; add(music, .035 * np.sin(2 * np.pi * 110 * x) * env(n, 1.0, 1.0), 47.5)   # camera monologue: just a low pad
add(music, sq(f('E', 4), .25, .06, .5), 55.3); add(music, sq(f('A', 3), .5, .06, .5), 55.5)                   # tiny button after the punchline
whoosh(56.3, .55, .35); thud(56.9, .7, 50); clang(56.95, .25)                     # the fall
jingle(57.1, [('E', 4), ('D#', 4), ('D', 4), ('C#', 4), ('C', 4), ('B', 3), ('A#', 3), ('A', 3)], .14, last=1.2)   # GAME OVER

def write(path, a):
    a = np.clip(a, -1, 1); s = (a * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w_: w_.setnchannels(1); w_.setsampwidth(2); w_.setframerate(SR); w_.writeframes(s.tobytes())
# levels: music at half the voice level (gated RMS), SFX at or below that, ambience low
vw = os.path.join(tmp, 'voice.wav'); sh('ffmpeg', '-loglevel', 'error', '-y', '-i', os.path.join(H, film['voice']), '-ac', '1', '-ar', str(SR), vw)
v = np.frombuffer(wave.open(vw).readframes(10 ** 9), dtype=np.int16).astype(np.float32) / 32767
def grms(a):
    m = np.abs(a).max() + 1e-12; g = a[np.abs(a) > .02 * m]
    return np.sqrt(np.mean(g ** 2)) if len(g) else 1e-9
vr = grms(v)
fade = np.ones(N); fade[int((TOTAL - 1.2) * SR):] = np.linspace(1, 0, N - int((TOTAL - 1.2) * SR)); music *= fade
music *= .25 * vr / grms(music)          # background at 25% of the narrator (-12 dB)
sfx *= .22 * vr / grms(sfx)
sfx = np.clip(sfx, -.4 * np.abs(v).max(), .4 * np.abs(v).max())
amb *= .12 * vr / (np.sqrt(np.mean(amb ** 2)) + 1e-9)
print('levels dB vs voice (gated RMS): music %.1f  sfx %.1f' % (20 * np.log10(grms(music) / vr), 20 * np.log10(grms(sfx) / vr)))
bed = (music + amb + sfx) * float(os.environ.get('BED', '1'))      # BED=.5 -> background 50% quieter
write(os.path.join(tmp, 'bed.wav'), bed / max(1.0, np.abs(bed).max()))
mixa = os.path.join(tmp, 'mix.m4a')
sh('ffmpeg', '-loglevel', 'error', '-y', '-i', vw, '-i', os.path.join(tmp, 'bed.wav'), '-filter_complex',
   f"[0:a]apad,atrim=0:{TOTAL}[v];[1:a]atrim=0:{TOTAL}[b];[v][b]amix=inputs=2:normalize=0:duration=longest,pan=stereo|c0=c0|c1=c0,volume=1.6,alimiter=limit=0.89[a]",
   '-map', '[a]', '-c:a', 'aac', '-b:a', '192k', mixa)
lst2 = os.path.join(tmp, 'fin.txt'); open(lst2, 'w').write(f"file '{main}'\n" + ('' if NOLOGO else f"file '{logo}'\n")); vid = os.path.join(tmp, 'video.mp4')
sh('ffmpeg', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst2, '-c', 'copy', vid)
sh('ffmpeg', '-loglevel', 'error', '-y', '-i', vid, '-i', mixa, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', outp)
print('wrote', outp)
