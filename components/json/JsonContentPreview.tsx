/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON Content Preview Component
 * Preview content with type detection (dates, colors, URLs, images, etc.)
 */

import { detectContentType, getContentTypeLabel } from '@/lib/json';
import { CalendarIcon, ImageIcon, ColorIcon, LinkIcon, ExternalLinkIcon } from './icons';

export interface JsonContentPreviewProps {
  value: unknown;
  path?: string;
  onFindRelated?: (_key: string) => void;
  className?: string;
}

export function JsonContentPreview({
  value,
  path = '',
  onFindRelated,
  className = '',
}: JsonContentPreviewProps): React.JSX.Element {
  const contentInfo = detectContentType(value);
  const { type } = contentInfo;
  const key = path.split('.').pop() || '';

  // Date preview
  if (type === 'date' && typeof value === 'string') {
    const isUnix = /^\d{10,13}$/.test(value);
    const actualDate = isUnix
      ? new Date(parseInt(value) > 9999999999 ? parseInt(value) : parseInt(value) * 1000)
      : new Date(value);

    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-accent">
          <CalendarIcon />
          <span className="font-medium">{getContentTypeLabel(type)}</span>
        </div>
        <div className="text-lg font-semibold text-text-primary">
          {actualDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
        <div className="text-sm text-text-secondary">{actualDate.toLocaleTimeString()}</div>
        <div className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-text-tertiary">ISO 8601</span>
            <code className="text-text-primary font-mono">{actualDate.toISOString()}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-text-tertiary">Unix (s)</span>
            <code className="text-text-primary font-mono">
              {Math.floor(actualDate.getTime() / 1000)}
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-text-tertiary">Unix (ms)</span>
            <code className="text-text-primary font-mono">{actualDate.getTime()}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-text-tertiary">Relative</span>
            <span className="text-text-primary">{getRelativeTime(actualDate)}</span>
          </div>
        </div>
        {onFindRelated && key && (
          <button
            onClick={() => onFindRelated(key)}
            className="mt-3 text-xs text-accent hover:underline"
          >
            Find all &quot;{key}&quot; values →
          </button>
        )}
      </div>
    );
  }

  // Image preview
  if (type === 'image' && typeof value === 'string') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-accent">
          <ImageIcon />
          <span className="font-medium">{getContentTypeLabel(type)}</span>
        </div>
        <div className="rounded-lg overflow-hidden border border-border bg-surface-secondary">
          <img
            src={value}
            alt="Preview"
            className="max-w-full h-auto max-h-48 object-contain mx-auto"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:underline truncate block flex items-center gap-1"
        >
          <ExternalLinkIcon />
          Open in new tab
        </a>
      </div>
    );
  }

  // Color preview
  if (type === 'color' && typeof value === 'string') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-accent">
          <ColorIcon />
          <span className="font-medium">{getContentTypeLabel(type)}</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-16 h-16 rounded-lg border border-border shadow-sm"
            style={{ backgroundColor: value }}
          />
          <div>
            <code className="text-lg font-mono text-text-primary block">{value}</code>
            {value.startsWith('#') && (
              <span className="text-xs text-text-tertiary">RGB: {hexToRgb(value)}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // URL preview
  if (type === 'url' && typeof value === 'string') {
    const url = new URL(value);
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-accent">
          <LinkIcon />
          <span className="font-medium">{getContentTypeLabel(type)}</span>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-text-tertiary text-xs">Host</span>
            <div className="text-text-primary font-medium">{url.host}</div>
          </div>
          <div>
            <span className="text-text-tertiary text-xs">Path</span>
            <div className="text-text-primary font-mono text-xs">{url.pathname}</div>
          </div>
          {url.search && (
            <div>
              <span className="text-text-tertiary text-xs">Query</span>
              <div className="text-text-primary font-mono text-xs break-all">{url.search}</div>
            </div>
          )}
        </div>
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
        >
          <ExternalLinkIcon />
          Open link
        </a>
      </div>
    );
  }

  // Email preview
  if (type === 'email' && typeof value === 'string') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-accent">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="font-medium">{getContentTypeLabel(type)}</span>
        </div>
        <div className="text-lg font-medium text-text-primary">{value}</div>
        <a
          href={`mailto:${value}`}
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
        >
          Send email →
        </a>
      </div>
    );
  }

  // UUID preview
  if (type === 'uuid' && typeof value === 'string') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-accent">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <span className="font-medium">{getContentTypeLabel(type)}</span>
        </div>
        <code className="text-sm font-mono text-text-primary block bg-surface-secondary p-2 rounded">
          {value}
        </code>
        <div className="text-xs text-text-tertiary">
          Version: {value.charAt(14)} | Variant: {getUuidVariant(value)}
        </div>
      </div>
    );
  }

  // Default preview for other types
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-accent">
        <span className="font-medium">{getContentTypeLabel(type)}</span>
      </div>
      {path && (
        <div className="text-xs text-text-tertiary font-mono bg-surface-secondary px-2 py-1 rounded">
          {path}
        </div>
      )}
      <div className="text-sm text-text-primary break-all">
        {typeof value === 'string' ? (
          <span className="text-green-600 dark:text-green-400">&quot;{value}&quot;</span>
        ) : typeof value === 'number' ? (
          <span className="text-blue-600 dark:text-blue-400">{value}</span>
        ) : typeof value === 'boolean' ? (
          <span className="text-purple-600 dark:text-purple-400">{String(value)}</span>
        ) : value === null ? (
          <span className="text-gray-500">null</span>
        ) : (
          String(value)
        )}
      </div>
      {onFindRelated && key && (
        <button
          onClick={() => onFindRelated(key)}
          className="mt-2 text-xs text-accent hover:underline"
        >
          Find all &quot;{key}&quot; values →
        </button>
      )}
    </div>
  );
}

// Helper functions
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.abs(diff / 1000);
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const months = days / 30;
  const years = days / 365;

  const suffix = diff > 0 ? 'ago' : 'from now';

  if (seconds < 60) return `${Math.floor(seconds)} seconds ${suffix}`;
  if (minutes < 60) return `${Math.floor(minutes)} minutes ${suffix}`;
  if (hours < 24) return `${Math.floor(hours)} hours ${suffix}`;
  if (days < 30) return `${Math.floor(days)} days ${suffix}`;
  if (months < 12) return `${Math.floor(months)} months ${suffix}`;
  return `${Math.floor(years)} years ${suffix}`;
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return hex;
}

function getUuidVariant(uuid: string): string {
  const variant = uuid.charAt(19).toLowerCase();
  if ('89ab'.includes(variant)) return 'RFC 4122';
  if ('cd'.includes(variant)) return 'Microsoft';
  return 'Unknown';
}

export default JsonContentPreview;
