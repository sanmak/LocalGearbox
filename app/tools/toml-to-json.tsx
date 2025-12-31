/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * TOML to JSON Converter
 * Convert TOML to JSON format
 */

import { ToolLayout } from '@/components/ToolLayout';

// Simple TOML Parser - Pure implementation
function parseTOML(toml: string): Record<string, unknown> {
  const lines = toml.split('\n');
  const result: Record<string, unknown> = {};
  let currentSection = result;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }

    // Table header [section] or [[array]]
    if (line.startsWith('[')) {
      if (line.startsWith('[[') && line.endsWith(']]')) {
        // Array of tables
        const path = line.slice(2, -2).trim().split('.');

        let target = result;
        for (let j = 0; j < path.length - 1; j++) {
          if (!target[path[j]]) {
            target[path[j]] = {};
          }
          target = target[path[j]] as Record<string, unknown>;
        }

        const lastKey = path[path.length - 1];
        if (!target[lastKey]) {
          target[lastKey] = [];
        }

        const arr = target[lastKey] as unknown[];
        const newObj: Record<string, unknown> = {};
        arr.push(newObj);
        currentSection = newObj;
      } else if (line.startsWith('[') && line.endsWith(']')) {
        // Regular table
        const path = line.slice(1, -1).trim().split('.');

        let target = result;
        for (const key of path) {
          if (!target[key]) {
            target[key] = {};
          }
          target = target[key] as Record<string, unknown>;
        }
        currentSection = target;
      }
      continue;
    }

    // Key-value pair
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) {
      throw new Error(`Invalid TOML at line ${i + 1}: ${line}`);
    }

    const key = line.slice(0, eqIndex).trim();
    const rawValue = line.slice(eqIndex + 1).trim();

    // Handle dotted keys
    const keyParts = key.split('.').map((k) => k.trim().replace(/^["']|["']$/g, ''));

    let target = currentSection;
    for (let j = 0; j < keyParts.length - 1; j++) {
      if (!target[keyParts[j]]) {
        target[keyParts[j]] = {};
      }
      target = target[keyParts[j]] as Record<string, unknown>;
    }

    const finalKey = keyParts[keyParts.length - 1];
    target[finalKey] = parseValue(rawValue, lines, i);
  }

  return result;
}

function parseValue(value: string, _lines?: string[], _lineIndex?: number): unknown {
  value = value.trim();

  // Multi-line strings
  if (value.startsWith('"""') || value.startsWith("'''")) {
    // For now, handle single-line basic strings
    const quote = value.slice(0, 3);
    const endQuote = value.lastIndexOf(quote);
    if (endQuote > 2) {
      return value.slice(3, endQuote);
    }
  }

  // Basic strings
  if (value.startsWith('"') && value.endsWith('"')) {
    return value
      .slice(1, -1)
      .replace(/\\\\/g, '\\') // Replace escaped backslashes first
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\"/g, '"');
  }

  // Literal strings
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }

  // Booleans
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Dates/times (return as strings for simplicity)
  if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return value;
  }

  // Numbers
  if (value.match(/^[+-]?\d+$/)) {
    return parseInt(value, 10);
  }
  if (value.match(/^[+-]?\d*\.\d+([eE][+-]?\d+)?$/)) {
    return parseFloat(value);
  }
  if (value.match(/^[+-]?(\d+_?)+$/)) {
    return parseInt(value.replace(/_/g, ''), 10);
  }
  if (value === 'inf' || value === '+inf') return Infinity;
  if (value === '-inf') return -Infinity;
  if (value === 'nan' || value === '+nan' || value === '-nan') return NaN;

  // Inline arrays
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];

    const items: unknown[] = [];
    let depth = 0;
    let current = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < inner.length; i++) {
      const char = inner[i];

      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
        current += char;
      } else if (inString && char === stringChar && inner[i - 1] !== '\\') {
        inString = false;
        current += char;
      } else if (!inString && (char === '[' || char === '{')) {
        depth++;
        current += char;
      } else if (!inString && (char === ']' || char === '}')) {
        depth--;
        current += char;
      } else if (!inString && char === ',' && depth === 0) {
        items.push(parseValue(current.trim()));
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      items.push(parseValue(current.trim()));
    }

    return items;
  }

  // Inline tables
  if (value.startsWith('{') && value.endsWith('}')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return {};

    const obj: Record<string, unknown> = {};
    const pairs = inner.split(',');

    for (const pair of pairs) {
      const eqIdx = pair.indexOf('=');
      if (eqIdx !== -1) {
        const k = pair.slice(0, eqIdx).trim();
        const v = pair.slice(eqIdx + 1).trim();
        obj[k] = parseValue(v);
      }
    }

    return obj;
  }

  // Unquoted strings (bare keys as values - technically not valid TOML but handle gracefully)
  return value;
}

async function convertTomlToJson(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  if (input.length > 10 * 1024 * 1024) {
    throw new Error('Input exceeds size limit of 10MB');
  }

  try {
    const parsed = parseTOML(input);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    throw new Error(`Invalid TOML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const SAMPLE_TOML = `# This is a TOML document

title = "TOML Example"
version = 1.0

[owner]
name = "John Doe"
email = "john@example.com"
dob = 1979-05-27T07:32:00-08:00

[database]
server = "192.168.1.1"
ports = [8001, 8002, 8003]
enabled = true
connection_max = 5000

[servers]

  [servers.alpha]
  ip = "10.0.0.1"
  dc = "eqdc10"

  [servers.beta]
  ip = "10.0.0.2"
  dc = "eqdc20"

[[products]]
name = "Hammer"
sku = 738594937

[[products]]
name = "Nail"
sku = 284758393
color = "gray"`;

export default function TomlToJsonPage() {
  return (
    <ToolLayout
      toolName="TOML to JSON"
      toolDescription="Convert TOML to JSON format. Supports tables, arrays, inline tables, and various data types."
      onProcess={convertTomlToJson}
      placeholder="Paste your TOML here..."
      sampleData={SAMPLE_TOML}
      showJsonButtons={false}
    />
  );
}
