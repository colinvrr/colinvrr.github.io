import {FACADES} from './facade-layout.mjs';
// Perspective sees slightly above the former y=0 cut. Continue the real walls
// above the crop instead of leaving the surface's grey background exposed.
export function buildUpperFacades(s){
 const berlin=s.place?.theme==='berlin',stone=s.maps.stone.image;
 for(const [name,bounds]of Object.entries(FACADES)){
  const {x,width}=bounds,color=berlin?'#80604f':name==='brick'?'#935a44':name==='deco'?'#c6c8bb':'#ded8ca';
  const backX=name==='brick'?-6000:x,backRight=name==='deco'?7000:x+width;
  s.box(backX,-240,backRight-backX,250,64,-80,color,stone,'stone',.8);
  const pitch=berlin||name==='brick'?57:176,height=berlin||name==='brick'?23:48;
  for(let row=0;row<Math.ceil(240/height);row++)for(let xx=x;xx<x+width;xx+=pitch){
   const offset=row%2?pitch/2:0,left=Math.max(x,xx-offset),right=Math.min(x+width,xx+pitch-offset-1.2);
   if(right>left)s.box(left,-height*(row+1),right-left,height-1.2,20,-47,color,stone,'stone',.55);
  }
 }
}
