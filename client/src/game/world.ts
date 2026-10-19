import {GRAVITY,JUMP_BUFFER,JUMP_VELOCITY,isJumpKey} from './physics';
import {Guard} from './stealth';
import {autopilot,type Cover,type Goal,type StealthStage} from './autopilot';
export type GameMode = 'title' | 'play' | 'win' | 'lose';
export type PickupKind = 'evidence' | 'key';
export type Pickup = { x:number; y:number; kind:PickupKind; id:number; label:string; taken:boolean };

export class GameWorld implements StealthStage {
  readonly width = 960; readonly height = 540; readonly floorY = 410; readonly playerHalfWidth = 18; readonly playerHalfHeight = 44;
  mode: GameMode = 'title';
  time = 0; lastX = 110;
  player = { x: 110, y: 366, vy: 0, facing: 1, hidden: false, crouching: false, crouchTimer: 0, landingTimer: 0, running: false, moving: false };
  guard = GameWorld.makeGuard();
  static makeGuard() { return new Guard({x:840,dir:-1,min:545,max:870,speed:76,range:250,hearing:180,pause:1.5,edgeRate:24}); }
  suspicion = 0; muted = false; interference = 0; jammerUsed = false; note = 'Find the keycard and reach the east wing.';
  pickups: Pickup[] = [
    {x: 240, y: 390, kind:'evidence', id:0, label:'VISITOR LOG — Fiona signed in on the 14th. No matching sign-out.', taken:false},
    {x: 450, y: 390, kind:'evidence', id:1, label:'CRUMPLED NOTE — “They moved her to the east wing. Don’t ask at the desk.”', taken:false},
    {x: 590, y: 390, kind:'evidence', id:2, label:'INTAKE FORM — Consent line signed by staff, not by her.', taken:false},
    {x: 765, y: 390, kind:'key', id:3, label:'STAFF KEYCARD — Ward access. The magnetic strip is still warm.', taken:false},
  ];
  keys = new Set<string>(); demo = false; jumpBuffer = 0;

  start(demo = false) { this.demo = demo; this.mode = 'play'; this.reset(); }
  reset() { this.jumpBuffer=0; this.time=0; this.lastX=110; this.player = {x:110,y:366,vy:0,facing:1,hidden:false,crouching:false,crouchTimer:0,landingTimer:0,running:false,moving:false}; this.guard=GameWorld.makeGuard(); this.suspicion=0; this.interference=0; this.jammerUsed=false; this.note='Find the keycard and reach the east wing.'; this.pickups.forEach(p=>p.taken=false); }
  evidenceCount() { return this.pickups.filter(p=>p.kind==='evidence' && p.taken).length; }
  hasKey() { return this.pickups.some(p=>p.kind==='key' && p.taken); }
  cameraSafeZoneName() { if(this.player.x<210) return 'RECEPTION DESK'; if(this.player.x>=476 && this.player.x<=550) return 'CART SHADOW'; if(this.player.x>=800 && this.player.x<=875) return 'LOCKER POCKET'; return null; }
  // The renderer draws exactly this cone, so what the player sees is what the camera sees.
  cameraSweep(t=this.time) { return Math.sin(t*2*Math.PI/6.2)*0.72; }
  cameraBeam(t=this.time) { const a=this.cameraSweep(t); return { left: 690+Math.sin(a-.18)*250, right: 690+Math.sin(a+.18)*250 }; }
  cameraSeesPlayer() { const beam=this.cameraBeam(); return !this.player.hidden && !this.cameraSafeZoneName() && !this.player.crouching && this.player.x+10>=beam.left && this.player.x-10<=beam.right && this.player.y>300; }
  press(key:string) { if (key.toLowerCase()==='m') { this.muted=!this.muted; return; } if (this.mode!=='play') return; this.keys.add(key.toLowerCase()); if (isJumpKey(key.toLowerCase())) this.jumpBuffer=JUMP_BUFFER; if (key.toLowerCase()==='e' && this.mode==='play') { const spot = this.nearHide(); if (spot && !this.player.hidden && !this.player.crouching) { this.player.crouching=true; this.player.crouchTimer=.22; } else if (spot && this.player.hidden) { this.player.hidden=false; this.player.crouching=false; } } }
  release(key:string) { this.keys.delete(key.toLowerCase()); }
  readonly hideSpots: Cover[] = [{x:36,w:149},{x:328,w:84},{x:835,w:81}];
  nearHide() { return this.hideSpots.some(c=>this.player.x>=c.x&&this.player.x<=c.x+c.w); }
  safeZoneAt(x:number) { return x<210 || (x>=476&&x<=550) || (x>=800&&x<=875); }
  // --- autopilot view
  watchers() { return [this.guard]; }
  covers() { return this.hideSpots; }
  hazardAt(x:number, lookahead:number) { if(this.interference>lookahead||this.safeZoneAt(x)) return false; for(let t=0;t<=lookahead;t+=.1){ const b=this.cameraBeam(this.time+t); if(x+10>=b.left&&x-10<=b.right) return true; } return false; }
  goal(): Goal { const next=this.pickups.filter(p=>!p.taken).sort((a,b)=>a.x-b.x)[0]; return next?{x:next.x,reach:14}:{x:905,reach:20}; }
  nearJammer() { return Math.abs(this.player.x-704)<42 && !this.player.hidden && !this.player.crouching; }
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
    this.player.x=Math.max(36,Math.min(916,this.player.x));
    const seen={x:this.player.x,hidden:this.player.hidden||this.player.crouching,running:this.player.running};
    const guardRate=this.guard.update(dt,seen);
    const cameraSees=this.interference<=0 && this.cameraSeesPlayer();
    const sees=guardRate>0&&this.guard.sees(seen), heard=guardRate>0&&!sees;
    if(guardRate>0) this.suspicion=Math.min(100,this.suspicion+dt*guardRate);
    if(cameraSees) this.suspicion=Math.min(100,this.suspicion+dt*22);
    if(guardRate===0 && !cameraSees) this.suspicion=Math.max(0,this.suspicion-dt*(this.player.hidden?30:18));
    if(sees || heard) this.note='YOU ARE EXPOSED — break line of sight.';
    else if(this.interference>0) this.note=`CAMERA JAMMED — GUARD INVESTIGATING — ${this.interference.toFixed(1)}s.`;
    else if(cameraSees) this.note='CAMERA SWEEP — hide or wait for it to pass.';
    else if(this.cameraSafeZoneName()) this.note=`${this.cameraSafeZoneName()} — CAMERA SAFE.`;
    else if(!this.player.hidden && this.guard.state==='patrol' && Math.sign(this.player.x-this.guard.x)===this.guard.dir && Math.abs(this.player.x-this.guard.x)<430) this.note=this.nearHide()?'HE’S COMING — press E to hide here.':'HE’S COMING — get to cover (the desk, the chairs, the lockers).';
    else if(this.player.hidden && this.guard.state==='patrol') this.note=Math.sign(this.player.x-this.guard.x)!==this.guard.dir?'His back is turned — E to step out and follow.':'Stay hidden. Let him pass.';
    else if(this.suspicion<15) this.note='Observe the patrol. Move when his back is turned.';
    this.player.moving=Math.abs(this.player.x-this.lastX)>0.01; this.lastX=this.player.x;
    for(const p of this.pickups) if(!p.taken && Math.abs(this.player.x-p.x)<this.playerHalfWidth+10 && this.player.y>=340){p.taken=true;this.note=p.label;}
    if(this.suspicion>=100){this.mode='lose';this.note='The monitors flatline. Saint Cross has seen you.';}
    if(this.hasKey() && this.evidenceCount()===3 && this.player.x>875){this.mode='win';this.note='EAST WING UNLOCKED — Fiona was here.';}
  }
  interact() { if(this.mode!=='play' || !this.nearJammer() || this.jammerUsed) return; this.jammerUsed=true; this.interference=5.5; this.guard.investigate(704,this.interference); this.note='SIGNAL JAMMED — THE GUARD IS CHECKING THE CONSOLE.'; }
  private runDemo(){ autopilot(this); }
}
