// Moteur : théorie + tirage. Aucune dépendance au DOM (réutilisable en V2).
export const SHARP=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
export const FLAT=['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
const FR={C:'Do',D:'Ré',E:'Mi',F:'Fa',G:'Sol',A:'La',B:'Si'};
export const SCALES={'pent-major':{n:'Pentatonique majeure',s:[0,2,4,7,9]},'pent-minor':{n:'Pentatonique mineure',s:[0,3,5,7,10]},blues:{n:'Gamme blues',s:[0,3,5,6,7,10]}};
const DEG={I:0,II:2,III:4,IV:5,V:7,VI:9,VII:11};
const KEYS={major:[0,7,5,2,10],minor:[9,4,2,7]};
const useFlat=(t,m)=>(m==='major'?[5,10,3,8]:[2,7,0,5,10]).includes(t);
const nm=(pc,flat,fr)=>{const s=(flat?FLAT:SHARP)[((pc%12)+12)%12];return fr?FR[s[0]]+s.slice(1):s};
const P=(d,q,b)=>({d,q,b});
export const LH={'held-root':'Fondamentale tenue','block-13':'Accord plaqué sur les temps 1 et 3','root-then-3rd-5th':'Fondamentale, puis tierce + quinte (cellule de 2 temps)','arp-up':'Arpège montant en croches : fondamentale, tierce, quinte, octave','oom-pah-pah':'Basse sur le temps 1, accord sur les temps 2 et 3','root-fifth':'Fondamentale et quinte en alternance','octaves':'Octaves sur la fondamentale'};
export const CONSTRAINTS=[['three-notes','Utilise seulement 3 notes de la gamme.'],['repeat-note','Répète une même note, puis change de rythme.'],['long-notes','Joue uniquement des notes longues (blanches et rondes).'],['silence','Après chaque phrase, laisse 2 temps de silence.'],['question-answer','Phrase « question » (montante), puis « réponse » (descendante).'],['motif-3','Invente un motif de 3 notes et répète-le en le décalant.'],['step-only','Mouvement conjoint uniquement (pas de sauts).'],['ending-note','Termine chaque phrase sur la fondamentale ou la quinte.'],['offbeat-start','Commence chaque phrase sur un contretemps.'],['range-octave','Reste dans une seule octave.'],['dynamics','Commence piano, finis forte.']];
// Cellules rythmiques main droite, par nombre de pas (3 à 5 attaques)
export const CELLS={8:['x . x x / . x . x','x . . x / x . x .','x x . x / . x . .'],16:['x . . x . . x . / . x . . . x . .','x . . . x . . x / . . x . . x . .','x . . x . . . . / x . . x . . x .'],6:['x . x x . x','x . . x x .','x . x . x .'],12:['x . . x . x x . . x . .','x . x x . . x . x . . .','x . . . . x x . . x . .']};
const M44={t:4,c:4,l:'4/4',steps:8,w:1};
export const STYLES=[
{id:'blues',label:'Blues',modes:['major'],meters:[{t:4,c:4,l:'4/4 shuffle',steps:12,w:1}],tempo:[70,100],prog:[[P('I','7',4),P('IV','7',2),P('I','7',2),P('V','7',1),P('IV','7',1),P('I','7',2)]],scales:['blues','pent-minor'],lh:['root-fifth','held-root'],w:1},
{id:'funk',label:'Funk',modes:['minor'],meters:[{t:4,c:4,l:'4/4, doubles croches',steps:16,w:1}],tempo:[95,110],prog:[[P('I','m7',2),P('IV','7',2)]],scales:['pent-minor','blues'],lh:['root-then-3rd-5th','root-fifth','held-root'],w:1},
{id:'soul',label:'Soul / pop',modes:['major'],meters:[M44],tempo:[70,100],prog:[[P('I','',1),P('VI','m',1),P('IV','',1),P('V','',1)]],scales:['pent-major'],lh:['root-then-3rd-5th','block-13','arp-up','root-fifth','held-root'],w:1},
{id:'romantic',label:'Romantique',modes:['major'],meters:[{t:3,c:3,l:'3/4',steps:6,w:1}],tempo:[60,85],prog:[[P('I','',2),P('III','m',2),P('IV','',2),P('V','',2)],[P('VI','m',2),P('IV','',2),P('I','',2),P('V','',2)]],scales:['pent-major'],lh:['oom-pah-pah','arp-up','root-then-3rd-5th','held-root'],w:1},
{id:'epic',label:'Épique',modes:['minor'],meters:[M44,{t:6,c:2,l:'6/8',steps:6,w:.5}],tempo:[70,95],prog:[[P('I','m',2),P('♭VI','',2),P('♭III','',2),P('♭VII','',2)]],scales:['pent-minor'],lh:['octaves','block-13','arp-up','held-root'],w:1}];
// PRNG à graine
function xmur(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^=h>>>16)>>>0}}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export const rng=seed=>mulberry(xmur(seed)());
const pick=(r,a)=>a[Math.floor(r()*a.length)];
function wpick(r,items,w){const ws=items.map(w),sum=ws.reduce((a,b)=>a+b,0);let x=r()*sum;for(let i=0;i<items.length;i++){if((x-=ws[i])<0)return items[i]}return items[items.length-1]}
// Tirage. hist = [{styleId}] jours précédents, du plus récent au plus ancien. locks = {style:true,...}
export function draw({date,level=1,reroll=0,locks={},prev=null,hist=[]}){
  const r=rng(`${date}|${level}|${reroll}|impro1`);
  const L=k=>!!(prev&&locks[k]&&prev[k]!==undefined);
  const wS=s=>s.w*(hist[0]?.styleId===s.id?.2:1)*(hist[1]?.styleId===s.id?.5:1)*(hist.slice(0,14).some(h=>h.styleId===s.id)?1:1.5);
  let st=wpick(r,STYLES,wS);
  if(L('style'))st=STYLES.find(s=>s.id===prev.style)||st;
  const same=!!prev&&prev.style===st.id;
  const mode=pick(r,st.modes),keyC={t:pick(r,KEYS[mode]),mode};
  const gridC=Math.floor(r()*st.prog.length),scaleC=pick(r,st.scales);
  const sRoll=r(),rRoll=r(),meterC=st.meters.indexOf(wpick(r,st.meters,m=>m.w));
  const tempoC=st.tempo[0]+5*Math.floor(r()*((st.tempo[1]-st.tempo[0])/5+1)),lhC=pick(r,st.lh);
  const eRoll=r(),eA=r();
  const key=L('key')&&st.modes.includes(prev.key.mode)?prev.key:keyC;
  const grid=L('grid')&&same?prev.grid:gridC;
  const scale=L('scale')&&st.scales.includes(prev.scale)?prev.scale:scaleC;
  const meter=L('meter')&&same?prev.meter:meterC;
  const tempo=L('tempo')&&prev.tempo>=st.tempo[0]&&prev.tempo<=st.tempo[1]?prev.tempo:tempoC;
  const lh=L('lh')&&st.lh.includes(prev.lh)?prev.lh:lhC;
  const sc=SCALES[scale].s,third=sc.includes(3)?3:4;
  const startC={semis:sRoll<.5?0:sRoll<.8?7:third,reg:rRoll<.7?'médium':rRoll<.85?'grave':'aigu'};
  const start=L('start')&&sc.includes(prev.start.semis)?prev.start:startC;
  const steps=st.meters[meter].steps;
  const cell=CELLS[steps][Math.floor(eA*CELLS[steps].length)],cs=CONSTRAINTS[Math.floor(eA*CONSTRAINTS.length)];
  const extraC=eRoll<1/3?{id:'rhythm',text:'Rythme main droite imposé',grid:cell}:{id:cs[0],text:cs[1]};
  const ok=L('extra')&&(prev.extra.id!=='rhythm'||CELLS[steps].includes(prev.extra.grid));
  return{date,reroll,level,style:st.id,key,grid,scale,start,meter,tempo,lh,extra:ok?prev.extra:extraC};
}
// Vue affichable. fr=true : Do Ré Mi
export function view(d,fr=false){
  const st=STYLES.find(s=>s.id===d.style),fl=useFlat(d.key.t,d.key.mode),N=p=>nm(p,fl,fr),m=st.meters[d.meter],sc=SCALES[d.scale];
  const chords=[];
  for(const c of st.prog[d.grid])for(let i=0;i<c.b;i++)chords.push(N(d.key.t+DEG[c.d.replace('♭','')]-(c.d[0]==='♭'?1:0))+c.q);
  return{style:st.label,key:`${N(d.key.t)} ${d.key.mode==='major'?'majeur':'mineur'}`,meter:m.l,clicks:m.c,chords,scale:sc.n,notes:sc.s.map(x=>N(d.key.t+x)).join(' '),start:`${N(d.key.t+d.start.semis)}, ${d.start.reg}`,lh:LH[d.lh],tempo:d.tempo,extra:d.extra};
}
