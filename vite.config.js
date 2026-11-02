/* ============================================================
   vite.config.js — Two pages: the game and the Expert manual
   ============================================================ */

import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        game: resolve(import.meta.dirname, 'index.html'),
        manual: resolve(import.meta.dirname, 'manual.html'),
      },
    },
  },
});
