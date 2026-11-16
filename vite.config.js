/* ============================================================
   vite.config.js — Two pages: the game and the Expert manual
   The game runs on Meta's Immersive Web SDK (IWSDK), which needs
   Vite 7 and its own Three.js build, so Three.js is kept to one
   copy for the game and IWSDK to share.
   ============================================================ */

import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  // IPv4, so a Quest on USB reaches it through `adb reverse tcp:5173 tcp:5173`
  // (Node would otherwise listen on IPv6 only, and the headset gets no response)
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        game: resolve(import.meta.dirname, 'index.html'),
        manual: resolve(import.meta.dirname, 'manual.html'),
      },
    },
  },
  esbuild: { target: 'esnext' },
  resolve: { dedupe: ['three'] },
  optimizeDeps: {
    exclude: ['@babylonjs/havok'], // IWSDK's physics, which the game doesn't use
    esbuildOptions: { target: 'esnext' },
  },
});
