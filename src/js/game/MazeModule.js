/* ============================================================
   MazeModule.js — The Mazes module on the bomb
   Blender holds the screen with its grid, four arrow keys
   (part_maze_up and so on), and the marks moved about here:
   the light (maze_light), the triangle (maze_goal) and the
   two circles (maze_circle_<n>).
   ============================================================ */

import { ModuleBase } from './ModuleBase.js';
import { ModuleManager } from './ModuleManager.js';
import { GRID_SIZE, MazeRules } from './rules/MazeRules.js';
import { playSound } from '../audio/Sounds.js';
import { MODULE_NAMES, MODULE_TYPES } from '../utils/constants.js';

const PART_PREFIX = 'maze_';

// Where the grid sits, matching the Blender model
const GRID_CENTER_X = -0.025;
const GRID_CENTER_Y = -0.02;
const GRID_PITCH = 0.063;

const PRESS_SECONDS = 0.15;
const PRESS_DEPTH = 0.012;

const gridX = x => GRID_CENTER_X + (x - (GRID_SIZE - 1) / 2) * GRID_PITCH;
const gridY = y => GRID_CENTER_Y - (y - (GRID_SIZE - 1) / 2) * GRID_PITCH;

class MazeModule extends ModuleBase {
  setup() {
    this.moduleName = MODULE_NAMES[MODULE_TYPES.MAZES];
    this.modelName = 'maze_module';
    this.rules = new MazeRules();

    this._light = null;
    this._pressed = null;
    this._pressSeconds = 0;
  }

  build(body) {
    this._restZ = new Map();
    this.parts.forEach((mesh, partId) => this._restZ.set(partId, mesh.position.z));

    this._light = body.getObjectByName('maze_light');
    this._place(body.getObjectByName('maze_goal'), this.rules.goal);
    this.rules.circles.forEach((circle, index) => {
      this._place(body.getObjectByName(`maze_circle_${index}`), circle);
    });
    this._place(this._light, this.rules.light);
  }

  onPartClick(partId) {
    playSound('press');
    this._showPress(partId);

    const result = this.rules.move(partId.slice(PART_PREFIX.length));
    this._place(this._light, this.rules.light);

    if (result === 'strike') this.strike();
    if (result === 'solve') this.solve();
  }

  update(delta) {
    if (!this._pressed) return;

    this._pressSeconds -= delta;
    if (this._pressSeconds <= 0) this._endPress();
  }

  _place(mark, { x, y }) {
    mark.position.x = gridX(x);
    mark.position.y = gridY(y);
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

ModuleManager.registerModule(MODULE_TYPES.MAZES, MazeModule);

export { MazeModule };
