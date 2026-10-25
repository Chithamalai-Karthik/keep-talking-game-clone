/* ============================================================
   CameraController.js — Camera Orbit & Zoom-to-Module
   Handles orbit controls around the bomb and smooth zoom transitions
   ============================================================ */

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Default camera state (overview)
    this.defaultPosition = new THREE.Vector3(0, 3, 5);
    this.defaultTarget = new THREE.Vector3(0, 0.5, 0);

    // Orbit controls
    this.controls = new OrbitControls(camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.8;
    this.controls.panSpeed = 0.5;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 10;
    this.controls.minPolarAngle = Math.PI * 0.1;  // Don't go fully overhead
    this.controls.maxPolarAngle = Math.PI * 0.75;  // Don't go fully below
    this.controls.target.copy(this.defaultTarget);

    // Animation state
    this._isAnimating = false;
    this._animStart = {};
    this._animEnd = {};
    this._animProgress = 0;
    this._animDuration = 1.0; // seconds
    this._animCallback = null;

    // Track if we're zoomed into a module
    this.isZoomedIn = false;
    this._zoomedSlotId = null;
  }

  /**
   * Smooth camera transition to a target position/lookAt
   */
  animateTo(position, target, duration = 1.0, callback = null) {
    this._isAnimating = true;
    this._animProgress = 0;
    this._animDuration = duration;
    this._animCallback = callback;

    this._animStart = {
      position: this.camera.position.clone(),
      target: this.controls.target.clone(),
    };
    this._animEnd = {
      position: position.clone(),
      target: target.clone(),
    };

    // Disable orbit controls during animation
    this.controls.enabled = false;
  }

  /**
   * Zoom camera into a specific module slot position
   */
  zoomToModule(slotPosition, slotNormal, slotId) {
    // Calculate camera position: offset from slot along its normal
    const offset = slotNormal.clone().multiplyScalar(2.2);
    const cameraPos = slotPosition.clone().add(offset);

    // Slightly raise camera for a better angle
    cameraPos.y += 0.3;

    this.isZoomedIn = true;
    this._zoomedSlotId = slotId;

    this.animateTo(cameraPos, slotPosition, 0.8, () => {
      this.controls.enabled = true;
      this.controls.minDistance = 1;
      this.controls.maxDistance = 4;
    });
  }

  /**
   * Return camera to the overview position
   */
  resetToOverview(callback = null) {
    this.isZoomedIn = false;
    this._zoomedSlotId = null;

    this.animateTo(this.defaultPosition, this.defaultTarget, 0.8, () => {
      this.controls.enabled = true;
      this.controls.minDistance = 2;
      this.controls.maxDistance = 10;
      if (callback) callback();
    });
  }

  /**
   * Get the currently zoomed slot ID
   */
  getZoomedSlotId() {
    return this._zoomedSlotId;
  }

  /**
   * Smooth easing function (ease-in-out cubic)
   */
  _easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Update — call every frame
   */
  update(delta) {
    if (this._isAnimating) {
      this._animProgress += delta / this._animDuration;

      if (this._animProgress >= 1) {
        this._animProgress = 1;
        this._isAnimating = false;
      }

      const t = this._easeInOutCubic(this._animProgress);

      // Interpolate position
      this.camera.position.lerpVectors(
        this._animStart.position,
        this._animEnd.position,
        t
      );

      // Interpolate target
      this.controls.target.lerpVectors(
        this._animStart.target,
        this._animEnd.target,
        t
      );

      if (this._animProgress >= 1 && this._animCallback) {
        this._animCallback();
        this._animCallback = null;
      }
    }

    this.controls.update();
  }

  /**
   * Enable/disable orbit controls
   */
  setEnabled(enabled) {
    this.controls.enabled = enabled;
  }

  dispose() {
    this.controls.dispose();
  }
}
