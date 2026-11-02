/* ============================================================
   WhosOnFirstModule.js — The Who's on First module on the bomb
   Blender holds six buttons (part_btn_<n>) and three stage lights
   (stage_led_<n>), bottom first. The display and the labels are
   text laid on top, and change at each new stage.
   ============================================================ */

import { ModuleManager } from './ModuleManager.js';
import { LABEL_COLOR, LABEL_FONT, StagedButtonModule } from './StagedButtonModule.js';
import { BUTTON_COUNT, STAGE_COUNT, WhosOnFirstRules } from './rules/WhosOnFirstRules.js';
import { createTextLabel } from '../three/TextLabel.js';
import { MODULE_NAMES, MODULE_TYPES } from '../utils/constants.js';

const LABEL_WIDTH = 0.225;
const LABEL_HEIGHT = 0.09;

const DISPLAY_X = -0.06;
const DISPLAY_Y = 0.2;
const DISPLAY_Z = 0.0905; // Just above the screen
const DISPLAY_WIDTH = 0.44;
const DISPLAY_HEIGHT = 0.12;

class WhosOnFirstModule extends StagedButtonModule {
  setup() {
    super.setup();
    this.moduleName = MODULE_NAMES[MODULE_TYPES.WHOS_ON_FIRST];
    this.modelName = 'whos_on_first_module';
    this.rules = new WhosOnFirstRules();

    this.buttonCount = BUTTON_COUNT;
    this.stageCount = STAGE_COUNT;
    this.partPrefix = 'btn_';
    this.ledPrefix = 'stage_led_';
  }

  _createLabel(index) {
    const label = this.rules.stage.labels[index];
    return createTextLabel(label, LABEL_WIDTH, LABEL_HEIGHT, { color: LABEL_COLOR, font: `136px ${LABEL_FONT}` });
  }

  _createDisplay() {
    const { display } = this.rules.stage;
    const text = createTextLabel(display, DISPLAY_WIDTH, DISPLAY_HEIGHT, { color: '#dfe9ef', font: 'bold 104px sans-serif' });
    text.position.set(DISPLAY_X, DISPLAY_Y, DISPLAY_Z);
    return text;
  }
}

ModuleManager.registerModule(MODULE_TYPES.WHOS_ON_FIRST, WhosOnFirstModule);

export { WhosOnFirstModule };
