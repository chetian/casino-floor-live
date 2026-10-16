# Casino Floor Live! — website

Marketing site and required legal pages for the iOS game **Casino Floor Live!**, a co-op casino party game (virtual chips only, up to 10 players).

Served via GitHub Pages as a plain static site.

## Pages
- `index.html` — landing page
- `games.html` — every game with its real rules and paytable
- `play-with-friends.html` — the multiplayer landing page
- `vision-pro.html` — the Apple Vision Pro landing page
- `privacy.html` — Privacy Policy (App Store privacy URL)
- `support.html` — Support / FAQ (App Store support URL)
- `terms.html` — Terms of Use / EULA
- `age-rating.html` — Age Suitability disclosure (App Store age suitability URL)
- `styles.css` — shared styles: the app's design system (DesignTokens palette,
  Avenir Next, the home screen's chunky cards and TV set)
- `floor.js` — the live casino floor behind the hero
- `tv.js` — the hero's television, surfing the house's channels
- `cast.js` — the cast wall's spotlight, and the hero card's huddle
- `favicon.svg` — the VIP crown mark
- `apple-touch-icon.png`, `app-icon.jpg` — the app icon (crown on felt), copied
  from the game's `AppIcon.appiconset` (`icon-180.png`; `icon-1024.png` →
  `sips -Z 640 -s format jpeg`)
- `sprites/` — art baked out of the game (see below)
- `tv/` — the hero set's channels, filmed from the app (see below)
- `clips/` — the phone frames' video: the App Store preview and a table loop
- `tools/` — the scripts that rebuild the cast wall and the TV clips

Add a page and it needs three things or it may as well not exist: an entry in
`sitemap.xml`, a link in the footer of every other page, and the same head
block (title / description / canonical / robots / OG / Twitter / breadcrumb
JSON-LD) the others carry.

## The hero: the home screen on the live floor

The hero is the app's home screen — the crown, the name under it, the
television, and the ways in (the gold GET IT FREE card with a huddle of the
cast, then the felt-green mode cards) — standing on the live floor.

**The floor** is a `<canvas>` running the game's own floor: felt carpet, real
tables, real cabinets, and the released cast walking between them — a
different fourteen every visit, and every so often somebody walks off the
edge and somebody new walks on. `floor.js` draws the furniture from the same
shapes, viewBox coordinates and palette as `FloorKitArt` in the app; the
characters are baked art, not redrawn.

**The television** is the home screen's set (`TVSetNode`): a satin-black slab
with a brass hairline, the picture's light round it in the show's colour, a
CRT line when it comes on, and on every channel change a burst of snow and
the channel number in old-set green (`ChannelFlipNode`). `tv.js` surfs the
app's own lineup — the house show on CH 02, THE BIG RACE on CH 03, EYE IN THE
SKY on CH 07 — with the app's words for each. It is silent, like the app's
home set. Phones get the 768-wide clips; posters only under reduced motion or
Save-Data.

The TV guide's little sets (`#tv`) play their clip on hover, focus or tap.

### Re-baking the art

Everything in `sprites/` comes out of the game repo (`~/dev/CasinoBros`) —
never hand-edit it. Only RELEASED characters: the export skips a held drop
(`ReleaseWave.held`), so re-run all three steps when a drop opens.

```sh
cd ~/dev/CasinoBros/CasinoCore

# 1. The cast wall: portraits, eight-facing turnarounds, the legendaries'
#    own loops and followers, and cast.json. Then convert and write the wall.
CFL_DUMP_WEB_CAST=/tmp/cast swift test --filter WebSpriteDumpTests/testDumpWebCast
python3 ~/dev/casino-floor-live/tools/cast_wall.py /tmp/cast

# 2. The floor atlas (the same released cast, four facings at 96 px) and the
#    crown strip the header and the hero flip through.
IDS=$(python3 -c "import json;print(','.join(e['id'] for e in json.load(open('/tmp/cast/cast.json'))))")
CFL_DUMP_WEB=/tmp/web CFL_DUMP_IDS=$IDS CFL_DUMP_ATLAS_CELL=96 CFL_DUMP_CELL=256 \
  CFL_DUMP_EMBLEMS=crown swift test --filter WebSpriteDumpTests/testDumpWebSprites
cwebp -lossless -z 9 /tmp/web/bros-atlas.png -o ~/dev/casino-floor-live/sprites/bros-atlas.webp
cp /tmp/web/bros-atlas.json /tmp/web/emblem-crown.png ~/dev/casino-floor-live/sprites/

# 3. Badge emblems used as the site's icons, phase 0 only.
CFL_DUMP_WEB=/tmp/emb CFL_DUMP_IDS=ace CFL_DUMP_CELL=128 CFL_DUMP_EMBLEM_PHASE=0 \
  CFL_DUMP_EMBLEMS=aceCard,spadeSuit,diamondSuit,dicePair,joker,rouletteWheel,slotMachine,jackpotBurst,chipBurst,vaultDoor,racehorse,ensemble,floorMap,padlock,megaphone,crossedSwords,maracas,autograph,luckyCat,compass,moonTV,prizeWheel,rosette,betSlip,checkeredFlag,chipCoin,cocktail \
  swift test --filter WebSpriteDumpTests/testDumpWebSprites
for f in /tmp/emb/emblem-*-p0.png; do n=${f##*/emblem-}; n=${n%-p0.png}
  cwebp -quiet -q 90 -alpha_q 100 -m 6 $f -o ~/dev/casino-floor-live/sprites/emblems/$n.webp; done
```

`cast_wall.py` writes the wall's markup into `index.html` between the
`CAST:BEGIN` / `CAST:END` markers, including the tab counts, every
character's door ("On the Prize Wheel, or $70,000 in chips at the Gift
Shop") and their tagline from the gift-shop catalog. The words around the
facts live in the script; the facts come from the app.

### Re-shooting the TV

The clips are the app's home-screen TV, filmed on an iPad 13" simulator
against a local relay parked at the moment you want (the house-event skills
have each show's moments), then cropped to the glass:

```sh
# Build the Debug app for the simulator and install it on the iPad sim, then
# launch once with SIMCTL_CHILD_CFL_DEBUG_DAILY_PRESS=claimdone so the daily
# reward's sheet doesn't cover the set.
tools/tv-take.sh banquet 50 banquet,banquet rally 225       # the joust and the swords
tools/tv-take.sh boxing 50 boxing,boxing moto 95            # Fight Night's quarterfinals
tools/tv-take.sh drag 50 drag,drag tri 88                   # Burnout Boulevard's round one
RELAY_HOUSE_OFF=banquet,boxing,drag tools/tv-take.sh rally2 22 banquet,banquet rally 389
RELAY_HOUSE_OFF=banquet,boxing,drag tools/tv-take.sh moto2 22 boxing,boxing moto 526
RELAY_HOUSE_OFF=banquet,boxing,drag tools/tv-take.sh tri2 22 drag,drag tri 1194
tools/tv-take.sh cams 52 banquet,banquet rally 225 CFL_DEBUG_HOME_CAM=all
python3 tools/tv-encode.py ~/Movies/cfl-site-tv
```

The windows in `tv-encode.py` fit the 2026-10-15 takes; read a contact sheet
of any new take before cutting it. No real-world teams or games ever go on
this set — v1.1 ships with real games off, and the clips are house shows and
the floor's own cameras only.

### The phones

`clips/trailer.mp4` is the approved iPhone App Store preview (v3) at half
size, music kept behind the SOUND ON button. `clips/blackjack.mp4` and the
stills are cut from that preview's raw takes (`~/Movies/cfl-promo/raw`, see the
game repo's `/promo-video` skill), the Dynamic Island painted out with the
preview's own `delogo` so the CSS frame's island sits on it.

## Parked until it ships

Announced content only:

- **Held drops** — Yuletide is drawn and in the app binary but held
  (`ReleaseWave.held`). The cast export leaves it out by itself; when it opens,
  re-bake (above) and the wall and the floor pick it up.
- **The badge case** — the badges themselves aren't shown; a few emblems serve
  as the site's icons.
- **Real games** — the sports broadcasts are parked in the app (`RealGames.enabled`
  is false). Nothing on the site shows or names a real team or league.

## SEO

The head of every page is load-bearing — read this before editing one.

### Why the SERP shows the domain, not the name

Google picks the site name shown above a result from `WebSite` structured data
first, then `og:site_name`, the home page `<title>`, and "references to it that
appear on the web". When it isn't confident it falls back to the bare domain,
which is what `casinofloorlive.app` was doing. The on-page half of the fix is
in `index.html`: a brand-first `<title>` with no tagline padding, and
`alternateName: ["Casino Floor Live", "CFL"]` on both the `WebSite` and
`VideoGame` nodes so the trailing `!` can't cause a mismatch.

The off-page half matters more and is not a code change. "Casino Floor Live"
collides with **CasinoFloor.com** (a Malta real-money casino, which has a
Wikipedia article) and with **Live! Casino** (the Cordish US chain). The head
term is not winnable; the landing pages target the queries that are — Apple
Vision Pro, playing with friends, and per-game long tail.

### Search Console — verify by DNS, not by script

The privacy page promises no analytics and no trackers, and that stays true:
verify with a **DNS TXT record**, which adds nothing to any page.

1. Open <https://search.google.com/search-console>, choose **Domain** (not
   URL-prefix) and enter `casinofloorlive.app`.
2. Copy the `google-site-verification=…` string it gives you.
3. At the registrar (Namecheap — the domain's SPF record is already there), add
   a TXT record: host `@`, value `google-site-verification=…`, TTL automatic.
   Leave the existing SPF TXT record alone; a domain can hold several.
4. Wait for propagation, then confirm: `dig +short TXT casinofloorlive.app`
   should list both records.
5. Back in Search Console, hit **Verify**.
6. Submit `https://casinofloorlive.app/sitemap.xml` under **Sitemaps**, and
   request indexing for the three new pages under **URL Inspection**.
7. Check **Settings → Site names** to see which name Google actually picked.
   It is not instant — expect weeks, not days.

Worth doing the same at <https://www.bing.com/webmasters>; Bing's index feeds
ChatGPT and Copilot search.

### Still open

- **`sameAs` on the `Organization` node** is missing because there are no
  profiles to point at. Google's site-name system explicitly weighs outside
  references, so social profiles / a Product Hunt listing are the highest-value
  thing left.
- **RTP figures are deliberately not published.** `games.html` gives rules and
  paytables only. The measured return-to-player numbers exist in the game's
  tests; putting them on the site is a business decision, not a copy one.

## Live URLs (custom domain, see `CNAME`)
- Home: https://casinofloorlive.app/
- Games: https://casinofloorlive.app/games.html
- Multiplayer: https://casinofloorlive.app/play-with-friends.html
- Vision Pro: https://casinofloorlive.app/vision-pro.html
- Privacy: https://casinofloorlive.app/privacy.html
- Support: https://casinofloorlive.app/support.html
- Terms: https://casinofloorlive.app/terms.html
- Age Suitability: https://casinofloorlive.app/age-rating.html

## Notes for App Store Connect
- **Privacy Policy URL** → the privacy.html link above.
- **Support URL** → the support.html link above (or home).
- Developer: Chetian Holdings LLC (chetianholdings.com) · Contact: contact@chetianholdings.com
- **Age Suitability URL** (optional field) → the age-rating.html link above.
- Content: simulated gambling with virtual currency (rated 18+).

© 2026 Chetian Holdings LLC.
