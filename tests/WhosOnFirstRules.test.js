/* ============================================================
   WhosOnFirstRules.test.js — The manual's tables, and the stages
   ============================================================ */

import { describe, expect, it } from 'vitest';
import {
  BUTTON_COUNT,
  correctButton,
  createStage,
  DISPLAY_POSITIONS,
  LABEL_GROUPS,
  LABEL_LISTS,
  STAGE_COUNT,
  WhosOnFirstRules,
} from '../src/js/game/rules/WhosOnFirstRules.js';

describe('tables', () => {
  it('has all 28 displays, including the empty one', () => {
    expect(Object.keys(DISPLAY_POSITIONS)).toHaveLength(28);
    expect(DISPLAY_POSITIONS['']).toBe(4);
  });

  it('has two groups of 14 labels', () => {
    expect(LABEL_GROUPS.map(group => group.length)).toEqual([14, 14]);
  });

  it('lists every word of its own group exactly once', () => {
    for (const group of LABEL_GROUPS) {
      for (const label of group) {
        expect([...LABEL_LISTS[label]].sort()).toEqual([...group].sort());
      }
    }
  });
});

describe('correctButton', () => {
  const labels = ['READY', 'FIRST', 'NO', 'BLANK', 'NOTHING', 'YES'];

  it('reads the label the display points at, then takes the first match', () => {
    // YES points at button 2, NO. Its list starts BLANK, so button 3.
    expect(correctButton({ display: 'YES', labels })).toBe(3);
  });

  it('skips list words that are not on the module', () => {
    // UR points at button 0, READY. Its list starts YES, so button 5.
    expect(correctButton({ display: 'UR', labels })).toBe(5);
  });

  it('can be the label that was read', () => {
    const own = ['UH HUH', 'YOUR', 'NEXT', 'SURE', 'LIKE', 'DONE'];
    expect(correctButton({ display: 'UR', labels: own })).toBe(0);
  });

  it('handles the empty display', () => {
    // Empty points at button 4, NOTHING. Its list has YES first of those here.
    expect(correctButton({ display: '', labels })).toBe(5);
  });
});

describe('createStage', () => {
  it('always has six different labels from one group, and an answer', () => {
    for (let i = 0; i < 500; i++) {
      const stage = createStage();
      expect(new Set(stage.labels).size).toBe(BUTTON_COUNT);
      expect(LABEL_GROUPS.some(group => stage.labels.every(label => group.includes(label)))).toBe(true);
      expect(correctButton(stage)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('WhosOnFirstRules', () => {
  const solveStage = rules => rules.press(correctButton(rules.stage));
  const wrongButton = stage => (correctButton(stage) + 1) % BUTTON_COUNT;

  it('solves after three correct pushes', () => {
    const rules = new WhosOnFirstRules();
    expect(solveStage(rules)).toBe('stage');
    expect(solveStage(rules)).toBe('stage');
    expect(solveStage(rules)).toBe('solve');
    expect(rules.stagesDone).toBe(STAGE_COUNT);
  });

  it('keeps finished stages on a strike, and brings new words', () => {
    let made = 0;
    const stages = [
      { display: 'YES', labels: ['READY', 'FIRST', 'NO', 'BLANK', 'NOTHING', 'YES'] },
      { display: 'UR', labels: ['READY', 'FIRST', 'NO', 'BLANK', 'NOTHING', 'YES'] },
      { display: 'NO', labels: ['READY', 'FIRST', 'NO', 'BLANK', 'NOTHING', 'YES'] },
    ];
    const rules = new WhosOnFirstRules(() => stages[made++]);
    solveStage(rules);

    expect(rules.press(wrongButton(rules.stage))).toBe('strike');

    expect(rules.stagesDone).toBe(1);
    expect(rules.stage).toBe(stages[2]);
  });
});
