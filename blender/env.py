"""World building blocks: textured ground, facades with real windows, street furniture, vehicles, nature."""
import bpy, bmesh, math, random
from mathutils import Vector
import lib
from lib import mat, mat_ph, box, cyl, sphere, plane, torus, lathe, smooth_tube, tube, link_dup, coll, lin, place, model

TEXC = {
    'cobble':   (['cobblestone_floor_04', 'cobblestone_floor_08', 'cobblestone_floor_01', 'cobblestone_square'], ('cobblestone',)),
    'brick':    (['red_brick_03', 'red_brick', 'brick_wall_001', 'red_bricks_04'], ('red', 'brick')),
    'brick2':   (['brick_wall_02', 'brick_wall_006', 'yellow_brick', 'brick_wall_04'], ('brick', 'wall')),
    'plaster':  (['painted_plaster_wall', 'plastered_wall', 'plastered_wall_02', 'plaster_brick_pattern'], ('plaster',)),
    'planks':   (['wood_planks', 'old_planks_02', 'weathered_planks', 'wood_planks_grey'], ('planks',)),
    'woodfloor':(['wood_floor', 'wood_floor_worn', 'laminate_floor_02', 'wooden_floor'], ('wood', 'floor')),
    'woodpanel':(['dark_wood', 'wood_table_001', 'dark_wooden_planks', 'fine_grained_wood'], ('wood',)),
    'asphalt':  (['asphalt_02', 'asphalt_04', 'asphalt_track'], ('asphalt',)),
    'ground':   (['forrest_ground_01', 'forest_ground_04', 'brown_mud_leaves_01', 'forest_leaves_02'], ('forest', 'ground')),
    'grassy':   (['aerial_grass_rock', 'grass_path_2', 'rocky_trail'], ('grass',)),
    'dirt':     (['dirt_floor', 'brown_mud_02', 'dry_ground_01', 'aerial_mud_1'], ('dirt',)),
    'sand':     (['aerial_beach_01', 'sand_01', 'coast_sand_01', 'aerial_sand'], ('sand',)),
    'snow':     (['snow_02', 'snow_03', 'snow_field_aerial'], ('snow',)),
    'rock':     (['rocky_terrain_02', 'rock_face', 'aerial_rocks_02', 'rock_wall_08'], ('rock',)),
    'rust':     (['rusty_metal_02', 'rust_coarse_01', 'rusty_metal'], ('rust', 'metal')),
    'metal':    (['metal_plate', 'metal_plate_02', 'corrugated_iron'], ('metal', 'plate')),
    'concrete': (['concrete_floor_02', 'concrete_wall_008', 'concrete_floor_worn_001', 'concrete'], ('concrete',)),
    'roof':     (['roof_tiles_14', 'clay_roof_tiles', 'clay_roof_tiles_02', 'roof_09'], ('roof',)),
    'pavers':   (['floor_tiles_06', 'grey_stone_path', 'stone_tiles', 'patterned_paving_02'], ('paving',)),
    'stone':    (['castle_wall_slates', 'stone_wall', 'stone_brick_wall_001', 'medieval_blocks_02'], ('stone', 'wall')),
    'chalk':    (['blackboard', 'slate_floor'], ('slate',)),
    'thatch':   (['thatch_roof_angled', 'thatched_roof'], ('thatch',)),
}
_T = {}
def T(key, scale=2.0, tint=None, bump=.6, rough_mul=1.0, metal=None, name=None):
    k = (key, scale, tint, bump, rough_mul, metal)
    if k in _T: return _T[k]
    cands, kw = TEXC[key]
    try:
        aid = lib.ph_pick('textures', cands, *kw)
        m = mat_ph(name or key, aid=aid, scale=scale, tint=tint, bump=bump, rough_mul=rough_mul, metal=metal)
    except Exception as e:
        lib.log('texture failed', key, e); m = mat(key, tint or '#888888', rough=.7)
    _T[k] = m; return m

def S(col, rough=.6, **kw):
    k = ('s', col, rough, tuple(sorted(kw.items())))
    if k not in _T: _T[k] = mat('m' + col, col, rough=rough, **kw)
    return _T[k]

def glass(): return S('#16202a', .04, spec=.9)
def lit_glass(): return S('#2a2216', .1, emit='#ffc27a', emit_strength=2.5)
def iron(): return S('#2a2f2c', .45, metal=.6)

# --------------------------------------------------------------- ground
def ground(key='cobble', size=(80, 80), loc=(0, 0, 0), scale=2.0, tint=None, sub=0):
    return plane('ground_' + key, size[0], size[1], loc, T(key, scale, tint), sub=sub)

def displaced_ground(key, size, loc=(0, 0, 0), strength=1.0, noise=6.0, sub=200, scale=3.0, tint=None):
    o = plane('terrain', size[0], size[1], loc, T(key, scale, tint), sub=sub)
    tx = bpy.data.textures.new('terrain_n', 'CLOUDS'); tx.noise_scale = noise; tx.noise_depth = 3
    md = o.modifiers.new('disp', 'DISPLACE'); md.texture = tx; md.strength = strength; md.mid_level = .5
    for p in o.data.polygons: p.use_smooth = True
    return o

# --------------------------------------------------------------- buildings
def facade(x, y, w, h, wall, rot=0.0, floor_h=3.2, win=(1.0, 1.6), shop=True, cornice='#d8cfc0', lit=.15, d=10, seed=0, awning=None, sign=None):
    """A building whose front face is at local y=0 facing -Y; placed at (x, y) with rotation rot (radians)."""
    rnd = random.Random(seed)
    root = bpy.data.objects.new('bld', None); bpy.context.scene.collection.objects.link(root)
    def P(o): o.parent = root; return o
    P(box('wall', (w, d, h), (0, d / 2, h / 2), wall))
    P(box('cornice', (w + .3, .5, .35), (0, -.1, h - .25), S(cornice, .7), bevel=.05))
    P(box('band', (w + .1, .25, .2), (0, -.05, floor_h + .05), S(cornice, .7)))
    n = max(1, int(w / (win[0] * 2.0)))
    gap = w / n
    floors = max(1, int((h - floor_h - .6) / floor_h))
    for f in range(floors):
        z = floor_h * (f + 1) + floor_h * .45
        for i in range(n):
            xx = -w / 2 + gap * (i + .5)
            P(box('frame', (win[0] + .16, .12, win[1] + .16), (xx, -.02, z), S('#ece6da', .55)))
            P(box('glass', (win[0], .1, win[1]), (xx, -.04, z), lit_glass() if rnd.random() < lit else glass()))
            P(box('mull', (.05, .14, win[1]), (xx, -.05, z), S('#ece6da', .55)))
            P(box('mull2', (win[0], .14, .05), (xx, -.05, z + win[1] * .15), S('#ece6da', .55)))
            P(box('sill', (win[0] + .35, .3, .12), (xx, -.12, z - win[1] / 2 - .1), S(cornice, .7), bevel=.02))
            P(box('lintel', (win[0] + .3, .18, .22), (xx, -.06, z + win[1] / 2 + .16), S(cornice, .7)))
    if shop:
        P(box('shopwall', (w - .2, .25, floor_h - .2), (0, -.1, (floor_h - .2) / 2), S('#2d3a33', .5, coat=.3)))
        P(box('shopglass', (w * .55, .28, floor_h * .55), (-w * .12, -.12, floor_h * .45), glass()))
        P(box('shopglass_in', (w * .55 - .1, .2, floor_h * .55 - .1), (-w * .12, -.05, floor_h * .45), lit_glass() if rnd.random() < .5 else glass()))
        P(box('door', (1.1, .3, 2.3), (w * .33, -.12, 1.15), S('#3b2617', .45, coat=.2)))
        P(box('step', (1.6, .6, .18), (w * .33, -.3, .09), T('concrete', 1.5)))
        P(box('signboard', (w - .6, .2, .55), (0, -.25, floor_h - .5), S(sign or rnd.choice(['#6b2a22', '#1f3b2c', '#2a2e4a', '#5a4422']), .5, coat=.4)))
        P(box('signtext', (w * .45, .05, .2), (0, -.37, floor_h - .5), S('#e8cf8a', .3, metal=.8)))
        if awning:
            aw = P(box('awning', (w * .6, 1.6, .06), (-w * .12, -.85, floor_h * .88), S(awning, .85), rot=(math.radians(-18), 0, 0)))
    root.location = (x, y, 0); root.rotation_euler = (0, 0, rot)
    return root

PALETTE_WALLS = ['brick', 'brick2', 'plaster']
def street(x0=-40, x1=40, width=10, side=3, both=True, seed=1, hmin=9, hmax=17, ground_key='cobble', far=True, shops=True, awnings=None):
    rnd = random.Random(seed)
    ground(ground_key, (x1 - x0 + 40, width + 60), ((x0 + x1) / 2, 0, 0), scale=2.0)
    for sy in ((1, -1) if both else (1,)):
        box('sidewalk', (x1 - x0, side, .18), ((x0 + x1) / 2, sy * (width / 2 + side / 2), .09), T('pavers', 1.5))
        box('curb', (x1 - x0, .3, .22), ((x0 + x1) / 2, sy * (width / 2 + .15), .11), T('concrete', 1.0))
        x = x0
        while x < x1:
            w = rnd.choice([7, 8, 9, 10, 12]); h = rnd.uniform(hmin, hmax)
            wall_key = rnd.choice(PALETTE_WALLS)
            tint = rnd.choice([None, '#e8d8c8', '#d8b8a0', '#c8d0d8', '#f0e0c0']) if wall_key == 'plaster' else rnd.choice([None, None, '#d8c0b0'])
            facade(x + w / 2, sy * (width / 2 + side), w - .05, h, T(wall_key, 2.5, tint), rot=0 if sy > 0 else math.pi,
                   seed=rnd.randrange(999), shop=shops, awning=(rnd.choice(awnings) if awnings else None))
            x += w

def lamp(loc, lit=True, h=4.2):
    r = bpy.data.objects.new('lamp', None); bpy.context.scene.collection.objects.link(r)
    for o in (cyl('post', .07, h, (0, 0, h / 2), iron(), seg=16, r2=.05), cyl('base', .16, .5, (0, 0, .25), iron(), seg=16, r2=.1),
              box('lanternT', (.36, .36, .08), (0, 0, h + .45), iron()), cyl('cap', .26, .22, (0, 0, h + .55), iron(), seg=4, r2=.02),
              box('lantern', (.3, .3, .44), (0, 0, h + .2), S('#fff1d0', .2, emit='#ffd38a', emit_strength=6 if lit else 0, trans=.0))):
        o.parent = r
    r.location = loc
    if lit: lib.point((loc[0], loc[1], loc[2] + h + .1), 60, '#ffcf88', .15)
    return r

def el_railway(x0, x1, y, z=6.0, width=6.0, pitch=7.0):
    m = S('#2c3a33', .55, metal=.5)
    x = x0
    while x <= x1:
        for sy in (-1, 1):
            box('col', (.35, .35, z), (x, y + sy * width / 2, z / 2), m)
            box('colbase', (.7, .7, .3), (x, y + sy * width / 2, .15), T('concrete', 1))
        box('cross', (.4, width + .6, .6), (x, y, z - .3), m)
        x += pitch
    for sy in (-1, .0, 1):
        box('girder', (x1 - x0 + 2, .3, 1.0), ((x0 + x1) / 2, y + sy * width / 2, z + .4), m)
    box('deck', (x1 - x0 + 2, width + .6, .25), ((x0 + x1) / 2, y, z + 1.0), T('planks', 2, '#7a6a5a'))
    for sy in (-1, 1):
        box('rail', (x1 - x0 + 2, .1, .12), ((x0 + x1) / 2, y + sy * .75, z + 1.2), S('#5a5550', .3, metal=1))

def tank(loc, r=13.5, h=15.0, col='#5a3a24'):
    t = cyl('tank', r, h, (loc[0], loc[1], h / 2), T('rust', 3, col, metal=.4), seg=96)
    cyl('roof', r + .2, 1.6, (loc[0], loc[1], h + .8), T('rust', 3, col), seg=96, r2=1.0)
    for k in range(1, 6):
        torus('seam', r + .02, .05, (loc[0], loc[1], k * h / 6), S('#3a2416', .5, metal=.6), seg=96, mseg=6)
    return t

def crate(loc, rot=0.0, size=(.8, .55, .4), fill=None, n=14, seed=0):
    rnd = random.Random(seed)
    c = box('crate', size, (loc[0], loc[1], loc[2] + size[2] / 2), T('planks', .8, '#b89a70'), rot=(0, 0, rot), bevel=.01)
    if fill:
        for i in range(n):
            p = (loc[0] + rnd.uniform(-.38, .38) * size[0] * math.cos(rot), loc[1] + rnd.uniform(-.38, .38) * size[1], loc[2] + size[2] + rnd.uniform(-.03, .04))
            if isinstance(fill, tuple) and isinstance(fill[0], bpy.types.Object):
                lib.ph_instance(fill[0], fill[1], p, rnd.uniform(0, 6.28), rnd.uniform(.9, 1.1))
            else:
                sphere('fruit', .045, p, S(fill if isinstance(fill, str) else '#c43a2a', .35, coat=.3), seg=16, rings=8)
    return c

def stall(loc, rot=0.0, cloth='#b8332a', cloth2='#efe6d4', w=3.0, d=1.8, seed=0, produce=None):
    rnd = random.Random(seed)
    r = bpy.data.objects.new('stall', None); bpy.context.scene.collection.objects.link(r)
    wood = T('planks', 1.2, '#a07850')
    def P(o): o.parent = r; return o
    for sx in (-1, 1):
        for sy in (-1, 1):
            P(box('post', (.09, .09, 2.5 if sy > 0 else 2.2), (sx * w / 2, sy * d / 2, 1.25 if sy > 0 else 1.1), wood))
    P(box('table', (w, d * .7, .07), (0, -d * .1, .85), wood, bevel=.01))
    P(box('front', (w, .04, .8), (0, -d * .45, .45), wood))
    # striped awning: thin strips alternating colours
    n = 8
    for i in range(n):
        P(box('strip', (w / n + .005, d + .5, .03), (-w / 2 + w / n * (i + .5), 0, 2.38), S(cloth if i % 2 == 0 else cloth2, .9), rot=(math.radians(-8), 0, 0)))
    for i in range(n):
        P(box('valance', (w / n, .03, .25), (-w / 2 + w / n * (i + .5), -d / 2 - .26, 2.15), S(cloth if i % 2 == 0 else cloth2, .9)))
    r.location = loc; r.rotation_euler = (0, 0, rot)
    bpy.context.view_layer.update()
    if produce:
        for i in range(3):
            loc2 = r.matrix_world @ Vector((-w / 2 + w / 3 * (i + .5), -d * .12, .89))
            crate(tuple(loc2), rot, (.8, .5, .2), fill=produce[i % len(produce)], n=16, seed=seed * 7 + i)
    return r

def grass_patch(size, loc=(0, 0, 0), count=60000, length=.16, ground_key='grassy', col1='#2f4a18', col2='#8aa44a', density_scale=1.0, children=6):
    o = plane('grass_ground', size[0], size[1], loc, T(ground_key, 2.5, '#9aa070'), sub=40)
    if lib.DRAFT: count //= 4
    ps = o.modifiers.new('grass', 'PARTICLE_SYSTEM').particle_system; st = ps.settings
    st.type = 'HAIR'; st.count = int(count * density_scale); st.hair_length = length; st.use_advanced_hair = True
    st.emit_from = 'FACE'; st.use_emit_random = True; st.normal_factor = 1.0; st.factor_random = .25
    st.child_type = 'INTERPOLATED'; st.rendered_child_count = children; st.child_percent = 2
    st.child_radius = .05; st.roughness_1 = .05; st.roughness_endpoint = .05; st.roughness_2 = .25
    st.child_length = 1.0; st.child_length_threshold = .3
    st.radius_scale = .0035; st.root_radius = 1.0; st.tip_radius = 0.0; st.display_step = 3; st.render_step = 3
    gm = bpy.data.materials.new('grass'); gm.use_nodes = True
    N, L = gm.node_tree.nodes, gm.node_tree.links; b = N['Principled BSDF']
    hi = N.new('ShaderNodeHairInfo'); cr = N.new('ShaderNodeValToRGB')
    cr.color_ramp.elements[0].color = (*lin(col1), 1); cr.color_ramp.elements[1].color = (*lin(col2), 1)
    L.new(hi.outputs['Intercept'], cr.inputs['Fac'])
    mx = N.new('ShaderNodeMixRGB'); mx.blend_type = 'MULTIPLY'; L.new(cr.outputs['Color'], mx.inputs['Color1'])
    rr = N.new('ShaderNodeMapRange'); L.new(hi.outputs['Random'], rr.inputs['Value']); rr.inputs[3].default_value = .65; rr.inputs[4].default_value = 1.15
    cb = N.new('ShaderNodeCombineColor'); L.new(rr.outputs[0], cb.inputs[0]); L.new(rr.outputs[0], cb.inputs[1]); cb.inputs[2].default_value = .6
    L.new(cb.outputs[0], mx.inputs['Color2']); mx.inputs['Fac'].default_value = 1
    L.new(mx.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = .55
    b.inputs['Subsurface Weight'].default_value = .0
    try: b.inputs['Transmission Weight'].default_value = .0
    except Exception: pass
    o.data.materials.append(gm); st.material = len(o.data.materials)
    return o

def scatter(m, n, area, z=0.0, seed=0, scale=(.8, 1.2), avoid=None):
    rnd = random.Random(seed); out = []
    if not m: return out
    for i in range(n):
        for _ in range(20):
            p = (rnd.uniform(area[0], area[1]), rnd.uniform(area[2], area[3]), z)
            if not (avoid and avoid(p)): break
        out.append(place(m, p, rnd.uniform(0, math.tau), rnd.uniform(*scale)))
    return out

def proc_tree(loc, h=6.0, crown=2.6, seed=0, leaf='#3f5a24'):
    rnd = random.Random(seed)
    cyl('trunk', .22, h * .6, (loc[0], loc[1], h * .3), S('#4a3624', .9), seg=12, r2=.14)
    lm = S(leaf, .7, sss=.1)
    for i in range(9):
        p = (loc[0] + rnd.uniform(-1, 1) * crown * .6, loc[1] + rnd.uniform(-1, 1) * crown * .6, h * .62 + rnd.uniform(0, crown))
        o = sphere('leafball', crown * rnd.uniform(.45, .7), p, lm, seg=24, rings=12)
        tx = bpy.data.textures.new('lf', 'VORONOI'); tx.noise_scale = .35
        md = o.modifiers.new('d', 'DISPLACE'); md.texture = tx; md.strength = .35
        s2 = o.modifiers.new('s', 'SUBSURF'); s2.levels = 1; s2.render_levels = 2
        o.modifiers.move(1, 0)

def cottage(loc, rot=0.0, w=7, d=5.5, h=3.2, wall='plaster', roof='roof', seed=0, lit=False):
    r = bpy.data.objects.new('cottage', None); bpy.context.scene.collection.objects.link(r)
    def P(o): o.parent = r; return o
    P(box('walls', (w, d, h), (0, 0, h / 2), T(wall, 2, '#efe4cf')))
    # roof prism
    bm = bmesh.new(); rh = d * .55
    vs = [bm.verts.new(v) for v in [(-w / 2 - .4, -d / 2 - .5, h), (w / 2 + .4, -d / 2 - .5, h), (w / 2 + .4, 0, h + rh), (-w / 2 - .4, 0, h + rh),
                                     (-w / 2 - .4, d / 2 + .5, h), (w / 2 + .4, d / 2 + .5, h)]]
    bm.faces.new((vs[0], vs[1], vs[2], vs[3])); bm.faces.new((vs[3], vs[2], vs[5], vs[4]))
    bm.faces.new((vs[0], vs[3], vs[4])); bm.faces.new((vs[1], vs[5], vs[2]))
    ro = P(lib.obj_from_bm('roof', bm, T(roof, 1.6)))
    sol = ro.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = .18
    P(box('gable', (w, .02, 0.01), (0, 0, h), S('#ece6da')))
    P(box('door', (1.0, .12, 2.1), (w * .2, -d / 2 - .02, 1.05), S('#5a2e1e', .5, coat=.2)))
    for xx in (-w * .25, w * .38):
        if abs(xx - w * .2) < 1: continue
        P(box('wframe', (1.1, .1, 1.1), (xx, -d / 2 - .03, 1.8), S('#ece6da', .5)))
        P(box('wglass', (.95, .1, .95), (xx, -d / 2 - .05, 1.8), lit_glass() if lit else glass()))
        P(box('shutter', (.45, .06, 1.1), (xx - .8, -d / 2 - .04, 1.8), S('#3f6b4a', .6)))
        P(box('shutter', (.45, .06, 1.1), (xx + .8, -d / 2 - .04, 1.8), S('#3f6b4a', .6)))
    P(box('chimney', (.6, .6, 2), (-w * .3, d * .15, h + rh * .8), T('brick', 1)))
    r.location = loc; r.rotation_euler = (0, 0, rot)
    return r

def fence(p0, p1, h=1.0, step=1.2):
    p0, p1 = Vector(p0), Vector(p1); n = max(1, int((p1 - p0).length / step)); w = T('planks', .6, '#c8b8a0')
    ang = math.atan2((p1 - p0).y, (p1 - p0).x)
    for i in range(n + 1):
        p = p0 + (p1 - p0) * i / n; box('fpost', (.1, .1, h), (p.x, p.y, h / 2), w, rot=(0, 0, ang))
    for z in (.35, .75):
        m = (p0 + p1) / 2; box('rail', ((p1 - p0).length, .05, .1), (m.x, m.y, z * h), w, rot=(0, 0, ang))

def fog(size, loc, density=.012, col='#d8dde8', anis=.3):
    o = box('fog', size, loc, None)
    m = bpy.data.materials.new('fog'); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links
    N.remove(N['Principled BSDF']); v = N.new('ShaderNodeVolumePrincipled')
    v.inputs['Density'].default_value = density; v.inputs['Color'].default_value = (*lin(col), 1); v.inputs['Anisotropy'].default_value = anis
    L.new(v.outputs[0], N['Material Output'].inputs['Volume']); o.data.materials.append(m)
    o.visible_shadow = False
    return o

def water(size, loc, col='#0f2a30', rough=.03, ocean=False, choppy=1.2, wave=1.6, res=12, seed=0):
    m = S(col, rough, spec=1.0)
    if ocean:
        o = plane('sea', 2, 2, loc, m)
        md = o.modifiers.new('ocean', 'OCEAN'); md.geometry_mode = 'GENERATE'; md.size = 1; md.spatial_size = int(size[0])
        md.resolution = res if not lib.DRAFT else 8; md.choppiness = choppy; md.wave_scale = wave; md.wind_velocity = 9; md.random_seed = seed
        md.repeat_x = 1; md.repeat_y = 1; md.use_normals = True
        try: md.viewport_resolution = 4
        except Exception: pass
        o.location = loc
        for p in o.data.polygons: p.use_smooth = True
        return o
    return plane('water', size[0], size[1], loc, m)

def wall_y(x, y0, y1, H, m, holes=(), t=.4):
    """Wall along Y at x with rectangular openings holes=[(yc, w, z0, z1)] so sunlight can come in."""
    ys = sorted(holes)
    cur = y0
    for (yc, w, z0, z1) in ys:
        if yc - w / 2 > cur: box('wseg', (t, yc - w / 2 - cur, H), (x, (cur + yc - w / 2) / 2, H / 2), m)
        box('wlow', (t, w, z0), (x, yc, z0 / 2), m); box('whigh', (t, w, H - z1), (x, yc, (z1 + H) / 2), m)
        box('wsill', (t + .2, w + .1, .1), (x, yc, z0), S('#d8cfc0', .7))
        for k in (-1, 0, 1): box('mull', (.08, .08, z1 - z0), (x, yc + k * w / 3.2, (z0 + z1) / 2), S('#2a2a2a', .5))
        box('mullh', (.08, w, .08), (x, yc, z0 + (z1 - z0) * .62), S('#2a2a2a', .5))
        cur = yc + w / 2
    if y1 > cur: box('wseg', (t, y1 - cur, H), (x, (cur + y1) / 2, H / 2), m)

# --------------------------------------------------------------- vehicles
def model_t(loc, rot=0.0, paint='#14161a'):
    """1910s car, ~3.4 m long, front towards +X in local space."""
    r = bpy.data.objects.new('car', None); bpy.context.scene.collection.objects.link(r)
    def P(o): o.parent = r; return o
    pm = S(paint, .18, coat=1.0); chrome = S('#d8d8d8', .12, metal=1.0); rub = S('#1a1a1a', .8); seat = S('#5a2e1e', .55, coat=.2)
    wood = S('#7a4a28', .5, coat=.3)
    P(box('chassis', (3.3, .9, .14), (0, 0, .62), S('#111', .5)))
    P(box('hood', (1.0, .8, .52), (1.05, 0, 1.0), pm, bevel=.06, seg=3))
    P(box('radiator', (.12, .78, .7), (1.6, 0, 1.05), chrome, bevel=.03))
    P(box('grille', (.04, .62, .55), (1.67, 0, 1.05), S('#222', .4, metal=.8)))
    P(box('cowl', (.25, .98, .62), (.48, 0, 1.0), pm, bevel=.05))
    P(box('tub', (1.55, 1.18, .62), (-.45, 0, .98), pm, bevel=.09, seg=4))
    P(box('seat_back', (.2, 1.0, .5), (-.75, 0, 1.45), seat, bevel=.06))
    P(box('seat', (.55, 1.0, .18), (-.5, 0, 1.18), seat, bevel=.05))
    P(box('windshield', (.03, .95, .55), (.36, 0, 1.6), S('#cfe0e8', .02, trans=.95, spec=.8)))
    P(box('wsframe', (.05, 1.0, .05), (.36, 0, 1.88), chrome))
    for sy in (-1, 1):
        P(box('wspost', (.04, .04, .6), (.36, sy * .49, 1.58), chrome))
        P(box('roofpost', (.04, .04, 1.0), (-1.05, sy * .55, 1.75), S('#111', .5)))
        P(box('roofpost', (.04, .04, .7), (.34, sy * .52, 2.05), S('#111', .5)))
        P(box('board', (2.0, .32, .04), (-.1, sy * .72, .55), rub))
    P(box('roof', (1.55, 1.25, .06), (-.35, 0, 2.28), S('#151515', .7), bevel=.02))
    P(smooth_tube('steer', [(.15, .22, 1.2), (-.05, .22, 1.5)], .02, S('#111', .4)))
    P(torus('wheel', .18, .018, (-.07, .22, 1.53), wood, rot=(0, math.radians(-60), 0), seg=32, mseg=8))
    for sy in (-1, 1):
        P(sphere('lamp', .1, (1.55, sy * .48, 1.35), chrome, seg=24, rings=12, scale=(1.2, 1, 1)))
        P(sphere('lens', .08, (1.66, sy * .48, 1.35), S('#fff2d8', .05, emit='#fff0c8', emit_strength=1.0), seg=16, rings=8, scale=(.4, 1, 1)))
    for x in (1.05, -1.1):
        for sy in (-1, 1):
            P(torus('tire', .36, .07, (x, sy * .72, .42), rub, rot=(math.pi / 2, 0, 0), seg=40, mseg=12))
            P(cyl('hub', .07, .14, (x, sy * .72, .42), chrome, rot=(math.pi / 2, 0, 0), seg=16))
            for k in range(12):
                a = k * math.tau / 12
                P(box('spoke', (.03, .03, .32), (x + math.sin(a) * .17, sy * .72, .42 + math.cos(a) * .17), wood, rot=(0, a, 0)))
            P(torus('fender', .45, .04, (x, sy * .72, .42), pm, rot=(math.pi / 2, 0, 0), seg=24, mseg=8, arc=math.pi))
    r.location = loc; r.rotation_euler = (0, 0, rot)
    return r

def loft(name, sections, m=None, close_ends=True):
    bm = bmesh.new(); rings = [[bm.verts.new(p) for p in s] for s in sections]
    k = len(sections[0])
    for A, B in zip(rings, rings[1:]):
        for i in range(k - 1): bm.faces.new((A[i], A[i + 1], B[i + 1], B[i]))
    if close_ends:
        for R in (rings[0], rings[-1]):
            try: bm.faces.new(R)
            except Exception: pass
    bm.normal_update()
    o = lib.obj_from_bm(name, bm, m)
    for p in o.data.polygons: p.use_smooth = True
    return o

def steamship(loc, rot=0.0, L=60.0, B=9.0, D=7.0, hull='#1d1d22', boot='#7a2420', funnel='#c8932a'):
    r = bpy.data.objects.new('ship', None); bpy.context.scene.collection.objects.link(r)
    def P(o): o.parent = r; return o
    secs = []
    for i in range(41):
        t = i / 40; x = -L / 2 + L * t
        w = B / 2 * (1 - max(0, (t - .72) / .28) ** 1.6) ** .8 * (1 - max(0, (.08 - t) / .08) ** 2 * .3)
        w = max(w, .05)
        sheer = D + .9 * ((t - .45) ** 2) * 4
        sec = []
        for j in range(9):
            a = j / 8 * math.pi
            yy = -math.cos(a) * w; zz = -math.sin(a) ** .35 * (D - 1.5) * (1 if t > .02 else .6)
            sec.append((x, yy, zz + 1.5 if zz > -0.01 else zz))
        sec = [(x, -w, sheer)] + sec + [(x, w, sheer)]
        secs.append(sec)
    P(loft('hull', secs, S(hull, .35, coat=.4)))
    P(box('boot', (L * .96, B * .98, .9), (-.5, 0, .1), S(boot, .5)))
    P(box('deck', (L * .9, B * .9, .2), (-.5, 0, D - .2), T('planks', 1.5, '#c8b090')))
    # superstructure
    for i, (x, l, h, w) in enumerate([(-4, 22, 2.6, B * .7), (-4, 16, 2.4, B * .6), (-2, 6, 2.2, B * .5)]):
        z = D + sum(v[2] for v in [(-4, 22, 2.6), (-4, 16, 2.4), (-2, 6, 2.2)][:i])
        P(box('house', (l, w, h), (x, 0, z + h / 2), S('#efeae0', .5)))
        n = int(l / 1.6)
        for k in range(n):
            for sy in (-1, 1):
                P(cyl('port', .28, .08, (x - l / 2 + 1.6 * (k + .5), sy * (w / 2 + .01), z + h * .55), S('#1c2630', .05, spec=1), rot=(math.pi / 2, 0, 0), seg=16))
        P(box('rail', (l + .4, w + .4, .08), (x, 0, z + h + .5), S('#efeae0', .5)))
    for fx in (-1.0, -9.0):
        P(cyl('funnel', 1.5, 9, (fx, 0, D + 7.2 + 4.5), S(funnel, .45, coat=.3), seg=40))
        P(cyl('ftop', 1.52, 1.4, (fx, 0, D + 7.2 + 8.3), S('#111', .6), seg=40))
    for mx, mh in ((L * .32, 22), (-L * .36, 18)):
        P(cyl('mast', .22, mh, (mx, 0, D + mh / 2), S('#c8a878', .6), seg=12, r2=.12))
    for k in range(4):
        for sy in (-1, 1):
            P(sphere('lifeboat', 1, (-14 + k * 6, sy * (B * .35), D + 7.6), S('#f2efe8', .5), seg=24, rings=12, scale=(2.6, .7, .45)))
    # smoke
    sm = P(sphere('smoke', 4, (-1 - 12, 0, D + 26), None, seg=24, rings=12, scale=(4.5, 1.6, 1.4)))
    m = bpy.data.materials.new('smoke'); m.use_nodes = True; N = m.node_tree.nodes; Lk = m.node_tree.links
    N.remove(N['Principled BSDF']); v = N.new('ShaderNodeVolumePrincipled'); v.inputs['Color'].default_value = (*lin('#5a5652'), 1)
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = .8; nz.inputs['Detail'].default_value = 6
    cr = N.new('ShaderNodeMapRange'); Lk.new(nz.outputs['Fac'], cr.inputs['Value']); cr.inputs[1].default_value = .45; cr.inputs[2].default_value = .7; cr.inputs[4].default_value = 1.2
    Lk.new(cr.outputs[0], v.inputs['Density']); Lk.new(v.outputs[0], N['Material Output'].inputs['Volume']); sm.data.materials.append(m)
    r.location = loc; r.rotation_euler = (0, 0, rot)
    return r

def rowboat(loc, rot=0.0, col='#2e5a6a'):
    secs = []
    for i in range(13):
        t = i / 12; x = -2 + 4 * t; w = .75 * math.sin(math.pi * (.08 + .84 * t)) ** .7
        secs.append([(x, -w, .5), (x, -w * .8, .1), (x, 0, -.05), (x, w * .8, .1), (x, w, .5)])
    o = loft('rowboat', secs, S(col, .5, coat=.2), close_ends=False)
    sol = o.modifiers.new('s', 'SOLIDIFY'); sol.thickness = .05
    o.location = loc; o.rotation_euler = (0, 0, rot)
    return o
