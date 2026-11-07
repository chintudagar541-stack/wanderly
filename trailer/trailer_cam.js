// ---------- timeline ----------
const SC=[
 {id:'intro',a:0,b:12.25,pal:'day'},
 {id:'est',a:12.25,b:18.05,pal:'day'},
 {id:'eirik',a:18.05,b:23.55,pal:'day',side:'R',s:1.25,k:'The Farmhand',n:'Eirik Stonehand',l:'Swore he would never fight again.',tags:['Bare-fisted','Twin braids','Big heart'],acc:'#ffd36e'},
 {id:'sigrun',a:23.55,b:29.55,pal:'dusk',side:'L',s:1.25,k:'The Wanderer',n:'Sigrun Frostveil',l:'Searching for the home she lost.',tags:['Spear-maiden','Calm','Precise'],acc:'#9fd8ff'},
 {id:'halvard',a:29.55,b:35.25,pal:'forge',side:'R',s:1.25,k:'The Smith',n:'Halvard the Grey',l:'Remembers the wars everyone forgot.',tags:['Blacksmith','Veteran','Mentor'],acc:'#ffb15a'},
 {id:'tove',a:35.25,b:41.25,pal:'golden',side:'L',s:1.12,k:'The Scout',n:'Tove',l:'Faster than the wind.',tags:['Archer','Fearless','Youngest'],acc:'#ffb347'},
 {id:'ulfrik',a:41.25,b:46.25,pal:'storm',side:'R',s:1.3,k:'The Jarl',n:'Ulfrik Blackmane',l:'Wants this land, and everyone on it.',tags:['Warlord','Ruthless','Raider king'],acc:'#ff7b7b'},
 {id:'raid',a:46.25,b:49.7,pal:'storm'},
 {id:'title',a:49.7,b:54.1,pal:'storm'},
 {id:'outro',a:54.1,b:60.01,pal:'day'}
];
const CAPS=[[0.6,5.12,"Hey everyone! I've been thinking about making a brand new animated series."],
 [5.6,12.08,"Check out this trailer. If you like it, tell me in the comments, and if you want any changes, let me know too!"],
 [12.7,17.25,"In the cold lands of the north, a quiet farm stands at the edge of the world."],
 [18.4,23.06,"Eirik Stonehand. A farmhand who swore he would never fight again."],
 [23.8,29.26,"Sigrun Frostveil. A wandering spear-maiden, searching for the home she lost."],
 [29.8,34.97,"Halvard the Grey. An old smith who remembers the wars everyone else forgot."],
 [35.4,41.0,"Tove. A young scout. Faster than the wind, and braver than she should be."],
 [41.5,45.91,"And Jarl Ulfrik Blackmane… who wants this land, and everyone on it."],
 [46.4,49.44,"When the raiders come, every promise will be tested."],
 [50.2,53.5,"Warriors of the North. Coming soon."],
 [54.6,59.49,"If you liked it, drop a comment below, and I'll start this series!"]];
const BOLTS=[42.3,46.55,47.9,48.95];

// ---------- camera shots ----------
const SH=[];const shot=(a,b,f,to,ease=eio,o={})=>SH.push({a,b,f,to,ease,...o});
shot(0,12.25,{x:620,y:560,z:1.22},{x:1320,y:520,z:1.3},t=>t,{bg:8,blurAll:1});
shot(12.25,15.6,{x:960,y:160,z:1.45},{x:1060,y:560,z:1.08},eio,{fg:1});
shot(15.6,18.05,{x:1120,y:640,z:1.15},{x:1210,y:735,z:1.95},eio,{bg:1.5});
SC.filter(s=>s.k).forEach(s=>{
 const R=s.side==='R',cx=R?560:1360,faceY=1035-600*s.s,mid=s.a+(s.b-s.a)*0.45;
 const close=(z,fx,fy)=>({x:cx-(fx-960)/z,y:faceY-(fy-540)/z,z});
 s.cx=cx;
 if(s.id==='ulfrik'){
  shot(s.a,s.a+2.3,{x:cx-(600-960)/1.7,y:900,z:1.7},close(1.7,600,470),eio,{bg:3});
  shot(s.a+2.3,s.b,close(1.75,600,470),close(2.45,600,470),t=>t,{bg:6});
 }else{
  shot(s.a,mid,{x:cx+(R?330:-330),y:600,z:1.0},{x:cx+(R?260:-260),y:560,z:1.14},t=>eo(t*1.1)*.4+t*.6,{fg:1});
  shot(mid,s.b,close(2.05,R?600:1320,470),close(2.3,R?620:1300,470),t=>t,{bg:6});
 }
});
shot(46.25,47.4,{x:560,y:690,z:1.3},{x:620,y:680,z:1.42},t=>t,{fg:1,shake:4});
shot(47.4,47.72,{x:620,y:680,z:1.42},{x:1480,y:500,z:1.55},eio,{shake:2});
shot(47.72,49.7,{x:1480,y:500,z:1.55},{x:1500,y:330,z:2.3},t=>t,{bg:4,shake:7});
shot(49.7,54.1,{x:960,y:420,z:1.05},{x:960,y:380,z:1.18},t=>t,{bg:10,blurAll:1});
shot(54.1,57.2,{x:960,y:860,z:1.7},{x:960,y:560,z:1.05},eio,{});
shot(57.2,60.01,{x:960,y:560,z:1.05},{x:960,y:550,z:1.1},t=>t,{});
function camAt(t){const s=SH.find(s=>t>=s.a&&t<s.b)||SH[SH.length-1];const p=s.ease(clamp((t-s.a)/(s.b-s.a)));
 const c={x:lerp(s.f.x,s.to.x,p),y:lerp(s.f.y,s.to.y,p),z:lerp(s.f.z,s.to.z,p),s};
 if(s.shake){c.x+=Math.sin(t*53)*s.shake+Math.sin(t*31)*s.shake*.6;c.y+=Math.cos(t*47)*s.shake*.8}
 else{c.x+=Math.sin(t*1.3)*2.5;c.y+=Math.cos(t*1.1)*2}   // subtle handheld drift
 return c}
function layerT(c,d){const z=1+(c.z-1)*d,x=960+(c.x-960)*d,y=540+(c.y-540)*d;return `translate(960,540) scale(${z}) translate(${-x},${-y})`}

let lastPal=null;
function shineAt(node,p){const s=node.querySelector(':scope > .shine');if(s)s.style.left=(lerp(-40,130,clamp(p)))+'%'}
function show(id,op,extra=''){const e=$(id);e.style.opacity=op;e.style.display=op>0.001?(e.dataset.d||''):'none';if(extra)e.style.transform=extra}
function setBlur(id,v){$(id).setAttribute('stdDeviation',v.toFixed(2))}

window.render=function(t,frame){
 const sc=SC.find(s=>t>=s.a&&t<s.b)||SC[SC.length-1];const lt=t-sc.a,dur=sc.b-sc.a;
 const pal=P[sc.pal];if(pal!==lastPal){applyPal(pal);lastPal=pal}
 const c=camAt(t),sh=c.s;
 // per-layer parallax
 [['skyL',.12],['farL',.35],['nearL',.65],['groundL',1],['actorsL',1],['fxL',1.08],['fgL',1.7]].forEach(([id,d])=>$(id).setAttribute('transform',layerT(c,d)));
 // motion blur from camera velocity (within the shot)
 const t2=Math.min(t+1/30,sh.b-1e-4),t1=Math.max(t2-1/30,sh.a);const c1=camAt(t1),c2=camAt(t2);
 const vx=Math.abs(c2.x-c1.x)*c.z,vy=Math.abs(c2.y-c1.y)*c.z;
 $('bMB').setAttribute('stdDeviation',`${Math.min(45,vx*.45).toFixed(1)} ${Math.min(30,vy*.35).toFixed(1)}`);
 // rack focus
 const bg=sh.bg||0;setBlur('bFar',bg);setBlur('bNear',bg*.75);setBlur('bGround',sh.blurAll?bg:bg*.35);
 $('fgL').style.display=sh.fg?'':'none';
 clouds.forEach(cl=>{const x=((cl.x+t*cl.v)%2600)-300;cl.g.setAttribute('transform',`translate(${x},${cl.y})`)});
 drawFx(pal.fx,t);
 // god rays + anamorphic streak
 const sunny=sc.pal==='day'||sc.pal==='golden'||sc.pal==='dusk';
 $('rays').setAttribute('opacity',sunny?.16:0);$('rays').setAttribute('transform',`translate(${pal.sx},${pal.sy}) rotate(${Math.sin(t*.2)*4})`);
 $('streak').setAttribute('cx',pal.sx);$('streak').setAttribute('cy',pal.sy);$('streak').setAttribute('opacity',sc.pal==='forge'?0:.55);
 // grade
 let blur=0,bright=1;
 if(sc.id==='intro'){bright=.62}
 if(sc.id==='title'){bright=lerp(1,.5,eo(lt/1))}
 if(sc.id==='outro'){const q=eo((t-55.6)/1.2);blur=q*9;bright=lerp(1,.72,q)}
 $('world').style.filter=`blur(${blur}px) brightness(${bright}) contrast(1.08) saturate(1.12)`;
 let li=0;BOLTS.forEach(b=>{const d=t-b;if(d>=0&&d<.35)li=Math.max(li,(d<.06?.9:d<.12?.2:d<.18?.7:0)*(1-d/.35))});
 if(sc.pal!=='storm')li=0;$('lightning').setAttribute('opacity',li);
 // actors
 Object.keys(A).forEach(k=>actor(k,0,0,1,0));
 if(sc.k){const R=sc.side==='R',enter=eo(lt/1.3);actor(sc.id,lerp(R?-200:2120,sc.cx,enter),1035,sc.s,1,t,!R&&sc.id!=='sigrun')}
 if(sc.id==='est'){actor('eirik',lerp(1150,1230,lt/dur),900,.42,clamp((lt-.5)/1),t)}
 if(sc.id==='raid'){
  [['eirik',260],['sigrun',470],['halvard',680],['tove',870]].forEach(([id,x],i)=>actor(id,lerp(x-500,x,eo((lt-i*.1)/.6)),1040,id==='tove'?.86:1.0,1,t));
  actor('ulfrik',lerp(1700,1500,eo(lt/1.2)),1060,1.42,1,t);
 }
 if(sc.id==='outro'){[['eirik',560],['sigrun',760],['halvard',960],['tove',1150],['ulfrik',1350]].forEach(([id,x],i)=>actor(id,x,1075,id==='tove'?.5:.58,1,t))}
 if(sc.id==='title'){[['eirik',560],['sigrun',760],['halvard',960],['tove',1150],['ulfrik',1350]].forEach(([id,x])=>actor(id,x,1075,id==='tove'?.5:.58,.0,t))}
 // intro card
 if(sc.id==='intro'){const e=eo(lt/.9);show('intro',env(t,0,12.25,.6,.45),`translateY(${(1-e)*60}px) scale(${lerp(.94,1,e)})`);shineAt($('intro'),(lt-.4)/1.4);
   const r1=eo((t-6.4)/.7),r2=eo((t-9.0)/.7);$('r1').style.opacity=r1;$('r1').style.transform=`translateX(${(1-r1)*-60}px)`;$('r2').style.opacity=r2;$('r2').style.transform=`translateX(${(1-r2)*-60}px)`;
   shineAt($('r1'),(t-6.6)/1.0);shineAt($('r2'),(t-9.2)/1.0)}else show('intro',0);
 // establishing titles (in the sky during crane-down)
 if(sc.id==='est'){const o=env(t,12.7,15.5,.8,.6);show('est',o,`translateY(${-lt*14}px)`);$('estN').style.letterSpacing=lerp(22,12,eo(lt/3))+'px'}else show('est',0);
 // name card
 if(sc.k){const cd=$('card');cd.classList.toggle('red',sc.id==='ulfrik');cd.classList.toggle('tint',sc.id!=='ulfrik');
   cd.style.left=(sc.side==='R'?1100:80)+'px';
   $('cK').textContent=sc.k;$('cK').style.color=sc.acc;$('cN').textContent=sc.n;$('cL').textContent=sc.l;
   if($('cT').dataset.k!==sc.id){$('cT').innerHTML=sc.tags.map(x=>`<span class="tag">${x}</span>`).join('');$('cT').dataset.k=sc.id}
   const e=eo((lt-.5)/.9);show('card',env(t,sc.a+.5,sc.b,.5,.3),`translateX(${(1-e)*(sc.side==='R'?90:-90)}px) scale(${lerp(.96,1,e)})`);shineAt(cd,(lt-.9)/1.3);
   $('cN').style.letterSpacing=lerp(14,2,eo((lt-.5)/1.4))+'px';
   [...$('cT').children].forEach((tg,i)=>{const q=eo((lt-1.3-i*.15)/.5);tg.style.opacity=q;tg.style.transform=`translateY(${(1-q)*16}px)`});
 }else show('card',0);
 if(sc.id==='title'){const e=eo((lt-.3)/1.4);show('title',env(t,50.0,54.1,.7,.35),`scale(${lerp(1.06,1,e)})`);$('tName').style.letterSpacing=lerp(22,5,e)+'px';shineAt($('title'),(lt-1.0)/1.4);
   const q=eo((lt-1.7)/.6);$('soon').style.opacity=q;$('soon').style.transform=`translateY(${(1-q)*14}px)`}else show('title',0);
 if(sc.id==='outro'){const e=eo((t-55.6)/1.0);show('outro',clamp((t-55.6)/.6),`translateY(${(1-e)*50}px) scale(${lerp(.95,1,e)})`);shineAt($('outro'),(t-56.1)/1.4);
   const pulse=1+Math.max(0,Math.sin((t-56)*5))*.08;$('bub').style.transform=`scale(${pulse})`;
   ['o1','o2','o3','o4'].forEach((id,i)=>{const q=eo((t-56.3-i*.25)/.6);$(id).style.opacity=q;$(id).style.transform=`translateY(${(1-q)*20}px)`});
   shineAt($('o1'),(t-57)/1.0)}else show('outro',0);
 // captions (in the lower letterbox bar)
 const cap=CAPS.find(cc=>t>=cc[0]-.15&&t<cc[1]+.25);
 if(cap){$('capT').textContent=cap[2];show('cap',env(t,cap[0]-.15,cap[1]+.25,.2,.2),`translateX(-50%)`);$('cap').style.fontSize=(cap[2].length>90?30:34)+'px'}else show('cap',0);
 // transitions: fade from black, dip intro->est, white hits on raid/title, light leaks on character cuts
 let fl=0;if(t<.5)fl=1-t/.5;{const d=Math.abs(t-12.25);if(d<.35)fl=Math.max(fl,1-d/.35)}if(t>59.2)fl=clamp((t-59.2)/.8);
 $('flash').style.opacity=fl;
 let wf=0;[46.25,49.7].forEach(b=>{const d=t-b;if(d>=0&&d<.45)wf=Math.max(wf,1-d/.45)});$('wflash').style.opacity=wf*.55;
 let lk=0;SC.filter(s=>s.k).forEach(s=>{const d=t-s.a;if(d>=-.1&&d<.9)lk=Math.max(lk,Math.sin(clamp((d+.1)/1)*Math.PI))});
 $('leak').style.opacity=lk*.55;$('leak').style.background=`radial-gradient(60% 90% at ${sc.side==='L'?'95%':'5%'} 40%,rgba(255,150,60,.85),rgba(255,80,40,.25) 40%,rgba(0,0,0,0) 70%)`;
 grain(frame??Math.round(t*30));
};
document.fonts.ready.then(()=>{window.fontsReady=true});
window.render(0);
