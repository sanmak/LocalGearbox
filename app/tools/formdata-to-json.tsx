/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * FormData to JSON Converter
 * Convert form data or URL query strings to JSON
 */

import { ToolLayout } from '@/components/ToolLayout';

const SAMPLE_FORMDATA = `name=John%20Doe
email=john%40example.com
age=30
city=New%20York
interests[]=coding
interests[]=gaming
interests[]=music
address[street]=123%20Main%20St
address[city]=New%20York
address[zip]=10001
active=true
score=95.5`;

function parseFormData(input: string): Record<string, unknown> {
  const lines = input.trim().split(/\r?\n/);
  const result: Record<string, unknown> = {};

  for (const line of lines) {
    if (!line.trim()) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    let key = decodeURIComponent(line.substring(0, eqIndex));
    let value: string | number | boolean = decodeURIComponent(line.substring(eqIndex + 1));

    // Parse as number
    if (value !== '' && !isNaN(Number(value))) {
      value = Number(value);
    } else if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    }

    // Handle array notation: field[] or field[0]
    const arrayMatch = key.match(/^(.+?)(\[\d*\])$/);
    if (arrayMatch) {
      const arrayKey = arrayMatch[1];
      if (!result[arrayKey]) {
        result[arrayKey] = [];
      }
      (result[arrayKey] as unknown[]).push(value);
      continue;
    }

    // Handle nested notation: field[subfield]
    const nestedMatch = key.match(/^(.+?)\[([^\]]+)\]$/);
    if (nestedMatch) {
      const parentKey = nestedMatch[1];
      const childKey = nestedMatch[2];
      if (!result[parentKey]) {
        result[parentKey] = {};
      }
      if (typeof result[parentKey] === 'object' && !Array.isArray(result[parentKey])) {
        (result[parentKey] as Record<string, unknown>)[childKey] = value;
      }
      continue;
    }

    result[key] = value;
  }

  return result;
}

async function convertFormDataToJson(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  const trimmed = input.trim();

  // Check if it looks like URL query string format
  let formattedInput = trimmed;
  if (trimmed.includes('&') && !trimmed.includes('\n')) {
    // It's a query string, check if it's a full URL
    if (trimmed.includes('?')) {
      formattedInput = trimmed.split('?')[1];
    }
    formattedInput = formattedInput.split('&').join('\n');
  }

  const result = parseFormData(formattedInput);
  return JSON.stringify(result, null, 2);
}

export default function FormDataToJSONPage() {
  return (
    <ToolLayout
      toolName="FormData to JSON"
      toolDescription="Convert form data or URL query strings to JSON. Supports URL decoding, arrays, nested objects, and type parsing."
      onProcess={convertFormDataToJson}
      placeholder="Paste your form data or query string here..."
      sampleData={SAMPLE_FORMDATA}
      showJsonButtons={false}
    />
  );
}
