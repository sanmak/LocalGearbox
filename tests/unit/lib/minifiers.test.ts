/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { minifyJSON, minifyCSS, minifyJS, minifyHTML, minifyXML } from '@/lib/tools/minifiers';

describe('minifyJSON', () => {
  it('should remove whitespace from formatted JSON', async () => {
    const input = '{\n  "name": "John",\n  "age": 30\n}';
    const result = await minifyJSON(input);
    expect(result).toBe('{"name":"John","age":30}');
  });

  it('should handle already minified JSON', async () => {
    const input = '{"a":1}';
    const result = await minifyJSON(input);
    expect(result).toBe('{"a":1}');
  });

  it('should throw on invalid JSON', async () => {
    await expect(minifyJSON('{invalid}')).rejects.toThrow('Invalid JSON');
  });

  it('should throw on empty input', async () => {
    await expect(minifyJSON('')).rejects.toThrow();
  });

  it('should handle arrays', async () => {
    const input = '[\n  1,\n  2,\n  3\n]';
    const result = await minifyJSON(input);
    expect(result).toBe('[1,2,3]');
  });

  it('should handle nested objects', async () => {
    const input = '{\n  "a": {\n    "b": {\n      "c": 1\n    }\n  }\n}';
    const result = await minifyJSON(input);
    expect(result).toBe('{"a":{"b":{"c":1}}}');
  });

  it('should preserve string values with spaces', async () => {
    const input = '{"message": "hello world"}';
    const result = await minifyJSON(input);
    expect(result).toBe('{"message":"hello world"}');
  });

  it('should handle null, boolean values', async () => {
    const input = '{"a": null, "b": true, "c": false}';
    const result = await minifyJSON(input);
    expect(result).toBe('{"a":null,"b":true,"c":false}');
  });

  it('should handle empty object', async () => {
    const result = await minifyJSON('{}');
    expect(result).toBe('{}');
  });

  it('should handle empty array', async () => {
    const result = await minifyJSON('[]');
    expect(result).toBe('[]');
  });
});

describe('minifyCSS', () => {
  it('should remove comments', async () => {
    const input = '/* comment */ body { margin: 0; }';
    const result = await minifyCSS(input);
    expect(result).not.toContain('comment');
  });

  it('should collapse whitespace', async () => {
    const input = 'body  {\n  margin:  0;\n  padding:  0;\n}';
    const result = await minifyCSS(input);
    expect(result).not.toContain('\n');
  });

  it('should remove spaces around braces', async () => {
    const input = 'body { color: red; }';
    const result = await minifyCSS(input);
    expect(result).toContain('body{');
    expect(result).toContain('}');
  });

  it('should remove spaces around colons', async () => {
    const input = 'body { color : red; }';
    const result = await minifyCSS(input);
    expect(result).toContain('color:red');
  });

  it('should remove spaces around semicolons', async () => {
    const input = 'body { margin: 0 ; padding: 0 ; }';
    const result = await minifyCSS(input);
    expect(result).toContain('0;');
  });

  it('should throw on empty input', async () => {
    await expect(minifyCSS('')).rejects.toThrow();
  });

  it('should handle multi-line comments', async () => {
    const input = '/*\n * Multi-line\n * comment\n */\nbody { margin: 0; }';
    const result = await minifyCSS(input);
    expect(result).not.toContain('Multi-line');
  });

  it('should handle multiple selectors', async () => {
    const input = '.a { color: red; } .b { color: blue; }';
    const result = await minifyCSS(input);
    expect(result).toContain('.a{color:red;}');
    expect(result).toContain('.b{color:blue;}');
  });
});

describe('minifyJS', () => {
  it('should remove single-line comments', async () => {
    const input = 'var x = 1; // comment';
    const result = await minifyJS(input);
    expect(result).not.toContain('comment');
    expect(result).toContain('var x = 1;');
  });

  it('should remove multi-line comments', async () => {
    const input = '/* comment */ var x = 1;';
    const result = await minifyJS(input);
    expect(result).not.toContain('comment');
    expect(result).toContain('var x = 1;');
  });

  it('should collapse whitespace', async () => {
    const input = 'var   x   =   1;';
    const result = await minifyJS(input);
    expect(result).toBe('var x = 1;');
  });

  it('should throw on empty input', async () => {
    await expect(minifyJS('')).rejects.toThrow();
  });

  it('should handle multiple statements', async () => {
    const input = 'var x = 1;\nvar y = 2;\nvar z = 3;';
    const result = await minifyJS(input);
    expect(result).toContain('var x = 1;');
    expect(result).toContain('var y = 2;');
    expect(result).toContain('var z = 3;');
  });

  it('should handle functions', async () => {
    const input = 'function hello() {\n  return "world";\n}';
    const result = await minifyJS(input);
    expect(result).toContain('function hello()');
    expect(result).toContain('return "world"');
  });
});

describe('minifyHTML', () => {
  it('should remove HTML comments', async () => {
    const input = '<!-- comment --><div>hello</div>';
    const result = await minifyHTML(input);
    expect(result).not.toContain('comment');
    expect(result).toContain('<div>hello</div>');
  });

  it('should collapse whitespace', async () => {
    const input = '<div>  hello  world  </div>';
    const result = await minifyHTML(input);
    expect(result).toContain('hello world');
  });

  it('should remove whitespace between tags', async () => {
    const input = '<div>  </div>  <p>  </p>';
    const result = await minifyHTML(input);
    expect(result).toContain('<div>');
    expect(result).toContain('<p>');
    // Space between tags should be removed
    expect(result).not.toMatch(/>\s+</);
  });

  it('should throw on empty input', async () => {
    await expect(minifyHTML('')).rejects.toThrow();
  });

  it('should handle nested elements', async () => {
    const input = '<div>\n  <p>\n    Hello\n  </p>\n</div>';
    const result = await minifyHTML(input);
    expect(result).toContain('<div>');
    expect(result).toContain('<p>');
    expect(result).toContain('Hello');
  });

  it('should handle multi-line comments', async () => {
    const input = '<!--\nlong\ncomment\n--><div>test</div>';
    const result = await minifyHTML(input);
    expect(result).not.toContain('long');
    expect(result).toContain('<div>test</div>');
  });
});

describe('minifyXML', () => {
  it('should remove XML comments', async () => {
    const input = '<!-- comment --><root><child>text</child></root>';
    const result = await minifyXML(input);
    expect(result).not.toContain('comment');
    expect(result).toContain('<root>');
  });

  it('should collapse whitespace', async () => {
    const input = '<root>   <child>   text   </child>   </root>';
    const result = await minifyXML(input);
    // Whitespace between tags should be removed
    expect(result).not.toMatch(/>\s+</);
  });

  it('should remove whitespace between tags', async () => {
    const input = '<root>\n  <child>\n    text\n  </child>\n</root>';
    const result = await minifyXML(input);
    expect(result).toContain('<root>');
    expect(result).toContain('<child>');
  });

  it('should throw on empty input', async () => {
    await expect(minifyXML('')).rejects.toThrow();
  });

  it('should handle XML with attributes', async () => {
    const input = '<root attr="value">\n  <child id="1">text</child>\n</root>';
    const result = await minifyXML(input);
    expect(result).toContain('attr="value"');
    expect(result).toContain('id="1"');
  });

  it('should handle self-closing tags', async () => {
    const input = '<root>\n  <item />\n</root>';
    const result = await minifyXML(input);
    expect(result).toContain('<item');
  });
});
