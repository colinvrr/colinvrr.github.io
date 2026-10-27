// A real recessed ground-floor room: the performer, counter, records and plant
// are volumes behind the glazing, never a painted replacement for the scene.
export function buildApartment(owner){
 const s=owner,wood=s.maps.wood.image,stone=s.maps.stone.image;
 s.masonry();s.windows();s.door();
 // Replace the garage's entire ground-floor opening with a residential bay.
 s.box(207,612,832,48,35,-5,'#b7c7bf',stone,'stone',2);
 s.box(205,660,34,505,50,9,'#657e7b',null,'steel',2);
 s.box(1003,660,34,505,50,9,'#657e7b',null,'steel',2);
 s.box(239,660,764,27,48,9,'#75918a',null,'wood',2);
 s.box(239,1150,764,15,48,9,'#75918a',null,'wood',2);
 // Rear wall, floor and ceiling have actual depth behind the street window.
 s.box(243,687,756,476,18,-525,'#435c59',null,'interior-wall',1);
 s.box(243,1145,756,15,530,-249,'#a37a4b',wood,'interior-wood',1);
 s.box(243,689,756,10,530,-249,'#bca981',null,'interior-wall',1);
 for(let i=0;i<15;i++)s.box(252+i*49,1143,2,2,512,-246,'#594d3b',null,'interior-dark',.2);
 // Record shelves and sleeves sit against the back wall.
 for(const y of [888,1012,1130])s.box(279,y,155,10,91,-461,'#b18a55',wood,'interior-wood',1);
 const sleeves=['#aa6656','#b5a375','#7b9591','#59717b','#b8bcb0'];
 for(let row=0;row<2;row++)for(let i=0;i<12;i++)s.box(286+i*11,900+row*122,7.8,99,72,-461,sleeves[(i+row*2)%sleeves.length],null,'interior-wall',.4);
 // Two original graphic prints, a wall clock and a warm hanging pendant.
 s.frame(285,726,137,137,-505,6,'#b59e74',null,'interior-wood');
 if(s.engine){
  const B=s.api,c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#c6ad7c';ctx.fillRect(0,0,256,256);
  for(let r=96;r>12;r-=12){ctx.strokeStyle=r%24?'#576e69':'#926d4d';ctx.lineWidth=5;ctx.beginPath();ctx.arc(128,128,r,0,Math.PI*2);ctx.stroke();}
  s.plane(292,733,123,123,-501,c);
  const shade=B.MeshBuilder.CreateCylinder('apartment-pendant',{diameterTop:31,diameterBottom:79,height:37,tessellation:24},s.scene);shade.position=s.vec(868,802,-285);s.add(shade,'#b89d66',null,'interior-brass',false);
  const bulb=B.MeshBuilder.CreateSphere('apartment-lamp',{diameter:30,segments:12},s.scene);bulb.position=s.vec(868,821,-285);s.add(bulb,'#f9d49a',null,'interior-glow',false);
 }
 s.tube([[868,697,-285],[868,785,-285]],'#484a43',1.7,'interior-dark');
 // A timber counter, with a metal foot rail, leaves the DJ's hands in view.
 s.box(414,992,446,154,164,-152,'#8e6543',wood,'interior-wood',3);
 s.box(397,979,480,17,202,-152,'#c4a477',wood,'interior-wood',3);
 for(const x of [429,550,671,792])s.box(x,1011,3,115,3,-68,'#5b4f3f',null,'interior-dark',.5);
 s.tube([[426,1122,-42],[852,1122,-42]],'#9b936e',2,'interior-brass');
 s.records.push({kind:'dj',z:-190});
 // The window is transparent geometry, with narrow timber mullions.
 for(const x of [250,493,748])s.box(x,691,x===250?4:6,458,17,22,'#677f79',null,'wood',.7);
 s.box(246,783,752,7,18,22,'#75918a',null,'wood',.7);
 if(s.engine){
  const B=s.api,glass=B.MeshBuilder.CreatePlane('apartment-window-glass',{width:748,height:455},s.scene);glass.position=s.vec(621,921.5,30);s.add(glass,'#b8d1cf',null,'interior-glass',false);
  const pot=B.MeshBuilder.CreateCylinder('plant-pot',{diameterTop:74,diameterBottom:54,height:62,tessellation:20},s.scene);pot.position=s.vec(928,1115,-143);s.add(pot,'#a37252',null,'interior-wood',false);
  for(let i=0;i<13;i++){
   const angle=i*2.399,tip=[928+Math.sin(angle)*(30+i%3*9),950+i%5*22,-143+Math.cos(angle)*26];
   s.tube([[928,1088,-143],[tip[0],tip[1]+30,tip[2]],tip],'#495e44',1.2,'interior-leaf');
   const leaf=B.MeshBuilder.CreateSphere('apartment-leaf',{diameter:2,segments:10},s.scene);leaf.position=s.vec(...tip);leaf.scaling.set(11,34,3.5);leaf.rotation.z=Math.sin(angle)*.8;s.add(leaf,i%2?'#6b845a':'#536e4c',null,'interior-leaf',false);
  }
 }
}

export class ApartmentDJ {
 constructor(owner){this.owner=owner;this.B=owner.api;this.meshes=[];this.materials=[];this.arms=[];this.time=0;this.lastDraw=0;if(owner.engine)this.build();}
 material(name,color,emission=.12){const B=this.B,m=new B.StandardMaterial(name,this.owner.scene);m.diffuseColor=B.Color3.FromHexString(color);m.emissiveColor=m.diffuseColor.scale(emission);m.specularColor=new B.Color3(.12,.12,.12);m.specularPower=38;this.materials.push(m);return m;}
 ball(name,parent,p,scale,material){const B=this.B,m=B.MeshBuilder.CreateSphere(name,{diameter:2,segments:16},this.owner.scene);m.parent=parent;m.position=new B.Vector3(...p);m.scaling=new B.Vector3(...scale);m.material=material;m.isPickable=false;this.meshes.push(m);return m;}
 box(name,parent,p,scale,material){const B=this.B,m=B.MeshBuilder.CreateBox(name,{width:scale[0],height:scale[1],depth:scale[2]},this.owner.scene);m.parent=parent;m.position=new B.Vector3(...p);m.material=material;m.isPickable=false;this.meshes.push(m);return m;}
 build(){
  const B=this.B,scene=this.owner.scene;
  this.skin=this.material('dj-skin','#bf8d6c');this.shirt=this.material('dj-shirt','#8e5750');this.ink=this.material('dj-black','#273437');this.metal=this.material('dj-metal','#8e9b9b');this.glow=this.material('dj-led','#e6b874',.6);
  this.root=new B.TransformNode('apartment-dj',scene);this.root.position=this.owner.vec(627,980,-245);
  this.body=this.ball('dj-torso',this.root,[0,69,0],[46,67,27],this.shirt);
  this.box('dj-neck',this.root,[0,134,0],[21,26,23],this.skin);
  this.head=new B.TransformNode('dj-head',scene);this.head.parent=this.root;this.head.position.set(0,168,2);
  this.ball('dj-face',this.head,[0,0,0],[33,40,28],this.skin);
  this.ball('dj-hair',this.head,[0,22,-3],[34,23,28],this.ink);
  this.ball('dj-nose',this.head,[0,-5,28],[6,9,7],this.skin);
  for(const side of [-1,1]){
   this.ball('dj-eye',this.head,[side*12,1,26],[2.8,3.5,2.5],this.ink);
   this.ball('dj-ear',this.head,[side*32,-1,0],[5,10,7],this.skin);
   this.ball('dj-headphone',this.head,[side*36,0,-2],[7,17,15],this.ink);
  }
  const band=Array.from({length:19},(_,i)=>new B.Vector3(Math.cos(i/18*Math.PI)*36,Math.sin(i/18*Math.PI)*44,-4));
  const phones=B.MeshBuilder.CreateTube('dj-headphones',{path:band,radius:3,tessellation:8},scene);phones.parent=this.head;phones.material=this.ink;this.meshes.push(phones);
  for(const side of [-1,1]){
   const path=[new B.Vector3(side*37,111,2),new B.Vector3(side*72,59,52),new B.Vector3(side*104,15,108)];
   const arm=B.MeshBuilder.CreateTube('dj-arm',{path,radius:11,tessellation:10,updatable:true},scene);arm.parent=this.root;arm.material=this.shirt;this.meshes.push(arm);
   const hand=this.ball('dj-hand',this.root,[side*104,15,108],[12,6,15],this.skin);this.arms.push({side,path,arm,hand});
  }
  this.discs=[];
  for(const side of [-1,1]){
   this.box('dj-deck',this.root,[side*116,0,106],[163,13,150],this.ink);
   const disc=B.MeshBuilder.CreateCylinder('dj-vinyl',{diameter:112,height:3,tessellation:48},scene);disc.parent=this.root;disc.position.set(side*116,9,101);disc.material=this.ink;this.meshes.push(disc);this.discs.push(disc);
   const label=B.MeshBuilder.CreateCylinder('vinyl-label',{diameter:29,height:1,tessellation:24},scene);label.parent=disc;label.position.y=2;label.material=this.glow;this.meshes.push(label);
   const marker=this.box('vinyl-marker',disc,[15,2,0],[12,1,3],this.metal);
   this.box('deck-pitch',this.root,[side*185,9,110],[3,2,70],this.metal);
  }
  this.box('dj-mixer',this.root,[0,3,108],[58,20,135],this.metal);
  for(let i=0;i<4;i++)for(let j=0;j<3;j++)this.ball('mixer-knob',this.root,[-19+i*12,17,63+j*22],[3,5,3],this.ink);
  for(let i=0;i<6;i++)this.box('mixer-light',this.root,[-20+i*8,16,143],[3,1,7],this.glow);
  for(const light of [...scene.lights])light.excludedMeshes.push(...this.meshes);
  this.key=new B.HemisphericLight('dj-room-light',new B.Vector3(-.3,1,1),scene);this.key.intensity=.95;this.key.diffuse=new B.Color3(1,.84,.65);this.key.groundColor=new B.Color3(.25,.22,.2);this.key.includedOnlyMeshes=this.meshes;
  this.apply([0,0,0]);
 }
 advance(dt,playing,bands,reduced=false){if(!playing||!this.root)return false;this.time+=dt*(reduced?.2:1);this.apply(bands);return true;}
 apply(bands){
  if(!this.root)return;const t=this.time,bass=bands?.[0]||0,mid=bands?.[1]||0;
  this.body.rotation.z=Math.sin(t*1.4)*(.025+bass*.025);this.head.rotation.x=.11+Math.sin(t*2.7)*(.035+bass*.045);this.head.rotation.z=Math.sin(t*1.4)*.035;
  for(const {side,path,arm,hand}of this.arms){
   const reach=Math.sin(t*.75+(side<0?0:2))*17,press=Math.sin(t*3+side)*(.8+mid*2.6);
   path[1].set(side*(73+reach*.2),60+press,54);path[2].set(side*(105+reach),15+Math.max(0,press),108+Math.cos(t*.65+side)*12);hand.position.copyFrom(path[2]);
   this.B.MeshBuilder.CreateTube('dj-arm',{path,instance:arm});
  }
  for(const disc of this.discs)disc.rotation.y=t*1.8;
 }
 drawCanvas(ctx){
  ctx.save();ctx.fillStyle='#8e5750';ctx.beginPath();ctx.ellipse(627,914,46,68,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#bf8d6c';ctx.beginPath();ctx.ellipse(627,812,33,40,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#273437';ctx.fillRect(592,778,70,18);
  ctx.lineWidth=19;ctx.lineCap='round';ctx.strokeStyle='#8e5750';ctx.beginPath();ctx.moveTo(591,871);ctx.lineTo(551,918);ctx.lineTo(518,965);ctx.moveTo(663,871);ctx.lineTo(702,918);ctx.lineTo(737,965);ctx.stroke();
  ctx.fillStyle='#273437';for(const x of [615,639]){ctx.beginPath();ctx.arc(x,812,3.5,0,Math.PI*2);ctx.fill();}ctx.strokeStyle='#273437';ctx.lineWidth=5;ctx.beginPath();ctx.arc(627,807,37,Math.PI,0);ctx.stroke();ctx.restore();
 }
 toCanvas(){this.root=null;this.meshes=[];this.arms=[];this.discs=[];}
 dispose(){this.key?.dispose();this.root?.dispose();for(const m of this.materials)m.dispose();}
}
