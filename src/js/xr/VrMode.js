/* ============================================================
   VrMode.js — Entering and leaving VR
   The Enter VR button shows only where the browser can run VR,
   on the menu and during a game. In VR the player stands at the
   desk of whichever room is showing, at real size: the game works
   in units of about 12.5 cm, so the player's rig is scaled up by
   the same ROOM_SCALE as the rooms.
   ============================================================ */

import * as THREE from 'three';
import { ROOM_SCALE, ROOM_OFFSET_Y } from '../three/Rooms.js';

const BEAM_LENGTH = 2.5; // Metres: the pointer beam from each controller
const FORWARD = new THREE.Vector3(0, 0, -1);

// Where the player stands in each room, in game units: on the floor, facing the desk (-Z)
export const STANDING_SPOTS = {
  office: { x: 0, z: 6.8 },   // Where the office chair is, behind the front desk
  bomb: { x: 0, z: 6.4 },     // Just behind the bomb room's desk
};

/**
 * The player rig's place for a room: on the room's floor, scaled to real size
 */
export function rigPose(room) {
  const spot = STANDING_SPOTS[room] ?? STANDING_SPOTS.office;
  return { position: [spot.x, ROOM_OFFSET_Y, spot.z], scale: ROOM_SCALE };
}

export class VrMode {
  /**
   * @param {import('../three/SceneManager.js').SceneManager} sceneManager
   * @param {{ onEnter?: () => void, onExit?: () => void }} hooks
   */
  constructor(sceneManager, hooks = {}) {
    this.world = sceneManager.world;
    this.renderer = sceneManager.renderer;
    this.hooks = hooks;
    this.supported = false;
    this.active = false;
    this._room = 'office';
    this.button = document.getElementById('vr-button');

    this._beams = this._makeBeams();

    this.button?.addEventListener('click', () => this.enter());
    this.renderer.xr.addEventListener('sessionstart', () => this._onStart());
    this.renderer.xr.addEventListener('sessionend', () => this._onEnd());
    this._checkSupport();
  }

  async _checkSupport() {
    try {
      this.supported = Boolean(await navigator.xr?.isSessionSupported('immersive-vr'));
    } catch {
      this.supported = false;
    }
    this._refreshButton();
  }

  enter() {
    if (!this.supported || this.active) return;
    this.world.launchXR();
  }

  exit() {
    if (this.active) this.world.exitXR();
  }

  /**
   * Which room the player is in: they stand at its desk while in VR
   * @param {'office'|'bomb'} room
   */
  setRoom(room) {
    this._room = room;
    if (this.active) this._placeRig();
  }

  /**
   * The player's eyes, in the world: where held props and the clock are brought to in VR
   * @returns {{ position: THREE.Vector3, lookAt: THREE.Vector3 }}
   */
  headView(camera) {
    const position = camera.getWorldPosition(new THREE.Vector3());
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));
    forward.y = Math.min(forward.y, -0.35);  // Look a little down at the desk, as a seated player does
    return { position, lookAt: position.clone().add(forward.normalize()) };
  }

  // A thin beam from each controller, so you can see where it points (in the rig, so in metres)
  _makeBeams() {
    const beams = [];
    for (const hand of ['left', 'right']) {
      const beam = new THREE.Mesh(
        // One metre long, from the hand forward; stretched each frame to what it hits
        new THREE.CylinderGeometry(0.0015, 0.0015, 1, 6).rotateX(Math.PI / 2).translate(0, 0, -0.5),
        new THREE.MeshBasicMaterial({ color: 0xf2f0e6, transparent: true, opacity: 0.55, depthWrite: false })
      );
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.005, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true })
      );
      dot.renderOrder = 10;
      dot.raycast = () => {};
      beam.add(dot);
      beam.visible = false;
      beam.raycast = () => {}; // Never in the way of the rays it shows
      this.world.player.add(beam); // In the rig, so in metres; placed on its hand's ray each frame
      beams.push({ hand, beam, dot });
    }
    return beams;
  }

  /**
   * Per frame: each beam stops at the first thing its ray hits, with a dot there
   * @param {(hand: string) => THREE.Ray} rayFor - each hand's ray
   * @param {(ray: THREE.Ray) => number|null} hitDistance - how far the ray goes before it hits something, in game units
   * @param {(hand: string) => boolean} [isTouching] - a hand touching up close shows its ball instead of a beam
   */
  updateBeams(rayFor, hitDistance, isTouching = () => false) {
    if (!this.active) return;
    const rig = this.world.player;
    const scale = rig.scale.x;
    rig.updateWorldMatrix(true, false);
    const toRig = rig.getWorldQuaternion(new THREE.Quaternion()).invert();
    for (const { hand, beam, dot } of this._beams) {
      beam.visible = !isTouching(hand);
      if (!beam.visible) continue;
      const ray = rayFor(hand);
      // The beam lies along the hand's ray, whether that is a controller's or a tracked hand's own
      beam.position.copy(rig.worldToLocal(ray.origin.clone()));
      beam.quaternion.setFromUnitVectors(FORWARD, ray.direction.clone().applyQuaternion(toRig).normalize());
      const distance = hitDistance(ray);
      const metres = distance === null ? BEAM_LENGTH : Math.min(BEAM_LENGTH, distance / scale);
      beam.scale.set(1, 1, metres);
      dot.visible = distance !== null && metres < BEAM_LENGTH;
      dot.scale.set(1, 1, 1 / Math.max(metres, 0.001)); // Keep the dot round inside the stretched beam
      dot.position.set(0, 0, -1);
    }
  }

  _placeRig() {
    const { position, scale } = rigPose(this._room);
    this.world.player.position.set(...position);
    this.world.player.rotation.set(0, 0, 0);
    this.world.player.scale.setScalar(scale);
  }

  _resetRig() {
    this.world.player.position.set(0, 0, 0);
    this.world.player.rotation.set(0, 0, 0);
    this.world.player.scale.setScalar(1);
  }

  _onStart() {
    this.active = true;
    this._placeRig();
    this._beams.forEach(({ beam }) => { beam.visible = true; });
    this._refreshButton();
    this.hooks.onEnter?.();
  }

  _onEnd() {
    this.active = false;
    this._resetRig();
    this._beams.forEach(({ beam }) => { beam.visible = false; });
    this._refreshButton();
    this.hooks.onExit?.();
  }

  _refreshButton() {
    if (this.button) this.button.hidden = !this.supported || this.active;
  }
}
