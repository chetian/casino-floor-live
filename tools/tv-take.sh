#!/bin/zsh
# tv-take.sh — film the app's home-screen TV for the hero set.
#
#   tools/tv-take.sh <take> <secs> <air queue> <race queue> <offset> [VAR=VAL …]
#   tools/tv-take.sh banquet 50 banquet,banquet rally 225
#   RELAY_HOUSE_OFF=banquet,boxing,drag tools/tv-take.sh rally 22 banquet,banquet rally 389
#   tools/tv-take.sh cams 52 banquet,banquet rally 225 CFL_DEBUG_HOME_CAM=all
#
# Starts a private local relay (port 18183) whose air show is <offset> s in
# (race 0 is <offset> − 300 s in: race slot 0 starts five minutes after air
# slot 0), launches the app's home screen against it and records the screen.
# The home TV then surfs exactly as it does for a player: the house show,
# the race, and EYE IN THE SKY. RELAY_HOUSE_OFF takes the tournaments off air
# so a race is the first channel on (no channel readout baked into the take).
# Show moments are in the CasinoBros skills /house-event-tournament and
# /house-event-race; each race's moment times are in the relay state's
# house/<kind>-0.json (hit = beat time − start).
#
# Needs: the Debug app installed on $CFL_SIM (an iPad 13" gives an 880-pt set),
# and today's daily reward claimed once (CFL_DEBUG_DAILY_PRESS=claimdone), or its
# sheet covers the set. Writes $CFL_TAKES/<take>.mp4 (default ~/Movies/cfl-site-tv).
set -e
REPO=${CFL_REPO:-$HOME/dev/CasinoBros}
SIM=${CFL_SIM:-"iPad Pro 13-inch (M5)"}
TAKES=${CFL_TAKES:-$HOME/Movies/cfl-site-tv}
BUNDLE=chetian.casinofloorlive
PORT=18183
[[ $# -ge 5 ]] || { sed -n '2,24p' $0; exit 1; }
name=$1; secs=$2; air=$3; race=$4; off=$5; shift 5
mkdir -p $TAKES/relay-state
U=$(xcrun simctl list devices available | grep -F "$SIM (" | head -1 | sed -E 's/.*\(([0-9A-F-]{36})\).*/\1/')
[[ -n $U ]] || { echo "no simulator named '$SIM'" >&2; exit 1; }
xcrun simctl list devices booted | grep -q $U || { xcrun simctl boot $U; sleep 6; }

(cd $REPO/relay && go build -o $TAKES/relay-house .)
pid=$(lsof -tiTCP:$PORT -sTCP:LISTEN 2>/dev/null || true)
[[ -n $pid ]] && { kill $pid; sleep 1; }
state=$TAKES/relay-state/$name-$(date +%s); mkdir -p $state
epoch=$(( $(date +%s) - off ))   # whole seconds: a float falls back to the real clock
RELAY_ADDR=127.0.0.1:$PORT RELAY_STATE_DIR=$state \
  RELAY_HOUSE_QUEUE=$air RELAY_RACE_QUEUE=$race \
  RELAY_HOUSE_KEY=00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff \
  RELAY_HOUSE_EPOCH=$epoch RELAY_ODDS_URL=http://127.0.0.1:9/ RELAY_PLAYS_URL=http://127.0.0.1:9/ \
  nohup $TAKES/relay-house > $TAKES/relay-$name.log 2>&1 &
sleep 1.5
curl -s localhost:$PORT/healthz; echo

envs=(CFL_DEBUG_HOUSE_URL=http://127.0.0.1:$PORT/odds/v1 CFL_DEBUG_ODDS_URL=http://127.0.0.1:$PORT/odds/v1
      CFL_DEBUG_SKIP_GC_GATE=1 CFL_DEBUG_ONBOARDING=off CFL_DEBUG_PLAYERS=37 CFL_DEBUG_BRO=ace "$@")
child=()
for kv in $envs; do child+=("SIMCTL_CHILD_$kv"); done

xcrun simctl terminate $U $BUNDLE 2>/dev/null || true
sleep 1
xcrun simctl io $U recordVideo --codec=h264 --mask=ignored --force $TAKES/$name.mp4 >/dev/null 2>&1 &
rec=$!
sleep 1.5
env $child xcrun simctl launch --terminate-running-process $U $BUNDLE >/dev/null
sleep $secs
kill -INT $rec 2>/dev/null || true; wait $rec 2>/dev/null || true
xcrun simctl terminate $U $BUNDLE 2>/dev/null || true
pid=$(lsof -tiTCP:$PORT -sTCP:LISTEN 2>/dev/null || true)
[[ -n $pid ]] && kill $pid
ffprobe -v error -show_entries stream=width,height:format=duration -of compact $TAKES/$name.mp4
