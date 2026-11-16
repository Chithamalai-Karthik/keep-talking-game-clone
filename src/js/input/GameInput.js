/* ============================================================
   GameInput.js — Mouse and VR controllers, as game actions
   Everything that reacts to input listens here instead of to the
   mouse, so a click and a VR trigger do the same thing. Each
   action carries a ray: from the camera through the mouse, or
   from a controller's tip. Listeners raycast along that ray.

   Actions, in the order listeners receive them:
     point    the ray moved (hover)
     press    primary button down (left button, trigger)
     release  primary button up
     select   a full click (left click, trigger pressed and let go)
     back     step back (right click, Esc, B or Y button)
     rotateStart, rotate { dx, dy }, rotateEnd
              turn the held bomb with a right-drag, in drag pixels
     grab, drop  VR grip squeezed and let go (the hand turns the bomb itself)
     cancel   the window lost focus: let go of anything held
   ============================================================ */

import * as THREE from 'three';

export const DRAG_THRESHOLD = 5;        // Pixels a right press moves before it is a drag
const LEFT_BUTTON = 0;
const RIGHT_BUTTON = 2;

/**
 * Mouse buttons and movement as actions. No DOM, so it can be tested.
 */
export class MouseActions {
  /**
   * @param {(type: string, data?: object) => void} emit
   */
  constructor(emit) {
    this.emit = emit;
    this._right = null; // { startX, startY, lastX, lastY, dragging } while the right button is down
  }

  down(button, x, y) {
    if (button === LEFT_BUTTON) this.emit('press');
    if (button === RIGHT_BUTTON) this._right = { startX: x, startY: y, lastX: x, lastY: y, dragging: false };
  }

  move(x, y) {
    const right = this._right;
    if (!right) return;
    if (!right.dragging && Math.hypot(x - right.startX, y - right.startY) > DRAG_THRESHOLD) {
      right.dragging = true;
      this.emit('rotateStart');
    }
    if (!right.dragging) return;
    this.emit('rotate', { dx: x - right.lastX, dy: y - right.lastY });
    right.lastX = x;
    right.lastY = y;
  }

  up(button) {
    if (button === LEFT_BUTTON) this.emit('release');
    if (button === RIGHT_BUTTON && this._right) {
      const { dragging } = this._right;
      this._right = null;
      this.emit(dragging ? 'rotateEnd' : 'back'); // A right click that didn't move steps back
    }
  }

  cancel() {
    if (this._right?.dragging) this.emit('rotateEnd');
    this._right = null;
    this.emit('cancel');
  }
}

export class GameInput {
  /**
   * @param {THREE.Camera} camera
   * @param {HTMLCanvasElement} canvas
   */
  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
    this._listeners = [];
    this._world = null;

    this._raycaster = new THREE.Raycaster();
    this._pointer = new THREE.Vector2();
    this._mouseRay = new THREE.Ray();
    this._mouse = new MouseActions((type, data) => this._emit(type, { ...data, ray: this._mouseRay, source: 'mouse' }));

    // VR: one ray per hand; the hand that last pulled its trigger does the pointing
    this._hands = {
      left: { ray: new THREE.Ray() },
      right: { ray: new THREE.Ray() },
    };
    this._turn = new THREE.Quaternion();
    this._activeHand = 'right';
    this._lastRay = this._mouseRay;

    canvas.addEventListener('mousedown', (e) => {
      this._aim(e);
      this._mouse.down(e.button, e.clientX, e.clientY);
    });
    canvas.addEventListener('mousemove', (e) => {
      this._aim(e);
      this._emit('point', { ray: this._mouseRay, source: 'mouse' });
      this._mouse.move(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', (e) => {
      if (e.target === canvas) this._aim(e);
      this._mouse.up(e.button);
    });
    canvas.addEventListener('click', (e) => {
      if (e.button !== LEFT_BUTTON) return;
      this._aim(e);
      this._emit('select', { ray: this._mouseRay, source: 'mouse' });
    });
    // The right button rotates and steps back, so it never opens the browser's menu
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this._emit('back', { ray: this._lastRay, source: 'keyboard' });
    });
    window.addEventListener('blur', () => this._mouse.cancel());
  }

  /**
   * Listen to actions. A listener is an object with a method per action it handles.
   * Listeners run in the order they subscribed.
   * @returns {() => void} unsubscribe
   */
  subscribe(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(item => item !== listener);
    };
  }

  /**
   * The ray last pointed with, for hovering again after something under it changed
   */
  get lastRay() {
    return this._lastRay;
  }

  /**
   * A VR hand's pointing ray, as of the last update
   * @param {'left'|'right'} hand
   */
  handRay(hand) {
    return this._hands[hand].ray;
  }

  /**
   * Read VR controllers from an IWSDK world while it is in a VR session
   */
  attachXR(world) {
    this._world = world;
  }

  /**
   * Per frame: turn VR controller poses and buttons into actions
   */
  update(delta) {
    const world = this._world;
    if (!world?.session) return;
    const pads = world.input.xr?.gamepads ?? world.input.gamepads;
    for (const handName of ['left', 'right']) {
      const pad = pads?.[handName];
      const space = world.player.raySpaces[handName];
      if (!pad || !space) continue;
      const hand = this._hands[handName];
      space.getWorldPosition(hand.ray.origin);
      hand.ray.direction.set(0, 0, -1).applyQuaternion(space.getWorldQuaternion(this._turn));

      const event = { ray: hand.ray, source: handName };
      if (pad.getSelectStart()) this._activeHand = handName;
      if (handName === this._activeHand) this._emit('point', event);
      if (pad.getSelectStart()) this._emit('press', event);
      if (pad.getSelectEnd()) {
        this._emit('release', event);
        this._emit('select', event);
      }
      if (pad.getButtonDown('b-button') || pad.getButtonDown('y-button')) this._emit('back', event);
      if (pad.getButtonDown('xr-standard-squeeze')) this._emit('grab', event);
      if (pad.getButtonUp('xr-standard-squeeze')) this._emit('drop', event);
    }
  }

  // The mouse's ray: from the camera through the cursor
  _aim(event) {
    const rect = this.canvas.getBoundingClientRect();
    this._pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this._raycaster.setFromCamera(this._pointer, this.camera);
    this._mouseRay.copy(this._raycaster.ray);
  }

  _emit(type, event) {
    if (event.ray) this._lastRay = event.ray;
    for (const listener of this._listeners) listener[type]?.(event);
  }
}
