import { describe, expect, it } from 'vitest';
import {
  DASH_SECONDS,
  DOT_SECONDS,
  FREQUENCIES,
  LETTER_GAP_SECONDS,
  MORSE_CHART,
  MorseRules,
  MorseSignal,
  REPEAT_GAP_SECONDS,
  signalSteps,
  SYMBOL_GAP_SECONDS,
  WORD_FREQUENCIES,
  WORDS,
} from '../src/js/game/rules/MorseRules.js';

describe('Morse Code tables', () => {
  it('matches the manual word for word', () => {
    expect(WORD_FREQUENCIES).toEqual({
      shell: 3505, halls: 3515, slick: 3522, trick: 3532,
      boxes: 3535, leaks: 3542, strobe: 3545, bistro: 3552,
      flick: 3555, bombs: 3565, break: 3572, brick: 3575,
      steak: 3582, sting: 3592, vector: 3595, beats: 3600,
    });
  });

  it('runs up the frequencies in order', () => {
    expect(FREQUENCIES).toEqual([...FREQUENCIES].sort((a, b) => a - b));
    expect(new Set(FREQUENCIES).size).toBe(16);
  });

  it('can spell every word', () => {
    WORDS.forEach((word) => {
      [...word].forEach((letter) => expect(MORSE_CHART[letter]).toMatch(/^[.-]+$/));
    });
  });

  it('gives each letter its own code', () => {
    const codes = Object.values(MORSE_CHART);

    expect(codes).toHaveLength(26);
    expect(new Set(codes).size).toBe(26);
  });

  it('spells every word differently', () => {
    const signals = WORDS.map((word) => JSON.stringify(signalSteps(word)));

    expect(new Set(signals).size).toBe(WORDS.length);
  });
});

describe('Morse Code signal', () => {
  it('uses short and long flashes and the three gaps', () => {
    // "at" is dot dash, then dash, so all the timings but the symbol gap's length show
    const steps = signalSteps('at');

    expect(steps).toEqual([
      { lit: true, seconds: DOT_SECONDS },
      { lit: false, seconds: SYMBOL_GAP_SECONDS },
      { lit: true, seconds: DASH_SECONDS },
      { lit: false, seconds: LETTER_GAP_SECONDS },
      { lit: true, seconds: DASH_SECONDS },
      { lit: false, seconds: REPEAT_GAP_SECONDS },
    ]);
  });

  it('keeps the gaps easy to tell apart', () => {
    expect(LETTER_GAP_SECONDS).toBeGreaterThan(SYMBOL_GAP_SECONDS);
    expect(REPEAT_GAP_SECONDS).toBeGreaterThan(LETTER_GAP_SECONDS * 2);
    expect(DASH_SECONDS).toBeGreaterThan(DOT_SECONDS * 2);
  });

  const FRAME = 0.125; // Adds up exactly, unlike 0.05

  const record = (signal, seconds) => {
    const lit = [];
    for (let t = 0; t < seconds; t += FRAME) {
      lit.push(signal.lit);
      signal.update(FRAME);
    }
    return lit;
  };

  it('plays the steps in time', () => {
    const signal = new MorseSignal('e'); // A single dot

    expect(signal.lit).toBe(true);
    signal.update(DOT_SECONDS - 0.01);
    expect(signal.lit).toBe(true);
    signal.update(0.02);
    expect(signal.lit).toBe(false);
  });

  it('loops the word for good', () => {
    const word = 'shell';
    const length = signalSteps(word).reduce((sum, step) => sum + step.seconds, 0);
    const frames = length / FRAME;
    const lit = record(new MorseSignal(word), length * 2);

    expect(lit.slice(frames, frames * 2)).toEqual(lit.slice(0, frames));
  });

  it('stays in step through a slow frame', () => {
    const smooth = new MorseSignal('trick');
    const slow = new MorseSignal('trick');

    for (let i = 0; i < 40; i++) smooth.update(0.05);
    slow.update(2);

    expect(slow.lit).toBe(smooth.lit);
  });
});

describe('Morse Code tuning', () => {
  it('starts on the first frequency and picks a word from the table', () => {
    const rules = new MorseRules();

    expect(rules.frequency).toBe(3505);
    expect(WORDS).toContain(rules.word);
  });

  it('steps through every frequency', () => {
    const rules = new MorseRules('beats');

    FREQUENCIES.forEach((frequency) => {
      expect(rules.frequency).toBe(frequency);
      rules.tune(1);
    });
  });

  it('stops at both ends', () => {
    const rules = new MorseRules('shell');

    rules.tune(-1);
    expect(rules.frequency).toBe(3505);

    for (let i = 0; i < 30; i++) rules.tune(1);
    expect(rules.frequency).toBe(3600);
  });

  it.each(WORDS)('solves %s only on its own frequency', (word) => {
    const rules = new MorseRules(word);

    FREQUENCIES.forEach((frequency) => {
      expect(rules.transmit()).toBe(frequency === WORD_FREQUENCIES[word] ? 'solve' : 'strike');
      rules.tune(1);
    });
  });
});
