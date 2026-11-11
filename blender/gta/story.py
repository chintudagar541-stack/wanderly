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
import typo as TY
import house as HS

stand, walk, override, side_of, hold, cam_keys, toon = Z.stand, Z.walk, Z.override, Z.side_of, Z.hold, Z.cam_keys, Z.toon
import hero as HR
H.EXPR['sleep'] = dict(H.EXPR['bored'], ring=1.0, lid=.96, pup=.5, w=.05, op=.025, smile=0.0, bh=-.01, bt=0.0)

# ------------------------------------------------------------------ the family (original characters)
P = TO.preset
SON = P('Son', '#e8b42a', '#1e2a4a', hat=None, haircol='#120c08', height=.97, boots='#2a5aa8', belt='#1e2a4a', collar=False, buttons=False)
PAPA = P('Papa', '#f2efe6', '#2e6a4b', hat=None, haircol='#3a3632', stache=True, beardcol='#141010', height=1.0,
         boots='#5a3a20', collar=False, buttons=False)
MUMMY = P('Mummy', '#e2701a', '#e2701a', dress=True, dresscol='#e2701a', shawl='#d8a838', hat=None, haircol='#0e0a08', bun=True, height=.93,
          boots='#c8a040', collar=False, buttons=False)
DX = (HS.DOOR[0] + HS.DOOR[1]) / 2                       # front door x
SEAT = Vector((HS.SOFA.x + .3, HS.SOFA.y - .02, 0))       # Papa's spot on the sofa
SPOT = Vector((.6, 2.5, 0))                               # where the son stands to ask for money
YAW_SP = math.degrees(math.atan2(SEAT.x - SPOT.x, -(SEAT.y - SPOT.y)))
GATE = Vector((DX + .1, -1.4, .12)); PORCH = Vector((DX, -.5, .12))


class Puppet:
    def __init__(self, ch, pose, post=None):
        self.ch, self.pose, self.post = ch, pose, post; ch.fn = lambda t: self.pose(t)
    def apply(self, t):
        self.ch.apply(t)
        if self.post: self.post(t)


def l2w(loc, yaw, sc, p):
    M = Matrix.Translation(Vector(loc)) @ Matrix.Rotation(math.radians(yaw), 4, 'Z') @ Matrix.Scale(sc, 4)
    return tuple(M @ Vector(p))


def dress_up(sh, ch, who):
    """costume details: the TALEVENTURE tee print, Papa's checked lungi + specs, Mummy's saree border + bindi"""
    bpy.context.view_layer.update()
    if who == 'SON':
        z = ch.TL * .6
        s = C.sign('SON_print', 'TALEVENTURE', ch.rw * 1.25, .06, (0, 0, 0), facing=(0, -1), bg='#e8b42a', fg='#16162a', size=(1000, 130), font_scale=.72, **TY.kw('montserrat'))
        s.parent = ch.torso; s.location = (0, ch.fy(z) - .006, z); s.rotation_euler = (0, 0, 0)
    if who == 'PAPA':                                   # checked lungi on the legs (legs, so he can sit and run properly)
        lm = HS.checker('lungi', '#2e6a4a', '#2a4a8a', 18, lines='#e8e4d8')
        for o in [ch.root] + list(ch.root.children_recursive):
            for sl in getattr(o, 'material_slots', []):
                if sl.material and sl.material.name.startswith('s_#2e6a4b'): sl.material = lm
        g = Z.glasses_prop(ch.cid + '_specs'); Z.wear_glasses(sh, ch, g)
    if who == 'MUMMY':
        o = bpy.data.objects.get(ch.cid + '_dress')
        if o:
            m = bpy.data.materials.new('saree'); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links; b = N['Principled BSDF']
            tc = N.new('ShaderNodeTexCoord'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Generated'], sep.inputs[0])
            rp = N.new('ShaderNodeValToRGB'); L.new(sep.outputs['Z'], rp.inputs[0]); cr = rp.color_ramp; cr.interpolation = 'CONSTANT'
            cr.elements[0].position = 0.0; cr.elements[0].color = (*T.hexc('#d8a838')[:3], 1)
            cr.elements[1].position = .16; cr.elements[1].color = (*T.hexc('#e2701a')[:3], 1)
            e = cr.elements.new(.11); e.color = (*T.hexc('#a8201a')[:3], 1)
            L.new(rp.outputs[0], b.inputs['Base Color']); b.inputs['Roughness'].default_value = .55
            if 'Sheen Weight' in b.inputs: b.inputs['Sheen Weight'].default_value = .5
            o.data.materials.clear(); o.data.materials.append(m)
        z = ch.cz + .062
        bi = T.lib.sphere(ch.cid + '_bindi', .013, (0, ch.surf_y(0, z) - .002, z), T.plain('bindi', '#d01018', .3)); bi.scale = (1, .35, 1)
        bi.parent = ch.head; bi.location = (0, ch.surf_y(0, z) - .002, z)


def cast(sh, who, preset):
    ch = toon(sh, who, preset); dress_up(sh, ch, who); return ch


def stage(sh, mood='day', elev=35, az=200, night=False):
    F.setup(sh, mood, elev, az, town=False, haze=False); sh.town = False
    bpy.context.scene.view_settings.exposure = .35 if mood == 'day' else 0.0
    out = HS.build(night)
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
    hit = bpy.context.scene.ray_cast(dg, Vector((SEAT.x, SEAT.y, 1.6)), Vector((0, 0, -1)))
    sh.seat_z = hit[1].z if hit[0] and .25 < hit[1].z < .7 else .45; print('SEAT_Z', round(sh.seat_z, 3), hit[0] and hit[4].name)
    for k, fan in enumerate(out['fans']): sh.updates.append(lambda t, fan=fan, k=k: setattr(fan, 'rotation_euler', (0, 0, t * 9.0 + k)))
    return out


def prop_newspaper():
    root = bpy.data.objects.new('newspaper', None); T.coll('Town').objects.link(root)
    s = C.sign('paper_front', 'THE DAILY PRAGATI\n\nPRICES UP\nAGAIN', .46, .6, (0, 0, 0), facing=(0, -1), bg='#ece8dc', fg='#1a1a1a', size=(460, 600), font_scale=.36, **TY.kw('playfair'))
    s.parent = root
    b = T.box('paper_back', (.46, .004, .6), (0, .004, 0), T.plain('newsprint', '#dcd6c8', .9)); b.parent = root
    fold = T.box('paper_fold', (.006, .012, .6), (0, -.002, 0), T.plain('newsfold', '#b8b2a4', .9)); fold.parent = root
    return root


def body_ref(ch):
    """head / chest positions of a toon relative to its root (yaw 0, standing) - for hand targets that must be valid in the
    same frame they are posed"""
    if hasattr(ch, '_ref'): return ch._ref
    fn0 = ch.fn
    ch.fn = lambda t: dict(loc=(0, 0, 0), yaw=0, face=H.EXPR['idle']); ch.apply(0); bpy.context.view_layer.update()
    hd = head_of(ch, 0) - ch.root.matrix_world.translation; ch.fn = fn0
    ch._ref = dict(head=hd); return ch._ref


# ------------------------------------------------------------------ the bed (lying + sitting up)
def in_bed(sh, ch, face, sit=lambda t: 0.0):
    bc = HS.BEDC; yaw = -90; ftrack = H.expr_track(face)
    def pose(t):
        u = sit(t); feet = Vector((bc.x - .78, bc.y, HS.BED_TOP + .3))
        return dict(loc=tuple(feet), yaw=yaw, face=ftrack(t), lean=(.714 * u, 0), head=[0, -10 * (1 - u), 0], crouch=0.0)
    def post(t): ch.root.rotation_euler = (-math.pi / 2, 0, math.radians(yaw))
    p = Puppet(ch, pose, post); sh.actors.append(p)
    bl = HR.rbox('blanket_on', (1.25, 1.14, .5), (bc.x - .45, bc.y, .72), HS.checker('blanket', '#c84a3a', '#a83a2a', 10), .4)
    return p


def sitting(sh, ch, face, look=None, hands=None, rise=None, talk=None, seat_h=None):
    """Papa on the sofa: hips on the cushion, feet on the floor; rise(t) -> 0..1 stands him up"""
    root = SEAT
    a = stand(sh, ch, (root.x, root.y), 0, '77_02', 1.0, face=face, look=look, z=0, talk=talk)
    def mod(t, d):
        u = rise(t) if rise else 0.0
        sit_c = max(0.0, ch.L * ch.s - ((seat_h or getattr(sh, 'seat_z', .45)) + .09 * ch.s))
        d['crouch'] = sit_c * (1 - u); d['loc'] = (root.x, root.y - .3 * u, 0); d['yaw'] = 0
        for sd, sx in (('L', -1), ('R', 1)): d['foot' + sd] = (sx * .15, -.42 * (1 - u), 0)
        d['lean'] = (d['lean'][0] * .4 - .07 * (1 - u), d['lean'][1] * .4)
        if hands: d.update(hands(t, d))
        return d
    override(a, mod); return a


def papa_reading(sh, papa, face, paper_up=lambda t: 1.0, look=None, talk=None, rise=None):
    paper = prop_newspaper(); ref = body_ref(papa)
    def at_(t, d):
        u = paper_up(t); h = Vector(d['loc']) + ref['head'] - Vector((0, 0, d.get('crouch', 0)))
        return h + Vector((0, -.36 - .1 * (1 - u), -.05 - .62 * (1 - u))), u
    def hands(t, d):
        c, u = at_(t, d)
        return dict(handL=tuple(c + Vector((.2, .02, -.05))), handR=tuple(c + Vector((-.2, .02, -.05))))
    a = sitting(sh, papa, face, look=look, hands=hands, talk=talk, rise=rise)
    def pu(t):
        d = papa.fn(t); c, u = at_(t, d); paper.location = c; paper.rotation_euler = (math.radians(-65 * (1 - u)), 0, 0)
    sh.updates.append(pu)
    return a, paper


def carry_rig(sh, son, cyl, extra=None):
    """the son hugs the cylinder at his belly: hand targets in his own frame, the cylinder rides the root (so it also
    falls with him in the game-over shot)"""
    sc = son.s
    def hands(d):
        loc, yaw, cr = d['loc'], d['yaw'], d.get('crouch', 0)
        z = son.L - cr / sc + son.TL * .32
        d['handL'] = l2w(loc, yaw, sc, (-.17, -.36, z)); d['handR'] = l2w(loc, yaw, sc, (.17, -.36, z))
        return d
    def cu_(t):
        bpy.context.view_layer.update(); d = son.fn(t); cr = d.get('crouch', 0)
        local = Vector((0, -.42, son.L - cr / sc - .5 / sc))
        cyl.matrix_world = son.root.matrix_world @ Matrix.Translation(local) @ Matrix.Scale(1 / sc, 4)
    sh.updates.append(cu_)
    return hands


# ------------------------------------------------------------------ shots
def s_room(sh):
    """'NEW DAY. NEW OPPORTUNITIES.'  Morning in a small bedroom: posters, a glowing PC, the fan turning; the son asleep."""
    stage(sh, 'day', 18, 250)
    son = cast(sh, 'SON', SON); in_bed(sh, son, [(0, 'sleep')])
    sh.camera(cam_keys([(0, (2.2, 4.3, 2.05), (4.2, 3.3, .62), 18), (sh.dur, (2.35, 4.25, 1.95), (4.25, 3.35, .65), 21)], shake=.003), fstop=4)
    sh.keylight(6, (1, .85, .7))


def s_face(sh):
    """MUMMY (off): 'GET UP! YOU HAVE BEEN SLEEPING FOR 12 HOURS!'  Slow push down onto the sleeping face; on 'HOURS' the
    eyes snap open."""
    stage(sh, 'day', 18, 250)
    son = cast(sh, 'SON', SON); in_bed(sh, son, [(0, 'sleep'), (3.25, 'shock')])
    def cam(t):
        hp = head_of(son); u = ease(t / sh.dur)
        return (hp + Vector((-1.0 + .35 * u, -.12, .95 - .3 * u)), hp, 30 + 12 * u, 0, hp, .002 + .01 * (t > 3.25))
    sh.camera(cam, fstop=2.6); sh.keylight(10, (1, .85, .7))


def s_situp(sh):
    """MISSION ACTIVATED: ESCAPE THE HOUSE.  He jolts upright in bed, eyes wide, determined."""
    stage(sh, 'day', 18, 250)
    son = cast(sh, 'SON', SON)
    in_bed(sh, son, [(0, 'shock'), (.7, 'determined')], sit=lambda t: ease(t / .3) * .95)
    sh.camera(cam_keys([(0, (2.55, 2.35, 1.2), (3.6, 3.6, 1.0), 24), (sh.dur, (2.65, 2.45, 1.2), (3.6, 3.6, 1.05), 26)], shake=.012), fstop=3)
    sh.keylight(10, (1, .85, .7))


def s_approach(sh):
    """SON: 'Dad... can I have five hundred rupees?'  Papa behind his newspaper on the sofa; the son strolls in from his
    room with his sweetest smile."""
    stage(sh, 'day', 30, 200)
    papa = cast(sh, 'PAPA', PAPA); son = cast(sh, 'SON', SON)
    papa_reading(sh, papa, [(0, 'bored')])
    p0, p1 = Vector((2.5, 3.05, 0)), SPOT; yw = math.degrees(math.atan2(p1.x - p0.x, -(p1.y - p0.y)))
    a = sh.actor(son, [TO.Act(0, '82_08', 1.0, sh.dur + 2, loc=tuple(p0), yaw=yw, lock_root=True)], face=[(0, 'smile'), (1.3, 'grin')], talk=[(.68, 2.82, 1.0)])
    def mv(t, d):
        u = min(1.0, t / 1.9); d['loc'] = tuple(p0.lerp(p1, u))
        if t > 1.9:
            k = ease((t - 1.9) / .4); d['yaw'] = yw + (YAW_SP - yw) * k
            for sd, sx in (('L', -1), ('R', 1)): d['foot' + sd] = (sx * .12 * (1 + k * 0), d['foot' + sd][1] * (1 - k), 0)
        return d
    override(a, mv)
    sh.camera(cam_keys([(0, (-1.75, .75, 1.45), (.6, 2.9, .95), 22), (sh.dur, (-1.55, .95, 1.4), (.3, 2.95, .95), 24)], shake=.004), fstop=4)


def s_papa1(sh):
    """PAPA: 'What happened to the five hundred I gave you yesterday?'  Over the son's shoulder: the newspaper lowers."""
    stage(sh, 'day', 30, 200)
    papa = cast(sh, 'PAPA', PAPA); son = cast(sh, 'SON', SON)
    papa_reading(sh, papa, [(0, 'suspicious')], paper_up=lambda t: 1 - ease((t - .1) / .6), talk=[(.72, 3.58, 1.0)])
    stand(sh, son, (SPOT.x, SPOT.y), YAW_SP, '77_02', 1.4, face=[(0, 'grin')], z=0)
    h = SEAT + Vector((0, 0, 1.0)); dv = (SPOT - SEAT).normalized(); pv = Vector((-dv.y, dv.x, 0)); c0 = SPOT + dv * .7 - pv * .8 + Vector((0, 0, 1.3))
    sh.camera(cam_keys([(0, tuple(c0), tuple(h), 34), (sh.dur, tuple(c0 - dv * .15), tuple(h + Vector((0, 0, .03))), 38)], shake=.003), fstop=2.8)


def s_inflation(sh):
    """SON: 'Inflation.'  Dead-straight close-up; total confidence."""
    stage(sh, 'day', 30, 200)
    son = cast(sh, 'SON', SON)
    stand(sh, son, (SPOT.x, SPOT.y), YAW_SP, '77_02', 1.4, face=[(0, 'smug')], z=0, talk=[(.67, 1.5, .8)])
    cu(sh, son, angle=5, elev=2, size=(.62, .58), lens=50, fstop=2.0)


def s_silence(sh):
    """Silence.  Static wide: Papa slowly lowers the paper all the way and stares.  The fan turns.  The clock ticks."""
    stage(sh, 'day', 30, 200)
    papa = cast(sh, 'PAPA', PAPA); son = cast(sh, 'SON', SON)
    papa_reading(sh, papa, [(0, 'deadpan')], paper_up=lambda t: 0.0)
    stand(sh, son, (SPOT.x, SPOT.y), YAW_SP, '77_02', 1.4, face=[(0, 'smug'), (.8, 'nervous')], z=0)
    sh.camera(cam_keys([(0, (-2.1, 1.75, 1.4), (.1, 3.2, .85), 20), (sh.dur, (-2.1, 1.75, 1.4), (.1, 3.2, .85), 20)], shake=.0), fstop=5)


def s_zoom(sh):
    """PAPA: 'INFLATION? YOU DON'T EVEN HAVE A JOB!'  Crash zoom into Papa's face as he explodes."""
    stage(sh, 'day', 30, 200)
    papa = cast(sh, 'PAPA', PAPA)
    papa_reading(sh, papa, [(0, 'deadpan'), (.62, 'furious'), (1.5, 'rage')], paper_up=lambda t: 0.0, talk=[(.62, 2.69, 1.3)])
    def cam(t):
        h = head_of(papa); d = K([(0, 2.6), (.5, 2.5), (.72, .95), (sh.dur, .82)], t)
        return (h + Vector((.15, -1, .05)).normalized() * d, h, 40, K([(0, 0), (.72, -6), (sh.dur, -4)], t), h, .004 + .02 * math.exp(-max(0, t - .72) * 6) * (t > .72))
    sh.camera(cam, fstop=2.2); sh.keylight(12, (1, .8, .6))


def s_failed(sh):
    """MISSION FAILED.  The son's smile drops."""
    stage(sh, 'day', 30, 200)
    son = cast(sh, 'SON', SON)
    stand(sh, son, (SPOT.x, SPOT.y), YAW_SP, '77_02', 1.4, face=[(0, 'ohno')], z=0)
    cu(sh, son, angle=-10, elev=8, size=(.7, .66), lens=45, fstop=2.0)


def s_slipper(sh):
    """Papa slowly rises... reaches down for his chappal... and raises it like a weapon.  Low hero angle."""
    stage(sh, 'day', 30, 200)
    papa = cast(sh, 'PAPA', PAPA); slip = HR.chappal('papa_chappal'); ref = body_ref(papa); sc = papa.s
    def hands(t, d):
        loc = Vector(d['loc'])
        if t < 1.0: return dict(handR=l2w(loc, 0, sc, (.22, -.12, papa.L - .3 * ease(t / .9))))
        u = ease((t - 1.0) / .45); lo = Vector(l2w(loc, 0, sc, (.22, -.12, papa.L - .3))); hi = loc + ref['head'] + Vector((.3, .05, .35))
        return dict(handR=tuple(lo.lerp(hi, u)))
    sitting(sh, papa, [(0, 'deadpan'), (1.1, 'rage')], hands=hands, rise=lambda t: ease(t / 1.0))
    hold(sh, slip, papa, 'R', (0, 0, .02), rot=lambda t: (math.radians(90 if t > 1.1 else 0), 0, 0))
    s = SEAT
    sh.camera(cam_keys([(0, (s.x + .5, s.y - 1.6, .45), (s.x + .1, s.y - .2, 1.0), 22), (sh.dur, (s.x + .45, s.y - 1.35, .4), (s.x + .1, s.y - .3, 1.4), 22)],
                       roll=lambda t: K([(0, 0), (sh.dur, 5)], t), shake=.006), fstop=3)
    sh.keylight(12, (1, .8, .6))


ELL_C, ELL_R = Vector((HS.TABLE.x, HS.TABLE.y, 0)), (1.3, .85)
W_RUN = 2.3                                       # rad/s, clockwise round the coffee table


def ell(th):
    p = ELL_C + Vector((ELL_R[0] * math.cos(th), ELL_R[1] * math.sin(th), 0))
    v = Vector((ELL_R[0] * math.sin(th), -ELL_R[1] * math.cos(th), 0))          # clockwise velocity
    return p, math.degrees(math.atan2(v.x, -v.y))


def chase(sh, t_off=0.0):
    papa = cast(sh, 'PAPA', PAPA); son = cast(sh, 'SON', SON); slip = HR.chappal('papa_chappal'); ref = body_ref(papa)
    th_s0 = math.atan2((SPOT.y - ELL_C.y) / ELL_R[1], (SPOT.x - ELL_C.x) / ELL_R[0])
    a_s = sh.actor(son, [TO.Act(0, '09_01', .3, sh.dur + 2, loc=(0, 0, 0), yaw=0, speed=1.25, lock_root=True)], face=[(0, 'terror')])
    a_p = sh.actor(papa, [TO.Act(0, '09_01', .9, sh.dur + 2, loc=(0, 0, 0), yaw=0, speed=1.1, lock_root=True)], face=[(0, 'rage')], talk=[(0, sh.dur, .5)])
    def ms(t, d):
        p, yw = ell(th_s0 - W_RUN * (t + t_off)); d['loc'] = tuple(p); d['yaw'] = yw; return d
    def mp(t, d):
        p, yw = ell(th_s0 - W_RUN * (t + t_off) + 1.9); d['loc'] = tuple(p); d['yaw'] = yw
        d['handR'] = tuple(Vector(d['loc']) + Matrix.Rotation(math.radians(yw), 3, 'Z') @ Vector((.25, .05, 0)) + Vector((0, 0, ref['head'].z + .3 + .06 * math.sin(t * 14))))
        return d
    override(a_s, ms); override(a_p, mp); hold(sh, slip, papa, 'R', (0, 0, .02), rot=lambda t: (math.radians(80), 0, math.radians(ell(th_s0 - W_RUN * (t + t_off) + 1.9)[1])))
    return papa, son


def s_run(sh):
    """WANTED LEVEL *****.  He bolts - round the coffee table, Papa right behind with the chappal raised."""
    stage(sh, 'day', 30, 200)
    papa, son = chase(sh, 0.0)
    sh.camera(cam_keys([(0, (1.65, 4.2, 2.15), (-.7, 2.1, .6), 19), (sh.dur, (1.6, 4.15, 2.1), (-.8, 2.0, .6), 20)], shake=.012), fstop=5)


def s_chase(sh):
    """Round and round the table.  Top-down-ish wide from the corner - the most Indian chase in history."""
    stage(sh, 'day', 30, 200)
    papa, son = chase(sh, 2.8)
    sh.camera(cam_keys([(0, (-2.6, .4, 2.5), (-.5, 2.4, .5), 18), (sh.dur, (-2.5, .55, 2.45), (-.5, 2.4, .5), 19)], roll=-3, shake=.015), fstop=6)


def s_escape(sh):
    """He bursts out of the front door onto the porch and stops, panting... free at last."""
    stage(sh, 'day', 35, 200)
    son = cast(sh, 'SON', SON)
    p0, p1 = Vector((DX, 1.3, 0)), Vector((DX, -.85, .12))
    a = sh.actor(son, [TO.Act(0, '09_01', .3, 1.2, loc=tuple(p0), yaw=0, speed=1.25, lock_root=True), TO.Act(.95, '77_02', 1.0, 6, loc=tuple(p1), yaw=0, lock_root=True)],
                 face=[(0, 'terror'), (1.15, 'relief'), (1.7, 'happy')])
    def mv(t, d):
        u = min(1.0, t / 1.0); p = p0.lerp(p1, u); d['loc'] = (p.x, p.y, .12 if p.y < 0 else 0); d['yaw'] = 0
        if t > .95: d['lean'] = (d['lean'][0] + .08 + .02 * math.sin(t * 10), d['lean'][1])
        return d
    override(a, mv)
    sh.camera(cam_keys([(0, (DX + .9, -4.4, 1.25), (DX, -.3, 1.05), 26), (sh.dur, (DX + .8, -3.9, 1.2), (DX, -.6, 1.0), 28)], shake=.006), fstop=4)


def mummy_scene(sh, son_face, mummy_face, son_talk=None, mummy_talk=None, cyl_t=None):
    son = cast(sh, 'SON', SON); mum = cast(sh, 'MUMMY', MUMMY); cyl = HR.lpg_cylinder('lpg')
    a_s = stand(sh, son, (PORCH.x, PORCH.y), 0, '77_02', 1.0, face=son_face, z=PORCH.z, talk=son_talk)
    a_m = stand(sh, mum, (GATE.x, GATE.y), 180, '80_48', 1.2, face=mummy_face, z=GATE.z, talk=mummy_talk)
    c0 = Vector((GATE.x + .45, GATE.y - .05, GATE.z))
    if cyl_t is None:
        cyl.location = c0
    else:
        hand_s = carry_rig(sh, son, cyl) if False else None
        def mm(t, d):                                   # Mummy lifts it (effortlessly) and pushes it into his arms
            u = ease((t - cyl_t) / .55); c = c0.lerp(Vector((GATE.x, GATE.y + .45, .55)), u) + Vector((0, 0, .45))
            if t > cyl_t - .35: d['handL'] = tuple(c + Vector((.14, 0, .05))); d['handR'] = tuple(c + Vector((-.14, 0, .05)))
            return d
        override(a_m, mm)
        sc = son.s
        def sm(t, d):
            if t > cyl_t + .45:
                k = ease((t - cyl_t - .45) / .3); loc = d['loc']
                d['crouch'] = (.13 + .03 * math.sin(t * 9)) * k
                z = son.L - d['crouch'] / sc + son.TL * .32
                d['handL'] = l2w(loc, 0, sc, (-.17, -.36, z)); d['handR'] = l2w(loc, 0, sc, (.17, -.36, z))
                d['lean'] = (d['lean'][0] - .06 * k, d['lean'][1] + .03 * math.sin(t * 7) * k)
            return d
        override(a_s, sm)
        def cu_(t):
            u = ease((t - cyl_t) / .55); k = ease((t - cyl_t - .45) / .3)
            p = c0.lerp(Vector((GATE.x, GATE.y + .45, .55)), u)
            p2 = Vector((PORCH.x, PORCH.y - .42 * son.s, PORCH.z + son.L * son.s - .5 - .13 * k))
            cyl.location = p.lerp(p2, k)
        sh.updates.append(cu_)
    return son, mum, cyl


def s_mummy(sh):
    """MUMMY: 'WHERE ARE YOU GOING?'  Boss entrance: Mummy at the gate, hands on hips, a gas cylinder at her feet."""
    stage(sh, 'day', 35, 200)
    son, mum, cyl = mummy_scene(sh, [(0, 'happy'), (.66, 'shock')], [(0, 'suspicious')], mummy_talk=[(.66, 1.81, 1.0)])
    sh.camera(cam_keys([(0, (DX - .38, .15, .6), (GATE.x, GATE.y, 1.25), 22), (sh.dur, (DX - .35, .1, .62), (GATE.x, GATE.y, 1.3), 26)], roll=3, shake=.006), fstop=3)


def s_walk(sh):
    """SON: 'Just taking a walk.'  The most innocent smile ever attempted."""
    stage(sh, 'day', 35, 200)
    son, mum, cyl = mummy_scene(sh, [(0, 'nervous'), (.5, 'grin')], [(0, 'suspicious')], son_talk=[(.56, 1.81, 1.0)])
    cu(sh, son, angle=10, elev=0, size=(.75, .65), lens=45, fstop=2.2)


def s_cylinder(sh):
    """MUMMY: 'GOOD. TAKE THIS GAS CYLINDER TO THE SHOP.'  She swings the big red cylinder into his arms; his knees buckle."""
    stage(sh, 'day', 35, 200)
    son, mum, cyl = mummy_scene(sh, [(0, 'grin'), (2.6, 'ohno'), (3.1, 'strain')], [(0, 'smile'), (.9, 'happy')], mummy_talk=[(.56, 2.8, 1.0)], cyl_t=2.55)
    sh.camera(cam_keys([(0, (DX - 2.25, -1.05, 1.35), (DX + .05, -.95, .95), 21), (sh.dur, (DX - 2.05, -1.05, 1.3), (DX + .05, -.9, .85), 23)], shake=.008), fstop=3.2)


def carry_walk(sh, son, cyl, p0, p1, dur, face):
    yw = math.degrees(math.atan2(p1.x - p0.x, -(p1.y - p0.y))) if (p1 - p0).length > .01 else 0
    a = sh.actor(son, [TO.Act(0, '82_08', 1.0, sh.dur + 2, loc=tuple(p0), yaw=yw, lock_root=True, speed=.6)], face=face)
    hands = carry_rig(sh, son, cyl)
    def mv(t, d):
        u = min(1.0, t / dur) if dur > 0 else 0; d['loc'] = tuple(p0.lerp(p1, u)); d['yaw'] = yw + 4 * math.sin(t * 3.1)
        d['crouch'] = d.get('crouch', 0) + .1 + .02 * math.sin(t * 6.2); d['lean'] = (d['lean'][0] - .07, d['lean'][1] + .04 * math.sin(t * 3.1))
        return hands(d)
    override(a, mv); return a


def s_street(sh):
    """MISSION UPDATED: DELIVER THE CYLINDER.  Wide down the colony street: he staggers along hugging the cylinder; the
    neighbours watch and laugh."""
    stage(sh, 'day', 35, 200)
    son = cast(sh, 'SON', SON); cyl = HR.lpg_cylinder('lpg')
    p0, p1 = Vector((DX + .3, -3.3, 0)), Vector((DX + 1.6, -4.4, 0))
    carry_walk(sh, son, cyl, p0, p1, sh.dur, [(0, 'strain')])
    Z.extras(sh, [(DX - 4.0, -8.0, 10), (DX - 5.2, -7.6, -20), (DX + 5.6, -1.9, 200)], seed=22, face='laugh', look=lambda t: (DX + 1, -4, 1.2))
    sh.camera(cam_keys([(0, (DX - 2.4, -7.4, 2.3), (DX + .6, -3.6, .9), 24), (sh.dur, (DX - 1.9, -7.3, 2.1), (DX + 1.4, -4.2, .9), 26)], shake=.004), fstop=5)


def s_camera(sh):
    """SON (to camera): 'I downloaded G T A to escape reality...' ... 'Reality downloaded me instead.'  He stops mid-street and
    looks straight down the lens; slow push in."""
    stage(sh, 'day', 35, 200)
    son = cast(sh, 'SON', SON); cyl = HR.lpg_cylinder('lpg')
    p = Vector((DX + 1.6, -4.4, 0))
    a = carry_walk(sh, son, cyl, p, p, 0, [(0, 'strain'), (.5, 'deadpan'), (4.2, 'bored'), (5.6, 'deadpan')])
    a.talk = [(.92, 3.98, 1.0), (5.72, 7.78, 1.0)]
    Z.extras(sh, [(DX - .2, -8.3, 20), (DX + 3.4, -8.1, -20)], seed=23, face='watch', look=lambda t: tuple(p + Vector((0, 0, 1.2))))
    def cam(t):
        h = head_of(son, -.1); d = K([(0, 3.0), (sh.dur, 1.55)], t)
        return (h + Vector((0, -1, .03)) * d, h, 35, 0, h, .002)
    sh.camera(cam, fstop=2.8)


def s_gameover(sh):
    """GAME OVER - REASON: INDIAN PARENTS.  The cylinder wins: he topples over backwards, still hugging it."""
    stage(sh, 'day', 35, 200)
    son = cast(sh, 'SON', SON); cyl = HR.lpg_cylinder('lpg')
    p = Vector((DX + 1.6, -4.4, 0)); TF = .35
    a = carry_walk(sh, son, cyl, p, p, 0, [(0, 'strain'), (.4, 'scream'), (1.4, 'sleep')])
    def fall(t):
        u = ease((t - TF) / .55); bounce = .05 * math.sin(max(0, t - TF - .55) * 18) * math.exp(-max(0, t - TF - .55) * 6)
        son.root.rotation_euler = (math.radians(-86 * min(1.0, u + bounce)), 0, son.root.rotation_euler.z); son.root.location.z += .32 * u
    sh.actors.append(type('Post', (), {'ch': son, 'apply': lambda self_, t: fall(t)})())
    sh.camera(cam_keys([(0, (p.x + .2, -7.1, 2.1), (p.x, -4.1, .6), 30), (sh.dur, (p.x + .1, -6.3, 3.3), (p.x, -3.8, .25), 32)], roll=lambda t: K([(0, 0), (sh.dur, -6)], t), shake=.0), fstop=4)


SHOTS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('s_') and callable(v)}

if __name__ == '__main__':
    F.main(SHOTS)
