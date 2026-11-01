import {buildNeighborInterior} from './neighbor-interiors.mjs';
// Berlin-inspired industrial courtyard. All masonry, steelwork and windows
// are geometry; signs and wear are small locally drawn material maps.
const BRICK=['#73564b','#80604f','#674f46','#89654f','#775b4d','#916d56'];
const PASTEL=['#616c7e','#74627c','#916c83','#986e6a','#9a8a78','#a29b7f','#7f9477'];
export function subtractOpening(rect,hole){
 const [x,y,w,h]=rect,[a,b,c,d]=hole,l=Math.max(x,a),r=Math.min(x+w,a+c),t=Math.max(y,b),bt=Math.min(y+h,b+d);
 if(r<=l||bt<=t)return [rect];
 return [[x,y,w,t-y],[x,bt,w,y+h-bt],[x,t,l-x,bt-t],[r,t,x+w-r,bt-t]].filter(p=>p[2]>.3&&p[3]>.3);
}
function wall(s,x,y,w,h,holes=[],brick=true){
 let backing=[[x,y,w,h]];for(const hole of holes)backing=backing.flatMap(p=>subtractOpening(p,hole));
 for(const p of backing)s.box(...p,58,-94,brick?'#5d5a55':'#8d918e',s.maps.stone.image,'stone',.8);
 if(!brick){
  for(let yy=y+18;yy<y+h;yy+=188)for(let xx=x+12;xx<x+w;xx+=218){
   let panels=[[xx,yy,Math.min(216,x+w-xx),Math.min(186,y+h-yy)]];
   for(const hole of holes)panels=panels.flatMap(p=>subtractOpening(p,hole));
   for(const p of panels)s.box(...p,7,-59,'#858b89',s.maps.stone.image,'stone',.7);
  }return;
 }
 for(let row=0;row<Math.ceil(h/23);row++)for(let col=-1;col<Math.ceil(w/57);col++){
  const xx=Math.max(x,x+col*57+(row%2)*28.5),right=Math.min(x+w,x+col*57+(row%2)*28.5+55.5),yy=y+row*23;
  if(right-xx<.4)continue;
  let parts=[[xx,yy,right-xx,Math.min(21.3,y+h-yy)]];
  for(const hole of holes)parts=parts.flatMap(p=>subtractOpening(p,hole));
  for(const p of parts)s.box(...p,24,-51,BRICK[(row*17+col*11+660)%BRICK.length],s.maps.stone.image,'stone',.65);
 }
}
function factoryWindow(s,x,y,w,h,columns=4,rows=3,reactive=false){
 if(reactive)s.box(x,y,w,h,10,-100,'#202d34',null,'iron',.7);
 else buildNeighborInterior(s,{x,y,w,h},s.neighborRoom++,{berlin:true});
 s.frame(x-8,y-8,w+16,h+16,-26,9,'#30363f',s.maps.steel.image,'steel');
 const cw=w/columns,rh=h/rows;
 for(let c=0;c<columns;c++)for(let r=0;r<rows;r++){
  const px=x+c*cw+5,py=y+r*rh+5;
  s.box(px,py,cw-10,rh-10,3,-40,reactive?PASTEL[c]:((c+r)%4===0?'#4c5966':(c+r)%3===0?'#34404b':'#424e59'),null,'glass',.2);
  if(reactive&&s.engine){
   const pane=s.staticMeshes.at(-1),material=pane.material.clone(`techno-window-${c}-${r}`);material.emissiveColor=new s.api.Color3(0,0,0);pane.material=material;
   (s.windowPanes??=[]).push({material,column:c,row:r});
  }
  if(reactive){
   // A three-dimensional light fixture sits behind each transparent pane.
   s.box(px+8,py+rh*.30,cw-26,rh*.32,8,-84,'#202c31',null,'interior-dark',.3);
   s.box(px+13,py+rh*.42,cw-36,Math.max(5,rh*.08),5,-77,'#78a8ae',null,'studio-neon',.2);
   if(s.engine){
    const bar=s.staticMeshes.at(-1),material=bar.material.clone(`techno-fixture-${c}-${r}`);
    material.emissiveColor=new s.api.Color3(0,0,0);bar.material=material;
    (s.windowPanes??=[]).push({material,column:c,row:r,fixture:true});
   }
  }
  s.box(px+4,py+5,2,rh-21,1,-37,'#7e9298',null,'steel',.1);
 }
 for(let c=1;c<columns;c++)s.box(x+c*cw-3,y,6,h,18,-16,'#2c383c',null,'steel',.4);
 for(let r=1;r<rows;r++)s.box(x,y+r*rh-3,w,6,18,-16,'#2c383c',null,'steel',.4);
 s.box(x-15,y+h+4,w+30,12,34,-4,'#737a79',s.maps.stone.image,'stone',1);
}
function paintedMap(draw,w=768,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return c;}
function tag(s,x,y,w,h,seed=0){
 const image=paintedMap((c,W,H)=>{
  c.strokeStyle=seed%2?'#91a29a':'#c2bbb0';c.lineWidth=6;c.lineCap='round';c.lineJoin='round';
  for(let n=0;n<7;n++){const xx=32+n*91;c.beginPath();c.moveTo(xx,H*.8);c.bezierCurveTo(xx+30,18,xx+90,27,xx+58,H*.73);c.lineTo(xx+3,H*.44);c.lineTo(xx+88,H*.27);c.stroke();}
  c.lineWidth=3;c.beginPath();c.moveTo(28,H*.87);c.bezierCurveTo(W*.4,H*.7,W*.63,H*1.04,W-25,H*.72);c.stroke();
 });s.plane(x,y,w,h,-24,image);
}
function posters(s,x,y){
 const sheets=[['NACHT','RAUM','#b7bdac'],['02','LIVE','#b6a0a6'],['KLANG','WERK','#b4b7ac']];
 for(let i=0;i<sheets.length;i++){
  const [a,b,paper]=sheets[i],image=paintedMap((c,w,h)=>{c.fillStyle=paper;c.fillRect(0,0,w,h);c.fillStyle='#2a3133';c.font='900 62px sans-serif';c.textAlign='center';c.fillText(a,w/2,95);c.font='bold 42px sans-serif';c.fillText(b,w/2,153);for(let j=0;j<12;j++)c.fillRect(36,183+j*4,w-72-(j%4)*12,1);},256,256);
  s.box(x+i*46,y+(i%2)*13,58,83,2,-28,'#888b80',null,'stone',.2);s.plane(x+i*46+1,y+(i%2)*13+1,56,81,-25,image);
 }
}
function pipe(s,x){
 s.tube([[x,0,-4],[x,466,-4],[x+12,500,4],[x+12,1150,4]],'#485456',4.5,'iron');
 for(const y of [132,411,736,1060])s.box(x-8,y,26,6,11,6,'#697271',null,'steel',.6);
}
function berlinStreetFurniture(s){
 // Slender Berlin courtyard lamp, with a visible emitter and real point light.
 const steel='#3b474b',dark='#202b30';
 s.tube([[1080,760,72],[1080,1160,72]],steel,7,'steel');
 s.tube([[1080,774,72],[1031,774,72],[1015,792,72]],steel,5,'steel');
 s.box(1008,792,34,12,22,72,dark,null,'steel',1);
 s.box(1013,797,24,4,12,72,'#b7ff9a',null,'interior-glow',1);
 if(s.engine){
  const B=s.api,bulb=B.MeshBuilder.CreateSphere('berlin-street-lamp-bulb',{diameter:18,segments:12},s.scene);
  bulb.position=s.vec(1018,803,72);s.add(bulb,'#b7ff9a',null,'interior-glow',false);
  const light=new B.HemisphericLight('berlin-street-lamp-light',new B.Vector3(0,-1,0),s.scene);s.berlinLampLight=light;s.berlinLampBulb=bulb;
  light.diffuse=new B.Color3(.55,1,.42);light.groundColor=new B.Color3(.04,.08,.04);light.intensity=.14;light.includedOnlyMeshes=[bulb];
  }
  s.box(1072,1156,17,8,17,72,dark,null,'steel',1);
}
export function buildBerlinNeighbors(s){
 s.neighborRoom=0;
 const leftWindows=[[-1190,70,355,345],[-720,70,355,345],[-1190,690,355,435],[-720,690,355,435]];
 wall(s,-1350,0,1305,1165,leftWindows,false);
 for(const p of leftWindows)factoryWindow(s,...p,4,4);
 for(const y of [445,628])s.box(-1350,y,1305,25,35,-31,'#555f61',null,'stone',1);
 // A projecting fire escape: walkway, railings, ladder and steel brackets.
 s.box(-1140,518,910,13,94,31,'#475356',null,'steel',1);
 for(const y of [445,472,500])s.tube([[-1140,y,80],[-230,y,80]],'#343f44',2.1,'steel');
 for(let x=-1130;x<-210;x+=72)s.tube([[x,443,80],[x,520,80],[x,560,-39]],'#39464a',2.1,'steel');
 for(const x of [-326,-273])s.tube([[x,475,83],[x,1154,83]],'#414e53',3,'steel');
 for(let y=493;y<1148;y+=29)s.tube([[-326,y,83],[-273,y,83]],'#526064',2,'steel');
 tag(s,-1130,960,320,115,1);posters(s,-184,875);pipe(s,-90);
 const rightWindows=[[1240,65,430,400],[1815,65,430,400]];
 wall(s,1115,0,1400,1165,rightWindows,true);for(const p of rightWindows)factoryWindow(s,...p,5,4);
 for(const x of [1120,1710,2340])s.box(x,0,40,1165,50,-18,'#7c8381',s.maps.stone.image,'stone',1.3);
 s.box(1220,684,470,470,32,-40,'#303b40',null,'steel',1);
 for(let y=698;y<1150;y+=17)s.box(1230,y,450,5,12,-18,'#4a5659',s.maps.steel.image,'steel',.7);
 s.frame(1210,674,490,490,-4,13,'#626c6c',null,'steel');
 tag(s,1260,818,380,152);tag(s,1830,766,400,155,1);posters(s,1825,1025);pipe(s,2390);
}
export function buildBerlinFacade(s){
 wall(s,-45,0,1160,1165,[[118,64,890,360],[7,710,176,453],[240,685,760,480]],true);
 factoryWindow(s,118,64,890,360,7,3,true);
 for(const x of [-45,199,1049])s.box(x,0,x===199?25:42,1165,42,-15,'#777974',s.maps.stone.image,'stone',1);
 for(const y of [454,638])s.box(-45,y,1160,28,46,-13,'#525e60',null,'steel',1.2);
 for(const y of [460,644])for(let x=-20;x<1100;x+=76)s.box(x,y,6,6,4,12,'#a4aaa3',null,'steel',1.7);
 // Side service door and a deep exposed steel opening around the DJ booth.
 s.box(7,710,176,453,18,-64,'#263338',null,'steel',1);
 for(let y=724;y<1155;y+=24)s.box(16,y,158,3,8,-47,'#3d494d',null,'steel',.5);
 s.frame(0,699,190,467,-13,10,'#4c595a',null,'steel');s.box(151,908,5,36,14,-10,'#b2b6aa',null,'steel',1);
 s.frame(229,674,782,491,19,14,'#39464a',null,'steel');
 const sign=paintedMap((c,w,h)=>{c.fillStyle='#11171b';c.fillRect(0,0,w,h);c.strokeStyle='#6e7979';c.lineWidth=5;c.strokeRect(7,7,w-14,h-14);c.fillStyle='#d9d8c8';c.font='900 87px Arial, sans-serif';c.textAlign='center';c.fillText('HINTERHOF 02',w/2,118);c.font='bold 29px Arial, sans-serif';c.fillStyle='#9cacac';c.fillText('BERLIN  ·  KLANG / RAUM',w/2,184);},1024,256);
 s.box(269,498,704,133,20,1,'#29353a',null,'steel',2);s.plane(278,503,686,121,13,sign);
 posters(s,17,573);tag(s,268,443,270,47,1);pipe(s,1087);
 // Restrained violet light bars; no bloom or extra animation loop.
 for(const x of [217,1018])s.box(x,723,4,335,9,40,'#d6b98e',null,'interior-glow',.6);
 for(const y of [454,638])for(let i=0;i<40;i++){
  const x=-28+i*28; s.box(x,y+3+(i*7)%18,8+(i*13)%23,2+(i%3),.5,11,i%3?'#42434a':'#85776b',null,'stone',.1);
 }
 for(const x of [-45,199,1049])for(let i=0;i<19;i++)s.box(x+4+(i*9)%17,33+i*59,8+(i%3)*3,12+(i*7)%31,.5,7,i%2?'#5b5c59':'#666360',null,'stone',.1);
 berlinStreetFurniture(s);
 s.canvas.dataset.architecture='berlin-industrial';
}
