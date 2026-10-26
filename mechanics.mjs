const duration={lever:.16,stop:.11,pause:.09,play:.10,share:.075};
// A dry impact, a short spring resonance and (for the lever) a second detent.
// These sounds go straight to the output, never to the music analyser.
export function mechanicalBuffer(context,kind='play') {
  const seconds=duration[kind]||duration.play,rate=context.sampleRate;
  const buffer=context.createBuffer(1,Math.ceil(rate*seconds),rate),samples=buffer.getChannelData(0);
  const lever=kind==='lever',low=kind==='stop'?180:lever?260:380;
  let previous=0;
  for(let i=0;i<samples.length;i++){
    const t=i/rate,noise=Math.random()*2-1,edge=noise-previous*.72;previous=noise;
    const impact=dt=>dt<0?0:edge*Math.exp(-dt*240)*.13+Math.sin(dt*low*Math.PI*2)*Math.exp(-dt*85)*.045+Math.sin(dt*1730*Math.PI*2)*Math.exp(-dt*140)*.018;
    let value=impact(t)+(lever?impact(t-.043)*.62:0);
    value*=Math.min(1,t*rate/12)*Math.min(1,(seconds-t)*rate/48);
    samples[i]=value*.65;
  }
  return buffer;
}
// Low motor hum, rail friction and successive blade contacts. The long buffer
// loops only while the actual curtain moves; its level stays below the mix.
export function rollerBuffer(context,direction=1){
 const seconds=3,rate=context.sampleRate,buffer=context.createBuffer(1,Math.ceil(rate*seconds),rate),samples=buffer.getChannelData(0);
 const frequency=direction>0?85:70,joints=direction>0?10:9;let low=0;
 for(let i=0;i<samples.length;i++){
  const t=i/rate,noise=Math.random()*2-1;low+=(noise-low)*.075;
  const hum=Math.sin(t*frequency*Math.PI*2)*.029+Math.sin(t*frequency*2*Math.PI*2)*.008;
  const friction=(noise-low)*.011+low*.045;
  const phase=(t*joints)%1,contact=Math.sin(t*(direction>0?650:570)*Math.PI*2)*Math.exp(-phase*21)*.024;
  const edge=Math.min(1,t/.055,(seconds-t)/.065);
  samples[i]=(hum+friction+contact)*Math.max(0,edge)*(.86+.14*Math.sin(t*Math.PI*4));
 }
 return buffer;
}
export class MechanicalFeedback {
 constructor(Context=globalThis.AudioContext||globalThis.webkitAudioContext){
  this.Context=Context;this.context=null;this.buffers=new Map();this.timer=0;this.motor=null;this.pendingDirection=0;this.serial=0;this.muted=false;this.disposed=false;this.motion={moving:false};
 }
 audio(){this.context ||= new this.Context({latencyHint:'interactive'});return this.context;}
 idleSoon(){
  clearTimeout(this.timer);
  this.timer=setTimeout(()=>{this.timer=0;const ctx=this.context;if(!this.motor&&!this.pendingDirection&&ctx?.state==='running')ctx.suspend().catch(()=>{});},350);
 }
 async unlock(){
  if(!this.Context||this.disposed)return;
  try{clearTimeout(this.timer);await this.audio().resume();if(!this.disposed)this.idleSoon();}catch{}
 }
 async play(kind){
  if(!this.Context||this.disposed)return;
  try{
   clearTimeout(this.timer);const ctx=this.audio();await ctx.resume();if(this.disposed)return;
   if(!this.buffers.has(kind))this.buffers.set(kind,mechanicalBuffer(ctx,kind));
   const source=ctx.createBufferSource();source.buffer=this.buffers.get(kind);source.connect(ctx.destination);source.onended=()=>source.disconnect();source.start();this.idleSoon();
  }catch{/* A denied sound must never prevent a transport action. */}
 }
 shutter(motion){
  this.motion=motion;
  if(!this.Context||this.disposed)return;
  if(!motion.moving||this.muted){this.serial++;this.pendingDirection=0;this.stopMotor(!this.muted&&(motion.progress===0||motion.progress===1));return;}
  const direction=motion.direction>0?1:-1;
  if(this.motor?.direction===direction){this.motor.gain.gain.setTargetAtTime(this.motorLevel(),this.context.currentTime,.045);return;}
  if(this.pendingDirection===direction)return;
  const ticket=++this.serial;this.pendingDirection=direction;
  this.startMotor(direction,ticket).catch(()=>{if(ticket===this.serial)this.pendingDirection=0;this.idleSoon();});
 }
 motorLevel(){return (this.motion.direction>0 ? .2 : .17)*(.55+.45*Math.sin(Math.PI*Math.max(0,Math.min(1,this.motion.progress||0))));}
 async startMotor(direction,ticket){
  clearTimeout(this.timer);const ctx=this.audio();await ctx.resume();
  if(this.disposed||this.muted||ticket!==this.serial||!this.motion.moving){if(!this.disposed)this.idleSoon();return;}
  const key=direction>0?'roller-up':'roller-down';
  if(!this.buffers.has(key))this.buffers.set(key,rollerBuffer(ctx,direction));
  this.stopMotor(false);clearTimeout(this.timer);
  const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=this.buffers.get(key);source.loop=true;gain.gain.value=0;
  source.connect(gain);gain.connect(ctx.destination);gain.gain.setTargetAtTime(this.motorLevel(),ctx.currentTime,.035);
  source.onended=()=>{source.disconnect();gain.disconnect();};source.start();this.motor={source,gain,direction};this.pendingDirection=0;
 }
 stopMotor(latch=false){
  const motor=this.motor,ctx=this.context;this.motor=null;
  if(motor&&ctx){
   try{motor.gain.gain.cancelScheduledValues(ctx.currentTime);motor.gain.gain.setTargetAtTime(0,ctx.currentTime,.018);motor.source.stop(ctx.currentTime+.075);}catch{}
   if(latch&&!this.disposed){
    try{if(!this.buffers.has('stop'))this.buffers.set('stop',mechanicalBuffer(ctx,'stop'));const end=ctx.createBufferSource(),gain=ctx.createGain();gain.gain.value=.18;end.buffer=this.buffers.get('stop');end.connect(gain);gain.connect(ctx.destination);end.onended=()=>{end.disconnect();gain.disconnect();};end.start(ctx.currentTime+.025);}catch{}
   }
  }
  if(!this.disposed)this.idleSoon();
 }
 setVisible(visible){this.muted=!visible;if(this.muted){this.serial++;this.pendingDirection=0;this.stopMotor(false);}}
 dispose(){this.disposed=true;this.serial++;this.pendingDirection=0;this.stopMotor(false);clearTimeout(this.timer);this.context?.close().catch(()=>{});}
}
