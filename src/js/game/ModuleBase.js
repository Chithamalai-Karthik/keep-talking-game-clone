/* ============================================================
   ModuleBase.js — Base class for all bomb modules
   Renders module UI as a canvas texture directly on the bomb face.
   Handles click detection via UV coordinate mapping.
   ============================================================ */

import * as THREE from 'three';

// Canvas resolution for module rendering
const CANVAS_SIZE = 512;

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
    this.isActive = true;

    // Module display name (override in subclasses)
    this.moduleName = 'MODULE';

    // --- Canvas setup ---
    this.canvas = document.createElement('canvas');
    this.canvas.width = CANVAS_SIZE;
    this.canvas.height = CANVAS_SIZE;
    this.ctx = this.canvas.getContext('2d');

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    // Apply canvas texture to the slot mesh
    this._applyTexture();

    // Interactive regions for click detection
    // Each region: { x, y, width, height, id, onClick }
    this._clickRegions = [];

    // Initial render
    this.render();
  }

  /* ----------------------------------------------------------
     TEXTURE APPLICATION
  ---------------------------------------------------------- */
  _applyTexture() {
    // Replace the slot mesh's material with one that shows our canvas
    this._emptySlotMaterial = this.slotMesh.material;

    this.slotMesh.material = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.FrontSide,
    });
  }

  /* ----------------------------------------------------------
     CLICK DETECTION — Convert 3D hit point to canvas coordinates
  ---------------------------------------------------------- */

  /**
   * Handle a click on this module's slot
   * @param {THREE.Vector3} point — World-space intersection point
   * @returns {boolean} — true if a click region was hit
   */
  handleClick(point) {
    if (this.isSolved || !this.isActive) return false;

    // Convert world point to local slot coordinates
    const localPoint = this.slotMesh.worldToLocal(point.clone());

    // The slot is a PlaneGeometry centered at origin
    // localPoint.x ranges from -SLOT_SIZE/2 to +SLOT_SIZE/2
    // localPoint.y ranges from -SLOT_SIZE/2 to +SLOT_SIZE/2
    const slotSize = this.slotMesh.geometry.parameters.width;

    // Map to canvas pixel coordinates (0,0 is top-left)
    const canvasX = ((localPoint.x / slotSize) + 0.5) * CANVAS_SIZE;
    const canvasY = (0.5 - (localPoint.y / slotSize)) * CANVAS_SIZE;

    // Check click regions
    for (const region of this._clickRegions) {
      if (
        canvasX >= region.x && canvasX <= region.x + region.width &&
        canvasY >= region.y && canvasY <= region.y + region.height
      ) {
        if (region.onClick) {
          region.onClick(region.id);
        }
        return true;
      }
    }

    return false;
  }

  /* ----------------------------------------------------------
     CLICK REGIONS — Subclasses register interactive areas
  ---------------------------------------------------------- */

  /**
   * Register a clickable region on the module canvas
   */
  addClickRegion(id, x, y, width, height, onClick) {
    this._clickRegions.push({ id, x, y, width, height, onClick });
  }

  /**
   * Clear all click regions (call before re-registering)
   */
  clearClickRegions() {
    this._clickRegions = [];
  }

  /* ----------------------------------------------------------
     RENDERING — Override in subclasses
  ---------------------------------------------------------- */

  /**
   * Render the module UI to the canvas. Override in subclasses.
   */
  render() {
    // Base render: dark background with module name
    this._drawBackground();
    this._drawModuleName();
    this.texture.needsUpdate = true;
  }

  /**
   * Draw the standard dark module background
   */
  _drawBackground() {
    const ctx = this.ctx;
    const s = CANVAS_SIZE;

    // Dark module background
    ctx.fillStyle = '#0f1525';
    ctx.fillRect(0, 0, s, s);

    // Subtle inner border
    ctx.strokeStyle = '#1a2a4a';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, s - 16, s - 16);
  }

  /**
   * Draw the module name at the top
   */
  _drawModuleName() {
    const ctx = this.ctx;
    ctx.fillStyle = '#4a5a7a';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(this.moduleName, CANVAS_SIZE / 2, 20);
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
    this.isActive = false;

    // Visual: green border on the slot
    this._showSolvedVisual();

    // Notify game
    if (this.onSolveCallback) {
      this.onSolveCallback(this.slotId);
    }

    console.log(`[KTANE] Module ${this.slotId} (${this.moduleName}) SOLVED!`);
  }

  /**
   * Record a strike from this module
   */
  strike() {
    // Visual: red flash on the slot
    this._showStrikeFlash();

    // Notify game
    if (this.onStrikeCallback) {
      this.onStrikeCallback(this.slotId);
    }

    console.log(`[KTANE] Module ${this.slotId} (${this.moduleName}) STRIKE!`);
  }

  /* ----------------------------------------------------------
     VISUAL FEEDBACK
  ---------------------------------------------------------- */

  _showSolvedVisual() {
    // Draw green checkmark overlay on canvas
    const ctx = this.ctx;
    const s = CANVAS_SIZE;

    // Semi-transparent green overlay
    ctx.fillStyle = 'rgba(46, 204, 113, 0.15)';
    ctx.fillRect(0, 0, s, s);

    // Green border
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, s - 8, s - 8);

    // Checkmark
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(s * 0.3, s * 0.55);
    ctx.lineTo(s * 0.45, s * 0.7);
    ctx.lineTo(s * 0.7, s * 0.35);
    ctx.stroke();

    this.texture.needsUpdate = true;

    // Also update the slot border mesh to green
    this.slotMesh.traverse((child) => {
      if (child !== this.slotMesh && child.material && child.material.color) {
        child.material.color.setHex(0x2ecc71);
        if (child.material.emissive) {
          child.material.emissive.setHex(0x2ecc71);
          child.material.emissiveIntensity = 0.3;
        }
      }
    });
  }

  _showStrikeFlash() {
    // Red flash on border, then revert
    this.slotMesh.traverse((child) => {
      if (child !== this.slotMesh && child.material && child.material.color) {
        const originalColor = child.material.color.getHex();
        child.material.color.setHex(0xe94560);
        if (child.material.emissive) {
          child.material.emissive.setHex(0xe94560);
          child.material.emissiveIntensity = 0.8;
        }

        // Revert after 300ms
        setTimeout(() => {
          child.material.color.setHex(originalColor);
          if (child.material.emissive) {
            child.material.emissive.setHex(0x000000);
            child.material.emissiveIntensity = 0;
          }
        }, 300);
      }
    });
  }

  /* ----------------------------------------------------------
     CLEANUP
  ---------------------------------------------------------- */
  dispose() {
    if (this.texture) this.texture.dispose();
    this.slotMesh.material.dispose();
    this.slotMesh.material = this._emptySlotMaterial;
    this._clickRegions = [];
  }
}

export { CANVAS_SIZE };
