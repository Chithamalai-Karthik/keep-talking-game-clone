/* ============================================================
   ModuleManager.js — Creates and manages module instances
   Maps module types to their classes, creates instances for
   each assigned slot, and routes clicks to the correct module.
   ============================================================ */

// Module type registry — will be populated as modules are implemented
const MODULE_REGISTRY = {};

export class ModuleManager {
  /**
   * @param {BombModel} bombModel
   * @param {BombState} bombState
   * @param {Object} callbacks — { onSolve(slotId), onStrike(slotId) }
   */
  constructor(bombModel, bombState, callbacks = {}) {
    this.bombModel = bombModel;
    this.bombState = bombState;
    this.callbacks = callbacks;

    // Map of slotId → module instance
    this.modules = new Map();

    this._createModules();
  }

  /**
   * Register a module class for a given type
   * Called at import time by each module file
   */
  static registerModule(type, moduleClass) {
    MODULE_REGISTRY[type] = moduleClass;
    console.log(`[KTANE] Registered module type: ${type}`);
  }

  /**
   * Create module instances for all assigned slots
   */
  _createModules() {
    for (const mod of this.bombState.modules) {
      const ModuleClass = MODULE_REGISTRY[mod.type];
      if (!ModuleClass) {
        console.warn(`[KTANE] No module class registered for type: ${mod.type}`);
        continue;
      }

      const slot = this.bombModel.getSlotById(mod.slotId);
      if (!slot) {
        console.warn(`[KTANE] Slot not found: ${mod.slotId}`);
        continue;
      }

      const instance = new ModuleClass(
        mod.slotId,
        slot.mesh,
        this.bombState,
        this.callbacks
      );

      this.modules.set(mod.slotId, instance);
      console.log(`[KTANE] Created module: ${mod.type} at ${mod.slotId}`);
    }
  }

  /**
   * Route a click to the correct module
   * @param {string} slotId
   * @param {THREE.Vector3} point — World-space intersection point
   * @returns {boolean} — true if click was handled
   */
  handleSlotClick(slotId, point) {
    const module = this.modules.get(slotId);
    if (!module) return false;
    return module.handleClick(point);
  }

  /**
   * Get a module instance by slot ID
   */
  getModule(slotId) {
    return this.modules.get(slotId) || null;
  }

  /**
   * Check if all modules are solved
   */
  allSolved() {
    for (const module of this.modules.values()) {
      if (!module.isSolved) return false;
    }
    return true;
  }

  /**
   * Dispose all modules
   */
  dispose() {
    for (const module of this.modules.values()) {
      module.dispose();
    }
    this.modules.clear();
  }
}
