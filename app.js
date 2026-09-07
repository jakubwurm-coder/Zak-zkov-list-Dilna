const { jsPDF } = window.jspdf;
const $ = id => document.getElementById(id);
const form = $('serviceForm');
const statusEl = $('status');
const savedList = $('savedList');
const emptySaved = $('emptySaved');
const saveState = $('saveState');
const photoInput = $('photo');
const preview = $('preview');
const previewWrap = $('previewWrap');
const STORAGE_KEY = 'vansCentreWorkshopOrdersV2';
let photoDataUrl = null;

const pad = n => String(n).padStart(2, '0');
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatDate(v) {
  if (!v) return '—';
  const [y,m,d] = v.split('-');
  return `${d}.${m}.${y}`;
}
function safeText(v, fallback='—') {
  return (v || '').trim() || fallback;
}
function escapeHtml(value='') {
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function uid() {
  return (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
}
function readOrders() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function writeOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}
function setStatus(text, type='') {
  statusEl.textContent = text;
  statusEl.dataset.type = type;
}

$('date').value = todayISO();

photoInput.addEventListener('change', () => {
  const file = photoInput.files?.[0];
  if (!file) {
    photoDataUrl = null;
    previewWrap.classList.add('hidden');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    photoDataUrl = reader.result;
    preview.src = photoDataUrl;
    previewWrap.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});
$('removePhoto').addEventListener('click', () => {
  photoInput.value = '';
  photoDataUrl = null;
  preview.removeAttribute('src');
  previewWrap.classList.add('hidden');
});

function collectData() {
  return {
    id: $('recordId').value || uid(),
    date: $('date').value,
    author: $('author').value.trim(),
    vehicleKey: $('vehicleKey').value.trim(),
    vehicleId: $('vehicleId').value.trim(),
    vehicleLocation: $('vehicleLocation').value.trim(),
    keysLocation: $('keysLocation').value.trim(),
    dueRequired: $('dueRequired').value,
    dueDate: $('dueDate').value,
    request: $('request').value.trim(),
    workDone: $('workDone').value.trim(),
    finishedAt: $('finishedAt').value.trim(),
    updatedAt: new Date().toISOString()
  };
}
function fillForm(o) {
  $('recordId').value = o.id || '';
  $('date').value = o.date || todayISO();
  $('author').value = o.author || '';
  $('vehicleKey').value = o.vehicleKey || '';
  $('vehicleId').value = o.vehicleId || '';
  $('vehicleLocation').value = o.vehicleLocation || '';
  $('keysLocation').value = o.keysLocation || '';
  $('dueRequired').value = o.dueRequired || 'ne';
  $('dueDate').value = o.dueDate || '';
  $('request').value = o.request || '';
  $('workDone').value = o.workDone || '';
  $('finishedAt').value = o.finishedAt || '';
  saveState.textContent = 'Upravuji uložený list';
  window.scrollTo({top: 0, behavior: 'smooth'});
}
function resetForm() {
  form.reset();
  $('recordId').value = '';
  $('date').value = todayISO();
  $('author').value = 'Jakub';
  $('dueRequired').value = 'ne';
  photoInput.value = '';
  photoDataUrl = null;
  preview.removeAttribute('src');
  previewWrap.classList.add('hidden');
  saveState.textContent = 'Nový';
  setStatus('');
}
$('newBtn').addEventListener('click', resetForm);

function saveOrder() {
  if (!form.reportValidity()) return;
  const data = collectData();
  const orders = readOrders();
  const idx = orders.findIndex(x => x.id === data.id);
  if (idx >= 0) orders[idx] = data;
  else orders.unshift(data);
  writeOrders(orders);
  $('recordId').value = data.id;
  saveState.textContent = 'Uloženo';
  setStatus('Zakázkový list byl uložen do tohoto zařízení.', 'ok');
  renderSaved();
}
$('saveBtn').addEventListener('click', saveOrder);

function removeOrder(id) {
  const orders = readOrders();
  const item = orders.find(x => x.id === id);
  if (!item) return;
  if (!confirm(`Smazat zakázkový list ${item.vehicleKey || item.vehicleId || ''}?`)) return;
  writeOrders(orders.filter(x => x.id !== id));
  if ($('recordId').value === id) resetForm();
  renderSaved();
}

function renderSaved() {
  const query = $('searchSaved').value.trim().toLowerCase();
  let orders = readOrders().sort((a,b) => String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  if (query) orders = orders.filter(o => [o.vehicleKey,o.vehicleId,o.author,o.vehicleLocation,o.request].join(' ').toLowerCase().includes(query));
  savedList.innerHTML = '';
  emptySaved.classList.toggle('hidden', orders.length > 0);
  for (const o of orders) {
    const row = document.createElement('article');
    row.className = 'saved-row';
    const due = o.dueRequired === 'ano' ? `Termín: ${formatDate(o.dueDate)}` : 'Bez pevného termínu';
    row.innerHTML = `
      <button class="saved-main" type="button" data-open="${escapeHtml(o.id)}">
        <span class="saved-title">Klíč ${escapeHtml(o.vehicleKey || '—')} ${o.vehicleId ? `<small>ID ${escapeHtml(o.vehicleId)}</small>` : ''}</span>
        <span class="saved-meta">${escapeHtml(formatDate(o.date))} · ${escapeHtml(o.author || 'nezadáno')} · ${escapeHtml(due)}</span>
        <span class="saved-desc">${escapeHtml(o.request || '')}</span>
      </button>
      <button class="delete-btn" type="button" aria-label="Smazat" data-delete="${escapeHtml(o.id)}">Smazat</button>`;
    savedList.appendChild(row);
  }
  savedList.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => {
    const item = readOrders().find(x => x.id === btn.dataset.open);
    if (item) fillForm(item);
  }));
  savedList.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => removeOrder(btn.dataset.delete)));
}
$('searchSaved').addEventListener('input', renderSaved);
renderSaved();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
function line(ctx,x1,y1,x2,y2,color='#858991',w=1) {
  ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.restore();
}
function dotted(ctx,x1,y,x2,color='#6f7379',w=2) {
  ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=w; ctx.setLineDash([2,5]); ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke(); ctx.restore();
}
function wrapLines(ctx,text,maxWidth) {
  const paragraphs = String(text || '').split(/\n/), out=[];
  for (const p of paragraphs) {
    if (!p.trim()) { out.push(''); continue; }
    const words=p.split(/\s+/); let cur='';
    for (const word of words) {
      const test=cur ? `${cur} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && cur) { out.push(cur); cur=word; }
      else cur=test;
    }
    if (cur) out.push(cur);
  }
  return out;
}
function drawWrapped(ctx,text,x,y,maxWidth,lineHeight,maxLines=10) {
  const lines=wrapLines(ctx,text,maxWidth).slice(0,maxLines);
  lines.forEach((s,i)=>ctx.fillText(s,x,y+i*lineHeight));
}
function drawLogo(ctx) {
  ctx.save();
  ctx.translate(985,118);
  ctx.strokeStyle='#4a5997'; ctx.lineWidth=8; ctx.beginPath(); ctx.arc(74,28,94,Math.PI*1.03,Math.PI*1.91); ctx.stroke();
  ctx.strokeStyle='#be3437'; ctx.lineWidth=8; ctx.beginPath(); ctx.arc(74,28,94,Math.PI*1.91,Math.PI*2.18); ctx.stroke();
  ctx.fillStyle='#244f96'; ctx.font='italic 700 46px Arial'; ctx.fillText('Vans',-10,45);
  ctx.fillStyle='#c73338'; ctx.font='italic 700 31px Arial'; ctx.fillText('centre',83,67);
  ctx.fillStyle='#c73338'; ctx.fillRect(22,82,10,5); ctx.fillRect(37,82,10,5);
  ctx.fillStyle='#244f96'; ctx.font='700 10px Arial'; ctx.fillText('CENTRUM DODÁVEK',51,88);
  ctx.restore();
}
function pair(ctx,label,value,x,y,labelWidth,valueEnd) {
  ctx.fillStyle='#555a62'; ctx.font='22px Arial'; ctx.fillText(label,x,y);
  const start=x+labelWidth;
  dotted(ctx,start,y+6,valueEnd);
  ctx.fillStyle='#202226'; ctx.font='700 22px Arial'; ctx.fillText(safeText(value,''),start+8,y);
}

async function buildPdfBlob() {
  const W=1240,H=1754;
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const ctx=c.getContext('2d');
  const blue='#4a5997', red='#b73337', text='#202226', gray='#555a62';
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);

  // Rámování podle nahraného vzoru.
  ctx.fillStyle=blue; ctx.fillRect(0,0,W,24); ctx.fillRect(W-34,24,34,540);
  ctx.beginPath(); ctx.moveTo(W-34,545); ctx.quadraticCurveTo(W-32,636,W-115,665); ctx.lineTo(W,665); ctx.lineTo(W,545); ctx.closePath(); ctx.fill();
  ctx.fillStyle=red; ctx.fillRect(0,H-52,W,52); ctx.fillRect(0,H-690,34,638);
  ctx.beginPath(); ctx.moveTo(0,H-690); ctx.quadraticCurveTo(55,H-666,55,H-595); ctx.lineTo(55,H-155); ctx.quadraticCurveTo(57,H-92,138,H-52); ctx.lineTo(0,H-52); ctx.closePath(); ctx.fill();

  ctx.fillStyle=text; ctx.font='700 48px Arial'; ctx.fillText('Zakázkový list',74,225);
  drawLogo(ctx);

  ctx.fillStyle=gray; ctx.font='22px Arial'; ctx.fillText('datum zadání:',795,270);
  dotted(ctx,955,276,1130); ctx.fillStyle=text; ctx.font='700 22px Arial'; ctx.fillText(formatDate($('date').value),970,270);

  dotted(ctx,285,395,930);

  pair(ctx,'označení vozidla (č. klíče):',$('vehicleKey').value,74,465,335,545);
  pair(ctx,'id vozidla:',$('vehicleId').value,620,465,115,1115);
  pair(ctx,'vozidlo stojí',$('vehicleLocation').value,74,530,145,545);
  pair(ctx,'klíče',$('keysLocation').value,620,530,70,1115);
  pair(ctx,'zadal:',$('author').value,74,595,75,545);
  const dueText = `${$('dueRequired').value}${$('dueDate').value ? ` / ${formatDate($('dueDate').value)}` : ''}`;
  pair(ctx,'termín dokončení (ano / ne):',dueText,620,595,315,1115);

  line(ctx,74,645,W-85,645,'#6f9dce',2);
  ctx.fillStyle=gray; ctx.font='22px Arial'; ctx.fillText('popis zakázky',1000,678);
  ctx.fillStyle=text; ctx.font='28px Arial';
  drawWrapped(ctx,$('request').value,95,735,1040,40,8);

  if (photoDataUrl) {
    try {
      const p=await loadImage(photoDataUrl), x=805,y=815,bw=315,bh=170;
      const s=Math.min(bw/p.width,bh/p.height), iw=p.width*s, ih=p.height*s;
      ctx.save(); ctx.beginPath(); ctx.rect(x,y,bw,bh); ctx.clip();
      ctx.fillStyle='#f3f4f6'; ctx.fillRect(x,y,bw,bh); ctx.drawImage(p,x+(bw-iw)/2,y+(bh-ih)/2,iw,ih); ctx.restore();
      ctx.strokeStyle='#d4d7dc'; ctx.strokeRect(x,y,bw,bh);
    } catch (e) { console.warn(e); }
  }

  line(ctx,74,1010,W-85,1010,'#6f9dce',2);
  ctx.fillStyle=gray; ctx.font='22px Arial'; ctx.fillText('rozpis provedených prací, seznam nakoupených dílů',610,1045);
  ctx.fillStyle=text; ctx.font='25px Arial';
  drawWrapped(ctx,$('workDone').value,95,1110,1040,36,10);

  dotted(ctx,790,1570,1110);
  if ($('finishedAt').value.trim()) {
    ctx.fillStyle=text; ctx.font='700 19px Arial'; ctx.fillText($('finishedAt').value.trim(),800,1563);
  }
  ctx.fillStyle=gray; ctx.font='20px Arial'; ctx.fillText('datum a podpis při dokončení',830,1605);

  const image=c.toDataURL('image/jpeg',0.96);
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  doc.addImage(image,'JPEG',0,0,210,297);
  return doc.output('blob');
}

function filename() {
  const key=safeText($('vehicleKey').value,'bez_klice').replace(/[^\p{L}\p{N}_-]+/gu,'_');
  const id=($('vehicleId').value||'').trim().replace(/[^\p{L}\p{N}_-]+/gu,'_');
  return `zakazkovy_list_${key}${id ? `_${id}` : ''}_${$('date').value || todayISO()}.pdf`;
}
async function createPdf(download=true) {
  if (!form.reportValidity()) return null;
  try {
    setStatus('Vytvářím PDF…');
    const blob=await buildPdfBlob();
    if (download) {
      const url=URL.createObjectURL(blob), a=document.createElement('a');
      a.href=url; a.download=filename(); document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
      setStatus('PDF bylo vytvořeno.', 'ok');
    }
    return blob;
  } catch (e) {
    console.error(e); setStatus('PDF se nepodařilo vytvořit.', 'error'); return null;
  }
}
$('pdfBtn').addEventListener('click',()=>createPdf(true));
$('shareBtn').addEventListener('click',async()=>{
  const blob=await createPdf(false); if(!blob) return;
  try {
    const file=new File([blob],filename(),{type:'application/pdf'});
    if(navigator.canShare && navigator.canShare({files:[file]})) {
      await navigator.share({title:'Zakázkový list',text:`Zakázkový list – klíč ${safeText($('vehicleKey').value)}`,files:[file]});
      setStatus('Sdílení otevřeno.', 'ok');
    } else {
      const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download=filename(); a.click(); setTimeout(()=>URL.revokeObjectURL(url),1500);
      setStatus('PDF bylo staženo.', 'ok');
    }
  } catch(e) {
    if(e?.name!=='AbortError') { console.error(e); setStatus('Sdílení se nepodařilo spustit.', 'error'); }
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
}
