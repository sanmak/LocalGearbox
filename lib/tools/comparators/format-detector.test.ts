/**
 * Unit tests for format auto-detection
 */

import { describe, it, expect } from 'vitest';
import { detectFormat, detectFormatFromPair } from './format-detector';

describe('detectFormat', () => {
  describe('JSON detection', () => {
    it('should detect valid JSON object', () => {
      const input = '{"name": "test", "value": 123}';
      const result = detectFormat(input);

      expect(result.format).toBe('json');
      expect(result.confidence).toBe(1.0);
    });

    it('should detect valid JSON array', () => {
      const input = '[1, 2, 3, 4, 5]';
      const result = detectFormat(input);

      expect(result.format).toBe('json');
      expect(result.confidence).toBe(1.0);
    });

    it('should detect nested JSON', () => {
      const input = JSON.stringify({
        user: {
          name: 'Alice',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
      });
      const result = detectFormat(input);

      expect(result.format).toBe('json');
      expect(result.confidence).toBe(1.0);
    });

    it('should detect JSON with whitespace', () => {
      const input = `
        {
          "name": "test",
          "value": 123
        }
      `;
      const result = detectFormat(input);

      expect(result.format).toBe('json');
      expect(result.confidence).toBe(1.0);
    });

    it('should not detect invalid JSON as JSON', () => {
      const input = '{name: test}'; // Missing quotes
      const result = detectFormat(input);

      expect(result.format).not.toBe('json');
      expect(result.confidence).toBeLessThan(0.9);
    });

    it('should not detect text with braces as JSON', () => {
      const input = 'This is {not} JSON';
      const result = detectFormat(input);

      expect(result.format).not.toBe('json');
    });
  });

  describe('CSV detection', () => {
    it('should detect comma-delimited CSV', () => {
      const input = `name,email,age
Alice,alice@example.com,30
Bob,bob@example.com,25`;
      const result = detectFormat(input);

      expect(result.format).toBe('csv');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('should detect tab-delimited CSV', () => {
      const input = `name\temail\tage
Alice\talice@example.com\t30
Bob\tbob@example.com\t25`;
      const result = detectFormat(input);

      expect(result.format).toBe('csv');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('should detect pipe-delimited CSV', () => {
      const input = `name|email|age
Alice|alice@example.com|30
Bob|bob@example.com|25`;
      const result = detectFormat(input);

      expect(result.format).toBe('csv');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('should detect semicolon-delimited CSV', () => {
      const input = `name;email;age
Alice;alice@example.com;30
Bob;bob@example.com;25`;
      const result = detectFormat(input);

      expect(result.format).toBe('csv');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('should detect CSV with quoted fields', () => {
      const input = `name,email,description
"Alice Johnson","alice@example.com","Software Engineer"
"Bob Smith","bob@example.com","Designer"`;
      const result = detectFormat(input);

      expect(result.format).toBe('csv');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('should detect CSV with headers', () => {
      const input = `id,first_name,last_name,email
1,Alice,Johnson,alice@example.com
2,Bob,Smith,bob@example.com`;
      const result = detectFormat(input);

      expect(result.format).toBe('csv');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('should not detect single line as CSV with high confidence', () => {
      const input = 'name,email,age';
      const result = detectFormat(input);

      // Single line can look like CSV but should have low confidence or be text
      if (result.format === 'csv') {
        expect(result.confidence).toBeLessThan(1.0);
      }
    });

    it('should handle CSV with inconsistent columns', () => {
      const input = `name,email
Alice,alice@example.com,30
Bob,bob@example.com`;
      const result = detectFormat(input);

      // Should still be able to detect CSV even with some inconsistency
      // The detector may still have high confidence if pattern is clear enough
      expect(['csv', 'text']).toContain(result.format);
    });
  });

  describe('Text detection', () => {
    it('should detect plain text', () => {
      const input = `This is plain text
with multiple lines
and no special structure`;
      const result = detectFormat(input);

      expect(result.format).toBe('text');
    });

    it('should detect log file format as text', () => {
      const input = `2024-01-01 10:00:00 INFO Starting application
2024-01-01 10:00:01 DEBUG Connecting to database
2024-01-01 10:00:02 ERROR Connection failed`;
      const result = detectFormat(input);

      expect(result.format).toBe('text');
    });

    it('should detect configuration file as text', () => {
      const input = `server.host=localhost
server.port=8080
database.url=jdbc:mysql://localhost:3306/mydb`;
      const result = detectFormat(input);

      expect(result.format).toBe('text');
    });

    it('should default empty input to text', () => {
      const result = detectFormat('');

      expect(result.format).toBe('text');
      expect(result.confidence).toBe(1.0);
    });

    it('should default whitespace-only input to text', () => {
      const result = detectFormat('   \n\n   ');

      expect(result.format).toBe('text');
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('Edge cases', () => {
    it('should handle JSON-like text with errors', () => {
      const input = `{
  "name": "test",
  "value": 123,
  missing_quotes: true
}`;
      const result = detectFormat(input);

      // Should detect some JSON-like structure
      expect(['json', 'text']).toContain(result.format);
    });

    it('should handle CSV with JSON-like content in cells', () => {
      const input = `id,data
1,"{"name": "test"}"
2,"{"value": 123}"`;
      const result = detectFormat(input);

      expect(result.format).toBe('csv');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should handle single-character input', () => {
      const result = detectFormat('x');

      expect(result.format).toBe('text');
    });

    it('should handle very long single line', () => {
      const input = 'a'.repeat(10000);
      const result = detectFormat(input);

      expect(result.format).toBe('text');
    });

    it('should handle mixed format indicators preferring more specific format', () => {
      // Has commas but is actually JSON
      const input = '{"tags": ["python", "javascript", "rust"]}';
      const result = detectFormat(input);

      expect(result.format).toBe('json');
    });
  });
});

describe('detectFormatFromPair', () => {
  it('should detect matching JSON formats', () => {
    const left = '{"name": "Alice"}';
    const right = '{"name": "Bob"}';
    const result = detectFormatFromPair(left, right);

    expect(result.format).toBe('json');
    expect(result.leftFormat).toBe('json');
    expect(result.rightFormat).toBe('json');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('should detect matching CSV formats', () => {
    const left = `name,age
Alice,30`;
    const right = `name,age
Bob,25`;
    const result = detectFormatFromPair(left, right);

    expect(result.format).toBe('csv');
    expect(result.leftFormat).toBe('csv');
    expect(result.rightFormat).toBe('csv');
  });

  it('should detect matching text formats', () => {
    const left = 'Plain text content\nwith multiple lines';
    const right = 'Different text content\nbut still plain text';
    const result = detectFormatFromPair(left, right);

    expect(result.format).toBe('text');
    expect(result.leftFormat).toBe('text');
    expect(result.rightFormat).toBe('text');
  });

  it('should handle mismatched formats with lower confidence', () => {
    const left = '{"name": "Alice"}'; // JSON
    const right = `name,age
Bob,25`; // CSV
    const result = detectFormatFromPair(left, right);

    expect(result.leftFormat).toBe('json');
    expect(result.rightFormat).toBe('csv');
    expect(result.confidence).toBeLessThan(0.9);
  });

  it('should prefer JSON when one side is confident JSON', () => {
    const left = '{"name": "Alice", "age": 30}';
    const right = 'Some ambiguous text';
    const result = detectFormatFromPair(left, right);

    expect(result.format).toBe('json');
  });

  it('should handle both empty inputs', () => {
    const result = detectFormatFromPair('', '');

    expect(result.format).toBe('text');
    expect(result.leftFormat).toBe('text');
    expect(result.rightFormat).toBe('text');
  });

  it('should handle one empty input', () => {
    const left = '{"name": "Alice"}';
    const right = '';
    const result = detectFormatFromPair(left, right);

    expect(result.leftFormat).toBe('json');
    expect(result.rightFormat).toBe('text');
  });

  it('should use format priority when both are confident but different', () => {
    const left = '{"valid": "json"}'; // High confidence JSON
    const right = `a,b,c
1,2,3
4,5,6`; // High confidence CSV
    const result = detectFormatFromPair(left, right);

    // JSON has higher priority than CSV
    expect(result.format).toBe('json');
    expect(result.confidence).toBeLessThan(0.9); // Lower due to mismatch
  });

  it('should provide clear reason for detection', () => {
    const left = '{"name": "Alice"}';
    const right = '{"name": "Bob"}';
    const result = detectFormatFromPair(left, right);

    expect(result.reason).toBeTruthy();
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it('should handle real-world JSON examples', () => {
    const left = JSON.stringify({
      user: {
        id: 123,
        name: 'Alice',
        permissions: ['read', 'write'],
      },
    });
    const right = JSON.stringify({
      user: {
        id: 456,
        name: 'Bob',
        permissions: ['read'],
      },
    });
    const result = detectFormatFromPair(left, right);

    expect(result.format).toBe('json');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('should handle real-world CSV examples', () => {
    const left = `id,name,email,department
1,Alice,alice@example.com,Engineering
2,Bob,bob@example.com,Design`;
    const right = `id,name,email,department
1,Alice,alice@newdomain.com,Engineering
3,Charlie,charlie@example.com,Sales`;
    const result = detectFormatFromPair(left, right);

    expect(result.format).toBe('csv');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('should handle real-world log file examples', () => {
    const left = `[2024-01-01 10:00:00] INFO: Application started
[2024-01-01 10:00:01] DEBUG: Loading configuration
[2024-01-01 10:00:02] ERROR: Database connection failed`;
    const right = `[2024-01-02 10:00:00] INFO: Application started
[2024-01-02 10:00:01] DEBUG: Loading configuration
[2024-01-02 10:00:02] WARN: High memory usage detected`;
    const result = detectFormatFromPair(left, right);

    expect(result.format).toBe('text');
  });
});
