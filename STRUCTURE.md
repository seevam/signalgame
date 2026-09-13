# SIGNAL — Runtime Structure

- `client/src/App.tsx` owns the single game route.
- `client/src/pages/Home.tsx` hosts the full-screen game shell and HUD.
- `client/src/game/stages.ts` owns campaign progression: stage count, per-stage metadata, the stage→world factory, and the unlocked-stage value persisted in `localStorage`.
- `client/src/game/scene.ts` owns the Babylon Engine lifecycle, runtime sprite loading, animation frame selection, and a lightweight 2D canvas renderer driven by the Babylon render loop.
- `client/src/game/world.ts` contains the current Stage 1 simulation: movement, patrol AI, vision, hiding, collision, pickup collection, gating, jammer interaction, and win/lose transitions.
- Future stages should move stage-specific data into plain TypeScript stage definitions and keep shared rules in reusable managers rather than coupling new stages to React.
- `client/src/game/draw.ts` contains pixel-art-inspired rendering helpers and scene composition.
- `client/src/game/audio.ts` owns Web Audio synthesis for the low hospital drone, footsteps, pickup chimes, alert stings, and escape fanfare. Audio unlocks on the first keyboard gesture and respects the M mute control.
- Generated image assets are uploaded to Manus Storage and referenced from the page as art-direction/character textures; the runtime also uses code-drawn silhouettes so the single-file/offline design remains resilient.

## Stage architecture direction

The portfolio build uses separate stage simulations with a shared logical 960×540 viewport. Stage 1 remains a fixed room. Stage 2 introduces a 2000px world coordinate space and a horizontal camera offset. Stage 3 reuses the same camera contract and adds nurse rounds plus delayed security response. Stage transitions own title-card and fade state; evidence persistence belongs to a session-level progression object rather than individual stage worlds.

## Rendering contract
React is the picture frame and HUD shell. Babylon Engine owns the animation/render loop. The game canvas is a 960×540 logical viewport scaled to the browser. The scene is rendered with Canvas 2D for crisp pixel-art control inside the Babylon lifecycle; no React state is used by gameplay classes.

## Stage progression

`Home.tsx` holds the current stage in React state (seeded from `?stage=`, kept in the URL via `history.replaceState`) and rebuilds the scene whenever it changes. The scene reports upward through `onStageComplete` (unlocks the next stage) and `onAdvance` (the player asked for the next stage); it never navigates by itself. On the win screen ENTER advances — or restarts the campaign after stage 9 — and R replays the current stage; the intel panel offers the same actions as buttons plus a stage-select for everything unlocked.

Pause (ESC) and the journal overlay (J) are scene-level state, not world modes: freezing the simulation must never change `world.mode`, or the win/lose overlays and ENTER handling read the wrong state.
