// Clip room geometry to the cone seen through its own opening. A room behind
// the facade must never become visible through an adjacent transparent bay.
export function portalPlanes(portal,eye){
 const depth=eye.z-portal.z,ratio=z=>(eye.z-z)/depth;
 const left=z=>eye.x+(portal.x-eye.x)*ratio(z),right=z=>eye.x+(portal.x+portal.width-eye.x)*ratio(z);
 const top=z=>eye.y+(portal.y-eye.y)*ratio(z),bottom=z=>eye.y+(portal.y+portal.height-eye.y)*ratio(z);
 return [p=>p[0]-left(p[2]),p=>right(p[2])-p[0],p=>p[1]-top(p[2]),p=>bottom(p[2])-p[1],p=>portal.z-p[2]];
}
export function clipInteriorTriangles(vertices,indices,portal,eye){
 const planes=portalPlanes(portal,eye),result=[],triangles=[];
 for(let i=0;i<indices.length;i+=3){
  let polygon=indices.slice(i,i+3).map(index=>vertices[index]);
  for(const distance of planes){
   const clipped=[];
   for(let j=0;j<polygon.length;j++){
    const a=polygon[j],b=polygon[(j+1)%polygon.length],da=distance(a),db=distance(b),inside=da>=0,nextInside=db>=0;
    if(inside)clipped.push(a);
    if(inside!==nextInside){const t=da/(da-db);clipped.push(a.map((v,k)=>v+(b[k]-v)*t));}
   }
   polygon=clipped;if(polygon.length<3)break;
  }
  if(polygon.length<3)continue;
  const start=result.length;result.push(...polygon);
  for(let j=1;j<polygon.length-1;j++)triangles.push(start,start+j,start+j+1);
 }
 return {vertices:result,indices:triangles};
}
export function containInteriorBox(owner,portal){
 // Retain a bounded fallback drawing if WebGL is later lost.
 const record=owner.records.at(-1),right=Math.min(record.x+record.w,portal.x+portal.width),bottom=Math.min(record.y+record.h,portal.y+portal.height);
 record.x=Math.max(record.x,portal.x);record.y=Math.max(record.y,portal.y);record.w=Math.max(0,right-record.x);record.h=Math.max(0,bottom-record.y);
 if(!owner.engine)return;
 const mesh=owner.staticMeshes.at(-1),positions=mesh.getVerticesData('position'),uvs=mesh.getVerticesData('uv'),normals=mesh.getVerticesData('normal'),origin=owner.vec(0,0,0);
 const eye={x:owner.camera.position.x-origin.x,y:origin.y-owner.camera.position.y,z:owner.camera.position.z},vertices=[];
 for(let i=0;i<positions.length/3;i++)vertices.push([positions[i*3]+mesh.position.x-origin.x,origin.y-positions[i*3+1]-mesh.position.y,positions[i*3+2]+mesh.position.z,uvs[i*2],uvs[i*2+1],normals[i*3],normals[i*3+1],normals[i*3+2]]);
 const clipped=clipInteriorTriangles(vertices,Array.from(mesh.getIndices()),portal,eye);
 if(!clipped.indices.length){owner.staticMeshes.pop();mesh.dispose();return;}
 const data=new owner.api.VertexData();data.positions=[];data.uvs=[];data.normals=[];data.indices=clipped.indices;
 for(const [x,y,z,u,v,nx,ny,nz]of clipped.vertices){data.positions.push(x+origin.x,origin.y-y,z);data.uvs.push(u,v);data.normals.push(nx,ny,nz);}
 mesh.position.set(0,0,0);data.applyToMesh(mesh);
}
