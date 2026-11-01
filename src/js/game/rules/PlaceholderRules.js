/* ============================================================
   PlaceholderRules.js — Rules for the stand-in module
   Green solves and red strikes, so a whole game can be played
   before the real modules exist.
   ============================================================ */

export class PlaceholderRules {
  /**
   * @param {string} part — 'solve' or 'strike'
   * @returns {string} — The result: 'solve' or 'strike'
   */
  press(part) {
    return part === 'solve' ? 'solve' : 'strike';
  }
}
