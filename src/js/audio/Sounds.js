/* ============================================================
   Sounds.js — Sound effects
   Every sound is generated with the Web Audio API, so the game
   ships no audio files and none are copied from the original.
   Browsers keep audio off until the player clicks, so sounds
   before that are skipped.
   ============================================================ */

const MASTER_VOLUME = 0.5; // Players need to hear each other over the game
const NOISE_SECONDS = 2;

let context = null;
let master = null;
const noiseBuffers = new WeakMap();

/**
 * Play one tone
 * @param {Object} tone — { freq, seconds, type, volume, delay, slideTo }
 */
function tone(ctx, out, { freq, seconds, type = 'sine', volume = 0.3, delay = 0, slideTo = null }) {
  const start = ctx.currentTime + delay;
  const end = start + seconds;

  const oscillator = ctx.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, start);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, end);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, end);

  oscillator.connect(gain).connect(out);
  oscillator.start(start);
  oscillator.stop(end);
}

function getNoise(ctx) {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate * NOISE_SECONDS, ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
}

/**
 * Play a burst of filtered noise
 * @param {Object} burst — { seconds, filter, freq, volume, slideTo }
 */
function noise(ctx, out, { seconds, filter = 'lowpass', freq, volume = 0.3, slideTo = null }) {
  const start = ctx.currentTime;
  const end = start + seconds;

  const source = ctx.createBufferSource();
  source.buffer = getNoise(ctx);
  source.loop = true;

  const shape = ctx.createBiquadFilter();
  shape.type = filter;
  shape.frequency.setValueAtTime(freq, start);
  if (slideTo) shape.frequency.exponentialRampToValueAtTime(slideTo, end);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, end);

  source.connect(shape).connect(gain).connect(out);
  source.start(start);
  source.stop(end);
}

const simonTone = (freq) => (ctx, out) => tone(ctx, out, { freq, seconds: 0.3, type: 'triangle', volume: 0.35 });

export const SOUNDS = {
  tick: (ctx, out) => tone(ctx, out, { freq: 1500, seconds: 0.025, type: 'square', volume: 0.08 }),

  press: (ctx, out) => {
    noise(ctx, out, { seconds: 0.03, filter: 'bandpass', freq: 1800, volume: 0.35 });
    tone(ctx, out, { freq: 180, seconds: 0.05, volume: 0.25 });
  },

  release: (ctx, out) => {
    noise(ctx, out, { seconds: 0.025, filter: 'bandpass', freq: 2600, volume: 0.25 });
    tone(ctx, out, { freq: 260, seconds: 0.04, volume: 0.15 });
  },

  snip: (ctx, out) => {
    noise(ctx, out, { seconds: 0.05, filter: 'highpass', freq: 3000, volume: 0.35 });
    tone(ctx, out, { freq: 3200, slideTo: 1400, seconds: 0.04, type: 'square', volume: 0.08 });
  },

  strike: (ctx, out) => {
    tone(ctx, out, { freq: 110, seconds: 0.5, type: 'sawtooth', volume: 0.4 });
    tone(ctx, out, { freq: 116, seconds: 0.5, type: 'square', volume: 0.2 });
  },

  solve: (ctx, out) => {
    tone(ctx, out, { freq: 880, seconds: 0.14, volume: 0.25 });
    tone(ctx, out, { freq: 1320, seconds: 0.3, volume: 0.25, delay: 0.1 });
  },

  defused: (ctx, out) => {
    [523, 659, 784, 1047].forEach((freq, index) => {
      tone(ctx, out, { freq, seconds: 0.5, type: 'triangle', volume: 0.3, delay: index * 0.13 });
    });
  },

  explosion: (ctx, out) => {
    noise(ctx, out, { seconds: 2, freq: 1200, slideTo: 70, volume: 0.9 });
    tone(ctx, out, { freq: 90, slideTo: 28, seconds: 1.6, volume: 0.8 });
  },

  needy: (ctx, out) => {
    [0, 0.16].forEach(delay => tone(ctx, out, { freq: 980, seconds: 0.12, type: 'square', volume: 0.12, delay }));
  },

  'simon-green': simonTone(415),
  'simon-red': simonTone(310),
  'simon-yellow': simonTone(252),
  'simon-blue': simonTone(209),
};

/**
 * Start the audio. Browsers only allow this during a click or key press.
 */
export function unlockAudio() {
  const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!context) {
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(context.destination);
  }
  if (context.state === 'suspended') context.resume();
}

/**
 * Play a sound from SOUNDS. Does nothing until the audio is unlocked.
 */
export function playSound(name) {
  if (context?.state !== 'running') return;
  SOUNDS[name](context, master);
}
