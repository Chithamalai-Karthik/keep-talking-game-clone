/* ============================================================
   MemoryRules.js — Rules for the Memory module
   The display and the stage say which button to push, often by
   what was pushed earlier. Five correct pushes solve it, and a
   wrong push goes back to stage 1.
   ============================================================ */

import { randomInt, shuffle } from '../../utils/helpers.js';

export const BUTTON_COUNT = 4;
export const STAGE_COUNT = 5;

const LABELS = [1, 2, 3, 4];

// How each answer is found
const position = (index) => ({ position: index });
const label = (value) => ({ label: value });
const samePosition = (stage) => ({ samePositionAs: stage });
const sameLabel = (stage) => ({ sameLabelAs: stage });

// MEMORY_RULES[stage][display], stage and display counted from 1 as in the manual
export const MEMORY_RULES = {
  1: { 1: position(1), 2: position(1), 3: position(2), 4: position(3) },
  2: { 1: label(4), 2: samePosition(1), 3: position(0), 4: samePosition(1) },
  3: { 1: sameLabel(2), 2: sameLabel(1), 3: position(2), 4: label(4) },
  4: { 1: samePosition(1), 2: position(0), 3: samePosition(2), 4: samePosition(2) },
  5: { 1: sameLabel(1), 2: sameLabel(2), 3: sameLabel(4), 4: sameLabel(3) },
};

/**
 * Pick a display digit and an order for the four labels
 * @returns {{display: number, labels: number[]}}
 */
export function createStage() {
  return { display: randomInt(1, 4), labels: shuffle(LABELS) };
}

/**
 * Which button is right
 * @param {number} stageNumber - 1 to 5
 * @param {{display: number, labels: number[]}} stage
 * @param {{position: number, label: number}[]} pressed - earlier right pushes, stage 1 first
 * @returns {number} button position, 0 to 3
 */
export function correctButton(stageNumber, { display, labels }, pressed) {
  const rule = MEMORY_RULES[stageNumber][display];

  if ('position' in rule) return rule.position;
  if ('label' in rule) return labels.indexOf(rule.label);
  if ('samePositionAs' in rule) return pressed[rule.samePositionAs - 1].position;
  return labels.indexOf(pressed[rule.sameLabelAs - 1].label);
}

export class MemoryRules {
  constructor() {
    this._restart();
  }

  get stagesDone() {
    return this.pressed.length;
  }

  /**
   * @param {number} button - position, 0 to 3
   * @returns {'stage'|'solve'|'strike'}
   */
  press(button) {
    const stageNumber = this.stagesDone + 1;

    if (button !== correctButton(stageNumber, this.stage, this.pressed)) {
      this._restart();
      return 'strike';
    }

    this.pressed.push({ position: button, label: this.stage.labels[button] });
    if (this.stagesDone === STAGE_COUNT) return 'solve';

    this.stage = createStage();
    return 'stage';
  }

  _restart() {
    this.pressed = [];
    this.stage = createStage();
  }
}
