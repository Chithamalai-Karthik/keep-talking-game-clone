/* ============================================================
   DeskClock.js — The alarm clock on the bomb room's desk
   Like the original, the clock is picked up before its snooze
   bar can be pressed: a click lifts it towards the camera,
   tilted so the bar shows, and putting it down returns it.
   ============================================================ */

import * as THREE from 'three';

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
   * @param {HTMLCanvasElement} canvas
   */
  constructor(root, camera, canvas) {
    this.root = root;
    this.camera = camera;
    this.canvas = canvas;
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
   * @param {{ position: THREE.Vector3, lookAt: THREE.Vector3 }} view
   */
  pickUp(view) {
    if (this.isHeld()) return;
    this.root.updateWorldMatrix(true, false);
    this._from.position.copy(this.root.getWorldPosition(new THREE.Vector3()));
    this._from.quaternion.copy(this.root.getWorldQuaternion(new THREE.Quaternion()));
    let scene = this.home;
    while (scene.parent) scene = scene.parent;
    scene.attach(this.root);  // Into the scene itself, so it moves in world space

    const look = new THREE.Matrix4().lookAt(view.position, view.lookAt, new THREE.Vector3(0, 1, 0));
    const facing = new THREE.Quaternion().setFromRotationMatrix(look);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(facing);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(facing);
    this._to.position.copy(view.position).addScaledVector(forward, HOLD_DISTANCE).addScaledVector(up, -0.15);
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
    if (this._t === this._target) return;
    const step = delta / MOVE_TIME;
    this._t = this._target > this._t ? Math.min(1, this._t + step) : Math.max(0, this._t - step);
    const k = smooth(this._t);
    this.root.position.lerpVectors(this._from.position, this._to.position, k);
    this.root.quaternion.slerpQuaternions(this._from.quaternion, this._to.quaternion, k);
    if (this._t === 0) this.reset(); // Down: back in the room, exactly where it was
  }

  /**
   * Whether a mouse event is on the clock, or only on its snooze bar
   */
  isAt(event) {
    return this._hit(event, this._parts);
  }

  isSnoozeAt(event) {
    return this._hit(event, [this.snooze, this.snooze.getObjectByName('br_clock_snooze_label')]);
  }

  _hit(event, objects) {
    if (!this.root.visible || !this.home.visible) return false;
    const rect = this.canvas.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this._raycaster.setFromCamera(pointer, this.camera);
    return this._raycaster.intersectObjects(objects.filter(Boolean), false).length > 0;
  }
}
