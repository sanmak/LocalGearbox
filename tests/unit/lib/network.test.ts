/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import { formatDoHResponse, type DoHResponse } from '@/lib/tools/network/dns-doh';

describe('formatDoHResponse', () => {
  it('should return empty array when no Answer section', () => {
    const response: DoHResponse = {
      Status: 0,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
    };
    const result = formatDoHResponse(response);
    expect(result).toEqual([]);
  });

  it('should return empty array when Answer is empty', () => {
    const response: DoHResponse = {
      Status: 0,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
      Answer: [],
    };
    const result = formatDoHResponse(response);
    expect(result).toEqual([]);
  });

  it('should format A record response', () => {
    const response: DoHResponse = {
      Status: 0,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
      Answer: [{ name: 'example.com.', type: 1, TTL: 300, data: '93.184.216.34' }],
    };
    const result = formatDoHResponse(response);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('example.com.');
    expect(result[0].type).toBe('A');
    expect(result[0].ttl).toBe(300);
    expect(result[0].value).toBe('93.184.216.34');
  });

  it('should format AAAA record response', () => {
    const response: DoHResponse = {
      Status: 0,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
      Answer: [
        { name: 'example.com.', type: 28, TTL: 600, data: '2606:2800:220:1:248:1893:25c8:1946' },
      ],
    };
    const result = formatDoHResponse(response);
    expect(result[0].type).toBe('AAAA');
  });

  it('should format MX record response', () => {
    const response: DoHResponse = {
      Status: 0,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
      Answer: [{ name: 'example.com.', type: 15, TTL: 3600, data: '10 mail.example.com.' }],
    };
    const result = formatDoHResponse(response);
    expect(result[0].type).toBe('MX');
    expect(result[0].value).toBe('10 mail.example.com.');
  });

  it('should format multiple records', () => {
    const response: DoHResponse = {
      Status: 0,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
      Answer: [
        { name: 'example.com.', type: 1, TTL: 300, data: '93.184.216.34' },
        { name: 'example.com.', type: 1, TTL: 300, data: '93.184.216.35' },
      ],
    };
    const result = formatDoHResponse(response);
    expect(result).toHaveLength(2);
  });

  it('should format CNAME record response', () => {
    const response: DoHResponse = {
      Status: 0,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
      Answer: [{ name: 'www.example.com.', type: 5, TTL: 3600, data: 'example.com.' }],
    };
    const result = formatDoHResponse(response);
    expect(result[0].type).toBe('CNAME');
  });

  it('should format NS record response', () => {
    const response: DoHResponse = {
      Status: 0,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
      Answer: [{ name: 'example.com.', type: 2, TTL: 3600, data: 'ns1.example.com.' }],
    };
    const result = formatDoHResponse(response);
    expect(result[0].type).toBe('NS');
  });

  it('should format TXT record response', () => {
    const response: DoHResponse = {
      Status: 0,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
      Answer: [
        {
          name: 'example.com.',
          type: 16,
          TTL: 3600,
          data: '"v=spf1 include:_spf.google.com ~all"',
        },
      ],
    };
    const result = formatDoHResponse(response);
    expect(result[0].type).toBe('TXT');
  });

  it('should handle unknown record types', () => {
    const response: DoHResponse = {
      Status: 0,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
      Answer: [{ name: 'example.com.', type: 99, TTL: 300, data: 'some data' }],
    };
    const result = formatDoHResponse(response);
    expect(result[0].type).toBe('99');
  });
});
