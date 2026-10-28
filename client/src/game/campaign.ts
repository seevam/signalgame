import {GRAVITY,JUMP_BUFFER,JUMP_VELOCITY,isJumpKey} from './physics';
import {Guard,sightRate} from './stealth';
import {autopilot,type Cover,type Goal,type StealthStage} from './autopilot';
export type CampaignMode='title'|'play'|'win'|'lose';

// Stages 5–9. Each has its own guards, cover and one signature mechanic:
//   5 Doctor's Office   ankle-height tripwires to jump; tripping one sends the guard to check it;
//                       a one-use override switches them off for a few seconds
//   6 Laboratory        two technicians who stop to write notes at their stations
//   7 Basement Storage  darkness and torches; lights are a choice; the rescued patient follows you
//   8 Server Room       an elite guard sweeps across the terminal — upload in pieces between sweeps
//   9 Director's Office he glances back — freeze; taking the authorization trips the alarm and you
//                       must force the roof door before the guard reaches you

type Doc={x:number;label:string;taken:boolean};
type Spot=Cover&{label:string};
export type Wire={x:number};

export const EXIT_X=1560;
export const UPLOAD_SECONDS=30;
export const OVERRIDE_SECONDS=5;
export const ROOF_ALARM=15;
export const ROOF_FORCE=2;
const WIRE_HEIGHT=26;
const TERMINAL_X=850, SWITCH_X=480, PATIENT_X=1120, CONTROL_X=520, DESK_X=1000, ROOF_X=1590;

type StageDef={objective:string;docs:[number,string][];hides:Spot[];guards:()=>Guard[];key?:{x:number;label:string}};
const DEFS:Record<number,StageDef>={
  5:{objective:'Jump the tripwires — or spend the one override — and take the authorization.',
    docs:[[400,'APPOINTMENT BOOK — Fiona was seen by a doctor who does not exist on staff.'],[820,'PRESCRIPTION PAD — The same compound, signed three different ways.'],[1330,'CONSENT FORM — Dated two days after the treatment began.']],
    hides:[{x:290,w:80,label:'BOOKSHELF'},{x:1090,w:70,label:'DESK'},{x:1480,w:60,label:'CURTAIN'}],
    guards:()=>[new Guard({x:1300,dir:-1,min:1000,max:1460,speed:66,range:230,edgeRate:38})],
    key:{x:1200,label:'AUTHORIZATION SLIP — A director’s signature, dated before the consent form.'}},
  6:{objective:'Two technicians are working late. Take the log and the sample while their backs are turned.',
    docs:[[560,'EXPERIMENT LOG — Subject seven stopped responding on the fourth night.'],[980,'SAMPLE MANIFEST — Two vials left the building unrecorded.'],[1250,'CLINICAL NOTE — “Discontinue observation. Move her downstairs.”']],
    hides:[{x:250,w:70,label:'LOCKERS'},{x:620,w:70,label:'SPECIMEN SHELF'},{x:1060,w:70,label:'FUME HOOD'},{x:1420,w:70,label:'COLD STORE'}],
    guards:()=>[new Guard({x:700,dir:1,min:480,max:900,speed:48,range:170,hearing:140,pause:3}),new Guard({x:1200,dir:-1,min:900,max:1320,speed:48,range:170,hearing:140,pause:3})],
    key:{x:1380,label:'SAMPLE — Experiment Seven, still cold.'}},
  7:{objective:'Find the patient in the dark and bring them out. The lights help you — and the torches.',
    docs:[[400,'STORAGE INVENTORY — A bed was signed out to a room with no number.'],[900,'MAINTENANCE SLIP — The basement lights were cut on purpose.'],[1260,'PATIENT BAND — Cut off and left on the floor.']],
    hides:[{x:290,w:80,label:'RACKS'},{x:760,w:70,label:'CRATES'},{x:1040,w:60,label:'BOILER'},{x:1330,w:70,label:'SEALED ROOM'}],
    guards:()=>[new Guard({x:900,dir:-1,min:620,max:1000,speed:58,range:150}),new Guard({x:1300,dir:1,min:1180,max:1520,speed:58,range:150})]},
  8:{objective:'Upload the files. The elite guard sweeps over the terminal — hide, then pick up where you left off.',
    docs:[[420,'SERVER TICKET — Backups were wiped from a terminal in this room.'],[1000,'ACCESS LOG — Someone signed in as Fiona after she disappeared.'],[1300,'MAIL DRAFT — “If this gets out, we are all finished.”']],
    hides:[{x:200,w:60,label:'DOORWAY'},{x:770,w:56,label:'SERVER RACK'},{x:1150,w:60,label:'COLD AISLE'},{x:1400,w:56,label:'CABLE TRAY'}],
    guards:()=>[new Guard({x:1300,dir:-1,min:700,max:1500,speed:92,range:290,hearing:0,pause:1})]},
  9:{objective:'He is at his desk. Move only while his back is turned. Take the signed authorization.',
    docs:[[420,'DESK MEMO — The director approved every transfer personally.'],[700,'SEALED FOLDER — Saint Cross has done this eleven times before.']],
    hides:[{x:290,w:70,label:'COAT STAND'},{x:560,w:60,label:'BOOKCASE'},{x:820,w:60,label:'DRAPES'},{x:1250,w:60,label:'FILING CABINET'}],
    guards:()=>[],
    key:{x:960,label:'SIGNED AUTHORIZATION — The proof, in his own handwriting.'}},
};

export class CampaignWorld implements StealthStage{
  readonly stage:number;readonly width=1700;readonly height=540;readonly floorY=410;readonly playerHalfWidth=18;readonly playerHalfHeight=44;
  cameraX=0;mode:CampaignMode='title';time=0;stealth=100;suspicion=0;note='';muted=false;demo=false;
  player={x:90,y:366,vy:0,facing:1,hidden:false,running:false};
  guards:Guard[]=[];docs:Doc[]=[];hideSpots:Spot[]=[];journal:string[]=[];keys=new Set<string>();jumpBuffer=0;
  keyItem:{x:number;label:string;taken:boolean}|null=null;
  // stage 5
  wires:Wire[]=[];overrideLeft=0;overrideUsed=false;tripFlash=0;
  // stage 7
  lightsOn=false;rescued=false;patient={x:PATIENT_X,hidden:false,facing:-1};
  // stage 8
  uploadStarted=false;progress=0;
  // stage 9
  director=new Guard({x:DESK_X,dir:1,min:DESK_X,max:DESK_X,speed:0,range:380});glanceClock=0;alarmLeft=0;roofForce=0;roofOpen=false;
  constructor(stage:number){this.stage=stage;this.reset();this.mode='title';}
  get def(){return DEFS[this.stage];}
  get guard(){return this.guards[0]??this.director;}
  start(demo=false){this.demo=demo;this.reset();}
  reset(){
    const d=this.def;
    this.mode='play';this.time=0;this.stealth=100;this.suspicion=0;this.cameraX=0;this.jumpBuffer=0;this.journal=[];
    this.player={x:90,y:366,vy:0,facing:1,hidden:false,running:false};
    this.guards=d.guards();this.hideSpots=d.hides;
    this.docs=d.docs.map(([x,label])=>({x,label,taken:false}));
    this.keyItem=d.key?{...d.key,taken:false}:null;
    this.wires=this.stage===5?[{x:640},{x:760},{x:880}]:[];this.overrideLeft=0;this.overrideUsed=false;this.tripFlash=0;
    this.lightsOn=false;this.rescued=false;this.patient={x:PATIENT_X,hidden:false,facing:-1};
    this.uploadStarted=false;this.progress=0;
    this.director=new Guard({x:DESK_X,dir:1,min:DESK_X,max:DESK_X,speed:0,range:380});this.director.motionOnly=true;this.glanceClock=0;
    this.alarmLeft=0;this.roofForce=0;this.roofOpen=false;
    this.note=d.objective;
  }
  // --- HUD / journal
  evidenceCount(){return this.docs.filter(d=>d.taken).length;}
  evidenceTotal(){return this.docs.length;}
  get evidence(){return this.evidenceCount();}
  hasKey(){return this.stage===7?this.rescued:this.stage===8?this.progress>=UPLOAD_SECONDS:!!this.keyItem?.taken;}
  get key(){return this.hasKey();}
  /** stage 9: the alarm is running */
  get alarm(){return this.stage===9&&this.alarmLeft>0?ROOF_ALARM-this.alarmLeft:0;}
  exitOpen(){return this.evidenceCount()===this.docs.length&&this.hasKey();}
  near(x:number,r=60){return Math.abs(this.player.x-x)<r&&!this.player.hidden;}
  nearHide(){return this.hideSpots.some(s=>this.player.x>=s.x&&this.player.x<=s.x+s.w);}
  wiresArmed(){return this.stage===5&&this.overrideLeft<=0;}
  sight(){return this.stage===7?(this.lightsOn?260:150):undefined;}
  // --- autopilot view
  watchers(){return this.stage===9&&this.alarmLeft<=0&&!this.keyItem?.taken?[this.director,...this.guards]:this.guards;}
  covers(){return this.hideSpots;}
  get barriers(){return this.wiresArmed()?this.wires.map(w=>({x:w.x-6,w:12})):[];}
  hazardAt(){return false;}
  goal():Goal|null{
    const docs=this.docs.filter(d=>!d.taken).sort((a,b)=>a.x-b.x);
    switch(this.stage){
      case 7:{const before=docs.filter(d=>d.x<PATIENT_X);if(before.length)return {x:before[0].x,reach:14};
        if(!this.rescued)return {x:PATIENT_X-30,keys:['r'],reach:20};
        if(docs.length)return {x:docs[0].x,reach:14};return {x:EXIT_X+20,reach:10};}
      case 8:{if(docs.length&&docs[0].x<TERMINAL_X)return {x:docs[0].x,reach:14};
        if(this.progress<UPLOAD_SECONDS)return {x:TERMINAL_X,keys:['u'],hold:true,reach:20};
        if(docs.length)return {x:docs[0].x,reach:14};return {x:EXIT_X+20,reach:10};}
      case 9:{if(this.roofOpen)return {x:ROOF_X+30,run:true,reach:6};
        if(this.alarmLeft>0||this.keyItem?.taken)return {x:ROOF_X,keys:['r'],hold:true,run:true,reach:24};
        if(docs.length)return {x:docs[0].x,reach:14};return {x:this.keyItem!.x,reach:10};}
      default:{if(docs.length&&(!this.keyItem||this.keyItem.taken||docs[0].x<this.keyItem.x))return {x:docs[0].x,reach:14};
        if(this.keyItem&&!this.keyItem.taken)return {x:this.keyItem.x,reach:14};return {x:EXIT_X+20,reach:10};}
    }
  }
  press(key:string){
    const k=key.toLowerCase();if(k==='m'){this.muted=!this.muted;return;}if(this.mode!=='play')return;
    this.keys.add(k);if(isJumpKey(k))this.jumpBuffer=JUMP_BUFFER;
    if(k==='e'&&(this.player.hidden||this.nearHide())&&this.player.vy===0)this.player.hidden=!this.player.hidden;
    if(k==='x'&&this.stage===5&&this.near(CONTROL_X)&&!this.overrideUsed){this.overrideUsed=true;this.overrideLeft=OVERRIDE_SECONDS;this.note=`TRIPWIRES OFF — ${OVERRIDE_SECONDS} seconds. Go.`;}
    if(k==='l'&&this.stage===7&&this.near(SWITCH_X)){this.lightsOn=!this.lightsOn;this.note=this.lightsOn?'LIGHTS ON — you can see everything. So can they.':'LIGHTS OFF — only their torches now.';}
    if(k==='r'&&this.stage===7&&!this.rescued&&this.near(PATIENT_X,70)){this.rescued=true;this.note='PATIENT FOUND — they will follow you. Keep them out of the torchlight.';}
    if(k==='u'&&this.stage===8&&this.near(TERMINAL_X,36)&&!this.uploadStarted){this.uploadStarted=true;this.note='UPLOAD STARTED — it pauses whenever you step away.';}
  }
  release(key:string){this.keys.delete(key.toLowerCase());}

  step(dt:number){
    if(this.mode!=='play')return;
    this.time+=dt;this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
    if(this.demo)autopilot(this);
    const prevX=this.player.x;
    this.movePlayer(dt);
    const moving=Math.abs(this.player.x-prevX)>.01;
    const watched={x:this.player.x,hidden:this.player.hidden,running:this.player.running};
    let gain=0;
    for(const g of this.guards){gain+=g.update(dt,watched,this.sight());
      if(this.stage===7&&this.rescued)gain+=g.sees({x:this.patient.x,hidden:this.patient.hidden,running:false})?sightRate(Math.abs(this.patient.x-g.x),this.sight()??g.range):0;}
    gain+=this.stageRules(dt,moving);
    if(gain>0)this.suspicion=Math.min(100,this.suspicion+dt*gain);
    else this.suspicion=Math.max(0,this.suspicion-dt*(this.player.hidden?30:12));
    this.stealth=Math.max(0,100-this.suspicion);
    for(const d of this.docs)if(!d.taken&&Math.abs(this.player.x-d.x)<this.playerHalfWidth+10&&!this.player.hidden){d.taken=true;this.journal.push(d.label);this.note=d.label;}
    if(this.keyItem&&!this.keyItem.taken&&Math.abs(this.player.x-this.keyItem.x)<this.playerHalfWidth+10&&!this.player.hidden){this.keyItem.taken=true;this.journal.push(this.keyItem.label);this.note=this.keyItem.label;if(this.stage===9)this.tripRoofAlarm();}
    if(this.mode!=='play')return;
    if(this.suspicion>=100){this.mode='lose';this.note='The building locks down before you can escape.';return;}
    if(this.guards.some(g=>g.caught)){this.mode='lose';this.note='A hand closes on your shoulder. It’s over.';return;}
    this.checkWin();
  }

  private movePlayer(dt:number){
    const l=this.keys.has('a')||this.keys.has('arrowleft'),r=this.keys.has('d')||this.keys.has('arrowright');
    // the patient can't keep up with a sprint, and Finn won't leave them behind
    const run=this.keys.has('shift')&&!(this.stage===7&&this.rescued);this.player.running=run;
    if(!this.player.hidden){const axis=(r?1:0)-(l?1:0);this.player.x+=axis*(run?190:112)*dt;if(axis)this.player.facing=axis;
      if((this.keys.has(' ')||this.keys.has('w')||this.keys.has('arrowup')||this.jumpBuffer>0)&&this.player.y>=this.floorY-this.playerHalfHeight){this.player.vy=JUMP_VELOCITY;this.jumpBuffer=0;}
      this.player.vy+=GRAVITY*dt;this.player.y+=this.player.vy*dt;if(this.player.y>this.floorY-this.playerHalfHeight){this.player.y=this.floorY-this.playerHalfHeight;this.player.vy=0;}}
    this.player.x=Math.max(35,Math.min(1635,this.player.x));
    const cameraTarget=Math.max(0,Math.min(740,this.player.x-350));this.cameraX+=(cameraTarget-this.cameraX)*Math.min(1,dt*8);
  }

  /** Per-stage rules. Returns extra suspicion per second. */
  private stageRules(dt:number,moving:boolean):number{
    let gain=0;const p=this.player;
    switch(this.stage){
      case 5:{
        this.overrideLeft=Math.max(0,this.overrideLeft-dt);this.tripFlash=Math.max(0,this.tripFlash-dt);
        const feet=p.y+this.playerHalfHeight;
        if(this.wiresArmed()&&!p.hidden&&this.tripFlash<=0&&feet>this.floorY-WIRE_HEIGHT)
          for(const w of this.wires)if(Math.abs(p.x-w.x)<6){
            this.suspicion=Math.min(100,this.suspicion+30);this.tripFlash=1.2;this.guards[0]?.investigate(w.x,3);
            this.note='TRIPWIRE! The guard is coming to check it — get out of sight.';}
        if(this.overrideLeft>0)this.note=`TRIPWIRES OFF — ${Math.ceil(this.overrideLeft)}s`;
        else if(this.near(CONTROL_X)&&!this.overrideUsed)this.note='LASER CONTROL — X switches the tripwires off for 5 seconds. Once.';
        else if(this.wires.some(w=>w.x-p.x>0&&w.x-p.x<90)&&this.tripFlash<=0)this.note='TRIPWIRE — jump over it (SPACE).';
        break;}
      case 6:{
        const writing=this.guards.find(g=>g.pauseTimer>0&&Math.abs(g.x-p.x)<400);
        if(writing&&this.suspicion<10)this.note='A technician stops to write notes. Now’s your chance.';
        break;}
      case 7:{
        if(this.rescued){
          const target=p.x-38*p.facing;const d=target-this.patient.x;
          if(!p.hidden&&Math.abs(d)>4){this.patient.facing=Math.sign(d);this.patient.x+=Math.sign(d)*Math.min(110*dt,Math.abs(d));}
          this.patient.hidden=p.hidden&&Math.abs(this.patient.x-p.x)<70;}
        if(this.near(SWITCH_X)&&!this.rescued)this.note=this.lightsOn?'L — lights off. Harder to see, harder to be seen.':'L — lights on. You will see the patient; the guards will see you.';
        break;}
      case 8:{
        const atTerminal=this.uploadStarted&&Math.abs(p.x-TERMINAL_X)<36&&!p.hidden;
        if(atTerminal&&this.progress<UPLOAD_SECONDS){this.progress=Math.min(UPLOAD_SECONDS,this.progress+dt);this.note=`UPLOADING — ${Math.floor(this.progress)}/${UPLOAD_SECONDS}s. Watch for the sweep.`;}
        else if(this.progress>=UPLOAD_SECONDS&&this.uploadStarted)this.note='UPLOAD COMPLETE — get to the exit.';
        else if(this.uploadStarted)this.note=`UPLOAD PAUSED at ${Math.floor(this.progress)}/${UPLOAD_SECONDS}s — get back to the terminal when it’s clear.`;
        else if(this.near(TERMINAL_X,36))this.note='SERVER TERMINAL — press U to start the upload.';
        break;}
      case 9:{
        if(this.alarmLeft>0){
          this.alarmLeft=Math.max(0,this.alarmLeft-dt);
          // during the alarm, being spotted again means being chased again
          for(const g of this.guards)if(g.state==='alert')g.chase(p.x,.3);
          const atDoor=Math.abs(p.x-ROOF_X)<30&&!p.hidden;
          if(atDoor&&this.keys.has('r')&&!this.roofOpen){this.roofForce=Math.min(ROOF_FORCE,this.roofForce+dt);if(this.roofForce>=ROOF_FORCE){this.roofOpen=true;}}
          this.note=this.roofOpen?'THE ROOF DOOR GIVES — GO!':atDoor?`HOLD R — forcing the roof door ${Math.round(this.roofForce/ROOF_FORCE*100)}%`:`ALARM — run for the roof door and force it (hold R). ${Math.ceil(this.alarmLeft)}s`;
          if(this.alarmLeft<=0&&!this.roofOpen){this.mode='lose';this.note='Steel shutters drop over every exit.';}
        }else if(!this.keyItem?.taken){
          // he glances over his shoulder: 5s at the window, 0.8s warning, 2s looking back
          this.glanceClock+=dt;const c=this.glanceClock%7.8;const dir=this.director;
          const lookingBack=c>=5.8;const warning=c>=5&&c<5.8;
          dir.dir=lookingBack?-1:1;dir.pauseTimer=warning?.5:0;dir.state=lookingBack?'alert':'patrol';
          const dist=Math.abs(p.x-dir.x);const inView=lookingBack&&!p.hidden&&p.x<dir.x&&dist<dir.range;
          if(inView)gain+=moving?sightRate(dist,dir.range,45):5;
          dir.awareness+=((inView?(moving?1:.35):0)-dir.awareness)*Math.min(1,dt*8);
          if(inView&&moving)this.note='HE’S LOOKING — FREEZE!';
          else if(warning)this.note='He shifts in his chair…';
          else if(lookingBack)this.note='Don’t move.';
          else if(p.x>dir.x-200)this.note='His back is turned. The authorization is on the desk behind him.';
        }
        break;}
    }
    return gain;
  }

  private tripRoofAlarm(){
    this.alarmLeft=ROOF_ALARM;this.director.dir=-1;this.director.state='alert';this.director.awareness=1;
    // a guard bursts out of the roof stairwell — between Finn and the door. Hide, let him rush past to
    // where he last saw you, then slip out behind him. Once he loses you he heads back to his post.
    const g=new Guard({x:1650,dir:-1,min:520,max:520,speed:80,range:300,chaseSpeed:150});g.chase(this.player.x,.8);this.guards.push(g);
    this.note='HE’S SEEN YOU — the alarm is sounding. Run for the roof!';
  }

  private checkWin(){
    const p=this.player;
    switch(this.stage){
      case 7:if(this.exitOpen()&&p.x>EXIT_X&&this.patient.x>EXIT_X-70){this.win('THE SERVICE DOOR SWINGS SHUT — you got them out.');}break;
      case 9:if(this.roofOpen&&p.x>ROOF_X+6){this.win('THE TRUTH WILL OUT — Finn reaches the roof.');}break;
      default:if(this.exitOpen()&&p.x>EXIT_X)this.win('STAGE COMPLETE — the investigation continues.');
    }
  }
  private win(note:string){this.mode='win';this.note=note;}
}
