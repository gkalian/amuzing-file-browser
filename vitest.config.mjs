import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8', // 'istanbul'
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'tests/**',
        '**/*.{test,spec}.{ts,tsx,js,jsx}',
        
        '**/*.config.js',
        '**/*.config.mjs',
        '**/*.config.ts',
        'vitest.config.mjs',
        'vite.config.mjs',
        'eslint.config.mjs',
        
        '**/*.d.ts',
        'components.d.ts',
        
        'dist/**',
        '**/assets/**',
        
        'node_modules/**',
        
        'public/**',
        '.github/**',
        '*.md'
      ]
    }
  },
  css: {
    modules: {
      classNameStrategy: 'non-scoped'
    }
  },
  resolve: {
    alias: {
      '@': resolve(rootDir, './src'),
      '@tests': resolve(rootDir, './tests')
    },
  },
})
