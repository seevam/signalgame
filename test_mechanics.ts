// One check per stage mechanic introduced by the stealth rework.
import {Guard,sightRate} from './client/src/game/stealth';
import {GameWorld} from './client/src/game/world';
import {ArchivesWorld} from './client/src/game/archives';
import {VaultWorld} from './client/src/game/vault';
import {CampaignWorld,UPLOAD_SECONDS} from './client/src/game/campaign';
const DT=1/60;let failures=0;
const check=(name:string,ok:boolean,detail='')=>{console.log(`${ok?'PASS':'FAIL'}  ${name}${detail?`  (${detail})`:''}`);if(!ok)failures++;};
const steps=(w:any,seconds:number,keys:string[]=[])=>{for(let t=0;t<seconds;t+=DT){w.keys.clear();keys.forEach(k=>w.keys.add(k));w.step(DT);}};

// --- shared guard
check('guard: point blank is much faster to spot than the edge of sight',sightRate(10,250)>2.5*sightRate(240,250),`${sightRate(10,250).toFixed(0)} vs ${sightRate(240,250).toFixed(0)}/s`);
{const g=new Guard({x:500,dir:-1,min:400,max:600,speed:0});g.update(DT,{x:400,hidden:false,running:false});
  for(let i=0;i<30;i++)g.update(DT,{x:520+i*3,hidden:false,running:false});   // Finn walks through and past him
  check('guard: an alerted guard turns to follow Finn who slips past him',g.dir===1&&g.sees({x:610,hidden:false,running:false}));}
{const g=new Guard({x:500,dir:-1,min:400,max:600,speed:0,range:250});
  check('guard: running is seen 22% further away (spec)',!g.sees({x:200,hidden:false,running:false})&&g.sees({x:200,hidden:false,running:true}));}
{const g=new Guard({x:500,dir:-1,min:400,max:600,speed:50,pause:1.5});for(let i=0;i<200;i++)g.update(DT,{x:0,hidden:true,running:false});
  check('guard: pauses at the end of his lane, then turns',g.x===400&&(g.pauseTimer>0||g.dir===1));}

// --- stage 1: tutorial guard starts far off and walks toward Finn
{const w=new GameWorld();w.start();check('stage 1: the guard starts across the room, walking toward Finn',w.guard.x>800&&w.guard.dir===-1);}

// --- stage 3: the code comes from the evidence; a wrong code calls the archivist
{const w=new ArchivesWorld();w.start();
  check('stage 3: the code is unknown until the documents are found',w.knownCode()==='_ _ _');
  w.pickups[0].taken=true;check('stage 3: each document reveals one digit',w.knownCode()===`${w.hackSequence[0]} _ _`);
  w.player.x=880;w.press('t');for(const d of (w.hackSequence==='999'?'111':'999'))w.press(d);
  check('stage 3: a wrong code sends the archivist to the terminal',w.guard.state==='investigate'&&w.guard.target===880);}

// --- stage 4: the token trips the alarm; the guard needs a moment to react
{const w=new VaultWorld();w.start();w.cameraHacked=w.biometric=w.doorOverridden=true;w.pickups.forEach(p=>p.taken=true);w.guard.x=1450;w.player.x=1400;w.step(DT);
  check('stage 4: taking the token starts the alarm and the chase',w.escapeActive&&w.guard.state==='chase');
  const x0=w.guard.x;steps(w,.5);check('stage 4: the guard reacts before chasing (no instant grab)',Math.abs(w.guard.x-x0)<1);}

// --- stage 5: tripwires
{const walk=new CampaignWorld(5);walk.start();walk.guards[0].x=1460;walk.player.x=610;steps(walk,.5,['d']);
  check('stage 5: walking into a tripwire trips it and sends the guard',walk.suspicion>=25&&walk.guards[0].state==='investigate',`suspicion ${walk.suspicion.toFixed(0)}`);
  const jump=new CampaignWorld(5);jump.start();jump.guards[0].x=1460;jump.player.x=600;
  for(let t=0;t<1.2;t+=DT){jump.keys.clear();jump.keys.add('d');if(t<DT)jump.press(' ');jump.step(DT);}
  check('stage 5: jumping clears a tripwire',jump.suspicion===0&&jump.player.x>650,`x ${jump.player.x.toFixed(0)}`);
  const o=new CampaignWorld(5);o.start();o.player.x=520;o.press('x');const first=o.overrideLeft;o.overrideLeft=0;o.press('x');
  check('stage 5: the override works once',first>0&&o.overrideLeft===0);}

// --- stage 6: technicians stop at their stations to write notes
{const w=new CampaignWorld(6);w.start();check('stage 6: two technicians with long pauses and short sight',w.guards.length===2&&w.guards.every(g=>g.pause>=3&&g.range<200));}

// --- stage 7: lights, patient
{const w=new CampaignWorld(7);w.start();w.guards=[];w.player.x=1100;w.press('r');steps(w,2,['d']);steps(w,1);
  check('stage 7: the rescued patient follows Finn',w.rescued&&Math.abs(w.patient.x-w.player.x)<60);
  const s=new CampaignWorld(7);s.start();s.rescued=true;s.guards=[new Guard({x:900,dir:1,min:900,max:900,speed:0,range:150})];s.player.x=700;s.patient.x=1000;s.player.hidden=true;steps(s,.3);
  check('stage 7: a guard who sees the patient raises suspicion',s.suspicion>0);}

// --- stage 8: the upload pauses when you step away and keeps its progress
{const w=new CampaignWorld(8);w.start();w.guards=[];w.player.x=850;w.press('u');steps(w,5);const p=w.progress;w.player.x=700;steps(w,3);
  check('stage 8: upload progress pauses away from the terminal and is kept',p>4.5&&Math.abs(w.progress-p)<.01,`${p.toFixed(1)}s kept`);
  check('stage 8: the elite guard patrols across the terminal',(()=>{const g=new CampaignWorld(8);g.start();return g.guards[0].min<850&&g.guards[0].max>850;})());
  check('stage 8: upload length',UPLOAD_SECONDS===30);}

// --- stage 9: freeze when he looks back; the alarm guard comes from ahead
{const still=new CampaignWorld(9);still.start();still.player.x=820;still.glanceClock=5.9;steps(still,1.5);
  const move=new CampaignWorld(9);move.start();move.player.x=700;move.glanceClock=5.9;steps(move,1.5,['d']);
  check('stage 9: moving while he looks back is far worse than freezing',move.suspicion>3*still.suspicion&&still.suspicion<15,`moving ${move.suspicion.toFixed(0)} vs still ${still.suspicion.toFixed(0)}`);
  const a=new CampaignWorld(9);a.start();a.player.x=960;a.step(DT);
  check('stage 9: taking the authorization trips the alarm, with a guard between Finn and the roof',a.alarmLeft>0&&a.guards.some(g=>g.state==='chase'&&g.x>a.player.x));}

if(failures){console.error(`\n${failures} mechanic check(s) failed`);process.exit(1);}
console.log('\nall mechanic checks passed');
