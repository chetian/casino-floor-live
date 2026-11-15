#!/bin/zsh
# crossplay-cut.sh — cut the home page's crossplay graphic: crossplay/
# {iphone,android,ipad,vision}.mp4, each with its first frame (.webp) and its
# payoff (-payoff.webp, the still that stands for reduced motion and Save-Data).
#
#   tools/crossplay-cut.sh            # → crossplay/
#   OUT=/some/dir tools/crossplay-cut.sh
#
# The source is take xpa1 (the game repo's scripts/promo-video/xplay-android.sh,
# 2026-11-14): ONE blackjack table filmed live at once on an iPhone (Maya), an
# Android phone (Sam), an iPad (Jules) and Apple Vision Pro (Alex). The loop is
# one round, from the cleared table to the cleared table: the deal, Sam hits his
# 8 to 18, the dealer turns 9 4 and busts on the queen, and everyone is paid.
#
# Each screen has its own clock (the emulator's screenrecord starts late, and
# every device acts the table out on its own timeline), so each has its own
# FROM, lined up by the sweep and the first card. Every screen is resampled to
# 30 fps from a second early, then trimmed, so all four share frame 0 and the
# page can start them together.
set -e
RAW=${PROMO:-$HOME/Movies/cfl-promo}/raw
OUT=${OUT:-${0:A:h:h}/crossplay}
TAKE=xpa1
SECS=8.3          # one round: 12.4 → 20.7 on the iPhone's clock
PAYOFF=7.0        # DEALER BUSTS on every screen

cut() {   # device, its clock at the loop's first frame, the picture
  local from=$(( $2 - 1 ))
  ffmpeg -v error -y -ss $from -t $((SECS + 2)) -i $RAW/${TAKE}_$1.mp4 \
    -vf "fps=30,trim=start=1:duration=$SECS,setpts=PTS-STARTPTS,$3,setsar=1,format=yuv420p" \
    -an -c:v libx264 -preset slow -crf ${CRF:-22} -tune animation -profile:v high \
    -movflags +faststart $OUT/$1.mp4
  ffmpeg -v error -y -i $OUT/$1.mp4 -frames:v 1 -c:v libwebp -quality 80 $OUT/$1.webp
  ffmpeg -v error -y -ss $PAYOFF -i $OUT/$1.mp4 -frames:v 1 -c:v libwebp -quality 80 $OUT/$1-payoff.webp
  printf '%-12s %4s KB  poster %3s KB  payoff %3s KB\n' $1.mp4 \
    $(( $(stat -f %z $OUT/$1.mp4) / 1024 )) $(( $(stat -f %z $OUT/$1.webp) / 1024 )) $(( $(stat -f %z $OUT/$1-payoff.webp) / 1024 ))
}

# Sizes are the hero's at 2x: the three stand at one height.
H=${H:-960}
cut iphone  12.40 "scale=-2:${H}:flags=lanczos"
cut android 12.60 "scale=-2:${H}:flags=lanczos"
cut ipad    12.35 "scale=-2:${H}:flags=lanczos"
cut vision  12.55 "crop=2480:1395:800:560,scale=1280:720:flags=lanczos"
