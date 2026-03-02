// Holi Sudoku – user interaction sound effects (Web Audio API, procedural)
(function () {
  'use strict';

  var STORAGE_KEY = 'holi-sudoku-mute';
  var audioContext = null;
  var unlocked = false;

  function isMuted() {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setMuted(muted) {
    try {
      localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    } catch (e) {}
  }

  /**
   * Unlock Web Audio on first user gesture (required by browsers).
   */
  function unlock() {
    if (unlocked) return;
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContext = ctx;
      // Resume if suspended (e.g. iOS)
      if (ctx.state === 'suspended') ctx.resume();
      unlocked = true;
    } catch (e) {
      unlocked = false;
    }
  }

  function getContext() {
    if (!unlocked || !audioContext) return null;
    if (audioContext.state === 'suspended') audioContext.resume();
    return audioContext;
  }

  /**
   * Short soft tone (frequency Hz, duration seconds, type: 'sine'|'square'|etc).
   */
  function tone(freq, duration, type, volume) {
    var ctx = getContext();
    if (!ctx || isMuted()) return;
    type = type || 'sine';
    volume = volume == null ? 0.15 : Math.max(0, Math.min(1, volume));
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Cell selected – short soft tap.
   */
  function playSelect() {
    tone(520, 0.06, 'sine', 0.12);
  }

  /**
   * Color placed – pleasant place/pop.
   */
  function playPlace() {
    var ctx = getContext();
    if (!ctx || isMuted()) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Conflict – gentle error/buzz.
   */
  function playConflict() {
    var ctx = getContext();
    if (!ctx || isMuted()) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(160, now + 0.05);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Row/column/box completed – short positive chime.
   */
  function playRegionComplete() {
    var ctx = getContext();
    if (!ctx || isMuted()) return;
    var now = ctx.currentTime;
    var freqs = [523.25, 659.25];
    freqs.forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + i * 0.05);
      osc.start(now + i * 0.06);
      osc.stop(now + 0.25);
    });
  }

  /**
   * Puzzle completed – celebratory jingle.
   */
  function playWin() {
    var ctx = getContext();
    if (!ctx || isMuted()) return;
    var now = ctx.currentTime;
    var notes = [523.25, 587.33, 659.25, 783.99, 659.25, 783.99];
    notes.forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      var start = now + i * 0.12;
      var end = start + 0.2;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, end);
      osc.start(start);
      osc.stop(end);
    });
  }

  /**
   * Play sound by id. Call unlock() on first user interaction before playing.
   * Ids: 'select' | 'place' | 'conflict' | 'regionComplete' | 'win'
   */
  function playSound(id) {
    if (isMuted()) return;
    switch (id) {
      case 'select':
        playSelect();
        break;
      case 'place':
        playPlace();
        break;
      case 'conflict':
        playConflict();
        break;
      case 'regionComplete':
        playRegionComplete();
        break;
      case 'win':
        playWin();
        break;
      default:
        break;
    }
  }

  window.HoliSudokuSounds = {
    unlock: unlock,
    playSound: playSound,
    isMuted: isMuted,
    setMuted: setMuted
  };
})();
