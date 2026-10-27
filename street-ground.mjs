// A continuous horizontal street section. y increases downwards in facade
// coordinates; z increases towards the viewer. The kerb is a real vertical drop.
export const STREET={wallZ:-110,facadeZ:-55,pavementY:1165,kerbZ:185,kerbWidth:40,fall:4,kerbHeight:22};
export const DOORSTEP={x:9,y:1156,width:171,height:12,depth:62,z:-5};
export function pavementY(z){return STREET.pavementY+STREET.fall*(z-STREET.facadeZ)/(STREET.kerbZ-STREET.facadeZ);}
export function roadY(z){return STREET.pavementY+STREET.fall+STREET.kerbHeight+(z-STREET.kerbZ-STREET.kerbWidth)*.008;}

export function streetQuad(x,width,z0,z1,height){return [[x,height(z0),z0],[x+width,height(z0),z0],[x,height(z1),z1],[x+width,height(z1),z1]];}
function surface(scene,name,x,width,z0,z1,height,color,map,kind){
 const points=streetQuad(x,width,z0,z1,height);
 // Separate top-face UVs use x/z, unlike vertical facade UVs. The asphalt
 // grain therefore lies on the pavement and is not stretched into stripes.
 if(scene.engine){
  const B=scene.api,positions=[],uv=[],indices=[0,1,2,1,3,2];
  for(const [xx,y,z]of points){const p=scene.vec(xx,y,z);positions.push(p.x,p.y,p.z);uv.push(xx/240,z/240);}
  const data=new B.VertexData();data.positions=positions;data.indices=indices;data.uvs=uv;data.normals=[];B.VertexData.ComputeNormals(positions,indices,data.normals);
  const mesh=new B.Mesh(name,scene.scene);data.applyToMesh(mesh);scene.add(mesh,color,map,kind,false);
  mesh.metadata.ground=true;
 }
 // In the emergency 2D renderer the projection starts below the aperture.
 const project=([xx,y,z])=>{const distance=2900,depth=z-STREET.facadeZ,scale=distance/(distance-depth);return [620+(xx-620)*scale,1165+(y-1165)+(1165-625.5)*(scale-1)];};
 const projected=points.map(project);scene.records.push({kind:'polygon',points:[projected[0],projected[1],projected[3],projected[2]],z:500,color});
}
function graniteBlock(scene,x,width){
 const top=STREET.pavementY+STREET.fall,depth=STREET.kerbWidth;
 scene.box(x,top,width,STREET.kerbHeight,depth,STREET.kerbZ+depth/2,'#a7a8a0',scene.maps.granite.image,'granite',1.6);
}
export function buildStreetGround(scene){
 const x=-2500,width=6200,kerbFront=STREET.kerbZ+STREET.kerbWidth;
 surface(scene,'asphalt-pavement',x,width,STREET.wallZ,STREET.kerbZ,pavementY,'#d1d0c7',scene.maps.pavement.image,'asphalt');
 surface(scene,'lower-roadway',x,width,kerbFront,2700,roadY,'#b3b6b2',scene.maps.road.image,'asphalt');
 // Individually jointed grey granite kerbs, with a softly worn upper arris.
 for(let xx=x;xx<x+width;xx+=177)graniteBlock(scene,xx,175.8);
 // Narrow gutter follows the foot of the kerb, flush with the lower roadway.
 surface(scene,'gutter',x,width,kerbFront,kerbFront+24,z=>roadY(z)-.15,'#8c918b',scene.maps.road.image,'asphalt');
 // A small, flush cast-iron utility cover on the pavement, not a floating grate.
 const cx=835,z=59,top=pavementY(z)-.35;
 scene.box(cx,top,63,1.5,57,z,'#454e49',null,'iron',.8);
 scene.box(cx+3,top-.25,57,.5,51,z,'#58605a',null,'iron',.4);
 for(let i=0;i<8;i++){
  const zz=z-21+i*6;
  scene.tube([[cx+7,top-.7,zz],[cx+55,top-.7,zz]],'#6d746b',.35,'iron');
 }
 // Faded parking-bay corners lie flush with the asphalt. They lead the eye
 // towards the garage and add a scale cue to the newly visible foreground.
 const paintY=z=>roadY(z)-.24;
 for(const side of [350,880]){
  surface(scene,'worn-parking-line',side,9,1250,1740,paintY,'#bbb69d',scene.maps.granite.image,'asphalt');
  surface(scene,'parking-corner',side===350?350:769,120,1242,1251,paintY,'#bbb69d',scene.maps.granite.image,'asphalt');
 }
 // A small cast-iron service cover with a recessed frame and transverse ribs.
 const coverX=530,coverZ=2040,coverY=roadY(coverZ)-.6;
 scene.box(coverX,coverY,94,1.2,104,coverZ,'#343b38',null,'iron',.5);
 scene.box(coverX+5,coverY-.12,84,.7,94,coverZ,'#4b514a',null,'iron',.3);
 for(let i=0;i<11;i++)scene.box(coverX+10,coverY-.65,74,.5,2,coverZ-39+i*7.8,'#60665a',null,'iron',.2);
 // The shop threshold is seated in the pavement and barely raised above it.
 scene.box(239,1162,764,6,49,7,'#aaa79a',scene.maps.granite.image,'granite',.8);
}
