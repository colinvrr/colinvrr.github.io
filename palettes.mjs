const wrap=h=>((h%1)+1)%1;
export const smootherstep=x=>{const t=Math.max(0,Math.min(1,x));return t*t*t*(t*(t*6-15)+10);};
export function seededRandom(seed) {
  let state=seed>>>0;
  return ()=>{state+=0x6D2B79F5;let n=state;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return ((n^(n>>>14))>>>0)/4294967296;};
}
function hsv(h,s,v) {
  const k=wrap(h)*6,i=Math.floor(k),f=k-i,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);
  return [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];
}
// One random score per visit to the page. Sampling is a pure function of visual
// time, so pause, redraw, resize and GPU verification cannot change the colors.
export class PaletteTimeline {
  constructor(seed=Math.floor(Math.random()*4294967296)) {this.seed=seed>>>0;this.period=32;}
  anchors(world,epoch) {
    const base=seededRandom(this.seed^Math.imul(world+1,0x9E3779B1))();
    const random=seededRandom(this.seed^Math.imul(world+1,0x85EBCA6B)^Math.imul(epoch+1,0xC2B2AE35));
    const hue=wrap(base+epoch*.381966+(random()-.5)*.08);
    const direction=random()>.5?1:-1;
    const gap=.16+random()*.24;
    return [
      [hue,.48+random()*.3,.12+random()*.12],
      [wrap(hue+direction*(.04+random()*.1)),.55+random()*.35,.42+random()*.27],
      [wrap(hue+direction*gap),.65+random()*.3,.73+random()*.27],
      [wrap(hue-direction*(.15+random()*.35)),.22+random()*.38,.86+random()*.14]
    ];
  }
  sample(world,time) {
    const position=Math.max(0,time)/this.period,epoch=Math.floor(position),t=smootherstep(position-epoch);
    const from=this.anchors(world,epoch),to=this.anchors(world,epoch+1),colors=[];
    for(let i=0;i<4;i++) {
      const a=from[i],b=to[i];let delta=wrap(b[0]-a[0]+.5)-.5;
      colors.push(...hsv(a[0]+delta*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t));
    }
    return new Float32Array(colors);
  }
  flow(from,to,time) {
    const random=seededRandom(this.seed^Math.imul(from+1,48271)^Math.imul(to+1,69621)^Math.floor(time*1000));
    const angle=random()*Math.PI*2;
    return new Float32Array([Math.cos(angle),Math.sin(angle),random()*Math.PI*2,.32+random()*.2]);
  }
}
