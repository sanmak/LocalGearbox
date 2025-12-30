/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to TOML Converter
 * Convert JSON to TOML format
 */

import { ToolLayout } from '@/components/ToolLayout';

// JSON to TOML converter - Pure implementation
function jsonToToml(obj: unknown, path: string[] = []): string {
  if (obj === null || typeof obj !== 'object') {
    throw new Error('Root must be an object');
  }

  if (Array.isArray(obj)) {
    throw new Error('Root cannot be an array');
  }

  const lines: string[] = [];
  const entries = Object.entries(obj as Record<string, unknown>);

  // First, output simple key-value pairs
  for (const [key, value] of entries) {
    if (typeof value !== 'object' || value === null) {
      lines.push(`${formatKey(key)} = ${formatValue(value)}`);
    } else if (
      Array.isArray(value) &&
      !value.some((v) => typeof v === 'object' && v !== null && !Array.isArray(v))
    ) {
      // Simple array (no nested objects)
      lines.push(`${formatKey(key)} = ${formatArray(value)}`);
    }
  }

  // Then, output tables
  for (const [key, value] of entries) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Regular table
      const tablePath = [...path, key];
      const tableContent = generateTable(value as Record<string, unknown>, tablePath);
      if (lines.length > 0 || tableContent.trim()) {
        lines.push('');
      }
      lines.push(`[${tablePath.map(formatKey).join('.')}]`);
      if (tableContent) {
        lines.push(tableContent);
      }
    }
  }

  // Finally, output array of tables
  for (const [key, value] of entries) {
    if (
      Array.isArray(value) &&
      value.some((v) => typeof v === 'object' && v !== null && !Array.isArray(v))
    ) {
      // Array of tables
      const tablePath = [...path, key];
      for (const item of value) {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          lines.push('');
          lines.push(`[[${tablePath.map(formatKey).join('.')}]]`);
          const tableContent = generateTableContent(item as Record<string, unknown>, tablePath);
          if (tableContent) {
            lines.push(tableContent);
          }
        } else {
          // Mixed array - use inline
          lines.push('');
          lines.push(`${formatKey(key)} = ${formatArray(value)}`);
          break;
        }
      }
    }
  }

  return lines.join('\n');
}

function generateTable(obj: Record<string, unknown>, path: string[]): string {
  const lines: string[] = [];
  const entries = Object.entries(obj);

  // Simple key-value pairs
  for (const [key, value] of entries) {
    if (typeof value !== 'object' || value === null) {
      lines.push(`${formatKey(key)} = ${formatValue(value)}`);
    } else if (
      Array.isArray(value) &&
      !value.some((v) => typeof v === 'object' && v !== null && !Array.isArray(v))
    ) {
      lines.push(`${formatKey(key)} = ${formatArray(value)}`);
    }
  }

  // Nested tables
  for (const [key, value] of entries) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const tablePath = [...path, key];
      lines.push('');
      lines.push(`[${tablePath.map(formatKey).join('.')}]`);
      const nestedContent = generateTableContent(value as Record<string, unknown>, tablePath);
      if (nestedContent) {
        lines.push(nestedContent);
      }
    }
  }

  // Array of tables
  for (const [key, value] of entries) {
    if (
      Array.isArray(value) &&
      value.some((v) => typeof v === 'object' && v !== null && !Array.isArray(v))
    ) {
      const tablePath = [...path, key];
      for (const item of value) {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          lines.push('');
          lines.push(`[[${tablePath.map(formatKey).join('.')}]]`);
          const tableContent = generateTableContent(item as Record<string, unknown>, tablePath);
          if (tableContent) {
            lines.push(tableContent);
          }
        }
      }
    }
  }

  return lines.join('\n');
}

function generateTableContent(obj: Record<string, unknown>, _path: string[]): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value !== 'object' || value === null) {
      lines.push(`${formatKey(key)} = ${formatValue(value)}`);
    } else if (Array.isArray(value)) {
      lines.push(`${formatKey(key)} = ${formatArray(value)}`);
    } else {
      // Inline table for nested objects in array of tables
      lines.push(`${formatKey(key)} = ${formatInlineTable(value as Record<string, unknown>)}`);
    }
  }

  return lines.join('\n');
}

function formatKey(key: string): string {
  if (/^[a-zA-Z0-9_-]+$/.test(key)) {
    return key;
  }
  return `"${key.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function formatValue(value: unknown): string {
  if (value === null) {
    return '""'; // TOML doesn't have null, use empty string
  }

  switch (typeof value) {
    case 'string':
      // Check for multiline
      if (value.includes('\n')) {
        return `"""\n${value}\n"""`;
      }
      return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    case 'number':
      if (!isFinite(value)) {
        if (isNaN(value)) return 'nan';
        return value > 0 ? 'inf' : '-inf';
      }
      return value.toString();
    case 'boolean':
      return value.toString();
    default:
      return `"${String(value)}"`;
  }
}

function formatArray(arr: unknown[]): string {
  if (arr.length === 0) {
    return '[]';
  }

  const items = arr.map((item) => {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      return formatInlineTable(item as Record<string, unknown>);
    }
    if (Array.isArray(item)) {
      return formatArray(item);
    }
    return formatValue(item);
  });

  // Use multiline for long arrays
  const inline = `[${items.join(', ')}]`;
  if (inline.length > 80) {
    return `[\n  ${items.join(',\n  ')}\n]`;
  }

  return inline;
}

function formatInlineTable(obj: Record<string, unknown>): string {
  const pairs = Object.entries(obj).map(([k, v]) => {
    const formattedValue =
      typeof v === 'object' && v !== null && !Array.isArray(v)
        ? formatInlineTable(v as Record<string, unknown>)
        : Array.isArray(v)
          ? formatArray(v)
          : formatValue(v);
    return `${formatKey(k)} = ${formattedValue}`;
  });
  return `{ ${pairs.join(', ')} }`;
}

async function convertJsonToToml(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  if (input.length > 10 * 1024 * 1024) {
    throw new Error('Input exceeds size limit of 10MB');
  }

  try {
    const parsed = JSON.parse(input);

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Root must be an object');
    }

    return jsonToToml(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
}

const SAMPLE_JSON = `{
  "title": "TOML Example",
  "version": 1.0,
  "owner": {
    "name": "John Doe",
    "email": "john@example.com",
    "dob": "1979-05-27T07:32:00-08:00"
  },
  "database": {
    "server": "192.168.1.1",
    "ports": [8001, 8002, 8003],
    "enabled": true,
    "connection_max": 5000
  },
  "servers": {
    "alpha": {
      "ip": "10.0.0.1",
      "dc": "eqdc10"
    },
    "beta": {
      "ip": "10.0.0.2",
      "dc": "eqdc20"
    }
  },
  "products": [
    { "name": "Hammer", "sku": 738594937 },
    { "name": "Nail", "sku": 284758393, "color": "gray" }
  ]
}`;

export default function JsonToTomlPage() {
  return (
    <ToolLayout
      toolName="JSON to TOML"
      toolDescription="Convert JSON to TOML format. Generates tables, arrays of tables, and inline tables as appropriate."
      onProcess={convertJsonToToml}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
