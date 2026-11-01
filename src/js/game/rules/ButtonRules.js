/* ============================================================
   ButtonRules.js — Rules for The Button module
   The button's colour and label and the bomb's details decide
   whether to tap it or hold it. A held button lights a strip,
   whose colour sets the digit the timer must show on release.
   ============================================================ */

import { BUTTON_COLORS, BUTTON_LABELS } from '../../utils/constants.js';

// A press this long counts as a hold, and the strip lights
export const HOLD_SECONDS = 0.5;

const STRIP_COLORS = ['blue', 'white', 'yellow', 'red'];
const STRIP_DIGITS = { blue: '4', white: '1', yellow: '5' };
const DEFAULT_STRIP_DIGIT = '1';

const pick = list => list[Math.floor(Math.random() * list.length)];

/**
 * Pick the look of a new button
 * @returns {{color: string, label: string}}
 */
export function createButton() {
  return { color: pick(BUTTON_COLORS), label: pick(BUTTON_LABELS) };
}

/**
 * Decide whether the button must be held
 * @param {{color: string, label: string}} button
 * @param {Object} bombState — The bomb's batteries and indicators
 * @returns {boolean} — false means tap it
 */
export function mustHold({ color, label }, bombState) {
  if (color === 'blue' && label === 'Abort') return true;
  if (bombState.batteries > 1 && label === 'Detonate') return false;
  if (color === 'white' && bombState.hasLitIndicator('CAR')) return true;
  if (bombState.batteries > 2 && bombState.hasLitIndicator('FRK')) return false;
  if (color === 'yellow') return true;
  if (color === 'red' && label === 'Hold') return false;
  return true;
}

/**
 * The digit the timer must show to release a held button
 */
export function releaseDigit(stripColor) {
  return STRIP_DIGITS[stripColor] ?? DEFAULT_STRIP_DIGIT;
}

export class ButtonRules {
  /**
   * @param {{color: string, label: string}} button
   * @param {Object} bombState — The bomb's batteries and indicators
   */
  constructor(button, bombState) {
    this.button = button;
    this.mustHold = mustHold(button, bombState);
    this.stripColor = null;
  }

  /**
   * Press the button, choosing the colour its strip will light
   */
  press(stripColor = pick(STRIP_COLORS)) {
    this.stripColor = stripColor;
  }

  /**
   * Let go of the button
   * @param {number} heldSeconds — How long it was held down
   * @param {string} timeText — The timer as the player sees it
   * @returns {string} — 'solve' or 'strike'
   */
  release(heldSeconds, timeText) {
    const held = heldSeconds >= HOLD_SECONDS;
    if (held !== this.mustHold) return 'strike';
    if (!held) return 'solve';
    return timeText.includes(releaseDigit(this.stripColor)) ? 'solve' : 'strike';
  }
}
