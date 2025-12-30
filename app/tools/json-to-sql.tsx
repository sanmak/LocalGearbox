/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to SQL Converter
 * Generate SQL CREATE TABLE statements from JSON data
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
  "createdAt": "2024-01-15T10:30:00Z",
  "metadata": null
}`;

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

function getSQLType(value: unknown, key: string): string {
  if (value === null) return 'TEXT';

  if (typeof value === 'boolean') return 'BOOLEAN';

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      if (key.toLowerCase().includes('id')) return 'BIGINT';
      return 'INTEGER';
    }
    return 'NUMERIC(18, 2)';
  }

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return 'TIMESTAMP';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'DATE';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
      return 'UUID';
    if (value.length > 255) return 'TEXT';
    return 'VARCHAR(255)';
  }

  if (Array.isArray(value) || typeof value === 'object') return 'JSONB';

  return 'VARCHAR(255)';
}

async function convertJsonToSQL(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  const parsed = JSON.parse(input);

  let obj: Record<string, unknown>;
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error('Cannot generate schema from empty array');
    }
    obj = parsed[0] as Record<string, unknown>;
  } else if (typeof parsed === 'object' && parsed !== null) {
    obj = parsed as Record<string, unknown>;
  } else {
    throw new Error('Input must be a JSON object or array of objects');
  }

  const columns: { name: string; type: string; isId: boolean }[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const columnName = toSnakeCase(key);
    const type = getSQLType(value, key);
    const isId = key.toLowerCase() === 'id';
    columns.push({ name: columnName, type, isId });
  }

  const lines: string[] = [];
  lines.push('CREATE TABLE my_table (');

  const columnDefs: string[] = [];
  for (const col of columns) {
    let def = `    ${col.name} ${col.type}`;
    if (col.isId) {
      def = `    ${col.name} SERIAL PRIMARY KEY`;
    } else if (obj[Object.keys(obj).find((k) => toSnakeCase(k) === col.name)!] !== null) {
      def += ' NOT NULL';
    }
    columnDefs.push(def);
  }

  lines.push(columnDefs.join(',\n'));
  lines.push(');');

  // Insert statement
  lines.push('');
  lines.push('-- Sample INSERT statement');

  const columnNames = columns.map((c) => c.name).join(', ');
  const values = columns
    .map((col) => {
      const key = Object.keys(obj).find((k) => toSnakeCase(k) === col.name)!;
      const value = obj[key];
      if (value === null) return 'NULL';
      if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
      if (typeof value === 'number') return String(value);
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      return 'NULL';
    })
    .join(', ');

  lines.push(`INSERT INTO my_table (${columnNames})`);
  lines.push(`VALUES (${values});`);

  return lines.join('\n');
}

export default function JSONToSQLPage() {
  return (
    <ToolLayout
      toolName="JSON to SQL"
      toolDescription="Generate PostgreSQL CREATE TABLE statements from JSON data. Automatically infers column types and includes sample INSERT statement."
      onProcess={convertJsonToSQL}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
