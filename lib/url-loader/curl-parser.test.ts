/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { parseCurl, toCurl, validateUrl } from './curl-parser';

describe('curl-parser', () => {
  describe('parseCurl', () => {
    it('should parse a simple GET request', () => {
      const curl = "curl 'https://api.example.com/users'";
      const config = parseCurl(curl);

      expect(config.url).toBe('https://api.example.com/users');
      expect(config.method).toBe('GET');
    });

    it('should parse POST request with method flag', () => {
      const curl = "curl -X POST 'https://api.example.com/users'";
      const config = parseCurl(curl);

      expect(config.method).toBe('POST');
      expect(config.url).toBe('https://api.example.com/users');
    });

    it('should parse headers', () => {
      const curl = `curl 'https://api.example.com/users' -H 'Content-Type: application/json' -H 'Accept: application/json'`;
      const config = parseCurl(curl);

      expect(config.headers).toHaveLength(1); // Accept header
      expect(config.headers[0].key).toBe('Accept');
      expect(config.headers[0].value).toBe('application/json');
      expect(config.contentType).toBe('application/json');
    });

    it('should parse JSON body', () => {
      const curl = `curl -X POST 'https://api.example.com/users' -d '{"name":"John","age":30}'`;
      const config = parseCurl(curl);

      expect(config.method).toBe('POST');
      expect(config.body).toBe('{"name":"John","age":30}');
    });

    it('should parse basic auth', () => {
      const curl = "curl -u 'username:password' 'https://api.example.com/users'";
      const config = parseCurl(curl);

      expect(config.auth.type).toBe('basic');
      expect(config.auth.username).toBe('username');
      expect(config.auth.password).toBe('password');
    });

    it('should parse bearer token from Authorization header', () => {
      const curl = `curl 'https://api.example.com/users' -H 'Authorization: Bearer abc123'`;
      const config = parseCurl(curl);

      expect(config.auth.type).toBe('bearer');
      expect(config.auth.token).toBe('abc123');
    });

    it('should parse query parameters from URL', () => {
      const curl = "curl 'https://api.example.com/users?page=1&limit=10'";
      const config = parseCurl(curl);

      expect(config.url).toBe('https://api.example.com/users');
      expect(config.queryParams).toHaveLength(2);
      expect(config.queryParams[0].key).toBe('page');
      expect(config.queryParams[0].value).toBe('1');
      expect(config.queryParams[1].key).toBe('limit');
      expect(config.queryParams[1].value).toBe('10');
    });

    it('should handle line continuations', () => {
      const curl = `curl 'https://api.example.com/users' \\
        -H 'Content-Type: application/json' \\
        -d '{"name":"John"}'`;
      const config = parseCurl(curl);

      expect(config.url).toBe('https://api.example.com/users');
      expect(config.contentType).toBe('application/json');
      expect(config.body).toBe('{"name":"John"}');
    });

    it('should parse --compressed flag', () => {
      const curl = "curl --compressed 'https://api.example.com/users'";
      const config = parseCurl(curl);

      const acceptEncodingHeader = config.headers.find((h) => h.key === 'Accept-Encoding');
      expect(acceptEncodingHeader).toBeDefined();
      expect(acceptEncodingHeader?.value).toBe('gzip, deflate, br');
    });

    it('should parse timeout', () => {
      const curl = "curl --max-time 30 'https://api.example.com/users'";
      const config = parseCurl(curl);

      expect(config.timeout).toBe(30000); // 30 seconds in milliseconds
    });

    it('should parse user-agent header', () => {
      const curl = "curl -A 'MyApp/1.0' 'https://api.example.com/users'";
      const config = parseCurl(curl);

      const userAgentHeader = config.headers.find((h) => h.key === 'User-Agent');
      expect(userAgentHeader).toBeDefined();
      expect(userAgentHeader?.value).toBe('MyApp/1.0');
    });

    it('should parse cookie header', () => {
      const curl = "curl -b 'session=abc123' 'https://api.example.com/users'";
      const config = parseCurl(curl);

      const cookieHeader = config.headers.find((h) => h.key === 'Cookie');
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader?.value).toBe('session=abc123');
    });

    it('should default to POST when data is provided', () => {
      const curl = "curl 'https://api.example.com/users' -d 'name=John'";
      const config = parseCurl(curl);

      expect(config.method).toBe('POST');
    });

    it('should handle HEAD method', () => {
      const curl = "curl -I 'https://api.example.com/users'";
      const config = parseCurl(curl);

      expect(config.method).toBe('HEAD');
    });
  });

  describe('toCurl', () => {
    it('should convert simple GET request to curl', () => {
      const config = {
        url: 'https://api.example.com/users',
        method: 'GET' as const,
        headers: [],
        queryParams: [],
        body: '',
        contentType: 'application/json' as const,
        auth: { type: 'none' as const },
        followRedirects: false,
        timeout: 30000,
      };

      const curl = toCurl(config);
      expect(curl).toContain("'https://api.example.com/users'");
      expect(curl).not.toContain('-X GET'); // GET is default
    });

    it('should convert POST request with body to curl', () => {
      const config = {
        url: 'https://api.example.com/users',
        method: 'POST' as const,
        headers: [],
        queryParams: [],
        body: '{"name":"John"}',
        contentType: 'application/json' as const,
        auth: { type: 'none' as const },
        followRedirects: false,
        timeout: 30000,
      };

      const curl = toCurl(config);
      expect(curl).toContain('-X POST');
      expect(curl).toContain('-d \'{"name":"John"}\'');
      expect(curl).toContain("-H 'Content-Type: application/json'");
    });

    it('should convert basic auth to curl', () => {
      const config = {
        url: 'https://api.example.com/users',
        method: 'GET' as const,
        headers: [],
        queryParams: [],
        body: '',
        contentType: 'application/json' as const,
        auth: { type: 'basic' as const, username: 'user', password: 'pass' },
        followRedirects: false,
        timeout: 30000,
      };

      const curl = toCurl(config);
      expect(curl).toContain("-u 'user:pass'");
    });

    it('should convert bearer token to curl', () => {
      const config = {
        url: 'https://api.example.com/users',
        method: 'GET' as const,
        headers: [],
        queryParams: [],
        body: '',
        contentType: 'application/json' as const,
        auth: { type: 'bearer' as const, token: 'abc123' },
        followRedirects: false,
        timeout: 30000,
      };

      const curl = toCurl(config);
      expect(curl).toContain("-H 'Authorization: Bearer abc123'");
    });
  });

  describe('validateUrl', () => {
    it('should validate correct HTTP URL', () => {
      const result = validateUrl('http://example.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate correct HTTPS URL', () => {
      const result = validateUrl('https://example.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty URL', () => {
      const result = validateUrl('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('URL is required');
    });

    it('should reject invalid URL format', () => {
      const result = validateUrl('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    it('should reject non-HTTP protocols', () => {
      const result = validateUrl('ftp://example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only HTTP and HTTPS URLs are supported');
    });
  });
});
