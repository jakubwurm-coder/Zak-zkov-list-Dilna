const { jsPDF } = window.jspdf;
const el=id=>document.getElementById(id),form=el('serviceForm'),photoInput=el('photo'),preview=el('preview'),previewWrap=el('previewWrap'),statusEl=el('status');
let photoDataUrl=null;
const pad=n=>String(n).padStart(2,'0');
function todayISO(){const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
el('date').value=todayISO();
function formatDate(v){if(!v)return '—';const [y,m,d]=v.split('-');return `${d}.${m}.${y}`}
function safeText(v){return (v||'').trim()||'—'}
function loadImage(src){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src})}
photoInput.addEventListener('change',()=>{const f=photoInput.files?.[0];if(!f){photoDataUrl=null;previewWrap.classList.add('hidden');return}const r=new FileReader();r.onload=()=>{photoDataUrl=r.result;preview.src=photoDataUrl;previewWrap.classList.remove('hidden')};r.readAsDataURL(f)});
el('removePhoto').addEventListener('click',()=>{photoInput.value='';photoDataUrl=null;preview.removeAttribute('src');previewWrap.classList.add('hidden')});
function line(ctx,x1,y1,x2,y2,color='#6d737c',w=1){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore()}
function wrapText(ctx,text,x,y,maxWidth,lineHeight,maxLines=8){const words=String(text||'').split(/\s+/),lines=[];let cur='';for(const word of words){const t=cur?cur+' '+word:word;if(ctx.measureText(t).width>maxWidth&&cur){lines.push(cur);cur=word;if(lines.length>=maxLines-1)break}else cur=t}if(cur&&lines.length<maxLines)lines.push(cur);lines.forEach((s,i)=>ctx.fillText(s,x,y+i*lineHeight))}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
async function buildPdfBlob(){
 const W=1240,H=1754,c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');
 const blue='#4a5997',red='#b73337',text='#202226',gray='#555a62';ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
 ctx.fillStyle=blue;ctx.fillRect(0,0,W,25);ctx.fillRect(W-35,25,35,540);ctx.beginPath();ctx.moveTo(W-35,565);ctx.quadraticCurveTo(W-35,645,W-115,665);ctx.lineTo(W,665);ctx.lineTo(W,565);ctx.closePath();ctx.fill();
 ctx.fillStyle=red;ctx.fillRect(0,H-53,W,53);ctx.fillRect(0,H-690,34,637);ctx.beginPath();ctx.moveTo(0,H-690);ctx.quadraticCurveTo(55,H-665,55,H-595);ctx.lineTo(55,H-155);ctx.quadraticCurveTo(55,H-95,135,H-53);ctx.lineTo(0,H-53);ctx.closePath();ctx.fill();
 ctx.fillStyle=text;ctx.font='700 48px Arial';ctx.fillText('Zakázkový list',74,225);
 // logo Vans Centre v pravém horním rohu
 ctx.save();ctx.translate(W-280,83);ctx.rotate(-0.04);ctx.fillStyle='#214f96';ctx.font='italic 700 42px Arial';ctx.fillText('Vans',0,0);ctx.fillStyle='#d52e38';ctx.font='italic 700 27px Arial';ctx.fillText('centre',88,28);ctx.strokeStyle=blue;ctx.lineWidth=4;ctx.beginPath();ctx.arc(83,-22,77,Math.PI,Math.PI*1.92);ctx.stroke();ctx.restore();
 ctx.fillStyle=gray;ctx.font='23px Arial';ctx.fillText('datum zadání:',790,270);ctx.fillStyle=text;ctx.font='700 25px Arial';ctx.fillText(formatDate(el('date').value),1000,270);
 line(ctx,285,395,930,395,'#858991',2);
 ctx.font='22px Arial';ctx.fillStyle=gray;ctx.fillText('označení vozidla (č. klíče):',74,465);ctx.fillStyle=text;ctx.font='700 25px Arial';ctx.fillText(safeText(el('keyNumber').value),410,465);
 ctx.fillStyle=gray;ctx.font='22px Arial';ctx.fillText('SPZ:',620,465);ctx.fillStyle=text;ctx.font='700 25px Arial';ctx.fillText(safeText(el('plate').value),685,465);
 ctx.fillStyle=gray;ctx.font='22px Arial';ctx.fillText('motor:',74,530);ctx.fillStyle=text;ctx.font='700 25px Arial';ctx.fillText(safeText(el('engine').value),155,530);
 ctx.fillStyle=gray;ctx.font='22px Arial';ctx.fillText('výkon:',620,530);ctx.fillStyle=text;ctx.font='700 25px Arial';ctx.fillText(el('kw').value?`${el('kw').value} kW`:'—',705,530);
 ctx.fillStyle=gray;ctx.font='22px Arial';ctx.fillText('zadal:',74,595);ctx.fillStyle=text;ctx.font='700 25px Arial';ctx.fillText(safeText(el('author').value),145,595);
 ctx.fillStyle=gray;ctx.font='22px Arial';ctx.fillText('termín dokončení:',620,595);ctx.fillStyle=text;ctx.font='700 25px Arial';ctx.fillText(formatDate(el('dueDate').value),820,595);
 line(ctx,74,645,W-85,645,'#6f9dce',2);ctx.fillStyle=gray;ctx.font='22px Arial';ctx.fillText('popis zakázky',1000,675);
 ctx.fillStyle=text;ctx.font='30px Arial';wrapText(ctx,safeText(el('request').value),95,735,1040,43,7);
 if(photoDataUrl){try{const p=await loadImage(photoDataUrl),x=740,y=825,bw=380,bh=250,s=Math.min(bw/p.width,bh/p.height),iw=p.width*s,ih=p.height*s;ctx.save();roundRect(ctx,x,y,bw,bh,14);ctx.clip();ctx.fillStyle='#f4f5f7';ctx.fillRect(x,y,bw,bh);ctx.drawImage(p,x+(bw-iw)/2,y+(bh-ih)/2,iw,ih);ctx.restore();ctx.strokeStyle='#d6d8dd';ctx.lineWidth=2;roundRect(ctx,x,y,bw,bh,14);ctx.stroke()}catch(e){console.warn(e)}}
 line(ctx,74,1010,W-85,1010,'#6f9dce',2);ctx.fillStyle=gray;ctx.font='22px Arial';ctx.fillText('rozpis provedených prací, seznam nakoupených dílů',610,1045);
 for(let y=1135;y<=1445;y+=58)line(ctx,92,y,W-100,y,'#e5e7ea',1);
 line(ctx,790,1570,1110,1570,'#7b7f86',2);ctx.fillStyle=gray;ctx.font='20px Arial';ctx.fillText('datum a podpis při dokončení',830,1605);
 const img=c.toDataURL('image/jpeg',0.94),doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});doc.addImage(img,'JPEG',0,0,210,297);return doc.output('blob')
}
function filename(){const k=safeText(el('keyNumber').value).replace(/[^\w-]+/g,'_'),p=(el('plate').value||'').trim().replace(/\s+/g,'_').replace(/[^\w-]+/g,'');return `zakazkovy_list_${k}${p?'_'+p:''}_${el('date').value||todayISO()}.pdf`}
el('pdfBtn').addEventListener('click',async()=>{if(!form.reportValidity())return;try{statusEl.textContent='Vytvářím PDF…';const b=await buildPdfBlob(),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=filename();document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);statusEl.textContent='PDF bylo vytvořeno.'}catch(e){console.error(e);statusEl.textContent='PDF se nepodařilo vytvořit.'}});
el('shareBtn').addEventListener('click',async()=>{if(!form.reportValidity())return;try{statusEl.textContent='Vytvářím PDF…';const b=await buildPdfBlob(),f=new File([b],filename(),{type:'application/pdf'});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({title:'Zakázkový list',text:`Zakázkový list – klíč ${safeText(el('keyNumber').value)}`,files:[f]});statusEl.textContent='Sdílení otevřeno.'}else{const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=filename();a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);statusEl.textContent='PDF bylo staženo.'}}catch(e){if(e?.name!=='AbortError'){console.error(e);statusEl.textContent='Sdílení se nepodařilo spustit.'}}});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));