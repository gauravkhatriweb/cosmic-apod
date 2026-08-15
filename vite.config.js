import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages deploys to /<repo-name>/
  // Change 'cosmic-apod' if your repository name differs.
  base: '/cosmic-apod/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
