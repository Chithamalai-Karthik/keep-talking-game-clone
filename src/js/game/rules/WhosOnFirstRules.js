/* ============================================================
   WhosOnFirstRules.js — Rules for the Who's on First module
   The display says which button's label to read, and that label's
   list says which button to push. Three correct pushes solve it.
   ============================================================ */

import { shuffle } from '../../utils/helpers.js';

export const BUTTON_COUNT = 6;
export const STAGE_COUNT = 3;

// Button positions: 0 1 / 2 3 / 4 5, left to right, top to bottom
export const DISPLAY_POSITIONS = {
  YES: 2, FIRST: 1, DISPLAY: 5, OKAY: 1, SAYS: 5, NOTHING: 2,
  '': 4, BLANK: 3, NO: 5, LED: 2, LEAD: 5, READ: 3,
  RED: 3, REED: 4, LEED: 4, 'HOLD ON': 5, YOU: 3, 'YOU ARE': 5,
  YOUR: 3, "YOU'RE": 3, UR: 0, THERE: 5, "THEY'RE": 4, THEIR: 3,
  'THEY ARE': 2, SEE: 5, C: 1, CEE: 5,
};

export const LABEL_LISTS = {
  READY: ['YES', 'OKAY', 'WHAT', 'MIDDLE', 'LEFT', 'PRESS', 'RIGHT', 'BLANK', 'READY', 'NO', 'FIRST', 'UHHH', 'NOTHING', 'WAIT'],
  FIRST: ['LEFT', 'OKAY', 'YES', 'MIDDLE', 'NO', 'RIGHT', 'NOTHING', 'UHHH', 'WAIT', 'READY', 'BLANK', 'WHAT', 'PRESS', 'FIRST'],
  NO: ['BLANK', 'UHHH', 'WAIT', 'FIRST', 'WHAT', 'READY', 'RIGHT', 'YES', 'NOTHING', 'LEFT', 'PRESS', 'OKAY', 'NO', 'MIDDLE'],
  BLANK: ['WAIT', 'RIGHT', 'OKAY', 'MIDDLE', 'BLANK', 'PRESS', 'READY', 'NOTHING', 'NO', 'WHAT', 'LEFT', 'UHHH', 'YES', 'FIRST'],
  NOTHING: ['UHHH', 'RIGHT', 'OKAY', 'MIDDLE', 'YES', 'BLANK', 'NO', 'PRESS', 'LEFT', 'WHAT', 'WAIT', 'FIRST', 'NOTHING', 'READY'],
  YES: ['OKAY', 'RIGHT', 'UHHH', 'MIDDLE', 'FIRST', 'WHAT', 'PRESS', 'READY', 'NOTHING', 'YES', 'LEFT', 'BLANK', 'NO', 'WAIT'],
  WHAT: ['UHHH', 'WHAT', 'LEFT', 'NOTHING', 'READY', 'BLANK', 'MIDDLE', 'NO', 'OKAY', 'FIRST', 'WAIT', 'YES', 'PRESS', 'RIGHT'],
  UHHH: ['READY', 'NOTHING', 'LEFT', 'WHAT', 'OKAY', 'YES', 'RIGHT', 'NO', 'PRESS', 'BLANK', 'UHHH', 'MIDDLE', 'WAIT', 'FIRST'],
  LEFT: ['RIGHT', 'LEFT', 'FIRST', 'NO', 'MIDDLE', 'YES', 'BLANK', 'WHAT', 'UHHH', 'WAIT', 'PRESS', 'READY', 'OKAY', 'NOTHING'],
  RIGHT: ['YES', 'NOTHING', 'READY', 'PRESS', 'NO', 'WAIT', 'WHAT', 'RIGHT', 'MIDDLE', 'LEFT', 'UHHH', 'BLANK', 'OKAY', 'FIRST'],
  MIDDLE: ['BLANK', 'READY', 'OKAY', 'WHAT', 'NOTHING', 'PRESS', 'NO', 'WAIT', 'LEFT', 'MIDDLE', 'RIGHT', 'FIRST', 'UHHH', 'YES'],
  OKAY: ['MIDDLE', 'NO', 'FIRST', 'YES', 'UHHH', 'NOTHING', 'WAIT', 'OKAY', 'LEFT', 'READY', 'BLANK', 'PRESS', 'WHAT', 'RIGHT'],
  WAIT: ['UHHH', 'NO', 'BLANK', 'OKAY', 'YES', 'LEFT', 'FIRST', 'PRESS', 'WHAT', 'WAIT', 'NOTHING', 'READY', 'RIGHT', 'MIDDLE'],
  PRESS: ['RIGHT', 'MIDDLE', 'YES', 'READY', 'PRESS', 'OKAY', 'NOTHING', 'UHHH', 'BLANK', 'LEFT', 'FIRST', 'WHAT', 'NO', 'WAIT'],
  YOU: ['SURE', 'YOU ARE', 'YOUR', "YOU'RE", 'NEXT', 'UH HUH', 'UR', 'HOLD', 'WHAT?', 'YOU', 'UH UH', 'LIKE', 'DONE', 'U'],
  'YOU ARE': ['YOUR', 'NEXT', 'LIKE', 'UH HUH', 'WHAT?', 'DONE', 'UH UH', 'HOLD', 'YOU', 'U', "YOU'RE", 'SURE', 'UR', 'YOU ARE'],
  YOUR: ['UH UH', 'YOU ARE', 'UH HUH', 'YOUR', 'NEXT', 'UR', 'SURE', 'U', "YOU'RE", 'YOU', 'WHAT?', 'HOLD', 'LIKE', 'DONE'],
  "YOU'RE": ['YOU', "YOU'RE", 'UR', 'NEXT', 'UH UH', 'YOU ARE', 'U', 'YOUR', 'WHAT?', 'UH HUH', 'SURE', 'DONE', 'LIKE', 'HOLD'],
  UR: ['DONE', 'U', 'UR', 'UH HUH', 'WHAT?', 'SURE', 'YOUR', 'HOLD', "YOU'RE", 'LIKE', 'NEXT', 'UH UH', 'YOU ARE', 'YOU'],
  U: ['UH HUH', 'SURE', 'NEXT', 'WHAT?', "YOU'RE", 'UR', 'UH UH', 'DONE', 'U', 'YOU', 'LIKE', 'HOLD', 'YOU ARE', 'YOUR'],
  'UH HUH': ['UH HUH', 'YOUR', 'YOU ARE', 'YOU', 'DONE', 'HOLD', 'UH UH', 'NEXT', 'SURE', 'LIKE', "YOU'RE", 'UR', 'U', 'WHAT?'],
  'UH UH': ['UR', 'U', 'YOU ARE', "YOU'RE", 'NEXT', 'UH UH', 'DONE', 'YOU', 'UH HUH', 'LIKE', 'YOUR', 'SURE', 'HOLD', 'WHAT?'],
  'WHAT?': ['YOU', 'HOLD', "YOU'RE", 'YOUR', 'U', 'DONE', 'UH UH', 'LIKE', 'YOU ARE', 'UH HUH', 'UR', 'NEXT', 'WHAT?', 'SURE'],
  DONE: ['SURE', 'UH HUH', 'NEXT', 'WHAT?', 'YOUR', 'UR', "YOU'RE", 'HOLD', 'LIKE', 'YOU', 'U', 'YOU ARE', 'UH UH', 'DONE'],
  NEXT: ['WHAT?', 'UH HUH', 'UH UH', 'YOUR', 'HOLD', 'SURE', 'NEXT', 'LIKE', 'DONE', 'YOU ARE', 'UR', "YOU'RE", 'U', 'YOU'],
  HOLD: ['YOU ARE', 'U', 'DONE', 'UH UH', 'YOU', 'UR', 'SURE', 'WHAT?', "YOU'RE", 'NEXT', 'HOLD', 'UH HUH', 'YOUR', 'LIKE'],
  SURE: ['YOU ARE', 'DONE', 'LIKE', "YOU'RE", 'YOU', 'HOLD', 'UH HUH', 'UR', 'SURE', 'U', 'WHAT?', 'NEXT', 'YOUR', 'UH UH'],
  LIKE: ["YOU'RE", 'NEXT', 'U', 'UR', 'HOLD', 'DONE', 'UH UH', 'WHAT?', 'UH HUH', 'YOU', 'LIKE', 'SURE', 'YOU ARE', 'YOUR'],
};

// The lists fall into two groups of 14 words, and each list only names its own group
const allLabels = Object.keys(LABEL_LISTS);
export const LABEL_GROUPS = [allLabels.slice(0, 14), allLabels.slice(14)];

/**
 * Pick a display word and six button labels from one group
 * @returns {{display: string, labels: string[]}}
 */
export function createStage() {
  const displays = Object.keys(DISPLAY_POSITIONS);
  const group = LABEL_GROUPS[Math.floor(Math.random() * LABEL_GROUPS.length)];

  return {
    display: displays[Math.floor(Math.random() * displays.length)],
    labels: shuffle(group).slice(0, BUTTON_COUNT),
  };
}

/**
 * Find the button to push
 * @returns {number} — The button's position
 */
export function correctButton({ display, labels }) {
  const label = labels[DISPLAY_POSITIONS[display]];
  const answer = LABEL_LISTS[label].find(word => labels.includes(word));
  return labels.indexOf(answer);
}

export class WhosOnFirstRules {
  /**
   * @param {Function} nextStage — Makes each stage's display and labels
   */
  constructor(nextStage = createStage) {
    this._nextStage = nextStage;
    this.stage = nextStage();
    this.stagesDone = 0;
  }

  /**
   * Push a button. A strike keeps the stage count but brings new words.
   * @returns {string} — 'stage', 'solve' or 'strike'
   */
  press(button) {
    if (button !== correctButton(this.stage)) {
      this.stage = this._nextStage();
      return 'strike';
    }

    this.stagesDone++;
    if (this.stagesDone === STAGE_COUNT) return 'solve';

    this.stage = this._nextStage();
    return 'stage';
  }
}
