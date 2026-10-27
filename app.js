import { WorldDeck } from './video-score.mjs';
import { MetalShutter } from './shutter.mjs?v=20';
import { StreetScene } from './model-scene.mjs?v=29';
import { UniverseRenderer, universeNames } from './universes.mjs?v=26';
import { createMediaControls } from './media-controls.mjs';
import { MechanicalFeedback } from './mechanics.mjs?v=13';
import { createTrackClock } from './track-clock.mjs?v=13';
import { applyPlace } from './places.mjs?v=20';

let canvas = document.querySelector('#canvas');
const surface = document.querySelector('#surface');
const visualWindow = document.querySelector('#visual-window');
const graphicsNotice=document.querySelector('#graphics-notice');
const place = applyPlace(surface);
const scene = new StreetScene(document.querySelector('#model-canvas'),visualWindow,place,{frameElement:surface});
surface.dataset.placeReady='true';
const picker = document.querySelector('#file');
const status = document.querySelector('#status');
const playButton = document.querySelector('#play');
const pauseButton = document.querySelector('#pause');
const stopButton = document.querySelector('#stop');
const shareButton = document.querySelector('#share');
const shareLabel = document.querySelector('#share-label');
const mixButton = document.querySelector('#mix');
const mixLed = document.querySelector('#mix-led');
const track = {src:null, file:null,duration:0,title:'MIX'};
const trackClock=createTrackClock(document.querySelector('#mix-time'));
const feedback=new MechanicalFeedback();
feedback.setVisible(!document.hidden);
const mediaControls=createMediaControls({
  getAudio:()=>mode==='file'?media:null,
  play:resumePlayback,
  pause:()=>{++inputGeneration;if(mode!=='idle'||mixStarting)pausePlayback();else{clockArmed=false;syncControls();}},
  stop:stopPlayback
});
const shutter = new MetalShutter(scene,{onMotion:motion=>feedback.shutter(motion)});
let playing=false, visualPaused=true, shutterOpen=false, shutterUntil=0,hasStarted=false,clockArmed=false;
let preparedAudio=null,mixStarting=false;
let graphicsDirty=true;
function prepareMixAudio(src){
  const audio=document.getElementById?.('preloaded-mix')||new Audio();
  audio.crossOrigin='anonymous';audio.preload='auto';
  if(audio.getAttribute?.('src')!==src)audio.src=src;
  preparedAudio=audio;
  if(audio.networkState!==2)audio.load();
}
const mixesReady = fetch('./mixes.json?v=25').then(response => {
  if(!response.ok)throw new Error('Mix configuration unavailable');
  return response.json();
}).then(config => { track.src=config.src || null;track.title=config.title||'MIX';if(!track.file){track.duration=Number(config.duration)||0;trackClock.update(null,track.duration);if(track.src)prepareMixAudio(track.src);} })
.catch(() => { /* Local file loading remains available without a configuration. */ });
function syncControls() {
  graphicsDirty=true;
  if(playing)hasStarted=true;
  mixButton.dataset.invite=String(!hasStarted);
  playButton.setAttribute('aria-pressed',String(playing));
  pauseButton.setAttribute('aria-pressed',String(!playing && mode!=='idle'));
  const active=(playing && mode==='file')||mixStarting;
  mixButton.dataset.pending=String(mixStarting);
  mixButton.setAttribute('aria-checked',String(active));
  mixButton.setAttribute('aria-label',active ? 'Mettre le mix en pause et fermer le volet' : 'Lancer le mix');
  mixLed.dataset.on=String(active);
  mixLed.setAttribute('aria-label',`MIX ${active?'en lecture':'à l’arrêt'}`);
  mediaControls.update(mode==='file'?media:null,playing,track.file?.name?.replace(/\.[^.]+$/,'')||track.title||'MIX');
  trackClock.update(mode==='file'?media:null,track.duration);
  trackClock.setPower(clockArmed&&(mode==='file'||mode==='idle'));
}
function setShutter(open) {
  shutterOpen=open;
  surface.dataset.open=String(open);
  shutter.setOpen(open);
  shutterUntil=performance.now()+2300;
}
function requestFile() {
  picker.click();
}
// One renderer and one quality policy on desktop, Android and iOS.
const contextOptions={antialias:false,alpha:false,powerPreference:'high-performance'};
function acquireContext(target){try{return target.getContext('webgl2',contextOptions);}catch{return null;}}
let gl=acquireContext(canvas);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const setStatus = (message, error = false) => {
  status.textContent = message;
  surface.dataset.state = error ? 'error' : 'ready';
};

// Every cell is a solid, bevelled plate. Its location stays in the same row.
const vertexSource = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec4 aCell;
uniform mat4 uViewProjection;
uniform float uTime;
uniform vec3 uBands;
uniform vec3 uTransients;
uniform float uShape;
uniform vec3 uScenes;
uniform float uMotion;
uniform vec4 uPulses[8];
out vec3 vNormal;
out vec3 vWorld;
out float vHeight;
out float vSeed;
out float vAccent;
float terrain(vec2 p) {
  float t=uTime;
  float bend=sin(p.y*.48+p.x*.19-t*.16)*1.4;
  float ridge=sin(p.x*.67+p.y*.23+bend-t*.24);
  float fold=sin(p.y*1.12-p.x*.34+sin(p.x*.48+t*.12)*1.6+t*.2);
  float rolling=ridge*.95+fold*.53+sin(p.x*.29-p.y*.34+t*.16)*.5;
  float pleats=(abs(sin(p.x*.95+p.y*.18+sin(p.y*.28+t*.1)*.6-t*.23))*2.-1.)*1.6;
  pleats+=sin(p.y*.37+t*.12)*.25;
  float square=max(abs(sin(p.x*.53+t*.08)),abs(sin(p.y*.53-t*.06)));
  float terraces=floor((1.-square)*6.)*.44-.95+sin(p.x*.22-p.y*.15)*.25;
  float gridX=abs(sin(p.x*.74+t*.12));
  float gridY=abs(sin(p.y*.74-t*.08));
  float weave=(smoothstep(.2,.6,gridX)-.5)*1.7+(smoothstep(.2,.65,gridY)-.5)*1.4;
  float faults=(1.-4.*abs(fract(p.x*.075+p.y*.13-t*.012)-.5))*1.6;
  faults+=(1.-4.*abs(fract(p.y*.1-p.x*.04+t*.01)-.5))*.65;
  float forms[5]=float[5](rolling,pleats,terraces,weave,faults);
  float details[5]=float[5](1.,.75,.3,.4,.5);
  int from=int(uScenes.x),to=int(uScenes.y);
  float broad=mix(forms[from],forms[to],uScenes.z);
  float detail=mix(details[from],details[to],uScenes.z);
  float strata=sin(p.x*2.1+p.y*1.8+ridge*2.2-t*.85)*(.09+.36*uBands.y);
  strata+=sin(p.y*4.3+p.x*.7+fold*1.9+t*1.1)*(.035+.13*uBands.y);
  float midPush=sin(p.y*2.7-p.x*.8+t*2.1+fold)*(.3*uBands.y+.3*uTransients.y);
  float push=0.;
  for(int i=0;i<8;i++) {
    vec4 pulse=uPulses[i];
    float age=t-pulse.z;
    float d=length(p-pulse.xy);
    float ring=d-age*3.3;
    push+=pulse.w*exp(-age*.92)*exp(-ring*ring*.48)*sin(ring*1.55)*step(0.,age);
  }
  float bassPush=ridge*.82*uBands.x+sin(p.x*.34-p.y*.56+t*.48)*.45*uTransients.x;
  float highRibs=sin(p.y*7.+p.x*3.-t*4.5)*(.055*uBands.z+.075*uTransients.z);
  return broad*(1.+uBands.x*.52*uMotion)+(strata*detail+midPush*detail+bassPush+highRibs+push*1.65)*uMotion;
}
void main() {
  vec2 p=aCell.xy;
  float h=terrain(p);
  float sx=(terrain(p+vec2(.06,0.))-h)/.06;
  float sz=(terrain(p+vec2(0.,.06))-h)/.06;
  // Small coherent openings between adjacent rows reveal the dark sides.
  float banded=sin(p.y*7.+p.x*3.1-uTime*8.);
  float highZone=pow(max(0.,sin(p.x*1.7+p.y*2.4-uTime*3.2)),5.);
  h+=(banded*.14*uBands.z+highZone*.24*uTransients.z)*uMotion;
  float spacing=1.-.075*uBands.y*(.5+.5*sin(p.y*2.+uTime*3.))-.05*uBands.z*highZone;
  vec3 world=vec3(p.x+aPosition.x*aCell.z*spacing, h+aPosition.y, p.y+aPosition.z*.108*spacing);
  world.y += (aPosition.x*aCell.z*sx+aPosition.z*.108*sz)*.18;
  vNormal=normalize(vec3(aNormal.x-sx*.18*aNormal.y,aNormal.y,aNormal.z-sz*.18*aNormal.y));
  vWorld=world;
  vHeight=h;
  vSeed=aCell.w;
  vAccent=(uBands.z*.65+uTransients.z*1.05)*pow(max(0.,sin(p.x*2.7+p.y*3.4-uTime*5.+aCell.w*2.)),7.);
  vAccent+=uTransients.y*.25*highZone;
  gl_Position=uViewProjection*vec4(world,1.);
}`;
const fragmentSource = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
in float vHeight;
in float vSeed;
in float vAccent;
uniform float uTime;
uniform vec3 uBands;
uniform vec3 uTransients;
uniform float uShape;
uniform vec3 uScenes;
uniform vec3 uPalette[4];
out vec4 fragColor;
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void main() {
  vec2 p=vWorld.xz;
  float scene=mix(uScenes.x,uScenes.y,uScenes.z);
  float heat=sin(p.x*(.32+scene*.035)+p.y*.24+sin(p.y*.52)*.9-uTime*.025+scene*.9)*.38;
  heat+=sin(p.y*.46-p.x*.21+1.7)*.29;
  float activityMask=.5+.5*sin(p.x*.78-p.y*.63+uShape*.7);
  heat+=vHeight*.19+uBands.x*.08+uBands.y*.14*activityMask+uTransients.y*.12*activityMask;
  float cool=smoothstep(.25,.78,sin(p.x*.36-p.y*.28+2.2+scene*.83)+sin(p.y*.67+p.x*.17)*.3);
  float layer=sin(vHeight*3.8+p.y*.37)*.07;
  float value=clamp(heat+layer+.36,0.,1.);
  vec3 dark=uPalette[0]*.09;
  vec3 purple=uPalette[0]*.9;
  vec3 magenta=uPalette[1]*.8;
  vec3 red=mix(uPalette[1],uPalette[2],.4);
  vec3 ember=uPalette[2];
  vec3 yellow=uPalette[3];
  vec3 warm=mix(dark,purple,smoothstep(.02,.32,value));
  warm=mix(warm,magenta,smoothstep(.23,.51,value));
  warm=mix(warm,red,smoothstep(.48,.7,value));
  warm=mix(warm,ember,smoothstep(.68,.88,value));
  warm=mix(warm,yellow,smoothstep(.88,1.,value));
  vec3 cold=mix(uPalette[0]*.15,uPalette[2]*.8,smoothstep(.08,.62,value));
  cold=mix(cold,uPalette[3],smoothstep(.56,.96,value));
  vec3 color=mix(warm,cold,cool*.93);
  float light=max(0.,dot(normalize(vNormal),normalize(vec3(-.55,.88,.32))));
  float occlusion=smoothstep(-1.55,.6,vHeight)*.64+.36;
  float faceting=.77+vSeed*.32;
  float energy=max(uBands.x,max(uBands.y,uBands.z));
  color*=(.13+light*.94)*occlusion*faceting*(.64+energy*.42);
  color+=color*vAccent*1.2;
  color+=mix(uPalette[1],uPalette[2],cool)*vAccent*.36;
  // Pixel grain and sparse ordered dithering, no bloom or screen overlays.
  float grain=hash(gl_FragCoord.xy+floor(uTime*12.))-.5;
  color+=grain*.026;
  color=floor(max(color,vec3(0.))*64.+hash(gl_FragCoord.xy)) / 64.;
  color=pow(max(color,vec3(0.)),vec3(.92));
  fragColor=vec4(color,1.);
}`;

const fieldFunction = vertexSource.slice(vertexSource.indexOf('float terrain('), vertexSource.indexOf('void main()'));
const fieldVertex = `#version 300 es
void main() {
  vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);
  gl_Position=vec4(p*2.-1.,0.,1.);
}`;
const fieldFragment = `#version 300 es
precision highp float;
uniform float uTime;
uniform vec3 uBands;
uniform vec3 uTransients;
uniform float uShape;
uniform vec3 uScenes;
uniform float uMotion;
uniform vec4 uPulses[8];
out vec4 fragColor;
${fieldFunction}
void main() {
  vec2 p=(gl_FragCoord.xy/512.-.5)*36.;
  float encodedHeight=floor(clamp((terrain(p)+8.)/16.,0.,1.)*65535.+.5);
  fragColor=vec4(floor(encodedHeight/256.)/255.,mod(encodedHeight,256.)/255.,0.,1.);
}`;
const sceneVertex = vertexSource.replace(fieldFunction, `
uniform sampler2D uField;
float terrain(vec2 p) {
  ivec2 pixel=ivec2(clamp((p/36.+.5)*512.,vec2(0.),vec2(511.)));
  vec2 encodedHeight=texelFetch(uField,pixel,0).rg;
  return (encodedHeight.r*255.*256.+encodedHeight.g*255.)/65535.*16.-8.;
}
`).replaceAll('vec2(.06,0.)','vec2(.102,0.)').replaceAll('vec2(0.,.06)','vec2(0.,.102)').replaceAll('/.06','/.102');
let program, fieldProgram, fieldBuffer, fieldTexture, fieldLocations, locations, cells = 0, vertexCount = 0;
let universeRenderer;
function compile(type, source) {
  const shader=gl.createShader(type);
  gl.shaderSource(shader,source); gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}
function initRenderer() {
  program=gl.createProgram();
  gl.attachShader(program,compile(gl.VERTEX_SHADER,sceneVertex));
  gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentSource));
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  locations=Object.fromEntries(['uViewProjection','uTime','uBands','uTransients','uShape','uScenes','uMotion','uPulses[0]','uPalette[0]'].map(k=>[k,gl.getUniformLocation(program,k)]));
  // Evaluate the deformation once per field texel, rather than once for every
  // vertex of every block. The 16-bit height encoding also works without float
  // framebuffer extensions, keeping the rendering path portable.
  fieldProgram=gl.createProgram();
  gl.attachShader(fieldProgram,compile(gl.VERTEX_SHADER,fieldVertex));
  gl.attachShader(fieldProgram,compile(gl.FRAGMENT_SHADER,fieldFragment));
  gl.linkProgram(fieldProgram);
  if(!gl.getProgramParameter(fieldProgram,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(fieldProgram));
  fieldLocations=Object.fromEntries(['uTime','uBands','uTransients','uShape','uScenes','uMotion','uPulses[0]'].map(k=>[k,gl.getUniformLocation(fieldProgram,k)]));
  fieldTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,fieldTexture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,512,512,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  fieldBuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fieldBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,fieldTexture,0);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Height field framebuffer unavailable');
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.useProgram(program);
  gl.uniform1i(gl.getUniformLocation(program,'uField'),0);
  const vertices=[];
  const face=(a,b,c,d,n)=>{for(const p of [a,b,c,a,c,d])vertices.push(...p,...n);};
  const top=[[-.44,0,-.44],[.44,0,-.44],[.44,0,.44],[-.44,0,.44]];
  const rim=[[-.485,-.035,-.485],[.485,-.035,-.485],[.485,-.035,.485],[-.485,-.035,.485]];
  face(...top,[0,1,0]);
  const normals=[[0,.66,-.75],[.75,.66,0],[0,.66,.75],[-.75,.66,0]];
  const sides=[[0,0,-1],[1,0,0],[0,0,1],[-1,0,0]];
  for(let i=0;i<4;i++){
    const j=(i+1)%4;
    face(top[i],rim[i],rim[j],top[j],normals[i]);
    face(rim[i],[rim[i][0],-.64,rim[i][2]],[rim[j][0],-.64,rim[j][2]],rim[j],sides[i]);
  }
  vertexCount=vertices.length/6;
  const mesh=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,mesh);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);
  const instances=[];
  const rand=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
  for(let row=0;row<266;row++){
    for(let col=0;col<190;){
      const seed=rand(col,row),width=seed>.71&&col<189?2:1;
      instances.push((col+width*.5-95)*.108,(row-166)*.108,width*.108,seed);
      col+=width;
    }
  }
  cells=instances.length/4;
  const instanceBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(instances),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,4,gl.FLOAT,false,16,0);gl.vertexAttribDivisor(2,1);
  gl.enable(gl.DEPTH_TEST);gl.clearColor(.016,.008,.028,1);
  // A fixed camera sees the same cropped, continuous field throughout the mix.
  const eye=[0,12.8,14.6], target=[0,0,0], up=[0,1,0];
  const normalize=v=>{const l=Math.hypot(...v);return v.map(x=>x/l);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  const z=normalize(eye.map((x,i)=>x-target[i])),x=normalize(cross(up,z)),y=cross(z,x);
  const view=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
  const f=1/Math.tan(36*Math.PI/360),near=.1,far=80;
  const projection=[f,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];
  const matrix=new Float32Array(16);
  for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)matrix[col*4+row]+=projection[k*4+row]*view[col*4+k];
  gl.uniformMatrix4fv(locations.uViewProjection,false,matrix);
}

// The analyser is connected to the exact signal being played; live input is
// intentionally never sent back to the speakers (which would cause feedback).
let context, analyser, spectrum, waveform, media, mediaSource, objectURL, stream;
let inputGeneration=0, mode='idle';
let bass=0, mid=0, high=0, lastBeat=-10, pulseIndex=0;
const transients=new Float32Array(3);
const bandReference=new Float32Array([.09,.028,.012]);
const bandAverage=new Float32Array(3);
const previousLevels=new Float32Array(3);
const referenceFloor=[.008,.003,.0015];
const referenceInitial=[.09,.028,.012];
let shapePhase=0;
const sceneSequence=[0,3,1,4,2];
let sceneCursor=Math.floor(Math.random()*sceneSequence.length);
let sceneFrom=sceneSequence[sceneCursor],sceneTo=sceneFrom,sceneBlend=1,sceneHold=0,sceneTransition=0;
let phraseAttacks=0,audioClock=0,lastPhraseAttack=-10;
// A fresh, complete tour with an eight-world cooldown across tour boundaries.
let initialWorld=Math.floor(Math.random()*universeNames.length);
try{
  const saved=sessionStorage.getItem('form:video-start'),previous=Number(saved);
  if(saved!==null&&initialWorld===previous)initialWorld=(initialWorld+1+Math.floor(Math.random()*(universeNames.length-1)))%universeNames.length;
  sessionStorage.setItem('form:video-start',String(initialWorld));
}catch{}
const worldDeck=new WorldDeck(universeNames.length,{start:initialWorld});
let universeFrom=initialWorld,universeTo=initialWorld,universeBlend=1;
let universeHold=0,universeTransition=0,universeAttacks=0;
function advanceUniverse(dt) {
  if(universeBlend<1) {
    universeTransition+=dt;
    universeBlend=Math.min(1,universeTransition/5.2);
    return;
  }
  const energy=Math.max(bass,mid,high);
  universeHold+=dt*(energy>.035?1:.25);
  if((universeHold>7 && universeAttacks>=6)||universeHold>10.5) {
    universeFrom=universeTo;
    universeTo=worldDeck.next();
    universeBlend=0;universeTransition=0;universeHold=0;universeAttacks=0;
  }
}
function advanceScene(dt) {
  if(sceneBlend<1) {
    sceneTransition+=dt;
    const progress=Math.min(1,sceneTransition/1.45);
    sceneBlend=progress*progress*(3-2*progress);
    return;
  }
  const energy=Math.max(bass,mid,high);
  sceneHold+=dt*(energy>.035?1:.2);
  // Count attacks in every band, not just kicks. Ambient/sustained music gets
  // a timed change too, so the composition never stays on one field forever.
  if((sceneHold>4.5 && phraseAttacks>=8) || sceneHold>8) {
    sceneFrom=sceneTo;
    sceneCursor=(sceneCursor+1)%sceneSequence.length;
    sceneTo=sceneSequence[sceneCursor];
    sceneBlend=0;sceneTransition=0;sceneHold=0;phraseAttacks=0;
  }
}
const pulses=new Float32Array(32);for(let i=0;i<8;i++)pulses[i*4+2]=-100;
let visualTime=0;
async function audioGraph() {
  context ||= new (window.AudioContext||window.webkitAudioContext)();
  await context.resume();
  if(!analyser){analyser=context.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.2;spectrum=new Float32Array(analyser.frequencyBinCount);waveform=new Float32Array(analyser.fftSize);}
}
function releaseSource(close=true) {
  mixStarting=false;
  if(close)clockArmed=false;
  const previousMedia=media;
  media=null;
  if(previousMedia){previousMedia.pause();previousMedia.removeAttribute('src');previousMedia.load();}
  if(mediaSource){mediaSource.disconnect();mediaSource=null;}
  if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}
  if(stream){const previousStream=stream;stream=null;previousStream.getTracks().forEach(t=>t.stop());}
  analyser?.disconnect();
  mode='idle';playing=false;visualPaused=true;
  bass=mid=high=0;lastBeat=-10;
  transients.fill(0);bandAverage.fill(0);previousLevels.fill(0);
  bandReference.set(referenceInitial);phraseAttacks=0;lastPhraseAttack=-10;
  for(let i=0;i<8;i++)pulses[i*4+3]=0;
  if(close)setShutter(false);
  syncControls();
}
function pausePlayback(close=false) {
  mixStarting=false;
  if(close)clockArmed=false;
  playing=false;visualPaused=true;
  if(media)media.pause();
  else if(context && mode!=='idle')context.suspend().catch(()=>{});
  if(close)setShutter(false);
  syncControls();
  setStatus(close?'Mix arrêté. Volet fermé.':'Mix en pause. Son et image figés.');
}
function stopPlayback() {
  ++inputGeneration;
  releaseSource();
  setStatus('Lecture arrêtée. Mix remis au début et volet fermé.');
}
async function startMix() {
  const generation=++inputGeneration;
  clockArmed=true;mixStarting=true;syncControls();trackClock.setPower(true);
  try {
    mediaControls.preparePlayback();
    await audioGraph();
    await mixesReady;
    if(generation!==inputGeneration)return;
    if(media && mode==='file') {
      await media.play();
      return;
    }
    if(!track.file && !track.src) {
      mixStarting=false;syncControls();requestFile();
      setStatus('Le mix attend son fichier audio. Sélectionnez un fichier local pour l’essayer.');
      return;
    }
    releaseSource(false);
    mixStarting=true;mode='file';syncControls();
    const audio=(!track.file&&preparedAudio)||new Audio();if(audio===preparedAudio)preparedAudio=null;media=audio;
    if(track.file){objectURL=URL.createObjectURL(track.file);audio.src=objectURL;}
    else if(!audio.src){audio.crossOrigin='anonymous';audio.src=track.src;}
    audio.preload='auto';
    for(const event of ['loadedmetadata','durationchange','timeupdate','seeking','seeked','ratechange'])audio.addEventListener(event,()=>{
      if(media!==audio)return;
      if(Number.isFinite(audio.duration)&&audio.duration>0)track.duration=audio.duration;
      mediaControls.position();trackClock.update(audio,track.duration);
    });
    mediaSource=context.createMediaElementSource(audio);mediaSource.connect(analyser);analyser.connect(context.destination);
    audio.addEventListener('playing',()=>{
      if(media!==audio)return;
      mixStarting=false;playing=true;visualPaused=false;setShutter(true);syncControls();
      setStatus('MIX en lecture. Volet ouvert.');
    });
    audio.addEventListener('pause',()=>{
      if(media!==audio)return;
      playing=false;visualPaused=true;syncControls();
    });
    audio.addEventListener('waiting',()=>{
      if(media!==audio)return;
      // Buffering is not an explicit pause: some WebViews omit a second playing event.
      setStatus('MIX en cours de chargement.');
    });
    audio.addEventListener('ended',()=>{
      if(media!==audio)return;
      releaseSource();
      setStatus('MIX terminé. Volet fermé.');
    });
    audio.addEventListener('error',()=>{
      if(media!==audio)return;
      releaseSource();setStatus('Le mix ne peut pas être lu. Chargez un autre fichier audio.',true);
    });
    await audio.play();
    if(generation!==inputGeneration && media===audio)pausePlayback(true);
  } catch(error) {
    if(generation===inputGeneration){releaseSource();setStatus('Lecture du mix impossible. Chargez un fichier audio compatible.',true);}
  }
}
async function loadFile(file) {
  if(!file)return;
  releaseSource(false);
  track.file=file;
  track.duration=0;trackClock.update(null,0);
  return startMix();
}
async function resumePlayback() {
  if(media && mode==='file')return startMix();
  if(stream && mode!=='idle') {
    try{await context.resume();playing=true;visualPaused=false;setShutter(true);syncControls();setStatus('Source audio en lecture.');}
    catch{setStatus('La source audio n’a pas pu reprendre.',true);}
    return;
  }
  return startMix();
}
async function liveInput(kind) {
  const generation=++inputGeneration;
  if(mode===kind){releaseSource();setStatus('Source déconnectée. Volet fermé.');return;}
  let pendingStream;
  try {
    try{if(navigator.audioSession)navigator.audioSession.type='auto';}catch{}
    await audioGraph();
    if(kind==='microphone')pendingStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
    else pendingStream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});
    if(generation!==inputGeneration){pendingStream.getTracks().forEach(t=>t.stop());return;}
    if(!pendingStream.getAudioTracks().length){pendingStream.getTracks().forEach(t=>t.stop());setStatus('Aucune piste audio partagée. Activez le partage du son dans le sélecteur d’onglet.',true);return;}
    releaseSource(false);stream=pendingStream;
    mediaSource=context.createMediaStreamSource(stream);mediaSource.connect(analyser);
    mode=kind;playing=true;visualPaused=false;setShutter(true);syncControls();
    setStatus(kind==='microphone'?'Microphone connecté.':'Son de l’onglet connecté.');
    stream.getTracks().forEach(track=>track.addEventListener('ended',()=>{if(stream===pendingStream){++inputGeneration;releaseSource();setStatus('Source déconnectée. Volet fermé.');}}));
  }catch(error){pendingStream?.getTracks().forEach(t=>t.stop());if(generation===inputGeneration)setStatus('Connexion audio non activée. Vous pouvez toujours charger un fichier audio.',true);}
}
async function shareSite() {
  const url=new URL(document.querySelector('link[rel=canonical]')?.href||location.href);url.hash='';url.search='';
  if(navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url.href);
      shareLabel.textContent='COPIÉ';shareButton.setAttribute('aria-label','Lien copié');
      setStatus('Lien du site copié.');
      setTimeout(()=>{shareLabel.textContent='SHARE';shareButton.setAttribute('aria-label','Partager le site');},1800);
      return;
    }catch { /* Try the native share sheet when clipboard access is denied. */ }
  }
  try {
    if(navigator.share){await navigator.share({title:'colinvrr',url:url.href});setStatus('Lien partagé.');return;}
    throw new Error('Sharing unavailable');
  }catch(error){if(error.name!=='AbortError')setStatus('Le partage n’a pas abouti. Copiez l’adresse du site depuis le navigateur.',true);}
}
function bandEnergy(lo,hi) {
  const bin=context.sampleRate/analyser.fftSize;
  let sum=0,peak=0,count=0;
  for(let i=Math.max(1,Math.floor(lo/bin));i<Math.min(spectrum.length,Math.ceil(hi/bin));i++) {
    const power=Math.pow(10,spectrum[i]/10);
    sum+=power;peak=Math.max(peak,power);count++;
  }
  // A peak/RMS blend avoids diluting a hi-hat across hundreds of quiet FFT bins.
  return Math.sqrt(sum/Math.max(1,count))*.4+Math.sqrt(peak)*.6;
}
function analyse(dt) {
  audioClock+=dt;
  const raw=[0,0,0];
  if(analyser&&mode!=='idle'&&!(mode==='file'&&media?.paused)) {
    analyser.getFloatFrequencyData(spectrum);analyser.getFloatTimeDomainData(waveform);
    let rms=0;for(const v of waveform)rms+=v*v;
    rms=Math.sqrt(rms/waveform.length);
    if(rms>.0007) {
      raw[0]=bandEnergy(30,230);raw[1]=bandEnergy(230,2800);raw[2]=bandEnergy(2800,14000);
    }
  }
  const levels=[0,0,0],attacks=[0,0,0];
  for(let i=0;i<3;i++) {
    // Independent slow gain references preserve quiet mids/highs without letting
    // the bass energy determine the sensitivity of the other two bands.
    const rate=raw[i]>bandReference[i]?1.4:.13;
    bandReference[i]=Math.max(referenceFloor[i],bandReference[i]+(raw[i]-bandReference[i])*(1-Math.exp(-dt*rate)));
    const ratio=Math.max(0,raw[i]-.00015)/bandReference[i];
    levels[i]=Math.pow(1-Math.exp(-ratio*1.5),.72);
    bandAverage[i]+=(levels[i]-bandAverage[i])*(1-Math.exp(-dt*2.2));
    const rise=Math.max(0,levels[i]-previousLevels[i]);
    const contrast=Math.max(0,levels[i]-bandAverage[i]);
    const hit=levels[i]>.075 && rise>.018 ? Math.min(1,rise*3.2+contrast*.65) : 0;
    attacks[i]=hit;
    transients[i]=Math.max(hit,transients[i]*Math.exp(-dt*[4.2,6.5,10][i]));
    previousLevels[i]=levels[i];
  }
  if(Math.max(attacks[0],attacks[1]*.9,attacks[2]*.55)>.22 && audioClock-lastPhraseAttack>.16) {
    phraseAttacks++;universeAttacks++;lastPhraseAttack=audioClock;
  }
  if(transients[0]>.2 && levels[0]>bandAverage[0]*1.18 && levels[0]>bass+.025 && visualTime-lastBeat>.17) {
    const i=(pulseIndex++%8)*4;
    pulses[i]=Math.sin(pulseIndex*2.399)*5.4;pulses[i+1]=Math.cos(pulseIndex*1.73)*5.4;
    pulses[i+2]=visualTime;pulses[i+3]=Math.min(1.1,.25+levels[0]*.8);lastBeat=visualTime;
  }
  const envelope=(current,target,release)=>current+(target-current)*(1-Math.exp(-dt*(target>current?32:release)));
  bass=envelope(bass,levels[0],4.6);mid=envelope(mid,levels[1],7);high=envelope(high,levels[2],12);
}

surface.addEventListener('click',()=>{feedback.unlock();if(playing)pausePlayback();else resumePlayback();});
for(const [button,kind] of [[mixButton,'lever'],[stopButton,'stop'],[pauseButton,'pause'],[playButton,'play'],[shareButton,'share']])button.addEventListener('click',()=>{feedback.play(kind);});
picker.addEventListener('change',()=>{loadFile(picker.files[0]);picker.value='';});
playButton.addEventListener('click',resumePlayback);
pauseButton.addEventListener('click',()=>{++inputGeneration;if(mode!=='idle'||mixStarting)pausePlayback();else{clockArmed=false;syncControls();}});
stopButton.addEventListener('click',stopPlayback);
shareButton.addEventListener('click',shareSite);
mixButton.addEventListener('click',()=>{
  if(mixStarting||(playing && mode==='file')){++inputGeneration;pausePlayback(true);}
  else startMix();
});
window.addEventListener('dragover',event=>{event.preventDefault();surface.classList.add('dragging');});
window.addEventListener('dragleave',event=>{if(!event.relatedTarget)surface.classList.remove('dragging');});
window.addEventListener('drop',event=>{event.preventDefault();surface.classList.remove('dragging');loadFile(event.dataTransfer.files[0]);});
window.addEventListener('keydown',async event=>{
  if(event.ctrlKey||event.metaKey||event.altKey||event.repeat)return;
  const key=event.key.toLowerCase();
  if(key===' '){
    if(event.target.closest('button') && event.target!==surface)return;
    event.preventDefault();feedback.unlock();if(playing)pausePlayback();else resumePlayback();
  }
  if(key==='m'){event.preventDefault();liveInput('microphone');}
  if(key==='s'){event.preventDefault();liveInput('screen');}
  if(key==='f'){event.preventDefault();try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('main').requestFullscreen();}catch{setStatus('Le plein écran n’est pas disponible dans ce navigateur.',true);}}
  if(key==='escape')stopPlayback();
});

let last=performance.now(),lastDraw=0,animationRequest=0;
let graphicsReady=false,graphicsRestoreTimer=0,disposed=false;
const renderQuality=1;
let graphicsSeed,checkOutput=true,checkedWorld=null;
function queueFrame() {
  if(!disposed&&!animationRequest)animationRequest=requestAnimationFrame(frame);
}
function reconcilePlayback() {
  if(mode!=='file'||!media)return;
  const audible=!media.paused&&!media.ended&&(media.readyState>=2||media.currentTime>0);
  if(audible&&(!playing||visualPaused||mixStarting)) {
    mixStarting=false;playing=true;visualPaused=false;
    if(!shutterOpen)setShutter(true);
    syncControls();
  }else if(media.paused&&playing){playing=false;visualPaused=true;syncControls();}
}
function graphicsUnavailable(){
  graphicsReady=false;canvas.dataset.renderer='unavailable';graphicsNotice.hidden=false;
  setStatus('Le rendu haute qualité n’a pas pu démarrer. Utilisez un navigateur récent avec l’accélération graphique activée.',true);
  return false;
}
function initializeGraphics() {
  const previous=universeRenderer;graphicsSeed ??= previous?.palettes?.seed;
  if(!gl)return graphicsUnavailable();
  try {
    initRenderer();
    universeRenderer=new UniverseRenderer(gl,compile,fieldVertex,{seed:graphicsSeed});
    if(previous?.flow){universeRenderer.flow.set(previous.flow);universeRenderer.flowKey=previous.flowKey;}
    graphicsSeed=universeRenderer.palettes.seed;
    canvas.dataset.renderer='raymarch';canvas.dataset.quality='full';graphicsNotice.hidden=true;checkOutput=true;
    graphicsReady=true;graphicsDirty=true;lastDraw=0;return true;
  }catch(error){console.error(error);return graphicsUnavailable();}
}
function replaceGraphicsCanvas() {
  graphicsRestoreTimer=0;
  if(disposed||graphicsReady)return;
  const previous=canvas,previousContext=gl;
  const replacement=document.createElement('canvas');replacement.id='canvas';replacement.setAttribute('aria-hidden','true');
  visualWindow.replaceChild(replacement,previous);canvas=replacement;
  gl=acquireContext(canvas);
  try{previousContext?.getExtension('WEBGL_lose_context')?.loseContext();}catch{}
  if(gl)bindGraphicsContext(canvas);
  if(initializeGraphics())setStatus(playing?'MIX en lecture. Image rétablie.':'Image rétablie.');
}
function scheduleGraphicsRecovery() {
  graphicsReady=false;
  if(!graphicsRestoreTimer)graphicsRestoreTimer=setTimeout(replaceGraphicsCanvas,1200);
}
function bindGraphicsContext(target) {
  target.addEventListener('webglcontextlost',event=>{
    if(target!==canvas)return;
    event.preventDefault();scheduleGraphicsRecovery();
    setStatus('Rétablissement de l’image en cours. Le son continue.');
  });
  target.addEventListener('webglcontextrestored',()=>{
    if(target!==canvas||disposed)return;
    clearTimeout(graphicsRestoreTimer);graphicsRestoreTimer=0;
    replaceGraphicsCanvas();
  });
}
function drawGraphics() {
  const size=Math.max(1,Math.ceil(canvas.clientWidth*Math.max(2,devicePixelRatio||1)));
  canvas.dataset.resolution=String(size);
  if(canvas.width!==size||canvas.height!==size){canvas.width=size;canvas.height=size;if(gl)gl.viewport(0,0,size,size);}
  universeRenderer.resize(size);
  if(!visualPaused)universeRenderer.uploadSignal(waveform,spectrum,context?.sampleRate);
  const needsRelief=universeTo===0 || (universeFrom===0 && universeBlend<1);
  if(needsRelief) {
    gl.bindTexture(gl.TEXTURE_2D,null);
    gl.bindFramebuffer(gl.FRAMEBUFFER,fieldBuffer);gl.viewport(0,0,512,512);
    gl.disable(gl.DEPTH_TEST);gl.useProgram(fieldProgram);
    gl.uniform1f(fieldLocations.uTime,visualTime);
    gl.uniform3f(fieldLocations.uBands,bass,mid,high);
    gl.uniform3fv(fieldLocations.uTransients,transients);
    gl.uniform1f(fieldLocations.uShape,shapePhase);
    gl.uniform3f(fieldLocations.uScenes,sceneFrom,sceneTo,sceneBlend);
    gl.uniform1f(fieldLocations.uMotion,reducedMotion.matches?.25:1);
    gl.uniform4fv(fieldLocations['uPulses[0]'],pulses);
    gl.drawArrays(gl.TRIANGLES,0,3);
    gl.bindFramebuffer(gl.FRAMEBUFFER,universeRenderer.buffer);gl.viewport(0,0,size,size);
    gl.bindTexture(gl.TEXTURE_2D,fieldTexture);
    gl.enable(gl.DEPTH_TEST);gl.useProgram(program);
    const palette=universeRenderer.paletteFor(0,visualTime);
    gl.clearColor(palette[0]*.06,palette[1]*.06,palette[2]*.06,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(locations.uTime,visualTime);
    gl.uniform3f(locations.uBands,bass,mid,high);
    gl.uniform3fv(locations.uTransients,transients);
    gl.uniform1f(locations.uShape,shapePhase);
    gl.uniform3f(locations.uScenes,sceneFrom,sceneTo,sceneBlend);
    gl.uniform1f(locations.uMotion,reducedMotion.matches?.25:1);
    gl.uniform4fv(locations['uPulses[0]'],pulses);
    gl.uniform3fv(locations['uPalette[0]'],palette);
    gl.drawArraysInstanced(gl.TRIANGLES,0,vertexCount,cells);
  }
  universeRenderer.render(visualTime,[bass,mid,high],transients,universeFrom,universeTo,universeBlend);
  if(gl){
    const error=gl.getError();if(error)throw new Error(`WebGL draw error ${error}`);
    const world=universeBlend===1?universeTo:null;
    if(shutterOpen&&(checkOutput||(world!==null&&world!==checkedWorld))){
      const pixels=new Uint8Array(size*size*4);gl.readPixels(0,0,size,size,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      let brightest=0;for(let i=0;i<pixels.length;i+=64)brightest=Math.max(brightest,pixels[i],pixels[i+1],pixels[i+2]);
      if(brightest<5)throw new Error('Empty graphics output');checkOutput=false;checkedWorld=world;
    }
  }
  canvas.dataset.universe=universeNames[universeTo];
  canvas.dataset.transition=universeBlend.toFixed(3);
  graphicsDirty=false;
}
function frame(now) {
  animationRequest=0;queueFrame();
  reconcilePlayback();
  if(document.hidden){last=now;return;}
  const dt=Math.min((now-last)/1000,.06);last=now;
  scene.tick?.(dt,now);
  if(!visualPaused) {
    graphicsDirty=true;
    analyse(dt);
    visualTime+=dt*(.45+bass*.55+mid*.7+high*.35)*(reducedMotion.matches?.2:1);
    shapePhase+=dt*(.055+mid*.24+high*.09+transients[1]*.2)*(reducedMotion.matches?.2:1);
    advanceScene(dt*(reducedMotion.matches?.2:1));
    advanceUniverse(dt*(reducedMotion.matches?.2:1));
  }
  if(!graphicsReady)return;
  if(gl?.isContextLost()){scheduleGraphicsRecovery();return;}
  if(!shutterOpen&&now>shutterUntil)return;
  if(visualPaused&&!graphicsDirty)return;
  if(now-lastDraw<(visualPaused?200:reducedMotion.matches?66:16))return;
  lastDraw=now;
  try{drawGraphics();}
  catch(error){console.error(error);scheduleGraphicsRecovery();setStatus('Rétablissement de l’image en cours. Le son continue.');}
}
function wakeGraphics() {
  if(disposed)return;
  graphicsDirty=true;
  if(animationRequest)cancelAnimationFrame(animationRequest);
  animationRequest=0;last=performance.now();queueFrame();
}
if(gl)bindGraphicsContext(canvas);
function invalidateGraphics(){graphicsDirty=true;queueFrame();}
const graphicsObserver=typeof ResizeObserver==='undefined'?null:new ResizeObserver(invalidateGraphics);
graphicsObserver?.observe(visualWindow);
window.addEventListener('resize',invalidateGraphics);
queueFrame();
function prepareGraphics(){
  if(disposed)return;
  initializeGraphics();
  if(graphicsReady){try{drawGraphics();}catch(error){console.error(error);}}
}
if(document.documentElement){
  // Reveal the street independently of audio buffering and video shader compilation.
  Promise.resolve(scene.ready).then(()=>{
    if(disposed)return;
    document.documentElement.dataset.loading='false';
    document.querySelector('#startup').hidden=true;
    // Give the completed architecture a paint before preparing the video engine.
    requestAnimationFrame(()=>setTimeout(prepareGraphics,0));
  });
}else prepareGraphics();
document.addEventListener('visibilitychange',()=>{
  feedback.setVisible(!document.hidden);
  if(document.hidden){cancelAnimationFrame(animationRequest);animationRequest=0;}
  else {
    if(mode==='file'&&media&&!media.paused&&context?.state==='suspended')context.resume().catch(()=>{});
    mediaControls.position();wakeGraphics();
  }
});
window.addEventListener('pageshow',wakeGraphics);
window.addEventListener('pagehide',event=>{
  if(event.persisted)return;
  disposed=true;cancelAnimationFrame(animationRequest);clearTimeout(graphicsRestoreTimer);graphicsObserver?.disconnect();
  ++inputGeneration;releaseSource();shutter.dispose();scene.dispose();feedback.dispose();mediaControls.dispose();context?.close();
});
