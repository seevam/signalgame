// Character drawing with a procedural walk cycle.
//
// Every character sprite is a single still image, so motion is made in code: the sprite is split at
// the hip, the body bobs, and the legs are drawn in horizontal strips whose width narrows toward the
// feet — legs apart at each footfall, together as they pass. Phase advances with distance travelled,
// so feet don't skate, and walking vs running falls out of measured speed.

// Measurements of each sprite, in its own source pixels: the top of the head, the hip line where the
// legs begin, the lowest opaque row (the soles), the body's centre column at the hip, and which way
// the art faces. Measured from the PNGs' alpha channels.
export type SpriteRig={top:number;hip:number;foot:number;cx:number;facing:1|-1};
export const RIGS={
  finnStage3:{top:3,hip:86,foot:156,cx:79,facing:1},
  guardStage3:{top:2,hip:85,foot:156,cx:85,facing:-1},
  finnWalk:{top:13,hip:75,foot:112,cx:69,facing:1},
  finnIdle:{top:15,hip:73,foot:115,cx:63,facing:1},
  guardIdle:{top:11,hip:73,foot:119,cx:63,facing:1},
  guardAlert:{top:5,hip:72,foot:123,cx:65,facing:-1},
  tech:{top:11,hip:84,foot:116,cx:63,facing:1},          // nurse-idle.png, used for the lab technicians
} satisfies Record<string,SpriteRig>;

export const FINN_HEIGHT=88;
export const GUARD_HEIGHT=94;

const STRIDE=64;          // world px per full cycle (two steps)
const STRIPS=10;          // leg slices
type Motion={x:number;t:number;dist:number;speed:number;leg:number;bob:number};
const motions=new WeakMap<object,Motion>();

function track(key:object,worldX:number,now:number){
  let m=motions.get(key);
  if(!m){m={x:worldX,t:now,dist:0,speed:0,leg:.8,bob:0};motions.set(key,m);}
  const dt=Math.min(.1,Math.max(.001,(now-m.t)/1000));
  const dx=Math.abs(worldX-m.x);
  const teleported=dx>120;   // a restart or a scripted move, not a step
  if(!teleported)m.dist+=dx;
  m.speed+=((teleported?0:dx/dt)-m.speed)*Math.min(1,dt*14);
  m.x=worldX;m.t=now;
  return {m,dt};
}

const usable=(img:CanvasImageSource|null|undefined):img is HTMLImageElement|HTMLCanvasElement=>{
  if(!img)return false;
  if(img instanceof HTMLImageElement)return img.complete&&img.naturalWidth>0;
  return (img as HTMLCanvasElement).width>0;
};

export type WalkerOptions={
  key:object;          // the character object; animation state is kept per object
  worldX:number;       // position in world space, used to measure movement
  screenX:number;      // where to draw the body centre
  feetY:number;        // where the soles touch
  height?:number;      // figure height in screen px (head to soles)
  facing:number;       // direction the character faces (+1 right, -1 left)
  airborne?:boolean;
  crouch?:number;      // 0 standing … 1 fully crouched
  still?:boolean;      // hold a standing pose even if moving (e.g. alert)
  alpha?:number;
  now?:number;         // clock override (ms) for tests; defaults to performance.now()
};

/** Draws a character with a walk/run cycle. Returns false when the image isn't ready (caller draws a fallback). */
export function drawWalker(c:CanvasRenderingContext2D,img:CanvasImageSource|null|undefined,rig:SpriteRig,o:WalkerOptions){
  if(!usable(img))return false;
  const now=o.now??performance.now();
  const {m,dt}=track(o.key,o.worldX,now);
  const moving=!o.still&&!o.airborne&&m.speed>15;
  const running=m.speed>150;
  const phase=(m.dist/STRIDE)%1;
  const spread=Math.abs(Math.cos(phase*2*Math.PI));          // 1 at a footfall, 0 as the legs pass
  // target leg width at the feet (1 = as drawn) and body lift in screen px
  let legTarget:number,bobTarget:number;
  if(o.airborne){legTarget=.6;bobTarget=0;}
  else if(moving){legTarget=running?.3+.85*spread:.4+.6*spread;bobTarget=(running?3.5:2)*(1-spread);}
  else{legTarget=.78;bobTarget=.8*(.5-.5*Math.cos(now/1000*2*Math.PI/2.6));}  // idle: slow breath
  // ease toward the target so stopping, starting and landing don't pop
  const k=moving?1:Math.min(1,dt*12);
  m.leg+=(legTarget-m.leg)*k;m.bob+=(bobTarget-m.bob)*k;

  const H=(img as HTMLImageElement).naturalHeight||(img as HTMLCanvasElement).height;
  const W=(img as HTMLImageElement).naturalWidth||(img as HTMLCanvasElement).width;
  const height=o.height??FINN_HEIGHT;
  const s=height/(rig.foot-rig.top);
  const flip=Math.sign(o.facing||1)===rig.facing?1:-1;
  const lean=moving&&running?.07:moving?.025:0;               // radians, forward
  const crouchDrop=(o.crouch??0)*(rig.foot-rig.hip)*.45;      // source px the hip sinks
  const lift=m.bob/s-crouchDrop;                              // source px the hip rises

  c.save();
  if(o.alpha!==undefined)c.globalAlpha*=o.alpha;
  c.imageSmoothingEnabled=false;
  c.translate(Math.round(o.screenX),Math.round(o.feetY));
  c.rotate(lean*Math.sign(o.facing||1));
  c.scale(flip*s,s);
  // From here, source pixel (sx, sy) of the sprite lands at (sx - cx, sy - foot): soles on the origin.
  const hipY=rig.hip-rig.foot-lift;
  c.drawImage(img,0,0,W,rig.hip,-rig.cx,-rig.foot-lift,W,rig.hip+.6);   // upper body, overlaps the legs slightly
  const legBottom=H-rig.foot;
  for(let i=0;i<STRIPS;i++){
    const a=i/STRIPS,b=(i+1)/STRIPS;
    const sy0=rig.hip+(H-rig.hip)*a,sy1=rig.hip+(H-rig.hip)*b;
    const dy0=hipY+(legBottom-hipY)*a,dy1=hipY+(legBottom-hipY)*b;
    const kx=1+(m.leg-1)*Math.pow((a+b)/2,1.15);               // full width at the hip, m.leg at the feet
    c.drawImage(img,0,sy0,W,sy1-sy0,-rig.cx*kx,dy0,W*kx,dy1-dy0+.6);
  }
  c.restore();
  return true;
}

/** Awareness meter and state glyph over a guard's head: how close he is to spotting Finn. */
export function drawAwareness(c:CanvasRenderingContext2D,g:{state:string;awareness:number},x:number,headY:number){
  const a=Math.max(0,Math.min(1,g.awareness));
  const glyph=g.state==='alert'||g.state==='chase'?'!':g.state==='investigate'?'?':'';
  c.save();
  if(a>.02||glyph){
    const w=30,h=4,bx=Math.round(x-w/2),by=Math.round(headY-12);
    c.fillStyle='rgba(12,14,24,.8)';c.fillRect(bx-1,by-1,w+2,h+2);
    c.fillStyle=a>.66?'#f7768e':a>.33?'#e0af68':'#9aa8ce';c.fillRect(bx,by,Math.round(w*a),h);
  }
  if(glyph){
    const pulse=1+.15*Math.sin(performance.now()/90);
    c.font=`bold ${Math.round(16*pulse)}px ui-monospace,monospace`;c.textAlign='center';
    c.fillStyle=glyph==='?'?'#e0af68':'#f7768e';c.fillText(glyph,x,headY-18);
  }
  c.restore();
}
