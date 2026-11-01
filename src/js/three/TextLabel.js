/* ============================================================
   TextLabel.js — Flat text for widgets and modules
   The caller disposes the mesh's texture, material and geometry.
   ============================================================ */

import * as THREE from 'three';

/**
 * @param {string} text
 * @param {number} width — Width in bomb units
 * @param {number} height — Height in bomb units
 * @param {Object} style — { color, background, font }
 * @returns {THREE.Mesh}
 */
export function createTextLabel(text, width, height, { color, background, font }) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = Math.round(512 * (height / width));
  const ctx = canvas.getContext('2d');

  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: !background });

  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
}
