import {seededRandom,smootherstep} from './palettes.mjs';
export const styleNames=['matiere','hertz','electricite','magnetisme','membrane','magma','cristal','fluide','strates','interferences','dunes','vortex','rosette','tressage','origami','alveoles','gouttes','rubans','turbulence','ressac','diffraction','ecailles','labyrinthe','orbites'];
export const roughness=[.55,.26,.25,.21,.32,.82,.19,.14,.65,.27,.74,.22,.3,.4,.42,.48,.17,.25,.44,.3,.2,.38,.55,.18];
export const metalness=[.55,.9,.92,.96,.75,.12,.62,.97,.3,.86,.18,.93,.7,.73,.58,.6,.96,.86,.65,.8,.88,.72,.4,.94];
export const motionNames=['derive','torsion','respiration','cisaillement','orbital','ondulation','spirale','contre-courant'];
export const transitionNames=['crete','anneau','pli','double-onde','spirale','croix','lentille','chevrons','battement','rosace','ruban-tresse','sillage'];
export function motionSignature(world,time,seed){
 const position=Math.max(0,time)/37,epoch=Math.floor(position);
 const random=seededRandom((seed>>>0)^Math.imul(world+1,0x9e3779b1)),base=Math.floor(random()*8),step=1+Math.floor(random()*4)*2;
 const choice=e=>(base+e*step)%8,first=choice(epoch),next=choice(epoch+1);
 const r=seededRandom((seed>>>0)^Math.imul(world+1,69621));
 return new Float32Array([first,next,smootherstep(position-epoch),r()*Math.PI*2]);
}
// Pure coordinate transforms: the same time and seed always reproduce the same
// frame. A slow blend avoids any jump when a movement variant renews itself.
function warp(mode,x,z,t,bands,phase,out){
 const a=.3+bands[0]*.12,s=Math.sin,c=Math.cos;
 let qx=x,qz=z;
 if(mode===0){qx+=s(t*.17+phase)*.7;qz+=c(t*.13+phase)*.65;}
 else if(mode===1){const angle=s(z*.28+t*.16+phase)*.17;qx=x*c(angle)-z*s(angle);qz=x*s(angle)+z*c(angle);}
 else if(mode===2){const k=1+s(t*.27+phase)*.105;qx=x*k;qz=z*k;}
 else if(mode===3){qx+=s(z*.35-t*.3+phase)*.65;qz+=s(x*.26+t*.19)*.25;}
 else if(mode===4){qx+=c(t*.22+phase+Math.hypot(x,z)*.16)*.6;qz+=s(t*.22+phase+Math.hypot(x,z)*.16)*.6;}
 else if(mode===5){qx+=s(z*.65-t*.42+phase)*a;qz+=s(x*.61+t*.33+phase)*a;}
 else if(mode===6){const angle=Math.hypot(x,z)*.045+s(t*.16+phase)*.18;qx=x*c(angle)-z*s(angle);qz=x*s(angle)+z*c(angle);}
 else {qx+=s(z*.4+t*.3+phase)*.6;qz-=s(x*.4+t*.3+phase)*.6;}
 out[0]=qx;out[1]=qz;return out;
}
const tempA=new Float64Array(2),tempB=new Float64Array(2);
export function motionPoint(x,z,time,bands,signature,out){
 warp(signature[0],x,z,time,bands,signature[3],tempA);warp(signature[1],x,z,time,bands,signature[3],tempB);
 out[0]=tempA[0]+(tempB[0]-tempA[0])*signature[2];out[1]=tempA[1]+(tempB[1]-tempA[1])*signature[2];return out;
}
export const motionGLSL=`
uniform vec4 uMotionFrom;
uniform vec4 uMotionTo;
vec2 movement(int mode,vec2 p,float phase){
 float t=uTime,a=.3+uBands.x*.12;
 if(mode==0)return p+vec2(sin(t*.17+phase)*.7,cos(t*.13+phase)*.65);
 if(mode==1){float angle=sin(p.y*.28+t*.16+phase)*.17;return vec2(p.x*cos(angle)-p.y*sin(angle),p.x*sin(angle)+p.y*cos(angle));}
 if(mode==2)return p*(1.+sin(t*.27+phase)*.105);
 if(mode==3)return p+vec2(sin(p.y*.35-t*.3+phase)*.65,sin(p.x*.26+t*.19)*.25);
 if(mode==4)return p+vec2(cos(t*.22+phase+length(p)*.16),sin(t*.22+phase+length(p)*.16))*.6;
 if(mode==5)return p+vec2(sin(p.y*.65-t*.42+phase),sin(p.x*.61+t*.33+phase))*a;
 if(mode==6){float angle=length(p)*.045+sin(t*.16+phase)*.18;return vec2(p.x*cos(angle)-p.y*sin(angle),p.x*sin(angle)+p.y*cos(angle));}
 return p+vec2(sin(p.y*.4+t*.3+phase),-sin(p.x*.4+t*.3+phase))*.6;
}
vec2 motionPoint(vec2 p,int layer){vec4 m=layer==0?uMotionFrom:uMotionTo;return mix(movement(int(m.x),p,m.w),movement(int(m.y),p,m.w),m.z);}
`;
export function transitionRelief(x,z,phase,bass,flow){
 const envelope=16*phase*phase*(1-phase)*(1-phase);if(!envelope)return 0;
 const q=x*flow[0]+z*flow[1],r=-x*flow[1]+z*flow[0],front=-5+phase*10,rad=Math.hypot(q,r),angle=Math.atan2(r,q),seed=flow[2];
 const kind=Math.min(11,Math.floor(seed/(Math.PI*2)*12));let d,value;
 if(kind===0){d=r-front+Math.sin(q*.38+seed)*.6;value=Math.sin(d*1.7)*Math.exp(-d*d*.33);}
 else if(kind===1){d=rad-(.5+phase*5.5);value=Math.cos(d*2.4)*Math.exp(-d*d*.56);}
 else if(kind===2){d=q-front+Math.sin(r*.43+seed)*.75;value=Math.sin(d*1.2)*Math.exp(-d*d*.24);}
 else if(kind===3){d=r-front;value=Math.sin(d*2.3)*Math.exp(-d*d*.18)*Math.cos(q*.65);}
 else if(kind===4)value=Math.sin(rad*2.1-angle*3+phase*6)*Math.exp(-rad*rad*.045);
 else if(kind===5)value=(Math.sin((q-front)*1.5)*Math.exp(-((q-front)**2)*.4)+Math.sin((r+front)*1.5)*Math.exp(-((r+front)**2)*.4))*.65;
 else if(kind===6){d=(q-front)**2*.25+r*r*.1;value=(1-d*.7)*Math.exp(-d);}
 else if(kind===7){d=r-front+Math.abs(q)*.65;value=Math.sin(d*2)*Math.exp(-d*d*.3);}
 else if(kind===8)value=Math.sin(rad*2.7-phase*8)*Math.cos(q*.55)*Math.exp(-rad*rad*.04);
 else if(kind===9)value=Math.cos(angle*6+phase*4)*Math.sin(rad*1.6)*Math.exp(-rad*rad*.06);
 else if(kind===10){d=r-front+Math.sin(q*.85+phase*5)*.9;value=Math.sin(d*2)*Math.exp(-d*d*.3)*Math.cos(q*.6);}
 else {d=r-front;value=Math.sin(q*.9+d*3)*Math.exp(-d*d*.3)/(1+q*q*.035);}
 return value*(.48+bass*.16)*envelope;
}
export const transitionGLSL=`
float transitionRelief(vec3 p){
 vec2 q=vec2(dot(p.xz,uFlow.xy),dot(p.xz,vec2(-uFlow.y,uFlow.x)));
 float phase=uWorlds.z,front=mix(-5.,5.,phase),rad=length(q),angle=atan(q.y,q.x),seed=uFlow.z;
 int kind=min(11,int(floor(seed/6.28318530718*12.)));float d,value;
 if(kind==0){d=q.y-front+sin(q.x*.38+seed)*.6;value=sin(d*1.7)*exp(-d*d*.33);}
 else if(kind==1){d=rad-(.5+phase*5.5);value=cos(d*2.4)*exp(-d*d*.56);}
 else if(kind==2){d=q.x-front+sin(q.y*.43+seed)*.75;value=sin(d*1.2)*exp(-d*d*.24);}
 else if(kind==3){d=q.y-front;value=sin(d*2.3)*exp(-d*d*.18)*cos(q.x*.65);}
 else if(kind==4)value=sin(rad*2.1-angle*3.+phase*6.)*exp(-rad*rad*.045);
 else if(kind==5)value=(sin((q.x-front)*1.5)*exp(-(q.x-front)*(q.x-front)*.4)+sin((q.y+front)*1.5)*exp(-(q.y+front)*(q.y+front)*.4))*.65;
 else if(kind==6){d=(q.x-front)*(q.x-front)*.25+q.y*q.y*.1;value=(1.-d*.7)*exp(-d);}
 else if(kind==7){d=q.y-front+abs(q.x)*.65;value=sin(d*2.)*exp(-d*d*.3);}
 else if(kind==8)value=sin(rad*2.7-phase*8.)*cos(q.x*.55)*exp(-rad*rad*.04);
 else if(kind==9)value=cos(angle*6.+phase*4.)*sin(rad*1.6)*exp(-rad*rad*.06);
 else if(kind==10){d=q.y-front+sin(q.x*.85+phase*5.)*.9;value=sin(d*2.)*exp(-d*d*.3)*cos(q.x*.6);}
 else {d=q.y-front;value=sin(q.x*.9+d*3.)*exp(-d*d*.3)/(1.+q.x*q.x*.035);}
 return value*(.48+uBands.x*.16)*transitionEnvelope();
}
`;
