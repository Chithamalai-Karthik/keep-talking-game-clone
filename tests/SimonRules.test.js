/* ============================================================
   SimonRules.test.js — Both tables, stages and strikes
   ============================================================ */

import { describe, expect, it } from 'vitest';
import {
  buttonFor,
  createSequence,
  FLASH_OFF_SECONDS,
  FLASH_ON_SECONDS,
  FlashSequencer,
  MAX_STAGES,
  MIN_STAGES,
  REPEAT_SECONDS,
  SIMON_COLORS,
  SimonRules,
} from '../src/js/game/rules/SimonRules.js';

describe('FlashSequencer', () => {
  const STEP = 0.01;

  // Runs at 100 frames a second and returns each lit spell: [colour, frames]
  function record(sequencer, flashes, seconds) {
    const spells = [];
    for (let i = 0; i < Math.round(seconds / STEP); i++) {
      const before = sequencer.color;
      sequencer.update(STEP, flashes);
      if (sequencer.color && sequencer.color !== before) spells.push([sequencer.color, i]);
    }
    return spells;
  }

  it('plays every flash in order, up to the longest sequence', () => {
    const flashes = ['red', 'blue', 'green', 'yellow', 'red'];
    const spells = record(new FlashSequencer(), flashes, REPEAT_SECONDS + 3);
    expect(spells.map(([color]) => color)).toEqual(flashes);
  });

  it('shows a repeated colour as two flashes', () => {
    const spells = record(new FlashSequencer(), ['red', 'red'], REPEAT_SECONDS + 1);
    expect(spells.map(([color]) => color)).toEqual(['red', 'red']);
  });

  it('spaces flashes by the on and off times', () => {
    const [first, second] = record(new FlashSequencer(), ['red', 'blue'], REPEAT_SECONDS + 1);
    expect((second[1] - first[1]) * STEP).toBeCloseTo(FLASH_ON_SECONDS + FLASH_OFF_SECONDS, 1);
  });

  it('waits before repeating the sequence', () => {
    const flashes = ['red', 'blue', 'green'];
    const spells = record(new FlashSequencer(), flashes, 2 * REPEAT_SECONDS + 4);
    expect(spells.map(([color]) => color)).toEqual([...flashes, ...flashes]);

    const gap = (spells[3][1] - spells[2][1]) * STEP;
    expect(gap).toBeCloseTo(FLASH_ON_SECONDS + REPEAT_SECONDS, 1);
  });

  it('goes dark and starts from the first flash after a pause', () => {
    const sequencer = new FlashSequencer();
    const flashes = ['red', 'blue', 'green'];
    record(sequencer, flashes, REPEAT_SECONDS + 0.7); // Into the second flash

    sequencer.pause(1);

    expect(sequencer.color).toBeNull();
    expect(record(sequencer, flashes, 1.2).map(([color]) => color)).toEqual(['red']);
  });
});

describe('buttonFor', () => {
  // Rows read from the manual, in its column order: red, blue, green, yellow
  const VOWEL = [
    ['blue', 'red', 'yellow', 'green'],
    ['yellow', 'green', 'blue', 'red'],
    ['green', 'red', 'yellow', 'blue'],
  ];
  const NO_VOWEL = [
    ['blue', 'yellow', 'green', 'red'],
    ['red', 'blue', 'yellow', 'green'],
    ['yellow', 'green', 'blue', 'red'],
  ];

  it.each([0, 1, 2])('matches the vowel table at %i strikes', (strikes) => {
    expect(SIMON_COLORS.map(flash => buttonFor(flash, true, strikes))).toEqual(VOWEL[strikes]);
  });

  it.each([0, 1, 2])('matches the no-vowel table at %i strikes', (strikes) => {
    expect(SIMON_COLORS.map(flash => buttonFor(flash, false, strikes))).toEqual(NO_VOWEL[strikes]);
  });

  it('stays on the last row past two strikes', () => {
    expect(buttonFor('red', true, 4)).toBe(buttonFor('red', true, 2));
  });
});

describe('createSequence', () => {
  it('is 3 to 5 known colours', () => {
    for (let i = 0; i < 200; i++) {
      const sequence = createSequence();
      expect(sequence.length).toBeGreaterThanOrEqual(MIN_STAGES);
      expect(sequence.length).toBeLessThanOrEqual(MAX_STAGES);
      sequence.forEach(color => expect(SIMON_COLORS).toContain(color));
    }
  });
});

describe('SimonRules', () => {
  // With a vowel and no strikes: red → blue, green → yellow, yellow → green
  const play = () => new SimonRules(['red', 'green', 'yellow'], true);

  it('grows one flash per finished stage, then solves', () => {
    const rules = play();
    expect(rules.flashes).toEqual(['red']);

    expect(rules.press('blue', 0)).toBe('stage');
    expect(rules.flashes).toEqual(['red', 'green']);

    expect(rules.press('blue', 0)).toBe('correct');
    expect(rules.press('yellow', 0)).toBe('stage');
    expect(rules.flashes).toEqual(['red', 'green', 'yellow']);

    expect(rules.press('blue', 0)).toBe('correct');
    expect(rules.press('yellow', 0)).toBe('correct');
    expect(rules.press('green', 0)).toBe('solve');
  });

  it('restarts the stage on a wrong press and keeps the flashes', () => {
    const rules = play();
    rules.press('blue', 0);
    rules.press('blue', 0);

    expect(rules.press('red', 0)).toBe('strike');

    expect(rules.flashes).toEqual(['red', 'green']);
    expect(rules.press('blue', 0)).toBe('correct');
  });

  it('uses the new table after a strike', () => {
    const rules = play();
    expect(rules.press('red', 0)).toBe('strike');

    expect(rules.press('blue', 1)).toBe('strike'); // Right at 0 strikes
    expect(rules.press('yellow', 2)).toBe('strike');
    expect(rules.press('green', 2)).toBe('stage');
  });

  it('follows a strike that happened elsewhere during a stage', () => {
    const rules = new SimonRules(['red', 'red', 'red'], false);
    rules.press('blue', 0);

    expect(rules.press('blue', 0)).toBe('correct');
    expect(rules.press('red', 1)).toBe('stage');
  });
});
