/**
 * DiffNavigation - Navigate between changes and export results
 */

import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Copy, Download, Check, FileText } from 'lucide-react';
import { useState } from 'react';
import type { DiffResult } from '@/lib/tools/comparators';

interface DiffNavigationProps {
  result: DiffResult | null;
  currentIndex: number;
  onNavigate: (index: number) => void;
  onCopy: () => void;
  onDownload: () => void;
  onDownloadPatch?: () => void;
  format?: 'json' | 'csv' | 'text';
}

export function DiffNavigation({
  result,
  currentIndex,
  onNavigate,
  onCopy,
  onDownload,
  onDownloadPatch,
  format = 'json',
}: DiffNavigationProps) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const changes = result.changes.filter((c) => c.type !== 'unchanged');
  const totalChanges = changes.length;

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalChanges - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {totalChanges > 0 && (
        <>
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} / {totalChanges}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            aria-label="Previous change"
            className="h-7 px-2"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex === totalChanges - 1}
            aria-label="Next change"
            className="h-7 px-2"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        aria-label="Copy diff summary"
        className="h-7 px-2"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDownload}
        aria-label="Download diff report"
        className="h-7 px-2"
      >
        <Download className="h-4 w-4" />
      </Button>
      {format === 'text' && onDownloadPatch && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownloadPatch}
          aria-label="Download unified diff patch"
          className="h-7 px-2"
        >
          <FileText className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
