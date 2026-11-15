#!/bin/zsh
# tiles-cut.sh — the home page hero's lit squares: crossplay/tiles.mp4, ONE
# small video holding 24 little screens, each a corner of the floor.
#
#   tools/tiles-cut.sh
#
# The hero stands on a grid (crossplay.js), and a few of its squares at a time
# come on as screens: the tables, the 1.5 machines, Lefty's cups, the house's
# shows. One video plays, drawn into whichever squares are lit, so a phone
# decodes a single 672 × 448 picture however many are lit. chetianholdings.com
# does the same with its own cut (relay/deploy/chetian-tiles.sh in the game
# repo); these are this site's TV clips (tv/), six seconds of each from a
# second in, a square where the most moves.
#
# Cells are 112 px (16-aligned, so no macroblock straddles two screens); the
# page draws each cell's middle 110, a 55 px square at 2x. crossplay.js reads
# the layout as 6 × 4 of 112: keep it in step.
set -e
ROOT=${0:A:h:h}
TV=$ROOT/tv
OUT=$ROOT/crossplay/tiles.mp4
FROM=1
SECS=6

# clip           x    y    size (a square of the clip's 1280 × 816 frame)
CELLS=(
  cam-slots      432 128 384   fight          592  16 384   cam-baccarat   480  32 320
  cam-plinko     464  96 384   cam-pushers    416  80 320   banquet        256  16 384
  cam-blackjack  688 272 320   cam-mines      472 140 352   drag           656   0 384
  floor          288 112 256   cam-videopoker 480 170 352   moto           480 192 384
  cam-shellgame  512 176 320   cam-bar        592 288 320   tri            528 128 384
  cam-baccarat   496 368 320   rally          336  64 384   cam-shellgame  784  32 320
  cam-doors      528 240 320   cam-pushers    256 272 320   cam-slots      288 200 384
  cam-blackjack  432 256 320   fight          288  80 384   cam-plinko     300 440 320
)

args=()
graph=''
layout=()
for ((i = 0; i < 24; i++)); do
  c=${CELLS[i * 4 + 1]} x=${CELLS[i * 4 + 2]} y=${CELLS[i * 4 + 3]} s=${CELLS[i * 4 + 4]}
  args+=(-ss $FROM -t $SECS -i $TV/$c.mp4)
  graph+="[$i:v]fps=30,crop=$s:$s:$x:$y,scale=112:112:flags=lanczos,setsar=1[c$i];"
  layout+=("$(( i % 6 * 112 ))_$(( i / 6 * 112 ))")
done
inputs=$(printf '[c%d]' {0..23})
ffmpeg -v error -y $args -filter_complex "${graph}${inputs}xstack=inputs=24:layout=${(j:|:)layout},format=yuv420p" \
  -t $SECS -an -c:v libx264 -preset slow -crf ${CRF:-28} -tune animation -profile:v high \
  -movflags +faststart $OUT
printf '%s  %s KB\n' tiles.mp4 $(( $(stat -f %z $OUT) / 1024 ))
