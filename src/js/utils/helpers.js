/* ============================================================
   helpers.js — Utility Functions
   Random helpers, time formatting, and misc helpers
   ============================================================ */

/**
 * Text the bomb shows for time remaining: partial seconds round up,
 * so it only reads 0:00 when time has run out
 */
export function displayTime(secondsRemaining) {
  return formatTime(Math.ceil(secondsRemaining));
}

/**
 * Get a random integer between min (inclusive) and max (inclusive)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get a random element from an array
 */
export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle an array in place (Fisher-Yates)
 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Format seconds into MM:SS
 */
export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Lerp (linear interpolation)
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Generate a random room code (for voice chat pairing)
 */
export function generateRoomCode(length = 4) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars (0/O, 1/I/L)
  let code = '';
  for (let i = 0; i < length; i++) {
    code += randomChoice(chars);
  }
  return code;
}

/**
 * Create floating particles for menu background
 */
export function createMenuParticles(container, count = 30) {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.bottom = `${-10 - Math.random() * 20}%`;
    particle.style.animationDuration = `${8 + Math.random() * 12}s`;
    particle.style.animationDelay = `${Math.random() * 10}s`;
    particle.style.width = `${2 + Math.random() * 3}px`;
    particle.style.height = particle.style.width;
    container.appendChild(particle);
  }
}
