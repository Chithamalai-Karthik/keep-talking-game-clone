/* ============================================================
   AlarmClockRules.js — When the desk clock's alarm goes off
   A distraction, not a puzzle: at random times the clock rings
   until the Defuser hits snooze, or stops on its own. The timing
   is our choice; the manual says nothing about the clock.
   ============================================================ */

export const FIRST_RING = [60, 150];   // Seconds into a game, from and to
export const NEXT_RING = [90, 240];    // Seconds after a ring stops
export const MAX_RING = 30;            // It gives up after this long
export const BEEP_EVERY = 0.5;         // Seconds between beeps

export class AlarmClock {
  /**
   * @param {() => number} random - 0 to 1, replaceable in tests
   */
  constructor(random = Math.random) {
    this._random = random;
    this.ringing = false;
    this._wait = this._between(FIRST_RING);
    this._ringTime = 0;
    this._sinceBeep = 0;
  }

  _between([from, to]) {
    return from + this._random() * (to - from);
  }

  /**
   * Move time on. Returns 'start', 'beep', 'stop' or null for what happened.
   */
  update(delta) {
    if (!this.ringing) {
      this._wait -= delta;
      if (this._wait > 0) return null;
      this.ringing = true;
      this._ringTime = 0;
      this._sinceBeep = 0;
      return 'start';
    }

    this._ringTime += delta;
    if (this._ringTime >= MAX_RING) {
      this._stop();
      return 'stop';
    }
    this._sinceBeep += delta;
    if (this._sinceBeep >= BEEP_EVERY) {
      this._sinceBeep -= BEEP_EVERY;
      return 'beep';
    }
    return null;
  }

  /**
   * Ring at the next update (a development shortcut)
   */
  ringNow() {
    if (!this.ringing) this._wait = 0;
  }

  /**
   * The snooze bar: stops a ring. Returns whether it was ringing.
   */
  snooze() {
    if (!this.ringing) return false;
    this._stop();
    return true;
  }

  /**
   * Whether the display shows its digits now: they flash fast while ringing
   */
  get displayOn() {
    return !this.ringing || Math.floor(this._sinceBeep / (BEEP_EVERY / 4)) % 2 === 0;
  }

  _stop() {
    this.ringing = false;
    this._wait = this._between(NEXT_RING);
  }
}
