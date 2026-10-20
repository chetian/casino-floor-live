# Casino Floor Live! — website

Marketing site and required legal pages for the iOS game **Casino Floor Live!**, a co-op casino party game (virtual chips only, up to 10 players).

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
- `floor.js` — the live casino floor behind the hero
- `tv.js` — the hero's television: the floor, then the house's channels
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
- `clips/` — the App Store preview, and stills for the other pages' phones
- `tools/` — the scripts that rebuild the cast wall, the TV and the game clips

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
the channel number in old-set green (`ChannelFlipNode`). `tv.js` comes on to
THE FLOOR — the site's own CH 01, friends in the conga line past West Hall's
slots, the bar and the pit — then surfs the app's own lineup: the house show
on CH 02, THE BIG RACE on CH 03, EYE IN THE SKY on CH 07, with the app's words
for each. It is silent, like the app's home set. Phones get the 768-wide
clips; posters only under reduced motion (where the set stays on the floor)
or Save-Data.

The first picture is the one a visitor waits on, so it's built to arrive
first. Safari plays a clip only once it has all of it, so the floor is three
clips, one a place (`floor-1`, `-2`, `-3`), cut together with no snow: a phone
on a slow line has West Hall moving after a third of the bytes, and the next
place loads while it plays; at each cut the last frame holds until the next
is on the glass, because Safari shows a video it has just unhidden black for
a frame. The first still is in the page and preloaded, so the set comes on
to the floor, not to black. A channel's time counts from when its picture
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

THE FLOOR isn't a TV take: `tv-encode.py` cuts it from the iPhone Duo App
Store preview's conga take (`~/Movies/cfl-promo/raw/duo_conga.mp4`, see the
game repo's `/promo-video` skill) with a crop of its own that leaves out the
HUD and the tab bar. Each place is one window of the take and one entry in
`tv.js`, named there. `python3 tools/tv-encode.py ~/Movies/cfl-site-tv floor-1
floor-2 floor-3` cuts them; `floor` is the three joined, the set's first cut.

### The game picker

`#games`, the first section after the hero, is the cast wall's pattern for
the games: a phone in the spotlight and a wall of eleven cards. Left alone,
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
python3 tools/game-clips.py                  # all eleven
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

### The phones

`clips/trailer.mp4` is the approved iPhone App Store preview (v3) at half
size, music kept behind the SOUND ON button. The other pages' phone stills
(`clips/blackjack.webp`, `clips/floor.webp`) are cut from that preview's raw
takes the same way. `clips/blackjack.mp4`, the home page's old table loop, is
no longer on any page.

## Parked until it ships

Announced content only:

- **Held drops** — Yuletide is drawn and in the app binary but held
  (`ReleaseWave.held`). The cast export leaves it out by itself; when it opens,
  re-bake (above) and the wall and the floor pick it up.
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

Platforms cache a card by URL: after changing it, rename the file (or add a
`?v=`) and re-scrape with Facebook's Sharing Debugger / LinkedIn's Post
Inspector. Messages caches per device.

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
