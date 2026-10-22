/* Casino Floor Live! — pick a game.
 *
 * The phone plays one game at a time, cut from the app itself (games/,
 * tools/game-clips.py): the deal, the roll or the drop, then the payoff.
 * Left alone, it deals the whole floor in turn, holding each payoff a beat
 * before the next game; pick one from the wall and it stays on that game,
 * round after round.
 *
 * A clip loads only once the phone is on screen and pauses when it leaves.
 * Under reduced motion or Save-Data the phone shows each game's payoff as a
 * still, and nothing moves on its own.
 */
(function () {
  'use strict';

  var spot = document.querySelector('.game-spot');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.game-card'));
  if (!spot || !cards.length) return;
  var video = spot.querySelector('.game-video');
  var info = spot.querySelector('.game-info');
  var nameEl = info.querySelector('.spot-name');
  var pills = info.querySelectorAll('.pill');
  var lineEl = info.querySelector('.game-line');
  var rulesEl = info.querySelector('.game-rules');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var stills = reduceMotion || !!(conn && conn.saveData);

  var HOLD = 1600;          // the payoff holds this long before the next game
  var current = cards[0];   // the game the page is served on
  var picked = false;       // until a pick, the phone deals the whole floor
  var shown = false;        // the phone is on screen
  var loaded = null;        // the game whose clip is on the phone
  var holdTimer = null, blankTimer = null;

  function start() {
    var p = video.play();
    if (p && p.catch) p.catch(unblank);
  }

  function unblank() {
    clearTimeout(blankTimer);
    video.classList.remove('cut');
  }

  /* Cut to the current game: the screen goes dark and comes up on the deal,
     never on the poster (the payoff) first. A pick plays at once, inside the
     tap, where a phone in Low Power Mode still lets it. */
  function load(byHand) {
    var id = current.getAttribute('data-game');
    video.poster = 'games/' + id + '.webp';
    if (stills) return;
    loaded = id;
    video.classList.add('cut');
    video.loop = picked;
    video.src = 'games/' + id + '.mp4';
    if (shown || byHand) start();
    // A slow connection shows the still rather than a dark phone.
    clearTimeout(blankTimer);
    blankTimer = setTimeout(unblank, 2500);
  }

  function select(card, byHand) {
    clearTimeout(holdTimer);
    if (byHand) picked = true;
    // A pick is announced; the floor dealing itself goes by quietly.
    info.setAttribute('aria-live', byHand ? 'polite' : 'off');
    if (card === current) {
      // Already on: it stays, and a finished round deals again.
      if (byHand && !stills) {
        video.loop = true;
        if (loaded !== current.getAttribute('data-game')) load(true);
        else if (video.paused || video.ended) start();
      }
      return;
    }
    current = card;
    cards.forEach(function (c) { c.setAttribute('aria-pressed', c === card ? 'true' : 'false'); });
    var pill = card.getAttribute('data-pills').split('|');
    nameEl.textContent = card.getAttribute('data-name');
    pills[0].textContent = pill[0];
    pills[1].textContent = pill[1];
    lineEl.textContent = card.getAttribute('data-line');
    rulesEl.href = '/games#' + card.getAttribute('data-game');
    video.setAttribute('aria-label', card.getAttribute('data-alt'));
    load(byHand);
  }

  function next() {
    select(cards[(cards.indexOf(current) + 1) % cards.length], false);
  }

  video.addEventListener('playing', unblank);
  video.addEventListener('error', unblank);
  video.addEventListener('ended', function () {
    if (picked) return;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(next, HOLD);
  });

  /* Nothing plays while the phone is off-screen. */
  function wake(on) {
    var was = shown;
    shown = on;
    if (stills) return;
    if (!on) {
      clearTimeout(holdTimer);
      video.pause();
      return;
    }
    if (was) return;
    if (loaded !== current.getAttribute('data-game')) load();
    else if (video.ended && !picked) next();
    else start();
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      select(card, true);
      // On a narrow screen the phone sits above the wall: bring it back.
      if (window.matchMedia('(max-width: 1080px)').matches) {
        var top = spot.getBoundingClientRect().top;
        if (top < 0 || top > window.innerHeight * 0.5) {
          spot.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }
      }
    });
  });

  info.setAttribute('aria-live', 'off');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      wake(e.isIntersecting && e.intersectionRatio >= 0.25);
    }, { threshold: [0, 0.25] }).observe(video);
  } else {
    wake(true);
  }
})();
