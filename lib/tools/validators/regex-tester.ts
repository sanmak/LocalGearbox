/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Regex Tester - Test regular expressions against strings
 * Pure functions for regex testing logic
 */

import { validateInput } from '../shared';

const PATTERN_SIZE_LIMIT = 1 * 1024 * 1024; // 1MB
const TEST_STRING_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
const MAX_MATCH_COUNT = 10_000;

interface RegexMatch {
  fullMatch: string;
  index: number;
  length: number;
  groups: Record<string, string | undefined>;
  captureGroups: (string | undefined)[];
}

interface RegexTestInput {
  pattern: string;
  flags: string;
  testString: string;
}

interface RegexTestResult {
  valid: boolean;
  pattern: string;
  flags: string;
  error?: string;
  matchCount: number;
  matches: RegexMatch[];
  executionTimeMs: number;
}

/**
 * Sanitizes flags to only allow valid RegExp flags
 */
const sanitizeFlags = (flags: string): string => {
  const validFlags = new Set(['g', 'i', 'm', 's', 'u', 'v']);
  const seen = new Set<string>();
  let result = '';

  for (const char of flags) {
    if (validFlags.has(char) && !seen.has(char)) {
      seen.add(char);
      result += char;
    }
  }

  return result;
};

/**
 * Tests a regex pattern against a test string and returns match results
 */
export const testRegex = async (input: string): Promise<string> => {
  validateInput(input, TEST_STRING_SIZE_LIMIT);

  let parsed: RegexTestInput;

  try {
    parsed = JSON.parse(input) as RegexTestInput;
  } catch {
    throw new Error('Input must be a valid JSON object with pattern, flags, and testString fields');
  }

  const { pattern, flags: rawFlags, testString } = parsed;

  if (typeof pattern !== 'string') {
    throw new Error('pattern must be a string');
  }

  if (typeof rawFlags !== 'string') {
    throw new Error('flags must be a string');
  }

  if (typeof testString !== 'string') {
    throw new Error('testString must be a string');
  }

  if (pattern.length > PATTERN_SIZE_LIMIT) {
    throw new Error('Pattern exceeds maximum size limit of 1MB');
  }

  if (testString.length > TEST_STRING_SIZE_LIMIT) {
    throw new Error('Test string exceeds maximum size limit of 10MB');
  }

  if (pattern.length === 0) {
    const result: RegexTestResult = {
      valid: true,
      pattern: '',
      flags: sanitizeFlags(rawFlags),
      matchCount: 0,
      matches: [],
      executionTimeMs: 0,
    };
    return JSON.stringify(result, null, 2);
  }

  const flags = sanitizeFlags(rawFlags);

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (error) {
    const errorMessage =
      error instanceof SyntaxError ? error.message : 'Invalid regular expression';
    const result: RegexTestResult = {
      valid: false,
      pattern,
      flags,
      error: errorMessage,
      matchCount: 0,
      matches: [],
      executionTimeMs: 0,
    };
    return JSON.stringify(result, null, 2);
  }

  const startTime = performance.now();
  const matches: RegexMatch[] = [];

  if (flags.includes('g')) {
    let match: RegExpExecArray | null;
    let lastIndex = -1;

    while ((match = regex.exec(testString)) !== null) {
      if (matches.length >= MAX_MATCH_COUNT) {
        break;
      }

      // Prevent infinite loops on zero-length matches
      if (match.index === lastIndex) {
        regex.lastIndex = match.index + 1;
        if (regex.lastIndex > testString.length) {
          break;
        }
        lastIndex = match.index;
        continue;
      }
      lastIndex = match.index;

      const namedGroups: Record<string, string | undefined> = {};
      if (match.groups) {
        for (const [key, value] of Object.entries(match.groups)) {
          namedGroups[key] = value;
        }
      }

      const captureGroups: (string | undefined)[] = [];
      for (let i = 1; i < match.length; i++) {
        captureGroups.push(match[i]);
      }

      matches.push({
        fullMatch: match[0],
        index: match.index,
        length: match[0].length,
        groups: namedGroups,
        captureGroups,
      });
    }
  } else {
    const match = regex.exec(testString);
    if (match) {
      const namedGroups: Record<string, string | undefined> = {};
      if (match.groups) {
        for (const [key, value] of Object.entries(match.groups)) {
          namedGroups[key] = value;
        }
      }

      const captureGroups: (string | undefined)[] = [];
      for (let i = 1; i < match.length; i++) {
        captureGroups.push(match[i]);
      }

      matches.push({
        fullMatch: match[0],
        index: match.index,
        length: match[0].length,
        groups: namedGroups,
        captureGroups,
      });
    }
  }

  const endTime = performance.now();

  const result: RegexTestResult = {
    valid: true,
    pattern,
    flags,
    matchCount: matches.length,
    matches,
    executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
  };

  return JSON.stringify(result, null, 2);
};
