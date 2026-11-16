/* ============================================================
   Raycaster.js — What the pointer is on, on the bomb
   Hover and clicks for the bomb's interactive objects. The
   pointer is a ray from GameInput: the mouse or a VR controller.
   ============================================================ */

import * as THREE from 'three';

export class Raycaster {
  /**
   * @param {import('../input/GameInput.js').GameInput} input
   * @param {HTMLElement} domElement - the canvas, whose cursor is reset when hover ends
   */
  constructor(input, domElement) {
    this.input = input;
    this.domElement = domElement;
    this.raycaster = new THREE.Raycaster();

    // Registered interactive objects
    this._interactiveObjects = [];

    // Callbacks
    this._onClickCallback = null;
    this._onHoverCallback = null;
    this._onHoverLeaveCallback = null;

    // Currently hovered object, and the ray it was found with
    this._hoveredObject = null;
    this._ray = new THREE.Ray();

    // Input to leave alone: a VR hand touching the bomb up close, which works by touch instead
    this.ignore = () => false;

    this._unsubscribe = input.subscribe({
      point: (event) => {
        if (this.ignore(event)) return;
        this._ray.copy(event.ray);
        this._updateHover();
      },
      select: (event) => {
        if (!this.ignore(event)) this._onSelect(event.ray);
      },
    });
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

  _getIntersection(ray) {
    this.raycaster.ray.copy(ray);
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

  /**
   * Hover again under a still pointer, after what can be hovered has changed
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
    const hit = this._getIntersection(this._ray);

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
   * Find the interactive object along a ray
   * @param {THREE.Ray} ray
   * @returns {THREE.Object3D|null}
   */
  pick(ray) {
    return this._getIntersection(ray)?.object ?? null;
  }

  /**
   * The interactive object along a ray and where the ray meets it
   * @returns {{ object: THREE.Object3D, point: THREE.Vector3 }|null}
   */
  hit(ray) {
    return this._getIntersection(ray);
  }

  _onSelect(ray) {
    const hit = this._getIntersection(ray);
    if (hit && this._onClickCallback) {
      this._onClickCallback(hit.object, hit.point);
    }
  }

  dispose() {
    this._unsubscribe();
  }
}
