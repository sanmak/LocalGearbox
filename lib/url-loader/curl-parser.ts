/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * CURL Parser
 * Parses CURL commands into RequestConfig objects
 */

/**
 * Safely escapes a string for use in double-quoted strings
 * IMPORTANT: Escapes backslashes FIRST to prevent double-escaping
 */
const escapeDoubleQuoted = (str: string): string => {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
};

/**
 * Safely escapes a string for use in single-quoted strings
 * IMPORTANT: Escapes backslashes FIRST to prevent double-escaping
 */
const escapeSingleQuoted = (str: string): string => {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
};

import {
  RequestConfig,
  HttpMethod,
  AuthConfig,
  ContentType,
  DEFAULT_REQUEST_CONFIG,
} from './types';

/**
 * Parse a CURL command string into a RequestConfig object
 */
export function parseCurl(curlCommand: string): RequestConfig {
  const config: RequestConfig = { ...DEFAULT_REQUEST_CONFIG };

  // Normalize the command - handle line continuations and clean up
  let normalized = curlCommand
    .replace(/\\\s*\n/g, ' ') // Handle line continuations
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Remove 'curl' prefix if present
  if (normalized.toLowerCase().startsWith('curl ')) {
    normalized = normalized.substring(5).trim();
  }

  // Parse tokens (handle quoted strings properly)
  const tokens = tokenize(normalized);

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    // URL (usually the first non-flag argument or after --url)
    if (!token.startsWith('-') && !config.url) {
      config.url = cleanQuotes(token);
      i++;
      continue;
    }

    switch (token) {
      case '-X':
      case '--request':
        if (i + 1 < tokens.length) {
          const method = tokens[i + 1].toUpperCase() as HttpMethod;
          if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(method)) {
            config.method = method;
          }
          i += 2;
        } else {
          i++;
        }
        break;

      case '-H':
      case '--header':
        if (i + 1 < tokens.length) {
          const headerStr = cleanQuotes(tokens[i + 1]);
          const colonIdx = headerStr.indexOf(':');
          if (colonIdx > 0) {
            const key = headerStr.substring(0, colonIdx).trim();
            const value = headerStr.substring(colonIdx + 1).trim();

            // Check for special headers
            if (key.toLowerCase() === 'content-type') {
              config.contentType = value as ContentType;
              if (
                ![
                  'application/json',
                  'application/xml',
                  'application/x-www-form-urlencoded',
                  'multipart/form-data',
                  'text/plain',
                  'text/html',
                  'text/xml',
                ].includes(value)
              ) {
                config.contentType = 'custom';
                config.customContentType = value;
              }
            } else if (key.toLowerCase() === 'authorization') {
              config.auth = parseAuthHeader(value);
            } else {
              config.headers.push({ key, value, enabled: true });
            }
          }
          i += 2;
        } else {
          i++;
        }
        break;

      case '-d':
      case '--data':
      case '--data-raw':
      case '--data-binary':
        if (i + 1 < tokens.length) {
          let body = cleanQuotes(tokens[i + 1]);
          // Try to fix common JSON issues (single quotes instead of double quotes)
          body = tryFixJsonBody(body);
          config.body = body;
          // If method is still GET and we have data, switch to POST
          if (config.method === 'GET') {
            config.method = 'POST';
          }
          i += 2;
        } else {
          i++;
        }
        break;

      case '--data-urlencode':
        if (i + 1 < tokens.length) {
          const data = cleanQuotes(tokens[i + 1]);
          if (config.body) {
            config.body += '&' + encodeURIComponent(data);
          } else {
            config.body = encodeURIComponent(data);
          }
          config.contentType = 'application/x-www-form-urlencoded';
          if (config.method === 'GET') {
            config.method = 'POST';
          }
          i += 2;
        } else {
          i++;
        }
        break;

      case '-u':
      case '--user':
        if (i + 1 < tokens.length) {
          const userPass = cleanQuotes(tokens[i + 1]);
          const colonIdx = userPass.indexOf(':');
          if (colonIdx > 0) {
            config.auth = {
              type: 'basic',
              username: userPass.substring(0, colonIdx),
              password: userPass.substring(colonIdx + 1),
            };
          } else {
            config.auth = {
              type: 'basic',
              username: userPass,
              password: '',
            };
          }
          i += 2;
        } else {
          i++;
        }
        break;

      case '--url':
        if (i + 1 < tokens.length) {
          config.url = cleanQuotes(tokens[i + 1]);
          i += 2;
        } else {
          i++;
        }
        break;

      case '-L':
      case '--location':
        config.followRedirects = true;
        i++;
        break;

      case '--max-time':
      case '-m':
        if (i + 1 < tokens.length) {
          const timeout = parseInt(tokens[i + 1], 10);
          if (!isNaN(timeout)) {
            config.timeout = timeout * 1000; // Convert to milliseconds
          }
          i += 2;
        } else {
          i++;
        }
        break;

      case '-A':
      case '--user-agent':
        if (i + 1 < tokens.length) {
          config.headers.push({
            key: 'User-Agent',
            value: cleanQuotes(tokens[i + 1]),
            enabled: true,
          });
          i += 2;
        } else {
          i++;
        }
        break;

      case '-e':
      case '--referer':
        if (i + 1 < tokens.length) {
          config.headers.push({
            key: 'Referer',
            value: cleanQuotes(tokens[i + 1]),
            enabled: true,
          });
          i += 2;
        } else {
          i++;
        }
        break;

      case '-b':
      case '--cookie':
        if (i + 1 < tokens.length) {
          config.headers.push({
            key: 'Cookie',
            value: cleanQuotes(tokens[i + 1]),
            enabled: true,
          });
          i += 2;
        } else {
          i++;
        }
        break;

      case '--compressed':
        // Add Accept-Encoding header
        const hasAcceptEncoding = config.headers.some(
          (h) => h.key.toLowerCase() === 'accept-encoding',
        );
        if (!hasAcceptEncoding) {
          config.headers.push({
            key: 'Accept-Encoding',
            value: 'gzip, deflate, br',
            enabled: true,
          });
        }
        i++;
        break;

      // Skip flags we don't handle
      case '-v':
      case '--verbose':
      case '-s':
      case '--silent':
      case '-S':
      case '--show-error':
      case '-k':
      case '--insecure':
      case '-i':
      case '--include':
      case '-I':
      case '--head':
        if (token === '-I' || token === '--head') {
          config.method = 'HEAD';
        }
        i++;
        break;

      case '-o':
      case '--output':
      case '-O':
      case '--remote-name':
      case '-c':
      case '--cookie-jar':
      case '-w':
      case '--write-out':
        // These flags take an argument we should skip
        i += 2;
        break;

      default:
        // Unknown flag or URL
        if (!token.startsWith('-') && !config.url) {
          config.url = cleanQuotes(token);
        }
        i++;
    }
  }

  // Parse query params from URL
  if (config.url) {
    try {
      const urlObj = new URL(config.url);
      urlObj.searchParams.forEach((value, key) => {
        config.queryParams.push({ key, value, enabled: true });
      });
      // Store URL without query params
      config.url = urlObj.origin + urlObj.pathname;
    } catch {
      // URL might be invalid, keep as-is
    }
  }

  return config;
}

/**
 * Tokenize a curl command, handling quoted strings
 */
function tokenize(command: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote: string | null = null;
  let escaped = false;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (escaped) {
      // Handle escaped characters
      if (inQuote === "'" && char === "'") {
        // Escaped single quote inside single-quoted string
        current += "'";
      } else if (inQuote === '"' && char === '"') {
        // Escaped double quote inside double-quoted string
        current += '"';
      } else if (char === 'n') {
        current += '\n';
      } else if (char === 't') {
        current += '\t';
      } else if (char === 'r') {
        current += '\r';
      } else {
        // Keep the character as-is (including backslash for other escapes)
        current += char;
      }
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inQuote = char;
      continue;
    }

    if (char === ' ' || char === '\t') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Remove surrounding quotes from a string
 */
function cleanQuotes(str: string): string {
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

/**
 * Try to fix common JSON body issues
 * - Single quotes used instead of double quotes for strings
 * - Trailing commas
 */
function tryFixJsonBody(body: string): string {
  // First, check if it's valid JSON already
  try {
    JSON.parse(body);
    return body; // Already valid, return as-is
  } catch {
    // Not valid JSON, try to fix it
  }

  // Try to fix single quotes to double quotes
  // This is a simplified fix - it handles common cases but not all edge cases
  let fixed = body;

  // Replace single quotes around property names and string values
  // Pattern: 'value' -> "value" (but not inside strings)
  // This is a heuristic approach

  // First, handle the case where single quotes are used as JSON string delimiters
  // Look for patterns like: 'foo' where foo doesn't contain unescaped quotes
  fixed = fixed.replace(
    /:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g,
    (_, content) => `: "${escapeDoubleQuoted(content)}"`,
  );

  // Handle property names with single quotes
  fixed = fixed.replace(
    /'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g,
    (_, content) => `"${escapeDoubleQuoted(content)}":`,
  );

  // Handle array values with single quotes
  fixed = fixed.replace(
    /\[\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g,
    (_, content) => `["${escapeDoubleQuoted(content)}"`,
  );
  fixed = fixed.replace(
    /,\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g,
    (_, content) => `, "${escapeDoubleQuoted(content)}"`,
  );

  // Remove trailing commas before ] or }
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

  // Try parsing the fixed version
  try {
    JSON.parse(fixed);
    return fixed;
  } catch {
    // Still not valid, return original
    return body;
  }
}

/**
 * Parse an Authorization header value into an AuthConfig
 */
function parseAuthHeader(value: string): AuthConfig {
  const lowerValue = value.toLowerCase();

  if (lowerValue.startsWith('basic ')) {
    // Decode base64 credentials
    try {
      const decoded = atob(value.substring(6));
      const colonIdx = decoded.indexOf(':');
      if (colonIdx > 0) {
        return {
          type: 'basic',
          username: decoded.substring(0, colonIdx),
          password: decoded.substring(colonIdx + 1),
        };
      }
    } catch {
      // Invalid base64, store as custom
    }
    return {
      type: 'custom',
      customHeaderName: 'Authorization',
      customHeaderValue: value,
    };
  }

  if (lowerValue.startsWith('bearer ')) {
    return {
      type: 'bearer',
      token: value.substring(7),
    };
  }

  // Unknown auth type, store as custom
  return {
    type: 'custom',
    customHeaderName: 'Authorization',
    customHeaderValue: value,
  };
}

/**
 * Convert a RequestConfig back to a curl command
 */
export function toCurl(config: RequestConfig): string {
  const parts: string[] = ['curl'];

  // Add method if not GET
  if (config.method !== 'GET') {
    parts.push(`-X ${config.method}`);
  }

  // Build URL with query params
  let url = config.url;
  const enabledParams = config.queryParams.filter((p) => p.enabled && p.key);
  if (enabledParams.length > 0) {
    const params = new URLSearchParams();
    enabledParams.forEach((p) => params.append(p.key, p.value));
    url += (url.includes('?') ? '&' : '?') + params.toString();
  }
  parts.push(`'${url}'`);

  // Add headers
  const enabledHeaders = config.headers.filter((h) => h.enabled && h.key);
  enabledHeaders.forEach((h) => {
    parts.push(`-H '${h.key}: ${h.value}'`);
  });

  // Add Content-Type if body exists
  if (config.body && config.method !== 'GET' && config.method !== 'HEAD') {
    const contentType =
      config.contentType === 'custom' ? config.customContentType : config.contentType;
    if (contentType) {
      parts.push(`-H 'Content-Type: ${contentType}'`);
    }
  }

  // Add auth
  if (config.auth.type !== 'none') {
    switch (config.auth.type) {
      case 'basic':
        if (config.auth.username) {
          parts.push(`-u '${config.auth.username}:${config.auth.password || ''}'`);
        }
        break;
      case 'bearer':
        if (config.auth.token) {
          parts.push(`-H 'Authorization: Bearer ${config.auth.token}'`);
        }
        break;
      case 'api-key':
        if (config.auth.apiKeyName && config.auth.apiKeyValue) {
          if (config.auth.apiKeyLocation === 'header') {
            parts.push(`-H '${config.auth.apiKeyName}: ${config.auth.apiKeyValue}'`);
          }
          // Query params handled above
        }
        break;
      case 'custom':
        if (config.auth.customHeaderName && config.auth.customHeaderValue) {
          parts.push(`-H '${config.auth.customHeaderName}: ${config.auth.customHeaderValue}'`);
        }
        break;
    }
  }

  // Add body
  if (config.body && config.method !== 'GET' && config.method !== 'HEAD') {
    parts.push(`-d '${escapeSingleQuoted(config.body)}'`);
  }

  return parts.join(' \\\n  ');
}

/**
 * Validate a URL string
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url.trim()) {
    return { valid: false, error: 'URL is required' };
  }

  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are supported' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}
