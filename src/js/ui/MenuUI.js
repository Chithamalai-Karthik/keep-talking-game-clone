/* ============================================================
   MenuUI.js — Main Menu & Screen Navigation
   Handles menu interactions, screen transitions, and difficulty selection
   ============================================================ */

import { SCREENS, GAME_STATE } from '../utils/constants.js';

export class MenuUI {
  constructor() {
    this.screens = {};
    this.currentScreen = null;

    // Callbacks
    this._onPlayCallback = null;
    this._onDifficultyCallback = null;
    this._onManualCallback = null;

    this._cacheElements();
    this._bindEvents();
  }

  _cacheElements() {
    // Screen elements
    this.screens = {
      [SCREENS.MENU]: document.getElementById(SCREENS.MENU),
      [SCREENS.DIFFICULTY]: document.getElementById(SCREENS.DIFFICULTY),
      [SCREENS.GAME]: document.getElementById(SCREENS.GAME),
    };

    // Menu buttons
    this.btnPlay = document.getElementById('btn-play');
    this.btnManual = document.getElementById('btn-manual');
    this.btnSettings = document.getElementById('btn-settings');
    this.btnHowToPlay = document.getElementById('btn-how-to-play');
    this.btnBackToMenu = document.getElementById('btn-back-to-menu');

    // Difficulty buttons
    this.difficultyBtns = document.querySelectorAll('.difficulty-btn');
  }

  _bindEvents() {
    // Play button → show difficulty selection
    this.btnPlay.addEventListener('click', () => {
      this.showScreen(SCREENS.DIFFICULTY);
    });

    // Manual button
    this.btnManual.addEventListener('click', () => {
      if (this._onManualCallback) this._onManualCallback();
    });

    // Back to menu
    this.btnBackToMenu.addEventListener('click', () => {
      this.showScreen(SCREENS.MENU);
    });

    // Difficulty buttons
    this.difficultyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const difficulty = btn.dataset.difficulty;
        if (this._onDifficultyCallback) {
          this._onDifficultyCallback(difficulty);
        }
      });
    });

    // Add hover sound effect class
    document.querySelectorAll('.menu-btn, .difficulty-btn, .back-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = btn.style.transform; // Trigger reflow for animation
      });
    });
  }

  /**
   * Show a specific screen, hide all others
   */
  showScreen(screenId) {
    Object.keys(this.screens).forEach(id => {
      const screen = this.screens[id];
      if (screen) {
        if (id === screenId) {
          screen.classList.add('active');
        } else {
          screen.classList.remove('active');
        }
      }
    });

    this.currentScreen = screenId;
  }

  /**
   * Register callback for when a difficulty is selected
   */
  onDifficultySelected(callback) {
    this._onDifficultyCallback = callback;
  }

  /**
   * Register callback for manual button
   */
  onManual(callback) {
    this._onManualCallback = callback;
  }

  /**
   * Get the current active screen
   */
  getCurrentScreen() {
    return this.currentScreen;
  }

  /**
   * Show the game screen (hide menu + difficulty)
   */
  showGameScreen() {
    this.showScreen(SCREENS.GAME);
  }

  /**
   * Return to main menu
   */
  showMainMenu() {
    this.showScreen(SCREENS.MENU);
  }
}
