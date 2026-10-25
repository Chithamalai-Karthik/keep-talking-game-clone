/* ============================================================
   SceneManager.js — Three.js Scene Setup
   Creates and manages the Three.js scene, camera, renderer, lights
   ============================================================ */

import * as THREE from 'three';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a14);
    this.scene.fog = new THREE.FogExp2(0x0a0a14, 0.015);

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 3, 5);
    this.camera.lookAt(0, 0.5, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(this.renderer.domElement);

    // Timer (replaces deprecated THREE.Clock)
    this.timer = new THREE.Timer();
    this.timer.connect(document);

    // Lights
    this._setupLights();

    // Handle resize
    window.addEventListener('resize', () => this._onResize());
  }

  _setupLights() {
    // Hemisphere light — warm sky / cool ground for natural ambient
    const hemiLight = new THREE.HemisphereLight(0xffecd2, 0x1a1a2e, 0.6);
    this.scene.add(hemiLight);

    // Ambient light — warm base illumination
    const ambient = new THREE.AmbientLight(0xfff5e6, 0.5);
    this.scene.add(ambient);

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

    // Back rim light — subtle warm edge light from behind
    const rimLight = new THREE.DirectionalLight(0xffe0b2, 0.4);
    rimLight.position.set(-1, 4, -5);
    this.scene.add(rimLight);
  }

  _onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  /**
   * Main render loop — call from requestAnimationFrame
   * @param {Function} updateCallback - Called each frame with delta time
   */
  animate(updateCallback) {
    const loop = (timestamp) => {
      requestAnimationFrame(loop);
      this.timer.update(timestamp);
      const delta = this.timer.getDelta();
      const elapsed = this.timer.getElapsed();

      if (updateCallback) {
        updateCallback(delta, elapsed);
      }

      this.renderer.render(this.scene, this.camera);
    };
    requestAnimationFrame(loop);
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
    this.renderer.dispose();
    window.removeEventListener('resize', this._onResize);
  }
}
