/* ============================================================
   PasswordRules.js — Rules for the Passwords module
   Five columns of letters can spell exactly one word from the
   manual's list. Submitting that word solves the module, and
   submitting anything else is a strike.
   ============================================================ */

import { PASSWORD_WORDS } from '../../utils/constants.js';
import { randomChoice, randomInt, shuffle } from '../../utils/helpers.js';

export const COLUMN_COUNT = 5;
export const LETTERS_PER_COLUMN = 6;

const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

/**
 * Find every listed word the columns can spell
 * @param {string[][]} columns
 * @returns {string[]}
 */
export function matchingWords(columns) {
  return PASSWORD_WORDS.filter(word => [...word].every((letter, i) => columns[i].includes(letter)));
}

function createColumn(answerLetter) {
  const others = shuffle(ALPHABET.filter(letter => letter !== answerLetter));
  return shuffle([answerLetter, ...others.slice(0, LETTERS_PER_COLUMN - 1)]);
}

/**
 * Pick letters that spell the word and no other word on the list
 * @param {string} word
 * @returns {string[][]}
 */
export function createColumns(word) {
  while (true) {
    const columns = [...word].map(createColumn);
    if (matchingWords(columns).length === 1) return columns;
  }
}

export class PasswordRules {
  /**
   * @param {string} word
   * @param {string[][]} columns
   */
  constructor(word = randomChoice(PASSWORD_WORDS), columns = createColumns(word)) {
    this.word = word;
    this.columns = columns;
    this._positions = columns.map(() => randomInt(0, LETTERS_PER_COLUMN - 1));

    // Don't start on the answer
    if (this.shown === word) this.cycle(0, 1);
  }

  /**
   * The letters showing now
   * @returns {string}
   */
  get shown() {
    return this._positions.map((position, i) => this.columns[i][position]).join('');
  }

  /**
   * Step one column along its letters, wrapping at the ends
   * @param {number} column
   * @param {number} step - 1 or -1
   */
  cycle(column, step) {
    const position = this._positions[column] + step;
    this._positions[column] = (position + LETTERS_PER_COLUMN) % LETTERS_PER_COLUMN;
  }

  /**
   * @returns {'solve'|'strike'}
   */
  submit() {
    return this.shown === this.word ? 'solve' : 'strike';
  }
}
