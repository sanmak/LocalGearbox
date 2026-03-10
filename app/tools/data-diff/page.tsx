/**
 * Data Diff Tool - Compare JSON, CSV, and text data with forensic precision
 * Supports side-by-side and inline diff views, format auto-detection,
 * and format-specific comparison options.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UrlLoaderModal } from '@/components/UrlLoaderModal';
import {
  dataDiff,
  type DiffResult,
  type DiffOptions,
  type CsvDiffOptions,
  type JsonDiffOptions,
  detectFormatFromPair,
} from '@/lib/tools/comparators';
import { InputPanel } from './components/InputPanel';
import { DiffViewer } from './components/DiffViewer';
import { OptionsPanel } from './components/OptionsPanel';
import { DiffNavigation } from './components/DiffNavigation';
import { Loader2, FileText } from 'lucide-react';

/* ---------- Sample Data ---------- */

const SAMPLE_JSON_LEFT = `{
  "user": {
    "id": 12345,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "role": "admin",
    "created_at": "2023-01-15T10:30:00Z"
  },
  "permissions": ["read", "write", "delete"]
}`;

const SAMPLE_JSON_RIGHT = `{
  "user": {
    "id": 12345,
    "name": "Alice Johnson",
    "email": "alice@newdomain.com",
    "role": "superadmin",
    "created_at": "2023-01-15T10:30:00Z",
    "department": "Engineering"
  },
  "permissions": ["read", "write", "delete", "admin"]
}`;

const SAMPLE_TEXT_LEFT = `server.host=localhost
server.port=8080
database.url=jdbc:mysql://localhost:3306/mydb
database.user=admin
logging.level=INFO`;

const SAMPLE_TEXT_RIGHT = `server.host=0.0.0.0
server.port=8080
database.url=jdbc:mysql://db.example.com:3306/mydb
database.user=dbadmin
database.password=***REDACTED***
logging.level=DEBUG`;

const SAMPLE_CSV_LEFT = `id,name,email,role,department
1,Alice Johnson,alice@example.com,Engineer,Engineering
2,Bob Smith,bob@example.com,Designer,Design
3,Charlie Brown,charlie@example.com,Manager,Operations`;

const SAMPLE_CSV_RIGHT = `id,full_name,email,role,department,hire_date
1,Alice Johnson,alice@newdomain.com,Senior Engineer,Engineering,2023-01-15
2,Bob Smith,bob@example.com,Lead Designer,Design,2022-06-10
4,Diana Prince,diana@example.com,Engineer,Engineering,2024-01-01`;

/* ---------- Combined options type ---------- */

type CombinedOptions = DiffOptions & CsvDiffOptions & JsonDiffOptions;

/* ---------- Format label helper ---------- */

function getFormatLabel(fmt: 'json' | 'csv' | 'text'): string {
  switch (fmt) {
    case 'json':
      return 'JSON';
    case 'csv':
      return 'CSV';
    case 'text':
      return 'Text';
  }
}

/* ---------- Main Page Component ---------- */

export default function DataDiffPage() {
  // Core state
  const [leftInput, setLeftInput] = useState('');
  const [rightInput, setRightInput] = useState('');
  const [format, setFormat] = useState<'json' | 'csv' | 'text' | 'auto'>('auto');
  const [detectedFormat, setDetectedFormat] = useState<'json' | 'csv' | 'text'>('text');
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [options, setOptions] = useState<CombinedOptions>({});
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);

  // URL loading modals
  const [showLeftUrlModal, setShowLeftUrlModal] = useState(false);
  const [showRightUrlModal, setShowRightUrlModal] = useState(false);

  // File input refs
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);

  // Derived
  const effectiveFormat = format === 'auto' ? detectedFormat : format;

  // Hydration fix
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-detect format when inputs change
  useEffect(() => {
    if (format === 'auto' && leftInput && rightInput) {
      const detection = detectFormatFromPair(leftInput, rightInput);
      setDetectedFormat(detection.format);
    }
  }, [leftInput, rightInput, format]);

  /* ---------- File upload ---------- */

  const createFileUploadHandler = useCallback(
    (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setter(content);
        setError(null);
      };
      reader.onerror = () => setError('Failed to read file');
      reader.readAsText(file);
      e.target.value = '';
    },
    [],
  );

  const handleLeftFileUpload = createFileUploadHandler(setLeftInput);
  const handleRightFileUpload = createFileUploadHandler(setRightInput);

  /* ---------- Sample data ---------- */

  const getSamples = useCallback((fmt: 'json' | 'csv' | 'text') => {
    switch (fmt) {
      case 'json':
        return { left: SAMPLE_JSON_LEFT, right: SAMPLE_JSON_RIGHT };
      case 'csv':
        return { left: SAMPLE_CSV_LEFT, right: SAMPLE_CSV_RIGHT };
      case 'text':
        return { left: SAMPLE_TEXT_LEFT, right: SAMPLE_TEXT_RIGHT };
    }
  }, []);

  const handleLeftSample = useCallback(() => {
    const samples = getSamples(effectiveFormat);
    setLeftInput(samples.left);
    setError(null);
  }, [effectiveFormat, getSamples]);

  const handleRightSample = useCallback(() => {
    const samples = getSamples(effectiveFormat);
    setRightInput(samples.right);
    setError(null);
  }, [effectiveFormat, getSamples]);

  const handleLoadBothSamples = useCallback(() => {
    const samples = getSamples(effectiveFormat);
    setLeftInput(samples.left);
    setRightInput(samples.right);
    setError(null);
    setDiffResult(null);
  }, [effectiveFormat, getSamples]);

  /* ---------- Compare ---------- */

  const handleCompare = useCallback(async () => {
    setError(null);
    setIsProcessing(true);
    setCurrentChangeIndex(0);

    try {
      const result = await dataDiff({
        left: leftInput,
        right: rightInput,
        mode,
        format: effectiveFormat,
        options,
      });
      setDiffResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to compute diff');
      setDiffResult(null);
    } finally {
      setIsProcessing(false);
    }
  }, [leftInput, rightInput, mode, effectiveFormat, options]);

  /* ---------- Clear ---------- */

  const handleClear = useCallback(() => {
    setLeftInput('');
    setRightInput('');
    setDiffResult(null);
    setError(null);
    setCurrentChangeIndex(0);
  }, []);

  /* ---------- Export ---------- */

  const handleCopyDiffSummary = useCallback(async () => {
    if (!diffResult) return;

    const summary = `# Diff Summary

## Statistics
- Additions: ${diffResult.stats.additions}
- Deletions: ${diffResult.stats.deletions}
- Modifications: ${diffResult.stats.modifications}
- Unchanged: ${diffResult.stats.unchanged}
- Total Changes: ${diffResult.changes.filter((c) => c.type !== 'unchanged').length}

## Changes
${diffResult.changes
  .filter((c) => c.type !== 'unchanged')
  .map((c, idx) => {
    const prefix = c.type === 'added' ? '+' : c.type === 'deleted' ? '-' : '~';
    const content = c.leftContent || c.rightContent || '';
    return `${idx + 1}. [${prefix}] ${content}`;
  })
  .join('\n')}
`;

    await navigator.clipboard.writeText(summary);
  }, [diffResult]);

  const downloadBlob = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }, []);

  const handleDownloadReport = useCallback(() => {
    if (!diffResult) return;

    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Diff Report</title>
  <style>
    body { font-family: 'SF Mono', Menlo, monospace; margin: 20px; background: #0a0a0a; color: #e0e0e0; }
    h1 { color: #a78bfa; border-bottom: 1px solid #333; padding-bottom: 10px; }
    .stats { display: flex; gap: 16px; margin: 20px 0; padding: 12px; background: #1a1a1a; border-radius: 6px; border: 1px solid #2a2a2a; }
    .stat { display: flex; align-items: center; gap: 6px; font-size: 13px; }
    .stat-add { color: #4ade80; }
    .stat-del { color: #f87171; }
    .stat-mod { color: #fbbf24; }
    .stat-unch { color: #888; }
    .change { margin: 4px 0; padding: 8px 12px; border-radius: 4px; font-size: 13px; white-space: pre-wrap; }
    .added { background: rgba(34, 197, 94, 0.08); border-left: 3px solid #22c55e; }
    .deleted { background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; }
    .modified { background: rgba(234, 179, 8, 0.08); border-left: 3px solid #eab308; }
  </style>
</head>
<body>
  <h1>Data Diff Report</h1>
  <div class="stats">
    <div class="stat stat-add">+${diffResult.stats.additions} added</div>
    <div class="stat stat-del">-${diffResult.stats.deletions} deleted</div>
    <div class="stat stat-mod">~${diffResult.stats.modifications} modified</div>
    <div class="stat stat-unch">${diffResult.stats.unchanged} unchanged</div>
  </div>
  <h2>Changes</h2>
  ${diffResult.changes
    .filter((c) => c.type !== 'unchanged')
    .map(
      (c) =>
        `<div class="change ${c.type}">${
          c.type === 'modified'
            ? `<div style="color:#f87171">- ${escapeHtml(c.leftContent || '')}</div><div style="color:#4ade80">+ ${escapeHtml(c.rightContent || '')}</div>`
            : c.type === 'added'
              ? `+ ${escapeHtml(c.rightContent || '')}`
              : `- ${escapeHtml(c.leftContent || '')}`
        }</div>`,
    )
    .join('\n')}
</body>
</html>`;

    downloadBlob(html, `diff-report-${Date.now()}.html`, 'text/html');
  }, [diffResult, downloadBlob]);

  const handleDownloadPatch = useCallback(() => {
    if (!diffResult) return;
    const activeFormat = format === 'auto' ? detectedFormat : format;
    if (activeFormat !== 'text') return;

    let patch = `--- original\t${new Date().toISOString()}\n`;
    patch += `+++ modified\t${new Date().toISOString()}\n`;

    const changes = diffResult.changes;
    let leftLineNum = 1;
    let rightLineNum = 1;
    let hunkBuffer: string[] = [];
    let leftCount = 0;
    let rightCount = 0;
    let hunkLeftStart = 1;
    let hunkRightStart = 1;

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];

      if (change.type === 'unchanged') {
        hunkBuffer.push(` ${change.leftContent || ''}`);
        leftLineNum++;
        rightLineNum++;
        leftCount++;
        rightCount++;
      } else if (change.type === 'deleted') {
        if (hunkBuffer.length === 0) {
          hunkLeftStart = leftLineNum;
          hunkRightStart = rightLineNum;
        }
        hunkBuffer.push(`-${change.leftContent || ''}`);
        leftLineNum++;
        leftCount++;
      } else if (change.type === 'added') {
        if (hunkBuffer.length === 0) {
          hunkLeftStart = leftLineNum;
          hunkRightStart = rightLineNum;
        }
        hunkBuffer.push(`+${change.rightContent || ''}`);
        rightLineNum++;
        rightCount++;
      } else if (change.type === 'modified') {
        if (hunkBuffer.length === 0) {
          hunkLeftStart = leftLineNum;
          hunkRightStart = rightLineNum;
        }
        hunkBuffer.push(`-${change.leftContent || ''}`);
        hunkBuffer.push(`+${change.rightContent || ''}`);
        leftLineNum++;
        rightLineNum++;
        leftCount++;
        rightCount++;
      }

      const isLastChange = i === changes.length - 1;
      const nextIsUnchanged = !isLastChange && changes[i + 1]?.type === 'unchanged';

      if ((nextIsUnchanged || isLastChange) && hunkBuffer.length > 0) {
        patch += `@@ -${hunkLeftStart},${leftCount} +${hunkRightStart},${rightCount} @@\n`;
        patch += hunkBuffer.join('\n') + '\n';
        hunkBuffer = [];
        leftCount = 0;
        rightCount = 0;
      }
    }

    downloadBlob(patch, `diff-patch-${Date.now()}.patch`, 'text/plain');
  }, [diffResult, format, detectedFormat, downloadBlob]);

  /* ---------- Keyboard shortcuts ---------- */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!diffResult) return;

      const changes = diffResult.changes.filter((c) => c.type !== 'unchanged');
      const totalChanges = changes.length;

      // Arrow Up/Down - Navigate changes (only when not focused on textarea)
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (e.key === 'ArrowUp' && currentChangeIndex > 0) {
            setCurrentChangeIndex(currentChangeIndex - 1);
          }
          if (e.key === 'ArrowDown' && currentChangeIndex < totalChanges - 1) {
            setCurrentChangeIndex(currentChangeIndex + 1);
          }
        }
      }

      // Ctrl/Cmd+K - Trigger compare
      if (e.key === 'k' && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        if (leftInput && rightInput && !isProcessing) {
          handleCompare();
        }
      }

      // Ctrl/Cmd+Shift+C - Copy diff summary
      if (e.key === 'C' && (e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && diffResult) {
        e.preventDefault();
        handleCopyDiffSummary();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    diffResult,
    currentChangeIndex,
    leftInput,
    rightInput,
    isProcessing,
    handleCompare,
    handleCopyDiffSummary,
  ]);

  /* ---------- Render ---------- */

  if (!isMounted) return null;

  const placeholderPrefix = format === 'auto' ? 'Paste' : `Paste ${getFormatLabel(format)}`;

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Hidden file inputs */}
      <input
        ref={leftFileInputRef}
        type="file"
        accept=".json,.txt,.log,.csv,.xml,.yaml,.yml,.tsv"
        onChange={handleLeftFileUpload}
        className="hidden"
        aria-label="Upload original file"
      />
      <input
        ref={rightFileInputRef}
        type="file"
        accept=".json,.txt,.log,.csv,.xml,.yaml,.yml,.tsv"
        onChange={handleRightFileUpload}
        className="hidden"
        aria-label="Upload modified file"
      />

      {/* URL Loader Modals */}
      <UrlLoaderModal
        isOpen={showLeftUrlModal}
        onClose={() => setShowLeftUrlModal(false)}
        onLoad={(data) => {
          setLeftInput(data);
          setShowLeftUrlModal(false);
          setError(null);
        }}
        title="Load Original Data from URL"
      />
      <UrlLoaderModal
        isOpen={showRightUrlModal}
        onClose={() => setShowRightUrlModal(false)}
        onLoad={(data) => {
          setRightInput(data);
          setShowRightUrlModal(false);
          setError(null);
        }}
        title="Load Modified Data from URL"
      />

      {/* Header toolbar */}
      <div className="px-4 py-2.5 border-b bg-card" role="banner">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Left side: title + format badge */}
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold whitespace-nowrap">Data Diff</h1>

            {/* Format detection badge */}
            {format === 'auto' && (leftInput || rightInput) && (
              <Badge
                variant="outline"
                className="text-xs font-mono"
                aria-label={`Detected format: ${getFormatLabel(detectedFormat)}`}
              >
                {getFormatLabel(detectedFormat)}
              </Badge>
            )}

            {/* Quick stats when results exist */}
            {diffResult && (
              <Badge variant="secondary" className="text-xs font-mono" aria-label="Diff statistics">
                {diffResult.stats.additions > 0 && (
                  <span className="text-green-600 dark:text-green-400">
                    +{diffResult.stats.additions}
                  </span>
                )}
                {diffResult.stats.additions > 0 && diffResult.stats.deletions > 0 && (
                  <span className="mx-0.5 text-muted-foreground">/</span>
                )}
                {diffResult.stats.deletions > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    -{diffResult.stats.deletions}
                  </span>
                )}
                {(diffResult.stats.additions > 0 || diffResult.stats.deletions > 0) &&
                  diffResult.stats.modifications > 0 && (
                    <span className="mx-0.5 text-muted-foreground">/</span>
                  )}
                {diffResult.stats.modifications > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    ~{diffResult.stats.modifications}
                  </span>
                )}
              </Badge>
            )}
          </div>

          {/* Right side: controls */}
          <div className="flex items-center gap-2" role="toolbar" aria-label="Diff controls">
            {/* Format selector */}
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as 'json' | 'csv' | 'text' | 'auto')}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs" aria-label="Select data format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto Detect</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>

            {/* Mode selector */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'simple' | 'advanced')}>
              <TabsList className="h-8" aria-label="Select diff depth mode">
                <TabsTrigger value="simple" className="text-xs h-7 px-3">
                  Simple
                </TabsTrigger>
                <TabsTrigger value="advanced" className="text-xs h-7 px-3">
                  Advanced
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Options popover */}
            <OptionsPanel format={effectiveFormat} options={options} onChange={setOptions} />

            {/* Navigation */}
            <DiffNavigation
              result={diffResult}
              currentIndex={currentChangeIndex}
              onNavigate={setCurrentChangeIndex}
              onCopy={handleCopyDiffSummary}
              onDownload={handleDownloadReport}
              onDownloadPatch={handleDownloadPatch}
              format={effectiveFormat}
            />

            <div className="h-4 w-px bg-border" aria-hidden="true" />

            {/* Load sample data */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleLoadBothSamples}
              aria-label="Load sample data for both sides"
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              Sample
            </Button>

            {/* Compare button */}
            <Button
              size="sm"
              className="h-8"
              onClick={handleCompare}
              disabled={!leftInput || !rightInput || isProcessing}
              aria-label={isProcessing ? 'Comparing data...' : 'Compare data'}
            >
              {isProcessing && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {isProcessing ? 'Comparing...' : 'Compare'}
            </Button>

            {/* Clear button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleClear}
              disabled={!leftInput && !rightInput && !diffResult}
              aria-label="Clear all data"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Three-panel layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1" role="main">
        {/* Left input panel */}
        <ResizablePanel defaultSize={30} minSize={15}>
          <section aria-label="Original data input" className="h-full">
            <InputPanel
              title="Original"
              value={leftInput}
              onChange={setLeftInput}
              placeholder={`${placeholderPrefix} original data here...`}
              onUploadClick={() => leftFileInputRef.current?.click()}
              onUrlClick={() => setShowLeftUrlModal(true)}
              onSampleClick={handleLeftSample}
            />
          </section>
        </ResizablePanel>

        <ResizableHandle withHandle aria-label="Resize original and diff panels" />

        {/* Diff viewer panel */}
        <ResizablePanel defaultSize={40} minSize={20}>
          <section aria-label="Diff results" className="h-full">
            <DiffViewer
              result={diffResult}
              highlightIndex={currentChangeIndex}
              isProcessing={isProcessing}
            />
          </section>
        </ResizablePanel>

        <ResizableHandle withHandle aria-label="Resize diff and modified panels" />

        {/* Right input panel */}
        <ResizablePanel defaultSize={30} minSize={15}>
          <section aria-label="Modified data input" className="h-full">
            <InputPanel
              title="Modified"
              value={rightInput}
              onChange={setRightInput}
              placeholder={`${placeholderPrefix} modified data here...`}
              onUploadClick={() => rightFileInputRef.current?.click()}
              onUrlClick={() => setShowRightUrlModal(true)}
              onSampleClick={handleRightSample}
            />
          </section>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Status bar */}
      <div
        className="px-4 py-1.5 border-t bg-card text-xs text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {error ? (
              <span className="text-destructive" role="alert">
                {error}
              </span>
            ) : diffResult ? (
              <span>
                {diffResult.changes.filter((c) => c.type !== 'unchanged').length} difference
                {diffResult.changes.filter((c) => c.type !== 'unchanged').length !== 1
                  ? 's'
                  : ''}{' '}
                found
              </span>
            ) : (
              <span>Ready</span>
            )}
            <span
              className="text-muted-foreground/50 hidden sm:inline"
              aria-label="Keyboard shortcuts"
            >
              \u2191/\u2193 Navigate \u00B7 \u2318K Compare \u00B7 \u2318\u21E7C Copy
            </span>
          </div>
          <div className="flex items-center gap-3">
            {leftInput.length > 0 && (
              <span aria-label="Original character count">
                L: {leftInput.length.toLocaleString()}
              </span>
            )}
            {rightInput.length > 0 && (
              <span aria-label="Modified character count">
                R: {rightInput.length.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
