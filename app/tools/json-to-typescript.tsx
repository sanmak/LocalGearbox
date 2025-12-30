/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to TypeScript Converter
 * Generate TypeScript interfaces from JSON data
 */

import { ToolLayout } from '@/components/ToolLayout';

// Type inference and interface generation
function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

function isValidIdentifier(str: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}

interface InterfaceInfo {
  name: string;
  properties: Map<string, { type: string; optional: boolean }>;
}

function generateInterfaces(
  obj: unknown,
  rootName: string = 'Root',
  interfaces: Map<string, InterfaceInfo> = new Map(),
  visited: WeakSet<object> = new WeakSet(),
): Map<string, InterfaceInfo> {
  if (obj === null || typeof obj !== 'object') {
    return interfaces;
  }

  if (visited.has(obj as object)) {
    return interfaces;
  }
  visited.add(obj as object);

  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
      // Merge all object types in array
      const mergedProps = new Map<string, { types: Set<string>; count: number }>();

      for (const item of obj) {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
            const existing = mergedProps.get(key) || {
              types: new Set(),
              count: 0,
            };
            existing.types.add(
              inferType(
                value,
                toPascalCase(`${rootName}${toPascalCase(key)}`),
                interfaces,
                visited,
              ),
            );
            existing.count++;
            mergedProps.set(key, existing);
          }
        }
      }

      const interfaceInfo: InterfaceInfo = {
        name: rootName,
        properties: new Map(),
      };

      for (const [key, { types, count }] of mergedProps) {
        const isOptional = count < obj.length;
        const type = types.size === 1 ? [...types][0] : [...types].join(' | ');
        interfaceInfo.properties.set(key, { type, optional: isOptional });
      }

      interfaces.set(rootName, interfaceInfo);
    }
    return interfaces;
  }

  const entries = Object.entries(obj as Record<string, unknown>);
  const interfaceInfo: InterfaceInfo = {
    name: rootName,
    properties: new Map(),
  };

  for (const [key, value] of entries) {
    const propertyType = inferType(
      value,
      toPascalCase(`${rootName}${toPascalCase(key)}`),
      interfaces,
      visited,
    );
    interfaceInfo.properties.set(key, { type: propertyType, optional: false });
  }

  interfaces.set(rootName, interfaceInfo);
  return interfaces;
}

function inferType(
  value: unknown,
  suggestedName: string,
  interfaces: Map<string, InterfaceInfo>,
  visited: WeakSet<object>,
): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  switch (typeof value) {
    case 'string':
      return 'string';
    case 'number':
      return Number.isInteger(value) ? 'number' : 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
      if (Array.isArray(value)) {
        if (value.length === 0) return 'unknown[]';

        const itemTypes = new Set<string>();
        let hasObjects = false;

        for (const item of value) {
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            hasObjects = true;
          } else {
            itemTypes.add(inferType(item, suggestedName + 'Item', interfaces, visited));
          }
        }

        if (hasObjects) {
          // Generate interface for array items
          generateInterfaces(value, suggestedName + 'Item', interfaces, visited);
          itemTypes.add(suggestedName + 'Item');
        }

        const types = [...itemTypes];
        if (types.length === 1) {
          return `${types[0]}[]`;
        }
        return `(${types.join(' | ')})[]`;
      }

      // Regular object
      generateInterfaces(value, suggestedName, interfaces, visited);
      return suggestedName;
    default:
      return 'unknown';
  }
}

function formatPropertyName(key: string): string {
  if (isValidIdentifier(key)) {
    return key;
  }
  return `"${key.replace(/"/g, '\\"')}"`;
}

function interfacesToString(interfaces: Map<string, InterfaceInfo>): string {
  const result: string[] = [];

  // Sort interfaces so Root comes first
  const sortedEntries = [...interfaces.entries()].sort(([a], [b]) => {
    if (a === 'Root') return -1;
    if (b === 'Root') return 1;
    return a.localeCompare(b);
  });

  for (const [, info] of sortedEntries) {
    const lines: string[] = [];
    lines.push(`export interface ${info.name} {`);

    for (const [key, { type, optional }] of info.properties) {
      const propName = formatPropertyName(key);
      const optionalMark = optional ? '?' : '';
      lines.push(`  ${propName}${optionalMark}: ${type};`);
    }

    lines.push('}');
    result.push(lines.join('\n'));
  }

  return result.join('\n\n');
}

async function convertJsonToTypescript(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  if (input.length > 10 * 1024 * 1024) {
    throw new Error('Input exceeds size limit of 10MB');
  }

  try {
    const parsed = JSON.parse(input);

    if (parsed === null) {
      return 'export type Root = null;';
    }

    if (typeof parsed !== 'object') {
      return `export type Root = ${typeof parsed};`;
    }

    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        return 'export type Root = unknown[];';
      }

      // Check if array contains objects
      const hasObjects = parsed.some(
        (item) => typeof item === 'object' && item !== null && !Array.isArray(item),
      );

      if (hasObjects) {
        const interfaces = generateInterfaces(parsed, 'RootItem');
        const interfacesStr = interfacesToString(interfaces);
        return interfacesStr + '\n\nexport type Root = RootItem[];';
      }

      // Primitive array
      const types = [...new Set(parsed.map((item) => typeof item))];
      return `export type Root = ${types.join(' | ')}[];`;
    }

    const interfaces = generateInterfaces(parsed, 'Root');
    return interfacesToString(interfaces);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
}

const SAMPLE_JSON = `{
  "userId": 1,
  "id": 1,
  "title": "delectus aut autem",
  "completed": false,
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "roles": ["admin", "user"],
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "zipCode": "10001"
    }
  },
  "tags": ["important", "urgent"],
  "metadata": null
}`;

export default function JsonToTypescriptPage() {
  return (
    <ToolLayout
      toolName="JSON to TypeScript"
      toolDescription="Generate TypeScript interfaces from JSON data. Automatically infers types and creates nested interfaces."
      onProcess={convertJsonToTypescript}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
