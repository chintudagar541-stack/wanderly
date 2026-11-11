"""Download Poly Haven (CC0) textures and HDRI previews for the 2D background painter.
Assets from Poly Haven: https://polyhaven.com"""
import json, os, urllib.request, sys
UA = {'User-Agent': 'animated-shorts-bg/1.0 (+https://github.com/chintudagar541-stack/wanderly)'}
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120).read()
cfg = json.load(open('assets/ph_list.json')); out = 'assets/ph'; os.makedirs(out, exist_ok=True)
tex = json.loads(get('https://api.polyhaven.com/assets?t=textures'))
hdr = json.loads(get('https://api.polyhaven.com/assets?t=hdris'))
def pick(pool, want):
    for w in want:
        if w in pool: return w
        hits = [k for k in pool if all(p in (k + ' ' + ' '.join(pool[k].get('tags', []))).lower() for p in w.split())]
        if hits: return max(hits, key=lambda k: pool[k].get('download_count', 0))
log = {}
for name, want, res, maps in cfg['textures']:
    aid = pick(tex, want)
    if not aid: log[name] = None; continue
    f = json.loads(get(f'https://api.polyhaven.com/files/{aid}'))
    for m in maps:
        key = {'diff': 'Diffuse', 'nor': 'nor_gl', 'rough': 'Rough', 'disp': 'Displacement', 'ao': 'AO'}[m]
        if key not in f: continue
        r = f[key].get(res) or f[key].get('1k'); url = (r.get('jpg') or r.get('png'))['url']
        open(f'{out}/{name}_{m}.jpg', 'wb').write(get(url))
    log[name] = aid; print(name, aid, flush=True)
for name, want in cfg['skies']:
    aid = pick(hdr, want)
    f = json.loads(get(f'https://api.polyhaven.com/files/{aid}'))
    url = f.get('tonemapped', {}).get('url')
    if url: open(f'{out}/sky_{name}.jpg', 'wb').write(get(url)); log['sky_' + name] = aid; print('sky', name, aid, flush=True)
json.dump(log, open(f'{out}/sources.json', 'w'), indent=1)
