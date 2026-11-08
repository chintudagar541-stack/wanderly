"""blender -b -P blender/render_film.py -- <film> still <shot> <out.jpg>
   blender -b -P blender/render_film.py -- <film> frames <shot> <from> <to> <outdir>   (local frames, inclusive)"""
import sys, os, time, json, importlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import lib
a = sys.argv[sys.argv.index('--') + 1:]
film, mode, shot = a[0], a[1], a[2]
cfg = json.load(open(os.path.join(lib.ROOT, f'films_{film}.json')))
row = next(r for r in cfg['shots'] if r[0] == shot)
fps = cfg['fps']; g0 = round(row[1] * fps); n = max(1, round(row[2] * fps) - g0)
lib.reset()
samples = int(os.environ.get('SAMPLES', 20))
sc = lib.setup(1440, 2560, samples)
sc.render.fps = fps; sc.frame_start = 1; sc.frame_end = n
sc.render.use_persistent_data = True
sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 2; sc.cycles.glossy_bounces = 1; sc.cycles.transmission_bounces = 2; sc.cycles.adaptive_threshold = .03
sc.cycles.texture_limit_render = '2048'
sc.cycles.volume_step_rate = 4.0; sc.cycles.volume_max_steps = 256
sc.render.use_motion_blur = False
import env, chars, anim
mod = importlib.import_module(f'film_{film}')
t = time.time(); mod.SHOTS[shot](n); lib.log('built', shot, n, 'frames', f'{time.time() - t:.0f}s', len(bpy.data.objects), 'objects')
c = bpy.data.collections.get('Characters')
if c and len(c.objects): lib.ink(c, thickness=float(os.environ.get('INK', 6.5)))
if mode == 'still':
    f = int(a[4]) if len(a) > 4 else max(1, n // 2)
    sc.frame_set(f); lib.render(os.path.abspath(a[3]))
else:
    f0, f1, out = int(a[3]), int(a[4]), os.path.abspath(a[5]); os.makedirs(out, exist_ok=True)
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_depth = '8'
    for f in range(f0, f1 + 1):
        t = time.time(); sc.frame_set(f); sc.render.filepath = os.path.join(out, f'f_{g0 + f:05d}.png')
        bpy.ops.render.render(write_still=True); lib.log('frame', g0 + f, f'{time.time() - t:.1f}s')
