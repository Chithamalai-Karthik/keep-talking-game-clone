/* ============================================================
   CapacitorModule.js — The Capacitor Discharge needy module on the bomb
   Blender holds the lever (part_cap_lever) and the red level in the
   meter (cap_fill). Holding the lever puts time back on the
   countdown, and filling it sends the module back to waiting.
   ============================================================ */

import { ModuleManager } from './ModuleManager.js';
import { NeedyModule } from './NeedyModule.js';
import { playSound } from '../audio/Sounds.js';
import { MODULE_NAMES, NEEDY_MODULE_TYPES } from '../utils/constants.js';

const DURATION_SECONDS = 45;
const DISCHARGE_RATE = 6; // Seconds put back for each second held

const LEVER_PART = 'cap_lever';
const LEVER_DOWN_ANGLE = 1.9;
const LEVER_SPEED = 16;
const LEVER_GLOW = 0xff2a1f;
const LEVER_GLOW_INTENSITY = 0.3;
const MIN_FILL_SCALE = 0.001; // A scale of exactly 0 can't be inverted for lighting

class CapacitorModule extends NeedyModule {
  setup() {
    this.needyDuration = DURATION_SECONDS;
    super.setup();

    this.moduleName = MODULE_NAMES[NEEDY_MODULE_TYPES.CAPACITOR];
    this.modelName = 'capacitor_module';

    this._held = false;
  }

  buildBody(body) {
    this._lever = this.parts.get(LEVER_PART);
    this._fill = body.getObjectByName('cap_fill');
  }

  onPartPress() {
    this._held = true;
    playSound('press');
    return true; // Keep the lever until the mouse lets go
  }

  onPartRelease() {
    this._held = false;
    playSound('release');
  }

  /**
   * Hover glows red: the usual blue turns the red grip purple
   */
  setPartHover(partId, hovered) {
    const lever = this.parts.get(partId);
    if (!lever) return false;

    lever.material.emissive.setHex(hovered ? LEVER_GLOW : 0x000000);
    lever.material.emissiveIntensity = hovered ? LEVER_GLOW_INTENSITY : 0;
    return hovered;
  }

  tick(delta) {
    const target = this._held ? LEVER_DOWN_ANGLE : 0;
    this._lever.rotation.x += (target - this._lever.rotation.x) * Math.min(delta * LEVER_SPEED, 1);

    if (this._held && this.isActive && this.timer.add(delta * DISCHARGE_RATE)) this.tended();
    this._showFill();
  }

  onRest() {
    this._showFill();
  }

  /**
   * The red level climbs as the charge builds: empty when just discharged
   */
  _showFill() {
    const charge = this.isActive ? 1 - this.timer.secondsLeft / this.timer.duration : 0;

    this._fill.visible = charge > 0;
    this._fill.scale.y = Math.max(charge, MIN_FILL_SCALE);
  }
}

ModuleManager.registerModule(NEEDY_MODULE_TYPES.CAPACITOR, CapacitorModule);

export { CapacitorModule };
