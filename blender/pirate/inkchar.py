"""Reference-style 2D ink characters for the pirate film (drop-in for human.py: Human, EXPR, expr_track, HUMANS, Balance).
Big round white head, thick ink outline (Freestyle), line/dot eyes, flat-colour bean torso, thin black stick limbs, tiny round hands.
Pirate costumes: tricorn, bandana, beard, coat tails, sash. Front = -Y at yaw 0 ; hand targets in parent (ship) space, foot targets root-local."""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'dagar'))
import bpy
from mathutils import Vector, Matrix
import char as C
from char import Char, two_bone
from common import solid, ink_mat, smooth
from lib import sphere, lathe, box, cyl, torus, coll
from human import Balance

HUMANS = []
C.EXPR.update({
    'neutral':  dict(C.EXPR['deadpan']),
    'smirk':    dict(w=.09, smile=.025, op=0.0, bh=.0, bt=.2, ba=.2, ex=1.0, ey=.55),
    'furious':  dict(w=.10, smile=-.05, op=.06, bh=-.045, bt=.75, ba=.0, ex=1.0, ey=.7),
    'confused': dict(w=.06, smile=-.015, op=0.0, bh=.035, bt=-.25, ba=.25, ex=1.1, ey=1.2),
    'terror':   dict(w=.08, smile=-.03, op=.11, bh=.085, bt=-.45, ba=.3, ex=1.3, ey=1.5),
    'shout':    dict(w=.085, smile=-.02, op=.12, bh=.0, bt=.5, ba=.0, ex=1.0, ey=.8),
    'strain':   dict(w=.09, smile=-.045, op=.03, bh=-.02, bt=.35, ba=.0, ex=1.0, ey=.45),
    'surprise': dict(C.EXPR['shock']),
})
for k, v in C.EXPR.items(): v.setdefault('ring', 1.0 if k in ('shock', 'scream', 'worry', 'ohno', 'terror', 'confused', 'surprise') else 0.0)
for k in ('neutral', 'deadpan', 'smug', 'smirk', 'angry', 'furious', 'strain', 'sad', 'smile', 'grin', 'shout'): C.EXPR[k]['ring'] = 0.0
C.EXPR['shout']['ring'] = 1.0; C.EXPR['furious']['ring'] = 0.0
C.PKEYS = tuple(C.PKEYS) + ('ring',) if 'ring' not in C.PKEYS else C.PKEYS
EXPR = C.EXPR
expr_track = C.expr_track

class Human(Char):
    L0, TL0, RW0 = .46, .40, .175
    def __init__(self, cid, name, skin='#f4efe6', shirt='#d8d0bc', vest=None, coat=None, trousers='#1a1a1e', boots='#15131a', hair='#2a1a10', beard=None, hat=None, bandana=None,
                 scale=1.0, height=1.0, build=1.0, eye=None):
        body = coat or shirt
        kind = 'cap' if (hair and not hat and not bandana) else None
        super().__init__(cid, name, skin=skin if skin not in ('#b98a64', '#d3a784', '#a97a58') else '#f4efe6', body=body, hair=None, hat=None, scale=scale * height * .9, pants=trousers, hair_col=hair or '#2a1a10', head_r=.25)
        self.pir = []
        hz, hx, hy, cz = self.hz, self.hx, self.hy, self.cz
        self._style(cid, skin)
        def link(o): o.parent = self.head; self.pir.append(o); return o
        hcol = hair or '#2a1a10'
        def shell(name, mt, lo, sc_=1.045, up=True):
            o = sphere(cid + name, 1.0, (0, .004, cz), mt, seg=56, rings=32, scale=(hx * sc_, hy * sc_, hz * sc_)); link(o)
            for v in o.data.vertices:
                if up and v.co.z < lo * hz * sc_: v.co.z = lo * hz * sc_
                if (not up) and v.co.z > lo * hz * sc_: v.co.z = lo * hz * sc_
            smooth(o); return o
        if not hat and not bandana:                                  # hair cap with fringe
            shell('_hr', solid(hcol, .8), .5)
        if bandana:
            bm = solid(bandana, .85)
            shell('_bn', bm, .56)
            er = math.sqrt(1 - .56 ** 2) * 1.045
            bb = torus(cid + '_bnb', hx * er, .014, (0, .004, cz + hz * .56 * 1.045), bm, seg=48, mseg=8); bb.scale = (1, hy / hx, 1); link(bb)
            kn = sphere(cid + '_kn', .035, (hx * .8, hy * .45, cz + hz * .5), bm, seg=12, rings=8); link(kn)
            for i, a in enumerate((-.5, .5)):
                t = cyl(cid + f'_bt{i}', .026, .16, (hx * .78 + a * .05, hy * .72, cz + hz * .38), bm, seg=8, r2=.004, rot=(math.radians(150), a * .6, a * .5)); link(t)
        if hat == 'tricorn':
            hm = solid('#17161c', .7); gold = solid('#c9a23a', .35, metal=1.0)
            top = cz + hz * .86
            cr = cyl(cid + '_cr', hx * .72, .09, (0, 0, top + .0), hm, seg=32); link(cr)
            for i, a in enumerate((0, 120, 240)):
                br = box(cid + f'_br{i}', (hx * 1.35, hx * .95, .02), (math.sin(math.radians(a)) * hx * .48, -math.cos(math.radians(a)) * hx * .48, top - .015), hm, rot=(0, 0, math.radians(a)))
                br.rotation_euler = (0, 0, math.radians(a)); link(br)
            ed = torus(cid + '_ed', hx * .74, .008, (0, 0, top + .035), gold, seg=32, mseg=6); link(ed)
            fe = sphere(cid + '_fe', .03, (hx * .7, 0, top + .1), solid('#a82a24', .8), seg=12, rings=8, scale=(.4, .8, 3.4)); link(fe)
        if beard:
            bc = solid(beard, .9)
            shell('_bd', bc, -.56, 1.05, up=False)
            for sd in (-1, 1):
                m_ = sphere(cid + f'_mo{sd}', .03, (sd * .035, -hy * .985 + .004, cz - .088), bc, seg=14, rings=8, scale=(1.6, .5, .55), rot=(0, sd * .25, 0)); link(m_)
        if coat:                                                      # tail-coat skirt
            sk = lathe(cid + '_sk', [(0, 0), (self.rw * 1.0, 0), (self.rw * 1.34, -.2), (self.rw * 1.34, -.215), (0, -.215)], seg=40, m=solid(coat, .75), sy=.82); sk.parent = self.torso; sk.location = (0, 0, .06); self.pir.append(sk)
            gm = solid('#d4aa3c', .3, metal=1.0)
            for i in range(4):
                bt = sphere(cid + f'_bt{i}', .02, (0, -self.rw * .74 * .82 - .004, .06 + i * .075 + .03), gm, seg=12, rings=8); bt.parent = self.torso; self.pir.append(bt)
            cv = sphere(cid + '_cv', .06, (0, -.045, self.TL * 1.0), solid('#f1ece0', .9), seg=14, rings=8, scale=(1.1, .8, .9)); cv.parent = self.torso; self.pir.append(cv)
            tr = torus(cid + '_tr', self.rw * 1.0, .012, (0, 0, .24), gm, seg=40, mseg=6); tr.scale = (1, .82, 1); tr.parent = self.torso; self.pir.append(tr)
        elif vest:
            vm = solid(vest, .6)
            v = lathe(cid + '_vest', [(0, .06), (self.rw * 1.0, .06), (self.rw * 1.02, .26), (self.rw * .9, self.TL - .03), (0, self.TL - .02)], seg=40, m=vm, sy=.8); v.parent = self.torso; self.pir.append(v)
            st = box(cid + '_vs', (.05, .02, self.TL - .12), (0, -self.rw * .8 * 1.02 - .004, .06 + (self.TL - .12) / 2), solid('#e8e0cc', .9)); st.parent = self.torso; self.pir.append(st)
            sa = torus(cid + '_sash', self.rw * 1.03, .028, (0, 0, .07), solid('#9a2a24', .85), seg=40, mseg=8); sa.scale = (1, .8, 1); sa.parent = self.torso; self.pir.append(sa)
        for o in self.pir:
            for cc in list(o.users_collection): cc.objects.unlink(o)
            coll('Characters').objects.link(o)
        HUMANS.append(self)

    def _style(self, cid, skin):
        hz, hx, hy, cz = self.hz, self.hx, self.hy, self.cz
        # squashed egg head: wider at the cheeks, flat chin
        for v in self.skull.data.vertices:
            zf = v.co.z / 1.0
            v.co.x *= 1 + .07 * (-zf); v.co.y *= 1 + .02 * (-zf)
            if v.co.z < -.88: v.co.z = -.88 + (v.co.z + .88) * .35
        self.skull.data.update()
        hm = self.skull.data.materials[0]; b = hm.node_tree.nodes['Principled BSDF']
        b.inputs['Roughness'].default_value = 1.0; b.inputs['Emission Color'].default_value = (.85, .8, .95, 1); b.inputs['Emission Strength'].default_value = .18
        ink = ink_mat(); white = solid('#fbf9f6', .9)
        self.rings, self.scl, self.pup = [], [], []
        for sd in (-1, 1):
            sc_ = sphere(cid + f'_scl{sd}', .05, (0, 0, 0), white, seg=24, rings=12, scale=(1, .5, 1)); sc_.parent = self.head
            rg = torus(cid + f'_rg{sd}', .049, .0075, (0, 0, 0), ink, rot=(math.pi / 2, 0, 0), seg=32, mseg=8); rg.parent = self.head
            self.rings.append(rg); self.scl.append(sc_)
            for o in (sc_, rg):
                for cc in list(o.users_collection): cc.objects.unlink(o)
                coll('Face').objects.link(o)
        self.nose = C._curve(cid + '_nose', 4, .0075, ink, self.head)
        for o in list(self.brows):
            o.data.bevel_depth = .0115
        self.mouth.data.bevel_depth = .0065
        try:
            for cc in list(self.nose.users_collection): cc.objects.unlink(self.nose)
        except Exception: pass
        coll('Face').objects.link(self.nose)

    def face(self, p, t):
        cz = self.cz; ring = p.get('ring', 0.0)
        look = p.get('look', (0.0, 0.0))
        for i, (e, sd) in enumerate(zip(self.eyes, (-1, 1))):
            x = sd * .088; z = cz - .018
            bl = 1.0
            for b0 in self.blinks:
                if b0 <= t < b0 + .14: bl = max(.08, abs((t - b0) - .07) / .07)
            sy = self.surf_y(x, z)
            if ring > .5:
                self.scl[i].location = (x, sy - .004, z); self.scl[i].scale = (1.0 * p['ex'], 1, max(.12, p['ey'] * .95 * bl))
                self.rings[i].location = (x, sy - .014, z); self.rings[i].scale = (1.0 * p['ex'], 1, max(.12, p['ey'] * .95 * bl))
                e.location = (x + sd * -.004 + look[0] * .02, sy - .034, z + look[1] * .02 - .004); e.scale = (.55, .4, .55 * bl)
            else:
                self.scl[i].scale = (0, 0, 0); self.rings[i].scale = (0, 0, 0)
                e.location = (x, sy + .004, z + .004); e.scale = (1.75, .5, max(.1, .26 * p['ey'] * bl + .06))
        for br, sd in zip(self.brows, (-1, 1)):
            sp = br.data.splines[0]; base_z = cz + .082 + p['bh'] * 1.0 + (.012 if ring > .5 else 0)
            for i, u in enumerate((-1, 0, 1)):
                x = sd * (.088 + .036 * u)
                z = base_z + u * p['bt'] * .03 + (1 - u * u) * p['ba'] * .018
                sp.points[i].co = (x, self.surf_y(x, z) - .002, z, 1)
        nz = self.nose.data.splines[0]
        for i, (x, z) in enumerate(((0.012, cz - .01), (.02, cz - .045), (.012, cz - .062), (-.006, cz - .056))):
            nz.points[i].co = (x, self.surf_y(x, z) - .002, z, 1)
        self.nose.hide_render = p.get('op', 0) > .09
        mo = self.mouth.data.splines[0]; w, sm, op = p['w'] * .62, p['smile'] * .8, p['op']; n = 9; z0 = cz - .115
        for i in range(n):
            x = -w + 2 * w * i / (n - 1) + .006; q = ((x - .006) / w) ** 2
            ub = op * .3 * max(0.0, 1 - q) ** .5; zu = z0 + sm * q + ub; mo.points[i].co = (x, self.surf_y(x, zu) - .002, zu, 1)
            zl = z0 + sm * q - op * .7 * max(0.0, 1 - q) ** .5; j = 2 * n - 2 - i
            if 0 < i < n - 1: mo.points[j].co = (x, self.surf_y(x, zl) - .002, zl, 1)
        vs = self.mfill.data.vertices
        for i in range(n):
            x = -w + 2 * w * i / (n - 1) + .006; q = ((x - .006) / w) ** 2; zu = z0 + sm * q + op * .3 * max(0.0, 1 - q) ** .5; zl = z0 + sm * q - op * .7 * max(0.0, 1 - q) ** .5
            for r in range(5):
                z = zu + (zl - zu) * r / 4; vs[r * 9 + i].co = (x, self.surf_y(x, z) - .0015, z)

    def apply(self, t):
        s = self.fn(t); sc = self.s
        loc = Vector(s.get('loc', (0, 0, 0))); yaw = s.get('yaw', 0.0)
        M = Matrix.Translation(loc) @ Matrix.Rotation(math.radians(yaw), 4, 'Z'); Mi = (M @ Matrix.Scale(sc, 4)).inverted()
        self.root.location = loc; self.root.rotation_euler = (0, 0, math.radians(yaw))
        l0, l1 = s.get('lean', (0, 0)); k = 2.2; crouch = s.get('crouch', 0.0); bob = s.get('bob', 0.0) + .0
        self.torso.rotation_euler = (l0 * k, l1 * k, s.get('twist', 0.0))
        hy_, hp, hr_ = s.get('head', (0, 0, 0)); self.head.rotation_euler = (math.radians(hp), math.radians(hr_), math.radians(hy_))
        drop = (crouch + bob) / sc * 1.0
        hip0 = Vector((s.get('sway', 0.0) * 1.0, 0, self.L - drop)); self.torso.location = hip0
        R = Matrix.Rotation(l0 * k, 3, 'X') @ Matrix.Rotation(l1 * k, 3, 'Y')
        for sd in ('L', 'R'):
            side = -1 if sd == 'L' else 1
            sh = hip0 + R @ Vector((side * self.rw * .98, 0, self.TL * .84)); tg = s.get('hand' + sd)
            tgl = Vector((side * .22, -.02, self.L + self.TL * .12 - drop)) if tg is None else Mi @ Vector(tg)
            el, hd = two_bone(sh, tgl, .31, .31, Vector((side * .5, .8, -.4)))
            for pnt, v in zip(self.arms[sd].data.splines[0].points, (sh, el, hd)): pnt.co = (v.x, v.y, v.z, 1)
            self.hands[sd].location = hd
        for sd in ('L', 'R'):
            side = -1 if sd == 'L' else 1
            hip = hip0 + Vector((side * self.rw * .5, 0, -.01)); ft = Vector(s.get('foot' + sd, (side * .11, 0, 0))) / sc * 1.0
            tgl = Vector((ft.x, ft.y, ft.z + .04))
            kn, fo = two_bone(hip, tgl + Vector((0, 0, .03)), .29, .29, Vector((0, -1, .1)))
            for pnt, v in zip(self.legs[sd].data.splines[0].points, (hip, kn, fo)): pnt.co = (v.x, v.y, v.z, 1)
            self.shoes[sd].location = tgl + Vector((0, -.045, 0)); self.shoes[sd].rotation_euler = (0, 0, math.radians(s.get('footyaw' + sd, 0)))
        self.face(s.get('face', EXPR['neutral']), t)
