// A continuous horizontal street section. y increases downwards in facade
// coordinates; z increases towards the viewer. The kerb is a real vertical drop.
export const STREET={wallZ:-110,facadeZ:-55,pavementY:1165,kerbZ:185,kerbWidth:40,fall:4,kerbHeight:22};
export const DOORSTEP={x:9,y:1156,width:171,height:12,depth:62,z:-5};
export function pavementY(z){return STREET.pavementY+STREET.fall*(z-STREET.facadeZ)/(STREET.kerbZ-STREET.facadeZ);}
export function roadY(z){return STREET.pavementY+STREET.fall+STREET.kerbHeight+(z-STREET.kerbZ-STREET.kerbWidth)*.008;}

export function streetQuad(x,width,z0,z1,height){return [[x,height(z0),z0],[x+width,height(z0),z0],[x,height(z1),z1],[x+width,height(z1),z1]];}
function surface(scene,name,x,width,z0,z1,height,color,map,kind,tile=240){
 const points=streetQuad(x,width,z0,z1,height);
 // Separate top-face UVs use x/z, unlike vertical facade UVs. The asphalt
 // grain therefore lies on the pavement and is not stretched into stripes.
 if(scene.engine){
  const B=scene.api,positions=[],uv=[],indices=[0,1,2,1,3,2];
  for(const [xx,y,z]of points){const p=scene.vec(xx,y,z);positions.push(p.x,p.y,p.z);uv.push(xx/tile,z/tile);}
  const data=new B.VertexData();data.positions=positions;data.indices=indices;data.uvs=uv;data.normals=[];B.VertexData.ComputeNormals(positions,indices,data.normals);
  const mesh=new B.Mesh(name,scene.scene);data.applyToMesh(mesh);scene.add(mesh,color,map,kind,false);
  mesh.metadata.ground=true;
 }
 // In the emergency 2D renderer the projection starts below the aperture.
 const project=([xx,y,z])=>{const distance=2900,depth=z-STREET.facadeZ,scale=distance/(distance-depth);return [620+(xx-620)*scale,1165+(y-1165)+(1165-625.5)*(scale-1)];};
 const projected=points.map(project);scene.records.push({kind:'polygon',points:[projected[0],projected[1],projected[3],projected[2]],z:500,color:kind==='road-asphalt'?'#454c52':color});
}
function graniteBlock(scene,x,width){
 const top=STREET.pavementY+STREET.fall,depth=STREET.kerbWidth;
 scene.box(x,top,width,STREET.kerbHeight,depth,STREET.kerbZ+depth/2,'#a7b0b5',scene.maps.granite.image,'road-granite',1.6);
}
// All maps are generated once locally. Their tiled grain supplies the fine
// detail without extra geometry or another animation loop.
export function createRoadMaps(){
 const size=512,make=draw=>{const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'));return {image:c};};
 let seed=93417;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const heights=new Float32Array(size*size);
 const road=make(c=>{
  const image=c.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const i=y*size+x,r=random(),n=(random()-.5)*37;
   const cloud=Math.sin(x*Math.PI*2/size+Math.sin(y*Math.PI*4/size)) * 6+Math.cos(y*Math.PI*4/size-x*Math.PI*2/size)*3;
   const grain=r>.94?19:r<.055?-23:0,value=111+cloud+n+grain;
   heights[i]=n*.7+grain;
   image.data[i*4]=value-3;image.data[i*4+1]=value;image.data[i*4+2]=value+3;image.data[i*4+3]=255;
  }c.putImageData(image,0,0);
 });
 const normal=make(c=>{
  const image=c.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const i=y*size+x,dx=heights[y*size+(x+1)%size]-heights[y*size+(x+size-1)%size],dy=heights[((y+1)%size)*size+x]-heights[((y+size-1)%size)*size+x];
   image.data[i*4]=128-dx*.85;image.data[i*4+1]=128-dy*.85;image.data[i*4+2]=248;image.data[i*4+3]=255;
  }c.putImageData(image,0,0);
 });
 const paint=make(c=>{
  c.fillStyle='#e3e2d7';c.fillRect(0,0,size,size);c.globalCompositeOperation='destination-out';
  for(let i=0;i<23000;i++){c.globalAlpha=.2+random()*.8;const r=.3+random()*1.8;c.fillRect(random()*size,random()*size,r,r);}
  c.globalAlpha=1;c.globalCompositeOperation='source-over';
 });
 const iron=make(c=>{
  const gradient=c.createLinearGradient(0,0,size,size);gradient.addColorStop(0,'#858e91');gradient.addColorStop(.5,'#5c666b');gradient.addColorStop(1,'#737c80');c.fillStyle=gradient;c.fillRect(0,0,size,size);
  c.save();c.translate(256,256);c.rotate(Math.PI/4);
  for(let n=-360;n<=360;n+=27){c.strokeStyle='#343d43';c.lineWidth=5;c.beginPath();c.moveTo(n,-360);c.lineTo(n,360);c.stroke();c.beginPath();c.moveTo(-360,n);c.lineTo(360,n);c.stroke();c.strokeStyle='#a2aaac';c.lineWidth=1;c.beginPath();c.moveTo(n+4,-360);c.lineTo(n+4,360);c.stroke();c.beginPath();c.moveTo(-360,n+4);c.lineTo(360,n+4);c.stroke();}c.restore();
  for(const radius of [244,226,201]){c.strokeStyle=radius===226?'#343d43':'#a1aaac';c.lineWidth=radius===226?9:4;c.beginPath();c.arc(256,256,radius,0,Math.PI*2);c.stroke();}
  c.fillStyle='#657075';c.fillRect(153,202,206,110);c.strokeStyle='#a5adaf';c.lineWidth=3;c.strokeRect(153,202,206,110);
  c.textAlign='center';c.textBaseline='middle';c.fillStyle='#c0c5c4';c.font='bold 23px sans-serif';c.fillText('VILLE DE',256,233);c.font='bold 37px sans-serif';c.fillText('PARIS',256,279);
  for(let i=0;i<6500;i++){c.fillStyle=random()>.5?'#d1d7d215':'#141d261c';c.fillRect(random()*size,random()*size,1+random()*2,1+random()*2);}
 });
 return {road,normal,paint,iron};
}
function polygonSurface(scene,name,points,color,map,kind,tile=240){
 if(scene.engine){
  const B=scene.api,data=new B.VertexData(),positions=[],uv=[],indices=[];
  for(const [x,z]of points){positions.push(...scene.vec(x,roadY(z)-.3,z).asArray());uv.push(x/tile,z/tile);}
  for(let i=1;i<points.length-1;i++)indices.push(0,i,i+1);
  data.positions=positions;data.indices=indices;data.uvs=uv;data.normals=[];B.VertexData.ComputeNormals(positions,indices,data.normals);const mesh=new B.Mesh(name,scene.scene);data.applyToMesh(mesh);scene.add(mesh,color,map,kind,false);
 }
}
function circularCover(scene,x,z){
 if(!scene.engine)return;
 const B=scene.api;
 for(const [name,diameter,height,lift,color,map]of [['iron-ring',114,1.2,2.6,'#89969e',null],['paris-manhole',105,.8,3.0,'#c5d0d5',scene.maps.roadIron.image]]){
  const mesh=B.MeshBuilder.CreateCylinder(name,{diameter,height,tessellation:64,subdivisions:1},scene.scene);mesh.position=scene.vec(x,roadY(z)-lift,z);if(map)mesh.rotation.y=Math.PI;scene.add(mesh,color,map,'road-iron',false);
 }
}
export function buildStreetGround(scene){
 const x=-2500,width=6200,kerbFront=STREET.kerbZ+STREET.kerbWidth;
 surface(scene,'asphalt-pavement',x,width,STREET.wallZ,STREET.kerbZ,pavementY,'#d1d0c7',scene.maps.pavement.image,'asphalt');
 surface(scene,'paris-asphalt',x,width,kerbFront,2700,roadY,'#a3b4b7',scene.maps.road.image,'road-asphalt',550);
 for(let xx=x;xx<x+width;xx+=132)graniteBlock(scene,xx,130.8);
 // Two courses of granite setts carry water alongside the kerb.
 const stones=['#9ca6aa','#abb2b0','#919da4','#b1b7b3'];
 for(let row=0;row<2;row++)for(let xx=-1500;xx<2800;xx+=44){
  const zz=kerbFront+13+row*26,index=Math.abs(Math.floor(xx/44)+row*3)%stones.length;
  scene.box(xx,roadY(zz)-.6,42.7,1.2,24.5,zz,stones[index],scene.maps.granite.image,'road-granite',.5);
 }
 surface(scene,'water-worn-gutter',x,width,kerbFront+52,kerbFront+61,z=>roadY(z)-.14,'#6b818e',scene.maps.road.image,'road-wet');
 // A restrained repair patch and its thin, irregular sealed edge.
 polygonSurface(scene,'asphalt-repair',[[310,1720],[510,1740],[536,1920],[481,1970],[324,1932],[297,1810]],'#8d9eac',scene.maps.road.image,'road-asphalt',550);
 const seam=[[270,910],[283,1030],[266,1160],[289,1280],[277,1390]];
 for(let i=1;i<seam.length;i++){const [a,b]=[seam[i-1],seam[i]];polygonSurface(scene,'sealed-joint',[[a[0]-1,a[1]],[a[0]+1,a[1]],[b[0]+1,b[1]],[b[0]-1,b[1]]],'#52606b',scene.maps.road.image,'road-asphalt',550);}
 // Small drain frames sit in the caniveau rather than floating above the road.
 for(const cx of [205,1055]){
  const z=kerbFront+29,top=roadY(z)-1;
  scene.box(cx,top,86,1.5,50,z,'#535f68',null,'road-iron',.5);
  scene.box(cx+5,top-.2,76,.6,40,z,'#202b34',null,'road-iron',.3);
  for(let i=0;i<9;i++)scene.box(cx+8+i*8,top-.8,3,.7,36,z,'#99a5aa',null,'road-iron',.2);
 }
 const cx=835,z=59,top=pavementY(z)-.35;
 scene.box(cx,top,63,1.5,57,z,'#454e49',null,'iron',.8);scene.box(cx+3,top-.25,57,.5,51,z,'#58605a',null,'iron',.4);
 for(let i=0;i<8;i++)scene.tube([[cx+7,top-.7,z-21+i*6],[cx+55,top-.7,z-21+i*6]],'#6d746b',.35,'iron');
 // Interrupted white parking lines, with chips and aggregate showing through.
 const paintY=z=>roadY(z)-.42;
 for(const side of [350,880]){
  for(let zz=1250;zz<1770;zz+=72)surface(scene,'worn-white-paint',side,9,zz,Math.min(zz+48,1770),paintY,'#f0f0e5',scene.maps.roadPaint.image,'road-paint',80);
  surface(scene,'parking-corner',side===350?350:769,120,1242,1251,paintY,'#f0f0e5',scene.maps.roadPaint.image,'road-paint',80);
 }
 // An irregular area of old granite paving remains around the service cover.
 // Shallow bevelled solids give the joints genuine relief in the foreground.
 const paving=['#56636a','#677178','#515f68','#606c73','#58676d','#657076'];
 for(let row=0;row<18;row++)for(let col=0;col<23;col++){
  const xx=250+col*32+(row%2)*16,zz=1810+row*32,cx=xx+15,cz=zz+15;
  if(((cx-620)/360)**2+((cz-2100)/292)**2>1)continue;
  let hash=Math.imul(col+17,374761393)^Math.imul(row+23,668265263);hash=Math.imul(hash^(hash>>>13),1274126177);const value=(hash>>>0)/4294967296;
  const variation=Math.floor(value*paving.length),jitter=(value-.5)*.35;
  scene.box(xx+jitter,roadY(cz)-2.5-value*.4,30.2,8,30.2,cz-jitter,paving[variation],scene.maps.granite.image,'road-granite',1.8);
  if(scene.engine)scene.staticMeshes.at(-1).metadata.cast=false;
 }
 circularCover(scene,565,2020);
 scene.box(239,1162,764,6,49,7,'#aaa79a',scene.maps.granite.image,'granite',.8);
}
