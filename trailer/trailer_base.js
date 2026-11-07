const $=id=>document.getElementById(id);
const NS="http://www.w3.org/2000/svg";
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const eo=t=>1-Math.pow(1-clamp(t),3);           // easeOutCubic
const eio=t=>{t=clamp(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2};
const back=t=>{t=clamp(t);const c=1.70158,c3=c+1;return 1+c3*Math.pow(t-1,3)+c*Math.pow(t-1,2)};
// window in/out envelope
const env=(t,a,b,fi=.5,fo=.5)=>clamp((t-a)/fi)*clamp((b-t)/fo);
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);parent&&parent.appendChild(e);return e}

// ---------- palettes ----------
const P={
 day:{skyT:'#4f86d1',skyB:'#d3e6f7',sun:'#fff3cf',sx:1550,sy:170,sr:300,far:'#9db2c9',snow:'#f4f8fc',near:'#6e8f73',water:'#93b9d6',ground:'#9aa95a',ground2:'#b9a768',hw:'#5b3f2a',hr:'#c9a25a',win:'#2a1c16',tree:'#2f5a45',cloud:'#ffffff',co:.9,fence:'#5b3f2a',glow:'#ffffff',go:0,fx:'snow'},
 dusk:{skyT:'#262a55',skyB:'#f2a678',sun:'#ffd29a',sx:1250,sy:610,sr:420,far:'#5d5a7d',snow:'#e3cfdc',near:'#3f4560',water:'#c88a7a',ground:'#4d5a46',ground2:'#6a6248',hw:'#2e2228',hr:'#6e5a44',win:'#ffc46b',tree:'#1f2a33',cloud:'#f6c4b0',co:.55,fence:'#2e2228',glow:'#ff9a5a',go:.25,fx:'snow'},
 forge:{skyT:'#100b18',skyB:'#4a2418',sun:'#f3e6ff',sx:420,sy:170,sr:160,far:'#2b2333',snow:'#6e6476',near:'#221b26',water:'#3a2a35',ground:'#2e241c',ground2:'#3d2e20',hw:'#1e1512',hr:'#4a3624',win:'#ffb347',tree:'#141218',cloud:'#6e5a6e',co:.3,fence:'#1e1512',glow:'#ff7a2a',go:.85,fx:'embers'},
 golden:{skyT:'#6fa8dc',skyB:'#ffd59a',sun:'#fff1c4',sx:480,sy:300,sr:380,far:'#a6a7c2',snow:'#ffffff',near:'#8a9a6a',water:'#bcd0d8',ground:'#b7b45e',ground2:'#d4b56a',hw:'#6b4a2e',hr:'#d9b56a',win:'#2a1c16',tree:'#3d6a46',cloud:'#fff4e0',co:.85,fence:'#6b4a2e',glow:'#ffd27a',go:.2,fx:'leaves'},
 storm:{skyT:'#0d080c',skyB:'#5e1717',sun:'#ff7a3a',sx:960,sy:760,sr:500,far:'#2a1a20',snow:'#4a3a40',near:'#1e1418',water:'#3a1c1c',ground:'#241c1c',ground2:'#2e2020',hw:'#120c0c',hr:'#3a1a14',win:'#ff6a2a',tree:'#0e0a0c',cloud:'#2a1a1e',co:.95,fence:'#120c0c',glow:'#ff3a1a',go:.7,fx:'embers'}
};
function applyPal(p){
 $('skyT').setAttribute('stop-color',p.skyT);$('skyB').setAttribute('stop-color',p.skyB);
 ['sunC','sunC2','sunC3'].forEach(i=>$(i).setAttribute('stop-color',p.sun));
 const s=$('sun');s.setAttribute('cx',p.sx);s.setAttribute('cy',p.sy);s.setAttribute('r',p.sr);
 $('far').setAttribute('fill',p.far);$('snow').setAttribute('fill',p.snow);$('near').setAttribute('fill',p.near);
 $('water').setAttribute('fill',p.water);$('ground').setAttribute('fill',p.ground);$('ground2').setAttribute('fill',p.ground2);
 document.querySelectorAll('.hw').forEach(e=>e.setAttribute('fill',p.hw));document.querySelectorAll('.hr').forEach(e=>e.setAttribute('fill',p.hr));
 document.querySelectorAll('.win').forEach(e=>e.setAttribute('fill',p.win));
 $('trees').setAttribute('fill',p.tree);$('fg').setAttribute('fill',p.fgc||'#0c100c');$('streak').setAttribute('fill',p.sun);$('rays').setAttribute('fill','url(#rayG)');$('clouds').setAttribute('fill',p.cloud);$('clouds').setAttribute('opacity',p.co);
 $('fence').setAttribute('stroke',p.fence);$('posts').setAttribute('fill',p.fence);
 $('glowC').setAttribute('stop-color',p.glow);$('glowC2').setAttribute('stop-color',p.glow);$('glow').setAttribute('opacity',p.go);
 $('ships').setAttribute('fill',p===P.storm?'#0a0608':'none');
}

// ---------- static scenery ----------
for(let i=0;i<34;i++){const x=-250+i*72+rnd()*40,y=690+rnd()*40,s=.6+rnd()*.7;el('use',{href:'#pine',transform:`translate(${x},${y}) scale(${s})`},$('trees'))}
for(let i=0;i<15;i++){el('rect',{x:560+i*48,y:768-i*0.7,width:8,height:46},$('posts'))}
const clouds=[];for(let i=0;i<9;i++){const g=el('g',{},$('clouds'));const w=120+rnd()*180;
 el('ellipse',{cx:0,cy:0,rx:w,ry:w*.22},g);el('ellipse',{cx:-w*.3,cy:-w*.12,rx:w*.45,ry:w*.2},g);el('ellipse',{cx:w*.25,cy:-w*.1,rx:w*.38,ry:w*.18},g);
 clouds.push({g,x:rnd()*2400-300,y:80+rnd()*300,v:8+rnd()*14})}
const shipsData=[[300,742,.7],[700,738,.55],[1650,740,.8],[1250,736,.5]];
shipsData.forEach(([x,y,s])=>el('use',{href:'#ship',transform:`translate(${x},${y}) scale(${s})`},$('ships')));

// particles
const parts=[];for(let i=0;i<140;i++)parts.push({x:rnd()*1920,y:rnd()*1080,r:1.5+rnd()*3.5,v:30+rnd()*70,w:rnd()*6.28,c:el('circle',{r:2},$('fx'))});
function drawFx(kind,t){
 parts.forEach((p,i)=>{let x,y,fill,op,r=p.r;
  if(kind==='snow'){y=(p.y+t*p.v)%1140-30;x=p.x+Math.sin(t*.8+p.w)*30;fill='#fff';op=.75}
  else if(kind==='embers'){y=1100-((p.y+t*p.v*1.6)%1160);x=p.x+Math.sin(t*1.5+p.w)*40;fill=i%3?'#ffb04a':'#ff5a2a';op=.85*clamp((y-150)/400);r=p.r*.8}
  else if(kind==='leaves'){y=(p.y+t*p.v*.6)%1140-30;x=(p.x+t*40+Math.sin(t+p.w)*50)%1960;fill=i%2?'#e9a23b':'#c96b2c';op=i%3===0?.85:0}
  else {op=0;x=0;y=0;fill='#fff'}
  p.c.setAttribute('cx',x.toFixed(1));p.c.setAttribute('cy',y.toFixed(1));p.c.setAttribute('r',r);p.c.setAttribute('fill',fill);p.c.setAttribute('opacity',op)});
}

// actors
const A={};['eirik','sigrun','halvard','tove','ulfrik'].forEach(id=>{const g=el('g',{},$('actors'));el('use',{href:'#'+id},g);A[id]=g});
function actor(id,x,y,s,op=1,t=0,flip=false){const g=A[id];const bob=Math.sin(t*2.2+x)*3;
 g.setAttribute('transform',`translate(${x},${y+bob}) scale(${flip?-s:s},${s*(1+Math.sin(t*2.2+x)*0.004)})`);g.setAttribute('opacity',op);g.style.display=op>0?'':'none'}

// ---------- extra scenery: foreground tufts, god rays, grain ----------
for(let i=0;i<14;i++){const x=-500+i*230+rnd()*80,s=1.1+rnd()*.9;el('use',{href:'#tuft',transform:`translate(${x},${1130+rnd()*40}) scale(${i%2?-s:s},${s})`},$('fg'))}
for(let i=0;i<7;i++){const a=-70+i*22+rnd()*8,w=4+rnd()*5;el('path',{d:`M0,0 L${Math.sin((a-w)*Math.PI/180)*2600},${Math.cos((a-w)*Math.PI/180)*2600} L${Math.sin((a+w)*Math.PI/180)*2600},${Math.cos((a+w)*Math.PI/180)*2600}Z`},$('rays'))}
const gctx=$('grain').getContext('2d');const gimg=gctx.createImageData(960,540);
function grain(f){let s=(f*7919+13)>>>0;const d=gimg.data;for(let i=0;i<d.length;i+=4){s^=s<<13;s^=s>>>17;s^=s<<5;const v=(s>>>0)&255;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}gctx.putImageData(gimg,0,0)}
