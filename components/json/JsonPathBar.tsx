/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON Path Bar - Breadcrumb navigation for JSON paths
 * Inspired by JSON Hero's path bar with clickable segments
 */

import { useCallback, useMemo, useState, Fragment } from 'react';

// Icons
function HomeIcon(): React.JSX.Element {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function ChevronRightIcon(): React.JSX.Element {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CopyIcon(): React.JSX.Element {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon(): React.JSX.Element {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

interface PathSegment {
  key: string;
  path: string;
  isArray: boolean;
  index?: number;
}

export interface JsonPathBarProps {
  path: string;
  data?: unknown;
  onNavigate?: (path: string) => void;
  onCopyPath?: (path: string) => void;
  className?: string;
  showCopyButton?: boolean;
  showRoot?: boolean;
}

export function JsonPathBar({
  path,
  data,
  onNavigate,
  onCopyPath,
  className = '',
  showCopyButton = true,
  showRoot = true,
}: JsonPathBarProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  // Parse path into segments
  const segments = useMemo((): PathSegment[] => {
    if (!path || path === 'root') return [];

    const parts: PathSegment[] = [];
    let currentPath = '';

    // Split by dots but handle array indices
    const pathParts = path.split('.');

    for (const part of pathParts) {
      if (!part) continue;

      // Check if this is an array index like [0] or just a number
      const arrayMatch = part.match(/^\[?(\d+)\]?$/);

      if (arrayMatch) {
        currentPath += (currentPath ? '.' : '') + part.replace(/[\[\]]/g, '');
        parts.push({
          key: `[${arrayMatch[1]}]`,
          path: currentPath,
          isArray: true,
          index: parseInt(arrayMatch[1]),
        });
      } else {
        currentPath += (currentPath ? '.' : '') + part;
        parts.push({
          key: part,
          path: currentPath,
          isArray: false,
        });
      }
    }

    return parts;
  }, [path]);

  // Get value type at a specific path
  const getValueAtPath = useCallback(
    (targetPath: string): unknown => {
      if (!data || !targetPath) return data;

      const parts = targetPath.split('.');
      let current: unknown = data;

      for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        const key = part.replace(/[\[\]]/g, '');
        current = (current as Record<string, unknown>)[key];
      }

      return current;
    },
    [data],
  );

  // Handle segment click
  const handleSegmentClick = useCallback(
    (segmentPath: string) => {
      if (onNavigate) {
        onNavigate(segmentPath);
      }
    },
    [onNavigate],
  );

  // Handle root click
  const handleRootClick = useCallback(() => {
    if (onNavigate) {
      onNavigate('');
    }
  }, [onNavigate]);

  // Handle copy
  const handleCopy = useCallback(async () => {
    const pathToCopy = path || 'root';
    try {
      await navigator.clipboard.writeText(pathToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onCopyPath) {
        onCopyPath(pathToCopy);
      }
    } catch (error) {
      console.error('Failed to copy path:', error);
    }
  }, [path, onCopyPath]);

  return (
    <div
      className={`flex items-center gap-1 px-3 py-2 bg-surface-secondary border border-border rounded-lg overflow-x-auto ${className}`}
    >
      {/* Root */}
      {showRoot && (
        <button
          onClick={handleRootClick}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-surface transition-colors shrink-0"
          title="Go to root"
        >
          <HomeIcon />
          <span className="text-sm font-medium text-text-secondary">root</span>
        </button>
      )}

      {/* Segments */}
      {segments.map((segment, index) => {
        const value = getValueAtPath(segment.path);
        const valueType = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
        const _isLast = index === segments.length - 1;

        return (
          <Fragment key={segment.path}>
            <span className="text-text-tertiary shrink-0">
              <ChevronRightIcon />
            </span>
            <button
              onClick={() => handleSegmentClick(segment.path)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors shrink-0 ${
                _isLast
                  ? 'bg-accent/10 text-accent'
                  : 'hover:bg-surface text-text-secondary hover:text-text-primary'
              }`}
              title={`Navigate to ${segment.path}`}
            >
              <span className={`text-sm font-mono ${_isLast ? 'font-medium' : ''}`}>
                {segment.key}
              </span>
              {_isLast && (
                <span
                  className={`px-1 py-0.5 rounded text-[10px] font-medium ${
                    valueType === 'object'
                      ? 'bg-purple-500/20 text-purple-500'
                      : valueType === 'array'
                        ? 'bg-blue-500/20 text-blue-500'
                        : valueType === 'string'
                          ? 'bg-green-500/20 text-green-500'
                          : valueType === 'number'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : valueType === 'boolean'
                              ? 'bg-orange-500/20 text-orange-500'
                              : 'bg-gray-500/20 text-gray-500'
                  }`}
                >
                  {valueType}
                </span>
              )}
            </button>
          </Fragment>
        );
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Copy button */}
      {showCopyButton && path && (
        <button
          onClick={handleCopy}
          className={`p-1.5 rounded transition-colors shrink-0 ${
            copied
              ? 'text-green-500 bg-green-500/10'
              : 'text-text-tertiary hover:text-text-primary hover:bg-surface'
          }`}
          title={copied ? 'Copied!' : 'Copy path'}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      )}
    </div>
  );
}

export default JsonPathBar;
