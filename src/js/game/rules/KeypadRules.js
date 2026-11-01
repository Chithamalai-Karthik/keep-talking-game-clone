/* ============================================================
   KeypadRules.js — Rules for the Keypads module
   Four keys show symbols from a column of the manual. Only that
   column holds all four, and it sets the order to press them.
   ============================================================ */

import { shuffle } from '../../utils/helpers.js';

export const KEY_COUNT = 4;

// Each column runs top to bottom, as in the manual
export const KEYPAD_COLUMNS = [
  ['balloon', 'crossed_a', 'lambda', 'bolt', 'ho', 'kai', 'dot_reversed_c'],
  ['dotted_e', 'balloon', 'dot_reversed_c', 'curly_omega', 'open_star', 'kai', 'question'],
  ['copyright', 'tent', 'curly_omega', 'zhe', 'hook', 'lambda', 'open_star'],
  ['six', 'paragraph', 'hard_sign', 'ho', 'zhe', 'question', 'dotted_cup'],
  ['psi', 'dotted_cup', 'hard_sign', 'dot_c', 'paragraph', 'trident', 'filled_star'],
  ['six', 'dotted_e', 'cross', 'ae', 'psi', 'short_i', 'omega'],
];

/**
 * Find the columns that hold all the given symbols
 * @param {string[]} symbols
 * @returns {string[][]}
 */
export function matchingColumns(symbols) {
  return KEYPAD_COLUMNS.filter(column => symbols.every(symbol => column.includes(symbol)));
}

/**
 * Pick four symbols that only one column holds
 * @returns {string[]} — The symbols, in key order
 */
export function createKeys() {
  for (;;) {
    const column = KEYPAD_COLUMNS[Math.floor(Math.random() * KEYPAD_COLUMNS.length)];
    const symbols = shuffle(column).slice(0, KEY_COUNT);
    if (matchingColumns(symbols).length === 1) return symbols;
  }
}

export class KeypadRules {
  /**
   * @param {string[]} symbols — The symbol on each key
   */
  constructor(symbols) {
    this.symbols = symbols;

    const [column] = matchingColumns(symbols);
    this.order = column
      .filter(symbol => symbols.includes(symbol))
      .map(symbol => symbols.indexOf(symbol));
    this._pressed = 0;
  }

  /**
   * Press a key
   * @returns {string|null} — 'correct', 'solve', 'strike', or null if it is already down
   */
  press(key) {
    if (this.order.indexOf(key) < this._pressed) return null;
    if (key !== this.order[this._pressed]) return 'strike';

    this._pressed++;
    return this._pressed === KEY_COUNT ? 'solve' : 'correct';
  }
}
