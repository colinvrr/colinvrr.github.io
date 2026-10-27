// One shared set of bounds drives walls, window axes and separating piers.
export const FACADES={
 brick:{x:-1100,width:1055},
 haussmann:{x:-45,width:1160},
 deco:{x:1115,width:1125}
};
export function centeredBays({x,width},count,bayWidth){
 const pitch=width/count;
 return Array.from({length:count},(_,i)=>x+(i+.5)*pitch-bayWidth/2);
}
export function framedBays({x,width},count,bayWidth,pierWidth){
 const pitch=(width-pierWidth)/count;
 return {
  piers:Array.from({length:count+1},(_,i)=>x+i*pitch),
  windows:Array.from({length:count},(_,i)=>x+pierWidth+i*pitch+(pitch-pierWidth-bayWidth)/2)
 };
}
