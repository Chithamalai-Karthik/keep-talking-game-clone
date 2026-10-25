/* ============================================================
   constants.js — Game Constants & Data
   Module rules, difficulty presets, word lists, symbol sets, etc.
   ============================================================ */

// Difficulty presets
export const DIFFICULTY = {
  easy:   { modules: 3,  time: 300, maxStrikes: 3, label: 'Easy' },
  medium: { modules: 6,  time: 240, maxStrikes: 3, label: 'Medium' },
  hard:   { modules: 9,  time: 180, maxStrikes: 2, label: 'Hard' },
  expert: { modules: 11, time: 180, maxStrikes: 1, label: 'Expert' },
};

// Module types
export const MODULE_TYPES = {
  WIRES: 'wires',
  BUTTON: 'button',
  KEYPADS: 'keypads',
  SIMON_SAYS: 'simon-says',
  WHOS_ON_FIRST: 'whos-on-first',
  MEMORY: 'memory',
  MORSE_CODE: 'morse-code',
  COMPLICATED_WIRES: 'complicated-wires',
  WIRE_SEQUENCES: 'wire-sequences',
  MAZES: 'mazes',
  PASSWORDS: 'passwords',
};

export const NEEDY_MODULE_TYPES = {
  VENTING_GAS: 'needy-venting-gas',
  CAPACITOR: 'needy-capacitor',
  KNOB: 'needy-knob',
};

// All standard module types in order
export const STANDARD_MODULES = Object.values(MODULE_TYPES);

// Module display names
export const MODULE_NAMES = {
  [MODULE_TYPES.WIRES]: 'Wires',
  [MODULE_TYPES.BUTTON]: 'The Button',
  [MODULE_TYPES.KEYPADS]: 'Keypads',
  [MODULE_TYPES.SIMON_SAYS]: 'Simon Says',
  [MODULE_TYPES.WHOS_ON_FIRST]: "Who's on First",
  [MODULE_TYPES.MEMORY]: 'Memory',
  [MODULE_TYPES.MORSE_CODE]: 'Morse Code',
  [MODULE_TYPES.COMPLICATED_WIRES]: 'Complicated Wires',
  [MODULE_TYPES.WIRE_SEQUENCES]: 'Wire Sequences',
  [MODULE_TYPES.MAZES]: 'Mazes',
  [MODULE_TYPES.PASSWORDS]: 'Passwords',
  [NEEDY_MODULE_TYPES.VENTING_GAS]: 'Venting Gas',
  [NEEDY_MODULE_TYPES.CAPACITOR]: 'Capacitor Discharge',
  [NEEDY_MODULE_TYPES.KNOB]: 'Knob',
};

// Wire colors
export const WIRE_COLORS = ['red', 'blue', 'yellow', 'white', 'black'];

// Button colors and labels
export const BUTTON_COLORS = ['red', 'blue', 'white', 'yellow'];
export const BUTTON_LABELS = ['Abort', 'Detonate', 'Hold', 'Press'];

// Indicator labels
export const INDICATOR_LABELS = [
  'SIG', 'FRK', 'CAR', 'IND', 'MSA',
  'NSA', 'TRN', 'CLR', 'BOB', 'FRQ',
];

// Port types
export const PORT_TYPES = [
  'DVI-D', 'Parallel', 'PS/2', 'RJ-45', 'Serial', 'Stereo RCA',
];

// Password word list (5-letter words)
export const PASSWORD_WORDS = [
  'ABOUT', 'AFTER', 'AGAIN', 'BELOW', 'COULD',
  'EVERY', 'FIRST', 'FOUND', 'GREAT', 'HOUSE',
  'LARGE', 'LEARN', 'NEVER', 'OTHER', 'PLACE',
  'PLANT', 'POINT', 'RIGHT', 'SMALL', 'SOUND',
  'SPELL', 'STILL', 'STUDY', 'THEIR', 'THERE',
  'THESE', 'THING', 'THINK', 'THREE', 'WATER',
  'WHERE', 'WHICH', 'WORLD', 'WOULD', 'WRITE',
];

// Timer acceleration after strikes
export const STRIKE_SPEED_MULTIPLIERS = [1.0, 1.25, 1.5];

// Game states
export const GAME_STATE = {
  MENU: 'menu',
  DIFFICULTY_SELECT: 'difficulty-select',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

// Screen IDs
export const SCREENS = {
  MENU: 'menu-screen',
  DIFFICULTY: 'difficulty-screen',
  GAME: 'game-screen',
};
