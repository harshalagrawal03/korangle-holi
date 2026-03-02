// Holi Sudoku – render 9×9 grid from state (Phase 1+2)
(function () {
  'use strict';

  /**
   * Returns whether (row, col) is in the same 3×3 box as (boxRow, boxCol).
   */
  function inSameBox(row, col, boxRow, boxCol) {
    return Math.floor(row / 3) === Math.floor(boxRow / 3) &&
           Math.floor(col / 3) === Math.floor(boxCol / 3);
  }

  /**
   * Renders the board from current board state.
   * @param {number[][]} board - 9×9 array; 0 = empty
   * @param {number[][]} initialBoard - same shape; non-zero = given cell
   * @param {Object.<number, string>} colorMap - 1..9 → CSS color (e.g. 'var(--holi-1)')
   * @param {HTMLElement} container - element to render into (e.g. #board)
   * @param {{ row: number, col: number } | null} selectedCell - currently selected cell
   * @param {Set<string>} [incorrect] - optional Set of "row,col" for wrong-value cells (solution mismatch)
   */
  function renderBoard(board, initialBoard, colorMap, container, selectedCell, incorrect) {
    if (!container) return;
    container.innerHTML = '';
    const sel = selectedCell || null;
    const incorrectSet = incorrect || new Set();
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = board[row][col];
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.setAttribute('data-row', row);
        cell.setAttribute('data-col', col);
        cell.setAttribute('data-box', Math.floor(row / 3) * 3 + Math.floor(col / 3));
        cell.setAttribute('role', 'gridcell');
        if (initialBoard[row][col] !== 0) {
          cell.classList.add('cell--given');
        }
        if (value >= 1 && value <= 9) {
          cell.classList.add('cell--filled');
          cell.style.backgroundColor = colorMap[value];
        }
        if (sel && sel.row === row && sel.col === col) {
          cell.classList.add('cell--selected');
        }
        if (sel && (row === sel.row || col === sel.col || inSameBox(row, col, sel.row, sel.col))) {
          cell.classList.add('cell--highlight');
        }
        if (incorrectSet.has(row + ',' + col)) {
          cell.classList.add('cell--incorrect');
        }
        container.appendChild(cell);
      }
    }
  }

  window.HoliSudoku = window.HoliSudoku || {};
  window.HoliSudoku.renderBoard = renderBoard;
})();
