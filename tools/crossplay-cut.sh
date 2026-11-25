#!/bin/zsh
# crossplay-cut.sh — cut the home page's crossplay hero: crossplay/
# {iphone,ipad,android,vision}.mp4, each with its still (.webp: your first
# frame, or the moment a friend arrives) and its payoff (-payoff.webp, the
# still that stands for reduced motion, Save-Data and refused autoplay).
#
#   tools/crossplay-cut.sh            # → crossplay/
#   OUT=/some/dir tools/crossplay-cut.sh
#
# The source is take xpj1 (the game repo's scripts/promo-video/xplay-android.sh
# joins, 2026-11-15, on the 1.6 tree with the floor bonus lit): Maya sits down
# at a blackjack table ALONE on her iPhone, then her friends arrive one at a
# time, Jules on an iPad, Sam on an Android phone, Alex on Apple Vision Pro,
# and the floor bonus badge under every player's avatar climbs ×1.2, ×1.4,
# ×1.6 as each lands. Then they play: Maya hits 3 10 to 21, Jules stands on
# 20, Sam and Alex bust, the dealer stands on 17, and the bonus rises off
# Maya's badge (+$15) before 21 BEATS 17 lands.
#
# Three spans of the iPhone's clock, played as one (SPANS): Maya alone through
# Sam's arrival; then Alex's arrival and the round he sits down in (the 3 s
# between, the table waiting on Sam's first bet with nothing moving, is cut);
# then, from the same empty felt with every bet down, the round they win, held
# on the payoff. The first frame holds a second (HOLD) so Maya has the table
# to herself a moment before anyone comes. The page goes dark between two
# evenings, so the loop has no seam to hide.
#
# Each screen has its own clock (the emulator's screenrecord starts late), so
# each has its own OFF against the iPhone's, measured by the floor bonus badge
# climbing on every screen at once (iPad 0, Android +0.10 s) and, for the
# headset, which has no badge yet, by the round's sweep (+0.07 s). A friend's
# screen is black until they arrive (ON, on the cut's clock: the frame the
# badge climbs on Maya's screen), so it costs nothing before it's needed.
set -e
RAW=${PROMO:-$HOME/Movies/cfl-promo}/raw
OUT=${OUT:-${0:A:h:h}/crossplay}
TAKE=xpj1
HOLD=1.0
LEAD=8            # s each span seeks early (longer than any still screen inside a span)
SPANS=(8.4 17.6  20.6 29.05  114.25 123.6)
typeset -A OFF ON
OFF=(iphone 0 ipad 0 android 0.10 vision 0.07)
ON=(iphone 0 ipad 2.70 android 6.93 vision 10.47)
PAYOFF=26.6       # 21 BEATS 17 on Maya's screen, 20 BEATS 17 on Jules's, the busts
H=${H:-960}       # the phones and the tablet at the hero's 2x

cut() {   # device, the picture
  local dev=$1 pic=$2 off=${OFF[$1]} on=${ON[$1]} parts="" chain="" i=0 a b
  local -a inputs
  # Each span seeks LEAD early and counts frames from the seek point
  # (fps=…:start_time=0). The recorders write no frame while a screen is
  # still (the emulator's for seconds before Sam's launch), and fps counts
  # from the first frame it gets: without start_time, a span that seeks into
  # a still screen starts that much late in the take (Sam's ran 2.5 s ahead).
  local seek lead n
  for a b in $SPANS; do
    seek=$(( a + off - LEAD )); (( seek < 0 )) && seek=0
    lead=$(printf %.0f $(( (a + off - seek) * 30 )))
    n=$(printf %.0f $(( (b - a) * 30 )))
    inputs+=(-ss $seek -t $(( a + off - seek + b - a + 1 )) -i $RAW/${TAKE}_$dev.mp4)
    parts+="[${i}:v]fps=30:start_time=0,trim=start_frame=${lead}:end_frame=$((lead + n)),setpts=PTS-STARTPTS,$pic,setsar=1[s$i];"
    chain+="[s$i]"; i=$((i + 1))
  done
  # Black until they arrive: the frames before ON are dark (and nearly free).
  local dark=""; (( on > 0 )) && dark=",fade=t=in:st=${on}:d=0.034"
  ffmpeg -v error -y $inputs -filter_complex \
    "${parts}${chain}concat=n=$i:v=1:a=0,tpad=start_duration=${HOLD}:start_mode=clone${dark},format=yuv420p[v]" \
    -map '[v]' -an -c:v libx264 -preset slow -crf ${CRF:-23} -tune animation -profile:v high \
    -movflags +faststart $OUT/$dev.mp4
  # The still: your first frame; a friend's, just after they come on.
  ffmpeg -v error -y -ss $(( on > 0 ? on + 0.5 : 0 )) -i $OUT/$dev.mp4 -frames:v 1 -c:v libwebp -quality 80 $OUT/$dev.webp
  ffmpeg -v error -y -ss $PAYOFF -i $OUT/$dev.mp4 -frames:v 1 -c:v libwebp -quality 80 $OUT/$dev-payoff.webp
  printf '%-12s %4s KB  still %3s KB  payoff %3s KB\n' $dev.mp4 \
    $(( $(stat -f %z $OUT/$dev.mp4) / 1024 )) $(( $(stat -f %z $OUT/$dev.webp) / 1024 )) $(( $(stat -f %z $OUT/$dev-payoff.webp) / 1024 ))
}

cut iphone  "scale=-2:${H}:flags=lanczos"
cut ipad    "scale=-2:${H}:flags=lanczos"
cut android "scale=-2:${H}:flags=lanczos"
# The headset's view: the table in the lower half of the room, the dealer's
# board on the set behind him.
cut vision  "crop=1920:1080:960:1080,scale=1280:720:flags=lanczos"
