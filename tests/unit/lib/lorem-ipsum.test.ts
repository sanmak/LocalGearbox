/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { generateLoremIpsumText } from '@/lib/tools/generators/lorem-ipsum';

describe('generateLoremIpsumText', () => {
  // ─── Paragraphs Mode ─────────────────────────────────────────────────────

  describe('paragraphs mode', () => {
    it('should generate the specified number of paragraphs', async () => {
      const input = JSON.stringify({
        mode: 'paragraphs',
        count: 3,
        startWithLorem: false,
        includeHtml: false,
      });
      const result = await generateLoremIpsumText(input);
      const paragraphs = result.split('\n\n');
      expect(paragraphs).toHaveLength(3);
    });

    it('should generate a single paragraph', async () => {
      const input = JSON.stringify({
        mode: 'paragraphs',
        count: 1,
        startWithLorem: false,
        includeHtml: false,
      });
      const result = await generateLoremIpsumText(input);
      expect(result).toBeTruthy();
      expect(result.split('\n\n')).toHaveLength(1);
    });

    it('should generate multiple paragraphs with HTML wrapping', async () => {
      const input = JSON.stringify({
        mode: 'paragraphs',
        count: 2,
        startWithLorem: false,
        includeHtml: true,
      });
      const result = await generateLoremIpsumText(input);
      expect(result).toContain('<p>');
      expect(result).toContain('</p>');
      const pTags = result.match(/<p>/g);
      expect(pTags).toHaveLength(2);
    });

    it('should start with Lorem ipsum when startWithLorem is true', async () => {
      const input = JSON.stringify({
        mode: 'paragraphs',
        count: 1,
        startWithLorem: true,
        includeHtml: false,
      });
      const result = await generateLoremIpsumText(input);
      expect(result).toMatch(/^Lorem ipsum dolor sit amet/);
    });
  });

  // ─── Sentences Mode ──────────────────────────────────────────────────────

  describe('sentences mode', () => {
    it('should generate the specified number of sentences', async () => {
      const input = JSON.stringify({
        mode: 'sentences',
        count: 5,
        startWithLorem: false,
        includeHtml: false,
      });
      const result = await generateLoremIpsumText(input);
      // Sentences end with periods. Count the periods to verify count.
      const sentences = result.match(/\./g);
      expect(sentences).toHaveLength(5);
    });

    it('should generate a single sentence', async () => {
      const input = JSON.stringify({
        mode: 'sentences',
        count: 1,
        startWithLorem: false,
        includeHtml: false,
      });
      const result = await generateLoremIpsumText(input);
      expect(result).toBeTruthy();
      expect(result.endsWith('.')).toBe(true);
    });

    it('should start with Lorem ipsum sentence when startWithLorem is true', async () => {
      const input = JSON.stringify({
        mode: 'sentences',
        count: 3,
        startWithLorem: true,
        includeHtml: false,
      });
      const result = await generateLoremIpsumText(input);
      expect(result).toMatch(/^Lorem ipsum dolor sit amet, consectetur adipiscing elit\./);
    });

    it('should wrap sentences in <p> tags when includeHtml is true', async () => {
      const input = JSON.stringify({
        mode: 'sentences',
        count: 2,
        startWithLorem: false,
        includeHtml: true,
      });
      const result = await generateLoremIpsumText(input);
      expect(result).toMatch(/^<p>.*<\/p>$/s);
    });
  });

  // ─── Words Mode ──────────────────────────────────────────────────────────

  describe('words mode', () => {
    it('should generate the specified number of words', async () => {
      const input = JSON.stringify({
        mode: 'words',
        count: 10,
        startWithLorem: false,
        includeHtml: false,
      });
      const result = await generateLoremIpsumText(input);
      const words = result.split(/\s+/);
      expect(words).toHaveLength(10);
    });

    it('should generate a single word', async () => {
      const input = JSON.stringify({
        mode: 'words',
        count: 1,
        startWithLorem: false,
        includeHtml: false,
      });
      const result = await generateLoremIpsumText(input);
      expect(result.split(/\s+/)).toHaveLength(1);
    });

    it('should start with lorem words when startWithLorem is true', async () => {
      const input = JSON.stringify({
        mode: 'words',
        count: 5,
        startWithLorem: true,
        includeHtml: false,
      });
      const result = await generateLoremIpsumText(input);
      expect(result.toLowerCase()).toMatch(/^lorem ipsum dolor sit amet/);
    });

    it('should wrap words in <p> tags when includeHtml is true', async () => {
      const input = JSON.stringify({
        mode: 'words',
        count: 5,
        startWithLorem: false,
        includeHtml: true,
      });
      const result = await generateLoremIpsumText(input);
      expect(result).toMatch(/^<p>.*<\/p>$/);
    });
  });

  // ─── startWithLorem Option ────────────────────────────────────────────────

  describe('startWithLorem option', () => {
    it('should default startWithLorem to true when not specified', async () => {
      const input = JSON.stringify({ mode: 'paragraphs', count: 1 });
      const result = await generateLoremIpsumText(input);
      expect(result).toMatch(/^Lorem ipsum dolor sit amet/);
    });

    it('should NOT start with lorem when startWithLorem is false', async () => {
      const input = JSON.stringify({
        mode: 'paragraphs',
        count: 1,
        startWithLorem: false,
        includeHtml: false,
      });
      const result = await generateLoremIpsumText(input);
      // It should not necessarily start with Lorem (random, but first letter is capitalized)
      expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
    });
  });

  // ─── includeHtml Option ───────────────────────────────────────────────────

  describe('includeHtml option', () => {
    it('should default includeHtml to false when not specified', async () => {
      const input = JSON.stringify({ mode: 'paragraphs', count: 1, startWithLorem: false });
      const result = await generateLoremIpsumText(input);
      expect(result).not.toContain('<p>');
    });

    it('should wrap each paragraph in <p> tags for paragraphs mode', async () => {
      const input = JSON.stringify({
        mode: 'paragraphs',
        count: 3,
        startWithLorem: false,
        includeHtml: true,
      });
      const result = await generateLoremIpsumText(input);
      const openTags = result.match(/<p>/g);
      const closeTags = result.match(/<\/p>/g);
      expect(openTags).toHaveLength(3);
      expect(closeTags).toHaveLength(3);
    });
  });

  // ─── Edge Cases ──────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle large count of words', async () => {
      const input = JSON.stringify({
        mode: 'words',
        count: 100,
        startWithLorem: false,
        includeHtml: false,
      });
      const result = await generateLoremIpsumText(input);
      const words = result.split(/\s+/);
      expect(words).toHaveLength(100);
    });

    it('should handle large count of paragraphs', async () => {
      const input = JSON.stringify({
        mode: 'paragraphs',
        count: 50,
        startWithLorem: false,
        includeHtml: false,
      });
      const result = await generateLoremIpsumText(input);
      const paragraphs = result.split('\n\n');
      expect(paragraphs).toHaveLength(50);
    });

    it('should reject count of 0', async () => {
      const input = JSON.stringify({
        mode: 'words',
        count: 0,
        startWithLorem: false,
        includeHtml: false,
      });
      await expect(generateLoremIpsumText(input)).rejects.toThrow();
    });

    it('should reject negative count', async () => {
      const input = JSON.stringify({
        mode: 'words',
        count: -5,
        startWithLorem: false,
        includeHtml: false,
      });
      await expect(generateLoremIpsumText(input)).rejects.toThrow();
    });

    it('should reject non-integer count', async () => {
      const input = JSON.stringify({
        mode: 'words',
        count: 3.5,
        startWithLorem: false,
        includeHtml: false,
      });
      await expect(generateLoremIpsumText(input)).rejects.toThrow();
    });

    it('should reject invalid mode', async () => {
      const input = JSON.stringify({
        mode: 'invalid',
        count: 5,
        startWithLorem: false,
        includeHtml: false,
      });
      await expect(generateLoremIpsumText(input)).rejects.toThrow('Invalid mode');
    });

    it('should reject non-JSON input', async () => {
      await expect(generateLoremIpsumText('not json')).rejects.toThrow();
    });

    it('should reject count exceeding maximum for paragraphs', async () => {
      const input = JSON.stringify({
        mode: 'paragraphs',
        count: 101,
        startWithLorem: false,
        includeHtml: false,
      });
      await expect(generateLoremIpsumText(input)).rejects.toThrow('exceeds maximum');
    });

    it('should reject count exceeding maximum for sentences', async () => {
      const input = JSON.stringify({
        mode: 'sentences',
        count: 501,
        startWithLorem: false,
        includeHtml: false,
      });
      await expect(generateLoremIpsumText(input)).rejects.toThrow('exceeds maximum');
    });

    it('should reject count exceeding maximum for words', async () => {
      const input = JSON.stringify({
        mode: 'words',
        count: 5001,
        startWithLorem: false,
        includeHtml: false,
      });
      await expect(generateLoremIpsumText(input)).rejects.toThrow('exceeds maximum');
    });
  });

  // ─── Combined Options ────────────────────────────────────────────────────

  describe('combined options', () => {
    it('should handle startWithLorem + includeHtml for paragraphs', async () => {
      const input = JSON.stringify({
        mode: 'paragraphs',
        count: 2,
        startWithLorem: true,
        includeHtml: true,
      });
      const result = await generateLoremIpsumText(input);
      expect(result).toContain('<p>Lorem ipsum dolor sit amet');
      expect(result).toContain('</p>');
    });

    it('should handle startWithLorem + includeHtml for sentences', async () => {
      const input = JSON.stringify({
        mode: 'sentences',
        count: 3,
        startWithLorem: true,
        includeHtml: true,
      });
      const result = await generateLoremIpsumText(input);
      expect(result).toMatch(/^<p>Lorem ipsum dolor sit amet/);
      expect(result).toMatch(/<\/p>$/);
    });

    it('should handle startWithLorem + includeHtml for words', async () => {
      const input = JSON.stringify({
        mode: 'words',
        count: 10,
        startWithLorem: true,
        includeHtml: true,
      });
      const result = await generateLoremIpsumText(input);
      expect(result).toMatch(/^<p>Lorem ipsum/i);
      expect(result).toMatch(/<\/p>$/);
    });
  });
});
