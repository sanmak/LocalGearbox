/**
 * CSV Diff - Table-aware diff algorithm for CSV files
 */

import type { DiffResult, DiffChange } from '../diff-engine';
import { RowMatchStrategy } from './csv-types';
import type {
  CsvDiffOptions,
  RowMatch,
  RowMatchConfig,
  CellChange,
  SchemaChange,
  CsvSchema,
} from './csv-types';
import { parseCSV, formatRow } from './csv-parser';
import { compareSchemas, buildColumnMapping } from './csv-schema';
import { normalizeValue } from './csv-normalizer';
import { computeJaccardSimilarity } from './csv-heuristics';

/**
 * Extended DiffResult with CSV-specific metadata
 */
export interface CsvDiffResult extends DiffResult {
  schemaChanges?: SchemaChange[];
}

// Re-export CsvDiffOptions for use in other modules
export type { CsvDiffOptions } from './csv-types';

/**
 * Main CSV diff function
 *
 * @param mode - 'simple' for row-level comparison only, 'advanced' for cell-by-cell + schema changes
 */
export async function csvDiff(
  leftCsv: string,
  rightCsv: string,
  options: CsvDiffOptions = {},
): Promise<CsvDiffResult> {
  // Parse both CSVs
  const leftParsed = parseCSV(leftCsv, {
    delimiter: options.delimiter,
    hasHeader: options.hasHeader,
  });

  const rightParsed = parseCSV(rightCsv, {
    delimiter: options.delimiter,
    hasHeader: options.hasHeader,
  });

  // Compare schemas (only in advanced mode)
  const schemaChanges =
    options.mode !== 'simple'
      ? compareSchemas(leftParsed.schema, rightParsed.schema, {
          detectRenames: options.detectRenames,
        })
      : [];

  // Build column mapping (handles reordering)
  const columnMapping = buildColumnMapping(leftParsed.schema, rightParsed.schema);

  // Prepare data rows (skip header if present and ignoreHeader is true)
  const leftRows =
    leftParsed.metadata.hasHeader && options.ignoreHeader
      ? leftParsed.rows.slice(1)
      : leftParsed.rows;

  const rightRows =
    rightParsed.metadata.hasHeader && options.ignoreHeader
      ? rightParsed.rows.slice(1)
      : rightParsed.rows;

  // Determine row matching strategy
  const matchStrategy: RowMatchStrategy =
    options.matchStrategy ||
    (options.keyColumns ? RowMatchStrategy.PRIMARY_KEY : RowMatchStrategy.POSITION);

  const matchConfig: RowMatchConfig = {
    strategy: matchStrategy,
    keyColumns: options.keyColumns,
  };

  // Match rows
  const rowMatches = matchRows(
    leftRows,
    rightRows,
    matchConfig,
    leftParsed.schema,
    rightParsed.schema,
  );

  // Compare matched rows cell-by-cell
  const changes: DiffChange[] = [];
  const stats = {
    additions: 0,
    deletions: 0,
    modifications: 0,
    unchanged: 0,
    total: 0,
  };

  const leftDelimiter = leftParsed.metadata.delimiter;
  const rightDelimiter = rightParsed.metadata.delimiter;

  for (const match of rowMatches) {
    if (match.type === 'added') {
      const rightRow = rightRows[match.rightIndex!];
      changes.push({
        type: 'added',
        rightLineNumber: match.rightIndex! + 1,
        rightContent: formatRow(rightRow, rightDelimiter),
      });
      stats.additions++;
    } else if (match.type === 'deleted') {
      const leftRow = leftRows[match.leftIndex!];
      changes.push({
        type: 'deleted',
        leftLineNumber: match.leftIndex! + 1,
        leftContent: formatRow(leftRow, leftDelimiter),
      });
      stats.deletions++;
    } else if (match.type === 'modified') {
      const leftRow = leftRows[match.leftIndex!];
      const rightRow = rightRows[match.rightIndex!];

      // In simple mode, skip cell-by-cell comparison - just mark as modified
      if (options.mode === 'simple') {
        changes.push({
          type: 'modified',
          leftLineNumber: match.leftIndex! + 1,
          rightLineNumber: match.rightIndex! + 1,
          leftContent: formatRow(leftRow, leftDelimiter),
          rightContent: formatRow(rightRow, rightDelimiter),
        });
        stats.modifications++;
      } else {
        // Advanced mode: perform detailed cell-by-cell comparison
        const cellChanges = compareRowCells(
          leftRow,
          rightRow,
          columnMapping,
          leftParsed.schema,
          options,
        );

        if (cellChanges.length > 0) {
          changes.push({
            type: 'modified',
            leftLineNumber: match.leftIndex! + 1,
            rightLineNumber: match.rightIndex! + 1,
            leftContent: formatRow(leftRow, leftDelimiter),
            rightContent: formatRow(rightRow, rightDelimiter),
          });
          stats.modifications++;
        } else {
          // Rows are actually identical after normalization
          changes.push({
            type: 'unchanged',
            leftLineNumber: match.leftIndex! + 1,
            rightLineNumber: match.rightIndex! + 1,
            leftContent: formatRow(leftRow, leftDelimiter),
            rightContent: formatRow(rightRow, rightDelimiter),
          });
          stats.unchanged++;
        }
      }
    } else {
      // Unchanged
      const leftRow = leftRows[match.leftIndex!];
      const rightRow = rightRows[match.rightIndex!];
      changes.push({
        type: 'unchanged',
        leftLineNumber: match.leftIndex! + 1,
        rightLineNumber: match.rightIndex! + 1,
        leftContent: formatRow(leftRow, leftDelimiter),
        rightContent: formatRow(rightRow, rightDelimiter),
      });
      stats.unchanged++;
    }
  }

  stats.total = stats.additions + stats.deletions + stats.modifications + stats.unchanged;

  return {
    changes,
    stats,
    schemaChanges,
  };
}

/**
 * Match rows using configured strategy
 */
function matchRows(
  leftRows: string[][],
  rightRows: string[][],
  config: RowMatchConfig,
  leftSchema: CsvSchema,
  rightSchema: CsvSchema,
): RowMatch[] {
  switch (config.strategy) {
    case RowMatchStrategy.POSITION:
      return matchByPosition(leftRows, rightRows);

    case RowMatchStrategy.PRIMARY_KEY:
      return matchByPrimaryKey(leftRows, rightRows, config.keyColumns!, leftSchema, rightSchema);

    case RowMatchStrategy.FUZZY:
      return matchByFuzzyHash(leftRows, rightRows, config.similarityThreshold || 0.8);

    default:
      return matchByPosition(leftRows, rightRows);
  }
}

/**
 * Match rows by position (default strategy)
 */
function matchByPosition(leftRows: string[][], rightRows: string[][]): RowMatch[] {
  const matches: RowMatch[] = [];
  const maxLength = Math.max(leftRows.length, rightRows.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < leftRows.length && i < rightRows.length) {
      const isEqual = rowsEqual(leftRows[i], rightRows[i]);
      matches.push({
        leftIndex: i,
        rightIndex: i,
        type: isEqual ? 'unchanged' : 'modified',
      });
    } else if (i < leftRows.length) {
      matches.push({ leftIndex: i, type: 'deleted' });
    } else {
      matches.push({ rightIndex: i, type: 'added' });
    }
  }

  return matches;
}

/**
 * Match rows by primary key
 */
function matchByPrimaryKey(
  leftRows: string[][],
  rightRows: string[][],
  keyColumns: string[],
  leftSchema: CsvSchema,
  rightSchema: CsvSchema,
): RowMatch[] {
  // Build hash maps for O(1) lookup
  const leftMap = new Map<string, { row: string[]; index: number }>();
  const rightMap = new Map<string, { row: string[]; index: number }>();

  // Get column indices from schema
  const leftKeyIndices = keyColumns
    .map((name) => leftSchema.columns.findIndex((col) => col.name === name))
    .filter((idx) => idx !== -1);

  const rightKeyIndices = keyColumns
    .map((name) => rightSchema.columns.findIndex((col) => col.name === name))
    .filter((idx) => idx !== -1);

  // Build left map
  for (let i = 0; i < leftRows.length; i++) {
    const key = computeRowKey(leftRows[i], leftKeyIndices);
    leftMap.set(key, { row: leftRows[i], index: i });
  }

  // Build right map
  for (let i = 0; i < rightRows.length; i++) {
    const key = computeRowKey(rightRows[i], rightKeyIndices);
    rightMap.set(key, { row: rightRows[i], index: i });
  }

  const matches: RowMatch[] = [];
  const processedRight = new Set<string>();

  // Find matches and modifications
  for (const [key, leftData] of leftMap) {
    const rightData = rightMap.get(key);
    if (rightData) {
      const isEqual = rowsEqual(leftData.row, rightData.row);
      matches.push({
        leftIndex: leftData.index,
        rightIndex: rightData.index,
        type: isEqual ? 'unchanged' : 'modified',
        key,
      });
      processedRight.add(key);
    } else {
      matches.push({ leftIndex: leftData.index, type: 'deleted', key });
    }
  }

  // Find additions
  for (const [key, rightData] of rightMap) {
    if (!processedRight.has(key)) {
      matches.push({ rightIndex: rightData.index, type: 'added', key });
    }
  }

  // Sort by original index for consistent output
  return matches.sort((a, b) => {
    const aIdx = a.leftIndex !== undefined ? a.leftIndex : a.rightIndex!;
    const bIdx = b.leftIndex !== undefined ? b.leftIndex : b.rightIndex!;
    return aIdx - bIdx;
  });
}

/**
 * Compute row key from specified columns
 */
function computeRowKey(row: string[], keyIndices: number[]): string {
  return keyIndices.map((idx) => (row[idx] || '').trim().toLowerCase()).join('|');
}

/**
 * Match rows by fuzzy similarity
 */
function matchByFuzzyHash(
  leftRows: string[][],
  rightRows: string[][],
  threshold: number,
): RowMatch[] {
  const matches: RowMatch[] = [];
  const usedRight = new Set<number>();

  for (let i = 0; i < leftRows.length; i++) {
    let bestMatch: { index: number; similarity: number } | null = null;

    for (let j = 0; j < rightRows.length; j++) {
      if (usedRight.has(j)) continue;

      const similarity = computeJaccardSimilarity(leftRows[i], rightRows[j]);
      if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { index: j, similarity };
      }
    }

    if (bestMatch) {
      matches.push({
        leftIndex: i,
        rightIndex: bestMatch.index,
        type: bestMatch.similarity === 1 ? 'unchanged' : 'modified',
        similarity: bestMatch.similarity,
      });
      usedRight.add(bestMatch.index);
    } else {
      matches.push({ leftIndex: i, type: 'deleted' });
    }
  }

  // Remaining right rows are additions
  for (let j = 0; j < rightRows.length; j++) {
    if (!usedRight.has(j)) {
      matches.push({ rightIndex: j, type: 'added' });
    }
  }

  return matches;
}

/**
 * Compare two rows to check if they're equal
 */
function rowsEqual(row1: string[], row2: string[]): boolean {
  if (row1.length !== row2.length) {
    return false;
  }

  for (let i = 0; i < row1.length; i++) {
    if ((row1[i] || '').trim() !== (row2[i] || '').trim()) {
      return false;
    }
  }

  return true;
}

/**
 * Compare cells in matched rows
 */
function compareRowCells(
  leftRow: string[],
  rightRow: string[],
  columnMapping: Map<number, number>,
  leftSchema: CsvSchema,
  options: CsvDiffOptions,
): CellChange[] {
  const cellChanges: CellChange[] = [];

  for (const [leftColIdx, rightColIdx] of columnMapping) {
    const leftValue = leftRow[leftColIdx] || '';
    const rightValue = rightRow[rightColIdx] || '';

    const leftNormalized = normalizeValue(leftValue, {
      ignoreWhitespace: options.ignoreWhitespace,
      ignoreCase: options.ignoreCase,
      type: leftSchema.columns[leftColIdx]?.type,
    });

    const rightNormalized = normalizeValue(rightValue, {
      ignoreWhitespace: options.ignoreWhitespace,
      ignoreCase: options.ignoreCase,
      type: leftSchema.columns[leftColIdx]?.type,
    });

    if (leftNormalized !== rightNormalized) {
      cellChanges.push({
        column: leftColIdx,
        columnName: leftSchema.columns[leftColIdx]?.name,
        oldValue: leftValue,
        newValue: rightValue,
      });
    }
  }

  return cellChanges;
}
