/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getTool } from '../../lib/tool-registry';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  UploadIcon,
  LinkIcon,
  SampleIcon,
  ClearIcon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
} from '@/components/json/icons';
import { UrlLoaderModal } from '@/components/UrlLoaderModal';
import { Loader2 } from 'lucide-react';

const tool = getTool('sql-formatter');
const SAMPLE_SQL = `SELECT id, name, email FROM users WHERE active = 1 ORDER BY created_at DESC;`;

export default function SQLFormatterPage() {
  // State
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-format on input change
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      setIsFormatting(false);
      return;
    }
    setIsFormatting(true);
    const timer = setTimeout(async () => {
      try {
        const result = await tool?.process(input);
        setOutput(result ?? '');
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid SQL');
        setOutput('');
      } finally {
        setIsFormatting(false);
      }
    }, 300);
    return () => clearTimeout(timer);
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
    inputRef.current?.focus();
  }, []);

  // Load sample
  const loadSample = useCallback(() => {
    setInput(SAMPLE_SQL);
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
    const blob = new Blob([output], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted-${Date.now()}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

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

  if (!tool || !isMounted) return null;

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Header with Actions */}
      <div className="px-4 py-3 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{tool.name}</h1>
            <span className="text-sm text-muted-foreground">{tool.description}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".sql,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              title="Upload SQL file"
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
            {isFormatting && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Formatting...</span>
              </div>
            )}
          </div>
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
                <span className="text-sm font-medium text-muted-foreground">Input SQL</span>
                {input.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {input.length} chars
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex-1 relative min-h-0">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="absolute inset-0 w-full h-full resize-none bg-background font-mono text-sm p-4 focus-visible:ring-0 border-0 rounded-none"
                placeholder={'Paste your SQL here...'}
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
                <span className="text-sm font-medium text-muted-foreground">Formatted SQL</span>
                {output && (
                  <Badge variant="secondary" className="text-xs">
                    {output.length} chars
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!output}
                  title="Download SQL"
                >
                  <DownloadIcon />
                </Button>
                {output && (
                  <Button onClick={handleCopy} size="sm" className="h-7" title="Copy to clipboard">
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
            <div className="flex-1 relative min-h-0 overflow-hidden">
              <ScrollArea className="absolute inset-0">
                <Textarea
                  value={output}
                  readOnly
                  className="w-full h-full resize-none bg-background font-mono text-sm p-4 focus-visible:ring-0 border-0 rounded-none"
                  placeholder={input ? 'Formatting...' : 'Formatted SQL will appear here'}
                />
              </ScrollArea>
            </div>
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
