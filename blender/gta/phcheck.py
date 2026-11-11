"""CI: load candidate Poly Haven models, print their size/orientation and render a labelled contact sheet (front = seen from -Y)."""
import sys, os, json, math
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import bpy
from mathutils import Vector
import lib
out = sys.argv[sys.argv.index('--') + 1]
IDS = os.environ.get('IDS', '').split(',')
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
res = {}; thumbs = []
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 12; sc.cycles.device = 'CPU'
sc.render.resolution_x = 320; sc.render.resolution_y = 320
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[1].default_value = 1.2
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 3; sun.rotation_euler = (.9, .2, .6); sc.collection.objects.link(sun)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
for aid in IDS:
    try:
        m = lib.model([aid], hide=False)
        if not m: res[aid] = 'missing'; continue
        root, objs = m; bpy.context.view_layer.update()
        pts = [o.matrix_world @ Vector(c) for o in objs if o.type == 'MESH' for c in o.bound_box]
        lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        res[aid] = dict(lo=list(lo), hi=list(hi), size=list(hi - lo), n=len(objs))
        c = (lo + hi) / 2; r = (hi - lo).length * .75 + .05
        cam.location = c + Vector((r * .35, -r * 1.6, r * .5)); cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 35
        sc.render.filepath = f'/tmp/th_{aid}.png'; bpy.ops.render.render(write_still=True); thumbs.append(aid)
        root.location = (0, 0, -1000)
        for o in objs:
            o.hide_render = True
    except Exception as e:
        res[aid] = 'error ' + str(e)
print(json.dumps(res, indent=0))
json.dump(res, open(out.replace('.png', '.json'), 'w'), indent=1)
from PIL import Image, ImageDraw
n = len(thumbs); cols = 6; rows = max(1, (n + cols - 1) // cols)
sheet = Image.new('RGB', (cols * 320, rows * 340), 'white'); d = ImageDraw.Draw(sheet)
for k, aid in enumerate(thumbs):
    im = Image.open(f'/tmp/th_{aid}.png').convert('RGB'); x, y = (k % cols) * 320, (k // cols) * 340
    sheet.paste(im, (x, y)); s = res[aid]['size']; d.text((x + 4, y + 322), f'{aid} {s[0]:.2f}x{s[1]:.2f}x{s[2]:.2f}', fill='black')
sheet.save(out)
