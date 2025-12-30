/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to C# Class Converter
 * Generate C# classes from JSON data
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
      "amount": 99.99,
      "date": "2024-01-15"
    }
  ]
}`;

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

function getCSharpType(value: unknown, key: string, classes: Map<string, string>): string {
  if (value === null) return 'object?';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'List<object>';
    const itemType = getCSharpType(value[0], key, classes);
    return `List<${itemType.replace('?', '')}>`;
  }

  if (typeof value === 'object') {
    const className = toPascalCase(key);
    generateClass(value as Record<string, unknown>, className, classes);
    return className;
  }

  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'int' : 'double';
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value)) {
      return 'DateTime';
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return 'Guid';
    }
    return 'string';
  }

  return 'object';
}

function generateClass(
  obj: Record<string, unknown>,
  className: string,
  classes: Map<string, string>,
): void {
  if (classes.has(className)) return;

  const lines: string[] = [];
  const properties: { name: string; type: string; jsonKey: string }[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const type = getCSharpType(value, key, classes);
    const propName = toPascalCase(key);
    properties.push({ name: propName, type, jsonKey: key });
  }

  lines.push(`public class ${className}`);
  lines.push('{');

  for (const prop of properties) {
    if (prop.name !== prop.jsonKey) {
      lines.push(`    [JsonPropertyName("${prop.jsonKey}")]`);
    }
    const nullable =
      prop.type !== 'int' && prop.type !== 'double' && prop.type !== 'bool' ? '?' : '';
    lines.push(`    public ${prop.type}${nullable} ${prop.name} { get; set; }`);
    lines.push('');
  }

  if (lines[lines.length - 1] === '') {
    lines.pop();
  }

  lines.push('}');
  classes.set(className, lines.join('\n'));
}

async function convertJsonToCSharp(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  const parsed = JSON.parse(input);
  const classes = new Map<string, string>();

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error('Cannot generate class from empty array');
    }
    generateClass(parsed[0] as Record<string, unknown>, 'Root', classes);
  } else if (typeof parsed === 'object' && parsed !== null) {
    generateClass(parsed as Record<string, unknown>, 'Root', classes);
  } else {
    throw new Error('Input must be a JSON object or array of objects');
  }

  const result: string[] = [];
  const usings = ['System', 'System.Text.Json.Serialization'];
  if (Array.from(classes.values()).some((c) => c.includes('List<'))) {
    usings.push('System.Collections.Generic');
  }

  for (const u of usings.sort()) {
    result.push(`using ${u};`);
  }
  result.push('');
  result.push('namespace MyNamespace');
  result.push('{');

  if (classes.has('Root')) {
    const classCode = classes.get('Root')!;
    result.push(...classCode.split('\n').map((line) => '    ' + line));
    classes.delete('Root');
  }

  for (const [, code] of classes) {
    result.push('');
    result.push(...code.split('\n').map((line) => '    ' + line));
  }

  result.push('}');
  return result.join('\n');
}

export default function JSONToCSharpPage() {
  return (
    <ToolLayout
      toolName="JSON to C#"
      toolDescription="Generate C# classes from JSON data. Includes System.Text.Json attributes and nullable reference types."
      onProcess={convertJsonToCSharp}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
