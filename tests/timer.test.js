/* ============================================================
   timer.test.js — Timer text and strike speed
   ============================================================ */

import { describe, expect, it } from 'vitest';
import { displayTime, formatTime } from '../src/js/utils/helpers.js';
import { strikeSpeed } from '../src/js/utils/constants.js';

describe('formatTime', () => {
  it.each([
    [0, '0:00'],
    [9, '0:09'],
    [59, '0:59'],
    [60, '1:00'],
    [125, '2:05'],
    [300, '5:00'],
  ])('shows %d seconds as %s', (seconds, text) => {
    expect(formatTime(seconds)).toBe(text);
  });
});

describe('displayTime', () => {
  it.each([
    [300, '5:00'],
    [120.4, '2:01'],
    [119.5, '2:00'],
    [60.5, '1:01'],
    [59.5, '1:00'],
    [58.5, '0:59'],
    [0.2, '0:01'],
  ])('shows %d seconds left as %s', (remaining, text) => {
    expect(displayTime(remaining)).toBe(text);
  });
});

describe('strikeSpeed', () => {
  it.each([[0, 1], [1, 1.25], [2, 1.5], [3, 1.75]])('after %d strikes runs at %dx', (strikes, speed) => {
    expect(strikeSpeed(strikes)).toBe(speed);
  });
});
