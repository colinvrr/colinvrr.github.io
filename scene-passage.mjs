import {pavementY} from './street-ground.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
const mix=(a,b,p)=>a+(b-a)*p;
export function passagePose(x,z,time,{walk=1,sit=0,sleep=0,yaw=1.25,seed=1,gait=0}={}){
 const groundY=pavementY(z);
 return {visible:true,phase:'passage',x,z,y:groundY,groundY,sit,sleep,yaw,gait,walk,jump:0,crouch:0,tuck:0,pitch:0,blink:1,t:time,seed};
}
// Driven by the application's existing visible-frame clock. No private timer
// or RAF can continue the story behind a hidden tab or after cancellation.
export class CatPassage {
 constructor({getScene,machine,mask,reduced=()=>false,visible=()=>true,onSwap,onComplete,onError=()=>{}}){
  Object.assign(this,{getScene,machine,mask,reduced,visible,onSwap,onComplete,onError});this.active=false;this.version=0;
  this.onClick=()=>this.skip();mask?.addEventListener?.('click',this.onClick);
 }
 start(){
  if(this.active)return;
  this.active=true;this.paused=false;this.phase='out';this.time=0;this.version++;
  const scene=this.getScene(),s=scene.cat?.state,width=scene.viewWidth||1500;
  this.origin=s?.visible?{...s}:passagePose(95,80,0,{walk:0,sit:1});
  this.origin.x=Math.max(620-width*.35,Math.min(620+width*.35,this.origin.x));
  this.targetX=Math.max(this.origin.x+width*.15,620+width*.2);
  if(this.mask)this.mask.hidden=!this.visible();
  this.machine?.setAttribute?.('aria-busy','true');if(this.machine?.dataset)this.machine.dataset.travelling='true';
  if(this.visible()){if(this.reduced())this.swap();else this.drawOut();}
 }
 tick(dt){
  if(!this.active||!this.visible())return;
  if(this.mask)this.mask.hidden=false;
  if(this.paused||this.phase==='loading')return;
  if(this.reduced()){if(this.phase==='out')this.swap();else this.finish();return;}
  this.time+=Math.max(0,Math.min(.1,dt));
  if(this.phase==='out'){this.drawOut();if(this.time>=5.8)this.swap();}
  else{this.drawIn();if(this.time>=2.8)this.finish();}
 }
 dimensions(){
  const r=this.machine?.getBoundingClientRect?.()||{left:0,top:0,width:390,height:844};
  return {...r,left:r.left||0,top:r.top||0,width:r.width||390,height:r.height||844};
 }
 lens(radius,zoom){
  const scene=this.getScene(),r=this.dimensions(),p=scene.catFocusPoint?.()||{x:r.width*.5,y:r.height*.36};
  const edge=Math.min(radius+8,Math.min(r.width,r.height)*.32),weight=clamp((zoom-1)/1.6);
  const dx=(Math.max(edge,Math.min(r.width-edge,p.x))-p.x)*weight,dy=(Math.max(edge,Math.min(r.height-edge,p.y))-p.y)*weight;
  if(scene.canvas?.style){scene.canvas.style.transformOrigin=`${p.x}px ${p.y}px`;scene.canvas.style.transform=zoom===1?'':`translate(${dx}px, ${dy}px) scale(${zoom})`;}
  if(this.mask){this.mask.style.cssText=`--iris-x:${r.left+p.x+dx}px;--iris-y:${r.top+p.y+dy}px;--iris-radius:${radius}px;`;this.mask.dataset.phase=this.phase;}
 }
 drawOut(){
  const t=this.time,s=this.origin,wake=ease(t/1.1),walkProgress=clamp((t-2.1)/3.7),x=mix(s.x,this.targetX,ease(walkProgress));
  const pose=passagePose(x,s.z,s.t+t,{walk:ease(walkProgress*5),sit:(s.sit||0)*(1-wake),sleep:(s.sleep||0)*(1-wake),yaw:mix(s.yaw||0,1.25,wake),seed:s.seed||1,gait:(s.gait||0)+(x-s.x)*.18});
  pose.jump=(s.jump||0)*(1-wake);pose.y-=pose.jump;
  this.getScene().setCatJourneyPose?.(pose);
  const r=this.dimensions(),full=Math.hypot(r.width,r.height)*1.3,small=Math.min(100,r.width*.23),close=ease((t-.65)/1.45),fade=ease((t-5.25)/.55);
  this.lens(mix(full,small,close)*(1-fade),mix(1,2.6,close));
 }
 async swap(){
  if(!this.active||this.phase==='loading')return;
  this.phase='loading';this.lens(0,2.6);const version=this.version;
  try{
   await this.onSwap();
   if(!this.active||version!==this.version)return;
   this.phase='in';this.time=0;
   if(!this.visible())return;
   if(this.reduced())this.finish();else this.drawIn();
  }catch(error){if(this.active&&version===this.version){this.cancel();this.onError(error);}}
 }
 drawIn(){
  const scene=this.getScene(),width=scene.viewWidth||1500,from=620-width*.17,to=500,p=ease(this.time/2.3),x=mix(from,to,p);
  scene.setCatJourneyPose?.(passagePose(x,80,this.time,{walk:ease(this.time/.3)*(1-ease((this.time-1.9)/.4)),gait:(x-from)*.18}));
  const r=this.dimensions(),small=Math.min(100,r.width*.23),open=ease((this.time-.45)/2.15),radius=mix(small,Math.hypot(r.width,r.height)*1.3,open)*ease(this.time/.35);
  this.lens(radius,mix(2.6,1,open));
 }
 pause(){this.paused=true;}
 resume(){this.paused=false;}
 skip(){if(!this.active)return;this.paused=false;if(this.phase==='out')this.swap();else if(this.phase==='in')this.finish();}
 clear(){
  const scene=this.getScene();if(scene.canvas?.style){scene.canvas.style.transform='';scene.canvas.style.transformOrigin='';}
  if(this.mask)this.mask.hidden=true;
  this.machine?.setAttribute?.('aria-busy','false');if(this.machine?.dataset)this.machine.dataset.travelling='false';
 }
 finish(){
  if(!this.active)return;
  this.getScene().settleCat?.(500,80);this.active=false;this.clear();this.onComplete();
 }
 cancel(){if(!this.active)return;this.version++;this.active=false;this.getScene().settleCat?.(this.getScene().cat?.state?.x||95,80);this.clear();}
 dispose(){this.cancel();this.mask?.removeEventListener?.('click',this.onClick);}
}
