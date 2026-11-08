"""Preview scenes. Each function builds one shot; run.py renders it."""
import bpy, math, random
from mathutils import Vector
import lib, env, chars
from lib import camera, sun, world_hdri, point, area, box, cyl, sphere, plane
from env import T, S
from chars import character, crowd

SCENES = {}
def scene(fn): SCENES[fn.__name__] = fn; return fn

def H(*kw, cats=('outdoor',), **k):
    try: return world_hdri(*kw, avoid=('indoor',), **k)
    except Exception as e: lib.log('hdri failed', e); lib.world_color('#9fb4cc', 1.0)

def FR(*kw, cands=(), **k):
    aid = None
    try: aid = lib.ph_pick('hdris', list(cands), *kw)
    except Exception as e: lib.log('hdri pick', e)
    try: return world_hdri(aid=aid, **k) if aid else H(*kw, **k)
    except Exception as e: lib.log('hdri', e); lib.world_color('#9fb4cc', 1.0)

PRODUCE = None
def produce():
    global PRODUCE
    if PRODUCE is None:
        PRODUCE = [m for m in (lib.model(['food_apple_01']), lib.model(['lemon']), lib.model(['yellow_onion']),
                               lib.model(['food_lime_01']), lib.model(['sweet_potato']), lib.model(['food_pomegranate_01'])) if m]
        if not PRODUCE: PRODUCE = ['#c43a2a', '#e8c23a', '#d89a4a', '#5a8a2a']
    return PRODUCE

# ----------------------------------------------------------------- characters
@scene
def cast_lineup():
    FR('street', cands=['kloppenheim_06', 'cobblestone_street_night', 'street_lamp', 'urban_street_01'], strength=.8, rot=40)
    sun(-35, 34, 3.2)
    env.street(-30, 30, 9, seed=4)
    names = ['worker', 'foreman', 'mother', 'kid', 'fireman', 'sailor', 'oldman', 'judge']
    spots = [(-1.5, -1.0), (-.4, -1.6), (.75, -1.1), (.05, -2.6), (-1.35, .35), (.3, .1), (1.6, .2), (-.6, 1.5)]
    cam = Vector((.0, -6.9, 1.35))
    for n, (x, y) in zip(names, spots): character(n, (x, y, 0), look_at=(cam.x, cam.y, 0))
    env.lamp((2.6, -3.5, .18)); env.lamp((-2.9, 4.2, .18))
    camera(tuple(cam), (0, 0, 1.15), lens=30, focus=(0, -1.2, 1.3), fstop=4)

@scene
def expressions():
    lib.world_color('#d8d2c8', .6)
    area((-3, -5, 6), (0, 0, 1.8), 4, 1400, '#fff2e0'); area((4, -3, 3), (0, 0, 1.8), 3, 450, '#dfe8ff'); area((0, 4, 4), (0, 0, 2), 3, 500)
    box('back', (14, .2, 8), (0, 3.2, 4), S('#c9b79c', .9))
    steps = [T('woodpanel', 1.2, '#a07850')]
    for k in range(4):
        box('step', (7, 1.1, .45 * (k + 1)), (0, -1.5 + k * 1.1, .225 * (k + 1)), steps[0])
    names = ['worker', 'foreman', 'mother', 'fireman', 'sailor', 'oldman', 'kid', 'worker', 'mother', 'sailor', 'foreman', 'kid']
    faces = chars.FACES
    cam = Vector((0, -8.8, 2.6))
    for i, (n, f) in enumerate(zip(names, faces)):
        row, col = divmod(i, 3)
        x = (col - 1) * 1.15 + (row % 2) * .2; y = -1.5 + row * 1.1; z = .45 * (row + 1)
        character(n, (x, y, z), face=f, look_at=(cam.x, cam.y, 0), arms={'armL': (.25, .2), 'armR': (.25, .2)}, props=[])
    camera(tuple(cam), (0, 0, 2.2), lens=42, fstop=8, focus=(0, -.5, 2))

# ----------------------------------------------------------------- environments
@scene
def street_1919():
    FR('sunny', cands=['kloppenheim_06', 'urban_street_01', 'street_lamp', 'cobblestone_street_night'], strength=.7, rot=10)
    sun(-50, 30, 3.6, color='#ffe6c8')
    env.street(-50, 50, 10, seed=11, awnings=['#7a2b2b', '#2f5a4a', '#c8a23a'])
    env.el_railway(-50, 50, -2.5, z=6.4)
    env.tank((62, 12, 0))
    for x in (-12, -2, 8, 18): env.lamp((x, -6.2, .18))
    hy = lib.model(['fire_hydrant']); lib.place(hy, (3.2, -5.5, .18), 0, 1)
    bar = lib.model(['Barrel_01', 'barrel_03']); [lib.place(bar, (x, 5.6, .18), x, 1) for x in (-4.5, -3.8, 6.2)]
    env.crate((5.2, 5.4, .18), .3); env.crate((5.0, 5.5, .58), .1)
    cam = Vector((-3.3, -3.8, 1.05))
    character('worker', (-1.4, -1.6, 0), face='smug', look_at=(cam.x, cam.y, 0), walk=.4)
    character('kid', (-.4, -1.1, 0), face='grin', look_at=(-1.4, -1.6, 0))
    character('foreman', (3.5, 1.2, 0), face='unimpressed', look_at=(-1, -2, 0))
    env.model_t((8, 2.6, 0), math.radians(180))
    camera(tuple(cam), (1.2, .3, 1.5), lens=28, focus=(-1.2, -1.5, 1.4), fstop=2.8)

@scene
def market():
    FR('sunny', cands=['urban_street_01', 'kloppenheim_06', 'piazza_san_marco', 'street_lamp'], strength=.75, rot=200)
    sun(30, 38, 3.4, color='#ffe4c0')
    env.ground('cobble', (90, 90))
    rnd = random.Random(5)
    for i, x in enumerate(range(-24, 25, 9)):
        env.facade(x, 14, 9, rnd.uniform(10, 16), T(rnd.choice(env.PALETTE_WALLS), 2.5), seed=i, awning=rnd.choice(['#7a2b2b', '#2f5a4a']))
        env.facade(-20, x, 9, rnd.uniform(10, 15), T(rnd.choice(env.PALETTE_WALLS), 2.5), rot=math.pi / 2, seed=i + 20)
        env.facade(20, x, 9, rnd.uniform(10, 15), T(rnd.choice(env.PALETTE_WALLS), 2.5), rot=-math.pi / 2, seed=i + 40)
    pr = produce(); cl = [('#b8332a', '#efe6d4'), ('#2f5a7a', '#efe6d4'), ('#3f6b3a', '#e8d8a8'), ('#c8932a', '#5a2a22')]
    k = 0
    for row in (-1, 1):
        for x in (-9, -5, -1, 3, 7):
            c = cl[k % 4]; env.stall((x + row * 1.2, row * 3.6 + 4, 0), 0 if row < 0 else math.pi, c[0], c[1], seed=k,
                                     produce=[pr[(k + j) % len(pr)] for j in range(3)]); k += 1
    cart = lib.model(['CoffeeCart_01']); lib.place(cart, (8.5, -2, 0), 2.4)
    bar = lib.model(['Barrel_01', 'barrel_03']); [lib.place(bar, p, 0, 1) for p in ((-11, 1, 0), (-10.4, 1.5, 0))]
    cam = Vector((-1.6, -6.2, 1.3))
    character('mother', (-.6, -2.6, 0), face='talk', look_at=(cam.x, cam.y, 0))
    character('worker', (.6, -3.4, 0), face='sideeye', look_at=(-.6, -2.6, 0), props=[])
    crowd(26, (0, 3.5, 0), 9.5, seed=8, avoid=lambda p: abs(p.y - .4) > 3.0 and abs(p.y - 7.6) > 3.0 or (abs(p.y - .4) < 1.2) or (abs(p.y - 7.6) < 1.2) or (p - Vector((0, -3, 0))).length < 2.2)
    for i in range(14):
        lib.point((-10 + i * 1.6, 4 + math.sin(i) * .4, 3.1), 6, '#ffcf88', .05)
        sphere('bulb', .05, (-10 + i * 1.6, 4 + math.sin(i) * .4, 3.1), S('#fff', .2, emit='#ffcf88', emit_strength=12), seg=12, rings=6)
    camera(tuple(cam), (.8, 4, 1.6), lens=30, focus=(-.6, -2.6, 1.4), fstop=2.8)

@scene
def city_drone():
    FR('sky', cands=['kloofendal_48d_partly_cloudy_puresky', 'kloofendal_43d_clear_puresky', 'qwantani_puresky'], strength=1.0, rot=120)
    sun(140, 22, 4.0, color='#ffd8a8')
    env.ground('asphalt', (600, 600), scale=4)
    env.water((400, 300), (0, 330, .05), '#163238', ocean=True, choppy=.6, wave=.5, res=9)
    rnd = random.Random(2); walls = [T('brick', 4), T('brick2', 4), T('plaster', 4, '#e0d4c0'), T('concrete', 4)]
    tree = lib.model(['island_tree_01', 'jacaranda_tree', 'fir_tree_01'])
    wins = [lib.mat_windows('win%d' % i, c, lit_ratio=.12, emit=1.0) for i, c in enumerate(['#8a4a3a', '#a89a88', '#6a5a4a', '#c8b8a0'])]
    for bx in range(-6, 7):
        for by in range(-6, 3):
            cx, cy = bx * 32, by * 32
            if bx == 0 and by == -1:
                env.grass_patch((26, 26), (cx, cy, .05), count=40000, length=.12)
                for k in range(6): lib.place(tree, (cx + rnd.uniform(-10, 10), cy + rnd.uniform(-10, 10), 0), rnd.uniform(0, 6), rnd.uniform(.8, 1.2))
                continue
            box('sidewalk', (27, 27, .2), (cx, cy, .1), T('pavers', 2))
            for i in range(2):
                for j in range(2):
                    h = rnd.choice([10, 13, 16, 20, 25, 35]) * (1.6 if abs(bx) < 2 and by > -3 else 1)
                    w = rnd.uniform(9, 12)
                    if rnd.random() < .5:
                        b = box('bld', (w, w, h), (cx - 6.5 + i * 13, cy - 6.5 + j * 13, h / 2), rnd.choice(wins))
                    else:
                        b = box('bld', (w, w, h), (cx - 6.5 + i * 13, cy - 6.5 + j * 13, h / 2), rnd.choice(walls))
                    box('roof', (w + .4, w + .4, .6), (b.location.x, b.location.y, h + .3), T('concrete', 2))
                    if rnd.random() < .4: box('tankhut', (2, 2, 2.4), (b.location.x + 2, b.location.y - 1, h + 1.8), S('#6a5040', .8))
            for k in range(3):
                lib.place(tree, (cx - 14.5, cy - 12 + k * 12, .2), rnd.uniform(0, 6), .5)
    for i in range(70):
        x = rnd.choice(range(-6, 7)) * 32 + 16; y = rnd.uniform(-190, 80)
        box('car', (1.8, 4.2, 1.4), (x + rnd.choice([-2, 2]), y, .75), S(rnd.choice(['#a8322b', '#22344a', '#e8e4dc', '#1a1a1a', '#c8a23a']), .2, coat=1), bevel=.3)
    env.fog((800, 800, 120), (0, 0, 60), density=.0012, col='#c8d4e4')
    camera((-70, -170, 120), (10, -20, 0), lens=26)

@scene
def car():
    FR('sunset', cands=['kloppenheim_02', 'golden_bay', 'evening_road_01', 'sunflowers'], strength=.8, rot=-30)
    sun(-75, 14, 3.4, color='#ffc890')
    env.street(-40, 40, 10, seed=21)
    env.model_t((0, -1.3, 0), math.radians(20))
    character('worker', (-.47, -1.47, .92), face='smug', look_at=(-.47 + 4.7, -1.47 + 1.7, 0), scale=.95, arms={'armL': (1.2, .6), 'armR': (1.1, .6)}, props=[])
    character('kid', (2.6, -3.6, 0), face='shock', look_at=(0, -1, 0))
    for x in (-8, 6): env.lamp((x, -6.2, .18), lit=True)
    camera((3.6, -5.6, .85), (0, -1, 1.0), lens=30, focus=(.4, -1.2, 1.0), fstop=3.2)

@scene
def ship():
    FR('sky', cands=['kloofendal_48d_partly_cloudy_puresky', 'qwantani_puresky', 'cloudy_vondelpark'], strength=1.1, rot=80)
    sun(-40, 24, 3.8, color='#ffe2bc')
    env.water((300, 300), (0, 0, 0), '#0e2a33', ocean=True, choppy=1.1, wave=1.3, res=11, seed=2)
    env.steamship((25, 70, 1.0), math.radians(-12))
    # foreground dock
    box('dock', (8, 30, .3), (-3, -6, 1.4), T('planks', 1.4, '#b49a78'))
    for x in (-6.6, .6):
        for y in range(-20, 10, 3): cyl('pile', .22, 6, (x, y, -1.4), T('planks', 1, '#6a5a48'), seg=12)
    buoy = lib.model(['lifebuoy']); lib.place(buoy, (.3, -1.5, 1.55), .4)
    bar = lib.model(['Barrel_01', 'barrel_03']); lib.place(bar, (-5.5, -2, 1.55), 0)
    character('sailor', (-1.2, -3.4, 1.55), face='talk', look_at=(-3.5, -8, 0), arms={'armL': (.3, .2), 'armR': (2.7, .3)})
    character('oldman', (-3.4, -1.6, 1.55), face='calm', look_at=(-1.2, -3.4, 0))
    camera((-4.2, -8.6, 2.5), (6, 30, 4), lens=26, focus=(-1.2, -3.4, 2.4), fstop=5.6)

@scene
def harbour():
    FR('harbour', cands=['industrial_sunset_02', 'dikhololo_sunset', 'harbour', 'pier'], strength=.8, rot=0)
    sun(-60, 18, 3.0, color='#ffd0a0')
    env.water((300, 300), (0, 0, 0), '#3a2412', ocean=True, choppy=.5, wave=.35, res=10)
    box('quay', (60, 10, 2.2), (0, -12, .6), T('stone', 2.5))
    for x in range(-25, 30, 10): env.facade(x, -17, 10, 12, T('brick', 2.5), rot=math.pi, seed=x + 99, shop=True)
    for i, (x, y) in enumerate(((-6, 2), (4, 6), (12, 1))): env.rowboat((x, y, .05), .3 * i)
    env.steamship((10, 40, 1.0), math.radians(-30), L=26, B=6, D=4, hull='#9a2a22', boot='#1a1a1a', funnel='#1d1d22')
    bar = lib.model(['Barrel_01', 'barrel_03'])
    for p in ((-3, -9.5), (-2.3, -9.2), (6, -9.8)): lib.place(bar, (p[0], p[1], 1.7), 0)
    character('fireman', (.2, -8.6, 1.7), face='worry', look_at=(-2, -14, 0))
    character('sailor', (1.4, -9.6, 1.7), face='sad', look_at=(.2, -8.6, 0))
    camera((-1.5, -13.6, 2.6), (2, 4, 1.8), lens=28, focus=(.4, -8.8, 2.4), fstop=4)

@scene
def courtroom():
    lib.world_color('#b8c8dc', .4)
    wp = T('woodpanel', 1.5, '#8a5a34'); fl = T('woodfloor', 2)
    plane('floor', 16, 20, (0, 0, 0), fl); box('wall_back', (16, .3, 9), (0, 8, 4.5), T('plaster', 2, '#e8dccb'))
    box('wainscot', (16, .1, 2.4), (0, 7.8, 1.2), wp)
    for sx in (-1, 1):
        env.wall_y(sx * 8, -10, 10, 9, T('plaster', 2, '#e8dccb'), holes=[(y, 2.0, 2.6, 6.8) for y in (-4, 1, 6)])
    box('ceiling', (16, 20, .3), (0, 0, 9), S('#e8e0d0', .9))
    sun(-90, 28, 6, color='#fff0d8', angle=.8)
    box('bench', (6, 1.6, 2.2), (0, 5.4, 1.1), wp, bevel=.04); box('benchtop', (6.4, 1.9, .12), (0, 5.4, 2.26), wp)
    box('dais', (7, 3, .6), (0, 5.8, .3), wp)
    box('seal', (1.4, .1, 1.4), (0, 7.6, 5.2), S('#c8a23a', .3, metal=1))
    for y in (-3, -1, 1):
        for sx in (-1, 1):
            box('pew', (4.5, .5, 1.0), (sx * 3.2, y - 3, .5), wp, bevel=.03)
    character('judge', (0, 5.8, .6), face='deadpan', look_at=(0, -6, 0), arms={'armL': (.3, .3), 'armR': (2.6, .5)})
    character('foreman', (.8, 1.8, 0), face='worry', look_at=(0, 5, 0), props=[])
    env.fog((15.5, 19.5, 8.8), (0, 0, 4.5), density=.025, col='#fff4e4', anis=.5)
    camera((-1.9, -2.2, 1.3), (0, 5.5, 3.2), lens=30, focus=(0, 5.6, 3.2), fstop=2.8)

@scene
def meadow_village():
    FR('meadow', cands=['meadow_2', 'kloofendal_48d_partly_cloudy', 'spruit_sunrise', 'rolling_hills'], strength=.9, rot=140)
    sun(-30, 32, 3.4)
    env.displaced_ground('grassy', (220, 220), (0, 40, -.3), strength=3.0, noise=20, scale=3, tint='#a8b070')
    env.grass_patch((26, 18), (0, -2, 0), count=160000, length=.18)
    path = plane('path', 1.8, 26, (2, -2, .02), T('dirt', 1.5)); path.rotation_euler = (0, 0, .25)
    for i, (x, y, r) in enumerate(((-7, 9, .2), (6, 12, -.3), (17, 22, .1))): env.cottage((x, y, 0), r, seed=i)
    tree = lib.model(['island_tree_02', 'island_tree_01', 'jacaranda_tree'])
    for p in ((-14, 16), (12, 4), (-3, 24), (25, 30), (-22, 30)): lib.place(tree, (p[0], p[1], 0), p[0], 1.0) if tree else env.proc_tree((p[0], p[1], 0))
    env.fence((-12, 2.5, 0), (-2, 4.5, 0))
    fl = [lib.model(['flower_gazania']), lib.model(['dandelion_01']), lib.model(['flower_ursinia'])]
    for i, f in enumerate(fl): env.scatter(f, 25, (-8, 8, -6, 3), seed=i)
    character('oldman', (-.4, -2.6, 0), face='calm', look_at=(-1.6, -7, 0), walk=.3)
    character('kid', (.8, -2.1, 0), face='happy', look_at=(-.4, -2.6, 0), arms={'armL': (.4, .2), 'armR': (2.5, .3)}, props=[])
    camera((-1.4, -6.6, .9), (.6, 6, 1.8), lens=28, focus=(0, -2.4, 1.2), fstop=3.2)

@scene
def forest_path():
    FR('forest', cands=['forest_slope', 'pine_attic', 'forest_cave', 'mossy_forest'], strength=.7, rot=0)
    sun(-20, 40, 2.6, color='#fff0d0', angle=2)
    env.ground('ground', (120, 120), scale=2.5)
    plane('path', 2.4, 60, (0, 10, .02), T('dirt', 1.5))
    env.grass_patch((10, 12), (-5.5, 0, .01), count=50000, length=.22, col1='#24361a', col2='#6a8a3a')
    env.grass_patch((10, 12), (5.5, 0, .01), count=50000, length=.22, col1='#24361a', col2='#6a8a3a')
    fir = lib.model(['fir_tree_01', 'pine_sapling_medium'])
    rnd = random.Random(4)
    for i in range(60):
        x = rnd.choice([-1, 1]) * rnd.uniform(2.6, 26); y = rnd.uniform(-4, 50)
        lib.place(fir, (x, y, 0), rnd.uniform(0, 6), rnd.uniform(.8, 1.3)) if fir else env.proc_tree((x, y, 0), 9, 2, seed=i, leaf='#2a3f1e')
    fern = lib.model(['fern_02']); env.scatter(fern, 30, (-6, 6, -2, 14), seed=2, avoid=lambda p: abs(p[0]) < 1.4)
    rock = lib.model(['boulder_01']); env.scatter(rock, 6, (-8, 8, 2, 20), seed=5, avoid=lambda p: abs(p[0]) < 2, scale=(.4, .8))
    character('worker', (-.3, -.6, 0), face='worry', look_at=(-1.3, -6, 0), walk=.5)
    character('mother', (.5, .4, 0), face='sideeye', look_at=(-.3, -.6, 0), props=[])
    env.fog((60, 70, 14), (0, 20, 7), density=.02, col='#d0dcd0', anis=.4)
    camera((-1.2, -4.6, 1.15), (.3, 6, 1.6), lens=30, focus=(0, -.2, 1.3), fstop=2.8)

@scene
def desert():
    FR('desert', cands=['kiara_1_dawn', 'goegap', 'qwantani', 'aerial_beach'], strength=1.0, rot=0)
    sun(-60, 20, 4.4, color='#ffd8a8')
    env.displaced_ground('sand', (400, 400), (0, 100, 0), strength=6, noise=35, sub=300, scale=2.5, tint='#e8c890')
    plane('sandnear', 30, 30, (0, 0, .05), T('sand', 1.2, '#e8c890'))
    for i, (x, y, s) in enumerate(((-40, 150, 70), (35, 220, 55), (90, 320, 40))):
        cone = cyl('pyramid', s, s * .95, (x, y, s * .45), T('stone', 3, '#d8b888'), seg=4, r2=0.01, smooth=False); cone.rotation_euler = (0, 0, math.radians(45 + i * 10))
    rock = lib.model(['namaqualand_boulder_02', 'boulder_01']); env.scatter(rock, 8, (-14, 14, -2, 20), seed=1, scale=(.5, 1.2), avoid=lambda p: abs(p[0]) < 2.5 and p[1] < 6)
    character('worker', (-.2, -1.0, .05), face='shock', look_at=(-1.4, -6, 0), spec_over={'hat': 'helmet', 'hatCol': '#e8dcc0'})
    character('sailor', (1.0, -.2, .05), face='deadpan', look_at=(-.2, -1.0, 0), spec_over={'hat': 'flatcap', 'hatCol': '#c8b090'})
    camera((-1.6, -5.4, .7), (2, 40, 3), lens=28, focus=(0, -.6, 1.2), fstop=4)

@scene
def snow_mountain():
    FR('snow', cands=['snowy_field', 'snowy_park_01', 'snowy_forest_path_01', 'winter_sky'], strength=1.0, rot=0)
    sun(-30, 22, 3.0, color='#fff2e0')
    env.displaced_ground('snow', (300, 300), (0, 80, 0), strength=14, noise=40, sub=260, scale=3)
    plane('snownear', 30, 30, (0, 0, .05), T('snow', 1.5))
    for i, (x, y, h) in enumerate(((-60, 200, 90), (40, 260, 120), (120, 230, 80))):
        m = cyl('mountain', h * 1.1, h, (x, y, h / 2 - 5), T('rock', 6, '#c0c4cc'), seg=7, r2=2, smooth=False)
        tx = bpy.data.textures.new('mt', 'CLOUDS'); tx.noise_scale = 18
        sub = m.modifiers.new('s', 'SUBSURF'); sub.levels = 3; sub.render_levels = 4; sub.subdivision_type = 'SIMPLE'
        d = m.modifiers.new('d', 'DISPLACE'); d.texture = tx; d.strength = 16
        cap = cyl('snowcap', h * .45, h * .42, (x, y, h * .82 - 5), T('snow', 4), seg=7, r2=1.5, smooth=False)
        s2 = cap.modifiers.new('s', 'SUBSURF'); s2.levels = 3; s2.render_levels = 3; s2.subdivision_type = 'SIMPLE'
        d2 = cap.modifiers.new('d', 'DISPLACE'); d2.texture = tx; d2.strength = 17
    env.cottage((6, 14, 0), -.3, wall='planks', roof='planks', lit=True, seed=3)
    fir = lib.model(['fir_tree_01'])
    rnd = random.Random(9)
    for i in range(30):
        x, y = rnd.uniform(-30, 30), rnd.uniform(6, 60)
        if abs(x - 6) < 6 and abs(y - 14) < 6: continue
        lib.place(fir, (x, y, 0), rnd.uniform(0, 6), rnd.uniform(.7, 1.3))
    character('oldman', (-.3, -1.0, .05), face='sad', look_at=(-1.6, -6, 0), spec_over={'hat': 'beanie', 'hatCol': '#7a2b2b', 'scarf': '#7a2b2b'})
    character('fireman', (.9, -.2, .05), face='worry', look_at=(-.3, -1, 0))
    env.fog((200, 200, 30), (0, 60, 15), density=.004, col='#e8eef8')
    camera((-1.5, -5.2, 1.0), (2, 20, 3), lens=28, focus=(0, -.6, 1.2), fstop=4)

@scene
def factory():
    lib.world_color('#9fb4cc', .5)
    plane('floor', 30, 40, (0, 0, 0), T('concrete', 2.5))
    for sx in (-1, 1):
        env.wall_y(sx * 15, -20, 20, 12, T('brick', 2.5), holes=[(y, 3.4, 4, 9) for y in range(-16, 18, 6)])
    box('wall_back', (30, .4, 12), (0, 20, 6), T('brick', 2.5)); box('roof', (30, 40, .3), (0, 0, 12), T('metal', 3))
    for y in range(-16, 20, 6): box('truss', (30, .3, .6), (0, y, 11.4), env.iron())
    sun(-80, 35, 7, color='#fff2dc', angle=.6)
    pipes = lib.model(['modular_industrial_pipes_01', 'modular_pipes']); lib.place(pipes, (-12, 6, 0), 0)
    for i, p in enumerate(((-4, 8), (4, 9), (-2, 14))):
        env.tank((p[0], p[1], 0), r=1.8, h=5, col='#7a5634')
    bar = lib.model(['Barrel_01', 'barrel_03']); env.scatter(bar, 10, (-12, 12, -8, 6), seed=3, avoid=lambda p: abs(p[0]) < 3)
    crane = lib.model(['overhead_crane']); lib.place(crane, (0, 4, 8), 0)
    character('worker', (-.6, -2.2, 0), face='angry', look_at=(-1.4, -8, 0), props=[{'type': 'brush', 'hand': 'R'}])
    character('foreman', (.9, -1.0, 0), face='smug', look_at=(-.6, -2.2, 0))
    env.fog((29.5, 39.5, 11.5), (0, 0, 6), density=.03, col='#fff4e4', anis=.6)
    camera((-1.8, -6.6, 1.3), (1, 10, 3), lens=26, focus=(0, -1.8, 1.4), fstop=2.8)

@scene
def night_alley():
    FR('night', cands=['moonless_golf', 'dikhololo_night', 'satara_night', 'cobblestone_street_night'], strength=.25, rot=0)
    env.ground('cobble', (40, 80), scale=1.6)
    wet = plane('puddles', 40, 80, (0, 0, .01), S('#0a0c10', .02, spec=1.0, alpha=1.0)); wet.data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = .45
    rnd = random.Random(3)
    for sx in (-1, 1):
        for i, y in enumerate(range(-10, 40, 8)):
            env.facade(sx * 4.5, y, 8, rnd.uniform(10, 18), T(rnd.choice(env.PALETTE_WALLS), 2.5), rot=-sx * math.pi / 2, seed=i * 3 + sx, lit=.45)
    for i, (x, y, z, c) in enumerate(((-4.3, 2, 4.2, '#ff3a6a'), (4.3, 7, 3.6, '#3ad8ff'), (-4.3, 14, 5, '#ffcf4a'), (4.3, 20, 4.4, '#7aff6a'))):
        box('neon', (.1, 2.2, .5), (x, y, z), S('#fff', .3, emit=c, emit_strength=30))
        lib.point((x * .8, y, z), 220, c, .4)
    env.lamp((3.6, -2, 0))
    ash = lib.model(['metal_trash_can']); lib.place(ash, (-3.6, 1, 0), 0)
    box('steam', (1, 1, 1), (0, 0, -10))
    character('sailor', (-.4, -.4, 0), face='sideeye', look_at=(-1.5, -6, 0))
    character('worker', (.7, .6, 0), face='talk', look_at=(-.4, -.4, 0), props=[])
    env.fog((9, 60, 20), (0, 15, 10), density=.03, col='#b8c4d8', anis=.3)
    camera((-1.4, -4.8, 1.0), (.5, 10, 2.2), lens=28, focus=(0, -.1, 1.3), fstop=2.2)

@scene
def classroom():
    lib.world_color('#b8d0e8', .6)
    plane('floor', 12, 14, (0, 0, 0), T('woodfloor', 1.5)); box('ceil', (12, 14, .2), (0, 0, 4.2), S('#f0ece4', .9))
    box('wall_back', (12, .2, 4.2), (0, 7, 2.1), T('plaster', 2, '#d8e0c8'))
    box('board', (6, .1, 2.0), (0, 6.88, 2.0), S('#1f2a24', .85)); box('boardframe', (6.3, .08, 2.3), (0, 6.92, 2.0), T('woodpanel', 1))
    for k in range(5): box('chalk', (rnd_w := .8 + k * .1, .02, .03), (-2.4 + k * 1.1, 6.82, 2.4 - k * .25), S('#e8e8e0', .9))
    env.wall_y(-6, -7, 7, 4.2, T('plaster', 2, '#d8e0c8'), holes=[(y, 1.8, 1.0, 3.4) for y in (-3, 1, 5)], t=.2)
    box('wall_r', (.2, 14, 4.2), (6, 0, 2.1), T('plaster', 2, '#d8e0c8'))
    sun(-90, 30, 6, color='#fff2dc', angle=.6)
    desk = lib.model(['SchoolDesk_01']); chair = lib.model(['SchoolChair_01'])
    for r in range(3):
        for c in range(3):
            x, y = -3 + c * 3, -2 + r * 2.4
            lib.place(desk, (x, y, 0), math.pi) if desk else box('desk', (1.2, .6, .75), (x, y, .375), T('woodpanel', 1))
            lib.place(chair, (x, y - .7, 0), math.pi)
    character('mother', (1.6, 5.6, 0), face='angry', look_at=(0, -4, 0), arms={'armL': (.3, .2), 'armR': (2.2, .4)}, props=[])
    character('kid', (-.1, -1.6, 0), face='sideeye', look_at=(-1, -6, 0), props=[])
    character('kid', (-3.1, .7, 0), face='happy', look_at=(1.6, 5.6, 0), props=[], spec_over={'hatCol': '#7a2b2b'})
    env.fog((11.5, 13.5, 4), (0, 0, 2.1), density=.02, col='#fff4e4', anis=.5)
    camera((-.9, -4.6, .95), (.6, 6, 1.9), lens=26, focus=(0, -1.6, 1.0), fstop=2.8)

@scene
def molasses_flow():
    """Mantaflow viscous liquid: a tank bursts and the wave runs down a street."""
    FR('sunny', cands=['kloppenheim_06', 'urban_street_01', 'street_lamp'], strength=.7, rot=10)
    sun(-40, 26, 3.6, color='#ffe2c0')
    sc = bpy.context.scene
    env.street(-30, 30, 10, seed=31, both=True)
    cyl('tankbase', 5.2, .6, (24, 0, .3), T('concrete', 1.5), seg=64)
    # broken tank wall pieces
    for k in range(6):
        a = math.radians(-60 + k * 25)
        box('shard', (2.6, .12, 3 + k % 3), (24 + math.cos(a + math.pi) * 6.5, math.sin(a) * 6, 1.6), T('rust', 2, '#5a3a24'), rot=(.3, .2 * k, a))
    dom = box('domain', (44, 10, 7), (6, 0, 3.4), None)
    md = dom.modifiers.new('fluid', 'FLUID'); md.fluid_type = 'DOMAIN'; ds = md.domain_settings
    ds.domain_type = 'LIQUID'; ds.resolution_max = 96 if lib.DRAFT else 180; ds.use_mesh = True
    ds.cache_directory = '/tmp/molasses_cache'; ds.cache_type = 'ALL'
    ds.cache_frame_start = 1; ds.cache_frame_end = 70
    ds.mesh_scale = 2 if not lib.DRAFT else 1
    try:
        ds.use_viscosity = True; ds.viscosity_value = float(__import__('os').environ.get('VISC', .12))
    except Exception as e: lib.log('viscosity', e)
    ds.use_collision_border_front = True; ds.use_collision_border_back = True
    liq = cyl('liquid', 4.6, 6.6, (23.5, 0, 3.4), None, seg=32)
    lm = liq.modifiers.new('fluid', 'FLUID'); lm.fluid_type = 'FLOW'; fs = lm.flow_settings
    fs.flow_type = 'LIQUID'; fs.flow_behavior = 'GEOMETRY'; fs.use_initial_velocity = True; fs.velocity_coord = (-6, 0, 0)
    liq.hide_render = True
    gr = box('floorcol', (60, 12, .2), (0, 0, .05), None); gm = gr.modifiers.new('fluid', 'FLUID'); gm.fluid_type = 'EFFECTOR'
    gr.hide_render = True
    for o in (gr,): o.display_type = 'WIRE'
    sc.frame_start = 1; sc.frame_end = 70
    sc.render.fps = 24
    with bpy.context.temp_override(scene=sc, active_object=dom, object=dom, selected_objects=[dom]):
        t0 = __import__('time').time(); r = bpy.ops.fluid.bake_all(); lib.log('bake', r, f'{__import__("time").time() - t0:.0f}s')
    sc.frame_set(int(__import__('os').environ.get('FLUID_FRAME', 44)))
    m = lib.mat('molasses', '#2a1206', rough=.14, sss=.2, coat=.5, spec=.7)
    b = m.node_tree.nodes['Principled BSDF']; b.inputs['Subsurface Radius'].default_value = (.6, .25, .08); b.inputs['Subsurface Scale'].default_value = .3
    dom.data.materials.clear(); dom.data.materials.append(m)
    character('worker', (-3.0, -1.6, 0), face='shock', look_at=(-8.5, -4.6, 0), walk=.8, arms={'armL': (2.4, .3), 'armR': (2.6, .2)}, props=[])
    character('kid', (-4.4, 1.0, 0), face='shock', look_at=(-8.5, -4.6, 0), walk=.8, arms={'armL': (2.8, .1), 'armR': (2.5, .2)}, props=[])
    camera((-9.0, -3.6, 1.1), (6, 1, 2.0), lens=24, focus=(-3, -1.6, 1.2), fstop=4)
