// Shared movement constants. DESIGN_SPEC: walk 112 px/s, run 190 px/s, "Jump clears 53px. Barriers are 40px."
export const GRAVITY=700;
export const JUMP_VELOCITY=-Math.round(Math.sqrt(2*GRAVITY*53)); // -272 → 53px apex
