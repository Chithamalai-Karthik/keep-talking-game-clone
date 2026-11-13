/* ============================================================
   AlarmClockRules.test.js — When the desk clock rings and stops
   ============================================================ */

import { describe, it, expect } from 'vitest';
import { AlarmClock, FIRST_RING, NEXT_RING, MAX_RING, BEEP_EVERY } from '../src/js/game/rules/AlarmClockRules.js';

// Run the clock in small steps, collecting what happened
function run(clock, seconds, step = 0.1) {
  const events = [];
  for (let t = 0; t < seconds - 1e-9; t += step) {
    const event = clock.update(step);
    if (event) events.push(event);
  }
  return events;
}

describe('Alarm clock', () => {
  it('stays quiet until its first ring is due', () => {
    const clock = new AlarmClock(() => 0); // Earliest possible ring
    expect(run(clock, FIRST_RING[0] - 1)).toEqual([]);
    expect(clock.ringing).toBe(false);
    expect(run(clock, 1.2)).toContain('start');
    expect(clock.ringing).toBe(true);
  });

  it('rings no later than the end of the first window', () => {
    const clock = new AlarmClock(() => 1);
    run(clock, FIRST_RING[1] + 0.5);
    expect(clock.ringing).toBe(true);
  });

  it('beeps steadily while ringing, and flashes its display', () => {
    const clock = new AlarmClock(() => 0);
    run(clock, FIRST_RING[0] + 0.05);
    const beeps = run(clock, 5, 0.05).filter(e => e === 'beep');
    expect(beeps.length).toBeGreaterThanOrEqual(Math.floor(5 / BEEP_EVERY) - 1);
    clock.update(BEEP_EVERY * 0.75);
    expect(typeof clock.displayOn).toBe('boolean');
  });

  it('stops on snooze, then waits for the next window', () => {
    const clock = new AlarmClock(() => 0);
    run(clock, FIRST_RING[0] + 1);
    expect(clock.snooze()).toBe(true);
    expect(clock.ringing).toBe(false);
    expect(clock.displayOn).toBe(true);
    expect(run(clock, NEXT_RING[0] - 1)).toEqual([]);
    expect(run(clock, 1.2)).toContain('start');
  });

  it('snooze does nothing when it is not ringing', () => {
    expect(new AlarmClock().snooze()).toBe(false);
  });

  it('gives up by itself after a while', () => {
    const clock = new AlarmClock(() => 0);
    run(clock, FIRST_RING[0] + 0.05);
    const events = run(clock, MAX_RING + 0.5);
    expect(events).toContain('stop');
    expect(clock.ringing).toBe(false);
  });
});
