/* ============================================================
   ButtonModule.js — The Button module on the bomb
   Blender holds the button (part_button), the strip that lights
   during a hold (strip_light), and a clear cover (button_cover)
   that swings up while the module is focused.
   ============================================================ */

import { ModuleBase } from './ModuleBase.js';
import { ModuleManager } from './ModuleManager.js';
import { ButtonRules, createButton, HOLD_SECONDS } from './rules/ButtonRules.js';
import { createTextLabel } from '../three/TextLabel.js';
import { MODULE_NAMES, MODULE_TYPES } from '../utils/constants.js';
import { displayTime } from '../utils/helpers.js';

const BUTTON_HEX = {
  red: 0xd8191a,
  blue: 0x1f4fd0,
  yellow: 0xf2c414,
  white: 0xf0efe8,
};

const STRIP_HEX = {
  red: 0xff2a2a,
  blue: 0x2a6cff,
  yellow: 0xffd21f,
  white: 0xffffff,
};
const STRIP_INTENSITY = 1.2;

const LABEL_WIDTH = 0.36;
const LABEL_HEIGHT = 0.09;
const LABEL_LIFT = 0.102; // Just above the top of the dome
const PRESS_DEPTH = 0.035;

const COVER_OPEN_ANGLE = -1.9;
const COVER_SPEED = 7;

class ButtonModule extends ModuleBase {
  setup() {
    this.moduleName = MODULE_NAMES[MODULE_TYPES.BUTTON];
    this.modelName = 'button_module';
    this.rules = new ButtonRules(createButton(), this.bombState);

    this._heldSeconds = null; // null while the button is not down
    this._coverAngle = 0;
  }

  build(body) {
    const { color, label } = this.rules.button;

    this._button = this.parts.get('button');
    this._button.material.color.setHex(BUTTON_HEX[color]);
    this._restZ = this._button.position.z;

    const dark = color === 'white' || color === 'yellow';
    const text = createTextLabel(label.toUpperCase(), LABEL_WIDTH, LABEL_HEIGHT, {
      color: dark ? '#16161a' : '#f0efe8',
      font: 'bold 96px sans-serif',
    });
    text.position.z = LABEL_LIFT;
    this._button.add(text);
    this._disposables.push(text.material.map, text.material, text.geometry);

    const strip = body.getObjectByName('strip_light');
    strip.material = this._ownMaterial(strip.material);
    this._strip = strip;

    // The cover never blocks clicks on the button under it
    this._cover = body.getObjectByName('button_cover');
    this._cover.traverse((child) => {
      child.raycast = () => {};
    });
  }

  onPartPress() {
    this.rules.press();
    this._heldSeconds = 0;
    this._button.position.z = this._restZ - PRESS_DEPTH;
    return true;
  }

  onPartRelease() {
    const heldSeconds = this._heldSeconds;
    this._heldSeconds = null;
    this._button.position.z = this._restZ;
    this._setStrip(null);

    const timeText = displayTime(this.bombState.timeRemaining);
    if (this.rules.release(heldSeconds, timeText) === 'solve') {
      this.solve();
    } else {
      this.strike();
    }
  }

  update(delta, focusedSlotId) {
    if (!this._cover) return; // Still loading

    if (this._heldSeconds !== null) {
      this._heldSeconds += delta;
      if (this._heldSeconds >= HOLD_SECONDS) this._setStrip(this.rules.stripColor);
    }

    const target = focusedSlotId === this.slotId ? COVER_OPEN_ANGLE : 0;
    this._coverAngle += (target - this._coverAngle) * Math.min(1, delta * COVER_SPEED);
    this._cover.rotation.x = this._coverAngle;
  }

  _setStrip(color) {
    const { material } = this._strip;
    material.emissive.setHex(color ? STRIP_HEX[color] : 0x000000);
    material.emissiveIntensity = color ? STRIP_INTENSITY : 0;
  }
}

ModuleManager.registerModule(MODULE_TYPES.BUTTON, ButtonModule);

export { ButtonModule };
