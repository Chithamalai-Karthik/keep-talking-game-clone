/* ============================================================
   NeedyModule.js — Base class for needy modules
   A needy module can't be solved. It wakes now and then, shows a
   red countdown, and strikes if that ends before it is tended.

   Subclasses provide, in setup() before super.setup():
     needyDuration       — seconds to tend it once active
     modelName, moduleName, rules
   and may override:
     buildBody(body)     — prepare the loaded model
     onActivate()        — it just woke
     onRest()            — it just went back to waiting
     onExpire()          — the countdown ended; strikes unless overridden
     tick(delta)         — runs every frame until the game ends
   Call this.tended() once the Defuser has dealt with it.
   ============================================================ */

import { ModuleBase } from './ModuleBase.js';
import { NeedyTimer } from './rules/NeedyTimer.js';
import { playSound } from '../audio/Sounds.js';
import { createTextLabel, disposeTextLabel } from '../three/TextLabel.js';

const TIMER_Y = 0.29;
const TIMER_Z = 0.0865; // Just above the timer's screen
const TIMER_WIDTH = 0.16;
const TIMER_HEIGHT = 0.085;
const TIMER_STYLE = { color: '#ff2a1f', font: 'bold 250px monospace' };

export class NeedyModule extends ModuleBase {
  setup() {
    this.housingName = 'needy_housing';
    this.timer = new NeedyTimer(this.needyDuration);

    this._ready = false;
    this._stopped = false;
    this._timerText = null;
    this._shownSeconds = null;
  }

  build(body) {
    this.buildBody(body);
    this._ready = true;
    this.onRest();
  }

  buildBody(body) {}

  onActivate() {}

  onRest() {}

  onExpire() {
    this.strike();
  }

  tick(delta) {}

  get isActive() {
    return this.timer.active;
  }

  update(delta) {
    if (!this._ready || this._stopped) return;

    this.tick(delta);

    const event = this.timer.update(delta);
    if (event === 'activated') this._wake();
    if (event === 'expired') {
      this.onExpire();
      this.onRest();
    }

    this._showTimer();
  }

  stop() {
    this._stopped = true;
  }

  /**
   * Wake now, for the development test key
   */
  activateNow() {
    if (!this._ready || this.isActive) return;

    this.timer.activate();
    this._wake();
    this._showTimer();
  }

  /**
   * The Defuser has dealt with it, so it goes back to waiting
   */
  tended() {
    this.timer.rest();
    this.onRest();
    this._showTimer();
  }

  dispose() {
    this._clearTimerText();
    super.dispose();
  }

  _wake() {
    playSound('needy');
    this.onActivate();
  }

  _showTimer() {
    const seconds = this.timer.display;
    if (seconds === this._shownSeconds) return;

    this._shownSeconds = seconds;
    this._clearTimerText();
    if (seconds === null) return;

    const digits = String(seconds).padStart(2, '0');
    this._timerText = createTextLabel(digits, TIMER_WIDTH, TIMER_HEIGHT, TIMER_STYLE);
    this._timerText.position.set(0, TIMER_Y, TIMER_Z);
    this.root.add(this._timerText);
  }

  _clearTimerText() {
    if (this._timerText) disposeTextLabel(this._timerText);
    this._timerText = null;
  }
}
