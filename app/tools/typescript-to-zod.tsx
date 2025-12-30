/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * TypeScript to Zod Schema Converter
 * Generate Zod schemas from TypeScript interfaces
 */

import { ToolLayout } from '@/components/ToolLayout';

const SAMPLE_TYPESCRIPT = `interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  isActive: boolean;
  role: "admin" | "user" | "guest";
  tags: string[];
  address: {
    street: string;
    city: string;
    zipCode: string;
  };
  createdAt: Date;
}

type Status = "pending" | "approved" | "rejected";

interface Order {
  orderId: string;
  userId: number;
  status: Status;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  total: number;
}`;

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

function parseTypeScriptInterfaces(code: string): {
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
    types.push({
      name: match[1],
      definition: match[2].trim(),
    });
  }

  return { interfaces, types };
}

function typeToZod(type: string, knownTypes: Set<string>): string {
  const trimmed = type.trim();

  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map((p) => p.trim());
    if (parts.every((p) => p.startsWith('"') || p.startsWith("'"))) {
      const values = parts.map((p) => p.replace(/['"]/g, ''));
      return `z.enum([${values.map((v) => `"${v}"`).join(', ')}])`;
    }
    const zodParts = parts.map((p) => typeToZod(p, knownTypes));
    return `z.union([${zodParts.join(', ')}])`;
  }

  if (trimmed.endsWith('[]')) {
    const itemType = trimmed.slice(0, -2);
    return `z.array(${typeToZod(itemType, knownTypes)})`;
  }

  const arrayMatch = trimmed.match(/^Array<(.+)>$/);
  if (arrayMatch) {
    return `z.array(${typeToZod(arrayMatch[1], knownTypes)})`;
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const body = trimmed.slice(1, -1);
    const fields: string[] = [];
    const fieldRegex = /(\w+)(\?)?:\s*([^;,}]+)/g;
    let fieldMatch;

    while ((fieldMatch = fieldRegex.exec(body)) !== null) {
      const fieldName = fieldMatch[1];
      const optional = fieldMatch[2] === '?';
      const fieldType = fieldMatch[3].trim();
      let zodType = typeToZod(fieldType, knownTypes);
      if (optional) {
        zodType += '.optional()';
      }
      fields.push(`  ${fieldName}: ${zodType}`);
    }

    return `z.object({\n${fields.join(',\n')}\n})`;
  }

  switch (trimmed) {
    case 'string':
      return 'z.string()';
    case 'number':
      return 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    case 'null':
      return 'z.null()';
    case 'undefined':
      return 'z.undefined()';
    case 'any':
      return 'z.any()';
    case 'unknown':
      return 'z.unknown()';
    case 'never':
      return 'z.never()';
    case 'Date':
      return 'z.date()';
    case 'bigint':
      return 'z.bigint()';
  }

  if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
    return `z.literal(${trimmed})`;
  }

  if (/^\d+$/.test(trimmed)) {
    return `z.literal(${trimmed})`;
  }

  if (knownTypes.has(trimmed)) {
    return `${trimmed}Schema`;
  }

  return 'z.unknown()';
}

async function convertTypeScriptToZod(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  const { interfaces, types } = parseTypeScriptInterfaces(input);
  const lines: string[] = [];

  lines.push('import { z } from "zod";');
  lines.push('');

  const knownTypes = new Set<string>();
  interfaces.forEach((i) => knownTypes.add(i.name));
  types.forEach((t) => knownTypes.add(t.name));

  for (const type of types) {
    const zodType = typeToZod(type.definition, knownTypes);
    lines.push(`export const ${type.name}Schema = ${zodType};`);
    lines.push(`export type ${type.name} = z.infer<typeof ${type.name}Schema>;`);
    lines.push('');
  }

  for (const iface of interfaces) {
    lines.push(`export const ${iface.name}Schema = z.object({`);

    for (const field of iface.fields) {
      let zodType = typeToZod(field.type, knownTypes);
      if (field.optional) {
        zodType += '.optional()';
      }
      lines.push(`  ${field.name}: ${zodType},`);
    }

    lines.push('});');
    lines.push(`export type ${iface.name} = z.infer<typeof ${iface.name}Schema>;`);
    lines.push('');
  }

  return lines.join('\n').trim();
}

export default function TypeScriptToZodPage() {
  return (
    <ToolLayout
      toolName="TypeScript to Zod"
      toolDescription="Generate Zod schemas from TypeScript interfaces and type aliases. Includes inferred type exports."
      onProcess={convertTypeScriptToZod}
      placeholder="Paste your TypeScript interfaces here..."
      sampleData={SAMPLE_TYPESCRIPT}
      showJsonButtons={false}
    />
  );
}
