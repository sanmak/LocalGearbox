/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import {
  validateNotEmpty,
  validateSizeLimit,
  validateInput,
  isValidXML,
  JSON_SIZE_LIMIT,
  XML_SIZE_LIMIT,
  HTML_SIZE_LIMIT,
  TEXT_SIZE_LIMIT,
  URL_SIZE_LIMIT,
} from '@/lib/tools/shared';

describe('constants', () => {
  it('should have JSON_SIZE_LIMIT of 10MB', () => {
    expect(JSON_SIZE_LIMIT).toBe(10 * 1024 * 1024);
  });

  it('should have XML_SIZE_LIMIT of 10MB', () => {
    expect(XML_SIZE_LIMIT).toBe(10 * 1024 * 1024);
  });

  it('should have HTML_SIZE_LIMIT of 10MB', () => {
    expect(HTML_SIZE_LIMIT).toBe(10 * 1024 * 1024);
  });

  it('should have TEXT_SIZE_LIMIT of 10MB', () => {
    expect(TEXT_SIZE_LIMIT).toBe(10 * 1024 * 1024);
  });

  it('should have URL_SIZE_LIMIT of 1MB', () => {
    expect(URL_SIZE_LIMIT).toBe(1 * 1024 * 1024);
  });
});

describe('validateNotEmpty', () => {
  it('should throw on empty string', () => {
    expect(() => validateNotEmpty('')).toThrow('Input cannot be empty');
  });

  it('should throw on whitespace-only string', () => {
    expect(() => validateNotEmpty('   ')).toThrow('Input cannot be empty');
  });

  it('should throw on null-ish values', () => {
    expect(() => validateNotEmpty(undefined as unknown as string)).toThrow();
  });

  it('should not throw on valid input', () => {
    expect(() => validateNotEmpty('hello')).not.toThrow();
  });

  it('should use custom field name in error', () => {
    expect(() => validateNotEmpty('', 'SQL')).toThrow('SQL cannot be empty');
  });

  it('should accept strings with leading/trailing whitespace if content exists', () => {
    expect(() => validateNotEmpty('  hello  ')).not.toThrow();
  });
});

describe('validateSizeLimit', () => {
  it('should not throw when under limit', () => {
    expect(() => validateSizeLimit('hello', 100)).not.toThrow();
  });

  it('should throw when over limit', () => {
    expect(() => validateSizeLimit('hello world', 5)).toThrow('exceeds size limit');
  });

  it('should not throw at exact limit', () => {
    expect(() => validateSizeLimit('hi', 2)).not.toThrow();
  });

  it('should throw just over limit', () => {
    expect(() => validateSizeLimit('abc', 2)).toThrow();
  });
});

describe('validateInput', () => {
  it('should throw on empty input', () => {
    expect(() => validateInput('')).toThrow();
  });

  it('should not throw on valid input within size limit', () => {
    expect(() => validateInput('hello')).not.toThrow();
  });

  it('should throw on oversized input', () => {
    const huge = 'x'.repeat(JSON_SIZE_LIMIT + 1);
    expect(() => validateInput(huge)).toThrow('exceeds size limit');
  });

  it('should accept custom size limit', () => {
    expect(() => validateInput('hello', 3)).toThrow('exceeds size limit');
  });
});

describe('isValidXML', () => {
  it('should return true for valid XML', () => {
    expect(isValidXML('<root><child>text</child></root>')).toBe(true);
  });

  it('should return true for valid XML with attributes', () => {
    expect(isValidXML('<root attr="value">text</root>')).toBe(true);
  });

  it('should return true for self-closing tags', () => {
    expect(isValidXML('<root><item/></root>')).toBe(true);
  });

  it('should return false for mismatched tags', () => {
    expect(isValidXML('<root><child>text</other></root>')).toBe(false);
  });

  it('should return false for unclosed tags', () => {
    expect(isValidXML('<root><child>')).toBe(false);
  });

  it('should return true for XML with declaration', () => {
    expect(isValidXML('<?xml version="1.0"?><root>text</root>')).toBe(true);
  });

  it('should return true for XML with namespaces', () => {
    expect(isValidXML('<ns:root xmlns:ns="http://example.com">text</ns:root>')).toBe(true);
  });
});
