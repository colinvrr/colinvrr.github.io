// Dimensions in sheet-metal coordinates, independent of the display's size.
export const SIZE=1200, BLADES=20, BAR=40, PITCH=(SIZE-BAR)/BLADES;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const gaussian=(x,c,w)=>Math.exp(-(((x-c)/w)**2));
const noise=(x,y,seed=0)=>{const a=Math.sin(x*127.1+y*311.7+seed*74.7)*43758.5453;return a-Math.floor(a);};

// A continuous curtain follows a vertical guide, then bends around the take-up
// drum. Each cross-section has its own tangent; the frame never translates.
export function guidePosition(s) {
  const tangent=43, radius=44;
  if(s>=tangent)return {y:s,light:1};
  const angle=clamp((tangent-s)/radius,0,Math.PI/2);
  return {y:tangent-radius*Math.sin(angle),light:.58+.42*Math.cos(angle)};
}
export function liftAt(progress) {
  const t=clamp(progress,0,1);
  return (SIZE+60)*(t*t*(3-2*t));
}
function bend(x,i) {
  const u=x/SIZE;
  if(i===6)return 3.5*gaussian(u,.72,.13)-.8*gaussian(u,.37,.2);
  if(i===12)return -2.9*gaussian(u,.22,.09)+.9*gaussian(u,.57,.24);
  if(i===16)return 2.4*gaussian(u,.91,.08);
  return .3*Math.sin(u*5+i*2.4);
}
function depth(x,y,i) {
  // Rolled lip, broad shallow web, return bead and the overlapping hook.
  const v=y/PITCH;
  let z=3.5*gaussian(v,.12,.064)+1.45*gaussian(v,.76,.18)-2.4*gaussian(v,.95,.025);
  z+=.65*Math.sin(v*Math.PI);
  if(i===6)z-=6.1*gaussian(x/SIZE,.72,.105)*gaussian(v,.5,.42);
  if(i===7)z-=1.9*gaussian(x/SIZE,.735,.07)*gaussian(v,.12,.2);
  if(i===12)z+=3.9*gaussian(x/SIZE,.22,.12)*gaussian(v,.54,.43);
  if(i===16)z-=2.8*gaussian(x/SIZE,.91,.06)*gaussian(v,.82,.18);
  // A pair of pressed creases, not a full-width broken seam.
  if(i===6)z-=1.7*gaussian(x/SIZE,.696+v*.035,.0035)*gaussian(v,.48,.28);
  if(i===12)z-=1.2*gaussian(x/SIZE,.243-v*.018,.003)*gaussian(v,.66,.21);
  return z;
}
function scratch(ctx,points,width=1,alpha=.5) {
  ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';
  const path=(offset)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y+offset):ctx.moveTo(x,y+offset));ctx.stroke();};
  ctx.strokeStyle=`rgba(203,204,194,${alpha*.8})`;path(.85);
  ctx.strokeStyle=`rgba(53,55,49,${alpha})`;path(0);
}

export class MetalShutter {
  constructor(canvas,image) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:true});
    this.image=image;this.progress=0;this.target=0;this.textures=[];
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
    this.onImage=()=>this.build();image.addEventListener('load',this.onImage);
    this.observer=new ResizeObserver(()=>this.draw());this.observer.observe(canvas);
    this.onPreference=()=>{if(this.reduced.matches){this.progress=this.target;this.draw();}};
    this.reduced.addEventListener('change',this.onPreference);
    this.build();
  }
  build() {
    const paint=document.createElement('canvas');paint.width=paint.height=SIZE;
    const p=paint.getContext('2d',{willReadFrequently:true});
    if(this.image.complete&&this.image.naturalWidth) {
      const w=SIZE*.96,h=w*this.image.naturalHeight/this.image.naturalWidth;
      p.translate(SIZE*.5,SIZE*.5);p.rotate(parseFloat(this.image.style.getPropertyValue('--tag-rotation')||0)*Math.PI/180);
      p.filter=this.image.style.filter;p.drawImage(this.image,-w/2,-h/2,w,h);
    }
    const ink=p.getImageData(0,0,SIZE,SIZE).data;
    this.textures=[];
    for(let i=0;i<BLADES;i++) {
      const sheet=document.createElement('canvas');sheet.width=SIZE;sheet.height=PITCH+12;
      const ctx=sheet.getContext('2d');const img=ctx.createImageData(sheet.width,sheet.height),pixels=img.data;
      const tone=(noise(i,0)-.5)*5;
      for(let x=0;x<SIZE;x++) {
        const warp=bend(x,i);
        for(let y=0;y<sheet.height;y++) {
          const v=y-5-warp;if(v<0||v>PITCH+1.7)continue;
          const z=depth(x,v,i);
          const nx=-(depth(x+.6,v,i)-depth(x-.6,v,i))/1.2;
          const ny=-(depth(x,v+.3,i)-depth(x,v-.3,i))/.6;
          const norm=Math.hypot(nx,ny,1);
          const diffuse=Math.max(0,(-nx*.3-ny*.65+.7)/norm);
          let light=.65+diffuse*.4;
          // Contact shade where the next rolled return covers this one.
          light*=1-.3*gaussian(v/PITCH,.985,.026);
          const dirt=(gaussian(x,12,17)+gaussian(x,SIZE-11,20))*(.4+.6*gaussian(v/PITCH,.92,.1));
          const recessDust=gaussian(v/PITCH,.91,.035)*(.3+.7*noise(Math.floor(x/8),i));
          const scuff=(i===6?gaussian(x,865,35):i===12?gaussian(x,265,24):i===16?gaussian(x,1096,24):0);
          const edgeWear=gaussian(v/PITCH,.12,.014)*(noise(x,0,i)>.35?1:0)*(.12+.66*scuff);
          const rough=(noise(x,y,i)-.5)*2.4;
          const metal=(156+tone+3*Math.sin(x/SIZE*5+.6))*light-dirt*19-recessDust*6+rough+edgeWear*22;
          // Paint samples are warped with the same blade and lit by the same
          // normal, so pigment turns into the valleys and around the dents.
          const paintY=clamp(Math.floor(i*PITCH+v+(z-1)*.52),0,SIZE-1);
          const k=(paintY*SIZE+x)*4;
          let alpha=ink[k+3]/255*.9;
          alpha*=1-edgeWear*.8;
          if((x<23||x>SIZE-24)&&noise(x,y,i)>.58)alpha*=.35;
          const out=(y*SIZE+x)*4;
          for(let c=0;c<3;c++) {
            const pigment=ink[k+c]*light*.93;
            pixels[out+c]=metal*(1-alpha)+pigment*alpha;
          }
          pixels[out+3]=255;
        }
      }
      ctx.putImageData(img,0,0);
      // Sparse, causal scratches. Most of the web is left untouched.
      if(i===6){scratch(ctx,[[804,28],[823,25],[836,26],[853,24]],1.3,.55);scratch(ctx,[[850,39],[873,38],[882,34]],.7,.5);}
      if(i===12){scratch(ctx,[[244,42],[253,35],[265,33],[279,31]],1,.6);}
      if(i===15)scratch(ctx,[[1028,22],[1051,19],[1076,20],[1106,17]],.8,.35);
      if(i===9)scratch(ctx,[[401,35],[417,34],[423,32]],.65,.38);
      for(const edge of [14,SIZE-16])for(let n=0;n<4;n++) {
        const x=edge+(noise(n,i)-.5)*12;
        scratch(ctx,[[x,10+noise(n,0,i)*17],[x+.8,35+noise(n,1,i)*15]],.5,.22);
      }
      this.textures.push(sheet);
    }
    this.bar=this.makeBar();this.draw();
  }
  makeBar() {
    const bar=document.createElement('canvas');bar.width=SIZE;bar.height=BAR+10;
    const ctx=bar.getContext('2d'),g=ctx.createLinearGradient(0,0,0,BAR);
    [[0,'#64655f'],[.06,'#a5a69e'],[.16,'#93958d'],[.7,'#85877f'],[.84,'#70736a'],[.9,'#a2a49a'],[1,'#45483f']].forEach(([p,c])=>g.addColorStop(p,c));
    ctx.fillStyle=g;ctx.fillRect(0,0,SIZE,BAR);
    // Wear is concentrated around the pull, where fingers and a key scrape.
    for(let j=0;j<85;j++) {
      const x=SIZE*.5+(noise(j,1)-.5)*155,y=12+noise(j,2)*18;
      ctx.fillStyle=`rgba(194,194,180,${noise(j,4)*.28})`;ctx.fillRect(x,y,1+noise(j,3)*8,.7);
    }
    for(const x of [SIZE/2-52,SIZE/2+52]) {
      ctx.fillStyle='#65675f';ctx.fillRect(x-5,11,10,19);
      ctx.fillStyle='#aaa99f';ctx.beginPath();ctx.arc(x,17,2.2,0,Math.PI*2);ctx.fill();
      scratch(ctx,[[x-1.2,17],[x+1.2,17]],.7,.75);
    }
    ctx.lineCap='round';ctx.lineJoin='round';
    const handle=(dy)=>{ctx.beginPath();ctx.moveTo(548,19+dy);ctx.lineTo(548,27+dy);ctx.quadraticCurveTo(548,30+dy,557,30+dy);ctx.lineTo(643,30+dy);ctx.quadraticCurveTo(652,30+dy,652,27+dy);ctx.lineTo(652,19+dy);ctx.stroke();};
    ctx.strokeStyle='#34372f66';ctx.lineWidth=7;handle(3);
    ctx.strokeStyle='#484b41';ctx.lineWidth=6;handle(0);
    ctx.strokeStyle='#adafa3';ctx.lineWidth=2.1;handle(-1.4);
    scratch(ctx,[[472,29],[485,27],[494,29]],.8,.35);
    return bar;
  }
  setOpen(open) {
    this.target=open?1:0;
    if(this.reduced.matches){this.progress=this.target;this.draw();return;}
    if(this.raf)return;
    let last=performance.now();
    const step=now=>{
      const dt=Math.min((now-last)/1000,.05);last=now;
      const direction=Math.sign(this.target-this.progress);
      this.progress=clamp(this.progress+direction*dt/(direction>0?1.95:2.15),0,1);
      this.draw();
      if(Math.abs(this.progress-this.target)>.00001)this.raf=requestAnimationFrame(step);
      else this.raf=0;
    };
    this.raf=requestAnimationFrame(step);
  }
  drawSheet(texture,origin,lift,index) {
    const ctx=this.ctx,motion=Math.sin(this.progress*Math.PI);
    // Sub-pixel take-up in a few joints stays bounded by the hook overlap.
    const slack=motion*(index===7?.75:index===13?-.6:0);
    const y=origin-lift+slack;
    if(y>48){ctx.drawImage(texture,0,y);return;}
    // Narrow cross-sections follow the drum; the blade changes tangent and
    // foreshortens progressively, instead of moving as a rigid square.
    for(let row=0;row<texture.height;row+=2) {
      const a=guidePosition(y+row),b=guidePosition(y+row+2);
      if(b.y<=a.y+.01)continue;
      ctx.drawImage(texture,0,row,SIZE,2,0,a.y,SIZE,b.y-a.y+.25);
      if(a.light<.99){ctx.fillStyle=`rgba(19,21,17,${1-a.light})`;ctx.fillRect(0,a.y,SIZE,b.y-a.y+.25);}
    }
  }
  draw() {
    if(!this.ctx||!this.textures.length)return;
    // Remove the fully retracted overlay from compositing. A transparent canvas
    // covering WebGL can keep a stale backing layer in embedded WebViews.
    const retracted=this.progress>=1&&this.target===1;
    this.canvas.style.display=retracted?'none':'block';
    this.canvas.dataset.position=this.progress.toFixed(4);
    if(retracted)return;
    const rect=this.canvas.getBoundingClientRect();if(!rect.width)return;
    const pixels=Math.round(rect.width*Math.min(window.devicePixelRatio||1,2.5));
    if(this.canvas.width!==pixels){this.canvas.width=this.canvas.height=pixels;}
    const ctx=this.ctx;ctx.setTransform(pixels/SIZE,0,0,pixels/SIZE,0,0);ctx.clearRect(0,0,SIZE,SIZE);
    const lift=liftAt(this.progress);
    // The overlap is drawn bottom-to-top, like the real hooked profiles.
    if(this.bar)this.drawSheet(this.bar,SIZE-BAR,lift,BLADES);
    for(let i=BLADES-1;i>=0;i--)this.drawSheet(this.textures[i],i*PITCH-5,lift,i);
    // Only a narrow guide-channel occlusion; no floating panel shadow.
    const shade=ctx.createLinearGradient(0,0,SIZE,0);
    shade.addColorStop(0,'#15181370');shade.addColorStop(.025,'#15181300');shade.addColorStop(.975,'#15181300');shade.addColorStop(1,'#15181370');
    ctx.globalCompositeOperation='source-atop';ctx.fillStyle=shade;ctx.fillRect(0,0,SIZE,SIZE);ctx.globalCompositeOperation='source-over';
    this.canvas.dataset.position=this.progress.toFixed(4);
  }
  dispose() {
    cancelAnimationFrame(this.raf);this.raf=0;
    this.observer.disconnect();this.image.removeEventListener('load',this.onImage);
    this.reduced.removeEventListener('change',this.onPreference);
  }
}
