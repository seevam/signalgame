import {GRAVITY,JUMP_VELOCITY} from './physics';
export type CorridorMode='title'|'play'|'win'|'lose';
export type CorridorPickup={x:number;kind:'evidence'|'key';label:string;taken:boolean};
export type HideSpot={x:number;w:number;label:string};
export type Barrier={x:number;w:number;top:number};

const CAMERA_X=1000;

export class CorridorWorld {
  readonly width=2000; readonly height=540; readonly floorY=410; readonly playerHalfWidth=18; readonly playerHalfHeight=44; cameraX=0;
  mode:CorridorMode='title'; time=0; suspicion=0; stealth=100; muted=false; note='Reach the east wing through the corridor.'; demo=false;
  player={x:90,y:366,vy:0,facing:1,hidden:false,crouching:false,crouchTimer:0,landingTimer:0,running:false};
  guards=[{x:360,dir:1,state:'patrol' as 'patrol'|'alert'},{x:1600,dir:-1,state:'patrol' as 'patrol'|'alert'}];
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
  keys=new Set<string>();
  start(demo=false){this.demo=demo;this.mode='play';this.reset();}
  reset(){this.mode='play';this.time=0;this.cameraX=0;this.player={x:90,y:366,vy:0,facing:1,hidden:false,crouching:false,crouchTimer:0,landingTimer:0,running:false};this.guards=[{x:360,dir:1,state:'patrol'},{x:1600,dir:-1,state:'patrol'}];this.suspicion=0;this.stealth=100;this.note='Reach the east wing through the corridor.';this.pickups.forEach(p=>p.taken=false);}
  evidenceCount(){return this.pickups.filter(p=>p.kind==='evidence'&&p.taken).length;}
  hasKey(){return this.pickups.some(p=>p.kind==='key'&&p.taken);}
  nearHide(){return this.hideSpots.find(s=>this.player.x>=s.x&&this.player.x<=s.x+s.w)??null;}
  // Ceiling camera over the middle zone. Mounted above cover height: only a true hide spot beats it.
  cameraBeam(){const center=CAMERA_X+Math.sin(this.time*2*Math.PI/6.2)*250;return {origin:CAMERA_X,left:center-48,right:center+48};}
  cameraSeesPlayer(){const b=this.cameraBeam();return !this.player.hidden&&this.player.x+10>=b.left&&this.player.x-10<=b.right;}
  // Floor height under a point, accounting for barrier tops the player can stand on.
  private surfaceAt(x:number){let top=this.floorY;for(const b of this.barriers)if(x+6>b.x&&x-6<b.x+b.w)top=Math.min(top,b.top);return top;}
  private grounded(){return this.player.y+this.playerHalfHeight>=this.surfaceAt(this.player.x)-0.5&&this.player.vy>=0;}
  press(key:string){const k=key.toLowerCase();if(k==='m'){this.muted=!this.muted;return;}if(this.mode!=='play')return;this.keys.add(k);if(k==='e'&&this.grounded()&&(this.player.hidden||this.nearHide()))this.player.hidden=!this.player.hidden;}
  release(key:string){this.keys.delete(key.toLowerCase());}
  step(dt:number){
    if(this.mode!=='play')return;
    this.time+=dt;
    if(this.demo)this.runDemo();
    const left=this.keys.has('a')||this.keys.has('arrowleft');const right=this.keys.has('d')||this.keys.has('arrowright');const run=this.keys.has('shift');this.player.running=run;
    if(!this.player.hidden){
      const axis=(right?1:0)-(left?1:0);if(axis)this.player.facing=axis;
      let nx=this.player.x+axis*(run?190:112)*dt;
      // Barriers block anyone whose feet are below the barrier top.
      const feet=this.player.y+this.playerHalfHeight;
      for(const b of this.barriers){if(feet>b.top+1&&nx+6>b.x&&nx-6<b.x+b.w){nx=this.player.x<=b.x?b.x-6:b.x+b.w+6;}}
      this.player.x=Math.max(35,Math.min(1930,nx));
      if((this.keys.has(' ')||this.keys.has('w')||this.keys.has('arrowup'))&&this.grounded())this.player.vy=JUMP_VELOCITY;
      this.player.vy+=GRAVITY*dt;this.player.y+=this.player.vy*dt;
      const surface=this.surfaceAt(this.player.x);
      if(this.player.y+this.playerHalfHeight>=surface&&this.player.vy>=0){this.player.y=surface-this.playerHalfHeight;this.player.vy=0;}
    }
    const cameraTarget=Math.max(0,Math.min(1040,this.player.x-420));this.cameraX+=(cameraTarget-this.cameraX)*Math.min(1,dt*8);
    let seen=false;
    this.guards.forEach((g,i)=>{const min=i===0?170:1300,max=i===0?656:1830;
      if(g.state!=='alert'){g.x+=g.dir*(i===0?74:88)*dt;if(g.x<min){g.x=min;g.dir=1;}if(g.x>max){g.x=max;g.dir=-1;}}
      const dist=Math.abs(this.player.x-g.x);
      const sees=!this.player.hidden&&dist<250&&Math.sign(this.player.x-g.x)===g.dir;
      const heard=!this.player.hidden&&this.player.running&&dist<190;
      if(sees||heard){g.state='alert';if(heard&&!sees)g.dir=Math.sign(this.player.x-g.x)||g.dir;seen=true;this.suspicion=Math.min(100,this.suspicion+dt*32);}
      else g.state='patrol';});
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
  private runDemo(){
    this.keys.clear();
    if(this.player.hidden){if(this.suspicion<5&&!this.cameraSeesPlayer())this.press('e');return;}
    if(this.suspicion>40&&this.nearHide()){this.press('e');return;}
    const target=this.pickups.find(p=>!p.taken)?.x??1930;
    if(this.player.x<target-8)this.keys.add('d');else if(this.player.x>target+8)this.keys.add('a');
    const ahead=this.keys.has('d')?1:-1;
    if(this.barriers.some(b=>ahead>0?b.x-this.player.x>0&&b.x-this.player.x<34:this.player.x-(b.x+b.w)>0&&this.player.x-(b.x+b.w)<34))this.keys.add(' ');
  }
}
