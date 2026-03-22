/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/apps/desktop',

  server: {
    port: 3001,
    host: 'localhost',
    // In dev mode, renderer talks to cloud API or embedded API via IPC
    // No proxy needed — Apollo Client routes online/offline separately
  },

  plugins: [react(), nxViteTsPaths()],

  build: {
    outDir: '../../../dist/apps/desktop/renderer',
    emptyOutDir: true,
    reportCompressedSize: true,
    rollupOptions: {
      // Electron APIs are not available in renderer — ensure no accidental imports
      external: ['electron'],
    },
  },

  // Electron-specific: use relative paths so file:// protocol works
  base: './',

  define: {
    // Flag available in renderer to detect Electron context
    'import.meta.env.VITE_IS_ELECTRON': JSON.stringify(true),
  },
});
