/* ============================================================
   GameInput.test.js — Mouse buttons and movement as game actions
   ============================================================ */

import { describe, it, expect } from 'vitest';
import { MouseActions, DRAG_THRESHOLD } from '../src/js/input/GameInput.js';

const LEFT = 0;
const RIGHT = 2;

function recorder() {
  const actions = [];
  const mouse = new MouseActions((type, data) => actions.push(data ? [type, data] : [type]));
  return { actions, mouse };
}

describe('Mouse actions', () => {
  it('turns the left button into press and release', () => {
    const { actions, mouse } = recorder();
    mouse.down(LEFT, 10, 10);
    mouse.up(LEFT);
    expect(actions).toEqual([['press'], ['release']]);
  });

  it('turns a right click that did not move into back', () => {
    const { actions, mouse } = recorder();
    mouse.down(RIGHT, 100, 100);
    mouse.move(100 + DRAG_THRESHOLD - 1, 100);
    mouse.up(RIGHT);
    expect(actions).toEqual([['back']]);
  });

  it('turns a right drag into a turn of the bomb, and not back', () => {
    const { actions, mouse } = recorder();
    mouse.down(RIGHT, 100, 100);
    mouse.move(130, 110);
    mouse.move(140, 110);
    mouse.up(RIGHT);
    expect(actions).toEqual([
      ['rotateStart'],
      ['rotate', { dx: 30, dy: 10 }],
      ['rotate', { dx: 10, dy: 0 }],
      ['rotateEnd'],
    ]);
  });

  it('does not turn anything on a left drag', () => {
    const { actions, mouse } = recorder();
    mouse.down(LEFT, 0, 0);
    mouse.move(80, 0);
    mouse.up(LEFT);
    expect(actions).toEqual([['press'], ['release']]);
  });

  it('ends a turn and lets go of everything when the window loses focus', () => {
    const { actions, mouse } = recorder();
    mouse.down(RIGHT, 0, 0);
    mouse.move(50, 0);
    mouse.cancel();
    mouse.up(RIGHT);
    expect(actions).toEqual([['rotateStart'], ['rotate', { dx: 50, dy: 0 }], ['rotateEnd'], ['cancel']]);
  });
});
