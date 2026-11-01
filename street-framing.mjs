// Viewport-based framing: a phone sees the neighbouring facades while the
// established desktop camera keeps its original lens and eye position.
export function streetFraming({berlin=false,width,height,engine=true}){
 const mobile=width<=760;
 const fov=berlin&&engine&&!mobile?.35:.43;
 const offset=berlin&&engine&&!mobile?200:0;
 return {fov,offset,zoom:Math.tan(.43/2)/Math.tan(fov/2),mobile,portrait:width<height};
}
