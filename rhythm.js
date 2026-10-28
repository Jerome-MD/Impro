// Affichage du rythme main droite : notation (4/4 en croches, 3/4, 6/8) ou cases (funk, blues), avec comptage.
export function rhythmSvg(grid,meter){
  const t=grid.split(' ').filter(c=>c!=='/'),n=t.length,c68=n===6&&meter==='6/8';
  const sw={8:36,6:44,12:34,16:28}[n]||30,W=n*sw+20,H=84,Y=36,cx=i=>10+sw*i+sw/2;
  const spb=c68?3:{8:2,6:2,12:3,16:4}[n]||2,L={16:['','e','&amp;','a'],12:['','la','li']}[n]||['','et'];
  const lab=i=>c68?String(i+1):i%spb===0?String(i/spb+1):L[i%spb];
  const ev=[];t.forEach((c,i)=>{if(c==='x')ev.push({i})});
  ev.forEach((e,k)=>e.d=(k+1<ev.length?ev[k+1].i:n)-e.i);
  const notes=(n===8||n===6)&&t[0]==='x'&&ev.every(e=>[1,2,3,4,6].includes(e.d));
  let s='';
  if(notes){
    const gs=c68?3:2,sx=e=>cx(e.i)+6,top=Y-30;
    s+=`<line x1="4" y1="${Y}" x2="${W-4}" y2="${Y}" stroke="currentColor" stroke-opacity=".5"/><line x1="4" y1="${Y-12}" x2="4" y2="${Y+12}" stroke="currentColor"/><line x1="${W-4}" y1="${Y-12}" x2="${W-4}" y2="${Y+12}" stroke="currentColor"/>`;
    const beamed=new Set();
    for(let k=0;k<ev.length;){
      let j=k;while(j+1<ev.length&&ev[j].d===1&&ev[j+1].d===1&&ev[j+1].i===ev[j].i+1&&Math.floor(ev[j+1].i/gs)===Math.floor(ev[k].i/gs))j++;
      if(j>k&&ev[k].d===1){s+=`<rect x="${sx(ev[k])-1}" y="${top}" width="${sx(ev[j])-sx(ev[k])+2}" height="4" fill="currentColor"/>`;for(let m=k;m<=j;m++)beamed.add(m)}
      k=j+1;
    }
    ev.forEach((e,k)=>{
      const x=cx(e.i),open=e.d===4||e.d===6;
      s+=`<ellipse cx="${x}" cy="${Y}" rx="7" ry="5" transform="rotate(-20 ${x} ${Y})" fill="${open?'none':'currentColor'}" stroke="currentColor" stroke-width="2"/><line x1="${sx(e)}" y1="${Y-2}" x2="${sx(e)}" y2="${top}" stroke="currentColor" stroke-width="2"/>`;
      if(e.d===3||e.d===6)s+=`<circle cx="${x+14}" cy="${Y-6}" r="2.4" fill="currentColor"/>`;
      if(e.d===1&&!beamed.has(k))s+=`<path d="M${sx(e)} ${top} q12 6 8 20" fill="none" stroke="currentColor" stroke-width="2.5"/>`;
    });
  }else{
    t.forEach((c,i)=>{s+=`<rect x="${cx(i)-11}" y="${Y-12}" width="22" height="22" rx="4" fill="${c==='x'?'currentColor':'none'}" stroke="${c==='x'?'currentColor':'#98a1b0'}" stroke-width="2"/>`});
  }
  t.forEach((c,i)=>{const b=c68?i%3===0:i%spb===0;s+=`<text x="${cx(i)}" y="74" text-anchor="middle" font-size="15" font-weight="${b?700:400}" fill="${b?'currentColor':'#98a1b0'}">${lab(i)}</text>`});
  return`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Rythme main droite" fill="currentColor">${s}</svg>`;
}
