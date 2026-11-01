/* ============================================================
   WiresRules.test.js — Which wire to cut, and what cutting does
   ============================================================ */

import { describe, expect, it } from 'vitest';
import { correctWireIndex, createWires, WIRE_ROWS, WiresRules } from '../src/js/game/rules/WiresRules.js';
import { WIRE_COLORS } from '../src/js/utils/constants.js';

const ODD = true;
const EVEN = false;

describe('correctWireIndex', () => {
  it.each([
    // 3 wires
    ['no red: second', 'blue white black', EVEN, 1],
    ['last white: last', 'red blue white', EVEN, 2],
    ['two blue: last blue', 'blue blue red', EVEN, 1],
    ['otherwise last', 'red white black', EVEN, 2],

    // 4 wires
    ['two red, odd: last red', 'red red blue black', ODD, 1],
    ['two red, even skips that rule', 'red red white black', EVEN, 1],
    ['last yellow, no red: first', 'blue blue white yellow', ODD, 0],
    ['one blue: first', 'red white blue black', EVEN, 0],
    ['two yellow: last', 'yellow yellow red black', EVEN, 3],
    ['otherwise second', 'white black black red', EVEN, 1],

    // 5 wires
    ['last black, odd: fourth', 'red red blue white black', ODD, 3],
    ['one red, two yellow: first', 'red yellow yellow blue white', ODD, 0],
    ['last black, even skips that rule', 'red red black white black', EVEN, 0],
    ['no black: second', 'blue blue white red red', EVEN, 1],
    ['otherwise first', 'black red red white blue', EVEN, 0],

    // 6 wires
    ['no yellow, odd: third', 'red blue white black red blue', ODD, 2],
    ['one yellow, two white: fourth', 'yellow white white red blue black', ODD, 3],
    ['no red: last', 'yellow blue black white blue yellow', ODD, 5],
    ['no yellow, even, no red: last', 'blue blue white black blue white', EVEN, 5],
    ['otherwise fourth', 'yellow red blue black yellow white', EVEN, 3],
  ])('%s', (_, colors, serialOdd, index) => {
    expect(correctWireIndex(colors.split(' '), serialOdd)).toBe(index);
  });

  it('rejects a wire count the rules do not cover', () => {
    expect(() => correctWireIndex(['red', 'blue'], EVEN)).toThrow();
  });
});

describe('createWires', () => {
  const samples = Array.from({ length: 500 }, createWires);

  it('makes 3 to 6 wires in rising, unique rows', () => {
    for (const wires of samples) {
      const rows = wires.map(wire => wire.row);
      expect(wires.length).toBeGreaterThanOrEqual(3);
      expect(wires.length).toBeLessThanOrEqual(WIRE_ROWS);
      expect(rows).toEqual([...new Set(rows)].sort((a, b) => a - b));
      wires.forEach(wire => expect(WIRE_COLORS).toContain(wire.color));
    }
  });

  it('gives every wire count', () => {
    expect([...new Set(samples.map(wires => wires.length))].sort()).toEqual([3, 4, 5, 6]);
  });

  it('always has one valid wire to cut', () => {
    for (const wires of samples) {
      const { correctRow } = new WiresRules(wires, ODD);
      expect(wires.map(wire => wire.row)).toContain(correctRow);
    }
  });
});

describe('WiresRules', () => {
  // Rows with gaps: "second" means the second wire present, not row 1
  const wires = [
    { row: 1, color: 'blue' },
    { row: 3, color: 'white' },
    { row: 5, color: 'black' },
  ];

  it('counts only present wires when finding the row', () => {
    expect(new WiresRules(wires, EVEN).correctRow).toBe(3);
  });

  it('solves on the right wire and strikes on a wrong one', () => {
    const rules = new WiresRules(wires, EVEN);
    expect(rules.cut(1)).toBe('strike');
    expect(rules.cut(3)).toBe('solve');
  });

  it('ignores a wire already cut and an empty row', () => {
    const rules = new WiresRules(wires, EVEN);
    rules.cut(1);
    expect(rules.cut(1)).toBeNull();
    expect(rules.cut(0)).toBeNull();
  });
});
