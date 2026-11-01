export function formatTime(seconds){
 if(!Number.isFinite(seconds)||seconds<0)return '--:--';
 const total=Math.floor(seconds),s=String(total%60).padStart(2,'0'),m=Math.floor(total/60);
 return m<60?`${String(m).padStart(2,'0')}:${s}`:`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}:${s}`;
}
// Plain, tabular text remains readable at rest, during loading and in pause.
export function createTrackClock(element){
 let previous='';
 return {
  update(audio,duration){
   if(!element)return;
   const total=Number.isFinite(audio?.duration)&&audio.duration>0?audio.duration:duration;
   const text=`${formatTime(Math.max(0,audio?.currentTime||0))} / ${formatTime(total>0?total:NaN)}`;
   if(previous===text)return;previous=text;element.textContent=text;
  }
 };
}
