/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * JSON Utilities Index
 * Export all JSON-related utilities
 */

// Types
export * from './types';

// Formatter
export {
  formatJson,
  formatJsonString,
  minifyJson,
  getMinifyStats,
  getIndentValue,
} from './formatter';

// Validator
export { validateJson, validateJsonMultiple, getErrorContext } from './validator';

// Fixer
export { fixJson, getFixerCapabilities, needsFix } from './fixer';

// Sorter
export { sortKeys, sortByField, extractFieldNames, hasSortableArrays } from './sorter';

// Search
export {
  fuzzyMatch,
  searchJson,
  findRelatedValues,
  getValueAtPath,
  extractAllKeys,
} from './search';

// Schema
export { inferJsonSchema, formatSchema, validateAgainstSchema } from './schema';

// Escaper
export {
  escapeJsonString,
  unescapeJsonString,
  escapeForJavaScript,
  unescapeFromJavaScript,
  escapeForHtmlAttribute,
  unescapeFromHtmlAttribute,
  escapeForUrl,
  unescapeFromUrl,
  detectEscapeType,
  autoUnescape,
} from './escaper';

// Content Detector
export {
  isValidDate,
  isValidUrl,
  isImageUrl,
  isValidColor,
  isValidEmail,
  isValidUuid,
  isJsonString,
  detectContentType,
  getContentTypeLabel,
  getContentTypeIcon,
} from './content-detector';

// Stats
export { calculateStats, formatSize, formatStats, getSummaryStats } from './stats';

// Sample data
export const SAMPLE_JSON = `{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-15T10:30:00Z",
      "avatar": "https://example.com/avatar.jpg",
      "verified": true
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "created_at": "2024-02-20T14:45:00Z",
      "avatar": "https://example.com/avatar2.png",
      "verified": false
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "theme_color": "#3b82f6"
  }
}`;
