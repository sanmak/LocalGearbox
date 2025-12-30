/**
 * Data Diff Tool - Main entry point for diff operations
 * Supports JSON, CSV, and text comparison with simple and advanced modes
 */

import { diffLines, diffChars, type DiffResult, type DiffOptions } from './diff-engine';
import { jsonDiff, type JsonDiffOptions } from './json-diff';
import { csvDiff, type CsvDiffResult } from './csv/csv-diff';
import type { CsvDiffOptions } from './csv/csv-types';
import { validateDiffInputs } from './shared';

export interface DiffConfig {
  left: string;
  right: string;
  mode: 'simple' | 'advanced';
  format: 'json' | 'csv' | 'text';
  options?: DiffOptions & CsvDiffOptions & JsonDiffOptions;
}

/**
 * Main diff processor - routes to appropriate diff function based on format and mode
 */
export const dataDiff = async (config: DiffConfig): Promise<DiffResult | CsvDiffResult> => {
  const { left, right, mode, format, options = {} } = config;

  // Validate inputs
  validateDiffInputs(left, right);

  // Route to appropriate diff function
  if (format === 'json') {
    // JSON mode: simple = top-level only, advanced = deep recursive comparison
    return jsonDiff(left, right, { ...options, mode });
  } else if (format === 'csv') {
    // CSV mode: simple = row-level only, advanced = cell-by-cell + schema changes
    return csvDiff(left, right, { ...options, mode });
  } else {
    // Text mode: simple = line-by-line, advanced = character-level
    return mode === 'advanced' ? diffChars(left, right) : diffLines(left, right, options);
  }
};

// Re-export types and utilities
export type { DiffResult, DiffChange, DiffOptions } from './diff-engine';
export type { JsonDiffOptions } from './json-diff';
export type { CsvDiffResult, CsvDiffOptions } from './csv/csv-diff';
export type { SchemaChange } from './csv/csv-types';
export type { DetectedFormat, FormatDetectionResult } from './format-detector';
export { diffLines, diffChars } from './diff-engine';
export { jsonDiff } from './json-diff';
export { csvDiff } from './csv/csv-diff';
export { validateDiffInputs, DIFF_SIZE_LIMIT } from './shared';
export { detectFormat, detectFormatFromPair } from './format-detector';
