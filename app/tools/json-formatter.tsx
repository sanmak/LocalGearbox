/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON Formatter - Redesigned with New Design Language
 * Format and beautify JSON with proper indentation
 * Uses shadcn/ui components and design tokens for consistency
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  formatJson,
  minifyJson,
  calculateStats,
  SAMPLE_JSON,
  IndentOption,
  INDENT_OPTIONS,
  JsonStats,
} from '@/lib/json';
import {
  CopyIcon,
  CheckIcon,
  ClearIcon,
  SampleIcon,
  MinifyIcon,
  ExpandIcon,
  CollapseIcon,
  DownloadIcon,
  UploadIcon,
  LinkIcon,
  JsonTreeView,
  useTreeExpansion,
  JsonStatsBar,
} from '@/components/json';
import { UrlLoaderModal } from '@/components/UrlLoaderModal';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

type ViewMode = 'code' | 'tree';

export default function JSONFormatterPage() {
  // Core state
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('code');
  const [indentOption, setIndentOption] = useState<IndentOption>('2');
  const [parsedJson, setParsedJson] = useState<unknown>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Tree view state
  const { expandedPaths, togglePath, expandAll, collapseAll } = useTreeExpansion();
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [showUrlModal, setShowUrlModal] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Stats calculation
  const stats = useMemo<JsonStats | null>(() => {
    if (!parsedJson) return null;
    const s = calculateStats(parsedJson);
    s.size = output.length;
    return s;
  }, [parsedJson, output.length]);

  // Auto-format on input change
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setParsedJson(null);
      setError(null);
      setIsFormatting(false);
      return;
    }

    setIsFormatting(true);
    const timer = setTimeout(() => {
      try {
        const parsed = JSON.parse(input);
        const result = formatJson(parsed, indentOption);
        setOutput(result);
        setParsedJson(parsed);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Invalid JSON';
        setError(errorMessage);
        setOutput('');
        setParsedJson(null);
      } finally {
        setIsFormatting(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [input, indentOption]);

  // Minify JSON
  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      setError('Please enter JSON to minify');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      const result = minifyJson(input);
      setOutput(result);
      setParsedJson(parsed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }, [input]);

  // Copy output
  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, [output]);

  // Clear all
  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    setParsedJson(null);
    inputRef.current?.focus();
  }, []);

  // Load sample
  const loadSample = useCallback(() => {
    setInput(SAMPLE_JSON);
    setError(null);
  }, []);

  // File upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInput(content);
      setError(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // Download output
  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  // Select value in tree view
  const handleSelectValue = useCallback((path: string) => {
    setSelectedPath(path);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear]);

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Header with Actions */}
      <div className="px-4 py-3 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">JSON Formatter</h1>
            <span className="text-sm text-muted-foreground">
              Format and beautify JSON instantly
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              title="Upload JSON file"
            >
              <UploadIcon />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUrlModal(true)}
              title="Load from URL"
            >
              <LinkIcon />
            </Button>
            <Button variant="ghost" size="sm" onClick={loadSample} title="Load sample">
              <SampleIcon />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!input}
              title="Clear (⌘+K)"
            >
              <ClearIcon />
            </Button>
          </div>
        </div>
      </div>

      {/* Options Bar */}
      <div className="px-4 py-2 bg-muted/20 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Indent Setting */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Indent:</span>
              <Select
                value={indentOption}
                onValueChange={(v) => setIndentOption(v as IndentOption)}
              >
                <SelectTrigger className="w-[100px] h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">View:</span>
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === 'code' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('code')}
                  className="h-7 px-3 text-xs rounded-none"
                >
                  Code
                </Button>
                <Button
                  variant={viewMode === 'tree' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('tree')}
                  className="h-7 px-3 text-xs rounded-none"
                >
                  Tree
                </Button>
              </div>
            </div>

            {/* Formatting Indicator */}
            {isFormatting && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Formatting...</span>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Badge variant="destructive" className="text-xs">
              {error}
            </Badge>
          )}
        </div>
      </div>

      {/* Resizable Two-Panel Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Input Panel */}
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="flex flex-col h-full">
            <div className="px-4 py-2 border-b bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Input JSON</span>
                <div className="flex items-center gap-2">
                  {input.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {input.length} chars
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMinify}
                    disabled={!input.trim() || !parsedJson}
                    title="Minify JSON"
                  >
                    <MinifyIcon />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 relative min-h-0">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="absolute inset-0 w-full h-full resize-none bg-background font-mono text-sm p-4 focus-visible:ring-0 border-0 rounded-none"
                placeholder='{
  "name": "John",
  "age": 30
}'
                spellCheck={false}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Output Panel */}
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="flex flex-col h-full">
            <div className="px-4 py-2 border-b bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Formatted JSON</span>
                <div className="flex items-center gap-2">
                  {output && (
                    <Badge variant="secondary" className="text-xs">
                      {output.length} chars
                    </Badge>
                  )}
                  {viewMode === 'tree' && parsedJson ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => expandAll(parsedJson)}
                        title="Expand all"
                      >
                        <ExpandIcon />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={collapseAll} title="Collapse all">
                        <CollapseIcon />
                      </Button>
                    </>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    disabled={!output}
                    title="Download JSON"
                  >
                    <DownloadIcon />
                  </Button>
                  {output && (
                    <Button
                      onClick={handleCopy}
                      size="sm"
                      className="h-7"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <>
                          <CheckIcon />
                          <span className="ml-1.5">Copied!</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon />
                          <span className="ml-1.5">Copy</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 relative min-h-0 overflow-hidden">
              {viewMode === 'tree' && parsedJson ? (
                <ScrollArea className="absolute inset-0">
                  <JsonTreeView
                    data={parsedJson}
                    expandedPaths={expandedPaths}
                    onTogglePath={togglePath}
                    selectedPath={selectedPath}
                    onSelect={(path) => handleSelectValue(path)}
                  />
                </ScrollArea>
              ) : (
                <Textarea
                  value={output}
                  readOnly
                  className="absolute inset-0 w-full h-full resize-none bg-background font-mono text-sm p-4 focus-visible:ring-0 border-0 rounded-none"
                  placeholder={input ? 'Formatting...' : 'Formatted JSON will appear here'}
                />
              )}
            </div>

            {/* Stats Bar */}
            {stats && (
              <div className="px-4 py-2 bg-muted/10 border-t">
                <JsonStatsBar data={parsedJson} rawSize={input.length} />
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* URL Loader Modal */}
      <UrlLoaderModal
        isOpen={showUrlModal}
        onClose={() => setShowUrlModal(false)}
        onLoad={(data) => {
          setInput(data);
          setShowUrlModal(false);
        }}
      />
    </div>
  );
}
