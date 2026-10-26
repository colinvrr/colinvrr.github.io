import {PaletteTimeline} from './palettes.mjs';
import {sampleHeight,surfaceWeight,surfaceEmission} from './portable-field.mjs';
const STRIDE=11;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>t<=0?a:t>=1?b:a+(b-a)*t;
function viewProjection(){
 const eye=[0,6.2,6.8],target=[0,0,-.35],normal=v=>{const l=Math.hypot(...v);return v.map(n=>n/l);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
 const z=normal(eye.map((v,i)=>v-target[i])),x=normal(cross([0,1,0],z)),y=cross(z,x);
 const v=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1],f=1/.37,n=.1,far=60,p=[f,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0],m=new Float32Array(16);
 for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)m[c*4+r]+=p[k*4+r]*v[c*4+k];return m;
}
export class PortableRenderer {
 constructor(canvas,gl,{seed,grid=160}={}){
  this.canvas=canvas;this.gl=gl;this.palettes=new PaletteTimeline(seed);this.matrix=viewProjection();this.size=0;this.slow=0;
  this.ctx=gl?null:canvas.getContext('2d',{alpha:false});
  if(!gl&&!this.ctx)throw Error('No graphics context available');
  this.setGrid(gl?grid:80);
  if(gl)this.initialize();
 }
 setGrid(grid){
  this.grid=grid;const count=(grid+1)**2;this.vertices=new Float32Array(count*STRIDE);this.heights=new Float32Array(count);this.projected=new Float32Array(count*2);
  this.indices=new Uint16Array(grid*grid*6);let offset=0;
  for(let z=0;z<grid;z++)for(let x=0;x<grid;x++){const a=z*(grid+1)+x,b=a+1,c=a+grid+1,d=c+1;this.indices.set([a,c,b,b,c,d],offset);offset+=6;}
  if(this.gl&&this.vertexBuffer){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,this.vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,this.vertices.byteLength,gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,this.indices,gl.STATIC_DRAW);}
 }
 initialize(){
  const gl=this.gl,modern=typeof gl.createVertexArray==='function',prefix=modern?'#version 300 es\n':'';
  const vertex=prefix+`precision highp float;
${modern?'in':'attribute'} vec3 aPosition;
${modern?'in':'attribute'} vec4 aNormal;
${modern?'in':'attribute'} vec4 aColor;
uniform mat4 uMatrix;
${modern?'out':'varying'} mediump vec3 vPosition;
${modern?'out':'varying'} mediump vec4 vNormal;
${modern?'out':'varying'} mediump vec4 vColor;
void main(){vPosition=aPosition;vNormal=aNormal;vColor=aColor;gl_Position=uMatrix*vec4(aPosition,1.);}`;
  const high=gl.getShaderPrecisionFormat?.(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT)?.precision>0;
  const fragment=prefix+`precision ${high?'highp':'mediump'} float;
${modern?'in':'varying'} mediump vec3 vPosition;
${modern?'in':'varying'} mediump vec4 vNormal;
${modern?'in':'varying'} mediump vec4 vColor;
uniform vec3 uGlow;
uniform vec3 uHighlight;
uniform vec2 uMaterial;
${modern?'out vec4 fragColor;':''}
void main(){
 vec3 n=normalize(vNormal.xyz),v=normalize(vec3(0.,6.2,6.8)-vPosition),key=normalize(vec3(-.6,.95,.35)),fill=normalize(vec3(.8,.45,-.5));
 float diffuse=max(dot(n,key),0.),second=max(dot(n,fill),0.),spec=pow(max(dot(n,normalize(key+v)),0.),mix(115.,14.,uMaterial.x));
 float grain=sin(vPosition.x*147.)*sin(vPosition.z*133.);
 vec3 albedo=vColor.rgb*(.97+grain*.025);
 vec3 light=albedo*(vec3(.19)*vNormal.w+(vec3(.85)+uHighlight*.55)*diffuse*vNormal.w+uGlow*.25*second);
 light+=mix(uHighlight*.6,albedo*2.,uMaterial.y)*spec*(.35+uMaterial.y*1.7)+uGlow*vColor.a;
 light=clamp((light*(2.51*light+.03))/(light*(2.43*light+.59)+.14),0.,1.);
 ${modern?'fragColor':'gl_FragColor'}=vec4(pow(light,vec3(.94)),1.);
}`;
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
  const program=this.program=gl.createProgram(),vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  if(modern){this.vao=gl.createVertexArray();gl.bindVertexArray(this.vao);}
  this.vertexBuffer=gl.createBuffer();this.indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,this.vertices.byteLength,gl.DYNAMIC_DRAW);
  for(const [name,length,offset]of [['aPosition',3,0],['aNormal',4,3],['aColor',4,7]]){const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,length,gl.FLOAT,false,STRIDE*4,offset*4);}
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,this.indices,gl.STATIC_DRAW);
  this.uniforms=Object.fromEntries(['uMatrix','uGlow','uHighlight','uMaterial'].map(name=>[name,gl.getUniformLocation(program,name)]));
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.useProgram(program);gl.uniformMatrix4fv(this.uniforms.uMatrix,false,this.matrix);
 }
 resize(size){this.size=size;}
 geometry(time,bands,transients,from,to,blend,waveform){
  const n=this.grid,row=n+1,step=24/n,h=this.heights,v=this.vertices,a=this.palettes.sample(from,time),b=this.palettes.sample(to,time),phase=clamp(blend),envelope=16*phase*phase*(1-phase)*(1-phase),morph=from!==to&&phase>0&&phase<1;
  for(let z=0;z<=n;z++)for(let x=0;x<=n;x++){
   const px=x*step-12,pz=z*step-12,i=z*row+x;
   const w=from===to?1:surfaceWeight(px,pz,phase),flow=morph?Math.sin(pz*.42+time*.04)*envelope*.35:0;
   const first=w<1?sampleHeight(from,px+flow,pz,time,bands,waveform):0,second=w>0?sampleHeight(to,px-flow,pz,time,bands,waveform):0;
   h[i]=mix(first,second,w)+(morph?Math.sin((pz+5-phase*10)*1.7)*Math.exp(-((pz+5-phase*10)**2)*.33)*(.48+bands[0]*.16)*envelope:0);
  }
  for(let z=0;z<=n;z++)for(let x=0;x<=n;x++){
   const i=z*row+x,j=i*STRIDE,px=x*step-12,pz=z*step-12,height=h[i],left=h[z*row+Math.max(0,x-1)],right=h[z*row+Math.min(n,x+1)],back=h[Math.max(0,z-1)*row+x],front=h[Math.min(n,z+1)*row+x];
   const nx=left-right,ny=step*2,nz=back-front,length=Math.hypot(nx,ny,nz),w=from===to?1:surfaceWeight(px,pz,phase),ridge=.5+.5*Math.sin(px*1.1+pz*.6+time*.15);
   const colorMix=clamp(ridge*.6+(height+1)*.18),cavity=clamp(1-((left+right+back+front)*.25-height)*.9,.48,1);
   v[j]=px;v[j+1]=height;v[j+2]=pz;v[j+3]=nx/length;v[j+4]=ny/length;v[j+5]=nz/length;v[j+6]=cavity;
   for(let c=0;c<3;c++)v[j+7+c]=mix(mix(a[c]*.55,a[c+3]*.85,colorMix),mix(b[c]*.55,b[c+3]*.85,colorMix),w);
   v[j+10]=mix(surfaceEmission(from,px,pz,height,time,bands),surfaceEmission(to,px,pz,height,time,bands),w)+transients[2]*.04*Math.max(0,ny/length);
  }
  this.colors=a.map((value,i)=>mix(value,b[i],phase));
 }
 render(time,bands,transients,from,to,blend,waveform,animate=true){
  if(animate&&this.pendingGrid){this.setGrid(this.pendingGrid);this.pendingGrid=0;}
  const begin=performance.now();this.geometry(time,bands,transients,from,to,blend,waveform);
  if(!this.gl){this.drawCanvas();return;}
  const gl=this.gl,p=this.colors;
  if(this.vao)gl.bindVertexArray(this.vao);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,this.size,this.size);gl.enable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.clearColor(p[0]*.06,p[1]*.06,p[2]*.06,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(this.program);gl.bindBuffer(gl.ARRAY_BUFFER,this.vertexBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,this.vertices);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.indexBuffer);
  const rough=[.55,.26,.25,.21,.32,.82,.19,.14,.65,.27],metal=[.55,.9,.92,.96,.75,.12,.62,.97,.3,.86];
  gl.uniform3fv(this.uniforms.uGlow,p.subarray(6,9));gl.uniform3fv(this.uniforms.uHighlight,p.subarray(9,12));gl.uniform2f(this.uniforms.uMaterial,mix(rough[from],rough[to],blend),mix(metal[from],metal[to],blend));
  gl.drawElements(gl.TRIANGLES,this.indices.length,gl.UNSIGNED_SHORT,0);
  if(animate){
   if(performance.now()-begin>40)this.slow++;else this.slow=Math.max(0,this.slow-1);
   if(this.slow>=6&&this.grid>96){this.pendingGrid=this.grid>128?128:96;this.slow=0;}
  }
 }
 drawCanvas(){
  const ctx=this.ctx,size=this.size,m=this.matrix,v=this.vertices,n=this.grid,row=n+1,p=this.projected;
  ctx.fillStyle=`rgb(${this.colors.slice(0,3).map(x=>Math.round(x*20)).join(',')})`;ctx.fillRect(0,0,size,size);
  for(let i=0;i<this.heights.length;i++){
   const j=i*STRIDE,x=v[j],y=v[j+1],z=v[j+2],w=m[3]*x+m[7]*y+m[11]*z+m[15];
   if(w<=.1){p[i*2]=p[i*2+1]=NaN;continue;}
   p[i*2]=(m[0]*x+m[4]*y+m[8]*z+m[12])/w*size*.5+size*.5;p[i*2+1]=size*.5-(m[1]*x+m[5]*y+m[9]*z+m[13])/w*size*.5;
  }
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){
   const a=z*row+x,b=a+1,c=a+row,d=c+1,j=a*STRIDE;
   if(![a,b,c,d].every(i=>Number.isFinite(p[i*2]))||p[a*2+1]<-size||p[a*2+1]>size*2)continue;
   const light=.24+Math.max(0,-v[j+3]*.48+v[j+4]*.76+v[j+5]*.28)*v[j+6];
   const color=[0,1,2].map(k=>{const value=v[j+7+k]*light*1.5+this.colors[k+6]*v[j+10];return Math.round(Math.pow(value/(.45+value),.85)*255);});
   ctx.beginPath();ctx.moveTo(p[a*2],p[a*2+1]);ctx.lineTo(p[b*2],p[b*2+1]);ctx.lineTo(p[d*2],p[d*2+1]);ctx.lineTo(p[c*2],p[c*2+1]);ctx.closePath();ctx.fillStyle=`rgb(${color.join(',')})`;ctx.fill();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.55;ctx.stroke();
  }
 }
 dispose(){if(this.gl){this.gl.deleteBuffer(this.vertexBuffer);this.gl.deleteBuffer(this.indexBuffer);this.gl.deleteProgram(this.program);if(this.vao)this.gl.deleteVertexArray(this.vao);}}
}
