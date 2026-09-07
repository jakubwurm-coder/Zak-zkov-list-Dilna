const { jsPDF } = window.jspdf;

const el = id => document.getElementById(id);
const form = el('serviceForm');
const photoInput = el('photo');
const preview = el('preview');
const previewWrap = el('previewWrap');
const statusEl = el('status');
let photoDataUrl = null;

function pad(n){ return String(n).padStart(2,'0'); }
function todayISO(){
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
el('date').value = todayISO();

function formatDate(v){
  if(!v) return '—';
  const [y,m,d] = v.split('-');
  return `${d}.${m}.${y}`;
}

photoInput.addEventListener('change', () => {
  const file = photoInput.files?.[0];
  if(!file){ photoDataUrl = null; previewWrap.classList.add('hidden'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    photoDataUrl = reader.result;
    preview.src = photoDataUrl;
    previewWrap.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

el('removePhoto').addEventListener('click', () => {
  photoInput.value = '';
  photoDataUrl = null;
  preview.removeAttribute('src');
  previewWrap.classList.add('hidden');
});

function validate(){
  if(!form.reportValidity()) return false;
  return true;
}

function safeText(v){ return (v || '').trim() || '—'; }

function buildPdfBlob(){
  const doc = new jsPDF({unit:'mm',format:'a4'});
  const pageW = 210, margin = 16, contentW = pageW - margin*2;
  let y = 18;

  doc.setFillColor(17,24,39);
  doc.roundedRect(margin,y,18,18,3,3,'F');
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(12);
  doc.text('VC', margin+9, y+11.5, {align:'center'});

  doc.setTextColor(17,24,39);
  doc.setFontSize(15);
  doc.text('VANS CENTRE', margin+24, y+7);
  doc.setFont('helvetica','normal');
  doc.setTextColor(90,99,112);
  doc.setFontSize(10);
  doc.text('SERVISNI POZADAVEK', margin+24, y+13);
  y += 28;

  doc.setDrawColor(220,224,230);
  doc.line(margin,y,pageW-margin,y);
  y += 8;

  function row(label, value, x, yy, w){
    doc.setFont('helvetica','bold');
    doc.setTextColor(75,85,99);
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), x, yy);
    doc.setFont('helvetica','normal');
    doc.setTextColor(17,24,39);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(value, w);
    doc.text(lines, x, yy+5);
    return lines.length;
  }

  const colGap=10, colW=(contentW-colGap)/2;
  row('Datum',formatDate(el('date').value),margin,y,colW);
  row('Termin dokonceni',formatDate(el('dueDate').value),margin+colW+colGap,y,colW);
  y += 15;
  row('Zadal',safeText(el('author').value),margin,y,colW);
  row('Cislo klice',safeText(el('keyNumber').value),margin+colW+colGap,y,colW);
  y += 15;

  const thirds=(contentW-12)/3;
  row('SPZ',safeText(el('plate').value),margin,y,thirds);
  row('Motor',safeText(el('engine').value),margin+thirds+6,y,thirds);
  row('Vykon',el('kw').value ? `${el('kw').value} kW` : '—',margin+2*(thirds+6),y,thirds);
  y += 20;

  doc.setFillColor(247,248,250);
  const req = safeText(el('request').value);
  const reqLines = doc.splitTextToSize(req, contentW-12);
  const boxH = Math.max(34, 14 + reqLines.length*5);
  doc.roundedRect(margin,y,contentW,boxH,3,3,'F');
  doc.setFont('helvetica','bold');
  doc.setTextColor(75,85,99);
  doc.setFontSize(8);
  doc.text('SERVISNI POZADAVEK',margin+6,y+7);
  doc.setFont('helvetica','normal');
  doc.setTextColor(17,24,39);
  doc.setFontSize(11);
  doc.text(reqLines,margin+6,y+14);
  y += boxH + 8;

  if(photoDataUrl){
    try{
      const props = doc.getImageProperties(photoDataUrl);
      const maxW=contentW, maxH=95;
      let w=maxW, h=w*props.height/props.width;
      if(h>maxH){ h=maxH; w=h*props.width/props.height; }
      if(y+h>280){ doc.addPage(); y=18; }
      doc.addImage(photoDataUrl, props.fileType || 'JPEG', margin, y, w, h);
      y += h+7;
    }catch(e){
      console.warn('Fotografii se nepodařilo vložit do PDF', e);
    }
  }

  if(y>255){ doc.addPage(); y=20; }
  doc.setDrawColor(220,224,230);
  doc.line(margin, y+8, pageW-margin, y+8);
  doc.setTextColor(107,114,128);
  doc.setFontSize(8);
  doc.text('Vytvoreno v aplikaci Servisni pozadavky Vans Centre',margin,y+14);

  return doc.output('blob');
}

function filename(){
  const key = safeText(el('keyNumber').value).replace(/[^\w-]+/g,'_');
  const plate = (el('plate').value || '').trim().replace(/\s+/g,'_').replace(/[^\w-]+/g,'');
  return `servisni_pozadavek_${key}${plate ? '_' + plate : ''}_${el('date').value || todayISO()}.pdf`;
}

el('pdfBtn').addEventListener('click', () => {
  if(!validate()) return;
  try{
    const blob = buildPdfBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    statusEl.textContent='PDF bylo vytvořeno.';
  }catch(e){
    statusEl.textContent='PDF se nepodařilo vytvořit.';
    console.error(e);
  }
});

el('shareBtn').addEventListener('click', async () => {
  if(!validate()) return;
  try{
    const blob = buildPdfBlob();
    const file = new File([blob], filename(), {type:'application/pdf'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({
        title:'Servisní požadavek',
        text:`Servisní požadavek – klíč ${safeText(el('keyNumber').value)}`,
        files:[file]
      });
      statusEl.textContent='Sdílení otevřeno.';
    }else{
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;a.download=filename();a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      statusEl.textContent='Zařízení nepodporuje přímé sdílení souboru. PDF bylo staženo.';
    }
  }catch(e){
    if(e?.name !== 'AbortError'){
      statusEl.textContent='Sdílení se nepodařilo spustit.';
      console.error(e);
    }
  }
});

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
}
