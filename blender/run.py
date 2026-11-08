"""blender -b -P blender/run.py -- <scene> <out.png>"""
import sys, os, time, json, traceback
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import lib
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
name = argv[0]; out = os.path.abspath(argv[1] if len(argv) > 1 else f'out/{name}.png')
lib.reset(); lib.setup()
import env, chars, scenes
t = time.time()
try:
    scenes.SCENES[name]()
except Exception:
    traceback.print_exc(); raise
lib.log('built', name, f'{time.time() - t:.0f}s', 'objects', len(bpy.data.objects))
c = bpy.data.collections.get('Characters')
if c and len(c.objects): lib.ink(c, thickness=float(os.environ.get('INK', 5.5)))
used = sorted(lib.USED)
os.makedirs(os.path.dirname(out), exist_ok=True)
json.dump({'scene': name, 'polyhaven': used, 'world': bpy.context.scene.world.name}, open(out.rsplit('.', 1)[0] + '.json', 'w'), indent=1)
lib.render(out)
