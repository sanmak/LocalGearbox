/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * TypeScript to GraphQL Schema Converter
 * Generate GraphQL schemas from TypeScript interfaces
 */

import { ToolLayout } from '@/components/ToolLayout';

const SAMPLE_TYPESCRIPT = `interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  isActive: boolean;
  role: "admin" | "user" | "guest";
  createdAt: Date;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author: User;
  tags: string[];
  publishedAt?: Date;
  views: number;
  isPublished: boolean;
}

interface Comment {
  id: number;
  text: string;
  author: User;
  post: Post;
  createdAt: Date;
}

type Status = "draft" | "pending" | "published" | "archived";`;

interface ParsedField {
  name: string;
  type: string;
  optional: boolean;
}

interface ParsedInterface {
  name: string;
  fields: ParsedField[];
}

interface ParsedType {
  name: string;
  definition: string;
}

function parseTypeScript(code: string): {
  interfaces: ParsedInterface[];
  types: ParsedType[];
} {
  const interfaces: ParsedInterface[] = [];
  const types: ParsedType[] = [];

  const interfaceRegex = /interface\s+(\w+)\s*\{([^}]+)\}/g;
  let match;

  while ((match = interfaceRegex.exec(code)) !== null) {
    const name = match[1];
    const body = match[2];
    const fields: ParsedField[] = [];

    const fieldRegex = /(\w+)(\?)?:\s*([^;]+);/g;
    let fieldMatch;

    while ((fieldMatch = fieldRegex.exec(body)) !== null) {
      fields.push({
        name: fieldMatch[1],
        optional: fieldMatch[2] === '?',
        type: fieldMatch[3].trim(),
      });
    }

    interfaces.push({ name, fields });
  }

  const typeRegex = /type\s+(\w+)\s*=\s*([^;]+);/g;
  while ((match = typeRegex.exec(code)) !== null) {
    types.push({ name: match[1], definition: match[2].trim() });
  }

  return { interfaces, types };
}

function tsTypeToGraphQL(type: string, optional: boolean, knownTypes: Set<string>): string {
  const trimmed = type.trim();

  if (trimmed.endsWith('[]')) {
    const itemType = trimmed.slice(0, -2);
    const graphqlItemType = tsTypeToGraphQL(itemType, false, knownTypes);
    const listType = `[${graphqlItemType}]`;
    return optional ? listType : `${listType}!`;
  }

  const arrayMatch = trimmed.match(/^Array<(.+)>$/);
  if (arrayMatch) {
    const graphqlItemType = tsTypeToGraphQL(arrayMatch[1], false, knownTypes);
    const listType = `[${graphqlItemType}]`;
    return optional ? listType : `${listType}!`;
  }

  if (trimmed.includes('|')) {
    return optional ? 'String' : 'String!';
  }

  if (knownTypes.has(trimmed)) {
    return optional ? trimmed : `${trimmed}!`;
  }

  let graphqlType: string;
  switch (trimmed) {
    case 'string':
      graphqlType = 'String';
      break;
    case 'number':
      graphqlType = 'Float';
      break;
    case 'boolean':
      graphqlType = 'Boolean';
      break;
    case 'Date':
      graphqlType = 'DateTime';
      break;
    default:
      graphqlType = knownTypes.has(trimmed) ? trimmed : 'String';
  }

  return optional ? graphqlType : `${graphqlType}!`;
}

async function convertTypeScriptToGraphQL(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  const { interfaces, types } = parseTypeScript(input);
  const lines: string[] = [];

  const knownTypes = new Set<string>();
  interfaces.forEach((i) => knownTypes.add(i.name));
  types.forEach((t) => knownTypes.add(t.name));

  const usesDate = interfaces.some((i) => i.fields.some((f) => f.type.includes('Date')));
  if (usesDate) {
    lines.push('scalar DateTime');
    lines.push('');
  }

  for (const type of types) {
    const parts = type.definition.split('|').map((p) => p.trim());
    if (parts.every((p) => p.startsWith('"') || p.startsWith("'"))) {
      lines.push(`enum ${type.name} {`);
      for (const part of parts) {
        const value = part.replace(/['"]/g, '').toUpperCase();
        lines.push(`  ${value}`);
      }
      lines.push('}');
      lines.push('');
    }
  }

  for (const iface of interfaces) {
    lines.push(`type ${iface.name} {`);
    for (const field of iface.fields) {
      const graphqlType = tsTypeToGraphQL(field.type, field.optional, knownTypes);
      lines.push(`  ${field.name}: ${graphqlType}`);
    }
    lines.push('}');
    lines.push('');
  }

  if (interfaces.length > 0) {
    lines.push('type Query {');
    for (const iface of interfaces) {
      const lowerName = iface.name.charAt(0).toLowerCase() + iface.name.slice(1);
      lines.push(`  ${lowerName}(id: ID!): ${iface.name}`);
      lines.push(`  ${lowerName}s: [${iface.name}!]!`);
    }
    lines.push('}');
  }

  return lines.join('\n').trim();
}

export default function TypeScriptToGraphQLPage() {
  return (
    <ToolLayout
      toolName="TypeScript to GraphQL"
      toolDescription="Generate GraphQL schema from TypeScript interfaces with Query type and enums."
      onProcess={convertTypeScriptToGraphQL}
      placeholder="Paste your TypeScript interfaces here..."
      sampleData={SAMPLE_TYPESCRIPT}
      showJsonButtons={false}
    />
  );
}
