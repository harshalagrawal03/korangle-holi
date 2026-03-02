// Holi Sudoku – game state and init (Phase 1+2)
(function () {
  'use strict';

  // 1.1 – COLOR_MAP: 1–9 → CSS variable (matches styles.css palette)
  var COLOR_MAP = {
    1: 'var(--holi-1)',
    2: 'var(--holi-2)',
    3: 'var(--holi-3)',
    4: 'var(--holi-4)',
    5: 'var(--holi-5)',
    6: 'var(--holi-6)',
    7: 'var(--holi-7)',
    8: 'var(--holi-8)',
    9: 'var(--holi-9)'
  };

  // 1.4 – board (9×9, 0 = empty), initialBoard (same shape; non-zero = given). Both set from
  // default below; setPuzzleAndSolve() overwrites them on load / new game.
  // Hardcoded example: 3–5 given cells for development (used when no saved state)
  var defaultInitialBoard = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 4, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 7, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 2, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 9]
  ];

  var initialBoard = defaultInitialBoard.map(function (row) { return row.slice(); });
  var board = defaultInitialBoard.map(function (row) { return row.slice(); });

  // 2.1 – selected cell state
  var selectedCell = null;

  // 3.3 – win state: when true, disable edits until New Game
  var gameWon = false;

  // Mistakes: count wrong placements; game over when > 5
  var mistakes = 0;
  var gameOver = false;
  var MAX_MISTAKES = 5;

  // Timer: elapsed seconds this session, persisted on save
  var elapsedSeconds = 0;
  var timerInterval = null;

  // Solution for current puzzle: set once when puzzle is selected (or loaded), used everywhere.
  var solution = null;

  function copyGrid(grid) {
    return grid.map(function (row) { return row.slice(); });
  }

  /**
   * Set the current puzzle and compute or use provided solution. Call this whenever
   * initialBoard/board are set (load, new game, puzzle bank). Solution is solved once here.
   * @param {number[][]} newInitialBoard
   * @param {number[][]} newCurrentBoard
   * @param {number[][]} [existingSolution] - if provided (e.g. from storage), use it; otherwise solve
   */
  function setPuzzleAndSolve(newInitialBoard, newCurrentBoard, existingSolution) {
    initialBoard = copyGrid(newInitialBoard);
    board = copyGrid(newCurrentBoard);
    if (existingSolution != null && Array.isArray(existingSolution) && existingSolution.length === 9) {
      solution = copyGrid(existingSolution);
    } else if (window.HoliSudokuGenerator && typeof window.HoliSudokuGenerator.solve === 'function') {
      var grid = copyGrid(initialBoard);
      solution = window.HoliSudokuGenerator.solve(grid) ? grid : null;
    } else {
      solution = null;
    }
  }

  /** Returns Set of "row,col" for user-filled cells that don't match the solution. Uses pre-solved solution. */
  function getIncorrectCellsCached() {
    if (!solution) return new Set();
    var incorrect = new Set();
    var r, c;
    for (r = 0; r < 9; r++) {
      for (c = 0; c < 9; c++) {
        if (initialBoard[r][c] === 0 && board[r][c] !== 0 && board[r][c] !== solution[r][c]) {
          incorrect.add(r + ',' + c);
        }
      }
    }
    return incorrect;
  }

  /** Sets of row/col/box indices already celebrated with sound (reset on new game). */
  var completedRows = new Set();
  var completedCols = new Set();
  var completedBoxes = new Set();

  /**
   * Returns { rows: Set<number>, cols: Set<number>, boxes: Set<number> } for regions
   * that are full (all 9 cells filled) and have no conflicts.
   */
  function getCompletedRegions() {
    var conflicts = window.HoliSudoku && window.HoliSudoku.getConflicts
      ? window.HoliSudoku.getConflicts(board)
      : new Set();
    var rows = new Set();
    var cols = new Set();
    var boxes = new Set();
    var r, c, v, boxId, fullRow, fullCol, fullBox, i;
    for (r = 0; r < 9; r++) {
      fullRow = true;
      for (c = 0; c < 9; c++) {
        v = board[r][c];
        if (v < 1 || v > 9 || conflicts.has(r + ',' + c)) {
          fullRow = false;
          break;
        }
      }
      if (fullRow) rows.add(r);
    }
    for (c = 0; c < 9; c++) {
      fullCol = true;
      for (r = 0; r < 9; r++) {
        v = board[r][c];
        if (v < 1 || v > 9 || conflicts.has(r + ',' + c)) {
          fullCol = false;
          break;
        }
      }
      if (fullCol) cols.add(c);
    }
    for (var br = 0; br < 3; br++) {
      for (var bc = 0; bc < 3; bc++) {
        boxId = br * 3 + bc;
        fullBox = true;
        for (i = 0; i < 9; i++) {
          r = br * 3 + Math.floor(i / 3);
          c = bc * 3 + (i % 3);
          v = board[r][c];
          if (v < 1 || v > 9 || conflicts.has(r + ',' + c)) {
            fullBox = false;
            break;
          }
        }
        if (fullBox) boxes.add(boxId);
      }
    }
    return { rows: rows, cols: cols, boxes: boxes };
  }

  /** Returns Set of color values (1–9) that are fully correct: all 9 solution cells for that color match the board. */
  function getCompletedColors() {
    if (!solution) return new Set();
    var completed = new Set();
    var k, r, c, allMatch;
    for (k = 1; k <= 9; k++) {
      allMatch = true;
      for (r = 0; r < 9 && allMatch; r++) {
        for (c = 0; c < 9; c++) {
          if (solution[r][c] === k && board[r][c] !== k) {
            allMatch = false;
            break;
          }
        }
      }
      if (allMatch) completed.add(k);
    }
    return completed;
  }

  if (window.HoliSudokuStorage) {
    var saved = window.HoliSudokuStorage.load();
    if (saved) {
      setPuzzleAndSolve(saved.initialBoard, saved.currentBoard, saved.solution);
      selectedCell = saved.selectedCell && typeof saved.selectedCell.row === 'number'
        ? { row: saved.selectedCell.row, col: saved.selectedCell.col }
        : null;
      gameWon = !!saved.gameWon;
      gameOver = !!saved.gameOver;
      if (typeof saved.mistakes === 'number' && saved.mistakes >= 0) mistakes = saved.mistakes;
      if (typeof saved.elapsedSeconds === 'number' && saved.elapsedSeconds >= 0) {
        elapsedSeconds = saved.elapsedSeconds;
      }
      // Seed completed regions so we don't play chimes for already-complete regions on next move
      (function () {
        if (!window.HoliSudoku || !window.HoliSudoku.getConflicts) return;
        var reg = getCompletedRegions();
        reg.rows.forEach(function (r) { completedRows.add(r); });
        reg.cols.forEach(function (c) { completedCols.add(c); });
        reg.boxes.forEach(function (b) { completedBoxes.add(b); });
      })();
    } else {
      // Phase 5: no valid saved state – use curated easy puzzle from puzzle bank
      if (window.HoliSudokuPuzzles && window.HoliSudokuPuzzles.getRandomPuzzle) {
        var puzzle = window.HoliSudokuPuzzles.getRandomPuzzle();
        setPuzzleAndSolve(puzzle.initialBoard, puzzle.currentBoard);
        window.HoliSudokuStorage.save(initialBoard, board, null, false, solution, elapsedSeconds, 0, false);
      } else {
        setPuzzleAndSolve(initialBoard, copyGrid(initialBoard));
      }
    }
  } else {
    setPuzzleAndSolve(initialBoard, copyGrid(initialBoard));
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateTimerDisplay() {
    var el = document.getElementById('timer');
    if (el) el.textContent = formatTime(elapsedSeconds);
  }

  function getFilledCount() {
    var count = 0;
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (board[r][c] !== 0) count++;
      }
    }
    return count;
  }

  function updateCompletenessDisplay() {
    var el = document.getElementById('completeness');
    if (el) el.textContent = getFilledCount() + ' / 81';
  }

  function updateMistakesDisplay() {
    var el = document.getElementById('mistakes');
    if (el) el.textContent = mistakes + ' / ' + MAX_MISTAKES;
  }

  function updateDeviceStatsDisplay() {
    var el = document.getElementById('device-stats');
    if (!el) return;
    // Hide device-level analytics from the user interface while still tracking them in the background.
    el.style.display = 'none';
  }

  function startTimer() {
    if (timerInterval) return;
    updateTimerDisplay();
    timerInterval = setInterval(function () {
      if (gameWon) {
        stopTimer();
        return;
      }
      elapsedSeconds++;
      updateTimerDisplay();
      saveState();
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function render() {
    var container = document.getElementById('board');
    var incorrect = getIncorrectCellsCached();
    if (window.HoliSudoku && window.HoliSudoku.renderBoard) {
      window.HoliSudoku.renderBoard(board, initialBoard, COLOR_MAP, container, selectedCell, incorrect);
    }
    updatePaletteSelection();
    updateClearButton();
    updateTimerDisplay();
    updateCompletenessDisplay();
    updateMistakesDisplay();
    updateDeviceStatsDisplay();
    checkWin();
    checkGameOver();
  }

  function updateClearButton() {
    var btn = document.getElementById('clear-cell');
    if (!btn) return;
    var canClear = selectedCell &&
      initialBoard[selectedCell.row][selectedCell.col] === 0 &&
      board[selectedCell.row][selectedCell.col] !== 0;
    btn.disabled = !canClear;
  }

  function checkWin() {
    if (!window.HoliSudoku || !window.HoliSudoku.isWon) return;
    if (gameWon) return;
    if (window.HoliSudoku.isWon(board, getIncorrectCellsCached())) {
      gameWon = true;
      stopTimer();
      if (window.HoliSudokuAnalytics && typeof window.HoliSudokuAnalytics.trackGameWin === 'function') {
        window.HoliSudokuAnalytics.trackGameWin();
      }
      if (window.HoliSudokuSounds) window.HoliSudokuSounds.playSound('win');
      var winEl = document.getElementById('win-message');
      if (winEl) {
        winEl.classList.add('win-message--visible');
        winEl.removeAttribute('hidden');
      }
    }
  }

  function hideWinMessage() {
    gameWon = false;
    var winEl = document.getElementById('win-message');
    if (winEl) {
      winEl.classList.remove('win-message--visible');
      winEl.setAttribute('hidden', '');
    }
  }

  function showGameOverMessage() {
    var el = document.getElementById('game-over-message');
    if (el) {
      el.classList.add('game-over-message--visible');
      el.removeAttribute('hidden');
    }
  }

  function hideGameOverMessage() {
    gameOver = false;
    var el = document.getElementById('game-over-message');
    if (el) {
      el.classList.remove('game-over-message--visible');
      el.setAttribute('hidden', '');
    }
  }

  function checkGameOver() {
    if (gameOver) return;
    if (mistakes >= MAX_MISTAKES) {
      gameOver = true;
      stopTimer();
      showGameOverMessage();
      if (window.HoliSudokuAnalytics && typeof window.HoliSudokuAnalytics.trackGameOver === 'function') {
        window.HoliSudokuAnalytics.trackGameOver();
      }
    }
  }

  /**
   * Clear saved state and start a new puzzle (generated). Use when testing or to reset.
   */
  function startFreshPuzzle() {
    stopTimer();
    elapsedSeconds = 0;
    completedRows.clear();
    completedCols.clear();
    completedBoxes.clear();
    if (window.HoliSudokuStorage && window.HoliSudokuStorage.clear) {
      window.HoliSudokuStorage.clear();
    }
    if (window.HoliSudokuPuzzles && window.HoliSudokuPuzzles.getRandomPuzzle) {
      var puzzle = window.HoliSudokuPuzzles.getRandomPuzzle();
      setPuzzleAndSolve(puzzle.initialBoard, puzzle.currentBoard);
    }
    selectedCell = null;
    mistakes = 0;
    gameOver = false;
    hideWinMessage();
    hideGameOverMessage();
    gameWon = false;
    if (window.HoliSudokuStorage && window.HoliSudokuStorage.save) {
      window.HoliSudokuStorage.save(initialBoard, board, null, false, solution, elapsedSeconds, mistakes, gameOver);
    }
    render();
    if (window.HoliSudokuAnalytics && typeof window.HoliSudokuAnalytics.trackGameOpen === 'function') {
      window.HoliSudokuAnalytics.trackGameOpen('new_game');
    }
    startTimer();
  }

  function onWinDismissClick() {
    hideWinMessage();
  }

  function updatePaletteSelection() {
    var swatches = document.querySelectorAll('.palette-swatch');
    var current = selectedCell && selectedCell.row != null && selectedCell.col != null
      ? board[selectedCell.row][selectedCell.col]
      : 0;
    var completed = getCompletedColors();
    swatches.forEach(function (sw) {
      var val = parseInt(sw.getAttribute('data-value'), 10);
      sw.classList.toggle('palette-swatch--active', val === current && current >= 1 && current <= 9);
      sw.classList.toggle('palette-swatch--completed', completed.has(val));
    });
  }

  function buildPalette() {
    var container = document.getElementById('palette');
    if (!container) return;
    container.innerHTML = '';
    for (var v = 1; v <= 9; v++) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-swatch';
      btn.setAttribute('data-value', v);
      btn.style.backgroundColor = COLOR_MAP[v];
      btn.setAttribute('aria-label', 'Color ' + v);
      container.appendChild(btn);
    }
  }

  function onBoardClick(e) {
    if (gameWon || gameOver) return;
    if (window.HoliSudokuSounds) window.HoliSudokuSounds.unlock();
    var cell = e.target.closest('.cell');
    if (!cell) return;
    var row = parseInt(cell.getAttribute('data-row'), 10);
    var col = parseInt(cell.getAttribute('data-col'), 10);
    if (isNaN(row) || isNaN(col)) return;
    // Clicking the same cell again only deselects; use Clear button to clear the cell
    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
      selectedCell = null;
    } else {
      selectedCell = { row: row, col: col };
      if (window.HoliSudokuSounds) window.HoliSudokuSounds.playSound('select');
    }
    render();
    saveState();
  }

  function onClearCellClick() {
    if (gameWon || gameOver || !selectedCell) return;
    var r = selectedCell.row;
    var c = selectedCell.col;
    if (initialBoard[r][c] !== 0) return; // given cells are read-only
    board[r][c] = 0;
    selectedCell = null;
    render();
    saveState();
  }

  function onPaletteClick(e) {
    if (gameWon || gameOver) return;
    if (window.HoliSudokuSounds) window.HoliSudokuSounds.unlock();
    var btn = e.target.closest('.palette-swatch');
    if (!btn || !selectedCell) return;
    var value = parseInt(btn.getAttribute('data-value'), 10);
    if (isNaN(value) || value < 1 || value > 9) return;
    var r = selectedCell.row;
    var c = selectedCell.col;
    // 2.4 – only update if cell is not given
    if (initialBoard[r][c] !== 0) return;
    board[r][c] = value;
    var wasMistake = solution && value !== solution[r][c];
    if (wasMistake) {
      mistakes++;
      if (window.HoliSudokuSounds) window.HoliSudokuSounds.playSound('conflict');
    } else {
      if (window.HoliSudokuSounds) window.HoliSudokuSounds.playSound('place');
    }
    // Keep cell selected if value is wrong so user can try another
    var incorrect = getIncorrectCellsCached();
    if (!incorrect.has(r + ',' + c)) {
      selectedCell = null;
    }
    render();
    // Check for newly completed row/column/box and play chime once per new region
    var regions = getCompletedRegions();
    var hadNew = false;
    regions.rows.forEach(function (row) {
      if (!completedRows.has(row)) {
        completedRows.add(row);
        hadNew = true;
      }
    });
    regions.cols.forEach(function (col) {
      if (!completedCols.has(col)) {
        completedCols.add(col);
        hadNew = true;
      }
    });
    regions.boxes.forEach(function (box) {
      if (!completedBoxes.has(box)) {
        completedBoxes.add(box);
        hadNew = true;
      }
    });
    if (hadNew && window.HoliSudokuSounds) window.HoliSudokuSounds.playSound('regionComplete');
    saveState();
  }

  // 4.2 – persist to localStorage (on change and on unload/visibility change)
  function saveState() {
    if (window.HoliSudokuStorage && window.HoliSudokuStorage.save) {
      window.HoliSudokuStorage.save(initialBoard, board, selectedCell, gameWon, solution, elapsedSeconds, mistakes, gameOver);
    }
  }

  function updateSoundToggle() {
    if (!window.HoliSudokuSounds) return;
    var btn = document.getElementById('sound-toggle');
    if (!btn) return;
    var muted = window.HoliSudokuSounds.isMuted();
    btn.textContent = muted ? 'Sound off' : 'Sound on';
    btn.setAttribute('aria-label', muted ? 'Sound off' : 'Sound on');
    btn.classList.toggle('btn-sound--muted', muted);
  }

  function onSoundToggleClick() {
    if (window.HoliSudokuSounds) {
      window.HoliSudokuSounds.unlock();
      window.HoliSudokuSounds.setMuted(!window.HoliSudokuSounds.isMuted());
      updateSoundToggle();
    }
  }

  function init() {
    buildPalette();
    updateSoundToggle();
    render();
    if (window.HoliSudokuAnalytics && typeof window.HoliSudokuAnalytics.trackGameOpen === 'function') {
      window.HoliSudokuAnalytics.trackGameOpen('initial_load');
    }
    if (!gameWon) startTimer();
    var boardEl = document.getElementById('board');
    var paletteEl = document.getElementById('palette');
    var winDismiss = document.getElementById('win-dismiss');
    var winNewGame = document.getElementById('win-new-game');
    var newPuzzleBtn = document.getElementById('new-puzzle');
    var clearCellBtn = document.getElementById('clear-cell');
    var soundToggle = document.getElementById('sound-toggle');
    if (boardEl) boardEl.addEventListener('click', onBoardClick);
    if (paletteEl) paletteEl.addEventListener('click', onPaletteClick);
    if (clearCellBtn) clearCellBtn.addEventListener('click', onClearCellClick);
    if (soundToggle) soundToggle.addEventListener('click', onSoundToggleClick);
    if (winDismiss) winDismiss.addEventListener('click', onWinDismissClick);
    if (winNewGame) winNewGame.addEventListener('click', startFreshPuzzle);
    if (newPuzzleBtn) newPuzzleBtn.addEventListener('click', startFreshPuzzle);
    var gameOverNewGame = document.getElementById('game-over-new-game');
    if (gameOverNewGame) gameOverNewGame.addEventListener('click', startFreshPuzzle);
    var rulesBtn = document.getElementById('rules-btn');
    var rulesModal = document.getElementById('rules-modal');
    var rulesClose = document.getElementById('rules-close');
    function showRules() {
      if (rulesModal) {
        rulesModal.classList.add('rules-modal--visible');
        rulesModal.removeAttribute('hidden');
      }
    }
    function hideRules() {
      if (rulesModal) {
        rulesModal.classList.remove('rules-modal--visible');
        rulesModal.setAttribute('hidden', '');
      }
    }
    if (rulesBtn) rulesBtn.addEventListener('click', showRules);
    if (rulesClose) rulesClose.addEventListener('click', hideRules);
    if (rulesModal) {
      rulesModal.addEventListener('click', function (e) {
        if (e.target === rulesModal) hideRules();
      });
    }
    window.addEventListener('beforeunload', saveState);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') saveState();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.HoliSudoku = window.HoliSudoku || {};
  window.HoliSudoku.hideWinMessage = hideWinMessage;
  window.HoliSudoku.startFreshPuzzle = startFreshPuzzle;
})();
