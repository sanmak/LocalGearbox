/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to Kotlin Data Class Converter
 * Generate Kotlin data classes from JSON
 */

import { ToolLayout } from '@/components/ToolLayout';

const SAMPLE_JSON = `{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
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

function getKotlinType(value: unknown, key: string, classes: Map<string, string>): string {
  if (value === null) return 'Any?';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'List<Any>';
    const itemType = getKotlinType(value[0], key, classes);
    return `List<${itemType}>`;
  }

  if (typeof value === 'object') {
    const className = toPascalCase(key);
    generateClass(value as Record<string, unknown>, className, classes);
    return className;
  }

  if (typeof value === 'boolean') return 'Boolean';
  if (typeof value === 'number') return Number.isInteger(value) ? 'Int' : 'Double';
  if (typeof value === 'string') return 'String';

  return 'Any';
}

function generateClass(
  obj: Record<string, unknown>,
  className: string,
  classes: Map<string, string>,
): void {
  if (classes.has(className)) return;

  const lines: string[] = [];
  const properties: { name: string; type: string }[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const type = getKotlinType(value, key, classes);
    const nullable = value === null;
    properties.push({
      name: key,
      type: nullable ? `${type}` : type,
    });
  }

  lines.push('@Serializable');
  lines.push(`data class ${className}(`);
  const propLines = properties.map((prop, index) => {
    const suffix = index < properties.length - 1 ? ',' : '';
    return `    val ${prop.name}: ${prop.type}${suffix}`;
  });
  lines.push(...propLines);
  lines.push(')');

  classes.set(className, lines.join('\n'));
}

async function convertJsonToKotlin(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  const parsed = JSON.parse(input);
  const classes = new Map<string, string>();

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error('Cannot generate class from empty array');
    }
    generateClass(parsed[0] as Record<string, unknown>, 'Data', classes);
  } else if (typeof parsed === 'object' && parsed !== null) {
    generateClass(parsed as Record<string, unknown>, 'Data', classes);
  } else {
    throw new Error('Input must be a JSON object or array of objects');
  }

  const result: string[] = [];
  result.push('import kotlinx.serialization.Serializable');
  result.push('');

  if (classes.has('Data')) {
    result.push(classes.get('Data')!);
    classes.delete('Data');
  }

  for (const [, code] of classes) {
    result.push('');
    result.push(code);
  }

  return result.join('\n');
}

export default function JSONToKotlinPage() {
  return (
    <ToolLayout
      toolName="JSON to Kotlin"
      toolDescription="Generate Kotlin data classes from JSON data with kotlinx.serialization annotations."
      onProcess={convertJsonToKotlin}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
