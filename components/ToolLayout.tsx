/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import CodeHighlighter from '@/components/CodeHighlighter';
import { SAMPLE_JSON } from '@/lib/json';
import { UploadIcon, LinkIcon, SampleIcon } from '@/components/json';
import { UrlLoaderModal } from '@/components/UrlLoaderModal';

interface ToolLayoutProps {
  toolName: string;
  toolDescription: string;
  onProcess: (input: string) => Promise<string>;
  placeholder?: string;
  instantProcess?: boolean; // Enable auto-transform on input change (default true)
  sampleData?: string; // Custom sample data for this tool
  showJsonButtons?: boolean; // Show the three JSON loading buttons
}

// Icons
const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ClearIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export const ToolLayout = ({
  toolName,
  toolDescription,
  onProcess,
  placeholder = 'Paste your input here...',
  instantProcess = true, // Default to true for transform.tools experience
  sampleData,
  showJsonButtons = false,
}: ToolLayoutProps) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process function
  const handleProcess = useCallback(
    async (value?: string) => {
      const inputValue = value ?? input;
      if (!inputValue.trim()) {
        setOutput('');
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await onProcess(inputValue);
        setOutput(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        setOutput('');
      } finally {
        setLoading(false);
      }
    },
    [input, onProcess],
  );

  // Instant processing with debounce
  useEffect(() => {
    if (!instantProcess) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      handleProcess(input);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [input, instantProcess, handleProcess]);

  // Copy to clipboard
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

  // Load sample data
  const loadSample = useCallback(() => {
    const sample = sampleData || SAMPLE_JSON;
    setInput(sample);
    setError(null);
    if (instantProcess) {
      handleProcess(sample);
    }
  }, [sampleData, instantProcess, handleProcess]);

  // File upload
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setInput(text);
        setError(null);
        if (instantProcess) {
          handleProcess(text);
        }
      };
      reader.readAsText(file);
    },
    [instantProcess, handleProcess],
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleProcess();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleClear();
      }
    },
    [handleProcess, handleClear],
  );

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Tool Header - Compact */}
      <div className="flex-shrink-0 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-text-primary">{toolName}</h1>
            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-accent">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <span>Processing...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-text-tertiary">
              <kbd>⌘</kbd>
              <span>+</span>
              <kbd>Enter</kbd>
              <span className="mx-1">to process</span>
              <kbd>⌘</kbd>
              <span>+</span>
              <kbd>K</kbd>
              <span>to clear</span>
            </span>
          </div>
        </div>
        <p className="mt-1 text-sm text-text-secondary">{toolDescription}</p>

        {/* Quick Action Buttons */}
        {showJsonButtons && (
          <div className="mt-3 flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt,.sql,.xml"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors flex items-center gap-2 text-sm"
              title="Upload JSON file"
            >
              <UploadIcon />
              <span className="hidden sm:inline">Upload File</span>
            </button>
            <button
              onClick={() => setShowUrlModal(true)}
              className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors flex items-center gap-2 text-sm"
              title="Load From URL"
            >
              <LinkIcon />
              <span className="hidden sm:inline">Load From URL</span>
            </button>
            <button
              onClick={loadSample}
              className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors flex items-center gap-2 text-sm"
              title="Load Sample Data"
            >
              <SampleIcon />
              <span className="hidden sm:inline">Load Sample Data</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content - Side by Side Panels */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 p-3 gap-3">
        {/* Input Panel */}
        <div className="flex-1 flex flex-col panel min-h-[200px] lg:min-h-0 glow-accent">
          <div className="panel-header">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Input
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors"
                title="Clear (⌘K)"
              >
                <ClearIcon />
              </button>
            </div>
          </div>
          <div className="flex-1 relative min-h-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (!instantProcess) setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="code-editor absolute inset-0 w-full h-full p-4 bg-transparent border-0 outline-none text-text-primary"
              spellCheck="false"
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
          <div className="flex-shrink-0 px-4 py-2 border-t border-border flex items-center justify-between">
            <span className="text-xs text-text-tertiary">
              {input.length.toLocaleString()} chars
            </span>
            {!instantProcess && (
              <button
                onClick={() => handleProcess()}
                disabled={!input.trim() || loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayIcon />
                <span>Transform</span>
              </button>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex-1 flex flex-col panel min-h-[200px] lg:min-h-0">
          <div className="panel-header">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Output
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                disabled={!output || !!error}
                className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Copy to clipboard"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
          </div>
          <div className="flex-1 relative min-h-0 overflow-auto">
            {error ? (
              <div className="p-4">
                <div className="rounded-lg border border-error/30 bg-error-subtle p-4">
                  <p className="text-sm font-medium text-error">{error}</p>
                </div>
              </div>
            ) : output ? (
              <div className="h-full w-full flex-1 min-h-0 min-w-0 overflow-auto">
                <CodeHighlighter
                  code={(() => {
                    try {
                      // Only format if output is valid JSON (object/array)
                      const parsed = JSON.parse(output);
                      return JSON.stringify(parsed, null, 2);
                    } catch {
                      return output;
                    }
                  })()}
                  showCopy={false}
                  showLanguage={false}
                  className="p-4 text-text-primary whitespace-pre-wrap break-words min-h-[120px] h-full w-full"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
                {instantProcess ? 'Start typing to transform...' : 'Click Transform to process'}
              </div>
            )}
          </div>
          <div className="flex-shrink-0 px-4 py-2 border-t border-border flex items-center justify-between">
            <span className="text-xs text-text-tertiary">
              {output.length.toLocaleString()} chars
            </span>
            {copied && <span className="text-xs text-success font-medium">Copied!</span>}
          </div>
        </div>
      </div>

      {/* URL Loader Modal */}
      {showJsonButtons && (
        <UrlLoaderModal
          isOpen={showUrlModal}
          onClose={() => setShowUrlModal(false)}
          onLoad={(data) => {
            setInput(data);
            setShowUrlModal(false);
            if (instantProcess) {
              handleProcess(data);
            }
          }}
        />
      )}
    </div>
  );
};
