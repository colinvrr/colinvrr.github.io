import {loft, paintedMaterial, sculptedHead, hairLock, hand, aimLimb} from './ps2-characters.mjs?v=48';
import {buildBerlinFacade} from './berlin-scene.mjs?v=47';
// A real recessed ground-floor room: the performer, counter, records and plant
// are volumes behind the glazing, never a painted replacement for the scene.
export function buildApartment(owner){
 const s=owner,wood=s.maps.wood.image,stone=s.maps.stone.image;
 const berlin=s.place?.theme==='berlin';
 if(berlin)buildBerlinFacade(s);else{s.masonry();s.windows();s.door();}
 // Replace the garage's entire ground-floor opening with a residential bay.
 s.box(207,612,832,48,35,-5,berlin?'#697376':'#b7c7bf',stone,'stone',2);
 s.box(205,660,34,505,50,9,berlin?'#38464c':'#657e7b',null,'steel',2);
 s.box(1003,660,34,505,50,9,berlin?'#38464c':'#657e7b',null,'steel',2);
 s.box(239,660,764,27,48,9,berlin?'#303f45':'#75918a',null,berlin?'steel':'wood',2);
 s.box(239,1150,764,15,48,9,berlin?'#424f53':'#75918a',null,berlin?'steel':'wood',2);
 // Rear wall, floor and ceiling have actual depth behind the street window.
 s.box(243,687,756,476,18,-525,berlin?'#33323d':'#435c59',null,'interior-wall',1);
 s.box(243,1145,756,15,530,-249,berlin?'#75634f':'#a37a4b',berlin?stone:wood,'interior-wood',1);
 s.box(243,689,756,10,530,-249,berlin?'#555d64':'#bca981',null,'interior-wall',1);
 for(let i=0;i<15;i++)s.box(252+i*49,1143,2,2,512,-246,'#594d3b',null,'interior-dark',.2);
 if(berlin){
  // Flat worn brick faces on the deep back wall catch the pendant's warm wash.
  for(let row=0;row<17;row++)for(let col=0;col<15;col++){
   const x=247+col*51+(row%2)*25;if(x>988)continue;
   s.box(x,700+row*26,Math.min(49,996-x),24,3,-514,['#3c3942','#423c43','#484048','#393640'][(col*3+row)%4],stone,'interior-wall',.2);
  }
 }
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
  const shade=B.MeshBuilder.CreateCylinder('apartment-pendant',{diameterTop:31,diameterBottom:79,height:37,tessellation:24},s.scene);shade.position=s.vec(868,802,-285);s.add(shade,berlin?'#3c464d':'#b89d66',null,'interior-brass',false);
  const bulb=B.MeshBuilder.CreateSphere('apartment-lamp',{diameter:30,segments:12},s.scene);bulb.position=s.vec(868,821,-285);s.add(bulb,berlin?'#df9f43':'#f9d49a',null,'interior-glow',false);
 }
 s.tube([[868,697,-285],[868,785,-285]],'#484a43',1.7,'interior-dark');
 // A timber counter, with a metal foot rail, leaves the DJ's hands in view.
 s.box(414,992,446,154,164,-152,berlin?'#595653':'#8e6543',berlin?stone:wood,'interior-wood',3);
 s.box(397,979,480,17,202,-152,berlin?'#8a8071':'#c4a477',berlin?stone:wood,'interior-wood',3);
 for(const x of [429,550,671,792])s.box(x,1011,3,115,3,-68,'#5b4f3f',null,'interior-dark',.5);
 s.tube([[426,1122,-42],[852,1122,-42]],'#9b936e',2,'interior-brass');
 s.records.push({kind:'dj',z:-190});
 // The window is transparent geometry, with narrow timber mullions.
 for(const x of [250,748])s.box(x,691,x===250?4:6,458,17,22,berlin?'#344149':'#677f79',null,berlin?'steel':'wood',.7);
 s.box(246,765,752,7,18,22,berlin?'#344149':'#75918a',null,berlin?'steel':'wood',.7);
 if(s.engine){
  const B=s.api,glass=B.MeshBuilder.CreatePlane('apartment-window-glass',{width:748,height:455},s.scene);glass.position=s.vec(621,921.5,30);s.add(glass,'#b8d1cf',null,'interior-glass',false);
  if(berlin){
   for(const x of [283,886]){
    s.box(x,932,79,210,82,-121,'#242d35',null,'interior-dark',2);
    for(const y of [982,1070]){
     // The shallow diaphragm is non-uniform from rest, so its normal shader
     // is already ready when bass first changes the radial scale.
     const driver=B.MeshBuilder.CreateCylinder('club-speaker',{diameter:54,height:7,tessellation:48},s.scene);driver.rotation.x=Math.PI/2;driver.scaling.y=.7;driver.position=s.vec(x+39.5,y,-77);s.add(driver,'#28343e',null,'interior-dark',false);s.staticMeshes.pop();
     for(const diameter of [37,48]){
      const groove=B.MeshBuilder.CreateTorus('woofer-concentric-ridge',{diameter,thickness:.8,tessellation:48},s.scene);groove.parent=driver;groove.position.y=6.5;groove.material=s.mat('#849198',null,'interior-dark');groove.isPickable=false;
     }
     const cone=B.MeshBuilder.CreateSphere('speaker-dust-cap',{diameter:28,segments:20},s.scene);cone.scaling.z=.3;cone.position=s.vec(x+39.5,y,-70);s.add(cone,'#6d7b83',null,'interior-dark',false);s.staticMeshes.pop();
     const rim=B.MeshBuilder.CreateTorus('woofer-light-ring',{diameter:66,thickness:2.3,tessellation:48},s.scene);rim.rotation.x=Math.PI/2;rim.position=s.vec(x+39.5,y,-68);
     const glow=new B.PBRMaterial('woofer-bass-light',s.scene);glow.unlit=true;glow.albedoColor=B.Color3.Black();glow.emissiveColor=new B.Color3(.025,.05,.07);rim.material=glow;rim.isPickable=false;
     (s.speakerCones??=[]).push({driver,cone,glow,driverZ:driver.position.z,coneZ:cone.position.z});
    }
   }
  }else{
  const pot=B.MeshBuilder.CreateCylinder('plant-pot',{diameterTop:74,diameterBottom:54,height:62,tessellation:20},s.scene);pot.position=s.vec(928,1115,-143);s.add(pot,'#a37252',null,'interior-wood',false);
  for(let i=0;i<13;i++){
   const angle=i*2.399,tip=[928+Math.sin(angle)*(30+i%3*9),950+i%5*22,-143+Math.cos(angle)*26];
   s.tube([[928,1088,-143],[tip[0],tip[1]+30,tip[2]],tip],'#495e44',1.2,'interior-leaf');
   const leaf=B.MeshBuilder.CreateSphere('apartment-leaf',{diameter:2,segments:10},s.scene);leaf.position=s.vec(...tip);leaf.scaling.set(11,34,3.5);leaf.rotation.z=Math.sin(angle)*.8;s.add(leaf,i%2?'#6b845a':'#536e4c',null,'interior-leaf',false);
  }
  }
 }
}

const BVector=(B,a,b,t)=>B.Vector3.Lerp(a,b,t);
export class ApartmentDJ {
 constructor(owner){this.owner=owner;this.B=owner.api;this.meshes=[];this.materials=[];this.arms=[];this.time=0;this.lastDraw=0;if(owner.engine)this.build();}
 material(name,color,emission=.12){const B=this.B,m=new B.StandardMaterial(name,this.owner.scene);m.diffuseColor=B.Color3.FromHexString(color);m.emissiveColor=m.diffuseColor.scale(emission);m.specularColor=new B.Color3(.04,.04,.04);m.specularPower=20;this.materials.push(m);return m;}
 ball(name,parent,p,scale,material){const B=this.B,m=B.MeshBuilder.CreateSphere(name,{diameter:2,segments:8},this.owner.scene);m.parent=parent;m.position=new B.Vector3(...p);m.scaling=new B.Vector3(...scale);m.material=material;m.isPickable=false;m.convertToFlatShadedMesh();this.meshes.push(m);return m;}
 box(name,parent,p,scale,material){const B=this.B,m=B.MeshBuilder.CreateBox(name,{width:scale[0],height:scale[1],depth:scale[2]},this.owner.scene);m.parent=parent;m.position=new B.Vector3(...p);m.material=material;m.isPickable=false;this.meshes.push(m);return m;}
 build(){
  const B=this.B,scene=this.owner.scene;
  const berlin=this.owner.place?.theme==='berlin';
  this.skin=paintedMaterial(this,'dj-skin','#c29d7c','skin');this.shirt=paintedMaterial(this,'dj-petrol-cotton','#3f6b88');this.ink=this.material('dj-black','#1b2023');this.metal=this.material('dj-metal','#758080');this.glow=this.material('dj-led',berlin?'#9b9862':'#f0a36d',.35);
  this.hair=paintedMaterial(this,'dj-wavy-brown-hair','#77583f','hair');this.hairLight=paintedMaterial(this,'dj-hair-highlights','#89694a','hair');
  this.root=new B.TransformNode('apartment-dj',scene);this.root.position=this.owner.vec(627,980,-245);
  this.body=loft(this,'dj-tailored-tshirt',this.root,[[7,34,22],[24,35,23],[64,42,24],[99,52,25],[116,50,22],[124,30,16],[128,13,11]],this.shirt,{sides:10});
  loft(this,'dj-neck',this.root,[[125,10,10],[143,9,10]],this.skin,{sides:8});
  this.head=new B.TransformNode('dj-head',scene);this.head.parent=this.root;this.head.position.set(0,166,2);
  sculptedHead(this,this.head);
  loft(this,'dj-centre-part-crown',this.head,[[19,21,15,0,-5],[28,21,15,0,-4],[33,16,12,0,-4],[36,5,5,0,-5]],this.hair,{sides:10,flat:true});
  for(const side of [-1,1]){
   // Irregular swept locks expose the central forehead and wave at the temples.
   hairLock(this,'dj-parted-wave',this.head,[[side*3,31,10],[side*11,30,15],[side*18,23,16],[side*20,13,12],[side*18,7,13]],5.3,this.hair);
   hairLock(this,'dj-falling-fringe',this.head,[[side*9,30,15],[side*14,23,18],[side*12,17,19],[side*15,11,17]],3.4,this.hairLight);
   hairLock(this,'dj-temple-curl',this.head,[[side*20,24,0],[side*23,15,0],[side*23,3,-1],[side*20,-5,1]],4.2,this.hair);
   this.ball('dj-ear',this.head,[side*20,-1,0],[3,6,3.5],this.skin);
   const shoulder=new B.Vector3(side*47,113,0),elbow=new B.Vector3(side*69,64,34),wrist=new B.Vector3(side*64,17,101);
   const limb=(name,mat,a,b)=>{const m=loft(this,name,this.root,[[.5,a,a*.82],[.12,(a+b)*.5,(a+b)*.4],[-.5,b,b*.85]],mat,{sides:7});return m;};
   const sleeve=limb('dj-short-sleeve',this.shirt,17,13),upper=limb('dj-bare-upper-arm',this.skin,10,8),forearm=limb('dj-faceted-forearm',this.skin,9,5.5);
   const palm=hand(this,this.root,side,this.skin);palm.rotation.x=-Math.PI/2;palm.rotation.z=side*.12;
   this.arms.push({side,shoulder,elbow,wrist,sleeve,upper,forearm,hand:palm});
  }
  this.discs=[];
  for(const side of [-1,1]){
   this.box('dj-deck',this.root,[side*116,0,106],[163,13,150],this.ink);
   const disc=B.MeshBuilder.CreateCylinder('dj-vinyl',{diameter:112,height:3,tessellation:16},scene);disc.parent=this.root;disc.position.set(side*116,9,101);disc.material=this.ink;disc.convertToFlatShadedMesh();this.meshes.push(disc);this.discs.push(disc);
   const label=B.MeshBuilder.CreateCylinder('vinyl-label',{diameter:29,height:1,tessellation:12},scene);label.parent=disc;label.position.y=2;label.material=this.glow;label.convertToFlatShadedMesh();this.meshes.push(label);
   const marker=this.box('vinyl-marker',disc,[15,2,0],[12,1,3],this.metal);
   this.box('deck-pitch',this.root,[side*185,9,110],[3,2,70],this.metal);
  }
  this.box('dj-mixer',this.root,[0,3,108],[58,20,135],this.metal);
  for(let i=0;i<4;i++)for(let j=0;j<3;j++)this.ball('mixer-knob',this.root,[-19+i*12,17,63+j*22],[3,5,3],this.ink);
  for(let i=0;i<6;i++)this.box('mixer-light',this.root,[-20+i*8,16,143],[3,1,7],this.glow);
  for(const light of [...scene.lights])light.excludedMeshes.push(...this.meshes);
  this.key=new B.HemisphericLight('dj-room-light',new B.Vector3(-.3,1,1),scene);this.key.intensity=berlin?1.08:.95;this.key.diffuse=berlin?new B.Color3(.91,.83,.7):new B.Color3(1,.84,.65);this.key.groundColor=new B.Color3(.25,.22,.2);this.key.includedOnlyMeshes=this.meshes;
  this.apply([0,0,0]);
 }
 advance(dt,playing,bands,reduced=false){if(!playing||!this.root)return false;this.time+=dt*(reduced?.2:1);this.apply(bands);return true;}
 apply(bands){
  if(!this.root)return;const t=this.time,bass=bands?.[0]||0,mid=bands?.[1]||0;
  this.body.rotation.z=Math.sin(t*1.4)*(.025+bass*.025);this.head.rotation.x=.11+Math.sin(t*2.7)*(.035+bass*.045);this.head.rotation.z=Math.sin(t*1.4)*.035;
  this.head.rotation.y=.3+Math.sin(t*.45)*.15;
  for(const {side,shoulder,elbow,wrist,sleeve,upper,forearm,hand:palm}of this.arms){
   const reach=Math.sin(t*.75+(side<0?0:2))*10,press=Math.sin(t*3+side)*(.5+mid*1.8);
   elbow.set(side*(69+reach*.2),64+press,34);wrist.set(side*(64+reach),17+Math.max(0,press),101+Math.cos(t*.65+side)*8);
   const cuff=BVector(this.B,shoulder,elbow,.56);aimLimb(this.B,sleeve,shoulder,cuff);aimLimb(this.B,upper,cuff,elbow);aimLimb(this.B,forearm,elbow,wrist);palm.position.copyFrom(wrist);
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
