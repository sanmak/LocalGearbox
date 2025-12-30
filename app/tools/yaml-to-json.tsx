/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * YAML to JSON Converter
 * Convert YAML to JSON format
 */

import { ToolLayout } from '@/components/ToolLayout';

// YAML Parser - Pure implementation without external dependencies
function parseYAML(yaml: string): unknown {
  const lines = yaml.split('\n');
  const result: Record<string, unknown> = {};
  const stack: Array<{
    indent: number;
    obj: Record<string, unknown> | unknown[];
  }> = [{ indent: -1, obj: result }];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      i++;
      continue;
    }

    // Calculate indentation
    const indent = line.search(/\S/);

    // Pop stack to find parent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;

    // Handle array items
    if (trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim();

      if (!Array.isArray(parent)) {
        throw new Error(`Unexpected array item at line ${i + 1}`);
      }

      if (value.includes(':') && !value.startsWith('"') && !value.startsWith("'")) {
        // Inline object in array
        const obj: Record<string, unknown> = {};
        const parts = value.split(':');
        const key = parts[0].trim();
        const val = parts.slice(1).join(':').trim();
        obj[key] = parseValue(val);
        parent.push(obj);
        stack.push({ indent: indent + 2, obj });
      } else if (value === '' || value === '|' || value === '>') {
        // Nested object or multiline
        const obj: Record<string, unknown> = {};
        parent.push(obj);
        stack.push({ indent: indent + 2, obj });
      } else {
        parent.push(parseValue(value));
      }
    }
    // Handle key-value pairs
    else if (trimmed.includes(':')) {
      const colonIdx = trimmed.indexOf(':');
      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();

      if (typeof parent !== 'object' || Array.isArray(parent)) {
        throw new Error(`Cannot add key to non-object at line ${i + 1}`);
      }

      if (value === '') {
        // Check next line to determine if array or object
        const nextLine = lines[i + 1];
        if (nextLine && nextLine.trim().startsWith('-')) {
          const arr: unknown[] = [];
          parent[key] = arr;
          stack.push({ indent, obj: arr });
        } else {
          const obj: Record<string, unknown> = {};
          parent[key] = obj;
          stack.push({ indent, obj });
        }
      } else if (value === '|' || value === '>') {
        // Multiline string
        const multilineIndent = indent + 2;
        let multiline = '';
        i++;
        while (i < lines.length) {
          const mlLine = lines[i];
          if (mlLine.trim() === '' || mlLine.search(/\S/) >= multilineIndent) {
            multiline += (multiline ? (value === '|' ? '\n' : ' ') : '') + mlLine.trim();
            i++;
          } else {
            break;
          }
        }
        parent[key] = multiline;
        continue;
      } else {
        parent[key] = parseValue(value);
      }
    }

    i++;
  }

  return result;
}

function parseValue(value: string): unknown {
  if (value === '' || value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Handle quoted strings
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  // Handle numbers
  const num = Number(value);
  if (!isNaN(num) && value !== '') {
    return num;
  }

  // Handle inline arrays
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1);
    if (inner.trim() === '') return [];
    return inner.split(',').map((v) => parseValue(v.trim()));
  }

  // Handle inline objects
  if (value.startsWith('{') && value.endsWith('}')) {
    const inner = value.slice(1, -1);
    if (inner.trim() === '') return {};
    const obj: Record<string, unknown> = {};
    const pairs = inner.split(',');
    for (const pair of pairs) {
      const [k, ...rest] = pair.split(':');
      if (k) {
        obj[k.trim()] = parseValue(rest.join(':').trim());
      }
    }
    return obj;
  }

  return value;
}

async function yamlToJson(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  if (input.length > 10 * 1024 * 1024) {
    throw new Error('Input exceeds size limit of 10MB');
  }

  try {
    const parsed = parseYAML(input);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    throw new Error(`Invalid YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const SAMPLE_YAML = `# User Configuration
name: John Doe
age: 30
active: true
email: john@example.com

# Address Information
address:
  street: 123 Main St
  city: New York
  country: USA
  zipCode: "10001"

# Skills List
skills:
  - JavaScript
  - TypeScript
  - Python
  - Go

# Projects
projects:
  - name: Project Alpha
    status: completed
    year: 2023
  - name: Project Beta
    status: in-progress
    year: 2024

# Metadata
metadata:
  created: 2024-01-15
  version: 1.0
  tags: [development, web, api]`;

export default function YamlToJsonPage() {
  return (
    <ToolLayout
      toolName="YAML to JSON"
      toolDescription="Convert YAML to JSON format. Supports nested objects, arrays, and common YAML features."
      onProcess={yamlToJson}
      placeholder="Paste your YAML here..."
      sampleData={SAMPLE_YAML}
      showJsonButtons={false}
    />
  );
}
