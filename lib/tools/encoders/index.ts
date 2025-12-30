/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Encoders - URL, Base64, HTML, XML, JSON, CSV escape/unescape utilities
 * Pure encoding/decoding functions
 */

import { validateNotEmpty } from '../shared';

// URL Encoding

/**
 * Encodes URL component
 */
export const encodeURL = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  try {
    return encodeURIComponent(input);
  } catch {
    throw new Error('Failed to encode URL');
  }
};

/**
 * Decodes URL component
 */
export const decodeURL = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  try {
    return decodeURIComponent(input);
  } catch {
    throw new Error('Invalid URL encoding');
  }
};

/**
 * Auto-detects and processes URL (encode or decode)
 */
export const processURL = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  // Auto-detect if input is URL encoded by checking for % characters
  const hasURLEncoding = /%[0-9A-Fa-f]{2}/.test(input);

  try {
    if (hasURLEncoding) {
      // Decode URL-encoded input
      const decoded = decodeURIComponent(input);
      return JSON.stringify(
        {
          operation: 'decode',
          input: input,
          output: decoded,
        },
        null,
        2,
      );
    } else {
      // Encode plain text input
      const encoded = encodeURIComponent(input);
      return JSON.stringify(
        {
          operation: 'encode',
          input: input,
          output: encoded,
        },
        null,
        2,
      );
    }
  } catch {
    // If decode fails, try encoding instead
    try {
      const encoded = encodeURIComponent(input);
      return JSON.stringify(
        {
          operation: 'encode',
          input: input,
          output: encoded,
          note: 'Auto-detected as plain text (decode failed)',
        },
        null,
        2,
      );
    } catch {
      throw new Error('Failed to process URL - invalid input format');
    }
  }
};

// Base64 Encoding

/**
 * Encodes string to Base64
 */
export const encodeBase64 = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  try {
    return Buffer.from(input, 'utf-8').toString('base64');
  } catch {
    throw new Error('Failed to encode to Base64');
  }
};

/**
 * Decodes Base64 string
 */
export const decodeBase64 = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  try {
    // Validate Base64 format
    if (!/^[A-Za-z0-9+/=]+$/.test(input.trim())) {
      throw new Error('Invalid Base64 format');
    }

    return Buffer.from(input, 'base64').toString('utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to decode Base64');
  }
};

// HTML Encoding

/**
 * Escapes HTML special characters
 */
export const escapeHTML = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Unescapes HTML entities
 */
export const unescapeHTML = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  return input
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
};

// XML Encoding

/**
 * Escapes XML special characters
 */
export const escapeXML = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Unescapes XML entities
 */
export const unescapeXML = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  return input
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
};

// JSON Encoding

/**
 * Escapes JSON string (adds quotes and escapes special characters)
 */
export const escapeJSON = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  return JSON.stringify(input);
};

// CSV Encoding

/**
 * Escapes CSV fields (adds quotes if needed)
 */
export const escapeCSV = async (input: string): Promise<string> => {
  validateNotEmpty(input);

  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (/[,"\n\r]/.test(input)) {
    return `"${input.replace(/"/g, '""')}"`;
  }

  return input;
};
