/* ============================================================
   SimonModule.js — The Simon Says module on the bomb
   Blender holds four buttons (part_blue, part_yellow, part_red and
   part_green). The sequence flashes on its own, whether or not the
   module is selected, and stops for a while after each press.
   Flashes only beep while selected, so an unattended module
   doesn't talk over the players.
   ============================================================ */

import { ModuleBase } from './ModuleBase.js';
import { ModuleManager } from './ModuleManager.js';
import { createSequence, FlashSequencer, SIMON_COLORS, SimonRules } from './rules/SimonRules.js';
import { playSound } from '../audio/Sounds.js';
import { MODULE_NAMES, MODULE_TYPES } from '../utils/constants.js';

const NEXT_STAGE_SECONDS = 1; // The wait for the new, longer sequence
const AFTER_PRESS_SECONDS = 4; // Time to enter the next button
const PRESS_SECONDS = 0.2;

const PRESS_DEPTH = 0.012;

const LIGHT_COLORS = { red: 0xff2a1f, blue: 0x2b6bff, green: 0x22e05a, yellow: 0xffd21f };
const LIT_INTENSITY = 0.75; // Brighter washes out to white, and the colour is the point
const HOVER_INTENSITY = 0.2;

class SimonModule extends ModuleBase {
  setup() {
    this.moduleName = MODULE_NAMES[MODULE_TYPES.SIMON_SAYS];
    this.modelName = 'simon_module';
    this.rules = new SimonRules(createSequence(), this.bombState.serialHasVowel);

    this._hovered = null;
    this._flash = new FlashSequencer();
    this._pressedColor = null;
    this._pressSeconds = 0;
    this._restZ = 0;
  }

  build() {
    this._restZ = this.parts.get(SIMON_COLORS[0]).position.z;
  }

  onPartClick(color) {
    // Read the strikes first: a wrong press adds one, and it must not judge itself
    const result = this.rules.press(color, this.bombState.strikes);

    playSound(`simon-${color}`);
    this._pauseFlash(result === 'stage' ? NEXT_STAGE_SECONDS : AFTER_PRESS_SECONDS);
    this._showPress(color);

    if (result === 'strike') this.strike();
    if (result === 'solve') {
      this._endPress();
      this.solve();
    }
  }

  update(delta, focusedSlotId) {
    if (this.isSolved || this.parts.size === 0) return;

    if (this._pressedColor) {
      this._pressSeconds -= delta;
      if (this._pressSeconds <= 0) this._endPress();
    }

    const before = this._flash.color;
    this._flash.update(delta, this.rules.flashes);
    this._refreshFlash(before);

    const flash = this._flash.color;
    if (flash && flash !== before && focusedSlotId === this.slotId) playSound(`simon-${flash}`);
  }

  /**
   * Hover glows in the button's own colour: the usual blue highlight
   * would look like a flash of the wrong colour.
   */
  setPartHover(partId, hovered) {
    if (!this.parts.has(partId)) return false;

    const active = hovered && !this.isSolved;
    if (active) this._hovered = partId;
    else if (this._hovered === partId) this._hovered = null;
    this._showLight(partId);
    return active;
  }

  _pauseFlash(seconds) {
    const before = this._flash.color;
    this._flash.pause(seconds);
    this._refreshFlash(before);
  }

  /**
   * Update the buttons after the lit colour may have changed
   */
  _refreshFlash(before) {
    const after = this._flash.color;
    if (after === before) return;

    if (before) this._showLight(before);
    if (after) this._showLight(after);
  }

  _showPress(color) {
    if (this._pressedColor) this._endPress();

    this._pressedColor = color;
    this._pressSeconds = PRESS_SECONDS;
    this.parts.get(color).position.z = this._restZ - PRESS_DEPTH;
    this._showLight(color);
  }

  _endPress() {
    const color = this._pressedColor;
    this._pressedColor = null;
    this.parts.get(color).position.z = this._restZ;
    this._showLight(color);
  }

  /**
   * Set a button's light from everything that can light it
   */
  _showLight(color) {
    const lit = color === this._flash.color || color === this._pressedColor;
    const { material } = this.parts.get(color);

    material.emissive.setHex(lit || color === this._hovered ? LIGHT_COLORS[color] : 0x000000);
    material.emissiveIntensity = lit ? LIT_INTENSITY : color === this._hovered ? HOVER_INTENSITY : 0;
  }
}

ModuleManager.registerModule(MODULE_TYPES.SIMON_SAYS, SimonModule);

export { SimonModule };
