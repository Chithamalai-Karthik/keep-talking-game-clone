/* ============================================================
   SimonRules.js — Rules for the Simon Says module
   The module flashes a growing sequence. The player answers with
   the button the manual's table gives for each flash, and the
   table changes with the strike count and the serial's vowels.
   ============================================================ */

export const SIMON_COLORS = ['red', 'blue', 'green', 'yellow'];

export const MIN_STAGES = 3;
export const MAX_STAGES = 5;

export const FLASH_ON_SECONDS = 0.35;
export const FLASH_OFF_SECONDS = 0.25;
export const REPEAT_SECONDS = 3;

// Each row is one strike count: flash colour → button to press
export const VOWEL_MAP = [
  { red: 'blue', blue: 'red', green: 'yellow', yellow: 'green' },
  { red: 'yellow', blue: 'green', green: 'blue', yellow: 'red' },
  { red: 'green', blue: 'red', green: 'yellow', yellow: 'blue' },
];

export const NO_VOWEL_MAP = [
  { red: 'blue', blue: 'yellow', green: 'green', yellow: 'red' },
  { red: 'red', blue: 'blue', green: 'yellow', yellow: 'green' },
  { red: 'yellow', blue: 'green', green: 'blue', yellow: 'red' },
];

/**
 * Pick the flashes for one module
 * @returns {string[]} — 3 to 5 colours, repeats allowed
 */
export function createSequence() {
  const length = MIN_STAGES + Math.floor(Math.random() * (MAX_STAGES - MIN_STAGES + 1));
  return Array.from({ length }, () => SIMON_COLORS[Math.floor(Math.random() * SIMON_COLORS.length)]);
}

/**
 * Find the button to press for a flash
 * @param {string} flash — The flash colour
 * @param {boolean} serialHasVowel
 * @param {number} strikes — The table stops at 2, for bombs that allow more
 */
export function buttonFor(flash, serialHasVowel, strikes) {
  const map = serialHasVowel ? VOWEL_MAP : NO_VOWEL_MAP;
  return map[Math.min(strikes, map.length - 1)][flash];
}

/**
 * Plays the flashes over and over, and says which colour is lit
 */
export class FlashSequencer {
  constructor() {
    this.color = null;
    this.pause(REPEAT_SECONDS);
  }

  /**
   * Stop now, and start again from the first flash after a wait
   */
  pause(seconds) {
    this.color = null;
    this._index = 0;
    this._waitSeconds = seconds;
  }

  /**
   * @param {number} delta — Seconds since the last update
   * @param {string[]} flashes — The flashes to play
   */
  update(delta, flashes) {
    this._waitSeconds -= delta;
    if (this._waitSeconds > 0) return;

    if (this.color === null) {
      this.color = flashes[this._index];
      this._waitSeconds = FLASH_ON_SECONDS;
      return;
    }

    this.color = null;
    this._index++;
    if (this._index < flashes.length) {
      this._waitSeconds = FLASH_OFF_SECONDS;
    } else {
      this.pause(REPEAT_SECONDS);
    }
  }
}

export class SimonRules {
  /**
   * @param {string[]} sequence — The flash colours
   * @param {boolean} serialHasVowel
   */
  constructor(sequence, serialHasVowel) {
    this.sequence = sequence;
    this.serialHasVowel = serialHasVowel;
    this.stage = 1; // How many flashes are showing
    this._entered = 0;
  }

  /**
   * The flashes the module shows right now
   * @returns {string[]}
   */
  get flashes() {
    return this.sequence.slice(0, this.stage);
  }

  /**
   * Press a button. The strike count is read on every press, because a
   * strike anywhere on the bomb changes the table.
   * @returns {string} — 'correct', 'stage', 'solve' or 'strike'
   */
  press(color, strikes) {
    const flash = this.sequence[this._entered];
    if (color !== buttonFor(flash, this.serialHasVowel, strikes)) {
      this._entered = 0;
      return 'strike';
    }

    this._entered++;
    if (this._entered < this.stage) return 'correct';

    this._entered = 0;
    if (this.stage === this.sequence.length) return 'solve';

    this.stage++;
    return 'stage';
  }
}
