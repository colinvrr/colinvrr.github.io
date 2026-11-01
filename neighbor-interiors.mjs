import {containInteriorBox} from './interior-portal.mjs';

// Split the structural backing around the existing window openings.
export function neighborBacking(s,x,width,openings,depth,z,color){
 let pieces=[[x,0,width,1165]];
 for(const {x:a,y:b,w:c,h:d} of openings){
  pieces=pieces.flatMap(([l,t,w,h])=>{
   const r=l+w,bt=t+h,L=Math.max(l,a),R=Math.min(r,a+c),T=Math.max(t,b),B=Math.min(bt,b+d);
   if(R<=L||B<=T)return [[l,t,w,h]];
   return [[l,t,w,T-t],[l,B,w,bt-B],[l,T,L-l,B-T],[R,T,r-R,B-T]].filter(p=>p[2]>.1&&p[3]>.1);
  });
 }
 for(const [l,t,w,h] of pieces)s.box(l,t,w,h,depth,z,color,null,'stone');
}

export function buildNeighborInterior(s,{x,y,w,h},id,{berlin=false}={}){
 const portal={x:x+4,y:y+4,width:w-8,height:h-8,z:-120};
 const begin=s.staticMeshes.length,back=-570;
 // Follow the camera ray through this bay so furniture is visible even in the side buildings.
 const center=x+w/2+(x+w/2-620)*Math.abs(back)/(s.camera?.position.z||2900);
 const box=(xx,yy,ww,hh,d,z,color,kind='interior-wall')=>{
  const parallax=(x+w/2-620)*(Math.abs(z)-Math.abs(back))/(s.camera?.position.z||2900);
  const px=xx+parallax;
  s.box(px,yy,ww,hh,d,z,color,null,kind.replace('interior-','interior-neighbor-'),.4);
  if(px<portal.x||px+ww>portal.x+portal.width||yy<portal.y||yy+hh>portal.y+portal.height){
   containInteriorBox(s,portal);
  }
 };
 const variant=id%6,wall=(berlin?['#9c9f9a','#7e9290','#afa69d','#a0978f','#8996a0','#aaa99e']:['#c8b5a0','#c2c9b9','#d4bfa6','#d7c7ac','#b9bba8','#c4b2a6'])[variant];
 box(center-250,y-160,500,h+330,12,back,wall);
 // A recessed warm window wash makes the occupied rooms legible through the
 // reflective street glazing without adding another light source per window.
 box(center-232,y+18,464,h-36,2,back+8,berlin?'#7897a4':'#d59b5f','interior-glow');
 box(center-240,y+h-2,480,8,430,-350,'#947252','interior-wood');
 box(center-240,y-120,480,8,430,-350,'#e3d6bd');
 box(center-240,y+h-24,480,7,8,back+15,'#eee1c8');
 // Wainscoting and picture rails are real relief geometry.
 box(center-240,y+h*.55,480,5,8,back+17,'#e8dac0');
 for(let i=-2;i<=2;i++){
  const xx=center+i*78;
  box(xx-32,y+h*.59,64,3,5,back+20,'#e0d0b6');
  box(xx-32,y+h*.59,3,h*.28,5,back+20,'#e0d0b6');
  box(xx+29,y+h*.59,3,h*.28,5,back+20,'#e0d0b6');
 }
 if(variant===0){
  // Salon: upholstered sofa, cushions, coffee table and a framed print.
  box(center-105,y+h*.57,180,h*.19,45,-420,'#8c735f','interior-fabric');
  box(center-110,y+h*.73,190,24,90,-390,'#ae8f73','interior-fabric');
  for(const xx of [center-105,center+60])box(xx,y+h*.72,13,52,68,-370,'#765c4c','interior-fabric');
  box(center-42,y+h*.61,38,29,12,-390,'#d4c19e','interior-fabric');
  box(center-48,y+h*.86,105,5,55,-250,'#8a6849','interior-wood');
  for(const xx of [center-40,center+42])box(xx,y+h*.86+5,5,28,5,-233,'#74563e','interior-wood');
  box(center-48,y+h*.14,96,85,6,back+25,'#9c7951');
  box(center-42,y+h*.14+6,84,73,4,back+30,'#e5d4b4');
  box(center-24,y+h*.14+19,45,43,3,back+33,'#a47c68');
 }else if(variant===1){
  // Bookcase, writing desk and chair.
  box(center-105,y+h*.22,75,h*.53,24,back+35,'#765b43','interior-wood');
  for(let row=0;row<3;row++){
   const yy=y+h*.25+row*h*.15;
   box(center-108,yy+h*.12,82,5,35,back+52,'#b08d63','interior-wood');
   for(let i=0;i<6;i++)box(center-100+i*11,yy+5+(i%2)*4,8,h*.1-(i%2)*4,18,back+54,['#9f6e58','#d0b88d','#657e73','#b58b64'][i%4]);
  }
  box(center-10,y+h*.72,105,7,70,-340,'#ab8458','interior-wood');
  for(const xx of [center-5,center+84])box(xx,y+h*.72+7,6,h*.18,6,-310,'#77563d','interior-wood');
  box(center+19,y+h*.65,34,8,24,-328,'#d5c29b');
  box(center+28,y+h*.76,42,48,16,-235,'#617466','interior-fabric');
 }else if(variant===2){
  // A fireplace, mirror and a floor lamp form a second salon.
  box(center-75,y+h*.53,150,9,28,back+36,'#eadcc4');
  for(const xx of [center-69,center+54])box(xx,y+h*.53+9,15,h*.29,22,back+36,'#ddcdb3');
  box(center-53,y+h*.57,106,h*.23,6,back+24,'#534b46');
  box(center-49,y+h*.13,98,h*.33,6,back+27,'#ae9066');
  box(center-43,y+h*.13+6,86,h*.33-12,4,back+32,'#a8bbb7');
  box(center+83,y+h*.43,4,h*.4,4,-350,'#a38c5d');
  box(center+65,y+h*.4,40,24,25,-350,'#f0dbad','interior-glow');
  box(center-115,y+h*.78,65,35,55,-310,'#9a705d','interior-fabric');
 }else if(variant===3){
  // Dining room: cabinet, table, chairs, crockery and framed print.
  box(center-108,y+h*.29,72,h*.46,34,back+45,'#755d4b','interior-wood');
  for(let row=0;row<3;row++){
   box(center-104,y+h*(.31+row*.13),64,4,37,back+65,'#ae9471','interior-wood');
   for(let i=0;i<3;i++)box(center-97+i*19,y+h*(.31+row*.13)-15,12,14,12,back+65,['#ded5bd','#8a9d90','#b77d63'][i]);
  }
  box(center-46,y+h*.76,120,8,80,-360,'#a0805e','interior-wood');
  for(const xx of [center-37,center+59])box(xx,y+h*.76+8,6,h*.16,7,-330,'#6e5744','interior-wood');
  box(center-26,y+h*.71,24,4,20,-350,'#e1d6bb');box(center+15,y+h*.69,9,18,9,-350,'#b99771');
  for(const xx of [center-84,center+76]){box(xx,y+h*.68,30,50,12,-270,'#706d5e','interior-wood');box(xx,y+h*.81,30,5,30,-260,'#8e8875','interior-wood');}
 }else if(variant===4){
  // Bedroom with a headboard, bedding, bedside light and wall art.
  box(center-108,y+h*.58,184,h*.20,30,-425,'#867b70','interior-fabric');
  box(center-112,y+h*.72,192,24,110,-360,'#c5b8a4','interior-fabric');
  box(center-97,y+h*.66,66,21,36,-380,'#eee3cf','interior-fabric');
  box(center-20,y+h*.66,66,21,36,-380,'#eee3cf','interior-fabric');
  box(center-108,y+h*.78,184,8,62,-300,'#8a9a91','interior-fabric');
  box(center+80,y+h*.75,42,6,32,-340,'#947958','interior-wood');
  box(center+98,y+h*.62,3,46,3,-340,'#95845e');box(center+88,y+h*.59,24,17,18,-340,'#eddbb9','interior-glow');
  box(center-45,y+h*.17,90,62,6,back+25,'#9b795d');box(center-40,y+h*.17+5,80,52,3,back+29,'#b5c1b4');
 }else{
  // Atelier: workbench, pinboard, stacked canvases and a stool.
  box(center-105,y+h*.69,200,8,70,-355,'#98785b','interior-wood');
  for(const xx of [center-97,center+80])box(xx,y+h*.69+8,7,h*.22,7,-325,'#695446','interior-wood');
  box(center-80,y+h*.21,142,h*.38,8,back+25,'#9c896e');
  for(let i=0;i<5;i++)box(center-68+i*25,y+h*(.25+(i%2)*.08),18,25,3,back+31,['#e5d4b6','#c3d0c5','#bc8d74'][i%3]);
  for(let i=0;i<3;i++)box(center+70-i*9,y+h*.43+i*8,35,h*.23,6,-420+i*12,'#d8cbb4');
  box(center+24,y+h*.63,28,16,20,-335,'#718378');
  box(center-16,y+h*.85,48,6,36,-235,'#806348','interior-wood');
  for(const xx of [center-12,center+24])box(xx,y+h*.85+6,5,24,5,-220,'#66513f','interior-wood');
 }
 // Small recurring details give each room its own silhouette.
 box(center+92,y+h*.81,25,34,26,-250,berlin?'#786964':'#aa795f');
 box(center+103,y+h*.63,3,h*.20,4,-250,'#64785e');
 for(let i=0;i<5;i++)box(center+92+(i%2)*14,y+h*(.64+i*.027),18,7,12,-250,'#798e6d');
 box(center-14,y+h*.02,28,16,20,-400,'#e5d2a9','interior-glow');
 if(s.engine)for(const mesh of s.staticMeshes.slice(begin))mesh.metadata.parisRoom=`neighbor-${id}`;
}

// A single shared interior light covers the neighbor rooms after consolidation.
export function lightNeighborInteriors(s){
 if(!s.engine)return;
 const meshes=s.staticMeshes.filter(mesh=>mesh.metadata?.parisRoom!==undefined);
 if(!meshes.length)return;
 const lamp=new s.api.HemisphericLight('paris-neighbor-light',new s.api.Vector3(-.25,1,.5),s.scene);
 const berlin=s.place?.theme==='berlin';
 lamp.diffuse=berlin?new s.api.Color3(.75,.81,1):new s.api.Color3(1,.72,.45);lamp.specular=new s.api.Color3(.55,.38,.22);
 lamp.groundColor=new s.api.Color3(.25,.16,.11);lamp.intensity=berlin?.18:.1;lamp.includedOnlyMeshes=meshes;
 s.parisNeighborLight=lamp;s.parisNeighborMeshes=meshes;
}
