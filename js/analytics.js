// Holi Sudoku – lightweight analytics helpers
(function () {
  'use strict';

  var LOCAL_FIRST_OPEN_KEY = 'holi-sudoku-first-open';
  var LOCAL_STATS_KEY = 'holi-sudoku-stats';

  function hasGtag() {
    return typeof window !== 'undefined' && typeof window.gtag === 'function';
  }

  function sendEvent(name, params) {
    if (!hasGtag()) return;
    try {
      window.gtag('event', name, params || {});
    } catch (e) {
      // swallow analytics errors
    }
  }

  function getLocalStats() {
    try {
      var raw = localStorage.getItem(LOCAL_STATS_KEY);
      if (!raw) return { opens: 0, wins: 0, gameOvers: 0 };
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return { opens: 0, wins: 0, gameOvers: 0 };
      }
      return {
        opens: typeof parsed.opens === 'number' ? parsed.opens : 0,
        wins: typeof parsed.wins === 'number' ? parsed.wins : 0,
        gameOvers: typeof parsed.gameOvers === 'number' ? parsed.gameOvers : 0
      };
    } catch (e) {
      return { opens: 0, wins: 0, gameOvers: 0 };
    }
  }

  function saveLocalStats(stats) {
    try {
      localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      // ignore storage errors
    }
  }

  function ensureFirstDeviceOpen() {
    try {
      if (localStorage.getItem(LOCAL_FIRST_OPEN_KEY)) return false;
      localStorage.setItem(LOCAL_FIRST_OPEN_KEY, '1');
      sendEvent('first_device_open');
      return true;
    } catch (e) {
      return false;
    }
  }

  function trackGameOpen(source) {
    ensureFirstDeviceOpen();
    sendEvent('game_open', { source: source || 'unknown' });
    var stats = getLocalStats();
    stats.opens += 1;
    saveLocalStats(stats);
  }

  function trackGameWin() {
    sendEvent('game_win');
    var stats = getLocalStats();
    stats.wins += 1;
    saveLocalStats(stats);
  }

  function trackGameOver() {
    sendEvent('game_over');
    var stats = getLocalStats();
    stats.gameOvers += 1;
    saveLocalStats(stats);
  }

  function getStats() {
    return getLocalStats();
  }

  window.HoliSudokuAnalytics = {
    trackGameOpen: trackGameOpen,
    trackGameWin: trackGameWin,
    trackGameOver: trackGameOver,
    getStats: getStats
  };
})();

