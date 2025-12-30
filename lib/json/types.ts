/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Shared JSON utility types
 * Used across all JSON tools
 */

// View modes for JSON display
export type ViewMode = 'code' | 'tree';

// Indentation options
export type IndentOption = '2' | '3' | '4' | 'tab' | 'compact' | 'escaped';

// Sort direction
export type SortDirection = 'asc' | 'desc';

// Content types for value detection
export type ContentType =
  | 'date'
  | 'url'
  | 'image'
  | 'color'
  | 'email'
  | 'uuid'
  | 'json'
  | 'number'
  | 'boolean'
  | 'null'
  | 'string';

// Content info returned by detector
export interface ContentInfo {
  type: ContentType;
  value: unknown;
  displayValue?: string;
  preview?: React.ReactNode;
}

// Search result type
export interface SearchResult {
  path: string;
  key: string;
  value: unknown;
  type: string;
  matchType: 'key' | 'value' | 'path';
}

// JSON Schema types
export interface JsonSchemaProperty {
  type: string | string[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  format?: string;
  pattern?: string;
  enum?: unknown[];
}

export interface JsonSchema {
  $schema: string;
  type: string;
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
  required?: string[];
}

// JSON statistics
export interface JsonStats {
  size: number;
  depth: number;
  objects: number;
  arrays: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
  totalKeys?: number;
}

// Indent options for UI
export const INDENT_OPTIONS: { value: IndentOption; label: string }[] = [
  { value: '2', label: '2 spaces' },
  { value: '3', label: '3 spaces' },
  { value: '4', label: '4 spaces' },
  { value: 'tab', label: 'Tab' },
  { value: 'compact', label: 'Compact' },
  { value: 'escaped', label: 'Escaped' },
];

// Fix issue types
export interface FixIssue {
  type: string;
  description: string;
  line?: number;
  column?: number;
}

// Fix result
export interface FixResult {
  fixed: string;
  issues: FixIssue[];
  success: boolean;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  message: string;
  error?: string;
  line?: number;
  column?: number;
}
