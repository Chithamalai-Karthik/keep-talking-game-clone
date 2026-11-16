/* ============================================================
   DeskClock.js — The alarm clock on the bomb room's desk
   Like the original, the clock is picked up before its snooze
   bar can be pressed: a click lifts it towards the camera,
   tilted so the bar shows, and putting it down returns it.
   ============================================================ */

import * as THREE from 'three';
import { Drop } from './Drop.js';

const MOVE_TIME = 0.4;          // Seconds to lift or put down
const HOLD_DISTANCE = 2.2;      // Game units in front of the camera
const HOLD_TILT = 0.75;         // Radians: top turned towards the camera
const PRESS_DEPTH = 0.004;      // Metres the snooze bar goes down
const PRESS_TIME = 0.15;

const smooth = (t) => t * t * (3 - 2 * t);

export class DeskClock {
  /**
   * @param {THREE.Object3D} root - br_clock_root from bomb_room.glb
   * @param {THREE.PerspectiveCamera} camera
   */
  constructor(root, camera) {
    this.root = root;
    this.camera = camera;
    this.home = root.parent;            // The room it sits in
    this.snooze = root.getObjectByName('br_clock_snooze');
    this._snoozeRest = this.snooze.position.y; // glTF is y-up
    this._parts = [];
    root.traverse(child => { if (child.isMesh) this._parts.push(child); });

    this._deskPosition = root.position.clone();
    this._deskQuaternion = root.quaternion.clone();
    this._from = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() };
    this._to = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() };
    this._t = 0;
    this._target = 0;
    this._press = 0;
    this._raycaster = new THREE.Raycaster();
    this._label(root.getObjectByName('br_clock_snooze_label'));

    // VR: held in a hand, then dropped
    this._grip = null;
    this._gripOffset = new THREE.Matrix4();
    this._drop = null;
    this._dropping = false;
    this._lastPosition = new THREE.Vector3();
    this._velocity = new THREE.Vector3();
  }

  /**
   * Where the clock can land when dropped in VR, in game units
   */
  setDropArea({ restY, bounds, floorY }) {
    this.home.updateWorldMatrix(true, false);
    this.root.updateWorldMatrix(true, false);
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    this.root.matrixWorld.decompose(position, quaternion, new THREE.Vector3());
    this._drop = new Drop({ restY, bounds, floorY, flat: new THREE.Quaternion(), home: { position, quaternion } });
  }

  /**
   * VR: take the clock into a hand, keeping how it sits relative to the hand
   */
  grab(grip) {
    if (this._grip || this.isHeld() || this.isMoving()) return false;
    this._intoScene();
    grip.updateWorldMatrix(true, false);
    this.root.updateWorldMatrix(true, false);
    this._gripOffset.copy(grip.matrixWorld).invert().multiply(this.root.matrixWorld);
    this._grip = grip;
    this._dropping = false;
    this._lastPosition.copy(this.root.position);
    this._velocity.set(0, 0, 0);
    return true;
  }

  isGrabbed() {
    return Boolean(this._grip);
  }

  /**
   * VR: let go; it falls with the hand's motion, back to the desk
   */
  release() {
    if (!this._grip) return;
    this._grip = null;
    if (!this._drop) {
      this.reset();
      return;
    }
    this._drop.start(this.root.position, this.root.quaternion, this._velocity);
    this._dropping = true;
  }

  // Out of the room and into the scene itself, so it moves in world space
  _intoScene() {
    let scene = this.home;
    while (scene.parent) scene = scene.parent;
    if (this.root.parent !== scene) scene.attach(this.root);
  }

  /**
   * How far a point (a VR hand) is from the clock, in game units: 0 when touching it
   */
  gapTo(point) {
    if (!this.root.visible || !this.home.visible) return Infinity;
    return new THREE.Box3().setFromObject(this.root).distanceToPoint(point);
  }

  /**
   * How far along a ray the clock is, or null if the ray misses it
   */
  hitDistance(ray) {
    if (!this.root.visible || !this.home.visible) return null;
    this._raycaster.ray.copy(ray);
    return this._raycaster.intersectObjects(this._parts, false)[0]?.distance ?? null;
  }

  // SNOOZE printed on the bar's top
  _label(mesh) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 144;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8d8f8c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#26272a';
    ctx.font = 'bold 92px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '10px';
    ctx.fillText('SNOOZE', canvas.width / 2 + 5, canvas.height / 2 + 4);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.anisotropy = 8;
    // Printed on the bar: drawn just in front of its top face so the two never flicker
    mesh.material = new THREE.MeshStandardMaterial({
      map: texture, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
    });
  }

  /**
   * Lifted or on its way up
   */
  isHeld() {
    return this._target === 1;
  }

  isMoving() {
    return this._t !== this._target;
  }

  /**
   * Lift the clock in front of a view. The view is where the camera will be,
   * which is the table view even when the bomb is still on its way down.
   * @param {{ position: THREE.Vector3, lookAt: THREE.Vector3, distance?: number }} view
   */
  pickUp(view) {
    if (this.isHeld()) return;
    this.root.updateWorldMatrix(true, false);
    this._from.position.copy(this.root.getWorldPosition(new THREE.Vector3()));
    this._from.quaternion.copy(this.root.getWorldQuaternion(new THREE.Quaternion()));
    this._intoScene();

    const look = new THREE.Matrix4().lookAt(view.position, view.lookAt, new THREE.Vector3(0, 1, 0));
    const facing = new THREE.Quaternion().setFromRotationMatrix(look);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(facing);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(facing);
    this._to.position.copy(view.position).addScaledVector(forward, view.distance ?? HOLD_DISTANCE).addScaledVector(up, -0.15);
    const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), HOLD_TILT);
    this._to.quaternion.copy(facing).multiply(tilt);
    this._t = 0;
    this._target = 1;
  }

  putDown() {
    if (!this.isHeld()) return;
    this._target = 0;
  }

  /**
   * Straight back to the desk, as when a game ends
   */
  reset() {
    if (this.root.parent !== this.home) this.home.attach(this.root);
    this.root.position.copy(this._deskPosition);
    this.root.quaternion.copy(this._deskQuaternion);
    this._t = 0;
    this._target = 0;
    this._press = 0;
    this._grip = null;
    this._dropping = false;
    this.snooze.position.y = this._snoozeRest;
  }

  /**
   * Press the snooze bar down for a moment
   */
  pressSnooze() {
    this._press = PRESS_TIME;
  }

  update(delta) {
    if (this._press > 0) {
      this._press = Math.max(0, this._press - delta);
      this.snooze.position.y = this._snoozeRest - (this._press > 0 ? PRESS_DEPTH : 0);
    }
    if (this._grip) {
      // Follow the hand, and remember how it moves for when it is let go
      this._grip.updateWorldMatrix(true, false);
      new THREE.Matrix4().multiplyMatrices(this._grip.matrixWorld, this._gripOffset)
        .decompose(this.root.position, this.root.quaternion, this.root.scale);
      if (delta > 0) {
        const moved = this.root.position.clone().sub(this._lastPosition).divideScalar(delta);
        this._velocity.lerp(moved, 0.5);
      }
      this._lastPosition.copy(this.root.position);
      return;
    }
    if (this._dropping) {
      const result = this._drop.update(delta);
      this.root.position.copy(this._drop.position);
      this.root.quaternion.copy(this._drop.quaternion);
      if (result === 'returned') this.reset();
      if (result === 'landed') {
        this._dropping = false;
        this.home.attach(this.root); // Back in the room, where it landed
      }
      return;
    }
    if (this._t === this._target) return;
    const step = delta / MOVE_TIME;
    this._t = this._target > this._t ? Math.min(1, this._t + step) : Math.max(0, this._t - step);
    const k = smooth(this._t);
    this.root.position.lerpVectors(this._from.position, this._to.position, k);
    this.root.quaternion.slerpQuaternions(this._from.quaternion, this._to.quaternion, k);
    if (this._t === 0) this.reset(); // Down: back in the room, exactly where it was
  }

  /**
   * Whether a ray (the mouse's or a VR controller's) is on the clock, or only on its snooze bar
   */
  isAt(ray, far = Infinity) {
    return this._hit(ray, this._parts, far);
  }

  isSnoozeAt(ray, far = Infinity) {
    return this._hit(ray, [this.snooze, this.snooze.getObjectByName('br_clock_snooze_label')], far);
  }

  _hit(ray, objects, far) {
    if (!this.root.visible || !this.home.visible) return false;
    this._raycaster.ray.copy(ray);
    this._raycaster.far = far;
    return this._raycaster.intersectObjects(objects.filter(Boolean), false).length > 0;
  }
}
