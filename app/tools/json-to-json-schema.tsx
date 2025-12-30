/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to JSON Schema Converter
 * Generate JSON Schema from JSON data
 */

import { ToolLayout } from '@/components/ToolLayout';

const SAMPLE_JSON = `{
  "id": 1,
  "name": "John Doe",
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
  ],
  "metadata": null
}`;

interface JsonSchema {
  $schema?: string;
  title?: string;
  description?: string;
  type?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  additionalProperties?: boolean;
  format?: string;
}

function inferFormat(value: string): string | undefined {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
  if (/^https?:\/\//.test(value)) return 'uri';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return 'date-time';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'uuid';
  return undefined;
}

function generateSchema(value: unknown): JsonSchema {
  if (value === null) {
    return { type: 'null' };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'array', items: {} };
    }
    return {
      type: 'array',
      items: generateSchema(value[0]),
    };
  }

  if (typeof value === 'object') {
    const schema: JsonSchema = {
      type: 'object',
      properties: {},
    };

    const requiredFields: string[] = [];

    for (const [propKey, propValue] of Object.entries(value as Record<string, unknown>)) {
      schema.properties![propKey] = generateSchema(propValue);
      if (propValue !== null) {
        requiredFields.push(propKey);
      }
    }

    if (requiredFields.length > 0) {
      schema.required = requiredFields;
    }

    return schema;
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean' };
  }

  if (typeof value === 'number') {
    return { type: Number.isInteger(value) ? 'integer' : 'number' };
  }

  if (typeof value === 'string') {
    const schema: JsonSchema = { type: 'string' };
    const format = inferFormat(value);
    if (format) {
      schema.format = format;
    }
    return schema;
  }

  return {};
}

async function convertJsonToJsonSchema(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  const parsed = JSON.parse(input);

  let rootSchema: JsonSchema;

  if (Array.isArray(parsed)) {
    rootSchema = generateSchema(parsed);
  } else if (typeof parsed === 'object' && parsed !== null) {
    rootSchema = generateSchema(parsed);
  } else {
    throw new Error('Input must be a JSON object or array');
  }

  rootSchema.$schema = 'http://json-schema.org/draft-07/schema#';
  rootSchema.title = 'Root';
  rootSchema.description = 'Generated JSON Schema from sample data';

  return JSON.stringify(rootSchema, null, 2);
}

export default function JSONToJSONSchemaPage() {
  return (
    <ToolLayout
      toolName="JSON to JSON Schema"
      toolDescription="Generate JSON Schema from JSON data. Automatically infers types and detects formats like email, URL, UUID, and dates."
      onProcess={convertJsonToJsonSchema}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
