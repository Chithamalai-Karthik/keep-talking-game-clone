/* ============================================================
   WiresModule.js — The Wires module on the bomb
   Blender holds a wire for each row, whole (part_wire_<row>) and
   cut (wire_cut_<row>). Rows with no wire have both removed.
   ============================================================ */

import { ModuleBase } from './ModuleBase.js';
import { ModuleManager } from './ModuleManager.js';
import { createWires, WiresRules, WIRE_ROWS } from './rules/WiresRules.js';
import { playSound } from '../audio/Sounds.js';
import { MODULE_NAMES, MODULE_TYPES, WIRE_HEX } from '../utils/constants.js';

class WiresModule extends ModuleBase {
  setup() {
    this.moduleName = MODULE_NAMES[MODULE_TYPES.WIRES];
    this.modelName = 'wires_module';
    this.rules = new WiresRules(createWires(), this.bombState.serialLastDigitOdd);
  }

  build(body) {
    for (let row = 0; row < WIRE_ROWS; row++) {
      const cut = body.getObjectByName(`wire_cut_${row}`);
      const wire = this.rules.wires.find(w => w.row === row);

      if (!wire) {
        this.removePart(`wire_${row}`);
        cut.removeFromParent();
        continue;
      }

      const { material } = this.parts.get(`wire_${row}`);
      material.color.setHex(WIRE_HEX[wire.color]);

      cut.visible = false;
      cut.traverse((child) => {
        if (child.isMesh && !child.name.endsWith('_core')) child.material = material;
      });
    }
    this._body = body;
  }

  onPartClick(partId) {
    const row = Number(partId.slice('wire_'.length));
    const result = this.rules.cut(row);

    playSound('snip');
    this.removePart(partId);
    this._body.getObjectByName(`wire_cut_${row}`).visible = true;

    if (result === 'solve') {
      this.solve();
    } else {
      this.strike();
    }
  }
}

ModuleManager.registerModule(MODULE_TYPES.WIRES, WiresModule);

export { WiresModule };
