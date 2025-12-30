/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Crypto - Hash generators and cryptographic utilities
 * Pure cryptographic functions (MD5, SHA256, SHA512)
 */

import { createHash } from 'crypto';

/**
 * Generates MD5 hash
 */
export const generateMD5 = async (input: string): Promise<string> => {
  // Allow empty input for production use cases
  return createHash('md5').update(input, 'utf8').digest('hex');
};

/**
 * Generates SHA-256 hash
 */
export const generateSHA256 = async (input: string): Promise<string> => {
  // Allow empty input for production use cases
  return createHash('sha256').update(input, 'utf8').digest('hex');
};

/**
 * Generates SHA-512 hash
 */
export const generateSHA512 = async (input: string): Promise<string> => {
  // Allow empty input for production use cases
  return createHash('sha512').update(input, 'utf8').digest('hex');
};

/**
 * Decodes JWT token (header and payload only, no signature verification)
 */
export const decodeJWT = async (input: string): Promise<string> => {
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }

  const parts = input.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format. Expected 3 parts separated by dots.');
  }

  const addPadding = (str: string): string => {
    // Add Base64 padding if missing
    const padding = 4 - (str.length % 4);
    return padding < 4 ? str + '='.repeat(padding) : str;
  };

  try {
    const header = JSON.parse(Buffer.from(addPadding(parts[0]), 'base64').toString('utf8'));
    const payload = JSON.parse(Buffer.from(addPadding(parts[1]), 'base64').toString('utf8'));

    return JSON.stringify(
      {
        header,
        payload,
        signature: parts[2],
        note: 'Signature not verified - decode only',
      },
      null,
      2,
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to decode JWT: ${error.message}`);
    }
    throw new Error('Failed to decode JWT');
  }
};
