/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { jsonDiff } from '@/lib/tools/comparators/json-diff';

describe('jsonDiff', () => {
  it('should detect no changes for identical JSON', async () => {
    const json = '{"a": 1, "b": 2}';
    const result = await jsonDiff(json, json);
    expect(result.stats.modifications).toBe(0);
    expect(result.stats.additions).toBe(0);
    expect(result.stats.deletions).toBe(0);
    expect(result.stats.unchanged).toBeGreaterThan(0);
  });

  it('should detect added keys', async () => {
    const left = '{"a": 1}';
    const right = '{"a": 1, "b": 2}';
    const result = await jsonDiff(left, right);
    expect(result.stats.additions).toBe(1);
  });

  it('should detect deleted keys', async () => {
    const left = '{"a": 1, "b": 2}';
    const right = '{"a": 1}';
    const result = await jsonDiff(left, right);
    expect(result.stats.deletions).toBe(1);
  });

  it('should detect modified values', async () => {
    const left = '{"a": 1}';
    const right = '{"a": 2}';
    const result = await jsonDiff(left, right);
    expect(result.stats.modifications).toBe(1);
  });

  it('should handle nested objects in advanced mode', async () => {
    const left = '{"a": {"b": 1}}';
    const right = '{"a": {"b": 2}}';
    const result = await jsonDiff(left, right, { mode: 'advanced' });
    expect(result.stats.modifications).toBe(1);
  });

  it('should treat nested objects as atomic in simple mode', async () => {
    const left = '{"a": {"b": 1}}';
    const right = '{"a": {"b": 2}}';
    const result = await jsonDiff(left, right, { mode: 'simple' });
    expect(result.stats.modifications).toBe(1);
  });

  it('should handle array differences', async () => {
    const left = '{"arr": [1, 2, 3]}';
    const right = '{"arr": [1, 2, 4]}';
    const result = await jsonDiff(left, right, { mode: 'advanced' });
    expect(result.stats.modifications).toBeGreaterThan(0);
  });

  it('should handle ignoreKeyOrder option', async () => {
    const left = '{"b": 2, "a": 1}';
    const right = '{"a": 1, "b": 2}';
    const result = await jsonDiff(left, right, { ignoreKeyOrder: true });
    expect(result.stats.modifications).toBe(0);
    expect(result.stats.unchanged).toBeGreaterThan(0);
  });

  it('should throw on invalid left JSON', async () => {
    await expect(jsonDiff('{invalid}', '{"a": 1}')).rejects.toThrow('Invalid JSON on left');
  });

  it('should throw on invalid right JSON', async () => {
    await expect(jsonDiff('{"a": 1}', '{invalid}')).rejects.toThrow('Invalid JSON on right');
  });

  it('should throw on empty left input', async () => {
    await expect(jsonDiff('', '{"a": 1}')).rejects.toThrow();
  });

  it('should throw on empty right input', async () => {
    await expect(jsonDiff('{"a": 1}', '')).rejects.toThrow();
  });

  it('should handle type changes (string to number)', async () => {
    const left = '{"a": "1"}';
    const right = '{"a": 1}';
    const result = await jsonDiff(left, right);
    expect(result.stats.modifications).toBe(1);
  });

  it('should handle null values', async () => {
    const left = '{"a": null}';
    const right = '{"a": 1}';
    const result = await jsonDiff(left, right);
    expect(result.stats.modifications).toBe(1);
  });

  it('should handle boolean values', async () => {
    const left = '{"a": true}';
    const right = '{"a": false}';
    const result = await jsonDiff(left, right);
    expect(result.stats.modifications).toBe(1);
  });

  it('should handle arrays with different lengths', async () => {
    const left = '{"arr": [1, 2]}';
    const right = '{"arr": [1, 2, 3]}';
    const result = await jsonDiff(left, right, { mode: 'advanced' });
    expect(result.stats.additions).toBeGreaterThan(0);
  });

  it('should handle deeply nested changes', async () => {
    const left = '{"a": {"b": {"c": {"d": 1}}}}';
    const right = '{"a": {"b": {"c": {"d": 2}}}}';
    const result = await jsonDiff(left, right, { mode: 'advanced' });
    expect(result.stats.modifications).toBe(1);
  });

  it('should handle ignoreFormatting option', async () => {
    const left = '{"a": "  hello  "}';
    const right = '{"a": "hello"}';
    const result = await jsonDiff(left, right, { ignoreFormatting: true });
    expect(result.stats.modifications).toBe(0);
  });

  it('should return changes array', async () => {
    const left = '{"a": 1, "b": 2}';
    const right = '{"a": 1, "c": 3}';
    const result = await jsonDiff(left, right);
    expect(result.changes.length).toBeGreaterThan(0);
    // 'a' unchanged, 'b' deleted, 'c' added
    const unchangedChange = result.changes.find((c) => c.type === 'unchanged');
    const deletedChange = result.changes.find((c) => c.type === 'deleted');
    const addedChange = result.changes.find((c) => c.type === 'added');
    expect(unchangedChange).toBeDefined();
    expect(deletedChange).toBeDefined();
    expect(addedChange).toBeDefined();
  });
});
