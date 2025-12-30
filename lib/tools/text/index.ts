/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Text utilities - String manipulation and transformation
 * Pure text processing functions
 */

import { validateNotEmpty, TEXT_SIZE_LIMIT } from '../shared';

/**
 * Reverses a string
 */
export const reverseString = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  if (input.length > TEXT_SIZE_LIMIT) {
    throw new Error('Input exceeds size limit of 10MB');
  }

  return input.split('').reverse().join('');
};

/**
 * Splits string into lines and returns count
 */
export const stringToLines = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  const lines = input.split(/\r?\n/);
  return JSON.stringify(
    {
      lineCount: lines.length,
      lines: lines,
    },
    null,
    2,
  );
};

/**
 * Removes all whitespace from string
 */
export const removeWhitespace = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  return input.replace(/\s+/g, '');
};

/**
 * Converts text to UPPERCASE
 */
export const textToUppercase = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  return input.toUpperCase();
};

/**
 * Converts text to lowercase
 */
export const textToLowercase = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  return input.toLowerCase();
};

/**
 * Converts text to Title Case
 */
export const titleCase = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  return input
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
