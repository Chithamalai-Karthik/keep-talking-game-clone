/* ============================================================
   FreePlayRules.js — Free Play: a bomb set up by the players
   The case on the office desk sets the time, the number of
   modules, needy modules and hardcore (one strike explodes).
   This turns those settings into a bomb config, like the
   presets in DIFFICULTY, and estimates how hard it will be.
   ============================================================ */

export const MIN_TIME = 60;        // Seconds
export const MAX_TIME = 600;
export const TIME_STEP = 30;
export const MIN_MODULES = 1;
export const MODULE_SLOTS = 11;    // 12 slots on the bomb, less the timer
export const NORMAL_STRIKES = 3;

export const DEFAULT_FREE_PLAY = { time: 300, modules: 3, needy: false, hardcore: false };

/**
 * How many needy modules a bomb gets: one, or two on a bigger bomb, and only where they fit
 */
export function needyCount(settings) {
  if (!settings.needy) return 0;
  return Math.max(0, Math.min(settings.modules >= 6 ? 2 : 1, MODULE_SLOTS - settings.modules));
}

/**
 * The most modules to disarm: needy modules take slots too, but always leave room for one
 */
export function maxModules(settings) {
  return settings.needy ? MODULE_SLOTS - 1 : MODULE_SLOTS;
}

/**
 * Settings read back from storage, kept in range
 */
export function cleanFreePlay(settings = {}) {
  const merged = { ...DEFAULT_FREE_PLAY, ...settings };
  const time = Math.round(Number(merged.time) / TIME_STEP) * TIME_STEP;
  const clean = {
    time: Math.min(MAX_TIME, Math.max(MIN_TIME, Number.isFinite(time) ? time : DEFAULT_FREE_PLAY.time)),
    modules: Number.isFinite(Number(merged.modules)) ? Math.round(Number(merged.modules)) : DEFAULT_FREE_PLAY.modules,
    needy: Boolean(merged.needy),
    hardcore: Boolean(merged.hardcore),
  };
  clean.modules = Math.min(maxModules(clean), Math.max(MIN_MODULES, clean.modules));
  return clean;
}

/**
 * One press of a control. Returns new settings; the old ones are untouched.
 * @param {'time-down'|'time-up'|'modules-down'|'modules-up'|'needy'|'hardcore'} control
 */
export function adjustFreePlay(settings, control) {
  const next = { ...settings };
  if (control === 'time-down') next.time -= TIME_STEP;
  if (control === 'time-up') next.time += TIME_STEP;
  if (control === 'modules-down') next.modules -= 1;
  if (control === 'modules-up') next.modules += 1;
  if (control === 'needy') next.needy = !next.needy;
  if (control === 'hardcore') next.hardcore = !next.hardcore;
  return cleanFreePlay(next);
}

/**
 * The bomb config these settings make, in the same shape as DIFFICULTY's presets
 */
export function freePlayConfig(settings) {
  const needy = needyCount(settings);
  return {
    modules: settings.modules + needy,
    needy,
    time: settings.time,
    maxStrikes: settings.hardcore ? 1 : NORMAL_STRIKES,
    label: settings.hardcore ? 'Free Play, hardcore' : 'Free Play',
  };
}

/**
 * Roughly how hard the bomb is, from 0 (gentle) to 1 (brutal): mostly how little
 * time each module gets, then needy modules and hardcore on top. Our own estimate.
 */
export function estimatedDifficulty(settings) {
  const pressure = settings.modules * 60 / settings.time; // Modules per minute
  let score = Math.min(1, Math.max(0, (pressure - 0.3) / 3.2)) * 0.75;
  if (settings.needy) score += 0.1;
  if (settings.hardcore) score += 0.15;
  return Math.min(1, Math.max(0, score));
}
