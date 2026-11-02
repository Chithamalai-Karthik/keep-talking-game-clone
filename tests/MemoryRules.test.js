import { describe, expect, it } from 'vitest';
import {
  correctButton,
  createStage,
  MemoryRules,
  STAGE_COUNT,
} from '../src/js/game/rules/MemoryRules.js';

const labels = [3, 1, 4, 2]; // Label 1 at position 1, 2 at 3, 3 at 0, 4 at 2

// Earlier pushes, chosen so that each stage's position and label are different
const pressed = [
  { position: 1, label: 4 }, // Stage 1
  { position: 3, label: 1 }, // Stage 2
  { position: 0, label: 2 }, // Stage 3
  { position: 2, label: 3 }, // Stage 4
];

describe('Memory answers follow the manual', () => {
  const cases = [
    // Stage, display, button
    [1, 1, 1], [1, 2, 1], [1, 3, 2], [1, 4, 3],
    [2, 1, 2], [2, 2, 1], [2, 3, 0], [2, 4, 1], // Display 1: labelled 4
    [3, 1, 1], [3, 2, 2], [3, 3, 2], [3, 4, 2], // Displays 1, 2: labels 1, 4
    [4, 1, 1], [4, 2, 0], [4, 3, 3], [4, 4, 3],
    [5, 1, 2], [5, 2, 1], [5, 3, 0], [5, 4, 3], // Labels 4, 1, 3, 2
  ];

  it.each(cases)('stage %i, display %i: button %i', (stage, display, button) => {
    expect(correctButton(stage, { display, labels }, pressed)).toBe(button);
  });
});

describe('Memory stages', () => {
  it('shows a display of 1 to 4 and all four labels once', () => {
    for (let i = 0; i < 200; i++) {
      const stage = createStage();
      expect([1, 2, 3, 4]).toContain(stage.display);
      expect([...stage.labels].sort()).toEqual([1, 2, 3, 4]);
    }
  });

  const pressRight = (rules) => rules.press(correctButton(rules.stagesDone + 1, rules.stage, rules.pressed));

  it('solves after five right pushes and remembers each one', () => {
    const rules = new MemoryRules();

    for (let i = 1; i < STAGE_COUNT; i++) {
      expect(pressRight(rules)).toBe('stage');
      expect(rules.stagesDone).toBe(i);
    }
    const { labels: lastLabels } = rules.stage;
    const button = correctButton(STAGE_COUNT, rules.stage, rules.pressed);

    expect(pressRight(rules)).toBe('solve');
    expect(rules.pressed[STAGE_COUNT - 1]).toEqual({ position: button, label: lastLabels[button] });
  });

  it('goes back to stage 1 on a wrong push and forgets the earlier pushes', () => {
    const rules = new MemoryRules();
    pressRight(rules);
    pressRight(rules);

    const right = correctButton(3, rules.stage, rules.pressed);

    expect(rules.press((right + 1) % 4)).toBe('strike');
    expect(rules.stagesDone).toBe(0);
    expect(rules.pressed).toEqual([]);
  });

  it('can be solved after a strike', () => {
    const rules = new MemoryRules();
    const right = correctButton(1, rules.stage, rules.pressed);
    rules.press((right + 1) % 4);

    for (let i = 1; i < STAGE_COUNT; i++) pressRight(rules);

    expect(pressRight(rules)).toBe('solve');
  });
});
