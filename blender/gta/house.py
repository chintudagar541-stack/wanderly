"""The middle-class flat and the colony street for the 'Indian Middle Class Edition' parody (DAGAR CLIPS ink style).

Interior (floor z=0, walls 2.8 m, ceiling): LIVING room x[-3, 2] y[0, 4.5] - sofa on the back wall facing -Y, TV on the front
wall, centre table with newspaper and chai; front door in the front wall (x -1.4..-0.4) to the porch.
BEDROOM x[2, 5.2] y[1.5, 4.5] through a doorway in the living room's right wall (y 2.6..3.5): bed along the back wall,
desk with a glowing PC, gamer posters, ceiling fan.
Outside: porch y[-1.6, 0], gate at y -1.6, colony street y[-8, -2.4] along X, row houses on both sides, electric poles
with wires, scooter, a chai stall and a gas agency across the street."""
import math, random, os
import bpy, bmesh
from mathutils import Vector
import town as T
import lib
from town import box, cyl, plain, put
import city as C

H = 2.8
LIV = (-3.0, 2.0, 0.0, 4.5); BED = (2.0, 5.2, 1.5, 4.5)
DOOR = (-1.4, -0.4)
SOFA = Vector((-.6, 3.85, 0)); TV = Vector((-.6, .35, 0)); TABLE = Vector((-.6, 2.35, 0))
BEDC = Vector((4.05, 3.65, 0)); BED_TOP = .5
_M = {}


def mat_ph(name, kws, col, scale=1.0, tint=None):
    key = name
    if key in _M: return _M[key]
    m = None
    if T.PH:
        try: m = lib.mat_ph(name, *kws, scale=scale, tint=tint, bump=.4, res=os.environ.get('PH_RES', '1k'))
        except Exception as e: lib.log('house PH', name, e)
    if m is None: m = plain(name, col, .85)
    _M[key] = m; return m


def checker(name, c1, c2, scale=10.0, rough=.85, lines=None):
    """object-space checks (bedsheets, lungi): two colours + optional thin light lines"""
    key = ('chk', name)
    if key in _M: return _M[key]
    m = bpy.data.materials.new(name); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links; b = N['Principled BSDF']
    tc = N.new('ShaderNodeTexCoord'); ck = N.new('ShaderNodeTexChecker'); ck.inputs['Scale'].default_value = scale
    ck.inputs['Color1'].default_value = (*T.hexc(c1)[:3], 1); ck.inputs['Color2'].default_value = (*T.hexc(c2)[:3], 1)
    L.new(tc.outputs['Object'], ck.inputs['Vector']); out = ck.outputs['Color']
    if lines:
        br = N.new('ShaderNodeTexBrick'); br.inputs['Scale'].default_value = scale / 2; br.inputs['Mortar Size'].default_value = .02; br.offset = 0
        br.inputs['Brick Width'].default_value = 1; br.inputs['Row Height'].default_value = 1
        br.inputs['Color1'].default_value = (1, 1, 1, 1); br.inputs['Color2'].default_value = (1, 1, 1, 1); br.inputs['Mortar'].default_value = (*T.hexc(lines)[:3], 1)
        L.new(tc.outputs['Object'], br.inputs['Vector'])
        mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1
        L.new(out, mx.inputs['A']); L.new(br.outputs['Color'], mx.inputs['B']); out = mx.outputs['Result']
    L.new(out, b.inputs['Base Color']); b.inputs['Roughness'].default_value = rough
    _M[key] = m; return m


def wall(name, a, b, h=H, mat=None, holes=(), thick=.12):
    """straight wall from a to b (2D) with rectangular holes [(u0, u1, z0, z1)] along it"""
    a, b = Vector((*a, 0)), Vector((*b, 0)); d = (b - a); L_ = d.length; dn = d.normalized(); ang = math.atan2(dn.y, dn.x)
    cuts = sorted(holes); segs = []; u = 0.0
    for (u0, u1, z0, z1) in cuts:
        if u0 > u: segs.append((u, u0, 0, h))
        if z0 > 0: segs.append((u0, u1, 0, z0))
        if z1 < h: segs.append((u0, u1, z1, h))
        u = u1
    if u < L_: segs.append((u, L_, 0, h))
    for k, (u0, u1, z0, z1) in enumerate(segs):
        c = a + dn * ((u0 + u1) / 2)
        box(f'{name}{k}', (u1 - u0, thick, z1 - z0), (c.x, c.y, (z0 + z1) / 2), mat, rot=(0, 0, ang))


def window(name, c, w, h, facing, grill=True, light=None):
    """a window frame + glass + iron grill; facing = outward normal (2D)"""
    ang = math.atan2(facing[1], facing[0]) - math.pi / 2
    fr = plain('winframe', '#e8e2d4', .6); gl = plain('winglass', '#b8d0e0', .05, emit='#dff0ff', strength=1.2); ir = plain('grill', '#1c1e20', .5, .6)
    root = bpy.data.objects.new(name, None); T.coll('Town').objects.link(root); root.location = c; root.rotation_euler = (0, 0, ang)
    parts = [box(name + '_gl', (w, .02, h), (0, 0, 0), gl)]
    for x in (-w / 2, 0, w / 2): parts.append(box(f'{name}_fv{x}', (.05, .08, h + .05), (x, 0, 0), fr))
    for z in (-h / 2, h / 2): parts.append(box(f'{name}_fh{z}', (w + .05, .08, .05), (0, 0, z), fr))
    if grill:
        for k in range(7): parts.append(cyl(f'{name}_g{k}', .008, h, (-w / 2 + w * (k + .5) / 7, -.06, 0), ir, v=6))
    for p in parts: p.parent = root
    if light:
        l = bpy.data.lights.new(name + '_l', 'AREA'); l.energy = light; l.size = max(w, h); l.color = (1, .93, .82)
        lo = bpy.data.objects.new(name + '_l', l); T.coll('Town').objects.link(lo); lo.parent = root; lo.location = (0, .25, 0); lo.rotation_euler = (math.radians(-90), 0, 0)
    return root


def ceiling_fan(name, c):
    m = plain('fanwhite', '#ece8e0', .5); rod = cyl(name + '_rod', .015, .45, (c.x, c.y, H - .225), m, v=8)
    hub = cyl(name + '_hub', .1, .1, (c.x, c.y, H - .5), m, v=16)
    blades = bpy.data.objects.new(name + '_bl', None); T.coll('Town').objects.link(blades); blades.location = (c.x, c.y, H - .52)
    for k in range(3):
        a = k * math.tau / 3
        b_ = box(f'{name}_b{k}', (.55, .1, .012), (math.cos(a) * .35, math.sin(a) * .35, 0), m, rot=(0, 0, a)); b_.parent = blades
    return blades


def poster(name, txt, c, w, h, facing, bg, fg, size=(600, 840)):
    return C.sign(name, txt, w, h, c, facing=facing, bg=bg, fg=fg, size=size, font_scale=.5, border=fg)


def interior(night=False):
    floor = mat_ph('floortile', ('marble', 'tiles', 'floor'), '#d8ccb8', scale=.8)
    paint_l = mat_ph('wall_living', ('plaster', 'painted', 'wall'), '#e8d8b0', scale=.6, tint='#f0dca8')
    paint_b = mat_ph('wall_bed', ('plaster', 'painted', 'wall'), '#a8c8d8', scale=.6, tint='#a8cce0')
    box('floor', (8.4, 4.8, .06), (1.1, 2.25, -.03), floor)
    box('ceiling', (8.4, 4.8, .06), (1.1, 2.25, H + .03), plain('ceilingw', '#f0ece4', .9))
    x0, x1, y0, y1 = LIV
    wall('lw_front', (x0, y0), (x1, y0), mat=paint_l, holes=[(DOOR[0] - x0, DOOR[1] - x0, 0, 2.1), (3.2, 4.4, 1.0, 2.1)])
    wall('lw_back', (x0, y1), (x1, y1), mat=paint_l, holes=[(1.0, 2.2, 1.0, 2.1)])
    wall('lw_left', (x0, y0), (x0, y1), mat=paint_l)
    wall('lw_right', (x1, y0), (x1, y1), mat=paint_l, holes=[(2.6, 3.5, 0, 2.1)])
    bx0, bx1, by0, by1 = BED
    wall('bw_front', (bx0, by0), (bx1, by0), mat=paint_b)
    wall('bw_back', (bx0, by1), (bx1, by1), mat=paint_b)
    wall('bw_right', (bx1, by0), (bx1, by1), mat=paint_b, holes=[(1.0, 2.1, 1.0, 2.0)])
    for nm, y in (('skirt_l', 0), ): pass
    # windows (morning light)
    window('win_lfront', (x0 + 3.8, y0, 1.55), 1.2, 1.1, (0, -1), light=None)
    window('win_lback', (x0 + 1.6, y1, 1.55), 1.2, 1.1, (0, 1), light=120)
    window('win_bed', (bx1, by0 + 1.55, 1.5), 1.1, 1.0, (1, 0), light=220)
    # front door (open inward) and frame
    dw = plain('doorwood', '#6a3e22', .5)
    d = box('frontdoor', (1.0, .06, 2.08), (0, 0, 0), dw); d.location = (DOOR[0] + .5 * math.cos(math.radians(100)) + 0, .5 * math.sin(math.radians(100)), 1.04)
    d.rotation_euler = (0, 0, math.radians(100))
    d.location = (DOOR[0] + .03, .5, 1.04)
    for x in DOOR: box(f'dframe{x}', (.08, .16, 2.12), (x, 0, 1.06), dw)
    # living room furniture
    sofa_m = mat_ph('sofa', ('fabric', 'leather'), '#7a3a2a', scale=.5, tint='#8a4430')
    s = SOFA
    box('sofa_base', (2.2, .8, .3), (s.x, s.y, .2), sofa_m, bevel=.04)
    box('sofa_back', (2.2, .22, .55), (s.x, s.y + .32, .55), sofa_m, bevel=.05)
    for sx in (-1, 1): box(f'sofa_arm{sx}', (.2, .8, .45), (s.x + sx * 1.1, s.y, .32), sofa_m, bevel=.05)
    for k in range(3): box(f'sofa_cush{k}', (.68, .62, .1), (s.x - .7 + k * .7, s.y - .04, .4), sofa_m, bevel=.04)
    T.lib.sphere('sofa_pillow', .14, (s.x + .85, s.y + .12, .55), checker('pillowck', '#d8a020', '#c86020', 30)).scale = (1, .45, 1)
    tw = plain('teak', '#5a3420', .45)
    t = TABLE; box('ctable_top', (1.1, .6, .05), (t.x, t.y, .42), tw, bevel=.01)
    for sx in (-1, 1):
        for sy in (-1, 1): box(f'ctable_leg{sx}{sy}', (.05, .05, .4), (t.x + sx * .48, t.y + sy * .24, .2), tw)
    cyl('chai_cup', .035, .07, (t.x + .3, t.y - .1, .48), plain('cup', '#f4f0e8', .4), v=12)
    cyl('chai_tea', .032, .005, (t.x + .3, t.y - .1, .515), plain('chai', '#a8703a', .3), v=12)
    v = TV; box('tv_cab', (1.6, .45, .55), (v.x, v.y, .28), tw, bevel=.02)
    box('tv', (1.1, .08, .65), (v.x, v.y + .02, .9), plain('tvbody', '#141416', .3))
    box('tv_scr', (1.02, .01, .58), (v.x, v.y + .065, .9), plain('tvscr', '#203048', .2, emit='#3060a0', strength=.6))
    # walls: clock, calendar, family photos, tube light, curtains
    cyl('clock', .17, .03, (x0 + 2.5, y1 - .08, 2.15), plain('clockface', '#f4f0e8', .5), rot=(math.pi / 2, 0, 0), v=24)
    C.sign('calendar', '2026\nNOVEMBER', .4, .55, (x0 + .1, 2.0, 1.7), facing=(1, 0), bg='#f4f0e4', fg='#b02020', size=(400, 550))
    for k in range(3):
        C.sign(f'photo{k}', '', .32, .4, (s.x - .7 + k * .7, y1 - .07, 1.75 + (k % 2) * .08), facing=(0, -1), bg=['#8a6a4a', '#5a7a8a', '#7a5a6a'][k], fg='#000000', size=(64, 80), border='#d8b040')
    box('tubelight', (1.2, .05, .05), (s.x, y1 - .1, 2.45), plain('tube', '#ffffff', .2, emit='#fff8e8', strength=8 if night else 3))
    for x in (x0 + 1.0, x0 + 2.2): box(f'curtain{x}', (.25, .05, 1.5), (x, y1 - .1, 1.5), plain('curtain', '#c86a3a', .9))
    # shoe rack + chappals by the door, papa's spare slipper by the sofa
    box('shoerack', (.6, .3, .5), (DOOR[0] - .55, .25, .25), tw)
    # bedroom
    bc = BEDC; bw_ = plain('bedwood', '#6a4028', .5)
    box('bed_frame', (2.0, 1.05, .32), (bc.x, bc.y, .16), bw_, bevel=.02)
    box('bed_head', (.08, 1.1, .85), (bc.x + 1.0, bc.y, .42), bw_, bevel=.02)
    box('mattress', (1.95, 1.0, .16), (bc.x, bc.y, .4), checker('bedsheet', '#2a5aa8', '#3a78c0', 14, lines='#e8e8e0'), bevel=.04)
    box('pillow', (.35, .55, .1), (bc.x + .75, bc.y, .52), plain('pillow', '#f0ece4', .8), bevel=.04)
    box('blanket', (1.0, 1.04, .06), (bc.x - .4, bc.y, .5), checker('blanket', '#c84a3a', '#a83a2a', 10), bevel=.03)
    box('desk', (1.1, .55, .05), (bx0 + .75, by0 + .45, .72), tw)
    for sx in (-1, 1): box(f'desk_leg{sx}', (.05, .5, .7), (bx0 + .75 + sx * .5, by0 + .45, .35), tw)
    box('monitor', (.55, .05, .35), (bx0 + .75, by0 + .32, 1.0), plain('tvbody', '#141416', .3))
    box('monitor_scr', (.5, .01, .3), (bx0 + .75, by0 + .35, 1.0), plain('pcscr', '#102040', .2, emit='#40a0ff', strength=2.5))
    box('pc', (.18, .4, .42), (bx0 + 1.2, by0 + .45, .96), plain('pc', '#1a1a1e', .4))
    T.lib.sphere('clothes', .25, (bx0 + .5, by0 + 1.05, .55), plain('clothes', '#4a6a3a', .9)).scale = (1, .8, .5)
    box('chair', (.45, .45, .05), (bx0 + .5, by0 + 1.05, .45), tw)
    poster('poster1', 'LEVEL\nUP', (bx0 + 1.6, by1 - .07, 1.7), .6, .85, (0, -1), '#1a1a3a', '#40e0ff')
    poster('poster2', 'NO\nSLEEP\nJUST\nGAMES', (bx1 - .07, by0 + 2.5, 1.6), .55, .8, (-1, 0), '#3a0a1a', '#ff5070')
    fan = ceiling_fan('fan_bed', Vector((bc.x - .4, bc.y - .6, 0)))
    fan2 = ceiling_fan('fan_liv', Vector((TABLE.x, TABLE.y, 0)))
    return dict(fans=[fan, fan2])


def street(night=False):
    road = mat_ph('road', ('asphalt', 'road'), '#5a5650', scale=.35)
    dirt = mat_ph('dust', ('dirt', 'ground', 'gravel'), '#a89070', scale=.4)
    box('road', (60, 5.6, .06), (0, -5.2, -.03), road)
    box('kerb_n', (60, .9, .1), (0, -2.0, .02), dirt); box('kerb_s', (60, .9, .1), (0, -8.4, .02), dirt)
    box('porch', (3.4, 1.6, .12), (-.9, -.8, .06), mat_ph('porch', ('concrete', 'tiles'), '#b8b0a0', scale=.6))
    box('ground_far', (300, 300, .1), (0, 0, -.12), dirt)
    gate = plain('gate', '#2a4a3a', .5, .4)
    for x in (-1.45, -.35): box(f'gatepost{x}', (.2, .2, 1.3), (x, -1.65, .65), plain('post', '#d8c8a8', .7))
    for k in range(8): cyl(f'gatebar{k}', .012, 1.0, (-2.6 - k * .14, -1.65, .55), gate, v=6)
    box('compound', (5.0, .15, 1.1), (-4.0, -1.65, .55), plain('compound', '#e0d0b0', .8)); box('compound2', (5.0, .15, 1.1), (2.2, -1.65, .55), plain('compound', '#e0d0b0', .8))
    # our house front (outside of the living room wall) + the neighbours on both sides of the street
    r = random.Random(4)
    cols = ['#e8c890', '#b8d8c8', '#f0b8a8', '#c8c0e8', '#f0e0a0', '#a8c8e0', '#e8a888', '#d0e0a8']
    box('our_house_up', (8.4, .12, 3.2), (1.1, -.06, 4.4), mat_ph('ourpaint', ('plaster', 'painted'), '#e8c890', .6, '#ecd090'))
    box('our_parapet', (8.4, .3, .5), (1.1, -.1, 6.2), plain('parapet', '#d8b878', .8))
    window('our_win_up', (0.4, -.08, 4.3), 1.4, 1.1, (0, -1))
    box('balcony', (2.2, .9, .12), (2.6, -.5, 3.0), plain('slab', '#c8c0b0', .8))
    for k in range(10): cyl(f'balrail{k}', .015, .8, (1.6 + k * .22, -.92, 3.45), plain('rail', '#2a2a2a', .5, .5), v=6)
    C.sign('nameplate', 'SHARMA\nNIWAS', .6, .32, (-1.75, -.08, 1.6), facing=(0, -1), bg='#2a2a2a', fg='#e8d8a0', size=(500, 270))
    for side, yf in ((-1, -9.0), (1, None)):
        x = -26.0
        while x < 26:
            w = r.uniform(5, 7.5)
            if side == 1 and -3.4 < x + w / 2 < 6.0: x += w + .3; continue          # our house
            col = r.choice(cols); h = r.choice([6.2, 6.5, 9.4])
            y = (yf - 4.0) if side == -1 else 4.0
            box(f'nb{side}_{x:.0f}', (w, 8.0, h), (x + w / 2, y, h / 2), C.windows(f'nbw{col}', col, glass='#2a3440', lit=.05 if not night else .5, cols=2.0, rows=3.2, emit=.8))
            ff = y + (4.0 if side == -1 else -4.0)
            box(f'nbbal{side}_{x:.0f}', (w * .7, 1.0, .12), (x + w / 2, ff + (.5 if side == -1 else -.5), 3.1), plain('slab', '#c8c0b0', .8))
            for k in range(int(w * .7 / .25)): cyl(f'nbr{side}_{x:.0f}_{k}', .012, .8, (x + w * .15 + k * .25, ff + (1.0 if side == -1 else -1.0), 3.55), plain('rail', '#2a2a2a', .5, .5), v=6)
            if r.random() < .5: box(f'ac{side}_{x:.0f}', (.8, .3, .55), (x + w * .75, ff + (.16 if side == -1 else -.16), 4.6), plain('ac', '#e8e8e4', .4))
            if r.random() < .6:                                   # clothes line on the balcony
                for k in range(4): box(f'cl{side}_{x:.0f}_{k}', (.35, .02, .5), (x + w * .3 + k * .45, ff + (.9 if side == -1 else -.9), 3.6), plain('cloth' + str(k), ['#c83030', '#3060c0', '#e8c030', '#f0f0f0'][k], .9))
            x += w + .3
    # shops across the road
    C.sign('gas_shop', 'SHARMA GAS AGENCY', 4.2, .7, (3.5, -9.0 + .1, 2.6), facing=(0, 1), bg='#c01818', fg='#ffffff', size=(1024, 170))
    C.sign('chai_shop', 'CHAI  -  10 Rs', 2.6, .6, (-7.5, -9.0 + .1, 2.5), facing=(0, 1), bg='#f0d020', fg='#2a1a10', size=(800, 180))
    for k in range(5): cyl(f'shopcyl{k}', .16, .7, (2.2 + k * .45, -8.6, .38), plain('lpg', '#c81818', .35), v=16)
    # electric poles + a tangle of wires
    pm = plain('pole', '#8a8a84', .8)
    poles = [(-8.5, -2.2), (1.5, -2.2), (11.5, -2.2), (-3.0, -8.6), (7.0, -8.6)]
    for k, (x, y) in enumerate(poles):
        cyl(f'pole{k}', .1, 8.0, (x, y, 4.0), pm, v=10); box(f'polebar{k}', (1.2, .08, .08), (x, y, 7.4), pm)
    wire = plain('wire', '#1a1a1a', .6)
    rr = random.Random(9)
    for a, b in ((0, 1), (1, 2), (0, 3), (3, 4), (1, 4), (2, 4), (1, 3)):
        pa, pb = Vector((*poles[a], 7.4)), Vector((*poles[b], 7.4))
        for j in range(3):
            off = Vector((0, 0, -.1 * j)) + Vector((rr.uniform(-.4, .4), 0, 0)); sag = rr.uniform(.4, 1.0); pts = []
            for k in range(12):
                u = k / 11; p = pa.lerp(pb, u) + off; p.z -= sag * math.sin(u * math.pi); pts.append(p)
            T.lib.tube(f'wire{a}{b}{j}', pts, .008, m=wire) if hasattr(T.lib, 'tube') else None
    # scooter
    sc = Vector((3.2, -3.4, 0)); body = plain('scooter', '#2a6ab0', .3, .2); blk = plain('tire', '#141416', .9)
    for dy in (-.55, .55): cyl(f'scw{dy}', .2, .1, (sc.x, sc.y + dy, .2), blk, rot=(0, math.pi / 2, 0), v=16)
    box('sc_body', (.35, 1.2, .35), (sc.x, sc.y + .1, .42), body, bevel=.08); box('sc_seat', (.3, .6, .1), (sc.x, sc.y + .2, .68), plain('seat', '#1a1a1a', .5), bevel=.03)
    box('sc_front', (.32, .2, .7), (sc.x, sc.y - .5, .6), body, bevel=.06); cyl('sc_bar', .02, .6, (sc.x, sc.y - .55, .98), blk, rot=(0, math.pi / 2, 0), v=8)
    # potted plants, a cycle, a stray cow-free street dog... keep it simple: plants + water tank on the roof
    for k, x in enumerate((-3.2, 1.2, 5.5)):
        cyl(f'pot{k}', .16, .3, (x, -1.9, .15), plain('pot', '#a85a30', .8), v=12); T.lib.sphere(f'plant{k}', .25, (x, -1.9, .48), plain('leafy', '#3a7a2a', .8))
    cyl('tank', .55, .9, (-1.5, 1.5, 6.9), plain('tank', '#1a1a1a', .5), v=20)


def build(night=False):
    out = interior(night); street(night)
    sun = bpy.data.objects.get('sun')
    return out
