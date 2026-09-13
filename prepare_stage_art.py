from pathlib import Path
from PIL import Image

root=Path('/home/ubuntu/signal-game')
out=root/'client/public/generated'

def crop_character(src,dst,size=160):
    image=Image.open(root/src).convert('RGBA')
    bbox=image.getchannel('A').getbbox()
    if bbox:image=image.crop(bbox)
    image.thumbnail((size,size),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(size,size),(0,0,0,0))
    canvas.alpha_composite(image,((size-image.width)//2,(size-image.height)//2))
    canvas.save(out/dst,optimize=True)

def background(src,dst):
    image=Image.open(root/src).convert('RGB')
    image.thumbnail((1280,720),Image.Resampling.LANCZOS)
    image.save(out/dst,optimize=True,quality=82)

crop_character('generated-finn-stage3.png','finn-stage3.png')
crop_character('generated-guard-stage3.png','guard-stage3.png')
background('generated-corridor-bg.png','corridor-bg.jpg')
background('generated-archives-bg.png','archives-bg.jpg')
background('generated-vault-bg.png','vault-bg.jpg')
print('prepared stage art')
