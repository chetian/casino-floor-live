/* Casino Floor Live! — the television in the hero.
 *
 * The home screen's set (`TVSetNode` around `ChannelSurferNode`), on the web.
 * Nobody works it: it comes on to the floor itself — friends in the conga
 * line, past the slots, the bar and the tables — then surfs by itself, a
 * channel every few seconds: the house show on 2, THE BIG RACE on 3, and EYE
 * IN THE SKY, the floor's security feed, on 7. Every change is a burst of
 * analogue snow and the channel's number in old-set green, the picture's
 * light round the set in the show's own colour, and a CRT's line when it
 * comes on.
 *
 * The pictures are the app's own: each show is the home screen's TV filmed
 * in the simulator against a local relay, cropped to the glass; the floor is
 * the App Store preview's conga take. Silent, as the app's home set is. A
 * click (or NEXT CHANNEL) changes the channel.
 */
(function () {
  'use strict';

  var tv = document.querySelector('.tv');
  if (!tv) return;
  var glass = tv.querySelector('.tv-glass');
  var pics = Array.prototype.slice.call(tv.querySelectorAll('.tv-pic'));
  var snow = tv.querySelector('.tv-snow');
  var osd = tv.querySelector('.tv-osd');
  var hit = tv.querySelector('.tv-hit');
  var head = document.querySelector('.on-air');
  var headShow = document.querySelector('.on-air-show');
  var headNext = document.querySelector('.on-air-next');

  /* The lineup, in surf order: the floor, then a house show, the security
     feed, the race — the app's own rhythm (the feed follows every two
     channels). The words are the app's (ChannelLineup.osd,
     ChannelSurferNode.guide). `tint` is the show's accent, the colour the
     set's glow takes (HouseLook.accent); `pale` is the ON AIR line's
     (HouseLook.accentPale). The security feed isn't live television, so its
     line has no red dot. It and the floor name each place as the picture
     cuts to it. The floor isn't one of the app's channels: it's the site's
     own, the room before the shows, held for its whole clip (`dwell`). */
  var HOUSE = { live: true };
  var CAM = { live: false, tint: '#8CBFA6', pale: 'rgba(255, 247, 228, 0.7)' };
  function ch(o, base) { for (var k in base) if (!(k in o)) o[k] = base[k]; return o; }
  var CHANNELS = [
    ch({ ch: 1, name: 'THE FLOOR', clip: 'floor', tint: '#4BD07A', pale: '#DDF8E6', dwell: 12000,
         cams: [[0, 'WEST HALL'], [3.7, 'THE BAR'], [7.7, 'THE PIT']] }, HOUSE),
    ch({ ch: 2, name: 'BATTLE BANQUET', clip: 'banquet', tint: '#F7C948', pale: '#FFDF7E' }, HOUSE),
    ch({ ch: 7, name: 'EYE IN THE SKY', clip: 'cam-doors', cams: [[0, 'CAM 01 · THE DOORS'], [3.5, 'CAM 02 · THE PIT']] }, CAM),
    ch({ ch: 3, name: 'THE JACKPOT RUN', clip: 'rally', tint: '#FFD23F', pale: '#F4E9D0' }, HOUSE),
    ch({ ch: 2, name: 'FIGHT NIGHT', clip: 'fight', tint: '#F5C84A', pale: '#FFE7A3' }, HOUSE),
    ch({ ch: 7, name: 'EYE IN THE SKY', clip: 'cam-blackjack', cams: [[0, 'CAM 12 · BLACKJACK TABLE'], [3.5, 'CAM 03 · ROULETTE']] }, CAM),
    ch({ ch: 3, name: 'MOTO MAYHEM', clip: 'moto', tint: '#B6FF1A', pale: '#F2F4F0' }, HOUSE),
    ch({ ch: 2, name: 'BURNOUT BOULEVARD', clip: 'drag', tint: '#FFB22E', pale: '#FFE09A' }, HOUSE),
    ch({ ch: 7, name: 'EYE IN THE SKY', clip: 'cam-bar', cams: [[0, 'CAM 13 · BAR TOP'], [3.53, 'CAM 09 · POKER ROOM']] }, CAM),
    ch({ ch: 3, name: 'ULTIMATE RACE', clip: 'tri', tint: '#FFD23F', pale: '#FFF4E0' }, HOUSE)
  ];
  var DWELL = 9000;          // the longest a channel holds (unless it says); a clip ends it sooner
  var MIN_DWELL = 3500;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var stills = reduceMotion || !!(conn && conn.saveData);
  // A phone's set gets the 768-wide cut; a big screen the 1280.
  var small = (glass.clientWidth || 600) * Math.min(window.devicePixelRatio || 1, 2) <= 900;

  function src(c) { return 'tv/' + c.clip + (small ? '-sm' : '') + '.mp4'; }
  function poster(c) { return 'tv/' + c.clip + '.webp'; }

  function guideLine(c, t) {
    if (!c.cams) return c.name + ' · LIVE';
    var cam = c.cams[0][1];
    for (var i = 0; i < c.cams.length; i++) if ((t || 0) >= c.cams[i][0]) cam = c.cams[i][1];
    return c.name + ' · ' + cam;
  }

  /* ---------------------------------------------------------------- snow
     Four frames, coarse on purpose: 96 × 54, blown up nearest-pixel, read as
     an analogue set between channels (ChannelFlipNode.snowFrames). */
  var snowFrames = [];
  var sg = snow && snow.getContext ? snow.getContext('2d') : null;
  if (sg) {
    snow.width = 96;
    snow.height = 54;
    for (var f = 0; f < 4; f++) {
      var img = sg.createImageData(96, 54);
      for (var i = 0; i < 96 * 54; i++) {
        var v = 20 + ((Math.random() * 216) | 0);
        img.data[i * 4] = v;
        img.data[i * 4 + 1] = v;
        img.data[i * 4 + 2] = v;
        img.data[i * 4 + 3] = 255;
      }
      snowFrames.push(img);
    }
  }

  var snowTimer = null;
  function burst() {
    if (!sg || stills) return;
    // there and back: 0 1 2 3 3 2 1 0, 45 ms a frame, then a quick fade
    var order = [0, 1, 2, 3, 3, 2, 1, 0];
    var k = 0;
    clearTimeout(snowTimer);
    snow.style.transition = 'none';
    snow.style.opacity = '0.92';
    (function step() {
      if (k < order.length) {
        sg.putImageData(snowFrames[order[k++]], 0, 0);
        snowTimer = setTimeout(step, 45);
      } else {
        snow.style.transition = 'opacity 0.08s linear';
        snow.style.opacity = '0';
      }
    })();
  }

  var osdTimer = null;
  function showOSD(c) {
    osd.textContent = 'CH ' + (c.ch < 10 ? '0' : '') + c.ch + '  ' + c.name;
    osd.classList.remove('fading');
    osd.classList.add('on');
    clearTimeout(osdTimer);
    osdTimer = setTimeout(function () {
      osd.classList.add('fading');
      osd.classList.remove('on');
    }, 1800);
  }

  /* ---------------------------------------------------------------- tuning */
  var index = 0;
  var front = 0;             // which <video> is showing
  var timer = null;
  var running = false;
  var tunedAt = 0;

  function show(c) {
    tv.style.setProperty('--tint', c.tint);
    if (head) {
      head.style.setProperty('--show-pale', c.pale);
      head.classList.toggle('not-live', !c.live);
    }
    if (headShow) headShow.textContent = guideLine(c, 0);
    if (hit) hit.setAttribute('aria-label', 'Change the channel (now showing ' + c.name.toLowerCase() + ')');
  }

  function load(video, c) {
    if (video.dataset.clip === c.clip) return;
    video.dataset.clip = c.clip;
    video.poster = poster(c);
    if (stills) {
      video.removeAttribute('src');
      return;
    }
    video.src = src(c);
    video.load();
  }

  function play(video) {
    if (stills) return;
    video.muted = true;
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay refused: the poster stands */ });
  }

  function schedule(video) {
    clearTimeout(timer);
    if (!running || stills && reduceMotion) return;
    var dwell = CHANNELS[index].dwell || DWELL;
    var wait = dwell;
    if (!stills && video.duration && isFinite(video.duration)) {
      wait = Math.max(MIN_DWELL, Math.min(dwell, (video.duration - (video.currentTime || 0)) * 1000 - 120));
    }
    timer = setTimeout(function () { tune(index + 1); }, wait);
  }

  var swapTimer = null;
  function tune(next, user) {
    index = (next + CHANNELS.length) % CHANNELS.length;
    var c = CHANNELS[index];
    var incoming = pics[1 - front];
    var outgoing = pics[front];
    front = 1 - front;
    clearTimeout(timer);
    load(incoming, c);
    burst();
    showOSD(c);
    show(c);
    // The swap lands under the snow, a frame in.
    clearTimeout(swapTimer);
    swapTimer = setTimeout(function () {
      incoming.classList.remove('hidden');
      outgoing.classList.add('hidden');
      outgoing.pause();
      try { incoming.currentTime = 0; } catch (e) { /* not loaded yet */ }
      if (running) play(incoming);
      tunedAt = Date.now();
      // Warm the next channel on the set that just went dark.
      load(outgoing, CHANNELS[(index + 1) % CHANNELS.length]);
      if (stills || incoming.readyState >= 1) schedule(incoming);
      else incoming.addEventListener('loadedmetadata', function once() {
        incoming.removeEventListener('loadedmetadata', once);
        if (pics[front] === incoming) schedule(incoming);
      });
    }, stills ? 0 : 60);
    if (user) {
      tv.classList.add('pressed');
      setTimeout(function () { tv.classList.remove('pressed'); }, 140);
    }
  }

  function setRunning(on) {
    if (on === running) return;
    running = on;
    var video = pics[front];
    if (on) {
      play(video);
      schedule(video);
    } else {
      clearTimeout(timer);
      video.pause();
    }
  }

  /* ---------------------------------------------------------------- start
     The set comes on dark and switches on: the line across the glass,
     opening to the picture. The first channel is the floor — the room is
     already running when you walk in — and the shows follow it. */
  index = 0;
  var first = CHANNELS[index];
  pics[0].classList.remove('hidden');
  pics[1].classList.add('hidden');
  load(pics[0], first);
  show(first);
  // The next channel warms up only once the first is on the glass, so the
  // page's first moments spend their bandwidth on one picture.
  function warmNext() {
    if (front === 0 && !pics[1].dataset.clip) load(pics[1], CHANNELS[(index + 1) % CHANNELS.length]);
  }
  pics[0].addEventListener('playing', function once() {
    pics[0].removeEventListener('playing', once);
    setTimeout(warmNext, 1200);
  });
  setTimeout(warmNext, 6000);

  function powerOn() {
    tv.classList.add('powered');
    running = true;
    tunedAt = Date.now();
    play(pics[0]);
    if (stills || pics[0].readyState >= 1) schedule(pics[0]);
    else pics[0].addEventListener('loadedmetadata', function once() {
      pics[0].removeEventListener('loadedmetadata', once);
      if (front === 0) schedule(pics[0]);
    });
  }
  // A beat after the page settles, the way the home screen's set waits for
  // the arrival cascade.
  setTimeout(powerOn, 350);

  function change() { tune(index + 1, true); }
  if (hit) hit.addEventListener('click', change);
  if (headNext) headNext.addEventListener('click', change);

  // The security feed names each camera as it cuts to it; the floor, each place.
  pics.forEach(function (video) {
    video.addEventListener('timeupdate', function () {
      var c = CHANNELS[index];
      if (video !== pics[front] || !c.cams || !headShow) return;
      var line = guideLine(c, video.currentTime);
      if (headShow.textContent !== line) headShow.textContent = line;
    });
  });

  // A clip that runs out early hands over at once.
  pics.forEach(function (video) {
    video.addEventListener('ended', function () {
      if (video === pics[front] && running && Date.now() - tunedAt > MIN_DWELL) tune(index + 1);
      else if (video === pics[front]) { try { video.currentTime = 0; } catch (e) {} play(video); }
    });
  });

  /* Nothing runs while the set is off-screen or the tab is hidden — the
     same reason the app's home set powers down when the floor takes over. */
  var visible = true;
  document.addEventListener('visibilitychange', function () {
    setRunning(!document.hidden && visible);
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (tv.classList.contains('powered')) setRunning(visible && !document.hidden);
    }, { threshold: 0.15 }).observe(glass);
  }

  /* ------------------------------------------------- the guide's little sets
     Each listing's set shows a still until you look at it: hover (or focus,
     or a tap on a touch screen) runs that show's clip. */
  var minis = document.querySelectorAll('.mini-tv[data-clip]');
  var hover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
  Array.prototype.forEach.call(minis, function (mini) {
    var clip = mini.getAttribute('data-clip');
    var video = null;
    function start() {
      if (stills) return;
      if (!video) {
        video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('aria-hidden', 'true');
        video.preload = 'auto';
        video.src = 'tv/' + clip + '.mp4';
        mini.querySelector('.glass').appendChild(video);
      }
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
      mini.classList.add('playing');
    }
    function stop() {
      if (!video) return;
      video.pause();
      mini.classList.remove('playing');
    }
    var row = mini.closest('.listing, .note-card') || mini;
    if (hover) {
      row.addEventListener('mouseenter', start);
      row.addEventListener('mouseleave', stop);
    } else {
      mini.addEventListener('click', function () {
        if (mini.classList.contains('playing')) stop(); else start();
      });
    }
    row.addEventListener('focusin', start);
    row.addEventListener('focusout', stop);
  });
})();
