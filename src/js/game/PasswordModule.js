/* ============================================================
   PasswordModule.js — The Passwords module on the bomb
   Blender holds the green screen and its five cells, a round
   button above and below each (part_pw_up_<n>, part_pw_down_<n>)
   and part_pw_submit. The letters are text laid on top.
   ============================================================ */

import { ModuleBase } from './ModuleBase.js';
import { ModuleManager } from './ModuleManager.js';
import { LABEL_COLOR, LABEL_FONT } from './StagedButtonModule.js';
import { COLUMN_COUNT, PasswordRules } from './rules/PasswordRules.js';
import { playSound } from '../audio/Sounds.js';
import { createTextLabel, disposeTextLabel } from '../three/TextLabel.js';
import { MODULE_NAMES, MODULE_TYPES } from '../utils/constants.js';

const UP_PREFIX = 'pw_up_';
const DOWN_PREFIX = 'pw_down_';
const SUBMIT_PART = 'pw_submit';

const CELL_PITCH = 0.11;
const LETTER_Y = 0.02;
const LETTER_Z = 0.0905; // Just above the cells
const LETTER_SIZE = 0.16;
const LETTER_STYLE = { color: '#123a0a', font: 'bold 340px monospace' };

const SUBMIT_WIDTH = 0.19;
const SUBMIT_HEIGHT = 0.07;
const SUBMIT_LIFT = 0.0165; // Just above the button's face
const SUBMIT_STYLE = { color: LABEL_COLOR, font: `135px ${LABEL_FONT}` };

const PRESS_SECONDS = 0.15;
const PRESS_DEPTH = 0.01;

class PasswordModule extends ModuleBase {
  setup() {
    this.moduleName = MODULE_NAMES[MODULE_TYPES.PASSWORDS];
    this.modelName = 'password_module';
    this.rules = new PasswordRules();

    this._body = null;
    this._letters = [];
    this._submitText = null;
    this._pressed = null;
    this._pressSeconds = 0;
  }

  build(body) {
    this._body = body;

    this._restZ = new Map();
    this.parts.forEach((mesh, partId) => this._restZ.set(partId, mesh.position.z));

    this._submitText = createTextLabel('SUBMIT', SUBMIT_WIDTH, SUBMIT_HEIGHT, SUBMIT_STYLE);
    this._submitText.position.z = SUBMIT_LIFT;
    this.parts.get(SUBMIT_PART).add(this._submitText);

    for (let column = 0; column < COLUMN_COUNT; column++) this._showLetter(column);
  }

  onPartClick(partId) {
    playSound('press');
    this._showPress(partId);

    if (partId === SUBMIT_PART) {
      if (this.rules.submit() === 'solve') this.solve();
      else this.strike();
      return;
    }

    const up = partId.startsWith(UP_PREFIX);
    const column = Number(partId.slice((up ? UP_PREFIX : DOWN_PREFIX).length));
    this.rules.cycle(column, up ? -1 : 1);
    this._showLetter(column);
  }

  update(delta) {
    if (!this._pressed) return;

    this._pressSeconds -= delta;
    if (this._pressSeconds <= 0) this._endPress();
  }

  dispose() {
    this._letters.forEach(disposeTextLabel);
    this._letters = [];
    if (this._submitText) disposeTextLabel(this._submitText);
    super.dispose();
  }

  _showLetter(column) {
    if (this._letters[column]) disposeTextLabel(this._letters[column]);

    const letter = createTextLabel(this.rules.shown[column], LETTER_SIZE, LETTER_SIZE, LETTER_STYLE);
    letter.position.set((column - (COLUMN_COUNT - 1) / 2) * CELL_PITCH, LETTER_Y, LETTER_Z);
    this._body.add(letter);
    this._letters[column] = letter;
  }

  _showPress(partId) {
    if (this._pressed) this._endPress();

    this._pressed = partId;
    this._pressSeconds = PRESS_SECONDS;
    this.parts.get(partId).position.z = this._restZ.get(partId) - PRESS_DEPTH;
  }

  _endPress() {
    this.parts.get(this._pressed).position.z = this._restZ.get(this._pressed);
    this._pressed = null;
  }
}

ModuleManager.registerModule(MODULE_TYPES.PASSWORDS, PasswordModule);

export { PasswordModule };
