const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));

// Sound determines intensity; slow envelopes prevent a wall of constant flashes.
export function berlinEffectsFrame(time,bands=[],transients=[],reduced=false){
 const bass=clamp(bands[0]),mid=clamp(bands[1]),high=clamp(bands[2]),attack=clamp(transients[0]);
 const sound=clamp(bass*.6+mid*.3+high*.1),motion=reduced?.15:1;
 return {laser:clamp((mid*.7+high*.55+attack*.3)*1.8),smoke:clamp(sound*1.4),
  smokeMachine:clamp((bass*.8+attack*.75)*1.4)*(reduced?.35:1),motion,time,
  colorPhase:(time*.32+mid*.8+attack*.35)%1};
}

// Beams stay behind the facade, inside the studio volume. Their endpoints
// never cross the facade plane at z=-94.
export function berlinLaserPath(index,time,motion=1){
 const column=index%2,lane=Math.floor(index/2);
 const beat=Math.sin(time*6.28+index*1.57)*motion;
 const x=390+column*440+(lane-1)*30,y=724+lane*12;
 const targetX=(column?830:410)+beat*(column?-120:120);
 const targetY=1060+Math.sin(time*3.8+index*1.2)*55;
 const targetZ=-430+Math.sin(time*2.5+index*1.3)*18;
 return {from:[x,y,-318],to:[targetX,targetY,targetZ]};
}

export class BerlinStageEffects{
 constructor(s){
  this.s=s;this.lasers=[];this.smoke=[];this.smokeMachines=[];if(!s.engine)return;
  const B=s.api,scene=s.scene;
  this.up=new B.Vector3(0,1,0);this.quaternion=new B.Vector3().toQuaternion().constructor;
  const material=(name,color)=>{const m=new B.StandardMaterial(name,scene);m.disableLighting=true;m.emissiveColor=B.Color3.FromHexString(color);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.alpha=0;m.backFaceCulling=false;m.disableDepthWrite=true;return m;};
  const colors=['#00f5ff','#ff007f','#ffef00','#b528ff','#00ff77','#ff6b35'];
  for(let i=0;i<6;i++){
   const core=B.MeshBuilder.CreateCylinder(`studio-laser-core-${i}`,{height:1,diameter:4.5,tessellation:10},scene);
   const halo=B.MeshBuilder.CreateCylinder(`studio-laser-halo-${i}`,{height:1,diameter:34,tessellation:10},scene);
   core.material=material(`laser-core-${i}`,colors[i]);halo.material=material(`laser-halo-${i}`,colors[i]);
   for(const mesh of [core,halo]){mesh.isPickable=false;mesh.setEnabled(false);}
   this.lasers.push({core,halo});
  }
  this.projectors=[];
  for(let i=0;i<3;i++){
   const x=350+i*320;
   const housing=B.MeshBuilder.CreateBox(`ceiling-projector-${i}`,{width:92,height:24,depth:58},scene);
   housing.position=s.vec(x,704,-318);housing.material=material(`projector-housing-${i}`,'#283338');housing.material.alpha=1;
   const lens=B.MeshBuilder.CreateCylinder(`ceiling-projector-lens-${i}`,{height:3,diameter:22,tessellation:12},scene);
   lens.position=s.vec(x,717,-318);lens.rotation.x=Math.PI/2;lens.material=material(`projector-lens-${i}`,colors[i*2]);
   lens.material.alpha=1;
   for(const mesh of [housing,lens]){mesh.isPickable=false;this.projectors.push(mesh);}
  }
  // Irregular, translucent smoke sprites: layered density and transparent edges.
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
  let seed=193;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<55;i++){
   const angle=random()*Math.PI*2,spread=Math.sqrt(random())*65,x=128+Math.cos(angle)*spread,y=128+Math.sin(angle)*spread;
   const r=18+random()*42,g=ctx.createRadialGradient(x,y,0,x,y,r);
   g.addColorStop(0,'rgba(235,231,244,.15)');g.addColorStop(.48,'rgba(203,208,224,.075)');g.addColorStop(1,'rgba(191,202,220,0)');
   ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);
  }
  const texture=s.texture(c);texture.hasAlpha=true;
  const matA=material('smoke-material-a','#c2d4df'),matB=material('smoke-material-b','#d1c1e0');
  for(const m of [matA,matB]){m.diffuseTexture=texture;m.useAlphaFromDiffuseTexture=true;m.emissiveTexture=texture;}
  for(let i=0;i<24;i++){
   const mesh=B.MeshBuilder.CreatePlane(`studio-smoke-wisp-${i}`,{size:2,sideOrientation:B.Mesh.DOUBLESIDE},scene);
   mesh.material=i%2?matB:matA;
   mesh.isPickable=false;mesh.setEnabled(false);this.smoke.push(mesh);
  }
  const bodyMat=material('smoke-machine-body','#46545a'),nozzleMat=material('smoke-machine-nozzle','#73817d');
  for(const x of [405,835]){
   const body=B.MeshBuilder.CreateCylinder(`studio-smoke-machine-${x}`,{diameterTop:18,diameterBottom:28,height:24,tessellation:16},scene);
   body.material=bodyMat;body.isPickable=false;body.setEnabled(false);
   const nozzle=B.MeshBuilder.CreateCylinder(`studio-smoke-nozzle-${x}`,{diameterTop:7,diameterBottom:11,height:16,tessellation:12},scene);
   nozzle.material=nozzleMat;nozzle.isPickable=false;nozzle.setEnabled(false);
   this.smokeMachines.push({body,nozzle,x});
  }
 }
 apply(frame){
  if(!this.s.engine)return false;
  const s=this.s,{time:t,motion}=frame,B=s.api,opening=clamp(((s.progress??1)-.65)/.35);
  const laser=frame.laser*opening,smoke=frame.smoke*opening,machine=frame.smokeMachine*opening;
  const palette=['#00f5ff','#ff007f','#ffef00','#b528ff','#00ff77','#ff6b35'];
  const blendPhase=frame.colorPhase??0;
  for(let i=0;i<this.lasers.length;i++){
   const {core,halo}=this.lasers[i],ray=berlinLaserPath(i,t,motion),from=s.vec(...ray.from),to=s.vec(...ray.to);
   const direction=to.subtract(from),length=direction.length(),midpoint=from.add(to).scale(.5);
   const rotation=this.quaternion.FromUnitVectorsToRef(this.up,direction.normalize(),new this.quaternion());
   const blink=Math.sin(t*7.5+i*1.31)>.04?1:0;
   const colorIndex=Math.floor((blendPhase*palette.length+i*.5)%palette.length);
   const nextColor=palette[(colorIndex+1)%palette.length];
   const color=B.Color3.Lerp(B.Color3.FromHexString(palette[colorIndex]),B.Color3.FromHexString(nextColor),Math.max(0,(blendPhase*palette.length+i*.5)%1));
   core.material.emissiveColor=color;halo.material.emissiveColor=color;
   const intensity=laser*blink*(.75+.25*(.5+.5*Math.sin(t*14+i)));
   for(const [mesh,alpha]of [[halo,.28],[core,1]]){
    mesh.position.copyFrom(midpoint);mesh.scaling.y=length;mesh.rotationQuaternion=rotation;
    mesh.material.alpha=intensity*alpha;mesh.setEnabled(mesh.material.alpha>.005);
   }
   for(let i=0;i<this.projectors.length;i+=2){
    const lens=this.projectors[i+1],color=B.Color3.FromHexString(palette[Math.floor((blendPhase*palette.length+i)%palette.length)]);
    lens.material.emissiveColor=color;lens.material.alpha=.45+laser*.55;
   }
  }
  for(let i=0;i<this.smoke.length;i++){
   const m=this.smoke[i],side=i%2?1:-1,phase=((t*.12+i*.13)%1+1)%1;
   const y=1010-phase*265,x=(side<0?395:845)+Math.sin(t*.55+i)*20*motion+side*phase*24;
   m.position.copyFrom(s.vec(x,y,-240-i));const size=28+phase*45;m.scaling.set(size,size*.75,1);m.rotation.z=Math.sin(t*.24+i)*.4;
   m.material.alpha=smoke*.7*Math.sin(Math.PI*phase);m.setEnabled(m.material.alpha>.005);
  }
  for(const {body,nozzle,x}of this.smokeMachines){
   const active=machine*(.72+.28*Math.sin(t*12+x));
   body.position.copyFrom(s.vec(x,1090,-210));body.material.alpha=.45+active*.35;body.setEnabled(active>.01);
   nozzle.position.copyFrom(s.vec(x,1068,-210));nozzle.material.alpha=.55+active*.35;nozzle.setEnabled(active>.01);
  }
  s.canvas.dataset.laserLevel=laser.toFixed(3);s.canvas.dataset.smokeLevel=smoke.toFixed(3);s.canvas.dataset.smokeMachineLevel=machine.toFixed(3);
  return laser>0||smoke>0||machine>0;
 }
 reset(){this.apply(berlinEffectsFrame(0));}
}
