/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { SecurityErrorMessage, SecurityErrorMessageProps } from './SecurityErrorMessage';

export interface CorsErrorPanelProps {
  url: string;
  origin?: string;
}

export function CorsErrorPanel({ url, origin }: CorsErrorPanelProps) {
  const targetOrigin = (() => {
    try {
      return new URL(url).origin;
    } catch {
      return 'the target server';
    }
  })();

  const currentOrigin =
    origin || (typeof window !== 'undefined' ? window.location.origin : 'your origin');

  const errorProps: SecurityErrorMessageProps = {
    type: 'cors',
    title: 'Cross-Origin Request Blocked',
    message: `The API at ${targetOrigin} does not allow requests from web browsers.`,
    reason: `The server has not configured CORS (Cross-Origin Resource Sharing) headers to allow requests from ${currentOrigin}. This is a security feature that prevents unauthorized access to APIs from untrusted origins.`,
    url,
    technicalDetails: `When making cross-origin requests from a browser, the server must include the following header in its response:

Access-Control-Allow-Origin: ${currentOrigin}
// OR
Access-Control-Allow-Origin: *  (allows all origins - not recommended for sensitive APIs)

The server at ${targetOrigin} did not include this header, so the browser blocked the request to protect your security.

Additional headers that may be required:
- Access-Control-Allow-Methods: GET, POST, PUT, DELETE
- Access-Control-Allow-Headers: Content-Type, Authorization
- Access-Control-Allow-Credentials: true (if sending cookies)`,
    alternatives: [
      {
        title: 'Make requests from your backend server',
        description:
          'Use Node.js, Python, Go, or any server-side language. CORS only applies to browser requests, so server-to-server requests work without restrictions.',
        icon: 'server',
      },
      {
        title: 'Use the official SDK or client library',
        description:
          'Many APIs provide JavaScript SDKs that handle authentication and CORS configuration properly. Check the API documentation for official libraries.',
        icon: 'package',
      },
      {
        title: 'Use Postman, Insomnia, or curl for testing',
        description:
          'Desktop API clients and command-line tools do not run in a browser context, so they bypass CORS restrictions naturally and are perfect for testing.',
        icon: 'terminal',
      },
      {
        title: 'Configure CORS on the API server (if you control it)',
        description:
          'If you own or manage the API server, add the appropriate Access-Control-Allow-Origin headers to allow requests from your client origin.',
        icon: 'settings',
      },
      {
        title: 'Contact the API provider about CORS support',
        description:
          'If the API should support browser requests but does not, reach out to the API provider and ask them to enable CORS for your origin.',
        icon: 'external-link',
      },
    ],
    learnMoreUrl: '/learn/web-security#cors',
  };

  return <SecurityErrorMessage {...errorProps} />;
}
