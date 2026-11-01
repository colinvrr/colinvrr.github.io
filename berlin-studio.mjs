import {containInteriorBox} from './interior-portal.mjs';

// All studio pieces live behind the existing DJ opening and its glazing.
export function buildBerlinStudio(s){
 const portal={x:247,y:692,width:748,height:455,z:-42};
 const box=(x,y,w,h,d,z,color,kind='interior-studio')=>{
  s.box(x,y,w,h,d,z,color,null,kind==='interior-glow'?'studio-neon':kind,.45);containInteriorBox(s,portal);
 };
 const line=(points,color,r=1.2)=>s.tube(points,color,r,'interior-dark');
 // Deep side returns and ceiling: charcoal concrete, black acoustic treatment,
 // brushed metal and a few warm practical lights instead of a bright backdrop.
 box(244,690,26,460,450,-285,'#272c31');
 box(972,690,26,460,450,-285,'#272c31');
 box(260,695,710,17,430,-285,'#292a2d');
 for(const x of [280,425,570,715,860])box(x,706,11,12,360,-300,'#454748','interior-dark');
 for(const x of [285,860]){
  box(x,720,105,142,20,-480,'#161e22','interior-dark');
  for(let row=0;row<6;row++)for(let col=0;col<4;col++){
   box(x+7+col*24,728+row*21,19,15,6,-466,(row+col)%2?'#374148':'#2b353a','interior-dark');
   box(x+8+col*24,728+row*21,17,2,3,-462,'#596168','interior-dark');
  }
 }
 // Backlit industrial sign and two short amber/cyan practical strips.
 box(458,719,327,44,13,-476,'#1a2024','interior-dark');
 box(464,724,315,33,4,-466,'#29323a','interior-dark');
 if(s.engine){
  const c=document.createElement('canvas');c.width=768;c.height=100;const ctx=c.getContext('2d');
  ctx.clearRect(0,0,768,100);ctx.fillStyle='#d7ba81';ctx.font='bold 46px monospace';ctx.textAlign='center';
  const isBerlin=s.place?.theme==='berlin';
  ctx.fillText(isBerlin?'HINTERHOF  /  SOUND SYSTEM':'PARIS  /  SOUND SYSTEM',384,48);
  ctx.fillStyle='#6eaaa8';ctx.font='bold 20px monospace';
  ctx.fillText(isBerlin?'ANALOG  •  VINYL  •  BERLIN  2002':'ANALOG  •  VINYL  •  PARIS  1998',384,80);
  s.plane(478,726,286,28,-458,c);
 }
 box(475,756,290,2,3,-460,'#a76538','interior-glow');
 for(const x of [407,818]){
  box(x,738,5,139,9,-450,'#334a4e','interior-dark');
  box(x+1,743,3,128,3,-443,x<500?'#5d9d9e':'#d68a50','interior-glow');
 }
 // Flight cases and analog outboard racks with physical knobs, meters and LEDs.
 for(const x of [276,862]){
  box(x,876,105,232,42,-432,'#20282c','interior-dark');
  for(const xx of [x+4,x+97])box(xx,879,4,225,5,-407,'#8a8a7f','interior-brass');
  for(let row=0;row<7;row++){
   const yy=887+row*30;box(x+9,yy,87,25,6,-406,row%2?'#343d3e':'#444846','interior-dark');
   box(x+16,yy+5,21,10,3,-402,row%2?'#76958c':'#bd965d','interior-glow');
   for(let k=0;k<4;k++){
    box(x+44+k*11,yy+6,6,6,4,-402,'#b3afa0','interior-dark');
    box(x+45+k*11,yy+15,3,3,3,-401,k===row%4?'#d8874c':'#749b86','interior-glow');
   }
  }
  for(const yy of [881,1096])for(const xx of [x+5,x+96])box(xx,yy,3,3,3,-400,'#d1cbbb','interior-brass');
 }
 // Shelves of vinyl and tape boxes, not an image of equipment.
 box(392,878,90,6,45,-457,'#756957','interior-wood');
 for(let i=0;i<9;i++){
  box(396+i*9,832+(i%3)*3,7,43-(i%3)*3,24,-449,['#b0a28a','#6f7e79','#956c60','#b9ad91','#536b70'][i%5]);
 }
 box(790,879,67,6,42,-455,'#756957','interior-wood');
 for(let i=0;i<5;i++){
  box(794+i*12,850,10,26,24,-447,['#b0a28a','#607c79','#996c5a'][i%3]);
  box(795+i*12,855,8,3,2,-433,'#d0c6ac');
 }
 // Cable looms bend around the racks; patch points sit proud of the wall.
 for(let i=0;i<4;i++){
  const x=390+i*9;
  line([[x,889,-400],[x+4,913+i*5,-399],[x-3,944+i*5,-399],[x+8,963+i*6,-399]],i%2?'#a77850':'#637e80',1.2);
  box(x-2,884,5,6,8,-402,'#b9ab8c','interior-brass');
 }
 for(let i=0;i<3;i++)line([[846+i*6,898,-400],[837+i*9,924,-398],[848+i*7,950,-398],[842+i*8,977,-398]],i%2?'#8b7663':'#576e73',1.2);
 // A patchbay, tape labels and a battered small poster add a lived-in feel.
 box(779,798,80,30,8,-448,'#252b2b','interior-dark');
 for(let i=0;i<9;i++)for(let row=0;row<2;row++)box(786+i*7,804+row*9,3,3,3,-442,i%3?'#b6aa8d':'#c5754b','interior-brass');
 box(394,779,80,39,6,-455,'#87765d');
 for(let i=0;i<4;i++)box(400,785+i*7,58-i*7,2,3,-451,i===0?'#d5b875':'#394543','interior-dark');
 // Two hanging cage lamps and softly luminous tubes are spatial objects.
 for(const x of [450,800]){
  line([[x,706,-320],[x,754,-320]],'#3a3937',1.8);
  box(x-15,752,30,7,28,-320,'#4e4b42','interior-dark');
  box(x-9,759,18,23,18,-320,'#dfb778','interior-glow');
  for(const dx of [-12,12])line([[x+dx,756,-307],[x+dx,782,-307]],'#56554e',1.2);
 }
 // Console face: flight-case rails, vent slots, stickers and signal lights.
 box(416,999,442,140,7,-65,'#303739','interior-dark');
 for(const x of [425,847])box(x,1005,6,126,7,-60,'#898b82','interior-brass');
 for(const y of [1006,1124])box(428,y,416,4,6,-59,'#7b817c','interior-dark');
 for(let row=0;row<3;row++)for(let i=0;i<17;i++)box(458+i*7,1030+row*7,4,2,2,-57,'#858b80','interior-dark');
 for(let i=0;i<14;i++)box(631+i*8,1029,4,4,2,-56,i%4?'#789a87':'#c58d58','interior-glow');
 box(645,1055,98,42,3,-57,'#20292c','interior-dark');
 for(let i=0;i<8;i++)box(652+i*11,1062,6,26-(i%4)*5,2,-54,['#709c8a','#d3a45e','#b86351'][i%3],'interior-glow');
 for(const [xx,yy] of [[754,1088],[770,1040],[480,1093]]){box(xx,yy,24,13,3,-57,'#b8a882');box(xx+3,yy+4,17,2,2,-54,'#53615c','interior-dark');}
 box(780,1072,43,25,3,-57,'#b4a58a');box(785,1077,33,3,2,-54,'#4f5d58','interior-dark');
}
