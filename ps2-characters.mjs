// Small diffuse maps and deliberately authored cross sections: all characters
// remain skinned by the existing transform hierarchy, with no extra render loop.
export function loft(rig,name,parent,rings,material,{sides=8,offset=[0,0,0],flat=false}={}){
 rings=[...rings].sort((a,b)=>b[0]-a[0]);
 const B=rig.B,positions=[],uvs=[],indices=[];
 for(let j=0;j<rings.length;j++){
  const [y,rx,rz,cx=0,cz=0]=rings[j];
  for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2;positions.push(cx+Math.sin(a)*rx,y,cz+Math.cos(a)*rz);uvs.push(i/sides,1-j/(rings.length-1));if(j<rings.length-1&&i<sides){const k=j*(sides+1)+i;indices.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}}
 }
 const data=new B.VertexData();data.positions=positions;data.indices=indices;data.uvs=uvs;data.normals=[];for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];B.VertexData.ComputeNormals(positions,indices,data.normals);
 const mesh=new B.Mesh(name,rig.owner.scene);data.applyToMesh(mesh);mesh.parent=parent;mesh.position.set(...offset);mesh.material=material;mesh.isPickable=false;mesh.receiveShadows=true;if(flat)mesh.convertToFlatShadedMesh();rig.meshes.push(mesh);return mesh;
}
export function paintedMaterial(rig,name,color,type='cloth'){
 const B=rig.B,m=rig.material(name,color,type==='skin'?.11:.08),c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
 x.fillStyle='#dedbd2';x.fillRect(0,0,128,128);let seed=77;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<1800;i++){x.fillStyle=rnd()>.5?'#ffffff09':'#1c23280e';x.fillRect(rnd()*128,rnd()*128,1+rnd()*5,1+rnd()*4);}
 for(let i=0;i<(type==='skin'?0:14);i++){const p=rnd()*128;x.strokeStyle=type==='hair'?'#201b14a0':'#18232b22';x.lineWidth=type==='hair'?2:1;x.beginPath();x.moveTo(p,0);x.bezierCurveTo(p+14,38,p-12,85,p+5,128);x.stroke();x.strokeStyle='#efe1b327';x.beginPath();x.moveTo(p+2,0);x.bezierCurveTo(p+16,38,p-10,85,p+7,128);x.stroke();}
 m.diffuseTexture=rig.owner.texture(c);m.specularColor=B.Color3.Black();m.backFaceCulling=false;return m;
}
export function sculptedHead(rig,parent,{female=false}={}){
 const B=rig.B,m=rig.material(female?'resident-painted-face':'dj-painted-face','#ffffff',.07);
 // One shared atlas per scene, disposed with the scene. Geometry supplies the
 // bridge, brow, cheekbones, lips and jaw; no floating eyeballs or dot faces.
 const scene=rig.owner.scene;
 const key=female?'residentFaceTexture':'ps2FaceAtlas',url=female?'./assets/ps2-resident-face-v2.jpg':'./assets/ps2-faces.jpg';
 const atlas=scene.metadata?.[key]||new B.Texture(new URL(url,import.meta.url).href,scene,false,true,B.Texture.BILINEAR_SAMPLINGMODE);
 (scene.metadata??={})[key]=atlas;atlas.anisotropicFilteringLevel=2;m.diffuseTexture=atlas;m.specularColor=B.Color3.Black();m.backFaceCulling=false;
 if(female)m.diffuseColor.set(.92,.98,1);
 const rows=female?[[27,12,8,0],[23,17,11,0],[15,20,14,0],[7,21,15,1],[3,20,16,2],[-2,19.5,17,3],[-7,18.5,18,5],[-10,18,16,2],[-14,17.5,16,1],[-18,16,14,1],[-23,12,10,0],[-26,5.5,5,0]]:[ [28,11,7,0], [23,17,11,0], [15,19,14,0], [7,20,15,1], [3,20,15,3], [-2,18.8,17,6], [-7,18,18,9], [-10,17.2,15,3], [-14,16,16,1], [-18,14.5,15,1], [-24,10.5,10,0], [-27,5,5,0] ];
 const positions=[],uvs=[],indices=[],n=16;
 for(let j=0;j<rows.length;j++){
  const [y,w,d,nose]=rows[j];for(let i=0;i<=n;i++){
   const a=i/n*2*Math.PI,s=Math.sin(a),z=Math.cos(a),px=s*w*(female?.94:1),front=z>0;
   positions.push(px,y,z*d+(front?nose*Math.exp(-((s/.19)**2)):0));
   const u=front?Math.max(.015,Math.min(.985,.5+px/40)):.015;
   uvs.push(female?u:u*.5,(y+27)/55);
   if(j<rows.length-1&&i<n){const k=j*(n+1)+i;indices.push(k,k+n+1,k+1,k+1,k+n+1,k+n+2);}
  }
 }
 const data=new B.VertexData();data.positions=positions;data.indices=indices;data.uvs=uvs;data.normals=[];for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];B.VertexData.ComputeNormals(positions,indices,data.normals);
 const head=new B.Mesh(female?'resident-sculpted-face':'dj-sculpted-face',scene);data.applyToMesh(head);head.parent=parent;head.material=m;head.isPickable=false;head.receiveShadows=true;rig.meshes.push(head);return head;
}
export function hairLock(rig,name,parent,points,width,material){
 const rings=points.map(([x,y,z],i)=>[y,width*(i===points.length-1?.16:i===0?.7:1),width*.6,x,z]);
 return loft(rig,name,parent,rings,material,{sides:5,flat:true});
}
export function hand(rig,parent,side,material){
 const palm=loft(rig,'anatomical-palm',parent,[[5,5.1,3],[0,6,3.5],[-9,5.8,3],[-13,4.4,2.4]],material,{sides:6});
 for(let i=0;i<4;i++){
  const finger=loft(rig,'tapered-finger',palm,[[-10,1.35,1.5],[-16-(i%3),1.25,1.3],[-20-(i%3),.7,.8]],material,{sides:5,offset:[-4+i*2.7,0,.8]});finger.rotation.x=-.12;
 }
 const thumb=loft(rig,'opposed-thumb',palm,[[0,2,2],[-6,1.8,1.7],[-11,1,1]],material,{sides:5,offset:[side*5,0,1]});thumb.rotation.z=side*.55;
 return palm;
}
// Orient a tapered limb between two moving points without reallocating its
// vertex buffers. Rest lengths remain fixed and the elbows retain volume.
export function aimLimb(B,mesh,a,b){mesh.position.copyFrom(a).addInPlace(b).scaleInPlace(.5);const d=b.subtract(a);mesh.scaling.y=d.length();mesh.rotation.set(Math.atan2(d.z,Math.hypot(d.x,d.y)),0,Math.atan2(-d.x,d.y));}
