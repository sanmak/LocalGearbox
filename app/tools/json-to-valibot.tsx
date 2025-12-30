/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to Valibot Schema Converter
 * Generate Valibot validation schemas from JSON
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
  if (/^https?:\/\//.test(value)) return 'url';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'uuid';
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value)) return 'isoDate';
  return null;
}

function generateValibotSchema(
  value: unknown,
  key: string,
  indent: string,
  nestedSchemas: Map<string, string>,
): string {
  if (value === null) return 'v.null_()';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'v.array(v.unknown())';
    const itemSchema = generateValibotSchema(value[0], key, indent, nestedSchemas);
    return `v.array(${itemSchema})`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const schemaName = toPascalCase(key) + 'Schema';

    if (indent !== '' && entries.length > 2) {
      const nestedFields: string[] = [];
      for (const [propKey, propValue] of entries) {
        const propSchema = generateValibotSchema(propValue, propKey, indent + '  ', nestedSchemas);
        nestedFields.push(`    ${propKey}: ${propSchema},`);
      }
      const schemaCode = `const ${schemaName} = v.object({\n${nestedFields.join('\n')}\n  });`;
      nestedSchemas.set(schemaName, schemaCode);
      return schemaName;
    }

    const fields: string[] = [];
    for (const [propKey, propValue] of entries) {
      const propSchema = generateValibotSchema(propValue, propKey, indent + '  ', nestedSchemas);
      fields.push(`${indent}  ${propKey}: ${propSchema},`);
    }
    return `v.object({\n${fields.join('\n')}\n${indent}})`;
  }

  if (typeof value === 'boolean') return 'v.boolean()';
  if (typeof value === 'number')
    return Number.isInteger(value) ? 'v.pipe(v.number(), v.integer())' : 'v.number()';

  if (typeof value === 'string') {
    const format = detectFormat(value);
    if (format === 'email') return 'v.pipe(v.string(), v.email())';
    if (format === 'url') return 'v.pipe(v.string(), v.url())';
    if (format === 'uuid') return 'v.pipe(v.string(), v.uuid())';
    if (format === 'isoDate') return 'v.pipe(v.string(), v.isoDate())';
    return 'v.string()';
  }

  return 'v.unknown()';
}

async function convertJsonToValibot(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  const parsed = JSON.parse(input);
  const lines: string[] = [];
  const nestedSchemas = new Map<string, string>();

  lines.push('import * as v from "valibot";');
  lines.push('');

  let rootSchema: string;

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      rootSchema = 'v.array(v.unknown())';
    } else {
      const itemSchema = generateValibotSchema(parsed[0], 'item', '', nestedSchemas);
      rootSchema = `v.array(${itemSchema})`;
    }
  } else if (typeof parsed === 'object' && parsed !== null) {
    rootSchema = generateValibotSchema(parsed, 'Data', '', nestedSchemas);
  } else {
    throw new Error('Input must be a JSON object or array');
  }

  for (const [, schemaCode] of nestedSchemas) {
    lines.push(schemaCode);
    lines.push('');
  }

  lines.push(`export const DataSchema = ${rootSchema};`);
  lines.push('');
  lines.push(`export type Data = v.InferOutput<typeof DataSchema>;`);

  return lines.join('\n');
}

export default function JSONToValibotPage() {
  return (
    <ToolLayout
      toolName="JSON to Valibot"
      toolDescription="Generate Valibot validation schemas from JSON data. Includes type inference exports."
      onProcess={convertJsonToValibot}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
