/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * JSON Search utilities
 * Fuzzy search, related values finder
 */

import { SearchResult } from './types';

/**
 * Fuzzy match a pattern against a string
 */
export const fuzzyMatch = (pattern: string, str: string): boolean => {
  const patternLower = pattern.toLowerCase();
  const strLower = str.toLowerCase();

  // Direct substring match
  if (strLower.includes(patternLower)) return true;

  // Fuzzy character match
  let patternIdx = 0;
  for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
    if (strLower[i] === patternLower[patternIdx]) {
      patternIdx++;
    }
  }
  return patternIdx === patternLower.length;
};

/**
 * Search through JSON data
 */
export const searchJson = (
  data: unknown,
  query: string,
  path = '',
  maxResults = 100,
): SearchResult[] => {
  const results: SearchResult[] = [];
  if (!query.trim()) return results;

  const search = (obj: unknown, currentPath: string) => {
    if (results.length >= maxResults) return;

    if (obj === null) {
      if (fuzzyMatch(query, 'null')) {
        results.push({
          path: currentPath,
          key: currentPath.split('.').pop() || '',
          value: null,
          type: 'null',
          matchType: 'value',
        });
      }
      return;
    }

    if (typeof obj !== 'object') {
      const strValue = String(obj);
      if (fuzzyMatch(query, strValue)) {
        results.push({
          path: currentPath,
          key: currentPath.split('.').pop() || '',
          value: obj,
          type: typeof obj,
          matchType: 'value',
        });
      }
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        search(item, `${currentPath}[${index}]`);
      });
      return;
    }

    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      if (results.length >= maxResults) return;

      const newPath = currentPath ? `${currentPath}.${key}` : key;

      // Match on key
      if (fuzzyMatch(query, key)) {
        results.push({
          path: newPath,
          key,
          value,
          type: typeof value,
          matchType: 'key',
        });
      }

      // Match on path
      if (fuzzyMatch(query, newPath) && !fuzzyMatch(query, key)) {
        results.push({
          path: newPath,
          key,
          value,
          type: typeof value,
          matchType: 'path',
        });
      }

      search(value, newPath);
    });
  };

  search(data, path);
  return results.slice(0, maxResults);
};

/**
 * Find all related values for a key
 */
export const findRelatedValues = (
  data: unknown,
  targetKey: string,
): { path: string; value: unknown }[] => {
  const results: { path: string; value: unknown }[] = [];

  const search = (obj: unknown, currentPath: string) => {
    if (obj === null || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        search(item, `${currentPath}[${index}]`);
      });
      return;
    }

    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      const newPath = currentPath ? `${currentPath}.${key}` : key;

      if (key === targetKey) {
        results.push({ path: newPath, value });
      }

      if (typeof value === 'object' && value !== null) {
        search(value, newPath);
      }
    });
  };

  search(data, '');
  return results;
};

/**
 * Get value at a path in JSON
 */
export const getValueAtPath = (data: unknown, path: string): unknown | undefined => {
  if (!path) return data;

  const parts = path.split(/\.|\[(\d+)\]/).filter(Boolean);
  let current: unknown = data;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;

    if (Array.isArray(current)) {
      const index = parseInt(part);
      if (isNaN(index)) return undefined;
      current = current[index];
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current;
};

/**
 * Extract all unique keys from JSON
 */
export const extractAllKeys = (data: unknown): string[] => {
  const keys = new Set<string>();

  const extract = (obj: unknown) => {
    if (obj === null || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach(extract);
      return;
    }

    Object.keys(obj as object).forEach((key) => {
      keys.add(key);
      extract((obj as Record<string, unknown>)[key]);
    });
  };

  extract(data);
  return Array.from(keys).sort();
};
