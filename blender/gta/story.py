"""INDIAN MIDDLE CLASS EDITION - an open-world-game cutscene parody (DAGAR CLIPS ink style).
A son tries to escape the house; Papa, a slipper and Mummy with a gas cylinder have other plans.
    python3 story.py -- still <shot> out.png [t]
    python3 story.py -- frames <shot> <f0> <f1> <outdir>"""
import os, sys, json, math, random, importlib.util
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
for d in (HERE, os.path.join(ROOT, 'zombie'), os.path.join(ROOT, 'west')): sys.path.insert(0, d)
import film as F
_spec = importlib.util.spec_from_file_location('zstory', os.path.join(ROOT, 'zombie', 'story.py')); Z = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(Z)
F.CFG = json.load(open(os.path.join(HERE, 'shots.json')))
from film import bpy, Vector, Matrix, T, PR, TO, ease, K, head_of, facing, cu
import inkchar as H
import city as C
import house as HS

stand, walk, override, side_of, hold, cam_keys, toon = Z.stand, Z.walk, Z.override, Z.side_of, Z.hold, Z.cam_keys, Z.toon
H.EXPR['sleep'] = dict(H.EXPR['idle'], lid=1.0)

# ------------------------------------------------------------------ the family (original characters)
P = TO.preset
SON = P('Son', '#e8b42a', '#1e2a4a', hat=None, haircol='#120c08', height=.97, boots='#2a5aa8', belt='#1e2a4a', collar=False)
PAPA = P('Papa', '#f2efe6', '#2e6a4a', dress=True, dresscol='#2e6a4a', hat=None, haircol='#2a2622', stache=True, beardcol='#141010', height=1.0,
         boots='#5a3a20', collar=False)
MUMMY = P('Mummy', '#e2701a', '#e2701a', dress=True, dresscol='#e2701a', shawl='#d8a838', hat=None, haircol='#0e0a08', bun=True, height=.93, boots='#c8a040', collar=False)


def dress_up(sh, ch, who):
    """details the costume system can't do: the TALEVENTURE tee print, Papa's checked lungi + specs, Mummy's saree border + bindi"""
    bpy.context.view_layer.update()
    if who == 'SON':
        z = ch.TL * .62; y = ch.fy(z) if hasattr(ch, 'fy') else -ch.rw * .82
        s = C.sign('SON_print', 'TALEVENTURE', ch.rw * 1.35, .07, (0, 0, 0), facing=(0, -1), bg='#e8b42a', fg='#1a1a2a', size=(900, 120), font_scale=.75)
        s.parent = ch.torso; s.location = (0, y - .004, z); s.rotation_euler = (0, 0, 0)
    if who == 'PAPA':
        o = bpy.data.objects.get(ch.cid + '_dress')
        if o: o.data.materials.clear(); o.data.materials.append(HS.checker('lungi', '#2e6a4a', '#2a4a8a', 18, lines='#e8e4d8'))
        g = Z.glasses_prop(ch.cid + '_specs'); Z.wear_glasses(sh, ch, g)
    if who == 'MUMMY':
        o = bpy.data.objects.get(ch.cid + '_dress')
        if o:
            m = bpy.data.materials.new('saree'); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links; b = N['Principled BSDF']
            tc = N.new('ShaderNodeTexCoord'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sep.inputs[0])
            rp = N.new('ShaderNodeValToRGB'); L.new(sep.outputs['Z'], rp.inputs[0]); cr = rp.color_ramp; cr.interpolation = 'CONSTANT'
            cr.elements[0].position = 0.0; cr.elements[0].color = (*T.hexc('#d8a838')[:3], 1); cr.elements[1].position = .5; cr.elements[1].color = (*T.hexc('#e2701a')[:3], 1)
            e = cr.elements.new(-0.3); e.color = (*T.hexc('#a8301a')[:3], 1)
            mp = N.new('ShaderNodeMapRange'); L.new(sep.outputs['Z'], mp.inputs[0]); mp.inputs[1].default_value = -.32; mp.inputs[2].default_value = .2
            L.new(mp.outputs[0], rp.inputs[0]); L.new(rp.outputs[0], b.inputs['Base Color']); b.inputs['Roughness'].default_value = .5; b.inputs['Sheen Weight'].default_value = .6
            o.data.materials.clear(); o.data.materials.append(m)
        bi = T.lib.sphere(ch.cid + '_bindi', .016, (0, 0, 0), T.plain('bindi', '#d01018', .3))
        def u(t, bi=bi):
            f, sd = side_of(ch); bi.location = head_of(ch, .1) + f * (ch.hy * ch.s * .98)
        sh.updates.append(u)


def cast(sh, who, preset):
    ch = toon(sh, who, preset); dress_up(sh, ch, who); return ch


def stage(sh, mood='day', elev=35, az=200, night=False):
    F.setup(sh, mood, elev, az, town=False, haze=False); sh.town = False
    out = HS.build(night)
    for k, (x, y) in enumerate(((-.6, 2.2), (3.6, 3.0))):
        l = bpy.data.lights.new(f'room{k}', 'AREA'); l.energy = 220; l.size = 2.2; l.color = (1, .9, .78)
        o = bpy.data.objects.new(f'room{k}', l); T.coll('Town').objects.link(o); o.location = (x, y, HS.H - .1)
    for fan in out['fans']: sh.updates.append(lambda t, fan=fan: setattr(fan, 'rotation_euler', (0, 0, t * 9.0)))
    return out


def prop_newspaper():
    root = bpy.data.objects.new('newspaper', None); T.coll('Town').objects.link(root)
    s = C.sign('paper_front', 'THE DAILY\nPRAGATI\nPRICES UP AGAIN', .42, .55, (0, 0, 0), facing=(0, -1), bg='#ece8dc', fg='#1a1a1a', size=(420, 550), font_scale=.45)
    s.parent = root
    b = T.box('paper_back', (.42, .004, .55), (0, .004, 0), T.plain('newsprint', '#dcd6c8', .9)); b.parent = root
    return root


def prop_slipper():
    root = bpy.data.objects.new('slipper', None); T.coll('Town').objects.link(root)
    s = T.box('slip_sole', (.1, .27, .025), (0, 0, 0), T.plain('slipsole', '#3a3a3e', .7), bevel=.01); s.parent = root
    for k in (-1, 1):
        st = T.box(f'slip_strap{k}', (.012, .12, .02), (k * .025, -.04, .02), T.plain('slipstrap', '#2a5aa8', .5), rot=(0, 0, k * .5)); st.parent = root
    return root


def prop_cylinder():
    root = bpy.data.objects.new('lpg', None); T.coll('Town').objects.link(root); red = T.plain('lpgred', '#c41a16', .3, .1)
    parts = [T.cyl('lpg_body', .16, .52, (0, 0, .3), red, v=24)]
    for z in (.04, .56): o = T.lib.sphere(f'lpg_cap{z}', .16, (0, 0, z), red); o.scale = (1, 1, .35); parts.append(o)
    parts += [T.cyl('lpg_ring', .17, .04, (0, 0, .02), T.plain('lpgring', '#2a2a2a', .5), v=24), T.cyl('lpg_neck', .07, .12, (0, 0, .66), red, v=16),
              T.cyl('lpg_valve', .035, .06, (0, 0, .75), T.plain('brass', '#c8a040', .3, 1.0), v=12)]
    for k in range(3): parts.append(T.box(f'lpg_guard{k}', (.03, .2, .1), (math.cos(k * 2.1) * .07, math.sin(k * 2.1) * .07, .68), red, rot=(0, 0, k * 2.1)))
    for p in parts: p.parent = root
    return root


# ------------------------------------------------------------------ the bed (lying + sitting up)
def in_bed(sh, ch, face, sit=lambda t: 0.0, hands=None):
    bc = HS.BEDC; yaw = -90
    ftrack = face if callable(face) else H.expr_track(face)
    def pose(t):
        u = sit(t); feet = Vector((bc.x - .78, bc.y, HS.BED_TOP + .2))
        d = dict(loc=tuple(feet), yaw=yaw, face=ftrack(t), lean=(.714 * u, 0), head=[0, -10 * (1 - u), 0], crouch=0.0)
        if hands: d.update(hands(t, feet))
        return d
    def post(t): ch.root.rotation_euler = (-math.pi / 2, 0, math.radians(yaw))
    p = Z.Puppet(ch, pose, post) if hasattr(Z, 'Puppet') else None
    if p is None:
        class Pu:
            def __init__(s_, ch, pose, post): s_.ch, s_.pose, s_.post = ch, pose, post; ch.fn = lambda t: s_.pose(t)
            def apply(s_, t): s_.ch.apply(t); s_.post(t)
        p = Pu(ch, pose, post)
    sh.actors.append(p); return p


def sitting(sh, ch, face, look=None, hands=None, rise=None, talk=None):
    """Papa on the sofa: hips on the cushion, feet on the floor; rise(t) -> 0..1 stands him up"""
    s = HS.SOFA; root = Vector((s.x + .15, s.y - .22, 0))
    a = stand(sh, ch, (root.x, root.y), 0, '77_02', 1.0, face=face, look=look, z=0, talk=talk)
    def mod(t, d):
        u = rise(t) if rise else 0.0
        d['crouch'] = .1 * (1 - u); d['loc'] = (root.x, root.y - .25 * u, 0); d['yaw'] = 0
        for sd, sx in (('L', -1), ('R', 1)): d['foot' + sd] = (sx * .12, -.32 * (1 - u), 0)
        d['lean'] = (d['lean'][0] * .4 - .04 * (1 - u), d['lean'][1] * .4)
        if hands: d.update(hands(t))
        return d
    override(a, mod); return a


# ------------------------------------------------------------------ shots
def s_room(sh):
    """'NEW DAY. NEW OPPORTUNITIES.'  Dawn in a tiny bedroom: posters, a glowing PC, the fan turning; the son asleep."""
    stage(sh, 'day', 18, 250)
    son = cast(sh, 'SON', SON); in_bed(sh, son, [(0, 'sleep')])
    sh.camera(cam_keys([(0, (2.45, 1.75, 1.95), (3.9, 3.55, .65), 22), (sh.dur, (2.75, 2.1, 1.75), (3.95, 3.6, .7), 25)], shake=.003), fstop=4)
    sh.keylight(8, (1, .85, .7))


def s_face(sh):
    """MUMMY (off): 'GET UP! YOU HAVE BEEN SLEEPING FOR 12 HOURS!'  Slow push down onto the sleeping face; on the last word
    the eyes snap open."""
    stage(sh, 'day', 18, 250)
    son = cast(sh, 'SON', SON); in_bed(sh, son, [(0, 'sleep'), (3.25, 'shock')])
    def cam(t):
        hp = head_of(son); u = ease(t / sh.dur)
        return (hp + Vector((-.95 + .3 * u, .05, 1.0 - .3 * u)), hp + Vector((-.05, 0, 0)), 30 + 10 * u, 0, hp, .002)
    sh.camera(cam, fstop=2.6); sh.keylight(10, (1, .85, .7))


def s_situp(sh):
    """MISSION: ESCAPE THE HOUSE.  He jolts upright in bed, eyes wide."""
    stage(sh, 'day', 18, 250)
    son = cast(sh, 'SON', SON)
    in_bed(sh, son, [(0, 'shock'), (.9, 'determined')], sit=lambda t: ease(t / .35) * .95)
    sh.camera(cam_keys([(0, (2.6, 2.4, 1.15), (3.6, 3.6, .95), 26), (sh.dur, (2.7, 2.5, 1.15), (3.6, 3.6, 1.0), 28)], shake=.01), fstop=3)
    sh.keylight(10, (1, .85, .7))


def papa_reading(sh, papa, face, paper_up=lambda t: 1.0, look=None, talk=None, rise=None, slipper=None):
    paper = prop_newspaper()
    def hands(t):
        u = paper_up(t); f = Vector((0, -1, 0)); h = head_of(papa, -.05)
        c = h + f * .32 - Vector((0, 0, .18 * (1 - u) + .02))
        return dict(handL=tuple(c + Vector((.17, 0, 0))), handR=tuple(c - Vector((.17, 0, 0))))
    a = sitting(sh, papa, face, look=look, hands=hands, talk=talk, rise=rise)
    def pu(t):
        u = paper_up(t); h = head_of(papa, -.05); paper.location = h + Vector((0, -.34, -.18 * (1 - u) - .02)); paper.rotation_euler = (math.radians(-25 * (1 - u)), 0, 0)
    sh.updates.append(pu)
    return a, paper


def s_approach(sh):
    """SON: 'Dad... can I have 500 rupees?'  Papa behind his newspaper on the sofa; the son wanders in from his room."""
    stage(sh, 'day', 30, 200)
    papa = cast(sh, 'PAPA', PAPA); son = cast(sh, 'SON', SON)
    papa_reading(sh, papa, [(0, 'bored')])
    w = walk(sh, son, (2.2, 2.6, 0), -125, '82_08', 1.0, face=[(0, 'smile'), (1.0, 'grin')], speed=.8)
    def stop(t, d):
        if t > 1.9: d['loc'] = (0.75, 2.05, 0)
        return d
    sh.actors[-1].talk = [(.25, 3.3, 1.0)]
    sh.camera(cam_keys([(0, (-1.7, .7, 1.45), (.3, 3.0, .9), 24), (sh.dur, (-1.5, .9, 1.4), (.2, 2.9, .95), 26)], shake=.004), fstop=4)


def s_papa1(sh):
    """PAPA: 'What happened to the 500 I gave you yesterday?'  Over the son's shoulder: the newspaper slowly lowers."""
    stage(sh, 'day', 30, 200)
    papa = cast(sh, 'PAPA', PAPA); son = cast(sh, 'SON', SON)
    papa_reading(sh, papa, [(0, 'suspicious')], paper_up=lambda t: 1 - ease((t - .1) / .7), talk=[(.2, 4.1, 1.0)])
    stand(sh, son, (.55, 2.25), -150, '77_02', 1.4, face=[(0, 'grin')], z=0)
    s = HS.SOFA
    sh.camera(cam_keys([(0, (1.15, 1.35, 1.35), (s.x + .1, s.y - .2, 1.0), 34), (sh.dur, (1.05, 1.5, 1.32), (s.x + .12, s.y - .2, 1.02), 38)], shake=.003), fstop=2.8)


def s_inflation(sh):
    """SON: 'Inflation.'  Dead-straight close-up; total confidence."""
    stage(sh, 'day', 30, 200)
    son = cast(sh, 'SON', SON)
    stand(sh, son, (.55, 2.25), -150, '77_02', 1.4, face=[(0, 'smug')], z=0, talk=[(.2, 1.9, .8)])
    cu(sh, son, angle=5, elev=2, size=(.62, .58), lens=50, fstop=2.0)


def s_silence(sh):
    """Silence.  Wide, static two-shot: Papa slowly folds the newspaper. The clock ticks."""
    stage(sh, 'day', 30, 200)
    papa = cast(sh, 'PAPA', PAPA); son = cast(sh, 'SON', SON)
    papa_reading(sh, papa, [(0, 'deadpan')], paper_up=lambda t: 0.0)
    stand(sh, son, (.55, 2.25), -150, '77_02', 1.4, face=[(0, 'smug'), (.8, 'nervous')], z=0)
    sh.camera(cam_keys([(0, (2.2, .5, 1.3), (-.2, 3.2, .9), 26), (sh.dur, (2.2, .5, 1.3), (-.2, 3.2, .9), 26)], shake=.0), fstop=5)


def s_zoom(sh):
    """PAPA: 'INFLATION? YOU DON'T EVEN HAVE A JOB!'  Crash zoom into Papa's face as he explodes."""
    stage(sh, 'day', 30, 200)
    papa = cast(sh, 'PAPA', PAPA)
    papa_reading(sh, papa, [(0, 'deadpan'), (.15, 'furious'), (1.4, 'rage')], paper_up=lambda t: 0.0, talk=[(.15, 3.2, 1.3)])
    def cam(t):
        h = head_of(papa); d = K([(0, 2.4), (.28, .95), (sh.dur, .82)], t)
        return (h + Vector((.12, -1, .05)).normalized() * d, h, 40, K([(0, 0), (.28, -6), (sh.dur, -4)], t), h, .004 + .02 * math.exp(-max(0, t - .28) * 6))
    sh.camera(cam, fstop=2.2); sh.keylight(12, (1, .8, .6))


def s_failed(sh):
    """MISSION FAILED.  The son's face drops."""
    stage(sh, 'day', 30, 200)
    son = cast(sh, 'SON', SON)
    stand(sh, son, (.55, 2.25), -150, '77_02', 1.4, face=[(0, 'ohno')], z=0)
    cu(sh, son, angle=-10, elev=8, size=(.7, .66), lens=45, fstop=2.0)


def s_slipper(sh):
    """Papa slowly rises... picks up his slipper... and raises it like a weapon. Low hero angle."""
    stage(sh, 'day', 30, 200)
    papa = cast(sh, 'PAPA', PAPA)
    slip = prop_slipper()
    def hands(t):
        h = head_of(papa, -.1)
        if t < 1.2: return dict(handR=tuple(h + Vector((-.25, -.2, -.55 * ease(t / 1.0)))))
        u = ease((t - 1.2) / .5); return dict(handR=tuple((h + Vector((-.25, -.2, -.55))).lerp(h + Vector((-.22, .0, .38)), u)))
    a = sitting(sh, papa, [(0, 'deadpan'), (1.3, 'rage')], hands=hands, rise=lambda t: ease(t / 1.1))
    hold(sh, slip, papa, 'R', (0, 0, .06), rot=lambda t: (math.radians(70 if t > 1.3 else 0), 0, .3))
    s = HS.SOFA
    sh.camera(cam_keys([(0, (s.x + .4, s.y - 1.5, .45), (s.x + .1, s.y - .2, 1.05), 22), (sh.dur, (s.x + .35, s.y - 1.25, .4), (s.x + .1, s.y - .3, 1.4), 22)], roll=lambda t: K([(0, 0), (sh.dur, 5)], t), shake=.006), fstop=3)
    sh.keylight(12, (1, .8, .6))


def chase(sh, t_son=0.0, t_papa=.6, cam=None):
    papa = cast(sh, 'PAPA', PAPA); son = cast(sh, 'SON', SON); slip = prop_slipper()
    a_s = sh.actor(son, [TO.Act(0, '09_01', .3, 3, loc=(.6, 2.0, 0), yaw=-20 + 0, speed=1.25)], face=[(0, 'terror')])
    a_p = sh.actor(papa, [TO.Act(0, '09_01', .4, 3, loc=(-.2, 3.0, 0), yaw=-10, speed=1.1)], face=[(0, 'rage')])
    def pm(t, d):
        h = head_of(papa, -.1); d['handR'] = tuple(h + Vector((-.15, .05, .42 + .06 * math.sin(t * 14)))); return d
    override(a_p, pm); hold(sh, slip, papa, 'R', (0, 0, .06), rot=(math.radians(80), 0, .3))
    return papa, son


def s_run(sh):
    """WANTED LEVEL *****.  The son bolts for the front door, arms flailing."""
    stage(sh, 'day', 30, 200)
    papa, son = chase(sh)
    sh.camera(cam_keys([(0, (-.9, .45, 1.2), (.4, 2.4, 1.0), 24), (sh.dur, (-.95, .4, 1.15), (-.4, 1.4, .95), 26)], shake=.012), fstop=3.5)


def s_chase(sh):
    """The chase: the son sprints across the room and out of the door, Papa right behind him, slipper raised."""
    stage(sh, 'day', 30, 200)
    papa, son = chase(sh)
    sh.camera(cam_keys([(0, (1.8, .55, 1.6), (-.2, 2.2, .9), 22), (sh.dur, (1.6, .5, 1.5), (-.9, .6, .9), 24)], roll=-4, shake=.015), fstop=4)


def s_escape(sh):
    """He bursts out of the door onto the porch and stops, panting... free at last."""
    stage(sh, 'day', 35, 200)
    son = cast(sh, 'SON', SON)
    a = sh.actor(son, [TO.Act(0, '09_01', .3, 1.2, loc=(-.9, .2, 0), yaw=0, speed=1.2), TO.Act(.9, '77_02', 1.0, 4, loc=(-.9, -.9, .12), yaw=0, lock_root=True)],
                 face=[(0, 'terror'), (1.1, 'relief'), (1.7, 'happy')])
    def pant(t, d):
        if t > .9: d['lean'] = (d['lean'][0] + .1 + .02 * math.sin(t * 10), d['lean'][1])
        return d
    override(a, pant)
    extras_ = Z.extras(sh, [(-6.0, -7.8, 160), (5.6, -7.6, 200)], seed=21, face='watch', walkers=[(-12, -5.6, 90 + 180, .9), (9, -4.4, 90, .8)])
    sh.camera(cam_keys([(0, (-.5, -4.8, 1.3), (-.9, -.4, 1.0), 26), (sh.dur, (-.6, -4.2, 1.25), (-.9, -.6, 1.0), 28)], shake=.006), fstop=4)


def mummy_scene(sh, son_face, mummy_face, son_talk=None, mummy_talk=None, cyl_t=None):
    son = cast(sh, 'SON', SON); mum = cast(sh, 'MUMMY', MUMMY)
    a_s = stand(sh, son, (-.9, -.95), 0, '77_02', 1.0, face=son_face, z=.12, talk=son_talk)
    a_m = stand(sh, mum, (-.85, -2.1), 180, '80_48', 1.2, face=mummy_face, z=0, talk=mummy_talk)
    cyl = prop_cylinder()
    if cyl_t is None:
        cyl.location = (-.45, -2.2, 0)
    else:
        def mm(t, d):
            h = head_of(mum, -.6); f = Vector((0, 1, 0))
            u = ease((t - cyl_t) / .6)
            c = Vector((-.45, -2.2, .35)).lerp(Vector((-.88, -1.45, .55)), u)
            if t > cyl_t - .4: d['handL'] = tuple(c + Vector((.12, 0, .2))); d['handR'] = tuple(c + Vector((-.12, 0, .2)))
            return d
        override(a_m, mm)
        def sm(t, d):
            if t > cyl_t + .45:
                k = ease((t - cyl_t - .45) / .3); c = Vector((-.88, -1.45 + .3 * k, .55 - .05 * k))
                d['handL'] = tuple(c + Vector((.13, 0, .25))); d['handR'] = tuple(c + Vector((-.13, 0, .25))); d['crouch'] = .12 * k + .03 * math.sin(t * 9) * k
                d['lean'] = (d['lean'][0] - .05 * k, d['lean'][1])
            return d
        override(a_s, sm)
        def cu_(t):
            u = ease((t - cyl_t) / .6); k = ease((t - cyl_t - .45) / .3)
            p = Vector((-.45, -2.2, 0)).lerp(Vector((-.88, -1.45, .15)), u).lerp(Vector((-.9, -1.18, .12)), k)
            cyl.location = p
        sh.updates.append(cu_)
    return son, mum, cyl


def s_mummy(sh):
    """MUMMY: 'WHERE ARE YOU GOING?'  Boss entrance: Mummy steps out at the gate, a gas cylinder by her feet."""
    stage(sh, 'day', 35, 200)
    son, mum, cyl = mummy_scene(sh, [(0, 'happy'), (.2, 'shock')], [(0, 'suspicious')], mummy_talk=[(.2, 2.2, 1.0)])
    sh.camera(cam_keys([(0, (-2.6, -3.4, .55), (-.85, -2.1, 1.05), 24), (sh.dur, (-2.2, -3.2, .6), (-.85, -2.1, 1.1), 28)], roll=3, shake=.006), fstop=3)


def s_walk(sh):
    """SON: 'Just taking a walk.'  The most innocent smile ever attempted."""
    stage(sh, 'day', 35, 200)
    son, mum, cyl = mummy_scene(sh, [(0, 'nervous'), (.6, 'grin')], [(0, 'suspicious')], son_talk=[(.1, 2.2, 1.0)])
    cu(sh, son, angle=10, elev=0, size=(.75, .65), lens=45, fstop=2.2)


def s_cylinder(sh):
    """MUMMY: 'GOOD. TAKE THIS GAS CYLINDER TO THE SHOP.'  She swings the huge red cylinder into his arms; his knees buckle."""
    stage(sh, 'day', 35, 200)
    son, mum, cyl = mummy_scene(sh, [(0, 'grin'), (2.2, 'ohno'), (2.9, 'strain')], [(0, 'smile'), (.6, 'happy')], mummy_talk=[(.1, 3.2, 1.0)], cyl_t=2.1)
    sh.camera(cam_keys([(0, (1.0, -2.9, 1.3), (-.9, -1.55, .95), 26), (sh.dur, (.85, -2.75, 1.25), (-.9, -1.4, .85), 28)], shake=.008), fstop=3.2)


def carry(sh, son, cyl, t_walk=True, p0=(-.9, -3.0), yaw=-90):
    a = (walk(sh, son, (p0[0], p0[1], 0), yaw, '82_08', 1.0, face=[(0, 'strain')], speed=.45) if t_walk else
         stand(sh, son, p0, yaw, '77_02', 1.0, face=[(0, 'strain')], z=0))
    def sm(t, d):
        f, sd = side_of(son); c = head_of(son, -.65) + f * .3
        d['handL'] = tuple(c - sd * .14); d['handR'] = tuple(c + sd * .14); d['lean'] = (d['lean'][0] - .07, d['lean'][1] + .03 * math.sin(t * 3)); d['crouch'] = d.get('crouch', 0) + .1
        return d
    override(a, sm)
    def cu_(t):
        f, sd = side_of(son); cyl.location = head_of(son, -.65) + f * .34 - Vector((0, 0, .38)); cyl.rotation_euler = (0, .12 * math.sin(t * 3), 0)
    sh.updates.append(cu_)
    return a


def s_street(sh):
    """MISSION UPDATED: DELIVER THE CYLINDER.  Wide on the colony street: he staggers along hugging the cylinder."""
    stage(sh, 'day', 35, 200)
    son = cast(sh, 'SON', SON); cyl = prop_cylinder(); carry(sh, son, cyl, True, (1.5, -4.6), -90)
    Z.extras(sh, [(-4.6, -8.2, 20), (-7.0, -8.0, 0), (6.2, -2.2, 200)], seed=22, face='laugh', look=lambda t: (2.5, -4.6, 1.2), walkers=[(-10, -6.4, -90, .8)])
    sh.camera(cam_keys([(0, (-1.5, -7.6, 2.2), (2.2, -4.6, .9), 26), (sh.dur, (-1.0, -7.4, 2.0), (2.8, -4.6, .9), 28)], shake=.004), fstop=5)


def s_camera(sh):
    """SON (to camera): 'I downloaded GTA to escape reality...' ... 'Reality downloaded me instead.'  He stops mid-street and
    looks straight down the lens; slow push in."""
    stage(sh, 'day', 35, 200)
    son = cast(sh, 'SON', SON); cyl = prop_cylinder(); carry(sh, son, cyl, False, (2.6, -4.6), 0)
    for a in sh.actors:
        if getattr(a, 'ch', None) is son:
            a.face = H.expr_track([(0, 'strain'), (.3, 'deadpan'), (5.1, 'bored'), (6.0, 'deadpan')]); a.talk = [(.4, 4.3, 1.0), (5.2, 8.2, 1.0)]
    Z.extras(sh, [(-1.4, -8.2, 20), (5.6, -8.0, -20)], seed=23, face='watch', look=lambda t: (2.6, -4.6, 1.2))
    def cam(t):
        h = head_of(son, -.1); d = K([(0, 3.0), (sh.dur, 1.6)], t)
        return (h + Vector((0, -1, .02)) * d, h, 35, 0, h, .002)
    sh.camera(cam, fstop=2.8)


def s_gameover(sh):
    """GAME OVER - REASON: INDIAN PARENTS.  The cylinder wins: he topples over backwards, the world drains to grey."""
    stage(sh, 'day', 35, 200)
    son = cast(sh, 'SON', SON); cyl = prop_cylinder()
    a = stand(sh, son, (2.6, -4.6), 0, '77_02', 1.0, face=[(0, 'strain'), (.4, 'scream'), (1.3, 'sleep')], z=0)
    def sm(t, d):
        f, sd = side_of(son); c = head_of(son, -.65) + f * .3
        d['handL'] = tuple(c - sd * .14); d['handR'] = tuple(c + sd * .14); return d
    override(a, sm)
    TF = .35
    def fall(t):
        u = ease((t - TF) / .55) * (1 + .06 * math.sin(max(0, t - TF - .55) * 18) * math.exp(-max(0, t - TF - .55) * 6))
        son.root.rotation_euler = (math.radians(-88 * u), 0, 0); son.root.location.z = .05 * u
        cyl.location = Vector((2.6, -4.6 - .3 + .2 * u, .15 + .45 * u)); cyl.rotation_euler = (math.radians(-80 * u), 0, 0)
    sh.updates.append(fall)
    sh.camera(cam_keys([(0, (2.6, -7.2, 2.2), (2.6, -4.3, .6), 30), (sh.dur, (2.6, -6.4, 3.4), (2.6, -4.0, .2), 32)], roll=lambda t: K([(0, 0), (sh.dur, -6)], t), shake=.0), fstop=4)


SHOTS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('s_') and callable(v)}

if __name__ == '__main__':
    F.main(SHOTS)
