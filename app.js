import {draw,view} from './engine.js';
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
// --- Stockage
const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem('impro.'+k))??d}catch{return d}};
const sv=(k,v)=>{try{localStorage.setItem('impro.'+k,JSON.stringify(v))}catch{}};
let S=ld('settings',{fr:false,timer:5}),H=ld('history',{}),T=ld('today',null);
const ds=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const cnt=n=>Array.from({length:n},(_,i)=>H[ds(i)]?.done).filter(Boolean).length;
const hist=()=>Object.keys(H).filter(d=>d<ds(0)).sort().reverse().map(d=>({date:d,styleId:H[d].draw.style}));
function newDraw(reroll,keep){
  const date=ds(0),locks=keep&&T?T.locks:{};
  const d=draw({date,reroll,locks,prev:T?.draw,hist:hist()});
  T={date,reroll,locks,draw:d};sv('today',T);
  H[date]={draw:d,done:H[date]?.done||false};sv('history',H);render();
}
// --- Audio : métronome et minuteur
let ac,mt,nextT,beat=0,metroOn=false,clicks=4,tim=null,left=0,wake=null;
const ctx=()=>ac||(ac=new(window.AudioContext||window.webkitAudioContext)());
function click(t,f,len=.05){const o=ctx().createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.setValueAtTime(.5,t);g.gain.exponentialRampToValueAtTime(.001,t+len);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+len+.01)}
async function awake(){try{if((metroOn||tim)&&!wake)wake=await navigator.wakeLock.request('screen');else if(!metroOn&&!tim&&wake){wake.release();wake=null}}catch{}}
function metro(on){
  metroOn=on;clearInterval(mt);
  if(on){ctx().resume();nextT=ac.currentTime+.05;beat=0;mt=setInterval(()=>{while(nextT<ac.currentTime+.1){click(nextT,beat%clicks?1000:1500);nextT+=60/T.draw.tempo;beat++}},25)}
  $('#bMet').classList.toggle('on',on);awake();
}
const tl=()=>tim?`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`:S.timer?`${S.timer} min`:'Sans minuteur';
function timer(){
  if(tim){clearInterval(tim);tim=null}
  else if(S.timer){left=S.timer*60;tim=setInterval(()=>{left--;if(left<=0){clearInterval(tim);tim=null;ctx().resume();[0,.25,.5].forEach(d=>click(ac.currentTime+d,660,.2));navigator.vibrate?.([200,100,200]);awake()}$('#bTim').textContent=tl()},1000)}
  $('#bTim').classList.toggle('on',!!tim);$('#bTim').textContent=tl();awake();
}
// --- Affichage
function render(){
  const d=T.draw,v=view(d,S.fr);clicks=v.clicks;
  const lk=k=>`<button class="lk" data-k="${k}" aria-pressed="${!!T.locks[k]}" aria-label="Verrouiller">${T.locks[k]?'🔒':'🔓'}</button>`;
  const cell=(k,lab,val,x='')=>`<section class="c"><div class="lab">${lab}${lk(k)}</div><div class="val">${val}</div>${x}</section>`;
  const rh=d.extra.id==='rhythm'?`<div class="rh">${d.extra.grid.split(' ').map(c=>c==='/'?'<i></i>':`<b class="${c==='x'?'x':''}"></b>`).join('')}</div>`:'';
  $('main').innerHTML=
    cell('style','Style',esc(v.style))+cell('key','Tonalité',esc(v.key))+
    `<section class="c"><div class="lab">Tempo${lk('tempo')}</div><div class="tp"><button data-t="-5" aria-label="Moins 5">−</button><span class="val">${v.tempo} BPM</span><button data-t="5" aria-label="Plus 5">+</button></div></section>`+
    cell('meter','Mesure',esc(v.meter))+
    `<section class="c w"><div class="lab">Grille, en boucle${lk('grid')}</div><div class="keys">${v.chords.map(c=>`<span class="k">${esc(c)}</span>`).join('')}</div></section>`+
    cell('scale','Gamme',esc(v.scale),`<div class="lab">${esc(v.notes)}</div>`)+cell('start','Note de départ',esc(v.start))+
    cell('lh','Main gauche',`<span class="sm">${esc(v.lh)}</span>`)+cell('extra','Consigne',`<span class="sm">${esc(v.extra.text)}</span>`,rh);
  $('#date').textContent=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
  $('#cnt').textContent=`${cnt(7)} séances sur 7 jours, ${cnt(30)} sur 30 jours`;
  $('#bDone').textContent=H[T.date]?.done?'Fait ✓':'Marquer fait';$('#bDone').classList.toggle('pri',!!H[T.date]?.done);
  $('#bTim').textContent=tl();
}
const dlg=h=>{$('dialog').innerHTML=h+'<p><button onclick="this.closest(\'dialog\').close()">Fermer</button></p>';$('dialog').showModal()};
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.k){T.locks[b.dataset.k]=!T.locks[b.dataset.k];sv('today',T);render()}
  else if(b.dataset.t){T.draw.tempo=Math.max(40,Math.min(200,T.draw.tempo+ +b.dataset.t));H[T.date].draw=T.draw;sv('today',T);sv('history',H);render()}
  else if(b.id==='bRe')newDraw(T.reroll+1,true);
  else if(b.id==='bMet')metro(!metroOn);
  else if(b.id==='bTim')timer();
  else if(b.id==='bDone'){H[T.date].done=!H[T.date].done;sv('history',H);render()}
  else if(b.id==='bHist')dlg('<h2>Historique</h2>'+(Object.keys(H).sort().reverse().slice(0,30).map(d=>{const v=view(H[d].draw,S.fr);return`<div>${d} : ${esc(v.style)}, ${esc(v.key)} ${H[d].done?'✓':''}</div>`}).join('')||'<p>Aucune séance pour le moment.</p>'));
  else if(b.id==='bSet'){dlg(`<h2>Réglages</h2><p><label>Notation <select id="sFr"><option value="0">C, D, E</option><option value="1" ${S.fr?'selected':''}>Do, Ré, Mi</option></select></label></p><p><label>Minuteur <select id="sTm">${[0,2,5,10].map(m=>`<option value="${m}" ${S.timer===m?'selected':''}>${m?m+' min':'Aucun'}</option>`).join('')}</select></label></p><p><button id="exp">Exporter la sauvegarde</button> <label class="fl">Importer<input id="imp" type="file" accept="application/json" hidden></label></p>`);
    $('#sFr').onchange=e=>{S.fr=e.target.value==='1';sv('settings',S);render()};
    $('#sTm').onchange=e=>{S.timer=+e.target.value;sv('settings',S);render()};
    $('#exp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({settings:S,history:H})],{type:'application/json'}));a.download='impro-sauvegarde.json';a.click()};
    $('#imp').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text());Object.assign(H,j.history||{});sv('history',H);render();$('dialog').close()}catch{alert('Fichier de sauvegarde illisible.')}}}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&T.date!==ds(0))newDraw(0,false)});
if(!T||T.date!==ds(0))newDraw(0,false);else render();
navigator.serviceWorker?.register('sw.js');
