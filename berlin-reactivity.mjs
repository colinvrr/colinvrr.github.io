import {berlinEffectsFrame} from './berlin-fx.mjs';
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
function rgb(h){
 const sector=h*6,i=Math.floor(sector),f=sector-i,p=.12,q=1-f*.88,t=.12+f*.88;
 return [[1,t,p],[q,1,p],[p,1,t],[p,q,1],[t,p,1],[1,p,q]][i%6];
}
// Every colour and excursion comes from the measured audio envelopes. A
// silent signal has zero emission and zero cone excursion, at any timestamp.
export function berlinAudioFrame(time,bands=[],attacks=[],step=0){
 const b=[0,1,2].map(i=>clamp(bands[i])),a=[0,1,2].map(i=>clamp(attacks[i])),colors=new Float32Array(63);
 for(let row=0;row<3;row++)for(let col=0;col<7;col++){
  const focus=(col+step)%7===0?1.15:.7+.15*Math.cos(col*1.7+row);
  const gain=Math.min(2.8,(b[row]*.72+a[row]*.8+b[0]*.06)*focus*1.9);
  const hue=((col*.103+row*.21+time*.018+step*.067)%1+1)%1,c=rgb(hue),offset=(row*7+col)*3;
  for(let k=0;k<3;k++)colors[offset+k]=c[k]*gain;
 }
 return {colors,pulse:Math.min(1,b[0]*.55+a[0]*.8)};
}
export class BerlinReactivity {
 constructor(owner){this.owner=owner;this.panes=owner.windowPanes||[];this.speakers=owner.speakerCones||[];this.effects=owner.stageEffects;this.time=0;this.step=0;this.previousAttack=0;this.pulse=0;this.lit=false;}
 applySpeakers(pulse,reduced){
  const motion=Math.sqrt(clamp(pulse))*(reduced?.15:1);
  for(const {driver,cone,glow,driverZ,coneZ}of this.speakers){
   driver.position.z=driverZ+motion*18;driver.scaling.x=driver.scaling.z=1+motion*.2;
   cone.position.z=coneZ+motion*25;cone.scaling.x=cone.scaling.y=1+motion*.28;cone.scaling.z=.3+motion*.7;
   glow?.emissiveColor.set(.025+motion*.12,.05+motion*.85,.07+motion*1.5);
  }
 }
 advance(dt,audio={},reduced=false){
  if(!this.owner)return false;
  if(!audio.playing){
   if(audio.active||!this.lit)return false;
   for(const {material}of this.panes)material.emissiveColor.set(0,0,0);
   this.applySpeakers(0,false);this.effects?.reset();this.time=0;this.pulse=0;this.step=0;this.previousAttack=0;this.lit=false;
   this.owner.canvas.dataset.windowLightLevel='0';this.owner.canvas.dataset.speakerPulse='0';return true;
  }
  this.time+=Math.max(0,dt)*(reduced?.2:1);
  const attack=clamp(audio.transients?.[0]);if(attack>.18&&attack-this.previousAttack>.06)this.step++;
  this.previousAttack=attack;
  const target=berlinAudioFrame(this.time,audio.bands,audio.transients,this.step),blend=1-Math.exp(-Math.max(0,dt)*(reduced?6:22));
  let changed=false,level=0;
  for(const {material,column,row,fixture}of this.panes){
   const offset=(row*7+column)*3,c=material.emissiveColor;
   for(const [k,key]of ['r','g','b'].entries()){
    const next=c[key]+(target.colors[offset+k]*(fixture?(reduced?.25:1.2):(reduced?.18:.4))-c[key])*blend,value=next<.0001?0:next;
    if(Math.abs(c[key]-value)>.00001)changed=true;c[key]=value;level=Math.max(level,value);
   }
  }
  const pulse=this.pulse+(target.pulse-this.pulse)*(1-Math.exp(-dt*(target.pulse>this.pulse?38:14)));
  if(Math.abs(pulse-this.pulse)>.00001)changed=true;this.pulse=pulse<.0001?0:pulse;
  this.applySpeakers(this.pulse,reduced);
  const effects=berlinEffectsFrame(this.time,audio.bands,audio.transients,reduced);
  changed=this.effects?.apply(effects)||changed;this.lit=true;
  this.owner.canvas.dataset.windowLightLevel=level.toFixed(3);this.owner.canvas.dataset.speakerPulse=this.pulse.toFixed(3);
  return changed;
 }
 dispose(){this.owner=null;this.panes=[];this.speakers=[];this.effects=null;}
}
