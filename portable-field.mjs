const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const hash=(x,z)=>{let n=Math.imul(x|0,374761393)^Math.imul(z|0,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
function noise(x,z){const i=Math.floor(x),j=Math.floor(z),a=x-i,b=z-j,u=a*a*(3-2*a),v=b*b*(3-2*b);return mix(mix(hash(i,j),hash(i+1,j),u),mix(hash(i,j+1),hash(i+1,j+1),u),v);}
function fbm(x,z){return noise(x,z)*.57+noise(x*2.03+17,z*2.03+17)*.29+noise(x*4.13-5,z*4.13-5)*.14;}
const cell=new Float64Array(3);
function mineral(x,z){
 const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;let first=10,second=10,seed=0;
 for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
  const dx=i+hash(ix+i,iz+j)*.72+.14-fx,dz=j+hash(ix+i+41,iz+j+41)*.72+.14-fz,d=dx*dx+dz*dz;
  if(d<first){second=first;first=d;seed=hash(ix+i+81,iz+j+81);}else if(d<second)second=d;
 }
 cell[0]=Math.sqrt(first);cell[1]=second-first;cell[2]=seed;return cell;
}
// The mobile path evaluates one height per mesh vertex on the CPU. Its shaders
// contain no ray marching, vertex textures, instancing or float framebuffers.
export function sampleHeight(id,x,z,t,bands,waveform){
 const [bass,mid,high]=bands;let qx,qz;
 if(id===0){const a=Math.floor(x*5)/5,b=Math.floor(z*5)/5;return Math.sin(a*.8+t*.5)*.65+Math.sin(b*.95-t*.4)*.5+hash(Math.floor(x*5),Math.floor(z*5))*(.25+mid*.4)-.2;}
 if(id===1){
  qx=x*.949-z*.315;qz=x*.315+z*.949;
  const phase=qx*1.18+Math.sin(qz*.63-t*.48)*1.65+Math.sin(qz*.23+t*.31)*.7-t*.67;
  const wave=waveform?.[Math.floor(clamp(x*.04+.5)*Math.max(0,(waveform?.length||1)-1))]||0;
  return Math.sin(phase)*(1.25+bass*.55)+Math.sin(qz*.91+t*.34)*.45+Math.sin(phase*9+qz*2.1)*.05+wave*.09*mid;
 }
 if(id===2){
  qx=x+Math.sin(z*.65+t*.34)*(.22+bass*.15);qz=z+Math.sin(x*.6-t*.28)*.25;
  const a=Math.cos(qx*2.25),b=Math.cos(qz*2.25),lattice=Math.min(Math.abs(a),Math.abs(b));
  return Math.exp(-lattice*lattice*26)*(1.15+bass*.5)+Math.sin(qx*.8+qz*.7+t*.5)*.4-.65;
 }
 if(id===3){
  qx=(x+Math.sin(z*.64-t*.38)*.35)*1.8;qz=(z+Math.sin(x*.4+t*.41)*.22)*1.8;qx+=(Math.floor(qz)%2)*.5;
  const a=qx-Math.floor(qx)-.5,b=(qz-Math.floor(qz)-.5)*1.15;
  const peak=Math.pow(Math.max(0,1-Math.hypot(a,b)*1.82),1.35),tide=.6+.4*Math.sin(x*.75+z*.83-t*.85);
  return Math.sin(x*.43-t*.36)*Math.sin(z*.5+t*.21)*.4+peak*(.55+tide*.8+bass*.65)-.45;
 }
 if(id===4){qx=x*.825+z*.565;qz=-x*.565+z*.825;const flow=qx*.72+Math.sin(qz*.6-t*.56)*1.4+t*.55;return (Math.sin(flow)*1.45+Math.sin(qz*.72+t*.57)*.7+Math.sin(qx*1.9+qz*.9+Math.sin(qz*.64-t*.5)*1.6)*(.22+mid*.22))*(.85+bass*.28)+Math.sin(flow*9+qz*.4)*.055;}
 if(id===5){
  qx=(x+t*.14)*1.2+fbm(x*.55+t*.045,z*.55+t*.045)*.8;qz=(z-t*.1)*1.2+fbm(x*.55-t*.039+8,z*.55-t*.039+8)*.8;
  const c=mineral(qx,qz),crack=Math.exp(-c[1]/(.018+bass*.022)),seed=c[2];
  return fbm(x*1.8+t*.08,z*1.8+t*.08)*.8+seed*.65-crack*(.7+bass*.35)-.65;
 }
 if(id===6){
  qx=(x*.971+z*.238)*.94+Math.sin(z*.38-t*.24)*.32;qz=(-x*.238+z*.971)*.94+Math.cos(x*.41+t*.2)*.32;
  const c=mineral(qx,qz);return (1-c[0]*1.55)*(1.5+bass*.65)*smooth(0,.07,c[1])+c[2]*.75+(.7+.3*Math.sin(x*.48-z*.32-t*.5))*.45-.9;
 }
 if(id===7){
  qx=x*.929-z*.371;qz=x*.371+z*.929;const a=qx+Math.sin(qz*.57-t*.42)*.8,b=qz+Math.sin(qx*.48+t*.36)*.8,flow=Math.sin(a*.87+t*.49)+Math.cos(b*.93-t*.38);
  return Math.exp(-((flow*.92)**2))*(1.8+bass*.55)+Math.sin(a*.37+b*.46-t*.55)*.4+Math.sin(flow*18+b*2-t)*.035*(.5+high)-.85;
 }
 if(id===8){
  qx=x*.765+z*.644;qz=-x*.644+z*.765;const drift= qz*.53+Math.sin(qx*.46-t*.31)*1.1+fbm(qx*.54+t*.07,qz*.54-t*.045)*(1+mid*.42),levels=drift*2.6,terrace=(Math.floor(levels)+smooth(.67,.95,levels-Math.floor(levels)))/2.6;
  return Math.sin(terrace*1.55+t*.26)*(1.35+bass*.35)+Math.sin(qx*.38+t*.2)*.4;
 }
 const a=Math.hypot(x+2-Math.sin(t*.23)*.8,z+1.4),b=Math.hypot(x-2.1,z-1-Math.cos(t*.2)*.7),c=Math.hypot(x+.6,z+3.2);
 return (Math.sin(a*3.6-t*1.7)+Math.sin(b*3.9-t*1.45)*.7+Math.sin(c*2.1+t*.8)*.35)*(.48+bass*.23)*(.75+.25*Math.cos(x*.35+z*.28-t*.3))+Math.sin(a*8-t*2)*Math.sin(b*7+t)*.035*(.4+high)+Math.sin(z*.5-t*.3)*.25;
}
export function surfaceWeight(x,z,phase){const p=clamp(phase),e=16*p*p*(1-p)*(1-p),t=clamp(p+(x*.027+Math.sin(z*.4)*.035)*e);return t*t*t*(t*(t*6-15)+10);}
export function surfaceEmission(id,x,z,h,t,bands){
 if(id===2)return Math.pow(1-Math.abs(Math.sin(x*6+z*7-t)),12)*(.35+bands[1]);
 if(id===5)return Math.pow(clamp((-h-.05)*1.5),3)*(.6+bands[0]);
 if(id===6)return Math.exp(-Math.abs(h+.5)*9)*(.12+bands[1]*.45);
 if(id===8)return Math.pow(.5+.5*Math.sin(h*43),16)*(.12+bands[1]*.5);
 if(id===9)return Math.pow(.5+.5*Math.sin(h*18+x*.35),12)*(.05+bands[2]*.35);
 return Math.max(0,h)*bands[2]*.035;
}
