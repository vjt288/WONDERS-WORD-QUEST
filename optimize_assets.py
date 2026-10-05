"""Build lossless delivery variants; never overwrite original game artwork."""
from pathlib import Path
from PIL import Image, ImageSequence, ImageChops
import json
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '_site')
report = []
gif_replacements = {}

def visually_equal(a, b):
    for color in ('black', 'white'):
        bg = Image.new('RGBA', a.size, color)
        aa = Image.alpha_composite(bg, a).convert('RGB')
        bb = Image.alpha_composite(bg, b).convert('RGB')
        if ImageChops.difference(aa, bb).getbbox():
            return False
    return True

for source in sorted((root / 'assets').rglob('*')):
    if source.suffix.lower() not in ('.png', '.gif'):
        continue
    with Image.open(source) as original:
        animated = getattr(original, 'n_frames', 1) > 1
        if source.suffix.lower() == '.gif' and (original.info.get('loop') != 0 or original.n_frames > 60):
            continue
        target = Path(str(source) + '.wwq.webp')
        options = dict(format='WEBP', lossless=True, exact=True, quality=100, method=4)
        if original.info.get('icc_profile'):
            options['icc_profile'] = original.info['icc_profile']
        if animated:
            frames = []
            durations = []
            for frame in ImageSequence.Iterator(original):
                frames.append(frame.convert('RGBA').copy())
                durations.append(frame.info.get('duration', 100))
            frames[0].save(target, save_all=True, append_images=frames[1:],
                           duration=durations, loop=original.info.get('loop', 1), **options)
            with Image.open(target) as rebuilt:
                valid = rebuilt.n_frames == len(frames)
                for i, expected in enumerate(frames):
                    if not valid:
                        break
                    rebuilt.seek(i)
                    actual = rebuilt.convert('RGBA')
                    valid = visually_equal(expected, actual) and rebuilt.info.get('duration') == durations[i]
            if not valid:
                # Animated PNGs are not expected in this package; refuse a changed PNG.
                assert source.suffix.lower() == '.gif', 'Animated PNG fidelity failure'
                continue
        else:
            expected = original.convert('RGBA')
            expected.save(target, **options)
            with Image.open(target) as rebuilt:
                assert expected.tobytes() == rebuilt.convert('RGBA').tobytes(), str(source)
        if source.suffix.lower() == '.gif':
            if target.stat().st_size >= source.stat().st_size:
                continue
            relative = source.relative_to(root).as_posix()
            gif_replacements[relative] = relative + '.wwq.webp'
        report.append({'path': source.relative_to(root).as_posix(), 'before': source.stat().st_size,
                       'after': target.stat().st_size, 'frames': getattr(original, 'n_frames', 1)})

html_path = root / 'index.html'
html = html_path.read_text(encoding='utf-8')
# Every PNG variant is built, including dynamically constructed picture/thumbnail names.
html = html.replace('.png', '.png.wwq.webp')
for source, target in gif_replacements.items():
    html = html.replace(source, target)
html_path.write_text(html, encoding='utf-8')
(root / 'asset-optimization-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('Verified lossless assets:', len(report), 'bytes:', sum(r['before'] for r in report), '->', sum(r['after'] for r in report))
