/* ============================================================
   BombState.js — Randomized Bomb Configuration Generator
   Generates serial number, batteries, indicators, ports,
   and assigns modules to slots based on difficulty.
   ============================================================ */

// All possible indicator labels (from the original game)
const INDICATOR_LABELS = [
  'SND', 'CLR', 'CAR', 'IND', 'FRQ',
  'SIG', 'NSA', 'MSA', 'TRN', 'BOB', 'FRK'
];

// All possible port types
const PORT_TYPES = [
  'DVI-D', 'Parallel', 'PS/2', 'RJ-45', 'Serial', 'Stereo RCA'
];

// Available module types (will grow as we implement more)
const MODULE_POOL = [
  'wires',
  'button',
  'keypads',
  'simon_says',
];

export class BombState {
  /**
   * Generate a randomized bomb configuration
   * @param {Object} config - Difficulty config { modules, time, maxStrikes }
   */
  constructor(config) {
    this.serial = this._generateSerial();
    this.batteries = this._generateBatteries();
    this.indicators = this._generateIndicators();
    this.ports = this._generatePorts();

    // Game rules
    this.timeLimit = config.time;
    this.maxStrikes = config.maxStrikes;
    this.strikes = 0;
    this.timeRemaining = config.time;

    // Module assignment
    this.modules = this._assignModules(config.modules);

    // Derived properties (used by module rules)
    this.serialLastDigitOdd = this._isSerialLastDigitOdd();
    this.serialHasVowel = this._serialHasVowel();
  }

  /* ----------------------------------------------------------
     SERIAL NUMBER — 6 characters: 2 letters + 4 digits, shuffled
     Last character is always a digit (important for rules)
  ---------------------------------------------------------- */
  _generateSerial() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';

    // Build: 2 random letters + 3 random digits + 1 final digit
    const chars = [];

    // 2 letters
    for (let i = 0; i < 2; i++) {
      chars.push(letters[Math.floor(Math.random() * letters.length)]);
    }
    // 3 digits
    for (let i = 0; i < 3; i++) {
      chars.push(digits[Math.floor(Math.random() * digits.length)]);
    }

    // Shuffle the first 5 characters
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    // Last character is always a digit (affects many rules)
    const lastDigit = digits[Math.floor(Math.random() * digits.length)];
    chars.push(lastDigit);

    return chars.join('');
  }

  /* ----------------------------------------------------------
     BATTERIES — 0 to 2 (AA style, in holders on the side)
  ---------------------------------------------------------- */
  _generateBatteries() {
    return Math.floor(Math.random() * 3); // 0, 1, or 2
  }

  /* ----------------------------------------------------------
     INDICATORS — 0 to 3 random labels, each lit or unlit
  ---------------------------------------------------------- */
  _generateIndicators() {
    const count = Math.floor(Math.random() * 4); // 0–3
    const shuffled = [...INDICATOR_LABELS].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, count);

    return picked.map(label => ({
      label,
      lit: Math.random() > 0.5,
    }));
  }

  /* ----------------------------------------------------------
     PORTS — 0 to 3 random port types
  ---------------------------------------------------------- */
  _generatePorts() {
    const count = Math.floor(Math.random() * 4); // 0–3
    const shuffled = [...PORT_TYPES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /* ----------------------------------------------------------
     MODULE ASSIGNMENT — Pick N modules, assign to slot IDs
  ---------------------------------------------------------- */
  _assignModules(moduleCount) {
    const modules = [];
    const availableTypes = [...MODULE_POOL];

    // Front face slots: front-0 through front-5
    // Back face slots: back-0 through back-4 (back-5 is timer)
    const slotIds = [
      'front-0', 'front-1', 'front-2',
      'front-3', 'front-4', 'front-5',
      'back-0', 'back-1', 'back-2',
      'back-3', 'back-4',
    ];

    for (let i = 0; i < moduleCount && i < slotIds.length; i++) {
      // Pick a random module type (allow repeats for larger counts)
      const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];

      modules.push({
        slotId: slotIds[i],
        type: type,
        solved: false,
      });
    }

    return modules;
  }

  /* ----------------------------------------------------------
     DERIVED PROPERTIES — Used by module rule logic
  ---------------------------------------------------------- */
  _isSerialLastDigitOdd() {
    const lastChar = this.serial[this.serial.length - 1];
    const num = parseInt(lastChar, 10);
    return !isNaN(num) && num % 2 !== 0;
  }

  _serialHasVowel() {
    const vowels = 'AEIOU';
    return [...this.serial].some(ch => vowels.includes(ch));
  }

  /* ----------------------------------------------------------
     PUBLIC HELPERS
  ---------------------------------------------------------- */

  /**
   * Check if a specific indicator is present and lit
   */
  hasLitIndicator(label) {
    return this.indicators.some(ind => ind.label === label && ind.lit);
  }

  /**
   * Check if a specific indicator is present (lit or unlit)
   */
  hasIndicator(label) {
    return this.indicators.some(ind => ind.label === label);
  }

  /**
   * Check if the bomb has a specific port type
   */
  hasPort(portType) {
    return this.ports.includes(portType);
  }

  /**
   * Record a strike. Returns true if bomb exploded.
   */
  addStrike() {
    this.strikes++;
    return this.strikes >= this.maxStrikes;
  }

  /**
   * Mark a module as solved. Returns true if all modules are solved.
   */
  solveModule(slotId) {
    const mod = this.modules.find(m => m.slotId === slotId);
    if (mod) mod.solved = true;
    return this.modules.every(m => m.solved);
  }

  /**
   * Get a summary string for debug logging
   */
  toString() {
    return [
      `Serial: ${this.serial}`,
      `Batteries: ${this.batteries}`,
      `Indicators: ${this.indicators.map(i => `${i.label}(${i.lit ? 'lit' : 'unlit'})`).join(', ') || 'none'}`,
      `Ports: ${this.ports.join(', ') || 'none'}`,
      `Modules: ${this.modules.map(m => `${m.slotId}→${m.type}`).join(', ')}`,
      `Time: ${this.timeLimit}s | Strikes: ${this.strikes}/${this.maxStrikes}`,
    ].join('\n');
  }
}
