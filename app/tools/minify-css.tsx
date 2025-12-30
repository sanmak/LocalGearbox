/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * CSS Minifier - Advanced
 * Minify CSS by removing whitespace and comments
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { beautifyCSS, minifyCSS } from '@/lib/tools';
import { UrlLoaderModal } from '@/components/UrlLoaderModal';

const SAMPLE_CSS = `body {
    color: red;
    margin: 10px;
    font-family: Arial, sans-serif;
}

h1 {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}`;

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

const SampleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const ExpandIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
    />
  </svg>
);

export default function MinifyCSSPage() {
  // Core state
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-minify on input change
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await minifyCSS(input);
        setOutput(result);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Invalid CSS';
        setError(errorMessage);
        setOutput('');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [input]);

  // Beautify CSS
  const handleBeautify = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter CSS to beautify');
      return;
    }
    try {
      const result = await beautifyCSS(input);
      setOutput(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid CSS');
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
    inputRef.current?.focus();
  }, []);

  // Load sample
  const loadSample = useCallback(() => {
    setInput(SAMPLE_CSS);
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
    const blob = new Blob([output], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minified-${Date.now()}.css`;
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Minimal Header */}
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium text-text-primary">CSS Minifier</h1>
            <span className="text-sm text-text-tertiary">
              Remove whitespace and compress CSS instantly
            </span>
          </div>
          {/* Minimal Action Icons */}
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".css,text/css,text/plain"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary/50 rounded transition-colors"
              title="Upload CSS file"
            >
              <UploadIcon />
            </button>
            <button
              onClick={() => setShowUrlModal(true)}
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary/50 rounded transition-colors"
              title="Load from URL"
            >
              <LinkIcon />
            </button>
            <button
              onClick={loadSample}
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary/50 rounded transition-colors"
              title="Load sample"
            >
              <SampleIcon />
            </button>
            <button
              onClick={handleClear}
              disabled={!input}
              className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-30"
              title="Clear (⌘+K)"
            >
              <ClearIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Minimal Options Strip */}
      <div className="px-4 py-2 bg-surface-secondary/20 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xs text-text-secondary font-medium">
              Auto-minifies on input • Use Beautify to expand
            </span>
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded">{error}</div>
          )}
        </div>
      </div>

      {/* Clean Two-Panel Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Input Panel */}
        <div className="flex-1 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-border/30">
          <div className="px-4 py-2 border-b border-border/30 bg-surface-secondary/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Input CSS</span>
              <div className="flex items-center gap-2">
                {input.length > 0 && (
                  <span className="text-xs text-text-tertiary">{input.length} characters</span>
                )}
                <button
                  onClick={handleBeautify}
                  disabled={!input.trim()}
                  className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary/50 rounded transition-colors disabled:opacity-30"
                  title="Beautify CSS"
                >
                  <ExpandIcon />
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 relative min-h-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="absolute inset-0 w-full h-full resize-none bg-surface text-text-primary font-mono text-sm p-4 focus:outline-none focus:ring-1 focus:ring-accent/20 border-0"
              placeholder="body{color:red;margin:10px;}h1{font-size:24px;}"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-4 py-2 border-b border-border/30 bg-surface-secondary/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Minified CSS</span>
              <div className="flex items-center gap-2">
                {output && (
                  <span className="text-xs text-text-tertiary">
                    {output.length} characters • Saved{' '}
                    {input.length - output.length > 0 ? input.length - output.length : 0} bytes
                  </span>
                )}
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary/50 rounded transition-colors disabled:opacity-30"
                  title="Download CSS"
                >
                  <DownloadIcon />
                </button>
                {output && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-sm rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 relative min-h-0 overflow-hidden">
            <textarea
              value={output}
              readOnly
              className="absolute inset-0 w-full h-full resize-none bg-surface text-text-primary font-mono text-sm p-4 focus:outline-none border-0"
              placeholder={input ? 'Minifying...' : 'Minified CSS will appear here'}
            />
          </div>
        </div>
      </div>

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
