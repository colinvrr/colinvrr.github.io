import * as B from './vendor/babylon.min.js';

const W=1240,H=1251,OPEN={x:243,y:689,width:756,height:474},BLADES=30;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rng(seed=9182){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function texture(width,height,draw){
 const c=document.createElement('canvas');c.width=width;c.height=height;draw(c.getContext('2d'),width,height);return {image:c};
}
function grit(ctx,w,h,seed,amount=1200){
 const rand=rng(seed);for(let i=0;i<amount;i++){
  const x=rand()*w,y=rand()*h,a=.015+rand()*.07;ctx.fillStyle=rand()>.52?`rgba(255,255,255,${a})`:`rgba(20,23,22,${a})`;
  ctx.fillRect(x,y,.5+rand()*3,.4+rand()*2);
 }
}
function materialMaps(){
 const stone=texture(512,256,(c,w,h)=>{c.fillStyle='#c6c1b4';c.fillRect(0,0,w,h);grit(c,w,h,3,10000);const r=rng(4);for(let i=0;i<160;i++){c.strokeStyle=`rgba(68,66,55,${.025+r()*.05})`;c.lineWidth=.4+r()*.7;c.beginPath();const x=r()*w,y=r()*h;c.moveTo(x,y);c.lineTo(x+2+r()*20,y+r()*3);c.stroke();}});
 const steel=texture(512,96,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#b7c2c5');g.addColorStop(.13,'#939fa2');g.addColorStop(.52,'#b4bec0');g.addColorStop(.82,'#859196');g.addColorStop(1,'#5b6669');c.fillStyle=g;c.fillRect(0,0,w,h);grit(c,w,h,81,3800);const r=rng(91);for(let i=0;i<115;i++){c.strokeStyle=`rgba(44,55,58,${.04+r()*.12})`;c.lineWidth=.4+r()*.65;c.beginPath();const x=r()*w,y=r()*h;c.moveTo(x,y);c.lineTo(x+4+r()*45,y+(r()-.5)*1.5);c.stroke();}});
 const fabric=texture(1024,180,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#9d111c');g.addColorStop(.18,'#e62230');g.addColorStop(.7,'#d60d22');g.addColorStop(1,'#a60a1a');c.fillStyle=g;c.fillRect(0,0,w,h);const r=rng(43);for(let i=0;i<31;i++){let x=i*w/30;c.fillStyle=`rgba(76,0,8,${.015+r()*.055})`;c.beginPath();c.moveTo(x,0);c.lineTo(x+4+r()*7,0);c.lineTo(x+16+r()*13,h);c.lineTo(x-1,h);c.fill();c.strokeStyle=`rgba(255,188,179,${.03+r()*.05})`;c.beginPath();c.moveTo(x+6,2);c.lineTo(x+17,h-2);c.stroke();}grit(c,w,h,21,3500);});
 const blue=texture(512,256,(c,w,h)=>{c.fillStyle='#10212b';c.fillRect(0,0,w,h);grit(c,w,h,35,5000);const r=rng(51);for(let i=0;i<75;i++){c.strokeStyle=`rgba(187,198,199,${r()*.11})`;const x=r()*w,y=r()*h;c.beginPath();c.moveTo(x,y);c.lineTo(x+(r()-.5)*50,y+r()*12);c.stroke();}});
 return {stone,steel,fabric,blue};
}
function glassTexture(){return texture(256,256,(c,w,h)=>{c.clearRect(0,0,w,h);const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'rgba(230,240,234,.22)');g.addColorStop(.36,'rgba(220,231,226,.04)');g.addColorStop(.4,'rgba(243,247,234,.15)');g.addColorStop(.45,'rgba(216,230,224,.02)');g.addColorStop(1,'rgba(36,59,61,.14)');c.fillStyle=g;c.fillRect(0,0,w,h);});}
function columnTexture(){return texture(128,700,(c,w,h)=>{
 c.clearRect(0,0,w,h);const r=rng(50);
 for(let i=0;i<45;i++){const x=r()*110,y=r()*h,ww=8+r()*34,hh=5+r()*34;c.save();c.translate(x,y);c.rotate((r()-.5)*.12);c.fillStyle=['#ecece0','#cfdbd1','#f3eee5','#d7dfd7','#e8eded'][Math.floor(r()*5)];c.globalAlpha=.55+r()*.35;c.fillRect(0,0,ww,hh);c.fillStyle=['#32577a','#d22536','#222b29','#95b64e'][Math.floor(r()*4)];c.fillRect(2,2,Math.max(2,ww*.5),1.5);if(hh>12)c.fillRect(2,6,Math.max(2,ww*.7),1);c.restore();}
 });}
function graffitiTexture(){return texture(1536,960,(c,w,h)=>{
 c.clearRect(0,0,w,h);c.lineJoin='round';c.lineCap='round';
 const stroke=(path,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.stroke(new Path2D(path));};
 // Several overlapping tags, painted across the hooks rather than floating
 // above the curtain. Paths are original vector strokes inspired by the photo.
 const red='rgba(177,38,46,.90)',red2='rgba(211,43,52,.73)';
 const paths=[
 'M44 355 C70 244 188 220 267 262 C337 302 333 370 294 422 C260 466 180 483 134 449 C105 426 114 383 168 382 C203 382 214 407 201 429',
 'M86 341 C125 320 189 338 221 374 M89 340 L91 423 M150 326 L153 404 M200 327 L222 399',
 'M264 271 C329 252 385 282 397 348 C411 408 394 434 370 424 C347 415 357 371 346 349 C337 331 322 336 319 358 L319 416',
 'M396 290 C452 267 500 296 504 347 C511 399 497 425 477 421 M503 302 C550 276 589 299 592 340 C595 369 585 388 564 385',
 'M56 528 C72 474 118 464 162 482 C206 500 210 555 187 584 C161 616 117 612 105 580 C96 556 110 542 128 548',
 'M176 495 C216 454 291 464 327 512 C356 550 341 612 301 633 C262 655 212 635 204 607',
 'M333 497 C365 459 425 466 449 510 C467 546 459 594 434 607 C409 621 395 594 402 565',
 'M438 490 C481 465 541 484 555 527 C569 570 551 616 522 622 C490 630 480 597 490 574',
 'M557 513 C590 482 635 477 661 506 C682 529 686 585 669 616 C649 648 620 640 611 609',
 'M681 480 C725 451 788 465 813 507 C832 540 826 594 801 614 C770 637 740 619 738 590',
 'M819 492 C856 463 904 475 928 508 C954 543 950 592 932 615 C910 643 879 624 885 590',
 'M935 493 C980 470 1040 486 1058 529 C1074 571 1063 610 1036 621 C1003 634 983 607 994 580',
 'M1065 500 C1090 471 1140 469 1169 494 C1194 516 1195 567 1176 600 C1157 629 1128 622 1126 591',
 'M1194 496 C1232 467 1274 480 1292 513 C1309 547 1302 593 1280 611 C1256 630 1235 609 1238 583',
 'M1316 500 C1354 472 1406 481 1430 512 C1450 539 1445 589 1426 609',
 'M660 287 L711 339 M697 288 L678 351 M678 253 L693 317',
 'M1255 668 L1298 726 M1290 668 L1251 725 M1287 695 L1324 700',
 'M129 675 C90 645 55 658 51 701 C48 727 60 744 78 750',
 'M483 691 C520 671 546 681 559 710 M484 731 C519 715 544 716 562 736'
 ];
 paths.forEach((p,i)=>{stroke(p,i%4===0?red2:red,8+(i%3)*2);});
 const drip=[150,245,316,397,447,553,660,748,803,929,1058,1174,1280,1400];drip.forEach((x,i)=>{c.strokeStyle=i%3?red:red2;c.lineWidth=3+(i%3);c.beginPath();c.moveTo(x,605+(i%4)*8);c.lineTo(x+2,659+(i%5)*15);c.stroke();});
 // Pale filled silver throw-up in the upper right, with dark outline.
 const black='M825 258 C802 226 831 194 867 207 C884 179 932 177 951 199 C980 181 1020 190 1031 214 C1064 193 1101 205 1109 229 C1138 208 1181 216 1193 246 C1228 229 1270 244 1275 272 C1301 255 1334 270 1341 302 L1357 381 C1356 409 1329 421 1304 411 C1286 435 1255 435 1239 418 C1215 438 1178 431 1165 411 C1137 433 1099 428 1085 408 C1058 426 1023 421 1009 399 C977 419 940 405 935 384 C899 405 862 394 861 373 C831 383 807 360 821 334 C798 316 801 279 825 258 Z';
 c.fillStyle='rgba(226,230,224,.76)';c.fill(new Path2D(black));stroke(black,'rgba(24,32,32,.92)',9);
 ['M861 258 C884 240 925 242 938 266 M866 312 C890 293 924 302 932 321','M957 230 C981 242 992 268 982 290 M951 321 C973 303 998 308 1005 329','M1027 235 C1052 247 1058 273 1050 293 M1019 329 C1041 311 1067 317 1077 334','M1104 238 C1119 255 1120 289 1111 306 M1100 335 C1120 322 1143 323 1156 338','M1192 256 C1206 270 1213 303 1203 326 M1197 348 C1218 337 1239 340 1250 353','M1274 283 C1285 295 1293 323 1287 347'].forEach(p=>stroke(p,'rgba(28,33,33,.88)',6));
 stroke('M145 779 C175 747 192 775 208 752 M194 784 L231 755 M228 786 C249 759 267 770 283 748 M270 791 L303 751','rgba(54,54,134,.78)',7);
 stroke('M525 857 L546 824 L561 857 L578 823 L585 858 M601 854 L613 826 L625 855 M640 856 L651 820 M670 854 L685 827 L697 856','rgba(31,37,38,.85)',5);
 stroke('M997 864 L1015 827 L1029 852 L1043 825 M1055 861 L1077 824 L1099 858 M1120 857 L1134 826 L1154 853','rgba(30,50,79,.8)',7);
 // Local breaks in the pigment are wear on the metal edges.
 c.globalCompositeOperation='destination-out';const r=rng(878);for(let i=0;i<170;i++){c.globalAlpha=.25+r()*.45;c.fillRect(r()*w,r()*h,2+r()*12,.6+r()*2);}c.globalAlpha=1;c.globalCompositeOperation='source-over';
 });}
function guide(y){if(y>=22)return y;if(y<=0)return 0;return y*y*(44-y)/(22*22);}
export function bladePlacement(index,progress,count=BLADES){
 const t=clamp(progress,0,1),e=t*t*(3-2*t),pitch=OPEN.height/count,lift=(OPEN.height+32)*e,top=index*pitch-lift,bottom=top+pitch,a=guide(top),b=guide(bottom);
 return {y:OPEN.y+(a+b)/2,height:Math.max(0,b-a),pitch,visible:b-a>.08,fold:1-clamp((b-a)/pitch,0,1)};
}

// Architecture and shutter are built as independent meshes. No reference image is loaded.
export class StreetScene {
 constructor(canvas,windowElement,place){
  this.canvas=canvas;this.window=windowElement;this.place=place;this.progress=0;this.records=[];this.blades=[];this.staticMeshes=[];this.disposed=false;this.textureCache=new Map();this.matCache=new Map();this.mapIds=new WeakMap();this.nextMapId=0;
  this.maps=materialMaps();this.paintCanvas=graffitiTexture().image;
  try{
   this.engine=new B.Engine(canvas,true,{alpha:true,preserveDrawingBuffer:true,stencil:false});
   this.scene=new B.Scene(this.engine);this.scene.clearColor=new B.Color4(0,0,0,0);this.scene.ambientColor=new B.Color3(.7,.7,.7);
   this.camera=new B.FreeCamera('facade',new B.Vector3(0,0,3000),this.scene);this.camera.setTarget(B.Vector3.Zero());this.camera.mode=B.Camera.ORTHOGRAPHIC_CAMERA;
   const light=new B.HemisphericLight('sky',new B.Vector3(-.4,1,1),this.scene);light.intensity=.83;light.groundColor=new B.Color3(.45,.45,.43);
   const sun=new B.DirectionalLight('sun',new B.Vector3(.5,-.7,-1),this.scene);sun.position=new B.Vector3(-800,1000,2000);sun.intensity=.45;
  }catch(error){this.engine=null;this.ctx=canvas.getContext('2d',{alpha:true});if(!this.ctx){const replacement=canvas.cloneNode(false);canvas.parentNode.replaceChild(replacement,canvas);this.canvas=replacement;this.ctx=replacement.getContext('2d',{alpha:true});}if(!this.ctx)throw error;}
  this.canvas.dataset.renderer=this.engine?'webgl':'canvas2d';this.build();this.loadStoneMaterial();
  this.onLost=event=>{event.preventDefault();this.switchToCanvas();};this.canvas.addEventListener('webglcontextlost',this.onLost);
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.canvas);this.resize();
 }
 vec(x,y,z){return new B.Vector3(x-W/2,H/2-y,z);}
 texture(image){if(!this.engine||!image)return null;if(this.textureCache.has(image))return this.textureCache.get(image);const tex=new B.DynamicTexture('surface',{width:image.width,height:image.height},this.scene,false);tex.getContext().drawImage(image,0,0);tex.hasAlpha=true;tex.update(true);this.textureCache.set(image,tex);return tex;}
 loadStoneMaterial(){const image=new Image();image.onload=()=>{if(this.disposed)return;const surface=this.maps.stone.image,ctx=surface.getContext('2d');ctx.drawImage(image,0,0,surface.width,surface.height);const tex=this.textureCache.get(surface);if(this.engine&&tex){tex.getContext().drawImage(surface,0,0);tex.update(true);}this.render();};image.src='./assets/limestone-material.jpg';}
 mat(color,map,transparent=false){
  if(!this.engine)return null;if(map&&!this.mapIds.has(map))this.mapIds.set(map,++this.nextMapId);const key=color+':'+(map?this.mapIds.get(map):'')+':'+transparent;
  if(this.matCache.has(key))return this.matCache.get(key);
  const m=new B.StandardMaterial('material',this.scene);m.diffuseColor=B.Color3.FromHexString(color);m.specularColor=new B.Color3(.07,.07,.07);m.backFaceCulling=false;
  if(map){m.diffuseTexture=this.texture(map);m.useAlphaFromDiffuseTexture=transparent;m.diffuseTexture.hasAlpha=transparent;}
  if(transparent){m.transparencyMode=B.StandardMaterial.MATERIAL_ALPHABLEND;m.disableDepthWrite=true;}
  this.matCache.set(key,m);return m;
 }
 box(x,y,w,h,depth,z,color,map){
  if(this.engine){const mesh=B.MeshBuilder.CreateBox('stone',{width:w,height:h,depth},this.scene);mesh.position=this.vec(x+w/2,y+h/2,z);mesh.material=this.mat(color,map);this.staticMeshes.push(mesh);}
  this.records.push({kind:'rect',x,y,w,h,z,color,map});
 }
 plane(x,y,w,h,z,image){
  if(this.engine){const mesh=B.MeshBuilder.CreatePlane('paint',{width:w,height:h,sideOrientation:B.Mesh.DOUBLESIDE},this.scene);mesh.position=this.vec(x+w/2,y+h/2,z);mesh.material=this.mat('#ffffff',image,true);}
  this.records.push({kind:'image',x,y,w,h,z,image});
 }
 line(points,color,width,z){
  if(this.engine){for(let i=1;i<points.length;i++){const [x1,y1]=points[i-1],[x2,y2]=points[i],dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy);const mesh=B.MeshBuilder.CreateBox('iron',{width:length,height:width,depth:width},this.scene);mesh.position=this.vec((x1+x2)/2,(y1+y2)/2,z);mesh.rotation.z=-Math.atan2(dy,dx);mesh.material=this.mat(color);this.staticMeshes.push(mesh);}}
  this.records.push({kind:'line',points,color,width,z});
 }
 circle(x,y,rx,ry,z,color){
  if(this.engine){const mesh=B.MeshBuilder.CreateDisc('detail',{radius:1,tessellation:18,sideOrientation:B.Mesh.DOUBLESIDE},this.scene);mesh.scaling=new B.Vector3(rx,ry,1);mesh.position=this.vec(x,y,z);mesh.material=this.mat(color);this.staticMeshes.push(mesh);}
  this.records.push({kind:'ellipse',x,y,rx,ry,z,color});
 }
 masonry(){
  const stone=this.maps.stone.image;
  // Open masonry leaves the video aperture empty behind the articulated shutter.
  for(const [x,y,w,h] of [[-4000,0,9240,689],[-4000,689,4243,474],[999,689,4241,474],[-4000,1163,9240,88]])this.box(x,y,w,h,24,-100,'#c9c2b1');
  // Dressed ashlar: alternating blocks, recessed joints and irregular highlights.
  for(let row=0;row<13;row++){
   const y=row*48;this.box(-4000,y,9240,2,4,-77,'#aaa496');
   for(let col=-4;col<=12;col++){const x=col*155+(row%2)*77;this.box(x+3,y+4,149,42,2,-70,'#e7dfcd',stone);}
  }
  for(let row=14;row<24;row++){const y=row*48;for(let col=-4;col<=12;col++){const x=col*155+(row%2)*77;if(x+152<=243||x+3>=999)this.box(x+3,y+4,149,42,2,-70,'#e7dfcd',stone);}}
  // Storey divisions, cornices, mouldings and a carved sill course.
  for(const [y,h,d,c] of [[9,9,16,'#e2dbca'],[22,6,10,'#aaa597'],[284,5,12,'#a9a395'],[290,12,22,'#e4ddcc'],[303,5,27,'#c0b9a8'],[315,11,15,'#d9d1bf'],[448,6,15,'#a9a395'],[456,15,29,'#e1dbc9'],[473,5,22,'#b5ad9c'],[587,8,18,'#dad1bd'],[599,5,24,'#a59c8d']])this.box(-2500,y,6240,h,d,-43,c);
  for(let x=-80;x<1350;x+=78){this.box(x,317,53,11,8,-27,'#c3bba9');this.box(x+5,320,43,3,4,-21,'#e2d9c4');}
 }
 windowBay(x,y,w=190,h=252){
  // Deep reveal, timber frames, glazing and articulated shutters.
  this.box(x-13,y-13,w+26,h+29,19,-30,'#a69f90');this.box(x-8,y-8,w+16,h+17,16,-14,'#e3dece');
  this.box(x,y,w,h,12,-2,'#777f7c');this.box(x+8,y+7,w-16,h-16,6,5,'#9ba8a5');
  this.box(x+10,y+9,w/2-15,h-22,3,10,'#8e9c9a');this.box(x+w/2+5,y+9,w/2-15,h-22,3,10,'#a7b2ad');
  this.plane(x+10,y+9,w-20,h-22,14,glassTexture().image);
  for(const yy of [y+h*.34,y+h*.68])this.box(x+6,yy,w-12,5,5,16,'#dddccd');
  this.box(x+w/2-4,y+4,8,h-8,9,18,'#e4e0d0');this.box(x+6,y+4,5,h-8,9,18,'#d5d2c4');this.box(x+w-11,y+4,5,h-8,9,18,'#d5d2c4');
  // Stone architraves, side relief and projecting sill.
  this.box(x-18,y-20,w+36,11,17,12,'#e0dac9');this.box(x-11,y-29,w+22,8,22,18,'#c2bba9');
  this.box(x-18,y-10,9,h+20,14,12,'#d8d1bf');this.box(x+w+9,y-10,9,h+20,14,12,'#d8d1bf');
  this.box(x-21,y+h,w+42,9,20,22,'#e8e1cf');this.box(x-16,y+h+9,w+32,6,12,16,'#a9a395');
  this.box(x+w/2-11,y-34,22,25,22,25,'#e7deca');this.box(x+w/2-6,y-31,12,17,12,38,'#c9bfae');
  // A real balcony: projecting stone, uprights, curved wrought iron scrolls.
  const by=y+h-47;this.box(x-24,by+59,w+48,11,38,32,'#d6cfbe');this.box(x-22,by+69,w+44,6,26,38,'#a9a393');
  this.box(x-19,by,w+38,6,8,57,'#303533');this.box(x-19,by+52,w+38,5,8,57,'#303533');
  for(let j=0;j<=8;j++){const xx=x-13+j*(w+26)/8;this.box(xx,by+4,3,48,5,58,'#303633');this.circle(xx+1,by+5,3,3,62,'#333936');}
  for(let j=0;j<4;j++){const cx=x+15+j*(w-30)/3;this.line([[cx-16,by+27],[cx-10,by+13],[cx,by+9],[cx+10,by+13],[cx+16,by+27],[cx+10,by+39],[cx,by+43],[cx-10,by+39],[cx-16,by+27]],'#303633',2,62);this.circle(cx,by+26,3,3,64,'#343a38');}
 }
 windows(){
  this.windowBay(242,35,200,233);this.windowBay(520,35,200,233);this.windowBay(798,35,200,233);
  // Stone pilasters with capitals, shallow fluting and brackets.
  for(const x of [195,455,735,1010]){
   this.box(x,35,20,239,15,-16,'#d4cdbb');this.box(x+4,46,3,218,7,-3,'#e4ddcb');this.box(x+13,46,2,218,7,-3,'#b5ae9e');
   this.box(x-5,27,30,12,18,4,'#e7dfcd');this.box(x-4,264,28,10,18,5,'#d8d0be');
  }
 }
 door(){
  this.box(6,526,183,639,38,-15,'#8f8677');this.box(13,541,165,612,26,2,'#4c3024');this.box(22,551,147,590,14,17,'#704733');
  this.box(29,558,133,576,8,26,'#573827');
  for(const [x,y,w,h] of [[36,568,120,170],[36,752,120,174],[36,942,120,180]]){
   this.box(x,y,w,h,7,32,'#3d2b22');this.box(x+5,y+5,w-10,h-10,6,38,'#906548');this.box(x+12,y+12,w-24,h-24,5,42,'#65442f');
   this.line([[x+13,y+13],[x+w-13,y+13],[x+w-13,y+h-13],[x+13,y+h-13],[x+13,y+13]],'#b48b69',2,48);
  }
  this.circle(58,953,12,12,54,'#a88c58');this.circle(58,953,6,6,57,'#dbc78a');
  this.box(0,522,19,641,24,20,'#ddd5c4');this.box(178,522,17,641,24,20,'#dfd7c6');this.box(0,511,196,17,27,25,'#e5decd');
  for(let y=552;y<1080;y+=75){this.box(179,y,14,3,6,37,'#aaa290');this.box(2,y,14,3,6,37,'#aaa290');}
 }
 storefront(){
  // Plain stone fascia replaces the commercial sign; a small shadow marks the awning housing.
  this.box(185,493,877,113,28,-16,'#d4ccba');
  this.box(188,497,871,4,12,8,'#e9e1ce');this.box(188,596,871,5,14,8,'#aaa293');
  this.box(198,682,44,481,25,7,'#ded9ca');this.box(999,682,48,481,25,7,'#ddd8c9');
  this.box(229,689,14,474,16,40,'#313b3a');this.box(233,691,5,469,8,51,'#7a8581');this.box(999,689,13,474,16,40,'#333b39');this.box(1001,691,4,469,8,51,'#7e8781');
  for(let i=0;i<8;i++){this.circle(236,703+i*59,1.4,1.4,60,'#4c5552');this.circle(1004,703+i*59,1.4,1.4,60,'#4c5552');}
  this.plane(201,800,35,355,42,columnTexture().image);this.plane(1009,800,29,355,42,columnTexture().image);
 }
 awning(){
  const x=190,y=609,w=871,h=78,n=64,rows=5,positions=[],uv=[],indices=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=n;i++){const v=j/rows,xx=x+w*i/n,yy=y+h*v+(Math.sin(i*.47)*1.4+Math.sin(i*1.33)*.5)*v,z=80+v*35+Math.sin(i*.78+v*.8)*2.5;positions.push(xx-W/2,H/2-yy,z);uv.push(i/n,1-v);}
  for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+1,c=a+n+1,d=c+1;indices.push(a,c,b,b,c,d);}
  if(this.engine){const mesh=new B.Mesh('fabric',this.scene),data=new B.VertexData();data.positions=positions;data.indices=indices;data.uvs=uv;data.normals=[];B.VertexData.ComputeNormals(positions,indices,data.normals);data.applyToMesh(mesh);mesh.material=this.mat('#ffffff',this.maps.fabric.image);}
  this.records.push({kind:'image',x,y,w,h,z:100,image:this.maps.fabric.image});this.box(186,598,879,12,18,98,'#ded4c5');this.box(190,685,871,5,9,119,'#a9091a');
  for(const offset of [96,215,342,470,597,728,821]){this.line([[x+offset,y+4],[x+offset+3,y+72]],'#ad1622',1,121);this.line([[x+offset+2,y+4],[x+offset+5,y+72]],'#db3540',.7,122);}
 }
 ground(){
  this.box(-4000,1163,9240,100,20,0,'#858786');this.box(188,1160,875,13,15,20,'#ada99e');this.box(188,1173,875,4,7,30,'#666c69');
  for(let x=200;x<1060;x+=130)this.box(x,1162,2,18,3,32,'#737874');
  this.circle(453,1229,90,19,30,'#59615f');this.circle(453,1229,76,15,32,'#777d79');this.circle(453,1229,5,2,34,'#555d59');
  this.box(460,1169,108,26,4,32,'#485251');this.line([[0,1224],[90,1220],[170,1224]],'#a6a59e',1,32);
 }
 shutter(){
  this.records.push({kind:'blades',z:61});const pitch=OPEN.height/BLADES;
  for(let i=0;i<BLADES;i++){
   if(this.engine){
    const group=new B.TransformNode('slat',this.scene),positions=[],uv=[],indices=[],n=24,rows=8;
    for(let j=0;j<=rows;j++)for(let k=0;k<=n;k++){const x=k/n,v=j/rows,profile=2.2*Math.sin(Math.PI*v)+2.1*Math.exp(-(((v-.16)/.1)**2))-2*Math.exp(-(((v-.93)/.045)**2));const dent=i===9?-5*Math.exp(-(((x-.74)/.12)**2))*Math.sin(Math.PI*v)**2:i===20?3.8*Math.exp(-(((x-.2)/.1)**2))*Math.sin(Math.PI*v)**2:0;positions.push((x-.5)*OPEN.width,(.5-v)*pitch,profile+dent);uv.push(x,1-(i+v)/BLADES);}
    for(let j=0;j<rows;j++)for(let k=0;k<n;k++){const a=j*(n+1)+k,b=a+1,c=a+n+1,d=c+1;indices.push(a,c,b,b,c,d);}
    const metal=new B.Mesh('metal',this.scene),data=new B.VertexData();data.positions=positions;data.indices=indices;data.uvs=uv;data.normals=[];B.VertexData.ComputeNormals(positions,indices,data.normals);data.applyToMesh(metal);metal.parent=group;metal.material=this.mat(i<4?'#414b49':'#e3e8e3',this.maps.steel.image);
    const ink=metal.clone('pigment');ink.parent=group;ink.position.z=.6;ink.material=this.mat('#ffffff',this.paintCanvas,true);ink.renderingGroupId=1;
    const lip=B.MeshBuilder.CreateBox('lip',{width:OPEN.width,height:i===BLADES-1?4:1.3,depth:2},this.scene);lip.parent=group;lip.position.y=-pitch/2;lip.position.z=1;lip.material=this.mat('#4b5755');
    if(i===BLADES-1){for(const [dx,dy,w,h] of [[0,-2,31,2],[-14,0,2,7],[14,0,2,7]]){const handle=B.MeshBuilder.CreateBox('handle',{width:w,height:h,depth:3},this.scene);handle.parent=group;handle.position=new B.Vector3(dx,dy,7);handle.material=this.mat('#586461');}}
    this.blades.push(group);
   }else this.blades.push(null);
  }
 }
 build(){this.masonry();this.windows();this.door();this.storefront();this.shutter();this.awning();this.ground();this.records.sort((a,b)=>a.z-b.z);this.updateBlades();}
 updateBlades(){for(let i=0;i<this.blades.length;i++){const part=this.blades[i];if(!part)continue;const p=bladePlacement(i,this.progress);part.setEnabled(p.visible);part.position=this.vec(OPEN.x+OPEN.width/2,p.y,62-p.fold*17);part.scaling.y=p.height/p.pitch;part.rotation.x=-p.fold*.18;}}
 setProgress(progress){this.progress=clamp(progress,0,1);this.canvas.dataset.shutterPosition=this.progress.toFixed(4);this.updateBlades();this.render();}
 resize(){const rect=this.canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;this.width=rect.width;this.height=rect.height;const viewWidth=H*rect.width/rect.height;Object.assign(this.window.style,{left:`${(viewWidth/2+OPEN.x-W/2)/viewWidth*100}%`,top:`${OPEN.y/H*100}%`,width:`${OPEN.width/viewWidth*100}%`,height:`${OPEN.height/H*100}%`});if(this.engine){this.camera.orthoLeft=viewWidth/2;this.camera.orthoRight=-viewWidth/2;this.camera.orthoTop=H/2;this.camera.orthoBottom=-H/2;this.engine.setHardwareScalingLevel(1/Math.min(devicePixelRatio||1,1.5));this.engine.resize();}else{const d=Math.min(devicePixelRatio||1,1.5);this.canvas.width=Math.round(rect.width*d);this.canvas.height=Math.round(rect.height*d);}this.render();}
 render(){if(this.disposed||!this.width)return;if(this.engine)this.scene.render();else this.drawCanvas();}
 switchToCanvas(){if(this.disposed||!this.engine)return;const old=this.canvas,replacement=old.cloneNode(false);old.parentNode.replaceChild(replacement,old);this.observer.disconnect();this.scene.dispose();this.engine.dispose();this.engine=null;this.canvas=replacement;this.ctx=replacement.getContext('2d',{alpha:true});replacement.dataset.renderer='canvas2d';replacement.dataset.shutterPosition=this.progress.toFixed(4);this.observer.observe(replacement);this.resize();}
 drawCanvas(){const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height,scale=h/H,ox=(w-W*scale)/2;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);ctx.setTransform(scale,0,0,scale,ox,0);for(const item of this.records){
  if(item.kind==='rect'){ctx.fillStyle=item.color;ctx.fillRect(item.x,item.y,item.w,item.h);if(item.map){ctx.globalAlpha=.25;ctx.drawImage(item.map,item.x,item.y,item.w,item.h);ctx.globalAlpha=1;}}
  else if(item.kind==='image'){ctx.drawImage(item.image,item.x,item.y,item.w,item.h);}
  else if(item.kind==='line'){ctx.strokeStyle=item.color;ctx.lineWidth=item.width;ctx.beginPath();item.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
  else if(item.kind==='ellipse'){ctx.fillStyle=item.color;ctx.beginPath();ctx.ellipse(item.x,item.y,item.rx,item.ry,0,0,Math.PI*2);ctx.fill();}
  else if(item.kind==='blades'){for(let i=BLADES-1;i>=0;i--){const p=bladePlacement(i,this.progress);if(!p.visible)continue;const y=p.y-p.height/2;ctx.drawImage(this.maps.steel.image,OPEN.x,y,OPEN.width,p.height+.7);if(i<4){ctx.fillStyle='#161d1dd0';ctx.fillRect(OPEN.x,y,OPEN.width,p.height+.5);}ctx.drawImage(this.paintCanvas,0,i*this.paintCanvas.height/BLADES,this.paintCanvas.width,this.paintCanvas.height/BLADES,OPEN.x,y,OPEN.width,p.height+.3);ctx.fillStyle='#3e4a4c';ctx.fillRect(OPEN.x,y+p.height-1,OPEN.width,1.1);}}
 }}
 dispose(){this.disposed=true;this.observer.disconnect();this.canvas.removeEventListener('webglcontextlost',this.onLost);this.scene?.dispose();this.engine?.dispose();}
}
