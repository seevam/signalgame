import {GRAVITY,JUMP_BUFFER,JUMP_VELOCITY,isJumpKey} from './physics';
import {Guard} from './stealth';
import {autopilot,type Cover,type Goal,type StealthStage} from './autopilot';
export type GameMode = 'title' | 'play' | 'win' | 'lose';
export type PickupKind = 'evidence' | 'key';
export type Pickup = { x:number; y:number; kind:PickupKind; id:number; label:string; taken:boolean };
export type HideSpot = Cover & { label:string };

// Stage 1 teaches one idea per room, then combines them:
//   RECEPTION (0–960)          a guard patrols — hide and let him pass
//   WAITING AREA (960–1900)    two cameras sweep — time the beams, hide, or jam them
//                              (jamming draws the nearest guard over to check the console)
//   EAST WING HALL (1900–2500) a guard and a camera together — the keycard is in his patrol
export const ROOM_SPLIT = 960;
export const HALL_SPLIT = 1900;
export const CAMERA_X = 1400;
// two ceiling cameras sweeping in opposite rhythm: wait in cover between the beams for both gaps
export const CAMERAS = [{x:CAMERA_X, phase:0}, {x:1720, phase:Math.PI}, {x:2230, phase:Math.PI/2}];
export const JAMMER_X = 1280;
export const EXIT_X = 2440;

export class GameWorld implements StealthStage {
  readonly width = 2500; readonly height = 540; readonly floorY = 410; readonly playerHalfWidth = 18; readonly playerHalfHeight = 44;
  mode: GameMode = 'title';
  time = 0; lastX = 110; cameraX = 0;
  player = { x: 110, y: 366, vy: 0, facing: 1, hidden: false, crouching: false, crouchTimer: 0, landingTimer: 0, running: false, moving: false };
  guard = GameWorld.makeGuard();
  hallGuard = GameWorld.makeHallGuard();
  static makeGuard() { return new Guard({x:840,dir:-1,min:545,max:870,speed:76,range:250,hearing:180,pause:1.5,edgeRate:24}); }
  static makeHallGuard() { return new Guard({x:2370,dir:-1,min:2040,max:2380,speed:82,range:230,hearing:170,pause:1.1,edgeRate:24}); }
  suspicion = 0; muted = false; interference = 0; jammerUsed = false; note = 'Find the keycard and reach the east wing.';
  pickups: Pickup[] = [
    {x: 240, y: 390, kind:'evidence', id:0, label:'VISITOR LOG — Fiona signed in on the 14th. No matching sign-out.', taken:false},
    {x: 590, y: 390, kind:'evidence', id:1, label:'CRUMPLED NOTE — “They moved her to the east wing. Don’t ask at the desk.”', taken:false},
    {x: 1480, y: 390, kind:'evidence', id:2, label:'INTAKE FORM — Consent line signed by staff, not by her.', taken:false},
    {x: 2300, y: 390, kind:'key', id:3, label:'STAFF KEYCARD — Ward access. The magnetic strip is still warm.', taken:false},
  ];
  keys = new Set<string>(); demo = false; jumpBuffer = 0;

  start(demo = false) { this.demo = demo; this.mode = 'play'; this.reset(); }
  reset() { this.jumpBuffer=0; this.time=0; this.lastX=110; this.cameraX=0; this.player = {x:110,y:366,vy:0,facing:1,hidden:false,crouching:false,crouchTimer:0,landingTimer:0,running:false,moving:false}; this.guard=GameWorld.makeGuard(); this.hallGuard=GameWorld.makeHallGuard(); this.suspicion=0; this.interference=0; this.jammerUsed=false; this.note='Find the keycard and reach the east wing.'; this.pickups.forEach(p=>p.taken=false); }
  evidenceCount() { return this.pickups.filter(p=>p.kind==='evidence' && p.taken).length; }
  hasKey() { return this.pickups.some(p=>p.kind==='key' && p.taken); }
  // The renderer draws exactly this cone, so what the player sees is what the camera sees.
  cameraSweep(t=this.time, i=0) { return Math.sin(t*2*Math.PI/6.2+CAMERAS[i].phase)*0.72; }
  cameraBeam(t=this.time, i=0) { const a=this.cameraSweep(t,i), x=CAMERAS[i].x; return { left: x+Math.sin(a-.18)*250, right: x+Math.sin(a+.18)*250 }; }
  cameraBeams(t=this.time) { return CAMERAS.map((_,i)=>this.cameraBeam(t,i)); }
  beamCovers(x:number, t=this.time) { return this.cameraBeams(t).some(b=>x+10>=b.left&&x-10<=b.right); }
  cameraSeesPlayer() { return !this.player.hidden && !this.player.crouching && this.beamCovers(this.player.x) && this.player.y>300; }
  press(key:string) { if (key.toLowerCase()==='m') { this.muted=!this.muted; return; } if (this.mode!=='play') return; this.keys.add(key.toLowerCase()); if (isJumpKey(key.toLowerCase())) this.jumpBuffer=JUMP_BUFFER; if (key.toLowerCase()==='e' && this.mode==='play') { const spot = this.nearHide(); if (spot && !this.player.hidden && !this.player.crouching) { this.player.crouching=true; this.player.crouchTimer=.22; } else if (spot && this.player.hidden) { this.player.hidden=false; this.player.crouching=false; } } }
  release(key:string) { this.keys.delete(key.toLowerCase()); }
  readonly hideSpots: HideSpot[] = [
    {x:36,w:149,label:'RECEPTION DESK'},{x:328,w:84,label:'WAITING CHAIRS'},{x:835,w:81,label:'LOCKERS'},
    {x:1150,w:60,label:'VENDING MACHINE'},{x:1370,w:60,label:'LINEN TROLLEY'},{x:1555,w:56,label:'SUPPLY CLOSET'},{x:1770,w:50,label:'LAUNDRY CART'},
    {x:2080,w:60,label:'GURNEY'},{x:2250,w:56,label:'CURTAIN'},
  ];
  hideSpotAt(x:number) { return this.hideSpots.find(c=>x>=c.x&&x<=c.x+c.w)??null; }
  nearHide() { return this.hideSpots.some(c=>this.player.x>=c.x&&this.player.x<=c.x+c.w); }
  // --- autopilot view
  watchers() { return [this.guard, this.hallGuard]; }
  nearestGuard() { return Math.abs(this.guard.x-this.player.x)<=Math.abs(this.hallGuard.x-this.player.x)?this.guard:this.hallGuard; }
  covers() { return this.hideSpots; }
  hazardAt(x:number, lookahead:number) { if(this.interference>lookahead) return false; for(let t=0;t<=lookahead;t+=.1){ if(this.beamCovers(x,this.time+t)) return true; } return false; }
  goal(): Goal { const next=this.pickups.filter(p=>!p.taken).sort((a,b)=>a.x-b.x)[0]; return next?{x:next.x,reach:14}:{x:EXIT_X+20,reach:12}; }
  nearJammer() { return Math.abs(this.player.x-JAMMER_X)<42 && !this.player.hidden && !this.player.crouching; }
  step(dt:number) {
    if (this.mode!=='play') return;
    this.time += dt; this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
    this.interference=Math.max(0,this.interference-dt);
    if (this.demo) this.runDemo();
    const left=this.keys.has('a')||this.keys.has('arrowleft'); const right=this.keys.has('d')||this.keys.has('arrowright');
    const run=this.keys.has('shift'); this.player.running=run;
    if(this.player.crouchTimer>0){this.player.crouchTimer=Math.max(0,this.player.crouchTimer-dt);if(this.player.crouchTimer===0){this.player.crouching=false;this.player.hidden=true;}}
    if(this.player.landingTimer>0)this.player.landingTimer=Math.max(0,this.player.landingTimer-dt);
    if (!this.player.hidden && !this.player.crouching) {
      const speed=run?190:112; const axis=(right?1:0)-(left?1:0); this.player.x += axis*speed*dt; if(axis) this.player.facing=axis;
      if ((this.keys.has(' ')||this.keys.has('w')||this.keys.has('arrowup')||this.jumpBuffer>0) && this.player.y>=this.floorY-this.playerHalfHeight) { this.player.vy=JUMP_VELOCITY; this.jumpBuffer=0; }
      const wasAirborne=this.player.y<this.floorY-this.playerHalfHeight-.5; this.player.vy += GRAVITY*dt; this.player.y += this.player.vy*dt; if(this.player.y>this.floorY-this.playerHalfHeight){if(wasAirborne&&this.player.vy>0)this.player.landingTimer=.16;this.player.y=this.floorY-this.playerHalfHeight;this.player.vy=0;}
    }
    this.player.x=Math.max(36,Math.min(this.width-20,this.player.x));
    const cameraTarget=Math.max(0,Math.min(this.width-960,this.player.x-420)); this.cameraX+=(cameraTarget-this.cameraX)*Math.min(1,dt*8);
    const seen={x:this.player.x,hidden:this.player.hidden||this.player.crouching,running:this.player.running};
    const guardRate=this.guard.update(dt,seen)+this.hallGuard.update(dt,seen);
    const cameraSees=this.interference<=0 && this.cameraSeesPlayer();
    const sees=guardRate>0&&(this.guard.sees(seen)||this.hallGuard.sees(seen)), heard=guardRate>0&&!sees;
    if(guardRate>0) this.suspicion=Math.min(100,this.suspicion+dt*guardRate);
    if(cameraSees) this.suspicion=Math.min(100,this.suspicion+dt*22);
    if(guardRate===0 && !cameraSees) this.suspicion=Math.max(0,this.suspicion-dt*(this.player.hidden?30:18));
    const near=this.nearestGuard();
    if(sees || heard) this.note='YOU ARE EXPOSED — break line of sight.';
    else if(this.interference>0) this.note=this.guard.state==='investigate'?`CAMERA JAMMED ${this.interference.toFixed(1)}s — and the guard is coming to check the console.`:`CAMERA JAMMED — ${this.interference.toFixed(1)}s.`;
    else if(cameraSees) this.note='CAMERA SWEEP — hide or wait for it to pass.';
    else if(this.player.x>ROOM_SPLIT && !this.player.hidden && this.hazardAt(this.player.x,1.2)) this.note=this.nearHide()?'The beam is swinging this way — E to hide.':this.nearJammer()&&!this.jammerUsed?'Q jams the camera for a few seconds — but someone will come to check.':'The beam is swinging this way — wait outside it, or get to cover.';
    else if(this.player.x>ROOM_SPLIT && this.player.x<HALL_SPLIT && !this.player.hidden && this.interference<=0) this.note='WAITING AREA — two cameras sweep this room. Move while the beams point away.';
    else if(this.player.x>=HALL_SPLIT && !this.player.hidden && !this.hasKey()) this.note='EAST WING HALL — the keycard is on his route. Use everything you’ve learned.';
    else if(!this.player.hidden && near.state==='patrol' && Math.sign(this.player.x-near.x)===near.dir && Math.abs(this.player.x-near.x)<430) this.note=this.nearHide()?'HE’S COMING — press E to hide here.':'HE’S COMING — get to cover (the desk, the chairs, the lockers).';
    else if(this.player.hidden && near.state==='patrol') this.note=Math.sign(this.player.x-near.x)!==near.dir?'His back is turned — E to step out and follow.':'Stay hidden. Let him pass.';
    else if(this.suspicion<15) this.note='Observe the patrol. Move when his back is turned.';
    this.player.moving=Math.abs(this.player.x-this.lastX)>0.01; this.lastX=this.player.x;
    for(const p of this.pickups) if(!p.taken && Math.abs(this.player.x-p.x)<this.playerHalfWidth+10 && this.player.y>=340){p.taken=true;this.note=p.label;}
    if(this.suspicion>=100){this.mode='lose';this.note='The monitors flatline. Saint Cross has seen you.';}
    if(this.hasKey() && this.evidenceCount()===3 && this.player.x>EXIT_X){this.mode='win';this.note='EAST WING UNLOCKED — Fiona was here.';}
  }
  interact() { if(this.mode!=='play' || !this.nearJammer() || this.jammerUsed) return; this.jammerUsed=true; this.interference=5.5; const checker=[this.guard,this.hallGuard].filter(g=>Math.abs(g.x-JAMMER_X)<700).sort((a,b)=>Math.abs(a.x-JAMMER_X)-Math.abs(b.x-JAMMER_X))[0]; checker?.investigate(JAMMER_X,this.interference+2); this.note='SIGNAL JAMMED — the camera is blind. Someone will come to check.'; }
  private runDemo(){ autopilot(this); }
}
