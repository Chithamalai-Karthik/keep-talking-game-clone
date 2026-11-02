/* ============================================================
   PanelChange.js — Timing of a Wire Sequences panel change
   One motion: as the panel sinks, two doors slide out and fold
   over it. They hold shut while the panels swap, then the whole
   motion runs backwards.
   ============================================================ */

export const MOVE_SECONDS = 0.35; // Closing, and again opening
export const SHUT_SECONDS = 0.1; // Held shut while the panels swap

// The panel sinks only as far as it must to clear the folding doors, then drops
// once they have nearly met, so the wires don't vanish in the gap between them
const LATE_DROP_AT = 0.9;
const SINK_BEFORE_DROP = 0.54;

const clamp = (value) => Math.min(Math.max(value, 0), 1);
const ease = (value) => value * value * (3 - 2 * value); // Starts and ends gently

/**
 * How far down the panel is for a given stage of the motion
 * @param {number} shut - 0 is open, 1 is shut
 * @returns {number} 0 is up, 1 is sunk
 */
export function panelSink(shut) {
  if (shut < LATE_DROP_AT) return shut / LATE_DROP_AT * SINK_BEFORE_DROP;
  return SINK_BEFORE_DROP + (shut - LATE_DROP_AT) / (1 - LATE_DROP_AT) * (1 - SINK_BEFORE_DROP);
}

export class PanelChange {
  constructor() {
    this._elapsed = 0;
    this._swapped = false;
    this.active = false;
  }

  start() {
    this._elapsed = 0;
    this._swapped = false;
    this.active = true;
  }

  /**
   * How far the motion has gone: 0 is the panel up and the doors away,
   * 1 is the panel down and the doors shut
   */
  get shut() {
    if (!this.active) return 0;

    const closing = clamp(this._elapsed / MOVE_SECONDS);
    const opening = clamp((this._elapsed - MOVE_SECONDS - SHUT_SECONDS) / MOVE_SECONDS);
    return ease(closing) - ease(opening);
  }

  /**
   * @param {number} delta - seconds since the last frame
   * @returns {'hidden'|'done'|null} 'hidden' once the doors are shut, 'done' at the end
   */
  update(delta) {
    if (!this.active) return null;

    this._elapsed += delta;

    if (!this._swapped && this._elapsed >= MOVE_SECONDS) {
      // A slow frame can't skip this moment, because the panels swap here
      this._elapsed = MOVE_SECONDS;
      this._swapped = true;
      return 'hidden';
    }

    if (this._swapped && this._elapsed >= MOVE_SECONDS * 2 + SHUT_SECONDS) {
      this.active = false;
      return 'done';
    }

    return null;
  }
}
