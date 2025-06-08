import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './', // For GitHub Pages deployment
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0, // Ensure all assets are copied as files
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    port: 3000,
  },
  assetsInclude: ['**/*.png', '**/*.wav', '**/*.mp3', '**/*.json'],
});
