/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to TypeBox Schema Converter
 * Generate TypeBox validation schemas from JSON
 */

import { ToolLayout } from '@/components/ToolLayout';

const SAMPLE_JSON = `{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "isActive": true,
  "balance": 1234.56,
  "tags": ["developer", "admin"],
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipCode": "10001"
  },
  "orders": [
    {
      "orderId": "A001",
      "amount": 99.99
    }
  ]
}`;

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

function detectFormat(value: string): string | null {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
  if (/^https?:\/\//.test(value)) return 'uri';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'uuid';
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value)) return 'date-time';
  return null;
}

function generateTypeBoxSchema(
  value: unknown,
  key: string,
  indent: string,
  nestedSchemas: Map<string, string>,
): string {
  if (value === null) return 'Type.Null()';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'Type.Array(Type.Unknown())';
    const itemSchema = generateTypeBoxSchema(value[0], key, indent, nestedSchemas);
    return `Type.Array(${itemSchema})`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const schemaName = toPascalCase(key) + 'Schema';

    if (indent !== '' && entries.length > 2) {
      const nestedFields: string[] = [];
      for (const [propKey, propValue] of entries) {
        const propSchema = generateTypeBoxSchema(propValue, propKey, '    ', nestedSchemas);
        nestedFields.push(`    ${propKey}: ${propSchema},`);
      }
      const schemaCode = `const ${schemaName} = Type.Object({\n${nestedFields.join('\n')}\n  });`;
      nestedSchemas.set(schemaName, schemaCode);
      return schemaName;
    }

    const fields: string[] = [];
    for (const [propKey, propValue] of entries) {
      const propSchema = generateTypeBoxSchema(propValue, propKey, indent + '  ', nestedSchemas);
      fields.push(`${indent}  ${propKey}: ${propSchema},`);
    }
    return `Type.Object({\n${fields.join('\n')}\n${indent}})`;
  }

  if (typeof value === 'boolean') return 'Type.Boolean()';
  if (typeof value === 'number')
    return Number.isInteger(value) ? 'Type.Integer()' : 'Type.Number()';

  if (typeof value === 'string') {
    const format = detectFormat(value);
    if (format) return `Type.String({ format: "${format}" })`;
    return 'Type.String()';
  }

  return 'Type.Unknown()';
}

async function convertJsonToTypeBox(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  const parsed = JSON.parse(input);
  const lines: string[] = [];
  const nestedSchemas = new Map<string, string>();

  lines.push('import { Type, Static } from "@sinclair/typebox";');
  lines.push('');

  let rootSchema: string;

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      rootSchema = 'Type.Array(Type.Unknown())';
    } else {
      const itemSchema = generateTypeBoxSchema(parsed[0], 'item', '', nestedSchemas);
      rootSchema = `Type.Array(${itemSchema})`;
    }
  } else if (typeof parsed === 'object' && parsed !== null) {
    rootSchema = generateTypeBoxSchema(parsed, 'Data', '', nestedSchemas);
  } else {
    throw new Error('Input must be a JSON object or array');
  }

  for (const [, schemaCode] of nestedSchemas) {
    lines.push(schemaCode);
    lines.push('');
  }

  lines.push(`export const DataSchema = ${rootSchema};`);
  lines.push('');
  lines.push(`export type Data = Static<typeof DataSchema>;`);

  return lines.join('\n');
}

export default function JSONToTypeBoxPage() {
  return (
    <ToolLayout
      toolName="JSON to TypeBox"
      toolDescription="Generate TypeBox validation schemas from JSON data. Includes static type exports."
      onProcess={convertJsonToTypeBox}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
