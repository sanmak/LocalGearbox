/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRateLimitBackoff,
  formatSQL,
  lintSQL,
  parseSQLExplain,
  type BackoffStrategy,
  type DistributionPattern,
  type RateLimitBackoffInput,
} from './processors';

describe('calculateRateLimitBackoff', () => {
  describe('input validation', () => {
    it('should throw error for missing input', async () => {
      await expect(calculateRateLimitBackoff(null as any)).rejects.toThrow('Input required');
      await expect(calculateRateLimitBackoff(undefined as any)).rejects.toThrow('Input required');
      await expect(calculateRateLimitBackoff('invalid' as any)).rejects.toThrow('Input required');
    });

    it('should throw error for invalid requestsPerWindow', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 0,
        windowSeconds: 60,
        retryType: 'exponential',
        baseDelayMs: 1000,
        maxRetries: 3,
      };
      await expect(calculateRateLimitBackoff(input)).rejects.toThrow(
        'requestsPerWindow must be >= 1',
      );
    });

    it('should throw error for invalid windowSeconds', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 0,
        retryType: 'exponential',
        baseDelayMs: 1000,
        maxRetries: 3,
      };
      await expect(calculateRateLimitBackoff(input)).rejects.toThrow('windowSeconds must be >= 1');
    });

    it('should throw error for invalid baseDelayMs', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 60,
        retryType: 'exponential',
        baseDelayMs: 0,
        maxRetries: 3,
      };
      await expect(calculateRateLimitBackoff(input)).rejects.toThrow('baseDelayMs must be >= 1');
    });

    it('should throw error for invalid maxRetries', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 60,
        retryType: 'exponential',
        baseDelayMs: 1000,
        maxRetries: 0,
      };
      await expect(calculateRateLimitBackoff(input)).rejects.toThrow('maxRetries must be 1-20');

      const input2 = { ...input, maxRetries: 21 };
      await expect(calculateRateLimitBackoff(input2)).rejects.toThrow('maxRetries must be 1-20');
    });

    it('should throw error for invalid maxDelayMs', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 60,
        retryType: 'exponential',
        baseDelayMs: 1000,
        maxRetries: 3,
        maxDelayMs: 0,
      };
      await expect(calculateRateLimitBackoff(input)).rejects.toThrow('maxDelayMs must be >= 1');
    });

    it('should throw error for invalid retryType', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 60,
        retryType: 'invalid' as BackoffStrategy,
        baseDelayMs: 1000,
        maxRetries: 3,
      };
      await expect(calculateRateLimitBackoff(input)).rejects.toThrow('retryType must be one of');
    });

    it('should throw error for invalid burstFactor', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 60,
        retryType: 'exponential',
        baseDelayMs: 1000,
        maxRetries: 3,
        burstFactor: 0,
      };
      await expect(calculateRateLimitBackoff(input)).rejects.toThrow('burstFactor must be 1-10');

      const input2 = { ...input, burstFactor: 11 };
      await expect(calculateRateLimitBackoff(input2)).rejects.toThrow('burstFactor must be 1-10');
    });

    it('should throw error for invalid distribution', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 60,
        retryType: 'exponential',
        baseDelayMs: 1000,
        maxRetries: 3,
        distribution: 'invalid' as DistributionPattern,
      };
      await expect(calculateRateLimitBackoff(input)).rejects.toThrow(
        "distribution must be 'uniform' or 'bursty'",
      );
    });
  });

  describe('exponential backoff', () => {
    it('should calculate exponential backoff correctly', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 60,
        retryType: 'exponential',
        baseDelayMs: 1000,
        maxRetries: 3,
      };

      const result = await calculateRateLimitBackoff(input);

      expect(result.retrySchedule).toEqual([1000, 2000, 4000]);
      expect(result.retryScheduleHuman).toHaveLength(3);
      expect(result.retryEvents).toHaveLength(3);
      expect(result.totalWaitMs).toBe(7000);
      expect(result.budgetPerWindow).toBe(10);
      expect(result.summary.totalRequests).toBe(4);
      expect(result.summary.totalRetries).toBe(3);
      expect(result.summary.strategy).toBe('exponential');
      expect(result.chartData.x).toEqual([1, 2, 3]);
      expect(result.chartData.y).toEqual([1000, 3000, 7000]);
      expect(result.notes).toContain('Retry type: exponential');
    });

    it('should respect maxDelayMs cap', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 60,
        retryType: 'exponential',
        baseDelayMs: 1000,
        maxRetries: 5,
        maxDelayMs: 5000,
      };

      const result = await calculateRateLimitBackoff(input);

      expect(result.retrySchedule).toEqual([1000, 2000, 4000, 5000, 5000]);
      expect(result.notes.some((n) => n.includes('Max delay cap'))).toBe(true);
    });
  });

  describe('equal backoff', () => {
    it('should calculate equal backoff correctly', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 60,
        retryType: 'equal',
        baseDelayMs: 1000,
        maxRetries: 3,
      };

      const result = await calculateRateLimitBackoff(input);

      expect(result.retrySchedule).toEqual([1000, 1000, 1000]);
      expect(result.totalWaitMs).toBe(3000);
    });
  });

  describe('exponential-jitter backoff', () => {
    it('should calculate exponential-jitter backoff with randomness', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 60,
        retryType: 'exponential-jitter',
        baseDelayMs: 1000,
        maxRetries: 3,
      };

      const result = await calculateRateLimitBackoff(input);

      expect(result.retrySchedule).toHaveLength(3);
      // Should be random but within bounds
      expect(result.retrySchedule[0]).toBeGreaterThanOrEqual(0);
      expect(result.retrySchedule[0]).toBeLessThanOrEqual(1000);
      expect(result.retrySchedule[1]).toBeGreaterThanOrEqual(0);
      expect(result.retrySchedule[1]).toBeLessThanOrEqual(2000);
    });
  });

  describe('full-jitter backoff', () => {
    it('should calculate full-jitter backoff with randomness', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 60,
        retryType: 'full-jitter',
        baseDelayMs: 1000,
        maxRetries: 3,
      };

      const result = await calculateRateLimitBackoff(input);

      expect(result.retrySchedule).toHaveLength(3);
      // All delays should be random within baseDelayMs
      result.retrySchedule.forEach((delay) => {
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).toBeLessThanOrEqual(1000);
      });
    });
  });

  describe('decorrelated backoff', () => {
    it('should calculate decorrelated backoff', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 60,
        retryType: 'decorrelated',
        baseDelayMs: 1000,
        maxRetries: 3,
        maxDelayMs: 10000,
      };

      const result = await calculateRateLimitBackoff(input);

      expect(result.retrySchedule).toHaveLength(3);
      // First delay should be random up to baseDelayMs
      expect(result.retrySchedule[0]).toBeGreaterThanOrEqual(0);
      expect(result.retrySchedule[0]).toBeLessThanOrEqual(1000);
    });
  });

  describe('bursty distribution', () => {
    it('should handle bursty distribution', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 60,
        retryType: 'exponential',
        baseDelayMs: 1000,
        maxRetries: 3,
        distribution: 'bursty',
        burstFactor: 5,
      };

      const result = await calculateRateLimitBackoff(input);

      expect(result.retrySchedule).toHaveLength(3);
      expect(result.summary.distribution).toBe('bursty');
      expect(result.summary.burstFactor).toBe(5);
      expect(result.notes.some((n) => n.includes('Burst factor'))).toBe(true);
    });
  });

  describe('retry events', () => {
    it('should generate correct retry events', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 60,
        retryType: 'exponential',
        baseDelayMs: 1000,
        maxRetries: 2,
      };

      const result = await calculateRateLimitBackoff(input);

      expect(result.retryEvents).toHaveLength(2);
      expect(result.retryEvents[0]).toMatchObject({
        attempt: 1,
        delayMs: 1000,
        status: 'scheduled',
      });
      expect(result.retryEvents[0].delayHuman).toBeTruthy();
      expect(result.retryEvents[0].timestampMs).toBe(1000);

      expect(result.retryEvents[1]).toMatchObject({
        attempt: 2,
        delayMs: 2000,
        status: 'scheduled',
      });
      expect(result.retryEvents[1].timestampMs).toBe(3000);
    });
  });

  describe('human readable formatting', () => {
    it('should format milliseconds correctly', async () => {
      const input: RateLimitBackoffInput = {
        requestsPerWindow: 10,
        windowSeconds: 120,
        retryType: 'exponential',
        baseDelayMs: 500,
        maxRetries: 1,
      };

      const result = await calculateRateLimitBackoff(input);

      expect(result.retryScheduleHuman[0]).toContain('ms');
      expect(result.totalWaitHuman).toBeTruthy();
      expect(result.summary.totalTimeHuman).toBeTruthy();
    });
  });
});

describe('formatSQL', () => {
  it('should format simple SQL query', async () => {
    const input = { sql: 'SELECT * FROM users WHERE id = 1' };
    const result = await formatSQL(input);

    expect(result.formatted).toContain('SELECT');
    expect(result.formatted).toContain('FROM');
    expect(result.formatted).toContain('WHERE');
  });

  it('should uppercase SQL keywords', async () => {
    const input = { sql: 'select * from users where id = 1' };
    const result = await formatSQL(input);

    expect(result.formatted).toContain('SELECT');
    expect(result.formatted).toContain('FROM');
    expect(result.formatted).toContain('WHERE');
  });

  it('should handle multiple statements', async () => {
    const input = { sql: 'SELECT * FROM users; SELECT * FROM posts;' };
    const result = await formatSQL(input);

    expect(result.formatted).toContain(';\n');
  });

  it('should handle JOIN statements', async () => {
    const input = {
      sql: 'SELECT u.name, p.title FROM users u LEFT JOIN posts p ON u.id = p.user_id',
    };
    const result = await formatSQL(input);

    expect(result.formatted).toContain('LEFT JOIN');
    expect(result.formatted).toContain('ON');
  });

  it('should handle INSERT statements', async () => {
    const input = { sql: "INSERT INTO users (name, email) VALUES ('John', 'john@example.com')" };
    const result = await formatSQL(input);

    expect(result.formatted).toContain('INSERT');
    expect(result.formatted).toContain('VALUES');
  });

  it('should handle UPDATE statements', async () => {
    const input = { sql: "UPDATE users SET name = 'Jane' WHERE id = 1" };
    const result = await formatSQL(input);

    expect(result.formatted).toContain('UPDATE');
    expect(result.formatted).toContain('SET');
    expect(result.formatted).toContain('WHERE');
  });

  it('should handle DELETE statements', async () => {
    const input = { sql: 'DELETE FROM users WHERE id = 1' };
    const result = await formatSQL(input);

    expect(result.formatted).toContain('DELETE');
    expect(result.formatted).toContain('FROM');
    expect(result.formatted).toContain('WHERE');
  });

  it('should handle GROUP BY and ORDER BY', async () => {
    const input = { sql: 'SELECT COUNT(*) FROM users GROUP BY status ORDER BY created_at' };
    const result = await formatSQL(input);

    expect(result.formatted).toContain('GROUP BY');
    expect(result.formatted).toContain('ORDER BY');
  });

  it('should handle LIMIT and OFFSET', async () => {
    const input = { sql: 'SELECT * FROM users LIMIT 10 OFFSET 20' };
    const result = await formatSQL(input);

    expect(result.formatted).toContain('LIMIT');
    expect(result.formatted).toContain('OFFSET');
  });

  it('should handle HAVING clause', async () => {
    const input = { sql: 'SELECT COUNT(*) FROM users GROUP BY status HAVING COUNT(*) > 5' };
    const result = await formatSQL(input);

    expect(result.formatted).toContain('HAVING');
  });

  it('should throw error for empty SQL', async () => {
    await expect(formatSQL({ sql: '' })).rejects.toThrow('Input SQL is empty');
    await expect(formatSQL({ sql: '   ' })).rejects.toThrow('Input SQL is empty');
  });

  it('should throw error for SQL too large', async () => {
    const largeSql = 'SELECT * FROM users WHERE id = 1 '.repeat(50000);
    await expect(formatSQL({ sql: largeSql })).rejects.toThrow('SQL input too large');
  });

  it('should remove excessive newlines', async () => {
    const input = { sql: 'SELECT\n\n\n*\n\n\nFROM\n\n\nusers' };
    const result = await formatSQL(input);

    expect(result.formatted).not.toContain('\n\n\n');
  });
});

describe('lintSQL', () => {
  it('should detect SELECT * usage', async () => {
    const input = { sql: 'SELECT * FROM users' };
    const result = await lintSQL(input);

    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].message).toContain('SELECT *');
    expect(result.issues[0].line).toBe(1);
  });

  it('should detect inline comments not at line start', async () => {
    const input = { sql: 'SELECT id FROM users -- this is a comment' };
    const result = await lintSQL(input);

    expect(result.issues.some((i) => i.message.includes('Inline comments'))).toBe(true);
  });

  it('should allow comments at line start', async () => {
    const input = { sql: '-- This is a comment\nSELECT id FROM users' };
    const result = await lintSQL(input);

    expect(result.issues.some((i) => i.message.includes('Inline comments'))).toBe(false);
  });

  it('should detect multiple semicolons', async () => {
    const input = { sql: 'SELECT * FROM users;;' };
    const result = await lintSQL(input);

    expect(result.issues.some((i) => i.message.includes('Multiple semicolons'))).toBe(true);
  });

  it('should return no issues for clean SQL', async () => {
    const input = { sql: 'SELECT id, name FROM users WHERE status = 1' };
    const result = await lintSQL(input);

    expect(result.issues).toHaveLength(0);
  });

  it('should detect multiple issues', async () => {
    const input = {
      sql: 'SELECT * FROM users;;\nSELECT * FROM posts -- inline comment',
    };
    const result = await lintSQL(input);

    expect(result.issues.length).toBeGreaterThan(1);
  });

  it('should throw error for empty SQL', async () => {
    await expect(lintSQL({ sql: '' })).rejects.toThrow('Input SQL is empty');
  });

  it('should throw error for SQL too large', async () => {
    const largeSql = 'SELECT id FROM users WHERE id = 1 '.repeat(50000);
    await expect(lintSQL({ sql: largeSql })).rejects.toThrow('SQL input too large');
  });

  it('should handle multiline SQL', async () => {
    const input = {
      sql: `SELECT *
FROM users
WHERE id = 1`,
    };
    const result = await lintSQL(input);

    expect(result.issues[0].line).toBe(1);
  });
});

describe('parseSQLExplain', () => {
  it('should parse tabular EXPLAIN output', async () => {
    const input = {
      explain: `id | select_type | table | type
1 | SIMPLE | users | ALL
2 | SIMPLE | posts | ref`,
    };

    const result = await parseSQLExplain(input);

    expect(result.parsed).toHaveProperty('headers');
    expect(result.parsed).toHaveProperty('rows');
    expect((result.parsed as any).headers).toEqual(['id', 'select_type', 'table', 'type']);
    // Note: The parser includes all lines after the first as rows
    expect((result.parsed as any).rows).toHaveLength(2);
  });

  it('should handle EXPLAIN with extra columns', async () => {
    const input = {
      explain: `id | select_type | table | type | key | rows
1 | SIMPLE | users | ALL | NULL | 1000`,
    };

    const result = await parseSQLExplain(input);

    expect((result.parsed as any).headers).toHaveLength(6);
    expect((result.parsed as any).rows[0]).toHaveProperty('key');
    expect((result.parsed as any).rows[0]).toHaveProperty('rows');
  });

  it('should handle empty cells', async () => {
    const input = {
      explain: `id | select_type | table | type
1 | SIMPLE | users |`,
    };

    const result = await parseSQLExplain(input);

    expect((result.parsed as any).rows[0].type).toBe('');
  });

  it('should throw error for empty EXPLAIN', async () => {
    await expect(parseSQLExplain({ explain: '' })).rejects.toThrow('Input EXPLAIN is empty');
    await expect(parseSQLExplain({ explain: '   ' })).rejects.toThrow('Input EXPLAIN is empty');
  });

  it('should throw error for EXPLAIN too large', async () => {
    // Create a string that exceeds 1MB (1,000,000 bytes)
    const largeExplain = 'id | type\n1 | ALL\n'.repeat(100000);
    await expect(parseSQLExplain({ explain: largeExplain })).rejects.toThrow(
      'EXPLAIN input too large',
    );
  });

  it('should throw error for EXPLAIN too short', async () => {
    await expect(parseSQLExplain({ explain: 'id | type' })).rejects.toThrow(
      'EXPLAIN output too short',
    );
  });

  it('should filter empty lines', async () => {
    const input = {
      explain: `id | select_type | table | type

1 | SIMPLE | users | ALL

2 | SIMPLE | posts | ref`,
    };

    const result = await parseSQLExplain(input);

    // Parser filters empty lines, so we get 2 data rows
    expect((result.parsed as any).rows).toHaveLength(2);
  });

  it('should trim whitespace from cells', async () => {
    const input = {
      explain: `  id  |  select_type  |  table  |  type
  1  |  SIMPLE  |  users  |  ALL  `,
    };

    const result = await parseSQLExplain(input);

    expect((result.parsed as any).headers[0]).toBe('id');
    expect((result.parsed as any).rows[0].id).toBe('1');
  });
});
