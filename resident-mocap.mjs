import {RESIDENT_MOCAP} from './assets/resident-mocap.mjs';
const clamp=(v,a=-1,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=v=>{v=clamp(v,0,1);return v*v*v*(v*(v*6-15)+10);};
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const unit=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
const joints=Object.fromEntries(RESIDENT_MOCAP.jointNames.map((name,i)=>[name,i*3]));
// A short symmetric filter removes capture jitter without accumulating state:
// seeking, pause and repeated redraws always reconstruct the same exact pose.
const filtered=rows=>rows.map((row,i)=>row.map((_,k)=>[1,8,28,56,70,56,28,8,1].reduce((sum,w,j)=>sum+w*rows[Math.max(0,Math.min(rows.length-1,i+j-4))][k],0)/256));
const clips=Object.fromEntries(Object.entries(RESIDENT_MOCAP.clips).map(([name,clip])=>[name,{...clip,frames:filtered(clip.frames),headForward:filtered(clip.headForward)}]));
export const CAPTURE_DANCES=['salsa','salsa-cross','twist','charleston','salsa-groove','charleston-swing'];
const routines={salsa:['salsa-01',1,0],'salsa-cross':['salsa-02',1,0],twist:['twist',1,0],charleston:['charleston',1,0],'salsa-groove':['salsa-01',.84,7.3],'charleston-swing':['charleston',.86,1.2]};
function at(clip,time,channel='frames'){
 const frames=clip[channel],t=Math.max(0,Math.min(frames.length-1,time*clip.fps)),i=Math.floor(t),j=Math.min(i+1,frames.length-1),w=t-i;
 return frames[i].map((v,k)=>mix(v,frames[j][k],w));
}
// Crossfade the last half-second into the opening half-second, including the
// joint positions before deriving directions. The loop is continuous in pose.
export function sampleCapture(name,time,channel='frames'){
 const clip=clips[name],fade=clip.loopBlend,period=clip.duration-fade;
 const t=((time%period)+period)%period,a=at(clip,t,channel);
 if(t>=fade)return a;
 const b=at(clip,t+period,channel),w=smooth(t/fade);return a.map((v,i)=>mix(b[i],v,w));
}
function unrotate(v,pitch,yaw,roll){
 let [x,y,z]=v,c=Math.cos(yaw),s=Math.sin(yaw);[x,z]=[c*x-s*z,s*x+c*z];
 c=Math.cos(pitch);s=Math.sin(pitch);[y,z]=[c*y+s*z,-s*y+c*z];
 c=Math.cos(roll);s=Math.sin(roll);return [c*x+s*y,-s*x+c*y,z];
}
function retarget(name,time,seed=0){
 const flat=sampleCapture(name,time),p=name=>flat.slice(joints[name],joints[name]+3),hips=p('hips'),neck=p('neck'),spine=sub(neck,hips),axis=sub(p('leftShoulder'),p('rightShoulder'));
 const pitch=clamp(Math.atan2(spine[2],spine[1]),-.25,.25),twist=clamp(Math.atan2(-axis[2],axis[0]),-.45,.45),lean=clamp(-Math.atan2(spine[0],spine[1]),-.22,.22);
 const local=v=>unrotate(v,pitch,twist,lean),sides=[-1,1];
 const f={x:0,z:0,yaw:0,lean,twist,pitch,bob:0,headYaw:.16*Math.sin(time*.57+seed),headPitch:0,headRoll:0,legs:[],arms:[],poles:[]};
 for(const side of sides){
  const prefix=side<0?'right':'left',shoulder=p(prefix+'Shoulder'),elbow=p(prefix+'Elbow'),wrist=p(prefix+'Wrist');
  const upper=local(unit(sub(elbow,shoulder))),lower=local(unit(sub(wrist,elbow)));
  const e=[side*34+upper[0]*44,77+upper[1]*44,upper[2]*44],w=e.map((v,i)=>v+lower[i]*39);
  f.arms.push(w);f.poles.push(e);
  const hip=p(prefix+'Hip'),knee=p(prefix+'Knee'),ankle=p(prefix+'Ankle'),toe=p(prefix+'Toe'),u=unit(sub(knee,hip)),l=unit(sub(ankle,knee)),foot=unit(sub(toe,ankle));
  f.legs.push({upper:u,lower:l,foot,x:Math.atan2(-u[2],-u[1]),z:Math.atan2(u[0],-u[1]),knee:-Math.acos(clamp(u.reduce((sum,v,i)=>sum+v*l[i],0))),yaw:Math.atan2(foot[0],foot[2])});
 }
 // Head follows the captured neck / head axis, with a small deliberate gaze
 // change layered over it so the dancer still looks around the street.
 const head=sub(p('head'),neck),forward=sampleCapture(name,time,'headForward');f.headPitch=clamp(Math.atan2(head[2],head[1])-pitch,-.18,.18);f.headRoll=clamp(-Math.atan2(head[0],head[1])-lean,-.12,.12);f.headYaw=clamp(Math.atan2(forward[0],forward[2])-twist,-.55,.55);
 f.pelvisX=-(p('leftAnkle')[0]+p('rightAnkle')[0])*.1;f.pelvisZ=-(p('leftAnkle')[2]+p('rightAnkle')[2])*.04;
 return f;
}
export function capturedDance(style,time,seed=0,tempo=1){
 const [name,speed,offset]=routines[style]||routines.salsa,t=time*tempo*speed*.65+offset,f=retarget(name,t,seed);
 // Confine the captures' long travelling paths to her place beside the garage.
 // The footwork itself remains the recorded motion.
 f.x=8*Math.tanh(f.pelvisX/8);f.z=2.8*Math.tanh(f.pelvisZ/2.8);f.yaw=.1*Math.sin(time*.53+seed);
 f.headYaw+=.2*Math.sin(time*.73+seed*.7);return f;
}
export function capturedWalk(s){
 const clip=RESIDENT_MOCAP.clips.walk,travel=clip.travel.at(-1),distance=Math.hypot(...travel)*.75*1.42;
 return retarget('walk',(s.gait||0)/.075*clip.duration/distance,s.seed||0);
}
