export const tagStyles = [
  { name:'handstyle', src:'./assets/cln-handstyle.png', rotation:-7 },
  { name:'throwup', src:'./assets/cln-throwup.png', rotation:-4 },
  { name:'angular', src:'./assets/cln-angular.png', rotation:3 }
];
export const tagColors = [
  { name:'corail', hue:0, saturation:.9, brightness:.88 },
  { name:'ambre', hue:43, saturation:1.1, brightness:1.08 },
  { name:'vert', hue:105, saturation:.85, brightness:.88 },
  { name:'turquoise', hue:158, saturation:.85, brightness:1 },
  { name:'bleu', hue:205, saturation:.75, brightness:1.05 },
  { name:'violet', hue:265, saturation:.8, brightness:1 },
  { name:'rose', hue:315, saturation:.8, brightness:1 }
];
function differentIndex(count, previous, random) {
  const valid=Number.isInteger(previous) && previous>=0 && previous<count;
  const sample=Math.min(.999999999,Math.max(0,random()));
  return valid ? (previous+1+Math.floor(sample*(count-1)))%count : Math.floor(sample*count);
}
// Both indices exclude their previous values, rather than hoping a completely
// random draw will happen to look different after a reload.
export function chooseTag(previous, random=Math.random) {
  return {
    style:differentIndex(tagStyles.length,previous?.style,random),
    color:differentIndex(tagColors.length,previous?.color,random)
  };
}
export function applyTag() {
  const image=document.querySelector('#shutter-tag');
  if(!image)return;
  let previous;
  try { previous=JSON.parse(sessionStorage.getItem('form:cln')); } catch {}
  previous ||= history.state?.clnTag;
  const selection=chooseTag(previous);
  try { sessionStorage.setItem('form:cln',JSON.stringify(selection)); } catch {}
  // History survives refreshes too, including when session storage is blocked.
  try { history.replaceState({...history.state,clnTag:selection},''); } catch {}
  const style=tagStyles[selection.style], color=tagColors[selection.color];
  image.dataset.style=style.name;image.dataset.color=color.name;
  image.style.setProperty('--tag-rotation',`${style.rotation}deg`);
  image.style.filter=`hue-rotate(${color.hue}deg) saturate(${color.saturation}) brightness(${color.brightness}) contrast(1.05)`;
  image.src=style.src;
}
if(typeof document!=='undefined')applyTag();
