// Furnished rooms behind real openings. These solids join the existing static
// batches; no second scene, image backdrop, light, or animation loop is needed.
import {containInteriorBox} from './interior-portal.mjs';
export function buildResidentInterior(s,{x,y,width:w,height:h,entry=false}){
 const wood=s.maps.wood.image;
 const back=entry?-690:-660,left=x-230,right=x+w+110,floor=y+h+(entry?-9:48),ceiling=y-240;
 const inset=entry?16:7,topInset=entry?1:inset,portal={x:x+inset,y:y+topInset,width:w-inset*2,height:h-inset-topInset,z:-33};
 const box=(xx,yy,ww,hh,d,z,color,kind='interior-wall',map=null)=>{s.box(xx,yy,ww,hh,d,z,color,map,kind,.7);containInteriorBox(s,portal);};
 // A warm plaster envelope, deep reveals, continuous floor and skirting.
 box(left,ceiling,right-left,floor-ceiling+12,18,back,'#bca88d');
 box(left,ceiling,12,floor-ceiling+12,650,-350,'#a59680');
 box(right-12,ceiling,12,floor-ceiling+12,650,-350,'#d7c5a5');
 box(left,floor,right-left,8,650,-350,'#876044','interior-wood',wood);
 box(left,ceiling-2,right-left,8,650,-350,'#dfd3ba');
 box(left,floor-20,right-left,14,10,back+15,'#e3d6b9');
 box(left,y-55,right-left,6,8,back+15,'#e5d9c0');
 // Alternating parquet boards are physical strips on the floor.
 for(let i=0;i<9;i++)box(left+i*45,floor-2,43,2,610,-349,i%2?'#96704f':'#a27d57','interior-wood',wood);
 const art=(xx,yy,ww,hh)=>{
  box(xx-5,yy-5,ww+10,hh+10,5,back+22,'#654d38','interior-wood');
  box(xx,yy,ww,hh,3,back+26,'#e4d2ab');
  box(xx+ww*.13,yy+hh*.16,ww*.36,hh*.55,2,back+29,'#a76645');
  box(xx+ww*.43,yy+hh*.38,ww*.43,hh*.43,2,back+31,'#4f6860');
  box(xx+ww*.5,yy+hh*.12,ww*.23,hh*.22,2,back+33,'#c69852');
 };
 if(entry){
  // Entrance hall: wainscot, framed print, oak console, mirror and runner.
  box(left,floor-145,right-left,120,8,back+14,'#6a7565');
  for(let xx=left+18;xx<right-25;xx+=56){box(xx,floor-127,43,88,4,back+21,'#8b927a');box(xx+4,floor-123,35,80,4,back+24,'#6a7565');}
  box(left,floor-149,right-left,5,12,back+23,'#c9bc9b');
  art(x-58,y+90,104,144);
  box(x-72,floor-172,130,10,74,back+75,'#99734e','interior-wood',wood);
  box(x-68,floor-158,122,32,64,back+72,'#72573d','interior-wood',wood);
  for(const xx of [x-64,x+43])box(xx,floor-129,8,129,9,back+102,'#7d6043','interior-wood',wood);
  box(x-18,floor-178,42,5,26,back+83,'#384b48');
  box(x-13,floor-188,32,8,23,back+83,'#d2bb91');
  box(x-84,floor-8,132,2,250,-325,'#9c6350','interior-fabric');
  box(x-78,floor-9,120,2,232,-325,'#c4a580','interior-fabric');
  // Warm wall lamp, with a visible metal arm and a shaded bulb.
  box(x+74,y+148,5,78,8,back+35,'#8e7448');
  box(x+62,y+151,31,39,19,back+44,'#edd9a8','interior-glow');
  // Tall potted plant tucked to one side of the passage, away from the hands.
  box(x-123,floor-58,42,58,42,-455,'#a36849');
  box(x-105,floor-230,4,180,4,-455,'#556447');
  for(let i=0;i<6;i++){
   const leafX=x-127+(i%2)*22,leafY=floor-196+i*22;
   box(leafX,leafY,28,10,15,-451,'#6d8056');
  }
 }else{
  // The upper apartment is a small salon: library, abstract print and lamp.
  art(x-23,y-60,112,98);
  const shelfX=x-132,shelfY=y+45;
  box(shelfX,shelfY,91,278,21,back+40,'#73533a','interior-wood',wood);
  for(let row=0;row<4;row++){
   const yy=shelfY+row*66;
   box(shelfX-3,yy+56,97,6,47,back+63,'#aa855c','interior-wood',wood);
   const colors=['#6b796a','#ba8a63','#d6bd8b','#7b5350','#53686c'];
   for(let i=0;i<7;i++)box(shelfX+7+i*11,yy+12+(i%3)*4,8,43-(i%3)*4,24,back+62,colors[(i+row)%5]);
  }
  box(x+102,y+185,4,157,4,back+110,'#807355');
  box(x+77,y+172,55,42,38,back+110,'#ead5a4','interior-glow');
  box(x+83,y+341,44,4,34,back+110,'#7a6950');
  // Cushioned armchair below the picture, with two differently lit arms.
  box(x-4,y+221,91,88,69,back+100,'#78826c','interior-fabric');
  box(x-6,y+292,95,25,103,back+133,'#929a7b','interior-fabric');
  for(const xx of [x-15,x+81])box(xx,y+265,13,57,96,back+132,'#68745f','interior-fabric');
  for(const xx of [x+3,x+67])box(xx,y+316,8,40,8,back+160,'#735a40','interior-wood');
 }
}
