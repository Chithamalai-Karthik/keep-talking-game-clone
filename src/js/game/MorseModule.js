/* ============================================================
   MorseModule.js — The Morse Code module on the bomb
   Blender holds the lamp (morse_lamp), the scale's needle
   (morse_needle) and three parts: part_morse_left, part_morse_right
   and part_morse_tx. The lamp signals on its own, whether or not
   the module is selected. The frequency is text laid on top.
   ============================================================ */

import { ModuleBase } from './ModuleBase.js';
import { ModuleManager } from './ModuleManager.js';
import { MorseRules, MorseSignal } from './rules/MorseRules.js';
import { playSound } from '../audio/Sounds.js';
import { createTextLabel, disposeTextLabel } from '../three/TextLabel.js';
import { MODULE_NAMES, MODULE_TYPES } from '../utils/constants.js';

const TUNE_DIRECTIONS = { morse_left: -1, morse_right: 1 };
const TRANSMIT_PART = 'morse_tx';

const LAMP_COLOR = 0xffb020;
const LAMP_INTENSITY = 0.85; // Brighter washes out to white

const PRESS_SECONDS = 0.15;
const PRESS_DEPTH = 0.012;

// The printed scale: 3.500 MHz is at x -0.25 and 3.600 MHz at x 0.25
const SCALE_START_KHZ = 3500;
const SCALE_UNITS_PER_KHZ = 0.005;
const SCALE_START_X = -0.25;
const NEEDLE_SPEED = 14; // How quickly the needle closes on its place

const FREQUENCY_Y = -0.075;
const FREQUENCY_Z = 0.0915; // Just above the screen
const FREQUENCY_WIDTH = 0.36;
const FREQUENCY_HEIGHT = 0.09;

const TX_WIDTH = 0.21;
const TX_HEIGHT = 0.08;
const TX_LIFT = 0.0185; // Just above the button's face

const needleX = (frequency) => SCALE_START_X + (frequency - SCALE_START_KHZ) * SCALE_UNITS_PER_KHZ;

class MorseModule extends ModuleBase {
  setup() {
    this.moduleName = MODULE_NAMES[MODULE_TYPES.MORSE_CODE];
    this.modelName = 'morse_module';
    this.rules = new MorseRules();

    this._signal = new MorseSignal(this.rules.word);
    this._lamp = null;
    this._needle = null;
    this._body = null;
    this._frequencyText = null;
    this._txText = null;
    this._pressed = null;
    this._pressSeconds = 0;
  }

  build(body) {
    this._body = body;
    this._needle = body.getObjectByName('morse_needle');
    this._needle.position.x = needleX(this.rules.frequency);

    this._lamp = body.getObjectByName('morse_lamp');
    this._lamp.material = this._ownMaterial(this._lamp.material);
    this._lamp.material.emissive.setHex(LAMP_COLOR);
    this._showLamp();

    this._restZ = new Map();
    this.parts.forEach((mesh, partId) => this._restZ.set(partId, mesh.position.z));

    this._txText = createTextLabel('TX', TX_WIDTH, TX_HEIGHT, { color: '#16161a', font: 'bold 150px sans-serif' });
    this._txText.position.z = TX_LIFT;
    this.parts.get(TRANSMIT_PART).add(this._txText);

    this._showFrequency();
  }

  onPartClick(partId) {
    playSound('press');
    this._showPress(partId);

    if (partId === TRANSMIT_PART) {
      if (this.rules.transmit() === 'strike') {
        this.strike();
      } else {
        this.solve();
        this._showLamp();
      }
      return;
    }

    this.rules.tune(TUNE_DIRECTIONS[partId]);
    this._showFrequency();
  }

  update(delta) {
    if (!this._lamp) return;

    if (this._pressed) {
      this._pressSeconds -= delta;
      if (this._pressSeconds <= 0) this._endPress();
    }

    const target = needleX(this.rules.frequency);
    this._needle.position.x += (target - this._needle.position.x) * Math.min(delta * NEEDLE_SPEED, 1);

    if (this.isSolved) return;
    this._signal.update(delta);
    this._showLamp();
  }

  dispose() {
    if (this._frequencyText) disposeTextLabel(this._frequencyText);
    if (this._txText) disposeTextLabel(this._txText);
    super.dispose();
  }

  _showLamp() {
    this._lamp.material.emissiveIntensity = this._signal.lit && !this.isSolved ? LAMP_INTENSITY : 0;
  }

  _showFrequency() {
    if (this._frequencyText) disposeTextLabel(this._frequencyText);

    const words = `${(this.rules.frequency / 1000).toFixed(3)} MHz`;
    this._frequencyText = createTextLabel(words, FREQUENCY_WIDTH, FREQUENCY_HEIGHT, { color: '#ff8a1e', font: 'bold 90px monospace' });
    this._frequencyText.position.set(0, FREQUENCY_Y, FREQUENCY_Z);
    this._body.add(this._frequencyText);
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

ModuleManager.registerModule(MODULE_TYPES.MORSE_CODE, MorseModule);

export { MorseModule };
