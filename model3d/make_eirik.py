"""Generates a low-poly 3D model of Eirik Stonehand as OBJ + MTL (Y-up, metres, faces +Z).
Every body part is a separate named object so it can be posed/animated in Prisma 3D."""
import math, pathlib
OUT = pathlib.Path(__file__).parent
V, F, objs = [], [], []          # global vertex list; objs = (name, mtl, faces)

def rot(p, rx=0, ry=0, rz=0):
    x, y, z = p
    for a, ax in ((rx, 'x'), (ry, 'y'), (rz, 'z')):
        a = math.radians(a); c, s = math.cos(a), math.sin(a)
        if ax == 'x': y, z = y*c - z*s, y*s + z*c
        if ax == 'y': x, z = x*c + z*s, -x*s + z*c
        if ax == 'z': x, y = x*c - y*s, x*s + y*c
    return (x, y, z)

def add(name, mtl, verts, faces, at=(0, 0, 0), r=(0, 0, 0)):
    base = len(V) + 1
    for v in verts:
        x, y, z = rot(v, *r); V.append((x + at[0], y + at[1], z + at[2]))
    objs.append((name, mtl, [[base + i for i in f] for f in faces]))

def box(name, mtl, size, at, r=(0, 0, 0)):
    sx, sy, sz = (s / 2 for s in size)
    v = [(-sx,-sy,-sz),(sx,-sy,-sz),(sx,sy,-sz),(-sx,sy,-sz),(-sx,-sy,sz),(sx,-sy,sz),(sx,sy,sz),(-sx,sy,sz)]
    f = [[0,3,2,1],[4,5,6,7],[0,1,5,4],[2,3,7,6],[1,2,6,5],[0,4,7,3]]
    add(name, mtl, v, f, at, r)

def frustum(name, mtl, r0, r1, h, at, seg=10, zs=1.0, r=(0, 0, 0)):
    """Tapered cylinder from y=0 (radius r0) to y=h (radius r1); zs squashes depth."""
    v = []
    for y, rr in ((0, r0), (h, r1)):
        for i in range(seg):
            a = 2*math.pi*i/seg; v.append((rr*math.cos(a), y, -rr*math.sin(a)*zs))
    v += [(0, 0, 0), (0, h, 0)]
    f = [[i, (i+1) % seg, seg + (i+1) % seg, seg + i] for i in range(seg)]
    f += [[2*seg, (i+1) % seg, i] for i in range(seg)] + [[2*seg+1, seg+i, seg+(i+1) % seg] for i in range(seg)]
    add(name, mtl, v, f, at, r)

def ellipsoid(name, mtl, rad, at, seg=12, rings=8, lat=(-90, 90), r=(0, 0, 0)):
    a0, a1 = map(math.radians, lat); v = []; f = []
    for j in range(rings + 1):
        phi = a0 + (a1 - a0)*j/rings
        for i in range(seg):
            th = 2*math.pi*i/seg
            v.append((rad[0]*math.cos(phi)*math.cos(th), rad[1]*math.sin(phi), -rad[2]*math.cos(phi)*math.sin(th)))
    for j in range(rings):
        for i in range(seg):
            a, b = j*seg + i, j*seg + (i+1) % seg
            f.append([a, b, b + seg, a + seg])
    # close an open cut with a flat cap
    if lat[0] > -90:
        v.append((0, rad[1]*math.sin(a0), 0)); c = len(v)-1; f += [[c, (i+1) % seg, i] for i in range(seg)]
    if lat[1] < 90:
        v.append((0, rad[1]*math.sin(a1), 0)); c = len(v)-1; t = rings*seg; f += [[c, t+i, t+(i+1) % seg] for i in range(seg)]
    add(name, mtl, v, f, at, r)

# ---------------- Eirik ----------------
for side, sx in (('L', 1), ('R', -1)):
    x = 0.11*sx
    box(f'Boot_{side}', 'boot', (0.13, 0.13, 0.25), (x, 0.065, 0.03))
    frustum(f'LegWrap_{side}', 'wrap', 0.068, 0.074, 0.34, (x, 0.12, 0))
    frustum(f'Leg_{side}', 'pants', 0.062, 0.088, 0.62, (x, 0.12, 0))
    # arm: shoulder pivot at top of upper arm
    frustum(f'UpperArm_{side}', 'tunic', 0.06, 0.07, 0.32, (0.27*sx, 1.06, 0), r=(0, 0, 4*sx))
    frustum(f'Forearm_{side}', 'wrap', 0.05, 0.058, 0.27, (0.29*sx, 0.80, 0.01), r=(0, 0, 3*sx))
    ellipsoid(f'Fist_{side}', 'wrap', (0.06, 0.065, 0.06), (0.30*sx, 0.76, 0.015), seg=8, rings=6)
    ellipsoid(f'Ear_{side}', 'skin', (0.02, 0.035, 0.025), (0.122*sx, 1.635, -0.005), seg=6, rings=4)
    ellipsoid(f'Eye_{side}', 'eye', (0.022, 0.012, 0.01), (0.045*sx, 1.655, 0.118), seg=8, rings=4)
    ellipsoid(f'Iris_{side}', 'iris', (0.009, 0.009, 0.006), (0.045*sx, 1.655, 0.126), seg=6, rings=4)
    box(f'Brow_{side}', 'hair', (0.055, 0.014, 0.02), (0.048*sx, 1.682, 0.12), r=(0, 0, 12*sx))
    for k in range(6):  # braid
        ellipsoid(f'Braid_{side}_{k}', 'hair', (0.032, 0.036, 0.032), (0.125*sx, 1.58 - k*0.055, -0.02), seg=8, rings=5)
    box(f'BraidTie_{side}', 'gold', (0.05, 0.02, 0.05), (0.125*sx, 1.255, -0.02))

frustum('TunicSkirt', 'tunic', 0.25, 0.205, 0.26, (0, 0.62, 0), zs=0.75)
frustum('Torso', 'tunic', 0.205, 0.215, 0.56, (0, 0.86, 0), zs=0.7)
frustum('Vest', 'vest', 0.22, 0.228, 0.46, (0, 0.96, -0.004), zs=0.72)
box('TunicFront', 'tunic', (0.08, 0.46, 0.02), (0, 1.19, 0.158))
frustum('Belt', 'belt', 0.222, 0.222, 0.07, (0, 0.93, 0), zs=0.74)
box('Buckle', 'gold', (0.07, 0.07, 0.03), (0, 0.965, 0.17))
frustum('FurCollar', 'fur', 0.25, 0.14, 0.09, (0, 1.38, 0), seg=12, zs=0.75)
frustum('Neck', 'skin', 0.058, 0.055, 0.12, (0, 1.42, 0))
ellipsoid('Head', 'skin', (0.118, 0.14, 0.125), (0, 1.64, 0), seg=14, rings=10)
box('Nose', 'skin', (0.024, 0.05, 0.03), (0, 1.62, 0.128), r=(-15, 0, 0))
ellipsoid('Hair', 'hair', (0.128, 0.125, 0.135), (0, 1.66, -0.008), seg=14, rings=6, lat=(5, 90))
ellipsoid('HairBack', 'hair', (0.126, 0.12, 0.12), (0, 1.65, -0.03), seg=14, rings=6, lat=(-60, 10))
ellipsoid('Beard', 'hair', (0.112, 0.085, 0.092), (0, 1.58, 0.038), seg=12, rings=6, lat=(-90, 0))
box('Mustache', 'hair', (0.08, 0.018, 0.02), (0, 1.585, 0.125))
box('Mouth', 'mouth', (0.04, 0.008, 0.01), (0, 1.567, 0.13))
box('Scar', 'scar', (0.006, 0.07, 0.006), (0.065, 1.66, 0.118), r=(0, 0, -12))
# hand axe hanging on the belt
frustum('AxeHandle', 'wood', 0.016, 0.016, 0.42, (0.215, 0.62, 0.13), seg=6, r=(0, 0, -8))
box('AxeHead', 'steel', (0.13, 0.09, 0.02), (0.275, 0.66, 0.13))

# ---------------- write files ----------------
mats = {'skin':(0.95,0.79,0.65),'hair':(0.54,0.23,0.12),'tunic':(0.30,0.42,0.23),'vest':(0.42,0.29,0.18),
        'pants':(0.54,0.48,0.38),'wrap':(0.85,0.80,0.71),'boot':(0.29,0.20,0.14),'belt':(0.23,0.16,0.12),
        'gold':(0.79,0.64,0.29),'fur':(0.81,0.76,0.66),'eye':(0.97,0.97,0.97),'iris':(0.72,0.53,0.18),
        'mouth':(0.45,0.20,0.15),'scar':(0.71,0.34,0.29),'wood':(0.35,0.24,0.13),'steel':(0.62,0.65,0.68)}
with open(OUT/'eirik.mtl', 'w') as m:
    for k, (r, g, b) in mats.items():
        m.write(f'newmtl {k}\nKa 0 0 0\nKd {r:.3f} {g:.3f} {b:.3f}\nKs 0.05 0.05 0.05\nNs 10\nd 1\nillum 2\n\n')
with open(OUT/'eirik.obj', 'w') as o:
    o.write('# Eirik Stonehand - Warriors of the North (low-poly)\n# Y-up, metres, height ~1.80m, faces +Z\nmtllib eirik.mtl\n')
    for x, y, z in V: o.write(f'v {x:.4f} {y:.4f} {z:.4f}\n')
    for name, mtl, faces in objs:
        o.write(f'o {name}\ng {name}\nusemtl {mtl}\n')
        for f in faces: o.write('f ' + ' '.join(map(str, f)) + '\n')
print(len(V), 'verts', sum(len(f) for _, _, f in objs), 'faces', len(objs), 'parts')
