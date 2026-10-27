// Each future location is a model, selected once per visit. New models can be
// registered here without repeating the immediately previous location.
export const places=[{id:'paris-phone',label:'Façade parisienne',model:'haussmann-store'},{id:'paris-apartment',label:'Appartement du DJ',model:'groundfloor-apartment'}];
export function choosePlace(previous,random=Math.random,list=places){
 if(!list.length)throw new Error('No places configured');
 const old=list.findIndex(place=>place.id===previous),r=Math.min(.999999999,Math.max(0,random()));
 return old>=0&&list.length>1?list[(old+1+Math.floor(r*(list.length-1)))%list.length]:list[Math.floor(r*list.length)];
}
export function applyPlace(surface,list=places){
 let requested;try{requested=new URL(globalThis.location.href).searchParams.get('scene');}catch{}
 const place=(requested==='appartement'||requested==='apartment'?list.find(item=>item.model==='groundfloor-apartment'):null)||list[0];
 if(!place)throw new Error('No places configured');
 try{sessionStorage.setItem('form:place',place.id);}catch{}
 try{history.replaceState({...history.state,formPlace:place.id},'');}catch{}
 surface.dataset.place=place.id;surface.setAttribute('aria-label',`${place.label||'Façade'}, lire ou mettre en pause le mix`);return place;
}
