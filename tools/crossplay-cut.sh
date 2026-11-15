#!/bin/zsh
# crossplay-cut.sh — cut the home page's crossplay graphic: crossplay/
# {iphone,android,ipad,vision}.mp4, each with its first frame (.webp) and its
# payoff (-payoff.webp, the still that stands for reduced motion and Save-Data).
#
#   tools/crossplay-cut.sh            # → crossplay/
#   OUT=/some/dir tools/crossplay-cut.sh
#
# The source is take xpa5 (the game repo's scripts/promo-video/xplay-android.sh,
# 2026-11-15, re-shot for Android 1.5.1's table, which now sits right under the
# header): ONE blackjack table filmed live at once on an iPhone (Maya), an
# Android phone (Sam), an iPad (Jules) and Apple Vision Pro (Alex), with Vinny,
# a house regular. The loop is one round, sweep to sweep: the deal, Maya hits
# her 8 8 to 21, Jules hits 3 K to 20, Alex hits 14 and busts, Sam stands on
# 20, the dealer turns 2 10 and busts on the jack, and Maya, Jules and Sam are
# paid.
#
# Each screen has its own clock (the emulator's screenrecord starts late, and
# every device acts the table out on its own timeline), so each has its own
# FROM, lined up by the sweep and the first card. Every screen is resampled to
# 30 fps from a second early, then trimmed, so all four share frame 0 and the
# page can start them together.
#
# The next deal doesn't wait for the sweep (the house deals as soon as the bets
# are down, and this round's sweep is still in the air when the first card of
# the next one leaves the shoe), so no frame at the round's end matches its
# first. The last FADE frames dissolve into the FADE frames just before the
# first one: a sweep into a sweep, and the loop runs straight on.
set -e
RAW=${PROMO:-$HOME/Movies/cfl-promo}/raw
OUT=${OUT:-${0:A:h:h}/crossplay}
TAKE=xpa5
SECS=15.3         # one round: 57.25 → 72.55 on the iPhone's clock
PAYOFF=14.0       # DEALER BUSTS $50 on every phone, counted up and held
FADE=9            # frames (0.3 s) of the round's end dissolved into its start

cut() {   # device, its clock at the loop's first frame, the picture
  local from=$(( $2 - 1 )) n=$(printf %.0f $(( SECS * 30 )))
  ffmpeg -v error -y -ss $from -t $((SECS + 2)) -i $RAW/${TAKE}_$1.mp4 -filter_complex \
    "[0:v]fps=30,$3,setsar=1,format=yuv420p,split[a][b];
     [a]trim=start_frame=30:end_frame=$((30 + n)),setpts=PTS-STARTPTS[round];
     [b]trim=start_frame=$((30 - FADE)):end_frame=30,setpts=PTS-STARTPTS[before];
     [round][before]xfade=transition=fade:duration=$(printf %.4f $((FADE / 30.0))):offset=$(printf %.4f $(((n - FADE) / 30.0))),format=yuv420p[v]" \
    -map '[v]' -an -c:v libx264 -preset slow -crf ${CRF:-22} -tune animation -profile:v high \
    -movflags +faststart $OUT/$1.mp4
  ffmpeg -v error -y -i $OUT/$1.mp4 -frames:v 1 -c:v libwebp -quality 80 $OUT/$1.webp
  ffmpeg -v error -y -ss $PAYOFF -i $OUT/$1.mp4 -frames:v 1 -c:v libwebp -quality 80 $OUT/$1-payoff.webp
  printf '%-12s %4s KB  poster %3s KB  payoff %3s KB\n' $1.mp4 \
    $(( $(stat -f %z $OUT/$1.mp4) / 1024 )) $(( $(stat -f %z $OUT/$1.webp) / 1024 )) $(( $(stat -f %z $OUT/$1-payoff.webp) / 1024 ))
}

# Sizes are the hero's at 2x: the three stand at one height.
H=${H:-960}
# Each start is a quarter second after that screen's sweep of the round before
# (the frame-difference peak: iPhone 57.00, iPad 56.97, Android 57.10, headset
# 57.20), so the loop's seam falls as the next deal's first card leaves the shoe.
# The iPad's is a frame later still: its payoff card fades a beat slower, and a
# ghost of it would sit on the poster.
cut iphone  57.25 "scale=-2:${H}:flags=lanczos"
cut android 57.35 "scale=-2:${H}:flags=lanczos"
cut ipad    57.26 "scale=-2:${H}:flags=lanczos"
cut vision  57.45 "crop=2480:1395:800:560,scale=1280:720:flags=lanczos"
