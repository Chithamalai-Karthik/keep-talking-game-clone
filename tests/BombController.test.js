/* ============================================================
   BombController.test.js — Turning the bomb, and resetting between games
   ============================================================ */

import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BombController, BOMB_STATE } from '../src/js/three/BombController.js';

function heldController() {
  const controller = new BombController(new THREE.Group(), new THREE.PerspectiveCamera());
  controller.pickUp();
  controller.update(1);
  return controller;
}

describe('resetToTable', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is not pulled back to held by an unfocus still in progress', () => {
    const controller = heldController();
    controller.focusModule('front', 'front-0');
    controller.update(1);
    const callback = vi.fn();
    controller.unfocusModule(callback);

    controller.resetToTable();
    vi.runAllTimers();

    expect(controller.getState()).toBe(BOMB_STATE.ON_TABLE);
    expect(callback).not.toHaveBeenCalled();
  });

  it('forgets the focused module, the drag and any animation', () => {
    const controller = heldController();
    controller.focusModule('back', 'back-3');
    controller.rotateStart();
    controller.rotateBy(50, 0);

    controller.resetToTable();

    expect(controller.getFocusedSlotId()).toBeNull();
    expect(controller.isRotating()).toBe(false);
    expect(controller.isAnimating()).toBe(false);
    expect(controller.bomb.position).toEqual(controller.tablePosition);
  });
});

describe('turning the bomb', () => {
  function turn(controller) {
    controller.rotateStart();
    controller.rotateBy(50, 0);
    controller.rotateEnd();
  }

  it('turns the held bomb', () => {
    const controller = heldController();
    turn(controller);
    expect(controller._targetRotation.y).not.toBe(0);
  });

  it('does not turn the bomb while it is on the table', () => {
    const controller = new BombController(new THREE.Group(), new THREE.PerspectiveCamera());
    turn(controller);
    expect(controller._targetRotation.y).toBe(0);
  });

  it('keeps the selected module while turning', () => {
    const controller = heldController();
    controller.focusModule('front', 'front-0');
    controller.update(1);

    turn(controller);

    expect(controller.getState()).toBe(BOMB_STATE.MODULE_FOCUSED);
    expect(controller.getFocusedSlotId()).toBe('front-0');
    expect(controller._targetRotation.y).not.toBe(0);
  });

  it('stops turning when the turn ends', () => {
    const controller = heldController();
    controller.rotateStart();
    controller.rotateEnd();
    controller.rotateBy(50, 0);
    expect(controller._targetRotation.y).toBe(0);
  });
});
