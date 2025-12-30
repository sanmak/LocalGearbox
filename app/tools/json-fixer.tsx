/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

/**
 * JSON Fixer Tool
 * Automatically fix common JSON syntax errors
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { fixJson, getFixerCapabilities, needsFix } from '@/lib/json/fixer';
import { formatJson } from '@/lib/json/formatter';
import {
  CopyIcon,
  CheckIcon,
  ClearIcon,
  SampleIcon,
  UploadIcon,
  LinkIcon,
  FixIcon,
} from '@/components/json/icons';
import { UrlLoaderModal } from '@/components/UrlLoaderModal';

// Sample broken JSON for demonstration
const BROKEN_JSON_SAMPLE = `{
  // This is a comment
  name: "John Doe",
  'age': 30,
  "isActive": True,
  "tags": ["developer", "coffee-lover",],
  "address": {
    "city": 'New York',
    "zip": undefined
  }
}`;

export default function JsonFixerPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capabilities = getFixerCapabilities();

  const handleFix = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter JSON to fix');
      setOutput('');
      setIssues([]);
      return;
    }

    try {
      const result = fixJson(input);

      if (result.success && result.fixed) {
        const formatted = formatJson(JSON.parse(result.fixed), '2');
        setOutput(formatted);
        setIssues(result.issues.map((i) => i.description));
        setError(null);
      } else {
        const errorDesc =
          result.issues.length > 0 ? result.issues[0].description : 'Could not fix JSON';
        setError(errorDesc);
        setOutput('');
        setIssues(result.issues.map((i) => i.description));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fix JSON';
      setError(errorMessage);
      setOutput('');
      setIssues([]);
    }
  }, [input]);

  // Auto-fix on input change
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      setIssues([]);
      return;
    }

    const timer = setTimeout(() => {
      handleFix();
    }, 300);

    return () => clearTimeout(timer);
  }, [input, handleFix]);

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

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    setIssues([]);
    inputRef.current?.focus();
  }, []);

  const loadSample = useCallback(() => {
    setInput(BROKEN_JSON_SAMPLE);
    setError(null);
    setIssues([]);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInput(text);
      setError(null);
    };
    reader.readAsText(file);
  }, []);

  // Check if input needs fixing
  const inputNeedsFix = input.trim() ? needsFix(input) : false;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleFix();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFix, handleClear]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FixIcon />
          <h1 className="text-lg font-semibold text-text-primary">JSON Fixer</h1>
        </div>
        <p className="text-sm text-text-tertiary mt-1">
          Automatically fix common JSON syntax errors and formatting issues
        </p>
      </div>

      {/* Capabilities Info */}
      <div className="px-4 py-3 border-b border-border bg-surface-secondary">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-text-tertiary">Can fix:</span>
          {capabilities.map((cap, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">
              {cap}
            </span>
          ))}
        </div>
      </div>

      {/* Actions Bar */}
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {inputNeedsFix && (
            <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-xs rounded-full">
              Issues detected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors flex items-center gap-2 text-sm"
            title="Upload JSON file"
          >
            <UploadIcon />
            <span className="hidden sm:inline">Upload JSON File</span>
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
          <button
            onClick={handleClear}
            disabled={!input}
            className="px-2 py-1.5 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
            title="Clear (⌘+K)"
          >
            <ClearIcon />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Input Panel */}
        <div className="flex-1 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-border">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Input (Broken JSON)</span>
            <button
              onClick={handleFix}
              disabled={!input.trim()}
              className="px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <FixIcon />
              Fix JSON
            </button>
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="absolute inset-0 w-full h-full resize-none bg-surface text-text-primary font-mono text-sm p-4 focus:outline-none"
              placeholder={`Paste broken JSON here...\n\nExamples of fixable issues:\n- Comments (// or /* */)\n- Single quotes\n- Unquoted keys\n- Trailing commas\n- Python booleans (True/False)\n- undefined values`}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Output (Fixed JSON)</span>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`px-2 py-1.5 text-sm rounded transition-colors flex items-center gap-1.5 ${
                copied
                  ? 'text-green-500'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              } disabled:opacity-50`}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Issues List */}
          {issues.length > 0 && (
            <div className="px-3 py-2 border-b border-border bg-yellow-500/5">
              <div className="text-xs font-medium text-yellow-500 mb-1">
                Fixed {issues.length} issue{issues.length !== 1 ? 's' : ''}:
              </div>
              <ul className="text-xs text-text-secondary space-y-0.5">
                {issues.slice(0, 5).map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-yellow-500">•</span>
                    {issue}
                  </li>
                ))}
                {issues.length > 5 && (
                  <li className="text-text-tertiary">...and {issues.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex-1 relative">
            {error ? (
              <div className="absolute inset-0 p-4">
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-500 text-sm">
                  <p className="font-medium">Could not fix JSON</p>
                  <p className="mt-1 text-red-400">{error}</p>
                </div>
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                className="absolute inset-0 w-full h-full resize-none bg-surface text-text-primary font-mono text-sm p-4 focus:outline-none"
                placeholder="Fixed JSON will appear here..."
              />
            )}
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
