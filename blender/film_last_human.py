"""'Last human alive' - sets and 35 shots. Each shot builds its own scene; frames are local (1..n)."""
import bpy, math, random, os, json
from mathutils import Vector
import lib, env, chars, anim
from lib import box, cyl, sphere, plane, torus, point, area, sun, mat, lin
from env import T, S
from anim import Actor, Cam, text, key_emit, key_light, constant, linear

FPS = 24
HERO = dict(name='worker')            # same ink character as the previews

def hero(**kw):
    return Actor('worker', **kw)

def hdri(cands, kw=('outdoor',), strength=1.0, rot=0.0):
    try:
        aid = lib.ph_pick('hdris', list(cands), *kw)
        lib.world_hdri(aid=aid, strength=strength, rot=rot)
    except Exception as e:
        lib.log('hdri', e); lib.world_color('#9fb4cc', strength)

DAY = ['urban_street_01', 'kloppenheim_06', 'cobblestone_street_night']
DUSK = ['kloppenheim_02', 'industrial_sunset_02', 'dikhololo_sunset', 'evening_road_01']
NIGHT = ['dikhololo_night', 'moonless_golf', 'satara_night', 'cobblestone_street_night']
SKY = ['kloofendal_48d_partly_cloudy_puresky', 'kloofendal_43d_clear_puresky', 'qwantani_puresky']

def exposure(v): bpy.context.scene.view_settings.exposure = v

# =========================================================================== sets
def set_street(mood='day', cafe=False, msg=False, lamps_lit=None, seed=11):
    if mood == 'day': hdri(DAY, strength=.9, rot=20); sun(-40, 34, 4.2, color='#fff0dc'); exposure(.35)
    elif mood == 'dusk': hdri(DUSK, strength=.8, rot=-30); sun(-75, 9, 3.2, color='#ffb878'); exposure(.55)
    else: hdri(NIGHT, strength=.35); exposure(.6)
    env.street(-70, 70, 10, seed=seed, awnings=['#7a2b2b', '#2f5a4a', '#c8a23a'])
    for x, ang, col in ((-14, 0, '#7a1f1a'), (9, 0, '#14161a'), (24, math.pi, '#2a3f5a')):
        env.model_t((x, -3.6, 0), ang, paint=col)
    lamps = []
    for i, x in enumerate(range(-30, 31, 10)):
        lit = (mood != 'day') if lamps_lit is None else lamps_lit
        r = env.lamp((x, -5.6, .18), lit=False)
        lm = mat('lampglass%d' % i, '#fff1d0', rough=.2, emit='#ffd38a', emit_strength=8 if lit else 0)
        for c in r.children:
            if c.name.startswith('lantern') and c.type == 'MESH': c.data.materials.clear(); c.data.materials.append(lm)
        pl = point((x, -5.6, 4.5), 120 if lit else 0, '#ffcf88', .15)
        lamps.append((x, lm, pl))
    if cafe:
        tbl = lib.model(['WoodenTable_01', 'CoffeeTable_01']); ch = lib.model(['WoodenChair_01', 'SchoolChair_01'])
        lib.place(tbl, (-4, 6.4, .18), 0); lib.place(ch, (-4.7, 6.4, .18), -math.pi / 2); lib.place(ch, (-3.3, 6.4, .18), math.pi / 2)
    if msg:
        text('HELLO?', (3.5, 7.93, 6.4), size=2.6, col='#c8281e', extrude=.005)
        text('ANYONE?', (-14, 7.93, 9.0), size=2.2, col='#e8e2d0', extrude=.005)
    return dict(lamps=lamps)

def traffic_light(loc):
    cyl('tlpole', .08, 4.2, (loc[0], loc[1], 2.1), env.iron(), seg=12)
    box('tlbox', (.4, .35, 1.2), (loc[0], loc[1] + .1, 4.6), S('#2a3a2a', .5), bevel=.04)
    ms = []
    for i, c in enumerate(('#ff2a1a', '#ffb81a', '#2aff6a')):
        m = mat('tl%d' % i, '#111111', rough=.2, emit=c, emit_strength=0)
        sphere('tlamp', .12, (loc[0], loc[1] + .29, 4.98 - i * .37), m, seg=16, rings=8, scale=(1, .4, 1)); ms.append(m)
    return ms

def room(w, d, h, wall='#e8dccb', floor='woodfloor', windows=(), night=False, front=False):
    """Room centred on origin, floor at z=0. Windows on the -x wall: list of (y, width, z0, z1)."""
    plane('floor', w, d, (0, 0, 0), T(floor, 1.6))
    box('ceiling', (w, d, .2), (0, 0, h + .1), S('#efe9e0', .9))
    wm = T('plaster', 2, wall)
    box('wall_back', (w, .2, h), (0, d / 2 + .1, h / 2), wm)
    box('wall_r', (.2, d, h), (w / 2 + .1, 0, h / 2), wm)
    if front: box('wall_f', (w, .2, h), (0, -d / 2 - .1, h / 2), wm)
    env.wall_y(-w / 2 - .1, -d / 2, d / 2, h, wm, holes=list(windows), t=.2)
    box('skirting', (w, .03, .12), (0, d / 2 - .015, .06), S('#f2efe8', .5))
    for (y, ww, z0, z1) in windows:
        if night:
            area((-w / 2 - .6, y, (z0 + z1) / 2), (0, y, (z0 + z1) / 2 - .3), max(ww, z1 - z0), 120, '#7a9cff')
        else:
            area((-w / 2 - .6, y, (z0 + z1) / 2), (0, y, (z0 + z1) / 2 - .5), max(ww, z1 - z0), 900, '#fff1dc')
        box('curtainL', (.08, .35, z1 - z0 + .6), (-w / 2 + .1, y - ww / 2 - .2, (z0 + z1) / 2 + .2), S('#8a3a2a', .9))
        box('curtainR', (.08, .35, z1 - z0 + .6), (-w / 2 + .1, y + ww / 2 + .2, (z0 + z1) / 2 + .2), S('#8a3a2a', .9))
    if night: lib.world_color('#0a1020', .25)
    else: lib.world_color('#cfdcef', .9)
    area((0, 0, h - .05), (0, 0, 0), min(w, d) * .6, 60 if night else 220, '#fff4e6')

def bed(loc, w=1.6, l=2.1, blanket='#3a5a8a'):
    x, y = loc
    box('bedframe', (w + .1, l + .1, .35), (x, y, .175), T('woodpanel', 1, '#8a5a34'), bevel=.03)
    box('headboard', (w + .1, .1, 1.1), (x, y + l / 2 + .05, .55), T('woodpanel', 1, '#8a5a34'), bevel=.03)
    box('mattress', (w, l, .22), (x, y, .46), S('#f2efe8', .8), bevel=.05, seg=3)
    box('blanket', (w + .06, l * .62, .08), (x, y - l * .18, .6), S(blanket, .9), bevel=.04, seg=3)
    box('pillow', (w * .7, .4, .16), (x, y + l / 2 - .3, .63), S('#f6f3ee', .85), bevel=.07, seg=3)

def old_radio(loc, rot=0.0):
    r = bpy.data.objects.new('radio', None); bpy.context.scene.collection.objects.link(r)
    def P(o): o.parent = r; return o
    P(box('radiobody', (.56, .28, .38), (0, 0, .19), T('woodpanel', .6, '#9a5a2a'), bevel=.05, seg=4))
    P(box('grille', (.3, .02, .22), (-.08, -.14, .21), S('#3a2a1e', .95)))
    for k in range(5): P(box('slat', (.3, .025, .012), (-.08, -.152, .13 + k * .04), T('woodpanel', .6, '#7a4220')))
    dial = mat('dial', '#2a1a08', rough=.15, emit='#ffb050', emit_strength=6)
    P(cyl('dialwin', .07, .02, (.17, -.145, .25), dial, rot=(math.pi / 2, 0, 0), seg=32))
    P(box('needle', (.004, .01, .1), (.17, -.158, .25), S('#c82a1a', .4)))
    for kx in (.12, .22): P(cyl('knob', .03, .04, (kx, -.155, .1), S('#2a1a10', .4, coat=.4), rot=(math.pi / 2, 0, 0), seg=20))
    lamp = point((0, -.4, .3), 25, '#ffb050', .05); lamp.parent = r
    r.location = loc; r.rotation_euler = (0, 0, rot)
    return r, dial, lamp

def set_bedroom(night=False, radio=True):
    room(5, 5.5, 2.8, '#d8c8b0', windows=[(0.4, 1.3, .9, 2.3)], night=night)
    if not night: sun(-90, 25, 5, color='#ffe8c8', angle=1.0)
    else: exposure(.4)
    bed((.9, 1.5), blanket='#3a5a8a')
    ns = lib.model(['ClassicNightstand_01']); lib.place(ns, (-.35, 2.4, 0), 0) or box('nightstand', (.5, .45, .6), (-.35, 2.4, .3), T('woodpanel', 1))
    box('phone', (.09, .17, .012), (-.35, 2.3, .62), S('#111111', .2, coat=1))
    scr = mat('phonescr', '#000000', rough=.1, emit='#bcd8ff', emit_strength=0)
    box('screen', (.08, .155, .002), (-.35, 2.3, .627), scr)
    box('desk', (.7, 1.4, .05), (2.1, -1.2, .75), T('woodpanel', 1, '#7a4a28'), bevel=.01)
    for dy in (-.6, .6): box('deskleg', (.6, .05, .75), (2.1, -1.2 + dy, .375), T('woodpanel', 1, '#7a4a28'))
    ch = lib.model(['WoodenChair_01', 'SchoolChair_01']); lib.place(ch, (1.45, -1.2, 0), -math.pi / 2)
    out = dict(screen=scr)
    if radio:
        r, dial, lamp = old_radio((2.2, -1.2, .775), -math.pi / 2); out.update(dial=dial, rlamp=lamp)
        cyl('micstand', .012, .3, (2.0, -1.65, .92), S('#888888', .3, metal=1), seg=8)
        sphere('mic', .045, (2.0, -1.65, 1.1), S('#333333', .35, metal=.6), seg=16, rings=8, scale=(1, 1, 1.4))
    lampm = mat('bedlamp', '#fff1d0', .3, emit='#ffcf88', emit_strength=4 if night else 0)
    cyl('lampbase', .06, .3, (-.25, 2.55, .75), S('#c8a23a', .3, metal=1), seg=16)
    cyl('lampshade', .16, .22, (-.25, 2.55, 1.0), lampm, seg=24, r2=.1)
    if night: point((-.25, 2.55, 1.0), 25, '#ffcf88', .1)
    poster = mat('poster', '#c8a23a', .8); box('poster', (.7, .02, 1.0), (1.2, 2.73, 1.7), poster)
    return out

def tv_set(loc, rot=0.0):
    r = bpy.data.objects.new('tv', None); bpy.context.scene.collection.objects.link(r)
    def P(o): o.parent = r; return o
    P(box('tvbody', (.9, .55, .7), (0, 0, .35), S('#5a3a24', .45, coat=.4), bevel=.06, seg=4))
    m = bpy.data.materials.new('static'); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links
    b = N['Principled BSDF']; nz = N.new('ShaderNodeTexNoise'); nz.noise_dimensions = '4D'; nz.inputs['Scale'].default_value = 900; nz.inputs['Detail'].default_value = 0
    rr = N.new('ShaderNodeMapRange'); rr.inputs[1].default_value = .35; rr.inputs[2].default_value = .65
    L.new(nz.outputs['Fac'], rr.inputs['Value'])
    mixc = N.new('ShaderNodeMixRGB'); mixc.inputs['Color1'].default_value = (.02, .02, .03, 1); mixc.inputs['Color2'].default_value = (.85, .9, 1, 1)
    L.new(rr.outputs[0], mixc.inputs['Fac'])
    L.new(mixc.outputs['Color'], b.inputs['Base Color']); L.new(mixc.outputs['Color'], b.inputs['Emission Color'])
    b.inputs['Emission Strength'].default_value = 3.0; b.inputs['Roughness'].default_value = .1
    nz.inputs['W'].default_value = 0; nz.inputs['W'].keyframe_insert('default_value', frame=1)
    nz.inputs['W'].default_value = 400; nz.inputs['W'].keyframe_insert('default_value', frame=400)
    for fc in m.node_tree.animation_data.action.fcurves:
        for k in fc.keyframe_points: k.interpolation = 'LINEAR'
    scr = P(box('tvscreen', (.66, .02, .48), (-.06, -.28, .38), m, bevel=.03))
    P(box('tvpanel', (.12, .02, .5), (.36, -.28, .36), S('#c8b090', .4, metal=.5)))
    for k in range(3): P(cyl('tvknob', .025, .03, (.36, -.3, .5 - k * .1), S('#222', .4), rot=(math.pi / 2, 0, 0), seg=16))
    for sx in (-.35, .35): P(cyl('tvleg', .02, .45, (sx, 0, -.2), S('#222', .4), seg=8))
    glow = point((0, -.9, .4), 30, '#cfdcff', .3); glow.parent = r
    r.location = (loc[0], loc[1], loc[2] + .45); r.rotation_euler = (0, 0, rot)
    return r, m, scr, glow

def set_living(night=False):
    room(6, 6, 2.9, '#c8d0c0', windows=[(1.2, 1.6, .9, 2.4)], night=night)
    if not night: sun(-90, 28, 4.5, color='#fff0d8', angle=1)
    sofa = lib.model(['Sofa_01']); lib.place(sofa, (0, -1.6, 0), math.pi)
    tbl = lib.model(['CoffeeTable_01']); lib.place(tbl, (0, -.3, 0), 0)
    plane('rug', 2.6, 2.0, (0, -.6, .005), S('#7a2b2b', .95))
    tv = tv_set((0, 1.9, 0), 0)
    flamp = mat('floorlamp', '#fff1d0', .3, emit='#ffcf88', emit_strength=3)
    cyl('flpole', .02, 1.5, (-2.2, 2.3, .75), S('#222', .4), seg=8); cyl('flshade', .22, .3, (-2.2, 2.3, 1.6), flamp, seg=24, r2=.14)
    point((-2.2, 2.3, 1.5), 40, '#ffcf88', .15)
    shelf = lib.model(['Shelf_01']); lib.place(shelf, (2.6, 1.8, 0), -math.pi / 2)
    return dict(tv=tv)

def computer(loc):
    box('cdesk', (1.4, .7, .05), (loc[0], loc[1], .75), T('woodpanel', 1, '#7a4a28'))
    for dx in (-.65, .65): box('cleg', (.05, .65, .75), (loc[0] + dx, loc[1], .375), T('woodpanel', 1, '#7a4a28'))
    box('monitor', (.55, .45, .45), (loc[0], loc[1] + .05, 1.0), S('#d8d0c0', .5), bevel=.04)
    scr = mat('crt', '#020a04', rough=.05, emit='#30ff70', emit_strength=0)
    box('crtscreen', (.42, .02, .32), (loc[0], loc[1] - .18, 1.02), scr, bevel=.02)
    box('keyboard', (.45, .16, .03), (loc[0], loc[1] - .25, .79), S('#d8d0c0', .5), bevel=.01)
    t1 = text('CONNECTED', (loc[0], loc[1] - .195, 1.06), size=.055, col='#40ff80', emit=6, extrude=0)
    t2 = text('> online_', (loc[0] - .08, loc[1] - .195, .98), size=.04, col='#40ff80', emit=6, extrude=0)
    return scr, t1, t2

def set_city(mood='day', msg=False, seed=2, blocks=6, rooftop=None):
    if mood == 'day': hdri(SKY, strength=1.0, rot=120); sun(140, 28, 4.2, color='#ffe2c0'); exposure(.3)
    else: hdri(DUSK, strength=.7, rot=-40); sun(-60, 6, 3.0, color='#ff9a58'); exposure(.7)
    rnd = random.Random(seed)
    env.ground('asphalt', (600, 600), scale=4)
    lit = .08 if mood == 'day' else .45
    wins = [lib.mat_windows('win%d' % i, c, lit_ratio=lit, emit=1.2 if mood == 'day' else 4) for i, c in enumerate(['#8a4a3a', '#a89a88', '#6a5a4a', '#c8b8a0'])]
    walls = [T('brick', 4), T('brick2', 4), T('plaster', 4, '#e0d4c0'), T('concrete', 4)]
    roof = T('concrete', 2); side = T('pavers', 2)
    tree = lib.model(['island_tree_01', 'jacaranda_tree'])
    tops = []
    for bx in range(-blocks, blocks + 1):
        for by in range(-blocks, blocks + 1):
            cx, cy = bx * 32, by * 32
            if (bx, by) == (1, 1):
                env.grass_patch((26, 26), (cx, cy, .05), count=24000, length=.12)
                for k in range(5): lib.place(tree, (cx + rnd.uniform(-9, 9), cy + rnd.uniform(-9, 9), 0), rnd.uniform(0, 6), rnd.uniform(.9, 1.2))
                continue
            box('sidewalk', (27, 27, .2), (cx, cy, .1), side)
            for i in range(2):
                for j in range(2):
                    h = rnd.choice([12, 15, 18, 22, 28, 36]) * (1.4 if abs(bx) + abs(by) < 3 else 1)
                    w = rnd.uniform(10, 12.4); p = (cx - 6.5 + i * 13, cy - 6.5 + j * 13)
                    box('bld', (w, w, h), (p[0], p[1], h / 2), rnd.choice(wins) if rnd.random() < .6 else rnd.choice(walls))
                    box('roof', (w + .4, w + .4, .5), (p[0], p[1], h + .25), roof)
                    if rnd.random() < .35: box('hut', (2.2, 2.2, 2.4), (p[0] + 2, p[1] - 1.5, h + 1.7), S('#6a5040', .8))
                    tops.append((p[0], p[1], h + .5, w))
            for k in range(rnd.randint(0, 3)):
                box('car', (1.8, 4.2, 1.3), (cx + 15, cy + rnd.uniform(-12, 12), .7), S(rnd.choice(['#a8322b', '#22344a', '#e8e4dc', '#1a1a1a', '#c8a23a']), .2, coat=1), bevel=.3)
    if msg:
        x, y, h, w = min(tops, key=lambda t: abs(t[0] - 13) + abs(t[1] + 19))
        t = text('HELLO?', (x, y, h + .02), rot=(0, 0, 0), size=w * .28, col='#f2efe8', extrude=0)
        x, y, h, w = min(tops, key=lambda t: abs(t[0] + 19) + abs(t[1] - 13))
        text('HELP', (x, y, h + .02), rot=(0, 0, .3), size=w * .3, col='#e8c23a', extrude=0)
    env.fog((900, 900, 160), (0, 0, 80), density=.0009 if mood == 'day' else .0016, col='#c8d4e4' if mood == 'day' else '#e8b890')
    return tops

def set_market():
    hdri(DAY, strength=.9, rot=200); sun(30, 36, 4.0, color='#ffe8c8'); exposure(.35)
    env.ground('cobble', (90, 90))
    rnd = random.Random(5)
    for i, x in enumerate(range(-24, 25, 9)):
        env.facade(x, 14, 9, rnd.uniform(10, 16), T(rnd.choice(env.PALETTE_WALLS), 2.5), seed=i, awning=rnd.choice(['#7a2b2b', '#2f5a4a']))
        env.facade(-20, x, 9, rnd.uniform(10, 15), T(rnd.choice(env.PALETTE_WALLS), 2.5), rot=math.pi / 2, seed=i + 20)
        env.facade(20, x, 9, rnd.uniform(10, 15), T(rnd.choice(env.PALETTE_WALLS), 2.5), rot=-math.pi / 2, seed=i + 40)
        env.facade(x, -18, 9, rnd.uniform(10, 15), T(rnd.choice(env.PALETTE_WALLS), 2.5), rot=math.pi, seed=i + 60)
    import scenes
    pr = scenes.produce(); cl = [('#b8332a', '#efe6d4'), ('#2f5a7a', '#efe6d4'), ('#3f6b3a', '#e8d8a8'), ('#c8932a', '#5a2a22')]
    k = 0
    for row in (-1, 1):
        for x in (-9, -5, -1, 3, 7):
            c = cl[k % 4]; env.stall((x + row * 1.2, row * 3.6 + 4, 0), 0 if row < 0 else math.pi, c[0], c[1], seed=k, produce=[pr[(k + j) % len(pr)] for j in range(3)]); k += 1
    cart = lib.model(['CoffeeCart_01']); lib.place(cart, (8.5, -2, 0), 2.4)

def set_clocks():
    lib.world_color('#d8d0c0', .5); exposure(.3)
    wp = T('woodpanel', 1.2, '#7a4a28')
    box('clockwall', (10, .3, 5), (0, 1.2, 2.5), wp); plane('floor', 12, 8, (0, -2, 0), T('woodfloor', 1.5))
    area((0, -4, 3.5), (0, 1, 2.2), 5, 900, '#fff0dc'); area((-4, -2, 2.2), (0, 1, 2), 2, 250, '#ffd8a8')
    face = lib.mat_image('clockface', os.path.join(lib.TEX, 'props', 'clock.png'), rough=.35)
    rnd = random.Random(4); hands = []
    spots = []
    for i in range(40):
        for _ in range(30):
            r = rnd.uniform(.18, .42); x = rnd.uniform(-4.4, 4.4); z = rnd.uniform(.6, 4.4)
            if all((Vector((x, z)) - Vector((a, b))).length > r + c + .05 for a, b, c in spots): break
        else: continue
        spots.append((x, z, r))
        rim = rnd.choice(['#c8a23a', '#2a1a10', '#6a3a20', '#d8d0c0', '#8a2a20'])
        cyl('rim', r + .03, .08, (x, 1.0, z), S(rim, .35, metal=.8 if rim == '#c8a23a' else 0, coat=.3), rot=(math.pi / 2, 0, 0), seg=48)
        fc = cyl('face', r, .02, (x, .955, z), face, rot=(math.pi / 2, 0, 0), seg=48)
        me = fc.data
        if not me.uv_layers: me.uv_layers.new()
        uv = me.uv_layers.active.data
        for p in me.polygons:
            for li in p.loop_indices:
                v = me.vertices[me.loops[li].vertex_index].co; uv[li].uv = (.5 + .5 * v.x / r, .5 + .5 * v.y / r)
        hh = box('hourhand', (.025, .01, r * .5), (0, 0, r * .22), S('#1a1410', .4)); mh = box('minhand', (.018, .01, r * .75), (0, 0, r * .34), S('#1a1410', .4))
        sh = box('sechand', (.008, .01, r * .85), (0, 0, r * .36), S('#b8231a', .4))
        piv = []
        for hnd in (hh, mh, sh):
            e = bpy.data.objects.new('piv', None); bpy.context.scene.collection.objects.link(e); e.location = (x, .93, z)
            hnd.parent = e; piv.append(e)
        hands.append((piv, rnd.uniform(0, 60), rnd.uniform(0, 12)))
    return hands

def key_clocks(hands, n):
    for piv, s0, h0 in hands:
        for sec in range(0, int(n / FPS) + 3):
            f = 1 + sec * FPS
            piv[2].rotation_euler = (0, math.radians((s0 + sec) * 6), 0); piv[2].keyframe_insert('rotation_euler', frame=f)
        piv[1].rotation_euler = (0, math.radians(s0 * 6 + 40), 0); piv[1].keyframe_insert('rotation_euler', frame=1)
        piv[0].rotation_euler = (0, math.radians(h0 * 30), 0); piv[0].keyframe_insert('rotation_euler', frame=1)
        constant(piv[2])

def set_supermarket():
    lib.world_color('#e8eef0', .3); exposure(.3)
    plane('floor', 14, 40, (0, 0, 0), T('pavers', 1.0, '#e8e8e0')); box('ceil', (14, 40, .2), (0, 0, 4.2), S('#e8e8e8', .9))
    for x in (-7, 7): box('wall', (.2, 40, 4.2), (x, 0, 2.1), S('#d8e0d8', .8))
    for y in range(-18, 20, 3):
        box('tube', (.15, 2.2, .06), (0, y, 4.05), S('#fff', .3, emit='#f4fbff', emit_strength=12))
        if y % 6 == 0: area((0, y, 4.0), (0, y, 0), 2.0, 250, '#f4fbff')
    rnd = random.Random(7)
    base = []
    for c in ['#c8281e', '#e8c23a', '#2a5aa8', '#3f8a3a', '#e8e4dc', '#e87a2a', '#7a2a8a', '#2aa8a8']:
        base.append(box('prod', (.22, .28, .32), (0, 0, -50), S(c, .45, coat=.2), bevel=.01))
    for sx in (-1, 1):
        for seg in range(-6, 7):
            y0 = seg * 2.8; xs = sx * 1.9
            box('shelfback', (.05, 2.7, 2.2), (xs + sx * .45, y0, 1.1), S('#c8ccd0', .4, metal=.6))
            for lv in range(5):
                z = .15 + lv * .45
                box('shelf', (.9, 2.7, .03), (xs, y0, z), S('#c8ccd0', .35, metal=.7))
                for k in range(10):
                    if rnd.random() < .12: continue
                    b = rnd.choice(base); d = b.copy(); bpy.context.scene.collection.objects.link(d)
                    d.location = (xs + sx * rnd.uniform(-.05, .2), y0 - 1.25 + k * .26, z + .17); d.rotation_euler = (0, 0, rnd.uniform(-.06, .06))
    box('aislesign', (2, .05, .5), (0, 8, 3.3), S('#c8281e', .4)); text('SNACKS', (0, 7.96, 3.3), size=.28, col='#ffffff', extrude=0)
    # trolley
    cart = bpy.data.objects.new('cart', None); bpy.context.scene.collection.objects.link(cart)
    met = S('#d0d4d8', .25, metal=1)
    def P(o): o.parent = cart; return o
    for x in (-.28, .28):
        for y in (-.42, .42): P(cyl('cpost', .012, .55, (x, y, .62), met, seg=8))
    for z in (.36, .9):
        for x in (-.28, .28): P(box('crail', (.02, .86, .02), (x, 0, z), met))
        for y in (-.42, .42): P(box('crail', (.58, .02, .02), (0, y, z), met))
    for k in range(9): P(box('cwire', (.008, .86, .008), (-.28 + k * .07, 0, .36), met))
    for k in range(7): P(box('cwire', (.008, .008, .54), (-.28 + k * .093, -.42, .63), met))
    P(box('chandle', (.62, .03, .03), (0, -.5, 1.0), S('#c8281e', .4)))
    for x in (-.25, .25):
        for y in (-.38, .38): P(cyl('cwheel', .05, .03, (x, y, .06), S('#222', .6), rot=(0, math.pi / 2, 0), seg=12))
    for i in range(6):
        b = rnd.choice(base); d = b.copy(); bpy.context.scene.collection.objects.link(d); d.parent = cart
        d.location = (rnd.uniform(-.15, .15), rnd.uniform(-.3, .3), .5 + i * .03); d.rotation_euler = (rnd.uniform(-.4, .4), 0, rnd.uniform(0, 3))
    return cart

def set_hotel(mess=False, cold=False):
    room(8, 8, 3.6, '#e8dcc0', windows=[(-1.5, 2.2, .6, 3.0), (1.5, 2.2, .6, 3.0)], night=False)
    if not cold: sun(-90, 22, 4.5, color='#ffe4c0', angle=1.5)
    else: lib.world_color('#9fb4d8', .7); exposure(.2)
    plane('rug', 5, 4, (.3, .6, .006), S('#6a2a2a', .95))
    x, y = .6, 2.0; w, l = 2.6, 2.4
    box('bedbase', (w + .2, l + .2, .45), (x, y, .225), S('#3a2a20', .5, coat=.2), bevel=.05)
    box('headboard', (w + .6, .2, 1.8), (x, y + l / 2 + .1, .9), S('#c8a23a', .3, metal=.8), bevel=.08, seg=3)
    box('mattress', (w, l, .35), (x, y, .62), S('#f6f3ee', .85), bevel=.08, seg=3)
    box('duvet', (w + .1, l * .7, .14), (x, y - l * .15, .82), S('#f2ede2', .9), bevel=.06, seg=3)
    box('runner', (w + .14, .5, .16), (x, y - l * .35, .84), S('#7a1f22', .7), bevel=.04)
    for px in (-.6, .6): box('pillow', (.8, .45, .22), (x + px, y + l / 2 - .3, .86), S('#fbf8f2', .8), bevel=.09, seg=3)
    ch = lib.model(['Chandelier_01', 'Chandelier_02']); lib.place(ch, (x, .8, 2.6), 0)
    point((x, .8, 2.9), 120 if not cold else 0, '#ffd8a0', .3)
    ac = lib.model(['ArmChair_01']); lib.place(ac, (-2.4, -1.5, 0), math.radians(40))
    tbl = lib.model(['CoffeeTable_01']); lib.place(tbl, (-1.6, -.6, 0), 0)
    if mess:
        rnd = random.Random(3)
        for i in range(9):
            box('pizzabox', (.45, .45, .05), (rnd.uniform(-2.5, 3), rnd.uniform(-2.5, .5), .025 + (i % 3) * .05), S('#c8a878', .8), rot=(0, 0, rnd.uniform(0, 3)))
        for i in range(6):
            box('cloth', (.5, .35, .04), (rnd.uniform(-2, 3), rnd.uniform(-2.5, 1.5), .02), S(rnd.choice(['#2a3f5a', '#7a2a2a', '#e8e4dc']), .95), rot=(0, 0, rnd.uniform(0, 3)))
        for i in range(8):
            cyl('can', .033, .12, (rnd.uniform(-2, 3), rnd.uniform(-2.5, .5), .06), S(rnd.choice(['#c8281e', '#2a5aa8', '#3f8a3a']), .3, metal=.8), seg=12)
    return (x, y)

def set_rooftop():
    H = 44.0
    set_city('dusk', blocks=4, seed=5)
    # our rooftop sits above the city at the edge of a block
    box('ourbld', (14, 14, H), (-60, -60, H / 2), T('brick', 4))
    box('roofdeck', (14.4, 14.4, .4), (-60, -60, H + .2), T('concrete', 2))
    for (dx, dy, sx, sy) in ((0, 7, 14.4, .3), (0, -7, 14.4, .3), (7, 0, .3, 14.4), (-7, 0, .3, 14.4)):
        box('parapet', (sx, sy, 1.0), (-60 + dx, -60 + dy, H + .9), T('concrete', 1.5))
    wt = cyl('watertank', 1.4, 2.4, (-64, -56, H + 3.6), T('planks', 1, '#7a5a3a'), seg=24); cyl('wtroof', 1.5, .8, (-64, -56, H + 5.2), S('#3a3a3a', .6), seg=24, r2=.1)
    for dx, dy in ((-1, -1), (1, -1), (-1, 1), (1, 1)): box('wtleg', (.12, .12, 2.4), (-64 + dx, -56 + dy, H + 1.6), env.iron())
    acu = lib.model(['exterior_aircon_unit']); lib.place(acu, (-56, -63, H + .4), 0)
    return Vector((-60, -60, H + .4))

def mannequin(loc, facing=0.0):
    m = Actor('worker', body_col='#ece6dc', tag='mannequin')
    m.key(1, loc=loc, facing=facing, legs=('sit',), armL=('a', .3, .4, -.3), armR=('a', .3, .4, -.3))
    return m

# =========================================================================== helpers
def frames(t0, t1): return max(1, round((t1 - t0) * FPS))
def ease(t): return t * t * (3 - 2 * t)

def push(cam, n, p0, p1, l0, l1=None, lens0=None, lens1=None):
    cam.key(1, pos=p0, look=l0, lens=lens0); cam.key(n, pos=p1, look=l1 or l0, lens=lens1 or lens0)

# =========================================================================== shots
SHOTS = {}
def shot(fn): SHOTS[fn.__name__] = fn; return fn

@shot
def wake(n):
    set_bedroom(night=False, radio=False)
    h = hero()
    h.key(1, loc=(.9, 1.55, .25), facing=0, lean=-78, legs=('sit',), armL=('a', .15, .2), armR=('a', .15, .2), face='sleepy', head=(0, 8, 0))
    h.key(14, lean=-74, face='blink')
    h.key(26, face='lookl'); h.key(30, lean=-70)
    h.key(46, lean=-8, head=(10, 0, 0), armL=('a', .35, .5), armR=('a', .5, .7), face='sideeye')
    h.key(n, lean=-4, head=(18, -3, 0))
    h.finish(n)
    cam = Cam(30, 2.8); push(cam, n, (-.4, -.2, 1.0), (-.25, .2, 1.05), (.85, 1.6, .95), (.88, 1.35, 1.15))

@shot
def drone(n):
    set_city('day', seed=2)
    cam = Cam(24); cam.key(1, pos=(-90, -150, 95), look=(10, -10, 0)); cam.key(n, pos=(-70, -110, 70), look=(12, -6, 0))

@shot
def nopeople(n):
    set_street('day', seed=11)
    cam = Cam(24, 5.6); push(cam, n, (-12, -2.0, .35), (-9, -1.6, .45), (20, 1.5, 2.6))

@shot
def notraffic(n):
    set_street('day', seed=12)
    ms = traffic_light((2, -5.9))
    key_emit(ms[0], 1, 0); key_emit(ms[2], 1, 9); key_emit(ms[2], n // 2, 0); key_emit(ms[1], n // 2, 9); key_emit(ms[1], n - 6, 0); key_emit(ms[0], n - 6, 9)
    for m in ms: constant(m.node_tree)
    cam = Cam(32, 4); push(cam, n, (-1.5, -1.5, 3.0), (-1.2, -1.2, 3.1), (2.0, -5.9, 4.5), (10, -2, 2.6))

@shot
def nocalls(n):
    o = set_bedroom(night=False, radio=False)
    key_emit(o['screen'], 1, 3)
    text('0 missed calls', (-.35, 2.29, .629), rot=(0, 0, math.pi), size=.012, col='#1a2a44', extrude=0)
    cam = Cam(55, 2.0); push(cam, n, (-.1, 1.95, .95), (-.2, 2.05, .85), (-.35, 2.3, .62))

@shot
def silence(n):
    set_street('day', seed=13)
    h = hero(); h.key(1, loc=(0, 0, 0), facing=0, face='deadpan', armL=('a', .12, .05), armR=('a', .12, .05)); h.key(n, head=(-6, 0, 0)); h.finish(n)
    cam = Cam(26); push(cam, n, (0, -14, 7.5), (0, -16, 9.5), (0, 0, .8), (0, 0, .6))

@shot
def dream(n):
    set_street('day', seed=14)
    h = hero(); h.key(1, loc=(0, 0, 0), facing=-10, face='worry', armL=('a', .2, .1), armR=('a', .2, .1))
    h.key(12, armR=('t', .25, -.22, h.z1 + .2))
    h.key(22, armR=('t', .2, -.24, h.z1 + .22), head=(-8, 6, 0), face='sideeye')
    h.key(36, head=(8, -4, 0)); h.key(46, armR=('a', .2, .1), face='worry'); h.key(n, head=(0, 0, 0)); h.finish(n)
    cam = Cam(38, 2.8); cam.key(1, pos=(-.5, -2.2, 1.25), look=(0, 0, 1.15)); cam.key(n, pos=(-.35, -1.8, 1.22), look=(0, 0, 1.18)); cam.handheld(1, n, .01)

@shot
def run(n):
    set_street('day', seed=15)
    h = hero(); x0, x1 = -10, 6
    h.walk(1, n, (x0, 6.4, .18), (x1, 6.4, .18), stride=.3, run=True, face='worry', armL=('a', .9, 1.2, -.2), armR=('a', .5, 1.4, .1))
    h.key(int(n * .45), head=(60, 0, 0)); h.key(int(n * .65), head=(55, 0, 0)); h.key(int(n * .8), head=(0, 0, 0), face='scared'); h.finish(n)
    cam = Cam(28, 4)
    cam.key(1, pos=(x0 - 1.0, 2.4, 1.2), look=(x0 + .8, 6.4, 1.1)); cam.key(n, pos=(x1 - 1.0, 2.4, 1.2), look=(x1 + .8, 6.4, 1.1))
    linear(cam.cam); linear(cam.tgt); cam.handheld(1, n, .02, 5)

@shot
def knock(n):
    set_street('day', seed=16)
    # a door of the facade at y=8: stand in front of one
    h = hero(); dx = 3.0
    h.key(1, loc=(dx, 7.1, .18), facing=180, face='worry', armL=('a', .2, .1))
    for k, f in enumerate(range(1, n, 8)):
        h.key(f, armR=('t', .12, -.42, h.z1 + .05)); h.key(f + 4, armR=('t', .12, -.3, h.z1 + .02))
    h.key(n - 6, head=(0, -6, 0)); h.finish(n)
    box('knockdoor', (1.2, .1, 2.4), (dx + .1, 7.92, 1.38), S('#3b2617', .45, coat=.2))
    cam = Cam(32, 2.8); push(cam, n, (dx - .9, 5.4, 1.5), (dx - .7, 5.7, 1.45), (dx + .05, 7.4, 1.2))

@shot
def emptymarket(n):
    set_market()
    h = hero(); h.key(1, loc=(-1, 4, 0), facing=0, face='lonely')
    h.key(n // 2, facing=120); h.key(n, facing=240); h.finish(n)
    cam = Cam(26); cam.key(1, pos=(-9, -10, 11), look=(-1, 4, 0)); cam.key(n, pos=(-5, -12, 12.5), look=(-1, 4, 0))

@shot
def tv(n):
    o = set_living()
    h = hero(); h.key(1, loc=(0, -1.35, .1), facing=180, legs=('sit',), lean=-8, face='deadpan', armL=('a', .3, .5, -.2), armR=('t', .2, -.42, h.z1 - .05))
    for f in range(18, n, 22): h.key(f, armR=('t', .2, -.46, h.z1 - .02)); h.key(f + 3, armR=('t', .2, -.44, h.z1 - .05))
    h.key(int(n * .7), face='unimpressed'); h.finish(n)
    box('remote', (.05, .16, .025), (0, 0, -40), S('#222', .5))
    cam = Cam(30, 2.8); push(cam, n, (.6, 1.0, 1.15), (.35, .5, 1.1), (0, -1.35, 1.02), lens0=30, lens1=36)

@shot
def call(n):
    set_living()
    h = hero(); h.key(1, loc=(0, -1.35, .1), facing=180, legs=('sit',), face='worry', armR=('t', .3, -.05, h.z1 + .2), armL=('a', .3, .5, -.2))
    box('phone', (.025, .09, .16), (0, 0, 0), S('#111', .2, coat=1)).parent = h.hands['R']
    h.key(int(n * .58), face='sad', head=(0, 10, 0)); h.key(n, head=(0, 12, 0)); h.finish(n)
    cam = Cam(45, 2.0); push(cam, n, (-.4, -.1, 1.05), (-.3, -.3, 1.04), (0, -1.35, 1.02))

@shot
def realize(n):
    set_living()
    h = hero(); h.key(1, loc=(0, -1.35, .1), facing=180, legs=('sit',), face='sideeye', armL=('a', .3, .5, -.2), armR=('a', .3, .5, -.2))
    h.key(int(n * .35), face='lookl', head=(-10, 0, 0)); h.key(int(n * .55), face='gasp', head=(0, -8, 0), lean=-12); h.key(n, lean=-14); h.finish(n)
    cam = Cam(32, 2.0); push(cam, n, (0, .9, 1.15), (0, .1, 1.08), (0, -1.35, 1.02), lens0=32, lens1=40)

@shot
def electric(n):
    o = set_street('dusk', seed=17, lamps_lit=False)
    h = hero(); h.key(1, loc=(1.5, -4.2, .18), facing=95, face='gasp', head=(-20, -25, 0)); h.finish(n)
    for i, (x, lm, pl) in enumerate(sorted(o['lamps'], key=lambda t: -t[0])):
        f = 4 + i * 4
        key_emit(lm, 1, 0); key_emit(lm, f, 0); key_emit(lm, f + 1, 10); key_light(pl, 1, 0); key_light(pl, f, 0); key_light(pl, f + 1, 160)
        constant(lm.node_tree); constant(pl.data)
    cam = Cam(24, 4); push(cam, n, (-6, -1.5, .5), (-5.5, -1.3, .6), (8, -4, 3.6))

@shot
def internet(n):
    set_living(); scr, t1, t2 = computer((1.8, 1.0))
    key_emit(scr, 1, 1.5)
    h = hero(); h.key(1, loc=(1.8, .1, 0), facing=180, face='hopeful', lean=6); h.finish(n)
    t2.hide_render = False; t2.keyframe_insert('hide_render', frame=1)
    for f in range(1, n, 12): t2.hide_render = (f // 12) % 2 == 1; t2.keyframe_insert('hide_render', frame=f)
    cam = Cam(40, 2.8); push(cam, n, (2.35, -.75, 1.45), (2.2, -.5, 1.38), (1.8, .82, 1.02))

@shot
def clocks(n):
    hands = set_clocks(); key_clocks(hands, n)
    h = hero(); h.key(1, loc=(1.6, -1.0, 0), facing=135, face='gasp', head=(0, -12, 0)); h.key(n, head=(-15, -12, 0)); h.finish(n)
    cam = Cam(32, 3.2); cam.key(1, pos=(-2.5, -2.4, 2.2), look=(-1.5, 1, 2.3)); cam.key(n, pos=(1.0, -2.6, 1.9), look=(1.6, 1, 2.0))

@shot
def explore(n):
    set_street('day', seed=18)
    h = hero()
    pack = box('backpack', (.34, .2, .42), (0, .22, h.z0 + .35), S('#c8a23a', .8), bevel=.05); pack.parent = h.torso; pack.location = (0, .22, .35)
    h.walk(1, n, (-.5, 6, .18), (-.5, 2.2, .18), stride=.24, face='smug', armL=('a', .35, .2), armR=('a', .35, .2)); h.finish(n)
    cam = Cam(24, 4); cam.key(1, pos=(-.3, 2.6, .5), look=(-.5, 6, 1.2)); cam.key(n, pos=(-.3, -.8, .5), look=(-.5, 2.4, 1.2))

@shot
def supermarket(n):
    cart = set_supermarket()
    h = hero(); y0, y1 = -8, 0
    h.walk(1, n, (0, y0, 0), (0, y1, 0), stride=.24, face='grin', armL=('t', .18, -.42, h.z0 + .55), armR=('t', .18, -.42, h.z0 + .55))
    for f, y in ((1, y0), (n, y1)): cart.location = (0, y + .95, 0); cart.rotation_euler = (0, 0, 0); cart.keyframe_insert('location', frame=f)
    linear(cart)
    h.key(int(n * .5), head=(-50, 0, 0)); h.key(int(n * .7), head=(0, 0, 0)); h.finish(n)
    cam = Cam(26, 3.2); cam.key(1, pos=(.4, y0 + 4.6, 1.1), look=(0, y0, 1.1)); cam.key(n, pos=(.4, y1 + 4.6, 1.1), look=(0, y1, 1.1))
    linear(cam.cam); linear(cam.tgt)

@shot
def hotel(n):
    x, y = set_hotel()
    h = hero(); bz = .8
    for i, f in enumerate(range(1, n + 1, 14)):
        h.key(f, loc=(x, y - .3, bz + .35), facing=0, legs=('kick', i), face='laugh' if i % 2 else 'happy',
              armL=('a', 2.6, .3), armR=('a', 2.6, .3))
        if f + 7 <= n: h.key(f + 7, loc=(x, y - .3, bz), armL=('a', 1.6, .5), armR=('a', 1.6, .5), legs=('kick', i + .5))
    h.finish(n, blink=False)
    cam = Cam(22, 4); push(cam, n, (x - 2.6, y - 4.0, .7), (x - 2.1, y - 3.6, .8), (x, y - .2, 1.5))

@shot
def rooftop(n):
    top = set_rooftop()
    h = hero(); p = top + Vector((2, 4, 0))
    h.key(1, loc=tuple(p), facing=200, face='happy', armL=('a', .3, .2), armR=('a', .3, .2))
    h.key(int(n * .25), armL=('a', 2.2, .2), armR=('a', 2.2, .2), face='grin')
    h.key(n, armL=('a', 2.3, .1), armR=('a', 2.3, .1)); h.finish(n)
    c = Vector(p) + Vector((0, 0, 1.2))
    cam = Cam(28, 5.6)
    for i, f in enumerate((1, n // 2, n)):
        a = math.radians(20 + i * 35); r = 3.2 + i * 1.6
        cam.key(f, pos=tuple(c + Vector((math.sin(a) * r, -math.cos(a) * r, .2 + i * .8))), look=tuple(c + Vector((0, 0, -.1 * i))))

@shot
def weeks(n):
    x, y = set_hotel(mess=True, cold=True)
    h = hero(); h.key(1, loc=(x - .2, y - 1.3, .45), facing=0, legs=('sit',), lean=14, face='lonely', armL=('a', .3, .6, -.3), armR=('a', .3, .6, -.3), head=(0, 12, 0))
    h.key(n, lean=18, head=(0, 16, 0)); h.finish(n)
    cam = Cam(30, 2.8); push(cam, n, (x - 1.4, y - 4.4, 1.3), (x - 1.0, y - 3.4, 1.2), (x - .2, y - 1.0, 1.1))

@shot
def curb(n):
    set_street('dusk', seed=19)
    h = hero(); h.key(1, loc=(0, 5.2, -.05), facing=0, legs=('sit',), lean=16, face='sad', armL=('a', .4, .9, -.3), armR=('a', .4, .9, -.3), head=(0, 10, 0))
    h.key(n, head=(-8, 12, 0)); h.finish(n)
    cam = Cam(26, 4); push(cam, n, (-4.5, -3.5, 1.4), (-4.0, -2.8, 1.6), (0, 5.2, .9))

@shot
def mannequin_(n): pass

@shot
def mannequin(n):
    set_street('day', seed=20, cafe=True)
    mq = mannequin((-3.3, 6.4, .28), -90)
    h = hero(); h.key(1, loc=(-4.7, 6.4, .28), facing=90, legs=('sit',), face='talk', armL=('a', .4, .7, -.3), armR=('a', .9, .6, -.4))
    for f in range(10, int(n * .6), 10): h.key(f, armR=('a', .7 + (f % 20) / 40, .8, -.4), face='talk' if f % 20 else 'happy')
    h.key(int(n * .65), face='sad', armR=('a', .4, .7, -.3), head=(0, 8, 0)); h.finish(n)
    cam = Cam(34, 2.8); push(cam, n, (-2.2, 5.0, 1.5), (-2.45, 5.25, 1.45), (-4.7, 6.4, 1.3))

@shot
def yourname(n):
    set_street('dusk', seed=21)
    h = hero(); h.key(1, loc=(0, 6.2, .18), facing=-10, face='lonely', head=(0, 6, 0)); h.key(n, head=(0, 10, 0)); h.finish(n)
    cam = Cam(55, 2.0); push(cam, n, (-.95, 3.9, 1.35), (-.75, 4.4, 1.32), (0, 6.2, 1.3))

@shot
def paint(n):
    set_street('day', seed=22, msg=True)
    h = hero(); h.key(1, loc=(3.0, 6.9, .18), facing=180, face='talk', armL=('a', .2, .2))
    brush = box('brush', (.05, .05, .45), (0, 0, .15), S('#7a5634', .5)); brush.parent = h.hands['R']
    for i, f in enumerate(range(1, n, 10)):
        h.key(f, armR=('t', .1 + (i % 3) * .12, -.5, h.z1 + .45)); h.key(f + 5, armR=('t', .2 + (i % 2) * .1, -.5, h.z1 + .1))
    h.finish(n)
    cam = Cam(24, 4); push(cam, n, (1.4, 2.6, 1.0), (1.6, 2.9, 1.1), (3.4, 7.9, 3.2))

@shot
def buildingmsg(n):
    set_street('day', seed=22, msg=True)
    cam = Cam(20); push(cam, n, (6, -3.5, .6), (5, -3.8, .6), (-6, 8, 9))

@shot
def tvmsg(n):
    o = set_living(); r, m, scr, glow = o['tv']
    m2 = mat('tvblack', '#03050a', rough=.1, emit='#0a1020', emit_strength=1); scr.data.materials.clear(); scr.data.materials.append(m2)
    text('IS ANYONE\nTHERE?', (-.06, 1.89 - .30, .45 + .38), size=.085, col='#e8f0ff', emit=4, extrude=0)
    cam = Cam(45, 2.8); push(cam, n, (.2, .2, .9), (.1, .55, .86), (-.06, 1.6, .83))

@shot
def radiomic(n):
    o = set_bedroom(night=True)
    h = hero(); h.key(1, loc=(1.45, -1.2, .12), facing=90, legs=('sit',), lean=14, face='talk', armL=('a', .4, .7, -.3), armR=('t', .2, -.35, h.z1 - .1))
    for f in range(8, n, 8): h.key(f, face='talk' if (f // 8) % 2 else 'hopeful')
    h.finish(n)
    cam = Cam(34, 2.0); push(cam, n, (2.3, -2.6, 1.3), (2.2, -2.3, 1.3), (1.6, -1.2, 1.2))

@shot
def hoping(n):
    set_city('dusk', msg=True, seed=2)
    cam = Cam(24); cam.key(1, pos=(-20, -60, 55), look=(0, 0, 0)); cam.key(n, pos=(-40, -95, 80), look=(0, -5, 0))

def radio_scene(n, face_keys, cam_fn, flicker=None, die=None):
    o = set_bedroom(night=True)
    h = hero(); h.key(1, loc=(1.45, -1.2, .12), facing=90, legs=('sit',), lean=10, armL=('a', .3, .6, -.3), armR=('t', .25, -.45, h.z1 - .1))
    for f, kw in face_keys: h.key(f, **kw)
    h.finish(n)
    if flicker:
        rnd = random.Random(9)
        for f in range(1, n + 1, 2):
            v = 6 * (.6 + .8 * rnd.random()); key_emit(o['dial'], f, v); key_light(o['rlamp'], f, 25 * v / 6)
    if die:
        key_emit(o['dial'], 1, 6); key_light(o['rlamp'], 1, 25); key_emit(o['dial'], die, 6); key_light(o['rlamp'], die, 25)
        key_emit(o['dial'], die + 2, 0); key_light(o['rlamp'], die + 2, 0)
    cam_fn(Cam(34, 2.0))

@shot
def oldradio(n):
    radio_scene(n, [(1, dict(face='lonely')), (int(n * .6), dict(head=(0, 6, 0)))],
                lambda c: push(c, n, (.9, -2.9, 1.25), (1.1, -2.4, 1.2), (2.0, -1.2, .95)))

@shot
def hearvoice(n):
    radio_scene(n, [(1, dict(face='lonely')), (6, dict(face='shock', head=(0, -6, 0), lean=4))],
                lambda c: push(c, n, (2.25, -1.85, 1.3), (2.15, -1.75, 1.3), (1.45, -1.2, 1.25), lens0=40))

@shot
def humanvoice(n):
    radio_scene(n, [(1, dict(face='gasp'))], lambda c: push(c, n, (1.75, -1.3, 1.0), (1.85, -1.27, .98), (2.2, -1.2, .97), lens0=40), flicker=True)

@shot
def itsays(n):
    radio_scene(n, [(1, dict(face='scared', lean=22, head=(0, 8, 0)))],
                lambda c: push(c, n, (1.3, -2.4, 1.25), (1.4, -2.2, 1.22), (1.75, -1.2, 1.1)), flicker=True)

@shot
def foundyou(n):
    radio_scene(n, [(1, dict(face='gasp', lean=20))], lambda c: push(c, n, (1.9, -1.32, 1.0), (1.97, -1.3, .99), (2.2, -1.2, .96), lens0=45), flicker=True)

@shot
def silent(n):
    radio_scene(n, [(1, dict(face='shock', lean=12)), (int(n * .55), dict(face='scared'))],
                lambda c: push(c, n, (2.4, -1.9, 1.35), (2.2, -1.75, 1.33), (1.45, -1.2, 1.25), lens0=36), die=14)

del SHOTS['mannequin_']
