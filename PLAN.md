# SIGNAL — Portfolio Build Plan

## Product decision

The project follows **Scope A: Portfolio** from `DESIGN_SPEC.md`. The shipped target is a polished, single-sitting browser game covering Stages 1–3, with Melody's art direction and a written design rationale. Stages 4–9 remain a preserved long-form vision, not active implementation scope.

## Current baseline

Stage 1 — Reception — is playable in this archive. It contains movement, running, jumping, hiding, one guard, a ceiling camera, evidence collection, key gating, a journal overlay, audio synthesis, a one-use camera jammer, and a reactive guard investigation state.

Stage 2 — East Corridor — is now playable at `?stage=2`. It contains a 2000px scrolling coordinate space, two independent guard lanes, barriers, a central camera, five cover landmarks, three evidence documents, a ward key, and an east-wing exit. It uses the shared audio director with stage, footsteps, alert, servo, pickup, and escape cues.

Stage 3 — The Archives — is now playable at `?stage=3`. It adds a long archive room with shelf banks, three shadow hiding spots, dynamic light pools, an archivist patrol, three evidence documents, an archive key, and a terminal puzzle. The terminal is awakened with `T` and accepts the current story-safe puzzle code `241`; the code remains an implementation hook until the canonical narrative puzzle is authored.

Stage 4 — The Vault — is now playable at `?stage=4`. It adds generated vault background art, a laser-grid timing section, a hackable security camera, a biometric scanner, a remote door override, an armored patrol, three evidence documents, and a vault token. The camera uses `H`, the biometric scanner uses `B`, and the remote override uses `R`.

Stage 4 now ends with a timed final escape: once the vault token, evidence, biometric scan, and remote override are complete, the player must run beyond the open blast door to the service tunnel.

Stages 5–9 now have playable first-pass slices at `?stage=5` through `?stage=9`: Doctor’s Office laser control, Laboratory technician-style route pressure, Basement Storage limited-visibility/light-and-rescue objective, Server Room 60-second upload, and Director’s Office signed-document rooftop escape. The remaining open story questions are intentionally represented by neutral evidence labels until canon is decided.

The audio pass now gives every stage a distinct synthesized music bed selected from the route (`stage=1` through `stage=4`), layered under the existing institutional ambience. Footsteps, pickups, alerts, camera/terminal interactions, stage transitions, and exits remain event-driven sound effects. Browser audio begins after the first keyboard gesture.

## Ordered milestones

### Milestone 1 — Spec alignment and Stage 1 polish

Preserve the current Stage 1 mechanics while replacing remaining visual placeholders with approved 32×32 and prop artwork. Add a title-card intro, authored pickup reactions, and a clean stage-complete transition. Do not add combat, mouse controls, or distraction throwing.

### Milestone 2 — Stage 2: East Corridor

Build the specified 2000px horizontal corridor with soft-follow camera scrolling, three zones divided by jumpable waist-high barriers, two independent guard lanes, the central ceiling camera, five hiding spots, three evidence documents, and the ward key. Reuse the Stage 1 stealth rules and add multi-enemy coordination without introducing a new player ability.

### Milestone 3 — Stage 3: Patient Ward

Build the emotional centerpiece: six beds, curtains, nurses station, bathroom, running machines, and authored environmental storytelling. Implement the nurse rounds route and delayed security call described in the specification. Keep the three evidence items and doctor's office key, while leaving Fiona's personal effects and the third evidence text as explicit content hooks until canon is supplied.

### Milestone 4 — Portfolio finish

Add cross-stage evidence state, stage title cards and fade transitions, a final ending presentation for the three-stage slice, Melody's approved art across Stages 1–3, Fiona's four-note theme, a deterministic demo path per stage, and a shipping checklist for itch.io's offline single-file target.

## Risk slices

| Risk | Milestone | Verification |
|---|---|---|
| Horizontal camera and 2000px world | 2 | Camera follows Finn, clamps at both ends, and preserves a 960×540 logical viewport. |
| Multiple simultaneous guard lanes | 2 | Each guard patrols independently, detects running, and contributes to the same recoverable suspicion model. |
| Nurse rounds plus delayed call | 3 | Nurse visits Bed 1 → 2 → 3 → desk, and an alert schedules security after eight seconds. |
| Stage transitions and persistence | 4 | Evidence and audio state survive a fade between stages, while stage-local pickups reset only on restart. |
| Art replacement | 1–4 | Runtime assets remain separate from gameplay logic and retain code-drawn fallbacks. |

## Verification criteria

- Stage 1 remains playable with the locked keyboard controls: A/D or arrows move, Shift runs, Space/W/Up jumps, E hides, M mutes, J opens the journal, and Q uses the one-shot jammer.
- Stage 2 has a horizontally scrolling 2000px world, two guard lanes, a central camera, barriers that are jumpable by Finn, and a working exit gate.
- Stage 3 has the nurse rounds route, delayed security response, four curtain hides, an under-bed hide, a bathroom hide, three evidence items, and the doctor's office key.
- Stage 3 Archives has a visible stealth meter, shadow pools at hiding spots, a terminal interaction prompt, code entry feedback, and a gated archive exit.
- Stage 4 has visible laser beams, a camera hack state, biometric acceptance state, remote door override state, a vault exit gate, and generated room/character art.
- Stages 2–4 visibly use generated background plates and shared character sprites; code-drawn figures remain only as fallbacks.
- The progression harness completes all four stages and validates the intended gate order: Stage 1 evidence/key exit, Stage 2 evidence/ward key exit, Stage 3 terminal/evidence/archive key exit, and Stage 4 camera → biometric → remote override → vault token exit.
- Character sprites in every stage share the platform baseline at logical Y=410; jump and hidden poses are offset from that baseline rather than from their physics origin.
- Stage 4 has a visible red escape state after the remote door opens; Stages 5–9 each expose their new mechanic and objective in the HUD and title screen.
- Stage 9 has been tested live with `?stage=9&demo=1`: the signed authorization is collected, the rooftop timer begins, the camera pans smoothly toward the roof, and the roof threshold completes the sequence.
- Scrolling stages now interpolate a camera target at 8x smoothing rather than snapping to the player. All stage completions trigger a shared colored particle burst, and all worlds use normalized player half-width/half-height constants for floor landing and pickup overlap.
- Stage transitions show the stage title and preserve the intended narrative order.
- `pnpm check` and `pnpm build` pass after each milestone.
- `?demo` produces a deterministic, screenshot-verifiable traversal for every implemented stage.

## Content decisions intentionally deferred

The specification marks the experiment purpose, Fiona's status, the doctor's identity and motivation, the finale format, evidence carryover, the 30-day timer, and several Stage 3 personal details as open. These are not to be silently invented in production narrative text. The implementation may use temporary labels and data hooks until the author resolves them.

## Demo mode

`?demo` remains the deterministic verification path. Each stage must eventually expose a stage-specific demo route rather than relying on a single Stage 1 autopilot.

## Source of truth

`DESIGN_SPEC.md` is the canonical design document. This file translates it into the active engineering sequence. `STRUCTURE.md` defines runtime ownership. `MEMORY.md` records implementation discoveries and deviations.

## Current next task

Start Milestone 1 polish without changing the established control scheme, then expand Stage 2 with authored prop art and a dedicated journal overlay before building Stage 3.

## References

[1]: DESIGN_SPEC.md "SIGNAL Game Design Specification v1.0"
[2]: STRUCTURE.md "SIGNAL Runtime Structure"
[3]: MEMORY.md "SIGNAL Implementation Memory"
[4]: ASSETS.md "SIGNAL Asset Manifest"
[5]: https://itch.io/ "itch.io"
[6]: https://www.babylonjs.com/ "Babylon.js"
[7]: https://www.typescriptlang.org/docs/ "TypeScript Documentation"
[8]: https://vite.dev/guide/ "Vite Guide"
[9]: https://pnpm.io/ "pnpm Documentation"
[10]: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API "MDN Canvas API"
[11]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API "MDN Web Audio API"
[12]: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent "MDN KeyboardEvent"

## References in prose

The active scope and stage requirements are defined by the uploaded game specification [1]. Runtime ownership remains aligned with the existing project structure [2], asset handling stays in the asset manifest [4], and shipping remains targeted at an offline browser build for itch.io [5].

The implementation uses the existing TypeScript, Vite, Babylon.js lifecycle, Canvas rendering, keyboard input, and Web Audio foundations [6] [7] [8] [10] [11] [12].
