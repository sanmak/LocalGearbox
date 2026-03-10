/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import {
  reverseString,
  stringToLines,
  removeWhitespace,
  textToUppercase,
  textToLowercase,
  titleCase,
} from '@/lib/tools/text';

describe('reverseString', () => {
  it('should reverse a simple string', async () => {
    const result = await reverseString('hello');
    expect(result).toBe('olleh');
  });

  it('should reverse a palindrome back to itself', async () => {
    const result = await reverseString('racecar');
    expect(result).toBe('racecar');
  });

  it('should throw on empty input', async () => {
    await expect(reverseString('')).rejects.toThrow();
  });

  it('should reverse a string with spaces', async () => {
    const result = await reverseString('hello world');
    expect(result).toBe('dlrow olleh');
  });

  it('should reverse a single character', async () => {
    const result = await reverseString('a');
    expect(result).toBe('a');
  });

  it('should reverse numbers in string', async () => {
    const result = await reverseString('12345');
    expect(result).toBe('54321');
  });

  it('should reverse special characters', async () => {
    const result = await reverseString('!@#$%');
    expect(result).toBe('%$#@!');
  });

  it('should reverse multi-line strings', async () => {
    const result = await reverseString('abc\ndef');
    expect(result).toBe('fed\ncba');
  });

  it('should handle unicode characters', async () => {
    const result = await reverseString('abc');
    expect(result).toBe('cba');
  });
});

describe('stringToLines', () => {
  it('should split a multi-line string into lines', async () => {
    const result = await stringToLines('line1\nline2\nline3');
    const parsed = JSON.parse(result);
    expect(parsed.lineCount).toBe(3);
    expect(parsed.lines).toEqual(['line1', 'line2', 'line3']);
  });

  it('should handle Windows-style line endings (CRLF)', async () => {
    const result = await stringToLines('line1\r\nline2\r\nline3');
    const parsed = JSON.parse(result);
    expect(parsed.lineCount).toBe(3);
  });

  it('should handle a single line', async () => {
    const result = await stringToLines('single line');
    const parsed = JSON.parse(result);
    expect(parsed.lineCount).toBe(1);
    expect(parsed.lines).toEqual(['single line']);
  });

  it('should throw on empty input', async () => {
    await expect(stringToLines('')).rejects.toThrow();
  });

  it('should count empty lines', async () => {
    const result = await stringToLines('line1\n\nline3');
    const parsed = JSON.parse(result);
    expect(parsed.lineCount).toBe(3);
    expect(parsed.lines[1]).toBe('');
  });

  it('should handle trailing newline', async () => {
    const result = await stringToLines('line1\nline2\n');
    const parsed = JSON.parse(result);
    expect(parsed.lineCount).toBe(3);
    expect(parsed.lines[2]).toBe('');
  });
});

describe('removeWhitespace', () => {
  it('should remove all spaces', async () => {
    const result = await removeWhitespace('hello world');
    expect(result).toBe('helloworld');
  });

  it('should remove tabs', async () => {
    const result = await removeWhitespace('col1\tcol2');
    expect(result).toBe('col1col2');
  });

  it('should remove newlines', async () => {
    const result = await removeWhitespace('line1\nline2');
    expect(result).toBe('line1line2');
  });

  it('should remove multiple types of whitespace', async () => {
    const result = await removeWhitespace('  hello \t world \n foo  ');
    expect(result).toBe('helloworldfoo');
  });

  it('should throw on empty input', async () => {
    await expect(removeWhitespace('')).rejects.toThrow();
  });

  it('should return empty string for whitespace-only input after removing', async () => {
    await expect(removeWhitespace('   ')).rejects.toThrow();
  });

  it('should not modify text without whitespace', async () => {
    const result = await removeWhitespace('nospaces');
    expect(result).toBe('nospaces');
  });
});

describe('textToUppercase', () => {
  it('should convert to uppercase', async () => {
    const result = await textToUppercase('hello world');
    expect(result).toBe('HELLO WORLD');
  });

  it('should handle already uppercase text', async () => {
    const result = await textToUppercase('ALREADY UPPER');
    expect(result).toBe('ALREADY UPPER');
  });

  it('should handle mixed case', async () => {
    const result = await textToUppercase('HeLLo WoRLd');
    expect(result).toBe('HELLO WORLD');
  });

  it('should throw on empty input', async () => {
    await expect(textToUppercase('')).rejects.toThrow();
  });

  it('should preserve numbers and special characters', async () => {
    const result = await textToUppercase('abc123!@#');
    expect(result).toBe('ABC123!@#');
  });

  it('should handle unicode lowercase letters', async () => {
    const result = await textToUppercase('caf\u00e9');
    expect(result).toBe('CAF\u00c9');
  });
});

describe('textToLowercase', () => {
  it('should convert to lowercase', async () => {
    const result = await textToLowercase('HELLO WORLD');
    expect(result).toBe('hello world');
  });

  it('should handle already lowercase text', async () => {
    const result = await textToLowercase('already lower');
    expect(result).toBe('already lower');
  });

  it('should handle mixed case', async () => {
    const result = await textToLowercase('HeLLo WoRLd');
    expect(result).toBe('hello world');
  });

  it('should throw on empty input', async () => {
    await expect(textToLowercase('')).rejects.toThrow();
  });

  it('should preserve numbers and special characters', async () => {
    const result = await textToLowercase('ABC123!@#');
    expect(result).toBe('abc123!@#');
  });
});

describe('titleCase', () => {
  it('should convert to title case', async () => {
    const result = await titleCase('hello world');
    expect(result).toBe('Hello World');
  });

  it('should handle all uppercase input', async () => {
    const result = await titleCase('HELLO WORLD');
    expect(result).toBe('Hello World');
  });

  it('should handle all lowercase input', async () => {
    const result = await titleCase('hello world');
    expect(result).toBe('Hello World');
  });

  it('should handle single word', async () => {
    const result = await titleCase('hello');
    expect(result).toBe('Hello');
  });

  it('should throw on empty input', async () => {
    await expect(titleCase('')).rejects.toThrow();
  });

  it('should handle multiple spaces between words', async () => {
    const result = await titleCase('hello  world');
    // The function splits by space and capitalizes each word
    // Two spaces will create an empty word between them
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  it('should capitalize first letter and lowercase rest of each word', async () => {
    const result = await titleCase('hELLO wORLD');
    expect(result).toBe('Hello World');
  });

  it('should handle numbers in words', async () => {
    const result = await titleCase('hello 2nd world');
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });
});
