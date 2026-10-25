import { PaletteTimeline } from './palettes.mjs';

// Macro surfaces with ray-traced relief, self-shadowing and a gyroid conductor.
// The height atlas is evaluated once per texel, rather than at every ray step.
const atlasSize=512;
export const universeNames=['matiere','hertz','electricite','magnetisme','membrane','magma','cristal','fluide','strates','interferences'];
const common=`
float hash(vec2 p) {
  vec3 a=fract(vec3(p.xyx)*.1031);a+=dot(a,a.yzx+33.33);
  return fract((a.x+a.y)*a.z);
}
float noise(vec2 p) {
  vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
}
float fbm(vec2 p) {return noise(p)*.54+noise(p*2.03+17.1)*.27+noise(p*4.13-5.3)*.13+noise(p*8.17+7.2)*.06;}
mat2 turn(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec3 cells(vec2 p) {
  vec2 cell=floor(p),f=fract(p);float nearest=10.,second=10.,seed=0.;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++) {
    vec2 g=vec2(float(x),float(y)),id=cell+g;
    vec2 point=g+vec2(hash(id),hash(id+41.))*.72+.14-f;
    float d=dot(point,point);
    if(d<nearest){second=nearest;nearest=d;seed=hash(id+81.);}
    else second=min(second,d);
  }
  return vec3(sqrt(nearest),second-nearest,seed);
}
`;
export const reliefFragment=`#version 300 es
precision highp float;
uniform float uTime;
uniform vec3 uBands;
uniform vec3 uTransients;
uniform vec3 uWorlds;
uniform sampler2D uSignal;
out vec4 fragColor;
${common}
float height(int id,vec2 p) {
  float t=uTime;
  float bass=uBands.x,mid=uBands.y,high=uBands.z;
  if(id==1) {
    vec2 q=turn(-.32)*p;
    float swell=sin(q.y*.63-t*.48)*1.65+sin(q.y*.23+t*.31)*.7;
    float phase=q.x*1.18+swell-t*.67;
    float body=sin(phase)*(1.25+bass*.55)+sin(q.y*.91+t*.34)*.45;
    float ribs=sin(phase*15.+q.y*2.1)*.085;
    ribs+=sin(phase*31.-q.y*4.)*.025*(.5+high);
    float wave=texture(uSignal,vec2(clamp(p.x*.04+.5,0.,1.),.5)).r*2.-1.;
    return body+ribs+wave*.09*mid;
  }
  if(id==3) {
    vec2 q=p;
    q.x+=sin(p.y*.64-t*.38)*.35;
    q.y+=sin(p.x*.4+t*.41)*.22;
    q*=1.8;
    float row=floor(q.y);
    q.x+=mod(row,2.)*.5;
    vec2 c=floor(q),local=fract(q)-.5;
    float seed=hash(c);
    float radius=length(local*vec2(1.,1.15));
    float peak=pow(max(0.,1.-radius*1.82),1.35);
    float tide=.6+.4*sin(p.x*.75+p.y*.83-t*.85);
    float base=sin(p.x*.43-t*.36)*sin(p.y*.5+t*.21)*.4;
    return base+peak*(.55+tide*.8+bass*.65+seed*.18)-.45;
  }
  if(id==4) {
    vec2 q=turn(.6)*p;
    float flow=q.x*.72+sin(q.y*.6-t*.56)*1.4+t*.55;
    float fold=sin(flow)*1.45+sin(q.y*.72+t*.57)*.7;
    fold+=sin(q.x*1.9+q.y*.9+sin(q.y*.64-t*.5)*1.6)*(.22+mid*.22);
    float pleat=sin(flow*9.+q.y*.4)*.055;
    return fold*(.85+bass*.28)+pleat;
  }
  if(id==5) {
    vec2 q=(p+vec2(t*.14,-t*.1))*1.2;
    q+=vec2(fbm(p*.55+t*.045),fbm(p*.55-t*.039+8.))*.8;
    vec3 rock=cells(q);
    float crack=exp(-rock.y/(.018+bass*.022));
    float strata=fbm(p*1.8+t*.08)*.8+fbm(p*7.7)*.15;
    return strata+rock.z*.65-crack*(.7+bass*.35)-.65;
  }
  if(id==6) {
    // Broad mineral facets with bevelled seams, not a field of identical spikes.
    vec2 q=turn(.24)*p*.94;
    q+=vec2(sin(p.y*.38-t*.24),cos(p.x*.41+t*.2))*.32;
    vec3 mineral=cells(q);
    float facet=1.-mineral.x*1.55;
    float seam=smoothstep(0.,.07,mineral.y);
    float pressure=.7+.3*sin(p.x*.48-p.y*.32-t*.5);
    return facet*(1.5+bass*.65)*seam+mineral.z*.75+pressure*.45-.9;
  }
  if(id==7) {
    // Rounded, connected liquid lobes and narrow valleys, advected as one skin.
    vec2 q=turn(-.38)*p;
    q+=vec2(sin(q.y*.57-t*.42),sin(q.x*.48+t*.36))*.8;
    float flow=sin(q.x*.87+t*.49)+cos(q.y*.93-t*.38);
    float lobes=exp(-pow(flow*.92,2.));
    float swell=sin(q.x*.37+q.y*.46-t*.55)*.4;
    float ripples=sin(flow*18.+q.y*2.-t)*.035*(.5+high);
    return lobes*(1.8+bass*.55)+swell+ripples-.85;
  }
  if(id==8) {
    // Contour shelves have a flat tread, a rounded lip and a steep riser.
    vec2 q=turn(.7)*p;
    float drift=q.y*.53+sin(q.x*.46-t*.31)*1.1;
    drift+=fbm(q*.54+vec2(t*.07,-t*.045))*(1.+mid*.42);
    float levels=drift*2.6;
    float terraces=(floor(levels)+smoothstep(.67,.95,fract(levels)))/2.6;
    float basin=sin(terraces*1.55+t*.26)*(1.35+bass*.35);
    return basin+sin(q.x*.38+t*.2)*.4;
  }
  if(id==9) {
    // Three travelling wave fronts interfere through a continuous metal skin.
    vec2 a=vec2(-2.+sin(t*.23)*.8,-1.4);
    vec2 b=vec2(2.1,1.+cos(t*.2)*.7);
    float r1=length(p-a),r2=length(p-b),r3=length(p+vec2(.6,3.2));
    float waves=sin(r1*3.6-t*1.7)+sin(r2*3.9-t*1.45)*.7;
    waves+=sin(r3*2.1+t*.8)*.35;
    float envelope=.75+.25*cos(p.x*.35+p.y*.28-t*.3);
    float fine=sin(r1*22.-t*2.)*sin(r2*19.+t)*.045*(.4+high);
    return waves*(.48+bass*.23)*envelope+fine+sin(p.y*.5-t*.3)*.25;
  }
  return 0.;
}
vec2 encode(float h){float v=floor(clamp((h+5.)/10.,0.,1.)*65535.+.5);return vec2(floor(v/256.),mod(v,256.))/255.;}
void main(){
  vec2 p=(gl_FragCoord.xy/${atlasSize}.-.5)*24.;
  int a=int(uWorlds.x),b=int(uWorlds.y);
  float first=height(a,p),second=a==b?first:height(b,p);
  fragColor=vec4(encode(first),encode(second));
}`;
export const universeFragment=`#version 300 es
precision highp float;
uniform sampler2D uSurface;
uniform sampler2D uRelief;
uniform sampler2D uSignal;
uniform float uTime;
uniform vec3 uBands;
uniform vec3 uTransients;
uniform vec3 uWorlds;
uniform vec2 uResolution;
uniform vec3 uPaletteFrom[4];
uniform vec3 uPaletteTo[4];
uniform vec4 uFlow;
out vec4 fragColor;
${common}
float elevation(vec2 p,int layer){
  vec4 h=texture(uRelief,clamp(p/24.+.5,vec2(.001),vec2(.999)));
  vec2 b=layer==0?h.rg:h.ba;
  return (b.x*255.*256.+b.y*255.)/65535.*10.-5.;
}
vec3 conductorPoint(vec3 p){
  p.xz=turn(uTime*.065)*p.xz;
  p.x+=sin(p.z*.65+uTime*.34)*(.22+uBands.x*.15);
  p.z+=sin(p.x*.6-uTime*.28)*.25;
  return p;
}
float singleDistance(vec3 p,int id,int layer){
  if(id==2){
    vec3 q=conductorPoint(p)*2.25;
    float gyroid=dot(sin(q),cos(q.yzx));
    float shell=abs(gyroid)/6.8-(.064+uBands.x*.024);
    return max(shell,max(p.y-1.35,-p.y-1.9));
  }
  return (p.y-elevation(p.xz,layer))*.28;
}
bool morphing(){return uWorlds.x>0.&&uWorlds.y>0.&&uWorlds.x!=uWorlds.y&&uWorlds.z>0.&&uWorlds.z<1.;}
float ease5(float t){t=clamp(t,0.,1.);return t*t*t*(t*(t*6.-15.)+10.);}
float transitionEnvelope(){float p=clamp(uWorlds.z,0.,1.);return 16.*p*p*(1.-p)*(1.-p);}
float morphWeight(vec3 p){
  float front=dot(p.xz,uFlow.xy)*.036+(noise(p.xz*.27+uFlow.z)-.5)*.17;
  return ease5(uWorlds.z+front*transitionEnvelope());
}
// Intermediate shapes are continuous deformations of the existing surface.
// They share its normals, material, shadows and audio response.
float transitionRelief(vec3 p){
  vec2 axis=normalize(uFlow.xy);
  vec2 q=vec2(dot(p.xz,axis),dot(p.xz,vec2(-axis.y,axis.x)));
  float phase=uWorlds.z,envelope=transitionEnvelope();
  float gain=.48+uBands.x*.16;
  float source=uWorlds.x;
  if(source==1.||source==3.){
    float front=mix(-5.,5.,phase);
    float d=q.y-front+sin(q.x*.38+uFlow.z)*.6;
    return sin(d*1.7)*exp(-d*d*.33)*gain*envelope;
  }
  if(source==2.||source==5.){
    float d=length(q)-(.5+phase*5.5);
    return cos(d*2.4)*exp(-d*d*.56)*gain*envelope;
  }
  float d=q.x-mix(-5.,5.,phase)+sin(q.y*.43+uFlow.z)*.75;
  return sin(d*1.2)*exp(-d*d*.24)*gain*envelope;
}
vec3 flowPoint(vec3 p,float direction){
  float envelope=transitionEnvelope();
  p.y-=transitionRelief(p);
  vec2 flow=vec2(sin(p.z*.42+uFlow.z),cos(p.x*.38-uFlow.z));
  p.xz+=flow*envelope*uFlow.w*direction;
  return p;
}
vec3 pigment(int index,int layer){return layer==0?uPaletteFrom[index]:uPaletteTo[index];}
float distanceField(vec3 p,int id,int layer){
  if(morphing())return mix(singleDistance(flowPoint(p,1.),int(uWorlds.x),0),singleDistance(flowPoint(p,-1.),int(uWorlds.y),1),morphWeight(p));
  return singleDistance(p,id,layer);
}
vec3 surfaceNormal(vec3 p,int id,int layer){
  float e=.025;
  return normalize(vec3(
    distanceField(p+vec3(e,0,0),id,layer)-distanceField(p-vec3(e,0,0),id,layer),
    distanceField(p+vec3(0,e,0),id,layer)-distanceField(p-vec3(0,e,0),id,layer),
    distanceField(p+vec3(0,0,e),id,layer)-distanceField(p-vec3(0,0,e),id,layer)));
}
float shadow(vec3 p,vec3 l,int id,int layer){
  float result=1.,t=.07;
  for(int i=0;i<12;i++){
    float h=distanceField(p+l*t,id,layer);
    result=min(result,8.*max(h,0.)/t);
    t+=clamp(h,.07,.36);
  }
  return clamp(result,.13,1.);
}
vec3 tone(vec3 c){return clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);}
void material(int id,vec3 p,vec3 n,vec3 v,float footprint,int layer,out vec3 albedo,out vec3 emission,out float rough,out float metal){
  vec2 q=p.xz;float grain=noise(q*105.);
  vec3 c0=pigment(0,layer),c1=pigment(1,layer),c2=pigment(2,layer),c3=pigment(3,layer);
  float ridge=.5+.5*sin(p.x*1.1+p.z*.6+uTime*.15);
  albedo=c1*.5;emission=vec3(0);
  rough=.36;metal=.7;
  if(id==1){
    albedo=mix(c0*.6,c1,smoothstep(.05,.95,ridge));
    float engraving=(p.x*.93+p.z*.31+sin(p.z*.6-uTime*.48)*1.3)*95.;
    float grooves=.85+.15*sin(engraving)*exp(-footprint*95.*.5);
    albedo*=grooves;rough=.26;metal=.9;
    emission=c2*.4*uTransients.z*pow(max(n.y,0.),9.)*.22;
  }else if(id==2){
    vec3 c=conductorPoint(p);
    albedo=mix(c0*.3,c1*.14,ridge);rough=.25;metal=.92;
    float route=sin(c.x*13.+sin(c.y*11.+uTime*1.6)*.8+c.z*17.);
    float filigree=pow(max(0.,1.-abs(route)),18.);
    float charge=.3+.7*pow(.5+.5*sin(c.z*2.9-c.x*1.3-uTime*1.8),3.);
    float lines=filigree*(.4+uBands.y*.8)*charge;
    emission=mix(c2,c3*1.2,smoothstep(-.7,1.2,c.y))*lines;
    emission+=c3*pow(filigree,5.)*uTransients.z*.4;
  }else if(id==3){
    albedo=mix(c0*.3,c1*.66,smoothstep(-.1,1.1,p.y));
    rough=.21;metal=.96;
    albedo*=.85+grain*.24;
  }else if(id==4){
    float fres=pow(1.-max(dot(n,v),0.),2.);
    albedo=mix(c0*.8,c1*.72,clamp(fres*.7+ridge*.45,0.,1.));
    float weave=(.5+.5*sin(q.x*235.))*(.5+.5*sin(q.y*220.));
    weave=.25+(weave-.25)*exp(-footprint*235.*.5);
    albedo*=.78+weave*.3;rough=.32;metal=.75;
  }else if(id==5){
    vec2 rock=(q+vec2(uTime*.14,-uTime*.1))*1.2;rock+=vec2(fbm(q*.55+uTime*.045),fbm(q*.55-uTime*.039+8.))*.8;
    vec3 cell=cells(rock);
    float fissure=exp(-cell.y/(.034+uBands.x*.028));
    float skin=fbm(q*24.);
    albedo=mix(c0*.4,c1*.27,skin)*(.5+skin*.9);rough=.82;metal=.12;
    float heat=.55+.45*sin(q.x*.85-q.y*.7-uTime*.6);
    emission=c2*1.5*fissure*(.65+uBands.x*.55);
    emission+=c3*1.5*pow(fissure,3.)*heat*(.3+uBands.y*.8);
    emission+=c3*1.3*pow(grain,18.)*fissure*uTransients.z;
  }else if(id==6){
    vec2 crystal=turn(.24)*q*.94;
    crystal+=vec2(sin(q.y*.38-uTime*.24),cos(q.x*.41+uTime*.2))*.32;
    vec3 facet=cells(crystal);
    albedo=mix(c0*.65,c1*.8,facet.z);
    float bevel=exp(-facet.y/.035);
    float cleavage=pow(.5+.5*sin((q.x+q.y*.4)*48.+facet.z*12.),18.);
    albedo*=.88+cleavage*.12*exp(-footprint*48.);
    rough=.19;metal=.62;
    emission=c2*bevel*(.12+uBands.y*.48);
    emission+=c3*pow(max(dot(n,v),0.),12.)*uTransients.z*.2;
  }else if(id==7){
    float marble=sin(q.x*.9+q.y*.65+sin(q.y*.8-uTime*.48)*2.1);
    float fres=pow(1.-max(dot(n,v),0.),2.);
    albedo=mix(c0*.55,c1*.82,smoothstep(-.6,.8,marble));
    albedo=mix(albedo,c2*.65,fres*.45);
    rough=.14;metal=.97;
    float caustic=pow(.5+.5*sin(q.x*8.+sin(q.y*4.-uTime*.6)*2.),22.);
    emission=c3*caustic*(.03+uBands.z*.12)*max(n.y,0.);
  }else if(id==8){
    float contour=.5+.5*sin(p.y*43.);
    float sediment=fbm(q*6.5+vec2(0,uTime*.025));
    albedo=mix(c0*.55,c1*.85,smoothstep(-.9,.9,p.y));
    albedo*=.68+sediment*.45;rough=.65;metal=.3;
    float vein=pow(contour,20.)*smoothstep(.25,.85,n.y);
    emission=mix(c2,c3,sediment)*vein*(.12+uBands.y*.55);
  }else if(id==9){
    float contour=.5+.5*sin(p.y*18.+q.x*.35);
    albedo=mix(c0*.65,c1*.82,contour);rough=.27;metal=.86;
    float node=pow(max(n.y,0.),8.);
    emission=c2*node*(.06+uBands.y*.22);
    emission+=c3*pow(contour,16.)*uTransients.z*.3;
  }
}
vec3 renderSculpture(int id,vec2 uv,int layer){
  vec2 screen=(uv-.5)*2.;
  vec3 eye=vec3(0,6.2,6.8),target=vec3(0,0,-.35);
  vec3 forward=normalize(target-eye),right=normalize(cross(forward,vec3(0,1,0))),up=cross(right,forward);
  vec3 rd=normalize(forward+screen.x*right*.37+screen.y*up*.37);
  float travel=2.5,previousTravel=2.5,d=1.;vec3 p=eye;
  bool hit=false;
  for(int i=0;i<86;i++){
    p=eye+rd*travel;d=distanceField(p,id,layer);
    if(d<.0045){hit=true;break;}
    previousTravel=travel;travel+=clamp(d*.88,.009,.65);
    if(travel>22.)break;
  }
  vec3 backdrop=pigment(0,layer)*.075;
  if(morphing())backdrop=mix(pigment(0,0),pigment(0,layer),morphWeight(p))*.075;
  if(!hit)return backdrop;
  // Bisection stabilizes thin crests and the holes in the conductor.
  float lo=previousTravel,hi=travel;
  for(int i=0;i<7;i++){
    float m=(lo+hi)*.5;
    if(distanceField(eye+rd*m,id,layer)>.0015)lo=m;else hi=m;
  }
  p=eye+rd*((lo+hi)*.5);
  vec3 n=surfaceNormal(p,id,layer),v=-rd;
  vec2 q=p.xz;
  float footprint=travel*.74/uResolution.x;
  float grain=noise(q*105.);
  float micro=sin(q.x*126.+sin(q.y*13.)*.7)*sin(q.y*112.);
  micro*=exp(-footprint*126.*.35);
  vec3 tangent=normalize(cross(n,vec3(.17,1,.11)));
  float microStrength=id==5?.11:.035;
  if(morphing())microStrength=mix(int(uWorlds.x)==5?.11:.035,microStrength,morphWeight(p));
  n=normalize(n+tangent*micro*microStrength);
  vec3 albedo,emission;float rough,metal;
  material(id,morphing()?flowPoint(p,-1.):p,n,v,footprint,layer,albedo,emission,rough,metal);
  if(morphing()){
    vec3 sourceAlbedo,sourceEmission;float sourceRough,sourceMetal;
    material(int(uWorlds.x),flowPoint(p,1.),n,v,footprint,0,sourceAlbedo,sourceEmission,sourceRough,sourceMetal);
    float w=morphWeight(p);
    albedo=mix(sourceAlbedo,albedo,w);emission=mix(sourceEmission,emission,w);
    rough=mix(sourceRough,rough,w);metal=mix(sourceMetal,metal,w);
  }
  vec3 accent=pigment(2,layer),glow=pigment(3,layer),ambient=pigment(0,layer);
  if(morphing()){
    float w=morphWeight(p);
    accent=mix(pigment(2,0),accent,w);glow=mix(pigment(3,0),glow,w);ambient=mix(pigment(0,0),ambient,w);
  }
  vec3 key=normalize(vec3(-.6,.95,.35)),fill=normalize(vec3(.8,.45,-.5));
  float nl=max(dot(n,key),0.),nf=max(dot(n,fill),0.);
  float sh=shadow(p+n*.05,key,id,layer);
  vec3 halfK=normalize(key+v),halfF=normalize(fill+v);
  float spec=pow(max(dot(n,halfK),0.),mix(115.,12.,rough));
  float rim=pow(max(dot(n,halfF),0.),mix(80.,9.,rough));
  float fresnel=.035+(1.-.035)*pow(1.-max(dot(n,v),0.),5.);
  vec3 reflectance=mix(glow*.75,albedo*2.5,metal);
  float cavity=.5+.5*max(n.y,0.);
  vec3 light=albedo*((ambient*.25+glow*.18)*cavity+(vec3(.85)+glow*.85)*nl*sh+(accent*.5+vec3(.06))*nf*.7);
  light+=reflectance*spec*sh*(.25+metal*2.)+accent*.7*rim*(.15+metal);
  light+=glow*.3*fresnel*.3;
  light+=emission;
  // A fine etched surface catches local treble accents, never a full-screen flash.
  light+=albedo*pow(grain,24.)*uTransients.z*.5;
  light=mix(light,backdrop,clamp((travel-7.)*.018,0.,.22));
  light*=1.-.13*dot(screen,screen);
  return pow(tone(light*1.23),vec3(.94));
}
vec3 world(int id,vec2 uv,int layer){
  if(id==0)return texture(uSurface,uv).rgb;
  return renderSculpture(id,uv,layer);
}
void main(){
  vec2 uv=gl_FragCoord.xy/uResolution;
  int from=int(uWorlds.x),to=int(uWorlds.y);
  vec3 color;
  if(from!=to&&uWorlds.z<1.&&!morphing()){
    float envelope=transitionEnvelope();
    vec2 flow=vec2(sin(uv.y*4.+uFlow.z),cos(uv.x*4.-uFlow.z))*.022*envelope;
    float front=dot(uv-.5,uFlow.xy)*.4+(noise(uv*3.+uFlow.z)-.5)*.12;
    float blend=ease5(uWorlds.z+front*envelope);
    color=mix(world(from,clamp(uv+flow,vec2(0),vec2(1)),0),world(to,clamp(uv-flow,vec2(0),vec2(1)),1),blend);
  }else color=world(to,uv,1);
  fragColor=vec4(color,1.);
}`;
export class UniverseRenderer {
  constructor(gl,compile,vertex,options={}) {
    this.gl=gl;this.size=0;this.palettes=new PaletteTimeline(options.seed);this.flowKey=null;this.flow=new Float32Array([1,0,0,.4]);this.signal=new Uint8Array(512*2);this.signal.fill(128);
    const program=this.program=gl.createProgram();
    gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,universeFragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    this.locations=Object.fromEntries(['uTime','uBands','uTransients','uWorlds','uResolution','uPaletteFrom[0]','uPaletteTo[0]','uFlow'].map(n=>[n,gl.getUniformLocation(program,n)]));
    gl.useProgram(program);gl.uniform1i(gl.getUniformLocation(program,'uSurface'),0);gl.uniform1i(gl.getUniformLocation(program,'uSignal'),1);gl.uniform1i(gl.getUniformLocation(program,'uRelief'),2);
    this.surface=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.surface);
    this.configureTexture();
    this.buffer=gl.createFramebuffer();this.depth=gl.createRenderbuffer();
    this.signalTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.signalTexture);this.configureTexture();
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RG8,512,1,0,gl.RG,gl.UNSIGNED_BYTE,this.signal);
    this.fieldProgram=gl.createProgram();
    gl.attachShader(this.fieldProgram,compile(gl.VERTEX_SHADER,vertex));
    gl.attachShader(this.fieldProgram,compile(gl.FRAGMENT_SHADER,reliefFragment));gl.linkProgram(this.fieldProgram);
    if(!gl.getProgramParameter(this.fieldProgram,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.fieldProgram));
    gl.useProgram(this.fieldProgram);gl.uniform1i(gl.getUniformLocation(this.fieldProgram,'uSignal'),1);
    this.fieldLocations=Object.fromEntries(['uTime','uBands','uTransients','uWorlds'].map(n=>[n,gl.getUniformLocation(this.fieldProgram,n)]));
    this.fieldTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.fieldTexture);this.configureTexture();
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,atlasSize,atlasSize,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    this.fieldBuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this.fieldBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.fieldTexture,0);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Relief atlas unavailable');
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  }
  configureTexture() {
    const gl=this.gl;
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  }
  resize(size) {
    if(this.size===size)return;this.size=size;
    const gl=this.gl;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.surface);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.bindRenderbuffer(gl.RENDERBUFFER,this.depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,size,size);
    gl.bindFramebuffer(gl.FRAMEBUFFER,this.buffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.surface,0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,this.depth);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Audiovisual framebuffer unavailable');
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  }
  uploadSignal(waveform,spectrum,sampleRate) {
    let offset=0;
    if(waveform)for(let i=1;i<Math.min(512,waveform.length/4);i++) {
      if(waveform[i-1]<=0&&waveform[i]>0){offset=i;break;}
    }
    for(let i=0;i<512;i++) {
      const index=offset+Math.floor(i*(waveform?waveform.length-offset-1:0)/511);
      this.signal[i*2]=Math.round(Math.max(0,Math.min(1,.5+(waveform?.[index]||0)*1.8))*255);
      const hz=30*Math.pow(14000/30,i/511);
      const bin=Math.min((spectrum?.length||1)-1,Math.round(hz/(sampleRate||48000)*(spectrum?.length||1024)*2));
      const db=spectrum?.[bin]??-100;
      this.signal[i*2+1]=Math.round(Math.max(0,Math.min(1,(db+85)/70))*255);
    }
    const gl=this.gl;gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.signalTexture);
    gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,512,1,gl.RG,gl.UNSIGNED_BYTE,this.signal);gl.activeTexture(gl.TEXTURE0);
  }
  paletteFor(world,time) {return this.palettes.sample(world,time);}
  render(time,bands,transients,from,to,blend) {
    const gl=this.gl,l=this.locations;
    if(from!==to&&blend<1){
      const key=`${from}:${to}`;
      if(this.flowKey!==key){this.flow=this.palettes.flow(from,to,time);this.flowKey=key;}
    }else this.flowKey=null;
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.signalTexture);
    gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,null);gl.activeTexture(gl.TEXTURE0);
    if(from!==0||to!==0){
      gl.bindFramebuffer(gl.FRAMEBUFFER,this.fieldBuffer);gl.viewport(0,0,atlasSize,atlasSize);
      gl.disable(gl.DEPTH_TEST);gl.useProgram(this.fieldProgram);
      const f=this.fieldLocations;
      gl.uniform1f(f.uTime,time);gl.uniform3fv(f.uBands,bands);gl.uniform3fv(f.uTransients,transients);gl.uniform3f(f.uWorlds,from,to,blend);
      gl.drawArrays(gl.TRIANGLES,0,3);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,this.size,this.size);
    gl.disable(gl.DEPTH_TEST);gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.surface);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.signalTexture);gl.activeTexture(gl.TEXTURE0);
    gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,this.fieldTexture);gl.activeTexture(gl.TEXTURE0);
    gl.uniform1f(l.uTime,time);gl.uniform3fv(l.uBands,bands);gl.uniform3fv(l.uTransients,transients);
    gl.uniform3fv(l['uPaletteFrom[0]'],this.paletteFor(from,time));gl.uniform3fv(l['uPaletteTo[0]'],this.paletteFor(to,time));gl.uniform4fv(l.uFlow,this.flow);
    gl.uniform3f(l.uWorlds,from,to,blend);gl.uniform2f(l.uResolution,this.size,this.size);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
}
