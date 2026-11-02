import { describe, expect, it } from 'vitest';
import {
  createPanels,
  LETTERS,
  PANEL_COUNT,
  shouldCut,
  TERMINALS_PER_PANEL,
  WireSequencesRules,
  WIRE_COLORS,
} from '../src/js/game/rules/WireSequencesRules.js';

// Written out from the manual's page 14, separately from the rules file
const MANUAL = {
  red: [['C'], ['B'], ['A'], ['A', 'C'], ['B'], ['A', 'C'], ['A', 'B', 'C'], ['A', 'B'], ['B']],
  blue: [['B'], ['A', 'C'], ['B'], ['A'], ['B'], ['B', 'C'], ['C'], ['A', 'C'], ['A']],
  black: [['A', 'B', 'C'], ['A', 'C'], ['B'], ['A', 'C'], ['B'], ['B', 'C'], ['A', 'B'], ['C'], ['C']],
};

describe('Wire Sequences table', () => {
  const rows = Object.entries(MANUAL).flatMap(([color, letters]) => letters.map((cut, i) => [color, i + 1, cut]));

  it.each(rows)('%s occurrence %i is cut on %j', (color, occurrence, cut) => {
    LETTERS.forEach((letter) => {
      expect(shouldCut(color, occurrence, letter)).toBe(cut.includes(letter));
    });
  });
});

describe('Wire Sequences generation', () => {
  it('fills four panels with 1 to 3 wires on different terminals', () => {
    for (let i = 0; i < 300; i++) {
      const panels = createPanels();
      expect(panels).toHaveLength(PANEL_COUNT);

      panels.forEach((panel) => {
        const terminals = panel.map(({ terminal }) => terminal);
        expect(panel.length).toBeGreaterThanOrEqual(1);
        expect(panel.length).toBeLessThanOrEqual(TERMINALS_PER_PANEL);
        expect(terminals).toEqual([...new Set(terminals)].sort((a, b) => a - b));
      });
    }
  });

  it('counts each colour across all the panels', () => {
    for (let i = 0; i < 300; i++) {
      const seen = { red: 0, blue: 0, black: 0 };

      createPanels().flat().forEach((wire) => {
        seen[wire.color] += 1;
        expect(wire.occurrence).toBe(seen[wire.color]);
        expect(wire.needsCut).toBe(shouldCut(wire.color, wire.occurrence, wire.letter));
      });
    }
  });

  it('only uses the manual colours and letters', () => {
    createPanels().flat().forEach((wire) => {
      expect(WIRE_COLORS).toContain(wire.color);
      expect(LETTERS).toContain(wire.letter);
    });
  });
});

describe('Wire Sequences play', () => {
  const wire = (terminal, needsCut) => ({ terminal, needsCut, color: 'red', letter: 'A', occurrence: 1 });
  const panels = () => [
    [wire(0, true), wire(2, false)],
    [wire(1, false)],
    [wire(0, true)],
    [wire(1, false), wire(2, true)],
  ];

  function solveAll(rules) {
    rules.panels.forEach(() => {
      rules.panel.filter(item => item.needsCut).forEach(item => rules.cut(item.terminal));
      rules.next();
    });
  }

  it('moves on once the wires that need it are cut', () => {
    const rules = new WireSequencesRules(panels());

    expect(rules.cut(0)).toBe('cut');
    expect(rules.next()).toBe('panel');
    expect(rules.panelIndex).toBe(1);
  });

  it('strikes and stays when a wire was missed', () => {
    const rules = new WireSequencesRules(panels());

    expect(rules.next()).toBe('strike');
    expect(rules.panelIndex).toBe(0);
    expect(rules.cut(0)).toBe('cut');
    expect(rules.next()).toBe('panel');
  });

  it('moves straight on from a panel with nothing to cut', () => {
    const rules = new WireSequencesRules([[wire(1, false)], ...panels().slice(1)]);

    expect(rules.next()).toBe('panel');
  });

  it('strikes on a wrong cut and carries on', () => {
    const rules = new WireSequencesRules(panels());

    expect(rules.cut(2)).toBe('strike');
    expect(rules.cut(0)).toBe('cut');
    expect(rules.next()).toBe('panel');
  });

  it('ignores a wire already cut, and a terminal with no wire', () => {
    const rules = new WireSequencesRules(panels());
    rules.cut(0);

    expect(rules.cut(0)).toBe(null);
    expect(rules.cut(1)).toBe(null);
  });

  it('solves on passing the last panel', () => {
    const rules = new WireSequencesRules(panels());
    [0, 1, 2].forEach(() => {
      rules.panel.filter(item => item.needsCut).forEach(item => rules.cut(item.terminal));
      rules.next();
    });

    rules.cut(2);
    expect(rules.next()).toBe('solve');
  });

  it('goes back, stops at the first panel, and remembers cuts', () => {
    const rules = new WireSequencesRules(panels());
    rules.cut(0);
    rules.next();

    expect(rules.previous()).toBe(true);
    expect(rules.panelIndex).toBe(0);
    expect(rules.isCut(0, 0)).toBe(true);
    expect(rules.previous()).toBe(false);
  });

  it('can be solved on any random bomb', () => {
    for (let i = 0; i < 200; i++) {
      const rules = new WireSequencesRules();
      let result;

      for (let p = 0; p < PANEL_COUNT; p++) {
        rules.panel.filter(item => item.needsCut).forEach(item => rules.cut(item.terminal));
        result = rules.next();
      }
      expect(result).toBe('solve');
    }
  });
});
