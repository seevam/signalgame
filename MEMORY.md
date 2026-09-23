# MEMORY

- The project is a WebDev `web-static` app and must remain frontend-only.
- Stage 1 is the right first slice: one guard, three evidence pickups, one keycard, three hide zones, and one exit.
- Use a Babylon Engine lifecycle but keep the game loop framework-agnostic and render crisp pixel-inspired 2D via a logical canvas.
- Generated art is registered in ASSETS.md; future iterations can replace code-drawn silhouettes with uploaded sprite URLs without changing gameplay ownership.

## Extension notes

- The reception console at x=704 is a deliberate one-use interaction. `GameWorld.interference` is authoritative for camera suppression; the draw layer shows JAM/OFF and the objective note uses the countdown.
- Q is handled in `scene.ts` as an interaction edge, separate from movement keys, so the mechanic remains framework-agnostic.
- While `interference > 0`, the guard switches to `investigate`, walks toward x=704, and resumes the patrol bounds after the jammer expires. The canvas draws the patrol rail, an investigation breadcrumb, and a `?` state marker.

## Design specification alignment

- `DESIGN_SPEC.md` is the canonical game document supplied by the author.
- Active scope is Option A: polish Stages 1–3 for a portfolio release. Stages 4–9 are preserved as future vision only.
- The uploaded document describes Stage 2 as built, but this archive contains only the Stage 1 runtime. Reconstructing Stage 2 is the next content milestone.
- Do not invent the unresolved experiment purpose, Fiona's status, doctor's identity, finale format, or Stage 3 personal details in authored story text. Keep those as data hooks until decided.
- Live browser test passed: title screen, Enter start, 960×540 canvas rendering, Stage 1 movement, generated sprite serving, audio unlock gesture, and Stage 2 title/corridor rendering and movement.
- Stage 2 is selected with `?stage=2`; it uses `CorridorWorld` and `corridorDraw.ts`. The shared audio director now includes jammer, investigation, and stage transition cues in addition to footsteps, pickups, alerts, servo, and escape sounds.
- Stage 3 is selected with `?stage=3`; it uses `ArchivesWorld` and `archivesDraw.ts`. `T` wakes the terminal and the current temporary code is `241`. The Archives renderer uses animated radial light pools, shelf banks, and active shadow pools for hiding spots.
- `Home.tsx` now exposes a green-to-danger stealth meter. Archives derives stealth from suspicion and recovers faster while hidden; Stage 1 and Stage 2 show the same normalized stealth value alongside suspicion where applicable.
- Stages 2–4 now load `/generated/finn-stage3.png` and `/generated/guard-stage3.png` instead of relying on procedural character silhouettes. Each stage also loads its generated background plate (`corridor-bg.jpg`, `archives-bg.jpg`, or `vault-bg.jpg`) and draws gameplay overlays on top.
- Stage 4 uses `VaultWorld` and `vaultDraw.ts`: H hacks the camera, B accepts the biometric scan, and R triggers the remote door override after the biometric gate. Laser safety timing is exposed through `laserPhase`.
- Stage 9 live demo (`?stage=9&demo=1`) reaches the signed document and roof run; the HUD shows `ROOF TIMER`, the city/rain window and roof marker render, and the stage completes at the roof threshold.
- `cameraX` is interpolated toward a stage-specific target in Corridor, Archives, Vault, and Campaign worlds and consumed by their renderers. `CompletionBurst` in `effects.ts` produces a 72-particle colored burst after every win state.
- World collision uses `playerHalfWidth=18`, `playerHalfHeight=44`, and `floorY=410`; jump/landing and pickup overlap now reference those constants instead of scattered magic values.
- `AudioDirector` now creates a stage-specific two-oscillator music bed on first user input. Stage roots are 46, 52, 58, and 64 Hz for Stages 1–4, with Stage 4 using a dissonant interval. Ambient drone and existing event SFX are muted together through `M`.
- `test_progression.ts` is the repeatable balance smoke test. It completed Stage 1, Stage 2, Archives terminal code `241`, and the Stage 4 camera/biometric/override chain successfully.
- Character art uses a shared `floorY=410` baseline. Stage 1–4 renderers anchor sprite feet to that line and apply jump offsets separately; this fixed the screenshot bug where Stage 2 characters appeared to walk above the platform.
- `VaultWorld.escapeActive` begins once the token/evidence, biometric scan, and remote override are complete and Finn reaches the open blast door; the final win requires running to x>1570. `vaultDraw.ts` overlays a red `FINAL ESCAPE` cue.
- `CampaignWorld` and `campaignDraw.ts` provide first-pass Stages 5–9. Stage 5 uses `X` to disable lasers; Stage 6 uses three lab stations and a key gate; Stage 7 uses `L` for lights and `R` for rescue; Stage 8 uses `U` and a 60-second stationary upload; Stage 9 collects the signed document then uses a timed roof run.

## Gameplay fix pass (September 2026)

- Stage 1 guard follows the spec: pauses 1.5s at each lane end before turning, and stops while ALERT until 2.2s after losing sight. Suspicion and the alert timer decay whenever nobody sees Finn — previously they froze inside camera-safe zones and during the jammer.
- Stage 2 now has what was drawn but not built: ceiling-camera detection over the middle zone, two solid 40px barriers you must jump (you can stand on them), and five named hide spots from the spec replacing a 470px "blind spot" strip.
- Jump velocity is shared and gives the spec's 53px apex (was 43px, which could not clear a 40px barrier).
- Stage 4 lasers were inverted — harmless before the camera hack, harmful after. The grid is now solid until hacked, then cycles with visible gaps. The laser beams painted into `vault-bg.jpg` are patched out at draw time (`PAINTED_BEAMS` in `vaultDraw.ts`) because the plate is screen-fixed and could never show the grid's real state.
- Stages 5–9: the E condition required `!hidden`, so hiding was permanent — fixed. Stage 7 lights now extend guard sight as the objective text says.
- Audio: heartbeat that quickens with suspicion, flatline on loss, and the alert sting now fires in every stage (it only checked a single `guard`).
- The build uses `base: "./"` and runtime art paths resolve against `import.meta.env.BASE_URL`, so it runs from a subfolder (itch.io). The unconfigured analytics tag that 404'd on every load is gone.

