import type {CorridorWorld} from './corridor';
import {drawFacing} from './drawUtil';
const C={void:'#12141d',floor:'#2d3250',prop:'#565f89',alarm:'#f7768e',safe:'#9ece6a',gold:'#e0af68',glass:'#7aa2f7',paper:'#d5dae8',finn:'#bb9af7'};
function rect(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,f:string){c.fillStyle=f;c.fillRect(x,y,w,h)}function txt(c:CanvasRenderingContext2D,s:string,x:number,y:number,n=12,f=C.paper){c.fillStyle=f;c.font=`${n}px ui-monospace,monospace`;c.fillText(s,x,y)}
export function drawCorridor(c:CanvasRenderingContext2D,w:CorridorWorld,background:HTMLImageElement|null,finn:HTMLImageElement|null,guard:HTMLImageElement|null){
  const W=960,H=540;const cam=w.cameraX;const sx=(x:number)=>x-cam;c.imageSmoothingEnabled=false;rect(c,0,0,W,H,C.void);
  if(background&&background.complete)c.drawImage(background,0,0,W,H);else rect(c,0,110,W,300,'#414868');
  c.fillStyle='rgba(15,18,31,.32)';c.fillRect(0,0,W,H);rect(c,0,410,W,130,'rgba(34,39,63,.68)');
  // hide spots
  for(const s of w.hideSpots){const x=sx(s.x);const inside=w.player.x>=s.x&&w.player.x<=s.x+s.w;const active=inside&&w.player.hidden;c.save();c.shadowColor=C.safe;c.shadowBlur=active?16:0;rect(c,x,368,s.w,42,active?'rgba(20,30,38,.94)':'rgba(23,26,41,.78)');c.restore();c.save();c.strokeStyle=C.safe;c.globalAlpha=inside?.6:.22;c.setLineDash([3,3]);c.strokeRect(x+.5,368.5,s.w-1,41);c.restore();txt(c,s.label,x+2,428,7,inside?C.safe:'#717da6');if(inside&&!w.player.hidden)txt(c,'E  HIDE',x+s.w/2-20,356,9,C.gold);}
  // barriers: 40px tall, jumpable
  for(const b of w.barriers){const x=sx(b.x);rect(c,x,b.top,b.w,410-b.top,C.prop);rect(c,x,b.top,b.w,4,'#8a96bc');for(let y=b.top+10;y<404;y+=10)rect(c,x+3,y,b.w-6,2,'#3d4566');}
  // ceiling camera cone — same geometry the world uses for detection
  const beam=w.cameraBeam();const seeing=w.cameraSeesPlayer();const camX=sx(beam.origin);c.save();c.globalAlpha=seeing?.32:.18;c.fillStyle=seeing?C.alarm:C.glass;c.beginPath();c.moveTo(camX,150);c.lineTo(sx(beam.left),410);c.lineTo(sx(beam.right),410);c.closePath();c.fill();c.restore();rect(c,camX-13,140,26,12,'#252d49');rect(c,camX-3,150,6,4,C.alarm);txt(c,'CAM',camX-14,134,9,C.glass);
  // guards
  for(const g of w.guards){const x=sx(g.x);c.save();c.globalAlpha=g.state==='alert'?.28:.14;c.fillStyle=C.alarm;c.beginPath();c.moveTo(x,355);c.lineTo(x+(g.dir*250),290);c.lineTo(x+(g.dir*250),415);c.closePath();c.fill();c.restore();if(!drawFacing(c,guard,x,w.floorY,50,94,g.dir)){rect(c,x-9,336,18,30,'#20283c');rect(c,x-12,326,24,15,'#293652');}txt(c,g.state==='alert'?'!':'SEC',x-13,298,10,g.state==='alert'?C.alarm:C.paper);}
  // player
  const px=sx(w.player.x);const feet=w.player.y+w.playerHalfHeight;
  const nearBarrier=w.barriers.some(b=>w.player.facing>0?b.x-w.player.x>0&&b.x-w.player.x<90:w.player.x-(b.x+b.w)>0&&w.player.x-(b.x+b.w)<90);
  if(!w.player.hidden&&nearBarrier&&feet>=w.floorY-1)txt(c,'SPACE  JUMP',px-34,feet-106,9,C.gold);
  if(!w.player.hidden){if(!drawFacing(c,finn,px,feet,50,94,w.player.facing)){rect(c,px-9,w.player.y-28,18,28,'#252b40');rect(c,px-11,w.player.y-40,22,16,C.finn);}}else txt(c,'HIDDEN',px-24,360,9,C.safe);
  for(const p of w.pickups)if(!p.taken){const x=sx(p.x);rect(c,x-8,382,16,10,p.kind==='key'?C.gold:C.paper);txt(c,p.kind==='key'?'KEY':'DOC',x-10,374,7,p.kind==='key'?C.gold:C.glass);}
  txt(c,'STAGE 02 / EAST CORRIDOR',18,28,11,C.glass);txt(c,`STEALTH ${Math.round(w.stealth)}%   EVIDENCE ${w.evidenceCount()}/3   WARD KEY ${w.hasKey()?'1/1':'0/1'}`,18,48,11,w.suspicion>70?C.alarm:C.paper);
}
export function drawCorridorTitle(c:CanvasRenderingContext2D,_w:CorridorWorld){rect(c,0,0,960,540,C.void);txt(c,'◈ SIGNAL',110,190,54,C.paper);txt(c,'STAGE 02 / EAST CORRIDOR',115,230,15,C.glass);txt(c,'SOMETHING IS WRONG HERE',115,274,18,C.finn);txt(c,'ENTER  CONTINUE TO THE EAST WING',115,352,16,C.gold);txt(c,'A / D MOVE   SHIFT RUN   SPACE JUMP BARRIERS   E HIDE   J JOURNAL   M MUTE',115,438,11,C.paper);}
