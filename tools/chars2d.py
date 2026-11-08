"""Full-body character designs in the reference's ink style (concept sheet + texture source).
Units: head diameter = HD px. Big round head, narrow tube body, ink-line limbs, tiny round hands."""
from PIL import Image, ImageDraw, ImageFilter
import math, os, sys, random
sys.path.insert(0, os.path.dirname(__file__))
from ink import stroke, arc, bezier, ring, INK
import faces as F

def shade(c, k): return tuple(max(0, min(255, int(v * k))) for v in c[:3]) + (255,)
def hexc(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)

def rrect_pts(x0, y0, x1, y1, rt, rb, n=16):
    """Tube outline: rounded top corners (rt) and bottom corners (rb), clockwise from top-left."""
    pts = []
    for (cx, cy, r, a0) in ((x0 + rt, y0 + rt, rt, math.pi), (x1 - rt, y0 + rt, rt, -math.pi / 2), (x1 - rb, y1 - rb, rb, 0), (x0 + rb, y1 - rb, rb, math.pi / 2)):
        for i in range(n + 1):
            a = a0 + (math.pi / 2) * i / n
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def ink_loop(d, pts, w, seed):
    stroke(d, pts + pts[:2], w, taper=(0, 0), seed=seed, wobble=.12)

def draw(spec, pose, size=1400):
    HD = size * 0.3                       # head diameter
    img = Image.new('RGBA', (size, int(size * 1.25)), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    cx = size / 2
    O = HD * .038                         # outline weight
    T = HD * .022                         # detail weight
    L = HD * .045                         # limb weight
    sc = spec.get('scale', 1.0)
    headR = HD / 2
    headY = size * .2 + (1 - sc) * HD * 1.6
    bodyTop = headY + headR * .82
    bodyH = HD * (spec.get('bodyLen', 1.15)) * sc
    bodyW0, bodyW1 = HD * .7 * spec.get('wide', 1), HD * .76 * spec.get('wide', 1) * spec.get('flare', 1)
    bodyBot = bodyTop + bodyH
    body = spec['body']
    # ---- legs
    legLen = HD * .9 * sc if not spec.get('robe') else HD * .12
    for s in (-1, 1):
        hx, hy = cx + s * HD * .1, bodyBot - HD * .05
        swing = pose.get('step', 0) * s
        kx, ky = hx + s * HD * .02 + swing * HD * .1, hy + legLen * .5
        fx, fy = hx + s * HD * .03 + swing * HD * .16, hy + legLen
        stroke(d, [(hx, hy), (kx, ky), (fx, fy)], L, taper=(0, .1), seed=5 + s)
        sh = hexc(spec.get('shoes', '#3b2a1f'))
        d.ellipse([fx - HD * .02 + s * HD * .02 - HD * .07, fy - HD * .045, fx + s * HD * .04 + HD * .07, fy + HD * .03], fill=sh)
        stroke(d, arc(fx + s * HD * .01, fy - HD * .007, HD * .095, HD * .04, 0, math.tau), T * 1.2, taper=(0, 0), seed=9 + s)
    # ---- body tube
    x0, x1 = cx - bodyW0 / 2, cx + bodyW0 / 2
    pts = rrect_pts(x0 - (bodyW1 - bodyW0) * 0, bodyTop, x1, bodyBot, bodyW0 * .42, HD * .12)
    # flare the bottom
    fl = (bodyW1 - bodyW0) / 2
    pts = [(x + (fl * ((y - bodyTop) / bodyH) if x > cx else -fl * ((y - bodyTop) / bodyH)), y) for (x, y) in pts]
    d.polygon(pts, fill=body)
    # cel shade band on the right
    m = Image.new('L', img.size, 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    band = Image.new('RGBA', img.size, (0, 0, 0, 0)); bd = ImageDraw.Draw(band)
    bd.rectangle([cx + bodyW0 * .22, 0, size, img.size[1]], fill=shade(body, .8))
    img.paste(band, (0, 0), Image.composite(band, Image.new('RGBA', img.size, (0, 0, 0, 0)), m).split()[3])
    costume(d, spec, cx, bodyTop, bodyBot, bodyW0, bodyW1, T, O, HD)
    ink_loop(d, pts, O, 21)
    # ---- arms (ink lines) + hands
    hands = []
    for s, key in ((-1, 'armL'), (1, 'armR')):
        a1, a2 = pose.get(key, (.25, .15))
        sx, sy = cx + s * bodyW0 * .46, bodyTop + HD * .2
        ex, ey = sx + s * math.sin(a1) * HD * .42, sy + math.cos(a1) * HD * .42
        hx, hy = ex + s * math.sin(a1 + a2) * HD * .38, ey + math.cos(a1 + a2) * HD * .38
        stroke(d, [(sx, sy), (ex, ey), (hx, hy)], L, taper=(0, 0), seed=31 + s)
        r = HD * .065
        d.ellipse([hx - r, hy - r, hx + r, hy + r], fill=hexc(spec.get('gloves', '#f6f2ea')))
        ring(d, hx, hy, r, T * 1.15, seed=33 + s, var=.1)
        hands.append((hx, hy))
    # ---- scarf
    if spec.get('scarf'):
        c = hexc(spec['scarf'])
        sp = arc(cx, bodyTop + HD * .02, bodyW0 * .48, HD * .09, 0, math.pi, 30) + arc(cx, bodyTop - HD * .03, bodyW0 * .46, HD * .07, math.pi, 0, 30)
        d.polygon(sp, fill=c); ink_loop(d, sp, T * 1.2, 41)
        tail = [(cx + HD * .08, bodyTop + HD * .05), (cx + HD * .19, bodyTop + HD * .04), (cx + HD * .2, bodyTop + HD * .42), (cx + HD * .1, bodyTop + HD * .43)]
        d.polygon(tail, fill=shade(c, .9)); ink_loop(d, tail, T * 1.2, 42)
        for k in range(2): stroke(d, [(cx + HD * .1, bodyTop + HD * (.33 + k * .05)), (cx + HD * .2, bodyTop + HD * (.32 + k * .05))], T * .8, taper=(0, 0), seed=43 + k, col=shade(c, .65))
    # ---- head
    hx, hy = cx, headY
    hl = Image.new('RGBA', img.size, (0, 0, 0, 0)); hd = ImageDraw.Draw(hl)
    skin = hexc(spec.get('skin', '#f6f2ea'))
    hd.ellipse([hx - headR, hy - headR, hx + headR, hy + headR], fill=skin)
    # soft shade, lower right
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse([hx - headR * .55, hy - headR * .35, hx + headR * 1.35, hy + headR * 1.4], fill=(120, 110, 120, 40))
    sh = sh.filter(ImageFilter.GaussianBlur(HD * .06))
    mk = Image.new('L', img.size, 0); ImageDraw.Draw(mk).ellipse([hx - headR, hy - headR, hx + headR, hy + headR], fill=255)
    hl.paste(sh, (0, 0), Image.composite(sh, Image.new('RGBA', img.size, (0, 0, 0, 0)), mk).split()[3]) if False else None
    hl = Image.alpha_composite(hl, Image.composite(sh, Image.new('RGBA', img.size, (0, 0, 0, 0)), mk))
    hair(ImageDraw.Draw(hl), spec, hx, hy, headR, T, mk, hl)
    fimg = F.face(pose.get('face', 'deadpan'), spec.get('mustache', False)).resize((int(headR * 2 / .94), int(headR * 2 / .94)), Image.LANCZOS)
    hl.alpha_composite(fimg, (int(hx - fimg.width / 2), int(hy - fimg.height / 2)))
    img.alpha_composite(hl)
    d = ImageDraw.Draw(img)
    ring(d, hx, hy, headR, O * 1.05, seed=51, var=.22)
    hat(d, img, spec, hx, hy, headR, O, T, HD)
    # props
    for p in pose.get('props', []):
        prop(d, p, hands[1 if p.get('hand', 'R') == 'R' else 0], T, O, HD)
    return img

def costume(d, S, cx, top, bot, w0, w1, T, O, HD):
    k = S.get('costume'); body = S['body']; dark = shade(body, .6)
    if k == 'vest':   # shirt sleeves showing at top + vest with buttons and a pocket
        shirt = hexc(S.get('shirt', '#e9e1cf'))
        d.polygon([(cx - w0 * .18, top + HD * .02), (cx + w0 * .18, top + HD * .02), (cx, top + HD * .32)], fill=shirt)
        stroke(d, [(cx - w0 * .18, top + HD * .02), (cx, top + HD * .32), (cx + w0 * .18, top + HD * .02)], T, taper=(0, 0), seed=61)
        stroke(d, [(cx, top + HD * .32), (cx, bot - HD * .05)], T, taper=(0, .2), seed=62)
        for i in range(3): r = HD * .025; y = top + HD * (.45 + i * .18); d.ellipse([cx - r - HD * .04, y - r, cx + r - HD * .04, y + r], fill=hexc('#c9a54a'))
        stroke(d, [(cx + w0 * .1, top + HD * .5), (cx + w0 * .32, top + HD * .5)], T, taper=(0, 0), seed=63)
    if k in ('suit', 'coat'):
        shirt = hexc(S.get('shirt', '#f1ede4'))
        d.polygon([(cx - w0 * .2, top + HD * .02), (cx + w0 * .2, top + HD * .02), (cx, top + HD * .38)], fill=shirt)
        if S.get('tie'): d.polygon([(cx - HD * .03, top + HD * .06), (cx + HD * .03, top + HD * .06), (cx + HD * .04, top + HD * .3), (cx, top + HD * .36), (cx - HD * .04, top + HD * .3)], fill=hexc(S['tie']))
        for s in (-1, 1): stroke(d, [(cx + s * w0 * .2, top + HD * .02), (cx + s * w0 * .05, top + HD * .45)], T * 1.1, taper=(0, .3), seed=64 + s)
        stroke(d, [(cx, top + HD * .38), (cx, bot - HD * .06)], T, taper=(0, .2), seed=66)
        for i in range(S.get('buttons', 2)):
            r = HD * .025; y = top + HD * (.55 + i * .2)
            for bx in ([-.07, .07] if S.get('double') else [-.05]): d.ellipse([cx + bx * HD - r, y - r, cx + bx * HD + r, y + r], fill=hexc(S.get('buttonCol', '#2a2430')))
    if k == 'overalls':
        shirt = hexc(S.get('shirt', '#d9c9a6')); d.rectangle([cx - w0 * .5, top, cx + w0 * .5, top + HD * .3], fill=shirt)
        bib = [(cx - w0 * .3, top + HD * .25), (cx + w0 * .3, top + HD * .25), (cx + w0 * .3, top + HD * .6), (cx - w0 * .3, top + HD * .6)]
        d.polygon(bib, fill=body); ink_loop(d, bib, T, 67)
        for s in (-1, 1): stroke(d, [(cx + s * w0 * .25, top + HD * .27), (cx + s * w0 * .36, top + HD * .02)], T * 2.2, taper=(0, 0), seed=68 + s, col=dark)
        for s in (-1, 1): r = HD * .022; d.ellipse([cx + s * w0 * .23 - r, top + HD * .33 - r, cx + s * w0 * .23 + r, top + HD * .33 + r], fill=hexc('#d8c070'))
        stroke(d, [(cx - w0 * .14, top + HD * .42), (cx + w0 * .14, top + HD * .42)], T * .8, taper=(0, 0), seed=69)
    if k == 'robe':
        d.polygon([(cx - HD * .1, top + HD * .02), (cx + HD * .1, top + HD * .02), (cx + HD * .06, top + HD * .32), (cx, top + HD * .27), (cx - HD * .06, top + HD * .32)], fill=(244, 241, 234, 255))
        stroke(d, [(cx - HD * .1, top + HD * .02), (cx - HD * .06, top + HD * .32), (cx, top + HD * .27), (cx + HD * .06, top + HD * .32), (cx + HD * .1, top + HD * .02)], T, taper=(0, 0), seed=70)
        for i in range(3): stroke(d, [(cx - w0 * .3 + i * w0 * .3, top + HD * .5), (cx - w0 * .33 + i * w0 * .3 - HD * .02, bot - HD * .1)], T * .7, taper=(.2, .3), seed=71 + i, col=shade(body, 1.8))
    if k == 'dress':
        ap = [(cx - w0 * .28, top + HD * .5), (cx + w0 * .28, top + HD * .5), (cx + w1 * .36, bot - HD * .08), (cx - w1 * .36, bot - HD * .08)]
        d.polygon(ap, fill=(240, 234, 220, 255)); ink_loop(d, ap, T, 74)
        stroke(d, [(cx - w0 * .5, top + HD * .5), (cx + w0 * .5, top + HD * .5)], T * 1.5, taper=(0, 0), seed=75, col=dark)
        d.polygon([(cx - w0 * .16, top + HD * .02), (cx + w0 * .16, top + HD * .02), (cx, top + HD * .2)], fill=(240, 234, 220, 255))
    if k == 'stripes':
        for i in range(7):
            y = top + HD * (.16 + i * .14)
            stroke(d, [(cx - w0 * .5, y), (cx + w0 * .5, y)], HD * .05, taper=(0, 0), seed=80 + i, col=hexc(S.get('stripe', '#2e4a7a')))
        d.polygon([(cx - w0 * .4, top + HD * .02), (cx + w0 * .4, top + HD * .02), (cx, top + HD * .22)], fill=hexc('#2e4a7a'))
    if S.get('belt'):
        y = top + HD * S.get('beltY', .62)
        stroke(d, [(cx - w0 * .5, y), (cx + w0 * .5, y)], HD * .055, taper=(0, 0), seed=90, col=hexc(S['belt']))
        r = HD * .04; d.rectangle([cx - r, y - r, cx + r, y + r], outline=hexc('#d9b24a'), width=int(T))
    if S.get('sash'):
        stroke(d, [(cx - w0 * .48, top + HD * .12), (cx + w0 * .48, top + HD * .72)], HD * .07, taper=(0, 0), seed=91, col=hexc(S['sash']))

def hair(d, S, hx, hy, R, T, mask, layer):
    h = S.get('hair')
    if not h: return
    c = hexc(S.get('hairCol', '#3a2a1e'))
    tmp = Image.new('RGBA', layer.size, (0, 0, 0, 0)); td = ImageDraw.Draw(tmp)
    if h == 'short':   # cap of hair with a side part
        td.ellipse([hx - R * 1.1, hy - R * 1.25, hx + R * 1.1, hy - R * .2], fill=c)
        td.polygon([(hx - R, hy - R * .4), (hx - R * .62, hy - R * .55), (hx - R * .7, hy + R * .05), (hx - R, hy + R * .05)], fill=c)
    if h == 'bun':
        td.ellipse([hx - R * 1.1, hy - R * 1.2, hx + R * 1.1, hy - R * .25], fill=c)
    if h == 'side':    # bald on top, tufts at the sides
        for s in (-1, 1): td.ellipse([hx + s * R * .78 - R * .3, hy - R * .55, hx + s * R * .78 + R * .3, hy + R * .1], fill=c)
    if h == 'sideburn':
        td.polygon([(hx - R, hy - R * .5), (hx - R * .55, hy - R * .6), (hx - R * .62, hy + R * .1), (hx - R * .98, hy + R * .1)], fill=c)
    clipped = Image.composite(tmp, Image.new('RGBA', layer.size, (0, 0, 0, 0)), mask)
    layer.alpha_composite(clipped)
    ld = ImageDraw.Draw(layer)
    if h in ('short', 'bun'):   # ink hairline
        stroke(ld, bezier((hx - R * .98, hy - R * .3), (hx - R * .2, hy - R * .38), (hx + R * .98, hy - R * .3)), T, taper=(.1, .1), seed=101)
        for k in range(4): stroke(ld, bezier((hx - R * .5 + k * R * .3, hy - R * .9), (hx - R * .45 + k * R * .3, hy - R * .6), (hx - R * .4 + k * R * .32, hy - R * .38)), T * .6, taper=(.3, .3), seed=102 + k, col=shade(c, 1.6))

def hat(d, img, S, hx, hy, R, O, T, HD):
    h = S.get('hat'); c1 = hexc(S.get('hatCol', '#2b2b33')); c2 = hexc(S.get('hatCol2', '#e6dfd0'))
    if not h: return
    if h == 'bun':
        r = R * .36; d.ellipse([hx - r, hy - R * 1.22 - r, hx + r, hy - R * 1.22 + r], fill=hexc(S.get('hairCol', '#2e2118'))); ring(d, hx, hy - R * 1.22, r, T * 1.3, seed=111)
        return
    if h == 'flatcap':    # striped newsboy cap tilted forward with a visor
        crown = arc(hx + R * .05, hy - R * .55, R * 1.08, R * .62, math.pi, math.tau, 40)
        crown = crown + [(hx + R * 1.13, hy - R * .5), (hx - R * 1.03, hy - R * .5)]
        m = Image.new('L', img.size, 0); ImageDraw.Draw(m).polygon(crown, fill=255)
        st = Image.new('RGBA', img.size, c1); sd = ImageDraw.Draw(st)
        for i in range(-12, 13): stroke(sd, bezier((hx + i * R * .1, hy - R * .5), (hx + i * R * .07, hy - R * .9), (hx + R * .05, hy - R * 1.17)), R * .07, taper=(0, .4), col=c2, seed=120 + i)
        img.paste(st, (0, 0), m)
        stroke(d, crown + crown[:1], T * 1.4, taper=(0, 0), seed=121, wobble=.1)
        vis = [(hx - R * 1.03, hy - R * .5), (hx + R * .4, hy - R * .5), (hx + R * .2, hy - R * .32), (hx - R * 1.1, hy - R * .35)]
        d.polygon(vis, fill=shade(c1, .7)); stroke(d, vis + vis[:1], T * 1.3, taper=(0, 0), seed=122)
        r = R * .07; d.ellipse([hx + R * .05 - r, hy - R * 1.2 - r, hx + R * .05 + r, hy - R * 1.2 + r], fill=c1); ring(d, hx + R * .05, hy - R * 1.2, r, T, seed=123)
    if h == 'top':
        crown = [(hx - R * .6, hy - R * .72), (hx - R * .55, hy - R * 1.95), (hx + R * .55, hy - R * 1.95), (hx + R * .6, hy - R * .72)]
        d.polygon(crown, fill=c1); stroke(d, crown + crown[:1], O * .9, taper=(0, 0), seed=131)
        d.polygon([(hx - R * .59, hy - R * .9), (hx + R * .59, hy - R * .9), (hx + R * .6, hy - R * .74), (hx - R * .6, hy - R * .74)], fill=c2)
        br = arc(hx, hy - R * .72, R * .95, R * .14, 0, math.tau, 50); d.polygon(br, fill=c1); stroke(d, br + br[:1], O * .9, taper=(0, 0), seed=132)
    if h == 'beanie':
        crown = arc(hx, hy - R * .45, R * 1.04, R * .75, math.pi, math.tau, 40)
        m = Image.new('L', img.size, 0); ImageDraw.Draw(m).polygon(crown, fill=255)
        st = Image.new('RGBA', img.size, c1); sd = ImageDraw.Draw(st)
        for i in range(4): sd.rectangle([0, hy - R * (1.15 - i * .2), img.size[0], hy - R * (1.08 - i * .2)], fill=c2)
        img.paste(st, (0, 0), m); stroke(d, crown + crown[:1], O * .8, taper=(0, 0), seed=141)
        band = [(hx - R * 1.06, hy - R * .58), (hx + R * 1.06, hy - R * .58), (hx + R * 1.06, hy - R * .38), (hx - R * 1.06, hy - R * .38)]
        d.polygon(band, fill=shade(c1, .85)); stroke(d, band + band[:1], O * .8, taper=(0, 0), seed=142)
        r = R * .2; d.ellipse([hx - r, hy - R * 1.22 - r, hx + r, hy - R * 1.22 + r], fill=c2); ring(d, hx, hy - R * 1.22, r, T * 1.3, seed=143)
    if h == 'helmet':
        dome = arc(hx, hy - R * .45, R * 1.02, R * .78, math.pi, math.tau, 40)
        d.polygon(dome, fill=c1); stroke(d, dome + dome[:1], O * .9, taper=(0, 0), seed=151)
        for k in (-1, 0, 1): stroke(d, bezier((hx + k * R * .4, hy - R * 1.2), (hx + k * R * .7, hy - R * .9), (hx + k * R * .9, hy - R * .48)), T, taper=(.2, .2), seed=152 + k, col=shade(c1, .65))
        br = arc(hx + R * .1, hy - R * .45, R * 1.45, R * .17, 0, math.tau, 50); d.polygon(br, fill=c1); stroke(d, br + br[:1], O * .85, taper=(0, 0), seed=155)
        b = [(hx, hy - R * 1.08), (hx + R * .18, hy - R * .82), (hx, hy - R * .55), (hx - R * .18, hy - R * .82)]
        d.polygon(b, fill=hexc('#e7c35a')); stroke(d, b + b[:1], T, taper=(0, 0), seed=156)
    if h == 'wig':
        for s in (-1, 1):
            for i in range(3):
                r = R * .22; x, y = hx + s * R * .98, hy - R * .3 + i * R * .36
                d.ellipse([x - r, y - r, x + r, y + r], fill=(238, 236, 230, 255)); ring(d, x, y, r, T * 1.2, seed=160 + i + s * 5)
        top = arc(hx, hy - R * .3, R * 1.05, R * .82, math.pi * 1.05, math.pi * 1.95, 40)
        d.polygon(top + [(hx, hy - R * .55)], fill=(238, 236, 230, 255)); stroke(d, top, O * .8, taper=(.05, .05), seed=167)
        for k in range(-2, 3): stroke(d, arc(hx + k * R * .32, hy - R * .9, R * .14, R * .1, math.pi, math.tau, 16), T * .8, taper=(.2, .2), seed=170 + k)
    if h == 'sailor':
        cap = [(hx - R * .85, hy - R * .7), (hx + R * .85, hy - R * .7), (hx + R * .7, hy - R * 1.02), (hx - R * .7, hy - R * 1.02)]
        d.polygon(cap, fill=(245, 243, 238, 255)); stroke(d, cap + cap[:1], O * .8, taper=(0, 0), seed=181)
        d.polygon([(hx - R * .85, hy - R * .7), (hx + R * .85, hy - R * .7), (hx + R * .85, hy - R * .58), (hx - R * .85, hy - R * .58)], fill=hexc('#2e4a7a'))

def prop(d, p, hand, T, O, HD):
    x, y = hand; t = p['type']
    if t == 'cup':
        pts = [(x - HD * .07, y - HD * .16), (x + HD * .07, y - HD * .16), (x + HD * .055, y + HD * .02), (x - HD * .055, y + HD * .02)]
        d.polygon(pts, fill=(233, 227, 214, 255)); stroke(d, pts + pts[:1], T * 1.2, taper=(0, 0), seed=191)
        d.ellipse([x - HD * .065, y - HD * .18, x + HD * .065, y - HD * .14], fill=(70, 34, 12, 255))
    if t == 'brush':
        stroke(d, [(x, y), (x + HD * .05, y - HD * .3)], T * 1.6, taper=(0, 0), seed=192, col=(150, 100, 60, 255))
        b = [(x - HD * .04, y - HD * .3), (x + HD * .14, y - HD * .3), (x + HD * .15, y - HD * .44), (x - HD * .03, y - HD * .44)]
        d.polygon(b, fill=(214, 192, 150, 255)); stroke(d, b + b[:1], T, taper=(0, 0), seed=193)
        d.polygon([(x - HD * .03, y - HD * .4), (x + HD * .15, y - HD * .4), (x + HD * .15, y - HD * .45), (x - HD * .03, y - HD * .45)], fill=(60, 30, 10, 255))
    if t == 'gavel':
        stroke(d, [(x, y), (x - HD * .05, y - HD * .3)], T * 1.8, taper=(0, 0), seed=194, col=(130, 85, 48, 255))
        g = [(x - HD * .17, y - HD * .3), (x + HD * .07, y - HD * .36), (x + HD * .09, y - HD * .27), (x - HD * .15, y - HD * .21)]
        d.polygon(g, fill=(120, 74, 40, 255)); stroke(d, g + g[:1], T * 1.2, taper=(0, 0), seed=195)
    if t == 'bottle':
        b = [(x - HD * .05, y + HD * .05), (x - HD * .05, y - HD * .14), (x - HD * .02, y - HD * .2), (x - HD * .02, y - HD * .28), (x + HD * .02, y - HD * .28), (x + HD * .02, y - HD * .2), (x + HD * .05, y - HD * .14), (x + HD * .05, y + HD * .05)]
        d.polygon(b, fill=(63, 154, 92, 255)); stroke(d, b + b[:1], T * 1.2, taper=(0, 0), seed=196)
    if t == 'cane':
        stroke(d, [(x, y), (x + HD * .02, y + HD * .9)], T * 2, taper=(0, 0), seed=197, col=(110, 70, 40, 255))
        stroke(d, arc(x - HD * .05, y, HD * .06, HD * .05, math.pi, math.tau), T * 2, taper=(0, 0), seed=198, col=(110, 70, 40, 255))

CAST = [
  ('worker',  dict(body=hexc('#c8a23a'), costume='vest', shirt='#e8dfcc', hat='flatcap', hatCol='#2c3f66', hatCol2='#e9e4d8', hair='sideburn', hairCol='#5a3a22'), dict(face='smug', armL=(.3, .2), armR=(1.6, .9))),
  ('foreman', dict(body=hexc('#2c2a36'), costume='suit', tie='#a8322b', hat='top', hatCol='#1d1b22', hatCol2='#8a2f2a', mustache=True, buttons=2, scarf='#7a2b2b'), dict(face='unimpressed', armL=(.15, .1), armR=(.2, .15))),
  ('judge',   dict(body=hexc('#17151c'), costume='robe', robe=True, bodyLen=2.2, hat='wig', sash='#7a1f22'), dict(face='deadpan', armL=(.3, .3), armR=(2.4, .6), props=[dict(type='gavel', hand='R')])),
  ('mother',  dict(body=hexc('#6e3a66'), costume='dress', flare=1.3, bodyLen=1.5, hair='bun', hat='bun', hairCol='#2e2118', shoes='#5a2a2a'), dict(face='angry', armL=(.35, .9), armR=(2.0, .5), props=[dict(type='bottle', hand='R')])),
  ('kid',     dict(body=hexc('#b5432f'), costume='coat', buttons=3, double=True, buttonCol='#e8d48a', hat='beanie', hatCol='#2f6b7a', hatCol2='#e9c25a', scale=.72, belt='#2a2430', beltY=.55), dict(face='grin', armL=(.4, .2), armR=(2.8, .1), props=[dict(type='cup', hand='R')])),
  ('fireman', dict(body=hexc('#223047'), costume='coat', buttons=3, double=True, buttonCol='#e3c160', hat='helmet', hatCol='#b3312a', gloves='#3a2e28', belt='#3a2e28', beltY=.6), dict(face='shock', armL=(.6, .4), armR=(.6, .4))),
  ('sailor',  dict(body=hexc('#f2efe8'), costume='stripes', stripe='#2e4a7a', hat='sailor'), dict(face='talk', armL=(.3, .2), armR=(1.2, 1.2))),
  ('oldman',  dict(body=hexc('#7a5636'), costume='coat', buttons=3, buttonCol='#3a2a1a', hair='side', hairCol='#bdb8b0', scarf='#3f6b4a', bodyLen=1.1), dict(face='worry', armL=(.3, .2), armR=(.35, .3), props=[dict(type='cane', hand='R')])),
]

def body_texture(spec, path, W=1024):
    '''Front of the body tube as a flat painted texture (costume + ink detail, no silhouette).'''
    HD = W / .7 / spec.get('wide', 1)
    bodyH = HD * spec.get('bodyLen', 1.15)
    Hh = int(bodyH)
    img = Image.new('RGBA', (W, Hh), spec['body']); d = ImageDraw.Draw(img)
    costume(d, spec, W / 2, 0, Hh, W, W * spec.get('flare', 1), HD * .022, HD * .038, HD)
    if spec.get('scarf'): pass
    img.save(path); return Hh / W

def stripe_texture(c1, c2, path, n=10, vertical=True):
    img = Image.new('RGBA', (512, 512), hexc(c1)); d = ImageDraw.Draw(img)
    for i in range(n):
        if vertical: d.rectangle([i * 512 / n, 0, i * 512 / n + 512 / n * .45, 512], fill=hexc(c2))
        else: d.rectangle([0, i * 512 / n, 512, i * 512 / n + 512 / n * .45], fill=hexc(c2))
    img.save(path)

def export(outdir):
    import json
    os.makedirs(outdir, exist_ok=True)
    meta = {}
    for name, spec, pose in CAST:
        ratio = body_texture(spec, f'{outdir}/body_{name}.png')
        sp = {k: (('#%02x%02x%02x' % v[:3]) if isinstance(v, tuple) else v) for k, v in spec.items()}
        meta[name] = dict(spec=sp, pose=pose, ratio=ratio)
    stripe_texture('#2c3f66', '#e9e4d8', f'{outdir}/hat_flatcap.png', 14, True)
    stripe_texture('#2f6b7a', '#e9c25a', f'{outdir}/hat_beanie.png', 5, False)
    stripe_texture('#7a2b2b', '#5a1f1f', f'{outdir}/scarf_red.png', 6, True)
    stripe_texture('#3f6b4a', '#2c4d35', f'{outdir}/scarf_green.png', 6, True)
    json.dump(meta, open(f'{outdir}/cast.json', 'w'), indent=1)
    print('exported', len(meta))

if __name__ == '__main__' and len(sys.argv) > 2 and sys.argv[1] == 'export':
    export(sys.argv[2]); sys.exit()

if __name__ == '__main__':
    out = sys.argv[1]
    imgs = [draw(s, p) for _, s, p in CAST]
    w, h = imgs[0].size; k = .42
    sheet = Image.new('RGB', (int(w * k * 4), int(h * k * 2)), (198, 214, 228))
    for i, im in enumerate(imgs):
        im = im.resize((int(w * k), int(h * k)), Image.LANCZOS)
        sheet.paste(im, ((i % 4) * im.width, (i // 4) * im.height), im)
    sheet.save(out); print(sheet.size)
