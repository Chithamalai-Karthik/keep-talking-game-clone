/* ============================================================
   KnobModule.js — The Knob needy module on the bomb
   Blender holds the knob (part_knob), the dial with its UP label
   (knob_dial) and twelve lights (knob_led_<row>_<column>). Clicking
   turns the knob. It is judged only when the countdown ends.
   ============================================================ */

import { ModuleManager } from './ModuleManager.js';
import { NeedyModule } from './NeedyModule.js';
import { KnobRules, LED_COLUMNS, LED_ROWS } from './rules/KnobRules.js';
import { playSound } from '../audio/Sounds.js';
import { createTextLabel, disposeTextLabel } from '../three/TextLabel.js';
import { MODULE_NAMES, NEEDY_MODULE_TYPES } from '../utils/constants.js';

const DURATION_SECONDS = 40;

const QUARTER_TURN = Math.PI / 2;
const KNOB_SPEED = 18;

const LED_COLOR = 0x3bff4a;
const LED_INTENSITY = 0.6; // Brighter washes out to white

const UP_LIFT = 0.0075; // Just above the dial's face
const UP_RADIUS = 0.128;
const UP_WIDTH = 0.11;
const UP_HEIGHT = 0.06;
const UP_STYLE = { color: '#26262c', font: 'bold 210px sans-serif' };

class KnobModule extends NeedyModule {
  setup() {
    this.needyDuration = DURATION_SECONDS;
    super.setup();

    this.moduleName = MODULE_NAMES[NEEDY_MODULE_TYPES.KNOB];
    this.modelName = 'knob_module';
    this.rules = new KnobRules();
  }

  buildBody(body) {
    this._knob = this.parts.get('knob');
    this._knobAngle = -this.rules.knobTurns * QUARTER_TURN;
    this._knob.rotation.z = this._knobAngle;

    this._dial = body.getObjectByName('knob_dial');
    this._dial.rotation.z = -this.rules.labelTurns * QUARTER_TURN;

    this._upText = createTextLabel('UP', UP_WIDTH, UP_HEIGHT, UP_STYLE);
    this._upText.position.set(0, UP_RADIUS, UP_LIFT);
    this._dial.add(this._upText);

    this._leds = [];
    for (let row = 0; row < LED_ROWS; row++) {
      for (let column = 0; column < LED_COLUMNS; column++) {
        const led = body.getObjectByName(`knob_led_${row}_${column}`);
        led.material = this._ownMaterial(led.material);
        this._leds.push({ led, row, column });
      }
    }
  }

  onActivate() {
    this.rules.pickPattern();
    this._showLights(true);
  }

  onRest() {
    this._showLights(false);
  }

  onExpire() {
    if (!this.rules.isCorrect) this.strike();
  }

  onPartClick() {
    playSound('press');
    this.rules.turn();
    this._knobAngle -= QUARTER_TURN;
  }

  tick(delta) {
    this._knob.rotation.z += (this._knobAngle - this._knob.rotation.z) * Math.min(delta * KNOB_SPEED, 1);
  }

  dispose() {
    if (this._upText) disposeTextLabel(this._upText);
    super.dispose();
  }

  _showLights(on) {
    this._leds.forEach(({ led, row, column }) => {
      const lit = on && this.rules.isLit(row, column);
      led.material.emissive.setHex(lit ? LED_COLOR : 0x000000);
      led.material.emissiveIntensity = lit ? LED_INTENSITY : 0;
    });
  }
}

ModuleManager.registerModule(NEEDY_MODULE_TYPES.KNOB, KnobModule);

export { KnobModule };
