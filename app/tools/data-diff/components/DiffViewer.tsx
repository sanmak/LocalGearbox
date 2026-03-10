/**
 * DiffViewer - Comprehensive diff visualization with inline and side-by-side modes
 * Supports color-coded additions, deletions, modifications, and CSV schema changes
 */

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Copy,
  Check,
  Plus,
  Minus,
  RefreshCw,
  Equal,
  Columns2,
  AlignJustify,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DiffResult, DiffChange } from '@/lib/tools/comparators';
import type { CsvDiffResult } from '@/lib/tools/comparators';
import type { SchemaChange } from '@/lib/tools/comparators';

type ViewMode = 'inline' | 'side-by-side';

interface DiffViewerProps {
  result: DiffResult | CsvDiffResult | null;
  highlightIndex?: number;
  isProcessing?: boolean;
}

export function DiffViewer({ result, highlightIndex = -1, isProcessing = false }: DiffViewerProps) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const [showOnlyChanges, setShowOnlyChanges] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('inline');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyChange = useCallback(async (change: DiffChange, index: number) => {
    let textToCopy = '';

    if (change.type === 'modified') {
      textToCopy = `- ${change.leftContent || ''}\n+ ${change.rightContent || ''}`;
    } else if (change.type === 'added') {
      textToCopy = `+ ${change.rightContent || ''}`;
    } else if (change.type === 'deleted') {
      textToCopy = `- ${change.leftContent || ''}`;
    } else {
      textToCopy = change.leftContent || change.rightContent || '';
    }

    await navigator.clipboard.writeText(textToCopy);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  // Scroll to highlighted change
  useEffect(() => {
    if (highlightIndex >= 0 && highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightIndex]);

  if (isProcessing) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground bg-muted/10">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <p className="text-sm font-medium">Comparing data...</p>
        <p className="text-xs mt-1">This may take a moment for large files</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground bg-muted/10 gap-3">
        <div className="flex items-center gap-2 text-muted-foreground/60">
          <Columns2 className="h-10 w-10" />
        </div>
        <p className="text-sm font-medium">Paste data on both sides</p>
        <p className="text-xs text-muted-foreground/60">
          Then click &quot;Compare&quot; to see differences
        </p>
      </div>
    );
  }

  const { stats } = result;
  const totalChanges = stats.additions + stats.deletions + stats.modifications;

  // Filter based on showOnlyChanges toggle
  const displayChanges = showOnlyChanges
    ? result.changes.filter((c) => c.type !== 'unchanged')
    : result.changes;

  // Track the highlight index relative to displayed changes
  const changesOnly = result.changes.filter((c) => c.type !== 'unchanged');
  const highlightedChange =
    highlightIndex >= 0 && highlightIndex < changesOnly.length ? changesOnly[highlightIndex] : null;

  // Check if result has schema changes (CSV format)
  const csvResult = result as CsvDiffResult;
  const hasSchemaChanges = csvResult?.schemaChanges && csvResult.schemaChanges.length > 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with stats and controls */}
      <div className="px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium">Differences</h2>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="h-7" aria-label="Select diff view mode">
                <TabsTrigger
                  value="inline"
                  className="h-6 px-2 text-xs gap-1"
                  aria-label="Inline diff view"
                >
                  <AlignJustify className="h-3 w-3" />
                  Inline
                </TabsTrigger>
                <TabsTrigger
                  value="side-by-side"
                  className="h-6 px-2 text-xs gap-1"
                  aria-label="Side by side diff view"
                >
                  <Columns2 className="h-3 w-3" />
                  Split
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <DiffStatBadge
            icon={<Plus className="h-3 w-3" />}
            count={stats.additions}
            label="added"
            colorClass="text-green-600 dark:text-green-400 bg-green-500/10"
          />
          <DiffStatBadge
            icon={<Minus className="h-3 w-3" />}
            count={stats.deletions}
            label="deleted"
            colorClass="text-red-600 dark:text-red-400 bg-red-500/10"
          />
          <DiffStatBadge
            icon={<RefreshCw className="h-3 w-3" />}
            count={stats.modifications}
            label="modified"
            colorClass="text-amber-600 dark:text-amber-400 bg-amber-500/10"
          />
          <DiffStatBadge
            icon={<Equal className="h-3 w-3" />}
            count={stats.unchanged}
            label="unchanged"
            colorClass="text-muted-foreground bg-muted/50"
          />

          <div className="flex-1" />

          {/* Toggle controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Switch
                id="show-only-changes"
                checked={showOnlyChanges}
                onCheckedChange={setShowOnlyChanges}
                aria-label="Show only changes"
              />
              <Label htmlFor="show-only-changes" className="text-xs cursor-pointer">
                Changes only
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Switch
                id="wrap-lines"
                checked={wrapLines}
                onCheckedChange={setWrapLines}
                aria-label="Wrap long lines"
              />
              <Label htmlFor="wrap-lines" className="text-xs cursor-pointer">
                Wrap
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      {totalChanges === 0 && !hasSchemaChanges ? (
        <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground bg-muted/10 gap-2">
          <Check className="h-8 w-8 text-green-500" />
          <p className="text-sm font-medium">No differences found</p>
          <p className="text-xs">The inputs are identical</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1 font-mono text-xs">
            {/* CSV Schema Changes Section */}
            {hasSchemaChanges && <SchemaChangesSection changes={csvResult.schemaChanges!} />}

            {/* Diff content based on view mode */}
            {viewMode === 'inline' ? (
              <InlineDiffView
                changes={displayChanges}
                highlightedChange={highlightedChange}
                highlightRef={highlightRef}
                wrapLines={wrapLines}
                copiedIndex={copiedIndex}
                onCopyChange={handleCopyChange}
              />
            ) : (
              <SideBySideDiffView
                changes={displayChanges}
                highlightedChange={highlightedChange}
                highlightRef={highlightRef}
                wrapLines={wrapLines}
                copiedIndex={copiedIndex}
                onCopyChange={handleCopyChange}
              />
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

function DiffStatBadge({
  icon,
  count,
  label,
  colorClass,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  colorClass: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn('h-6 gap-1 px-2 text-xs font-mono border-0', colorClass)}
      aria-label={`${count} ${label}`}
    >
      {icon}
      {count}
    </Badge>
  );
}

function SchemaChangesSection({ changes }: { changes: SchemaChange[] }) {
  const formatSchemaChange = (change: SchemaChange): string => {
    switch (change.type) {
      case 'column_added':
        return `Column added: "${change.column}" at position ${(change.rightIndex ?? 0) + 1}`;
      case 'column_deleted':
        return `Column deleted: "${change.column}" (was at position ${(change.leftIndex ?? 0) + 1})`;
      case 'column_reordered':
        return `Column reordered: "${change.column}" moved from position ${(change.leftIndex ?? 0) + 1} to ${(change.rightIndex ?? 0) + 1}`;
      case 'column_type_changed':
        return `Column type changed: "${change.column}" from ${change.oldType} to ${change.newType}`;
      case 'column_renamed':
        return `Column renamed: "${change.column}" (confidence: ${Math.round((change.confidence || 0) * 100)}%)`;
      default:
        return `Schema change for column "${change.column}"`;
    }
  };

  const getSchemaIcon = (type: SchemaChange['type']): string => {
    switch (type) {
      case 'column_added':
        return '+';
      case 'column_deleted':
        return '-';
      case 'column_reordered':
        return '\u2194';
      case 'column_renamed':
        return '\u2192';
      case 'column_type_changed':
        return '\u26A0';
      default:
        return '\u2022';
    }
  };

  return (
    <div
      className="mb-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md"
      role="region"
      aria-label="Schema changes"
    >
      <h3 className="text-sm font-semibold mb-2 text-blue-700 dark:text-blue-400">
        Schema Changes
      </h3>
      <ul className="text-xs space-y-1">
        {changes.map((change, idx) => (
          <li
            key={idx}
            className={cn(
              'flex items-start gap-2',
              change.type === 'column_added' && 'text-green-600 dark:text-green-400',
              change.type === 'column_deleted' && 'text-red-600 dark:text-red-400',
              change.type === 'column_reordered' && 'text-yellow-600 dark:text-yellow-400',
              change.type === 'column_renamed' && 'text-purple-600 dark:text-purple-400',
              change.type === 'column_type_changed' && 'text-orange-600 dark:text-orange-400',
            )}
          >
            <span className="shrink-0 font-bold w-4 text-center">{getSchemaIcon(change.type)}</span>
            <span>{formatSchemaChange(change)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Inline (Unified) Diff View ---------- */

interface DiffViewSharedProps {
  changes: DiffChange[];
  highlightedChange: DiffChange | null;
  highlightRef: React.RefObject<HTMLDivElement | null>;
  wrapLines: boolean;
  copiedIndex: number | null;
  onCopyChange: (change: DiffChange, index: number) => void;
}

function InlineDiffView({
  changes,
  highlightedChange,
  highlightRef,
  wrapLines,
  copiedIndex,
  onCopyChange,
}: DiffViewSharedProps) {
  return (
    <div role="table" aria-label="Diff results">
      {changes.map((change, idx) => {
        const isHighlighted = change === highlightedChange;

        return (
          <div
            key={idx}
            ref={isHighlighted ? highlightRef : null}
            role="row"
            className={cn(
              'flex items-stretch border-b border-border/30 group transition-colors',
              change.type === 'added' && 'bg-green-500/5 hover:bg-green-500/10',
              change.type === 'deleted' && 'bg-red-500/5 hover:bg-red-500/10',
              change.type === 'modified' && 'bg-amber-500/5 hover:bg-amber-500/10',
              change.type === 'unchanged' && 'bg-transparent hover:bg-muted/30',
              isHighlighted && 'ring-1 ring-primary ring-inset',
            )}
          >
            {/* Left line number */}
            <div
              role="cell"
              className="w-10 shrink-0 text-right pr-1 py-1 text-muted-foreground/50 select-none border-r border-border/20"
              aria-label={
                change.leftLineNumber ? `Left line ${change.leftLineNumber}` : 'No left line'
              }
            >
              {change.leftLineNumber ?? ''}
            </div>

            {/* Right line number */}
            <div
              role="cell"
              className="w-10 shrink-0 text-right pr-1 py-1 text-muted-foreground/50 select-none border-r border-border/20"
              aria-label={
                change.rightLineNumber ? `Right line ${change.rightLineNumber}` : 'No right line'
              }
            >
              {change.rightLineNumber ?? ''}
            </div>

            {/* Change type indicator */}
            <div
              role="cell"
              className={cn(
                'w-6 shrink-0 text-center py-1 font-bold select-none',
                change.type === 'added' && 'text-green-600 dark:text-green-400',
                change.type === 'deleted' && 'text-red-600 dark:text-red-400',
                change.type === 'modified' && 'text-amber-600 dark:text-amber-400',
                change.type === 'unchanged' && 'text-muted-foreground/30',
              )}
              aria-label={change.type}
            >
              {change.type === 'added' && '+'}
              {change.type === 'deleted' && '-'}
              {change.type === 'modified' && '~'}
              {change.type === 'unchanged' && ' '}
            </div>

            {/* Content */}
            <div
              role="cell"
              className={cn(
                'flex-1 py-1 pr-2 min-w-0',
                wrapLines ? 'break-words whitespace-pre-wrap' : 'overflow-x-auto whitespace-pre',
              )}
            >
              {change.type === 'modified' ? (
                <div className="space-y-0.5">
                  <div className="text-red-600 dark:text-red-400">
                    <span className="text-muted-foreground/50 mr-1 select-none">-</span>
                    {change.leftContent}
                  </div>
                  <div className="text-green-600 dark:text-green-400">
                    <span className="text-muted-foreground/50 mr-1 select-none">+</span>
                    {change.rightContent}
                  </div>
                </div>
              ) : (
                <span
                  className={cn(
                    change.type === 'added' && 'text-green-700 dark:text-green-400',
                    change.type === 'deleted' && 'text-red-700 dark:text-red-400',
                    change.type === 'unchanged' && 'text-foreground/70',
                  )}
                >
                  {change.leftContent || change.rightContent}
                </span>
              )}
            </div>

            {/* Copy button */}
            {change.type !== 'unchanged' && (
              <div className="shrink-0 flex items-center pr-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopyChange(change, idx)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  aria-label="Copy this change"
                >
                  {copiedIndex === idx ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Side-by-Side Diff View ---------- */

function SideBySideDiffView({
  changes,
  highlightedChange,
  highlightRef,
  wrapLines,
  copiedIndex,
  onCopyChange,
}: DiffViewSharedProps) {
  // Build paired rows for side-by-side display
  const rows = buildSideBySideRows(changes);

  return (
    <div className="flex min-w-0" role="table" aria-label="Side-by-side diff">
      {/* Left side */}
      <div className="flex-1 min-w-0 border-r border-border/40">
        <div
          className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/30 border-b border-border/30 sticky top-0"
          role="columnheader"
        >
          Original
        </div>
        {rows.map((row, idx) => {
          const isHighlighted = row.change === highlightedChange;

          return (
            <div
              key={`left-${idx}`}
              ref={isHighlighted ? highlightRef : null}
              role="row"
              className={cn(
                'flex items-stretch border-b border-border/20 min-h-[24px] group',
                row.leftType === 'deleted' && 'bg-red-500/8 hover:bg-red-500/15',
                row.leftType === 'modified' && 'bg-amber-500/8 hover:bg-amber-500/15',
                row.leftType === 'unchanged' && 'hover:bg-muted/30',
                row.leftType === 'empty' && 'bg-muted/10',
                isHighlighted && 'ring-1 ring-primary ring-inset',
              )}
            >
              <div
                role="cell"
                className="w-10 shrink-0 text-right pr-1 py-0.5 text-muted-foreground/40 select-none border-r border-border/20"
              >
                {row.leftLineNumber ?? ''}
              </div>
              <div
                role="cell"
                className={cn(
                  'w-5 shrink-0 text-center py-0.5 font-bold select-none',
                  row.leftType === 'deleted' && 'text-red-500 dark:text-red-400',
                  row.leftType === 'modified' && 'text-amber-500 dark:text-amber-400',
                )}
              >
                {row.leftType === 'deleted' && '-'}
                {row.leftType === 'modified' && '~'}
              </div>
              <div
                role="cell"
                className={cn(
                  'flex-1 py-0.5 pr-1 min-w-0',
                  wrapLines ? 'break-words whitespace-pre-wrap' : 'overflow-x-auto whitespace-pre',
                  row.leftType === 'deleted' && 'text-red-700 dark:text-red-400',
                  row.leftType === 'modified' && 'text-amber-700 dark:text-amber-400',
                  row.leftType === 'unchanged' && 'text-foreground/70',
                  row.leftType === 'empty' && 'text-transparent',
                )}
              >
                {row.leftContent ?? ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Right side */}
      <div className="flex-1 min-w-0">
        <div
          className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/30 border-b border-border/30 sticky top-0"
          role="columnheader"
        >
          Modified
        </div>
        {rows.map((row, idx) => {
          const isHighlighted = row.change === highlightedChange;

          return (
            <div
              key={`right-${idx}`}
              role="row"
              className={cn(
                'flex items-stretch border-b border-border/20 min-h-[24px] group',
                row.rightType === 'added' && 'bg-green-500/8 hover:bg-green-500/15',
                row.rightType === 'modified' && 'bg-amber-500/8 hover:bg-amber-500/15',
                row.rightType === 'unchanged' && 'hover:bg-muted/30',
                row.rightType === 'empty' && 'bg-muted/10',
                isHighlighted && 'ring-1 ring-primary ring-inset',
              )}
            >
              <div
                role="cell"
                className="w-10 shrink-0 text-right pr-1 py-0.5 text-muted-foreground/40 select-none border-r border-border/20"
              >
                {row.rightLineNumber ?? ''}
              </div>
              <div
                role="cell"
                className={cn(
                  'w-5 shrink-0 text-center py-0.5 font-bold select-none',
                  row.rightType === 'added' && 'text-green-500 dark:text-green-400',
                  row.rightType === 'modified' && 'text-amber-500 dark:text-amber-400',
                )}
              >
                {row.rightType === 'added' && '+'}
                {row.rightType === 'modified' && '~'}
              </div>
              <div
                role="cell"
                className={cn(
                  'flex-1 py-0.5 pr-1 min-w-0',
                  wrapLines ? 'break-words whitespace-pre-wrap' : 'overflow-x-auto whitespace-pre',
                  row.rightType === 'added' && 'text-green-700 dark:text-green-400',
                  row.rightType === 'modified' && 'text-amber-700 dark:text-amber-400',
                  row.rightType === 'unchanged' && 'text-foreground/70',
                  row.rightType === 'empty' && 'text-transparent',
                )}
              >
                {row.rightContent ?? ''}
              </div>

              {/* Copy button for changed rows */}
              {row.change && row.change.type !== 'unchanged' && (
                <div className="shrink-0 flex items-center pr-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopyChange(row.change!, idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
                    aria-label="Copy this change"
                  >
                    {copiedIndex === idx ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Side-by-side row builder ---------- */

type SideBySideRowType = 'added' | 'deleted' | 'modified' | 'unchanged' | 'empty';

interface SideBySideRow {
  leftLineNumber: number | null;
  leftContent: string | null;
  leftType: SideBySideRowType;
  rightLineNumber: number | null;
  rightContent: string | null;
  rightType: SideBySideRowType;
  change: DiffChange | null;
}

function buildSideBySideRows(changes: DiffChange[]): SideBySideRow[] {
  const rows: SideBySideRow[] = [];

  for (const change of changes) {
    switch (change.type) {
      case 'unchanged':
        rows.push({
          leftLineNumber: change.leftLineNumber ?? null,
          leftContent: change.leftContent ?? null,
          leftType: 'unchanged',
          rightLineNumber: change.rightLineNumber ?? null,
          rightContent: change.rightContent ?? null,
          rightType: 'unchanged',
          change,
        });
        break;

      case 'modified':
        rows.push({
          leftLineNumber: change.leftLineNumber ?? null,
          leftContent: change.leftContent ?? null,
          leftType: 'modified',
          rightLineNumber: change.rightLineNumber ?? null,
          rightContent: change.rightContent ?? null,
          rightType: 'modified',
          change,
        });
        break;

      case 'deleted':
        rows.push({
          leftLineNumber: change.leftLineNumber ?? null,
          leftContent: change.leftContent ?? null,
          leftType: 'deleted',
          rightLineNumber: null,
          rightContent: null,
          rightType: 'empty',
          change,
        });
        break;

      case 'added':
        rows.push({
          leftLineNumber: null,
          leftContent: null,
          leftType: 'empty',
          rightLineNumber: change.rightLineNumber ?? null,
          rightContent: change.rightContent ?? null,
          rightType: 'added',
          change,
        });
        break;
    }
  }

  return rows;
}
