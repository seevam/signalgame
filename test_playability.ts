// Every stage must reward stealth: careful play (the autopilot) wins, while holding → or sprinting
// straight through loses. Before the stealth rework, holding → won 8 of the 9 stages.
import {createWorldForStage,TOTAL_STAGES,stageMeta} from './client/src/game/stages';
const DT=1/60,LIMIT=150;
const ACTIONS:Record<number,string[]>={1:['q'],2:[],3:['t','2','4','1'],4:['h','b','r'],5:['x'],6:[],7:['l','r'],8:['u'],9:['r']};
function play(stage:number,how:'careful'|'hold-right'|'sprint'){
  const w:any=createWorldForStage(stage);w.start(how==='careful');let t=0,lastX=w.player.x,stuck=0;
  while(w.mode==='play'&&t<LIMIT){
    if(how!=='careful'){w.keys.clear();w.keys.add('d');if(how==='sprint')w.keys.add('shift');if(w.player.hidden)w.press('e');
      for(const k of ACTIONS[stage])w.press(k);
      if(Math.abs(w.player.x-lastX)<.01){if(++stuck>3)w.press(' ');}else stuck=0;lastX=w.player.x;}
    w.step(DT);t+=DT;}
  return {mode:w.mode==='play'?'timeout':w.mode,t};
}
let failures=0;
for(let s=1;s<=TOTAL_STAGES;s++){
  const careful=play(s,'careful'),hold=play(s,'hold-right'),sprint=play(s,'sprint');
  const ok=careful.mode==='win'&&hold.mode!=='win'&&sprint.mode!=='win';
  if(!ok)failures++;
  console.log(`${ok?'PASS':'FAIL'}  stage ${s} ${stageMeta(s).title.padEnd(26)} careful: ${careful.mode} ${careful.t.toFixed(1)}s | hold →: ${hold.mode} | sprint: ${sprint.mode}`);
}
if(failures){console.error(`\n${failures} stage(s) failed the playability check`);process.exit(1);}
console.log('\nevery stage rewards stealth');
