/* Casino Floor Live! — the live floor, running in the page.
 *
 * This is the game's own floor, not a picture of it. The furniture is drawn
 * with the same shapes, in the same viewBox coordinates and the same palette
 * as `FloorKitArt` in the app, and the characters ARE the app's characters —
 * `sprites/bros-atlas.png` is baked straight out of `BroFace` by the
 * `WebSpriteDumpTests` dump, so a costume change in the game reaches the site
 * by re-running that test rather than by anyone redrawing anything here.
 *
 * Everything is one <canvas>: carpet, light pools, tables, chairs, dealers,
 * props, and a floor of bros walking table to table. Coordinates below are
 * "floor points" — the same unit the app lays its floor out in, so a 116-point
 * blackjack table and a 48-point bro stand in the right proportion to each
 * other without anyone tuning it by eye.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('floor-canvas');
  if (!canvas || !canvas.getContext) return;
  var g = canvas.getContext('2d');

  /* ---------------------------------------------------------------- palette
     FloorKitArt's kit colors, verbatim. */
  var K = {
    woodDark: '#4E2F18', woodMid: '#6B4223', woodTop: '#8A5A33', woodLight: '#9C6B3F',
    feltTable: '#1D5638', feltDeep: '#17422C', feltLine: '#2A7048',
    gold: '#E3AF25', goldBright: '#F7C948', goldDeep: '#B98A16',
    redBright: '#C93327', redDeep: '#A02318',
    ink: '#0B0E0C', cream: '#FFF7E4',
    steel: '#A8B0B8', steelDark: '#7A828A',
    teal: '#2BD9C7', mint: '#2EBF66', neonPink: '#FF4FA3',
    carpet: '#0C2317', carpetLine: '#113020',
    shadow: 'rgba(0,0,0,0.35)'
  };
  /* DesignTokens.Palette.playerColors — the identity ring under each bro. */
  var PLAYER_COLORS = [
    '#4CA6FF', '#FF8C33', '#A673FF', '#40E6BF', '#FF6699',
    '#F2E559', '#8CD94D', '#E6E6F2', '#F25151', '#4CD9F2'
  ];

  /* ------------------------------------------------------- draw primitives
     Ports of FloorKitArt's SVG-coordinate helpers. Same names, same argument
     order, so a shape can be read against the Swift it came from. */
  function roundRectPath(x, y, w, h, r) {
    r = Math.max(0, Math.min(r || 0, Math.min(w, h) / 2));
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function fillRect(x, y, w, h, r, color) {
    roundRectPath(x, y, w, h, r);
    g.fillStyle = color;
    g.fill();
  }
  function strokeRect(x, y, w, h, r, color, width) {
    roundRectPath(x, y, w, h, r);
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
  }
  function fillCircle(cx, cy, r, color) {
    g.beginPath();
    g.arc(cx, cy, Math.max(r, 0), 0, Math.PI * 2);
    g.fillStyle = color;
    g.fill();
  }
  function strokeCircle(cx, cy, r, color, width) {
    g.beginPath();
    g.arc(cx, cy, Math.max(r, 0), 0, Math.PI * 2);
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
  }
  function ellipsePath(cx, cy, rx, ry) {
    g.beginPath();
    g.ellipse(cx, cy, Math.max(rx, 0), Math.max(ry, 0), 0, 0, Math.PI * 2);
  }
  function fillEllipse(cx, cy, rx, ry, color) {
    ellipsePath(cx, cy, rx, ry);
    g.fillStyle = color;
    g.fill();
  }
  function strokeEllipse(cx, cy, rx, ry, color, width) {
    ellipsePath(cx, cy, rx, ry);
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
  }
  /* The half-moon the blackjack and poker rails are built from: the bottom
     half of an ellipse, flat side up. */
  function bottomHalfEllipsePath(cx, cy, rx, ry) {
    g.beginPath();
    g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI);
    g.closePath();
  }
  function fillBottomHalfEllipse(cx, cy, rx, ry, color) {
    bottomHalfEllipsePath(cx, cy, rx, ry);
    g.fillStyle = color;
    g.fill();
  }
  function strokeBottomHalfEllipse(cx, cy, rx, ry, color, width) {
    bottomHalfEllipsePath(cx, cy, rx, ry);
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
  }
  function strokeLine(x1, y1, x2, y2, color, width, round) {
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.strokeStyle = color;
    g.lineWidth = width;
    g.lineCap = round ? 'round' : 'butt';
    g.stroke();
    g.lineCap = 'butt';
  }
  function poly(points, color) {
    g.beginPath();
    g.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i++) g.lineTo(points[i][0], points[i][1]);
    g.closePath();
    g.fillStyle = color;
    g.fill();
  }
  function label(text, cx, cy, size, color, weight) {
    g.font = (weight || 800) + ' ' + size + 'px Nunito, system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = color;
    g.fillText(text, cx, cy);
  }
  function alpha(hex, a) {
    var v = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a + ')';
  }

  /* --------------------------------------------------------------- the kit
     One entry per fixture: the viewBox it is drawn in, the size it stands on
     the floor at, and the draw itself. Straight from FloorKitArt. */
  var KIT = {
    blackjack: {
      box: [140, 90], size: [116, 75], seatRing: [88, 56], dealt: true,
      seats: (function () {
        // Chairs fan across the curve on even x fractions, not even angles.
        var out = [], reach = 0.955;
        for (var i = 0; i < 6; i++) {
          var t = i / 5;
          out.push(-Math.acos(reach - 2 * reach * t));
        }
        return out;
      })(),
      draw: function () {
        fillEllipse(70, 58, 62, 30, K.shadow);
        fillBottomHalfEllipse(70, 36, 62, 46, K.woodMid);
        fillRect(8, 30, 124, 6, 0, K.woodMid);
        fillBottomHalfEllipse(70, 30, 62, 46, K.gold);
        fillBottomHalfEllipse(70, 32, 56, 40, K.feltTable);
        strokeBottomHalfEllipse(70, 36, 40, 26, K.feltLine, 2);
        fillRect(52, 30, 36, 8, 4, K.woodTop);
      }
    },
    poker: {
      box: [160, 110], size: [150, 103], seatRing: [78, 56], dealt: true,
      seats: [Math.PI * 0.72, Math.PI, Math.PI * 1.28, Math.PI * 1.72, 0, Math.PI * 0.28],
      draw: function () {
        fillEllipse(80, 66, 70, 38, K.shadow);
        fillBottomHalfEllipse(80, 66, 66, 34, K.woodMid);
        fillRect(14, 58, 132, 8, 0, K.woodMid);
        fillEllipse(80, 58, 66, 34, K.gold);
        fillEllipse(80, 57, 60, 29, K.feltDeep);
        fillEllipse(80, 57, 52, 23, K.feltTable);
        strokeEllipse(80, 57, 34, 13, K.feltLine, 2);
      }
    },
    roulette: {
      box: [170, 100], size: [130, 76], seatRing: [78, 50], dealt: true,
      seats: [Math.PI * 0.72, Math.PI, Math.PI * 1.28, Math.PI * 1.72, 0, Math.PI * 0.28],
      draw: function () {
        fillEllipse(85, 66, 76, 30, K.shadow);
        fillRect(10, 26, 150, 52, 18, K.gold);
        fillRect(10, 60, 150, 18, 9, K.woodMid);
        fillRect(15, 30, 140, 44, 14, K.feltTable);
        // The wheel is redrawn live by the idle layer so it can turn; the bake
        // lays down only the wood ring it turns inside.
        fillCircle(47, 52, 19, K.woodTop);
        strokeRect(76, 38, 70, 28, 3, K.feltLine, 1.6);
        strokeLine(99, 38, 99, 66, K.feltLine, 1.6);
        strokeLine(122, 38, 122, 66, K.feltLine, 1.6);
        fillRect(80, 43, 7, 7, 1.5, K.redBright);
        fillRect(104, 52, 7, 7, 1.5, K.ink);
        strokeRect(104, 52, 7, 7, 1.5, K.feltLine, 1);
      }
    },
    craps: {
      box: [190, 100], size: [150, 76], seatRing: [78, 56], dealt: true,
      seats: [Math.PI * 0.72, Math.PI, Math.PI * 1.28, Math.PI * 1.72, 0, Math.PI * 0.28],
      draw: function () {
        fillEllipse(95, 68, 86, 26, K.shadow);
        fillRect(6, 24, 178, 56, 24, K.woodMid);
        fillRect(6, 20, 178, 54, 24, K.woodTop);
        fillRect(16, 26, 158, 42, 16, K.feltTable);
        strokeRect(16, 26, 158, 42, 16, K.feltDeep, 3);
        strokeRect(24, 31, 142, 32, 12, K.feltLine, 2);
        for (var i = 0; i < 6; i++) strokeRect(40 + i * 19, 34, 13, 11, 2, K.feltLine, 1.5);
        fillRect(80, 50, 12, 12, 3, K.cream);
        fillCircle(86, 56, 1.7, K.ink);
        fillRect(97, 52, 12, 12, 3, K.redBright);
        fillCircle(101, 56, 1.5, K.cream);
        fillCircle(105, 60, 1.5, K.cream);
      }
    },
    horseRacing: {
      box: [150, 104], size: [106, 74], seatRing: [64, 50], dealt: false,
      seats: [Math.PI * 0.72, Math.PI, Math.PI * 1.28, Math.PI * 1.72, 0, Math.PI * 0.28],
      draw: function () {
        fillEllipse(75, 98, 66, 6, K.shadow);
        fillRect(10, 22, 130, 72, 8, K.woodMid);
        fillRect(16, 28, 118, 52, 4, K.feltDeep);
        var horses = [[K.gold, 40], [K.redBright, 52], [K.teal, 64]];
        for (var i = 0; i < horses.length; i++) {
          fillCircle(26, horses[i][1], 5, horses[i][0]);
          fillRect(36, horses[i][1] - 4, 56, 9, 2, 'rgba(11,14,12,0.6)');
          fillRect(112, horses[i][1] - 3, 18, 7, 2, alpha(K.mint, 0.9));
        }
        fillRect(16, 80, 118, 8, 0, K.woodTop);
        fillRect(30, 6, 90, 20, 10, K.ink);
        label('PONIES', 75, 17, 10.5, K.neonPink, 900);
      }
    },
    slots: {
      box: [64, 92], size: [60, 86], seatRing: [0, 50], dealt: false, bank: true,
      seats: [-Math.PI / 2],
      draw: function () { cabinet('slots'); }
    },
    videoPoker: {
      box: [64, 92], size: [60, 86], seatRing: [0, 50], dealt: false,
      seats: [-Math.PI / 2],
      draw: function () { cabinet('videoPoker'); }
    },
    mines: {
      box: [64, 92], size: [60, 86], seatRing: [0, 50], dealt: false,
      seats: [-Math.PI / 2],
      draw: function () { cabinet('mines'); }
    },
    plinko: {
      box: [64, 92], size: [60, 86], seatRing: [0, 50], dealt: false,
      seats: [-Math.PI / 2],
      draw: function () { cabinet('plinko'); }
    }
  };

  function cabinet(kind) {
    var body, bodyDark;
    if (kind === 'slots') { body = K.redBright; bodyDark = K.redDeep; }
    else if (kind === 'videoPoker') { body = '#1B2A4A'; bodyDark = '#12203A'; }
    else if (kind === 'plinko') { body = K.woodMid; bodyDark = K.woodDark; }
    else { body = '#24485F'; bodyDark = '#183344'; }

    fillEllipse(32, 84, 26, 7, K.shadow);
    fillRect(8, 30, 48, 52, 6, bodyDark);
    fillRect(8, 26, 48, 48, 6, body);
    poly([[10, 14], [54, 14], [58, 26], [6, 26]], K.gold);
    poly([[10, 14], [54, 14], [56, 20], [8, 20]], K.goldBright);
    fillRect(14, 32, 36, 22, 4, K.ink);

    var i, x, row, col;
    if (kind === 'slots') {
      var reels = [17, 27.5, 38], reelColors = [K.redBright, K.gold, K.teal];
      for (i = 0; i < 3; i++) {
        fillRect(reels[i], 35, 9, 16, 2, K.cream);
        fillCircle(reels[i] + 4.5, 43, 3, reelColors[i]);
      }
    } else if (kind === 'videoPoker') {
      for (i = 0; i < 5; i++) fillRect(17 + i * 6.2, 37, 5.2, 12, 1.5, K.cream);
      fillCircle(20, 41, 1.5, K.redBright);
      fillCircle(32.5, 44, 1.5, K.redDeep);
      fillCircle(44.5, 41, 1.5, K.redBright);
    } else if (kind === 'plinko') {
      for (row = 0; row < 3; row++) {
        var count = row + 2, y = 36 + row * 5;
        for (i = 0; i < count; i++) {
          fillCircle(32 + (i - (count - 1) / 2) * 7, y, 1.3, K.cream);
        }
      }
      var buckets = [K.neonPink, K.gold, '#1B2A4A', K.gold, K.neonPink];
      for (i = 0; i < buckets.length; i++) fillRect(16.5 + i * 6.4, 49.5, 5.6, 3.5, 1, buckets[i]);
    } else {
      for (row = 0; row < 3; row++) {
        for (col = 0; col < 3; col++) {
          x = 16.5 + col * 11;
          var ty = 34.5 + row * 6.5;
          fillRect(x, ty, 9.5, 5, 1.5, '#33566E');
          if ((row === 0 && col === 1) || (row === 2 && col === 0)) {
            fillCircle(x + 4.75, ty + 2.5, 1.8, K.mint);
          } else if (row === 1 && col === 2) {
            fillCircle(x + 4.75, ty + 2.5, 1.8, K.redBright);
          }
        }
      }
    }

    fillRect(20, 60, 24, 9, 4.5, K.gold);
    fillRect(26, 72, 12, 4, 2, 'rgba(11,14,12,0.5)');
    if (kind === 'slots') {
      fillRect(56, 34, 4, 20, 2, K.steelDark);
      fillCircle(58, 32, 5, K.redBright);
      strokeCircle(58, 32, 5, '#711810', 1.5);
    }
  }

  /* A chair, drawn in its own 36×44 viewBox at 30×37 points. `facing` is the
     way its OCCUPANT looks. */
  function chair(facing) {
    fillEllipse(18, 39, 13, 4, K.shadow);
    if (facing === 'up') {
      fillRect(6, 8, 24, 20, 6, K.redBright);
      fillRect(6, 22, 24, 8, 4, K.redDeep);
      fillRect(4, 24, 28, 14, 5, K.woodTop);
      fillRect(4, 34, 28, 4, 2, K.woodMid);
    } else if (facing === 'down') {
      fillRect(6, 2, 24, 14, 5, K.woodTop);
      fillRect(6, 12, 24, 22, 6, K.redBright);
      fillRect(6, 28, 24, 8, 4, K.redDeep);
    } else {
      fillRect(4, 4, 9, 30, 4, K.woodTop);
      fillRect(10, 16, 22, 16, 5, K.redBright);
      fillRect(10, 26, 22, 8, 4, K.redDeep);
    }
  }

  function stool() {
    fillEllipse(18, 41, 13, 4, K.shadow);
    fillRect(15, 22, 6, 18, 2.5, K.steelDark);
    fillEllipse(18, 16, 14, 9, K.redDeep);
    fillEllipse(18, 14, 14, 9, K.redBright);
    fillEllipse(18, 13, 9, 5.5, 'rgba(160,35,24,0.5)');
  }

  function ropeRun(w, h) {
    var postCount = Math.max(2, Math.floor(w / 80) + 1);
    var inset = 8;
    var step = (w - inset * 2) / (postCount - 1);
    var topY = h * 0.22;
    var baseY = h - 6;
    var xs = [], i;
    for (i = 0; i < postCount; i++) xs.push(inset + i * step);
    for (i = 0; i < postCount; i++) fillEllipse(xs[i], baseY, 9, 3.2, K.shadow);
    for (i = 0; i < postCount - 1; i++) {
      g.beginPath();
      g.moveTo(xs[i], topY + 4);
      g.quadraticCurveTo((xs[i] + xs[i + 1]) / 2, topY + h * 0.34, xs[i + 1], topY + 4);
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.strokeStyle = K.redBright;
      g.stroke();
      g.lineCap = 'butt';
    }
    for (i = 0; i < postCount; i++) {
      fillRect(xs[i] - 2.5, topY, 5, baseY - topY, 2.5, K.goldDeep);
      fillCircle(xs[i], topY - 1, 5, K.gold);
    }
  }

  function plant() {
    fillEllipse(22, 53, 15, 4.5, K.shadow);
    poly([[12, 38], [32, 38], [29, 54], [15, 54]], K.redBright);
    poly([[12, 38], [32, 38], [31, 43], [13, 43]], K.redDeep);
    fillCircle(22, 22, 14, K.feltLine);
    fillCircle(12, 28, 8, '#1F9A4E');
    fillCircle(32, 27, 8, '#1F9A4E');
    fillCircle(22, 14, 7, '#3E8F60');
  }

  /* --------------------------------------------------------------- carpet
     One tile, baked once and used as a repeating pattern — the diamond motif
     the house prints on its floor. */
  var carpetPattern = null;
  function bakeCarpet(scale) {
    var side = Math.max(2, Math.round(64 * scale));
    var tile = document.createElement('canvas');
    tile.width = tile.height = side;
    var t = tile.getContext('2d');
    var prev = g;
    g = t;
    g.scale(side / 64, side / 64);
    fillRect(0, 0, 64, 64, 0, K.carpet);
    g.beginPath();
    g.moveTo(32, 6); g.lineTo(58, 32); g.lineTo(32, 58); g.lineTo(6, 32);
    g.closePath();
    g.lineWidth = 3;
    g.strokeStyle = alpha(K.carpetLine, 0.55);
    g.stroke();
    var dots = [[32, 32], [0, 0], [64, 0], [0, 64], [64, 64]];
    for (var i = 0; i < dots.length; i++) {
      fillCircle(dots[i][0], dots[i][1], 3, alpha(K.feltDeep, 0.6));
    }
    g = prev;
    carpetPattern = g.createPattern(tile, 'repeat');
    carpetScale = side / 64;
  }
  var carpetScale = 1;

  /* ----------------------------------------------------------- the layout
     A pit, laid out in floor points. Nothing here is decorative filler: it is
     the same furniture the app stands on its own floor, in the same sizes. */
  var WORLD = { w: 1020, h: 600 };

  /* The pit sits in the top half; the bottom is open aisle, which is where
     the page's copy lands — so the words sit on carpet with bros walking
     through them rather than on top of a table. */
  var TABLES = [
    { kind: 'blackjack', x: 372, y: 120, name: 'Blackjack' },
    { kind: 'roulette', x: 648, y: 102, name: 'Roulette' },
    { kind: 'slots', x: 886, y: 116, name: 'LUCKY 7s' },
    { kind: 'horseRacing', x: 336, y: 310, name: 'Horse Racing' },
    { kind: 'poker', x: 626, y: 300, name: "Ultimate Hold'em" },
    { kind: 'videoPoker', x: 856, y: 306, name: 'Video Poker' },
    { kind: 'mines', x: 972, y: 306, name: 'Mines' },
    { kind: 'craps', x: 742, y: 486, name: 'Craps' },
    { kind: 'plinko', x: 976, y: 480, name: 'Plinko' }
  ];

  var PLANTS = [
    { x: 62, y: 430 }, { x: 246, y: 214 }, { x: 78, y: 186 },
    { x: 186, y: 540 }, { x: 500, y: 448 }
  ];

  /* The rope run down the entrance aisle, left of the pit. */
  var ROPES = [
    { x: 58, y: 74, w: 214 }
  ];

  /* Warm pools thrown by the house lights. */
  var LIGHTS = [
    { x: 372, y: 142, r: 215 }, { x: 648, y: 122, r: 235 }, { x: 886, y: 135, r: 225 },
    { x: 626, y: 320, r: 250 }, { x: 336, y: 330, r: 200 }, { x: 880, y: 320, r: 205 },
    { x: 742, y: 495, r: 215 }, { x: 150, y: 330, r: 250 }, { x: 240, y: 560, r: 220 }
  ];

  /* Where a bro can stand: aisles and table-side spots, all clear of felt. */
  var SPOTS = [
    [500, 196], [790, 190], [968, 214], [150, 118], [420, 44], [700, 40],
    [500, 398], [780, 394], [960, 400], [58, 250], [116, 400],
    [252, 300], [772, 232], [560, 214], [140, 552], [360, 550],
    [230, 108], [606, 552], [420, 480], [880, 84], [980, 130], [64, 552]
  ];

  /* ------------------------------------------------------------ the cast */
  var atlas = new Image();
  var atlasReady = false;
  var ATLAS = { cell: 128, facings: ['up', 'down', 'left', 'right'], bros: [], names: [] };
  var SPRITE_H = 48;   // PlayerAvatarNode.spriteHeight

  var actors = [];

  function makeActors() {
    var picks = [0, 1, 2, 4, 5, 7, 8, 10, 3, 6];   // roster rows, a mixed floor
    SPOTS = SPOTS.filter(function (s) { return !blocked(s[0], s[1]); });
    actors = [];
    for (var i = 0; i < picks.length; i++) {
      var row = picks[i] % Math.max(ATLAS.bros.length, 1);
      var spot = SPOTS[(i * 3) % SPOTS.length];
      actors.push({
        row: row,
        name: ATLAS.names[row] || '',
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        x: spot[0], y: spot[1],
        tx: spot[0], ty: spot[1],
        facing: 'down',
        speed: 34 + (i % 5) * 5,
        wait: i * 0.7,
        seat: null,
        emote: null, emoteAt: 6 + i * 3.5
      });
    }
    // Three of them are sitting at a table rather than walking it.
    seat(actors[0], TABLES[0], 2);
    seat(actors[4], TABLES[4], 1);
    seat(actors[7], TABLES[2], 0);
  }

  function seat(actor, table, index) {
    var kit = KIT[table.kind];
    var a = kit.seats[index % kit.seats.length];
    var ox = Math.cos(a) * kit.seatRing[0];
    var oy = Math.sin(a) * kit.seatRing[1];
    // SpriteKit's seat ring is y-up; the canvas is y-down.
    var perch = kit.seatRing[0] === 0 ? 10 : 0;   // stool seats sit high
    actor.seat = { table: table, x: table.x + ox, y: table.y - oy - perch };
    actor.x = actor.tx = actor.seat.x;
    actor.y = actor.ty = actor.seat.y;
    actor.facing = Math.abs(ox) > Math.abs(oy)
      ? (ox > 0 ? 'left' : 'right')
      : (oy > 0 ? 'up' : 'down');
  }

  /* Furniture a bro can't walk through. Cheap AABBs around each table (the
     slots bank counts as three), because a chibi strolling across the felt is
     the one thing that would give the whole illusion away. */
  var BLOCKERS = null;
  function blockers() {
    if (BLOCKERS) return BLOCKERS;
    BLOCKERS = [];
    for (var i = 0; i < TABLES.length; i++) {
      var t = TABLES[i], kit = KIT[t.kind];
      var w = kit.size[0], h = kit.size[1];
      var span = kit.bank ? w * 3 + 4 : w;
      BLOCKERS.push({ x: t.x, y: t.y, hw: span / 2 + 7, hh: h / 2 + 7 });
    }
    // The pots too — a bro standing in a planter reads as a bug, not a joke.
    for (i = 0; i < PLANTS.length; i++) {
      BLOCKERS.push({ x: PLANTS[i].x, y: PLANTS[i].y + 8, hw: 20, hh: 14 });
    }
    return BLOCKERS;
  }
  function blocked(x, y) {
    var b = blockers();
    for (var i = 0; i < b.length; i++) {
      if (Math.abs(x - b[i].x) < b[i].hw && Math.abs(y - b[i].y) < b[i].hh) return true;
    }
    return false;
  }

  function pickSpot(actor) {
    // Never re-pick the spot you are standing on, and never head for one
    // somebody else has already claimed — two bros sharing a spot stack their
    // name labels into an unreadable smudge.
    for (var attempt = 0; attempt < 6; attempt++) {
      var s = SPOTS[(Math.random() * SPOTS.length) | 0];
      if (Math.abs(s[0] - actor.x) < 40 && Math.abs(s[1] - actor.y) < 40) continue;
      var taken = false;
      for (var i = 0; i < actors.length; i++) {
        var o = actors[i];
        if (o === actor || o.seat) continue;
        if (Math.hypot(o.tx - s[0], o.ty - s[1]) < 46) { taken = true; break; }
      }
      if (taken) continue;
      actor.tx = s[0];
      actor.ty = s[1];
      return;
    }
    actor.wait = 1 + Math.random() * 3;   // the floor is busy; stay put a beat
  }

  var EMOTES = ['🎉', '💰', '😎', '🔥', '🍀', '👏'];

  function stepActor(a, dt) {
    if (a.seat) return;
    if (a.wait > 0) {
      a.wait -= dt;
      if (a.wait <= 0) pickSpot(a);
      return;
    }
    var dx = a.tx - a.x, dy = a.ty - a.y;
    var dist = Math.hypot(dx, dy);
    if (dist < 2) {
      a.wait = 1.5 + Math.random() * 5;
      return;
    }
    var step = Math.min(dist, a.speed * dt);
    var nx = a.x + (dx / dist) * step;
    var ny = a.y + (dy / dist) * step;
    if (blocked(nx, ny)) {
      // Slide along whichever axis is still clear; if the table has us boxed
      // in, give up on this errand and pick another.
      if (!blocked(nx, a.y)) ny = a.y;
      else if (!blocked(a.x, ny)) nx = a.x;
      else { pickSpot(a); return; }
    }
    a.x = nx;
    a.y = ny;
    a.facing = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'right' : 'left')
      : (dy > 0 ? 'down' : 'up');
  }

  /* ------------------------------------------------------------- rendering */
  function drawTable(t, time) {
    var kit = KIT[t.kind];
    var w = kit.size[0], h = kit.size[1];

    // Chairs tuck in behind the table, as they do in the app.
    for (var i = 0; i < kit.seats.length; i++) {
      var a = kit.seats[i];
      var ox = Math.cos(a) * kit.seatRing[0];
      var oy = Math.sin(a) * kit.seatRing[1];
      var facing = Math.abs(ox) > Math.abs(oy)
        ? (ox > 0 ? 'left' : 'right')
        : (oy > 0 ? 'up' : 'down');
      g.save();
      g.translate(t.x + ox - 15, t.y - oy - 18.5);
      if (kit.seatRing[0] === 0) {
        g.scale(28 / 36, 36 / 46);
        stool();
      } else {
        if (facing === 'left') { g.translate(30, 0); g.scale(-1, 1); }
        g.scale(30 / 36, 37 / 44);
        chair(facing);
      }
      g.restore();
    }

    // The bank: two dressing cabinets flush against the playable one.
    var banks = kit.bank ? [-1, 0, 1] : [0];
    for (var b = 0; b < banks.length; b++) {
      var bx = t.x + banks[b] * (w + 2);
      g.save();
      g.translate(bx - w / 2, t.y - h / 2);
      g.scale(w / kit.box[0], h / kit.box[1]);
      kit.draw();
      g.restore();
      idleFX(t, bx, time, banks[b]);
    }

    // The house staffs its table games.
    if (kit.dealt && atlasReady) {
      var sway = Math.sin(time * 0.9 + t.x) * 1.5;
      drawSprite(dealerRow(t), 'down', t.x, t.y - h / 2 - 12 + sway, 42);
    }

    var drop = kit.seatRing[0] === 0 ? 30 : (t.kind === 'blackjack' ? 42 : 14);
    label(t.name, t.x, t.y + h / 2 + drop, 11.5, 'rgba(255,247,228,0.52)');
  }

  function dealerRow(t) {
    return (t.x + t.y) % Math.max(ATLAS.bros.length, 1);
  }

  /* Idle life, in TableIdleFX's spirit: the wheel turns, reels run, chips hop,
     each on its own phase so the room never pulses in sync. */
  function idleFX(t, cx, time, bankIndex) {
    var kit = KIT[t.kind];
    var w = kit.size[0], h = kit.size[1];
    var phase = (t.x * 0.013 + bankIndex * 0.7);
    g.save();
    g.translate(cx - w / 2, t.y - h / 2);
    g.scale(w / kit.box[0], h / kit.box[1]);

    if (t.kind === 'roulette') {
      // The wheel spins down and the ball runs against it.
      var spin = time * 0.9 + phase;
      g.save();
      g.translate(47, 52);
      g.rotate(spin);
      fillCircle(0, 0, 15, K.ink);
      for (var i = 0; i < 4; i++) {
        var mid = i * Math.PI / 2 + Math.PI / 4, span = Math.PI / 7;
        g.beginPath();
        g.moveTo(0, 0);
        g.arc(0, 0, 15, mid - span / 2, mid + span / 2);
        g.closePath();
        g.fillStyle = K.redBright;
        g.fill();
      }
      fillCircle(0, 0, 5.5, K.gold);
      g.restore();
      var ball = -time * 1.9 + phase;
      fillCircle(47 + Math.cos(ball) * 12.5, 52 + Math.sin(ball) * 12.5, 1.9, K.cream);
    } else if (t.kind === 'slots') {
      // Reels roll in bursts, then land.
      var reels = [17, 27.5, 38], colors = [K.redBright, K.gold, K.teal, K.mint, K.neonPink];
      for (var r = 0; r < 3; r++) {
        var cycle = (time * 1.4 + phase + r * 0.9) % 6;
        var rolling = cycle < 1.6 + r * 0.35;
        var idx = rolling
          ? ((time * 18 + r * 3) | 0) % colors.length
          : ((phase * 7 + r) | 0) % colors.length;
        fillRect(reels[r], 35, 9, 16, 2, K.cream);
        fillCircle(reels[r] + 4.5, 43 + (rolling ? Math.sin(time * 30 + r) * 2 : 0), 3, colors[idx]);
      }
      // The marquee bulbs breathe.
      var pulse = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(time * 2.2 + phase));
      poly([[10, 14], [54, 14], [56, 20], [8, 20]], alpha(K.goldBright, pulse + 0.5));
    } else if (t.kind === 'blackjack') {
      // The shoe deals a card out along the arc and it settles on the felt.
      var deal = (time * 0.55 + phase) % 4;
      for (var s = 0; s < 3; s++) {
        var local = deal - s * 0.32;
        if (local < 0 || local > 1.2) continue;
        var k = Math.min(local / 0.9, 1);
        var ang = Math.PI * (0.30 + s * 0.2);
        var dx = 70 + Math.cos(ang) * 40, dy = 36 + Math.sin(ang) * 26;
        var x = 70 + (dx - 70) * k, y = 34 + (dy - 34) * k;
        g.save();
        g.translate(x, y);
        g.rotate((1 - k) * 0.9);
        fillRect(-3.6, -5, 7.2, 10, 1.4, K.cream);
        g.restore();
      }
    } else if (t.kind === 'poker') {
      // Chips hop into the pot from the seats.
      var pot = (time * 0.5 + phase) % 3.4;
      for (var c = 0; c < 3; c++) {
        var lp = pot - c * 0.26;
        if (lp < 0 || lp > 1) continue;
        var seatAng = [Math.PI * 0.72, Math.PI * 1.28, Math.PI * 1.72][c];
        var sx = 80 + Math.cos(seatAng) * 46, sy = 57 - Math.sin(seatAng) * 22;
        var hop = Math.sin(lp * Math.PI) * 7;
        var chipColors = ['#21803F', '#C93327', '#1F1F1F'];
        fillEllipse(sx + (80 - sx) * lp, sy + (57 - sy) * lp - hop, 4, 2.6, chipColors[c]);
      }
      fillEllipse(80, 57, 8, 4.5, alpha(K.gold, 0.25));
    } else if (t.kind === 'craps') {
      // A fresh throw tumbles across the felt and settles onto the bake.
      var throwT = (time * 0.42 + phase) % 5;
      if (throwT < 1) {
        var k2 = throwT;
        var ease = 1 - Math.pow(1 - k2, 3);
        var fx = 160 + (86 - 160) * ease, fy = 40 + (56 - 40) * ease;
        g.save();
        g.translate(fx, fy);
        g.rotate((1 - ease) * 9);
        fillRect(-6, -6, 12, 12, 3, K.cream);
        fillCircle(0, 0, 1.7, K.ink);
        g.restore();
      }
    } else if (t.kind === 'horseRacing') {
      // The odds board ticks a row.
      var rowIdx = ((time * 0.5 + phase) | 0) % 3;
      var flash = 0.4 + 0.6 * Math.abs(Math.sin(time * 3));
      fillRect(112, 40 + rowIdx * 12 - 3, 18, 7, 2, alpha(K.mint, flash));
    } else if (t.kind === 'videoPoker' || t.kind === 'mines' || t.kind === 'plinko') {
      var blink = 0.25 + 0.4 * (0.5 + 0.5 * Math.sin(time * 2.6 + phase));
      fillRect(20, 60, 24, 9, 4.5, alpha(K.goldBright, blink + 0.4));
      if (t.kind === 'plinko') {
        // A puck drops down the pegs.
        var drop = (time * 0.8 + phase) % 3;
        if (drop < 1.1) {
          var dk = drop / 1.1;
          fillCircle(32 + Math.sin(dk * 9) * 6, 34 + dk * 18, 1.8, K.goldBright);
        }
      }
    }
    g.restore();
  }

  function drawSprite(row, facing, cx, feetY, height) {
    if (!atlasReady) return;
    var col = ATLAS.facings.indexOf(facing);
    if (col < 0) col = 1;
    var cell = ATLAS.cell;
    g.drawImage(atlas, col * cell, row * cell, cell, cell,
                cx - height / 2, feetY - height / 2, height, height);
  }

  function drawActor(a, time) {
    // Identity ring, just outside the sprite's own baked contact shadow.
    strokeEllipse(a.x, a.y + SPRITE_H * 0.43, 13, 4.5, a.color, 2);
    // A gentle bob while walking — the app's own step, felt rather than seen.
    var moving = !a.seat && a.wait <= 0 && Math.hypot(a.tx - a.x, a.ty - a.y) > 2;
    var bob = moving ? Math.abs(Math.sin(time * 7 + a.x * 0.1)) * 1.4 : 0;
    drawSprite(a.row, a.facing, a.x, a.y - bob, SPRITE_H);
    if (a.name) {
      g.save();
      g.shadowColor = 'rgba(0,0,0,0.7)';
      g.shadowBlur = 4;
      label(a.name, a.x, a.y - SPRITE_H * 0.62 - bob, 10, 'rgba(255,247,228,0.92)', 700);
      g.restore();
    }
    if (a.emote) {
      var life = time - a.emote.at;
      if (life > 2.4) { a.emote = null; }
      else {
        var rise = Math.min(life / 0.35, 1);
        var fade = life > 1.9 ? 1 - (life - 1.9) / 0.5 : 1;
        g.save();
        g.globalAlpha = Math.max(0, fade);
        var by = a.y - SPRITE_H * 0.95 - rise * 10 - bob;
        fillRect(a.x - 13, by - 11, 26, 21, 8, 'rgba(7,16,12,0.82)');
        strokeRect(a.x - 13, by - 11, 26, 21, 8, 'rgba(244,196,48,0.35)', 1);
        label(a.emote.glyph, a.x, by, 13, '#FFF7E4');
        g.restore();
      }
    }
  }

  /* ------------------------------------------------------------- the frame */
  var view = { scale: 1, ox: 0, oy: 0 };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!rect.width || !rect.height) return;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    // Cover: fill the panel, crop the overflow, keep the pit centred.
    var scale = Math.max(rect.width / WORLD.w, rect.height / WORLD.h);
    view.scale = scale * dpr;
    view.ox = (canvas.width - WORLD.w * view.scale) / 2;
    view.oy = (canvas.height - WORLD.h * view.scale) / 2;
    bakeCarpet(view.scale);
    render(0);   // repaint at the new size even if the loop is parked
  }

  var lastTime = 0;
  var clock = 0;

  /* `frame` drives the loop; `render` paints one. Keeping them apart matters:
     a resize used to repaint by calling the frame function, which scheduled a
     second requestAnimationFrame and left two loops running over each other. */
  function frame(now) {
    var dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
    lastTime = now;
    render(reduceMotion ? 0 : dt);
    if (!reduceMotion) raf = window.requestAnimationFrame(frame);
  }

  function render(dt) {
    clock += dt;
    var time = clock;

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.save();
    g.translate(view.ox, view.oy);
    g.scale(view.scale, view.scale);

    // Carpet, edge to edge (the pattern is baked in device pixels, so it is
    // laid down in that space and the world transform re-applied over it).
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (carpetPattern) {
      g.fillStyle = carpetPattern;
      g.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      g.fillStyle = K.carpet;
      g.fillRect(0, 0, canvas.width, canvas.height);
    }
    g.restore();

    // The house lights.
    for (var i = 0; i < LIGHTS.length; i++) {
      var L = LIGHTS[i];
      var flicker = 1 + Math.sin(time * 0.7 + i) * 0.04;
      var grad = g.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r * flicker);
      grad.addColorStop(0, 'rgba(255, 218, 140, 0.10)');
      grad.addColorStop(1, 'rgba(255, 218, 140, 0)');
      g.fillStyle = grad;
      g.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
    }

    // Everything that stands on the floor, painted back to front.
    var items = [];
    for (i = 0; i < TABLES.length; i++) items.push({ y: TABLES[i].y, t: TABLES[i], kind: 'table' });
    for (i = 0; i < PLANTS.length; i++) items.push({ y: PLANTS[i].y, p: PLANTS[i], kind: 'plant' });
    for (i = 0; i < ROPES.length; i++) items.push({ y: ROPES[i].y, r: ROPES[i], kind: 'rope' });
    for (i = 0; i < actors.length; i++) {
      stepActor(actors[i], dt);
      if (!reduceMotion && actors[i].emoteAt <= time && !actors[i].emote) {
        actors[i].emote = { glyph: EMOTES[(Math.random() * EMOTES.length) | 0], at: time };
        actors[i].emoteAt = time + 9 + Math.random() * 16;
      }
      items.push({ y: actors[i].y, a: actors[i], kind: 'actor' });
    }
    items.sort(function (m, n) { return m.y - n.y; });

    for (i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.kind === 'table') drawTable(it.t, time);
      else if (it.kind === 'actor') drawActor(it.a, time);
      else if (it.kind === 'rope') {
        g.save();
        g.translate(it.r.x, it.r.y - 22);
        ropeRun(it.r.w, 44);
        g.restore();
      } else {
        g.save();
        g.translate(it.p.x - 20, it.p.y - 26);
        g.scale(40 / 44, 53 / 58);
        plant();
        g.restore();
      }
    }

    g.restore();
  }

  var raf = null;
  function start() {
    if (raf) window.cancelAnimationFrame(raf);
    lastTime = 0;
    raf = window.requestAnimationFrame(frame);
  }

  /* Nothing runs while the floor is off-screen or the tab is hidden — the same
     reason the app pauses a table's idle FX when it walks off camera. */
  function setRunning(on) {
    if (on && !raf && !reduceMotion) start();
    else if (!on && raf) { window.cancelAnimationFrame(raf); raf = null; lastTime = 0; }
  }

  atlas.onload = function () {
    atlasReady = true;
    makeActors();
    resize();
    if (reduceMotion) render(0); else start();
  };

  fetch('sprites/bros-atlas.json')
    .then(function (r) { return r.json(); })
    .then(function (m) {
      ATLAS.cell = parseInt(m.cell, 10) || 128;
      ATLAS.facings = m.facings.split(',');
      ATLAS.bros = m.bros.split(',');
      ATLAS.names = m.names.split(',');
    })
    .catch(function () {
      // The manifest is a convenience, not a dependency: the atlas is baked in
      // roster order and these ids are permanent wire values, so a failed fetch
      // costs nothing but the names being a re-bake behind.
      ATLAS.names = ['Ace', 'The King', 'Granny Lucky', 'Big Slick', 'Tex', 'Ruby',
                     'Bruno', 'Vinnie', 'Chad', 'Mystic Marla', 'Peaches', 'Dice'];
      ATLAS.bros = ATLAS.names;
    })
    .then(function () { atlas.src = 'sprites/bros-atlas.png'; });

  window.addEventListener('resize', function () {
    clearTimeout(resize._t);
    resize._t = setTimeout(resize, 120);
  });
  document.addEventListener('visibilitychange', function () {
    setRunning(!document.hidden);
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      setRunning(entries[0].isIntersecting && !document.hidden);
    }, { threshold: 0 }).observe(canvas);
  }
})();
