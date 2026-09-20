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
- `styles.css` — shared styles
- `floor.js` — the live casino floor behind the hero
- `favicon.svg` — the VIP crown mark
- `sprites/` — art baked out of the game (see below)

Add a page and it needs three things or it may as well not exist: an entry in
`sitemap.xml`, a link in the footer of every other page, and the same head
block (title / description / canonical / robots / OG / Twitter / breadcrumb
JSON-LD) the others carry.

## The live floor (hero background)

The hero is a `<canvas>` running the game's own floor: felt carpet, real
tables, real cabinets, and the free cast walking between them. `floor.js`
draws the furniture from the same shapes, viewBox coordinates and palette as
`FloorKitArt` in the app; the characters are baked art, not redrawn.

### Re-baking the art

The sprites come out of the game repo (`~/dev/CasinoBros`) — never hand-edit
them:

```sh
cd CasinoCore
CFL_DUMP_WEB=/tmp/web swift test --filter WebSpriteDumpTests
cp /tmp/web/* ../../casino-floor-live/sprites/
```

That writes `bros-atlas.png` (a row per character, a column per facing),
`bros-atlas.json` (the row/column order `floor.js` indexes by),
`bro-<id>.png` portraits for the cast line-up, and `emblem-crown.png` (the
ten-frame strip the header crown flips through). `CFL_DUMP_IDS` narrows the
cast; the default is `Bros.all`, the twelve free house regulars.

## Parked until it ships

Announced content only. Three things are drawn and in the app binary but are
NOT on this site yet, each with the markup ready to go:

- **The rest of the cast** — critters, Main Street, the Late Show, the Fantasy
  Tavern and the seasonal casts arrive on the monthly drops (`ReleaseWaves`).
  Re-run the dump with `CFL_DUMP_IDS` and add rows to the `#cast` grid.
- **The badge case** — fifty-two badges ride the same drops. `BadgeEmblemArt`
  bakes them the same way the crown is baked (`CFL_DUMP_EMBLEMS=...`).
- **The Sports Book** — the odds board, the betting windows and the TV-wall
  lounge, landing in v1.1. Add it to the `#games` list when the build ships.

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
- **`wordmark.png`** is still 1.3 MB. It is a `<picture>` fallback no current
  browser reaches (both WebP variants ship), so it costs nothing in practice —
  but `brew install pngquant && pngquant --quality 65-85 wordmark.png` would
  settle it.
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
