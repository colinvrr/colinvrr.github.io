import {hingePoint, solveArm, poseTargets, blendPole, danceFrame, capturedWalk, DANCE_STYLES} from './resident-motion.mjs?v=50';
import {loft, paintedMaterial, sculptedHead, hairLock, hand} from './ps2-characters.mjs?v=48';
import {pavementY} from './street-ground.mjs';
import {FACADES, centeredBays} from './facade-layout.mjs';
export const RESIDENT_WINDOW={x:centeredBays(FACADES.haussmann,3,200)[0],y:40,width:200,height:356};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>{v=clamp(v);return v*v*v*(v*(v*6-15)+10);};
const mix=(a,b,t)=>a+(b-a)*t;
// Decisions belong to a visit, never to a rendered frame. The application clock
// advances this timeline, so hidden tabs and scene transitions freeze it too.
export class ResidentTimeline {
 constructor({berlin=false,random=Math.random,firstDelay}={}){this.berlin=berlin;this.random=random;this.time=0;this.visit=null;this.visits=0;this.nextAt=firstDelay??this.range(5,9);}
 range(a,b){return a+(b-a)*this.random();}
 begin(bounds={left:-500,right:1740}){
  const direction=this.random()<.5?1:-1,speed=this.range(67,87),margin=Math.min(180,(bounds.right-bounds.left)*.2);
  const stop=this.berlin?clamp(this.range(330,880),bounds.left+margin,bounds.right-margin):this.range(114,132),z=this.berlin?this.range(80,121):this.range(132,140),pose=Math.floor(this.random()*4);
  const order=[...DANCE_STYLES];for(let i=order.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}if(order[0]===this.lastDance)[order[0],order[1]]=[order[1],order[0]];this.lastDance=order[0];
  const v={startAt:this.time,stop,z,pose,direction,seed:this.range(0,6.28),danceOrder:order,dancePeriod:this.range(6.5,8.5),danceTempo:this.range(.9,1.1),phases:[]};let at=0;
  const add=(kind,duration,extra={})=>{v.phases.push({kind,at,duration,...extra});at+=duration;};
  if(this.berlin){
   const from=direction>0?bounds.left:bounds.right,to=direction>0?bounds.right:bounds.left;
   add('walk',Math.abs(stop-from)/speed,{from,to:stop,direction});
   add('dance',this.range(32,48));
   const next=clamp(stop+direction*this.range(150,260),bounds.left+margin,bounds.right-margin);
   add('walk',Math.max(1.2,Math.abs(next-stop)/speed),{from:stop,to:next,direction:Math.sign(next-stop)||direction});
   add('dance',this.range(24,36),{x:next});
   add('leave',Math.abs(to-next)/speed,{from:next,to,direction});
  }else{
   add('window-open',2.6);add('window-look',this.range(3.5,6.5));add('window-close',2.5);
   add('inside',2.4);add('door-open',2.7);add('step-out',2.8);add('door-close',2.6);
   add('walk',1.15,{from:95,to:stop,direction:1});
   add('dance',this.range(52,68));
   add('return',1.35,{from:stop,to:95,direction:-1});
   add('door-reopen',2.7);add('step-in',2.8);add('door-shut',2.9);
  }
  v.duration=at;this.visit=v;this.visits++;return v;
 }
 advance(dt,bounds){
  this.time+=clamp(dt,0,.12);
  if(this.visit&&this.time-this.visit.startAt>=this.visit.duration){this.visit=null;this.nextAt=this.time+this.range(this.berlin?12:22,this.berlin?27:42);}
  if(!this.visit&&this.time>=this.nextAt)this.begin(bounds);
  return this.sample();
 }
 sample(reduced=false,avoid){
  const v=this.visit;if(!v)return {visible:false,phase:'absent',windowOpen:0,doorOpen:0};
  const t=Math.max(0,this.time-v.startAt),s=v.phases.find(p=>t<p.at+p.duration)||v.phases.at(-1),local=t-s.at,p=clamp(local/s.duration),e=ease(p),phase=s.kind;
  let x=s.x??v.stop,z=v.z,y=pavementY(z),yaw=0,walk=0,gait=0,dance=0,pose=0,reach=0,windowOpen=0,doorOpen=0,visible=true,atWindow=false;
  let interaction=null,danceStyle=v.danceOrder[0],danceNext=danceStyle,danceBlend=0,danceTime=0;
  const contact=(kind,side,surface,weight)=>{interaction={kind,side,surface,weight:clamp(weight)};reach=interaction.weight;};
  if(phase.startsWith('window')){
   atWindow=true;x=RESIDENT_WINDOW.x+100;y=450;yaw=0;
   const swing=ease((p-.2)/.6);
   windowOpen=phase==='window-open'?swing:phase==='window-close'?1-swing:1;
   z=-66-72*windowOpen;
   if(phase!=='window-look')contact('window',0,'inside',ease(p/.18)*ease((1-p)/.18));
   visible=phase==='window-look'||windowOpen>.005||(phase==='window-open'&&p>.06)||(phase==='window-close'&&p<.94);
  }else if(phase==='inside'){visible=false;}
  else if(['door-open','step-out','door-close','door-reopen','step-in','door-shut'].includes(phase)){
   const swing=ease((p-.18)/.62);
   if(phase==='door-open'){
    doorOpen=swing;x=95-25*ease((p-.18)/.7);z=-112-123*ease((p-.18)/.65);yaw=-(Math.PI/2)*ease((p-.65)/.35);
    contact('door',-1,'inside',ease(p/.16)*ease((.74-p)/.24));
   }else if(phase==='step-out'){
    doorOpen=1;x=70;z=mix(-235,-15,e);yaw=-Math.PI/2;
   }else if(phase==='door-close'){
    doorOpen=1-ease((p-.22)/.6);x=70+25*ease((p-.2)/.8);z=mix(-15,v.z,ease((p-.15)/.85))+36*Math.sin(p*Math.PI)**2;yaw=-(Math.PI/2)*(1-ease((p-.6)/.4));
    contact('door',-1,'outside',ease(p/.18)*ease((1-p)/.15));
   }else if(phase==='door-reopen'){
    doorOpen=swing;x=95-25*ease((p-.65)/.35);z=mix(v.z,60,ease(p/.5))-75*ease((p-.7)/.3);yaw=-Math.PI-(Math.PI/2)*ease((p-.7)/.3);
    contact('door',1,'outside',ease(p/.16)*ease((.64-p)/.24));
   }else if(phase==='step-in'){
    doorOpen=1;x=70;z=mix(-15,-210,e);yaw=-Math.PI*1.5;
   }else{
    doorOpen=1-ease((p-.35)/.5);x=70+25*ease((p-.82)/.18);z=-210+98*ease((p-.35)/.5);yaw=-Math.PI*1.5-(Math.PI/2)*ease(p/.28);
    contact('door',1,'inside',ease((p-.16)/.2)*ease((.94-p)/.24));visible=p<.995;
   }
   y=mix(1154,pavementY(v.z),clamp((z+15)/(v.z+15)));
   walk=Math.sin(p*Math.PI)*(phase.startsWith('step')?1:.32);gait=(z+235)*.075;
  }else if(['walk','leave','return'].includes(phase)){
   x=mix(s.from,s.to,e);yaw=s.direction*1.05;gait=Math.abs(x-s.from)*.075;
   walk=clamp(30*p*p*(1-p)*(1-p)*Math.abs(s.to-s.from)/s.duration/72);
  }else if(phase==='dance'){
   dance=ease(local/.65)*ease((s.duration-local)/.9);danceTime=local;const slot=Math.floor(local/v.dancePeriod),within=local-slot*v.dancePeriod;
   danceStyle=v.danceOrder[slot%v.danceOrder.length];danceNext=v.danceOrder[(slot+1)%v.danceOrder.length];danceBlend=ease((within-(v.dancePeriod-1.5))/1.5);
  }
  else if(phase==='pose')pose=ease(local/1.7)*ease((s.duration-local)/1.7);
  if(avoid?.visible&&!atWindow&&visible&&['walk','leave','return'].includes(phase)){
   const rawX=clamp(1-Math.abs(x-avoid.x)/220),rawZ=clamp(1-Math.abs(v.z-avoid.z)/250);
   const xProximity=rawX*rawX*(3-2*rawX),zProximity=rawZ*rawZ*(3-2*rawZ);
   z=v.z+(avoid.x>=x?1:-1)*220*xProximity*zProximity;y=pavementY(z);
  }
  // Settle and turn continuously at the ends of each walk.
  if(['walk','leave','return'].includes(phase)){yaw*=ease(p*6)*ease((1-p)*6);if(phase==='return')yaw=mix(yaw,-Math.PI,ease((p-.55)/.45));}
  if(reduced){walk=gait=dance=0;reach=0;interaction=null;if(!atWindow&&visible&&!phase.startsWith('door')&&!phase.startsWith('step')){x=v.stop;y=pavementY(v.z);z=v.z;yaw=0;}}
  return {visible:t<v.duration&&visible,phase,x,y,z,yaw,walk,gait,dance,danceStyle,danceNext,danceBlend,danceTime,danceTempo:v.danceTempo,pose,poseIndex:s.pose??v.pose,t,seed:v.seed,reach,interaction,phaseProgress:p,atWindow,windowOpen,doorOpen};
 }
}

// Preserve the existing detailed geometry and its materials, but keep an
// opening's moving leaf out of the static merged/frozen architectural meshes.
export function hingedPart(owner,name,pivot,build){
 const meshStart=owner.staticMeshes.length,recordStart=owner.records.length;build();
 const meshes=owner.staticMeshes.splice(meshStart),records=owner.records.splice(recordStart);
 let root;
 if(owner.engine){
  const B=owner.api;root=new B.TransformNode(name,owner.scene);root.position=owner.vec(...pivot);
  const groups=new Map();for(const mesh of meshes){const key=mesh.material.uniqueId;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);}
  for(const parts of groups.values()){const mesh=parts.length>1?B.Mesh.MergeMeshes(parts,true,true,undefined,false,false):parts[0];mesh.setParent(root);mesh.receiveShadows=true;}
 }
 const part={name,pivot,root,records,angle:0};owner.records.push({kind:'hinged',part,z:pivot[2]});return part;
}
export function drawHingedPart(ctx,part){
 ctx.save();ctx.translate(part.pivot[0],0);ctx.scale(Math.max(.08,Math.cos(part.angle)),1);ctx.translate(-part.pivot[0],0);
 for(const r of part.records){if(r.kind==='rect'){ctx.fillStyle=r.color;ctx.fillRect(r.x,r.y,r.w,r.h);if(r.map){ctx.globalAlpha=.15;ctx.drawImage(r.map,r.x,r.y,r.w,r.h);ctx.globalAlpha=1;}}
  else if(r.kind==='line'){ctx.strokeStyle=r.color;ctx.lineWidth=r.width;ctx.beginPath();r.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}}
 ctx.restore();
}

export class StreetResident {
 constructor(owner,options={}){
  this.owner=owner;this.B=owner.api;this.timeline=new ResidentTimeline({berlin:owner.place?.theme==='berlin',...options});this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
  this.state=this.timeline.sample();this.meshes=[];this.materials=[];this.arms=[];this.legs=[];if(owner.engine)this.build();this.apply();
 }
 material(name,color,emission=.08){const B=this.B,m=new B.StandardMaterial(name,this.owner.scene);m.diffuseColor=B.Color3.FromHexString(color);m.emissiveColor=m.diffuseColor.scale(emission);m.specularColor=new B.Color3(.035,.035,.035);m.specularPower=18;this.materials.push(m);return m;}
 ball(name,parent,p,scale,mat){const B=this.B,m=B.MeshBuilder.CreateSphere(name,{diameter:2,segments:8},this.owner.scene);m.parent=parent;m.position=new B.Vector3(...p);m.scaling=new B.Vector3(...scale);m.material=mat;m.isPickable=false;m.receiveShadows=true;m.convertToFlatShadedMesh();this.meshes.push(m);return m;}
 box(name,parent,p,size,mat){const B=this.B,m=B.MeshBuilder.CreateBox(name,{width:size[0],height:size[1],depth:size[2]},this.owner.scene);m.parent=parent;m.position=new B.Vector3(...p);m.material=mat;m.isPickable=false;this.meshes.push(m);return m;}
 node(name,parent,p){const B=this.B,n=new B.TransformNode(name,this.owner.scene);n.parent=parent;n.position=new B.Vector3(...p);return n;}
 cylinder(name,parent,p,height,top,bottom,mat){const B=this.B,m=B.MeshBuilder.CreateCylinder(name,{height,diameterTop:top,diameterBottom:bottom,tessellation:6},this.owner.scene);m.parent=parent;m.position=new B.Vector3(...p);m.material=mat;m.isPickable=false;m.receiveShadows=true;m.convertToFlatShadedMesh();this.meshes.push(m);return m;}
 build(){
  const B=this.B,scene=this.owner.scene;this.Quaternion=new B.Vector3().toQuaternion().constructor;
  this.skin=paintedMaterial(this,'resident-warm-skin','#c7a183','skin');this.hair=paintedMaterial(this,'resident-blonde','#e7c87e','hair');this.hairLight=paintedMaterial(this,'resident-golden-strands','#fae4a7','hair');this.hairShade=paintedMaterial(this,'resident-honey-underlayers','#bc934c','hair');
  this.jacket=paintedMaterial(this,'resident-ivory-blazer','#c1b9a4');this.top=paintedMaterial(this,'resident-knit-top','#304b48');this.trousers=paintedMaterial(this,'resident-wide-trousers','#252c37');
  this.shoe=this.material('resident-cream-sneakers','#e6e0ce');this.sole=this.material('resident-rubber-sole','#aaa88f');this.brown=this.material('resident-brown-irises','#704327',.08);this.ink=this.material('resident-ink','#332b29');this.white=this.material('resident-eye-white','#f5e8d9');this.lip=this.material('resident-lips','#a7675e');this.gold=this.material('resident-gold','#b99a55');
  this.root=this.node('blonde-street-resident',null,[0,0,0]);
  this.root.scaling.setAll(1.42);
  this.hips=loft(this,'resident-high-waist',this.root,[[113,25,15],[132,27,16],[140,24,14]],this.trousers);
  this.torso=this.node('resident-torso',this.root,[0,132,0]);
  loft(this,'resident-knit',this.torso,[[4,22,14],[37,25,15],[70,29,15],[80,19,12]],this.top);
  // Broad shoulders and a folded cloth silhouette replace the oval doll body.
  loft(this,'resident-blazer-back',this.torso,[[2,31,15,0,-4],[24,30,16,0,-5],[62,31,17,0,-5],[78,33,15,0,-5],[83,24,12,0,-5]],this.jacket,{sides:8});
  // The central panel is in front of the back of the jacket, leaving it open.
  loft(this,'resident-visible-top',this.torso,[[10,10,2,0,15],[52,13,3,0,16],[78,13,2,0,14]],this.top,{sides:6});
  for(const side of [-1,1]){
   loft(this,'resident-jacket-front',this.torso,[[1,10,4,side*22,13],[32,10,5,side*22,13],[64,11,5,side*23,13],[79,8,4,side*23,11]],this.jacket,{sides:5});
   const lapel=this.box('resident-folded-lapel',this.torso,[side*13,59,19],[8,36,2],this.jacket);lapel.rotation.z=side*.24;
   this.box('resident-jacket-pocket',this.torso,[side*23,25,19],[14,1.5,1],this.jacket);
  }
  this.box('resident-waistband',this.root,[0,137,18],[55,5,5],this.trousers);this.box('resident-belt-buckle',this.root,[0,137,22],[8,6,2],this.gold);
  loft(this,'resident-neck',this.torso,[[78,7,7],[99,6,7]],this.skin,{sides:7});
  this.head=this.node('resident-head',this.torso,[0,113,1]);this.head.scaling.setAll(.74);
  sculptedHead(this,this.head,{female:true});
  loft(this,'resident-hair-back',this.head,[[-66,21,9,0,-13],[-43,28,15,0,-13],[-15,29,19,0,-12],[15,26,19,0,-9],[29,22,16,0,-7],[35,10,8,0,-6]],this.hairShade,{sides:12});
  // Layered shoulder-length waves: a full nape, crown and separate tapered
  // locks, with a clear centre part and an unobstructed painted face.
  for(let i=0;i<13;i++){
   const a=.72+i*(Math.PI*2-1.44)/12,sn=Math.sin(a),cs=Math.cos(a),r=28+(i%3)*1.3;
   hairLock(this,'resident-layered-blonde-wave',this.head,[[sn*17,30,cs*12-6],[sn*25,15,cs*18-9],[sn*r,-8,cs*20-12],[sn*(r+2),-30,cs*17-13],[sn*(r-1),-49,cs*14-12],[sn*(r-4),-65+(i%3)*4,cs*12-10]],5.1,i%3===0?this.hairLight:this.hair);
  }
  for(const side of [-1,1]){
   hairLock(this,'resident-blonde-side-lock',this.head,[[side*2,32,12],[side*16,27,18],[side*24,12,17],[side*28,-9,14],[side*31,-30,13],[side*26,-55,11]],7.5,this.hair);
   hairLock(this,'resident-fine-blonde-lock',this.head,[[side*10,29,17],[side*21,15,20],[side*25,-6,18],[side*30,-26,17],[side*25,-49,14]],3.3,this.hairLight);
   hairLock(this,'resident-loose-strand',this.head,[[side*24,22,-1],[side*32,4,0],[side*28,-22,0],[side*31,-52,0]],4.2,this.hairLight);
   this.ball('resident-ear',this.head,[side*19,-1,0],[2.8,5,3],this.skin);
   const hoop=B.MeshBuilder.CreateTorus('resident-gold-earring',{diameter:6,thickness:.8,tessellation:14},scene);hoop.parent=this.head;hoop.position.set(side*20,-8,3);hoop.rotation.x=Math.PI/2;hoop.material=this.gold;hoop.isPickable=false;this.meshes.push(hoop);
  }
  for(const side of [-1,1]){
   const hip=this.node('resident-hip',this.root,[side*16,122,0]);
   loft(this,'resident-wide-trouser-thigh',hip,[[0,14,15],[-25,15,16],[-57,18,17]],this.trousers,{sides:7});
   const knee=this.node('resident-knee',hip,[0,-57,0]);
   loft(this,'resident-flared-trouser-leg',knee,[[0,18,17],[-28,19,17],[-56,22,18]],this.trousers,{sides:7});
   const shoe=this.node('resident-shoe-pivot',knee,[0,-58,0]);
   loft(this,'resident-sneaker-upper',shoe,[[0,12,19,0,7],[5,12,20,0,7],[9,8,11,0,2]],this.shoe,{sides:8,flat:true});
   this.box('resident-sneaker-sole',shoe,[0,-3,7],[27,4,42],this.sole);
   this.box('resident-sneaker-toe',shoe,[0,-.2,24],[24,3,11],this.shoe);
   for(let i=0;i<4;i++)this.box('resident-sneaker-lace',shoe,[0,8,9+i*3],[13,.8,1.2],this.shoe);
   this.legs.push({hip,knee,shoe,side});
   const shoulder=this.node('resident-shoulder',this.torso,[side*34,77,0]);
   loft(this,'resident-blazer-sleeve',shoulder,[[3,11,12],[-18,12,11],[-44,9,9]],this.jacket,{sides:7});
   const elbow=this.node('resident-elbow',this.torso,[side*34,33,0]);this.ball('resident-elbow-fold',elbow,[0,0,0],[8.5,8.5,8.5],this.jacket);loft(this,'resident-forearm-sleeve',elbow,[[0,9,9],[-18,9,8],[-36,7,7]],this.jacket,{sides:7});
   this.box('resident-cuff',elbow,[0,-35.5,0],[13.5,2.4,12.5],this.jacket);const wrist=this.node('resident-wrist',this.torso,[side*38,5,12]),palm=hand(this,wrist,side,this.skin);palm.scaling.setAll(.72);
   this.arms.push({shoulder,elbow,wrist,palm,side});
  }
  this.shadow=B.MeshBuilder.CreateDisc('resident-contact-shadow',{radius:1,tessellation:32,sideOrientation:B.Mesh.DOUBLESIDE},scene);this.shadow.rotation.x=Math.PI/2;this.shadow.isPickable=false;
  const mat=this.material('resident-shadow','#20232a',0);mat.disableLighting=true;mat.emissiveColor=B.Color3.FromHexString('#20232a');mat.alpha=.26;mat.disableDepthWrite=true;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d'),g=c.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'#000a');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(0,0,64,64);mat.diffuseTexture=this.owner.texture(canvas);mat.useAlphaFromDiffuseTexture=true;this.shadow.material=mat;this.shadow.scaling.set(64,34,1);
  for(const light of [...scene.lights])light.excludedMeshes.push(...this.meshes);
  this.key=new B.HemisphericLight('resident-soft-key',new B.Vector3(-.35,1,.8),scene);this.key.intensity=this.owner.place?.theme==='berlin'?1.02:.9;this.key.diffuse=new B.Color3(.94,.92,.87);this.key.groundColor=new B.Color3(.31,.34,.39);this.key.includedOnlyMeshes=this.meshes;
 }
 advance(dt,avoid){
  const width=this.owner.viewWidth||1950,previous=this.state;
  this.timeline.advance(dt,{left:620-width/2-100,right:620+width/2+100});this.state=this.timeline.sample(this.reduced.matches,avoid);
  this.owner.canvas.dataset.residentState=this.state.phase;
  return previous.visible!==this.state.visible||previous.phase!==this.state.phase;
 }
 apply(){
  const s=this.state,door=this.owner.residentDoor,windows=this.owner.residentWindows||[];
  this.owner.canvas.dataset.residentState=s.phase;this.owner.canvas.dataset.residentDance=s.phase==='dance'?s.danceStyle||DANCE_STYLES[0]:'';
  for(let i=0;i<windows.length;i++){const part=windows[i];part.angle=(i===0?1:-1)*s.windowOpen*1.1;if(part.root)part.root.rotation.y=part.angle;}
  if(door){door.angle=-s.doorOpen*1.27;if(door.root)door.root.rotation.y=door.angle;}
  this.owner.canvas.dataset.residentWindow=String((s.windowOpen||0).toFixed(3));this.owner.canvas.dataset.residentDoor=String((s.doorOpen||0).toFixed(3));
  if(!this.root)return;this.root.scaling.setAll(s.atWindow?1.15:1.42);this.root.setEnabled(s.visible);this.shadow.setEnabled(s.visible&&!s.atWindow&&s.z>-20);if(!s.visible)return;
  const t=s.t||0,d=s.dance||0,pose=s.pose||0,gait=s.gait||0,walk=s.walk||0,seed=s.seed||0,walking=/^(walk|leave|return)$/.test(s.phase),motion=walking?capturedWalk(s):danceFrame(s),weight=walking?walk:d,interacting=!!s.interaction;
  this.root.position.copyFrom(this.owner.vec(s.x+motion.x*d,s.y,s.z+motion.z*d));this.root.rotation.set(0,s.yaw+motion.yaw*d,0);
  this.torso.rotation.set(interacting?0:(s.atWindow?.025:0)+(motion.pitch||0)*weight,interacting?0:Math.sin(t*.45)*pose*.035+motion.twist*weight,interacting?0:motion.lean*weight+Math.sin(t*1.9)*pose*.012);
  this.torso.position.y=132+Math.sin(t*1.4)*.25+motion.bob*weight;
  this.head.rotation.set(Math.sin(t*.55)*.018+(interacting?.08:0)+motion.headPitch*weight,Math.sin(t*.35+seed)*(pose*.12+(s.phase==='look'?.24:.025))+motion.headYaw*weight,Math.sin(t*.5)*pose*.025+motion.headRoll*weight);
  let lowest=Infinity;
  const B=this.B;
  for(const {hip,knee,shoe,side}of this.legs){
   const step=Math.sin(gait+(side>0?Math.PI:0))*walk;
   const leg=motion.legs[side<0?0:1];
   if(weight>0){
    const Q=this.Quaternion,down=new B.Vector3(0,-1,0),rest=[Math.sin(side*.035),-Math.cos(.035),0],direction=v=>new B.Vector3(...v.map((n,i)=>mix(rest[i],n,weight))).normalize(),upper=direction(leg.upper),lower=direction(leg.lower);
    const upperQ=Q.FromUnitVectorsToRef(down,upper,new Q()),lowerQ=Q.FromUnitVectorsToRef(down,lower,new Q());
    const footPitch=-Math.atan2(leg.foot[1],Math.hypot(leg.foot[0],leg.foot[2]))*weight,footYaw=clamp(leg.yaw,-.65,.65)*weight,footQ=Q.RotationYawPitchRoll(footYaw,clamp(footPitch,-.4,.4),0);
    hip.rotationQuaternion=upperQ;knee.rotationQuaternion=upperQ.conjugate().multiply(lowerQ);shoe.rotationQuaternion=lowerQ.conjugate().multiply(footQ);
    // Retarget directions, never source bone lengths. Test the shoe corners
    // against the floor so the supporting sole stays planted during bends.
    const footY=122+57*upper.y+58*lower.y;
    for(const x of [-13.5,13.5])for(const z of [-14,29]){const point=new B.Vector3(x,-5,z).rotateByQuaternionToRef(footQ,new B.Vector3());lowest=Math.min(lowest,footY+point.y);}
   }else{
    hip.rotationQuaternion=knee.rotationQuaternion=shoe.rotationQuaternion=null;
    hip.rotation.set(step*.3,0,side*.035);knee.rotation.x=-Math.max(0,-step)*.36;shoe.rotation.set(-hip.rotation.x-knee.rotation.x,0,-hip.rotation.z);
    lowest=Math.min(lowest,122-57*Math.cos(hip.rotation.x)*Math.cos(hip.rotation.z)-58*Math.cos(hip.rotation.x+knee.rotation.x)*Math.cos(hip.rotation.z)-5);
   }
  }
  // Keep the support sole on the real floor rather than bouncing both feet.
  this.root.position.y-=lowest*this.root.scaling.y;
  this.root.computeWorldMatrix(true);this.torso.computeWorldMatrix(true);
  const world=this.torso.getWorldMatrix(),inverse=world.clone().invert(),origin=this.owner.vec(0,0,0),scale=this.root.scaling.x;
  const facade=v=>[v.x-origin.x,origin.y-v.y,v.z],local=p=>B.Vector3.TransformCoordinates(this.owner.vec(...p),inverse);
  const orient=(node,a,b)=>{const delta=b.subtract(a);node.rotation.set(Math.atan2(-delta.z,-delta.y),0,Math.atan2(delta.x,Math.hypot(delta.y,delta.z)));};
  const panels=s.atWindow?[...windows,...(this.owner.residentWindowObstacles||[])]:(!this.timeline.berlin&&/^(door|step)/.test(s.phase)?[door,...(this.owner.residentDoorObstacles||[])].filter(Boolean):[]);
  this.contacts=[];
  for(const arm of this.arms){
   const {shoulder,elbow,wrist,side}=arm,authored=poseTargets(s,side,motion),start=facade(B.Vector3.TransformCoordinates(new B.Vector3(side*34,77,0),world));
   const stow=panels.length&&!s.atWindow?(s.phase==='door-close'?1-ease((s.phaseProgress-.82)/.18):s.phase==='door-reopen'?ease(s.phaseProgress/.16):1):0;
   const tucked=[side*25,8,12],baseWrist=authored.wrist.map((v,i)=>mix(v,tucked[i],stow)),basePole=authored.pole.map((v,i)=>mix(v,[side*30,15,-10][i],stow));
   let target=facade(B.Vector3.TransformCoordinates(new B.Vector3(...baseWrist),world)),pole=facade(B.Vector3.TransformCoordinates(new B.Vector3(...basePole),world)),part=null,grip=null,weight=0;
   const action=s.interaction;
   if(action&&(action.kind==='window'||action.side===side)){
    part=action.kind==='window'?windows[side<0?0:1]:door;
    if(part?.contacts){
     grip=hingePoint(part,part.contacts[action.surface]);const desired=[grip[0],grip[1]-6*scale,grip[2]];weight=action.weight;
     const rest=target;
     if(action.kind==='window'||action.surface==='inside'){
      const box=part.collisionBox,free=action.kind==='window'?(side<0?box.max[0]+30:box.min[0]-30):box.min[0]-18,control=hingePoint(part,[free,mix(desired[1],rest[1],.45),part.pivot[2]-45]);
      target=rest.map((v,i)=>weight*weight*desired[i]+2*weight*(1-weight)*control[i]+(1-weight)*(1-weight)*v);
     }else target=target.map((v,i)=>mix(v,desired[i],weight));
     const sign=action.surface==='inside'?-1:1,normal=[Math.sin(part.angle)*sign,0,Math.cos(part.angle)*sign];
     const contactPole=start.map((v,i)=>v+normal[i]*40+(i===0?side*22:i===1?25:0));if(action.kind==='window')pole=blendPole(start,target,pole,contactPole,weight);

    }
   }
   const solution=solveArm(start,target,pole,44*scale,39*scale,panels,7.8*scale),a=local(start),e=local(solution.elbow),w=local(solution.wrist);
   shoulder.position.copyFrom(a);elbow.position.copyFrom(e);wrist.position.copyFrom(w);orient(shoulder,a,e);orient(elbow,e,w);wrist.rotation.copyFrom(elbow.rotation);
   if(part&&weight>0){
    const desiredY=part.angle-this.root.rotation.y,delta=Math.atan2(Math.sin(desiredY-wrist.rotation.y),Math.cos(desiredY-wrist.rotation.y));
    const orientWeight=ease(weight/.55);wrist.rotation.x*=1-orientWeight;wrist.rotation.z*=1-orientWeight;wrist.rotation.y+=delta*orientWeight;
   }
   arm.contact={phase:s.phase,side,weight,bend:solution.angle,error:solution.error,hits:solution.hits,shoulder:start,elbow:solution.elbow,wrist:solution.wrist,target,grip,part:part?.name};this.contacts.push(arm.contact);
  }
  this.shadow.position.copyFrom(this.owner.vec(s.x+motion.x*d+3,pavementY(s.z+motion.z*d)-.3,s.z+motion.z*d-3));
 }
 bounds(){
  const s=this.state,regions=[];
  if(s.visible)regions.push(this.owner.projectBounds(s.x-210,s.x+210,s.y-500,s.y+24,s.z-210,s.z+210));
  if(s.windowOpen>0)regions.push(this.owner.projectBounds(5,290,15,435,-175,150));
  if(s.doorOpen>0)regions.push(this.owner.projectBounds(-15,215,575,1180,-230,45));
  if(!regions.length)return null;
  return {left:Math.min(...regions.map(r=>r.left)),right:Math.max(...regions.map(r=>r.right)),bottom:Math.min(...regions.map(r=>r.bottom)),top:Math.max(...regions.map(r=>r.top))};
 }
 drawCanvas(ctx){
  const s=this.state;if(!s.visible)return;ctx.save();if(s.atWindow){ctx.beginPath();ctx.rect(RESIDENT_WINDOW.x+6,44,188,350);ctx.clip();}
  ctx.translate(s.x,s.y);const step=Math.sin(s.gait||0)*(s.walk||0)*10;
  ctx.fillStyle='#334351';for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*16-14,-133);ctx.lineTo(side*16+14,-133);ctx.lineTo(side*16+23,-7+side*step);ctx.lineTo(side*16-23,-7+side*step);ctx.fill();ctx.fillStyle='#e6e0ce';ctx.fillRect(side*16-17,-9+side*step,37,11);ctx.fillStyle='#334351';}
  ctx.fillStyle='#d1c8ab';ctx.beginPath();ctx.ellipse(0,-179,36,49,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d1c8ab';ctx.lineWidth=17;ctx.lineCap='round';for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*30,-203);ctx.lineTo(side*(s.pose?53:40),-157);ctx.lineTo(side*37,-125);ctx.stroke();}
  ctx.fillStyle='#d4b36c';ctx.beginPath();ctx.ellipse(0,-251,31,40,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d7a481';ctx.beginPath();ctx.ellipse(0,-251,23,30,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e9ce8e';ctx.beginPath();ctx.ellipse(0,-274,26,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#704327';for(const x of [-9,9]){ctx.beginPath();ctx.ellipse(x,-250,3,3.3,0,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#a7675e';ctx.fillRect(-5,-236,10,2);ctx.restore();
 }
 toCanvas(){this.root=this.shadow=null;this.meshes=[];}
 dispose(){this.key?.dispose();this.root?.dispose();this.shadow?.dispose();for(const mat of this.materials)mat.dispose();}
}
