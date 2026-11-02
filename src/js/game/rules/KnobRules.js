/* ============================================================
   KnobRules.js — Rules for the Knob needy module
   Twelve lights show a pattern, and the pattern says where the
   knob must point when the time runs out. That direction is
   relative to the UP label, which may have been turned.
   ============================================================ */

import { randomChoice, randomInt } from '../../utils/helpers.js';

export const LED_COLUMNS = 6;
export const LED_ROWS = 2;

// Clockwise from the top, so a turn of the knob is one step along
export const KNOB_POSITIONS = ['up', 'right', 'down', 'left'];

// The manual's two patterns for each position, top row then bottom row
export const KNOB_PATTERNS = {
  up: [['..X.XX', 'XXXX.X'], ['X.X.X.', '.XX.XX']],
  down: [['.XX..X', 'XXXX.X'], ['X.X.X.', '.X...X']],
  left: [['....X.', 'X..XXX'], ['....X.', '...XX.']],
  right: [['X.XXXX', 'XXX.X.'], ['X.XX..', 'XXX.X.']],
};

export class KnobRules {
  /**
   * @param {number} labelTurns - quarter turns clockwise of the UP label
   * @param {number} knobTurns - quarter turns clockwise of the knob
   */
  constructor(labelTurns = randomInt(0, 3), knobTurns = randomInt(0, 3)) {
    this.labelTurns = labelTurns;
    this.knobTurns = knobTurns;
    this.pickPattern();
  }

  /**
   * Choose what the lights will ask for this time
   */
  pickPattern(answer = randomChoice(KNOB_POSITIONS)) {
    this.answer = answer;
    this.pattern = randomChoice(KNOB_PATTERNS[answer]);
  }

  /**
   * Is a light on?
   */
  isLit(row, column) {
    return this.pattern[row][column] === 'X';
  }

  /**
   * Turn the knob a quarter clockwise
   */
  turn() {
    this.knobTurns = (this.knobTurns + 1) % KNOB_POSITIONS.length;
  }

  /**
   * Where the knob points, as read against the UP label
   */
  get position() {
    const count = KNOB_POSITIONS.length;
    return KNOB_POSITIONS[(this.knobTurns - this.labelTurns + count) % count];
  }

  get isCorrect() {
    return this.position === this.answer;
  }
}
