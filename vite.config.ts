import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom', 'use-callback-ref'],
    needsInterop: ['use-callback-ref'],
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': '/src',
      'use-callback-ref': 'use-callback-ref/dist/es2019/index.js',
    },
  },
  server: {
    port: 3500,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
