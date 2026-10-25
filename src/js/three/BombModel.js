/* ============================================================
   BombModel.js — 3D Bomb Casing + Module Slots + Timer + Strikes
   Reoriented: front/back are the LARGE faces (3.2 × 2.2)
   Timer and strike indicators are physically on the bomb
   ============================================================ */

import * as THREE from 'three';

// Module slot layout constants
const SLOT_SIZE = 0.9;
const SLOT_GAP = 0.1;

// Bomb dimensions — front/back are the large faces
const BODY_WIDTH = 3.2;   // X axis (horizontal)
const BODY_HEIGHT = 2.2;  // Y axis (vertical when standing)
const BODY_DEPTH = 0.9;   // Z axis (thickness, front-to-back)

export class BombModel {
  constructor() {
    this.group = new THREE.Group();
    this.moduleSlots = [];
    this.sideInfoMeshes = {};

    // Timer display
    this.timerCanvas = null;
    this.timerContext = null;
    this.timerTexture = null;
    this.timerMesh = null;

    // Strike indicators
    this.strikeMeshes = [];

    // Hover outline
    this.outlineMesh = null;

    this._buildCasing();
    this._buildModuleSlots();
    this._buildTimerDisplay();
    this._buildStrikeIndicators();
    this._buildSidePanels();
    this._buildDecorations();
    this._buildOutline();
  }

  /* ----------------------------------------------------------
     BOMB CASING
  ---------------------------------------------------------- */
  _buildCasing() {
    // Main body
    const bodyGeo = new THREE.BoxGeometry(BODY_WIDTH, BODY_HEIGHT, BODY_DEPTH, 2, 2, 2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.7,
      metalness: 0.3,
      flatShading: true,
    });
    this.casingMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.casingMesh.castShadow = true;
    this.casingMesh.receiveShadow = true;
    this.group.add(this.casingMesh);

    // Edge borders (horizontal strips on top/bottom)
    const hBorderGeo = new THREE.BoxGeometry(BODY_WIDTH + 0.04, 0.04, BODY_DEPTH + 0.04);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a4a,
      roughness: 0.5,
      metalness: 0.5,
      flatShading: true,
    });
    const topBorder = new THREE.Mesh(hBorderGeo, borderMat);
    topBorder.position.y = BODY_HEIGHT / 2;
    topBorder.castShadow = true;
    this.group.add(topBorder);

    const bottomBorder = topBorder.clone();
    bottomBorder.position.y = -BODY_HEIGHT / 2;
    this.group.add(bottomBorder);

    // Vertical edge borders (left/right)
    const vBorderGeo = new THREE.BoxGeometry(0.04, BODY_HEIGHT + 0.04, BODY_DEPTH + 0.04);
    const leftVBorder = new THREE.Mesh(vBorderGeo, borderMat);
    leftVBorder.position.x = -BODY_WIDTH / 2;
    this.group.add(leftVBorder);

    const rightVBorder = leftVBorder.clone();
    rightVBorder.position.x = BODY_WIDTH / 2;
    this.group.add(rightVBorder);

    // Corner accents (vertical cylinders at corners)
    const cornerGeo = new THREE.CylinderGeometry(0.05, 0.05, BODY_HEIGHT + 0.08, 8);
    const cornerMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a5a,
      roughness: 0.4,
      metalness: 0.6,
      flatShading: true,
    });

    const hw = BODY_WIDTH / 2;
    const hd = BODY_DEPTH / 2;
    [
      [-hw, 0, -hd], [hw, 0, -hd],
      [-hw, 0, hd], [hw, 0, hd],
    ].forEach(([x, y, z]) => {
      const corner = new THREE.Mesh(cornerGeo, cornerMat);
      corner.position.set(x, y, z);
      corner.castShadow = true;
      this.group.add(corner);
    });

    // Handle / latch on top
    const handleBaseGeo = new THREE.BoxGeometry(1.0, 0.06, 0.15);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a6a,
      roughness: 0.3,
      metalness: 0.7,
      flatShading: true,
    });
    const handle = new THREE.Mesh(handleBaseGeo, handleMat);
    handle.position.set(0, BODY_HEIGHT / 2 + 0.03, 0);
    handle.castShadow = true;
    this.group.add(handle);
  }

  /* ----------------------------------------------------------
     MODULE SLOTS — Front (6) and Back (5 + timer slot)
  ---------------------------------------------------------- */
  _buildModuleSlots() {
    // Front face: 3 columns × 2 rows = 6 module slots
    const frontSlots = this._createSlotGrid(3, 2, 'front');
    frontSlots.forEach((slot) => {
      slot.mesh.position.z = BODY_DEPTH / 2 + 0.001;
      slot.normal = new THREE.Vector3(0, 0, 1);
      slot.face = 'front';
      this.group.add(slot.mesh);
      this.moduleSlots.push(slot);
    });

    // Back face: 3 columns × 2 rows = 6 positions
    // Bottom-center (index 4, row=1 col=1) is reserved for TIMER
    const backPositions = this._createSlotGrid(3, 2, 'back');
    backPositions.forEach((slot, i) => {
      slot.mesh.position.z = -(BODY_DEPTH / 2 + 0.001);
      slot.mesh.rotation.y = Math.PI;
      slot.normal = new THREE.Vector3(0, 0, -1);
      slot.face = 'back';

      // Bottom-center slot (row 1, col 1) = index 4 → timer slot
      if (i === 4) {
        slot.isTimerSlot = true;
        slot.mesh.userData.interactive = false; // Can't click timer
        slot.mesh.userData.type = 'timerSlot';
        // We'll add the timer display as a child of this mesh
        this._timerSlotMesh = slot.mesh;
      }

      this.group.add(slot.mesh);
      if (!slot.isTimerSlot) {
        this.moduleSlots.push(slot);
      }
    });
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

    if (this._timerSlotMesh) {
      this._timerSlotMesh.add(this.timerMesh);
    }



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

      if (this._timerSlotMesh) {
        this._timerSlotMesh.add(strikeGroup);
      }

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
     SIDE PANELS — Serial, batteries, indicators, ports
     Placed on the narrow sides of the bomb
  ---------------------------------------------------------- */
  _buildSidePanels() {
    // --- Right side: Serial number plate ---
    const serialGeo = new THREE.PlaneGeometry(BODY_DEPTH * 0.8, BODY_HEIGHT * 0.2);
    const serialMat = new THREE.MeshStandardMaterial({
      color: 0xd4c5a9,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const serialPlate = new THREE.Mesh(serialGeo, serialMat);
    serialPlate.position.set(BODY_WIDTH / 2 + 0.03, -0.4, 0);
    serialPlate.rotation.y = Math.PI / 2;
    this.group.add(serialPlate);
    this.sideInfoMeshes.serialPlate = serialPlate;

    // --- Left side: Battery holder ---
    const batteryHolderGeo = new THREE.BoxGeometry(0.05, 0.5, 0.5);
    const batteryHolderMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      roughness: 0.6,
      metalness: 0.4,
      flatShading: true,
    });
    const batteryHolder = new THREE.Mesh(batteryHolderGeo, batteryHolderMat);
    batteryHolder.position.set(-(BODY_WIDTH / 2 + 0.025), 0.3, 0);
    batteryHolder.castShadow = true;
    this.group.add(batteryHolder);

    // Batteries
    const batteryGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
    const batteryMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a4e,
      roughness: 0.5,
      metalness: 0.5,
    });
    for (let i = 0; i < 2; i++) {
      const battery = new THREE.Mesh(batteryGeo, batteryMat);
      battery.rotation.z = Math.PI / 2;
      battery.position.set(-(BODY_WIDTH / 2 + 0.06), 0.3, (i - 0.5) * 0.18);
      this.group.add(battery);
    }

    // --- Bottom: Port plate ---
    const portPlateGeo = new THREE.BoxGeometry(1.0, 0.04, 0.3);
    const portPlateMat = new THREE.MeshStandardMaterial({
      color: 0x1e2a3e,
      roughness: 0.7,
      metalness: 0.3,
      flatShading: true,
    });
    const portPlate = new THREE.Mesh(portPlateGeo, portPlateMat);
    portPlate.position.set(0.5, -(BODY_HEIGHT / 2 + 0.02), 0);
    this.group.add(portPlate);

    // Port connectors
    const portColors = [0x3a86ff, 0xe94560, 0xf5a623];
    portColors.forEach((color, i) => {
      const portGeo = new THREE.BoxGeometry(0.18, 0.03, 0.12);
      const portMat = new THREE.MeshStandardMaterial({
        color, roughness: 0.5, metalness: 0.4,
        emissive: color, emissiveIntensity: 0.1,
      });
      const port = new THREE.Mesh(portGeo, portMat);
      port.position.set(0.5 + (i - 1) * 0.28, -(BODY_HEIGHT / 2 + 0.04), 0);
      this.group.add(port);
    });

    // --- Right side: Indicator label + LED ---
    const indicatorGeo = new THREE.PlaneGeometry(0.4, 0.15);
    const indicatorMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a3e,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
    indicator.position.set(BODY_WIDTH / 2 + 0.001, 0.4, 0);
    indicator.rotation.y = Math.PI / 2;
    this.group.add(indicator);

    // Indicator LED
    const indLedGeo = new THREE.CircleGeometry(0.03, 16);
    const indLedMat = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      emissive: 0x2ecc71,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });
    const indLed = new THREE.Mesh(indLedGeo, indLedMat);
    indLed.position.set(BODY_WIDTH / 2 + 0.002, 0.4, 0.22);
    indLed.rotation.y = Math.PI / 2;
    this.group.add(indLed);
    this.sideInfoMeshes.indicatorLed = indLed;
  }

  /* ----------------------------------------------------------
     DECORATIONS
  ---------------------------------------------------------- */
  _buildDecorations() {
    // Screws on front face corners
    const screwGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 6);
    const screwMat = new THREE.MeshStandardMaterial({
      color: 0x6a6a8a, roughness: 0.3, metalness: 0.8,
    });

    const sw = BODY_WIDTH / 2 - 0.08;
    const sh = BODY_HEIGHT / 2 - 0.08;
    const sz = BODY_DEPTH / 2 + 0.01;

    [
      [-sw, sh, sz], [sw, sh, sz],
      [-sw, -sh, sz], [sw, -sh, sz],
      [-sw, sh, -sz], [sw, sh, -sz],
      [-sw, -sh, -sz], [sw, -sh, -sz],
    ].forEach(([x, y, z]) => {
      const screw = new THREE.Mesh(screwGeo, screwMat);
      screw.position.set(x, y, z);
      screw.rotation.x = Math.PI / 2;
      this.group.add(screw);
    });

    // Warning stripe on left side
    const stripeGeo = new THREE.PlaneGeometry(0.5, 0.05);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xf5a623, roughness: 0.8, metalness: 0.1,
      emissive: 0xf5a623, emissiveIntensity: 0.15,
      side: THREE.DoubleSide,
    });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(-(BODY_WIDTH / 2 + 0.001), -0.5, 0);
    stripe.rotation.y = -Math.PI / 2;
    this.group.add(stripe);
  }

  /* ----------------------------------------------------------
     HOVER OUTLINE — Slightly scaled-up back-face shell
  ---------------------------------------------------------- */
  _buildOutline() {
    const outlineGeo = new THREE.BoxGeometry(
      BODY_WIDTH + 0.08,
      BODY_HEIGHT + 0.08,
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
     BOMB INFO — Update side panels with BombState data
  ---------------------------------------------------------- */

  /**
   * Update the 3D bomb visuals with generated bomb state info
   * @param {BombState} bombState
   */
  updateBombInfo(bombState) {
    // --- Serial Number on the plate ---
    const serialPlate = this.sideInfoMeshes.serialPlate;
    console.log('[KTANE] updateBombInfo called, serialPlate:', !!serialPlate, 'serial:', bombState.serial);

    if (serialPlate) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 96;
      const ctx = canvas.getContext('2d');

      // Plate background
      ctx.fillStyle = '#d4c5a9';
      ctx.fillRect(0, 0, 256, 96);

      // Border
      ctx.strokeStyle = '#8a7a5a';
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, 248, 88);

      // Serial text — large, dark, clear
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bombState.serial, 128, 50);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      // Replace with a new material to ensure the texture applies
      serialPlate.material.dispose();
      serialPlate.material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
    }

    // --- Indicator label + LED ---
    const indLed = this.sideInfoMeshes.indicatorLed;
    if (indLed && bombState.indicators.length > 0) {
      const firstInd = bombState.indicators[0];
      const litColor = firstInd.lit ? 0x2ecc71 : 0x333333;
      const intensity = firstInd.lit ? 0.8 : 0.1;
      indLed.material.color.setHex(litColor);
      indLed.material.emissive.setHex(litColor);
      indLed.material.emissiveIntensity = intensity;
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
   * Get the bomb casing mesh (for click-to-pick-up detection)
   */
  getCasingMesh() {
    return this.casingMesh;
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
