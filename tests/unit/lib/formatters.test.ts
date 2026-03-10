/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { formatJSON, formatXML, formatHTML, beautifyCSS } from '@/lib/tools/formatters';

describe('formatJSON', () => {
  it('should format a simple JSON object with 2-space indentation', async () => {
    const input = '{"name":"John","age":30}';
    const result = await formatJSON(input);
    expect(result).toBe('{\n  "name": "John",\n  "age": 30\n}');
  });

  it('should format nested JSON objects', async () => {
    const input = '{"user":{"name":"Alice","address":{"city":"NYC"}}}';
    const result = await formatJSON(input);
    const parsed = JSON.parse(result);
    expect(parsed.user.name).toBe('Alice');
    expect(parsed.user.address.city).toBe('NYC');
    expect(result).toContain('\n');
  });

  it('should format JSON arrays', async () => {
    const input = '[1,2,3,"hello",true,null]';
    const result = await formatJSON(input);
    expect(result).toBe('[\n  1,\n  2,\n  3,\n  "hello",\n  true,\n  null\n]');
  });

  it('should handle already-formatted JSON', async () => {
    const input = '{\n  "key": "value"\n}';
    const result = await formatJSON(input);
    expect(result).toBe('{\n  "key": "value"\n}');
  });

  it('should throw on invalid JSON', async () => {
    await expect(formatJSON('{invalid}')).rejects.toThrow('Invalid JSON');
  });

  it('should throw on empty input', async () => {
    await expect(formatJSON('')).rejects.toThrow();
  });

  it('should throw on whitespace-only input', async () => {
    await expect(formatJSON('   ')).rejects.toThrow();
  });

  it('should handle JSON with special characters in strings', async () => {
    const input = '{"message":"hello\\nworld","path":"C:\\\\Users"}';
    const result = await formatJSON(input);
    const parsed = JSON.parse(result);
    expect(parsed.message).toBe('hello\nworld');
    expect(parsed.path).toBe('C:\\Users');
  });

  it('should handle JSON with unicode characters', async () => {
    const input = '{"emoji":"\\u2764","text":"caf\\u00e9"}';
    const result = await formatJSON(input);
    const parsed = JSON.parse(result);
    expect(parsed.emoji).toBe('\u2764');
    expect(parsed.text).toBe('caf\u00e9');
  });

  it('should handle empty JSON object', async () => {
    const result = await formatJSON('{}');
    expect(result).toBe('{}');
  });

  it('should handle empty JSON array', async () => {
    const result = await formatJSON('[]');
    expect(result).toBe('[]');
  });

  it('should handle deeply nested JSON', async () => {
    const input = '{"a":{"b":{"c":{"d":{"e":"deep"}}}}}';
    const result = await formatJSON(input);
    expect(result).toContain('"e": "deep"');
  });

  it('should handle JSON with numeric values', async () => {
    const input = '{"int":42,"float":3.14,"negative":-1,"zero":0}';
    const result = await formatJSON(input);
    const parsed = JSON.parse(result);
    expect(parsed.int).toBe(42);
    expect(parsed.float).toBe(3.14);
    expect(parsed.negative).toBe(-1);
    expect(parsed.zero).toBe(0);
  });

  it('should handle JSON with boolean and null values', async () => {
    const input = '{"truthy":true,"falsy":false,"nothing":null}';
    const result = await formatJSON(input);
    const parsed = JSON.parse(result);
    expect(parsed.truthy).toBe(true);
    expect(parsed.falsy).toBe(false);
    expect(parsed.nothing).toBeNull();
  });
});

describe('formatXML', () => {
  it('should format a simple XML document', async () => {
    const input = '<root><child>text</child></root>';
    const result = await formatXML(input);
    expect(result).toContain('<?xml version="1.0"');
    expect(result).toContain('<root>');
    expect(result).toContain('</root>');
  });

  it('should format XML with attributes', async () => {
    const input = '<book category="fiction"><title>Test</title></book>';
    const result = await formatXML(input);
    expect(result).toContain('category="fiction"');
    expect(result).toContain('<title>');
  });

  it('should throw on invalid XML', async () => {
    await expect(formatXML('<unclosed>')).rejects.toThrow();
  });

  it('should throw on empty input', async () => {
    await expect(formatXML('')).rejects.toThrow();
  });

  it('should handle XML with multiple children', async () => {
    const input = '<root><a>1</a><b>2</b><c>3</c></root>';
    const result = await formatXML(input);
    expect(result).toContain('<a>');
    expect(result).toContain('<b>');
    expect(result).toContain('<c>');
  });

  it('should handle XML with nested elements', async () => {
    const input = '<root><parent><child>value</child></parent></root>';
    const result = await formatXML(input);
    expect(result).toContain('<parent>');
    expect(result).toContain('<child>');
  });
});

describe('formatHTML', () => {
  it('should format simple HTML', async () => {
    const input = '<div><p>Hello</p></div>';
    const result = await formatHTML(input);
    expect(result).toContain('<div>');
    expect(result).toContain('<p>');
    expect(result).toContain('</p>');
    expect(result).toContain('</div>');
  });

  it('should handle self-closing tags', async () => {
    const input = '<div><br/><img src="test.jpg"/></div>';
    const result = await formatHTML(input);
    expect(result).toContain('<br/>');
    expect(result).toContain('<img');
  });

  it('should throw on empty input', async () => {
    await expect(formatHTML('')).rejects.toThrow();
  });

  it('should reject HTML with script tags', async () => {
    const input = '<div><script>alert(1)</script></div>';
    await expect(formatHTML(input)).rejects.toThrow('script');
  });

  it('should reject HTML with event handlers', async () => {
    const input = '<button onclick="alert(1)">Click</button>';
    await expect(formatHTML(input)).rejects.toThrow('event handlers');
  });

  it('should handle text content between tags', async () => {
    const input = '<div><h1>Title</h1><p>Paragraph text</p></div>';
    const result = await formatHTML(input);
    expect(result).toContain('Title');
    expect(result).toContain('Paragraph text');
  });

  it('should handle HTML with attributes', async () => {
    const input = '<div class="container" id="main"><p>Content</p></div>';
    const result = await formatHTML(input);
    expect(result).toContain('class="container"');
    expect(result).toContain('id="main"');
  });

  it('should handle self-closing HTML5 void elements', async () => {
    const input = '<div><input type="text"><hr><meta charset="utf-8"></div>';
    const result = await formatHTML(input);
    expect(result).toContain('<input');
    expect(result).toContain('<hr>');
  });

  it('should throw on truly unclosed angle bracket (no closing >)', async () => {
    const input = '<div><p unclosed';
    await expect(formatHTML(input)).rejects.toThrow('unclosed tag');
  });

  it('should handle HTML without closing tags gracefully', async () => {
    // The formatter only checks for missing '>' characters, not mismatched tags
    const input = '<div><p>unclosed';
    const result = await formatHTML(input);
    expect(result).toContain('<div>');
    expect(result).toContain('<p>');
  });
});

describe('beautifyCSS', () => {
  it('should beautify minified CSS', async () => {
    const input = 'body{margin:0;padding:0;}h1{color:red;}';
    const result = await beautifyCSS(input);
    expect(result).toContain('body');
    expect(result).toContain('margin');
    expect(result).toContain('}');
  });

  it('should throw on empty input', async () => {
    await expect(beautifyCSS('')).rejects.toThrow();
  });

  it('should handle CSS with multiple selectors', async () => {
    const input = '.a{color:red;}.b{color:blue;}.c{color:green;}';
    const result = await beautifyCSS(input);
    expect(result).toContain('.a');
    expect(result).toContain('.b');
    expect(result).toContain('.c');
  });

  it('should handle CSS with multiple properties', async () => {
    const input = 'div{margin:0;padding:10px;color:#333;font-size:16px;}';
    const result = await beautifyCSS(input);
    expect(result).toContain('margin');
    expect(result).toContain('padding');
    expect(result).toContain('color');
    expect(result).toContain('font-size');
  });

  it('should handle already-formatted CSS', async () => {
    const input = 'body {\n  margin: 0;\n}';
    const result = await beautifyCSS(input);
    expect(result).toContain('body');
    expect(result).toContain('margin');
  });

  it('should handle nested CSS blocks', async () => {
    const input = '@media (max-width: 768px){body{font-size:14px;}}';
    const result = await beautifyCSS(input);
    expect(result).toContain('@media');
    expect(result).toContain('body');
  });
});
