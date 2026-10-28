// Shared guard behaviour for every stage.
//
// DESIGN_SPEC: "Failure occurs only when suspicion reaches 100%, which takes roughly three seconds of
// continuous exposure" at the edge of sight. Closer is faster — walking into a guard's face is a
// mistake, not a shortcut. A guard who spots Finn stops and keeps facing him, so slipping past the
// front of a guard doesn't break line of sight; only cover, distance or a hide spot does.

export type GuardState='patrol'|'alert'|'investigate'|'chase';
export type Seen={x:number;hidden:boolean;running:boolean};

export const ALERT_HOLD=2.2;          // seconds a guard holds after losing sight
export const EDGE_RATE=32;            // suspicion/s when seen at the edge of sight (~3s to fail)
export const CLOSE_BOOST=1.8;         // extra multiplier at point blank (≈ 90/s, ~1.1s to fail)
export const HEARD_RATE=22;           // suspicion/s when a guard only hears running
export const RUN_SIGHT=1.22;          // DESIGN_SPEC: running "extends guard sight range 22%"
export const TRACK_REACH=1.15;        // an alerted guard keeps turning to follow Finn within this × sight range

/** Suspicion per second from being seen at `dist` by a watcher with sight `range`. */
export function sightRate(dist:number,range:number,edgeRate=EDGE_RATE){
  if(dist>=range)return 0;
  const close=1-dist/range;
  return edgeRate*(1+CLOSE_BOOST*close*close);
}

export type GuardOptions={x:number;dir:number;min:number;max:number;speed:number;range?:number;hearing?:number;pause?:number;chaseSpeed?:number;edgeRate?:number};

export class Guard{
  x:number;dir:number;state:GuardState='patrol';
  min:number;max:number;speed:number;range:number;hearing:number;pause:number;chaseSpeed:number;edgeRate:number;
  pauseTimer=0;alertTimer=0;investigateTimer=0;target=0;reactTimer=0;
  /** 0..1, eased — drives the awareness meter over the guard's head */
  awareness=0;
  /** true on the frame the guard first spots Finn (for the alert sting) */
  spotted=false;
  /** set when a chasing guard reaches Finn */
  caught=false;
  /** only notices movement: standing still in view is (nearly) safe */
  motionOnly=false;
  constructor(o:GuardOptions){
    this.x=o.x;this.dir=o.dir;this.min=o.min;this.max=o.max;this.speed=o.speed;
    this.range=o.range??250;this.hearing=o.hearing??180;this.pause=o.pause??1.2;this.chaseSpeed=o.chaseSpeed??o.speed*1.6;this.edgeRate=o.edgeRate??EDGE_RATE;
  }
  /** Walk to `x` and look around for `seconds` (a noise, a tripped wire, a jammer). */
  investigate(x:number,seconds:number){if(this.state==='alert'||this.state==='chase')return;this.state='investigate';this.target=x;this.investigateTimer=seconds;this.pauseTimer=0;}
  /** Run at Finn until he hides or is caught. */
  chase(x:number,reaction=0){this.state='chase';this.target=x;this.pauseTimer=0;this.reactTimer=reaction;}
  sightFor(p:Seen){return this.range*(p.running?RUN_SIGHT:1);}
  sees(p:Seen){const d=p.x-this.x;return !p.hidden&&Math.abs(d)<this.sightFor(p)&&(Math.sign(d)===this.dir||Math.abs(d)<1);}
  hears(p:Seen){return !p.hidden&&p.running&&Math.abs(p.x-this.x)<this.hearing;}

  /** Advances the guard one step and returns the suspicion per second he adds. */
  update(dt:number,p:Seen,rangeOverride?:number):number{
    const range=rangeOverride??this.range;const savedRange=this.range;this.range=range;
    const dist=Math.abs(p.x-this.x);
    const sees=this.sees(p),heard=!sees&&this.hears(p);
    const wasAlert=this.state==='alert'||this.state==='chase';
    this.spotted=false;
    if(this.state==='chase'&&this.reactTimer>0){
      // the moment between hearing the alarm and moving: he turns toward Finn
      this.reactTimer=Math.max(0,this.reactTimer-dt);this.dir=Math.sign(p.x-this.x)||this.dir;if(!p.hidden)this.target=p.x;
    }else if(this.state==='chase'){
      if(!p.hidden)this.target=p.x;
      const d=this.target-this.x;
      if(Math.abs(d)>2){this.dir=Math.sign(d);this.x+=this.dir*Math.min(this.chaseSpeed*dt,Math.abs(d));}
      if(!p.hidden&&dist<26)this.caught=true;
      // lost him: search where he was last seen
      if(p.hidden&&Math.abs(d)<=2){this.state='investigate';this.investigateTimer=2.5;}
    }else if(sees||heard){
      if(!wasAlert)this.spotted=true;
      this.state='alert';this.alertTimer=ALERT_HOLD;this.pauseTimer=0;
      this.dir=Math.sign(p.x-this.x)||this.dir;           // turn to face him and keep watching
    }else if(this.state==='alert'){
      // he is watching: if Finn slips past him in the open, he turns to follow — only cover or distance loses him
      if(!p.hidden&&dist<range*TRACK_REACH)this.dir=Math.sign(p.x-this.x)||this.dir;
      this.alertTimer-=dt;if(this.alertTimer<=0)this.state='patrol';
    }else if(this.state==='investigate'){
      const d=this.target-this.x;
      if(Math.abs(d)>3){this.dir=Math.sign(d);this.x+=this.dir*Math.min(this.speed*1.4*dt,Math.abs(d));}
      else{this.investigateTimer-=dt;if(this.investigateTimer<=0){this.state='patrol';}}
    }else if(this.pauseTimer>0){
      this.pauseTimer=Math.max(0,this.pauseTimer-dt);
      if(this.pauseTimer===0)this.dir=this.x<=this.min?1:this.x>=this.max?-1:-this.dir;
    }else{
      // back into the lane after investigating or chasing, then patrol it
      if(this.x<this.min-1){this.dir=1;this.x=Math.min(this.min,this.x+this.speed*dt);}
      else if(this.x>this.max+1){this.dir=-1;this.x=Math.max(this.max,this.x-this.speed*dt);}
      else{this.x+=this.dir*this.speed*dt;
        if(this.x<=this.min&&this.dir<0){this.x=this.min;this.pauseTimer=this.pause||1e-6;}
        else if(this.x>=this.max&&this.dir>0){this.x=this.max;this.pauseTimer=this.pause||1e-6;}}
    }
    const seeing=this.sees(p);
    this.awareness+=((seeing?Math.min(1,.35+(1-dist/range)):heard?.5:0)-this.awareness)*Math.min(1,dt*8);
    this.range=savedRange;
    if(this.state==='chase')return 0;
    return seeing?sightRate(dist,range*(p.running?RUN_SIGHT:1),this.edgeRate):heard?HEARD_RATE:0;
  }
}
