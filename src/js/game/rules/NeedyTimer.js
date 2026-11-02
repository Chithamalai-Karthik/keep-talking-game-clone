/* ============================================================
   NeedyTimer.js — When a needy module wakes and how long it has
   A needy module waits, activates, then counts down. If the
   countdown ends it goes back to waiting. It can never be solved.
   ============================================================ */

import { randomInt } from '../../utils/helpers.js';

export const FIRST_WAIT_SECONDS = [30, 60];
export const NEXT_WAIT_SECONDS = [20, 45];

export class NeedyTimer {
  /**
   * @param {number} duration - seconds to tend the module once active
   */
  constructor(duration) {
    this.duration = duration;
    this.active = false;
    this.secondsLeft = 0;
    this._wait = randomInt(...FIRST_WAIT_SECONDS);
  }

  /**
   * @param {number} delta - seconds since the last frame
   * @returns {'activated'|'expired'|null}
   */
  update(delta) {
    if (!this.active) {
      this._wait -= delta;
      if (this._wait > 0) return null;

      this.activate();
      return 'activated';
    }

    this.secondsLeft -= delta;
    if (this.secondsLeft > 0) return null;

    this.rest();
    return 'expired';
  }

  activate() {
    this.active = true;
    this.secondsLeft = this.duration;
  }

  /**
   * Go back to waiting
   */
  rest() {
    this.active = false;
    this.secondsLeft = 0;
    this._wait = randomInt(...NEXT_WAIT_SECONDS);
  }

  /**
   * Put time back on the countdown
   * @returns {boolean} true if that filled it
   */
  add(seconds) {
    this.secondsLeft = Math.min(this.secondsLeft + seconds, this.duration);
    return this.secondsLeft >= this.duration;
  }

  /**
   * The two digits on the module: whole seconds, or null while waiting
   */
  get display() {
    return this.active ? Math.ceil(this.secondsLeft) : null;
  }
}
