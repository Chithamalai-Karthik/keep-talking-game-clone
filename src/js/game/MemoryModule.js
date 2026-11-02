/* ============================================================
   MemoryModule.js — The Memory module on the bomb
   Blender holds four buttons (part_mem_<n>) and five stage lights
   (mem_led_<n>), bottom first. The display digit and the button
   labels are text laid on top, and change at each new stage.
   ============================================================ */

import { ModuleManager } from './ModuleManager.js';
import { LABEL_COLOR, LABEL_FONT, StagedButtonModule } from './StagedButtonModule.js';
import { BUTTON_COUNT, MemoryRules, STAGE_COUNT } from './rules/MemoryRules.js';
import { createTextLabel } from '../three/TextLabel.js';
import { MODULE_NAMES, MODULE_TYPES } from '../utils/constants.js';

const LABEL_SIZE = 0.12;

const DISPLAY_X = -0.06;
const DISPLAY_Y = 0.15;
const DISPLAY_Z = 0.098; // Just above the screen's grid
const DISPLAY_SIZE = 0.2;

class MemoryModule extends StagedButtonModule {
  setup() {
    super.setup();
    this.moduleName = MODULE_NAMES[MODULE_TYPES.MEMORY];
    this.modelName = 'memory_module';
    this.rules = new MemoryRules();

    this.buttonCount = BUTTON_COUNT;
    this.stageCount = STAGE_COUNT;
    this.partPrefix = 'mem_';
    this.ledPrefix = 'mem_led_';
  }

  _createLabel(index) {
    const label = String(this.rules.stage.labels[index]);
    return createTextLabel(label, LABEL_SIZE, LABEL_SIZE, { color: LABEL_COLOR, font: `400px ${LABEL_FONT}` });
  }

  _createDisplay() {
    const digit = String(this.rules.stage.display);
    const text = createTextLabel(digit, DISPLAY_SIZE, DISPLAY_SIZE, { color: '#ffffff', font: `420px ${LABEL_FONT}` });
    text.position.set(DISPLAY_X, DISPLAY_Y, DISPLAY_Z);
    return text;
  }
}

ModuleManager.registerModule(MODULE_TYPES.MEMORY, MemoryModule);

export { MemoryModule };
