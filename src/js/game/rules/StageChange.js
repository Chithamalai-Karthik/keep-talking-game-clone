/* ============================================================
   StageChange.js — Timing of a change of stage
   Buttons sink one by one, rise one by one, and then the display
   comes back. Used by Who's on First and Memory.
   ============================================================ */

export const STAGGER_SECONDS = 0.09; // Between one button starting and the next
export const TRAVEL_SECONDS = 0.12; // One button going all the way down or up
export const DISPLAY_PAUSE_SECONDS = 0.2; // After the last button is back up

const clamp = (value) => Math.min(Math.max(value, 0), 1);

export class StageChange {
  /**
   * @param {number} buttonCount
   */
  constructor(buttonCount) {
    this._sweep = (buttonCount - 1) * STAGGER_SECONDS + TRAVEL_SECONDS;
    this._elapsed = 0;
    this._hidden = false;
    this.active = false;
  }

  start() {
    this._elapsed = 0;
    this._hidden = false;
    this.active = true;
  }

  /**
   * How far down a button is
   * @param {number} index - button, in the order they move
   * @returns {number} 0 is fully up, 1 is hidden
   */
  depth(index) {
    if (!this.active) return 0;

    const start = index * STAGGER_SECONDS;
    const down = clamp((this._elapsed - start) / TRAVEL_SECONDS);
    const up = clamp((this._elapsed - this._sweep - start) / TRAVEL_SECONDS);
    return down - up;
  }

  /**
   * @param {number} delta - seconds since the last frame
   * @returns {'hidden'|'done'|null} 'hidden' once all buttons are down, 'done' at the end
   */
  update(delta) {
    if (!this.active) return null;

    this._elapsed += delta;

    if (!this._hidden && this._elapsed >= this._sweep) {
      // A slow frame can't skip this moment, because the new labels go on here
      this._elapsed = this._sweep;
      this._hidden = true;
      return 'hidden';
    }

    if (this._hidden && this._elapsed >= this._sweep * 2 + DISPLAY_PAUSE_SECONDS) {
      this.active = false;
      return 'done';
    }

    return null;
  }
}
