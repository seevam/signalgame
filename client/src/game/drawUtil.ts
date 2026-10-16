// Draws a character image with its feet on `feetY`, mirrored when facing left.
// Source art faces right, so a negative facing flips it around the character's centre.
export function drawFacing(c:CanvasRenderingContext2D,img:HTMLImageElement|null,centerX:number,feetY:number,w:number,h:number,facing:number){
  if(!img||!img.complete||!img.naturalWidth)return false;
  c.save();c.translate(Math.round(centerX),0);if(facing<0)c.scale(-1,1);c.drawImage(img,-w/2,feetY-h,w,h);c.restore();
  return true;
}
