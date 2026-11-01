/* ============================================================
   BombController.js — Bomb Rotation & Interaction States
   Handles mouse-drag rotation of the bomb (not the camera),
   pick-up/put-down animations, and zoom-to-module rotation
   ============================================================ */

import * as THREE from 'three';

// Interaction states
export const BOMB_STATE = {
  ON_TABLE: 'on-table',
  PICKING_UP: 'picking-up',
  HELD: 'held',
  PUTTING_DOWN: 'putting-down',
  MODULE_FOCUSED: 'module-focused',
  MODULE_UNFOCUSING: 'module-unfocusing',
};

// Pixels the mouse must move before a press counts as a drag
const DRAG_THRESHOLD = 5;

export class BombController {
  constructor(bombGroup, camera) {
    this.bomb = bombGroup;
    this.camera = camera;
    this.state = BOMB_STATE.ON_TABLE;

    // --- Positions & rotations for each state ---

    // On table: bomb lies flat on the desk
    // Desk surface top = 0.56, bomb depth/2 when flat = 0.45 → center at 1.01
    this.tablePosition = new THREE.Vector3(0, 1.01, 0);
    this.tableRotation = new THREE.Euler(-Math.PI / 2, 0, 0);

    // Held: bomb floats in front of camera, standing upright
    // bomb height/2 = 1.1, give some clearance above desk
    this.heldPosition = new THREE.Vector3(0, 3, 0);
    this.heldRotation = new THREE.Euler(0, 0, 0);

    // Camera positions
    this.cameraTablePosition = new THREE.Vector3(0, 3.5, 3.5);
    this.cameraTableLookAt = new THREE.Vector3(0, 0.8, 0);
    this.cameraHeldPosition = new THREE.Vector3(0, 3, 4);
    this.cameraHeldLookAt = new THREE.Vector3(0, 3, 0);

    // --- Mouse drag rotation state ---
    this._isDragging = false;
    this._isPressed = false;
    this._wasDragged = false;
    this._pressStart = new THREE.Vector2();
    this._previousMouse = new THREE.Vector2();
    this._targetRotation = new THREE.Euler(0, 0, 0);
    this._currentRotation = new THREE.Euler(0, 0, 0);
    this._rotationVelocity = new THREE.Vector2(0, 0);
    this._dragSensitivity = 0.006;
    this._damping = 0.92;
    this._maxTiltX = Math.PI * 0.35; // ±63° vertical tilt

    // --- Animation state ---
    this._anim = null; // { from, to, progress, duration, callback }

    // --- Module focus state ---
    this._focusedSlotId = null;
    this._preFocusRotation = new THREE.Euler();

    // Set initial state
    this.bomb.position.copy(this.tablePosition);
    this.bomb.rotation.copy(this.tableRotation);
  }

  /**
   * Instantly reset bomb and camera to table state (no animation)
   */
  resetToTable() {
    this.state = BOMB_STATE.ON_TABLE;
    this._anim = null;
    this._cameraAnim = null;
    this._isDragging = false;
    this._isPressed = false;
    this._wasDragged = false;
    this._focusedSlotId = null;
    this._targetRotation.set(0, 0, 0);
    this._currentRotation.set(0, 0, 0);
    this._rotationVelocity.set(0, 0);

    this.bomb.position.copy(this.tablePosition);
    this.bomb.rotation.copy(this.tableRotation);

    this.camera.position.copy(this.cameraTablePosition);
    this.camera.lookAt(this.cameraTableLookAt);
  }

  /* ----------------------------------------------------------
     MOUSE EVENTS — Call from main.js
  ---------------------------------------------------------- */

  onMouseDown(event) {
    if (event.button !== 0) return; // Left click only

    this._isPressed = true;
    this._wasDragged = false;
    this._pressStart.set(event.clientX, event.clientY);

    if (this.state !== BOMB_STATE.HELD && this.state !== BOMB_STATE.MODULE_FOCUSED) return;

    this._isDragging = true;
    this._previousMouse.set(event.clientX, event.clientY);
    this._rotationVelocity.set(0, 0);
  }

  onMouseMove(event) {
    if (this._isPressed && !this._wasDragged) {
      const moved = Math.hypot(event.clientX - this._pressStart.x, event.clientY - this._pressStart.y);
      this._wasDragged = moved > DRAG_THRESHOLD;
    }

    if (!this._isDragging || (this.state !== BOMB_STATE.HELD && this.state !== BOMB_STATE.MODULE_FOCUSED)) return;

    if (this.state === BOMB_STATE.MODULE_FOCUSED) {
      if (!this._wasDragged) return;

      // A real drag on a focused module returns to free rotation
      this.state = BOMB_STATE.HELD;
      this._focusedSlotId = null;
    }

    const deltaX = event.clientX - this._previousMouse.x;
    const deltaY = event.clientY - this._previousMouse.y;

    // Horizontal drag → Y rotation (spin left/right)
    this._targetRotation.y += deltaX * this._dragSensitivity;

    // Vertical drag → X rotation (tilt up/down), clamped
    this._targetRotation.x += deltaY * this._dragSensitivity;
    this._targetRotation.x = THREE.MathUtils.clamp(
      this._targetRotation.x,
      -this._maxTiltX,
      this._maxTiltX
    );

    // Track velocity for momentum
    this._rotationVelocity.set(
      deltaX * this._dragSensitivity,
      deltaY * this._dragSensitivity
    );

    this._previousMouse.set(event.clientX, event.clientY);
  }

  onMouseUp(event) {
    if (event.button !== 0) return;
    this._isDragging = false;
    this._isPressed = false;
  }

  /* ----------------------------------------------------------
     PICK UP / PUT DOWN
  ---------------------------------------------------------- */

  /**
   * Pick the bomb up off the table
   */
  pickUp(callback = null) {
    if (this.state !== BOMB_STATE.ON_TABLE) return;
    this.state = BOMB_STATE.PICKING_UP;

    // Reset target rotation for held state
    this._targetRotation.set(0, 0, 0);
    this._currentRotation.set(0, 0, 0);

    // Animate bomb from table to held position
    this._animateBomb(
      {
        position: this.tablePosition.clone(),
        rotation: this.tableRotation.clone(),
      },
      {
        position: this.heldPosition.clone(),
        rotation: this.heldRotation.clone(),
      },
      0.8,
      () => {
        this.state = BOMB_STATE.HELD;
        if (callback) callback();
      }
    );

    // Simultaneously animate camera
    this._animateCamera(
      this.cameraTablePosition.clone(),
      this.cameraTableLookAt.clone(),
      this.cameraHeldPosition.clone(),
      this.cameraHeldLookAt.clone(),
      0.8
    );
  }

  /**
   * Put the bomb back on the table
   */
  putDown(callback = null) {
    if (this.state !== BOMB_STATE.HELD && this.state !== BOMB_STATE.MODULE_FOCUSED) return;

    const prevState = this.state;
    this.state = BOMB_STATE.PUTTING_DOWN;
    this._focusedSlotId = null;

    // Animate from current position/rotation back to table
    this._animateBomb(
      {
        position: this.bomb.position.clone(),
        rotation: this.bomb.rotation.clone(),
      },
      {
        position: this.tablePosition.clone(),
        rotation: this.tableRotation.clone(),
      },
      0.8,
      () => {
        this.state = BOMB_STATE.ON_TABLE;
        this._targetRotation.set(0, 0, 0);
        this._currentRotation.set(0, 0, 0);
        if (callback) callback();
      }
    );

    // Animate camera back
    this._animateCamera(
      this.camera.position.clone(),
      this.cameraHeldLookAt.clone(),
      this.cameraTablePosition.clone(),
      this.cameraTableLookAt.clone(),
      0.8
    );
  }

  /* ----------------------------------------------------------
     MODULE FOCUS — Rotate bomb so module faces camera
  ---------------------------------------------------------- */

  /**
   * Rotate the bomb so a specific module slot faces the camera
   * @param {string} face - 'front' or 'back'
   * @param {Function} callback - called when rotation completes
   */
  focusModule(face, slotId, callback = null) {
    if (this.state !== BOMB_STATE.HELD && this.state !== BOMB_STATE.MODULE_FOCUSED) return;

    // Save current rotation to restore later
    this._preFocusRotation.copy(this._targetRotation);
    this._focusedSlotId = slotId;

    // Determine target Y rotation to face the module toward camera
    let targetY = 0;
    if (face === 'back') {
      targetY = Math.PI; // Rotate 180° to show back
    }
    // For front face, targetY = 0 (already facing camera)

    // Find shortest rotation path
    const currentY = this._targetRotation.y;
    const deltaY = targetY - currentY;
    const shortDelta = ((deltaY + Math.PI) % (2 * Math.PI)) - Math.PI;

    const focusRotation = new THREE.Euler(0, currentY + shortDelta, 0);

    this.state = BOMB_STATE.MODULE_FOCUSED;

    this._animateBomb(
      {
        position: this.bomb.position.clone(),
        rotation: new THREE.Euler(
          this._currentRotation.x,
          this._currentRotation.y,
          0
        ),
      },
      {
        position: this.heldPosition.clone(),
        rotation: focusRotation,
      },
      0.5,
      () => {
        this._targetRotation.x = focusRotation.x;
        this._targetRotation.y = focusRotation.y;
        this._currentRotation.x = focusRotation.x;
        this._currentRotation.y = focusRotation.y;
        if (callback) callback();
      }
    );
  }

  /**
   * Return from module focus to free rotation
   */
  unfocusModule(callback = null) {
    if (this.state !== BOMB_STATE.MODULE_FOCUSED) return;
    this.state = BOMB_STATE.MODULE_UNFOCUSING;
    this._focusedSlotId = null;

    // Brief transition to allow free rotation again
    setTimeout(() => {
      this.state = BOMB_STATE.HELD;
      if (callback) callback();
    }, 100);
  }

  /* ----------------------------------------------------------
     ANIMATION ENGINE
  ---------------------------------------------------------- */

  _animateBomb(from, to, duration, callback) {
    this._anim = {
      fromPos: from.position,
      fromRot: from.rotation,
      toPos: to.position,
      toRot: to.rotation,
      progress: 0,
      duration: duration,
      callback: callback,
    };
  }

  _cameraAnim = null;

  _animateCamera(fromPos, fromLookAt, toPos, toLookAt, duration) {
    this._cameraAnim = {
      fromPos: fromPos.clone(),
      fromLookAt: fromLookAt.clone(),
      toPos: toPos.clone(),
      toLookAt: toLookAt.clone(),
      progress: 0,
      duration: duration,
    };
  }

  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ----------------------------------------------------------
     UPDATE — Call every frame
  ---------------------------------------------------------- */

  update(delta) {
    // --- Bomb animation (pick up / put down / focus) ---
    if (this._anim) {
      this._anim.progress += delta / this._anim.duration;
      if (this._anim.progress >= 1) {
        this._anim.progress = 1;
      }

      const t = this._easeInOutCubic(this._anim.progress);

      // Interpolate position
      this.bomb.position.lerpVectors(this._anim.fromPos, this._anim.toPos, t);

      // Interpolate rotation using quaternions for smooth interpolation
      const fromQuat = new THREE.Quaternion().setFromEuler(this._anim.fromRot);
      const toQuat = new THREE.Quaternion().setFromEuler(this._anim.toRot);
      const currentQuat = new THREE.Quaternion();
      currentQuat.slerpQuaternions(fromQuat, toQuat, t);
      this.bomb.quaternion.copy(currentQuat);

      if (this._anim.progress >= 1) {
        const cb = this._anim.callback;
        this._anim = null;
        if (cb) cb();
      }
    }

    // --- Camera animation ---
    if (this._cameraAnim) {
      this._cameraAnim.progress += delta / this._cameraAnim.duration;
      if (this._cameraAnim.progress >= 1) {
        this._cameraAnim.progress = 1;
      }

      const t = this._easeInOutCubic(this._cameraAnim.progress);

      this.camera.position.lerpVectors(
        this._cameraAnim.fromPos,
        this._cameraAnim.toPos,
        t
      );

      const lookAt = new THREE.Vector3().lerpVectors(
        this._cameraAnim.fromLookAt,
        this._cameraAnim.toLookAt,
        t
      );
      this.camera.lookAt(lookAt);

      if (this._cameraAnim.progress >= 1) {
        this._cameraAnim = null;
      }
    }

    // --- Mouse-drag rotation (only when held, no animation running, not focused) ---
    if (this.state === BOMB_STATE.HELD && !this._anim) {
      // Apply momentum when not dragging
      if (!this._isDragging) {
        this._targetRotation.y += this._rotationVelocity.x;
        this._rotationVelocity.x *= this._damping;
        this._rotationVelocity.y *= this._damping;

        // Stop tiny movements
        if (Math.abs(this._rotationVelocity.x) < 0.0001) this._rotationVelocity.x = 0;
        if (Math.abs(this._rotationVelocity.y) < 0.0001) this._rotationVelocity.y = 0;
      }

      // Smoothly interpolate current rotation toward target
      const lerpFactor = 1 - Math.pow(0.001, delta);
      this._currentRotation.x += (this._targetRotation.x - this._currentRotation.x) * lerpFactor;
      this._currentRotation.y += (this._targetRotation.y - this._currentRotation.y) * lerpFactor;

      // Apply rotation
      this.bomb.rotation.set(this._currentRotation.x, this._currentRotation.y, 0);
    }

    // --- Subtle idle float when on table ---
    if (this.state === BOMB_STATE.ON_TABLE) {
      const elapsed = performance.now() * 0.001;
      this.bomb.position.y = this.tablePosition.y + Math.sin(elapsed * 0.8) * 0.01;
    }
  }

  /* ----------------------------------------------------------
     PUBLIC API
  ---------------------------------------------------------- */

  getState() {
    return this.state;
  }

  /**
   * True if the last mouse press moved far enough to be a drag, not a click
   */
  wasDragged() {
    return this._wasDragged;
  }

  /**
   * True while the bomb is moving to a new position
   */
  isAnimating() {
    return this._anim !== null;
  }

  getFocusedSlotId() {
    return this._focusedSlotId;
  }

  isInteractive() {
    return this.state === BOMB_STATE.HELD || this.state === BOMB_STATE.ON_TABLE;
  }

  dispose() {
    // Nothing to clean up (event listeners are in main.js)
  }
}
