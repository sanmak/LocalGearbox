/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

// --- Rate-limit & Backoff Calculator ---

export type BackoffStrategy =
  | 'exponential'
  | 'exponential-jitter'
  | 'equal'
  | 'full-jitter'
  | 'decorrelated';

export type DistributionPattern = 'uniform' | 'bursty';

export interface RateLimitBackoffInput {
  requestsPerWindow: number; // allowed requests per window
  windowSeconds: number; // window size in seconds
  retryType: BackoffStrategy;
  baseDelayMs: number; // base delay in ms
  maxRetries: number; // number of retries
  maxDelayMs?: number; // optional max delay cap
  burstFactor?: number; // 1-10, higher = more bursty
  distribution?: DistributionPattern;
}

export interface RetryEvent {
  attempt: number;
  delayMs: number;
  delayHuman: string;
  timestampMs: number;
  status: 'scheduled' | 'success' | 'fail';
}

export interface RateLimitBackoffOutput {
  retrySchedule: number[]; // ms between each retry
  retryScheduleHuman: string[]; // human readable
  retryEvents: RetryEvent[];
  totalWaitMs: number;
  totalWaitHuman: string;
  budgetPerWindow: number;
  summary: {
    totalRequests: number;
    totalRetries: number;
    totalTimeMs: number;
    totalTimeHuman: string;
    burstFactor?: number;
    distribution?: DistributionPattern;
    strategy: BackoffStrategy;
  };
  chartData: { x: number[]; y: number[] };
  notes: string[];
}

function msToHuman(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(2)} s`;
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(2);
  return `${m}m ${sec}s`;
}

export async function calculateRateLimitBackoff(
  input: RateLimitBackoffInput,
): Promise<RateLimitBackoffOutput> {
  // Validate input
  if (!input || typeof input !== 'object') throw new Error('Input required');
  const {
    requestsPerWindow,
    windowSeconds,
    retryType,
    baseDelayMs,
    maxRetries,
    maxDelayMs,
    burstFactor = 1,
    distribution = 'uniform',
  } = input;
  if (!Number.isFinite(requestsPerWindow) || requestsPerWindow < 1)
    throw new Error('requestsPerWindow must be >= 1');
  if (!Number.isFinite(windowSeconds) || windowSeconds < 1)
    throw new Error('windowSeconds must be >= 1');
  if (!Number.isFinite(baseDelayMs) || baseDelayMs < 1) throw new Error('baseDelayMs must be >= 1');
  if (!Number.isFinite(maxRetries) || maxRetries < 1 || maxRetries > 20)
    throw new Error('maxRetries must be 1-20');
  if (maxDelayMs !== undefined && (!Number.isFinite(maxDelayMs) || maxDelayMs < 1))
    throw new Error('maxDelayMs must be >= 1');
  const validStrategies = [
    'exponential',
    'exponential-jitter',
    'equal',
    'full-jitter',
    'decorrelated',
  ];
  if (!validStrategies.includes(retryType))
    throw new Error(`retryType must be one of: ${validStrategies.join(', ')}`);
  if (burstFactor < 1 || burstFactor > 10) throw new Error('burstFactor must be 1-10');
  if (distribution !== 'uniform' && distribution !== 'bursty')
    throw new Error("distribution must be 'uniform' or 'bursty'");

  // Compute retry schedule
  const retrySchedule: number[] = [];
  const retryScheduleHuman: string[] = [];
  const retryEvents: RetryEvent[] = [];
  let totalWaitMs = 0;
  let notes: string[] = [];
  let lastTimestamp = 0;
  for (let i = 0; i < maxRetries; ++i) {
    let delay = 0;
    switch (retryType) {
      case 'exponential':
        delay = baseDelayMs * Math.pow(2, i);
        break;
      case 'exponential-jitter':
        delay = Math.floor(Math.random() * baseDelayMs * Math.pow(2, i));
        break;
      case 'equal':
        delay = baseDelayMs;
        break;
      case 'full-jitter':
        delay = Math.floor(Math.random() * baseDelayMs);
        break;
      case 'decorrelated':
        delay = Math.min(
          maxDelayMs || baseDelayMs * Math.pow(2, i),
          Math.floor(Math.random() * (lastTimestamp === 0 ? baseDelayMs : lastTimestamp * 3)),
        );
        break;
    }
    if (maxDelayMs !== undefined) delay = Math.min(delay, maxDelayMs);
    // Burstiness: if bursty, randomly reduce some delays
    if (distribution === 'bursty' && burstFactor > 1) {
      if (Math.random() < burstFactor / 10) {
        delay = Math.floor(delay * (0.3 + 0.2 * Math.random()));
      }
    }
    retrySchedule.push(delay);
    retryScheduleHuman.push(msToHuman(delay));
    lastTimestamp += delay;
    retryEvents.push({
      attempt: i + 1,
      delayMs: delay,
      delayHuman: msToHuman(delay),
      timestampMs: lastTimestamp,
      status: 'scheduled',
    });
    totalWaitMs += delay;
  }
  // Budget per window is just requestsPerWindow
  const budgetPerWindow = requestsPerWindow;
  notes.push(`Retry type: ${retryType}`);
  notes.push(`Base delay: ${baseDelayMs} ms`);
  notes.push(`Max retries: ${maxRetries}`);
  notes.push(`Window: ${windowSeconds} seconds (${(windowSeconds / 60).toFixed(2)} min)`);
  if (maxDelayMs !== undefined) notes.push(`Max delay cap: ${maxDelayMs} ms`);
  if (burstFactor !== undefined) notes.push(`Burst factor: ${burstFactor}`);
  if (distribution) notes.push(`Distribution: ${distribution}`);

  // Chart data: x = attempt, y = timestampMs
  const chartData = {
    x: retryEvents.map((e) => e.attempt),
    y: retryEvents.map((e) => e.timestampMs),
  };

  return {
    retrySchedule,
    retryScheduleHuman,
    retryEvents,
    totalWaitMs,
    totalWaitHuman: msToHuman(totalWaitMs),
    budgetPerWindow,
    summary: {
      totalRequests: 1 + maxRetries,
      totalRetries: maxRetries,
      totalTimeMs: totalWaitMs,
      totalTimeHuman: msToHuman(totalWaitMs),
      burstFactor,
      distribution,
      strategy: retryType,
    },
    chartData,
    notes,
  };
}
// SQL Tools: Formatter, Linter, EXPLAIN Parser
// All processors must be pure, dependency-free, and safe.

// --- SQL Formatter ---
export async function formatSQL(input: { sql: string }): Promise<{ formatted: string }> {
  // Simple indentation logic (expand for production use)
  const sql = input.sql.trim();
  if (!sql) throw new Error('Input SQL is empty.');
  if (sql.length > 1_000_000) throw new Error('SQL input too large (max 1MB).');
  // Basic formatting: split by semicolon, indent keywords
  const keywords = [
    'SELECT',
    'FROM',
    'WHERE',
    'GROUP BY',
    'ORDER BY',
    'INSERT',
    'UPDATE',
    'DELETE',
    'LEFT JOIN',
    'RIGHT JOIN',
    'INNER JOIN',
    'OUTER JOIN',
    'JOIN',
    'ON',
    'VALUES',
    'SET',
    'LIMIT',
    'OFFSET',
    'HAVING',
  ];

  let formatted = sql.replace(/\s*;\s*/g, ';\n');
  const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
  formatted = formatted.replace(keywordRegex, (match) => '\n' + match.toUpperCase());
  formatted = formatted.replace(/\n{2,}/g, '\n').trim();
  return { formatted };
}
// --- SQL Linter ---
export async function lintSQL(input: {
  sql: string;
}): Promise<{ issues: Array<{ line: number; message: string }> }> {
  const sql = input.sql;
  if (!sql) throw new Error('Input SQL is empty.');
  if (sql.length > 1_000_000) throw new Error('SQL input too large (max 1MB).');
  const issues: Array<{ line: number; message: string }> = [];
  const lines = sql.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (/select \*/i.test(line)) {
      issues.push({
        line: idx + 1,
        message: 'Avoid SELECT *; specify columns explicitly.',
      });
    }
    if (/--/.test(line) && !/^\s*--/.test(line)) {
      issues.push({
        line: idx + 1,
        message: 'Inline comments should start at line beginning.',
      });
    }
    if (/;\s*;/.test(line)) {
      issues.push({ line: idx + 1, message: 'Multiple semicolons detected.' });
    }
  });
  return { issues };
}

// --- SQL EXPLAIN Parser ---
export async function parseSQLExplain(input: { explain: string }): Promise<{ parsed: object }> {
  const explain = input.explain.trim();
  if (!explain) throw new Error('Input EXPLAIN is empty.');
  if (explain.length > 1_000_000) throw new Error('EXPLAIN input too large (max 1MB).');
  // Parse tabular EXPLAIN output (Postgres/MySQL style)
  const lines = explain.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('EXPLAIN output too short.');
  const headers = lines[0].split(/\s*\|\s*/).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(/\s*\|\s*/).map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] || '';
    });
    return row;
  });
  return { parsed: { headers, rows } };
}
