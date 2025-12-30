/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to Java Class Converter
 * Generate Java classes from JSON data
 */

import { ToolLayout } from '@/components/ToolLayout';

const SAMPLE_JSON = `{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "active": true,
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

function getJavaType(value: unknown, key: string, classes: Map<string, string>): string {
  if (value === null) return 'Object';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'List<Object>';
    const itemType = getJavaType(value[0], key, classes);
    return `List<${itemType}>`;
  }

  if (typeof value === 'object') {
    const className = toPascalCase(key);
    generateClass(value as Record<string, unknown>, className, classes);
    return className;
  }

  if (typeof value === 'boolean') return 'Boolean';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'Integer' : 'Double';
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value)) {
      return 'LocalDateTime';
    }
    return 'String';
  }

  return 'Object';
}

function generateClass(
  obj: Record<string, unknown>,
  className: string,
  classes: Map<string, string>,
): void {
  if (classes.has(className)) return;

  const lines: string[] = [];
  const imports = new Set<string>();
  const fields: { name: string; type: string }[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const type = getJavaType(value, key, classes);
    if (type.startsWith('List<')) imports.add('java.util.List');
    if (type === 'LocalDateTime') imports.add('java.time.LocalDateTime');
    fields.push({ name: key, type });
  }

  // Lombok annotations
  lines.push('@Data');
  lines.push('@NoArgsConstructor');
  lines.push('@AllArgsConstructor');
  imports.add('lombok.Data');
  imports.add('lombok.NoArgsConstructor');
  imports.add('lombok.AllArgsConstructor');

  lines.push(`public class ${className} {`);
  lines.push('');

  for (const field of fields) {
    lines.push(`    private ${field.type} ${field.name};`);
  }

  lines.push('}');

  const fullClass: string[] = [];
  fullClass.push('package com.example;');
  fullClass.push('');

  const sortedImports = Array.from(imports).sort();
  for (const imp of sortedImports) {
    fullClass.push(`import ${imp};`);
  }
  fullClass.push('');
  fullClass.push(...lines);

  classes.set(className, fullClass.join('\n'));
}

async function convertJsonToJava(input: string): Promise<string> {
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

  if (classes.has('Data')) {
    result.push('// Data.java');
    result.push(classes.get('Data')!);
    classes.delete('Data');
  }

  for (const [name, code] of classes) {
    result.push('');
    result.push(`// ${name}.java`);
    result.push(code);
  }

  return result.join('\n');
}

export default function JSONToJavaPage() {
  return (
    <ToolLayout
      toolName="JSON to Java"
      toolDescription="Generate Java classes from JSON data. Uses Lombok annotations for clean, boilerplate-free code."
      onProcess={convertJsonToJava}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
