"""Animation layer: keyable ink characters (Actor) and a camera rig (Cam)."""
import bpy, math, json, os, random
from mathutils import Vector, Euler
import lib, chars
from lib import mat, sphere, cyl, lathe, torus, box, coll, front_uv, lin

ORDER = json.load(open(os.path.join(lib.TEX, 'faceseq', 'order.json')))
NOBLINK = {'blink', 'sleepy', 'happy', 'grin', 'laugh', 'shock', 'gasp', 'scared', 'none'}
HD = chars.HD

def nurbs(name, n, r, m):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = 4; cu.use_fill_caps = True
    cu.resolution_u = 10
    sp = cu.splines.new('NURBS'); sp.points.add(n - 1); sp.order_u = 3; sp.use_endpoint_u = True
    o = bpy.data.objects.new(name, cu); coll('Characters').objects.link(o); cu.materials.append(m)
    return o

def face_seq_mat(tag, mustache=False):
    path = os.path.join(lib.TEX, 'faceseq', 'mustache' if mustache else 'plain', 'f_0001.png')
    m = bpy.data.materials.new('faceseq_' + tag); m.use_nodes = True
    N, L = m.node_tree.nodes, m.node_tree.links; b = N['Principled BSDF']
    t = N.new('ShaderNodeTexImage'); t.name = 'FACE'
    im = bpy.data.images.load(path); im.source = 'SEQUENCE'; t.image = im; t.extension = 'CLIP'
    iu = t.image_user; iu.frame_duration = 1; iu.frame_start = 1; iu.frame_offset = 0; iu.use_auto_refresh = True; iu.use_cyclic = False
    mx = N.new('ShaderNodeMixRGB'); mx.inputs['Color1'].default_value = (*lin('#f3efe8'), 1)
    L.new(t.outputs['Alpha'], mx.inputs['Fac']); L.new(t.outputs['Color'], mx.inputs['Color2']); L.new(mx.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = .6; b.inputs['Subsurface Weight'].default_value = .04; b.inputs['Specular IOR Level'].default_value = .3
    return m, t

def _p(o, parent):
    o.parent = parent
    for c in list(o.users_collection): c.objects.unlink(o)
    coll('Characters').objects.link(o); return o

class Actor:
    def __init__(self, name='worker', spec_over=None, scale=None, body_col=None, tag=None):
        meta = chars.CAST[name]; spec = dict(meta['spec']); spec.update(spec_over or {})
        self.spec = spec; self.s = scale or spec.get('scale', 1.0); tag = tag or name + str(random.randrange(99999))
        self.root = bpy.data.objects.new('actor_' + tag, None); coll('Characters').objects.link(self.root)
        self.bl = spec.get('bodyLen', 1.15); bw = .7 * HD * spec.get('wide', 1); self.rw = rw = bw / 2
        self.leg = .62 * HD if not spec.get('robe') else .18 * HD
        z0, z1 = self.leg, self.leg + self.bl * HD; self.z0, self.z1 = z0, z1; flare = spec.get('flare', 1.0)
        prof = [(0, z0 - .02)]
        for i in range(1, 6):
            a = i / 6 * math.pi / 2; prof.append((rw * flare * math.sin(a), z0 + rw * .35 * (1 - math.cos(a))))
        for i in range(1, 8):
            t = i / 8; prof.append((rw * (flare + (1 - flare) * t), z0 + rw * .35 + (z1 - z0 - rw * .7) * t))
        for i in range(0, 6):
            a = i / 6 * math.pi / 2; prof.append((rw * math.cos(a), z1 - rw * .35 + rw * .35 * math.sin(a)))
        prof.append((0, z1))
        bm = chars.solid(body_col, .6) if body_col else chars.body_mat(name)
        # torso pivot at hips so the body can bend/lean
        self.torso = bpy.data.objects.new(tag + '_torso', None); coll('Characters').objects.link(self.torso); self.torso.parent = self.root
        self.torso.location = (0, 0, z0)
        body = lathe(tag + '_body', [(r, z - z0) for r, z in prof], seg=48, m=bm, sy=.82)
        if not body_col: front_uv(body, -rw * flare, rw * flare, 0, z1 - z0, only_front=False)
        _p(body, self.torso)
        hr = HD / 2; self.hr = hr
        self.head = bpy.data.objects.new(tag + '_head', None); coll('Characters').objects.link(self.head); self.head.parent = self.torso
        self.head.location = (0, 0, z1 - z0)
        self.fmat, self.fnode = face_seq_mat(tag, spec.get('mustache', False))
        if body_col: self.fmat = chars.solid(body_col, .6)
        hs = sphere(tag + '_skull', hr, (0, 0, hr * .82), self.fmat, seg=64, rings=32)
        me = hs.data; uv = me.uv_layers.active.data
        for p in me.polygons:
            for li in p.loop_indices:
                v = me.vertices[me.loops[li].vertex_index].co
                uv[li].uv = (.5 + .47 * v.x / hr, .5 + .47 * v.z / hr) if v.y < 0 else (0.002, 0.002)
        _p(hs, self.head)
        if not body_col:
            chars.hat(spec, self.head, hr)
            if spec.get('scarf'):
                sc = torus(tag + '_scarf', rw * .92, .045, (0, 0, z1 - z0 - .02), chars.solid(spec['scarf'], .9), seg=40, mseg=12); sc.scale = (1, .85, 1); _p(sc, self.torso)
        ink = chars.inkm(); skin = chars.skin() if not body_col else chars.solid(body_col, .6)
        shoe = chars.solid(spec.get('shoes', '#1f1a1c'), .45, coat=.3) if not body_col else chars.solid(body_col, .6)
        self.legs, self.shoes, self.arms, self.hands = {}, {}, {}, {}
        for sd in ('L', 'R'):
            if self.leg > .12: self.legs[sd] = _p(nurbs(tag + '_leg' + sd, 3, .022, ink), self.root)
            self.shoes[sd] = _p(sphere(tag + '_shoe' + sd, .07, (0, 0, 0), shoe, seg=24, rings=12, scale=(1, 1.65, .62)), self.root)
            self.arms[sd] = _p(nurbs(tag + '_arm' + sd, 3, .02, ink), self.root)
            gl = spec.get('gloves')
            self.hands[sd] = _p(sphere(tag + '_hand' + sd, .055, (0, 0, 0), chars.solid(gl, .8) if gl else skin, seg=24, rings=12), self.root)
        self.root.scale = (self.s,) * 3
        self.st = dict(loc=(0, 0, 0), facing=0.0, lean=0.0, side=0.0, bend=0.0, head=(0, 0, 0), face='deadpan',
                       armL=('a', .25, .15), armR=('a', .25, .15), legs=('stand',), bob=0.0)
        self.faces = []
        self.props = []

    # ---------------------------------------------------------------- pose maths (local space, unscaled)
    def _arm(self, sd, spec, bendz):
        side = -1 if sd == 'L' else 1
        sh = Vector((side * self.rw * .9, 0, self.z1 - .14 * HD))
        L1, L2 = .42 * HD, .40 * HD
        # shoulder moves with torso lean
        if spec[0] == 'a':
            a1, a2 = spec[1], spec[2]; fwd = spec[3] if len(spec) > 3 else (-.25 if a1 > 1.2 else -.08)
            el = sh + Vector((side * math.sin(a1) * L1, fwd * L1, -math.cos(a1) * L1))
            a3 = a1 + a2; hd = el + Vector((side * math.sin(a3) * L2, fwd * 1.4 * L2, -math.cos(a3) * L2))
        else:   # ('t', x, y, z): hand target in local space (x mirrored for the left arm)
            tgt = Vector((side * spec[1], spec[2], spec[3]))
            d = tgt - sh; dist = min(d.length, (L1 + L2) * .98); dirv = d.normalized()
            a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist); h = math.sqrt(max(0, L1 * L1 - a * a))
            pole = Vector((side * .6, .5, -.6)); pole = (pole - dirv * pole.dot(dirv)).normalized()
            el = sh + dirv * a + pole * h; hd = sh + dirv * dist
        return sh, el, hd

    def _legs(self, spec):
        out = {}
        rw = self.rw
        for sd, ph in (('L', 0.0), ('R', math.pi)):
            sx = -1 if sd == 'L' else 1
            hip = Vector((sx * rw * .42, 0, self.z0 + .05))
            if spec[0] == 'walk':
                phase, stride, lift = spec[1], spec[2], spec[3] if len(spec) > 3 else .12
                sw = math.sin(phase + ph)
                foot = Vector((sx * rw * .5, -sw * stride, .055 + max(0, math.cos(phase + ph)) * lift))
            elif spec[0] == 'sit':
                foot = Vector((sx * rw * .55, -self.leg * .95, .055 - self.leg * .55))
            elif spec[0] == 'kick':
                foot = Vector((sx * rw * .5, -.1 * math.sin(spec[1] + ph), .12 + .08 * math.sin(spec[1] * 1.3 + ph)))
            else:
                foot = Vector((sx * rw * .52, 0, .055))
            if spec[0] == 'sit': knee = Vector((sx * rw * .5, -self.leg * .95, self.z0 + .02))
            else: knee = (hip + foot) / 2 + Vector((0, -.05 - abs(foot.y) * .2, 0))
            out[sd] = (hip, knee, foot)
        return out

    def key(self, f, **kw):
        st = self.st; st.update({k: v for k, v in kw.items() if v is not None})
        loc = Vector(st['loc'])
        self.root.location = loc + Vector((0, 0, st['bob']))
        self.root.rotation_euler = (0, 0, math.radians(st['facing']))
        self.root.keyframe_insert('location', frame=f); self.root.keyframe_insert('rotation_euler', frame=f)
        self.torso.rotation_euler = (math.radians(st['lean']), math.radians(st['side']), 0)
        self.torso.keyframe_insert('rotation_euler', frame=f)
        h = st['head']; self.head.rotation_euler = (math.radians(h[1]), math.radians(h[2]), math.radians(h[0]))
        self.head.keyframe_insert('rotation_euler', frame=f)
        # limbs: torso lean rotates shoulders around the hip pivot
        R = self.torso.rotation_euler.to_matrix(); piv = Vector((0, 0, self.z0))
        tw = lambda v: piv + R @ (v - piv)
        for sd in ('L', 'R'):
            sh, el, hd = self._arm(sd, st['arm' + sd], 0)
            sh, el, hd = tw(sh), tw(el), tw(hd)
            ctrl = el * 2 - (sh + hd) / 2
            for i, p in enumerate((sh, ctrl, hd)):
                pt = self.arms[sd].data.splines[0].points[i]; pt.co = (p.x, p.y, p.z, 1); pt.keyframe_insert('co', frame=f)
            self.hands[sd].location = hd; self.hands[sd].keyframe_insert('location', frame=f)
        lg = self._legs(st['legs'])
        for sd, (hip, knee, foot) in lg.items():
            if sd in self.legs:
                ctrl = knee * 2 - (hip + foot) / 2
                for i, p in enumerate((hip, ctrl, foot + Vector((0, 0, .02)))):
                    pt = self.legs[sd].data.splines[0].points[i]; pt.co = (p.x, p.y, p.z, 1); pt.keyframe_insert('co', frame=f)
            self.shoes[sd].location = foot + Vector((0, -.045, -.02)); self.shoes[sd].keyframe_insert('location', frame=f)
        if 'face' in kw and kw['face']: self.faces.append((f, kw['face']))

    def walk(self, f0, f1, p0, p1, stride=.22, cadence=1.0, face=None, run=False, **kw):
        """Walk from p0 to p1 over frames f0..f1 with a proper step cycle; facing follows the path."""
        p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
        facing = math.degrees(math.atan2(d.x, -d.y)) if d.length > 1e-3 else self.st['facing']
        steps_per_m = 1 / (stride * 2) if not run else 1 / (stride * 2.6)
        total = d.length * steps_per_m * math.tau
        for f in range(f0, f1 + 1):
            t = (f - f0) / max(1, f1 - f0)
            ph = total * t
            bob = abs(math.sin(ph)) * (.05 if run else .025)
            self.key(f, loc=tuple(p0 + d * t), facing=facing, bob=bob, legs=('walk', ph, stride * (1.5 if run else 1), .2 if run else .1),
                     lean=(8 if run else 2), face=face if f == f0 else None, **kw)

    def face_at(self, f, name):
        self.faces.append((f, name))

    def finish(self, f_end, blink=True, seed=1):
        """Bake the face timeline (with automatic blinks) into constant keys on the face sequence."""
        if not self.faces: self.faces = [(1, self.st['face'])]
        tl = sorted(self.faces); iu = self.fnode.image_user
        rnd = random.Random(seed); keys = []
        for i, (f, n) in enumerate(tl):
            nxt = tl[i + 1][0] if i + 1 < len(tl) else f_end + 1
            keys.append((f, n))
            if blink and n not in NOBLINK:
                b = f + rnd.randint(14, 40)
                while b + 3 < nxt:
                    keys.append((b, 'blink')); keys.append((b + 3, n)); b += rnd.randint(50, 90)
        for f, n in sorted(keys):
            iu.frame_offset = ORDER.index(n) if n in ORDER else 0
            iu.keyframe_insert('frame_offset', frame=f)
        constant(self.fmat.node_tree)

def constant(idblock):
    ad = idblock.animation_data
    if ad and ad.action:
        for fc in ad.action.fcurves:
            for k in fc.keyframe_points: k.interpolation = 'CONSTANT'

def linear(obj):
    ad = obj.animation_data
    if ad and ad.action:
        for fc in ad.action.fcurves:
            for k in fc.keyframe_points: k.interpolation = 'LINEAR'

# -------------------------------------------------------------------- camera
class Cam:
    def __init__(self, lens=30, fstop=None):
        cd = bpy.data.cameras.new('Cam'); cd.lens = lens; cd.sensor_width = 36; cd.clip_end = 4000; cd.clip_start = .05
        self.cam = bpy.data.objects.new('Cam', cd); bpy.context.scene.collection.objects.link(self.cam); bpy.context.scene.camera = self.cam
        self.tgt = bpy.data.objects.new('CamTarget', None); bpy.context.scene.collection.objects.link(self.tgt)
        c = self.cam.constraints.new('TRACK_TO'); c.target = self.tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
        if fstop:
            cd.dof.use_dof = True; cd.dof.aperture_fstop = fstop; cd.dof.focus_object = self.tgt
        self.shake = 0.0

    def key(self, f, pos=None, look=None, lens=None, roll=None):
        if pos is not None: self.cam.location = pos; self.cam.keyframe_insert('location', frame=f)
        if look is not None: self.tgt.location = look; self.tgt.keyframe_insert('location', frame=f)
        if lens is not None: self.cam.data.lens = lens; self.cam.data.keyframe_insert('lens', frame=f)
        if roll is not None:
            self.cam.rotation_euler = (0, 0, 0)

    def handheld(self, f0, f1, amp=.012, seed=3):
        """Small breathing camera wobble, added on a child offset via the target."""
        rnd = random.Random(seed); ph = [rnd.uniform(0, 6) for _ in range(6)]
        base = self.tgt.location.copy()
        fc = None
        for f in range(f0, f1 + 1, 2):
            t = f / 24
            off = Vector((math.sin(t * 1.3 + ph[0]) + .5 * math.sin(t * 3.1 + ph[1]), 0,
                          math.sin(t * 1.7 + ph[2]) + .5 * math.sin(t * 2.9 + ph[3]))) * amp
            self.cam.delta_location = off; self.cam.keyframe_insert('delta_location', frame=f)

def text(body, loc, rot=(math.pi / 2, 0, 0), size=1.0, col='#c8281e', emit=0.0, extrude=.01, align='CENTER', font=None):
    cu = bpy.data.curves.new('txt', 'FONT'); cu.body = body; cu.size = size; cu.extrude = extrude; cu.align_x = align; cu.align_y = 'CENTER'
    if font and os.path.exists(font): cu.font = bpy.data.fonts.load(font)
    o = bpy.data.objects.new('txt', cu); bpy.context.scene.collection.objects.link(o); o.location = loc; o.rotation_euler = rot
    m = mat('txt' + col, col, rough=.8, emit=col if emit else None, emit_strength=emit); cu.materials.append(m)
    return o

def key_emit(m, f, strength, node='Principled BSDF'):
    b = m.node_tree.nodes[node]; b.inputs['Emission Strength'].default_value = strength
    b.inputs['Emission Strength'].keyframe_insert('default_value', frame=f)

def key_light(o, f, energy):
    o.data.energy = energy; o.data.keyframe_insert('energy', frame=f)
