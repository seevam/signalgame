import type {MouseEvent} from 'react';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {createGameScene} from '../game/scene';
import {TOTAL_STAGES,clampStage,loadUnlocked,stageMeta,unlockStage} from '../game/stages';

const readStageFromUrl=()=>{if(typeof window==='undefined')return 1;return clampStage(Number(new URLSearchParams(window.location.search).get('stage')||1));};
const writeStageToUrl=(stage:number)=>{if(typeof window==='undefined')return;const url=new URL(window.location.href);url.searchParams.set('stage',String(stage));window.history.replaceState(null,'',url.toString());};

export default function Home(){
  const ref=useRef<HTMLCanvasElement>(null);
  const [stage,setStage]=useState(readStageFromUrl);
  const [unlocked,setUnlocked]=useState(loadUnlocked);
  const [world,setWorld]=useState<any>(null);
  const [,setTick]=useState(0);
  const meta=stageMeta(stage);
  // buttons must not keep focus, or ENTER/SPACE would re-fire them instead of reaching the game
  const act=(run:()=>void)=>(event:MouseEvent<HTMLButtonElement>)=>{event.currentTarget.blur();run();};

  const goToStage=useCallback((next:number)=>{const target=clampStage(next);writeStageToUrl(target);setStage(target);setWorld(null);},[]);
  const handleComplete=useCallback((completed:number)=>{setUnlocked(unlockStage(completed+1));},[]);

  useEffect(()=>{
    if(!ref.current)return;
    writeStageToUrl(stage);
    const handle=createGameScene(ref.current,{stage,onAdvance:goToStage,onStageComplete:handleComplete});
    setWorld(handle.world);
    const id=window.setInterval(()=>setTick(v=>v+1),120);
    return()=>{window.clearInterval(id);handle.dispose();};
  },[stage,goToStage,handleComplete]);

  const evidence=world?.evidenceCount?.()??world?.evidence??0;
  const key=world?.hasKey?.()??world?.key??false;
  const stealth=world?.stealth??Math.max(0,100-(world?.suspicion??0));
  const mode=world?.mode??'title';
  const entries:string[]=useMemo(()=>((world?.pickups??[]).filter((p:any)=>p.taken).map((p:any)=>p.label) as string[]).concat(world?.journal??[]),[world,evidence]);
  const isFinal=stage>=TOTAL_STAGES;
  const showSecondMeter=stage!==3;

  return <main className="signal-app">
    <section className="game-frame">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">◈</span><span>SIGNAL</span><small>ST. CROSS // NIGHT SHIFT</small></div>
        <div className="status-line"><span className="live-dot"/> LIVE MONITORING <span className="clock">02:14 AM</span></div>
      </header>
      <div className="canvas-wrap"><canvas ref={ref} width={960} height={540} aria-label="SIGNAL stealth horror game canvas"/></div>
      <footer className="bottom-bar">
        <span>{meta.build}</span>
        <span className="footer-hint">J JOURNAL <i/> M MUTE <i/> ESC PAUSE</span>
      </footer>
    </section>
    <aside className="intel-panel">
      <div className="panel-kicker">CASE FILE / {String(stage).padStart(3,'0')}</div>
      <h1>{meta.title}</h1>
      <p className="dek">Finn breaks into Saint Cross to find the paperwork that proves Fiona was experimented on.</p>
      <div className="panel-rule"/>
      {mode==='win'&&<div className="stage-banner win">
        <b>{isFinal?'CAMPAIGN COMPLETE':`STAGE ${String(stage).padStart(2,'0')} COMPLETE`}</b>
        <p>{world?.note}</p>
        <div className="stage-actions">
          {!isFinal&&<button type="button" className="primary" onClick={act(()=>goToStage(stage+1))}>NEXT STAGE  {String(stage+1).padStart(2,'0')} →</button>}
          {isFinal&&<button type="button" className="primary" onClick={act(()=>goToStage(1))}>RESTART CAMPAIGN</button>}
          <button type="button" onClick={act(()=>world?.start?.(false))}>REPLAY STAGE</button>
        </div>
      </div>}
      {mode==='lose'&&<div className="stage-banner lose">
        <b>SIGNAL LOST</b>
        <p>{world?.note}</p>
        <div className="stage-actions"><button type="button" className="primary" onClick={act(()=>world?.start?.(false))}>RETRY STAGE</button></div>
      </div>}
      <div className="objective"><span className="obj-icon">✦</span><div><b>OBJECTIVE</b><p>{world?.note??meta.objective}</p></div></div>
      <div className="meter-label"><span>STEALTH</span><span className={stealth<30?'danger':''}>{Math.round(stealth)}%</span></div>
      <div className={`meter good${stealth<30?' low':''}`}><div style={{width:`${Math.max(0,Math.min(100,stealth))}%`}}/></div>
      {showSecondMeter&&<>
        <div className="meter-label">
          <span>{stage===8?'UPLOAD':stage===9?'ROOF TIMER':'SUSPICION'}</span>
          <span className={(world?.suspicion??0)>70?'danger':''}>{stage===8?`${Math.floor(world?.progress??0)}/60`:stage===9?`${Math.max(0,60-Math.ceil(world?.alarm??0))}s`:`${Math.round(world?.suspicion??0)}%`}</span>
        </div>
        <div className="meter"><div style={{width:`${stage===8?((world?.progress??0)/60*100):stage===9?((world?.alarm??0)/60*100):(world?.suspicion??0)}%`}}/></div>
      </>}
      <div className="collect-grid">
        <div className="collect-card"><span className="collect-num">{String(evidence).padStart(2,'0')}</span><span className="collect-label">EVIDENCE<br/><em>DOCUMENTS</em></span></div>
        <div className="collect-card"><span className="collect-num">{key?'01':'00'}</span><span className="collect-label">{stage>=5?'ACCESS':'STAFF'}<br/><em>KEY</em></span></div>
      </div>
      <div className="journal-preview">
        <div className="preview-head"><span>JOURNAL</span><span>{evidence}/3 FOUND</span></div>
        {!entries.length&&<div className="empty-entry">No records recovered yet.</div>}
        {entries.map((entry,i)=><div className="entry" key={i} title={entry}><span className="entry-dot"/>{entry}</div>)}
      </div>
      <div className="stage-select">
        <div className="panel-kicker">STAGE SELECT</div>
        <div className="stage-chips">
          {Array.from({length:TOTAL_STAGES},(_,i)=>i+1).map(n=>
            <button key={n} type="button" className={`stage-chip${n===stage?' current':''}`} disabled={n>unlocked} title={n>unlocked?'Locked — finish the previous stage':`Stage ${n}`} onClick={act(()=>goToStage(n))}>{String(n).padStart(2,'0')}</button>)}
        </div>
      </div>
      <div className="controls">
        <div className="panel-kicker">FIELD CONTROLS</div>
        <div className="control-row"><kbd>A</kbd><kbd>D</kbd><span>MOVE</span></div>
        <div className="control-row"><kbd>SHIFT</kbd><span>RUN / NOISY</span></div>
        <div className="control-row"><kbd>SPACE</kbd><span>JUMP</span></div>
        <div className="control-row"><kbd>E</kbd><span>HIDE / UNHIDE</span></div>
        {stage===1&&<div className="control-row"><kbd>Q</kbd><span>JAM CAMERA</span></div>}
        {stage===3&&<div className="control-row"><kbd>T</kbd><span>WAKE TERMINAL</span></div>}
        {stage===4&&<>
          <div className="control-row"><kbd>H</kbd><span>HACK CAMERA</span></div>
          <div className="control-row"><kbd>B</kbd><span>BIOMETRIC SCAN</span></div>
          <div className="control-row"><kbd>R</kbd><span>OVERRIDE / ESCAPE</span></div>
        </>}
        {stage===5&&<div className="control-row"><kbd>X</kbd><span>DISABLE LASERS</span></div>}
        {stage===7&&<>
          <div className="control-row"><kbd>L</kbd><span>LIGHTS</span></div>
          <div className="control-row"><kbd>R</kbd><span>RESCUE</span></div>
        </>}
        {stage===8&&<div className="control-row"><kbd>U</kbd><span>START UPLOAD</span></div>}
        {stage===9&&<div className="control-row"><kbd>SHIFT</kbd><span>REACH THE ROOF</span></div>}
        <div className="control-row"><kbd>ENTER</kbd><span>{mode==='win'?(isFinal?'RESTART CAMPAIGN':'NEXT STAGE'):mode==='lose'?'RETRY STAGE':'START STAGE'}</span></div>
      </div>
      <div className="panel-foot">NO COMBAT. NO SECOND CHANCES.<br/><span>EVERYTHING YOU NEED IS ALREADY INSIDE.</span></div>
    </aside>
  </main>;
}
