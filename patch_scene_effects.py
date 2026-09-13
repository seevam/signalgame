from pathlib import Path
p=Path('/home/ubuntu/signal-game/client/src/game/scene.ts');s=p.read_text()
s=s.replace("import {AudioDirector} from './audio';", "import {AudioDirector} from './audio';import {CompletionBurst} from './effects';") if "CompletionBurst" not in s else s
s=s.replace("const audio=new AudioDirector();let wasAlert", "const audio=new AudioDirector();const completionFx=new CompletionBurst();let wasAlert") if "completionFx" not in s else s
s=s.replace("if(world.mode==='win'&&!wasWin){audio.escape();wasWin=true;}", "if(world.mode==='win'&&!wasWin){audio.escape();completionFx.trigger();wasWin=true;}completionFx.update(dt);")
s=s.replace("}engine.resize();});return{scene", "}completionFx.draw(ctx);engine.resize();});return{scene")
p.write_text(s)
print('completion particles wired')
