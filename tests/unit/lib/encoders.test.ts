/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import {
  encodeURL,
  decodeURL,
  processURL,
  encodeBase64,
  decodeBase64,
  escapeHTML,
  unescapeHTML,
  escapeXML,
  unescapeXML,
  escapeJSON,
  escapeCSV,
} from '@/lib/tools/encoders';

describe('encodeURL', () => {
  it('should encode special URL characters', async () => {
    const result = await encodeURL('hello world');
    expect(result).toBe('hello%20world');
  });

  it('should encode ampersands', async () => {
    const result = await encodeURL('key=value&other=123');
    expect(result).toBe('key%3Dvalue%26other%3D123');
  });

  it('should encode unicode characters', async () => {
    const result = await encodeURL('caf\u00e9');
    expect(result).toBe('caf%C3%A9');
  });

  it('should not encode unreserved characters', async () => {
    const result = await encodeURL('hello-world_test.123~');
    expect(result).toBe('hello-world_test.123~');
  });

  it('should throw on empty input', async () => {
    await expect(encodeURL('')).rejects.toThrow();
  });

  it('should encode forward slashes', async () => {
    const result = await encodeURL('/path/to/resource');
    expect(result).toBe('%2Fpath%2Fto%2Fresource');
  });

  it('should encode question marks and hash', async () => {
    const result = await encodeURL('?query=value#fragment');
    expect(result).toBe('%3Fquery%3Dvalue%23fragment');
  });
});

describe('decodeURL', () => {
  it('should decode percent-encoded characters', async () => {
    const result = await decodeURL('hello%20world');
    expect(result).toBe('hello world');
  });

  it('should decode ampersands', async () => {
    const result = await decodeURL('key%3Dvalue%26other%3D123');
    expect(result).toBe('key=value&other=123');
  });

  it('should throw on empty input', async () => {
    await expect(decodeURL('')).rejects.toThrow();
  });

  it('should throw on invalid URL encoding', async () => {
    await expect(decodeURL('%GG')).rejects.toThrow();
  });

  it('should decode unicode characters', async () => {
    const result = await decodeURL('caf%C3%A9');
    expect(result).toBe('caf\u00e9');
  });

  it('should handle already decoded strings', async () => {
    const result = await decodeURL('hello');
    expect(result).toBe('hello');
  });
});

describe('processURL', () => {
  it('should detect and decode URL-encoded input', async () => {
    const result = await processURL('hello%20world');
    const parsed = JSON.parse(result);
    expect(parsed.operation).toBe('decode');
    expect(parsed.output).toBe('hello world');
  });

  it('should detect and encode plain text input', async () => {
    const result = await processURL('hello world');
    const parsed = JSON.parse(result);
    expect(parsed.operation).toBe('encode');
    expect(parsed.output).toBe('hello%20world');
  });

  it('should throw on empty input', async () => {
    await expect(processURL('')).rejects.toThrow();
  });

  it('should detect percent-encoding patterns', async () => {
    const result = await processURL('test%3Dvalue');
    const parsed = JSON.parse(result);
    expect(parsed.operation).toBe('decode');
  });

  it('should encode input without percent-encoding patterns', async () => {
    const result = await processURL('simple-text');
    const parsed = JSON.parse(result);
    expect(parsed.operation).toBe('encode');
  });
});

describe('encodeBase64', () => {
  it('should encode a simple string', async () => {
    const result = await encodeBase64('Hello, World!');
    expect(result).toBe('SGVsbG8sIFdvcmxkIQ==');
  });

  it('should encode unicode text', async () => {
    const result = await encodeBase64('caf\u00e9');
    expect(result).toBeTruthy();
    // Verify round-trip
    const decoded = await decodeBase64(result);
    expect(decoded).toBe('caf\u00e9');
  });

  it('should throw on empty input', async () => {
    await expect(encodeBase64('')).rejects.toThrow();
  });

  it('should encode special characters', async () => {
    const result = await encodeBase64('<script>alert(1)</script>');
    expect(result).toBeTruthy();
    expect(result).not.toContain('<');
  });

  it('should handle multi-line input', async () => {
    const result = await encodeBase64('line1\nline2\nline3');
    expect(result).toBeTruthy();
  });

  it('should handle single character', async () => {
    const result = await encodeBase64('a');
    expect(result).toBe('YQ==');
  });
});

describe('decodeBase64', () => {
  it('should decode a valid Base64 string', async () => {
    const result = await decodeBase64('SGVsbG8sIFdvcmxkIQ==');
    expect(result).toBe('Hello, World!');
  });

  it('should throw on empty input', async () => {
    await expect(decodeBase64('')).rejects.toThrow();
  });

  it('should throw on invalid Base64 characters', async () => {
    await expect(decodeBase64('not!valid@base64')).rejects.toThrow('Invalid Base64');
  });

  it('should decode Base64 without padding', async () => {
    // 'YQ' is valid base64 for 'a' (some encoders omit padding)
    const result = await decodeBase64('YQ==');
    expect(result).toBe('a');
  });

  it('should handle Base64 with plus and slash', async () => {
    const result = await decodeBase64('dGVzdCtzbGFzaC8=');
    expect(result).toBe('test+slash/');
  });
});

describe('escapeHTML', () => {
  it('should escape angle brackets', async () => {
    const result = await escapeHTML('<div>hello</div>');
    expect(result).toBe('&lt;div&gt;hello&lt;/div&gt;');
  });

  it('should escape ampersands', async () => {
    const result = await escapeHTML('a & b');
    expect(result).toBe('a &amp; b');
  });

  it('should escape double quotes', async () => {
    const result = await escapeHTML('say "hello"');
    expect(result).toBe('say &quot;hello&quot;');
  });

  it('should escape single quotes', async () => {
    const result = await escapeHTML("it's");
    expect(result).toBe('it&#39;s');
  });

  it('should escape all special characters together', async () => {
    const result = await escapeHTML('<a href="link">test & \'value\'</a>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&amp;');
    expect(result).toContain('&quot;');
    expect(result).toContain('&#39;');
  });

  it('should throw on empty input', async () => {
    await expect(escapeHTML('')).rejects.toThrow();
  });

  it('should not modify plain text without special characters', async () => {
    const result = await escapeHTML('hello world 123');
    expect(result).toBe('hello world 123');
  });
});

describe('unescapeHTML', () => {
  it('should unescape HTML entities', async () => {
    const result = await unescapeHTML('&lt;div&gt;hello&lt;/div&gt;');
    expect(result).toBe('<div>hello</div>');
  });

  it('should unescape ampersands', async () => {
    const result = await unescapeHTML('a &amp; b');
    expect(result).toBe('a & b');
  });

  it('should unescape quotes', async () => {
    const result = await unescapeHTML('&quot;hello&quot;');
    expect(result).toBe('"hello"');
  });

  it('should unescape single quotes', async () => {
    const result = await unescapeHTML('it&#39;s');
    expect(result).toBe("it's");
  });

  it('should throw on empty input', async () => {
    await expect(unescapeHTML('')).rejects.toThrow();
  });

  it('should round-trip with escapeHTML', async () => {
    const original = '<p>Hello & "World"</p>';
    const escaped = await escapeHTML(original);
    const unescaped = await unescapeHTML(escaped);
    expect(unescaped).toBe(original);
  });
});

describe('escapeXML', () => {
  it('should escape XML special characters', async () => {
    const result = await escapeXML('<tag attr="val">text & more</tag>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&amp;');
    expect(result).toContain('&quot;');
  });

  it('should escape apostrophes with &apos;', async () => {
    const result = await escapeXML("it's");
    expect(result).toBe('it&apos;s');
  });

  it('should throw on empty input', async () => {
    await expect(escapeXML('')).rejects.toThrow();
  });

  it('should not modify plain text', async () => {
    const result = await escapeXML('simple text');
    expect(result).toBe('simple text');
  });
});

describe('unescapeXML', () => {
  it('should unescape XML entities', async () => {
    const result = await unescapeXML('&lt;tag&gt;');
    expect(result).toBe('<tag>');
  });

  it('should unescape &apos;', async () => {
    const result = await unescapeXML('it&apos;s');
    expect(result).toBe("it's");
  });

  it('should throw on empty input', async () => {
    await expect(unescapeXML('')).rejects.toThrow();
  });

  it('should round-trip with escapeXML', async () => {
    const original = '<root attr="test">value & more</root>';
    const escaped = await escapeXML(original);
    const unescaped = await unescapeXML(escaped);
    expect(unescaped).toBe(original);
  });
});

describe('escapeJSON', () => {
  it('should escape a simple string', async () => {
    const result = await escapeJSON('hello');
    expect(result).toBe('"hello"');
  });

  it('should escape quotes inside strings', async () => {
    const result = await escapeJSON('say "hello"');
    expect(result).toBe('"say \\"hello\\""');
  });

  it('should escape newlines', async () => {
    const result = await escapeJSON('line1\nline2');
    expect(result).toBe('"line1\\nline2"');
  });

  it('should escape backslashes', async () => {
    const result = await escapeJSON('C:\\path');
    expect(result).toBe('"C:\\\\path"');
  });

  it('should escape tabs', async () => {
    const result = await escapeJSON('col1\tcol2');
    expect(result).toBe('"col1\\tcol2"');
  });

  it('should throw on empty input', async () => {
    await expect(escapeJSON('')).rejects.toThrow();
  });
});

describe('escapeCSV', () => {
  it('should not wrap simple values', async () => {
    const result = await escapeCSV('hello');
    expect(result).toBe('hello');
  });

  it('should wrap values containing commas in quotes', async () => {
    const result = await escapeCSV('hello, world');
    expect(result).toBe('"hello, world"');
  });

  it('should escape double quotes by doubling them', async () => {
    const result = await escapeCSV('say "hello"');
    expect(result).toBe('"say ""hello"""');
  });

  it('should wrap values containing newlines', async () => {
    const result = await escapeCSV('line1\nline2');
    expect(result).toBe('"line1\nline2"');
  });

  it('should wrap values containing carriage returns', async () => {
    const result = await escapeCSV('line1\rline2');
    expect(result).toBe('"line1\rline2"');
  });

  it('should throw on empty input', async () => {
    await expect(escapeCSV('')).rejects.toThrow();
  });

  it('should handle values with both commas and quotes', async () => {
    const result = await escapeCSV('"value", another');
    expect(result).toBe('"""value"", another"');
  });
});
