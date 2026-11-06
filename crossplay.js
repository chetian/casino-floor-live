/* Casino Floor Live! — crossplay: one table on three screens.
 *
 * Three takes of one moment, played as one (crossplay/, take xp1): the headset
 * leads, the phone and the tablet follow it, and all three go back to the top
 * together when it ends. They load as they come near and play only while in
 * view. Under reduced motion or Save-Data each screen shows the payoff as a
 * still, and nothing moves on its own.
 *
 * Brass wires run from each screen to the sign, drawn from where the screens
 * actually landed, with two chips riding every wire, one each way.
 */
(function () {
  'use strict';

  var xp = document.querySelector('.xp');
  if (!xp) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var stills = reduceMotion || !!(conn && conn.saveData);

  function watch(fn, threshold, margin) {
    if (!('IntersectionObserver' in window)) { fn(true); return; }
    new IntersectionObserver(function (entries) {
      fn(entries[0].isIntersecting);
    }, { threshold: threshold || 0, rootMargin: margin || '0px' }).observe(xp);
  }

  /* ---------- the screens ----------
     Each screen is a still, with its video running underneath. iOS won't
     buffer a video until it's told to play, so playing is what loads them;
     once all three can run, they go back to the top as one and the stills
     fade off. If autoplay is refused (Low Power Mode) the stills just stand. */
  (function screens() {
    var vids = Array.prototype.slice.call(xp.querySelectorAll('video'));
    var lead = xp.querySelector('.xp-vision video');
    var on = false, wired = false, started = false;

    // Nothing is fetched until the graphic is close: the top of the page, and
    // the TV's first clip above all, gets the line to itself.
    function wire() {
      if (wired) return;
      wired = true;
      vids.forEach(function (v) {
        var clip = v.getAttribute('data-clip');
        var still = document.createElement('img');
        still.className = 'xp-still';
        still.alt = '';
        still.src = clip + (stills ? '-payoff.webp' : '.webp');
        v.parentNode.appendChild(still);
        if (stills) return;
        v.preload = 'auto';
        v.src = clip + '.mp4';
      });
    }
    function play(v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* autoplay refused: the stills stand */ });
    }
    function fromTop() {
      if (!on) return;
      vids.forEach(function (v) {
        try { v.currentTime = 0; } catch (e) {}
        play(v);
      });
    }
    // Before the first round: every screen has to be able to run. (Not at a
    // loop, where a clip that has finished has no "next frame" to report.)
    function tryStart() {
      if (started || !on) return;
      if (!vids.every(function (v) { return v.readyState >= 3; })) return;
      started = true;
      fromTop();
    }
    function update() {
      if (!on) { vids.forEach(function (v) { v.pause(); }); return; }
      wire();
      if (started && lead.ended) fromTop();
      else { vids.forEach(play); tryStart(); }
    }

    watch(function (near) { if (near) wire(); }, 0, '800px 0px');
    if (stills) return;
    vids.forEach(function (v) {
      v.addEventListener('canplay', tryStart);
      v.addEventListener('playing', tryStart);
    });
    lead.addEventListener('ended', fromTop);
    lead.addEventListener('timeupdate', function () {
      // The first round is on the glass: the stills can go.
      if (started && lead.currentTime > 0 && lead.currentTime < 1) xp.classList.add('xp-live');
      // Keep in step: a follower that has drifted a few frames off is put back.
      if (!started) return;
      vids.forEach(function (v) {
        if (v === lead || v.ended || v.seeking || v.readyState < 2) return;
        if (Math.abs(v.currentTime - lead.currentTime) > 0.12) {
          try { v.currentTime = lead.currentTime; } catch (e) {}
        }
      });
    });
    var inView = false;
    function changed() {
      on = inView && !document.hidden;
      update();
    }
    watch(function (v) { inView = v; changed(); }, 0.2);
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

    Array.prototype.forEach.call(xp.querySelectorAll('.xp-dev'), function (dev, i) {
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
    if (reduceMotion) return;
    watch(function (v) {
      if (v === running) return;
      running = v;
      if (v) { draw(); raf = window.requestAnimationFrame(tick); }
      else window.cancelAnimationFrame(raf);
    });
  })();
})();
