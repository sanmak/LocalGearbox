/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to Rust Struct Converter
 * Generate Rust structs from JSON with serde support
 */

import { ToolLayout } from '@/components/ToolLayout';

const SAMPLE_JSON = `{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "age": 30,
  "is_active": true,
  "balance": 1234.56,
  "tags": ["developer", "admin"],
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zip_code": "10001"
  },
  "orders": [
    {
      "order_id": "A001",
      "amount": 99.99
    }
  ]
}`;

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/-/g, '_');
}

function getRustType(value: unknown, key: string, structs: Map<string, string>): string {
  if (value === null) return 'Option<serde_json::Value>';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'Vec<serde_json::Value>';
    const itemType = getRustType(value[0], key, structs);
    return `Vec<${itemType}>`;
  }

  if (typeof value === 'object') {
    const structName = toPascalCase(key);
    generateStruct(value as Record<string, unknown>, structName, structs);
    return structName;
  }

  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      if (value > 2147483647 || value < -2147483648) return 'i64';
      return 'i32';
    }
    return 'f64';
  }
  if (typeof value === 'string') return 'String';

  return 'serde_json::Value';
}

function generateStruct(
  obj: Record<string, unknown>,
  structName: string,
  structs: Map<string, string>,
): void {
  if (structs.has(structName)) return;

  const lines: string[] = [];
  const fields: { name: string; type: string }[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const type = getRustType(value, key, structs);
    const rustFieldName = toSnakeCase(key);
    fields.push({
      name: rustFieldName,
      type: value === null ? `Option<${type}>` : type,
    });
  }

  lines.push('#[derive(Debug, Clone, Serialize, Deserialize)]');
  lines.push(`pub struct ${structName} {`);

  for (const field of fields) {
    lines.push(`    pub ${field.name}: ${field.type},`);
  }

  lines.push('}');
  structs.set(structName, lines.join('\n'));
}

async function convertJsonToRust(input: string): Promise<string> {
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
  result.push('use serde::{Deserialize, Serialize};');
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

export default function JSONToRustPage() {
  return (
    <ToolLayout
      toolName="JSON to Rust"
      toolDescription="Generate Rust structs from JSON data with serde derive macros for serialization."
      onProcess={convertJsonToRust}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
