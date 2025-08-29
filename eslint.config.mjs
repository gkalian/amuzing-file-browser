import js from '@eslint/js';
import globals from 'globals';
import reactRefresh from 'eslint-plugin-react-refresh';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      sourceType: 'module',
    },
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
    ignores: ['dist', 'dist-server', 'node_modules'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: false,
      },
      globals: globals.browser,
    },
    plugins: { '@typescript-eslint': tsPlugin, 'react-refresh': reactRefresh },
    rules: {
      'no-unused-vars': 'off',
      // Disable no-undef in TS files; TypeScript handles undefined vars/types (e.g., RequestInfo, process)
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    ignores: [
      '*.md',
      '**/dist',
      '**/dist-server',
      '**/node_modules',
      '**/fonts',
      '**.config.mjs',
      '.releaserc.js',
    ],
  },
];
