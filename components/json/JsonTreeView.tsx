/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON Tree View Component
 * Enhanced expandable tree view for JSON data with:
 * - Keyboard navigation (arrow keys)
 * - Copy node functionality
 * - Type badges
 * - Value previews
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from './icons';

// Type badge colors
const TYPE_COLORS: Record<string, string> = {
  object: 'bg-purple-500/20 text-purple-500',
  array: 'bg-blue-500/20 text-blue-500',
  string: 'bg-green-500/20 text-green-500',
  number: 'bg-yellow-500/20 text-yellow-500',
  boolean: 'bg-orange-500/20 text-orange-500',
  null: 'bg-gray-500/20 text-gray-500',
};

// Get value type
const getType = (value: unknown): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

// Type Badge Component
const TypeBadge: React.FC<{ value: unknown }> = ({ value }) => {
  const type = getType(value);
  return (
    <span className={`px-1 py-0.5 rounded text-[10px] font-medium ml-2 ${TYPE_COLORS[type]}`}>
      {type}
    </span>
  );
};

// Copy Icon
const CopyNodeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

// Check Icon
const CheckNodeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export interface TreeNodeProps {
  keyName: string | number;
  value: unknown;
  depth: number;
  isLast: boolean;
  expandedPaths: Set<string>;
  togglePath: (path: string) => void;
  path: string;
  selectedPath?: string;
  focusedPath?: string;
  onSelect?: (_path: string, _value: unknown, _key: string) => void;
  onFocus?: (_path: string) => void;
  showTypeBadge?: boolean;
  showCopyButton?: boolean;
}

const getValueColor = (value: unknown): string => {
  if (value === null) return 'text-gray-500 dark:text-gray-400';
  if (typeof value === 'boolean') return 'text-purple-600 dark:text-purple-400';
  if (typeof value === 'number') return 'text-blue-600 dark:text-blue-400';
  if (typeof value === 'string') return 'text-green-700 dark:text-green-400';
  return 'text-text-primary';
};

const getValueDisplay = (value: unknown): string => {
  if (value === null) return 'null';
  if (typeof value === 'string') {
    const display = value.length > 50 ? value.substring(0, 50) + '...' : value;
    return `"${display}"`;
  }
  return String(value);
};

export const TreeNode: React.FC<TreeNodeProps> = ({
  keyName,
  value,
  depth,
  expandedPaths,
  togglePath,
  path,
  selectedPath,
  focusedPath,
  onSelect,
  onFocus,
  showTypeBadge = true,
  showCopyButton = true,
}) => {
  const [copied, setCopied] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const isObject = typeof value === 'object' && value !== null;
  const isArray = Array.isArray(value);
  const isExpanded = expandedPaths.has(path);
  const isSelected = selectedPath === path;
  const isFocused = focusedPath === path;

  const itemCount = isObject ? Object.keys(value).length : 0;

  // Scroll into view when focused
  useEffect(() => {
    if (isFocused && nodeRef.current) {
      nodeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isFocused]);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isObject) {
        togglePath(path);
      }
    },
    [isObject, togglePath, path],
  );

  const handleClick = useCallback(() => {
    if (onFocus) {
      onFocus(path);
    }
    if (onSelect) {
      onSelect(path, value, String(keyName));
    }
  }, [onSelect, onFocus, path, value, keyName]);

  const handleDoubleClick = useCallback(() => {
    if (isObject) {
      togglePath(path);
    }
  }, [isObject, togglePath, path]);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const text = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    },
    [value],
  );

  return (
    <div className="font-mono text-sm">
      <div
        ref={nodeRef}
        className={`flex items-center gap-1 py-0.5 rounded cursor-pointer transition-colors group ${
          isSelected
            ? 'bg-accent/20 ring-1 ring-accent/50'
            : isFocused
              ? 'bg-surface-secondary ring-1 ring-border'
              : 'hover:bg-surface-secondary/50'
        }`}
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        data-path={path}
      >
        {isObject && (
          <span
            className="w-4 h-4 flex items-center justify-center text-text-tertiary hover:text-text-primary"
            onClick={handleToggle}
          >
            {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </span>
        )}
        {!isObject && <span className="w-4" />}

        <span className="text-cyan-700 dark:text-cyan-400">
          {typeof keyName === 'string' ? `"${keyName}"` : `[${keyName}]`}
        </span>
        <span className="text-text-secondary dark:text-text-tertiary">:</span>

        {isObject ? (
          <>
            <span className="text-gray-600 dark:text-text-tertiary">{isArray ? '[' : '{'}</span>
            {!isExpanded && (
              <>
                <span className="text-gray-500 dark:text-text-tertiary text-xs">
                  {itemCount} {isArray ? 'items' : 'fields'}
                </span>
                <span className="text-gray-600 dark:text-text-tertiary">{isArray ? ']' : '}'}</span>
              </>
            )}
          </>
        ) : (
          <span className={getValueColor(value)}>{getValueDisplay(value)}</span>
        )}

        {showTypeBadge && !isExpanded && <TypeBadge value={value} />}

        {/* Copy button - visible on hover */}
        {showCopyButton && (
          <button
            onClick={handleCopy}
            className={`ml-auto mr-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
              copied ? 'text-green-500' : 'text-text-tertiary hover:text-text-primary'
            }`}
            title={copied ? 'Copied!' : 'Copy value'}
          >
            {copied ? <CheckNodeIcon /> : <CopyNodeIcon />}
          </button>
        )}
      </div>

      {isObject && isExpanded && (
        <>
          {Object.entries(value as object).map(([k, v], i, arr) => (
            <TreeNode
              key={k}
              keyName={isArray ? i : k}
              value={v}
              depth={depth + 1}
              isLast={i === arr.length - 1}
              expandedPaths={expandedPaths}
              togglePath={togglePath}
              path={`${path}.${k}`}
              selectedPath={selectedPath}
              focusedPath={focusedPath}
              onSelect={onSelect}
              onFocus={onFocus}
              showTypeBadge={showTypeBadge}
              showCopyButton={showCopyButton}
            />
          ))}
          <div
            style={{ paddingLeft: `${depth * 16}px` }}
            className="text-gray-600 dark:text-text-tertiary"
          >
            {isArray ? ']' : '}'}
          </div>
        </>
      )}
    </div>
  );
};

export interface JsonTreeViewProps {
  data: unknown;
  expandedPaths: Set<string>;
  onTogglePath: (path: string) => void;
  selectedPath?: string;
  onSelect?: (path: string, value: unknown, key: string) => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  className?: string;
  showTypeBadges?: boolean;
  showCopyButtons?: boolean;
  enableKeyboardNav?: boolean;
}

export function JsonTreeView({
  data,
  expandedPaths,
  onTogglePath,
  selectedPath,
  onSelect,
  className = '',
  showTypeBadges = true,
  showCopyButtons = true,
  enableKeyboardNav = true,
}: JsonTreeViewProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedPath, setFocusedPath] = useState<string | undefined>(undefined);

  const isArray = Array.isArray(data);
  const rootPath = 'root';

  // Memoize the initial expanded state
  const isRootExpanded = useMemo(() => expandedPaths.has(rootPath), [expandedPaths]);

  // Get all visible paths for keyboard navigation
  const visiblePaths = useMemo(() => {
    const paths: string[] = [];

    const traverse = (obj: unknown, path: string) => {
      paths.push(path);

      if (obj !== null && typeof obj === 'object' && expandedPaths.has(path)) {
        Object.entries(obj).forEach(([key]) => {
          traverse((obj as Record<string, unknown>)[key], `${path}.${key}`);
        });
      }
    };

    if (data !== null && typeof data === 'object') {
      traverse(data, rootPath);
    }

    return paths;
  }, [data, expandedPaths]);

  // Get value at path
  const getValueAtPath = useCallback(
    (targetPath: string): unknown => {
      if (targetPath === rootPath) return data;

      const parts = targetPath.split('.').slice(1); // Remove 'root'
      let current: unknown = data;

      for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = (current as Record<string, unknown>)[part];
      }

      return current;
    },
    [data],
  );

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNav) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        !containerRef.current?.contains(document.activeElement as Node) &&
        document.activeElement !== containerRef.current
      ) {
        return;
      }

      const currentIndex = focusedPath ? visiblePaths.indexOf(focusedPath) : -1;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < visiblePaths.length - 1) {
            const nextPath = visiblePaths[currentIndex + 1];
            setFocusedPath(nextPath);
          } else if (currentIndex === -1 && visiblePaths.length > 0) {
            setFocusedPath(visiblePaths[0]);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setFocusedPath(visiblePaths[currentIndex - 1]);
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (focusedPath) {
            const value = getValueAtPath(focusedPath);
            if (value !== null && typeof value === 'object' && !expandedPaths.has(focusedPath)) {
              onTogglePath(focusedPath);
            }
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (focusedPath) {
            if (expandedPaths.has(focusedPath)) {
              // Collapse current node
              onTogglePath(focusedPath);
            } else {
              // Go to parent
              const parts = focusedPath.split('.');
              if (parts.length > 1) {
                const parentPath = parts.slice(0, -1).join('.');
                setFocusedPath(parentPath);
              }
            }
          }
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedPath && onSelect) {
            const value = getValueAtPath(focusedPath);
            const key = focusedPath.split('.').pop() || '';
            onSelect(focusedPath, value, key);
          }
          break;

        case 'c':
          if (e.metaKey || e.ctrlKey) {
            if (focusedPath) {
              const value = getValueAtPath(focusedPath);
              const text =
                typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
              navigator.clipboard.writeText(text);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enableKeyboardNav,
    focusedPath,
    visiblePaths,
    expandedPaths,
    onTogglePath,
    onSelect,
    getValueAtPath,
  ]);

  if (data === null || typeof data !== 'object') {
    return (
      <div className={`font-mono text-sm p-2 ${className}`}>
        <span className={getValueColor(data)}>{getValueDisplay(data)}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto focus:outline-none ${className}`}
      tabIndex={0}
    >
      <div className="font-mono text-sm p-2">
        <div
          className={`flex items-center gap-1 py-0.5 cursor-pointer hover:bg-surface-secondary/50 rounded group ${
            focusedPath === rootPath ? 'bg-surface-secondary ring-1 ring-border' : ''
          }`}
          onClick={() => {
            setFocusedPath(rootPath);
            onTogglePath(rootPath);
          }}
          data-path={rootPath}
        >
          <span className="w-4 h-4 flex items-center justify-center text-text-tertiary">
            {isRootExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </span>
          <span className="text-gray-600 dark:text-text-tertiary">{isArray ? '[' : '{'}</span>
          {!isRootExpanded && (
            <>
              <span className="text-gray-500 dark:text-text-tertiary text-xs">
                {Object.keys(data).length} {isArray ? 'items' : 'fields'}
              </span>
              <span className="text-gray-600 dark:text-text-tertiary">{isArray ? ']' : '}'}</span>
            </>
          )}
          {showTypeBadges && !isRootExpanded && <TypeBadge value={data} />}
        </div>

        {isRootExpanded && (
          <>
            {Object.entries(data).map(([k, v], i, arr) => (
              <TreeNode
                key={k}
                keyName={isArray ? i : k}
                value={v}
                depth={1}
                isLast={i === arr.length - 1}
                expandedPaths={expandedPaths}
                togglePath={onTogglePath}
                path={`${rootPath}.${k}`}
                selectedPath={selectedPath}
                focusedPath={focusedPath}
                onSelect={onSelect}
                onFocus={setFocusedPath}
                showTypeBadge={showTypeBadges}
                showCopyButton={showCopyButtons}
              />
            ))}
            <div className="text-gray-600 dark:text-text-tertiary">{isArray ? ']' : '}'}</div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Hook for managing tree expansion state
 */
export const useTreeExpansion = (initialExpanded = true) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(initialExpanded ? ['root'] : []),
  );

  const togglePath = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback((data: unknown, maxDepth = 10) => {
    const paths = new Set<string>(['root']);

    const traverse = (obj: unknown, path: string, depth: number) => {
      if (depth >= maxDepth || obj === null || typeof obj !== 'object') return;

      paths.add(path);

      if (Array.isArray(obj)) {
        obj.forEach((_, i) => {
          traverse(obj[i], `${path}.${i}`, depth + 1);
        });
      } else {
        Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
          traverse(value, `${path}.${key}`, depth + 1);
        });
      }
    };

    traverse(data, 'root', 0);
    setExpandedPaths(paths);
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  return {
    expandedPaths,
    togglePath,
    expandAll,
    collapseAll,
    setExpandedPaths,
  };
};

export default JsonTreeView;
