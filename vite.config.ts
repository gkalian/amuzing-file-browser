import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-ignore
import { reactGlobalPlugin } from './vite-react-global-plugin.js';

export default defineConfig({
  plugins: [react(), reactGlobalPlugin()],
  optimizeDeps: {
    include: ['react', 'react-dom', 'use-callback-ref']
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': '/src'
    }
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
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
    minify: false,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
            if (id.includes('@mantine')) return 'mantine';
            if (id.includes('i18next')) return 'i18n';
            if (id.includes('@tabler/icons-react')) return 'icons';
            if (id.includes('react-virtuoso')) return 'virtuoso';
            return 'vendor';
          }
        },
      },
    },
  },
});