# SIGNAL — Game Design Specification

**Version 1.0 · Compiled from eight months of build sessions**
**Melody Sun, design and art · Shivam Sahu, development**

---

> **How to read this document**
>
> Fields marked ✅ are **decided** — they exist in the built game or have been consistently used across sessions.
>
> Fields marked ⚠️ are **open** — they have never been decided. Options are given. Melody picks.
>
> Nothing in this document is final until she says it is.

---

# PART ONE — MASTER SPEC

## Working title
✅ **SIGNAL**

Kept in all caps in UI and marketing. The word carries three meanings in the game: a transmission Finn is trying to send out, the hospital's monitoring equipment, and the vital sign that flatlines when he's caught.

---

## Genre
✅ 2D side-view stealth horror. Narrative-driven, single-sitting length.

Not action horror. There is no combat. The only verbs are move, hide, and take.

---

## One-sentence game idea
✅ A teenage boy breaks into the hospital where his sister died, collecting the paperwork that proves she was experimented on, while avoiding the staff still working the night shift.

---

## Target platform
✅ Web browser, desktop, via itch.io. Runs offline from a single HTML file.

⚠️ *Open:* whether a mobile/touch version is worth building. Recommendation — no, for the portfolio version. Keyboard controls are core to the timing.

---

## Single-player or multiplayer
✅ Single-player only. No online features, no leaderboards, no accounts.

---

## Camera
✅ Side-view, locked vertically, following horizontally with a soft-follow and clamped ends.

Stage 1 uses a single fixed screen (960×540). Stage 2 introduces horizontal scrolling across a 2000px world. Later stages may use either.

The camera never rotates, never zooms, never cuts. The player always sees the whole room height. Threats come from the sides, never from off-screen above or below.

---

## Art style
✅ Pixel art, hospital-institutional, deeply desaturated.

**Palette — locked:**

| Role | Hex | Use |
|---|---|---|
| Void | `#12141d` | Background, shadow |
| Floor | `#2d3250` | Floor tiles |
| Wall | `#414868` | Walls, ceiling |
| Prop | `#565f89` | Furniture |
| Finn | `#bb9af7` | Player accent |
| Alarm | `#f7768e` | Guards, danger, detection |
| Safe | `#9ece6a` | Safe states, plants |
| Gold | `#e0af68` | Keys, suspicion warning |
| Glass | `#7aa2f7` | Evidence, cameras, information |
| Paper | `#d5dae8` | Documents, UI text |

**Rules:** hard pixel edges, no anti-aliasing, no gradients except light falloff. Colour is used semantically, not decoratively — red always means threat, blue always means information, gold always means progress.

⚠️ *Open:* sprite dimensions confirmed at 32×32 for characters, but Melody has produced only doctor and nurse sprites so far. The built game uses code-drawn placeholders.

---

## Setting
✅ **Saint Cross Hospital.** Night. Present day, unspecified city.

Nine floors, working from ground level upward. The building is operational but understaffed at this hour — this is a night shift, not an abandoned ruin. Lights work. Machines run. That's what makes it unsettling.

⚠️ *Open, and this is the biggest gap in the project:*

- What were the experiments actually testing?
- Why a hospital, and who funded it?
- Why Fiona specifically?

Everything else in the story hangs off these three answers. See **Part Three**.

---

## Main gameplay loop

✅ Built and working:

```
ENTER a room
      ↓
OBSERVE the patrol pattern from safety
      ↓
TIME a move into the exposed area
      ↓
TAKE evidence or a key
      ↓
HIDE when the pattern turns against you
      ↓
REACH the exit with everything required
      ↓
next room
```

The loop is **observe, time, commit, recover.** Suspicion rises while seen and decays while hidden, so a mistake is recoverable — the player is punished with time and tension, not instant death.

Failure occurs only when suspicion reaches 100%, which takes roughly three seconds of continuous exposure.

---

## Player abilities

✅ Built:

| Ability | Input | Notes |
|---|---|---|
| Walk | `A` `D` / `←` `→` | 112 px/s. Quiet. |
| Run | `Shift` + move | 190 px/s. Extends guard sight range 22% and makes noise. |
| Jump | `Space` / `W` / `↑` | Clears 53px. Barriers are 40px. |
| Hide | `E` near a hide spot | Fully undetectable. Cannot move while hidden. |
| Collect | Walk over an item | No input needed. |

Deliberately absent: no crouch, no combat, no throwing, no lockpicking, no light source. Every ability added is a rule the player must learn. Five is enough.

⚠️ *Open, worth considering for later stages:* a distraction throw. It would change the loop from purely reactive to partly proactive. Recommend against it for the portfolio version — it doubles the design work per room.

---

## Enemies

✅ Built:

**Security guard** — patrols a bounded lane, pauses at each end, turns. Has a 68° vision cone, 250px range. Enters an ALERT state when it sees you: stops, faces you, holds for 2.2 seconds after losing sight before resuming. Hears running within 210px even from behind.

**Ceiling camera** — sweeps a fixed 6.2 second cycle. Mounted above head height, so waist-high cover does not defeat it. Only timing or a hide spot works.

⚠️ *Open, sketched in the design guide but not built:*

**Nurse** — moves on a fixed rounds route rather than a patrol lane. Slower, more predictable, but calls security instead of catching you directly.

**Lab technician** — pauses at equipment to write notes, giving longer predictable windows. Shorter sight range.

**Elite guard** — faster, wider cone, never leaves the room. Intended for Stage 8.

**Design principle established in Stage 2:** each new enemy type should invalidate one solution the player has learned to trust. The camera invalidated cover. Whatever comes next should invalidate something else.

---

## World structure

✅ Linear. Nine stages, played in order, each one room or corridor.

No hub, no backtracking, no open world. Each stage is entered through a door and exited through another. Progress is one-way.

⚠️ *Open:* whether stages are separate scenes or one continuous building. Recommendation — separate, with a fade transition. Simpler to build, and each stage gets a title card, which helps pacing.

---

## Progression

✅ Within a stage: collect all evidence + the key, then the exit opens.

⚠️ *Open — never decided:*

**The 30-day timer.** It appears in the original premise and has never been implemented or explained. Options:

- **A.** Cut it. Nothing in the game currently uses it.
- **B.** It's story-only — Finn has thirty days before the hospital destroys the records. Referenced in dialogue, never a mechanic.
- **C.** It's a real mechanic — each stage costs days, and running out is a lose condition.

*Recommendation: B.* It adds pressure to the narrative without adding a system to balance.

**Evidence carrying across stages.** Currently each stage counts its own evidence. Should a running total carry through and affect the ending? If the game has multiple endings, it has to.

---

## Controls

✅ Locked:

```
A / D  or  ← / →     Move
Shift                 Run
Space / W / ↑         Jump
E                     Hide / unhide
M                     Mute
```

No mouse. No menus during play. Everything the player needs is on the keyboard's left hand plus one key.

---

## Must-have features

✅ Built:
- Player movement with run and jump
- Guard patrol AI with vision cones
- Line-of-sight blocking by geometry
- Suspicion meter with detection and decay
- Hiding spots
- Evidence collection
- Key and locked-door gating
- Win and lose states
- Synthesised audio — heartbeat, footsteps, alert, ambience
- Scrolling camera (Stage 2)
- Multiple simultaneous enemies (Stage 2)

⬜ Not yet built, required:
- Evidence journal — a place to re-read what you've collected
- Stage transitions
- Title screen with the intro
- Melody's art replacing all placeholders
- The ending

---

## Nice-to-have features

⬜ In rough priority order:

- Walk-cycle animation for Finn and the guard
- Finn's inner monologue on picking up evidence
- Distraction mechanic
- Multiple endings based on evidence collected
- Save and resume
- Settings menu with volume and difficulty
- Fiona's four-note theme threaded through the score
- Devlog on itch.io

Everything on this list can be cut without the game breaking.

---

## Games or visual references

✅ Referenced across sessions:

| Reference | What to take from it |
|---|---|
| Undertale | Pixel art carrying emotional weight; restraint in colour |
| Hotline Miami | Top-down tension, colour as threat signalling |
| Alien: Isolation | Hiding from a smarter enemy; the terror of being seen |
| Oxenfree | Teenage protagonist, mystery, naturalistic dialogue |
| Night in the Woods | Emotional story, distinctive art direction |
| Papers, Please | Institutional horror through paperwork |

⚠️ Melody's own reference points — oil painting, photography, clay sculpture from her China trip — have not yet influenced the art direction. They should. That's what would make this look like nobody else's game.

---

## Assets I already have

✅ Existing:

**Code-drawn placeholders (in the built game):** Finn, security guard, floor and wall tiles, reception desk, lockers, gurney, linen cart, chairs, plant, doors, keys, evidence documents, ceiling camera, all UI.

**Melody's sprites:** doctor, nurse. Created July 2026, not yet in the build.

**Audio:** entirely synthesised in-engine. No files needed. Covers heartbeat, footsteps, guard footsteps, alert sting, camera servo, pickup chimes, ambient drone, flatline, escape fanfare.

**Documents:** asset generation prompt library (40+ prompts), game design guide, this specification.

⬜ Needed from Melody:

| Asset | Size | Priority |
|---|---|---|
| Finn idle + 2 walk frames | 32×32 | 🔴 |
| Guard idle + 2 walk frames | 32×32 | 🔴 |
| Locker closed | 32×64 | 🔴 |
| Door locked / open | 32×64 | 🔴 |
| Keycard | 16×16 | 🔴 |
| Evidence document | 16×16 | 🔴 |
| Floor + wall tiles | 32×32 | 🟠 |
| Reception desk | 96×32 | 🟠 |
| Gurney | 112×38 | 🟠 |
| Ceiling camera | 24×16 | 🟠 |
| Cover art | 630×500 | 🟠 |

---

## Desired scope

⚠️ **This is the decision that shapes everything else, and it has not been made.**

| Option | Content | Hours | Ready by |
|---|---|---|---|
| **A — Portfolio** | Stages 1–3, fully polished, Melody's art throughout, shipped on itch.io with a design write-up | ~35 | October 2026 ✅ |
| **B — Half game** | Stages 1–5, playable, mixed art quality | ~70 | January 2027 ❌ |
| **C — Full game** | All 9 stages, all systems, multiple endings | ~126 | Mid 2027 ❌ |

**Recommendation: A.**

Melody's applications are due November 2026. One excellent room is stronger portfolio evidence than nine unfinished ones. Option A is the only one that arrives in time.

Stages 4–9 remain specified below so the work isn't lost, and so the design reads as a complete vision rather than a demo that stopped.

---

---

# PART TWO — STAGE SPECIFICATIONS

---

## STAGE 1 — Reception
### *"The First Step"* · ✅ **BUILT AND PLAYABLE**

**Purpose in the story**
Finn gets inside. He learns the hospital is not what it claims, and finds the first proof that Fiona's stay wasn't ordinary.

**Setting**
Ground floor reception. Waiting chairs, a desk with a live monitor, potted plant, two supply lockers. Fluorescent strips overhead, one flickering.

**Teaches**
Move, run, jump, hide. Read a vision cone. Understand that suspicion rises and falls.

**Enemies**
One security guard. Patrol lane 545–870. Speed 76 px/s. Pauses 1.5s at each end.

**Hiding spots**
Behind the reception desk · Supply cart (mid-lane) · Supply locker (far side)

**Evidence — 3**
1. *Visitor log* — Fiona signed in on the 14th. There is no matching sign-out.
2. *Crumpled note* — "They moved her to the east wing. Don't ask at the desk."
3. *Intake form* — Admitted for observation. The consent line is signed by staff, not by her.

**Key** Staff keycard, in the open floor at the edge of the patrol lane

**Objective** Collect all 3 evidence + keycard → east wing door opens

**Difficulty** 1/6 — tutorial. Wide spaces, one slow guard, obvious cover.

**Mood** Quiet wrongness. Nothing has happened yet.

**Design note**
The desk sits *outside* the patrol lane, making the left half of the room a genuine safe zone. It's short enough that standing on top puts you back in view — cover you must stay behind, not on. This was the fix for a bug where the desk sat inside the lane and made the whole level trivial.

---

## STAGE 2 — East Corridor
### *"Something's Wrong Here"* · ✅ **BUILT AND PLAYABLE**

**Purpose in the story**
The scale of the thing becomes clear. Two guards, a camera, torn-out records. This isn't one doctor acting alone.

**Setting**
A 2000px corridor split into three zones by waist-high barriers. Closed doors line both walls. Half the ceiling tubes are dead.

**Teaches**
That cover which beats a guard does not beat a camera. That running is loud. That the room can be longer than the window.

**Enemies**
- Guard A — lane 170–656, speed 74
- Guard B — lane 1300–1830, speed 88
- Ceiling camera — sweeps a 6.2s cycle over the middle zone, mounted above cover height

**Hiding spots**
Janitor alcove · Under the gurney · Linen cart (under the camera) · Wall recess · Supply locker

**Evidence — 3**
1. *Transfer order* — Fiona moved to the east wing on the 19th. No physician signature.
2. *Shift log* — Two nights that week have been torn out of the book entirely.
3. *Dosage sheet* — Whatever they were giving her, it isn't on any formulary.

**Key** Ward key, deep in Guard B's zone

**Objective** All 3 evidence + ward key → patient ward door opens

**Difficulty** 3/6

**Mood** Escalation. The building is bigger than you thought and staffed by more people than should be here at 2am.

**Design note**
The barriers do triple duty — they bound both guards' patrols, they're jumpable by the player, and they split one long room into three digestible problems. One object solving level design and AI bounding simultaneously.

---

## STAGE 3 — Patient Ward
### *"Fiona Was Here"* · ⬜ **SPECIFIED, NOT BUILT**

**Purpose in the story**
The emotional centre of the first act. Finn stands where his sister slept. The investigation becomes personal.

**Setting**
A ward of six beds in two rows, curtains between them. Nurses station at one end, small bathroom at the other. Machines still running beside empty beds.

**New mechanic**
**Nurse rounds.** A nurse checks each bed in fixed sequence — Bed 1 → 2 → 3 → desk → repeat. More predictable than a patrol, but the route covers the whole room, so there's no permanently safe zone. Being seen doesn't catch you directly; she calls security, and a guard enters after 8 seconds.

**Enemies** One nurse (rounds). One guard entering only if alerted.

**Hiding spots** Behind each bed curtain (4) · Under a bed · The bathroom

**Evidence — 3**
1. *Medical chart* — treatments that don't correspond to her admitting condition
2. *Personal effects* — ⚠️ Melody decides what Fiona left behind
3. ⚠️ Melody's choice

**Key** Doctor's office key, at the nurses station

**Difficulty** 3/6 — but slower and quieter than Stage 2. A deliberate breath after the corridor.

**Mood** Grief. This should be the stage people remember.

**Environmental storytelling — worth getting right**
One bed with flowers. One with restraint straps still attached. A window sill with scratch marks. A child's drawing hidden behind a wall picture. Nothing labelled, nothing explained.

⚠️ **Open:** which bed was Fiona's, and what's on it.

---

## STAGE 4 — Nurses Station
### *"Data Run"* · ⬜ **SPECIFIED, NOT BUILT**

**Purpose** Finn finds the first document naming Project SIGNAL.

**Setting** A cramped records hub. Computers, filing cabinets, a whiteboard, a wall of patient files.

**New mechanic**
**The download.** Finn must stand at a terminal for 30 seconds. He cannot move during it. Progress pauses when he leaves and resumes when he returns. A guard checks the room every 15 seconds. The player must interleave hiding with progress.

**Enemies** One guard on a strict 15s room-check cycle.

**Hiding spots** Under the desk · Filing cabinet alcove · Behind the door

**Evidence — 2 + the download**
1. Password on a sticky note — ⚠️ where Melody hides it
2. ⚠️ Melody's choice
3. The downloaded file (the objective itself)

**Difficulty** 4/6

**Mood** Held breath. The most sustained tension in Act 1.

---

## STAGE 5 — Doctor's Office
### *"The Name"* · ⬜ **SPECIFIED, NOT BUILT**

**Purpose** The villain becomes a person with a name.

**Setting** A large private office. Bookshelves, a heavy desk, framed certificates, a locked drawer.

**New mechanic**
**Laser tripwires.** Three beams across the room. Triggering one starts a 10-second alarm during which guards converge. There's a control box somewhere that disables them — finding it is the puzzle.

**Enemies** One guard outside the door, entering only on alarm.

**Evidence — 2**
1. Authorization document naming the doctor and listing patients including Fiona
2. ⚠️ Melody's choice

⚠️ **Open — required before this stage can be written:**

```
Dr. ________________________

Age: _______________________
Appearance: ________________
Motivation:
  □ Believes it will cure something
  □ Money
  □ Was ordered by someone above
  □ Something else: ___________

What happens to them at the end?
____________________________
```

**Difficulty** 5/6

**Mood** Cold. Corporate. The horror of paperwork.

---

## STAGE 6 — Laboratory
### *"Experiment Seven"* · ⬜ **SPECIFIED, NOT BUILT**

**Purpose** Finn sees what was actually done. Not implied — shown.

**Setting** A basement-level lab. Equipment running unattended. Specimen jars. A chair with restraints.

**New mechanic**
**Lab technicians.** A third enemy type that stops to write notes at each station — longer, more predictable pauses than a guard, but shorter sight range. Beatable by patience rather than speed.

**Enemies** Two lab technicians on staggered routes.

**Evidence — 3**
1. Experiment log
2. A physical sample
3. ⚠️ Melody's choice

⚠️ **Open, and this is the story's centre:** *what were the experiments?*

**Difficulty** 5/6

**Mood** The most uncomfortable stage in the game. Not gore — clinical indifference.

---

## STAGE 7 — Basement Storage
### *"What They're Hiding"* · ⬜ **SPECIFIED, NOT BUILT**

**Purpose** The twist. Everything Finn assumed turns out to be partly wrong.

**Setting** Near-total darkness. Storage racks, sealed rooms, a generator hum.

**New mechanic**
**Limited visibility.** Finn sees only a small radius. So do the guards — but they carry torches, so you can see them coming. There are light switches: turning them on helps you see and helps them see further.

**Enemies** Two guards with torch cones.

⚠️ **Open — the twist itself:**

- **A.** Fiona is alive, held here. Goal changes to rescue. She follows Finn, slowly.
- **B.** Other patients are here. Finn can save one before security responds. A moral choice.
- **C.** The programme is larger than the hospital — military or corporate funding. Stakes escalate.
- **D.** Melody's own.

**Difficulty** 6/6

**Mood** Fear. Real fear, earned by six stages of build-up.

---

## STAGE 8 — Server Room
### *"Upload"* · ⬜ **SPECIFIED, NOT BUILT**

**Purpose** Getting the truth out of the building.

**Setting** Rows of server racks. Loud cooling fans that mask footsteps — yours and theirs.

**New mechanic**
**The 60-second upload.** Same interleave as Stage 4 but tripled, with an elite guard who never leaves the room and can hear you over the fans.

**Enemies** One elite guard — faster, 120° cone, never departs.

**Difficulty** 6/6 — hardest stage in the game.

**Mood** Almost unbearable, then release.

**Design note** The music should count down with the player: layers adding every 15 seconds, resolving on completion.

---

## STAGE 9 — Director's Office
### *"The Truth Will Out"* · ⬜ **SPECIFIED, NOT BUILT**

**Purpose** Confrontation and escape.

**Setting** Top floor. Rain on the windows. A city visible for the first time in the whole game — the first exterior view, deliberately withheld until now.

⚠️ **Open — the finale format:**

- **A. Pure stealth.** The director is present and unaware. Sneak past, take the signed authorization, reach the roof.
- **B. Confrontation.** The director catches Finn and offers a deal. The player chooses.
- **C. Chase.** Full alarm, 60 seconds to the roof, guards flooding in.

⚠️ **Open — endings.** The design guide proposes evidence-count-based outcomes:

| Evidence collected | Outcome |
|---|---|
| All | Full exposure. Hospital closed. |
| Most | Investigation opened. Partial justice. |
| Minimum | Finn escapes but can't prove it. |
| ??? | ⚠️ Secret ending — Melody's to invent |

**Mood** Earned. Whatever else, the ending should make the player feel the six hours of dread meant something.

---

---

# PART THREE — DECISIONS STILL OPEN

Every question below blocks something downstream. They're ordered by how much they unblock.

### 🔴 Blocking — nothing past Stage 5 can be written without these

**1. What were the experiments?**
The entire story hangs here. Not "illegal experiments" — what, specifically, were they doing, and to what end?

**2. Is Fiona alive?**
Determines Stage 7, the ending, and the emotional register of the whole second half.

**3. What is the doctor's name and motivation?**
Stage 5 cannot be written without this.

### 🟠 Important — shapes stages but not blocking

**4. Which ending format?** (A, B, or C in Stage 9)
**5. Does evidence carry between stages?**
**6. What is the 30-day timer for?**

### 🟡 Worth deciding, easily changed

**7.** Finn's age and exactly how he got in
**8.** Whether other patients appear
**9.** Whether anyone in the hospital helps him
**10.** What Fiona left behind in the ward

---

# PART FOUR — CURRENT STATUS

```
FOUNDATION            ████████████████████  100%
  movement · physics · collision · camera

ENEMY AI              ████████████████░░░░   80%
  patrol · vision · detection · alert · sound · camera
  missing: nurse, technician, elite guard

STEALTH SYSTEMS       ██████████████░░░░░░   70%
  suspicion · hiding · line of sight
  missing: journal, distraction

CONTENT               ████░░░░░░░░░░░░░░░░   22%
  2 of 9 stages built

ART                   ██░░░░░░░░░░░░░░░░░░   10%
  2 sprites made, none integrated
  everything else is code-drawn placeholder

STORY                 ██████░░░░░░░░░░░░░░   30%
  premise and 6 evidence pieces exist
  centre of the mystery undecided

AUDIO                 ██████████████░░░░░░   70%
  fully synthesised, working
  missing: Fiona's theme, stage-specific scoring

SHIPPING              ░░░░░░░░░░░░░░░░░░░░    0%
  not yet on itch.io
```

---

# PART FIVE — THE NEXT FOUR THINGS

If scope option **A** is chosen, this is the entire remaining plan.

**1. Melody answers the three blocking questions.** One sitting, thirty minutes. Multiple choice where possible.

**2. Melody's art replaces every placeholder in Stages 1 and 2.** The functions to change are `drawPlayer`, `drawGuard`, and `drawProps`. Game logic and art are cleanly separated — she cannot break detection by changing how Finn looks.

**3. Build Stage 3.** The emotional one. It's the stage worth having in a portfolio.

**4. Ship on itch.io** with a written design rationale in Melody's voice.

Nothing else. Not the poster, not the title animation, not Stages 4–9.

---

*SIGNAL — Game Design Specification v1.0*
*Compiled September 2026*