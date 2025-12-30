/**
 * CSV Heuristics - Delimiter detection, header detection, type inference
 */

import { CsvColumnType } from './csv-types';
import type { DelimiterScore } from './csv-types';

/**
 * Detect the most likely delimiter in a CSV string
 */
export function detectDelimiter(csv: string): DelimiterScore[] {
  const candidates = [',', '\t', '|', ';', ':'];
  const lines = csv.split('\n').slice(0, 50); // Sample first 50 lines

  // Filter out empty lines
  const sampleLines = lines.filter((line) => line.trim() !== '');

  if (sampleLines.length === 0) {
    return [{ delimiter: ',', confidence: 0, consistency: 0, sampleSize: 0 }];
  }

  const scores = candidates.map((delimiter) => {
    const counts = sampleLines.map((line) => countDelimiters(line, delimiter));

    // Calculate statistics
    const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);

    // Consistency: lower variance = higher score
    const consistency = variance === 0 && mean > 0 ? 1 : mean > 0 ? 1 / (1 + stdDev / mean) : 0;

    // Frequency: more delimiters = higher confidence (but plateaus)
    const frequency = mean / (mean + 5); // Sigmoid-like

    // Combined score: consistency is more important than frequency
    const confidence = consistency * 0.7 + frequency * 0.3;

    return {
      delimiter,
      confidence,
      consistency,
      sampleSize: sampleLines.length,
    };
  });

  return scores.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Count delimiters in a line, respecting quotes
 */
function countDelimiters(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;
  const quoteChar = '"';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === quoteChar) {
      if (nextChar === quoteChar) {
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      count++;
    }
  }

  return count;
}

/**
 * Detect if first row is a header
 */
export function detectHeader(rows: string[][]): boolean {
  if (rows.length < 2) {
    return false;
  }

  const firstRow = rows[0];
  const dataRows = rows.slice(1, Math.min(11, rows.length)); // Sample next 10 rows

  let score = 0;

  // Heuristic 1: First row has no duplicates (headers are unique)
  const firstRowUnique = new Set(firstRow).size === firstRow.length;
  if (firstRowUnique && firstRow.length > 1) {
    score += 3;
  }

  // Heuristic 2: First row is all strings, data rows have numbers
  const firstRowAllStrings = firstRow.every((cell) => {
    const trimmed = cell.trim();
    return trimmed !== '' && isNaN(Number(trimmed));
  });
  const dataHasNumbers = dataRows.some((row) => row.some((cell) => !isNaN(Number(cell.trim()))));

  if (firstRowAllStrings && dataHasNumbers) {
    score += 2;
  }

  // Heuristic 3: First row has typical header patterns
  const headerPatterns = [
    /^[A-Z][a-z]+([A-Z][a-z]+)*$/, // PascalCase
    /^[a-z]+([A-Z][a-z]+)*$/, // camelCase
    /^[a-z_]+$/, // snake_case
    /^[A-Z_]+$/, // UPPER_SNAKE_CASE
    /^[a-zA-Z][a-zA-Z0-9\s_-]*$/, // General identifier
  ];

  const firstRowLooksLikeHeaders = firstRow.some((cell) =>
    headerPatterns.some((pattern) => pattern.test(cell.trim())),
  );

  if (firstRowLooksLikeHeaders) {
    score += 1;
  }

  // Heuristic 4: Check if first row has much less numeric content than data rows
  const firstRowNumericRatio =
    firstRow.filter((cell) => !isNaN(Number(cell.trim())) && cell.trim() !== '').length /
    firstRow.length;
  const dataRowsNumericRatio =
    dataRows.reduce((sum, row) => {
      return (
        sum +
        row.filter((cell) => !isNaN(Number(cell.trim())) && cell.trim() !== '').length / row.length
      );
    }, 0) / dataRows.length;

  if (dataRowsNumericRatio > firstRowNumericRatio + 0.2) {
    score += 2;
  }

  return score >= 3;
}

/**
 * Infer column type from sample values
 */
export function inferColumnType(values: string[]): CsvColumnType {
  // Filter out empty values
  const sample = values.filter((v) => v.trim() !== '').slice(0, 100);

  if (sample.length === 0) {
    return CsvColumnType.NULL;
  }

  // Check for 100% match patterns (strict)
  if (sample.every(isInteger)) return CsvColumnType.INTEGER;
  if (sample.every(isFloat)) return CsvColumnType.FLOAT;
  if (sample.every(isBoolean)) return CsvColumnType.BOOLEAN;
  if (sample.every(isISODate)) return CsvColumnType.DATE;

  // Check for high percentage match (90%+)
  const intCount = sample.filter(isInteger).length;
  if (intCount / sample.length >= 0.9) return CsvColumnType.INTEGER;

  const floatCount = sample.filter(isFloat).length;
  if (floatCount / sample.length >= 0.9) return CsvColumnType.FLOAT;

  const boolCount = sample.filter(isBoolean).length;
  if (boolCount / sample.length >= 0.9) return CsvColumnType.BOOLEAN;

  const dateCount = sample.filter(isISODate).length;
  if (dateCount / sample.length >= 0.9) return CsvColumnType.DATE;

  // Check for mixed types
  const types = new Set(sample.map(inferSingleType));
  if (types.size > 1) return CsvColumnType.MIXED;

  return CsvColumnType.STRING;
}

function inferSingleType(value: string): CsvColumnType {
  if (isInteger(value)) return CsvColumnType.INTEGER;
  if (isFloat(value)) return CsvColumnType.FLOAT;
  if (isBoolean(value)) return CsvColumnType.BOOLEAN;
  if (isISODate(value)) return CsvColumnType.DATE;
  return CsvColumnType.STRING;
}

/**
 * Type checking functions
 */
function isInteger(value: string): boolean {
  const trimmed = value.trim();
  return /^-?\d+$/.test(trimmed);
}

function isFloat(value: string): boolean {
  const trimmed = value.trim();
  return /^-?\d+\.\d+$/.test(trimmed) || /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(trimmed);
}

function isBoolean(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'].includes(trimmed);
}

function isISODate(value: string): boolean {
  const trimmed = value.trim();
  // ISO 8601 patterns
  const isoPatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // YYYY-MM-DDTHH:MM:SS
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
  ];

  if (!isoPatterns.some((pattern) => pattern.test(trimmed))) {
    return false;
  }

  // Validate it's actually a valid date
  const date = new Date(trimmed);
  return !isNaN(date.getTime());
}

/**
 * Compute string similarity (Levenshtein distance normalized)
 */
export function computeStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Compute Jaccard similarity for row matching
 */
export function computeJaccardSimilarity(row1: string[], row2: string[]): number {
  const normalize = (s: string) => s.trim().toLowerCase();
  const set1 = new Set(row1.map(normalize));
  const set2 = new Set(row2.map(normalize));

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) {
    return 0;
  }

  return intersection.size / union.size;
}
