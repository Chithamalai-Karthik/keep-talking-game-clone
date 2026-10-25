/* ============================================================
   helpers.js — Utility Functions
   Random generators, serial number creation, and misc helpers
   ============================================================ */

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
 * Generate a random serial number
 * Format: 2 letters, 1 digit, 1 letter, 1 digit, 1 letter-or-digit
 * The last character determines even/odd parity (important for module rules)
 */
export function generateSerialNumber() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const alphanumeric = letters + digits;

  let serial = '';
  serial += randomChoice(letters);     // Letter
  serial += randomChoice(letters);     // Letter
  serial += randomChoice(digits);      // Digit
  serial += randomChoice(letters);     // Letter
  serial += randomChoice(digits);      // Digit
  serial += randomChoice(alphanumeric); // Letter or digit (last char)

  return serial;
}

/**
 * Check if a serial number has a vowel
 */
export function serialHasVowel(serial) {
  return /[AEIOU]/.test(serial);
}

/**
 * Check if the last digit of a serial is odd
 */
export function serialLastDigitOdd(serial) {
  // Find the last digit in the serial
  for (let i = serial.length - 1; i >= 0; i--) {
    if (/\d/.test(serial[i])) {
      return parseInt(serial[i]) % 2 !== 0;
    }
  }
  return false;
}

/**
 * Check if the last digit of a serial is even
 */
export function serialLastDigitEven(serial) {
  return !serialLastDigitOdd(serial);
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
