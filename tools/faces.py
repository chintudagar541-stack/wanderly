"""Faces in the reference's ink style. Canvas = front projection of the head; head radius = 0.47 * canvas.
Features are small and sit in the lower middle of the head. All lines are tapered brush strokes."""
from PIL import Image, ImageDraw
import math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ink import stroke, arc, bezier, ring, INK
OUT = sys.argv[1] if len(sys.argv) > 1 else 'blender/tex'
S = 2048; R = S * 0.47; C = S / 2
WHITE = (255, 255, 255, 255)
EY = C + R * 0.06      # eye line
EX = R * 0.34          # half eye spacing
MY = C + R * 0.46      # mouth
W = R * 0.085          # main face stroke
RF = R * 1.38          # feature scale

def brow(d, s, tilt, lift, seed):
    cx, cy = C + s * EX * 1.05, EY - RF * 0.2 - lift * R
    L = RF * 0.11
    a = tilt * s
    inner = (cx - s * L * math.cos(a), cy + L * math.sin(a))
    outer = (cx + s * L * math.cos(a), cy - L * math.sin(a))
    mid = ((inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2 - RF * 0.012)
    stroke(d, bezier(inner, mid, outer), RF * 0.06, taper=(0.12, 0.5), seed=seed, wobble=.04)

def eye(d, s, kind, look):
    cx, cy = C + s * EX + look[0] * RF * .035, EY + look[1] * RF * .025
    t = W * .55                                   # thin ink line for lids and rings
    if kind == 'dot':
        r = RF * .042; d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=INK)
    elif kind == 'half':      # thin lid line with a small dot tucked under it
        r = RF * .045
        d.pieslice([cx - r, cy - r, cx + r, cy + r], 0, 180, fill=INK)
        stroke(d, [(cx - RF * .085, cy - RF * .002), (cx + RF * .085, cy + RF * .002)], t, taper=(.25, .25), seed=7 + s)
    elif kind == 'wide':      # ring eyes with a small dot
        r = RF * .115
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)
        ring(d, cx, cy, r, t * 1.1, seed=11 + s, var=.12)
        p = RF * .033; o = look[0] * RF * .03
        d.ellipse([cx - p + o, cy - p, cx + p + o, cy + p], fill=INK)
    elif kind == 'arc':
        stroke(d, arc(cx, cy + RF * .035, RF * .07, RF * .06, math.pi * 1.1, math.pi * 1.9), t * 1.1, taper=(.3, .3), seed=13 + s)
    elif kind == 'closed':
        stroke(d, arc(cx, cy - RF * .025, RF * .07, RF * .05, math.pi * .12, math.pi * .88), t * 1.1, taper=(.3, .3), seed=15 + s)
    elif kind == 'squint':
        stroke(d, [(cx - s * RF * .075, cy - RF * .025), (cx + s * RF * .075, cy + RF * .012)], t * 1.2, taper=(.2, .4), seed=17 + s)

def mouth(d, kind):
    cx, cy = C, MY
    t = W * .6
    if kind == 'flat': stroke(d, [(cx - RF * .07, cy), (cx + RF * .07, cy + RF * .004)], t, taper=(.3, .3), seed=21)
    if kind == 'smirk': stroke(d, bezier((cx - RF * .07, cy + RF * .01), (cx + RF * .03, cy + RF * .025), (cx + RF * .09, cy - RF * .04)), t, taper=(.3, .4), seed=22)
    if kind == 'smile': stroke(d, arc(cx, cy - RF * .05, RF * .085, RF * .065, math.pi * .2, math.pi * .8), t, taper=(.3, .3), seed=23)
    if kind == 'frown': stroke(d, arc(cx, cy + RF * .06, RF * .08, RF * .05, math.pi * 1.2, math.pi * 1.8), t, taper=(.3, .3), seed=24)
    if kind == 'o':
        d.ellipse([cx - RF * .04, cy - RF * .04, cx + RF * .04, cy + RF * .05], fill=INK)
    if kind == 'talk':
        d.chord([cx - RF * .085, cy - RF * .06, cx + RF * .085, cy + RF * .09], 0, 180, fill=INK)
        d.chord([cx - RF * .045, cy + RF * .02, cx + RF * .045, cy + RF * .08], 0, 180, fill=(190, 80, 86, 255))
    if kind in ('grin', 'teeth'):
        w, h = RF * .14, RF * .075
        d.rounded_rectangle([cx - w, cy - h, cx + w, cy + h], RF * .03, fill=WHITE)
        for k in (-1, 0, 1): stroke(d, [(cx + k * w * .5, cy - h * .85), (cx + k * w * .5, cy + h * .85)], W * .22, taper=(.2, .2), seed=30 + k)
        stroke(d, [(cx - w * .92, cy), (cx + w * .92, cy)], W * .22, taper=(.1, .1), seed=36)
        o = arc(cx, cy, w, h, 0, math.tau, 80)
        # rounded-rectangle outline as an ink loop
        pts = []
        for i in range(81):
            a = i / 80 * math.tau; x, y = math.cos(a), math.sin(a)
            sx = math.copysign(abs(x) ** .35, x); sy = math.copysign(abs(y) ** .35, y)
            pts.append((cx + w * sx, cy + h * sy))
        stroke(d, pts, W * .42, taper=(0, 0), seed=37)
    if kind == 'wobble':
        stroke(d, [(cx - RF * .08 + i * RF * .16 / 6, cy + (RF * .015 if i % 2 else -RF * .015)) for i in range(7)], t, taper=(.2, .2), seed=38)

def mustache(d):
    y = MY - RF * .1
    for s in (-1, 1):
        stroke(d, bezier((C + s * RF * .01, y), (C + s * RF * .1, y - RF * .06), (C + s * RF * .17, y + RF * .035)), RF * .065, taper=(.05, .7), seed=40 + s)

def sweat(d):
    x, y = C + RF * .62, C - RF * .42
    d.polygon([(x, y - RF * .13), (x - RF * .065, y + RF * .02), (x + RF * .065, y + RF * .02)], fill=(150, 210, 255, 255))
    d.ellipse([x - RF * .065, y - RF * .045, x + RF * .065, y + RF * .085], fill=(150, 210, 255, 255))
    stroke(d, arc(x, y + RF * .02, RF * .065, RF * .065, -0.2, math.pi * 1.2) + [(x, y - RF * .14), (x + RF * .062, y + RF * .0)], W * .45, taper=(.1, .1), seed=50)

FACES = {  # eyes, brow tilt (+ = inner end up), brow lift, mouth, look, extras
  'deadpan': ('half', 0.0, 0.0, 'flat', (0, 0), ''),
  'smug':    ('half', -0.3, 0.0, 'smirk', (.7, 0), ''),
  'unimpressed': ('half', 0.25, 0.02, 'frown', (0, 0), ''),
  'shock':   ('wide', 0.35, 0.07, 'o', (0, 0), 'sweat'),
  'happy':   ('arc', 0.3, 0.04, 'smile', (0, 0), ''),
  'grin':    ('arc', 0.35, 0.05, 'teeth', (0, 0), ''),
  'sad':     ('half', 0.6, 0.03, 'frown', (0, .6), ''),
  'angry':   ('half', -0.6, -0.02, 'teeth', (0, 0), ''),
  'worry':   ('dot', 0.5, 0.04, 'wobble', (-.5, 0), 'sweat'),
  'talk':    ('dot', 0.15, 0.03, 'talk', (0, 0), ''),
  'sideeye': ('half', -0.1, 0.0, 'flat', (1, 0), ''),
  'calm':    ('dot', 0.05, 0.0, 'smile', (0, 0), ''),
  'blink':   ('closed', 0.0, 0.0, 'flat', (0, 0), ''),
  'sleepy':  ('closed', 0.2, 0.0, 'wobble', (0, 0), ''),
  'lonely':  ('half', 0.55, 0.02, 'flat', (0, .7), ''),
  'hopeful': ('dot', 0.45, 0.05, 'smile', (.3, -.5), ''),
  'scared':  ('wide', 0.55, 0.08, 'wobble', (0, 0), 'sweat'),
  'gasp':    ('wide', 0.35, 0.07, 'o', (0, 0), ''),
  'lookl':   ('dot', 0.05, 0.0, 'flat', (-1, 0), ''),
  'lookr':   ('dot', 0.05, 0.0, 'flat', (1, 0), ''),
  'laugh':   ('arc', 0.35, 0.05, 'talk', (0, 0), ''),
  'none':    (None, 0.0, 0.0, None, (0, 0), 'blank'),
}
ORDER = list(FACES)

def face(name, mustache_on=False):
    eyes, tilt, lift, m, look, ex = FACES[name]
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    if ex == 'blank': return img.resize((1024, 1024), Image.LANCZOS)
    for s in (-1, 1):
        eye(d, s, eyes, look)
        brow(d, s, tilt, lift, 60 + s)
    if mustache_on: mustache(d)
    mouth(d, m)
    if 'sweat' in ex: sweat(d)
    return img.resize((1024, 1024), Image.LANCZOS)

if __name__ == '__main__':
    os.makedirs(f'{OUT}/faces', exist_ok=True)
    for n in FACES:
        face(n).save(f'{OUT}/faces/{n}.png'); face(n, True).save(f'{OUT}/faces/{n}_mustache.png')
    for v, mo in (('plain', False), ('mustache', True)):
        os.makedirs(f'{OUT}/faceseq/{v}', exist_ok=True)
        for i, n in enumerate(ORDER): face(n, mo).save(f'{OUT}/faceseq/{v}/f_{i + 1:04d}.png')
    import json; json.dump(ORDER, open(f'{OUT}/faceseq/order.json', 'w'))
    print('faces', len(FACES))
