/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { SecurityErrorMessage, SecurityErrorMessageProps } from './SecurityErrorMessage';

export interface FramingErrorPanelProps {
  url: string;
  errorType?: 'X_FRAME_OPTIONS' | 'CSP' | 'SECURITY_POLICY' | 'UNKNOWN';
}

export function FramingErrorPanel({ url, errorType = 'X_FRAME_OPTIONS' }: FramingErrorPanelProps) {
  const domain = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'this website';
    }
  })();

  const technicalDetailsMap = {
    X_FRAME_OPTIONS: `This website has set the X-Frame-Options header to prevent iframe embedding:

Possible header values:
- X-Frame-Options: DENY (cannot be embedded anywhere)
- X-Frame-Options: SAMEORIGIN (can only be embedded by same domain)
- X-Frame-Options: ALLOW-FROM https://example.com (deprecated)

This header protects users from clickjacking attacks where malicious sites overlay
invisible iframes to trick users into clicking on unintended elements.`,

    CSP: `This website has set a Content Security Policy (CSP) that blocks iframe embedding:

CSP frame-ancestors directive:
- frame-ancestors 'none' (equivalent to X-Frame-Options: DENY)
- frame-ancestors 'self' (equivalent to X-Frame-Options: SAMEORIGIN)
- frame-ancestors https://trusted-site.com (only specific sites can embed)

CSP is the modern, more flexible alternative to X-Frame-Options and provides
comprehensive protection against various injection attacks.`,

    SECURITY_POLICY: `This website uses security policies (X-Frame-Options or CSP frame-ancestors)
to prevent embedding in iframes. These policies protect users from:

- Clickjacking attacks (invisible overlays that steal clicks)
- UI redressing (misleading interface elements)
- Credential theft (fake login overlays)
- Unauthorized actions (tricking users into unwanted operations)

The exact policy used by ${domain} cannot be determined, but it effectively
blocks iframe embedding for security reasons.`,

    UNKNOWN: `The website could not be loaded in an iframe. This may be due to:

- X-Frame-Options header blocking framing
- Content Security Policy frame-ancestors directive
- Network connectivity issues
- The page does not exist or returned an error

Security policies are the most common reason for this error. Websites use
these policies to protect their users from clickjacking and other attacks.`,
  };

  const errorProps: SecurityErrorMessageProps = {
    type: 'x-frame-options',
    title: 'Website Blocks Iframe Embedding',
    message: `${domain} prevents embedding in iframes for security purposes.`,
    reason: `This website has configured security headers (X-Frame-Options or CSP frame-ancestors) to block clickjacking attacks. Clickjacking is when a malicious site overlays an invisible iframe to trick users into clicking on unintended elements, potentially stealing credentials or performing unauthorized actions.`,
    url,
    technicalDetails: technicalDetailsMap[errorType],
    alternatives: [
      {
        title: 'Open in a new browser tab and resize',
        description:
          'Right-click the URL and select "Open in New Tab", then manually resize your browser window to test different viewport sizes. Simple and effective.',
        icon: 'external-link',
      },
      {
        title: 'Use Browser DevTools responsive mode',
        description:
          'Press F12 to open DevTools, then click the device toolbar icon (Ctrl+Shift+M or Cmd+Shift+M) to toggle responsive design mode with preset device sizes.',
        icon: 'smartphone',
      },
      {
        title: 'Test on real devices or emulators',
        description:
          'Use actual smartphones, tablets, or device emulators (Android Studio, Xcode Simulator) for the most accurate responsive testing.',
        icon: 'tablet',
      },
      {
        title: 'Use screenshot and testing services',
        description:
          'Services like BrowserStack, LambdaTest, or browser screenshot tools can capture how sites look at different viewport sizes without iframe limitations.',
        icon: 'camera',
      },
    ],
    learnMoreUrl: '/learn/web-security#x-frame-options',
  };

  return <SecurityErrorMessage {...errorProps} />;
}
