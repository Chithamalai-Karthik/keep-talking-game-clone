/* ============================================================
   PlaceholderModule.js — Temporary module for unimplemented types
   Shows the module type name and solve and strike buttons.
   Registers for all module types until real ones are built.
   ============================================================ */

import { ModuleBase } from './ModuleBase.js';
import { ModuleManager } from './ModuleManager.js';
import { PlaceholderRules } from './rules/PlaceholderRules.js';
import { createTextLabel } from '../three/TextLabel.js';
import { ACTIVE_MODULES, MODULE_NAMES } from '../utils/constants.js';

// Height of the label faces above the module's panel
const LABEL_Z = 0.062;

class PlaceholderModule extends ModuleBase {
  setup() {
    const { type } = this.bombState.modules.find(m => m.slotId === this.slotId);
    this.moduleName = MODULE_NAMES[type];
    this.modelName = 'placeholder_module';
    this.rules = new PlaceholderRules();
  }

  build(body) {
    this._addLabel(body, this.moduleName.toUpperCase(), 0.54, 0.1, -0.09, 0.29, 44);
    this._addLabel(body, 'SOLVE', 0.28, 0.07, -0.17, 0.11, 56);
    this._addLabel(body, 'STRIKE', 0.28, 0.07, 0.17, 0.11, 56);
  }

  _addLabel(body, text, width, height, x, y, fontSize) {
    const label = createTextLabel(text, width, height, { color: '#a9b7cc', font: `bold ${fontSize}px monospace` });
    label.position.set(x, y, LABEL_Z);
    body.add(label);
    this._disposables.push(label.material.map, label.material, label.geometry);
  }

  onPartClick(partId) {
    if (this.rules.press(partId) === 'solve') {
      this.solve();
    } else {
      this.strike();
    }
  }
}

// Register for all module types as fallback
ACTIVE_MODULES.forEach((type) => ModuleManager.registerModule(type, PlaceholderModule));

export { PlaceholderModule };
