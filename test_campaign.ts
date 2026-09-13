import {VaultWorld} from './client/src/game/vault';
import {CampaignWorld} from './client/src/game/campaign';
const v=new VaultWorld();v.start();v.cameraHacked=true;v.biometric=true;v.doorOverridden=true;v.pickups.forEach(p=>p.taken=true);v.player.x=1580;v.step(.016);if(v.mode!=='win')throw new Error('Stage 4 escape failed');
const s5=new CampaignWorld(5);s5.start();s5.laserDisabled=true;s5.evidence=2;s5.key=true;s5.player.x=1560;s5.step(.016);if(s5.mode!=='win')throw new Error('Stage 5 failed');
const s6=new CampaignWorld(6);s6.start();s6.evidence=3;s6.key=true;s6.player.x=1560;s6.step(.016);if(s6.mode!=='win')throw new Error('Stage 6 failed');
const s7=new CampaignWorld(7);s7.start();s7.switchOn=true;s7.rescued=true;s7.player.x=1560;s7.step(.016);if(s7.mode!=='win')throw new Error('Stage 7 failed');
const s8=new CampaignWorld(8);s8.start();s8.progress=60;s8.player.x=1560;s8.step(.016);if(s8.mode!=='win')throw new Error('Stage 8 failed');
const s9=new CampaignWorld(9);s9.start();s9.key=true;s9.player.x=1560;s9.step(.016);if(s9.mode!=='win')throw new Error('Stage 9 failed');
console.log(JSON.stringify({stage4:v.mode,stage5:s5.mode,stage6:s6.mode,stage7:s7.mode,stage8:s8.mode,stage9:s9.mode}));
