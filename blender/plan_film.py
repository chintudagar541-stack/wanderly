"""Prints the GitHub matrix for a film: stills (one job per shot) or video chunks."""
import json, sys, math
film, mode = sys.argv[1], sys.argv[2]; chunk = int(sys.argv[3]) if len(sys.argv) > 3 else 40
only = sys.argv[4].split(',') if len(sys.argv) > 4 and sys.argv[4] else None
cfg = json.load(open(f'blender/films_{film}.json')); fps = cfg['fps']
jobs = []
for name, t0, t1 in cfg['shots']:
    if only and name not in only: continue
    g0 = round(t0 * fps); n = max(1, round(t1 * fps) - g0)
    if mode == 'stills': jobs.append({'shot': name, 'a': 0, 'b': 0, 'id': name}); continue
    k = math.ceil(n / chunk); size = math.ceil(n / k)
    for i in range(k):
        a = 1 + i * size; b = min(n, a + size - 1)
        jobs.append({'shot': name, 'a': a, 'b': b, 'id': f'{g0 + a:05d}'})
print(json.dumps(jobs))
