import { GameWorld } from './client/src/game/world';
import { CorridorWorld } from './client/src/game/corridor';
import { ArchivesWorld } from './client/src/game/archives';
import { VaultWorld } from './client/src/game/vault';

const stage1=new GameWorld(); stage1.start(); stage1.pickups.forEach(p=>p.taken=true); stage1.player.x=900; stage1.step(.016); if(stage1.mode!=='win') throw new Error('Stage 1 completion failed');
const stage2=new CorridorWorld(); stage2.start(); stage2.pickups.forEach(p=>p.taken=true); stage2.player.x=1930; stage2.step(.016); if(stage2.mode!=='win') throw new Error('Stage 2 completion failed');
const stage3=new ArchivesWorld(); stage3.start(); stage3.player.x=880; stage3.press('t'); for(const digit of ['2','4','1']) stage3.press(digit); if(!stage3.hacked) throw new Error('Stage 3 terminal failed'); stage3.pickups.forEach(p=>p.taken=true); stage3.player.x=1740; stage3.step(.016); if(stage3.mode!=='win') throw new Error('Stage 3 completion failed');
const stage4=new VaultWorld(); stage4.start(); stage4.player.x=540; stage4.press('h'); stage4.player.x=980; stage4.press('b'); stage4.player.x=1400; stage4.press('r'); if(!stage4.doorOverridden) throw new Error('Stage 4 override failed'); stage4.pickups.forEach(p=>p.taken=true); stage4.player.x=1580; stage4.step(.016); if(stage4.mode!=='win') throw new Error('Stage 4 escape failed');
console.log(JSON.stringify({stage1:stage1.mode,stage2:stage2.mode,stage3:{mode:stage3.mode,hacked:stage3.hacked},stage4:{mode:stage4.mode,camera:stage4.cameraHacked,biometric:stage4.biometric,override:stage4.doorOverridden}}));
