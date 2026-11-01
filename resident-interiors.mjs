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
  // A Paris entrance hall: tiled floor, framed mirror, bench and coat rack.
  box(left,floor-190,right-left,160,8,back+14,'#7c8580');
  box(left,floor-194,right-left,6,12,back+23,'#d5c8ad');
  for(let xx=left+18;xx<right-25;xx+=64){
   box(xx,floor-177,50,124,4,back+21,'#9ca49a');
   box(xx+5,floor-172,40,114,4,back+24,'#7c8580');
  }
  // Large brass-framed mirror and a pair of shaded sconces.
  box(x-86,y+76,120,174,8,back+26,'#a18657');
  box(x-80,y+82,108,162,4,back+32,'#a8b8b0');
  box(x-68,y+91,14,140,2,back+35,'#d2dbcb');
  for(const xx of [x-116,x+45]){
   box(xx,y+125,4,55,7,back+35,'#8d7653');
   box(xx-11,y+116,26,30,20,back+42,'#ecd6ab','interior-glow');
  }
  // Narrow upholstered bench, low shoe shelf and folded cushions.
  box(x-104,floor-110,158,13,58,back+100,'#6f5240','interior-wood',wood);
  box(x-100,floor-123,150,15,53,back+105,'#a76f59','interior-fabric');
  for(const xx of [x-95,x+37])box(xx,floor-97,8,92,8,back+120,'#634b3a','interior-wood',wood);
  box(x-94,floor-40,130,5,45,back+104,'#826348','interior-wood',wood);
  box(x-88,floor-132,35,10,24,back+109,'#d6be9b','interior-fabric');
  // Checker tiles and a restrained runner recede into the hall.
  for(let row=0;row<5;row++)for(let col=0;col<5;col++)
   box(x-180+col*54,floor-2,53,2,58,-250-row*62,(row+col)%2?'#8a8274':'#d1c5ad');
  box(x-92,floor-5,120,2,230,-340,'#9c6253','interior-fabric');
  box(x-85,floor-6,106,2,210,-340,'#c6a889','interior-fabric');
  // Coat hooks and umbrella stand stay against the wall, clear of the doorway.
  box(x-156,y+195,9,190,9,back+62,'#6f563d','interior-wood');
  for(let i=0;i<3;i++)box(x-174+i*18,y+201,9,5,15,back+68,'#b69b68');
  box(x-137,floor-55,35,55,30,-465,'#786754');
  for(let i=0;i<3;i++)box(x-132+i*9,floor-126,3,80,3,-465,'#4f5b55');

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
