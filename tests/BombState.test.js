/* ============================================================
   BombState.test.js — Random bomb generation
   Every bomb is random, so each rule is checked across many bombs.
   ============================================================ */

import { describe, expect, it } from 'vitest';
import { BombState } from '../src/js/game/BombState.js';
import {
  ACTIVE_MODULES,
  BATTERY_CELLS,
  DIFFICULTY,
  INDICATOR_LABELS,
  PORT_TYPES,
  WIDGET_MOUNT_COUNT,
} from '../src/js/utils/constants.js';

const SAMPLE_SIZE = 500;

function sampleBombs(config = DIFFICULTY.expert) {
  return Array.from({ length: SAMPLE_SIZE }, () => new BombState(config));
}

describe('serial number', () => {
  it('has 6 characters, with two letters and a final digit', () => {
    for (const bomb of sampleBombs()) {
      expect(bomb.serial).toMatch(/^[A-Z0-9]{5}\d$/);
      expect(bomb.serial.replace(/\d/g, '')).toHaveLength(2);
    }
  });

  it('derives odd and vowel flags from the serial', () => {
    for (const bomb of sampleBombs()) {
      expect(bomb.serialLastDigitOdd).toBe(Number(bomb.serial.at(-1)) % 2 === 1);
      expect(bomb.serialHasVowel).toBe(/[AEIOU]/.test(bomb.serial));
    }
  });
});

describe('batteries', () => {
  it('counts one cell per D holder and two per AA holder', () => {
    for (const bomb of sampleBombs()) {
      const cells = bomb.batteryHolders.reduce((total, type) => total + BATTERY_CELLS[type], 0);
      expect(bomb.batteries).toBe(cells);
    }
  });

  it('gives every total from 0 to 4 and never more', () => {
    const totals = new Set(sampleBombs().map(bomb => bomb.batteries));
    expect([...totals].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('indicators and ports', () => {
  it('uses known, unique indicator labels', () => {
    for (const bomb of sampleBombs()) {
      const labels = bomb.indicators.map(indicator => indicator.label);
      expect(labels.length).toBeLessThanOrEqual(3);
      expect(new Set(labels).size).toBe(labels.length);
      labels.forEach(label => expect(INDICATOR_LABELS).toContain(label));
    }
  });

  it('can use all 11 indicator labels', () => {
    const seen = new Set(sampleBombs().flatMap(bomb => bomb.indicators.map(indicator => indicator.label)));
    expect(seen.size).toBe(INDICATOR_LABELS.length);
  });

  it('uses known, unique ports', () => {
    for (const bomb of sampleBombs()) {
      expect(bomb.ports.length).toBeLessThanOrEqual(3);
      expect(new Set(bomb.ports).size).toBe(bomb.ports.length);
      bomb.ports.forEach(port => expect(PORT_TYPES).toContain(port));
    }
  });

  it('answers lookups from the generated data', () => {
    for (const bomb of sampleBombs()) {
      for (const { label, lit } of bomb.indicators) {
        expect(bomb.hasIndicator(label)).toBe(true);
        expect(bomb.hasLitIndicator(label)).toBe(lit);
      }
      PORT_TYPES.forEach(port => expect(bomb.hasPort(port)).toBe(bomb.ports.includes(port)));
    }
  });
});

describe('modules and the timer slot', () => {
  it.each(Object.keys(DIFFICULTY))('%s gets the right modules in unique slots', (name) => {
    const config = DIFFICULTY[name];
    for (const bomb of sampleBombs(config)) {
      const slots = bomb.modules.map(module => module.slotId);
      expect(slots).toHaveLength(config.modules);
      expect(new Set([...slots, bomb.timerSlotId]).size).toBe(config.modules + 1);
      bomb.modules.forEach(module => expect(ACTIVE_MODULES).toContain(module.type));
    }
  });

  it('can place the timer in any of the 12 slots', () => {
    const seen = new Set(sampleBombs().map(bomb => bomb.timerSlotId));
    expect(seen.size).toBe(12);
  });
});

describe('widgets', () => {
  it('shows every serial, holder, indicator and port once, at a unique mount', () => {
    for (const bomb of sampleBombs()) {
      const expected = 1 + bomb.batteryHolders.length + bomb.indicators.length + bomb.ports.length;
      const mounts = bomb.widgets.map(widget => widget.mount);
      expect(bomb.widgets).toHaveLength(expected);
      expect(new Set(mounts).size).toBe(expected);
      mounts.forEach((mount) => {
        expect(mount).toBeGreaterThanOrEqual(0);
        expect(mount).toBeLessThan(WIDGET_MOUNT_COUNT);
      });
    }
  });
});

describe('strikes and solving', () => {
  it('explodes on the last allowed strike, not before', () => {
    const bomb = new BombState({ modules: 3, time: 300, maxStrikes: 3 });
    expect(bomb.addStrike()).toBe(false);
    expect(bomb.addStrike()).toBe(false);
    expect(bomb.addStrike()).toBe(true);
  });

  it('reports all solved only after the last module', () => {
    const bomb = new BombState({ modules: 3, time: 300, maxStrikes: 3 });
    const [first, second, third] = bomb.modules.map(module => module.slotId);
    expect(bomb.solveModule(first)).toBe(false);
    expect(bomb.solveModule(second)).toBe(false);
    expect(bomb.solveModule(third)).toBe(true);
  });
});
