/* ============================================================
   Drop.js — Something let go of in VR, falling to the desk
   It falls with the hand's last motion. If it comes down on the
   desk it settles where it lands: a box (the bomb) onto whichever
   face is nearest facing down, turning only as much as that takes,
   and anything else (the clock) upright, keeping its turn. If it
   misses the desk it goes back to its place.
   ============================================================ */

import * as THREE from 'three';

export const GRAVITY = 9.8 * 8;      // Game units per second squared (8 units to the metre)
const MAX_SPEED = 40;                // Game units per second: a throw can't send it far
const AIR_DRAG = 0.6;                // Horizontal speed lost per second
const SETTLE_SECONDS = 0.25;
const RETURN_SECONDS = 0.6;
const MAX_FALL_SECONDS = 2;

const ease = (t) => t * t * (3 - 2 * t);

export class Drop {
  /**
   * @param {object} options
   * @param {number} options.restY - the height its origin rests at on the desk
   * @param {{ minX: number, maxX: number, minZ: number, maxZ: number }} options.bounds - where on the desk it can land
   * @param {number} options.floorY - below this it has missed the desk for good
   * @param {THREE.Quaternion} options.flat - how it lies on the desk when not turned (yaw 0)
   * @param {{ position: THREE.Vector3, quaternion: THREE.Quaternion }} options.home - where it goes back to
   * @param {THREE.Vector3} [options.halfExtents] - for a box centred on its origin: its half sizes along its own axes
   * @param {number} [options.deskTop] - for a box: the height of the desk's surface
   */
  constructor({ restY, bounds, floorY, flat, home, halfExtents = null, deskTop = null }) {
    this.restY = restY;
    this.halfExtents = halfExtents?.clone() ?? null;
    this.deskTop = deskTop;
    this.bounds = bounds;
    this.floorY = floorY;
    this.flat = flat.clone();
    this.home = { position: home.position.clone(), quaternion: home.quaternion.clone() };
    this.phase = 'still';
    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this._velocity = new THREE.Vector3();
    this._from = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() };
    this._to = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() };
    this._t = 0;
  }

  /**
   * Let go of it here, moving like this
   */
  start(position, quaternion, velocity = new THREE.Vector3()) {
    this.position.copy(position);
    this.quaternion.copy(quaternion);
    this._velocity.copy(velocity).clampLength(0, MAX_SPEED);
    this._t = 0;
    this.phase = 'falling';
  }

  /**
   * Whether a point is over the part of the desk it can land on
   */
  isOverDesk(x, z) {
    const b = this.bounds;
    return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
  }

  /**
   * How it lies on the desk: flat, keeping the turn (about the vertical) it had
   */
  restingTurn(quaternion) {
    const side = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
    const flatSide = new THREE.Vector3(1, 0, 0).applyQuaternion(this.flat);
    const yaw = Math.atan2(-side.z, side.x) - Math.atan2(-flatSide.z, flatSide.x);
    return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiply(this.flat);
  }

  /**
   * A box's local axes as world directions, for a turn
   */
  _axes(quaternion) {
    return [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)]
      .map(axis => axis.applyQuaternion(quaternion));
  }

  /**
   * The height its origin is at when its lowest point touches the desk, turned like this
   */
  contactY(quaternion) {
    if (!this.halfExtents) return this.restY;
    const [x, y, z] = this._axes(quaternion);
    const h = this.halfExtents;
    return this.deskTop + Math.abs(x.y) * h.x + Math.abs(y.y) * h.y + Math.abs(z.y) * h.z;
  }

  /**
   * How it rests after landing turned like this: a box on the face nearest facing down,
   * turned only as much as that takes; anything else upright, keeping its turn
   * @returns {{ quaternion: THREE.Quaternion, y: number }}
   */
  restingPose(quaternion) {
    if (!this.halfExtents) return { quaternion: this.restingTurn(quaternion), y: this.restY };
    const down = new THREE.Vector3(0, -1, 0);
    const sizes = [this.halfExtents.x, this.halfExtents.y, this.halfExtents.z];
    let best = null;
    this._axes(quaternion).forEach((axis, i) => {
      for (const sign of [1, -1]) {
        const direction = axis.clone().multiplyScalar(sign);
        const facing = direction.dot(down);
        if (!best || facing > best.facing) best = { direction, facing, half: sizes[i] };
      }
    });
    const turn = new THREE.Quaternion().setFromUnitVectors(best.direction, down);
    return { quaternion: turn.multiply(quaternion.clone()), y: this.deskTop + best.half };
  }

  /**
   * Move on by a frame.
   * @returns {'falling'|'landed'|'returned'|'still'} - landed or returned once, when it comes to rest
   */
  update(delta) {
    if (this.phase === 'falling') return this._fall(delta);
    if (this.phase === 'settling' || this.phase === 'returning') return this._glide(delta);
    return 'still';
  }

  _fall(delta) {
    this._t += delta;
    this._velocity.y -= GRAVITY * delta;
    const keep = Math.max(0, 1 - AIR_DRAG * delta);
    this._velocity.x *= keep;
    this._velocity.z *= keep;
    const contact = this.contactY(this.quaternion); // It doesn't turn while it falls
    const wasAbove = this.position.y > contact;
    this.position.addScaledVector(this._velocity, delta);

    // Came down onto the desk's top while over it: it lands where it is
    if (wasAbove && this.position.y <= contact && this.isOverDesk(this.position.x, this.position.z)) {
      const rest = this.restingPose(this.quaternion);
      this._glideTo('settling', new THREE.Vector3(this.position.x, rest.y, this.position.z), rest.quaternion);
      return 'falling';
    }
    // Missed the desk, or let go of below it: back to its place
    if (this.position.y < this.floorY || this._t > MAX_FALL_SECONDS
      || (!wasAbove && this.position.y <= contact)) {
      this._glideTo('returning', this.home.position, this.home.quaternion);
    }
    return 'falling';
  }

  _glideTo(phase, position, quaternion) {
    this.phase = phase;
    this._t = 0;
    this._from.position.copy(this.position);
    this._from.quaternion.copy(this.quaternion);
    this._to.position.copy(position);
    this._to.quaternion.copy(quaternion);
  }

  _glide(delta) {
    const seconds = this.phase === 'settling' ? SETTLE_SECONDS : RETURN_SECONDS;
    this._t = Math.min(1, this._t + delta / seconds);
    const k = ease(this._t);
    this.position.lerpVectors(this._from.position, this._to.position, k);
    this.quaternion.slerpQuaternions(this._from.quaternion, this._to.quaternion, k);
    if (this._t < 1) return 'falling';
    const done = this.phase === 'settling' ? 'landed' : 'returned';
    this.phase = 'still';
    return done;
  }
}
