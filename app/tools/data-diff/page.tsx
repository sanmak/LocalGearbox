/**
 * Data Diff Tool - Compare JSON, CSV, and text data with forensic precision
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
  detectFormatFromPair,
} from '@/lib/tools/comparators';
import { InputPanel } from './components/InputPanel';
import { DiffViewer } from './components/DiffViewer';
import { OptionsPanel } from './components/OptionsPanel';
import { DiffNavigation } from './components/DiffNavigation';
import { Loader2 } from 'lucide-react';

// Sample data
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

export default function DataDiffPage() {
  // State
  const [leftInput, setLeftInput] = useState('');
  const [rightInput, setRightInput] = useState('');
  const [format, setFormat] = useState<'json' | 'csv' | 'text' | 'auto'>('auto');
  const [detectedFormat, setDetectedFormat] = useState<'json' | 'csv' | 'text'>('json');
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [options, setOptions] = useState<DiffOptions & CsvDiffOptions>({});
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);

  // URL loading modals
  const [showLeftUrlModal, setShowLeftUrlModal] = useState(false);
  const [showRightUrlModal, setShowRightUrlModal] = useState(false);

  // File input refs
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);

  // Hydration fix
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-detect format when inputs change (only if format is set to 'auto')
  useEffect(() => {
    if (format === 'auto' && leftInput && rightInput) {
      const detection = detectFormatFromPair(leftInput, rightInput);
      setDetectedFormat(detection.format);
    }
  }, [leftInput, rightInput, format]);

  // File upload handlers
  const handleLeftFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setLeftInput(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  }, []);

  const handleRightFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRightInput(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  }, []);

  // Sample data handlers
  const handleLeftSample = useCallback(() => {
    const effectiveFormat = format === 'auto' ? detectedFormat : format;
    const sample =
      effectiveFormat === 'json'
        ? SAMPLE_JSON_LEFT
        : effectiveFormat === 'csv'
          ? SAMPLE_CSV_LEFT
          : SAMPLE_TEXT_LEFT;
    setLeftInput(sample);
    setError(null);
  }, [format, detectedFormat]);

  const handleRightSample = useCallback(() => {
    const effectiveFormat = format === 'auto' ? detectedFormat : format;
    const sample =
      effectiveFormat === 'json'
        ? SAMPLE_JSON_RIGHT
        : effectiveFormat === 'csv'
          ? SAMPLE_CSV_RIGHT
          : SAMPLE_TEXT_RIGHT;
    setRightInput(sample);
    setError(null);
  }, [format, detectedFormat]);

  // Compute diff
  const handleCompare = useCallback(async () => {
    setError(null);
    setIsProcessing(true);
    setCurrentChangeIndex(0);

    try {
      // Use detected format if 'auto' is selected
      const effectiveFormat = format === 'auto' ? detectedFormat : format;

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
  }, [leftInput, rightInput, mode, format, detectedFormat, options]);

  // Clear all
  const handleClear = useCallback(() => {
    setLeftInput('');
    setRightInput('');
    setDiffResult(null);
    setError(null);
    setCurrentChangeIndex(0);
  }, []);

  // Export functions
  const handleCopyDiffSummary = useCallback(async () => {
    if (!diffResult) return;

    const summary = `# Diff Summary

## Statistics
- Additions: ${diffResult.stats.additions}
- Deletions: ${diffResult.stats.deletions}
- Modifications: ${diffResult.stats.modifications}
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

  const handleDownloadReport = useCallback(() => {
    if (!diffResult) return;

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Diff Report</title>
  <style>
    body { font-family: monospace; margin: 20px; background: #1a1a1a; color: #e0e0e0; }
    h1 { color: #8b5cf6; }
    .stats { margin: 20px 0; padding: 10px; background: #2a2a2a; border-radius: 4px; }
    .change { margin: 10px 0; padding: 10px; border-radius: 4px; }
    .added { background: rgba(34, 197, 94, 0.1); border-left: 4px solid #22c55e; }
    .deleted { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; }
    .modified { background: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308; }
  </style>
</head>
<body>
  <h1>Data Diff Report</h1>
  <div class="stats">
    <strong>Statistics:</strong><br>
    Additions: ${diffResult.stats.additions}<br>
    Deletions: ${diffResult.stats.deletions}<br>
    Modifications: ${diffResult.stats.modifications}<br>
    Total Changes: ${diffResult.changes.filter((c) => c.type !== 'unchanged').length}
  </div>
  <h2>Changes</h2>
  ${diffResult.changes
    .filter((c) => c.type !== 'unchanged')
    .map(
      (c) => `
    <div class="change ${c.type}">
      <strong>${c.type.toUpperCase()}</strong><br>
      ${c.leftContent ? `Left: ${c.leftContent}<br>` : ''}
      ${c.rightContent ? `Right: ${c.rightContent}` : ''}
    </div>
  `,
    )
    .join('')}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diff-report-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [diffResult]);

  const handleDownloadPatch = useCallback(() => {
    if (!diffResult || format !== 'text') return;

    // Generate unified diff patch format
    let patch = `--- original\t${new Date().toISOString()}\n`;
    patch += `+++ modified\t${new Date().toISOString()}\n`;

    // Group changes into hunks
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

      // Check if we should flush the hunk
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

    const blob = new Blob([patch], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diff-patch-${Date.now()}.patch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [diffResult, format]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if we have diff results
      if (!diffResult) return;

      const changes = diffResult.changes.filter((c) => c.type !== 'unchanged');
      const totalChanges = changes.length;

      // Arrow Up - Previous change
      if (e.key === 'ArrowUp' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement;
        // Only if not focused on a textarea
        if (activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (currentChangeIndex > 0) {
            setCurrentChangeIndex(currentChangeIndex - 1);
          }
        }
      }

      // Arrow Down - Next change
      if (e.key === 'ArrowDown' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement;
        // Only if not focused on a textarea
        if (activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (currentChangeIndex < totalChanges - 1) {
            setCurrentChangeIndex(currentChangeIndex + 1);
          }
        }
      }

      // Ctrl+K (Cmd+K on Mac) - Trigger compare
      if (e.key === 'k' && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        if (leftInput && rightInput && !isProcessing) {
          handleCompare();
        }
      }

      // Ctrl+Shift+C - Copy diff summary
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

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Hidden file inputs */}
      <input
        ref={leftFileInputRef}
        type="file"
        accept=".json,.txt,.log,.csv,.xml,.yaml,.yml"
        onChange={handleLeftFileUpload}
        className="hidden"
        aria-label="Upload left file"
      />
      <input
        ref={rightFileInputRef}
        type="file"
        accept=".json,.txt,.log,.csv,.xml,.yaml,.yml"
        onChange={handleRightFileUpload}
        className="hidden"
        aria-label="Upload right file"
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
        title="Load Left Data from URL"
      />

      <UrlLoaderModal
        isOpen={showRightUrlModal}
        onClose={() => setShowRightUrlModal(false)}
        onLoad={(data) => {
          setRightInput(data);
          setShowRightUrlModal(false);
          setError(null);
        }}
        title="Load Right Data from URL"
      />

      {/* Header with controls */}
      <div className="px-4 py-3 border-b bg-card" role="banner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Data Diff Tool</h1>
            {diffResult && (
              <Badge variant="secondary" className="text-xs" aria-label="Diff statistics">
                {diffResult.stats.additions > 0 && `${diffResult.stats.additions}+`}
                {diffResult.stats.additions > 0 && diffResult.stats.deletions > 0 && ' '}
                {diffResult.stats.deletions > 0 && `${diffResult.stats.deletions}-`}
                {(diffResult.stats.additions > 0 || diffResult.stats.deletions > 0) &&
                  diffResult.stats.modifications > 0 &&
                  ' '}
                {diffResult.stats.modifications > 0 && `${diffResult.stats.modifications}~`}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2" role="toolbar" aria-label="Diff controls">
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as 'json' | 'csv' | 'text' | 'auto')}
            >
              <SelectTrigger className="w-[140px]" aria-label="Select data format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  Auto{format === 'auto' && ` (${detectedFormat.toUpperCase()})`}
                </SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>

            <Tabs value={mode} onValueChange={(v) => setMode(v as 'simple' | 'advanced')}>
              <TabsList aria-label="Select diff mode">
                <TabsTrigger value="simple">Simple</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
            </Tabs>

            <OptionsPanel
              format={format === 'auto' ? detectedFormat : format}
              options={options}
              onChange={setOptions}
            />

            <DiffNavigation
              result={diffResult}
              currentIndex={currentChangeIndex}
              onNavigate={setCurrentChangeIndex}
              onCopy={handleCopyDiffSummary}
              onDownload={handleDownloadReport}
              onDownloadPatch={handleDownloadPatch}
              format={format === 'auto' ? detectedFormat : format}
            />

            <div className="h-4 w-px bg-border mx-1" aria-hidden="true" />

            <Button
              onClick={handleCompare}
              disabled={!leftInput || !rightInput || isProcessing}
              aria-label={isProcessing ? 'Comparing data...' : 'Compare data'}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessing ? 'Comparing...' : 'Compare'}
            </Button>

            <Button variant="outline" onClick={handleClear} aria-label="Clear all data">
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Three-panel layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1" role="main">
        {/* Left input panel */}
        <ResizablePanel defaultSize={33} minSize={20}>
          <section aria-label="Original data input" className="h-full">
            <InputPanel
              title="Original Data"
              value={leftInput}
              onChange={setLeftInput}
              placeholder={
                format === 'json'
                  ? 'Paste original JSON here...'
                  : format === 'csv'
                    ? 'Paste original CSV here...'
                    : 'Paste original text here...'
              }
              onUploadClick={() => leftFileInputRef.current?.click()}
              onUrlClick={() => setShowLeftUrlModal(true)}
              onSampleClick={handleLeftSample}
            />
          </section>
        </ResizablePanel>

        <ResizableHandle withHandle aria-label="Resize left and center panels" />

        {/* Diff view panel */}
        <ResizablePanel defaultSize={34} minSize={20}>
          <section aria-label="Diff results" className="h-full">
            <DiffViewer
              result={diffResult}
              highlightIndex={currentChangeIndex}
              isProcessing={isProcessing}
            />
          </section>
        </ResizablePanel>

        <ResizableHandle withHandle aria-label="Resize center and right panels" />

        {/* Right input panel */}
        <ResizablePanel defaultSize={33} minSize={20}>
          <section aria-label="Modified data input" className="h-full">
            <InputPanel
              title="Modified Data"
              value={rightInput}
              onChange={setRightInput}
              placeholder={
                format === 'json'
                  ? 'Paste modified JSON here...'
                  : format === 'csv'
                    ? 'Paste modified CSV here...'
                    : 'Paste modified text here...'
              }
              onUploadClick={() => rightFileInputRef.current?.click()}
              onUrlClick={() => setShowRightUrlModal(true)}
              onSampleClick={handleRightSample}
            />
          </section>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Status bar */}
      <div
        className="px-4 py-2 border-t bg-card text-xs text-muted-foreground"
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
                Found {diffResult.changes.filter((c) => c.type !== 'unchanged').length} differences
              </span>
            ) : (
              <span>Ready - paste data and click Compare</span>
            )}
            <span className="text-muted-foreground/60" aria-label="Keyboard shortcuts">
              Shortcuts: ↑/↓ Navigate • ⌘K Compare • ⌘⇧C Copy
            </span>
          </div>
          <span aria-label="Character counts">
            {leftInput.length > 0 && `Left: ${leftInput.length} chars`}
            {leftInput.length > 0 && rightInput.length > 0 && ' | '}
            {rightInput.length > 0 && `Right: ${rightInput.length} chars`}
          </span>
        </div>
      </div>
    </div>
  );
}
