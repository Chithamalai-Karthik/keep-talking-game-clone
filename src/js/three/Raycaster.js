/* ============================================================
   Raycaster.js — 3D Click Detection
   Detects mouse clicks/hovers on interactive 3D objects
   ============================================================ */

import * as THREE from 'three';

export class Raycaster {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Registered interactive objects
    this._interactiveObjects = [];

    // Callbacks
    this._onClickCallback = null;
    this._onHoverCallback = null;
    this._onHoverLeaveCallback = null;

    // Currently hovered object
    this._hoveredObject = null;

    // Event listeners
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onClick = this._onClick.bind(this);

    domElement.addEventListener('mousemove', this._onMouseMove);
    domElement.addEventListener('click', this._onClick);
  }

  /**
   * Set the interactive objects to raycast against
   */
  setInteractiveObjects(objects) {
    this._interactiveObjects = objects;
  }

  /**
   * Register click callback
   * @param {Function} callback - (intersectedObject, intersectionPoint) => void
   */
  onClick(callback) {
    this._onClickCallback = callback;
  }

  /**
   * Register hover callback
   * @param {Function} callback - (intersectedObject) => void
   */
  onHover(callback) {
    this._onHoverCallback = callback;
  }

  /**
   * Register hover leave callback
   * @param {Function} callback - (previousObject) => void
   */
  onHoverLeave(callback) {
    this._onHoverLeaveCallback = callback;
  }

  _updateMouse(event) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _getIntersection() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this._interactiveObjects, true);

    // Find the first interactive object
    for (const intersect of intersects) {
      let obj = intersect.object;
      // Walk up the parent chain to find the interactive root
      while (obj) {
        if (obj.userData && obj.userData.interactive) {
          return { object: obj, point: intersect.point };
        }
        obj = obj.parent;
      }
    }

    return null;
  }

  _onMouseMove(event) {
    this._updateMouse(event);
    this._updateHover();
  }

  /**
   * Hover again under a still mouse, after what can be hovered has changed
   */
  refreshHover() {
    if (this._hoveredObject && this._onHoverLeaveCallback) {
      this._onHoverLeaveCallback(this._hoveredObject);
    }
    this._hoveredObject = null;
    this._updateHover();
  }

  /**
   * Forget the hovered object without a leave callback, for when it has gone
   */
  clearHover() {
    this._hoveredObject = null;
  }

  _updateHover() {
    const hit = this._getIntersection();

    if (hit) {
      if (this._hoveredObject !== hit.object) {
        // Left previous object
        if (this._hoveredObject && this._onHoverLeaveCallback) {
          this._onHoverLeaveCallback(this._hoveredObject);
        }
        // Entered new object
        this._hoveredObject = hit.object;
        if (this._onHoverCallback) {
          this._onHoverCallback(hit.object);
        }
      }
    } else {
      if (this._hoveredObject) {
        if (this._onHoverLeaveCallback) {
          this._onHoverLeaveCallback(this._hoveredObject);
        }
        this._hoveredObject = null;
        this.domElement.style.cursor = 'default';
      }
    }
  }

  /**
   * Find the interactive object under a mouse event
   * @returns {THREE.Object3D|null}
   */
  pick(event) {
    this._updateMouse(event);
    return this._getIntersection()?.object ?? null;
  }

  _onClick(event) {
    this._updateMouse(event);

    const hit = this._getIntersection();
    if (hit && this._onClickCallback) {
      this._onClickCallback(hit.object, hit.point);
    }
  }

  dispose() {
    this.domElement.removeEventListener('mousemove', this._onMouseMove);
    this.domElement.removeEventListener('click', this._onClick);
  }
}
