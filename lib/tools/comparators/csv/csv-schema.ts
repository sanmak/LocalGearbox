/**
 * CSV Schema - Schema analysis, column mapping, and comparison
 */

import type { CsvSchema, ColumnDefinition, SchemaChange, ColumnRename } from './csv-types';
import { detectHeader, inferColumnType, computeStringSimilarity } from './csv-heuristics';

/**
 * Build schema from parsed rows
 */
export function buildSchema(rows: string[][], hasHeaderOverride?: boolean): CsvSchema {
  if (rows.length === 0) {
    return { columns: [] };
  }

  // Detect if first row is header
  const hasHeader = hasHeaderOverride !== undefined ? hasHeaderOverride : detectHeader(rows);

  const headerRow = hasHeader ? 0 : undefined;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  // Determine column count (max across all rows)
  const columnCount = Math.max(...rows.map((row) => row.length));

  // Build column definitions
  const columns: ColumnDefinition[] = [];

  for (let i = 0; i < columnCount; i++) {
    const name =
      hasHeader && rows[0][i] ? rows[0][i].trim() : `Column ${String.fromCharCode(65 + i)}`;

    // Collect samples from data rows
    const samples: string[] = [];
    for (let j = 0; j < Math.min(dataRows.length, 10); j++) {
      const value = dataRows[j]?.[i] || '';
      if (value.trim() !== '') {
        samples.push(value);
      }
    }

    // Infer type from all values in this column
    const allValues = dataRows.map((row) => row[i] || '').filter((v) => v.trim() !== '');
    const type = inferColumnType(allValues);

    columns.push({
      index: i,
      name,
      type,
      samples,
    });
  }

  return {
    columns,
    headerRow,
  };
}

/**
 * Compare two schemas and detect changes
 */
export function compareSchemas(
  leftSchema: CsvSchema,
  rightSchema: CsvSchema,
  options: { detectRenames?: boolean } = {},
): SchemaChange[] {
  const changes: SchemaChange[] = [];

  // Build column mapping by name (for headers) or by position
  const leftColsByName = new Map(leftSchema.columns.map((col) => [col.name, col]));
  const rightColsByName = new Map(rightSchema.columns.map((col) => [col.name, col]));

  const processedRight = new Set<string>();

  // Detect deletions, reorderings, and type changes
  for (const leftCol of leftSchema.columns) {
    const rightCol = rightColsByName.get(leftCol.name);

    if (!rightCol) {
      changes.push({
        type: 'column_deleted',
        column: leftCol.name,
        leftIndex: leftCol.index,
      });
    } else {
      processedRight.add(leftCol.name);

      // Check for reordering
      if (leftCol.index !== rightCol.index) {
        changes.push({
          type: 'column_reordered',
          column: leftCol.name,
          leftIndex: leftCol.index,
          rightIndex: rightCol.index,
        });
      }

      // Check for type changes
      if (leftCol.type !== rightCol.type) {
        changes.push({
          type: 'column_type_changed',
          column: leftCol.name,
          leftIndex: leftCol.index,
          rightIndex: rightCol.index,
          oldType: leftCol.type,
          newType: rightCol.type,
        });
      }
    }
  }

  // Detect additions
  const addedColumns: ColumnDefinition[] = [];
  for (const rightCol of rightSchema.columns) {
    if (!processedRight.has(rightCol.name)) {
      addedColumns.push(rightCol);
      changes.push({
        type: 'column_added',
        column: rightCol.name,
        rightIndex: rightCol.index,
      });
    }
  }

  // Detect renames if requested
  if (options.detectRenames) {
    const deletedColumns = leftSchema.columns.filter((col) => !rightColsByName.has(col.name));

    const renames = detectColumnRenames(deletedColumns, addedColumns);

    // Replace delete+add with rename
    for (const rename of renames) {
      const deleteIdx = changes.findIndex(
        (c) => c.type === 'column_deleted' && c.column === rename.oldName,
      );
      const addIdx = changes.findIndex(
        (c) => c.type === 'column_added' && c.column === rename.newName,
      );

      if (deleteIdx !== -1 && addIdx !== -1) {
        changes.splice(deleteIdx, 1);
        changes.splice(addIdx > deleteIdx ? addIdx - 1 : addIdx, 1);

        changes.push({
          type: 'column_renamed',
          column: rename.oldName,
          leftIndex: leftColsByName.get(rename.oldName)?.index,
          rightIndex: rightColsByName.get(rename.newName)?.index,
          confidence: rename.confidence,
        });
      }
    }
  }

  return changes;
}

/**
 * Build column mapping between left and right schemas
 * Returns map of leftIndex -> rightIndex
 */
export function buildColumnMapping(
  leftSchema: CsvSchema,
  rightSchema: CsvSchema,
): Map<number, number> {
  const mapping = new Map<number, number>();

  const rightColsByName = new Map(rightSchema.columns.map((col) => [col.name, col]));

  // Map by column name if both have headers
  if (leftSchema.headerRow !== undefined && rightSchema.headerRow !== undefined) {
    for (const leftCol of leftSchema.columns) {
      const rightCol = rightColsByName.get(leftCol.name);
      if (rightCol) {
        mapping.set(leftCol.index, rightCol.index);
      }
    }
  } else {
    // Map by position if no headers
    const maxCols = Math.min(leftSchema.columns.length, rightSchema.columns.length);
    for (let i = 0; i < maxCols; i++) {
      mapping.set(i, i);
    }
  }

  return mapping;
}

/**
 * Detect column renames using fuzzy matching
 */
function detectColumnRenames(
  deletedColumns: ColumnDefinition[],
  addedColumns: ColumnDefinition[],
): ColumnRename[] {
  const renames: ColumnRename[] = [];

  for (const deleted of deletedColumns) {
    let bestMatch: { added: ColumnDefinition; score: number } | null = null;

    for (const added of addedColumns) {
      // Name similarity
      const nameSimilarity = computeStringSimilarity(deleted.name, added.name);

      // Type match
      const typeSame = deleted.type === added.type;

      // Sample similarity
      const samplesSimilar = computeSampleSimilarity(deleted.samples, added.samples);

      // Combined score
      const score = nameSimilarity * 0.4 + (typeSame ? 0.3 : 0) + samplesSimilar * 0.3;

      if (score > 0.7 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { added, score };
      }
    }

    if (bestMatch) {
      renames.push({
        oldName: deleted.name,
        newName: bestMatch.added.name,
        confidence: bestMatch.score,
      });
    }
  }

  return renames;
}

/**
 * Compute similarity between sample arrays
 */
function computeSampleSimilarity(samples1: string[], samples2: string[]): number {
  if (samples1.length === 0 && samples2.length === 0) {
    return 1;
  }

  if (samples1.length === 0 || samples2.length === 0) {
    return 0;
  }

  const normalize = (s: string) => s.trim().toLowerCase();
  const set1 = new Set(samples1.map(normalize));
  const set2 = new Set(samples2.map(normalize));

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}
