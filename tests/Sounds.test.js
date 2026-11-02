/* ============================================================
   Sounds.test.js — Audio stays silent and safe until it can play
   ============================================================ */

import { describe, expect, it } from 'vitest';
import { SIMON_COLORS } from '../src/js/game/rules/SimonRules.js';
import { playSound, SOUNDS, unlockAudio } from '../src/js/audio/Sounds.js';

describe('sounds', () => {
  it('does nothing where the browser has no audio', () => {
    expect(() => unlockAudio()).not.toThrow();
    expect(() => playSound('tick')).not.toThrow();
  });

  it('has a tone for every Simon Says colour', () => {
    SIMON_COLORS.forEach(color => expect(SOUNDS[`simon-${color}`]).toBeTypeOf('function'));
  });
});
