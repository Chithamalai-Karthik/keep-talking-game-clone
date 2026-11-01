/* ============================================================
   main.js — Application Entry Point
   Sets up Three.js scene, bomb interaction (rotate bomb, not camera),
   pick-up/put-down states, and game orchestration
   ============================================================ */

import { SceneManager } from './three/SceneManager.js';
import { BombModel } from './three/BombModel.js';
import { RoomEnvironment } from './three/RoomEnvironment.js';
import { BombController, BOMB_STATE } from './three/BombController.js';
import { Raycaster } from './three/Raycaster.js';
import { MenuUI } from './ui/MenuUI.js';
import { DIFFICULTY, strikeSpeed } from './utils/constants.js';
import { createMenuParticles, displayTime, formatTime } from './utils/helpers.js';
import { BombState } from './game/BombState.js';
import { ModuleManager } from './game/ModuleManager.js';
import './game/PlaceholderModule.js'; // Register placeholder modules
import './game/WiresModule.js';
import './game/ButtonModule.js';
import './game/KeypadModule.js';

class App {
  constructor() {
    this.sceneManager = null;
    this.bombModel = null;
    this.room = null;
    this.bombController = null;
    this.raycaster = null;
    this.menuUI = null;
    this.moduleManager = null;

    // Game state
    this.isGameActive = false;
    this.currentDifficulty = null;
    this.bombState = null;
    this._hintTimeout = null;
    this._heldPart = null;           // { slotId, partId } while a module part is held down
    this._ignoreClick = false;       // The click that ends a hold is not a click on the bomb

    // Timer state (wall-clock based — runs even when tab is backgrounded)
    this._timerSpeed = 1.0;          // Speed multiplier (increases on strikes)
    this._lastDisplayedSecond = -1;  // Track which second is shown
    this._gameOver = false;
    this._timerStartedAt = 0;        // Date.now() when timer started
    this._elapsedBeforeSpeedChange = 0; // Accumulated time before last speed change
    this._speedChangeAt = 0;         // Date.now() when speed last changed

    this._init();
  }

  _init() {
    // --- MENU SETUP FIRST (so buttons always work) ---
    this.menuUI = new MenuUI();
    this.menuUI.onDifficultySelected((difficulty) => this._startGame(difficulty));

    // Create menu particles
    const particleContainer = document.getElementById('menu-particles');
    if (particleContainer) {
      createMenuParticles(particleContainer, 35);
    }

    // --- THREE.JS SETUP ---
    try {
      // Setup Three.js scene
      const container = document.getElementById('canvas-container');
      this.sceneManager = new SceneManager(container);

      // Create room environment
      this.room = new RoomEnvironment();
      this.sceneManager.add(this.room.getObject());

      // Create bomb model
      this.bombModel = new BombModel();
      this.sceneManager.add(this.bombModel.getObject());

      // Setup bomb controller
      this.bombController = new BombController(
        this.bombModel.getObject(),
        this.sceneManager.camera
      );

      // Setup raycaster
      this.raycaster = new Raycaster(
        this.sceneManager.camera,
        this.sceneManager.renderer.domElement
      );

      // --- EVENT LISTENERS ---

      // Mouse events for bomb rotation (delegated to BombController)
      const canvas = this.sceneManager.renderer.domElement;
      canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
      canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
      window.addEventListener('mouseup', (e) => this._onMouseUp(e));
      window.addEventListener('blur', () => this._releaseHeldPart());

      // The right button rotates and deselects, so it never opens the menu
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      // ESC to deselect + debug shortcuts
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this._deselect();

        // --- DEBUG SHORTCUTS (development only, active game only) ---
        if (import.meta.env.DEV) {
          if (!this.isGameActive || this._gameOver) return;
          if (e.key === 't' || e.key === 'T') {
            // Skip forward 30 seconds
            this._elapsedBeforeSpeedChange += 30;
            console.log('[DEBUG] Skipped 30s forward');
          }
          if (e.key === 'k' || e.key === 'K') {
            // Trigger a strike
            this._onStrike();
            console.log('[DEBUG] Triggered strike');
          }
          if (e.key === 'g' || e.key === 'G') {
            // Trigger explosion
            this._onGameOver(false);
            console.log('[DEBUG] Triggered explosion');
          }
          if (e.key === 'w' || e.key === 'W') {
            // Trigger win
            this.bombState.modules.forEach(m => m.solved = true);
            this._onGameOver(true);
            console.log('[DEBUG] Triggered win');
          }
        }
      });

      // --- RAYCASTER SETUP ---
      this.raycaster.setInteractiveObjects([this.bombModel.getObject()]);

      this.raycaster.onClick((object, point) => this._onBombClick(object, point));
      this.raycaster.onHover((object) => this._onBombHover(object));
      this.raycaster.onHoverLeave((object) => this._onBombHoverLeave(object));

      // --- INITIAL CAMERA POSITION (for menu cinematic orbit) ---
      this.sceneManager.camera.position.set(3, 3.5, 4);
      this.sceneManager.camera.lookAt(0, 0.5, 0);

      // Start render loop
      this.sceneManager.animate((delta, elapsed) => this._update(delta, elapsed));

      console.log('[KTANE] Game initialized — rotate the bomb, not the camera!');
    } catch (err) {
      console.error('[KTANE] Three.js initialization error:', err);
    }
  }

  /* ----------------------------------------------------------
     PER-FRAME UPDATE
  ---------------------------------------------------------- */
  _update(delta, elapsed) {
    // Update bomb controller
    this.bombController.update(delta);

    // Menu state: slow cinematic orbit of the CAMERA (only on menu)
    if (!this.isGameActive) {
      const orbitRadius = 5.5;
      const speed = 0.15;
      this.sceneManager.camera.position.x = Math.sin(elapsed * speed) * orbitRadius;
      this.sceneManager.camera.position.z = Math.cos(elapsed * speed) * orbitRadius;
      this.sceneManager.camera.position.y = 2.5 + Math.sin(elapsed * 0.2) * 0.2;
      this.sceneManager.camera.lookAt(0, 0.6, 0);
      return;
    }

    // --- Active game: countdown timer ---
    if (this.bombState && !this._gameOver) {
      this._updateTimer();
    }

    this.moduleManager?.update(delta, this.bombController.getFocusedSlotId());
  }

  /* ----------------------------------------------------------
     TIMER — Countdown logic
  ---------------------------------------------------------- */
  _updateTimer() {
    // Wall-clock elapsed time (accounts for speed changes)
    const now = Date.now();
    const elapsedSinceSpeedChange = (now - this._speedChangeAt) / 1000 * this._timerSpeed;
    const totalElapsed = this._elapsedBeforeSpeedChange + elapsedSinceSpeedChange;

    // Compute remaining time
    this.bombState.timeRemaining = this.bombState.timeLimit - totalElapsed;

    // Clamp to zero
    if (this.bombState.timeRemaining <= 0) {
      this.bombState.timeRemaining = 0;
      this._onTimerExpired();
      return;
    }

    // Only update the display when the visible second changes
    const currentSecond = Math.ceil(this.bombState.timeRemaining);
    if (currentSecond !== this._lastDisplayedSecond) {
      this._lastDisplayedSecond = currentSecond;

      this.bombModel.updateTimerDisplay(displayTime(currentSecond), currentSecond < 60);
    }
  }

  /**
   * Increase timer speed after a strike
   */
  _onStrike() {
    const exploded = this.bombState.addStrike();
    this.bombModel.setStrike(this.bombState.strikes - 1, true);

    // Snapshot elapsed time at current speed, then change speed
    const now = Date.now();
    const elapsedSinceSpeedChange = (now - this._speedChangeAt) / 1000 * this._timerSpeed;
    this._elapsedBeforeSpeedChange += elapsedSinceSpeedChange;
    this._speedChangeAt = now;

    // Accelerate timer for each strike
    this._timerSpeed = strikeSpeed(this.bombState.strikes);
    console.log(`[KTANE] STRIKE ${this.bombState.strikes}/${this.bombState.maxStrikes} — Timer speed: ${this._timerSpeed}x`);

    if (exploded) {
      this._onGameOver(false);
    }
  }

  /**
   * Timer hit zero
   */
  _onTimerExpired() {
    console.log('[KTANE] Timer expired — BOOM!');
    this.bombModel.updateTimerDisplay('0:00', true);
    this._onGameOver(false);
  }

  /**
   * Game over (win or lose)
   */
  _onGameOver(won) {
    this._gameOver = true;

    const overlay = document.getElementById('game-over-overlay');
    const title = document.getElementById('game-over-title');
    const subtitle = document.getElementById('game-over-subtitle');
    const statsContainer = document.getElementById('game-over-stats');

    // Set class for explosion vs defused styling
    overlay.className = 'game-over-overlay ' + (won ? 'defused' : 'explosion');
    overlay.style.display = '';

    // Title & subtitle
    title.textContent = won ? 'DEFUSED' : 'EXPLOSION';
    subtitle.textContent = won
      ? 'The bomb has been safely defused!'
      : 'The bomb detonated. Better luck next time.';

    // Stats
    const timeUsed = this.bombState.timeLimit - this.bombState.timeRemaining;
    const timeUsedText = formatTime(timeUsed);
    const solvedCount = this.bombState.modules.filter(m => m.solved).length;

    statsContainer.innerHTML = `
      <div class="game-over-stat">
        <span class="game-over-stat-label">TIME</span>
        <span class="game-over-stat-value">${timeUsedText}</span>
      </div>
      <div class="game-over-stat">
        <span class="game-over-stat-label">STRIKES</span>
        <span class="game-over-stat-value">${this.bombState.strikes}/${this.bombState.maxStrikes}</span>
      </div>
      <div class="game-over-stat">
        <span class="game-over-stat-label">MODULES</span>
        <span class="game-over-stat-value">${solvedCount}/${this.bombState.modules.length}</span>
      </div>
    `;

    // Screen shake on explosion
    if (!won) {
      const canvas = this.sceneManager.renderer.domElement;
      canvas.classList.add('screen-shake');
      setTimeout(() => canvas.classList.remove('screen-shake'), 500);
    }

    // Wire up buttons
    const playAgainBtn = document.getElementById('btn-play-again');
    const backMenuBtn = document.getElementById('btn-back-menu');

    // Remove old listeners by cloning
    const newPlayAgain = playAgainBtn.cloneNode(true);
    const newBackMenu = backMenuBtn.cloneNode(true);
    playAgainBtn.parentNode.replaceChild(newPlayAgain, playAgainBtn);
    backMenuBtn.parentNode.replaceChild(newBackMenu, backMenuBtn);

    newPlayAgain.addEventListener('click', () => {
      overlay.style.display = 'none';
      this._resetGame();
      this._startGame(this.currentDifficulty);
    });

    newBackMenu.addEventListener('click', () => {
      overlay.style.display = 'none';
      this._resetGame();
      this.menuUI.showMainMenu();
    });

    console.log(`[KTANE] ${won ? 'DEFUSED' : 'EXPLOSION'} — Time: ${timeUsedText}, Strikes: ${this.bombState.strikes}/${this.bombState.maxStrikes}`);
  }

  /**
   * Reset game state for replay
   */
  _resetGame() {
    this.isGameActive = false;
    this._gameOver = false;
    this.bombState = null;
    this._heldPart = null;
    this._ignoreClick = false;
    this._timerSpeed = 1.0;
    this._lastDisplayedSecond = -1;
    this._elapsedBeforeSpeedChange = 0;
    this._speedChangeAt = 0;
    this._timerStartedAt = 0;

    // Reset bomb position to table
    this.bombController.resetToTable();

    // Dispose modules
    if (this.moduleManager) {
      this.moduleManager.dispose();
      this.moduleManager = null;
    }

    // The game-over screen blocks the canvas, so hover never got to end
    this.bombModel.clearBomb();
    this.raycaster.clearHover();

    const canvas = this.sceneManager.renderer.domElement;
    canvas.style.cursor = 'default';
    canvas.classList.remove('screen-shake');
    this._hideHint();
  }

  /* ----------------------------------------------------------
     MODULE CALLBACKS
  ---------------------------------------------------------- */

  /**
   * Called when a module is solved
   */
  _onModuleSolve(slotId) {
    // Mark in bomb state
    const allSolved = this.bombState.solveModule(slotId);

    if (allSolved) {
      this._onGameOver(true);
    }
  }

  /**
   * Called when a module triggers a strike
   */
  _onModuleStrike(slotId) {
    this._onStrike();
  }

  /* ----------------------------------------------------------
     GAME START
  ---------------------------------------------------------- */
  _startGame(difficulty) {
    const config = DIFFICULTY[difficulty];
    if (!config) return;

    this.currentDifficulty = difficulty;
    this.isGameActive = true;

    // Generate randomized bomb state
    this.bombState = new BombState(config);
    console.log(`[KTANE] Starting game — ${config.label}`);
    console.log(`[KTANE] Bomb state:\n${this.bombState.toString()}`);

    // Switch to game screen
    this.menuUI.showGameScreen();

    // Set camera to the table overview position
    this.sceneManager.camera.position.set(0, 3.5, 3.5);
    this.sceneManager.camera.lookAt(0, 0.5, 0);

    // Place the timer, then mark active module slots based on bomb state
    this.bombModel.setTimerSlot(this.bombState.timerSlotId);
    const slots = this.bombModel.getSlots();
    const activeSlotIds = new Set(this.bombState.modules.map(m => m.slotId));
    for (const slot of slots) {
      this.bombModel.setSlotActive(slot.id, activeSlotIds.has(slot.id));
    }

    // Update timer display on bomb
    this.bombModel.updateTimerDisplay(formatTime(this.bombState.timeLimit));

    // Update bomb side panels with generated info
    this.bombModel.updateBombInfo(this.bombState);

    // Reset timer state (wall-clock)
    this._timerSpeed = 1.0;
    this._lastDisplayedSecond = -1;
    this._gameOver = false;
    this._timerStartedAt = Date.now();
    this._speedChangeAt = Date.now();
    this._elapsedBeforeSpeedChange = 0;

    // Reset strikes
    this.bombModel.setStrike(0, false);
    this.bombModel.setStrike(1, false);

    // Create module instances on the bomb face
    if (this.moduleManager) this.moduleManager.dispose();
    this.moduleManager = new ModuleManager(this.bombModel, this.bombState, {
      onSolve: (slotId) => this._onModuleSolve(slotId),
      onStrike: (slotId) => this._onModuleStrike(slotId),
    });
  }

  /* ----------------------------------------------------------
     MOUSE HANDLERS — Delegated to BombController
  ---------------------------------------------------------- */
  _onMouseDown(event) {
    if (this._gameOver) return;
    this._ignoreClick = false;
    if (this._pressModulePart(event)) return; // A held part must not drag the bomb
    this.bombController.onMouseDown(event);
  }

  /**
   * Press a part of the focused module, if the module holds parts
   * @returns {boolean} — true if a part is now held
   */
  _pressModulePart(event) {
    if (event.button !== 0 || this._heldPart || this.bombController.isAnimating()) return false;
    if (this.bombController.getState() !== BOMB_STATE.MODULE_FOCUSED) return false;

    const object = this.raycaster.pick(event);
    if (object?.userData.type !== 'modulePart') return false;

    const { slotId, partId } = object.userData;
    if (slotId !== this.bombController.getFocusedSlotId()) return false;
    if (!this.moduleManager.handlePartPress(slotId, partId)) return false;

    this._heldPart = { slotId, partId };
    return true;
  }

  /**
   * Let go of a held part, wherever the mouse is now
   */
  _releaseHeldPart() {
    if (!this._heldPart) return;

    const { slotId, partId } = this._heldPart;
    this._heldPart = null;
    this._ignoreClick = true;
    if (!this._gameOver) this.moduleManager.handlePartRelease(slotId, partId);
  }

  _onMouseMove(event) {
    if (this._gameOver) return;
    this.bombController.onMouseMove(event);
  }

  _onMouseUp(event) {
    if (event.button === 0) this._releaseHeldPart();
    if (this._gameOver) return;
    if (this.bombController.onMouseUp(event)) this._deselect();
  }

  /**
   * Step back one level: leave the focused module, or put the bomb down
   */
  _deselect() {
    if (!this.isGameActive || this._gameOver || this._heldPart) return;

    const state = this.bombController.getState();
    if (state === BOMB_STATE.MODULE_FOCUSED) {
      this._unfocusModule();
    } else if (state === BOMB_STATE.HELD) {
      this.bombController.putDown();
      this._hideHint();
    }
  }

  /* ----------------------------------------------------------
     CLICK HANDLER — Pick up bomb or click module slot
  ---------------------------------------------------------- */
  _onBombClick(object) {
    if (!this.isGameActive || this._gameOver || this._ignoreClick) return;
    if (this.bombController.isAnimating()) return;

    const state = this.bombController.getState();

    // STATE: Bomb on table → pick it up
    if (state === BOMB_STATE.ON_TABLE) {
      this.bombController.pickUp(() => {
        this._showHint();
      });
      return;
    }

    const slotId = this._findActiveSlotId(object);

    // STATE: Bomb held → first click only inspects the module: rotate bomb to face it
    if (state === BOMB_STATE.HELD) {
      if (slotId) this._focusModule(slotId);
      return;
    }

    // STATE: Module focused → clicking a part uses it, clicking another module selects that
    if (state === BOMB_STATE.MODULE_FOCUSED && slotId) {
      if (slotId !== this.bombController.getFocusedSlotId()) {
        this._focusModule(slotId);
      } else if (object.userData.type === 'modulePart') {
        this.moduleManager.handlePartClick(slotId, object.userData.partId);
        this.raycaster.refreshHover();
      }
    }
  }

  /**
   * Walk up from a clicked object to the active module slot holding it
   * @returns {string|null}
   */
  _findActiveSlotId(object) {
    const slotId = this._findSlotId(object);
    return slotId && this.bombModel.isSlotActive(slotId) ? slotId : null;
  }

  _findSlotId(object) {
    let current = object;
    while (current) {
      if (current.userData?.type === 'moduleSlot') return current.userData.slotId;
      current = current.parent;
    }
    return null;
  }

  _focusModule(slotId) {
    const face = slotId.startsWith('front') ? 'front' : 'back';
    console.log(`[KTANE] Clicked module: ${slotId} (${face} face)`);

    this.bombController.focusModule(face, slotId, () => {
      console.log(`[KTANE] Module ${slotId} focused`);
      this.raycaster.refreshHover();
    });
  }

  _unfocusModule() {
    this.bombController.unfocusModule(() => this.raycaster.refreshHover());
  }

  /* ----------------------------------------------------------
     HOVER HANDLERS — Highlight module slots and parts
  ---------------------------------------------------------- */
  _onBombHover(object) {
    if (!this.isGameActive || this._gameOver) return;
    const state = this.bombController.getState();
    const cursor = this.sceneManager.renderer.domElement.style;

    if (state === BOMB_STATE.ON_TABLE) {
      // Show outline glow + pointer cursor
      cursor.cursor = 'pointer';
      this.bombModel.showOutline();
      return;
    }

    const slotId = this._findActiveSlotId(object);

    if (state === BOMB_STATE.HELD) {
      cursor.cursor = slotId ? 'pointer' : 'default';
      if (slotId) this.bombModel.setSlotHighlight(slotId, true);
      return;
    }

    if (state === BOMB_STATE.MODULE_FOCUSED) {
      const focusedSlotId = this.bombController.getFocusedSlotId();
      const isOtherModule = slotId && slotId !== focusedSlotId;
      const isPart = object.userData.type === 'modulePart' && slotId === focusedSlotId;
      const clickable = isPart && this.moduleManager.setPartHover(slotId, object.userData.partId, true);
      cursor.cursor = clickable || isOtherModule ? 'pointer' : 'default';
      if (isOtherModule) this.bombModel.setSlotHighlight(slotId, true);
    }
  }

  _onBombHoverLeave(object) {
    if (!this.isGameActive) return;

    this.sceneManager.renderer.domElement.style.cursor = 'default';

    // Hide bomb outline
    this.bombModel.hideOutline();

    if (object.userData.type === 'modulePart') {
      this.moduleManager?.setPartHover(object.userData.slotId, object.userData.partId, false);
    }

    // Reset any highlighted module slot
    const slotId = this._findSlotId(object);
    if (slotId) this.bombModel.setSlotHighlight(slotId, false);
  }

  /* ----------------------------------------------------------
     GAME HINT — Show briefly after pick-up
  ---------------------------------------------------------- */
  _showHint() {
    const hint = document.getElementById('game-hint');
    if (hint) {
      hint.classList.add('visible');
      clearTimeout(this._hintTimeout);
      this._hintTimeout = setTimeout(() => {
        hint.classList.remove('visible');
      }, 4000);
    }
  }

  _hideHint() {
    const hint = document.getElementById('game-hint');
    if (hint) hint.classList.remove('visible');
    clearTimeout(this._hintTimeout);
  }
}

// --- Launch ---
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
