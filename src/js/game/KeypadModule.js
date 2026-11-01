/* ============================================================
   KeypadModule.js — The Keypads module on the bomb
   Blender holds four keys (part_key_<n>), each with a light bar
   (key_led_<n>). The symbols are images laid on the keys.
   ============================================================ */

import * as THREE from 'three';
import { ModuleBase } from './ModuleBase.js';
import { ModuleManager } from './ModuleManager.js';
import { createKeys, KeypadRules } from './rules/KeypadRules.js';
import { loadTexture } from '../three/ModelLoader.js';
import { MODULE_NAMES, MODULE_TYPES } from '../utils/constants.js';

const SYMBOL_SIZE = 0.175;
const SYMBOL_Y = -0.022;
const SYMBOL_LIFT = 0.0432; // Just above the key's face

const PRESS_DEPTH = 0.014;
const WRONG_PRESS_SECONDS = 0.25;

const LED_CORRECT = 0x2ecc71;
const LED_WRONG = 0xe94560;
const LED_INTENSITY = 1.4;

class KeypadModule extends ModuleBase {
  setup() {
    this.moduleName = MODULE_NAMES[MODULE_TYPES.KEYPADS];
    this.modelName = 'keypad_module';
    this.rules = new KeypadRules(createKeys());

    this._keys = [];
    this._wrongKey = null;
    this._wrongSeconds = 0;
  }

  async loadAssets() {
    this._textures = await Promise.all(
      this.rules.symbols.map(symbol => loadTexture(`keypad/${symbol}.png`))
    );
  }

  build() {
    this._keys = this._textures.map((map, index) => {
      const key = this.parts.get(`key_${index}`);
      const led = key.getObjectByName(`key_led_${index}`);
      led.material = this._ownMaterial(led.material);

      const material = new THREE.MeshBasicMaterial({ map, transparent: true });
      const geometry = new THREE.PlaneGeometry(SYMBOL_SIZE, SYMBOL_SIZE);
      const symbol = new THREE.Mesh(geometry, material);
      symbol.position.set(0, SYMBOL_Y, SYMBOL_LIFT);
      key.add(symbol);
      this._disposables.push(material, geometry);

      return { mesh: key, led, restZ: key.position.z };
    });
  }

  onPartClick(partId) {
    const index = Number(partId.slice('key_'.length));
    const result = this.rules.press(index);

    if (result === 'strike') {
      this._showWrongKey(index);
      this.strike();
    } else if (result) {
      if (this._wrongKey === index) this._wrongKey = null;
      this._setKey(index, LED_CORRECT);
      if (result === 'solve') this.solve();
    }
  }

  update(delta) {
    if (this._wrongKey === null) return;

    this._wrongSeconds -= delta;
    if (this._wrongSeconds <= 0) {
      this._setKey(this._wrongKey, null);
      this._wrongKey = null;
    }
  }

  _showWrongKey(index) {
    if (this._wrongKey !== null) this._setKey(this._wrongKey, null);
    this._wrongKey = index;
    this._wrongSeconds = WRONG_PRESS_SECONDS;
    this._setKey(index, LED_WRONG);
  }

  /**
   * Push a key in and light its bar, or let it back up with null
   */
  _setKey(index, color) {
    const { mesh, led, restZ } = this._keys[index];
    mesh.position.z = color === null ? restZ : restZ - PRESS_DEPTH;
    led.material.emissive.setHex(color ?? 0x000000);
    led.material.emissiveIntensity = color === null ? 0 : LED_INTENSITY;
  }
}

ModuleManager.registerModule(MODULE_TYPES.KEYPADS, KeypadModule);

export { KeypadModule };
