import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mustHold, releaseDigit } from '../src/js/game/rules/ButtonRules.js';
import { VENN } from '../src/js/game/rules/ComplicatedWiresRules.js';
import { KEYPAD_COLUMNS } from '../src/js/game/rules/KeypadRules.js';
import { KNOB_PATTERNS } from '../src/js/game/rules/KnobRules.js';
import { MEMORY_RULES } from '../src/js/game/rules/MemoryRules.js';
import { WORD_FREQUENCIES } from '../src/js/game/rules/MorseRules.js';
import { correctWireIndex } from '../src/js/game/rules/WiresRules.js';
import { DISPLAY_POSITIONS, LABEL_LISTS } from '../src/js/game/rules/WhosOnFirstRules.js';
import { BUTTON_COLORS, BUTTON_LABELS, MODULE_NAMES, PASSWORD_WORDS, PORT_TYPES, WIRE_COLORS } from '../src/js/utils/constants.js';
import {
  BUTTON_RELEASE,
  BUTTON_STEPS,
  describeMemoryRule,
  SECTIONS,
  WIRE_STEPS,
} from '../src/js/manual/ManualContent.js';
import { findVennRegions, VENN_OUTSIDE, vennKeyAt } from '../src/js/manual/ManualDrawings.js';

const fullText = SECTIONS.map(section => section.html).join(' ');
const section = id => SECTIONS.find(item => item.id === id).html;

// Every way of colouring a set of wires
function allColourings(count) {
  if (count === 0) return [[]];
  return allColourings(count - 1).flatMap(rest => WIRE_COLORS.map(color => [...rest, color]));
}

describe('Manual Wires sentences match the game', () => {
  const count = (colors, color) => colors.filter(item => item === color).length;
  const last = colors => colors.length - 1;
  const lastOf = (colors, color) => colors.lastIndexOf(color);

  // What each sentence says, in code, in the same order as the manual
  const MEANINGS = {
    3: [
      [c => count(c, 'red') === 0, () => 1],
      [c => c[last(c)] === 'white', c => last(c)],
      [c => count(c, 'blue') > 1, c => lastOf(c, 'blue')],
      [() => true, c => last(c)],
    ],
    4: [
      [(c, odd) => count(c, 'red') > 1 && odd, c => lastOf(c, 'red')],
      [c => c[last(c)] === 'yellow' && count(c, 'red') === 0, () => 0],
      [c => count(c, 'blue') === 1, () => 0],
      [c => count(c, 'yellow') > 1, c => last(c)],
      [() => true, () => 1],
    ],
    5: [
      [(c, odd) => c[last(c)] === 'black' && odd, () => 3],
      [c => count(c, 'red') === 1 && count(c, 'yellow') > 1, () => 0],
      [c => count(c, 'black') === 0, () => 1],
      [() => true, () => 0],
    ],
    6: [
      [(c, odd) => count(c, 'yellow') === 0 && odd, () => 2],
      [c => count(c, 'yellow') === 1 && count(c, 'white') > 1, () => 3],
      [c => count(c, 'red') === 0, c => last(c)],
      [() => true, () => 3],
    ],
  };

  it.each([3, 4, 5, 6])('%i wires: every colouring gives the game\'s answer', (wires) => {
    expect(WIRE_STEPS[wires]).toHaveLength(MEANINGS[wires].length);

    allColourings(wires).forEach((colors) => {
      [true, false].forEach((odd) => {
        const [, cut] = MEANINGS[wires].find(([applies]) => applies(colors, odd));
        expect(cut(colors)).toBe(correctWireIndex(colors, odd));
      });
    });
  });

  it('shows every sentence', () => {
    Object.values(WIRE_STEPS).flat().forEach(step => expect(section('wires')).toContain(step));
  });

  it('says the words each meaning tests', () => {
    expect(WIRE_STEPS[3][0]).toContain('no wire is red');
    expect(WIRE_STEPS[4][1]).toContain('last wire is yellow and no wire is red');
    expect(WIRE_STEPS[5][0]).toContain('cut the fourth wire');
    expect(WIRE_STEPS[6][1]).toContain('cut the fourth wire');
  });
});

describe('Manual Button sentences match the game', () => {
  const HOLD_STEPS = [true, false, true, false, true, false, true];
  const MEANINGS = [
    (color, label) => color === 'blue' && label === 'Abort',
    (color, label, batteries) => batteries > 1 && label === 'Detonate',
    (color, label, batteries, lit) => color === 'white' && lit.includes('CAR'),
    (color, label, batteries, lit) => batteries > 2 && lit.includes('FRK'),
    color => color === 'yellow',
    (color, label) => color === 'red' && label === 'Hold',
    () => true,
  ];

  it('gives the game\'s answer for every button on every bomb', () => {
    BUTTON_COLORS.forEach(color => BUTTON_LABELS.forEach(label => [0, 1, 2, 3, 4].forEach((batteries) => {
      [[], ['CAR'], ['FRK'], ['CAR', 'FRK']].forEach((lit) => {
        const bomb = { batteries, hasLitIndicator: name => lit.includes(name) };
        const step = MEANINGS.findIndex(applies => applies(color, label, batteries, lit));

        expect(HOLD_STEPS[step]).toBe(mustHold({ color, label }, bomb));
      });
    })));
  });

  it('says hold or press for each step, as the meaning does', () => {
    BUTTON_STEPS.forEach((step, index) => {
      expect(step.includes('hold it down')).toBe(HOLD_STEPS[index]);
      expect(step.includes('let go straight away')).toBe(!HOLD_STEPS[index]);
    });
  });

  it('gives the game\'s release digits', () => {
    ['blue', 'white', 'yellow'].forEach((color, index) => {
      expect(BUTTON_RELEASE[index]).toContain(`shows a ${releaseDigit(color)}`);
    });
    expect(BUTTON_RELEASE[3]).toContain(`shows a ${releaseDigit('red')}`);
  });
});

describe('Manual Memory lines come from the game', () => {
  it('words every stage and display', () => {
    Object.values(MEMORY_RULES).forEach((rules) => {
      Object.entries(rules).forEach(([display, rule]) => {
        expect(section('memory')).toContain(describeMemoryRule(display, rule));
      });
    });
  });

  it('words each kind of rule', () => {
    expect(describeMemoryRule(1, { position: 1 })).toContain('second position');
    expect(describeMemoryRule(1, { label: 4 })).toContain('labelled "4"');
    expect(describeMemoryRule(2, { samePositionAs: 1 })).toContain('same position you pressed in stage 1');
    expect(describeMemoryRule(2, { sameLabelAs: 3 })).toContain('same label you pressed in stage 3');
  });
});

describe('Manual Venn diagram', () => {
  const regions = findVennRegions();

  it.each(Object.keys(VENN))('has a region for "%s", holding exactly those ellipses', (key) => {
    expect(regions[key]).toBeDefined();
    expect(vennKeyAt(regions[key].x, regions[key].y)).toBe(key);
  });

  it('puts the letter for a plain wire outside every ellipse', () => {
    expect(vennKeyAt(VENN_OUTSIDE.x, VENN_OUTSIDE.y)).toBe('');
  });

  it('gives each region room for its letter', () => {
    Object.values(regions).forEach(({ room }) => expect(room).toBeGreaterThan(18));
  });
});

describe('Manual tables hold the game\'s data', () => {
  it('lists every Who\'s on First display and label', () => {
    Object.keys(DISPLAY_POSITIONS).filter(Boolean).forEach(word => expect(section('whos-on-first')).toContain(word));
    Object.values(LABEL_LISTS).forEach(words => expect(section('whos-on-first')).toContain(words.join(', ')));
  });

  it('shows every keypad symbol', () => {
    KEYPAD_COLUMNS.flat().forEach(symbol => expect(section('keypads')).toContain(`keypad/${symbol}.png`));
  });

  it('lists every Morse word with its frequency', () => {
    Object.entries(WORD_FREQUENCIES).forEach(([word, frequency]) => {
      expect(section('morse-code')).toContain(word);
      expect(section('morse-code')).toContain(`${(frequency / 1000).toFixed(3)} MHz`);
    });
  });

  it('lists every password', () => {
    PASSWORD_WORDS.forEach(word => expect(section('passwords')).toContain(word.toLowerCase()));
  });

  it('shows all eight knob patterns', () => {
    const tables = section('knobs').match(/class="lights"/g);

    expect(tables).toHaveLength(Object.values(KNOB_PATTERNS).flat().length);
  });

  it('lists every port', () => {
    PORT_TYPES.forEach(port => expect(section('appendix-c')).toContain(port));
  });
});

describe('Printing the manual', () => {
  const css = readFileSync('src/css/manual.css', 'utf8');

  it('never lets the phone layout reach paper, as an A4 page is narrow too', () => {
    expect(css).toContain('@media screen and (max-width: 800px)');
    expect(css).not.toMatch(/@media \(max-width/);
  });

  it('draws Morse marks with borders, as browsers skip backgrounds when printing', () => {
    expect(css).toMatch(/\.dot \{[^}]*border: 4px solid/);
    expect(css).toMatch(/\.dash \{[^}]*border-top: 8px solid/);
  });

  it('keeps every drawing as line art, not a background', () => {
    expect(fullText).not.toContain('background');
  });
});

describe('The manual as a whole', () => {
  it('has a page for every module', () => {
    const titles = SECTIONS.map(item => item.title);
    const names = Object.values(MODULE_NAMES).map(name => (name === 'Knob' ? 'Knobs' : name));

    names.forEach(name => expect(titles).toContain(name));
  });

  it('has unique page ids', () => {
    const ids = SECTIONS.map(item => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no colour in its drawings', () => {
    const colours = fullText.match(/(?:fill|stroke)="#[0-9a-f]+"/gi) ?? [];

    colours.forEach(colour => expect(colour).toMatch(/#(000|fff)"/i));
  });

  it('keeps the original\'s wording out of its flavour text', () => {
    ['arteries', 'lifeblood', 'restaurant placemat', 'occult', 'drinking bird', 'dollar store', 'sketch comedy'].forEach((phrase) => {
      expect(fullText).not.toContain(phrase);
    });
  });
});
