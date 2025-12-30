/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Advanced Log Parser Playground
 * Parse, analyze, and detect anomalies in structured logs
 * Features: Multi-format parsing, statistical analysis, anomaly detection, correlation analysis
 */

import { validateInput, TEXT_SIZE_LIMIT } from '../shared';

/**
 * Supported log formats with enhanced patterns
 */
type LogFormat = keyof typeof LOG_PATTERNS;

/**
 * Enhanced log format patterns with anomaly detection fields
 */
const LOG_PATTERNS = {
  nginx: {
    name: 'NGINX Access Log',
    pattern: /^(\S+) - (\S+) \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+) (\d+) "([^"]*)" "([^"]*)"$/,
    fields: [
      'ip',
      'ident',
      'timestamp',
      'method',
      'path',
      'protocol',
      'status',
      'bytes',
      'referer',
      'user_agent',
    ],
    anomalyFields: {
      status: { type: 'http_status', critical: [500, 502, 503, 504] },
      bytes: { type: 'size', unit: 'bytes' },
      ip: { type: 'ip_address' },
    },
    example: `192.168.1.100 - - [10/Dec/2023:10:15:32 +0000] "GET /api/users HTTP/1.1" 200 1024 "-" "Mozilla/5.0"`,
  },
  apache: {
    name: 'Apache Access Log',
    pattern: /^(\S+) (\S+) (\S+) \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+) (\d+) "([^"]*)" "([^"]*)"$/,
    fields: [
      'ip',
      'ident',
      'user',
      'timestamp',
      'method',
      'path',
      'protocol',
      'status',
      'bytes',
      'referer',
      'user_agent',
    ],
    anomalyFields: {
      status: { type: 'http_status', critical: [500, 502, 503, 504] },
      bytes: { type: 'size', unit: 'bytes' },
      ip: { type: 'ip_address' },
    },
    example: `192.168.1.100 - john [10/Dec/2023:10:15:32 +0000] "GET /api/users HTTP/1.1" 200 1024 "-" "Mozilla/5.0"`,
  },
  json: {
    name: 'JSON Log',
    pattern: null, // JSON parsing
    fields: [
      'timestamp',
      'level',
      'message',
      'service',
      'request_id',
      'user_id',
      'duration',
      'status',
      'error',
      'stack_trace',
    ],
    anomalyFields: {
      level: { type: 'log_level', critical: ['ERROR', 'FATAL', 'CRITICAL'] },
      duration: {
        type: 'duration',
        unit: 'ms',
        thresholds: { warning: 1000, critical: 5000 },
      },
      status: { type: 'http_status', critical: [500, 502, 503, 504] },
    },
    example: `{"timestamp":"2023-12-10T10:15:32Z","level":"INFO","message":"User login successful","service":"auth","request_id":"req-123","user_id":"user-456","duration":150,"status":200}`,
  },
  syslog: {
    name: 'Syslog',
    pattern: /^<(\d+)>(\w{3})\s+(\d+)\s+(\d+):(\d+):(\d+)\s+(\S+)\s+(.+)$/,
    fields: ['priority', 'month', 'day', 'hour', 'minute', 'second', 'hostname', 'message'],
    anomalyFields: {
      priority: { type: 'syslog_priority', critical: [0, 1, 2, 3] }, // Emergency to Error
    },
    example: `<30>Dec 10 10:15:32 web-server User login: user123`,
  },
  custom: {
    name: 'Custom Regex',
    pattern: null,
    fields: [],
    anomalyFields: {},
    example: '',
  },
};

/**
 * Anomaly detection types
 */
interface AnomalyConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  timeWindow: number; // minutes
  minSamples: number;
}

/**
 * Statistical analysis result
 */
interface StatResult {
  field: string;
  count: number;
  unique: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  percentiles: { [key: string]: number };
  distribution: { [key: string]: number };
}

/**
 * Anomaly detection result
 */
interface AnomalyResult {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  field: string;
  value: any;
  expected?: any;
  confidence: number;
  description: string;
  lineNumber: number;
  timestamp?: string;
}

/**
 * Correlation analysis result
 */
interface CorrelationResult {
  type: 'request_flow' | 'error_chain' | 'user_session' | 'time_spike';
  events: any[];
  pattern: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
}

/**
 * Parse timestamp from various formats
 */
function parseTimestamp(ts: string): Date | null {
  if (!ts) return null;

  // ISO 8601
  const isoMatch = ts.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)$/);
  if (isoMatch) {
    return new Date(isoMatch[1]);
  }

  // Apache/NGINX format: [10/Dec/2023:10:15:32 +0000]
  const apacheMatch = ts.match(
    /\[(\d{1,2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s+([+-]\d{4})\]/,
  );
  if (apacheMatch) {
    const [, day, month, year, hour, minute, second] = apacheMatch;
    const monthNames = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const monthNum = monthNames[month as keyof typeof monthNames];
    if (monthNum !== undefined) {
      return new Date(
        Date.UTC(
          parseInt(year),
          monthNum,
          parseInt(day),
          parseInt(hour),
          parseInt(minute),
          parseInt(second),
        ),
      );
    }
  }

  // Syslog format: Dec 10 10:15:32
  const syslogMatch = ts.match(/^(\w{3})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (syslogMatch) {
    const [, month, day, hour, minute, second] = syslogMatch;
    const monthNames = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const monthNum = monthNames[month as keyof typeof monthNames];
    if (monthNum !== undefined) {
      const now = new Date();
      return new Date(
        now.getFullYear(),
        monthNum,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second),
      );
    }
  }

  return null;
}

/**
 * Calculate statistical metrics
 */
function calculateStats(values: number[]): StatResult['percentiles'] & {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
} {
  if (values.length === 0)
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      p95: 0,
      p99: 0,
    };

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];

  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const p25 = sorted[Math.floor(sorted.length * 0.25)];
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p75 = sorted[Math.floor(sorted.length * 0.75)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  return { min, max, mean, median, stdDev, p25, p50, p75, p95, p99 };
}

/**
 * Detect anomalies in log entries
 */
function detectAnomalies(
  entries: any[],
  config: AnomalyConfig,
  format: LogFormat,
): AnomalyResult[] {
  if (!config.enabled || entries.length < config.minSamples) return [];

  const anomalies: AnomalyResult[] = [];
  const pattern = LOG_PATTERNS[format];
  if (!pattern?.anomalyFields) return anomalies;

  // Group entries by time windows for temporal analysis
  const timeWindows: { [key: string]: any[] } = {};
  entries.forEach((entry) => {
    const ts = parseTimestamp(entry.timestamp || entry._timestamp);
    if (ts) {
      const windowKey = Math.floor(ts.getTime() / (config.timeWindow * 60 * 1000));
      if (!timeWindows[windowKey]) timeWindows[windowKey] = [];
      timeWindows[windowKey].push(entry);
    }
  });

  // Analyze each anomaly field
  Object.entries(pattern.anomalyFields).forEach(([field, fieldConfig]) => {
    const values = entries.map((e) => e[field]).filter((v) => v !== undefined && v !== null);

    if (values.length < config.minSamples) return;

    switch (fieldConfig.type) {
      case 'http_status': {
        const statusCounts: { [key: number]: number } = {};
        values.forEach((v) => {
          const status = parseInt(String(v));
          if (!isNaN(status)) statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        // Check for critical status codes if defined
        if (Array.isArray((fieldConfig as any).critical)) {
          ((fieldConfig as any).critical as number[]).forEach((criticalStatus) => {
            if (statusCounts[criticalStatus] > 0) {
              const percentage = (statusCounts[criticalStatus] / values.length) * 100;
              if (percentage > 5) {
                // More than 5% critical errors
                anomalies.push({
                  type: 'high_error_rate',
                  severity: 'high',
                  field,
                  value: criticalStatus,
                  confidence: Math.min(percentage / 10, 1),
                  description: `${percentage.toFixed(
                    1,
                  )}% of requests returned ${criticalStatus} status`,
                  lineNumber:
                    entries.find((e) => parseInt(String(e[field])) === criticalStatus)
                      ?._lineNumber || 0,
                });
              }
            }
          });
        }
        break;
      }

      case 'log_level':
        const levelCounts: { [key: string]: number } = {};
        values.forEach((v) => (levelCounts[String(v)] = (levelCounts[String(v)] || 0) + 1));

        if (Array.isArray((fieldConfig as any).critical)) {
          ((fieldConfig as any).critical as string[]).forEach((criticalLevel) => {
            if (levelCounts[criticalLevel] > 0) {
              const percentage = (levelCounts[criticalLevel] / values.length) * 100;
              if (percentage > 10) {
                anomalies.push({
                  type: 'high_error_logs',
                  severity: 'medium',
                  field,
                  value: criticalLevel,
                  confidence: Math.min(percentage / 20, 1),
                  description: `${percentage.toFixed(1)}% of logs are ${criticalLevel} level`,
                  lineNumber:
                    entries.find((e) => String(e[field]) === criticalLevel)?._lineNumber || 0,
                });
              }
            }
          });
        }
        break;

      case 'duration':
        const durations = values.map((v) => parseFloat(String(v))).filter((v) => !isNaN(v));
        if (durations.length > 0) {
          const stats = calculateStats(durations);
          let threshold = stats.p95 * 2;
          entries.forEach((entry) => {
            const duration = parseFloat(String(entry[field]));
            if (!isNaN(duration) && duration > threshold) {
              anomalies.push({
                type: 'slow_response',
                severity: 'medium',
                field,
                value: duration,
                expected: stats.p95,
                confidence: Math.min(duration / (stats.p95 * 3), 1),
                description: `Response time ${duration}ms exceeds threshold ${threshold.toFixed(
                  0,
                )}ms`,
                lineNumber: entry._lineNumber,
                timestamp: entry.timestamp,
              });
            }
          });
        }
        break;

      case 'ip_address':
        const ipCounts: { [key: string]: number } = {};
        values.forEach((v) => (ipCounts[String(v)] = (ipCounts[String(v)] || 0) + 1));

        // Detect potential brute force or unusual traffic patterns
        Object.entries(ipCounts).forEach(([ip, count]) => {
          const percentage = (count / values.length) * 100;
          if (percentage > 30 && values.length > 10) {
            // One IP with >30% of traffic
            anomalies.push({
              type: 'high_traffic_ip',
              severity: 'low',
              field,
              value: ip,
              confidence: Math.min(percentage / 50, 1),
              description: `IP ${ip} accounts for ${percentage.toFixed(1)}% of traffic`,
              lineNumber: entries.find((e) => String(e[field]) === ip)?._lineNumber || 0,
            });
          }
        });
        break;
    }
  });

  // Time-based anomaly detection
  const windowSizes = Object.values(timeWindows).map((w) => w.length);
  if (windowSizes.length > 3) {
    const windowStats = calculateStats(windowSizes);
    const spikeThreshold = windowStats.p95 * 2;

    Object.entries(timeWindows).forEach(([, windowEntries]) => {
      if (windowEntries.length > spikeThreshold) {
        anomalies.push({
          type: 'traffic_spike',
          severity: 'medium',
          field: 'timestamp',
          value: windowEntries.length,
          expected: windowStats.p95,
          confidence: Math.min(windowEntries.length / (windowStats.p95 * 3), 1),
          description: `Traffic spike: ${windowEntries.length} requests in ${config.timeWindow}min window`,
          lineNumber: windowEntries[0]._lineNumber,
        });
      }
    });
  }

  return anomalies.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Analyze correlations between log entries
 */
function analyzeCorrelations(entries: any[]): CorrelationResult[] {
  const correlations: CorrelationResult[] = [];

  // Request flow correlation (same request_id)
  const requestGroups: { [key: string]: any[] } = {};
  entries.forEach((entry) => {
    const reqId = entry.request_id || entry.req_id || entry.requestId;
    if (reqId) {
      if (!requestGroups[reqId]) requestGroups[reqId] = [];
      requestGroups[reqId].push(entry);
    }
  });

  Object.entries(requestGroups).forEach(([reqId, reqEntries]) => {
    if (reqEntries.length > 1) {
      const hasError = reqEntries.some((e) => {
        const level = String(e.level || '').toUpperCase();
        const status = parseInt(String(e.status || 0));
        return level === 'ERROR' || (status >= 400 && status < 600);
      });

      if (hasError) {
        correlations.push({
          type: 'request_flow',
          events: reqEntries,
          pattern: `Request ${reqId} has ${reqEntries.length} related events including errors`,
          confidence: 0.9,
          impact: 'high',
        });
      }
    }
  });

  // Error chain correlation (sequential errors)
  const errorEntries = entries.filter((e) => {
    const level = String(e.level || '').toUpperCase();
    const status = parseInt(String(e.status || 0));
    return level === 'ERROR' || level === 'FATAL' || (status >= 500 && status < 600);
  });

  if (errorEntries.length > 2) {
    // Group errors by time proximity (within 5 minutes)
    const errorChains: any[][] = [];
    let currentChain: any[] = [errorEntries[0]];

    for (let i = 1; i < errorEntries.length; i++) {
      const prevTime = parseTimestamp(errorEntries[i - 1].timestamp);
      const currTime = parseTimestamp(errorEntries[i].timestamp);

      if (prevTime && currTime) {
        const timeDiff = (currTime.getTime() - prevTime.getTime()) / (1000 * 60); // minutes
        if (timeDiff <= 5) {
          currentChain.push(errorEntries[i]);
        } else {
          if (currentChain.length > 1) errorChains.push(currentChain);
          currentChain = [errorEntries[i]];
        }
      }
    }
    if (currentChain.length > 1) errorChains.push(currentChain);

    errorChains.forEach((chain) => {
      correlations.push({
        type: 'error_chain',
        events: chain,
        pattern: `${chain.length} sequential errors within 5 minutes`,
        confidence: Math.min(chain.length / 5, 1),
        impact: chain.length > 3 ? 'high' : 'medium',
      });
    });
  }

  return correlations;
}

/**
 * Parse a single log line using regex pattern
 */
function parseLogLine(line: string, pattern: RegExp, fields: string[]): any | null {
  const match = line.match(pattern);
  if (!match) return null;

  const result: any = {};
  fields.forEach((field, index) => {
    result[field] = match[index + 1] || '';
  });

  // Add parsed timestamp
  if (result.timestamp) {
    result._parsed_timestamp = parseTimestamp(result.timestamp);
  }

  return result;
}

/**
 * Parse JSON log line with enhanced field extraction
 */
function parseJsonLogLine(line: string): any | null {
  try {
    const parsed = JSON.parse(line);

    // Normalize common field names
    if (parsed.time && !parsed.timestamp) parsed.timestamp = parsed.time;
    if (parsed.level && !parsed.level) parsed.level = parsed.level;
    if (parsed.msg && !parsed.message) parsed.message = parsed.msg;
    if (parsed.reqId && !parsed.request_id) parsed.request_id = parsed.reqId;
    if (parsed.userId && !parsed.user_id) parsed.userId = parsed.user_id;
    if (parsed.responseTime && !parsed.duration) parsed.duration = parsed.responseTime;
    if (parsed.statusCode && !parsed.status) parsed.status = parsed.statusCode;

    // Add parsed timestamp
    if (parsed.timestamp) {
      parsed._parsed_timestamp = parseTimestamp(parsed.timestamp);
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Apply filters to parsed log entries
 */
function applyFilters(entries: any[], filters: any[]): any[] {
  if (!filters || filters.length === 0) return entries;

  return entries.filter((entry) => {
    return filters.every((filter) => {
      const value = entry[filter.field];
      if (value === undefined) return false;

      switch (filter.operator) {
        case 'equals':
          return value === filter.value;
        case 'contains':
          return String(value).includes(filter.value);
        case 'regex':
          try {
            return new RegExp(filter.value).test(String(value));
          } catch {
            return false;
          }
        case 'gt':
          return Number(value) > Number(filter.value);
        case 'lt':
          return Number(value) < Number(filter.value);
        case 'gte':
          return Number(value) >= Number(filter.value);
        case 'lte':
          return Number(value) <= Number(filter.value);
        default:
          return true;
      }
    });
  });
}

/**
 * Extract unique values for a field
 */

/**
 * Generate statistical analysis for numeric fields
 */
function generateFieldStats(entries: any[]): { [field: string]: StatResult } {
  const stats: { [field: string]: StatResult } = {};

  if (entries.length === 0) return stats;

  // Get all fields from first entry
  const sampleEntry = entries[0];
  const fields = Object.keys(sampleEntry).filter((f) => !f.startsWith('_'));

  fields.forEach((field) => {
    const values = entries.map((e) => e[field]).filter((v) => v !== undefined && v !== null);
    const numericValues = values.map((v) => parseFloat(String(v))).filter((v) => !isNaN(v));

    if (values.length > 0) {
      stats[field] = {
        field,
        count: values.length,
        unique: new Set(values.map(String)).size,
        distribution: {},
        percentiles: { p25: 0, p50: 0, p75: 0, p95: 0, p99: 0 },
      };

      // Calculate distribution for categorical fields
      values.forEach((v) => {
        const key = String(v);
        stats[field].distribution[key] = (stats[field].distribution[key] || 0) + 1;
      });

      // Calculate numeric statistics
      if (numericValues.length > 0) {
        const numStats = calculateStats(numericValues);
        stats[field] = {
          ...stats[field],
          min: numStats.min,
          max: numStats.max,
          mean: numStats.mean,
          median: numStats.median,
          stdDev: numStats.stdDev,
          percentiles: {
            p25: numStats.p25,
            p50: numStats.p50,
            p75: numStats.p75,
            p95: numStats.p95,
            p99: numStats.p99,
          },
        };
      }
    }
  });

  return stats;
}

/**
 * Analyze time-based patterns in log entries
 */
function analyzeTimePatterns(entries: any[]): any {
  if (entries.length === 0) return null;

  const timestamps: Date[] = [];
  const timeBuckets: { [key: string]: number } = {};
  const hourlyStats: { [key: string]: number } = {};

  entries.forEach((entry) => {
    const ts = parseTimestamp(entry.timestamp || entry._timestamp);
    if (ts) {
      timestamps.push(ts);

      // 5-minute buckets for spike detection
      const bucket = Math.floor(ts.getTime() / (5 * 60 * 1000));
      timeBuckets[bucket] = (timeBuckets[bucket] || 0) + 1;

      // Hourly stats
      const hour = ts.getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    }
  });

  if (timestamps.length === 0) return null;

  const sortedTimestamps = timestamps.sort((a, b) => a.getTime() - b.getTime());
  const startTime = sortedTimestamps[0].toISOString();
  const endTime = sortedTimestamps[sortedTimestamps.length - 1].toISOString();
  const durationMs =
    sortedTimestamps[sortedTimestamps.length - 1].getTime() - sortedTimestamps[0].getTime();
  const duration =
    durationMs < 60000
      ? `${Math.round(durationMs / 1000)}s`
      : durationMs < 3600000
        ? `${Math.round(durationMs / 60000)}m`
        : `${Math.round(durationMs / 3600000)}h`;

  // Detect spikes (buckets with significantly higher activity)
  const bucketValues = Object.values(timeBuckets);
  const avgActivity = bucketValues.reduce((a, b) => a + b, 0) / bucketValues.length;
  const stdDev = Math.sqrt(
    bucketValues.reduce((acc, val) => acc + Math.pow(val - avgActivity, 2), 0) /
      bucketValues.length,
  );
  const spikeThreshold = avgActivity + stdDev * 2;

  const spikes = Object.entries(timeBuckets)
    .filter(([, count]) => count > spikeThreshold)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([bucket, count]) => {
      const bucketTime = new Date(parseInt(bucket) * 5 * 60 * 1000);
      return {
        time: bucketTime.toISOString().slice(11, 16), // HH:MM format
        count,
        percentage: ((count / entries.length) * 100).toFixed(1),
      };
    });

  // Determine activity pattern
  const peakHours = Object.entries(hourlyStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  let pattern = 'Irregular activity';
  if (peakHours.length >= 2) {
    const isBusinessHours = peakHours.every((h) => h >= 9 && h <= 17);
    const isNightTime = peakHours.every((h) => h >= 22 || h <= 4);
    if (isBusinessHours) pattern = 'Business hours activity';
    else if (isNightTime) pattern = 'Night time activity';
    else pattern = 'Mixed activity pattern';
  }

  return {
    startTime,
    endTime,
    duration,
    pattern,
    spikes,
    totalEntries: entries.length,
    analyzedEntries: timestamps.length,
    timeRange: {
      min: Math.min(...bucketValues),
      max: Math.max(...bucketValues),
      avg: Math.round(avgActivity * 10) / 10,
    },
    hourlyDistribution: hourlyStats,
    peakHours: Object.entries(hourlyStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count })),
  };
}

/**
 * Main log parser processor with anomaly detection
 */
export async function processLogParser(input: string): Promise<string> {
  validateInput(input, TEXT_SIZE_LIMIT);

  try {
    // Parse input as JSON with configuration
    let config: any = {};
    let logText = input;

    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === 'object' && parsed.logs) {
        config = parsed.config || {};
        logText = parsed.logs;
      }
    } catch {
      // Input is plain log text, use defaults
    }

    const format = (config.format || 'nginx') as LogFormat;
    const customPattern = config.customPattern;
    const filters = config.filters || [];
    const maxLines = config.maxLines || 100;
    const anomalyConfig: AnomalyConfig = {
      enabled: config.anomalyDetection !== false,
      sensitivity: config.sensitivity || 'medium',
      timeWindow: config.timeWindow || 5, // 5 minutes
      minSamples: config.minSamples || 10,
    };

    if (!LOG_PATTERNS[format]) {
      return JSON.stringify(
        {
          error: `Unsupported log format: ${format}`,
          supportedFormats: Object.keys(LOG_PATTERNS),
        },
        null,
        2,
      );
    }

    const pattern = LOG_PATTERNS[format];
    const lines = logText.split('\n').slice(0, maxLines);
    const entries: any[] = [];
    const errors: string[] = [];

    // Parse each line
    lines.forEach((line, index) => {
      if (!line.trim()) return;

      let parsed: any = null;

      if (format === 'json') {
        parsed = parseJsonLogLine(line);
      } else if (format === 'custom' && customPattern) {
        try {
          const regex = new RegExp(customPattern);
          parsed = parseLogLine(line, regex, config.fields || []);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          errors.push(`Line ${index + 1}: Invalid regex pattern - ${errorMessage}`);
        }
      } else if (pattern.pattern) {
        parsed = parseLogLine(line, pattern.pattern, pattern.fields);
      }

      if (parsed) {
        parsed._original = line;
        parsed._lineNumber = index + 1;
        entries.push(parsed);
      } else {
        errors.push(`Line ${index + 1}: Failed to parse - ${line.substring(0, 100)}...`);
      }
    });

    // Apply filters
    const filteredEntries = applyFilters(entries, filters);

    // Generate comprehensive statistics
    const fieldStats = generateFieldStats(filteredEntries);

    // Detect anomalies
    const anomalies = detectAnomalies(filteredEntries, anomalyConfig, format);

    // Analyze correlations
    const correlations = analyzeCorrelations(filteredEntries);

    // Time-based analysis
    const timeAnalysis = analyzeTimePatterns(filteredEntries);

    return JSON.stringify(
      {
        summary: {
          totalLines: lines.length,
          parsedLines: entries.length,
          filteredLines: filteredEntries.length,
          errorLines: errors.length,
          format: format,
          fields: Object.keys(fieldStats),
          anomaliesDetected: anomalies.length,
          correlationsFound: correlations.length,
        },
        fieldStats,
        timeAnalysis,
        anomalies: anomalies.slice(0, 20), // Limit output
        correlations: correlations.slice(0, 10), // Limit output
        entries: filteredEntries.slice(0, 50), // Limit output
        errors: errors.slice(0, 10), // Limit errors
        config: {
          format,
          filters,
          maxLines,
          customPattern: customPattern || null,
          anomalyDetection: anomalyConfig,
        },
      },
      null,
      2,
    );
  } catch (error) {
    return JSON.stringify(
      {
        error: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      null,
      2,
    );
  }
}

/**
 * Get available log formats and examples
 */
export async function getLogFormats(): Promise<string> {
  const formats = Object.entries(LOG_PATTERNS).map(([key, pattern]) => ({
    id: key,
    name: pattern.name,
    fields: pattern.fields,
    example: pattern.example,
    supportsAnomalyDetection: Object.keys(pattern.anomalyFields || {}).length > 0,
  }));
  return JSON.stringify({ formats }, null, 2);
}
