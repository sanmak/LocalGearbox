/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Shared DNS validation and security utilities
 * Used by all DNS-related API endpoints to prevent SSRF and validate inputs
 */

// Private IP ranges (RFC 1918)
export const privateIPRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.)/;

// IP literal pattern
export const ipLiteralRegex = /^(\d{1,3}\.){3}\d{1,3}$/;

// Blocked hostnames (cloud metadata endpoints, localhost, etc.)
export const blockedHostnames = new Set([
  'localhost',
  'metadata',
  '169.254.169.254',
  'metadata.google.internal',
  '168.63.129.16', // Azure metadata
  'instance-data.ec2.internal', // AWS metadata
]);

/**
 * Validates and sanitizes a domain name for DNS queries
 * Prevents SSRF attacks by blocking private IPs and internal hostnames
 */
export const assertSafeDomain = (domain: string): string => {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) {
    throw new Error('Domain cannot be empty');
  }

  // Disallow direct IP literals and common internal hosts
  if (ipLiteralRegex.test(normalized) || blockedHostnames.has(normalized)) {
    throw new Error('Domain not allowed for security reasons');
  }

  // Basic domain validation (RFC 1035)
  const domainRegex = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?:\.(?!-)[a-z0-9-]{1,63})+$/i;
  if (!domainRegex.test(normalized)) {
    throw new Error('Invalid domain format');
  }

  // Block obvious private network hostnames
  if (
    normalized.endsWith('.internal') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.localhost')
  ) {
    throw new Error('Private/internal domains are not allowed');
  }

  // Prevent private IP patterns (best-effort on hostname strings)
  if (privateIPRegex.test(normalized)) {
    throw new Error('Private IP ranges are not allowed');
  }

  return normalized;
};

/**
 * Validates an IP address for reverse DNS lookups
 * Blocks private IPs and metadata endpoints
 */
export const assertSafeIP = (ip: string): string => {
  const normalized = ip.trim();
  if (!normalized) {
    throw new Error('IP address cannot be empty');
  }

  // Validate IP format
  if (!ipLiteralRegex.test(normalized)) {
    throw new Error('Invalid IP address format');
  }

  // Block private IPs
  if (privateIPRegex.test(normalized)) {
    throw new Error('Private IP ranges are not allowed');
  }

  // Block specific dangerous IPs
  if (blockedHostnames.has(normalized)) {
    throw new Error('IP address not allowed for security reasons');
  }

  // Block localhost
  if (normalized.startsWith('127.') || normalized === '0.0.0.0') {
    throw new Error('Localhost IPs are not allowed');
  }

  return normalized;
};

/**
 * Wraps a promise with a timeout
 * Prevents DNS queries from hanging indefinitely
 */
export const withTimeout = async <T>(promise: Promise<T>, ms = 5000): Promise<T> => {
  return await Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('DNS query timed out')), ms)),
  ]);
};
