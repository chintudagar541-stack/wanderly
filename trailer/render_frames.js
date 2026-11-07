// usage: node render_frames.js <outdir> <worker> <workers> [fps] [duration]
const {chromium}=require('playwright');const path=require('path');
const [out,wi,wn,fps=30,dur=60]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
await p.goto('file://'+path.join(__dirname,'trailer.html'));await p.waitForFunction(()=>window.fontsReady);
const N=Math.round(fps*dur);for(let f=+wi;f<N;f+=+wn){await p.evaluate(([t,f])=>render(t,f),[f/fps,f]);
 await p.screenshot({path:`${out}/f${String(f).padStart(5,'0')}.jpg`,type:'jpeg',quality:92});}
await b.close()})();
