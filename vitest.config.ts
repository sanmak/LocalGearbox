/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: ['tests/e2e/**', 'node_modules/**', '.opencode/**', '.gemini/**'],
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/TEMPLATE.ts',
        '.next/',
        'postcss.config.cjs',
        'next.config.js',
        'tailwind.config.ts',
        'eslint.config.js',
      ],
      thresholds: {
        statements: 45,
        branches: 25,
        functions: 45,
        lines: 45,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
