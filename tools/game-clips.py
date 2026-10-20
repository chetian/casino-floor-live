#!/usr/bin/env python3
"""Cut the game picker's clips (index.html #games) out of the promo takes.

    python3 tools/game-clips.py [takes dir] [game …]

The takes are the game repo's /promo-video benches (~/Movies/cfl-promo/raw by
default): an iPhone 17 Pro Max simulator, each game booted full screen and
playing itself, rigged where the bench can rig it so the payoff lands. Each
game is one or more windows of its take, the Dynamic Island painted out (the
preview's own delogo, so the CSS frame's island sits on it), resampled to
30 fps, and written to games/ as:
  <game>.mp4        520 wide, the spotlight's phone
  <game>.webp       the payoff, full frame: the poster, and the still under
                    reduced motion or Save-Data
  <game>-card.webp  a square of the game at its best moment, 320 px: the
                    wall's card

The windows below fit the takes of 2026-10-01 (bj, uth, craps, slots, plinko)
and 2026-10-19 (web_*). A re-shoot moves every moment, so read a contact
sheet of the new take first.
"""
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'games')
TAKES = os.path.expanduser('~/Movies/cfl-promo/raw')
ISLAND = 'delogo=x=466:y=34:w=388:h=126'   # the 1320x2868 recording's island
SIDE = 1320                                 # the card: a full-width square of the take

# game -> (take, [(start, end), ...], poster time, card time, card top) —
# times in the take, the card a SIDE-square from `card top` down.
GAMES = {
    'blackjack': ('bj', [(11.4, 19.6)], 18.4, 18.4, 160),               # A K BLACKJACK, dealer busts, WIN $125
    'holdem': ('web_poker', [(6.2, 8.6), (17.8, 19.2), (21.7, 29.6)], 28.8, 28.8, 560),  # deal, flop, all in: TWO PAIR $1,215
    'ultimate': ('uth', [(28.4, 36.5)], 35.6, 35.6, 200),               # royal flush, WIN $13,481
    'craps': ('craps', [(10.6, 17.1)], 16.0, 16.0, 120),                # the point is 8: EIGHT, WINNER, WIN $115
    'roulette': ('web_roulette', [(47.2, 58.6)], 57.0, 57.0, 600),      # $25 on red: 19 RED, WIN $50
    'dice': ('web_dice', [(11.0, 17.3)], 15.8, 15.8, 240),              # 5, UNDER 7, WIN $50
    'horses': ('web_horse', [(3.6, 14.6)], 13.8, 13.8, 160),            # and they're off, PHOTO FINISH, OFFICIAL
    'slots': ('slots', [(29.4, 37.6)], 36.6, 36.6, 80),                 # King's Ransom: WIN $45, then 5 OF A KIND $165
    'video-poker': ('web_vp', [(14.5, 15.4), (16.9, 24.4)], 22.0, 22.0, 200),  # deal, hold two (the wait cut), 2x JACKS OR BETTER
    'plinko': ('plinko', [(9.2, 16.3)], 15.3, 12.4, 200),                # ten balls, WIN $104
    'mines': ('web_mines', [(14.4, 25.0)], 23.0, 23.0, 350),            # four gems to $160, then BOOM (the bench never banks)
}


def run(args):
    subprocess.run(args, check=True)


def encode(takes, name):
    take, pieces, poster, card, top = GAMES[name]
    src = os.path.join(takes, f'{take}.mp4')
    parts = [f'[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS,{ISLAND}[p{i}]'
             for i, (a, b) in enumerate(pieces)]
    if len(pieces) > 1:
        joined = ''.join(f'[p{i}]' for i in range(len(pieces)))
        parts.append(f'{joined}concat=n={len(pieces)}:v=1:a=0[cat]')
        tail = '[cat]'
    else:
        tail = '[p0]'
    graph = ';'.join(parts) + f';{tail}fps=30,scale=520:-2:flags=lanczos[v]'
    run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-filter_complex', graph, '-map', '[v]',
         '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-profile:v', 'high',
         '-crf', '27', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', f'{OUT}/{name}.mp4'])
    run(['ffmpeg', '-v', 'error', '-y', '-ss', str(poster), '-i', src, '-frames:v', '1',
         '-vf', f'{ISLAND},scale=520:-2:flags=lanczos', '-c:v', 'libwebp', '-quality', '78',
         f'{OUT}/{name}.webp'])
    run(['ffmpeg', '-v', 'error', '-y', '-ss', str(card), '-i', src, '-frames:v', '1',
         '-vf', f'crop={SIDE}:{SIDE}:0:{top},scale=320:320:flags=lanczos', '-c:v', 'libwebp',
         '-quality', '78', f'{OUT}/{name}-card.webp'])
    sizes = [os.path.getsize(f'{OUT}/{name}{s}') // 1024 for s in ('.mp4', '.webp', '-card.webp')]
    print(f'{name}: {sizes} KB')


if __name__ == '__main__':
    args = sys.argv[1:]
    takes = TAKES
    if args and os.path.isdir(os.path.expanduser(args[0])):
        takes = os.path.expanduser(args.pop(0))
    os.makedirs(OUT, exist_ok=True)
    for game in args or GAMES:
        encode(takes, game)
