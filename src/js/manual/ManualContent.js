/* ============================================================
   ManualContent.js — Everything the Expert manual says
   Written for this project: the rules match the game, and the
   wording is our own. Tables come straight from the game's rule
   files, so the manual can't disagree with them. The written rules
   are checked against the game's code in tests/Manual.test.js.
   This file holds no live bomb data: the Expert learns only what
   the Defuser says aloud.
   ============================================================ */

import { CUT_LETTERS } from '../game/rules/WireSequencesRules.js';
import { KEYPAD_COLUMNS } from '../game/rules/KeypadRules.js';
import { KNOB_PATTERNS, LED_COLUMNS } from '../game/rules/KnobRules.js';
import { MAZES } from '../game/rules/MazeRules.js';
import { MEMORY_RULES } from '../game/rules/MemoryRules.js';
import { MORSE_CHART, MORSE_DIGITS, WORD_FREQUENCIES } from '../game/rules/MorseRules.js';
import { NO_VOWEL_MAP, SIMON_COLORS, VOWEL_MAP } from '../game/rules/SimonRules.js';
import { DISPLAY_POSITIONS, LABEL_LISTS } from '../game/rules/WhosOnFirstRules.js';
import { INDICATOR_LABELS, PASSWORD_WORDS, PORT_TYPES } from '../utils/constants.js';
import {
  BATTERY_DRAWINGS,
  drawButtonGrid,
  drawMaze,
  drawVenn,
  MODULE_DRAWINGS,
  PORT_DRAWINGS,
  VENN_ELLIPSES,
  vennKey,
} from './ManualDrawings.js';

const list = (items, tag = 'ul') => `<${tag}>${items.map(item => `<li>${item}</li>`).join('')}</${tag}>`;
const steps = items => list(items, 'ol');
const table = (head, rows) => (
  `<table><thead><tr>${head.map(cell => `<th>${cell}</th>`).join('')}</tr></thead>`
  + `<tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`
);
const capitalize = word => word[0].toUpperCase() + word.slice(1);

/* ----------------------------------------------------------
   WRITTEN RULES — Exported so tests can try them against the game
---------------------------------------------------------- */
export const WIRE_STEPS = {
  3: [
    'If no wire is red, cut the second wire.',
    'If the last wire is white, cut the last wire.',
    'If more than one wire is blue, cut the last blue wire.',
    'In any other case, cut the last wire.',
  ],
  4: [
    'If more than one wire is red and the serial number\'s last digit is odd, cut the last red wire.',
    'If the last wire is yellow and no wire is red, cut the first wire.',
    'If exactly one wire is blue, cut the first wire.',
    'If more than one wire is yellow, cut the last wire.',
    'In any other case, cut the second wire.',
  ],
  5: [
    'If the last wire is black and the serial number\'s last digit is odd, cut the fourth wire.',
    'If exactly one wire is red and more than one wire is yellow, cut the first wire.',
    'If no wire is black, cut the second wire.',
    'In any other case, cut the first wire.',
  ],
  6: [
    'If no wire is yellow and the serial number\'s last digit is odd, cut the third wire.',
    'If exactly one wire is yellow and more than one wire is white, cut the fourth wire.',
    'If no wire is red, cut the last wire.',
    'In any other case, cut the fourth wire.',
  ],
};

const HOLD = 'hold it down and go to "Releasing a held button".';
const TAP = 'press it and let go straight away.';

export const BUTTON_STEPS = [
  `If the button is blue and says "Abort", ${HOLD}`,
  `If the bomb has more than 1 battery and the button says "Detonate", ${TAP}`,
  `If the button is white and a lit indicator says CAR, ${HOLD}`,
  `If the bomb has more than 2 batteries and a lit indicator says FRK, ${TAP}`,
  `If the button is yellow, ${HOLD}`,
  `If the button is red and says "Hold", ${TAP}`,
  `In any other case, ${HOLD}`,
];

export const BUTTON_RELEASE = [
  'Blue strip: let go when the timer shows a 4 in any position.',
  'White strip: let go when the timer shows a 1 in any position.',
  'Yellow strip: let go when the timer shows a 5 in any position.',
  'Any other colour: let go when the timer shows a 1 in any position.',
];

const ORDINALS = ['first', 'second', 'third', 'fourth'];

/**
 * Put one line of the game's Memory table into words
 */
export function describeMemoryRule(display, rule) {
  const start = `If the display shows ${display},`;

  if ('position' in rule) return `${start} press the button in the ${ORDINALS[rule.position]} position.`;
  if ('label' in rule) return `${start} press the button labelled "${rule.label}".`;
  if ('samePositionAs' in rule) return `${start} press the button in the same position you pressed in stage ${rule.samePositionAs}.`;
  return `${start} press the button with the same label you pressed in stage ${rule.sameLabelAs}.`;
}

/* ----------------------------------------------------------
   TABLES AND DIAGRAMS — Built from the game's data
---------------------------------------------------------- */
const LETTER_MEANINGS = [
  ['C', 'Cut the wire.'],
  ['D', 'Do not cut the wire.'],
  ['S', 'Cut the wire if the serial number\'s last digit is even.'],
  ['P', 'Cut the wire if the bomb has a parallel port.'],
  ['B', 'Cut the wire if the bomb has two or more batteries.'],
];

const LINE_MEANINGS = [
  ['R', 'The wire has red on it.'],
  ['B', 'The wire has blue on it.'],
  ['S', 'The ★ is showing.'],
  ['L', 'The light is on.'],
];

function complicatedTables() {
  const lines = LINE_MEANINGS.map(([key, meaning]) => {
    const { dash, width } = VENN_ELLIPSES[key];
    return [vennKey(dash, width), meaning];
  });
  return `<div class="side-by-side">${table(['Line', 'Means'], lines)}${table(['Letter', 'What to do'], LETTER_MEANINGS)}</div>`;
}

function simonTable(map) {
  const head = ['', ...SIMON_COLORS.map(color => `${capitalize(color)} flash`)];
  const names = ['No strikes', '1 strike', '2 strikes'];
  return table(head, map.map((row, strikes) => [names[strikes], ...SIMON_COLORS.map(color => capitalize(row[color]))]));
}

function keypadColumns() {
  const columns = KEYPAD_COLUMNS.map((column, index) => (
    `<div class="keypad-column" aria-label="Column ${index + 1}">${column.map(symbol => `<img src="assets/keypad/${symbol}.png" alt="${symbol.replaceAll('_', ' ')}" />`).join('')}</div>`
  ));
  return `<div class="keypad-columns">${columns.join('')}</div>`;
}

function displayGrid() {
  const cells = Object.entries(DISPLAY_POSITIONS).map(([display, position]) => (
    `<div class="display-cell"><div class="display-word">${display || 'blank screen'}</div>${drawButtonGrid(position)}</div>`
  ));
  return `<div class="display-grid">${cells.join('')}</div>`;
}

function labelLists() {
  const rows = Object.entries(LABEL_LISTS).map(([label, words]) => [`<strong>${label}</strong>`, words.join(', ')]);
  return table(['Label', 'Push the first of these on a button'], rows);
}

function memoryStages() {
  return Object.entries(MEMORY_RULES).map(([stage, rules]) => (
    `<h4>Stage ${stage}</h4>${list(Object.entries(rules).map(([display, rule]) => describeMemoryRule(display, rule)))}`
  )).join('');
}

// Drawn with borders, not backgrounds: browsers leave backgrounds out when printing
const morseSymbols = code => [...code].map(mark => (mark === '.' ? '<i class="dot"></i>' : '<i class="dash"></i>')).join('');

function morseChart() {
  const chart = { ...MORSE_CHART, ...MORSE_DIGITS };
  const cells = Object.entries(chart)
    .sort(([a], [b]) => (/\d/.test(a) === /\d/.test(b) ? a.localeCompare(b) : /\d/.test(a) ? 1 : -1))
    .map(([symbol, code]) => `<div class="morse-cell"><strong>${symbol.toUpperCase()}</strong><span aria-label="${code}">${morseSymbols(code)}</span></div>`);
  return `<div class="morse-chart">${cells.join('')}</div>`;
}

function morseWords() {
  const rows = Object.entries(WORD_FREQUENCIES).map(([word, frequency]) => [word, `${(frequency / 1000).toFixed(3)} MHz`]);
  return table(['Word', 'Frequency'], rows);
}

const OCCURRENCES = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth'];

function letterList(letters) {
  const parts = [...letters];
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} or ${parts.at(-1)}`;
}

function sequenceTables() {
  const tables = Object.entries(CUT_LETTERS).map(([color, rows]) => (
    `<div><h4>${capitalize(color)} wires</h4>${table(['Seen', 'Cut if joined to'], rows.map((letters, i) => [OCCURRENCES[i], letterList(letters)]))}</div>`
  ));
  return `<div class="side-by-side">${tables.join('')}</div>`;
}

function mazeGrid() {
  return `<div class="maze-grid">${MAZES.map((maze, index) => drawMaze(maze, index + 1)).join('')}</div>`;
}

function passwordGrid() {
  return `<div class="word-grid">${PASSWORD_WORDS.map(word => `<span>${word.toLowerCase()}</span>`).join('')}</div>`;
}

function knobTables() {
  return Object.entries({ up: 'Up', down: 'Down', left: 'Left', right: 'Right' }).map(([key, name]) => {
    const patterns = KNOB_PATTERNS[key].map((pattern) => {
      const rows = pattern.map(row => `<tr>${Array.from({ length: LED_COLUMNS }, (_, i) => `<td>${row[i] === 'X' ? 'X' : ''}</td>`).join('')}</tr>`);
      return `<table class="lights"><tbody>${rows.join('')}</tbody></table>`;
    });
    return `<h4>${name} position</h4><div class="side-by-side">${patterns.join('')}</div>`;
  }).join('');
}

function indicatorTable() {
  return `<div class="word-grid indicators">${INDICATOR_LABELS.map(label => `<span>${label}</span>`).join('')}</div>`;
}

function portTable() {
  return table(['Port', 'Name'], PORT_TYPES.map(name => [PORT_DRAWINGS[name], name]));
}

/* ----------------------------------------------------------
   PAGES — In the order the Expert will want them
---------------------------------------------------------- */
// note: a handwritten line, shown only in the dossier style
const moduleHeader = (drawing, intro, note) => (
  `<div class="module-head">${drawing}<p class="intro">${intro}</p></div>${note ? `<p class="margin-note">${note}</p>` : ''}`
);

// flowsOn: when printed, the next page carries on on the same sheet
export const SECTIONS = [
  {
    id: 'welcome',
    flowsOn: true,
    title: 'Welcome',
    group: 'Start here',
    html: `
      <p>You are the Expert. Your partner is holding a live bomb, and you are the only one with these instructions.</p>
      <p>Read carefully and talk it through. One small mistake could end everything.</p>`,
  },
  {
    id: 'defusing-bombs',
    title: 'Defusing bombs',
    group: 'Start here',
    html: `
      <p>A bomb explodes when its timer reaches 0:00, or when it has taken too many strikes. To defuse it, disarm all of its modules before time runs out.</p>
      <h4>Modules</h4>
      <p>A bomb can hold up to 11 modules. Each one stands alone, and they can be disarmed in any order.</p>
      <p>Instructions are in Section 1. Needy modules work differently and are in Section 2.</p>
      <h4>Strikes</h4>
      <p>Each mistake by the Defuser records a strike, shown under the timer. The timer runs faster after every strike.</p>
      <p>On Easy and Medium the bomb explodes on the third strike, on Hard on the second, and on Expert on the first, with no room for error.</p>
      <h4>Gathering information</h4>
      <p>Some instructions need details about the bomb, such as its serial number. These are on the sides of the casing. Appendices A, B and C show how to identify them.</p>`,
  },
  {
    id: 'section-1',
    flowsOn: true,
    title: 'Section 1: Modules',
    group: 'Section 1: Modules',
    html: `
      <p>A module has a light in its top right corner. When that light turns green, the module is disarmed.</p>
      <p>Every module must be disarmed to defuse the bomb.</p>`,
  },
  {
    id: 'wires',
    title: 'Wires',
    group: 'Section 1: Modules',
    html: `
      ${moduleHeader(MODULE_DRAWINGS.wires, 'They look simple. That is exactly why people trust them too much.', 'Check the serial number first!')}
      ${list(['This module has 3 to 6 wires.', 'Only one wire is the right one to cut.', 'Count wires from the top.'])}
      <p>Find the wire count below, and use the first line that applies.</p>
      ${Object.entries(WIRE_STEPS).map(([count, lines]) => `<h4>${count} wires</h4>${steps(lines)}`).join('')}`,
  },
  {
    id: 'the-button',
    title: 'The Button',
    group: 'Section 1: Modules',
    html: `
      ${moduleHeader(MODULE_DRAWINGS.button, 'It tells you what to do in big friendly letters. Do not take its word for it.', 'Ask what the label says, then the colour.')}
      <p>See Appendix A for indicators and Appendix B for batteries.</p>
      <p>Go through these rules in order, and follow the first one that applies.</p>
      ${steps(BUTTON_STEPS)}
      <h4>Releasing a held button</h4>
      <p>While the button is held, a coloured strip lights up to its right. The colour says when to let go.</p>
      ${list(BUTTON_RELEASE)}`,
  },
  {
    id: 'keypads',
    title: 'Keypads',
    group: 'Section 1: Modules',
    html: `
      ${moduleHeader(MODULE_DRAWINGS.keypads, 'Nobody knows what these symbols mean. Describe them however you like.', 'Agree on a name for each shape.')}
      ${list(['Only one column below holds all four symbols on the keypad.', 'Press the four keys in the order their symbols appear in that column, top to bottom.'])}
      ${keypadColumns()}`,
  },
  {
    id: 'simon-says',
    title: 'Simon Says',
    group: 'Section 1: Modules',
    html: `
      ${moduleHeader(MODULE_DRAWINGS.simon, 'A children\'s memory game, rewired by someone who has never met a child.', 'Keep count of the strikes!')}
      ${steps([
        'One of the four coloured buttons flashes.',
        'Use the right table below to find which colour to press.',
        'That flash repeats, followed by another. Press the whole sequence in order, translating each flash through the table.',
        'The sequence grows by one each time you get it right, until the module is disarmed.',
      ])}
      <h4>If the serial number has a vowel</h4>
      ${simonTable(VOWEL_MAP)}
      <h4>If the serial number has no vowel</h4>
      ${simonTable(NO_VOWEL_MAP)}`,
  },
  {
    id: 'whos-on-first',
    title: 'Who\'s on First',
    group: 'Section 1: Modules',
    html: `
      ${moduleHeader(MODULE_DRAWINGS.whosOnFirst, 'Two people, one screen, and a lot of words that sound the same. Spell everything out.', 'Spell it. C is not SEE.')}
      ${steps([
        'Read the display, and use step 1 to find which button\'s label to read.',
        'Use that label in step 2 to find which button to push.',
        'Repeat until the module is disarmed.',
      ])}
      <h4>Step 1</h4>
      <p>Find what the display says. The marked square shows which button to read. Then go to step 2.</p>
      ${displayGrid()}
      <h4 class="new-sheet">Step 2</h4>
      <p>Find that label below. Going along its list, push the first word that is on a button.</p>
      ${labelLists()}`,
  },
  {
    id: 'memory',
    title: 'Memory',
    group: 'Section 1: Modules',
    html: `
      ${moduleHeader(MODULE_DRAWINGS.memory, 'Write things down. You will wish you had.', 'Pen and paper. Trust me.')}
      ${list([
        'Press the right button to move on to the next stage. Finish all five stages to disarm the module.',
        'A wrong press sends the module back to stage 1.',
        'Count button positions from the left.',
      ])}
      ${memoryStages()}`,
  },
  {
    id: 'morse-code',
    title: 'Morse Code',
    group: 'Section 1: Modules',
    html: `
      ${moduleHeader(MODULE_DRAWINGS.morse, 'Old technology, real Morse. Take it one letter at a time.', 'You may not need the whole word.')}
      ${list([
        'Read the flashing light with the chart below, to spell one of the words in the table.',
        'The word repeats, with a long gap between repeats.',
        'Once you know the word, set its frequency and press the TX button.',
      ])}
      <h4>How to read it</h4>
      ${steps(['A short flash is a dot.', 'A long flash is a dash.', 'A long gap separates letters.', 'A very long gap comes before the word repeats.'])}
      ${morseChart()}
      ${morseWords()}`,
  },
  {
    id: 'complicated-wires',
    title: 'Complicated Wires',
    group: 'Section 1: Modules',
    html: `
      ${moduleHeader(MODULE_DRAWINGS.complicatedWires, 'Stripes change everything. Take each wire on its own.', 'One wire at a time.')}
      ${list([
        'Each wire has a light above it and a space for a ★ below it.',
        'Use the diagram below on each wire in turn, to decide whether to cut it.',
        'A wire can be striped with more than one colour.',
      ])}
      ${drawVenn()}
      ${complicatedTables()}
      <p>See Appendix B for batteries and Appendix C for ports.</p>`,
  },
  {
    id: 'wire-sequences',
    title: 'Wire Sequences',
    group: 'Section 1: Modules',
    html: `
      ${moduleHeader(MODULE_DRAWINGS.wireSequences, 'Nine wires would have been fine. Someone chose this instead.', 'Keep a running count of each colour.')}
      <p>This module has several panels of wires, and shows one at a time. The down button moves to the next panel and the up button goes back to the previous one.</p>
      <p><strong>Do not move on until every wire that needs cutting on this panel is cut.</strong></p>
      <p>Use the tables below. Keep counting each colour across all the panels.</p>
      ${sequenceTables()}`,
  },
  {
    id: 'mazes',
    title: 'Mazes',
    group: 'Section 1: Modules',
    html: `
      ${moduleHeader(MODULE_DRAWINGS.mazes, 'It looks like the back of a kids\' menu, and it wants to kill you.', 'Go slowly. The walls are invisible.')}
      ${list([
        'Find the maze with the same two circles.',
        'Guide the white light to the red triangle with the arrow buttons.',
        '<strong>Warning:</strong> do not cross the lines shown in the maze. On the bomb they are invisible.',
      ])}
      ${mazeGrid()}`,
  },
  {
    id: 'passwords',
    flowsOn: true,
    title: 'Passwords',
    group: 'Section 1: Modules',
    html: `
      ${moduleHeader(MODULE_DRAWINGS.passwords, 'Five letters between you and the end. At least it isn\'t your bank password.', 'Get every letter of one column first.')}
      ${list([
        'The buttons above and below each letter step through the letters for that position.',
        'Only one combination of those letters spells a word below.',
        'Once that word is set, press the submit button.',
      ])}
      ${passwordGrid()}`,
  },
  {
    id: 'section-2',
    flowsOn: true,
    title: 'Section 2: Needy modules',
    group: 'Section 2: Needy modules',
    html: `
      <p>Needy modules can't be disarmed, and they keep coming back.</p>
      <p>A needy module has a small two-digit timer at the top centre. It can wake up at any time while the bomb is in play.</p>
      <p>Once awake, it must be dealt with before its timer runs out, or the bomb takes a strike.</p>
      <p>Stay alert: it can wake up again at any time.</p>`,
  },
  {
    id: 'venting-gas',
    flowsOn: true,
    title: 'Venting Gas',
    group: 'Section 2: Needy modules',
    html: `
      ${moduleHeader(MODULE_DRAWINGS.ventingGas, 'A computer with one question, asked over and over.')}
      <p>Answer the computer's questions by pressing Y for yes or N for no.</p>`,
  },
  {
    id: 'capacitor-discharge',
    flowsOn: true,
    title: 'Capacitor Discharge',
    group: 'Section 2: Needy modules',
    html: `
      ${moduleHeader(MODULE_DRAWINGS.capacitor, 'Nothing about this is good electronics. It just needs attention.')}
      <p>Hold the lever down to discharge the capacitor before it overloads.</p>`,
  },
  {
    id: 'knobs',
    title: 'Knobs',
    group: 'Section 2: Needy modules',
    html: `
      ${moduleHeader(MODULE_DRAWINGS.knob, 'Four positions, twelve lights, and no thanks at the end of it.')}
      ${list([
        'The knob can point in one of four directions.',
        'It must be in the right position when this module\'s timer reaches zero.',
        'The twelve lights say which position is right.',
        'Positions are read from the "UP" label, which may have been turned.',
      ])}
      <h4>Light patterns</h4>
      <p>X means the light is on.</p>
      ${knobTables()}`,
  },
  {
    id: 'appendix-a',
    flowsOn: true,
    title: 'Appendix A: Indicators',
    group: 'Appendices',
    html: `
      <p>Labelled indicator lights are on the sides of the bomb casing.</p>
      ${indicatorTable()}`,
  },
  {
    id: 'appendix-b',
    flowsOn: true,
    title: 'Appendix B: Batteries',
    group: 'Appendices',
    html: `
      <p>Batteries sit in holders on the sides of the bomb casing.</p>
      ${table(['Battery', 'Type'], Object.entries(BATTERY_DRAWINGS).map(([type, drawing]) => [drawing, type]))}`,
  },
  {
    id: 'appendix-c',
    title: 'Appendix C: Ports',
    group: 'Appendices',
    html: `
      <p>Digital and analog ports are on the sides of the bomb casing.</p>
      ${portTable()}`,
  },
];
