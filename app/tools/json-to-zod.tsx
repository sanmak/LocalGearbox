/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to Zod Schema Converter
 * Generate Zod schema definitions from JSON data
 */

import { ToolLayout } from '@/components/ToolLayout';

function generateZodSchema(value: unknown, indent: number = 0, _key?: string): string {
  const spaces = '  '.repeat(indent);

  if (value === null) {
    return 'z.null()';
  }

  if (value === undefined) {
    return 'z.undefined()';
  }

  switch (typeof value) {
    case 'string':
      // Check for common patterns
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return 'z.string().date()';
      }
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return 'z.string().datetime()';
      }
      if (value.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        return 'z.string().email()';
      }
      if (value.match(/^https?:\/\//)) {
        return 'z.string().url()';
      }
      if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return 'z.string().uuid()';
      }
      return 'z.string()';

    case 'number':
      if (Number.isInteger(value)) {
        return 'z.number().int()';
      }
      return 'z.number()';

    case 'boolean':
      return 'z.boolean()';

    case 'object':
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return 'z.array(z.unknown())';
        }

        // Check if all items have the same type
        const itemSchemas = value.map((item) => generateZodSchema(item, 0));
        const uniqueSchemas = [...new Set(itemSchemas)];

        if (uniqueSchemas.length === 1) {
          if (typeof value[0] === 'object' && value[0] !== null && !Array.isArray(value[0])) {
            // Array of objects - generate inline schema
            const objectSchema = generateZodSchema(value[0], indent);
            return `z.array(\n${spaces}  ${objectSchema}\n${spaces})`;
          }
          return `z.array(${uniqueSchemas[0]})`;
        }

        // Union of different types
        return `z.array(z.union([${uniqueSchemas.join(', ')}]))`;
      }

      // Regular object
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) {
        return 'z.object({})';
      }

      const properties = entries.map(([propKey, propValue]) => {
        const propSchema = generateZodSchema(propValue, indent + 1, propKey);
        return `${spaces}  ${formatKey(propKey)}: ${propSchema}`;
      });

      return `z.object({\n${properties.join(',\n')}\n${spaces}})`;

    default:
      return 'z.unknown()';
  }
}

function formatKey(key: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return key;
  }
  // Escape backslashes first to prevent double-escaping
  return `"${key.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

async function convertJsonToZod(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  if (input.length > 10 * 1024 * 1024) {
    throw new Error('Input exceeds size limit of 10MB');
  }

  try {
    const parsed = JSON.parse(input);

    const schema = generateZodSchema(parsed, 0);

    const output = `import { z } from "zod";

export const schema = ${schema};

export type Schema = z.infer<typeof schema>;`;

    return output;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
}

const SAMPLE_JSON = `{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "isActive": true,
  "website": "https://example.com",
  "createdAt": "2024-01-15T10:30:00Z",
  "birthDate": "1990-05-20",
  "score": 95.5,
  "tags": ["developer", "designer"],
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipCode": "10001"
  },
  "roles": [
    { "name": "admin", "level": 1 },
    { "name": "user", "level": 2 }
  ],
  "metadata": null
}`;

export default function JsonToZodPage() {
  return (
    <ToolLayout
      toolName="JSON to Zod Schema"
      toolDescription="Generate Zod schema definitions from JSON data. Automatically infers types and detects patterns like email, URL, UUID, and dates."
      onProcess={convertJsonToZod}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
