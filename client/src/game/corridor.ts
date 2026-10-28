import {GRAVITY,JUMP_BUFFER,JUMP_VELOCITY,isJumpKey} from './physics';
import {Guard} from './stealth';
import {autopilot,type Goal,type StealthStage} from './autopilot';
export type CorridorMode='title'|'play'|'win'|'lose';
export type CorridorPickup={x:number;kind:'evidence'|'key';label:string;taken:boolean};
export type HideSpot={x:number;w:number;label:string};
export type Barrier={x:number;w:number;top:number};

const CAMERA_X=1000;

export class CorridorWorld implements StealthStage {
  readonly width=2000; readonly height=540; readonly floorY=410; readonly playerHalfWidth=18; readonly playerHalfHeight=44; cameraX=0;
  mode:CorridorMode='title'; time=0; suspicion=0; stealth=100; muted=false; note='Reach the east wing through the corridor.'; demo=false;
  player={x:90,y:366,vy:0,facing:1,hidden:false,crouching:false,crouchTimer:0,landingTimer:0,running:false};
  guards=CorridorWorld.makeGuards();
  static makeGuards(){return [new Guard({x:360,dir:1,min:170,max:656,speed:74}),new Guard({x:1600,dir:-1,min:1300,max:1830,speed:88})];}
  // Two waist-high barriers split the corridor into three zones and bound both guard lanes.
  readonly barriers:Barrier[]=[{x:668,w:26,top:370},{x:1270,w:26,top:370}];
  readonly hideSpots:HideSpot[]=[
    {x:84,w:70,label:'JANITOR ALCOVE'},
    {x:414,w:70,label:'UNDER THE GURNEY'},
    {x:960,w:70,label:'LINEN CART'},
    {x:1330,w:70,label:'WALL RECESS'},
    {x:1680,w:64,label:'SUPPLY LOCKER'},
  ];
  pickups:CorridorPickup[]=[
    {x:250,kind:'evidence',label:'TRANSFER ORDER — Fiona moved east without a physician signature.',taken:false},
    {x:900,kind:'evidence',label:'SHIFT LOG — Two nights have been torn out completely.',taken:false},
    {x:1450,kind:'evidence',label:'DOSAGE SHEET — The compound is not on any formulary.',taken:false},
    {x:1780,kind:'key',label:'WARD KEY — The tag is stamped EAST WING.',taken:false},
  ];
  keys=new Set<string>();jumpBuffer=0;
  start(demo=false){this.demo=demo;this.mode='play';this.reset();}
  reset(){this.jumpBuffer=0;this.mode='play';this.time=0;this.cameraX=0;this.player={x:90,y:366,vy:0,facing:1,hidden:false,crouching:false,crouchTimer:0,landingTimer:0,running:false};this.guards=CorridorWorld.makeGuards();this.suspicion=0;this.stealth=100;this.note='Reach the east wing through the corridor.';this.pickups.forEach(p=>p.taken=false);}
  evidenceCount(){return this.pickups.filter(p=>p.kind==='evidence'&&p.taken).length;}
  hasKey(){return this.pickups.some(p=>p.kind==='key'&&p.taken);}
  nearHide(){return this.hideSpots.find(s=>this.player.x>=s.x&&this.player.x<=s.x+s.w)??null;}
  // Ceiling camera over the middle zone. Mounted above cover height: only a true hide spot beats it.
  cameraBeam(t=this.time){const center=CAMERA_X+Math.sin(t*2*Math.PI/6.2)*250;return {origin:CAMERA_X,left:center-48,right:center+48};}
  // --- autopilot view
  watchers(){return this.guards;}
  covers(){return this.hideSpots;}
  hazardAt(x:number,lookahead:number){for(let t=0;t<=lookahead;t+=.1){const b=this.cameraBeam(this.time+t);if(x+10>=b.left&&x-10<=b.right)return true;}return false;}
  goal():Goal{const next=this.pickups.filter(p=>!p.taken).sort((a,b)=>a.x-b.x)[0];return next?{x:next.x,reach:14}:{x:1915,reach:12};}
  cameraSeesPlayer(){const b=this.cameraBeam();return !this.player.hidden&&this.player.x+10>=b.left&&this.player.x-10<=b.right;}
  // Floor height under a point, accounting for barrier tops the player can stand on.
  private surfaceAt(x:number){let top=this.floorY;for(const b of this.barriers)if(x+6>b.x&&x-6<b.x+b.w)top=Math.min(top,b.top);return top;}
  private grounded(){return this.player.y+this.playerHalfHeight>=this.surfaceAt(this.player.x)-0.5&&this.player.vy>=0;}
  press(key:string){const k=key.toLowerCase();if(k==='m'){this.muted=!this.muted;return;}if(this.mode!=='play')return;this.keys.add(k);if(isJumpKey(k))this.jumpBuffer=JUMP_BUFFER;if(k==='e'&&this.grounded()&&(this.player.hidden||this.nearHide()))this.player.hidden=!this.player.hidden;}
  release(key:string){this.keys.delete(key.toLowerCase());}
  step(dt:number){
    if(this.mode!=='play')return;
    this.time+=dt;this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
    if(this.demo)this.runDemo();
    const left=this.keys.has('a')||this.keys.has('arrowleft');const right=this.keys.has('d')||this.keys.has('arrowright');const run=this.keys.has('shift');this.player.running=run;
    if(!this.player.hidden){
      const axis=(right?1:0)-(left?1:0);if(axis)this.player.facing=axis;
      let nx=this.player.x+axis*(run?190:112)*dt;
      // Barriers block anyone whose feet are below the barrier top.
      const feet=this.player.y+this.playerHalfHeight;
      for(const b of this.barriers){if(feet>b.top+1&&nx+6>b.x&&nx-6<b.x+b.w){nx=this.player.x<=b.x?b.x-6:b.x+b.w+6;}}
      this.player.x=Math.max(35,Math.min(1930,nx));
      if((this.keys.has(' ')||this.keys.has('w')||this.keys.has('arrowup')||this.jumpBuffer>0)&&this.grounded()){this.player.vy=JUMP_VELOCITY;this.jumpBuffer=0;}
      this.player.vy+=GRAVITY*dt;this.player.y+=this.player.vy*dt;
      const surface=this.surfaceAt(this.player.x);
      if(this.player.y+this.playerHalfHeight>=surface&&this.player.vy>=0){this.player.y=surface-this.playerHalfHeight;this.player.vy=0;}
    }
    const cameraTarget=Math.max(0,Math.min(1040,this.player.x-420));this.cameraX+=(cameraTarget-this.cameraX)*Math.min(1,dt*8);
    const watched={x:this.player.x,hidden:this.player.hidden,running:this.player.running};
    let guardRate=0;for(const g of this.guards)guardRate+=g.update(dt,watched);
    const seen=guardRate>0;if(seen)this.suspicion=Math.min(100,this.suspicion+dt*guardRate);
    const cameraSees=this.cameraSeesPlayer();
    if(cameraSees)this.suspicion=Math.min(100,this.suspicion+dt*22);
    if(!seen&&!cameraSees)this.suspicion=Math.max(0,this.suspicion-dt*(this.player.hidden?30:15));
    this.stealth=Math.max(0,100-this.suspicion);
    const spot=this.nearHide();
    if(seen)this.note='YOU ARE EXPOSED — break line of sight.';
    else if(cameraSees)this.note='CAMERA SWEEP — find a hiding spot or wait for it to pass.';
    else if(this.player.hidden)this.note=`HIDDEN — ${spot?.label??'COVER'}. E to leave.`;
    else if(spot)this.note=`${spot.label} — E to hide.`;
    else if(this.suspicion<15)this.note='Two patrols and a camera. Jump the barriers with SPACE.';
    this.pickups.forEach(p=>{if(!p.taken&&Math.abs(this.player.x-p.x)<this.playerHalfWidth+10&&this.player.y>=this.floorY-this.playerHalfHeight-4){p.taken=true;this.note=p.label;}});
    if(this.suspicion>=100){this.mode='lose';this.note='The corridor lights snap on. Security has you.';}
    if(this.hasKey()&&this.evidenceCount()===3&&this.player.x>1900){this.mode='win';this.note='WARD ACCESS CONFIRMED — The patient wing is ahead.';}
  }
  private runDemo(){autopilot(this);}
}
