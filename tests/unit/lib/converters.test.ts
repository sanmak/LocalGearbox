/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { jsonToCSV } from '@/lib/tools/converters';

describe('jsonToCSV', () => {
  it('should convert a simple array of objects to CSV', async () => {
    const input = JSON.stringify([
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
    ]);
    const result = await jsonToCSV(input);
    const lines = result.split('\n');
    expect(lines[0]).toBe('name,age');
    expect(lines[1]).toBe('John,30');
    expect(lines[2]).toBe('Jane,25');
  });

  it('should handle objects with different keys', async () => {
    const input = JSON.stringify([
      { name: 'John', age: 30 },
      { name: 'Jane', city: 'NYC' },
    ]);
    const result = await jsonToCSV(input);
    const lines = result.split('\n');
    // Header should contain all unique keys
    expect(lines[0]).toContain('name');
    expect(lines[0]).toContain('age');
    expect(lines[0]).toContain('city');
  });

  it('should handle null and undefined values as empty', async () => {
    const input = JSON.stringify([
      { name: 'John', value: null },
      { name: 'Jane', value: undefined },
    ]);
    const result = await jsonToCSV(input);
    const lines = result.split('\n');
    // Null/undefined should be empty strings
    expect(lines[1]).toBe('John,');
  });

  it('should escape values containing commas', async () => {
    const input = JSON.stringify([{ name: 'Doe, John', age: 30 }]);
    const result = await jsonToCSV(input);
    expect(result).toContain('"Doe, John"');
  });

  it('should escape values containing double quotes', async () => {
    const input = JSON.stringify([{ name: 'Say "hello"', age: 30 }]);
    const result = await jsonToCSV(input);
    expect(result).toContain('""hello""');
  });

  it('should escape values containing newlines', async () => {
    const input = JSON.stringify([{ name: 'Line1\nLine2', age: 30 }]);
    const result = await jsonToCSV(input);
    expect(result).toContain('"Line1\nLine2"');
  });

  it('should throw on non-array JSON', async () => {
    await expect(jsonToCSV('{"name": "John"}')).rejects.toThrow('JSON must be an array');
  });

  it('should throw on empty array', async () => {
    await expect(jsonToCSV('[]')).rejects.toThrow('JSON array is empty');
  });

  it('should throw on invalid JSON', async () => {
    await expect(jsonToCSV('{invalid}')).rejects.toThrow();
  });

  it('should throw on empty input', async () => {
    await expect(jsonToCSV('')).rejects.toThrow();
  });

  it('should handle single object array', async () => {
    const input = JSON.stringify([{ id: 1 }]);
    const result = await jsonToCSV(input);
    const lines = result.split('\n');
    expect(lines[0]).toBe('id');
    expect(lines[1]).toBe('1');
  });

  it('should handle boolean and numeric values', async () => {
    const input = JSON.stringify([{ active: true, count: 42, rate: 3.14 }]);
    const result = await jsonToCSV(input);
    expect(result).toContain('true');
    expect(result).toContain('42');
    expect(result).toContain('3.14');
  });

  it('should handle many columns', async () => {
    const obj: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      obj[`col${i}`] = i;
    }
    const input = JSON.stringify([obj]);
    const result = await jsonToCSV(input);
    const headers = result.split('\n')[0].split(',');
    expect(headers.length).toBe(20);
  });

  it('should handle many rows', async () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item${i}` }));
    const input = JSON.stringify(data);
    const result = await jsonToCSV(input);
    const lines = result.split('\n');
    expect(lines.length).toBe(101); // 1 header + 100 rows
  });
});
