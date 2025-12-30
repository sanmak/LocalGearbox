/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * JSON Formatter utilities
 * Format/beautify JSON with various indentation options
 */

import { IndentOption } from './types';

/**
 * Get indent value for JSON.stringify
 */
export const getIndentValue = (option: IndentOption): string | number | undefined => {
  switch (option) {
    case '2':
      return 2;
    case '3':
      return 3;
    case '4':
      return 4;
    case 'tab':
      return '\t';
    case 'compact':
      return undefined;
    case 'escaped':
      return 2;
    default:
      return 2;
  }
};

/**
 * Format JSON with the given indent option
 */
export const formatJson = (parsed: unknown, option: IndentOption): string => {
  const indent = getIndentValue(option);
  const formatted = JSON.stringify(parsed, null, indent);

  if (option === 'escaped') {
    return JSON.stringify(formatted);
  }

  return formatted;
};

/**
 * Parse and format JSON string
 */
export const formatJsonString = (
  input: string,
  option: IndentOption = '2',
): { output: string; parsed: unknown } => {
  const parsed = JSON.parse(input);
  const output = formatJson(parsed, option);
  return { output, parsed };
};

/**
 * Minify JSON (remove all whitespace)
 */
export const minifyJson = (input: string): string => {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed);
};

/**
 * Get size comparison after minification
 */
export const getMinifyStats = (
  input: string,
  output: string,
): { originalSize: number; minifiedSize: number; reduction: number } => {
  const originalSize = new Blob([input]).size;
  const minifiedSize = new Blob([output]).size;
  const reduction = originalSize > 0 ? Math.round((1 - minifiedSize / originalSize) * 100) : 0;
  return { originalSize, minifiedSize, reduction };
};
