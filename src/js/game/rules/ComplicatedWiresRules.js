/* ============================================================
   ComplicatedWiresRules.js — Rules for the Complicated Wires module
   Each wire has colours, a light above it and maybe a star below
   it. The manual's Venn diagram says what each combination means.
   Cutting every wire that should be cut solves the module.
   ============================================================ */

import { randomInt, shuffle } from '../../utils/helpers.js';

export const WIRE_SLOTS = 6;
const MIN_WIRES = 4;

export const WIRE_COLORINGS = [
  ['white'],
  ['red'],
  ['blue'],
  ['red', 'white'],
  ['blue', 'white'],
  ['red', 'blue'],
];

// The Venn diagram's letters: Cut, Do not cut, Serial even, Parallel port, Batteries.
// The key says which of Red, Blue, Star and Light apply, in that order.
export const VENN = {
  '': 'C',
  R: 'S',
  B: 'S',
  S: 'C',
  L: 'D',
  RB: 'S',
  RS: 'C',
  RL: 'B',
  BS: 'D',
  BL: 'P',
  SL: 'B',
  RBS: 'P',
  RBL: 'S',
  RSL: 'B',
  BSL: 'P',
  RBSL: 'D',
};

/**
 * Find a wire's letter in the Venn diagram
 * @param {{colors: string[], star: boolean, lit: boolean}} wire
 * @returns {'C'|'D'|'S'|'P'|'B'}
 */
export function vennLetter({ colors, star, lit }) {
  const key = [
    colors.includes('red') && 'R',
    colors.includes('blue') && 'B',
    star && 'S',
    lit && 'L',
  ].filter(Boolean).join('');

  return VENN[key];
}

/**
 * @param {{colors: string[], star: boolean, lit: boolean}} wire
 * @param {{serialLastDigitOdd: boolean, hasParallelPort: boolean, batteries: number}} bomb
 * @returns {boolean}
 */
export function shouldCut(wire, { serialLastDigitOdd, hasParallelPort, batteries }) {
  switch (vennLetter(wire)) {
    case 'C': return true;
    case 'S': return !serialLastDigitOdd;
    case 'P': return hasParallelPort;
    case 'B': return batteries >= 2;
    default: return false;
  }
}

function createWire(slot) {
  return {
    slot,
    colors: WIRE_COLORINGS[randomInt(0, WIRE_COLORINGS.length - 1)],
    star: Math.random() < 0.5,
    lit: Math.random() < 0.5,
  };
}

/**
 * Pick random wires. At least one must need cutting, or the module couldn't be solved.
 * @param {Object} bomb - see shouldCut
 * @returns {Array} wires in slot order
 */
export function createWires(bomb) {
  const count = randomInt(MIN_WIRES, WIRE_SLOTS);
  const slots = Array.from({ length: WIRE_SLOTS }, (_, i) => i);

  while (true) {
    const wires = shuffle(slots).slice(0, count).sort((a, b) => a - b).map(createWire);
    if (wires.some(wire => shouldCut(wire, bomb))) return wires;
  }
}

export class ComplicatedWiresRules {
  /**
   * @param {Array} wires
   * @param {Object} bomb - see shouldCut
   */
  constructor(wires, bomb) {
    this.wires = wires;
    this._needed = new Set(wires.filter(wire => shouldCut(wire, bomb)).map(wire => wire.slot));
    this._cut = new Set();
  }

  /**
   * Cut the wire in a slot
   * @returns {'stage'|'solve'|'strike'|null} 'stage' is a right cut with more to go;
   *   null means there is nothing there to cut
   */
  cut(slot) {
    if (this._cut.has(slot) || !this.wires.some(wire => wire.slot === slot)) return null;

    this._cut.add(slot);
    if (!this._needed.has(slot)) return 'strike';

    this._needed.delete(slot);
    return this._needed.size === 0 ? 'solve' : 'stage';
  }
}
