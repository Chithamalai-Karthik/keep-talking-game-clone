/* ============================================================
   MergeStatic.js — Fewer draw calls for parts that never change
   Pieces of a model are baked into one mesh, so the headset draws
   them in one go: pieces sharing a material, and (with byColour)
   plain-coloured pieces that differ only in colour, whose colours
   move onto their vertices. Only for pieces the game never moves,
   hides or recolours: `keep` and `only` protect everything else,
   and hidden pieces and pieces with children are left alone.
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// One shared material per look, for pieces merged by colour
const colourMaterials = new Map();

/**
 * Merge a model's meshes
 * @param {THREE.Object3D} root
 * @param {object} [options]
 * @param {(mesh: THREE.Mesh) => boolean} [options.keep] - meshes to leave alone
 * @param {Set<THREE.Object3D>} [options.only] - if given, the only meshes that may be merged
 * @param {boolean} [options.byColour] - also merge plain materials that differ only in colour
 * @returns {number} how many meshes became merged ones
 */
export function mergeByMaterial(root, { keep = () => false, only = null, byColour = false } = {}) {
  root.updateWorldMatrix(true, true);
  const toRoot = root.matrixWorld.clone().invert();
  const groups = new Map();

  root.traverse((mesh) => {
    if (!mesh.isMesh || Array.isArray(mesh.material) || keep(mesh)) return;
    if (only && !only.has(mesh)) return;
    if (!mesh.geometry?.attributes.position) return;
    if (mesh.children.length) return;               // Removing it would take what is inside it too
    if (!shownWithin(mesh, root)) return;           // Hidden now (a cut wire): it may be shown later
    const flags = `${mesh.castShadow}|${mesh.receiveShadow}|${mesh.renderOrder}`;
    const look = byColour && isPlain(mesh.material) ? plainLook(mesh.material) : null;
    const key = look ? `look|${look}|${flags}` : `material|${mesh.material.uuid}|${flags}`;
    if (!groups.has(key)) groups.set(key, { meshes: [], look });
    groups.get(key).meshes.push(mesh);
  });

  let merged = 0;
  for (const { meshes, look } of groups.values()) {
    if (meshes.length < 2) continue;
    const geometry = mergeMeshes(meshes, toRoot, Boolean(look));
    if (!geometry) continue;
    const first = meshes[0];
    const material = look ? colourMaterial(look, first.material) : first.material;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `merged_${material.name || first.name}`;
    mesh.castShadow = first.castShadow;
    mesh.receiveShadow = first.receiveShadow;
    mesh.renderOrder = first.renderOrder;
    root.add(mesh);
    // The original geometries are shared with other copies of the model, so they are not disposed
    meshes.forEach(m => m.removeFromParent());
    merged += meshes.length;
  }
  return merged;
}

// A plain coloured surface: no textures, glow, transparency or colours of its own
function isPlain(material) {
  return material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial
    && !material.map && !material.normalMap && !material.roughnessMap && !material.metalnessMap
    && !material.emissiveMap && !material.alphaMap && !material.aoMap && !material.vertexColors
    && !material.transparent && material.alphaTest === 0 && material.opacity === 1
    && material.emissive.getHex() === 0;
}

// What such a surface looks like apart from its colour
function plainLook(material) {
  const round = (value) => Math.round(value * 20) / 20;
  return `${round(material.roughness)}|${round(material.metalness)}|${material.side}|${material.flatShading}|${material.envMapIntensity}`;
}

function colourMaterial(look, like) {
  if (!colourMaterials.has(look)) {
    colourMaterials.set(look, new THREE.MeshStandardMaterial({
      name: 'merged_colours',
      vertexColors: true,
      roughness: like.roughness,
      metalness: like.metalness,
      side: like.side,
      flatShading: like.flatShading,
      envMapIntensity: like.envMapIntensity,
    }));
  }
  return colourMaterials.get(look);
}

// Whether an object and everything above it, up to the root, are visible
function shownWithin(object, root) {
  for (let node = object; node && node !== root; node = node.parent) {
    if (!node.visible) return false;
  }
  return root.visible;
}

// Copies of the meshes' geometries, placed where they are in the root, sharing one attribute set
function mergeMeshes(meshes, toRoot, withColour) {
  const geometries = meshes.map((mesh) => {
    const geometry = mesh.geometry.clone();
    geometry.applyMatrix4(toRoot.clone().multiply(mesh.matrixWorld));
    if (!geometry.index) {
      geometry.setIndex([...Array(geometry.attributes.position.count).keys()]);
    }
    if (withColour) {
      // The piece's colour, on each of its vertices (both are in linear colour space)
      const { r, g, b } = mesh.material.color;
      const count = geometry.attributes.position.count;
      const colours = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) colours.set([r, g, b], i * 3);
      geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    }
    return geometry;
  });
  const shared = Object.keys(geometries[0].attributes)
    .filter(name => geometries.every(g => g.attributes[name]));
  for (const geometry of geometries) {
    for (const name of Object.keys(geometry.attributes)) {
      if (!shared.includes(name)) geometry.deleteAttribute(name);
    }
    geometry.morphAttributes = {};
  }
  const result = mergeGeometries(geometries, false);
  geometries.forEach(g => g.dispose());
  return result;
}
