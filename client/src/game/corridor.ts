export type CorridorMode='title'|'play'|'win'|'lose';
export type CorridorPickup={x:number;kind:'evidence'|'key';label:string;taken:boolean};

export class CorridorWorld {
  readonly width=2000; readonly height=540; readonly floorY=410; readonly playerHalfWidth=18; readonly playerHalfHeight=44; cameraX=0;
  mode:CorridorMode='title'; time=0; suspicion=0; muted=false; note='Reach the east wing through the corridor.'; demo=false;
  player={x:90,y:366,vy:0,facing:1,hidden:false,crouching:false,crouchTimer:0,landingTimer:0,running:false};
  guards=[{x:360,dir:1,state:'patrol' as 'patrol'|'alert'},{x:1600,dir:-1,state:'patrol' as 'patrol'|'alert'}];
  pickups:CorridorPickup[]=[
    {x:250,kind:'evidence',label:'TRANSFER ORDER — Fiona moved east without a physician signature.',taken:false},
    {x:930,kind:'evidence',label:'SHIFT LOG — Two nights have been torn out completely.',taken:false},
    {x:1450,kind:'evidence',label:'DOSAGE SHEET — The compound is not on any formulary.',taken:false},
    {x:1780,kind:'key',label:'WARD KEY — The tag is stamped EAST WING.',taken:false},
  ];
  keys=new Set<string>();
  start(demo=false){this.demo=demo;this.mode='play';this.reset();}
  reset(){this.player={x:90,y:366,vy:0,facing:1,hidden:false,crouching:false,crouchTimer:0,landingTimer:0,running:false};this.guards=[{x:360,dir:1,state:'patrol'},{x:1600,dir:-1,state:'patrol'}];this.suspicion=0;this.note='Reach the east wing through the corridor.';this.pickups.forEach(p=>p.taken=false);}
  evidenceCount(){return this.pickups.filter(p=>p.kind==='evidence'&&p.taken).length;}
  hasKey(){return this.pickups.some(p=>p.kind==='key'&&p.taken);}
  cameraSafeZoneName(){if(this.player.x>650&&this.player.x<1120)return 'CAMERA BLIND SPOT';if(this.player.x>1320&&this.player.x<1420)return 'WALL RECESS';return null;}
  nearHide(){return this.cameraSafeZoneName()!==null;}
  toggleJournal(){if(this.mode==='play')this.mode='title';else if(this.mode==='title')this.mode='play';}
  press(key:string){const k=key.toLowerCase();this.keys.add(k);if(k==='m')this.muted=!this.muted;if(k==='e'&&this.mode==='play'&&this.nearHide())this.player.hidden=!this.player.hidden;}
  release(key:string){this.keys.delete(key.toLowerCase());}
  step(dt:number){if(this.mode!=='play')return;this.time+=dt;if(this.demo)this.runDemo();const left=this.keys.has('a')||this.keys.has('arrowleft');const right=this.keys.has('d')||this.keys.has('arrowright');const run=this.keys.has('shift');this.player.running=run;if(!this.player.hidden){const axis=(right?1:0)-(left?1:0);this.player.x+=axis*(run?190:112)*dt;if(axis)this.player.facing=axis;if((this.keys.has(' ')||this.keys.has('w')||this.keys.has('arrowup'))&&this.player.y>=this.floorY-this.playerHalfHeight)this.player.vy=-245;this.player.vy+=700*dt;this.player.y+=this.player.vy*dt;if(this.player.y>this.floorY-this.playerHalfHeight)this.player.y=this.floorY-this.playerHalfHeight,this.player.vy=0;}this.player.x=Math.max(35,Math.min(1930,this.player.x));const cameraTarget=Math.max(0,Math.min(1040,this.player.x-420));this.cameraX+=(cameraTarget-this.cameraX)*Math.min(1,dt*8);
    this.guards.forEach((g,i)=>{const min=i===0?170:1300,max=i===0?656:1830;g.x+=g.dir*(i===0?74:88)*dt;if(g.x<min){g.x=min;g.dir=1;}if(g.x>max){g.x=max;g.dir=-1;}const sees=!this.player.hidden&&Math.abs(this.player.x-g.x)<250&&Math.sign(this.player.x-g.x)===g.dir;if(sees||(this.player.running&&Math.abs(this.player.x-g.x)<190)){g.state='alert';this.suspicion=Math.min(100,this.suspicion+dt*32);this.note='YOU ARE EXPOSED — break line of sight.';}else g.state='patrol';});
    if(this.cameraSafeZoneName())this.note=`${this.cameraSafeZoneName()} — TIME THE CAMERA.`;else if(this.suspicion<15)this.note='Two patrols. Use the barriers and move between their lanes.';else this.suspicion=Math.max(0,this.suspicion-dt*15);
    this.pickups.forEach(p=>{if(!p.taken&&Math.abs(this.player.x-p.x)<this.playerHalfWidth+10){p.taken=true;this.note=p.label;}});if(this.suspicion>=100){this.mode='lose';this.note='The corridor lights snap on. Security has you.';}if(this.hasKey()&&this.evidenceCount()===3&&this.player.x>1900){this.mode='win';this.note='WARD ACCESS CONFIRMED — The patient wing is ahead.';}
  }
  private runDemo(){this.keys.clear();const target=this.pickups.find(p=>!p.taken)?.x??1930;if(this.player.x<target-8)this.keys.add('d');else if(this.player.x>target+8)this.keys.add('a');if(this.nearHide()&&this.player.x>700&&this.player.x<1200)this.keys.add('e');}
}
