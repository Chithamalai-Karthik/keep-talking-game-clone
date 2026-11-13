/* ============================================================
   FreePlayRules.test.js — Free Play settings and the bomb they make
   ============================================================ */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FREE_PLAY, MIN_TIME, MAX_TIME, MODULE_SLOTS,
  adjustFreePlay, cleanFreePlay, freePlayConfig, needyCount, estimatedDifficulty,
} from '../src/js/game/rules/FreePlayRules.js';

describe('Free Play controls', () => {
  it('steps the time by half a minute, within its limits', () => {
    expect(adjustFreePlay(DEFAULT_FREE_PLAY, 'time-up').time).toBe(330);
    expect(adjustFreePlay(DEFAULT_FREE_PLAY, 'time-down').time).toBe(270);
    expect(adjustFreePlay({ ...DEFAULT_FREE_PLAY, time: MIN_TIME }, 'time-down').time).toBe(MIN_TIME);
    expect(adjustFreePlay({ ...DEFAULT_FREE_PLAY, time: MAX_TIME }, 'time-up').time).toBe(MAX_TIME);
  });

  it('keeps at least one module, and no more than fit', () => {
    expect(adjustFreePlay({ ...DEFAULT_FREE_PLAY, modules: 1 }, 'modules-down').modules).toBe(1);
    expect(adjustFreePlay({ ...DEFAULT_FREE_PLAY, modules: MODULE_SLOTS }, 'modules-up').modules).toBe(MODULE_SLOTS);
  });

  it('leaves room for a needy module when needy is switched on', () => {
    const full = { ...DEFAULT_FREE_PLAY, modules: MODULE_SLOTS };
    const withNeedy = adjustFreePlay(full, 'needy');
    expect(withNeedy.needy).toBe(true);
    expect(withNeedy.modules).toBe(MODULE_SLOTS - 1);
    expect(needyCount(withNeedy)).toBe(1);
  });

  it('toggles hardcore without touching anything else', () => {
    const hard = adjustFreePlay(DEFAULT_FREE_PLAY, 'hardcore');
    expect(hard).toEqual({ ...DEFAULT_FREE_PLAY, hardcore: true });
  });

  it('cleans up settings read back from storage', () => {
    expect(cleanFreePlay({ time: 9999, modules: -4, needy: 'yes' })).toEqual({ time: MAX_TIME, modules: 1, needy: true, hardcore: false });
    expect(cleanFreePlay(undefined)).toEqual(DEFAULT_FREE_PLAY);
  });
});

describe('Free Play bomb', () => {
  it('makes a config shaped like the presets', () => {
    expect(freePlayConfig(DEFAULT_FREE_PLAY)).toEqual({ modules: 3, needy: 0, time: 300, maxStrikes: 3, label: 'Free Play' });
  });

  it('adds one needy module, or two on a bigger bomb, and fits them all', () => {
    expect(freePlayConfig({ ...DEFAULT_FREE_PLAY, needy: true })).toMatchObject({ modules: 4, needy: 1 });
    expect(freePlayConfig({ ...DEFAULT_FREE_PLAY, modules: 8, needy: true })).toMatchObject({ modules: 10, needy: 2 });
    expect(freePlayConfig({ ...DEFAULT_FREE_PLAY, modules: 10, needy: true })).toMatchObject({ modules: 11, needy: 1 });
  });

  it('explodes on the first strike in hardcore', () => {
    expect(freePlayConfig({ ...DEFAULT_FREE_PLAY, hardcore: true })).toMatchObject({ maxStrikes: 1, label: 'Free Play, hardcore' });
  });
});

describe('Estimated difficulty', () => {
  it('rises with modules per minute, needy modules and hardcore, and stays between 0 and 1', () => {
    const easy = estimatedDifficulty(DEFAULT_FREE_PLAY);
    const busy = estimatedDifficulty({ ...DEFAULT_FREE_PLAY, modules: 9, time: 180 });
    const needy = estimatedDifficulty({ ...DEFAULT_FREE_PLAY, needy: true });
    const hardcore = estimatedDifficulty({ ...DEFAULT_FREE_PLAY, hardcore: true });
    expect(easy).toBeLessThan(0.15);
    expect(busy).toBeGreaterThan(easy);
    expect(needy).toBeGreaterThan(easy);
    expect(hardcore).toBeGreaterThan(easy);
    expect(estimatedDifficulty({ time: MIN_TIME, modules: 10, needy: true, hardcore: true })).toBe(1);
  });
});
