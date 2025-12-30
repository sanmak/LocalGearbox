import { calculateRateLimitBackoff } from './processors';
/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Tool Registry
 * Centralized registry of all available tools
 * Drives routing, navigation, and tool discovery
 */

import { Tool, TOOL_CATEGORIES } from './types';

// Import from modular structure
import {
  // Formatters
  formatJSON,
  formatXML,
  formatHTML,
  beautifyCSS,
  // Validators
  validateJSON,
  validateXML,
  // Encoders
  processURL,
  encodeBase64,
  decodeBase64,
  escapeHTML,
  unescapeHTML,
  escapeXML,
  unescapeXML,
  escapeJSON,
  escapeCSV,
  // Crypto
  generateMD5,
  generateSHA256,
  generateSHA512,
  decodeJWT,
  // Generators
  generateUUID,
  epochToDate,
  dateToEpoch,
  // Text
  reverseString,
  stringToLines,
  removeWhitespace,
  textToUppercase,
  textToLowercase,
  titleCase,
  // Minifiers
  minifyJSON,
  minifyCSS,
  minifyJS,
  // Converters
  jsonToCSV,
  // Network
  executeApiRequest,
  dnsAnalysis,
  mxLookup,
  soaLookup,
  reverseDnsLookup,
  nameServerLookup,
  // Workbenches
  processContractWorkbench,
  processArchitectureDiagram,
  // Parsers
  processLogParser,
  // SQL Tools
  formatSQL,
  lintSQL,
  parseSQLExplain,
} from './tools';

export { TOOL_CATEGORIES } from './types';

export const TOOLS: Record<string, Tool> = {
  'rate-limit-backoff': {
    id: 'rate-limit-backoff',
    name: 'Rate-limit & Backoff Calculator',
    category: 'workbenches',
    description:
      'Compute retry schedules (exponential/jitter), budgets per window, and visualize backoff strategies.',
    inputSchema: {
      type: 'object',
      description: 'Rate-limit and backoff parameters',
      properties: {
        requestsPerWindow: {
          type: 'string',
          description: 'Allowed requests per window (integer)',
          required: true,
        },
        windowSeconds: {
          type: 'string',
          description: 'Window size in seconds (integer)',
          required: true,
        },
        retryType: {
          type: 'string',
          description:
            'Backoff strategy: exponential, exponential-jitter, equal, full-jitter, decorrelated',
          required: true,
        },
        baseDelayMs: {
          type: 'string',
          description: 'Base delay in ms (integer)',
          required: true,
        },
        maxRetries: {
          type: 'string',
          description: 'Number of retries (integer)',
          required: true,
        },
        maxDelayMs: {
          type: 'string',
          description: 'Optional max delay cap in ms (integer)',
          required: false,
        },
        burstFactor: {
          type: 'string',
          description: 'Burst factor (1-10, higher = more bursty)',
          required: false,
        },
        distribution: {
          type: 'string',
          description: 'Distribution pattern: uniform or bursty',
          required: false,
        },
      },
    },
    outputSchema: {
      type: 'object',
      description: 'Retry schedule, events, chart data, and summary stats.',
      properties: {
        retrySchedule: {
          type: 'array',
          description: 'Retry delays in ms',
          items: { type: 'string' },
        },
        retryScheduleHuman: {
          type: 'array',
          description: 'Retry delays (human readable)',
          items: { type: 'string' },
        },
        retryEvents: {
          type: 'array',
          description: 'Detailed retry events (attempt, delay, timestamp, status)',
          items: {
            type: 'object',
            properties: {
              attempt: { type: 'string' },
              delayMs: { type: 'string' },
              delayHuman: { type: 'string' },
              timestampMs: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
        totalWaitMs: { type: 'string', description: 'Total wait in ms' },
        totalWaitHuman: {
          type: 'string',
          description: 'Total wait (human readable)',
        },
        budgetPerWindow: { type: 'string', description: 'Budget per window' },
        summary: {
          type: 'object',
          description: 'Summary statistics',
          properties: {
            totalRequests: { type: 'string' },
            totalRetries: { type: 'string' },
            totalTimeMs: { type: 'string' },
            totalTimeHuman: { type: 'string' },
            burstFactor: { type: 'string' },
            distribution: { type: 'string' },
            strategy: { type: 'string' },
          },
        },
        chartData: {
          type: 'object',
          description: 'Chart data for plotting schedule (x: attempt, y: timestampMs)',
          properties: {
            x: { type: 'array', items: { type: 'string' } },
            y: { type: 'array', items: { type: 'string' } },
          },
        },
        notes: {
          type: 'array',
          description: 'Notes',
          items: { type: 'string' },
        },
      },
    },
    process: async (input: string) => {
      let parsed: any;
      try {
        parsed = JSON.parse(input);
      } catch (e) {
        throw new Error('Input must be a valid JSON object');
      }
      // Convert string fields to numbers where needed
      const {
        requestsPerWindow,
        windowSeconds,
        retryType,
        baseDelayMs,
        maxRetries,
        maxDelayMs,
        burstFactor,
        distribution,
      } = parsed;
      const params = {
        requestsPerWindow: Number(requestsPerWindow),
        windowSeconds: Number(windowSeconds),
        retryType,
        baseDelayMs: Number(baseDelayMs),
        maxRetries: Number(maxRetries),
        maxDelayMs: maxDelayMs !== undefined ? Number(maxDelayMs) : undefined,
        burstFactor: burstFactor !== undefined ? Number(burstFactor) : undefined,
        distribution,
      };
      const result = await calculateRateLimitBackoff(params);
      return JSON.stringify(result);
    },
  },
  'json-formatter': {
    id: 'json-formatter',
    name: 'JSON Formatter',
    category: 'formatters',
    description: 'Format and beautify JSON with proper indentation',
    inputSchema: {
      type: 'string',
      description: 'Raw JSON string to format',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Formatted JSON string',
    },
    process: formatJSON,
  },

  'json-validator': {
    id: 'json-validator',
    name: 'JSON Validator',
    category: 'validators',
    description: 'Validate JSON syntax and structure',
    inputSchema: {
      type: 'string',
      description: 'JSON string to validate',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'object',
      description: 'Validation result with status and error details',
      properties: {
        valid: { type: 'string' },
        message: { type: 'string' },
        error: { type: 'string' },
      },
    },
    process: validateJSON,
  },

  'xml-formatter': {
    id: 'xml-formatter',
    name: 'XML Formatter',
    category: 'formatters',
    description: 'Format and beautify XML with proper indentation',
    inputSchema: {
      type: 'string',
      description: 'Raw XML string to format',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Formatted XML string',
    },
    process: formatXML,
  },

  'xml-validator': {
    id: 'xml-validator',
    name: 'XML Validator',
    category: 'validators',
    description: 'Validate XML syntax and structure',
    inputSchema: {
      type: 'string',
      description: 'XML string to validate',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'object',
      description: 'Validation result with status',
      properties: {
        valid: { type: 'string' },
        message: { type: 'string' },
      },
    },
    process: validateXML,
  },

  'url-encoder-decoder': {
    id: 'url-encoder-decoder',
    name: 'URL Encoder/Decoder',
    category: 'encoders',
    description:
      'Auto-detect and encode/decode URL strings. Detects URL encoding and applies appropriate operation.',
    inputSchema: {
      type: 'string',
      description: 'String to encode or decode (auto-detected)',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'object',
      description: 'Operation result with input, output, and operation type',
    },
    process: processURL,
  },

  'base64-encoder': {
    id: 'base64-encoder',
    name: 'Base64 Encoder',
    category: 'encoders',
    description: 'Encode text to Base64 format',
    inputSchema: {
      type: 'string',
      description: 'Text to encode',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'Base64 encoded string',
    },
    process: encodeBase64,
  },

  // --- SQL Formatter ---
  'sql-formatter': {
    id: 'sql-formatter',
    name: 'SQL Formatter',
    category: 'formatters',
    description: 'Format and beautify SQL queries with proper indentation and style.',
    inputSchema: {
      type: 'string',
      description: 'Raw SQL string to format',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'Formatted SQL string',
    },
    process: async (input: string) => {
      const { formatted } = await formatSQL({ sql: input });
      return formatted;
    },
  },

  // --- SQL Linter ---
  'sql-linter': {
    id: 'sql-linter',
    name: 'SQL Linter',
    category: 'validators',
    description: 'Lint SQL queries for common issues and best practices.',
    inputSchema: {
      type: 'string',
      description: 'SQL string to lint',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'object',
      description: 'Linting result with issues array',
      properties: {
        issues: {
          type: 'array',
          description: 'List of lint issues',
          items: {
            type: 'object',
            properties: {
              line: { type: 'string', description: 'Line number as string' },
              message: { type: 'string', description: 'Issue message' },
            },
          },
        },
      },
    },
    process: async (input: string) => {
      const result = await lintSQL({ sql: input });
      return JSON.stringify(result);
    },
  },

  // --- SQL EXPLAIN Parser ---
  'sql-explain': {
    id: 'sql-explain',
    name: 'SQL EXPLAIN Parser',
    category: 'parsers',
    description: 'Parse and visualize SQL EXPLAIN output (Postgres/MySQL style).',
    inputSchema: {
      type: 'string',
      description: 'EXPLAIN output to parse',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'object',
      description: 'Parsed EXPLAIN result with headers and rows',
      properties: {
        parsed: { type: 'object', description: 'Parsed EXPLAIN data' },
      },
    },
    process: async (input: string) => {
      const result = await parseSQLExplain({ explain: input });
      return JSON.stringify(result);
    },
  },

  'base64-decoder': {
    id: 'base64-decoder',
    name: 'Base64 Decoder',
    category: 'encoders',
    description: 'Decode Base64 strings to text',
    inputSchema: {
      type: 'string',
      description: 'Base64 string to decode',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'Decoded text',
    },
    process: decodeBase64,
  },

  'html-formatter': {
    id: 'html-formatter',
    name: 'HTML Formatter',
    category: 'formatters',
    description: 'Format and beautify HTML with proper indentation',
    inputSchema: {
      type: 'string',
      description: 'Raw HTML to format',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Formatted HTML',
    },
    process: formatHTML,
  },

  'html-escape': {
    id: 'html-escape',
    name: 'HTML Escape',
    category: 'encoders',
    description: 'Escape special HTML characters',
    inputSchema: {
      type: 'string',
      description: 'Text to escape',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'HTML-escaped string',
    },
    process: escapeHTML,
  },

  'html-unescape': {
    id: 'html-unescape',
    name: 'HTML Unescape',
    category: 'encoders',
    description: 'Unescape HTML entities',
    inputSchema: {
      type: 'string',
      description: 'HTML-escaped string',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'Unescaped text',
    },
    process: unescapeHTML,
  },

  'xml-escape': {
    id: 'xml-escape',
    name: 'XML Escape',
    category: 'encoders',
    description: 'Escape special XML characters',
    inputSchema: {
      type: 'string',
      description: 'Text to escape',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'XML-escaped string',
    },
    process: escapeXML,
  },

  'xml-unescape': {
    id: 'xml-unescape',
    name: 'XML Unescape',
    category: 'encoders',
    description: 'Unescape XML entities',
    inputSchema: {
      type: 'string',
      description: 'XML-escaped string',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'Unescaped text',
    },
    process: unescapeXML,
  },

  'json-escape': {
    id: 'json-escape',
    name: 'JSON Escape',
    category: 'encoders',
    description: 'Escape text for safe JSON string',
    inputSchema: {
      type: 'string',
      description: 'Text to escape',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'JSON-escaped string',
    },
    process: escapeJSON,
  },

  'csv-escape': {
    id: 'csv-escape',
    name: 'CSV Escape',
    category: 'encoders',
    description: 'Escape text for safe CSV field',
    inputSchema: {
      type: 'string',
      description: 'Text to escape',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'CSV-escaped string',
    },
    process: escapeCSV,
  },
  'md5-hash': {
    id: 'md5-hash',
    name: 'MD5 Hash Generator',
    category: 'generators',
    description: 'Generate MD5 hash of text (not recommended for passwords)',
    inputSchema: {
      type: 'string',
      description: 'Text to hash',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'MD5 hash (32 hex characters)',
    },
    process: generateMD5,
  },

  'sha256-hash': {
    id: 'sha256-hash',
    name: 'SHA-256 Hash Generator',
    category: 'generators',
    description: 'Generate SHA-256 hash of text',
    inputSchema: {
      type: 'string',
      description: 'Text to hash',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'SHA-256 hash (64 hex characters)',
    },
    process: generateSHA256,
  },

  'sha512-hash': {
    id: 'sha512-hash',
    name: 'SHA-512 Hash Generator',
    category: 'generators',
    description: 'Generate SHA-512 hash of text',
    inputSchema: {
      type: 'string',
      description: 'Text to hash',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'SHA-512 hash (128 hex characters)',
    },
    process: generateSHA512,
  },

  'uuid-generator': {
    id: 'uuid-generator',
    name: 'UUID Generator',
    category: 'generators',
    description: 'Generate a random UUID v4',
    inputSchema: {
      type: 'string',
      description: 'Input is ignored - generates random UUID',
    },
    outputSchema: {
      type: 'string',
      description: 'Random UUID v4',
    },
    process: () => generateUUID(),
  },

  'jwt-decoder': {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    category: 'converters',
    description: 'Decode JWT tokens to view header and payload',
    inputSchema: {
      type: 'string',
      description: 'JWT token to decode',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'object',
      description: 'Decoded JWT with header, payload, and signature',
      properties: {
        header: { type: 'object' },
        payload: { type: 'object' },
        signature: { type: 'string' },
      },
    },
    process: decodeJWT,
  },

  'epoch-to-date': {
    id: 'epoch-to-date',
    name: 'Epoch Timestamp to Date',
    category: 'converters',
    description: 'Convert Unix timestamp to human-readable date',
    inputSchema: {
      type: 'string',
      description: 'Unix timestamp in seconds or milliseconds',
      maxLength: 20,
    },
    outputSchema: {
      type: 'object',
      description: 'Converted date in multiple formats',
      properties: {
        iso: { type: 'string' },
        utc: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
    process: epochToDate,
  },

  'date-to-epoch': {
    id: 'date-to-epoch',
    name: 'Date to Epoch Timestamp',
    category: 'converters',
    description: 'Convert human-readable date to Unix timestamp',
    inputSchema: {
      type: 'string',
      description: 'Date string (ISO, UTC, or common formats)',
      maxLength: 100,
    },
    outputSchema: {
      type: 'object',
      description: 'Timestamp in seconds and milliseconds',
      properties: {
        seconds: { type: 'string' },
        milliseconds: { type: 'string' },
      },
    },
    process: dateToEpoch,
  },

  'reverse-string': {
    id: 'reverse-string',
    name: 'Reverse String',
    category: 'encoders',
    description: 'Reverse the characters in a string',
    inputSchema: {
      type: 'string',
      description: 'Text to reverse',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'Reversed text',
    },
    process: reverseString,
  },

  'string-to-lines': {
    id: 'string-to-lines',
    name: 'String to Lines',
    category: 'converters',
    description: 'Split string into lines and get line count',
    inputSchema: {
      type: 'string',
      description: 'Text to analyze',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'object',
      description: 'Line count and array of lines',
      properties: {
        lineCount: { type: 'string' },
        lines: { type: 'array' },
      },
    },
    process: stringToLines,
  },

  'remove-whitespace': {
    id: 'remove-whitespace',
    name: 'Remove Whitespace',
    category: 'encoders',
    description: 'Remove all whitespace characters from text',
    inputSchema: {
      type: 'string',
      description: 'Text to process',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'Text without whitespace',
    },
    process: removeWhitespace,
  },

  'text-uppercase': {
    id: 'text-uppercase',
    name: 'Uppercase',
    category: 'encoders',
    description: 'Convert text to uppercase',
    inputSchema: {
      type: 'string',
      description: 'Text to convert',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'Uppercase text',
    },
    process: textToUppercase,
  },

  'text-lowercase': {
    id: 'text-lowercase',
    name: 'Lowercase',
    category: 'encoders',
    description: 'Convert text to lowercase',
    inputSchema: {
      type: 'string',
      description: 'Text to convert',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'Lowercase text',
    },
    process: textToLowercase,
  },

  'title-case': {
    id: 'title-case',
    name: 'Title Case',
    category: 'encoders',
    description: 'Convert text to title case (capitalize first letter of each word)',
    inputSchema: {
      type: 'string',
      description: 'Text to convert',
      maxLength: 1048576,
    },
    outputSchema: {
      type: 'string',
      description: 'Title-cased text',
    },
    process: titleCase,
  },

  'minify-json': {
    id: 'minify-json',
    name: 'JSON Minifier',
    category: 'formatters',
    description: 'Minify JSON by removing whitespace',
    inputSchema: {
      type: 'string',
      description: 'Formatted JSON to minify',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Minified JSON',
    },
    process: minifyJSON,
  },

  'minify-css': {
    id: 'minify-css',
    name: 'CSS Minifier',
    category: 'formatters',
    description: 'Minify CSS by removing whitespace and comments',
    inputSchema: {
      type: 'string',
      description: 'CSS to minify',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Minified CSS',
    },
    process: minifyCSS,
  },

  'beautify-css': {
    id: 'beautify-css',
    name: 'CSS Beautifier',
    category: 'formatters',
    description: 'Format CSS with proper indentation',
    inputSchema: {
      type: 'string',
      description: 'CSS to beautify',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Formatted CSS',
    },
    process: beautifyCSS,
  },

  'minify-js': {
    id: 'minify-js',
    name: 'JavaScript Minifier',
    category: 'formatters',
    description: 'Minify JavaScript by removing whitespace and comments',
    inputSchema: {
      type: 'string',
      description: 'JavaScript to minify',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Minified JavaScript',
    },
    process: minifyJS,
  },

  'json-to-csv': {
    id: 'json-to-csv',
    name: 'JSON to CSV',
    category: 'converters',
    description: 'Convert JSON array to CSV format',
    inputSchema: {
      type: 'string',
      description: 'JSON array of objects',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'CSV format',
    },
    process: jsonToCSV,
  },

  'json-sorter': {
    id: 'json-sorter',
    name: 'JSON Sorter',
    category: 'formatters',
    description: 'Sort JSON keys alphabetically or array items by field values',
    inputSchema: {
      type: 'string',
      description: 'JSON to sort',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Sorted JSON',
    },
    process: formatJSON,
  },

  'json-fixer': {
    id: 'json-fixer',
    name: 'JSON Fixer',
    category: 'formatters',
    description:
      'Automatically fix common JSON syntax errors like trailing commas, single quotes, and comments',
    inputSchema: {
      type: 'string',
      description: 'Broken JSON to fix',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Fixed JSON',
    },
    process: formatJSON,
  },

  'json-schema': {
    id: 'json-schema',
    name: 'JSON Schema Generator',
    category: 'generators',
    description: 'Generate JSON Schema from sample JSON data for validation and documentation',
    inputSchema: {
      type: 'string',
      description: 'Sample JSON',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Generated JSON Schema',
    },
    process: formatJSON,
  },

  'json-query': {
    id: 'json-query',
    name: 'JSON Query',
    category: 'formatters',
    description: 'Query and filter JSON data using JMESPath expressions',
    inputSchema: {
      type: 'string',
      description: 'JSON to query',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Query result',
    },
    process: formatJSON,
  },

  'json-studio': {
    id: 'json-studio',
    name: 'JSON Studio',
    category: 'formatters',
    description:
      'All-in-one JSON toolkit with format, validate, fix, sort, query, schema, and search capabilities',
    inputSchema: {
      type: 'string',
      description: 'JSON to process',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Processed JSON',
    },
    process: formatJSON,
  },

  'api-client': {
    id: 'api-client',
    name: 'API Client',
    category: 'api',
    description:
      'Professional API testing and development tool - like Postman, but self-hosted and offline-first',
    inputSchema: {
      type: 'string',
      description: 'API Client does not use standard input/output pattern',
    },
    outputSchema: {
      type: 'string',
      description: 'API Client does not use standard input/output pattern',
    },
    process: executeApiRequest,
  },

  'dns-analysis': {
    id: 'dns-analysis',
    name: 'DNS Analysis',
    category: 'dns',
    description:
      'Comprehensive DNS analysis for a domain - A, AAAA, MX, TXT, CNAME, NS, and SOA records',
    inputSchema: {
      type: 'string',
      description: 'Domain name to analyze',
      maxLength: 253,
    },
    outputSchema: {
      type: 'string',
      description: 'DNS records in JSON format',
    },
    process: dnsAnalysis,
  },

  'mx-lookup': {
    id: 'mx-lookup',
    name: 'MX Lookup',
    category: 'dns',
    description: 'Find mail exchange (MX) records for a domain',
    inputSchema: {
      type: 'string',
      description: 'Domain name',
      maxLength: 253,
    },
    outputSchema: {
      type: 'string',
      description: 'MX records in JSON format',
    },
    process: mxLookup,
  },

  'soa-lookup': {
    id: 'soa-lookup',
    name: 'SOA Lookup',
    category: 'dns',
    description: 'Find Start of Authority (SOA) record for a domain',
    inputSchema: {
      type: 'string',
      description: 'Domain name',
      maxLength: 253,
    },
    outputSchema: {
      type: 'string',
      description: 'SOA record in JSON format',
    },
    process: soaLookup,
  },

  'reverse-dns-lookup': {
    id: 'reverse-dns-lookup',
    name: 'Reverse DNS Lookup',
    category: 'dns',
    description: 'Find hostname for an IP address using reverse DNS',
    inputSchema: {
      type: 'string',
      description: 'IP address (IPv4 or IPv6)',
      maxLength: 45,
    },
    outputSchema: {
      type: 'string',
      description: 'Hostnames in JSON format',
    },
    process: reverseDnsLookup,
  },

  'name-server-lookup': {
    id: 'name-server-lookup',
    name: 'Name Server Lookup',
    category: 'dns',
    description: 'Find authoritative name servers for a domain',
    inputSchema: {
      type: 'string',
      description: 'Domain name',
      maxLength: 253,
    },
    outputSchema: {
      type: 'string',
      description: 'Name servers in JSON format',
    },
    process: nameServerLookup,
  },

  'dns-traversal': {
    id: 'dns-traversal',
    name: 'DNS Traversal',
    category: 'dns',
    description: 'Traverse DNS hierarchy to find authoritative name servers',
    inputSchema: {
      type: 'string',
      description: 'Domain name',
      maxLength: 253,
    },
    outputSchema: {
      type: 'string',
      description: 'DNS traversal results in JSON format',
    },
    process: nameServerLookup,
  },

  'namespace-server-delegation': {
    id: 'namespace-server-delegation',
    name: 'Namespace Server Delegation',
    category: 'dns',
    description: 'Find namespace server delegation records for a domain',
    inputSchema: {
      type: 'string',
      description: 'Domain name',
      maxLength: 253,
    },
    outputSchema: {
      type: 'string',
      description: 'Delegation records in JSON format',
    },
    process: nameServerLookup,
  },

  // Testing Tools
  'responsive-tester': {
    id: 'responsive-tester',
    name: 'Responsive Tester',
    category: 'testing',
    description:
      'Preview websites across multiple device sizes simultaneously. Test responsive designs with real-time multi-viewport preview.',
    inputSchema: {
      type: 'string',
      description: 'URL to test',
      maxLength: 2048,
    },
    outputSchema: {
      type: 'object',
      description: 'Responsive preview configuration',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  // Transformation Tools
  'yaml-to-json': {
    id: 'yaml-to-json',
    name: 'YAML to JSON',
    category: 'converters',
    description:
      'Convert YAML to JSON format. Supports nested objects, arrays, and common YAML features.',
    inputSchema: {
      type: 'string',
      description: 'YAML string to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'JSON output',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json-to-yaml': {
    id: 'json-to-yaml',
    name: 'JSON to YAML',
    category: 'converters',
    description: 'Convert JSON to YAML format. Produces clean, readable YAML output.',
    inputSchema: {
      type: 'string',
      description: 'JSON string to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'YAML output',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json-to-typescript': {
    id: 'json-to-typescript',
    name: 'JSON to TypeScript',
    category: 'converters',
    description:
      'Generate TypeScript interfaces from JSON data. Automatically infers types and creates nested interfaces.',
    inputSchema: {
      type: 'string',
      description: 'JSON string to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'TypeScript interface definitions',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json-to-go': {
    id: 'json-to-go',
    name: 'JSON to Go Struct',
    category: 'converters',
    description:
      'Generate Go struct definitions from JSON data. Automatically infers types and creates proper json tags.',
    inputSchema: {
      type: 'string',
      description: 'JSON string to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Go struct definitions',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json-to-zod': {
    id: 'json-to-zod',
    name: 'JSON to Zod Schema',
    category: 'converters',
    description:
      'Generate Zod schema definitions from JSON data. Automatically infers types and detects patterns like email, URL, UUID, and dates.',
    inputSchema: {
      type: 'string',
      description: 'JSON string to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Zod schema definitions',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'xml-to-json': {
    id: 'xml-to-json',
    name: 'XML to JSON',
    category: 'converters',
    description:
      'Convert XML to JSON format. Handles attributes (prefixed with @), nested elements, and arrays.',
    inputSchema: {
      type: 'string',
      description: 'XML string to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'JSON output',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'toml-to-json': {
    id: 'toml-to-json',
    name: 'TOML to JSON',
    category: 'converters',
    description:
      'Convert TOML to JSON format. Supports tables, arrays, inline tables, and various data types.',
    inputSchema: {
      type: 'string',
      description: 'TOML string to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'JSON output',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json-to-toml': {
    id: 'json-to-toml',
    name: 'JSON to TOML',
    category: 'converters',
    description:
      'Convert JSON to TOML format. Generates tables, arrays of tables, and inline tables as appropriate.',
    inputSchema: {
      type: 'string',
      description: 'JSON string to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'TOML output',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'markdown-to-html': {
    id: 'markdown-to-html',
    name: 'Markdown to HTML',
    category: 'converters',
    description:
      'Convert Markdown to HTML. Supports headers, lists, links, images, code blocks, and more.',
    inputSchema: {
      type: 'string',
      description: 'Markdown string to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'HTML output',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'html-to-jsx': {
    id: 'html-to-jsx',
    name: 'HTML to JSX',
    category: 'converters',
    description:
      'Convert HTML to JSX for React. Handles class→className, for→htmlFor, style objects, event handlers, and self-closing tags.',
    inputSchema: {
      type: 'string',
      description: 'HTML string to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'JSX output',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'csv-to-json': {
    id: 'csv-to-json',
    name: 'CSV to JSON',
    category: 'converters',
    description:
      'Convert CSV to JSON format. Supports headers, custom delimiters (comma, semicolon, tab, pipe), and automatic type detection.',
    inputSchema: {
      type: 'string',
      description: 'CSV string to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'JSON output',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json-to-java': {
    id: 'json-to-java',
    name: 'JSON to Java',
    category: 'converters',
    description:
      'Generate Java classes from JSON. Supports Lombok annotations, Jackson @JsonProperty, getters/setters, and nested class generation.',
    inputSchema: {
      type: 'string',
      description: 'JSON string to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Java class definitions',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json-to-csharp': {
    id: 'json-to-csharp',
    name: 'JSON to C#',
    category: 'converters',
    description:
      'Generate C# classes from JSON. Supports records, JsonPropertyName attributes, nullable types, PascalCase conversion, and namespaces.',
    inputSchema: {
      type: 'string',
      description: 'JSON string to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'C# class definitions',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json-to-sql': {
    id: 'json-to-sql',
    name: 'JSON to SQL',
    category: 'converters',
    description:
      'Generate SQL CREATE TABLE and INSERT statements from JSON. Supports PostgreSQL, MySQL, SQLite, and SQL Server dialects.',
    inputSchema: {
      type: 'string',
      description: 'JSON string to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'SQL statements',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'formdata-to-json': {
    id: 'formdata-to-json',
    name: 'Form Data to JSON',
    category: 'converters',
    description:
      'Convert form data or URL query strings to JSON. Supports URL decoding, arrays, nested objects, and type parsing.',
    inputSchema: {
      type: 'string',
      description: 'Form data or query string',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'JSON output',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  // Phase 2: Schema Tools
  'json-to-json-schema': {
    id: 'json-to-json-schema',
    name: 'JSON to JSON Schema',
    category: 'converters',
    description:
      'Generate JSON Schema from sample JSON data. Supports multiple draft versions, format detection, and customizable options.',
    inputSchema: {
      type: 'string',
      description: 'JSON data to analyze',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'JSON Schema',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'typescript-to-zod': {
    id: 'typescript-to-zod',
    name: 'TypeScript to Zod',
    category: 'converters',
    description:
      'Convert TypeScript interfaces and types to Zod schemas. Supports unions, arrays, optional fields, and type references.',
    inputSchema: {
      type: 'string',
      description: 'TypeScript code with interfaces/types',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Zod schema definitions',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json-to-valibot': {
    id: 'json-to-valibot',
    name: 'JSON to Valibot',
    category: 'converters',
    description:
      'Generate Valibot schemas from JSON data. Supports type inference, format detection, and nested object schemas.',
    inputSchema: {
      type: 'string',
      description: 'JSON data to analyze',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Valibot schema code',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json-to-yup': {
    id: 'json-to-yup',
    name: 'JSON to Yup',
    category: 'converters',
    description:
      'Generate Yup validation schemas from JSON data. Supports field labels, required fields, and format validation.',
    inputSchema: {
      type: 'string',
      description: 'JSON data to analyze',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Yup schema code',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json-to-typebox': {
    id: 'json-to-typebox',
    name: 'JSON to TypeBox',
    category: 'converters',
    description:
      'Generate TypeBox schemas from JSON data. Supports format detection, nested schemas, and Static type inference.',
    inputSchema: {
      type: 'string',
      description: 'JSON data to analyze',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'TypeBox schema code',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  // Phase 3: Language Converters
  'json-to-kotlin': {
    id: 'json-to-kotlin',
    name: 'JSON to Kotlin',
    category: 'converters',
    description:
      'Generate Kotlin data classes from JSON. Supports @Serializable annotations, nullable types, and companion objects.',
    inputSchema: {
      type: 'string',
      description: 'JSON data to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Kotlin data class definitions',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json-to-dart': {
    id: 'json-to-dart',
    name: 'JSON to Dart',
    category: 'converters',
    description:
      'Generate Dart model classes from JSON. Supports null safety, @JsonSerializable, fromJson/toJson methods.',
    inputSchema: {
      type: 'string',
      description: 'JSON data to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Dart class definitions',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json-to-rust': {
    id: 'json-to-rust',
    name: 'JSON to Rust',
    category: 'converters',
    description:
      'Generate Rust structs from JSON. Supports Serde derive macros, Option types, Debug, Clone, and custom naming.',
    inputSchema: {
      type: 'string',
      description: 'JSON data to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Rust struct definitions',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'jsx-to-tsx': {
    id: 'jsx-to-tsx',
    name: 'JSX to TSX',
    category: 'converters',
    description:
      'Convert React JSX to TypeScript TSX. Generates prop interfaces, adds event handler types, and types useState hooks.',
    inputSchema: {
      type: 'string',
      description: 'JSX code to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'TypeScript TSX code',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json-to-swift': {
    id: 'json-to-swift',
    name: 'JSON to Swift',
    category: 'converters',
    description:
      'Generate Swift Codable structs from JSON. Supports CodingKeys, optional types, and custom initializers.',
    inputSchema: {
      type: 'string',
      description: 'JSON data to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Swift struct definitions',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  // Phase 4: Advanced Tools
  'typescript-to-graphql': {
    id: 'typescript-to-graphql',
    name: 'TypeScript to GraphQL',
    category: 'converters',
    description:
      'Convert TypeScript interfaces to GraphQL schema. Generates types, queries, mutations, and input types.',
    inputSchema: {
      type: 'string',
      description: 'TypeScript interfaces to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'GraphQL schema definition',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'css-to-tailwind': {
    id: 'css-to-tailwind',
    name: 'CSS to Tailwind',
    category: 'converters',
    description:
      'Convert CSS properties to Tailwind CSS utility classes. Maps common CSS to Tailwind equivalents.',
    inputSchema: {
      type: 'string',
      description: 'CSS code to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Tailwind CSS classes',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json5-to-json': {
    id: 'json5-to-json',
    name: 'JSON5 to JSON',
    category: 'converters',
    description:
      'Parse JSON5 and convert to standard JSON. Supports comments, trailing commas, unquoted keys, and more.',
    inputSchema: {
      type: 'string',
      description: 'JSON5 data to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Standard JSON output',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'json-to-graphql': {
    id: 'json-to-graphql',
    name: 'JSON to GraphQL',
    category: 'converters',
    description:
      'Generate GraphQL schema from JSON data. Creates types, queries, mutations, and input types.',
    inputSchema: {
      type: 'string',
      description: 'JSON data to convert',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'GraphQL schema definition',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },

  'openapi-grpc-workbench': {
    id: 'openapi-grpc-workbench',
    name: 'OpenAPI/gRPC Workbench',
    category: 'workbenches',
    description: 'Lint, validate, and analyze OpenAPI and gRPC contract specifications',
    inputSchema: {
      type: 'string',
      description: 'API contract specification (OpenAPI JSON/YAML or gRPC proto)',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description: 'Validation results, linting issues, and analysis summary',
    },
    process: processContractWorkbench,
  },

  'log-parser-playground': {
    id: 'log-parser-playground',
    name: 'Log Parser Playground',
    category: 'parsers',
    description:
      'Advanced log parser with structured parsing, statistical analysis, anomaly detection, and correlation analysis. Supports NGINX, Apache, JSON, Syslog, and custom regex formats with real-time pattern recognition, automated insights, and enterprise-grade log analysis capabilities.',
    inputSchema: {
      type: 'string',
      description:
        'Log data to parse (plain text or JSON configuration with anomaly detection, filtering, and analysis settings)',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description:
        'Comprehensive log analysis with parsed entries, field statistics, anomaly detection results, correlation insights, and time-based analysis',
    },
    process: processLogParser,
  },
  'test-api': {
    id: 'test-api',
    name: 'Test API',
    category: 'workbenches',
    description:
      'Advanced API testing client for REST, GraphQL, and more. Supports environments, scripting, codegen, and history.',
    inputSchema: {
      type: 'object',
      description: 'API request configuration and environment',
      properties: {},
    },
    outputSchema: {
      type: 'object',
      description: 'API response and test results',
      properties: {},
    },
    process: async (input: string) => input, // UI handles processing
  },
  'architecture-diagram': {
    id: 'architecture-diagram',
    name: 'Architecture Diagram Generator',
    category: 'workbenches',
    isDraft: true,
    description:
      'Professional architecture diagram generator for system design. Create stunning diagrams with drag-and-drop interface, multiple layout algorithms (hierarchical, force-directed, circular, grid, tree), cloud service icons (AWS, GCP, Azure), pre-built templates (microservices, serverless, monolithic, event-driven, hybrid-cloud, Kubernetes), and export to SVG, Mermaid, PlantUML. Includes diagram validation, complexity analysis, cycle detection, and auto-documentation generation. Perfect for architects and senior engineers designing scalable systems.',
    inputSchema: {
      type: 'string',
      description:
        "JSON configuration for architecture diagram generation. Supports actions: 'list-templates', 'load-template', or full diagram config with components, connections, layout algorithm, and style preferences.",
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'string',
      description:
        'Generated architecture diagram in multiple formats (SVG, Mermaid, PlantUML, JSON) with validation results, metadata, and optional documentation summary.',
    },
    process: processArchitectureDiagram,
  },

  'data-diff': {
    id: 'data-diff',
    name: 'Data Diff Tool',
    category: 'validators',
    description:
      'Compare JSON and text data with forensic precision. Features dual-mode comparison (simple line-by-line or advanced character-level), structural JSON diff, and color-coded visualization. Perfect for debugging API responses, validating data migrations, and detecting configuration drift.',
    inputSchema: {
      type: 'object',
      description: 'Left and right data to compare',
      maxLength: 10485760,
    },
    outputSchema: {
      type: 'object',
      description: 'Diff results with changes and statistics',
    },
    process: async (input: string) => input, // Custom UI handles processing
  },
};

export const TOOL_IDS = Object.keys(TOOLS) as (keyof typeof TOOLS)[];

export const getToolByCategory = (category: string): Tool[] => {
  return Object.values(TOOLS).filter((tool) => tool.category === category && !tool.isDraft);
};

export const getAllToolsByCategory = (): Record<string, Tool[]> => {
  const result: Record<string, Tool[]> = {};

  Object.values(TOOL_CATEGORIES).forEach((category) => {
    const tools = getToolByCategory(category.id);
    if (tools.length > 0) {
      result[category.id] = tools;
    }
  });

  return result;
};

export const getTool = (id: string): Tool | undefined => {
  return TOOLS[id as keyof typeof TOOLS];
};
