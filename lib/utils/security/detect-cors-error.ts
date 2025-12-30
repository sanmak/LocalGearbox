/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Detects if an error is a CORS (Cross-Origin Resource Sharing) error
 *
 * CORS errors typically manifest as TypeError with specific message patterns
 * when the browser blocks a cross-origin request due to missing or incorrect
 * CORS headers from the server.
 *
 * @param error - The error object to check
 * @returns true if the error is likely a CORS error
 */
export function isCorsError(error: unknown): boolean {
  if (!(error instanceof TypeError) && !(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  // Common CORS error message patterns across browsers
  const corsPatterns = [
    'failed to fetch', // Chrome, Edge
    'networkerror', // Firefox
    'load failed', // Safari
    'cors', // Explicit CORS mention
    'cross-origin', // Cross-origin mention
    'not allowed by access-control-allow-origin', // Specific CORS header
  ];

  return corsPatterns.some((pattern) => message.includes(pattern));
}

/**
 * Categorizes network errors to help distinguish between CORS, network, and other issues
 *
 * @param error - The error object to categorize
 * @returns Category of the error
 */
export function categorizeNetworkError(
  error: unknown,
): 'cors' | 'network' | 'timeout' | 'aborted' | 'unknown' {
  if (!(error instanceof Error)) {
    return 'unknown';
  }

  const message = error.message.toLowerCase();

  // Check for CORS first (most specific)
  if (isCorsError(error)) {
    return 'cors';
  }

  // Check for timeout
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout';
  }

  // Check for aborted requests
  if (message.includes('aborted') || message.includes('cancelled')) {
    return 'aborted';
  }

  // Check for general network errors
  if (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('offline')
  ) {
    return 'network';
  }

  return 'unknown';
}

export interface EducationContent {
  title: string;
  message: string;
  reason: string;
  technicalDetails?: string;
  alternatives: Array<{
    title: string;
    description: string;
    icon?: 'server' | 'package' | 'terminal' | 'settings' | 'external-link';
  }>;
  learnMoreUrl: string;
}

/**
 * Generates educational content for CORS errors
 *
 * @param url - The URL that was blocked by CORS
 * @param origin - Optional origin making the request (defaults to window.location.origin)
 * @returns Educational content object with explanations and alternatives
 */
export function generateCorsEducation(url: string, origin?: string): EducationContent {
  const targetOrigin = (() => {
    try {
      return new URL(url).origin;
    } catch {
      return url;
    }
  })();

  const currentOrigin =
    origin || (typeof window !== 'undefined' ? window.location.origin : 'your origin');

  return {
    title: 'Cross-Origin Request Blocked',
    message: `The API at ${targetOrigin} does not allow requests from web browsers.`,
    reason: `The server has not configured CORS headers to allow requests from ${currentOrigin}. This is a browser security feature that prevents unauthorized cross-origin access.`,
    technicalDetails: `When making cross-origin requests from a browser, the server must include:

Access-Control-Allow-Origin: ${currentOrigin}

The server at ${targetOrigin} did not include this header, so the browser blocked the request.

Additional headers that may be required:
- Access-Control-Allow-Methods: GET, POST, PUT, DELETE
- Access-Control-Allow-Headers: Content-Type, Authorization
- Access-Control-Allow-Credentials: true (if sending cookies)`,
    alternatives: [
      {
        title: 'Use the API from your backend',
        description:
          'Make requests from Node.js, Python, or any server-side code. CORS only applies to browsers.',
        icon: 'server',
      },
      {
        title: 'Use official SDK/client library',
        description:
          'Many APIs provide JavaScript SDKs that handle authentication and CORS properly.',
        icon: 'package',
      },
      {
        title: 'Test with Postman or curl',
        description: 'Desktop tools bypass browser CORS restrictions and are perfect for testing.',
        icon: 'terminal',
      },
      {
        title: 'Configure CORS on your server',
        description:
          'If you control the API, add Access-Control-Allow-Origin header to allow your origin.',
        icon: 'settings',
      },
    ],
    learnMoreUrl: '/learn/web-security#cors',
  };
}
