/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * JSON Sorter
 * Sort JSON by keys or field values
 */

import { SortDirection } from './types';

/**
 * Sort object keys recursively
 */
export const sortKeys = (obj: unknown, direction: SortDirection = 'asc'): unknown => {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sortKeys(item, direction));
  }

  const keys = Object.keys(obj as object);
  const sortedKeys = direction === 'asc' ? keys.sort() : keys.sort().reverse();

  const sorted: Record<string, unknown> = {};
  sortedKeys.forEach((key) => {
    sorted[key] = sortKeys((obj as Record<string, unknown>)[key], direction);
  });

  return sorted;
};

/**
 * Sort array of objects by a field
 */
export const sortByField = (
  data: unknown,
  field: string,
  direction: SortDirection = 'asc',
): unknown => {
  if (!Array.isArray(data)) {
    // If it's an object, check if any value is an array we can sort
    if (typeof data === 'object' && data !== null) {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = sortByField(value, field, direction);
      }
      return result;
    }
    return data;
  }

  // Sort the array by the specified field
  return [...data].sort((a, b) => {
    const aVal = getNestedValue(a, field);
    const bVal = getNestedValue(b, field);

    // Handle null/undefined
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return direction === 'asc' ? 1 : -1;
    if (bVal == null) return direction === 'asc' ? -1 : 1;

    // Compare values
    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal));
    }

    return direction === 'asc' ? comparison : -comparison;
  });
};

/**
 * Get nested value from object using dot notation
 */
const getNestedValue = (obj: unknown, path: string): unknown => {
  if (obj === null || typeof obj !== 'object') return undefined;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
};

/**
 * Extract all field names from JSON (for UI dropdown)
 */
export const extractFieldNames = (data: unknown): string[] => {
  const fields = new Set<string>();

  const extract = (obj: unknown, prefix = '') => {
    if (obj === null || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach((item) => extract(item, prefix));
      return;
    }

    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      fields.add(key);

      // Only add nested paths for primitive values
      if (value !== null && typeof value === 'object') {
        extract(value, fullPath);
      } else if (prefix) {
        fields.add(fullPath);
      }
    });
  };

  extract(data);
  return Array.from(fields).sort();
};

/**
 * Check if data contains sortable arrays
 */
export const hasSortableArrays = (data: unknown): boolean => {
  if (Array.isArray(data) && data.length > 0) {
    return typeof data[0] === 'object' && data[0] !== null;
  }

  if (typeof data === 'object' && data !== null) {
    for (const value of Object.values(data)) {
      if (hasSortableArrays(value)) return true;
    }
  }

  return false;
};
