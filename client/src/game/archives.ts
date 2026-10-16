import {GRAVITY,JUMP_VELOCITY} from './physics';
export type ArchivesMode='title'|'play'|'win'|'lose';
export type ArchivesPickup={x:number;kind:'evidence'|'key';label:string;taken:boolean};

export class ArchivesWorld {
  readonly width=1800; readonly height=540; readonly floorY=410; readonly playerHalfWidth=18; readonly playerHalfHeight=44; cameraX=0;
  mode:ArchivesMode='title'; time=0; suspicion=0; stealth=100; muted=false; note='Find the terminal and recover the archive index.'; demo=false;
  player={x:90,y:366,vy:0,facing:1,hidden:false,crouching:false,running:false};
  guard={x:1450,dir:-1,state:'patrol' as 'patrol'|'alert'};
  terminalX=880; hackSequence='241'; hackInput=''; hacked=false; hackError=0;
  pickups:ArchivesPickup[]=[
    {x:300,kind:'evidence',label:'ARCHIVE CARD — “Subject F” is filed under an obsolete ward code.',taken:false},
    {x:1120,kind:'evidence',label:'INDEX PAGE — Transfer records were scrubbed at 02:14.',taken:false},
    {x:1510,kind:'evidence',label:'MARGIN NOTE — “The terminal still remembers.”',taken:false},
    {x:1660,kind:'key',label:'ARCHIVE KEY — A brass key marked BASEMENT RECORDS.',taken:false},
  ];
  keys=new Set<string>();
  start(demo=false){this.demo=demo;this.mode='play';this.reset();}
  reset(){this.mode='play';this.time=0;this.cameraX=0;this.suspicion=0;this.stealth=100;this.note='Find the terminal and recover the archive index.';this.player={x:90,y:366,vy:0,facing:1,hidden:false,crouching:false,running:false};this.guard={x:1450,dir:-1,state:'patrol'};this.hackInput='';this.hacked=false;this.hackError=0;this.pickups.forEach(p=>p.taken=false);}
  evidenceCount(){return this.pickups.filter(p=>p.kind==='evidence'&&p.taken).length;}
  hasKey(){return this.pickups.some(p=>p.kind==='key'&&p.taken);}
  readonly hideSpots=[{x:250,w:130,label:'STACK SHADOW'},{x:1210,w:120,label:'SHELF SHADOW'},{x:1600,w:130,label:'DESK SHADOW'}];
  nearHide(){return this.hideSpots.some(s=>this.player.x>=s.x&&this.player.x<=s.x+s.w);}
  nearTerminal(){return Math.abs(this.player.x-this.terminalX)<90&&!this.player.hidden;}
  press(key:string){const k=key.toLowerCase();if(k==='m'){this.muted=!this.muted;return;}if(this.mode!=='play')return;this.keys.add(k);if(k==='e'&&this.mode==='play'&&this.nearHide())this.player.hidden=!this.player.hidden;if(k==='t'&&this.mode==='play'&&this.nearTerminal()){this.note='TERMINAL ONLINE — enter the three-digit archive key.';this.hackInput='';}if(this.nearTerminal()&&!this.hacked&&this.hackError<=0&&['1','2','3','4','5','6','7','8','9','0'].includes(k)&&this.hackInput.length<3){this.hackInput+=k;if(this.hackInput.length===3){if(this.hackInput===this.hackSequence){this.hacked=true;this.note='ARCHIVE INDEX DECRYPTED — the last file is still intact.';}else{this.hackError=1.5;this.note='ACCESS DENIED — the terminal resets.';this.hackInput='';}}}}
  release(key:string){this.keys.delete(key.toLowerCase());}
  step(dt:number){if(this.mode!=='play')return;this.time+=dt;this.hackError=Math.max(0,this.hackError-dt);if(this.demo)this.runDemo();const left=this.keys.has('a')||this.keys.has('arrowleft');const right=this.keys.has('d')||this.keys.has('arrowright');const run=this.keys.has('shift');this.player.running=run;if(!this.player.hidden){const axis=(right?1:0)-(left?1:0);this.player.x+=axis*(run?185:110)*dt;if(axis)this.player.facing=axis;if((this.keys.has(' ')||this.keys.has('w')||this.keys.has('arrowup'))&&this.player.y>=this.floorY-this.playerHalfHeight)this.player.vy=JUMP_VELOCITY;this.player.vy+=GRAVITY*dt;this.player.y+=this.player.vy*dt;if(this.player.y>this.floorY-this.playerHalfHeight)this.player.y=this.floorY-this.playerHalfHeight,this.player.vy=0;}this.player.x=Math.max(35,Math.min(1740,this.player.x));const cameraTarget=Math.max(0,Math.min(840,this.player.x-360));this.cameraX+=(cameraTarget-this.cameraX)*Math.min(1,dt*8);
    const sees=!this.player.hidden&&Math.abs(this.player.x-this.guard.x)<245&&Math.sign(this.player.x-this.guard.x)===this.guard.dir;const noisy=this.player.running&&Math.abs(this.player.x-this.guard.x)<210;if(sees||noisy){this.guard.state='alert';this.suspicion=Math.min(100,this.suspicion+dt*34);this.note='ARCHIVIST ALERT — vanish into a shadow.';}else{this.guard.state='patrol';this.guard.x+=this.guard.dir*62*dt;if(this.guard.x<1280){this.guard.x=1280;this.guard.dir=1;}if(this.guard.x>1680){this.guard.x=1680;this.guard.dir=-1;}this.suspicion=Math.max(0,this.suspicion-dt*14);}
    if(this.player.hidden)this.suspicion=Math.max(0,this.suspicion-dt*30);this.stealth=Math.max(0,Math.min(100,100-this.suspicion));if(this.hackError>0)this.note='ACCESS DENIED — wait for the terminal to reset.';else if(this.nearTerminal()&&!this.hacked)this.note=`TERMINAL LOCKED — press T, then enter 241. INPUT ${this.hackInput||'___'}`;else if(this.hacked)this.note='INDEX DECRYPTED — collect the archive key and leave.';else if(this.nearHide())this.note='DEEP SHADOW — E hides you from the patrol.';else if(this.suspicion<15)this.note='Keep to the shelves. The archive patrol turns at the desk.';
    this.pickups.forEach(p=>{if(!p.taken&&Math.abs(this.player.x-p.x)<this.playerHalfWidth+10){p.taken=true;this.note=p.label;}});if(this.suspicion>=100){this.mode='lose';this.note='The archive lights ignite. Your file is added to the stack.';}if(this.hacked&&this.hasKey()&&this.evidenceCount()===3&&this.player.x>1720){this.mode='win';this.note='ARCHIVES SEALED — The index points below Saint Cross.';}
  }
  private runDemo(){this.keys.clear();if(!this.hacked&&this.player.x<this.terminalX-20)this.keys.add('d');else if(!this.hacked&&this.hackError<=0){this.press('t');for(const digit of this.hackSequence)this.press(digit);}else{const target=this.pickups.find(p=>!p.taken)?.x??1730;if(this.player.x<target-8)this.keys.add('d');else if(this.player.x>target+8)this.keys.add('a');}}
}
