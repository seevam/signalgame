from pathlib import Path
p=Path('/home/ubuntu/signal-game/client/src/game/scene.ts');s=p.read_text();s=s.replace('completionFx.update(dt);completionFx.draw(ctx);','completionFx.update(dt);');s=s.replace('}engine.resize();});return{scene','}completionFx.draw(ctx);engine.resize();});return{scene',1);p.write_text(s);print('effects draw order fixed')
