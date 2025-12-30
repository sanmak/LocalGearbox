/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * JSON Escaper
 * Escape and unescape JSON strings
 */

/**
 * Escape a string for use in JSON
 */
export const escapeJsonString = (input: string): string => {
  // Use JSON.stringify to escape, then remove outer quotes
  const escaped = JSON.stringify(input);
  return escaped.slice(1, -1);
};

/**
 * Unescape a JSON escaped string
 */
export const unescapeJsonString = (input: string): string => {
  try {
    // Add quotes and parse to unescape
    return JSON.parse(`"${input}"`);
  } catch {
    // If that fails, try common unescapes manually
    return input
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\b/g, '\b')
      .replace(/\\f/g, '\f');
  }
};

/**
 * Escape JSON for embedding in JavaScript string
 */
export const escapeForJavaScript = (json: string): string => {
  return JSON.stringify(json);
};

/**
 * Unescape JSON that was embedded in JavaScript string
 */
export const unescapeFromJavaScript = (input: string): string => {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
};

/**
 * Escape JSON for use in HTML attribute
 */
export const escapeForHtmlAttribute = (json: string): string => {
  return json
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * Unescape JSON from HTML attribute
 */
export const unescapeFromHtmlAttribute = (input: string): string => {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
};

/**
 * Escape JSON for use in URL query parameter
 */
export const escapeForUrl = (json: string): string => {
  return encodeURIComponent(json);
};

/**
 * Unescape JSON from URL query parameter
 */
export const unescapeFromUrl = (input: string): string => {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
};

/**
 * Detect if string is escaped
 */
export const detectEscapeType = (
  input: string,
): 'javascript' | 'html' | 'url' | 'json' | 'none' => {
  // Check for JavaScript string escaping (starts and ends with quotes)
  if (
    (input.startsWith('"') && input.endsWith('"')) ||
    (input.startsWith("'") && input.endsWith("'"))
  ) {
    try {
      JSON.parse(input);
      return 'javascript';
    } catch {
      // Not valid JS string
    }
  }

  // Check for HTML entities
  if (/&(quot|amp|lt|gt|#\d+);/.test(input)) {
    return 'html';
  }

  // Check for URL encoding
  if (/%[0-9A-Fa-f]{2}/.test(input)) {
    return 'url';
  }

  // Check for JSON escape sequences
  if (/\\[nrtbf"\\\/]|\\u[0-9A-Fa-f]{4}/.test(input)) {
    return 'json';
  }

  return 'none';
};

/**
 * Auto-detect and unescape
 */
export const autoUnescape = (input: string): { output: string; type: string } => {
  const type = detectEscapeType(input);

  switch (type) {
    case 'javascript':
      return {
        output: unescapeFromJavaScript(input),
        type: 'JavaScript string',
      };
    case 'html':
      return {
        output: unescapeFromHtmlAttribute(input),
        type: 'HTML entities',
      };
    case 'url':
      return { output: unescapeFromUrl(input), type: 'URL encoding' };
    case 'json':
      return {
        output: unescapeJsonString(input),
        type: 'JSON escape sequences',
      };
    default:
      return { output: input, type: 'No escaping detected' };
  }
};
