/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Converters - Data format conversion utilities
 * Pure conversion functions (JSON to CSV, etc.)
 */

import { validateInput, JSON_SIZE_LIMIT } from '../shared';

/**
 * Converts JSON to CSV
 */
export const jsonToCSV = async (input: string): Promise<string> => {
  validateInput(input, JSON_SIZE_LIMIT);

  try {
    const data = JSON.parse(input);

    if (!Array.isArray(data)) {
      throw new Error('JSON must be an array of objects');
    }

    if (data.length === 0) {
      throw new Error('JSON array is empty');
    }

    // Get all unique keys from all objects
    const keys = Array.from(new Set(data.flatMap((obj) => Object.keys(obj))));

    // Create CSV header
    const header = keys.join(',');

    // Create CSV rows
    const rows = data.map((obj) => {
      return keys
        .map((key) => {
          const value = obj[key];
          if (value === null || value === undefined) {
            return '';
          }
          // Escape CSV values
          const stringValue = String(value);
          if (/[,"\n\r]/.test(stringValue)) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',');
    });

    return [header, ...rows].join('\n');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to convert JSON to CSV');
  }
};
