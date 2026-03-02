// Holi Sudoku – persistence via localStorage (Phase 4)
(function () {
  'use strict';

  var STORAGE_KEY = 'holi-sudoku-state';

  /**
   * Check that a grid is a valid 9×9 board (values 0–9).
   * @param {*} grid
   * @returns {boolean}
   */
  function isValidBoard(grid) {
    if (!Array.isArray(grid) || grid.length !== 9) return false;
    for (var r = 0; r < 9; r++) {
      if (!Array.isArray(grid[r]) || grid[r].length !== 9) return false;
      for (var c = 0; c < 9; c++) {
        var v = grid[r][c];
        if (typeof v !== 'number' || v < 0 || v > 9) return false;
      }
    }
    return true;
  }

  /**
   * Check that selectedCell is null or { row, col } with 0–8.
   * @param {*} sel
   * @returns {boolean}
   */
  function isValidSelectedCell(sel) {
    if (sel === null || sel === undefined) return true;
    if (typeof sel !== 'object') return false;
    var row = sel.row;
    var col = sel.col;
    return typeof row === 'number' && typeof col === 'number' &&
           row >= 0 && row <= 8 && col >= 0 && col <= 8;
  }

  /**
   * Validate saved state shape and values.
   * solution is optional (for backward compat); when present must be valid 9×9.
   * @param {*} data
   * @returns {boolean}
   */
  function validate(data) {
    if (!data || typeof data !== 'object') return false;
    if (!isValidBoard(data.initialBoard) || !isValidBoard(data.currentBoard)) return false;
    if (!isValidSelectedCell(data.selectedCell)) return false;
    if (data.solution != null && !isValidBoard(data.solution)) return false;
    if (data.elapsedSeconds != null && (typeof data.elapsedSeconds !== 'number' || data.elapsedSeconds < 0)) return false;
    if (data.mistakes != null && (typeof data.mistakes !== 'number' || data.mistakes < 0)) return false;
    return true;
  }

  /**
   * Save game state to localStorage.
   * @param {number[][]} initialBoard
   * @param {number[][]} currentBoard
   * @param {{ row: number, col: number } | null} selectedCell
   * @param {boolean} [gameWon]
   * @param {number[][]} [solution] - precomputed solution; stored so we don't solve on load
   * @param {number} [elapsedSeconds]
   * @param {number} [mistakes]
   * @param {boolean} [gameOver]
   */
  function save(initialBoard, currentBoard, selectedCell, gameWon, solution, elapsedSeconds, mistakes, gameOver) {
    try {
      var state = {
        initialBoard: initialBoard,
        currentBoard: currentBoard,
        selectedCell: selectedCell,
        gameWon: !!gameWon
      };
      if (solution != null && isValidBoard(solution)) state.solution = solution;
      if (typeof elapsedSeconds === 'number' && elapsedSeconds >= 0) state.elapsedSeconds = elapsedSeconds;
      if (typeof mistakes === 'number' && mistakes >= 0) state.mistakes = mistakes;
      if (gameOver != null) state.gameOver = !!gameOver;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // localStorage full or disabled
    }
  }

  /**
   * Load and validate state from localStorage.
   * @returns {{ initialBoard: number[][], currentBoard: number[][], selectedCell: object|null, gameWon: boolean, solution?: number[][], elapsedSeconds?: number, mistakes?: number, gameOver?: boolean } | null}
   */
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw == null) return null;
      var data = JSON.parse(raw);
      if (!validate(data)) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Clear saved state (for Phase 6 New Game).
   */
  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  window.HoliSudokuStorage = {
    save: save,
    load: load,
    clear: clear
  };
})();
