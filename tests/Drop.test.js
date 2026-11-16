/* ============================================================
   Drop.test.js — Letting go of the bomb or the clock in VR
   ============================================================ */

import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { Drop } from '../src/js/three/Drop.js';

const FLAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)); // The bomb lying face up
const HOME = { position: new THREE.Vector3(0, 1, 0), quaternion: FLAT };

function drop() {
  return new Drop({ restY: 1, bounds: { minX: -4, maxX: 4, minZ: -2, maxZ: 2 }, floorY: -5, flat: FLAT, home: HOME });
}

function run(d, seconds = 3) {
  let result = 'falling';
  for (let t = 0; t < seconds && (result === 'falling'); t += 1 / 60) result = d.update(1 / 60);
  return result;
}

describe('Dropping in VR', () => {
  it('falls onto the desk and stays where it lands', () => {
    const d = drop();
    d.start(new THREE.Vector3(2, 3, 1), new THREE.Quaternion());
    expect(run(d)).toBe('landed');
    expect(d.position.x).toBeCloseTo(2, 1);
    expect(d.position.z).toBeCloseTo(1, 1);
    expect(d.position.y).toBe(1);
  });

  it("carries the hand's motion as it falls", () => {
    const d = drop();
    d.start(new THREE.Vector3(0, 3, 0), new THREE.Quaternion(), new THREE.Vector3(4, 0, 0));
    run(d);
    expect(d.position.x).toBeGreaterThan(0.5);
  });

  it('lies flat, keeping the turn it had about the vertical', () => {
    const d = drop();
    const turned = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.6)
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.4)); // Tilted in the hand
    d.start(new THREE.Vector3(0, 3, 0), turned);
    run(d);
    const expected = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.6).multiply(FLAT);
    expect(d.quaternion.angleTo(expected)).toBeLessThan(0.01);
  });

  it('goes back to its place when it misses the desk', () => {
    const d = drop();
    d.start(new THREE.Vector3(9, 3, 0), new THREE.Quaternion());
    expect(run(d, 5)).toBe('returned');
    expect(d.position.distanceTo(HOME.position)).toBeLessThan(0.001);
  });

  it('goes back to its place when let go of below the desk top', () => {
    const d = drop();
    d.start(new THREE.Vector3(0, 0.5, 0), new THREE.Quaternion());
    expect(run(d)).toBe('returned');
  });

  it('knows where the desk is', () => {
    const d = drop();
    expect(d.isOverDesk(0, 0)).toBe(true);
    expect(d.isOverDesk(5, 0)).toBe(false);
    expect(d.isOverDesk(0, -3)).toBe(false);
  });
});

describe('Dropping a box (the bomb)', () => {
  const HALF = new THREE.Vector3(1.6, 1.1, 0.45);  // The bomb's half sizes
  function boxDrop() {
    return new Drop({
      restY: 1.01, deskTop: 0.56, halfExtents: HALF, flat: FLAT, home: HOME,
      bounds: { minX: -4, maxX: 4, minZ: -2, maxZ: 2 }, floorY: -5,
    });
  }

  it('lands on its back, face up, when it falls that way, keeping its turn', () => {
    const d = boxDrop();
    const turned = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.7)
      .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.2, 0, 0)));
    d.start(new THREE.Vector3(0, 4, 0), turned);
    expect(run(d)).toBe('landed');
    expect(d.position.y).toBeCloseTo(0.56 + 0.45, 5);
    const front = new THREE.Vector3(0, 0, 1).applyQuaternion(d.quaternion);
    expect(front.y).toBeCloseTo(1, 5);                // Face up
    expect(d.quaternion.angleTo(turned)).toBeLessThan(0.25); // Only the small tilt was taken out
  });

  it('lands on its long side when it falls standing on it, not back to face up', () => {
    const d = boxDrop();
    const standing = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0.4, 0)); // Upright, as held
    d.start(new THREE.Vector3(1, 5, 0), standing);
    expect(run(d)).toBe('landed');
    expect(d.position.y).toBeCloseTo(0.56 + 1.1, 5);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(d.quaternion);
    expect(Math.abs(up.y)).toBeCloseTo(1, 5);         // Its long side is down
  });

  it('touches the desk with its lowest corner, not its centre', () => {
    const d = boxDrop();
    const tilted = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, 0, 0.5));
    expect(d.contactY(tilted)).toBeGreaterThan(0.56 + 0.45);
  });
});
