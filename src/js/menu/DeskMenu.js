/* ============================================================
   DeskMenu.js — The menu on the desk
   The Bombs binder and the Menu folder lie on the front desk.
   Hover lights them up; a click lifts one in front of the camera
   and opens it. Its pages are canvases drawn by MenuPages.js,
   and a click on a page is matched to that page's regions.
   ============================================================ */

import * as THREE from 'three';
import { loadModel } from '../three/ModelLoader.js';
import { placeInRoom, ROOM_SCALE } from '../three/Rooms.js';
import { playSound } from '../audio/Sounds.js';
import * as Pages from './MenuPages.js';
import { adjustFreePlay, freePlayConfig, DEFAULT_FREE_PLAY } from '../game/rules/FreePlayRules.js';

// Where the camera sits while the menu is on the desk
export const MENU_CAMERA = {
  position: new THREE.Vector3(0, 4.8, 6.8),
  lookAt: new THREE.Vector3(0, 0.8, -2.8),
};

const PAGE_WIDTH_PX = 900;
const OPEN_ANGLE = Math.PI * 0.97;   // A little short of flat, like a real binder
const MOVE_TIME = 0.6;               // Seconds to lift and open, or close and put down
const CAMERA_TIME = 0.8;
const OUTLINE_COLOR = 0xf2c230;

// Each prop: the room it is in, its pages, and how far from the camera it is held.
// The bomb room's folder is a copy of the office one, placed by `desk` (room metres).
const PROPS = {
  binder: {
    rooms: ['office', 'results'],  // Also the report after a game
    root: 'menu_binder',
    hinge: 'menu_binder_hinge',
    distance: 4.7,
    pages: {
      cover: { mesh: 'menu_binder_cover_art', draw: (p) => Pages.drawBinderCover(p.ctx, p.w, p.h) },
      inside: { mesh: 'menu_binder_page_left', draw: (p) => Pages.drawBinderInside(p.ctx, p.w, p.h) },
      main: {
        mesh: 'menu_binder_page_right',
        draw: (p, view, hovered) => {
          if (view.results) return Pages.drawResults(p.ctx, p.w, p.h, view.results, hovered);
          if (view.level) return Pages.drawLevel(p.ctx, p.w, p.h, view.level, hovered);
          return Pages.drawContents(p.ctx, p.w, p.h, hovered);
        },
      },
    },
  },
  folder: {
    rooms: ['office'],
    root: 'menu_folder',
    hinge: 'menu_folder_hinge',
    distance: 3.9,
    pages: {
      cover: { mesh: 'menu_folder_cover_art', draw: (p) => Pages.drawFolderCover(p.ctx, p.w, p.h) },
      inside: { mesh: 'menu_folder_sheet_left', draw: (p) => Pages.drawFolderInside(p.ctx, p.w, p.h) },
      main: {
        mesh: 'menu_folder_sheet_right',
        draw: (p, view, hovered) => {
          if (view.folderPage === 'sound') return Pages.drawSoundSheet(p.ctx, p.w, p.h, hovered, view.volume);
          const menu = view.folderPage === 'options' ? Pages.OPTIONS_MENU : Pages.OFFICE_MENU;
          return Pages.drawMenuSheet(p.ctx, p.w, p.h, hovered, menu);
        },
      },
    },
  },
  freePlay: {
    rooms: ['office'],
    root: 'menu_case',
    hinge: 'menu_case_hinge',
    distance: 4.9,
    clickPage: 'inside',   // The controls are inside the lid; the base shows the info screen
    briefcase: true,       // Lid hinged on the long back edge; held with that hinge upright in the middle
    rim: 0.012,            // Nearer the chair than the binder, so a thinner rim looks the same
    pages: {
      cover: { mesh: 'menu_case_cover_art', draw: (p) => Pages.drawCaseCover(p.ctx, p.w, p.h) },
      inside: { mesh: 'menu_case_panel_left', portrait: true, draw: (p, view, hovered) => Pages.drawFreePlayControls(p.ctx, p.w, p.h, view.freePlay, hovered) },
      main: { mesh: 'menu_case_panel_right', portrait: true, draw: (p, view, hovered) => Pages.drawFreePlayInfo(p.ctx, p.w, p.h, view.freePlay, hovered) },
    },
  },
  gameFolder: {
    rooms: ['game'],
    root: 'menu_folder',
    desk: { x: 0.4, z: -0.04, yaw: -10 },  // Right of the bomb, in the game camera's view
    hinge: 'menu_folder_hinge',
    distance: 2.3,      // In front of the bomb, which sits about 4 units from the camera
    heldScale: 0.59,    // Smaller to match: it looks the same size as the office folder
    pages: {
      cover: { mesh: 'menu_folder_cover_art', draw: (p) => Pages.drawFolderCover(p.ctx, p.w, p.h) },
      inside: { mesh: 'menu_folder_sheet_left', draw: (p) => Pages.drawFolderInside(p.ctx, p.w, p.h) },
      main: { mesh: 'menu_folder_sheet_right', draw: (p, view, hovered) => Pages.drawMenuSheet(p.ctx, p.w, p.h, hovered, Pages.GAME_MENU) },
    },
  },
};
const DESK_TOP_M = 0.75;

const smooth = (t) => t * t * (3 - 2 * t);

export class DeskMenu {
  /**
   * @param {THREE.Scene} scene
   * @param {THREE.PerspectiveCamera} camera
   * @param {HTMLCanvasElement} canvas
   * @param {object} actions - onStart(difficulty), onManual(), onRestart(), onLeave(), onRetry(),
   *   onVolume(step) and getVolume() for Options, getFreePlay() and onFreePlayChange(settings) for the
   *   Free Play case (onStart then gets a config instead of a level name), onLift(lifted) when a prop is raised or put down,
   *   and canUse() saying whether the desk can be used now
   */
  constructor(scene, camera, canvas, actions) {
    this.scene = scene;
    this.camera = camera;
    this.canvas = canvas;
    this.actions = actions;
    this.active = false;
    this._room = 'office';       // Which room's props can be used
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this._props = {};
    this._open = null;          // The prop that is lifted and open
    this._hoveredProp = null;
    this._hoveredRegion = null;
    // What the pages show: the binder's level or results, and the office folder's page
    this._view = {
      level: null, results: null, folderPage: null,
      volume: actions.getVolume?.() ?? 1,
      freePlay: actions.getFreePlay?.() ?? { ...DEFAULT_FREE_PLAY },
    };
    this._cameraTween = null;
    this._raycaster = new THREE.Raycaster();
    this._pointer = new THREE.Vector2();

    this._onPointerMove = this._onPointerMove.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    canvas.addEventListener('pointermove', this._onPointerMove);
    canvas.addEventListener('click', this._onClick);
    canvas.addEventListener('contextmenu', this._onContextMenu);
    window.addEventListener('keydown', this._onKeyDown);
  }

  async load() {
    const model = await loadModel('menu_props');
    // Copies are made before the originals are moved into the room
    const roots = {};
    for (const [key, spec] of Object.entries(PROPS)) {
      const original = model.getObjectByName(spec.root);
      roots[key] = spec.desk ? original.clone(true) : original;
      if (spec.desk) roots[key].name = `${spec.root}_${spec.rooms[0]}`;
    }
    for (const [key, spec] of Object.entries(PROPS)) {
      const root = roots[key];
      if (spec.desk) {
        root.position.set(spec.desk.x, DESK_TOP_M, spec.desk.z);
        root.rotation.set(0, THREE.MathUtils.degToRad(spec.desk.yaw), 0);
      }
      placeInRoom(root);
      this.group.add(root);
      const prop = {
        key,
        spec,
        root,
        hinge: root.getObjectByName(spec.hinge),
        deskPosition: root.position.clone(),
        deskQuaternion: root.quaternion.clone(),
        heldPosition: new THREE.Vector3(),
        heldQuaternion: new THREE.Quaternion(),
        t: 0,
        target: 0,
        onArrive: null,
        pages: {},
      };
      root.traverse((child) => {
        if (child.isMesh) child.castShadow = true;
      });
      for (const [name, page] of Object.entries(spec.pages)) {
        prop.pages[name] = this._makePage(root.getObjectByName(page.mesh), page.draw, page.portrait);
      }
      prop.outline = this._makeOutline(root, spec.rim);
      this._props[key] = prop;
    }
    this._showRoom();
    // The pages use a web font; draw them again once it has loaded
    document.fonts?.load(`40px ${Pages.TYPE_FONT}`).then(() => this._redrawAll());
    this._redrawAll();
  }

  /* ----------------------------------------------------------
     Showing and hiding
  ---------------------------------------------------------- */

  /**
   * Put the props back on the desk and move the camera to the chair
   * @param {boolean} instant - jump there, as on first load
   */
  show(instant = false) {
    this._room = 'office';
    this._reset();
    this.moveCamera(MENU_CAMERA.position, MENU_CAMERA.lookAt, instant);
  }

  /**
   * In the bomb room: only the folder on its desk, as the in-game menu
   */
  showInGame() {
    this._room = 'game';
    this._reset();
  }

  /**
   * After a game: the binder held open on its results page, with nothing else in view
   * @param {object} game - { levelId, won, timeRemaining, cause }
   */
  showResults(game) {
    this._room = 'results';
    this._reset();
    this._view.results = game;
    const binder = this._props.binder;
    this._setHeldPose(binder);
    binder.t = 1;
    binder.target = 1;
    this._applyPose(binder);
    this._open = binder;
    this._redraw(binder, 'main');
  }

  /**
   * Whether a prop is up or moving, so the bomb should ignore the mouse
   */
  isHolding() {
    return this.active && (Boolean(this._open) || this._isMoving());
  }

  // Every prop back on its desk, with only this room's showing
  _reset() {
    this.active = true;
    this.group.visible = true;
    this._view.level = null;
    this._view.results = null;
    this._view.folderPage = null;
    for (const prop of Object.values(this._props)) {
      prop.t = 0;
      prop.target = 0;
      prop.onArrive = null;
      this._applyPose(prop);
    }
    this._open = null;
    this._setHoveredProp(null);
    this.actions.onLift?.(false);
    this._showRoom();
    this._redrawAll();
  }

  _showRoom() {
    for (const prop of Object.values(this._props)) prop.root.visible = prop.spec.rooms.includes(this._room);
  }

  _roomProps() {
    return Object.values(this._props).filter(prop => prop.spec.rooms.includes(this._room));
  }

  hide() {
    this.active = false;
    this.group.visible = false;
    this._setHoveredProp(null);
    this.canvas.style.cursor = 'default';
  }

  /* ----------------------------------------------------------
     Per frame
  ---------------------------------------------------------- */

  update(delta) {
    for (const prop of Object.values(this._props)) {
      if (prop.t === prop.target) continue;
      const step = delta / MOVE_TIME;
      prop.t = prop.target > prop.t ? Math.min(prop.target, prop.t + step) : Math.max(prop.target, prop.t - step);
      this._applyPose(prop);
      if (prop.t === prop.target && prop.onArrive) {
        const done = prop.onArrive;
        prop.onArrive = null;
        done();
      }
    }

    if (this._cameraTween) {
      const tween = this._cameraTween;
      tween.t = Math.min(1, tween.t + delta / CAMERA_TIME);
      const k = smooth(tween.t);
      this.camera.position.lerpVectors(tween.fromPosition, tween.toPosition, k);
      this.camera.lookAt(new THREE.Vector3().lerpVectors(tween.fromLookAt, tween.toLookAt, k));
      if (tween.t === 1) {
        this._cameraTween = null;
        tween.onDone?.();
      }
    }
  }

  /**
   * Move the camera, smoothly unless told otherwise
   */
  moveCamera(position, lookAt, instant = false, onDone = null) {
    if (instant) {
      this.camera.position.copy(position);
      this.camera.lookAt(lookAt);
      this._cameraTween = null;
      onDone?.();
      return;
    }
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    this._cameraTween = {
      t: 0,
      fromPosition: this.camera.position.clone(),
      fromLookAt: this.camera.position.clone().add(forward.multiplyScalar(this.camera.position.distanceTo(lookAt))),
      toPosition: position.clone(),
      toLookAt: lookAt.clone(),
      onDone,
    };
  }

  // Place a prop between the desk (t = 0) and held open in front of the camera (t = 1)
  _applyPose(prop) {
    const lift = smooth(Math.min(1, prop.t / 0.7));
    prop.root.position.lerpVectors(prop.deskPosition, prop.heldPosition, lift);
    prop.root.quaternion.slerpQuaternions(prop.deskQuaternion, prop.heldQuaternion, lift);
    prop.root.scale.setScalar(ROOM_SCALE * THREE.MathUtils.lerp(1, prop.spec.heldScale ?? 1, lift));
    const open = smooth(Math.max(0, (prop.t - 0.3) / 0.7));
    // A binder or folder opens on its left edge; a briefcase lifts its lid on the back edge
    if (prop.spec.briefcase) prop.hinge.rotation.x = -open * OPEN_ANGLE;
    else prop.hinge.rotation.z = open * OPEN_ANGLE;
  }

  // Where a prop is held: standing up, facing the camera, with its hinge in the middle
  _setHeldPose(prop) {
    // Turned so its inside faces the camera. A binder's top edge points up; a briefcase
    // stands on its side, so its hinge is upright with the lid to the left.
    const facing = prop.spec.briefcase
      ? new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
        new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)))
      : new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    prop.heldQuaternion.copy(this.camera.quaternion).multiply(facing);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const hinge = prop.hinge.position.clone()
      .multiplyScalar(ROOM_SCALE * (prop.spec.heldScale ?? 1))
      .applyQuaternion(prop.heldQuaternion);
    prop.heldPosition.copy(this.camera.position)
      .addScaledVector(forward, prop.spec.distance)
      .sub(hinge);
  }

  /* ----------------------------------------------------------
     Opening and closing
  ---------------------------------------------------------- */

  _openProp(prop) {
    if (this._open) return;
    this._setHoveredProp(null);
    this._setHeldPose(prop);
    this._open = prop;
    prop.target = 1;
    this.actions.onLift?.(true);
    playSound('paper');
  }

  _closeOpen(onDown) {
    const prop = this._open;
    if (!prop || this._view.results) return; // The report stays up until Back or Retry
    this._setHoveredRegion(null);
    prop.target = 0;
    prop.onArrive = () => {
      if (this._open === prop) this._open = null;
      this._view.level = null;
      this._view.folderPage = null;
      this.actions.onLift?.(false);
      this._redraw(prop, 'main');
      onDown?.();
    };
  }

  _isMoving() {
    return Object.values(this._props).some(prop => prop.t !== prop.target) || this._cameraTween;
  }

  /* ----------------------------------------------------------
     Page actions
  ---------------------------------------------------------- */

  _doAction(id) {
    playSound('paper');
    if (id.startsWith('level:')) {
      this._view.level = id.slice('level:'.length);
    } else if (id === 'back') {
      this._view.level = null;
    } else if (id === 'start') {
      const level = this._view.level;
      // The binder stays on the desk until the screen has faded out
      this._closeOpen(() => this.actions.onStart(level));
      return;
    } else if (id === 'restart' || id === 'leave') {
      this._closeOpen(() => (id === 'restart' ? this.actions.onRestart() : this.actions.onLeave()));
      return;
    } else if (id === 'manual') {
      this.actions.onManual();
    } else if (id === 'options' || id === 'sound') {
      this._view.folderPage = id;
    } else if (id === 'options-back') {
      this._view.folderPage = null;
    } else if (id === 'sound-back') {
      this._view.folderPage = 'options';
    } else if (id === 'volume-down' || id === 'volume-up') {
      this._view.volume = this.actions.onVolume(id === 'volume-up' ? 0.1 : -0.1);
    } else if (id === 'fp-start') {
      const config = freePlayConfig(this._view.freePlay);
      this._closeOpen(() => this.actions.onStart(config));
      return;
    } else if (id.startsWith('fp-')) {
      this._view.freePlay = adjustFreePlay(this._view.freePlay, id.slice('fp-'.length));
      this.actions.onFreePlayChange?.(this._view.freePlay);
    } else if (id === 'retry' || id === 'results-back') {
      // The report goes when the next room fades in; App decides what comes next
      if (id === 'retry') this.actions.onRetry(); else this.actions.onLeave();
      return;
    }
    // A page that changed loses its hover; the case's controls stay where the pointer is
    if (!id.startsWith('fp-')) this._hoveredRegion = null;
    this._redrawOpen();
  }

  /* ----------------------------------------------------------
     Mouse
  ---------------------------------------------------------- */

  _hits(event, objects) {
    const rect = this.canvas.getBoundingClientRect();
    this._pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this._raycaster.setFromCamera(this._pointer, this.camera);
    return this._raycaster.intersectObjects(objects, true);
  }

  _propUnder(event) {
    const props = this._roomProps();
    const hit = this._hits(event, props.map(prop => prop.root))[0];
    if (!hit) return null;
    return props.find(prop => isInside(hit.object, prop.root)) ?? null;
  }

  // The clickable region under the pointer on the open prop's clickable page
  _regionUnder(event) {
    const page = this._open?.pages[this._open.spec.clickPage ?? 'main'];
    if (!page) return null;
    const hit = this._hits(event, [this._open.root])[0];
    if (!hit || hit.object !== page.mesh || !hit.uv) return null;
    return Pages.regionAt(page.regions, hit.uv.x * page.w, hit.uv.y * page.h);
  }

  _onPointerMove(event) {
    if (!this.active || this._isMoving()) return;
    if (this._open) {
      this._setHoveredRegion(this._regionUnder(event)?.id ?? null);
      this.canvas.style.cursor = this._hoveredRegion ? 'pointer' : 'default';
    } else {
      // During a game the bomb sets the cursor too, so only change it on entering or leaving a prop
      const prop = this.actions.canUse?.() === false ? null : this._propUnder(event);
      if (prop !== this._hoveredProp) this.canvas.style.cursor = prop ? 'pointer' : 'default';
      this._setHoveredProp(prop);
    }
  }

  _onClick(event) {
    if (!this.active || this._isMoving()) return;
    if (this._open) {
      const region = this._regionUnder(event);
      if (region) {
        this._doAction(region.id);
      } else if (!this._hits(event, [this._open.root]).length) {
        this._closeOpen(); // A click beside the open prop puts it down
      }
      return;
    }
    if (this.actions.canUse?.() === false) return;
    const prop = this._propUnder(event);
    if (prop) this._openProp(prop);
  }

  _onContextMenu(event) {
    if (!this.active) return;
    event.preventDefault();
    if (!this._isMoving()) this._closeOpen();
  }

  _onKeyDown(event) {
    if (this.active && event.key === 'Escape' && !this._isMoving()) this._closeOpen();
  }

  _setHoveredProp(prop) {
    if (this._hoveredProp === prop) return;
    if (this._hoveredProp) this._hoveredProp.outline.visible = false;
    this._hoveredProp = prop;
    if (prop) prop.outline.visible = true;
  }

  _setHoveredRegion(id) {
    if (this._hoveredRegion === id) return;
    this._hoveredRegion = id;
    this._redrawOpen();
  }

  // The open prop's pages that change: the clickable one, and the main one
  _redrawOpen() {
    if (!this._open) return;
    const clickPage = this._open.spec.clickPage ?? 'main';
    this._redraw(this._open, clickPage);
    if (clickPage !== 'main') this._redraw(this._open, 'main');
  }

  /* ----------------------------------------------------------
     Pages and outline
  ---------------------------------------------------------- */

  // portrait: the page is read with the model's x running up it (the briefcase's panels)
  _makePage(mesh, draw, portrait = false) {
    mesh.geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    mesh.geometry.boundingBox.getSize(size);
    const w = PAGE_WIDTH_PX;
    const h = Math.round(PAGE_WIDTH_PX * (portrait ? size.x / size.z : size.z / size.x));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false; // glTF UVs start at the top of the page
    texture.anisotropy = 8;
    mesh.material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 });
    return { mesh, canvas, ctx: canvas.getContext('2d'), texture, draw, w, h, regions: [] };
  }

  _redraw(prop, name) {
    const page = prop.pages[name];
    page.regions = page.draw(page, this._view, this._hoveredRegion) ?? [];
    page.texture.needsUpdate = true;
  }

  _redrawAll() {
    for (const prop of Object.values(this._props)) {
      for (const name of Object.keys(prop.pages)) this._redraw(prop, name);
    }
  }

  // A yellow rim around the prop: a slightly larger flat sheet just under it
  _makeOutline(root, rim = null) {
    const box = new THREE.Box3();
    root.updateMatrixWorld(true);
    const inverse = root.matrixWorld.clone().invert();
    root.traverse((child) => {
      if (!child.isMesh) return;
      child.geometry.computeBoundingBox();
      // Measured against the prop itself, so its turn on the desk doesn't inflate the box
      const relative = inverse.clone().multiply(child.matrixWorld);
      const local = child.geometry.boundingBox.clone().applyMatrix4(relative);
      box.union(local);
    });
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    // A thick prop hides more of the rim from the chair, so it needs a wider one
    const margin = rim ?? Math.min(0.03, 0.008 + size.y * 0.45);
    const outline = new THREE.Mesh(
      new THREE.PlaneGeometry(size.x + margin * 2, size.z + margin * 2),
      new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 })
    );
    outline.rotation.x = -Math.PI / 2;
    outline.position.set(center.x, box.min.y + 0.0005, center.z);
    outline.visible = false;
    outline.raycast = () => {}; // The rim never catches clicks
    root.add(outline);
    return outline;
  }
}

function isInside(object, root) {
  for (let node = object; node; node = node.parent) {
    if (node === root) return true;
  }
  return false;
}
