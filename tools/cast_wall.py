#!/usr/bin/env python3
"""Build the cast wall from the app's own art.

    python3 tools/cast_wall.py <dump dir>

<dump dir> is what the game repo's `WebSpriteDumpTests.testDumpWebCast` writes
(see README, "Re-baking the art"): `cast.json` plus, per character, a portrait
`<id>.png`, an eight-facing turnaround `<id>-turn.png`, and for a legendary its
own loop `<id>-fx.png` and its follower `<id>-pet.png`.

This converts them to WebP in sprites/cast/ and rewrites the wall in
index.html between the CAST:BEGIN and CAST:END markers: the filter tabs, the
spotlight, and a button per character carrying everything the spotlight shows
(cast.js reads it). The words around the facts — how you get each one — are
written here; the facts (tier, price, pack, badge) come from the app.
"""
import html
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'sprites', 'cast')

# The tabs, in the order the app's collection screen cuts the cast. The four
# Throwback legendaries are four sets of one in the app; on the wall they're
# one shelf, the season they come from.
SHELVES = [
    ('houseRegulars', 'House Regulars'),
    ('critters', 'The Critters'),
    ('mainStreet', 'Main Street'),
    ('lateShow', 'The Late Show'),
    ('sportsBook', 'Sports Book'),
    ('fantasyTavern', 'Fantasy Tavern'),
    ('halloween', 'Halloween'),
    ('throwback', 'The Throwback Season'),
]
THROWBACK = {'sixties', 'seventies', 'eighties', 'nineties'}

# What each character is, for alt text and search: "Mordrin, the wizard".
WHO = {
    'ace': "in a green dealer's visor", 'the-king': 'in a white jumpsuit and shades',
    'granny-lucky': 'with grey hair and round glasses', 'big-slick': 'in a navy suit and gold tie',
    'tex': 'in a cowboy hat and denim', 'ruby': 'in a red showgirl dress and feathered headdress',
    'bruno': 'in a dark suit and shades', 'vinnie': 'in a burgundy jacket',
    'chad': 'in a visor and teal polo', 'mystic-marla': 'in a purple hat and robes',
    'peaches': 'with red hair and a gold top', 'dice': 'in a teal tracksuit',
    'lucky-cat': 'the lucky cat', 'duke-dog': 'the dog', 'pit-boss-penguin': 'the penguin pit boss',
    'card-shark': 'the card shark', 'flamingo-flo': 'the flamingo', 'bull-tank': 'the bull',
    'pirate-quinn': 'the pirate', 'doc-hart': 'the doctor', 'skater-jinx': 'the skater',
    'clown-giggles': 'the clown', 'astro-nova': 'the astronaut', 'chef-marco': 'the chef',
    'ninja-kuro': 'the ninja', 'lucha-rey': 'the luchador', 'rock-axel': 'the rock star',
    'fire-blaze': 'the firefighter', 'boxer-rocky': 'the boxer', 'robot-b0t': 'the robot',
    'hero-comet': 'the superhero', 'alien-zeta': 'the alien',
    'magic-presto': 'the magician', 'dj-vex': 'the DJ', 'ballet-mira': 'the ballerina',
    'mime-blanc': 'the mime', 'octo-octavia': 'the octopus', 'crooner-sal': 'the crooner',
    'jockey-pip': 'the jockey', 'sumo-tora': 'the sumo wrestler', 'goalie-dex': 'the goalie',
    'racer-vito': 'the racing driver', 'golfer-chip': 'the golfer', 'qb-slinger': 'the quarterback',
    'hoops-tower': 'the basketball center', 'bookie-sharp': 'the sprinter',
    'slugger-mick': 'the slugger', 'winger-boaz': 'the hockey winger',
    'wizard-mordrin': 'the wizard', 'knight-galla': 'the knight', 'barbarian-krug': 'the barbarian',
    'elf-sylva': 'the elf', 'dragon-ember': 'the dragon',
    'nyx-cat': 'the black cat', 'rot-zombie': 'the zombie', 'scratch-devil': 'the devil',
    'morgana-witch': 'the witch', 'fang-wolf': 'the werewolf', 'wraps-mummy': 'the mummy',
    'bones-skeleton': 'the skeleton', 'vlad-vampire': 'the vampire', 'stitch-frank': 'the monster',
    'reaper-mort': 'the reaper',
    'hippie-daisy': 'the flower child', 'disco-boogie': 'the disco king',
    'synth-roxy': 'the synth star', 'blader-jett': 'the rollerblader',
}


def door(e):
    """How you get them, in the player's words."""
    tier = e['tier']
    if tier == 'house':
        return 'Free. Yours from your first visit.'
    if tier == 'open':
        return f"On the Prize Wheel, or ${e['cash']:,} in chips at the Gift Shop."
    if tier == 'earned':
        blurb = e.get('badgeBlurb', '').strip()
        blurb = blurb[:1].lower() + blurb[1:] if blurb else ''
        return f"Earned with the {e['badge']} badge: {blurb}" if blurb else f"Earned with the {e['badge']} badge."
    if tier == 'pack':
        return f"Only in the {e['pack']} pack. Never on the wheel, never for chips."
    return ''


def webp(src, dst, quality):
    subprocess.run(['cwebp', '-quiet', '-q', str(quality), '-alpha_q', '100', '-m', '6', src, '-o', dst],
                   check=True)


def main(dump):
    cast = json.load(open(os.path.join(dump, 'cast.json')))
    os.makedirs(OUT, exist_ok=True)
    for e in cast:
        i = e['id']
        webp(os.path.join(dump, f'{i}.png'), os.path.join(OUT, f'{i}.webp'), 88)
        webp(os.path.join(dump, f'{i}-turn.png'), os.path.join(OUT, f'{i}-turn.webp'), 84)
        if e['fx']:
            webp(os.path.join(dump, f'{i}-fx.png'), os.path.join(OUT, f'{i}-fx.webp'), 84)
        if e['pet']:
            webp(os.path.join(dump, f'{i}-pet.png'), os.path.join(OUT, f'{i}-pet.webp'), 86)
    shutil.copy(os.path.join(dump, 'cast.json'), os.path.join(OUT, 'cast.json'))

    def shelf(e):
        return 'throwback' if e['set'] in THROWBACK else e['set']

    counts = {key: sum(1 for e in cast if shelf(e) == key) for key, _ in SHELVES}
    legends = sum(1 for e in cast if e['rarity'] == 'legendary')
    esc = html.escape

    tabs = [f'<button class="cast-tab" type="button" data-filter="all" aria-pressed="true">Everyone<b>{len(cast)}</b></button>',
            f'<button class="cast-tab" type="button" data-filter="legendary" aria-pressed="false">Legendary<b>{legends}</b></button>']
    for key, title in SHELVES:
        if counts[key]:
            tabs.append(f'<button class="cast-tab" type="button" data-filter="{key}" aria-pressed="false">'
                        f'{esc(title)}<b>{counts[key]}</b></button>')

    cards = []
    for e in cast:
        i = e['id']
        who = WHO.get(i, '')
        alt = f"{e['name']}, {who}" if who.startswith('the ') else f"{e['name']}, a casino regular {who}" if who else e['name']
        set_title = 'The Throwback Season' if e['set'] in THROWBACK else e['setTitle']
        if e['set'] in THROWBACK:
            set_title = f"{e['setTitle']} · Throwback"
        attrs = {
            'data-id': i,
            'data-name': e['name'],
            'data-rarity': e['rarityLabel'].title(),
            'data-tint': e['tint'],
            'data-set-title': set_title,
            'data-tagline': e['tagline'],
            'data-door': door(e),
        }
        if e['fx']:
            attrs['data-fx'] = f"{e['fx']['frames']},{e['fx']['periodMs']}"
        if e['pet']:
            attrs['data-pet'] = f"{e['pet']['frames']},{e['pet']['periodMs']},{e['pet']['scalePct']}"
        attr = ' '.join(f'{k}="{esc(str(v), quote=True)}"' for k, v in attrs.items())
        legendary = ' legendary' if e['rarity'] == 'legendary' else ''
        cards.append(
            f'<li data-shelf="{shelf(e)}" data-rarity="{e["rarity"]}">'
            f'<button class="cast-card{legendary}" type="button" aria-pressed="false" style="--tint: {e["tint"]}" {attr}>'
            f'<img src="sprites/cast/{i}.webp" alt="{esc(alt, quote=True)}" width="192" height="192" loading="lazy" />'
            f'<span>{esc(e["name"])}</span></button></li>')

    first = cast[0]
    block = '\n'.join([
        '<!-- CAST:BEGIN -->',
        '        <!-- Generated by tools/cast_wall.py from the app\'s cast export. Do not hand-edit. -->',
        '        <div class="cast-tabs" role="group" aria-label="Show part of the cast">',
        *('          ' + t for t in tabs),
        '        </div>',
        '        <div class="cast-shelf">',
        '          <div class="spotlight">',
        '            <div class="spot-turn">',
        '              <button type="button" data-turn="-1" aria-label="Turn them to the left">&#x21BA;</button>',
        '              <button type="button" data-turn="1" aria-label="Turn them to the right">&#x21BB;</button>',
        '            </div>',
        '            <div class="spot-stage" aria-hidden="true">',
        '              <div class="plinth"></div>',
        f'              <div class="figure"><div class="body" style="background-image: url(sprites/cast/{first["id"]}-turn.webp)"></div><div class="pet"></div></div>',
        '            </div>',
        '            <div class="spot-info" aria-live="polite">',
        f'              <h3 class="spot-name">{esc(first["name"])}</h3>',
        f'              <div class="spot-meta"><span class="pill rarity" style="color: {first["tint"]}">{esc(first["rarityLabel"].title())}</span>'
        f'<span class="pill set">{esc(first["setTitle"])}</span></div>',
        f'              <p class="spot-tagline">{esc(first["tagline"])}</p>',
        f'              <p class="spot-door">{esc(door(first))}</p>',
        '            </div>',
        '          </div>',
        '          <ul class="cast-wall">',
        *('            ' + c for c in cards),
        '          </ul>',
        '        </div>',
        '<!-- CAST:END -->',
    ])

    path = os.path.join(ROOT, 'index.html')
    page = open(path, encoding='utf-8').read()
    page, n = re.subn(r'<!-- CAST:BEGIN -->.*?<!-- CAST:END -->', lambda _: block, page, flags=re.S)
    if n != 1:
        sys.exit('index.html has no CAST:BEGIN / CAST:END block')
    open(path, 'w', encoding='utf-8').write(page)
    print(f'cast wall: {len(cast)} characters, {legends} legendary')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
