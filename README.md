# Casino Floor Live! — website

Marketing site and required legal pages for **Casino Floor Live!**, a co-op casino party game (virtual chips only, up to 10 players) on iPhone, iPad, Android and Apple Vision Pro.

Served via GitHub Pages as a plain static site.

## Pages
- `index.html` — landing page
- `games.html` — every game with its real rules and paytable
- `play-with-friends.html` — the multiplayer landing page
- `vision-pro.html` — the Apple Vision Pro landing page
- `privacy.html` — Privacy Policy (App Store privacy URL)
- `support.html` — Support / FAQ (App Store support URL). Its FAQPage JSON-LD must match the visible h3/p pairs word for word; edit both or neither.
- `terms.html` — Terms of Use / EULA
- `age-rating.html` — Age Suitability disclosure (App Store age suitability URL)
- `styles.css` — shared styles: the app's design system (DesignTokens palette,
  Avenir Next, the home screen's chunky cards and TV set)
- `crossplay.js` — the hero: one table on every screen, the grid behind it
- `floor.js` — the live casino floor behind the television
- `tv.js` — the home screen's television, under the hero: what's new, the floor, then the house's channels
- `games.js` — the game picker: the phone in the spotlight, the wall of games
- `cast.js` — the cast wall's spotlight, and the hero card's huddle
- `favicon.ico`, `favicon-{48,96,192,512}.png`, `site.webmanifest` — the app
  icon (crown on felt) at the sizes browsers and Google's results use
- `apple-touch-icon.png`, `app-icon.jpg` — the app icon, copied from the
  game's `AppIcon.appiconset` (`icon-180.png`; `icon-1024.png` →
  `sips -Z 640 -s format jpeg`)
- `og-image.jpg`, `og-image-square.jpg` — the share card (see below)
- `sprites/` — art baked out of the game (see below)
- `tv/` — the hero set's channels, filmed from the app (see below)
- `games/` — the game picker's clips, stills and cards, cut from the app (see below)
- `crossplay/` — one evening at one blackjack table on four screens (one player, then three friends), and the grid's scenes, for the hero (see below)
- `clips/` — the App Store preview, and stills for the other pages' phones
- `tools/` — the scripts that rebuild the cast wall, the TV and the game clips

Add a page and it needs three things or it may as well not exist: an entry in
`sitemap.xml`, a link in the footer of every other page, and the same head
block (title / description / canonical / robots / OG / Twitter / breadcrumb
JSON-LD) the others carry. A page with a "Get it free" also carries the
head script that sends Android to Google Play (below).

## The two stores

The app is on the App Store (iPhone, iPad, Apple Vision Pro) and Google
Play (Android, since v1.5). Where the site has room it offers both, as the
stores' own badges side by side (`.stores`, `.store`): Apple's "Download on
the App Store" (`badges/app-store.svg`, Apple's SVG as supplied) and Google's
"Get it on Google Play" (`badges/google-play.png`, Google's PNG with its
built-in clear-space margin cropped off). Both stores' rules: their art as
supplied, nothing drawn on or in it (Apple's logo appears nowhere else on the
site), clear space of a quarter of its height around it, never under 40 px
tall. They stand at one height (`--badge`: 54 px, 46 on phones, 42 on the
narrowest). A small script in each page's head names the visitor's phone
before the first paint, and Android puts Google Play first. The single "Get
it free" links (`a[data-get]`: the nav's, the home screen's GET IT FREE card)
point at the App Store and switch to Google Play on Android. The Vision Pro
page shows the App Store badge only. The structured data lists both stores
(`downloadUrl`, `installUrl`, `sameAs`, one `Offer` each), and
`site.webmanifest` names both apps in `related_applications`.

## The hero: one table, all your friends

The first screen is crossplay (`crossplay.js`): one evening at one blackjack
table, filmed live on an iPhone, an iPad, an Android phone and Apple Vision
Pro at once and played back in step. It starts with one player alone at the
table; her friends arrive one at a time, and with each one the floor bonus
(1.6's: every human on the floor past the first adds 20% to every win) climbs
on every screen; then they play a round together and two of them are paid,
bonus and all. The name, the line ("One table. All your friends."), the
tagline (the games, with friends on all four platforms) and the two stores
stand above the screens, and the headset stands under the table as the
addition, with a line to `/vision-pro`.

**The players.** Each screen wears its player's plate: their device, drawn
(`#xp-b-*` in the page: the iPhone with its island, the iPad, the Android
phone with its punch-hole, the headset's visor), with the platform's mark on
its glass (Apple's, from the App Store badge's own paths, or Android's robot
in its green) and their character's head (their cast sprite, cropped to the
head in CSS) on its foot corner. The plate stands centred over its screen
with its foot on the picture. No names: the heads and the devices tell them
apart. The take's players are Maya (`ballet-mira`) on the iPhone, Jules
(`skater-jinx`) the iPad, Sam (`rock-axel`) Android and Alex (`card-shark`)
the headset, the characters `scripts/promo-video/xplay-android.sh` (in
CasinoBros) seats them as; their names are only keys (`data-who`). Between
the screens and the headset stands **the table** they all sit at, drawn the
way the screens draw it: the dealer's band (the chip rack, the lit ONE LIVE
TABLE sign, BLACKJACK), the felt in its padded rail with BLACKJACK PAYS 3 TO
2 on an arc, the dealer, the four seats in the app's seat order (Maya, Jules,
Sam, Alex), each wearing the head and, in a row, the platform's and the
device's marks, and the FLOOR BONUS pill on the rail. Brass wires run from
the band to each screen, the headset's from the rail by Alex's seat to the
visor's side.

**The evening** runs on Maya's clock (her iPhone leads) and is read off the
take (the data block at the top of `crossplay.js`). Until a friend arrives,
their screen is an open seat: dark under a dashed gold outline and a "+",
their plate dimmed and its head gone, their seat on the table dashed; the
next to arrive breathes. A friend arrives on the frame the app's badge climbs
on Maya's screen (`JOINS`: Jules at 2.70 s, Sam 6.93, Alex 10.47): their wire
runs out from the table, their screen powers on the way the TV does (a white
line, then the picture), and the line under the table says so ("Your friend
on iPad joined. Every win pays ×1.2"); their seat fills when they sit down in
the app (`sits`; the headset's table stands up in Alex's room 3.5 s after he
joins). The pill pops in at ×1.2 and punches at ×1.4 and ×1.6, the way the
app's badge does, and a gold ring calls out that badge (under the avatar,
top left) on every screen that shows one; the headset's has none yet, and
`--bx`/`--by`/`--bw` in `styles.css` place the ring on each screen. Then the
round (`TURNS`, measured off Maya's console): the deal at 18.8, Maya at 20.1
(3 10, hits to 21), Jules 21.3 (stands on 20), Sam 21.8 and Alex 23.53 (both
bust), the dealer at 24.37. That's when the app throws the bonus (+$15 on a
$25 win at ×1.6) up off the winners' badges (`PAYS`), so the rings go round
Maya's and Jules's and "+$15" rises off the pill. The results land at 25.7
(`PAID`): +$25 for Maya and Jules, BUST for Sam and Alex, 17 for the dealer,
"21 beats 17. Every win pays ×1.6". Whoever is up lights on the table, and so
do their plate, their screen's bezel and their wire, with a gold chip running
down it to them; while a screen's player is up, the other screens sink
(`has-focus`). When the evening ends every screen powers off, the table
empties and stands dark for 0.75 s (`BREAK`), and Maya sits down alone again.
**A new take means measuring all of it again**: `JOINS`, `TURNS`, `PAYS`,
`PAID`, the seats and their results, and the badge's place on each screen.

**Where it runs.** The evening plays only under `xp-story`, which the page's
head sets when motion is allowed and Save-Data is off. Reduced motion,
Save-Data and refused autoplay (Low Power Mode) show the evening settled:
everyone seated with their results, the pill at ×1.6, "Three friends joined",
and each screen's payoff still. An open seat covers its screen with opaque
layers and never hides the video itself: muted autoplay may pause a video it
takes for invisible, and a friend's video has to be running in step the
moment they arrive.

**The screens** are take `xpj1` (2026-11-15, on the 1.6 tree with the floor
bonus lit; `~/Movies/cfl-promo/raw/xpj1_{iphone,ipad,android,vision}.mp4`,
shot by `scripts/promo-video/xplay-android.sh joins` in CasinoBros): Maya
sits down alone on an iPhone simulator, then Jules launches on an iPad, Sam
on the Android emulator and Alex on the Vision Pro simulator, and each joins
her room on a local relay. `tools/crossplay-cut.sh` cuts three spans of the
iPhone's clock into one 28 s evening: Maya alone through Sam's arrival
(8.4–17.6 s), Alex's arrival and the round he sits down in (20.6–29.05; the
3 s between, the table waiting on Sam's first bet with nothing moving, is
cut), and, from the same empty felt with every bet down, the round they win
(114.25–123.6), with the first frame held a second. Each device has its own
clock against the iPhone's (the iPad 0, Android +0.10 s, by the badge
climbing on every screen at once; the headset, which has no badge, +0.07 by
the round's sweep), resampled at 30 fps counting from each span's seek point
(the recorders write no frame while a screen is still, and counting from the
first one they do write ran Sam's clip 2.5 s ahead). A friend's clip is black
until they arrive, which costs next to nothing. It writes
`crossplay/<device>.mp4`, the still as `.webp` (Maya's first frame, or the
moment a friend arrives) and the payoff at 26.6 s (21 BEATS 17 on Maya's
screen, 20 BEATS 17 on Jules's, the busts) as `-payoff.webp`. The others
follow Maya's clock and are nudged back when they drift; the headset loads
only as it comes near. iOS Safari fetches a video only once it's asked to
play, so each screen is a still over its playing video, and every video
plays from the top, a friend's under its open seat.

**The grid** behind them is chetianholdings.com's lit grid, ported: 56 px
squares, a few at a time opening (a green line across, then the picture) on a
corner of the floor. The pictures are one video, `crossplay/tiles.mp4`, a 6×4
sheet of 112 px cells cut from the TV's clips by `tools/tiles-cut.sh`; keep
its `CELLS` in step with `PLACES` in `crossplay.js`, which names where each
cell is. Now and then three squares in a row are a player walking in: a cast
portrait in a player colour, "Maya joined", and the device they're on; a beat
later it flips through snow to where they went ("AT PLINKO"), with that place
playing in the first square. The names are made-up first names and the cast
comes from the wall. No square lights under the words, the buttons or the
screens, or out of view, and nothing on the grid moves under reduced motion
or Save-Data. `tiles.mp4` loads only once the round has started.

## The home screen: the television on the live floor

Under the hero stands the app's home screen — the television and the ways in
(the gold GET IT FREE card with a huddle of the cast, then the felt-green
mode cards) — on the live floor, under the heading LIVE FROM THE FLOOR.

**The floor** is a `<canvas>` running the game's own floor: felt carpet, real
tables, real cabinets, and the released cast walking between them — a
different fourteen every visit, and every so often somebody walks off the
edge and somebody new walks on. `floor.js` draws the furniture from the same
shapes, viewBox coordinates and palette as `FloorKitArt` in the app; the
characters are baked art, not redrawn.

**The television** is the home screen's set (`TVSetNode`): a satin-black slab
with a brass hairline, the picture's light round it in the show's colour, a
CRT line when it comes on, and on every channel change a burst of snow and
the channel number in old-set green (`ChannelFlipNode`). `tv.js` comes on to
what's new (below), then THE FLOOR — the site's own CH 01, friends in the
conga line past West Hall's slots, the bar and the pit — then surfs the app's
own lineup: the house show
on CH 02, THE BIG RACE on CH 03, EYE IN THE SKY on CH 07, with the app's words
for each. It is silent, like the app's home set. Phones get the 768-wide
clips; posters only under reduced motion (where the set stays on the floor)
or Save-Data. The set is below the fold, so it tunes in (loads its first
clip) once it's 250 px away and switches on, the CRT line and all, once it's
in view; until then it doesn't run, even in a background tab.

The first picture is the one a visitor waits on, so it's built to arrive
first. Safari plays a clip only once it has all of it, so the floor is three
clips, one a place (`floor-1`, `-2`, `-3`), cut together with no snow: a phone
on a slow line has West Hall moving after a third of the bytes, and the next
place loads while it plays; at each cut the last frame holds until the next
is on the glass, because Safari shows a video it has just unhidden black for
a frame. The first still is in the page, so the set comes on to a picture,
not to black. A channel's time counts from when its picture
moves, never from when it was asked for. The cast wall's spotlight loads its
legendary only a screen away (`cast.js`), off the TV's line.

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
  CFL_DUMP_EMBLEMS=aceCard,spadeSuit,diamondSuit,heartSuit,goldenCup,dicePair,joker,rouletteWheel,slotMachine,jackpotBurst,chipBurst,vaultDoor,racehorse,ensemble,floorMap,padlock,megaphone,crossedSwords,maracas,autograph,luckyCat,compass,moonTV,prizeWheel,rosette,betSlip,checkeredFlag,chipCoin,cocktail \
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
tools/tv-take.sh pushers 50 banquet,banquet rally 225 CFL_DEBUG_HOME_CAM=pushers   # CAM 14, pinned
tools/tv-take.sh open3 38 banquet,banquet rally 225   # v1.4's opening: CAM 15, then CAM 16 (unpinned)
CFL_SIM="CFL Showcase iPad 13" tools/tv-take.sh open-v16 44 banquet,banquet rally 225 \
  CFL_DEBUG_DAILY_PRESS=claimdone                       # v1.6's opening: CAM 21, the wheel's JACKPOT
python3 tools/tv-encode.py ~/Movies/cfl-site-tv
```

The windows in `tv-encode.py` fit the 2026-10-15 takes; read a contact sheet
of any new take before cutting it. No real-world teams or games ever go on
this set — v1.1 ships with real games off, and the clips are house shows and
the floor's own cameras only.

The set comes on to what's new, as the app's home set does
(`ChannelLineup.showcase`): since v1.6, CAM 21 on the rebuilt prize wheel,
whose regular gives it a throw that lands the JACKPOT, $25,000 over the face.
It's one take of the app's own opening (`open-v16`, 2026-11-25, the 1.6
tree), cut in three the way the floor is (`cam-wheel-1`, `-2`, `-3`), under
the app's own guide line, NEW ON THE FLOOR · PRIZE WHEEL; `cam-wheel` is the
whole, with a card, for the Latest section's set. Before it, v1.5's new
cabinets — CAM 17 on the
slots, CAM 18 on Plinko, CAM 19 on mines and CAM 20 on video poker, in that
order, a dwell each — cut from one take of the app's own opening
(`open-v15`, 2026-11-13), three clips a camera the way the floor is
(`cam-slots-1` … `cam-videopoker-3`), under the app's own guide lines, NEW ON
THE FLOOR · SLOT MACHINES, · PLINKO, · MINES and · VIDEO POKER. The cut
between the cameras is the app's own flash, and each camera lands its payoff
(BIG WIN, ×25, MAX WIN, ROYAL FLUSH) inside its clips. `cam-slots` …
`cam-videopoker` are the wholes, with cards, for a Latest section's sets.
Film a showcase unpinned: `CFL_DEBUG_HOME_CAM` holds a pinned camera for
600 s (a tracking camera like v1.4's CAM 16 plans its path over the whole
hold, so pinned it frames empty floor). v1.5's CAM 17–20 clips
(`cam-slots*` … `cam-videopoker*`), v1.4's CAM 15/16 clips
(`cam-baccarat*`, `cam-shellgame*`) and v1.3's CAM 14 clips (`cam-pushers*`)
are off the set but stay in `tv/`, which chetianholdings.com links. The next
new game takes that slot: film the opening, cut it in three a camera, and
point the first entries in `tv.js` at it.

THE FLOOR isn't a TV take: `tv-encode.py` cuts it from the iPhone Duo App
Store preview's conga take (`~/Movies/cfl-promo/raw/duo_conga.mp4`, see the
game repo's `/promo-video` skill) with a crop of its own that leaves out the
HUD and the tab bar. Each place is one window of the take and one entry in
`tv.js`, named there. `python3 tools/tv-encode.py ~/Movies/cfl-site-tv floor-1
floor-2 floor-3` cuts them; `floor` is the three joined, the set's first cut.

### The game picker

`#games`, the first section after the hero, is the cast wall's pattern for
the games: a phone in the spotlight and a wall of fourteen cards. Left alone,
the phone deals the whole floor in turn, holding each payoff a beat; a pick
stays on that game (`games.js`). Each game's words — its two pills, its line,
the clip's description for screen readers — are `data-*` on its card in
`index.html`, and its rules link is its `games.html` anchor. Every claim in
them is checked against the app's code. The Prize Wheel has no card (its bench
can't show a win); the section's foot mentions it.

The clips are the game repo's promo benches (`~/Movies/cfl-promo/raw`, the
`/promo-video` skill): an iPhone 17 Pro Max simulator, each game booted full
screen and playing itself, rigged where the bench can rig it.
`tools/game-clips.py` cuts each game's windows, paints out the Dynamic Island
with the preview's own `delogo` (so the CSS frame's island sits on it), and
writes `games/<game>.mp4` (520 wide, silent), the payoff still
`games/<game>.webp` (the poster, and all there is under reduced motion or
Save-Data) and the wall's square `games/<game>-card.webp`:

```sh
python3 tools/game-clips.py                  # all fourteen
python3 tools/game-clips.py roulette mines   # just these
```

Blackjack, Ultimate Hold'em, craps, slots and plinko are the preview's own
takes. The rest were shot for the site on 2026-10-19 (from
`scripts/promo-video/` in the game repo):

```sh
./shoot.sh web_poker 180 CFL_DEBUG_GAME=poker CFL_DEBUG_FILL=1 CFL_DEBUG_AUTOBET=1 CFL_DEBUG_BRO=ace
./shoot.sh web_roulette 75 CFL_DEBUG_GAME=roulette CFL_DEBUG_FILL=1 CFL_DEBUG_AUTOSPIN=1 CFL_DEBUG_BRO=ace
./shoot.sh web_dice 48 CFL_DEBUG_GAME=dice CFL_DEBUG_FILL=1 CFL_DEBUG_DICE_AUTOPILOT=1 CFL_DEBUG_DICE_PAUSE=2 CFL_DEBUG_BRO=ace
./shoot.sh web_horse 55 CFL_DEBUG_GAME=horseRacing CFL_DEBUG_HORSE_SEED=7 CFL_DEBUG_AUTOSPIN=1 CFL_DEBUG_BRO=ace
./shoot.sh web_vp 70 CFL_DEBUG_GAME=videoPoker CFL_DEBUG_AUTOSPIN=1 CFL_DEBUG_BRO=ace
./shoot.sh web_mines 60 CFL_DEBUG_GAME=mines CFL_DEBUG_AUTOSPIN=1 CFL_DEBUG_BRO=ace
```

None of those six can be rigged, so a take is a long run with a payoff in it:
the poker bench calls every hand down until you take a pot, and roulette's
autospin bets red or black at random. Two clips end without a win — the mines
bench never cashes out (the clip digs four gems, then finds a mine), and the
horse racing clip ends on the OFFICIAL board with your ticket out of the
money. The windows in `game-clips.py` fit these takes; a re-shoot moves every
moment, so read a contact sheet of the new take first.

The coin pushers (2026-11-01) can be rigged: one lit SPINS lamp and every
CHANCE spin landing on JACKPOT, with a wallet that doesn't run dry. The
CHANCE SPIN! that leads to the clip's jackpot comes at 16.4 s:

```sh
./shoot.sh web_pusher2 30 CFL_DEBUG_GAME=coinPusher CFL_DEBUG_PUSHER_THEME=treasureCove CFL_DEBUG_AUTOSPIN=1 CFL_DEBUG_PUSHER_BONUS=jackpot CFL_DEBUG_PUSHER_STOCK=1 CFL_DEBUG_PUSHER_SHOWCASE=1 CFL_DEBUG_CASH=25000 CFL_DEBUG_BRO=ace
```

Since v1.5, the four machines rebuilt for it lead the wall and the phone, in
the TV's order: slots, Plinko, mines, video poker. They're cut from the
iPhone App Store preview v5's takes (`s5_cosmic_beam`, `s5_plinko_disco`,
`s5_mines`, `s5_vp`, 2026-11-12; their flags are in the game repo's
`scripts/promo-video/cuts/iphone-v5.py`): Cosmic Cash's TRACTOR BEAM to
$5,000, Disco Drop's ten balls, Midnight Heist banking seven safes, and a
royal flush on five hands. Their light shows cost three to seven times a 1.4
clip at CRF 27, so each carries its own CRF (`CRF` in `game-clips.py`). The
page is served on the first card, so moving cards means moving the phone's
served name, pills, line, rules link, poster and label to the new first.
Then come v1.4's baccarat and Lefty's shell game, cut from the iPhone App
Store preview v4's own takes
(`v4_bacc`, `v4_shell1`, 2026-11-05; their flags are in the game repo's
`scripts/promo-video/cuts/iphone-v4.py`): the baccarat bench rigged to a
banker natural, and the shell game's bench playing THE REAL DEAL and picking
the right cup.

### Latest

`#latest` is the app's own What's New (`CasinoNews` in the game repo,
`CasinoCore/Sources/CasinoCore/Session/NewsFeed.swift`), newest first: the
newest release open beside its set (the showcase camera's clip, playing on
hover like the guide's), the earlier ones folded a version a row. When a
release ships, put its entry on top, fold the one it replaces, and drop any
line that only made sense on the day ("every drop so far is out now"). v1.6
has one set, CAM 21's jackpot (`.update-sets.one`, full width on a phone).
v1.5 had four, one a camera (`.update-sets.four`), and a line of the site's
own under the app's for Android; folded, it keeps the app's lines only.

### The phones

`clips/trailer.mp4` is the iPhone App Store preview v5 (made for 1.5's
listing, 2026-11-13: `~/Desktop/CasinoFloorLive_v1.5_store/App Store/Previews/`)
at half size, music kept behind the SOUND ON button; `clips/trailer.webp` is
its first frame. Keep both names: chetianholdings.com links them. The recipe,
which re-makes the v4 trailer byte for byte from v4:

```sh
ffmpeg -i CasinoFloorLive_AppPreview_iPhone_v5.mp4 -vf scale=444:-2:flags=lanczos \
  -c:v libx264 -preset slow -tune animation -profile:v high -crf 26 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart clips/trailer.mp4
ffmpeg -i clips/trailer.mp4 -frames:v 1 -c:v libwebp -quality 78 clips/trailer.webp
```

Its `VideoObject` in the home page's head says what's in it, shot by shot:
rewrite that line with the clip. The other pages' phone stills
(`clips/blackjack.webp`, `clips/floor.webp`) are cut from v3's raw takes the
same way. `clips/blackjack.mp4`, the home page's old table loop, is
no longer on any page.



## Parked until it ships

Announced content only:

- **Held drops** — none since 1.6: Yuletide opened, and the wall and the floor
  were re-baked with it on 2026-11-25 (88). The cast export leaves out any wave
  in `ReleaseWave.held` by itself; when one opens, re-bake (above).
- **The badge case** — the badges themselves aren't shown; a few emblems serve
  as the site's icons.
- **Real games** — the sports broadcasts are parked in the app (`RealGames.enabled`
  is false). Nothing on the site shows or names a real team or league.

## The share card and the search listing

**The share card** is what a link shows in Messages, Slack, X, Facebook and
the rest: `og-image.jpg` (1200×630) on every page's `og:image` and
`twitter:image`, with `og-image-square.jpg` (1200×1200) beside it in the home
page's `VideoGame.image` for Google's square-ish mobile thumbnails. It's an ad
built from the app's own pieces — the icon and the home screen's name line,
one line on what it is, the home screen's TV airing a house show with the cast
crowding the set, on the live floor. Its source is `tools/og-card.html`
(`?show=ditch` puts THE JACKPOT RUN on the set; `?seed=` deals another crowd
on the floor); render both sizes with:

```sh
tools/og-card.sh          # needs Google Chrome; SHOW=ditch / SEED=4 pass through
```

Platforms cache a card by URL: after changing it, bump the `?v=` on every
page's `og:image` and `twitter:image` (`20261115` since the card added
Android and Google Play) and re-scrape with Facebook's Sharing Debugger /
LinkedIn's Post Inspector. Messages caches per device.

**The search listing** — what Google shows for the site:
- *Favicon:* the app icon, from `favicon.ico` (16/32/48) and the 96/192 PNGs.
  Google wants a square at a multiple of 48 px on a stable URL, read from the
  home page, and refreshes it when it recrawls (days to weeks).
- *Site name:* `WebSite.name` "Casino Floor Live!" with `alternateName`s.
- *Title and snippet:* the home page `<title>` and meta description (≤ 160
  characters, or Google cuts it).
- *Thumbnail* (mobile): Google picks from `og:image` and the structured data
  `image`s — hence the square card.
- *Video:* the App Store preview is marked up as a `VideoObject` (the game's
  `trailer`), which makes it eligible for the Videos tab.
- No star ratings: Google only shows them for real ratings marked up on the
  page, and the site has none of its own. Don't import the App Store's.

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
- Home: https://casinofloor.live/
- Games: https://casinofloor.live/games
- Multiplayer: https://casinofloor.live/play-with-friends
- Vision Pro: https://casinofloor.live/vision-pro
- Privacy: https://casinofloor.live/privacy
- Support: https://casinofloor.live/support
- Terms: https://casinofloor.live/terms
- Age Suitability: https://casinofloor.live/age-rating

## Notes for App Store Connect
- **Privacy Policy URL** → the privacy.html link above.
- **Support URL** → the support.html link above (or home).
- Developer: Chetian Holdings LLC (chetianholdings.com) · Contact: contact@chetianholdings.com
- **Age Suitability URL** (optional field) → the age-rating.html link above.
- Content: simulated gambling with virtual currency (rated 18+).

© 2026 Chetian Holdings LLC.
