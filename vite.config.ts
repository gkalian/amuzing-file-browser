import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom', 'use-callback-ref'],
    needsInterop: ['use-callback-ref']
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': '/src',
      'use-callback-ref': 'use-callback-ref/dist/es2019/index.js'
    }
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