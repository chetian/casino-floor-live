/* Casino Floor Live! — the cast wall.
 *
 * One character at a time on the spotlight's felt disc. They turn on
 * arrival — all eight facings, the lap the app draws them in — then settle
 * front on, breathing; a legendary runs its own loop (the staff's motes, the
 * tentacles, the skates' lights) and its follower floats at the shoulder,
 * both baked straight out of the app (sprites/cast, tools/cast_wall.py).
 * Drag the figure, or use the arrows, to turn them yourself.
 *
 * Also deals the hero's huddle (five of the cast on the GET IT FREE card, a
 * fresh five every visit, as the app's PLAY ONLINE card does), and runs the
 * phone frames' clips while they're on screen.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cards = Array.prototype.slice.call(document.querySelectorAll('.cast-card'));

  /* ------------------------------------------------------------ the huddle */
  var huddle = document.querySelectorAll('.huddle i');
  if (huddle.length && cards.length) {
    var pool = cards.map(function (c) { return c.getAttribute('data-id'); });
    for (var h = 0; h < huddle.length; h++) {
      var pick = pool.splice((Math.random() * pool.length) | 0, 1)[0];
      huddle[h].style.backgroundImage = 'url(sprites/cast/' + pick + '.webp)';
    }
  }

  var spotlight = document.querySelector('.spotlight');
  if (!spotlight || !cards.length) return;
  var stage = spotlight.querySelector('.spot-stage');
  var plinth = spotlight.querySelector('.plinth');
  var figure = spotlight.querySelector('.figure');
  var body = figure.querySelector('.body');
  var pet = figure.querySelector('.pet');
  var nameEl = spotlight.querySelector('.spot-name');
  var rarityEl = spotlight.querySelector('.pill.rarity');
  var setEl = spotlight.querySelector('.pill.set');
  var taglineEl = spotlight.querySelector('.spot-tagline');
  var doorEl = spotlight.querySelector('.spot-door');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.cast-tab'));

  var FACINGS = 8;                // Facing.turnaround: one lap
  var current = null;
  var facing = 0;
  var fx = null;                  // { frames, ms } for a legendary's own loop
  var petSpec = null;             // { frames, ms, scale }
  var fxFrame = 0, petFrame = 0;
  var fxTimer = null, petTimer = null, turnTimer = null, settleTimer = null;
  var breath = null;

  function strip(id, kind) { return 'url(sprites/cast/' + id + '-' + kind + '.webp)'; }

  /* The figure: the turnaround strip while turning (FX at rest baked into
     every facing), the legendary's whole-frame loop when front on. */
  function showFacing(i) {
    facing = ((i % FACINGS) + FACINGS) % FACINGS;
    stopFX();
    body.style.backgroundImage = strip(current.id, 'turn');
    body.style.backgroundSize = (FACINGS * 100) + '% 100%';
    body.style.backgroundPosition = (facing / (FACINGS - 1) * 100) + '% 0';
  }

  function stopFX() {
    clearInterval(fxTimer);
    fxTimer = null;
  }

  function startFX() {
    stopFX();
    if (!fx || reduceMotion) return;
    body.style.backgroundImage = strip(current.id, 'fx');
    body.style.backgroundSize = (fx.frames * 100) + '% 100%';
    fxFrame = 0;
    var paint = function () {
      body.style.backgroundPosition = (fx.frames > 1 ? fxFrame / (fx.frames - 1) * 100 : 0) + '% 0';
      fxFrame = (fxFrame + 1) % fx.frames;
    };
    paint();
    fxTimer = setInterval(paint, fx.ms);
  }

  function startPet() {
    clearInterval(petTimer);
    petTimer = null;
    if (!petSpec) {
      pet.style.display = 'none';
      return;
    }
    // At the shoulder, at the app's own scale: the companion's centre sits at
    // (0.86, 0.16) of the figure's box (CompanionArt's anchor, y down here).
    var box = figure.clientWidth || 256;
    var side = Math.round(box * petSpec.scale / 100);
    pet.style.display = 'block';
    pet.style.width = side + 'px';
    pet.style.height = side + 'px';
    pet.style.left = Math.round(box * 0.86 - side / 2) + 'px';
    pet.style.top = Math.round(box * 0.16 - side / 2) + 'px';
    pet.style.backgroundImage = strip(current.id, 'pet');
    pet.style.backgroundSize = (petSpec.frames * 100) + '% 100%';
    petFrame = 0;
    var paint = function () {
      pet.style.backgroundPosition = (petSpec.frames > 1 ? petFrame / (petSpec.frames - 1) * 100 : 0) + '% 0';
      petFrame = (petFrame + 1) % petSpec.frames;
    };
    paint();
    if (!reduceMotion) petTimer = setInterval(paint, petSpec.ms);
  }

  /* Settle front on: turn the short way round to facing 0, then the loop. */
  function settle(delay) {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(function () {
      clearInterval(turnTimer);
      if (facing === 0 || reduceMotion) {
        showFacing(0);
        startFX();
        return;
      }
      var step = facing <= FACINGS / 2 ? -1 : 1;
      turnTimer = setInterval(function () {
        showFacing(facing + step);
        if (facing === 0) {
          clearInterval(turnTimer);
          startFX();
        }
      }, 85);
    }, delay);
  }

  /* One lap on arrival, the way a character turns in the picker. */
  function spin() {
    clearInterval(turnTimer);
    if (reduceMotion) {
      showFacing(0);
      startFX();
      return;
    }
    var n = 0;
    showFacing(0);
    turnTimer = setInterval(function () {
      n++;
      showFacing(n);
      if (n >= FACINGS) {
        clearInterval(turnTimer);
        showFacing(0);
        startFX();
      }
    }, 95);
  }

  function preload(urls) {
    urls.forEach(function (u) {
      var img = new Image();
      img.src = u;
    });
  }

  function select(card, quiet) {
    if (current && current.card === card) return;
    cards.forEach(function (c) { c.setAttribute('aria-pressed', c === card ? 'true' : 'false'); });
    var d = card.dataset;
    current = { card: card, id: d.id };
    fx = d.fx ? { frames: +d.fx.split(',')[0], ms: +d.fx.split(',')[1] } : null;
    var p = d.pet ? d.pet.split(',') : null;
    petSpec = p ? { frames: +p[0], ms: +p[1], scale: +p[2] } : null;

    nameEl.textContent = d.name;
    rarityEl.textContent = d.rarity;
    rarityEl.style.color = d.tint;
    setEl.textContent = d.setTitle;
    taglineEl.textContent = d.tagline || '';
    taglineEl.hidden = !d.tagline;
    doorEl.textContent = d.door;
    plinth.style.setProperty('--glow', d.rarity === 'Legendary' ? 'rgba(242, 132, 43, 0.9)' : 'transparent');

    var urls = ['sprites/cast/' + d.id + '-turn.webp'];
    if (fx) urls.push('sprites/cast/' + d.id + '-fx.webp');
    if (petSpec) urls.push('sprites/cast/' + d.id + '-pet.webp');
    preload(urls);
    startPet();
    if (quiet) {
      showFacing(0);
      startFX();
    } else {
      spin();
    }
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      select(card);
      // On a narrow screen the spotlight sits above the wall: bring it back.
      if (window.matchMedia('(max-width: 1080px)').matches) {
        var top = spotlight.getBoundingClientRect().top;
        if (top < 0 || top > window.innerHeight * 0.5) {
          spotlight.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }
      }
    });
  });

  /* ----------------------------------------------------------- turning */
  spotlight.querySelectorAll('[data-turn]').forEach(function (b) {
    b.addEventListener('click', function () {
      clearInterval(turnTimer);
      showFacing(facing + parseInt(b.getAttribute('data-turn'), 10));
      settle(2600);
    });
  });

  var drag = null;
  stage.addEventListener('pointerdown', function (e) {
    drag = { x: e.clientX, from: facing, id: e.pointerId };
    clearInterval(turnTimer);
    clearTimeout(settleTimer);
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var steps = Math.round((e.clientX - drag.x) / 26);
    if (((drag.from + steps) % FACINGS + FACINGS) % FACINGS !== facing) showFacing(drag.from + steps);
  });
  function release(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    settle(2200);
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  /* ----------------------------------------------------------- shelves */
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var f = tab.getAttribute('data-filter');
      tabs.forEach(function (t) { t.setAttribute('aria-pressed', t === tab ? 'true' : 'false'); });
      var firstShown = null;
      cards.forEach(function (card) {
        var li = card.parentNode;
        var show = f === 'all' || (f === 'legendary' ? li.getAttribute('data-rarity') === 'legendary'
                                                     : li.getAttribute('data-shelf') === f);
        li.hidden = !show;
        if (show && !firstShown) firstShown = card;
      });
      if (current && current.card.parentNode.hidden && firstShown) select(firstShown);
    });
  });

  /* Nothing animates while the spotlight is off-screen. */
  var shown = null;
  function wake(on) {
    if (on === shown) return;
    shown = on;
    if (!on) {
      clearInterval(fxTimer); fxTimer = null;
      clearInterval(petTimer); petTimer = null;
      clearInterval(turnTimer);
      return;
    }
    if (current) {
      startPet();
      if (facing === 0) startFX(); else settle(0);
    }
  }

  // Open on a legendary, picked at random — the ones that move.
  var legends = cards.filter(function (c) { return c.classList.contains('legendary'); });
  select((legends.length ? legends : cards)[(Math.random() * (legends.length || cards.length)) | 0], true);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      wake(entries[0].isIntersecting);
    }, { threshold: 0.1 }).observe(spotlight);
  } else {
    wake(true);
  }

  /* ----------------------------------------------------- the phones
     The phone clips play only while they're on screen; the trailer keeps
     the app's own music behind a button. */
  var phones = document.querySelectorAll('.phone-video');
  Array.prototype.forEach.call(phones, function (video) {
    var loaded = false;
    function on() {
      if (reduceMotion) return;
      if (!loaded) {
        video.src = video.getAttribute('data-src');
        loaded = true;
      }
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) on(); else video.pause();
      }, { threshold: 0.35 }).observe(video);
    } else {
      on();
    }
    var sound = video.parentNode.querySelector('.sound');
    if (sound) {
      sound.addEventListener('click', function () {
        var unmute = video.muted;
        video.muted = !unmute;
        sound.setAttribute('aria-pressed', unmute ? 'true' : 'false');
        sound.textContent = unmute ? 'Sound off' : 'Sound on';
        if (unmute) {
          if (!loaded) on();
          try { video.currentTime = 0; } catch (err) {}
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
        }
      });
    }
  });
})();
