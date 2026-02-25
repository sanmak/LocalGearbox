/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { validateJSON, validateXML } from '@/lib/tools/validators';

describe('validateJSON', () => {
  it('should validate valid JSON object', async () => {
    const result = await validateJSON('{"name": "John"}');
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(true);
    expect(parsed.message).toBe('Valid JSON');
  });

  it('should validate valid JSON array', async () => {
    const result = await validateJSON('[1, 2, 3]');
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(true);
  });

  it('should detect invalid JSON', async () => {
    const result = await validateJSON('{invalid}');
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(false);
    expect(parsed.error).toBeTruthy();
  });

  it('should detect missing closing brace', async () => {
    const result = await validateJSON('{"key": "value"');
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(false);
  });

  it('should detect trailing comma', async () => {
    const result = await validateJSON('{"key": "value",}');
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(false);
  });

  it('should throw on empty input', async () => {
    await expect(validateJSON('')).rejects.toThrow();
  });

  it('should validate nested JSON', async () => {
    const input = '{"a": {"b": {"c": [1, 2, 3]}}}';
    const result = await validateJSON(input);
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(true);
  });

  it('should validate JSON with string, number, boolean, null types', async () => {
    const input = '{"s": "string", "n": 42, "b": true, "nil": null}';
    const result = await validateJSON(input);
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(true);
  });

  it('should detect single quotes as invalid', async () => {
    const result = await validateJSON("{'key': 'value'}");
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(false);
  });

  it('should detect unquoted keys as invalid', async () => {
    const result = await validateJSON('{key: "value"}');
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(false);
  });
});

describe('validateXML', () => {
  it('should validate valid XML', async () => {
    const input = '<root><child>text</child></root>';
    const result = await validateXML(input);
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(true);
    expect(parsed.message).toBe('Valid XML');
  });

  it('should detect invalid XML (unclosed tag)', async () => {
    const input = '<root><child>text</root>';
    const result = await validateXML(input);
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(false);
    expect(parsed.error).toBeTruthy();
  });

  it('should throw on empty input', async () => {
    await expect(validateXML('')).rejects.toThrow();
  });

  it('should validate XML with attributes', async () => {
    const input = '<root attr="value"><child id="1">text</child></root>';
    const result = await validateXML(input);
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(true);
  });

  it('should validate XML with self-closing tags', async () => {
    const input = '<root><item/></root>';
    const result = await validateXML(input);
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(true);
  });

  it('should validate XML with declaration', async () => {
    const input = '<?xml version="1.0" encoding="UTF-8"?><root>test</root>';
    const result = await validateXML(input);
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(true);
  });

  it('should detect mismatched tags as invalid', async () => {
    const input = '<root><child>text</other></root>';
    const result = await validateXML(input);
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(false);
  });

  it('should validate nested XML', async () => {
    const input = '<root><level1><level2><level3>deep</level3></level2></level1></root>';
    const result = await validateXML(input);
    const parsed = JSON.parse(result);
    expect(parsed.valid).toBe(true);
  });
});
