// Win gates for stages 1-4: set up each stage's required state directly and check it completes.
import {GameWorld} from './client/src/game/world';
import {CorridorWorld} from './client/src/game/corridor';
import {ArchivesWorld} from './client/src/game/archives';
import {VaultWorld} from './client/src/game/vault';
const DT=.016;
const fail=(m:string)=>{throw new Error(m);};

const stage1=new GameWorld();stage1.start();stage1.pickups.forEach(p=>p.taken=true);stage1.player.x=900;stage1.step(DT);
if(stage1.mode!=='win')fail('Stage 1 completion failed');

const stage2=new CorridorWorld();stage2.start();stage2.pickups.forEach(p=>p.taken=true);stage2.player.x=1930;stage2.step(DT);
if(stage2.mode!=='win')fail('Stage 2 completion failed');

// Stage 3: the code is random each run; the terminal accepts it and rejects a wrong one
const stage3=new ArchivesWorld();stage3.start();stage3.player.x=880;
const wrong=stage3.hackSequence==='999'?'111':'999';
stage3.press('t');for(const d of wrong)stage3.press(d);
if(stage3.hacked||stage3.hackError<=0)fail('Stage 3 accepted a wrong code');
stage3.hackError=0;stage3.press('t');for(const d of stage3.hackSequence)stage3.press(d);
if(!stage3.hacked)fail('Stage 3 terminal rejected the right code');
stage3.pickups.forEach(p=>p.taken=true);stage3.player.x=1740;stage3.step(DT);
if(stage3.mode!=='win')fail('Stage 3 completion failed');

// Stage 4: camera -> biometric -> override -> token trips the alarm -> back to the tunnel
const stage4=new VaultWorld();stage4.start();stage4.player.x=540;stage4.press('h');stage4.player.x=980;stage4.press('b');stage4.player.x=1400;stage4.press('r');
if(!stage4.doorOverridden)fail('Stage 4 override failed');
stage4.pickups.forEach(p=>p.taken=true);stage4.step(DT);
if(!stage4.escapeActive)fail('Stage 4 alarm did not trip after the token');
stage4.player.x=60;stage4.step(DT);
if(stage4.mode!=='win')fail('Stage 4 escape failed');

console.log(JSON.stringify({stage1:stage1.mode,stage2:stage2.mode,stage3:{mode:stage3.mode,hacked:stage3.hacked},stage4:{mode:stage4.mode,camera:stage4.cameraHacked,biometric:stage4.biometric,override:stage4.doorOverridden,escaped:stage4.escapeActive}}));
