/**
 * CSV Types - TypeScript interfaces for CSV parsing and comparison
 */

export enum CsvColumnType {
  STRING = 'string',
  INTEGER = 'integer',
  FLOAT = 'float',
  BOOLEAN = 'boolean',
  DATE = 'date',
  NULL = 'null',
  MIXED = 'mixed',
}

export enum ParseState {
  START_FIELD,
  IN_FIELD,
  IN_QUOTED_FIELD,
  QUOTE_IN_QUOTED_FIELD,
  END_FIELD,
}

export enum RowMatchStrategy {
  POSITION = 'position',
  PRIMARY_KEY = 'primary_key',
  FUZZY = 'fuzzy',
}

export interface ParseError {
  row: number;
  col: number;
  message: string;
  severity: 'warning' | 'error';
}

export interface ParseOptions {
  delimiter?: string; // 'auto' or specific delimiter
  quoteChar?: string;
  hasHeader?: boolean; // Auto-detect if undefined
}

export interface ColumnDefinition {
  index: number;
  name: string; // From header or "Column A", "Column B"
  type: CsvColumnType;
  samples: string[]; // First 10 non-empty values
}

export interface CsvSchema {
  columns: ColumnDefinition[];
  headerRow?: number; // 0-indexed, undefined if no header
  keyColumns?: number[]; // Indices of columns forming primary key
}

export interface ParsedCSV {
  rows: string[][];
  schema: CsvSchema;
  metadata: {
    delimiter: string;
    quoteChar: string;
    rowCount: number;
    columnCount: number;
    hasHeader: boolean;
    encoding: string;
  };
  errors: ParseError[];
}

export interface DelimiterScore {
  delimiter: string;
  confidence: number; // 0-1
  consistency: number; // Column count variance
  sampleSize: number; // Lines analyzed
}

export interface RowMatchConfig {
  strategy: RowMatchStrategy;
  keyColumns?: string[]; // For PRIMARY_KEY strategy
  similarityThreshold?: number; // For FUZZY strategy (0-1)
}

export interface RowMatch {
  leftIndex?: number;
  rightIndex?: number;
  type: 'added' | 'deleted' | 'modified' | 'unchanged';
  key?: string; // For primary key matching
  similarity?: number; // For fuzzy matching
}

export interface CellChange {
  column: number;
  columnName?: string;
  oldValue: string;
  newValue: string;
}

export interface SchemaChange {
  type:
    | 'column_added'
    | 'column_deleted'
    | 'column_reordered'
    | 'column_type_changed'
    | 'column_renamed';
  column: string;
  leftIndex?: number;
  rightIndex?: number;
  oldType?: CsvColumnType;
  newType?: CsvColumnType;
  confidence?: number; // For rename detection
}

export interface ColumnRename {
  oldName: string;
  newName: string;
  confidence: number;
}

export interface CsvDiffOptions {
  delimiter?: string;
  hasHeader?: boolean;
  ignoreHeader?: boolean;
  keyColumns?: string[];
  matchStrategy?: RowMatchStrategy;
  detectRenames?: boolean;
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
  mode?: 'simple' | 'advanced';
}
