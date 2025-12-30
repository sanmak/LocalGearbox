/**
 * Format Auto-Detection for Data Diff Tool
 * Intelligently detects whether input is JSON, CSV, or plain text
 */

export type DetectedFormat = 'json' | 'csv' | 'text';

export interface FormatDetectionResult {
  format: DetectedFormat;
  confidence: number; // 0-1 score indicating detection confidence
  reason: string; // Human-readable explanation
}

/**
 * Auto-detect the format of input data
 * @param input - The input string to analyze
 * @returns Detection result with format, confidence, and reason
 */
export function detectFormat(input: string): FormatDetectionResult {
  if (!input || input.trim().length === 0) {
    return {
      format: 'text',
      confidence: 1.0,
      reason: 'Empty input defaults to text',
    };
  }

  const trimmed = input.trim();

  // Try JSON detection first (highest specificity)
  const jsonResult = detectJSON(trimmed);
  if (jsonResult.confidence >= 0.9) {
    return jsonResult;
  }

  // Try CSV detection (medium specificity)
  const csvResult = detectCSV(trimmed);
  if (csvResult.confidence >= 0.7) {
    return csvResult;
  }

  // If JSON had moderate confidence and CSV didn't, choose JSON
  if (jsonResult.confidence >= 0.5 && csvResult.confidence < 0.5) {
    return jsonResult;
  }

  // Default to text for everything else
  return {
    format: 'text',
    confidence: Math.max(0.3, 1.0 - Math.max(jsonResult.confidence, csvResult.confidence)),
    reason: 'No strong format indicators detected, treating as plain text',
  };
}

/**
 * Detect if input is valid JSON
 */
function detectJSON(input: string): FormatDetectionResult {
  // Quick structural checks
  const startsWithBrace = input.startsWith('{') || input.startsWith('[');
  const endsWithBrace = input.endsWith('}') || input.endsWith(']');

  if (!startsWithBrace || !endsWithBrace) {
    return {
      format: 'json',
      confidence: 0.0,
      reason: 'Does not have JSON structure (missing braces/brackets)',
    };
  }

  // Try parsing
  try {
    JSON.parse(input);
    return {
      format: 'json',
      confidence: 1.0,
      reason: 'Valid JSON structure detected',
    };
  } catch (error) {
    // Check if it looks like JSON but has syntax errors
    const hasJsonMarkers = input.includes('":') || input.includes('":{') || input.includes('":[');

    if (hasJsonMarkers) {
      return {
        format: 'json',
        confidence: 0.6,
        reason: 'Has JSON-like structure but contains syntax errors',
      };
    }

    return {
      format: 'json',
      confidence: 0.2,
      reason: 'Has braces but does not appear to be valid JSON',
    };
  }
}

/**
 * Detect if input is CSV format
 */
function detectCSV(input: string): FormatDetectionResult {
  const lines = input.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return {
      format: 'csv',
      confidence: 0.0,
      reason: 'No content to analyze',
    };
  }

  // Single line is unlikely to be CSV
  if (lines.length === 1) {
    return {
      format: 'csv',
      confidence: 0.1,
      reason: 'Only one line - unlikely to be CSV',
    };
  }

  // Analyze delimiter candidates
  const delimiters = [',', '\t', '|', ';'];
  let bestDelimiter = ',';
  let bestScore = 0;

  for (const delimiter of delimiters) {
    const score = analyzeDelimiterConsistency(lines, delimiter);
    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }

  // Check for CSV-specific patterns
  const firstLine = lines[0];
  const hasDelimiter = delimiters.some((d) => firstLine.includes(d));
  const hasQuotedFields = /[",'].*[",']/.test(input);
  const hasConsistentColumns = bestScore > 0.7;

  // Calculate confidence
  let confidence = 0;

  if (hasConsistentColumns) {
    confidence += 0.5;
  }

  if (hasDelimiter) {
    confidence += 0.2;
  }

  if (hasQuotedFields) {
    confidence += 0.1;
  }

  // Bonus: if first line looks like headers (lowercase, no spaces in some fields)
  const looksLikeHeaders = firstLine
    .split(bestDelimiter)
    .some((field) => /^[a-z_][a-z0-9_]*$/i.test(field.trim().replace(/['"]/g, '')));

  if (looksLikeHeaders) {
    confidence += 0.2;
  }

  // Penalty: if lines are very inconsistent
  if (bestScore < 0.3) {
    confidence *= 0.5;
  }

  const delimiterName =
    bestDelimiter === '\t' ? 'tab' : bestDelimiter === ',' ? 'comma' : bestDelimiter;

  if (confidence >= 0.7) {
    return {
      format: 'csv',
      confidence: Math.min(confidence, 1.0),
      reason: `Detected ${delimiterName}-delimited CSV with consistent column structure`,
    };
  } else if (confidence >= 0.5) {
    return {
      format: 'csv',
      confidence,
      reason: `Possibly ${delimiterName}-delimited CSV but structure is inconsistent`,
    };
  } else {
    return {
      format: 'csv',
      confidence,
      reason: 'Does not appear to be CSV format',
    };
  }
}

/**
 * Analyze how consistently a delimiter appears across lines
 * Returns a score from 0 (not consistent) to 1 (perfectly consistent)
 */
function analyzeDelimiterConsistency(lines: string[], delimiter: string): number {
  if (lines.length < 2) return 0;

  // Count delimiter occurrences in each line
  const counts = lines.map((line) => {
    // Don't count delimiters inside quoted fields
    let count = 0;
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        count++;
      }
    }

    return count;
  });

  // Filter out lines with zero delimiters
  const nonZeroCounts = counts.filter((c) => c > 0);

  if (nonZeroCounts.length === 0) return 0;
  if (nonZeroCounts.length < lines.length * 0.5) return 0.2; // Less than half have delimiter

  // Calculate consistency (variance)
  const mean = nonZeroCounts.reduce((sum, c) => sum + c, 0) / nonZeroCounts.length;
  const variance =
    nonZeroCounts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / nonZeroCounts.length;

  // Perfect consistency: variance = 0, score = 1
  // High variance: score approaches 0
  const consistencyScore = Math.max(0, 1 - variance / (mean + 1));

  // Boost score if all lines have the same count
  const allSame = nonZeroCounts.every((c) => c === nonZeroCounts[0]);
  if (allSame && nonZeroCounts.length === lines.length) {
    return 1.0;
  }

  // Boost if most lines have the same count
  const mode = findMode(nonZeroCounts);
  const modeFrequency = nonZeroCounts.filter((c) => c === mode).length / nonZeroCounts.length;

  return consistencyScore * 0.7 + modeFrequency * 0.3;
}

/**
 * Find the most common value in an array
 */
function findMode(arr: number[]): number {
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode = arr[0];

  for (const num of arr) {
    frequency[num] = (frequency[num] || 0) + 1;
    if (frequency[num] > maxFreq) {
      maxFreq = frequency[num];
      mode = num;
    }
  }

  return mode;
}

/**
 * Detect format from both left and right inputs
 * Returns the most confident detection, with preference for consistency
 */
export function detectFormatFromPair(
  left: string,
  right: string,
): FormatDetectionResult & { leftFormat: DetectedFormat; rightFormat: DetectedFormat } {
  const leftResult = detectFormat(left);
  const rightResult = detectFormat(right);

  // If both agree and confidence is high, return that format
  if (leftResult.format === rightResult.format && leftResult.confidence >= 0.7) {
    return {
      ...leftResult,
      leftFormat: leftResult.format,
      rightFormat: rightResult.format,
      confidence: Math.min(leftResult.confidence, rightResult.confidence),
      reason: `Both inputs detected as ${leftResult.format}`,
    };
  }

  // If one has very high confidence and the other is uncertain, use the confident one
  if (leftResult.confidence >= 0.9 && rightResult.confidence < 0.5) {
    return {
      ...leftResult,
      leftFormat: leftResult.format,
      rightFormat: rightResult.format,
      reason: `Left input strongly suggests ${leftResult.format}`,
    };
  }

  if (rightResult.confidence >= 0.9 && leftResult.confidence < 0.5) {
    return {
      ...rightResult,
      leftFormat: leftResult.format,
      rightFormat: rightResult.format,
      reason: `Right input strongly suggests ${rightResult.format}`,
    };
  }

  // If they disagree but both are confident, prefer JSON > CSV > Text
  if (leftResult.confidence >= 0.7 && rightResult.confidence >= 0.7) {
    const formatPriority = { json: 3, csv: 2, text: 1 };
    const winner =
      formatPriority[leftResult.format] >= formatPriority[rightResult.format]
        ? leftResult
        : rightResult;

    return {
      ...winner,
      leftFormat: leftResult.format,
      rightFormat: rightResult.format,
      confidence: 0.6, // Lower confidence due to disagreement
      reason: `Inputs have different formats, using ${winner.format} based on priority`,
    };
  }

  // Default: use the one with higher confidence
  const winner = leftResult.confidence >= rightResult.confidence ? leftResult : rightResult;
  return {
    ...winner,
    leftFormat: leftResult.format,
    rightFormat: rightResult.format,
    reason: `Using ${winner.format} based on higher confidence (${Math.round(winner.confidence * 100)}%)`,
  };
}
