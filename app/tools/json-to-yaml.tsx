/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to YAML Converter
 * Convert JSON to YAML format
 */

import { ToolLayout } from '@/components/ToolLayout';

// JSON to YAML converter - Pure implementation without external dependencies
function jsonToYaml(obj: unknown, indent: number = 0): string {
  const spaces = '  '.repeat(indent);

  if (obj === null) {
    return 'null';
  }

  if (typeof obj === 'boolean') {
    return obj.toString();
  }

  if (typeof obj === 'number') {
    return obj.toString();
  }

  if (typeof obj === 'string') {
    // Check if string needs quoting
    if (
      obj === '' ||
      obj === 'true' ||
      obj === 'false' ||
      obj === 'null' ||
      obj === '~' ||
      obj.includes(':') ||
      obj.includes('#') ||
      obj.includes('\n') ||
      obj.startsWith(' ') ||
      obj.endsWith(' ') ||
      /^[\d.]+$/.test(obj)
    ) {
      // Check for multiline strings
      if (obj.includes('\n')) {
        const lines = obj.split('\n');
        return '|\n' + lines.map((line) => spaces + '  ' + line).join('\n');
      }
      return `"${obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '[]';
    }

    return obj
      .map((item) => {
        const value = jsonToYaml(item, indent + 1);
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          // Object in array - put first key on same line as dash
          const lines = value.split('\n');
          if (lines.length > 0) {
            return `${spaces}- ${lines[0].trim()}\n${lines
              .slice(1)
              .map((l) => spaces + '  ' + l.trim())
              .filter((l) => l.trim())
              .join('\n')}`.trim();
          }
        }
        return `${spaces}- ${value}`;
      })
      .join('\n');
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) {
      return '{}';
    }

    return entries
      .map(([key, value]) => {
        const yamlValue = jsonToYaml(value, indent + 1);

        // Validate key
        const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? key : `"${key}"`;

        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value) && value.length === 0) {
            return `${spaces}${safeKey}: []`;
          }
          if (!Array.isArray(value) && Object.keys(value).length === 0) {
            return `${spaces}${safeKey}: {}`;
          }
          return `${spaces}${safeKey}:\n${yamlValue}`;
        }

        return `${spaces}${safeKey}: ${yamlValue}`;
      })
      .join('\n');
  }

  return String(obj);
}

async function convertJsonToYaml(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  if (input.length > 10 * 1024 * 1024) {
    throw new Error('Input exceeds size limit of 10MB');
  }

  try {
    const parsed = JSON.parse(input);
    return jsonToYaml(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
}

const SAMPLE_JSON = `{
  "name": "John Doe",
  "age": 30,
  "active": true,
  "email": "john@example.com",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "country": "USA",
    "zipCode": "10001"
  },
  "skills": [
    "JavaScript",
    "TypeScript",
    "Python",
    "Go"
  ],
  "projects": [
    {
      "name": "Project Alpha",
      "status": "completed",
      "year": 2023
    },
    {
      "name": "Project Beta",
      "status": "in-progress",
      "year": 2024
    }
  ],
  "metadata": {
    "created": "2024-01-15",
    "version": "1.0",
    "tags": ["development", "web", "api"]
  }
}`;

export default function JsonToYamlPage() {
  return (
    <ToolLayout
      toolName="JSON to YAML"
      toolDescription="Convert JSON to YAML format. Produces clean, readable YAML output."
      onProcess={convertJsonToYaml}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
