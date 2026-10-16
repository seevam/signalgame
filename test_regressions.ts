// Regression checks for gameplay bugs that shipped once. Each block names the bug it guards.
import {GameWorld} from './client/src/game/world';
import {CorridorWorld} from './client/src/game/corridor';
import {ArchivesWorld} from './client/src/game/archives';
import {VaultWorld} from './client/src/game/vault';
import {CampaignWorld} from './client/src/game/campaign';

const DT=1/60;
const run=(w:any,seconds:number,keys:string[]=[])=>{for(let t=0;t<seconds;t+=DT){w.keys.clear();keys.forEach(k=>w.keys.add(k));w.step(DT);}};
let failures=0;
const check=(name:string,ok:boolean,detail='')=>{console.log(`${ok?'PASS':'FAIL'}  ${name}${detail?`  (${detail})`:''}`);if(!ok)failures++;};
// Each scenario runs in isolation: a throw fails that scenario and the rest still run.
const scenario=(name:string,fn:()=>void)=>{try{fn();}catch(e){check(name,false,`threw: ${(e as Error).message}`);}};

// Stages 5-9: the E condition required !hidden, so a second E could never unhide — a permanent soft-lock.
scenario('Stages 5-9',()=>{
for(const stage of [5,6,7,9]){const c=new CampaignWorld(stage);c.start();c.player.x=300;c.press('e');const hid=c.player.hidden;c.release('e');c.press('e');
  check(`stage ${stage}: E hides and E again unhides`,hid&&!c.player.hidden);}
});

// Stage 1: camera detection used a wider, differently-phased beam than the one drawn on screen.
scenario('Stage 1',()=>{
{const g=new GameWorld();g.start();let outside=0;for(let t=0;t<6.2;t+=0.02){g.time=t;const b=g.cameraBeam();for(let x=250;x<=780;x+=4){g.player.x=x;if(g.cameraSeesPlayer()&&(x<b.left-10||x>b.right+10))outside++;}}
  check('stage 1: camera only detects inside the drawn beam (±body width)',outside===0,`${outside} detections outside`);}
});

// Stage 1: suspicion and the guard's alert never decayed while Finn stood in a camera-safe zone.
scenario('Stage 1',()=>{
{const g=new GameWorld();g.start();g.player.x=150;g.suspicion=60;g.guard.state='alert';g.guard.alertTimer=2.2;run(g,4);
  check('stage 1: suspicion decays in the reception safe zone',g.suspicion<1,`suspicion ${g.suspicion.toFixed(1)}`);
  check('stage 1: guard alert clears after losing sight',g.guard.state==='patrol');}
});

// Stage 1: guard pauses at each end of the lane before turning (DESIGN_SPEC).
scenario('Stage 1',()=>{
{const g=new GameWorld();g.start();g.player.x=60;g.player.hidden=true;g.guard.x=560;g.guard.dir=-1;run(g,0.5);const xAtEnd=g.guard.x;run(g,1.0);
  check('stage 1: guard pauses at the lane end',Math.abs(g.guard.x-xAtEnd)<0.01&&g.guard.x===545,`x ${g.guard.x.toFixed(1)}`);}
});

// Stage 2: suspicion only decayed outside hide zones, and never below 15%.
scenario('Stage 2',()=>{
{const k=new CorridorWorld();k.start();k.player.x=100;k.guards.forEach(g=>g.x=g.x<1000?600:1830);k.suspicion=40;run(k,4);
  check('stage 2: suspicion decays fully when unseen',k.suspicion===0,`suspicion ${k.suspicion.toFixed(1)}`);}
});

// Stage 2: the ceiling camera was drawn but had no detection logic at all.
scenario('Stage 2',()=>{
{const k=new CorridorWorld();k.start();k.guards.forEach(g=>{g.x=g.x<1000?170:1830;g.dir=g.x<1000?-1:1;});k.player.x=1100;run(k,7);
  check('stage 2: standing under the camera builds suspicion',k.suspicion>30,`suspicion ${k.suspicion.toFixed(1)}`);
  const h=new CorridorWorld();h.start();h.guards.forEach(g=>{g.x=g.x<1000?170:1830;g.dir=g.x<1000?-1:1;});h.player.x=990;h.press('e');run(h,7);
  check('stage 2: hiding in the linen cart beats the camera',h.player.hidden&&h.suspicion===0);}
});

// Stage 2: barriers were decorative — Finn walked straight through them.
scenario('Stage 2',()=>{
{const k=new CorridorWorld();k.start();k.guards.forEach(g=>{g.x=g.x<1000?170:1830;g.dir=g.x<1000?-1:1;});k.player.x=560;run(k,1.5,['d']);
  check('stage 2: a barrier blocks walking',k.player.x<668,`x ${k.player.x.toFixed(0)}`);
  const j=new CorridorWorld();j.start();j.guards.forEach(g=>{g.x=g.x<1000?170:1830;g.dir=g.x<1000?-1:1;});j.player.x=560;
  for(let t=0;t<2;t+=DT){j.keys.clear();j.keys.add('d');if(j.player.x>=630&&j.player.x<640)j.keys.add(' ');j.step(DT);}
  check('stage 2: a walking jump clears a barrier',j.player.x>694,`x ${j.player.x.toFixed(0)}`);}
});

// Stage 3: hide zones in the logic did not match the shadows drawn on screen.
scenario('Stage 3',()=>{
{const a=new ArchivesWorld();a.start();for(const s of a.hideSpots){a.player.hidden=false;a.player.x=s.x+s.w-5;a.press('e');if(!a.player.hidden)check(`stage 3: can hide at the right edge of ${s.label}`,false);}
  a.player.hidden=false;a.player.x=190;a.press('e');
  check('stage 3: hide zones match the drawn shadows',!a.player.hidden);}
});

// Stage 3: digits were still accepted during the ACCESS DENIED lockout.
scenario('Stage 3',()=>{
{const a=new ArchivesWorld();a.start();a.player.x=880;a.press('t');for(const d of '999')a.press(d);for(const d of '241')a.press(d);
  check('stage 3: code entry is locked out after a wrong code',!a.hacked&&a.hackInput==='');}
});

// Stage 4: the laser grid was harmless before the camera hack and only hurt after it.
scenario('Stage 4',()=>{
{const v=new VaultWorld();v.start();v.player.x=680;run(v,1.2,['d']);
  check('stage 4: crossing the grid un-hacked trips it',v.suspicion>60,`suspicion ${v.suspicion.toFixed(0)}`);
  const h=new VaultWorld();h.start();h.cameraHacked=true;h.player.x=700;h.time=0;run(h,0.5);
  check('stage 4: after the hack, the grid has safe gaps',h.suspicion===0);}
});

// Stage 7: "LIGHTS ON — the torches can see you now" changed nothing.
scenario('Stage 7',()=>{
{const dark=new CampaignWorld(7);dark.start();dark.guard.x=1300;dark.guard.dir=-1;dark.player.x=1110;run(dark,0.5);
  const lit=new CampaignWorld(7);lit.start();lit.switchOn=true;lit.guard.x=1300;lit.guard.dir=-1;lit.player.x=1110;run(lit,0.5);
  check('stage 7: turning the lights on lets the guard see further',dark.suspicion===0&&lit.suspicion>0);}
});

// Restarting left cameraX at the far end of the level, so the view swooped back across the room.
scenario('Restarting left cameraX at the far end of the level, so the ',()=>{
for(const [name,w] of [['corridor',new CorridorWorld()],['archives',new ArchivesWorld()],['vault',new VaultWorld()]] as const){(w as any).start();(w as any).cameraX=600;(w as any).start();
  check(`${name}: restart resets the camera`,(w as any).cameraX===0);}
});

if(failures){console.error(`\n${failures} regression check(s) failed`);process.exit(1);}
console.log('\nall regression checks passed');
