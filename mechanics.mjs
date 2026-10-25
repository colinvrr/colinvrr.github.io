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
export class MechanicalFeedback {
  constructor(Context=globalThis.AudioContext||globalThis.webkitAudioContext){this.Context=Context;this.context=null;this.buffers=new Map();this.timer=0;}
  async play(kind){
    if(!this.Context)return;
    try{
      this.context ||= new this.Context({latencyHint:'interactive'});
      const ctx=this.context;clearTimeout(this.timer);await ctx.resume();
      if(!this.buffers.has(kind))this.buffers.set(kind,mechanicalBuffer(ctx,kind));
      const source=ctx.createBufferSource();source.buffer=this.buffers.get(kind);source.connect(ctx.destination);source.start();
      this.timer=setTimeout(()=>{if(ctx.state==='running')ctx.suspend().catch(()=>{});},300);
    }catch{/* A denied feedback sound must never prevent a transport action. */}
  }
  dispose(){clearTimeout(this.timer);this.context?.close().catch(()=>{});}
}
