/* ============================================================
   settings.js — The player's options, kept in this browser
   Only conveniences live here (the volume, the Free Play case's
   last settings), so the game
   works the same when the browser keeps nothing.
   ============================================================ */

const KEY = 'talk-to-defuse-settings';
const DEFAULTS = { effectsVolume: 1, freePlay: null };  // freePlay: the case's last settings

export function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Private windows and blocked storage: the setting lasts until the page closes
  }
}

/**
 * A volume one step up or down, kept between 0 and 1 in tenths
 */
export function stepVolume(volume, step) {
  return Math.round(Math.min(1, Math.max(0, volume + step)) * 10) / 10;
}
