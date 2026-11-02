import { describe, expect, it } from 'vitest';
import {
  COLUMN_COUNT,
  createColumns,
  LETTERS_PER_COLUMN,
  matchingWords,
  PasswordRules,
} from '../src/js/game/rules/PasswordRules.js';
import { PASSWORD_WORDS } from '../src/js/utils/constants.js';

// Written out from the manual's page 16, separately from the game's list
const MANUAL = `about after again below could every first found great house
large learn never other place plant point right small sound
spell still study their there these thing think three water
where which world would write`.split(/\s+/);

describe('Password words', () => {
  it('match the manual', () => {
    expect(PASSWORD_WORDS.map(word => word.toLowerCase())).toEqual(MANUAL);
    expect(PASSWORD_WORDS).toHaveLength(35);
  });

  it('are all five letters', () => {
    PASSWORD_WORDS.forEach(word => expect(word).toHaveLength(COLUMN_COUNT));
  });
});

describe('Password columns', () => {
  it.each(PASSWORD_WORDS)('%s can be spelled, and is the only word that can', (word) => {
    for (let i = 0; i < 40; i++) {
      expect(matchingWords(createColumns(word))).toEqual([word]);
    }
  });

  it('gives each column six different letters', () => {
    for (let i = 0; i < 100; i++) {
      createColumns('WATER').forEach((column) => {
        expect(column).toHaveLength(LETTERS_PER_COLUMN);
        expect(new Set(column).size).toBe(LETTERS_PER_COLUMN);
      });
    }
  });

  it('notices a second word in the columns', () => {
    const columns = [['T'], ['H'], ['E'], ['I', 'R'], ['R', 'E']];

    expect(matchingWords(columns).sort()).toEqual(['THEIR', 'THERE']);
  });
});

describe('Password play', () => {
  const columns = [
    ['A', 'B', 'C', 'D', 'E', 'W'],
    ['A', 'B', 'C', 'D', 'E', 'F'],
    ['T', 'B', 'C', 'D', 'E', 'F'],
    ['E', 'B', 'C', 'D', 'A', 'F'],
    ['R', 'B', 'C', 'D', 'E', 'F'],
  ];

  function setTo(rules, word) {
    [...word].forEach((letter, column) => {
      while (rules.shown[column] !== letter) rules.cycle(column, 1);
    });
  }

  it('picks a word from the list and never starts on the answer', () => {
    for (let i = 0; i < 300; i++) {
      const rules = new PasswordRules();

      expect(PASSWORD_WORDS).toContain(rules.word);
      expect(rules.shown).not.toBe(rules.word);
    }
  });

  it('cycles one column and leaves the rest', () => {
    const rules = new PasswordRules('WATER', columns);
    const before = rules.shown;
    rules.cycle(2, 1);

    expect(rules.shown[2]).not.toBe(before[2]);
    expect(rules.shown.slice(0, 2)).toBe(before.slice(0, 2));
    expect(rules.shown.slice(3)).toBe(before.slice(3));
  });

  it('wraps at both ends of a column', () => {
    const rules = new PasswordRules('WATER', columns);
    const start = rules.shown[1];

    for (let i = 0; i < LETTERS_PER_COLUMN; i++) rules.cycle(1, 1);
    expect(rules.shown[1]).toBe(start);

    for (let i = 0; i < LETTERS_PER_COLUMN; i++) rules.cycle(1, -1);
    expect(rules.shown[1]).toBe(start);
  });

  it('goes back up what it came down', () => {
    const rules = new PasswordRules('WATER', columns);
    const start = rules.shown;
    rules.cycle(3, 1);
    rules.cycle(3, -1);

    expect(rules.shown).toBe(start);
  });

  it('solves on the word', () => {
    const rules = new PasswordRules('WATER', columns);
    setTo(rules, 'WATER');

    expect(rules.submit()).toBe('solve');
  });

  it('strikes on anything else and keeps the letters', () => {
    const rules = new PasswordRules('WATER', columns);
    setTo(rules, 'BBBBB');

    expect(rules.submit()).toBe('strike');
    expect(rules.shown).toBe('BBBBB');
  });
});
