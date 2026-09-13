from pathlib import Path

root=Path('/home/ubuntu/signal-game/client/src/game')

# Stage 1: align player and guard sprite feet to the renderer's floorY while preserving jump height.
p=root/'draw.ts'; s=p.read_text()
s=s.replace("drawSprite(c,guardFrame||sprites.guard,gx-24,302,48,94,w.guard.dir<0)", "drawSprite(c,guardFrame||sprites.guard,gx-24,w.floorY-94,48,94,w.guard.dir<0)")
s=s.replace("drawSprite(c,playerFrame||sprites.finn,px-25,w.player.y-playerH,50,playerH,w.player.facing<0)", "drawSprite(c,playerFrame||sprites.finn,px-25,w.floorY-playerH-(366-w.player.y),50,playerH,w.player.facing<0)")
s=s.replace("c.fillRect(px-22,402,44,3)", "c.fillRect(px-22,w.floorY-3,44,3)")
s=s.replace("drawSprite(c,hiddenFrame,w.player.x-25,w.player.y-72,50,72,w.player.facing<0)", "drawSprite(c,hiddenFrame,w.player.x-25,w.floorY-72,50,72,w.player.facing<0)")
p.write_text(s)

# Stage 2: use floorY for all generated character art and fallback bodies.
p=root/'corridorDraw.ts'; s=p.read_text()
s=s.replace("c.drawImage(guard,x-25,302,50,94)", "c.drawImage(guard,x-25,w.floorY-94,50,94)")
s=s.replace("c.drawImage(finn,px-25,w.player.y-94,50,94)", "c.drawImage(finn,px-25,w.floorY-94-(366-w.player.y),50,94)")
p.write_text(s)

# Stage 3: use floorY for archive character art and its fallback.
p=root/'archivesDraw.ts'; s=p.read_text()
s=s.replace("c.drawImage(guard,gx-25,302,50,94)", "c.drawImage(guard,gx-25,w.floorY-94,50,94)")
s=s.replace("c.drawImage(finn,px-25,w.player.y-94,50,94)", "c.drawImage(finn,px-25,w.floorY-94-(366-w.player.y),50,94)")
p.write_text(s)

# Stage 4: align character art to the same floor plane.
p=root/'vaultDraw.ts'; s=p.read_text()
s=s.replace("c.drawImage(guard,gx-26,302,52,96)", "c.drawImage(guard,gx-26,w.floorY-96,52,96)")
s=s.replace("c.drawImage(finn,px-28,w.player.y-98,56,98)", "c.drawImage(finn,px-28,w.floorY-98-(366-w.player.y),56,98)")
p.write_text(s)
print('character baselines aligned to floorY=410')
