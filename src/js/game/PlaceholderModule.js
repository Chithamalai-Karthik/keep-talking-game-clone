/* ============================================================
   PlaceholderModule.js — Temporary module for unimplemented types
   Shows the module type name on the bomb face.
   Registers for all 4 module types until real ones are built.
   ============================================================ */

import { ModuleBase, CANVAS_SIZE } from './ModuleBase.js';
import { ModuleManager } from './ModuleManager.js';

class PlaceholderModule extends ModuleBase {
  constructor(slotId, slotMesh, bombState, callbacks) {
    super(slotId, slotMesh, bombState, callbacks);
    this.moduleName = 'PLACEHOLDER';
  }

  render() {
    const ctx = this.ctx;
    const s = CANVAS_SIZE;

    this._drawBackground();

    // Module type label
    const moduleConfig = this.bombState.modules.find(m => m.slotId === this.slotId);
    const typeName = moduleConfig ? moduleConfig.type.toUpperCase().replace('_', ' ') : '???';

    // Icon area
    ctx.fillStyle = '#1a2a3e';
    ctx.fillRect(s * 0.15, s * 0.2, s * 0.7, s * 0.4);
    ctx.strokeStyle = '#2a3a5a';
    ctx.lineWidth = 2;
    ctx.strokeRect(s * 0.15, s * 0.2, s * 0.7, s * 0.4);

    // Question mark icon
    ctx.fillStyle = '#3a4a6a';
    ctx.font = `bold ${s * 0.25}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', s / 2, s * 0.42);

    // Type name
    ctx.fillStyle = '#5a6a8a';
    ctx.font = `bold ${s * 0.06}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typeName, s / 2, s * 0.72);

    // "Coming soon" subtitle
    ctx.fillStyle = '#3a4a5a';
    ctx.font = `${s * 0.04}px monospace`;
    ctx.fillText('COMING SOON', s / 2, s * 0.82);

    this.texture.needsUpdate = true;
  }
}

// Register for all module types as fallback
ModuleManager.registerModule('wires', PlaceholderModule);
ModuleManager.registerModule('button', PlaceholderModule);
ModuleManager.registerModule('keypads', PlaceholderModule);
ModuleManager.registerModule('simon_says', PlaceholderModule);

export { PlaceholderModule };
