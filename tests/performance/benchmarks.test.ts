/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';

import { formatJSON, validateJSON, minifyJSON, formatXML, parseJMESPath } from '@/lib/tools';

/**
 * Performance Benchmarks for Core Processors
 *
 * These tests ensure that core operations meet the 50ms response time principle.
 * Tests use realistic data sizes that users might encounter.
 */

const THRESHOLD_MS = 50;

describe('Performance Benchmarks - JSON Operations', () => {
  it('should format small JSON (1KB) within 50ms', async () => {
    const smallJSON = JSON.stringify({ users: Array(10).fill({ name: 'Test', age: 25 }) });

    const start = performance.now();
    await formatJSON(smallJSON);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(THRESHOLD_MS);
  });

  it('should format medium JSON (100KB) within 50ms', async () => {
    const mediumJSON = JSON.stringify({
      data: Array(500).fill({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        address: { city: 'City', country: 'Country' },
      }),
    });

    const start = performance.now();
    await formatJSON(mediumJSON);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(THRESHOLD_MS);
  });

  it('should validate JSON within 50ms', async () => {
    const json = JSON.stringify({ test: 'data', nested: { value: 123 } });

    const start = performance.now();
    await validateJSON(json);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(THRESHOLD_MS);
  });

  it('should minify JSON within 50ms', async () => {
    const formattedJSON = `{
      "name": "Test",
      "data": {
        "values": [1, 2, 3, 4, 5]
      }
    }`;

    const start = performance.now();
    await minifyJSON(formattedJSON);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(THRESHOLD_MS);
  });
});

describe('Performance Benchmarks - XML Operations', () => {
  it('should format small XML within 50ms', async () => {
    const smallXML = '<root><item>Test</item><item>Test2</item></root>';

    const start = performance.now();
    await formatXML(smallXML);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(THRESHOLD_MS);
  });

  it('should format medium XML within 50ms', async () => {
    const items = Array(50)
      .fill(0)
      .map((_, i) => `<item id="${i}"><name>Item ${i}</name><value>${i * 10}</value></item>`)
      .join('');
    const mediumXML = `<root>${items}</root>`;

    const start = performance.now();
    await formatXML(mediumXML);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(THRESHOLD_MS);
  });
});

describe('Performance Benchmarks - JMESPath Operations', () => {
  it('should execute simple JMESPath query within 50ms', async () => {
    const data = {
      users: Array(100).fill({ name: 'Test', active: true, score: 95 }),
    };

    const start = performance.now();
    await parseJMESPath(data, 'users[?active]');
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(THRESHOLD_MS);
  });

  it('should execute projection query within 50ms', async () => {
    const data = {
      products: Array(50).fill({
        name: 'Product',
        price: 99.99,
        category: 'Electronics',
      }),
    };

    const start = performance.now();
    await parseJMESPath(data, 'products[*].name');
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(THRESHOLD_MS);
  });
});

describe('Performance Benchmarks - Encoding Operations', () => {
  it('should Base64 encode within 50ms', () => {
    const data = 'Hello World '.repeat(100);

    const start = performance.now();
    btoa(data);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(THRESHOLD_MS);
  });

  it('should Base64 decode within 50ms', () => {
    const encoded = btoa('Hello World '.repeat(100));

    const start = performance.now();
    atob(encoded);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(THRESHOLD_MS);
  });

  it('should URL encode within 50ms', () => {
    const data = 'Hello World & Special Characters! @#$%^&*()'.repeat(50);

    const start = performance.now();
    encodeURIComponent(data);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(THRESHOLD_MS);
  });
});

describe('Performance Benchmarks - Hash Operations', () => {
  it('should generate hash within 50ms', async () => {
    const data = 'Test data for hashing '.repeat(100);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const start = performance.now();
    await crypto.subtle.digest('SHA-256', dataBuffer);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(THRESHOLD_MS);
  });
});

/**
 * Helper function to measure average performance over multiple runs
 */
export function measureAveragePerformance(fn: () => void, iterations: number = 10): number {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    times.push(duration);
  }

  return times.reduce((a, b) => a + b, 0) / times.length;
}
