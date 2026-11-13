/* ============================================================
   Rooms.js — The office (menu) and the bomb room (game)
   Both rooms are modelled at real size in metres; the game works
   in units of about 12.5 cm, so each is scaled up by ROOM_SCALE
   and lowered so its desk top is where the bomb rests.
   ============================================================ */

import * as THREE from 'three';
import { loadModel } from './ModelLoader.js';

export const ROOM_SCALE = 8;
const DESK_HEIGHT = 0.75;     // Metres, in office.blend
const DESK_TOP_Y = 0.56;      // Game units: where the bomb rests
export const ROOM_OFFSET_Y = DESK_TOP_Y - DESK_HEIGHT * ROOM_SCALE;

const CLOCK_GREEN = '#3dff6e';

/**
 * Put an object from a real-size model into the room's place
 */
export function placeInRoom(object) {
  object.position.multiplyScalar(ROOM_SCALE);
  object.position.y += ROOM_OFFSET_Y;
  object.scale.multiplyScalar(ROOM_SCALE);
}

export class Room {
  /**
   * @param {object} spec
   * @param {string} spec.model - the .glb file name
   * @param {string[]} spec.shadowCatchers - meshes that show shadows of what sits on them
   * @param {(group: THREE.Group) => void} spec.addLights - the room's own lights, in room metres
   * @param {object} spec.lighting - the shared scene lights' strengths in this room (SceneManager.setLighting)
   */
  constructor({ model, shadowCatchers, addLights, lighting }) {
    this.model = model;
    this.lighting = lighting;
    this.shadowCatchers = shadowCatchers;
    this.group = new THREE.Group();
    this.group.scale.setScalar(ROOM_SCALE);
    this.group.position.y = ROOM_OFFSET_Y;
    addLights(this.group);
    this._clock = null;
  }

  async load() {
    const model = await loadModel(this.model);
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.receiveShadow = this.shadowCatchers.includes(child.name);
      child.castShadow = /^(prop_|chair_|br_clock$|br_clock_snooze)/.test(child.name);
    });
    const screen = model.getObjectByName('br_clock_screen');
    if (screen) this._clock = makeClock(screen);
    this.group.add(model);
  }

  setVisible(visible) {
    this.group.visible = visible;
  }

  /**
   * Keep the desk clock on the real time of day
   * @param {boolean} displayOn - false blanks the digits, to flash them while the alarm rings
   */
  update(displayOn = true) {
    if (!this._clock || !this.group.visible) return;
    const now = new Date();
    const time = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}`;
    const text = displayOn ? time : '';
    if (text === this._clock.text) return;
    this._clock.text = text;
    const { ctx, canvas, texture } = this._clock;
    ctx.fillStyle = '#06120a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 76px "Courier New", monospace';
    ctx.fillStyle = CLOCK_GREEN;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = CLOCK_GREEN;
    ctx.shadowBlur = 12;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 4);
    texture.needsUpdate = true;
  }

  getObject() {
    return this.group;
  }
}

// The clock's screen: a canvas, unlit so it glows in the dark room
function makeClock(mesh) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 104;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  mesh.material = new THREE.MeshBasicMaterial({ map: texture });
  return { canvas, ctx: canvas.getContext('2d'), texture, text: null };
}

/**
 * The office where the menu is: lit by its ceiling panel
 */
export function createOffice() {
  return new Room({
    model: 'office',
    shadowCatchers: ['desk_front_top', 'desk_back_top', 'room_floor'],
    lighting: { key: 2.5, hemi: 0.6, ambient: 0.5, fill: 0.6, rim: 0.4, shadowRadius: 1 },
    addLights: (group) => {
      const ceiling = new THREE.PointLight(0xfff1dc, 1.4, 0, 0);
      ceiling.position.set(0, 2.4, -0.5);
      group.add(ceiling);
    },
  });
}

/**
 * The bomb room where the game is played: dim walls and soft, even light on the desk
 */
export function createBombRoom() {
  return new Room({
    model: 'bomb_room',
    shadowCatchers: ['br_desk_top', 'br_floor'],
    // A gentler key light with blurred shadows, and more light from all round, so nothing looks harsh
    lighting: { key: 1.3, hemi: 1.05, ambient: 0.75, fill: 0.55, rim: 0.45, shadowRadius: 8 },
    addLights: (group) => {
      const ceiling = new THREE.PointLight(0xffe6c8, 0.35, 0, 0);
      ceiling.position.set(0, 2.3, 0.3);
      group.add(ceiling);
    },
  });
}
