/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Network tools - DNS-over-HTTPS utilities
 *
 * All DNS tools now use DNS-over-HTTPS (DoH) for client-side lookups.
 * Benefits:
 * - 100% client-side (no data through our servers)
 * - Encrypted DNS queries (HTTPS)
 * - Better privacy (direct to provider)
 * - Automatic failover between providers
 */

// Export DNS-over-HTTPS functions
export {
  queryDoH,
  resolveDNS,
  lookupAll,
  formatDoHResponse,
  domainExists,
  type DNSRecordType,
  type DoHProvider,
  type DoHResponse,
} from './dns-doh';

/**
 * Placeholder functions for tool registry
 * These tools use dedicated UI pages and don't follow the standard input/output pattern
 */

/**
 * Executes API request (implemented in API Client page)
 */
export const executeApiRequest = async (_input: string): Promise<string> => {
  return JSON.stringify({ message: 'Use API Client page' });
};

/**
 * DNS analysis (implemented in DNS Analysis page)
 */
export const dnsAnalysis = async (_input: string): Promise<string> => {
  return JSON.stringify({ message: 'Use DNS Analysis page' });
};

/**
 * MX lookup (implemented in MX Lookup page)
 */
export const mxLookup = async (_input: string): Promise<string> => {
  return JSON.stringify({ message: 'Use MX Lookup page' });
};

/**
 * SOA lookup (implemented in SOA Lookup page)
 */
export const soaLookup = async (_input: string): Promise<string> => {
  return JSON.stringify({ message: 'Use SOA Lookup page' });
};

/**
 * Reverse DNS lookup (implemented in Reverse DNS Lookup page)
 */
export const reverseDnsLookup = async (_input: string): Promise<string> => {
  return JSON.stringify({ message: 'Use Reverse DNS Lookup page' });
};

/**
 * Name server lookup (implemented in Name Server Lookup page)
 */
export const nameServerLookup = async (_input: string): Promise<string> => {
  return JSON.stringify({ message: 'Use Name Server Lookup page' });
};
