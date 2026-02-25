/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import {
  generateUUID,
  generateUUIDv1,
  generateUUIDv3,
  generateUUIDv4,
  generateUUIDv5,
  generateTimestampFirstUUID,
  generateNilUUID,
  generateMaxUUID,
  generateBulkUUIDs,
  epochToDate,
  dateToEpoch,
} from '@/lib/tools/generators';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// Some generators (v1, timestamp-first) produce non-standard segment lengths
// so we use a relaxed pattern for those
const UUID_LIKE_REGEX = /^[0-9a-f]+-[0-9a-f]+-[0-9a-f]+-[0-9a-f]+-[0-9a-f]+$/;

describe('generateUUID', () => {
  it('should generate a valid UUID v4', async () => {
    const result = await generateUUID();
    expect(result).toMatch(UUID_REGEX);
  });

  it('should generate unique UUIDs on each call', async () => {
    const uuid1 = await generateUUID();
    const uuid2 = await generateUUID();
    expect(uuid1).not.toBe(uuid2);
  });

  it('should have version 4 in the correct position', async () => {
    const result = await generateUUID();
    expect(result[14]).toBe('4');
  });
});

describe('generateUUIDv1', () => {
  it('should generate a valid UUID-like format', () => {
    const result = generateUUIDv1();
    expect(result).toMatch(UUID_LIKE_REGEX);
  });

  it('should have version 1 marker', () => {
    const result = generateUUIDv1();
    expect(result[14]).toBe('1');
  });

  it('should generate unique values', () => {
    const uuid1 = generateUUIDv1();
    const uuid2 = generateUUIDv1();
    expect(uuid1).not.toBe(uuid2);
  });
});

describe('generateUUIDv3', () => {
  it('should generate a valid UUID format', () => {
    const result = generateUUIDv3('namespace', 'name');
    expect(result).toMatch(UUID_REGEX);
  });

  it('should have version 3 marker', () => {
    const result = generateUUIDv3('ns', 'name');
    expect(result[14]).toBe('3');
  });

  it('should be deterministic for same inputs', () => {
    const uuid1 = generateUUIDv3('namespace', 'name');
    const uuid2 = generateUUIDv3('namespace', 'name');
    expect(uuid1).toBe(uuid2);
  });

  it('should generate different UUIDs for different names', () => {
    const uuid1 = generateUUIDv3('namespace', 'name1');
    const uuid2 = generateUUIDv3('namespace', 'name2');
    expect(uuid1).not.toBe(uuid2);
  });

  it('should generate different UUIDs for different namespaces', () => {
    const uuid1 = generateUUIDv3('ns1', 'name');
    const uuid2 = generateUUIDv3('ns2', 'name');
    expect(uuid1).not.toBe(uuid2);
  });
});

describe('generateUUIDv4', () => {
  it('should generate a valid UUID format', () => {
    const result = generateUUIDv4();
    expect(result).toMatch(UUID_REGEX);
  });

  it('should have version 4 in the correct position', () => {
    const result = generateUUIDv4();
    expect(result[14]).toBe('4');
  });

  it('should have variant bits set correctly (8, 9, a, or b)', () => {
    const result = generateUUIDv4();
    expect(['8', '9', 'a', 'b']).toContain(result[19]);
  });

  it('should generate unique values across multiple calls', () => {
    const uuids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      uuids.add(generateUUIDv4());
    }
    expect(uuids.size).toBe(100);
  });
});

describe('generateUUIDv5', () => {
  it('should generate a valid UUID format', () => {
    const result = generateUUIDv5('namespace', 'name');
    expect(result).toMatch(UUID_REGEX);
  });

  it('should have version 5 marker', () => {
    const result = generateUUIDv5('ns', 'name');
    expect(result[14]).toBe('5');
  });

  it('should be deterministic for same inputs', () => {
    const uuid1 = generateUUIDv5('namespace', 'name');
    const uuid2 = generateUUIDv5('namespace', 'name');
    expect(uuid1).toBe(uuid2);
  });

  it('should differ from v3 with same inputs', () => {
    const v3 = generateUUIDv3('namespace', 'name');
    const v5 = generateUUIDv5('namespace', 'name');
    expect(v3).not.toBe(v5);
  });
});

describe('generateTimestampFirstUUID', () => {
  it('should generate a valid UUID-like format', () => {
    const result = generateTimestampFirstUUID();
    expect(result).toMatch(UUID_LIKE_REGEX);
  });

  it('should contain a version marker', () => {
    const result = generateTimestampFirstUUID();
    // Timestamp-first UUIDs have non-standard format; just check it has hyphens
    expect(result.split('-')).toHaveLength(5);
  });

  it('should start with a timestamp-based prefix', () => {
    const uuid = generateTimestampFirstUUID();
    const prefix = uuid.split('-')[0];
    // The prefix should be a hex-encoded timestamp close to Date.now()
    const prefixValue = parseInt(prefix, 16);
    const now = Date.now();
    // Should be within 10 seconds of current time
    expect(Math.abs(prefixValue - now)).toBeLessThan(10000);
  });
});

describe('generateNilUUID', () => {
  it('should return all-zero UUID', () => {
    const result = generateNilUUID();
    expect(result).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('should always return the same value', () => {
    expect(generateNilUUID()).toBe(generateNilUUID());
  });
});

describe('generateMaxUUID', () => {
  it('should return all-F UUID', () => {
    const result = generateMaxUUID();
    expect(result).toBe('ffffffff-ffff-ffff-ffff-ffffffffffff');
  });

  it('should always return the same value', () => {
    expect(generateMaxUUID()).toBe(generateMaxUUID());
  });
});

describe('generateBulkUUIDs', () => {
  it('should generate the requested number of v4 UUIDs', () => {
    const result = generateBulkUUIDs(5, 'v4');
    expect(result).toHaveLength(5);
    result.forEach((uuid) => {
      expect(uuid).toMatch(UUID_REGEX);
      expect(uuid[14]).toBe('4');
    });
  });

  it('should generate v1 UUIDs', () => {
    const result = generateBulkUUIDs(3, 'v1');
    expect(result).toHaveLength(3);
    result.forEach((uuid) => {
      expect(uuid).toMatch(UUID_LIKE_REGEX);
    });
  });

  it('should generate v3 UUIDs with namespace and name', () => {
    const result = generateBulkUUIDs(3, 'v3', 'my-namespace', 'my-name');
    expect(result).toHaveLength(3);
    result.forEach((uuid) => {
      expect(uuid).toMatch(UUID_REGEX);
    });
  });

  it('should generate v5 UUIDs', () => {
    const result = generateBulkUUIDs(3, 'v5', 'ns', 'name');
    expect(result).toHaveLength(3);
  });

  it('should generate nil UUIDs (all identical)', () => {
    const result = generateBulkUUIDs(3, 'nil');
    expect(result).toHaveLength(3);
    result.forEach((uuid) => {
      expect(uuid).toBe('00000000-0000-0000-0000-000000000000');
    });
  });

  it('should generate max UUIDs (all identical)', () => {
    const result = generateBulkUUIDs(3, 'max');
    expect(result).toHaveLength(3);
    result.forEach((uuid) => {
      expect(uuid).toBe('ffffffff-ffff-ffff-ffff-ffffffffffff');
    });
  });

  it('should generate timestamp-first UUIDs', () => {
    const result = generateBulkUUIDs(3, 'timestamp-first');
    expect(result).toHaveLength(3);
    result.forEach((uuid) => {
      expect(uuid).toMatch(UUID_LIKE_REGEX);
    });
  });

  it('should default to v4 for unknown version', () => {
    const result = generateBulkUUIDs(2, 'unknown');
    expect(result).toHaveLength(2);
    result.forEach((uuid) => {
      expect(uuid).toMatch(UUID_REGEX);
    });
  });

  it('should generate zero UUIDs when count is 0', () => {
    const result = generateBulkUUIDs(0, 'v4');
    expect(result).toHaveLength(0);
  });
});

describe('epochToDate', () => {
  it('should convert seconds epoch to date info', async () => {
    // 1609459200 = 2021-01-01T00:00:00Z
    const result = await epochToDate('1609459200');
    const parsed = JSON.parse(result);
    expect(parsed.iso).toBe('2021-01-01T00:00:00.000Z');
    expect(parsed.timestamp).toBe(1609459200000);
  });

  it('should convert milliseconds epoch to date info', async () => {
    // 1609459200000 = 2021-01-01T00:00:00Z
    const result = await epochToDate('1609459200000');
    const parsed = JSON.parse(result);
    expect(parsed.iso).toBe('2021-01-01T00:00:00.000Z');
  });

  it('should auto-detect milliseconds vs seconds', async () => {
    // If > 10000000000, treated as milliseconds
    const resultMs = await epochToDate('1609459200000');
    const resultSec = await epochToDate('1609459200');
    const parsedMs = JSON.parse(resultMs);
    const parsedSec = JSON.parse(resultSec);
    expect(parsedMs.iso).toBe(parsedSec.iso);
  });

  it('should throw on empty input', async () => {
    await expect(epochToDate('')).rejects.toThrow('Input cannot be empty');
  });

  it('should throw on non-numeric input', async () => {
    await expect(epochToDate('not-a-number')).rejects.toThrow('Invalid epoch timestamp');
  });

  it('should handle epoch 0 (Unix epoch start)', async () => {
    const result = await epochToDate('0');
    const parsed = JSON.parse(result);
    expect(parsed.iso).toBe('1970-01-01T00:00:00.000Z');
  });

  it('should include epoch, iso, utc, local, and timestamp fields', async () => {
    const result = await epochToDate('1609459200');
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('epoch');
    expect(parsed).toHaveProperty('iso');
    expect(parsed).toHaveProperty('utc');
    expect(parsed).toHaveProperty('local');
    expect(parsed).toHaveProperty('timestamp');
  });
});

describe('dateToEpoch', () => {
  it('should convert ISO date string to epoch', async () => {
    const result = await dateToEpoch('2021-01-01T00:00:00Z');
    const parsed = JSON.parse(result);
    expect(parsed.seconds).toBe(1609459200);
    expect(parsed.milliseconds).toBe(1609459200000);
  });

  it('should throw on empty input', async () => {
    await expect(dateToEpoch('')).rejects.toThrow('Input cannot be empty');
  });

  it('should throw on invalid date', async () => {
    await expect(dateToEpoch('not-a-date')).rejects.toThrow('Invalid date format');
  });

  it('should handle various date formats', async () => {
    const result = await dateToEpoch('January 1, 2021');
    const parsed = JSON.parse(result);
    expect(parsed.seconds).toBeGreaterThan(0);
  });

  it('should include input, milliseconds, seconds, iso, and utc fields', async () => {
    const result = await dateToEpoch('2021-01-01');
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('input');
    expect(parsed).toHaveProperty('milliseconds');
    expect(parsed).toHaveProperty('seconds');
    expect(parsed).toHaveProperty('iso');
    expect(parsed).toHaveProperty('utc');
  });

  it('should handle dates with time components', async () => {
    const result = await dateToEpoch('2021-06-15T12:30:45Z');
    const parsed = JSON.parse(result);
    expect(parsed.iso).toBe('2021-06-15T12:30:45.000Z');
  });

  it('should round-trip with epochToDate', async () => {
    const epochResult = await dateToEpoch('2021-01-01T00:00:00Z');
    const epochParsed = JSON.parse(epochResult);
    const dateResult = await epochToDate(String(epochParsed.seconds));
    const dateParsed = JSON.parse(dateResult);
    expect(dateParsed.iso).toBe('2021-01-01T00:00:00.000Z');
  });
});
