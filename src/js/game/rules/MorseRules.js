/* ============================================================
   MorseRules.js — Rules for the Morse Code module
   A lamp spells a word on a loop. The Defuser sets the frequency
   the manual gives for that word and presses transmit.
   ============================================================ */

import { randomChoice } from '../../utils/helpers.js';

// Frequencies in kHz, so they stay exact
export const WORD_FREQUENCIES = {
  shell: 3505, halls: 3515, slick: 3522, trick: 3532,
  boxes: 3535, leaks: 3542, strobe: 3545, bistro: 3552,
  flick: 3555, bombs: 3565, break: 3572, brick: 3575,
  steak: 3582, sting: 3592, vector: 3595, beats: 3600,
};

export const FREQUENCIES = Object.values(WORD_FREQUENCIES);
export const WORDS = Object.keys(WORD_FREQUENCIES);

export const MORSE_CHART = {
  a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.',
  h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.',
  o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-',
  v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..',
};

// No word uses digits, but the chart in the Expert manual shows them
export const MORSE_DIGITS = {
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
};

export const DOT_SECONDS = 0.25;
export const DASH_SECONDS = 0.75;
export const SYMBOL_GAP_SECONDS = 0.25; // Within a letter
export const LETTER_GAP_SECONDS = 0.75;
export const REPEAT_GAP_SECONDS = 3;

/**
 * Turn a word into timed lamp steps, ending with the wait before it repeats
 * @param {string} word
 * @returns {{lit: boolean, seconds: number}[]}
 */
export function signalSteps(word) {
  const steps = [];

  [...word].forEach((letter) => {
    [...MORSE_CHART[letter]].forEach((symbol) => {
      steps.push({ lit: true, seconds: symbol === '.' ? DOT_SECONDS : DASH_SECONDS });
      steps.push({ lit: false, seconds: SYMBOL_GAP_SECONDS });
    });
    steps[steps.length - 1].seconds = LETTER_GAP_SECONDS;
  });
  steps[steps.length - 1].seconds = REPEAT_GAP_SECONDS;

  return steps;
}

export class MorseSignal {
  /**
   * @param {string} word
   */
  constructor(word) {
    this._steps = signalSteps(word);
    this._index = 0;
    this._left = this._steps[0].seconds;
  }

  get lit() {
    return this._steps[this._index].lit;
  }

  /**
   * @param {number} delta - seconds since the last update
   */
  update(delta) {
    this._left -= delta;

    // A slow frame can pass more than one step
    while (this._left <= 0) {
      this._index = (this._index + 1) % this._steps.length;
      this._left += this._steps[this._index].seconds;
    }
  }
}

export class MorseRules {
  /**
   * @param {string} word
   */
  constructor(word = randomChoice(WORDS)) {
    this.word = word;
    this._index = 0;
  }

  /**
   * The frequency showing, in kHz
   */
  get frequency() {
    return FREQUENCIES[this._index];
  }

  /**
   * Step along the frequencies, stopping at each end
   * @param {number} direction - -1 or 1
   */
  tune(direction) {
    const last = FREQUENCIES.length - 1;
    this._index = Math.min(Math.max(this._index + direction, 0), last);
  }

  /**
   * @returns {'solve'|'strike'}
   */
  transmit() {
    return this.frequency === WORD_FREQUENCIES[this.word] ? 'solve' : 'strike';
  }
}
