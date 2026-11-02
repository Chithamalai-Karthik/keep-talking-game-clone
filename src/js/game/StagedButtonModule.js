/* ============================================================
   StagedButtonModule.js — Shared base for staged button modules
   Who's on First and Memory both show a display and labelled
   buttons, with stage lights, and change them between stages.

   Subclasses provide, in setup() after super.setup():
     rules, moduleName, modelName
     buttonCount, stageCount
     partPrefix         — part ids are <prefix><n>
     ledPrefix          — stage lights are <prefix><n>, bottom first
     _createLabel(index)  — the text for one button
     _createDisplay()     — the display text, already in position
   ============================================================ */

import { ModuleBase } from './ModuleBase.js';
import { StageChange } from './rules/StageChange.js';
import { playSound } from '../audio/Sounds.js';
import { disposeTextLabel } from '../three/TextLabel.js';

// Narrow lettering for the buttons and displays, falling back where Impact is missing
export const LABEL_FONT = 'Impact, "Arial Narrow", sans-serif';
export const LABEL_COLOR = '#16161a';

const HIDE_DEPTH = 0.052; // Takes a button's face just below the dark well, out of sight
const LABEL_LIFT = 0.0262; // Just above the button's face

const LED_COLOR = 0x2ecc71;
const LED_INTENSITY = 1.4;

export class StagedButtonModule extends ModuleBase {
  setup() {
    this._body = null;
    this._labels = [];
    this._display = null;
  }

  build(body) {
    this._body = body;
    this._change = new StageChange(this.buttonCount);

    this._buttons = [];
    for (let i = 0; i < this.buttonCount; i++) {
      const mesh = this.parts.get(`${this.partPrefix}${i}`);
      this._buttons.push({ mesh, restZ: mesh.position.z });
    }
    this._leds = Array.from({ length: this.stageCount }, (_, i) => {
      const led = body.getObjectByName(`${this.ledPrefix}${i}`);
      led.material = this._ownMaterial(led.material);
      return led;
    });

    this._showLabels();
    this._showDisplay();
  }

  onPartClick(partId) {
    if (this._change.active) return;

    const result = this.rules.press(Number(partId.slice(this.partPrefix.length)));
    playSound('press');
    this._lightStages();

    if (result === 'solve') {
      this.solve();
      return;
    }

    this._change.start();
    this._clearDisplay();
    if (result === 'strike') this.strike();
  }

  update(delta) {
    if (!this._change?.active) return;

    const event = this._change.update(delta);
    this._buttons.forEach(({ mesh, restZ }, index) => {
      mesh.position.z = restZ - this._change.depth(index) * HIDE_DEPTH;
    });

    if (event === 'hidden') this._showLabels();
    if (event === 'done') this._showDisplay();
  }

  dispose() {
    this._clearLabels();
    this._clearDisplay();
    super.dispose();
  }

  _showLabels() {
    this._clearLabels();
    this._labels = this._buttons.map(({ mesh }, index) => {
      const text = this._createLabel(index);
      text.position.z = LABEL_LIFT;
      mesh.add(text);
      return text;
    });
  }

  _showDisplay() {
    this._display = this._createDisplay();
    this._body.add(this._display);
  }

  _clearLabels() {
    this._labels.forEach(disposeTextLabel);
    this._labels = [];
  }

  _clearDisplay() {
    if (this._display) disposeTextLabel(this._display);
    this._display = null;
  }

  /**
   * Memory can go back to stage 1, so lights can go out as well as on
   */
  _lightStages() {
    this._leds.forEach(({ material }, index) => {
      const lit = index < this.rules.stagesDone;
      material.emissive.setHex(lit ? LED_COLOR : 0x000000);
      material.emissiveIntensity = lit ? LED_INTENSITY : 0;
    });
  }
}
