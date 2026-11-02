/* ============================================================
   ComplicatedWiresModule.js — The Complicated Wires module on the bomb
   Blender holds six slots, each with a wire whole (part_cw_<n>) and
   cut (cw_cut_<n>), a light (cw_led_<n>) and a star (cw_star_<n>).
   Empty slots lose their wire. Stripes are painted on here.
   ============================================================ */

import * as THREE from 'three';
import { ModuleBase } from './ModuleBase.js';
import { ModuleManager } from './ModuleManager.js';
import { ComplicatedWiresRules, createWires, WIRE_SLOTS } from './rules/ComplicatedWiresRules.js';
import { playSound } from '../audio/Sounds.js';
import { MODULE_NAMES, MODULE_TYPES, WIRE_HEX } from '../utils/constants.js';

const LED_COLOR = 0xffe9c0;
const LED_INTENSITY = 1.5;

const STRIPE_CANVAS = 64;
const STRIPE_REPEATS = 16; // Per unit of wire length

/**
 * Two colours in diagonal bands that tile along the wire
 */
function createStripes([first, second]) {
  const canvas = document.createElement('canvas');
  canvas.width = STRIPE_CANVAS;
  canvas.height = STRIPE_CANVAS;

  const ctx = canvas.getContext('2d');
  const hex = color => `#${WIRE_HEX[color].toString(16).padStart(6, '0')}`;
  ctx.fillStyle = hex(first);
  ctx.fillRect(0, 0, STRIPE_CANVAS, STRIPE_CANVAS);

  // A band and its copies past each corner, so the edges of the tile meet
  ctx.fillStyle = hex(second);
  [-STRIPE_CANVAS, 0, STRIPE_CANVAS].forEach((shift) => {
    ctx.beginPath();
    ctx.moveTo(shift, 0);
    ctx.lineTo(shift + STRIPE_CANVAS / 2, 0);
    ctx.lineTo(shift + STRIPE_CANVAS, STRIPE_CANVAS);
    ctx.lineTo(shift + STRIPE_CANVAS / 2, STRIPE_CANVAS);
    ctx.closePath();
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, STRIPE_REPEATS);
  return texture;
}

class ComplicatedWiresModule extends ModuleBase {
  setup() {
    this.moduleName = MODULE_NAMES[MODULE_TYPES.COMPLICATED_WIRES];
    this.modelName = 'complicated_wires_module';

    const { serialLastDigitOdd, batteries } = this.bombState;
    const bomb = { serialLastDigitOdd, batteries, hasParallelPort: this.bombState.hasPort('Parallel') };
    this.rules = new ComplicatedWiresRules(createWires(bomb), bomb);
  }

  build(body) {
    this._body = body;

    for (let slot = 0; slot < WIRE_SLOTS; slot++) {
      const wire = this.rules.wires.find(item => item.slot === slot);
      const cut = body.getObjectByName(`cw_cut_${slot}`);

      body.getObjectByName(`cw_star_${slot}`).visible = Boolean(wire?.star);

      if (!wire) {
        this.removePart(`cw_${slot}`);
        cut.removeFromParent();
        continue;
      }

      const { material } = this.parts.get(`cw_${slot}`);
      this._paintWire(material, wire.colors);

      cut.visible = false;
      cut.traverse((child) => {
        if (child.isMesh && !child.name.endsWith('_core')) child.material = material;
      });

      if (wire.lit) this._lightLed(body.getObjectByName(`cw_led_${slot}`));
    }
  }

  onPartClick(partId) {
    const slot = Number(partId.slice('cw_'.length));
    const result = this.rules.cut(slot);

    playSound('snip');
    this.removePart(partId);
    this._body.getObjectByName(`cw_cut_${slot}`).visible = true;

    if (result === 'solve') this.solve();
    if (result === 'strike') this.strike();
  }

  _paintWire(material, colors) {
    if (colors.length === 1) {
      material.color.setHex(WIRE_HEX[colors[0]]);
      return;
    }

    const stripes = createStripes(colors);
    this._disposables.push(stripes);
    material.map = stripes;
    material.color.setHex(0xffffff);
    material.needsUpdate = true;
  }

  _lightLed(led) {
    led.material = this._ownMaterial(led.material);
    led.material.color.setHex(LED_COLOR);
    led.material.emissive.setHex(LED_COLOR);
    led.material.emissiveIntensity = LED_INTENSITY;
  }
}

ModuleManager.registerModule(MODULE_TYPES.COMPLICATED_WIRES, ComplicatedWiresModule);

export { ComplicatedWiresModule };
