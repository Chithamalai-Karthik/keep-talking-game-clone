/* ============================================================
   BombModel.js — 3D Bomb Casing + Module Slots + Timer + Strikes
   Reoriented: front/back are the LARGE faces (3.2 × 2.2)
   Timer and strike indicators are physically on the bomb
   ============================================================ */

import * as THREE from 'three';
import { loadModel } from './ModelLoader.js';
import { createTextLabel } from './TextLabel.js';
import { drawDigit, drawStrike, timerCells } from './SevenSegment.js';

// Module slot layout constants
const SLOT_SIZE = 0.9;
const SLOT_GAP = 0.1;

// Bomb dimensions — front/back are the large faces
const BODY_WIDTH = 3.2;   // X axis (horizontal)
const BODY_HEIGHT = 2.2;  // Y axis (vertical when standing)
const BODY_DEPTH = 0.9;   // Z axis (thickness, front-to-back)

/** Half the bomb's size along its own axes, for landing and reaching it in VR */
export const BOMB_HALF_SIZE = Object.freeze({ x: BODY_WIDTH / 2, y: BODY_HEIGHT / 2, z: BODY_DEPTH / 2 });
// Blender widget node for each port type
const PORT_MODELS = {
  'DVI-D': 'port_dvi_d',
  'Parallel': 'port_parallel',
  'PS/2': 'port_ps2',
  'RJ-45': 'port_rj45',
  'Serial': 'port_serial',
  'Stereo RCA': 'port_rca',
};

const SLOT_PLANE_Z = 0.301; // Tray floor: slots sit recessed inside the rim

export class BombModel {
  constructor() {
    this.group = new THREE.Group();
    this.moduleSlots = [];
    this.widgetMounts = [];
    this._widgetDisposables = [];
    this._widgetRequest = 0;

    // Timer display
    this.timerGroup = new THREE.Group();
    this._timerSlot = null;

    // Strike indicators

    // Hover outline
    this.outlineMesh = null;

    this._buildCasing();
    this._buildModuleSlots();
    this._buildTimerDisplay();
    this._buildWidgetMounts();
    this._buildOutline();

    // Shown on the menu; each game picks its own slot
    this.setTimerSlot('back-4');
  }

  /* ----------------------------------------------------------
     BOMB CASING
  ---------------------------------------------------------- */
  _buildCasing() {
    loadModel('bomb_casing')
      .then((model) => {
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        model.userData.interactive = true;
        model.userData.type = 'casing';
        this.group.add(model);
      })
      .catch((err) => console.error('[KTANE] Failed to load bomb casing:', err));
  }

  /* ----------------------------------------------------------
     MODULE SLOTS — Front (6) and Back (6), one holds the timer
  ---------------------------------------------------------- */
  _buildModuleSlots() {
    // Front face: 3 columns × 2 rows = 6 module slots
    const frontSlots = this._createSlotGrid(3, 2, 'front');
    frontSlots.forEach((slot) => {
      slot.mesh.position.z = SLOT_PLANE_Z;
      slot.normal = new THREE.Vector3(0, 0, 1);
      slot.face = 'front';
      this.group.add(slot.mesh);
      this.moduleSlots.push(slot);
    });

    // Back face: 3 columns × 2 rows = 6 module slots
    const backSlots = this._createSlotGrid(3, 2, 'back');
    backSlots.forEach((slot) => {
      slot.mesh.position.z = -SLOT_PLANE_Z;
      slot.mesh.rotation.y = Math.PI;
      slot.normal = new THREE.Vector3(0, 0, -1);
      slot.face = 'back';
      this.group.add(slot.mesh);
      this.moduleSlots.push(slot);
    });

    this.moduleSlots.forEach(slot => this._loadCover(slot));
  }

  /**
   * Give a slot the orange plate that covers it while it has no module
   */
  _loadCover(slot) {
    loadModel('empty_slot')
      .then((cover) => {
        cover.traverse((child) => {
          if (child.isMesh) child.castShadow = true;
        });
        slot.cover = cover;
        slot.mesh.add(cover);
        this._refreshCover(slot);
      })
      .catch((err) => console.error('[KTANE] Failed to load slot cover:', err));
  }

  _refreshCover(slot) {
    if (slot.cover) slot.cover.visible = !slot.isActive && !slot.isTimerSlot;
  }

  /**
   * Put the timer in a slot. That slot stops being a module slot.
   */
  setTimerSlot(slotId) {
    if (this._timerSlot) {
      this._timerSlot.isTimerSlot = false;
      this._timerSlot.mesh.userData.interactive = true;
      this._timerSlot.mesh.userData.type = 'moduleSlot';
      this._refreshCover(this._timerSlot);
    }

    const slot = this.getSlotById(slotId);
    slot.isTimerSlot = true;
    slot.mesh.userData.interactive = false;
    slot.mesh.userData.type = 'timerSlot';
    slot.mesh.add(this.timerGroup);
    this._timerSlot = slot;
    this._refreshCover(slot);
  }

  _createSlotGrid(cols, rows, facePrefix) {
    const slots = [];
    const totalWidth = cols * SLOT_SIZE + (cols - 1) * SLOT_GAP;
    const totalHeight = rows * SLOT_SIZE + (rows - 1) * SLOT_GAP;
    const startX = -totalWidth / 2 + SLOT_SIZE / 2;
    const startY = totalHeight / 2 - SLOT_SIZE / 2;

    let slotIndex = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * (SLOT_SIZE + SLOT_GAP);
        const y = startY - row * (SLOT_SIZE + SLOT_GAP);

        // Slot background
        const slotGeo = new THREE.PlaneGeometry(SLOT_SIZE, SLOT_SIZE);
        const slotMat = new THREE.MeshStandardMaterial({
          color: 0x0f1525,
          roughness: 0.9,
          metalness: 0.1,
          side: THREE.FrontSide,
        });
        const slotMesh = new THREE.Mesh(slotGeo, slotMat);
        slotMesh.position.set(x, y, 0);

        // Slot border frame
        const borderGeo = this._createBorderGeometry(SLOT_SIZE, SLOT_SIZE, 0.03);
        const borderMat = new THREE.MeshStandardMaterial({
          color: 0x2a3a5a,
          roughness: 0.5,
          metalness: 0.4,
          side: THREE.FrontSide,
        });
        const borderMesh = new THREE.Mesh(borderGeo, borderMat);
        borderMesh.position.z = 0.001;
        slotMesh.add(borderMesh);

        const slotId = `${facePrefix}-${slotIndex}`;
        slotMesh.userData = {
          type: 'moduleSlot',
          slotId: slotId,
          interactive: true,
        };

        slots.push({
          id: slotId,
          mesh: slotMesh,
          border: borderMesh,
          position: new THREE.Vector3(x, y, 0),
          normal: new THREE.Vector3(),
          face: facePrefix,
          moduleType: null,
          solved: false,
          isActive: false,
          isTimerSlot: false,
        });

        slotIndex++;
      }
    }

    return slots;
  }

  _createBorderGeometry(width, height, thickness) {
    const shape = new THREE.Shape();
    const hw = width / 2, hh = height / 2;

    shape.moveTo(-hw, -hh);
    shape.lineTo(hw, -hh);
    shape.lineTo(hw, hh);
    shape.lineTo(-hw, hh);
    shape.lineTo(-hw, -hh);

    const hole = new THREE.Path();
    const ihw = hw - thickness, ihh = hh - thickness;
    hole.moveTo(-ihw, -ihh);
    hole.lineTo(ihw, -ihh);
    hole.lineTo(ihw, ihh);
    hole.lineTo(-ihw, ihh);
    hole.lineTo(-ihw, -ihh);
    shape.holes.push(hole);

    return new THREE.ShapeGeometry(shape);
  }

  /* ----------------------------------------------------------
     TIMER — timer_module.glb, with its red digits and strike
     marks drawn on its two screens
  ---------------------------------------------------------- */
  _buildTimerDisplay() {
    this._timerScreen = makeScreen(512, 248);
    this._strikeScreen = makeScreen(256, 102);
    this._timerText = '5:00';
    this._timerDanger = false;
    this._strikes = [false, false];

    loadModel('timer_module')
      .then((model) => {
        model.traverse((child) => {
          if (child.isMesh) child.castShadow = true;
        });
        model.getObjectByName('tm_screen').material = this._timerScreen.material;
        model.getObjectByName('tm_strike_screen').material = this._strikeScreen.material;
        this.timerGroup.add(model);
      })
      .catch((err) => console.error('[KTANE] Failed to load the timer:', err));

    this.updateTimerDisplay('5:00');
    this._drawStrikes();
  }

  /**
   * Show the time, as four red seven-segment digits
   * @param {string} timeString - like 5:00, or 59.84 under a minute
   * @param {boolean} isDanger - the last minute: the digits glow brighter
   */
  updateTimerDisplay(timeString, isDanger = false) {
    this._timerText = timeString;
    this._timerDanger = isDanger;
    const { ctx, canvas, texture } = this._timerScreen;
    const { left, right, separator } = timerCells(timeString);
    const lit = isDanger ? '#ff2a1f' : '#e8160c';
    const unlit = '#2a0d0b';
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.shadowColor = lit;
    const digitW = 92, digitH = 184, top = 32;
    const xs = [24, 132, 290, 398];
    [...left, ...right].forEach((char, i) => {
      ctx.shadowBlur = 0;
      drawDigit(ctx, '8', xs[i], top, digitW, digitH, unlit, unlit);
      ctx.shadowBlur = isDanger ? 18 : 12;
      drawDigit(ctx, char, xs[i], top, digitW, digitH, lit, 'rgba(0, 0, 0, 0)');
    });
    // The separator: two dots for minutes, one low dot for seconds
    ctx.shadowBlur = 10;
    ctx.fillStyle = lit;
    const dots = separator === ':' ? [top + digitH * 0.32, top + digitH * 0.68] : [top + digitH - 10];
    dots.forEach(y => { ctx.beginPath(); ctx.arc(256, y, 11, 0, Math.PI * 2); ctx.fill(); });
    ctx.shadowBlur = 0;
    texture.needsUpdate = true;
  }

  /**
   * Light or darken one of the two strike marks
   */
  setStrike(strikeIndex, active = true) {
    if (strikeIndex >= this._strikes.length) return;
    this._strikes[strikeIndex] = active;
    this._drawStrikes();
  }

  _drawStrikes() {
    const { ctx, canvas, texture } = this._strikeScreen;
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this._strikes.forEach((isLit, i) => {
      ctx.shadowColor = '#e8160c';
      ctx.shadowBlur = isLit ? 12 : 0;
      drawStrike(ctx, 46 + i * 112, 20, 52, 62, isLit, '#e8160c', '#2a0d0b');
    });
    ctx.shadowBlur = 0;
    texture.needsUpdate = true;
  }

  /* ----------------------------------------------------------
     WIDGET MOUNTS — Positions on both sides of each edge's rod
     Widgets are modelled flat: long side +X, facing +Z
  ---------------------------------------------------------- */
  _buildWidgetMounts() {
    const edges = [
      { normal: new THREE.Vector3(0, 1, 0), along: new THREE.Vector3(1, 0, 0), distance: BODY_HEIGHT / 2, cells: [-0.8, 0, 0.8] },
      { normal: new THREE.Vector3(0, -1, 0), along: new THREE.Vector3(1, 0, 0), distance: BODY_HEIGHT / 2, cells: [-0.8, 0, 0.8] },
      { normal: new THREE.Vector3(1, 0, 0), along: new THREE.Vector3(0, 1, 0), distance: BODY_WIDTH / 2, cells: [-0.34, 0.34] },
      { normal: new THREE.Vector3(-1, 0, 0), along: new THREE.Vector3(0, 1, 0), distance: BODY_WIDTH / 2, cells: [-0.34, 0.34] },
    ];

    for (const { normal, along, distance, cells } of edges) {
      const across = new THREE.Vector3().crossVectors(normal, along);
      const rotation = new THREE.Matrix4().makeBasis(along, across, normal);

      for (const cell of cells) {
        for (const lane of [-0.22, 0.22]) {
          const mount = new THREE.Group();
          mount.position.copy(normal).multiplyScalar(distance).addScaledVector(along, cell);
          mount.position.z += lane;
          mount.quaternion.setFromRotationMatrix(rotation);
          this.group.add(mount);
          this.widgetMounts.push(mount);
        }
      }
    }
  }

  /**
   * Flat text label for a widget, in the widget's own space
   */
  _createLabel(text, width, height, style) {
    const label = createTextLabel(text, width, height, style);
    this._widgetDisposables.push(label.material.map, label.material, label.geometry);
    return label;
  }

  _createWidget(widget, bombState, library) {
    const nodeName = {
      serial: 'serial_tag',
      battery: widget.size === 'D' ? 'battery_d' : 'battery_aa',
      indicator: 'indicator',
      port: PORT_MODELS[widget.port],
    }[widget.type];

    const object = library.getObjectByName(nodeName).clone(true);
    object.position.set(0, 0, 0);

    if (widget.type === 'serial') {
      const serial = this._createLabel(bombState.serial, 0.44, 0.2, { color: '#1a1a2e', font: 'bold 104px monospace' });
      serial.position.set(0.05, 0, 0.0105);
      object.add(serial);

      const tab = this._createLabel('SERIAL #', 0.22, 0.08, { color: '#f4efe4', font: 'bold 72px sans-serif' });
      tab.position.set(-0.23, 0, 0.014);
      tab.rotation.z = Math.PI / 2;
      object.add(tab);
    }

    if (widget.type === 'indicator') {
      const label = this._createLabel(widget.label, 0.29, 0.13, { color: '#f4efe4', font: 'bold 130px monospace' });
      label.position.set(0.09, 0, 0.044);
      object.add(label);

      const lens = object.getObjectByName('indicator_lens');
      lens.material = lens.material.clone();
      if (widget.lit) {
        lens.material.color.setHex(0xfff4d6);
        lens.material.emissive.setHex(0xfff4d6);
        lens.material.emissiveIntensity = 2;
      }
      this._widgetDisposables.push(lens.material);
    }

    return object;
  }

  _clearWidgets() {
    this.widgetMounts.forEach(mount => mount.clear());
    this._widgetDisposables.forEach(item => item.dispose());
    this._widgetDisposables = [];
  }

  /* ----------------------------------------------------------
     HOVER OUTLINE — Slightly scaled-up back-face shell
  ---------------------------------------------------------- */
  _buildOutline() {
    const outlineGeo = new THREE.BoxGeometry(
      BODY_WIDTH + 0.16,
      BODY_HEIGHT + 0.16,
      BODY_DEPTH + 0.08
    );
    const outlineMat = new THREE.MeshBasicMaterial({
      color: 0xff8c00,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.7,
    });
    this.outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
    this.outlineMesh.visible = false;
    this.group.add(this.outlineMesh);
  }

  /**
   * Show the hover outline glow
   */
  showOutline() {
    if (this.outlineMesh) this.outlineMesh.visible = true;
  }

  /**
   * Hide the hover outline glow
   */
  hideOutline() {
    if (this.outlineMesh) this.outlineMesh.visible = false;
  }

  /* ----------------------------------------------------------
     BOMB INFO — Show this bomb's widgets on its sides
  ---------------------------------------------------------- */

  /**
   * Replace the widgets with those of a new bomb
   * @param {BombState} bombState
   */
  async updateBombInfo(bombState) {
    const request = ++this._widgetRequest;
    this._clearWidgets();

    const library = await loadModel('bomb_widgets');
    if (request !== this._widgetRequest) return; // A newer bomb has started

    for (const widget of bombState.widgets) {
      this.widgetMounts[widget.mount].add(this._createWidget(widget, bombState, library));
    }
  }

  /**
   * Take everything from the last game off the bomb
   */
  clearBomb() {
    this._widgetRequest++; // Widgets still loading are no longer wanted
    this._clearWidgets();

    this.moduleSlots.forEach((slot) => {
      this.setSlotActive(slot.id, false);
      this.setSlotHighlight(slot.id, false);
    });
    this._strikes.forEach((_, i) => this.setStrike(i, false));
    this.updateTimerDisplay('5:00');
    this.hideOutline();
  }

  /* ----------------------------------------------------------
     PUBLIC API
  ---------------------------------------------------------- */

  getObject() {
    return this.group;
  }

  getSlots() {
    return this.moduleSlots;
  }

  getSlotById(slotId) {
    return this.moduleSlots.find(s => s.id === slotId);
  }

  getSlotWorldPosition(slotId) {
    const slot = this.getSlotById(slotId);
    if (!slot) return null;
    const worldPos = new THREE.Vector3();
    slot.mesh.getWorldPosition(worldPos);
    return worldPos;
  }

  /**
   * Mark a module slot as active (hoverable) or inactive
   */
  setSlotActive(slotId, active) {
    const slot = this.getSlotById(slotId);
    if (!slot) return;
    slot.isActive = active;
    this._refreshCover(slot);
  }

  /**
   * Light up a slot's border under the mouse
   */
  setSlotHighlight(slotId, highlighted) {
    const { material } = this.getSlotById(slotId).border;
    material.emissive.setHex(highlighted ? 0x3a86ff : 0x000000);
    material.emissiveIntensity = highlighted ? 0.5 : 0;
  }

  /**
   * Check if a slot is active
   */
  isSlotActive(slotId) {
    const slot = this.getSlotById(slotId);
    return slot ? slot.isActive : false;
  }

  /**
   * Get all interactive meshes for raycasting
   */
  getInteractiveMeshes() {
    return this.moduleSlots.map(s => s.mesh);
  }

  /**
   * Get all meshes that are part of the bomb (for raycasting pick-up)
   */
  getAllMeshes() {
    const meshes = [];
    this.group.traverse((child) => {
      if (child.isMesh) meshes.push(child);
    });
    return meshes;
  }
}

// A canvas shown on a screen of a model, unlit so it glows like a display
function makeScreen(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false; // glTF UVs start at the top
  texture.anisotropy = 8;
  return { canvas, ctx: canvas.getContext('2d'), texture, material: new THREE.MeshBasicMaterial({ map: texture }) };
}
