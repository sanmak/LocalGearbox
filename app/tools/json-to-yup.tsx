/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to Yup Schema Converter
 * Generate Yup validation schemas from JSON
 */

import { ToolLayout } from '@/components/ToolLayout';

const SAMPLE_JSON = `{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "isActive": true,
  "balance": 1234.56,
  "website": "https://example.com",
  "tags": ["developer", "admin"],
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipCode": "10001"
  }
}`;

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

function detectFormat(value: string, key: string): { method: string; validation: string } | null {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || key.toLowerCase().includes('email')) {
    return { method: 'string', validation: '.email()' };
  }
  if (
    /^https?:\/\//.test(value) ||
    key.toLowerCase().includes('url') ||
    key.toLowerCase().includes('website')
  ) {
    return { method: 'string', validation: '.url()' };
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return { method: 'string', validation: '.uuid()' };
  }
  return null;
}

function generateYupSchema(
  value: unknown,
  key: string,
  indent: string,
  nestedSchemas: Map<string, string>,
): string {
  if (value === null) return 'yup.mixed().nullable()';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'yup.array()';
    const itemSchema = generateYupSchema(value[0], key, indent, nestedSchemas);
    return `yup.array().of(${itemSchema})`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const schemaName = toPascalCase(key) + 'Schema';

    if (indent !== '' && entries.length > 2) {
      const nestedFields: string[] = [];
      for (const [propKey, propValue] of entries) {
        const propSchema = generateYupSchema(propValue, propKey, '    ', nestedSchemas);
        nestedFields.push(`    ${propKey}: ${propSchema},`);
      }
      const schemaCode = `const ${schemaName} = yup.object({\n${nestedFields.join('\n')}\n  });`;
      nestedSchemas.set(schemaName, schemaCode);
      return schemaName;
    }

    const fields: string[] = [];
    for (const [propKey, propValue] of entries) {
      const propSchema = generateYupSchema(propValue, propKey, indent + '  ', nestedSchemas);
      fields.push(`${indent}  ${propKey}: ${propSchema},`);
    }
    return `yup.object({\n${fields.join('\n')}\n${indent}})`;
  }

  if (typeof value === 'boolean') return 'yup.boolean()';

  if (typeof value === 'number') {
    let schema = 'yup.number()';
    if (Number.isInteger(value)) schema += '.integer()';
    if (value >= 0) schema += '.min(0)';
    return schema;
  }

  if (typeof value === 'string') {
    const format = detectFormat(value, key);
    if (format) return `yup.${format.method}()${format.validation}`;
    return 'yup.string()';
  }

  return 'yup.mixed()';
}

async function convertJsonToYup(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  const parsed = JSON.parse(input);
  const lines: string[] = [];
  const nestedSchemas = new Map<string, string>();

  lines.push('import * as yup from "yup";');
  lines.push('');

  let rootSchema: string;

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      rootSchema = 'yup.array()';
    } else {
      const itemSchema = generateYupSchema(parsed[0], 'item', '', nestedSchemas);
      rootSchema = `yup.array().of(${itemSchema})`;
    }
  } else if (typeof parsed === 'object' && parsed !== null) {
    rootSchema = generateYupSchema(parsed, 'Data', '', nestedSchemas);
  } else {
    throw new Error('Input must be a JSON object or array');
  }

  for (const [, schemaCode] of nestedSchemas) {
    lines.push(schemaCode);
    lines.push('');
  }

  lines.push(`export const DataSchema = ${rootSchema};`);
  lines.push('');
  lines.push(`export type Data = yup.InferType<typeof DataSchema>;`);

  return lines.join('\n');
}

export default function JSONToYupPage() {
  return (
    <ToolLayout
      toolName="JSON to Yup"
      toolDescription="Generate Yup validation schemas from JSON data. Includes type inference exports."
      onProcess={convertJsonToYup}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
