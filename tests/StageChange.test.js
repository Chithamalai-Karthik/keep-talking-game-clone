import { describe, expect, it } from 'vitest';
import {
  DISPLAY_PAUSE_SECONDS,
  STAGGER_SECONDS,
  StageChange,
  TRAVEL_SECONDS,
} from '../src/js/game/rules/StageChange.js';

const BUTTONS = 4;
const SWEEP = (BUTTONS - 1) * STAGGER_SECONDS + TRAVEL_SECONDS;

function started() {
  const change = new StageChange(BUTTONS);
  change.start();
  return change;
}

describe('StageChange', () => {
  it('rests with all buttons up', () => {
    const change = new StageChange(BUTTONS);

    expect(change.active).toBe(false);
    expect(change.depth(0)).toBe(0);
    expect(change.update(1)).toBe(null);
  });

  it('sinks the buttons one by one', () => {
    const change = started();
    change.update(STAGGER_SECONDS * 1.5);

    expect(change.depth(0)).toBeGreaterThan(change.depth(1));
    expect(change.depth(1)).toBeGreaterThan(0);
    expect(change.depth(2)).toBe(0);
    expect(change.depth(3)).toBe(0);
  });

  it('has every button hidden at the moment the labels change', () => {
    const change = started();

    expect(change.update(SWEEP)).toBe('hidden');
    for (let i = 0; i < BUTTONS; i++) expect(change.depth(i)).toBe(1);
  });

  it('raises the buttons one by one, in the same order', () => {
    const change = started();
    change.update(SWEEP);
    change.update(STAGGER_SECONDS * 1.5);

    expect(change.depth(0)).toBeLessThan(change.depth(1));
    expect(change.depth(1)).toBeLessThan(1);
    expect(change.depth(2)).toBe(1);
  });

  it('finishes only after every button is up and a pause has passed', () => {
    const change = started();
    change.update(SWEEP);

    expect(change.update(SWEEP)).toBe(null);
    for (let i = 0; i < BUTTONS; i++) expect(change.depth(i)).toBe(0);
    expect(change.active).toBe(true);

    expect(change.update(DISPLAY_PAUSE_SECONDS)).toBe('done');
    expect(change.active).toBe(false);
  });

  it('reports hidden even when one slow frame covers the whole change', () => {
    const change = started();

    expect(change.update(10)).toBe('hidden');
    expect(change.update(10)).toBe('done');
  });

  it('can run again', () => {
    const change = started();
    change.update(10);
    change.update(10);
    change.start();

    expect(change.active).toBe(true);
    expect(change.update(SWEEP)).toBe('hidden');
  });
});
