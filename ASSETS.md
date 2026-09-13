# Assets

**Art direction:** Deeply desaturated institutional pixel horror. Hard pixel edges. Void navy `#12141d`, slate floor `#2d3250`, wall `#414868`, props `#565f89`, Finn violet `#bb9af7`, alarm `#f7768e`, safe `#9ece6a`, gold `#e0af68`, information blue `#7aa2f7`, paper `#d5dae8`. Fixed side-view composition with strong horizontal lanes and sparse fluorescent light.

| Asset | Source | Runtime use |
|---|---|---|
| `signal-reference.png` | Manus built-in image generation | Visual target / art direction reference |
| `finn.png` | Manus built-in image generation | Original character art source |
| `guard.png` | Manus built-in image generation | Original enemy art source |
| `finn-runtime.png` | Deterministic crop/resize from generated art | Runtime Finn sprite at `/manus-storage/finn-runtime_70accfc8.png` |
| `guard-runtime.png` | Deterministic crop/resize from generated art | Runtime guard sprite at `/manus-storage/guard-runtime_e8ea46af.png` |
| `finn-walk-0/1.png` | Generated 2-frame walk sheet, cropped for runtime | Finn walk-cycle frames at `/manus-storage/finn-walk-0_38d1878d.png` and `/manus-storage/finn-walk-1_87a0b8a2.png` |
| `guard-walk-0/1.png` | Generated 2-frame walk sheet, cropped for runtime | Guard walk-cycle frames at `/manus-storage/guard-walk-0_fb7c88fc.png` and `/manus-storage/guard-walk-1_4c9d47ff.png` |
| `signal-prop-0..3.png` | Generated locker, door, evidence, and keycard sheet, cropped for runtime | Prop sprites at `/manus-storage/signal-prop-0_6cc08405.png`, `/manus-storage/signal-prop-1_1e9051fb.png`, `/manus-storage/signal-prop-2_fdab235d.png`, `/manus-storage/signal-prop-3_0dddbb4c.png` |
| `finn-jump-0.png` | Generated dedicated jump pose, cropped for runtime | `/manus-storage/finn-jump-0_9c3148f1.png` |
| `finn-hide-0.png` | Generated dedicated hiding pose, cropped for runtime | `/manus-storage/finn-hide-0_bc04284a.png` |
| `guard-alert-0.png` | Generated dedicated alert pose, cropped for runtime | `/manus-storage/guard-alert-0_4011ff31.png` |

The first vertical slice now uses the generated local runtime set for Finn and the guard at `/generated/finn-idle.png`, `/generated/finn-walk-0.png`, `/generated/finn-walk-1.png`, `/generated/guard-idle.png`, and `/generated/guard-alert.png`. The generated nurse at `/generated/nurse-idle.png` is reserved for Stage 3. The current runtime reuses Finn's idle art for jump, land, crouch, and hide fallbacks until dedicated poses are generated. Code-drawn silhouettes remain as load-failure fallbacks so the scene stays playable if assets are unavailable. Fluorescent fixtures use downward linear light pools to establish a consistent ceiling-to-floor direction, and the camera sweep uses the same phase for its beam and suspicion detection.

## Generated local sprite set

| Asset | Prompt intent | Runtime path |
|---|---|---|
| `generated-finn-idle.png` | Finn, teenage investigator, violet hoodie, side-view | `/generated/finn-idle.png` |
| `generated-finn-walk.png` | Two-pose Finn walk sheet, split into runtime frames | `client/public/generated/finn-walk-0.png`, `client/public/generated/finn-walk-1.png` |
| `generated-guard-idle.png` | Saint Cross security guard, navy uniform | `/generated/guard-idle.png` |
| `generated-guard-alert.png` | Guard with raised flashlight and alarm accent | `/generated/guard-alert.png` |
| `generated-nurse-idle.png` | Night nurse with clipboard for Stage 3 | `/generated/nurse-idle.png` |

## Stage background and shared character art

| Asset | Runtime use |
|---|---|
| `finn-stage3.png` | Shared Finn sprite for Stages 2–4 at `/generated/finn-stage3.png` |
| `guard-stage3.png` | Shared security guard sprite for Stages 2–4 at `/generated/guard-stage3.png` |
| `corridor-bg.jpg` | Generated East Corridor background plate at `/generated/corridor-bg.jpg` |
| `archives-bg.jpg` | Generated Archives background plate at `/generated/archives-bg.jpg` |
| `vault-bg.jpg` | Generated Vault background plate at `/generated/vault-bg.jpg` |

Stages 2–4 now load character art and background plates before rendering their procedural interaction overlays. Procedural shapes remain only as load-failure fallbacks and for gameplay-critical markers such as pickups, laser beams, terminal prompts, and biometric state.
