export function formatTime(seconds){
 if(!Number.isFinite(seconds)||seconds<0)return '--:--';
 const total=Math.floor(seconds),s=String(total%60).padStart(2,'0'),m=Math.floor(total/60);
 return m<60?`${String(m).padStart(2,'0')}:${s}`:`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}:${s}`;
}
const segments={a:'1,0 7,0 6,1 2,1',b:'8,1 8,5.3 7,5.8 7,2',c:'8,6.7 8,11 7,10 7,6.2',d:'1,12 2,11 6,11 7,12',e:'0,6.7 1,6.2 1,10 0,11',f:'0,1 1,2 1,5.8 0,5.3',g:'1,6 2,5.4 6,5.4 7,6 6,6.6 2,6.6'};
const digits={'0':'abcdef','1':'bc','2':'abdeg','3':'abcdg','4':'bcfg','5':'acdfg','6':'acdefg','7':'abc','8':'abcdefg','9':'abcdfg','-':'g'};
export function lcdMarkup(text){
 let x=0,body='';
 for(const char of text){
  let glyph='',advance=10;
  if(digits[char]){
   glyph=Object.values(segments).map(points=>`<polygon points="${points}" opacity=".065"/>`).join('');
   glyph+=[...digits[char]].map(key=>`<polygon points="${segments[key]}"/>`).join('');
  }else if(char===':'){glyph='<rect x="1" y="3" width="1.2" height="1.2"/><rect x="1" y="8" width="1.2" height="1.2"/>';advance=4;}
  else if(char==='/'){glyph='<path d="M1 12 5 0" fill="none" stroke="currentColor" stroke-width=".8"/>';advance=7;}
  else advance=3;
  body+=`<g transform="translate(${x} 1)">${glyph}</g>`;x+=advance;
 }
 return `<svg viewBox="0 0 ${x-2} 14" aria-hidden="true" focusable="false">${body}</svg><span class="sr-only">${text}</span>`;
}
export function createTrackClock(element){
 const panel=element?.closest?.('.lcd-clock')||element;let previous='';
 const controller={
  setPower(on){
   const powered=Boolean(on);
   if(panel?.dataset)panel.dataset.power=powered?'on':'off';
   panel?.setAttribute?.('aria-label',powered?'Compteur du mix allumé':'Compteur du mix éteint');
   element?.setAttribute?.('aria-hidden',String(!powered));
  },
  update(audio,duration){
   if(!element)return;
   const total=Number.isFinite(audio?.duration)&&audio.duration>0?audio.duration:duration;
   const text=`${formatTime(Math.max(0,audio?.currentTime||0))} / ${formatTime(total>0?total:NaN)}`;
   if(previous===text)return;previous=text;
   if(element.querySelector)element.innerHTML=lcdMarkup(text);else element.textContent=text;
  }
 };
 controller.setPower(false);return controller;
}
