/* ============================================================
   ButtonRules.test.js — Tap or hold, and when to release
   ============================================================ */

import { describe, expect, it } from 'vitest';
import { ButtonRules, createButton, HOLD_SECONDS, mustHold, releaseDigit } from '../src/js/game/rules/ButtonRules.js';
import { BUTTON_COLORS, BUTTON_LABELS } from '../src/js/utils/constants.js';

function bomb(batteries = 0, ...litIndicators) {
  return { batteries, hasLitIndicator: label => litIndicators.includes(label) };
}

const HOLD = true;
const TAP = false;

describe('mustHold', () => {
  it.each([
    ['blue Abort', 'blue', 'Abort', bomb(), HOLD],
    ['blue Abort beats everything after it', 'blue', 'Abort', bomb(3, 'FRK'), HOLD],
    ['Detonate with 2 batteries', 'blue', 'Detonate', bomb(2), TAP],
    ['Detonate with 1 battery is not that rule', 'blue', 'Detonate', bomb(1), HOLD],
    ['Detonate beats white and lit CAR', 'white', 'Detonate', bomb(2, 'CAR'), TAP],
    ['white with lit CAR', 'white', 'Press', bomb(0, 'CAR'), HOLD],
    ['white with lit CAR beats lit FRK', 'white', 'Press', bomb(3, 'CAR', 'FRK'), HOLD],
    ['3 batteries and lit FRK', 'white', 'Press', bomb(3, 'FRK'), TAP],
    ['2 batteries and lit FRK is not that rule', 'red', 'Press', bomb(2, 'FRK'), HOLD],
    ['3 batteries and lit FRK beats yellow', 'yellow', 'Press', bomb(3, 'FRK'), TAP],
    ['yellow', 'yellow', 'Hold', bomb(), HOLD],
    ['red Hold', 'red', 'Hold', bomb(), TAP],
    ['otherwise hold', 'red', 'Press', bomb(), HOLD],
  ])('%s', (_, color, label, state, expected) => {
    expect(mustHold({ color, label }, state)).toBe(expected);
  });
});

describe('releaseDigit', () => {
  it.each([
    ['blue', '4'],
    ['white', '1'],
    ['yellow', '5'],
    ['red', '1'],
  ])('%s strip releases on %s', (color, digit) => {
    expect(releaseDigit(color)).toBe(digit);
  });
});

describe('ButtonRules', () => {
  const tapButton = { color: 'red', label: 'Hold' };
  const holdButton = { color: 'yellow', label: 'Press' };

  function pressed(button, strip = 'blue') {
    const rules = new ButtonRules(button, bomb());
    rules.press(strip);
    return rules;
  }

  it('solves a tap on a tap button', () => {
    expect(pressed(tapButton).release(0.1, '2:33')).toBe('solve');
  });

  it('strikes a hold on a tap button', () => {
    expect(pressed(tapButton).release(HOLD_SECONDS, '2:44')).toBe('strike');
  });

  it('strikes a tap on a hold button', () => {
    expect(pressed(holdButton).release(0.1, '2:44')).toBe('strike');
  });

  it('solves a hold released with the digit anywhere on the timer', () => {
    expect(pressed(holdButton, 'blue').release(1, '4:00')).toBe('solve');
    expect(pressed(holdButton, 'yellow').release(1, '0:35')).toBe('solve');
  });

  it('strikes a hold released without the digit', () => {
    expect(pressed(holdButton, 'blue').release(1, '2:33')).toBe('strike');
  });

  it('picks a new strip colour on each press', () => {
    const rules = pressed(holdButton, 'blue');
    rules.press('white');
    expect(rules.release(1, '1:00')).toBe('solve');
  });
});

describe('createButton', () => {
  it('uses a real colour and label', () => {
    for (let i = 0; i < 50; i++) {
      const { color, label } = createButton();
      expect(BUTTON_COLORS).toContain(color);
      expect(BUTTON_LABELS).toContain(label);
    }
  });
});
