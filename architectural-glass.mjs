import {containInteriorBox} from './interior-portal.mjs';

// A local reflection environment for glazing: cool sky, soft clouds and the
// contrasting windows of the opposite street. No reflection render pass.
export function createGlassEnvironment(owner){
 const B=owner.api,size=128,faces=[];
 for(let face=0;face<6;face++){
  const data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const u=x/(size-1),v=y/(size-1),sky=face===2?1:face===3?0:1-v;
   let color=[30+sky*117,49+sky*146,61+sky*164];
   const cloud=Math.exp(-(((v-.22-u*.13)/.095)**2))*(.48+.32*Math.sin(u*8)**2);
   color=color.map((c,k)=>c+(225-k*2-c)*cloud*.65);
   if(face!==2&&face!==3){
    const roof=.4+.055*Math.sin(Math.floor(u*5)*2.2);
    if(v>roof){
     const column=(u*6.5+.17)%1,row=((v-roof)*7.2)%1;
     color=column>.16&&column<.7&&row>.14&&row<.81?[27,49,64]:column>.73&&column<.81?[174,184,179]:[119,139,145];
     if(row>.81&&row<.87)color=[191,201,194];
    }
   }
   const k=(y*size+x)*4;for(let c=0;c<3;c++)data[k+c]=color[c];data[k+3]=255;
  }
  faces.push(data);
 }
 const texture=new B.RawCubeTexture(owner.scene,faces,size,B.Engine.TEXTUREFORMAT_RGBA,B.Engine.TEXTURETYPE_UNSIGNED_BYTE,true,false,B.Texture.TRILINEAR_SAMPLINGMODE);
 texture.name='opposite-street-glass-reflections';texture.coordinatesMode=B.Texture.CUBIC_MODE;return texture;
}
export function configureGlass(owner,material,{interior=false}={}){
 const B=owner.api;
 material.albedoColor=B.Color3.FromHexString('#b8d5df');material.metallic=0;material.roughness=.035;
 material.alpha=interior?.18:owner.place?.theme==='berlin'?.48:.38;
 material.transparencyMode=B.PBRMaterial.PBRMATERIAL_ALPHABLEND;
 material.useAlphaFresnel=true;material.useLinearAlphaFresnel=false;
 material.indexOfRefraction=1.52;material.directIntensity=.08;material.specularIntensity=1.15;
 // The generated cubemap is LDR; boost its radiance to approximate bright
 // outdoor sky reflected over a comparatively dim interior.
 material.reflectionTexture=owner.glassEnvironment;material.environmentIntensity=6;
 material.clearCoat.isEnabled=true;material.clearCoat.intensity=.8;material.clearCoat.roughness=.035;material.clearCoat.indexOfRefraction=1.52;
 material.disableDepthWrite=true;material.backFaceCulling=true;material.metadata={glazing:true};
}
export function buildWindowRecess(owner,{x,y,width,height}){
 const portal={x:x+7,y:y+7,width:width-14,height:height-14,z:-33};
 const box=(xx,yy,w,h,d,z,color,kind='interior-recess')=>{owner.box(xx,yy,w,h,d,z,color,null,kind,.4);containInteriorBox(owner,portal);};
 const study=x<700,back=-450,inner=x+(x+width/2-620)*450/(owner.camera?.position.z||2900);
 // The two other apartments have individual, fully modelled interiors.
 box(x-180,y-220,width+360,height+440,12,back,study?'#4b5c53':'#725848');
 box(x-180,y+height-4,width+360,10,420,-245,'#8c674a');
 box(x-180,y+height-26,width+360,10,8,back+12,'#b4a889');
 for(const side of [-1,1])for(let i=0;i<5;i++){
  const xx=side<0?x-38+i*8:x+width-44+i*8;
  box(xx,y-30,9,height+65,12+(i%2)*7,-142,study?['#aaa88d','#bbb69d','#989c87'][i%3]:['#ac7c62','#c19976','#976b58'][i%3],'interior-fabric');
 }
 const art=(xx,yy,w,h,color)=>{box(xx-3,yy-3,w+6,h+6,5,back+18,'#c5ac7f');box(xx,yy,w,h,3,back+22,'#d9c8a4');box(xx+7,yy+9,w*.45,h*.7,2,back+25,color);box(xx+w*.48,yy+h*.4,w*.4,h*.45,2,back+27,'#6f8a81');};
 if(study){
  // Books, desk, chair and a lit reading lamp.
  box(inner+5,y+44,58,235,24,back+28,'#68513c');
  for(let row=0;row<4;row++){
   const yy=y+51+row*55;box(inner+2,yy+44,65,5,34,back+41,'#b39266');
   for(let i=0;i<5;i++)box(inner+9+i*10,yy+4+(i%2)*5,7,39-(i%2)*5,19,back+42,['#b58b62','#6e8683','#9c6e5f','#c6b083','#747c57'][(i+row)%5]);
  }
  art(inner+91,y+53,66,83,'#b27a51');
  box(inner+69,y+263,105,7,71,-280,'#9a774f');
  for(const xx of [inner+75,inner+159])box(xx,y+270,7,83,8,-255,'#785d43');
  box(inner+98,y+249,36,9,26,-267,'#c7b78e');
  box(inner+98,y+243,35,5,25,-267,'#4e6f6c');
  box(inner+143,y+213,3,47,3,-276,'#99834f');
  box(inner+129,y+206,31,15,22,-276,'#eedbb1','interior-glow');
  box(inner+104,y+278,45,52,15,-191,'#485d50');
  box(inner+104,y+327,45,6,38,-190,'#63735a');
 }else{
  // Terracotta lounge with a sofa, framed art, low table and floor lamp.
  art(inner+37,y+45,61,89,'#b86f48');art(inner+110,y+62,48,73,'#8a9b7b');
  box(inner+40,y+223,124,77,55,-362,'#a66d51','interior-fabric');
  box(inner+38,y+290,128,20,103,-323,'#bd8d69','interior-fabric');
  for(const xx of [inner+29,inner+159])box(xx,y+260,14,56,97,-326,'#8e5c47','interior-fabric');
  for(const xx of [inner+47,inner+146])box(xx,y+309,7,35,8,-288,'#5d4b3a');
  box(inner+87,y+242,32,34,10,-329,'#c5c093','interior-fabric');
  box(inner+54,y+322,94,5,54,-188,'#ad885b');
  for(const xx of [inner+63,inner+133])box(xx,y+327,5,24,5,-173,'#745a40');
  box(inner+174,y+141,3,200,3,-363,'#aa9567');
  box(inner+155,y+129,41,33,33,-363,'#edd5a1','interior-glow');
 }
 // A broad-leaf plant adds an organic silhouette near the light.
 const px=study?inner+173:inner+13;
 box(px,y+height-52,25,48,25,-222,'#9e7051');box(px+11,y+height-137,3,90,3,-222,'#596849');
 for(let i=0;i<7;i++)box(px-2+(i%2)*15,y+height-128+i*11,17,7,13,-219,'#79845b');
}

export function decorateShallowWindow(s,x,y,w,h,z,variant=0){
 // Small volumes behind the neighbours' arched / curved glass bays.
 const box=(xx,yy,ww,hh,color,d=4)=>s.box(xx,yy,ww,hh,d,z,color,null,'interior-scenery',.3);
 if(variant%2===0){
  box(x+w*.2,y+h*.54,3,h*.32,'#9d8b60');box(x+w*.11,y+h*.5,w*.2,h*.1,'#dec798',8);
  box(x+w*.6,y+h*.84,w*.16,h*.12,'#a87958',7);box(x+w*.67,y+h*.65,2,h*.2,'#586b4d');
  for(let i=0;i<4;i++)box(x+w*(.58+(i%2)*.1),y+h*(.65+i*.045),w*.14,h*.025,'#75815b',6);
 }else{
  box(x+w*.2,y+h*.53,w*.51,h*.035,'#8d7454',7);
  for(let i=0;i<6;i++)box(x+w*(.23+i*.075),y+h*(.35+(i%2)*.025),w*.05,h*(.17-(i%2)*.025),['#8e9b8f','#a88065','#c0af87'][i%3],6);
  box(x+w*.4,y+h*.75,w*.3,h*.12,'#5d7564',8);
 }
}
