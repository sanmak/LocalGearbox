/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * CSV to JSON Converter
 * Convert CSV data to JSON format
 */

import { ToolLayout } from '@/components/ToolLayout';

const SAMPLE_CSV = `name,age,city,active
John Doe,30,New York,true
Jane Smith,25,Los Angeles,false
Bob Johnson,35,Chicago,true
Alice Brown,28,Houston,false`;

function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseValue(value: string): string | number | boolean | null {
  if (value !== '' && !isNaN(Number(value))) {
    return Number(value);
  }
  if (value.toLowerCase() === 'true') {
    return true;
  }
  if (value.toLowerCase() === 'false') {
    return false;
  }
  if (value === '' || value.toLowerCase() === 'null') {
    return null;
  }
  return value;
}

async function convertCsvToJson(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  const lines = input.trim().split(/\r?\n/);
  if (lines.length === 0) {
    throw new Error('Empty CSV input');
  }

  const rows = lines.map((line) => parseCSVLine(line, ','));
  const headers = rows[0];
  const data = rows.slice(1).map((row) => {
    const obj: Record<string, string | number | boolean | null> = {};
    headers.forEach((header, index) => {
      obj[header] = parseValue(row[index] ?? '');
    });
    return obj;
  });

  return JSON.stringify(data, null, 2);
}

export default function CSVToJSONPage() {
  return (
    <ToolLayout
      toolName="CSV to JSON"
      toolDescription="Convert CSV data to JSON format. Automatically detects headers, parses numbers and booleans, and handles quoted fields."
      onProcess={convertCsvToJson}
      placeholder="Paste your CSV here..."
      sampleData={SAMPLE_CSV}
      showJsonButtons={false}
    />
  );
}
