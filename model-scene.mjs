import {buildApartment, ApartmentDJ} from './apartment-scene.mjs?v=31';
import * as B from './vendor/babylon.min.js';
import { buildNeighbors } from './street-neighbors.mjs?v=18';
import { FACADES, centeredBays } from './facade-layout.mjs';
import { buildStreetGround, DOORSTEP, createRoadMaps } from './street-ground.mjs?v=30';
import { StreetCat } from './cat-visitor.mjs?v=22';

// All architecture is real geometry. Coordinates are centimetre-like facade
// units; the audiovisual opening remains exactly aligned with the 2D player.
export const FRAME={width:1240,height:1251};
export const APERTURE={x:243,y:689,width:756,height:474};
const W=FRAME.width,H=FRAME.height,OPEN=APERTURE,BLADES=30;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rng(seed=9182){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function texture(width,height,draw){const c=document.createElement('canvas');c.width=width;c.height=height;draw(c.getContext('2d'),width,height);return {image:c};}
function grit(ctx,w,h,seed,amount=1200){const r=rng(seed);for(let i=0;i<amount;i++){ctx.fillStyle=r()>.5?`rgba(255,255,255,${r()*.09})`:`rgba(22,19,15,${r()*.08})`;ctx.fillRect(r()*w,r()*h,.4+r()*2,.4+r()*1.5);}}
function materialMaps(){
 const stone=texture(512,512,(c,w,h)=>{c.fillStyle='#e2ddd0';c.fillRect(0,0,w,h);const r=rng(101);for(let i=0;i<300;i++){const x=r()*w,y=r()*h,rad=8+r()*60,g=c.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,`rgba(101,94,76,${.018+r()*.065})`);g.addColorStop(1,'#746d5b00');c.fillStyle=g;c.fillRect(x-rad,y-rad,rad*2,rad*2);}grit(c,w,h,21,54000);for(let i=0;i<1200;i++){const x=r()*w,y=r()*h;c.fillStyle='rgba(75,68,49,.12)';c.fillRect(x,y,.5+r()*1.6,.3+r()*.7);c.fillStyle='rgba(255,251,233,.15)';c.fillRect(x,y+.7,.6,.5);}});
 const normal=texture(512,512,(c,w,h)=>{c.fillStyle='#8080ff';c.fillRect(0,0,w,h);const r=rng(210);for(let i=0;i<26000;i++){const x=r()*w,y=r()*h;c.fillStyle=`rgb(${114+r()*27},${114+r()*27},253)`;c.fillRect(x,y,1+r()*2,1+r()*2);}});
 const wood=texture(256,1024,(c,w,h)=>{c.fillStyle='#6a4a35';c.fillRect(0,0,w,h);const r=rng(41);for(let i=0;i<600;i++){const x=r()*w;c.strokeStyle=`rgba(${r()>.5?'189,141,93':'29,16,9'},${.03+r()*.1})`;c.lineWidth=.3+r()*.7;c.beginPath();c.moveTo(x,0);for(let y=0;y<=h;y+=24)c.lineTo(x+Math.sin(y*.011+i)*(.3+r()*1.7),y);c.stroke();}grit(c,w,h,19,8000);});
 const steel=texture(1024,96,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);for(const [p,col]of [[0,'#727c7c'],[.08,'#b9bfba'],[.2,'#a3aaa5'],[.63,'#959d99'],[.87,'#858e8a'],[.96,'#626e6b'],[1,'#b1b7b0']])g.addColorStop(p,col);c.fillStyle=g;c.fillRect(0,0,w,h);grit(c,w,h,81,14000);const r=rng(95);for(let i=0;i<260;i++){c.strokeStyle=`rgba(34,43,39,${r()*.13})`;c.lineWidth=.4;c.beginPath();const x=r()*w,y=r()*h;c.moveTo(x,y);c.lineTo(x+r()*85,y+r()*1.4);c.stroke();}});
 const fabric=texture(1024,256,(c,w,h)=>{c.fillStyle='#8d2731';c.fillRect(0,0,w,h);const r=rng(33);for(let i=0;i<w;i+=2){c.strokeStyle=i%8?'#c6716c16':'#2c0c161d';c.beginPath();c.moveTo(i,0);c.lineTo(i,h);c.stroke();}for(let y=0;y<h;y+=2){c.fillStyle='#e9b0a70b';c.fillRect(0,y,w,.6);}grit(c,w,h,32,12000);for(let i=0;i<30;i++){const x=r()*w;c.fillStyle='#e4b2a505';c.fillRect(x,0,5+r()*12,h);}});
 const asphalt=(seed,base,aggregate)=>texture(512,512,(c,w,h)=>{
  const r=rng(seed),data=c.createImageData(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4,n=(r()-.5)*aggregate,cloud=Math.sin(x*.017+Math.sin(y*.011))*1.2+Math.sin(y*.027+x*.009)*.7;
   data.data[i]=base+n+cloud;data.data[i+1]=base+2+n+cloud;data.data[i+2]=base-1+n+cloud;data.data[i+3]=255;
  }c.putImageData(data,0,0);
 });
 const pavement=asphalt(409,94,13),roadMaps=createRoadMaps(),road=roadMaps.road;
 const granite=texture(512,512,(c,w,h)=>{c.fillStyle='#c0c2ba';c.fillRect(0,0,w,h);const r=rng(628);for(let i=0;i<48000;i++){const bright=r()>.52;c.fillStyle=bright?`rgba(241,242,229,${.12+r()*.3})`:`rgba(50,57,53,${.08+r()*.3})`;const x=r()*w,y=r()*h;c.fillRect(x,y,.6+r()*2,.5+r()*1.5);}});
 return {stone,normal,wood,steel,fabric,pavement,road,granite,roadNormal:roadMaps.normal,roadPaint:roadMaps.paint,roadIron:roadMaps.iron};
}
function guide(y){if(y>=22)return y;if(y<=0)return 0;return y*y*(44-y)/(22*22);}
export function bladePlacement(index,progress,count=BLADES){const t=clamp(progress,0,1),e=t*t*(3-2*t),pitch=OPEN.height/count,lift=(OPEN.height+32)*e,top=index*pitch-lift,bottom=top+pitch,a=guide(top),b=guide(bottom);return {y:OPEN.y+(a+b)/2,height:Math.max(0,b-a),pitch,visible:b-a>.08,fold:1-clamp((b-a)/pitch,0,1)};}

// Chamfered solids, rather than stacked flat rectangles. Four octagonal rings
// make the front face, edge bevel, side walls and rear bevel of each stone.
function outwardNormals(positions,indices,normals){for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];B.VertexData.ComputeNormals(positions,indices,normals);}
function dressedBox(w,h,d,b){
 b=Math.min(b,w/4,h/4,d/3);const positions=[],indices=[],uv=[];
 const ring=(inset,z)=>{const x=w/2-inset,y=h/2-inset,c=Math.max(.01,b-inset*.5);return [[-x+c,y], [x-c,y],[x,y-c],[x,-y+c],[x-c,-y],[-x+c,-y],[-x,-y+c],[-x,y-c]].map(([x,y])=>[x,y,z]);};
 const rings=[ring(b,d/2),ring(0,d/2-b),ring(0,-d/2+b),ring(b,-d/2)];
 const face=points=>{const start=positions.length/3;for(const [x,y,z]of points){positions.push(x,y,z);uv.push((x+w/2)/w,(y+h/2)/h);}for(let i=1;i<points.length-1;i++)indices.push(start,start+i+1,start+i);};
 face(rings[0]);face([...rings[3]].reverse());for(let r=0;r<3;r++)for(let i=0;i<8;i++){const j=(i+1)%8;face([rings[r][i],rings[r+1][i],rings[r+1][j],rings[r][j]]);}
 const data=new B.VertexData();data.positions=positions;data.indices=indices;data.uvs=uv;data.normals=[];outwardNormals(positions,indices,data.normals);return data;
}

export class StreetScene {
 constructor(canvas,windowElement,place,{frameElement=canvas,engine:sharedEngine}={}){
  this.frameElement=frameElement;
  this.api=B;this.canvas=canvas;this.canvas.dataset.ready='false';this.window=windowElement;this.place=place;this.progress=0;this.records=[];this.blades=[];this.staticMeshes=[];this.textureCache=new Map();this.matCache=new Map();this.mapIds=new WeakMap();this.nextMapId=0;this.disposed=false;this.maps=materialMaps();this.paintCanvas=graffitiTexture().image;
  try{
   this.engine=sharedEngine||new B.Engine(canvas,true,{alpha:true,preserveDrawingBuffer:true,stencil:false});
   this.scene=new B.Scene(this.engine);this.scene.useRightHandedSystem=true;this.scene.clearColor=new B.Color4(0,0,0,0);this.scene.ambientColor=new B.Color3(.13,.14,.16);
   this.scene.imageProcessingConfiguration.toneMappingEnabled=true;this.scene.imageProcessingConfiguration.toneMappingType=B.ImageProcessingConfiguration.TONEMAPPING_ACES;this.scene.imageProcessingConfiguration.exposure=1.12;this.scene.imageProcessingConfiguration.contrast=1.08;
   this.camera=new B.FreeCamera('fixed-front',new B.Vector3(0,0,3000),this.scene);this.camera.setTarget(B.Vector3.Zero());this.camera.mode=B.Camera.PERSPECTIVE_CAMERA;this.camera.fov=.43;this.camera.position.z=H/(2*Math.tan(this.camera.fov/2))+33;this.camera.minZ=10;this.camera.maxZ=6500;
   const sky=new B.HemisphericLight('soft-sky',new B.Vector3(-.3,1,.4),this.scene);sky.intensity=.44;sky.diffuse=new B.Color3(.86,.79,.83);sky.groundColor=new B.Color3(.36,.27,.22);
   const sun=new B.DirectionalLight('late-afternoon',new B.Vector3(.7,-.38,-1),this.scene);sun.position=new B.Vector3(-650,1400,1800);sun.intensity=3.05;sun.diffuse=new B.Color3(1,.52,.20);sun.shadowMinZ=100;sun.shadowMaxZ=4300;sun.shadowFrustumSize=3400;
   this.shadows=new B.ShadowGenerator(2048,sun);this.shadows.useContactHardeningShadow=true;this.shadows.contactHardeningLightSizeUVRatio=.045;this.shadows.filteringQuality=B.ShadowGenerator.QUALITY_MEDIUM;this.shadows.bias=.0002;this.shadows.normalBias=.45;this.shadows.setDarkness(.18);
   this.environment=this.createEnvironment();
  }catch(error){this.scene?.dispose();this.engine?.dispose();this.engine=null;this.setupCanvas();}
  this.canvas.dataset.renderer=this.engine?'modeled-pbr':'canvas2d';this.canvas.dataset.lighting='winter-golden-hour';this.build();this.cat=new StreetCat(this);this.dj=place?.model==='groundfloor-apartment'?new ApartmentDJ(this):null;this.canvas.dataset.performer=this.dj?'dj':'none';this.canvas.dataset.djTime='0';
  this.onLost=event=>{event.preventDefault();this.switchToCanvas();};this.canvas.addEventListener('webglcontextlost',this.onLost);
  this.observer=new ResizeObserver(()=>this.resize());this.observeLayout();this.resize();
  this.ready=new Promise(resolve=>{const finish=()=>{if(!this.disposed){this.render();if(this.engine)this.shadows.getShadowMap().refreshRate=0;this.canvas.dataset.ready='true';}resolve();};if(this.engine)this.scene.executeWhenReady(finish);else finish();});
 }
 setupCanvas(){let ctx=this.canvas.getContext('2d',{alpha:true});if(!ctx){const replacement=this.canvas.cloneNode(false);this.canvas.replaceWith(replacement);if(this.frameElement===this.canvas)this.frameElement=replacement;this.canvas=replacement;ctx=replacement.getContext('2d',{alpha:true});}this.ctx=ctx;}
 vec(x,y,z){return new B.Vector3(x-W/2,H/2-y,z);}
 createEnvironment(){
  // Small generated sky/street cubemap: local, no HDR download or backdrop image.
  const n=128,faces=[];for(let f=0;f<6;f++){const pixels=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){
   let up=f===2?1:f===3?0:1-y/(n-1);let glow=Math.exp(-(((x/n-.25)/.3)**2+((y/n-.3)/.4)**2));const k=(y*n+x)*4;
   const lo=[76,59,49],hi=[235,164,105];let building=0;if(f!==2&&f!==3&&y/n>.32+(Math.floor(x/27)%3)*.09){const wx=x%27,wy=y%26;building=wx>7&&wx<17&&wy>5&&wy<20?-47:13;}for(let c=0;c<3;c++)pixels[k+c]=clamp(lo[c]*(1-up)+hi[c]*up+glow*[29,14,5][c]+building,0,255);pixels[k+3]=255;
  }faces.push(pixels);}const tex=new B.RawCubeTexture(this.scene,faces,n,B.Engine.TEXTUREFORMAT_RGBA,B.Engine.TEXTURETYPE_UNSIGNED_BYTE,true,false,B.Texture.TRILINEAR_SAMPLINGMODE);tex.name='procedural-sky';tex.coordinatesMode=B.Texture.CUBIC_MODE;return tex;
 }
 texture(image){if(!this.engine||!image)return null;if(this.textureCache.has(image))return this.textureCache.get(image);const tex=new B.DynamicTexture('local-surface',{width:image.width,height:image.height},this.scene,true);tex.getContext().drawImage(image,0,0);tex.hasAlpha=true;tex.anisotropicFilteringLevel=8;tex.update(true);this.textureCache.set(image,tex);return tex;}
 mat(color,map,kind='stone'){
  if(!this.engine)return null;
  if(this.place?.model==='groundfloor-apartment'&&kind==='wood')color=({'#343e3d':'#344c50','#b5b4a7':'#71908b','#c5c3b6':'#b7c4bc','#cfcdc0':'#9aac9f','#b8b9ae':'#8a9e95'})[color]||color;
  if(map&&!this.mapIds.has(map))this.mapIds.set(map,++this.nextMapId);const key=color+':'+(map?this.mapIds.get(map):'')+':'+kind;if(this.matCache.has(key))return this.matCache.get(key);
  let m;
  if(kind==='interior-glass'){m=new B.StandardMaterial('apartment-glass',this.scene);m.diffuseColor=B.Color3.FromHexString(color);m.alpha=.1;m.specularColor=new B.Color3(.5,.6,.6);m.specularPower=96;m.disableDepthWrite=true;m.transparencyMode=B.StandardMaterial.MATERIAL_ALPHABLEND;}
  else if(kind==='ink'){m=new B.StandardMaterial('spray-paint',this.scene);m.diffuseColor=B.Color3.FromHexString(color);m.specularColor=B.Color3.Black();m.diffuseTexture=this.texture(map);m.useAlphaFromDiffuseTexture=true;m.diffuseTexture.hasAlpha=true;m.transparencyMode=B.StandardMaterial.MATERIAL_ALPHABLEND;m.disableDepthWrite=true;m.zOffset=-1;m.alpha=.67;}
  else {m=new B.PBRMaterial(kind,this.scene);m.albedoColor=B.Color3.FromHexString(color);m.metallic=({steel:.78,iron:.65,brass:.8,glass:.1})[kind]??0;m.roughness=({steel:.63,iron:.49,brass:.38,glass:.12,wood:.62,fabric:.95,asphalt:.98,granite:.9})[kind]??.86;m.reflectionTexture=this.environment;m.environmentIntensity=kind==='glass'?.8:.32;m.directIntensity=1;m.enableSpecularAntiAliasing=true;if(map)m.albedoTexture=this.texture(map);if(kind==='stone'||kind==='asphalt'||kind==='granite'){m.bumpTexture=this.texture(this.maps.normal.image);m.bumpTexture.level=kind==='asphalt'?.09:kind==='granite'?.23:.18;}if(kind==='glass'){m.albedoColor=B.Color3.FromHexString(color);m.clearCoat.isEnabled=true;m.clearCoat.intensity=1;m.clearCoat.roughness=.09;}if(kind==='fabric'){m.sheen.isEnabled=true;m.sheen.intensity=.18;}}
  if(kind.startsWith('interior-')&&kind!=='interior-glass'){m.emissiveColor=B.Color3.FromHexString(color).scale(kind==='interior-glow'?1.3:.22);m.roughness=.72;}
  if(kind.startsWith('road-')){
   m.metadata={street:true};m.environmentIntensity=kind==='road-wet'?.6:.18;
   m.roughness=kind==='road-wet'?.32:kind==='road-iron'?.66:kind==='road-granite'?.91:.94;
   if(kind==='road-iron')m.metallic=.65;
   if(kind==='road-asphalt'||kind==='road-wet'){m.bumpTexture=this.texture(this.maps.roadNormal.image);m.bumpTexture.level=.2;}
   if(kind==='road-granite'){m.bumpTexture=this.texture(this.maps.normal.image);m.bumpTexture.level=.23;}
   if(kind==='road-paint'){m.useAlphaFromAlbedoTexture=true;m.transparencyMode=B.StandardMaterial.MATERIAL_ALPHABLEND;m.disableDepthWrite=true;m.zOffset=-1;}
   // Dynamic textures clamp by default; ground UVs are world coordinates.
   // Repeat both axes to preserve grain and avoid stretching an edge texel.
   for(const tex of [m.albedoTexture,m.bumpTexture])if(tex)tex.wrapU=tex.wrapV=B.Texture.WRAP_ADDRESSMODE;
  }
  m.backFaceCulling=false;this.matCache.set(key,m);return m;
 }
 add(mesh,color,map,kind='stone',cast=true){mesh.material=this.mat(color,map,kind);mesh.receiveShadows=true;mesh.isPickable=false;this.staticMeshes.push(mesh);mesh.metadata={cast};return mesh;}
 box(x,y,w,h,depth,z,color,map,kind='stone',bevel=.65){
  if(this.engine){const mesh=new B.Mesh(kind,this.scene);dressedBox(w,h,depth,bevel).applyToMesh(mesh);mesh.position=this.vec(x+w/2,y+h/2,z);this.add(mesh,color,map,kind,Math.abs(x-W/2)<1300&&w<2500);}
  this.records.push({kind:'rect',x,y,w,h,z,color,map});
 }
 plane(x,y,w,h,z,image){if(this.engine){const mesh=B.MeshBuilder.CreatePlane('paint',{width:w,height:h,sideOrientation:B.Mesh.DOUBLESIDE},this.scene);mesh.position=this.vec(x+w/2,y+h/2,z);mesh.material=this.mat('#ffffff',image,'ink');}this.records.push({kind:'image',x,y,w,h,z,image});}
 tube(points,color,radius=1.3,kind='iron',closed=false){
  if(this.engine){const mesh=B.MeshBuilder.CreateTube('forged-curve',{path:points.map(([x,y,z])=>this.vec(x,y,z)),radius,tessellation:8,cap:3},this.scene);this.add(mesh,color,null,kind);}
  this.records.push({kind:'line',points:points.map(([x,y])=>[x,y]),color,width:radius*2,z:points[0][2]});
 }
 // A continuous moulding follows a measured architectural cross-section.
 cornice(x,y,w,profile,color='#ddd6c6',map=this.maps.stone.image){
  for(let i=1;i<profile.length;i++){
   const [a,za]=profile[i-1],[b,zb]=profile[i];if(b-a<.1)continue;
   if(this.engine){const positions=[x-W/2,H/2-(y+a),za,x+w-W/2,H/2-(y+a),za,x-W/2,H/2-(y+b),zb,x+w-W/2,H/2-(y+b),zb];const mesh=new B.Mesh('profiled-stone',this.scene),data=new B.VertexData();data.positions=positions;data.indices=[0,2,1,1,2,3];data.uvs=[0,1,w/200,1,0,0,w/200,0];data.normals=[];outwardNormals(positions,data.indices,data.normals);data.applyToMesh(mesh);this.add(mesh,color,map,'stone',w<2500);}
   this.records.push({kind:'rect',x,y:y+a,w,h:b-a,z:Math.max(za,zb),color,map});
  }
 }
 masonry(){
  const stone=this.maps.stone.image,random=rng(53),tones=['#ded8ca','#d9d3c5','#e0d9cc','#dcd5c7','#d5cec0','#dfd8c9','#d8d1c3'];
  const windowAxes=centeredBays(FACADES.haussmann,3,200);const exclusions=[...windowAxes.map(x=>[x-10,15,220,390]),[10,584,184,580],[202,610,841,553]];
  // Cut each actual block around doors and windows: no wall behind the glazing.
  const cut=(rect,hole)=>{const [x,y,w,h]=rect,[a,b,c,d]=hole,l=Math.max(x,a),r=Math.min(x+w,a+c),t=Math.max(y,b),bt=Math.min(y+h,b+d);if(r<=l||bt<=t)return [rect];return [[x,y,w,t-y],[x,bt,w,y+h-bt],[x,t,l-x,bt-t],[r,t,x+w-r,bt-t]].filter(v=>v[2]>.5&&v[3]>.5);};
  for(let row=0;row<25;row++){const y=row*48,offset=row%2?88:0;for(let col=-1;col<7;col++){const start=Math.max(-45,col*176+offset),end=Math.min(1115,col*176+offset+174.8);if(end<=start)continue;let parts=[[start,y,end-start,46.8]];for(const hole of exclusions)parts=parts.flatMap(rect=>cut(rect,hole));for(const [x,yy,w,h]of parts)this.box(x,yy,w,h,65,-75+(random()-.5)*.6,tones[Math.floor(random()*tones.length)],stone,'stone',.7);}}
  this.cornice(-45,415,1160,[[0,-42],[3,-40],[6,-25],[11,-22],[15,-19],[18,-8],[23,-7],[28,-2],[32,0],[35,5],[42,6],[45,-17],[48,-19],[53,-37],[58,-42]]);
  this.cornice(-45,482,1160,[[0,-45],[5,-36],[9,-35],[13,-27],[19,-24],[23,-33],[28,-42]],'#d6cebd');
  this.cornice(-45,8,1160,[[0,-47],[5,-30],[9,-29],[13,-19],[19,-20]],'#e2daca');
  for(let x=-35;x<1105;x+=43){this.box(x,449,21,15,18,-10,'#d0c7b7',stone,'stone',1.1);}
  for(const x of [FACADES.haussmann.x+FACADES.haussmann.width/3-9,FACADES.haussmann.x+FACADES.haussmann.width*2/3-9]){
   this.box(x,37,18,349,13,-28,'#d6cebd',stone);this.box(x+5,48,2.1,323,2,-18,'#bfb7a7');this.box(x+11,48,1.5,323,2,-18,'#eee5d2');
   this.cornice(x-8,20,34,[[0,-30],[4,-12],[9,-10],[14,-22],[19,-25]],'#e3dbc9');
   this.cornice(x-8,382,34,[[0,-25],[5,-10],[12,-8],[17,-22]],'#d9d0bd');
  }
 }
 frame(x,y,w,h,z,width,color,map,kind='stone'){
  this.box(x,y,w,width,9,z,color,map,kind);this.box(x,y+h-width,w,width,9,z,color,map,kind);this.box(x,y+width,width,h-width*2,9,z,color,map,kind);this.box(x+w-width,y+width,width,h-width*2,9,z,color,map,kind);
 }
 windowBay(x,y,w=200,h=356){
  const stone=this.maps.stone.image;
  this.box(x-8,y-8,w+16,h+16,24,-72,'#353b3a',null,'iron');
  this.box(x,y,w,h,14,-43,'#343e3d',null,'wood');
  this.frame(x-5,y-5,w+10,h+10,-18,7,'#b5b4a7',null,'wood');
  // Six separate recessed panes, modelled curtains and narrow reflective edges.
  for(let col=0;col<2;col++)for(let row=0;row<3;row++){
   const px=x+13+col*(w/2-1),py=y+12+row*(h-24)/3,pw=w/2-23,ph=(h-24)/3-9;
   this.box(px,py,pw,ph,2,-30,col?'#4e6266':'#42595f',null,'glass',.1);
   this.box(px+2,py+2,1.2,ph-4,1,-27,'#bdc7be',null,'steel',.1);
   // Quiet, broken interior reflections are geometry behind the glazing plane.

   this.frame(px-3,py-3,pw+6,ph+6,-14,3.7,'#c5c3b6',null,'wood');
  }
  this.box(x+w/2-4,y+5,8,h-10,13,-9,'#cfcdc0',null,'wood');
  for(const yy of [y+h/3-3,y+2*h/3-3])this.box(x+6,yy,w-12,6,12,-9,'#b8b9ae',null,'wood');
  this.box(x+w/2+5,y+h*.53,2,16,3,1,'#7a8074',null,'brass');
  for(let side=0;side<2;side++){
   const xx=side?x+w+1:x-18;this.box(xx,y-12,17,h+25,24,-12,'#ddd5c4',stone,'stone',1);
   this.box(xx+4,y-7,4,h+13,8,4,'#ebe1cf',stone,'stone',.5);
   this.box(xx+11,y-7,2,h+13,4,1,'#b8af9e',stone,'stone',.5);
  }
  this.cornice(x-23,y-29,w+46,[[0,-32],[4,-16],[9,-13],[12,-3],[19,-2],[24,-15],[30,-18]],'#dfd6c3');
  this.cornice(x-27,y+h+1,w+54,[[0,-12],[3,20],[9,23],[13,17],[18,13],[22,-4]],'#e4dac6');
  // Paired carved corbels have a curved S-profile, inset groove and volute.
  for(const xx of [x-7,x+w-15]){
   this.cornice(xx,y+h+18,21,[[0,12],[5,11],[10,6],[16,0],[23,-10],[29,-17],[33,-20]],'#cbbfa9');
   const points=[];for(let i=0;i<=28;i++){const a=i/28*Math.PI*1.7,r=6*(1-i/34);points.push([xx+10+Math.cos(a)*r,y+h+25+Math.sin(a)*r,13]);}this.tube(points,'#c3b69e',1.1,'stone');
  }
  // Folded louvred timber shutters, each blade with its own sloping face.
  for(const xx of [x-31,x+w+13]){
   this.box(xx,y+8,18,h-15,8,-8,'#9b9e90',null,'wood',.6);
   this.frame(xx,y+8,18,h-15,0,2,'#c1c2b1',null,'wood');
   for(let i=0;i<38;i++)this.cornice(xx+3,y+12+i*(h-25)/38,12,[[0,1],[2,3],[5.5,-1]],'#aeb1a1',null);
   for(const yy of [y+48,y+h-53])this.box(xx+6,yy,5,3,3,6,'#545d50',null,'iron',.3);
  }
  // Acanthus keystone, fluted centre and two carved leaf fans.
  this.box(x+w/2-9,y-25,18,29,17,8,'#d7cbb4',stone,'stone',2);
  for(let i=-1;i<=1;i++)this.box(x+w/2+i*4-.6,y-19,1.2,18,2,18,'#b3a68e');
  for(const side of [-1,1])for(let i=0;i<4;i++)this.leaf(x+w/2+side*(9+i*5),y-14-i*1.3,side*(.4+i*.15),15-i,6.5,13);
  this.balcony(x,y+h-76,w);
 }
 leaf(x,y,angle,length,width,z){
  const positions=[],indices=[],uv=[],rows=14,cols=8;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
   const t=j/rows,u=i/cols*2-1,ww=Math.sin(Math.PI*t)**.7*width*.5,xx=u*ww,yy=(t-.5)*length;
   positions.push(x+xx*Math.cos(angle)-yy*Math.sin(angle)-W/2,H/2-(y+xx*Math.sin(angle)+yy*Math.cos(angle)),z+Math.sin(Math.PI*t)*(1-u*u)*3.3+Math.abs(u)*Math.sin(t*22)*.25);uv.push(i/cols,t);
   if(j<rows&&i<cols){const a=j*(cols+1)+i;indices.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
  }
  if(this.engine){const mesh=new B.Mesh('carved-acanthus-leaf',this.scene),data=new B.VertexData();data.positions=positions;data.indices=indices;data.uvs=uv;data.normals=[];outwardNormals(positions,indices,data.normals);data.applyToMesh(mesh);this.add(mesh,'#ded2b9',this.maps.stone.image);}
 }
 balcony(x,y,w){
  const iron='#323734';this.box(x-24,y+84,w+48,10,80,16,'#cfc4ae',this.maps.stone.image,'stone',1.8);
  this.tube([[x-21,y,65],[x+w+21,y,65]],iron,2.7);this.tube([[x-21,y+67,65],[x+w+21,y+67,65]],iron,1.8);
  for(let j=0;j<=8;j++){const xx=x-17+j*(w+34)/8;this.tube([[xx,y+3,65],[xx,y+66,65]],iron,1.25);this.box(xx-2.3,y+58,4.6,4.6,4,65,'#484a41',null,'iron',.7);}
  // Mirrored continuous scrolls, with tightening spirals instead of polygon loops.
  for(let j=0;j<4;j++){const cx=x+13+j*(w-26)/3;
   for(const sign of [-1,1]){const path=[];for(let k=0;k<=44;k++){const t=k/44,a=t*Math.PI*2.15,r=14*(1-.78*t);path.push([cx+sign*(Math.sin(a)*r),y+31+Math.cos(a)*r*1.5,66]);}this.tube(path,iron,.95);}
   this.tube([[cx,y+5,66],[cx-2,y+16,66],[cx,y+24,66],[cx+2,y+44,66],[cx,y+62,66]],iron,.8);
  }
  for(const xx of [x-21,x+w+21])this.tube([[xx,y,65],[xx,y,-7],[xx,y+64,-7],[xx,y+67,65]],iron,1.7);
 }
 windows(){for(const x of centeredBays(FACADES.haussmann,3,200))this.windowBay(x,40,200,356);}
 door(){
  const wood=this.maps.wood.image,stone=this.maps.stone.image;
  this.box(5,581,186,582,48,-48,'#37362e');this.box(21,597,153,557,21,-16,'#5a3b2a',wood,'wood',1.4);
  this.frame(26,601,143,548,1,11,'#775039',wood,'wood');
  for(const [y,h]of [[614,157],[790,153],[961,171]]){
   this.box(42,y,111,h,8,7,'#392b22',wood,'wood',1);
   this.frame(40,y-1,115,h+2,13,4,'#9b7351',wood,'wood');
   this.frame(45,y+5,105,h-10,11,3,'#593b2b',wood,'wood');
   this.box(53,y+15,90,h-30,8,9,'#684731',wood,'wood',4);
   this.frame(55,y+17,86,h-34,15,1,'#8a6242',wood,'wood');
  }
  // Hinges, escutcheon, ring pull and mail slot are independent solids.
  for(const y of [660,879,1076])this.box(167,y,4,24,7,9,'#463f31',null,'brass',.9);
  this.box(41,910,16,27,3,22,'#9b824d',null,'brass',2);const ring=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI*2;ring.push([49+Math.cos(a)*7,923+Math.sin(a)*9,28]);}this.tube(ring,'#b29a60',1.7,'brass');
  this.box(77,1006,42,8,3,22,'#9c8354',null,'brass',.8);this.box(80,1008,36,2,2,24,'#302d23',null,'iron',.2);
  for(const x of [0,178]){this.box(x,581,17,587,29,-2,'#d5cbb8',stone,'stone',1.1);this.box(x+4,591,3,553,5,16,'#e6ddc9',stone);}
  this.cornice(-7,556,207,[[0,-30],[5,-6],[10,2],[16,7],[20,8],[26,-3],[29,-8]],'#dfd5c0');
  const step=DOORSTEP;this.box(step.x,step.y,step.width,step.height,step.depth,step.z,'#bcb7a8',this.maps.granite.image,'granite',.9);
 }
 storefront(){
  const stone=this.maps.stone.image;
  this.box(209,520,821,84,36,-45,'#d9d0bd',stone,'stone',1.2);
  this.cornice(201,511,837,[[0,-44],[5,-15],[9,-10],[13,-21]],'#e0d5bf');
  this.box(206,600,833,11,22,-14,'#bbb09b',stone);
  for(const [x,w]of [[204,35],[1005,34]]){
   this.box(x,682,w,481,44,-26,'#cbc1ad',stone,'stone',1);this.box(x+4,694,2,451,5,-1,'#e4d9c4',stone);
   for(let row=0;row<9;row++)this.box(x,710+row*49,w,1,2,0,'#a79d8a');
  }
  for(const x of [234,999]){
   this.box(x,687,8,476,22,31,'#414b46',null,'steel',1);this.box(x+2,690,2,469,6,45,'#9ca49b',null,'steel',.3);
   for(let y=710;y<1145;y+=62)this.box(x+3,y,2,2,2,49,'#58625a',null,'steel',.4);
  }
  this.box(239,687,764,8,18,20,'#242d29',null,'iron');
 }
 awning(){
  const x=207,w=831,y=608,h=78,cols=132,rows=16,positions=[],uv=[],indices=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const u=i/cols,v=j/rows,fold=Math.sin(u*Math.PI*18)*Math.sin(Math.PI*v)*1.15;positions.push(x+w*u-W/2,H/2-(y+h*v+fold*.35),20+v*109-Math.sin(Math.PI*v)*7+fold);uv.push(u,1-v);}
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;indices.push(a,c,b,b,c,d);}
  if(this.engine){const mesh=new B.Mesh('tensioned-canvas',this.scene),data=new B.VertexData();data.positions=positions;data.indices=indices;data.uvs=uv;data.normals=[];outwardNormals(positions,indices,data.normals);data.applyToMesh(mesh);this.add(mesh,'#d59c96',this.maps.fabric.image,'fabric');}
  this.records.push({kind:'image',x,y,w,h,z:100,image:this.maps.fabric.image});
  this.box(x-5,y-8,w+10,10,18,25,'#565953',null,'steel',2);
  this.tube([[x-3,y+h,130],[x+w+3,y+h,130]],'#66232b',1.8,'fabric');
  // A shallow scalloped valance: physical canvas, continuous top edge.
  const p=[],ind=[],uvs=[];
  for(let i=0;i<=cols;i++){const u=i/cols,drop=14+2.2*(1-Math.cos(u*18*Math.PI));p.push(x+w*u-W/2,H/2-(y+h),130,x+w*u-W/2,H/2-(y+h+drop),129);uvs.push(u,1,u,0);if(i<cols){const a=i*2;ind.push(a,a+1,a+2,a+1,a+3,a+2);}}
  if(this.engine){const mesh=new B.Mesh('scalloped-valance',this.scene),data=new B.VertexData();data.positions=p;data.indices=ind;data.uvs=uvs;data.normals=[];outwardNormals(p,ind,data.normals);data.applyToMesh(mesh);this.add(mesh,'#ad7573',this.maps.fabric.image,'fabric');}
  // The valance sits in front of the shutter without lowering the video aperture.
  this.records.push({kind:'rect',x,y:y+h,w,h:16,z:132,color:'#782630',map:this.maps.fabric.image});
  for(const offset of [0,209,418,627,831]){const seam=[];for(let j=0;j<=16;j++){const v=j/16;seam.push([x+offset,y+h*v,21+v*109-Math.sin(Math.PI*v)*7]);}this.tube(seam,'#a25c5e',.28,'fabric');}
  for(const xx of [x+22,x+w-22]){
   this.tube([[xx,y+8,3],[xx+10,y+57,82],[xx,y+h-2,122]],'#57594f',2.3,'steel');
   this.box(xx-4,y+4,8,24,8,2,'#51564e',null,'steel',1);
  }
 }
 ground(){buildStreetGround(this);}
 shutter(){
  this.records.push({kind:'blades',z:61});const pitch=OPEN.height/BLADES;
  for(let i=0;i<BLADES;i++){
   if(!this.engine){this.blades.push(null);continue;}
   const group=new B.TransformNode('articulated-slat',this.scene),positions=[],uv=[],indices=[],n=48,rows=12;
   for(let j=0;j<=rows;j++)for(let k=0;k<=n;k++){const u=k/n,v=j/rows,profile=1.65*Math.sin(Math.PI*v)+1.3*Math.exp(-(((v-.13)/.085)**2))-1.4*Math.exp(-(((v-.94)/.04)**2));const dent=(i===9?-1.2*Math.exp(-(((u-.74)/.12)**2)):i===20?.9*Math.exp(-(((u-.2)/.1)**2)):0)*Math.sin(Math.PI*v)**2;positions.push((u-.5)*OPEN.width,(.5-v)*pitch,profile+dent);uv.push(u,1-v);}
   for(let j=0;j<rows;j++)for(let k=0;k<n;k++){const a=j*(n+1)+k,b=a+1,c=a+n+1,d=c+1;indices.push(a,c,b,b,c,d);}
   const metal=new B.Mesh('galvanized-slat',this.scene),data=new B.VertexData();data.positions=positions;data.indices=indices;data.uvs=uv;data.normals=[];outwardNormals(positions,indices,data.normals);data.applyToMesh(metal);metal.parent=group;metal.material=this.mat(i<2?'#b2b6aa':'#cbd0c3',this.maps.steel.image,'steel');metal.receiveShadows=true;metal.isPickable=false;
   const ink=metal.clone('paint-on-metal');ink.parent=group;ink.position.z=.12;ink.makeGeometryUnique();ink.setVerticesData('uv',uv.map((v,k)=>k%2?1-(i+(1-v))/BLADES:v));ink.material=this.mat('#c6bbb0',this.paintCanvas,'ink');ink.receiveShadows=true;
   const lip=B.MeshBuilder.CreateBox('interlocking-lip',{width:OPEN.width,height:i===BLADES-1?3:.65,depth:1.5},this.scene);lip.parent=group;lip.position.y=-pitch/2;lip.material=this.mat('#838b7f',null,'steel');lip.receiveShadows=true;
   if(i===BLADES-1){const handle=B.MeshBuilder.CreateTube('pull-handle',{path:[new B.Vector3(-14,-2,2),new B.Vector3(-14,1,5),new B.Vector3(14,1,5),new B.Vector3(14,-2,2)],radius:1.2,tessellation:8},this.scene);handle.material=this.mat('#788375',null,'steel');handle.parent=group;}
   this.blades.push(group);
  }
 }
 consolidate(){
  if(!this.engine)return;const groups=new Map();for(const mesh of this.staticMeshes){const key=mesh.material.uniqueId+':'+mesh.metadata.cast;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);}
  this.staticMeshes=[];for(const parts of groups.values()){const cast=parts[0].metadata.cast,mesh=parts.length>1?B.Mesh.MergeMeshes(parts,true,true,undefined,false,false):parts[0];if(!mesh)continue;mesh.receiveShadows=true;mesh.isPickable=false;mesh.freezeWorldMatrix();this.staticMeshes.push(mesh);if(cast)this.shadows.addShadowCaster(mesh);}
  this.canvas.dataset.meshes=String(this.scene.meshes.length);this.canvas.dataset.triangles=String(this.scene.meshes.reduce((total,mesh)=>total+mesh.getTotalIndices(),0)/3);
 }
 build(){buildNeighbors(this);if(this.place?.model==='groundfloor-apartment')buildApartment(this);else{this.masonry();this.windows();this.door();this.storefront();this.shutter();this.awning();}this.ground();this.records.sort((a,b)=>a.z-b.z);this.consolidate();this.lightStreet();this.updateBlades();}
 lightStreet(){
  if(!this.engine)return;
  const meshes=this.staticMeshes.filter(mesh=>mesh.material?.metadata?.street);
  this.streetLight=new B.HemisphericLight('street-open-sky',new B.Vector3(0,1,0),this.scene);
  this.streetLight.intensity=1.05;this.streetLight.diffuse=new B.Color3(.65,.77,.9);this.streetLight.groundColor=new B.Color3(.18,.23,.31);this.streetLight.includedOnlyMeshes=meshes;
 }
 updateBlades(){for(let i=0;i<this.blades.length;i++){const part=this.blades[i];if(!part)continue;const p=bladePlacement(i,this.progress);part.setEnabled(p.visible);part.position=this.vec(OPEN.x+OPEN.width/2,p.y,33-p.fold*14);part.scaling.y=p.height/p.pitch;part.rotation.x=-p.fold*.18;}}
 setProgress(progress){this.progress=clamp(progress,0,1);this.canvas.dataset.shutterPosition=this.progress.toFixed(4);this.updateBlades();this.render();}
 observeLayout(){this.observer.observe(this.canvas);if(this.frameElement!==this.canvas)this.observer.observe(this.frameElement);}
 resize(){
  const bounds=this.canvas.getBoundingClientRect(),rect={width:this.canvas.clientWidth||bounds.width,height:this.canvas.clientHeight||bounds.height},frame=this.frameElement===this.canvas?rect:this.frameElement.getBoundingClientRect();
  if(!rect.width||!rect.height||!frame.height)return;
  this.width=rect.width;this.height=rect.height;this.frameHeight=frame.height;
  const viewWidth=H*rect.width/frame.height;this.viewWidth=viewWidth;
  Object.assign(this.window.style,{left:`${(viewWidth/2+OPEN.x-W/2)/viewWidth*100}%`,top:`${OPEN.y/H*100}%`,width:`${OPEN.width/viewWidth*100}%`,height:`${OPEN.height/H*100}%`});
  if(this.engine){
   this.camera.orthoLeft=viewWidth/2;this.camera.orthoRight=-viewWidth/2;this.camera.orthoTop=H/2;this.camera.orthoBottom=-H/2;
   this.engine.setHardwareScalingLevel(1/Math.max(2,devicePixelRatio||1));this.engine.resize();
   // Extend the view downwards without moving the eye or changing the street's
   // framing. An off-centre projection keeps every facade and the aperture in
   // the same screen position while revealing the foreground below them.
   this.camera.unfreezeProjectionMatrix();
   this.camera.fov=2*Math.atan(Math.tan(.43/2)*rect.height/frame.height);
   if(this.frameElement!==this.canvas){
    const projection=this.camera.getProjectionMatrix(true).clone();
    projection.addAtIndex(9,frame.height/rect.height-1);
    this.camera.freezeProjectionMatrix(projection);
   }
  }else{const d=Math.max(2,devicePixelRatio||1);this.canvas.width=Math.round(rect.width*d);this.canvas.height=Math.round(rect.height*d);}
  this.render();
 }
 tick(dt,now,audio={}){
  if(this.disposed||!this.cat)return;
  const changed=this.cat.advance(dt),due=now-(this.lastCatDraw||0)>33;
  this.djElapsed=(this.djElapsed||0)+(audio.playing?dt:0);
  const djChanged=due&&this.dj?.advance(this.djElapsed,!!audio.playing,audio.bands,this.cat.reduced.matches);
  if(due)this.djElapsed=0;if(djChanged)this.canvas.dataset.djTime=this.dj.time.toFixed(3);
  if(changed||(this.cat.state.visible&&due)||djChanged){this.cat.apply();this.lastCatDraw=now;this.renderCat();}
 }
 setCatJourneyPose(pose){if(this.disposed)return;this.cat.state=pose;this.cat.apply();this.renderCat();}
 catFocusPoint(){
  const s=this.cat.state;if(!this.engine){const k=this.frameHeight/H;return {x:(this.width-W*k)/2+s.x*k,y:(s.y-40)*k};}
  const p=this.api.Vector3.TransformCoordinates(this.vec(s.x,s.y-40,s.z+10),this.scene.getTransformMatrix());
  return {x:(p.x+1)*this.width/2,y:(1-p.y)*this.height/2};
 }
 settleCat(x=95,z=80){
  const cat=this.cat,width=this.viewWidth||1500;cat.timeline.begin({left:620-width/2-130,right:620+width/2+130},{rest:'sit',jump:false});
  const v=cat.timeline.visit;v.startAt=cat.timeline.time;v.start=v.approach=v.stop=x;v.z=z;v.direction=v.exitDirection=1;v.incoming=0;v.outgoing=Math.abs(v.end-x)/100;
  v.end=620+width/2+130;v.outgoing=Math.abs(v.end-x)/100;
  v.phases=[{kind:'settle',at:0,duration:.95},{kind:'sit',at:.95,duration:9},{kind:'stand',at:9.95,duration:.85},{kind:'leave',at:10.8,duration:v.outgoing,from:x,to:v.end,direction:1}];v.duration=10.8+v.outgoing;
  cat.state=cat.timeline.sample();cat.apply();this.renderCat();
 }
 projectBounds(x0,x1,y0,y1,z0,z1){
  const matrix=this.scene.getTransformMatrix(),w=this.canvas.width,h=this.canvas.height;let left=w,bottom=h,right=0,top=0;
  for(const x of [x0,x1])for(const y of [y0,y1])for(const z of [z0,z1]){const p=this.api.Vector3.TransformCoordinates(this.vec(x,y,z),matrix),px=(p.x+1)*w/2,py=(p.y+1)*h/2;left=Math.min(left,px);right=Math.max(right,px);bottom=Math.min(bottom,py);top=Math.max(top,py);}
  return {left:Math.max(0,Math.floor(left)-4),bottom:Math.max(0,Math.floor(bottom)-4),right:Math.min(w,Math.ceil(right)+4),top:Math.min(h,Math.ceil(top)+4)};
 }
 catBounds(){
  const s=this.cat?.state;if(!s?.visible)return null;
  // Include the entire visitor, tail, airborne poses and contact shadow. Project
  // a conservative world box so perspective and wide/mobile crops stay exact.
  const matrix=this.scene.getTransformMatrix(),w=this.canvas.width,h=this.canvas.height;
  let left=w,bottom=h,right=0,top=0;
  for(const x of [s.x-115,s.x+115])for(const y of [s.y-180,s.groundY+12])for(const z of [s.z-115,s.z+115]){
   const p=B.Vector3.TransformCoordinates(this.vec(x,y,z),matrix),px=(p.x+1)*w/2,py=(p.y+1)*h/2;
   left=Math.min(left,px);right=Math.max(right,px);bottom=Math.min(bottom,py);top=Math.max(top,py);
  }
  return {left:Math.max(0,Math.floor(left)-4),bottom:Math.max(0,Math.floor(bottom)-4),right:Math.min(w,Math.ceil(right)+4),top:Math.min(h,Math.ceil(top)+4)};
 }
 renderCat(){
  if(!this.engine||!this.canvas.dataset.ready){this.render();return;}
  const next=this.catBounds(),previous=this.lastCatBounds;this.lastCatBounds=next;
  if(!next&&!previous&&!this.dj)return;
  const regions=[previous,next,this.dj?this.projectBounds(240,1005,680,1168,-540,45):null].filter(Boolean);if(!regions.length)return;
  const left=Math.min(...regions.map(r=>r.left)),bottom=Math.min(...regions.map(r=>r.bottom)),right=Math.max(...regions.map(r=>r.right)),top=Math.max(...regions.map(r=>r.top));
  if(right<=left||top<=bottom)return;
  // The preserved framebuffer already holds the static street. Clear and
  // redraw only the union of the old and new visitor bounds, including depth.
  this.engine.enableScissor(left,bottom,right-left,top-bottom);
  try{this.scene.render();}finally{this.engine.disableScissor();}
 }
 render(){if(this.disposed||!this.width)return;if(this.engine){this.scene.render();this.lastCatBounds=this.catBounds();}else this.drawCanvas();}
 switchToCanvas(){if(this.disposed||!this.engine)return;const old=this.canvas,replacement=old.cloneNode(false);old.replaceWith(replacement);this.observer.disconnect();this.scene.dispose();this.engine.dispose();this.engine=null;this.cat?.toCanvas();this.dj?.toCanvas();if(this.frameElement===old)this.frameElement=replacement;this.canvas=replacement;this.ctx=replacement.getContext('2d',{alpha:true});replacement.dataset.renderer='canvas2d';replacement.dataset.shutterPosition=this.progress.toFixed(4);this.observeLayout();this.resize();}
 drawCanvas(){const ctx=this.ctx;if(!ctx)return;const w=this.canvas.width,h=this.canvas.height,scale=h/H*(this.frameHeight/this.height),ox=(w-W*scale)/2;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);ctx.setTransform(scale,0,0,scale,ox,0);for(const item of this.records){
  if(item.kind==='rect'){ctx.fillStyle=item.color;ctx.fillRect(item.x,item.y,item.w,item.h);if(item.map){ctx.globalAlpha=.15;ctx.drawImage(item.map,item.x,item.y,item.w,item.h);ctx.globalAlpha=1;}}
  else if(item.kind==='polygon'){ctx.fillStyle=item.color;ctx.beginPath();item.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
  else if(item.kind==='image')ctx.drawImage(item.image,item.x,item.y,item.w,item.h);
  else if(item.kind==='line'){ctx.strokeStyle=item.color;ctx.lineWidth=item.width;ctx.lineJoin='round';ctx.beginPath();item.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
  else if(item.kind==='dj')this.dj?.drawCanvas(ctx);
  else if(item.kind==='blades')for(let i=BLADES-1;i>=0;i--){const p=bladePlacement(i,this.progress);if(!p.visible)continue;const y=p.y-p.height/2;ctx.drawImage(this.maps.steel.image,OPEN.x,y,OPEN.width,p.height+.5);ctx.globalAlpha=.75;ctx.drawImage(this.paintCanvas,0,i*this.paintCanvas.height/BLADES,this.paintCanvas.width,this.paintCanvas.height/BLADES,OPEN.x,y,OPEN.width,p.height+.3);ctx.globalAlpha=1;ctx.fillStyle='#4d594f';ctx.fillRect(OPEN.x,y+p.height-.7,OPEN.width,.7);}
 }ctx.save();ctx.globalCompositeOperation='source-atop';ctx.fillStyle='rgba(245,116,24,.14)';ctx.fillRect(-5000,0,12000,H);ctx.restore();this.cat?.drawCanvas(ctx);}
 dispose({keepEngine=false}={}){this.disposed=true;this.cat?.dispose();this.dj?.dispose();this.observer.disconnect();this.canvas.removeEventListener('webglcontextlost',this.onLost);this.scene?.dispose();if(!keepEngine)this.engine?.dispose();}
}
function graffitiTexture(){return texture(1536,960,(c,w,h)=>{
 c.clearRect(0,0,w,h);c.lineJoin='round';c.lineCap='round';
 const stroke=(path,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.stroke(new Path2D(path));};
 // Several overlapping tags, painted across the hooks rather than floating
 // above the curtain. Paths are original vector strokes inspired by the photo.
 const red='rgba(177,38,46,.90)',red2='rgba(211,43,52,.73)';
 const paths=[
 'M44 355 C70 244 188 220 267 262 C337 302 333 370 294 422 C260 466 180 483 134 449 C105 426 114 383 168 382 C203 382 214 407 201 429',
 'M86 341 C125 320 189 338 221 374 M89 340 L91 423 M150 326 L153 404 M200 327 L222 399',
 'M264 271 C329 252 385 282 397 348 C411 408 394 434 370 424 C347 415 357 371 346 349 C337 331 322 336 319 358 L319 416',
 'M396 290 C452 267 500 296 504 347 C511 399 497 425 477 421 M503 302 C550 276 589 299 592 340 C595 369 585 388 564 385',
 'M56 528 C72 474 118 464 162 482 C206 500 210 555 187 584 C161 616 117 612 105 580 C96 556 110 542 128 548',
 'M176 495 C216 454 291 464 327 512 C356 550 341 612 301 633 C262 655 212 635 204 607',
 'M333 497 C365 459 425 466 449 510 C467 546 459 594 434 607 C409 621 395 594 402 565',
 'M438 490 C481 465 541 484 555 527 C569 570 551 616 522 622 C490 630 480 597 490 574',
 'M557 513 C590 482 635 477 661 506 C682 529 686 585 669 616 C649 648 620 640 611 609',
 'M681 480 C725 451 788 465 813 507 C832 540 826 594 801 614 C770 637 740 619 738 590',
 'M819 492 C856 463 904 475 928 508 C954 543 950 592 932 615 C910 643 879 624 885 590',
 'M935 493 C980 470 1040 486 1058 529 C1074 571 1063 610 1036 621 C1003 634 983 607 994 580',
 'M1065 500 C1090 471 1140 469 1169 494 C1194 516 1195 567 1176 600 C1157 629 1128 622 1126 591',
 'M1194 496 C1232 467 1274 480 1292 513 C1309 547 1302 593 1280 611 C1256 630 1235 609 1238 583',
 'M1316 500 C1354 472 1406 481 1430 512 C1450 539 1445 589 1426 609',
 'M660 287 L711 339 M697 288 L678 351 M678 253 L693 317',
 'M1255 668 L1298 726 M1290 668 L1251 725 M1287 695 L1324 700',
 'M129 675 C90 645 55 658 51 701 C48 727 60 744 78 750',
 'M483 691 C520 671 546 681 559 710 M484 731 C519 715 544 716 562 736'
 ];
 paths.forEach((p,i)=>{stroke(p,i%4===0?red2:red,8+(i%3)*2);});
 const drip=[150,245,316,397,447,553,660,748,803,929,1058,1174,1280,1400];drip.forEach((x,i)=>{c.strokeStyle=i%3?red:red2;c.lineWidth=3+(i%3);c.beginPath();c.moveTo(x,605+(i%4)*8);c.lineTo(x+2,659+(i%5)*15);c.stroke();});
 // Pale filled silver throw-up in the upper right, with dark outline.
 const black='M825 258 C802 226 831 194 867 207 C884 179 932 177 951 199 C980 181 1020 190 1031 214 C1064 193 1101 205 1109 229 C1138 208 1181 216 1193 246 C1228 229 1270 244 1275 272 C1301 255 1334 270 1341 302 L1357 381 C1356 409 1329 421 1304 411 C1286 435 1255 435 1239 418 C1215 438 1178 431 1165 411 C1137 433 1099 428 1085 408 C1058 426 1023 421 1009 399 C977 419 940 405 935 384 C899 405 862 394 861 373 C831 383 807 360 821 334 C798 316 801 279 825 258 Z';
 c.fillStyle='rgba(226,230,224,.76)';c.fill(new Path2D(black));stroke(black,'rgba(24,32,32,.92)',9);
 ['M861 258 C884 240 925 242 938 266 M866 312 C890 293 924 302 932 321','M957 230 C981 242 992 268 982 290 M951 321 C973 303 998 308 1005 329','M1027 235 C1052 247 1058 273 1050 293 M1019 329 C1041 311 1067 317 1077 334','M1104 238 C1119 255 1120 289 1111 306 M1100 335 C1120 322 1143 323 1156 338','M1192 256 C1206 270 1213 303 1203 326 M1197 348 C1218 337 1239 340 1250 353','M1274 283 C1285 295 1293 323 1287 347'].forEach(p=>stroke(p,'rgba(28,33,33,.88)',6));
 stroke('M145 779 C175 747 192 775 208 752 M194 784 L231 755 M228 786 C249 759 267 770 283 748 M270 791 L303 751','rgba(54,54,134,.78)',7);
 stroke('M525 857 L546 824 L561 857 L578 823 L585 858 M601 854 L613 826 L625 855 M640 856 L651 820 M670 854 L685 827 L697 856','rgba(31,37,38,.85)',5);
 stroke('M997 864 L1015 827 L1029 852 L1043 825 M1055 861 L1077 824 L1099 858 M1120 857 L1134 826 L1154 853','rgba(30,50,79,.8)',7);
 // Local breaks in the pigment are wear on the metal edges.
 c.globalCompositeOperation='destination-out';const r=rng(878);for(let i=0;i<170;i++){c.globalAlpha=.25+r()*.45;c.fillRect(r()*w,r()*h,2+r()*12,.6+r()*2);}c.globalAlpha=1;c.globalCompositeOperation='source-over';
 });}
