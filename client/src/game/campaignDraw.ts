import {CampaignWorld,EXIT_X,OVERRIDE_SECONDS,ROOF_ALARM,ROOF_FORCE,UPLOAD_SECONDS} from './campaign';
import {drawAwareness,drawWalker,RIGS,FINN_HEIGHT,GUARD_HEIGHT} from './drawUtil';
const C={void:'#10131e',wall:'#303753',floor:'#252b43',alarm:'#f7768e',safe:'#9ece6a',gold:'#e0af68',blue:'#7aa2f7',paper:'#d5dae8',finn:'#bb9af7',dim:'#717da6'};
function rect(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,f:string){c.fillStyle=f;c.fillRect(x,y,w,h)}
function txt(c:CanvasRenderingContext2D,s:string,x:number,y:number,n=12,f=C.paper){c.fillStyle=f;c.font=`${n}px ui-monospace,monospace`;c.fillText(s,x,y)}
const titles:Record<number,[string,string,string]>={5:['STAGE 05 / DOCTOR’S OFFICE','THE NAME','Cold paperwork. Hot alarms.'],6:['STAGE 06 / LABORATORY','EXPERIMENT SEVEN','Clinical indifference.'],7:['STAGE 07 / BASEMENT STORAGE','WHAT THEY’RE HIDING','The dark is listening.'],8:['STAGE 08 / SERVER ROOM','UPLOAD','Thirty seconds of truth.'],9:['STAGE 09 / DIRECTOR’S OFFICE','THE TRUTH WILL OUT','The roof is the only exit.']};
const hints:Record<number,string>={5:'SPACE JUMP THE TRIPWIRES   X ONE-USE OVERRIDE   E HIDE',6:'TECHNICIANS PAUSE TO WRITE NOTES — MOVE WHILE THEY DO   E HIDE',7:'L LIGHTS ON/OFF   R RESCUE   E HIDE — THE PATIENT FOLLOWS YOU',8:'U START THE UPLOAD   E HIDE WHEN HE SWEEPS PAST',9:'FREEZE WHEN HE LOOKS BACK   HOLD R TO FORCE THE ROOF DOOR'};
const TINT:Record<number,string>={5:'#2b2f45',6:'#263347',7:'#1d2131',8:'#1c2638',9:'#2e2c42'};

export function drawCampaign(c:CanvasRenderingContext2D,w:CampaignWorld,finn:HTMLImageElement|null,guard:HTMLImageElement|null,tech:HTMLImageElement|null=null){
  const W=960,H=540;const sx=(x:number)=>x-w.cameraX;c.imageSmoothingEnabled=false;
  rect(c,0,0,W,H,C.void);rect(c,0,100,W,315,TINT[w.stage]??C.wall);rect(c,0,410,W,130,C.floor);
  for(let x=-((w.cameraX*.5)%120);x<W;x+=120)rect(c,x,100,2,310,'rgba(0,0,0,.18)');   // wall panels, slight parallax
  rect(c,0,408,W,2,'#3a4466');
  drawProps(c,w,sx);
  // hide spots
  for(const s of w.hideSpots){const x=sx(s.x);if(x+s.w<0||x>W)continue;const inside=w.player.x>=s.x&&w.player.x<=s.x+s.w;const active=inside&&w.player.hidden;
    rect(c,x,330,s.w,80,active?'rgba(12,20,24,.92)':'rgba(8,10,18,.72)');c.save();c.strokeStyle=C.safe;c.globalAlpha=inside?.6:.22;c.setLineDash([3,3]);c.strokeRect(x+.5,330.5,s.w-1,79);c.restore();
    txt(c,s.label,x+3,424,7,inside?C.safe:C.dim);if(inside&&!w.player.hidden)txt(c,'E  HIDE',x+s.w/2-20,322,9,C.gold);}
  // documents and the stage's key item
  for(const d of w.docs)if(!d.taken){const x=sx(d.x);rect(c,x-8,388,16,20,C.paper);rect(c,x-5,393,10,2,C.blue);rect(c,x-5,398,8,2,C.blue);txt(c,'DOC',x-10,380,8,C.blue);}
  if(w.keyItem&&!w.keyItem.taken){const x=sx(w.keyItem.x);const bob=Math.sin(w.time*3)*2;c.save();c.shadowColor=C.gold;c.shadowBlur=10;rect(c,x-9,384+bob,18,22,C.gold);c.restore();txt(c,w.stage===6?'SAMPLE':w.stage===9?'SIGNED':'AUTH',x-16,374+bob,8,C.gold);}
  // exit
  if(w.stage!==9){const x=sx(EXIT_X+20),open=w.exitOpen();rect(c,x-28,280,56,130,'#161a2a');rect(c,x-22,288,44,122,open?'#1f3a33':'#2a3150');rect(c,x+12,345,6,9,open?C.safe:C.alarm);txt(c,open?'EXIT':'LOCKED',x-(open?12:18),272,9,open?C.safe:C.alarm);}
  // guards and their sight
  const sight=w.sight();
  for(const g of w.guards){const x=sx(g.x);const r=sight??g.range;
    c.save();c.globalAlpha=g.state==='alert'||g.state==='chase'?.3:w.stage===7?.22:.13;c.fillStyle=w.stage===7?'#e0c068':C.alarm;c.beginPath();c.moveTo(x,355);c.lineTo(x+g.dir*r,300);c.lineTo(x+g.dir*r,412);c.closePath();c.fill();c.restore();
    const isTech=w.stage===6&&tech;
    const drawn=isTech?drawWalker(c,tech,RIGS.tech,{key:g,worldX:g.x,screenX:x,feetY:w.floorY,height:FINN_HEIGHT+2,facing:g.dir}):drawWalker(c,guard,RIGS.guardStage3,{key:g,worldX:g.x,screenX:x,feetY:w.floorY,height:GUARD_HEIGHT,facing:g.dir});
    if(!drawn){rect(c,x-10,332,20,34,'#20283c');rect(c,x-12,322,24,15,'#293652');}
    drawAwareness(c,g,x,w.floorY-GUARD_HEIGHT);
    if(w.stage===6&&g.pauseTimer>0)txt(c,'✎ writing…',x-30,w.floorY-GUARD_HEIGHT-24,9,C.blue);
    if(w.stage===8)txt(c,'ELITE',x-14,w.floorY-GUARD_HEIGHT-24,8,C.alarm);}
  if(w.stage===9)drawDirector(c,w,sx);
  if(w.stage===7&&w.rescued)drawPatient(c,w,sx(w.patient.x),w.patient.facing,w.patient.hidden);
  // Finn
  const px=sx(w.player.x);
  if(!drawWalker(c,finn,RIGS.finnStage3,{key:w.player,worldX:w.player.x,screenX:px,feetY:w.player.y+w.playerHalfHeight,height:FINN_HEIGHT,facing:w.player.facing,airborne:w.player.vy!==0,crouch:w.player.hidden?1:0,alpha:w.player.hidden?.55:1})){rect(c,px-10,w.floorY-32,20,32,'#252b40');rect(c,px-12,w.floorY-48,24,17,C.finn);}
  if(w.player.hidden)txt(c,'HIDDEN',px-20,w.player.y-14,9,C.safe);
  if(w.stage===7)drawDarkness(c,w,sx);
  drawHud(c,w);
}

function drawProps(c:CanvasRenderingContext2D,w:CampaignWorld,sx:(x:number)=>number){
  switch(w.stage){
    case 5:{
      for(const x of [180,420,1250]){rect(c,sx(x),190,90,220,'#22263a');for(let y=205;y<400;y+=32)rect(c,sx(x)+6,y,78,4,'#3b425f');}
      const cx=sx(520),used=w.overrideUsed;rect(c,cx-22,300,44,60,used?'#2a3046':C.gold);rect(c,cx-14,310,28,14,used?'#1c2032':'#7a5a24');txt(c,used?'USED':'OVERRIDE',cx-(used?12:24),292,8,used?C.dim:C.gold);
      if(w.near(520)&&!used)txt(c,'X  SWITCH OFF TRIPWIRES (ONCE)',cx-90,276,10,C.gold);
      const armed=w.wiresArmed();
      for(const wire of w.wires){const x=sx(wire.x);rect(c,x-3,376,6,34,'#3a4466');c.save();c.globalAlpha=armed?1:.25;c.shadowColor=C.alarm;c.shadowBlur=armed?12:0;rect(c,x-1,384,2,26,armed?C.alarm:C.safe);rect(c,x-7,384,14,2,armed?C.alarm:C.safe);c.restore();
        const d=wire.x-w.player.x;if(armed&&d>0&&d<110&&w.player.vy===0)txt(c,'SPACE',x-14,370,8,C.gold);}
      if(w.overrideLeft>0){rect(c,sx(640)-10,252,(sx(880)-sx(640)+20)*(w.overrideLeft/OVERRIDE_SECONDS),3,C.safe);txt(c,`TRIPWIRES OFF ${Math.ceil(w.overrideLeft)}s`,sx(700),246,10,C.safe);}
      if(w.tripFlash>0){c.fillStyle=`rgba(247,118,142,${.25*w.tripFlash})`;c.fillRect(0,0,960,540);}
      break;}
    case 6:{
      for(const x of [480,900,1320]){const s=sx(x);rect(c,s-40,330,80,80,'#1e2840');rect(c,s-44,326,88,6,'#46557a');rect(c,s-24,296,12,30,'#6d8fcf');rect(c,s+4,306,10,20,'#9ece6a');txt(c,'STATION',s-20,424,7,C.dim);}
      break;}
    case 7:{
      const s=sx(480);rect(c,s-12,300,24,40,w.lightsOn?C.safe:C.gold);rect(c,s-4,w.lightsOn?306:322,8,12,'#10131e');txt(c,w.lightsOn?'ON':'LIGHTS',s-(w.lightsOn?6:16),292,8,w.lightsOn?C.safe:C.gold);
      if(w.near(480))txt(c,'L  LIGHTS',s-30,276,10,C.gold);
      if(!w.rescued){const p=sx(1120);rect(c,p-34,350,68,60,'#141826');drawPatient(c,w,p,-1,false,true);if(w.near(1120,70))txt(c,'R  HELP THEM UP',p-46,300,10,C.gold);}
      for(const x of [150,650,1450]){rect(c,sx(x),240,70,170,'#181c2b');for(let y=255;y<400;y+=36)rect(c,sx(x)+4,y,62,3,'#2a3048');}
      break;}
    case 8:{
      for(const x of [380,520,640,980,1110,1250,1460]){const s=sx(x);rect(c,s,210,52,200,'#141d30');for(let y=230;y<395;y+=18){const on=Math.sin(w.time*6+x+y)>.2;rect(c,s+8,y,6,3,on?C.safe:'#24324d');rect(c,s+20,y,24,3,'#24324d');}}
      const t=sx(850);rect(c,t-30,312,60,98,'#1d2a44');rect(c,t-24,320,48,32,w.uploadStarted?'#173129':C.blue);
      const f=w.progress/UPLOAD_SECONDS;rect(c,t-24,360,48,6,'#0d1220');rect(c,t-24,360,48*f,6,f>=1?C.safe:C.gold);txt(c,f>=1?'SENT':`${Math.floor(w.progress)}/${UPLOAD_SECONDS}s`,t-20,343,9,f>=1?C.safe:C.paper);
      if(w.near(850,36)&&!w.uploadStarted)txt(c,'U  START UPLOAD',t-50,300,10,C.gold);
      break;}
    case 9:{
      // the first window in the whole game: the city, in the rain
      const wx=sx(1060);rect(c,wx,140,320,190,'#0e1426');for(let i=0;i<14;i++){const bx=wx+10+i*22,bh=40+((i*37)%70);rect(c,bx,330-bh,16,bh,'#1b2440');for(let y=330-bh+6;y<326;y+=10)if((i+y)%3)rect(c,bx+4,y,3,3,'#e0af6866');}
      c.save();c.strokeStyle='rgba(122,162,247,.35)';for(let i=0;i<40;i++){const rx=wx+((i*53+w.time*220)%320),ry=140+((i*91+w.time*400)%190);c.beginPath();c.moveTo(rx,ry);c.lineTo(rx-3,ry+9);c.stroke();}c.restore();
      rect(c,wx-6,134,332,6,'#3b425f');rect(c,wx-6,330,332,6,'#3b425f');
      const d=sx(960);rect(c,d-70,350,180,14,'#4a3a2e');rect(c,d-64,364,8,46,'#3a2d24');rect(c,d+96,364,8,46,'#3a2d24');
      const r=sx(1590);rect(c,r-26,250,52,160,'#161a2a');rect(c,r-20,258,40,152,w.roofOpen?'#1f3a33':'#2a3150');txt(c,'ROOF',r-12,244,9,w.roofOpen?C.safe:C.gold);
      if(w.alarmLeft>0&&!w.roofOpen){rect(c,r-24,414,48,5,'#0d1220');rect(c,r-24,414,48*(w.roofForce/ROOF_FORCE),5,C.gold);}
      if(w.alarmLeft>0){const pulse=.1+.1*(.5+.5*Math.sin(w.time*9));c.fillStyle=`rgba(247,118,142,${pulse})`;c.fillRect(0,0,960,540);
        txt(c,`ALARM — FORCE THE ROOF DOOR (HOLD R)   ${Math.ceil(w.alarmLeft)}s`,230,92,14,C.alarm);rect(c,230,100,500*(w.alarmLeft/ROOF_ALARM),4,C.alarm);}
      break;}
  }
}

function drawDirector(c:CanvasRenderingContext2D,w:CampaignWorld,sx:(x:number)=>number){
  const d=w.director,x=sx(d.x),look=d.dir;
  rect(c,x-22,318,44,62,'#2b2133');                               // chair back
  rect(c,x-15,322,30,40,'#1c1a24');rect(c,x-11,300,22,22,'#c9b2a0');  // suit, head
  rect(c,x+(look>0?6:-11),306,5,3,'#1c1a24');                     // he's looking this way
  rect(c,x-11,296,22,6,'#3a3040');                                 // hair
  drawAwareness(c,d,x,292);
  if(d.pauseTimer>0&&w.alarmLeft<=0)txt(c,'…',x-6,280,14,C.gold);
  if(d.dir<0&&w.alarmLeft<=0){c.save();c.globalAlpha=.16;c.fillStyle=C.alarm;c.beginPath();c.moveTo(x,312);c.lineTo(x-d.range,280);c.lineTo(x-d.range,412);c.closePath();c.fill();c.restore();}
  txt(c,'DIRECTOR',x-24,430,8,C.dim);
}

function drawPatient(c:CanvasRenderingContext2D,w:CampaignWorld,x:number,facing:number,hidden:boolean,sitting=false){
  if(hidden)sitting=true;   // crouched down beside Finn
  const bob=sitting?0:Math.abs(Math.sin(w.time*8))*2;const base=w.floorY;c.save();if(hidden)c.globalAlpha=.6;
  if(sitting){rect(c,x-12,base-34,24,30,'#a9c1d9');rect(c,x-8,base-48,16,15,'#d8c3b4');rect(c,x-14,base-6,28,6,'#8aa4bf');}
  else{rect(c,x-6,base-26,4,26,'#8aa4bf');rect(c,x+2,base-26,4,26,'#8aa4bf');rect(c,x-11,base-62-bob,22,38,'#a9c1d9');rect(c,x-8,base-78-bob,16,16,'#d8c3b4');rect(c,x+(facing>0?3:-7),base-72-bob,4,2,'#3a3040');}
  c.restore();
}

function drawDarkness(c:CanvasRenderingContext2D,w:CampaignWorld,sx:(x:number)=>number){
  if(w.lightsOn)return;
  // only a small pool around Finn — but torches show where the guards are looking
  const px=sx(w.player.x);const g=c.createRadialGradient(px,350,40,px,350,150);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(4,5,10,.9)');
  c.fillStyle=g;c.fillRect(0,0,960,540);
  for(const gd of w.guards){const x=sx(gd.x),r=w.sight()??gd.range;c.save();c.globalCompositeOperation='lighter';c.globalAlpha=gd.state==='alert'?.32:.2;c.fillStyle='#e0c068';c.beginPath();c.moveTo(x+gd.dir*8,340);c.lineTo(x+gd.dir*r,300);c.lineTo(x+gd.dir*r,412);c.closePath();c.fill();c.restore();rect(c,x+gd.dir*8-2,338,4,4,'#ffe7a3');}
}

function drawHud(c:CanvasRenderingContext2D,w:CampaignWorld){
  txt(c,`STAGE 0${w.stage}`,18,28,11,C.blue);
  const extra=w.stage===8?`   UPLOAD ${Math.floor(w.progress)}/${UPLOAD_SECONDS}`:w.stage===7?`   PATIENT ${w.rescued?'WITH YOU':'MISSING'}`:'';
  txt(c,`STEALTH ${Math.round(w.stealth)}%   EVIDENCE ${w.evidenceCount()}/${w.evidenceTotal()}${extra}`,18,48,11,w.stealth<30?C.alarm:C.paper);
}

export function drawCampaignTitle(c:CanvasRenderingContext2D,w:CampaignWorld){const t=titles[w.stage];rect(c,0,0,960,540,C.void);txt(c,'◈ SIGNAL',110,170,54,C.paper);txt(c,t[0],115,220,15,C.blue);txt(c,t[1],115,264,24,C.finn);txt(c,t[2],115,304,14,C.paper);txt(c,'ENTER  CONTINUE INVESTIGATION',115,370,16,C.gold);txt(c,hints[w.stage]??'',115,438,11,C.paper);}
