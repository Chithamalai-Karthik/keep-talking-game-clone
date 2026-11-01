/* ============================================================
   ModelLoader.js — Loads .glb models exported from Blender
   Models live in public/assets/models/ and are cached by name,
   so each bomb slot gets its own clone of one download.
   ============================================================ */

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_PATH = '/assets/models/';

const _loader = new GLTFLoader();
const _cache = new Map();

/**
 * Load a model by file name (without extension)
 * @param {string} name — e.g. 'test_module'
 * @returns {Promise<THREE.Object3D>} — A new clone of the model
 */
export async function loadModel(name) {
  if (!_cache.has(name)) {
    _cache.set(name, _loader.loadAsync(`${MODEL_PATH}${name}.glb`));
  }

  const gltf = await _cache.get(name);
  return gltf.scene.clone(true);
}
