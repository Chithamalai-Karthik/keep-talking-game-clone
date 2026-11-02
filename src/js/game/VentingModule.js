/* ============================================================
   VentingModule.js — The Venting Gas needy module on the bomb
   Blender holds the case, its screen, and two keys (part_vg_y and
   part_vg_n). What the computer says is text laid on the screen.
   ============================================================ */

import { ModuleManager } from './ModuleManager.js';
import { NeedyModule } from './NeedyModule.js';
import { VentingRules } from './rules/VentingRules.js';
import { playSound } from '../audio/Sounds.js';
import { createTextLabel, disposeTextLabel } from '../three/TextLabel.js';
import { MODULE_NAMES, NEEDY_MODULE_TYPES } from '../utils/constants.js';

const DURATION_SECONDS = 45;
const MESSAGE_SECONDS = 1.5;
const PROMPT_LINE = 'Y/N';
const VENTING_LINE = 'VENTING...';
const WARNING_LINES = ['VENTING PREVENTS', 'EXPLOSIONS'];

const LINE_Y = [0.035, -0.045];
const SCREEN_Y = -0.0;
const SCREEN_Z = 0.1285; // Just above the screen
const LINE_WIDTH = 0.42;
const LINE_HEIGHT = 0.08;
const LINE_STYLE = { color: '#39ff6a', font: 'bold 62px sans-serif' };

const KEY_TEXT_SIZE = 0.05;
const KEY_TEXT_LIFT = 0.0165;
const KEY_TEXT_STYLE = { color: '#16161a', font: 'bold 400px sans-serif' };

const PRESS_SECONDS = 0.15;
const PRESS_DEPTH = 0.01;

class VentingModule extends NeedyModule {
  setup() {
    this.needyDuration = DURATION_SECONDS;
    super.setup();

    this.moduleName = MODULE_NAMES[NEEDY_MODULE_TYPES.VENTING_GAS];
    this.modelName = 'venting_module';
    this.rules = new VentingRules();

    this._lines = [];
    this._keyText = [];
    this._messageSeconds = 0;
    this._pressed = null;
    this._pressSeconds = 0;
  }

  buildBody(body) {
    this._body = body;
    this._restZ = new Map();
    this.parts.forEach((mesh, partId) => this._restZ.set(partId, mesh.position.z));

    this._keyText = [['vg_y', 'Y'], ['vg_n', 'N']].map(([partId, letter]) => {
      const text = createTextLabel(letter, KEY_TEXT_SIZE, KEY_TEXT_SIZE, KEY_TEXT_STYLE);
      text.position.z = KEY_TEXT_LIFT;
      this.parts.get(partId).add(text);
      return text;
    });
  }

  onActivate() {
    this.rules.ask();
    this._showPrompt();
  }

  onRest() {
    if (this._messageSeconds <= 0) this._showLines([]);
  }

  onPartClick(partId) {
    playSound('press');
    this._showPress(partId);

    if (!this.isActive || this._messageSeconds > 0) return;

    const result = this.rules.answer(partId === 'vg_y' ? 'y' : 'n');

    if (result === 'warning') {
      this._showMessage(WARNING_LINES);
    } else if (result === 'strike') {
      this.strike();
      this.tended();
    } else {
      if (partId === 'vg_y') this._showMessage([VENTING_LINE]);
      this.tended();
    }
  }

  tick(delta) {
    if (this._pressed) {
      this._pressSeconds -= delta;
      if (this._pressSeconds <= 0) this._endPress();
    }

    if (this._messageSeconds <= 0) return;

    this._messageSeconds -= delta;
    if (this._messageSeconds > 0) return;

    if (this.isActive) this._showPrompt();
    else this._showLines([]);
  }

  dispose() {
    this._showLines([]);
    this._keyText.forEach(disposeTextLabel);
    this._keyText = [];
    super.dispose();
  }

  _showPrompt() {
    this._showLines([this.rules.prompt, PROMPT_LINE]);
  }

  _showMessage(lines) {
    this._messageSeconds = MESSAGE_SECONDS;
    this._showLines(lines);
  }

  _showLines(lines) {
    this._lines.forEach(disposeTextLabel);
    this._lines = lines.map((words, index) => {
      const text = createTextLabel(words, LINE_WIDTH, LINE_HEIGHT, LINE_STYLE);
      const y = lines.length === 1 ? SCREEN_Y : LINE_Y[index];
      text.position.set(0, y, SCREEN_Z);
      this._body.add(text);
      return text;
    });
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

ModuleManager.registerModule(NEEDY_MODULE_TYPES.VENTING_GAS, VentingModule);

export { VentingModule };
