/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * JSON Statistics Calculator
 */

import { JsonStats } from './types';

/**
 * Calculate statistics for JSON data
 */
export const calculateStats = (data: unknown): JsonStats => {
  const stats: JsonStats = {
    size: 0,
    depth: 0,
    objects: 0,
    arrays: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
    totalKeys: 0,
  };

  const traverse = (obj: unknown, currentDepth: number) => {
    stats.depth = Math.max(stats.depth, currentDepth);

    if (obj === null) {
      stats.nulls++;
      return;
    }

    if (Array.isArray(obj)) {
      stats.arrays++;
      obj.forEach((item) => traverse(item, currentDepth + 1));
      return;
    }

    if (typeof obj === 'object') {
      stats.objects++;
      const keys = Object.keys(obj as object);
      stats.totalKeys = (stats.totalKeys || 0) + keys.length;
      keys.forEach((key) => {
        traverse((obj as Record<string, unknown>)[key], currentDepth + 1);
      });
      return;
    }

    if (typeof obj === 'string') {
      stats.strings++;
    } else if (typeof obj === 'number') {
      stats.numbers++;
    } else if (typeof obj === 'boolean') {
      stats.booleans++;
    }
  };

  traverse(data, 0);

  return stats;
};

/**
 * Format file size for display
 */
export const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
};

/**
 * Get stats as formatted strings for display
 */
export const formatStats = (stats: JsonStats): Record<string, string> => {
  return {
    size: formatSize(stats.size),
    depth: `${stats.depth} levels`,
    objects: `${stats.objects} objects`,
    arrays: `${stats.arrays} arrays`,
    strings: `${stats.strings} strings`,
    numbers: `${stats.numbers} numbers`,
    booleans: `${stats.booleans} booleans`,
    nulls: `${stats.nulls} nulls`,
    totalKeys: `${stats.totalKeys || 0} keys`,
  };
};

/**
 * Get summary stats for compact display
 */
export const getSummaryStats = (stats: JsonStats): string => {
  const parts = [];

  if (stats.size > 0) {
    parts.push(formatSize(stats.size));
  }
  parts.push(`Depth: ${stats.depth}`);

  const items = [];
  if (stats.objects > 0) items.push(`${stats.objects} obj`);
  if (stats.arrays > 0) items.push(`${stats.arrays} arr`);
  if (stats.strings > 0) items.push(`${stats.strings} str`);
  if (stats.numbers > 0) items.push(`${stats.numbers} num`);

  if (items.length > 0) {
    parts.push(items.join(', '));
  }

  return parts.join(' | ');
};
