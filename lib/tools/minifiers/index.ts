/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Minifiers - Code minification utilities
 * Pure minification functions for JSON, CSS, JS, HTML, XML
 */

import { validateInput, JSON_SIZE_LIMIT } from '../shared';

/**
 * Minifies JSON (removes whitespace)
 */
export const minifyJSON = async (input: string): Promise<string> => {
  validateInput(input, JSON_SIZE_LIMIT);

  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Minifies CSS (removes comments and whitespace)
 */
export const minifyCSS = async (input: string): Promise<string> => {
  validateInput(input);

  return input
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\s*{\s*/g, '{') // Remove space around {
    .replace(/\s*}\s*/g, '}') // Remove space around }
    .replace(/\s*:\s*/g, ':') // Remove space around :
    .replace(/\s*;\s*/g, ';') // Remove space around ;
    .trim();
};

/**
 * Minifies JavaScript (basic minification - removes comments and extra whitespace)
 */
export const minifyJS = async (input: string): Promise<string> => {
  validateInput(input);

  return input
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\/\/.*/g, '') // Remove single-line comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
};

/**
 * Minifies HTML (removes comments and extra whitespace)
 */
export const minifyHTML = async (input: string): Promise<string> => {
  validateInput(input);

  return input
    .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/>\s+</g, '><') // Remove space between tags
    .trim();
};

/**
 * Minifies XML (removes comments and extra whitespace)
 */
export const minifyXML = async (input: string): Promise<string> => {
  validateInput(input);

  return input
    .replace(/<!--[\s\S]*?-->/g, '') // Remove XML comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/>\s+</g, '><') // Remove space between tags
    .trim();
};
