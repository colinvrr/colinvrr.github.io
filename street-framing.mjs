// Viewport-based framing: a phone sees the neighbouring facades while the
// established desktop camera keeps its original lens and eye position.
export function streetFraming({berlin=false,width,height,engine=true}){
 const mobile=width<=760;
 const fov=berlin&&engine&&!mobile?.35:.43;
 const offset=berlin&&engine&&!mobile?200:0;
 const zoom=mobile?.48:Math.tan(.43/2)/Math.tan(fov/2);
 const windowZoom=mobile?.96:zoom;
 const centerX=mobile?580:620;
 const windowOffsetX=mobile&&!berlin?-15:0;
 return {fov,offset,zoom,windowZoom,centerX,windowOffsetX,mobile,portrait:width<height};
}
