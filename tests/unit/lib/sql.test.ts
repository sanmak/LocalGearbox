/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { formatSQL, lintSQL, parseSQLExplain } from '@/lib/processors';

describe('formatSQL', () => {
  it('should format a simple SELECT query', async () => {
    const result = await formatSQL({ sql: 'SELECT name, age FROM users WHERE age > 18' });
    expect(result.formatted).toContain('SELECT');
    expect(result.formatted).toContain('FROM');
    expect(result.formatted).toContain('WHERE');
  });

  it('should uppercase SQL keywords', async () => {
    const result = await formatSQL({ sql: 'select name from users where age > 18' });
    expect(result.formatted).toContain('SELECT');
    expect(result.formatted).toContain('FROM');
    expect(result.formatted).toContain('WHERE');
  });

  it('should handle JOIN clauses', async () => {
    const sql = 'SELECT u.name, o.id FROM users u INNER JOIN orders o ON u.id = o.user_id';
    const result = await formatSQL({ sql });
    expect(result.formatted).toContain('INNER JOIN');
    expect(result.formatted).toContain('ON');
  });

  it('should handle GROUP BY and ORDER BY', async () => {
    const sql = 'SELECT city, COUNT(*) FROM users GROUP BY city ORDER BY city';
    const result = await formatSQL({ sql });
    expect(result.formatted).toContain('GROUP BY');
    expect(result.formatted).toContain('ORDER BY');
  });

  it('should handle LIMIT and OFFSET', async () => {
    const sql = 'SELECT * FROM users LIMIT 10 OFFSET 20';
    const result = await formatSQL({ sql });
    expect(result.formatted).toContain('LIMIT');
    expect(result.formatted).toContain('OFFSET');
  });

  it('should throw on empty SQL', async () => {
    await expect(formatSQL({ sql: '' })).rejects.toThrow('Input SQL is empty');
  });

  it('should throw on whitespace-only SQL', async () => {
    await expect(formatSQL({ sql: '   ' })).rejects.toThrow('Input SQL is empty');
  });

  it('should throw on SQL exceeding size limit', async () => {
    const longSQL = 'SELECT ' + 'x'.repeat(1_000_001);
    await expect(formatSQL({ sql: longSQL })).rejects.toThrow('too large');
  });

  it('should handle INSERT statements', async () => {
    const sql = "INSERT INTO users (name, age) VALUES ('John', 30)";
    const result = await formatSQL({ sql });
    expect(result.formatted).toContain('INSERT');
    expect(result.formatted).toContain('VALUES');
  });

  it('should handle UPDATE statements', async () => {
    const sql = "UPDATE users SET name = 'Jane' WHERE id = 1";
    const result = await formatSQL({ sql });
    expect(result.formatted).toContain('UPDATE');
    expect(result.formatted).toContain('SET');
    expect(result.formatted).toContain('WHERE');
  });

  it('should handle DELETE statements', async () => {
    const sql = 'DELETE FROM users WHERE age < 18';
    const result = await formatSQL({ sql });
    expect(result.formatted).toContain('DELETE');
    expect(result.formatted).toContain('FROM');
    expect(result.formatted).toContain('WHERE');
  });

  it('should handle multiple statements separated by semicolons', async () => {
    const sql = 'SELECT 1; SELECT 2;';
    const result = await formatSQL({ sql });
    expect(result.formatted).toContain('SELECT');
  });
});

describe('lintSQL', () => {
  it('should detect SELECT * usage', async () => {
    const result = await lintSQL({ sql: 'SELECT * FROM users' });
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].message).toContain('SELECT *');
  });

  it('should detect inline comments', async () => {
    const result = await lintSQL({ sql: 'SELECT name -- comment\nFROM users' });
    const inlineIssue = result.issues.find((i) => i.message.includes('Inline comments'));
    expect(inlineIssue).toBeDefined();
  });

  it('should detect multiple semicolons', async () => {
    const result = await lintSQL({ sql: 'SELECT 1;;\nSELECT 2' });
    const semiIssue = result.issues.find((i) => i.message.includes('Multiple semicolons'));
    expect(semiIssue).toBeDefined();
  });

  it('should return no issues for clean SQL', async () => {
    const result = await lintSQL({ sql: 'SELECT name, age\nFROM users\nWHERE age > 18' });
    expect(result.issues).toHaveLength(0);
  });

  it('should throw on empty SQL', async () => {
    await expect(lintSQL({ sql: '' })).rejects.toThrow('Input SQL is empty');
  });

  it('should throw on SQL exceeding size limit', async () => {
    const longSQL = 'SELECT ' + 'x'.repeat(1_000_001);
    await expect(lintSQL({ sql: longSQL })).rejects.toThrow('too large');
  });

  it('should report correct line numbers', async () => {
    const sql = 'SELECT name\nFROM users\nSELECT * FROM orders';
    const result = await lintSQL({ sql });
    const selectStarIssue = result.issues.find((i) => i.message.includes('SELECT *'));
    expect(selectStarIssue?.line).toBe(3);
  });

  it('should allow comments at line beginning', async () => {
    const result = await lintSQL({ sql: '-- This is a comment\nSELECT name FROM users' });
    const inlineIssue = result.issues.find((i) => i.message.includes('Inline comments'));
    expect(inlineIssue).toBeUndefined();
  });

  it('should detect SELECT * case-insensitively', async () => {
    const result = await lintSQL({ sql: 'select * from users' });
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

describe('parseSQLExplain', () => {
  it('should parse tabular EXPLAIN output', async () => {
    const explain = 'id | select_type | table\n1 | SIMPLE | users';
    const result = await parseSQLExplain({ explain });
    const parsed = result.parsed as { headers: string[]; rows: Record<string, string>[] };
    expect(parsed.headers).toEqual(['id', 'select_type', 'table']);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]['id']).toBe('1');
    expect(parsed.rows[0]['select_type']).toBe('SIMPLE');
    expect(parsed.rows[0]['table']).toBe('users');
  });

  it('should handle multiple rows', async () => {
    const explain = 'id | type | table\n1 | ALL | users\n2 | ref | orders';
    const result = await parseSQLExplain({ explain });
    const parsed = result.parsed as { headers: string[]; rows: Record<string, string>[] };
    expect(parsed.rows).toHaveLength(2);
  });

  it('should throw on empty EXPLAIN', async () => {
    await expect(parseSQLExplain({ explain: '' })).rejects.toThrow('Input EXPLAIN is empty');
  });

  it('should throw on whitespace-only EXPLAIN', async () => {
    await expect(parseSQLExplain({ explain: '   ' })).rejects.toThrow('Input EXPLAIN is empty');
  });

  it('should throw on single-line EXPLAIN (too short)', async () => {
    await expect(parseSQLExplain({ explain: 'id | type | table' })).rejects.toThrow('too short');
  });

  it('should throw on EXPLAIN exceeding size limit', async () => {
    const longExplain = 'id | type\n' + 'x'.repeat(1_000_001);
    await expect(parseSQLExplain({ explain: longExplain })).rejects.toThrow('too large');
  });

  it('should handle missing columns in rows', async () => {
    const explain = 'id | type | table\n1 | ALL';
    const result = await parseSQLExplain({ explain });
    const parsed = result.parsed as { headers: string[]; rows: Record<string, string>[] };
    expect(parsed.rows[0]['table']).toBe('');
  });

  it('should parse headers correctly with extra whitespace', async () => {
    const explain = '  id  |  type  |  table  \n1 | ALL | users';
    const result = await parseSQLExplain({ explain });
    const parsed = result.parsed as { headers: string[]; rows: Record<string, string>[] };
    expect(parsed.headers).toEqual(['id', 'type', 'table']);
  });
});
