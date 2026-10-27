import {pavementY} from './street-ground.mjs';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10);};
const lerp=(a,b,t)=>a+(b-a)*t;
// All decisions are made once at the beginning of a visit. Sampling a pose is
// pure: redraws, resizing and a frozen frame cannot reroll the cat's behaviour.
export class CatTimeline {
 constructor({random=Math.random,firstDelay}={}){this.random=random;this.time=0;this.visit=null;this.nextAt=firstDelay??this.range(4,8);this.lastDirection=0;this.visits=0;}
 range(a,b){return a+(b-a)*this.random();}
 begin(bounds,options={}){
  const direction=this.lastDirection&&this.random()<.65?-this.lastDirection:this.random()<.5?1:-1;
  this.lastDirection=direction;const stop=this.range(77,119),z=this.range(64,96),speed=this.range(82,112);
  const start=direction>0?bounds.left:bounds.right,exitDirection=this.random()<.32?-direction:direction,end=exitDirection>0?bounds.right:bounds.left;
  const rest=options.rest??(this.random()<.42?'sleep':'sit'),hops=options.jump??this.random()<.55;
  const approach=stop-direction*(hops?this.range(45,68):0),incoming=Math.abs(approach-start)/speed,outgoing=Math.abs(end-stop)/speed,sit=.95,rise=.85;
  const v={startAt:this.time,direction,exitDirection,start,end,stop,z,incoming,outgoing,sit,rise,rest,hops,approach,dwell:rest==='sleep'?this.range(56,64):this.range(5,13),jumpHeight:this.range(43,65),seed:this.range(0,Math.PI*2),phases:[]};
  let at=0;const add=(kind,duration,extra={})=>{v.phases.push({kind,at,duration,...extra});at+=duration;};
  add('arrive',incoming,{from:start,to:approach,direction});
  if(hops)add('jump',1.25,{from:approach,to:stop,direction});
  add('settle',sit);
  if(rest==='sleep'){add('sit',this.range(2,4));add('lie',1.8);add('sleep',v.dwell);add('wake',1.8);add('sit',2);}
  else add('sit',v.dwell);
  add('stand',rise);add('leave',outgoing,{from:stop,to:end,direction:exitDirection});v.duration=at;
  v.blinks=[];for(let t=this.range(1.8,3.5);t<v.duration;t+=this.range(2.9,5.3))v.blinks.push(t);
  this.visit=v;this.visits++;
 }
 advance(dt,bounds){
  this.time+=Math.max(0,Math.min(dt,.12));
  if(this.visit&&this.time-this.visit.startAt>=this.visit.duration){this.visit=null;this.nextAt=this.time+this.range(24,64);}
  if(!this.visit&&this.time>=this.nextAt)this.begin(bounds);return this.sample();
 }
 sample(reduced=false){
  const v=this.visit;if(!v)return {visible:false,phase:'absent'};
  const t=Math.max(0,this.time-v.startAt),segment=v.phases.find(p=>t<p.at+p.duration)||v.phases.at(-1),local=t-segment.at,p=clamp(local/segment.duration),e=ease(p),phase=segment.kind;
  let x=v.stop,sit=0,sleep=0,yaw=0,gait=0,walk=0,jump=0,crouch=0,tuck=0,pitch=0;
  if(phase==='arrive'||phase==='leave'){
   x=lerp(segment.from,segment.to,e);const distance=Math.abs(segment.to-segment.from);gait=Math.abs(x-segment.from)*.18;
   walk=clamp(30*p*p*(1-p)*(1-p)*distance/segment.duration/85);yaw=segment.direction*1.25;
  }else if(phase==='jump'){
   const air=clamp((local-.22)/.78);x=lerp(segment.from,segment.to,ease(air));yaw=segment.direction*1.25;
   if(local<.22)crouch=ease(local/.22);
   else if(local<1){jump=4*v.jumpHeight*air*(1-air);tuck=Math.sin(Math.PI*air)*.4;pitch=Math.sin(Math.PI*air*2)*.14;}
   else crouch=Math.sin(clamp((local-1)/.25)*Math.PI)*.65;
  }else if(phase==='settle'){sit=e;yaw=v.direction*1.25*(1-e);}
  else if(phase==='sit'){sit=1;yaw=Math.sin(t*.3+v.seed)*.09*ease(local/.4)*ease((segment.duration-local)/.4);}
  else if(phase==='lie'){sleep=e;sit=1-e;yaw=sleep*.4;}
  else if(phase==='sleep'){sleep=1;yaw=.4;}
  else if(phase==='wake'){sleep=1-e;sit=e;yaw=sleep*.4;}
  else if(phase==='stand'){sit=1-e;yaw=v.exitDirection*1.25*e;}
  let blink=1;for(const at of v.blinks)blink=Math.min(blink,1-.96*Math.exp(-(((t-at)/.07)**2)));
  if(sleep>.5)blink=0;
  if(reduced){x=v.stop;sit=sleep>.5?0:1;yaw=sleep*.4;gait=0;walk=0;jump=0;crouch=0;tuck=0;pitch=0;}
  const groundY=pavementY(v.z);
  return {visible:t<v.duration,phase,x,z:v.z,y:groundY-jump,groundY,sit,sleep,jump,crouch,tuck,pitch,yaw,gait,walk,blink,t,seed:v.seed};
 }
}

export class StreetCat {
 constructor(scene,options={}){
  this.owner=scene;this.B=scene.api;this.timeline=new CatTimeline(options);this.reduced=matchMedia('(prefers-reduced-motion: reduce)');this.state=this.timeline.sample();this.meshes=[];this.materials=[];this.legs=[];
  if(scene.engine)this.build();
 }
 material(name,color,emission=0){const B=this.B,m=new B.StandardMaterial(name,this.owner.scene);m.diffuseColor=B.Color3.FromHexString(color);m.emissiveColor=m.diffuseColor.scale(emission);m.specularColor=new B.Color3(.06,.06,.06);m.specularPower=24;m.ambientColor=new B.Color3(.6,.6,.6);this.materials.push(m);return m;}
 ball(name,parent,position,scale,material){
  const B=this.B,mesh=B.MeshBuilder.CreateSphere(name,{diameter:2,segments:16},this.owner.scene);mesh.parent=parent;mesh.position=new B.Vector3(...position);mesh.scaling=new B.Vector3(...scale);mesh.material=material;mesh.isPickable=false;mesh.receiveShadows=true;this.meshes.push(mesh);return mesh;
 }
 line(name,parent,points,radius,material){const B=this.B,mesh=B.MeshBuilder.CreateTube(name,{path:points.map(p=>new B.Vector3(...p)),radius,tessellation:8,cap:3},this.owner.scene);mesh.parent=parent;mesh.material=material;mesh.isPickable=false;this.meshes.push(mesh);return mesh;}
 ear(parent,side,inside=false){
  const B=this.B,base=inside?4.6:7,tip=inside?10.5:14,z=inside?2.9:2.5,y=inside?2:0;
  const points=[[-base,y,z],[base,y,z],[side*3,y+tip,z-1.1],[-base,y,-3],[base,y,-3],[side*3,y+tip,-4]];
  const indices=[0,2,1,3,4,5,0,1,3,1,4,3,1,2,4,2,5,4,2,0,5,0,3,5],data=new B.VertexData();data.positions=points.flat();data.indices=indices;data.normals=[];B.VertexData.ComputeNormals(data.positions,indices,data.normals);
  const mesh=new B.Mesh(inside?'ear-inner':'ear',this.owner.scene);data.applyToMesh(mesh);mesh.parent=parent;mesh.position=new B.Vector3(side*10,11,0);mesh.material=inside?this.inner:this.coat;mesh.material.backFaceCulling=false;mesh.isPickable=false;this.meshes.push(mesh);
 }
 build(){
  const B=this.B,scene=this.owner.scene;
  this.coat=this.material('cat-grey','#4e5a6c',.18);this.dark=this.material('cat-grey-shadow','#37414f',.14);this.light=this.material('cat-muzzle','#778393',.16);this.inner=this.material('cat-inner-ear','#5d6374',.16);this.ink=this.material('cat-ink','#252a30',.1);this.orange=this.material('cat-gold-eyes','#dbb34c',0);this.glint=this.material('cat-eye-glint','#fff1cd',.9);
  this.orange.disableLighting=true;this.orange.emissiveColor=new B.Color3(.93,.77,.22);this.glint.disableLighting=true;this.glint.emissiveColor=new B.Color3(.9,.84,.7);
  this.root=new B.TransformNode('grey-cat',scene);this.root.scaling.setAll(1.15);
  this.body=this.ball('cat-body',this.root,[0,28,0],[14.5,15,24],this.coat);
  this.chest=this.ball('cat-chest',this.root,[0,36,15],[12.5,15,13],this.coat);
  this.head=new B.TransformNode('cat-head',scene);this.head.parent=this.root;this.head.position=new B.Vector3(0,46,23);
  this.ball('cat-round-head',this.head,[0,0,0],[17.3,15.5,13],this.coat);
  this.ear(this.head,-1);this.ear(this.head,1);this.ear(this.head,-1,true);this.ear(this.head,1,true);
  this.eyes=[];this.eyeParts=[];
  for(const side of [-1,1]){
   const eye=new B.TransformNode('cat-blink',scene);eye.parent=this.head;eye.position=new B.Vector3(side*6.5,2.4,11.5);this.eyes.push(eye);
   const eyeStart=this.meshes.length;
   this.ball('cat-eye-outline',eye,[0,0,0],[5.7,6.6,1.6],this.ink);
   this.ball('cat-orange-iris',eye,[0,0,.8],[4.9,5.7,1.35],this.orange);
   this.ball('cat-pupil',eye,[.15,0,1.9],[1.35,4.4,.55],this.ink);
   this.ball('cat-spark',eye,[-1.4,2.2,2.2],[1.05,1.05,.5],this.glint);
   const parts=this.meshes.slice(eyeStart),lid=this.line('cat-closed-eye',eye,[[-4,0,1.8],[-2,-1,2.4],[0,-1.3,2.7],[2,-1,2.4],[4,0,1.8]],.44,this.ink);lid.setEnabled(false);this.eyeParts.push({parts,lid});
   this.ball('cat-muzzle',this.head,[side*3.5,-5.9,11.9],[5.3,4.2,3.1],this.light);
   this.line('cat-whisker',this.head,[[side*5,-5.5,14],[side*12,-5,14.5],[side*21,-3.2,13]],.24,this.light);
   this.line('cat-whisker',this.head,[[side*5,-7,14],[side*13,-8.5,14],[side*20,-9.8,12]],.2,this.light);
  }
  this.ball('cat-nose',this.head,[0,-4.4,15],[2.1,1.5,1.2],this.ink);
  this.line('cat-mouth',this.head,[[0,-5.5,15],[0,-8,15],[-2.1,-9,14.7]],.29,this.ink);
  this.line('cat-mouth',this.head,[[0,-8,15],[2.1,-9,14.7]],.29,this.ink);
  for(const front of [false,true])for(const side of [-1,1]){
   const hip=new B.TransformNode('cat-leg-pivot',scene);hip.parent=this.root;hip.position=new B.Vector3(side*8.5,24,front?16:-16);
   this.ball('cat-leg',hip,[0,-9,0],[4.4,11.5,4.7],this.coat);
   const paw=this.ball('cat-paw',hip,[0,-21,2],[5.1,3.3,6.5],this.dark);
   this.legs.push({hip,paw,front,side});
  }
  this.haunches=[-1,1].map(side=>this.ball('cat-haunch',this.root,[side*10,13,-11],[9,12.5,13],this.coat));
  this.tailPath=Array.from({length:19},()=>new B.Vector3());this.tail=B.MeshBuilder.CreateTube('cat-tail',{path:this.tailPoints(0,0),radius:2.8,radiusFunction:i=>2.8*(1-i/22),tessellation:10,cap:3,updatable:true},scene);this.tail.parent=this.root;this.tail.material=this.coat;this.tail.isPickable=false;this.meshes.push(this.tail);
  // Soft, horizontal contact shadow, separate from the cached architectural
  // shadow map. It stays attached to the paws throughout every pose.
  this.shadow=B.MeshBuilder.CreateDisc('cat-contact-shadow',{radius:1,tessellation:40,sideOrientation:B.Mesh.DOUBLESIDE},scene);this.shadow.rotation.x=Math.PI/2;this.shadow.isPickable=false;
  const shadowMaterial=this.material('cat-contact','#282026',0);shadowMaterial.disableLighting=true;shadowMaterial.emissiveColor=B.Color3.FromHexString('#282026');shadowMaterial.alpha=.27;const soft=document.createElement('canvas');soft.width=soft.height=128;const context=soft.getContext('2d'),gradient=context.createRadialGradient(64,64,9,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.7)');gradient.addColorStop(.5,'rgba(0,0,0,.25)');gradient.addColorStop(1,'rgba(0,0,0,0)');context.fillStyle=gradient;context.fillRect(0,0,128,128);shadowMaterial.diffuseTexture=this.owner.texture(soft);shadowMaterial.useAlphaFromDiffuseTexture=true;shadowMaterial.disableDepthWrite=true;this.shadow.material=shadowMaterial;this.shadow.scaling=new B.Vector3(24,35,1);this.root.setEnabled(false);this.shadow.setEnabled(false);
  // A restrained toon key keeps the Chartreux's slate coat grey beneath the
  // very warm architecture light; a small amber fill still places it at sunset.
  for(const light of [...scene.lights])light.excludedMeshes.push(...this.meshes);
  this.softLight=new B.HemisphericLight('cat-soft-key',new B.Vector3(-.45,1,.7),scene);this.softLight.intensity=.72;this.softLight.diffuse=new B.Color3(.83,.9,1);this.softLight.groundColor=new B.Color3(.28,.3,.36);this.softLight.includedOnlyMeshes=this.meshes;
  this.rimLight=new B.DirectionalLight('cat-amber-edge',new B.Vector3(.7,-.38,-1),scene);this.rimLight.intensity=.26;this.rimLight.diffuse=new B.Color3(1,.48,.17);this.rimLight.includedOnlyMeshes=this.meshes;

 }
 tailPoints(sit,time,sleep=0){
  const B=this.B;for(let i=0;i<this.tailPath.length;i++){
   const t=i/(this.tailPath.length-1),sway=Math.sin(time*.9)*t*t*4;
   const standing=[Math.sin(t*2.7)*8+sway,29+t*20+Math.sin(t*Math.PI)*8,-23-t*24];
   const seated=[Math.sin(t*Math.PI*1.25)*19,5+Math.sin(t*Math.PI)*4,-20+Math.sin(t*2.1)*36];
   this.tailPath[i].set(lerp(standing[0],seated[0],sit),lerp(standing[1],seated[1],sit),lerp(standing[2],seated[2],sit));
   const curled=[Math.sin(t*Math.PI*.9)*24,7*(1-t)+3.3*t,-23+t*45];if(sleep)this.tailPath[i].set(lerp(this.tailPath[i].x,curled[0],sleep),lerp(this.tailPath[i].y,curled[1],sleep),lerp(this.tailPath[i].z,curled[2],sleep));
  }return this.tailPath;
 }
 advance(dt){
  const width=this.owner.viewWidth||1950,previous=this.state.visible;
  this.timeline.advance(dt,{left:620-width/2-130,right:620+width/2+130});this.state=this.timeline.sample(this.reduced.matches);
  this.owner.canvas.dataset.catState=this.state.phase;
  return previous!==this.state.visible;
 }
 apply(){
  const s=this.state;if(!this.root)return;
  this.root.setEnabled(s.visible);this.shadow.setEnabled(s.visible);if(!s.visible)return;
  this.root.position.copyFrom(this.owner.vec(s.x,s.y,s.z));this.root.rotation.y=s.yaw;
  const sleep=s.sleep||0,bob=Math.abs(Math.sin(s.gait))*s.walk*1.1,breath=Math.sin(s.t*1.55)*sleep*.32;
  this.root.rotation.x=s.pitch||0;
  this.body.position.y=lerp(28+s.sit*3+bob-s.crouch*6,15.5,sleep)+breath;this.body.position.z=lerp(-s.sit*4,-1,sleep);this.body.rotation.x=lerp(-s.sit*.8,0,sleep);this.body.scaling.y=lerp(15,13.5,sleep);
  this.chest.position.y=lerp(36+s.sit*7+bob-s.crouch*5,22,sleep)+breath;this.chest.position.z=lerp(15-s.sit*4,13,sleep);this.chest.scaling.y=lerp(15,10,sleep);
  this.head.position.set(0,lerp(46+s.sit*9+bob-s.crouch*5,17,sleep)+breath*.3,lerp(23-s.sit*9,25,sleep));this.head.rotation.x=sleep*.2;this.head.rotation.y=(-s.yaw*.24+Math.sin(s.t*.55+s.seed)*.1*s.sit)*(1-sleep);this.head.rotation.z=lerp(Math.sin(s.t*.45+s.seed)*.035*s.sit,-.16,sleep);
  for(let i=0;i<this.eyes.length;i++){this.eyes[i].scaling.y=sleep>.5?1:s.blink;for(const part of this.eyeParts[i].parts)part.setEnabled(sleep<=.5);this.eyeParts[i].lid.setEnabled(sleep>.5);}
  for(const {hip,paw,front,side}of this.legs){
   const stride=Math.sin(s.gait+(front?0:Math.PI)+(side>0?Math.PI:0))*s.walk*(1-s.sit)*(1-sleep);
   const legScale=lerp(front?1+s.sit*.13:1-s.sit*.45,front?.3:.25,sleep)*(1-s.crouch*.22-s.tuck*.25);
   hip.rotation.x=stride*.42-s.tuck*(front?.5:-.45);hip.scaling.y=legScale;hip.position.y=24.3*legScale+Math.max(0,stride)*2.2;hip.position.z=lerp(front?16+s.sit*2:-16+s.sit*6,front?25:-14,sleep);paw.rotation.x=-hip.rotation.x;
  }
  for(const h of this.haunches){h.setEnabled(s.sit>.02||sleep>.02);h.position.y=lerp(13,9.7,sleep);h.scaling.y=lerp(12.5,9.5,sleep);}
  this.B.MeshBuilder.CreateTube('cat-tail',{path:this.tailPoints(s.sit,s.t*(1-sleep*.9),sleep),instance:this.tail});
  this.shadow.position.copyFrom(this.owner.vec(s.x+4,s.groundY-.14,s.z-4));this.shadow.scaling.x=lerp(24-s.sit*4,25,sleep)*(1-s.jump/160);this.shadow.scaling.y=lerp(35-s.sit*11,34,sleep)*(1-s.jump/160);this.shadow.material.alpha=.27*(1-s.jump/110);
 }

 drawCanvas(ctx){
  const s=this.state;if(!s.visible)return;const scale=1.15,cx=s.x,cy=1165+(s.z+55)*.2,sleep=s.sleep||0;
  ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);
  ctx.fillStyle='#201d2633';ctx.beginPath();ctx.ellipse(3,1,s.sit>0.5?19:29,5,0,0,Math.PI*2);ctx.fill();ctx.translate(0,-s.jump/scale);
  ctx.lineCap='round';ctx.lineWidth=5;ctx.strokeStyle='#4e5a6c';ctx.beginPath();ctx.moveTo(-18,-24);ctx.bezierCurveTo(-38,-27,-36,-57,-26,-55);ctx.stroke();
  ctx.fillStyle='#4e5a6c';ctx.beginPath();ctx.ellipse(0,lerp(-28,-15,sleep),24-s.sit*10,lerp(14+s.sit*13,13,sleep),0,0,Math.PI*2);ctx.fill();
  for(let i=0;i<4;i++){const x=(i<2?-14:15)+(i%2)*4,y=-3+Math.max(0,Math.sin(s.gait+i*Math.PI)*s.walk)*3;ctx.fillRect(x-3,lerp(-23,-7,sleep),6,lerp(21,5,sleep));ctx.beginPath();ctx.ellipse(x+2,y,6,3.5,0,0,Math.PI*2);ctx.fill();}
  const hx=(1-s.sit)*(s.yaw<0?-19:19),hy=lerp(-47-s.sit*9,-18,sleep);
  ctx.translate(hx,hy);ctx.beginPath();ctx.moveTo(-15,-4);ctx.lineTo(-14,-25);ctx.lineTo(-3,-14);ctx.lineTo(5,-14);ctx.lineTo(14,-25);ctx.lineTo(15,-4);ctx.fill();ctx.beginPath();ctx.ellipse(0,0,16,14,0,0,Math.PI*2);ctx.fill();
  for(const side of [-1,1]){if(sleep>.5){ctx.strokeStyle='#242a31';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(side*6-4,0);ctx.quadraticCurveTo(side*6,2,side*6+4,0);ctx.stroke();continue;}ctx.fillStyle='#dbb34c';ctx.beginPath();ctx.ellipse(side*6,0,5,6*s.blink,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#242a31';ctx.beginPath();ctx.ellipse(side*6,0,1.3,4*s.blink,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff2cf';ctx.beginPath();ctx.arc(side*6-1.2,-2*s.blink,.8,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#778393';for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*3.5,7,4,3,0,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#282d34';ctx.beginPath();ctx.moveTo(-2,5);ctx.lineTo(2,5);ctx.lineTo(0,7);ctx.fill();ctx.restore();
 }
 toCanvas(){this.root=null;this.shadow=null;this.meshes=[];}
 dispose(){this.softLight?.dispose();this.rimLight?.dispose();this.root?.dispose();this.shadow?.dispose();for(const m of this.materials)m.dispose();}
}
