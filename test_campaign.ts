// Win gates for stages 5-9: set up each stage's required state directly and check it completes.
import {CampaignWorld,EXIT_X,UPLOAD_SECONDS} from './client/src/game/campaign';
const DT=.016;
const fail=(m:string)=>{throw new Error(m);};
const ready=(stage:number)=>{const w=new CampaignWorld(stage);w.start();w.guards=[];w.docs.forEach(d=>d.taken=true);if(w.keyItem)w.keyItem.taken=true;return w;};

const s5=ready(5);s5.player.x=EXIT_X+10;s5.step(DT);if(s5.mode!=='win')fail('Stage 5 failed');
const s6=ready(6);s6.player.x=EXIT_X+10;s6.step(DT);if(s6.mode!=='win')fail('Stage 6 failed');
const s7=ready(7);s7.player.x=EXIT_X+10;s7.step(DT);if(s7.mode==='win')fail('Stage 7 let Finn leave without the patient');
s7.rescued=true;s7.patient.x=EXIT_X;s7.step(DT);if(s7.mode!=='win')fail('Stage 7 failed');
const s8=ready(8);s8.player.x=EXIT_X+10;s8.step(DT);if(s8.mode==='win')fail('Stage 8 let Finn leave before the upload');
s8.progress=UPLOAD_SECONDS;s8.step(DT);if(s8.mode!=='win')fail('Stage 8 failed');
const s9=ready(9);s9.player.x=1610;s9.step(DT);if(s9.mode==='win')fail('Stage 9 let Finn through a closed roof door');
s9.roofOpen=true;s9.step(DT);if(s9.mode!=='win')fail('Stage 9 failed');
console.log(JSON.stringify({stage5:s5.mode,stage6:s6.mode,stage7:s7.mode,stage8:s8.mode,stage9:s9.mode}));
