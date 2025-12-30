/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to Swift Struct Converter
 * Generate Swift Codable structs from JSON
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

function getSwiftType(value: unknown, key: string, structs: Map<string, string>): string {
  if (value === null) return 'Any?';

  if (Array.isArray(value)) {
    if (value.length === 0) return '[Any]';
    const itemType = getSwiftType(value[0], key, structs);
    return `[${itemType}]`;
  }

  if (typeof value === 'object') {
    const structName = toPascalCase(key);
    generateStruct(value as Record<string, unknown>, structName, structs);
    return structName;
  }

  if (typeof value === 'boolean') return 'Bool';
  if (typeof value === 'number') return Number.isInteger(value) ? 'Int' : 'Double';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value)) return 'Date';
    if (/^https?:\/\//.test(value)) return 'URL';
    return 'String';
  }

  return 'Any';
}

function generateStruct(
  obj: Record<string, unknown>,
  structName: string,
  structs: Map<string, string>,
): void {
  if (structs.has(structName)) return;

  const lines: string[] = [];
  const properties: {
    name: string;
    type: string;
    jsonKey: string;
    needsCodingKey: boolean;
  }[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const type = getSwiftType(value, key, structs);
    const swiftName = toCamelCase(key);
    const needsCodingKey = swiftName !== key;

    properties.push({
      name: swiftName,
      type: value === null ? `${type}` : type,
      jsonKey: key,
      needsCodingKey,
    });
  }

  lines.push(`struct ${structName}: Codable {`);

  for (const prop of properties) {
    lines.push(`    let ${prop.name}: ${prop.type}`);
  }

  if (properties.some((p) => p.needsCodingKey)) {
    lines.push('');
    lines.push('    enum CodingKeys: String, CodingKey {');
    for (const prop of properties) {
      if (prop.needsCodingKey) {
        lines.push(`        case ${prop.name} = "${prop.jsonKey}"`);
      } else {
        lines.push(`        case ${prop.name}`);
      }
    }
    lines.push('    }');
  }

  lines.push('}');
  structs.set(structName, lines.join('\n'));
}

async function convertJsonToSwift(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  const parsed = JSON.parse(input);
  const structs = new Map<string, string>();

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error('Cannot generate struct from empty array');
    }
    generateStruct(parsed[0] as Record<string, unknown>, 'Data', structs);
  } else if (typeof parsed === 'object' && parsed !== null) {
    generateStruct(parsed as Record<string, unknown>, 'Data', structs);
  } else {
    throw new Error('Input must be a JSON object or array of objects');
  }

  const result: string[] = [];
  result.push('import Foundation');
  result.push('');

  if (structs.has('Data')) {
    result.push(structs.get('Data')!);
    structs.delete('Data');
  }

  for (const [, code] of structs) {
    result.push('');
    result.push(code);
  }

  return result.join('\n');
}

export default function JSONToSwiftPage() {
  return (
    <ToolLayout
      toolName="JSON to Swift"
      toolDescription="Generate Swift Codable structs from JSON data with CodingKeys for property mapping."
      onProcess={convertJsonToSwift}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
