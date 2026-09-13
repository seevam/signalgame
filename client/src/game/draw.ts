import type {GameWorld} from './world';
export type SpriteAssets = { finn: HTMLCanvasElement | null; guard: HTMLCanvasElement | null; finnWalk: HTMLCanvasElement[]; guardWalk: HTMLCanvasElement[]; finnJump: HTMLCanvasElement|null; finnLand: HTMLCanvasElement|null; finnCrouch: HTMLCanvasElement|null; finnHide: HTMLCanvasElement|null; guardAlert: HTMLCanvasElement|null; props: (HTMLCanvasElement|null)[] };
const C={void:'#12141d',floor:'#2d3250',wall:'#414868',prop:'#565f89',finn:'#bb9af7',alarm:'#f7768e',safe:'#9ece6a',gold:'#e0af68',glass:'#7aa2f7',paper:'#d5dae8'};
function rect(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,fill:string){c.fillStyle=fill;c.fillRect(x,y,w,h)}
function txt(c:CanvasRenderingContext2D,s:string,x:number,y:number,size=14,fill=C.paper){c.fillStyle=fill;c.font=`${size}px ui-monospace,monospace`;c.fillText(s,x,y)}
function drawSprite(c:CanvasRenderingContext2D,sprite:HTMLCanvasElement|null,x:number,y:number,w:number,h:number,flip=false){
  if(!sprite) return false;
  c.save();
  if(flip){c.translate(x+w,y);c.scale(-1,1);c.drawImage(sprite,0,0,w,h);}else c.drawImage(sprite,x,y,w,h);
  c.restore();
  return true;
}
export function drawScene(c:CanvasRenderingContext2D,w:GameWorld,sprites:SpriteAssets={finn:null,guard:null,finnWalk:[],guardWalk:[],finnJump:null,finnLand:null,finnCrouch:null,finnHide:null,guardAlert:null,props:[]} ){
  const {width:W,height:H}=w; c.imageSmoothingEnabled=false; rect(c,0,0,W,H,C.void);
  rect(c,0,110,W,300,C.wall); rect(c,0,410,W,130,C.floor);
  for(let x=0;x<W;x+=32){rect(c,x,412,1,128,'#252a42'); if(x%64===0) rect(c,x,440,32,1,'#3a4163');}
  for(let x=72;x<W;x+=220){rect(c,x,126,86,5,'#7aa2f7');rect(c,x+8,131,70,2,'#b8d8ff');const light=c.createLinearGradient(x+43,133,x+43,410);light.addColorStop(0,'rgba(122,162,247,.16)');light.addColorStop(.42,'rgba(122,162,247,.055)');light.addColorStop(1,'rgba(122,162,247,0)');c.fillStyle=light;c.fillRect(x-20,133,126,277);}
  rect(c,0,148,W,2,'#262c47');
  // Reception desk safe area
  rect(c,34,304,176,104,'#23283f');rect(c,34,304,176,8,C.prop);rect(c,34,398,176,10,'#171a29');txt(c,'RECEPTION',70,355,16,'#7b86b2');rect(c,78,287,42,18,'#343c5d');
  // waiting chairs
  for(let x=270;x<430;x+=52){rect(c,x,346,38,8,C.prop);rect(c,x+4,326,30,24,C.prop);rect(c,x+7,330,24,16,'#68749d');rect(c,x+6,354,5,30,'#20263d');rect(c,x+28,354,5,30,'#20263d');}
  // plant + carts + lockers
  rect(c,220,348,16,48,C.prop);rect(c,214,340,28,10,C.safe);rect(c,208,329,16,18,C.safe);rect(c,225,322,13,26,C.safe);
  for(const x of [492,520]){rect(c,x,332,22,66,C.prop);rect(c,x+4,340,14,4,'#8a96bc');rect(c,x+4,354,14,4,'#8a96bc');}
  for(const x of [820,850]){rect(c,x,292,25,106,'#343c5d');rect(c,x+4,305,17,3,'#8793b8');rect(c,x+4,320,17,3,'#8793b8');}
  if(sprites.props[0]) c.drawImage(sprites.props[0],808,289,32,109);
  // door
  rect(c,888,268,50,140,'#22273e');rect(c,895,277,36,122,'#3d466b');txt(c,'EAST',899,305,10,C.paper);txt(c,'WING',899,319,10,C.paper);rect(c,924,338,3,5,C.gold);if(sprites.props[1]) c.drawImage(sprites.props[1],888,268,50,140);
  // hide shadows
  rect(c,20,370,175,40,'#171a29');rect(c,330,372,82,38,'#1b2032');rect(c,835,370,88,40,'#171a29');
  // Ceiling camera: a slow mechanical sweep that invalidates waist-high cover.
  const camX=690, camY=148, sweep=Math.sin(w.time*2*Math.PI/6.2)*0.72; c.save();c.globalAlpha=.15;c.fillStyle=C.glass;c.beginPath();c.moveTo(camX,camY+8);c.lineTo(camX+Math.sin(sweep-.18)*250,410);c.lineTo(camX+Math.sin(sweep+.18)*250,410);c.closePath();c.fill();c.restore();rect(c,camX-13,camY-4,26,12,'#252d49');rect(c,camX-7,camY+8,14,6,'#6474a2');rect(c,camX-3+Math.round(sweep*6),camY+10,6,4,C.alarm);txt(c,'CAM',camX-15,136,9,C.glass);
  for(const zone of [{x:40,w:170,label:'DESK SAFE'},{x:470,w:82,label:'CART SAFE'},{x:800,w:78,label:'LOCKER SAFE'}]){c.save();c.globalAlpha=w.cameraSafeZoneName()===zone.label.replace(' SAFE','').replace('DESK','RECEPTION DESK').replace('CART','CART SHADOW').replace('LOCKER','LOCKER POCKET')?.toString()?0.28:0.1;c.strokeStyle=C.safe;c.setLineDash([3,3]);c.strokeRect(zone.x,365,zone.w,42);c.restore();txt(c,zone.label,zone.x+4,401,8,C.safe);}
  // one-use signal jammer console
  rect(c,688,326,32,70,w.jammerUsed?'#303750':C.prop); rect(c,694,336,20,16,w.interference>0?C.safe:'#7aa2f7'); rect(c,700,357,8,28,w.interference>0?C.safe:'#252b40');
  txt(c,w.jammerUsed?(w.interference>0?'JAM':'OFF'):'JAM',689,316,8,w.interference>0?C.safe:C.glass);
  if(w.nearJammer() && !w.jammerUsed) txt(c,'Q  JAM CAMERA',651,426,10,C.gold);
  // guard patrol route and jammer investigation target
  c.save();c.globalAlpha=.32;c.strokeStyle=w.guard.state==='investigate'?C.gold:C.glass;c.setLineDash([8,8]);c.beginPath();c.moveTo(545,404);c.lineTo(870,404);c.stroke();c.restore();
  if(w.guard.state==='investigate'){c.save();c.globalAlpha=.75;c.strokeStyle=C.gold;c.setLineDash([3,4]);c.beginPath();c.moveTo(w.guard.x,382);c.lineTo(704,382);c.stroke();c.restore();txt(c,'INVESTIGATE',w.guard.x-31,286,9,C.gold);}
  // guard cone
  const gx=w.guard.x, dir=w.guard.dir; c.save();c.globalAlpha=w.guard.state==='alert'?.32:.18;c.fillStyle=C.alarm;c.beginPath();c.moveTo(gx,355);c.lineTo(gx+dir*250,290);c.lineTo(gx+dir*250,415);c.closePath();c.fill();c.restore();
  // Generated guard sprite replaces the placeholder body; the alert label remains readable.
  const guardFrame=w.guard.state==='alert'?(sprites.guardAlert||sprites.guardWalk[0]):(sprites.guardWalk.length&&Math.floor(w.time*8)%2===1?sprites.guardWalk[1]:sprites.guardWalk[0]); const guardDrawn=drawSprite(c,guardFrame||sprites.guard,gx-24,w.floorY-94,48,94,w.guard.dir<0); if(!guardDrawn){rect(c,gx-9,336,18,30,'#20283c');rect(c,gx-12,326,24,15,'#293652');rect(c,gx-8,318,16,12,'#b3a08d');rect(c,gx-14,364,7,28,'#20283c');rect(c,gx+7,364,7,28,'#20283c');rect(c,gx-18,390,12,5,C.alarm);rect(c,gx+8,390,12,5,C.alarm);}if(w.guard.state==='alert'){c.save();c.globalAlpha=.24;c.fillStyle=C.alarm;c.fillRect(gx-30,300,60,100);c.restore();}txt(c,w.guard.state==='alert'?'!':w.guard.state==='investigate'?'?':'SEC',gx-13,296,10,w.guard.state==='alert'?C.alarm:w.guard.state==='investigate'?C.gold:C.paper);
  // player
  if(!w.player.hidden){const px=w.player.x;const jumping=w.player.y<366;const playerFrame=jumping?(sprites.finnJump||sprites.finn):w.player.landingTimer>0?(sprites.finnLand||sprites.finn):w.player.crouching?(sprites.finnCrouch||sprites.finn): (sprites.finnWalk.length&&Math.floor(w.time*9)%2===1?sprites.finnWalk[1]:sprites.finnWalk[0]);const playerH=w.player.crouching?72:94;const playerDrawn=drawSprite(c,playerFrame||sprites.finn,px-25,w.floorY-playerH-(366-w.player.y),50,playerH,w.player.facing<0);if(jumping||w.player.landingTimer>0){c.save();c.globalAlpha=.24;c.fillStyle=C.finn;c.fillRect(px-22,w.floorY-3,44,3);c.restore();}if(!playerDrawn){rect(c,px-9,w.player.y-28,18,28,'#252b40');rect(c,px-11,w.player.y-40,22,16,C.finn);rect(c,px-8,w.player.y-49,16,12,'#bca9a0');rect(c,px-13,w.player.y-1,9,5,C.finn);rect(c,px+4,w.player.y-1,9,5,C.finn);}}
  else {const hiddenFrame=sprites.finnHide||sprites.finnWalk[0]||sprites.finn;c.save();c.globalAlpha=.9;drawSprite(c,hiddenFrame,w.player.x-25,w.floorY-72,50,72,w.player.facing<0);c.restore();txt(c,'HIDDEN',w.player.x-24,w.player.y-24,9,C.safe);}
  // pickups
  for(const p of w.pickups) if(!p.taken){const prop=sprites.props[p.kind==='key'?3:2];if(prop)c.drawImage(prop,p.x-12,p.y-15,24,30);else {rect(c,p.x-9,p.y-7,18,14,p.kind==='key'?C.gold:C.paper);rect(c,p.x-5,p.y-4,10,2,p.kind==='key'?'#72522b':'#7aa2f7');rect(c,p.x-5,p.y,p.kind==='key'?4:10,2,p.kind==='key'?'#72522b':'#a4b4d9');}}
  // vignette + scanline
  c.save();const g=c.createRadialGradient(W/2,285,120,W/2,285,540);g.addColorStop(0,'transparent');g.addColorStop(1,'rgba(0,0,0,.45)');c.fillStyle=g;c.fillRect(0,0,W,H);c.globalAlpha=.06;for(let y=0;y<H;y+=4)rect(c,0,y,W,1,'#fff');c.restore();
}
export function drawTitle(c:CanvasRenderingContext2D,w:GameWorld){rect(c,0,0,w.width,w.height,C.void);rect(c,0,0,w.width,w.height,'#171b2a');for(let i=0;i<12;i++)rect(c,80+i*70,130+(i%3)*55,42,2,'#293351');txt(c,'◈ SIGNAL',110,195,56,C.paper);txt(c,'SAINT CROSS HOSPITAL / GROUND FLOOR',115,230,15,C.glass);txt(c,'A stealth horror vertical slice',115,274,18,C.finn);txt(c,'ENTER  BEGIN INVESTIGATION',115,352,18,C.gold);txt(c,'A / D  MOVE     SHIFT  RUN     SPACE  JUMP     E  HIDE     J  JOURNAL     M  MUTE',115,438,12,C.paper);}
