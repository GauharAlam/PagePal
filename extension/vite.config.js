import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'background/service_worker.js', dest: 'background' },
        { src: 'content/content_script.js', dest: 'content' },
        { src: 'content/youtube_extractor.js', dest: 'content' },
        { src: 'assets/**/*', dest: 'assets' }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup/index.html')
      },
      output: {
        entryFileNames: 'popup/[name].js',
        chunkFileNames: 'popup/chunks/[name]-[hash].js',
        assetFileNames: 'popup/assets/[name]-[hash].[ext]'
      }
    }
  },
  root: '.',
  publicDir: false
});
