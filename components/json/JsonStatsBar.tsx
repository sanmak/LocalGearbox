/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON Stats Bar Component
 * Display JSON statistics in a compact bar
 */

import { useMemo } from 'react';
import { JsonStats, calculateStats, formatSize } from '@/lib/json';

export interface JsonStatsBarProps {
  data: unknown;
  rawSize?: number;
  className?: string;
  showDetailed?: boolean;
}

export function JsonStatsBar({
  data,
  rawSize,
  className = '',
  showDetailed = false,
}: JsonStatsBarProps): React.JSX.Element | null {
  const stats = useMemo<JsonStats | null>(() => {
    if (data === null || data === undefined) return null;
    const s = calculateStats(data);
    if (rawSize !== undefined) {
      s.size = rawSize;
    }
    return s;
  }, [data, rawSize]);

  if (!stats) {
    return null;
  }

  if (showDetailed) {
    return (
      <div className={`grid grid-cols-4 gap-4 p-3 bg-surface-secondary rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-lg font-semibold text-text-primary">{formatSize(stats.size)}</div>
          <div className="text-xs text-text-tertiary">Size</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-text-primary">{stats.depth}</div>
          <div className="text-xs text-text-tertiary">Depth</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-text-primary">{stats.objects}</div>
          <div className="text-xs text-text-tertiary">Objects</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-text-primary">{stats.arrays}</div>
          <div className="text-xs text-text-tertiary">Arrays</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-text-primary">{stats.strings}</div>
          <div className="text-xs text-text-tertiary">Strings</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-text-primary">{stats.numbers}</div>
          <div className="text-xs text-text-tertiary">Numbers</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-text-primary">{stats.booleans}</div>
          <div className="text-xs text-text-tertiary">Booleans</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-text-primary">{stats.nulls}</div>
          <div className="text-xs text-text-tertiary">Nulls</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 text-xs text-text-tertiary ${className}`}>
      <span className="flex items-center gap-1">
        <span className="font-medium text-text-secondary">{formatSize(stats.size)}</span>
      </span>
      <span className="text-border">|</span>
      <span>
        Depth: <span className="text-text-secondary">{stats.depth}</span>
      </span>
      <span className="text-border">|</span>
      <span>
        <span className="text-text-secondary">{stats.objects}</span> objects
      </span>
      <span className="text-border">|</span>
      <span>
        <span className="text-text-secondary">{stats.arrays}</span> arrays
      </span>
      {stats.strings > 0 && (
        <>
          <span className="text-border">|</span>
          <span>
            <span className="text-text-secondary">{stats.strings}</span> strings
          </span>
        </>
      )}
      {stats.numbers > 0 && (
        <>
          <span className="text-border">|</span>
          <span>
            <span className="text-text-secondary">{stats.numbers}</span> numbers
          </span>
        </>
      )}
    </div>
  );
}

export default JsonStatsBar;
