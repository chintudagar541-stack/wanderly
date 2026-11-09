"""THE SHIP THAT USED OIL AGAINST A STORM - 26 shots timed to the voiceover. Global time T = shot.t0 + local time (waves, ships, oil are global)."""
import bpy, math, os, numpy as np
from mathutils import Vector, Matrix, Euler
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import lib
from lib import lin, mat, coll, sphere, cyl, box, torus, lathe, smooth_tube
from common_p import *
import common_p
import sea as seamod, ship as shipmod, world as W, inkchar as H

FPS = 24
CYC = lambda: None

# ---------------------------------------------------------------- global story state (pure functions of T)
HDG = K([(0, 270), (24.0, 270), (30.5, 205), (34.0, 180), (80, 180)])
def _integrate(speed=3.2, T1=80.0, dt=.05):
    ts = np.arange(0, T1, dt); p = np.zeros((len(ts), 2)); x = y = 0.0
    for i, t in enumerate(ts):
        h = math.radians(HDG(t)); x += -math.sin(h) * speed * dt; y += math.cos(h) * speed * dt; p[i] = (x, y)
    return ts, p
_TS, _P = _integrate()
def ship_xy(T): i = int(max(0, min(len(_TS) - 1, T / .05))); return _P[i]
def pirate_xy(T):
    x, y = ship_xy(T); return (x - 130 + 3.0 * T * .55 + 30 * math.sin(T * .1) , y + 55 - 1.3 * T)
OIL_T0 = 7.4; OIL_POINT = None
def oil_state(T):
    """world-fixed oil slick: centre at the first pour point (port side of the ship at OIL_T0), spreading radius"""
    if OIL_POINT is None or T < OIL_T0 + .4: return None
    r = .5 + 14.0 * (1 - math.exp(-(T - OIL_T0) / 14.0)) + 4.0 * max(0, (T - 33.0)) * .5
    return (OIL_POINT[0], OIL_POINT[1], r)

class Ctx: pass
C = Ctx()

def master_frame(scene, *a):
    t = (scene.frame_current - 1) / scene.render.fps; T = C.t0 + t; common_p.T0[0] = T
    for p in C.patches: p.update(T)
    for p in C.extra_patches: p.update(T)
    if C.ship:
        x, y = C.shipfn(T); C.heave = C.ship.pose(C.waves, x, y, HDG(T), T, boost=C.boost)
        C.ship.flutter(T, wind=C.wind, amp=C.sailamp); C.ship.flag_update(T)
    if C.pirate:
        x, y = pirate_xy(T); C.pirate.pose(C.waves, x, y, 260 + 6 * math.sin(T * .3), T)
        C.pirate.flutter(T, wind=.8, amp=.7, seed=2.0)
    for h in H.HUMANS: h.apply(T)
    for f in C.hooks: f(T, t)
    if C.rain: C.rain.update(T, C.cam.location, wind=C.rainwind)
    if C.camfn:
        loc, look, lens, foc, roll = C.camfn(t)
        c = C.cam; c.location = loc; e = (Vector(look) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        c.rotation_euler = e
        if roll: c.rotation_euler = (Matrix.Rotation(math.radians(roll), 3, (Vector(look) - Vector(loc)).normalized()) @ e.to_matrix()).to_euler()
        c.data.lens = lens; c.data.dof.focus_distance = max(.15, (Vector(foc) - Vector(loc)).length)

def ship_matrix():
    return Matrix.LocRotScale(C.ship.root.location, Euler(C.ship.root.rotation_euler, 'XYZ'), Vector((C.ship.scale,) * 3))
def SL(p, T=None):
    """ship-local point -> world, evaluated for the current frame's pose"""
    return ship_matrix() @ Vector(p)

def make_cam(fstop=4.0):
    cd = bpy.data.cameras.new('Cam'); cd.sensor_width = 36; cd.sensor_fit = 'AUTO'; cd.clip_end = 6000; cd.clip_start = .05
    o = bpy.data.objects.new('Cam', cd); bpy.context.scene.collection.objects.link(o); bpy.context.scene.camera = o
    cd.dof.use_dof = fstop < 20; cd.dof.aperture_fstop = fstop; C.cam = o; return o

def begin(n, t0, mood='storm', storm=1.0, waves=True, ship=True, pirate=False, near=(160, 320), far=True, rain=True, wind=1.0, sailamp=1.0, boost=1.15, heave_extra=0.0,
          sun=(.35, .9, .35), sun_e=3.0, haze=900.0, sea_rough=.12, tide=None, seed=0.0):
    sc = bpy.context.scene; sc.render.fps = FPS; sc.frame_start = 1; sc.frame_end = n
    C.t0 = t0; C.patches = []; C.extra_patches = []; C.hooks = []; C.ship = None; C.pirate = None; C.camfn = None; C.rain = None; C.rainwind = (6, 3)
    C.wind = wind; C.sailamp = sailamp; C.boost = boost; C.waves = seamod.Waves(storm=storm, wind=0.0)
    C.waves.oil = oil_state
    C.shipfn = ship_xy; C.heave = (0, 0, 0)
    foglines = (haze, '#7e8a96' if mood == 'storm' else '#e6b878')
    W.sky(mood, 1.0 if mood == 'storm' else 1.4, sun_dir=sun, sun_energy=sun_e, sun_col='#e8efff' if mood == 'storm' else '#ffd28a', seed=seed)
    sm = W.sea_mat('sea', rough=sea_rough, col='#12404a' if mood == 'storm' else '#2a5a58', foam_col='#e6eef0')
    C.sea_mat = sm
    if waves:
        cx, cy = ship_xy(t0 + .5 * n / FPS)
        C.near_c = (cx, cy)
        C.patches.append(seamod.Patch(C.waves, cx, cy, near[0], near[1], 'sea_near', sm))
        if far: C.patches.append(seamod.Patch(C.waves, cx, cy, 5000, 160, 'sea_far', sm, kmin=.1, hole=(cx, cy, near[0] / 2 - .5)))
    if ship:
        C.ship = shipmod.Ship('hero', hull='#5b3b22', hull2='#34210f', sail='#d8ccb0', trim='#c9a23a', flag=None, detail=1.0)
    if pirate:
        C.pirate = shipmod.Ship('pirate', hull='#251a14', hull2='#120c08', sail='#17161a', flag='#0a0a0a', detail=.7, scale=1.0, pirate=True)
    if rain: C.rain = W.Rain(); 
    H.HUMANS.clear()
    bpy.app.handlers.frame_change_pre[:] = [f for f in bpy.app.handlers.frame_change_pre if getattr(f, '__name__', '') not in ('master_frame', 'on_frame')] + [master_frame]
    C.fog = foglines
    return sm

def finish_materials():
    for m in list(bpy.data.materials):
        if m.name.startswith(('rainm', 'bulb', 'lant', 'cabwin', 'inkclear')): continue
        W.add_fog(m, C.fog[0], C.fog[1])

# ---------------------------------------------------------------- actors
SAILOR_SPOT = Vector((3.55, 2.6, shipmod.DECK))
def sailor():
    h = H.Human('CHAR_001', 'Sailor', skin='#b98a64', shirt='#d9d2c2', vest='#4b3a2a', trousers='#2f3a44', boots='#2a1c14', hair='#2a1a10', bandana='#a82a24', beard='#2a1a10', height=1.0, build=1.05, eye='#5a4a3a')
    h.root.parent = C.ship.root; return h
def captain():
    h = H.Human('CHAR_002', 'Captain', skin='#d3a784', shirt='#efe9dc', coat='#1b2a4a', trousers='#1b1b22', boots='#15100c', hair='#8a8a8a', beard='#9a9a9a', hat='tricorn', height=1.04, build=1.1, eye='#3a5a7a')
    h.root.parent = C.ship.root; return h
def crew(cid, name, shirt, bandana=None, build=1.0, skin='#b98a64'):
    h = H.Human(cid, name, skin=skin, shirt=shirt, vest='#5a4630', trousers='#33302c', boots='#241810', hair='#3a2a1a', bandana=bandana, build=build, beard='#3a2a1a' if build > 1 else None)
    h.root.parent = C.ship.root; return h

def barrel(parent_ship, loc, tilt=0.0, label=False):
    wm = mat('barrelw', '#7a5430', rough=.6); bm = mat('hoop', '#2a2a2e', rough=.4, metal=.8)
    b = lathe('barrel', [(0, 0), (.2, 0), (.27, .15), (.3, .3), (.27, .45), (.2, .6), (0, .6)], seg=24, m=wm, c=coll('Props')); b.parent = parent_ship.root; b.location = loc
    for z in (.1, .3, .5):
        r = .22 + .08 * math.sin(math.pi * z / .6)
        t = torus('hoop', r + .005, .012, (0, 0, z), bm, seg=24, mseg=6, c=coll('Props')); t.parent = b
    return b

class OilStream:
    """oil poured from a tilted barrel: ballistic stream (real parabola) + droplets, world space"""
    def __init__(self, n=34):
        self.n = n; me = bpy.data.meshes.new('oilstream'); self.me = me
        me.vertices.add(n * 8); 
        faces = []
        for i in range(n - 1):
            for j in range(8): faces.append((i * 8 + j, i * 8 + (j + 1) % 8, (i + 1) * 8 + (j + 1) % 8, (i + 1) * 8 + j))
        me.loops.add(len(faces) * 4); me.polygons.add(len(faces))
        me.loops.foreach_set('vertex_index', np.array(faces, np.int32).ravel()); me.polygons.foreach_set('loop_start', (np.arange(len(faces)) * 4).astype(np.int32)); me.polygons.foreach_set('loop_total', np.full(len(faces), 4, np.int32))
        me.update(); me.polygons.foreach_set('use_smooth', np.ones(len(faces), bool))
        self.o = bpy.data.objects.new('oilstream', me); coll('Props').objects.link(self.o)
        om = mat('oil', '#d8a21a', rough=.05, trans=.85, coat=1.0); om.node_tree.nodes['Principled BSDF'].inputs['IOR'].default_value = 1.47; me.materials.append(om)
        self.drops = []
        for i in range(14):
            d = sphere('drop', .02, (0, 0, -50), om, seg=10, rings=6, c=coll('Props')); self.drops.append(d)
        self.rnd = np.random.RandomState(5)
    def update(self, T, mouth, flow=1.0, vel=(-1.6, 0.0), width=.035, waves=None):
        if flow <= 0.001: self.o.hide_render = True; [setattr(d, 'location', (0, 0, -50)) for d in self.drops]; return
        self.o.hide_render = False
        g = 9.81; vx, vy = vel
        # time to fall to water at the impact column
        pts = []; t_f = 0.0; zs = mouth[2]
        def zw(x, y): return float(waves.height(x, y, T)[0]) if waves else 0.0
        tt = np.linspace(0, 1.4, 400)
        px = mouth[0] + vx * tt; py = mouth[1] + vy * tt; pz = mouth[2] - .5 * g * tt * tt
        hw = np.array([zw(px[i], py[i]) for i in range(0, 400, 8)]); hwi = np.interp(np.arange(400), np.arange(0, 400, 8), hw)
        hit = np.argmax(pz < hwi) if (pz < hwi).any() else 399
        idx = np.linspace(0, hit, self.n).astype(int)
        V = np.zeros((self.n, 8, 3), np.float32)
        for i, k in enumerate(idx):
            p = Vector((px[k], py[k], pz[k])); r = width * flow * (1.0 - .45 * i / self.n) * (1 + .15 * math.sin(T * 40 + i))
            tg = Vector((vx, vy, -g * tt[k])).normalized(); a = tg.cross(Vector((0, 0, 1))); a = a.normalized() if a.length > 1e-4 else Vector((1, 0, 0)); b2 = tg.cross(a)
            for j in range(8):
                ang = j * math.tau / 8; V[i, j] = p + a * math.cos(ang) * r + b2 * math.sin(ang) * r
        self.me.vertices.foreach_set('co', V.reshape(-1)); self.me.update()
        self.impact = Vector((px[hit], py[hit], pz[hit]))
        for i, d in enumerate(self.drops):
            ph = (T * 1.7 + i / len(self.drops)) % 1.0; k = int(ph * hit); off = self.rnd.uniform(-1, 1, 3) * .02 * flow
            d.location = (px[k] + off[0] * 2, py[k] + off[1] * 2, pz[k] + off[2]); d.scale = (1, 1, 1.6)

def thunder_light():
    l = bpy.data.lights.new('flash', 'SUN'); l.energy = 0; l.color = (.75, .85, 1.0); l.angle = math.radians(5)
    o = bpy.data.objects.new('flash', l); bpy.context.scene.collection.objects.link(o); o.rotation_euler = (math.radians(35), 0, math.radians(30)); return l
FLASHES = [(1.2, 1.5), (8.5, 8.7), (15.8, 16.1), (24.2, 24.5), (31.0, 31.3), (44.0, 44.2)]
def flash_hook(l):
    def f(T, t):
        e = 0.0
        for a, b in FLASHES:
            if a <= T < b: e = 25.0 * (1 - (T - a) / (b - a)) * (1.0 if int((T - a) * 24) % 3 else .45)
        l.energy = e
    return f

# ---------------------------------------------------------------- balance helper
def acc_fn(point_local, h=1 / 24.):
    def A(T):
        def wp(tt):
            x, y = C.shipfn(tt); eh = Euler((0, 0, 0)); 
            tmp = C.ship.pose(C.waves, x, y, HDG(tt), tt, boost=C.boost); return ship_matrix() @ Vector(point_local)
        p0, p1, p2 = wp(T - h), wp(T), wp(T + h)
        a = (p0 - 2 * p1 + p2) / (h * h)
        Mi = ship_matrix().to_3x3().inverted(); al = Mi @ a      # ship-local (pose restored below)
        return (al.y, al.x, al.z)
    return A
def tilt_fn(T):
    x, y = C.shipfn(T); return (0, 0)

def make_balance(point_local, t0, t1):
    pts = []
    ts = np.arange(t0 - 1.0, t1 + .01, 1 / 60.)
    def accfn(T): 
        i = int(max(0, min(len(ts) - 1, (T - ts[0]) * 60)));  return acc_cache[i]
    # precompute the deck acceleration at the person's position from the real ship motion
    P = []; R = []
    for T in ts:
        x, y = C.shipfn(T); C.ship.pose(C.waves, x, y, HDG(T), T, boost=C.boost); M = ship_matrix(); P.append(M @ Vector(point_local)); R.append((C.ship.root.rotation_euler[0], C.ship.root.rotation_euler[1], M.to_3x3()))
    P = np.array([[p.x, p.y, p.z] for p in P]); acc_cache = []; tilt = []
    for i in range(len(ts)):
        i0, i2 = max(0, i - 1), min(len(ts) - 1, i + 1); a = (P[i0] - 2 * P[i] + P[i2]) / (1 / 60.) ** 2 if 0 < i < len(ts) - 1 else np.zeros(3)
        Mi = R[i][2].inverted(); al = Mi @ Vector(a); acc_cache.append((al.y, -al.x, al.z)); tilt.append((R[i][0], R[i][1]))
    tilt = np.array(tilt)
    def tiltfn(T): i = int(max(0, min(len(ts) - 1, (T - ts[0]) * 60))); return tilt[i]
    bal = H.Balance(accfn, tiltfn, t0=ts[0], t1=ts[-1], dt=1 / 60., wn=5.0, zeta=.5)
    return bal

def stand(h, loc, yaw, bal, hands=None, face=None, head=None, extra=None, grip=1.0):
    """acting function: physics-driven stance. hands: dict of ship-local hand targets or callables(t)."""
    def fn(T):
        th = bal.at(T); l0, l1, z = th
        s = dict(loc=loc, yaw=yaw, lean=(float(l0) * 1.0, float(l1) * 1.0), crouch=float(max(-.03, min(.22, -z * .5 + .02 + abs(l0) * .25))), sway=float(l1) * .1)
        sg = math.copysign(1, 1) 
        s['footL'] = (-.14, .0, 0.0); s['footR'] = (.14, 0.0, 0.0)
        if hands:
            for k, v in hands.items(): s[k] = v(T) if callable(v) else v
        s['face'] = face(T) if face else H.EXPR['neutral']
        s['head'] = head(T) if head else (0, -float(l0) * 25, 0)
        if extra: s.update(extra(T))
        return s
    h.fn = fn

def walker(h, path, yaw_fn, speed=1.2, face=None, bal=None, arms=None):
    """gait: planted-foot IK. path(T)->(x,y) in ship-local, yaw_fn(T)->deg. foot lift/placing from stride phase"""
    stride = .62
    def fn(T):
        x, y = path(T); x2, y2 = path(T + .02); d = Vector((x2 - x, y2 - y, 0)); v = d.length / .02
        ph = (T * speed * 1.7) % 1.0 * 2 * math.pi
        yaw = yaw_fn(T); f = Vector((math.sin(math.radians(yaw)), -math.cos(math.radians(yaw)), 0)); rgt = Vector((f.y * -1, f.x, 0)) * -1
        s = dict(loc=(x, y, shipmod.DECK), yaw=yaw)
        amp = min(1.0, v / 1.0)
        for sd, sgn, off in (('L', -1, 0.0), ('R', 1, math.pi)):
            sw = math.sin(ph + off); lift = max(0.0, math.cos(ph + off)) * .13 * amp
            s['foot' + sd] = (sgn * .11 * 1.0, -sw * stride * .5 * amp, lift)
            s['hand' + sd] = None
        s['bob'] = abs(math.sin(ph)) * .025 * amp * -1 + .0; s['lean'] = (.08 * amp, math.sin(ph) * .03 * amp); s['twist'] = math.sin(ph) * .12 * amp
        for sd, sgn, off in (('L', -1, 0.0), ('R', 1, math.pi)):
            sw = math.sin(ph + off + math.pi)
            s['hand' + sd] = None
        if arms:
            s.update(arms(T))
        s['face'] = face(T) if face else H.EXPR['neutral']; s['head'] = (0, 0, 0)
        return s
    h.fn = fn

# ================================================================= story helpers
def pour_amt(T):
    return max(K([(4.9, 0), (6.3, 1), (12.4, 1), (13.4, 0)])(T), K([(32.6, 0), (33.8, 1), (39.6, 1), (40.6, 0)])(T))

def setup_oil(T0, T1):
    global OIL_POINT
    # slick position: where the first pour lands (starboard = windward side)
    x, y = C.shipfn(OIL_T0); C.ship.pose(C.waves, x, y, HDG(OIL_T0), OIL_T0, boost=C.boost)
    M = ship_matrix(); p = M @ Vector((7.0, 2.6, 0)); OIL_POINT = (p.x, p.y)
    C.waves.oil = oil_state
    if T1 > OIL_T0 + .5:
        fm = W.oil_film_mat2(); cx, cy = OIL_POINT
        pt = seamod.Patch(C.waves, cx, cy, 70, 240, 'oilfilm', fm, zoff=.03); C.extra_patches.append(pt)
        nodes = fm.node_tree.nodes
        def hk(T, t):
            st = oil_state(T)
            if st: nodes['cx'].outputs[0].default_value = st[0]; nodes['cy'].outputs[0].default_value = st[1]; nodes['R'].outputs[0].default_value = st[2]
            else: nodes['R'].outputs[0].default_value = 0.0
        C.hooks.append(hk)

def rogue_on():
    def f(T):
        yc = ship_xy(15.0)[1] - 105 + 9.2 * (T - 15.0)
        A = 11.0 * K([(12.0, 0), (17.0, 1), (36.0, 1), (42.0, 0)])(T)
        return (yc, A)
    C.waves.rogue = f

def sailor_pouring(bal_t0, bal_t1, face=None, hands_extra=None):
    sl = sailor(); b = barrel(C.ship, (4.15, 2.6, shipmod.DECK + 1.0)); st = OilStream()
    bal = make_balance((3.55, 2.6, shipmod.DECK), bal_t0, bal_t1)
    def tl(T): return math.radians(100) * pour_amt(T)
    def bhook(T, t):
        a = tl(T); b.rotation_euler = (0, -a, 0); b.location = (4.2 - .05 * math.sin(a), 2.6, shipmod.DECK + 1.15 + .12 * math.sin(a))
        M = ship_matrix(); mouth = M @ (Vector(b.location) + Matrix.Rotation(-a, 3, 'Y') @ Vector((0, 0, .6)) * 1.0)
        fl = max(0.0, (a - math.radians(38)) / math.radians(60)); fl = min(1, fl) * (1 if pour_amt(T) > .05 else 0)
        # outboard velocity: world direction of ship-local +X
        out = M.to_3x3() @ Vector((1, 0, 0)); st.update(T, (mouth.x, mouth.y, mouth.z), flow=fl, vel=(out.x * 1.4, out.y * 1.4), width=.04, waves=C.waves)
    C.hooks.append(bhook); C.stream = st; C.barrel = b
    hands = {'handL': lambda T: Vector((3.9, 2.35, shipmod.DECK + 1.15 + .1 * math.sin(tl(T)))), 'handR': lambda T: Vector((3.9, 2.85, shipmod.DECK + 1.15 + .1 * math.sin(tl(T))))}
    if hands_extra: hands.update(hands_extra)
    stand(sl, (3.55, 2.6, shipmod.DECK), 90, bal, hands=hands, face=face or H.expr_track([(0, 'neutral'), (60, 'neutral')]), head=lambda T: (-14, 10, 0))
    return sl

def common_light():
    l = thunder_light(); C.hooks.append(flash_hook(l))

def new_shot(n, t0, **kw):
    sm = begin(n, t0, **kw); make_cam(kw.get('fstop', 4.0)); H.HUMANS.clear(); common_light(); return sm

def finish(): finish_materials()

CP = lambda: Vector(C.stream.impact) if hasattr(C, 'stream') and hasattr(C.stream, 'impact') else Vector((0, 0, 0))

# ================================================================= shots
def s_aerial(n, t0=0.0):
    new_shot(n, t0, storm=1.25, pirate=True, near=(220, 360), haze=700.0); rogue_on(); setup_oil(t0, t0 + n / FPS)
    C.camfn = lambda t: ((lambda s: (Vector((s[0], s[1], 0)) + K([(0, (-90, -150, 120)), (2.3, (-48, -80, 62))])(t)[0:3] if False else Vector((s[0] - K([(0, 90), (2.3, 48)])(t), s[1] - K([(0, 150), (2.3, 80)])(t), K([(0, 120), (2.3, 62)])(t)))))(ship_xy(C.t0 + t)),
                         (lambda s: Vector((s[0], s[1], 8)))(ship_xy(C.t0 + t)), K([(0, 22), (2.3, 26)])(t), Vector(ship_xy(C.t0 + t) + (0.0,)) if False else Vector((*ship_xy(C.t0 + t), 3)), 0)
    C.rainwind = (8, 4); finish()

def s_push(n, t0=2.2):
    new_shot(n, t0, storm=1.2, pirate=True, near=(200, 340), haze=800.0); rogue_on(); setup_oil(t0, t0 + n / FPS)
    C.camfn = lambda t: (SL(K([(0, (11, -46, 17)), (2.4, (7.5, -22, 9.5))])(t)), SL((-1, 3, 5.0)), K([(0, 28), (2.4, 32)])(t), SL((0, 0, 3)), 0)
    finish()

def s_sailor(n, t0=4.6):
    new_shot(n, t0, storm=1.2, near=(160, 300), haze=600.0); rogue_on(); setup_oil(t0, t0 + n / FPS)
    sl = sailor_pouring(t0 - 1, t0 + n / FPS)
    C.camfn = lambda t: (SL(K([(0, (-0.5, 6.6, 4.9)), (n / FPS, (-.2, 5.4, 4.5))])(t)), SL((3.3, 2.6, 3.7)), K([(0, 34), (n / FPS, 40)])(t), SL((3.55, 2.6, 3.6)), K([(0, 4), (n / FPS, -3)])(t))
    finish()

def s_oilcu(n, t0=7.4):
    new_shot(n, t0, storm=1.1, near=(100, 300), haze=500.0, rain=True); rogue_on(); setup_oil(t0, t0 + n / FPS)
    sl = sailor_pouring(t0 - 1, t0 + n / FPS)
    def cf(t):
        P = CP(); P = P if P.length > 1 else SL((7.0, 2.6, 0.2))
        a = math.radians(30 + 40 * t / 2.5); loc = P + Vector((math.cos(a) * 4.2, math.sin(a) * 4.2, 4.6 - .5 * t)); return (loc, P + Vector((0, 0, 1.9)), 42, P + Vector((0, 0, 1.2)), 0)
    C.camfn = cf; finish()

def captain_scene(face_seq, spot, yaw, look=None, hands=None, walk=None):
    cp = captain(); bal = make_balance((spot[0], spot[1], shipmod.DECK), C.t0 - 1, C.t0 + 40)
    if walk:
        walker(cp, walk[0], walk[1], speed=walk[2], face=H.expr_track(face_seq), arms=walk[3] if len(walk) > 3 else None)
    else:
        stand(cp, (spot[0], spot[1], shipmod.DECK), yaw, bal, hands=hands, face=H.expr_track(face_seq), head=look)
    return cp

def s_captain_walk(n, t0=9.9):
    new_shot(n, t0, storm=1.2, near=(160, 300), haze=600.0); rogue_on(); setup_oil(t0, t0 + n / FPS)
    sl = sailor_pouring(t0 - 1, t0 + n / FPS)
    p = lambda T: (K([(t0, 0.9), (t0 + 2.0, 2.3)])(T), K([(t0, -2.2), (t0 + 2.0, 2.2)])(T))
    path = lambda T: (K([(t0, 1.0), (t0 + 2.2, 2.5)])(T), K([(t0, -3.0), (t0 + 2.2, 1.5)])(T))
    cp = captain(); walker(cp, path, lambda T: K([(t0, 0), (t0 + 2.2, 70)])(T), speed=.7, face=H.expr_track([(0, 'angry'), (60, 'furious')]),
                           arms=lambda T: {'handR': Vector(ship_xy(0) + (0,)) if False else None})
    C.camfn = lambda t: (SL(K([(0, (-1.5, -1.5, 3.9)), (n / FPS, (.4, 3.6, 3.8))])(t)), SL((K([(0, 1.0), (n / FPS, 2.5)])(t + 0), K([(0, -3.0), (n / FPS, 1.5)])(t), 3.7)), 34, SL((1.5, -.5, 3.6)), 0)
    finish()

def s_ots(n, t0=11.9):
    new_shot(n, t0, storm=1.2, near=(160, 300), haze=600.0); rogue_on(); setup_oil(t0, t0 + n / FPS)
    sl = sailor_pouring(t0 - 1, t0 + n / FPS)
    cp = captain_scene([(0, 'furious'), (60, 'furious')], (2.0, 1.6), 100, look=lambda T: (-8, -4, 0),
                       hands={'handR': lambda T: Vector((3.7, 2.6, shipmod.DECK + 1.2)) if T > t0 + .4 else None, 'handL': None})
    C.camfn = lambda t: (SL(K([(0, (4.0, 3.6, 4.35)), (n / FPS, (3.7, 3.4, 4.35))])(t)), SL((1.6, 1.4, 4.35)), 38, SL((2.0, 1.6, 4.4)), 0)
    finish()

def s_captain_cu(n, t0=13.2):
    new_shot(n, t0, storm=1.2, near=(160, 300), haze=600.0); rogue_on(); setup_oil(t0, t0 + n / FPS)
    sl = sailor_pouring(t0 - 1, t0 + n / FPS)
    cp = captain_scene([(0, 'furious'), (1.0, 'shout'), (1.5, 'furious')], (2.0, 1.6), 100, look=lambda T: (-8, -4, 0), hands={'handL': None})
    hd = Vector((2.0, 1.6, shipmod.DECK + 1.78))
    C.camfn = lambda t: (SL(Vector((3.2, 2.5, 4.55)) + Vector((-.2 * t, -.1 * t, 0))), SL(hd), 70, SL(hd), 0)
    finish()

def s_point(n, t0=14.8):
    new_shot(n, t0, storm=1.35, near=(200, 340), haze=1200.0); rogue_on(); setup_oil(t0, t0 + n / FPS)
    sl = sailor_pouring(t0 - 1, t0 + n / FPS, hands_extra={'handR': lambda T: Vector((5.4, 4.0 + 1.5 * ease((T - t0 - .3) / .4), shipmod.DECK + 2.0 + .25 * ease((T - t0 - .3) / .4))) if T > t0 + .3 else Vector((3.9, 2.85, shipmod.DECK + 1.15))})
    cp = captain_scene([(0, 'angry'), (1.5, 'confused')], (1.7, 1.6), 100, look=lambda T: (-8, -4, 0), hands={'handL': None})
    C.camfn = lambda t: (SL((3.55 - .3 * t, 1.4, 4.35)), SL(K([(0, (11, 4.2, 4.6)), (n / FPS, (11, 4.2, 6.8 + 6 * 0))])(t)) if False else SL(K([(0, (30, 5, 3.5)), (n / FPS, (36, 8, 14))])(t)), 30 + 4 * t, SL((30, 5, 6)), 0)
    finish()

def s_turn_line(n, t0=17.8):
    new_shot(n, t0, storm=1.35, near=(160, 300), haze=1200.0); rogue_on(); setup_oil(t0, t0 + n / FPS)
    sl = sailor_pouring(t0 - 1, t0 + n / FPS, face=H.expr_track([(0, 'shout'), (60, 'shout')]), hands_extra={'handR': lambda T: Vector((5.4, 5.5, shipmod.DECK + 2.25))})
    cp = captain_scene([(0, 'confused'), (60, 'confused')], (1.7, 1.6), 100, look=lambda T: (-8, -4, 0), hands={'handL': None})
    hd = Vector((3.55, 2.6, shipmod.DECK + 1.76))
    C.camfn = lambda t: (SL(Vector((1.9, 3.3, 4.25)) + Vector((.3 * t, 0, 0))), SL(hd), 55, SL(hd), 0)
    finish()

def s_captain_low(n, t0=20.5):
    new_shot(n, t0, storm=1.35, near=(160, 300), haze=1200.0); rogue_on(); setup_oil(t0, t0 + n / FPS)
    sl = sailor_pouring(t0 - 1, t0 + n / FPS)
    cp = captain_scene([(0, 'confused'), (1.0, 'terror'), (2.2, 'terror')], (1.4, 1.2), 100, look=lambda T: (K([(t0, -10), (t0 + 1.4, 60)])(T), -5, 0), hands={'handL': None})
    hd = Vector((1.4, 1.2, shipmod.DECK + 1.8))
    C.camfn = lambda t: (SL(Vector((.2, 2.6, shipmod.DECK + .35)) + Vector((.2 * t, 0, .15 * t))), SL(hd + Vector((0, 0, .1))), 28, SL(hd), -4)
    finish()

def s_pirates(n, t0=23.0):
    new_shot(n, t0, storm=1.35, pirate=True, near=(220, 360), haze=1400.0); rogue_on(); setup_oil(t0, t0 + n / FPS)
    cp = captain_scene([(0, 'worry' if False else 'angry'), (60, 'angry')], (0, -11.2), 180, hands={'handL': lambda T: Vector((-.45, -11.3, shipmod.DECK + 1.9)), 'handR': lambda T: Vector((.45, -11.3, shipmod.DECK + 1.9))}, look=lambda T: (0, 0, 0))
    C.camfn = lambda t: (SL(K([(0, (-4.5, -17.5, 5.2)), (n / FPS, (-3.5, -16.5, 4.9))])(t)), SL(K([(0, (60, -230, 6)), (n / FPS, (50, -200, 6))])(t)) if False else Vector((C.pirate.root.location.x, C.pirate.root.location.y, 6)), 32, Vector((C.pirate.root.location.x, C.pirate.root.location.y, 6)), 0)
    finish()

def s_turn(n, t0=26.2):
    new_shot(n, t0, storm=1.4, near=(240, 360), haze=1500.0, wind=1.5, sailamp=1.5); rogue_on(); setup_oil(t0, t0 + n / FPS)
    cp = captain_scene([(0, 'shout'), (60, 'shout')], (0, -11.2), 180, hands={'handL': lambda T: Vector((-.45, -11.3, shipmod.DECK + 1.9)), 'handR': lambda T: Vector((.45, -11.3, shipmod.DECK + 1.9))}, look=lambda T: (0, 0, 0))
    C.camfn = lambda t: (Vector((ship_xy(C.t0 + t)[0] - 28 + 5 * t, ship_xy(C.t0 + t)[1] + 38 - 6 * t, 9 + 2 * t)), SL((0, 2, 8)), 30, SL((0, 0, 3)), 0)
    finish()

def s_deck_crash(n, t0=28.7):
    new_shot(n, t0, storm=1.5, near=(140, 320), haze=900.0, wind=1.6, sailamp=1.6, boost=1.6); rogue_on(); setup_oil(t0, t0 + n / FPS)
    cs = [crew('CHAR_003', 'Crew1', '#c9c0a8', '#3a5a8a'), crew('CHAR_004', 'Crew2', '#bdb49c', None, 1.1)]
    for i, (c, p) in enumerate(zip(cs, ((-1.6, 5.0), (2.2, 3.5)))):
        bal = make_balance((p[0], p[1], shipmod.DECK), t0 - 1, t0 + n / FPS)
        stand(c, (p[0], p[1], shipmod.DECK), 180 + 20 * i, bal, hands={'handL': Vector((p[0] - .3, p[1] - .3, shipmod.DECK + 1.3)), 'handR': Vector((p[0] + .3, p[1] - .3, shipmod.DECK + 1.3))},
              face=H.expr_track([(0, 'strain'), (60, 'strain')]))
    C.camfn = lambda t: (SL(K([(0, (-2.6, 9.5, 3.8)), (n / FPS, (-1.8, 7.5, 3.4))])(t)), SL((0, 0, 3.0)), 24, SL((0, 3, 3)), 6 - 4 * t)
    C.hooks.append(lambda T, t: None); finish()

def s_crew(n, t0=30.9):
    new_shot(n, t0, storm=1.5, near=(140, 320), haze=900.0, wind=1.6, sailamp=1.6, boost=1.5); rogue_on(); setup_oil(t0, t0 + n / FPS)
    cs = [crew('CHAR_003', 'Crew1', '#c9c0a8', '#3a5a8a'), crew('CHAR_004', 'Crew2', '#bdb49c', None, 1.1), crew('CHAR_005', 'Crew3', '#d4cab0', '#7a2a2a')]
    spots = ((-2.0, 2.0), (-.6, 3.4), (1.4, 2.0))
    for i, (c, p) in enumerate(zip(cs, spots)):
        bal = make_balance((p[0], p[1], shipmod.DECK), t0 - 1, t0 + n / FPS)
        stand(c, (p[0], p[1], shipmod.DECK), 180 + 30 * (i - 1), bal, hands={'handL': Vector((p[0] - .35, p[1] + .1, shipmod.DECK + 1.4)), 'handR': Vector((p[0] + .35, p[1] + .1, shipmod.DECK + 1.4))}, face=H.expr_track([(0, 'strain'), (60, 'strain')]))
    C.camfn = lambda t: (SL(K([(0, (-.5, -3.5, 2.7)), (n / FPS, (.4, -1.5, 3.2))])(t)), SL((0, 2.8, 3.8)), 28, SL((0, 2.8, 3.8)), 8 * math.sin(t * 2.0))
    finish()

def s_pour2(n, t0=33.1):
    new_shot(n, t0, storm=1.5, near=(160, 320), haze=1000.0, wind=1.6, sailamp=1.6, boost=1.5); rogue_on(); setup_oil(t0, t0 + n / FPS)
    sl = sailor_pouring(t0 - 1, t0 + n / FPS, face=H.expr_track([(0, 'strain'), (60, 'strain')]))
    C.camfn = lambda t: (SL(K([(0, (6.2, 5.5, 4.5)), (n / FPS, (6.0, 4.2, 3.9))])(t)), SL((3.8, 2.6, 3.5)), 32, SL((3.55, 2.6, 3.5)), 5 * math.sin(t * 1.7))
    finish()

def s_macro_drops(n, t0=36.4):
    new_shot(n, t0, storm=.5, near=(8, 400), far=False, ship=True, haze=300.0, rain=False, sea_rough=.05); C.waves.oil = None
    # extreme macro: oil drops hitting a calm patch
    setup_oil(t0, t0 + n / FPS)
    C.ship.root.location = (0, 0, -40); C.hooks.append(lambda T, t: C.ship.root.__setattr__('location', (0, 0, -40)))
    cx, cy = OIL_POINT
    drops = [sphere('od', .012, (0, 0, -50), mat('odm', '#d8a21a', rough=.04, trans=.9, coat=1.0), seg=16, rings=10, c=coll('Props')) for _ in range(9)]
    def hk(T, t):
        for i, d in enumerate(drops):
            ph = ((t * 1.3 + i / 9.0) % 1.0); h = 1.1 * (1 - ph) ** 2
            d.location = (cx - .06 + .035 * (i % 3), cy - .05 + .04 * (i // 3), C.waves.height(cx, cy, T)[0] + .01 + h); d.scale = (1, 1, 1.4 - ph * .6)
    C.hooks.append(hk)
    C.camfn = lambda t: (Vector((cx + .55 - .1 * t, cy - .55, C.waves.height(cx, cy, C.t0 + t)[0] + .28 - .04 * t)), Vector((cx - .02, cy - .02, C.waves.height(cx, cy, C.t0 + t)[0] + .02)), 85, Vector((cx, cy, 0)), 0)
    finish()

def s_dive(n, t0=38.6):
    new_shot(n, t0, storm=1.0, near=(120, 340), haze=700.0); setup_oil(t0, t0 + n / FPS); C.ship.root.location = (0, 0, -40)
    cx, cy = OIL_POINT
    zc = lambda T: float(C.waves.height(cx, cy, T)[0])
    C.hooks.append(lambda T, t: C.ship.root.__setattr__('location', (0, 0, -40)))
    C.camfn = lambda t: (Vector((cx - 14 * (1 - ease(t / 2.2)) - 1.2, cy - 22 * (1 - ease(t / 2.2)) - 1.2, zc(C.t0 + t) + 11 * (1 - ease(t / 2.2)) + .7)), Vector((cx, cy, zc(C.t0 + t))), 34 + 18 * ease(t / 2.2), Vector((cx, cy, zc(C.t0 + t))), 0)
    finish()

def s_orbit_oil(n, t0=40.8):
    new_shot(n, t0, storm=.9, near=(120, 340), haze=700.0, rain=False); setup_oil(t0, t0 + n / FPS); C.ship.root.location = (0, 0, -40)
    cx, cy = OIL_POINT; C.hooks.append(lambda T, t: C.ship.root.__setattr__('location', (0, 0, -40)))
    def cf(t):
        a = math.radians(-60 + 80 * t / (n / FPS)); R = 8.0; z = float(C.waves.height(cx, cy, C.t0 + t)[0])
        return (Vector((cx + math.cos(a) * R, cy + math.sin(a) * R, z + 2.4)), Vector((cx, cy, z)), 32, Vector((cx, cy, z)), 0)
    C.camfn = cf; finish()

# ================================================================= second half (science, comparison, storm oil, finale)
def hide_ship_far(): 
    C.ship.root.location = (0, 0, -40); C.hooks.append(lambda T, t: C.ship.root.__setattr__('location', (0, 0, -40)))

def s_science(n, t0=43.7):
    """R - the film spreading: camera skims the surface from the slick's edge towards the centre"""
    new_shot(n, t0, storm=.8, near=(150, 360), haze=700.0, rain=True); setup_oil(t0, t0 + n / FPS); hide_ship_far()
    cx, cy = OIL_POINT; z = lambda T: float(C.waves.height(cx, cy, T)[0])
    def cf(t):
        st = oil_state(C.t0 + t) or (cx, cy, 8.0); R = st[2]; k = t / (n / FPS)
        a = math.radians(-120 + 25 * k); d = R * (1.35 - .6 * k) + 1.5
        return (Vector((cx + math.cos(a) * d, cy + math.sin(a) * d, z(C.t0 + t) + 1.5 - .5 * k)), Vector((cx, cy, z(C.t0 + t) + .1)), 38 + 8 * k, Vector((cx, cy, z(C.t0 + t))), 0)
    C.camfn = cf; finish()

def _split(n, t0, oil):
    new_shot(n, t0, storm=1.45, near=(150, 360), haze=900.0, rain=True, wind=1.4); setup_oil(t0, t0 + n / FPS); hide_ship_far()
    if not oil:
        C.waves.oil = None
        for o in bpy.data.objects:
            if o.name.startswith('oilfilm'): o.hide_render = True; o.hide_viewport = True
    cx, cy = OIL_POINT; z = lambda T: float(C.waves.height(cx, cy, T)[0])
    C.camfn = lambda t: (Vector((cx - 7.5 + .8 * t, cy - 8.5 + .5 * t, z(C.t0 + t) + 2.6)), Vector((cx + 1.5, cy + 2.0, z(C.t0 + t) + .8)), 34, Vector((cx, cy, z(C.t0 + t))), 0)
    finish()
def s_split_a(n, t0=47.9): _split(n, t0, False)
def s_split_b(n, t0=47.9): _split(n, t0, True)

def s_zoom(n, t0=50.7):
    """T - macro push-in on the smoothed surface vs the choppy edge"""
    new_shot(n, t0, storm=1.1, near=(80, 360), haze=500.0, rain=True, far=False); setup_oil(t0, t0 + n / FPS); hide_ship_far()
    cx, cy = OIL_POINT; z = lambda T: float(C.waves.height(cx + 2, cy, T)[0])
    def cf(t):
        k = t / (n / FPS); e = ease(k)
        return (Vector((cx - 4.5 + 3.4 * e, cy - 3.2 + 2.4 * e, z(C.t0 + t) + 1.6 - 1.1 * e)), Vector((cx + 2, cy + 1.5, z(C.t0 + t) + .05)), 50 + 25 * e, Vector((cx + 1.5, cy + 1.0, z(C.t0 + t))), 0)
    C.camfn = cf; finish()

def barrels_on_deck(spots, label=True):
    out = []
    for p in spots:
        b = barrel(C.ship, (p[0], p[1], shipmod.DECK)); out.append(b)
        if label:
            cu = bpy.data.curves.new('lbl', 'FONT'); cu.body = 'STORM OIL'; cu.size = .075; cu.align_x = 'CENTER'; cu.extrude = .002
            tx = bpy.data.objects.new('lbl', cu); coll('Props').objects.link(tx); tx.data.materials.append(mat('lblm', '#e9dfc4', rough=.8))
            tx.parent = b; tx.location = (0, -.285, .3); tx.rotation_euler = (math.radians(90), 0, 0)
    return out

def s_oldship(n, t0=53.8):
    """U - storm oil barrels lashed along the deck, crew hand lifting one"""
    new_shot(n, t0, storm=.9, near=(160, 300), haze=900.0, wind=1.0)
    barrels_on_deck([(-1.2, 2.2), (-.5, 2.2), (.2, 2.2), (.9, 2.2), (-.85, 2.85), (-.15, 2.85), (.55, 2.85)])
    sl = crew('CHAR_003', 'Crew1', '#c9c0a8', '#3a5a8a'); bal = make_balance((2.0, 2.6, shipmod.DECK), t0 - 1, t0 + n / FPS)
    stand(sl, (2.0, 2.6, shipmod.DECK), 270, bal, hands={'handL': Vector((1.5, 2.45, shipmod.DECK + 1.0)), 'handR': Vector((1.5, 2.8, shipmod.DECK + 1.0))}, face=H.expr_track([(0, 'neutral'), (60, 'neutral')]))
    C.camfn = lambda t: (SL(K([(0, (-3.6, 0.8, 2.6)), (n / FPS, (-1.6, 1.3, 2.4))])(t)), SL((-.2, 2.5, 3.5)), 34, SL((-.2, 2.5, 3.4)), 0)
    finish()

def s_container(n, t0=57.4):
    """V - orbit around one storm-oil barrel"""
    new_shot(n, t0, storm=.8, near=(160, 300), haze=900.0)
    b, = barrels_on_deck([(0.0, 2.6)])
    C.camfn = lambda t: (SL(Vector((math.sin(math.radians(-70 + 120 * t / (n / FPS))) * 1.25, 2.6 - math.cos(math.radians(-70 + 120 * t / (n / FPS))) * 1.25, shipmod.DECK + .75))), SL((0, 2.6, shipmod.DECK + .35)), 40, SL((0, 2.6, shipmod.DECK + .3)), 0)
    finish()

def s_wide(n, t0=59.5):
    """W - the ship rides the waves, the slick behind it"""
    new_shot(n, t0, storm=1.2, pirate=False, near=(240, 380), haze=1100.0, wind=1.4, sailamp=1.2); setup_oil(t0, t0 + n / FPS)
    def cf(t):
        s = ship_xy(C.t0 + t); k = t / (n / FPS); a = math.radians(200 + 55 * k)
        return (Vector((s[0] + math.cos(a) * 55, s[1] + math.sin(a) * 55, 22 - 6 * k)), Vector((s[0], s[1], 4)), 30, Vector((s[0], s[1], 3)), 0)
    C.camfn = cf; finish()

def s_twoshot(n, t0=64.3):
    """X - captain and sailor, calmer"""
    new_shot(n, t0, storm=.7, near=(160, 300), haze=1400.0, wind=.8, sailamp=.8, sun_e=4.0)
    sl = sailor(); cp = captain()
    b1 = make_balance((2.2, 2.4, shipmod.DECK), t0 - 1, t0 + n / FPS); b2 = make_balance((3.3, 2.4, shipmod.DECK), t0 - 1, t0 + n / FPS)
    stand(sl, (3.3, 2.4, shipmod.DECK), 250, b2, face=H.expr_track([(0, 'smile'), (60, 'smile')]), head=lambda T: (0, 12, 0))
    stand(cp, (2.2, 2.4, shipmod.DECK), 80, b1, face=H.expr_track([(0, 'neutral'), (1.4, 'smile'), (60, 'smile')]), head=lambda T: (0, -12, 0))
    C.camfn = lambda t: (SL(K([(0, (2.75, 0.2, 2.9)), (n / FPS, (2.75, .7, 2.8))])(t)), SL((2.75, 2.4, 3.55)), 36, SL((2.75, 2.4, 3.5)), 0)
    finish()

def s_finale(n, t0=67.3):
    """Y - golden light, mist, the ship sails on; slow pull-back"""
    new_shot(n, t0, mood='gold', storm=.35, near=(240, 380), haze=700.0, wind=.7, sailamp=.7, rain=False, sun=(.9, .5, .16), sun_e=6.0, sea_rough=.08)
    def cf(t):
        s = ship_xy(C.t0 + t); k = t / (n / FPS)
        return (Vector((s[0] - 22 - 70 * k, s[1] - 35 - 80 * k, 8 + 28 * k)), Vector((s[0], s[1], 6)), 28 - 4 * k, Vector((s[0], s[1], 4)), 0)
    C.camfn = cf; finish()

SHOTS = {k[2:]: v for k, v in list(globals().items()) if k.startswith('s_') and callable(v)}
