/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON5 to JSON Converter
 * Parse JSON5 and convert to standard JSON
 */

import { ToolLayout } from '@/components/ToolLayout';

const SAMPLE_JSON5 = `{
  // This is a comment
  name: 'John Doe',  // Single quotes are allowed
  age: 30,

  /* Multi-line comments
     are also supported */
  isActive: true,

  // Trailing commas are allowed
  tags: [
    'developer',
    'admin',
    'user',
  ],

  // Unquoted keys
  address: {
    street: "123 Main St",
    city: 'New York',
    zipCode: '10001',
  },

  // Hexadecimal numbers
  color: 0xFF5733,

  // Numbers with leading or trailing decimal
  leadingDecimal: .5,
  trailingDecimal: 5.,

  // Positive sign is allowed
  positiveNumber: +10,
}`;

function parseJSON5(input: string): unknown {
  let pos = 0;
  const len = input.length;

  function skipWhitespaceAndComments(): void {
    while (pos < len) {
      const char = input[pos];

      if (/\s/.test(char)) {
        pos++;
        continue;
      }

      if (input.slice(pos, pos + 2) === '//') {
        while (pos < len && input[pos] !== '\n') {
          pos++;
        }
        continue;
      }

      if (input.slice(pos, pos + 2) === '/*') {
        pos += 2;
        while (pos < len && input.slice(pos, pos + 2) !== '*/') {
          pos++;
        }
        pos += 2;
        continue;
      }

      break;
    }
  }

  function parseValue(): unknown {
    skipWhitespaceAndComments();

    if (pos >= len) {
      throw new Error('Unexpected end of input');
    }

    const char = input[pos];

    if (char === '{') return parseObject();
    if (char === '[') return parseArray();
    if (char === '"' || char === "'") return parseString(char);
    if (char === '-' || char === '+' || /\d/.test(char) || char === '.') return parseNumber();
    if (input.slice(pos, pos + 4) === 'true') {
      pos += 4;
      return true;
    }
    if (input.slice(pos, pos + 5) === 'false') {
      pos += 5;
      return false;
    }
    if (input.slice(pos, pos + 4) === 'null') {
      pos += 4;
      return null;
    }
    if (input.slice(pos, pos + 8) === 'Infinity') {
      pos += 8;
      return null; // Convert Infinity to null for JSON compatibility
    }
    if (input.slice(pos, pos + 9) === '-Infinity') {
      pos += 9;
      return null;
    }
    if (input.slice(pos, pos + 3) === 'NaN') {
      pos += 3;
      return null; // Convert NaN to null for JSON compatibility
    }

    throw new Error(`Unexpected character at position ${pos}: ${char}`);
  }

  function parseObject(): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    pos++;

    skipWhitespaceAndComments();

    if (input[pos] === '}') {
      pos++;
      return obj;
    }

    while (pos < len) {
      skipWhitespaceAndComments();

      let key: string;
      if (input[pos] === '"' || input[pos] === "'") {
        key = parseString(input[pos]) as string;
      } else {
        const start = pos;
        while (pos < len && /[\w$]/.test(input[pos])) {
          pos++;
        }
        key = input.slice(start, pos);
      }

      skipWhitespaceAndComments();

      if (input[pos] !== ':') {
        throw new Error(`Expected ':' at position ${pos}`);
      }
      pos++;

      const value = parseValue();
      obj[key] = value;

      skipWhitespaceAndComments();

      if (input[pos] === '}') {
        pos++;
        return obj;
      }

      if (input[pos] === ',') {
        pos++;
        skipWhitespaceAndComments();
        if (input[pos] === '}') {
          pos++;
          return obj;
        }
      }
    }

    throw new Error('Unterminated object');
  }

  function parseArray(): unknown[] {
    const arr: unknown[] = [];
    pos++;

    skipWhitespaceAndComments();

    if (input[pos] === ']') {
      pos++;
      return arr;
    }

    while (pos < len) {
      const value = parseValue();
      arr.push(value);

      skipWhitespaceAndComments();

      if (input[pos] === ']') {
        pos++;
        return arr;
      }

      if (input[pos] === ',') {
        pos++;
        skipWhitespaceAndComments();
        if (input[pos] === ']') {
          pos++;
          return arr;
        }
      }
    }

    throw new Error('Unterminated array');
  }

  function parseString(quote: string): string {
    pos++;
    let str = '';

    while (pos < len) {
      const char = input[pos];

      if (char === quote) {
        pos++;
        return str;
      }

      if (char === '\\') {
        pos++;
        const escaped = input[pos];
        switch (escaped) {
          case 'n':
            str += '\n';
            break;
          case 'r':
            str += '\r';
            break;
          case 't':
            str += '\t';
            break;
          case 'b':
            str += '\b';
            break;
          case 'f':
            str += '\f';
            break;
          case '\n':
            break;
          case '\r':
            if (input[pos + 1] === '\n') pos++;
            break;
          case 'u': {
            const hex = input.slice(pos + 1, pos + 5);
            str += String.fromCharCode(parseInt(hex, 16));
            pos += 4;
            break;
          }
          default:
            str += escaped;
        }
        pos++;
      } else {
        str += char;
        pos++;
      }
    }

    throw new Error('Unterminated string');
  }

  function parseNumber(): number {
    const start = pos;

    if (input[pos] === '+' || input[pos] === '-') {
      pos++;
    }

    if (input.slice(pos, pos + 2) === '0x' || input.slice(pos, pos + 2) === '0X') {
      pos += 2;
      while (pos < len && /[0-9a-fA-F]/.test(input[pos])) {
        pos++;
      }
      return parseInt(input.slice(start, pos), 16);
    }

    while (pos < len && /[\d.]/.test(input[pos])) {
      pos++;
    }

    if (input[pos] === 'e' || input[pos] === 'E') {
      pos++;
      if (input[pos] === '+' || input[pos] === '-') {
        pos++;
      }
      while (pos < len && /\d/.test(input[pos])) {
        pos++;
      }
    }

    return parseFloat(input.slice(start, pos));
  }

  skipWhitespaceAndComments();
  return parseValue();
}

async function convertJson5ToJson(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  try {
    const parsed = parseJSON5(input);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    throw new Error(`Invalid JSON5: ${error instanceof Error ? error.message : 'Parse error'}`);
  }
}

export default function JSON5ToJSONPage() {
  return (
    <ToolLayout
      toolName="JSON5 to JSON"
      toolDescription="Parse JSON5 and convert to standard JSON. Supports comments, trailing commas, unquoted keys, hex numbers, and more."
      onProcess={convertJson5ToJson}
      placeholder="Paste your JSON5 here..."
      sampleData={SAMPLE_JSON5}
      showJsonButtons={false}
    />
  );
}
