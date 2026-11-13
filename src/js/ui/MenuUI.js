/* ============================================================
   MenuUI.js — Switching between the menu and the game screen
   The menu itself is on the desk (menu/DeskMenu.js); the menu
   screen only holds the title shown over it in the browser.
   ============================================================ */

import { SCREENS } from '../utils/constants.js';

export class MenuUI {
  constructor() {
    this.screens = {
      [SCREENS.MENU]: document.getElementById(SCREENS.MENU),
      [SCREENS.GAME]: document.getElementById(SCREENS.GAME),
    };
    this.currentScreen = SCREENS.MENU;
  }

  /**
   * Show one screen and hide the other
   */
  showScreen(screenId) {
    for (const [id, screen] of Object.entries(this.screens)) {
      screen?.classList.toggle('active', id === screenId);
    }
    this.currentScreen = screenId;
  }

  /**
   * Hide the title while the binder or folder is held up to read
   */
  setTitleHidden(hidden) {
    this.screens[SCREENS.MENU]?.classList.toggle('title-hidden', hidden);
  }

  getCurrentScreen() {
    return this.currentScreen;
  }

  showGameScreen() {
    this.showScreen(SCREENS.GAME);
  }

  showMainMenu() {
    this.showScreen(SCREENS.MENU);
  }
}
