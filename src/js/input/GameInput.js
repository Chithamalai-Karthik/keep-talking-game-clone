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
     grab, drop  VR grip squeezed and let go, or a tracked hand closed and opened
              (the hand turns the bomb itself)

   Tracked hands (no controllers): the ray starts at the pinch point,
   between thumb and index fingertips, in the headset's own steady
   hand-ray direction; a pinch is press, release and select along it,
   and closing the hand is grab. Each hand's pinch point and index
   fingertip are also shared, for touching the bomb up close.
     cancel   the window lost focus: let go of anything held
   ============================================================ */

import * as THREE from 'three';

export const DRAG_THRESHOLD = 5;        // Pixels a right press moves before it is a drag
const LEFT_BUTTON = 0;

// A tracked hand counts as closed (grabbing) when its middle, ring and little fingertips are
// this close to the wrist on average, and open again only past the second distance, so it
// doesn't flicker between the two (metres)
export const HAND_CLOSED = 0.085;
export const HAND_OPEN = 0.11;
const CURLED_FINGERS = ['middle-finger-tip', 'ring-finger-tip', 'pinky-finger-tip'];
const HAND_RAY_SMOOTHING = 0.5;   // Of the way to the new ray each frame: steadier aim, little lag
const TRACKED_RECENTLY_MS = 250;  // A hand whose joints were read this recently is a hand, not a controller

/**
 * Whether a tracked hand is closed, from how far its curled fingertips are from the wrist
 * @param {number[]} tipDistances - metres, one per fingertip
 * @param {boolean} wasClosed - so the hand has to open clearly before it counts as open
 */
export function isHandClosed(tipDistances, wasClosed) {
  if (!tipDistances.length) return false;
  const average = tipDistances.reduce((sum, d) => sum + d, 0) / tipDistances.length;
  return wasClosed ? average < HAND_OPEN : average < HAND_CLOSED;
}
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
      left: { ray: new THREE.Ray(), closed: false, queued: [], joints: null, spread: null, trackedAt: -Infinity },
      right: { ray: new THREE.Ray(), closed: false, queued: [], joints: null, spread: null, trackedAt: -Infinity },
    };
    this._session = null;
    // Touch mode: { ahead, far } in world units, set by the game in the bomb room in VR; null otherwise
    this.touchReach = null;
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
   * In touch mode, a VR hand's short ray through its droplet, or null
   * @param {'left'|'right'} hand
   */
  touchRay(hand) {
    return this.touchReach ? this._hands[hand].touchRay : null;
  }

  /**
   * Read VR controllers from an IWSDK world while it is in a VR session
   */
  attachXR(world) {
    this._world = world;
    // Tracked hands have no gamepad: their pinches come as the session's select events,
    // and whether they are closed comes from their joints, read each XR frame
    world.renderer.xr.addEventListener('sessionstart', () => this._listenToHands(world.renderer.xr.getSession()));
    world.renderer.xr.addEventListener('sessionend', () => this._listenToHands(null));
    world.onXRFrame?.((frame) => this._readHands(frame));
  }

  _listenToHands(session) {
    if (this._session) {
      this._session.removeEventListener('selectstart', this._onHandPinch);
      this._session.removeEventListener('selectend', this._onHandPinch);
    }
    this._session = session;
    for (const hand of Object.values(this._hands)) {
      hand.closed = false;
      hand.queued.length = 0;
      hand.joints = null;
      hand.kind = null;
    }
    if (!session) return;
    this._onHandPinch ??= (event) => {
      const { inputSource } = event;
      const hand = this._hands[inputSource.handedness];
      if (!inputSource.hand || !hand || hand.closed) return; // Controllers use their gamepad; a fist isn't a pinch
      hand.queued.push(event.type === 'selectstart' ? 'pinch' : 'unpinch');
    };
    session.addEventListener('selectstart', this._onHandPinch);
    session.addEventListener('selectend', this._onHandPinch);
  }

  // Each XR frame: is each tracked hand open or closed?
  _readHands(frame) {
    const space = this._world.renderer.xr.getReferenceSpace();
    if (!space) return;
    for (const source of frame.session.inputSources) {
      const hand = this._hands[source.handedness];
      if (!source.hand || !hand || !frame.getJointPose) continue;
      const at = (name) => frame.getJointPose(source.hand.get(name), space)?.transform.position ?? null;
      const wrist = at('wrist');
      if (!wrist) continue;
      const distances = [];
      for (const name of CURLED_FINGERS) {
        const tip = at(name);
        if (tip) distances.push(Math.hypot(wrist.x - tip.x, wrist.y - tip.y, wrist.z - tip.z));
      }
      hand.spread = distances.length ? distances.reduce((s, d) => s + d, 0) / distances.length : null;
      hand.trackedAt = performance.now();
      // For the hand's own ray (in the rig's space, in metres)
      const thumb = at('thumb-tip'), index = at('index-finger-tip');
      hand.joints = thumb && index ? { wrist, thumb, index } : null;
      const closed = isHandClosed(distances, hand.closed);
      if (closed !== hand.closed) hand.queued.push(closed ? 'close' : 'open');
      hand.closed = closed;
    }
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
      if (!space) continue;
      const hand = this._hands[handName];
      // A tracked hand, whether or not the runtime gives it a stand-in gamepad
      const isHand = hand.joints !== null && performance.now() - hand.trackedAt < TRACKED_RECENTLY_MS;
      // The headset's own ray direction: steady, from the shoulder through the hand
      space.getWorldPosition(hand.ray.origin);
      hand.ray.direction.set(0, 0, -1).applyQuaternion(space.getWorldQuaternion(this._turn));
      if (isHand) this._placeHand(hand, world.player);
      hand.kind = isHand ? 'hand' : pad ? 'controller' : null;
      // Touch mode (the bomb room): every action goes along a short ray through the droplet,
      // so only what the droplet touches is pointed at or clicked
      const event = { ray: hand.ray, source: handName };
      if (this.touchReach) {
        hand.touchRay ??= new THREE.Ray();
        hand.touchRay.direction.copy(hand.ray.direction);
        hand.touchRay.origin.copy(hand.ray.origin).addScaledVector(hand.ray.direction, this.touchReach.ahead);
        event.ray = hand.touchRay;
        event.far = this.touchReach.far;
      }

      // A tracked hand: its pinches and its closing and opening, queued since the last frame
      if (isHand || !pad) {
        const queued = hand.queued.splice(0);
        if (queued.includes('pinch')) this._activeHand = handName;
        if (handName === this._activeHand) this._emit('point', event);
        for (const step of queued) {
          if (step === 'pinch') this._emit('press', event);
          if (step === 'unpinch') {
            this._emit('release', event);
            this._emit('select', event);
          }
          if (step === 'close') this._emit('grab', event);
          if (step === 'open') this._emit('drop', event);
        }
        continue;
      }

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

  // A tracked hand: its ray starts at the pinch point, and its pinch point and index fingertip
  // are kept in world space for touching things up close (smoothed a little against jitter)
  _placeHand(hand, rig) {
    const { thumb, index } = hand.joints;
    rig.updateWorldMatrix(true, false);
    const pinch = new THREE.Vector3((thumb.x + index.x) / 2, (thumb.y + index.y) / 2, (thumb.z + index.z) / 2).applyMatrix4(rig.matrixWorld);
    const tip = new THREE.Vector3(index.x, index.y, index.z).applyMatrix4(rig.matrixWorld);
    if (!hand.pinchPoint) {
      hand.pinchPoint = pinch;
      hand.indexTip = tip;
    } else {
      hand.pinchPoint.lerp(pinch, HAND_RAY_SMOOTHING);
      hand.indexTip.lerp(tip, HAND_RAY_SMOOTHING);
    }
    hand.ray.origin.copy(hand.pinchPoint);
  }

  /**
   * A VR hand's pinch point (a controller's tip), index fingertip (hands only) and pointing
   * direction, in world space, or null when it isn't tracked
   * @param {'left'|'right'} handName
   */
  handPose(handName) {
    const hand = this._hands[handName];
    if (hand.kind === 'controller' && this._world?.session) {
      return { pinchPoint: hand.ray.origin, indexTip: null, direction: hand.ray.direction, closed: false };
    }
    if (!hand.joints || !hand.pinchPoint || performance.now() - hand.trackedAt > TRACKED_RECENTLY_MS) return null;
    return { pinchPoint: hand.pinchPoint, indexTip: hand.indexTip, direction: hand.ray.direction, closed: hand.closed };
  }

  /**
   * For checking on a headset: how far each tracked hand's curled fingertips are from its wrist
   */
  handSpread() {
    return { left: this._hands.left.spread, right: this._hands.right.spread };
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
