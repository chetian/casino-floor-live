#!/bin/zsh
# og-card.sh — render the share card (tools/og-card.html) into the site root.
#
#   tools/og-card.sh            # og-image.jpg (1200×630) + og-image-square.jpg (1200×1200)
#   SHOW=ditch tools/og-card.sh # THE JACKPOT RUN on the set instead of Fight Night
#   SEED=4 tools/og-card.sh     # a different crowd walking the floor behind
#
# Serves the site on a spare local port (floor.js fetches its atlas, which a
# file:// page can't), shoots the page in headless Chrome at 2x, and scales it
# down so every edge is crisp. Change the copy, the crowd or the picture in
# og-card.html, then re-run; bump the ?v= on og:image if the URL must refresh.
set -e
ROOT=${0:A:h:h}
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP=$(mktemp -d)
PORT=8771
q="seed=${SEED:-11}${SHOW:+&show=$SHOW}"

(cd $ROOT && python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1) &
server=$!
trap 'kill $server 2>/dev/null; rm -rf $TMP' EXIT
sleep 1

shoot() {  # shoot <query> <height> <out>
  rm -f $TMP/shot.png
  # A fresh profile can stall on a Keychain prompt: mock it, skip first run,
  # and never wait on Chrome for more than a minute.
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --no-first-run --no-default-browser-check --use-mock-keychain --password-store=basic \
    --window-size=1200,${2} --virtual-time-budget=7000 --user-data-dir=$TMP/profile \
    --screenshot=$TMP/shot.png "http://127.0.0.1:$PORT/tools/og-card.html?$1" >/dev/null 2>&1 &
  local chrome=$! i
  for i in {1..60}; do [[ -s $TMP/shot.png ]] && break; sleep 1; done
  sleep 1; kill $chrome 2>/dev/null || true
  [[ -s $TMP/shot.png ]] || { echo "headless Chrome produced no screenshot" >&2; exit 1; }
  ffmpeg -v error -y -i $TMP/shot.png -vf "scale=1200:${2}:flags=lanczos" -q:v 3 $ROOT/$3
  echo "$3: $(sips -g pixelWidth -g pixelHeight $ROOT/$3 | awk '/pixel/{printf "%s ", $2}')$(( $(stat -f %z $ROOT/$3) / 1024 )) KB"
}

shoot "$q" 630 og-image.jpg
shoot "$q&format=square" 1200 og-image-square.jpg
