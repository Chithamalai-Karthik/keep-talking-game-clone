/* ============================================================
   ModelLoader.js — Loads .glb models exported from Blender
   Models live in public/assets/models/ and are cached by name,
   so each bomb slot gets its own clone of one download.
   ============================================================ */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ASSET_PATH = '/assets/';
const MODEL_PATH = `${ASSET_PATH}models/`;

const _loader = new GLTFLoader();
const _textureLoader = new THREE.TextureLoader();
const _cache = new Map();
const _textures = new Map();

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

/**
 * Load an image in public/assets/ as a texture. Textures are shared
 * and cached, so the caller must not dispose them.
 * @param {string} path — e.g. 'keypad/psi.png'
 * @returns {Promise<THREE.Texture>}
 */
export function loadTexture(path) {
  if (!_textures.has(path)) {
    _textures.set(path, _textureLoader.loadAsync(`${ASSET_PATH}${path}`).then((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }));
  }

  return _textures.get(path);
}
