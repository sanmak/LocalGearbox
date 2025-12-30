/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { decodeJWT } from '@/lib/tools';
import CodeHighlighter from '@/components/CodeHighlighter';
import { SampleIcon } from '@/components/json';

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

export default function JWTDecoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Process JWT with auto-transform
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
        const result = await decodeJWT(inputValue);
        setOutput(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setOutput('');
      } finally {
        setLoading(false);
      }
    },
    [input],
  );

  // Auto-transform on input change
  useEffect(() => {
    const timer = setTimeout(() => handleProcess(), 100);
    return () => clearTimeout(timer);
  }, [input, handleProcess]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    inputRef.current?.focus();
  }, []);

  const SAMPLE_JWT =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  const loadSample = useCallback(() => {
    setInput(SAMPLE_JWT);
    setError(null);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [output]);

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
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Tool Header */}
      <div className="flex-shrink-0 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-text-primary">JWT Decoder</h1>
            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-accent">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <span>Processing...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={loadSample}
                className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors flex items-center gap-2 text-sm"
                title="Load Sample Data"
              >
                <SampleIcon />
                <span className="hidden sm:inline">Load Sample Data</span>
              </button>
            </div>

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
        <p className="mt-1 text-sm text-text-secondary">
          Decode JSON Web Token (JWT) to view the header and payload. Note: This does not verify the
          signature.
        </p>
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
                onClick={loadSample}
                className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors"
                title="Load sample"
              >
                <SampleIcon />
              </button>
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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0..."
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
          <div className="flex-1 min-h-0 overflow-hidden">
            {error ? (
              <div className="p-4">
                <div className="rounded-lg border border-error/30 bg-error-subtle p-4">
                  <p className="text-sm font-medium text-error">{error}</p>
                </div>
              </div>
            ) : output ? (
              <CodeHighlighter
                code={output}
                language="json"
                showCopy={false}
                maxHeight="100%"
                className="h-full border-0 rounded-none"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
                Start typing to decode JWT...
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
    </div>
  );
}
