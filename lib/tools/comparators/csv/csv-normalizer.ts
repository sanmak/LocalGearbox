/**
 * CSV Normalizer - Normalize values for comparison
 */

import { CsvColumnType } from './csv-types';

export interface NormalizeOptions {
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
  type?: CsvColumnType;
}

/**
 * Normalize a cell value for comparison
 */
export function normalizeValue(value: string, options: NormalizeOptions = {}): string {
  let normalized = value;

  // Apply type-specific normalization
  if (options.type) {
    normalized = normalizeByType(normalized, options.type);
  }

  // Apply general normalizations
  if (options.ignoreWhitespace) {
    normalized = normalized.trim();
  }

  if (options.ignoreCase) {
    normalized = normalized.toLowerCase();
  }

  return normalized;
}

/**
 * Normalize value based on inferred type
 */
function normalizeByType(value: string, type: CsvColumnType): string {
  const trimmed = value.trim();

  switch (type) {
    case CsvColumnType.INTEGER:
      try {
        return String(parseInt(trimmed, 10));
      } catch {
        return trimmed;
      }

    case CsvColumnType.FLOAT:
      try {
        // Normalize to 2 decimal places
        return String(parseFloat(trimmed).toFixed(2));
      } catch {
        return trimmed;
      }

    case CsvColumnType.BOOLEAN:
      return normalizeBoolean(trimmed);

    case CsvColumnType.DATE:
      return normalizeDate(trimmed);

    case CsvColumnType.NULL:
      return '';

    default:
      return trimmed;
  }
}

/**
 * Normalize boolean values
 */
function normalizeBoolean(value: string): string {
  const lower = value.toLowerCase();
  const truthyValues = ['true', '1', 'yes', 'on', 't', 'y'];
  return truthyValues.includes(lower) ? 'true' : 'false';
}

/**
 * Normalize date values to ISO format
 */
function normalizeDate(value: string): string {
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }
    // Return YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  } catch {
    return value;
  }
}

/**
 * Remove quotes from a value if present
 */
export function removeQuotes(value: string, quoteChar: string = '"'): string {
  const trimmed = value.trim();
  if (trimmed.startsWith(quoteChar) && trimmed.endsWith(quoteChar) && trimmed.length >= 2) {
    return trimmed.slice(1, -1).replace(new RegExp(quoteChar + quoteChar, 'g'), quoteChar);
  }
  return value;
}

/**
 * Normalize an entire row
 */
export function normalizeRow(row: string[], options: NormalizeOptions = {}): string[] {
  return row.map((cell) => normalizeValue(cell, options));
}
