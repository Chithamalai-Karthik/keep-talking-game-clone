/* ============================================================
   SceneManager.js — The scene, camera, renderer and lights
   Built on Meta's Immersive Web SDK (IWSDK): its World makes the
   renderer, scene, camera and render loop, ready for VR later.
   The game's look is set here on top of it (tone mapping,
   shadows, background and lights), so it looks as it always has.
   ============================================================ */

import * as THREE from 'three';
import { World, SessionMode, createSystem } from '@iwsdk/core';

export class SceneManager {
  /**
   * Make the IWSDK world in a container, then the game's scene settings
   * @param {HTMLElement} container
   * @returns {Promise<SceneManager>}
   */
  static async create(container) {
    const world = await World.create(container, {
      // VR is ready but not offered yet: the Enter VR button comes in a later part
      // Hand tracking where the headset has it, so the game can be played without controllers
      xr: { sessionMode: SessionMode.ImmersiveVR, offer: 'none', features: { handTracking: true } },
      render: { fov: 50, near: 0.1, far: 100 },
      // The game reads the mouse itself (Raycaster, BombController, DeskMenu)
      input: { canvasPointerEvents: false },
      features: { spatialUI: false, locomotion: false, grabbing: false },
    });
    return new SceneManager(world);
  }

  /**
   * @param {World} world - an IWSDK world from World.create
   */
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.camera = world.camera;
    this.renderer = world.renderer;

    this.scene.background = new THREE.Color(0x0a0a14);
    this.scene.fog = new THREE.FogExp2(0x0a0a14, 0.015);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera.position.set(0, 3, 5);
    this.camera.lookAt(0, 0.5, 0);

    this._setupLights();
  }

  _setupLights() {
    // Hemisphere light — warm sky / cool ground for natural ambient
    const hemiLight = new THREE.HemisphereLight(0xffecd2, 0x1a1a2e, 0.6);
    this.scene.add(hemiLight);
    this.hemiLight = hemiLight;

    // Ambient light — warm base illumination
    const ambient = new THREE.AmbientLight(0xfff5e6, 0.5);
    this.scene.add(ambient);
    this.ambientLight = ambient;

    // Key light — bright warm directional from upper-right
    this.mainLight = new THREE.DirectionalLight(0xfff0d6, 2.5);
    this.mainLight.position.set(3, 8, 4);
    this.mainLight.castShadow = true;
    this.mainLight.shadow.mapSize.width = 2048;
    this.mainLight.shadow.mapSize.height = 2048;
    this.mainLight.shadow.camera.near = 0.5;
    this.mainLight.shadow.camera.far = 20;
    this.mainLight.shadow.camera.left = -6;
    this.mainLight.shadow.camera.right = 6;
    this.mainLight.shadow.camera.top = 6;
    this.mainLight.shadow.camera.bottom = -6;
    this.mainLight.shadow.bias = -0.001;
    this.mainLight.shadow.normalBias = 0.02;
    this.scene.add(this.mainLight);

    // Fill light — cool blue from the left for depth and contrast
    const fillLight = new THREE.DirectionalLight(0x8ec8ff, 0.6);
    fillLight.position.set(-4, 3, -2);
    this.scene.add(fillLight);
    this.fillLight = fillLight;

    // Back rim light — subtle warm edge light from behind
    const rimLight = new THREE.DirectionalLight(0xffe0b2, 0.4);
    rimLight.position.set(-1, 4, -5);
    this.scene.add(rimLight);
    this.rimLight = rimLight;
  }

  /**
   * Set the strength of the shared lights, for the room being shown
   * @param {{ key: number, hemi: number, ambient: number, fill: number, rim: number, shadowRadius: number }} lighting
   */
  setLighting({ key, hemi, ambient, fill, rim, shadowRadius }) {
    this.mainLight.intensity = key;
    this.hemiLight.intensity = hemi;
    this.ambientLight.intensity = ambient;
    this.fillLight.intensity = fill;
    this.rimLight.intensity = rim;
    this.mainLight.shadow.radius = shadowRadius;
  }

  /**
   * Run the game's per-frame update inside IWSDK's render loop, as a system
   * @param {(delta: number, elapsed: number) => void} updateCallback
   */
  animate(updateCallback) {
    const GameLoopSystem = class extends createSystem() {
      update(delta, time) {
        updateCallback(delta, time);
      }
    };
    this.world.registerSystem(GameLoopSystem);
  }

  /**
   * Add an object to the scene
   */
  add(object) {
    this.scene.add(object);
  }

  /**
   * Remove an object from the scene
   */
  remove(object) {
    this.scene.remove(object);
  }

  dispose() {
    this.world.destroy?.();
  }
}
