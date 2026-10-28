// Shared movement constants. DESIGN_SPEC: walk 112 px/s, run 190 px/s, "Jump clears 53px. Barriers are 40px."
export const GRAVITY=700;
export const JUMP_VELOCITY=-Math.round(Math.sqrt(2*GRAVITY*53)); // -272 → 53px apex
// Jump input is buffered: a tap is remembered for this long and spent on the next grounded frame.
// Movement keys are sampled once per frame, so without this a quick tap that starts and ends between
// two frames is lost — common at low frame rates, and Stage 2's barriers cannot be crossed without jumping.
export const JUMP_BUFFER=0.15;
export const isJumpKey=(key:string)=>key===' '||key==='w'||key==='arrowup';
