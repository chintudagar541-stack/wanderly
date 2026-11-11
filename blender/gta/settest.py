"""CI: render set views (no actors) with Poly Haven textures/models.  python3 settest.py -- <view> out.png"""
import sys, os, json
H_ = os.path.dirname(os.path.abspath(__file__)); R_ = os.path.dirname(H_)
for d in (H_, os.path.join(R_, 'zombie'), os.path.join(R_, 'west'), R_): sys.path.insert(0, d)
import film as F
from mathutils import Vector
import bpy, house
a = sys.argv[sys.argv.index('--') + 1:]; v = int(a[0]); out = a[1]
VIEWS = [((4.6, 1.9, 1.6), (3.9, 3.6, .7), 22), ((-.6, 1.0, 1.4), (-.6, 3.8, .8), 20), ((1.0, -7.2, 1.6), (.8, 0, 1.9), 22),
         ((-9, -5.0, 2.0), (6, -5.2, 2.0), 24), ((-.6, 3.6, 1.4), (-.6, .2, .9), 20), ((2.4, 2.2, 1.5), (3.0, 1.6, .9), 20),
         ((1.0, -2.6, 1.5), (1.0, -9, 2.2), 22), ((8.0, -4.0, 1.7), (-4, -5.5, 2.2), 24)]
class D: pass
sh = D(); F.setup(sh, 'day', 35, 200, town=False, haze=False); house.build()
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); bpy.context.scene.collection.objects.link(cam); bpy.context.scene.camera = cam
p, tg, lens = VIEWS[v]
cam.location = p; cam.rotation_euler = (Vector(tg) - Vector(p)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = lens
bpy.context.scene.render.filepath = out; bpy.ops.render.render(write_still=True)
print('DONE', v)
