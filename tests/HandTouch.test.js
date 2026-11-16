/* ============================================================
   HandTouch.test.js — The droplet's shape, poking the snooze bar, and which parts are wires
   ============================================================ */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { dropletProfile, isWirePart, Contact, TOUCH } from '../src/js/xr/HandTouch.js';

describe('The droplet pointer', () => {
  it('has a round end and narrows to a point at its tip', () => {
    const profile = dropletProfile(3);
    expect(profile[0].x).toBeCloseTo(0);
    expect(profile[0].y).toBeCloseTo(-1);
    const tip = profile[profile.length - 1];
    expect(tip.x).toBe(0);
    expect(tip.y).toBe(3);
    // Never wider than the round end, and the outline climbs steadily to the tip
    for (let i = 1; i < profile.length; i++) {
      expect(profile[i].x).toBeLessThanOrEqual(1 + 1e-9);
      expect(profile[i].y).toBeGreaterThan(profile[i - 1].y);
    }
  });

  it('meets its straight sides smoothly, where they touch the round end', () => {
    const profile = dropletProfile(3);
    const joint = profile[profile.length - 2];
    const tip = profile[profile.length - 1];
    const side = new THREE.Vector2().subVectors(tip, joint).normalize();
    expect(side.dot(joint)).toBeCloseTo(0); // The side is at right angles to the radius there
  });
});

describe('Poking the snooze bar', () => {
  it('presses when the fingertip comes close, and again only after clearly moving away', () => {
    const poke = new Contact(TOUCH.pokePress, TOUCH.pokeRelease);
    expect(poke.update(0.03)).toBeNull();
    expect(poke.update(0.003)).toBe('start');
    expect(poke.update(0.01)).toBeNull();    // Still resting near it: no second press
    expect(poke.update(0.002)).toBeNull();
    expect(poke.update(0.02)).toBe('end');
    expect(poke.update(0.003)).toBe('start'); // A fresh press
  });

  it('starts fresh after a reset', () => {
    const poke = new Contact(0.004, 0.012);
    poke.update(0);
    poke.reset();
    expect(poke.update(0)).toBe('start');
  });
});

describe('Wires', () => {
  it('knows the parts that are wires, which do not sink when pinched', () => {
    expect(isWirePart('wire_3')).toBe(true);
    expect(isWirePart('cw_0')).toBe(true);
    expect(isWirePart('seq_2C')).toBe(true);
    expect(isWirePart('seq_down')).toBe(false);
    expect(isWirePart('key_1')).toBe(false);
    expect(isWirePart('button')).toBe(false);
  });
});
