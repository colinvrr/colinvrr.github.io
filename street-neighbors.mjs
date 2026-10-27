import { FACADES, centeredBays, framedBays } from './facade-layout.mjs';
// Two fully modelled neighbours. Each has an independent construction grammar:
// brick voussoirs and steel joinery on the left, curved Art Deco bays on the right.
const stoneColors=['#c6b99f','#d3c5aa','#cbbda2','#d6c9b1'];

function polygon(scene,points,depth,z,color,map,kind='stone'){
 scene.records.push({kind:'polygon',points,z,color});
 if(!scene.engine)return;
 const B=scene.api,positions=[],indices=[],uv=[];
 const face=vertices=>{const base=positions.length/3;for(const [x,y,zz]of vertices){const v=scene.vec(x,y,zz);positions.push(v.x,v.y,v.z);uv.push(x/160,y/160);}for(let i=1;i<vertices.length-1;i++)indices.push(base,base+i,base+i+1);};
 face(points.map(([x,y])=>[x,y,z]));face([...points].reverse().map(([x,y])=>[x,y,z-depth]));
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];face([[...a,z],[...a,z-depth],[...b,z-depth],[...b,z]]);}
 const data=new B.VertexData();data.positions=positions;data.indices=indices;data.uvs=uv;data.normals=[];for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];B.VertexData.ComputeNormals(positions,indices,data.normals);const mesh=new B.Mesh('cut-arch-stone',scene.scene);data.applyToMesh(mesh);scene.add(mesh,color,map,kind);
}
function leftArch(scene,x,y,w,h){
 const r=w/2,cy=y+r,cx=x+r,stone=scene.maps.stone.image;
 const glass=[[x,y+h],[x+w,y+h],[x+w,cy]];for(let i=1;i<=32;i++){const a=i/32*Math.PI;glass.push([cx+Math.cos(a)*r,cy-Math.sin(a)*r]);}
 polygon(scene,glass,7,-36,'#314349',null,'glass');
 for(let i=0;i<19;i++){
  const a=i/19*Math.PI+.012,b=(i+1)/19*Math.PI-.012,ra=r+18;
  const point=(radius,t)=>[cx+Math.cos(t)*radius,cy-Math.sin(t)*radius];
  polygon(scene,[point(r,a),point(ra,a),point(ra,b),point(r,b)],24,-8,stoneColors[i%4],stone);
 }
 for(const xx of [x-17,x+w])scene.box(xx,cy,17,h-r,23,-20,'#cabb9f',stone);
 const arc=[];for(let i=0;i<=50;i++){const a=i/50*Math.PI;arc.push([cx+Math.cos(a)*(r-5),cy-Math.sin(a)*(r-5),-13]);}scene.tube(arc,'#333d3b',2.3);
 scene.tube([[x+5,cy,-13],[x+5,y+h-5,-13],[x+w-5,y+h-5,-13],[x+w-5,cy,-13]],'#333d3b',2.2);
 for(const fraction of [1/3,2/3]){const xx=x+w*fraction,top=cy-Math.sqrt((r-5)**2-(xx-cx)**2);scene.tube([[xx,top,-11],[xx,y+h-5,-11]],'#303b37',1.8);}
 for(const yy of [cy+18,y+h*.65])scene.tube([[x+5,yy,-11],[x+w-5,yy,-11]],'#35413c',1.8);
 scene.cornice(x-23,y+h,w+46,[[0,-21],[4,4],[10,7],[15,-2],[20,-19]],'#c9baa0');
}
export function buildBrickNeighbor(scene){
 const {x,width:w}=FACADES.brick,random=()=>{let v=Math.sin(++scene.neighborSeed*78.233)*43758.5453;return v-Math.floor(v);};
 const colors=['#8e5541','#9a6048','#a56b51','#935a44','#ab7257','#86513f','#9d674e'];
 const bays=centeredBays(FACADES.brick,3,203).flatMap(xx=>[{x:xx,y:75,w:203,h:330},{x:xx,y:700,w:203,h:442}]);
 scene.box(x,0,w,1165,53,-89,'#776758',null,'stone');
 for(let row=0;row<58;row++){
  const yy=row*20.1;for(let col=0;col<22;col++){
   const xx=x+col*51+(row%2)*25.5;if(xx>=-45)continue;
   let parts=[[xx,yy,Math.min(49.5,-45-xx),18.8]];
   for(const bay of bays){const y=yy+9;if(y<bay.y||y>bay.y+bay.h)continue;const r=bay.w/2,cy=bay.y+r,half=y<cy?Math.sqrt(Math.max(0,r*r-(y-cy)**2)):r,a=bay.x+r-half,b=bay.x+r+half;
    parts=parts.flatMap(([l,t,width,height])=>{const right=l+width;if(b<=l||a>=right)return [[l,t,width,height]];return [[l,t,Math.max(0,a-l),height],[b,t,Math.max(0,right-b),height]].filter(p=>p[2]>.4);});
   }
   for(const [l,t,width,height]of parts)scene.box(l,t,width,height,23,-52+(random()-.5)*.6,colors[Math.floor(random()*colors.length)],scene.maps.stone.image,'stone',.55);
  }
 }
 for(const bay of bays)leftArch(scene,bay.x,bay.y,bay.w,bay.h);
 // Limestone bands, a brick parapet and a contrasting rusticated party pier.
 for(const yy of [15,444,641])scene.cornice(x,yy,w,[[0,-45],[5,-18],[10,-14],[17,-22],[22,-40]],'#cdbb9f');
 for(let row=0;row<15;row++)scene.box(-80,row*78,35,76,43,-21,row%3?'#cabba2':'#d1c3aa',scene.maps.stone.image,'stone',1);
 scene.box(x,1144,w,22,31,-28,'#a79d86',scene.maps.stone.image,'stone',1);
 // Cast iron downpipe and wall straps, all in volume.
 scene.tube([[-99,0,9],[-99,441,9],[-110,465,15],[-110,1139,15]],'#41453b',4.1,'iron');
 for(const yy of [120,390,725,1050]){scene.box(-116,yy,13,5,6,17,'#666552',null,'iron',.8);scene.box(-102,yy-2,5,8,4,22,'#6f705d',null,'iron',.8);}
}

function curvedBand(scene,x,y,w,h,projection,color,kind='stone'){
 const B=scene.api;if(!scene.engine){scene.box(x,y,w,h,20,8,color,null,kind);return;}
 const positions=[],indices=[],uv=[],n=36;
 const surface=(a,b,c,d)=>{const start=positions.length/3;for(const [xx,yy,z]of [a,b,c,d]){const v=scene.vec(xx,yy,z);positions.push(v.x,v.y,v.z);uv.push(xx/200,yy/200);}indices.push(start,start+2,start+1,start+1,start+2,start+3);};
 for(let i=0;i<n;i++){
  const u=i/n,v=(i+1)/n,a=x+w*u,b=x+w*v,za=-22+Math.sin(u*Math.PI)*projection,zb=-22+Math.sin(v*Math.PI)*projection;
  surface([a,y,za],[b,y,zb],[a,y+h,za],[b,y+h,zb]);
  surface([a,y,-54],[b,y,-54],[a,y,za],[b,y,zb]);
  surface([a,y+h,za],[b,y+h,zb],[a,y+h,-54],[b,y+h,-54]);
 }
 const data=new B.VertexData();data.positions=positions;data.indices=indices;data.uvs=uv;data.normals=[];for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];B.VertexData.ComputeNormals(positions,indices,data.normals);const mesh=new B.Mesh('curved-art-deco-band',scene.scene);data.applyToMesh(mesh);scene.add(mesh,color,null,kind);
}
function bowWindow(scene,x,y,w,h){
 const color='#394e51',projection=69;
 curvedBand(scene,x,y,w,h,projection,color,'glass');
 for(const [yy,hh,c]of [[y-16,13,'#d1cfbe'],[y+h,15,'#c5c4b5'],[y+h+17,7,'#aeb3a5']])curvedBand(scene,x-8,yy,w+16,hh,76,c);
 for(const yy of [y+7,y+h*.47,y+h-7]){const line=[];for(let i=0;i<=40;i++){const u=i/40;line.push([x+w*u,yy,-19+Math.sin(u*Math.PI)*projection]);}scene.tube(line,'#a5b2a7',1.6,'steel');}
 for(let i=0;i<=6;i++){const u=i/6,xx=x+w*u,z=-19+Math.sin(u*Math.PI)*projection;scene.tube([[xx,y,z],[xx,y+h,z]],'#a4b0a5',2,'steel');}
 // Horizontal, tubular Art Deco balustrade, visually distinct from the iron scrolls.
 const railY=y+h-54;for(const yy of [railY,railY+14,railY+28,railY+42]){const line=[];for(let i=0;i<=40;i++){const u=i/40;line.push([x-7+(w+14)*u,yy,-9+Math.sin(u*Math.PI)*90]);}scene.tube(line,'#4d5b53',1.6,'iron');}
 for(const u of [.03,.25,.5,.75,.97]){const xx=x-7+(w+14)*u,z=-9+Math.sin(u*Math.PI)*90;scene.tube([[xx,railY-2,z],[xx,railY+48,z]],'#4e5b52',1.8,'iron');}
}
export function buildDecoNeighbor(scene){
 const {x,width:w}=FACADES.deco,layout=framedBays(FACADES.deco,3,212,43);
 scene.box(x,0,w,1165,60,-81,'#c6c8bb',null,'stone',1.2);
 // Stepped vertical piers and shallow flutes are architectural solids.
 for(const xx of layout.piers){
  scene.box(xx,0,43,1145,38,-31,'#d9d9c8',null,'stone',1.6);
  for(let i=0;i<4;i++)scene.box(xx+7+i*8,25,2,1066,5,-7,'#b6baab',null,'stone',.3);
  scene.box(xx-4,459,51,37,47,-16,'#d3d2bf',null,'stone',2);
 }
 for(const yy of [12,418,596,1160])scene.cornice(x,yy,w,[[0,-29],[5,-4],[13,1],[20,-4],[26,-29]],'#d3d3c2',null);
 for(const xx of layout.windows){
  bowWindow(scene,xx,64,212,308);
  bowWindow(scene,xx,706,212,429);
  // Fluted spandrel and a geometric fan, with no borrowed Haussmann ornament.
  scene.box(xx+22,477,168,104,13,-37,'#bfc3b4',null,'stone',1.1);
  for(let i=0;i<9;i++)scene.box(xx+36+i*16,490,3,74,4,-28,'#aeb5a5',null,'stone',.4);
  for(let i=0;i<7;i++){const offset=(i-3)*17;scene.tube([[xx+106,658,-15],[xx+106+offset,627,-15]],'#9ea995',1.5,'stone');}
 }
 // A stone plinth gives the two neighbours the same pavement datum.
 scene.box(x,1144,w,21,35,-25,'#a3aa9b',null,'stone',1);
}
export function buildNeighbors(scene){scene.neighborSeed=83;buildBrickNeighbor(scene);buildDecoNeighbor(scene);}
