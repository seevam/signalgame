export type GameMode = 'title' | 'play' | 'win' | 'lose';
export type PickupKind = 'evidence' | 'key';
export type Pickup = { x:number; y:number; kind:PickupKind; id:number; label:string; taken:boolean };

export class GameWorld {
  readonly width = 960; readonly height = 540; readonly floorY = 410; readonly playerHalfWidth = 18; readonly playerHalfHeight = 44;
  mode: GameMode = 'title';
  time = 0; lastTime = 0;
  player = { x: 110, y: 366, vy: 0, facing: 1, hidden: false, crouching: false, crouchTimer: 0, landingTimer: 0, running: false };
  guard = { x: 650, y: 365, dir: -1, state: 'patrol' as 'patrol'|'investigate'|'alert', alertTimer: 0, investigateTimer: 0 };
  suspicion = 0; muted = false; interference = 0; jammerUsed = false; note = 'Find the keycard and reach the east wing.';
  pickups: Pickup[] = [
    {x: 240, y: 390, kind:'evidence', id:0, label:'VISITOR LOG — Fiona signed in on the 14th. No matching sign-out.', taken:false},
    {x: 450, y: 390, kind:'evidence', id:1, label:'CRUMPLED NOTE — “They moved her to the east wing. Don’t ask at the desk.”', taken:false},
    {x: 590, y: 390, kind:'evidence', id:2, label:'INTAKE FORM — Consent line signed by staff, not by her.', taken:false},
    {x: 765, y: 390, kind:'key', id:3, label:'STAFF KEYCARD — Ward access. The magnetic strip is still warm.', taken:false},
  ];
  keys = new Set<string>(); demo = false;

  start(demo = false) { this.demo = demo; this.mode = 'play'; this.reset(); }
  reset() { this.player = {x:110,y:366,vy:0,facing:1,hidden:false,crouching:false,crouchTimer:0,landingTimer:0,running:false}; this.guard={x:650,y:365,dir:-1,state:'patrol',alertTimer:0,investigateTimer:0}; this.suspicion=0; this.interference=0; this.jammerUsed=false; this.note='Find the keycard and reach the east wing.'; this.pickups.forEach(p=>p.taken=false); }
  evidenceCount() { return this.pickups.filter(p=>p.kind==='evidence' && p.taken).length; }
  hasKey() { return this.pickups.some(p=>p.kind==='key' && p.taken); }
  cameraSafeZoneName() { if(this.player.x<210) return 'RECEPTION DESK'; if(this.player.x>=476 && this.player.x<=550) return 'CART SHADOW'; if(this.player.x>=800 && this.player.x<=875) return 'LOCKER POCKET'; return null; }
  cameraSeesPlayer() { const beamCenter=690+Math.sin(this.time*2*Math.PI/6.2)*250; return !this.player.hidden && !this.cameraSafeZoneName() && !this.player.crouching && Math.abs(this.player.x-beamCenter)<72 && this.player.y>300; }
  press(key:string) { if (key.toLowerCase()==='m') { this.muted=!this.muted; return; } if (this.mode!=='play') return; this.keys.add(key.toLowerCase()); if (key.toLowerCase()==='e' && this.mode==='play') { const spot = this.nearHide(); if (spot && !this.player.hidden && !this.player.crouching) { this.player.crouching=true; this.player.crouchTimer=.22; } else if (spot && this.player.hidden) { this.player.hidden=false; this.player.crouching=false; } } }
  release(key:string) { this.keys.delete(key.toLowerCase()); }
  nearHide() { return (this.player.x < 185 || Math.abs(this.player.x-370)<42 || this.player.x>835) ? true : false; }
  nearJammer() { return Math.abs(this.player.x-704)<42 && !this.player.hidden && !this.player.crouching; }
  step(dt:number) {
    if (this.mode!=='play') return;
    this.time += dt;
    this.interference=Math.max(0,this.interference-dt);
    if (this.demo) this.runDemo();
    const left=this.keys.has('a')||this.keys.has('arrowleft'); const right=this.keys.has('d')||this.keys.has('arrowright');
    const run=this.keys.has('shift'); this.player.running=run;
    if(this.player.crouchTimer>0){this.player.crouchTimer=Math.max(0,this.player.crouchTimer-dt);if(this.player.crouchTimer===0){this.player.crouching=false;this.player.hidden=true;}}
    if(this.player.landingTimer>0)this.player.landingTimer=Math.max(0,this.player.landingTimer-dt);
    if (!this.player.hidden && !this.player.crouching) {
      const speed=run?190:112; const axis=(right?1:0)-(left?1:0); this.player.x += axis*speed*dt; if(axis) this.player.facing=axis;
      if ((this.keys.has(' ')||this.keys.has('w')||this.keys.has('arrowup')) && this.player.y>=this.floorY-this.playerHalfHeight) this.player.vy=-245;
      this.player.vy += 700*dt; this.player.y += this.player.vy*dt; if(this.player.y>this.floorY-this.playerHalfHeight){if(this.player.vy>0)this.player.landingTimer=.16;this.player.y=this.floorY-this.playerHalfHeight;this.player.vy=0;}
    }
    this.player.x=Math.max(36,Math.min(916,this.player.x));
    if(this.interference>0 && this.guard.state!=='alert') { this.guard.state='investigate'; this.guard.investigateTimer=this.interference; }
    if(this.guard.state==='investigate') {
      const delta=704-this.guard.x;
      if(Math.abs(delta)>6) { this.guard.dir=Math.sign(delta); this.guard.x+=this.guard.dir*Math.min(112*dt,Math.abs(delta)); }
      else this.guard.x=704;
      if(this.interference<=0) { this.guard.state='patrol'; this.guard.investigateTimer=0; }
    } else {
      this.guard.x += this.guard.dir*76*dt;
      if(this.guard.x<545){this.guard.x=545;this.guard.dir=1;} if(this.guard.x>870){this.guard.x=870;this.guard.dir=-1;}
    }
    const sees = !this.player.hidden && Math.abs(this.player.x-this.guard.x)<250 && Math.sign(this.player.x-this.guard.x)===this.guard.dir;
    const cameraSees=this.interference<=0 && this.cameraSeesPlayer();
    if(cameraSees) this.suspicion=Math.min(100,this.suspicion+dt*22);
    if(sees || (this.player.running && Math.abs(this.player.x-this.guard.x)<180)) { this.suspicion=Math.min(100,this.suspicion+dt*32); this.guard.state='alert'; this.guard.alertTimer=2.2; this.note='YOU ARE EXPOSED — break line of sight.'; }
    else if(this.interference>0) this.note=`CAMERA JAMMED — GUARD INVESTIGATING — ${this.interference.toFixed(1)}s.`;
    else if(cameraSees) this.note='CAMERA SWEEP — hide or wait for it to pass.';
    else if(this.cameraSafeZoneName()) this.note=`${this.cameraSafeZoneName()} — CAMERA SAFE.`;
    else { this.suspicion=Math.max(0,this.suspicion-dt*18); if(this.guard.alertTimer>0) this.guard.alertTimer-=dt; else if(this.guard.state!=='investigate') this.guard.state='patrol'; if(this.suspicion<15 && this.interference<=0) this.note='Observe the patrol. Move when the lane turns.'; }
    for(const p of this.pickups) if(!p.taken && Math.abs(this.player.x-p.x)<this.playerHalfWidth+10 && this.player.y>=340){p.taken=true;this.note=p.label;}
    if(this.suspicion>=100){this.mode='lose';this.note='The monitors flatline. Saint Cross has seen you.';}
    if(this.hasKey() && this.evidenceCount()===3 && this.player.x>875){this.mode='win';this.note='EAST WING UNLOCKED — Fiona was here.';}
  }
  interact() { if(this.mode!=='play' || !this.nearJammer() || this.jammerUsed) return; this.jammerUsed=true; this.interference=5.5; this.guard.state='investigate'; this.guard.investigateTimer=this.interference; this.note='SIGNAL JAMMED — THE GUARD IS CHECKING THE CONSOLE.'; }
  private runDemo(){
    this.keys.clear();
    const target=this.pickups.find(p=>!p.taken)?.x ?? 900;
    if(this.player.x<target-8) this.keys.add('d'); else if(this.player.x>target+8) this.keys.add('a');
    if(this.player.x>875 && this.hasKey() && this.evidenceCount()===3) this.keys.add('d');
  }
}
