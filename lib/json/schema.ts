/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * JSON Schema Generator
 * Generate JSON Schema from sample data
 */

import { JsonSchema, JsonSchemaProperty } from './types';
import { detectContentType } from './content-detector';

/**
 * Infer JSON Schema from data
 */
export const inferJsonSchema = (
  data: unknown,
  schemaVersion: 'draft-07' | '2020-12' = '2020-12',
): JsonSchema => {
  const schemaUrl =
    schemaVersion === 'draft-07'
      ? 'http://json-schema.org/draft-07/schema#'
      : 'https://json-schema.org/draft/2020-12/schema';

  const schema: JsonSchema = {
    $schema: schemaUrl,
    type: 'object',
  };

  const inferType = (value: unknown): JsonSchemaProperty => {
    if (value === null) {
      return { type: 'null' };
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return { type: 'array', items: { type: 'string' } };
      }
      // Infer from first item
      return { type: 'array', items: inferType(value[0]) };
    }

    if (typeof value === 'object') {
      const properties: Record<string, JsonSchemaProperty> = {};
      const required: string[] = [];

      Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
        properties[key] = inferType(val);
        if (val !== null && val !== undefined) {
          required.push(key);
        }
      });

      return { type: 'object', properties, required };
    }

    if (typeof value === 'string') {
      const content = detectContentType(value);
      switch (content.type) {
        case 'date':
          return { type: 'string', format: 'date-time' };
        case 'email':
          return { type: 'string', format: 'email' };
        case 'url':
        case 'image':
          return { type: 'string', format: 'uri' };
        case 'uuid':
          return { type: 'string', format: 'uuid' };
        default:
          return { type: 'string' };
      }
    }

    if (typeof value === 'number') {
      return { type: Number.isInteger(value) ? 'integer' : 'number' };
    }

    if (typeof value === 'boolean') {
      return { type: 'boolean' };
    }

    return { type: 'string' };
  };

  if (Array.isArray(data)) {
    schema.type = 'array';
    if (data.length > 0) {
      schema.items = inferType(data[0]);
    }
  } else if (typeof data === 'object' && data !== null) {
    const inferred = inferType(data);
    schema.properties = inferred.properties;
    schema.required = inferred.required;
  }

  return schema;
};

/**
 * Format schema as string
 */
export const formatSchema = (schema: JsonSchema, indent = 2): string => {
  return JSON.stringify(schema, null, indent);
};

/**
 * Validate data against schema (basic validation)
 */
export const validateAgainstSchema = (
  data: unknown,
  schema: JsonSchema,
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const validateType = (value: unknown, schemaType: string | string[], path: string): boolean => {
    const types = Array.isArray(schemaType) ? schemaType : [schemaType];

    for (const type of types) {
      if (type === 'null' && value === null) return true;
      if (type === 'string' && typeof value === 'string') return true;
      if (type === 'number' && typeof value === 'number') return true;
      if (type === 'integer' && Number.isInteger(value)) return true;
      if (type === 'boolean' && typeof value === 'boolean') return true;
      if (type === 'array' && Array.isArray(value)) return true;
      if (type === 'object' && typeof value === 'object' && value !== null && !Array.isArray(value))
        return true;
    }

    errors.push(`Type mismatch at "${path}": expected ${types.join(' | ')}, got ${typeof value}`);
    return false;
  };

  const validate = (value: unknown, schemaNode: JsonSchemaProperty, path: string) => {
    if (!validateType(value, schemaNode.type, path)) return;

    if (schemaNode.type === 'object' && schemaNode.properties) {
      const obj = value as Record<string, unknown>;

      // Check required fields
      if (schemaNode.required) {
        for (const req of schemaNode.required) {
          if (!(req in obj)) {
            errors.push(`Missing required field "${req}" at "${path}"`);
          }
        }
      }

      // Validate properties
      for (const [key, propSchema] of Object.entries(schemaNode.properties)) {
        if (key in obj) {
          validate(obj[key], propSchema, `${path}.${key}`);
        }
      }
    }

    if (schemaNode.type === 'array' && schemaNode.items && Array.isArray(value)) {
      value.forEach((item, index) => {
        validate(item, schemaNode.items!, `${path}[${index}]`);
      });
    }
  };

  // Start validation
  if (schema.type === 'array' && schema.items) {
    if (!Array.isArray(data)) {
      errors.push('Expected array at root');
    } else {
      data.forEach((item, index) => {
        validate(item, schema.items!, `[${index}]`);
      });
    }
  } else if (schema.properties) {
    validate(
      data,
      {
        type: 'object',
        properties: schema.properties,
        required: schema.required,
      },
      '',
    );
  }

  return { valid: errors.length === 0, errors };
};
