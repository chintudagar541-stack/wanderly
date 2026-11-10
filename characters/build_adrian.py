"""ADRIAN CROSS - 29, charming, sarcastic, dangerously intelligent.  Messy dark hair, sharp eyes,
slim build, modern dark clothes (charcoal long coat, black turtleneck), confident posture."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rigkit import P, S, G, INK, eye, brow, mouth, mirror_x, EXPRESSIONS

C = dict(id='adrian', iris='#6d7f96', iris_r=9.2, eye_w=21, eye_h=10.5, eye_tilt=5, lash=4.6, brow_w=24, brow_th=3.4, brow_arch=3,
         lip='#b47369', mouth_w=12)
SKIN, SKIN_SH, SKIN_HI = '#ead3c4', '#c9a595', '#f7e6da'
HAIR, HAIR_SH, HAIR_HI = '#1b1d24', '#0d0e12', '#4a5368'
COAT, COAT_SH, COAT_HI = '#262a33', '#15171d', '#3d4352'
TURT, TURT_SH = '#121318', '#07080a'
PANTS, PANTS_SH = '#1b1d22', '#0e0f12'
SHOE = '#0f0f12'

# ------------------------------------------------------------------ hands (drawn for the image-left arm, wrist at 0,0, hanging down)
def hand_shapes(side):
    sx = 1 if side == 'L' else -1          # inner (towards body centre) is +x for the left arm
    def m(d):                                # mirror local path for the right hand
        if sx == 1: return d
        return mirror_x(d, 0)
    relaxed = (P(m('M-15,-4 C-20,20 -20,44 -16,62 C-15,74 -12,86 -8,91 C-5,95 -1,94 -1,89 L0,80 C2,89 5,95 9,94 C12,92 12,87 11,81 L10,73 C13,80 16,84 19,82 C21,80 20,75 18,69 C19,55 18,30 16,-4Z'), SKIN, INK, 1.8)
               + P(m('M14,16 C24,24 28,38 25,52 C23,58 17,58 17,51 C17,43 15,35 12,28'), SKIN, INK, 1.8)
               + S(m('M-15,-4 C-20,20 -20,44 -16,62 L-8,60 C-11,40 -10,20 -8,-4Z'), SKIN_SH, .8)
               + P(m('M-1,80 L-2,62 M10,73 L9,60'), 'none', INK, 1.1, 'opacity=".6"'))
    fist = (P(m('M-16,-4 C-21,14 -21,32 -18,46 C-16,58 -8,64 4,63 C14,62 20,55 20,44 C21,30 19,12 16,-4Z'), SKIN, INK, 1.8)
            + P(m('M-16,36 C-8,40 6,40 19,35 M-15,48 C-6,52 6,52 17,47'), 'none', INK, 1.1, 'opacity=".6"')
            + P(m('M13,14 C22,20 24,30 20,38 C17,41 12,39 12,34'), SKIN, INK, 1.8))
    point = (relaxed.replace('C-5,95 -1,94 -1,89', 'C-5,95 -1,94 -1,89') +
             P(m('M10,40 C12,70 12,100 10,128 C9,134 3,134 3,128 C3,100 2,72 0,46'), SKIN, INK, 1.8))
    # paper coffee cup held upright: the pose keeps the wrist so the cup stays vertical
    cup = (P(m('M-26,10 L26,10 L21,92 L-21,92Z'), '#d9cfc0', INK, 2.0)
           + P(m('M-28,6 L28,6 L28,16 L-28,16Z'), '#2c2a2a', INK, 2.0)
           + P(m('M-24,40 L24,40 L22,66 L-22,66Z'), '#7a3a32', INK, 1.4)
           + S(m('M10,16 L26,16 L21,92 L8,92Z'), '#000', .18)
           + P(m('M-20,20 C-30,30 -30,58 -18,70 C-8,74 6,74 14,68 C20,60 22,36 16,22 C8,14 -10,14 -20,20Z'), SKIN, INK, 1.8)
           + P(m('M-18,36 C-6,40 8,40 16,36 M-18,50 C-6,54 8,54 17,49'), 'none', INK, 1.1, 'opacity=".6"'))
    pocket = ''
    body = ''.join(f'<g data-state="{k}"{"" if k == "relaxed" else " style=\"display:none\""}>{v}</g>'
                   for k, v in (('relaxed', relaxed), ('fist', fist), ('point', point), ('cup', cup), ('pocket', pocket)))
    return body


# ------------------------------------------------------------------ arms (coat sleeves), image-left side then mirrored
SH_L, EL_L, WR_L = (262, 344), (246, 628), (250, 872)

def arm(side):
    mr = (lambda d: d) if side == 'L' else mirror_x
    sh = SH_L if side == 'L' else (700 - SH_L[0], SH_L[1])
    el = EL_L if side == 'L' else (700 - EL_L[0], EL_L[1])
    wr = WR_L if side == 'L' else (700 - WR_L[0], WR_L[1])
    upper = (P(mr('M232,352 C226,420 222,520 222,600 C222,640 238,662 262,658 C276,654 280,630 280,600 C282,520 290,420 296,360 C290,326 248,318 232,352Z'), COAT, INK, 2.2)
             + S(mr('M232,352 C226,420 222,520 222,600 C222,630 230,648 244,654 C240,560 244,440 252,340Z'), COAT_SH, .9)
             + P(mr('M258,470 C262,520 260,560 256,600'), 'none', INK, 1.2, 'opacity=".55"'))
    fore = (P(mr('M224,610 C220,700 222,790 226,860 L232,890 L272,890 L276,858 C282,790 284,700 278,618 C266,640 236,640 224,610Z'), COAT, INK, 2.2)
            + S(mr('M224,610 C220,700 222,790 226,860 L232,890 L246,890 C242,800 238,700 240,628Z'), COAT_SH, .9)
            + P(mr('M228,872 L276,872'), 'none', COAT_HI, 1.5)
            + P(mr('M232,880 C242,892 262,892 272,880 L272,896 C262,904 242,904 232,896Z'), TURT, INK, 1.6))
    hand = G(f'hand-{side}', hand_shapes(side), pivot=wr, extra=f'transform="translate(0 0)"')
    hand = f'<g transform="translate({wr[0]} {wr[1]})"><g id="hand-{side}" data-pivot="0 0">{hand_shapes(side)}</g></g>'
    forearm = G(f'forearm-{side}', fore + hand, pivot=el)
    return G(f'arm-{side}', upper + forearm, pivot=sh)


# ------------------------------------------------------------------ head
def head():
    b = ''
    # back hair (behind the skull)
    back = ('M268,232 C252,170 254,104 296,70 C330,44 392,44 424,74 C452,100 456,170 440,236 L428,214 L424,246 L410,226 '
            'C398,150 302,150 290,226 L278,250 L276,222Z')
    b += G('hair-back', P(back, HAIR, INK, 2.2) + S('M276,222 L278,250 L290,226 C296,190 310,170 330,160 C300,160 280,190 276,222Z', HAIR_SH, .9),
           extra='data-sway="0.6" data-sway-pivot="350 120"')
    # ears
    for sd in ('L', 'R'):
        mr = (lambda d: d) if sd == 'L' else mirror_x
        b += f'<g data-turn="-6">' + P(mr('M288,176 C272,166 266,192 272,208 C276,220 286,222 292,214'), SKIN, INK, 1.9) \
             + P(mr('M282,184 C278,192 280,202 285,207'), 'none', INK, 1.1, 'opacity=".6"') + '</g>'
    # face
    face = 'M286,140 C284,196 290,224 306,246 C318,262 334,274 350,278 C366,274 382,262 394,246 C410,224 416,196 414,140 C400,96 300,96 286,140Z'
    b += P(face, SKIN, INK, 2.3)
    # cel shadow: light from upper left -> right side of face, under the jaw, under the bangs
    b += S('M414,140 C416,196 410,224 394,246 C382,262 366,274 350,278 C362,262 380,236 392,200 C400,176 404,156 404,140Z', SKIN_SH, .75)
    b += S('M290,150 C320,170 380,172 412,150 L412,132 C380,120 320,120 290,132Z', SKIN_SH, .55)
    b += f'<g data-fx="blush" style="display:none">' + ''.join(P(f'M{x},{216} l-6,8', 'none', '#d0707a', 1.6) for x in (310, 318, 326, 378, 386, 394)) + '</g>'
    b += f'<g data-fx="shade" style="display:none">' + ''.join(P(f'M{300 + k * 9},{150} l0,24', 'none', '#4a5a9a', 1.4, 'opacity=".55"') for k in range(12)) + '</g>'
    # eyes, brows
    b += eye('L', 320, 184, C) + eye('R', 380, 184, C)
    b += brow('L', 320, 160, C) + brow('R', 380, 160, C)
    # nose (line + shadow), mouth
    b += '<g data-turn="18">' + P('M352,196 C350,206 347,214 344,220 C346,223 351,224 355,221', 'none', INK, 1.7) + S('M352,196 C356,206 360,214 356,222 C352,224 350,222 352,218Z', SKIN_SH, .6) + '</g>'
    b += mouth(350, 243, C)
    b += P('M326,262 Q350,270 374,262', 'none', SKIN_SH, 1.2, 'opacity=".6"')
    b += f'<g data-fx="sweat" style="display:none">' + P('M418,150 C410,166 412,178 420,178 C428,178 428,166 418,150Z', '#cfe6ff', INK, 1.4) + '</g>'
    b += f'<g data-fx="anger" style="display:none">' + P('M404,110 l10,-4 l-2,10 M416,118 l10,4 l-10,4', 'none', '#b2242c', 3) + '</g>'
    # front hair (messy bangs: one long lock between the eyes)
    front = ('M266,206 C258,150 272,96 318,72 C350,58 396,62 422,88 C446,112 450,160 438,206 L428,176 L420,194 L412,150 '
             'L398,178 L388,136 L376,170 L364,196 L358,150 L346,172 L336,134 L322,168 L310,138 L298,178 L290,150 L280,190Z')
    hb = P(front, HAIR, INK, 2.3)
    hb += S('M412,150 L420,194 L428,176 L438,206 C446,170 446,130 430,104 C424,130 418,140 412,150Z', HAIR_SH, .9)
    hb += S('M298,178 L310,138 L322,168 L336,134 L346,172 L358,150 L364,196 L376,170 L388,136 L398,178 L412,150 C400,128 300,124 290,150Z', HAIR_SH, .55)
    for d in ('M300,96 C322,82 352,78 384,84', 'M290,120 C300,106 314,98 330,94', 'M392,92 C408,100 420,112 426,126'):
        hb += P(d, 'none', HAIR_HI, 3.2, 'opacity=".75"')
    for d in ('M330,96 L322,150', 'M360,92 L356,140', 'M392,104 L398,150', 'M306,112 L298,160'):
        hb += P(d, 'none', INK, 1.1, 'opacity=".6"')
    b += f'<g data-turn="8">{G("hair-front", hb, extra="data-sway=\"0.4\" data-sway-pivot=\"350 80\"")}</g>'
    return G('head', b, pivot=(350, 300))


# ------------------------------------------------------------------ body
def torso_and_legs():
    legs = ''
    for sd in ('L', 'R'):
        mr = (lambda d: d) if sd == 'L' else mirror_x
        legs += P(mr('M286,880 C282,1040 288,1200 292,1340 C294,1480 296,1620 300,1726 L338,1726 C340,1600 342,1460 344,1340 C346,1200 348,1040 350,900Z'), PANTS, INK, 2.2)
        legs += S(mr('M286,880 C282,1040 288,1200 292,1340 C294,1480 296,1620 300,1726 L312,1726 C306,1580 302,1440 302,1330 C300,1180 298,1040 300,890Z'), PANTS_SH, .9)
        legs += P(mr('M300,1330 Q318,1342 336,1332'), 'none', INK, 1.1, 'opacity=".5"')
        legs += P(mr('M296,1724 L340,1724 L344,1748 C346,1764 340,1772 326,1772 L268,1772 C256,1772 254,1760 262,1752 C272,1744 286,1740 296,1724Z'), SHOE, INK, 2.2)
        legs += P(mr('M266,1764 L340,1764'), 'none', '#3a3a44', 1.4)
    t = ''
    # neck
    t += P('M330,262 C332,282 330,300 326,316 L374,316 C370,300 368,282 370,262Z', SKIN, INK, 2.0) + S('M330,262 C346,282 366,284 370,268 L370,296 C356,300 340,296 330,288Z', SKIN_SH, .8)
    # turtleneck body + collar
    t += P('M296,330 C304,316 324,306 350,306 C376,306 396,316 404,330 L404,900 L296,900Z', TURT, INK, 2.2)
    t += P('M322,300 C322,286 378,286 378,300 L382,326 C364,336 336,336 318,326Z', TURT, INK, 2.2)
    for k in range(4): t += P(f'M{322 + k * .8},{306 + k * 6} Q350,{312 + k * 6} {378 - k * .8},{306 + k * 6}', 'none', '#2a2c34', 1.2)
    t += P('M300,880 L400,880 L402,906 L298,906Z', '#1a1a1e', INK, 1.8) + P('M342,882 L358,882 L358,904 L342,904Z', '#8a8f9a', INK, 1.4)   # belt + buckle
    # coat: two open panels with popped collar, hem at the knee
    coatL = 'M262,340 C246,470 246,640 254,820 C258,1000 252,1180 244,1336 L330,1344 C334,1180 338,1000 336,860 C332,700 324,520 316,360 L306,318 C288,322 270,330 262,340Z'
    for sd in ('L', 'R'):
        mr = (lambda d: d) if sd == 'L' else mirror_x
        panel = P(mr(coatL), COAT, INK, 2.3)
        panel += S(mr('M262,340 C246,470 246,640 254,820 C258,1000 252,1180 244,1336 L262,1338 C268,1180 270,1000 268,820 C262,640 264,470 280,334Z'), COAT_SH, .9)
        panel += P(mr('M318,370 C326,520 332,700 334,860'), 'none', COAT_HI, 1.6, 'opacity=".8"')       # lapel edge highlight
        panel += P(mr('M270,760 L322,756 L322,768 L270,772Z'), COAT_SH, INK, 1.4)                         # pocket welt
        panel += P(mr('M288,1000 C290,1120 288,1240 284,1330'), 'none', INK, 1.1, 'opacity=".5"')          # fold
        # popped collar / lapel
        panel += P(mr('M306,318 C292,300 290,280 300,262 L326,286 C322,300 320,318 322,346 L316,370Z'), COAT, INK, 2.2)
        panel += S(mr('M300,262 L326,286 C322,300 320,318 322,346 L312,330 C306,310 302,290 300,262Z'), COAT_HI, .5)
        t += G(f'coat-{sd}', panel, extra=f'data-sway="{0.35 if sd == "L" else -0.35}" data-sway-pivot="{300 if sd == "L" else 400} 700"')
    t += f'<g data-turn="0">{head()}</g>'
    t += arm('L') + arm('R')
    return legs, t


def build():
    legs, torso = torso_and_legs()
    body = G('root', legs + G('torso', torso, pivot=(350, 900)), pivot=(350, 1770))
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 1800" data-rig="adrian-cross">{body}</svg>'
    here = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'adrian-cross')
    open(os.path.join(here, 'rig.svg'), 'w').write(svg)
    exprs = dict(EXPRESSIONS)
    definition = {
        'id': 'adrian-cross', 'name': 'Adrian Cross', 'age': 29, 'rig': 'rig.svg', 'view': 'front', 'height_px': 1770,
        'personality': 'Charming, unpredictable, sarcastic, dangerously intelligent',
        'palette': {'skin': SKIN, 'hair': HAIR, 'coat': COAT, 'turtleneck': TURT, 'eyes': C['iris']},
        'expressions': exprs,
        'poses': {
            'rest': {'arms': {'armL_sh': 0, 'armL_el': 0, 'armL_wr': 0, 'armR_sh': 0, 'armR_el': 0, 'armR_wr': 0}, 'handL': 'relaxed', 'handR': 'relaxed'},
            'confident': {'arms': {'armL_sh': 6, 'armL_el': -4, 'armL_wr': 0, 'armR_sh': -5, 'armR_el': 10, 'armR_wr': 0}, 'handL': 'pocket', 'handR': 'relaxed', 'lean': -1.5},
            'coffee': {'arms': {'armL_sh': 8, 'armL_el': 0, 'armL_wr': 0, 'armR_sh': -22, 'armR_el': 118, 'armR_wr': -96}, 'handL': 'relaxed', 'handR': 'cup'},
            'coffee-sip': {'arms': {'armL_sh': 8, 'armL_el': 0, 'armL_wr': 0, 'armR_sh': -10, 'armR_el': 140, 'armR_wr': -128}, 'handL': 'relaxed', 'handR': 'cup'},
            'point': {'arms': {'armL_sh': 0, 'armL_el': 0, 'armL_wr': 0, 'armR_sh': -78, 'armR_el': -6, 'armR_wr': 0}, 'handL': 'relaxed', 'handR': 'point'},
            'think': {'arms': {'armL_sh': -18, 'armL_el': -112, 'armL_wr': 40, 'armR_sh': 0, 'armR_el': 0, 'armR_wr': 0}, 'handL': 'fist', 'handR': 'relaxed'},
        },
    }
    json.dump(definition, open(os.path.join(here, 'character.json'), 'w'), indent=1)
    print('adrian rig', len(svg), 'bytes')


if __name__ == '__main__':
    build()
