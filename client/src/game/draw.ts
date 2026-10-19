import {CAMERAS,EXIT_X,HALL_SPLIT,JAMMER_X,ROOM_SPLIT,type GameWorld} from './world';
import {drawAwareness,drawWalker,RIGS,FINN_HEIGHT,GUARD_HEIGHT} from './drawUtil';
export type SpriteAssets = { finn: HTMLCanvasElement | null; guard: HTMLCanvasElement | null; finnWalk: HTMLCanvasElement[]; guardWalk: HTMLCanvasElement[]; finnJump: HTMLCanvasElement|null; finnLand: HTMLCanvasElement|null; finnCrouch: HTMLCanvasElement|null; finnHide: HTMLCanvasElement|null; guardAlert: HTMLCanvasElement|null; props: (HTMLCanvasElement|null)[] };
const C={void:'#12141d',floor:'#2d3250',wall:'#414868',prop:'#565f89',finn:'#bb9af7',alarm:'#f7768e',safe:'#9ece6a',gold:'#e0af68',glass:'#7aa2f7',paper:'#d5dae8'};
function rect(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,fill:string){c.fillStyle=fill;c.fillRect(x,y,w,h)}
function txt(c:CanvasRenderingContext2D,s:string,x:number,y:number,size=14,fill=C.paper){c.fillStyle=fill;c.font=`${size}px ui-monospace,monospace`;c.fillText(s,x,y)}
export function drawScene(c:CanvasRenderingContext2D,w:GameWorld,sprites:SpriteAssets={finn:null,guard:null,finnWalk:[],guardWalk:[],finnJump:null,finnLand:null,finnCrouch:null,finnHide:null,guardAlert:null,props:[]} ){
  const W=960,H=540,cam=Math.round(w.cameraX); c.imageSmoothingEnabled=false; rect(c,0,0,W,H,C.void);
  c.save(); c.translate(-cam,0);
  // --- shell: everything below is in level coordinates
  rect(c,cam,110,W,300,C.wall); rect(c,cam,410,W,130,C.floor);
  for(let x=Math.floor(cam/32)*32;x<cam+W+32;x+=32){rect(c,x,412,1,128,'#252a42'); if(x%64===0) rect(c,x,440,32,1,'#3a4163');}
  for(let x=72+Math.floor((cam-72)/220)*220;x<cam+W+220;x+=220){rect(c,x,126,86,5,'#7aa2f7');rect(c,x+8,131,70,2,'#b8d8ff');const light=c.createLinearGradient(x+43,133,x+43,410);light.addColorStop(0,'rgba(122,162,247,.16)');light.addColorStop(.42,'rgba(122,162,247,.055)');light.addColorStop(1,'rgba(122,162,247,0)');c.fillStyle=light;c.fillRect(x-20,133,126,277);}
  rect(c,cam,148,W,2,'#262c47');
  // room dividers
  for(const [x,label] of [[ROOM_SPLIT,'WAITING AREA →'],[HALL_SPLIT,'EAST WING HALL →']] as const){rect(c,x-14,150,28,260,'#2a3049');rect(c,x-10,230,20,180,'#1b2032');txt(c,label,x-58,214,10,C.glass);}
  // --- RECEPTION
  rect(c,34,304,176,104,'#23283f');rect(c,34,304,176,8,C.prop);rect(c,34,398,176,10,'#171a29');txt(c,'RECEPTION',70,355,16,'#7b86b2');rect(c,78,287,42,18,'#343c5d');
  for(let x=270;x<430;x+=52){rect(c,x,346,38,8,C.prop);rect(c,x+4,326,30,24,C.prop);rect(c,x+7,330,24,16,'#68749d');rect(c,x+6,354,5,30,'#20263d');rect(c,x+28,354,5,30,'#20263d');}
  rect(c,220,348,16,48,C.prop);rect(c,214,340,28,10,C.safe);rect(c,208,329,16,18,C.safe);rect(c,225,322,13,26,C.safe);
  for(const x of [492,520]){rect(c,x,332,22,66,C.prop);rect(c,x+4,340,14,4,'#8a96bc');rect(c,x+4,354,14,4,'#8a96bc');}
  for(const x of [820,850,880]){rect(c,x,292,25,106,'#343c5d');rect(c,x+4,305,17,3,'#8793b8');rect(c,x+4,320,17,3,'#8793b8');}
  // --- WAITING AREA
  for(const x0 of [1010,1240,1460,1660])for(let x=x0;x<x0+100;x+=50){rect(c,x,350,38,8,C.prop);rect(c,x+4,330,30,22,C.prop);rect(c,x+6,358,4,40,'#20263d');rect(c,x+28,358,4,40,'#20263d');}
  rect(c,1152,280,56,118,'#3b2f4f');rect(c,1160,292,40,48,'#7aa2f7');for(let y=348;y<388;y+=10)rect(c,1162,y,36,4,'#2a2238');txt(c,'SNACKS',1158,272,8,C.glass);
  rect(c,1374,340,52,50,'#4a5578');rect(c,1374,334,52,8,'#6b789f');rect(c,1378,392,8,8,'#20263d');rect(c,1414,392,8,8,'#20263d');
  rect(c,1556,262,54,146,'#2c3350');rect(c,1580,330,4,10,C.gold);
  rect(c,1772,346,46,44,'#56608a');rect(c,1772,340,46,8,'#c6cde0');rect(c,1776,392,8,8,'#20263d');rect(c,1806,392,8,8,'#20263d');
  // --- EAST WING HALL
  rect(c,2078,356,66,14,'#c6cde0');rect(c,2082,370,6,30,'#6b789f');rect(c,2134,370,6,30,'#6b789f');rect(c,2072,398,78,6,'#3a4163');
  rect(c,2248,250,62,4,'#6b789f');for(let x=2250;x<2310;x+=12)rect(c,x,254,10,150,'#4c6a78');
  const doorOpen=w.hasKey()&&w.evidenceCount()===3;rect(c,EXIT_X,268,52,140,'#22273e');rect(c,EXIT_X+7,277,38,131,doorOpen?'#1f3a33':'#3d466b');txt(c,'EAST',EXIT_X+12,305,10,C.paper);txt(c,'WING',EXIT_X+12,319,10,C.paper);rect(c,EXIT_X+34,334,8,10,doorOpen?C.safe:C.alarm);txt(c,doorOpen?'OPEN':'LOCKED',EXIT_X+(doorOpen?12:6),262,9,doorOpen?C.safe:C.alarm);
  // hide spots, from the world's own list
  for(const s of w.hideSpots){const inside=w.player.x>=s.x&&w.player.x<=s.x+s.w;c.save();c.globalAlpha=inside?.55:.2;c.strokeStyle=C.safe;c.setLineDash([3,3]);c.strokeRect(s.x+.5,366.5,s.w-1,42);c.restore();txt(c,s.label,s.x+2,424,7,inside?C.safe:'#6f7ba3');if(inside&&!w.player.hidden&&!w.player.crouching)txt(c,'E  HIDE',s.x+s.w/2-20,358,9,C.gold);}
  // ceiling cameras — the cone is the exact beam the world uses for detection
  const camLive=w.interference<=0;
  CAMERAS.forEach((cam0,i)=>{const b=w.cameraBeam(w.time,i),seeing=camLive&&!w.player.hidden&&w.player.x+10>=b.left&&w.player.x-10<=b.right;
    c.save();c.globalAlpha=camLive?(seeing?.3:.15):.05;c.fillStyle=seeing?C.alarm:C.glass;c.beginPath();c.moveTo(cam0.x,156);c.lineTo(b.left,410);c.lineTo(b.right,410);c.closePath();c.fill();c.restore();
    rect(c,cam0.x-13,144,26,12,'#252d49');rect(c,cam0.x-7,156,14,6,'#6474a2');rect(c,cam0.x-3+Math.round(w.cameraSweep(w.time,i)*6),158,6,4,camLive?C.alarm:'#3a4163');txt(c,'CAM',cam0.x-12,138,9,C.glass);});
  // jammer console
  rect(c,JAMMER_X-16,326,32,70,w.jammerUsed?'#303750':C.prop); rect(c,JAMMER_X-10,336,20,16,w.interference>0?C.safe:'#7aa2f7'); rect(c,JAMMER_X-4,357,8,28,w.interference>0?C.safe:'#252b40');
  txt(c,w.jammerUsed?(w.interference>0?`JAM ${Math.ceil(w.interference)}s`:'OFF'):'JAM',JAMMER_X-14,316,8,w.interference>0?C.safe:C.glass);
  if(w.nearJammer() && !w.jammerUsed) txt(c,'Q  JAM CAMERAS',JAMMER_X-46,300,10,C.gold);
  // guards: patrol rails, investigation breadcrumbs, cones, bodies, awareness
  for(const g of [w.guard,w.hallGuard]){
    c.save();c.globalAlpha=.32;c.strokeStyle=g.state==='investigate'?C.gold:C.glass;c.setLineDash([8,8]);c.beginPath();c.moveTo(g.min,404);c.lineTo(g.max,404);c.stroke();c.restore();
    if(g.state==='investigate'){c.save();c.globalAlpha=.75;c.strokeStyle=C.gold;c.setLineDash([3,4]);c.beginPath();c.moveTo(g.x,382);c.lineTo(g.target,382);c.stroke();c.restore();}
    const gx=g.x;c.save();c.globalAlpha=g.state==='alert'?.32:.18;c.fillStyle=C.alarm;c.beginPath();c.moveTo(gx,355);c.lineTo(gx+g.dir*g.range,290);c.lineTo(gx+g.dir*g.range,415);c.closePath();c.fill();c.restore();
    // Alert uses its own wide-stance pose; otherwise the idle sprite walks the lane.
    const alertPose=g.state==='alert'&&sprites.guardAlert;
    const drawn=alertPose?drawWalker(c,sprites.guardAlert,RIGS.guardAlert,{key:g,worldX:gx,screenX:gx,feetY:w.floorY,height:GUARD_HEIGHT,facing:g.dir,still:true}):drawWalker(c,sprites.guard,RIGS.guardIdle,{key:g,worldX:gx,screenX:gx,feetY:w.floorY,height:GUARD_HEIGHT,facing:g.dir});
    if(!drawn){rect(c,gx-9,336,18,30,'#20283c');rect(c,gx-12,326,24,15,'#293652');rect(c,gx-8,318,16,12,'#b3a08d');rect(c,gx-14,364,7,28,'#20283c');rect(c,gx+7,364,7,28,'#20283c');}
    if(g.state==='alert'){c.save();c.globalAlpha=.24;c.fillStyle=C.alarm;c.fillRect(gx-30,300,60,100);c.restore();}
    drawAwareness(c,g,gx,w.floorY-GUARD_HEIGHT);}
  // player
  {const px=w.player.x;const airborne=w.player.vy!==0;const walking=w.player.moving||airborne;
   // the stride pose walks; the standing pose idles, crouches and hides
   const img=walking&&sprites.finnWalk[0]?sprites.finnWalk[0]:sprites.finn;const rig=img===sprites.finnWalk[0]?RIGS.finnWalk:RIGS.finnIdle;
   const crouch=w.player.hidden?1:w.player.crouching?1-w.player.crouchTimer/.22:0;
   const drawn=drawWalker(c,img,rig,{key:w.player,worldX:px,screenX:px,feetY:w.player.y+w.playerHalfHeight,height:FINN_HEIGHT,facing:w.player.facing,airborne,crouch,alpha:w.player.hidden?.9:1});
   if(airborne||w.player.landingTimer>0){c.save();c.globalAlpha=.24;c.fillStyle=C.finn;c.fillRect(px-22,w.floorY-3,44,3);c.restore();}
   if(!drawn){rect(c,px-9,w.player.y-28,18,28,'#252b40');rect(c,px-11,w.player.y-40,22,16,C.finn);rect(c,px-8,w.player.y-49,16,12,'#bca9a0');rect(c,px-13,w.player.y-1,9,5,C.finn);rect(c,px+4,w.player.y-1,9,5,C.finn);}
   if(w.player.hidden)txt(c,'HIDDEN',px-24,w.player.y-24,9,C.safe);}
  // pickups
  for(const p of w.pickups) if(!p.taken){const prop=sprites.props[p.kind==='key'?3:2];if(prop)c.drawImage(prop,p.x-12,p.y-15,24,30);else {rect(c,p.x-9,p.y-7,18,14,p.kind==='key'?C.gold:C.paper);rect(c,p.x-5,p.y-4,10,2,p.kind==='key'?'#72522b':'#7aa2f7');rect(c,p.x-5,p.y,p.kind==='key'?4:10,2,p.kind==='key'?'#72522b':'#a4b4d9');}}
  c.restore();
  // vignette + scanline (screen space)
  c.save();const g=c.createRadialGradient(W/2,285,120,W/2,285,540);g.addColorStop(0,'transparent');g.addColorStop(1,'rgba(0,0,0,.45)');c.fillStyle=g;c.fillRect(0,0,W,H);c.globalAlpha=.06;for(let y=0;y<H;y+=4)rect(c,0,y,W,1,'#fff');c.restore();
}
export function drawTitle(c:CanvasRenderingContext2D,_w:GameWorld){rect(c,0,0,960,540,C.void);rect(c,0,0,960,540,'#171b2a');for(let i=0;i<12;i++)rect(c,80+i*70,130+(i%3)*55,42,2,'#293351');txt(c,'◈ SIGNAL',110,195,56,C.paper);txt(c,'SAINT CROSS HOSPITAL / GROUND FLOOR',115,230,15,C.glass);txt(c,'A stealth horror vertical slice',115,274,18,C.finn);txt(c,'ENTER  BEGIN INVESTIGATION',115,352,18,C.gold);txt(c,'A / D  MOVE     SHIFT  RUN     SPACE  JUMP     E  HIDE     J  JOURNAL     M  MUTE',115,438,12,C.paper);}
