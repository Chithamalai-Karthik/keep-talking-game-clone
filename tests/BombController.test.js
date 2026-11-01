/* ============================================================
   BombController.test.js — Resetting the bomb between games
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
    controller.onMouseDown({ button: 0, clientX: 0, clientY: 0 });
    controller.onMouseMove({ clientX: 50, clientY: 0 });

    controller.resetToTable();

    expect(controller.getFocusedSlotId()).toBeNull();
    expect(controller.wasDragged()).toBe(false);
    expect(controller.isAnimating()).toBe(false);
    expect(controller.bomb.position).toEqual(controller.tablePosition);
  });
});
