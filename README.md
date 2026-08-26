# Casino Floor Live! — website

Marketing site and required legal pages for the iOS game **Casino Floor Live!**, a co-op casino party game (virtual chips only, up to 10 players).

Served via GitHub Pages as a plain static site.

## Pages
- `index.html` — landing page
- `privacy.html` — Privacy Policy (App Store privacy URL)
- `support.html` — Support / FAQ (App Store support URL)
- `terms.html` — Terms of Use / EULA
- `age-rating.html` — Age Suitability disclosure (App Store age suitability URL)
- `styles.css` — shared styles
- `floor.js` — the live casino floor behind the hero
- `favicon.svg` — the VIP crown mark
- `sprites/` — art baked out of the game (see below)

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

## Live URLs (custom domain, see `CNAME`)
- Home: https://casinofloorlive.app/
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
