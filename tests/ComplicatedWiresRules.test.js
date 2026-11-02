import { describe, expect, it } from 'vitest';
import {
  ComplicatedWiresRules,
  createWires,
  shouldCut,
  vennLetter,
  WIRE_COLORINGS,
  WIRE_SLOTS,
} from '../src/js/game/rules/ComplicatedWiresRules.js';

const wire = (colors, star = false, lit = false, slot = 0) => ({ slot, colors, star, lit });

const ALWAYS = { serialLastDigitOdd: false, hasParallelPort: true, batteries: 2 };
const NEVER = { serialLastDigitOdd: true, hasParallelPort: false, batteries: 1 };

describe('Complicated Wires Venn diagram', () => {
  // Colours, star, light, letter: all 16 regions of the manual's diagram
  const regions = [
    [['white'], false, false, 'C'],
    [['red'], false, false, 'S'],
    [['blue'], false, false, 'S'],
    [['white'], true, false, 'C'],
    [['white'], false, true, 'D'],
    [['red', 'blue'], false, false, 'S'],
    [['red'], true, false, 'C'],
    [['red'], false, true, 'B'],
    [['blue'], true, false, 'D'],
    [['blue'], false, true, 'P'],
    [['white'], true, true, 'B'],
    [['red', 'blue'], true, false, 'P'],
    [['red', 'blue'], false, true, 'S'],
    [['red'], true, true, 'B'],
    [['blue'], true, true, 'P'],
    [['red', 'blue'], true, true, 'D'],
  ];

  it.each(regions)('%j, star %s, light %s: %s', (colors, star, lit, letter) => {
    expect(vennLetter(wire(colors, star, lit))).toBe(letter);
  });

  it('treats a white stripe as no colour at all', () => {
    expect(vennLetter(wire(['red', 'white']))).toBe(vennLetter(wire(['red'])));
    expect(vennLetter(wire(['blue', 'white'], true, true))).toBe(vennLetter(wire(['blue'], true, true)));
  });
});

describe('Complicated Wires instructions', () => {
  const cut = wire(['white']); // C
  const leave = wire(['white'], false, true); // D
  const serial = wire(['red']); // S
  const parallel = wire(['blue'], false, true); // P
  const battery = wire(['red'], false, true); // B

  it('always cuts C and never cuts D', () => {
    [ALWAYS, NEVER].forEach((bomb) => {
      expect(shouldCut(cut, bomb)).toBe(true);
      expect(shouldCut(leave, bomb)).toBe(false);
    });
  });

  it('cuts S on an even last serial digit', () => {
    expect(shouldCut(serial, { ...NEVER, serialLastDigitOdd: false })).toBe(true);
    expect(shouldCut(serial, { ...ALWAYS, serialLastDigitOdd: true })).toBe(false);
  });

  it('cuts P with a parallel port', () => {
    expect(shouldCut(parallel, { ...NEVER, hasParallelPort: true })).toBe(true);
    expect(shouldCut(parallel, { ...ALWAYS, hasParallelPort: false })).toBe(false);
  });

  it('cuts B with two or more batteries', () => {
    expect(shouldCut(battery, { ...NEVER, batteries: 2 })).toBe(true);
    expect(shouldCut(battery, { ...NEVER, batteries: 3 })).toBe(true);
    expect(shouldCut(battery, { ...ALWAYS, batteries: 1 })).toBe(false);
    expect(shouldCut(battery, { ...ALWAYS, batteries: 0 })).toBe(false);
  });
});

describe('Complicated Wires generation', () => {
  it('uses 4 to 6 slots in order, with known colourings', () => {
    for (let i = 0; i < 300; i++) {
      const wires = createWires(ALWAYS);
      const slots = wires.map(({ slot }) => slot);

      expect(wires.length).toBeGreaterThanOrEqual(4);
      expect(wires.length).toBeLessThanOrEqual(WIRE_SLOTS);
      expect(slots).toEqual([...new Set(slots)].sort((a, b) => a - b));
      wires.forEach(({ colors }) => expect(WIRE_COLORINGS).toContainEqual(colors));
    }
  });

  it('always leaves at least one wire to cut, even on the hardest bomb', () => {
    for (let i = 0; i < 500; i++) {
      expect(createWires(NEVER).some(item => shouldCut(item, NEVER))).toBe(true);
    }
  });
});

describe('Complicated Wires cutting', () => {
  const wires = [
    wire(['white'], false, false, 0), // C
    wire(['white'], false, true, 2), // D
    wire(['white'], true, false, 4), // C
  ];

  it('solves once every wire that needs it is cut', () => {
    const rules = new ComplicatedWiresRules(wires, NEVER);

    expect(rules.cut(0)).toBe('stage');
    expect(rules.cut(4)).toBe('solve');
  });

  it('strikes on a wrong cut and can still be solved', () => {
    const rules = new ComplicatedWiresRules(wires, NEVER);

    expect(rules.cut(2)).toBe('strike');
    expect(rules.cut(0)).toBe('stage');
    expect(rules.cut(4)).toBe('solve');
  });

  it('ignores a wire already cut, and a slot with no wire', () => {
    const rules = new ComplicatedWiresRules(wires, NEVER);
    rules.cut(2);
    rules.cut(0);

    expect(rules.cut(2)).toBe(null);
    expect(rules.cut(0)).toBe(null);
    expect(rules.cut(1)).toBe(null);
  });
});
