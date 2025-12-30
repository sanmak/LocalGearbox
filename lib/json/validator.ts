/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * JSON Validator
 * Validate JSON syntax with detailed error reporting
 */

import { ValidationResult } from './types';

/**
 * Validate JSON and return detailed result
 */
export const validateJson = (input: string): ValidationResult => {
  if (!input.trim()) {
    return {
      valid: false,
      message: 'Input is empty',
      error: 'Input cannot be empty',
    };
  }

  try {
    JSON.parse(input);
    return {
      valid: true,
      message: 'Valid JSON',
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      const errorInfo = parseJsonError(e.message, input);
      return {
        valid: false,
        message: 'Invalid JSON',
        error: e.message,
        line: errorInfo.line,
        column: errorInfo.column,
      };
    }
    return {
      valid: false,
      message: 'Invalid JSON',
      error: String(e),
    };
  }
};

/**
 * Parse JSON error message to extract line and column
 */
const parseJsonError = (message: string, input: string): { line?: number; column?: number } => {
  // Try to extract position from error message
  // Different browsers/Node versions format this differently

  // Chrome/V8: "... at position 42"
  const positionMatch = message.match(/at position (\d+)/);
  if (positionMatch) {
    const position = parseInt(positionMatch[1]);
    return positionToLineColumn(input, position);
  }

  // Firefox: "... at line 3 column 4"
  const lineColMatch = message.match(/at line (\d+) column (\d+)/);
  if (lineColMatch) {
    return {
      line: parseInt(lineColMatch[1]),
      column: parseInt(lineColMatch[2]),
    };
  }

  return {};
};

/**
 * Convert character position to line and column
 */
const positionToLineColumn = (
  input: string,
  position: number,
): { line: number; column: number } => {
  let line = 1;
  let column = 1;

  for (let i = 0; i < position && i < input.length; i++) {
    if (input[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }

  return { line, column };
};

/**
 * Get the line of code where error occurred
 */
export const getErrorContext = (
  input: string,
  line?: number,
  contextLines = 2,
): { lines: string[]; errorLineIndex: number } => {
  if (!line) {
    return { lines: [], errorLineIndex: -1 };
  }

  const allLines = input.split('\n');
  const startLine = Math.max(0, line - 1 - contextLines);
  const endLine = Math.min(allLines.length, line + contextLines);

  return {
    lines: allLines.slice(startLine, endLine),
    errorLineIndex: line - 1 - startLine,
  };
};

/**
 * Validate JSON with multiple error detection
 * Attempts to find all issues, not just the first one
 */
export const validateJsonMultiple = (
  input: string,
): {
  valid: boolean;
  errors: Array<{ message: string; line?: number; column?: number }>;
} => {
  const errors: Array<{ message: string; line?: number; column?: number }> = [];

  // Basic syntax check
  const result = validateJson(input);
  if (!result.valid) {
    errors.push({
      message: result.error || 'Invalid JSON',
      line: result.line,
      column: result.column,
    });
  }

  // Additional structural checks
  if (result.valid) {
    try {
      const parsed = JSON.parse(input);

      // Check for common issues even in valid JSON
      checkDuplicateKeys(input, errors);
      checkLargeNumbers(parsed, errors);
    } catch {
      // Already caught above
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Check for duplicate keys in JSON
 */
const checkDuplicateKeys = (input: string, errors: Array<{ message: string; line?: number }>) => {
  // Simple regex-based check for potential duplicates
  const keyPattern = /"([^"]+)"\s*:/g;
  const keys: Map<string, number[]> = new Map();
  let match;
  let lineNumber = 1;
  let lastIndex = 0;

  while ((match = keyPattern.exec(input)) !== null) {
    // Count newlines to track line number
    const textBefore = input.slice(lastIndex, match.index);
    lineNumber += (textBefore.match(/\n/g) || []).length;
    lastIndex = match.index;

    const key = match[1];
    if (!keys.has(key)) {
      keys.set(key, []);
    }
    keys.get(key)!.push(lineNumber);
  }

  // Report duplicates
  for (const [key, lines] of keys) {
    if (lines.length > 1) {
      errors.push({
        message: `Duplicate key "${key}" found at lines ${lines.join(', ')}`,
        line: lines[0],
      });
    }
  }
};

/**
 * Check for numbers that might lose precision
 */
const checkLargeNumbers = (data: unknown, errors: Array<{ message: string }>, path = '') => {
  if (typeof data === 'number') {
    if (!Number.isSafeInteger(data) && Number.isInteger(data)) {
      errors.push({
        message: `Large integer at "${path || 'root'}" may lose precision: ${data}`,
      });
    }
  } else if (Array.isArray(data)) {
    data.forEach((item, i) => {
      checkLargeNumbers(item, errors, `${path}[${i}]`);
    });
  } else if (typeof data === 'object' && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      checkLargeNumbers(value, errors, path ? `${path}.${key}` : key);
    });
  }
};
