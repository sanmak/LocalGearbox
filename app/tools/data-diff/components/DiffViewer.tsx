/**
 * DiffViewer - Display diff results with color coding
 */

import { useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DiffResult, CsvDiffResult, SchemaChange, DiffChange } from '@/lib/tools/comparators';

interface DiffViewerProps {
  result: DiffResult | CsvDiffResult | null;
  highlightIndex?: number;
  isProcessing?: boolean;
}

export function DiffViewer({ result, highlightIndex = -1, isProcessing = false }: DiffViewerProps) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const [showOnlyChanges, setShowOnlyChanges] = useState(true);
  const [wrapLines, setWrapLines] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyChange = async (change: DiffChange, index: number) => {
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
  };

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
      <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground bg-muted/10">
        <p className="text-sm">Click &quot;Compare&quot; to see differences</p>
      </div>
    );
  }

  // Filter based on showOnlyChanges toggle
  const displayChanges = showOnlyChanges
    ? result.changes.filter((c) => c.type !== 'unchanged')
    : result.changes;

  if (displayChanges.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground bg-muted/10">
        <p className="text-sm font-medium mb-1">No differences found</p>
        <p className="text-xs">The data is identical</p>
      </div>
    );
  }

  // Check if result has schema changes (CSV format)
  const csvResult = result as CsvDiffResult;
  const hasSchemaChanges = csvResult?.schemaChanges && csvResult.schemaChanges.length > 0;

  const formatSchemaChange = (change: SchemaChange): string => {
    switch (change.type) {
      case 'column_added':
        return `Column added: "${change.column}" at position ${change.rightIndex! + 1}`;
      case 'column_deleted':
        return `Column deleted: "${change.column}" (was at position ${change.leftIndex! + 1})`;
      case 'column_reordered':
        return `Column reordered: "${change.column}" moved from position ${change.leftIndex! + 1} to ${change.rightIndex! + 1}`;
      case 'column_type_changed':
        return `Column type changed: "${change.column}" from ${change.oldType} to ${change.newType}`;
      case 'column_renamed':
        return `Column renamed: "${change.column}" (confidence: ${Math.round((change.confidence || 0) * 100)}%)`;
      default:
        return `Unknown change type for column "${change.column}"`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Differences</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-only-changes"
                checked={showOnlyChanges}
                onCheckedChange={setShowOnlyChanges}
              />
              <Label htmlFor="show-only-changes" className="text-xs cursor-pointer">
                Only changes
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="wrap-lines" checked={wrapLines} onCheckedChange={setWrapLines} />
              <Label htmlFor="wrap-lines" className="text-xs cursor-pointer">
                Wrap lines
              </Label>
            </div>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 font-mono text-xs space-y-1">
          {/* CSV Schema Changes Section */}
          {hasSchemaChanges && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-blue-700 dark:text-blue-400">
              <h3 className="text-sm font-semibold mb-2">Schema Changes</h3>
              <ul className="text-xs space-y-1">
                {csvResult.schemaChanges!.map((change, idx) => (
                  <li
                    key={idx}
                    className={cn(
                      'flex items-start gap-2',
                      change.type === 'column_added' && 'text-green-600 dark:text-green-400',
                      change.type === 'column_deleted' && 'text-red-600 dark:text-red-400',
                      change.type === 'column_reordered' && 'text-yellow-600 dark:text-yellow-400',
                      change.type === 'column_renamed' && 'text-purple-600 dark:text-purple-400',
                      change.type === 'column_type_changed' &&
                        'text-orange-600 dark:text-orange-400',
                    )}
                  >
                    <span className="shrink-0 font-bold">
                      {change.type === 'column_added' && '+'}
                      {change.type === 'column_deleted' && '-'}
                      {change.type === 'column_reordered' && '↔'}
                      {change.type === 'column_renamed' && '→'}
                      {change.type === 'column_type_changed' && '⚠'}
                    </span>
                    <span>{formatSchemaChange(change)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {displayChanges.map((change, idx) => (
            <div
              key={idx}
              ref={idx === highlightIndex ? highlightRef : null}
              className={cn(
                'px-3 py-2 rounded border transition-all group relative',
                change.type === 'added' &&
                  'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
                change.type === 'deleted' &&
                  'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
                change.type === 'modified' &&
                  'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
                idx === highlightIndex && 'ring-2 ring-primary ring-offset-2',
              )}
            >
              <div className="flex items-start gap-4">
                {/* Line numbers */}
                <div className="flex gap-2 text-muted-foreground shrink-0">
                  <span className="w-8 text-right">{change.leftLineNumber ?? '-'}</span>
                  <span className="w-8 text-right">{change.rightLineNumber ?? '-'}</span>
                </div>

                {/* Change indicator */}
                <div className="shrink-0 font-bold">
                  {change.type === 'added' && '+'}
                  {change.type === 'deleted' && '-'}
                  {change.type === 'modified' && '~'}
                </div>

                {/* Content */}
                <div
                  className={cn('flex-1', wrapLines ? 'break-words' : 'break-all overflow-x-auto')}
                >
                  {change.type === 'modified' ? (
                    <div className="space-y-1">
                      <div className="text-red-700 dark:text-red-400">
                        <span className="text-xs text-muted-foreground mr-2">-</span>
                        {change.leftContent}
                      </div>
                      <div className="text-green-700 dark:text-green-400">
                        <span className="text-xs text-muted-foreground mr-2">+</span>
                        {change.rightContent}
                      </div>
                    </div>
                  ) : (
                    <div>{change.leftContent || change.rightContent}</div>
                  )}
                </div>

                {/* Copy button (visible on hover) */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyChange(change, idx)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 shrink-0"
                  aria-label="Copy change"
                >
                  {copiedIndex === idx ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
