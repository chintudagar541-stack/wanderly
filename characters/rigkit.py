"""Shared drawing kit for the layered character rigs (front view).

Every character is built from the same anatomy (seinen proportions, ~8 heads tall) with its own
face traits, hair, outfit and palette, so the cast stays consistent and every rig follows the
same part contract used by renderer/engine/character.js.

Coordinates: viewBox 0 0 700 1800, figure centred on x=350, feet on y=1770.
"L" parts are on the left side of the image, "R" parts on the right.
"""

INK = '#15161b'


def P(d, fill='none', stroke=INK, sw=2.2, extra=''):
    st = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"' if stroke else ''
    return f'<path d="{d}" fill="{fill}"{st} {extra}/>'


def S(d, fill, op=1.0, extra=''):
    """shadow / highlight shape without outline"""
    return f'<path d="{d}" fill="{fill}" opacity="{op}" {extra}/>'


def G(part, body, pivot=None, extra=''):
    pv = f' data-pivot="{pivot[0]} {pivot[1]}"' if pivot else ''
    return f'<g id="{part}"{pv} {extra}>{body}</g>'


def mirror_x(d, cx=350):
    """mirror an absolute-coordinate path (M/L/C/Q/S/T/Z with x,y pairs, H/V) around x=cx"""
    import re
    out, cmd, k = [], None, 0
    for tk in re.findall(r'[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?', d):
        if tk.isalpha():
            out.append(tk); cmd = tk; k = 0; continue
        v = float(tk)
        if cmd == 'H': out.append(f'{2 * cx - v:g}'); continue
        if cmd == 'V': out.append(f'{v:g}'); continue
        out.append(f'{2 * cx - v:g}' if k % 2 == 0 else f'{v:g}'); k += 1
    return ' '.join(out)


# ------------------------------------------------------------------ eyes
def eye(side, cx, cy, c):
    """one eye with all states.  side 'L' (image left) or 'R'.  c = traits dict"""
    s = -1 if side == 'L' else 1           # outward direction
    w = c.get('eye_w', 21); h = c.get('eye_h', 11); iris = c.get('iris', '#5b6f86'); ir = c.get('iris_r', 9.5)
    inner = (cx - s * w, cy + 2); outer = (cx + s * w, cy - c.get('eye_tilt', 4))
    lash = c.get('lash', 4.2)
    # eye white shape (almond, slightly heavier at the top for a sharper seinen look)
    white = (f'M{inner[0]},{inner[1]} C{cx - s * w * .45},{cy - h} {cx + s * w * .55},{cy - h * 1.05} {outer[0]},{outer[1]} '
             f'C{cx + s * w * .6},{cy + h * .75} {cx - s * w * .4},{cy + h * .8} {inner[0]},{inner[1]}Z')
    clip_id = f'clip-eye-{side}-{c["id"]}'.replace('.', '_')

    def open_eye(scale_h=1.0, iris_r=ir, upper_drop=0.0, look_up=0.0):
        hh = h * scale_h
        wht = (f'M{inner[0]},{inner[1]} C{cx - s * w * .45},{cy - hh + upper_drop} {cx + s * w * .55},{cy - hh * 1.05 + upper_drop} {outer[0]},{outer[1] + upper_drop * .3} '
               f'C{cx + s * w * .6},{cy + hh * .75} {cx - s * w * .4},{cy + hh * .8} {inner[0]},{inner[1]}Z')
        cid = f'{clip_id}-{scale_h:g}-{upper_drop:g}'.replace('.', '_')
        b = f'<clipPath id="{cid}"><path d="{wht}"/></clipPath>'
        b += P(wht, '#f4f1ec', None)
        b += f'<g clip-path="url(#{cid})"><g class="pupil">'
        b += f'<circle cx="{cx + s * 1}" cy="{cy + 1 - look_up}" r="{iris_r}" fill="{iris}"/>'
        b += f'<circle cx="{cx + s * 1}" cy="{cy + 1 - look_up}" r="{iris_r}" fill="none" stroke="{INK}" stroke-width="1.1" opacity=".7"/>'
        b += f'<circle cx="{cx + s * 1}" cy="{cy + 4 - look_up}" r="{iris_r * .62}" fill="#ffffff" opacity=".13"/>'
        b += f'<circle cx="{cx + s * 1}" cy="{cy + 1 - look_up}" r="{iris_r * .42}" fill="{INK}"/>'
        b += f'<circle cx="{cx + s * 1 - 3.2}" cy="{cy - 3 - look_up}" r="2.4" fill="#fff"/>'
        b += f'<circle cx="{cx + s * 1 + 3}" cy="{cy + 4.5 - look_up}" r="1.1" fill="#fff" opacity=".8"/>'
        b += '</g>'
        b += S(f'M{inner[0] - 2},{cy - 20} L{outer[0] + 2 * s},{cy - 20} L{outer[0] + 2 * s},{outer[1] + 2 + upper_drop * .5} C{cx + s * w * .5},{cy - hh * .6 + upper_drop} {cx - s * w * .4},{cy - hh * .55 + upper_drop} {inner[0] - 2},{inner[1]}Z', '#2b3140', .28)
        b += '</g>'
        # upper lash line: tapered filled stroke with an outer flick
        up = (f'M{inner[0] - s * 1},{inner[1] + 1} C{cx - s * w * .45},{cy - hh - 1 + upper_drop} {cx + s * w * .55},{cy - hh * 1.05 - 1.5 + upper_drop} {outer[0] + s * 3},{outer[1] - 1 + upper_drop * .3} '
              f'L{outer[0] + s * 6},{outer[1] - 3 + upper_drop * .3} L{outer[0] + s * 1},{outer[1] + 2.4 + upper_drop * .3} '
              f'C{cx + s * w * .5},{cy - hh * 1.05 + lash + upper_drop} {cx - s * w * .45},{cy - hh + lash * .8 + upper_drop} {inner[0] + s * 1},{inner[1] + 1.6}Z')
        b += P(up, INK, INK, 1.0)
        b += P(f'M{cx - s * w * .55},{cy + hh * .82} Q{cx},{cy + hh * 1.0} {cx + s * w * .62},{cy + hh * .6}', 'none', INK, 1.2, 'opacity=".75"')
        # crease
        b += P(f'M{cx - s * w * .25},{cy - hh - 5 + upper_drop * .6} Q{cx + s * w * .3},{cy - hh - 8 + upper_drop * .6} {outer[0] - s * 2},{outer[1] - 6}', 'none', INK, 1.1, 'opacity=".55"')
        return b

    states = {
        'open': open_eye(),
        'wide': open_eye(1.28, ir * .82),
        'narrow': open_eye(.72, ir, upper_drop=3.5),
        'half': open_eye(.6, ir, upper_drop=6),
        'closed': P(f'M{inner[0]},{inner[1]} C{cx - s * w * .3},{cy + 5} {cx + s * w * .4},{cy + 5} {outer[0] + s * 3},{outer[1] + 3}', 'none', INK, 3.0)
                  + P(f'M{cx - s * w * .2},{cy - 6} Q{cx + s * w * .3},{cy - 8} {outer[0] - s * 2},{outer[1] - 4}', 'none', INK, 1.1, 'opacity=".5"'),
        'happy': P(f'M{inner[0]},{inner[1] + 3} C{cx - s * w * .3},{cy - 7} {cx + s * w * .4},{cy - 8} {outer[0] + s * 3},{outer[1] + 4}', 'none', INK, 3.0),
        'sad': open_eye(.85, ir, upper_drop=2.5, look_up=-1.5),
    }
    body = ''.join(f'<g data-state="{k}"{"" if k == "open" else " style=\"display:none\""}>{v}</g>' for k, v in states.items())
    return G(f'eye-{side}', body, extra=f'data-turn="{c.get("turn_eye", 14)}"')


def brow(side, cx, cy, c):
    s = -1 if side == 'L' else 1; w = c.get('brow_w', 25); th = c.get('brow_th', 3.6); col = c.get('brow_col', INK)
    a = (cx - s * (w * .55), cy + 3); b = (cx + s * w * .55, cy - c.get('brow_arch', 2)); e = (cx + s * w * 1.05, cy + 2)
    d = (f'M{a[0]},{a[1]} Q{b[0] - s * 8},{b[1] - 3} {e[0]},{e[1]} Q{b[0] - s * 6},{b[1] + th * .6} {a[0] + s * 2},{a[1] + th}Z')
    return f'<g data-turn="{c.get("turn_eye", 14)}"><g id="brow-{side}" data-pivot="{cx} {cy}">{P(d, col, col, 1.0)}</g></g>'


MOUTHS = {
    # name: (path builder) relative to mouth centre (mx, my)
}


def mouth(mx, my, c):
    lip = c.get('lip', '#b9726a'); dark = '#3a1c22'; teeth = '#f3efe8'; tongue = '#c46a6a'; w = c.get('mouth_w', 13)
    st = {}
    st['rest'] = P(f'M{mx - w},{my} Q{mx},{my + 1.5} {mx + w},{my - .5}', 'none', INK, 2.0) + P(f'M{mx - 5},{my + 7} Q{mx},{my + 8.5} {mx + 5},{my + 7}', 'none', '#a26c62', 1.4, 'opacity=".6"')
    st['m'] = P(f'M{mx - w * .9},{my} Q{mx},{my - .5} {mx + w * .9},{my}', 'none', INK, 2.4)
    st['smirk'] = P(f'M{mx - w},{my + 1} Q{mx + 2},{my + 2} {mx + w + 3},{my - 5}', 'none', INK, 2.2) + P(f'M{mx + w + 1},{my - 6} q3,1 3,4', 'none', INK, 1.2)
    st['smile'] = P(f'M{mx - w - 2},{my - 3} Q{mx},{my + 6} {mx + w + 2},{my - 3}', 'none', INK, 2.2)
    st['frown'] = P(f'M{mx - w},{my + 3} Q{mx},{my - 3} {mx + w},{my + 3}', 'none', INK, 2.2)
    st['grit'] = (P(f'M{mx - w - 2},{my - 3} L{mx + w + 2},{my - 4} L{mx + w},{my + 5} L{mx - w},{my + 6}Z', teeth, INK, 2.0)
                  + P(f'M{mx - w},{my + 1} L{mx + w},{my}', 'none', INK, 1.0) + ''.join(P(f'M{mx + k},{my - 3.5} L{mx + k},{my + 5.5}', 'none', INK, .8) for k in (-6, 0, 6)))
    st['a'] = P(f'M{mx - w * .8},{my - 2} Q{mx},{my - 4} {mx + w * .8},{my - 2} Q{mx + w * .5},{my + 11} {mx},{my + 12} Q{mx - w * .5},{my + 11} {mx - w * .8},{my - 2}Z', dark, INK, 2.0) \
        + S(f'M{mx - 5},{my + 8} Q{mx},{my + 4} {mx + 5},{my + 8} Q{mx},{my + 11} {mx - 5},{my + 8}Z', tongue) + S(f'M{mx - w * .7},{my - 2} L{mx + w * .7},{my - 2} L{mx + w * .6},{my + 1} L{mx - w * .6},{my + 1}Z', teeth)
    st['e'] = P(f'M{mx - w},{my - 1} Q{mx},{my - 3} {mx + w},{my - 1} Q{mx + w * .6},{my + 6} {mx},{my + 6.5} Q{mx - w * .6},{my + 6} {mx - w},{my - 1}Z', dark, INK, 2.0) \
        + S(f'M{mx - w * .85},{my - 1} L{mx + w * .85},{my - 1.5} L{mx + w * .7},{my + 1.6} L{mx - w * .7},{my + 1.8}Z', teeth)
    st['o'] = P(f'M{mx - 6},{my} Q{mx - 6},{my - 5} {mx},{my - 5} Q{mx + 6},{my - 5} {mx + 6},{my} Q{mx + 6},{my + 8} {mx},{my + 8} Q{mx - 6},{my + 8} {mx - 6},{my}Z', dark, INK, 2.0)
    st['shock'] = P(f'M{mx - 9},{my} Q{mx - 9},{my - 7} {mx},{my - 7} Q{mx + 9},{my - 7} {mx + 9},{my + 2} Q{mx + 8},{my + 15} {mx},{my + 15} Q{mx - 8},{my + 15} {mx - 9},{my}Z', dark, INK, 2.0) \
        + S(f'M{mx - 5},{my + 11} Q{mx},{my + 7} {mx + 5},{my + 11} Q{mx},{my + 14} {mx - 5},{my + 11}Z', tongue)
    st['sad'] = P(f'M{mx - w * .8},{my + 2} Q{mx},{my - 2.5} {mx + w * .8},{my + 2}', 'none', INK, 2.0)
    body = ''.join(f'<g data-state="{k}"{"" if k == "rest" else " style=\"display:none\""}>{v}</g>' for k, v in st.items())
    return f'<g data-turn="{c.get("turn_mouth", 12)}"><g id="mouth">{body}</g></g>'


EXPRESSIONS = {
    'neutral':    {'eyes': 'open', 'mouth': 'rest', 'brows': {'L': [0, 0, 0], 'R': [0, 0, 0]}},
    'happy':      {'eyes': 'happy', 'mouth': 'smile', 'brows': {'L': [0, -4, -3], 'R': [0, -4, 3]}, 'fx': ['blush']},
    'angry':      {'eyes': 'narrow', 'mouth': 'grit', 'brows': {'L': [2, 6, 14], 'R': [-2, 6, -14]}, 'fx': ['anger']},
    'sad':        {'eyes': 'sad', 'mouth': 'sad', 'brows': {'L': [0, -3, -14], 'R': [0, -3, 14]}, 'look': [0, 2]},
    'suspicious': {'eyes': 'narrow', 'eyeR': 'open', 'mouth': 'frown', 'brows': {'L': [1, 4, 9], 'R': [0, -5, 4]}, 'look': [3, 0]},
    'shocked':    {'eyes': 'wide', 'mouth': 'shock', 'brows': {'L': [0, -9, -6], 'R': [0, -9, 6]}, 'fx': ['sweat', 'shade']},
    'smirk':      {'eyes': 'narrow', 'mouth': 'smirk', 'brows': {'L': [0, 2, 4], 'R': [0, -4, -2]}},
}
