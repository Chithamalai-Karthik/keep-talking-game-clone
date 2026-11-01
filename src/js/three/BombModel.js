/* ============================================================
   BombModel.js — 3D Bomb Casing + Module Slots + Timer + Strikes
   Reoriented: front/back are the LARGE faces (3.2 × 2.2)
   Timer and strike indicators are physically on the bomb
   ============================================================ */

import * as THREE from 'three';
import { loadModel } from './ModelLoader.js';

// Module slot layout constants
const SLOT_SIZE = 0.9;
const SLOT_GAP = 0.1;

// Bomb dimensions — front/back are the large faces
const BODY_WIDTH = 3.2;   // X axis (horizontal)
const BODY_HEIGHT = 2.2;  // Y axis (vertical when standing)
const BODY_DEPTH = 0.9;   // Z axis (thickness, front-to-back)
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
    this.timerCanvas = null;
    this.timerContext = null;
    this.timerTexture = null;
    this.timerMesh = null;
    this.timerGroup = new THREE.Group();
    this._timerSlot = null;

    // Strike indicators
    this.strikeMeshes = [];

    // Hover outline
    this.outlineMesh = null;

    this._buildCasing();
    this._buildModuleSlots();
    this._buildTimerDisplay();
    this._buildStrikeIndicators();
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
  }

  /**
   * Put the timer in a slot. That slot stops being a module slot.
   */
  setTimerSlot(slotId) {
    if (this._timerSlot) {
      this._timerSlot.isTimerSlot = false;
      this._timerSlot.mesh.userData.interactive = true;
      this._timerSlot.mesh.userData.type = 'moduleSlot';
    }

    const slot = this.getSlotById(slotId);
    slot.isTimerSlot = true;
    slot.mesh.userData.interactive = false;
    slot.mesh.userData.type = 'timerSlot';
    slot.mesh.add(this.timerGroup);
    this._timerSlot = slot;
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
     TIMER DISPLAY — Canvas texture on back face
  ---------------------------------------------------------- */
  _buildTimerDisplay() {
    // Create canvas for timer digits
    this.timerCanvas = document.createElement('canvas');
    this.timerCanvas.width = 256;
    this.timerCanvas.height = 128;
    this.timerContext = this.timerCanvas.getContext('2d');

    this.timerTexture = new THREE.CanvasTexture(this.timerCanvas);
    this.timerTexture.minFilter = THREE.LinearFilter;

    // Timer display plane (fills the timer slot)
    const timerGeo = new THREE.PlaneGeometry(SLOT_SIZE - 0.06, SLOT_SIZE * 0.5);
    const timerMat = new THREE.MeshStandardMaterial({
      map: this.timerTexture,
      emissiveMap: this.timerTexture,
      emissive: 0xffffff,
      emissiveIntensity: 0.6,
      roughness: 0.8,
      metalness: 0.1,
      transparent: true,
      side: THREE.DoubleSide,
    });
    this.timerMesh = new THREE.Mesh(timerGeo, timerMat);
    this.timerMesh.position.set(0, 0.05, 0.003);

    this.timerGroup.add(this.timerMesh);



    // Initial draw
    this.updateTimerDisplay('5:00');
  }

  /**
   * Update the timer display with a time string
   */
  updateTimerDisplay(timeString, isDanger = false) {
    const ctx = this.timerContext;
    const w = this.timerCanvas.width;
    const h = this.timerCanvas.height;

    // Clear to transparent (no background panel)
    ctx.clearRect(0, 0, w, h);

    // Time digits — red, brighter in danger mode
    const color = isDanger ? '#ff2040' : '#e94560';
    ctx.fillStyle = color;
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeString, w / 2, h / 2);

    // Glow effect — stronger in danger mode
    ctx.shadowColor = color;
    ctx.shadowBlur = isDanger ? 25 : 15;
    ctx.fillText(timeString, w / 2, h / 2);
    ctx.shadowBlur = 0;

    this.timerTexture.needsUpdate = true;

    // Pulse the emissive intensity in danger mode
    if (this.timerMesh) {
      this.timerMesh.material.emissiveIntensity = isDanger ? 1.2 : 0.6;
    }
  }

  /* ----------------------------------------------------------
     STRIKE INDICATORS — Two "X" LEDs near the timer
  ---------------------------------------------------------- */
  _buildStrikeIndicators() {
    const strikeSize = 0.08;

    for (let i = 0; i < 2; i++) {
      const strikeGroup = new THREE.Group();

      // X shape: two crossed bars
      const barGeo = new THREE.BoxGeometry(strikeSize * 1.5, strikeSize * 0.3, 0.01);
      const barMat = new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        emissive: 0x2a2a3a,
        emissiveIntensity: 0.1,
        roughness: 0.5,
        metalness: 0.4,
      });

      const bar1 = new THREE.Mesh(barGeo, barMat.clone());
      bar1.rotation.z = Math.PI / 4;
      strikeGroup.add(bar1);

      const bar2 = new THREE.Mesh(barGeo, barMat.clone());
      bar2.rotation.z = -Math.PI / 4;
      strikeGroup.add(bar2);

      // Circle backing
      const backGeo = new THREE.CircleGeometry(strikeSize * 0.9, 16);
      const backMat = new THREE.MeshStandardMaterial({
        color: 0x0f0f1a,
        roughness: 0.9,
        side: THREE.DoubleSide,
      });
      const back = new THREE.Mesh(backGeo, backMat);
      back.position.z = -0.005;
      strikeGroup.add(back);

      // Position below the timer display within the timer slot
      const xOffset = (i - 0.5) * 0.3;
      strikeGroup.position.set(
        xOffset,
        -SLOT_SIZE * 0.25,
        0.005
      );

      this.timerGroup.add(strikeGroup);

      this.strikeMeshes.push({
        group: strikeGroup,
        bar1: bar1,
        bar2: bar2,
        active: false,
      });
    }
  }

  /**
   * Activate a strike indicator (light it up red)
   */
  setStrike(strikeIndex, active = true) {
    if (strikeIndex >= this.strikeMeshes.length) return;

    const strike = this.strikeMeshes[strikeIndex];
    strike.active = active;

    const color = active ? 0xe94560 : 0x2a2a3a;
    const intensity = active ? 1.5 : 0.1;

    [strike.bar1, strike.bar2].forEach(bar => {
      bar.material.color.setHex(color);
      bar.material.emissive.setHex(color);
      bar.material.emissiveIntensity = intensity;
    });
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
  _createLabel(text, width, height, { color, background, font }) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = Math.round(512 * (height / width));
    const ctx = canvas.getContext('2d');

    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: !background });
    const geometry = new THREE.PlaneGeometry(width, height);
    this._widgetDisposables.push(texture, material, geometry);

    return new THREE.Mesh(geometry, material);
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
