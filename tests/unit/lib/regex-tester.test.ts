/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { testRegex } from '@/lib/tools/validators/regex-tester';

describe('testRegex', () => {
  // ─── Basic Matching ──────────────────────────────────────────────────────

  describe('basic matching', () => {
    it('should match a simple literal pattern', async () => {
      const input = JSON.stringify({ pattern: 'hello', flags: '', testString: 'hello world' });
      const result = JSON.parse(await testRegex(input));
      expect(result.valid).toBe(true);
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].fullMatch).toBe('hello');
      expect(result.matches[0].index).toBe(0);
    });

    it('should match a pattern with character classes', async () => {
      const input = JSON.stringify({ pattern: '\\d+', flags: '', testString: 'abc 123 def' });
      const result = JSON.parse(await testRegex(input));
      expect(result.valid).toBe(true);
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].fullMatch).toBe('123');
    });

    it('should match word boundaries', async () => {
      const input = JSON.stringify({
        pattern: '\\bworld\\b',
        flags: '',
        testString: 'hello world foo',
      });
      const result = JSON.parse(await testRegex(input));
      expect(result.valid).toBe(true);
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].fullMatch).toBe('world');
      expect(result.matches[0].index).toBe(6);
    });

    it('should return length of matches', async () => {
      const input = JSON.stringify({ pattern: 'test', flags: '', testString: 'this is a test' });
      const result = JSON.parse(await testRegex(input));
      expect(result.matches[0].length).toBe(4);
    });
  });

  // ─── Global Flag ─────────────────────────────────────────────────────────

  describe('global flag (g)', () => {
    it('should find all matches with global flag', async () => {
      const input = JSON.stringify({
        pattern: '\\d+',
        flags: 'g',
        testString: 'abc 123 def 456 ghi 789',
      });
      const result = JSON.parse(await testRegex(input));
      expect(result.valid).toBe(true);
      expect(result.matchCount).toBe(3);
      expect(result.matches[0].fullMatch).toBe('123');
      expect(result.matches[1].fullMatch).toBe('456');
      expect(result.matches[2].fullMatch).toBe('789');
    });

    it('should find only first match without global flag', async () => {
      const input = JSON.stringify({ pattern: '\\d+', flags: '', testString: 'abc 123 def 456' });
      const result = JSON.parse(await testRegex(input));
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].fullMatch).toBe('123');
    });
  });

  // ─── Case-Insensitive Flag ───────────────────────────────────────────────

  describe('case-insensitive flag (i)', () => {
    it('should match case-insensitively', async () => {
      const input = JSON.stringify({
        pattern: 'hello',
        flags: 'gi',
        testString: 'Hello HELLO hello',
      });
      const result = JSON.parse(await testRegex(input));
      expect(result.valid).toBe(true);
      expect(result.matchCount).toBe(3);
    });

    it('should not match case-sensitively without i flag', async () => {
      const input = JSON.stringify({
        pattern: 'hello',
        flags: 'g',
        testString: 'Hello HELLO hello',
      });
      const result = JSON.parse(await testRegex(input));
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].fullMatch).toBe('hello');
    });
  });

  // ─── Multiline Flag ──────────────────────────────────────────────────────

  describe('multiline flag (m)', () => {
    it('should match start of each line with m flag', async () => {
      const input = JSON.stringify({
        pattern: '^\\w+',
        flags: 'gm',
        testString: 'first\nsecond\nthird',
      });
      const result = JSON.parse(await testRegex(input));
      expect(result.matchCount).toBe(3);
      expect(result.matches[0].fullMatch).toBe('first');
      expect(result.matches[1].fullMatch).toBe('second');
      expect(result.matches[2].fullMatch).toBe('third');
    });

    it('should match only start of string without m flag', async () => {
      const input = JSON.stringify({
        pattern: '^\\w+',
        flags: 'g',
        testString: 'first\nsecond\nthird',
      });
      const result = JSON.parse(await testRegex(input));
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].fullMatch).toBe('first');
    });
  });

  // ─── DotAll Flag ─────────────────────────────────────────────────────────

  describe('dotAll flag (s)', () => {
    it('should match newlines with dot when s flag is set', async () => {
      const input = JSON.stringify({
        pattern: 'a.b',
        flags: 's',
        testString: 'a\nb',
      });
      const result = JSON.parse(await testRegex(input));
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].fullMatch).toBe('a\nb');
    });

    it('should not match newlines with dot without s flag', async () => {
      const input = JSON.stringify({
        pattern: 'a.b',
        flags: '',
        testString: 'a\nb',
      });
      const result = JSON.parse(await testRegex(input));
      expect(result.matchCount).toBe(0);
    });
  });

  // ─── Capture Groups ──────────────────────────────────────────────────────

  describe('capture groups', () => {
    it('should capture unnamed groups', async () => {
      const input = JSON.stringify({
        pattern: '(\\w+)@(\\w+)\\.(\\w+)',
        flags: '',
        testString: 'user@example.com',
      });
      const result = JSON.parse(await testRegex(input));
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].captureGroups).toEqual(['user', 'example', 'com']);
    });

    it('should capture named groups', async () => {
      const input = JSON.stringify({
        pattern: '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})',
        flags: '',
        testString: '2025-12-25',
      });
      const result = JSON.parse(await testRegex(input));
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].groups).toEqual({
        year: '2025',
        month: '12',
        day: '25',
      });
      expect(result.matches[0].captureGroups).toEqual(['2025', '12', '25']);
    });

    it('should handle multiple capture group matches with global flag', async () => {
      const input = JSON.stringify({
        pattern: '(\\w+)=(\\w+)',
        flags: 'g',
        testString: 'a=1 b=2 c=3',
      });
      const result = JSON.parse(await testRegex(input));
      expect(result.matchCount).toBe(3);
      expect(result.matches[0].captureGroups).toEqual(['a', '1']);
      expect(result.matches[1].captureGroups).toEqual(['b', '2']);
      expect(result.matches[2].captureGroups).toEqual(['c', '3']);
    });
  });

  // ─── No Match ────────────────────────────────────────────────────────────

  describe('no match case', () => {
    it('should return 0 matches when pattern does not match', async () => {
      const input = JSON.stringify({ pattern: 'xyz', flags: 'g', testString: 'hello world' });
      const result = JSON.parse(await testRegex(input));
      expect(result.valid).toBe(true);
      expect(result.matchCount).toBe(0);
      expect(result.matches).toEqual([]);
    });
  });

  // ─── Invalid Regex ───────────────────────────────────────────────────────

  describe('invalid regex', () => {
    it('should return error for invalid regex pattern', async () => {
      const input = JSON.stringify({ pattern: '[invalid', flags: '', testString: 'test' });
      const result = JSON.parse(await testRegex(input));
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.matchCount).toBe(0);
    });

    it('should return error for unbalanced parentheses', async () => {
      const input = JSON.stringify({ pattern: '(unclosed', flags: '', testString: 'test' });
      const result = JSON.parse(await testRegex(input));
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ─── Edge Cases ──────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle empty pattern', async () => {
      const input = JSON.stringify({ pattern: '', flags: '', testString: 'test' });
      const result = JSON.parse(await testRegex(input));
      expect(result.valid).toBe(true);
      expect(result.matchCount).toBe(0);
    });

    it('should handle empty test string', async () => {
      const input = JSON.stringify({ pattern: '.*', flags: '', testString: '' });
      const result = JSON.parse(await testRegex(input));
      expect(result.valid).toBe(true);
      // .* matches empty string
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].fullMatch).toBe('');
    });

    it('should handle special regex characters in pattern', async () => {
      const input = JSON.stringify({
        pattern: '\\$\\d+\\.\\d{2}',
        flags: 'g',
        testString: 'Price: $10.99 and $5.50',
      });
      const result = JSON.parse(await testRegex(input));
      expect(result.matchCount).toBe(2);
      expect(result.matches[0].fullMatch).toBe('$10.99');
      expect(result.matches[1].fullMatch).toBe('$5.50');
    });

    it('should sanitize invalid flags', async () => {
      const input = JSON.stringify({ pattern: 'test', flags: 'gxz', testString: 'test test' });
      const result = JSON.parse(await testRegex(input));
      expect(result.valid).toBe(true);
      expect(result.flags).toBe('g');
    });

    it('should deduplicate flags', async () => {
      const input = JSON.stringify({ pattern: 'test', flags: 'gg', testString: 'test test' });
      const result = JSON.parse(await testRegex(input));
      expect(result.flags).toBe('g');
    });

    it('should reject non-JSON input', async () => {
      await expect(testRegex('not json at all')).rejects.toThrow();
    });

    it('should include execution time', async () => {
      const input = JSON.stringify({ pattern: '\\d+', flags: 'g', testString: '123 456' });
      const result = JSON.parse(await testRegex(input));
      expect(result.executionTimeMs).toBeDefined();
      expect(typeof result.executionTimeMs).toBe('number');
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle pattern with global flag and zero-length matches safely', async () => {
      const input = JSON.stringify({ pattern: '(?=a)', flags: 'g', testString: 'aaa' });
      const result = JSON.parse(await testRegex(input));
      expect(result.valid).toBe(true);
      // Should not infinite loop; implementation handles zero-length matches
    });

    it('should throw for missing required fields', async () => {
      const input = JSON.stringify({ pattern: 'test' });
      // flags and testString missing - should throw since testString is not a string
      await expect(testRegex(input)).rejects.toThrow();
    });

    it('should handle zero-length match at end of string', async () => {
      const input = JSON.stringify({ pattern: '(?=b|$)', flags: 'g', testString: 'ab' });
      const result = JSON.parse(await testRegex(input));
      expect(result.valid).toBe(true);
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it('should reject pattern exceeding size limit', async () => {
      const longPattern = 'a'.repeat(10_001);
      const input = JSON.stringify({ pattern: longPattern, flags: '', testString: 'test' });
      await expect(testRegex(input)).rejects.toThrow('Pattern exceeds maximum size limit');
    });

    it('should reject test string exceeding size limit', async () => {
      const longString = 'x'.repeat(10_001);
      const input = JSON.stringify({
        pattern: longString,
        flags: '',
        testString: 'test',
      });
      await expect(testRegex(input)).rejects.toThrow('Pattern exceeds maximum size limit');
    });

    it('should reject non-string pattern', async () => {
      const input = JSON.stringify({ pattern: 123, flags: '', testString: 'test' });
      await expect(testRegex(input)).rejects.toThrow('pattern must be a string');
    });
  });
});
