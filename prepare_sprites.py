from pathlib import Path
from PIL import Image

root = Path('/home/ubuntu/signal-game')
out = root / 'client/public/generated'
out.mkdir(parents=True, exist_ok=True)


def alpha_bbox(image: Image.Image):
    rgba = image.convert('RGBA')
    alpha = rgba.getchannel('A')
    return alpha.getbbox()


def prepare_single(name: str, target: str, size: int = 128):
    image = Image.open(root / name).convert('RGBA')
    bbox = alpha_bbox(image)
    if bbox:
        image = image.crop(bbox)
    image.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(image, ((size - image.width) // 2, (size - image.height) // 2))
    canvas.save(out / target, optimize=True)


prepare_single('generated-finn-idle.png', 'finn-idle.png')
prepare_single('generated-guard-idle.png', 'guard-idle.png')
prepare_single('generated-guard-alert.png', 'guard-alert.png')
prepare_single('generated-nurse-idle.png', 'nurse-idle.png')

# The walk generation is a two-frame sheet. Split the square into two equal halves,
# crop each frame's alpha bounds, and preserve a consistent 128px runtime canvas.
walk = Image.open(root / 'generated-finn-walk.png').convert('RGBA')
mid = walk.width // 2
for index, box in enumerate(((0, 0, mid, walk.height), (mid, 0, walk.width, walk.height))):
    frame = walk.crop(box)
    bbox = alpha_bbox(frame)
    if bbox:
        frame = frame.crop(bbox)
    frame.thumbnail((128, 128), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    canvas.alpha_composite(frame, ((128 - frame.width) // 2, (128 - frame.height) // 2))
    canvas.save(out / f'finn-walk-{index}.png', optimize=True)

print('\n'.join(str(path) for path in sorted(out.glob('*.png'))))
