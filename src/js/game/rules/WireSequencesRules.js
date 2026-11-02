/* ============================================================
   WireSequencesRules.js — Rules for the Wire Sequences module
   Panels of wires are shown one at a time. Each wire is judged by
   how many of its colour have appeared so far, across all panels,
   and the letter it connects to. Leaving a panel with a wire that
   needed cutting is a strike. Passing the last panel solves it.
   ============================================================ */

import { randomChoice, randomInt, shuffle } from '../../utils/helpers.js';

export const PANEL_COUNT = 4;
export const TERMINALS_PER_PANEL = 3;
const MIN_WIRES_PER_PANEL = 1;
const MAX_OCCURRENCES = 9;

export const WIRE_COLORS = ['red', 'blue', 'black'];
export const LETTERS = ['A', 'B', 'C'];

// CUT_LETTERS[color][n] is what occurrence n + 1 of that colour is cut for
export const CUT_LETTERS = {
  red: ['C', 'B', 'A', 'AC', 'B', 'AC', 'ABC', 'AB', 'B'],
  blue: ['B', 'AC', 'B', 'A', 'B', 'BC', 'C', 'AC', 'A'],
  black: ['ABC', 'AC', 'B', 'AC', 'B', 'BC', 'AB', 'C', 'C'],
};

/**
 * @param {string} color
 * @param {number} occurrence - 1 for the first of that colour
 * @param {string} letter
 * @returns {boolean}
 */
export function shouldCut(color, occurrence, letter) {
  return CUT_LETTERS[color][occurrence - 1].includes(letter);
}

/**
 * Pick the wires for one panel, keeping each colour within the manual's nine
 * @param {Object} counts - wires of each colour so far; updated here
 * @returns {Array<{terminal: number, letter: string, color: string, occurrence: number, needsCut: boolean}>}
 */
function createPanel(counts) {
  const size = randomInt(MIN_WIRES_PER_PANEL, TERMINALS_PER_PANEL);
  const terminals = shuffle([0, 1, 2]).slice(0, size).sort((a, b) => a - b);

  return terminals.map((terminal) => {
    const color = randomChoice(WIRE_COLORS.filter(item => counts[item] < MAX_OCCURRENCES));
    const letter = randomChoice(LETTERS);
    counts[color] += 1;

    return { terminal, letter, color, occurrence: counts[color], needsCut: shouldCut(color, counts[color], letter) };
  });
}

/**
 * @returns {Array<Array>} the wires of each panel, top terminal first
 */
export function createPanels() {
  const counts = { red: 0, blue: 0, black: 0 };
  return Array.from({ length: PANEL_COUNT }, () => createPanel(counts));
}

export class WireSequencesRules {
  /**
   * @param {Array<Array>} panels - see createPanels
   */
  constructor(panels = createPanels()) {
    this.panels = panels;
    this.panelIndex = 0;
    this._cut = new Set();
  }

  get panel() {
    return this.panels[this.panelIndex];
  }

  isCut(panelIndex, terminal) {
    return this._cut.has(`${panelIndex}-${terminal}`);
  }

  /**
   * Cut the wire on a terminal of the showing panel
   * @returns {'cut'|'strike'|null} null means there is nothing there to cut
   */
  cut(terminal) {
    const wire = this.panel.find(item => item.terminal === terminal);
    if (!wire || this.isCut(this.panelIndex, terminal)) return null;

    this._cut.add(`${this.panelIndex}-${terminal}`);
    return wire.needsCut ? 'cut' : 'strike';
  }

  /**
   * Go to the next panel, or finish after the last one
   * @returns {'panel'|'solve'|'strike'} a strike stays on this panel
   */
  next() {
    const missed = this.panel.some(wire => wire.needsCut && !this.isCut(this.panelIndex, wire.terminal));
    if (missed) return 'strike';

    if (this.panelIndex === PANEL_COUNT - 1) return 'solve';

    this.panelIndex += 1;
    return 'panel';
  }

  /**
   * Go back a panel
   * @returns {boolean} false on the first panel
   */
  previous() {
    if (this.panelIndex === 0) return false;

    this.panelIndex -= 1;
    return true;
  }
}
