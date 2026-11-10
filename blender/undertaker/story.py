"""THE UNDERTAKER'S BEST CUSTOMER - dark comedy short (DAGAR CLIPS).  Same engine as the Wild West short: ink-outline
round-head toons with mocap acting in the real Dry Gulch town, plus Boot Hill, coffins and the undertaker's shop.
    python3 story.py -- still <shot> out.png [t]
    python3 story.py -- frames <shot> <f0> <f1> <outdir>"""
import os, sys, json, math, random
HERE = os.path.dirname(os.path.abspath(__file__)); WEST = os.path.join(os.path.dirname(HERE), 'west')
sys.path.insert(0, HERE); sys.path.insert(0, WEST)
import film as F
F.CFG = json.load(open(os.path.join(HERE, 'shots.json')))
from film import bpy, Vector, Matrix, T, PR, TO, ease, K, lerp, head_of, facing, bone_pos, framed, cu, night_lights, S, W_, DECK
import town
import dress
import sets as U
import inkchar as H

# Dry Gulch: the barber becomes the undertaker, the street banner names the town
town.TOWN_BUILDINGS[:] = [('undertaker', -1, 22.5, 6.0, 9, 4.6, 'UNDERTAKER', '#3e3836', '#d8d0c0', 1) if b[0] == 'barber' else b for b in town.TOWN_BUILDINGS]
_banner = dress.banner
dress.banner = lambda y, text='WELCOME TO DRY GULCH', **k: _banner(y, text, **k)

HZ = U.HILL_H
EZ = TO.preset('Ezra', '#ece4d4', '#5a4a3a', hat='bowler', hatcol='#5a4632', vest='#8a6a3a', neckerchief='#b02020', stache=True, beardcol='#6a4a2a',
               haircol='#6a4a2a', height=1.0, boots='#3a2418', belt='#3a2418')
MORT = TO.preset('Mortimer', '#d8d4cc', '#18181c', hat='tophat', hatcol='#121214', vest='#1e1e24', duster='#111114', bolo=True, height=1.12,
                 boots='#0c0c0e', haircol='#2a2a2a', belt='#111111')
JOE = TO.preset('FatherJoe', '#1a1a1e', '#1a1a1e', hat=None, duster='#141418', neckerchief='#f4f0e8', haircol='#a8a8a4', height=.98, boots='#141414')
def widow(i): return TO.preset(f'Widow{i}', '#2a2830', '#1a1a1e', hat='bonnet', hatcol='#1c1a1e', dress=True, dresscol=['#1c1a1e', '#26222a', '#1e1c22'][i % 3],
                               shawl='#2e2a32', haircol=['#2a1a10', '#6a3a1a', '#8a8a88'][i % 3], height=.95, bun=True, collar=False, boots='#111111')
def bandsman(i): return TO.preset(f'Band{i}', '#ece4d4', '#2a2a3a', hat='bowler', hatcol='#2a2a3a', vest='#8a2a24', stache=i % 2 == 0, beardcol='#3a2a1a',
                                  haircol='#3a2a1a', height=1.0 + .04 * (i % 2), boots='#1a1a1a')

COFFIN_HEAD = Vector((0.0, 94.85, HZ + .08))          # coffin over the open grave (on planks), head end towards town


# ------------------------------------------------------------------ helpers
def stage(sh, mood='day', elev=38, az=140, veg=.7, grave=True, shop=False):
    out = F.setup(sh, mood, elev, az, town=True, veg=veg)
    if grave: U.boot_hill()
    if shop: out = U.shop_interior(SHOP)
    return out


SHOP = Vector((-95.0, -60.0, 0.0))


def toon(sh, cid, preset):
    if cid not in sh.chars: sh.chars[cid] = TO.Toon(cid, preset)
    return sh.chars[cid]


def stand(sh, ch, xy, yaw, clip='77_02', s0=1.0, face=None, look=None, z=None, talk=None):
    z = U.ground_z(*xy) if z is None else z
    return sh.actor(ch, [TO.Act(0, clip, s0, sh.dur + 2, loc=(xy[0], xy[1], z), yaw=yaw, lock_root=True)], face=face or [(0, 'idle')], look=look, talk=talk)


def walk(sh, ch, p0, yaw, clip='82_08', s0=1.0, face=None, speed=1.0, look=None):
    return sh.actor(ch, [TO.Act(0, clip, s0, sh.dur + 2, loc=p0, yaw=yaw, speed=speed)], face=face or [(0, 'idle')], look=look)


def override(actor, fn):
    """post-process the pose dict of a ToonActor: fn(t, pose) -> pose"""
    f0 = actor._fn
    actor.ch.fn = lambda t: fn(t, f0(t))
    return actor


class Puppet:
    """direct pose control (lying in a coffin, sitting up...): pose(t) -> dict; post(t) runs after apply"""
    def __init__(self, ch, pose, post=None):
        self.ch, self.pose, self.post = ch, pose, post
        ch.fn = lambda t: self.pose(t)
    def apply(self, t):
        self.ch.apply(t)
        if self.post: self.post(t)


def local_to_world(loc, yaw, sc, p):
    M = Matrix.Translation(Vector(loc)) @ Matrix.Rotation(math.radians(yaw), 4, 'Z') @ Matrix.Scale(sc, 4)
    return tuple(M @ Vector(p))


def lie_in(sh, ch, coffin, face, sit=None, hands='folded', wave=None, hand_targets=None):
    """lay a toon in a coffin (feet at the foot end, face up).  sit(t) -> 0..1 sits the torso up.  hands: 'folded'|'side'|None"""
    yaw_c = math.degrees(coffin.root.rotation_euler.z); yaw = yaw_c + 180
    ftrack = H.expr_track(face)
    def pose(t):
        feet = coffin.world((0, coffin.length - .12, .1))
        u = sit(t) if sit else 0.0
        d = dict(loc=tuple(feet), yaw=yaw, face=ftrack(t), lean=(.714 * u, 0), head=[0, -18 * (1 - u), 0], crouch=0.0)
        sc = ch.s
        if hands == 'folded' and u < .5:
            d['handL'] = local_to_world(feet, yaw, sc, (-.06, -.2, ch.L + ch.TL * .55))
            d['handR'] = local_to_world(feet, yaw, sc, (.06, -.22, ch.L + ch.TL * .5))
        if hand_targets:
            for k, v in hand_targets(t, feet, yaw, sc).items(): d[k] = v
        return d
    def post(t):
        ch.root.rotation_euler = (-math.pi / 2, 0, math.radians(yaw))
    p = Puppet(ch, pose, post); sh.actors.append(p); return p


def grave_coffin(kind='pine', length=2.15, at=None, yaw=0.0, planks=True, name='coffin'):
    at = at or COFFIN_HEAD
    if planks:
        pw = T.wood('gplank', '#6a5640', weather=.8)
        for y in (at.y + .45, at.y + length - .45): T.box('gplank', (2.0, .26, .07), (at.x, y, HZ + .035), pw)
    c = U.Coffin(name, tuple(at), yaw=yaw, kind=kind, length=length)
    return c


def mourners(sh, n, seed=0, face='sad', clip=None, x=-3.0, y0=93.8, dy=1.05, black=True, look=None):
    out = []
    for k in range(n):
        p = widow(k + seed) if (black and k % 2 == 0) else TO.crowd_preset(300 + seed * 11 + k)
        ch = toon(sh, f'M{seed}_{k}', p)
        xx = x - (k % 2) * .9; yy = y0 + (k // 2) * dy * 1.6 + (k % 2) * .5
        stand(sh, ch, (xx, yy), 90 + random.Random(k + seed).uniform(-15, 15), clip or ['77_02', '40_10', '77_05'][k % 3], 1.0 + k * .7,
              face=[(0, face if isinstance(face, str) else face[k % len(face)])], look=look or (lambda t: (0, 96, HZ + 1.2)))
        out.append(ch)
    return out


def hold(sh, obj, ch, side='R', off=(0, 0, 0), rot=None):
    def u(t):
        p = bone_pos(ch, 'RightHand' if side == 'R' else 'LeftHand'); obj.location = p + Vector(off)
        if rot is not None: obj.rotation_euler = rot(t) if callable(rot) else rot
    sh.updates.append(u)


def cam_keys(keys, roll=0.0, shake=.008, lens=None):
    """keys: [(t, pos, target, lens)] smooth glide between them -> camera fn"""
    def fn(t):
        ks = sorted(keys, key=lambda k: k[0])
        if t <= ks[0][0]: a = b = ks[0]; u = 0
        elif t >= ks[-1][0]: a = b = ks[-1]; u = 0
        else:
            for a, b in zip(ks, ks[1:]):
                if a[0] <= t <= b[0]: break
            u = ease((t - a[0]) / (b[0] - a[0]))
        p = Vector(a[1]).lerp(Vector(b[1]), u); tg = Vector(a[2]).lerp(Vector(b[2]), u); ln = a[3] + (b[3] - a[3]) * u
        r = roll(t) if callable(roll) else roll
        return (p, tg, ln, r, tg, shake)
    return fn


# ------------------------------------------------------------------ 1-2  Boot Hill, the four graves, the climb out
def s_hook(sh):
    """'Ezra Pike had been buried four times.'  Close on a board marked EZRA PIKE / NOT DEAD, pull back and up through the
    row of four identical graves to the whole of Boot Hill with Dry Gulch beyond, dusk."""
    stage(sh, 'sunset', 7, 300)
    mort = toon(sh, 'MORT', MORT)
    stand(sh, mort, (8.2, 93.4), -120, '40_10', 2.0, face=[(0, 'bored')])
    sh.camera(cam_keys([(0, (-5.6, 90.55, HZ + .62), (-6.0, 91.8, HZ + .45), 34), (sh.dur, (1.2, 84.2, HZ + 3.6), (0.5, 92.5, HZ + .9), 24)], roll=lambda t: K([(0, 3), (sh.dur, 0)], t), shake=.006), fstop=3.5)


def s_climb(sh):
    """'And every time, he climbed out to complain about the service.'  Into the open grave: the lid bangs open, Ezra sits
    up furious and waves his complaint form at the undertaker peering over the edge."""
    stage(sh, 'sunset', 7, 300)
    c = grave_coffin(at=Vector((0, 94.95, HZ - U.PIT[3] + .05)), planks=False)
    c.open(0)
    ez = toon(sh, 'EZRA', EZ); mort = toon(sh, 'MORT', MORT)
    form = U.paper('form', 'complaint', (0, 0, 0), w=.34, h=.45)
    def lid(t): c.open(max(0.0, min(1.0, (t - .35) / .22)) * (1 + .08 * math.sin(max(0, t - .57) * 14) * math.exp(-max(0, t - .57) * 4)))
    sh.updates.append(lid)
    sit = lambda t: ease((t - .55) / .6)
    def hands(t, feet, yaw, sc):
        if t < 1.1: return {}
        w = math.sin((t - 1.1) * 9) * .06
        return {'handR': local_to_world(feet, yaw, sc, (.12, -.55 + w, ch_h(ez) + .25)), 'handL': local_to_world(feet, yaw, sc, (-.18, -.4, ch_h(ez) * .8))}
    lie_in(sh, ez, c, [(0, 'deadpan'), (.6, 'furious'), (2.2, 'shout')], sit=sit, hands=None, hand_targets=hands)
    hold(sh, form, ez, 'R', (0, .02, .18), rot=(math.radians(80), 0, math.radians(180)))
    stand(sh, mort, (.25, 98.15), 0, '77_02', 3.0, face=[(0, 'bored'), (2.4, 'deadpan')], look=lambda t: (0, 96, 0.8))
    sh.camera(cam_keys([(0, (1.55, 92.6, HZ + 1.6), (0, 96.2, .9), 26), (1.2, (1.25, 93.1, HZ + 1.25), (0, 96.4, 1.1), 28), (sh.dur, (.9, 93.8, HZ + .95), (.05, 96.6, 1.45), 32)],
                       roll=lambda t: K([(0, -4), (sh.dur, -1)], t), shake=.01), fstop=2.8)
    sh.keylight(14.0, (1, .85, .7))


def ch_h(ch): return ch.L + ch.TL


# ------------------------------------------------------------------ 3-8  Dry Gulch, the healthiest man in town
def s_gulch(sh):
    """'Dry Gulch, eighteen eighty.'  Drone glide in over the rooftops at morning, down to the main street banner."""
    stage(sh, 'day', 34, 120, veg=.6, grave=False)
    sh.camera(cam_keys([(0, (-24, -52, 36), (0, 10, 2), 22), (sh.dur, (-1.5, -6.5, 5.2), (0, 17.2, 4.6), 30)], roll=lambda t: K([(0, -6), (sh.dur, 0)], t), shake=.004), fstop=8)


def s_healthy(sh):
    """'Ezra was the healthiest man in town, and the most dramatic.'  Ezra struts down the street flexing, then throws the
    back of his hand to his forehead in a theatrical swoon."""
    stage(sh, 'day', 34, 120, veg=.6, grave=False)
    ez = toon(sh, 'EZRA', EZ)
    a = walk(sh, ez, (1.4, 1.0, 0), 180, '82_08', 1.0, face=[(0, 'smug'), (2.05, 'ohno')], speed=1.0)
    def mod(t, s):
        if t > 2.0:
            u = ease((t - 2.0) / .25); fwd = Vector((0, 1, 0))
            hd = head_of(ez, .05) + Vector((.05, -.25, .06))
            s['handR'] = tuple(Vector(s['handR']).lerp(hd, u)); s['lean'] = (s['lean'][0] - .12 * u, s['lean'][1]); s['head'] = [s['head'][0], -14 * u, 0]
        return s
    override(a, mod)
    def cam(t):
        y = 1.0 + 1.25 * min(t, 2.0) + .2 * max(0, t - 2.0)
        return (Vector((4.8, y - 1.6 - .3 * t, 1.55)), Vector((1.4, y + .2, 1.45)), K([(0, 30), (sh.dur, 38)], t), 0, Vector((1.4, y, 1.5)), .012)
    sh.camera(cam, fstop=2.8)


def s_cough(sh):
    """'A cough?'  Tight on Ezra: one tiny cough, eyes widen in horror."""
    stage(sh, 'day', 34, 120, veg=.5, grave=False)
    ez = toon(sh, 'EZRA', EZ)
    a = stand(sh, ez, (1.4, 4.0), 160, '77_02', 2.0, face=[(0, 'strain'), (.3, 'shock')], z=0)
    def mod(t, s):
        u = ease(t / .2) * (1 - ease((t - .3) / .2))
        s['handR'] = tuple(Vector(s['handR']).lerp(head_of(ez, -.12) + Vector((0, -.25, 0)), u * .9)); s['lean'] = (s['lean'][0] + .06 * u, 0)
        return s
    override(a, mod)
    cu(sh, ez, angle=18, elev=2, size=(.75, .6), lens=50, fstop=2.0)


def s_fun1(sh):
    """'Funeral.'  Smash to straight overhead: Ezra already lying in a pine coffin, hands folded, utterly content."""
    stage(sh, 'day', 34, 120, veg=.5, grave=False)
    c = U.Coffin('coffin', (-3.4, 20.6, 0), yaw=0, kind='pine'); c.open(1.0)
    ez = toon(sh, 'EZRA', EZ)
    lie_in(sh, ez, c, [(0, 'smug')])
    lily = U.flowers('lily', (-3.38, 21.45, .9), n=3, spread=.05)
    sh.camera(cam_keys([(0, (-3.4, 21.15, 3.6), (-3.4, 21.2, .4), 30), (sh.dur, (-3.4, 21.15, 3.3), (-3.4, 21.2, .4), 31)], roll=90, shake=.004), fstop=4)


def s_splinter(sh):
    """'A splinter?'  Insert: Ezra's raised fingertip with a tiny splinter, his horrified face soft behind it."""
    stage(sh, 'day', 34, 120, veg=.5, grave=False)
    ez = toon(sh, 'EZRA', EZ)
    a = stand(sh, ez, (1.4, 4.0), 160, '77_02', 3.0, face=[(0, 'terror')], z=0)
    tip = []
    def mod(t, s):
        hp = head_of(ez, -.05) + Vector((-.1, -.42, -.05)); s['handR'] = tuple(hp); tip[:] = [hp]; return s
    override(a, mod)
    spl = T.box('splinter', (.006, .006, .05), (0, 0, 0), T.plain('splinter', '#8a6a3a', .8))
    def u(t):
        if tip: spl.location = tip[0] + Vector((0, -.04, .03)); spl.rotation_euler = (0, math.radians(30), 0)
    sh.updates.append(u)
    def cam(t):
        hp = tip[0] if tip else Vector((1.3, 3.5, 1.4))
        return (hp + Vector((.25, -.55, .02)) + Vector((0, .06 * t, 0)), hp, 60, 0, hp, .004)
    sh.camera(cam, fstop=1.6); sh.keylight(16)


def s_fun2(sh):
    """'Funeral.'  Low angle: four pallbearers march the open coffin down the street towards camera, Ezra waving to the
    town from inside like a parade float."""
    stage(sh, 'day', 34, 120, veg=.6, grave=False)
    c = U.Coffin('coffin', (0, 0, 0), yaw=0, kind='pine'); c.open(1.0)
    ez = toon(sh, 'EZRA', EZ)
    v = 1.15; y0 = 14.0
    bearers = []
    for k, (dx, dy) in enumerate(((-.62, .35), (.62, .35), (-.62, 1.75), (.62, 1.75))):
        ch = toon(sh, f'P{k}', TO.crowd_preset(60 + k))
        a = walk(sh, ch, (dx, y0 + dy, 0), 0, '82_08', 1.0 + k * .3, face=[(0, 'bored')], speed=.9)
        def mod(t, s, dx=dx, dy=dy, a=a):
            cy = y0 - v * t; s['loc'] = (dx * 1.05, cy + dy, s['loc'][2]); s['yaw'] = 0
            s['handL' if dx > 0 else 'handR'] = (dx * .55, cy + dy, 1.42)
            return s
        override(a, mod); bearers.append(ch)
    def carry(t):
        c.root.location = (0, y0 - v * t - .05, 1.42 + .03 * math.sin(t * 7)); c.root.rotation_euler = (0, 0, 0)
    sh.updates.append(carry)
    def hands(t, feet, yaw, sc):
        w = math.sin(t * 8) * .12
        return {'handR': local_to_world(feet, yaw, sc, (.32 + w, -.15, ch_h(ez) + .55))}
    lie_in(sh, ez, c, [(0, 'happy')], hands='folded', hand_targets=hands)
    sh.keep_clear = [(0, y0 - v * k * .5, 0) for k in range(6)]
    sh.camera(cam_keys([(0, (1.0, 8.6, .55), (0, 14.2, 1.7), 24), (sh.dur, (1.1, 8.0, .6), (0, 12.2, 1.7), 26)], roll=-3, shake=.012), fstop=3.2)


# ------------------------------------------------------------------ 9-12  funerals one and two
def funeral_base(sh, kind='pine', length=2.15, lid=0.0, joe=True, n_mourn=4, mourn_face='sad'):
    c = grave_coffin(kind=kind, length=length); c.open(lid)
    people = mourners(sh, n_mourn, face=mourn_face) if n_mourn else []
    jo = None
    if joe:
        jo = toon(sh, 'JOE', JOE)
        stand(sh, jo, (-1.35, 94.0), 60, '77_02', 1.5, face=[(0, 'deadpan')], talk=[(0, sh.dur, .8)], look=lambda t: (0, 95.6, HZ + .8))
        bible = T.box('bible', (.16, .22, .05), (0, 0, 0), T.plain('bible', '#2a1a14', .6)); hold(sh, bible, jo, 'R', (0, -.05, .05), rot=(math.radians(60), 0, math.radians(60)))
    return c, people, jo


def s_small(sh):
    """'The first time, the coffin was too small.'  Slow pan along a short coffin, lid on, to Ezra's boots sticking out of
    the end; the priest reads on regardless."""
    stage(sh, 'day', 36, 200)
    c, people, jo = funeral_base(sh, length=1.5, lid=0.0)
    ez = toon(sh, 'EZRA', EZ)
    lie_in(sh, ez, c, [(0, 'grit')])
    feet = c.world((0, 1.5, .25))
    def cam(t):
        u = ease(t / sh.dur)
        tg = c.world((0, .2, .5)).lerp(c.world((0, 1.9, .3)), u)
        p = tg + Vector((1.9 - .5 * u, -.6 + .3 * u, .55 + .2 * u))
        return (p, tg, 32, 0, tg, .008)
    sh.camera(cam, fstop=2.4)


def s_kick(sh):
    """'He kicked the lid off in the middle of the eulogy.'  Wide: the priest reads, the lid blasts off end over end,
    mourners leap back, Ezra sits up furious."""
    stage(sh, 'day', 36, 200)
    c, people, jo = funeral_base(sh, length=1.5, lid=0.0, mourn_face='sad')
    ez = toon(sh, 'EZRA', EZ)
    TK = 1.15
    lid = c.lid
    def fly(t):
        if t < TK: c.open(0); return
        u = t - TK; lid.parent = None
        p0 = c.world((0, .75, .55)); lid.location = p0 + Vector((1.6 * u, 1.2 * u, 4.2 * u - 4.9 * u * u)); lid.rotation_euler = (u * 9, u * 5, u * 2)
    sh.updates.append(fly)
    lie_in(sh, ez, c, [(0, 'grit'), (TK, 'furious')], sit=lambda t: ease((t - TK - .1) / .45), hands=None)
    for a in sh.actors:
        if hasattr(a, 'face') and a.ch is not ez and a.ch.cid.startswith('M'): a.face = H.expr_track([(0, 'sad'), (TK + .08, 'terror')])
    jo_a = [a for a in sh.actors if getattr(a, 'ch', None) is jo][0]; jo_a.face = H.expr_track([(0, 'deadpan'), (TK + .05, 'scream')])
    sh.camera(cam_keys([(0, (3.4, 101.2, HZ + 1.55), (-.6, 95.3, HZ + .9), 28), (sh.dur, (3.0, 100.6, HZ + 1.5), (-.5, 95.6, HZ + 1.0), 30)],
                       roll=lambda t: 2.5 * math.sin(max(0, t - TK) * 30) * math.exp(-max(0, t - TK) * 5)), fstop=4)


def s_nocry(sh):
    """'The second time, nobody cried.'  Lateral dolly past three bored mourners: a yawn, a pocket watch, a sandwich."""
    stage(sh, 'day', 36, 200)
    c, people, jo = funeral_base(sh, lid=0.0, joe=False, n_mourn=3, mourn_face=['bored', 'deadpan', 'bored'])
    watch = T.cyl('pwatch', .04, .015, (0, 0, 0), T.plain('watchgold', '#d4b048', .3, 1.0), rot=(math.pi / 2, 0, 0), v=16); hold(sh, watch, people[1], 'R', (0, -.04, .06))
    def cam(t):
        u = ease(t / sh.dur); y = 93.6 + 2.6 * u
        return (Vector((-.9, y - .8, HZ + 1.35)), Vector((-3.1, y + .4, HZ + 1.3)), 32, 0, Vector((-3.0, y + .4, HZ + 1.3)), .006)
    sh.camera(cam, fstop=2.2)


def s_names(sh):
    """'Ezra sat up and asked for names.'  Ezra rises from the coffin with a notebook, jabbing his pencil at each mourner;
    over-the-shoulder push-in from behind the mourners."""
    stage(sh, 'day', 36, 200)
    c, people, jo = funeral_base(sh, lid=1.0, joe=False, n_mourn=3, mourn_face=['bored', 'deadpan', 'bored'])
    ez = toon(sh, 'EZRA', EZ)
    for a in sh.actors:
        if getattr(a, 'ch', None) in people: a.face = H.expr_track([(0, 'bored'), (.55, 'fear')])
    def hands(t, feet, yaw, sc):
        if t < .7: return {}
        jab = math.sin((t - .7) * 7) * .1
        return {'handL': local_to_world(feet, yaw, sc, (-.15, -.45, ch_h(ez) + .1)), 'handR': local_to_world(feet, yaw, sc, (.45 + jab, -.35, ch_h(ez) + .3))}
    lie_in(sh, ez, c, [(0, 'suspicious'), (1.2, 'angry')], sit=lambda t: ease((t - .05) / .55), hands=None, hand_targets=hands)
    book = T.box('notebook', (.16, .22, .02), (0, 0, 0), T.plain('nb', '#d8ccb0', .8)); hold(sh, book, ez, 'L', (0, -.05, .05), rot=(math.radians(50), 0, math.radians(200)))
    sh.camera(cam_keys([(0, (-4.3, 93.2, HZ + 1.75), (0, 96.2, HZ + 1.2), 30), (sh.dur, (-3.4, 94.1, HZ + 1.6), (0, 96.0, HZ + 1.25), 40)], shake=.009), fstop=2.4)


# ------------------------------------------------------------------ 13-15  the bill, the complaint
def s_double(sh):
    """'The third time, the undertaker charged him double.'  Shop interior: over Ezra's shoulder the undertaker brings the
    DOUBLE stamp down on the invoice; push and rack to the paper."""
    out = stage(sh, 'day', 30, 110, veg=.3, grave=False, shop=True)
    o = SHOP; ctr = out['counter']
    mort = toon(sh, 'MORT', MORT); ez = toon(sh, 'EZRA', EZ)
    bill = U.paper('bill', 'bill', ctr + Vector((.15, 0, .012)), rot=(0, 0, math.pi), w=.3, h=.4); bill.rotation_euler = (0, 0, math.pi)
    a = stand(sh, mort, (ctr.x + .2, ctr.y + .8), 180, '77_02', 1.0, face=[(0, 'deadpan'), (1.3, 'smug')], z=0)
    stamp = T.cyl('stamp', .05, .1, (0, 0, 0), T.plain('stamp', '#4a2a1a', .6), v=12)
    def mod(t, s):
        k = 0.0
        for tt in (1.15, 1.75): k = max(k, math.exp(-((t - tt) / .09) ** 2))
        up = ctr + Vector((.15, 0, .55 - .44 * k)); s['handR'] = tuple(up); return s
    override(a, mod); hold(sh, stamp, mort, 'R', (0, 0, -.06))
    b = stand(sh, ez, (ctr.x - .15, ctr.y - 1.05), 0, '79_74', 2.0, face=[(0, 'confused'), (1.2, 'shock'), (1.8, 'furious')], z=0)
    sh.camera(cam_keys([(0, (ctr.x - .9, ctr.y - 2.6, 1.95), (ctr.x + .2, ctr.y + .6, 1.55), 30), (1.9, (ctr.x - .45, ctr.y - 1.9, 1.75), (ctr.x + .15, ctr.y + .1, 1.2), 34),
                        (sh.dur, (ctr.x - .05, ctr.y - .85, 1.55), (ctr.x + .15, ctr.y, 1.08), 40)], shake=.006), fstop=2.2)


def s_complaint(sh):
    """'Ezra filed a complaint.'  Lantern-lit insert: pencil scratching TERRIBLE onto the complaint form."""
    stage(sh, 'sunset', 3, 300)
    c = grave_coffin(at=Vector((0, 94.95, HZ - U.PIT[3] + .05)), planks=False); c.open(1.0)
    ez = toon(sh, 'EZRA', EZ)
    form_p = c.world((0, 1.05, .78))
    form = U.paper('form', 'complaint', form_p, rot=(0, 0, 0), w=.34, h=.45); form.rotation_euler = (0, 0, math.pi)
    pencil = T.cyl('pencil', .008, .16, (0, 0, 0), T.plain('pencil', '#d8a830', .6), v=6)
    def hands(t, feet, yaw, sc):
        wx = math.sin(t * 22) * .03 + (t % .6) * .12 - .04
        return {'handR': tuple(form_p + Vector((wx, .05, .05))), 'handL': tuple(form_p + Vector((-.2, -.12, .02)))}
    lie_in(sh, ez, c, [(0, 'determined')], sit=lambda t: 1.0, hands=None, hand_targets=hands)
    hold(sh, pencil, ez, 'R', (0, 0, .04), rot=(0, math.radians(30), math.radians(20)))
    T.lantern('glamp', tuple(c.world((.3, .7, .55))), energy=60)
    sh.camera(cam_keys([(0, form_p + Vector((.08, -.1, .5)), form_p, 40), (sh.dur, form_p + Vector((.04, -.06, .38)), form_p, 44)], roll=90, shake=.003), fstop=2.8)


def s_inside(sh):
    """'From inside the grave.'  Crane straight up out of the pit: Ezra sitting in the coffin at the bottom of the grave by
    lantern light, writing; the undertaker at the rim holding out his hand for the form."""
    stage(sh, 'sunset', 3, 300)
    c = grave_coffin(at=Vector((0, 94.95, HZ - U.PIT[3] + .05)), planks=False); c.open(1.0)
    ez = toon(sh, 'EZRA', EZ); mort = toon(sh, 'MORT', MORT)
    form = U.paper('form', 'complaint', (0, 0, 0), w=.34, h=.45)
    def hands(t, feet, yaw, sc):
        u = ease((t - 1.2) / .8)
        return {'handR': local_to_world(feet, yaw, sc, (.15, -.5 - .2 * u, ch_h(ez) + .1 + .5 * u))}
    lie_in(sh, ez, c, [(0, 'determined'), (1.4, 'smug')], sit=lambda t: 1.0, hands=None, hand_targets=hands)
    hold(sh, form, ez, 'R', (0, 0, .2), rot=(math.radians(80), 0, math.radians(180)))
    a = stand(sh, mort, (.1, 98.0), 0, '77_02', 4.0, face=[(0, 'deadpan')], look=lambda t: (0, 96, .9))
    override(a, lambda t, s: (s.__setitem__('handR', tuple(Vector((.05, 97.45, HZ + .35)))) or s))
    T.lantern('glamp', tuple(c.world((.3, .7, .55))), energy=70)
    sh.camera(cam_keys([(0, (.15, 95.7, 1.25), (0, 96.4, .6), 24), (sh.dur, (2.2, 92.2, HZ + 3.2), (0, 96.6, .9), 26)], roll=lambda t: K([(0, 90), (sh.dur * .6, 0)], t), shake=.004), fstop=4)


# ------------------------------------------------------------------ 16-17  the fourth funeral
def s_empty(sh):
    """'By the fourth funeral, the town stopped coming.'  Three empty benches, a tumbleweed bounces through, the undertaker
    alone holding his hat; slow creep in."""
    stage(sh, 'day', 30, 220)
    c = grave_coffin(); c.open(0)
    for k in range(3): U.bench(f'bench{k}', (-3.8 - k * 1.4, 95.9, HZ), yaw=90, length=3.2)
    mort = toon(sh, 'MORT', MORT)
    stand(sh, mort, (1.45, 94.1), -60, '40_10', 3.0, face=[(0, 'bored')])
    tw = PR.tumbleweed('tw', (-9, 96.9, HZ + .35))
    if tw:
        def roll(t):
            x = -9 + 4.2 * t; tw.location = (x, 96.9 - .3 * t, HZ + .35 + abs(math.sin(t * 5)) * .35); tw.rotation_euler = (0, t * 6, 0)
        sh.updates.append(roll)
    sh.camera(cam_keys([(0, (4.6, 103.0, HZ + 1.4), (-3.2, 95.2, HZ + .7), 26), (sh.dur, (3.8, 102.0, HZ + 1.35), (-3.0, 95.4, HZ + .75), 28)], shake=.006), fstop=5)


def s_card(sh):
    """'Even the priest just mailed a card.'  Rack from the undertaker's flat face to the card propped on the coffin lid:
    SORRY FOR YOUR LOSS (AGAIN)."""
    stage(sh, 'day', 30, 220)
    c = grave_coffin(); c.open(0)
    mort = toon(sh, 'MORT', MORT)
    stand(sh, mort, (1.2, 97.6), -120, '77_02', 2.0, face=[(0, 'deadpan'), (2.2, 'bored')], look=lambda t: (0, 95.6, HZ + .7))
    cp = c.world((0, .65, .62))
    card = U.paper('card', 'card', cp + Vector((0, 0, .12)), rot=(math.radians(78), 0, math.radians(200)), w=.3, h=.225)
    env = T.box('envelope', (.32, .22, .01), cp + Vector((.25, .1, -.04)), T.plain('envelope', '#e8dcc0', .8), rot=(0, 0, .4))
    fp = card.location.copy()
    def cam(t):
        u = ease((t - .6) / 1.4)
        tg = head_of(mort).lerp(fp, u)
        p = fp + Vector((.25, -1.0, .2)).lerp(Vector((.12, -.55, .08)), ease(t / sh.dur))
        return (p, fp + Vector((0, 0, -.02)), 50, 0, tg, .004)
    sh.camera(cam, fstop=1.8); sh.keylight(14)


# ------------------------------------------------------------------ 18-22  the decision, the perfect funeral
def s_decision(sh):
    """'So the undertaker made a decision.'  Night, lantern-lit shop: low push-in on the undertaker; he slams his palm on
    the ledger."""
    out = stage(sh, 'night', 30, 110, veg=.3, grave=False, shop=True)
    ctr = out['counter']
    for n in ('s_window_l',):
        if n in bpy.data.objects: bpy.data.objects[n].data.energy = 120; bpy.data.objects[n].data.color = (.5, .6, 1.0)
    mort = toon(sh, 'MORT', MORT)
    a = stand(sh, mort, (ctr.x + .1, ctr.y + .75), 180, '77_02', 2.0, face=[(0, 'suspicious'), (.9, 'determined')], z=0)
    def mod(t, s):
        k = ease((t - .75) / .12)
        s['handR'] = tuple((ctr + Vector((.25, .05, .6))).lerp(ctr + Vector((.2, .05, .06)), k)) if t > .4 else s['handR']; return s
    override(a, mod)
    def cam(t):
        h = head_of(mort); d = Vector((-.35, -1.0, -.25)).normalized()
        dist = K([(0, 2.6), (sh.dur, 1.55)], t)
        return (h + d * dist, h + Vector((0, 0, -.05)), 35, K([(0, 0), (sh.dur, -6)], t), h, .006 + .02 * math.exp(-max(0, t - .87) * 12) * (t > .87))
    sh.camera(cam, fstop=2.0); sh.keylight(6, (1, .7, .45))


def perfect_set(sh, with_people=True, crowd=0):
    """the velvet funeral on Boot Hill: draped stand, wreaths, flowers, candles, band, paid mourners"""
    c = grave_coffin(kind='velvet', name='vcoffin'); c.open(1.0)
    drape = T.plain('drape', '#3a1430', .9); drape.node_tree.nodes['Principled BSDF'].inputs['Sheen Weight'].default_value = 1.0
    T.box('drape', (1.5, 2.6, .05), (0, 95.95, HZ + .07), drape)
    for k, (x, y) in enumerate(((-1.25, 94.2), (1.25, 94.2), (-1.25, 97.8), (1.25, 97.8))):
        T.cyl(f'wstand{k}', .02, 1.2, (x, y, HZ + .6), T.plain('wstand', '#2a2a2a', .5, .8), v=6); U.wreath(f'wreath{k}', (x, y - .02, HZ + 1.25))
    for k in range(6): U.flowers(f'fl{k}', (-1.0 + k * .4, 93.6, HZ), n=6, spread=.18)
    for k, (x, y) in enumerate(((-.9, 93.9), (.9, 93.9), (-.9, 98.1), (.9, 98.1))):
        T.cyl(f'candle{k}', .035, .5, (x, y, HZ + .25), T.plain('wax', '#f0e8d8', .5), v=10)
        l = bpy.data.lights.new(f'cflame{k}', 'POINT'); l.energy = 6; l.color = (1, .7, .35); lo = bpy.data.objects.new(f'cflame{k}', l); lo.location = (x, y, HZ + .56); bpy.context.scene.collection.objects.link(lo)
    ez = toon(sh, 'EZRA', EZ)
    band = []
    if with_people:
        for k, kind in enumerate(('tuba', 'trumpet', 'drum')):
            ch = toon(sh, f'B{k}', bandsman(k)); x, y = 3.3 + (k % 2) * .5, 96.2 + k * 1.15
            a = stand(sh, ch, (x, y), -90, '77_02', 1.0 + k, face=[(0, 'happy')])
            ins = U.instrument(f'ins{k}', kind); band.append((ch, a, ins, kind))
    return c, ez, band


def play_band(sh, band, t_on=0.0, t_off=99.0):
    for ch, a, ins, kind in band:
        def mod(t, s, ch=ch, kind=kind):
            on = t_on <= t <= t_off; bob = math.sin(t * 2 * math.pi * 1.4) * (.04 if on else 0)
            hc = head_of(ch, -.18)
            fw = Vector((-1, 0, 0))
            if kind == 'trumpet': tg = hc + fw * .32 + Vector((0, 0, .02 + bob * .3))
            elif kind == 'tuba': tg = hc + fw * .25 + Vector((0, 0, -.35))
            else: tg = hc + fw * .35 + Vector((0, 0, -.55 + (abs(math.sin(t * 9)) * .12 if on else 0)))
            s['handR'] = tuple(tg); s['handL'] = tuple(tg + Vector((0, .12, -.06))); s['crouch'] = s['crouch'] + max(0, bob) * .5
            return s
        override(a, mod)
        def u(t, ch=ch, ins=ins, kind=kind):
            p = bone_pos(ch, 'RightHand')
            if kind == 'trumpet': ins.location = p + Vector((-.05, 0, 0)); ins.rotation_euler = (0, 0, math.radians(-90))
            elif kind == 'tuba': ins.location = head_of(ch, -.55) + Vector((-.25, 0, 0)); ins.rotation_euler = (0, 0, math.radians(90))
            else: ins.location = head_of(ch, -.85) + Vector((-.32, 0, 0)); ins.rotation_euler = (0, 0, 0)
        sh.updates.append(u)


def s_perfect(sh):
    """'One perfect funeral.'  Crane down over wreaths and candles onto the velvet funeral at golden hour."""
    stage(sh, 'sunset', 12, 245)
    c, ez, band = perfect_set(sh)
    lie_in(sh, ez, c, [(0, 'relief')])
    mourners(sh, 4, seed=3, face='sad')
    play_band(sh, band)
    sh.camera(cam_keys([(0, (4.5, 103.5, HZ + 6.5), (0, 96, HZ + .5), 22), (sh.dur, (3.2, 101.8, HZ + 2.6), (0, 95.9, HZ + .8), 26)], roll=lambda t: K([(0, 4), (sh.dur, 0)], t), shake=.005), fstop=5)


def s_velvet(sh):
    """'A velvet coffin.'  Low dolly along the glossy coffin side and gold handles, purple velvet glowing."""
    stage(sh, 'sunset', 12, 245)
    c, ez, band = perfect_set(sh, with_people=False)
    lie_in(sh, ez, c, [(0, 'relief')])
    def cam(t):
        u = ease(t / sh.dur); tg = c.world((0, 1.9 - 1.4 * u, .45)); p = tg + Vector((.95, .25, .12 + .1 * u))
        return (p, tg, 30, 0, tg, .004)
    sh.camera(cam, fstop=2.2)


def s_band(sh):
    """'A brass band.'  Low angle on the three-piece band in full swing."""
    stage(sh, 'sunset', 12, 245)
    c, ez, band = perfect_set(sh)
    lie_in(sh, ez, c, [(0, 'relief')])
    play_band(sh, band)
    sh.camera(cam_keys([(0, (1.6, 95.4, HZ + .7), (3.6, 97.4, HZ + 1.3), 26), (sh.dur, (1.75, 95.1, HZ + .75), (3.7, 97.3, HZ + 1.4), 28)], roll=-4, shake=.008), fstop=3)


def s_tears(sh):
    """'Real tears. He paid for those.'  The undertaker presses a coin into each widow's glove - they instantly burst into
    tears."""
    stage(sh, 'sunset', 12, 245)
    c, ez, band = perfect_set(sh)
    lie_in(sh, ez, c, [(0, 'relief')])
    mort = toon(sh, 'MORT', MORT)
    ws = [toon(sh, f'W{k}', widow(k)) for k in range(2)]
    pos = [(-2.0, 93.7), (-2.0, 95.0)]
    TT = [.75, 1.45]
    for k, (w, p) in enumerate(zip(ws, pos)):
        a = stand(sh, w, p, 90, '77_02', 1.0 + k, face=[(0, 'deadpan'), (TT[k] + .1, 'sad')])
        def mod(t, s, k=k, w=w):
            if t > TT[k] + .1:
                hc = head_of(w, -.1); s['handR'] = tuple(hc + Vector((.22, 0, 0))); s['lean'] = (s['lean'][0] + .05 * math.sin(t * 14), 0)
            return s
        override(a, mod)
    m = stand(sh, mort, (-.8, 94.3), -90, '77_02', 2.5, face=[(0, 'deadpan')], look=lambda t: pos[0] if t < 1.1 else pos[1])
    def mmod(t, s):
        tg = pos[0] if t < 1.1 else pos[1]; u = math.sin(min(1, ((t - .3) % .7) / .7) * math.pi)
        s['handR'] = tuple(Vector((tg[0] + .6, tg[1], HZ + 1.1)).lerp(Vector((tg[0] + .3, tg[1], HZ + 1.05)), u)); return s
    override(m, mmod)
    coin = T.cyl('coin', .03, .006, (0, 0, 0), T.plain('coin', '#d8b448', .3, 1.0), rot=(math.pi / 2, 0, 0), v=14); hold(sh, coin, mort, 'R', (0, 0, .02))
    # tear streams
    tearm = T.plain('tear', '#9ad0ff', .05, transmit=.6)
    drops = []
    for k, w in enumerate(ws):
        for j in range(6): drops.append((w, k, j, T.lib.sphere(f'tear{k}{j}', .018, (0, 0, -50), tearm)))
    def tears(t):
        for w, k, j, d in drops:
            if t < TT[k] + .12: d.location = (0, 0, -50); continue
            ph = ((t - TT[k]) * 2.2 + j / 6) % 1.0; side = -1 if j % 2 else 1
            d.location = head_of(w, .02) + Vector((.2 + ph * .05, side * .12, -ph * .5))
    sh.updates.append(tears)
    sh.camera(cam_keys([(0, (.8, 92.1, HZ + 1.55), (-1.7, 94.4, HZ + 1.4), 30), (sh.dur, (.55, 92.6, HZ + 1.5), (-1.8, 94.6, HZ + 1.4), 33)], shake=.008), fstop=2.6)


# ------------------------------------------------------------------ 23-26  happy, stopped, the band played, the undertaker wept
def s_happy(sh):
    """'Ezra lay there, listening, and for the first time in his life, he was happy.'  Slow overhead push on Ezra in the
    velvet: eyes closed, the smile growing with the music, golden light and drifting petals."""
    stage(sh, 'sunset', 9, 245)
    c, ez, band = perfect_set(sh)
    lie_in(sh, ez, c, [(0, 'relief'), (2.6, 'smile'), (4.6, 'happy')])
    play_band(sh, band)
    petals(sh, c)
    h = lambda: head_of(ez)
    def cam(t):
        hp = h(); u = ease(t / sh.dur)
        return (hp + Vector((.55 - .25 * u, -.15, 1.5 - .7 * u)), hp, 40, 90, hp, .004)
    sh.camera(cam, fstop=2.0); sh.keylight(10, (1, .85, .65))


def petals(sh, c, n=14, t_land=None):
    pm = T.plain('petal', '#c8406a', .6)
    ps = []
    for k in range(n):
        o = T.box(f'petal{k}', (.04, .03, .004), (0, 0, -60), pm); ps.append(o)
    rng = random.Random(4)
    seeds = [(rng.uniform(-.5, .5), rng.uniform(.0, 2.1), rng.uniform(0, 4)) for _ in ps]
    def fall(t):
        for o, (x, y, ph) in zip(ps, seeds):
            z = 2.6 - ((t * .35 + ph) % 2.6)
            o.location = c.world((x + .1 * math.sin(t * 2 + ph), y, .45 + z)); o.rotation_euler = (t * 3 + ph, t * 2, ph)
    sh.updates.append(fall)


def s_stopped(sh):
    """'So happy, his heart simply stopped.'  Extreme close on the smile.  The music cuts; a single petal settles on his nose;
    he does not blink again."""
    stage(sh, 'sunset', 9, 245)
    c, ez, band = perfect_set(sh)
    TS = 1.7
    p = lie_in(sh, ez, c, [(0, 'happy')])
    ez_blink = ez
    petal = T.box('lastpetal', (.05, .035, .004), (0, 0, -60), T.plain('petal', '#c8406a', .6))
    def land(t):
        hp = head_of(ez, .05); u = ease((t - 1.9) / 1.4)
        petal.location = (hp + Vector((-.2, 0, .6))).lerp(hp + Vector((0, -.32, .08)), u); petal.rotation_euler = (0, u * .5, math.sin(t * 3) * (1 - u))
    sh.updates.append(land)
    def cam(t):
        hp = head_of(ez); d = K([(0, 1.0), (TS, .72), (sh.dur, .68)], t)
        return (hp + Vector((.18, -.12, d)), hp + Vector((0, -.05, 0)), 50, 90, hp, .002 if t < TS else .0005)
    sh.camera(cam, fstop=1.8); sh.keylight(10, (1, .85, .65))


def s_played(sh):
    """'The band played.'  From behind the band: the coffin and mourners beyond, horns up."""
    stage(sh, 'sunset', 9, 245)
    c, ez, band = perfect_set(sh)
    lie_in(sh, ez, c, [(0, 'happy')])
    mourners(sh, 4, seed=5, face='sad')
    play_band(sh, band)
    sh.camera(cam_keys([(0, (6.2, 98.6, HZ + 1.6), (-.5, 95.9, HZ + 1.0), 28), (sh.dur, (5.6, 98.3, HZ + 1.55), (-.6, 95.8, HZ + 1.0), 30)], shake=.008), fstop=3.2)


def s_wept(sh):
    """'The undertaker wept.'  Close: the undertaker dabbing his eyes with a white handkerchief."""
    stage(sh, 'sunset', 9, 245)
    c, ez, band = perfect_set(sh, with_people=False)
    lie_in(sh, ez, c, [(0, 'happy')])
    mort = toon(sh, 'MORT', MORT)
    a = stand(sh, mort, (-.95, 93.7), 40, '77_02', 3.0, face=[(0, 'sad')], look=lambda t: (0, 96, HZ + .5))
    def mod(t, s):
        hc = head_of(mort, -.02); s['handR'] = tuple(hc + Vector((.12, -.28, -.02 + .03 * math.sin(t * 10)))); return s
    override(a, mod)
    hk = T.box('hanky', (.16, .02, .16), (0, 0, 0), T.plain('hanky', '#f4f0e8', .8)); hold(sh, hk, mort, 'R', (0, -.03, .02), rot=(.3, 0, .4))
    cu(sh, mort, angle=25, elev=3, size=(.8, .62), lens=55, fstop=2.0)


# ------------------------------------------------------------------ 27-30  the whole town, laughter, he didn't, three days
def town_crowd(sh, n=22, face='laugh', clips=('79_70', '80_44', '79_70', '77_02', '80_48'), arriving=False):
    out = []; rng = random.Random(9)
    for k in range(n):
        ring = 4.2 + (k % 3) * 1.25; a = math.radians(-160 + k * (320 / n) + rng.uniform(-5, 5))
        x, y = math.cos(a) * ring * 1.15, 96 + math.sin(a) * ring
        if -1.8 < x < 1.8 and y > 96: x += 3.5 * (1 if x >= 0 else -1)
        ch = toon(sh, f'C{k}', TO.crowd_preset(400 + k) if k % 4 else widow(k))
        yaw = math.degrees(math.atan2(x, -(y - 96))) + 180
        if arriving and k % 2 == 0:
            walk(sh, ch, (x, y - 7, U.ground_z(x, y - 7) + 0), 180, '82_09' if k % 3 else '82_11', 1.0 + k * .2, face=[(0, face if isinstance(face, str) else face[k % len(face)])])
        else:
            stand(sh, ch, (x, y), yaw, clips[k % len(clips)], .8 + (k * .37) % 2.2, face=[(0, face if isinstance(face, str) else face[k % len(face)])], look=lambda t: (0, 96, HZ + .6))
        out.append(ch)
    return out


def s_town(sh):
    """'And the whole town finally showed up.'  Crane up and back from the coffin: the hill fills with townsfolk streaming
    through the gate, Dry Gulch behind them."""
    stage(sh, 'sunset', 9, 245)
    c, ez, band = perfect_set(sh)
    c.open(0.0)
    play_band(sh, band)
    town_crowd(sh, 22, face=['watch', 'chat', 'idle'], arriving=True)
    sh.camera(cam_keys([(0, (1.4, 99.0, HZ + 1.8), (0, 95.5, HZ + 1.0), 26), (sh.dur, (5.5, 105.5, HZ + 7.2), (0, 92.0, HZ + .6), 22)], roll=lambda t: K([(0, 0), (sh.dur, 3)], t), shake=.006), fstop=6)


def s_laugh(sh):
    """'To laugh. Because everyone knew Ezra would climb out any second.'  Track across the laughing, pointing crowd to the
    closed coffin, the laughter settling into expectant grins."""
    stage(sh, 'sunset', 9, 245)
    c, ez, band = perfect_set(sh)
    c.open(0.0)
    crowd = town_crowd(sh, 22, face='laugh')
    for a in sh.actors:
        if getattr(a, 'ch', None) in crowd: a.face = H.expr_track([(0, 'laugh'), (3.6, 'grin')])
    def cam(t):
        u = ease(t / sh.dur); ang = math.radians(200 - 120 * u); r = 6.6 - 2.0 * u
        p = Vector((math.cos(ang) * r, 96 + math.sin(ang) * r, HZ + 1.6 - .3 * u))
        tg = Vector((math.cos(ang) * 4.5, 96 + math.sin(ang) * 4.5, HZ + 1.3)).lerp(Vector((0, 96, HZ + .55)), ease((t - 2.6) / 1.8))
        return (p, tg, 30, 0, tg, .008)
    sh.camera(cam, fstop=3.2)


def s_didnt(sh):
    """'He didn't.'  Silence.  Slow push on the closed velvet coffin; the crowd behind, soft, waiting."""
    stage(sh, 'sunset', 7, 245)
    c, ez, band = perfect_set(sh)
    c.open(0.0)
    town_crowd(sh, 22, face=['watch', 'confused', 'watch', 'bored'], clips=('77_02', '40_10'))
    tg = c.world((0, .9, .5))
    sh.camera(cam_keys([(0, tg + Vector((1.9, -2.2, .7)), tg, 30), (sh.dur, tg + Vector((1.15, -1.35, .45)), tg, 34)], shake=.003), fstop=2.0)


def s_days(sh):
    """'And nobody noticed for three days.'  Locked-off wide of Boot Hill: three days and nights race past, the crowd gone,
    the flowers wilting, the velvet coffin still sitting there."""
    stage(sh, 'day', 30, 160)
    c, ez, band = perfect_set(sh, with_people=False)
    c.open(0.0)
    sun = next((o for o in bpy.data.objects if o.type == 'LIGHT' and o.data.type == 'SUN'), None)
    e0 = sun.data.energy if sun else 3
    bgs = [n for n in bpy.context.scene.world.node_tree.nodes if n.type == 'BACKGROUND'] if bpy.context.scene.world and bpy.context.scene.world.use_nodes else []
    b0 = [n.inputs['Strength'].default_value for n in bgs]
    D = 2.9 / 3
    def cyc(t):
        ph = (t / D) % 1.0; day = max(0.0, math.sin(ph * math.tau)); amt = .08 + .92 * day
        if t > 2.9: amt = .35 + .3 * (1 - (t - 2.9) / .5)
        if sun: sun.data.energy = e0 * amt; sun.rotation_euler = (math.radians(30), 0, math.radians(90 + 360 * ph))
        for n, b in zip(bgs, b0): n.inputs['Strength'].default_value = b * (.12 + .88 * amt)
    sh.updates.append(cyc)
    sh.camera(cam_keys([(0, (7.2, 106.5, HZ + 3.4), (0, 95.8, HZ + .7), 26), (sh.dur, (6.9, 106.0, HZ + 3.3), (0, 95.8, HZ + .7), 26)], shake=.0), fstop=6)
    sh.no_extras = True


SHOTS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('s_') and callable(v)}

if __name__ == '__main__':
    F.main(SHOTS)
