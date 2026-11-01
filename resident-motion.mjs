import {parisDanceArms} from './dance-performance.mjs';
import {CAPTURE_DANCES, capturedDance, capturedWalk} from './resident-mocap.mjs';
export {capturedWalk};
// Deterministic, allocation-light limb solving in facade coordinates (y down).
// A contact is attached to the moving leaf, so it cannot drift off its handle.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,k)=>a.map(v=>v*k);
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),length=a=>Math.hypot(...a),unit=a=>mul(a,1/(length(a)||1));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function blendDirection(a,b,w){
 const cosine=clamp(dot(a,b),-1,1),angle=Math.acos(cosine);
 if(angle<.001)return unit(a.map((v,i)=>v+(b[i]-v)*w));
 let tangent=sub(b,mul(a,cosine));
 if(length(tangent)<.001)tangent=cross(a,Math.abs(a[1])<.9?[0,1,0]:[0,0,1]);
 return add(mul(a,Math.cos(angle*w)),mul(unit(tangent),Math.sin(angle*w)));
}
export function hingePoint(part,point,inverse=false){
 const a=(inverse?-1:1)*(part.angle||0),c=Math.cos(a),s=Math.sin(a),d=sub(point,part.pivot);
 return [part.pivot[0]+d[0]*c+d[2]*s,point[1],part.pivot[2]-d[0]*s+d[2]*c];
}
// Slab intersection against an expanded oriented panel. The wrist, elbow and
// the entire sleeve are tested, not just the position of the hand.
export function limbHitsPanel(a,b,part,radius=0){
 if(!part?.collisionBox)return false;
 a=hingePoint(part,a,true);b=hingePoint(part,b,true);
 const {min,max}=part.collisionBox;let lo=0,hi=1;
 for(let i=0;i<3;i++){
  const d=b[i]-a[i],l=min[i]-radius,h=max[i]+radius;
  if(Math.abs(d)<1e-8){if(a[i]<l||a[i]>h)return false;continue;}
  const u=(l-a[i])/d,v=(h-a[i])/d;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));if(lo>hi)return false;
 }
 return true;
}
// Interpolate bend planes on their circle, rather than blending two pole
// points through the arm axis (which causes an instantaneous elbow flip).
export function blendPole(shoulder,target,from,to,weight){
 const axis=unit(sub(target,shoulder)),project=p=>{const v=sub(p,shoulder),q=sub(v,mul(axis,dot(v,axis)));return length(q)>.001?unit(q):unit(cross(axis,Math.abs(axis[1])<.9?[0,1,0]:[1,0,0]));};
 const a=project(from),b=project(to),angle=Math.atan2(dot(axis,cross(a,b)),clamp(dot(a,b),-1,1))*clamp(weight);
 return add(shoulder,mul(add(mul(a,Math.cos(angle)),mul(cross(axis,a),Math.sin(angle))),50));
}
export function solveArm(shoulder,target,pole,upper=44,lower=39,panels=[],radius=8){
 const delta=sub(target,shoulder),raw=length(delta),distance=clamp(raw,Math.abs(upper-lower)+.1,upper+lower-.15),axis=unit(delta);
 const wrist=add(shoulder,mul(axis,distance)),along=(upper*upper-lower*lower+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 const hint=sub(pole,shoulder);let perpendicular=sub(hint,mul(axis,dot(hint,axis)));
 if(length(perpendicular)<.001)perpendicular=cross(axis,Math.abs(axis[1])<.9?[0,1,0]:[1,0,0]);
 perpendicular=unit(perpendicular);const tangent=unit(cross(axis,perpendicular)),center=add(shoulder,mul(axis,along));
 let result,score=Infinity;
 // Prefer the authored elbow plane. Only move around its circle when a panel
 // obstructs it; this keeps an anatomical bend without stretching either bone.
 for(let i=0;i<(panels.length?65:1);i++){
  const angle=i===0?0:Math.ceil(i/2)*Math.PI/32*(i%2?1:-1),radial=add(mul(perpendicular,Math.cos(angle)),mul(tangent,Math.sin(angle))),elbow=add(center,mul(radial,height));
  let hits=0;for(const part of panels){if(limbHitsPanel(shoulder,elbow,part,radius*1.12))hits++;if(limbHitsPanel(elbow,wrist,part,radius))hits++;}
  const cost=hits*10000+Math.abs(angle);if(cost<score){score=cost;result={elbow,wrist,hits,error:length(sub(wrist,target)),angle};}if(!hits)break;
 }
 return result;
}
export function poseTargets(s,side,frame){
 const t=s.t||0,seed=s.seed||0,walk=s.walk||0,d=s.dance||0,p=s.pose||0,gait=s.gait||0;
 const swing=Math.sin(gait+(side>0?Math.PI:0));
 let wrist=[side*(38+walk*2),5+walk*Math.max(0,-swing)*3,12-swing*walk*19],pole=[side*62,40,2];
 const blend=(v,w)=>{wrist=wrist.map((x,i)=>x+(v[i]-x)*w);};
 if(p){
  const active=side===(Math.sin(seed)>0?1:-1),k=s.poseIndex||0;
  if(k===0&&active)blend([side*25,15,23],p);
  else if(k===1)blend([side*29,21,24],p);
  else if(k===2&&active){blend([side*24,108,20],p);wrist[2]+=26*Math.sin(Math.PI*p);}
  else if(k===3&&active)blend([side*27,55,31],p);
 }
 const captured=(f,weight)=>{
  const i=side<0?0:1,shoulder=[side*34,77,0],rest=solveArm(shoulder,wrist,pole),upper=blendDirection(unit(sub(rest.elbow,shoulder)),unit(sub(f.poles[i],shoulder)),weight),lower=blendDirection(unit(sub(rest.wrist,rest.elbow)),unit(sub(f.arms[i],f.poles[i])),weight);
  pole=add(shoulder,mul(upper,44));wrist=add(pole,mul(lower,39));
 };
 if(d){
  captured(frame||danceFrame(s),d);
  if(s.parisDance){
   const gesture=parisDanceArms(s.danceTime||0,side),weight=gesture.weight*d;
   wrist=wrist.map((v,i)=>v+(gesture.wrist[i]-v)*weight);
   pole=pole.map((v,i)=>v+(gesture.pole[i]-v)*weight);
  }
 }
 if(!d&&walk&&/^(walk|leave|return|window-approach|window-depart)$/.test(s.phase))captured(frame||capturedWalk(s),walk);
 return {wrist,pole};
}

export const DANCE_STYLES=CAPTURE_DANCES;
function routine(style,time,seed,tempo){return capturedDance(style,time,seed,tempo);}
const mixNumber=(a,b,w)=>a+(b-a)*w;
const mixFrame=(a,b,w)=>typeof a==='number'?mixNumber(a,b,w):Array.isArray(a)?a.map((v,i)=>mixFrame(v,b[i],w)):Object.fromEntries(Object.keys(a).map(k=>[k,mixFrame(a[k],b[k],w)]));
export function danceFrame(s){
 const time=s.danceTime??s.t??0,tempo=s.danceTempo??1,seed=s.seed??0,style=s.danceStyle||DANCE_STYLES[0];
 const a=routine(style,time,seed,tempo),w=s.danceBlend||0;
 if(w>=1)return routine(s.danceNext||style,time,seed,tempo);
 if(!w)return a;
 const b=routine(s.danceNext||style,time,seed,tempo),f=mixFrame(a,b,w);
 // Blend segment directions at their fixed lengths. Independently blending
 // wrists and pole points can pass through the arm axis and flip the elbow.
 for(let i=0;i<2;i++){
  const shoulder=[i===0?-34:34,77,0],upper=blendDirection(unit(sub(a.poles[i],shoulder)),unit(sub(b.poles[i],shoulder)),w),lower=blendDirection(unit(sub(a.arms[i],a.poles[i])),unit(sub(b.arms[i],b.poles[i])),w);
  f.poles[i]=add(shoulder,mul(upper,44));f.arms[i]=add(f.poles[i],mul(lower,39));
 }
 return f;
}
