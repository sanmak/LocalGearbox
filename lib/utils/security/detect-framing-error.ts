/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

export type FramingErrorType =
  | 'X_FRAME_OPTIONS'
  | 'CSP'
  | 'SECURITY_POLICY'
  | 'NETWORK'
  | 'UNKNOWN';

export interface FramingError {
  type: FramingErrorType;
  url: string;
  message: string;
}

/**
 * Detects if an iframe is blocked by X-Frame-Options or CSP frame-ancestors
 *
 * This function attempts to access the iframe's contentDocument to determine
 * if the site allows framing. If access is blocked, it indicates a security
 * policy is in place.
 *
 * @param iframe - The HTMLIFrameElement to check
 * @param url - The URL being loaded in the iframe
 * @returns FramingError object if blocked, null if allowed
 */
export function detectFramingBlock(iframe: HTMLIFrameElement, url: string): FramingError | null {
  try {
    // Attempt to access iframe document
    const doc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!doc) {
      // Document is null - likely blocked by X-Frame-Options or CSP
      return {
        type: 'X_FRAME_OPTIONS',
        url,
        message: 'Site blocks embedding via X-Frame-Options or CSP frame-ancestors',
      };
    }

    // If we can access the document, check if it loaded successfully
    // An empty or error document might indicate a block
    const htmlElement = doc.documentElement;
    if (!htmlElement || htmlElement.innerHTML.trim() === '') {
      return {
        type: 'SECURITY_POLICY',
        url,
        message: 'Site may be blocked by security policy',
      };
    }

    // Successfully accessed - no framing block detected
    return null;
  } catch (error) {
    // DOMException or SecurityError: Blocked by security policy
    if (error instanceof DOMException) {
      if (error.name === 'SecurityError') {
        return {
          type: 'CSP',
          url,
          message: 'Blocked by Content Security Policy (CSP) frame-ancestors directive',
        };
      }
    }

    // Network or other error
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('network') || message.includes('load')) {
        return {
          type: 'NETWORK',
          url,
          message: 'Network error or page load failed',
        };
      }
    }

    // Unknown error type
    return {
      type: 'UNKNOWN',
      url,
      message: 'Unknown error loading iframe',
    };
  }
}

/**
 * Creates an event handler for iframe onError events
 *
 * This is useful for detecting load failures that might be due to
 * security policies or network issues.
 *
 * @param url - The URL being loaded
 * @param onError - Callback function to handle the error
 * @returns Event handler function
 */
export function createIframeErrorHandler(
  url: string,
  onError: (error: FramingError) => void,
): () => void {
  return () => {
    onError({
      type: 'UNKNOWN',
      url,
      message: 'Failed to load page in iframe',
    });
  };
}

/**
 * Creates an event handler for iframe onLoad events with framing detection
 *
 * This handler checks if the iframe successfully loaded and whether it's
 * accessible (not blocked by security policies).
 *
 * @param iframe - The iframe element
 * @param url - The URL being loaded
 * @param onBlock - Callback when framing is blocked
 * @param onSuccess - Optional callback when framing succeeds
 * @returns Event handler function
 */
export function createIframeLoadHandler(
  iframe: HTMLIFrameElement,
  url: string,
  onBlock: (error: FramingError) => void,
  onSuccess?: () => void,
): () => void {
  return () => {
    // Small delay to ensure iframe has fully loaded
    setTimeout(() => {
      const framingError = detectFramingBlock(iframe, url);

      if (framingError) {
        onBlock(framingError);
      } else if (onSuccess) {
        onSuccess();
      }
    }, 100);
  };
}

export interface EducationContent {
  title: string;
  message: string;
  reason: string;
  technicalDetails?: string;
  alternatives: Array<{
    title: string;
    description: string;
    icon?: 'external-link' | 'smartphone' | 'tablet' | 'camera';
  }>;
  learnMoreUrl: string;
}

/**
 * Generates educational content for framing errors
 *
 * @param url - The URL that was blocked
 * @param errorType - The type of framing error detected
 * @returns Educational content object with explanations and alternatives
 */
export function generateFramingEducation(
  url: string,
  errorType: FramingErrorType = 'X_FRAME_OPTIONS',
): EducationContent {
  const domain = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'this website';
    }
  })();

  const technicalDetailsMap: Record<FramingErrorType, string> = {
    X_FRAME_OPTIONS: `This website has set the X-Frame-Options header:

Possible values:
- X-Frame-Options: DENY
- X-Frame-Options: SAMEORIGIN

This header prevents the site from being embedded in iframes to protect
against clickjacking attacks.`,

    CSP: `This website has set a Content Security Policy (CSP):

CSP frame-ancestors directive:
- frame-ancestors 'none'
- frame-ancestors 'self'

This modern alternative to X-Frame-Options provides comprehensive
protection against injection attacks.`,

    SECURITY_POLICY: `This website uses security policies to prevent iframe embedding.
These policies protect users from clickjacking and UI redressing attacks.`,

    NETWORK: `The page failed to load due to a network error. This may not be
related to security policies.`,

    UNKNOWN: `The iframe could not be loaded. This may be due to security
policies, network issues, or the page not existing.`,
  };

  return {
    title: 'Website Blocks Iframe Embedding',
    message: `${domain} prevents embedding in iframes for security.`,
    reason:
      'This website has configured security headers to block clickjacking attacks and protect user interactions.',
    technicalDetails: technicalDetailsMap[errorType],
    alternatives: [
      {
        title: 'Open in new tab and resize browser',
        description: 'Open the URL in a new tab and manually resize your browser window',
        icon: 'external-link',
      },
      {
        title: 'Use Browser DevTools',
        description: 'Press F12 → Click device toolbar → Select device size',
        icon: 'smartphone',
      },
      {
        title: 'Test on real devices',
        description: 'Use actual phones/tablets or emulators for accurate testing',
        icon: 'tablet',
      },
      {
        title: 'Screenshot services',
        description: 'Use BrowserStack, LambdaTest for visual testing',
        icon: 'camera',
      },
    ],
    learnMoreUrl: '/learn/web-security#x-frame-options',
  };
}
