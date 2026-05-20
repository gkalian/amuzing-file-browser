import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'use-callback-ref',
      '@mantine/core',
      '@mantine/hooks',
      '@mantine/notifications',
      'i18next',
      'react-i18next',
      'i18next-browser-languagedetector',
      'react-virtuoso',
    ],
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@mantine')) {
            return 'vendor-mantine';
          }
          if (id.includes('node_modules/@tabler')) {
            return 'vendor-tabler';
          }
          if (
            id.includes('node_modules/i18next') ||
            id.includes('node_modules/react-i18next') ||
            id.includes('node_modules/i18next-browser-languagedetector')
          ) {
            return 'vendor-i18n';
          }
          if (id.includes('node_modules/react-virtuoso')) {
            return 'vendor-virtuoso';
          }
        },
      },
    },
  },
});
