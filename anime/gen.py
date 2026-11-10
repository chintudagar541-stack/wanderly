"""SDXL anime illustration on a CPU runner: python3 gen.py <job.json> <index> <outdir>"""
import json, sys, os, time, torch
from diffusers import StableDiffusionXLPipeline, EulerAncestralDiscreteScheduler
job = json.load(open(sys.argv[1])); i = int(sys.argv[2]); out = sys.argv[3]; os.makedirs(out, exist_ok=True)
it = job['items'][i]
torch.set_num_threads(os.cpu_count())
t0 = time.time()
model = job.get('model', 'cagliostrolab/animagine-xl-4.0')
try:
    pipe = StableDiffusionXLPipeline.from_pretrained(model, torch_dtype=torch.float32, use_safetensors=True, variant=job.get('variant'))
except Exception as e:
    print('variant load failed, retry plain:', e); pipe = StableDiffusionXLPipeline.from_pretrained(model, torch_dtype=torch.float32, use_safetensors=True)
pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(pipe.scheduler.config)
pipe.enable_attention_slicing(); pipe.vae.enable_tiling()
print('loaded', round(time.time() - t0), 's', flush=True)
g = torch.Generator('cpu').manual_seed(it['seed'])
def cb(p, step, ts, kw):
    print('step', step, round(time.time() - t0), 's', flush=True); return kw
img = pipe(prompt=it.get('prompt', job['prompt']), negative_prompt=job['negative'], width=it.get('w', job.get('w', 1024)), height=it.get('h', job.get('h', 1024)),
           num_inference_steps=job.get('steps', 28), guidance_scale=job.get('cfg', 5.0), generator=g, callback_on_step_end=cb).images[0]
name = it.get('name', f'img{i}')
img.save(os.path.join(out, name + '.png')); print('saved', name, round(time.time() - t0), 's')
