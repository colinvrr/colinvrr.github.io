// Movement and sound stay independent of the renderer: each real 3D slat is
// positioned by the scene as the curtain follows its guide into the hood.
export const SIZE=1200,BLADES=30,BAR=0,PITCH=SIZE/BLADES;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function guidePosition(s){const tangent=43,radius=44;if(s>=tangent)return {y:s,light:1};const angle=clamp((tangent-s)/radius,0,Math.PI/2);return {y:tangent-radius*Math.sin(angle),light:.58+.42*Math.cos(angle)};}
export function liftAt(progress){const t=clamp(progress,0,1);return (SIZE+60)*(t*t*(3-2*t));}
export class MetalShutter {
 constructor(scene,{onMotion}={}){
  this.scene=scene;this.progress=0;this.target=0;this.raf=0;this.onMotion=onMotion;
  this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
  this.onPreference=()=>{if(this.reduced.matches){this.progress=this.target;this.draw();this.reportMotion();}};
  this.reduced.addEventListener('change',this.onPreference);this.draw();
 }
 reportMotion(){try{this.onMotion?.({moving:Math.abs(this.target-this.progress)>.00001,direction:Math.sign(this.target-this.progress),progress:this.progress});}catch{}}
 setOpen(open){
  this.target=open?1:0;
  if(this.reduced.matches){this.progress=this.target;this.draw();this.reportMotion();return;}
  this.reportMotion();if(this.progress===this.target&&!this.raf)return;if(this.raf)return;
  let last=performance.now();
  const step=now=>{
   const dt=Math.min((now-last)/1000,.05);last=now;
   this.progress=clamp(this.progress+Math.sign(this.target-this.progress)*dt/(this.target>this.progress?1.95:2.15),0,1);
   if(Math.abs(this.progress-this.target)<=.00001)this.progress=this.target;
   this.draw();this.reportMotion();
   if(this.progress!==this.target)this.raf=requestAnimationFrame(step);else this.raf=0;
  };this.raf=requestAnimationFrame(step);
 }
 draw(){this.scene?.setProgress(this.progress);}
 dispose(){cancelAnimationFrame(this.raf);this.raf=0;try{this.onMotion?.({moving:false,direction:0,progress:this.progress});}catch{}this.reduced.removeEventListener('change',this.onPreference);}
}
