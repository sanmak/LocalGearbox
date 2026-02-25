/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { generateMD5, generateSHA256, generateSHA512, decodeJWT } from '@/lib/tools/crypto';

describe('generateMD5', () => {
  it('should generate correct MD5 hash for "hello"', async () => {
    const result = await generateMD5('hello');
    expect(result).toBe('5d41402abc4b2a76b9719d911017c592');
  });

  it('should generate correct MD5 hash for empty string', async () => {
    const result = await generateMD5('');
    expect(result).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('should return lowercase hex string', async () => {
    const result = await generateMD5('test');
    expect(result).toMatch(/^[0-9a-f]{32}$/);
  });

  it('should generate consistent output for same input', async () => {
    const result1 = await generateMD5('deterministic');
    const result2 = await generateMD5('deterministic');
    expect(result1).toBe(result2);
  });

  it('should generate different hashes for different inputs', async () => {
    const hash1 = await generateMD5('input1');
    const hash2 = await generateMD5('input2');
    expect(hash1).not.toBe(hash2);
  });

  it('should handle unicode input', async () => {
    const result = await generateMD5('caf\u00e9');
    expect(result).toMatch(/^[0-9a-f]{32}$/);
  });

  it('should handle multi-line input', async () => {
    const result = await generateMD5('line1\nline2\nline3');
    expect(result).toMatch(/^[0-9a-f]{32}$/);
  });

  it('should handle special characters', async () => {
    const result = await generateMD5('<script>alert("xss")</script>');
    expect(result).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe('generateSHA256', () => {
  it('should generate correct SHA-256 hash for "hello"', async () => {
    const result = await generateSHA256('hello');
    expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('should generate correct SHA-256 hash for empty string', async () => {
    const result = await generateSHA256('');
    expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('should return 64 character hex string', async () => {
    const result = await generateSHA256('test');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should generate consistent output', async () => {
    const r1 = await generateSHA256('abc');
    const r2 = await generateSHA256('abc');
    expect(r1).toBe(r2);
  });

  it('should generate different hashes for different inputs', async () => {
    const h1 = await generateSHA256('a');
    const h2 = await generateSHA256('b');
    expect(h1).not.toBe(h2);
  });

  it('should handle long input', async () => {
    const longInput = 'a'.repeat(10000);
    const result = await generateSHA256(longInput);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('generateSHA512', () => {
  it('should generate correct SHA-512 hash for "hello"', async () => {
    const result = await generateSHA512('hello');
    expect(result).toBe(
      '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043',
    );
  });

  it('should generate correct SHA-512 hash for empty string', async () => {
    const result = await generateSHA512('');
    expect(result).toBe(
      'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
    );
  });

  it('should return 128 character hex string', async () => {
    const result = await generateSHA512('test');
    expect(result).toMatch(/^[0-9a-f]{128}$/);
  });

  it('should generate consistent output', async () => {
    const r1 = await generateSHA512('consistency');
    const r2 = await generateSHA512('consistency');
    expect(r1).toBe(r2);
  });

  it('should handle unicode input', async () => {
    const result = await generateSHA512('\u00e9\u00e8\u00ea');
    expect(result).toMatch(/^[0-9a-f]{128}$/);
  });
});

describe('decodeJWT', () => {
  // A known JWT token for testing (header.payload.signature)
  // Header: {"alg":"HS256","typ":"JWT"}
  // Payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
  const validJWT =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  it('should decode a valid JWT token', async () => {
    const result = await decodeJWT(validJWT);
    const parsed = JSON.parse(result);
    expect(parsed.header.alg).toBe('HS256');
    expect(parsed.header.typ).toBe('JWT');
    expect(parsed.payload.sub).toBe('1234567890');
    expect(parsed.payload.name).toBe('John Doe');
    expect(parsed.payload.iat).toBe(1516239022);
  });

  it('should include a note about signature not being verified', async () => {
    const result = await decodeJWT(validJWT);
    const parsed = JSON.parse(result);
    expect(parsed.note).toContain('Signature not verified');
  });

  it('should include the signature part', async () => {
    const result = await decodeJWT(validJWT);
    const parsed = JSON.parse(result);
    expect(parsed.signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
  });

  it('should throw on empty input', async () => {
    await expect(decodeJWT('')).rejects.toThrow('Input cannot be empty');
  });

  it('should throw on whitespace-only input', async () => {
    await expect(decodeJWT('   ')).rejects.toThrow('Input cannot be empty');
  });

  it('should throw on JWT with wrong number of parts (2 parts)', async () => {
    await expect(decodeJWT('part1.part2')).rejects.toThrow('Invalid JWT format');
  });

  it('should throw on JWT with wrong number of parts (4 parts)', async () => {
    await expect(decodeJWT('part1.part2.part3.part4')).rejects.toThrow('Invalid JWT format');
  });

  it('should throw on JWT with invalid Base64 header', async () => {
    await expect(decodeJWT('!!!.eyJ0ZXN0IjoxfQ.signature')).rejects.toThrow('Failed to decode JWT');
  });

  it('should throw on JWT with no parts', async () => {
    await expect(decodeJWT('nodots')).rejects.toThrow('Invalid JWT format');
  });
});
