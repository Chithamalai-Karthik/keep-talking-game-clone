/* ============================================================
   ModuleBase.js — Base class for all bomb modules
   A module is a 3D object in its slot: the shared housing with
   its status light, plus a body modelled for that module type.
   Rules live in src/js/game/rules/, away from the 3D.

   Subclasses provide:
     modelName          — .glb file for the body
     setup()            — create rules and data, before any 3D exists
     build(body)        — add labels or other details to the loaded body
     onPartClick(id)    — a part was clicked, then call solve() or strike()

   Blender objects named part_<id> become clickable parts. A hit_ child
   is an invisible, easier-to-click shape for a thin part.
   ============================================================ */

import * as THREE from 'three';
import { loadModel } from '../three/ModelLoader.js';

const STATUS_SOLVED_COLOR = 0x2ecc71;
const STATUS_STRIKE_COLOR = 0xe94560;
const STATUS_INTENSITY = 0.8;
const STRIKE_FLASH_MS = 500;
const PART_HOVER_COLOR = 0x3a86ff;
const PART_HOVER_INTENSITY = 0.5;

export class ModuleBase {
  /**
   * @param {string} slotId — The slot ID (e.g. 'front-0')
   * @param {THREE.Mesh} slotMesh — The slot mesh on the bomb
   * @param {Object} bombState — The BombState instance
   * @param {Object} callbacks — { onSolve(slotId), onStrike(slotId) }
   */
  constructor(slotId, slotMesh, bombState, callbacks = {}) {
    this.slotId = slotId;
    this.slotMesh = slotMesh;
    this.bombState = bombState;

    this.onSolveCallback = callbacks.onSolve || null;
    this.onStrikeCallback = callbacks.onStrike || null;

    this.isSolved = false;
    this.moduleName = 'MODULE';
    this.modelName = null;

    this.root = new THREE.Group();
    this.parts = new Map();

    this._statusLight = null;
    this._statusColor = new THREE.Color();
    this._strikeTimeout = null;
    this._disposables = [];
    this._disposed = false;
  }

  /* ----------------------------------------------------------
     LIFECYCLE — Data first, then models, then show on the bomb
  ---------------------------------------------------------- */

  /**
   * Set up and build the module. Runs after the subclass constructor,
   * so subclass fields are ready when setup() and build() are called.
   */
  async load() {
    this.setup();

    const [housing, body] = await Promise.all([
      loadModel('module_housing'),
      loadModel(this.modelName),
    ]);
    if (this._disposed) return; // The game ended during loading

    this._prepareStatusLight(housing);
    this._prepareParts(body);
    this.build(body);

    this.root.add(housing, body);
    this.root.traverse((child) => {
      if (child.isMesh) child.castShadow = true;
    });
    this.slotMesh.add(this.root);
  }

  setup() {}

  build(body) {}

  onPartClick(partId) {}

  /* ----------------------------------------------------------
     PARTS — Named Blender objects that can be clicked
  ---------------------------------------------------------- */
  _prepareParts(body) {
    body.traverse((child) => {
      if (child.name.startsWith('hit_')) child.visible = false;
      if (!child.isMesh || !child.name.startsWith('part_')) return;

      const partId = child.name.slice('part_'.length);
      child.material = this._ownMaterial(child.material);
      child.userData = { type: 'modulePart', interactive: true, slotId: this.slotId, partId };
      this.parts.set(partId, child);
    });
  }

  /**
   * Take a part off the module, so it can't be clicked or hovered again
   */
  removePart(partId) {
    this.setPartHover(partId, false);
    this.parts.get(partId).removeFromParent();
    this.parts.delete(partId);
  }

  /**
   * Handle a click on a part
   * @returns {boolean} — true if the module took the click
   */
  handlePartClick(partId) {
    if (this.isSolved || !this.parts.has(partId)) return false;
    this.onPartClick(partId);
    return true;
  }

  /**
   * Highlight a part under the mouse
   * @returns {boolean} — true if the part can be clicked
   */
  setPartHover(partId, hovered) {
    const part = this.parts.get(partId);
    if (!part) return false;

    const active = hovered && !this.isSolved;
    part.material.emissive.setHex(active ? PART_HOVER_COLOR : 0x000000);
    part.material.emissiveIntensity = active ? PART_HOVER_INTENSITY : 0;
    return active;
  }

  /* ----------------------------------------------------------
     STATUS LIGHT — Green once solved, red flash on a strike
  ---------------------------------------------------------- */
  _prepareStatusLight(housing) {
    this._statusLight = housing.getObjectByName('status_light');
    this._statusLight.material = this._ownMaterial(this._statusLight.material);
    this._statusColor.copy(this._statusLight.material.color);
  }

  _setStatusLight(color) {
    const material = this._statusLight?.material;
    if (!material) return;

    if (color === null) {
      material.color.copy(this._statusColor);
      material.emissive.setHex(0x000000);
      material.emissiveIntensity = 0;
    } else {
      material.color.setHex(color);
      material.emissive.setHex(color);
      material.emissiveIntensity = STATUS_INTENSITY;
    }
  }

  /* ----------------------------------------------------------
     SOLVE / STRIKE — Called by subclasses
  ---------------------------------------------------------- */

  /**
   * Mark this module as solved
   */
  solve() {
    if (this.isSolved) return;
    this.isSolved = true;

    clearTimeout(this._strikeTimeout);
    this._setStatusLight(STATUS_SOLVED_COLOR);
    this.parts.forEach((_, partId) => this.setPartHover(partId, false));

    if (this.onSolveCallback) {
      this.onSolveCallback(this.slotId);
    }

    console.log(`[KTANE] Module ${this.slotId} (${this.moduleName}) SOLVED!`);
  }

  /**
   * Record a strike from this module
   */
  strike() {
    clearTimeout(this._strikeTimeout);
    this._setStatusLight(STATUS_STRIKE_COLOR);
    this._strikeTimeout = setTimeout(() => this._setStatusLight(null), STRIKE_FLASH_MS);

    if (this.onStrikeCallback) {
      this.onStrikeCallback(this.slotId);
    }

    console.log(`[KTANE] Module ${this.slotId} (${this.moduleName}) STRIKE!`);
  }

  /* ----------------------------------------------------------
     CLEANUP — Model geometry stays cached for the next bomb
  ---------------------------------------------------------- */

  /**
   * Materials are shared between clones, so a module changing one needs its own
   */
  _ownMaterial(material) {
    const own = material.clone();
    this._disposables.push(own);
    return own;
  }

  dispose() {
    this._disposed = true;
    clearTimeout(this._strikeTimeout);
    this.root.removeFromParent();
    this._disposables.forEach(item => item.dispose());
    this._disposables = [];
    this.parts.clear();
  }
}
