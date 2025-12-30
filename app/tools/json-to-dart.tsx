/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to Dart Class Converter
 * Generate Dart classes from JSON with factory constructors
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

function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toLowerCase());
}

function getDartType(value: unknown, key: string, classes: Map<string, string>): string {
  if (value === null) return 'dynamic';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'List<dynamic>';
    const itemType = getDartType(value[0], key, classes);
    return `List<${itemType}>`;
  }

  if (typeof value === 'object') {
    const className = toPascalCase(key);
    generateClass(value as Record<string, unknown>, className, classes);
    return className;
  }

  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'double';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value)) return 'DateTime';
    return 'String';
  }

  return 'dynamic';
}

function generateClass(
  obj: Record<string, unknown>,
  className: string,
  classes: Map<string, string>,
): void {
  if (classes.has(className)) return;

  const lines: string[] = [];
  const properties: {
    name: string;
    type: string;
    jsonKey: string;
    isDate: boolean;
  }[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const type = getDartType(value, key, classes);
    const isDate =
      typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value);
    properties.push({
      name: toCamelCase(key),
      type,
      jsonKey: key,
      isDate,
    });
  }

  lines.push(`class ${className} {`);

  for (const prop of properties) {
    lines.push(`  final ${prop.type} ${prop.name};`);
  }

  lines.push('');
  lines.push(`  ${className}({`);
  for (const prop of properties) {
    lines.push(`    required this.${prop.name},`);
  }
  lines.push('  });');

  lines.push('');
  lines.push(`  factory ${className}.fromJson(Map<String, dynamic> json) {`);
  lines.push(`    return ${className}(`);
  for (const prop of properties) {
    if (prop.type.startsWith('List<')) {
      const itemType = prop.type.slice(5, -1);
      if (['String', 'int', 'double', 'bool', 'dynamic'].includes(itemType)) {
        lines.push(`      ${prop.name}: List<${itemType}>.from(json['${prop.jsonKey}'] ?? []),`);
      } else {
        lines.push(
          `      ${prop.name}: (json['${prop.jsonKey}'] as List?)?.map((e) => ${itemType}.fromJson(e)).toList() ?? [],`,
        );
      }
    } else if (prop.isDate) {
      lines.push(`      ${prop.name}: DateTime.parse(json['${prop.jsonKey}']),`);
    } else if (!['String', 'int', 'double', 'bool', 'dynamic'].includes(prop.type)) {
      lines.push(`      ${prop.name}: ${prop.type}.fromJson(json['${prop.jsonKey}']),`);
    } else {
      lines.push(`      ${prop.name}: json['${prop.jsonKey}'],`);
    }
  }
  lines.push('    );');
  lines.push('  }');

  lines.push('');
  lines.push('  Map<String, dynamic> toJson() {');
  lines.push('    return {');
  for (const prop of properties) {
    if (prop.type.startsWith('List<')) {
      const itemType = prop.type.slice(5, -1);
      if (['String', 'int', 'double', 'bool', 'dynamic'].includes(itemType)) {
        lines.push(`      '${prop.jsonKey}': ${prop.name},`);
      } else {
        lines.push(`      '${prop.jsonKey}': ${prop.name}.map((e) => e.toJson()).toList(),`);
      }
    } else if (prop.isDate) {
      lines.push(`      '${prop.jsonKey}': ${prop.name}.toIso8601String(),`);
    } else if (!['String', 'int', 'double', 'bool', 'dynamic'].includes(prop.type)) {
      lines.push(`      '${prop.jsonKey}': ${prop.name}.toJson(),`);
    } else {
      lines.push(`      '${prop.jsonKey}': ${prop.name},`);
    }
  }
  lines.push('    };');
  lines.push('  }');

  lines.push('}');
  classes.set(className, lines.join('\n'));
}

async function convertJsonToDart(input: string): Promise<string> {
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
    result.push(classes.get('Data')!);
    classes.delete('Data');
  }

  for (const [, code] of classes) {
    result.push('');
    result.push(code);
  }

  return result.join('\n');
}

export default function JSONToDartPage() {
  return (
    <ToolLayout
      toolName="JSON to Dart"
      toolDescription="Generate Dart classes from JSON data with fromJson factory and toJson methods."
      onProcess={convertJsonToDart}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
