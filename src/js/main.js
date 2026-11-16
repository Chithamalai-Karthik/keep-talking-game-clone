/* ============================================================
   main.js — Application Entry Point
   Sets up Three.js scene, bomb interaction (rotate bomb, not camera),
   pick-up/put-down states, and game orchestration
   ============================================================ */

import * as THREE from 'three';
import { SceneManager } from './three/SceneManager.js';
import { BombModel, BOMB_HALF_SIZE } from './three/BombModel.js';
import { createOffice, createBombRoom } from './three/Rooms.js';
import { DeskMenu, MENU_CAMERA } from './menu/DeskMenu.js';
import { VrMode } from './xr/VrMode.js';
import { BombController, BOMB_STATE } from './three/BombController.js';
import { Raycaster } from './three/Raycaster.js';
import { GameInput } from './input/GameInput.js';
import { MenuUI } from './ui/MenuUI.js';
import { Loader } from './ui/Loader.js';
import { DIFFICULTY, MODULE_NAMES, strikeSpeed } from './utils/constants.js';
import { displayTime, formatTime } from './utils/helpers.js';
import { playSound, unlockAudio, setEffectsVolume } from './audio/Sounds.js';
import { loadSettings, saveSettings, stepVolume } from './utils/settings.js';
import { cleanFreePlay } from './game/rules/FreePlayRules.js';
import { DeskClock } from './three/DeskClock.js';
import { BombState } from './game/BombState.js';
import { ModuleManager } from './game/ModuleManager.js';
import { AlarmClock } from './game/rules/AlarmClockRules.js';
import './game/PlaceholderModule.js'; // Register placeholder modules
import './game/WiresModule.js';
import './game/ButtonModule.js';
import './game/KeypadModule.js';
import './game/SimonModule.js';
import './game/WhosOnFirstModule.js';
import './game/MemoryModule.js';
import './game/MorseModule.js';
import './game/ComplicatedWiresModule.js';
import './game/WireSequencesModule.js';
import './game/MazeModule.js';
import './game/PasswordModule.js';
import './game/VentingModule.js';
import './game/CapacitorModule.js';
import './game/KnobModule.js';

const FADE_MS = 350;
const VR_CLOCK_DISTANCE = 3.6;   // Game units: about 45 cm from the eyes
const VR_REACH = 0.8;            // Game units: a hand within about 10 cm of something can grab it

// The bomb room's desk, in game units: where dropped things can land in VR
const BOMB_DESK = {
  top: 0.56,
  floor: -5,
  bombBounds: { minX: -4.2, maxX: 4.2, minZ: -2.3, maxZ: 2.3 },   // The bomb's centre, so it stays on the 1.4 x 0.8 m desk
  clockBounds: { minX: -5.2, maxX: 5.2, minZ: -2.9, maxZ: 2.9 },
};

/**
 * Fade the screen to black or back, for moving between rooms
 */
function fadeScreen(toBlack, instant = false) {
  const fade = document.getElementById('screen-fade');
  if (!fade) return Promise.resolve();
  fade.classList.toggle('instant', instant);
  fade.classList.toggle('black', toBlack);
  return new Promise(resolve => setTimeout(resolve, instant ? 0 : FADE_MS));
}

/**
 * Whether an object can be seen: it and everything above it are visible
 */
function isShown(object) {
  for (let node = object; node; node = node.parent) {
    if (!node.visible) return false;
  }
  return true;
}

class App {
  constructor() {
    this.sceneManager = null;
    this.bombModel = null;
    this.office = null;
    this.bombRoom = null;
    this.deskMenu = null;
    this.bombController = null;
    this.raycaster = null;
    this.menuUI = null;
    this.moduleManager = null;

    // Game state
    this.isGameActive = false;
    this.currentDifficulty = null;
    this.bombState = null;
    this.alarm = null;               // The desk clock's alarm, during a game
    this.deskClock = null;           // The clock itself, which can be picked up
    this._grabHand = null;           // VR: 'left' or 'right' while that hand grips the bomb
    this._clockHand = null;          // VR: the hand gripping the desk clock
    this._grabVelocity = null;       // VR: how the grabbed bomb is moving, for when it is let go
    this._lastGrabPosition = null;
    this._beamRaycaster = null;
    this.settings = loadSettings();
    this._gameOverToken = 0;         // Cancels a report still waiting to show
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

  async _init() {
    // The bomb and fuse in index.html cover the page until the scene is ready
    const loader = new Loader();
    window.addEventListener('pointerdown', unlockAudio);
    setEffectsVolume(this.settings.effectsVolume);

    // The title over the desk, and switching to the game screen
    this.menuUI = new MenuUI();

    // --- THREE.JS SETUP ---
    try {
      // The IWSDK world: renderer, scene, camera and render loop, ready for VR later
      const container = document.getElementById('canvas-container');
      this.sceneManager = await loader.track(SceneManager.create(container));

      // The office holds the menu; the bomb room is where the game is played
      this.office = createOffice();
      this.bombRoom = createBombRoom();
      for (const room of [this.office, this.bombRoom]) this.sceneManager.add(room.getObject());
      loader.track(this.office.load()).catch(err => console.error('[KTANE] Office failed to load:', err));
      loader.track(this.bombRoom.load())
        .then(() => {
          const clock = this.bombRoom.getObject().getObjectByName('br_clock_root');
          this.deskClock = new DeskClock(clock, this.sceneManager.camera);
          this.deskClock.setDropArea({ restY: BOMB_DESK.top, bounds: BOMB_DESK.clockBounds, floorY: BOMB_DESK.floor });
        })
        .catch(err => console.error('[KTANE] Bomb room failed to load:', err));
      this.bombRoom.setVisible(false);
      this.sceneManager.setLighting(this.office.lighting);

      // Create bomb model
      this.bombModel = new BombModel();
      this.sceneManager.add(this.bombModel.getObject());

      // Setup bomb controller
      this.bombController = new BombController(
        this.bombModel.getObject(),
        this.sceneManager.camera
      );
      this.bombController.setDropArea({
        bounds: BOMB_DESK.bombBounds, floorY: BOMB_DESK.floor, deskTop: BOMB_DESK.top, halfSize: BOMB_HALF_SIZE,
      });

      // Input: the mouse now, VR controllers later, as the same game actions
      const canvas = this.sceneManager.renderer.domElement;
      this.input = new GameInput(this.sceneManager.camera, canvas);
      this.input.attachXR(this.sceneManager.world);

      // The bomb's hover and clicks
      this.raycaster = new Raycaster(this.input, canvas);

      // Holding module parts, turning the bomb, stepping back, and the desk clock
      this.input.subscribe({
        press: (e) => this._onPress(e),
        release: () => this._releaseHeldPart(),
        rotateStart: () => {
          if (!this._gameOver && !this.deskMenu.isHolding() && !this.deskClock?.isHeld()) this.bombController.rotateStart();
        },
        rotate: ({ dx, dy }) => this.bombController.rotateBy(dx, dy),
        rotateEnd: () => this.bombController.rotateEnd(),
        back: () => this._deselect(),
        select: (e) => this._onClockClick(e),
        cancel: () => this._releaseHeldPart(),
        grab: (e) => this._grabBomb(e),
        drop: (e) => this._dropBomb(e),
      });

      // Debug shortcuts
      window.addEventListener('keydown', (e) => {
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
            this._onStrike('Test key');
            console.log('[DEBUG] Triggered strike');
          }
          if (e.key === 'a' || e.key === 'A') {
            // Ring the desk clock's alarm now
            this.alarm?.ringNow();
            console.log('[DEBUG] Rang the alarm clock');
          }
          if (e.key === 'n' || e.key === 'N') {
            // Wake every needy module now
            this.moduleManager.modules.forEach(module => module.activateNow?.());
            console.log('[DEBUG] Woke needy modules');
          }
          if (e.key === 'g' || e.key === 'G') {
            // Trigger explosion
            this._onGameOver(false, 'Test key');
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

      // --- THE MENU ON THE DESK ---
      this.bombModel.getObject().visible = false;
      this.deskMenu = new DeskMenu(this.sceneManager.scene, this.sceneManager.camera, this.input, canvas, {
        onStart: (difficulty) => this._enterBombRoom(difficulty),
        onManual: () => window.open(`${import.meta.env.BASE_URL}manual.html`, '_blank'),
        onRestart: () => this._restartBomb(),
        onRetry: () => this._restartBomb(),
        onLeave: () => this._backToOffice(),
        onVolume: (step) => this._changeVolume(step),
        getVolume: () => this.settings.effectsVolume,
        getFreePlay: () => cleanFreePlay(this.settings.freePlay),
        onFreePlayChange: (freePlay) => {
          this.settings.freePlay = freePlay;
          saveSettings(this.settings);
        },
        onLift: (lifted) => this.menuUI.setTitleHidden(lifted),
        onLeaveVR: () => this.vrMode.exit(),
        // In a game, the folder can be picked up only while the bomb is down on the desk
        canUse: () => !this.isGameActive || (!this._gameOver && !this.deskClock?.isHeld()
          && this.bombController.getState() === BOMB_STATE.ON_TABLE && !this.bombController.isAnimating()),
      });
      this.deskMenu.show(true);
      loader.track(this.deskMenu.load()).catch(err => console.error('[KTANE] Menu model failed to load:', err));

      // VR: the Enter VR button where it is supported, and the player's place in each room
      this.vrMode = new VrMode(this.sceneManager, {
        onEnter: () => this.deskMenu.setVR(true),
        onExit: () => this._afterVR(),
      });

      // Start render loop
      this.sceneManager.animate((delta, elapsed) => this._update(delta, elapsed));

      console.log('[KTANE] Game initialized — rotate the bomb, not the camera!');
    } catch (err) {
      console.error('[KTANE] Three.js initialization error:', err);
    }
    // Blast the loader away once everything it tracked has loaded (or failed)
    loader.finish();
  }

  /* ----------------------------------------------------------
     PER-FRAME UPDATE
  ---------------------------------------------------------- */
  _update(delta, elapsed) {
    // VR controllers become input actions; the desk menu glides the camera
    this.input.update(delta);
    this.deskMenu.update(delta);
    if (this.alarm && !this._gameOver) {
      const event = this.alarm.update(delta);
      if (event === 'start' || event === 'beep') playSound('alarm');
    }
    this.bombRoom.update(this.alarm?.displayOn ?? true);
    this.deskClock?.update(delta);
    this._followHand(delta);
    if (this.vrMode.active) this.vrMode.updateBeams((hand) => this.input.handRay(hand), (ray) => this._beamHit(ray));
    if (!this.isGameActive) return;

    this.bombController.update(delta);

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
      if (this._lastDisplayedSecond !== -1) playSound('tick');
      this._lastDisplayedSecond = currentSecond;

      this.bombModel.updateTimerDisplay(displayTime(currentSecond), currentSecond < 60);
    }
  }

  /**
   * Increase timer speed after a strike
   * @param {string} source - what gave the strike, named on the report if it sets the bomb off
   */
  _onStrike(source) {
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
      this._onGameOver(false, source);
    } else {
      playSound('strike');
    }
  }

  /**
   * Timer hit zero
   */
  _onTimerExpired() {
    console.log('[KTANE] Timer expired — BOOM!');
    this.bombModel.updateTimerDisplay('0:00', true);
    this._onGameOver(false, 'Time ran out');
  }

  /**
   * Game over (win or lose): a moment on the bomb, then black, then the report in the binder
   * @param {string|null} cause - why it exploded, for the report
   */
  _onGameOver(won, cause = null) {
    if (this._gameOver) return;
    this._gameOver = true;
    this.moduleManager?.stop();
    this.deskClock?.putDown();
    playSound(won ? 'defused' : 'explosion');

    const game = { level: this.currentDifficulty, won, timeRemaining: this.bombState.timeRemaining, cause };
    const token = ++this._gameOverToken;
    if (!won) fadeScreen(true, true); // An explosion goes black at once

    setTimeout(async () => {
      if (token !== this._gameOverToken) return;
      await fadeScreen(true);
      this._hideHint();
      this.bombModel.getObject().visible = false;
      this.bombRoom.setVisible(false);
      this.sceneManager.setLighting(this.office.lighting);
      this.deskMenu.showResults(game);
      await fadeScreen(false);
    }, won ? 1500 : 1800);

    console.log(`[KTANE] ${won ? 'DEFUSED' : 'EXPLOSION'}${cause ? ` (${cause})` : ''} — ${displayTime(this.bombState.timeRemaining)} left, strikes ${this.bombState.strikes}/${this.bombState.maxStrikes}`);
  }

  /**
   * VR: the grip takes what the hand is at, the bomb or the desk clock, whichever is nearer,
   * keeping how it sits in the hand. Only within reach: nothing is grabbed from afar.
   */
  _grabBomb({ source }) {
    if (!this.isGameActive || this._gameOver || !this.vrMode.active) return;
    if (this._grabHand === source || this._clockHand === source || this.deskMenu.isHolding()) return;
    const grip = this.sceneManager.world.player.gripSpaces?.[source];
    if (!grip) return;
    const hand = grip.getWorldPosition(new THREE.Vector3());

    const bombGap = this._grabHand || !this.bombModel.getObject().visible ? Infinity : this._gapToBomb(hand);
    const clockGap = this._clockHand || !this.deskClock ? Infinity : this.deskClock.gapTo(hand);
    if (Math.min(bombGap, clockGap) > VR_REACH) return;

    if (clockGap < bombGap) {
      if (this.deskClock.grab(grip)) this._clockHand = source;
      return;
    }
    if (!this.bombController.grab()) return;

    const bomb = this.bombModel.getObject();
    grip.updateWorldMatrix(true, false);
    bomb.updateWorldMatrix(true, false);
    this._grabOffset = new THREE.Matrix4().copy(grip.matrixWorld).invert().multiply(bomb.matrixWorld);
    this._grabHand = source;
    this._grabVelocity = new THREE.Vector3();
    this._lastGrabPosition = bomb.position.clone();
    this.bombModel.hideOutline();
    playSound('release');
  }

  // How far a point is from the bomb's case, in game units: 0 when touching or inside it
  _gapToBomb(point) {
    const local = this.bombModel.getObject().worldToLocal(point.clone());
    const h = BOMB_HALF_SIZE;
    return Math.hypot(
      Math.max(Math.abs(local.x) - h.x, 0),
      Math.max(Math.abs(local.y) - h.y, 0),
      Math.max(Math.abs(local.z) - h.z, 0)
    );
  }

  /**
   * VR: letting go of the grip drops what that hand holds
   */
  _dropBomb({ source }) {
    if (source === this._clockHand) {
      this._clockHand = null;
      this.deskClock?.release();
    }
    if (source !== this._grabHand) return;
    this._grabHand = null;
    this._releaseHeldPart();
    this.bombController.release(this._grabVelocity ?? new THREE.Vector3());
  }

  // The grabbed bomb follows its hand, keeping the pose it was grabbed in
  _followHand(delta) {
    if (!this._grabHand) return;
    const grip = this.sceneManager.world.player.gripSpaces?.[this._grabHand];
    if (!grip) return;
    grip.updateWorldMatrix(true, false);
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    new THREE.Matrix4().multiplyMatrices(grip.matrixWorld, this._grabOffset)
      .decompose(position, quaternion, new THREE.Vector3());
    this.bombController.holdAt(position, quaternion);
    if (delta > 0) {
      const moved = position.clone().sub(this._lastGrabPosition).divideScalar(delta);
      this._grabVelocity.lerp(moved, 0.5);
    }
    this._lastGrabPosition.copy(position);
  }

  // How far a VR beam goes before it meets something that can be seen, in game units
  _beamHit(ray) {
    this._beamRaycaster ??= new THREE.Raycaster();
    this._beamRaycaster.ray.copy(ray);
    const targets = [this.bombModel.getObject(), this.deskMenu.group, this.office.getObject(), this.bombRoom.getObject()];
    if (this.deskClock && this.deskClock.root.parent?.isScene) targets.push(this.deskClock.root);
    for (const hit of this._beamRaycaster.intersectObjects(targets, true)) {
      if (isShown(hit.object)) return hit.distance;
    }
    return null;
  }

  /**
   * The desk clock: pick it up (putting the bomb down first), or press snooze while it is held
   */
  _onClockClick({ ray }) {
    const clock = this.deskClock;
    if (!clock || !this.isGameActive || this._gameOver || this.deskMenu.isHolding() || clock.isMoving()) return;
    // VR: the trigger on the snooze bar presses it, whether the clock is on the desk or in a hand
    if (this.vrMode.active) {
      if (clock.isSnoozeAt(ray)) {
        clock.pressSnooze();
        this.alarm?.snooze();
        playSound('press');
      }
      return;
    }
    if (clock.isHeld()) {
      if (clock.isSnoozeAt(ray)) {
        clock.pressSnooze();
        this.alarm?.snooze();
        playSound('press');
      } else if (!clock.isAt(ray)) {
        clock.putDown(); // A click on the bomb, or anywhere off the clock, puts it down
      }
      return;
    }
    if (!clock.isAt(ray) || this.bombController.isAnimating() || this._heldPart) return;
    const state = this.bombController.getState();
    if (state === BOMB_STATE.HELD || state === BOMB_STATE.MODULE_FOCUSED) {
      this.bombController.putDown();
      this._hideHint();
    }
    this.raycaster.clearHover();
    this.bombModel.hideOutline();
    // On screen the clock comes to the table view the camera is heading to; in VR, to the player's eyes
    const { cameraTablePosition, cameraTableLookAt } = this.bombController;
    clock.pickUp(this.vrMode.active
      ? { ...this.vrMode.headView(this.sceneManager.camera), distance: VR_CLOCK_DISTANCE }
      : { position: cameraTablePosition, lookAt: cameraTableLookAt });
  }

  /**
   * Back from VR to the screen: put the camera where this moment of the game wants it
   */
  _afterVR() {
    if (this._grabHand) this._dropBomb({ source: this._grabHand });
    if (this._clockHand) this._dropBomb({ source: this._clockHand });
    const camera = this.sceneManager.camera;
    if (!this.isGameActive) {
      camera.position.copy(MENU_CAMERA.position);
      camera.lookAt(MENU_CAMERA.lookAt);
    } else {
      const state = this.bombController.getState();
      const held = state === BOMB_STATE.HELD || state === BOMB_STATE.MODULE_FOCUSED;
      const c = this.bombController;
      camera.position.copy(held ? c.cameraHeldPosition : c.cameraTablePosition);
      camera.lookAt(held ? c.cameraHeldLookAt : c.cameraTableLookAt);
    }
    this.deskMenu.setVR(false);
  }

  /**
   * Options: the sound effect volume, kept for next time
   */
  _changeVolume(step) {
    this.settings.effectsVolume = stepVolume(this.settings.effectsVolume, step);
    setEffectsVolume(this.settings.effectsVolume);
    saveSettings(this.settings);
    return this.settings.effectsVolume;
  }

  /**
   * A new bomb of the same level, in the bomb room
   */
  async _restartBomb() {
    await fadeScreen(true);
    this._resetGame();
    this._showBombRoom();
    this._startGame(this.currentDifficulty);
    await fadeScreen(false);
  }

  _showBombRoom() {
    this.vrMode.setRoom('bomb');
    this.office.setVisible(false);
    this.bombRoom.setVisible(true);
    this.sceneManager.setLighting(this.bombRoom.lighting);
  }

  /**
   * Leave the bomb room (or the report) for the office and its desk menu
   */
  async _backToOffice() {
    await fadeScreen(true);
    this._resetGame();
    this.bombModel.getObject().visible = false;
    this.bombRoom.setVisible(false);
    this.office.setVisible(true);
    this.vrMode.setRoom('office');
    this.sceneManager.setLighting(this.office.lighting);
    this.menuUI.showMainMenu();
    this.deskMenu.show(true);
    await fadeScreen(false);
  }

  /**
   * Reset game state for replay
   */
  _resetGame() {
    this.isGameActive = false;
    this._gameOver = false;
    this.bombState = null;
    this.alarm = null;
    this._grabHand = null;
    this._clockHand = null;
    this._gameOverToken++;
    this.deskClock?.reset();
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
    } else {
      playSound('solve');
    }
  }

  /**
   * Called when a module triggers a strike
   */
  _onModuleStrike(slotId) {
    const module = this.bombState.modules.find(m => m.slotId === slotId);
    this._onStrike(MODULE_NAMES[module?.type] ?? 'A module');
  }

  /* ----------------------------------------------------------
     GAME START
  ---------------------------------------------------------- */

  /**
   * From the office to the bomb room: fade out, swap rooms, start, fade in
   */
  async _enterBombRoom(difficulty) {
    await fadeScreen(true);
    this._showBombRoom();
    this._startGame(difficulty);
    await fadeScreen(false);
  }

  /**
   * @param {string|object} difficulty - a preset's name, or a Free Play config shaped like one
   */
  _startGame(difficulty) {
    const config = typeof difficulty === 'string' ? DIFFICULTY[difficulty] : difficulty;
    if (!config) return;

    this.currentDifficulty = difficulty;
    this.isGameActive = true;

    // Generate randomized bomb state
    this.bombState = new BombState(config);
    console.log(`[KTANE] Starting game — ${config.label}`);
    console.log(`[KTANE] Bomb state:\n${this.bombState.toString()}`);

    // Switch to game screen, with the bomb on the desk
    this.menuUI.showGameScreen();
    this.bombModel.getObject().visible = true;

    // Look down at the bomb on the desk
    const { cameraTablePosition, cameraTableLookAt } = this.bombController;
    this.deskMenu.moveCamera(cameraTablePosition, cameraTableLookAt, true);

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

    // The Menu folder on the bomb room's desk, and its clock's alarm
    this.deskMenu.showInGame();
    this.alarm = new AlarmClock();
  }

  /* ----------------------------------------------------------
     MOUSE HANDLERS — Delegated to BombController
  ---------------------------------------------------------- */
  /**
   * The primary button went down (left button or trigger): maybe on a part to hold
   */
  _onPress({ ray }) {
    if (this._gameOver || this.deskMenu.isHolding() || this.deskClock?.isHeld()) return;
    this._ignoreClick = false;
    this._pressModulePart(ray);
  }

  /**
   * Press a part of the focused module, if the module holds parts
   * @returns {boolean} — true if a part is now held
   */
  _pressModulePart(ray) {
    if (this._heldPart || this.bombController.isAnimating()) return false;
    const state = this.bombController.getState();
    const grabbed = state === BOMB_STATE.GRABBED;
    if (state !== BOMB_STATE.MODULE_FOCUSED && !grabbed) return false;

    const object = this.raycaster.pick(ray);
    if (object?.userData.type !== 'modulePart') return false;

    const { slotId, partId } = object.userData;
    // With the bomb in a VR hand, any module's parts work; on screen only the focused one's
    if (!grabbed && slotId !== this.bombController.getFocusedSlotId()) return false;
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

  /**
   * Step back one level: leave the focused module, or put the bomb down
   */
  _deselect() {
    if (!this.isGameActive || this._gameOver || this._heldPart || this.deskMenu.isHolding()) return;
    if (this.deskClock?.isHeld()) {
      this.deskClock.putDown();
      return;
    }

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
    if (!this.isGameActive || this._gameOver || this._ignoreClick || this.deskMenu.isHolding()) return;
    if (this.deskClock?.isHeld()) return; // The held clock handles every click
    if (this.bombController.isAnimating()) return;

    const state = this.bombController.getState();

    // STATE: Bomb in a VR hand → a part is used straight away
    if (state === BOMB_STATE.GRABBED) {
      const grabbedSlot = this._findActiveSlotId(object);
      if (grabbedSlot && object.userData.type === 'modulePart') {
        this.moduleManager.handlePartClick(grabbedSlot, object.userData.partId);
        this.raycaster.refreshHover();
      }
      return;
    }

    // STATE: Bomb on table → pick it up (in VR it is grabbed with the grip instead)
    if (state === BOMB_STATE.ON_TABLE) {
      if (this.vrMode.active) return;
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
    if (!this.isGameActive || this._gameOver || this.deskMenu.isHolding() || this.deskClock?.isHeld()) return;
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

    if (state === BOMB_STATE.GRABBED) {
      const isPart = slotId && object.userData.type === 'modulePart';
      if (isPart) this.moduleManager.setPartHover(slotId, object.userData.partId, true);
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
