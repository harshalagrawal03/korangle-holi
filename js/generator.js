// Holi Sudoku – puzzle generation (Phase 5)
(function () {
  'use strict';

  function copyGrid(grid) {
    return grid.map(function (row) { return row.slice(); });
  }

  /**
   * Check if placing value at (row, col) is valid (no duplicate in row, col, or 3×3 box).
   * @param {number[][]} grid - 9×9, 0 = empty
   * @param {number} row
   * @param {number} col
   * @param {number} value - 1–9
   * @returns {boolean}
   */
  function isValidPlacement(grid, row, col, value) {
    var r, c, br, bc, rr, cc;
    for (c = 0; c < 9; c++) {
      if (c !== col && grid[row][c] === value) return false;
    }
    for (r = 0; r < 9; r++) {
      if (r !== row && grid[r][col] === value) return false;
    }
    br = Math.floor(row / 3) * 3;
    bc = Math.floor(col / 3) * 3;
    for (rr = br; rr < br + 3; rr++) {
      for (cc = bc; cc < bc + 3; cc++) {
        if ((rr !== row || cc !== col) && grid[rr][cc] === value) return false;
      }
    }
    return true;
  }

  /**
   * Returns [1..9] shuffled (Fisher–Yates).
   */
  function shuffledValues() {
    var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    var i, j, t;
    for (i = arr.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  /**
   * Find next cell with value 0 (row-major).
   * @param {number[][]} grid
   * @returns {{ row: number, col: number } | null}
   */
  function findNextEmpty(grid) {
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (grid[r][c] === 0) return { row: r, col: c };
      }
    }
    return null;
  }

  /**
   * Backtracking solver: fill empty cells with 1–9, backtrack on conflict.
   * Modifies grid in place. Uses shuffled order for values to get varied solutions.
   * @param {number[][]} grid - 9×9
   * @returns {boolean} true if solved
   */
  function solve(grid) {
    var cell = findNextEmpty(grid);
    if (!cell) return true;
    var vals = shuffledValues();
    for (var i = 0; i < vals.length; i++) {
      var v = vals[i];
      if (!isValidPlacement(grid, cell.row, cell.col, v)) continue;
      grid[cell.row][cell.col] = v;
      if (solve(grid)) return true;
      grid[cell.row][cell.col] = 0;
    }
    return false;
  }

  window.HoliSudokuGenerator = {
    solve: solve
  };
})();
