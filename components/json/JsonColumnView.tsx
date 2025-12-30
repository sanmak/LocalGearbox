/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON Column View - macOS Finder-style column navigation
 * Inspired by JSON Hero's column view for intuitive JSON exploration
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// Type badge component
function TypeBadge({ type }: { type: string }): React.JSX.Element {
  const colors: Record<string, string> = {
    object: 'bg-purple-500/20 text-purple-500',
    array: 'bg-blue-500/20 text-blue-500',
    string: 'bg-green-500/20 text-green-500',
    number: 'bg-yellow-500/20 text-yellow-500',
    boolean: 'bg-orange-500/20 text-orange-500',
    null: 'bg-gray-500/20 text-gray-500',
  };

  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[type] || colors.string}`}
    >
      {type}
    </span>
  );
}

// Get value type
const getType = (value: unknown): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

// Get display value for primitives
const getDisplayValue = (value: unknown): string => {
  if (value === null) return 'null';
  if (typeof value === 'string') {
    if (value.length > 30) return `"${value.substring(0, 30)}..."`;
    return `"${value}"`;
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
};

// Check if value is navigable (object or array with items)
const isNavigable = (value: unknown): boolean => {
  if (value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return false;
};

// Get item count for containers
const getItemCount = (value: unknown): number => {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'object' && value !== null) return Object.keys(value).length;
  return 0;
};

// Format item count label
const formatItemCount = (value: unknown): string => {
  const count = getItemCount(value);
  const type = getType(value);
  if (type === 'array') return `${count} item${count !== 1 ? 's' : ''}`;
  if (type === 'object') return `${count} field${count !== 1 ? 's' : ''}`;
  return '';
};

// Chevron icon
const ChevronRightIcon = (): React.JSX.Element => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

interface ColumnItemProps {
  keyName: string | number;
  value: unknown;
  isSelected: boolean;
  isHeld: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
}

function ColumnItem({
  keyName,
  value,
  isSelected,
  isHeld,
  onClick,
  onDoubleClick,
}: ColumnItemProps): React.JSX.Element {
  const type = getType(value);
  const navigable = isNavigable(value);
  const itemCount = formatItemCount(value);

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`
        flex items-center justify-between px-3 py-2 cursor-pointer transition-colors
        ${
          isSelected
            ? 'bg-accent text-white'
            : isHeld
              ? 'bg-accent/30'
              : 'hover:bg-surface-secondary'
        }
        ${isHeld && !isSelected ? 'ring-1 ring-accent/50' : ''}
      `}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className={`font-medium truncate ${isSelected ? 'text-white' : 'text-text-primary'}`}>
          {typeof keyName === 'number' ? `[${keyName}]` : keyName}
        </span>
        {!navigable && (
          <span
            className={`truncate text-sm ${isSelected ? 'text-white/80' : 'text-text-secondary'}`}
          >
            {getDisplayValue(value)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {navigable && (
          <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-text-tertiary'}`}>
            {itemCount}
          </span>
        )}
        {!isSelected && <TypeBadge type={type} />}
        {navigable && (
          <span className={isSelected ? 'text-white' : 'text-text-tertiary'}>
            <ChevronRightIcon />
          </span>
        )}
      </div>
    </div>
  );
}

interface ColumnProps {
  data: unknown;
  path: string;
  selectedKey: string | number | null;
  heldPath: string | null;
  onSelect: (key: string | number, fullPath: string, value: unknown) => void;
  onNavigate: (key: string | number, value: unknown) => void;
  columnIndex: number;
  isLastColumn: boolean;
}

function Column({
  data,
  path,
  selectedKey,
  heldPath,
  onSelect,
  onNavigate,
  columnIndex: _columnIndex,
  isLastColumn,
}: ColumnProps): React.JSX.Element | null {
  const columnRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedKey !== null && columnRef.current) {
      const selectedElement = columnRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedKey]);

  if (data === null || typeof data !== 'object') {
    return null;
  }

  const entries = Array.isArray(data)
    ? data.map((v, i) => [i, v] as [number, unknown])
    : Object.entries(data);

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
        Empty {Array.isArray(data) ? 'array' : 'object'}
      </div>
    );
  }

  return (
    <div
      ref={columnRef}
      className={`flex-1 min-w-[250px] max-w-[350px] border-r border-border overflow-y-auto ${
        isLastColumn ? 'border-r-0' : ''
      }`}
    >
      {/* Column header */}
      <div className="sticky top-0 z-10 px-3 py-2 bg-surface-secondary border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-secondary truncate">{path || 'root'}</span>
          <span className="text-xs text-text-tertiary">
            {entries.length} {Array.isArray(data) ? 'items' : 'fields'}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-border/50">
        {entries.map(([key, value]) => {
          const fullPath = path ? `${path}.${key}` : String(key);
          const isSelected = selectedKey === key;
          const isHeld = heldPath !== null && fullPath.startsWith(heldPath);

          return (
            <div key={key} data-selected={isSelected}>
              <ColumnItem
                keyName={key}
                value={value}
                isSelected={isSelected}
                isHeld={isHeld}
                onClick={() => onSelect(key, fullPath, value)}
                onDoubleClick={() => {
                  if (isNavigable(value)) {
                    onNavigate(key, value);
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface JsonColumnViewProps {
  data: unknown;
  onSelect?: (path: string, value: unknown, key: string) => void;
  className?: string;
}

export function JsonColumnView({
  data,
  onSelect,
  className = '',
}: JsonColumnViewProps): React.JSX.Element {
  const initialCols = useMemo(
    () => (data !== null && typeof data === 'object' ? [{ key: null, data: data, path: '' }] : []),
    [data],
  );

  const [navigationColumns, setNavigationColumns] =
    useState<Array<{ key: string | number | null; data: unknown; path: string }>>(initialCols);

  const columns = useMemo(() => {
    if (navigationColumns.length > 0) return navigationColumns;
    return initialCols;
  }, [navigationColumns, initialCols]);

  const [selectedKeys, setSelectedKeys] = useState<(string | number | null)[]>(
    data !== null && typeof data === 'object' ? [null] : [],
  );
  const [heldPath, setHeldPath] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if data changes - actually we can handle this by using 'columns'
  // and setting 'navigationColumns' only on user interaction.
  // If data changes, 'initialCols' changes, and 'columns' useMemo returns 'initialCols'
  // because navigationColumns is reset (or should be).

  // Handle item selection
  const handleSelect = useCallback(
    (columnIndex: number, key: string | number, fullPath: string, value: unknown) => {
      // Update selected keys
      const newSelectedKeys = [...selectedKeys.slice(0, columnIndex), key];
      setSelectedKeys(newSelectedKeys);

      // If value is navigable, add new column
      if (isNavigable(value)) {
        const newColumns = [
          ...columns.slice(0, columnIndex + 1),
          { key, data: value, path: fullPath },
        ];
        setNavigationColumns(newColumns);
        // Pre-select first item if it exists
        if (Array.isArray(value) && value.length > 0) {
          newSelectedKeys.push(0);
        } else if (typeof value === 'object' && value !== null) {
          const firstKey = Object.keys(value)[0];
          if (firstKey) {
            newSelectedKeys.push(firstKey);
          }
        }
        setSelectedKeys(newSelectedKeys);
      } else {
        // Remove any columns after this one
        setNavigationColumns(columns.slice(0, columnIndex + 1));
      }

      // Clear held path
      setHeldPath(null);

      // Notify parent
      if (onSelect) {
        onSelect(fullPath, value, String(key));
      }

      // Scroll to show new column
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = containerRef.current.scrollWidth;
        }
      }, 50);
    },
    [columns, selectedKeys, onSelect],
  );

  // Handle navigation (double-click or enter)
  const handleNavigate = useCallback(
    (columnIndex: number, key: string | number, value: unknown) => {
      if (!isNavigable(value)) return;

      const currentPath = columns[columnIndex]?.path || '';
      const fullPath = currentPath ? `${currentPath}.${key}` : String(key);

      // Add new column
      const newColumns = [
        ...columns.slice(0, columnIndex + 1),
        { key, data: value, path: fullPath },
      ];
      setNavigationColumns(newColumns);

      // Update selected keys
      const newSelectedKeys = [...selectedKeys.slice(0, columnIndex), key, null];
      setSelectedKeys(newSelectedKeys);

      // Scroll to new column
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = containerRef.current.scrollWidth;
        }
      }, 50);
    },
    [columns, selectedKeys],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        !containerRef.current?.contains(document.activeElement) &&
        document.activeElement !== document.body
      ) {
        return;
      }

      const lastColumnIndex = columns.length - 1;
      const currentColumn = columns[lastColumnIndex];
      if (!currentColumn?.data) return;

      const entries = Array.isArray(currentColumn.data)
        ? currentColumn.data.map((v, i) => [i, v] as [number | string, unknown])
        : Object.entries(currentColumn.data as Record<string, unknown>);

      const currentKey = selectedKeys[lastColumnIndex];
      const currentIndex = entries.findIndex(([k, _v]) => k === currentKey);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < entries.length - 1) {
            const [nextKey, nextValue] = entries[currentIndex + 1];
            handleSelect(
              lastColumnIndex,
              nextKey,
              currentColumn.path ? `${currentColumn.path}.${nextKey}` : String(nextKey),
              nextValue,
            );
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const [prevKey, prevValue] = entries[currentIndex - 1];
            handleSelect(
              lastColumnIndex,
              prevKey,
              currentColumn.path ? `${currentColumn.path}.${prevKey}` : String(prevKey),
              prevValue,
            );
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (currentKey !== null) {
            const currentValue = entries.find(([k]) => k === currentKey)?.[1];
            if (currentValue && isNavigable(currentValue)) {
              handleNavigate(lastColumnIndex, currentKey, currentValue);
            }
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (columns.length > 1) {
            // Go back one column
            setNavigationColumns(columns.slice(0, -1));
            setSelectedKeys(selectedKeys.slice(0, -1));
          }
          break;

        case 'Alt':
          // Hold current selection
          if (currentKey !== null) {
            const fullPath = currentColumn.path
              ? `${currentColumn.path}.${currentKey}`
              : String(currentKey);
            setHeldPath(fullPath);
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setHeldPath(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [columns, selectedKeys, handleSelect, handleNavigate]);

  // Get the currently selected value for preview
  const selectedValue = useMemo(() => {
    if (columns.length === 0) return null;
    const lastCol = columns[columns.length - 1];
    const selectedKey = selectedKeys[columns.length - 1];
    if (selectedKey === null || !lastCol?.data) return null;

    if (Array.isArray(lastCol.data)) {
      return lastCol.data[selectedKey as number];
    }
    return (lastCol.data as Record<string, unknown>)[selectedKey as string];
  }, [columns, selectedKeys]);

  if (data === null || typeof data !== 'object') {
    return (
      <div className={`flex items-center justify-center p-8 text-text-tertiary ${className}`}>
        No data to display
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex overflow-x-auto ${className}`} tabIndex={0}>
      {columns.map((column, index) => (
        <Column
          key={`${column.path}-${index}`}
          data={column.data}
          path={column.path}
          selectedKey={selectedKeys[index]}
          heldPath={heldPath}
          onSelect={(key, fullPath, value) => handleSelect(index, key, fullPath, value)}
          onNavigate={(key, value) => handleNavigate(index, key, value)}
          columnIndex={index}
          isLastColumn={index === columns.length - 1}
        />
      ))}

      {/* Preview column for primitives */}
      {selectedValue !== null && !isNavigable(selectedValue) && (
        <div className="flex-1 min-w-[200px] max-w-[300px] p-4 bg-surface-secondary">
          <div className="mb-2">
            <TypeBadge type={getType(selectedValue)} />
          </div>
          <div className="font-mono text-sm break-all text-text-primary">
            {typeof selectedValue === 'string' ? (
              <span className="text-green-600 dark:text-green-400">
                &quot;{selectedValue}&quot;
              </span>
            ) : typeof selectedValue === 'number' ? (
              <span className="text-blue-600 dark:text-blue-400">{String(selectedValue)}</span>
            ) : typeof selectedValue === 'boolean' ? (
              <span className="text-purple-600 dark:text-purple-400">{String(selectedValue)}</span>
            ) : (
              <span className="text-gray-500">{String(selectedValue)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default JsonColumnView;
