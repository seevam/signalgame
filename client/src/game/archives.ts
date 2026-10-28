import {GRAVITY,JUMP_BUFFER,JUMP_VELOCITY,isJumpKey} from './physics';
import {Guard} from './stealth';
import {autopilot,type Goal,type StealthStage} from './autopilot';
export type ArchivesMode='title'|'play'|'win'|'lose';
export type ArchivesPickup={x:number;kind:'evidence'|'key';label:string;taken:boolean};

// Stage 3. The terminal code is different every run and each evidence document holds one digit of
// it, so collecting the evidence is how you solve the terminal. A wrong code beeps, and the archivist
// walks over to see who is at his terminal.
const DOCS=[
  {x:300,label:'ARCHIVE CARD — “Subject F” is filed under an obsolete ward code.'},
  {x:1120,label:'INDEX PAGE — Transfer records were scrubbed at 02:14.'},
  {x:1510,label:'MARGIN NOTE — “The terminal still remembers.”'},
];
const randomCode=()=>Array.from({length:3},()=>String(1+Math.floor(Math.random()*9))).join('');

export class ArchivesWorld implements StealthStage {
  readonly width=1800; readonly height=540; readonly floorY=410; readonly playerHalfWidth=18; readonly playerHalfHeight=44; cameraX=0;
  mode:ArchivesMode='title'; time=0; suspicion=0; stealth=100; muted=false; note='Find the terminal and recover the archive index.'; demo=false;
  player={x:90,y:366,vy:0,facing:1,hidden:false,crouching:false,running:false};
  guard=ArchivesWorld.makeGuard();
  static makeGuard(){return new Guard({x:1450,dir:-1,min:1280,max:1680,speed:62,range:245,hearing:210});}
  terminalX=880; hackSequence=randomCode(); hackInput=''; hacked=false; hackError=0;
  pickups:ArchivesPickup[]=[];
  keys=new Set<string>();jumpBuffer=0;
  readonly hideSpots=[{x:250,w:130,label:'STACK SHADOW'},{x:1210,w:120,label:'SHELF SHADOW'},{x:1600,w:130,label:'DESK SHADOW'}];
  constructor(){this.buildPickups();}
  private buildPickups(){
    this.pickups=[...DOCS.map((d,i)=>({x:d.x,kind:'evidence' as const,label:`${d.label} [CODE DIGIT ${i+1}: ${this.hackSequence[i]}]`,taken:false})),
      {x:1660,kind:'key',label:'ARCHIVE KEY — A brass key marked BASEMENT RECORDS.',taken:false}];
  }
  start(demo=false){this.demo=demo;this.mode='play';this.reset();}
  reset(){this.jumpBuffer=0;this.mode='play';this.time=0;this.cameraX=0;this.suspicion=0;this.stealth=100;this.note='Find the terminal and recover the archive index.';this.player={x:90,y:366,vy:0,facing:1,hidden:false,crouching:false,running:false};this.guard=ArchivesWorld.makeGuard();this.hackSequence=randomCode();this.hackInput='';this.hacked=false;this.hackError=0;this.buildPickups();}
  evidenceCount(){return this.pickups.filter(p=>p.kind==='evidence'&&p.taken).length;}
  hasKey(){return this.pickups.some(p=>p.kind==='key'&&p.taken);}
  /** The code as far as Finn knows it, e.g. "2 _ 7". */
  knownCode(){return this.pickups.filter(p=>p.kind==='evidence').map((p,i)=>p.taken?this.hackSequence[i]:'_').join(' ');}
  nearHide(){return this.hideSpots.some(s=>this.player.x>=s.x&&this.player.x<=s.x+s.w);}
  nearTerminal(){return Math.abs(this.player.x-this.terminalX)<90&&!this.player.hidden;}
  // --- autopilot view
  watchers(){return [this.guard];}
  covers(){return this.hideSpots;}
  hazardAt(){return false;}
  goal():Goal{
    const doc=this.pickups.filter(p=>p.kind==='evidence'&&!p.taken).sort((a,b)=>a.x-b.x)[0];
    if(doc)return {x:doc.x,reach:14};
    if(!this.hacked)return {x:this.terminalX,reach:20,keys:this.hackError>0?[]:['t',...this.hackSequence.split('')]};
    const key=this.pickups.find(p=>p.kind==='key'&&!p.taken);
    return key?{x:key.x,reach:14}:{x:1735,reach:10};
  }
  press(key:string){const k=key.toLowerCase();if(k==='m'){this.muted=!this.muted;return;}if(this.mode!=='play')return;this.keys.add(k);if(isJumpKey(k))this.jumpBuffer=JUMP_BUFFER;
    if(k==='e'&&this.nearHide())this.player.hidden=!this.player.hidden;
    if(k==='t'&&this.nearTerminal()&&!this.hacked){this.note=`TERMINAL ONLINE — enter the three-digit code. KNOWN: ${this.knownCode()}`;this.hackInput='';}
    if(this.nearTerminal()&&!this.hacked&&this.hackError<=0&&/^[0-9]$/.test(k)&&this.hackInput.length<3){this.hackInput+=k;
      if(this.hackInput.length===3){
        if(this.hackInput===this.hackSequence){this.hacked=true;this.note='ARCHIVE INDEX DECRYPTED — the last file is still intact.';}
        else{this.hackError=1.5;this.hackInput='';this.note='ACCESS DENIED — the terminal beeps. Someone heard that.';this.guard.investigate(this.terminalX,3);}
      }}}
  release(key:string){this.keys.delete(key.toLowerCase());}
  step(dt:number){
    if(this.mode!=='play')return;
    this.time+=dt;this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);this.hackError=Math.max(0,this.hackError-dt);
    if(this.demo)this.runDemo();
    const left=this.keys.has('a')||this.keys.has('arrowleft');const right=this.keys.has('d')||this.keys.has('arrowright');const run=this.keys.has('shift');this.player.running=run;
    if(!this.player.hidden){const axis=(right?1:0)-(left?1:0);this.player.x+=axis*(run?185:110)*dt;if(axis)this.player.facing=axis;
      if((this.keys.has(' ')||this.keys.has('w')||this.keys.has('arrowup')||this.jumpBuffer>0)&&this.player.y>=this.floorY-this.playerHalfHeight){this.player.vy=JUMP_VELOCITY;this.jumpBuffer=0;}
      this.player.vy+=GRAVITY*dt;this.player.y+=this.player.vy*dt;if(this.player.y>this.floorY-this.playerHalfHeight)this.player.y=this.floorY-this.playerHalfHeight,this.player.vy=0;}
    this.player.x=Math.max(35,Math.min(1740,this.player.x));
    const cameraTarget=Math.max(0,Math.min(840,this.player.x-360));this.cameraX+=(cameraTarget-this.cameraX)*Math.min(1,dt*8);
    const rate=this.guard.update(dt,{x:this.player.x,hidden:this.player.hidden,running:this.player.running});
    if(rate>0)this.suspicion=Math.min(100,this.suspicion+dt*rate);else this.suspicion=Math.max(0,this.suspicion-dt*(this.player.hidden?30:14));
    this.stealth=Math.max(0,Math.min(100,100-this.suspicion));
    if(rate>0)this.note='ARCHIVIST ALERT — vanish into a shadow.';
    else if(this.hackError>0)this.note='ACCESS DENIED — the terminal beeps. Someone heard that.';
    else if(this.guard.state==='investigate')this.note='The archivist is checking his terminal. Stay out of sight.';
    else if(this.nearTerminal()&&!this.hacked)this.note=`TERMINAL LOCKED — press T, then the code. KNOWN: ${this.knownCode()}`;
    else if(this.hacked&&!this.hasKey())this.note='INDEX DECRYPTED — collect the archive key and leave.';
    else if(this.nearHide())this.note='DEEP SHADOW — E hides you from the patrol.';
    else if(this.suspicion<15)this.note=this.evidenceCount()<3?`Each document holds one digit of the terminal code. KNOWN: ${this.knownCode()}`:'Keep to the shelves. The archive patrol turns at the desk.';
    this.pickups.forEach(p=>{if(!p.taken&&Math.abs(this.player.x-p.x)<this.playerHalfWidth+10){p.taken=true;this.note=p.label;}});
    if(this.suspicion>=100){this.mode='lose';this.note='The archive lights ignite. Your file is added to the stack.';}
    if(this.hacked&&this.hasKey()&&this.evidenceCount()===3&&this.player.x>1720){this.mode='win';this.note='ARCHIVES SEALED — The index points below Saint Cross.';}
  }
  private runDemo(){autopilot(this);}
}
