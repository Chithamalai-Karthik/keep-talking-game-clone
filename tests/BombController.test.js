/* ============================================================
   BombController.test.js — Mouse controls, and resetting between games
   ============================================================ */

import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BombController, BOMB_STATE } from '../src/js/three/BombController.js';

const LEFT = 0;
const RIGHT = 2;

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
    controller.onMouseDown({ button: RIGHT, clientX: 0, clientY: 0 });
    controller.onMouseMove({ clientX: 50, clientY: 0 });

    controller.resetToTable();

    expect(controller.getFocusedSlotId()).toBeNull();
    expect(controller.wasDragged()).toBe(false);
    expect(controller.isAnimating()).toBe(false);
    expect(controller.bomb.position).toEqual(controller.tablePosition);
  });
});

describe('mouse controls', () => {
  function drag(controller, button) {
    controller.onMouseDown({ button, clientX: 0, clientY: 0 });
    controller.onMouseMove({ clientX: 50, clientY: 0 });
    return controller.onMouseUp({ button });
  }

  it('rotates on a right drag, which is not a click', () => {
    const controller = heldController();
    expect(drag(controller, RIGHT)).toBe(false);
    expect(controller._targetRotation.y).not.toBe(0);
  });

  it('does not rotate on a left drag', () => {
    const controller = heldController();
    drag(controller, LEFT);
    expect(controller._targetRotation.y).toBe(0);
  });

  it('keeps the selected module while rotating', () => {
    const controller = heldController();
    controller.focusModule('front', 'front-0');
    controller.update(1);

    drag(controller, RIGHT);

    expect(controller.getState()).toBe(BOMB_STATE.MODULE_FOCUSED);
    expect(controller.getFocusedSlotId()).toBe('front-0');
    expect(controller._targetRotation.y).not.toBe(0);
  });

  it('reports a right click that did not move', () => {
    const controller = heldController();
    controller.onMouseDown({ button: RIGHT, clientX: 0, clientY: 0 });
    expect(controller.onMouseUp({ button: RIGHT })).toBe(true);
  });
});
