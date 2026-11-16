/* ============================================================
   Loader.test.js — Where the loader's spark is on the fuse
   ============================================================ */

import { describe, it, expect } from 'vitest';
import { sparkProgress } from '../src/js/ui/Loader.js';

describe('Loader spark', () => {
  it('starts at the end of the fuse', () => {
    expect(sparkProgress(0, 4, 0)).toBe(0);
  });

  it('never runs ahead of the minimum time, even when everything has loaded', () => {
    expect(sparkProgress(4, 4, 0.4)).toBeLessThan(0.5);
    expect(sparkProgress(4, 4, 5)).toBe(1);
  });

  it('only reaches the bomb when every load has finished', () => {
    expect(sparkProgress(3, 4, 60)).toBeLessThan(1);
    expect(sparkProgress(3, 4, 60)).toBeGreaterThan(0.75);
  });

  it('moves on as loads finish', () => {
    expect(sparkProgress(2, 4, 10)).toBeGreaterThan(sparkProgress(1, 4, 10));
  });
});
