import { defineConfig } from 'vite';

export default defineConfig({
  // If deploying to Vercel, Netlify, or custom domain, use '/'
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
