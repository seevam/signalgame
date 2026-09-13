// Simulates every stage to completion with its own demo driver, then walks the
// campaign the way the win screen does: stage N complete -> stage N+1 title.
import {TOTAL_STAGES, clampStage, createWorldForStage, stageMeta} from './client/src/game/stages';

const DT = 1 / 60;
const MAX_SECONDS = 180;

const results: Record<string, string> = {};
for (let stage = 1; stage <= TOTAL_STAGES; stage++) {
  const world: any = createWorldForStage(stage);
  if (world.mode !== 'title') throw new Error(`Stage ${stage} should open on its title card`);
  world.start(true);
  if (world.mode !== 'play') throw new Error(`Stage ${stage} did not start`);
  let elapsed = 0;
  while (world.mode === 'play' && elapsed < MAX_SECONDS) { world.step(DT); elapsed += DT; }
  if (world.mode !== 'win') throw new Error(`Stage ${stage} (${stageMeta(stage).build}) ended as "${world.mode}" after ${elapsed.toFixed(1)}s: ${world.note}`);
  results[`stage${stage}`] = `${world.mode} in ${elapsed.toFixed(1)}s`;

  const next = stage < TOTAL_STAGES ? stage + 1 : 1;
  if (clampStage(stage + 1) !== next && stage < TOTAL_STAGES) throw new Error(`Stage ${stage} does not advance to ${next}`);
  if (!stageMeta(next)) throw new Error(`Stage ${next} has no metadata to show on the next title card`);
}

// A finished stage must not be silently restartable by movement keys.
const finished: any = createWorldForStage(1);
finished.start(false);
finished.pickups.forEach((p: any) => (p.taken = true));
finished.player.x = 900;
finished.step(DT);
if (finished.mode !== 'win') throw new Error('Stage 1 win setup failed');
finished.press('d');
finished.step(DT);
if (finished.mode !== 'win') throw new Error('Input after a win should not resume the stage');

console.log(JSON.stringify(results, null, 1));
