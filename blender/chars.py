"""3D versions of the ink characters: sphere head with a drawn face, tube body with a drawn costume,
ink-line limbs, round white hands. Freestyle draws the outline (collection 'Characters')."""
import bpy, math, json, os, random
from mathutils import Vector, Euler
import lib
from lib import mat, mat_image, sphere, cyl, lathe, smooth_tube, torus, box, coll, front_uv, lin

CAST = json.load(open(os.path.join(lib.TEX, 'cast', 'cast.json')))
FACES = ['deadpan', 'smug', 'unimpressed', 'shock', 'happy', 'grin', 'sad', 'angry', 'worry', 'talk', 'sideeye', 'calm']
HD = 0.56            # head diameter in metres
_M = {}

def M(key, fn):
    if key not in _M: _M[key] = fn()
    return _M[key]

def skin(): return M('skin', lambda: mat('skin', '#f3efe8', rough=.62, sss=.04, spec=.3))
def inkm(): return M('ink', lambda: mat('inkline', '#141016', rough=.7, spec=.1))
def solid(col, rough=.75, coat=0.0, metal=0.0):
    return M(('c', col, rough, coat, metal), lambda: mat('c' + col, col, rough=rough, coat=coat, metal=metal))

def face_mat(face, mustache=False):
    name = face + ('_mustache' if mustache else '')
    def mk():
        path = os.path.join(lib.TEX, 'faces', name + '.png')
        m = bpy.data.materials.new('face_' + name); m.use_nodes = True
        N, L = m.node_tree.nodes, m.node_tree.links; b = N['Principled BSDF']
        t = N.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(path, check_existing=True); t.extension = 'CLIP'
        mx = N.new('ShaderNodeMixRGB'); mx.inputs['Color1'].default_value = (*lin('#f3efe8'), 1)
        L.new(t.outputs['Alpha'], mx.inputs['Fac']); L.new(t.outputs['Color'], mx.inputs['Color2'])
        L.new(mx.outputs['Color'], b.inputs['Base Color'])
        b.inputs['Roughness'].default_value = .62; b.inputs['Subsurface Weight'].default_value = .04
        b.inputs['Specular IOR Level'].default_value = .3
        return m
    return M(('face', name), mk)

def body_mat(name):
    return M(('body', name), lambda: mat_image('body_' + name, os.path.join(lib.TEX, 'cast', f'body_{name}.png'), rough=.85))

def _parent(o, root):
    o.parent = root
    for c in o.users_collection: c.objects.unlink(o)
    coll('Characters').objects.link(o)
    return o

def character(name='worker', loc=(0, 0, 0), face=None, facing=0.0, look_at=None, scale=None, arms=None,
              walk=0.0, lean=0.0, head_turn=0.0, head_tilt=0.0, props=None, spec_over=None):
    """facing: degrees around Z, 0 = faces -Y (towards a camera placed at -Y). look_at: point to face."""
    meta = CAST[name]; spec = dict(meta['spec']); spec.update(spec_over or {}); pose = meta['pose']
    face = face or pose.get('face', 'deadpan')
    if face not in FACES: face = 'deadpan'
    s = scale or spec.get('scale', 1.0)
    root = bpy.data.objects.new('char_' + name, None); coll('Characters').objects.link(root)
    bl = spec.get('bodyLen', 1.15); bw = .7 * HD * spec.get('wide', 1); rw = bw / 2
    leg = .62 * HD if not spec.get('robe') else .18 * HD
    z0, z1 = leg, leg + bl * HD
    flare = spec.get('flare', 1.0)
    # body: rounded tube, slightly flattened front-to-back
    prof = [(0, z0 - .02)]
    for i in range(1, 6):
        a = i / 6 * math.pi / 2; prof.append((rw * flare * math.sin(a), z0 + rw * .35 * (1 - math.cos(a))))
    n = 8
    for i in range(1, n):
        t = i / n; prof.append((rw * (flare + (1 - flare) * t), z0 + rw * .35 + (z1 - z0 - rw * .7) * t))
    for i in range(0, 7):
        a = i / 6 * math.pi / 2; prof.append((rw * math.cos(a), z1 - rw * .35 + rw * .35 * math.sin(a)))
    prof.append((0, z1))
    body = lathe(name + '_body', prof, seg=48, m=body_mat(name), sy=.82)
    front_uv(body, -rw * flare, rw * flare, z0, z1, only_front=False)
    _parent(body, root)
    # head
    hr = HD / 2; hz = z1 + hr * .82
    head = bpy.data.objects.new(name + '_headpivot', None); coll('Characters').objects.link(head); head.parent = root
    head.location = (0, 0, z1); head.rotation_euler = (math.radians(head_tilt), 0, math.radians(head_turn))
    hs = sphere(name + '_head', hr, (0, 0, hr * .82), face_mat(face, spec.get('mustache', False)), seg=64, rings=32)
    me = hs.data; uv = me.uv_layers.active.data
    for p in me.polygons:
        for li in p.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            uv[li].uv = (.5 + .47 * v.x / hr, .5 + .47 * (v.z) / hr) if v.y < 0 else (0.002, 0.002)
    _parent(hs, root); hs.parent = head
    hat(spec, head, hr)
    if spec.get('scarf'):
        sc = torus(name + '_scarf', rw * .92, .045, (0, 0, z1 - .02), solid(spec['scarf'], .9), seg=40, mseg=12)
        sc.scale = (1, .85, 1); _parent(sc, root)
        tail = box(name + '_scarft', (.09, .03, .22), (rw * .45, -rw * .8, z1 - .14), solid(spec['scarf'], .9), rot=(0, .15, 0), bevel=.012)
        _parent(tail, root)
    # legs and shoes
    shoe = solid(spec.get('shoes', '#1f1a1c'), .45, coat=.3)
    for sx, ph in ((-1, 0), (1, math.pi)):
        sw = math.sin(walk * math.pi + ph) * .22 * min(1, abs(walk) * 3) if walk else 0
        hip = Vector((sx * rw * .42, 0, z0 + .05))
        foot = Vector((sx * rw * .52, -sw * .6, .055 + max(0, -sw) * .15))
        knee = (hip + foot) / 2 + Vector((0, -.04 - abs(sw) * .1, 0))
        if leg > .12:
            _parent(smooth_tube(name + '_leg', [hip, knee, foot + Vector((0, 0, .02))], .022, inkm()), root)
        sh = sphere(name + '_shoe', .07, foot + Vector((0, -.045, -.02)), shoe, seg=24, rings=12, scale=(1, 1.65, .62))
        _parent(sh, root)
    # arms
    a = arms or {}
    hands = {}
    for side, key in ((-1, 'armL'), (1, 'armR')):
        a1, a2 = a.get(key, pose.get(key, (.25, .15)))
        sh = Vector((side * rw * .9, 0, z1 - .14 * HD))
        L1 = .42 * HD; L2 = .40 * HD
        fwd = -.25 if a1 > 1.2 else -.08
        el = sh + Vector((side * math.sin(a1) * L1, fwd * L1, -math.cos(a1) * L1))
        a3 = a1 + a2
        hd = el + Vector((side * math.sin(a3) * L2, fwd * 1.4 * L2, -math.cos(a3) * L2))
        _parent(smooth_tube(name + '_arm', [sh, el, hd], .02, inkm()), root)
        gl = spec.get('gloves')
        hs2 = sphere(name + '_hand', .055, hd, solid(gl, .8) if gl else skin(), seg=24, rings=12)
        _parent(hs2, root); hands['L' if side < 0 else 'R'] = hd
    for pr in (props if props is not None else pose.get('props', [])):
        prop(pr['type'], hands[pr.get('hand', 'R')], root, name)
    root.location = loc; root.scale = (s, s, s)
    if look_at is not None:
        d = Vector(look_at) - Vector(loc); facing = math.degrees(math.atan2(d.x, -d.y))
    root.rotation_euler = (math.radians(lean), 0, math.radians(facing))
    return root

def hat(spec, head, hr):
    kind = spec.get('hat'); c1 = spec.get('hatCol', '#2c3f66'); c2 = spec.get('hatCol2', '#e9e4d8'); top = hr * .82
    def add(o): _parent(o, head.parent); o.parent = head; return o
    hairc = spec.get('hairCol')
    if spec.get('hair') == 'side' and hairc:
        for sx in (-1, 1):
            for k in range(3):
                add(sphere('tuft', .06, (sx * hr * .93, .05 - k * .02, top + .02 + k * .05), solid(hairc, .9), seg=16, rings=8, scale=(.7, 1, 1)))
    if spec.get('hair') == 'sideburn' and hairc:
        for sx in (-1, 1):
            add(sphere('burn', .05, (sx * hr * .9, -.02, top + .02), solid(hairc, .9), seg=16, rings=8, scale=(.5, .8, 1.5)))
    if kind == 'flatcap':
        add(sphere('cap', hr * 1.03, (0, .01, top + hr * .38), solid(c1, .9), seg=48, rings=24, scale=(1, 1.04, .42)))
        add(sphere('brim', hr * .62, (0, -hr * .62, top + hr * .5), solid(c1, .9), seg=32, rings=12, scale=(1.05, .7, .12), rot=(-.25, 0, 0)))
        add(sphere('btn', .025, (0, 0, top + hr * .79), solid(c2, .8), seg=12, rings=6))
    elif kind == 'top':
        add(cyl('brim', hr * .95, .03, (0, 0, top + hr * .83), solid(c1, .5, coat=.2), seg=48))
        add(cyl('crown', hr * .62, hr * 1.05, (0, 0, top + hr * 1.35), solid(c1, .45, coat=.3), seg=48, r2=hr * .66))
        add(cyl('band', hr * .635, hr * .16, (0, 0, top + hr * .95), solid(c2, .7), seg=48))
    elif kind == 'beanie':
        b = add(sphere('beanie', hr * 1.04, (0, 0, top + hr * .25), None, seg=48, rings=24, scale=(1, 1, .72)))
        b.data.materials.append(M('beanie', lambda: mat_image('beanie', os.path.join(lib.TEX, 'cast', 'hat_beanie.png'), rough=.95, extension='REPEAT')))
        for v in b.data.vertices:
            if v.co.z < -hr * .05: v.co.z = -hr * .05
        add(torus('cuff', hr * .99, .045, (0, 0, top + hr * .2), solid(c1, .95), seg=48, mseg=10))
        add(sphere('pom', .07, (0, 0, top + hr * .98), solid(c2, 1.0), seg=16, rings=8))
    elif kind == 'helmet':
        add(sphere('helm', hr * 1.06, (0, 0, top + hr * .25), solid(c1, .3, coat=.6), seg=48, rings=24, scale=(1, 1.05, .82)))
        add(sphere('hbrim', hr * 1.25, (0, .12, top + hr * .2), solid(c1, .3, coat=.6), seg=48, rings=12, scale=(1, 1.3, .08)))
        add(box('badge', (.16, .02, .14), (0, -hr * 1.02, top + hr * .55), solid('#e3c160', .3, metal=1), bevel=.02))
    elif kind == 'wig':
        w = solid('#ece8de', .95)
        for i in range(14):
            ang = math.radians(-100 + i * 200 / 13)
            for k in range(3):
                add(sphere('curl', .085, (math.sin(ang) * hr * .98, math.cos(ang) * hr * .9 * (1 if abs(ang) > .9 else 1.05) + .05,
                                          top + hr * .55 - k * .13), w, seg=16, rings=8))
        add(sphere('wigtop', hr * 1.02, (0, .03, top + hr * .35), w, seg=40, rings=20, scale=(1, 1, .6)))
    elif kind == 'sailor':
        add(cyl('sailor', hr * .78, hr * .32, (0, .05, top + hr * .86), solid('#f4f2ee', .8), seg=48, r2=hr * .82))
        add(cyl('sband', hr * .79, hr * .07, (0, .05, top + hr * .74), solid('#24304a', .7), seg=48))
    elif kind == 'bun':
        add(sphere('hair', hr * 1.02, (0, .02, top + hr * .12), solid(hairc or '#2e2118', .85), seg=48, rings=24, scale=(1, 1, .82)))
        add(sphere('bunb', hr * .38, (0, hr * .45, top + hr * .95), solid(hairc or '#2e2118', .85), seg=24, rings=12))

def hairfix(o, hr):
    pass

def prop(kind, at, root, name):
    at = Vector(at)
    def add(o): return _parent(o, root)
    if kind == 'cup':
        add(cyl('cup', .045, .09, at + Vector((0, -.05, .04)), solid('#d8d2c6', .4), seg=24))
    elif kind == 'gavel':
        add(cyl('ghandle', .015, .32, at + Vector((0, -.04, .14)), solid('#5a3418', .5), seg=12))
        add(cyl('ghead', .05, .17, at + Vector((0, -.04, .3)), solid('#5a3418', .45), seg=20, rot=(0, math.pi / 2, 0)))
    elif kind == 'bottle':
        add(cyl('bottle', .05, .2, at + Vector((0, -.04, .08)), mat('glass', '#2f5a3a', rough=.05, trans=.85), seg=24))
    elif kind == 'cane':
        add(smooth_tube('cane', [at + Vector((0, -.02, .05)), at + Vector((.05, -.04, -.3)), at + Vector((.08, -.05, -.8 + .0))], .016, solid('#3a2416', .5)))
    elif kind == 'brush':
        add(cyl('brush', .015, .4, at + Vector((0, -.04, .15)), solid('#7a5634', .5), seg=12))
        add(box('bristle', (.12, .05, .08), at + Vector((0, -.04, .37)), solid('#3a1a08', .3), bevel=.01))

def crowd(n, center, radius, seed=3, faces=None, avoid=None, look_at=None, scale_range=(.92, 1.06), names=None):
    rnd = random.Random(seed); out = []
    names = names or [k for k in CAST if k != 'judge']
    for i in range(n):
        for _ in range(30):
            ang = rnd.random() * math.tau; r = radius * math.sqrt(rnd.random())
            p = Vector((center[0] + math.cos(ang) * r, center[1] + math.sin(ang) * r, center[2] if len(center) > 2 else 0))
            if all((p - q).length > .75 for q in out) and not (avoid and avoid(p)): break
        out.append(p)
        nm = rnd.choice(names)
        tgt = look_at if look_at and rnd.random() < .5 else (p.x + rnd.uniform(-3, 3), p.y + rnd.uniform(-3, 3), 0)
        character(nm, tuple(p), face=rnd.choice(faces or FACES), look_at=tgt, scale=(.72 if nm == 'kid' else rnd.uniform(*scale_range)),
                  arms={'armL': (rnd.uniform(.1, .6), rnd.uniform(0, .5)), 'armR': (rnd.uniform(.1, 2.2), rnd.uniform(0, 1))},
                  walk=rnd.choice([0, 0, .3, .6]), props=[])
    return out
