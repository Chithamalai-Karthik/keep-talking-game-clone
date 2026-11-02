/* ============================================================
   WireSequencesModule.js — The Wire Sequences module on the bomb
   Blender holds the panel (seq_panel), with a wire whole
   (part_seq_<terminal><letter>) and cut (seq_cut_<terminal><letter>)
   for all nine routes, plus part_seq_up, part_seq_down, two doors
   (seq_door_top and seq_door_bottom) and four stage lights
   (seq_led_<n>), bottom first. A panel uses only some
   routes. The rest are taken off it, as hidden objects still catch clicks.
   ============================================================ */

import { ModuleBase } from './ModuleBase.js';
import { ModuleManager } from './ModuleManager.js';
import { PanelChange, panelSink } from './rules/PanelChange.js';
import { LETTERS, PANEL_COUNT, TERMINALS_PER_PANEL, WireSequencesRules } from './rules/WireSequencesRules.js';
import { playSound } from '../audio/Sounds.js';
import { createTextLabel, disposeTextLabel } from '../three/TextLabel.js';
import { MODULE_NAMES, MODULE_TYPES, WIRE_HEX } from '../utils/constants.js';

const UP_PART = 'seq_up';
const DOWN_PART = 'seq_down';
const WIRE_PREFIX = 'seq_';

const SINK_DEPTH = 0.06; // Takes the panel and its wires below the dark well
const MIN_DOOR_SCALE = 0.001; // A scale of exactly 0 can't be inverted for lighting
const DOOR_TILT = Math.PI / 3; // How far out a door leans before it folds flat
const DOOR_FOLD_LATENESS = 3; // Stays leaning until late, to clear the tallest wires

const PRESS_SECONDS = 0.15;
const PRESS_DEPTH = 0.012;

const LED_COLOR = 0x2ecc71;
const LED_INTENSITY = 1.4;

const ROW_Y = [0.13, 0, -0.13];
const NUMBER_X = -0.24;
const LETTER_X = 0.12;
const TEXT_Z = 0.0925; // Just above the panel
const TEXT_SIZE = 0.09;
const TEXT_STYLE = { color: '#16161a', font: 'bold 360px sans-serif' };

class WireSequencesModule extends ModuleBase {
  setup() {
    this.moduleName = MODULE_NAMES[MODULE_TYPES.WIRE_SEQUENCES];
    this.modelName = 'wire_sequences_module';
    this.rules = new WireSequencesRules();

    this._numbers = [];
    this._letters = [];
    this._pressed = null;
    this._pressSeconds = 0;
  }

  build(body) {
    this._panel = body.getObjectByName('seq_panel');
    this._panelZ = this._panel.position.z;
    this._change = new PanelChange();
    this._doors = [
      { door: body.getObjectByName('seq_door_top'), tilt: -DOOR_TILT },
      { door: body.getObjectByName('seq_door_bottom'), tilt: DOOR_TILT },
    ];
    this._showChange(0);

    this._leds = Array.from({ length: PANEL_COUNT }, (_, i) => {
      const led = body.getObjectByName(`seq_led_${i}`);
      led.material = this._ownMaterial(led.material);
      return led;
    });

    this._buttonZ = new Map([UP_PART, DOWN_PART].map(id => [id, this.parts.get(id).position.z]));

    // One whole and one cut wire for each route, sharing a material so they share a colour
    this._routes = new Map();
    for (let terminal = 0; terminal < TERMINALS_PER_PANEL; terminal++) {
      LETTERS.forEach((letter) => {
        const key = `${terminal}${letter}`;
        const whole = this.parts.get(`${WIRE_PREFIX}${key}`);
        const cut = body.getObjectByName(`seq_cut_${key}`);

        cut.traverse((child) => {
          if (child.isMesh && !child.name.endsWith('_core')) child.material = whole.material;
        });
        this._routes.set(key, { partId: `${WIRE_PREFIX}${key}`, whole, cut });
      });
    }

    this._letters = LETTERS.map((letter, row) => this._addText(letter, LETTER_X, row));
    this._showPanel();
  }

  onPartClick(partId) {
    if (this._change.active) return;

    if (partId === UP_PART || partId === DOWN_PART) {
      playSound('press');
      this._showPress(partId);
      if (partId === UP_PART) this._goUp();
      else this._goDown();
      return;
    }

    this._cutWire(partId);
  }

  update(delta) {
    if (!this._change) return;

    if (this._pressed) {
      this._pressSeconds -= delta;
      if (this._pressSeconds <= 0) this._endPress();
    }

    if (!this._change.active) return;

    const event = this._change.update(delta);
    this._showChange(this._change.shut);
    if (event === 'hidden') this._showPanel();
  }

  dispose() {
    [...this._numbers, ...this._letters].forEach(disposeTextLabel);
    this._numbers = [];
    this._letters = [];
    super.dispose();
  }

  _goUp() {
    if (this.rules.previous()) this._startChange();
  }

  _goDown() {
    const result = this.rules.next();

    if (result === 'strike') {
      this.strike();
      return;
    }

    if (result === 'solve') {
      this._lightStages(PANEL_COUNT);
      this.solve();
      return;
    }

    this._startChange();
  }

  _cutWire(partId) {
    const terminal = Number(partId.slice(WIRE_PREFIX.length, WIRE_PREFIX.length + 1));
    const result = this.rules.cut(terminal);
    if (result === null) return;

    playSound('snip');
    const route = [...this._routes.values()].find(item => item.partId === partId);
    this.setPartHover(partId, false);
    route.whole.removeFromParent();
    this._panel.add(route.cut);

    if (result === 'strike') this.strike();
  }

  /**
   * The panel sinks as the doors slide out of the window's edges and fold
   * flat over it, so the wires go down under the doors
   * @param {number} shut - 0 is open, 1 is shut
   */
  _showChange(shut) {
    this._panel.position.z = this._panelZ - panelSink(shut) * SINK_DEPTH;

    this._doors.forEach(({ door, tilt }) => {
      door.visible = shut > 0;
      door.scale.y = Math.max(shut, MIN_DOOR_SCALE);
      door.rotation.x = tilt * (1 - shut ** DOOR_FOLD_LATENESS);
    });
  }

  _startChange() {
    this._change.start();
    this._lightStages(this.rules.panelIndex);
  }

  /**
   * Put this panel's wires and numbers on, and everything else off
   */
  _showPanel() {
    const { panel, panelIndex } = this.rules;

    this._routes.forEach(({ partId, whole, cut }) => {
      this.setPartHover(partId, false);
      whole.removeFromParent();
      cut.removeFromParent();
    });

    panel.forEach(({ terminal, letter, color }) => {
      const { whole, cut } = this._routes.get(`${terminal}${letter}`);
      whole.material.color.setHex(WIRE_HEX[color]);
      this._panel.add(this.rules.isCut(panelIndex, terminal) ? cut : whole);
    });

    this._numbers.forEach(disposeTextLabel);
    this._numbers = ROW_Y.map((_, row) => this._addText(String(panelIndex * TERMINALS_PER_PANEL + row + 1), NUMBER_X, row));
  }

  _addText(text, x, row) {
    const label = createTextLabel(text, TEXT_SIZE, TEXT_SIZE, TEXT_STYLE);
    label.position.set(x, ROW_Y[row], TEXT_Z);
    this._panel.add(label);
    return label;
  }

  _showPress(partId) {
    if (this._pressed) this._endPress();

    this._pressed = partId;
    this._pressSeconds = PRESS_SECONDS;
    this.parts.get(partId).position.z = this._buttonZ.get(partId) - PRESS_DEPTH;
  }

  _endPress() {
    this.parts.get(this._pressed).position.z = this._buttonZ.get(this._pressed);
    this._pressed = null;
  }

  /**
   * One light for each panel passed; going back a panel puts one out
   */
  _lightStages(count) {
    this._leds.forEach(({ material }, index) => {
      const lit = index < count;
      material.emissive.setHex(lit ? LED_COLOR : 0x000000);
      material.emissiveIntensity = lit ? LED_INTENSITY : 0;
    });
  }
}

ModuleManager.registerModule(MODULE_TYPES.WIRE_SEQUENCES, WireSequencesModule);

export { WireSequencesModule };
