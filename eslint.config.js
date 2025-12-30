/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

// ESLint flat config for Next.js 16+ and React 19
import nextConfig from 'eslint-config-next';
import prettier from 'eslint-config-prettier';

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      'package-lock.json',
      'public/**',
      '.vscode/**',
      '.claude/**',
      'llm.json',
      'tools.json',
      'architecture.json',
      'tsconfig.tsbuildinfo',
      'coverage/**',
      'next-env.d.ts',
    ],
  },
  ...nextConfig,
  prettier,
  {
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@next/next/no-img-element': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
    },
  },
];

export default config;
