/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { formatSize, formatDuration, getStatusColor, formatResponseBody } from './executor';

// Note: executeRequest is not tested here as it requires mocking fetch
// which would be better suited for integration tests

describe('executor utilities', () => {
  describe('formatSize', () => {
    it('should format bytes', () => {
      expect(formatSize(500)).toBe('500 B');
      expect(formatSize(0)).toBe('0 B');
    });

    it('should format kilobytes', () => {
      expect(formatSize(1024)).toBe('1.0 KB');
      expect(formatSize(2048)).toBe('2.0 KB');
      expect(formatSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatSize(2 * 1024 * 1024)).toBe('2.0 MB');
      expect(formatSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500 ms');
      expect(formatDuration(999)).toBe('999 ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1.00 s');
      expect(formatDuration(2500)).toBe('2.50 s');
      expect(formatDuration(10000)).toBe('10.00 s');
    });
  });

  describe('getStatusColor', () => {
    it('should return green for 2xx status codes', () => {
      expect(getStatusColor(200)).toBe('text-green-500');
      expect(getStatusColor(201)).toBe('text-green-500');
      expect(getStatusColor(299)).toBe('text-green-500');
    });

    it('should return yellow for 3xx status codes', () => {
      expect(getStatusColor(300)).toBe('text-yellow-500');
      expect(getStatusColor(301)).toBe('text-yellow-500');
      expect(getStatusColor(399)).toBe('text-yellow-500');
    });

    it('should return orange for 4xx status codes', () => {
      expect(getStatusColor(400)).toBe('text-orange-500');
      expect(getStatusColor(404)).toBe('text-orange-500');
      expect(getStatusColor(499)).toBe('text-orange-500');
    });

    it('should return red for 5xx status codes', () => {
      expect(getStatusColor(500)).toBe('text-red-500');
      expect(getStatusColor(503)).toBe('text-red-500');
      expect(getStatusColor(599)).toBe('text-red-500');
    });

    it('should return default color for other codes', () => {
      expect(getStatusColor(100)).toBe('text-text-secondary');
      expect(getStatusColor(600)).toBe('text-red-500'); // 600 is >= 500
    });
  });

  describe('formatResponseBody', () => {
    it('should format JSON response', () => {
      const body = '{"name":"John","age":30}';
      const formatted = formatResponseBody(body, 'application/json');

      expect(formatted).toContain('"name"');
      expect(formatted).toContain('"John"');
      expect(formatted).toContain('\n'); // Should be pretty-printed
    });

    it('should handle invalid JSON gracefully', () => {
      const body = 'not json';
      const formatted = formatResponseBody(body, 'application/json');

      expect(formatted).toBe('not json');
    });

    it('should return body as-is for non-JSON content types', () => {
      const body = '<html><body>Hello</body></html>';
      const formatted = formatResponseBody(body, 'text/html');

      expect(formatted).toBe(body);
    });

    it('should handle JSON with charset', () => {
      const body = '{"test":true}';
      const formatted = formatResponseBody(body, 'application/json; charset=utf-8');

      expect(formatted).toContain('"test"');
      expect(formatted).toContain('true');
    });
  });
});
