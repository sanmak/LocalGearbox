/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * DNS-over-HTTPS (DoH) Client Library
 *
 * This module provides a client-side DNS lookup implementation using DNS-over-HTTPS (DoH).
 * It supports multiple DoH providers (Google Public DNS, Cloudflare DNS) with automatic
 * failover for reliability.
 *
 * Benefits over server-side DNS:
 * - 100% client-side (no data through our servers)
 * - Encrypted DNS queries (HTTPS)
 * - Better privacy (direct to provider)
 * - Zero infrastructure cost
 * - Higher reliability (provider uptime)
 */

export type DNSRecordType = 'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME' | 'NS' | 'SOA' | 'PTR';
export type DoHProvider = 'google' | 'cloudflare';

/**
 * DoH Response format (RFC 8427 - JSON format for DNS-over-HTTPS)
 * https://developers.google.com/speed/public-dns/docs/doh/json
 */
export interface DoHResponse {
  /** Response status code (0 = NOERROR, 1 = FORMERR, 2 = SERVFAIL, 3 = NXDOMAIN, etc.) */
  Status: number;
  /** Truncated response flag */
  TC: boolean;
  /** Recursion desired flag */
  RD: boolean;
  /** Recursion available flag */
  RA: boolean;
  /** Authentic data flag (DNSSEC) */
  AD: boolean;
  /** Checking disabled flag (DNSSEC) */
  CD: boolean;
  /** Question section */
  Question?: Array<{
    name: string;
    type: number;
  }>;
  /** Answer section */
  Answer?: Array<{
    name: string;
    type: number;
    TTL: number;
    data: string;
  }>;
  /** Authority section */
  Authority?: Array<{
    name: string;
    type: number;
    TTL: number;
    data: string;
  }>;
  /** Additional section */
  Additional?: Array<{
    name: string;
    type: number;
    TTL: number;
    data: string;
  }>;
  /** Comment (optional, Google DNS) */
  Comment?: string;
}

/** DNS record type codes (RFC 1035) */
const DNS_RECORD_TYPES: Record<DNSRecordType, number> = {
  A: 1, // IPv4 address
  AAAA: 28, // IPv6 address
  MX: 15, // Mail exchange
  TXT: 16, // Text record
  CNAME: 5, // Canonical name
  NS: 2, // Name server
  SOA: 6, // Start of authority
  PTR: 12, // Pointer record (reverse DNS)
};

/** DNS response status codes */
const DNS_STATUS_CODES: Record<number, string> = {
  0: 'NOERROR', // No error
  1: 'FORMERR', // Format error
  2: 'SERVFAIL', // Server failure
  3: 'NXDOMAIN', // Non-existent domain
  4: 'NOTIMP', // Not implemented
  5: 'REFUSED', // Query refused
};

/**
 * DoH provider endpoints
 */
const DOH_ENDPOINTS: Record<DoHProvider, string> = {
  google: 'https://dns.google/resolve',
  cloudflare: 'https://cloudflare-dns.com/dns-query',
};

/**
 * Query DNS using DNS-over-HTTPS
 *
 * @param domain - Domain name to query
 * @param recordType - DNS record type to query
 * @param provider - DoH provider to use (google or cloudflare)
 * @returns DoH response with DNS records
 * @throws Error if query fails or DNS returns error status
 */
export async function queryDoH(
  domain: string,
  recordType: DNSRecordType,
  provider: DoHProvider = 'google',
): Promise<DoHResponse> {
  const endpoint = DOH_ENDPOINTS[provider];
  const typeCode = DNS_RECORD_TYPES[recordType];

  // Build query URL
  const url = `${endpoint}?name=${encodeURIComponent(domain)}&type=${typeCode}`;

  // Prepare headers (Cloudflare requires Accept header)
  const headers: HeadersInit = {};
  if (provider === 'cloudflare') {
    headers['Accept'] = 'application/dns-json';
  }

  try {
    const response = await fetch(url, {
      headers,
      credentials: 'omit', // Don't send cookies
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`DoH query failed: ${response.status} ${response.statusText} (${provider})`);
    }

    const data: DoHResponse = await response.json();

    // Check DNS status code
    if (data.Status !== 0) {
      const statusName = DNS_STATUS_CODES[data.Status] || `Unknown (${data.Status})`;
      throw new Error(`DNS error: ${statusName}`);
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`DoH query failed: ${String(error)}`);
  }
}

/**
 * Resolve DNS with automatic failover between providers
 *
 * This function attempts to query the primary provider, and if it fails,
 * automatically falls back to the alternate provider.
 *
 * @param domain - Domain name to query
 * @param recordType - DNS record type to query
 * @param options - Query options
 * @returns DoH response with DNS records
 * @throws Error if both providers fail
 */
export async function resolveDNS(
  domain: string,
  recordType: DNSRecordType,
  options?: {
    /** Primary DoH provider (defaults to 'google') */
    provider?: DoHProvider;
    /** Enable automatic failover to alternate provider (defaults to true) */
    fallback?: boolean;
  },
): Promise<DoHResponse> {
  const primaryProvider = options?.provider || 'google';
  const useFallback = options?.fallback !== false;

  try {
    // Try primary provider
    return await queryDoH(domain, recordType, primaryProvider);
  } catch (primaryError) {
    if (!useFallback) {
      throw primaryError;
    }

    // Automatic failover to alternate provider
    const fallbackProvider: DoHProvider = primaryProvider === 'google' ? 'cloudflare' : 'google';

    try {
      return await queryDoH(domain, recordType, fallbackProvider);
    } catch (fallbackError) {
      // Both providers failed - throw error with details
      throw new Error(
        `DNS query failed on both providers. Primary (${primaryProvider}): ${primaryError instanceof Error ? primaryError.message : String(primaryError)}. Fallback (${fallbackProvider}): ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
      );
    }
  }
}

/**
 * Lookup all common DNS record types for a domain
 *
 * This convenience function queries multiple record types in parallel
 * and returns all available records.
 *
 * @param domain - Domain name to query
 * @param options - Query options (applied to all queries)
 * @returns Object with all record types and their results
 */
export async function lookupAll(
  domain: string,
  options?: {
    provider?: DoHProvider;
    fallback?: boolean;
  },
): Promise<Record<string, DoHResponse['Answer']>> {
  const types: DNSRecordType[] = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'SOA'];
  const results: Record<string, DoHResponse['Answer']> = {};

  // Query all record types in parallel
  await Promise.allSettled(
    types.map(async (type) => {
      try {
        const response = await resolveDNS(domain, type, options);
        results[type.toLowerCase()] = response.Answer || [];
      } catch {
        // Record type might not exist or query failed - store empty array
        results[type.toLowerCase()] = [];
      }
    }),
  );

  return results;
}

/**
 * Format DoH response for display
 *
 * Helper function to extract and format DNS records from DoH response.
 *
 * @param response - DoH response
 * @returns Array of formatted DNS records
 */
export function formatDoHResponse(response: DoHResponse): Array<{
  name: string;
  type: string;
  ttl: number;
  value: string;
}> {
  if (!response.Answer || response.Answer.length === 0) {
    return [];
  }

  return response.Answer.map((record) => ({
    name: record.name,
    type:
      Object.keys(DNS_RECORD_TYPES).find(
        (key) => DNS_RECORD_TYPES[key as DNSRecordType] === record.type,
      ) || String(record.type),
    ttl: record.TTL,
    value: record.data,
  }));
}

/**
 * Check if a domain exists (performs A record lookup)
 *
 * @param domain - Domain name to check
 * @param options - Query options
 * @returns true if domain exists, false otherwise
 */
export async function domainExists(
  domain: string,
  options?: {
    provider?: DoHProvider;
    fallback?: boolean;
  },
): Promise<boolean> {
  try {
    const response = await resolveDNS(domain, 'A', options);
    return (response.Answer && response.Answer.length > 0) || false;
  } catch (error) {
    // NXDOMAIN or other DNS error means domain doesn't exist
    return false;
  }
}
