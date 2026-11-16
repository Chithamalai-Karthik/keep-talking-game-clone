/* ============================================================
   BombController.js — Bomb Rotation & Interaction States
   Handles mouse-drag rotation of the bomb (not the camera),
   pick-up/put-down animations, and zoom-to-module rotation
   ============================================================ */

import * as THREE from 'three';
import { Drop } from './Drop.js';

// Interaction states
export const BOMB_STATE = {
  ON_TABLE: 'on-table',
  PICKING_UP: 'picking-up',
  HELD: 'held',
  PUTTING_DOWN: 'putting-down',
  MODULE_FOCUSED: 'module-focused',
  MODULE_UNFOCUSING: 'module-unfocusing',
  GRABBED: 'grabbed',             // VR: held in a hand, which moves and turns it
  FALLING: 'falling',             // VR: let go of, falling back to the desk
};

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
    // Where it lies now: the table spot, or wherever it landed when dropped in VR
    this.restPosition = this.tablePosition.clone();
    this.restRotation = this.tableRotation.clone();
    this._drop = null;

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
    this._isDragging = false;   // Turning by hand (a right-drag or a thumbstick) right now
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
    this._unfocusTimeout = null;

    // Set initial state
    this.bomb.position.copy(this.tablePosition);
    this.bomb.rotation.copy(this.tableRotation);
  }

  /**
   * Instantly reset bomb and camera to table state (no animation)
   */
  resetToTable() {
    clearTimeout(this._unfocusTimeout);
    this.state = BOMB_STATE.ON_TABLE;
    this._anim = null;
    this._cameraAnim = null;
    this._isDragging = false;
    this._focusedSlotId = null;
    this._targetRotation.set(0, 0, 0);
    this._currentRotation.set(0, 0, 0);
    this._rotationVelocity.set(0, 0);

    this.restPosition.copy(this.tablePosition);
    this.restRotation.copy(this.tableRotation);
    if (this._drop) this._drop.phase = 'still'; // Stop any fall still in progress
    this.bomb.position.copy(this.tablePosition);
    this.bomb.rotation.copy(this.tableRotation);

    this.camera.position.copy(this.cameraTablePosition);
    this.camera.lookAt(this.cameraTableLookAt);
  }

  /* ----------------------------------------------------------
     ROTATION — from GameInput's rotate actions (a right-drag
     with the mouse, or a VR thumbstick), in drag pixels
  ---------------------------------------------------------- */

  rotateStart() {
    this._isDragging = this.state === BOMB_STATE.HELD || this.state === BOMB_STATE.MODULE_FOCUSED;
    this._rotationVelocity.set(0, 0);
  }

  rotateBy(deltaX, deltaY) {
    if (!this._isDragging) return;
    if (this.state !== BOMB_STATE.HELD && this.state !== BOMB_STATE.MODULE_FOCUSED) return;

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
  }

  rotateEnd() {
    this._isDragging = false;
  }

  /* ----------------------------------------------------------
     GRAB — VR: the bomb held in a hand, following it each frame
  ---------------------------------------------------------- */

  /**
   * Take the bomb into a hand, from the desk or from being held up
   */
  grab() {
    if (this.state === BOMB_STATE.GRABBED) return false;
    clearTimeout(this._unfocusTimeout);
    this._anim = null;
    this._cameraAnim = null;
    this._isDragging = false;
    this._focusedSlotId = null;
    this.state = BOMB_STATE.GRABBED;
    return true;
  }

  /**
   * Move the grabbed bomb to the hand's pose
   */
  holdAt(position, quaternion) {
    if (this.state !== BOMB_STATE.GRABBED) return;
    this.bomb.position.copy(position);
    this.bomb.quaternion.copy(quaternion);
  }

  /**
   * Where a dropped bomb can land: the desk's area, in game units
   * @param {object} area
   * @param {{ minX: number, maxX: number, minZ: number, maxZ: number }} area.bounds - where its centre can come down
   * @param {number} area.floorY - below this it has missed the desk
   * @param {number} area.deskTop - the desk's surface
   * @param {{ x: number, y: number, z: number }} area.halfSize - half the bomb's size, so it lands on the face it falls on
   */
  setDropArea({ bounds, floorY, deskTop, halfSize }) {
    this._drop = new Drop({
      restY: this.tablePosition.y,
      deskTop,
      halfExtents: new THREE.Vector3(halfSize.x, halfSize.y, halfSize.z),
      bounds,
      floorY,
      flat: new THREE.Quaternion().setFromEuler(this.tableRotation),
      home: { position: this.tablePosition, quaternion: new THREE.Quaternion().setFromEuler(this.tableRotation) },
    });
  }

  /**
   * Let go: the bomb falls with the hand's motion and lands where it comes down on the desk,
   * or goes back to its place if it misses
   * @param {THREE.Vector3} [velocity] - the hand's motion, in game units per second
   */
  release(velocity = new THREE.Vector3(), callback = null) {
    if (this.state !== BOMB_STATE.GRABBED) return;
    if (this._drop) {
      this.state = BOMB_STATE.FALLING;
      this._afterDrop = callback;
      this._drop.start(this.bomb.position, this.bomb.quaternion, velocity);
      return;
    }
    this.state = BOMB_STATE.PUTTING_DOWN;
    this._animateBomb(
      { position: this.bomb.position.clone(), rotation: this.bomb.rotation.clone() },
      { position: this.restPosition.clone(), rotation: this.restRotation.clone() },
      0.6,
      () => {
        this.state = BOMB_STATE.ON_TABLE;
        this._targetRotation.set(0, 0, 0);
        this._currentRotation.set(0, 0, 0);
        callback?.();
      }
    );
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
        position: this.bomb.position.clone(),
        rotation: this.bomb.rotation.clone(),
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
        position: this.restPosition.clone(),
        rotation: this.restRotation.clone(),
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
    this._rotationVelocity.set(0, 0);

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
    this._unfocusTimeout = setTimeout(() => {
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

    // --- Turning by hand (held or focused, no animation running) ---
    if ((this.state === BOMB_STATE.HELD || this.state === BOMB_STATE.MODULE_FOCUSED) && !this._anim) {
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

    // --- VR: let go of, falling back to the desk ---
    if (this.state === BOMB_STATE.FALLING && this._drop) {
      const result = this._drop.update(delta);
      this.bomb.position.copy(this._drop.position);
      this.bomb.quaternion.copy(this._drop.quaternion);
      if (result === 'landed' || result === 'returned') {
        this.restPosition.copy(this.bomb.position);
        this.restRotation.copy(this.bomb.rotation);
        this.state = BOMB_STATE.ON_TABLE;
        this._targetRotation.set(0, 0, 0);
        this._currentRotation.set(0, 0, 0);
        const done = this._afterDrop;
        this._afterDrop = null;
        done?.();
      }
      return;
    }

    // --- Subtle idle float when on table ---
    if (this.state === BOMB_STATE.ON_TABLE) {
      const elapsed = performance.now() * 0.001;
      this.bomb.position.y = this.restPosition.y + Math.sin(elapsed * 0.8) * 0.01;
    }
  }

  /* ----------------------------------------------------------
     PUBLIC API
  ---------------------------------------------------------- */

  getState() {
    return this.state;
  }

  /**
   * True while the bomb is being turned by hand
   */
  isRotating() {
    return this._isDragging;
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
