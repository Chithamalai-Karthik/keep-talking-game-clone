import { describe, expect, it } from 'vitest';
import { BombState } from '../src/js/game/BombState.js';
import { KNOB_PATTERNS, KNOB_POSITIONS, KnobRules, LED_COLUMNS } from '../src/js/game/rules/KnobRules.js';
import { FIRST_WAIT_SECONDS, NeedyTimer, NEXT_WAIT_SECONDS } from '../src/js/game/rules/NeedyTimer.js';
import { DETONATE, VENT, VentingRules } from '../src/js/game/rules/VentingRules.js';
import { DIFFICULTY, NEEDY_MODULES } from '../src/js/utils/constants.js';

describe('NeedyTimer', () => {
  function waited(duration = 45) {
    const timer = new NeedyTimer(duration);
    timer.update(FIRST_WAIT_SECONDS[1]);
    return timer;
  }

  it('waits at first, within the first wait', () => {
    const timer = new NeedyTimer(45);

    expect(timer.active).toBe(false);
    expect(timer.update(FIRST_WAIT_SECONDS[0] - 1)).toBe(null);
    expect(timer.update(FIRST_WAIT_SECONDS[1] - FIRST_WAIT_SECONDS[0] + 1)).toBe('activated');
    expect(timer.active).toBe(true);
  });

  it('shows nothing while waiting, and whole seconds once active', () => {
    const timer = new NeedyTimer(45);
    expect(timer.display).toBe(null);

    timer.activate();
    expect(timer.display).toBe(45);
    timer.update(0.5);
    expect(timer.display).toBe(45);
    timer.update(0.6);
    expect(timer.display).toBe(44);
  });

  it('expires once and goes back to waiting', () => {
    const timer = waited();

    expect(timer.update(44)).toBe(null);
    expect(timer.update(2)).toBe('expired');
    expect(timer.active).toBe(false);
    expect(timer.update(1)).toBe(null);
  });

  it('wakes again after resting', () => {
    const timer = waited();
    timer.rest();

    expect(timer.update(NEXT_WAIT_SECONDS[0] - 1)).toBe(null);
    expect(timer.update(NEXT_WAIT_SECONDS[1])).toBe('activated');
  });

  it('adds time up to full, and says when it is full', () => {
    const timer = waited(40);
    timer.update(10);

    expect(timer.add(4)).toBe(false);
    expect(timer.secondsLeft).toBe(34);
    expect(timer.add(100)).toBe(true);
    expect(timer.secondsLeft).toBe(40);
  });
});

describe('Venting Gas', () => {
  it('finishes on yes to venting', () => {
    const rules = new VentingRules();
    rules.ask(VENT);

    expect(rules.answer('y')).toBe('done');
  });

  it('only warns on no to venting', () => {
    const rules = new VentingRules();
    rules.ask(VENT);

    expect(rules.answer('n')).toBe('warning');
  });

  it('finishes on no to detonating', () => {
    const rules = new VentingRules();
    rules.ask(DETONATE);

    expect(rules.answer('n')).toBe('done');
  });

  it('strikes on yes to detonating', () => {
    const rules = new VentingRules();
    rules.ask(DETONATE);

    expect(rules.answer('y')).toBe('strike');
  });

  it('asks both questions', () => {
    const rules = new VentingRules();
    const asked = new Set();
    for (let i = 0; i < 300; i++) {
      rules.ask();
      asked.add(rules.prompt);
    }

    expect(asked).toEqual(new Set([VENT, DETONATE]));
  });
});

describe('Knob patterns', () => {
  // How many X the manual shows under each position
  it.each([['up', 15], ['down', 13], ['left', 8], ['right', 16]])('%s has %i lit lights', (position, lit) => {
    const lights = KNOB_PATTERNS[position].flat().join('').match(/X/g);

    expect(lights).toHaveLength(lit);
  });

  it('has two patterns of two rows of six for each position', () => {
    KNOB_POSITIONS.forEach((position) => {
      expect(KNOB_PATTERNS[position]).toHaveLength(2);
      KNOB_PATTERNS[position].flat().forEach(row => expect(row).toHaveLength(LED_COLUMNS));
    });
  });

  it('never uses one pattern for two positions', () => {
    const all = Object.values(KNOB_PATTERNS).flat().map(pattern => pattern.join(''));

    expect(new Set(all).size).toBe(8);
  });
});

describe('Knob play', () => {
  it('reads the position against an unturned label', () => {
    const rules = new KnobRules(0, 0);

    expect(rules.position).toBe('up');
    rules.turn();
    expect(rules.position).toBe('right');
  });

  it('reads the position against a turned label', () => {
    expect(new KnobRules(1, 1).position).toBe('up');
    expect(new KnobRules(1, 0).position).toBe('left');
    expect(new KnobRules(2, 3).position).toBe('right');
  });

  it('comes round after four turns', () => {
    const rules = new KnobRules(0, 0);
    for (let i = 0; i < 4; i++) rules.turn();

    expect(rules.position).toBe('up');
  });

  it('is right only at the position the lights ask for', () => {
    const rules = new KnobRules(3, 2);
    rules.pickPattern('down');

    const right = [0, 1, 2, 3].map(() => {
      const correct = rules.isCorrect;
      rules.turn();
      return correct;
    });
    expect(right.filter(Boolean)).toHaveLength(1);
  });

  it('shows the lights of the pattern it picked', () => {
    const rules = new KnobRules(0, 0);
    rules.pickPattern('left');

    expect(KNOB_PATTERNS.left).toContain(rules.pattern);
    const lit = rules.pattern[0].split('').filter((_, column) => rules.isLit(0, column));
    expect(lit.every(mark => mark === 'X')).toBe(true);
  });
});

describe('Needy modules on a bomb', () => {
  it.each(Object.keys(DIFFICULTY))('%s has its needy modules, within its slots', (name) => {
    const config = DIFFICULTY[name];

    for (let i = 0; i < 50; i++) {
      const bomb = new BombState(config);
      const needy = bomb.modules.filter(module => module.needy);

      expect(bomb.modules).toHaveLength(config.modules);
      expect(needy).toHaveLength(config.needy);
      needy.forEach(module => expect(NEEDY_MODULES).toContain(module.type));
    }
  });

  it('wins once the regular modules are solved, whatever the needy ones do', () => {
    const bomb = new BombState(DIFFICULTY.medium);
    const regular = bomb.modules.filter(module => !module.needy);
    const results = regular.map(module => bomb.solveModule(module.slotId));

    expect(results.at(-1)).toBe(true);
    expect(results.slice(0, -1)).not.toContain(true);
  });
});
