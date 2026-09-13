from pathlib import Path
root=Path('/home/ubuntu/signal-game/client/src/game')
configs={
 'corridor.ts':('readonly width=2000; readonly height=540; readonly floorY=410;','readonly width=2000; readonly height=540; readonly floorY=410; readonly playerHalfWidth=18; readonly playerHalfHeight=44; cameraX=0;', 'this.player.x=Math.max(35,Math.min(1930,this.player.x));', 'this.player.x=Math.max(35,Math.min(1930,this.player.x));const cameraTarget=Math.max(0,Math.min(1040,this.player.x-420));this.cameraX+=(cameraTarget-this.cameraX)*Math.min(1,dt*8);'),
 'archives.ts':('readonly width=1800; readonly height=540; readonly floorY=410;','readonly width=1800; readonly height=540; readonly floorY=410; readonly playerHalfWidth=18; readonly playerHalfHeight=44; cameraX=0;', 'this.player.x=Math.max(35,Math.min(1740,this.player.x));','this.player.x=Math.max(35,Math.min(1740,this.player.x));const cameraTarget=Math.max(0,Math.min(840,this.player.x-360));this.cameraX+=(cameraTarget-this.cameraX)*Math.min(1,dt*8);'),
 'vault.ts':('readonly width=1600;readonly height=540;readonly floorY=410;','readonly width=1600;readonly height=540;readonly floorY=410;readonly playerHalfWidth=18;readonly playerHalfHeight=44;cameraX=0;', 'this.player.x=Math.max(35,Math.min(1590,this.player.x));','this.player.x=Math.max(35,Math.min(1590,this.player.x));const cameraTarget=Math.max(0,Math.min(640,this.player.x-350));this.cameraX+=(cameraTarget-this.cameraX)*Math.min(1,dt*8);'),
 'campaign.ts':('readonly stage:number;readonly width=1700;readonly height=540;readonly floorY=410;','readonly stage:number;readonly width=1700;readonly height=540;readonly floorY=410;readonly playerHalfWidth=18;readonly playerHalfHeight=44;cameraX=0;', 'this.player.x=Math.max(35,Math.min(1635,this.player.x));','this.player.x=Math.max(35,Math.min(1635,this.player.x));const cameraTarget=Math.max(0,Math.min(740,this.player.x-350));this.cameraX+=(cameraTarget-this.cameraX)*Math.min(1,dt*8);'),
}
for name,(old,new,needle,repl) in configs.items():
 p=root/name;s=p.read_text();s=s.replace(old,new,1);s=s.replace(needle,repl,1);s=s.replace('this.player={x:90,y:366,vy:0,hidden:false,running:false};','this.player={x:90,y:366,vy:0,hidden:false,running:false};this.cameraX=0;',1);p.write_text(s)
# Renderer camera expressions use interpolated world camera positions.
for name,old in [('corridorDraw.ts','const cam=Math.max(0,Math.min(1040,w.player.x-420));'),('archivesDraw.ts','const cam=Math.max(0,Math.min(840,w.player.x-360));'),('vaultDraw.ts','const cam=Math.max(0,Math.min(640,w.player.x-350));'),('campaignDraw.ts','const cam=Math.max(0,Math.min(740,w.player.x-350));')]:
 p=root/name;s=p.read_text();s=s.replace(old,'const cam=w.cameraX;',1);p.write_text(s)
print('camera smoothing and collision constants patched')
