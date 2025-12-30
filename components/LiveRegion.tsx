/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import * as React from 'react';

/**
 * LiveRegion Component
 *
 * Provides ARIA live region for announcing dynamic content changes to screen readers.
 * Use this for status updates, notifications, and dynamic content that should be announced.
 *
 * @example
 * ```tsx
 * <LiveRegion mode="polite">{statusMessage}</LiveRegion>
 * <LiveRegion mode="assertive">{errorMessage}</LiveRegion>
 * ```
 */

interface LiveRegionProps {
  /** The content to announce */
  children: React.ReactNode;
  /** How assertive the announcement should be */
  mode?: 'polite' | 'assertive' | 'off';
  /** Whether to announce the entire region or just changes */
  atomic?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show visually (default: false, screen reader only) */
  visible?: boolean;
}

export function LiveRegion({
  children,
  mode = 'polite',
  atomic = true,
  className = '',
  visible = false,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={mode}
      aria-atomic={atomic}
      className={`${!visible ? 'sr-only' : ''} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

/**
 * VisuallyHidden Component
 *
 * Hides content visually but keeps it accessible to screen readers.
 * Useful for providing additional context that sighted users don't need.
 *
 * @example
 * ```tsx
 * <button>
 *   <TrashIcon />
 *   <VisuallyHidden>Delete item</VisuallyHidden>
 * </button>
 * ```
 */
interface VisuallyHiddenProps {
  children: React.ReactNode;
  /** Element type to render */
  as?: React.ElementType;
}

export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return <Component className="sr-only">{children}</Component>;
}

/**
 * StatusMessage Component
 *
 * Combines visual and screen reader announcements for status messages.
 * Shows a visual message and announces it to screen readers.
 *
 * @example
 * ```tsx
 * <StatusMessage mode="polite" visible>
 *   Request completed successfully
 * </StatusMessage>
 * ```
 */
interface StatusMessageProps {
  children: React.ReactNode;
  mode?: 'polite' | 'assertive';
  visible?: boolean;
  className?: string;
}

export function StatusMessage({
  children,
  mode = 'polite',
  visible = true,
  className = '',
}: StatusMessageProps) {
  return (
    <LiveRegion mode={mode} atomic={true} visible={visible} className={className}>
      {children}
    </LiveRegion>
  );
}
