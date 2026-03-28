/// <reference types='vitest' />
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

const I18N_LOCALES_SRC = path.resolve(__dirname, '../../libs/i18n/src/locales');
const I18N_LOCALES_DEST = path.resolve(__dirname, 'public/locales');

/** Copy libs/i18n/src/locales → public/locales at dev start and build time */
function i18nLocalesPlugin(): Plugin {
  function copyDir(src: string, dest: string) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  return {
    name: 'i18n-locales',
    buildStart() {
      if (fs.existsSync(I18N_LOCALES_SRC)) {
        copyDir(I18N_LOCALES_SRC, I18N_LOCALES_DEST);
      }
    },
  };
}

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/web',
  server: {
    port: 3000,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/graphql': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
    host: 'localhost',
  },
  plugins: [
    react(),
    nxViteTsPaths(),
    // Copy locale files from libs/i18n (source of truth) → public/locales (runtime)
    // Works for both `vite serve` (dev) and `vite build` (prod)
    i18nLocalesPlugin(),
  ],
  build: {
    outDir: '../../dist/apps/web',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/web',
      provider: 'v8',
    },
  },
});
