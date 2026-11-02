/* ============================================================
   VentingRules.js — Rules for the Venting Gas needy module
   The computer asks a question: yes to venting the gas, and no
   to detonating. Refusing to vent only earns a warning.
   ============================================================ */

import { randomChoice } from '../../utils/helpers.js';

export const VENT = 'VENT GAS?';
export const DETONATE = 'DETONATE?';

// Venting comes up far more often, so a detonate question catches people out
const PROMPTS = [VENT, VENT, VENT, DETONATE];

export class VentingRules {
  constructor() {
    this.prompt = VENT;
  }

  /**
   * Pick the question for this activation
   */
  ask(prompt = randomChoice(PROMPTS)) {
    this.prompt = prompt;
  }

  /**
   * @param {'y'|'n'} key
   * @returns {'done'|'warning'|'strike'}
   */
  answer(key) {
    if (this.prompt === VENT) return key === 'y' ? 'done' : 'warning';
    return key === 'n' ? 'done' : 'strike';
  }
}
