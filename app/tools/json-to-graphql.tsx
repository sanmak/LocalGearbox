/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON to GraphQL Schema Converter
 * Generate GraphQL schema from JSON data
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
      "amount": 99.99,
      "date": "2024-01-15"
    }
  ]
}`;

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

function getGraphQLType(value: unknown, key: string, types: Map<string, string>): string {
  if (value === null) return 'String';

  if (Array.isArray(value)) {
    if (value.length === 0) return '[String]!';
    const itemType = getGraphQLType(value[0], key, types);
    const cleanType = itemType.replace('!', '');
    return `[${cleanType}]!`;
  }

  if (typeof value === 'object') {
    const typeName = toPascalCase(key);
    generateType(value as Record<string, unknown>, typeName, types);
    return `${typeName}!`;
  }

  if (typeof value === 'boolean') {
    return 'Boolean!';
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'Int!' : 'Float!';
  }

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value)) {
      return 'DateTime!';
    }
    if (key.toLowerCase() === 'id' || key.toLowerCase().endsWith('id')) {
      return 'ID!';
    }
    return 'String!';
  }

  return 'String';
}

function generateType(
  obj: Record<string, unknown>,
  typeName: string,
  types: Map<string, string>,
): void {
  if (types.has(typeName)) return;

  const lines: string[] = [];
  lines.push(`type ${typeName} {`);

  for (const [key, value] of Object.entries(obj)) {
    const graphqlType = getGraphQLType(value, key, types);
    lines.push(`  ${key}: ${graphqlType}`);
  }

  lines.push('}');
  types.set(typeName, lines.join('\n'));
}

async function convertJsonToGraphQL(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  try {
    const parsed = JSON.parse(input);
    const types = new Map<string, string>();

    const rootTypeName = 'Data';

    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        throw new Error('Cannot generate schema from empty array');
      }
      generateType(parsed[0] as Record<string, unknown>, rootTypeName, types);
    } else if (typeof parsed === 'object' && parsed !== null) {
      generateType(parsed as Record<string, unknown>, rootTypeName, types);
    } else {
      throw new Error('Input must be a JSON object or array');
    }

    const result: string[] = [];

    // Check if DateTime is used
    const usesDateTime = Array.from(types.values()).some((t) => t.includes('DateTime'));
    if (usesDateTime) {
      result.push('scalar DateTime');
      result.push('');
    }

    // Add main type first
    if (types.has(rootTypeName)) {
      result.push(types.get(rootTypeName)!);
      types.delete(rootTypeName);
    }

    // Add nested types
    for (const [, code] of types) {
      result.push('');
      result.push(code);
    }

    // Generate Query type
    result.push('');
    result.push('type Query {');
    const lowerName = rootTypeName.charAt(0).toLowerCase() + rootTypeName.slice(1);
    result.push(`  ${lowerName}(id: ID!): ${rootTypeName}`);
    result.push(`  ${lowerName}s: [${rootTypeName}!]!`);
    result.push('}');

    // Generate Mutation type
    result.push('');
    result.push('type Mutation {');
    result.push(`  create${rootTypeName}(input: Create${rootTypeName}Input!): ${rootTypeName}!`);
    result.push(
      `  update${rootTypeName}(id: ID!, input: Update${rootTypeName}Input!): ${rootTypeName}`,
    );
    result.push(`  delete${rootTypeName}(id: ID!): Boolean!`);
    result.push('}');

    // Generate input type
    result.push('');
    result.push(`input Create${rootTypeName}Input {`);

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (key === 'id') continue;
        let graphqlType = getGraphQLType(value, key, new Map());
        // Remove non-null for input and simplify nested types
        graphqlType = graphqlType.replace('!', '');
        if (
          !['String', 'Int', 'Float', 'Boolean', 'ID', 'DateTime'].some((t) =>
            graphqlType.startsWith(t),
          )
        ) {
          graphqlType = 'String';
        }
        result.push(`  ${key}: ${graphqlType}`);
      }
    }

    result.push('}');

    result.push('');
    result.push(`input Update${rootTypeName}Input {`);

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (key === 'id') continue;
        let graphqlType = getGraphQLType(value, key, new Map());
        graphqlType = graphqlType.replace('!', '');
        if (
          !['String', 'Int', 'Float', 'Boolean', 'ID', 'DateTime'].some((t) =>
            graphqlType.startsWith(t),
          )
        ) {
          graphqlType = 'String';
        }
        result.push(`  ${key}: ${graphqlType}`);
      }
    }

    result.push('}');

    return result.join('\n');
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
}

export default function JSONToGraphQLPage() {
  return (
    <ToolLayout
      toolName="JSON to GraphQL"
      toolDescription="Generate GraphQL schema from JSON data. Creates types, queries, mutations, and input types."
      onProcess={convertJsonToGraphQL}
      placeholder="Paste your JSON here..."
      sampleData={SAMPLE_JSON}
      showJsonButtons={true}
    />
  );
}
