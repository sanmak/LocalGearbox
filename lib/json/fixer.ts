/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * JSON Fixer
 * Repair common JSON errors
 */

import { FixResult, FixIssue } from './types';

/**
 * Fix common JSON errors
 */
export const fixJson = (input: string): FixResult => {
  const issues: FixIssue[] = [];
  let fixed = input;

  // Track original for comparison
  const original = input;

  // 1. Remove BOM
  if (fixed.charCodeAt(0) === 0xfeff) {
    fixed = fixed.slice(1);
    issues.push({
      type: 'bom',
      description: 'Removed BOM (Byte Order Mark)',
    });
  }

  // 2. Remove JavaScript-style comments
  const commentRegex = /\/\/.*$|\/\*[\s\S]*?\*\//gm;
  if (commentRegex.test(fixed)) {
    fixed = fixed.replace(commentRegex, '');
    issues.push({
      type: 'comments',
      description: 'Removed JavaScript-style comments',
    });
  }

  // 3. Replace single quotes with double quotes (for keys and string values)
  // This is complex because we need to avoid replacing inside strings
  const singleQuotePattern = /(?<![\\])'([^'\\]*(?:\\.[^'\\]*)*)'/g;
  if (singleQuotePattern.test(fixed)) {
    fixed = fixed.replace(singleQuotePattern, '"$1"');
    issues.push({
      type: 'quotes',
      description: 'Replaced single quotes with double quotes',
    });
  }

  // 4. Quote unquoted keys
  const unquotedKeyPattern = /(\s*[\[{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g;
  const beforeUnquoted = fixed;
  fixed = fixed.replace(unquotedKeyPattern, '$1"$2"$3');
  if (fixed !== beforeUnquoted) {
    issues.push({
      type: 'unquoted-keys',
      description: 'Added quotes to unquoted object keys',
    });
  }

  // 5. Remove trailing commas
  const trailingCommaPattern = /,(\s*[}\]])/g;
  if (trailingCommaPattern.test(fixed)) {
    fixed = fixed.replace(trailingCommaPattern, '$1');
    issues.push({
      type: 'trailing-comma',
      description: 'Removed trailing commas',
    });
  }

  // 6. Fix invalid literals
  const literalFixes: [RegExp, string, string][] = [
    [/\bTrue\b/g, 'true', 'True → true'],
    [/\bFalse\b/g, 'false', 'False → false'],
    [/\bNone\b/g, 'null', 'None → null'],
    [/\bundefined\b/g, 'null', 'undefined → null'],
    [/\bNaN\b/g, 'null', 'NaN → null'],
    [/\bInfinity\b/g, 'null', 'Infinity → null'],
    [/\b-Infinity\b/g, 'null', '-Infinity → null'],
  ];

  for (const [pattern, replacement, desc] of literalFixes) {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement);
      issues.push({
        type: 'literal',
        description: `Fixed invalid literal: ${desc}`,
      });
    }
  }

  // 7. Add missing closing brackets
  const openBraces = (fixed.match(/{/g) || []).length;
  const closeBraces = (fixed.match(/}/g) || []).length;
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/]/g) || []).length;

  if (openBraces > closeBraces) {
    const missing = openBraces - closeBraces;
    fixed = fixed + '}'.repeat(missing);
    issues.push({
      type: 'missing-brace',
      description: `Added ${missing} missing closing brace(s)`,
    });
  }

  if (openBrackets > closeBrackets) {
    const missing = openBrackets - closeBrackets;
    fixed = fixed + ']'.repeat(missing);
    issues.push({
      type: 'missing-bracket',
      description: `Added ${missing} missing closing bracket(s)`,
    });
  }

  // 8. Trim and validate
  fixed = fixed.trim();

  // Try to parse the fixed JSON
  let success = false;
  try {
    JSON.parse(fixed);
    success = true;
  } catch (e) {
    // If still invalid, try to provide more specific error
    if (e instanceof SyntaxError) {
      issues.push({
        type: 'parse-error',
        description: `Remaining parse error: ${e.message}`,
      });
    }
  }

  // If no changes were made
  if (fixed === original && issues.length === 0) {
    issues.push({
      type: 'no-issues',
      description: 'No issues found - JSON appears valid',
    });
    success = true;
  }

  return { fixed, issues, success };
};

/**
 * Get a description of what the fixer can repair
 */
export const getFixerCapabilities = (): string[] => {
  return [
    'Remove BOM (Byte Order Mark)',
    'Remove JavaScript-style comments (// and /* */)',
    'Replace single quotes with double quotes',
    'Add quotes to unquoted object keys',
    'Remove trailing commas',
    'Fix Python literals (True/False/None)',
    'Replace undefined, NaN, Infinity with null',
    'Add missing closing brackets/braces',
  ];
};

/**
 * Check if JSON needs fixing
 */
export const needsFix = (input: string): boolean => {
  try {
    JSON.parse(input);
    return false;
  } catch {
    return true;
  }
};
