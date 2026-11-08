"""Brush/ink drawing helpers: strokes swell in the middle and taper at the ends, with a slight hand wobble."""
from PIL import Image, ImageDraw
import math, random

INK = (22, 17, 24, 255)

def _resample(pts, step):
    out = [pts[0]]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        L = math.hypot(x1 - x0, y1 - y0); n = max(1, int(L / step))
        for i in range(1, n + 1): out.append((x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n))
    return out

def stroke(d, pts, w, taper=(0.25, 0.25), col=INK, wobble=0.0, seed=1, minw=0.35):
    """Draw a brush stroke through pts. w = max width. taper = fraction of length used for each end."""
    rnd = random.Random(seed)
    P = _resample(pts, max(1.0, w / 6))
    n = len(P)
    for i, (x, y) in enumerate(P):
        t = i / max(1, n - 1)
        k = 1.0
        if taper[0] > 0 and t < taper[0]: k = minw + (1 - minw) * math.sin(t / taper[0] * math.pi / 2)
        if taper[1] > 0 and t > 1 - taper[1]: k = min(k, minw + (1 - minw) * math.sin((1 - t) / taper[1] * math.pi / 2))
        r = w * k / 2 * (1 + (rnd.random() - .5) * wobble)
        d.ellipse([x - r, y - r, x + r, y + r], fill=col)

def arc(cx, cy, rx, ry, a0, a1, n=60, rot=0.0):
    pts = []
    for i in range(n + 1):
        a = a0 + (a1 - a0) * i / n
        x, y = rx * math.cos(a), ry * math.sin(a)
        pts.append((cx + x * math.cos(rot) - y * math.sin(rot), cy + x * math.sin(rot) + y * math.cos(rot)))
    return pts

def bezier(p0, p1, p2, n=40):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in [i / n for i in range(n + 1)]]

def ring(d, cx, cy, r, w, col=INK, seed=3, var=0.25):
    """Closed ink circle whose weight swells and thins like a brush (heavier at lower right)."""
    rnd = random.Random(seed)
    N = 360
    for i in range(N):
        a = i / N * math.tau
        k = 1 + var * math.sin(a - 0.6) + (rnd.random() - .5) * 0.06
        rr = w * k / 2
        x, y = cx + r * math.cos(a), cy + r * math.sin(a)
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=col)
