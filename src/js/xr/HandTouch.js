/* ============================================================
   HandTouch.js — Touching the bomb up close with tracked hands
   In the bomb room in VR each free hand or controller has a small
   pale blue droplet in front of it, its tip pointing the way the
   hand points; there are no beams. When the tip touches a bomb
   part, the droplet turns red and the part gets a red outline;
   a pinch or the trigger then uses that part, wires and buttons
   alike. The bomb's parts can't be poked: its buttons are smaller
   than a fingertip, so pokes pressed the wrong ones by accident.
   Only the alarm clock's big snooze bar can be poked.
   Distances are measured to each part's real shape (a BVH), so
   only the wire under the tip lights up, not its neighbours.
   ============================================================ */

import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

// In metres; the game works in units of 1/8 m, so these are scaled by the rig's scale
export const TOUCH = {
  near: 0.25,          // Parts are only looked for with a droplet this close to the bomb's surface
  dropRadius: 0.006,   // The droplet's round end
  dropLength: 0.02,    // From its round end's centre to its tip
  tipAhead: 0.045,     // The tip sits this far in front of the pinch point
  touchGap: 0.006,     // The tip touches a part when it is this close to its surface
  pokePress: 0.004,    // A fingertip this close to the clock's snooze bar presses it...
  pokeRelease: 0.015,  // ...and can press again only once this far away
};

/**
 * A contact that starts at one distance and ends only past a larger one,
 * so a finger resting at the edge doesn't press over and over
 */
export class Contact {
  constructor(start, end) {
    this.start = start;
    this.end = end;
    this.on = false;
  }

  /**
   * @param {number} gap - how far apart, now
   * @returns {'start'|'end'|null} - what changed
   */
  update(gap) {
    if (!this.on && gap <= this.start) {
      this.on = true;
      return 'start';
    }
    if (this.on && gap > this.end) {
      this.on = false;
      return 'end';
    }
    return null;
  }

  reset() {
    this.on = false;
  }
}

/**
 * Wires are cut, not pushed: Wires, Complicated Wires and Wire Sequences.
 * Everything else sinks while it is pinched, so a press can be seen.
 */
export function isWirePart(partId) {
  return /^(wire_|cw_|seq_\d)/.test(partId);
}

/**
 * A droplet's outline, for a lathe round the Y axis: a round end of radius 1
 * at the origin, narrowing in straight lines to a point at (0, length)
 * @param {number} length - from the round end's centre to the tip, in radii (more than 1)
 * @returns {THREE.Vector2[]}
 */
export function dropletProfile(length, steps = 12) {
  const tangent = Math.asin(1 / length); // Where the straight sides meet the round end
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const angle = -Math.PI / 2 + (i / steps) * (tangent + Math.PI / 2);
    points.push(new THREE.Vector2(Math.cos(angle), Math.sin(angle)));
  }
  points.push(new THREE.Vector2(0, length));
  return points;
}

const DROP_COLOUR = 0x9cc8ff;
const UP = new THREE.Vector3(0, 1, 0);
const TOUCH_COLOUR = 0xe0301e;
const OUTLINE_THICKNESS = 0.012; // Game units, in the part's own space

export class HandTouch {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this._hands = {};
    // One droplet shape, its tip at the origin pointing up Y, one radius across
    const length = TOUCH.dropLength / TOUCH.dropRadius;
    const shape = new THREE.LatheGeometry(dropletProfile(length), 20);
    shape.translate(0, -length, 0);
    for (const hand of ['left', 'right']) {
      const drop = new THREE.Mesh(
        shape,
        new THREE.MeshBasicMaterial({ color: DROP_COLOUR, transparent: true, opacity: 0.6, depthWrite: false })
      );
      drop.visible = false;
      drop.renderOrder = 5;
      drop.raycast = () => {};
      scene.add(drop);
      this._hands[hand] = { drop, near: false, touched: null };
    }
    this._outline = makeOutlineMaterial();
    this._point = new THREE.Vector3();
    this._local = new THREE.Vector3();
    this._hit = {};
    this._sphere = new THREE.Sphere();
  }

  /**
   * Whether a hand is showing its droplet (it is free, in touch mode)
   */
  isNear(hand) {
    return Boolean(this._hands[hand]?.near);
  }

  /**
   * The part a hand's droplet is touching, or null
   * @returns {{ object: THREE.Object3D, slotId: string, partId: string }|null}
   */
  touched(hand) {
    return this._hands[hand]?.touched ?? null;
  }

  /**
   * Per frame: place the droplets and find what each one's tip touches
   * @param {object} state
   * @param {Record<'left'|'right', object|null>} state.poses - from GameInput.handPose (null hides that droplet)
   * @param {Record<'left'|'right', boolean>} state.busy - hands holding something, which can't touch
   * @param {THREE.Sphere|null} state.bomb - the bomb's bounds in the world, or null when it isn't there
   * @param {Array<{ object: THREE.Object3D, slotId: string, partId: string }>} state.parts
   * @param {number} state.scale - game units per metre
   * @param {Record<'left'|'right', boolean>} [state.touchingOther] - the droplet touches something else to use (the folder, the clock)
   */
  update({ poses, busy, bomb, parts, scale, touchingOther = {} }) {
    for (const [name, hand] of Object.entries(this._hands)) {
      const pose = poses[name];
      const shown = Boolean(pose && !busy[name]);
      hand.near = shown;
      if (!shown) {
        this._clear(hand);
        continue;
      }

      // The droplet's tip, and the part it touches (by the part's real shape)
      this._point.copy(pose.pinchPoint).addScaledVector(pose.direction, TOUCH.tipAhead * scale);
      const nearBomb = bomb && this._point.distanceTo(bomb.center) < bomb.radius + TOUCH.near * scale;
      const touched = nearBomb ? this._nearest(this._point, parts, TOUCH.touchGap * scale)?.part ?? null : null;
      this._setTouched(hand, touched);
      const red = Boolean(touched || touchingOther[name]);
      const { drop } = hand;
      drop.position.copy(this._point);
      drop.quaternion.setFromUnitVectors(UP, pose.direction);
      drop.scale.setScalar(TOUCH.dropRadius * scale * (red ? 0.8 : 1));
      drop.material.color.setHex(red ? TOUCH_COLOUR : DROP_COLOUR);
      drop.material.opacity = red ? 0.95 : 0.6;
      drop.visible = true;
    }
  }

  /**
   * Forget everything, as when a game ends or VR stops
   */
  reset() {
    for (const hand of Object.values(this._hands)) this._clear(hand);
  }

  _clear(hand) {
    hand.near = false;
    hand.drop.visible = false;
    this._setTouched(hand, null);
  }

  // The nearest part within a distance of a point, by its real shape
  _nearest(point, parts, within) {
    let best = null;
    for (const part of parts) {
      const gap = this._gap(point, part, within);
      if (gap <= within && (!best || gap < best.gap)) best = { part, gap };
    }
    return best;
  }

  // How far a point is from a part's surface, in world units (Infinity if further than `within`)
  _gap(point, part, within) {
    let best = Infinity;
    for (const mesh of partMeshes(part.object)) {
      const geometry = mesh.geometry;
      if (!geometry.boundingSphere) geometry.computeBoundingSphere();
      const scale = mesh.matrixWorld.getMaxScaleOnAxis();
      this._sphere.copy(geometry.boundingSphere).applyMatrix4(mesh.matrixWorld);
      if (this._sphere.distanceToPoint(point) > within) continue; // Quickly out of reach
      geometry.boundsTree ??= new MeshBVH(geometry);
      this._local.copy(point);
      mesh.worldToLocal(this._local);
      const hit = geometry.boundsTree.closestPointToPoint(this._local, this._hit, 0, within / scale);
      if (hit) best = Math.min(best, hit.distance * scale);
    }
    return best;
  }

  // The red outline on the touched part, and none on the one before
  _setTouched(hand, part) {
    if (hand.touched?.object === part?.object) return;
    if (hand.touched) this._showOutline(hand.touched.object, false);
    hand.touched = part;
    if (part) this._showOutline(part.object, true);
  }

  _showOutline(object, on) {
    object.traverse((mesh) => {
      if (!mesh.isMesh || mesh.name.startsWith('hit_') || mesh.userData.isOutline) return;
      if (!mesh.userData.outline && on && mesh.geometry.attributes.normal) {
        const outline = new THREE.Mesh(mesh.geometry, this._outline);
        outline.userData.isOutline = true;
        outline.raycast = () => {};
        mesh.userData.outline = outline;
        mesh.add(outline);
      }
      if (mesh.userData.outline) mesh.userData.outline.visible = on;
    });
  }
}

// A part's meshes, including its invisible larger hit area, but never its outlines
function partMeshes(object) {
  if (!object.userData.touchMeshes) {
    const meshes = [];
    object.traverse((mesh) => {
      if (mesh.isMesh && !mesh.userData.isOutline && mesh.geometry?.attributes.position) meshes.push(mesh);
    });
    object.userData.touchMeshes = meshes;
  }
  return object.userData.touchMeshes.filter(mesh => mesh.visible || mesh.name.startsWith('hit_'));
}

// Red, drawn from the back and pushed out along the normals: a rim round the part
function makeOutlineMaterial() {
  const material = new THREE.MeshBasicMaterial({ color: TOUCH_COLOUR, side: THREE.BackSide });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `vec3 transformed = vec3( position ) + normalize( normal ) * ${OUTLINE_THICKNESS.toFixed(4)};`
    );
  };
  return material;
}
