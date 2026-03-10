/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { diffLines, diffChars } from '@/lib/tools/comparators/diff-engine';
import { detectFormat, detectFormatFromPair } from '@/lib/tools/comparators/format-detector';
import { validateDiffInputs } from '@/lib/tools/comparators/shared';
import { dataDiff } from '@/lib/tools/comparators';

describe('diffLines', () => {
  it('should detect no changes for identical inputs', () => {
    const result = diffLines('hello\nworld', 'hello\nworld');
    expect(result.stats.additions).toBe(0);
    expect(result.stats.deletions).toBe(0);
    expect(result.stats.modifications).toBe(0);
    expect(result.stats.unchanged).toBe(2);
  });

  it('should detect added lines', () => {
    const result = diffLines('line1', 'line1\nline2');
    expect(result.stats.additions).toBeGreaterThan(0);
  });

  it('should detect deleted lines', () => {
    const result = diffLines('line1\nline2', 'line1');
    expect(result.stats.deletions).toBeGreaterThan(0);
  });

  it('should detect modified lines', () => {
    const result = diffLines('hello', 'world');
    expect(result.stats.modifications).toBe(1);
  });

  it('should handle empty lines in input', () => {
    const result = diffLines('a\n\nb', 'a\n\nb');
    expect(result.stats.unchanged).toBe(3);
  });

  it('should respect ignoreCase option', () => {
    const result = diffLines('Hello', 'hello', { ignoreCase: true });
    expect(result.stats.unchanged).toBe(1);
    expect(result.stats.modifications).toBe(0);
  });

  it('should respect ignoreWhitespace option', () => {
    const result = diffLines('  hello  ', 'hello', { ignoreWhitespace: true });
    expect(result.stats.unchanged).toBe(1);
  });

  it('should respect ignoreBlankLines option', () => {
    const left = 'line1\n\n\nline2';
    const right = 'line1\nline2';
    const result = diffLines(left, right, { ignoreBlankLines: true });
    expect(result.stats.unchanged).toBe(2);
  });

  it('should return proper DiffChange objects', () => {
    const result = diffLines('a\nb', 'a\nc');
    expect(result.changes.length).toBeGreaterThan(0);
    const unchanged = result.changes.find((c) => c.type === 'unchanged');
    expect(unchanged).toBeDefined();
    expect(unchanged?.leftContent).toBe('a');
  });

  it('should handle multi-line diff with additions and deletions', () => {
    const left = 'line1\nline2\nline3';
    const right = 'line1\nmodified\nline3\nline4';
    const result = diffLines(left, right);
    expect(result.changes.length).toBeGreaterThan(0);
    // line1 and line3 are unchanged, line2 is modified, line4 is added
    expect(result.stats.unchanged).toBeGreaterThanOrEqual(2);
  });

  it('should handle completely different inputs', () => {
    const result = diffLines('abc', 'xyz');
    expect(result.stats.modifications).toBeGreaterThanOrEqual(1);
    expect(result.stats.unchanged).toBe(0);
  });

  it('should handle single line inputs', () => {
    const result = diffLines('single', 'single');
    expect(result.stats.unchanged).toBe(1);
    expect(result.changes).toHaveLength(1);
  });
});

describe('diffChars', () => {
  it('should detect no changes for identical strings', () => {
    const result = diffChars('hello', 'hello');
    expect(result.stats.additions).toBe(0);
    expect(result.stats.deletions).toBe(0);
    expect(result.stats.modifications).toBe(0);
    expect(result.stats.unchanged).toBeGreaterThan(0);
  });

  it('should detect character additions', () => {
    const result = diffChars('helo', 'hello');
    expect(result.stats.additions).toBeGreaterThan(0);
  });

  it('should detect character deletions', () => {
    const result = diffChars('hello', 'helo');
    expect(result.stats.deletions).toBeGreaterThan(0);
  });

  it('should detect character modifications', () => {
    const result = diffChars('abc', 'axc');
    // 'a' and 'c' unchanged, 'b' -> 'x' modified
    const totalChanges =
      result.stats.additions + result.stats.deletions + result.stats.modifications;
    expect(totalChanges).toBeGreaterThan(0);
  });

  it('should handle completely different strings', () => {
    const result = diffChars('abc', 'xyz');
    expect(result.stats.unchanged).toBe(0);
  });

  it('should handle empty left string', () => {
    const result = diffChars('', 'hello');
    expect(result.stats.additions).toBeGreaterThan(0);
    expect(result.stats.deletions).toBe(0);
  });

  it('should handle empty right string', () => {
    const result = diffChars('hello', '');
    expect(result.stats.deletions).toBeGreaterThan(0);
    expect(result.stats.additions).toBe(0);
  });

  it('should return DiffChange objects with content', () => {
    const result = diffChars('ab', 'ac');
    expect(result.changes.length).toBeGreaterThan(0);
    const hasContent = result.changes.every(
      (c) => c.leftContent !== undefined || c.rightContent !== undefined,
    );
    expect(hasContent).toBe(true);
  });
});

describe('detectFormat', () => {
  it('should detect valid JSON with high confidence', () => {
    const result = detectFormat('{"key": "value"}');
    expect(result.format).toBe('json');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('should detect valid JSON array', () => {
    const result = detectFormat('[1, 2, 3]');
    expect(result.format).toBe('json');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('should detect CSV with consistent columns', () => {
    const input = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
    const result = detectFormat(input);
    expect(result.format).toBe('csv');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('should default to text for empty input', () => {
    const result = detectFormat('');
    expect(result.format).toBe('text');
    expect(result.confidence).toBe(1.0);
  });

  it('should default to text for plain text', () => {
    const result = detectFormat('This is just plain text without any structure.');
    expect(result.format).toBe('text');
  });

  it('should detect text for non-JSON non-CSV content', () => {
    const result = detectFormat('Hello, World! This is a simple message.');
    expect(result.format).toBe('text');
  });

  it('should detect JSON-like invalid JSON with moderate confidence', () => {
    const result = detectFormat('{"key": value}'); // missing quotes
    expect(result.format).toBe('json');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThan(1.0);
  });

  it('should handle whitespace-only input as text', () => {
    const result = detectFormat('   \n\t  ');
    expect(result.format).toBe('text');
    expect(result.confidence).toBe(1.0);
  });

  it('should detect tab-delimited CSV', () => {
    const input = 'name\tage\tcity\nJohn\t30\tNYC\nJane\t25\tLA';
    const result = detectFormat(input);
    expect(result.format).toBe('csv');
  });

  it('should not detect single-line content as CSV with high confidence', () => {
    const result = detectFormat('a,b,c');
    // Single line should not be detected as CSV (the detectCSV function
    // returns low confidence for single lines, but the final format may
    // still be text depending on overall scoring)
    if (result.format === 'csv') {
      expect(result.confidence).toBeLessThan(1.0);
    } else {
      expect(result.format).toBe('text');
    }
  });
});

describe('detectFormatFromPair', () => {
  it('should detect both as JSON when both are valid JSON', () => {
    const result = detectFormatFromPair('{"a": 1}', '{"b": 2}');
    expect(result.format).toBe('json');
    expect(result.leftFormat).toBe('json');
    expect(result.rightFormat).toBe('json');
  });

  it('should detect both as CSV when both are CSV', () => {
    const left = 'name,age\nJohn,30\nJane,25';
    const right = 'name,age\nBob,35\nAlice,28';
    const result = detectFormatFromPair(left, right);
    expect(result.format).toBe('csv');
  });

  it('should detect both as text when both are plain text', () => {
    const result = detectFormatFromPair('Hello world', 'Goodbye world');
    expect(result.format).toBe('text');
  });

  it('should prefer JSON when one is JSON and other is uncertain', () => {
    const result = detectFormatFromPair('{"key": "value"}', 'plain text');
    expect(result.format).toBe('json');
  });

  it('should include leftFormat and rightFormat', () => {
    const result = detectFormatFromPair('{"a": 1}', 'text');
    expect(result).toHaveProperty('leftFormat');
    expect(result).toHaveProperty('rightFormat');
    expect(result.leftFormat).toBe('json');
  });

  it('should handle empty inputs', () => {
    const result = detectFormatFromPair('', '');
    expect(result.format).toBe('text');
  });
});

describe('validateDiffInputs', () => {
  it('should not throw for valid inputs', () => {
    expect(() => validateDiffInputs('left', 'right')).not.toThrow();
  });

  it('should throw for empty left input', () => {
    expect(() => validateDiffInputs('', 'right')).toThrow('Left input');
  });

  it('should throw for empty right input', () => {
    expect(() => validateDiffInputs('left', '')).toThrow('Right input');
  });

  it('should throw for whitespace-only left input', () => {
    expect(() => validateDiffInputs('   ', 'right')).toThrow('Left input');
  });

  it('should throw for whitespace-only right input', () => {
    expect(() => validateDiffInputs('left', '   ')).toThrow('Right input');
  });
});

describe('dataDiff', () => {
  it('should perform text diff in simple mode', async () => {
    const result = await dataDiff({
      left: 'line1\nline2',
      right: 'line1\nline3',
      mode: 'simple',
      format: 'text',
    });
    expect(result.stats).toBeDefined();
    expect(result.changes.length).toBeGreaterThan(0);
  });

  it('should perform text diff in advanced (char) mode', async () => {
    const result = await dataDiff({
      left: 'hello',
      right: 'world',
      mode: 'advanced',
      format: 'text',
    });
    expect(result.stats).toBeDefined();
  });

  it('should perform JSON diff', async () => {
    const result = await dataDiff({
      left: '{"a": 1}',
      right: '{"a": 2}',
      mode: 'simple',
      format: 'json',
    });
    expect(result.stats.modifications).toBeGreaterThan(0);
  });

  it('should perform CSV diff', async () => {
    const result = await dataDiff({
      left: 'name,age\nJohn,30',
      right: 'name,age\nJane,25',
      mode: 'simple',
      format: 'csv',
    });
    expect(result.stats).toBeDefined();
  });

  it('should throw on empty left input', async () => {
    await expect(
      dataDiff({
        left: '',
        right: 'content',
        mode: 'simple',
        format: 'text',
      }),
    ).rejects.toThrow();
  });

  it('should throw on empty right input', async () => {
    await expect(
      dataDiff({
        left: 'content',
        right: '',
        mode: 'simple',
        format: 'text',
      }),
    ).rejects.toThrow();
  });
});
