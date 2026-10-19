// A stealth autopilot that can play any stage. It powers ?demo and the playability tests, which
// check that every stage is winnable by careful play — and that holding → or sprinting is not.
//
// Each stage exposes a small view of itself (StealthStage). The policy, every frame:
//   hidden  → stay hidden until no watcher could see Finn, then step out
//   exposed → hide if standing in cover, otherwise head for the nearest cover (or back off)
//   safe    → walk toward the current goal, but never into a watcher's view or a hazard,
//             and never overtake a guard from behind (that puts Finn in front of him)
//   at goal → press the goal's keys (hack, scan, upload…)
import type {Guard} from './stealth';

export type Goal={x:number;keys?:string[];hold?:boolean;run?:boolean;reach?:number};
export type Cover={x:number;w:number};
export interface StealthStage{
  mode:string;
  player:{x:number;y:number;vy:number;hidden:boolean;facing:number;crouching?:boolean};
  keys:Set<string>;
  press(key:string):void;
  watchers():Guard[];
  covers():Cover[];
  /** would Finn standing at x be detected by a camera, laser or similar within `lookahead` seconds */
  hazardAt(x:number,lookahead:number):boolean;
  goal():Goal|null;
  barriers?:{x:number;w:number}[];
}

const inCover=(s:StealthStage,x:number)=>s.covers().some(c=>x>=c.x+4&&x<=c.x+c.w-4);
const coverCentre=(c:Cover)=>c.x+c.w/2;

function watcherThreat(g:Guard,x:number,margin:number){
  const d=x-g.x,dist=Math.abs(d);
  if(g.state==='alert'||g.state==='chase')return dist<g.range+margin;
  const facing=Math.sign(d)===g.dir||dist<1;
  if(facing&&dist<g.range+margin)return true;
  if(g.state==='investigate'&&dist<g.range+margin)return true;
  // paused at the end of his lane with Finn behind him: he is about to turn round
  if(g.pauseTimer>0&&!facing&&dist<g.range+margin)return true;
  return dist<40;  // bumping into him
}
export function threatened(s:StealthStage,x:number,margin=50,lookahead=.35,consider:(g:Guard)=>boolean=()=>true){
  return s.watchers().filter(consider).some(g=>watcherThreat(g,x,margin))||s.hazardAt(x,lookahead);
}

/** Drives one frame of play: sets s.keys and presses actions. */
export function autopilot(s:StealthStage){
  s.keys.clear();
  if(s.mode!=='play')return;
  const p=s.player,g=s.goal();if(!g)return;
  const grounded=p.vy===0;

  if(p.hidden){
    // step out only when nobody could see Finn for a good margin
    if(!threatened(s,p.x,90,.8))s.press('e');
    return;
  }
  if(p.crouching)return;
  // fleeing on a timer: a guard chasing from behind is a reason to keep running, not to stop
  const goalDir=Math.sign(g.x-p.x)||1;
  const relevant=(w:Guard)=>!(g.run&&w.state==='chase'&&Math.sign(w.x-p.x)!==goalDir);
  const watcherDanger=s.watchers().filter(relevant).some(w=>watcherThreat(w,p.x,50));
  if(watcherDanger&&s.watchers().filter(relevant).filter(w=>watcherThreat(w,p.x,50)).every(w=>w.motionOnly)&&!inCover(s,p.x))return; // freeze
  if(watcherDanger){
    if(inCover(s,p.x)&&grounded){s.press('e');return;}
    // walk (never sprint: running is loud and extends sight) to the nearest cover, or back away
    const near=[...s.covers()].sort((a,b)=>Math.abs(coverCentre(a)-p.x)-Math.abs(coverCentre(b)-p.x))[0];
    if(near&&Math.abs(coverCentre(near)-p.x)<260)s.keys.add(coverCentre(near)>p.x?'d':'a');
    else{const t=[...s.watchers()].sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];s.keys.add(t&&t.x>p.x?'a':'d');}
    return;
  }
  if(s.hazardAt(p.x,.35)){
    if(inCover(s,p.x)&&grounded){s.press('e');return;}
    // a camera or laser is coming: step to the nearest spot it won't reach
    for(let off=10;off<=240;off+=10)for(const dir of [Math.sign(g.x-p.x)||1,-(Math.sign(g.x-p.x)||1)]){
      const x=p.x+dir*off;if(!s.hazardAt(x,.6)&&!threatened(s,x,30,0)){s.keys.add(dir>0?'d':'a');return;}}
    return;
  }
  const reach=g.reach??6;
  const dx=g.x-p.x;
  if(Math.abs(dx)<=reach){
    for(const k of g.keys??[])s.press(k);
    if(g.hold)return;
  }
  if(Math.abs(dx)>reach||!g.hold){
    const dir=Math.sign(dx)||1;
    const ahead=p.x+dir*24;
    // don't overtake a guard walking the same way — wait for him to turn and pass over cover
    const blocking=s.watchers().some(w=>w.state!=='chase'&&Math.sign(w.x-p.x)===dir&&Math.abs(w.x-p.x)<110&&Math.sign(g.x-w.x)===dir);
    if(threatened(s,ahead,30,.35,relevant)||blocking)return;   // wait here; the exposed branch takes over if needed
    s.keys.add(dir>0?'d':'a');
    // sprint only when no searching guard is within earshot — running right past one is how you get heard
    if(g.run&&!s.watchers().some(w=>w.state!=='chase'&&Math.abs(w.x-p.x)<w.hearing+40))s.keys.add('shift');
    if(grounded&&s.barriers?.some(b=>dir>0?b.x-p.x>0&&b.x-p.x<34:p.x-(b.x+b.w)>0&&p.x-(b.x+b.w)<34))s.press(' ');
  }
}
