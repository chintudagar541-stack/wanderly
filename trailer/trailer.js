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
 $('trees').setAttribute('fill',p.tree);$('clouds').setAttribute('fill',p.cloud);$('clouds').setAttribute('opacity',p.co);
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

// ---------- timeline ----------
const SC=[
 {id:'intro',a:0,b:12.25,pal:'day'},
 {id:'est',a:12.25,b:18.05,pal:'day'},
 {id:'eirik',a:18.05,b:23.55,pal:'day',side:'R',k:'The Farmhand',n:'Eirik Stonehand',l:'Swore he would never fight again.',tags:['Bare-fisted','Twin braids','Big heart'],acc:'#ffd36e'},
 {id:'sigrun',a:23.55,b:29.55,pal:'dusk',side:'L',k:'The Wanderer',n:'Sigrun Frostveil',l:'Searching for the home she lost.',tags:['Spear-maiden','Calm','Precise'],acc:'#9fd8ff'},
 {id:'halvard',a:29.55,b:35.25,pal:'forge',side:'R',k:'The Smith',n:'Halvard the Grey',l:'Remembers the wars everyone forgot.',tags:['Blacksmith','Veteran','Mentor'],acc:'#ffb15a'},
 {id:'tove',a:35.25,b:41.25,pal:'golden',side:'L',k:'The Scout',n:'Tove',l:'Faster than the wind.',tags:['Archer','Fearless','Youngest'],acc:'#ffb347'},
 {id:'ulfrik',a:41.25,b:46.25,pal:'storm',side:'R',k:'The Jarl',n:'Ulfrik Blackmane',l:'Wants this land — and everyone on it.',tags:['Warlord','Ruthless','Raider king'],acc:'#ff6b6b'},
 {id:'raid',a:46.25,b:49.7,pal:'storm'},
 {id:'title',a:49.7,b:54.1,pal:'storm'},
 {id:'outro',a:54.1,b:60.01,pal:'day'}
];
const CAPS=[[0.6,5.12,"Hey everyone! I've been thinking about making a brand new animated series."],
 [5.6,12.08,"Check out this trailer. If you like it, tell me in the comments — and if you want any changes, let me know too!"],
 [12.7,17.25,"In the cold lands of the north, a quiet farm stands at the edge of the world."],
 [18.4,23.06,"Eirik Stonehand. A farmhand who swore he would never fight again."],
 [23.8,29.26,"Sigrun Frostveil. A wandering spear-maiden, searching for the home she lost."],
 [29.8,34.97,"Halvard the Grey. An old smith who remembers the wars everyone else forgot."],
 [35.4,41.0,"Tove. A young scout. Faster than the wind, and braver than she should be."],
 [41.5,45.91,"And Jarl Ulfrik Blackmane… who wants this land, and everyone on it."],
 [46.4,49.44,"When the raiders come, every promise will be tested."],
 [54.6,59.49,"If you liked it, drop a comment below — and I'll start this series!"]];
const BOLTS=[46.55,47.75,48.95,42.3];
window.SCENES=SC;

let lastPal=null;
function shineAt(node,p){const s=node.querySelector(':scope > .shine');if(s)s.style.left=(lerp(-40,130,clamp(p)))+'%'}
function show(id,op,extra=''){const e=$(id);e.style.opacity=op;e.style.display=op>0.001?(e.dataset.d||''):'none';if(extra)e.style.transform=extra}

window.render=function(t){
 const sc=SC.find(s=>t>=s.a&&t<s.b)||SC[SC.length-1];const lt=t-sc.a,dur=sc.b-sc.a;
 const pal=P[sc.pal];if(pal!==lastPal){applyPal(pal);lastPal=pal}
 // camera
 let zoom=1+0.06*(lt/dur),px=0,py=0;
 if(sc.id==='raid'||(sc.id==='ulfrik'&&Math.abs(t-42.3)<.4)){px=Math.sin(t*61)*6;py=Math.cos(t*47)*5;zoom=1.04+.03*(lt/dur)}
 const pan=(sc.side==='R'?1:-1)*30*(lt/dur);
 $('cam').setAttribute('transform',`translate(${960+px},${540+py}) scale(${zoom}) translate(${-960},${-540})`);
 $('farL').setAttribute('transform',`translate(${pan*.25},0)`);$('nearL').setAttribute('transform',`translate(${pan*.55},0)`);$('groundL').setAttribute('transform',`translate(${pan},0)`);
 clouds.forEach(c=>{const x=((c.x+t*c.v)%2600)-300;c.g.setAttribute('transform',`translate(${x},${c.y})`)});
 drawFx(pal.fx,t);
 // world blur for UI-heavy scenes
 let blur=0,bright=1;
 if(sc.id==='intro'){blur=14;bright=.62}
 if(sc.id==='title'){blur=lerp(0,10,eo(lt/1));bright=lerp(1,.45,eo(lt/1))}
 if(sc.id==='outro'){blur=12;bright=.7}
 $('world').style.filter=`blur(${blur}px) brightness(${bright})`;
 // lightning
 let li=0;BOLTS.forEach(b=>{const d=t-b;if(d>=0&&d<.35)li=Math.max(li,(d<.06?.9:d<.12?.2:d<.18?.7:0)*(1-d/.35))});
 if(sc.pal!=='storm')li=0;$('lightning').setAttribute('opacity',li);
 // actors
 Object.keys(A).forEach(k=>actor(k,0,0,1,0));
 const ch=['eirik','sigrun','halvard','tove','ulfrik'];
 if(ch.includes(sc.id)){
  const enter=eo(lt/0.9),side=sc.side;const baseX=side==='R'?560:1360;const fromX=side==='R'?-260:2180;
  const s=sc.id==='tove'?1.12:sc.id==='ulfrik'?1.3:1.25;
  actor(sc.id,lerp(fromX,baseX,enter),1035,s,1,t,side==='L'&&sc.id!=='sigrun');
 }
 if(sc.id==='est'){actor('eirik',lerp(1180,1240,lt/dur),900,.42,clamp((lt-1.2)/1),t)}
 if(sc.id==='raid'){
  const e=eo(lt/.6);
  [['eirik',260],['sigrun',470],['halvard',680],['tove',870]].forEach(([id,x],i)=>actor(id,lerp(x-500,x,eo((lt-i*.12)/.6)),1040,id==='tove'?.86:1.0,1,t));
  actor('ulfrik',lerp(1900,1500,e),1060,1.42,1,t);
 }
 if(sc.id==='outro'){[['eirik',560],['sigrun',760],['halvard',960],['tove',1150],['ulfrik',1350]].forEach(([id,x],i)=>{const e=back((lt-.3-i*.1)/.6);actor(id,x,1075+(1-e)*300,id==='tove'?.5:.58,clamp((lt-.3-i*.1)/.3),t)})}
 // letterbox
 const lb=['est','eirik','sigrun','halvard','tove','ulfrik','raid'].includes(sc.id)?1:0;
 const lbT=lb?eo((t-12.25)/.8):0;$('barT').style.height=$('barB').style.height=(lb?lerp(0,70,lbT):0)+'px';
 // intro card
 if(sc.id==='intro'){const e=eo(lt/.9);show('intro',env(t,0,12.25,.6,.45),`translateY(${(1-e)*60}px) scale(${lerp(.94,1,e)})`);shineAt($('intro'),(lt-.4)/1.4);
   const r1=eo((t-6.4)/.7),r2=eo((t-9.0)/.7);$('r1').style.opacity=r1;$('r1').style.transform=`translateX(${(1-r1)*-60}px)`;$('r2').style.opacity=r2;$('r2').style.transform=`translateX(${(1-r2)*-60}px)`;
   shineAt($('r1'),(t-6.6)/1.0);shineAt($('r2'),(t-9.2)/1.0);
 }else show('intro',0);
 // est chip
 if(sc.id==='est'){const e=eo((lt-.5)/.8);show('est',env(t,12.75,18.05,.6,.4),`translateX(${(1-e)*-80}px)`);shineAt($('est'),(lt-.8)/1.2)}else show('est',0);
 // name card
 if(sc.k){const c=$('card');c.classList.toggle('red',sc.id==='ulfrik');c.classList.toggle('tint',sc.id!=='ulfrik');
   c.style.left=(sc.side==='R'?1070:90)+'px';
   $('cK').textContent=sc.k;$('cK').style.color=sc.acc;$('cN').textContent=sc.n;$('cL').textContent=sc.l;
   if($('cT').dataset.k!==sc.id){$('cT').innerHTML=sc.tags.map(x=>`<span class="tag">${x}</span>`).join('');$('cT').dataset.k=sc.id}
   const e=eo((lt-.35)/.8);show('card',env(t,sc.a+.35,sc.b,.5,.35),`translateX(${(1-e)*(sc.side==='R'?90:-90)}px) scale(${lerp(.96,1,e)})`);shineAt(c,(lt-.7)/1.3);
   [...$('cT').children].forEach((tg,i)=>{const q=eo((lt-1.1-i*.15)/.5);tg.style.opacity=q;tg.style.transform=`translateY(${(1-q)*16}px)`});
 }else show('card',0);
 // title
 if(sc.id==='title'){const e=eo((lt-.3)/1.1);show('title',env(t,50.0,54.1,.6,.35),`scale(${lerp(1.08,1,e)})`);$('tName').style.letterSpacing=lerp(20,4,e)+'px';shineAt($('title'),(lt-.9)/1.4);
   const q=eo((lt-1.6)/.6);$('soon').style.opacity=q;$('soon').style.transform=`translateY(${(1-q)*14}px)`}else show('title',0);
 // outro
 if(sc.id==='outro'){const e=eo((lt-.2)/.9);show('outro',env(t,54.3,61,.6,1),`translateY(${(1-e)*50}px) scale(${lerp(.95,1,e)})`);shineAt($('outro'),(lt-.6)/1.4);
   const pulse=1+Math.max(0,Math.sin((t-55)*5))*.08;$('bub').style.transform=`scale(${pulse})`;
   ['o1','o2','o3','o4'].forEach((id,i)=>{const q=eo((lt-1.0-i*.25)/.6);$(id).style.opacity=q;$(id).style.transform=`translateY(${(1-q)*20}px)`});
   shineAt($('o1'),(lt-1.6)/1.0)}else show('outro',0);
 // captions
 const cap=CAPS.find(c=>t>=c[0]-.15&&t<c[1]+.25);
 if(cap){$('capT').textContent=cap[2];show('cap',env(t,cap[0]-.15,cap[1]+.25,.2,.2),`translateX(-50%) translateY(${sc.id==='outro'?0:0}px)`);
   const capFS=cap[2].length>80?28:32;$('cap').style.fontSize=capFS+'px';
   $('cap').style.bottom=(lb?96:56)+'px'}else show('cap',0);
 // transitions (dip) + white flash on raid/title
 let dip=0;SC.forEach(s=>{if(s.a>0){const d=Math.abs(t-s.a);if(d<.22)dip=Math.max(dip,1-d/.22)}});
 $('flash').style.opacity=dip*.85;
 let wf=0;[46.25,49.7].forEach(b=>{const d=t-b;if(d>=0&&d<.4)wf=Math.max(wf,1-d/.4)});$('wflash').style.opacity=wf*.6;
 // fade in/out of whole video
 if(t<.4)$('flash').style.opacity=1-t/.4;
 if(t>59.3)$('flash').style.opacity=clamp((t-59.3)/.7);
};
window.render(0);
