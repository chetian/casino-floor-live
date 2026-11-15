/* Casino Floor Live! — the hero: one table on every screen.
 *
 * Four takes of one moment, played as one (crossplay/, take xpa5): an iPhone,
 * an iPad and an Android phone, with the headset under them. The iPad leads,
 * the others follow it, and all go back to the top together when it ends. The
 * three are the first screen, so they load at once; the headset loads as it
 * comes near and joins the round where it is. Nothing plays out of view.
 * Under reduced motion or Save-Data each screen holds its payoff as a still,
 * and nothing moves on its own.
 *
 * Brass wires run from each screen to the sign, drawn from where the screens
 * actually landed, with two chips riding every wire, one each way.
 *
 * Behind it all stands the floor's grid (the studio's, chetianholdings.com).
 * A few of its squares at a time come on as little screens on the floor
 * (tiles.mp4: 24 corners of the floor in one video), and now and then three
 * in a row come on as a player walking in — their character, their name, what
 * they're playing on — who then flips to where they went. Never under the
 * words, the stores or the screens; only in view.
 */
(function () {
  'use strict';

  var hero = document.querySelector('.xp-hero');
  var xp = hero && hero.querySelector('.xp');
  if (!xp) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var saveData = !!(conn && conn.saveData);
  var stills = reduceMotion || saveData;

  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function watch(el, fn, threshold, margin) {
    if (!('IntersectionObserver' in window)) { fn(true); return; }
    new IntersectionObserver(function (entries) {
      fn(entries[0].isIntersecting);
    }, { threshold: threshold || 0, rootMargin: margin || '0px' }).observe(el);
  }

  // The grid waits for the round to be on the glass: the first moments'
  // bandwidth goes to the screens.
  var whenRound = [];
  var roundOn = false;
  function roundStarted() {
    if (roundOn) return;
    roundOn = true;
    while (whenRound.length) whenRound.shift()();
  }

  /* ---------- the screens ----------
     Each screen is a still with its video running underneath. iOS won't
     buffer a video until it's told to play, so playing is what loads them;
     once the three can run, they go back to the top as one and the stills
     fade off. If autoplay is refused (Low Power Mode) the stills just stand. */
  (function screens() {
    var all = $$('.xp-dev', xp).map(function (fig) {
      var v = fig.querySelector('video');
      return {
        fig: fig,
        v: v,
        clip: v.getAttribute('data-clip'),
        still: fig.querySelector('.xp-still'),
        extra: fig.classList.contains('xp-vision'),
        wired: false
      };
    });
    var main = all.filter(function (s) { return !s.extra; });
    var lead = xp.querySelector('.xp-pad video');
    var on = false, started = false;

    // Save-Data with motion allowed: the payoff, not the first frame.
    if (saveData && !reduceMotion) all.forEach(function (s) { if (s.still) s.still.src = s.clip + '-payoff.webp'; });
    if (stills) return;

    function wire(s) {
      if (s.wired) return;
      s.wired = true;
      s.v.preload = 'auto';
      s.v.src = s.clip + '.mp4';
    }
    function play(v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* autoplay refused: the stills stand */ });
    }
    function seek(v, t) { try { v.currentTime = t; } catch (e) {} }
    function fromTop() {
      if (!on) return;
      all.forEach(function (s) {
        if (!s.wired) return;
        seek(s.v, 0);
        play(s.v);
      });
    }
    // Before the first round: the three have to be able to run. (Not at a
    // loop, where a clip that has finished has no "next frame" to report.)
    function tryStart() {
      if (started || !on) return;
      if (!main.every(function (s) { return s.v.readyState >= 3; })) return;
      started = true;
      fromTop();
    }
    function update() {
      if (!on) { all.forEach(function (s) { s.v.pause(); }); return; }
      if (started && lead.ended) { fromTop(); return; }
      all.forEach(function (s) { if (s.wired) play(s.v); });
      tryStart();
    }

    main.forEach(wire);
    all.forEach(function (s) {
      s.v.addEventListener('canplay', tryStart);
      s.v.addEventListener('playing', tryStart);
      if (!s.extra) return;
      // The headset loads as it comes near, and joins the round where it is
      // (the lead's clock puts it in step).
      watch(s.fig, function (near) { if (near) { wire(s); update(); } }, 0, '400px 0px');
      s.v.addEventListener('canplay', function () { if (started && on) play(s.v); });
    });
    lead.addEventListener('ended', fromTop);
    lead.addEventListener('timeupdate', function () {
      if (!started) return;
      var t = lead.currentTime;
      // The first round is on the glass: the stills can go.
      if (t > 0 && t < 1 && !roundOn) {
        main.forEach(function (s) { s.fig.classList.add('is-live'); });
        roundStarted();
      }
      // Keep in step: a screen that has drifted a few frames off is put back.
      all.forEach(function (s) {
        var v = s.v;
        if (v === lead || !s.wired || v.ended || v.seeking || v.readyState < 2) return;
        var off = Math.abs(v.currentTime - t);
        if (off > 0.12) { if (t < lead.duration - 0.4) seek(v, t + 0.05); }
        else if (!v.paused) s.fig.classList.add('is-live');
      });
    });
    var inView = false;
    function changed() {
      on = inView && !document.hidden;
      update();
    }
    watch(xp, function (v) { inView = v; changed(); }, 0.1);
    document.addEventListener('visibilitychange', changed);
  })();

  /* ---------- the wires ---------- */
  (function wires() {
    var svg = xp.querySelector('.xp-wires');
    var sign = xp.querySelector('.xp-sign');
    var NS = 'http://www.w3.org/2000/svg';
    var SPEED = 0.14;          // px a millisecond
    var CHIPS = ['#21803f', '#c93327', '#6b4fc0', '#1f1f1f'];
    var lines = [], chips = [];

    $$('.xp-dev', xp).forEach(function (dev, i) {
      var path = document.createElementNS(NS, 'path');
      svg.appendChild(path);
      var line = { dev: dev, glass: dev.querySelector('.xp-glass'), path: path, len: 0 };
      lines.push(line);
      for (var back = 0; back < 2; back++) {
        var dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('r', '4.5');
        dot.setAttribute('fill', CHIPS[(i * 2 + back) % CHIPS.length]);
        dot.setAttribute('opacity', '0');
        svg.appendChild(dot);
        chips.push({ line: line, el: dot, back: !!back, phase: (i * 0.37 + back * 0.5) % 1 });
      }
    });

    function draw() {
      var b = xp.getBoundingClientRect();
      if (!b.width) return;
      svg.setAttribute('viewBox', '0 0 ' + b.width.toFixed(1) + ' ' + b.height.toFixed(1));
      var n = sign.getBoundingClientRect();
      var nx = n.left + n.width / 2 - b.left;
      var ny = n.top + n.height / 2 - b.top;
      lines.forEach(function (w) {
        var s = w.glass.getBoundingClientRect();
        var f = w.dev.getBoundingClientRect();
        var x = s.left + s.width / 2 - b.left;
        var above = s.top + s.height / 2 - b.top < ny;
        // a gap off the bezel above the sign; over the name below it
        var y = above ? s.bottom - b.top + 16 : f.top - b.top - 10;
        var d;
        if (x > n.left - b.left + 10 && x < n.right - b.left - 10) {
          // square over the sign: straight in at its edge
          d = 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'V' + (above ? n.top - b.top : n.bottom - b.top).toFixed(1);
        } else {
          d = 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'V' + ny.toFixed(1) + 'H' + (x < nx ? n.left - b.left : n.right - b.left).toFixed(1);
        }
        w.path.setAttribute('d', d);
        w.len = w.path.getTotalLength();
      });
    }

    var running = false, raf = 0;
    function tick(now) {
      chips.forEach(function (p) {
        var w = p.line;
        if (!w.len) return;
        var period = Math.max(1200, w.len / SPEED);
        var k = (now / period + p.phase) % 1;
        var pt = w.path.getPointAtLength((p.back ? 1 - k : k) * w.len);
        p.el.setAttribute('cx', pt.x.toFixed(1));
        p.el.setAttribute('cy', pt.y.toFixed(1));
        // in off one end, out into the other
        p.el.setAttribute('opacity', Math.min(1, k * 8, (1 - k) * 8).toFixed(2));
      });
      if (running) raf = window.requestAnimationFrame(tick);
    }

    draw();
    if (window.ResizeObserver) new ResizeObserver(draw).observe(xp);
    else window.addEventListener('resize', draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    if (reduceMotion) return;
    watch(xp, function (v) {
      if (v === running) return;
      running = v;
      if (v) { draw(); raf = window.requestAnimationFrame(tick); }
      else window.cancelAnimationFrame(raf);
    });
  })();

  /* ---------- the grid ----------
     A square comes on the way the TV does — a green line across it, opening
     to the picture — holds a few seconds, now and then flips channel through
     snow, and goes off to a line. One video plays, drawn into whichever
     squares are lit. A player walking in is three squares in a row: their
     character and what they're playing on, then a flip to where they went. */
  (function grid() {
    var box = hero.querySelector('.xp-grid');
    if (!box || stills || !window.requestAnimationFrame) return;
    var PITCH = 56;            // the grid's (.xp-grid::before): a line at each square's top and left
    var GLASS = 55;            // a square, inside its lines
    var RUN = 3;               // a player walking in: three squares in a row
    var COLS = 6;              // tiles.mp4: 6 × 4 cells of 112, each drawn from its middle 110
    var CELL = 112;
    var CLIPS = 24;
    var MAX = 18;
    var DENSITY = 0.14;        // of the open squares in view, the share lit at once
    var BASE = 0.95;           // a lit square's strength where the grid is strongest
    var ON = 260;              // ms to come on; to go off
    var OFF = 220;
    var FLIP = 110;            // ms of snow
    var FONT = '"Avenir Next", "Avenir", "Nunito Sans", system-ui, sans-serif';
    var header = document.querySelector('.site-header');
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var px = Math.round(GLASS * dpr);
    var runW = RUN * PITCH - 1;
    var runPx = Math.round(runW * dpr);

    // Where each of tiles.mp4's 24 screens is (tools/tiles-cut.sh, in order):
    // what a player who flips to it is doing.
    var PLACES = [
      'AT THE SLOTS', 'IN THE LOUNGE', 'AT BACCARAT', 'AT PLINKO', 'AT THE PUSHERS', 'IN THE LOUNGE',
      'AT THE TABLES', 'AT MINES', 'IN THE LOUNGE', 'ON THE FLOOR', 'AT VIDEO POKER', 'IN THE LOUNGE',
      'AT LEFTY’S CART', 'AT THE BAR', 'IN THE LOUNGE', 'AT BACCARAT', 'IN THE LOUNGE', 'AT LEFTY’S CART',
      'AT THE DOOR', 'AT THE PUSHERS', 'AT THE SLOTS', 'AT THE TABLES', 'IN THE LOUNGE', 'AT PLINKO'
    ];
    // The players: first names, and what they're on, phones most of all.
    var NAMES = ['Maya', 'Sam', 'Jules', 'Alex', 'Priya', 'Leo', 'Kenji', 'Ava', 'Zoe', 'Omar', 'Nina',
                 'Theo', 'Luis', 'Hana', 'Dev', 'Rosa', 'Eli', 'Ines', 'Kofi', 'Mia', 'Raj', 'Tess', 'Yuki',
                 'Noah', 'Lena', 'Diego', 'Amara', 'Iris', 'Malik', 'Sofia', 'Ben', 'Chloe', 'Ravi', 'Elena',
                 'Owen', 'Grace', 'Mateo', 'Lily', 'Aisha', 'Tomas'];
    var DEVICES = [['IPHONE', 34], ['ANDROID', 34], ['IPAD', 18], ['VISION PRO', 14]];
    // DesignTokens.Palette.playerColors: the ring under each player.
    var RINGS = ['#4CA6FF', '#FF8C33', '#A673FF', '#40E6BF', '#FF6699', '#F2E559', '#8CD94D', '#E6E6F2', '#F25151', '#4CD9F2'];
    // The cast who walk in: the page's own cast wall, so a held drop never does.
    var CAST = $$('.cast-card[data-id]').map(function (b) { return b.getAttribute('data-id'); });

    // One video for every square. It stays in the viewport (a pixel, held
    // fixed): Safari pauses a muted video it decides nobody can see.
    var video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('disableremoteplayback', '');
    box.appendChild(video);

    // The set's scanlines; its snow, coarser, for a flip.
    function scanlines(w) {
      var c = document.createElement('canvas');
      c.width = w;
      c.height = px;
      var g = c.getContext('2d');
      g.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (var y = 0; y < px; y += dpr * 3) g.fillRect(0, Math.round(y), w, Math.max(1, Math.round(dpr)));
      return c;
    }
    var scan = scanlines(px);
    var scanRun = scanlines(runPx);
    var snow = [];
    for (var f = 0; f < 3; f++) {
      var sc = document.createElement('canvas');
      sc.width = 54;
      sc.height = 18;
      var sg = sc.getContext('2d');
      var img = sg.createImageData(54, 18);
      for (var i = 0; i < 54 * 18; i++) {
        var v = 20 + ((Math.random() * 216) | 0);
        img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
        img.data[i * 4 + 3] = 255;
      }
      sg.putImageData(img, 0, 0);
      snow.push(sc);
    }

    /* The open squares: where the grid shows (its mask, worked out the same
       way), clear of the words, the stores and the screens. */
    var squares = [];
    var byKey = {};
    var W = 0;
    var H = 0;
    function strength(x, y) {
      // radial-gradient(140% 95% at 50% 0%): 1, 0.55 at 45%, gone at 85%
      var dx = (x - W / 2) / (1.4 * W);
      var dy = y / (0.95 * H);
      var d = Math.sqrt(dx * dx + dy * dy);
      return d <= 0.45 ? 1 - 0.45 * d / 0.45 : Math.max(0, 0.55 * (0.85 - d) / 0.4);
    }
    function layout() {
      var b = box.getBoundingClientRect();
      W = b.width;
      H = b.height;
      var keep = [];
      function out(r, pad) {
        if (r.width || r.height) keep.push([r.left - b.left - pad, r.top - b.top - pad, r.right - b.left + pad, r.bottom - b.top + pad]);
      }
      $$('.wordmark, .xp-line, .tagline, .xp-note', hero).forEach(function (el) {
        var range = document.createRange();
        range.selectNodeContents(el);
        Array.prototype.forEach.call(range.getClientRects(), function (r) { out(r, 16); });
      });
      $$('.crown-mark, .store', hero).forEach(function (el) { out(el.getBoundingClientRect(), 22); });
      out(xp.getBoundingClientRect(), 24);
      var x0 = ((W - PITCH) / 2) % PITCH;      // a line: background-position center
      if (x0 < 0) x0 += PITCH;
      squares = [];
      byKey = {};
      for (var y = 0, r = 0; y + GLASS <= H; y += PITCH, r++) {
        for (var x = (x0 + 1) % PITCH, c = 0; x + GLASS <= W; x += PITCH, c++) {
          var a = strength(x + GLASS / 2, y + GLASS / 2);
          if (a < 0.2) continue;
          var clear = keep.every(function (k) { return x + GLASS <= k[0] || x >= k[2] || y + GLASS <= k[1] || y >= k[3]; });
          if (!clear) continue;
          var s = { x: x, y: y, c: c, r: r, a: a, key: c + ',' + r, at: -1e9 };
          squares.push(s);
          byKey[s.key] = s;
        }
      }
    }
    function inView() {
      var b = box.getBoundingClientRect();
      var top = (header ? header.getBoundingClientRect().bottom : 0) - b.top;
      var bottom = window.innerHeight - b.top;
      // whole on the screen, under the bar's glass
      return squares.filter(function (s) { return s.y >= top && s.y + GLASS <= bottom; });
    }

    var lit = [];
    var pools = { tile: [], join: [] };
    // Not one that's lit, just went off, or sits beside a lit one; the
    // strong squares more often than the faint.
    function free(s, now) {
      return now - s.at > 2500 && lit.every(function (t) {
        return t.sqs.every(function (q) { return Math.abs(q.x - s.x) + Math.abs(q.y - s.y) > PITCH * 1.5; });
      });
    }
    function weighted(list, weight) {
      var sum = 0;
      list.forEach(function (s) { sum += weight(s); });
      var r = Math.random() * sum;
      for (var i = 0; i < list.length; i++) if ((r -= weight(list[i])) <= 0) return list[i];
      return list[list.length - 1] || null;
    }
    function chooseOne(view, now) {
      return weighted(view.filter(function (s) { return free(s, now); }), function (s) { return s.a; });
    }
    function runFrom(s, seen) {
      var run = [s];
      for (var k = 1; k < RUN; k++) {
        var n = byKey[(s.c + k) + ',' + s.r];
        if (!n || !seen[n.key]) return null;
        run.push(n);
      }
      return run;
    }
    function chooseRun(view, now) {
      var seen = {};
      view.forEach(function (s) { seen[s.key] = true; });
      var runs = [];
      view.forEach(function (s) {
        var run = runFrom(s, seen);
        if (run && run.every(function (q) { return free(q, now); })) runs.push(run);
      });
      return weighted(runs, function (run) { return Math.min(run[0].a, run[RUN - 1].a); });
    }
    function clipFor() {
      var c;
      do c = (Math.random() * CLIPS) | 0;
      while (lit.some(function (t) { return t.clip === c; }));
      return c;
    }
    function canvasFor(kind) {
      var t = pools[kind].pop();
      if (t) return t;
      var el = document.createElement('canvas');
      el.width = kind === 'join' ? runPx : px;
      el.height = px;
      el.style.width = (kind === 'join' ? runW : GLASS) + 'px';
      el.style.height = GLASS + 'px';
      box.appendChild(el);
      return { kind: kind, el: el, g: el.getContext('2d') };
    }
    function place(t, sqs, now) {
      t.sqs = sqs;
      t.born = now;
      sqs.forEach(function (s) { s.at = now; });
      t.el.style.left = sqs[0].x + 'px';
      t.el.style.top = sqs[0].y + 'px';
      t.el.style.opacity = glow(Math.min.apply(null, sqs.map(function (s) { return s.a; })));
      t.el.style.display = 'block';
      lit.push(t);
    }
    function light(s, now) {
      var t = canvasFor('tile');
      t.clip = clipFor();
      t.dies = now + ON + 2400 + Math.random() * 4000;
      t.flip = Math.random() < 0.3 ? now + ON + 900 + Math.random() * 1500 : 0;
      place(t, [s], now);
    }
    function release(t) {
      t.el.style.display = 'none';
      var now = performance.now();
      t.sqs.forEach(function (s) { s.at = now; });
      lit.splice(lit.indexOf(t), 1);
      pools[t.kind].push(t);
    }
    // Fainter where the grid is, but never as faint: a screen is lit.
    function glow(a) { return (BASE * (0.35 + 0.65 * a)).toFixed(3); }
    function easeOut(k) { return 1 - Math.pow(1 - k, 3); }

    /* ---- the players ----
       A few sprites are kept loaded ahead; a player walks in only on one
       that's ready, and nobody is on the grid twice at once. */
    var ready = [];
    var loading = 0;
    var lastCast = [];
    function fetchSprite() {
      if (!CAST.length) return;
      var id;
      var tries = 0;
      do id = CAST[(Math.random() * CAST.length) | 0];
      while (lastCast.indexOf(id) >= 0 && ++tries < 12);
      lastCast.push(id);
      if (lastCast.length > 16) lastCast.shift();
      var im = new Image();
      loading++;
      im.onload = function () { loading--; ready.push(im); };
      im.onerror = function () { loading--; };
      im.src = 'sprites/cast/' + id + '.webp';
    }
    function stock() { while (ready.length + loading < 4) fetchSprite(); }
    function pickDevice() {
      var r = Math.random() * 100;
      for (var i = 0; i < DEVICES.length; i++) if ((r -= DEVICES[i][1]) <= 0) return DEVICES[i][0];
      return DEVICES[0][0];
    }
    function pickName() {
      var on = lit.map(function (t) { return t.name; });
      var n;
      do n = NAMES[(Math.random() * NAMES.length) | 0];
      while (on.indexOf(n) >= 0);
      return n;
    }
    function fit(g, text, weight, size, max) {
      g.font = weight + ' ' + size + 'px ' + FONT;
      while (g.measureText(text).width > max && size > 7) {
        size -= 0.5;
        g.font = weight + ' ' + size + 'px ' + FONT;
      }
      return size;
    }
    // A card, drawn once: the felt, the left square (the character, or left
    // clear for the picture), the two lines of words.
    function card(t, line1, dim, line2, sprite) {
      var c = document.createElement('canvas');
      c.width = runPx;
      c.height = px;
      var g = c.getContext('2d');
      g.scale(dpr, dpr);
      var grad = g.createLinearGradient(0, 0, 0, GLASS);
      grad.addColorStop(0, '#17422b');
      grad.addColorStop(1, '#0c2317');
      g.fillStyle = grad;
      g.fillRect(0, 0, runW, GLASS);
      g.strokeStyle = 'rgba(227, 175, 37, 0.45)';
      g.lineWidth = 1;
      g.strokeRect(0.5, 0.5, runW - 1, GLASS - 1);
      if (sprite) {
        var cx = GLASS / 2, cy = GLASS / 2, R = 20;
        g.save();
        g.beginPath();
        g.arc(cx, cy, R, 0, Math.PI * 2);
        g.fillStyle = '#081c14';
        g.fill();
        g.clip();
        // a cast sprite is 192 square, the head round (96, 62) and 100 across
        var S = 74;
        g.drawImage(sprite, cx - S / 2, cy - S * 62 / 192 + 2, S, S);
        g.restore();
        g.beginPath();
        g.arc(cx, cy, R, 0, Math.PI * 2);
        g.lineWidth = 2;
        g.strokeStyle = t.ring;
        g.stroke();
      }
      var x = GLASS + 6, max = runW - x - 6;
      g.textBaseline = 'alphabetic';
      var size = fit(g, line1 + dim, 800, 13.5, max);
      g.fillStyle = '#fff7e4';
      g.fillText(line1, x, 24);
      if (dim) {
        var w1 = g.measureText(line1).width;
        g.font = '600 ' + size + 'px ' + FONT;
        g.fillStyle = 'rgba(255, 247, 228, 0.66)';
        g.fillText(dim, x + w1, 24);
      }
      if ('letterSpacing' in g) g.letterSpacing = '0.7px';
      fit(g, line2, 800, 9, max - 9);
      g.fillStyle = '#f7c948';
      g.fillText(line2, x + 9, 40.5);
      if ('letterSpacing' in g) g.letterSpacing = '0px';
      g.beginPath();
      g.arc(x + 3, 37.3, 2.8, 0, Math.PI * 2);
      g.fillStyle = '#4ade80';
      g.fill();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(scanRun, 0, 0);
      return c;
    }
    function walkIn(run, now) {
      var sprite = ready.shift();
      stock();
      if (!sprite) return;
      var t = canvasFor('join');
      t.name = pickName();
      t.ring = RINGS[(Math.random() * RINGS.length) | 0];
      t.clip = clipFor();
      t.face = card(t, t.name, ' joined', 'ON ' + pickDevice(), sprite);
      t.then = card(t, t.name, '', PLACES[t.clip], null);
      t.flip = now + ON + 1700 + Math.random() * 700;
      t.dies = t.flip + FLIP + 2200 + Math.random() * 1600;
      t.steady = false;
      place(t, run, now);
    }

    function lineOver(g, k, w, h) {
      // coming on (k 0 → 1) or going off (1 → 0): the line crosses, then opens
      var mid = h / 2;
      var unit = dpr;
      var lw = w;
      var lineAlpha = 1;
      if (k < 0.45) {
        g.clearRect(0, 0, w, h);
        lw = w * easeOut(k / 0.45);
      } else {
        var o = easeOut((k - 0.45) / 0.55);
        var oh = h * o;
        g.clearRect(0, 0, w, mid - oh / 2);
        g.clearRect(0, mid + oh / 2, w, h);
        lineAlpha = 1 - o;
      }
      var x = (w - lw) / 2;
      g.fillStyle = 'rgba(61, 255, 154, ' + (lineAlpha * 0.3).toFixed(3) + ')';
      g.fillRect(x, mid - 3 * unit, lw, 6 * unit);
      g.fillStyle = 'rgba(61, 255, 154, ' + lineAlpha.toFixed(3) + ')';
      g.fillRect(x, mid - unit, lw, 2 * unit);
    }
    function picture(g, clip, x) {
      g.imageSmoothingEnabled = true;
      g.drawImage(video, (clip % COLS) * CELL + 1, ((clip / COLS) | 0) * CELL + 1, CELL - 2, CELL - 2, x, 0, px, px);
    }
    function drawTile(t, now) {
      var g = t.g;
      if (t.flip && now >= t.flip + FLIP) {
        t.clip = clipFor();
        t.flip = 0;
      }
      if (t.flip && now >= t.flip) {
        g.imageSmoothingEnabled = false;
        g.drawImage(snow[((now / 40) | 0) % 3], 0, 0, 18, 18, 0, 0, px, px);
      } else {
        picture(g, t.clip, 0);
      }
      g.drawImage(scan, 0, 0);
      var k = Math.min(1, (now - t.born) / ON, (t.dies + OFF - now) / OFF);
      if (k < 1) lineOver(g, k, px, px);
    }
    function drawJoin(t, now) {
      var g = t.g;
      var k = Math.min(1, (now - t.born) / ON, (t.dies + OFF - now) / OFF);
      if (now < t.flip) {
        // the player walking in: a still card, drawn again only while the line runs
        if (k >= 1 && t.steady) return;
        g.clearRect(0, 0, runPx, px);
        g.drawImage(t.face, 0, 0);
        t.steady = k >= 1;
      } else if (now < t.flip + FLIP) {
        g.imageSmoothingEnabled = false;
        g.drawImage(snow[((now / 40) | 0) % 3], 0, 0, 54, 18, 0, 0, runPx, px);
        g.drawImage(scanRun, 0, 0);
        t.steady = false;
      } else {
        // where they went: the picture in the first square, the words beside it
        g.drawImage(t.then, 0, 0);
        picture(g, t.clip, 0);
        g.drawImage(scan, 0, 0);
      }
      if (k < 1) lineOver(g, k, runPx, px);
    }

    var running = false;
    var raf = 0;
    var nextAt = 0;
    var nextJoin = 0;
    var booting = true;        // coming into view: the squares come on in a run
    function frame(now) {
      raf = 0;
      if (!running) return;
      var playing = !video.paused && video.readyState >= 2;
      if (now >= nextAt && playing) {
        var view = inView();
        var tiles = lit.filter(function (t) { return t.kind === 'tile'; }).length;
        // a phone's few open squares still get a few
        if (tiles < Math.min(MAX, Math.max(Math.min(3, view.length), Math.round(view.length * DENSITY)))) {
          var s = chooseOne(view, now);
          if (s) light(s, now);
        } else {
          booting = false;
        }
        nextAt = now + (booting ? 70 + Math.random() * 80 : 120 + Math.random() * 380);
      }
      if (now >= nextJoin && playing) {
        var open = inView();
        var joins = lit.filter(function (t) { return t.kind === 'join'; }).length;
        if (joins < (open.length > 70 ? 3 : open.length > 30 ? 2 : 1)) {
          var run = chooseRun(open, now);
          if (run) walkIn(run, now);
        }
        nextJoin = now + 900 + Math.random() * 1500;
      }
      for (var i = lit.length - 1; i >= 0; i--) {
        var t = lit[i];
        if (now > t.dies + OFF) release(t);
        else if (t.kind === 'join') drawJoin(t, now);
        else drawTile(t, now);
      }
      raf = window.requestAnimationFrame(frame);
    }

    var canRun = false;
    var visible = false;
    function setRunning() {
      var on = canRun && visible && !document.hidden;
      if (on === running) return;
      running = on;
      if (on) {
        layout();
        booting = true;
        nextAt = 0;
        nextJoin = performance.now() + 700;
        var p = video.play();
        // Autoplay refused (a phone in Low Power Mode): the grid stays still.
        // (A pause that cut in — scrolled straight past — is no refusal.)
        if (p && p.catch) p.catch(function (e) {
          if (e && e.name === 'AbortError') return;
          canRun = false;
          setRunning();
        });
        if (!raf) raf = window.requestAnimationFrame(frame);
      } else {
        video.pause();
        while (lit.length) release(lit[0]);
        if (raf) window.cancelAnimationFrame(raf);
        raf = 0;
      }
    }
    // A resize (or the fonts landing) moves the squares; a lit one that's no
    // longer open goes dark at once.
    function relayout() {
      if (!running) return;
      layout();
      lit.slice().forEach(function (t) {
        var now = t.sqs.map(function (s) { return byKey[s.key]; });
        var same = now.every(function (s, i) { return s && s.x === t.sqs[i].x && s.y === t.sqs[i].y; });
        if (!same) { release(t); return; }
        now.forEach(function (s, i) { s.at = t.sqs[i].at; });
        t.sqs = now;
      });
    }
    if (window.ResizeObserver) new ResizeObserver(relayout).observe(box);
    else window.addEventListener('resize', relayout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

    // The screens' first round gets the bandwidth; the grid loads once it's
    // moving (or a moment on).
    function load() {
      if (video.getAttribute('src')) return;
      stock();
      video.src = 'crossplay/tiles.mp4?v=20261115';
      video.load();
    }
    whenRound.push(function () { setTimeout(load, 1200); });
    setTimeout(load, 4000);
    video.addEventListener('canplay', function () {
      canRun = true;
      setRunning();
    });
    watch(box, function (on) {
      visible = on;
      setRunning();
    });
    document.addEventListener('visibilitychange', setRunning);
  })();
})();
