/**
 * JSON Diff - Structural comparison for JSON objects
 * Understands nested objects, arrays, and provides path tracking
 */

import { validateNotEmpty, validateSizeLimit, JSON_SIZE_LIMIT } from '../shared';
import type { DiffChange, DiffResult } from './diff-engine';

export interface JsonDiffOptions {
  ignoreKeyOrder?: boolean;
  ignoreFormatting?: boolean;
  mode?: 'simple' | 'advanced';
}

/**
 * Perform structural diff on two JSON strings
 *
 * @param mode - 'simple' for top-level comparison only, 'advanced' for deep recursive comparison
 */
export const jsonDiff = async (
  leftJson: string,
  rightJson: string,
  options: JsonDiffOptions = {},
): Promise<DiffResult> => {
  // Validate inputs
  validateNotEmpty(leftJson, 'Left JSON');
  validateNotEmpty(rightJson, 'Right JSON');
  validateSizeLimit(leftJson, JSON_SIZE_LIMIT);
  validateSizeLimit(rightJson, JSON_SIZE_LIMIT);

  // Parse JSON with error handling
  let leftObj: unknown;
  let rightObj: unknown;

  try {
    leftObj = JSON.parse(leftJson);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Invalid JSON on left: ${message}`);
  }

  try {
    rightObj = JSON.parse(rightJson);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Invalid JSON on right: ${message}`);
  }

  // Normalize objects if ignoreKeyOrder or ignoreFormatting is enabled
  if (options.ignoreKeyOrder || options.ignoreFormatting) {
    leftObj = normalizeForComparison(leftObj, options);
    rightObj = normalizeForComparison(rightObj, options);
  }

  // Perform comparison (simple mode: top-level only, advanced mode: deep recursive)
  const changes: DiffChange[] = [];
  const maxDepth = options.mode === 'simple' ? 1 : Infinity;
  compareValues(leftObj, rightObj, '', changes, options, 0, maxDepth);

  // Calculate stats
  const stats = {
    additions: changes.filter((c) => c.type === 'added').length,
    deletions: changes.filter((c) => c.type === 'deleted').length,
    modifications: changes.filter((c) => c.type === 'modified').length,
    unchanged: changes.filter((c) => c.type === 'unchanged').length,
  };

  return { changes, stats };
};

/**
 * Normalize JSON for comparison based on options
 */
function normalizeForComparison(obj: unknown, options: JsonDiffOptions): unknown {
  if (obj === null || obj === undefined) return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => normalizeForComparison(item, options));
  }

  // Handle objects
  if (isObject(obj)) {
    const normalized: Record<string, unknown> = {};

    // Get keys, optionally sorted for ignoreKeyOrder
    const keys = options.ignoreKeyOrder ? Object.keys(obj).sort() : Object.keys(obj);

    for (const key of keys) {
      normalized[key] = normalizeForComparison(obj[key], options);
    }

    return normalized;
  }

  // Handle strings for ignoreFormatting (trim whitespace)
  if (typeof obj === 'string' && options.ignoreFormatting) {
    return obj.trim();
  }

  return obj;
}

/**
 * Recursively compare two values and track differences
 */
function compareValues(
  left: unknown,
  right: unknown,
  path: string,
  changes: DiffChange[],
  options: JsonDiffOptions = {},
  currentDepth: number = 0,
  maxDepth: number = Infinity,
): void {
  // Check if we've reached max depth (simple mode limitation)
  const atMaxDepth = currentDepth >= maxDepth;

  // Both are objects
  if (isObject(left) && isObject(right)) {
    if (atMaxDepth) {
      // Simple mode: treat nested objects as atomic values
      const leftStr = JSON.stringify(left);
      const rightStr = JSON.stringify(right);
      if (leftStr === rightStr) {
        changes.push({
          type: 'unchanged',
          leftContent: formatValue(left, path),
          rightContent: formatValue(right, path),
        });
      } else {
        changes.push({
          type: 'modified',
          leftContent: formatValue(left, path),
          rightContent: formatValue(right, path),
        });
      }
    } else {
      compareObjects(left, right, path, changes, options, currentDepth, maxDepth);
    }
    return;
  }

  // Both are arrays
  if (Array.isArray(left) && Array.isArray(right)) {
    if (atMaxDepth) {
      // Simple mode: treat arrays as atomic values
      const leftStr = JSON.stringify(left);
      const rightStr = JSON.stringify(right);
      if (leftStr === rightStr) {
        changes.push({
          type: 'unchanged',
          leftContent: formatValue(left, path),
          rightContent: formatValue(right, path),
        });
      } else {
        changes.push({
          type: 'modified',
          leftContent: formatValue(left, path),
          rightContent: formatValue(right, path),
        });
      }
    } else {
      compareArrays(left, right, path, changes, options, currentDepth, maxDepth);
    }
    return;
  }

  // Different types or primitive values
  if (left === right) {
    changes.push({
      type: 'unchanged',
      leftContent: formatValue(left, path),
      rightContent: formatValue(right, path),
    });
  } else {
    changes.push({
      type: 'modified',
      leftContent: formatValue(left, path),
      rightContent: formatValue(right, path),
    });
  }
}

/**
 * Compare two objects recursively
 */
function compareObjects(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
  path: string,
  changes: DiffChange[],
  options: JsonDiffOptions = {},
  currentDepth: number = 0,
  maxDepth: number = Infinity,
): void {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  const allKeys = new Set([...leftKeys, ...rightKeys]);

  for (const key of allKeys) {
    const newPath = path ? `${path}.${key}` : key;
    const leftHasKey = key in left;
    const rightHasKey = key in right;

    if (leftHasKey && rightHasKey) {
      // Key exists in both - compare values
      compareValues(left[key], right[key], newPath, changes, options, currentDepth + 1, maxDepth);
    } else if (leftHasKey && !rightHasKey) {
      // Key only in left - deleted
      changes.push({
        type: 'deleted',
        leftContent: formatValue(left[key], newPath),
      });
    } else if (!leftHasKey && rightHasKey) {
      // Key only in right - added
      changes.push({
        type: 'added',
        rightContent: formatValue(right[key], newPath),
      });
    }
  }
}

/**
 * Compare two arrays
 */
function compareArrays(
  left: unknown[],
  right: unknown[],
  path: string,
  changes: DiffChange[],
  options: JsonDiffOptions = {},
  currentDepth: number = 0,
  maxDepth: number = Infinity,
): void {
  const maxLength = Math.max(left.length, right.length);

  for (let i = 0; i < maxLength; i++) {
    const newPath = `${path}[${i}]`;
    const leftHasIndex = i < left.length;
    const rightHasIndex = i < right.length;

    if (leftHasIndex && rightHasIndex) {
      // Both have this index - compare values
      compareValues(left[i], right[i], newPath, changes, options, currentDepth + 1, maxDepth);
    } else if (leftHasIndex && !rightHasIndex) {
      // Only left has this index - deleted
      changes.push({
        type: 'deleted',
        leftContent: formatValue(left[i], newPath),
      });
    } else if (!leftHasIndex && rightHasIndex) {
      // Only right has this index - added
      changes.push({
        type: 'added',
        rightContent: formatValue(right[i], newPath),
      });
    }
  }
}

/**
 * Check if value is a plain object (not array, not null)
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Format a value for display with its path
 */
function formatValue(value: unknown, path: string): string {
  const formattedValue = formatPrimitiveValue(value);
  return path ? `${path}: ${formattedValue}` : formattedValue;
}

/**
 * Format primitive value or short representation of complex types
 */
function formatPrimitiveValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return `Object {${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
  }
  return String(value);
}
