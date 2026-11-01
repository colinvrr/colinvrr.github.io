const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>{v=clamp(v);return v*v*(3-2*v);};

// Smooth, bounded stylised movement layered on the retargeted dance capture.
export function catDanceMotion(time,duration=Infinity,reduced=false){
 if(reduced)return {sway:0,bob:0,twist:0,leftPaw:0,rightPaw:0,leftStep:0,rightStep:0};
 const weight=ease(time/.8)*(Number.isFinite(duration)?ease((duration-time)/.8):1);
 const beat=time*4.25,phrase=time*1.08;
 return {
  sway:(Math.sin(beat*.5)*7+Math.sin(phrase)*3)*weight,
  bob:(1-Math.cos(beat*2))*2.3*weight,
  twist:Math.sin(beat*.5)*.24*weight,
  leftPaw:(Math.sin(beat)+.45*Math.sin(phrase))*weight,
  rightPaw:(Math.sin(beat+Math.PI*.72)-.45*Math.sin(phrase))*weight,
  leftStep:Math.max(0,Math.sin(beat)) * 6*weight,
  rightStep:Math.max(0,-Math.sin(beat))*6*weight
 };
}
// DJ alternates one raised hand and a two-hand celebration, then returns to the decks.
export function djHandsUp(time,side,reduced=false){
 if(reduced)return 0;
 const cycle=((time%20)+20)%20,phase=Math.floor(time/20)%3;
 const envelope=ease((cycle-6)/1.1)*ease((10.8-cycle)/1.1);
 return envelope*(phase===2||side===(phase===0?-1:1)?1:0);
}

// Intermittent expressive arm phrases, blended into the captured steps.
export function parisDanceArms(time,side){
 const cycle=((time%9)+9)%9,phrase=Math.floor(time/9)%3;
 const envelope=ease((cycle-1)/.9)*ease((7.3-cycle)/1.1);
 const weight=envelope*(phrase===2||side===(phrase===0?-1:1)?1:.45);
 const wave=Math.sin(time*3.2+side)*7;
 return {weight,wrist:[side*(31+wave*.35),140+wave,18+Math.cos(time*2.2+side)*9],pole:[side*(63+wave*.3),99+wave*.5,3]};
}
