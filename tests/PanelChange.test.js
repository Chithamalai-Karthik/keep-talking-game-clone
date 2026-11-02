import { describe, expect, it } from 'vitest';
import { MOVE_SECONDS, PanelChange, panelSink, SHUT_SECONDS } from '../src/js/game/rules/PanelChange.js';

describe('panelSink', () => {
  it('starts up and ends fully down', () => {
    expect(panelSink(0)).toBe(0);
    expect(panelSink(1)).toBeCloseTo(1);
  });

  it('always moves one way', () => {
    for (let shut = 0; shut < 1; shut += 0.05) {
      expect(panelSink(shut + 0.05)).toBeGreaterThan(panelSink(shut));
    }
  });

  it('keeps the wires above the floor until the doors have nearly met', () => {
    // The wires reach the well's surface at a sink of about 0.55
    expect(panelSink(0.85)).toBeLessThan(0.55);
  });

  it('stays below the folding doors the whole way', () => {
    // The sink needed for the sockets to clear a door at each stage of its fold
    [[0.6, 0.275], [0.75, 0.41], [0.9, 0.54]].forEach(([shut, needed]) => {
      expect(panelSink(shut)).toBeGreaterThanOrEqual(needed);
    });
  });
});

function started() {
  const change = new PanelChange();
  change.start();
  return change;
}

describe('PanelChange', () => {
  it('rests fully open', () => {
    const change = new PanelChange();

    expect(change.active).toBe(false);
    expect(change.shut).toBe(0);
    expect(change.update(1)).toBe(null);
  });

  it('closes steadily, starting and ending gently', () => {
    const change = started();
    const quarter = MOVE_SECONDS / 4;

    change.update(quarter);
    const first = change.shut;
    change.update(quarter);
    const middle = change.shut;

    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(0.25);
    expect(middle).toBeCloseTo(0.5);
  });

  it('swaps at the moment it is fully shut', () => {
    const change = started();

    expect(change.update(MOVE_SECONDS)).toBe('hidden');
    expect(change.shut).toBe(1);
  });

  it('holds shut for a moment before opening', () => {
    const change = started();
    change.update(MOVE_SECONDS);
    change.update(SHUT_SECONDS * 0.9);

    expect(change.shut).toBe(1);
  });

  it('opens as the mirror of closing', () => {
    const change = started();
    change.update(MOVE_SECONDS);
    change.update(SHUT_SECONDS + MOVE_SECONDS / 2);

    expect(change.shut).toBeCloseTo(0.5);
  });

  it('ends fully open', () => {
    const change = started();
    change.update(MOVE_SECONDS);

    expect(change.update(SHUT_SECONDS + MOVE_SECONDS * 0.9)).toBe(null);
    expect(change.update(MOVE_SECONDS * 0.2)).toBe('done');
    expect(change.active).toBe(false);
    expect(change.shut).toBe(0);
  });

  it('still swaps fully shut after one slow frame', () => {
    const change = started();

    expect(change.update(10)).toBe('hidden');
    expect(change.shut).toBe(1);
    expect(change.update(10)).toBe('done');
  });

  it('can run again', () => {
    const change = started();
    change.update(10);
    change.update(10);
    change.start();

    expect(change.active).toBe(true);
    expect(change.update(10)).toBe('hidden');
  });
});
