#!/usr/bin/env python3
"""Cut the hero set's channels out of the home-screen takes (tools/tv-take.sh).

    python3 tools/tv-encode.py <takes dir> [clip …]

Each clip is one or more pieces of a take, cropped to the iPad 13" home TV's
glass (1752x1118+156+780 of the 2064x2752 recording), joined, resampled to
30 fps, and written to tv/ as:
  <clip>.mp4        1280 wide, the desktop set
  <clip>-sm.mp4     768 wide, a phone's set (tv.js picks by the set's size)
  <clip>.webp       the first frame: the <video> poster
  <clip>-card.webp  a key frame, 480 wide: the TV guide's little set

The windows below fit the 2026-10-15 takes. A re-shoot moves every moment,
so read a contact sheet of the new take first, and start a clip at least
2.1 s after a channel change — the app's own CH readout is on screen until
then (a race shot as the first channel on has none).

The floor, the set's first channel, isn't the home TV: it's the friends'
conga from the App Store preview's raw takes (~/Movies/cfl-promo/raw, the
game repo's /promo-video skill), shot on the iPhone Duo, with its own crop —
the floor between the HUD and the tab bar, at the glass's shape.
"""
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'tv')
CROP = 'crop=1752:1118:156:780'

# clip -> (take, [(start, end), ...], card time within the clip[, crop])
# A take is a name in the takes dir, or a path of its own.
CLIPS = {
    # The floor before the shows: West Hall, the bar, the pit.
    'floor': ('~/Movies/cfl-promo/raw/duo_conga', [(21.9, 25.6), (29.0, 33.0), (37.6, 41.6)], 5.9,
              'crop=2162:1380:345:295'),
    'banquet': ('banquet', [(5.9, 14.1)], 2.4),            # the joust: Glancing Blow, Sir Tex Advances
    'fight': ('boxing', [(36.0, 43.95)], 4.3),             # KNOCKDOWN!, then the count
    'drag': ('drag', [(5.9, 14.15)], 5.0),                 # the tree, the launch, HOLESHOT!
    'rally': ('rally2', [(5.9, 14.1)], 5.6),               # INTO THE DITCH!
    'moto': ('moto2', [(5.9, 14.1)], 4.8),                 # LANDED ON THE CAMERA TOWER!
    'tri': ('tri2', [(5.9, 14.1)], 5.3),                   # INTO THE HAY!
    # EYE IN THE SKY, two cameras a visit as the app shows them
    # (CFL_DEBUG_HOME_CAM=all cuts every 3.5 s, each cut a white flash).
    'cam-doors': ('cams', [(49.63, 53.13), (7.47, 10.97)], 1.6),       # CAM 01 THE DOORS, CAM 02 THE PIT
    'cam-blackjack': ('cams', [(42.60, 46.10), (10.97, 14.50)], 2.2),  # CAM 12 BLACKJACK TABLE, CAM 03 ROULETTE
    'cam-bar': ('cams', [(46.10, 49.63), (32.07, 35.57)], 2.0),        # CAM 13 BAR TOP, CAM 09 POKER ROOM
}


def run(args):
    subprocess.run(args, check=True)


def encode(takes, name):
    take, pieces, card, *crop = CLIPS[name]
    crop = crop[0] if crop else CROP
    src = os.path.join(takes, os.path.expanduser(take) + '.mp4')
    parts = [f'[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS,{crop}[p{i}]'
             for i, (a, b) in enumerate(pieces)]
    if len(pieces) > 1:
        joined = ''.join(f'[p{i}]' for i in range(len(pieces)))
        parts.append(f'{joined}concat=n={len(pieces)}:v=1:a=0[cat]')
        tail = '[cat]'
    else:
        tail = '[p0]'
    graph = ';'.join(parts) + f';{tail}fps=30,split=2[a][b];' \
        '[a]scale=1280:-2:flags=lanczos[big];[b]scale=768:-2:flags=lanczos[small]'
    x264 = ['-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-profile:v', 'high',
            '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart']
    run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-filter_complex', graph,
         '-map', '[big]', *x264, '-crf', '27', f'{OUT}/{name}.mp4',
         '-map', '[small]', *x264, '-crf', '28', f'{OUT}/{name}-sm.mp4'])
    run(['ffmpeg', '-v', 'error', '-y', '-i', f'{OUT}/{name}.mp4', '-frames:v', '1',
         '-c:v', 'libwebp', '-quality', '72', f'{OUT}/{name}.webp'])
    run(['ffmpeg', '-v', 'error', '-y', '-ss', str(card), '-i', f'{OUT}/{name}.mp4', '-frames:v', '1',
         '-vf', 'scale=480:-2:flags=lanczos', '-c:v', 'libwebp', '-quality', '76', f'{OUT}/{name}-card.webp'])
    sizes = [os.path.getsize(f'{OUT}/{name}{s}') // 1024 for s in ('.mp4', '-sm.mp4', '.webp', '-card.webp')]
    print(f'{name}: {sizes} KB')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    os.makedirs(OUT, exist_ok=True)
    for clip in sys.argv[2:] or CLIPS:
        encode(sys.argv[1], clip)
