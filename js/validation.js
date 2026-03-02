// Holi Sudoku – validation: duplicate check and win detection (Phase 3)
(function () {
  'use strict';

  /**
   * Checks row, column, and 3×3 box for duplicate values.
   * Returns a Set of string keys "row,col" for every cell that has a duplicate
   * in its row, column, or box (so conflicting cells get highlighted).
   * @param {number[][]} board - 9×9 array; 0 = empty
   * @returns {Set<string>} e.g. Set(["1,2", "1,5"]) for cells at (1,2) and (1,5) in conflict
   */
  function getConflicts(board) {
    var conflicts = new Set();
    var r, c, v, i, key;

    for (r = 0; r < 9; r++) {
      for (c = 0; c < 9; c++) {
        v = board[r][c];
        if (v < 1 || v > 9) continue;

        key = r + ',' + c;

        // Same row
        for (i = 0; i < 9; i++) {
          if (i !== c && board[r][i] === v) {
            conflicts.add(key);
            conflicts.add(r + ',' + i);
          }
        }
        // Same column
        for (i = 0; i < 9; i++) {
          if (i !== r && board[i][c] === v) {
            conflicts.add(key);
            conflicts.add(i + ',' + c);
          }
        }
        // Same 3×3 box
        var br = Math.floor(r / 3) * 3;
        var bc = Math.floor(c / 3) * 3;
        for (var rr = br; rr < br + 3; rr++) {
          for (var cc = bc; cc < bc + 3; cc++) {
            if ((rr !== r || cc !== c) && board[rr][cc] === v) {
              conflicts.add(key);
              conflicts.add(rr + ',' + cc);
            }
          }
        }
      }
    }
    return conflicts;
  }

  /**
   * Win: board is full (no 0s) and no incorrect cells (all match solution).
   * @param {number[][]} board - 9×9 array
   * @param {Set<string>} [incorrectSet] - Set of "row,col" for cells that don't match solution
   * @returns {boolean}
   */
  function isWon(board, incorrectSet) {
    var r, c;
    for (r = 0; r < 9; r++) {
      for (c = 0; c < 9; c++) {
        if (board[r][c] === 0) return false;
      }
    }
    return !incorrectSet || incorrectSet.size === 0;
  }

  window.HoliSudoku = window.HoliSudoku || {};
  window.HoliSudoku.getConflicts = getConflicts;
  window.HoliSudoku.isWon = isWon;
})();
