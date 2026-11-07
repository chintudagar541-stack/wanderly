# Builds the trailer soundtrack: Kokoro voice lines + synthesized music & SFX.
import numpy as np, soundfile as sf, sys, pathlib
VO=pathlib.Path(sys.argv[1]); OUT=sys.argv[2]
SR=44100; DUR=60.0; N=int(SR*DUR); rng=np.random.default_rng(3)
t=np.arange(N)/SR
music=np.zeros(N); sfx=np.zeros(N); voice=np.zeros(N)

def place(buf,sig,at):
    i=int(at*SR); j=min(N,i+len(sig)); buf[i:j]+=sig[:j-i]
def lp(x,a):  # one-pole lowpass
    y=np.empty_like(x); acc=0.0; A=np.broadcast_to(np.asarray(a,float),x.shape)
    for k in range(len(x)): acc+=A[k]*(x[k]-acc); y[k]=acc
    return y
def note(f): return 440*2**((f-69)/12)

# --- pad: chord per 4s, additive saw-ish with slow swell
chords={'Am':[45,57,60,64],'F':[41,57,60,65],'C':[48,55,60,64],'G':[43,55,59,62],'Em':[40,55,59,64],'Dm':[38,57,62,65]}
prog=['Am','F','C','G','Am','F','Em','Am','Dm','F','Am','G','Am','Am','F']
for i,c in enumerate(prog):
    a=i*4.0; L=int(4.6*SR); tt=np.arange(L)/SR
    envp=np.minimum(1,tt/1.2)*np.minimum(1,(4.6-tt)/1.0)
    s=np.zeros(L)
    for m in chords[c]:
        f=note(m)
        for d in (-0.15,0.15):
            for k in range(1,6): s+=np.sin(2*np.pi*f*(1+d/100)*k*tt+k)/(k*1.6)
    place(music,s*envp*0.018,a)
music=lp(music,0.08)

# --- taiko-style drum
def drum(gain=1.0,f0=110,f1=45,dec=0.45):
    L=int(0.9*SR); tt=np.arange(L)/SR
    f=f1+(f0-f1)*np.exp(-tt*18); ph=2*np.pi*np.cumsum(f)/SR
    body=np.sin(ph)*np.exp(-tt/dec*2.2)
    click=rng.standard_normal(L)*np.exp(-tt*90)*0.3
    return (body+click)*gain
beats=[]
beats+= [12.25+2*i for i in range(3)]                      # soft heartbeat establishing
beats+= [18.05+1.0*i for i in range(23)]                   # characters: steady pulse
beats+= [41.25+0.5*i for i in range(10)]                   # villain: doubles
beats+= [46.25+0.25*i for i in range(14)]                  # raid: rolling
for b in beats:
    g=0.35 if b<18 else 0.5 if b<41.2 else 0.75 if b<46.2 else 0.9
    place(sfx,drum(g),b)
for b in (49.7,50.2): place(sfx,drum(1.6,90,32,0.9),b)     # title hits
# --- whooshes at scene changes
def whoosh(L=0.7,g=0.25):
    n=int(L*SR); tt=np.arange(n)/SR; x=rng.standard_normal(n)
    e=np.sin(np.pi*tt/L)**2; return lp(x,0.05+0.25*tt/L)*e*g*3
for a in (12.25,18.05,23.55,29.55,35.25,41.25,54.1): place(sfx,whoosh(),a-0.35)
# --- thunder
def thunder(g=0.9):
    n=int(2.5*SR); tt=np.arange(n)/SR; x=rng.standard_normal(n)
    crack=x*np.exp(-tt*25)*0.8; rumble=lp(x,0.01)*np.exp(-tt*1.4)*6
    return (crack+rumble)*g
for b in (42.3,46.55,47.75,48.95): place(sfx,thunder(),b)
# --- forge anvil clinks in Halvard scene
def clink(g=0.18):
    n=int(0.8*SR); tt=np.arange(n)/SR
    return sum(np.sin(2*np.pi*f*tt)*np.exp(-tt*a) for f,a in ((1840,6),(2720,9),(4410,14)))*g
for b in (30.4,31.4,32.4,33.4,34.4): place(sfx,clink(),b)
# --- bright plucks for intro & outro (major-ish, hopeful)
def pluck(f,g=0.12):
    n=int(1.4*SR); tt=np.arange(n)/SR
    return (np.sin(2*np.pi*f*tt)+0.4*np.sin(4*np.pi*f*tt))*np.exp(-tt*3.2)*g
arp=[69,72,76,79,76,72]
for i in range(22): place(music,pluck(note(arp[i%6]+12)),0.4+i*0.5)
for i in range(11): place(music,pluck(note([72,76,79,84][i%4]+0)),54.4+i*0.5)
# --- riser into title
n=int(3.4*SR); tt=np.arange(n)/SR
riser=np.sin(2*np.pi*np.cumsum(200+600*(tt/3.4)**2)/SR)*(tt/3.4)**2*0.08
place(sfx,riser,46.3)

# --- voice
import json
starts={'c1':0.6,'c2':5.6,'n1':12.7,'n2':18.4,'n3':23.8,'n4':29.8,'n5':35.4,'n6':41.5,'n7':46.4,'n8':50.2,'c3':54.6}
for k,a in starts.items():
    x,sr=sf.read(VO/f'{k}.wav')
    x=np.interp(np.arange(int(len(x)*SR/sr))*sr/SR,np.arange(len(x)),x)
    x=x/ (np.max(np.abs(x))+1e-9)*0.9
    place(voice,x,a)
# ducking envelope
act=np.abs(voice)>0.02
win=int(0.25*SR); act=np.convolve(act.astype(float),np.ones(win)/win,'same')>0.01
duck=lp(np.where(act,0.38,1.0),0.0004)
mix=voice*1.0+music*duck*1.4+sfx*duck*0.9
mix[:int(.4*SR)]*=np.linspace(0,1,int(.4*SR)); mix[-int(1.2*SR):]*=np.linspace(1,0,int(1.2*SR))
mix=mix/np.max(np.abs(mix))*0.95
st=np.stack([mix,mix],1)
sf.write(OUT,st.astype(np.float32),SR)
print('ok',OUT)
