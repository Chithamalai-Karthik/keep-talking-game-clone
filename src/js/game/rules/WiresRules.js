/* ============================================================
   WiresRules.js — Rules for the Wires module
   3 to 6 wires sit in 6 rows. Exactly one is the right cut, and
   "first" and "last" count only the wires that are present.
   ============================================================ */

import { WIRE_COLORS } from '../../utils/constants.js';
import { shuffle } from '../../utils/helpers.js';

export const WIRE_ROWS = 6;
const MIN_WIRES = 3;

/**
 * Pick random wires for a new module
 * @returns {Array<{row: number, color: string}>} — Sorted top to bottom
 */
export function createWires() {
  const count = MIN_WIRES + Math.floor(Math.random() * (WIRE_ROWS - MIN_WIRES + 1));
  const rows = shuffle(Array.from({ length: WIRE_ROWS }, (_, i) => i)).slice(0, count);

  return rows
    .sort((a, b) => a - b)
    .map(row => ({ row, color: WIRE_COLORS[Math.floor(Math.random() * WIRE_COLORS.length)] }));
}

/**
 * Find which wire to cut
 * @param {string[]} colors — Colours of the present wires, top to bottom
 * @param {boolean} serialOdd — The serial's last digit is odd
 * @returns {number} — Index into colors
 */
export function correctWireIndex(colors, serialOdd) {
  const count = color => colors.filter(c => c === color).length;
  const lastOf = color => colors.lastIndexOf(color);
  const last = colors.length - 1;
  const lastColor = colors[last];

  switch (colors.length) {
    case 3:
      if (count('red') === 0) return 1;
      if (lastColor === 'white') return last;
      if (count('blue') > 1) return lastOf('blue');
      return last;
    case 4:
      if (count('red') > 1 && serialOdd) return lastOf('red');
      if (lastColor === 'yellow' && count('red') === 0) return 0;
      if (count('blue') === 1) return 0;
      if (count('yellow') > 1) return last;
      return 1;
    case 5:
      if (lastColor === 'black' && serialOdd) return 3;
      if (count('red') === 1 && count('yellow') > 1) return 0;
      if (count('black') === 0) return 1;
      return 0;
    case 6:
      if (count('yellow') === 0 && serialOdd) return 2;
      if (count('yellow') === 1 && count('white') > 1) return 3;
      if (count('red') === 0) return last;
      return 3;
    default:
      throw new Error(`[KTANE] Wires module cannot have ${colors.length} wires`);
  }
}

export class WiresRules {
  /**
   * @param {Array<{row: number, color: string}>} wires — Sorted top to bottom
   * @param {boolean} serialOdd — The serial's last digit is odd
   */
  constructor(wires, serialOdd) {
    this.wires = wires;
    this.correctRow = wires[correctWireIndex(wires.map(wire => wire.color), serialOdd)].row;
    this._cutRows = new Set();
  }

  /**
   * Cut the wire in a row
   * @returns {string|null} — 'solve', 'strike', or null if there is nothing to cut
   */
  cut(row) {
    if (this._cutRows.has(row) || !this.wires.some(wire => wire.row === row)) return null;

    this._cutRows.add(row);
    return row === this.correctRow ? 'solve' : 'strike';
  }
}
