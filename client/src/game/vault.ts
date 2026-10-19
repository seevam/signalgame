import {GRAVITY,JUMP_BUFFER,JUMP_VELOCITY,isJumpKey} from './physics';
import {Guard} from './stealth';
import {autopilot,type Goal,type StealthStage} from './autopilot';
export type VaultMode='title'|'play'|'win'|'lose';

// Stage 4. Hack the camera to see the laser timing, scan the biometric lock, override the blast door
// and take the token. Taking it trips the vault alarm: run back through the lasers to the service
// tunnel at the far left before the vault seals, with the guard giving chase.
export const ESCAPE_TIME=14;
const TUNNEL_X=70;

export class VaultWorld implements StealthStage{
  readonly width=1600;readonly height=540;readonly floorY=410;readonly playerHalfWidth=18;readonly playerHalfHeight=44;cameraX=0;
  mode:VaultMode='title';time=0;suspicion=0;stealth=100;muted=false;note='Hack the security camera before crossing the laser grid.';demo=false;
  escapeActive=false;alarmLeft=0;
  player={x:90,y:366,vy:0,facing:1,hidden:false,running:false};
  guard=VaultWorld.makeGuard();
  static makeGuard(){return new Guard({x:1280,dir:-1,min:1120,max:1480,speed:68,range:240,chaseSpeed:118});}
  cameraHacked=false;biometric=false;doorOverridden=false;laserPhase=0;
  pickups=[{x:360,kind:'evidence' as const,label:'VAULT LOG — The lock recognizes a living pulse, not a keycard.',taken:false},{x:730,kind:'evidence' as const,label:'CAMERA TRACE — Remote overrides route through the old monitor.',taken:false},{x:1120,kind:'evidence' as const,label:'ACCESS NOTE — The vault opens for one minute after a clean scan.',taken:false},{x:1400,kind:'key' as const,label:'VAULT TOKEN — Fiona’s file is stored behind the blast door.',taken:false}];
  keys=new Set<string>();jumpBuffer=0;
  readonly hideSpots=[{x:250,w:180,label:'MAINTENANCE SHADOW'},{x:1020,w:70,label:'SERVER CABINET'},{x:1290,w:56,label:'DOOR ALCOVE'}];
  readonly laserZone={from:670,to:900};
  start(demo=false){this.demo=demo;this.mode='play';this.reset();}
  reset(){this.jumpBuffer=0;this.mode='play';this.time=0;this.cameraX=0;this.laserPhase=0;this.suspicion=0;this.stealth=100;this.escapeActive=false;this.alarmLeft=0;this.note='Hack the security camera before crossing the laser grid.';this.player={x:90,y:366,vy:0,facing:1,hidden:false,running:false};this.guard=VaultWorld.makeGuard();this.cameraHacked=false;this.biometric=false;this.doorOverridden=false;this.pickups.forEach(p=>p.taken=false);}
  evidenceCount(){return this.pickups.filter(p=>p.kind==='evidence'&&p.taken).length;}
  hasKey(){return this.pickups.some(p=>p.kind==='key'&&p.taken);}
  nearCamera(){return Math.abs(this.player.x-540)<90&&!this.player.hidden;}
  nearBio(){return Math.abs(this.player.x-980)<90&&!this.player.hidden;}
  nearDoor(){return this.player.x>1350;}
  hideSpotAt(x:number){return this.hideSpots.find(s=>x>s.x&&x<s.x+s.w)??null;}
  nearHide(){return this.hideSpotAt(this.player.x)!==null;}
  inLasers(x=this.player.x){return x>this.laserZone.from&&x<this.laserZone.to;}
  // Before the camera hack the grid is solid; afterwards it cycles, and the gaps are visible.
  lasersActive(t=this.time){const phase=(t%4.2)/4.2;return !this.cameraHacked||(phase>=.42&&phase<=.72);}
  // --- autopilot view
  watchers(){return [this.guard];}
  covers(){return this.hideSpots;}
  hazardAt(x:number,lookahead:number){if(!this.inLasers(x))return false;for(let t=0;t<=lookahead;t+=.1)if(this.lasersActive(this.time+t))return true;return false;}
  goal():Goal{
    if(this.escapeActive)return {x:TUNNEL_X-20,run:true,reach:10};
    if(!this.cameraHacked)return {x:540,keys:['h'],reach:30};
    const doc=this.pickups.filter(p=>p.kind==='evidence'&&!p.taken).sort((a,b)=>a.x-b.x)[0];
    if(doc&&doc.x<980)return {x:doc.x,reach:14};
    if(!this.biometric)return {x:980,keys:['b'],reach:40};
    if(doc)return {x:doc.x,reach:14};
    if(!this.doorOverridden)return {x:1375,keys:['r'],reach:20};
    return {x:1400,reach:14};
  }
  press(key:string){const k=key.toLowerCase();if(k==='m'){this.muted=!this.muted;return;}if(this.mode!=='play')return;this.keys.add(k);if(isJumpKey(k))this.jumpBuffer=JUMP_BUFFER;
    if(k==='e'&&(this.player.hidden||this.nearHide()))this.player.hidden=!this.player.hidden;
    if(k==='h'&&this.nearCamera()&&!this.cameraHacked){this.cameraHacked=true;this.note='CAMERA OVERRIDE ACTIVE — the laser timing is visible.';}
    if(k==='b'&&this.nearBio()&&!this.biometric){this.biometric=true;this.note='BIOMETRIC ACCEPTED — pulse matched to the vault registry.';}
    if(k==='r'&&this.nearDoor()&&this.biometric&&!this.doorOverridden){this.doorOverridden=true;this.note='REMOTE DOOR OVERRIDE — the blast door is open. Take the token.';}}
  release(key:string){this.keys.delete(key.toLowerCase());}
  step(dt:number){
    if(this.mode!=='play')return;
    this.time+=dt;this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);this.laserPhase=(this.time%4.2)/4.2;
    if(this.demo)this.runDemo();
    const l=this.keys.has('a')||this.keys.has('arrowleft');const r=this.keys.has('d')||this.keys.has('arrowright');const run=this.keys.has('shift');this.player.running=run;
    if(!this.player.hidden){const axis=(r?1:0)-(l?1:0);this.player.x+=axis*(run?185:110)*dt;if(axis)this.player.facing=axis;
      if((this.keys.has(' ')||this.keys.has('w')||this.keys.has('arrowup')||this.jumpBuffer>0)&&this.player.y>=this.floorY-this.playerHalfHeight){this.player.vy=JUMP_VELOCITY;this.jumpBuffer=0;}
      this.player.vy+=GRAVITY*dt;this.player.y+=this.player.vy*dt;if(this.player.y>this.floorY-this.playerHalfHeight)this.player.y=this.floorY-this.playerHalfHeight,this.player.vy=0;}
    this.player.x=Math.max(35,Math.min(1590,this.player.x));
    const cameraTarget=Math.max(0,Math.min(640,this.player.x-350));this.cameraX+=(cameraTarget-this.cameraX)*Math.min(1,dt*8);
    const rate=this.guard.update(dt,{x:this.player.x,hidden:this.player.hidden,running:this.player.running&&!this.escapeActive});
    let gain=rate;
    if(!this.cameraHacked&&this.player.x>470&&this.player.x<670&&!this.player.hidden)gain+=8;
    if(this.inLasers()&&!this.player.hidden&&this.lasersActive())gain+=this.cameraHacked?26:70;
    if(gain>0)this.suspicion=Math.min(100,this.suspicion+dt*gain);else this.suspicion=Math.max(0,this.suspicion-dt*(this.player.hidden?30:14));
    this.stealth=Math.max(0,100-this.suspicion);
    this.pickups.forEach(p=>{if(!p.taken&&Math.abs(this.player.x-p.x)<this.playerHalfWidth+10){p.taken=true;this.note=p.label;}});
    if(!this.escapeActive&&this.doorOverridden&&this.hasKey()&&this.evidenceCount()===3){
      this.escapeActive=true;this.alarmLeft=ESCAPE_TIME;this.guard.chase(this.player.x,1.2);}
    if(this.escapeActive){
      this.alarmLeft=Math.max(0,this.alarmLeft-dt);
      if(this.guard.state!=='chase'&&!this.player.hidden&&this.guard.sees({x:this.player.x,hidden:false,running:false}))this.guard.chase(this.player.x);
      this.note=`ALARM — back through the lasers to the service tunnel. ${Math.ceil(this.alarmLeft)}s`;
      if(this.player.x<TUNNEL_X){this.mode='win';this.note='THE VAULT SEALS BEHIND YOU — Finn escapes with Fiona’s file.';return;}
      if(this.guard.caught){this.mode='lose';this.note='A hand closes on your shoulder. The guard has you.';return;}
      if(this.alarmLeft<=0){this.mode='lose';this.note='The blast doors seal. Nobody leaves the vault tonight.';return;}
    }else if(rate>0)this.note='VAULT SECURITY ALERT — get to cover.';
    else if(this.inLasers()&&!this.player.hidden)this.note=!this.cameraHacked?'LASER GRID TRIPPED — hack the camera with H to see the gaps.':this.lasersActive()?'LASER GRID ACTIVE — wait for the gap.':'LASER GAP OPEN — cross now.';
    else if(!this.cameraHacked&&this.player.x>600&&this.player.x<670)this.note='LASER GRID AHEAD — hack the camera with H first.';
    else if(this.nearBio()&&!this.biometric)this.note='BIOMETRIC LOCK — press B to scan.';
    else if(this.doorOverridden&&!this.hasKey())this.note='The blast door is open — take the vault token.';
    else if(this.biometric&&!this.doorOverridden&&this.nearDoor())this.note='BLAST DOOR — press R for the remote override.';
    if(this.suspicion>=100){this.mode='lose';this.note='Vault security seals the level.';}
  }
  private runDemo(){autopilot(this);}
}
