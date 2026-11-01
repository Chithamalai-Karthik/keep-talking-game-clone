/* ============================================================
   KeypadRules.test.js — Symbol columns and the press order
   ============================================================ */

import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createKeys, KEYPAD_COLUMNS, KeypadRules, matchingColumns } from '../src/js/game/rules/KeypadRules.js';

function pressAll(rules, keys) {
  return keys.map(key => rules.press(key));
}

describe('KEYPAD_COLUMNS', () => {
  it('has 6 columns of 7 different symbols', () => {
    expect(KEYPAD_COLUMNS).toHaveLength(6);
    for (const column of KEYPAD_COLUMNS) {
      expect(new Set(column).size).toBe(7);
    }
  });

  it('uses exactly the symbol images in public/assets/keypad', () => {
    const images = readdirSync('public/assets/keypad').map(file => file.replace('.png', ''));
    expect(new Set(KEYPAD_COLUMNS.flat())).toEqual(new Set(images));
    expect(images).toHaveLength(27);
  });
});

describe('createKeys', () => {
  it('always picks 4 different symbols that only one column holds', () => {
    for (let i = 0; i < 2000; i++) {
      const symbols = createKeys();
      expect(new Set(symbols).size).toBe(4);
      expect(matchingColumns(symbols)).toHaveLength(1);
    }
  });

  it('can pick from every column', () => {
    const seen = new Set();
    for (let i = 0; i < 2000; i++) {
      seen.add(KEYPAD_COLUMNS.indexOf(matchingColumns(createKeys())[0]));
    }
    expect(seen.size).toBe(6);
  });
});

describe('matchingColumns', () => {
  it('finds a set that two columns share', () => {
    const shared = ['balloon', 'dot_reversed_c', 'kai'];
    expect(matchingColumns(shared)).toEqual([KEYPAD_COLUMNS[0], KEYPAD_COLUMNS[1]]);
  });
});

describe('KeypadRules', () => {
  // Top to bottom in the first column: balloon, lambda, bolt, kai
  const makeRules = () => new KeypadRules(['kai', 'balloon', 'bolt', 'lambda']);

  it('orders keys by their place in the column, not on the keypad', () => {
    expect(makeRules().order).toEqual([1, 3, 2, 0]);
  });

  it('solves on the fourth correct press', () => {
    expect(pressAll(makeRules(), [1, 3, 2, 0])).toEqual(['correct', 'correct', 'correct', 'solve']);
  });

  it('strikes a press out of order, keeping progress', () => {
    const rules = makeRules();
    expect(pressAll(rules, [1, 2, 3, 2, 0])).toEqual(['correct', 'strike', 'correct', 'correct', 'solve']);
  });

  it('ignores a key that is already down', () => {
    const rules = makeRules();
    expect(pressAll(rules, [1, 1, 3])).toEqual(['correct', null, 'correct']);
  });
});
