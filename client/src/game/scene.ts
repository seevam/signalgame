import {Engine} from '@babylonjs/core/Engines/engine';import {Scene} from '@babylonjs/core/scene';
import {drawScene,drawTitle,type SpriteAssets} from './draw';import {drawCorridor,drawCorridorTitle} from './corridorDraw';import {drawArchives,drawArchivesTitle} from './archivesDraw';import {drawVault,drawVaultTitle} from './vaultDraw';import {drawCampaign,drawCampaignTitle} from './campaignDraw';
import {AudioDirector} from './audio';import {CompletionBurst} from './effects';import {TOTAL_STAGES,clampStage,createWorldForStage} from './stages';
const asset=import.meta.env.BASE_URL;
export type GameHandle={scene:Scene;world:any;dispose:()=>void};
export type SceneOptions={stage?:number;demo?:boolean;onStageComplete?:(stage:number)=>void;onAdvance?:(nextStage:number)=>void};
const overlayText=(ctx:CanvasRenderingContext2D,heading:string,body:string,hint:string,accent='#d5dae8')=>{ctx.fillStyle='rgba(12,14,24,.84)';ctx.fillRect(0,0,960,540);ctx.fillStyle=accent;ctx.font='28px ui-monospace,monospace';ctx.fillText(heading,72,100);ctx.fillStyle='#d5dae8';ctx.font='15px ui-monospace,monospace';ctx.fillText(body,72,170);ctx.fillStyle='#e0af68';ctx.fillText(hint,72,222);};
export function createGameScene(visible:HTMLCanvasElement,options:SceneOptions={}):GameHandle{
 const engineCanvas=document.createElement('canvas');engineCanvas.width=2;engineCanvas.height=2;engineCanvas.style.display='none';document.body.appendChild(engineCanvas);const engine=new Engine(engineCanvas,false,{preserveDrawingBuffer:false,stencil:false});const scene=new Scene(engine);
 const params=new URLSearchParams(location.search);const stageNum=clampStage(options.stage??Number(params.get('stage')||1));const demo=options.demo??params.has('demo');
 const stage2=stageNum===2,stage3=stageNum===3,stage4=stageNum===4,late=stageNum>=5;const isFinalStage=stageNum>=TOTAL_STAGES;
 const world:any=createWorldForStage(stageNum);if(demo)world.start(true);if(import.meta.env.DEV)(window as any).signalWorld=world;const ctx=visible.getContext('2d')!;let last=performance.now();let paused=false,journalOpen=false;
 const sprites:SpriteAssets={finn:null,guard:null,finnWalk:[],guardWalk:[],finnJump:null,finnLand:null,finnCrouch:null,finnHide:null,guardAlert:null,props:[]};const audio=new AudioDirector();audio.setStage(stageNum);const completionFx=new CompletionBurst();let wasAlert=false,wasWin=false,wasLose=false,wasHidden=false,wasHack=false;let art={bg:null as HTMLImageElement|null,finn:null as HTMLImageElement|null,guard:null as HTMLImageElement|null};
 const load=(src:string,on:(i:HTMLImageElement)=>void)=>{const i=new Image();i.onload=()=>on(i);i.onerror=()=>console.warn(`[SIGNAL] art failed: ${src}`);i.src=src;};if(stage2){load(asset+'generated/corridor-bg.jpg',i=>art.bg=i);}if(stage3){load(asset+'generated/archives-bg.jpg',i=>art.bg=i);}if(stage4||late){load(asset+'generated/vault-bg.jpg',i=>art.bg=i);}if(stage2||stage3||stage4||late){load(asset+'generated/finn-stage3.png',i=>art.finn=i);load(asset+'generated/guard-stage3.png',i=>art.guard=i);}
 const loadSprite=(src:string,onReady:(sprite:HTMLCanvasElement)=>void)=>{const image=new Image();image.onload=()=>{const off=document.createElement('canvas');off.width=image.width;off.height=image.height;off.getContext('2d')!.drawImage(image,0,0);onReady(off);};image.src=src;};if(!stage2&&!stage3&&!stage4&&!late){loadSprite(asset+'generated/finn-idle.png',s=>sprites.finn=s);loadSprite(asset+'generated/guard-idle.png',s=>sprites.guard=s);loadSprite(asset+'generated/finn-walk-0.png',s=>sprites.finnWalk[0]=s);loadSprite(asset+'generated/finn-walk-1.png',s=>sprites.finnWalk[1]=s);loadSprite(asset+'generated/guard-alert.png',s=>sprites.guardAlert=s);}
 const resize=()=>{const ratio=960/540;const host=visible.parentElement;const w=Math.min(host?.clientWidth??window.innerWidth,(host?.clientHeight??window.innerHeight)*ratio);visible.style.width=`${Math.max(320,w)}px`;visible.style.height=`${Math.max(180,w/ratio)}px`;engine.resize();};resize();window.addEventListener('resize',resize);
 const releaseAllKeys=()=>{world.keys?.clear?.();};
 const restart=()=>{paused=false;journalOpen=false;releaseAllKeys();world.start(demo);audio.stage();};
 const advance=(next:number)=>{releaseAllKeys();options.onAdvance?.(clampStage(next));};
 const down=(e:KeyboardEvent)=>{
  audio.unlock();
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();
  const k=e.key.toLowerCase();
  if(e.key==='Enter'){
   e.preventDefault();
   if(world.mode==='title'||world.mode==='lose')restart();
   else if(world.mode==='win')advance(isFinalStage?1:stageNum+1);
   return;
  }
  if(e.key==='Escape'){if(world.mode==='play'){paused=!paused;if(paused)releaseAllKeys();}return;}
  if(k==='r'&&world.mode==='win'){restart();return;}
  if(k==='j'){journalOpen=!journalOpen;if(journalOpen)releaseAllKeys();return;}
  if(paused||journalOpen)return;
  if(k==='q'&&!stage2&&!stage3&&!stage4&&!late&&world.interact){world.interact();audio.jammer();}
  world.press(e.key);
  if(k==='m')audio.setMuted(world.muted);
 };
 const up=(e:KeyboardEvent)=>world.release(e.key);
 const blur=()=>{releaseAllKeys();};
 window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
 const drawWorld=()=>{late?drawCampaign(ctx,world,art.finn,art.guard):stage4?drawVault(ctx,world,art.bg,art.finn,art.guard):stage3?drawArchives(ctx,world,art.bg,art.finn,art.guard):stage2?drawCorridor(ctx,world,art.bg,art.finn,art.guard):drawScene(ctx,world,sprites);};
 const drawJournal=()=>{ctx.fillStyle='rgba(12,14,24,.9)';ctx.fillRect(0,0,960,540);ctx.fillStyle='#7aa2f7';ctx.font='20px ui-monospace,monospace';ctx.fillText('JOURNAL',72,80);ctx.font='12px ui-monospace,monospace';const entries:string[]=(world.pickups??[]).filter((p:any)=>p.taken).map((p:any)=>p.label).concat(world.journal??[]);if(!entries.length){ctx.fillStyle='#596581';ctx.fillText('No records recovered yet.',72,130);}else entries.forEach((entry,i)=>{ctx.fillStyle='#b7c0d8';ctx.fillText(`• ${entry.length>92?`${entry.slice(0,92)}…`:entry}`,72,132+i*30);});ctx.fillStyle='#e0af68';ctx.fillText('J  CLOSE JOURNAL',72,492);};
 engine.runRenderLoop(()=>{
  const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;const frozen=paused||journalOpen;
  const beforeX=world.player.x,beforeEvidence=world.evidenceCount?.()??world.evidence??0,beforeBio=world.biometric,beforeOverride=world.doorOverridden,beforeUpload=world.uploading,beforeEscape=world.escapeActive;
  if(!frozen)world.step(dt);
  if(!frozen){
   if(world.mode==='play'&&world.player.x!==beforeX)audio.footstep(late||stage3||stage4?'carpet':world.player.y<350?'desk':world.player.x>700?'carpet':'tile',world.player.running);
   if((world.evidenceCount?.()??world.evidence??0)>beforeEvidence)audio.pickup();
   const alertNow=world.guard?.state==='alert'||!!world.guards?.some((g:any)=>g.state==='alert');
   if(alertNow&&!wasAlert)audio.alert();
   if(world.mode==='play')audio.heartbeat(world.suspicion??0);
   if(stage3&&world.hacked&&!wasHack)audio.stage();
   if(stage4&&world.cameraHacked&&!wasHack)audio.stage();
   if(stage4&&world.biometric&&!beforeBio)audio.servo();
   if(stage4&&world.doorOverridden&&!beforeOverride)audio.escape();
   if(stage4&&world.escapeActive&&!beforeEscape)audio.stage();
   if(late&&world.uploading&&!beforeUpload)audio.stage();
   if(world.player.hidden&&!wasHidden)audio.servo();
   wasHidden=world.player.hidden;wasAlert=alertNow;wasHack=world.hacked||world.cameraHacked;
  }
  if(world.mode==='win'&&!wasWin){audio.escape();completionFx.trigger();wasWin=true;paused=false;journalOpen=false;options.onStageComplete?.(stageNum);}
  if(world.mode==='lose'&&!wasLose){audio.flatline();wasLose=true;paused=false;journalOpen=false;}if(world.mode!=='lose')wasLose=false;
  completionFx.update(dt);if(world.mode!=='win')wasWin=false;
  if(world.mode==='title')late?drawCampaignTitle(ctx,world):stage4?drawVaultTitle(ctx):stage3?drawArchivesTitle(ctx,world):stage2?drawCorridorTitle(ctx,world):drawTitle(ctx,world);
  else{
   drawWorld();
   if(world.mode==='win')overlayText(ctx,isFinalStage?'CAMPAIGN COMPLETE':`STAGE ${String(stageNum).padStart(2,'0')} COMPLETE`,world.note,isFinalStage?'ENTER  RESTART CAMPAIGN     R  REPLAY STAGE':`ENTER  NEXT STAGE (${String(stageNum+1).padStart(2,'0')})     R  REPLAY STAGE`,'#9ece6a');
   else if(world.mode==='lose')overlayText(ctx,'SIGNAL LOST',world.note,'ENTER  RESTART STAGE','#f7768e');
   else if(journalOpen)drawJournal();
   else if(paused)overlayText(ctx,'PAUSED',world.note,'ESC  RESUME     J  JOURNAL','#7aa2f7');
  }
  completionFx.draw(ctx);
 });
 return{scene,world,dispose:()=>{engine.stopRenderLoop();window.removeEventListener('resize',resize);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);audio.dispose();scene.dispose();engine.dispose();engineCanvas.remove();}};
}
